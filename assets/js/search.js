/*
  chemprocesseng.com search results page (/search/?q=words&page=n).
  Reads /assets/search/index.json, which the deploy workflow rebuilds from every page on each publish
  (tools/build_search_index.py). Every word must appear; if no section has all of them, sections with
  any of them are shown instead. 20 results per page.
*/
(function () {
  "use strict";
  var PER_PAGE = 20;
  var params = new URLSearchParams(window.location.search);
  var raw = (params.get("q") || "").trim().slice(0, 200);
  var pageNo = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);

  var input = document.getElementById("q");
  var status = document.getElementById("status");
  var list = document.getElementById("results");
  var pager = document.getElementById("pager");
  var navInput = document.getElementById("site-q");
  if (input) input.value = raw;
  if (navInput) navInput.value = raw;

  function norm(s) {
    return String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  if (!raw) {
    status.textContent = "Type a word or words to search every page on the site.";
    if (input) input.focus();
    return;
  }
  document.title = "Search: " + raw + " · Chemical Process Engineering";

  var terms = [];
  norm(raw).split(" ").forEach(function (t) { if (t && terms.indexOf(t) < 0) terms.push(t); });
  if (!terms.length) { status.textContent = "Type letters or numbers to search."; return; }
  var phrase = terms.join(" ");

  status.textContent = "Searching…";

  // occurrences of a term at the start of a word
  function hits(hay, term) {
    var n = 0, i = 0, h = " " + hay, needle = " " + term;
    while ((i = h.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
    return n;
  }

  function run(idx) {
    var pages = idx.pages || [], entries = idx.entries || [];
    var pnorm = pages.map(function (p) { return { t: norm(p.t), d: norm(p.d) }; });
    var scored = [], any = [];
    entries.forEach(function (e, order) {
      var pg = pnorm[e.p] || { t: "", d: "" };
      var h = norm(e.h), x = norm(e.x);
      var intro = !e.a;
      var all = true, some = false, score = 0;
      terms.forEach(function (t) {
        var ct = hits(pg.t, t), ch = hits(h, t), cx = hits(x, t), cd = intro ? hits(pg.d, t) : 0;
        if (ct + ch + cx + cd > 0) some = true; else all = false;
        score += 10 * Math.min(ct, 2) + 6 * Math.min(ch, 2) + 3 * Math.min(cd, 2) + Math.min(cx, 20);
      });
      if (!some) return;
      if (terms.length > 1) {
        if ((" " + h + " ").indexOf(" " + phrase) >= 0) score += 25;
        if ((" " + x + " ").indexOf(" " + phrase) >= 0) score += 15;
        if ((" " + pg.t + " ").indexOf(" " + phrase) >= 0) score += 15;
      }
      var r = { e: e, score: score, order: order };
      if (all) scored.push(r); else any.push(r);
    });
    var mode = "all", res = scored;
    if (!scored.length && any.length && terms.length > 1) { mode = "any"; res = any; }
    res.sort(function (a, b) { return b.score - a.score || a.order - b.order; });
    render(res, pages, mode);
  }

  var hlRe = new RegExp("\\b(?:" + terms.map(reEsc).join("|") + ")[a-z0-9]*", "gi");
  function highlight(s) {
    var out = "", last = 0, m;
    hlRe.lastIndex = 0;
    while ((m = hlRe.exec(s))) {
      if (!m[0].length) { hlRe.lastIndex++; continue; }
      out += esc(s.slice(last, m.index)) + "<mark>" + esc(m[0]) + "</mark>";
      last = m.index + m[0].length;
    }
    return out + esc(s.slice(last));
  }
  function snippet(text, fallback) {
    var t = text || fallback || "";
    hlRe.lastIndex = 0;
    var m = hlRe.exec(t), start = 0, end = Math.min(t.length, 230);
    if (m) {
      start = Math.max(0, m.index - 80);
      if (start > 0) { var sp = t.indexOf(" ", start); if (sp > -1 && sp < m.index) start = sp + 1; }
      end = Math.min(t.length, start + 230);
      if (end < t.length) { var sp2 = t.lastIndexOf(" ", end); if (sp2 > m.index) end = sp2; }
    } else if (end < t.length) {
      var sp3 = t.lastIndexOf(" ", end); if (sp3 > 60) end = sp3;
    }
    return (start > 0 ? "… " : "") + highlight(t.slice(start, end)) + (end < t.length ? " …" : "");
  }

  function href(n) { return "/search/?q=" + encodeURIComponent(raw) + (n > 1 ? "&page=" + n : ""); }

  function render(res, pages, mode) {
    var total = res.length;
    var pagesCount = Math.max(1, Math.ceil(total / PER_PAGE));
    if (pageNo > pagesCount) pageNo = pagesCount;
    var from = (pageNo - 1) * PER_PAGE, slice = res.slice(from, from + PER_PAGE);
    var q = "“" + esc(raw) + "”";

    if (!total) {
      status.innerHTML = "No pages match " + q + ". Try fewer words, a different spelling, or browse " +
        '<a href="/lessons/">lessons</a>, <a href="/calculators/">calculators</a> and <a href="/data/">data tools</a>.';
      list.innerHTML = ""; pager.innerHTML = "";
      return;
    }
    var shown = total === 1 ? "1 result" : (from + 1) + "–" + (from + slice.length) + " of " + total + " results";
    status.innerHTML = (mode === "any"
      ? "No section contains all of these words, so these contain at least one. "
      : "") + shown + " for " + q + ".";

    list.innerHTML = slice.map(function (r) {
      var e = r.e, p = pages[e.p] || {};
      var url = p.u + (e.a ? "#" + encodeURIComponent(e.a) : "");
      var title = e.h || p.t;
      var meta = esc(p.k || "Page") + (e.h ? " · " + esc(p.t) : "");
      return '<li><p class="r-meta">' + meta + '</p>' +
        '<h2 class="r-title"><a href="' + esc(url) + '">' + highlight(title) + '</a></h2>' +
        '<p class="r-text">' + snippet(e.x, p.d) + '</p>' +
        '<p class="r-url">' + esc(url) + '</p></li>';
    }).join("");
    list.setAttribute("start", String(from + 1));

    if (pagesCount < 2) { pager.innerHTML = ""; return; }
    var nums = [], i;
    for (i = 1; i <= pagesCount; i++) {
      if (i === 1 || i === pagesCount || Math.abs(i - pageNo) <= 2) nums.push(i);
      else if (nums[nums.length - 1] !== "…") nums.push("…");
    }
    var html = pageNo > 1 ? '<a class="pg-step" href="' + href(pageNo - 1) + '" rel="prev">‹ Previous</a>' : "";
    html += '<ol class="pg-nums">' + nums.map(function (n) {
      if (n === "…") return '<li><span class="pg-gap">…</span></li>';
      return n === pageNo
        ? '<li><a href="' + href(n) + '" aria-current="page">' + n + '</a></li>'
        : '<li><a href="' + href(n) + '">' + n + '</a></li>';
    }).join("") + '</ol>';
    html += pageNo < pagesCount ? '<a class="pg-step" href="' + href(pageNo + 1) + '" rel="next">Next ›</a>' : "";
    pager.innerHTML = html;
  }

  fetch("/assets/search/index.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(run)
    .catch(function () {
      status.textContent = "Search could not load its index. Refresh the page, or browse the sections from the menu.";
    });
})();
