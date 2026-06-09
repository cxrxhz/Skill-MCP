---
name: paper-illustration
title: Web-Safe Paper Illustration Designer
description: Design paper-ready method diagrams, architecture illustrations, visual abstracts, and image-generation prompts without relying on external image-generation APIs.
triggers:
  - paper illustration
  - method diagram
  - architecture diagram
  - framework figure
  - visual abstract
  - image prompt
  - 架构图
  - 方法图
  - 机制图
  - 示意图
  - 论文插图
  - AI绘图
  - 画架构图
---

# Web-Safe Paper Illustration Designer

## Purpose

Use this skill when the user wants to design a paper illustration, method figure, architecture diagram, visual abstract, pipeline figure, or image-generation prompt for an academic paper.

This web-safe version does **not** call Gemini, image-generation APIs, local drawing tools, Bash, Codex MCP, or file-system operations. It produces a clear design specification, layout plan, diagram text, Mermaid/TikZ-style skeletons, and image-generation prompts that the user can copy into external tools.

## Operating Rules

1. Do not claim that an image has been generated unless the current ChatGPT environment actually generates it.
2. Treat the output as a design brief, not a finished figure file.
3. Prioritize scientific correctness over visual ornamentation.
4. Every box, arrow, icon, and label must correspond to a real component or process.
5. Avoid decorative elements that imply unsupported mechanisms.
6. Make diagrams self-contained: title, components, flow, legend, and caption.

## Workflow

### Step 1: Understand the figure goal

Identify:

- paper topic and target venue
- figure type: method overview, architecture, training pipeline, inference pipeline, visual abstract, comparison diagram
- main contribution to communicate
- modules/components
- data flow
- training vs inference distinction
- inputs and outputs
- important equations or losses
- visual constraints: one-column, two-column, slide, poster

### Step 2: Build a semantic diagram plan

Represent the method as:

```text
Input → Encoder/Processor → Core method → Output → Supervision/Evaluation
```

For complex methods, split into zones:

- **Data / input zone**
- **Model architecture zone**
- **Training objective zone**
- **Inference/output zone**
- **Evaluation/result zone**

### Step 3: Produce a layout specification

Use this template:

```markdown
## Illustration Specification

**Figure purpose:**  
**Canvas:** one-column / two-column / slide / poster  
**Reading direction:** left-to-right / top-to-bottom / circular  
**Main zones:**  
**Key components:**  
**Arrows:**  
**Labels:**  
**Color coding:**  
**Legend:**  
**What to emphasize:**  
**What to avoid:**  
```

### Step 4: Provide alternative layouts

Give 2–3 layout options:

- **Option A: clean pipeline**
- **Option B: modular architecture**
- **Option C: contribution-focused visual abstract**

For each option, state:

- best use case
- strengths
- weaknesses
- estimated complexity
- whether it fits one-column or two-column format

### Step 5: Generate diagram text

When useful, provide one or more of:

- ASCII block layout
- Mermaid flowchart
- TikZ-style pseudocode
- Figma/draw.io construction instructions
- image-generation prompt
- caption draft

For Mermaid, keep the graph simple and syntactically conservative.

### Step 6: Review the design

Check:

- Are all arrows directionally correct?
- Are training-only components separated from inference-time components?
- Are losses and supervision signals visually distinct?
- Are all labels short enough?
- Is the main contribution visually prominent?
- Could a reader understand the method without reading the full paper?

## Output Structure

1. **Figure goal**
2. **Core message**
3. **Recommended layout**
4. **Detailed visual specification**
5. **Alternative layouts**
6. **Mermaid / TikZ / prompt draft**
7. **Caption**
8. **Self-review checklist**

## Image Prompt Template

When the user wants an image-generation prompt, use:

```text
Create a clean academic paper method diagram on a white background. The diagram shows [method]. Use [layout]. Include the following labeled components: [components]. Show arrows from [flow]. Emphasize [contribution]. Use minimal colors, thin arrows, readable sans-serif labels, and no decorative background. Avoid photorealism, icons unrelated to the method, and unreadable tiny text.
```

## Style Guidance

- Use neutral academic style.
- For CV/ML papers, prefer clean vector-like diagrams.
- For systems papers, show modules and data movement clearly.
- For theory papers, prefer conceptual diagrams with minimal components.
- Do not overuse colors; reserve accent color for the main contribution.
