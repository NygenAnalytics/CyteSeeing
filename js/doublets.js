/* Room 1-5, the doublet hunt. The doublets loaded in room 1-1 are hiding among the cells.
   The player makes artificial doublets from random pairs of cells, scores every real cell by the
   share of fakes among its nearest neighbours, and picks a cut-off. Same-type doublets cannot be
   caught this way, and cells in a real transition also sit between clusters. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;

const EX = 6, EY = 14, EW = 186, EH = 112, K = 12, NG = 150, SX = 198, SW = 118, HX = SX + 13;
const CL = [
  { x: 58, y: 44, sd: 9.5, n: 60, c: C.cyan }, { x: 150, y: 38, sd: 8, n: 34, c: C.lilac },
  { x: 146, y: 98, sd: 9.5, n: 46, c: C.amber }, { x: 56, y: 106, sd: 6.5, n: 26, c: C.mint },
];
const NAMES = [['T', 12, 18, 'left'], ['B', 186, 18, 'right'], ['MONO', 186, 116, 'right'], ['NK', 12, 116, 'left']];

const INTRO = [
  { say: 'Remember the doublets from room 1-1? They were called as cells. They passed QC. They are in this room.' },
  { say: 'A doublet of two different cell types carries both sets of genes. On the map it lands between two clusters.' },
  { say: 'So make some on purpose. Add two random cells together, many times over, and see where the fakes land.' },
  { say: 'Then score each real cell: how many of its neighbours are fakes? Remove the high scorers. Spare the innocent.' },
];

let phase, beats, pt, cells, ghosts, thr, res, rsel, lastSync, rate, nd, hist;

function build() {
  const ld = G.state.load;
  rate = ld ? ld.rate : 0.036;
  const rnd = G.rng(51 + Math.round(rate * 1000));
  const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) / 0.7071; };
  const c = [];
  CL.forEach((k, ci) => { for (let i = 0; i < k.n; i++) c.push({ x: k.x + gauss() * k.sd, y: k.y + gauss() * k.sd, kind: 's', from: ci }); });
  /* cells in a real transition between T and NK: between clusters, and not doublets */
  for (let i = 0; i < 10; i++) { const f = 0.12 + 0.76 * i / 9; c.push({ x: G.lerp(58, 56, f) + gauss() * 2.5, y: G.lerp(58, 97, f) + gauss() * 2, kind: 't', from: 0 }); }
  const singles = c.slice(0, 166);
  /* the more you loaded per lane, the more of these there are */
  nd = G.clamp(Math.round(rate * 250), 4, 24);
  for (let i = 0; i < nd; i++) {
    const a = singles[Math.floor(rnd() * 166)];
    if (i % 4 === 3) { c.push({ x: a.x + gauss() * 3, y: a.y + gauss() * 3, kind: 'hom', from: a.from }); continue; }
    let b = a, guard = 0;
    while (b.from === a.from && guard++ < 50) b = singles[Math.floor(rnd() * 166)];
    c.push({ x: (a.x + b.x) / 2 + gauss() * 2.5, y: (a.y + b.y) / 2 + gauss() * 2.5, kind: 'het', from: a.from });
  }
  c.forEach(o => {
    o.x = G.clamp(o.x, EX + 3, EX + EW - 3); o.y = G.clamp(o.y, EY + 3, EY + EH - 3); o.score = 0;
    /* coloured by its nearest cluster, the way a clustering would label it */
    let best = 1e9; CL.forEach((k, i) => { const d = (o.x - k.x) * (o.x - k.x) + (o.y - k.y) * (o.y - k.y); if (d < best) { best = d; o.cl = i; } });
  });
  cells = c; ghosts = [];
  /* the fakes: midpoints of random pairs, which is where the sum of two cells lands on a map */
  for (let i = 0; i < NG; i++) {
    const a = c[Math.floor(rnd() * c.length)], b = c[Math.floor(rnd() * c.length)];
    ghosts.push({ x: (a.x + b.x) / 2 + gauss() * 2, y: (a.y + b.y) / 2 + gauss() * 2, a, b, at: 0.2 + 2.0 * i / NG });
  }
  /* each real cell's score: the share of fakes among its K nearest neighbours */
  hist = new Array(K + 1).fill(0);
  c.forEach(o => {
    const d = [];
    ghosts.forEach(g => d.push([(o.x - g.x) * (o.x - g.x) + (o.y - g.y) * (o.y - g.y), 1]));
    c.forEach(p => { if (p !== o) d.push([(o.x - p.x) * (o.x - p.x) + (o.y - p.y) * (o.y - p.y), 0]); });
    d.sort((p, q) => p[0] - q[0]);
    let n = 0; for (let i = 0; i < K; i++) n += d[i][1];
    o.score = n / K; hist[n]++;
  });
}
const flagged = o => o.score >= thr - 1e-9;

