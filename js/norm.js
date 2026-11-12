/* Station 2-1, the Leveller. Normalisation. The cells are drawn on the first two principal
   components of the count matrix in cloud.js. Before normalisation that picture is arranged by
   sequencing depth. The player switches on the two steps of the standard normalisation (divide
   each cell by its total count, then take logs) and watches what each one does. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 180, PH = 110, SX = 190, SW = 126;
const RAMP = ['#22355f', '#3f6fa8', '#7fc4e8', '#ffffff'];

const TOUR = [
  { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'Each dot is a cell. Similar cells sit together. Bright dots were sequenced deeply: more RNA was counted in them.' },
  { spot: [SX, 14, SW, 114], say: 'Right now depth decides where a cell sits, not its type. The bars compare a deep and a shallow monocyte.' },
  { spot: [0, 130, VW, 50], say: 'Flip the two switches and watch what changes. When both meters are green, press CHECK.' },
];

let phase, beats, depthOn, logOn, sel, pts, met, res, rsel, checks, lastSync, mono, vals, level;

function compute() {
  const cl = G.cloud, M = cl.normalise({ depth: depthOn, log: logOn }), all = cl.genes.map((g, j) => j);
  const pc = cl.pca(M, all, 6, false), S = pc.S;
  /* the sign of a principal component is arbitrary: fix it so the picture does not flip between settings */
  [0, 1].forEach(c => { let m = 0; S.forEach((s, i) => { if (cl.cells[i].type === (c ? 2 : 3)) m += s[c]; }); if (m < 0) S.forEach(s => { s[c] = -s[c]; }); });
  const lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
  S.forEach(s => { for (let c = 0; c < 2; c++) { lo[c] = Math.min(lo[c], s[c]); hi[c] = Math.max(hi[c], s[c]); } });
  S.forEach((s, i) => {
    pts[i].tx = PX + 8 + (s[0] - lo[0]) / (hi[0] - lo[0] || 1) * (PW - 16);
    pts[i].ty = PY + PH - 10 - (s[1] - lo[1]) / (hi[1] - lo[1] || 1) * (PH - 24);
    if (pts[i].x === undefined) { pts[i].x = pts[i].tx; pts[i].y = pts[i].ty; }
  });
  /* how much of the first components is explained by depth, and by the per-cell level of the
     most abundant genes (squared correlation) */
  const ld = cl.cells.map(c => Math.log(c.depth)), lr = cl.cells.map(c => Math.log(c.ribo));
  const mx = (v, d) => Math.max.apply(null, Array.from({ length: d }, (_, c) => cl.r2(S.map(s => s[c]), v)));
  const pu = cl.purity(S, 6);
  met = { depth: mx(ld, 4), ribo: mx(lr, 2), by: pu.by, common: Math.min(pu.by[0], pu.by[1], pu.by[2], pu.by[3]) };
  met.okD = met.depth < 0.25; met.okR = met.ribo < 0.5; met.okP = met.common >= 0.95;
  const genes = ['LYZ', 'S100A9', 'CST3', 'ACTB', 'RPL13'].map(nm => cl.genes.findIndex(g => g.name === nm));
  vals = mono.map(i => genes.map(j => M[i][j]));
}

function verdict() {
  if (res.pass) return 'Each group is one cell type now. Depth no longer shapes the picture. The 8 rare cells are a job for the next station.';
  if (!met.okD) return 'Depth still decides where the cells sit. Switch on DIVIDE BY DEPTH.';
  if (!met.okR) return 'Depth is gone, but a few very abundant genes have taken over. Switch on TAKE LOGS. Logs shrink large values.';
  return 'The cell types still overlap. Use both steps.';
}

function sync() {
  const key = [phase, depthOn, logOn].join('|');
  if (key === lastSync) return;
  lastSync = key;
  G.params.depth = depthOn ? 'on' : 'off'; G.params.logt = logOn ? 'on' : 'off';
  G.book.sync();
}

