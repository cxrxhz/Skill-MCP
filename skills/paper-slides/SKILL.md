---
name: paper-slides
title: Web-Safe Paper Slides Planner
description: Convert a paper, abstract, or research project into a conference-talk slide outline, speaker notes, and talk script without requiring Beamer/PPT compilation.
triggers:
  - paper slides
  - presentation
  - conference talk
  - talk script
  - speaker notes
  - slides
  - PPT
  - 幻灯片
  - 做PPT
  - 演讲稿
  - 汇报
  - 答辩
---

## Web-side execution adapter

- This skill is workflow guidance for the ChatGPT web-side connector.
- Loading this SKILL.md is only the setup step; it does not mean the task is complete.
- After loading, continue to execute the workflow, constraints, and output format below before answering.
- Mentions of local automation, local file operations, local command execution, or external integrations are descriptive only. Use capabilities available in the current ChatGPT session, or ask the user for needed files/links.
- For literature search, current facts, factual verification, source tracing, numeric values, material properties, legal/medical/financial/current information, or any evidence-heavy claim: use available search/browsing tools first and cite verifiable sources. Do not answer such tasks only from memory.
- Preserve the original workflow and scope unless the user explicitly asks for changes.

# Web-Safe Paper Slides Planner

## Purpose

Use this skill when the user wants to turn a paper, abstract, experiment, or research project into presentation slides, speaker notes, or a conference talk.

This web-safe version does **not** assume access to LaTeX, Beamer, PPTX libraries, local files, local coding-assistant integration, or a compiled paper directory. It produces slide outlines, per-slide content, speaker notes, timing plans, and optional Markdown/Beamer skeletons that the user can copy into PowerPoint, Keynote, Google Slides, or LaTeX.

## Operating Rules

1. Do not claim that a PPTX, PDF, or Beamer file has been generated unless the current environment actually creates it.
2. Focus on talk structure, narrative, and slide content.
3. Keep slides visually sparse.
4. Convert paper detail into audience-oriented explanation; do not paste paper paragraphs directly.
5. Adjust depth to talk length and audience expertise.
6. Preserve the paper's claims and evidence boundaries.

## Inputs to Extract or Ask For

- paper title and abstract
- target audience
- talk length: 3/5/10/15/20/30/45 minutes
- venue type: conference, group meeting, thesis defense, interview, poster teaser
- main contribution
- method overview
- key results
- limitations
- desired tone: technical, accessible, persuasive, defensive

## Slide Count Guide

| Talk length | Recommended slides |
|---|---|
| 3 min | 3–5 slides |
| 5 min | 5–7 slides |
| 10 min | 8–12 slides |
| 15 min | 12–18 slides |
| 20 min | 16–24 slides |
| 30 min | 25–35 slides |

Adjust based on venue norms and density.

## Workflow

### Step 1: Identify the talk thesis

Write one sentence:

```text
This talk argues that [problem] can be addressed by [method], leading to [main evidence/result].
```

### Step 2: Build the narrative arc

Use this structure:

1. **Motivation** — why the problem matters
2. **Gap** — why existing methods are insufficient
3. **Idea** — the core insight
4. **Method** — how it works
5. **Evidence** — main results and ablations
6. **Takeaway** — what the audience should remember

### Step 3: Create a slide outline

For each slide provide:

- slide title
- one-line message
- bullet content
- visual suggestion
- speaker notes
- transition to next slide
- estimated time

Template:

```markdown
## Slide X — [Title]

**Message:**  
**On-slide content:**  
- 
- 

**Visual:**  
**Speaker notes:**  
**Transition:**  
**Time:** 
```

### Step 4: Convert paper sections into slides

Map paper material:

| Paper section | Slide role |
|---|---|
| Abstract | opening summary and take-home message |
| Introduction | motivation and gap |
| Related work | one comparison slide, not a literature dump |
| Method | 2–5 slides depending on complexity |
| Experiments | main result, ablation, analysis |
| Limitations | honest final or backup slide |
| Appendix | backup slides |

### Step 5: Add backup slides

For research talks, prepare backup slides for:

- implementation details
- additional baselines
- hyperparameters
- dataset details
- failure cases
- theoretical derivations
- reviewer-style questions

### Step 6: Produce speaker script

If requested, write:

- concise speaker notes per slide
- full talk script
- Q&A preparation
- 30-second elevator pitch
- 1-minute summary
- closing statement

## Output Structure

1. **Talk strategy**
2. **Slide outline**
3. **Per-slide content and notes**
4. **Timing plan**
5. **Backup slide suggestions**
6. **Likely Q&A**
7. **Optional Markdown/Beamer skeleton**

## Style Guidance

- Slide titles should be claims, not topics.
  - Weak: “Experiments”
  - Strong: “The proposed method improves temporal localization under sparse supervision”
- Prefer one main message per slide.
- Avoid long equations unless the talk is theory-focused.
- Use figures where possible, but describe placeholders if figures are unavailable.
