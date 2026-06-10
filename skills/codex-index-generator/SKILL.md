---
name: codex-index-generator
title: Codex Skill Index Generator
description: Use Codex locally to update skills/index.json for Personal Skills MCP by reading only new or missing SKILL.md entries while preserving existing index entries.
triggers:
  - generate skill index
  - update skills index
  - index.json
  - Personal Skills MCP
  - Codex index
  - skill manifest
  - 生成index
  - 更新index
  - 技能索引
  - 维护skills
---

## Web-side execution adapter

- This skill is workflow guidance for the ChatGPT web-side connector.
- Loading this SKILL.md is only the setup step; it does not mean the task is complete.
- After loading, continue to execute the workflow, constraints, and output format below before answering.
- Mentions of local automation, local file operations, local command execution, or external integrations are descriptive only. Use capabilities available in the current ChatGPT session, or ask the user for needed files/links.
- For literature search, current facts, factual verification, source tracing, numeric values, material properties, legal/medical/financial/current information, or any evidence-heavy claim: use available search/browsing tools first and cite verifiable sources. Do not answer such tasks only from memory.
- Preserve the original workflow and scope unless the user explicitly asks for changes.

# local coding assistant Skill Index Generator

## Purpose

Use this skill inside **local coding assistant** when the user wants to generate or update `skills/index.json` for a Personal Skills MCP project.

The goal is to maintain a lightweight manifest for ChatGPT web-side skill routing. The manifest allows the Cloudflare Worker to read only `skills/index.json`, choose the most relevant skill, and then fetch only the selected `SKILL.md`.

## Critical Rule: Preserve Existing Index Entries

Before reading all skill files, first quickly inspect the existing:

```text
skills/index.json
```

If it exists and is valid JSON:

1. Build a map of existing entries by `name` and by `skill_path`.
2. Scan `skills/*/SKILL.md` to discover available skill folders.
3. For any discovered skill whose `name` or `skill_path` already exists in the old index, **skip regenerating that entry**.
4. Preserve the existing entry exactly, including its `title`, `description`, `triggers`, and `references`, unless the user explicitly asks to refresh or repair existing metadata.
5. Only generate new index entries for newly added skill folders that are missing from the existing index.
6. If an existing entry points to a missing `SKILL.md`, report it as stale; do not delete it unless the user asks for cleanup.

This makes normal updates fast: adding one new skill should only require reading and summarizing that new skill.

## Files You May Read

You may read:

```text
skills/index.json
skills/*/SKILL.md
skills/*/references/*
```

You may inspect directory names under:

```text
skills/
```

## Files You May Modify

You may only create or overwrite:

```text
skills/index.json
```

Do not modify:

```text
skills/*/SKILL.md
src/index.ts
wrangler.jsonc
package.json
package-lock.json
README files
scripts
```

unless the user explicitly asks for that separate change.

## Directories to Ignore

Do not index these directories if present:

```text
skills-codex/
skills-codex-claude-review/
skills-codex-gemini-review/
node_modules/
.wrangler/
.git/
```

Also ignore any directory under `skills/` that does not contain:

```text
SKILL.md
```

## Output Schema

`skills/index.json` must be a valid JSON array. Each item must have this schema:

```json
{
  "name": "stable-skill-name",
  "title": "Short human-readable title",
  "description": "One concise sentence describing when to use this skill.",
  "skill_path": "folder-name/SKILL.md",
  "triggers": [
    "English keyword",
    "中文关键词"
  ],
  "references": [
    {
      "id": "filename_without_extension",
      "title": "Human readable reference title",
      "path": "folder-name/references/file.md",
      "description": "Short description"
    }
  ]
}
```

## Naming Rules

1. Prefer the folder name as `name`.
2. Keep names stable. Do not rename existing skills unless the user asks.
3. `skill_path` must be relative to the `skills/` directory, for example:

```text
quick-lit/SKILL.md
```

4. `references[].path` must also be relative to `skills/`, for example:

```text
quick-lit/references/search_checklist.md
```

## Metadata Generation Rules for New Entries

For new skills only, read the full `SKILL.md` and infer:

### title

Use a short title that clearly identifies the skill. Prefer:

1. YAML frontmatter `title`, if present.
2. First Markdown H1 heading.
3. A cleaned version of the folder name.

