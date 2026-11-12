/* Station 2-5, the Map table. The neighbour graph is drawn flat by a live force layout: linked
   cells pull together, cells that crowd each other push apart. The start is random, set by a
   seed, so the player draws the same graph twice and compares the two maps. Which cells are
   grouped together is the same in both. Where the islands sit, and how far apart, is not.
   This is a simplified layout, not the UMAP algorithm, and real UMAP starts from a better first
   guess than random positions. The station says so. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 180, PH = 110, SX = 190, SW = 126;
const COLOURS = [
  ['LYZ', 'A MONOCYTE GENE'], ['CD3E', 'A T CELL GENE'], ['NKG7', 'AN NK CELL GENE'], ['MS4A1', 'A B CELL GENE'], ['FCER1A', 'A RARE-CELL GENE'], ['DEPTH', 'SEQUENCING DEPTH'],
];
const RAMP = ['#52639a', '#8a9bcb', '#d99a2e', '#ffd27a'];
const QUIZ = [
  { o: 'EACH ISLAND IS IN THE SAME PLACE', no: 'Look again. Find the same island in both maps. Is it in the same place?' },
  { o: 'THE SAME CELLS ARE GROUPED TOGETHER', yes: true },
  { o: 'THE ISLANDS ARE THE SAME DISTANCE APART', no: 'Look again. Pick two islands. Is the gap between them the same in both maps?' },
];
const RIGHT = 'Yes. Which cells sit together comes from the graph, so it never changes. Where an island lands, how far it is from the others and how big it looks is the layout. Do not read those as results. ' +
  'Real UMAP starts from a better first guess than this table, so its maps move less. The caution is the same.';
const FIRST = 'That is a map of your cells. Cells that sit together are neighbours in the graph. Colour it by a marker gene to see which island is which. Then shake the table and draw it again: same graph, new random start.';

let phase, beats, o, links, L, running, maps, seed, ci, level, sel, view, wrong, tried, qsel, tip, res, rsel, lastSync, told;

function colourBy(i) {
  const cl = G.cloud, e = cl.scores(), name = COLOURS[i][0];
  const v = name === 'DEPTH' ? cl.cells.map(c => Math.log(c.total)) : (j => e.M.map(r => r[j]))(cl.genes.findIndex(g => g.name === name));
  const lo = Math.min.apply(null, v), hi = Math.max.apply(null, v);
  level = v.map(x => Math.min(3, Math.floor((x - lo) / (hi - lo || 1) * 4)));
  ci = i;
}
/* positions scaled into a box, keeping the shape of the map */
function fit(P, x, y, w, h) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; const n = P.length / 2;
  for (let i = 0; i < n; i++) { x0 = Math.min(x0, P[2 * i]); x1 = Math.max(x1, P[2 * i]); y0 = Math.min(y0, P[2 * i + 1]); y1 = Math.max(y1, P[2 * i + 1]); }
  const s = Math.min(w / (x1 - x0 || 1), h / (y1 - y0 || 1));
  return { s, ox: x + w / 2 - (x0 + x1) / 2 * s, oy: y + h / 2 - (y0 + y1) / 2 * s };
}
function start() {
  if (maps.length) seed++;
  L = G.cloud.layout(links, G.cloud.cells.length, seed, 'loose');
  running = true; G.sfx('door');
}
function settle() {
  running = false;
  maps.push({ seed, P: new Float32Array(L.P) }); if (maps.length > 3) maps.shift();
  G.book.goal('unfold', true); G.book.unlock('u-what');
  if (maps.length >= 2) { G.book.goal('shake', true); G.book.unlock('u-seed'); if (sel === 0) sel = 2; }
  /* the first map gets a word from the mentor, once */
  if (maps.length === 1 && !told) { told = true; tip = new G.Beats([{ say: FIRST }]); }
  G.sfx('ok');
}

