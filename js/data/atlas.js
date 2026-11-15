/* The case on floor 3: a second synthetic sample, larger and less tidy than the pilot downstairs
   on floor 2. 258 cells: seven kinds, plus a few doublets that slipped past the filter. 178
   genes. It is run once through a fixed pipeline (normalise, variable genes, PCA, neighbour graph,
   layout) and then every station on the floor works on that graph: community detection with a
   resolution, marker statistics per cluster, and sub-clustering.
   The numbers are invented; the arithmetic is not. */
(function () {
'use strict';
const C = G.C, { layout, detect } = G.maths;

/* Which cells and which genes: the pack of the active cell system says (js/systems/<id>.who.js).
   It names eight kinds of cell, and each slot has a fixed job here, by position: every cell of
   slot RUNS runs the pack's programme at its own strength, some cells of slot PART are only part
   of the way there from slot FROM, and slot DBL is doublets, each a cell of slot 0 and a cell of
   slot FROM in one droplet. */
const RUNS = 1, FROM = 4, PART = 5, DBL = 7;
const cfg = Object.assign({ noise: 106, hvg: 100, pcs: 10, k: 10, ambient: 0.02, riboSd: 0.2, eff: 0.6, inter: 0.35, seed: 63 }, G.atlasCfg || {});
const N_NOISE = cfg.noise, N_HVG = cfg.hvg, N_PC = cfg.pcs, K = cfg.k, AMBIENT = cfg.ambient, RIBO_SD = cfg.riboSd;

/* turn goes up each time the sample is dropped for another project's, so that whoever kept
   something worked out from the old cells can tell that it is stale */
const atlas = G.atlas = { TYPES: [], REFS: {}, genes: [], gi: {}, cells: [], X: [], K, N_PC, turn: 0 };
/* cluster colours: the first eight are the final clusters, the rest are for splits that do not last */
/* neighbours on the map get colours that are easy to tell apart: slot FROM and slot PART end up amber and lilac */
atlas.COLS = [C.cyan, C.amber, C.orange, C.pink, C.mint, C.lilac, '#6f8ff0', C.coral, '#d8d06a', '#c96fd0', C.green, '#9aa6c2', C.teal, C.paper, '#8a5a3c', C.violet];
function gaussOf(rnd) { return () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) / 0.7071; }; }

/* the profile of one label of a reference, gene by gene: the average of some slots, a table of
   counts by gene name, or nothing at all */
const profile = (def, of) => def.map(!of ? () => 0 : Array.isArray(of) ? d => (d[1] === 'mark' ? of.reduce((s, t) => s + d[2 + t], 0) / of.length : 0) : d => of[d[0]] || 0);

/* the count matrix. The same seed always gives the same cells. */
atlas.build = function () {
  if (atlas.X.length) return;
  const W = G.sys.who, TYPES = atlas.TYPES = W.types, DEF = W.genes, prog = {}; W.programme.forEach(n => { prog[n] = 1; });
  Object.keys(W.refs).forEach(k => { const r = W.refs[k]; atlas.REFS[k] = { name: r.name, labels: r.labels, prof: r.like.map(of => profile(DEF, of)) }; });
  const rnd = G.rng(cfg.seed), gauss = gaussOf(rnd);
  const pois = lam => {
    if (lam > 30) return Math.max(0, Math.round(lam + Math.sqrt(lam) * gauss()));
    const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1;
  };
  const genes = DEF.map(d => ({ name: d[0], kind: d[1], mu: d.length > 3 ? d.slice(2) : [d[2], d[2], d[2], d[2], d[2], d[2], d[2]] }));
  for (let i = 1; i <= N_NOISE; i++) { const m = Math.exp(G.lerp(Math.log(1), Math.log(300), rnd())); genes.push({ name: 'GENE' + i, kind: 'noise', mu: [m, m, m, m, m, m, m] }); }
  genes.forEach(g => { g.mu.push(g.mu[0] + g.mu[FROM]); });
  atlas.genes = genes; atlas.gi = {}; genes.forEach((g, j) => { atlas.gi[g.name] = j; });
  TYPES.forEach((t, ti) => {
    for (let i = 0; i < t.n; i++) {
      /* a doublet carries two cells' worth of RNA, so its profile is the sum and its depth is not doubled again */
      const depth = Math.exp(0.5 * gauss()) * t.size * (ti === DBL ? 0.9 : 1), ribo = Math.exp(RIBO_SD * gauss()), mito = Math.exp(0.4 * gauss());
      /* cell types are not boxes. Each cell of one kind runs the programme at its own strength, and
         some cells of another are only part of the way there from their relatives. In blood these
         are the killing programme of CD8 T cells, and CD16 monocytes on the way from CD14 monocytes. */
      const eff = ti === RUNS ? G.clamp(Math.exp(cfg.eff * gauss()), 0.2, 2.5) : 1, mid = ti === PART ? Math.max(0, rnd() * 2 - 1) * 2 * cfg.inter : 0;
      const row = new Float32Array(genes.length);
      genes.forEach((g, j) => {
        let mu = g.mu[ti];
        if (ti === RUNS && prog[g.name]) mu *= eff;
        if (mid) mu = mu * (1 - mid) + g.mu[FROM] * mid;
        row[j] = pois(depth * (mu + AMBIENT) * (g.kind === 'ribo' ? ribo : g.kind === 'mito' ? mito : 1));
      });
      atlas.cells.push({ type: ti, total: row.reduce((a, b) => a + b, 0) });
      atlas.X.push(row);
    }
  });
};

