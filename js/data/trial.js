/* The trial behind stage 5: twelve patients, six of whom responded, each sampled before and after
   a treatment. Five cell types in every sample. What the samples hold is generated here from a
   fixed seed, and everything a station shows is worked out from it: the t-tests of the Scales,
   the least-squares fits of the Formula bench, the p-values and the Benjamini-Hochberg cut of the
   Stairs, the shares and the pump of the Census.
   Which cells and which genes: the pack of the active cell system says (js/systems/<id>.changes.js).
   Planted, and nothing else: one cell type expands in responders after treatment and raises a few
   genes; a set of genes rises in one cell type in everyone after treatment; one gene is carried by
   a few donors only; one donor gave a very large sample and has one gene of their own; one gene
   is higher in responders at both visits. Every other gene is noise.
   The numbers are invented; the arithmetic is not. */
(function () {
'use strict';

const N = 12, HALF = 6;
const cfg = Object.assign({
  seedComp: 269, seedCells: 1, seedMono: 826, seedCd8: 17,
  cells: 380, sizeSd: 0.16, big: 5,          /* cells in a sample, how much that varies, and how many times more the large sample holds */
  donorSd: 0.2, visitSd: 0.06, foldSd: 0.08,  /* cell-type shares: between donors, between a donor's visits, and in how far the expansion varies */
  depthSd: 0.4, rateSd: 0.25,                 /* per cell: sequencing depth. Per donor: how far a gene's level strays from its group's */
  between: 0.8, within: 0.3, genes: 200,      /* pseudobulks, on the log2 scale: spread between donors, noise within a donor, and how many genes are tested */
  tol: 0.02, alpha: 0.05,                     /* when the pumped jar counts as a match, and the mark a single claim has to pass */
}, G.trialCfg || {});

const trial = G.trial = { N, HALF, cfg, TOL: cfg.tol, ALPHA: cfg.alpha };
/* the twelve donors: the first six responded. Their numbers in the clinic's list are mixed, as a clinic's are.
   big: the donor who gave the very large sample. runs: each donor's two samples were sequenced together, in one of four runs. */
const NAMES = [2, 3, 5, 8, 9, 12, 1, 4, 6, 7, 10, 11], BIG = 2, RUNS = [0, 1, 2, 3, 0, 2, 1, 3, 0, 1, 2, 3];
trial.RATES = [0.01, 0.05, 0.1, 0.2];
trial.RULES = ['plain', 'bonf', 'bh'];
/* the pump of the Census: a cell type's count goes up or down a quarter of a doubling at a time */
trial.STEP = 4; trial.REACH = 12;

/* ================= statistics ================= */
function gammaln(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, t = x + 5.5, s = 1.000000000190015;
  t -= (x + 0.5) * Math.log(t);
  for (let j = 0; j < 6; j++) s += c[j] / ++y;
  return -t + Math.log(2.5066282746310005 * s / x);
}
/* the continued fraction of the incomplete beta function (Lentz's method) */
function betacf(a, b, x) {
  const tiny = 1e-300, qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < tiny) d = tiny; d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny; c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny; d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny; c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny; d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < 3e-14) break;
  }
  return h;
}
function ibeta(a, b, x) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
}
/* the two-sided p-value of a t statistic, and the t that leaves a given share in the two tails */
const pt = trial.pt = (t, df) => (isFinite(t) ? ibeta(df / 2, 0.5, df / (df + t * t)) : 0);
const qt = trial.qt = (p, df) => { let lo = 0, hi = 200; for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (pt(mid, df) > p) lo = mid; else hi = mid; } return (lo + hi) / 2; };
/* Welch's t-test from each side's count, sum and sum of squares */
function welch(a, b) {
  const ma = a.s / a.n, mb = b.s / b.n, va = Math.max(0, (a.q - a.n * ma * ma) / (a.n - 1)), vb = Math.max(0, (b.q - b.n * mb * mb) / (b.n - 1));
  const ea = va / a.n, eb = vb / b.n, se = Math.sqrt(ea + eb), diff = ma - mb;
  if (!(se > 0)) return { t: 0, df: a.n + b.n - 2, p: 1, diff, n: [a.n, b.n] };
  const t = diff / se, df = (ea + eb) * (ea + eb) / (ea * ea / (a.n - 1) + eb * eb / (b.n - 1));
  return { t, df, p: pt(t, df), diff, n: [a.n, b.n] };
}
const sums = v => { let s = 0, q = 0; for (let i = 0; i < v.length; i++) { s += v[i]; q += v[i] * v[i]; } return { n: v.length, s, q }; };
trial.welch = (x, y) => welch(sums(x), sums(y));
/* a t-test of whether the mean of some differences is zero, with its 95% interval */
function oneSample(d) {
  const n = d.length, m = d.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(d.reduce((a, b) => a + (b - m) * (b - m), 0) / (n - 1)), se = sd / Math.sqrt(n);
  const t = se > 0 ? m / se : 0, half = qt(0.05, n - 1) * se;
  return { mean: m, sd, t, df: n - 1, p: se > 0 ? pt(t, n - 1) : 1, lo: m - half, hi: m + half };
}
trial.oneSample = oneSample;

