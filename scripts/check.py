#!/usr/bin/env python3
"""檢查 content/pages.json 與穿搭筆記是否符合 CLAUDE.md 的規則。

用法：python3 scripts/check.py
全部通過時輸出 OK 並回傳 0；有錯誤時列出問題並回傳 1。
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
TAG_RE = re.compile(r"^[a-z0-9-]+$")
HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
SEASONS = ["春", "夏", "秋", "冬"]
PARTS = ["外套", "上身", "內搭", "下身", "鞋子", "配件"]
SECTIONS = ["## 適合情境", "## 單品清單", "## 搭配重點", "## 替換玩法", "## 避雷提醒"]
TABLE_OPTIONAL = {"basics"}  # 觀念文可以不放單品清單


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    try:
        data = json.loads((CONTENT / "pages.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        print(f"ERROR content/pages.json 無法讀取：{e}")
        return 1

    cat_ids = set()
    for c in data.get("categories", []):
        for key in ("id", "name", "icon", "color"):
            if not c.get(key):
                errors.append(f"分類缺少欄位 {key}：{c}")
        if c.get("id") in cat_ids:
            errors.append(f"分類 id 重複：{c['id']}")
        cat_ids.add(c.get("id"))
        if c.get("id") and not (CONTENT / c["id"]).is_dir():
            errors.append(f"分類 {c['id']} 沒有資料夾 content/{c['id']}/")

    seen, listed = set(), set()
    for p in data.get("pages", []):
        slug = p.get("slug", "")
        tag = f"[{slug or '?'}]"
        for key in ("slug", "title", "category", "summary", "season", "palette", "tags", "updated"):
            if not p.get(key):
                errors.append(f"{tag} 缺少欄位 {key}")
        if slug in seen:
            errors.append(f"{tag} slug 重複")
        seen.add(slug)
        if slug and not SLUG_RE.match(slug):
            errors.append(f"{tag} slug 只能用小寫英文、數字與連字號")
        cat = p.get("category")
        if cat not in cat_ids:
            errors.append(f"{tag} category「{cat}」不存在")

        season = p.get("season") or []
        if any(s not in SEASONS for s in season):
            errors.append(f"{tag} season 只能是 春/夏/秋/冬")
        elif season != sorted(season, key=SEASONS.index) or len(set(season)) != len(season):
            errors.append(f"{tag} season 需依 春→冬 排列且不重複")

        palette = p.get("palette") or []
        if not 2 <= len(palette) <= 5:
            errors.append(f"{tag} palette 需要 2～5 個顏色")
        for c in palette:
            if not HEX_RE.match(c):
                errors.append(f"{tag} palette「{c}」不是 #rrggbb 格式")

        tags = p.get("tags") or []
        if not 1 <= len(tags) <= 5:
            errors.append(f"{tag} tags 需要 1～5 個")
        for t in tags:
            if not TAG_RE.match(t):
                errors.append(f"{tag} tag「{t}」需為小寫英文")
        try:
            date.fromisoformat(p.get("updated", ""))
        except ValueError:
            errors.append(f"{tag} updated 需為 YYYY-MM-DD")
        if len(p.get("summary", "")) > 30:
            warnings.append(f"{tag} summary 超過 30 字")

        md = CONTENT / str(cat) / f"{slug}.md"
        listed.add(md.resolve())
        if not md.is_file():
            errors.append(f"{tag} 找不到檔案 {md.relative_to(ROOT)}")
            continue
        lines = md.read_text(encoding="utf-8").splitlines()
        text = "\n".join(lines)

        if not lines or not lines[0].startswith("# "):
            errors.append(f"{tag} 第一行必須是「# 標題」")
        elif lines[0][2:].strip() != p.get("title"):
            errors.append(f"{tag} Markdown 標題與 pages.json 的 title 不一致")
        if sum(1 for ln in lines if re.match(r"^#\s", ln)) > 1:
            errors.append(f"{tag} 只能有一個 # 標題")

        required = [s for s in SECTIONS if not (s == "## 單品清單" and cat in TABLE_OPTIONAL)]
        positions = []
        for sec in required:
            if sec in lines:
                positions.append(lines.index(sec))
            else:
                errors.append(f"{tag} 缺少段落「{sec}」")
        if positions != sorted(positions):
            errors.append(f"{tag} 段落順序需為：{' → '.join(s[3:] for s in required)}")

        if "## 單品清單" in lines:
            parts = [m.group(1) for m in re.finditer(r"^\|\s*([^|\s]+)\s*\|", text, re.M)]
            parts = [x for x in parts if x not in ("部位",) and not x.startswith("-")]
            bad = [x for x in parts if x not in PARTS]
            if bad:
                errors.append(f"{tag} 單品清單的部位只能是 {'/'.join(PARTS)}，發現：{bad}")
            elif parts != sorted(parts, key=PARTS.index):
                errors.append(f"{tag} 單品清單的部位順序需為 {'→'.join(PARTS)}")

        if re.search(r"<script|<[a-z]+[^>]*>", text, re.I):
            errors.append(f"{tag} Markdown 中不可包含 HTML 標籤")
        if re.search(r"#[0-9a-fA-F]{6}\b", text):
            warnings.append(f"{tag} 內文出現色碼，色碼應只放在 pages.json 的 palette")
        if len(lines) > 130:
            warnings.append(f"{tag} 超過 130 行，考慮拆成兩篇")

    for md in CONTENT.rglob("*.md"):
        if md.resolve() not in listed:
            errors.append(f"{md.relative_to(ROOT)} 沒有登記在 pages.json")

    for w in warnings:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    if errors:
        print(f"\n{len(errors)} 個錯誤")
        return 1
    print(f"OK — {len(data['categories'])} 個分類、{len(data['pages'])} 篇筆記")
    return 0


if __name__ == "__main__":
    sys.exit(main())
