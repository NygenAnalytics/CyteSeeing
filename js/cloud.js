/* The Cloud: one small synthetic count matrix, and the maths that floor 2 runs on it.
   174 cells of five kinds, 207 genes, most of them noise. Every station on the floor applies a real step to this matrix
   (normalise, pick genes, PCA, neighbours), so a choice in one room changes what the next one sees.
   The numbers are invented; the arithmetic is not. */
(function () {
'use strict';
const C = G.C;

const TYPES = [
  { id: 'T', name: 'T CELLS', n: 60, col: C.cyan, size: 0.95 }, { id: 'NK', name: 'NK CELLS', n: 26, col: C.mint, size: 1 },
  { id: 'B', name: 'B CELLS', n: 34, col: C.lilac, size: 0.95 }, { id: 'MONO', name: 'MONOCYTES', n: 46, col: C.amber, size: 1.1 },
  { id: 'DC', name: 'DENDRITIC', n: 8, col: C.pink, size: 1.05 },
];
/* name, kind, then the mean count in T, NK, B, monocytes and dendritic cells at average depth */
const DEF = [
  ['ACTB', 'house', 600], ['MALAT1', 'house', 800], ['B2M', 'house', 500], ['EEF1A1', 'house', 400],
  ['TMSB4X', 'house', 450], ['FTL', 'house', 300], ['TPT1', 'house', 350], ['GAPDH', 'house', 250],
  ['RPL13', 'ribo', 400], ['RPS27', 'ribo', 450], ['RPLP1', 'ribo', 350], ['RPS12', 'ribo', 300], ['MT-CO1', 'ribo', 250], ['MT-ND1', 'ribo', 200],
  ['IL32', 'mark', 60, 55, 0, 0, 0], ['CD7', 'mark', 50, 55, 0, 0, 0], ['CD2', 'mark', 50, 45, 0, 0, 0], ['CCL5', 'mark', 40, 55, 0, 0, 0], ['CTSW', 'mark', 30, 45, 0, 0, 0],
  ['CD3E', 'mark', 25, 0, 0, 0, 0], ['CD3D', 'mark', 20, 0, 0, 0, 0], ['IL7R', 'mark', 20, 0, 0, 0, 0], ['TRAC', 'mark', 25, 0, 0, 0, 0], ['LTB', 'mark', 15, 0, 30, 0, 0],
  ['NKG7', 'mark', 5, 35, 0, 0, 0], ['GNLY', 'mark', 3, 40, 0, 0, 0], ['KLRD1', 'mark', 2, 15, 0, 0, 0], ['PRF1', 'mark', 3, 15, 0, 0, 0],
  ['MS4A1', 'mark', 0, 0, 60, 0, 0], ['CD79A', 'mark', 0, 0, 70, 0, 0], ['CD79B', 'mark', 0, 0, 50, 0, 0], ['CD74', 'mark', 5, 5, 120, 80, 85],
  ['HLA-DRA', 'mark', 3, 3, 100, 80, 85], ['IGHM', 'mark', 0, 0, 60, 0, 0], ['BANK1', 'mark', 0, 0, 30, 0, 0],
  ['LYZ', 'mark', 2, 2, 2, 140, 115], ['S100A8', 'mark', 1, 1, 1, 120, 95], ['S100A9', 'mark', 1, 1, 1, 140, 110], ['CD14', 'mark', 0, 0, 0, 50, 38],
  ['FCN1', 'mark', 0, 0, 0, 60, 46], ['CST3', 'mark', 2, 2, 5, 100, 100], ['TYROBP', 'mark', 5, 50, 2, 80, 70], ['AIF1', 'mark', 2, 2, 2, 60, 55],
  ['FCER1A', 'rare', 0, 0, 0, 0, 16], ['CLEC10A', 'rare', 0, 0, 0, 0, 12], ['CD1C', 'rare', 0, 0, 0, 0, 10], ['ENHO', 'rare', 0, 0, 0, 0, 8],
];

const cloud = G.cloud = { TYPES, genes: [], cells: [], X: [] };

function gaussOf(rnd) { return () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) / 0.7071; }; }
const median = v => { const s = Array.from(v).sort((a, b) => a - b), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
cloud.median = median;

/* build the matrix once; the same seed always gives the same cells */
cloud.build = function () {
  if (cloud.X.length) return;
  const rnd = G.rng(2024), gauss = gaussOf(rnd);
  const pois = lam => {
    if (lam > 30) return Math.max(0, Math.round(lam + Math.sqrt(lam) * gauss()));
    const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1;
  };
  const genes = DEF.map(d => ({ name: d[0], kind: d[1], mu: d.length > 3 ? d.slice(2) : [d[2], d[2], d[2], d[2], d[2]] }));
  for (let i = 1; i <= 160; i++) { const m = Math.exp(G.lerp(Math.log(1), Math.log(300), rnd())); genes.push({ name: 'GENE' + i, kind: 'noise', mu: [m, m, m, m, m] }); }
  cloud.genes = genes;
  TYPES.forEach((t, ti) => {
    for (let i = 0; i < t.n; i++) {
      const depth = Math.exp(0.55 * gauss()) * t.size, ribo = Math.exp(0.45 * gauss());
      const row = new Float32Array(genes.length);
      genes.forEach((g, j) => { row[j] = pois(depth * (g.mu[ti] + 0.5) * (g.kind === 'ribo' ? ribo : 1)); });
      cloud.cells.push({ type: ti, depth, ribo, total: row.reduce((a, b) => a + b, 0) });
      cloud.X.push(row);
    }
  });
};

/* depth: divide each cell by its total and scale to the median total. log: log(1 + x). */
cloud.normalise = function (o) {
  const med = median(cloud.cells.map(c => c.total));
  return cloud.X.map((row, i) => {
    const out = new Float32Array(row.length), f = o.depth ? med / cloud.cells[i].total : 1;
    for (let j = 0; j < row.length; j++) { const v = row[j] * f; out[j] = o.log ? Math.log1p(v) : v; }
    return out;
  });
};

/* per gene: mean and variance of depth-normalised counts, the variance expected from the mean
   alone (a running median along the mean axis), and how far the gene sits above that trend */
cloud.geneStats = function () {
  const M = cloud.normalise({ depth: true, log: false }), n = M.length, G_ = cloud.genes.length, st = [];
  for (let j = 0; j < G_; j++) {
    let s = 0, q = 0; for (let i = 0; i < n; i++) s += M[i][j];
    const mean = s / n; for (let i = 0; i < n; i++) q += (M[i][j] - mean) * (M[i][j] - mean);
    st.push({ j, mean, v: q / (n - 1), lm: Math.log10(mean + 1e-9), lv: Math.log10(q / (n - 1) + 1e-9) });
  }
  const order = st.slice().sort((a, b) => a.lm - b.lm);
  order.forEach((g, k) => {
    const w = order.slice(Math.max(0, k - 9), Math.min(order.length, k + 10)).map(o => o.lv);
    g.trend = median(w); g.res = g.lv - g.trend;
  });
  /* the score used to rank genes: standardise each gene by the spread its mean predicts, clip
     extreme values, and take the variance of what is left (the idea behind Seurat's "vst").
     Clipping is why a marker of a rare population scores lower than a marker of a common one. */
  const clip = Math.sqrt(n);
  st.forEach(g => {
    const sd = Math.sqrt(Math.pow(10, g.trend)); let q = 0;
    for (let i = 0; i < n; i++) { const z = Math.max(-clip, Math.min(clip, (M[i][g.j] - g.mean) / sd)); q += z * z; }
    g.score = q / (n - 1); g.ls = Math.log10(g.score + 1e-9);
  });
  return st;
};
/* method 'raw' ranks by variance, 'trend' by variance above the trend; block drops nuisance genes */
cloud.pick = function (st, method, n, block) {
  return st.filter(g => !(block && cloud.genes[g.j].kind === 'ribo'))
    .sort((a, b) => (method === 'raw' ? b.lv - a.lv : b.score - a.score)).slice(0, n).map(g => g.j);
};

/* PCA by power iteration on the covariance of the chosen genes. scale: give each gene unit variance first. */
cloud.pca = function (M, cols, k, scale) {
  const n = M.length, g = cols.length, Z = [];
  const mu = new Float64Array(g), sd = new Float64Array(g);
  cols.forEach((c, j) => { let s = 0; for (let i = 0; i < n; i++) s += M[i][c]; mu[j] = s / n; let q = 0; for (let i = 0; i < n; i++) q += (M[i][c] - mu[j]) * (M[i][c] - mu[j]); sd[j] = Math.sqrt(q / (n - 1)) || 1; });
  for (let i = 0; i < n; i++) { const r = new Float64Array(g); for (let j = 0; j < g; j++) { let z = M[i][cols[j]] - mu[j]; if (scale) z = Math.max(-10, Math.min(10, z / sd[j])); r[j] = z; } Z.push(r); }
  const cov = []; let tot = 0;
  for (let a = 0; a < g; a++) { cov.push(new Float64Array(g)); }
  for (let a = 0; a < g; a++) for (let b = a; b < g; b++) { let s = 0; for (let i = 0; i < n; i++) s += Z[i][a] * Z[i][b]; cov[a][b] = cov[b][a] = s / (n - 1); }
  for (let a = 0; a < g; a++) tot += cov[a][a];
  const rnd = G.rng(7), vecs = [], ev = [];
  k = Math.min(k, g);
  for (let c = 0; c < k; c++) {
    let v = new Float64Array(g); for (let j = 0; j < g; j++) v[j] = rnd() - 0.5;
    let lam = 0;
    for (let it = 0; it < 120; it++) {
      const w = new Float64Array(g);
      for (let a = 0; a < g; a++) { let s = 0; for (let b = 0; b < g; b++) s += cov[a][b] * v[b]; w[a] = s; }
      vecs.forEach(u => { let d = 0; for (let j = 0; j < g; j++) d += w[j] * u[j]; for (let j = 0; j < g; j++) w[j] -= d * u[j]; });
      let nrm = 0; for (let j = 0; j < g; j++) nrm += w[j] * w[j]; nrm = Math.sqrt(nrm) || 1;
      for (let j = 0; j < g; j++) w[j] /= nrm;
      lam = nrm; v = w;
    }
    vecs.push(v); ev.push(lam);
  }
  const S = Z.map(r => vecs.map(v => { let s = 0; for (let j = 0; j < g; j++) s += r[j] * v[j]; return s; }));
  return { S, ev, tot, vecs, cols };
};

/* for each kind of cell: the share of a cell's nearest neighbours, in the first `dims` components, that are its own kind */
cloud.purity = function (S, dims, kn) {
  const n = S.length, by = TYPES.map(() => [0, 0]); kn = kn || 5;
  for (let i = 0; i < n; i++) {
    const d = [];
    for (let j = 0; j < n; j++) { if (j === i) continue; let s = 0; for (let c = 0; c < dims; c++) { const q = S[i][c] - S[j][c]; s += q * q; } d.push([s, cloud.cells[j].type]); }
    d.sort((a, b) => a[0] - b[0]);
    let same = 0; for (let k = 0; k < kn; k++) if (d[k][1] === cloud.cells[i].type) same++;
    by[cloud.cells[i].type][0] += same / kn; by[cloud.cells[i].type][1]++;
  }
  const out = by.map(b => b[0] / b[1]);
  return { by: out, min: Math.min.apply(null, out), mean: out.reduce((a, b) => a + b, 0) / out.length };
};
/* squared correlation: how much of one list of numbers another explains */
cloud.r2 = function (a, b) {
  const n = a.length; let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n;
  let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) * (a[i] - ma); sbb += (b[i] - mb) * (b[i] - mb); }
  return saa && sbb ? sab * sab / (saa * sbb) : 0;
};