/* ---------- the fixed pipeline: what floor 2 taught, done properly once ---------- */
let P = null;
atlas.prep = function () {
  if (P) return P;
  atlas.build();
  const cl = G.maths, X = atlas.X, n = X.length, ng = atlas.genes.length;
  const med = cl.median(atlas.cells.map(c => c.total));
  /* depth-normalised counts, and their logs */
  const D = X.map((row, i) => { const f = med / atlas.cells[i].total, o = new Float32Array(ng); for (let j = 0; j < ng; j++) o[j] = row[j] * f; return o; });
  const M = D.map(row => { const o = new Float32Array(ng); for (let j = 0; j < ng; j++) o[j] = Math.log1p(row[j]); return o; });
  /* variable genes: variance above what the mean predicts, ribosomal and mitochondrial genes left out */
  const st = [];
  for (let j = 0; j < ng; j++) {
    let s = 0, q = 0; for (let i = 0; i < n; i++) s += D[i][j];
    const mean = s / n; for (let i = 0; i < n; i++) q += (D[i][j] - mean) * (D[i][j] - mean);
    st.push({ j, lm: Math.log10(mean + 1e-9), lv: Math.log10(q / (n - 1) + 1e-9) });
  }
  const order = st.slice().sort((a, b) => a.lm - b.lm);
  order.forEach((g, k) => { g.res = g.lv - cl.median(order.slice(Math.max(0, k - 9), Math.min(order.length, k + 10)).map(o => o.lv)); });
  const hvg = st.filter(g => atlas.genes[g.j].kind !== 'ribo' && atlas.genes[g.j].kind !== 'mito').sort((a, b) => b.res - a.res).slice(0, N_HVG).map(g => g.j);
  const pc = cl.pca(M, hvg, N_PC, true), S = pc.S;
  /* each cell's K nearest cells across the components */
  const near = S.map((si, i) => {
    const d = [];
    for (let j = 0; j < n; j++) { if (j === i) continue; let q = 0; for (let c = 0; c < N_PC; c++) { const v = si[c] - S[j][c]; q += v * v; } d.push([q, j]); }
    d.sort((a, b) => a[0] - b[0]);
    return d.slice(0, K).map(v => v[1]);
  });
  /* the graph: a link wherever one cell lists the other, weighted by the share of neighbours the two have in common */
  const sets = near.map((ns, i) => { const s = {}; s[i] = 1; ns.forEach(j => { s[j] = 1; }); return s; });
  const seen = {}, links = [];
  for (let i = 0; i < n; i++) near[i].forEach(j => {
    const a = Math.min(i, j), b = Math.max(i, j), key = a * 1000 + b;
    if (seen[key]) return; seen[key] = 1;
    let both = 0; for (const k in sets[a]) if (sets[b][k]) both++;
    links.push([a, b, both / (2 * (K + 1) - both)]);
  });
  /* one layout of that graph, kept for the whole floor */
  const xy = layout(n, links, S);
  return (P = { n, D, M, hvg, S, near, links, xy, parts: {}, audits: {} });
};

