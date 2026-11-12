/* Station 2-4, Neighbours. Every cell is linked to its k nearest cells, measured across the
   principal components kept at the Rotator. The links form the neighbour graph. The player
   chooses k. With too few neighbours a cell type falls into separate pieces. With too many, a
   small group cannot keep to itself: 8 rare cells cannot supply 15 neighbours of their own type.
   The graph redraws as the number changes, so nothing is hidden behind a check. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 180, PH = 110, SX = 190, SW = 126, KMAX = 30;

let phase, beats, dims, k, pos, webs, w, focus, reps, fi, lostRare, best, locks, res, rsel, lastSync, pulse;

const web = kk => (webs[kk] || (webs[kk] = G.cloud.web(kk, dims)));
const broken = v => v.pieces.filter((p, i) => p > 1 && (i < 4 || !lostRare)).length;
const whole = v => broken(v) === 0;
const rareOK = v => lostRare || v.own[4] >= 0.75;
const bigOK = v => Math.min(v.own[0], v.own[1], v.own[2], v.own[3]) >= best - 0.05;
const good = v => whole(v) && rareOK(v) && bigOK(v);

function build() {
  const cl = G.cloud, e = cl.scores(), S = e.S;
  dims = Math.min(cl.settings().dims, S[0].length); webs = {};
  /* a flat, slanted view of the first four components: no flat view can show all of them */
  const q = S.map(s => [s[0] + 0.6 * (s[2] || 0), s[1] + 0.6 * (s[3] || 0)]);
  const lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
  q.forEach(v => { for (let c = 0; c < 2; c++) { lo[c] = Math.min(lo[c], v[c]); hi[c] = Math.max(hi[c], v[c]); } });
  pos = q.map(v => [PX + 9 + (v[0] - lo[0]) / (hi[0] - lo[0]) * (PW - 18), PY + PH - 16 - (v[1] - lo[1]) / (hi[1] - lo[1]) * (PH - 52)]);
  /* a cell type that never keeps to itself, however few the neighbours, was lost before this station */
  lostRare = Math.max.apply(null, [3, 4, 5, 6].map(kk => web(kk).own[4])) < 0.5;
  best = Math.max.apply(null, [3, 4, 5, 6, 8].map(kk => { const v = web(kk); return Math.min(v.own[0], v.own[1], v.own[2], v.own[3]); }));
  /* one cell of each type to follow, a rare one first */
  reps = [4, 0, 1, 2, 3].map(t => cl.cells.findIndex((c, i) => c.type === t && i % 3 === 0));
}
function setK(v) {
  v = G.clamp(Math.round(v), 1, KMAX); if (v === k) return;
  k = v; w = web(k); pulse = G.t; G.sfx('tick'); lights();
}
function lights() { G.book.goal('whole', whole(w)); G.book.goal('rare', rareOK(w) && bigOK(w)); }

function verdict() {
  const n = broken(w);
  if (res.pass) return 'Every cell type holds together' + (lostRare ? '. The rare cells were already lost at the gene picker.' : ', and the rare cells stay with each other.') +
    ' Rule of thumb: a group much smaller than the number of neighbours is hard to keep separate.';
  if (n) return 'Too few neighbours. ' + (n === 1 ? 'One cell type has' : n + ' cell types have') + ' broken into pieces. The yellow cells are cut off from their own type.';
  if (!rareOK(w)) return 'Too many. There are only 8 rare cells, so with ' + k + ' neighbours each they must link to other cell types: the red links.';
  return 'Too many neighbours. Cells are now linked across cell types.';
}

