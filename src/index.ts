import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

type GitHubContentItem = {
  name: string;
  path: string;
  type: "file" | "dir" | string;
};

type SkillReference = {
  id: string;
  title: string;
  path: string;
  description?: string;
};

type DiscoveredSkill = {
  name: string;
  title: string;
  description: string;
  skill_path: string;
  triggers: string[];
  references: SkillReference[];
  skill_text: string;
};

type Env = {
  SKILLS_RAW_BASE: string;
  MCP_OBJECT: DurableObjectNamespace;
};

type RawBaseInfo = {
  owner: string;
  repo: string;
  branch: string;
  skillsPath: string;
};

let skillCache: {
  rawBase: string;
  cachedAt: number;
  skills: DiscoveredSkill[];
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

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "personal-skills-mcp",
      "Accept": "application/vnd.github+json"
    }
  });

  if (!res.ok) {
    throw new Error(`GitHub API fetch failed: ${res.status} ${res.statusText} for ${url}`);
  }

  return (await res.json()) as T;
}

async function fetchJsonOrNull<T>(url: string): Promise<T | null> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "personal-skills-mcp",
      "Accept": "application/vnd.github+json"
    }
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`GitHub API fetch failed: ${res.status} ${res.statusText} for ${url}`);
  }

  return (await res.json()) as T;
}

function joinRawUrl(base: string, path: string): string {
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
}

function parseRawBase(rawBase: string): RawBaseInfo {
  const url = new URL(rawBase);
  const parts = url.pathname.split("/").filter(Boolean);

  if (url.hostname !== "raw.githubusercontent.com" || parts.length < 4) {
    throw new Error(
      "SKILLS_RAW_BASE must look like: https://raw.githubusercontent.com/OWNER/REPO/BRANCH/skills"
    );
  }

  const [owner, repo, branch, ...pathParts] = parts;
  const skillsPath = pathParts.join("/");

  if (!skillsPath) {
    throw new Error("SKILLS_RAW_BASE must point to the skills directory.");
  }

  return { owner, repo, branch, skillsPath };
}

function githubContentsUrl(info: RawBaseInfo, relativePath = ""): string {
  const fullPath = [info.skillsPath, relativePath].filter(Boolean).join("/");
  return (
    `https://api.github.com/repos/${encodeURIComponent(info.owner)}` +
    `/${encodeURIComponent(info.repo)}/contents/${fullPath}?ref=${encodeURIComponent(info.branch)}`
  );
}

function prettyTitleFromName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function parseFrontMatter(text: string): Record<string, string | string[]> {
  const normalized = text.replace(/\r\n/g, "\n");

  if (!normalized.startsWith("---\n")) {
    return {};
  }

  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    return {};
  }

  const raw = normalized.slice(4, end);
  const meta: Record<string, string | string[]> = {};
  const lines = raw.split("\n");
  let currentListKey: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const listItem = line.match(/^-\s+(.+)$/);
    if (listItem && currentListKey) {
      const arr = Array.isArray(meta[currentListKey]) ? (meta[currentListKey] as string[]) : [];
      arr.push(stripQuotes(listItem[1].trim()));
      meta[currentListKey] = arr;
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      continue;
    }

    const key = match[1];
    const value = match[2].trim();
    currentListKey = null;

    if (!value) {
      meta[key] = [];
      currentListKey = key;
    } else if (value.startsWith("[") && value.endsWith("]")) {
      meta[key] = value
        .slice(1, -1)
        .split(",")
        .map((v) => stripQuotes(v.trim()))
        .filter(Boolean);
    } else {
      meta[key] = stripQuotes(value);
    }
  }

  return meta;
}

function stripQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, "");
}

function firstString(meta: Record<string, string | string[]>, key: string): string | undefined {
  const value = meta[key];
  return typeof value === "string" ? value : undefined;
}

function stringList(meta: Record<string, string | string[]>, key: string): string[] {
  const value = meta[key];

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}

function deriveTitle(skillName: string, skillText: string, meta: Record<string, string | string[]>): string {
  const title = firstString(meta, "title");
  if (title) {
    return title;
  }

  const h1 = skillText.match(/^#\s+(.+)$/m);
  if (h1) {
    return h1[1].trim();
  }

  return prettyTitleFromName(skillName);
}

function deriveDescription(skillText: string, meta: Record<string, string | string[]>): string {
  const description = firstString(meta, "description");
  if (description) {
    return description;
  }

  const purposeMatch = skillText.match(/##\s+Purpose\s*\n+([\s\S]*?)(?:\n##\s+|\n#\s+|$)/i);
  if (purposeMatch) {
    const purpose = purposeMatch[1]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("-"))
      .join(" ")
      .trim();

    if (purpose) {
      return purpose.slice(0, 300);
    }
  }

  const firstParagraph = skillText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("---"))
    .join(" ")
    .trim();

  return firstParagraph.slice(0, 300) || "Reusable personal SKILL.md workflow.";
}

