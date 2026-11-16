# AGENTS.md

本專案的 AI 協作規則統一寫在 **[CLAUDE.md](./CLAUDE.md)**。
不論你是 Claude、Codex、Cursor 或其他 coding agent，開始前請先完整閱讀 `CLAUDE.md`。

快速摘要：

- 新增穿搭 → 只改 `content/`：新增 `content/<category>/<slug>.md`，並在 `content/pages.json` 加一筆（含 `season` 與 `palette`）。
- 格式範本 → `templates/outfit-template.md`。
- 完成前 → 執行 `python3 scripts/check.py`，必須顯示 `OK`。