function sync() {
  const key = phase + '|' + k;
  if (key === lastSync) return;
  lastSync = key;
  G.params.kk = k; G.params.kdims = dims;
  G.book.sync();
}
function showBook() {
  const num = id => '<input class="p" data-p="kk" id="k-' + id + '" type="number" step="1" min="1" max="' + KMAX + '" inputmode="numeric" aria-label="neighbours per cell">';
  const d = '<span class="p" data-b="kdims"></span>';
  G.book.show({
    floor: 'Floor 2 · Station 2-4', room: 'Neighbours', aim: 'Link every cell to its nearest neighbours, using a number of neighbours that keeps every cell type intact.',
    codeFirst: true, file: 'js/knn.js',
    goals: [
      { id: 'whole', text: 'Every cell type stays in one piece' },
      { id: 'rare', text: 'The 8 rare cells link mostly to each other' },
    ],
    notes: [
      { id: 'k-what', open: true, html: 'Each cell is linked to its <b>k nearest neighbours</b>, measured across the principal components you kept. The links form the <b>neighbour graph</b>. Clustering and UMAP are both computed from a neighbour graph, not from the genes.' },
      { id: 'k-few', html: 'With too few neighbours the graph is sparse and noisy. One cell type can split into pieces, which later look like separate clusters.' },
      { id: 'k-many', html: 'With too many neighbours, small populations are absorbed. A group with fewer cells than k cannot fill its neighbour lists with its own type. As a rule of thumb, keep k below the size of the smallest population you care about.' },
      { id: 'k-real', html: 'Usual values are <b>10 to 30</b> for data sets of thousands of cells. The defaults are 15 in Scanpy, 20 in Seurat and 11 in CyteArc. This toy data has 174 cells, so the right numbers are smaller. Many tools also weight each link by how many neighbours the two cells share.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'The <b>highlighted value</b> is the number of neighbours. It is live. The other number is the principal components you kept at the Rotator.',
      tabs: [
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          '<span class="c"># the neighbour graph, on the components</span>\n' +
          'sc.pp.<span class="k">neighbors</span>(\n    adata,\n    n_neighbors=' + num('sc') + ',\n    n_pcs=' + d + ',\n)</pre>' },
        { id: 'se', label: 'R · Seurat', html:
          '<pre class="code"><span class="k">library</span>(Seurat)\n' +
          '<span class="c"># k nearest neighbours, then each link is\n# weighted by the neighbours two cells share</span>\n' +
          'obj &lt;- <span class="k">FindNeighbors</span>(obj,\n    dims = 1:' + d + ',\n    k.param = ' + num('se') + ')</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="c"># an index over the components, then a query</span>\n' +
          'ann = ds.graph.<span class="k">ann_index</span>(pca)\n' +
          'neighbors = ds.graph.<span class="k">neighbors</span>(ann, k=' + num('ca') + ')\n\n' +
          '<span class="c"># the weighted graph used by clustering and UMAP</span>\n' +
          'graph = ds.graph.<span class="k">connectivity</span>(neighbors)</pre>' },
      ],
    },
  });
  G.book.onParam = (key, v) => { if (key === 'kk' && phase === 'set') { setK(v); lastSync = null; } };
}

function lock() {
  locks++; G.state.tries.knn++; G.save();
  const pass = good(w);
  res = { pass, stars: !pass ? 0 : locks === 1 ? 3 : locks === 2 ? 2 : 1 };
  phase = 'result'; rsel = pass ? 1 : 0;
  lights(); G.book.unlock('k-few'); G.book.unlock('k-many'); if (pass) G.book.unlock('k-real');
  G.sfx(pass ? 'star' : 'bad');
}
function retry() { phase = 'set'; res = null; }
function keep() {
  const s = G.state;
  s.cloud = Object.assign({}, s.cloud, { k });
  s.rooms.knn = { done: true, stars: Math.max(s.rooms.knn.stars, res.stars) };
  G.save();
  G.go('corridor', { from: 'knn', toast: 'NEIGHBOUR GRAPH BUILT: ' + k + ' NEIGHBOURS PER CELL' });
}

