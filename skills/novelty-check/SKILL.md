---
name: novelty-check
description: Verify research idea novelty against recent literature. Use when user says "查新", "novelty check", "有没有人做过", "check novelty", or wants to verify a research idea is novel before implementing.
argument-hint: [method-or-idea-description]
---

## Web-side execution adapter

- This skill is workflow guidance for the ChatGPT web-side connector.
- Loading this SKILL.md is only the setup step; it does not mean the task is complete.
- After loading, continue to execute the workflow, constraints, and output format below before answering.
- Mentions of local automation, local file operations, local command execution, or external integrations are descriptive only. Use capabilities available in the current ChatGPT session, or ask the user for needed files/links.
- For literature search, current facts, factual verification, source tracing, numeric values, material properties, legal/medical/financial/current information, or any evidence-heavy claim: use available search/browsing tools first and cite verifiable sources. Do not answer such tasks only from memory.
- Preserve the original workflow and scope unless the user explicitly asks for changes.

# Novelty Check Skill

Check whether a proposed method/idea has already been done in the literature: **$ARGUMENTS**

## Constants

- REVIEWER_MODEL = `gpt-5.4` — Model used via local coding-assistant integration. Must be an OpenAI model (e.g., `gpt-5.4`, `o3`, `gpt-4o`)

## Instructions

Given a method description, systematically verify its novelty:

### Phase A: Extract Key Claims
1. Read the user's method description
2. Identify 3-5 core technical claims that would need to be novel:
   - What is the method?
   - What problem does it solve?
   - What is the mechanism?
   - What makes it different from obvious baselines?

### Phase B: Multi-Source Literature Search
For EACH core claim, search using ALL available sources:

1. **Web Search** (via `web search capability`):
   - Search arXiv, Google Scholar, Semantic Scholar
   - Use specific technical terms from the claim
   - Try at least 3 different query formulations per claim
   - Include year filters for 2024-2026

2. **Known paper databases**: Check against:
   - ICLR 2025/2026, NeurIPS 2025, ICML 2025/2026
   - Recent arXiv preprints (2025-2026)

3. **Read abstracts**: For each potentially overlapping paper, web page retrieval capability its abstract and related work section

### Phase C: Cross-Model Verification
Call REVIEWER_MODEL via local coding-assistant integration (`local coding assistant integration`) with xhigh reasoning:
```
config: {"model_reasoning_effort": "xhigh"}
```
Prompt should include:
- The proposed method description
- All papers found in Phase B
- Ask: "Is this method novel? What is the closest prior work? What is the delta?"

### Phase D: Novelty Report
Output a structured report:

```markdown
## Novelty Check Report

### Proposed Method
[1-2 sentence description]

### Core Claims
1. [Claim 1] — Novelty: HIGH/MEDIUM/LOW — Closest: [paper]
2. [Claim 2] — Novelty: HIGH/MEDIUM/LOW — Closest: [paper]
...

### Closest Prior Work
| Paper | Year | Venue | Overlap | Key Difference |
|-------|------|-------|---------|----------------|

### Overall Novelty Assessment
- Score: X/10
- Recommendation: PROCEED / PROCEED WITH CAUTION / ABANDON
- Key differentiator: [what makes this unique, if anything]
- Risk: [what a reviewer would cite as prior work]

### Suggested Positioning
[How to frame the contribution to maximize novelty perception]
```

### Important Rules
- Be BRUTALLY honest — false novelty claims waste months of research time
- "Applying X to Y" is NOT novel unless the application reveals surprising insights
- Check both the method AND the experimental setting for novelty
- If the method is not novel but the FINDING would be, say so explicitly
- Always check the most recent 6 months of arXiv — the field moves fast
