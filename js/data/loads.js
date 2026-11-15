/* The washing on floor 4: the same kind of sample, run three times. Load A on Monday, load B on
   Thursday after the tubes had waited on the bench, and load C a month later. Each run leaves its
   own tint on every gene. Load B also holds a cell type that load A does not, and load C holds
   one that neither has (in blood: platelets, and plasma cells).
   Which cells and which genes: the pack of the active cell system says (js/systems/<id>.runs.js).
   Loads A and B are analysed together: variable genes chosen within each load, one PCA, and then
   Harmony (the 2019 algorithm, written out below) at whatever theta the player sets. Load C is
   mapped onto the result afterwards, in the manner of Symphony.
   The numbers are invented; the arithmetic is not. */
(function () {
'use strict';
const C = G.C;

const cfg = Object.assign({ noise: 80, hvg: 90, pcs: 10, k: 10, ambient: 0.02, tint: [0, 0.25, 0.3], stress: [1, 3.5, 1.6], stressMore: 1.6, depth: [1, 0.8, 0.9], seed: 11,
  clusters: 9, sigma: 0.1, ridge: 1, rounds: 20, passes: 5, kq: 5, res: 1 }, G.loadsCfg || {});
const N_PC = cfg.pcs, K = cfg.k;

/* TYPES: what the cells really are, and how many of each kind every load holds. The pack's table, taken when the matrix is built. */
const loads = G.loads = { TYPES: [], genes: [], cells: [], X: [], K, N_PC, cfg };
loads.NAMES = ['MONDAY', 'THURSDAY', 'NEW'];
loads.COLS = [C.cyan, C.amber, C.pink];
/* one colour for every kind of cell, wherever a map is coloured by kind */
loads.KIND = [C.cyan, '#6f8ff0', C.mint, C.orange, C.amber, C.coral, C.pink];
function gaussOf(rnd) { return () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) / 0.7071; }; }

/* the count matrix: loads A and B first (the reference), then load C (the query) */
loads.build = function () {
  if (loads.X.length) return;
  const pack = G.sys.runs, TYPES = loads.TYPES = pack.types, DEF = pack.genes;
  const rnd = G.rng(cfg.seed), gauss = gaussOf(rnd);
  const pois = lam => {
    if (lam > 30) return Math.max(0, Math.round(lam + Math.sqrt(lam) * gauss()));
    const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1;
  };
  const genes = DEF.map(d => ({ name: d[0], kind: d[1], mu: d.length > 3 ? d.slice(2) : TYPES.map(() => d[2]) }));
  for (let i = 1; i <= cfg.noise; i++) { const m = Math.exp(G.lerp(Math.log(1), Math.log(300), rnd())); genes.push({ name: 'GENE' + i, kind: 'noise', mu: TYPES.map(() => m) }); }
  loads.genes = genes; loads.gi = {}; genes.forEach((g, j) => { loads.gi[g.name] = j; });
  /* each run's tint: one factor per gene, the same for every kind of cell in that run */
  const tint = [0, 1, 2].map(b => genes.map(g => Math.exp(cfg.tint[b] * gauss()) * (g.kind === 'stress' ? cfg.stress[b] : 1)));
  for (let b = 0; b < 3; b++) TYPES.forEach((t, ti) => {
    for (let i = 0; i < t.n[b]; i++) {
      const depth = Math.exp(0.45 * gauss()) * t.size * cfg.depth[b];
      const row = new Float32Array(genes.length);
      genes.forEach((g, j) => {
        /* some cell types show a wait on the bench more than others: here, the kind the pack names */
        const extra = g.kind === 'stress' && ti === pack.bench && b === 1 ? cfg.stressMore : 1;
        row[j] = pois(depth * (g.mu[ti] + cfg.ambient) * tint[b][j] * extra);
      });
      loads.cells.push({ type: ti, load: b, total: row.reduce((a, c) => a + c, 0) });
      loads.X.push(row);
    }
  });
  loads.nRef = loads.cells.filter(c => c.load < 2).length;
};

