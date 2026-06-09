---
name: quick-lit
description: "快速学术检索与文献来源检索。Use when user says \"检索文献\", \"文献检索\", \"查文献\", \"找文献\", \"检索论文\", \"找论文\", \"搜论文\", \"相关工作\", \"相关文献\", \"文献来源\", \"论文来源\", \"参考文献来源\", \"给这个说法找文献\", \"给这个结论找来源\", \"这篇文章讲了什么\", \"查参数\", \"查比热\", \"查热导率\", \"查密度\", \"物性参数\", \"检索物性\", \"材料参数来源\", \"比热需要多方文献来源\", \"需要文献确定数值\", or wants quick academic paper search, source tracing, related work mapping, paper summary with traceable citations, or specific material property values with literature sources. 注意：如果用户说\"深入研究\"、\"深入核查\"、\"深入核实\"、\"深入检索\"、\"深度调研\"、\"deep research\"，请改用 /deep-research skill。本 skill 只做快速检索，不做对抗审阅。"
argument-hint: [topic-or-claim-or-paper-or-material-property]
user-invocable: true
disable-model-invocation: false
allowed-tools: Bash(*), Read, Glob, Grep, WebSearch, WebFetch, Write, Agent, Skill, mcp__zotero__*, mcp__obsidian-vault__*
---

# 快速学术检索

围绕 **$ARGUMENTS** 执行一次可追溯、优先结构化来源的学术检索。

> ⚠️ **路由提示**: 如果用户的指令包含"深入"、"深度"、"deep"等关键词，应改为调用 `/deep-research`。本 skill 定位为**快速轻量检索**。

## 核心原则

1. 能用 `/research-lit` 完成就直接委派，不自建搜索链路。
2. 用户已给出 DOI / 题名 / 参考网页 / 截图中的参数值时，先验证这些线索，不从零重搜。
3. 同一材料、同一条件、多个物性参数，一次批量查齐；只有缺项或来源冲突时才拆分。
4. **初筛阶段**默认不下载全文 PDF；优先用结构化数据库、综述表格、期刊页面、datasheet。
5. **确认阶段**：当初筛锁定了关键文献但摘要信息不足以回答用户问题时，**可以下载 PDF 深入读取**（调用 `/research-lit` 的 `arxiv download: true` 或通过 WebFetch 抓取全文页面）。
6. 默认不写报告文件；结果直接在聊天中交付。
7. 当前会话已有同材料同条件的已核验数值，优先复用并说明复用条件。

## 常量

| 项 | 值 |
|---|---|
| PRIMARY_SKILL | `/research-lit` |
| DEFAULT_SOURCES | `web, semantic-scholar` |
| MAX_SEARCH_ROUNDS | 3 |
| MAX_DIRECT_EVIDENCE_MISSES | 2 |
| WRITE_REPORT_BY_DEFAULT | false |
| ARXIV_DOWNLOAD | false (初筛), true (确认阶段对锁定文献) |

## 工作流

### 1. 判定任务 → 委派 `/research-lit`

根据 `$ARGUMENTS` 判断类型，直接委派：

- **单篇论文理解**（给了链接/DOI/标题）→ `/research-lit "$ARGUMENTS" — sources: web, deepxiv`
- **来源追溯 / 主题综述 / 相关工作** → `/research-lit "$ARGUMENTS" — sources: web, semantic-scholar`
- **物性参数数值检索** → 见下方专项流程

### 1.5. 确认阶段：PDF 深读（按需触发）

当初筛（Step 1）锁定了关键文献但摘要/网页信息**不足以回答**用户问题时：

1. **arXiv 论文**：调用 `/research-lit "$ARGUMENTS" — arxiv download: true`，下载后读取前 5-10 页
2. **非 arXiv 论文**：尝试 WebFetch 抓取全文 HTML 页面（ScienceDirect、PMC、期刊开放获取页面）
3. **读取重点**：方法/实验/结果章节，而非逐字通读——目标是提取回答所需的关键数据
4. **深读上限**：最多对 3 篇论文进行全文深读，避免过度展开

> 此阶段仅在摘要信息确实不够时触发。如果摘要已经足够回答，跳过。

### 2. 物性参数数值检索（专项）

这是最容易死循环的场景，必须用特定策略 + 严格停止条件。

**搜索优先级**（命中即止）：

1. 结构化数据库：NIST、MatWeb、Engineering Toolbox、厂商 datasheet
2. 综述论文表格（一篇可能解决全部需求）
3. 聚焦查询补缺项（只补缺失项，不重跑整套）

**示例**：用户问「查 Cr2Te3 室温比热、密度」

```
第一轮: /research-lit "Cr2Te3 specific heat density thermal properties" — sources: web, semantic-scholar
→ 命中密度 6.66 g/cm³ (crystallographic data), 比热未直接给出
第二轮: /research-lit "Cr2Te3 heat capacity Dulong-Petit Debye" — sources: web, semantic-scholar
→ 命中 Cp ≈ 0.256 J/(g·K) via Dulong-Petit 估算
→ 两轮结束，输出结果表
```

**输出格式**：

| 材料 | 物性 | 数值 | 单位 | 条件 | 来源 | 可信度 |
|------|------|------|------|------|------|--------|
| Cr2Te3 | 比热容 | 0.256 | J/(g·K) | 298 K | Dulong-Petit, [DOI] | ★★★☆☆ |

可信度：★★★★★ 权威数据库 → ★★★★☆ 期刊直接测量 → ★★★☆☆ 综述二手值 → ★★☆☆☆ 预印本估算 → ★☆☆☆☆ 正文一句话提及

### 3. 停止条件

- 连续 2 次未命中直接证据 → 立即停止，汇报已尝试关键词和最接近线索
- 已完成 3 轮搜索仍只有间接线索 → 停止
- **不为读 PDF 临时配新环境**（但可以用已有工具下载/WebFetch）
- **绝不调用不存在的子代理**

## 输出

直接在聊天中返回 Markdown 结果表 + 3-8 行中文结论 + 未解决项（如有）。只有用户明确要求时才写文件。
