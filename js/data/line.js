/* The line behind stage 5 of the cortex project: one tissue, sampled at three ages. Every sample
   is a snapshot that holds cells at many points of one process, from stem cell to settled neuron.
   What the samples hold is generated here from a fixed seed, and everything a station shows is
   worked out from it: the neighbour graph, the pseudotime from a root (the distance through the
   graph from the root cells), the links between groups of cells counted against chance (as PAGA
   does), the smoothed curve of a gene along pseudotime, and where the cells of each sample sit.
   Which cells and which genes: the pack of the active cell system says (js/systems/<id>.order.js).
   It names six states, and each slot has a fixed job here, by position: slots 0 to 3 are the line,
   in order; slot 4 is a spur off slot 0; slot 5 is apart, linked to nothing.
   Every cell of the line has a hidden position along the process, and its genes follow smooth
   curves of that position, with noise. The stations never see the position.
   The numbers are invented; the arithmetic is not. */
(function () {
'use strict';

const LINE = 4, SPUR = 4, APART = 5;
const cfg = Object.assign({
  seed: 63, depthSd: 0.3, ambient: 0.03, pcs: 8, k: 10,
  rootN: 5,                                  /* how many cells make a root */
  mark: 0.05,                                /* a test wagon crosses where the links come to this share of what chance would give */
  stops: 35, spans: [0, 0.01, 0.03, 0.15, 0.3], lit: 0.5,     /* the timetable: stops along the line, the notches of the lever, and when a lamp counts as lit */
  bins: 12,                                  /* lamps along an order, at the turntable */
  window: 0.15,                              /* the length of a marked stretch, at the clock */
}, G.lineCfg || {});

const line = G.lineage = { cfg, LINE, SPUR, APART, MARK: cfg.mark, STOPS: cfg.stops, SPANS: cfg.spans, BINS: cfg.bins };
let D = null, CACHE = {};
function gaussOf(rnd) { return () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) / 0.7071; }; }
const sig = x => 1 / (1 + Math.exp(-x));
/* another project: forget the cells and everything worked out from them */
line.reset = function () { D = null; CACHE = {}; };

/* ================= the cells ================= */
/* the mean count of a gene in a cell of the line at position u */
function level(g, u, dividing) {
  switch (g.shape) {
    case 'fall': return g.amp * sig((g.c - u) / g.w);
    case 'rise': return g.amp * sig((u - g.c) / g.w);
    case 'bump': return g.amp * Math.exp(-0.5 * (u - g.c) * (u - g.c) / (g.w * g.w));
    case 'cycle': return dividing ? g.amp : g.amp * 0.06;
    case 'house': return g.amp;
  }
  return 0;
}
line.build = function () {
  if (D) return D;
  const P = G.sys.order, ST = P.states, rnd = G.rng(cfg.seed), gauss = gaussOf(rnd);
  const pois = lam => {
    if (lam > 30) return Math.max(0, Math.round(lam + Math.sqrt(lam) * gauss()));
    const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1;
  };
  const genes = P.genes.map(d => {
    const s = d[1];
    if (s === 'house') return { name: d[0], shape: s, amp: d[2], opc: d[2], inh: d[2] };
    if (s === 'cycle') return { name: d[0], shape: s, amp: d[2], opc: d[3], inh: d[4] };
    if (s === 'off') return { name: d[0], shape: s, amp: 0, opc: d[2], inh: d[3] };
    return { name: d[0], shape: s, c: d[2], w: d[3], amp: d[4], opc: d[5], inh: d[6] };
  });
  const gi = {}; genes.forEach((g, j) => { gi[g.name] = j; });
  const cells = [], X = [];
  const add = (c, mean) => { const depth = Math.exp(cfg.depthSd * gauss()), row = new Float32Array(genes.length); let tot = 0; genes.forEach((g, j) => { row[j] = pois(depth * (mean(g) + cfg.ambient)); tot += row[j]; }); c.total = tot; cells.push(c); X.push(row); };
  P.samples.forEach((sm, s) => {
    /* the line: a state by the sample's mix, then a position inside the state's stretch */
    for (let i = 0; i < sm.n; i++) {
      let r = rnd(), t = 0; while (t < LINE - 1 && r > sm.mix[t]) { r -= sm.mix[t]; t++; }
      let span = ST[t].span;
      if (t === 0 && rnd() < P.crowd.share) span = P.crowd.span;
      const u = span[0] + rnd() * (span[1] - span[0]), dividing = t < 2 && rnd() < P.dividing[t];
      add({ type: t, sample: s, u, dividing }, g => level(g, u, dividing));
    }
    /* the spur: cells part of the way from the line to a state of their own, more of them near the line than far from it */
    for (let i = 0; i < sm.spur; i++) { const v = P.spur.reach[0] + Math.pow(rnd(), 1.5) * (P.spur.reach[1] - P.spur.reach[0]); add({ type: SPUR, sample: s, v }, g => (1 - v) * level(g, P.spur.from, false) + v * g.opc); }
    /* and the cells that came from elsewhere */
    for (let i = 0; i < sm.apart; i++) add({ type: APART, sample: s }, g => g.inh);
  });
  const n = cells.length, med = G.maths.median(cells.map(c => c.total));
  const M = X.map((row, i) => { const f = med / cells[i].total, o = new Float32Array(genes.length); for (let j = 0; j < genes.length; j++) o[j] = Math.log1p(row[j] * f); return o; });
  /* the components, from every gene that is not the same in all cells; then each cell's nearest cells */
  const cols = []; genes.forEach((g, j) => { if (g.shape !== 'house') cols.push(j); });
  const pc = G.maths.pca(M, cols, cfg.pcs, true), S = pc.S;
  const sq = (a, b) => { let q = 0; for (let c = 0; c < a.length; c++) { const v = a[c] - b[c]; q += v * v; } return q; };
  const near = S.map((si, i) => { const d = []; for (let j = 0; j < n; j++) if (j !== i) d.push([sq(si, S[j]), j]); d.sort((a, b) => a[0] - b[0]); return d.slice(0, cfg.k); });
  /* the neighbour graph: two cells are linked when either is among the other's nearest. A link is as long as the cells are far apart. */
  const adj = Array.from({ length: n }, () => []), seen = {}, links = [];
  near.forEach((ns, i) => ns.forEach(q => { const j = q[1], a = Math.min(i, j), b = Math.max(i, j), key = a * 4096 + b; if (seen[key]) return; seen[key] = 1; const len = Math.sqrt(q[0]); adj[a].push([b, len]); adj[b].push([a, len]); links.push([a, b, 1]); }));
  return (D = { P, ST, genes, gi, cells, X, M, S, near, adj, links, n });
};
line.cells = () => line.build().cells;
line.gene = name => { const d = line.build(), j = d.gi[name]; return d.M.map(r => r[j]); };

