/* The maths every data set in the game shares: a median, PCA, community detection on a graph
   and a map of a graph. Each stage's own data module (cloud, atlas, loads) builds on these. */
(function () {
'use strict';
const median = v => { const s = Array.from(v).sort((a, b) => a - b), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

/* PCA by power iteration on the covariance of the chosen genes. scale: give each gene unit variance first. */
function pca(M, cols, k, scale) {
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
  return { S, ev, tot, vecs, cols, mu, sd };
}

/* A map of the graph, in the manner of UMAP: start from the first two principal components, then
   let linked cells pull together and all cells keep a little room around themselves. A weak pull
   to the middle stops the islands drifting apart, because the space between islands means nothing. */
function layout(n, links, S, opt) {
  const L = Object.assign({ it: 160, pull: 0.25, room: 1.1, far: 0.07, grav: 0.006, reach: 100 }, G.layoutOpt || {}, opt || {});
  const P = new Float64Array(2 * n), nb = Array.from({ length: n }, () => []);
  links.forEach(l => { nb[l[0]].push([l[1], l[2]]); nb[l[1]].push([l[0], l[2]]); });
  let sx = 0; for (let i = 0; i < n; i++) sx = Math.max(sx, Math.abs(S[i][0]), Math.abs(S[i][1]));
  const span = Math.sqrt(n) * 1.2;
  for (let i = 0; i < n; i++) { P[2 * i] = S[i][0] / sx * span; P[2 * i + 1] = S[i][1] / sx * span; }
  const Q = new Float64Array(2 * n);
  for (let it = 0; it < L.it; it++) {
    const lr = 1 - it / L.it;
    /* each cell moves part of the way to the middle of its neighbours */
    for (let i = 0; i < n; i++) {
      let x = 0, y = 0, w = 0; nb[i].forEach(q => { x += P[2 * q[0]] * q[1]; y += P[2 * q[0] + 1] * q[1]; w += q[1]; });
      Q[2 * i] = w ? (x / w - P[2 * i]) * L.pull : 0; Q[2 * i + 1] = w ? (y / w - P[2 * i + 1]) * L.pull : 0;
    }
    for (let i = 0; i < 2 * n; i++) P[i] = (P[i] + Q[i]) * (1 - L.grav);
    /* and cells that crowd each other move apart */
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      let dx = P[2 * i] - P[2 * j], dy = P[2 * i + 1] - P[2 * j + 1]; const d2 = dx * dx + dy * dy;
      if (d2 > L.reach) continue;
      const d = Math.sqrt(d2) || 0.01; if (!d2) { dx = 0.01 * ((i * 7 + j) % 3 - 1); dy = 0.01; }
      const f = (d < L.room ? 0.5 * (L.room - d) / d : 0) + L.far * (0.4 + 0.6 * lr) / (d2 + 0.3);
      P[2 * i] += dx * f; P[2 * i + 1] += dy * f; P[2 * j] -= dx * f; P[2 * j + 1] -= dy * f;
    }
  }
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < n; i++) { x0 = Math.min(x0, P[2 * i]); x1 = Math.max(x1, P[2 * i]); y0 = Math.min(y0, P[2 * i + 1]); y1 = Math.max(y1, P[2 * i + 1]); }
  const xy = []; for (let i = 0; i < n; i++) xy.push([(P[2 * i] - x0) / (x1 - x0), (P[2 * i + 1] - y0) / (y1 - y0)]);
  xy.aspect = (x1 - x0) / (y1 - y0);
  return xy;
}

/* Louvain: move each cell to the neighbouring group that raises modularity most, merge the groups
   into single nodes, repeat. `res` is the resolution: it scales the number of links expected by
   chance, so a higher value asks for tighter, smaller groups. Leiden, which you should use on real
   data, optimises the same score and adds a step that keeps every group well connected. */
function louvain(n, links, res, seed) {
  let adj = Array.from({ length: n }, () => ({}));
  links.forEach(l => { adj[l[0]][l[1]] = (adj[l[0]][l[1]] || 0) + l[2]; adj[l[1]][l[0]] = (adj[l[1]][l[0]] || 0) + l[2]; });
  let member = Array.from({ length: n }, (_, i) => i), N = n;
  const rnd = G.rng(seed);
  for (let level = 0; level < 12; level++) {
    const deg = new Float64Array(N); let m2 = 0;
    for (let i = 0; i < N; i++) { for (const j in adj[i]) deg[i] += adj[i][j]; m2 += deg[i]; }
    const comm = Array.from({ length: N }, (_, i) => i), tot = Float64Array.from(deg);
    const order = Array.from({ length: N }, (_, i) => i);
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
    let moved = false;
    for (let pass = 0; pass < 40; pass++) {
      let any = false;
      order.forEach(i => {
        const ci = comm[i], w = {};
        for (const j in adj[i]) { if (+j !== i) { const c = comm[j]; w[c] = (w[c] || 0) + adj[i][j]; } }
        tot[ci] -= deg[i];
        let best = ci, bg = (w[ci] || 0) - res * deg[i] * tot[ci] / m2;
        for (const c in w) { const g = w[c] - res * deg[i] * tot[c] / m2; if (g > bg + 1e-12) { bg = g; best = +c; } }
        tot[best] += deg[i];
        if (best !== ci) { comm[i] = best; any = true; moved = true; }
      });
      if (!any) break;
    }
    if (!moved) break;
    /* merge each group into one node */
    const ids = {}; let M = 0; comm.forEach(c => { if (ids[c] === undefined) ids[c] = M++; });
    member = member.map(c => ids[comm[c]]);
    const next = Array.from({ length: M }, () => ({}));
    for (let i = 0; i < N; i++) { const a = ids[comm[i]]; for (const j in adj[i]) { const b = ids[comm[j]]; next[a][b] = (next[a][b] || 0) + adj[i][j]; } }
    adj = next; N = M;
  }
  return member;
}
function quality(n, links, lab, res) {
  const deg = new Float64Array(n), tot = {}, inn = {}; let m2 = 0;
  links.forEach(l => { deg[l[0]] += l[2]; deg[l[1]] += l[2]; m2 += 2 * l[2]; if (lab[l[0]] === lab[l[1]]) inn[lab[l[0]]] = (inn[lab[l[0]]] || 0) + 2 * l[2]; });
  for (let i = 0; i < n; i++) tot[lab[i]] = (tot[lab[i]] || 0) + deg[i];
  let q = 0; for (const c in tot) q += (inn[c] || 0) / m2 - res * (tot[c] / m2) * (tot[c] / m2);
  return q;
}
/* the best of a few starts, with the groups renumbered from the largest down */
function detect(n, links, res, starts) {
  let best = null, bq = -Infinity;
  for (let s = 1; s <= (starts || 6); s++) { const lab = louvain(n, links, res, s * 101), q = quality(n, links, lab, res); if (q > bq + 1e-9) { bq = q; best = lab; } }
  const size = {}; best.forEach(c => { size[c] = (size[c] || 0) + 1; });
  const rank = Object.keys(size).sort((a, b) => size[b] - size[a] || a - b), id = {}; rank.forEach((c, i) => { id[c] = i; });
  return { lab: best.map(c => id[c]), k: rank.length, sizes: rank.map(c => size[c]) };
}

G.maths = { median, pca, layout, detect };
})();