function sync() {
  const key = [phase, seed, ci].join('|');
  if (key === lastSync) return;
  lastSync = key;
  const g = COLOURS[ci][0];
  G.params.useed = seed; G.params.udims = o.dims;
  G.params.ugene = g === 'DEPTH' ? 'total_counts' : g; G.params.ugener = g === 'DEPTH' ? 'nCount_RNA' : g;
  G.book.sync();
}
function showBook() {
  const b = k => '<span class="p" data-b="' + k + '"></span>';
  G.book.show({
    floor: 'Floor 2 · Station 2-5', room: 'The Map table', aim: 'Draw the neighbour graph as a flat map, twice, and work out which features of a map can be trusted.',
    codeFirst: true, file: 'js/umap.js',
    goals: [
      { id: 'unfold', text: 'Draw the map and let it settle' },
      { id: 'shake', text: 'Draw it again from new random positions' },
      { id: 'same', text: 'Say what is the same in both maps' },
    ],
    notes: [
      { id: 'u-what', open: true, html: 'UMAP draws the neighbour graph on a flat surface. Linked cells are pulled together and all other cells are pushed apart until the picture settles. <b>The map is a drawing of the graph.</b> The graph is what you analyse.' },
      { id: 'u-seed', html: 'The layout has to start somewhere, and it uses random numbers along the way. A different random seed gives a different picture of the same graph. <b>Fix the seed and report it.</b>' },
      { id: 'u-trust', html: '<b>You can trust</b> which cells sit together. <b>Do not interpret</b> where an island sits, how far it is from another island, or how large it looks. Those depend on the layout and its settings.' },
      { id: 'u-colour', html: 'Colour the map by marker genes to see which island is which cell type. Colour it by sequencing depth to check that depth is not what separates your islands.' },
      { id: 'u-init', html: 'This table starts from random positions, which exaggerates the effect. Real UMAP starts from a rough first guess (a spectral layout, or the principal components), so its maps change less between runs and keep more of the large-scale arrangement. They are still drawings.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'The <b>highlighted values</b> follow the table: the random seed and the gene the map is coloured by.',
      tabs: [
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          '<span class="c"># draw the neighbour graph flat</span>\n' +
          'sc.tl.<span class="k">umap</span>(\n    adata,\n    min_dist=0.5,\n    random_state=' + b('useed') + ',\n)\n\n' +
          '<span class="c"># which island is which cell type?</span>\n' +
          'sc.pl.<span class="k">umap</span>(adata, color=<span class="s">"</span>' + b('ugene') + '<span class="s">"</span>)</pre>' },
        { id: 'se', label: 'R · Seurat', html:
          '<pre class="code"><span class="k">library</span>(Seurat)\n' +
          'obj &lt;- <span class="k">RunUMAP</span>(obj,\n    dims = 1:' + b('udims') + ',\n    min.dist = 0.3,\n    seed.use = ' + b('useed') + ')\n\n' +
          '<span class="c"># which island is which cell type?</span>\n' +
          '<span class="k">FeaturePlot</span>(obj, <span class="s">"</span>' + b('ugener') + '<span class="s">"</span>)</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="c"># start from the principal components,\n# not from random positions</span>\n' +
          'init = ds.embeddings.<span class="k">initialization</span>(pca)\n\n' +
          'umap = ds.embeddings.<span class="k">umap</span>(graph, init)</pre>' },
      ],
    },
  });
}

function answer(i) {
  if (tried[i]) return;
  tried[i] = true;
  if (QUIZ[i].yes) {
    res = { stars: Math.max(1, 3 - wrong) }; phase = 'result'; rsel = 1;
    G.state.tries.umap++; G.save();
    G.book.goal('same', true); G.book.unlock('u-trust'); G.book.unlock('u-colour'); G.book.unlock('u-init');
    G.sfx('star');
  } else { wrong++; tip = new G.Beats([{ say: QUIZ[i].no }]); G.sfx('bad'); }
}
function keep() {
  const s = G.state, m = maps[maps.length - 1];
  s.cloud = Object.assign({}, s.cloud, { seed: m.seed, pack: 'loose' });
  s.rooms.umap = { done: true, stars: Math.max(s.rooms.umap.stars, res.stars) };
  G.save();
  G.go('corridor', { from: 'umap', toast: 'MAP DRAWN WITH SEED ' + m.seed });
}
function act() {
  if (sel === 2 && maps.length >= 2 && !running) { phase = res ? 'result' : 'quiz'; rsel = 1; qsel = 0; G.sfx('blip'); return; }
  if (sel === 1) { colourBy((ci + 1) % COLOURS.length); G.sfx('tick'); return; }
  if (!running) start();
}

