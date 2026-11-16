/* 衣櫥筆記 — 首頁與筆記頁共用的程式。
 * 所有內容都從 content/pages.json 讀取；只會載入 manifest 中存在的 slug。 */
(function () {
  "use strict";

  const MANIFEST_URL = "content/pages.json";
  const SEASONS = ["春", "夏", "秋", "冬"];
  const HEX = /^#[0-9a-fA-F]{6}$/;

  // ---------- helpers ----------
  function h(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "style") node.style.cssText = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return node;
  }

  async function loadManifest() {
    const res = await fetch(MANIFEST_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error("無法載入 " + MANIFEST_URL + "（" + res.status + "）");
    const data = await res.json();
    return { ...data, cats: new Map(data.categories.map((c) => [c.id, c])) };
  }

  const pageUrl = (slug) => "page.html?p=" + encodeURIComponent(slug);
  const safeColors = (list) => (list || []).filter((c) => HEX.test(c));

  function metaRow(page, cat) {
    return h("div", { class: "card-meta" },
      h("span", { class: "cat-label", style: "--cat-color:" + cat.color }, cat.icon + " " + cat.name),
      page.season.map((s) => h("span", { class: "season" }, s)),
      page.tags.map((t) => h("span", { class: "tag" }, t)));
  }

  function showError(container, err) {
    container.replaceChildren(h("p", { class: "error" }, err.message +
      "。若是直接用 file:// 開啟，請改用 python3 -m http.server。"));
  }

  // ---------- index ----------
  async function initIndex() {
    const cardsEl = document.getElementById("cards");
    const chipsEl = document.getElementById("chips");
    const seasonsEl = document.getElementById("seasons");
    const countEl = document.getElementById("count");
    const searchEl = document.getElementById("search");

    let m;
    try { m = await loadManifest(); } catch (e) { showError(cardsEl, e); return; }

    const params = new URLSearchParams(location.search);
    const state = {
      q: "",
      cat: m.cats.has(params.get("cat")) ? params.get("cat") : "all",
      season: SEASONS.includes(params.get("season")) ? params.get("season") : "all",
    };

    function chip(label, pressed, onClick) {
      return h("button", { class: "chip", type: "button", "aria-pressed": String(pressed), onclick: onClick }, label);
    }

    function renderFilters() {
      chipsEl.replaceChildren(
        chip("全部", state.cat === "all", () => set({ cat: "all" })),
        ...m.categories.map((c) => chip(c.icon + " " + c.name, state.cat === c.id, () => set({ cat: c.id }))));
      seasonsEl.replaceChildren(
        chip("不限", state.season === "all", () => set({ season: "all" })),
        ...SEASONS.map((s) => chip(s, state.season === s, () => set({ season: s }))));
    }

    function set(patch) {
      Object.assign(state, patch);
      const qs = new URLSearchParams();
      if (state.cat !== "all") qs.set("cat", state.cat);
      if (state.season !== "all") qs.set("season", state.season);
      history.replaceState(null, "", location.pathname + (qs.toString() ? "?" + qs : ""));
      renderFilters();
      renderCards();
    }

    function matches(p) {
      if (state.cat !== "all" && p.category !== state.cat) return false;
      if (state.season !== "all" && !p.season.includes(state.season)) return false;
      if (!state.q) return true;
      const cat = m.cats.get(p.category);
      const hay = [p.title, p.summary, cat && cat.name, ...p.season, ...p.tags].join(" ").toLowerCase();
      return state.q.split(/\s+/).every((w) => hay.includes(w));
    }

    function renderCards() {
      const list = m.pages.filter(matches);
      countEl.textContent = list.length + " / " + m.pages.length + " 篇筆記";
      if (!list.length) {
        cardsEl.replaceChildren(h("p", { class: "empty" }, "沒有符合的穿搭，換個條件試試。"));
        return;
      }
      cardsEl.replaceChildren(...list.map((p) => {
        const cat = m.cats.get(p.category);
        return h("a", { class: "card", href: pageUrl(p.slug) },
          h("div", { class: "swatch-bar", "aria-hidden": "true" },
            safeColors(p.palette).map((c) => h("span", { style: "background:" + c }))),
          h("div", { class: "card-body" },
            h("h2", null, p.title),
            h("p", null, p.summary),
            metaRow(p, cat)));
      }));
    }

    searchEl.addEventListener("input", () => { state.q = searchEl.value.trim().toLowerCase(); renderCards(); });
    renderFilters();
    renderCards();
  }

  // ---------- page ----------
  function buildToc(root, tocEl) {
    const heads = [...root.querySelectorAll("h2, h3")];
    heads.forEach((el, i) => { el.id = "sec-" + (i + 1); });
    tocEl.replaceChildren(...heads.map((el) =>
      h("li", { class: el.tagName === "H3" ? "lv3" : "lv2" }, h("a", { href: "#" + el.id }, el.textContent))));

    if (!("IntersectionObserver" in window)) return;
    const links = new Map([...tocEl.querySelectorAll("a")].map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.remove("active"));
        const a = links.get(en.target.id);
        if (a) a.classList.add("active");
      });
    }, { rootMargin: "-80px 0px -70% 0px" });
    heads.forEach((el) => io.observe(el));
  }

  async function initPage() {
    const bodyEl = document.getElementById("doc-body");
    const headEl = document.getElementById("doc-head");
    const crumbsEl = document.getElementById("crumbs");
    const pagerEl = document.getElementById("pager");
    const tocEl = document.getElementById("toc");

    let m;
    try { m = await loadManifest(); } catch (e) { showError(bodyEl, e); return; }

    const slug = new URLSearchParams(location.search).get("p");
    const page = m.pages.find((p) => p.slug === slug); // 只接受 manifest 中的 slug
    if (!page) {
      bodyEl.replaceChildren(h("p", { class: "error" }, "找不到這篇筆記。"), h("p", null, h("a", { href: "./" }, "← 回首頁")));
      return;
    }
    const cat = m.cats.get(page.category);
    document.title = page.title + "｜衣櫥筆記";

    crumbsEl.replaceChildren(
      h("a", { href: "./" }, "首頁"), h("span", { class: "sep" }, "/"),
      h("a", { href: "./?cat=" + cat.id }, cat.name));

    headEl.replaceChildren(
      h("h1", null, page.title),
      metaRow(page, cat),
      h("div", { class: "palette", "aria-label": "本套配色" },
        safeColors(page.palette).map((c) =>
          h("figure", null, h("div", { class: "chip-color", style: "background:" + c }), h("figcaption", null, c)))),
      h("p", { class: "updated" }, "updated " + page.updated));

    try {
      const res = await fetch("content/" + page.category + "/" + page.slug + ".md", { cache: "no-cache" });
      if (!res.ok) throw new Error("無法載入筆記內容（" + res.status + "）");
      const md = (await res.text()).replace(/^\s*#\s+.*\n/, ""); // 標題已由 manifest 顯示
      bodyEl.innerHTML = window.marked.parse(md);
    } catch (e) { showError(bodyEl, e); return; }

    bodyEl.querySelectorAll('a[href^="http"]').forEach((a) => { a.target = "_blank"; a.rel = "noopener noreferrer"; });
    buildToc(bodyEl, tocEl);

    const all = m.pages, i = all.indexOf(page);
    const prev = all[i - 1], next = all[i + 1];
    pagerEl.replaceChildren(
      prev ? h("a", { class: "prev", href: pageUrl(prev.slug) }, h("small", null, "← 上一篇"), prev.title) : null,
      next ? h("a", { class: "next", href: pageUrl(next.slug) }, h("small", null, "下一篇 →"), next.title) : null);

    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  }

  const view = document.body.dataset.view;
  if (view === "index") initIndex();
  else if (view === "page") initPage();
})();
