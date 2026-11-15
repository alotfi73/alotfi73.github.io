/* Figures 1-8, calculators and practice-problem checks. Needs js/model.js first. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var DCX = window.DC;

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) { for (var k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]); } }
    if (parent) parent.appendChild(e);
    return e;
  }
  function tx(parent, x, y, s, cls, anchor) {
    var t = el('text', { x: (+x).toFixed(1), y: (+y).toFixed(1), 'class': cls || 'lab-s', 'text-anchor': anchor || 'start' }, parent);
    s = String(s);
    if (s.indexOf('_') < 0) { t.textContent = s; return t; }
    var re = /_([A-Za-z0-9]+)/g, last = 0, m;
    while ((m = re.exec(s)) !== null) {
      if (m.index > last) { var a = document.createElementNS(NS, 'tspan'); a.textContent = s.slice(last, m.index); t.appendChild(a); }
      var sb = document.createElementNS(NS, 'tspan'); sb.setAttribute('dy', '3.5'); sb.setAttribute('font-size', '0.78em'); sb.textContent = m[1]; t.appendChild(sb);
      var back = document.createElementNS(NS, 'tspan'); back.setAttribute('dy', '-3.5'); back.textContent = '\u200a'; t.appendChild(back);
      last = re.lastIndex;
    }
    if (last < s.length) { var z = document.createElementNS(NS, 'tspan'); z.textContent = s.slice(last); t.appendChild(z); }
    return t;
  }
  function fm(v, d) {
    if (!isFinite(v)) return '–';
    var s = Math.abs(v).toLocaleString('en-CA', { minimumFractionDigits: d, maximumFractionDigits: d });
    return (v < 0 && Number(s.replace(/,/g, '')) !== 0 ? '−' : '') + s;
  }
  function sig(v, n) {
    if (!isFinite(v) || v === 0) return fm(v, 0);
    var d = Math.max(0, n - 1 - Math.floor(Math.log10(Math.abs(v))));
    return fm(v, Math.min(d, 6));
  }
  function niceStep(range, target) {
    var raw = range / target, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  }
  function niceTicks(max, target, min) {
    min = min || 0;
    var step = niceStep(max - min, target), t = [];
    for (var v = Math.ceil(min / step - 1e-9) * step; v <= max + 1e-9; v += step) t.push(+v.toFixed(6));
    return t;
  }
  function niceCeil(v, target) { var s = niceStep(v, target || 5); return Math.ceil(v / s - 1e-9) * s; }
  function widthOf(c, max) { return Math.max(280, Math.min(max || 984, Math.floor(c.clientWidth || 900))); }
  function makeSVG(c, W, H) {
    c.innerHTML = '';
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, 'aria-hidden': 'true', focusable: 'false' });
    c.appendChild(svg);
    return svg;
  }
  var clipN = 0;
  function frame(svg, o) {
    var g0 = el('g', {}, svg);
    var lx = !!o.logx;
    var fx = function (v) { return lx ? Math.log10(v) : v; };
    var sx = function (v) { return o.l + (fx(v) - fx(o.x0)) / (fx(o.x1) - fx(o.x0)) * (o.r - o.l); };
    var sy = function (v) { return o.b - (v - o.y0) / (o.y1 - o.y0) * (o.b - o.t); };
    (o.yt || []).forEach(function (v) {
      el('line', { x1: o.l, x2: o.r, y1: sy(v), y2: sy(v), 'class': 'grid' }, g0);
      tx(g0, o.l - 8, sy(v) + 4, o.yfmt ? o.yfmt(v) : fm(v, o.ydec || 0), 'tick', 'end');
    });
    (o.xt || []).forEach(function (v) {
      el('line', { x1: sx(v), x2: sx(v), y1: o.b, y2: o.b + 4, 'class': 'axis' }, g0);
      if (o.xgrid) el('line', { x1: sx(v), x2: sx(v), y1: o.t, y2: o.b, 'class': 'grid' }, g0);
      tx(g0, sx(v), o.b + 18, o.xfmt ? o.xfmt(v) : fm(v, o.xdec || 0), 'tick', 'middle');
    });
    el('line', { x1: o.l, x2: o.r, y1: o.b, y2: o.b, 'class': 'axis' }, g0);
    if (o.xl) tx(g0, o.r, o.b + 36, o.xl, 'alab', 'end');
    if (o.yl) tx(g0, o.l - (o.ylx || 40), o.t - 12, o.yl, 'alab', 'start');
    var id = 'clp' + (++clipN);
    var defs = el('defs', {}, svg);
    var cp = el('clipPath', { id: id }, defs);
    el('rect', { x: o.l, y: o.t - 2, width: o.r - o.l, height: o.b - o.t + 2 }, cp);
    return { g: g0, sx: sx, sy: sy, clip: 'url(#' + id + ')', o: o };
  }
  function path(fr, pts, cls, parent, noclip) {
    var d = '', n = 0;
    for (var i = 0; i < pts.length; i++) {
      if (!isFinite(pts[i][1]) || !isFinite(pts[i][0])) continue;
      d += (n++ ? 'L' : 'M') + fr.sx(pts[i][0]).toFixed(1) + ' ' + fr.sy(pts[i][1]).toFixed(1);
    }
    var a = { d: d, 'class': cls };
    if (!noclip) a['clip-path'] = fr.clip;
    return el('path', a, parent);
  }
  function flash(tile) {
    if (!tile || !tile.animate) return;
    tile.animate([{ backgroundColor: '#a6d7f0' }, { backgroundColor: '#ffffff' }], { duration: 1500, easing: 'cubic-bezier(0,0,0.3,1)' });
  }
  function setTile(id, text, unit, label, doFlash) {
    var t = $(id); if (!t) return;
    var v = t.querySelector('.v'), u = t.querySelector('.u'), k = t.querySelector('.k');
    if (unit !== undefined && unit !== null) u.textContent = unit;
    if (label) k.innerHTML = label;
    if (v.textContent !== text) { v.textContent = text; if (doFlash) flash(t); }
  }
  function parseNum(s) {
    s = String(s == null ? '' : s).replace(/\s/g, '').replace(/−/g, '-').replace(/,(?=\d{3}(\D|$))/g, '').replace(',', '.');
    if (s === '' || s === '-' || s === '.') return NaN;
    return Number(s);
  }
  function copyText(text, note, host) {
    var done = function () { note.textContent = 'Copied to the clipboard.'; setTimeout(function () { note.textContent = ''; }, 2500); };
    var fail = function () {
      note.textContent = 'Copying is blocked here. Select the text below instead.';
      var ta = host.querySelector('textarea.copy-fallback');
      if (!ta) { ta = document.createElement('textarea'); ta.className = 'copy-fallback'; ta.readOnly = true; ta.setAttribute('aria-label', 'Text to copy'); host.appendChild(ta); }
      ta.value = text; ta.focus(); ta.select();
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
      else fail();
    } catch (e) { fail(); }
  }
  function statusRows(box, rows) {
    box.innerHTML = rows.map(function (r) {
      return '<div class="srow"><span class="tag ' + r[0] + '">' + r[1] + '</span><span>' + r[2] + '</span></div>';
    }).join('');
  }
  function arrowDefs(svg, pre) {
    var defs = el('defs', {}, svg);
    var mk = function (id, col) {
      var m = el('marker', { id: pre + id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6.5, markerHeight: 6.5, orient: 'auto' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', fill: col }, m);
    };
    mk('V', '#12647e'); mk('L', '#ab6528'); mk('K', '#000000'); mk('D', '#5f646a');
    var d2 = el('marker', { id: pre + 'D2', viewBox: '0 0 10 10', refX: 5, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#5f646a' }, d2);
    return defs;
  }
  function arrow(svg, x1, y1, x2, y2, kind, pre) {
    var cls = kind === 'V' ? 'vflow' : kind === 'L' ? 'flow' : 'lk';
    return el('path', { d: 'M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2, 'class': cls, 'marker-end': 'url(#' + pre + kind + ')' }, svg);
  }
  function arrowPath(svg, d, kind, pre) {
    var cls = kind === 'V' ? 'vflow' : kind === 'L' ? 'flow' : 'lk';
    return el('path', { d: d, 'class': cls, 'marker-end': 'url(#' + pre + kind + ')' }, svg);
  }

  /* ---------- column sketch used by Figures 1 and 2 ---------- */
  var colN = 0;
  function drawColumn(svg, o) {
    // o: {x, y, w, h, trays, feed (1-based from top), cond, reb, steam, vfeed, topfeed, absorber, labels, N label, flows}
    var pre = 'c' + (++colN);
    arrowDefs(svg, pre);
    var x = o.x, y = o.y, w = o.w, h = o.h;
    el('rect', { x: x, y: y, width: w, height: h, rx: w / 2 > 18 ? 18 : w / 2, 'class': 'shell' }, svg);
    var nT = o.trays, show = Math.min(nT, o.maxShow || 24);
    var top = y + 16, bot = y + h - 22, sp = (bot - top) / (show + 1);
    var feedShown = o.feed ? Math.max(1, Math.min(show, Math.round(o.feed * show / nT))) : 0;
    for (var i = 1; i <= show; i++) {
      var ty = top + i * sp, left = i % 2 === 1;
      var x1 = left ? x : x + w * 0.22, x2 = left ? x + w * 0.78 : x + w;
      el('line', { x1: x1, x2: x2, y1: ty, y2: ty, 'class': i === feedShown ? 'tray-feed' : 'tray' }, svg);
    }
    if (show < nT) {
      var yb = top + (show + 1) * sp - sp * 0.5;
      tx(svg, x + w / 2, Math.min(yb + 4, y + h - 6), '≈', 'lab-s', 'middle');
    }
    if (o.nLabel) tx(svg, x + w / 2, y + h + 34, o.nLabel, 'zone-s', 'middle');
    var fy = feedShown ? top + feedShown * sp - 6 : y + h / 2;
    var lab = o.labels || {};
    // feed
    if (o.topfeed) {
      arrow(svg, x - 34, top + sp - 6, x - 3, top + sp - 6, 'L', pre);
      tx(svg, x - 36, top + sp - 12, lab.F || 'Feed', 'zone', 'end');
    } else if (o.vfeed) {
      arrow(svg, x - 34, y + h - 14, x - 3, y + h - 14, 'V', pre);
      tx(svg, x - 36, y + h - 20, lab.F || 'Vapour feed', 'zone', 'end');
    } else if (o.flash) {
      // nothing
    } else {
      arrow(svg, x - 34, fy, x - 3, fy, o.feedKind || 'L', pre);
      tx(svg, x - 36, fy - 6, lab.F || 'Feed', 'zone', 'end');
    }
    if (o.absorber) {
      arrow(svg, x - 34, top + sp - 6, x - 3, top + sp - 6, 'L', pre);
      tx(svg, x - 36, top + sp - 12, lab.S || 'Lean oil', 'zone', 'end');
    }
    // top
    var cx = x + w + 30;
    if (o.cond) {
      arrowPath(svg, 'M' + (x + w / 2) + ' ' + y + ' L' + (x + w / 2) + ' ' + (y - 14) + ' L' + (cx - 10) + ' ' + (y - 14), 'V', pre);
      el('circle', { cx: cx, cy: y - 14, r: 10, 'class': 'hx' }, svg);
      el('path', { d: 'M' + (cx - 7) + ' ' + (y - 10) + ' l4 -6 l4 6 l4 -6', 'class': 'shell-line', style: 'stroke-width:1.2' }, svg);
      el('rect', { x: cx - 14, y: y + 6, width: 28, height: 14, rx: 7, 'class': 'shell' }, svg);
      el('line', { x1: cx, x2: cx, y1: y - 4, y2: y + 6, 'class': 'shell-line' }, svg);
      arrowPath(svg, 'M' + (cx - 14) + ' ' + (y + 15) + ' L' + (x + w + 3) + ' ' + (y + 15), 'L', pre);
      arrow(svg, cx + 14, y + 13, cx + 40, y + 13, 'L', pre);
      tx(svg, cx + 42, y + 17, lab.D || 'Distillate', 'zone');
      tx(svg, cx, y + 34, lab.R || 'Reflux', 'zone-s', 'middle');
    } else if (!o.flash) {
      arrowPath(svg, 'M' + (x + w / 2) + ' ' + y + ' L' + (x + w / 2) + ' ' + (y - 14) + ' L' + (x + w + 36) + ' ' + (y - 14), 'V', pre);
      tx(svg, x + w + 40, y - 10, lab.D || 'Overhead vapour', 'zone');
    }
    // bottom
    var by = y + h;
    if (o.reb) {
      el('circle', { cx: cx, cy: by - 18, r: 10, 'class': 'hx' }, svg);
      el('path', { d: 'M' + (cx - 7) + ' ' + (by - 14) + ' l4 -6 l4 6 l4 -6', 'class': 'shell-line', style: 'stroke-width:1.2' }, svg);
      el('path', { d: 'M' + (x + w) + ' ' + (by - 8) + ' L' + (cx - 6) + ' ' + (by - 8) + ' L' + (cx - 6) + ' ' + (by - 10), 'class': 'flow' }, svg);
      arrowPath(svg, 'M' + cx + ' ' + (by - 28) + ' L' + cx + ' ' + (by - 34) + ' L' + (x + w + 3) + ' ' + (by - 34), 'V', pre);
      arrowPath(svg, 'M' + (x + w / 2) + ' ' + by + ' L' + (x + w / 2) + ' ' + (by + 12) + ' L' + (x + w + 36) + ' ' + (by + 12), 'L', pre);
      tx(svg, x + w + 40, by + 16, lab.B || 'Bottoms', 'zone');
      tx(svg, cx + 14, by - 30, lab.Q || 'Reboiler', 'zone-s');
    } else {
      arrowPath(svg, 'M' + (x + w / 2) + ' ' + by + ' L' + (x + w / 2) + ' ' + (by + 12) + ' L' + (x + w + 36) + ' ' + (by + 12), 'L', pre);
      tx(svg, x + w + 40, by + 16, lab.B || 'Bottoms', 'zone');
    }
    if (o.steam) {
      arrow(svg, x + w + 36, by - 14, x + w + 3, by - 14, 'V', pre);
      tx(svg, x + w + 40, by - 10, lab.S || 'Live steam', 'zone');
    }
  }

  /* =========================================================
     Figure 1: McCabe–Thiele with and without reflux or reboiler
     ========================================================= */
  var f1 = { cfg: 'full', sys: 'alpha', alpha: 2.5, zF: 0.40, q: 1, xD: 0.95, xB: 0.05, m: 1.3 };
  var eqCache = {};
  var f1res = null;
  function getE(sys, alpha) {
    if (sys === 'alpha') return DCX.eqTable({ alpha: alpha });
    if (!eqCache[sys]) eqCache[sys] = DCX.eqTable({ sys: sys, P: 101.325 });
    return eqCache[sys];
  }
  var F1S = {
    ex2: { cfg: 'full', sys: 'alpha', alpha: 2.5, zF: 0.40, q: 1, xD: 0.95, xB: 0.05, m: 1.3 },
    ex4: { cfg: 'strip', sys: 'alpha', alpha: 4, zF: 0.30, q: 1, xD: 0.95, xB: 0.01, m: 1.5 },
    ex5: { cfg: 'rect', sys: 'alpha', alpha: 2.5, zF: 0.50, q: 0, xD: 0.95, xB: 0.05, m: 1.5 },
    ex6: { cfg: 'steam', sys: 'mw', alpha: 2.5, zF: 0.30, q: 1, xD: 0.95, xB: 0.01, m: 1.3 },
    az: { cfg: 'full', sys: 'ew', alpha: 2.5, zF: 0.10, q: 1, xD: 0.85, xB: 0.005, m: 1.3 }
  };
  function compute1() {
    var E = getE(f1.sys, f1.alpha), r = { E: E, err: null, info: [], work: [] };
    var az = f1.sys === 'ew' ? DCX.azeotrope(E) : null;
    r.az = az;
    var sysName = f1.sys === 'alpha' ? 'constant α = ' + fm(f1.alpha, 2) : DCX.SYS[f1.sys].name + ', ' + DCX.SYS[f1.sys].model;
    if (f1.cfg === 'full' || f1.cfg === 'steam') {
      var o = { zF: f1.zF, q: f1.q, xD: f1.xD, xB: f1.xB, steam: f1.cfg === 'steam' };
      if (!(f1.xB < f1.zF && f1.zF < f1.xD)) { r.err = 'Set x<sub>B</sub> &lt; z<sub>F</sub> &lt; x<sub>D</sub>.'; return r; }
      if (az && f1.xD >= az.x - 0.003) { r.err = 'x<sub>D</sub> is at or beyond the azeotrope (x = ' + fm(az.x, 3) + ' in this model). No reflux ratio and no number of stages can reach it: see section 05.'; return r; }
      var Rm = DCX.rminFull(E, o);
      if (!isFinite(Rm)) { r.err = 'No reflux ratio gives a feasible column for these settings.'; return r; }
      var R = Rm * f1.m, st = DCX.stepFull(E, o, R), bal = DCX.balanceFull(o, R);
      if (bal.Vb <= 0) { r.err = 'Not enough vapour below the feed: raise the reflux or make the feed more liquid (higher q).'; return r; }
      if (!st.ok) { r.err = 'More than 400 stages: move away from the pinch.'; return r; }
      r.o = o; r.Rm = Rm; r.R = R; r.st = st; r.bal = bal;
      r.tiles = [
        [fm(Rm, 3), '', 'Minimum reflux ratio'],
        [fm(R, 3), '', 'Reflux ratio, L/D'],
        [fm(st.Nfrac, 1), f1.cfg === 'steam' ? 'trays' : 'stages', f1.cfg === 'steam' ? 'Theoretical trays; no reboiler' : 'Theoretical stages, including the reboiler'],
        [String(st.feed), '', 'Feed stage from the top']
      ];
      var w = r.work;
      w.push('Mixture: ' + sysName + '; configuration: ' + (f1.cfg === 'steam' ? 'condenser and reflux, live steam under the bottom tray' : 'total condenser and partial reboiler') + '.');
      if (f1.cfg === 'full') w.push('Balance per 100 kmol/h: D = 100 × (' + fm(f1.zF, 3) + ' − ' + fm(f1.xB, 3) + ')/(' + fm(f1.xD, 3) + ' − ' + fm(f1.xB, 3) + ') = ' + fm(bal.D, 2) + ';  B = ' + fm(bal.B, 2));
      else w.push('Balance with steam, eq. (12): D = F(z_F − q x_B)/(x_D + R x_B) = ' + fm(bal.D, 2) + ';  S = V − (1 − q)F = ' + fm(bal.S, 2) + ';  B = L + qF = ' + fm(bal.B, 2));
      if (f1.sys === 'alpha' && Math.abs(f1.q - 1) < 1e-9 && f1.cfg === 'full') w.push('Underwood, eq. (15): R_min = [' + fm(f1.xD, 3) + '/' + fm(f1.zF, 3) + ' − ' + fm(f1.alpha, 2) + ' × ' + fm(1 - f1.xD, 3) + '/' + fm(1 - f1.zF, 3) + '] / ' + fm(f1.alpha - 1, 2) + ' = ' + fm(DCX.underwoodBinary(f1.xD, f1.zF, f1.alpha), 3));
      w.push('R_min found where the operating lines first touch the equilibrium curve: ' + fm(Rm, 3) + ';  R = ' + fm(f1.m, 2) + ' × ' + fm(Rm, 3) + ' = ' + fm(R, 3));
      w.push('Rectifying line: y = ' + fm(st.sR, 4) + ' x + ' + fm(st.bR, 4) + ';  meets the q-line at x = ' + fm(st.xi, 4) + ', y = ' + fm(st.yi, 4));
      w.push('Stripping line through (' + fm(f1.xB, 3) + ', ' + (o.steam ? '0' : fm(f1.xB, 3)) + ') with slope L̄/V̄ = ' + fm(st.sS, 4));
      w.push('L = ' + fm(bal.L, 2) + ', V = ' + fm(bal.V, 2) + ', L̄ = ' + fm(bal.Lb, 2) + ', V̄ = ' + fm(bal.Vb, 2) + ' kmol/h per 100 kmol/h of feed');
      w.push('Stepping from the top: ' + st.N + ' steps, the last one ' + fm(st.Nfrac - st.N + 1, 2) + ' of a stage → ' + fm(st.Nfrac, 2) + (o.steam ? ' trays' : ' stages incl. reboiler') + '; feed on stage ' + st.feed);
      if (f1.sys === 'alpha') {
        var Nmin = DCX.fenske(f1.xD, f1.xB, f1.alpha);
        w.push('Fenske, eq. (16): N_min = ' + fm(Nmin, 2) + ';  Gilliland (Molokanov), eq. (24): N ≈ ' + fm(DCX.molokanov(R, Rm, Nmin), 2));
      }
      if (az) r.info.push(['inf', 'Azeotrope', 'This model puts the ethanol–water azeotrope at x = ' + fm(az.x, 3) + '; the measured value is 0.895.']);
      if (f1.cfg === 'steam') r.info.push(['inf', 'Live steam', 'Light component lost in the bottoms: ' + fm(bal.B * f1.xB, 2) + ' kmol/h per 100 kmol/h of feed (' + fm(100 * bal.B * f1.xB / (100 * f1.zF), 1) + ' % of the feed’s).']);
      else r.info.push(['inf', 'Recovery', 'Light component recovered in the distillate: ' + fm(100 * bal.D * f1.xD / (100 * f1.zF), 1) + ' %.']);
      r.flows = [['Feed, F', 100], ['Distillate, D', bal.D], ['Bottoms, B', bal.B], ['Reflux, L', bal.L], ['Vapour to condenser, V', bal.V], [o.steam ? 'Live steam, S' : 'Boil-up, V̄', bal.Vb]];
    } else if (f1.cfg === 'strip') {
      var os = { zF: f1.zF, xB: f1.xB };
      if (!(f1.xB < f1.zF)) { r.err = 'Set x<sub>B</sub> &lt; z<sub>F</sub>.'; return r; }
      var dfm = DCX.stripMinDF(E, os), DF = dfm * f1.m;
      if (DF >= 0.999) { r.err = 'At this boil-up nearly all the feed goes overhead; lower the multiple.'; return r; }
      var ss = DCX.stepStrip(E, os, DF);
      if (!ss.ok) { r.err = 'More than 400 stages: raise the boil-up.'; return r; }
      r.os = os; r.DF = DF; r.dfm = dfm; r.ss = ss;
      r.tiles = [
        [fm(dfm, 3), '', 'Minimum boil-up, V̄/F'],
        [fm(DF, 3), '', 'Boil-up, V̄/F'],
        [fm(ss.Nfrac, 1), 'stages', 'Theoretical stages, including the reboiler'],
        [fm(ss.yD, 3), '', 'Overhead vapour, y<sub>D</sub>']
      ];
      var ys = DCX.yStar(E, f1.zF);
      r.work.push('Mixture: ' + sysName + '; saturated-liquid feed on the top tray, reboiler, no condenser.');
      r.work.push('Pinch at the top: y*(z_F) = ' + fm(ys, 4) + ' is the richest overhead possible.');
      r.work.push('Steepest operating line from (' + fm(f1.xB, 3) + ', ' + fm(f1.xB, 3) + '): L̄/V̄ max = ' + fm(1 / dfm, 4) + ' → (V̄/F)min = ' + fm(dfm, 4));
      r.work.push('V̄/F = ' + fm(f1.m, 2) + ' × ' + fm(dfm, 4) + ' = ' + fm(DF, 4) + ';  y_D = [z_F − (1 − V̄/F) x_B]/(V̄/F) = ' + fm(ss.yD, 4));
      r.work.push('Operating line: y = ' + fm(ss.s, 4) + ' x − ' + fm((ss.s - 1) * f1.xB, 5));
      r.work.push('Stepping down from (' + fm(f1.zF, 3) + ', ' + fm(ss.yD, 4) + '): ' + fm(ss.Nfrac, 2) + ' stages including the reboiler');
      r.info.push(['inf', 'Recovery', 'Light component recovered overhead: ' + fm(100 * DF * ss.yD / f1.zF, 1) + ' %; overhead purity is capped at y*(z<sub>F</sub>) = ' + fm(ys, 3) + '.']);
      r.flows = [['Feed, F (liquid, to top tray)', 100], ['Overhead vapour, D = V̄', 100 * DF], ['Bottoms, B', 100 * (1 - DF)], ['Liquid in the column, L̄ = F', 100], ['Boil-up, V̄', 100 * DF]];
    } else {
      var or = { zF: f1.zF, xD: f1.xD };
      if (!(f1.zF < f1.xD)) { r.err = 'Set z<sub>F</sub> &lt; x<sub>D</sub>.'; return r; }
      if (az && f1.xD >= az.x - 0.003) { r.err = 'x<sub>D</sub> is at or beyond the azeotrope (x = ' + fm(az.x, 3) + ' in this model).'; return r; }
      var Rm2 = DCX.rectMinR(E, or), R2 = Rm2 * f1.m, sr = DCX.stepRect(E, or, R2);
      if (!(sr.xB > 0 && sr.xB < f1.zF)) { r.err = 'No feasible bottoms composition at this reflux.'; return r; }
      if (!sr.ok) { r.err = 'More than 400 stages: raise the reflux.'; return r; }
      r.or = or; r.Rm = Rm2; r.R = R2; r.sr = sr;
      var Dd = 100 / (R2 + 1);
      r.tiles = [
        [fm(Rm2, 3), '', 'Minimum reflux ratio'],
        [fm(R2, 3), '', 'Reflux ratio, L/D'],
        [fm(sr.Nfrac, 1), 'trays', 'Theoretical trays; no reboiler'],
        [fm(sr.xB, 3), '', 'Bottom liquid, x<sub>B</sub>']
      ];
      var xs = DCX.xStar(E, f1.zF);
      r.work.push('Mixture: ' + sysName + '; saturated-vapour feed under the bottom tray, condenser and reflux, no reboiler.');
      r.work.push('Pinch at the bottom: x*(z_F) = ' + fm(xs, 4) + ' is the leanest bottom liquid possible.');
      r.work.push('R_min from the line through (' + fm(f1.xD, 3) + ', ' + fm(f1.xD, 3) + ') touching the curve: ' + fm(Rm2, 3) + ';  R = ' + fm(R2, 3));
      r.work.push('Operating line: y = ' + fm(sr.s, 4) + ' x + ' + fm(sr.b, 4) + ';  x_B = (z_F − ' + fm(sr.b, 4) + ')/' + fm(sr.s, 4) + ' = ' + fm(sr.xB, 4));
      r.work.push('V = F = 100 kmol/h;  D = V/(R + 1) = ' + fm(Dd, 2) + ';  B = L = ' + fm(100 - Dd, 2));
      r.work.push('Stepping from the top: ' + fm(sr.Nfrac, 2) + ' theoretical trays');
      r.info.push(['inf', 'Recovery', 'Light component recovered in the distillate: ' + fm(100 * Dd * f1.xD / (100 * f1.zF), 1) + ' %; bottoms can be no leaner than x*(z<sub>F</sub>) = ' + fm(xs, 3) + '.']);
      r.flows = [['Feed, F (vapour, under bottom tray)', 100], ['Distillate, D', Dd], ['Bottoms, B = L', 100 - Dd], ['Reflux, L', 100 - Dd], ['Vapour in the column, V = F', 100]];
    }
    return r;
  }
  function draw1() {
    var c = $('f1-chart'); if (!c) return;
    var W = widthOf(c, 620), H = Math.min(W, 560);
    var svg = makeSVG(c, W, H);
    var pre = 'm1'; arrowDefs(svg, pre);
    var small = W < 460;
    var fr = frame(svg, { l: 46, r: W - 14, t: 18, b: H - 42, x0: 0, x1: 1, y0: 0, y1: 1, xt: small ? [0, 0.2, 0.4, 0.6, 0.8, 1] : [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], yt: small ? [0, 0.2, 0.4, 0.6, 0.8, 1] : [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], xdec: 1, ydec: 1, xgrid: true, xl: 'Liquid mole fraction of the light component, x', yl: 'Vapour, y', ylx: 40 });
    var r = f1res; if (!r) return;
    var E = r.E;
    path(fr, [[0, 0], [1, 1]], 'lm', svg);
    var pts = []; for (var i = 0; i <= 200; i++) { var x = i / 200; pts.push([x, DCX.yStar(E, x)]); }
    path(fr, pts, 'l1', svg);
    var lx = 0.62, ly = DCX.yStar(E, lx);
    tx(svg, fr.sx(lx) - 10, fr.sy(ly) - 16, 'Equilibrium curve', 'lab t1', 'end');
    tx(svg, fr.sx(0.86), fr.sy(0.86) + 18, '45° line', 'lab-s', 'start');
    if (r.az) {
      el('circle', { cx: fr.sx(r.az.x), cy: fr.sy(r.az.x), r: 5, style: 'fill:#fff;stroke:#000;stroke-width:1.5' }, svg);
      tx(svg, fr.sx(r.az.x) - 8, fr.sy(r.az.x) - 10, 'Azeotrope', 'lab tk', 'end');
    }
    if (r.err) return;
    var mark = function (v, lab) {
      el('line', { x1: fr.sx(v), x2: fr.sx(v), y1: fr.sy(v), y2: fr.o.b, 'class': 'lm dash', style: 'stroke-width:1' }, svg);
      el('circle', { cx: fr.sx(v), cy: fr.sy(v), r: 3.5, style: 'fill:#000' }, svg);
      tx(svg, fr.sx(v) + 4, fr.o.b - 6, lab, 'lab-s', 'start');
    };
    var steps, opAt, last;
    if (r.st) {
      var st = r.st;
      mark(f1.xD, 'x_D'); mark(f1.xB, 'x_B'); if (Math.abs(f1.zF - f1.xB) > 0.04 && Math.abs(f1.xD - f1.zF) > 0.04) mark(f1.zF, 'z_F');
      path(fr, [[f1.xD, f1.xD], [st.xi, st.yi]], 'lk', svg);
      path(fr, [[st.xi, st.yi], [f1.xB, st.yB]], 'lk', svg);
      if (Math.abs(f1.q - 1) < 1e-9) path(fr, [[f1.zF, f1.zF], [st.xi, Math.min(1, st.yi + 0.08)]], 'l2 dash', svg);
      else {
        var qs = f1.q / (f1.q - 1), qx2 = st.xi + (st.xi - f1.zF) * 0.35;
        path(fr, [[f1.zF, f1.zF], [qx2, f1.zF + qs * (qx2 - f1.zF)]], 'l2 dash', svg);
      }
      tx(svg, fr.sx(f1.zF) + 6, fr.sy(0.5 * (f1.zF + st.yi)) + 4, 'q-line', 'lab t2', 'start');
      var mx = 0.5 * (st.xi + f1.xD);
      tx(svg, fr.sx(mx) + 6, fr.sy(st.sR * mx + st.bR) + 16, 'Rectifying line', 'lab tk', 'start');
      var mx2 = f1.xB + (f1.cfg === 'steam' ? 0.3 : 0.55) * (st.xi - f1.xB);
      if (st.xi - f1.xB > 0.12) tx(svg, fr.sx(mx2) + 6, fr.sy(st.yB + st.sS * (mx2 - f1.xB)) + 16, f1.cfg === 'steam' ? 'Stripping line to (x_B, 0)' : 'Stripping line', 'lab tk', 'start');
      steps = st.steps;
      opAt = function (x) { return x >= st.xi ? st.sR * x + st.bR : st.yB + st.sS * (x - f1.xB); };
      last = function (x) { return f1.cfg === 'steam' ? Math.max(0, opAt(x)) : x; };
    } else if (r.ss) {
      var ss = r.ss;
      mark(f1.xB, 'x_B'); mark(f1.zF, 'z_F');
      path(fr, [[f1.xB, f1.xB], [f1.zF, ss.yD]], 'lk', svg);
      var yst = DCX.yStar(E, f1.zF);
      el('circle', { cx: fr.sx(f1.zF), cy: fr.sy(yst), r: 4, style: 'fill:#fff;stroke:#ab6528;stroke-width:1.5' }, svg);
      tx(svg, fr.sx(f1.zF) + 8, fr.sy(yst) + 4, 'Richest possible overhead, y*(z_F)', 'lab t2', 'start');
      tx(svg, fr.sx(f1.zF) + 8, fr.sy(ss.yD) + 14, 'Top of column: feed in, y_D out', 'lab tk', 'start');
      steps = ss.steps;
      opAt = function (x) { return ss.s * x - (ss.s - 1) * f1.xB; };
      last = function (x) { return x; };
    } else if (r.sr) {
      var sr = r.sr;
      mark(f1.xD, 'x_D');
      path(fr, [[f1.xD, f1.xD], [sr.xB, f1.zF]], 'lk', svg);
      var xst = DCX.xStar(E, f1.zF);
      el('circle', { cx: fr.sx(xst), cy: fr.sy(f1.zF), r: 4, style: 'fill:#fff;stroke:#ab6528;stroke-width:1.5' }, svg);
      tx(svg, fr.sx(xst) - 8, fr.sy(f1.zF) - 8, 'Limit, x*(z_F)', 'lab t2', 'end');
      el('circle', { cx: fr.sx(sr.xB), cy: fr.sy(f1.zF), r: 3.5, style: 'fill:#000' }, svg);
      tx(svg, fr.sx(sr.xB) + 8, fr.sy(f1.zF) + 16, 'Bottom: vapour feed in, x_B out', 'lab tk', 'start');
      steps = sr.steps;
      opAt = function (x) { return sr.s * x + sr.b; };
      last = function (x) { return Math.max(0, opAt(x)); };
    }
    var g = el('g', { 'clip-path': fr.clip }, svg);
    var n = steps.length, feedStage = r.st ? r.st.feed : 0;
    for (var k = 0; k < n; k++) {
      var s = steps[k], xp = s[0], y = s[1], x2 = s[2];
      var yn = k < n - 1 ? steps[k + 1][1] : last(x2);
      var cls = (k + 1 === feedStage) ? 'l2' : 'lk-thin';
      el('path', { d: 'M' + fr.sx(xp).toFixed(1) + ' ' + fr.sy(y).toFixed(1) + ' L' + fr.sx(x2).toFixed(1) + ' ' + fr.sy(y).toFixed(1) + ' L' + fr.sx(x2).toFixed(1) + ' ' + fr.sy(yn).toFixed(1), 'class': cls, style: cls === 'l2' ? 'stroke-width:2' : '' }, g);
      var every = n > 40 ? 10 : n > 20 ? 5 : 1;
      if ((k + 1) % every === 0 || k === 0) tx(svg, fr.sx(x2) - 4, fr.sy(y) - 5, String(k + 1), 'lab-s', 'end');
    }
  }
  function drawCol1() {
    var c = $('f1-col'); if (!c) return;
    var W = widthOf(c, 420), H = 280;
    var svg = makeSVG(c, W, H);
    var r = f1res;
    if (!r || r.err) { tx(svg, W / 2, H / 2, 'No feasible column', 'lab-s', 'middle'); return; }
    var cx = Math.max(84, W * 0.30), w = 46;
    if (r.st) {
      var N = r.st.N, trays = f1.cfg === 'steam' ? N : Math.max(1, N - 1);
      drawColumn(svg, { x: cx, y: 34, w: w, h: H - 80, trays: trays, feed: r.st.feed, cond: true, reb: f1.cfg === 'full', steam: f1.cfg === 'steam', feedKind: f1.q < 0.5 ? 'V' : 'L', nLabel: fm(r.st.Nfrac, 1) + (f1.cfg === 'steam' ? ' theoretical trays' : ' stages incl. reboiler') });
    } else if (r.ss) {
      drawColumn(svg, { x: cx, y: 34, w: w, h: H - 80, trays: Math.max(1, r.ss.N - 1), topfeed: true, cond: false, reb: true, nLabel: fm(r.ss.Nfrac, 1) + ' stages incl. reboiler' });
    } else if (r.sr) {
      drawColumn(svg, { x: cx, y: 34, w: w, h: H - 80, trays: r.sr.N, vfeed: true, cond: true, reb: false, nLabel: fm(r.sr.Nfrac, 1) + ' theoretical trays' });
    }
  }
  function update1(doFlash) {
    f1res = compute1();
    var r = f1res;
    if (r.err) {
      ['t1a', 't1b', 't1c', 't1d'].forEach(function (id) { setTile(id, '–', null, null, false); });
      statusRows($('f1-status'), [['err', 'Not feasible', r.err]]);
      $('f1-flows').innerHTML = '';
      $('f1-work').innerHTML = '';
    } else {
      var ids = ['t1a', 't1b', 't1c', 't1d'];
      r.tiles.forEach(function (t, i) { setTile(ids[i], t[0], t[1], t[2], doFlash); });
      statusRows($('f1-status'), r.info);
      $('f1-flows').innerHTML = r.flows.map(function (f) { return '<tr><td>' + f[0] + '</td><td class="num">' + fm(f[1], 1) + '</td></tr>'; }).join('');
      $('f1-work').innerHTML = r.work.map(function (s) { return '<li>' + s + '</li>'; }).join('');
    }
    draw1(); drawCol1();
  }
  function syncControls1() {
    var on = {
      alpha: f1.sys === 'alpha',
      q: f1.cfg === 'full' || f1.cfg === 'steam',
      xd: f1.cfg !== 'strip',
      xb: f1.cfg !== 'rect'
    };
    [['alpha', 'c-alpha', 'f1-alpha'], ['q', 'c-q', 'f1-q'], ['xd', 'c-xd', 'f1-xd'], ['xb', 'c-xb', 'f1-xb']].forEach(function (a) {
      var box = $(a[1]), inp = $(a[2]);
      box.classList.toggle('off', !on[a[0]]);
      inp.disabled = !on[a[0]];
    });
    var ml = $('f1-m-l');
    ml.firstChild.textContent = f1.cfg === 'strip' ? 'Boil-up, multiple of minimum ' : 'Reflux, multiple of minimum ';
    $('f1-alpha').value = f1.alpha; $('f1-zf').value = f1.zF; $('f1-q').value = f1.q; $('f1-xd').value = f1.xD; $('f1-xb').value = f1.xB; $('f1-m').value = f1.m;
    $('f1-alpha-v').textContent = fm(f1.alpha, 2);
    $('f1-zf-v').textContent = fm(f1.zF, 2);
    $('f1-q-v').textContent = f1.cfg === 'strip' ? '1 (fixed)' : f1.cfg === 'rect' ? '0 (fixed)' : fm(f1.q, 2);
    $('f1-xd-v').textContent = f1.cfg === 'strip' ? 'not specified' : fm(f1.xD, 3);
    $('f1-xb-v').textContent = f1.cfg === 'rect' ? 'not specified' : fm(f1.xB, 3);
    $('f1-m-v').textContent = fm(f1.m, 2) + ' ×';
    $('f1-sys').value = f1.sys;
    Array.prototype.forEach.call(document.querySelectorAll('[data-cfg]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-cfg') === f1.cfg ? 'true' : 'false'); });
  }
  function init1() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-cfg]'), function (b) {
      b.addEventListener('click', function () { f1.cfg = b.getAttribute('data-cfg'); syncControls1(); update1(true); });
    });
    $('f1-sys').addEventListener('change', function () { f1.sys = this.value; syncControls1(); update1(true); });
    var map = [['f1-alpha', 'alpha'], ['f1-zf', 'zF'], ['f1-q', 'q'], ['f1-xd', 'xD'], ['f1-xb', 'xB'], ['f1-m', 'm']];
    map.forEach(function (a) {
      var inp = $(a[0]);
      inp.addEventListener('input', function () { f1[a[1]] = Number(inp.value); syncControls1(); update1(false); });
      inp.addEventListener('change', function () { f1[a[1]] = Number(inp.value); syncControls1(); update1(true); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-preset]'), function (b) {
      b.addEventListener('click', function () {
        var p = F1S[b.getAttribute('data-preset')];
        for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k)) f1[k] = p[k];
        syncControls1(); update1(true);
      });
    });
    $('f1-copy').addEventListener('click', function () {
      var r = f1res; if (!r || r.err) { $('f1-copy-note').textContent = 'Nothing to copy: the current settings are not feasible.'; return; }
      var steps = r.st ? r.st.steps : r.ss ? r.ss.steps : r.sr.steps;
      var lines = ['stage,y_vapour_leaving,x_liquid_leaving'];
      steps.forEach(function (s, i) { lines.push([i + 1, s[1].toFixed(5), s[2].toFixed(5)].join(',')); });
      copyText('# ' + f1.cfg + ', ' + f1.sys + (f1.sys === 'alpha' ? ' alpha=' + f1.alpha : '') + ', zF=' + f1.zF + ', xD=' + f1.xD + ', xB=' + f1.xB + ', q=' + f1.q + ', multiple=' + f1.m + '\n' + lines.join('\n'), $('f1-copy-note'), $('fig1'));
    });
    syncControls1(); update1(false);
  }

  /* =========================================================
     Figure 2: configuration gallery
     ========================================================= */
  var CFGS = [
    { t: 'Full column', p: 'Condenser with reflux and a reboiler. Both products can be made pure.', o: { trays: 8, feed: 4, cond: true, reb: true } },
    { t: 'Stripper, no reflux', p: 'Liquid feed on the top tray, reboiler at the bottom. Clean bottoms; the overhead is no richer than y*(z<sub>F</sub>).', o: { trays: 7, topfeed: true, cond: false, reb: true } },
    { t: 'Rectifier, no reboiler', p: 'Vapour feed under the bottom tray, condenser and reflux at the top. Pure distillate; the bottoms are no leaner than x*(z<sub>F</sub>).', o: { trays: 7, vfeed: true, cond: true, reb: false } },
    { t: 'Live steam, no reboiler', p: 'Steam blown in under the bottom tray. Saves a reboiler when water is the heavy component, but the bottoms grow.', o: { trays: 8, feed: 4, cond: true, reb: false, steam: true } },
    { t: 'Reboiled absorber', p: 'A lean liquid on top absorbs the heavier components; a reboiler strips the light ones out of the bottoms.', o: { trays: 8, feed: 4, feedKind: 'V', cond: false, reb: true, absorber: true, labels: { D: 'Lean gas', F: 'Gas feed' } } },
    { t: 'Flash drum', p: 'One equilibrium stage: no reflux, no reboiler. Useful as a pre-flash, rarely as a final separation.', flash: true }
  ];
  function draw2() {
    var grid = $('f2-grid'); if (!grid) return;
    if (!grid.children.length) {
      grid.innerHTML = CFGS.map(function (c, i) { return '<div class="cfg"><h4>' + c.t + '</h4><div class="chart" id="f2-c' + i + '"></div><p>' + c.p + '</p></div>'; }).join('');
    }
    CFGS.forEach(function (c, i) {
      var box = $('f2-c' + i), W = widthOf(box, 320), H = 220;
      var svg = makeSVG(box, W, H);
      if (c.flash) {
        var pre = 'fl'; arrowDefs(svg, pre);
        var cx = W * 0.45, dw = 54, dh = 120, top = 46;
        el('rect', { x: cx - dw / 2, y: top, width: dw, height: dh, rx: 22, 'class': 'shell' }, svg);
        el('rect', { x: cx - dw / 2 + 1, y: top + dh * 0.62, width: dw - 2, height: dh * 0.38 - 12, 'class': 'liq' }, svg);
        el('line', { x1: cx - dw / 2 + 1, x2: cx + dw / 2 - 1, y1: top + dh * 0.62, y2: top + dh * 0.62, 'class': 'liq-line' }, svg);
        arrow(svg, cx - dw / 2 - 50, top + dh * 0.45, cx - dw / 2 - 3, top + dh * 0.45, 'L', pre);
        el('path', { d: 'M' + (cx - dw / 2 - 30) + ' ' + (top + dh * 0.45 - 7) + ' l10 7 l-10 7 z M' + (cx - dw / 2 - 20) + ' ' + (top + dh * 0.45 - 7) + ' l-10 7 l10 7 z', 'class': 'noz' }, svg);
        tx(svg, cx - dw / 2 - 52, top + dh * 0.45 - 12, 'Feed', 'zone', 'end');
        arrowPath(svg, 'M' + cx + ' ' + top + ' L' + cx + ' ' + (top - 16) + ' L' + (cx + 60) + ' ' + (top - 16), 'V', pre);
        tx(svg, cx + 64, top - 12, 'Vapour', 'zone');
        arrowPath(svg, 'M' + cx + ' ' + (top + dh) + ' L' + cx + ' ' + (top + dh + 16) + ' L' + (cx + 60) + ' ' + (top + dh + 16), 'L', pre);
        tx(svg, cx + 64, top + dh + 20, 'Liquid', 'zone');
        return;
      }
      var o = {}; for (var k in c.o) if (Object.prototype.hasOwnProperty.call(c.o, k)) o[k] = c.o[k];
      o.x = Math.max(70, W * 0.30); o.y = 34; o.w = 40; o.h = H - 70; o.maxShow = 9;
      drawColumn(svg, o);
    });
  }

  /* =========================================================
     Figure 3: VLE explorer
     ========================================================= */
  var f3 = { sys: 'bt', P: 101, x: 0.4 }, f3tab = null;
  function table3() {
    var n = 161, T = [], X = [], Y = [];
    for (var i = 0; i < n; i++) {
      var x = 0.5 - 0.5 * Math.cos(Math.PI * i / (n - 1));
      var b = DCX.bubble(f3.sys, x, f3.P);
      X.push(x); Y.push(b.y1); T.push(b.T);
    }
    var az = null;
    for (var j = 1; j < n - 2; j++) {
      var d0 = Y[j] - X[j], d1 = Y[j + 1] - X[j + 1];
      if ((d0 > 0) !== (d1 > 0)) {
        var lo = X[j], hi = X[j + 1], flo = d0;
        for (var k = 0; k < 50; k++) {
          var m = 0.5 * (lo + hi), bm = DCX.bubble(f3.sys, m, f3.P), fmv = bm.y1 - m;
          if ((fmv > 0) === (flo > 0)) { lo = m; flo = fmv; } else hi = m;
        }
        var xa = 0.5 * (lo + hi);
        az = { x: xa, T: DCX.bubble(f3.sys, xa, f3.P).T };
        break;
      }
    }
    f3tab = { X: X, Y: Y, T: T, az: az };
  }
  function draw3() {
    var c1 = $('f3-txy'), c2 = $('f3-xy'); if (!c1 || !c2 || !f3tab) return;
    var tab = f3tab, s = DCX.SYS[f3.sys];
    var W1 = widthOf(c1, 480), H1 = Math.round(Math.min(W1 * 0.86, 400));
    var svg = makeSVG(c1, W1, H1);
    var Tmin = Math.min.apply(null, tab.T), Tmax = Math.max.apply(null, tab.T);
    var span = Tmax - Tmin, st = niceStep(Math.max(span, 4) * 1.2, 5);
    var y0 = Math.floor((Tmin - span * 0.08) / st) * st, y1 = Math.ceil((Tmax + span * 0.12) / st) * st;
    var fr = frame(svg, { l: 46, r: W1 - 12, t: 20, b: H1 - 40, x0: 0, x1: 1, y0: y0, y1: y1, xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: niceTicks(y1, 5, y0), xdec: 1, ydec: 0, xgrid: true, xl: 'x₁ or y₁, ' + s.c1, yl: 'T, °C', ylx: 40 });
    var bub = [], dew = [];
    for (var i = 0; i < tab.X.length; i++) { bub.push([tab.X[i], tab.T[i]]); dew.push([tab.Y[i], tab.T[i]]); }
    dew.sort(function (a, b) { return a[0] - b[0]; });
    path(fr, bub, 'l1', svg); path(fr, dew, 'l2', svg);
    var Tb = function (c) { return DCX.interp(tab.X, tab.T, c); };
    var Td = function (c) { return DCX.interp(dew.map(function (q) { return q[0]; }), dew.map(function (q) { return q[1]; }), c); };
    var cands = [0.15, 0.25, 0.35, 0.65, 0.75, 0.85], best = null;
    cands.forEach(function (cc) { var gap = Td(cc) - Tb(cc); if (!best || gap > best[1]) best = [cc, gap]; });
    var cd = best[0], anc = cd < 0.5 ? 'start' : 'end';
    tx(svg, fr.sx(cd), fr.sy(Td(cd)) - 10, 'Dew point, vapour', 'lab t2', anc);
    tx(svg, fr.sx(cd), fr.sy(Tb(cd)) + 20, 'Bubble point, liquid', 'lab t1', anc);
    var b = DCX.bubble(f3.sys, f3.x, f3.P);
    el('line', { x1: fr.sx(f3.x), x2: fr.sx(b.y1), y1: fr.sy(b.T), y2: fr.sy(b.T), 'class': 'lk' }, svg);
    el('circle', { cx: fr.sx(f3.x), cy: fr.sy(b.T), r: 4.5, style: 'fill:#12647e' }, svg);
    el('circle', { cx: fr.sx(b.y1), cy: fr.sy(b.T), r: 4.5, style: 'fill:#ab6528' }, svg);
    el('line', { x1: fr.sx(f3.x), x2: fr.sx(f3.x), y1: fr.sy(b.T), y2: fr.o.b, 'class': 'lm dash', style: 'stroke-width:1' }, svg);
    if (tab.az) {
      el('circle', { cx: fr.sx(tab.az.x), cy: fr.sy(tab.az.T), r: 5, style: 'fill:#fff;stroke:#000;stroke-width:1.5' }, svg);
      tx(svg, fr.sx(tab.az.x) + (tab.az.x > 0.5 ? -8 : 8), fr.sy(tab.az.T) + (s.kind === 'maxaz' ? -10 : 18), 'Azeotrope', 'lab tk', tab.az.x > 0.5 ? 'end' : 'start');
    }
    tx(svg, fr.sx(0.5), fr.sy(y1) + 16, 'Vapour', 'lab-s', 'middle');
    tx(svg, fr.sx(0.5), fr.o.b - 8, 'Liquid', 'lab-s', 'middle');

    var W2 = widthOf(c2, 480), H2 = Math.round(Math.min(W2 * 0.86, 400));
    var svg2 = makeSVG(c2, W2, H2);
    var fr2 = frame(svg2, { l: 46, r: W2 - 12, t: 20, b: H2 - 40, x0: 0, x1: 1, y0: 0, y1: 1, xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: [0, 0.2, 0.4, 0.6, 0.8, 1], xdec: 1, ydec: 1, xgrid: true, xl: 'x₁, liquid', yl: 'y₁, vapour', ylx: 40 });
    path(fr2, [[0, 0], [1, 1]], 'lm', svg2);
    var xy = []; for (var j = 0; j < tab.X.length; j++) xy.push([tab.X[j], tab.Y[j]]);
    path(fr2, xy, 'l1', svg2);
    el('line', { x1: fr2.sx(f3.x), x2: fr2.sx(f3.x), y1: fr2.o.b, y2: fr2.sy(b.y1), 'class': 'lm dash', style: 'stroke-width:1' }, svg2);
    el('line', { x1: fr2.o.l, x2: fr2.sx(f3.x), y1: fr2.sy(b.y1), y2: fr2.sy(b.y1), 'class': 'lm dash', style: 'stroke-width:1' }, svg2);
    el('circle', { cx: fr2.sx(f3.x), cy: fr2.sy(b.y1), r: 4.5, style: 'fill:#000' }, svg2);
    if (tab.az) {
      el('circle', { cx: fr2.sx(tab.az.x), cy: fr2.sy(tab.az.x), r: 5, style: 'fill:#fff;stroke:#000;stroke-width:1.5' }, svg2);
      tx(svg2, fr2.sx(tab.az.x) + 8, fr2.sy(tab.az.x) + 16, 'Azeotrope, y = x', 'lab tk', 'start');
    }
    tx(svg2, fr2.sx(0.62), fr2.sy(0.62) + 16, '45° line', 'lab-s', 'start');
  }
  function update3(recalc, doFlash) {
    if (recalc) table3();
    var b = DCX.bubble(f3.sys, f3.x, f3.P);
    setTile('t3a', fm(b.T, 1), '°C', null, doFlash);
    setTile('t3b', fm(b.y1, 3), '', null, doFlash);
    var a = (f3.x > 0.001 && f3.x < 0.999) ? (b.y1 / f3.x) / ((1 - b.y1) / (1 - f3.x)) : NaN;
    setTile('t3c', isFinite(a) ? fm(a, 2) : '–', '', null, doFlash);
    var az = f3tab.az;
    setTile('t3d', az ? fm(az.x, 3) : 'None', az ? 'at ' + fm(az.T, 1) + ' °C' : '', null, doFlash);
    $('f3-p-v').textContent = fm(f3.P, 0) + ' kPa';
    $('f3-x-v').textContent = fm(f3.x, 3);
    draw3();
  }
  function init3() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-f3]'), function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(document.querySelectorAll('[data-f3]'), function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        f3.sys = b.getAttribute('data-f3'); update3(true, true);
      });
    });
    var p = $('f3-p'), x = $('f3-x');
    p.addEventListener('input', function () { f3.P = Number(p.value); update3(true, false); });
    p.addEventListener('change', function () { f3.P = Number(p.value); update3(true, true); });
    x.addEventListener('input', function () { f3.x = Number(x.value); update3(false, false); });
    x.addEventListener('change', function () { f3.x = Number(x.value); update3(false, true); });
    update3(true, false);
  }

  /* =========================================================
     Figure 4: Gilliland correlation
     ========================================================= */
  var f4pts = null;
  function draw4() {
    var c = $('f4-chart'); if (!c) return;
    if (!f4pts) {
      var E = DCX.eqTable({ alpha: 2.5 }), o = { zF: 0.40, q: 1, xD: 0.95, xB: 0.05 };
      var Rm = DCX.rminFull(E, o), Nmin = DCX.fenske(0.95, 0.05, 2.5);
      f4pts = [1.05, 1.1, 1.15, 1.2, 1.3, 1.4, 1.5, 1.75, 2, 2.5, 3].map(function (m) {
        var R = Rm * m, N = DCX.stepFull(E, o, R).Nfrac;
        return [(R - Rm) / (R + 1), (N - Nmin) / (N + 1)];
      });
    }
    var W = widthOf(c), H = Math.round(Math.min(Math.max(W * 0.48, 280), 420));
    var svg = makeSVG(c, W, H);
    var fr = frame(svg, { l: 50, r: W - 18, t: 22, b: H - 42, x0: 0.01, x1: 1, y0: 0, y1: 1, logx: true, xt: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1], yt: [0, 0.2, 0.4, 0.6, 0.8, 1], xfmt: function (v) { return String(v); }, ydec: 1, xgrid: true, xl: 'X = (R − R_min)/(R + 1)', yl: 'Y = (N − N_min)/(N + 1)', ylx: 44 });
    var cur = []; for (var i = 0; i <= 200; i++) { var X = Math.pow(10, -2 + 2 * i / 200); var Y = 1 - Math.exp(((1 + 54.4 * X) / (11 + 117.2 * X)) * ((X - 1) / Math.sqrt(X))); cur.push([X, Y]); }
    path(fr, cur, 'l1', svg);
    var Ylab = cur[18][1];
    tx(svg, fr.sx(cur[18][0]) + 4, fr.sy(Ylab) - 12, 'Gilliland, Molokanov fit', 'lab t1', 'start');
    f4pts.forEach(function (p) { el('circle', { cx: fr.sx(p[0]), cy: fr.sy(p[1]), r: 4.5, style: 'fill:#ab6528' }, svg); });
    var pl = f4pts[7];
    tx(svg, fr.sx(pl[0]) - 12, fr.sy(pl[1]) + 22, 'McCabe–Thiele stepping, α = 2.5 column', 'lab t2', 'end');
    var X3 = (1.866 - 1.435) / 2.866, Y3 = 1 - Math.exp(((1 + 54.4 * X3) / (11 + 117.2 * X3)) * ((X3 - 1) / Math.sqrt(X3)));
    el('circle', { cx: fr.sx(X3), cy: fr.sy(Y3), r: 5, style: 'fill:#000' }, svg);
    tx(svg, fr.sx(X3) + 10, fr.sy(Y3) - 12, 'Example 3', 'lab tk', 'start');
  }

  /* =========================================================
     Figure 5: tray anatomy
     ========================================================= */
  function draw5() {
    var c = $('f5-chart'); if (!c) return;
    var W = 960, H = 430;
    var svg = makeSVG(c, W, H);
    svg.setAttribute('style', 'min-width:720px');
    var pre = 'tr'; arrowDefs(svg, pre);
    var xL = 150, xR = 530, dc = 66, d1 = 140, d2 = 330, hw = 18, clr = 12, hb = 96;
    var aL = xL + dc, aR = xR - dc;
    el('line', { x1: xL, x2: xL, y1: 20, y2: 420, 'class': 'shell-line' }, svg);
    el('line', { x1: xR, x2: xR, y1: 20, y2: 420, 'class': 'shell-line' }, svg);
    // downcomer from the tray above, feeding tray 1 (left)
    el('rect', { x: xL, y: 70, width: dc, height: d1 - clr - 70, 'class': 'liq' }, svg);
    el('rect', { x: xL, y: 48, width: dc, height: 22, 'class': 'froth' }, svg);
    el('line', { x1: aL, x2: aL, y1: 20, y2: d1 - clr, 'class': 'shell-line' }, svg);
    // tray 1
    el('rect', { x: aL, y: d1 - 40, width: aR - aL, height: 40, 'class': 'froth' }, svg);
    el('rect', { x: aL, y: d1 - 12, width: aR - aL, height: 12, 'class': 'liq' }, svg);
    el('line', { x1: xL, x2: aL, y1: d1, y2: d1, 'class': 'tray' }, svg);
    el('line', { x1: aL, x2: aR, y1: d1, y2: d1, 'class': 'tray', style: 'stroke-dasharray:9 4' }, svg);
    el('line', { x1: aR, x2: aR, y1: d1, y2: d1 - hw, 'class': 'tray' }, svg);
    // tray 1 outlet downcomer (right)
    el('rect', { x: aR, y: d2 - hb, width: dc, height: hb, 'class': 'liq' }, svg);
    el('rect', { x: aR, y: d2 - hb - 34, width: dc, height: 34, 'class': 'froth' }, svg);
    el('line', { x1: aR, x2: aR, y1: d1, y2: d2 - clr, 'class': 'shell-line' }, svg);
    // tray 2
    el('rect', { x: aL, y: d2 - 40, width: aR - aL, height: 40, 'class': 'froth' }, svg);
    el('rect', { x: aL, y: d2 - 12, width: aR - aL, height: 12, 'class': 'liq' }, svg);
    el('line', { x1: aL, x2: aR, y1: d2, y2: d2, 'class': 'tray', style: 'stroke-dasharray:9 4' }, svg);
    el('line', { x1: aR, x2: xR, y1: d2, y2: d2, 'class': 'tray' }, svg);
    el('line', { x1: aL, x2: aL, y1: d2, y2: d2 - hw, 'class': 'tray' }, svg);
    // tray 2 outlet downcomer (left, going down)
    el('rect', { x: xL, y: 392, width: dc, height: 28, 'class': 'liq' }, svg);
    el('line', { x1: aL, x2: aL, y1: d2, y2: 420, 'class': 'shell-line' }, svg);
    [[xL, d1], [xR - 8, d1], [xL, d2], [xR - 8, d2]].forEach(function (p) { el('rect', { x: p[0], y: p[1], width: 8, height: 5, style: 'fill:#000' }, svg); });
    // vapour and liquid
    [242, 302, 362, 422].forEach(function (x) {
      arrow(svg, x, d2 + 40, x, d2 + 6, 'V', pre);
      arrow(svg, x, d2 - 46, x, d1 + 14, 'V', pre);
      arrow(svg, x, d1 - 46, x, 30, 'V', pre);
    });
    arrow(svg, aL + 18, d1 - 22, aR - 18, d1 - 22, 'L', pre);
    arrow(svg, aR + dc / 2, d1 + 14, aR + dc / 2, d1 + 60, 'L', pre);
    arrow(svg, aR - 18, d2 - 22, aL + 18, d2 - 22, 'L', pre);
    arrow(svg, xL + dc / 2, 24, xL + dc / 2, 60, 'L', pre);
    arrow(svg, xL + dc / 2, d2 + 16, xL + dc / 2, 384, 'L', pre);
    // tray spacing
    var dimx = xL - 28;
    el('line', { x1: dimx, x2: dimx, y1: d1, y2: d2, 'class': 'dim', 'marker-start': 'url(#' + pre + 'D2)', 'marker-end': 'url(#' + pre + 'D2)' }, svg);
    el('line', { x1: dimx - 6, x2: xL, y1: d1, y2: d1, 'class': 'dim' }, svg);
    el('line', { x1: dimx - 6, x2: xL, y1: d2, y2: d2, 'class': 'dim' }, svg);
    tx(svg, dimx - 8, (d1 + d2) / 2 - 4, 'Tray spacing', 'zone', 'end');
    tx(svg, dimx - 8, (d1 + d2) / 2 + 12, 'TS', 'zone-s', 'end');
    tx(svg, xL - 6, d2 + 24, 'Support ring', 'zone-s', 'end');
    // right-hand labels with leaders
    var lx = xR + 14;
    el('line', { x1: aR - 8, x2: aR - 8, y1: d1, y2: d1 - hw, 'class': 'dim' }, svg);
    el('line', { x1: aR - 8, x2: lx - 4, y1: d1 - hw / 2, y2: d1 - 34, 'class': 'dim' }, svg);
    tx(svg, lx, d1 - 30, 'Weir height, h_w', 'zone', 'start');
    el('line', { x1: aR + 2, x2: lx - 4, y1: d1 - hw + 2, y2: d1 - 6, 'class': 'dim' }, svg);
    tx(svg, lx, d1 - 2, 'Outlet weir', 'zone', 'start');
    tx(svg, lx, d1 + 44, 'Downcomer', 'zone', 'start');
    tx(svg, lx, d1 + 60, 'area A_d', 'zone-s', 'start');
    el('line', { x1: xR - 12, x2: xR - 12, y1: d2, y2: d2 - hb, 'class': 'dim', 'marker-start': 'url(#' + pre + 'D2)', 'marker-end': 'url(#' + pre + 'D2)' }, svg);
    tx(svg, lx, d2 - hb / 2 - 4, 'Clear-liquid', 'zone', 'start');
    tx(svg, lx, d2 - hb / 2 + 12, 'backup, h_b', 'zone', 'start');
    el('line', { x1: aR - 2, x2: lx - 4, y1: d2 - clr / 2, y2: d2 - 12, 'class': 'dim' }, svg);
    tx(svg, lx, d2 - 8, 'Clearance, h_ap', 'zone', 'start');
    tx(svg, lx, d2 + 22, 'Inlet area', 'zone', 'start');
    tx(svg, (aL + aR) / 2, d1 - 52, 'Active (bubbling) area: froth on a perforated deck', 'zone lab-w', 'middle');
    tx(svg, xL + 4, 14, 'Elevation', 'zone-s', 'start');
    tx(svg, 20, 384, 'Vapour', 'zone', 'start'); el('line', { x1: 20, x2: 70, y1: 392, y2: 392, 'class': 'vflow' }, svg);
    tx(svg, 20, 410, 'Liquid', 'zone', 'start'); el('line', { x1: 20, x2: 70, y1: 418, y2: 418, 'class': 'flow' }, svg);
    // plan view
    var pcx = 822, pcy = 222, R = 118, off = 0.645 * R, half = Math.sqrt(R * R - off * off);
    tx(svg, pcx - R, 40, 'Plan of one tray', 'zone-s', 'start');
    el('circle', { cx: pcx, cy: pcy, r: R, 'class': 'shell' }, svg);
    var seg = function (side) {
      var x = pcx + side * off;
      return 'M' + x + ' ' + (pcy - half) + ' A' + R + ' ' + R + ' 0 0 ' + (side > 0 ? 1 : 0) + ' ' + x + ' ' + (pcy + half) + ' Z';
    };
    el('path', { d: seg(-1), 'class': 'liq' }, svg);
    el('path', { d: seg(1), 'class': 'froth', style: 'stroke:none' }, svg);
    el('line', { x1: pcx - off, x2: pcx - off, y1: pcy - half, y2: pcy + half, 'class': 'tray' }, svg);
    el('line', { x1: pcx + off, x2: pcx + off, y1: pcy - half, y2: pcy + half, 'class': 'tray' }, svg);
    var defs = el('defs', {}, svg), cpid = 'actclip5';
    var cp = el('clipPath', { id: cpid }, defs);
    el('circle', { cx: pcx, cy: pcy, r: R - 4 }, cp);
    var g = el('g', { 'clip-path': 'url(#' + cpid + ')' }, svg);
    for (var yy = pcy - R + 8, row = 0; yy < pcy + R; yy += 10, row++) {
      for (var xx = pcx - off + 14 + (row % 2 ? 5 : 0); xx < pcx + off - 8; xx += 10) el('circle', { cx: xx, cy: yy, r: 1.5, 'class': 'holes' }, g);
    }
    arrow(svg, pcx - off + 24, pcy + 14, pcx + off - 24, pcy + 14, 'L', pre);
    el('rect', { x: pcx - 52, y: pcy - 16, width: 104, height: 20, rx: 3, style: 'fill:#fff' }, svg);
    tx(svg, pcx, pcy - 2, 'Active area, A_a', 'zone', 'middle');
    tx(svg, pcx - R + 2, pcy - R - 10, 'Inlet downcomer', 'zone', 'start');
    tx(svg, pcx + R, pcy + R + 22, 'Outlet downcomer, A_d', 'zone', 'end');
    el('line', { x1: pcx + off + 12, x2: pcx + off + 12, y1: pcy - half, y2: pcy + half, 'class': 'dim', 'marker-start': 'url(#' + pre + 'D2)', 'marker-end': 'url(#' + pre + 'D2)' }, svg);
    tx(svg, pcx + off + 18, pcy + 4, 'l_w', 'zone', 'start');
  }

  /* =========================================================
     Figure 6: column sizer
     ========================================================= */
  var F6S = {
    top: { v: 8820, l: 5755, rv: 2.71, rl: 815, sig: 21, ts: 600, ff: 80, ad: 12, sf: 1, n: 12.3, eo: 54, ht: 4.0 },
    bot: { v: 10233, l: 15821, rv: 3.53, rl: 775, sig: 17.5, ts: 600, ff: 80, ad: 12, sf: 1, n: 12.3, eo: 54, ht: 4.0 },
    deb: { v: 70000, l: 78000, rv: 25, rl: 520, sig: 6, ts: 600, ff: 80, ad: 15, sf: 1, n: 30, eo: 80, ht: 5.0 }
  };
  var f6res = null;
  function read6() {
    var g = function (id) { return parseNum($(id).value); };
    return { v: g('f6-v'), l: g('f6-l'), rv: g('f6-rv'), rl: g('f6-rl'), sig: g('f6-sig'), ts: Number($('f6-ts').value), ff: g('f6-ff'), ad: g('f6-ad'), sf: Number($('f6-sf').value), n: g('f6-n'), eo: g('f6-eo'), ht: g('f6-ht') };
  }
  function update6(doFlash) {
    var p = read6(), bad = [];
    ['v', 'l', 'rv', 'rl', 'sig', 'ff', 'ad', 'n', 'eo', 'ht'].forEach(function (k) { if (!(p[k] >= 0) || !isFinite(p[k])) bad.push(k); });
    if (!bad.length && !(p.rl > p.rv)) bad.push('rho');
    if (!bad.length && !(p.ff > 0 && p.ff <= 100 && p.ad > 0 && p.ad < 40 && p.eo > 0 && p.eo <= 100 && p.v > 0)) bad.push('range');
    if (bad.length) {
      statusRows($('f6-status'), [['err', 'Check inputs', 'Every input must be a positive number; liquid density above vapour density; flood 1–100 %, downcomer area below 40 %, efficiency 1–100 %.']]);
      f6res = null; draw6(); return;
    }
    var FLV = (p.l / p.v) * Math.sqrt(p.rv / p.rl);
    var Csb = DCX.csbFair(p.ts, Math.max(FLV, 0.005));
    var C = Csb * Math.pow(p.sig / 20, 0.2) * p.sf;
    var unf = C * Math.sqrt((p.rl - p.rv) / p.rv);
    var Q = p.v / 3600 / p.rv, un = p.ff / 100 * unf;
    var An = Q / un, Ac = An / (1 - p.ad / 100), Dc = Math.sqrt(4 * Ac / Math.PI);
    var Dsel = Math.ceil(Dc / 0.05 - 1e-9) * 0.05;
    var Asel = Math.PI * Dsel * Dsel / 4, floodSel = Q / (Asel * (1 - p.ad / 100)) / unf;
    var Nact = Math.ceil(p.n / (p.eo / 100) - 1e-9);
    var H = Math.max(0, Nact - 1) * p.ts / 1000 + p.ht;
    var lw = DCX.weirLength(Dsel, p.ad / 100), QL = p.l / p.rl, wl = QL / lw, wlg = wl / DCX.GPMIN, nut = DCX.nutterMaxWeir(p.ts);
    f6res = { p: p, FLV: FLV, Csb: Csb, C: C, unf: unf, Q: Q, un: un, An: An, Ac: Ac, Dc: Dc, Dsel: Dsel, floodSel: floodSel, Nact: Nact, H: H, lw: lw, QL: QL, wl: wl, wlg: wlg };
    setTile('t6a', fm(unf, 2), 'm/s', null, doFlash);
    setTile('t6b', fm(Dsel, 2), 'm', 'Column inside diameter (calculated ' + fm(Dc, 3) + ' m)', doFlash);
    setTile('t6c', String(Nact), 'trays', null, doFlash);
    setTile('t6d', fm(H, 1), 'm', null, doFlash);
    var rows = [['inf', 'Capacity', 'F<sub>LV</sub> = ' + fm(FLV, 3) + ', C<sub>SB</sub> = ' + fm(Csb, 4) + ' m/s from Fair’s chart; ' + fm(C, 4) + ' m/s after the surface-tension and system factors.']];
    rows.push(['ok', 'Flood', fm(floodSel * 100, 0) + ' % of jet flood at the rounded diameter of ' + fm(Dsel, 2) + ' m.']);
    if (wlg > nut) rows.push(['warn', 'Weir load', fm(wl, 0) + ' m³/h per m of weir (' + fm(wlg, 1) + ' gpm/in) on a single pass, above the ' + fm(nut, 0) + ' gpm/in guideline for this spacing: consider two passes.']);
    else if (wlg < 2) rows.push(['inf', 'Weir load', fm(wl, 1) + ' m³/h per m (' + fm(wlg, 1) + ' gpm/in): low, spray regime possible at high vapour rates.']);
    else rows.push(['ok', 'Weir load', fm(wl, 1) + ' m³/h per m of weir (' + fm(wlg, 1) + ' gpm/in) on a single pass.']);
    if (Dsel < 0.76) rows.push(['inf', 'Small column', 'Below about 0.76 m trays need cartridge construction; a packed column is often the better choice.']);
    statusRows($('f6-status'), rows);
    var w = [];
    w.push('F_LV = (L/V)√(ρV/ρL) = (' + fm(p.l, 0) + '/' + fm(p.v, 0) + ') × √(' + fm(p.rv, 2) + '/' + fm(p.rl, 0) + ') = ' + fm(FLV, 4));
    w.push('C_SB = 0.0105 + 8.127e-4 × ' + p.ts + '^0.755 × exp(−1.463 × ' + fm(FLV, 4) + '^0.842) = ' + fm(Csb, 4) + ' m/s');
    w.push('C = C_SB × (σ/20)^0.2 × F_SF = ' + fm(Csb, 4) + ' × (' + fm(p.sig, 1) + '/20)^0.2 × ' + fm(p.sf, 2) + ' = ' + fm(C, 4) + ' m/s');
    w.push('u_nf = C √((ρL − ρV)/ρV) = ' + fm(C, 4) + ' × √((' + fm(p.rl, 0) + ' − ' + fm(p.rv, 2) + ')/' + fm(p.rv, 2) + ') = ' + fm(unf, 3) + ' m/s');
    w.push('Q_V = ' + fm(p.v, 0) + '/3600/' + fm(p.rv, 2) + ' = ' + fm(Q, 4) + ' m³/s;  u_n = ' + fm(p.ff, 0) + ' % × u_nf = ' + fm(un, 3) + ' m/s');
    w.push('A_n = ' + fm(An, 4) + ' m²;  A_c = A_n/(1 − ' + fm(p.ad / 100, 3) + ') = ' + fm(Ac, 4) + ' m²;  D = √(4A_c/π) = ' + fm(Dc, 3) + ' m → ' + fm(Dsel, 2) + ' m');
    w.push('Trays = ' + fm(p.n, 1) + '/' + fm(p.eo / 100, 2) + ' = ' + fm(p.n / (p.eo / 100), 2) + ' → ' + Nact + ';  H = (' + Nact + ' − 1) × ' + fm(p.ts / 1000, 2) + ' + ' + fm(p.ht, 1) + ' = ' + fm(H, 2) + ' m');
    $('f6-work').innerHTML = w.map(function (s) { return '<li>' + s + '</li>'; }).join('');
    draw6();
  }
  function draw6() {
    var c = $('f6-chart'); if (!c) return;
    var W = widthOf(c), H = Math.round(Math.min(Math.max(W * 0.45, 280), 400));
    var svg = makeSVG(c, W, H);
    var small = W < 560;
    var fr = frame(svg, { l: 52, r: W - 16, t: 22, b: H - 42, x0: 0.01, x1: 1, y0: 0, y1: 0.16, logx: true, xt: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1], yt: [0, 0.04, 0.08, 0.12, 0.16], xfmt: function (v) { return String(v); }, ydec: 2, xgrid: true, xl: 'Flow parameter, F_LV = (L/V)√(ρV/ρL)', yl: 'C_SB at flood, m/s', ylx: 46 });
    var sel = f6res ? f6res.p.ts : Number($('f6-ts').value);
    [300, 450, 600, 750, 900].forEach(function (ts) {
      var pts = []; for (var i = 0; i <= 120; i++) { var f = Math.pow(10, -2 + 2 * i / 120); pts.push([f, DCX.csbFair(ts, f)]); }
      path(fr, pts, ts === sel ? 'l1' : 'lm', svg);
      tx(svg, fr.sx(0.0105) + 2, fr.sy(DCX.csbFair(ts, 0.0105)) - 5, (ts === sel ? 'Tray spacing ' : '') + ts + ' mm', ts === sel ? 'lab t1' : 'lab-s', 'start');
    });
    if (f6res) {
      var fx = Math.min(Math.max(f6res.FLV, 0.01), 1);
      el('circle', { cx: fr.sx(fx), cy: fr.sy(f6res.Csb), r: 5, style: 'fill:#000' }, svg);
      tx(svg, fr.sx(fx) + 8, fr.sy(f6res.Csb) + 18, 'Design point', 'lab tk', 'start');
    }
  }
  function init6() {
    ['f6-v', 'f6-l', 'f6-rv', 'f6-rl', 'f6-sig', 'f6-ff', 'f6-ad', 'f6-n', 'f6-eo', 'f6-ht'].forEach(function (id) {
      $(id).addEventListener('input', function () { update6(false); });
      $(id).addEventListener('change', function () { update6(true); });
    });
    ['f6-ts', 'f6-sf'].forEach(function (id) { $(id).addEventListener('change', function () { update6(true); }); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-f6]'), function (b) {
      b.addEventListener('click', function () {
        var p = F6S[b.getAttribute('data-f6')];
        $('f6-v').value = p.v; $('f6-l').value = p.l; $('f6-rv').value = p.rv; $('f6-rl').value = p.rl; $('f6-sig').value = p.sig;
        $('f6-ts').value = String(p.ts); $('f6-ff').value = p.ff; $('f6-ad').value = p.ad; $('f6-sf').value = String(p.sf);
        $('f6-n').value = p.n; $('f6-eo').value = p.eo; $('f6-ht').value = p.ht;
        update6(true);
      });
    });
    $('f6-copy').addEventListener('click', function () {
      var r = f6res; if (!r) { $('f6-copy-note').textContent = 'Fix the inputs first.'; return; }
      var t = ['Column sizer (Fair flooding correlation)',
        'Vapour ' + r.p.v + ' kg/h, liquid ' + r.p.l + ' kg/h, rhoV ' + r.p.rv + ', rhoL ' + r.p.rl + ' kg/m3, sigma ' + r.p.sig + ' mN/m',
        'Tray spacing ' + r.p.ts + ' mm, design ' + r.p.ff + ' % flood, downcomer ' + r.p.ad + ' %, system factor ' + r.p.sf,
        'F_LV ' + r.FLV.toFixed(4) + ', C_SB ' + r.Csb.toFixed(4) + ' m/s, u_nf ' + r.unf.toFixed(3) + ' m/s',
        'Diameter ' + r.Dc.toFixed(3) + ' m calculated, ' + r.Dsel.toFixed(2) + ' m selected (' + (r.floodSel * 100).toFixed(0) + ' % flood)',
        'Actual trays ' + r.Nact + ', height ' + r.H.toFixed(1) + ' m tangent to tangent'].join('\n');
      copyText(t, $('f6-copy-note'), $('fig6'));
    });
    $('f6-send').addEventListener('click', function () {
      var r = f6res; if (!r) return;
      setF7({ V: r.p.v, QL: r.QL, D: Math.round(r.Dsel * 1000), TS: r.p.ts, fh: 10, hw: 50, ad: r.p.ad, rhoV: r.p.rv, rhoL: r.p.rl, sig: r.p.sig, SF: r.p.sf, uc: r.p.sf < 0.95 ? 0.07 : 0.137, name: 'Loads from Figure 6' });
      var f = $('fig7'); if (f && f.scrollIntoView) f.scrollIntoView({ behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
    update6(false);
  }

  /* =========================================================
     Figure 7: tray performance diagram
     ========================================================= */
  var F7S = {
    bot: { V: 10233, QL: 20.4, D: 1100, TS: 600, fh: 10, hw: 50, ad: 12, rhoV: 3.53, rhoL: 775, sig: 17.5, SF: 1, uc: 0.137, name: 'Benzene–toluene, bottom tray, about 125 kPa' },
    top: { V: 8820, QL: 7.06, D: 1100, TS: 600, fh: 10, hw: 50, ad: 12, rhoV: 2.71, rhoL: 815, sig: 21, SF: 1, uc: 0.137, name: 'Benzene–toluene, top tray, 101 kPa' },
    deb: { V: 70000, QL: 150, D: 2600, TS: 610, fh: 10, hw: 50, ad: 15, rhoV: 25, rhoL: 520, sig: 6, SF: 1, uc: 0.137, name: 'Debutaniser near 10 bar, single pass (illustrative)' },
    amine: { V: 22000, QL: 110, D: 2400, TS: 610, fh: 10, hw: 50, ad: 14, rhoV: 1.1, rhoL: 980, sig: 55, SF: 0.85, uc: 0.07, name: 'Amine regenerator, foaming (illustrative)' }
  };
  var f7 = {}, C0 = 0.75;
  function rng(id, min, max, step) { var i = $(id); i.min = min; i.max = max; i.step = step; }
  function setF7(p) {
    for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k)) f7[k] = p[k];
    var vmax = niceCeil(Math.max(f7.V * 2.2, 2000), 5), lmax = niceCeil(Math.max(f7.QL * 2.5, 10), 5);
    rng('f7-v', Math.round(vmax / 40), vmax, Math.max(10, niceStep(vmax, 400)));
    rng('f7-l', Math.max(0.5, lmax / 80), lmax, Math.max(0.1, niceStep(lmax, 400)));
    $('f7-v').value = f7.V; $('f7-l').value = f7.QL; $('f7-d').value = f7.D; $('f7-ts').value = f7.TS; $('f7-fh').value = f7.fh; $('f7-hw').value = f7.hw; $('f7-ad').value = f7.ad;
    update7(true);
  }
  function params7() {
    return { V: f7.V, QL: f7.QL, rhoV: f7.rhoV, rhoL: f7.rhoL, sig: f7.sig, D: f7.D / 1000, TS: f7.TS, ad: f7.ad / 100, fh: f7.fh / 100, hw: f7.hw, C0: C0, SF: f7.SF };
  }
  var f7res = null;
  function update7(doFlash) {
    var p = params7(), r = DCX.trayRate(p);
    var vWeep = DCX.weepV(p, 10), vWeepC = DCX.weepV(p, 14.6);
    f7res = { p: p, r: r, vWeep: vWeep, vWeepC: vWeepC };
    $('f7-v-v').textContent = fm(f7.V / 1000, 1) + ' t/h';
    $('f7-l-v').textContent = fm(f7.QL, 1) + ' m³/h';
    $('f7-d-v').textContent = fm(f7.D, 0) + ' mm';
    $('f7-ts-v').textContent = fm(f7.TS, 0) + ' mm';
    $('f7-fh-v').textContent = fm(f7.fh, 1) + ' %';
    $('f7-hw-v').textContent = fm(f7.hw, 0) + ' mm';
    $('f7-ad-v').textContent = fm(f7.ad, 1) + ' %';
    $('f7-props').innerHTML = f7.name + ': ρ<sub>V</sub> ' + fm(f7.rhoV, 2) + ' kg/m³, ρ<sub>L</sub> ' + fm(f7.rhoL, 0) + ' kg/m³, σ ' + fm(f7.sig, 1) + ' mN/m, system factor ' + fm(f7.SF, 2) + ', downcomer choke limit ' + fm(f7.uc, 3) + ' m/s.';
    setTile('t7a', fm(r.flood * 100, 0), '%', null, doFlash);
    setTile('t7b', fm(r.hbFrac * 100, 0), '%', null, doFlash);
    setTile('t7c', fm(p.V / vWeep, 2), '×', null, doFlash);
    setTile('t7d', fm(r.dP, 1), 'mbar', null, doFlash);
    var rows = [];
    var jf = r.flood * 100;
    rows.push([jf < 80 ? 'ok' : jf < 90 ? 'warn' : 'err', 'Jet flood', fm(jf, 0) + ' % (F<sub>LV</sub> = ' + fm(r.FLV, 3) + '); design ceiling 80–85 %.']);
    var bf = r.hbFrac * 100;
    rows.push([bf < 80 ? 'ok' : bf < 100 ? 'warn' : 'err', 'Downcomer backup', fm(r.hb, 0) + ' mm clear liquid, ' + fm(bf, 0) + ' % of the ' + fm(r.hbMax, 0) + ' mm allowed; residence ' + (isFinite(r.tres) ? fm(r.tres, 1) + ' s' : '–') + (r.tres < 3 ? ' (below 3 s)' : '') + '.']);
    var cf = r.udc / f7.uc;
    rows.push([cf < 0.8 ? 'ok' : cf < 1 ? 'warn' : 'err', 'Downcomer choke', 'Entrance velocity ' + fm(r.udc, 3) + ' m/s, ' + fm(cf * 100, 0) + ' % of the ' + fm(f7.uc, 3) + ' m/s limit.']);
    rows.push([r.Fh >= 14.6 ? 'ok' : r.Fh >= 10 ? 'warn' : 'err', 'Weeping', 'Hole F-factor ' + fm(r.Fh, 1) + ' Pa<sup>0.5</sup>' + (r.Fh >= 14.6 ? ', above the conservative limit.' : r.Fh >= 10 ? ', between the optimistic (10) and conservative (14.6) limits: expect some weeping.' : ': the tray weeps.') + ' Dry-deck drop ' + fm(r.hd, 0) + ' mm.']);
    var wlg = r.weirLoad / DCX.GPMIN, nut = DCX.nutterMaxWeir(f7.TS);
    rows.push([wlg > nut ? 'warn' : 'ok', 'Weir load', fm(r.weirLoad, 1) + ' m³/h per m (' + fm(wlg, 1) + ' gpm/in), crest ' + fm(r.how, 0) + ' mm' + (wlg > nut ? ': above the guideline for this spacing, consider more passes.' : wlg < 2 ? ': low, spray regime possible at high vapour.' : '.')]);
    statusRows($('f7-status'), rows);
    draw7();
  }
  function draw7() {
    var c = $('f7-chart'); if (!c || !f7res) return;
    var p = f7res.p, r = f7res.r;
    var W = widthOf(c), H = Math.round(Math.min(Math.max(W * 0.55, 300), 480));
    var svg = makeSVG(c, W, H);
    var A = Math.PI * p.D * p.D / 4, Ad = p.ad * A, lw = r.lw;
    var Lch = f7.uc * Ad * 3600, Lspray = 2 * DCX.GPMIN * lw, Lnut = DCX.nutterMaxWeir(p.TS) * DCX.GPMIN * lw;
    var xmax = niceCeil(Math.max(p.QL * 1.6, Math.min(Lch * 1.12, p.QL * 6), Lspray * 1.5), 6);
    var vj0 = DCX.jetFloodV(p, xmax * 0.002, 1);
    var ymax = niceCeil(Math.max(vj0, p.V * 1.3) * 1.08 / 1000, 6);
    var small = W < 560;
    var fr = frame(svg, { l: 52, r: W - 16, t: 22, b: H - 42, x0: 0, x1: xmax, y0: 0, y1: ymax, xt: niceTicks(xmax, small ? 4 : 7), yt: niceTicks(ymax, 6), xdec: xmax < 10 ? 1 : 0, ydec: ymax < 10 ? 1 : 0, xl: 'Liquid load, m³/h', yl: 'Vapour load, t/h', ylx: 46 });
    var n = 90, jet = [], jet80 = [], bk = [], top = [];
    for (var i = 0; i <= n; i++) {
      var L = xmax * (0.002 + 0.998 * i / n);
      var vj = DCX.jetFloodV(p, L, 1) / 1000, vb = DCX.backupV(p, L) / 1000;
      var flvL = (L * p.rhoL) / (vj * 1000) * Math.sqrt(p.rhoV / p.rhoL);
      if (flvL > 2) vj = NaN;
      jet.push([L, vj]); jet80.push([L, 0.8 * vj]); bk.push([L, vb > 0 ? vb : NaN]); top.push([L, isFinite(vj) ? Math.min(vj, vb) : 0]);
    }
    var vw = f7res.vWeep / 1000, vwc = f7res.vWeepC / 1000;
    // window polygon
    var poly = [], lo = [];
    for (var k = 0; k < top.length; k++) {
      var Lk = top[k][0];
      if (Lk > Lch) break;
      if (top[k][1] > vw) { poly.push([Lk, top[k][1]]); lo.push([Lk, vw]); }
    }
    if (poly.length > 1) {
      var d = '';
      poly.forEach(function (q, i2) { d += (i2 ? 'L' : 'M') + fr.sx(q[0]).toFixed(1) + ' ' + fr.sy(q[1]).toFixed(1); });
      for (var m = lo.length - 1; m >= 0; m--) d += 'L' + fr.sx(lo[m][0]).toFixed(1) + ' ' + fr.sy(lo[m][1]).toFixed(1);
      el('path', { d: d + 'Z', 'class': 'win', 'clip-path': fr.clip }, svg);
    }
    path(fr, jet, 'l2', svg); path(fr, jet80, 'l2 dash', svg);
    path(fr, bk, 'l3', svg);
    if (Lch <= xmax) { el('line', { x1: fr.sx(Lch), x2: fr.sx(Lch), y1: fr.o.t, y2: fr.o.b, 'class': 'l4' }, svg); }
    el('line', { x1: fr.o.l, x2: fr.o.r, y1: fr.sy(vw), y2: fr.sy(vw), 'class': 'l1', 'clip-path': fr.clip }, svg);
    el('line', { x1: fr.o.l, x2: fr.o.r, y1: fr.sy(vwc), y2: fr.sy(vwc), 'class': 'l1 dash', 'clip-path': fr.clip }, svg);
    if (Lspray < xmax) el('line', { x1: fr.sx(Lspray), x2: fr.sx(Lspray), y1: fr.o.t, y2: fr.o.b, 'class': 'lm dash', style: 'stroke-width:1.25' }, svg);
    if (Lnut < xmax) el('line', { x1: fr.sx(Lnut), x2: fr.sx(Lnut), y1: fr.o.t, y2: fr.o.b, 'class': 'lm dash', style: 'stroke-width:1.25' }, svg);
    // labels
    var jl = jet[Math.round(n * 0.62)];
    if (jl[1] < ymax) tx(svg, fr.sx(jl[0]), fr.sy(jl[1]) - 8, 'Jet flood', 'lab t2', 'middle');
    var j8 = jet80[Math.round(n * 0.10)];
    if (j8[1] < ymax) tx(svg, fr.sx(j8[0]), fr.sy(j8[1]) + 18, '80 % of flood', 'lab t2', 'start');
    var bi = -1; for (var b2 = n; b2 >= 0; b2--) if (isFinite(bk[b2][1]) && bk[b2][1] < ymax * 0.95) { bi = b2; break; }
    if (bi > 0) { var bl = bk[Math.max(0, Math.round(bi * 0.85))]; tx(svg, fr.sx(bl[0]) - 6, fr.sy(bl[1]) - 8, 'Downcomer backup', 'lab t3', 'end'); }
    if (Lch <= xmax) tx(svg, fr.sx(Lch) - 6, fr.o.t + 14, 'Downcomer choke', 'lab t4', 'end');
    tx(svg, fr.o.r - 4, fr.sy(vw) + 16, 'Weeping, F_h = 10', 'lab t1', 'end');
    if (fr.sy(vw) - fr.sy(vwc) > 14) tx(svg, fr.o.r - 4, fr.sy(vwc) - 6, 'Conservative, F_h = 14.6', 'lab t1', 'end');
    if (Lspray < xmax && !small) tx(svg, fr.sx(Lspray) + 4, fr.o.b - 8, '2 gpm/in', 'lab-s', 'start');
    if (Lnut < xmax && !small) tx(svg, fr.sx(Lnut) - 4, fr.o.b - 8, 'Add passes', 'lab-s', 'end');
    // operating point and constant L/V line
    var ox = p.QL, oy = p.V / 1000, ext = 1.6;
    el('line', { x1: fr.sx(0), y1: fr.sy(0), x2: fr.sx(ox * ext), y2: fr.sy(oy * ext), 'class': 'lk dash', 'clip-path': fr.clip, style: 'stroke-width:1' }, svg);
    el('circle', { cx: fr.sx(ox), cy: fr.sy(oy), r: 5.5, style: 'fill:#000' }, svg);
    tx(svg, fr.sx(ox) + 9, fr.sy(oy) + 4, 'Operating point', 'lab tk', 'start');
  }
  function init7() {
    var map = [['f7-v', 'V'], ['f7-l', 'QL'], ['f7-d', 'D'], ['f7-ts', 'TS'], ['f7-fh', 'fh'], ['f7-hw', 'hw'], ['f7-ad', 'ad']];
    map.forEach(function (a) {
      var inp = $(a[0]);
      inp.addEventListener('input', function () { f7[a[1]] = Number(inp.value); update7(false); });
      inp.addEventListener('change', function () { f7[a[1]] = Number(inp.value); update7(true); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-f7]'), function (b) {
      b.addEventListener('click', function () { setF7(F7S[b.getAttribute('data-f7')]); });
    });
    $('f7-copy').addEventListener('click', function () {
      var q = f7res; if (!q) return;
      var r = q.r, lines = ['item,value,unit',
        'vapour load,' + q.p.V + ',kg/h', 'liquid load,' + q.p.QL.toFixed(2) + ',m3/h', 'vapour density,' + q.p.rhoV + ',kg/m3', 'liquid density,' + q.p.rhoL + ',kg/m3', 'surface tension,' + q.p.sig + ',mN/m', 'system factor,' + q.p.SF + ',-',
        'diameter,' + (q.p.D * 1000).toFixed(0) + ',mm', 'tray spacing,' + q.p.TS + ',mm', 'downcomer area,' + (q.p.ad * 100).toFixed(1) + ',% of column', 'hole area,' + (q.p.fh * 100).toFixed(1) + ',% of active', 'weir height,' + q.p.hw + ',mm', 'weir length,' + r.lw.toFixed(3) + ',m',
        'flow parameter,' + r.FLV.toFixed(4) + ',-', 'jet flood,' + (r.flood * 100).toFixed(1) + ',%', 'downcomer backup,' + r.hb.toFixed(1) + ',mm liquid', 'backup of allowable,' + (r.hbFrac * 100).toFixed(1) + ',%', 'downcomer residence,' + r.tres.toFixed(2) + ',s', 'downcomer entrance velocity,' + r.udc.toFixed(4) + ',m/s',
        'weir load,' + r.weirLoad.toFixed(2) + ',m3/(h m)', 'weir crest,' + r.how.toFixed(1) + ',mm liquid', 'hole F-factor,' + r.Fh.toFixed(2) + ',Pa^0.5', 'dry tray drop,' + r.hd.toFixed(1) + ',mm liquid', 'total tray drop,' + r.ht.toFixed(1) + ',mm liquid', 'total tray drop,' + r.dP.toFixed(2) + ',mbar'];
      copyText(lines.join('\n'), $('f7-copy-note'), $('fig7'));
    });
    setF7(F7S.bot);
  }

  /* ---------- Figure 8: column P&ID with its control system ---------- */
  var P8 = { scheme: 'lv', pc: 'cw', layer: 'all', sel: null };
  var R8 = 17;
  function d8(pts) { var d = ''; for (var i = 0; i < pts.length; i++) d += (i ? 'L' : 'M') + pts[i][0] + ' ' + pts[i][1]; return d; }
  function g8(parent, k, layer, sel) {
    var a = {};
    if (k) a['data-k'] = k;
    if (layer) a['data-layer'] = layer;
    if (sel) a['data-sel'] = sel;
    return el('g', a, parent);
  }
  function pipe8(g, pts, cls, arrow) {
    var p = el('path', { d: d8(pts), 'class': cls || 'pp' }, g);
    if (arrow) p.setAttribute('marker-end', 'url(#p8a)');
    return p;
  }
  function sig8(g, pts, sis) { return el('path', { d: d8(pts), 'class': sis ? 'sg sg-s' : 'sg' }, g); }
  function soft8(g, pts) {
    el('path', { d: d8(pts), 'class': 'sw' }, g);
    var step = 13, carry = step / 2;
    for (var i = 1; i < pts.length; i++) {
      var x0 = pts[i - 1][0], y0 = pts[i - 1][1], dx = pts[i][0] - x0, dy = pts[i][1] - y0, L = Math.sqrt(dx * dx + dy * dy), s = carry;
      while (s < L) { el('circle', { cx: (x0 + dx * s / L).toFixed(1), cy: (y0 + dy * s / L).toFixed(1), r: 2.2, 'class': 'sw-o' }, g); s += step; }
      carry = s - L;
    }
  }
  function tap8(g, pts) { return el('path', { d: d8(pts), 'class': 'tap' }, g); }
  function t8(g, x, y, s, cls, anchor) { var t = el('text', { x: x, y: y, 'class': cls || 'lbl', 'text-anchor': anchor || 'start' }, g); t.textContent = s; return t; }
  /* kind: f field transmitter, fs field transmitter wired to the SIS, b control-system function, s SIS function */
  function bub8(g, x, y, L, N, kind) {
    var sis = kind === 'fs' || kind === 's', cls = sis ? 'ib ib-s' : 'ib', tc = sis ? 'it it-s' : 'it', R = kind === 's' ? 19 : R8;
    if (kind === 's') tc += ' it-h';
    if (kind === 'b' || kind === 's') el('rect', { x: x - R, y: y - R, width: 2 * R, height: 2 * R, 'class': cls }, g);
    if (kind === 's') el('path', { d: 'M' + x + ' ' + (y - R) + 'L' + (x + R) + ' ' + y + 'L' + x + ' ' + (y + R) + 'L' + (x - R) + ' ' + y + 'Z', 'class': cls + ' ib-d' }, g);
    else el('circle', { cx: x, cy: y, r: R, 'class': cls }, g);
    if (kind === 'b' || kind === 's') el('line', { x1: x - R, x2: x + R, y1: y, y2: y, 'class': sis ? 'ibl ibl-s' : 'ibl' }, g);
    t8(g, x, y - 4, L, tc, 'middle');
    t8(g, x, y + 12, N, tc + ' itn', 'middle');
  }
  function inter8(g, x, y) {
    var r = 18;
    el('path', { d: 'M' + x + ' ' + (y - r) + 'L' + (x + r) + ' ' + y + 'L' + x + ' ' + (y + r) + 'L' + (x - r) + ' ' + y + 'Z', 'class': 'ib ib-s' }, g);
    t8(g, x, y - 2, 'I', 'it it-s', 'middle');
    t8(g, x, y + 10, '100', 'it it-s itn', 'middle');
  }
  /* control valve or shutdown valve; act = up, down, left or right */
  function valve8(g, x, y, act, type) {
    var rot = { up: 0, down: 180, right: 90, left: -90 }[act || 'up'];
    var v = el('g', { transform: 'translate(' + x + ' ' + y + ') rotate(' + rot + ')' }, g);
    el('path', { d: 'M-10 -7L10 7L10 -7L-10 7Z', 'class': 'vb' }, v);
    el('line', { x1: 0, y1: 0, x2: 0, y2: type === 'xv' ? -14 : -14, 'class': 'vs' }, v);
    if (type === 'xv') el('rect', { x: -8, y: -25, width: 16, height: 11, 'class': 'vb' }, v);
    else el('path', { d: 'M-9 -14A9 9 0 0 1 9 -14Z', 'class': 'vb' }, v);
    return v;
  }
  function fe8(g, x, y) {
    el('line', { x1: x - 3, x2: x - 3, y1: y - 8, y2: y + 8, 'class': 'fe' }, g);
    el('line', { x1: x + 3, x2: x + 3, y1: y - 8, y2: y + 8, 'class': 'fe' }, g);
  }
  function pump8(g, x, y, lab, ly) {
    el('path', { d: 'M' + (x - 11) + ' ' + (y + 18) + 'L' + (x + 11) + ' ' + (y + 18) + 'L' + x + ' ' + (y + 6) + 'Z', 'class': 'eqp' }, g);
    el('circle', { cx: x, cy: y, r: 14, 'class': 'eqp' }, g);
    t8(g, x, ly, lab, 'eq-t', 'middle');
  }
  function psv8(g, x, y) {
    el('path', { d: 'M' + (x - 8) + ' ' + (y + 12) + 'L' + (x + 8) + ' ' + (y + 12) + 'L' + x + ' ' + y + 'Z', 'class': 'vb' }, g);
    el('path', { d: 'M' + (x + 12) + ' ' + (y - 8) + 'L' + (x + 12) + ' ' + (y + 8) + 'L' + x + ' ' + y + 'Z', 'class': 'vb' }, g);
    el('path', { d: 'M' + x + ' ' + y + 'V' + (y - 4) + 'l-5 -2l10 -4l-10 -4l10 -4l-5 -2V' + (y - 22) + 'M' + (x - 6) + ' ' + (y - 22) + 'H' + (x + 6), 'class': 'vs' }, g);
  }

  function draw8() {
    var c = $('f8-chart'); if (!c) return;
    var s = P8, lv = s.scheme === 'lv';
    c.innerHTML = '';
    var svg = el('svg', { viewBox: '0 0 1080 720', 'class': 'pid', role: 'group', 'aria-labelledby': 'fig8-t' }, c);
    var defs = el('defs', {}, svg);
    var mk = el('marker', { id: 'p8a', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0L10 5L0 10Z', fill: '#000' }, mk);
    el('rect', { x: 0, y: 0, width: 1080, height: 720, fill: 'transparent', 'data-bg': '1' }, svg);
    var P = el('g', {}, svg), E = el('g', {}, svg), I = el('g', {}, svg);

    /* ---- process and utility lines ---- */
    pipe8(P, [[340, 120], [340, 70], [640, 70], [640, 95]], 'pp', true);
    if (s.pc === 'hvb') {
      pipe8(P, [[640, 70], [890, 70], [890, 175]], 'pp', true);
      pipe8(P, [[650, 135], [650, 240], [800, 240], [800, 225]], 'pp', true);
      t8(P, 704, 106, 'Note 1', 'lbl-s');
    } else {
      pipe8(P, [[650, 135], [650, 152], [800, 152], [800, 175]], 'pp', true);
    }
    if (s.pc === 'vent') {
      pipe8(P, [[850, 175], [850, 95], [1040, 95]], 'pp', true);
      t8(P, 1040, 86, 'To flare', 'lbl', 'end');
      pipe8(P, [[1040, 135], [890, 135], [890, 175]], 'pu', true);
      t8(P, 1040, 128, 'N₂', 'lbl', 'end');
    }
    pipe8(P, [[528, 122], [580, 122]], 'pu', true); t8(P, 524, 126, 'CWS', 'lbl', 'end');
    pipe8(P, [[700, 115], [800, 115]], 'pu', true); t8(P, 804, 119, 'CWR', 'lbl');
    pipe8(P, [[820, 225], [820, 300], [786, 300]], 'pp', true);
    pipe8(P, [[770, 286], [730, 286]], 'pp');
    pipe8(P, [[730, 286], [450, 286], [450, 158], [380, 158]], 'pp', true);
    pipe8(P, [[730, 286], [730, 350], [1040, 350]], 'pp', true); t8(P, 1040, 341, 'Distillate', 'lbl', 'end');
    pipe8(P, [[20, 315], [300, 315]], 'pp', true); t8(P, 22, 304, 'Feed', 'lbl');
    pipe8(P, [[1040, 548], [610, 548]], 'pu', true); t8(P, 1040, 539, 'LP steam', 'lbl', 'end');
    pipe8(P, [[610, 588], [641, 588]], 'pu'); pipe8(P, [[655, 588], [700, 588]], 'pu', true); t8(P, 704, 592, 'Condensate', 'lbl');
    pipe8(P, [[585, 520], [585, 505], [380, 505]], 'pp', true);
    pipe8(P, [[380, 594], [530, 594], [530, 625], [585, 625], [585, 600]], 'pp', true);
    pipe8(P, [[340, 620], [340, 672], [315, 672]], 'pp', true);
    pipe8(P, [[300, 658], [20, 658]], 'pp', true); t8(P, 22, 677, 'Bottoms', 'lbl');
    /* orifice plates */
    fe8(P, 70, 315); fe8(P, 670, 286); fe8(P, 820, 548); fe8(P, 900, 350); fe8(P, 225, 658);

    /* ---- equipment ---- */
    el('path', { d: 'M300 142A40 22 0 0 1 380 142V598A40 22 0 0 1 300 598Z', 'class': 'eqp' }, E);
    for (var i = 0; i < 13; i++) {
      var ty = 172 + 26 * i;
      if (i % 2 === 0) { el('line', { x1: 300, x2: 362, y1: ty, y2: ty, 'class': 'tray8' }, E); el('line', { x1: 362, x2: 362, y1: ty, y2: ty + 15, 'class': 'tray8' }, E); }
      else { el('line', { x1: 318, x2: 380, y1: ty, y2: ty, 'class': 'tray8' }, E); el('line', { x1: 318, x2: 318, y1: ty, y2: ty + 15, 'class': 'tray8' }, E); }
    }
    el('line', { x1: 302, x2: 378, y1: 548, y2: 548, 'class': 'nll' }, E);
    t8(E, 292, 110, 'C-101', 'eq-t', 'end');
    el('rect', { x: 580, y: 95, width: 120, height: 40, rx: 14, 'class': 'eqp' }, E); t8(E, 640, 119, 'E-101', 'eq-t', 'middle');
    el('rect', { x: 760, y: 175, width: 160, height: 50, rx: 25, 'class': 'eqp' }, E); t8(E, 840, 204, 'D-101', 'eq-t', 'middle');
    el('rect', { x: 560, y: 520, width: 50, height: 80, rx: 10, 'class': 'eqp' }, E); t8(E, 585, 564, 'E-102', 'eq-t', 'middle');
    pump8(E, 770, 300, 'P-101A/B', 332);
    pump8(E, 300, 672, 'P-102A/B', 706);
    el('circle', { cx: 648, cy: 588, r: 7, 'class': 'eqp' }, E); t8(E, 648, 592, 'T', 'lbl-t', 'middle');

    /* ---- BPCS loops ---- */
    var g;
    /* pressure */
    g = g8(I, 'p101', 'b', 'p101'); tap8(g, [[400, 70], [400, 57]]); sig8(g, [[417, 40], [439, 40]]);
    if (s.pc === 'cw') sig8(g, [[456, 23], [456, 12], [760, 12], [760, 92]]);
    if (s.pc === 'hvb') sig8(g, [[456, 23], [456, 12], [930, 12], [930, 120], [914, 120]]);
    if (s.pc === 'vent') { sig8(g, [[456, 23], [456, 12], [990, 12], [990, 118], [970, 118]]); sig8(g, [[960, 12], [960, 72]]); t8(g, 996, 56, 'Split', 'lbl-s'); t8(g, 996, 69, 'range', 'lbl-s'); }
    bub8(g, 400, 40, 'PT', '101', 'f');
    bub8(g, 456, 40, 'PIC', '101', 'b');
    if (s.pc === 'cw') { valve8(g, 760, 115, 'up'); t8(g, 772, 134, 'FO', 'fail'); }
    if (s.pc === 'hvb') { valve8(g, 890, 120, 'right'); t8(g, 878, 124, 'FC', 'fail', 'end'); }
    if (s.pc === 'vent') {
      valve8(g, 960, 95, 'up'); t8(g, 946, 89, 'A · FO', 'fail', 'end');
      valve8(g, 960, 135, 'up'); t8(g, 946, 129, 'B · FC', 'fail', 'end');
    }
    /* feed */
    g = g8(I, 'f102', 'b', 'f102'); tap8(g, [[70, 282], [70, 307]]); sig8(g, [[87, 265], [108, 265]]); sig8(g, [[125, 282], [125, 292]]);
    bub8(g, 70, 265, 'FT', '102', 'f'); bub8(g, 125, 265, 'FIC', '102', 'b'); valve8(g, 125, 315, 'up'); t8(g, 137, 334, 'FC', 'fail');
    g = g8(I, 't103', 'b', 't103'); tap8(g, [[232, 282], [232, 315]]); bub8(g, 232, 265, 'TI', '103', 'b');
    /* reflux */
    g = g8(I, 'f104', 'b', 'f104'); tap8(g, [[670, 294], [670, 315]]); sig8(g, [[653, 332], [617, 332]]); sig8(g, [[600, 315], [600, 310]]);
    bub8(g, 670, 332, 'FT', '104', 'f'); bub8(g, 600, 332, 'FIC', '104', 'b'); valve8(g, 600, 286, 'down'); t8(g, 613, 279, 'FO', 'fail');
    /* stripping-section temperature */
    g = g8(I, 't105', 'b', 't105'); tap8(g, [[380, 458], [395, 458]]); sig8(g, [[429, 458], [463, 458]]);
    bub8(g, 412, 458, 'TT', '105', 'f'); bub8(g, 480, 458, lv ? 'TIC' : 'TI', '105', 'b');
    if (lv) soft8(g8(I, 't105 f106', 'b'), [[497, 458], [740, 458], [740, 478]]);
    /* steam */
    g = g8(I, 'f106', 'b', 'f106'); tap8(g, [[820, 512], [820, 540]]); sig8(g, [[803, 495], [757, 495]]); sig8(g, [[740, 512], [740, 525]]);
    bub8(g, 820, 495, 'FT', '106', 'f'); bub8(g, 740, 495, 'FIC', '106', 'b'); valve8(g, 740, 548, 'up'); t8(g, 752, 567, 'FC', 'fail');
    /* column pressure drop */
    g = g8(I, 'pd107', 'b', 'pd107');
    tap8(g, [[300, 182], [270, 182], [270, 208]]);
    el('path', { d: 'M270 242V305A10 10 0 0 0 270 325V500H300', 'class': 'tap' }, g);
    sig8(g, [[253, 225], [232, 225]]);
    bub8(g, 270, 225, 'PDT', '107', 'f'); bub8(g, 215, 225, 'PDI', '107', 'b');
    /* analysers */
    g = g8(I, 'a108', 'b', 'a108'); tap8(g, [[850, 322], [850, 350]]); bub8(g, 850, 305, 'AI', '108', 'b');
    g = g8(I, 'a109', 'b', 'a109'); tap8(g, [[75, 632], [75, 658]]); bub8(g, 75, 615, 'AI', '109', 'b');
    /* distillate */
    g = g8(I, 'f110', 'b', 'f110'); tap8(g, [[900, 322], [900, 342]]); sig8(g, [[917, 305], [963, 305]]); sig8(g, [[980, 322], [980, 327]]);
    bub8(g, 900, 305, 'FT', '110', 'f'); bub8(g, 980, 305, 'FIC', '110', 'b'); valve8(g, 980, 350, 'up'); t8(g, 992, 369, 'FC', 'fail');
    /* reflux-drum level */
    g = g8(I, 'l111', 'b', 'l111'); tap8(g, [[920, 200], [937, 200]]); sig8(g, [[971, 200], [995, 200]]);
    if (lv) soft8(g8(I, 'l111 f110', 'b'), [[1012, 217], [1012, 305], [997, 305]]);
    else soft8(g8(I, 'l111 f104', 'b'), [[1029, 200], [1060, 200], [1060, 382], [600, 382], [600, 349]]);
    bub8(g, 954, 200, 'LT', '111', 'f'); bub8(g, 1012, 200, 'LIC', '111', 'b');
    /* sump level */
    g = g8(I, 'l113', 'b', 'l113'); tap8(g, [[300, 560], [279, 560]]); sig8(g, [[245, 560], [222, 560]]);
    soft8(g8(I, 'l113 f114', 'b'), [[188, 560], [150, 560], [150, 598]]);
    bub8(g, 262, 560, 'LT', '113', 'f'); bub8(g, 205, 560, 'LIC', '113', 'b');
    /* bottoms */
    g = g8(I, 'f114', 'b', 'f114'); tap8(g, [[225, 632], [225, 650]]); sig8(g, [[208, 615], [167, 615]]); sig8(g, [[150, 632], [150, 635]]);
    bub8(g, 225, 615, 'FT', '114', 'f'); bub8(g, 150, 615, 'FIC', '114', 'b'); valve8(g, 150, 658, 'up'); t8(g, 162, 677, 'FC', 'fail');
    /* rectifying-section temperature */
    g = g8(I, 't120', 'b', 't120'); tap8(g, [[380, 250], [395, 250]]); sig8(g, [[429, 250], [493, 250]]);
    bub8(g, 412, 250, 'TT', '120', 'f'); bub8(g, 510, 250, lv ? 'TI' : 'TIC', '120', 'b');
    if (!lv) soft8(g8(I, 't120 f110', 'b'), [[527, 250], [980, 250], [980, 288]]);

    /* ---- safety layer ---- */
    g = g8(I, 'p116', 's', 'p116'); tap8(g, [[300, 150], [279, 150]]); sig8(g, [[245, 150], [222, 150]], true);
    bub8(g, 262, 150, 'PT', '116', 'fs'); bub8(g, 205, 150, 'PAHH', '116', 's');
    g = g8(I, 'l112', 's', 'l112'); tap8(g, [[760, 200], [752, 200]]); sig8(g, [[718, 200], [705, 200]], true);
    bub8(g, 735, 200, 'LT', '112', 'fs'); bub8(g, 688, 200, 'LAHH', '112', 's');
    g = g8(I, 'l115', 's', 'l115'); tap8(g, [[380, 552], [395, 552]]); sig8(g, [[429, 552], [503, 552]], true);
    bub8(g, 412, 552, 'LT', '115', 'fs'); bub8(g, 468, 552, 'LAHH', '115', 's'); bub8(g, 520, 552, 'LALL', '115', 's');
    g = g8(I, 'x121', 's', 'x121'); sig8(g, [[180, 280], [180, 290]], true); valve8(g, 180, 315, 'up', 'xv'); inter8(g, 180, 262); t8(g, 192, 334, 'FC', 'fail'); t8(g, 180, 345, 'XV-121', 'tagv', 'middle');
    g = g8(I, 'x117', 's', 'x117'); sig8(g, [[660, 518], [660, 523]], true); valve8(g, 660, 548, 'up', 'xv'); inter8(g, 660, 500); t8(g, 672, 567, 'FC', 'fail'); t8(g, 660, 578, 'XV-117', 'tagv', 'middle');
    g = g8(I, 'x102', 's', 'x102'); sig8(g, [[352, 690], [313, 678]], true); inter8(g, 370, 690);
    g = g8(I, 'psv', 's', 'psv'); tap8(g, [[520, 70], [520, 64]]); pipe8(g, [[532, 52], [560, 52]], 'pp', true); psv8(g, 520, 52);
    t8(g, 564, 56, 'Flare', 'lbl'); t8(g, 520, 25, 'PSV-118', 'tagv', 'middle');

    /* focusable controls: one per loop */
    Array.prototype.forEach.call(svg.querySelectorAll('[data-sel]'), function (n) {
      var id = n.getAttribute('data-sel'), inf = INFO8[id] ? INFO8[id](P8) : null;
      if (!inf || n.parentNode.closest && n.parentNode.closest('[data-sel]')) return;
      n.setAttribute('tabindex', '0'); n.setAttribute('role', 'button');
      n.setAttribute('aria-label', inf.t.replace(' · ', ', ') + '. Show what this loop does.');
    });
    apply8();
  }

  var REL8 = {
    common: { p116: ['p116', 'x117', 'x121'], l112: ['l112', 'x117', 'x121'], l115: ['l115', 'x121', 'x102'], x117: ['x117', 'p116', 'l112'], x121: ['x121', 'p116', 'l112', 'l115'], x102: ['x102', 'l115'], l113: ['l113', 'f114'], f114: ['f114', 'l113'] },
    lv: { t105: ['t105', 'f106'], f106: ['f106', 't105'], l111: ['l111', 'f110'], f110: ['f110', 'l111'] },
    dv: { l111: ['l111', 'f104'], f104: ['f104', 'l111'], t120: ['t120', 'f110'], f110: ['f110', 't120'] }
  };
  function apply8() {
    var c = $('f8-chart'); if (!c) return;
    var sel = P8.sel, rel = sel ? (REL8[P8.scheme][sel] || REL8.common[sel] || [sel]) : null;
    Array.prototype.forEach.call(c.querySelectorAll('[data-k]'), function (n) {
      var ks = n.getAttribute('data-k').split(' '), lay = n.getAttribute('data-layer');
      var off = P8.layer !== 'all' && lay && lay !== P8.layer;
      n.classList.toggle('off', off);
      var hit = rel && ks.some(function (k) { return rel.indexOf(k) >= 0; });
      n.classList.toggle('hl', !!hit);
      n.classList.toggle('dim', !!rel && !hit && !off);
    });
    Array.prototype.forEach.call(c.querySelectorAll('[data-sel]'), function (n) { if (n.hasAttribute('aria-pressed') || n.getAttribute('role') === 'button') n.setAttribute('aria-pressed', n.getAttribute('data-sel') === sel ? 'true' : 'false'); });
    info8();
  }
  function row8(k, v) { return v ? '<div class="pr"><dt>' + k + '</dt><dd>' + v + '</dd></div>' : ''; }
  function info8() {
    var box = $('f8-info'); if (!box) return;
    if (!P8.sel || !INFO8[P8.sel]) {
      box.innerHTML = '<p class="pid-h">Select any bubble or valve</p><p class="pid-p">The panel shows what that loop measures, what it moves, where its set point comes from, how its valve fails and why it is there. Press Escape to clear the selection.</p>';
      return;
    }
    var f = INFO8[P8.sel](P8);
    var h = '<p class="pid-h">' + f.t + '</p><dl class="pid-dl">' + row8('Measures', f.m) + row8('Moves', f.mv) + row8('Set point', f.sp) + row8('On air failure', f.fail) + row8('Alarms', f.al) + row8('Why', f.why) + '</dl>';
    box.innerHTML = h.replace(/\b([A-Z]{1,5}-\d{3}[A-Z]?(?:\/B)?)/g, '<span class="nw">$1</span>');
  }
  var INFO8 = {
    p101: function (s) {
      var mv = { cw: 'PV-101 on the cooling-water return from E-101.', hvb: 'PV-101 in the hot-vapour bypass from the overhead line to the vapour space of D-101.', vent: 'Split range: PV-101B admits nitrogen over the first half of the controller output, PV-101A vents to flare over the second half.' }[s.pc];
      var fl = { cw: 'PV-101 opens: full cooling.', hvb: 'PV-101 closes: the whole condenser surface is exposed to vapour.', vent: 'PV-101A (vent) opens, PV-101B (nitrogen) closes. Confirm both in the HAZOP.' }[s.pc];
      var why = { cw: 'More water condenses more vapour and lowers the pressure. Throttled cooling water fouls at low velocity and responds slowly, so on air coolers the same loop moves fan pitch, fan speed or louvres instead.', hvb: 'E-101 sits below D-101 and runs partly flooded (note 1). Closing the bypass lets the drum liquid surface cool and the drum pressure fall, condensate drains out of E-101, more tubes see vapour and the column pressure falls. Opening it does the reverse.', vent: 'For overheads that carry inerts or light ends that will not condense, and for columns close to atmospheric pressure. Every vent opening sends some product to flare.' }[s.pc];
      return { t: 'PIC-101 · Column pressure', m: 'Overhead pressure, PT-101.', mv: mv, sp: 'Operator. Lower pressure raises relative volatility, so many plants run as low as the condenser allows.', fail: fl, al: 'PAH and PAL in the control system. The high-high trip uses its own transmitter, PT-116.', why: why };
    },
    f102: function () { return { t: 'FIC-102 · Feed flow', m: 'FT-102 across orifice plate FE-102.', mv: 'FV-102.', sp: 'Operator, or the upstream unit.', fail: 'FV-102 closes.', al: 'FAL.', why: 'Throughput is usually set upstream. When the upstream unit uses this flow to hold its own level, the column has to absorb the swings, which is one more reason for a fast temperature loop.' }; },
    t103: function () { return { t: 'TI-103 · Feed temperature', m: 'Feed temperature just before the nozzle.', why: 'It tells you the feed condition q. A colder feed adds liquid to the stripping section and needs more boil-up for the same split.' }; },
    f104: function (s) {
      return { t: 'FIC-104 · Reflux flow', m: 'FT-104 across FE-104.', mv: 'FV-104.', sp: s.scheme === 'lv' ? 'Operator, or a ratio to feed flow so reflux follows throughput.' : 'LIC-111, the reflux-drum level (cascade).', fail: 'FV-104 opens, keeping the top trays wet while heat input trips.', al: 'FAL: loss of reflux is a relief case.',
        why: s.scheme === 'lv' ? 'In the LV scheme reflux L and boil-up V are left for composition. Fixing L and closing one temperature loop with V is the usual choice.' : 'With a high reflux ratio, reflux is by far the largest stream leaving the drum, so it is the one that can hold the level.' };
    },
    t105: function (s) {
      if (s.scheme === 'lv') return { t: 'TIC-105 · Stripping-section temperature', m: 'TT-105 on the tray where temperature changes most from tray to tray.', mv: 'Set point of FIC-106, the reboiler steam (cascade).', sp: 'Operator, or slowly from the bottoms analyser AI-109.', al: 'TAH and TAL.', why: 'Boil-up acts on a bottom-section temperature with almost no delay. The steam flow loop inside the cascade absorbs steam-header pressure swings before they reach the column.' };
      return { t: 'TI-105 · Stripping-section temperature', m: 'TT-105.', why: 'In this DV scheme boil-up runs on flow control, so this temperature is watched rather than controlled.' };
    },
    f106: function (s) { return { t: 'FIC-106 · Reboiler steam flow', m: 'FT-106 across FE-106.', mv: 'FV-106.', sp: s.scheme === 'lv' ? 'TIC-105 (cascade).' : 'Operator, or a ratio to feed flow.', fail: 'FV-106 closes: heat input stops.', why: 'XV-117 sits in series on the same line. It is the safety valve; this control valve does not count as a safeguard.' }; },
    pd107: function () { return { t: 'PDI-107 · Column pressure drop', m: 'PDT-107, with taps above the top tray and below the bottom tray.', al: 'PDAH.', why: 'A pressure drop that climbs faster than the vapour load and turns noisy is the first sign of flooding or foaming (section 11). Trend it against load.' }; },
    a108: function () { return { t: 'AI-108 · Distillate analyser', m: 'Impurity in the distillate, usually by an on-line gas chromatograph.', al: 'High impurity: off-specification product.', why: 'Analysers are slow, a few minutes per sample, so they correct a temperature set point slowly instead of moving a valve.' }; },
    a109: function () { return { t: 'AI-109 · Bottoms analyser', m: 'Light key in the bottoms.', al: 'High light key: off-specification bottoms.', why: 'In the LV scheme it can trim the TIC-105 set point slowly (cascade) once the analyser has proved reliable.' }; },
    f110: function (s) {
      return { t: 'FIC-110 · Distillate flow', m: 'FT-110 across FE-110.', mv: 'FV-110.', sp: s.scheme === 'lv' ? 'LIC-111 (cascade): distillate takes whatever the drum collects.' : 'TIC-120 (cascade): the distillate rate sets the split directly.', fail: 'FV-110 closes, holding inventory and keeping vapour out of storage.',
        why: s.scheme === 'lv' ? 'Distillate is taken downstream of the reflux pump, not from the drum, so it does not flash across the valve.' : 'This is material-balance control: a change in distillate rate changes purity at once, but reflux now moves only through the level loop, so LIC-111 must be tuned tight.' };
    },
    l111: function (s) { return { t: 'LIC-111 · Reflux-drum level', m: 'LT-111.', mv: s.scheme === 'lv' ? 'Set point of FIC-110, distillate.' : 'Set point of FIC-104, reflux.', sp: 'Operator.', al: 'LAH and LAL. The high-high trip comes from the separate LT-112.', why: s.scheme === 'lv' ? 'The drum is a surge volume. Tune the loop slowly (averaging control) when the next unit benefits from a steady distillate flow.' : 'Control level with the largest stream. When reflux is several times the distillate, the distillate valve is too small to hold the level.' }; },
    l113: function () { return { t: 'LIC-113 · Column sump level', m: 'LT-113.', mv: 'Set point of FIC-114, bottoms.', sp: 'Operator.', al: 'LAH and LAL. Trips come from the separate LT-115.', why: 'Keep the level well below the reboiler return nozzle: liquid above it floods the bottom trays, one of the most common column malfunctions.' }; },
    f114: function () { return { t: 'FIC-114 · Bottoms flow', m: 'FT-114 across FE-114.', mv: 'FV-114.', sp: 'LIC-113 (cascade).', fail: 'FV-114 closes.', why: 'The inner flow loop rejects pressure changes downstream before they disturb the level.' }; },
    t120: function (s) {
      if (s.scheme === 'dv') return { t: 'TIC-120 · Rectifying-section temperature', m: 'TT-120.', mv: 'Set point of FIC-110, distillate (cascade).', sp: 'Operator, or slowly from AI-108.', al: 'TAH and TAL.', why: 'Too much distillate drags heavy material overhead and this tray warms; the controller then cuts the distillate.' };
      return { t: 'TI-120 · Rectifying-section temperature', m: 'TT-120.', why: 'Watched in the LV scheme. A second controller here acting on reflux gives dual-temperature control, but the two loops interact strongly.' };
    },
    p116: function () { return { t: 'PAHH-116 · Column high-high pressure (SIS)', m: 'PT-116, a transmitter separate from PT-101.', mv: 'Through interlock I-100: closes XV-117 (reboiler steam) and XV-121 (feed).', sp: 'Above the PIC-101 high alarm and below the PSV-118 set pressure.', why: 'Cutting the heat removes the source of vapour, so the relief valve may never need to lift. It counts as a protection layer only because its transmitter, logic and valve are separate from PIC-101.' }; },
    l112: function () { return { t: 'LAHH-112 · Reflux-drum high-high level (SIS)', m: 'LT-112, separate from LT-111.', mv: 'Through I-100: closes XV-117 and XV-121.', why: 'A full drum sends liquid into the vent and flare system, and a column that keeps boiling with nowhere to put its condensate overpressures.' }; },
    l115: function () { return { t: 'LAHH-115 and LALL-115 · Sump high-high and low-low level (SIS)', m: 'LT-115, separate from LT-113.', mv: 'Through I-100: high-high closes XV-121 (feed); low-low stops P-102A/B.', why: 'High-high stops the column filling, the failure at Texas City (section 16). Low-low protects the pump; where downstream equipment is at lower pressure, add a shutdown valve on the bottoms so vapour cannot blow through.' }; },
    x117: function () { return { t: 'XV-117 · Reboiler steam shutdown valve', mv: 'Closed by interlock I-100 on PAHH-116 or LAHH-112.', fail: 'Closes.', why: 'A separate valve from FV-106, so a control valve stuck open cannot defeat the trip. Trips latch; the operator resets them after the cause has cleared.' }; },
    x121: function () { return { t: 'XV-121 · Feed shutdown valve', mv: 'Closed by I-100 on PAHH-116, LAHH-112 or LAHH-115.', fail: 'Closes.', why: 'Stopping the feed stops the inventory growing while the cause is found.' }; },
    x102: function () { return { t: 'I-100 to P-102A/B · Bottoms pump trip', mv: 'Stops the running bottoms pump on LALL-115.', why: 'A centrifugal pump running dry overheats its seal within minutes. The trip goes to the motor starter, not through the control system.' }; },
    psv: function () { return { t: 'PSV-118 · Column relief valve', mv: 'Opens to the closed flare header.', sp: 'At or below the column design pressure.', why: 'The last layer. It is sized for the largest credible case from API 521, usually loss of overhead cooling (section 16).' }; }
  };

  function init8() {
    var c = $('f8-chart'); if (!c) return;
    var segs = [['data-f8s', 'scheme'], ['data-f8p', 'pc'], ['data-f8l', 'layer']];
    segs.forEach(function (sg) {
      Array.prototype.forEach.call(document.querySelectorAll('[' + sg[0] + ']'), function (b) {
        b.addEventListener('click', function () {
          P8[sg[1]] = b.getAttribute(sg[0]);
          Array.prototype.forEach.call(b.parentNode.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          var keep = P8.sel; draw8();
          if (keep) { var n = c.querySelector('[tabindex][data-sel="' + keep + '"]'); if (!n) { P8.sel = null; apply8(); } }
        });
      });
    });
    var pick = function (n) {
      var id = n.getAttribute('data-sel');
      P8.sel = P8.sel === id ? null : id; apply8();
    };
    c.addEventListener('click', function (e) {
      var n = e.target.closest ? e.target.closest('[data-sel]') : null;
      if (n && !n.closest('.off')) pick(n);
      else if (P8.sel) { P8.sel = null; apply8(); }
    });
    c.addEventListener('keydown', function (e) {
      var n = e.target.closest ? e.target.closest('[data-sel]') : null;
      if ((e.key === 'Enter' || e.key === ' ') && n) { e.preventDefault(); pick(n); }
      if (e.key === 'Escape' && P8.sel) { P8.sel = null; apply8(); }
    });
    draw8();
  }

  /* ---------- toggles and problems ---------- */
  function initToggles() {
    Array.prototype.forEach.call(document.querySelectorAll('.toggle'), function (b) {
      b.addEventListener('click', function () {
        var tgt = $(b.getAttribute('aria-controls')); if (!tgt) return;
        var open = b.getAttribute('aria-expanded') === 'true';
        b.setAttribute('aria-expanded', open ? 'false' : 'true');
        tgt.hidden = open;
        var last = b.lastChild;
        if (last && last.nodeType === 3) last.textContent = last.textContent.replace(open ? 'Hide' : 'Show', open ? 'Show' : 'Hide');
      });
    });
  }
  function initChecks() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-check]'), function (b) {
      var id = b.getAttribute('data-check'), inp = $(id + '-in'), fb = $(id + '-fb');
      var go = function () {
        var v = parseNum(inp.value), ans = Number(b.getAttribute('data-ans')), tol = b.getAttribute('data-tol');
        if (!isFinite(v)) { fb.innerHTML = 'Enter a number first.'; return; }
        var ok = tol ? Math.abs(v - ans) <= Number(tol) : Math.abs(v - ans) <= 0.02 * Math.abs(ans);
        fb.innerHTML = ok ? '<span class="tag ok">Correct</span>' : '<span class="tag warn">Not yet</span> Check the units and the data, or open the solution.';
      };
      b.addEventListener('click', go);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    });
  }

  /* ---------- boot ---------- */
  function drawAll() { draw1(); drawCol1(); draw2(); draw3(); draw4(); draw5(); draw6(); draw7(); }
  init1(); draw2(); init3(); draw4(); draw5(); init6(); init7(); init8(); initToggles(); initChecks();
  var rt = null, lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(rt); rt = setTimeout(drawAll, 150);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);
})();