G.scenes.umap = {
  phase: () => phase,
  enter() {
    const cl = G.cloud; cl.scores();
    o = cl.settings(); links = cl.web(o.k, o.dims).links;
    seed = 1; maps = []; L = null; running = false; sel = 0; wrong = 0; tried = {}; tip = null; told = G.state.tries.umap > 0; res = null; rsel = 0; lastSync = null; view = null;
    colourBy(0);
    beats = new G.Beats([
      { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'The graph has ' + o.dims + ' dimensions. UMAP draws it flat: linked cells pull together, crowded cells push apart.' },
      { spot: [0, 130, VW, 50], say: 'This table is a simple version of UMAP. It starts from random positions. Press UNFOLD THE MAP.' },
    ]);
    phase = G.state.tries.umap > 0 ? 'play' : 'intro';
    showBook(); sync();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'umap' }); return; }
    if (running && G.cloud.layoutStep(L, G.reduced ? 9999 : 2)) settle();
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'play'; }
    else if (tip) { if (tip.update(dt) === 'done') tip = null; }
    else if (phase === 'play') {
      const n = maps.length >= 2 ? 3 : 2;
      if (G.hit('up')) { sel = (sel + n - 1) % n; G.sfx('tick'); }
      if (G.hit('down')) { sel = (sel + 1) % n; G.sfx('tick'); }
      if (sel === 1 && (G.hit('left') || G.hit('right'))) { colourBy((ci + (G.hit('right') ? 1 : COLOURS.length - 1)) % COLOURS.length); G.sfx('tick'); }
      if (G.hit('a')) act();
    } else if (phase === 'quiz') {
      if (G.hit('up')) { qsel = (qsel + 2) % 3; G.sfx('tick'); }
      if (G.hit('down')) { qsel = (qsel + 1) % 3; G.sfx('tick'); }
      if (G.hit('a')) answer(qsel);
    } else if (phase === 'result') {
      const r = G.resultKeys(rsel, true); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') { phase = 'play'; sel = 0; }
    }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#0b1122');
    if (phase === 'quiz' || phase === 'result') drawPair(); else drawTable();
    drawSide();
    G.roomHeader('2-5  THE MAP TABLE', C.pink, true);
    const y0 = 130;
    if (phase === 'result') {
      const act2 = G.resultDraw(y0, RIGHT, true, rsel, 'MAKE MORE MAPS', 'KEEP THIS MAP');
      if (act2 === 'keep') keep(); else if (act2 === 'retry') { phase = 'play'; sel = 0; }
      return;
    }
    if (phase === 'quiz') {
      G.strip(y0 - 20);
      T('WHICH IS TRUE FOR BOTH MAPS?', 12, y0 - 14, C.white, { f: 'smb' });
      QUIZ.forEach((q, i) => {
        const y = y0 + 1 + i * 16;
        if (tried[i]) { G.panel(12, y, 296, 14, { border: C.slate, fill: C.night }); T(q.o, 22, y + 3, C.steel); T('NOT TRUE', 300, y + 3, C.coral, { a: 'right' }); }
        else if (G.button('q' + i, 12, y, 296, 14, q.o, { focus: qsel === i })) { qsel = i; answer(i); }
      });
      if (tip) tip.draw();
      return;
    }
    G.strip(y0);
    T('COLOUR CELLS BY', 14, y0 + 8, sel === 1 ? C.white : C.mist); if (sel === 1 && Math.floor(G.t * 3) % 2 === 0) T('>', 6, y0 + 8, C.cyan);
    const over = G.over(104, y0 + 5, 84, 13);
    G.panel(104, y0 + 5, 84, 13, { border: sel === 1 || over ? C.cyan : C.slate, fill: C.ink });
    T('<', 108, y0 + 7, C.steel); T('>', 180, y0 + 7, C.steel); T(COLOURS[ci][0], 146, y0 + 7, C.amber, { a: 'center' });
    if (over && G.ptr.pressed) { sel = 1; colourBy((ci + (G.ptr.x < 146 ? COLOURS.length - 1 : 1)) % COLOURS.length); G.sfx('tick'); }
    T(COLOURS[ci][1], 104, y0 + 23, C.steel);
    if (G.button('go', 202, y0 + 5, 112, 15, maps.length ? 'SHAKE AND UNFOLD' : 'UNFOLD THE MAP', { primary: maps.length < 2, focus: sel === 0, disabled: running })) { sel = 0; act(); }
    if (G.button('ans', 202, y0 + 25, 112, 15, 'COMPARE THE MAPS', { primary: maps.length >= 2, focus: sel === 2, disabled: maps.length < 2 || running })) { sel = 2; act(); }
    /* an arrow at the next thing to press */
    if (phase === 'play' && !running && !tip) G.cue(200, maps.length >= 2 ? y0 + 32 : y0 + 12);
    if (phase === 'intro') beats.draw(); else if (tip) tip.draw();
  },
};