/* ================= the graph ================= */
/* how far every cell is from the nearest of some cells, along the links of the graph (Dijkstra) */
function reach(from) {
  const d = line.build(), n = d.n, dist = new Float64Array(n).fill(Infinity), done = new Uint8Array(n);
  from.forEach(i => { dist[i] = 0; });
  for (let step = 0; step < n; step++) {
    let at = -1, best = Infinity; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) { best = dist[i]; at = i; }
    if (at < 0) break;
    done[at] = 1; d.adj[at].forEach(q => { if (dist[at] + q[1] < dist[q[0]]) dist[q[0]] = dist[at] + q[1]; });
  }
  return dist;
}
const onLine = c => c.type < LINE;
/* The band has two ends. Nothing in the cells says which is the start, so both are found the same
   way: the cell of the line furthest from any cell, then the cell furthest from that one. The
   third root is the cell half-way between them. */
line.roads = function () {
  if (CACHE.roads) return CACHE.roads;
  /* furthest: the cell that lies furthest together with its neighbours, so that one stray cell is not taken for an end */
  const d = line.build(), far = dist => { let at = -1, best = -1; d.cells.forEach((c, i) => { if (!onLine(c) || !isFinite(dist[i])) return; let s = dist[i], m = 1; d.near[i].forEach(q => { if (onLine(d.cells[q[1]]) && isFinite(dist[q[1]])) { s += dist[q[1]]; m++; } }); if (s / m > best) { best = s / m; at = i; } }); return at; };
  const a = far(reach([d.cells.findIndex(onLine)])), da = reach([a]), b = far(da), db = reach([b]);
  let mid = -1, best = Infinity; d.cells.forEach((c, i) => { if (!onLine(c) || !isFinite(da[i])) return; const v = Math.abs(da[i] - db[i]) + 0.2 * (da[i] + db[i]); if (v < best) { best = v; mid = i; } });
  /* a root is a handful of cells: the tip and the cells nearest to it */
  const root = (tip, dist) => d.cells.map((c, i) => i).filter(i => onLine(d.cells[i])).sort((p, q) => dist[p] - dist[q]).slice(0, cfg.rootN);
  return (CACHE.roads = [{ tip: a, root: root(a, da) }, { tip: mid, root: root(mid, reach([mid])) }, { tip: b, root: root(b, db) }]);
};
/* Pseudotime from one of the roots: every cell's distance from the root cells through the graph,
   as a share of the furthest cell of the line. A cell the graph does not reach has none. */
