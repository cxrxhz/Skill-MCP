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
  return skills.find((skill) => normalizeName(skill.name) === wanted || normalizeName(skill.title) === wanted);
}

function formatReferenceList(skill: SkillIndexItem): string {
  const refs = skill.references ?? [];
  if (refs.length === 0) {
    return "No supporting references listed.";
  }
  return refs.map((r) => `- ${r.id}: ${r.title} (${r.path})${r.description ? ` — ${r.description}` : ""}`).join("\n");
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    const clean = value.trim().toLowerCase();
    if (!clean || seen.has(clean)) {
      continue;
    }
    seen.add(clean);
    out.push(clean);
  }

  return out;
}

function extractChineseSpans(text: string): string[] {
  return text.match(/[\u4e00-\u9fa5]{2,}/g) ?? [];
}

function generateChineseNgrams(span: string): string[] {
  const out: string[] = [];

  for (const n of [2, 3, 4]) {
    if (span.length < n) {
      continue;
    }

    for (let i = 0; i <= span.length - n; i += 1) {
      out.push(span.slice(i, i + n));
    }
  }

  return out;
}

function generateFallbackQueryTerms(task: string): string[] {
  const text = task.toLowerCase();
  const terms: string[] = [];

  terms.push(text);

  for (const token of text.match(/[a-z][a-z0-9.+#-]{1,}/gi) ?? []) {
    if (token.length >= 2) {
      terms.push(token);
    }
  }

  for (const span of extractChineseSpans(task)) {
    terms.push(span);
    terms.push(...generateChineseNgrams(span));
  }

  return uniqueStrings(terms).slice(0, 80);
}

function buildQueryTerms(task: string, queryTerms?: string[]): string[] {
  const modelTerms = (queryTerms ?? [])
    .flatMap((term) => String(term).split(/[,，;；\n\r\t]+/))
    .map((term) => term.trim())
    .filter(Boolean);

  const fallbackTerms = generateFallbackQueryTerms(task);
  return uniqueStrings([...modelTerms, ...fallbackTerms]).slice(0, 120);
}

function skillSearchText(skill: SkillIndexItem): string {
  return [skill.name, skill.title, skill.description, ...(skill.triggers ?? [])].join(" ").toLowerCase();
}

function scoreOneSkill(skill: SkillIndexItem, task: string, terms: string[]) {
  const haystack = skillSearchText(skill);
  const taskLower = task.toLowerCase();
  const matchedTerms: string[] = [];
  let score = 0;

  if (taskLower.includes(skill.name.toLowerCase())) {
    score += 80;
    matchedTerms.push(skill.name);
  }

  if (taskLower.includes(skill.title.toLowerCase())) {
    score += 35;
    matchedTerms.push(skill.title);
  }

  for (const rawTerm of terms) {
    const term = rawTerm.trim().toLowerCase();
    if (!term) {
      continue;
    }

    if (/^[\u4e00-\u9fa5]$/.test(term)) {
      continue;
    }

    if (haystack.includes(term)) {
      const weight =
        term.length >= 8 ? 12 :
        term.length >= 4 ? 8 :
        term.length >= 2 ? 4 :
        1;

      score += weight;
      matchedTerms.push(term);
      continue;
    }

    const parts = term
      .split(/[\s/_\-]+/)
      .map((x) => x.trim())
      .filter((x) => x.length >= 3);

    let partHits = 0;
    for (const part of parts) {
      if (haystack.includes(part)) {
        partHits += 1;
      }
    }

    if (parts.length >= 2 && partHits >= 2) {
      score += partHits * 3;
      matchedTerms.push(term);
    }
  }

  if (score > 0 && (skill.references ?? []).length > 0) {
    score += 1;
  }

  return {
    skill,
    score,
    matched_terms: uniqueStrings(matchedTerms).slice(0, 20)
  };
}

function getTopCandidates(skills: SkillIndexItem[], task: string, queryTerms?: string[], topK?: number) {
  const terms = buildQueryTerms(task, queryTerms);
  const k = Math.max(1, Math.min(topK ?? 5, 10));

  const ranked = skills
    .map((skill) => scoreOneSkill(skill, task, terms))
    .sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name));

  return {
    terms,
    candidates: ranked.slice(0, k),
    zeroScore: ranked.length > 0 && ranked[0].score <= 0
  };
}


