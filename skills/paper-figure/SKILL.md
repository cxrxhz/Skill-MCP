---
name: paper-figure
title: Web-Safe Paper Figure Planner
description: Plan publication-quality paper figures, plots, tables, captions, and visualization specifications from experimental results without requiring local scripts or file-system access.
triggers:
  - paper figure
  - paper figures
  - figure plan
  - plot
  - visualization
  - table
  - caption
  - 作图
  - 画图
  - 图表
  - 论文图
  - 实验结果
  - 可视化
---

# Web-Safe Paper Figure Planner

## Purpose

Use this skill when the user wants to design, plan, critique, or specify figures and tables for an academic paper, especially from experimental results, ablation studies, benchmark comparisons, training curves, or qualitative examples.

This web-safe version does **not** assume access to local files, Bash, Python execution, LaTeX compilation, Codex MCP, or a project directory. It produces structured figure plans, plotting specifications, captions, table designs, and optional code snippets that the user can copy into their own environment.

## Operating Rules

1. Do not claim that figures, PDFs, PNGs, or LaTeX files have been generated unless the current ChatGPT environment actually creates them.
2. Work from user-provided data, pasted tables, screenshots, paper drafts, or textual descriptions.
3. If raw data are missing, infer only a figure plan and ask for the minimum missing data needed to draw the figure.
4. Separate observed facts from design suggestions.
5. Prefer simple, publication-readable figures over decorative visualizations.
6. For academic claims, ensure every proposed figure supports a specific claim.

## Workflow

### Step 1: Identify the paper story

Extract or ask for:

- paper topic
- main claims
- experimental setting
- datasets
- baselines
- metrics
- ablations
- qualitative examples
- target venue or style constraints

Summarize the intended evidence chain:

```text
Claim → Required evidence → Figure/table candidate → Data needed
```

### Step 2: Build a figure inventory

Create a figure/table inventory like this:

| ID | Type | Purpose | Data needed | Claim supported | Priority |
|---|---|---|---|---|---|
| Fig. 1 | Method overview | Explain architecture or pipeline | method description | contribution framing | High |
| Fig. 2 | Main result bar/line plot | Compare against baselines | metric table | performance claim | High |
| Table 1 | Benchmark comparison | Quantitative comparison | benchmark scores | SOTA or competitiveness | High |

Use these categories:

- **Method figure**: architecture, pipeline, training/inference flow
- **Main result figure/table**: overall comparison
- **Ablation figure/table**: component contribution
- **Sensitivity analysis**: hyperparameters, thresholds, data size
- **Training dynamics**: loss, reward, accuracy, convergence
- **Qualitative figure**: examples, failure cases, visual grounding
- **Efficiency figure/table**: latency, memory, FLOPs, cost
- **Error analysis**: confusion matrix, failure type distribution

### Step 3: Choose figure types

Recommend visualization types based on data shape:

| Data pattern | Recommended figure |
|---|---|
| Methods × metrics | grouped bar chart or compact table |
| Time/steps/epochs | line plot with confidence band if available |
| Ablation components | bar chart or table |
| Hyperparameter sweep | line plot or heatmap |
| Distribution | box plot, violin plot, histogram |
| Failure categories | stacked bar chart |
| Qualitative examples | grid with concise annotations |
| Architecture/pipeline | block diagram, Mermaid, TikZ, or manual vector design |

### Step 4: Provide precise figure specifications

For each figure, provide:

- figure objective
- data columns
- axes
- grouping/color encoding
- sorting
- legend
- annotation
- caption draft
- expected conclusion
- risks of misinterpretation
- minimum data required

Use this template:

```markdown
## Fig. X — [Title]

**Purpose:**  
**Supported claim:**  
**Required data:**  
**Recommended type:**  
**X-axis:**  
**Y-axis:**  
**Groups/colors:**  
**Annotations:**  
**Caption draft:**  
**Interpretation sentence:**  
**Potential issue:**  
```

### Step 5: Design paper-ready tables

For tables, produce:

- row/column layout
- metric order
- baseline grouping
- bold/underline rule
- notes for statistical significance
- LaTeX table skeleton when useful

Do not invent numbers. Use placeholders if the user has not provided values.

### Step 6: Critique existing figures

If the user provides an existing figure/table, review:

- whether it supports the stated claim
- whether axes and units are clear
- whether baseline comparisons are fair
- whether legends and captions are self-contained
- whether visual clutter can be reduced
- whether a table is better than a plot
- whether uncertainty or significance should be shown

## Output Structure

When planning figures:

1. **Figure strategy summary**
2. **Claim-to-figure mapping**
3. **Figure/table inventory**
4. **Detailed specifications**
5. **Caption drafts**
6. **Missing data checklist**
7. **Optional code or LaTeX skeleton** only if useful

When critiquing figures:

1. **Overall assessment**
2. **Major issues**
3. **Minor issues**
4. **Revision plan**
5. **Improved caption or layout**

## Style Guidance

- Prefer concise academic language.
- Use exact metric names and dataset names when available.
- Avoid overclaiming.
- If a proposed figure cannot support a claim, explicitly say so.
- For ML papers, ensure baselines, ablations, and evaluation metrics are visually separable.
