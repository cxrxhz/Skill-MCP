---
name: patent-review
title: Web-Safe Patent Review
description: Simulate a patent examiner-style review of claims, specification, embodiments, figures, and prior-art risks without relying on Codex MCP or local patent files.
triggers:
  - patent review
  - examiner review
  - office action
  - patent examiner
  - claims review
  - 专利审查
  - 审查意见
  - 权利要求审查
  - 新颖性
  - 创造性
  - 说明书
---

# Web-Safe Patent Review

## Purpose

Use this skill when the user wants a patent examiner-style review of patent claims, specification text, embodiments, figure descriptions, prior-art risks, clarity, enablement, or claim support.

This web-safe version does **not** call Codex MCP, read local patent directories, search proprietary databases, or issue legal advice. It provides a structured drafting and review aid based on the material the user provides. For legal filing decisions, the user should consult a qualified patent professional.

## Operating Rules

1. Do not present the output as legal advice or a formal patentability opinion.
2. Base the review on user-provided claims, specification, embodiments, figures, and cited prior art.
3. If prior art is not provided and no web search is performed, mark novelty/inventive-step conclusions as provisional.
4. Separate claim-language issues from patentability issues.
5. Identify exact claim terms that are unclear, unsupported, overly broad, or potentially anticipated.
6. Suggest amendments carefully; do not narrow claims unnecessarily without explaining the tradeoff.

## Review Scope

Assess the following areas:

- claim clarity and definiteness
- antecedent basis
- support in the specification
- enablement / sufficient disclosure
- written description
- unity / single inventive concept
- novelty risk
- inventive step / obviousness risk
- claim scope strategy
- dependent claim fallback positions
- figure and reference numeral consistency

## Jurisdiction Modes

If the user names a jurisdiction, adapt terminology:

- **US**: §101, §102, §103, §112
- **EPO**: novelty, inventive step, clarity, sufficiency
- **CNIPA**: novelty, inventiveness, practical applicability, sufficient disclosure
- **General**: use jurisdiction-neutral wording

If jurisdiction is unknown, use general examiner-style language.

## Workflow

### Step 1: Parse the application material

Extract:

- independent claims
- dependent claims
- technical field
- problem to be solved
- core inventive concept
- key technical features
- embodiments
- figure references
- known prior art
- target jurisdiction if provided

If the user only provides an invention idea, first ask whether they want a review of draft claims or a claim-drafting-oriented review.

### Step 2: Claim chart

Create a claim chart:

| Claim element | Meaning | Support in specification | Prior-art risk | Comment |
|---|---|---|---|---|

For each independent claim, identify mandatory elements and optional elements.

### Step 3: Clarity review

Check:

- unclear terms
- relative terms without criteria
- functional language without structure
- inconsistent terminology
- missing antecedent basis
- overly long claim sentences
- ambiguous dependencies
- unclear relationships among components

### Step 4: Support and enablement review

Check whether the specification supports:

- the full breadth of each claim
- alternatives and variants
- functional results
- ranges, parameters, and thresholds
- software/algorithmic steps
- hardware modules
- training/data-processing procedures if relevant

Flag unsupported generalizations.

### Step 5: Novelty and inventive-step risk

If prior art is provided, compare claim elements against each reference.

If no prior art is provided, state:

```text
Prior-art assessment is provisional because no prior-art references were provided or searched.
```

Then identify likely search directions and vulnerable broad features.

### Step 6: Amendment strategy

Suggest:

- terms to define in the specification
- claim elements that need support
- possible dependent claims
- fallback features
- clarity amendments
- scope-preserving rewrites
- optional narrowing amendments

For every narrowing amendment, explain the tradeoff.

## Output Structure

1. **Non-legal-advice note**
2. **Application summary**
3. **Independent claim review**
4. **Claim chart**
5. **Clarity / definiteness issues**
6. **Support / enablement issues**
7. **Novelty and inventive-step risk**
8. **Figure and terminology consistency**
9. **Suggested amendments**
10. **Priority action list**

## Examiner-Style Issue Template

Use this format for each issue:

```markdown
### Issue [N]: [Short title]

**Affected text:**  
**Problem:**  
**Why it matters:**  
**Suggested revision:**  
**Risk if unresolved:** Low / Medium / High
```

## Style Guidance

- Be precise and conservative.
- Do not overstate patentability without prior-art evidence.
- Preserve claim scope when possible.
- Use examiner-style reasoning, but keep explanations understandable.
- For Chinese patent drafting, distinguish “技术特征”, “技术问题”, “技术效果”, and “技术方案”.
