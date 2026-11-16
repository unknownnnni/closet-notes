# 🧥 衣櫥筆記 Closet Notes

一頁一套的穿搭公式：依**場合**和**季節**分類，每一頁都有單品清單、配色色票、搭配重點與避雷提醒。

**線上瀏覽：** https://`<你的 GitHub 帳號>`.github.io/closet-notes/

## 特色

- 純靜態網站，不需要建置，直接部署在 GitHub Pages
- 筆記用 Markdown 撰寫；新增一套穿搭 = 一個 `.md` 檔 + `pages.json` 一筆資料
- 首頁可以搜尋，並依場合、季節篩選；配色用色票呈現，不放照片和商品連結
- 附 `CLAUDE.md` / `AGENTS.md`，AI 讀完就知道怎麼照同一套格式繼續新增
- `scripts/check.py` 自動檢查格式，確保每一篇都長得一樣

## 目前的筆記

| 分類 | 筆記 | 季節 |
| --- | --- | --- |
| 📐 穿搭基礎 | 新手配色三原則 | 四季 |
| 🎒 日常上課 | 針織衫 × 襯衫領疊穿 | 秋、冬 |
| 🎤 正式場合 | 研討會發表的 Smart Casual | 春、秋、冬 |
| 🧳 旅行出遊 | 秋天京都的洋蔥式穿法 | 春、秋 |

## 本機預覽

```bash
python3 -m http.server 8000
# 打開 http://localhost:8000
```

> 直接雙擊 `index.html`（file://）會讀不到 `pages.json`，請用上面的指令。

## 新增一套穿搭

1. 複製 `templates/outfit-template.md` → `content/<分類>/<slug>.md`
2. 在 `content/pages.json` 的 `pages` 加一筆（含 `season`、`palette`）
3. 執行 `python3 scripts/check.py`，看到 `OK` 即完成

完整規則見 [CLAUDE.md](./CLAUDE.md)。用 AI 新增時可以直接說：

> 請依照 CLAUDE.md 的規則，新增一篇「夏天去海邊的穿搭」到 travel 分類。

## 技術

HTML / CSS / 原生 JavaScript、[marked](https://github.com/markedjs/marked)（內附於 `assets/vendor/`）、GitHub Pages。