/* another project: forget these cells and everything worked out from them */
atlas.reset = function () {
  atlas.TYPES = []; atlas.REFS = {}; atlas.genes = []; atlas.gi = {}; atlas.cells = []; atlas.X = []; atlas.turn++;
  P = null; fin = null; Object.keys(zooms).forEach(k => delete zooms[k]); Object.keys(opinions).forEach(k => delete opinions[k]);
};
atlas.cluster = function (res) {
  const p = atlas.prep(), key = res.toFixed(2);
  return p.parts[key] || (p.parts[key] = detect(p.n, p.links, res));
};
/* sub-clustering: the same detection on the links inside one group of cells */
atlas.sub = function (cells, res) {
  const p = atlas.prep(), at = {}; cells.forEach((c, i) => { at[c] = i; });
  const links = p.links.filter(l => at[l[0]] !== undefined && at[l[1]] !== undefined).map(l => [at[l[0]], at[l[1]], l[2]]);
  return detect(cells.length, links, res, 3);
};
atlas.members = function (part) { const out = Array.from({ length: part.k }, () => []); part.lab.forEach((c, i) => out[c].push(i)); return out; };

/* ---------- evidence ---------- */
/* AUC: the chance that a cell from group a shows more of the gene than a cell from group b. 0.5 is no difference. */
function auc(va, vb) {
  const b = Float32Array.from(vb).sort(); let s = 0;
  for (let i = 0; i < va.length; i++) {
    const x = va[i]; let lo = 0, hi = b.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (b[m] < x) lo = m + 1; else hi = m; }
    let up = lo; hi = b.length; while (up < hi) { const m = (up + hi) >> 1; if (b[m] <= x) up = m + 1; else hi = m; }
    s += lo + 0.5 * (up - lo);
  }
  return s / (va.length * b.length);
}
const column = (j, cells) => { const M = atlas.prep().M, v = new Float32Array(cells.length); for (let i = 0; i < cells.length; i++) v[i] = M[cells[i]][j]; return v; };
/* the genes that tell two groups of cells apart: nearly every cell of one group shows more than nearly every cell of the other */
atlas.apart = function (a, b) {
  const out = [];
  const D = atlas.prep().D;
  atlas.genes.forEach((g, j) => {
    if (g.kind === 'ribo' || g.kind === 'mito') return;
    /* the fold change is cheap, so it is checked first */
    let sa = 0, sb = 0; for (let i = 0; i < a.length; i++) sa += D[a[i]][j]; for (let i = 0; i < b.length; i++) sb += D[b[i]][j];
    const lfc = Math.log2((sa / a.length + 0.1) / (sb / b.length + 0.1));
    if (Math.abs(lfc) < LFC_MIN) return;
    const v = auc(column(j, a), column(j, b));
    if (v >= AUC_MIN || v <= 1 - AUC_MIN) out.push({ j, auc: v, lfc });
  });
  return out.sort((x, y) => Math.abs(y.auc - 0.5) - Math.abs(x.auc - 0.5));
};
/* one group against all other cells, gene by gene: detection inside and outside, AUC, fold change
   and a rank-sum p-value (with the correction for ties) */
atlas.markers = function (cells) {
  const p = atlas.prep(), inside = {}; cells.forEach(c => { inside[c] = 1; });
  const rest = []; for (let i = 0; i < p.n; i++) if (!inside[i]) rest.push(i);
  const n1 = cells.length, n2 = rest.length, N = n1 + n2;
  return atlas.genes.map((g, j) => {
    const a = column(j, cells), b = column(j, rest), v = auc(a, b);
    let ia = 0, ib = 0, sa = 0, sb = 0;
    a.forEach(x => { if (x > 0) ia++; sa += Math.expm1(x); }); b.forEach(x => { if (x > 0) ib++; sb += Math.expm1(x); });
    const all = Float32Array.from([...a, ...b]).sort(); let ties = 0;
    for (let i = 0; i < N;) { let k = i; while (k < N && all[k] === all[i]) k++; const t = k - i; ties += t * t * t - t; i = k; }
    const sd = Math.sqrt(n1 * n2 / 12 * (N + 1 - ties / (N * (N - 1)))) || 1, z = Math.abs(v * n1 * n2 - n1 * n2 / 2) / sd;
    /* log10 of the two-sided p-value, from the tail of the normal curve */
    const lp = z < 1 ? Math.log10(Math.max(1e-9, 1 - 0.68 * z)) : Math.log10(2) - z * z / (2 * Math.LN10) - Math.log10(z * Math.sqrt(2 * Math.PI));
    return { j, name: g.name, kind: g.kind, in: ia / n1, out: ib / n2, auc: v, lfc: Math.log2((sa / n1 + 0.05) / (sb / n2 + 0.05)), lp: Math.min(0, lp) };
  });
};