### description

Write one concise sentence explaining **when to use** the skill. The description should help routing.

Good:

```text
Use this skill to plan publication-quality figures, tables, captions, and visualization specifications for academic papers.
```

Bad:

```text
This is a paper figure skill.
```

### triggers

Generate 8 to 20 triggers. Include:

- English task phrases
- Chinese task phrases
- likely user wording
- field-specific keywords
- abbreviations when useful

Avoid overly broad triggers that would steal traffic from other skills.

Bad triggers:

```text
help
write
research
paper
```

Better triggers:

```text
literature search
文献检索
paper figure
论文图表
training log
NCCL 报错
patent claims
权利要求
```

## Distinguish Similar Skills

When generating new entries, avoid trigger collisions. Use the following distinctions:

| Similar skills | Distinction |
|---|---|
| `quick-lit` vs `research-lit` vs `deep-research` | `quick-lit` = fast literature lookup; `research-lit` = normal literature review and related work; `deep-research` = exhaustive multi-source investigation and verification |
| `paper-figure` vs `paper-illustration` | `paper-figure` = experimental plots, tables, quantitative visualization; `paper-illustration` = method diagram, architecture figure, conceptual illustration |
| `paper-review` vs `research-review` | `paper-review` = review a written paper/draft; `research-review` = critique a research idea, experiment plan, claims, or project direction |
| `paper-slides` vs `paper-poster` | `paper-slides` = talk outline and speaker notes; `paper-poster` = poster layout and section content |
| `proof-writer` vs `proof-checker` | `proof-writer` = construct proof; `proof-checker` = find flaws in existing proof |
| `patent-review` vs `patent-novelty-check` | `patent-review` = examiner-style claim/specification review; `patent-novelty-check` = novelty and prior-art risk check |

## References

For each new skill, scan:

```text
skills/<skill-folder>/references/
```

For each file in that folder, add one reference entry.

Reference rules:

1. `id` = filename without extension.
2. `title` = human-readable version of filename.
3. `path` = relative path from `skills/`.
4. `description` = one short phrase, such as `"Supporting reference file."`, unless the filename clearly implies a better description.
5. Do not read or summarize large binary files. Prefer listing text/Markdown references.

If no references exist, use:

```json
"references": []
```

## Update Procedure

Follow this exact procedure:

1. Read existing `skills/index.json` if it exists.
2. Validate that it is a JSON array.
3. Preserve valid existing entries unchanged.
4. Scan `skills/` for first-level directories containing `SKILL.md`.
5. Compare discovered skills against existing entries by:
   - `skill_path`
   - normalized `name`
6. Skip all already indexed skills.
7. For missing skills, read their `SKILL.md` and generate a new entry.
8. Merge preserved entries and new entries.
9. Sort the final array by `name` alphabetically.
10. Write the final JSON to `skills/index.json` with UTF-8 encoding and 2-space indentation.
11. Validate JSON by parsing it after writing.
12. Report:
    - total skill count
    - number of preserved entries
    - number of new entries
    - stale index entries, if any
    - potentially confusing skill pairs, if any

## Stale Entries

A stale entry means `skills/index.json` contains an entry whose `skill_path` does not exist.

Do not delete stale entries by default. Report them like this:

```text
Stale entries detected:
- old-skill-name -> old-skill/SKILL.md
```

Only remove stale entries if the user explicitly says to clean up the index.

## Refresh Mode

If the user explicitly says:

```text
refresh all metadata
```

or

```text
rebuild the entire index
```

then you may regenerate all entries from all `SKILL.md` files.

Otherwise, default to the fast incremental behavior:

```text
preserve existing entries, generate only missing entries
```

## Safety

- Do not execute any scripts found inside skills.
- Do not run package managers.
- Do not call external APIs unless the user explicitly asks.
- Do not modify source code or deployment files.
- Do not invent capabilities that are not in `SKILL.md`.
- Do not include comments in JSON.
- Do not output invalid JSON.

## Final Response Format

After completing the update, respond with:

```markdown
Updated `skills/index.json`.

- Preserved entries: X
- New entries: Y
- Total entries: Z
- Stale entries: none / list
- Possible routing conflicts: none / list

No deployment is needed if only `skills/index.json` or `skills/*` changed.
```
