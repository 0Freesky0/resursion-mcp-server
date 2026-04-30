---
name: render-handle-report
description: 当用户需要通过 MCP 解析 ID Factory handle，并生成精美 HTML 页面、可视化摘要或中文分析报告时使用。
---

# 渲染 Handle 报告

使用此技能将 `resursion-mcp-server` 的 MCP 解析结果转换为静态 HTML 报告。

## 工作流程

1. 使用 MCP 工具 `resolve_handle` 解析用户请求的 handle。
2. 使用返回结果中的 `structuredContent` 作为源数据。
3. 根据记录内容撰写一段简短的中文分析摘要。
4. 使用数据文件和分析文本运行 `scripts/render-report.mjs`，生成 HTML 报告。
5. 渲染完成后，返回该报告的可访问链接；如果用户需要预览，启动本地静态服务或使用浏览器直接打开页面。
6. 返回生成的报告路径、可访问链接和简洁的分析摘要。

## 输出规则

- 必须基于 MCP 数据渲染页面，不要直接通过浏览器或 API 抓取数据来生成报告。
- 报告应保持为静态页面，作为本次解析结果的快照。
- 报告中应同时包含友好的可视化区块和原始 JSON 载荷。
- 对于 `HS_SITE`，突出展示服务器地址、协议、端口、查询/管理标志、TTL 和时间戳。
- 如果 MCP 结果中包含未知记录类型，将其渲染为通用记录卡片。
- 最终回复中应包含报告文件路径；如果已启动本地预览服务或打开浏览器，还应包含可访问 URL。

## 脚本用法

```bash
node skills/render-handle-report/scripts/render-report.mjs \
  --data /path/to/handle-result.json \
  --analysis /path/to/analysis.txt \
  --out /path/to/report.html
```

数据文件必须包含 MCP 返回的 `structuredContent` 对象。