function fallbackTriggers(skillName: string, title: string, description: string, skillText: string): string[] {
  const base = `${skillName} ${title} ${description} ${skillText.slice(0, 2000)}`.toLowerCase();
  const triggers = new Set<string>();

  for (const token of `${skillName} ${title} ${description}`.split(/[\s,;:()/_-]+/)) {
    const clean = token.trim().toLowerCase();
    if (clean.length >= 3) {
      triggers.add(clean);
    }
  }

  // Useful bilingual fallback rules for the starter skills and similar workflows.
  if (base.includes("paper") || base.includes("review") || base.includes("academic")) {
    for (const t of ["paper", "review", "academic", "论文", "审稿", "文献", "实验", "消融", "baseline"]) {
      triggers.add(t);
    }
  }

  if (base.includes("debug") || base.includes("log") || base.includes("training")) {
    for (const t of ["debug", "log", "training", "traceback", "error", "报错", "错误", "日志", "训练", "环境"]) {
      triggers.add(t);
    }
  }

  if (base.includes("polish") || base.includes("writing") || base.includes("grammar")) {
    for (const t of ["polish", "writing", "grammar", "润色", "改写", "学术写作"]) {
      triggers.add(t);
    }
  }

  return [...triggers];
}

async function discoverReferences(info: RawBaseInfo, skillName: string): Promise<SkillReference[]> {
  const url = githubContentsUrl(info, `${skillName}/references`);
  const items = await fetchJsonOrNull<GitHubContentItem[]>(url);

  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item.type === "file")
    .map((item) => ({
      id: item.name.replace(/\.[^.]+$/, ""),
      title: prettyTitleFromName(item.name),
      path: `${skillName}/references/${item.name}`,
      description: "Automatically discovered reference file."
    }));
}

async function discoverSkills(env: Env): Promise<DiscoveredSkill[]> {
  const rawBase = env.SKILLS_RAW_BASE;

  if (skillCache && skillCache.rawBase === rawBase && Date.now() - skillCache.cachedAt < CACHE_TTL_MS) {
    return skillCache.skills;
  }

  const info = parseRawBase(rawBase);
  const rootItems = await fetchJson<GitHubContentItem[]>(githubContentsUrl(info));

  if (!Array.isArray(rootItems)) {
    throw new Error("GitHub contents API did not return a directory listing for skills root.");
  }

  const skills: DiscoveredSkill[] = [];

  for (const item of rootItems.filter((x) => x.type === "dir")) {
    const skillName = item.name;
    const skillPath = `${skillName}/SKILL.md`;
    const skillUrl = joinRawUrl(rawBase, skillPath);

    let skillText: string;

    try {
      skillText = await fetchText(skillUrl);
    } catch {
      // Directory without SKILL.md is ignored.
      continue;
    }

    const meta = parseFrontMatter(skillText);
    const declaredName = firstString(meta, "name") || skillName;
    const title = deriveTitle(declaredName, skillText, meta);
    const description = deriveDescription(skillText, meta);
    const metaTriggers = stringList(meta, "triggers");
    const triggers =
      metaTriggers.length > 0
        ? metaTriggers
        : fallbackTriggers(declaredName, title, description, skillText);

    const references = await discoverReferences(info, skillName);

    skills.push({
      name: declaredName,
      title,
      description,
      skill_path: skillPath,
      triggers,
      references,
      skill_text: skillText
    });
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));

  skillCache = {
    rawBase,
    cachedAt: Date.now(),
    skills
  };

  return skills;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "_").replace(/^_+|_+$/g, "");
}

