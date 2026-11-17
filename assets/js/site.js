/*
  chemprocesseng.com site script, loaded by every page:
    <script src="/assets/js/site.js" defer></script>
  1. The back-to-top button, shown once the reader has scrolled more than a screen.
  2. Site search: window.CPESearch (shared with /search/ through /assets/js/search.js) and live results
     under the search box in the navigation bar. The index, /assets/search/index.json, is rebuilt from
     every page by tools/build_search_index.py; it loads the first time someone types in the box.
*/
(function () {
  "use strict";
  if (window.CPESearch) return;  // loaded twice

  /* ---------- 1. back to top ---------- */
  if (!document.querySelector(".to-top")) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "to-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">' +
      '<path d="M9 15V3.5M3.75 8.25 9 3l5.25 5.25" fill="none" stroke="currentColor" stroke-width="1.75" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.body.appendChild(btn);

    var shown = false, ticking = false;
    var update = function () {
      ticking = false;
      var show = (window.pageYOffset || document.documentElement.scrollTop) > Math.max(600, window.innerHeight);
      if (show !== shown) { shown = show; btn.classList.toggle("is-shown", show); }
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();

    btn.addEventListener("click", function () {
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      try { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); }
      catch (e) { window.scrollTo(0, 0); }
      var home = document.querySelector(".brand");
      if (home) { try { home.focus({ preventScroll: true }); } catch (e) { home.focus(); } }
    });
  }

  /* ---------- 2. search engine ----------
     Every word must appear somewhere in a section (title, heading or text), anywhere inside a word,
     as in the NPPE guide's own search. Matches at the start of a word, in headings and in page titles
     rank higher. If no section has every word, sections with any of them are returned instead. */
  function norm(s) {
    return String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function termsOf(raw) {
    var t = [];
    norm(raw).split(" ").forEach(function (w) {
      if (w && t.indexOf(w) < 0 && (w.length > 1 || /\d/.test(w))) t.push(w);
    });
    if (!t.length) { var one = norm(raw); if (one) t.push(one.split(" ")[0]); }
    return t;
  }
  // [occurrences anywhere, occurrences at the start of a word]
  function hits(hay, term) {
    var any = 0, start = 0, i = 0;
    while ((i = hay.indexOf(term, i)) !== -1) {
      any++;
      if (i === 0 || hay.charAt(i - 1) === " ") start++;
      i += term.length;
    }
    return [any, start];
  }

  var indexPromise = null, prepared = null;
  function load() {
    if (!indexPromise) {
      indexPromise = fetch("/assets/search/index.json", { cache: "no-cache" })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (idx) {
          var pages = idx.pages || [];
          var pn = pages.map(function (p) { return { t: norm(p.t), d: norm(p.d) }; });
          prepared = {
            pages: pages,
            entries: (idx.entries || []).map(function (e, order) {
              return { e: e, order: order, pt: (pn[e.p] || {}).t || "", pd: e.a ? "" : (pn[e.p] || {}).d || "", h: norm(e.h), x: norm(e.x) };
            })
          };
          return prepared;
        })
        .catch(function (err) { indexPromise = null; throw err; });
    }
    return indexPromise;
  }

  function run(ix, raw) {
    var terms = termsOf(raw), phrase = terms.join(" "), all = [], some = [];
    if (!terms.length) return { terms: terms, mode: "all", results: [] };
    ix.entries.forEach(function (it) {
      var allIn = true, anyIn = false, score = 0;
      terms.forEach(function (t) {
        var a = hits(it.pt, t), b = hits(it.h, t), c = hits(it.x, t), d = hits(it.pd, t);
        if (a[0] + b[0] + c[0] + d[0] > 0) anyIn = true; else allIn = false;
        score += 10 * Math.min(a[0], 2) + 6 * Math.min(b[0], 2) + 3 * Math.min(d[0], 2) + Math.min(c[0], 20) +
          4 * Math.min(a[1] + b[1], 2) + Math.min(c[1], 10);
      });
      if (!anyIn) return;
      if (terms.length > 1) {
        if (it.h.indexOf(phrase) >= 0) score += 25;
        if (it.x.indexOf(phrase) >= 0) score += 15;
        if (it.pt.indexOf(phrase) >= 0) score += 15;
      }
      (allIn ? all : some).push({ e: it.e, score: score, order: it.order });
    });
    var mode = "all", res = all;
    if (!all.length && some.length && terms.length > 1) { mode = "any"; res = some; }
    res.sort(function (a, b) { return b.score - a.score || a.order - b.order; });
    return { terms: terms, mode: mode, results: res };
  }

  function marker(terms) {
    return new RegExp("(?:" + terms.slice().sort(function (a, b) { return b.length - a.length; }).map(reEsc).join("|") + ")", "gi");
  }
  function highlight(s, terms) {
    if (!terms.length) return esc(s);
    var re = marker(terms), out = "", last = 0, m;
    while ((m = re.exec(s))) {
      if (!m[0].length) { re.lastIndex++; continue; }
      out += esc(s.slice(last, m.index)) + "<mark>" + esc(m[0]) + "</mark>";
      last = m.index + m[0].length;
    }
    return out + esc(s.slice(last));
  }
  function snippet(text, terms, len) {
    var t = String(text || ""); len = len || 230;
    var m = terms.length ? marker(terms).exec(t) : null, start = 0, end = Math.min(t.length, len);
    if (m) {
      start = Math.max(0, m.index - Math.round(len / 3));
      if (start > 0) { var sp = t.indexOf(" ", start); if (sp > -1 && sp < m.index) start = sp + 1; }
      end = Math.min(t.length, start + len);
      if (end < t.length) { var sp2 = t.lastIndexOf(" ", end); if (sp2 > m.index) end = sp2; }
    } else if (end < t.length) {
      var sp3 = t.lastIndexOf(" ", end); if (sp3 > 60) end = sp3;
    }
    return (start > 0 ? "… " : "") + highlight(t.slice(start, end), terms) + (end < t.length ? " …" : "");
  }
  function urlOf(e, pages) { var p = pages[e.p] || {}; return (p.u || "/") + (e.a ? "#" + encodeURIComponent(e.a) : ""); }

  window.CPESearch = { load: load, run: run, highlight: highlight, snippet: snippet, urlOf: urlOf, esc: esc };

  /* ---------- 3. live results under the navigation search box ---------- */
  var form = document.querySelector("form.site-search");
  var input = form && form.querySelector('input[name="q"]');
  if (!form || !input || !window.fetch) return;

  var pop = document.createElement("div");
  pop.className = "search-pop"; pop.id = "search-pop"; pop.hidden = true;
  form.appendChild(pop);
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", "search-pop");
  input.setAttribute("aria-expanded", "false");

  var sel = -1, timer = null, seq = 0, SHOW = 8;
  function close() { pop.hidden = true; sel = -1; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); }
  function open() { pop.hidden = false; input.setAttribute("aria-expanded", "true"); }
  function allHref(q) { return "/search/?q=" + encodeURIComponent(q); }

  function show() {
    var q = input.value.trim(), my = ++seq;
    if (q.length < 2) { close(); return; }
    if (!prepared) { pop.innerHTML = '<p class="sp-note">Searching…</p>'; open(); }
    load().then(function (ix) {
      if (my !== seq) return;
      var r = run(ix, q), n = r.results.length;
      if (!n) {
        pop.innerHTML = '<p class="sp-note">Nothing matches “' + esc(q) + '”. Try a shorter word or a different spelling.</p>';
      } else {
        pop.innerHTML = (r.mode === "any" ? '<p class="sp-note">No section has every word; these have at least one.</p>' : "") +
          '<ol class="sp-list" role="listbox" aria-label="Search results">' + r.results.slice(0, SHOW).map(function (x, i) {
            var p = ix.pages[x.e.p] || {};
            return '<li><a id="sp-' + i + '" role="option" aria-selected="false" href="' + esc(urlOf(x.e, ix.pages)) + '">' +
              '<span class="sp-meta">' + esc(p.k || "Page") + " · " + esc(p.t || "") + "</span>" +
              '<span class="sp-title">' + highlight(x.e.h || p.t || "", r.terms) + "</span>" +
              '<span class="sp-text">' + snippet(x.e.x || p.d, r.terms, 150) + "</span></a></li>";
          }).join("") + "</ol>" +
          '<a class="sp-all" href="' + allHref(q) + '">' + (n > SHOW ? "See all " + n + " results" : "Open the results page") + " →</a>";
      }
      sel = -1; open();
    }, function () {
      if (my !== seq) return;
      pop.innerHTML = '<p class="sp-note">Search could not load. Press Enter to open the search page.</p>'; open();
    });
  }
  function move(d) {
    var links = pop.querySelectorAll(".sp-list a");
    if (!links.length) return;
    // positions 0..n: 0 is the search box itself (sel = -1), 1..n are the results
    sel = ((sel + 1 + d) % (links.length + 1) + links.length + 1) % (links.length + 1) - 1;
    for (var i = 0; i < links.length; i++) links[i].setAttribute("aria-selected", i === sel ? "true" : "false");
    if (sel >= 0) { input.setAttribute("aria-activedescendant", links[sel].id); links[sel].scrollIntoView({ block: "nearest" }); }
    else input.removeAttribute("aria-activedescendant");
  }

  input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(show, 120); });
  input.addEventListener("focus", function () { if (input.value.trim().length > 1) show(); else load().catch(function () {}); });
  input.addEventListener("keydown", function (ev) {
    if (ev.key === "ArrowDown") { ev.preventDefault(); if (pop.hidden) show(); else move(1); }
    else if (ev.key === "ArrowUp") { if (!pop.hidden) { ev.preventDefault(); move(-1); } }
    else if (ev.key === "Escape") { if (!pop.hidden) { ev.preventDefault(); close(); } }
  });
  form.addEventListener("submit", function (ev) {
    var links = pop.querySelectorAll(".sp-list a");
    if (!pop.hidden && sel >= 0 && links[sel]) { ev.preventDefault(); window.location.href = links[sel].href; }
  });
  pop.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a");
    // Same-page links (for example another section of the NPPE guide) only change the hash: close the list.
    if (a) setTimeout(close, 0);
  });
  document.addEventListener("click", function (ev) { if (!form.contains(ev.target)) close(); });
  form.addEventListener("focusout", function () { setTimeout(function () { if (!form.contains(document.activeElement)) close(); }, 0); });
})();