G.scenes.knn = {
  phase: () => phase,
  enter() {
    build();
    k = 15; w = web(k); fi = 0; focus = reps[0]; locks = 0; res = null; rsel = 0; lastSync = null; pulse = -9;
    beats = new G.Beats([
      { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'Every cell is linked to its nearest neighbours, across all ' + dims + ' components. The links form the neighbour graph.' },
      { spot: [SX, 14, SW, 114], say: 'Clustering and UMAP are both built on this graph. The pink dots are the 8 rare cells. This panel watches them.' },
      { spot: [0, 130, VW, 50], say: 'Choose how many neighbours each cell gets. Keep every cell type in one piece and the rare cells together. Then press LOCK.' },
    ]);
    phase = G.state.tries.knn > 0 ? 'set' : 'intro';
    showBook(); sync(); lights();
  },
  leave() { G.book.onParam = null; },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'knn' }); return; }
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'set'; }
    else if (phase === 'set') {
      const d = (G.rep('right') ? 1 : 0) - (G.rep('left') ? 1 : 0);
      if (d) setK(k + d);
      if (G.hit('up') || G.hit('down')) { fi = (fi + (G.hit('down') ? 1 : reps.length - 1)) % reps.length; focus = reps[fi]; G.sfx('blip'); }
      /* tap a cell to see its neighbours */
      if (G.ptr.pressed && G.over(PX, PY, PW, PH)) {
        let bi = -1, bd = 100; pos.forEach((p, i) => { const q = (p[0] - G.ptr.x) * (p[0] - G.ptr.x) + (p[1] - G.ptr.y) * (p[1] - G.ptr.y); if (q < bd) { bd = q; bi = i; } });
        if (bi >= 0) { focus = bi; G.sfx('blip'); }
      }
      if (G.hit('a')) lock();
    } else if (phase === 'result') {
      const r = G.resultKeys(rsel, res.pass); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') retry();
    }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#0b1122');
    drawWeb(); drawSide();
    G.roomHeader('2-4  NEIGHBOURS', C.mint, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, verdict(), res.pass, rsel, 'CHANGE THE NUMBER', 'KEEP THIS GRAPH');
      if (act === 'keep') keep(); else if (act === 'retry') retry();
      return;
    }
    G.strip(y0);
    T('NEIGHBOURS PER CELL', 14, y0 + 7, C.white);
    const v = G.slider('kk', 14, y0 + 26, 190, k, 1, KMAX, 1, { focus: true, c: C.mint });
    if (v !== k) setK(v);
    T(String(k), 204, y0 + 3, C.mint, { a: 'right', f: 'lg' });
    if (G.button('lock', 250, y0 + 8, 62, 28, 'LOCK', { primary: true })) lock();
    if (phase === 'set' && good(w)) G.cue(281, y0 + 7, true);
    if (phase === 'intro') beats.draw();
  },
};

function drawWeb() {
  const cl = G.cloud, shown = phase === 'result', type = i => cl.cells[i].type;
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  /* at most a thousand links are drawn: beyond that the picture is solid anyway */
  const step = Math.ceil(w.links.length / 1000), flash = G.t - pulse < 0.18;
  w.links.forEach((l, n) => {
    const a = type(l[0]), b = type(l[1]), stray = (a === 4) !== (b === 4);
    if (!stray && n % step) return;
    G.line(pos[l[0]][0], pos[l[0]][1], pos[l[1]][0], pos[l[1]][1], stray ? '#c04a52' : shown && a !== b ? '#7a3f4a' : flash ? '#3d5290' : '#283a6b');
  });
  /* one cell and the neighbours it chose */
  if (!shown) {
    const near = cl.nearest(dims)[focus];
    for (let q = 0; q < k; q++) G.line(pos[focus][0], pos[focus][1], pos[near[q]][0], pos[near[q]][1], type(near[q]) === type(focus) ? C.fog : C.coral);
  }
  pos.forEach((p, i) => {
    const t = type(i);
    R(p[0] - 1, p[1] - 1, 2, 2, shown ? cl.TYPES[t].col : w.loose[i] ? C.amber : t === 4 ? C.pink : '#8fa0c8');
  });
  if (!shown) { G.ring(pos[focus][0], pos[focus][1], 4, C.white); R(pos[focus][0] - 1, pos[focus][1] - 1, 3, 3, C.white); }
  /* the key */
  if (shown) return;
  R(PX + 4, PY + 5, 3, 3, C.pink); T('8 RARE CELLS', PX + 10, PY + 3, C.pink);
  R(PX + 4, PY + 14, 3, 3, C.amber); T('CUT OFF FROM ITS TYPE', PX + 10, PY + 12, w.loose.some(v => v) ? C.amber : '#4a5a85');
  G.ring(PX + 5, PY + 25, 2, C.white); T('ONE CELL AND ITS NEIGHBOURS', PX + 10, PY + 21, C.fog);
  R(PX + 3, PY + PH - 7, 5, 1, '#c04a52'); T('RARE CELL LINKED TO OTHER TYPE', PX + 10, PY + PH - 10, '#c04a52');
}

