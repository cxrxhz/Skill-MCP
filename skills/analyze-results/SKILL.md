---
name: analyze-results
description: Analyze ML experiment results, compute statistics, generate comparison tables and insights. Use when user says "analyze results", "compare", or needs to interpret experimental data.
argument-hint: [results-path-or-description]
---

## Web-side execution adapter

- This skill is workflow guidance for the ChatGPT web-side connector.
- Loading this SKILL.md is only the setup step; it does not mean the task is complete.
- After loading, continue to execute the workflow, constraints, and output format below before answering.
- Mentions of local automation, local file operations, local command execution, or external integrations are descriptive only. Use capabilities available in the current ChatGPT session, or ask the user for needed files/links.
- For literature search, current facts, factual verification, source tracing, numeric values, material properties, legal/medical/financial/current information, or any evidence-heavy claim: use available search/browsing tools first and cite verifiable sources. Do not answer such tasks only from memory.
- Preserve the original workflow and scope unless the user explicitly asks for changes.

# Analyze Experiment Results

Analyze: $ARGUMENTS

## Workflow

### Step 1: Locate Results
Find all relevant JSON/CSV result files:
- Check `figures/`, `results/`, or project-specific output directories
- Parse JSON results into structured data

### Step 2: Build Comparison Table
Organize results by:
- **Independent variables**: model type, hyperparameters, data config
- **Dependent variables**: primary metric (e.g., perplexity, accuracy, loss), secondary metrics
- **Delta vs baseline**: always compute relative improvement

### Step 3: Statistical Analysis
- If multiple seeds: report mean +/- std, check reproducibility
- If sweeping a parameter: identify trends (monotonic, U-shaped, plateau)
- Flag outliers or suspicious results

### Step 4: Generate Insights
For each finding, structure as:
1. **Observation**: what the data shows (with numbers)
2. **Interpretation**: why this might be happening
3. **Implication**: what this means for the research question
4. **Next step**: what experiment would test the interpretation

### Step 5: Update Documentation
If findings are significant:
- Propose updates to project notes or experiment reports
- Draft a concise finding statement (1-2 sentences)

## Output Format
Always include:
1. Raw data table
2. Key findings (numbered, concise)
3. Suggested next experiments (if any)