export class PersonalSkillsMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "Personal Skills MCP",
    version: "0.5.0-topk-router"
  });

  async init() {
    this.server.registerTool(
      "list_skills",
      {
        title: "List indexed personal skills",
        description:
          "List all reusable personal SKILL.md workflows from skills/index.json. This is mainly for debugging or browsing the full skill catalog.",
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
        title: "Search personal skills and return top candidates",
        description:
          "Use this tool before answering when the user asks to use skill/调用 skill, or when the task may match a personal SKILL.md workflow. IMPORTANT: Before calling this tool, rewrite the user's task into concise bilingual search terms yourself and pass them in query_terms. Include synonyms, reversed Chinese word orders, likely user wording, domain terms, and English equivalents. This tool returns only the top candidate skills, not the full SKILL.md. After it returns, you must choose the best candidate semantically and then call get_skill(skill_name=...) before answering the user.",
        inputSchema: {
          task: z
            .string()
            .describe("The user's original task or question. Preserve the full user intent here."),
          query_terms: z
            .array(z.string())
            .optional()
            .describe(
              "Search terms generated by the model from the task before calling this tool. Include Chinese and English terms, synonyms, reversed word order variants, domain phrases, abbreviations, and likely skill-category words. Example for '检索文献，查 Cr2Te3 转变温度': ['检索', '文献', '检索文献', '文献检索', '查论文', '材料物性', '转变温度', '居里温度', '磁相变', 'literature search', 'material property', 'transition temperature', 'Curie temperature']."
            ),
          top_k: z
            .number()
            .optional()
            .describe("Number of candidate skills to return. Default 5. Use 3-5 for normal routing.")
        },
        annotations: { readOnlyHint: true }
      },
      async ({ task, query_terms, top_k }) => {
        const skills = await loadIndex(this.env);
        const { terms, candidates, zeroScore } = getTopCandidates(skills, task, query_terms, top_k);

        const compactCandidates = candidates.map((item, idx) => ({
          rank: idx + 1,
          name: item.skill.name,
          title: item.skill.title,
          description: item.skill.description,
          score: item.score,
          matched_terms: item.matched_terms,
          references: (item.skill.references ?? []).map((r) => ({
            id: r.id,
            title: r.title
          }))
        }));

        return {
          content: [
            {
              type: "text",
              text:
                `# Personal skill routing candidates\n\n` +
                `Current task:\n${task}\n\n` +
                `Model-generated query terms used for retrieval:\n` +
                terms.map((t) => `- ${t}`).join("\n") +
                `\n\nTop candidate skills:\n` +
                JSON.stringify(compactCandidates, null, 2) +
                `\n\nRouting status: ${zeroScore ? "weak_or_no_lexical_match" : "candidates_found"}\n\n` +
                `--- INSTRUCTION TO ASSISTANT ---\n\n` +
                `Do not answer the user's task yet. ` +
                `First, choose the best skill semantically from the candidate list above. ` +
                `If a candidate clearly matches, call get_skill with that candidate's exact name. ` +
                `If multiple candidates are plausible, prefer the one whose description best matches the user's immediate task, not the broadest one. ` +
                `Only after get_skill returns the full SKILL.md should you answer the user. ` +
                `If no candidate is semantically relevant, answer normally and briefly say no suitable personal skill was found.`
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
          "Fetch the full SKILL.md instruction file for one named personal skill from skills/index.json. Use this after the skill tool returns candidates and you choose the best skill, or when the user explicitly names a skill.",
        inputSchema: {
          skill_name: z.string().describe("The exact skill name, for example quick-lit.")
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