/* ================= the data ================= */
let D = null, CACHE = {};
function gaussOf(rnd) { return () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) / 0.7071; }; }
function poisOf(rnd, gauss) {
  return lam => {
    if (lam > 30) return Math.max(0, Math.round(lam + Math.sqrt(lam) * gauss()));
    const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1;
  };
}
/* another project: forget the patients and everything worked out from them */
trial.reset = function () { D = null; CACHE = {}; };
trial.build = function () {
  if (D) return D;
  const pack = G.sys.changes, T = pack.types, K = T.length;
  const donors = NAMES.map((num, i) => ({ i, name: 'P' + num, resp: i < HALF, run: RUNS[i], big: i === BIG, carrier: pack.carried.donors.indexOf(i) >= 0 }));

  /* ---- how many cells of each type every sample holds ---- */
  let rnd = G.rng(cfg.seedComp), gauss = gaussOf(rnd);
  const n = [], counts = [], shares = [];
  donors.forEach(d => {
    const own = T.map(t => Math.log(t.share) + cfg.donorSd * gauss());
    const size = Math.round(cfg.cells * Math.exp(cfg.sizeSd * gauss())) * (d.big ? cfg.big : 1);
    n.push([]); counts.push([]); shares.push([]);
    for (let v = 0; v < 2; v++) {
      const a = own.map(x => x + cfg.visitSd * gauss());
      /* the planted change: in responders, after treatment, one cell type multiplies. A sample is still a fixed number of cells. */
      if (d.resp && v === 1) a[pack.grows.type] += Math.log(pack.grows.fold) + cfg.foldSd * gauss();
      const w = a.map(Math.exp), tot = w.reduce((s, x) => s + x, 0), c = new Array(K).fill(0);
      const m = Math.round(size * Math.exp(0.05 * gauss()));
      for (let i = 0; i < m; i++) { let r = rnd() * tot, k = 0; while (k < K - 1 && r > w[k]) { r -= w[k]; k++; } c[k]++; }
      n[d.i].push(m); counts[d.i].push(c); shares[d.i].push(c.map(x => x / m));
    }
  });

  /* ---- the Scales: three genes, cell by cell, in one cell type after treatment ---- */
  rnd = G.rng(cfg.seedCells); gauss = gaussOf(rnd); let pois = poisOf(rnd, gauss);
  const cells = pack.scales.claims.map(cl => donors.map(d => {
    const m = counts[d.i][1][pack.scales.type];
    /* the gene's mean count per cell in this donor: by genotype, by response, or this donor's own */
    const group = cl.kind === 'carried' ? (d.carrier ? 0 : 1) : cl.kind === 'own' ? (d.big ? 0 : 1) : (d.resp ? 0 : 1);
    const rate = cl.rate[group] * (cl.kind === 'carried' ? 1 : Math.exp(cfg.rateSd * gauss()));
    const x = new Float32Array(m); let s = 0, q = 0, sc = 0, sd = 0, lit = 0;
    for (let i = 0; i < m; i++) {
      const depth = Math.exp(cfg.depthSd * gauss()), c = pois(depth * rate), v = Math.log1p(c / depth);
      x[i] = v; s += v; q += v * v; sc += c; sd += depth; if (c > 0) lit++;
    }
    /* the bag: every count of the donor's cells summed, over all their depth. One number for one donor. */
    return { d: d.i, n: m, x, s, q, lit, level: sc / sd, bag: Math.log1p(sc / sd) };
  }));

  /* ---- pseudobulks: log2 level of every tested gene in one cell type, per donor and visit ---- */
  rnd = G.rng(cfg.seedMono); gauss = gaussOf(rnd);
  const wave = pack.wave, mono = { type: wave.type, genes: [], Y: [] };
  const push = (set, name, base, between, within, fx, real) => {
    const y = new Float32Array(2 * N);
    donors.forEach(d => { const u = between * gauss(); for (let v = 0; v < 2; v++) y[2 * d.i + v] = base + u + fx(d, v) + within * gauss(); });
    set.genes.push({ name, real: !!real }); set.Y.push(y);
  };
  wave.genes.forEach(g => push(mono, g[0], 4 + 4 * rnd(), g[2] || cfg.between, cfg.within, (d, v) => (v ? g[1] : 0), true));
  /* a gene a donor carries or not does not change between that donor's visits */
  wave.still.forEach(name => push(mono, name, 4 + 5 * rnd(), name === pack.carried.gene ? 0.3 : cfg.between * (0.6 + 0.8 * rnd()), cfg.within * (0.8 + 0.5 * rnd()), d => (name === pack.carried.gene ? (d.carrier ? 4 : 0) : 0), false));
  for (let i = 1; mono.genes.length < cfg.genes; i++) push(mono, 'GENE' + i, 2 + 7 * rnd(), cfg.between * (0.5 + rnd()), cfg.within * (0.8 + 0.5 * rnd()), () => 0, false);
  mono.gi = {}; mono.genes.forEach((g, j) => { mono.gi[g.name] = j; });

  rnd = G.rng(cfg.seedCd8); gauss = gaussOf(rnd);
  const cd8 = { type: pack.rise.type, genes: [], Y: [] };
  /* rising in responders only, after treatment; and one gene that is simply higher in responders, at both visits */
  pack.rise.genes.forEach(g => push(cd8, g[0], g[1], g[3] || 0.5, cfg.within, (d, v) => (d.resp && v ? g[2] : 0), true));
  push(cd8, pack.stand.gene, pack.stand.level, 0.45, cfg.within, d => (d.resp ? pack.stand.gap : 0), false);
  cd8.gi = {}; cd8.genes.forEach((g, j) => { cd8.gi[g.name] = j; });

  return (D = { donors, n, counts, shares, cells, mono, cd8, K });
};
trial.donors = () => trial.build().donors;