function drawTable() {
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  const P = L ? L.P : null;
  if (!P) {
    T('THE TABLE IS EMPTY', PX + PW / 2, PY + 44, C.steel, { a: 'center' });
    T(links.length + ' LINKS TO DRAW', PX + PW / 2, PY + 56, C.steel, { a: 'center' });
    return;
  }
  /* the view follows the map as it spreads, without jumping */
  const f = fit(P, PX + 8, PY + 12, PW - 16, PH - 22);
  if (!view) view = f; else { const a = running ? 0.12 : 0.3; view.s += (f.s - view.s) * a; view.ox += (f.ox - view.ox) * a; view.oy += (f.oy - view.oy) * a; }
  const X = i => view.ox + P[2 * i] * view.s, Y = i => view.oy + P[2 * i + 1] * view.s;
  if (running) {
    const step = Math.ceil(links.length / 700);
    links.forEach((l, n) => { if (n % step === 0) G.line(X(l[0]), Y(l[0]), X(l[1]), Y(l[1]), '#22315c'); });
  }
  for (let i = 0; i < P.length / 2; i++) {
    const x = X(i), y = Y(i);
    if (x < PX + 1 || x > PX + PW - 3 || y < PY + 1 || y > PY + PH - 3) continue;
    R(x - 1, y - 1, 2, 2, RAMP[level[i]]);
  }
  T(running ? 'DRAWING' : 'RANDOM SEED ' + seed, PX + 3, PY + 3, running ? C.amber : C.steel);
  if (running) { R(PX + 50, PY + 6, 60, 3, C.slate); R(PX + 50, PY + 6, Math.round(60 * L.it / L.total), 3, C.amber); }
}

function dots(m, x, y, w, h, colour, size) {
  const f = fit(m.P, x, y, w, h);
  for (let i = 0; i < m.P.length / 2; i++) R(f.ox + m.P[2 * i] * f.s, f.oy + m.P[2 * i + 1] * f.s, size, size, colour(i));
}
/* the last two maps side by side, every cell in the colour of its true type */
function drawPair() {
  const cl = G.cloud, a = maps[maps.length - 2], b = maps[maps.length - 1], h = phase === 'quiz' ? 90 : 110;
  [a, b].forEach((m, i) => {
    const x = PX + i * 92;
    R(x - 1, PY - 1, 90, h + 2, C.slate); R(x, PY, 88, h, '#0e1630');
    dots(m, x + 6, PY + 14, 76, h - 22, n => cl.TYPES[cl.cells[n].type].col, 2);
    T('SEED ' + m.seed, x + 3, PY + 3, C.steel);
  });
}

function drawSide() {
  const x = SX, w = SW, cl = G.cloud;
  G.panel(x, 14, w, phase === 'quiz' ? 94 : 114, { border: C.slate, fill: '#0e1630' });
  if (phase === 'quiz' || phase === 'result') {
    T('TRUE CELL TYPES', x + 6, 18, C.mist);
    cl.TYPES.forEach((t, i) => { R(x + 6, 32 + i * 10, 4, 4, t.col); T(i === 4 ? 'RARE CELLS' : t.name, x + 13, 30 + i * 10, C.fog); });
    if (phase === 'result') { R(x + 5, 84, w - 10, 1, C.slate); G.stars(x + 6, 92, res.stars); T(wrong ? wrong + ' WRONG' : 'FIRST TRY', x + w - 6, 92, C.steel, { a: 'right' }); }
    else T('SAME CELLS, TWO MAPS', x + 6, 88, C.steel);
    return;
  }
  T('MAPS DRAWN', x + 6, 18, C.mist); T(String(maps.length), x + w - 6, 18, C.fog, { a: 'right' });
  for (let i = 0; i < 3; i++) {
    const bx = x + 6 + i * 39, m = maps[i];
    R(bx, 29, 36, 28, m ? C.slate : '#1c2748'); R(bx + 1, 30, 34, 26, '#0b1122');
    if (m) dots(m, bx + 3, 32, 30, 22, n => RAMP[level[n]], 1);
  }
  R(x + 5, 63, w - 10, 1, C.slate);
  T('CELLS COLOURED BY', x + 6, 68, C.fog); T(COLOURS[ci][0], x + 6, 78, C.amber, { f: 'smb' });
  T('LOW', x + 6, 92, RAMP[1]); for (let i = 0; i < 4; i++) R(x + 28 + i * 6, 94, 5, 4, RAMP[i]); T('HIGH', x + 56, 92, RAMP[3]);
  R(x + 5, 105, w - 10, 1, C.slate);
  T(links.length + ' LINKS IN THE GRAPH', x + 6, 111, C.steel);
}
})();
