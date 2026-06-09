import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

type SkillReference = {
  id: string;
  title: string;
  path: string;
  description?: string;
};

type SkillIndexItem = {
  name: string;
  title: string;
  description: string;
  skill_path: string;
  triggers?: string[];
  references?: SkillReference[];
};

type Env = {
  SKILLS_RAW_BASE: string;
  MCP_OBJECT: DurableObjectNamespace;
};

let indexCache: {
  rawBase: string;
  cachedAt: number;
  skills: SkillIndexItem[];
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "personal-skills-mcp",
      "Accept": "text/plain, application/json"
    }
  });

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText} for ${url}`);
  }

  return await res.text();
}

function joinRawUrl(base: string, path: string): string {
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
}

async function loadIndex(env: Env): Promise<SkillIndexItem[]> {
  const rawBase = env.SKILLS_RAW_BASE;

  if (indexCache && indexCache.rawBase === rawBase && Date.now() - indexCache.cachedAt < CACHE_TTL_MS) {
    return indexCache.skills;
  }

  const indexText = await fetchText(joinRawUrl(rawBase, "index.json"));
  const parsed = JSON.parse(indexText) as SkillIndexItem[];

  if (!Array.isArray(parsed)) {
    throw new Error("skills/index.json must be a JSON array.");
  }

  const skills = parsed
    .filter((skill) => skill && skill.name && skill.title && skill.description && skill.skill_path)
    .map((skill) => ({
      ...skill,
      triggers: skill.triggers ?? [],
      references: skill.references ?? []
    }));

  indexCache = {
    rawBase,
    cachedAt: Date.now(),
    skills
  };

  return skills;
}

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function findSkillByName(skills: SkillIndexItem[], skillName: string): SkillIndexItem | undefined {
  const wanted = normalizeName(skillName);

  return skills.find((skill) => {
    return normalizeName(skill.name) === wanted || normalizeName(skill.title) === wanted;
  });
}

function scoreSkill(skill: SkillIndexItem, task: string): number {
  const text = task.toLowerCase();
  let score = 0;

  const name = skill.name.toLowerCase();
  const title = skill.title.toLowerCase();
  const description = skill.description.toLowerCase();

  if (text.includes(name)) {
    score += 25;
  }

  if (text.includes(title)) {
    score += 15;
  }

  for (const trigger of skill.triggers ?? []) {
    const t = String(trigger).trim().toLowerCase();
    if (t && text.includes(t)) {
      score += 6;
    }
  }

  for (const word of `${name} ${title} ${description}`.split(/[\s,;:()/_-]+/)) {
    const clean = word.trim().toLowerCase();
    if (clean.length >= 3 && text.includes(clean)) {
      score += 1;
    }
  }

  return score;
}

function formatReferenceList(skill: SkillIndexItem): string {
  const refs = skill.references ?? [];

  if (refs.length === 0) {
    return "No supporting references listed.";
  }

  return refs
    .map((r) => `- ${r.id}: ${r.title} (${r.path})${r.description ? ` — ${r.description}` : ""}`)
    .join("\n");
}

export class PersonalSkillsMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "Personal Skills MCP",
    version: "0.4.0-indexed"
  });

  async init() {
    this.server.registerTool(
      "list_skills",
      {
        title: "List indexed personal skills",
        description:
          "List all reusable personal SKILL.md workflows from the generated skills/index.json manifest. This is lightweight and does not scan every SKILL.md at runtime.",
        annotations: { readOnlyHint: true }
      },
      async () => {
        const skills = await loadIndex(this.env);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  count: skills.length,
                  discovery: "generated_index_json",
                  skills: skills.map((s) => ({
                    name: s.name,
                    title: s.title,
                    description: s.description,
                    skill_path: s.skill_path,
                    triggers: s.triggers ?? [],
                    references: s.references ?? []
                  }))
                },
                null,
                2
              )
            }
          ]
        };
      }
    );

    this.server.registerTool(
      "skill",
      {
        title: "Use the most relevant personal skill",
        description:
          "Use this tool when the user says 'call skill', 'use skill', '调用 skill', '使用 skill', or when the user's task may match one of the user's reusable personal SKILL.md workflows. This tool selects the most relevant skill from the generated index and loads only that SKILL.md.",
        inputSchema: {
          task: z
            .string()
            .describe(
              "The user's current task, question, pasted log, paper-review request, writing request, literature-search request, or other instruction."
            ),
          preferred_skill: z
            .string()
            .optional()
            .describe("Optional: the exact skill name if the user explicitly named one, for example quick-lit."),
          include_references: z
            .boolean()
            .optional()
            .describe("Optional: set true when supporting reference files are likely needed.")
        },
        annotations: { readOnlyHint: true }
      },
      async ({ task, preferred_skill, include_references }) => {
        const skills = await loadIndex(this.env);

        if (skills.length === 0) {
          return {
            content: [
              {
                type: "text",
                text:
                  "# No personal skills found\n\n" +
                  "skills/index.json was loaded, but it contains no valid skill entries."
              }
            ]
          };
        }

        const ranked = skills
          .map((skill) => ({ skill, score: scoreSkill(skill, task) }))
          .sort((a, b) => b.score - a.score);

        let best: { skill: SkillIndexItem; score: number } | undefined;

        if (preferred_skill) {
          const named = findSkillByName(skills, preferred_skill);
          if (named) {
            best = { skill: named, score: 999 };
          }
        }

        if (!best) {
          best = ranked[0];
        }

        if (!best || best.score <= 0) {
          return {
            content: [
              {
                type: "text",
                text:
                  "# No matching personal skill found\n\n" +
                  "No indexed SKILL.md workflow clearly matched the current task.\n\n" +
                  `Current task:\n${task}\n\n` +
                  "Available skills:\n" +
                  skills.map((s) => `- ${s.name}: ${s.title} — ${s.description}`).join("\n") +
                  "\n\nInstruction to assistant: Answer normally without applying a personal skill, unless the user explicitly names one."
              }
            ]
          };
        }

        const skillText = await fetchText(joinRawUrl(this.env.SKILLS_RAW_BASE, best.skill.skill_path));

        let referenceText = "";

        if (include_references && best.skill.references && best.skill.references.length > 0) {
          const refChunks: string[] = [];

          for (const ref of best.skill.references) {
            try {
              const refText = await fetchText(joinRawUrl(this.env.SKILLS_RAW_BASE, ref.path));
              refChunks.push(
                `## Reference: ${ref.title}\n\n` +
                  `ID: ${ref.id}\n` +
                  `Source path: ${ref.path}\n\n` +
                  refText
              );
            } catch (error) {
              refChunks.push(
                `## Reference: ${ref.title}\n\n` +
                  `ID: ${ref.id}\n` +
                  `Source path: ${ref.path}\n\n` +
                  `Failed to fetch this reference: ${String(error)}`
              );
            }
          }

          referenceText = "\n\n--- SUPPORTING REFERENCES ---\n\n" + refChunks.join("\n\n---\n\n");
        }

        const candidateScores = ranked
          .slice(0, 8)
          .map((item) => `- ${item.skill.name}: score=${item.score}`)
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text:
                `# Loaded personal skill: ${best.skill.title}\n\n` +
                `Matched skill: ${best.skill.name}\n` +
                `Match score: ${best.score}\n` +
                `Source path: ${best.skill.skill_path}\n\n` +
                `Candidate scores:\n${candidateScores}\n\n` +
                `Current task:\n${task}\n\n` +
                `Available references:\n${formatReferenceList(best.skill)}\n\n` +
                `--- SKILL.md ---\n\n` +
                skillText +
                referenceText +
                "\n\n--- INSTRUCTION TO ASSISTANT ---\n\n" +
                "Apply this SKILL.md workflow to the user's current task. " +
                "If supporting references are needed but not included, call fetch_reference with the listed reference ID."
            }
          ]
        };
      }
    );

    this.server.registerTool(
      "get_skill",
      {
        title: "Read one indexed SKILL.md workflow by name",
        description:
          "Fetch the full SKILL.md instruction file for one named personal skill from the generated skills/index.json manifest. Use this when the user explicitly names a skill.",
        inputSchema: {
          skill_name: z.string().describe("The skill name, for example quick-lit.")
        },
        annotations: { readOnlyHint: true }
      },
      async ({ skill_name }) => {
        const skills = await loadIndex(this.env);
        const skill = findSkillByName(skills, skill_name);

        if (!skill) {
          return {
            content: [
              {
                type: "text",
                text:
                  `Skill not found: ${skill_name}.\n\n` +
                  `Available skills: ${skills.map((s) => s.name).join(", ") || "none"}`
              }
            ]
          };
        }

        const skillText = await fetchText(joinRawUrl(this.env.SKILLS_RAW_BASE, skill.skill_path));

        return {
          content: [
            {
              type: "text",
              text:
                `# ${skill.title}\n\n` +
                `Name: ${skill.name}\n\n` +
                `Description: ${skill.description}\n\n` +
                `Source path: ${skill.skill_path}\n\n` +
                `Available references:\n${formatReferenceList(skill)}\n\n` +
                `--- SKILL.md ---\n\n` +
                skillText
            }
          ]
        };
      }
    );

    this.server.registerTool(
      "fetch_reference",
      {
        title: "Fetch a reference file for an indexed personal skill",
        description:
          "Fetch a supporting reference file listed in skills/index.json. Use list_skills, skill, or get_skill first to see valid reference IDs.",
        inputSchema: {
          skill_name: z.string().describe("The skill name, for example quick-lit."),
          reference_id: z.string().describe("The reference id listed under that skill.")
        },
        annotations: { readOnlyHint: true }
      },
      async ({ skill_name, reference_id }) => {
        const skills = await loadIndex(this.env);
        const skill = findSkillByName(skills, skill_name);

        if (!skill) {
          return {
            content: [{ type: "text", text: `Skill not found: ${skill_name}.` }]
          };
        }

        const ref = (skill.references ?? []).find((r) => normalizeName(r.id) === normalizeName(reference_id));

        if (!ref) {
          return {
            content: [
              {
                type: "text",
                text:
                  `Reference not found: ${reference_id}.\n\n` +
                  `Valid references for ${skill.name}: ${
                    (skill.references ?? []).map((r) => r.id).join(", ") || "none"
                  }`
              }
            ]
          };
        }

        const refText = await fetchText(joinRawUrl(this.env.SKILLS_RAW_BASE, ref.path));

        return {
          content: [
            {
              type: "text",
              text:
                `# ${ref.title}\n\n` +
                `Skill: ${skill.name}\n` +
                `Reference ID: ${ref.id}\n` +
                `Source path: ${ref.path}\n\n` +
                `--- Reference content ---\n\n` +
                refText
            }
          ]
        };
      }
    );
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/mcp") {
      return PersonalSkillsMCP.serve("/mcp").fetch(request, env, ctx);
    }

    if (url.pathname === "/") {
      return new Response(
        "Personal Skills MCP is running. Use the /mcp endpoint from ChatGPT Developer Mode.",
        {
          headers: { "content-type": "text/plain; charset=utf-8" }
        }
      );
    }

    return new Response("Not found", { status: 404 });
  }
};