/* ================= 5-1, the Scales ================= */
/* One claim: is the gene higher in responders? `bagged` says which donors' cells have been bagged.
   A bagged donor counts once, at the level of all their cells together; a donor not yet bagged
   counts once for every cell. With nothing bagged this is the test that takes cells for patients;
   with everything bagged it is a test of six donors against six. */
trial.heaps = k => trial.build().cells[k];
trial.weigh = function (k, bagged) {
  const side = [{ n: 0, s: 0, q: 0 }, { n: 0, s: 0, q: 0 }];
  trial.heaps(k).forEach(h => {
    const a = side[h.d < HALF ? 0 : 1];
    if (bagged && bagged[h.d]) { a.n++; a.s += h.bag; a.q += h.bag * h.bag; } else { a.n += h.n; a.s += h.s; a.q += h.q; }
  });
  return welch(side[0], side[1]);
};
const ALL = new Array(N).fill(true);
/* what the donors say, and so whether the claim holds */
trial.claim = k => { const t = trial.weigh(k, ALL); return { cells: trial.weigh(k, null), donors: t, holds: t.p < cfg.alpha && t.diff > 0 }; };

/* ================= 5-2, the Formula bench ================= */
/* The terms a formula can hold, and the columns each one adds to the model matrix. A row is one
   sample: donor d at visit v (0 before, 1 after). */
