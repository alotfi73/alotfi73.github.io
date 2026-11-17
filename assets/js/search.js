/*
  chemprocesseng.com search results page (/search/?q=words&page=n).
  Uses window.CPESearch from /assets/js/site.js (loaded first), which reads /assets/search/index.json.
  The deploy workflow rebuilds that index from every page on each publish (tools/build_search_index.py).
  Every word must appear somewhere in a section, anywhere inside a word; if no section has all of them,
  sections with any of them are shown instead. 20 results per page.
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

  var S = window.CPESearch;
  if (!S) { status.textContent = "Search could not start. Refresh the page."; return; }
  var esc = S.esc;

  if (!raw) {
    status.textContent = "Type a word or words to search every page on the site.";
    if (input) input.focus();
    return;
  }
  document.title = "Search: " + raw + " · Chemical Process Engineering";
  status.textContent = "Searching…";

  function href(n) { return "/search/?q=" + encodeURIComponent(raw) + (n > 1 ? "&page=" + n : ""); }

  function render(ix) {
    var r = S.run(ix, raw), res = r.results, pages = ix.pages;
    if (!r.terms.length) { status.textContent = "Type letters or numbers to search."; return; }
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
    status.innerHTML = (r.mode === "any" ? "No section contains all of these words, so these contain at least one. " : "") +
      shown + " for " + q + ".";

    list.innerHTML = slice.map(function (x) {
      var e = x.e, p = pages[e.p] || {}, url = S.urlOf(e, pages);
      var title = e.h || p.t || "";
      var meta = esc(p.k || "Page") + (e.h ? " · " + esc(p.t) : "");
      return '<li><p class="r-meta">' + meta + "</p>" +
        '<h2 class="r-title"><a href="' + esc(url) + '">' + S.highlight(title, r.terms) + "</a></h2>" +
        '<p class="r-text">' + S.snippet(e.x || p.d, r.terms) + "</p>" +
        '<p class="r-url">' + esc(decodeURIComponent(url)) + "</p></li>";
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
        ? '<li><a href="' + href(n) + '" aria-current="page">' + n + "</a></li>"
        : '<li><a href="' + href(n) + '">' + n + "</a></li>";
    }).join("") + "</ol>";
    html += pageNo < pagesCount ? '<a class="pg-step" href="' + href(pageNo + 1) + '" rel="next">Next ›</a>' : "";
    pager.innerHTML = html;
  }

  S.load().then(render, function () {
    status.textContent = "Search could not load its index. Refresh the page, or browse the sections from the menu.";
  });
})();
