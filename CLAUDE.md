# CLAUDE.md — 衣櫥筆記 Closet Notes

> 這份文件是給 AI（Claude、Codex、Cursor 等）與協作者看的「專案說明書」。
> 新增或修改任何內容之前，請先讀完本文件並遵守。

---

## 1. 專案目的

「衣櫥筆記」是一個**個人穿搭筆記網站**：把「什麼場合、什麼季節、穿什麼、怎麼配」整理成一頁一套的穿搭公式。

- 每一頁 = 一套「穿搭公式」或一個「穿搭觀念」。早上出門前 30 秒內能看懂要穿什麼。
- 重點是**用自己衣櫃就做得到的組合**：單品清單、配色、搭配重點、替換玩法。
- 不推薦特定品牌、不放商品連結、不放真人照片。配色用**色票**呈現，不用圖片。
- 語言：**繁體中文**，語氣像朋友的筆記，輕鬆但具體。
- 單品以**中性款式**為主（襯衫、針織衫、西裝外套、寬褲、運動鞋…），不預設穿的人的性別。

## 2. 技術架構（不需要建置）

- 純靜態網站：HTML + CSS + 原生 JavaScript，部署在 GitHub Pages。
- **內容用 Markdown 寫**，由瀏覽器端的 `marked`（已放在 `assets/vendor/`）即時轉成 HTML。
- 所有頁面清單集中在 **`content/pages.json`**；首頁卡片、色票、篩選、上一篇/下一篇都從這裡讀。
- 不使用框架、不需 npm build、不引入 CDN、外部字型或圖片。

## 3. 目錄結構

```
closet-notes/
├── CLAUDE.md              ← 本文件（AI 規則）
├── AGENTS.md              ← 指向本文件
├── README.md              ← 給人看的介紹
├── index.html             ← 首頁：搜尋 + 場合篩選 + 季節篩選 + 卡片
├── page.html              ← 筆記檢視器：page.html?p=<slug>
├── .nojekyll
├── assets/
│   ├── css/style.css      ← 唯一的樣式檔
│   ├── js/app.js          ← 唯一的程式檔
│   └── vendor/marked.umd.js
├── content/
│   ├── pages.json         ← 分類與頁面清單（manifest）
│   └── <category>/<slug>.md
├── templates/
│   └── outfit-template.md ← 新筆記範本
└── scripts/
    └── check.py           ← 規則檢查
```

## 4. 新增一套穿搭的流程（最常見的任務）

1. 選分類 `category`（必須是 `pages.json` 裡 `categories[].id` 之一）：
   - `basics` 穿搭基礎（觀念、配色原則）
   - `campus` 日常上課（通勤、上課、圖書館）
   - `formal` 正式場合（報告、研討會、面試）
   - `travel` 旅行出遊
2. 取 `slug`：小寫英文 + 數字 + 連字號，例如 `campus-knit-layering`，全站唯一。
3. 複製 `templates/outfit-template.md` → `content/<category>/<slug>.md`，依第 5 節填寫。
4. 在 `content/pages.json` 的 `pages` 陣列**最後面**加一筆（第 6 節）。
5. 執行 `python3 scripts/check.py`，必須顯示 `OK`。
6. `python3 -m http.server 8000` 打開 `http://localhost:8000` 檢查畫面。

> 只新增內容時，**不要**修改 `index.html`、`page.html`、`app.js`、`style.css`。

## 5. 筆記 Markdown 格式

段落順序固定，標題文字要一字不差：

```markdown
# 標題（與 pages.json 的 title 相同）

> 一句話：這套穿搭適合什麼情況、給人什麼感覺。

## 適合情境
- 2～4 點（場合、天氣、要走多少路…）

## 單品清單
| 部位 | 單品 | 顏色 | 沒有的話可以換成 |
| --- | --- | --- | --- |
| 上身 | … | … | … |

## 搭配重點
1. 3～5 點具體做法（比例、長度、配色、細節）

## 替換玩法
- 2～4 點：換掉一件單品，就變成另一種感覺

## 避雷提醒
- 2～4 點常見失誤
```