/* what a partition hides and what it invents:
   mixed: groups that split, when clustered on their own, into parts with genes of their own
   weak:  pairs of groups that no gene tells apart */
const NEED = 3, AUC_MIN = 0.85, LFC_MIN = 1.585, PART_MIN = 6;
/* zoom into one group of cells: cluster it again on its own links, at a few resolutions, and keep
   the cut that finds the most parts with genes of their own. Parts that no gene tells apart are
   put back together. */
const ZOOM = [0.2, 0.5, 1];
const zooms = {};
atlas.split = function (cells) {
  const key = cells.length + ':' + cells[0] + ':' + cells[cells.length - 1] + ':' + cells.reduce((a, b) => (a * 31 + b) % 1000003, 7);
  if (zooms[key]) return zooms[key];
  let best = { parts: [cells], genes: [] };
  if (cells.length >= 2 * PART_MIN) ZOOM.forEach(z => {
    const s = atlas.sub(cells, z), parts = atlas.members(s).map(m => m.map(i => cells[i])).filter(m => m.length >= PART_MIN);
    if (parts.length < 2) return;
    const root = parts.map((_, i) => i), find = i => { while (root[i] !== i) i = root[i]; return i; };
    let top = [];
    for (let a = 0; a < parts.length; a++) for (let b = a + 1; b < parts.length; b++) {
      const g = atlas.apart(parts[a], parts[b]);
      if (g.length < NEED) root[find(a)] = find(b); else if (g.length > top.length) top = g;
    }
    const by = {}; parts.forEach((m, i) => { const r = find(i); by[r] = (by[r] || []).concat(m); });
    const merged = Object.keys(by).map(r => by[r]).sort((x, y) => y.length - x.length);
    if (merged.length > best.parts.length) best = { parts: merged, genes: merged.length === 2 ? atlas.apart(merged[0], merged[1]) : top };
  });
  return (zooms[key] = best);
};
/* how many groups with genes of their own a set of cells holds */
atlas.groups = cells => atlas.split(cells).parts.length;
atlas.audit = function (res) {
  const p = atlas.prep(), key = res.toFixed(2);
  if (p.audits[key]) return p.audits[key];
  const part = atlas.cluster(res), mem = atlas.members(part), mixed = [], weak = []; let hidden = 0;
  mem.forEach((cells, c) => { const g = atlas.groups(cells); if (g > 1) { mixed.push(c); hidden += g - 1; } });
  for (let a = 0; a < part.k; a++) for (let b = a + 1; b < part.k; b++) {
    if (Math.min(mem[a].length, mem[b].length) < 3) continue;
    const g = atlas.apart(mem[a], mem[b]);
    if (g.length < NEED) weak.push([a, b, g.length]);
  }
  return (p.audits[key] = { part, mem, mixed, weak, hidden });
};
atlas.NEED = NEED;

/* ---------- the board the rest of the floor works on ---------- */
/* the dial at the Cut, and the cut every other station starts from: the finest setting that
   invents nothing, with the one cluster that still hides a group split by zooming in. Merging the
   one invented split at the next settings up gives the same eight clusters. */
atlas.DIAL = [0.05, 0.1, 0.2, 0.3, 0.5, 0.8, 1, 1.5, 2, 3];
let fin = null;
atlas.final = function () {
  if (fin) return fin;
  const a = atlas.audit(0.5), mem = [];
  a.mem.forEach((cells, c) => { if (a.mixed.indexOf(c) >= 0) atlas.split(cells).parts.forEach(q => mem.push(q)); else mem.push(cells); });
  mem.sort((x, y) => y.length - x.length || x[0] - y[0]);
  const lab = new Array(atlas.prep().n).fill(-1), of = [], role = {}, TYPES = atlas.TYPES;
  mem.forEach((cells, c) => {
    const cnt = TYPES.map(() => 0); cells.forEach(i => { lab[i] = c; cnt[atlas.cells[i].type]++; });
    const t = cnt.indexOf(Math.max.apply(null, cnt)); of.push(TYPES[t].id); role[TYPES[t].id] = c;
  });
  /* of: what each cluster really is, by the id of its cell type. role: the cluster of each cell type. dbl: the cluster of doublets. */
  return (fin = { mem, lab, k: mem.length, of, role, dbl: role[TYPES[DBL].id], stats: [] });
};
/* marker statistics of one final cluster against all other cells, by gene name */
atlas.stats = function (c) {
  const f = atlas.final();
  if (!f.stats[c]) { const by = {}; atlas.markers(f.mem[c]).forEach(g => { by[g.name] = g; }); f.stats[c] = by; }
  return f.stats[c];
};
/* RNA counted per cell in a cluster, relative to the whole sample (medians) */
atlas.depth = function (c) {
  const med = G.maths.median, f = atlas.final();
  return med(f.mem[c].map(i => atlas.cells[i].total)) / med(atlas.cells.map(x => x.total));
};