line.order = function (road) {
  const key = 'order' + road; if (CACHE[key]) return CACHE[key];
  const d = line.build(), dist = reach(line.roads()[road].root);
  let max = 0; d.cells.forEach((c, i) => { if (onLine(c) && isFinite(dist[i])) max = Math.max(max, dist[i]); });
  const pt = Array.from(dist, v => (isFinite(v) ? v / max : NaN));
  /* the two lamp genes along this order: the cells of the line in equal groups from the root outwards */
  const ids = d.cells.map((c, i) => i).filter(i => onLine(d.cells[i]) && !isNaN(pt[i])).sort((p, q) => pt[p] - pt[q]);
  const lamp = name => { const x = line.gene(name), on = line.height(name), out = []; for (let b = 0; b < cfg.bins; b++) { let s = 0, m = 0; for (let k = Math.floor(b * ids.length / cfg.bins); k < Math.floor((b + 1) * ids.length / cfg.bins); k++) { s += x[ids[k]]; m++; } out.push(Math.min(1, s / m / on)); } return out; };
  const corr = name => spearman(ids.map(i => pt[i]), ids.map(i => line.gene(name)[i]));
  const L = d.P.turntable, early = corr(L.early), late = corr(L.late);
  const lamps = [lamp(L.early), lamp(L.late)], B = cfg.bins, head = v => (v[0] + v[1] + v[2]) / 3, tail = v => (v[B - 1] + v[B - 2] + v[B - 3]) / 3, top = v => Math.max.apply(null, v);
  /* the story runs the right way when the early gene is bright at the start and dark at the end, and the late gene the other way round */
  const runs = (a, z) => head(a) >= 0.6 * top(a) && tail(a) <= 0.25 * top(a) && tail(z) >= 0.6 * top(z) && head(z) <= 0.25 * top(z);
  return (CACHE[key] = { road, pt, ids, lamps, early, late, right: runs(lamps[0], lamps[1]), back: runs(lamps[1], lamps[0]) });
};
function ranks(v) { const o = v.map((x, i) => i).sort((a, b) => v[a] - v[b]), r = new Float64Array(v.length); for (let i = 0; i < o.length;) { let j = i; while (j + 1 < o.length && v[o[j + 1]] === v[o[i]]) j++; for (let k = i; k <= j; k++) r[o[k]] = (i + j) / 2; i = j + 1; } return r; }
function spearman(a, b) { const x = ranks(a), y = ranks(b), n = x.length; let mx = 0, my = 0; for (let i = 0; i < n; i++) { mx += x[i] / n; my += y[i] / n; } let xy = 0, xx = 0, yy = 0; for (let i = 0; i < n; i++) { xy += (x[i] - mx) * (y[i] - my); xx += (x[i] - mx) * (x[i] - mx); yy += (y[i] - my) * (y[i] - my); } return xx && yy ? xy / Math.sqrt(xx * yy) : 0; }
line.spearman = spearman;
/* a gene's usual level where it is on: its mean in the cells of the line that carry any of it */
line.height = function (name) {
  const key = 'h' + name; if (CACHE[key]) return CACHE[key];
  const d = line.build(), x = line.gene(name); let s = 0, m = 0; d.cells.forEach((c, i) => { if (onLine(c) && x[i] > 0) { s += x[i]; m++; } });
  return (CACHE[key] = m ? s / m : 1);
};
/* the root that what is known picks: the one whose order runs the right way */
line.stem = () => { for (let r = 0; r < 3; r++) if (line.order(r).right) return r; return -1; };
/* the pseudotime every later station works on: from the root at the stem cells */
line.pt = () => line.order(line.stem()).pt;

/* ================= the map ================= */
/* where every cell sits when the graph is drawn flat. The map is turned so that the stem cells are
   on the right: nothing says a line has to start on the left. */
line.map = function () {
  if (CACHE.map) return CACHE.map;
  const d = line.build(), xy = G.maths.layout(d.n, d.links, d.S, cfg.lay), mean = t => { let s = 0, m = 0; d.cells.forEach((c, i) => { if (c.type === t) { s += xy[i][0]; m++; } }); return s / m; };
  const flip = mean(0) < mean(LINE - 1), out = xy.map(q => [flip ? 1 - q[0] : q[0], q[1]]); out.aspect = xy.aspect;
  return (CACHE.map = out);
};
/* the middle of each state on the map, and how many cells it holds */
line.islands = function () {
  if (CACHE.isl) return CACHE.isl;
  const d = line.build(), xy = line.map();
  return (CACHE.isl = d.ST.map((s, t) => { let x = 0, y = 0, m = 0; d.cells.forEach((c, i) => { if (c.type === t) { x += xy[i][0]; y += xy[i][1]; m++; } }); return { t, n: m, x: x / m, y: y / m }; }));
};
/* how far apart two islands are on the map, in the map's own units */
line.apart = function (a, b) { const I = line.islands(), asp = line.map().aspect || 1; return Math.hypot((I[a].x - I[b].x) * asp, I[a].y - I[b].y); };

