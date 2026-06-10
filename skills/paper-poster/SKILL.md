---
name: paper-poster
title: Web-Safe Paper Poster Planner
description: Convert a paper or research project into a conference poster layout, section text, figure placement plan, captions, and presenter pitch without requiring LaTeX/PPT compilation.
triggers:
  - paper poster
  - poster
  - conference poster
  - academic poster
  - poster layout
  - 海报
  - 学术海报
  - 会议海报
  - poster设计
---

## Web-side execution adapter

- This skill is workflow guidance for the ChatGPT web-side connector.
- Loading this SKILL.md is only the setup step; it does not mean the task is complete.
- After loading, continue to execute the workflow, constraints, and output format below before answering.
- Mentions of local automation, local file operations, local command execution, or external integrations are descriptive only. Use capabilities available in the current ChatGPT session, or ask the user for needed files/links.
- For literature search, current facts, factual verification, source tracing, numeric values, material properties, legal/medical/financial/current information, or any evidence-heavy claim: use available search/browsing tools first and cite verifiable sources. Do not answer such tasks only from memory.
- Preserve the original workflow and scope unless the user explicitly asks for changes.

# Web-Safe Paper Poster Planner

## Purpose

Use this skill when the user wants to design an academic conference poster from a paper, abstract, or research project.

This web-safe version does **not** compile LaTeX, generate PPTX, edit local files, or call local coding-assistant integration. It produces a poster content plan, section layout, figure placement strategy, concise text blocks, captions, and presentation pitch that the user can copy into PowerPoint, Keynote, Canva, Illustrator, Inkscape, LaTeX, or Google Slides.

## Operating Rules

1. Do not claim that a poster PDF/PPTX has been generated unless the current environment actually creates it.
2. Prioritize readability from distance.
3. Reduce paper content aggressively; a poster is not a compressed paper.
4. Use figures, diagrams, and tables as anchors.
5. Keep text blocks short.
6. Ensure claims match evidence.

## Inputs to Extract or Ask For

- title
- authors/affiliation if needed
- abstract or paper draft
- venue and poster size if known
- orientation: landscape or portrait
- target audience
- key figures/tables
- main contribution
- results and takeaways
- QR/contact requirements

## Recommended Layouts

### Landscape A0 or large conference poster

Use 3 or 4 columns:

1. **Problem and motivation**
2. **Method**
3. **Results**
4. **Takeaways / limitations / contact**

### Portrait poster

Use 3 columns:

1. **Motivation + method overview**
2. **Experiments/results**
3. **Analysis + conclusion**

Avoid 4 narrow columns in portrait orientation.

## Workflow

### Step 1: Define the poster thesis

Write one sentence:

```text
This poster shows that [method/idea] solves [problem] by [mechanism], supported by [main result].
```

### Step 2: Select poster content

Prioritize:

- one strong motivation statement
- one central method diagram
- one main result figure/table
- one ablation or analysis figure
- one concise conclusion
- optional limitations or future work

Remove:

- long related work
- dense derivations
- excessive implementation details
- paragraphs copied from the paper

### Step 3: Plan the layout

Produce a layout table:

| Region | Section | Content | Visual | Approx. space |
|---|---|---|---|---|
| Top | Title bar | title, authors | logo/contact | 10% |
| Column 1 | Problem | motivation and gap | small problem figure | 20% |
| Column 2 | Method | method overview | large diagram | 30% |
| Column 3 | Results | main results | plots/tables | 30% |
| Bottom | Takeaways | summary, QR | contact | 10% |

### Step 4: Write poster-ready text

For each section, produce:

- title
- 2–4 bullet points
- figure caption
- takeaway sentence

Keep each bullet short. Prefer strong verbs and concrete results.

### Step 5: Add presenter support

Prepare:

- 30-second pitch
- 2-minute walkthrough
- likely questions
- concise answers
- “what should the viewer remember?” line

## Output Structure

1. **Poster thesis**
2. **Recommended layout**
3. **Section-by-section content**
4. **Figure/table placement plan**
5. **Captions**
6. **Design notes**
7. **Presenter pitch**
8. **Checklist before final design**

## Design Guidance

- Use a clear visual hierarchy: title → section headers → figures → bullets.
- Use high-contrast colors and large fonts.
- Avoid dense paragraphs.
- Make the central method/result visible from several meters away.
- Use QR codes only for paper/code/contact, not for essential content.
- If the user provides no venue style, use a clean generic academic style.
