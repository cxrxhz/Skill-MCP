import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

type SkillIndexItem = {
  name: string;
  title: string;
  description: string;
  skill_path: string;
  references?: Array<{
    id: string;
    title: string;
    path: string;
    description?: string;
  }>;
};

type Env = {
  SKILLS_RAW_BASE: string;
  MCP_OBJECT: DurableObjectNamespace;
};

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

export class PersonalSkillsMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "Personal Skills MCP",
    version: "0.1.0"
  });

  async init() {
    this.server.registerTool(
      "list_skills",
      {
        title: "List available personal skills",
        description:
          "List the reusable SKILL.md workflows available in the user's public GitHub skills repository.",
        annotations: { readOnlyHint: true }
      },
      async () => {
        const indexUrl = joinRawUrl(this.env.SKILLS_RAW_BASE, "index.json");
        const text = await fetchText(indexUrl);
        const skills = JSON.parse(text) as SkillIndexItem[];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  count: skills.length,
                  skills: skills.map((s) => ({
                    name: s.name,
                    title: s.title,
                    description: s.description,
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
      "get_skill",
      {
        title: "Read one SKILL.md workflow",
        description:
          "Fetch the full SKILL.md instruction file for one named personal skill from GitHub raw content.",
        inputSchema: {
          skill_name: z.string().describe("The skill name from list_skills, for example paper_review.")
        },
        annotations: { readOnlyHint: true }
      },
      async ({ skill_name }) => {
        const indexUrl = joinRawUrl(this.env.SKILLS_RAW_BASE, "index.json");
        const skills = JSON.parse(await fetchText(indexUrl)) as SkillIndexItem[];
        const skill = skills.find((s) => s.name === skill_name);

        if (!skill) {
          return {
            content: [
              {
                type: "text",
                text: `Skill not found: ${skill_name}. Use list_skills first.`
              }
            ]
          };
        }

        const skillUrl = joinRawUrl(this.env.SKILLS_RAW_BASE, skill.skill_path);
        const skillText = await fetchText(skillUrl);

        return {
          content: [
            {
              type: "text",
              text:
                `# ${skill.title}\n\n` +
                `Name: ${skill.name}\n\n` +
                `Description: ${skill.description}\n\n` +
                `Source path: ${skill.skill_path}\n\n` +
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
        title: "Fetch a reference file for a personal skill",
        description:
          "Fetch a supporting reference file listed in a skill's index entry. Use list_skills first to see valid reference IDs.",
        inputSchema: {
          skill_name: z.string().describe("The skill name from list_skills."),
          reference_id: z.string().describe("The reference id listed under that skill.")
        },
        annotations: { readOnlyHint: true }
      },
      async ({ skill_name, reference_id }) => {
        const indexUrl = joinRawUrl(this.env.SKILLS_RAW_BASE, "index.json");
        const skills = JSON.parse(await fetchText(indexUrl)) as SkillIndexItem[];
        const skill = skills.find((s) => s.name === skill_name);

        if (!skill) {
          return {
            content: [{ type: "text", text: `Skill not found: ${skill_name}.` }]
          };
        }

        const ref = (skill.references ?? []).find((r) => r.id === reference_id);

        if (!ref) {
          return {
            content: [
              {
                type: "text",
                text:
                  `Reference not found: ${reference_id}. ` +
                  `Valid references: ${(skill.references ?? []).map((r) => r.id).join(", ") || "none"}`
              }
            ]
          };
        }

        const refUrl = joinRawUrl(this.env.SKILLS_RAW_BASE, ref.path);
        const refText = await fetchText(refUrl);

        return {
          content: [
            {
              type: "text",
              text:
                `# ${ref.title}\n\n` +
                `Skill: ${skill.name}\n` +
                `Reference ID: ${ref.id}\n` +
                `Description: ${ref.description ?? ""}\n` +
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
