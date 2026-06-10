---
name: deep-research
description: "深度学术研究与事实核查。Use when user says \"深入研究\", \"深入核查\", \"深入核实\", \"深入检索\", \"深度调研\", \"深度研究\", \"deep research\", \"deep dive\", \"深入了解\", \"彻底调查\", \"全面核查\", \"深挖\", or wants thorough multi-source literature investigation with PDF deep reading, cross-model adversarial review, and structured evidence audit. 注意：如果用户只是简单查文献/找论文/查参数，没有说\"深入\"或\"深度\"，请改用 quick-lit skill skill。本 skill 是重量级流程：文献检索 → PDF精读 → 交叉验证 → 对抗审阅 → 结构化报告。"
argument-hint: [research-topic-or-claim-to-verify]
user-invocable: true
disable-model-invocation: false
---

## Web-side execution adapter

- This skill is workflow guidance for the ChatGPT web-side connector.
- Loading this SKILL.md is only the setup step; it does not mean the task is complete.
- After loading, continue to execute the workflow, constraints, and output format below before answering.
- Mentions of local automation, local file operations, local command execution, or external integrations are descriptive only. Use capabilities available in the current ChatGPT session, or ask the user for needed files/links.
- For literature search, current facts, factual verification, source tracing, numeric values, material properties, legal/medical/financial/current information, or any evidence-heavy claim: use available search/browsing tools first and cite verifiable sources. Do not answer such tasks only from memory.
- Preserve the original workflow and scope unless the user explicitly asks for changes.

# 深度学术研究

围绕 **$ARGUMENTS** 执行一次深度学术研究流程。

> ⚠️ **路由提示**: 本 skill 仅在用户明确要求"深入/深度/deep"时调用。简单查文献请用 quick-lit skill。

## 与 quick-lit skill 的区别

| 维度 | quick-lit skill | deep-research skill |
|------|-------------|-----------------|
| 定位 | 快速检索，即问即答 | 深度调研，结构化报告 |
| PDF 阅读 | 仅在摘要不够时读 1-3 篇 | 主动获取可访问全文并精读 5-10 篇关键文献 |
| 搜索轮数 | 最多 3 轮 | 最多 5 轮，含补充轮 |
| 交叉验证 | 无 | 多源交叉验证（PubMed/S2/arXiv/原始论文） |
| 对抗审阅 | 无 | a strong reviewer pass 对抗式审阅 |
| 事实核查 | 不核查 | 每条关键声明逐一核查原始来源 |
| 输出格式 | 聊天内 Markdown 表 | 结构化报告文件 + 聊天摘要 |
| 耗时 | 1-3 分钟 | 10-30 分钟 |

## 常量

| 项 | 值 |
|---|---|
| PRIMARY_SKILL | research-lit skill |
| DEFAULT_SOURCES | `web, semantic-scholar, deepxiv` |
| ARXIV_DOWNLOAD | true |
| MAX_SEARCH_ROUNDS | 5 |
| MAX_PDF_DEEP_READ | 10 |
| MAX_CLAIMS_TO_VERIFY | 20 |
| REVIEWER_MODEL | `gpt-5.4` |
| REVIEWER_BACKEND | `codex` |
| WRITE_REPORT | true |
| OUTPUT_DIR | `research-logs/` |

## 工作流概览

```
Phase 1: 广域文献扫描 (research-lit)
    ↓
Phase 2: PDF 深度精读 (锁定文献 → 下载 → 方法/数据/结论提取)
    ↓
Phase 3: 声明提取与交叉验证 (每条关键声明追溯原始来源)
    ↓
Phase 4: 对抗审阅 (a strong reviewer pass 扮演 devil's advocate)
    ↓
Phase 5: 结构化报告
```

---

## Phase 1: 广域文献扫描

### 1.1 判定研究类型

根据 `$ARGUMENTS` 判断属于哪一类：

1. **主题深度调研** — "深入研究 X 领域"、"深入了解 X 的最新进展"
2. **声明/事实核查** — "深入核查这篇文章"、"深入核实这些说法"
3. **方法对比调研** — "深入比较 A 和 B 方法"

### 1.2 多源文献检索

调用 research-lit skill 进行广域扫描：

```
research-lit skill "$ARGUMENTS" — sources: web, semantic-scholar, deepxiv — arXiv full-text reading when accessible
```

**目标**：
- 收集 15-30 篇相关论文的元数据（标题、作者、期刊、年份、摘要）
- 下载最相关的 5-10 篇 arXiv PDF
- 识别该领域的核心论文、综述、里程碑式工作