/* ---------- the shared pipeline for loads A and B ---------- */
let P = null;
const sq = (a, b) => { let q = 0; for (let c = 0; c < a.length; c++) { const v = a[c] - b[c]; q += v * v; } return q; };
/* each row's K nearest rows (of `pool`, or of itself), and the links between them weighted by shared neighbours */
function nearest(S, k) {
  return S.map((si, i) => { const d = []; for (let j = 0; j < S.length; j++) if (j !== i) d.push([sq(si, S[j]), j]); d.sort((a, b) => a[0] - b[0]); return d.slice(0, k); });
}
function graph(near, k) {
  const n = near.length, sets = near.map((ns, i) => { const s = {}; s[i] = 1; ns.forEach(q => { s[q[1]] = 1; }); return s; });
  const seen = {}, links = [];
  for (let i = 0; i < n; i++) near[i].forEach(q => {
    const j = q[1], a = Math.min(i, j), b = Math.max(i, j), key = a * 1000 + b;
    if (seen[key]) return; seen[key] = 1;
    let both = 0; for (const c in sets[a]) if (sets[b][c]) both++;
    links.push([a, b, both / (2 * (k + 1) - both)]);
  });
  return links;
}
/* another project: forget these cells and everything worked out from them */
loads.reset = function () { loads.TYPES = []; loads.genes = []; loads.gi = {}; loads.cells = []; loads.X = []; loads.nRef = 0; P = null; ISL = null; Object.keys(MAPS).forEach(k => delete MAPS[k]); };
loads.prep = function () {
  if (P) return P;
  loads.build();
  const cl = G.maths, X = loads.X, n = X.length, nr = loads.nRef, ng = loads.genes.length;
  const med = cl.median(loads.cells.slice(0, nr).map(c => c.total));
  const D = X.map((row, i) => { const f = med / loads.cells[i].total, o = new Float32Array(ng); for (let j = 0; j < ng; j++) o[j] = row[j] * f; return o; });
  const M = D.map(row => { const o = new Float32Array(ng); for (let j = 0; j < ng; j++) o[j] = Math.log1p(row[j]); return o; });
  /* variable genes, ranked inside each load. A gene that only differs between the loads varies
     across the pooled cells and in neither load alone, so it is ranked low in both. */
  const rank = [0, 1].map(b => {
    const rows = []; for (let i = 0; i < nr; i++) if (loads.cells[i].load === b) rows.push(i);
    const st = [];
    for (let j = 0; j < ng; j++) {
      let s = 0, q = 0; rows.forEach(i => { s += D[i][j]; });
      const mean = s / rows.length; rows.forEach(i => { q += (D[i][j] - mean) * (D[i][j] - mean); });
      st.push({ j, lm: Math.log10(mean + 1e-9), lv: Math.log10(q / (rows.length - 1) + 1e-9) });
    }
    const order = st.slice().sort((a, c) => a.lm - c.lm);
    order.forEach((g, k) => { g.res = g.lv - cl.median(order.slice(Math.max(0, k - 9), Math.min(order.length, k + 10)).map(o => o.lv)); });
    const by = st.filter(g => loads.genes[g.j].kind !== 'ribo' && loads.genes[g.j].kind !== 'mito').sort((a, c) => c.res - a.res), r = {};
    by.forEach((g, k) => { r[g.j] = k; });
    return r;
  });
  /* genes that both loads rank in their top list come first, then the best-ranked of the rest */
  const cand = Object.keys(rank[0]).map(j => ({ j: +j, both: (rank[0][j] < cfg.hvg ? 1 : 0) + (rank[1][j] < cfg.hvg ? 1 : 0), best: Math.min(rank[0][j], rank[1][j]) }));
  const hvg = cand.sort((a, c) => c.both - a.both || a.best - c.best).slice(0, cfg.hvg).map(g => g.j);
  const pc = cl.pca(M.slice(0, nr), hvg, N_PC, true);
  const lab = loads.cells.slice(0, nr).map(c => c.load);
  return (P = { n, nr, D, M, hvg, pc, S: pc.S, lab, runs: {}, maps: {} });
};

