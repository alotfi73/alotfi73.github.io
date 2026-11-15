/*!
 * Image Digitizer & Area Tool  v1.0.0
 * Measure areas, area ratios and data points on images / chart images.
 * Dependency-free, runs fully offline. Requires xlsx-lite.js for Excel export.
 *
 * Usage on any web page:
 *   <link rel="stylesheet" href="css/digitizer.css">
 *   <div data-image-digitizer></div>
 *   <script src="js/xlsx-lite.js"></script>
 *   <script src="js/digitizer.js"></script>
 * or mount manually:  ImageDigitizer.mount(document.getElementById('x'), { autosave: true })
 *
 * MIT licence.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';
  var LN10 = Math.LN10;
  var PALETTE = ['#12647e', '#ab6528', '#4676bf', '#2a8285', '#697694', '#9f55c2', '#6d7c4d', '#bd5558'];  // design tokens chart-1 … chart-8
  var CAL_AXES = ['X1', 'X2', 'Y1', 'Y2'];
  var CAL_SCALE = ['P1', 'P2'];
  var CAL_COLOR = { X1: '#12647e', X2: '#12647e', Y1: '#ab6528', Y2: '#ab6528', P1: '#4676bf', P2: '#4676bf' };
  var KIND_LABEL = { polygon: 'Polygon', rect: 'Rectangle', ellipse: 'Ellipse', freehand: 'Freehand', mask: 'Colour region' };
  var ELLIPSE_N = 240;
  var FONT = '"Open Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  /* ------------------------------------------------------------------ icons */
  function svg(p) { return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
  var ICON = {
    select: svg('<path d="M5 3l13 7.5-5.5 1.6L10 18z"/><path d="M13 12.5l4 6"/>'),
    pan: svg('<path d="M12 3v18M3 12h18M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/>'),
    polygon: svg('<path d="M5 18L7.5 5.5 16 7l3.5 8.5L12 20z"/><circle cx="5" cy="18" r="1.4" fill="currentColor"/><circle cx="7.5" cy="5.5" r="1.4" fill="currentColor"/><circle cx="16" cy="7" r="1.4" fill="currentColor"/><circle cx="19.5" cy="15.5" r="1.4" fill="currentColor"/><circle cx="12" cy="20" r="1.4" fill="currentColor"/>'),
    rect: svg('<rect x="4" y="6" width="16" height="12" rx="1"/>'),
    ellipse: svg('<ellipse cx="12" cy="12" rx="8.5" ry="6"/>'),
    freehand: svg('<path d="M3 15c2.5-5 4.5 2.5 7-2.5S14.5 6 17 9.5s.5 6 4 4.5"/>'),
    wand: svg('<path d="M4 20L15 9"/><path d="M16 3v2.5M16 10.5V13M21 8h-2.5M13.5 8H11M19.5 4.5l-1.7 1.7M19.5 11.5l-1.7-1.7"/>'),
    point: svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/>'),
    calib: svg('<path d="M4 3.5V20h16.5"/><path d="M7.5 16l3.5-4.5 3 2.5 5-6.5"/><path d="M4 8h2M4 13h2M10 20v-2M15 20v-2"/>'),
    zoomIn: svg('<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5L16 16M8 11h6M11 8v6"/>'),
    zoomOut: svg('<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5L16 16M8 11h6"/>'),
    fit: svg('<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>'),
    image: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>'),
    folder: svg('<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>'),
    save: svg('<path d="M5 3h11l4 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 011-2z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>'),
    undo: svg('<path d="M9 7L4 12l5 5"/><path d="M4 12h11a5 5 0 010 10h-2"/>'),
    redo: svg('<path d="M15 7l5 5-5 5"/><path d="M20 12H9a5 5 0 000 10h2"/>'),
    help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .7-1.5 1.2-1.5 2.5"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>'),
    trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: svg('<path d="M3 3l18 18M10.6 5.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3 3.9M6.6 6.6A17 17 0 002 12s3.5 7 10 7a9.6 9.6 0 004.4-1"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    download: svg('<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>'),
    copy: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>'),
    file: svg('<path d="M6 3h8l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"/><path d="M14 3v5h5"/>'),
    sheet: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    ratio: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="14" cy="13" r="4"/>'),
    restore: svg('<path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8"/><path d="M3 3v5h5"/>')
  };

  /* ------------------------------------------------------------------ utils */
  function $(root, sel) { return root.querySelector(sel); }
  function $$(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function escHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(s) { if (typeof s === 'number') return s; var v = parseFloat(String(s).trim().replace(/,/g, '.').replace(/\s/g, '')); return isFinite(v) ? v : NaN; }
  function deep(o) { return JSON.parse(JSON.stringify(o)); }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function round(v, d) { var k = Math.pow(10, d); return Math.round(v * k) / k; }

  function fmtNum(v, sig) {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    sig = sig || 6;
    if (v === 0) return '0';
    var a = Math.abs(v);
    if (a >= 1e7 || a < 1e-4) return v.toExponential(Math.max(0, sig - 1)).replace(/\.?0+e/, 'e');
    return String(Number(v.toPrecision(sig)));
  }
  function fmtDate(d) {
    d = d || new Date();
    var M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return d.getDate() + ' ' + M[d.getMonth()] + ' ' + d.getFullYear() + ', ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function fmtInt(v) { return isFinite(v) ? Math.round(v).toLocaleString('en-US') : '—'; }

  function hexToRgb(h) {
    h = (h || '#000000').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) { return '#' + [r, g, b].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }
  function rgba(hex, a) { var c = hexToRgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  function shoelace(pts) {
    var s = 0, n = pts.length;
    for (var i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; s += p.x * q.y - q.x * p.y; }
    return s / 2;
  }
  function pointInPoly(x, y, pts) {
    var inside = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  function polyCentroid(pts) {
    var a = 0, cx = 0, cy = 0, n = pts.length;
    for (var i = 0; i < n; i++) {
      var p = pts[i], q = pts[(i + 1) % n], f = p.x * q.y - q.x * p.y;
      a += f; cx += (p.x + q.x) * f; cy += (p.y + q.y) * f;
    }
    if (Math.abs(a) < 1e-9) {
      var sx = 0, sy = 0; pts.forEach(function (p) { sx += p.x; sy += p.y; });
      return { x: sx / n, y: sy / n };
    }
    return { x: cx / (3 * a), y: cy / (3 * a) };
  }
  function polyPerimeter(pts) { var s = 0; for (var i = 0; i < pts.length; i++) s += dist(pts[i], pts[(i + 1) % pts.length]); return s; }
  function bboxOf(pts) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(function (p) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); });
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }
  function niceStep(range, target) {
    var raw = range / target; if (!(raw > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  }

  /* base64 + run-length encoding for colour masks */
  function bytesToB64(bytes) {
    var s = '', CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return btoa(s);
  }
  function b64ToBytes(b64) {
    var s = atob(b64), out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  function rleEncode(bits) {
    var out = [], cur = 0, run = 0;
    function push(n) { while (n >= 128) { out.push((n & 127) | 128); n = Math.floor(n / 128); } out.push(n); }
    for (var i = 0; i < bits.length; i++) { var b = bits[i] ? 1 : 0; if (b === cur) run++; else { push(run); cur = b; run = 1; } }
    push(run);
    return bytesToB64(Uint8Array.from(out));
  }
  function rleDecode(b64, n) {
    var bytes = b64ToBytes(b64), bits = new Uint8Array(n), pos = 0, cur = 0, i = 0;
    while (i < bytes.length && pos <= n) {
      var v = 0, mul = 1, b;
      do { b = bytes[i++]; v += (b & 127) * mul; mul *= 128; } while (b & 128 && i < bytes.length);
      if (cur) bits.fill(1, pos, Math.min(n, pos + v));
      pos += v; cur ^= 1;
    }
    return bits;
  }

  function downloadBlob(blob, filename) {
    var a = document.createElement('a');
    var url = URL.createObjectURL(blob);
    a.href = url; a.download = filename; a.rel = 'noopener';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }
  function csvCell(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') v = v.v;
    if (v === null || v === undefined) return '';
    var s = String(v);
    return /[",\n\r;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function baseName(n) { return String(n || 'image').replace(/\.[^.]+$/, '').replace(/[^\w\-]+/g, '_').slice(0, 60) || 'image'; }

  /* ------------------------------------------------------------ calibration */
  /**
   * Build the pixel -> data mapping.
   * Axes mode: the line X1-X2 is a line of constant Y and Y1-Y2 a line of constant X, so the
   * mapping pixel -> (u, v) is affine (handles rotated / skewed scans). u = x or log10(x), v = y or log10(y).
   */
  function buildCalibration(c) {
    var none = {
      ok: true, mode: 'none', calibrated: false, msg: '',
      uv: function (px, py) { return [px, py]; },
      toData: function (px, py) { return [px, py]; },
      fromUV: function (u, v) { return [u, v]; },
      weight: function () { return 1; }, constWeight: 1,
      areaUnit: 'px²', xName: 'X', yName: 'Y', xUnit: 'px', yUnit: 'px', xLog: false, yLog: false
    };
    if (!c || c.mode === 'none') return none;

    if (c.mode === 'scale') {
      var sc = c.scale, p1 = sc.pts[0], p2 = sc.pts[1], L = num(sc.length);
      var u = (sc.unit || 'unit').trim() || 'unit';
      if (!p1 || !p2) return Object.assign({}, none, { msg: 'Pick both ends of the scale bar (P1 and P2).' });
      var d = dist(p1, p2);
      if (d < 1) return Object.assign({}, none, { msg: 'P1 and P2 are too close together.' });
      if (!(L > 0)) return Object.assign({}, none, { msg: 'Enter the real length between P1 and P2.' });
      var s = L / d;
      return {
        ok: true, mode: 'scale', calibrated: true, msg: '1 px = ' + fmtNum(s, 5) + ' ' + u,
        s: s, uv: function (px, py) { return [(px - p1.x) * s, (p1.y - py) * s]; },
        toData: function (px, py) { return [(px - p1.x) * s, (p1.y - py) * s]; },
        fromUV: function (uu, vv) { return [p1.x + uu / s, p1.y - vv / s]; },
        weight: function () { return s * s; }, constWeight: s * s,
        areaUnit: u + '²', xName: 'X', yName: 'Y', xUnit: u, yUnit: u, xLog: false, yLog: false
      };
    }

    var ax = c.axes, P = ax.pts;
    if (!P[0] || !P[1] || !P[2] || !P[3]) {
      var missing = CAL_AXES.filter(function (n, i) { return !P[i]; }).join(', ');
      return Object.assign({}, none, { msg: 'Pick the remaining axis points: ' + missing + '.' });
    }
    var vals = ax.vals.map(num);
    if (vals.some(function (v) { return !isFinite(v); })) return Object.assign({}, none, { msg: 'Type a value for every axis point.' });
    var xl = !!ax.xLog, yl = !!ax.yLog;
    if (xl && (vals[0] <= 0 || vals[1] <= 0)) return Object.assign({}, none, { msg: 'A log X axis needs X1 and X2 values greater than 0.' });
    if (yl && (vals[2] <= 0 || vals[3] <= 0)) return Object.assign({}, none, { msg: 'A log Y axis needs Y1 and Y2 values greater than 0.' });
    var ux1 = xl ? Math.log10(vals[0]) : vals[0], ux2 = xl ? Math.log10(vals[1]) : vals[1];
    var vy1 = yl ? Math.log10(vals[2]) : vals[2], vy2 = yl ? Math.log10(vals[3]) : vals[3];
    if (ux1 === ux2) return Object.assign({}, none, { msg: 'X1 and X2 must have different values.' });
    if (vy1 === vy2) return Object.assign({}, none, { msg: 'Y1 and Y2 must have different values.' });
    var X1 = P[0], X2 = P[1], Y1 = P[2], Y2 = P[3];
    var dX = [X2.x - X1.x, X2.y - X1.y], dY = [Y2.x - Y1.x, Y2.y - Y1.y];
    var lx = Math.hypot(dX[0], dX[1]), ly = Math.hypot(dY[0], dY[1]);
    if (lx < 2) return Object.assign({}, none, { msg: 'X1 and X2 are too close — pick points far apart on the X axis.' });
    if (ly < 2) return Object.assign({}, none, { msg: 'Y1 and Y2 are too close — pick points far apart on the Y axis.' });
    var det = dX[0] * dY[1] - dX[1] * dY[0];
    if (Math.abs(det) < 0.05 * lx * ly) return Object.assign({}, none, { msg: 'The X1–X2 and Y1–Y2 lines are (almost) parallel. Pick X points along the horizontal axis and Y points along the vertical axis.' });
    var du = ux2 - ux1, dv = vy2 - vy1;
    var a = dY[1] * du / det, b = -dY[0] * du / det;        // gradient of u
    var cc = -dX[1] * dv / det, dd = dX[0] * dv / det;      // gradient of v
    var e = ux1 - a * X1.x - b * X1.y, f = vy1 - cc * Y1.x - dd * Y1.y;
    var detJ = a * dd - b * cc;
    var adet = Math.abs(detJ);
    function uv(px, py) { return [a * px + b * py + e, cc * px + dd * py + f]; }
    var xUnit = (ax.xUnit || '').trim(), yUnit = (ax.yUnit || '').trim();
    var angle = Math.atan2(-dX[1], dX[0]) * 180 / Math.PI;
    var skew = Math.abs(90 - Math.abs(Math.acos(clamp((dX[0] * dY[0] + dX[1] * dY[1]) / (lx * ly), -1, 1)) * 180 / Math.PI));
    var msgs = [];
    if (Math.abs(angle) > 0.5 && Math.abs(angle) < 179.5) msgs.push('X axis is rotated ' + fmtNum(angle, 3) + '° (handled automatically)');
    if (skew > 1.5) msgs.push('axes are ' + fmtNum(skew, 3) + '° from perpendicular (handled automatically)');
    return {
      ok: true, mode: 'axes', calibrated: true, msg: msgs.join('; '),
      A: [a, b, e, cc, dd, f], detJ: detJ, xLog: xl, yLog: yl,
      uv: uv,
      toData: function (px, py) { var q = uv(px, py); return [xl ? Math.pow(10, q[0]) : q[0], yl ? Math.pow(10, q[1]) : q[1]]; },
      fromUV: function (u2, v2) { var ru = u2 - e, rv = v2 - f; return [(dd * ru - b * rv) / detJ, (-cc * ru + a * rv) / detJ]; },
      weight: function (px, py) {
        var q = uv(px, py), w = adet;
        if (xl) w *= LN10 * Math.pow(10, q[0]);
        if (yl) w *= LN10 * Math.pow(10, q[1]);
        return w;
      },
      constWeight: (xl || yl) ? null : adet,
      areaUnit: (xUnit || yUnit) ? ((xUnit || 'X') + '·' + (yUnit || 'Y')) : 'X·Y units',
      xName: 'X', yName: 'Y', xUnit: xUnit, yUnit: yUnit,
      vAxisOfX: uv(X1.x, X1.y)[1], uAxisOfY: uv(Y1.x, Y1.y)[0]
    };
  }

  /** exact ∮ X(u) dY(v) along a straight (u,v) segment */
  function greenEdge(u0, v0, u1, v1, xl, yl) {
    var du = u1 - u0, dv = v1 - v0;
    if (dv === 0) return 0;
    if (!xl && !yl) return dv * (u0 + du / 2);
    if (xl && !yl) {
      var k1 = du * LN10;
      return dv * Math.pow(10, u0) * (Math.abs(k1) < 1e-12 ? 1 : Math.expm1(k1) / k1);
    }
    if (!xl && yl) {
      var k = dv * LN10, ek = Math.exp(k), em = Math.expm1(k);
      return Math.pow(10, v0) * (u0 * em + du * (ek - em / k));
    }
    var m = (du + dv) * LN10;
    return LN10 * dv * Math.pow(10, u0 + v0) * (Math.abs(m) < 1e-12 ? 1 : Math.expm1(m) / m);
  }

  /* ---------------------------------------------------------- IndexedDB kv */
  var IDB = {
    db: null,
    open: function () {
      var self = this;
      if (self.db) return Promise.resolve(self.db);
      return new Promise(function (res, rej) {
        try {
          var r = indexedDB.open('image-digitizer', 1);
          r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
          r.onsuccess = function () { self.db = r.result; res(self.db); };
          r.onerror = function () { rej(r.error); };
        } catch (e) { rej(e); }
      });
    },
    get: function (k) { return this.open().then(function (db) { return new Promise(function (res, rej) { var t = db.transaction('kv').objectStore('kv').get(k); t.onsuccess = function () { res(t.result); }; t.onerror = function () { rej(t.error); }; }); }); },
    set: function (k, v) { return this.open().then(function (db) { return new Promise(function (res, rej) { var tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = function () { res(); }; tx.onerror = function () { rej(tx.error); }; }); }); },
    del: function (k) { return this.open().then(function (db) { return new Promise(function (res) { var tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(k); tx.oncomplete = function () { res(); }; tx.onerror = function () { res(); }; }); }); }
  };

  /* ------------------------------------------------------------- template */
  function toolBtn(tool, icon, label, key, tip) {
    return '<button class="idg-tool" data-tool="' + tool + '" title="' + escHtml(tip) + ' (' + key + ')" aria-label="' + escHtml(label) + '">' + icon + '<span>' + label + '</span></button>';
  }
  function calRow(name, extraClass) {
    return '<div class="idg-calrow ' + (extraClass || '') + '" data-calrow="' + name + '">' +
      '<span class="idg-chip" style="--c:' + CAL_COLOR[name] + '">' + name + '</span>' +
      (name[0] === 'P' ? '<span class="idg-calpx" data-calpx="' + name + '">not set</span>' :
        '<input class="idg-input idg-calval" data-calval="' + name + '" inputmode="decimal" placeholder="value" aria-label="' + name + ' value">' +
        '<span class="idg-calpx" data-calpx="' + name + '">not set</span>') +
      '<button class="idg-textbtn" data-act="cal-pick" data-name="' + name + '" aria-label="Pick ' + name + ' on the image">Pick</button>' +
      '</div>';
  }

  var TEMPLATE =
    '<div class="idg-top">' +
      '<div class="idg-docname"><b data-doc="name">No image open</b><small data-doc="meta">Open an image or try the demo chart</small></div>' +
      '<div class="idg-top-actions">' +
        '<button class="idg-btn" data-act="open-image" title="Open an image (Ctrl+O). You can also drag & drop or paste (Ctrl+V).">' + ICON.image + '<span>Open image</span></button>' +
        '<button class="idg-btn" data-act="open-project" title="Open a saved project file (.json)">' + ICON.folder + '<span>Open project</span></button>' +
        '<button class="idg-btn idg-secondary idg-sm" data-act="save-project" title="Save everything to a project file (Ctrl+S)">' + ICON.save + '<span>Save project</span></button>' +
        '<span class="idg-sep"></span>' +
        '<button class="idg-btn idg-icon" data-act="undo" title="Undo (Ctrl+Z)" aria-label="Undo">' + ICON.undo + '</button>' +
        '<button class="idg-btn idg-icon" data-act="redo" title="Redo (Ctrl+Y)" aria-label="Redo">' + ICON.redo + '</button>' +
        '<span class="idg-sep"></span>' +
        '<button class="idg-btn" data-act="new" title="Start a new, empty project">' + ICON.file + '<span>New</span></button>' +
        '<button class="idg-btn" data-act="help" title="How to use this tool">' + ICON.help + '<span>Help</span></button>' +
      '</div>' +
    '</div>' +
    '<div class="idg-body">' +
      '<div class="idg-tools" role="toolbar" aria-label="Tools">' +
        toolBtn('select', ICON.select, 'Select', 'V', 'Select, move and edit shapes and points. Drag empty space to pan') +
        toolBtn('pan', ICON.pan, 'Pan', 'H', 'Move around the image') +
        '<div class="idg-tools-sep"></div>' +
        toolBtn('calib', ICON.calib, 'Calibrate', 'C', 'Set the axes / scale by clicking reference points') +
        '<div class="idg-tools-sep"></div>' +
        toolBtn('polygon', ICON.polygon, 'Polygon', 'P', 'Draw an area with straight lines: click points, double-click or Enter to finish') +
        toolBtn('rect', ICON.rect, 'Rectangle', 'R', 'Drag to draw a rectangle area') +
        toolBtn('ellipse', ICON.ellipse, 'Ellipse', 'E', 'Drag to draw an ellipse (hold Shift for a circle)') +
        toolBtn('freehand', ICON.freehand, 'Freehand', 'F', 'Hold and draw around an area') +
        toolBtn('wand', ICON.wand, 'Colour', 'W', 'Click a coloured region to detect all touching pixels of the same colour') +
        '<div class="idg-tools-sep"></div>' +
        toolBtn('point', ICON.point, 'Points', 'D', 'Click to read X/Y values of points') +
        '<div class="idg-tools-sep"></div>' +
        '<button class="idg-tool idg-tool-sm" data-act="zoom-in" title="Zoom in (+)" aria-label="Zoom in">' + ICON.zoomIn + '</button>' +
        '<button class="idg-tool idg-tool-sm" data-act="zoom-out" title="Zoom out (−)" aria-label="Zoom out">' + ICON.zoomOut + '</button>' +
        '<button class="idg-tool idg-tool-sm" data-act="zoom-fit" title="Fit image to window (0)" aria-label="Fit">' + ICON.fit + '</button>' +
      '</div>' +
      '<div class="idg-stage">' +
        '<canvas class="idg-canvas" tabindex="0" aria-label="Image canvas"></canvas>' +
        '<div class="idg-topstack"><div class="idg-hint" aria-live="polite"></div><div class="idg-toast" role="status" aria-live="polite"></div></div>' +
        '<div class="idg-options"></div>' +
        '<canvas class="idg-loupe" width="160" height="160" aria-hidden="true"></canvas>' +
        '<div class="idg-empty">' +
          '<div class="idg-drop">' +
            '<p class="idg-marker">Step 01</p>' +
            '<h2>Start with an image</h2>' +
            '<p>Drop an image here, paste it with Ctrl+V, or choose a file. A chart, micrograph, map or photo in PNG, JPG, GIF, BMP, WebP or SVG.</p>' +
            '<div class="idg-drop-actions">' +
              '<button class="idg-btn idg-primary" data-act="open-image">Choose an image</button>' +
              '<button class="idg-btn idg-secondary" data-act="demo">Try the demo chart</button>' +
            '</div>' +
            '<div class="idg-drop-more">' +
              '<button class="idg-link" data-act="open-project">Open a saved project</button>' +
              '<button class="idg-link idg-restore" data-act="restore" hidden><span>Restore last session</span></button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="idg-dropveil">Drop to open</div>' +
      '</div>' +
      '<div class="idg-panel">' +
        '<ol class="idg-steps">' +
          '<li data-step="image" data-goto=""><i data-n="01">01</i><span>Image</span></li>' +
          '<li data-step="calib" data-goto="calib"><i data-n="02">02</i><span>Calibrate</span></li>' +
          '<li data-step="measure" data-goto="areas"><i data-n="03">03</i><span>Measure</span></li>' +
          '<li data-step="export" data-goto="export"><i data-n="04">04</i><span>Export</span></li>' +
        '</ol>' +
        '<div class="idg-tabs" role="tablist">' +
          '<button role="tab" data-tab="calib">Calibrate</button>' +
          '<button role="tab" data-tab="areas">Areas <em data-count="areas"></em></button>' +
          '<button role="tab" data-tab="ratios">Ratios <em data-count="ratios"></em></button>' +
          '<button role="tab" data-tab="points">Points <em data-count="points"></em></button>' +
          '<button role="tab" data-tab="export">Export</button>' +
        '</div>' +
        '<div class="idg-panes">' +
          /* ---------- calibrate */
          '<section class="idg-pane" data-pane="calib">' +
            '<p class="idg-help">Tell the tool what the image pixels mean. Skip this step to measure in pixels.</p>' +
            '<label class="idg-field"><span>Calibration type</span>' +
              '<select class="idg-input" data-cal="mode">' +
                '<option value="none">None — measure in pixels</option>' +
                '<option value="axes">Chart axes — 4 reference points</option>' +
                '<option value="scale">Scale bar — 2 points + known length</option>' +
              '</select></label>' +
            '<div data-calsec="axes">' +
              '<p class="idg-help">Click two known values on the <b>X axis</b> (X1, X2) and two on the <b>Y axis</b> (Y1, Y2), e.g. tick marks, then type their values. Use points far apart for best accuracy.</p>' +
              '<button class="idg-btn idg-primary" data-act="cal-start">Pick the 4 points</button>' +
              '<div class="idg-caltable">' + calRow('X1') + calRow('X2') + calRow('Y1') + calRow('Y2') + '</div>' +
              '<div class="idg-grid2">' +
                '<label class="idg-check"><input type="checkbox" data-cal="xLog"> X axis is logarithmic</label>' +
                '<label class="idg-check"><input type="checkbox" data-cal="yLog"> Y axis is logarithmic</label>' +
                '<label class="idg-field"><span>X name / unit</span><input class="idg-input" data-cal="xUnit" placeholder="e.g. P (bar)"></label>' +
                '<label class="idg-field"><span>Y name / unit</span><input class="idg-input" data-cal="yUnit" placeholder="e.g. q (mmol/g)"></label>' +
              '</div>' +
            '</div>' +
            '<div data-calsec="scale">' +
              '<p class="idg-help">Click the two ends of a scale bar or any feature of known length, then type that length.</p>' +
              '<button class="idg-btn idg-primary" data-act="cal-start">Pick the 2 points</button>' +
              '<div class="idg-caltable">' + calRow('P1') + calRow('P2') + '</div>' +
              '<div class="idg-grid2">' +
                '<label class="idg-field"><span>Length P1 → P2</span><input class="idg-input" data-cal="length" inputmode="decimal" placeholder="e.g. 100"></label>' +
                '<label class="idg-field"><span>Unit</span><input class="idg-input" data-cal="unit" placeholder="e.g. µm"></label>' +
              '</div>' +
            '</div>' +
            '<div class="idg-calstatus"></div>' +
            '<label class="idg-check"><input type="checkbox" data-set="showGrid"> Show calibrated grid on the image (to check alignment)</label>' +
            '<details class="idg-tips"><summary>Show tips for accurate results</summary><ul>' +
              '<li>Zoom in (mouse wheel) and use the magnifier for precise clicks. Drag a reference marker to fine-tune it; arrow keys nudge it 1 px.</li>' +
              '<li>Pick reference points as far apart as possible.</li>' +
              '<li>For log axes, enter the real values (e.g. 0.1, 1000), not exponents.</li>' +
              '<li>Rotated or skewed scans are corrected automatically.</li>' +
              '<li>On log axes, areas are computed exactly in real units (not as they look on screen). The Ratios tab shows both.</li>' +
            '</ul></details>' +
          '</section>' +
          /* ---------- areas */
          '<section class="idg-pane" data-pane="areas">' +
            '<p class="idg-help">Draw an area with a tool, or detect a coloured region.</p>' +
            '<div class="idg-quick">' +
              '<button class="idg-btn idg-secondary idg-sm" data-tool-btn="polygon">Polygon</button>' +
              '<button class="idg-btn idg-secondary idg-sm" data-tool-btn="rect">Rectangle</button>' +
              '<button class="idg-btn idg-secondary idg-sm" data-tool-btn="ellipse">Ellipse</button>' +
              '<button class="idg-btn idg-secondary idg-sm" data-tool-btn="freehand">Freehand</button>' +
              '<button class="idg-btn idg-secondary idg-sm" data-tool-btn="wand">By colour</button>' +
            '</div>' +
            '<div class="idg-list" data-list="areas"></div>' +
          '</section>' +
          /* ---------- ratios */
          '<section class="idg-pane" data-pane="ratios">' +
            '<p class="idg-help">Pick a <b>main</b> area and a <b>sub</b> area (e.g. total and the part of interest).</p>' +
            '<div class="idg-grid2">' +
              '<label class="idg-field"><span>Main area</span><select class="idg-input" data-ratio="main"></select></label>' +
              '<label class="idg-field"><span>Sub area</span><select class="idg-input" data-ratio="sub"></select></label>' +
            '</div>' +
            '<button class="idg-btn idg-primary" data-act="ratio-add">Add ratio</button>' +
            '<div class="idg-list" data-list="ratios"></div>' +
          '</section>' +
          /* ---------- points */
          '<section class="idg-pane" data-pane="points">' +
            '<div class="idg-series"></div>' +
            '<div class="idg-quick"><button class="idg-btn idg-secondary idg-sm" data-tool-btn="point">Add points</button>' +
            '<button class="idg-btn idg-secondary idg-sm" data-act="series-add">New series</button></div>' +
            '<div class="idg-tablewrap"><table class="idg-table" data-list="points"></table></div>' +
          '</section>' +
          /* ---------- export */
          '<section class="idg-pane" data-pane="export">' +
            '<p class="idg-help">Everything in one workbook: areas, ratios, points, shape corners and the calibration, one sheet each.</p>' +
            '<button class="idg-btn idg-primary" data-act="export-xlsx">Download Excel workbook</button>' +
            '<ul class="idg-exports">' +
              '<li><div><b>Areas</b><small>One row per area, CSV</small></div><button class="idg-textbtn" data-act="export-csv-areas">Download CSV</button></li>' +
              '<li><div><b>Ratios</b><small>Sub ÷ main with overlap, CSV</small></div><button class="idg-textbtn" data-act="export-csv-ratios">Download CSV</button></li>' +
              '<li><div><b>Points</b><small>X, Y and pixel position, CSV</small></div><button class="idg-textbtn" data-act="export-csv-points">Download CSV</button></li>' +
              '<li><div><b>Report</b><small>Plain-text summary, TXT</small></div><button class="idg-textbtn" data-act="export-txt">Download TXT</button></li>' +
              '<li><div><b>Annotated image</b><small>Full resolution with labels, PNG</small></div><button class="idg-textbtn" data-act="export-png">Download PNG</button></li>' +
              '<li><div><b>Results data</b><small>Tables and settings without the image, JSON</small></div><button class="idg-textbtn" data-act="export-json">Download JSON</button></li>' +
              '<li><div><b>Tables</b><small>Paste into Excel, Sheets or Word</small></div><button class="idg-textbtn" data-act="export-copy">Copy tables</button></li>' +
            '</ul>' +
            '<p class="idg-note">To continue later, use <b>Save project</b> in the toolbar. It keeps the image as well.</p>' +
            '<h3 class="idg-subhead">Options</h3>' +
            '<div class="idg-grid2">' +
              '<label class="idg-field"><span>Significant digits</span><select class="idg-input" data-set="sig"><option>3</option><option>4</option><option>5</option><option selected>6</option><option>8</option><option>10</option></select></label>' +
              '<label class="idg-check"><input type="checkbox" data-set="imgLabels" checked> Labels on exported image</label>' +
              '<label class="idg-check"><input type="checkbox" data-set="sortX"> Sort points by X in exports</label>' +
              '<label class="idg-check"><input type="checkbox" data-set="loupe" checked> Show magnifier</label>' +
            '</div>' +
          '</section>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="idg-status">' +
      '<span data-st="px">Pixel: —</span>' +
      '<span data-st="val">Value: —</span>' +
      '<span data-st="zoom">Zoom: —</span>' +
      '<span data-st="cal" class="idg-stcal">○ Not calibrated, measuring in pixels</span>' +
      '<span data-st="img" class="idg-stimg"></span>' +
    '</div>' +
    '<input type="file" class="idg-file-image" accept="image/*,.svg" hidden>' +
    '<input type="file" class="idg-file-project" accept=".json,.idg,application/json" hidden>' +
    '<div class="idg-modal" hidden><div class="idg-dialog" role="dialog" aria-modal="true"><div class="idg-dialog-body"></div><div class="idg-dialog-btns"></div></div></div>';

  var HELP_HTML =
    '<h2>How to use the image digitizer</h2>' +
    '<ol class="idg-helpsteps">' +
      '<li><b>Load an image</b> — choose a file, drag & drop it, or paste a screenshot (Ctrl+V).</li>' +
      '<li><b>Calibrate</b> (optional) — tab <i>Calibrate</i> → <i>Chart axes</i>: click two known points on the X axis and two on the Y axis, type their values and tick <i>logarithmic</i> where needed. For photos / micrographs use <i>Scale bar</i>. Without calibration, everything is measured in pixels.</li>' +
      '<li><b>Measure</b> — pick a tool on the left:' +
        '<ul><li><b>Polygon</b>: click corner points, double-click / Enter / click the first point to close.</li>' +
        '<li><b>Rectangle, Ellipse</b>: press and drag.</li><li><b>Freehand</b>: hold and draw around the area.</li>' +
        '<li><b>Colour</b>: click inside a coloured region; touching pixels of the same colour are selected. Change <i>Tolerance</i> to grow / shrink it, or switch to <i>Whole image</i> to find that colour everywhere. Shift+click adds more spots to the same region.</li>' +
        '<li><b>Points</b>: click to read X/Y values. Use series to keep curves separate.</li></ul></li>' +
      '<li><b>Ratios</b> — tab <i>Ratios</i>: choose a main and a sub area to get Sub ÷ Main.</li>' +
      '<li><b>Export</b> — Excel, CSV, text or an annotated image. <b>Save project</b> keeps everything to continue later.</li>' +
    '</ol>' +
    '<h3>Mouse & keyboard</h3>' +
    '<table class="idg-keys">' +
      '<tr><td>Zoom</td><td>Mouse wheel / pinch, <kbd>+</kbd> <kbd>−</kbd>, <kbd>0</kbd> fit</td></tr>' +
      '<tr><td>Pan</td><td>Hold <kbd>Space</kbd> and drag, middle mouse button, or the Pan tool</td></tr>' +
      '<tr><td>Tools</td><td><kbd>V</kbd> select · <kbd>H</kbd> pan · <kbd>C</kbd> calibrate · <kbd>P</kbd> polygon · <kbd>R</kbd> rectangle · <kbd>E</kbd> ellipse · <kbd>F</kbd> freehand · <kbd>W</kbd> colour · <kbd>D</kbd> points</td></tr>' +
      '<tr><td>Drawing</td><td><kbd>Enter</kbd> finish · <kbd>Backspace</kbd> remove last corner · <kbd>Esc</kbd> cancel · right-click finishes a polygon</td></tr>' +
      '<tr><td>Editing</td><td>Select tool: drag corners, points or markers; drag inside a shape to move it; arrow keys nudge (Shift = 10 px); <kbd>Delete</kbd> removes</td></tr>' +
      '<tr><td>Undo / redo</td><td><kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd></td></tr>' +
      '<tr><td>Save project</td><td><kbd>Ctrl</kbd>+<kbd>S</kbd></td></tr>' +
    '</table>' +
    '<h3>How the numbers are computed</h3>' +
    '<p>Shapes are measured exactly from their corner points (shoelace / Green’s theorem). On log axes the area is integrated in real units, so a shape that looks like a square can have a very different real area; the axis-space (decades) area is also reported. Colour regions are measured pixel by pixel, each pixel weighted by its real size. The ratio tab shows the calibrated ratio, the on-screen (pixel) ratio, and how much of the sub area lies inside the main area.</p>' +
    '<p class="idg-muted">Everything runs in your browser — images are never uploaded. v' + VERSION + '</p>';

  var TOOL_HINT = {
    select: 'Click a shape or point to select it. Drag corners / points / markers to adjust, drag inside a shape to move it. Drag empty space to pan.',
    pan: 'Drag to move around. Mouse wheel zooms.',
    polygon: 'Click to add corners. Double-click, press Enter, or click the first corner to finish. Backspace removes the last corner.',
    rect: 'Press and drag to draw a rectangle.',
    ellipse: 'Press and drag to draw an ellipse. Hold Shift for a circle.',
    freehand: 'Hold the mouse button (or finger) and draw around the area. Release to finish.',
    wand: 'Click inside a coloured region to detect it. Shift+click adds more spots to the selected colour region.',
    point: 'Click to add a point. Drag a point to adjust it.',
    calib: ''
  };

  /* ================================================================== app */
  function mount(root, options) {
    options = Object.assign({ autosave: true, storageKey: 'autosave' }, options || {});
    if (root.__idg) return root.__idg;
    root.classList.add('idg');
    root.innerHTML = TEMPLATE;

    var canvas = $(root, '.idg-canvas'), ctx = canvas.getContext('2d');
    var stage = $(root, '.idg-stage');
    var loupe = $(root, '.idg-loupe'), lctx = loupe.getContext('2d');
    var hintEl = $(root, '.idg-hint'), optEl = $(root, '.idg-options');
    var fileImage = $(root, '.idg-file-image'), fileProject = $(root, '.idg-file-project');

    var S = freshState();
    var cal = buildCalibration(S.calib);
    var calVer = 1;
    var undoStack = [], redoStack = [];
    var draft = null, drag = null, pinch = null;
    var pointers = new Map();
    var hover = null;
    var spaceDown = false, needsDraw = false, pixels = null, autosaveTimer = null;
    var maskCanvasCache = new WeakMap(), maskAreaCache = new WeakMap();
    var activeTab = 'calib';
    var dirty = false;

    function freshState() {
      var sid = uid();
      return {
        image: null, imageName: '', imageSrc: '', w: 0, h: 0,
        calib: {
          mode: 'none',
          axes: { pts: [null, null, null, null], vals: ['', '', '', ''], xLog: false, yLog: false, xUnit: '', yUnit: '' },
          scale: { pts: [null, null], length: '', unit: 'mm' }
        },
        regions: [], series: [{ id: sid, name: 'Series 1', color: PALETTE[1], points: [] }], activeSeries: sid,
        ratios: [], counter: 0,
        selected: null, tool: 'select', calibStep: 0,
        view: { scale: 1, ox: 0, oy: 0 },
        settings: { tol: 40, wandMode: 'contiguous', fillHoles: false, limitId: '', sig: 6, showGrid: false, imgLabels: true, loupe: true, sortX: false }
      };
    }

    /* ---------------------------------------------------------- helpers */
    function calNames() { return S.calib.mode === 'scale' ? CAL_SCALE : CAL_AXES; }
    function calPts() { return S.calib.mode === 'scale' ? S.calib.scale.pts : S.calib.axes.pts; }
    function regionById(id) { for (var i = 0; i < S.regions.length; i++) if (S.regions[i].id === id) return S.regions[i]; return null; }
    function seriesById(id) { for (var i = 0; i < S.series.length; i++) if (S.series[i].id === id) return S.series[i]; return null; }
    function activeSeries() { return seriesById(S.activeSeries) || S.series[0]; }
    function selRegion() { return S.selected && S.selected.type === 'region' ? regionById(S.selected.id) : null; }
    function nextColor() { var used = S.regions.length; return PALETTE[used % PALETTE.length]; }
    function sig() { return +S.settings.sig || 6; }
    function f(v) { return fmtNum(v, sig()); }
    function toScreen(x, y) { return [x * S.view.scale + S.view.ox, y * S.view.scale + S.view.oy]; }
    function requestDraw() { if (!needsDraw) { needsDraw = true; requestAnimationFrame(draw); } }
    function recal() { cal = buildCalibration(S.calib); calVer++; }
    function isEditable(r) { return r && (r.kind === 'polygon' || r.kind === 'rect') && r.pts.length <= 400; }

    /* ------------------------------------------------------- undo / redo */
    function cloneRegion(r) {
      return {
        id: r.id, name: r.name, kind: r.kind, color: r.color, visible: r.visible,
        pts: r.pts ? r.pts.map(function (p) { return { x: p.x, y: p.y }; }) : null,
        mask: r.mask || null, wand: r.wand ? deep(r.wand) : null
      };
    }
    function snapshot() {
      return {
        calib: deep(S.calib), regions: S.regions.map(cloneRegion), series: deep(S.series),
        activeSeries: S.activeSeries, ratios: deep(S.ratios), counter: S.counter
      };
    }
    function applySnapshot(s) {
      S.calib = deep(s.calib); S.regions = s.regions.map(cloneRegion); S.series = deep(s.series);
      S.activeSeries = s.activeSeries; S.ratios = deep(s.ratios); S.counter = s.counter;
      if (S.selected) {
        if (S.selected.type === 'region' && !regionById(S.selected.id)) S.selected = null;
        else if (S.selected.type === 'point') { var se = seriesById(S.selected.sid); if (!se || !se.points[S.selected.idx]) S.selected = null; }
      }
      recal();
    }
    function pushUndo() {
      undoStack.push(snapshot());
      if (undoStack.length > 150) undoStack.shift();
      redoStack = [];
      dirty = true;
    }
    function undo() {
      if (draft) { cancelDraft(); return; }
      if (!undoStack.length) { toast('Nothing to undo'); return; }
      redoStack.push(snapshot()); applySnapshot(undoStack.pop()); commit(true);
    }
    function redo() {
      if (!redoStack.length) { toast('Nothing to redo'); return; }
      undoStack.push(snapshot()); applySnapshot(redoStack.pop()); commit(true);
    }

    /** call after every state change */
    function commit(fromHistory) {
      renderAll();
      requestDraw();
      scheduleAutosave();
      if (!fromHistory) dirty = true;
    }

    /* -------------------------------------------------------------- areas */
    function polyAreas(pts) {
      var px = Math.abs(shoelace(pts));
      if (cal.mode === 'none') return { px: px, data: px, axis: px };
      if (cal.mode === 'scale') return { px: px, data: px * cal.s * cal.s, axis: px * cal.s * cal.s };
      var uv = pts.map(function (p) { var q = cal.uv(p.x, p.y); return { x: q[0], y: q[1] }; });
      var axis = Math.abs(shoelace(uv));
      if (!cal.xLog && !cal.yLog) return { px: px, data: axis, axis: axis };
      var s = 0;
      for (var i = 0; i < uv.length; i++) { var a = uv[i], b = uv[(i + 1) % uv.length]; s += greenEdge(a.x, a.y, b.x, b.y, cal.xLog, cal.yLog); }
      return { px: px, data: Math.abs(s), axis: axis };
    }
    function maskWeightedSum(m, test) {
      // returns {count, data}
      var count = 0, data = 0, w = m.w, bits = m.bits;
      var cw = cal.constWeight;
      if (cw != null) {
        for (var i = 0; i < bits.length; i++) if (bits[i] && (!test || test(i))) count++;
        return { count: count, data: count * cw };
      }
      var A = cal.A, xl = cal.xLog, yl = cal.yLog, ad = Math.abs(cal.detJ);
      for (var j = 0; j < m.h; j++) {
        var py = m.y0 + j + 0.5;
        for (var k = 0; k < w; k++) {
          var idx = j * w + k;
          if (!bits[idx] || (test && !test(idx))) continue;
          count++;
          var px = m.x0 + k + 0.5, wt = ad;
          if (xl) wt *= LN10 * Math.pow(10, A[0] * px + A[1] * py + A[2]);
          if (yl) wt *= LN10 * Math.pow(10, A[3] * px + A[4] * py + A[5]);
          data += wt;
        }
      }
      return { count: count, data: data };
    }
    function maskAreas(m) {
      var c = maskAreaCache.get(m);
      if (c && c.ver === calVer) return c.a;
      var r = maskWeightedSum(m);
      var axisW = cal.mode === 'axes' ? Math.abs(cal.detJ) : (cal.mode === 'scale' ? cal.s * cal.s : 1);
      var a = { px: r.count, data: r.data, axis: r.count * axisW };
      maskAreaCache.set(m, { ver: calVer, a: a });
      return a;
    }
    function regionAreas(r) { return r.kind === 'mask' ? (r.mask ? maskAreas(r.mask) : { px: 0, data: 0, axis: 0 }) : polyAreas(r.pts); }
    function regionBBox(r) {
      if (r.kind === 'mask') return { x0: r.mask.x0, y0: r.mask.y0, x1: r.mask.x0 + r.mask.w, y1: r.mask.y0 + r.mask.h };
      return bboxOf(r.pts);
    }
    function regionCentroid(r) { return r.kind === 'mask' ? { x: r.mask.cx, y: r.mask.cy } : polyCentroid(r.pts); }

    /** rasterise a region into a bit array covering bbox (integers) */
    function rasterRegion(r, bx, by, bw, bh) {
      var out = new Uint8Array(bw * bh);
      if (bw <= 0 || bh <= 0) return out;
      if (r.kind === 'mask') {
        var m = r.mask;
        for (var j = 0; j < bh; j++) {
          var my = by + j - m.y0; if (my < 0 || my >= m.h) continue;
          for (var i = 0; i < bw; i++) { var mx = bx + i - m.x0; if (mx >= 0 && mx < m.w && m.bits[my * m.w + mx]) out[j * bw + i] = 1; }
        }
        return out;
      }
      var c = document.createElement('canvas'); c.width = bw; c.height = bh;
      var g = c.getContext('2d');
      g.fillStyle = '#000'; g.beginPath();
      r.pts.forEach(function (p, i) { if (i) g.lineTo(p.x - bx, p.y - by); else g.moveTo(p.x - bx, p.y - by); });
      g.closePath(); g.fill();
      var d = g.getImageData(0, 0, bw, bh).data;
      for (var k = 0; k < out.length; k++) out[k] = d[k * 4 + 3] >= 128 ? 1 : 0;
      return out;
    }
    function overlapArea(r1, r2) {
      var b1 = regionBBox(r1), b2 = regionBBox(r2);
      var x0 = Math.max(0, Math.floor(Math.max(b1.x0, b2.x0))), y0 = Math.max(0, Math.floor(Math.max(b1.y0, b2.y0)));
      var x1 = Math.min(S.w, Math.ceil(Math.min(b1.x1, b2.x1))), y1 = Math.min(S.h, Math.ceil(Math.min(b1.y1, b2.y1)));
      if (x1 <= x0 || y1 <= y0) return { px: 0, data: 0 };
      var w = x1 - x0, h = y1 - y0;
      var a = rasterRegion(r1, x0, y0, w, h), b = rasterRegion(r2, x0, y0, w, h);
      var both = new Uint8Array(w * h);
      for (var i = 0; i < both.length; i++) both[i] = a[i] & b[i];
      var s = maskWeightedSum({ x0: x0, y0: y0, w: w, h: h, bits: both });
      return { px: s.count, data: s.data };
    }
    function ratioResult(rt) {
      var m = regionById(rt.mainId), s = regionById(rt.subId);
      if (!m || !s) return null;
      var am = regionAreas(m), as = regionAreas(s);
      var key = calVer + '|' + JSON.stringify([regionBBox(m), regionBBox(s), am.px, as.px]);
      if (!rt._ov || rt._ovKey !== key) { rt._ov = overlapArea(m, s); rt._ovKey = key; }
      // pixel-based (raster) areas used to normalise overlap consistently
      return {
        main: m, sub: s, aMain: am.data, aSub: as.data, pxMain: am.px, pxSub: as.px,
        ratio: am.data ? as.data / am.data : NaN,
        pxRatio: am.px ? as.px / am.px : NaN,
        overlapOfMain: am.data ? Math.min(1, rt._ov.data / am.data) : NaN,
        subInside: as.data ? Math.min(1, rt._ov.data / as.data) : NaN
      };
    }

    /* ------------------------------------------------------ colour detect */
    function getPixels() {
      if (pixels) return pixels;
      var c = document.createElement('canvas'); c.width = S.w; c.height = S.h;
      var g = c.getContext('2d', { willReadFrequently: true });
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, S.w, S.h);
      g.drawImage(S.image, 0, 0);
      pixels = g.getImageData(0, 0, S.w, S.h).data;
      return pixels;
    }
    function sampleColor(ix, iy) {
      var d = getPixels(), r = 0, g = 0, b = 0, n = 0;
      var cx = Math.floor(ix), cy = Math.floor(iy);
      for (var y = cy - 1; y <= cy + 1; y++) for (var x = cx - 1; x <= cx + 1; x++) {
        if (x < 0 || y < 0 || x >= S.w || y >= S.h) continue;
        var k = (y * S.w + x) * 4; r += d[k]; g += d[k + 1]; b += d[k + 2]; n++;
      }
      // prefer the exact pixel if the 3x3 neighbourhood is mixed (edges, thin lines)
      var k0 = (cy * S.w + cx) * 4, ex = [d[k0], d[k0 + 1], d[k0 + 2]];
      var av = [r / n, g / n, b / n];
      var diff = Math.hypot(av[0] - ex[0], av[1] - ex[1], av[2] - ex[2]);
      return diff > 25 ? ex : av.map(Math.round);
    }
    function computeWandMask(wand) {
      var d = getPixels(), W = S.w, H = S.h, N = W * H;
      var full = new Uint8Array(N);
      var limit = null;
      if (wand.limitId) { var lr = regionById(wand.limitId); if (lr) limit = rasterRegion(lr, 0, 0, W, H); }
      var tol2 = wand.tol * wand.tol * 3;
      wand.seeds.forEach(function (seed) {
        var r0 = seed.c[0], g0 = seed.c[1], b0 = seed.c[2];
        function match(i) {
          if (limit && !limit[i]) return false;
          var k = i * 4, dr = d[k] - r0, dg = d[k + 1] - g0, db = d[k + 2] - b0;
          return dr * dr + dg * dg + db * db <= tol2;
        }
        if (wand.mode === 'global' || seed.x == null) {
          for (var i = 0; i < N; i++) if (!full[i] && match(i)) full[i] = 1;
          return;
        }
        var sx = clamp(seed.x, 0, W - 1), sy = clamp(seed.y, 0, H - 1);
        var start = sy * W + sx;
        if (!match(start)) {
          // seed pixel itself is out of tolerance (e.g. tolerance 0 + JPEG noise): search a 5x5 neighbourhood
          var found = -1;
          for (var dy = -2; dy <= 2 && found < 0; dy++) for (var dx = -2; dx <= 2; dx++) {
            var xx = sx + dx, yy = sy + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
            if (match(yy * W + xx)) { found = yy * W + xx; break; }
          }
          if (found < 0) return;
          start = found;
        }
        var stack = [start];
        while (stack.length) {
          var p = stack.pop();
          if (full[p] || !match(p)) continue;
          var y = (p / W) | 0, x = p - y * W, row = y * W;
          var xl = x, xr = x;
          while (xl > 0 && !full[row + xl - 1] && match(row + xl - 1)) xl--;
          while (xr < W - 1 && !full[row + xr + 1] && match(row + xr + 1)) xr++;
          for (var q = xl; q <= xr; q++) full[row + q] = 1;
          for (var t = -1; t <= 1; t += 2) {
            var ny = y + t; if (ny < 0 || ny >= H) continue;
            var nrow = ny * W, inRun = false;
            for (var q2 = xl; q2 <= xr; q2++) {
              var j = nrow + q2, m = !full[j] && match(j);
              if (m && !inRun) { stack.push(j); inRun = true; } else if (!m) inRun = false;
            }
          }
        }
      });
      // crop to bounding box
      var x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (var yy2 = 0; yy2 < H; yy2++) {
        var rw = yy2 * W, any = false;
        for (var xx2 = 0; xx2 < W; xx2++) if (full[rw + xx2]) { any = true; if (xx2 < x0) x0 = xx2; if (xx2 > x1) x1 = xx2; }
        if (any) { if (yy2 < y0) y0 = yy2; y1 = yy2; }
      }
      if (x1 < 0) return null;
      var w = x1 - x0 + 1, h = y1 - y0 + 1, bits = new Uint8Array(w * h);
      for (var j2 = 0; j2 < h; j2++) bits.set(full.subarray((y0 + j2) * W + x0, (y0 + j2) * W + x0 + w), j2 * w);
      if (wand.fillHoles) fillHoles(bits, w, h);
      return finishMask({ x0: x0, y0: y0, w: w, h: h, bits: bits });
    }
    function fillHoles(bits, w, h) {
      var outside = new Uint8Array(w * h), stack = [];
      function seed(i) { if (!bits[i] && !outside[i]) { outside[i] = 1; stack.push(i); } }
      for (var x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
      for (var y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
      while (stack.length) {
        var p = stack.pop(), py = (p / w) | 0, px = p - py * w;
        if (px > 0) seed(p - 1); if (px < w - 1) seed(p + 1);
        if (py > 0) seed(p - w); if (py < h - 1) seed(p + w);
      }
      for (var i = 0; i < bits.length; i++) if (!bits[i] && !outside[i]) bits[i] = 1;
    }
    function finishMask(m) {
      var sx = 0, sy = 0, n = 0;
      for (var j = 0; j < m.h; j++) for (var i = 0; i < m.w; i++) if (m.bits[j * m.w + i]) { sx += i; sy += j; n++; }
      m.count = n; m.cx = m.x0 + (n ? sx / n : m.w / 2) + 0.5; m.cy = m.y0 + (n ? sy / n : m.h / 2) + 0.5;
      return m;
    }
    function maskCanvas(r) {
      var m = r.mask, c = maskCanvasCache.get(m.bits);
      if (c && c.color === r.color) return c.canvas;
      var cv = document.createElement('canvas'); cv.width = m.w; cv.height = m.h;
      var g = cv.getContext('2d'), id = g.createImageData(m.w, m.h), rgb = hexToRgb(r.color), W = m.w, H = m.h, B = m.bits;
      // light tint inside, solid colour on the boundary so the original image stays readable
      for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
        var i = y * W + x; if (!B[i]) continue;
        var edge = x === 0 || y === 0 || x === W - 1 || y === H - 1 || !B[i - 1] || !B[i + 1] || !B[i - W] || !B[i + W];
        var k = i * 4; id.data[k] = rgb[0]; id.data[k + 1] = rgb[1]; id.data[k + 2] = rgb[2]; id.data[k + 3] = edge ? 255 : 105;
      }
      g.putImageData(id, 0, 0);
      maskCanvasCache.set(m.bits, { color: r.color, canvas: cv });
      return cv;
    }
    function runWand(ix, iy, add) {
      if (ix < 0 || iy < 0 || ix >= S.w || iy >= S.h) { toast('Click inside the image'); return; }
      var color = sampleColor(ix, iy);
      var seed = { x: Math.floor(ix), y: Math.floor(iy), c: color };
      var r = selRegion();
      var t0 = performance.now();
      if (add && r && r.kind === 'mask' && r.wand) {
        var w2 = deep(r.wand); w2.seeds.push(seed);
        var m2 = computeWandMask(w2);
        if (!m2) { toast('No matching pixels found'); return; }
        pushUndo(); r.wand = w2; r.mask = m2; commit();
        toast('Added to ' + r.name + ' — ' + describeArea(r));
        return;
      }
      var wand = { seeds: [seed], tol: +S.settings.tol, mode: S.settings.wandMode, fillHoles: !!S.settings.fillHoles, limitId: S.settings.limitId || '' };
      var m = computeWandMask(wand);
      if (!m) { toast('No matching pixels found — try a higher tolerance'); return; }
      pushUndo();
      var reg = newRegion('mask', null);
      reg.mask = m; reg.wand = wand; reg.color = contrastColor(color);
      S.regions.push(reg);
      S.selected = { type: 'region', id: reg.id };
      setTab('areas');
      commit();
      var frac = m.count / (S.w * S.h);
      var msg = reg.name + ': ' + describeArea(reg) + ' (' + Math.round(performance.now() - t0) + ' ms)';
      if (frac > 0.5) msg += ' — that is ' + Math.round(frac * 100) + '% of the image; lower the tolerance if this is too much.';
      toast(msg, { undo: true, long: frac > 0.5 });
    }
    function rerunSelectedWand() {
      var r = selRegion();
      if (!r || !r.wand) return false;
      var w2 = deep(r.wand);
      w2.tol = +S.settings.tol; w2.mode = S.settings.wandMode; w2.fillHoles = !!S.settings.fillHoles; w2.limitId = S.settings.limitId || '';
      var m = computeWandMask(w2);
      if (!m) { toast('No matching pixels with these settings'); return true; }
      pushUndo(); r.wand = w2; r.mask = m; commit();
      toast(r.name + ' updated — ' + describeArea(r));
      return true;
    }
    function findColor(hex) {
      if (!S.image) return;
      var c = hexToRgb(hex);
      var wand = { seeds: [{ x: null, y: null, c: c }], tol: +S.settings.tol, mode: 'global', fillHoles: !!S.settings.fillHoles, limitId: S.settings.limitId || '' };
      var m = computeWandMask(wand);
      if (!m) { toast('That colour was not found (within tolerance ' + S.settings.tol + ')'); return; }
      pushUndo();
      var reg = newRegion('mask', null); reg.mask = m; reg.wand = wand; reg.color = contrastColor(c);
      S.regions.push(reg); S.selected = { type: 'region', id: reg.id }; setTab('areas'); commit();
      toast(reg.name + ': ' + describeArea(reg), { undo: true });
    }
    function contrastColor(rgb) {
      // next unused palette colour that differs clearly from the detected colour
      var start = S.regions.length, best = null, bd = -1;
      for (var k = 0; k < PALETTE.length; k++) {
        var p = PALETTE[(start + k) % PALETTE.length], q = hexToRgb(p);
        var dd = Math.hypot(q[0] - rgb[0], q[1] - rgb[1], q[2] - rgb[2]);
        var used = S.regions.some(function (r) { return r.color === p; });
        if (!used && dd > 160) return p;
        if (dd > bd) { bd = dd; best = p; }
      }
      return best;
    }

    /* ------------------------------------------------------------ regions */
    function newRegion(kind, pts) {
      S.counter++;
      return { id: uid(), name: 'Area ' + S.counter, kind: kind, color: nextColor(), visible: true, pts: pts, mask: null, wand: null };
    }
    function addRegion(kind, pts) {
      pushUndo();
      var r = newRegion(kind, pts);
      S.regions.push(r);
      S.selected = { type: 'region', id: r.id };
      setTab('areas');
      commit();
      toast(r.name + ': ' + describeArea(r), { undo: true });
    }
    function describeArea(r) {
      var a = regionAreas(r);
      return cal.calibrated ? f(a.data) + ' ' + cal.areaUnit : fmtInt(a.px) + ' px²';
    }
    function deleteSelection() {
      var s = S.selected; if (!s) return;
      if (s.type === 'region') {
        var r = regionById(s.id); if (!r) return;
        pushUndo();
        S.regions = S.regions.filter(function (x) { return x.id !== r.id; });
        S.ratios = S.ratios.filter(function (rt) { return rt.mainId !== r.id && rt.subId !== r.id; });
        if (S.settings.limitId === r.id) S.settings.limitId = '';
        S.selected = null; commit(); toast(r.name + ' deleted', { undo: true });
      } else if (s.type === 'point') {
        var se = seriesById(s.sid); if (!se || !se.points[s.idx]) return;
        pushUndo(); se.points.splice(s.idx, 1); S.selected = null; commit();
      } else if (s.type === 'calib') {
        pushUndo(); calPts()[s.idx] = null; S.selected = null; recal(); commit();
      }
    }
    function makeEllipse(a, b, circle) {
      var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2, rx = Math.abs(b.x - a.x) / 2, ry = Math.abs(b.y - a.y) / 2;
      if (circle) { var r = Math.max(rx, ry); rx = ry = r; cx = a.x + Math.sign(b.x - a.x || 1) * r; cy = a.y + Math.sign(b.y - a.y || 1) * r; }
      var pts = [];
      for (var i = 0; i < ELLIPSE_N; i++) { var t = 2 * Math.PI * i / ELLIPSE_N; pts.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) }); }
      return pts;
    }
    function rectPts(a, b) { return [{ x: a.x, y: a.y }, { x: b.x, y: a.y }, { x: b.x, y: b.y }, { x: a.x, y: b.y }]; }

    /* ---------------------------------------------------------- drafting */
    function cancelDraft() { draft = null; renderOptions(); requestDraw(); }
    function finishPolygon() {
      if (!draft || draft.kind !== 'polygon') return;
      var th = 3 / S.view.scale, pts = [];
      draft.pts.forEach(function (p) { if (!pts.length || dist(p, pts[pts.length - 1]) > th) pts.push(p); });
      if (pts.length > 2 && dist(pts[0], pts[pts.length - 1]) <= th) pts.pop();
      if (pts.length < 3) { toast('A polygon needs at least 3 corners'); return; }
      draft = null;
      addRegion('polygon', pts);
      renderOptions();
    }

    /* ---------------------------------------------------------- hit tests */
    function hitCalib(sx, sy, th) {
      var P = calPts();
      if (S.calib.mode === 'none') return -1;
      for (var i = P.length - 1; i >= 0; i--) { if (!P[i]) continue; var s = toScreen(P[i].x, P[i].y); if (Math.hypot(s[0] - sx, s[1] - sy) <= th) return i; }
      return -1;
    }
    function hitVertex(r, sx, sy, th) {
      if (!isEditable(r)) return -1;
      for (var i = 0; i < r.pts.length; i++) { var s = toScreen(r.pts[i].x, r.pts[i].y); if (Math.hypot(s[0] - sx, s[1] - sy) <= th) return i; }
      return -1;
    }
    function hitPoint(sx, sy, th, onlySid) {
      for (var k = S.series.length - 1; k >= 0; k--) {
        var se = S.series[k]; if (onlySid && se.id !== onlySid) continue;
        if (se.hidden) continue;
        for (var i = se.points.length - 1; i >= 0; i--) { var p = se.points[i], s = toScreen(p.x, p.y); if (Math.hypot(s[0] - sx, s[1] - sy) <= th) return { sid: se.id, idx: i }; }
      }
      return null;
    }
    function hitRegion(ix, iy) {
      for (var i = S.regions.length - 1; i >= 0; i--) {
        var r = S.regions[i]; if (!r.visible) continue;
        if (r.kind === 'mask') {
          var m = r.mask, mx = Math.floor(ix) - m.x0, my = Math.floor(iy) - m.y0;
          if (mx >= 0 && my >= 0 && mx < m.w && my < m.h && m.bits[my * m.w + mx]) return r;
        } else if (pointInPoly(ix, iy, r.pts)) return r;
      }
      return null;
    }

    /* ------------------------------------------------------------- view */
    function fit() {
      if (!S.image) return;
      var cw = stage.clientWidth, ch = stage.clientHeight;
      var sc = Math.min(cw / S.w, ch / S.h) * 0.94;
      if (!isFinite(sc) || sc <= 0) sc = 1;
      S.view.scale = sc; S.view.ox = (cw - S.w * sc) / 2; S.view.oy = (ch - S.h * sc) / 2;
      requestDraw(); renderStatus();
    }
    function zoomAt(factor, sx, sy) {
      var v = S.view, ns = clamp(v.scale * factor, 0.02, 64);
      if (sx == null) { sx = stage.clientWidth / 2; sy = stage.clientHeight / 2; }
      v.ox = sx - (sx - v.ox) * ns / v.scale; v.oy = sy - (sy - v.oy) * ns / v.scale; v.scale = ns;
      requestDraw(); renderStatus();
    }

    /* ------------------------------------------------------------- draw */
    function draw() {
      needsDraw = false;
      var dpr = window.devicePixelRatio || 1;
      var cw = stage.clientWidth, ch = stage.clientHeight;
      var W = Math.round(cw * dpr), H = Math.round(ch * dpr);
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!S.image) return;
      drawScene(ctx, S.view, dpr, { live: true, lw: 1, labels: true });
    }

    function drawScene(g, view, dpr, o) {
      var sc = view.scale, ox = view.ox, oy = view.oy, lw = o.lw || 1;
      function T(x, y) { return [x * sc + ox, y * sc + oy]; }
      g.save();
      g.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * ox, dpr * oy);
      g.imageSmoothingEnabled = sc < 2.5;
      if (o.live) { g.fillStyle = '#fff'; g.fillRect(0, 0, S.w, S.h); }
      g.drawImage(S.image, 0, 0);
      // colour masks (image space)
      S.regions.forEach(function (r) {
        if (!r.visible || r.kind !== 'mask' || !r.mask) return;
        var sel = S.selected && S.selected.type === 'region' && S.selected.id === r.id;
        g.globalAlpha = sel ? 1 : 0.8;
        g.imageSmoothingEnabled = false;
        g.drawImage(maskCanvas(r), r.mask.x0, r.mask.y0);
      });
      g.globalAlpha = 1;
      g.restore();

      g.save();
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.lineJoin = 'round'; g.lineCap = 'round';

      if (o.live || o.grid) drawGrid(g, T, lw);

      // vector regions
      S.regions.forEach(function (r) {
        if (!r.visible || r.kind === 'mask') return;
        var sel = S.selected && S.selected.type === 'region' && S.selected.id === r.id;
        g.beginPath();
        r.pts.forEach(function (p, i) { var s = T(p.x, p.y); if (i) g.lineTo(s[0], s[1]); else g.moveTo(s[0], s[1]); });
        g.closePath();
        g.fillStyle = rgba(r.color, sel ? 0.32 : 0.22); g.fill();
        g.lineWidth = (sel ? 3 : 2) * lw; g.strokeStyle = r.color; g.stroke();
        if (sel && o.live && isEditable(r)) {
          r.pts.forEach(function (p) { var s = T(p.x, p.y); g.beginPath(); g.rect(s[0] - 4.5, s[1] - 4.5, 9, 9); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = r.color; g.stroke(); });
        }
      });
      // selection outline for masks
      S.regions.forEach(function (r) {
        if (!r.visible || r.kind !== 'mask' || !o.live) return;
        var sel = S.selected && S.selected.type === 'region' && S.selected.id === r.id;
        if (!sel) return;
        var a = T(r.mask.x0, r.mask.y0), b = T(r.mask.x0 + r.mask.w, r.mask.y0 + r.mask.h);
        g.setLineDash([5, 4]); g.lineWidth = 1.5; g.strokeStyle = r.color; g.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); g.setLineDash([]);
      });
      // labels
      if (o.labels) {
        g.font = '600 ' + Math.round(12 * lw) + 'px ' + FONT;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        S.regions.forEach(function (r) {
          if (!r.visible) return;
          var c = regionCentroid(r), s = T(c.x, c.y);
          var txt = r.name, sub = describeArea(r);
          var w = Math.max(g.measureText(txt).width, g.measureText(sub).width) + 10 * lw;
          var h = 32 * lw;
          g.fillStyle = 'rgba(255,255,255,0.86)';
          roundRect(g, s[0] - w / 2, s[1] - h / 2, w, h, 4 * lw); g.fill();
          g.lineWidth = 1 * lw; g.strokeStyle = r.color; g.stroke();
          g.fillStyle = '#000'; g.fillText(txt, s[0], s[1] - 7 * lw);
          g.fillStyle = '#4d5459'; g.font = '400 ' + Math.round(11 * lw) + 'px ' + FONT; g.fillText(sub, s[0], s[1] + 8 * lw);
          g.font = '600 ' + Math.round(12 * lw) + 'px ' + FONT;
        });
      }
      // points
      S.series.forEach(function (se) {
        if (se.hidden) return;
        se.points.forEach(function (p, i) {
          var s = T(p.x, p.y), sel = S.selected && S.selected.type === 'point' && S.selected.sid === se.id && S.selected.idx === i;
          g.beginPath(); g.arc(s[0], s[1], (sel ? 6.5 : 4.5) * lw, 0, Math.PI * 2);
          g.fillStyle = se.color; g.fill(); g.lineWidth = 2 * lw; g.strokeStyle = '#fff'; g.stroke();
          if (sel && o.live) { g.beginPath(); g.arc(s[0], s[1], 10, 0, Math.PI * 2); g.lineWidth = 1.5; g.strokeStyle = se.color; g.stroke(); }
        });
      });
      // calibration markers
      if (S.calib.mode !== 'none' && (o.live || o.calib)) {
        var names = calNames(), P = calPts();
        g.setLineDash([6, 4]); g.lineWidth = 1.5 * lw;
        if (S.calib.mode === 'axes') {
          if (P[0] && P[1]) { var a1 = T(P[0].x, P[0].y), a2 = T(P[1].x, P[1].y); g.strokeStyle = CAL_COLOR.X1; g.beginPath(); g.moveTo(a1[0], a1[1]); g.lineTo(a2[0], a2[1]); g.stroke(); }
          if (P[2] && P[3]) { var b1 = T(P[2].x, P[2].y), b2 = T(P[3].x, P[3].y); g.strokeStyle = CAL_COLOR.Y1; g.beginPath(); g.moveTo(b1[0], b1[1]); g.lineTo(b2[0], b2[1]); g.stroke(); }
        } else if (P[0] && P[1]) {
          var c1 = T(P[0].x, P[0].y), c2 = T(P[1].x, P[1].y); g.strokeStyle = CAL_COLOR.P1; g.beginPath(); g.moveTo(c1[0], c1[1]); g.lineTo(c2[0], c2[1]); g.stroke();
        }
        g.setLineDash([]);
        P.forEach(function (p, i) {
          if (!p) return;
          var s = T(p.x, p.y), col = CAL_COLOR[names[i]], sel = S.selected && S.selected.type === 'calib' && S.selected.idx === i;
          var R = (sel ? 11 : 9) * lw;
          g.lineWidth = 2 * lw; g.strokeStyle = '#fff';
          g.beginPath(); g.arc(s[0], s[1], R, 0, Math.PI * 2); g.stroke();
          g.beginPath(); g.moveTo(s[0] - R - 4 * lw, s[1]); g.lineTo(s[0] + R + 4 * lw, s[1]); g.moveTo(s[0], s[1] - R - 4 * lw); g.lineTo(s[0], s[1] + R + 4 * lw); g.stroke();
          g.lineWidth = 1.4 * lw; g.strokeStyle = col;
          g.beginPath(); g.arc(s[0], s[1], R, 0, Math.PI * 2); g.stroke();
          g.beginPath(); g.moveTo(s[0] - R - 4 * lw, s[1]); g.lineTo(s[0] + R + 4 * lw, s[1]); g.moveTo(s[0], s[1] - R - 4 * lw); g.lineTo(s[0], s[1] + R + 4 * lw); g.stroke();
          var lbl = names[i];
          if (S.calib.mode === 'axes' && S.calib.axes.vals[i] !== '') lbl += ' = ' + S.calib.axes.vals[i];
          g.font = '600 ' + Math.round(12 * lw) + 'px ' + FONT; g.textAlign = 'left'; g.textBaseline = 'bottom';
          var tw = g.measureText(lbl).width;
          g.fillStyle = col; roundRect(g, s[0] + R + 2 * lw, s[1] - R - 16 * lw, tw + 8 * lw, 16 * lw, 3 * lw); g.fill();
          g.fillStyle = '#fff'; g.fillText(lbl, s[0] + R + 6 * lw, s[1] - R - 2 * lw);
        });
      }
      // in-progress shapes
      if (o.live && draft) {
        g.lineWidth = 2; g.strokeStyle = '#000'; g.fillStyle = 'rgba(18,100,126,0.12)';
        var pts = null;
        if (draft.kind === 'polygon') {
          pts = draft.pts.slice(); if (hover) pts.push({ x: hover.ix, y: hover.iy });
        } else if (draft.kind === 'rect' && draft.b) pts = rectPts(draft.a, draft.b);
        else if (draft.kind === 'ellipse' && draft.b) pts = makeEllipse(draft.a, draft.b, draft.circle);
        else if (draft.kind === 'freehand') pts = draft.pts;
        if (pts && pts.length) {
          g.beginPath(); pts.forEach(function (p, i) { var s = T(p.x, p.y); if (i) g.lineTo(s[0], s[1]); else g.moveTo(s[0], s[1]); });
          if (draft.kind !== 'polygon' || pts.length > 2) { g.closePath(); g.fill(); }
          g.setLineDash(draft.kind === 'polygon' ? [] : [6, 4]);
          g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke(); g.strokeStyle = '#12647e'; g.lineWidth = 2; g.stroke(); g.setLineDash([]);
          if (draft.kind === 'polygon') {
            draft.pts.forEach(function (p, i) {
              var s = T(p.x, p.y), first = i === 0 && draft.pts.length >= 3;
              g.beginPath(); g.arc(s[0], s[1], first ? 7 : 4, 0, Math.PI * 2); g.fillStyle = first ? '#a6d7f0' : '#fff'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#12647e'; g.stroke();
            });
          }
          // live area readout
          if (pts.length > 2) {
            var a = polyAreas(pts), c = bboxOf(pts), s2 = T((c.x0 + c.x1) / 2, c.y1);
            var t = cal.calibrated ? f(a.data) + ' ' + cal.areaUnit : fmtInt(a.px) + ' px²';
            g.font = '600 12px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'top';
            var tw2 = g.measureText(t).width + 10;
            g.fillStyle = '#292e33'; roundRect(g, s2[0] - tw2 / 2, s2[1] + 8, tw2, 20, 4); g.fill();
            g.fillStyle = '#fff'; g.fillText(t, s2[0], s2[1] + 12);
          }
        }
      }
      g.restore();
    }
    function roundRect(g, x, y, w, h, r) {
      g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
      g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h);
      g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
    }
    function axisTicks(min, max, isLog) {
      var out = [];
      if (!(max > min)) return out;
      if (isLog) {
        var span = max - min; if (span > 80) return out;
        var st = Math.max(1, Math.round(niceStep(span, 8)));
        for (var k = Math.ceil(min / st) * st; k <= max + 1e-9; k += st) out.push({ t: k, major: true });
        if (span <= 3.5) {
          for (var d = Math.floor(min); d <= Math.ceil(max); d++) for (var m = 2; m <= 9; m++) {
            var t = d + Math.log10(m); if (t > min && t < max) out.push({ t: t, major: false });
          }
        }
      } else {
        var st2 = niceStep(max - min, 8);
        for (var t2 = Math.ceil(min / st2) * st2; t2 <= max + 1e-9 * st2; t2 += st2) out.push({ t: Math.abs(t2) < st2 * 1e-9 ? 0 : t2, major: true });
      }
      return out.length > 300 ? [] : out;
    }
    function drawGrid(g, T, lw) {
      if (cal.mode !== 'axes' || !S.settings.showGrid) return;
      var cs = [[0, 0], [S.w, 0], [0, S.h], [S.w, S.h]].map(function (p) { return cal.uv(p[0], p[1]); });
      var us = cs.map(function (c) { return c[0]; }), vs = cs.map(function (c) { return c[1]; });
      var umin = Math.min.apply(null, us), umax = Math.max.apply(null, us), vmin = Math.min.apply(null, vs), vmax = Math.max.apply(null, vs);
      var tl = T(0, 0), br = T(S.w, S.h);
      g.save(); g.beginPath(); g.rect(tl[0], tl[1], br[0] - tl[0], br[1] - tl[1]); g.clip();
      g.font = '600 ' + Math.round(11 * lw) + 'px ' + FONT;
      function line(p1, p2, major, color) {
        var a = T(p1[0], p1[1]), b = T(p2[0], p2[1]);
        g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
        g.strokeStyle = major ? rgba(color, 0.75) : rgba(color, 0.35); g.lineWidth = (major ? 1.2 : 0.8) * lw; g.stroke();
      }
      axisTicks(umin, umax, cal.xLog).forEach(function (tk) {
        line(cal.fromUV(tk.t, vmin), cal.fromUV(tk.t, vmax), tk.major, CAL_COLOR.X1);
        if (tk.major) {
          var p = T.apply(null, cal.fromUV(tk.t, cal.vAxisOfX)), txt = fmtNum(cal.xLog ? Math.pow(10, tk.t) : tk.t, 4);
          g.textAlign = 'center'; g.textBaseline = 'top'; labelBox(g, txt, p[0], p[1] + 4, CAL_COLOR.X1);
        }
      });
      axisTicks(vmin, vmax, cal.yLog).forEach(function (tk) {
        line(cal.fromUV(umin, tk.t), cal.fromUV(umax, tk.t), tk.major, CAL_COLOR.Y1);
        if (tk.major) {
          var p = T.apply(null, cal.fromUV(cal.uAxisOfY, tk.t)), txt = fmtNum(cal.yLog ? Math.pow(10, tk.t) : tk.t, 4);
          g.textAlign = 'right'; g.textBaseline = 'middle'; labelBox(g, txt, p[0] - 6, p[1], CAL_COLOR.Y1);
        }
      });
      g.restore();
    }
    function labelBox(g, txt, x, y, col) {
      var w = g.measureText(txt).width + 6, h = 15;
      var bx = g.textAlign === 'center' ? x - w / 2 : g.textAlign === 'right' ? x - w + 3 : x - 3;
      var by = g.textBaseline === 'top' ? y - 1 : y - h / 2;
      g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(bx, by, w, h);
      g.fillStyle = col; g.fillText(txt, x, y);
    }

    function drawLoupe() {
      var show = S.image && hover && hover.inside && S.settings.loupe &&
        ['calib', 'point', 'polygon', 'wand', 'select'].indexOf(S.tool) >= 0 && !(drag && drag.type === 'pan') && !pinch;
      if (S.tool === 'select' && !(drag && (drag.type === 'calib' || drag.type === 'point' || drag.type === 'vertex'))) show = false;
      loupe.classList.toggle('idg-on', !!show);
      if (!show) return;
      var dpr = window.devicePixelRatio || 1, L = 160;
      if (loupe.width !== L * dpr) { loupe.width = L * dpr; loupe.height = L * dpr; }
      // keep the magnifier away from the cursor
      var right = hover.sx < 200 && hover.sy < 200;
      loupe.style.left = right ? 'auto' : '10px'; loupe.style.right = right ? '10px' : 'auto';
      var z = Math.max(4, Math.min(24, S.view.scale * 4));
      var half = L / 2 / z;
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.fillStyle = '#f3f4f6'; lctx.fillRect(0, 0, L, L);
      lctx.imageSmoothingEnabled = false;
      var sx0 = hover.ix - half, sy0 = hover.iy - half;
      lctx.save();
      lctx.setTransform(dpr * z, 0, 0, dpr * z, -sx0 * z * dpr, -sy0 * z * dpr);
      lctx.drawImage(S.image, 0, 0);
      lctx.restore();
      function LT(x, y) { return [(x - sx0) * z, (y - sy0) * z]; }
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // markers
      var names = calNames(), P = S.calib.mode === 'none' ? [] : calPts();
      P.forEach(function (p, i) { if (!p) return; var s = LT(p.x, p.y); lctx.strokeStyle = CAL_COLOR[names[i]]; lctx.lineWidth = 1.5; lctx.beginPath(); lctx.arc(s[0], s[1], 7, 0, 7); lctx.stroke(); });
      S.series.forEach(function (se) { if (se.hidden) return; se.points.forEach(function (p) { var s = LT(p.x, p.y); lctx.fillStyle = se.color; lctx.beginPath(); lctx.arc(s[0], s[1], 3, 0, 7); lctx.fill(); }); });
      if (draft && draft.kind === 'polygon') {
        lctx.strokeStyle = '#12647e'; lctx.lineWidth = 1.5; lctx.beginPath();
        draft.pts.concat([{ x: hover.ix, y: hover.iy }]).forEach(function (p, i) { var s = LT(p.x, p.y); if (i) lctx.lineTo(s[0], s[1]); else lctx.moveTo(s[0], s[1]); });
        lctx.stroke();
      }
      // crosshair
      lctx.strokeStyle = 'rgba(255,255,255,.9)'; lctx.lineWidth = 3;
      lctx.beginPath(); lctx.moveTo(L / 2, 0); lctx.lineTo(L / 2, L / 2 - 6); lctx.moveTo(L / 2, L / 2 + 6); lctx.lineTo(L / 2, L); lctx.moveTo(0, L / 2); lctx.lineTo(L / 2 - 6, L / 2); lctx.moveTo(L / 2 + 6, L / 2); lctx.lineTo(L, L / 2); lctx.stroke();
      lctx.strokeStyle = '#b42318'; lctx.lineWidth = 1;
      lctx.beginPath(); lctx.moveTo(L / 2, 0); lctx.lineTo(L / 2, L / 2 - 6); lctx.moveTo(L / 2, L / 2 + 6); lctx.lineTo(L / 2, L); lctx.moveTo(0, L / 2); lctx.lineTo(L / 2 - 6, L / 2); lctx.moveTo(L / 2 + 6, L / 2); lctx.lineTo(L, L / 2); lctx.stroke();
      // colour readout for the wand
      if (S.tool === 'wand' && hover.ix >= 0 && hover.iy >= 0 && hover.ix < S.w && hover.iy < S.h) {
        var c = sampleColor(hover.ix, hover.iy);
        lctx.fillStyle = 'rgba(41,46,51,.88)'; lctx.fillRect(0, L - 20, L, 20);
        lctx.fillStyle = rgbToHex(c[0], c[1], c[2]); lctx.fillRect(4, L - 16, 12, 12);
        lctx.fillStyle = '#fff'; lctx.font = '11px ui-monospace, monospace'; lctx.textBaseline = 'middle'; lctx.textAlign = 'left';
        lctx.fillText(rgbToHex(c[0], c[1], c[2]) + '  rgb ' + c.join(','), 22, L - 10);
      }
    }

    /* ------------------------------------------------------ pointer input */
    function evPos(e) {
      var r = canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
      return { sx: sx, sy: sy, ix: (sx - S.view.ox) / S.view.scale, iy: (sy - S.view.oy) / S.view.scale };
    }
    function startPan(p) { drag = { type: 'pan', sx: p.sx, sy: p.sy, ox: S.view.ox, oy: S.view.oy }; canvas.style.cursor = 'grabbing'; }

    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    canvas.addEventListener('pointerdown', function (e) {
      canvas.focus({ preventScroll: true });
      if (!S.image) return;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        if (draft && draft.kind !== 'polygon') draft = null;
        if (drag && drag.undoPushed && drag.type !== 'pan') commit();
        drag = null; startPinch(); return;
      }
      if (pointers.size > 2) return;
      var p = evPos(e), th = e.pointerType === 'touch' ? 20 : 11;
      hover = Object.assign({ inside: true }, p);
      if (e.button === 2) { if (draft && draft.kind === 'polygon') finishPolygon(); else cancelDraft(); return; }
      if (e.button === 1 || spaceDown || S.tool === 'pan') { e.preventDefault(); startPan(p); return; }
      if (e.button !== 0) return;

      var t = S.tool, ci, pt;
      if (t === 'select') {
        ci = hitCalib(p.sx, p.sy, th);
        if (ci >= 0) { S.selected = { type: 'calib', idx: ci }; drag = { type: 'calib', idx: ci, p0: p }; renderAll(); requestDraw(); return; }
        var r = selRegion(), vi = r ? hitVertex(r, p.sx, p.sy, th) : -1;
        if (vi >= 0) { drag = { type: 'vertex', id: r.id, idx: vi, p0: p }; return; }
        pt = hitPoint(p.sx, p.sy, th);
        if (pt) { S.selected = { type: 'point', sid: pt.sid, idx: pt.idx }; S.activeSeries = pt.sid; drag = { type: 'point', sid: pt.sid, idx: pt.idx, p0: p }; renderAll(); requestDraw(); return; }
        var hr = hitRegion(p.ix, p.iy);
        if (hr) {
          S.selected = { type: 'region', id: hr.id }; drag = { type: 'move', id: hr.id, p0: p, last: p };
          renderAll(); requestDraw(); scrollSelectedIntoView(); return;
        }
        S.selected = null; renderAll(); requestDraw(); startPan(p); drag.deselect = true; return;
      }
      if (t === 'calib') {
        if (S.calib.mode === 'none') { setCalMode('axes'); }
        ci = hitCalib(p.sx, p.sy, th);
        if (ci >= 0) { S.selected = { type: 'calib', idx: ci }; S.calibStep = ci; drag = { type: 'calib', idx: ci, p0: p }; renderAll(); requestDraw(); return; }
        placeCalib(p);
        return;
      }
      if (t === 'polygon') {
        if (!draft) { draft = { kind: 'polygon', pts: [] }; renderOptions(); }
        if (draft.pts.length >= 3) { var s0 = toScreen(draft.pts[0].x, draft.pts[0].y); if (Math.hypot(s0[0] - p.sx, s0[1] - p.sy) <= th) { finishPolygon(); return; } }
        draft.pts.push({ x: p.ix, y: p.iy }); renderOptions(); requestDraw(); return;
      }
      if (t === 'rect' || t === 'ellipse') { draft = { kind: t, a: { x: p.ix, y: p.iy }, b: null, circle: e.shiftKey }; drag = { type: 'draft' }; return; }
      if (t === 'freehand') { draft = { kind: 'freehand', pts: [{ x: p.ix, y: p.iy }] }; drag = { type: 'draft' }; return; }
      if (t === 'wand') { runWand(p.ix, p.iy, e.shiftKey); return; }
      if (t === 'point') {
        var se = activeSeries();
        pt = hitPoint(p.sx, p.sy, th, se.id);
        if (pt) { S.selected = { type: 'point', sid: pt.sid, idx: pt.idx }; drag = { type: 'point', sid: pt.sid, idx: pt.idx, p0: p }; renderAll(); requestDraw(); return; }
        pushUndo();
        se.points.push({ x: p.ix, y: p.iy });
        S.selected = { type: 'point', sid: se.id, idx: se.points.length - 1 };
        drag = { type: 'point', sid: se.id, idx: se.points.length - 1, p0: p, undoPushed: true, moved: true, fresh: true };
        if (activeTab !== 'points') setTab('points');
        commit();
        return;
      }
    });

    function placeCalib(p) {
      var P = calPts(), names = calNames();
      var idx = S.calibStep;
      if (idx == null || idx < 0 || idx >= P.length) idx = P.indexOf(null);
      if (idx < 0) { toast('All reference points are set. Drag a marker to adjust it, or press “Pick” next to a point to redo it.'); return; }
      pushUndo();
      P[idx] = { x: p.ix, y: p.iy };
      S.selected = { type: 'calib', idx: idx };
      drag = { type: 'calib', idx: idx, p0: p, undoPushed: true, moved: true };
      var next = -1;
      for (var k = 1; k <= P.length; k++) { var j = (idx + k) % P.length; if (!P[j]) { next = j; break; } }
      S.calibStep = next;
      recal();
      if (activeTab !== 'calib') setTab('calib');
      commit();
      var input = $(root, '[data-calval="' + names[idx] + '"]');
      if (input && matchMedia('(pointer: fine)').matches) setTimeout(function () { input.focus(); input.select(); }, 0);
      flashRow(names[idx]);
      if (next < 0) {
        if (cal.calibrated) { setTimeout(function () { toast('Calibration complete ✓ — you can now measure. Tick “Show calibrated grid” to double-check.', { long: true }); }, 300); }
      }
    }

    canvas.addEventListener('pointermove', function (e) {
      if (!S.image) return;
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size >= 2) { updatePinch(); return; }
      var p = evPos(e);
      hover = Object.assign({ inside: true }, p);
      if (drag) {
        var d = drag;
        if (d.type === 'pan') { S.view.ox = d.ox + (p.sx - d.sx); S.view.oy = d.oy + (p.sy - d.sy); if (Math.hypot(p.sx - d.sx, p.sy - d.sy) > 3) d.deselect = false; }
        else if (d.type === 'draft' && draft) {
          if (draft.kind === 'freehand') { var last = draft.pts[draft.pts.length - 1]; if (dist(last, { x: p.ix, y: p.iy }) * S.view.scale >= 2) draft.pts.push({ x: p.ix, y: p.iy }); }
          else { draft.b = { x: p.ix, y: p.iy }; draft.circle = e.shiftKey; }
        } else if (d.type === 'calib' || d.type === 'point' || d.type === 'vertex' || d.type === 'move') {
          if (!d.moved && Math.hypot(p.sx - d.p0.sx, p.sy - d.p0.sy) < 3) { /* click without drag */ }
          else {
            if (!d.undoPushed) { pushUndo(); d.undoPushed = true; }
            d.moved = true;
            if (d.type === 'calib') { calPts()[d.idx] = { x: p.ix, y: p.iy }; recal(); renderCalibInfo(); }
            else if (d.type === 'point') { var se = seriesById(d.sid); if (se && se.points[d.idx]) se.points[d.idx] = { x: p.ix, y: p.iy }; }
            else if (d.type === 'vertex') { var r = regionById(d.id); if (r) { r.pts[d.idx] = { x: p.ix, y: p.iy }; if (r.kind === 'rect') r.kind = 'polygon'; } }
            else if (d.type === 'move') {
              var rr = regionById(d.id), dx = (p.sx - d.last.sx) / S.view.scale, dy = (p.sy - d.last.sy) / S.view.scale;
              if (rr) {
                if (rr.kind === 'mask') { d.accX = (d.accX || 0) + dx; d.accY = (d.accY || 0) + dy; var ix = Math.round(d.accX), iy = Math.round(d.accY); if (ix || iy) { rr.mask = finishMask({ x0: rr.mask.x0 + ix, y0: rr.mask.y0 + iy, w: rr.mask.w, h: rr.mask.h, bits: rr.mask.bits }); d.accX -= ix; d.accY -= iy; } }
                else rr.pts = rr.pts.map(function (q) { return { x: q.x + dx, y: q.y + dy }; });
              }
              d.last = p;
            }
          }
        }
        requestDraw();
      } else {
        // hover cursor
        var th = e.pointerType === 'touch' ? 20 : 11, cur = 'crosshair';
        if (spaceDown || S.tool === 'pan') cur = 'grab';
        else if (S.tool === 'select') {
          var sr = selRegion();
          if (hitCalib(p.sx, p.sy, th) >= 0 || (sr && hitVertex(sr, p.sx, p.sy, th) >= 0) || hitPoint(p.sx, p.sy, th)) cur = 'move';
          else if (hitRegion(p.ix, p.iy)) cur = 'pointer'; else cur = 'default';
        } else if (S.tool === 'calib' && hitCalib(p.sx, p.sy, th) >= 0) cur = 'move';
        else if (S.tool === 'point' && hitPoint(p.sx, p.sy, th, S.activeSeries)) cur = 'move';
        canvas.style.cursor = cur;
        if (draft && draft.kind === 'polygon') requestDraw();
      }
      renderStatus(); drawLoupe();
    });

    function endPointer(e) {
      pointers.delete(e.pointerId);
      if (pinch) { if (pointers.size < 2) { pinch = null; } return; }
      var d = drag; drag = null;
      canvas.style.cursor = '';
      if (!d) return;
      if (d.type === 'draft' && draft) {
        var dr = draft;
        if (dr.kind === 'freehand') {
          draft = null;
          var simp = simplify(dr.pts, 0.6 / S.view.scale);
          if (simp.length < 3 || Math.abs(shoelace(simp)) * S.view.scale * S.view.scale < 30) { toast('Shape too small — hold and draw around the area'); requestDraw(); return; }
          addRegion('freehand', simp);
        } else if (dr.b) {
          draft = null;
          var w = Math.abs(dr.b.x - dr.a.x) * S.view.scale, h = Math.abs(dr.b.y - dr.a.y) * S.view.scale;
          if (w < 3 || h < 3) { toast('Press and drag to draw the ' + (dr.kind === 'rect' ? 'rectangle' : 'ellipse')); requestDraw(); return; }
          addRegion(dr.kind, dr.kind === 'rect' ? rectPts(dr.a, dr.b) : makeEllipse(dr.a, dr.b, dr.circle));
        } else { draft = null; toast('Press and drag to draw'); requestDraw(); }
        return;
      }
      if (d.type === 'pan') { renderStatus(); return; }
      if (d.moved) { if (d.type === 'calib') recal(); commit(); }
    }
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);
    canvas.addEventListener('pointerleave', function () { if (!drag) { hover = null; drawLoupe(); renderStatus(); } });
    canvas.addEventListener('dblclick', function (e) { if (draft && draft.kind === 'polygon') { e.preventDefault(); finishPolygon(); } });
    canvas.addEventListener('wheel', function (e) {
      if (!S.image) return;
      e.preventDefault();
      var p = evPos(e);
      var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (e.ctrlKey && Math.abs(dy) < 50) dy *= 3; // trackpad pinch
      zoomAt(Math.exp(-dy * 0.0015), p.sx, p.sy);
      hover = Object.assign({ inside: true }, evPos(e)); drawLoupe();
    }, { passive: false });

    function startPinch() {
      var a = Array.from(pointers.values());
      var r = canvas.getBoundingClientRect();
      pinch = { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), cx: (a[0].x + a[1].x) / 2 - r.left, cy: (a[0].y + a[1].y) / 2 - r.top, scale: S.view.scale, ox: S.view.ox, oy: S.view.oy };
    }
    function updatePinch() {
      var a = Array.from(pointers.values()), r = canvas.getBoundingClientRect();
      var d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), cx = (a[0].x + a[1].x) / 2 - r.left, cy = (a[0].y + a[1].y) / 2 - r.top;
      var ns = clamp(pinch.scale * d / (pinch.d || 1), 0.02, 64);
      S.view.scale = ns;
      S.view.ox = cx - (pinch.cx - pinch.ox) * ns / pinch.scale;
      S.view.oy = cy - (pinch.cy - pinch.oy) * ns / pinch.scale;
      requestDraw(); renderStatus();
    }
    function simplify(pts, eps) {
      if (pts.length < 4) return pts.slice();
      // Ramer–Douglas–Peucker
      var keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
      var stack = [[0, pts.length - 1]];
      while (stack.length) {
        var seg = stack.pop(), a = pts[seg[0]], b = pts[seg[1]], md = 0, mi = -1;
        var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1e-9;
        for (var i = seg[0] + 1; i < seg[1]; i++) { var dd = Math.abs(dy * pts[i].x - dx * pts[i].y + b.x * a.y - b.y * a.x) / L; if (dd > md) { md = dd; mi = i; } }
        if (md > eps && mi > 0) { keep[mi] = 1; stack.push([seg[0], mi], [mi, seg[1]]); }
      }
      return pts.filter(function (p, i) { return keep[i]; });
    }

    /* ------------------------------------------------------------ keyboard */
    function isActive() {
      var a = document.activeElement;
      return root.contains(a) || a === document.body || a === null || root.matches(':hover');
    }
    function typing(e) { var t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable); }
    var keyHandler = function (e) {
      if (!isActive() || !$(root, '.idg-modal').hidden) { if (e.key === 'Escape') closeModal(); return; }
      var mod = e.ctrlKey || e.metaKey, k = e.key;
      if (mod && (k === 's' || k === 'S')) { e.preventDefault(); saveProject(); return; }
      if (mod && (k === 'o' || k === 'O')) { e.preventDefault(); fileImage.click(); return; }
      if (typing(e)) { if (k === 'Enter' && e.target.matches('.idg-calval')) { e.target.blur(); } return; }
      if (mod && !e.shiftKey && (k === 'z' || k === 'Z')) { e.preventDefault(); undo(); return; }
      if (mod && (k === 'y' || k === 'Y' || ((k === 'z' || k === 'Z') && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (mod) return;
      if (k === ' ') { if (!spaceDown) { spaceDown = true; canvas.style.cursor = 'grab'; } e.preventDefault(); return; }
      if (k === 'Escape') { if (draft) cancelDraft(); else if (S.selected) { S.selected = null; renderAll(); requestDraw(); } return; }
      if (k === 'Enter') { if (draft && draft.kind === 'polygon') { e.preventDefault(); finishPolygon(); } return; }
      if (k === 'Backspace' || k === 'Delete') {
        if (draft && draft.kind === 'polygon') { e.preventDefault(); draft.pts.pop(); if (!draft.pts.length) draft = null; renderOptions(); requestDraw(); return; }
        if (S.selected) { e.preventDefault(); deleteSelection(); }
        return;
      }
      if (k.indexOf('Arrow') === 0 && S.selected) {
        var step = (e.shiftKey ? 10 : 1) / (S.view.scale > 4 ? Math.round(S.view.scale / 2) : 1);
        var dx = k === 'ArrowLeft' ? -step : k === 'ArrowRight' ? step : 0, dy = k === 'ArrowUp' ? -step : k === 'ArrowDown' ? step : 0;
        if (nudge(dx, dy)) e.preventDefault();
        return;
      }
      var map = { v: 'select', h: 'pan', c: 'calib', p: 'polygon', r: 'rect', e: 'ellipse', f: 'freehand', w: 'wand', d: 'point' };
      var lk = k.toLowerCase();
      if (map[lk]) { setTool(map[lk]); return; }
      if (k === '+' || k === '=') { zoomAt(1.25); return; }
      if (k === '-' || k === '_') { zoomAt(0.8); return; }
      if (k === '0') { fit(); return; }
    };
    var keyUpHandler = function (e) { if (e.key === ' ') { spaceDown = false; canvas.style.cursor = ''; } };
    window.addEventListener('keydown', keyHandler);
    window.addEventListener('keyup', keyUpHandler);

    var lastNudge = 0;
    function nudge(dx, dy) {
      var s = S.selected; if (!s) return false;
      if (Date.now() - lastNudge > 800) pushUndo();
      lastNudge = Date.now();
      if (s.type === 'calib') { var P = calPts(); if (!P[s.idx]) return false; P[s.idx] = { x: P[s.idx].x + dx, y: P[s.idx].y + dy }; recal(); }
      else if (s.type === 'point') { var se = seriesById(s.sid); var q = se && se.points[s.idx]; if (!q) return false; se.points[s.idx] = { x: q.x + dx, y: q.y + dy }; }
      else if (s.type === 'region') {
        var r = regionById(s.id); if (!r) return false;
        if (r.kind === 'mask') { var ix = Math.round(dx) || Math.sign(dx), iy = Math.round(dy) || Math.sign(dy); r.mask = finishMask({ x0: r.mask.x0 + ix, y0: r.mask.y0 + iy, w: r.mask.w, h: r.mask.h, bits: r.mask.bits }); }
        else r.pts = r.pts.map(function (p) { return { x: p.x + dx, y: p.y + dy }; });
      }
      commit(); return true;
    }

    /* ------------------------------------------------------------- paste / drop */
    var pasteHandler = function (e) {
      if (!isActive() || typing(e)) return;
      var items = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') === 0) { e.preventDefault(); openImageFile(items[i].getAsFile(), 'pasted-image.png'); return; }
      }
    };
    window.addEventListener('paste', pasteHandler);
    var dragDepth = 0;
    stage.addEventListener('dragenter', function (e) { e.preventDefault(); dragDepth++; stage.classList.add('idg-dragging'); });
    stage.addEventListener('dragleave', function () { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) stage.classList.remove('idg-dragging'); });
    stage.addEventListener('dragover', function (e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    stage.addEventListener('drop', function (e) {
      e.preventDefault(); dragDepth = 0; stage.classList.remove('idg-dragging');
      var file = e.dataTransfer.files && e.dataTransfer.files[0]; if (!file) return;
      if (/json$/i.test(file.name) || file.type === 'application/json' || /\.idg$/i.test(file.name)) openProjectFile(file); else openImageFile(file);
    });

    /* --------------------------------------------------------- load / save */
    function readAsDataURL(file) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; r.readAsDataURL(file); }); }
    function loadImg(src) {
      return new Promise(function (res, rej) {
        var img = new Image();
        img.onload = function () { res(img); };
        img.onerror = function () { rej(new Error('This file could not be opened as an image.')); };
        img.src = src;
      });
    }
    function hasWork() { return S.regions.length || S.series.some(function (s) { return s.points.length; }) || calPts().some(Boolean); }

    function openImageFile(file, name) {
      if (!file) return;
      if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name || '')) { toast('PDF files are not supported — take a screenshot of the page (or export it as PNG) and open that.', { long: true }); return; }
      if (/tiff?$/i.test(file.type) || /\.tiff?$/i.test(file.name || '')) { toast('Browsers cannot open TIFF images — please convert to PNG first.', { long: true }); return; }
      readAsDataURL(file).then(function (src) { return setImageWithPrompt(src, name || file.name || 'image'); })
        .catch(function (err) { toast(err.message || String(err), { long: true }); });
    }
    function setImageWithPrompt(src, name) {
      return loadImg(src).then(function (img) {
        if (!S.image || !hasWork()) { setImage(img, src, name, false); return; }
        return ask('Open a new image', '<p>You already have measurements on the current image.</p>', [
          { label: 'Cancel', value: 'cancel' },
          { label: 'Keep calibration & shapes', value: 'keep' },
          { label: 'Start fresh', value: 'clear', primary: true }
        ]).then(function (v) {
          if (v === 'cancel' || !v) return;
          setImage(img, src, name, v === 'keep');
        });
      });
    }
    function setImage(img, src, name, keep) {
      if (S.image) pushUndo();
      if (!keep) {
        var st = freshState();
        st.settings = S.settings; st.tool = S.tool === 'pan' ? 'select' : S.tool;
        S = st; undoStack = []; redoStack = [];
      }
      S.image = img; S.imageSrc = src; S.imageName = name; S.w = img.naturalWidth || img.width; S.h = img.naturalHeight || img.height;
      pixels = null;
      if (!S.w || !S.h) { S.w = 800; S.h = 600; }
      recal(); draft = null;
      root.classList.add('idg-has-image');
      fit(); commit();
      if (!keep && S.calib.mode === 'none') setTab('calib');
      toast('Image loaded: ' + name + ' (' + S.w + ' × ' + S.h + ' px)');
      dirty = false;
    }

    function serializeProject(includeImage) {
      return {
        app: 'image-digitizer', format: 1, version: VERSION, savedAt: new Date().toISOString(),
        image: S.image ? { name: S.imageName, width: S.w, height: S.h, dataUrl: includeImage ? S.imageSrc : undefined } : null,
        calibration: deep(S.calib),
        regions: S.regions.map(function (r) {
          var o = { id: r.id, name: r.name, kind: r.kind, color: r.color, visible: r.visible };
          if (r.pts) o.pts = r.pts.map(function (p) { return [round(p.x, 4), round(p.y, 4)]; });
          if (r.mask) o.mask = { x0: r.mask.x0, y0: r.mask.y0, w: r.mask.w, h: r.mask.h, rle: rleEncode(r.mask.bits) };
          if (r.wand) o.wand = deep(r.wand);
          return o;
        }),
        series: S.series.map(function (s) { return { id: s.id, name: s.name, color: s.color, hidden: !!s.hidden, points: s.points.map(function (p) { return [round(p.x, 4), round(p.y, 4)]; }) }; }),
        activeSeries: S.activeSeries,
        ratios: S.ratios.map(function (r) { return { id: r.id, mainId: r.mainId, subId: r.subId }; }),
        counter: S.counter,
        settings: deep(S.settings)
      };
    }
    function loadProjectData(o) {
      if (!o || o.app !== 'image-digitizer') return Promise.reject(new Error('This is not an Image Digitizer project file.'));
      if (!o.image || !o.image.dataUrl) return Promise.reject(new Error('The project file does not contain an image.'));
      return loadImg(o.image.dataUrl).then(function (img) {
        var st = freshState();
        st.image = img; st.imageSrc = o.image.dataUrl; st.imageName = o.image.name || 'image';
        st.w = img.naturalWidth || o.image.width; st.h = img.naturalHeight || o.image.height;
        if (o.calibration) {
          st.calib = Object.assign(st.calib, o.calibration);
          st.calib.axes = Object.assign(freshState().calib.axes, o.calibration.axes || {});
          st.calib.scale = Object.assign(freshState().calib.scale, o.calibration.scale || {});
          st.calib.axes.vals = (st.calib.axes.vals || []).map(function (v) { return v == null ? '' : String(v); });
        }
        st.regions = (o.regions || []).map(function (r) {
          var x = { id: r.id || uid(), name: r.name || 'Area', kind: r.kind || 'polygon', color: r.color || PALETTE[0], visible: r.visible !== false, pts: null, mask: null, wand: r.wand || null };
          if (r.pts) x.pts = r.pts.map(function (p) { return Array.isArray(p) ? { x: p[0], y: p[1] } : { x: p.x, y: p.y }; });
          if (r.mask) x.mask = finishMask({ x0: r.mask.x0, y0: r.mask.y0, w: r.mask.w, h: r.mask.h, bits: rleDecode(r.mask.rle, r.mask.w * r.mask.h) });
          return x;
        }).filter(function (r) { return (r.pts && r.pts.length >= 3) || r.mask; });
        if (o.series && o.series.length) st.series = o.series.map(function (s) {
          return { id: s.id || uid(), name: s.name || 'Series', color: s.color || PALETTE[1], hidden: !!s.hidden, points: (s.points || []).map(function (p) { return Array.isArray(p) ? { x: p[0], y: p[1] } : { x: p.x, y: p.y }; }) };
        });
        st.activeSeries = o.activeSeries;
        if (!st.series.some(function (s) { return s.id === st.activeSeries; })) st.activeSeries = st.series[0].id;
        st.ratios = (o.ratios || []).map(function (r) { return { id: r.id || uid(), mainId: r.mainId, subId: r.subId }; });
        st.counter = o.counter || st.regions.length;
        if (o.settings) st.settings = Object.assign(st.settings, o.settings);
        S = st; undoStack = []; redoStack = []; pixels = null; draft = null;
        recal(); root.classList.add('idg-has-image');
        fit(); commit(true);
        dirty = false;
      });
    }
    function openProjectFile(file) {
      file.text().then(function (t) {
        var o; try { o = JSON.parse(t); } catch (e) { throw new Error('The file is not valid JSON.'); }
        var go = function () { return loadProjectData(o).then(function () { toast('Project opened: ' + file.name); }); };
        if (S.image && dirty && hasWork()) {
          return ask('Open project', '<p>Replace the current work with <b>' + escHtml(file.name) + '</b>?</p>', [{ label: 'Cancel', value: 0 }, { label: 'Open', value: 1, primary: true }])
            .then(function (v) { if (v) return go(); });
        }
        return go();
      }).catch(function (err) { toast(err.message || String(err), { long: true }); });
    }
    function saveProject() {
      if (!S.image) { toast('Open an image first'); return; }
      var blob = new Blob([JSON.stringify(serializeProject(true))], { type: 'application/json' });
      downloadBlob(blob, baseName(S.imageName) + '.digitizer.json');
      dirty = false;
      toast('Project saved — open it later with “Open project”.');
    }
    function scheduleAutosave() {
      if (!options.autosave || !S.image) return;
      clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(function () {
        try { IDB.set(options.storageKey, serializeProject(true)).catch(function () { }); } catch (e) { /* storage not available */ }
      }, 1200);
    }
    function checkRestore() {
      if (!options.autosave) return;
      try {
        IDB.get(options.storageKey).then(function (o) {
          if (!o || !o.image || !o.image.dataUrl || S.image) return;
          var b = $(root, '.idg-restore'); b.hidden = false;
          var when = o.savedAt ? new Date(o.savedAt) : null;
          $(b, 'span').textContent = 'Restore last session (' + (o.image.name || 'image') + (when ? ', ' + fmtDate(when) : '') + ')';
          b.onclick = function () { loadProjectData(o).then(function () { toast('Previous session restored'); }).catch(function (e) { toast(e.message); }); };
        }).catch(function () { });
      } catch (e) { /* ignore */ }
    }
    function newProject() {
      var go = function () {
        var st = freshState(); st.settings = S.settings; S = st; undoStack = []; redoStack = []; pixels = null; draft = null;
        recal(); root.classList.remove('idg-has-image');
        try { IDB.del(options.storageKey); } catch (e) { }
        $(root, '.idg-restore').hidden = true;
        commit(true); dirty = false;
      };
      if (S.image && hasWork() && dirty) {
        ask('Start a new project?', '<p>Unsaved measurements will be lost. Use <b>Save project</b> first if you want to keep them.</p>', [{ label: 'Cancel', value: 0 }, { label: 'Start new', value: 1, primary: true }])
          .then(function (v) { if (v) go(); });
      } else go();
    }

    /* ---------------------------------------------------------------- demo */
    function makeDemo() {
      var ready = (document.fonts && document.fonts.load)
        ? Promise.all(['300 22px "Newsreader"', '15px "Open Sans"'].map(function (q) { return document.fonts.load(q); })).catch(function () { })
        : Promise.resolve();
      return ready.then(drawDemo);
    }
    function drawDemo() {
      var W = 960, H = 640, c = document.createElement('canvas'); c.width = W; c.height = H;
      var g = c.getContext('2d');
      var L = 100, R = 900, T = 50, B = 560; // plot box: x 0..10, y 0..100
      function X(x) { return L + (R - L) * x / 10; } function Y(y) { return B - (B - T) * y / 100; }
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#e5e7eb'; g.lineWidth = 1;
      for (var i = 0; i <= 10; i++) { g.beginPath(); g.moveTo(X(i), T); g.lineTo(X(i), B); g.stroke(); }
      for (var j = 0; j <= 100; j += 10) { g.beginPath(); g.moveTo(L, Y(j)); g.lineTo(R, Y(j)); g.stroke(); }
      // regions
      g.fillStyle = '#a6d7f0'; g.fillRect(X(2), Y(60), X(6) - X(2), Y(20) - Y(60));          // 4 x 40 = 160
      g.fillStyle = '#e3c4a6'; g.beginPath(); g.ellipse(X(4), Y(40), X(1) - X(0), Y(0) - Y(10), 0, 0, Math.PI * 2); g.fill(); // ellipse 1 x 10 semi-axes -> pi*10 = 31.416
      g.fillStyle = '#9fb9a3'; g.beginPath(); g.moveTo(X(7), Y(15)); g.lineTo(X(9.5), Y(25)); g.lineTo(X(9), Y(55)); g.lineTo(X(7.5), Y(45)); g.closePath(); g.fill();
      // curve
      g.strokeStyle = '#12647e'; g.lineWidth = 2.5; g.beginPath();
      for (var x = 0; x <= 10.0001; x += 0.05) { var y = 80 + 9 * Math.sin(x / 1.3) + x * 0.4; if (x === 0) g.moveTo(X(x), Y(y)); else g.lineTo(X(x), Y(y)); }
      g.stroke();
      g.fillStyle = '#12647e';
      for (var x2 = 0.5; x2 < 10; x2 += 1) { var y2 = 80 + 9 * Math.sin(x2 / 1.3) + x2 * 0.4; g.beginPath(); g.arc(X(x2), Y(y2), 5, 0, Math.PI * 2); g.fill(); }
      // axes
      g.strokeStyle = '#000'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, T); g.lineTo(L, B); g.lineTo(R, B); g.stroke();
      g.fillStyle = '#000'; g.font = '15px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'top';
      for (var k = 0; k <= 10; k++) { g.beginPath(); g.moveTo(X(k), B); g.lineTo(X(k), B + 8); g.stroke(); g.fillText(String(k), X(k), B + 12); }
      g.textAlign = 'right'; g.textBaseline = 'middle';
      for (var m = 0; m <= 100; m += 20) { g.beginPath(); g.moveTo(L - 8, Y(m)); g.lineTo(L, Y(m)); g.stroke(); g.fillText(String(m), L - 12, Y(m)); }
      g.textAlign = 'center'; g.font = '16px ' + FONT; g.fillText('Time, h', (L + R) / 2, B + 52);
      g.save(); g.translate(30, (T + B) / 2); g.rotate(-Math.PI / 2); g.fillText('Signal, %', 0, 0); g.restore();
      g.font = '300 22px "Newsreader", Georgia, serif'; g.fillText('Demo chart. Blue box = 160 h·%, sand ellipse = 31.42 h·%', (L + R) / 2, 22);
      var src = c.toDataURL('image/png');
      return loadImg(src).then(function (img) {
        setImage(img, src, 'demo-chart.png', false);
        S.calib.mode = 'axes';
        S.calib.axes.pts = [{ x: X(2), y: B }, { x: X(8), y: B }, { x: L, y: Y(20) }, { x: L, y: Y(80) }];
        S.calib.axes.vals = ['2', '8', '20', '80'];
        S.calib.axes.xUnit = 'h'; S.calib.axes.yUnit = '%';
        S.calibStep = -1;
        recal(); setTool('wand'); commit(); setTab('calib');
        toast('Demo loaded and pre-calibrated (see the X1/X2/Y1/Y2 markers). Now click the blue box with the Colour tool, or draw a shape.', { long: true });
      });
    }

    /* ------------------------------------------------------------ results */
    function areaRows() {
      var unit = cal.areaUnit, logAxes = cal.mode === 'axes' && (cal.xLog || cal.yLog);
      var head = ['#', 'Name', 'Type', 'Area (' + unit + ')'];
      if (logAxes) head.push('Area in axis space (' + (cal.xLog ? 'decades' : 'X') + '·' + (cal.yLog ? 'decades' : 'Y') + ')');
      if (cal.calibrated) head.push('Area (px²)');
      head.push('% of image', 'Perimeter (px)', 'Corners / pixels', 'Centroid X', 'Centroid Y', 'Colour detection');
      var rows = S.regions.map(function (r, i) {
        var a = regionAreas(r), c = regionCentroid(r), cd = cal.toData(c.x, c.y);
        var row = [i + 1, r.name, KIND_LABEL[r.kind] || r.kind, a.data];
        if (logAxes) row.push(a.axis);
        if (cal.calibrated) row.push(a.px);
        row.push(100 * a.px / (S.w * S.h), r.pts ? polyPerimeter(r.pts) : null, r.pts ? r.pts.length : a.px, cd[0], cd[1],
          r.wand ? ('tolerance ' + r.wand.tol + ', ' + (r.wand.mode === 'global' ? 'whole image' : 'connected') + (r.wand.fillHoles ? ', holes filled' : '') + ', colour ' + r.wand.seeds.map(function (s) { return rgbToHex(s.c[0], s.c[1], s.c[2]); }).join(' ')) : '');
        return row;
      });
      return { head: head, rows: rows };
    }
    function pointRows() {
      var head = ['Series', '#', 'X' + (cal.xUnit && cal.xUnit !== 'px' ? ' (' + cal.xUnit + ')' : ''), 'Y' + (cal.yUnit && cal.yUnit !== 'px' ? ' (' + cal.yUnit + ')' : ''), 'X (px)', 'Y (px)'];
      var rows = [];
      S.series.forEach(function (se) {
        var pts = se.points.map(function (p, i) { var d = cal.toData(p.x, p.y); return { i: i + 1, x: d[0], y: d[1], px: p.x, py: p.y }; });
        if (S.settings.sortX) pts.sort(function (a, b) { return a.x - b.x; });
        pts.forEach(function (p) { rows.push([se.name, p.i, p.x, p.y, p.px, p.py]); });
      });
      return { head: head, rows: rows };
    }
    function ratioRows() {
      var unit = cal.areaUnit;
      var head = ['#', 'Main area', 'Sub area', 'Main (' + unit + ')', 'Sub (' + unit + ')', 'Sub / Main', 'Sub / Main (%)', 'Pixel (visual) ratio', 'Overlap of Main (%)', 'Sub inside Main (%)'];
      var rows = [];
      S.ratios.forEach(function (rt, i) {
        var r = ratioResult(rt); if (!r) return;
        rows.push([i + 1, r.main.name, r.sub.name, r.aMain, r.aSub, r.ratio, 100 * r.ratio, r.pxRatio, 100 * r.overlapOfMain, 100 * r.subInside]);
      });
      return { head: head, rows: rows };
    }
    function calibRows() {
      var rows = [['Image', S.imageName], ['Image size (px)', S.w + ' × ' + S.h], ['Calibration', S.calib.mode === 'axes' ? 'Chart axes (4 points)' : S.calib.mode === 'scale' ? 'Scale bar (2 points)' : 'None (pixels)'], ['Status', cal.calibrated ? 'OK' : (cal.msg || 'not calibrated')]];
      if (S.calib.mode === 'axes') {
        rows.push(['X axis', S.calib.axes.xLog ? 'logarithmic' : 'linear'], ['Y axis', S.calib.axes.yLog ? 'logarithmic' : 'linear'], ['X name / unit', S.calib.axes.xUnit], ['Y name / unit', S.calib.axes.yUnit]);
        CAL_AXES.forEach(function (n, i) { var p = S.calib.axes.pts[i]; rows.push([n + ' value', num(S.calib.axes.vals[i])], [n + ' pixel (x, y)', p ? round(p.x, 2) + ', ' + round(p.y, 2) : 'not set']); });
      } else if (S.calib.mode === 'scale') {
        CAL_SCALE.forEach(function (n, i) { var p = S.calib.scale.pts[i]; rows.push([n + ' pixel (x, y)', p ? round(p.x, 2) + ', ' + round(p.y, 2) : 'not set']); });
        rows.push(['Length', num(S.calib.scale.length)], ['Unit', S.calib.scale.unit]);
        if (cal.calibrated) rows.push(['Scale (' + cal.xUnit + ' per px)', cal.s]);
      }
      rows.push(['Area unit', cal.areaUnit], ['Exported', fmtDate()], ['Tool', 'Image Digitizer v' + VERSION]);
      return rows;
    }
    function vertexRows() {
      var head = ['Area', 'Corner #', 'X (px)', 'Y (px)', 'X', 'Y'], rows = [];
      S.regions.forEach(function (r) { if (!r.pts) return; r.pts.forEach(function (p, i) { var d = cal.toData(p.x, p.y); rows.push([r.name, i + 1, p.x, p.y, d[0], d[1]]); }); });
      return { head: head, rows: rows };
    }
    function hdr(arr) { return arr.map(function (h) { return { v: h, s: 'h' }; }); }

    function exportXlsx() {
      if (!S.image) { toast('Open an image first'); return; }
      if (!global.XLSXLite) { toast('Excel writer (xlsx-lite.js) is not loaded'); return; }
      var a = areaRows(), p = pointRows(), r = ratioRows(), v = vertexRows();
      var sheets = [
        { name: 'Areas', rows: [hdr(a.head)].concat(a.rows), colWidths: [5, 18, 14, 16, 16, 14, 12, 14, 14, 14, 14, 40], freeze: true },
        { name: 'Ratios', rows: [hdr(r.head)].concat(r.rows), colWidths: [5, 18, 18, 16, 16, 12, 14, 16, 16, 16], freeze: true },
        { name: 'Points', rows: [hdr(p.head)].concat(p.rows), colWidths: [16, 6, 16, 16, 12, 12], freeze: true },
        { name: 'Shape corners', rows: [hdr(v.head)].concat(v.rows), colWidths: [18, 9, 12, 12, 16, 16], freeze: true },
        { name: 'Calibration', rows: [hdr(['Item', 'Value'])].concat(calibRows()), colWidths: [26, 40], freeze: true }
      ];
      // one sheet per series (handy for plotting)
      S.series.forEach(function (se) {
        if (!se.points.length) return;
        var pts = se.points.map(function (q) { return cal.toData(q.x, q.y); });
        if (S.settings.sortX) pts.sort(function (m, n) { return m[0] - n[0]; });
        sheets.push({ name: 'Series - ' + se.name, rows: [hdr(['X', 'Y'])].concat(pts), colWidths: [16, 16], freeze: true });
      });
      downloadBlob(global.XLSXLite.workbook(sheets), baseName(S.imageName) + '_results.xlsx');
      toast('Excel workbook downloaded');
    }
    function toCSV(head, rows) {
      var s = sig();
      return '﻿' + [head].concat(rows.map(function (r) { return r.map(function (v) { return typeof v === 'number' ? (Number.isInteger(v) ? v : Number(v.toPrecision(Math.max(s, 8)))) : v; }); }))
        .map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
    }
    function exportCSV(kind) {
      if (!S.image) { toast('Open an image first'); return; }
      var t = kind === 'areas' ? areaRows() : kind === 'points' ? pointRows() : ratioRows();
      if (!t.rows.length) { toast('There are no ' + kind + ' to export yet'); return; }
      downloadBlob(new Blob([toCSV(t.head, t.rows)], { type: 'text/csv;charset=utf-8' }), baseName(S.imageName) + '_' + kind + '.csv');
    }
    function textReport() {
      var L = [], line = new Array(64).join('─');
      L.push('IMAGE DIGITIZER — RESULTS', line);
      calibRows().forEach(function (r) { L.push(pad(r[0], 22) + ' ' + (typeof r[1] === 'number' ? f(r[1]) : r[1])); });
      L.push('', 'AREAS', line);
      if (!S.regions.length) L.push('(none)');
      S.regions.forEach(function (r, i) {
        var a = regionAreas(r);
        L.push((i + 1) + '. ' + r.name + '  [' + KIND_LABEL[r.kind] + ']');
        L.push('     Area: ' + f(a.data) + ' ' + cal.areaUnit + (cal.calibrated ? '   (' + fmtInt(a.px) + ' px², ' + fmtNum(100 * a.px / (S.w * S.h), 4) + '% of image)' : ''));
        if (cal.mode === 'axes' && (cal.xLog || cal.yLog)) L.push('     Axis-space area: ' + f(a.axis));
      });
      L.push('', 'RATIOS', line);
      if (!S.ratios.length) L.push('(none)');
      S.ratios.forEach(function (rt, i) {
        var r = ratioResult(rt); if (!r) return;
        L.push((i + 1) + '. ' + r.sub.name + ' / ' + r.main.name + ' = ' + f(r.ratio) + '  (' + fmtNum(100 * r.ratio, 4) + ' %)');
        L.push('     pixel ratio ' + f(r.pxRatio) + ' · ' + fmtNum(100 * r.subInside, 4) + '% of sub lies inside main');
      });
      L.push('', 'POINTS', line);
      var p = pointRows();
      if (!p.rows.length) L.push('(none)');
      else {
        L.push(pad('Series', 14) + pad('#', 5) + pad(p.head[2], 18) + pad(p.head[3], 18));
        p.rows.forEach(function (r) { L.push(pad(r[0], 14) + pad(r[1], 5) + pad(f(r[2]), 18) + pad(f(r[3]), 18)); });
      }
      L.push('', 'Generated ' + fmtDate() + ' · Image Digitizer v' + VERSION);
      return L.join('\r\n');
      function pad(s, n) { s = String(s); return s.length >= n ? s + ' ' : s + new Array(n - s.length + 1).join(' '); }
    }
    function exportTxt() { if (!S.image) { toast('Open an image first'); return; } downloadBlob(new Blob([textReport()], { type: 'text/plain;charset=utf-8' }), baseName(S.imageName) + '_report.txt'); }
    function exportJSON() {
      if (!S.image) { toast('Open an image first'); return; }
      var a = areaRows(), p = pointRows(), r = ratioRows();
      function objs(t) { return t.rows.map(function (row) { var o = {}; t.head.forEach(function (h, i) { o[h] = row[i]; }); return o; }); }
      var out = { calibration: Object.fromEntries(calibRows()), areas: objs(a), ratios: objs(r), points: objs(p), project: serializeProject(false) };
      downloadBlob(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }), baseName(S.imageName) + '_results.json');
    }
    function exportPNG() {
      if (!S.image) { toast('Open an image first'); return; }
      var c = document.createElement('canvas'); c.width = S.w; c.height = S.h;
      if (S.w * S.h > 16e6 * 2) { toast('Image too large to export'); return; }
      var g = c.getContext('2d');
      var lw = Math.max(1, Math.min(S.w, S.h) / 700);
      g.fillStyle = '#fff'; g.fillRect(0, 0, S.w, S.h);
      var keepSel = S.selected; S.selected = null;
      drawScene(g, { scale: 1, ox: 0, oy: 0 }, 1, { live: false, lw: lw, labels: !!S.settings.imgLabels, calib: !!S.settings.imgLabels, grid: S.settings.showGrid });
      S.selected = keepSel;
      c.toBlob(function (b) { if (b) downloadBlob(b, baseName(S.imageName) + '_annotated.png'); else toast('Export failed'); }, 'image/png');
    }
    function copyTables() {
      if (!S.image) { toast('Open an image first'); return; }
      function tsv(t) { return [t.head].concat(t.rows.map(function (r) { return r.map(function (v) { return typeof v === 'number' ? f(v) : (v == null ? '' : v); }); })).map(function (r) { return r.join('\t'); }).join('\n'); }
      var parts = [];
      var a = areaRows(); if (a.rows.length) parts.push('AREAS\n' + tsv(a));
      var r = ratioRows(); if (r.rows.length) parts.push('RATIOS\n' + tsv(r));
      var p = pointRows(); if (p.rows.length) parts.push('POINTS\n' + tsv(p));
      if (!parts.length) { toast('Nothing to copy yet'); return; }
      var text = parts.join('\n\n');
      var ok = function () { toast('Copied — paste into Excel, Sheets or Word'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () { fallbackCopy(text) ? ok() : toast('Copy failed'); });
      else fallbackCopy(text) ? ok() : toast('Copy failed');
    }
    function fallbackCopy(text) {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { } ta.remove(); return ok;
    }

    /* ---------------------------------------------------------------- UI */
    function setTool(t) {
      if (draft && t !== S.tool) draft = null;
      S.tool = t;
      if (t === 'calib') {
        if (S.calib.mode === 'none') setCalMode('axes');
        var P = calPts(); if (S.calibStep == null || S.calibStep < 0 || P[S.calibStep]) S.calibStep = P.indexOf(null);
        setTab('calib');
      }
      if (t === 'point') setTab('points');
      if (['polygon', 'rect', 'ellipse', 'freehand', 'wand'].indexOf(t) >= 0 && activeTab !== 'areas' && activeTab !== 'ratios') setTab('areas');
      $$(root, '.idg-tool[data-tool]').forEach(function (b) { b.classList.toggle('idg-active', b.dataset.tool === t); b.setAttribute('aria-pressed', b.dataset.tool === t); });
      canvas.style.cursor = '';
      renderHint(); renderOptions(); requestDraw(); drawLoupe();
    }
    function setTab(t) {
      activeTab = t;
      $$(root, '[data-tab]').forEach(function (b) { b.classList.toggle('idg-active', b.dataset.tab === t); b.setAttribute('aria-selected', b.dataset.tab === t); });
      $$(root, '[data-pane]').forEach(function (p) { p.hidden = p.dataset.pane !== t; });
    }
    function setCalMode(m) {
      if (S.calib.mode === m) return;
      pushUndo(); S.calib.mode = m; S.calibStep = m === 'none' ? -1 : calPts().indexOf(null); recal(); commit();
    }
    function flashRow(name) {
      var r = $(root, '[data-calrow="' + name + '"]'); if (!r) return;
      r.classList.remove('idg-flash'); void r.offsetWidth; r.classList.add('idg-flash');
    }
    function scrollSelectedIntoView() {
      var s = S.selected; if (!s || s.type !== 'region') return;
      var el = $(root, '[data-list="areas"] [data-id="' + s.id + '"]');
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    }

    function renderAll() {
      renderCalibInfo(); renderAreas(); renderRatios(); renderPoints(); renderSteps(); renderHint(); renderOptions(); renderStatus(); renderButtons();
    }
    function renderButtons() {
      $(root, '[data-act="undo"]').disabled = !undoStack.length && !draft;
      $(root, '[data-act="redo"]').disabled = !redoStack.length;
      $$(root, '[data-count]').forEach(function (e) {
        var k = e.dataset.count, n = k === 'areas' ? S.regions.length : k === 'ratios' ? S.ratios.length : S.series.reduce(function (s, x) { return s + x.points.length; }, 0);
        e.textContent = n ? n : '';
      });
    }
    function renderSteps() {
      var measured = S.regions.length || S.series.some(function (s) { return s.points.length; });
      var st = { image: !!S.image, calib: cal.calibrated, measure: !!measured, export: false };
      $$(root, '[data-step]').forEach(function (li) {
        var k = li.dataset.step;
        li.classList.toggle('idg-done', !!st[k]);
        var n = $(li, 'i'); n.textContent = st[k] ? '✓' : n.dataset.n;
        li.classList.toggle('idg-optional', k === 'calib' && !cal.calibrated && S.calib.mode === 'none');
      });
    }
    function renderHint() {
      var h = TOOL_HINT[S.tool] || '';
      if (!S.image) h = '';
      if (S.tool === 'calib') {
        var names = calNames(), P = calPts(), idx = S.calibStep;
        if (idx != null && idx >= 0 && idx < P.length) {
          var nm = names[idx];
          h = S.calib.mode === 'axes'
            ? 'Click a point on the ' + (nm[0] === 'X' ? '<b>X axis</b>' : '<b>Y axis</b>') + ' whose value you know → <b class="idg-hl" style="--c:' + CAL_COLOR[nm] + '">' + nm + '</b>' + (nm === 'X1' ? ' (e.g. the first labelled tick)' : nm === 'X2' ? ' (a tick far to the right)' : nm === 'Y1' ? ' (e.g. the lowest labelled tick)' : ' (a tick near the top)')
            : 'Click ' + (nm === 'P1' ? 'one end' : 'the other end') + ' of the scale bar → <b class="idg-hl" style="--c:' + CAL_COLOR[nm] + '">' + nm + '</b>';
        } else {
          h = cal.calibrated ? 'Calibrated ✓ — drag a marker to fine-tune it, or choose a measuring tool.' : (cal.msg || 'Fill in the values in the Calibrate panel.');
        }
      }
      if (draft && draft.kind === 'polygon' && draft.pts.length) h = draft.pts.length + ' corner' + (draft.pts.length > 1 ? 's' : '') + ' — keep clicking. <b>Double-click</b>, <b>Enter</b> or click the first (yellow) corner to finish.';
      hintEl.innerHTML = h;
      hintEl.hidden = !h;
    }
    function renderOptions() {
      var t = S.tool, html = '';
      if (!S.image) { optEl.innerHTML = ''; optEl.hidden = true; return; }
      if (t === 'wand') {
        var r = selRegion(), editing = r && r.wand;
        var regs = S.regions.filter(function (x) { return !editing || x.id !== r.id; });
        html += '<label class="idg-opt" title="How different a pixel may be from the clicked colour (0 = identical)">Tolerance <input type="range" min="0" max="150" step="1" data-opt="tol" value="' + S.settings.tol + '"><output>' + S.settings.tol + '</output></label>' +
          '<label class="idg-opt"><select class="idg-input idg-sm" data-opt="wandMode"><option value="contiguous"' + (S.settings.wandMode === 'contiguous' ? ' selected' : '') + '>Connected region</option><option value="global"' + (S.settings.wandMode === 'global' ? ' selected' : '') + '>Whole image</option></select></label>' +
          '<label class="idg-opt idg-check" title="Include enclosed gaps such as text or grid lines inside the region"><input type="checkbox" data-opt="fillHoles"' + (S.settings.fillHoles ? ' checked' : '') + '> Fill holes</label>' +
          '<label class="idg-opt" title="Only detect inside another area, e.g. the plot box">Only inside <select class="idg-input idg-sm" data-opt="limitId"><option value="">whole image</option>' +
          regs.map(function (x) { return '<option value="' + x.id + '"' + (S.settings.limitId === x.id ? ' selected' : '') + '>' + escHtml(x.name) + '</option>'; }).join('') + '</select></label>' +
          '<span class="idg-opt" title="Find every pixel of a chosen colour">Pick colour <input type="color" data-opt="findColor" value="' + (S.settings.findColor || '#a6d7f0') + '"> <button class="idg-textbtn" data-act="find-color">Find colour</button></span>';
        if (editing) html += '<span class="idg-opt idg-note">Editing <b>' + escHtml(r.name) + '</b>: changes re-run detection · Shift+click adds spots</span>';
      } else if (t === 'polygon' && draft && draft.kind === 'polygon') {
        html += '<button class="idg-btn idg-secondary idg-sm" data-act="poly-finish">Finish shape (Enter)</button>' +
          '<button class="idg-textbtn" data-act="poly-undo">Remove last corner</button>' +
          '<button class="idg-textbtn" data-act="poly-cancel">Cancel (Esc)</button>';
      } else if (t === 'point') {
        html += '<label class="idg-opt">Adding to <select class="idg-input idg-sm" data-opt="series">' + S.series.map(function (s) { return '<option value="' + s.id + '"' + (s.id === S.activeSeries ? ' selected' : '') + '>' + escHtml(s.name) + '</option>'; }).join('') + '</select></label>' +
          '<button class="idg-textbtn" data-act="series-add">New series</button>';
      } else if (t === 'calib') {
        html += '<label class="idg-opt"><select class="idg-input idg-sm" data-opt="calmode"><option value="axes"' + (S.calib.mode === 'axes' ? ' selected' : '') + '>Chart axes (4 points)</option><option value="scale"' + (S.calib.mode === 'scale' ? ' selected' : '') + '>Scale bar (2 points)</option></select></label>' +
          '<button class="idg-textbtn" data-act="cal-restart">Re-pick all points</button>';
      } else if (t === 'select' && S.selected) {
        html += '<button class="idg-textbtn" data-act="delete-sel">Delete selected</button>';
      }
      // only rebuild when content changes (keeps slider dragging smooth)
      if (optEl.__html !== html) { optEl.innerHTML = html; optEl.__html = html; }
      optEl.hidden = !html;
    }
    function renderStatus() {
      var st = function (k) { return $(root, '[data-st="' + k + '"]'); };
      if (hover && hover.inside && S.image) {
        st('px').textContent = 'Pixel: ' + hover.ix.toFixed(1) + ', ' + hover.iy.toFixed(1);
        var d = cal.toData(hover.ix, hover.iy);
        st('val').textContent = cal.calibrated ? 'Value: X = ' + f(d[0]) + (cal.xUnit && cal.mode === 'scale' ? ' ' + cal.xUnit : '') + ', Y = ' + f(d[1]) + (cal.yUnit && cal.mode === 'scale' ? ' ' + cal.yUnit : '') : 'Value: (not calibrated)';
      } else { st('px').textContent = 'Pixel: —'; st('val').textContent = 'Value: —'; }
      st('zoom').textContent = S.image ? 'Zoom: ' + Math.round(S.view.scale * 100) + '%' : 'Zoom: —';
      var c = st('cal');
      c.textContent = cal.calibrated ? '✓ Calibrated, ' + (cal.mode === 'axes' ? 'axes' + (cal.xLog ? ', log X' : '') + (cal.yLog ? ', log Y' : '') : cal.msg) : '○ Not calibrated, measuring in pixels';
      c.classList.toggle('idg-ok', cal.calibrated);
      st('img').textContent = S.image ? S.w + ' × ' + S.h + ' px' : '';
      $(root, '[data-doc="name"]').textContent = S.image ? S.imageName : 'No image open';
      $(root, '[data-doc="meta"]').textContent = S.image
        ? (S.regions.length + (S.regions.length === 1 ? ' area · ' : ' areas · ') + S.series.reduce(function (a, x) { return a + x.points.length; }, 0) + ' points · ' + (cal.calibrated ? 'calibrated' : 'in pixels'))
        : 'Open an image or try the demo chart';
    }
    function renderCalibInfo() {
      var c = S.calib;
      var modeSel = $(root, '[data-cal="mode"]'); if (document.activeElement !== modeSel) modeSel.value = c.mode;
      $$(root, '[data-calsec]').forEach(function (s) { s.hidden = s.dataset.calsec !== c.mode; });
      function setv(sel, v, prop) { var el = $(root, sel); if (!el || document.activeElement === el) return; if (prop === 'checked') el.checked = !!v; else el.value = v == null ? '' : v; }
      setv('[data-cal="xLog"]', c.axes.xLog, 'checked'); setv('[data-cal="yLog"]', c.axes.yLog, 'checked');
      setv('[data-cal="xUnit"]', c.axes.xUnit); setv('[data-cal="yUnit"]', c.axes.yUnit);
      setv('[data-cal="length"]', c.scale.length); setv('[data-cal="unit"]', c.scale.unit);
      CAL_AXES.forEach(function (n, i) { setv('[data-calval="' + n + '"]', c.axes.vals[i]); });
      var all = CAL_AXES.map(function (n, i) { return [n, c.axes.pts[i]]; }).concat(CAL_SCALE.map(function (n, i) { return [n, c.scale.pts[i]]; }));
      all.forEach(function (a) {
        var el = $(root, '[data-calpx="' + a[0] + '"]'); if (!el) return;
        el.textContent = a[1] ? 'px ' + a[1].x.toFixed(1) + ', ' + a[1].y.toFixed(1) : 'not set';
        el.classList.toggle('idg-set', !!a[1]);
      });
      var names = calNames();
      $$(root, '[data-calrow]').forEach(function (r) { r.classList.toggle('idg-next', S.tool === 'calib' && names[S.calibStep] === r.dataset.calrow); });
      var stEl = $(root, '.idg-calstatus');
      if (c.mode === 'none') { stEl.className = 'idg-calstatus'; stEl.innerHTML = '<span>Measuring in <b>pixels</b>. Choose a calibration type to get real units.</span>'; }
      else if (cal.calibrated) {
        stEl.className = 'idg-calstatus idg-ok';
        stEl.innerHTML = ICON.check + '<div><b>Calibrated.</b> Areas are in <b>' + escHtml(cal.areaUnit) + '</b>.' + (cal.msg ? '<br><small>' + escHtml(cal.msg) + '</small>' : '') + '</div>';
      } else { stEl.className = 'idg-calstatus idg-warn'; stEl.textContent = cal.msg; }
      var g = $(root, '[data-set="showGrid"]'); g.checked = !!S.settings.showGrid; g.disabled = c.mode !== 'axes';
      $$(root, '[data-set]').forEach(function (el) { var k = el.dataset.set; if (k === 'showGrid' || document.activeElement === el) return; if (el.type === 'checkbox') el.checked = !!S.settings[k]; else el.value = S.settings[k]; });
    }
    function renderAreas() {
      var list = $(root, '[data-list="areas"]');
      if (!S.regions.length) {
        list.innerHTML = '<div class="idg-emptylist">' + ICON.polygon + '<p>No areas yet.</p><small>' + (S.image ? 'Choose a drawing tool above or on the left, or use <b>By colour</b> to detect a coloured region.' : 'Open an image first.') + '</small></div>';
        return;
      }
      var unitCal = cal.calibrated;
      list.innerHTML = S.regions.map(function (r) {
        var a = regionAreas(r), sel = S.selected && S.selected.type === 'region' && S.selected.id === r.id;
        var sub = KIND_LABEL[r.kind] + (r.pts ? ' · ' + r.pts.length + ' corners' : r.wand ? ' · tol ' + r.wand.tol + (r.wand.mode === 'global' ? ' · whole image' : '') : '');
        var shown = unitCal ? f(a.data) + cal.areaUnit : fmtInt(a.px);
        return '<div class="idg-item' + (sel ? ' idg-sel' : '') + (r.visible ? '' : ' idg-hidden') + changed('a' + r.id, shown) + '" data-id="' + r.id + '">' +
          '<input type="color" class="idg-swatch" data-field="color" value="' + r.color + '" title="Change colour">' +
          '<div class="idg-item-main"><input class="idg-name" data-field="name" value="' + escHtml(r.name) + '" aria-label="Area name"><small>' + escHtml(sub) + '</small></div>' +
          '<div class="idg-item-val"><b>' + (unitCal ? f(a.data) : fmtInt(a.px)) + '</b><span>' + escHtml(unitCal ? cal.areaUnit : 'px²') + '</span>' +
            (unitCal ? '<small>' + fmtInt(a.px) + ' px²</small>' : '<small>' + fmtNum(100 * a.px / (S.w * S.h), 3) + '% of image</small>') +
            (cal.mode === 'axes' && (cal.xLog || cal.yLog) ? '<small title="Area measured in axis space (decades for log axes)">axis-space ' + f(a.axis) + '</small>' : '') + '</div>' +
          '<div class="idg-item-ops"><button class="idg-icon-btn" data-op="toggle" title="' + (r.visible ? 'Hide' : 'Show') + '">' + (r.visible ? ICON.eye : ICON.eyeOff) + '</button>' +
          '<button class="idg-icon-btn" data-op="delete" title="Delete">' + ICON.trash + '</button></div>' +
          '</div>';
      }).join('');
    }
    function renderRatios() {
      var ms = $(root, '[data-ratio="main"]'), ss = $(root, '[data-ratio="sub"]');
      var opts = S.regions.map(function (r) { return '<option value="' + r.id + '">' + escHtml(r.name) + '</option>'; }).join('');
      var mv = ms.value, sv = ss.value;
      ms.innerHTML = opts || '<option value="">— draw areas first —</option>'; ss.innerHTML = opts || '<option value="">— draw areas first —</option>';
      if (regionById(mv)) ms.value = mv; else if (S.regions[0]) ms.value = biggest();
      if (regionById(sv) && sv !== ms.value) ss.value = sv; else { var other = S.regions.filter(function (r) { return r.id !== ms.value; }).pop(); if (other) ss.value = other.id; }
      $(root, '[data-act="ratio-add"]').disabled = S.regions.length < 2;
      var list = $(root, '[data-list="ratios"]');
      if (!S.ratios.length) { list.innerHTML = '<div class="idg-emptylist">' + ICON.ratio + '<p>No ratios yet.</p><small>' + (S.regions.length < 2 ? 'You need at least two areas.' : 'Choose main and sub areas above, then press Add ratio.') + '</small></div>'; return; }
      list.innerHTML = S.ratios.map(function (rt) {
        var r = ratioResult(rt); if (!r) return '';
        var warn = r.subInside < 0.98 ? '<div class="idg-warnline">Only ' + fmtNum(100 * r.subInside, 3) + '% of the sub area lies inside the main area.</div>' : '';
        var logNote = cal.mode === 'axes' && (cal.xLog || cal.yLog) ? '<tr><td>On-screen (pixel) ratio</td><td>' + f(r.pxRatio) + '</td></tr>' : '<tr><td>Pixel ratio</td><td>' + f(r.pxRatio) + '</td></tr>';
        return '<div class="idg-ratio' + changed('r' + rt.id, f(r.ratio)) + '" data-rid="' + rt.id + '">' +
          '<div class="idg-ratio-head"><span><i style="background:' + r.sub.color + '"></i>' + escHtml(r.sub.name) + ' <em>÷</em> <i style="background:' + r.main.color + '"></i>' + escHtml(r.main.name) + '</span>' +
          '<button class="idg-icon-btn" data-op="ratio-del" title="Remove">' + ICON.trash + '</button></div>' +
          '<div class="idg-ratio-val">' + f(r.ratio) + '<small>' + fmtNum(100 * r.ratio, Math.max(3, sig() - 1)) + ' %</small></div>' +
          '<table class="idg-mini"><tr><td>Main area</td><td>' + f(r.aMain) + ' ' + escHtml(cal.areaUnit) + '</td></tr><tr><td>Sub area</td><td>' + f(r.aSub) + ' ' + escHtml(cal.areaUnit) + '</td></tr>' + logNote +
          '<tr><td>Sub inside main</td><td>' + fmtNum(100 * r.subInside, 4) + ' %</td></tr></table>' + warn +
          '</div>';
      }).join('');
      function biggest() { var b = S.regions[0], ba = -1; S.regions.forEach(function (r) { var a = regionAreas(r).px; if (a > ba) { ba = a; b = r; } }); return b.id; }
    }
    function renderPoints() {
      var wrap = $(root, '.idg-series');
      wrap.innerHTML = S.series.map(function (s) {
        var act = s.id === S.activeSeries;
        return '<div class="idg-serie' + (act ? ' idg-sel' : '') + '" data-sid="' + s.id + '">' +
          '<input type="radio" name="idg-active-series-' + rootId + '" data-sfield="active"' + (act ? ' checked' : '') + ' title="Add new points to this series">' +
          '<input type="color" class="idg-swatch" data-sfield="color" value="' + s.color + '">' +
          '<input class="idg-name" data-sfield="name" value="' + escHtml(s.name) + '" aria-label="Series name">' +
          '<small>' + s.points.length + ' pts</small>' +
          '<button class="idg-icon-btn" data-sop="toggle" title="' + (s.hidden ? 'Show' : 'Hide') + '">' + (s.hidden ? ICON.eyeOff : ICON.eye) + '</button>' +
          (S.series.length > 1 ? '<button class="idg-icon-btn" data-sop="delete" title="Delete series">' + ICON.trash + '</button>' : '') +
          '</div>';
      }).join('');
      var se = activeSeries(), tbl = $(root, '[data-list="points"]');
      var xh = 'X' + (cal.calibrated && cal.xUnit && cal.xUnit !== 'px' ? ' (' + escHtml(cal.xUnit) + ')' : cal.calibrated ? '' : ' (px)');
      var yh = 'Y' + (cal.calibrated && cal.yUnit && cal.yUnit !== 'px' ? ' (' + escHtml(cal.yUnit) + ')' : cal.calibrated ? '' : ' (px)');
      if (!se.points.length) { tbl.innerHTML = '<tr><td class="idg-emptycell">No points in <b>' + escHtml(se.name) + '</b> yet. Choose <b>Points</b> and click on the image.</td></tr>'; return; }
      tbl.innerHTML = '<thead><tr><th>#</th><th>' + xh + '</th><th>' + yh + '</th><th></th></tr></thead><tbody>' +
        se.points.map(function (p, i) {
          var d = cal.toData(p.x, p.y), sel = S.selected && S.selected.type === 'point' && S.selected.sid === se.id && S.selected.idx === i;
          var ch = changed('p' + se.id + ':' + i, f(d[0]) + '|' + f(d[1]));
          return '<tr data-pidx="' + i + '" class="' + (sel ? 'idg-sel' : '') + ch + '"><td>' + (i + 1) + '</td><td>' + f(d[0]) + '</td><td>' + f(d[1]) + '</td><td><button class="idg-icon-btn" data-op="pt-del" title="Delete point">' + ICON.trash + '</button></td></tr>';
        }).join('') + '</tbody>';
    }
    var rootId = uid();
    var shownVals = {};
    /** returns ' idg-changed' when the shown value for key differs from last render */
    function changed(key, val) {
      var prev = shownVals[key]; shownVals[key] = val;
      return prev !== undefined && prev !== val ? ' idg-changed' : '';
    }

    /* toast + modal */
    var toastTimer = null;
    function toast(msg, o) {
      o = o || {};
      var t = $(root, '.idg-toast');
      t.innerHTML = '<span>' + escHtml(msg) + '</span>' + (o.undo ? '<button class="idg-link" data-act="undo">Undo</button>' : '');
      t.classList.add('idg-show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { t.classList.remove('idg-show'); }, o.long ? 7000 : 3200);
    }
    var modalResolve = null;
    function ask(title, html, buttons) {
      var m = $(root, '.idg-modal');
      $(m, '.idg-dialog-body').innerHTML = (title ? '<h2>' + escHtml(title) + '</h2>' : '') + html;
      $(m, '.idg-dialog-btns').innerHTML = buttons.map(function (b, i) { return '<button class="idg-btn' + (b.primary ? ' idg-primary' : '') + '" data-mbtn="' + i + '">' + escHtml(b.label) + '</button>'; }).join('');
      m.hidden = false;
      var pb = $(m, '.idg-primary') || $(m, '[data-mbtn]'); if (pb) pb.focus({ preventScroll: true });
      return new Promise(function (res) { modalResolve = function (i) { m.hidden = true; modalResolve = null; res(i == null ? null : buttons[i].value); }; });
    }
    function closeModal() { if (modalResolve) modalResolve(null); else $(root, '.idg-modal').hidden = true; }
    $(root, '.idg-modal').addEventListener('click', function (e) {
      var b = e.target.closest('[data-mbtn]');
      if (b) { modalResolve ? modalResolve(+b.dataset.mbtn) : closeModal(); return; }
      if (e.target.classList.contains('idg-modal')) closeModal();
    });
    function showHelp() { ask('', '<div class="idg-helpbody">' + HELP_HTML + '</div>', [{ label: 'Close help', value: 1 }]); }

    /* ------------------------------------------------------- UI events */
    root.addEventListener('click', function (e) {
      var tb = e.target.closest('[data-tool]');
      if (tb && root.contains(tb) && tb.classList.contains('idg-tool')) { if (!S.image) { toast('Open an image first'); return; } setTool(tb.dataset.tool); return; }
      var qb = e.target.closest('[data-tool-btn]');
      if (qb) { if (!S.image) { toast('Open an image first'); return; } setTool(qb.dataset.toolBtn); return; }
      var tab = e.target.closest('[data-tab]'); if (tab) { setTab(tab.dataset.tab); return; }
      var step = e.target.closest('[data-goto]'); if (step) { if (step.dataset.goto) setTab(step.dataset.goto); else fileImage.click(); return; }
      var a = e.target.closest('[data-act]');
      if (a && !a.disabled) { act(a.dataset.act, a, e); return; }
      // list items
      var item = e.target.closest('.idg-item[data-id]');
      if (item) {
        var r = regionById(item.dataset.id); if (!r) return;
        var op = e.target.closest('[data-op]');
        if (op && op.dataset.op === 'toggle') { pushUndo(); r.visible = !r.visible; commit(); return; }
        if (op && op.dataset.op === 'delete') { S.selected = { type: 'region', id: r.id }; deleteSelection(); return; }
        if (e.target.matches('input')) { if (!(S.selected && S.selected.id === r.id)) { S.selected = { type: 'region', id: r.id }; requestDraw(); item.classList.add('idg-sel'); $$(root, '.idg-item.idg-sel').forEach(function (x) { if (x !== item) x.classList.remove('idg-sel'); }); renderOptions(); } return; }
        S.selected = { type: 'region', id: r.id };
        if (r.wand && S.tool === 'wand') { S.settings.tol = r.wand.tol; S.settings.wandMode = r.wand.mode; S.settings.fillHoles = r.wand.fillHoles; S.settings.limitId = r.wand.limitId || ''; }
        renderAll(); requestDraw(); return;
      }
      var rdel = e.target.closest('[data-op="ratio-del"]');
      if (rdel) { var rid = rdel.closest('[data-rid]').dataset.rid; pushUndo(); S.ratios = S.ratios.filter(function (x) { return x.id !== rid; }); commit(); return; }
      var pdel = e.target.closest('[data-op="pt-del"]');
      if (pdel) { var idx = +pdel.closest('[data-pidx]').dataset.pidx; S.selected = { type: 'point', sid: S.activeSeries, idx: idx }; deleteSelection(); return; }
      var prow = e.target.closest('tr[data-pidx]');
      if (prow) { S.selected = { type: 'point', sid: S.activeSeries, idx: +prow.dataset.pidx }; renderPoints(); requestDraw(); return; }
      var sop = e.target.closest('[data-sop]');
      if (sop) {
        var sid = sop.closest('[data-sid]').dataset.sid, se = seriesById(sid);
        if (sop.dataset.sop === 'toggle') { pushUndo(); se.hidden = !se.hidden; commit(); }
        if (sop.dataset.sop === 'delete') {
          pushUndo(); S.series = S.series.filter(function (x) { return x.id !== sid; });
          if (S.activeSeries === sid) S.activeSeries = S.series[0].id;
          if (S.selected && S.selected.sid === sid) S.selected = null;
          commit(); toast('Series deleted', { undo: true });
        }
        return;
      }
      var srow = e.target.closest('.idg-serie[data-sid]');
      if (srow && !e.target.matches('input[type=color], input.idg-name')) { S.activeSeries = srow.dataset.sid; renderPoints(); renderOptions(); }
    });

    function act(name, el) {
      switch (name) {
        case 'open-image': fileImage.click(); break;
        case 'open-project': fileProject.click(); break;
        case 'save-project': saveProject(); break;
        case 'undo': undo(); break;
        case 'redo': redo(); break;
        case 'new': newProject(); break;
        case 'help': showHelp(); break;
        case 'demo': makeDemo(); break;
        case 'restore': break;
        case 'zoom-in': zoomAt(1.25); break;
        case 'zoom-out': zoomAt(0.8); break;
        case 'zoom-fit': fit(); break;
        case 'cal-start':
          if (!S.image) { toast('Open an image first'); return; }
          S.calibStep = calPts().indexOf(null); if (S.calibStep < 0) S.calibStep = 0;
          setTool('calib'); renderCalibInfo(); break;
        case 'cal-restart':
          pushUndo(); var P = calPts(); for (var i = 0; i < P.length; i++) P[i] = null; S.calibStep = 0; recal(); commit(); break;
        case 'cal-pick':
          if (!S.image) { toast('Open an image first'); return; }
          setTool('calib');
          S.calibStep = calNames().indexOf(el.dataset.name);
          renderCalibInfo(); renderHint(); break;
        case 'ratio-add': {
          var m = $(root, '[data-ratio="main"]').value, s = $(root, '[data-ratio="sub"]').value;
          if (!m || !s) return;
          if (m === s) { toast('Choose two different areas'); return; }
          pushUndo(); S.ratios.push({ id: uid(), mainId: m, subId: s }); commit(); break;
        }
        case 'series-add': {
          pushUndo(); var id = uid(); S.series.push({ id: id, name: 'Series ' + (S.series.length + 1), color: PALETTE[(S.series.length + 1) % PALETTE.length], points: [] });
          S.activeSeries = id; commit(); setTab('points'); if (S.image && S.tool !== 'point') setTool('point'); break;
        }
        case 'poly-finish': finishPolygon(); break;
        case 'poly-undo': if (draft) { draft.pts.pop(); if (!draft.pts.length) draft = null; renderOptions(); renderHint(); requestDraw(); } break;
        case 'poly-cancel': cancelDraft(); renderHint(); break;
        case 'delete-sel': deleteSelection(); break;
        case 'find-color': findColor($(root, '[data-opt="findColor"]').value); break;
        case 'export-xlsx': exportXlsx(); break;
        case 'export-csv-areas': exportCSV('areas'); break;
        case 'export-csv-points': exportCSV('points'); break;
        case 'export-csv-ratios': exportCSV('ratios'); break;
        case 'export-txt': exportTxt(); break;
        case 'export-png': exportPNG(); break;
        case 'export-json': exportJSON(); break;
        case 'export-copy': copyTables(); break;
      }
    }

    fileImage.addEventListener('change', function () { var fl = fileImage.files[0]; fileImage.value = ''; if (fl) openImageFile(fl); });
    fileProject.addEventListener('change', function () { var fl = fileProject.files[0]; fileProject.value = ''; if (fl) openProjectFile(fl); });

    // calibration inputs
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.matches('[data-calval]')) {
        var i = CAL_AXES.indexOf(t.dataset.calval);
        if (!t.__undo) { pushUndo(); t.__undo = true; }
        S.calib.axes.vals[i] = t.value; recal(); renderCalibInfo(); renderAreas(); renderRatios(); renderPoints(); renderSteps(); renderStatus(); renderHint(); requestDraw(); scheduleAutosave();
        return;
      }
      if (t.matches('[data-cal="xUnit"],[data-cal="yUnit"],[data-cal="length"],[data-cal="unit"]')) {
        if (!t.__undo) { pushUndo(); t.__undo = true; }
        var k = t.dataset.cal;
        if (k === 'xUnit' || k === 'yUnit') S.calib.axes[k] = t.value; else S.calib.scale[k] = t.value;
        recal(); renderCalibInfo(); renderAreas(); renderRatios(); renderPoints(); renderSteps(); renderStatus(); requestDraw(); scheduleAutosave();
        return;
      }
      if (t.matches('[data-opt="tol"]')) { t.nextElementSibling.textContent = t.value; return; }
    });
    root.addEventListener('focusout', function (e) { if (e.target.__undo) e.target.__undo = false; });
    root.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('[data-cal="mode"]')) { setCalMode(t.value); if (t.value !== 'none' && S.image) { S.calibStep = calPts().indexOf(null); setTool('calib'); } return; }
      if (t.matches('[data-cal="xLog"],[data-cal="yLog"]')) { pushUndo(); S.calib.axes[t.dataset.cal] = t.checked; recal(); commit(); return; }
      if (t.matches('[data-set]')) {
        var k = t.dataset.set;
        S.settings[k] = t.type === 'checkbox' ? t.checked : t.value;
        commit(); return;
      }
      if (t.matches('[data-opt]')) {
        var o = t.dataset.opt;
        if (o === 'tol') { S.settings.tol = +t.value; rerunSelectedWand(); return; }
        if (o === 'wandMode') { S.settings.wandMode = t.value; rerunSelectedWand(); return; }
        if (o === 'fillHoles') { S.settings.fillHoles = t.checked; rerunSelectedWand(); return; }
        if (o === 'limitId') { S.settings.limitId = t.value; rerunSelectedWand(); return; }
        if (o === 'findColor') { S.settings.findColor = t.value; return; }
        if (o === 'series') { S.activeSeries = t.value; renderPoints(); return; }
        if (o === 'calmode') { setCalMode(t.value); S.calibStep = calPts().indexOf(null); renderAll(); return; }
      }
      var item = t.closest('.idg-item[data-id]');
      if (item) {
        var r = regionById(item.dataset.id); if (!r) return;
        pushUndo();
        if (t.dataset.field === 'name') r.name = t.value.trim() || r.name;
        if (t.dataset.field === 'color') r.color = t.value;
        commit(); return;
      }
      var srow = t.closest('.idg-serie[data-sid]');
      if (srow) {
        var se = seriesById(srow.dataset.sid); if (!se) return;
        if (t.dataset.sfield === 'active') { S.activeSeries = se.id; renderPoints(); renderOptions(); return; }
        pushUndo();
        if (t.dataset.sfield === 'name') se.name = t.value.trim() || se.name;
        if (t.dataset.sfield === 'color') se.color = t.value;
        commit();
      }
    });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.matches('.idg-name')) e.target.blur();
    });

    new ResizeObserver(function () { requestDraw(); }).observe(stage);
    window.addEventListener('beforeunload', function (e) { if (dirty && hasWork() && !options.autosave) { e.preventDefault(); e.returnValue = ''; } });

    setTool('select'); setTab('calib'); renderAll(); checkRestore();

    var api = {
      version: VERSION,
      loadImageURL: function (url, name) { return loadImg(url).then(function (img) { setImage(img, url, name || url.split('/').pop(), false); }); },
      loadProject: loadProjectData,
      getProject: function (includeImage) { return serializeProject(includeImage !== false); },
      getResults: function () { return { areas: areaRows(), ratios: ratioRows(), points: pointRows(), calibration: calibRows() }; },
      demo: makeDemo,
      setTool: setTool,
      fit: fit,
      textReport: textReport,
      _internal: { get state() { return S; }, get cal() { return cal; }, addRegion: addRegion, runWand: runWand, commit: commit, recal: recal, toScreen: toScreen, polyAreas: polyAreas, regionAreas: regionAreas, ratioResult: ratioResult },
      destroy: function () { window.removeEventListener('keydown', keyHandler); window.removeEventListener('keyup', keyUpHandler); window.removeEventListener('paste', pasteHandler); root.innerHTML = ''; root.__idg = null; }
    };
    root.__idg = api;
    return api;
  }

  global.ImageDigitizer = { mount: mount, version: VERSION, buildCalibration: buildCalibration, greenEdge: greenEdge, rleEncode: rleEncode, rleDecode: rleDecode };

  function autoMount() { $$(document, '[data-image-digitizer]').forEach(function (el) { if (!el.__idg) mount(el, { autosave: el.dataset.autosave !== 'false' }); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount); else autoMount();
})(window);