/* the player's pipeline so far, with sensible defaults where a station has not been played */
cloud.settings = function () {
  const s = G.state.cloud || {};
  return { depth: s.depth !== false, log: s.log !== false, method: s.method || 'trend', n: s.n || 40, block: s.block !== false, dims: s.dims || 6,
    k: s.k || 6, seed: s.seed || 1, pack: s.pack || 'loose' };
};

/* ---------- from components to neighbours to a map ---------- */
/* the components the later stations work on: a PCA of the picked genes, kept until the gene list changes */
let emb = null;
cloud.scores = function () {
  cloud.build();
  const o = cloud.settings(), key = [o.method, o.n, o.block].join('|');
  if (!emb || emb.key !== key) {
    const M = cloud.normalise({ depth: true, log: true }), cols = cloud.pick(cloud.geneStats(), o.method, o.n, o.block), pc = cloud.pca(M, cols, 12, true);
    emb = { key, S: pc.S, ev: pc.ev, tot: pc.tot, cols, M, order: {} };
  }
  return emb;
};
/* for every cell, the other cells from nearest to furthest (the first 45), measured across the first `dims` components */
cloud.nearest = function (dims) {
  const e = cloud.scores(), S = e.S, n = S.length; dims = Math.min(dims, S[0].length);
  if (!e.order[dims]) {
    e.order[dims] = S.map((si, i) => {
      const d = [];
      for (let j = 0; j < n; j++) { if (j === i) continue; let q = 0; for (let c = 0; c < dims; c++) { const v = si[c] - S[j][c]; q += v * v; } d.push([q, j]); }
      d.sort((a, b) => a[0] - b[0]);
      return d.slice(0, 45).map(v => v[1]);
    });
  }
  return e.order[dims];
};
/* the web: every cell linked to its k nearest. Returns the links once each, and what they say about the cells. */
cloud.web = function (k, dims) {
  const near = cloud.nearest(dims), n = near.length, type = cloud.cells.map(c => c.type), seen = {}, links = [];
  let cross = 0; const own = TYPES.map(() => [0, 0]);
  for (let i = 0; i < n; i++) for (let q = 0; q < k; q++) {
    const j = near[i][q], key = i < j ? i * 1000 + j : j * 1000 + i;
    own[type[i]][1]++; if (type[j] === type[i]) own[type[i]][0]++;
    if (!seen[key]) { seen[key] = true; links.push([i, j]); if (type[i] !== type[j]) cross++; }
  }
  /* how many pieces each kind is in, counting only links between cells of that kind */
  const root = Array.from({ length: n }, (_, i) => i), find = i => { while (root[i] !== i) { root[i] = root[root[i]]; i = root[i]; } return i; };
  links.forEach(l => { if (type[l[0]] === type[l[1]]) root[find(l[0])] = find(l[1]); });
  const pieces = TYPES.map(() => 0), size = {}, main = TYPES.map(() => -1);
  for (let i = 0; i < n; i++) { const r = find(i); size[r] = (size[r] || 0) + 1; if (r === i) pieces[type[i]]++; }
  for (let i = 0; i < n; i++) { const r = find(i), t = type[i]; if (main[t] < 0 || size[r] > size[main[t]]) main[t] = r; }
  /* loose: cut off from the main body of its own kind */
  const loose = []; for (let i = 0; i < n; i++) loose.push(find(i) !== main[type[i]]);
  return { k, links, cross: cross / links.length, own: own.map(o => o[0] / o[1]), pieces, loose };
};