/* ================= 5-2, the track ================= */
/* The links between two groups of cells, counted against what chance would give (PAGA, Wolf et al.
   2019, as Scanpy computes it). Every cell points at its k nearest cells. links: how many of those
   pointers cross from one group to the other, either way. chance: how many would cross if every
   pointer landed on a cell picked at random. The wagon crosses where links come to MARK of chance. */
line.links = function (a, b) {
  const key = 'l' + Math.min(a, b) + '-' + Math.max(a, b); if (CACHE[key]) return CACHE[key];
  const d = line.build(), size = d.ST.map(() => 0); d.cells.forEach(c => { size[c.type]++; });
  let cross = 0; d.near.forEach((ns, i) => { const t = d.cells[i].type; if (t !== a && t !== b) return; ns.forEach(q => { const o = d.cells[q[1]].type; if (o !== t && (o === a || o === b)) cross++; }); });
  const chance = (cfg.k * size[a] * size[b] + cfg.k * size[b] * size[a]) / (d.n - 1), ratio = Math.min(1, cross / chance);
  return (CACHE[key] = { a, b, links: cross, chance, ratio, holds: ratio >= cfg.mark });
};
/* every pair that holds, and for one island the island nearest to it on the map */
line.pieces = function () { const K = line.build().ST.length, out = []; for (let a = 0; a < K; a++) for (let b = a + 1; b < K; b++) if (line.links(a, b).holds) out.push([a, b]); return out; };
line.nearest = function (a) { const K = line.build().ST.length; let best = -1, bd = Infinity; for (let b = 0; b < K; b++) if (b !== a && line.apart(a, b) < bd) { bd = line.apart(a, b); best = b; } return best; };

/* ================= 5-3, the timetable ================= */
/* One gene along pseudotime, smoothed. At each stop along the line the level is the mean of the
   cells around it, each counted by how near it is (a Gaussian kernel as wide as `span`, in
   pseudotime). With no span at all the level is that of the one nearest cell. */
line.curve = function (name, span) {
  const key = 'c' + name + '|' + span; if (CACHE[key]) return CACHE[key];
  const d = line.build(), pt = line.pt(), x = line.gene(name), ids = []; d.cells.forEach((c, i) => { if (onLine(c) && !isNaN(pt[i])) ids.push(i); });
  const out = new Float32Array(cfg.stops);
  for (let s = 0; s < cfg.stops; s++) {
    const at = (s + 0.5) / cfg.stops;
    if (!span) { let best = -1, bd = Infinity; ids.forEach(i => { const v = Math.abs(pt[i] - at); if (v < bd) { bd = v; best = i; } }); out[s] = x[best]; continue; }
    let sw = 0, sx = 0; ids.forEach(i => { const z = (pt[i] - at) / span, w = Math.exp(-0.5 * z * z); sw += w; sx += w * x[i]; });
    out[s] = sw > 1e-9 ? sx / sw : 0;
  }
  return (CACHE[key] = out);
};
/* What the lamps show at one setting of the lever, for the genes of the timetable. A lamp is lit
   at a stop where the gene's level is at least half its height. For every gene: where it is lit,
   in how many separate stretches, and where it first comes on. flicker: a lamp goes on more than
   once. lost: a lamp never lights. clear: the lamps come on one after another, each at least two
   stops after the one before. */
line.read = function (si) {
  const key = 'r' + si; if (CACHE[key]) return CACHE[key];
  const names = line.build().P.timetable.genes, span = cfg.spans[si];
  const rows = names.map(name => {
    const c = line.curve(name, span), h = line.height(name), lit = Array.from(c, v => v >= cfg.lit * h), level = Array.from(c, v => Math.min(1, v / h));
    let runs = 0, first = -1, count = 0; lit.forEach((on, s) => { if (on) { count++; if (first < 0) first = s; if (!s || !lit[s - 1]) runs++; } });
    return { name, lit, level, runs, first, count, peak: Math.max.apply(null, level) };
  });
  const flicker = rows.filter(r => r.runs > 1).map(r => r.name), lost = rows.filter(r => !r.count).map(r => r.name);
  const order = rows.filter(r => r.count).sort((a, b) => a.first - b.first).map(r => r.name);
  let gap = Infinity; const seen = rows.filter(r => r.count).map(r => r.first).sort((a, b) => a - b); for (let i = 1; i < seen.length; i++) gap = Math.min(gap, seen[i] - seen[i - 1]);
  return (CACHE[key] = { si, span, rows, flicker, lost, order, gap, ok: !flicker.length && !lost.length && gap >= 2 });
};
/* the notches of the lever at which the order can be read, and the order they give */
line.readable = () => cfg.spans.map((s, i) => i).filter(i => line.read(i).ok);
line.arrivals = () => line.read(line.readable()[0]).order;