function showBook() {
  G.book.show({
    floor: 'Floor 2 · Station 2-1', room: 'The Leveller', aim: 'Remove the effect of sequencing depth, so that the differences left between cells are biological.',
    codeFirst: true, file: 'js/norm.js',
    goals: [
      { id: 'depth', text: 'Sequencing depth explains less than 25% of the picture' },
      { id: 'ribo', text: 'A few abundant genes explain less than 50% of it' },
      { id: 'kind', text: 'Each of the four large cell types forms its own group' },
    ],
    notes: [
      { id: 'n-what', open: true, html: '<b>Sequencing depth</b> is the number of RNA molecules counted in a cell. A cell sequenced twice as deeply has about twice the counts for every gene. Until that is removed, depth is the largest difference between cells.' },
      { id: 'n-depth', html: '<b>Step 1.</b> Divide each cell\'s counts by the cell\'s total, then multiply by a common number (here the median total). Two cells of the same type now have similar values, however deeply each was sequenced.' },
      { id: 'n-log', html: '<b>Step 2.</b> Take log(1 + x). Without it, the few most abundant genes have by far the largest values and dominate every comparison between cells.' },
      { id: 'n-alt', html: 'These two steps are the most common default. Other methods model depth more carefully, for example <b>scran</b> size factors and <b>Pearson residuals</b> (sctransform). Benchmarks have not found one method that is best for every task.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'The dimmed lines are the steps you have switched off.',
      tabs: [
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          '<span class="c"># keep the raw counts: later steps need them</span>\n' +
          'adata.layers[<span class="s">"counts"</span>] = adata.X.copy()\n\n' +
          '<span class="hl" data-on="depth=on"><span class="c"># divide by depth, scale to the median total</span>\n' +
          'sc.pp.<span class="k">normalize_total</span>(adata)</span>\n\n' +
          '<span class="hl" data-on="logt=on"><span class="c"># log(1 + x)</span>\n' +
          'sc.pp.<span class="k">log1p</span>(adata)</span></pre>' },
        { id: 'se', label: 'R · Seurat', html:
          '<pre class="code"><span class="k">library</span>(Seurat)\n' +
          '<span class="c"># both steps in one call</span>\n' +
          'obj &lt;- <span class="k">NormalizeData</span>(obj,\n    normalization.method = <span class="s">"LogNormalize"</span>,\n    scale.factor = 10000)\n\n' +
          '<span class="c"># or model depth with Pearson residuals</span>\n' +
          'obj &lt;- <span class="k">SCTransform</span>(obj)</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="c"># CyteArc selects the variable genes first\n# (station 2-2), then normalises by library\n# size over those genes and takes logs</span>\n' +
          'features   = ds.features.<span class="k">hvgs</span>(cells)\n' +
          'normalized = ds.features.<span class="k">normalize</span>(cells, features)</pre>' },
      ],
    },
  });
}

function check() {
  checks++; G.state.tries.norm++; G.save();
  const pass = met.okD && met.okR && met.okP;
  res = { pass, stars: pass ? (checks <= 1 ? 3 : checks === 2 ? 2 : 1) : 0 };
  phase = 'result'; rsel = pass ? 1 : 0;
  G.book.goal('depth', met.okD); G.book.goal('ribo', met.okR); G.book.goal('kind', met.okP);
  G.book.unlock('n-depth'); if (depthOn) G.book.unlock('n-log'); if (pass) G.book.unlock('n-alt');
  G.sfx(pass ? 'star' : 'bad');
}
function retry() { phase = 'set'; res = null; ['depth', 'ribo', 'kind'].forEach(g => G.book.goal(g, null)); }
function keep() {
  const s = G.state;
  s.cloud = Object.assign({}, s.cloud, { depth: true, log: true });
  s.rooms.norm = { done: true, stars: Math.max(s.rooms.norm.stars, res.stars) };
  G.save();
  G.go('corridor', { from: 'norm', toast: 'COUNTS NORMALISED' });
}
function toggle(i) { if (i === 0) depthOn = !depthOn; else logOn = !logOn; compute(); G.sfx('tick'); }

G.scenes.norm = {
  phase: () => phase,
  enter() {
    const cl = G.cloud; cl.build();
    pts = cl.cells.map(() => ({}));
    /* a deep and a shallow monocyte, and each cell's depth as one of four brightness levels */
    const ms = cl.cells.map((c, i) => [c.depth, i, c.type]).filter(c => c[2] === 3).sort((a, b) => b[0] - a[0]);
    mono = [ms[2][1], ms[ms.length - 3][1]];
    const ld = cl.cells.map(c => Math.log(c.depth)), lo = Math.min.apply(null, ld), hi = Math.max.apply(null, ld);
    level = ld.map(v => Math.min(3, Math.floor((v - lo) / (hi - lo) * 4)));
    depthOn = false; logOn = false; sel = 0; res = null; rsel = 0; checks = 0; lastSync = null;
    compute();
    beats = new G.Beats(TOUR);
    phase = G.state.tries.norm > 0 ? 'set' : 'intro';
    showBook(); sync();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'norm' }); return; }
    pts.forEach(p => { p.x += (p.tx - p.x) * Math.min(1, dt * 7); p.y += (p.ty - p.y) * Math.min(1, dt * 7); });
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'set'; }
    else if (phase === 'set') {
      if (G.hit('up')) sel = (sel + 2) % 3;
      if (G.hit('down')) sel = (sel + 1) % 3;
      if (sel < 2 && (G.hit('left') || G.hit('right'))) toggle(sel);
      if (G.hit('a')) { if (sel < 2) toggle(sel); else check(); }
    } else if (phase === 'result') {
      const r = G.resultKeys(rsel, res.pass); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') retry();
    }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#0b1122');
    drawPlot(); drawSide();
    G.roomHeader('2-1  THE LEVELLER', C.cyan, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, verdict(), res.pass, rsel, 'TRY AGAIN', 'KEEP THIS MATRIX');
      if (act === 'keep') keep(); else if (act === 'retry') retry();
      return;
    }
    G.strip(y0);
    const sw = (i, y, label, on) => {
      T(label, 14, y + 2, sel === i ? C.white : C.mist);
      if (sel === i && Math.floor(G.t * 3) % 2 === 0) T('>', 6, y + 2, C.cyan);
      ['ON', 'OFF'].forEach((txt, k) => {
        const bx = 120 + k * 58, act = (k === 0) === on, over = G.over(bx, y, 54, 13);
        if (over && G.ptr.pressed && !act) { sel = i; toggle(i); }
        G.panel(bx, y, 54, 13, { border: act ? C.amber : over ? C.cyan : C.slate, fill: act ? '#3a2f12' : C.ink });
        T(txt, bx + 27, y + 2, act ? C.amber : C.mist, { a: 'center' });
      });
    };
    sw(0, y0 + 6, 'DIVIDE BY DEPTH', depthOn);
    sw(1, y0 + 24, 'TAKE LOGS', logOn);
    if (G.button('chk', 250, y0 + 8, 62, 28, 'CHECK', { primary: true, focus: sel === 2 })) check();
    /* an arrow at the next thing to press */
    if (phase === 'set') { if (!depthOn) G.cue(118, y0 + 12); else if (!logOn) G.cue(118, y0 + 30); else G.cue(281, y0 + 7, true); }
    if (phase === 'intro') beats.draw();
  },
};