/* ---------- Harmony ---------- */
/* Korsunsky et al. 2019. Two steps, repeated:
   1. soft clustering of the cells in PCA space, where a cluster that holds more than its share of
      one load becomes less attractive to cells of that load. theta sets how much less.
   2. inside every cluster, a ridge regression estimates each load's offset, and every cell has the
      offsets of its load subtracted, weighted by how much it belongs to each cluster.
   The components are corrected; the counts are never touched. */
function unit(S) { return S.map(r => { let q = 0; for (let c = 0; c < r.length; c++) q += r[c] * r[c]; q = Math.sqrt(q) || 1; return Array.from(r, v => v / q); }); }
function seeds(U, k, rnd) {
  /* the tightest of a few k-means starts, as the reference implementations do */
  let best = null, bi = Infinity;
  for (let s = 0; s < 8; s++) {
    const y = kmeans(U, k, rnd); let inertia = 0;
    U.forEach(u => { let bd = Infinity; y.forEach(c => { bd = Math.min(bd, sq(u, c)); }); inertia += bd; });
    if (inertia < bi - 1e-9) { bi = inertia; best = y; }
  }
  return best;
}
function kmeans(U, k, rnd) {
  /* k-means++ : each new centre is drawn with odds in proportion to its squared distance from the centres so far */
  const n = U.length, out = [U[Math.floor(rnd() * n)].slice()], d = U.map(u => sq(u, out[0]));
  while (out.length < k) {
    let tot = 0; d.forEach(v => { tot += v; });
    let r = rnd() * tot, pick = 0; for (let i = 0; i < n; i++) { r -= d[i]; if (r <= 0) { pick = i; break; } }
    out.push(U[pick].slice()); U.forEach((u, i) => { d[i] = Math.min(d[i], sq(u, out[out.length - 1])); });
  }
  for (let it = 0; it < 25; it++) {
    const sum = out.map(() => new Float64Array(U[0].length));
    U.forEach(u => { let best = 0, bd = Infinity; out.forEach((y, c) => { const q = sq(u, y); if (q < bd) { bd = q; best = c; } }); for (let c = 0; c < u.length; c++) sum[best][c] += u[c]; });
    sum.forEach((s, c) => { let q = 0; s.forEach(v => { q += v * v; }); if (q) out[c] = Array.from(s, v => v / Math.sqrt(q)); });
  }
  return out;
}
function harmony(S, lab, theta, o) {
  const n = S.length, d = S[0].length, k = o.clusters, B = Math.max.apply(null, lab) + 1, sigma = o.sigma, rnd = G.rng(o.seedH || 4466);
  const share = new Float64Array(B); lab.forEach(b => { share[b] += 1 / n; });
  let Z = S.map(r => Array.from(r)), U = unit(Z);
  let Y = seeds(U, k, rnd);
  const R = Array.from({ length: n }, () => new Float64Array(k)), O = Array.from({ length: k }, () => new Float64Array(B)), E = Array.from({ length: k }, () => new Float64Array(B));
  const dist = (u, y) => { let s = 0; for (let c = 0; c < d; c++) s += u[c] * y[c]; return 2 * (1 - s); };
  const assign = (i, pen) => {
    let tot = 0; const r = R[i];
    for (let c = 0; c < k; c++) { r[c] = Math.exp(-dist(U[i], Y[c]) / sigma) * (pen ? Math.pow((E[c][lab[i]] + 1) / (O[c][lab[i]] + 1), theta) : 1); tot += r[c]; }
    for (let c = 0; c < k; c++) r[c] /= tot || 1;
  };
  const count = () => {
    for (let c = 0; c < k; c++) { O[c].fill(0); let m = 0; for (let i = 0; i < n; i++) { O[c][lab[i]] += R[i][c]; m += R[i][c]; } for (let b = 0; b < B; b++) E[c][b] = m * share[b]; }
  };
  for (let i = 0; i < n; i++) assign(i, false);
  count();
  let rounds = 0, moved = 0;
  const order = Array.from({ length: n }, (_, i) => i);
  for (let round = 0; round < o.rounds; round++) {
    /* step 1: cluster, a block of cells at a time, each block against counts that leave it out */
    for (let pass = 0; pass < o.passes; pass++) {
      Y = Y.map((_, c) => { const s = new Float64Array(d); for (let i = 0; i < n; i++) for (let a = 0; a < d; a++) s[a] += R[i][c] * U[i][a]; let q = 0; s.forEach(v => { q += v * v; }); q = Math.sqrt(q) || 1; return Array.from(s, v => v / q); });
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
      const size = Math.max(1, Math.round(n * 0.05));
      for (let at = 0; at < n; at += size) {
        const block = order.slice(at, at + size);
        block.forEach(i => { for (let c = 0; c < k; c++) { O[c][lab[i]] -= R[i][c]; for (let b = 0; b < B; b++) E[c][b] -= R[i][c] * share[b]; } });
        block.forEach(i => assign(i, true));
        block.forEach(i => { for (let c = 0; c < k; c++) { O[c][lab[i]] += R[i][c]; for (let b = 0; b < B; b++) E[c][b] += R[i][c] * share[b]; } });
      }
    }
    /* step 2: in each cluster, fit  component = centre + offset of the load  with the cells' memberships as weights */
    const next = S.map(r => Array.from(r));
    for (let c = 0; c < k; c++) {
      /* the design is an intercept and one column per load, so the weighted normal equations are small */
      const A = Array.from({ length: B + 1 }, () => new Float64Array(B + 1)), rhs = Array.from({ length: B + 1 }, () => new Float64Array(d));
      for (let i = 0; i < n; i++) {
        const w = R[i][c], b = lab[i] + 1;
        A[0][0] += w; A[0][b] += w; A[b][0] += w; A[b][b] += w;
        for (let a = 0; a < d; a++) { rhs[0][a] += w * S[i][a]; rhs[b][a] += w * S[i][a]; }
      }
      for (let b = 1; b <= B; b++) A[b][b] += o.ridge;
      const W = solve(A, rhs);
      for (let i = 0; i < n; i++) { const w = R[i][c], off = W[lab[i] + 1]; for (let a = 0; a < d; a++) next[i][a] -= w * off[a]; }
    }
    moved = 0; for (let i = 0; i < n; i++) moved = Math.max(moved, Math.sqrt(sq(next[i], Z[i])));
    Z = next; U = unit(Z); rounds = round + 1;
    if (moved < 0.02) break;
  }
  return { Z, R, Y, rounds, converged: moved < 0.02 };
}
/* Gaussian elimination for a handful of unknowns and several right-hand sides */
function solve(A, rhs) {
  const m = A.length, M = A.map(r => Array.from(r)), X = rhs.map(r => Array.from(r));
  for (let c = 0; c < m; c++) {
    let p = c; for (let r = c + 1; r < m; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]]; [X[c], X[p]] = [X[p], X[c]];
    const piv = M[c][c] || 1e-12;
    for (let r = 0; r < m; r++) {
      if (r === c) continue; const f = M[r][c] / piv; if (!f) continue;
      for (let q = c; q < m; q++) M[r][q] -= f * M[c][q];
      for (let q = 0; q < X[r].length; q++) X[r][q] -= f * X[c][q];
    }
  }
  return X.map((r, i) => r.map(v => v / (M[i][i] || 1e-12)));
}
loads.harmony = harmony;