trial.TERMS = ['donor', 'visit', 'response', 'vr', 'run'];
const COLS = {
  donor: () => { const c = []; for (let k = 1; k < N; k++) c.push((d, v) => (d === k ? 1 : 0)); return c; },
  visit: () => [(d, v) => v],
  response: () => [d => (d < HALF ? 1 : 0)],
  vr: () => [(d, v) => (d < HALF ? v : 0)],
  run: () => [1, 2, 3].map(r => d => (RUNS[d] === r ? 1 : 0)),
};
function matrix(terms) {
  const cols = [{ term: null, f: () => 1 }];
  trial.TERMS.forEach(t => { if (terms.indexOf(t) >= 0) COLS[t]().forEach(f => cols.push({ term: t, f })); });
  const X = []; for (let d = 0; d < N; d++) for (let v = 0; v < 2; v++) X.push(cols.map(c => c.f(d, v)));
  return { X, cols };
}
/* how many of a matrix's columns say something the columns before them do not (Gram-Schmidt) */
function basis(X) {
  const n = X.length, p = X[0].length, Q = [];
  for (let j = 0; j < p; j++) {
    const v = new Float64Array(n); let len = 0;
    for (let i = 0; i < n; i++) { v[i] = X[i][j]; len += v[i] * v[i]; }
    Q.forEach(q => { let dot = 0; for (let i = 0; i < n; i++) dot += q[i] * v[i]; for (let i = 0; i < n; i++) v[i] -= dot * q[i]; });
    Q.forEach(q => { let dot = 0; for (let i = 0; i < n; i++) dot += q[i] * v[i]; for (let i = 0; i < n; i++) v[i] -= dot * q[i]; });
    let rest = 0; for (let i = 0; i < n; i++) rest += v[i] * v[i];
    if (rest > 1e-9 * (len || 1)) { const r = Math.sqrt(rest); for (let i = 0; i < n; i++) v[i] /= r; Q.push(v); }
  }
  return Q;
}
const rankOf = terms => basis(matrix(terms).X).length;
/* the inverse of a small symmetric matrix, by Gauss-Jordan elimination */
function invert(A) {
  const m = A.length, M = A.map((r, i) => r.concat(r.map((_, j) => (i === j ? 1 : 0))));
  for (let c = 0; c < m; c++) {
    let p = c; for (let r = c + 1; r < m; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c]; for (let q = 0; q < 2 * m; q++) M[c][q] /= piv;
    for (let r = 0; r < m; r++) { if (r === c) continue; const f = M[r][c]; if (f) for (let q = 0; q < 2 * m; q++) M[r][q] -= f * M[c][q]; }
  }
  return M.map(r => r.slice(m));
}
/* the samples of one gene in one cell type, in the order of the model matrix */
trial.series = function (set, gene) { const s = trial.build()[set]; return s.Y[s.gi[gene]]; };
/* Fit a formula to one gene by least squares. jam: the matrix is not of full rank, and `extra` lists
   the terms that add nothing to the others. Otherwise: what is left unexplained, and for every term
   that is one column its estimate, 95% interval and p-value. */