### 1.3 补充检索

如果 Phase 1.2 的结果覆盖不足（缺少关键子主题或关键期刊），进行定向补充：

```
research-lit skill "补充关键词" — sources: web, semantic-scholar
```

最多补充 2 轮。

### 🚦 Phase 1 Checkpoint

输出初步文献地图：
```
📚 广域扫描完成。找到 X 篇相关文献，下载了 Y 篇 PDF。
主要来源分布：[期刊/会议列表]
核心论文：[3-5 篇最重要的]
覆盖缺口：[如有]
```

---

## Phase 2: PDF 深度精读

对 Phase 1 锁定的核心文献（最多 MAX_PDF_DEEP_READ 篇）进行精读。

### 2.1 精读策略

对每篇文献，按重要性分级阅读：

- **Tier 1（核心论文，3-5篇）**：读完整论文，提取方法细节、实验设计、具体数据、局限性声明
- **Tier 2（重要参考，3-5篇）**：读摘要 + 方法 + 结果 + 讨论的关键段落
- **Tier 3（背景文献）**：仅读摘要和结论

### 2.2 精读要素提取

对每篇 Tier 1/2 文献，提取结构化信息：

| 字段 | 说明 |
|------|------|
| 核心声明 | 论文的 1-3 条主要结论 |
| 方法 | 研究设计（RCT/队列/荟萃/动物/体外） |
| 样本 | 样本量、人群特征、追踪时长 |
| 关键数据 | 效应量、置信区间、P值 |
| 统计模型 | 使用了哪些校正模型，不同模型结果是否一致 |
| 局限性 | 作者自述的局限 + 我们发现的局限 |
| 利益冲突 | 资助来源、作者利益声明 |

### 2.3 PDF 获取路径

按优先级尝试：
1. arXiv PDF（通过 `arxiv_fetch.py download`）
2. PMC 全文（通过 web page retrieval capability 抓取 PMC HTML）
3. 期刊开放获取页面（通过 web page retrieval capability）
4. Sci-Hub（不主动使用——如果用户明确要求可告知链接格式）
5. 如无法获取全文，用摘要 + 补充材料 + 新闻报道交叉验证

---

## Phase 3: 声明提取与交叉验证

### 3.1 提取关键声明

从用户提供的材料（文章/论文/论点）或 Phase 2 的精读结果中，提取所有可验证的事实性声明：

- 具体数字（风险倍数、百分比、样本量）
- 因果断言（"X 导致 Y"）
- 来源归属（"某期刊发表了..."）
- 权威机构立场（"WHO 建议..."）

每条声明编号，最多 MAX_CLAIMS_TO_VERIFY 条。

### 3.2 逐条交叉验证

对每条声明，执行：

1. **来源追溯**：找到被引用的原始论文，确认它是否真实存在（PMID/DOI/期刊页面）
2. **数字核对**：对比文章引用的数字与原始论文中的数字
3. **上下文还原**：检查原始论文中的数字是否被断章取义
   - 多个统计模型中选了最有利的？
   - 亚组分析结果被当成主结果？
   - 相关性被改写为因果性？
4. **多源交叉**：用至少 2 个独立来源验证同一声明
5. **判定等级**：

| 判定 | 含义 |
|------|------|
| ✅ ACCURATE | 数字、来源、结论均与原始论文一致 |
| ✅ MOSTLY ACCURATE | 大方向正确，细节有小偏差 |
| ⚠️ EXAGGERATED | 真实研究存在，但数字/结论被夸大 |
| ⚠️ MISLEADING | 选择性引用或断章取义 |
| ❌ FABRICATED | 来源或数字查无实据 |
| ❓ UNVERIFIABLE | 无法从公开来源验证 |

---

## Phase 4: 对抗审阅

### 4.1 自我审阅（内部）

在提交外部审阅前，先自查：
- Phase 3 中是否有遗漏的关键声明？
- 自己的验证是否存在偏差（只找支持/反驳的证据）？
- 是否过度依赖摘要而未读全文？

### 4.2 外部对抗审阅（local coding-assistant integration）

将 Phase 2-3 的所有发现提交给 a strong reviewer pass 进行对抗式审阅：