/* the dial at the Wash. null is no wash at all. */
loads.DIAL = [0, 0.5, 1, 2, 4, 8, 16];
/* one wash: the corrected components, their neighbours, and what the neighbours say */
loads.run = function (theta) {
  const p = loads.prep(), key = theta === null ? 'raw' : String(theta);
  if (p.runs[key]) return p.runs[key];
  const h = theta === null ? { Z: p.S.map(r => Array.from(r)), rounds: 0, converged: true } : harmony(p.S, p.lab, theta, cfg);
  const near = nearest(h.Z, K), nr = p.nr;
  const shareOf = [0, 1].map(b => p.lab.filter(x => x === b).length / nr);
  /* mixed: how many of a cell's neighbours come from the other load, against how many would if load made no difference */
  let mix = 0; const pure = loads.TYPES.map(() => [0, 0]);
  for (let i = 0; i < nr; i++) {
    let other = 0, same = 0; near[i].forEach(q => { if (p.lab[q[1]] !== p.lab[i]) other++; if (loads.cells[q[1]].type === loads.cells[i].type) same++; });
    mix += Math.min(1, other / K / shareOf[1 - p.lab[i]]);
    const t = loads.cells[i].type; pure[t][0] += same / K; pure[t][1]++;
  }
  const kept = pure.map(v => (v[1] ? v[0] / v[1] : 1));
  /* lone: how far the cells that only one load holds still have neighbours of their own kind */
  return (p.runs[key] = Object.assign(h, { theta, near, mix: mix / nr, kept, lone: kept[G.sys.runs.lone.slot] }));
};
/* the map of one wash. Every map starts from the same two components, so the islands keep their places. */
loads.map = function (theta) {
  const p = loads.prep(), key = theta === null ? 'raw' : String(theta);
  if (p.maps[key]) return p.maps[key];
  const r = loads.run(theta), links = graph(r.near, K);
  return (p.maps[key] = G.maths.layout(p.nr, links, r.Z, cfg.lay));
};