function scoreSkill(skill: DiscoveredSkill, task: string): number {
  const text = task.toLowerCase();
  let score = 0;

  const name = skill.name.toLowerCase();
  const title = skill.title.toLowerCase();
  const description = skill.description.toLowerCase();

  if (text.includes(name)) {
    score += 20;
  }

  if (text.includes(title)) {
    score += 10;
  }

  for (const trigger of skill.triggers) {
    const t = trigger.toLowerCase();
    if (t && text.includes(t)) {
      score += 5;
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

function findSkillByName(skills: DiscoveredSkill[], skillName: string): DiscoveredSkill | undefined {
  const wanted = normalizeName(skillName);

  return skills.find((skill) => normalizeName(skill.name) === wanted || normalizeName(skill.title) === wanted);
}

export class PersonalSkillsMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "Personal Skills MCP",
    version: "0.3.0"
  });

  async init() {
    this.server.registerTool(
      "list_skills",
      {
        title: "List automatically discovered personal skills",
        description:
          "List all reusable personal SKILL.md workflows automatically discovered from GitHub skills/*/SKILL.md directories.",
        annotations: { readOnlyHint: true }
      },
      async () => {
        const skills = await discoverSkills(this.env);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  count: skills.length,
                  discovery: "auto_scan_github_skills_directory",
                  skills: skills.map((s) => ({
                    name: s.name,
                    title: s.title,
                    description: s.description,
                    skill_path: s.skill_path,
                    triggers: s.triggers,
                    references: s.references
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
          "Use this tool when the user says 'call skill', 'use skill', '调用 skill', '使用 skill', or when the user's task may match one of the user's reusable personal SKILL.md workflows. This tool automatically scans GitHub skills/*/SKILL.md, selects the most relevant skill, and loads its workflow instructions.",
        inputSchema: {
          task: z
            .string()
            .describe(
              "The user's current task, question, pasted log, paper-review request, writing request, or other instruction."
            ),
          preferred_skill: z
            .string()
            .optional()
            .describe("Optional: the exact skill name if the user explicitly named one, for example paper_review."),
          include_references: z
            .boolean()
            .optional()
            .describe("Optional: set true when supporting reference files are likely needed.")
        },
        annotations: { readOnlyHint: true }
      },
      async ({ task, preferred_skill, include_references }) => {
        const skills = await discoverSkills(this.env);

        if (skills.length === 0) {
          return {
            content: [
              {
                type: "text",
                text:
                  "# No personal skills found\n\n" +
                  "No directories containing SKILL.md were discovered under the configured GitHub skills directory."
              }
            ]
          };
        }

        let best: { skill: DiscoveredSkill; score: number } | undefined;

        if (preferred_skill) {
          const named = findSkillByName(skills, preferred_skill);
          if (named) {
            best = { skill: named, score: 999 };
          }
        }

        const ranked = skills
          .map((skill) => ({ skill, score: scoreSkill(skill, task) }))
          .sort((a, b) => b.score - a.score);

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
                  "No SKILL.md workflow clearly matched the current task.\n\n" +
                  `Current task:\n${task}\n\n` +
                  "Available skills:\n" +
                  skills.map((s) => `- ${s.name}: ${s.title} — ${s.description}`).join("\n") +
                  "\n\nInstruction to assistant: Answer normally without applying a personal skill, unless the user explicitly names one."
              }
            ]
          };
        }

        let referenceText = "";

        if (include_references && best.skill.references.length > 0) {
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

        const referenceList =
          best.skill.references.length > 0
            ? best.skill.references
                .map((r) => `- ${r.id}: ${r.title} (${r.path})${r.description ? ` — ${r.description}` : ""}`)
                .join("\n")
            : "No supporting references discovered.";

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
                `Available references:\n${referenceList}\n\n` +
                `--- SKILL.md ---\n\n` +
                best.skill.skill_text +
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
        title: "Read one automatically discovered SKILL.md workflow by name",
        description:
          "Fetch the full SKILL.md instruction file for one named personal skill discovered from GitHub skills/*/SKILL.md. Use this when the user explicitly names a skill.",
        inputSchema: {
          skill_name: z.string().describe("The skill name, for example paper_review.")
        },
        annotations: { readOnlyHint: true }
      },
      async ({ skill_name }) => {
        const skills = await discoverSkills(this.env);
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

        return {
          content: [
            {
              type: "text",
              text:
                `# ${skill.title}\n\n` +
                `Name: ${skill.name}\n\n` +
                `Description: ${skill.description}\n\n` +
                `Source path: ${skill.skill_path}\n\n` +
                `Available references:\n${
                  skill.references.length > 0
                    ? skill.references.map((r) => `- ${r.id}: ${r.title} (${r.path})`).join("\n")
                    : "No supporting references discovered."
                }\n\n` +
                `--- SKILL.md ---\n\n` +
                skill.skill_text
            }
          ]
        };
      }
    );

    this.server.registerTool(
      "fetch_reference",
      {
        title: "Fetch an automatically discovered reference file for a personal skill",
        description:
          "Fetch a supporting reference file from a skill's references/ directory. Use list_skills or skill first to see valid reference IDs.",
        inputSchema: {
          skill_name: z.string().describe("The skill name, for example paper_review."),
          reference_id: z.string().describe("The reference id, usually the filename without extension.")
        },
        annotations: { readOnlyHint: true }
      },
      async ({ skill_name, reference_id }) => {
        const skills = await discoverSkills(this.env);
        const skill = findSkillByName(skills, skill_name);

        if (!skill) {
          return {
            content: [{ type: "text", text: `Skill not found: ${skill_name}.` }]
          };
        }

        const ref = skill.references.find((r) => normalizeName(r.id) === normalizeName(reference_id));

        if (!ref) {
          return {
            content: [
              {
                type: "text",
                text:
                  `Reference not found: ${reference_id}.\n\n` +
                  `Valid references for ${skill.name}: ${
                    skill.references.map((r) => r.id).join(", ") || "none"
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
