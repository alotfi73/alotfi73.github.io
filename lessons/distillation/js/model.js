/* VLE, McCabe-Thiele, shortcut and tray-hydraulics model used by the figures. Exposes window.DC. */
/* Distillation calculation engine. Shared by the page and the Node checks. */
(function (root) {
  'use strict';
  var RCAL = 1.98720425864083; // cal/(mol K)

  /* ---------- pure-component vapour pressure, Antoine, kPa and degC (Smith, Van Ness & Abbott, Table B.2) ---------- */
  var ANT = {
    benzene:    { A: 13.7819, B: 2726.81, C: 217.572, M: 78.11,  name: 'Benzene' },
    toluene:    { A: 13.9320, B: 3056.96, C: 217.625, M: 92.14,  name: 'Toluene' },
    ethanol:    { A: 16.8958, B: 3795.17, C: 230.918, M: 46.07,  name: 'Ethanol' },
    water:      { A: 16.3872, B: 3885.70, C: 230.170, M: 18.015, name: 'Water' },
    methanol:   { A: 16.5785, B: 3638.27, C: 239.500, M: 32.04,  name: 'Methanol' },
    acetone:    { A: 14.3145, B: 2756.22, C: 228.060, M: 58.08,  name: 'Acetone' },
    chloroform: { A: 13.7324, B: 2548.74, C: 218.552, M: 119.38, name: 'Chloroform' }
  };
  function psat(c, T) { var a = ANT[c]; return Math.exp(a.A - a.B / (T + a.C)); }
  function tsat(c, P) { var a = ANT[c]; return a.B / (a.A - Math.log(P)) - a.C; }

  /* ---------- activity coefficient models ---------- */
  function vanLaar(A12, A21) {
    return function (x1) {
      var x2 = 1 - x1, d = A12 * x1 + A21 * x2;
      if (Math.abs(d) < 1e-14) return [1, 1];
      var l1 = A12 * Math.pow(A21 * x2 / d, 2), l2 = A21 * Math.pow(A12 * x1 / d, 2);
      return [Math.exp(l1), Math.exp(l2)];
    };
  }
  function wilson(V1, V2, a12, a21) {
    return function (x1, T) {
      var Tk = T + 273.15, x2 = 1 - x1;
      var L12 = V2 / V1 * Math.exp(-a12 / (RCAL * Tk)), L21 = V1 / V2 * Math.exp(-a21 / (RCAL * Tk));
      var d1 = x1 + x2 * L12, d2 = x2 + x1 * L21;
      var t = L12 / d1 - L21 / d2;
      var l1 = -Math.log(d1) + x2 * t, l2 = -Math.log(d2) - x1 * t;
      return [Math.exp(l1), Math.exp(l2)];
    };
  }
  function ideal() { return function () { return [1, 1]; }; }

  var SYS = {
    bt: { c1: 'benzene', c2: 'toluene', g: ideal(), name: 'Benzene–toluene', model: 'Raoult’s law (ideal)', kind: 'ideal' },
    ew: { c1: 'ethanol', c2: 'water', g: vanLaar(1.6798, 0.9227), name: 'Ethanol–water', model: 'van Laar, A₁₂ = 1.6798, A₂₁ = 0.9227', kind: 'minaz' },
    mw: { c1: 'methanol', c2: 'water', g: wilson(40.73, 18.07, 107.38, 469.55), name: 'Methanol–water', model: 'Wilson, a₁₂ = 107.38, a₂₁ = 469.55 cal/mol', kind: 'nonideal' },
    ac: { c1: 'acetone', c2: 'chloroform', g: vanLaar(-0.8643, -0.5899), name: 'Acetone–chloroform', model: 'van Laar, A₁₂ = −0.8643, A₂₁ = −0.5899', kind: 'maxaz' }
  };

  /* bubble point at P (kPa) for liquid x1: returns {T, y1, g1, g2} */
  function bubble(sys, x1, P) {
    var s = SYS[sys];
    var Tlo = Math.min(tsat(s.c1, P), tsat(s.c2, P)) - 40, Thi = Math.max(tsat(s.c1, P), tsat(s.c2, P)) + 40;
    var f = function (T) { var g = s.g(x1, T); return x1 * g[0] * psat(s.c1, T) + (1 - x1) * g[1] * psat(s.c2, T) - P; };
    var a = Tlo, b = Thi, fa = f(a);
    for (var i = 0; i < 100; i++) {
      var m = 0.5 * (a + b), fm = f(m);
      if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else { b = m; }
      if (b - a < 1e-9) break;
    }
    var T = 0.5 * (a + b), g = s.g(x1, T);
    return { T: T, y1: x1 * g[0] * psat(s.c1, T) / P, g1: g[0], g2: g[1] };
  }

  /* Equilibrium table for a system at pressure P, or constant alpha. */
  function eqTable(spec) {
    var n = 801, xs = [], ys = [], Ts = [];
    for (var i = 0; i < n; i++) {
      var u = i / (n - 1);
      var x = 0.5 - 0.5 * Math.cos(Math.PI * u); // dense near both ends
      xs.push(x);
      if (spec.alpha) { ys.push(spec.alpha * x / (1 + (spec.alpha - 1) * x)); Ts.push(NaN); }
      else { var b = bubble(spec.sys, x, spec.P); ys.push(b.y1); Ts.push(b.T); }
    }
    return { x: xs, y: ys, T: Ts, alpha: spec.alpha || null };
  }
  function interp(xa, ya, v) {
    var n = xa.length;
    if (v <= xa[0]) return ya[0];
    if (v >= xa[n - 1]) return ya[n - 1];
    var lo = 0, hi = n - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (xa[m] > v) hi = m; else lo = m; }
    var t = (v - xa[lo]) / (xa[hi] - xa[lo]);
    return ya[lo] + t * (ya[hi] - ya[lo]);
  }
  function yStar(E, x) {
    if (E.alpha) return E.alpha * x / (1 + (E.alpha - 1) * x);
    return interp(E.x, E.y, x);
  }
  function xStar(E, y) {
    if (E.alpha) return y / (E.alpha - (E.alpha - 1) * y);
    // equilibrium curve is monotonic in y for all binary systems used here
    return interp(E.y, E.x, y);
  }
  /* azeotrope (x where y = x), or null */
  function azeotrope(E) {
    for (var i = 2; i < E.x.length - 2; i++) {
      var d0 = E.y[i] - E.x[i], d1 = E.y[i + 1] - E.x[i + 1];
      if (d0 === 0 || (d0 > 0) !== (d1 > 0)) {
        var t = d0 / (d0 - d1);
        var x = E.x[i] + t * (E.x[i + 1] - E.x[i]);
        return { x: x, T: isNaN(E.T[i]) ? NaN : E.T[i] + t * (E.T[i + 1] - E.T[i]) };
      }
    }
    return null;
  }

  /* ---------- McCabe–Thiele ---------- */
  function qLineX(zF, q, R, xD) {
    // intersection of rectifying line with q-line
    if (Math.abs(q - 1) < 1e-9) return zF;
    return (zF / (q - 1) + xD / (R + 1)) / (q / (q - 1) - R / (R + 1));
  }
  /* Full column (total condenser + partial reboiler) or live steam (no reboiler). */
  function fullFeasible(E, o, R) {
    var s = R / (R + 1), b = o.xD / (R + 1);
    var xi = qLineX(o.zF, o.q, R, o.xD), yi = s * xi + b;
    if (!(xi > o.xB && xi < o.xD)) return false;
    var yB = o.steam ? 0 : o.xB;
    var ss = (yi - yB) / (xi - o.xB);
    if (yi > yStar(E, xi) + 1e-12) return false;
    var N = 400;
    for (var i = 1; i < N; i++) {
      var x = o.xB + (o.xD - o.xB) * i / N;
      var yop = x >= xi ? s * x + b : yB + ss * (x - o.xB);
      if (yop > yStar(E, x) + 1e-12) return false;
    }
    return true;
  }
  function rminFull(E, o) {
    var lo = 0, hi = 1;
    while (!fullFeasible(E, o, hi) && hi < 1e5) hi *= 2;
    if (hi >= 1e5) return Infinity;
    if (fullFeasible(E, o, 1e-6)) return 0;
    for (var k = 0; k < 60; k++) { var m = 0.5 * (lo + hi); if (fullFeasible(E, o, m)) hi = m; else lo = m; }
    return hi;
  }
  function stepFull(E, o, R) {
    var s = R / (R + 1), b = o.xD / (R + 1);
    var xi = qLineX(o.zF, o.q, R, o.xD), yi = s * xi + b;
    var yB = o.steam ? 0 : o.xB;
    var ss = (yi - yB) / (xi - o.xB);
    var steps = [], y = o.xD, x, feed = null, n = 0, xprev = o.xD, frac = 1;
    while (n < 400) {
      x = xStar(E, y); n++;
      steps.push([xprev, y, x]);
      if (feed === null && x < xi) feed = n;
      if (x <= o.xB + 1e-12) { frac = (xprev - o.xB) / Math.max(xprev - x, 1e-12); break; }
      xprev = x;
      y = x >= xi ? s * x + b : yB + ss * (x - o.xB);
    }
    var Nfrac = n - 1 + Math.min(1, frac);
    return { steps: steps, N: n, Nfrac: Nfrac, feed: feed || n, xi: xi, yi: yi, sR: s, bR: b, sS: ss, yB: yB, ok: n < 400 };
  }
  function balanceFull(o, R) {
    // per 100 kmol/h feed (CMO)
    var F = 100;
    if (!o.steam) {
      var D = F * (o.zF - o.xB) / (o.xD - o.xB), B = F - D;
      var L = R * D, V = (R + 1) * D, Lb = L + o.q * F, Vb = V - (1 - o.q) * F;
      return { F: F, D: D, B: B, L: L, V: V, Lb: Lb, Vb: Vb, S: 0 };
    }
    var D2 = F * (o.zF - o.q * o.xB) / (o.xD + R * o.xB);
    var L2 = R * D2, V2 = (R + 1) * D2, B2 = L2 + o.q * F, S = V2 - (1 - o.q) * F;
    return { F: F, D: D2, B: B2, L: L2, V: V2, Lb: B2, Vb: S, S: S };
  }

  /* Stripping column: saturated-liquid feed to the top tray, reboiler, no condenser or reflux. */
  function stripMinDF(E, o) {
    var smax = (yStar(E, o.zF) - o.xB) / (o.zF - o.xB), N = 400;
    for (var i = 1; i <= N; i++) {
      var x = o.xB + (o.zF - o.xB) * i / N;
      var v = (yStar(E, x) - o.xB) / (x - o.xB);
      if (v < smax) smax = v;
    }
    return 1 / smax; // minimum D/F (= minimum V-bar/F)
  }
  function stepStrip(E, o, DF) {
    var s = 1 / DF; // L-bar/V-bar = F/D
    var yD = (o.zF - (1 - DF) * o.xB) / DF;
    var steps = [], y = yD, x, n = 0, xprev = o.zF, frac = 1;
    while (n < 400) {
      x = xStar(E, y); n++;
      steps.push([xprev, y, x]);
      if (x <= o.xB + 1e-12) { frac = (xprev - o.xB) / Math.max(xprev - x, 1e-12); break; }
      xprev = x;
      y = s * x - (s - 1) * o.xB;
    }
    return { steps: steps, N: n, Nfrac: n - 1 + Math.min(1, frac), yD: yD, s: s, ok: n < 400 };
  }

  /* Rectifying column: saturated-vapour feed to the bottom tray, condenser and reflux, no reboiler. */
  function rectMinR(E, o) {
    var xlo = xStar(E, o.zF), smin = 0, N = 400;
    for (var i = 0; i < N; i++) {
      var x = xlo + (o.xD - xlo) * i / N;
      var v = (o.xD - yStar(E, x)) / (o.xD - x);
      if (v > smin) smin = v;
    }
    return smin / (1 - smin);
  }
  function stepRect(E, o, R) {
    var s = R / (R + 1), b = (1 - s) * o.xD;
    var xB = (o.zF - b) / s;
    var steps = [], y = o.xD, x, n = 0, xprev = o.xD, frac = 1;
    while (n < 400) {
      x = xStar(E, y); n++;
      steps.push([xprev, y, x]);
      if (x <= xB + 1e-12) { frac = (xprev - xB) / Math.max(xprev - x, 1e-12); break; }
      xprev = x;
      y = s * x + b;
    }
    return { steps: steps, N: n, Nfrac: n - 1 + Math.min(1, frac), xB: xB, s: s, b: b, ok: n < 400 };
  }

  /* ---------- shortcut methods ---------- */
  function fenske(xD, xB, alpha) { return Math.log((xD / (1 - xD)) * ((1 - xB) / xB)) / Math.log(alpha); }
  function underwoodBinary(xD, zF, alpha) { // saturated liquid feed
    return (1 / (alpha - 1)) * (xD / zF - alpha * (1 - xD) / (1 - zF));
  }
  function molokanov(R, Rmin, Nmin) {
    var X = (R - Rmin) / (R + 1);
    var Y = 1 - Math.exp(((1 + 54.4 * X) / (11 + 117.2 * X)) * ((X - 1) / Math.sqrt(X)));
    return (Nmin + Y) / (1 - Y); // N from Y = (N - Nmin)/(N + 1)
  }
  function oconnell(alpha, mu) { return 0.492 * Math.pow(alpha * mu, -0.245); }

  /* ---------- tray hydraulics ---------- */
  function csbFair(TSmm, FLV) { // Lygeros & Magoulas fit of Fair's chart, m/s
    return 0.0105 + 8.127e-4 * Math.pow(TSmm, 0.755) * Math.exp(-1.463 * Math.pow(FLV, 0.842));
  }
  function holeFactor(AhAa) { return AhAa >= 0.10 ? 1 : Math.max(0.5, 5 * AhAa + 0.5); }

  /* single-pass segmental downcomer: chord (weir) length for a downcomer area fraction */
  function weirLength(D, ad) {
    var lo = 0, hi = Math.PI;
    for (var i = 0; i < 80; i++) { var th = 0.5 * (lo + hi); if ((th - Math.sin(th)) / (2 * Math.PI) < ad) lo = th; else hi = th; }
    var t = 0.5 * (lo + hi);
    return D * Math.sin(t / 2);
  }
  /* Sieve tray rating (Sinnott / Fair methods). p: {V kg/h, QL m3/h, rhoV, rhoL, sig, D m, TS mm, ad, fh (Ah/Aa), hw mm, C0, SF, ucMax m/s} */
  function trayRate(p) {
    var A = Math.PI * p.D * p.D / 4, Ad = p.ad * A, An = A - Ad, Aa = A - 2 * Ad, Ah = p.fh * Aa;
    var lw = weirLength(p.D, p.ad);
    var Qv = p.V / 3600 / p.rhoV, Lkg = p.QL * p.rhoL / 3600;
    var un = Qv / An, uh = Qv / Ah;
    var FLV = p.V > 0 ? (Lkg * 3600 / p.V) * Math.sqrt(p.rhoV / p.rhoL) : 0;
    var C = csbFair(p.TS, Math.max(FLV, 0.005)) * Math.pow(p.sig / 20, 0.2) * holeFactor(p.fh) * p.SF;
    var unf = C * Math.sqrt((p.rhoL - p.rhoV) / p.rhoV);
    var how = Lkg > 0 ? 750 * Math.pow(Lkg / (p.rhoL * lw), 2 / 3) : 0;
    var hd = 51 * Math.pow(uh / p.C0, 2) * p.rhoV / p.rhoL;
    var hr = 12.5e3 / p.rhoL;
    var ht = hd + p.hw + how + hr;
    var hap = Math.max(p.hw - 10, 15) / 1000, Am = Math.min(hap * lw, Ad);
    var hdc = 166 * Math.pow(Lkg / (p.rhoL * Am), 2);
    var hb = p.hw + how + ht + hdc;
    var hbMax = 0.5 * (p.TS + p.hw);
    var tres = Lkg > 0 ? Ad * (hb / 1000) * p.rhoL / Lkg : Infinity;
    var udc = p.QL / 3600 / Ad;
    var Fh = uh * Math.sqrt(p.rhoV);
    var weirLoad = p.QL / lw; // m3/(h m)
    return { A: A, Ad: Ad, An: An, Aa: Aa, Ah: Ah, lw: lw, Qv: Qv, Lkg: Lkg, un: un, uh: uh, FLV: FLV, C: C, unf: unf, flood: un / unf,
      how: how, hd: hd, hr: hr, ht: ht, hdc: hdc, hb: hb, hbMax: hbMax, hbFrac: hb / hbMax, tres: tres, udc: udc, Fh: Fh,
      dP: ht / 1000 * p.rhoL * 9.80665 / 100, weirLoad: weirLoad, hap: hap * 1000 };
  }
  /* limit lines for the performance diagram; vapour in kg/h, liquid in m3/h */
  function jetFloodV(p, QL, frac) {
    var A = Math.PI * p.D * p.D / 4, An = A * (1 - p.ad), Lkg = QL * p.rhoL;
    var g = function (V) {
      var FLV = V > 0 ? (Lkg / V) * Math.sqrt(p.rhoV / p.rhoL) : 50;
      var C = csbFair(p.TS, Math.min(Math.max(FLV, 0.005), 2)) * Math.pow(p.sig / 20, 0.2) * holeFactor(p.fh) * p.SF;
      return V / (p.rhoV * 3600 * An) - frac * C * Math.sqrt((p.rhoL - p.rhoV) / p.rhoV);
    };
    var lo = 1e-6, hi = 1;
    while (g(hi) < 0 && hi < 1e12) hi *= 2;
    for (var i = 0; i < 80; i++) { var m = 0.5 * (lo + hi); if (g(m) < 0) lo = m; else hi = m; }
    return 0.5 * (lo + hi);
  }
  function backupV(p, QL) {
    var A = Math.PI * p.D * p.D / 4, Ad = p.ad * A, Aa = A - 2 * Ad, Ah = p.fh * Aa, lw = weirLength(p.D, p.ad);
    var Lkg = QL * p.rhoL / 3600;
    var how = Lkg > 0 ? 750 * Math.pow(Lkg / (p.rhoL * lw), 2 / 3) : 0;
    var hr = 12.5e3 / p.rhoL;
    var hap = Math.max(p.hw - 10, 15) / 1000, Am = Math.min(hap * lw, Ad);
    var hdc = 166 * Math.pow(Lkg / (p.rhoL * Am), 2);
    var hdMax = 0.5 * (p.TS + p.hw) - 2 * (p.hw + how) - hr - hdc;
    if (hdMax <= 0) return 0;
    var uh = p.C0 * Math.sqrt(hdMax * p.rhoL / (51 * p.rhoV));
    return uh * Ah * p.rhoV * 3600;
  }
  function weepV(p, Fh) {
    var A = Math.PI * p.D * p.D / 4, Aa = A * (1 - 2 * p.ad), Ah = p.fh * Aa;
    return Fh * Math.sqrt(p.rhoV) * Ah * 3600;
  }
  function nutterMaxWeir(TS) { // gpm per inch of weir, from the Nutter table by tray spacing
    var t = [[305, 3], [381, 5], [457, 8], [533, 10], [610, 13]];
    if (TS <= 305) return 3;
    if (TS >= 610) return 13;
    for (var i = 0; i < t.length - 1; i++) if (TS <= t[i + 1][0]) return t[i][1] + (t[i + 1][1] - t[i][1]) * (TS - t[i][0]) / (t[i + 1][0] - t[i][0]);
    return 13;
  }
  var GPMIN = 8.942; // 1 US gpm per inch of weir = 8.942 m3/h per m of weir

  root.DC = {
    weirLength: weirLength, trayRate: trayRate, jetFloodV: jetFloodV, backupV: backupV, weepV: weepV, nutterMaxWeir: nutterMaxWeir, GPMIN: GPMIN,
    ANT: ANT, SYS: SYS, psat: psat, tsat: tsat, bubble: bubble, eqTable: eqTable, yStar: yStar, xStar: xStar, azeotrope: azeotrope,
    rminFull: rminFull, stepFull: stepFull, balanceFull: balanceFull, qLineX: qLineX,
    stripMinDF: stripMinDF, stepStrip: stepStrip, rectMinR: rectMinR, stepRect: stepRect,
    fenske: fenske, underwoodBinary: underwoodBinary, molokanov: molokanov, oconnell: oconnell,
    csbFair: csbFair, holeFactor: holeFactor, interp: interp
  };
})(typeof window !== 'undefined' ? window : globalThis);