/* ---------- the islands of the unwashed map ---------- */
/* Before any correction the map is clustered as it stands. Each island gets the genes that set it
   apart from the rest of its own load, and a profile: its mean expression of every variable gene,
   minus the mean of its own load. Subtracting the load's mean takes the load's tint with it, so
   profiles from different loads can be compared. Two islands are partners when each is the
   other's best match. */
let ISL = null;
loads.islands = function () {
  if (ISL) return ISL;
  const p = loads.prep(), raw = loads.run(null), part = G.maths.detect(p.nr, graph(raw.near, K), cfg.res), mem = [];
  part.lab.forEach((c, i) => { (mem[c] = mem[c] || []).push(i); });
  const ofLoad = [0, 1].map(b => { const v = []; for (let i = 0; i < p.nr; i++) if (p.lab[i] === b) v.push(i); return v; });
  const mean = (cells, j) => { let s = 0; cells.forEach(i => { s += p.M[i][j]; }); return s / cells.length; };
  const base = ofLoad.map(cells => p.hvg.map(j => mean(cells, j)));
  const isl = mem.map((cells, c) => {
    const cnt = [0, 0], kind = loads.TYPES.map(() => 0); cells.forEach(i => { cnt[p.lab[i]]++; kind[loads.cells[i].type]++; });
    const load = cnt[1] > cnt[0] ? 1 : 0, inside = {}; cells.forEach(i => { inside[i] = 1; });
    const rest = ofLoad[load].filter(i => !inside[i]);
    /* marker genes: detected in most of the island, and higher than in the rest of the load */
    const genes = [];
    loads.genes.forEach((g, j) => {
      if (g.kind === 'ribo' || g.kind === 'mito') return;
      let ia = 0, ib = 0, sa = 0, sb = 0; cells.forEach(i => { if (p.M[i][j] > 0) ia++; sa += p.D[i][j]; }); rest.forEach(i => { if (p.M[i][j] > 0) ib++; sb += p.D[i][j]; });
      const lfc = Math.log2((sa / cells.length + 0.1) / (sb / rest.length + 0.1));
      if (ia / cells.length >= 0.6 && lfc >= 1) genes.push({ j, name: g.name, in: ia / cells.length, out: ib / rest.length, lfc, score: (ia / cells.length - ib / rest.length) * Math.min(4, lfc) });
    });
    genes.sort((a, b) => b.score - a.score);
    const centre = new Float64Array(N_PC); cells.forEach(i => { for (let a = 0; a < N_PC; a++) centre[a] += p.S[i][a] / cells.length; });
    return { id: c, cells, load, pure: cnt[load] / cells.length, kind: kind.indexOf(Math.max.apply(null, kind)), genes: genes.slice(0, 6), prof: p.hvg.map((j, k) => mean(cells, j) - base[load][k]), centre };
  });
  const corr = (a, b) => { const n = a.length; let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n; let ab = 0, aa = 0, bb = 0; for (let i = 0; i < n; i++) { ab += (a[i] - ma) * (b[i] - mb); aa += (a[i] - ma) * (a[i] - ma); bb += (b[i] - mb) * (b[i] - mb); } return aa && bb ? ab / Math.sqrt(aa * bb) : 0; };
  isl.forEach(a => { a.best = -1; a.sim = -2; isl.forEach(b => { if (b.load === a.load) return; const r = corr(a.prof, b.prof); if (r > a.sim) { a.sim = r; a.best = b.id; } }); });
  isl.forEach(a => { a.partner = isl[a.best].best === a.id && a.sim > 0.4 ? a.best : -1; });
  /* how far and which way each pair sits apart, in the components */
  const pairs = isl.filter(a => a.load === 0 && a.partner >= 0).map(a => { const b = isl[a.partner], v = Array.from(a.centre, (x, k) => b.centre[k] - x); return { a: a.id, b: b.id, v, len: Math.sqrt(v.reduce((q, x) => q + x * x, 0)) }; });
  const m = new Float64Array(N_PC); pairs.forEach(q => q.v.forEach((x, k) => { m[k] += x / pairs.length; }));
  const ml = Math.sqrt(m.reduce((q, x) => q + x * x, 0)) || 1;
  pairs.forEach(q => { q.cos = q.v.reduce((s, x, k) => s + x * m[k], 0) / (q.len * ml); });
  return (ISL = { isl, pairs, k: isl.length, agree: pairs.reduce((s, q) => s + q.cos, 0) / (pairs.length || 1) });
};