/* a colour for every cluster of a partition: the colour of the final cluster it shares most cells
   with, unless a bigger cluster of the same partition has taken it */
atlas.colours = function (mem) {
  const f = atlas.final(), taken = {}, out = []; let spare = f.k;
  mem.forEach((cells, c) => {
    const cnt = new Array(f.k).fill(0); cells.forEach(i => { if (f.lab[i] >= 0) cnt[f.lab[i]]++; });
    const best = cnt.indexOf(Math.max.apply(null, cnt));
    if (!taken[best]) { taken[best] = 1; out[c] = best; } else out[c] = spare++;
  });
  return out.map(i => atlas.COLS[i % atlas.COLS.length]);
};
/* where every cell sits when the map is drawn inside a rectangle */
atlas.place = function (x, y, w, h) {
  return atlas.prep().xy.map(q => [Math.round(x + q[0] * w), Math.round(y + q[1] * h)]);
};
/* things every station on the floor draws: the middle of a group of cells on a map, the box
   around it, corner marks on that box, and a share written as a percentage */
atlas.centre = function (pos, cells) { let x = 0, y = 0; cells.forEach(i => { x += pos[i][0]; y += pos[i][1]; }); return [Math.round(x / cells.length), Math.round(y / cells.length)]; };
atlas.box = function (pos, cells) { let x0 = 999, x1 = 0, y0 = 999, y1 = 0; cells.forEach(i => { x0 = Math.min(x0, pos[i][0]); x1 = Math.max(x1, pos[i][0]); y0 = Math.min(y0, pos[i][1]); y1 = Math.max(y1, pos[i][1]); }); return [x0 - 3, y0 - 3, x1 - x0 + 8, y1 - y0 + 8]; };
atlas.corners = function (b, c) { [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(k => { const x = b[0] + k[0] * b[2], y = b[1] + k[1] * b[3]; G.R(x - (k[0] ? 4 : 0), y, 5, 1, c); G.R(x, y - (k[1] ? 4 : 0), 1, 5, c); }); };
atlas.pc = v => Math.round(v * 100) + '%';
/* the doublets leave the board at the line-up. From then on the cluster is not named, not sent
   to the machine and not counted: this is its number, or -1 while it is still on the board. */
atlas.gone = () => (G.state.rooms.lineup.done ? atlas.final().dbl : -1);
atlas.GONE = '#46507a';

/* ---------- a second opinion from a reference ---------- */
/* Label transfer at its simplest: each cell gets the label of the reference profile it correlates
   with best (over the marker genes), and a cluster takes the label most of its cells got. The
   share of cells that agree is the confidence. A reference can only hand out the labels it has.
   The references are in the pack, under keys that name no tissue: far is from the wrong tissue,
   fit matches the sample but has a gap, broad has labels too coarse to help. Their profiles are
   worked out when the sample is built (see atlas.build). */
const opinions = {};
atlas.opinion = function (ref) {
  if (opinions[ref]) return opinions[ref];
  const p = atlas.prep(), f = atlas.final(), R = atlas.REFS[ref], cols = []; atlas.genes.forEach((g, j) => { if (g.kind === 'mark') cols.push(j); });
  const prof = R.prof.map(v => cols.map(j => Math.log1p(v[j])));
  const corr = (a, b) => { const n = a.length; let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n; let ab = 0, aa = 0, bb = 0; for (let i = 0; i < n; i++) { ab += (a[i] - ma) * (b[i] - mb); aa += (a[i] - ma) * (a[i] - ma); bb += (b[i] - mb) * (b[i] - mb); } return aa && bb ? ab / Math.sqrt(aa * bb) : -1; };
  return (opinions[ref] = f.mem.map(cells => {
    const votes = R.labels.map(() => 0);
    cells.forEach(i => { const v = cols.map(j => p.M[i][j]); let best = 0, bc = -2; prof.forEach((q, k) => { const c = corr(v, q); if (c > bc) { bc = c; best = k; } }); votes[best]++; });
    const top = votes.indexOf(Math.max.apply(null, votes));
    return { label: R.labels[top], share: votes[top] / cells.length };
  }));
};
})();