/* ================= 5-4, the clock ================= */
/* each sample as a train: where its cells of the line sit along pseudotime */
line.trains = function () {
  if (CACHE.trains) return CACHE.trains;
  const d = line.build(), pt = line.pt();
  return (CACHE.trains = d.P.samples.map((sm, s) => {
    const at = [], type = []; d.cells.forEach((c, i) => { if (c.sample === s && onLine(c) && !isNaN(pt[i])) { at.push(pt[i]); type.push(c.type); } });
    const o = at.map((v, i) => i).sort((a, b) => at[a] - at[b]), mean = at.reduce((a, b) => a + b, 0) / at.length;
    return { sample: s, at: o.map(i => at[i]), type: o.map(i => type[i]), mean, late: at.filter(v => v > 0.5).length / at.length };
  }));
};
/* the samples from the one whose cells sit nearest the start to the one whose cells sit furthest along */
line.byProgress = () => line.trains().slice().sort((a, b) => a.mean - b.mean).map(t => t.sample);
/* two stretches of the line of the same length: the one that holds most cells and the one that holds fewest */
line.stretches = function () {
  if (CACHE.str) return CACHE.str;
  const all = []; line.trains().forEach(t => t.at.forEach(v => all.push(v)));
  const w = cfg.window, count = lo => all.filter(v => v >= lo && v < lo + w).length, step = 0.01;
  let crowd = null, sparse = null;
  for (let lo = 0.02; lo + w <= 0.98 + 1e-9; lo += step) { const n = count(lo); if (!crowd || n > crowd.n) crowd = { lo, hi: lo + w, n }; }
  for (let lo = 0.02; lo + w <= 0.98 + 1e-9; lo += step) { if (lo < crowd.hi && lo + w > crowd.lo) continue; const n = count(lo); if (!sparse || n < sparse.n) sparse = { lo, hi: lo + w, n }; }
  return (CACHE.str = { crowd, sparse, w });
};

/* ================= the departure board ================= */
/* the four states of the line in the order of their cells' median pseudotime */
line.sequence = function () {
  if (CACHE.seq) return CACHE.seq;
  const d = line.build(), pt = line.pt(), med = []; for (let t = 0; t < LINE; t++) { const v = []; d.cells.forEach((c, i) => { if (c.type === t && !isNaN(pt[i])) v.push(pt[i]); }); med.push(G.maths.median(v)); }
  return (CACHE.seq = { median: med, order: med.map((m, t) => t).sort((a, b) => med[a] - med[b]) });
};
/* the mean level of a gene in each state, and the states where it is at least half of its best: the states it can stand for */
line.home = function (name) {
  const key = 'home' + name; if (CACHE[key]) return CACHE[key];
  const d = line.build(), x = line.gene(name), mean = d.ST.map((s, t) => { let sum = 0, m = 0; d.cells.forEach((c, i) => { if (c.type === t) { sum += x[i]; m++; } }); return sum / m; }), top = Math.max.apply(null, mean);
  return (CACHE[key] = { mean, states: mean.map((v, t) => t).filter(t => mean[t] >= 0.5 * top) });
};
/* Can a gene stand for a state on the board? It has to be at home there, and the state has to be the one that carries most
   of it, or the next one along the line from that. shared: at home there, but another state carries more of it. */
line.marks = function (name, t) {
  const h = line.home(name), on = [0, 1, 2, 3, APART]; let best = on[0]; on.forEach(o => { if (h.mean[o] > h.mean[best]) best = o; });
  const home = h.states.indexOf(t) >= 0, close = t === best || (t < LINE && best < LINE && Math.abs(t - best) === 1);
  return { ok: home && close, shared: home && !close, best };
};
/* is a state on the line: reached from the root, and joined to another state of the line by a piece that holds */
line.joined = function (t) { for (let o = 0; o < LINE; o++) if (o !== t && line.links(t, o).holds) return true; return false; };
line.pc = v => Math.round(v * 100) + '%';
})();
