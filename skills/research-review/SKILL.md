---
name: research-review
title: Web-Safe Research Review
description: Critically review a research idea, paper draft, experiment plan, or results from the perspective of senior academic reviewers without relying on local coding-assistant integration or external agent loops.
triggers:
  - research review
  - review my research
  - critique
  - external review
  - reviewer comments
  - paper review
  - idea review
  - 审稿
  - 评审
  - 研究审阅
  - 帮我review
  - 批判性分析
---

## Web-side execution adapter

- This skill is workflow guidance for the ChatGPT web-side connector.
- Loading this SKILL.md is only the setup step; it does not mean the task is complete.
- After loading, continue to execute the workflow, constraints, and output format below before answering.
- Mentions of local automation, local file operations, local command execution, or external integrations are descriptive only. Use capabilities available in the current ChatGPT session, or ask the user for needed files/links.
- For literature search, current facts, factual verification, source tracing, numeric values, material properties, legal/medical/financial/current information, or any evidence-heavy claim: use available search/browsing tools first and cite verifiable sources. Do not answer such tasks only from memory.
- Preserve the original workflow and scope unless the user explicitly asks for changes.

# Web-Safe Research Review

## Purpose

Use this skill when the user wants critical feedback on a research idea, paper draft, experiment plan, experimental results, or scientific argument.

This web-safe version does **not** call local coding-assistant integration, external reviewers, local files, or multi-agent loops. It simulates a rigorous senior reviewer within the current ChatGPT conversation and produces structured, actionable review feedback.

## Operating Rules

1. Do not pretend that an external model or reviewer was consulted.
2. Base the review only on user-provided material and clearly labeled assumptions.
3. Separate observed facts from reviewer inference.
4. Be direct but constructive.
5. Do not add requirements beyond the actual scientific/evidence boundary.
6. For empirical work, connect every criticism to a claim, method, experiment, or missing evidence.

## Review Modes

Choose the mode based on the user's request:

- **Idea review**: novelty, feasibility, risk, positioning
- **Paper review**: contribution, method, experiments, writing
- **Experiment review**: baselines, metrics, datasets, ablations
- **Results review**: claim support, limitations, alternative explanations
- **Rebuttal preparation**: likely reviewer objections and responses
- **Top-venue readiness**: acceptance risk and minimum strengthening package

## Workflow

### Step 1: Extract the research object

Identify:

- research question
- main claim
- proposed method
- intended contribution
- target venue or field
- evidence provided
- current stage: idea, experiment, draft, rebuttal

If essential information is missing, proceed with a provisional review and list missing inputs.

### Step 2: Build a claims matrix

Create:

| Claim | Evidence provided | Evidence gap | Risk level | Needed fix |
|---|---|---|---|---|

This is the core of the review. Claims without evidence should be marked explicitly.

### Step 3: Review novelty and positioning

Assess:

- whether the claimed contribution is incremental, integrative, or genuinely new
- what prior work category it likely competes with
- whether the framing is too broad or too narrow
- whether the strongest contribution is method, data, theory, analysis, or system

If the user asks for up-to-date novelty verification, use available browsing/search tools or ask for relevant papers. Do not invent prior work.

### Step 4: Review methodology

Check:

- method clarity
- reproducibility
- assumptions
- possible leakage or confounding
- whether the method directly addresses the stated problem
- whether the evaluation target matches the method's motivation

### Step 5: Review experiments

Check:

- baseline strength and fairness
- dataset appropriateness
- metric appropriateness
- ablation sufficiency
- statistical reliability
- failure analysis
- compute/resource fairness
- generalization evidence

### Step 6: Review narrative

Check:

- whether the problem is compelling
- whether the method follows naturally from the problem
- whether the results support the abstract/introduction claims
- whether limitations are acknowledged
- whether the paper has a clean “one-sentence contribution”

### Step 7: Produce actionable fixes

Rank fixes by impact and cost:

| Priority | Fix | Why it matters | Cost | Acceptance lift |
|---|---|---|---|---|

## Output Structure

1. **Executive assessment**
2. **Main contribution as understood**
3. **Claims matrix**
4. **Major concerns**
5. **Minor concerns**
6. **Missing experiments or evidence**
7. **Narrative and positioning suggestions**
8. **Minimum revision package**
9. **Likely reviewer questions**
10. **Recommendation / risk level**

## Recommendation Scale

Use one of:

- Strong reject risk
- Weak reject risk
- Borderline
- Weak accept potential
- Strong accept potential

Always explain what evidence would change the recommendation.

## Style Guidance

- Use academic, reviewer-like language.
- Be precise and evidence-focused.
- Avoid empty praise.
- Avoid unsupported accusations.
- When uncertain, say what information would resolve the uncertainty.