```
local coding assistant integration:
  config: {"model_reasoning_effort": "xhigh"}
  prompt: |
    我正在对以下主题进行深度学术研究/事实核查：[主题]
    
    以下是我的发现摘要：
    [Phase 2-3 的结构化结果]
    
    请你扮演一个严格的学术审稿人/事实核查员，针对我的分析：
    1. 我是否遗漏了关键文献或关键证据？
    2. 我的验证逻辑是否存在漏洞？
    3. 我对"准确/夸大/捏造"的判定是否公允？
    4. 是否存在我没考虑到的替代解释或反面证据？
    5. 整体结论是否站得住脚？
    
    请直接指出问题，不要客气。
```

### 4.3 迭代对话（1-2 轮）

使用 `local coding assistant feedback integration` 对审阅意见进行反驳/吸收：
- 对合理批评：修正分析
- 对不合理批评：提供反驳证据
- 直到双方在核心结论上达成共识

### 4.4 无 local coding-assistant integration 时的降级方案

如果 local coding-assistant integration 不可用：
1. 用 `runSubagent` 启动一个对抗角色的子代理进行内部审阅
2. 在报告中标注"对抗审阅: 内部降级版（未使用外部模型）"

---

## Phase 5: 结构化报告

### 5.1 报告文件

输出到 `OUTPUT_DIR/DEEP_RESEARCH_REPORT.md`：

```markdown
# 深度研究报告

**主题**: $ARGUMENTS
**日期**: [today]
**流程**: research-lit → PDF精读 → 交叉验证 → 对抗审阅

## 省流版（3-5句话）

[用最简洁的语言概括核心发现和可信度判断]

## 文献地图

| # | 论文 | 期刊 | 年份 | 类型 | 阅读深度 | 关键发现 |
|---|------|------|------|------|----------|----------|

## 声明核查表（如适用）

| # | 声明 | 判定 | 原始来源 | 关键差异 |
|---|------|------|----------|----------|

## 深度分析

### [主题1]
[详细分析...]

### [主题2]
[详细分析...]

## 系统性问题（如适用）

[如发现被核查材料存在系统性问题，在此汇总]

## 对抗审阅记录

### 审阅意见
[a strong reviewer model 的关键批评]

### 我方回应与修正
[对批评的回应和因此做出的修正]

## 结论与可信度评级

| 维度 | 评分 | 说明 |
|------|------|------|
| ... | X/10 | ... |

## 未解决问题

[列出无法验证的声明或需要进一步研究的方向]
```

### 5.2 聊天输出

在聊天中给出省流版摘要 + 报告文件链接。

---

## 适用场景示例

### 场景 A: 深入研究某个课题
```
用户: 深入研究二维材料的热输运机理
→ Phase 1: 文献扫描(二维热输运 + 声子 + BTE + 分子动力学)
→ Phase 2: 精读 8 篇核心论文
→ Phase 3: 提取研究共识与争议点
→ Phase 4: 审阅分析的全面性
→ Phase 5: 结构化研究报告
```

### 场景 B: 深入核查一篇科普文章
```
用户: 深入核查这篇关于代糖的文章
→ Phase 1: 找到文章引用的所有原始论文
→ Phase 2: 逐篇精读原始论文
→ Phase 3: 逐条核对声明 vs 原始数据
→ Phase 4: 对抗审阅核查结论
→ Phase 5: 事实核查报告（含判定等级）
```

### 场景 C: 深入比较两种方法
```
用户: 深入比较 TDTR 和 3ω 方法测量薄膜热导率
→ Phase 1: 两种方法的核心文献
→ Phase 2: 精读各自的方法论论文
→ Phase 3: 提取可比较的维度（精度/适用范围/成本/难度）
→ Phase 4: 审阅比较的公允性
→ Phase 5: 对比分析报告
```

---

## Key Rules

- **深度 > 广度**：宁可精读 5 篇核心论文，也不浅读 50 篇。
- **原始来源 > 二手引用**：始终追溯到原始论文，不信任科普/新闻转述。
- **完整校正模型 > cherry-picked 模型**：报告论文中所有统计模型的结果，不只挑最显著的。
- **相关性 ≠ 因果性**：观察性研究结论中必须标注研究类型和因果局限。
- **对抗审阅是必选项**：不是可跳过的步骤。如 local coding assistant 不可用，用内部子代理降级执行。
- **省流版是必选项**：报告开头必须有 3-5 句话的核心结论，方便用户先说清楚再展开。
- **Large file handling**: 如果 file output step 因文件过大失败，用 local command execution (`cat << 'EOF' > file`) 分块写入，不要跳过必要的用户确认。