trial.fit = function (set, gene, terms) {
  const key = set + '|' + gene + '|' + trial.TERMS.filter(t => terms.indexOf(t) >= 0).join('+');
  if (CACHE[key]) return CACHE[key];
  const y = trial.series(set, gene), { X, cols } = matrix(terms), n = X.length, p = cols.length, rank = basis(X).length;
  let mean = 0; for (let i = 0; i < n; i++) mean += y[i] / n;
  let tss = 0; for (let i = 0; i < n; i++) tss += (y[i] - mean) * (y[i] - mean);
  const out = { terms: terms.slice(), cols: p, rank, jam: rank < p, extra: [], tss, mean };
  if (out.jam) { terms.forEach(t => { if (rankOf(terms.filter(o => o !== t)) === rank) out.extra.push(t); }); return (CACHE[key] = out); }
  const XtX = cols.map((_, a) => cols.map((__, b) => { let s = 0; for (let i = 0; i < n; i++) s += X[i][a] * X[i][b]; return s; }));
  const inv = invert(XtX), Xty = cols.map((_, a) => { let s = 0; for (let i = 0; i < n; i++) s += X[i][a] * y[i]; return s; });
  const beta = inv.map(r => r.reduce((s, v, j) => s + v * Xty[j], 0));
  const fitted = X.map(r => r.reduce((s, v, j) => s + v * beta[j], 0));
  let rss = 0; for (let i = 0; i < n; i++) rss += (y[i] - fitted[i]) * (y[i] - fitted[i]);
  const df = n - p, s2 = rss / df, tcrit = qt(0.05, df);
  out.rss = rss; out.df = df; out.left = rss / tss; out.fitted = fitted; out.fx = {};
  cols.forEach((c, j) => {
    if (!c.term || c.term === 'donor' || c.term === 'run') return;
    const se = Math.sqrt(s2 * inv[j][j]), t = beta[j] / se;
    out.fx[c.term] = { est: beta[j], se, t, p: pt(t, df), lo: beta[j] - tcrit * se, hi: beta[j] + tcrit * se, clear: pt(t, df) < cfg.alpha };
  });
  return (CACHE[key] = out);
};

/* ================= 5-3, the Stairs ================= */
/* Every gene tested on the donors, each against their own baseline: the test of `visit` in
   ~ donor + visit, which is a paired t-test. Sorted by p-value, smallest first. */
trial.stairs = function () {
  if (CACHE.stairs) return CACHE.stairs;
  const m = trial.build().mono, steps = m.genes.map((g, j) => {
    const y = m.Y[j], d = []; for (let i = 0; i < N; i++) d.push(y[2 * i + 1] - y[2 * i]);
    const t = oneSample(d); return { name: g.name, real: g.real, p: t.p, lfc: t.mean };
  }).sort((a, b) => a.p - b.p);
  return (CACHE.stairs = { steps, m: steps.length, real: steps.filter(s => s.real).length });
};
/* Where a rule draws its line at a given rate, and how many steps are under it.
   plain: p at most the rate. bonf: p at most the rate divided by the number of genes.
   bh (Benjamini and Hochberg 1995): the last step k with p at most k times rate over the number
   of genes, and every step before it. `chance` is how many steps would be under the line if no
   gene had changed at all. */
trial.rule = function (kind, rate) {
  const st = trial.stairs(), m = st.m, p = st.steps;
  let cut = kind === 'plain' ? rate : rate / m, lit = 0;
  if (kind === 'bh') { for (let k = m; k >= 1; k--) if (p[k - 1].p <= k * rate / m) { lit = k; break; } cut = lit * rate / m; }
  else while (lit < m && p[lit].p <= cut) lit++;
  let real = 0; for (let i = 0; i < lit; i++) if (p[i].real) real++;
  return { kind, rate, cut, lit, chance: m * cut, real, wrong: lit - real, kept: real / st.real, share: lit ? (lit - real) / lit : 0 };
};
/* the two things a rule is judged on: at most one false alarm in twenty, and at least two thirds of what is real */
trial.WRONG_MAX = 0.05; trial.KEPT_MIN = 2 / 3;
trial.judge = function (kind, rate) { const r = trial.rule(kind, rate); return Object.assign(r, { clean: r.share <= trial.WRONG_MAX + 1e-9, full: r.kept >= trial.KEPT_MIN - 1e-9 }); };