function measure() {
  let het = 0, hetC = 0, hom = 0, homC = 0, fp = 0, tr = 0, n = 0;
  cells.forEach(o => {
    const f = flagged(o); if (f) n++;
    if (o.kind === 'het') { het++; if (f) hetC++; } else if (o.kind === 'hom') { hom++; if (f) homC++; }
    else if (f) { fp++; if (o.kind === 't') tr++; }
  });
  const caught = het ? hetC / het : 1, fpr = fp / 176;
  return { het, hetC, hom, homC, fp, tr, n, caught, missed: het - hetC + hom - homC,
    stars: caught >= 0.8 && fp <= 2 ? 3 : caught >= 0.65 && fp <= 6 ? 2 : caught >= 0.5 && fp <= 12 ? 1 : 0, okC: caught >= 0.8, okF: fp <= 2, fpr };
}

function sync() {
  const key = phase + '|' + thr;
  if (key === lastSync) return;
  lastSync = key;
  G.params.dbr = rate.toFixed(3); G.params.thr = thr.toFixed(2);
  G.book.sync();
}

function showBook() {
  const num = w => '<input class="p" data-p="thr" id="d-thr-' + w + '" type="number" step="0.05" min="0.3" max="1" inputmode="decimal" aria-label="score cut-off">';
  const dbr = '<span class="p" data-b="dbr"></span>';
  G.book.show({
    floor: 'Ground floor · Room 1-5', room: 'The doublet hunt', codeFirst: true,
    goals: [
      { id: 'catch', text: 'Catch at least 80% of the two-type doublets' },
      { id: 'spare', text: 'Remove no more than 2 innocent cells' },
    ],
    notes: [
      { id: 'x-what', open: true, html: 'A doublet of two different cell types shows <b>both marker sets</b> and sits between clusters. Left in, it can pass for a new cell type.' },
      { id: 'x-sim', html: 'Doublet callers build <b>artificial doublets</b> from random pairs of cells, then score each real cell by the share of fakes among its nearest neighbours.' },
      { id: 'x-rate', html: 'Check the number you flag against the rate you expect from loading: about <b>0.8% per 1,000 cells</b>. Run the caller on <b>each lane by itself</b>, never on lanes pooled together.' },
      { id: 'x-homo', html: 'Doublets of two cells of the <b>same type</b> are close to invisible: they look like one large cell. And cells in a real transition also sit between clusters. Do not flag everything in between.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'The expected rate comes from your loading in room 1-1. The <b>cut-off</b> is live.',
      tabs: [
        { id: 'sd', label: 'R · scDblFinder', html:
          '<pre class="code"><span class="k">library</span>(scDblFinder)\n' +
          '<span class="c"># one lane at a time; picks its own cut-off\n# from the expected rate</span>\n' +
          'sce &lt;- <span class="k">scDblFinder</span>(sce, samples = <span class="s">"lane"</span>,\n                   dbr = ' + dbr + ')\n' +
          '<span class="k">table</span>(sce$scDblFinder.class)\n' +
          'sce &lt;- sce[, sce$scDblFinder.class == <span class="s">"singlet"</span>]</pre>' },
        { id: 'sr', label: 'Python · Scrublet', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n' +
          'sc.pp.<span class="k">scrublet</span>(\n    adata, batch_key=<span class="s">"lane"</span>,\n    expected_doublet_rate=' + dbr + ',\n    threshold=' + num('sr') + ')\n' +
          'adata = adata[~adata.obs.predicted_doublet].copy()</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code">doublets = ds.qc.<span class="k">doublets</span>(\n    cluster_ref, graph_ref,\n    sample_column=<span class="s">"lane"</span>,\n    expected_doublet_rate=' + dbr + ',\n    threshold=' + num('ca') + ')\n\n' +
          'singlets = ds.<span class="k">select_cells</span>(\n    doublets, value=<span class="s">"predicted_doublets"</span>,\n    include=[False])</pre>' },
        { id: 'se', label: 'Seurat', html:
          '<pre class="code"><span class="c"># Seurat has no doublet caller of its own.\n# Convert, and use scDblFinder.</span>\n' +
          'sce &lt;- <span class="k">as.SingleCellExperiment</span>(obj)\n' +
          'sce &lt;- <span class="k">scDblFinder</span>(sce, samples = <span class="s">"lane"</span>)\n' +
          'obj$doublet &lt;- sce$scDblFinder.class</pre>' },
      ],
    },
  });
  G.book.onParam = (k, v) => { if (k === 'thr' && phase === 'score') { thr = G.clamp(Math.round(v * 20) / 20, 0.3, 1); lastSync = null; } };
}

function simulate() { phase = 'sim'; pt = 0; G.book.unlock('x-sim'); G.sfx('ok'); }
function remove() {
  G.state.tries.doublet++; G.save();
  res = measure(); phase = 'result'; rsel = res.stars ? 1 : 0;
  G.book.goal('catch', res.okC); G.book.goal('spare', res.okF);
  G.book.unlock('x-homo');
  G.sfx(res.stars ? 'star' : 'bad');
}
function retry() { phase = 'score'; res = null; ['catch', 'spare'].forEach(g => G.book.goal(g, null)); }
function keep() {
  const s = G.state, per = (s.load ? s.load.R : 4500) / 176;
  s.dbl = { removed: Math.round(res.n * per), missed: Math.round(res.missed * per / 2), fp: res.fp, thr: thr.toFixed(2) };
  s.rooms.doublet = { done: true, stars: Math.max(s.rooms.doublet.stars, res.stars) };
  G.save();
  G.go('corridor', { from: 'doublet', toast: res.missed ? res.missed + ' DOUBLETS GOT AWAY. THEY ALWAYS DO.' : 'A CLEAN SWEEP' });
}

G.scenes.doublet = {
  phase: () => phase,
  /* test hook: the outcome at every cut-off */
  sweep() { const keepThr = thr, out = []; for (let t = 0.3; t <= 1.001; t += 0.05) { thr = t; const m = measure(); out.push([t.toFixed(2), m.hetC + '/' + m.het, m.fp, m.stars]); } thr = keepThr; return { nd, out }; },
  enter() {
    build();
    thr = 0.5; pt = 0; res = null; rsel = 0; lastSync = null;
    beats = new G.Beats(INTRO);
    phase = G.state.tries.doublet > 0 ? 'score' : 'intro';
    showBook(); sync();
  },
  leave() { G.book.onParam = null; },
  update(dt) {
    pt += dt;
    if (G.hit('b') && phase !== 'sim') { G.go('corridor', { from: 'doublet' }); return; }
    if (phase === 'intro') { if (beats.update(dt) === 'done') { phase = 'ready'; pt = 0; } }
    else if (phase === 'ready') { if (G.hit('a')) simulate(); }
    else if (phase === 'sim') { if (pt > 2.9 || (G.skip() && pt > 0.3) || G.reduced) { phase = 'score'; pt = 0; G.book.unlock('x-rate'); } }
    else if (phase === 'score') {
      const step = (G.rep('right') ? 1 : 0) - (G.rep('left') ? 1 : 0);
      if (step) { thr = G.clamp(Math.round((thr + step * 0.05) * 20) / 20, 0.3, 1); G.sfx('tick'); }
      if (G.ptr.down && G.over(HX - 3, 28, 98, 58) && !G.uiBusy()) thr = G.clamp(Math.round((G.ptr.x - HX) / 92 * 20) / 20, 0.3, 1);
      if (G.hit('a')) remove();
    } else if (phase === 'result') {
      const r = G.resultKeys(rsel, res.stars > 0); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') retry();
    }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#0b1122');
    drawMap(); drawSide();
    G.roomHeader('1-5  DOUBLET HUNT', C.pink, phase !== 'sim');
    const y0 = 130;
    if (phase === 'intro') beats.draw();
    else if (phase === 'ready') {
      G.strip(y0);
      T('DOUBLETS HIDE BETWEEN THE CLUSTERS. BUT WHERE, EXACTLY?', 14, y0 + 7, C.fog);
      T('MAKE SOME FAKE ONES AND WATCH WHERE THEY LAND.', 14, y0 + 17, C.mist);
      if (G.button('sim', 14, y0 + 29, 150, 15, 'MAKE FAKE DOUBLETS', { primary: true, focus: true })) simulate();
    } else if (phase === 'sim') {
      G.strip(y0);
      T('ADDING RANDOM PAIRS OF CELLS TOGETHER', 14, y0 + 8, C.white, { f: 'smb' });
      R(14, y0 + 22, 240, 6, C.slate); R(14, y0 + 22, Math.round(240 * G.clamp(pt / 2.4, 0, 1)), 6, C.pink);
      T(G.kt('SPACE: SKIP', 'TAP: SKIP'), 306, y0 + 36, C.steel, { a: 'right' });
    } else if (phase === 'score') {
      G.strip(y0);
      T('CUT-OFF: SHARE OF FAKE NEIGHBOURS', 14, y0 + 5, C.mist);
      thr = G.slider('thr', 14, y0 + 22, 176, thr, 0.3, 1, 0.05, { focus: true, c: C.coral });
      T(thr.toFixed(2), 240, y0 + 17, C.coral, { a: 'right', f: 'lg' });
      T(G.kt('LEFT AND RIGHT MOVE THE CUT-OFF', 'DRAG THE CUT-OFF, HERE OR ON THE BARS'), 14, y0 + 36, C.steel);
      if (G.button('rm', 250, y0 + 6, 64, 28, 'REMOVE', { primary: true, fill: '#b94a45', accent: C.coral, focus: true })) remove();
    } else {
      const msg = res.stars === 3 ? (res.missed ? 'Clean. The ' + res.missed + ' that got away are mostly same-type doublets. Nobody catches those.' : 'Every catchable doublet caught, and nobody innocent removed.')
        : !res.okF ? (res.tr ? 'You removed real cells. Some were in a transition between two types, not doublets.' : 'Too greedy. You removed cells from the middle of healthy clusters.')
        : 'Too cautious. Doublets are still in, waiting to be named as a new cell type.';
      const act = G.resultDraw(y0, msg, res.stars > 0, rsel, 'MOVE THE CUT-OFF', 'KEEP THESE CELLS');
      if (act === 'keep') keep(); else if (act === 'retry') retry();
    }
  },
};

function drawMap() {
  R(EX - 1, EY - 1, EW + 2, EH + 2, C.slate); R(EX, EY, EW, EH, '#0e1630');
  CL.forEach((k, i) => T(NAMES[i][0], NAMES[i][1], NAMES[i][2], k.c, { a: NAMES[i][3] }));
  const simT = phase === 'sim' ? pt : phase === 'score' || phase === 'result' ? 99 : -1, blink = Math.floor(G.t * 4) % 2 === 0;
  if (simT >= 0) ghosts.forEach(g => {
    const age = simT - g.at;
    if (age < 0) return;
    if (age < 0.25) { G.line(g.a.x, g.a.y, g.x, g.y, 'rgba(242,154,194,.5)'); G.line(g.b.x, g.b.y, g.x, g.y, 'rgba(242,154,194,.5)'); }
    R(g.x - 1, g.y - 1, 3, 3, phase === 'sim' ? '#8a6f9e' : '#4b4468'); R(g.x, g.y, 1, 1, '#0e1630');
  });
  cells.forEach(o => {
    const col = CL[o.cl].c, f = (phase === 'score' || phase === 'result') && flagged(o), dbl = o.kind === 'het' || o.kind === 'hom';
    if (phase === 'result') {
      if (f && dbl) { G.line(o.x - 2, o.y - 2, o.x + 2, o.y + 2, C.coral); G.line(o.x - 2, o.y + 2, o.x + 2, o.y - 2, C.coral); return; }
      R(o.x - 1, o.y - 1, 2, 2, f ? C.white : col);
      if (f && blink) G.ring(o.x, o.y, 3, C.mint);
      if (!f && dbl && blink) G.ring(o.x, o.y, 3, C.amber);
      return;
    }
    R(o.x - 1, o.y - 1, 2, 2, col);
    if (f) G.ring(o.x, o.y, 3, C.coral);
  });
  if (phase === 'sim' || phase === 'score') T('HOLLOW: FAKES', EX + EW / 2, EY + 3, '#8a6f9e', { a: 'center' });
}

function drawSide() {
  const x = SX, w = SW;
  G.panel(x, 14, w, 114, { border: C.slate, fill: '#0e1630' });
  if (phase === 'intro' || phase === 'ready' || phase === 'sim') {
    T('CELLS IN THE ROOM', x + 6, 18, C.mist); T(String(cells.length), x + 6, 27, C.white, { f: 'smb' });
    T('YOU LOADED AT', x + 6, 44, C.mist); T((rate * 100).toFixed(1) + '% DOUBLETS', x + 6, 53, C.pink, { f: 'smb' });
    T('SO EXPECT ABOUT', x + 6, 70, C.mist); T(nd + ' IN HERE', x + 6, 79, C.pink, { f: 'smb' });
    T(rate <= 0.03 ? 'GENTLE LOADING' : rate >= 0.045 ? 'HEAVY LOADING' : 'FROM OUTSIDE THEY', x + 6, 100, C.steel);
    T(rate <= 0.03 ? 'PAYS OFF HERE.' : rate >= 0.045 ? 'COSTS YOU HERE.' : 'LOOK LIKE CELLS.', x + 6, 109, C.steel);
    return;
  }
  if (phase === 'score') {
    T('DOUBLET SCORES', x + 6, 18, C.mist);
    const bx = HX, by = 84;
    for (let i = 0; i <= K; i++) { const h = Math.min(50, Math.round(7 * Math.sqrt(hist[i]))), on = i / K >= thr - 1e-9; R(bx + i * 7, by - h, 6, h, on ? C.coral : C.steel); }
    R(bx, by, 92, 1, C.slate);
    const tx = bx + Math.round(thr * 92);
    R(tx, 28, 1, by - 28, C.white); R(tx - 2, 26, 5, 3, C.white);
    T('0', bx, by + 3, C.steel); T('1', bx + 88, by + 3, C.steel); T('SHARE OF FAKES', bx + 46, by + 3, C.steel, { a: 'center' });
    const n = cells.filter(flagged).length;
    T('FLAGGED', x + 6, 100, C.mist); T(String(n), x + 58, 100, C.coral, { f: 'smb' });
    T('EXPECTED', x + 6, 111, C.mist); T('ABOUT ' + nd, x + 58, 111, C.pink, { f: 'smb' });
    return;
  }
  const s = res;
  T('TWO-TYPE DOUBLETS', x + 6, 18, C.mist);
  T(s.hetC + ' OF ' + s.het + ' CAUGHT', x + 6, 27, s.okC ? C.mint : C.coral, { f: 'smb' });
  T('INNOCENT CELLS', x + 6, 43, C.mist);
  T(s.fp + ' REMOVED', x + 6, 52, s.okF ? C.mint : C.coral, { f: 'smb' });
  T('SAME-TYPE ONES', x + 6, 68, C.mist);
  T((s.hom - s.homC) + ' OF ' + s.hom + ' ESCAPED', x + 6, 77, C.amber, { f: 'smb' });
  R(x + 5, 90, w - 10, 1, C.slate);
  G.stars(x + 6, 95, s.stars);
  T('X CAUGHT  O MISSED', x + 6, 110, C.steel);
}
})();