function drawPlot() {
  const cl = G.cloud, shown = phase === 'result';
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  T('PC 2', PX + 3, PY + 3, C.steel); T('PC 1', PX + PW - 3, PY + PH - 10, C.steel, { a: 'right' });
  pts.forEach((p, i) => R(p.x - 1, p.y - 1, 2, 2, shown ? cl.TYPES[cl.cells[i].type].col : RAMP[level[i]]));
  if (!shown) {
    /* the colour key */
    T('DEPTH:', PX + 34, PY + 3, C.steel); T('LOW', PX + 70, PY + 3, RAMP[1]);
    for (let k = 0; k < 4; k++) R(PX + 92 + k * 6, PY + 5, 5, 4, RAMP[k]);
    T('HIGH', PX + 119, PY + 3, RAMP[3]);
  }
}

function drawSide() {
  const x = SX, w = SW, cl = G.cloud;
  G.panel(x, 14, w, 114, { border: C.slate, fill: '#0e1630' });
  if (phase === 'result') {
    T('NEIGHBOURS OF THE', x + 6, 18, C.mist); T('SAME CELL TYPE', x + 6, 27, C.mist);
    cl.TYPES.forEach((t, i) => {
      const y = 40 + i * 11, v = met.by[i];
      R(x + 6, y + 2, 4, 4, t.col); T(i === 4 ? 'RARE CELLS' : t.name, x + 13, y, C.fog);
      T(i === 4 ? 'LATER' : Math.floor(v * 100) + '%', x + w - 6, y, i === 4 ? C.steel : v >= 0.95 ? C.mint : C.coral, { a: 'right' });
    });
    R(x + 5, 98, w - 10, 1, C.slate);
    if (res.pass) { G.stars(x + 6, 106, res.stars); T(checks + (checks === 1 ? ' CHECK' : ' CHECKS'), x + w - 6, 106, C.steel, { a: 'right' }); }
    else T('AIM: 95% OR MORE', x + 6, 106, C.steel);
    return;
  }
  T('CELL POSITIONS ARE', x + 6, 18, C.mist); T('EXPLAINED BY', x + 6, 27, C.mist);
  const bar = (y, label, v, ok, aim) => {
    T(label, x + 6, y, C.fog); T(Math.round(v * 100) + '%', x + w - 6, y, ok ? C.mint : C.coral, { a: 'right', f: 'smb' });
    R(x + 6, y + 10, w - 12, 3, C.slate); R(x + 6, y + 10, Math.round((w - 12) * Math.min(1, v)), 3, ok ? C.mint : C.coral);
    T(aim, x + 6, y + 15, C.steel);
  };
  bar(38, 'SEQUENCING DEPTH', met.depth, met.okD, 'AIM: UNDER 25%');
  bar(63, 'ABUNDANT GENES', met.ribo, met.okR, 'AIM: UNDER 50%');
  R(x + 5, 87, w - 10, 1, C.slate);
  T('TWO MONOCYTES', x + 6, 90, C.mist);
  const top = Math.max.apply(null, vals[0].concat(vals[1])) || 1;
  vals.forEach((v, k) => {
    const bx = x + 8 + k * 60;
    v.forEach((q, j) => { const h = Math.round(q / top * 16); R(bx + j * 9, 117 - h, 7, h, k ? C.amber : '#d99a2e'); });
    R(bx - 1, 117, 46, 1, C.slate);
    T(k ? 'SHALLOW' : 'DEEP', bx, 119, C.steel);
  });
}
})();