function drawSide() {
  const x = SX, wd = SW, cl = G.cloud;
  G.panel(x, 14, wd, 114, { border: C.slate, fill: '#0e1630' });
  if (phase === 'result') {
    T('LINKS TO THE SAME', x + 6, 18, C.mist); T('CELL TYPE', x + 6, 27, C.mist);
    cl.TYPES.forEach((t, i) => {
      const y = 39 + i * 10, v = w.own[i], ok = i === 4 ? rareOK(w) : v >= best - 0.05;
      R(x + 6, y + 2, 4, 4, t.col); T(i === 4 ? 'RARE CELLS' : t.name, x + 13, y, C.fog);
      T(i === 4 && lostRare ? 'LOST AT 2-2' : Math.floor(v * 100) + '%', x + wd - 6, y, i === 4 && lostRare ? C.steel : ok ? C.mint : C.coral, { a: 'right' });
    });
    R(x + 5, 91, wd - 10, 1, C.slate);
    const br = broken(w);
    T('TYPES IN PIECES', x + 6, 96, C.fog); T(br ? String(br) : 'NONE', x + wd - 6, 96, br ? C.coral : C.mint, { a: 'right' });
    if (res.pass) { G.stars(x + 6, 112, res.stars); T(locks + (locks === 1 ? ' TRY' : ' TRIES'), x + wd - 6, 112, C.steel, { a: 'right' }); }
    return;
  }
  T('NEIGHBOUR GRAPH', x + 6, 18, C.mist); T(w.links.length + ' LINKS', x + 6, 27, C.steel);
  R(x + 5, 38, wd - 10, 1, C.slate);
  const br = broken(w);
  T('CELL TYPES IN PIECES', x + 6, 42, C.fog);
  T(br ? br + ' OF 5' : 'NONE', x + 6, 52, br ? C.coral : C.mint, { f: 'smb' }); T('AIM: NONE', x + wd - 6, 52, C.steel, { a: 'right' });
  R(x + 5, 64, wd - 10, 1, C.slate);
  const ok = rareOK(w), col = lostRare ? C.steel : ok ? C.mint : C.coral;
  T('RARE-CELL LINKS TO', x + 6, 68, C.fog); T('OTHER RARE CELLS', x + 6, 77, C.fog);
  R(x + 6, 90, wd - 48, 3, C.slate); R(x + 6, 90, Math.round((wd - 48) * w.own[4]), 3, col);
  T(Math.round(w.own[4] * 100) + '%', x + wd - 6, 86, col, { a: 'right', f: 'smb' });
  T(lostRare ? 'LOST AT STATION 2-2' : 'AIM: 75% OR MORE', x + 6, 96, C.steel);
  R(x + 5, 107, wd - 10, 1, C.slate);
  T(G.kt('UP, DOWN: OTHER CELL', 'TAP A CELL TO FOLLOW'), x + 6, 113, C.steel);
}
})();