/* ---------- a new load, mapped onto the washed reference ---------- */
/* In the manner of Symphony (Kang et al. 2021). The new cells are put through the reference's
   gene scaling and components, given memberships of the reference's Harmony clusters, and have
   their own offset removed cluster by cluster, while the reference stays exactly where it is.
   Each new cell then takes the label most of its nearest reference cells carry. */
const MAPS = {};
loads.mapTo = function (theta) {
  if (MAPS[theta]) return MAPS[theta];
  const p = loads.prep(), ref = loads.run(theta), nr = p.nr, pc = p.pc, d = N_PC, k = ref.Y.length;
  const q = []; for (let i = nr; i < p.n; i++) q.push(i);
  const S = q.map(i => { const z = pc.cols.map((c, j) => Math.max(-10, Math.min(10, (p.M[i][c] - pc.mu[j]) / pc.sd[j]))); return pc.vecs.map(v => { let s = 0; for (let j = 0; j < z.length; j++) s += z[j] * v[j]; return s; }); });
  const U = unit(S);
  const R = U.map(u => { const r = ref.Y.map(y => { let s = 0; for (let c = 0; c < d; c++) s += u[c] * y[c]; return Math.exp(-2 * (1 - s) / cfg.sigma); }); const t = r.reduce((a, b) => a + b, 0) || 1; return r.map(v => v / t); });
  const Z = S.map(r => Array.from(r));
  for (let c = 0; c < k; c++) {
    /* the reference fixes the cluster's centre; the new load gets one offset */
    let nref = 0, nq = 0; const cref = new Float64Array(d), cq = new Float64Array(d);
    for (let i = 0; i < nr; i++) { const w = ref.R[i][c]; nref += w; for (let a = 0; a < d; a++) cref[a] += w * ref.Z[i][a]; }
    S.forEach((s, i) => { const w = R[i][c]; nq += w; for (let a = 0; a < d; a++) cq[a] += w * s[a]; });
    const W = solve([[nref + nq, nq], [nq, nq + cfg.ridge]], [Array.from(cref, (v, a) => v + cq[a]), Array.from(cq)]);
    S.forEach((s, i) => { for (let a = 0; a < d; a++) Z[i][a] -= R[i][c] * W[1][a]; });
  }
  /* the reference's own spacing: how far each reference cell is from its nearest neighbour */
  const own = ref.near.map(ns => Math.sqrt(ns[0][0])).sort((a, b) => a - b);
  const xy = loads.map(theta);
  const cells = q.map((i, at) => {
    const dd = []; for (let j = 0; j < nr; j++) dd.push([sq(Z[at], ref.Z[j]), j]);
    dd.sort((a, b) => a[0] - b[0]);
    const nb = dd.slice(0, cfg.kq), votes = {}; let tot = 0, x = 0, y = 0;
    nb.forEach(v => { const w = 1 / (Math.sqrt(v[0]) + 0.05), t = loads.cells[v[1]].type; votes[t] = (votes[t] || 0) + w; tot += w; x += w * xy[v[1]][0]; y += w * xy[v[1]][1]; });
    const top = Object.keys(votes).sort((a, b) => votes[b] - votes[a])[0], dist = Math.sqrt(nb[0][0]);
    let below = 0; while (below < own.length && own[below] < dist) below++;
    return { i, type: loads.cells[i].type, label: +top, share: votes[top] / tot, dist, pct: below / own.length, xy: [x / tot, y / tot], nb: nb.map(v => v[1]) };
  });
  /* does a new cell show the gene its label is known by? */
  cells.forEach(c => { c.lit = loads.X[c.i][loads.gi[loads.TYPES[c.label].mark]] > 0; });
  return (MAPS[theta] = { cells });
};
/* what a group of new cells carries that the reference cells with their label do not */
loads.differ = function (group, label) {
  const p = loads.prep(), ref = []; for (let i = 0; i < p.nr; i++) if (loads.cells[i].type === label) ref.push(i);
  const out = [];
  loads.genes.forEach((g, j) => {
    if (g.kind !== 'mark') return;
    let a = 0, b = 0, sa = 0, sb = 0; group.forEach(i => { if (loads.X[i][j] > 0) a++; sa += p.D[i][j]; }); ref.forEach(i => { if (loads.X[i][j] > 0) b++; sb += p.D[i][j]; });
    const lfc = Math.log2((sa / group.length + 0.1) / (sb / ref.length + 0.1));
    if (a / group.length >= 0.6 && b / ref.length <= 0.15) out.push({ j, name: g.name, in: a / group.length, out: b / ref.length, lfc });
  });
  return out.sort((x, y) => y.lfc - x.lfc);
};

/* the wash every later station works on: the player's own if it passed, or the default */
loads.theta = () => (G.state.laundry && G.state.laundry.theta) || 2;
/* is a wash good enough to take out? The runs must share their islands, and the cells only one run holds keep theirs. */
loads.MIX_MIN = 0.7; loads.KEEP_MIN = 0.8;
loads.verdict = function (theta) { const r = loads.run(theta); return { mix: r.mix, lone: r.lone, under: r.mix < loads.MIX_MIN, over: r.lone < loads.KEEP_MIN }; };
/* where every reference cell sits when a map is drawn inside a rectangle */
loads.place = function (theta, x, y, w, h) { return loads.map(theta).map(q => [Math.round(x + q[0] * w), Math.round(y + q[1] * h)]); };
loads.pc = v => Math.round(v * 100) + '%';
})();