撰寫規則：

- 第一行一定是 `# 標題`，全頁只能有一個 `#`；內文只用 `##`、`###`。
- 「單品清單」表格的 `部位` 用：`外套`、`上身`、`內搭`、`下身`、`鞋子`、`配件`，依此順序，不需要的就省略。
- 顏色用一般說法（米白、燕麥色、深藍、炭灰…），不要寫色碼；色碼只放在 `pages.json` 的 `palette`。
- 寫「具體可做」的建議：例如「褲長蓋到鞋面一半」比「褲長要剛好」好。
- `basics` 分類的觀念文可以不用「單品清單」表格，改用 `### 小節`，但其餘四個段落仍要有。
- 一篇約 40～120 行；不要在 Markdown 寫 HTML 或 `<script>`。

## 6. `content/pages.json` 格式

```json
{
  "categories": [
    { "id": "campus", "name": "日常上課", "icon": "🎒", "color": "#5b7a5e" }
  ],
  "pages": [
    {
      "slug": "campus-knit-layering",
      "title": "針織衫 × 襯衫領疊穿",
      "category": "campus",
      "summary": "首頁卡片的一句話（30 字以內）",
      "season": ["秋", "冬"],
      "palette": ["#e9e1d3", "#8a6f55", "#2f3b52"],
      "tags": ["layering", "knit", "shirt"],
      "updated": "2026-11-16"
    }
  ]
}
```

- 檔案路徑**不寫在 JSON**，固定是 `content/<category>/<slug>.md`。
- `season`：從 `春`、`夏`、`秋`、`冬` 選 1～4 個，依季節順序排列。
- `palette`：2～5 個 `#rrggbb` 色碼，**依照穿搭中的面積由大到小排列**，必須對應「單品清單」裡實際出現的顏色。
- `tags`：小寫英文，1～5 個。
- `updated`：`YYYY-MM-DD`，修改內容時一起更新。
- 上一篇／下一篇依 `pages` 陣列順序。

### 新增分類

現有分類都不適合時才新增：在 `categories` 加一筆（`id` 小寫英文、`icon` 一個 emoji、`color` 在米白底上看得清楚的低飽和色），並建立 `content/<id>/` 資料夾。

## 7. 視覺風格

- 主題：「雜誌感的紙本筆記」。暖米白底、深墨色文字、襯線字標題、細線分隔、大量留白。
- 卡片上方以色票條呈現該套穿搭的配色；內頁頂端顯示大色票與色碼。
- 顏色、字型、間距一律使用 `style.css` 最上方的 CSS 變數，不要寫死新色碼（`palette` 資料除外）。
- 字型只用系統字型：標題 `Noto Serif TC` / `Songti TC` / `PMingLiU`；內文 `Noto Sans TC` / `PingFang TC` / `Microsoft JhengHei`。
- 支援手機（≤ 720px：單欄、目錄隱藏）。

## 8. AI 修改內容時的規則

1. **先讀後改**：新增前先讀 `templates/outfit-template.md` 和至少一篇現有筆記當範例。
2. **只動該動的檔案**：新增內容只改 `content/`；使用者明確要求才改版面或程式。
3. **建議要實際可行**：以常見、平價、容易取得的基本款為主；不寫特定品牌、價格或購物連結。
4. **尊重每個人**：不評論身材、不用「顯瘦才好看」這類說法；用「比例」「視覺重心」等中性描述。
5. **配色要一致**：`palette` 的顏色必須和「單品清單」的顏色對得上。
6. **安全渲染**：`app.js` 只載入 `pages.json` 中存在的 slug，不能改成用網址參數直接組出檔案路徑。
7. **完成前一定要跑** `python3 scripts/check.py` 並回報結果。
8. 每次修改後，用一句話告訴使用者新增/修改了哪些檔案。

## 9. Git 提交規則

- 一篇筆記一個 commit：`content: add <slug>`、`content: update <slug>`、`style: ...`、`feat: ...`、`docs: ...`。
- 不提交 `.DS_Store`、`__pycache__/`、編輯器設定（已列在 `.gitignore`）。