/* A force layout of the web: linked cells pull together, cells that get close push apart.
   The idea behind UMAP, with none of its care. Start positions come from the seed. */
cloud.layout = function (links, n, seed, pack) {
  const rnd = G.rng(seed * 7919 + 13), P = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 9; P[2 * i] = Math.cos(a) * r; P[2 * i + 1] = Math.sin(a) * r; }
  return { P, links, n, it: 0, total: 260, push: pack === 'tight' ? 0.35 : 1 };
};
/* the same web and the same seed always give the same map */
cloud.map = function (o) {
  const w = cloud.web(o.k, o.dims), L = cloud.layout(w.links, cloud.cells.length, o.seed, o.pack);
  cloud.layoutStep(L, 9999);
  return L.P;
};
cloud.layoutStep = function (L, steps) {
  const P = L.P, n = L.n;
  for (let s = 0; s < steps && L.it < L.total; s++, L.it++) {
    /* the push comes in gradually, so that linked cells find each other before they are held apart */
    const lr = 1 - L.it / L.total, pull = 0.14 * (0.35 + 0.65 * lr), push = 0.5 * lr * L.push * Math.min(1, L.it / (L.total * 0.5));
    L.links.forEach(l => {
      const a = 2 * l[0], b = 2 * l[1], dx = (P[b] - P[a]) * pull, dy = (P[b + 1] - P[a + 1]) * pull;
      P[a] += dx; P[a + 1] += dy; P[b] -= dx; P[b + 1] -= dy;
    });
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = P[2 * i] - P[2 * j], dy = P[2 * i + 1] - P[2 * j + 1], d2 = dx * dx + dy * dy;
      if (d2 > 9) continue;
      const f = Math.min(0.6, push / (d2 + 0.05)), fx = (dx || 0.01) * f, fy = (dy || 0.01) * f;
      P[2 * i] += fx; P[2 * i + 1] += fy; P[2 * j] -= fx; P[2 * j + 1] -= fy;
    }
  }
  return L.it >= L.total;
};
})();