/* ================= 5-4, the Census ================= */
/* the average share of every cell type, by group (0 responders, 1 the others) and visit */
trial.jars = function () {
  if (CACHE.jars) return CACHE.jars;
  const dd = trial.build(), K = dd.K, mean = [0, 1].map(g => [0, 1].map(v => { const s = new Array(K).fill(0); dd.donors.forEach(d => { if ((d.resp ? 0 : 1) === g) dd.shares[d.i][v].forEach((x, k) => { s[k] += x / HALF; }); }); return s; }));
  return (CACHE.jars = { mean, donors: dd.shares, K });
};
/* A copy of the responders' "before" jar, after each cell type's count is multiplied by 2 to the
   power of (its steps over STEP). The jar is refilled to the same size, so every share moves. */
trial.pump = function (steps) {
  const base = trial.jars().mean[0][0], w = base.map((s, k) => s * Math.pow(2, steps[k] / trial.STEP)), tot = w.reduce((a, b) => a + b, 0);
  return w.map(x => x / tot);
};
/* how far the copy is from the "after" jar: the largest difference in any one share */
trial.gap = function (steps) { const c = trial.pump(steps), want = trial.jars().mean[0][1]; let g = 0; c.forEach((x, k) => { g = Math.max(g, Math.abs(x - want[k])); }); return g; };
/* the best that pumping one cell type alone can do */
trial.single = function () {
  if (CACHE.single) return CACHE.single;
  const K = trial.jars().K, out = [];
  for (let k = 0; k < K; k++) { let best = null; for (let s = -trial.REACH; s <= trial.REACH; s++) { const st = new Array(K).fill(0); st[k] = s; const g = trial.gap(st); if (!best || g < best.gap) best = { k, steps: s, gap: g }; } out.push(best); }
  return (CACHE.single = out);
};
/* The ledger: every cell type's count against a reference cell type, after over before, donor by
   donor in the responders (as a log2 ratio, tested against no change). */
trial.ledger = function (ref) {
  if (CACHE['led' + ref]) return CACHE['led' + ref];
  const dd = trial.build(), rows = [];
  for (let k = 0; k < dd.K; k++) {
    if (k === ref) { rows.push({ k, ref: true, mean: 0, lo: 0, hi: 0, p: 1, changed: false }); continue; }
    const d = []; dd.donors.forEach(o => { if (!o.resp) return; const c = dd.counts[o.i]; d.push(Math.log2(((c[1][k] + 0.5) / (c[1][ref] + 0.5)) / ((c[0][k] + 0.5) / (c[0][ref] + 0.5)))); });
    const t = oneSample(d); rows.push({ k, ref: false, mean: t.mean, lo: t.lo, hi: t.hi, p: t.p, changed: t.p < cfg.alpha && Math.abs(t.mean) >= 0.5 });
  }
  return (CACHE['led' + ref] = rows);
};
/* the cell types one pump has to move: those no reference can be */
trial.moved = () => { const one = trial.single().filter(s => s.gap <= cfg.tol); return one.map(s => s.k); };
/* the same change in the donors who did not respond, for whoever claims it for every patient */
trial.others = function (k, ref) {
  const dd = trial.build(), d = []; dd.donors.forEach(o => { if (o.resp) return; const c = dd.counts[o.i]; d.push(Math.log2(((c[1][k] + 0.5) / (c[1][ref] + 0.5)) / ((c[0][k] + 0.5) / (c[0][ref] + 0.5)))); });
  return oneSample(d);
};
trial.pc = v => Math.round(v * 100) + '%';
})();
