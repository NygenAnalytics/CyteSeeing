/* Room 1-3, the QC gate. Each called cell is a dot: genes detected across, mitochondrial share up.
   The player sets a minimum number of genes and a maximum mitochondrial share. The lines start at
   values copied from a tutorial, which lose healthy cells here. Lenient cut-offs read off the data,
   by hand or as a number of MADs from the median, keep the small populations. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;

const PX = 34, PY = 18, PW = 190, PH = 92, GLO = Math.log10(50), GHI = Math.log10(8000), MMAX = 60;
const gx = g => PX + (Math.log10(G.clamp(g, 50, 8000)) - GLO) / (GHI - GLO) * PW;
const my = m => PY + PH - Math.sqrt(G.clamp(m, 0, MMAX) / MMAX) * PH;
const invGx = x => Math.pow(10, GLO + (x - PX) / PW * (GHI - GLO));
const invMy = y => Math.pow(G.clamp((PY + PH - y) / PH, 0, 1), 2) * MMAX;
const KIND = {
  main: { col: C.mint, dim: '#2b6347', healthy: true }, small: { col: C.cyan, dim: '#1f6470', healthy: true },
  busy: { col: C.lilac, dim: '#57488c', healthy: true }, damaged: { col: C.coral, dim: '#6e3230', healthy: false },
  junk: { col: '#d6c9a8', dim: '#5d574a', healthy: false },
};

const INTRO = [
  { say: 'Called cells are not all healthy cells. Some broke open on the way here, and their RNA leaked out.' },
  { say: 'A broken cell keeps its mitochondria. So it shows few genes, and a large share of mitochondrial reads.' },
  { say: 'Each dot is a cell: genes detected across, mitochondrial share up. Healthy cells sit low and to the right.' },
  { say: 'Set the two lines, then filter. Somebody left them at the numbers from a tutorial. For a different tissue.' },
];

let phase, beats, pt, actors, minG, maxM, nmad, sel, stats, rsel, st, drag, lastSync, wc, nSmall;

function build() {
  const rnd = G.rng(17), calls = G.state.calls, a = [];
  const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) / 0.7071; };
  const lu = (lo, hi) => Math.exp(G.lerp(Math.log(lo), Math.log(hi), rnd()));
  /* what you did at the Cliff decides who is in the room */
  nSmall = calls ? G.clamp(Math.round(calls.recall * 176 - 150), 0, 26) : 22;
  /* a little debris gets through any cell caller; empty droplets let in at the Cliff add to it */
  const nJunk = 6 + (calls ? Math.min(12, Math.round(calls.empties * 200)) : 0);
  const add = (kind, n, f) => { for (let i = 0; i < n; i++) { const v = f(); a.push({ kind, g: v[0], m: v[1], keep: true }); } };
  add('main', 150, () => [G.clamp(Math.exp(Math.log(1800) + 0.33 * gauss()), 750, 5200), G.clamp(3.6 + 1.3 * gauss(), 1, 7.5)]);
  add('small', nSmall, () => [lu(260, 640), G.lerp(2.2, 6, rnd())]);
  add('busy', 22, () => [lu(2000, 4500), G.lerp(9, 13, rnd())]);
  add('damaged', 36, () => [lu(110, 760), G.lerp(22, 58, rnd())]);
  add('damaged', 6, () => [lu(500, 1100), G.lerp(15, 21, rnd())]);
  add('junk', nJunk, () => [lu(60, 230), G.lerp(4, 11, rnd())]);
  a.forEach(o => { o.x = gx(o.g); o.y = my(o.m); });
  actors = a;
  wc = (calls ? calls.called : 4400) / a.length;
  /* the median and the scaled MAD of each measure, the way a robust filter sees the data */
  const med = v => { const s = v.slice().sort((p, q) => p - q), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const lg = a.map(o => Math.log(o.g)), mm = a.map(o => o.m);
  st = { lg: med(lg), m: med(mm) };
  st.dlg = 1.4826 * med(lg.map(v => Math.abs(v - st.lg)));
  st.dm = 1.4826 * med(mm.map(v => Math.abs(v - st.m)));
}
const madG = n => Math.round(Math.exp(st.lg - n * st.dlg)), madM = n => Math.round((st.m + n * st.dm) * 10) / 10;
function snap(n) { nmad = n; minG = G.clamp(madG(n), 50, 1700); maxM = G.clamp(madM(n), 2, 40); G.sfx('tick'); }

function measure() {
  const c = { main: [0, 0], small: [0, 0], busy: [0, 0], damaged: [0, 0], junk: [0, 0] };
  actors.forEach(o => { o.keep = o.g >= minG && o.m <= maxM; c[o.kind][0]++; if (o.keep) c[o.kind][1]++; });
  const bad = c.damaged[0] + c.junk[0], badIn = c.damaged[1] + c.junk[1];
  const h = c.main[0] + c.small[0] + c.busy[0], hIn = c.main[1] + c.small[1] + c.busy[1];
  const small = c.small[0] ? c.small[1] / c.small[0] : null, busy = c.busy[1] / c.busy[0];
  const s = { junkOut: 1 - badIn / bad, healthy: hIn / h, small, busy, kept: Math.round((hIn + badIn) * wc), junkIn: Math.round(badIn * wc), removed: Math.round((actors.length - hIn - badIn) * wc) };
  const pop = Math.min(small === null ? 1 : small, busy);
  s.okA = s.junkOut >= 0.9; s.okB = s.healthy >= 0.95; s.okC = pop >= 0.8;
  s.stars = s.okA && s.okB && s.okC ? 3 : s.okA && s.healthy >= 0.9 && pop >= 0.5 ? 2 : s.okA && s.healthy >= 0.8 ? 1 : 0;
  s.lost = busy < 0.5 ? 'busy cells' : small !== null && small < 0.5 ? 'small cells' : '';
  return s;
}

function sync() {
  const key = [phase, minG, maxM, nmad].join('|');
  if (key === lastSync) return;
  lastSync = key;
  G.params.mode = nmad ? 'mad' : 'hand';
  G.params.genes = Math.round(minG); G.params.mito = String(Math.round(maxM * 10) / 10); G.params.nmad = nmad || 5;
  G.book.sync();
}

function showBook() {
  const num = (k, w, step) => '<input class="p" data-p="' + k + '" id="q-' + k + '-' + w + '" type="number" step="' + (step || 1) + '" inputmode="decimal" aria-label="' + k + '">';
  G.book.show({
    floor: 'Ground floor · Room 1-3', room: 'The QC gate', codeFirst: true, file: 'js/qc.js',
    goals: [
      { id: 'junk', text: 'Remove at least 90% of the damaged cells and debris' },
      { id: 'healthy', text: 'Keep at least 95% of the healthy cells' },
      { id: 'pop', text: 'Do not lose a whole population' },
    ],
    notes: [
      { id: 'q-why', open: true, html: 'A damaged cell leaks its cytoplasmic RNA but keeps its mitochondria: <b>few genes and a high mitochondrial share, together</b>. Look at both measures at once.' },
      { id: 'q-tut', html: 'Thresholds copied from a tutorial fit that tutorial\'s tissue. Some healthy cells have few genes. Some have busy mitochondria. <b>Read the cut-offs off your own data.</b>' },
      { id: 'q-mad', html: 'Best practice: flag outliers by <b>median absolute deviations</b> (MADs) from the median, and stay lenient, around 5 MADs. Strict cut-offs remove small populations first.' },
      { id: 'q-after', html: 'QC is not final. If a cluster later turns out to be damaged cells, come back and tighten. Stray RNA and doublets are separate steps: rooms 1-4 and 1-5.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'The <b>highlighted values</b> are live. Change them here or in the game.',
      tabs: [
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> numpy <span class="k">as</span> np, scanpy <span class="k">as</span> sc\n' +
          '<span class="k">from</span> scipy.stats <span class="k">import</span> median_abs_deviation <span class="k">as</span> mad\n\n' +
          'adata.var[<span class="s">"mt"</span>] = adata.var_names.str.startswith(<span class="s">"MT-"</span>)\n' +
          'sc.pp.<span class="k">calculate_qc_metrics</span>(\n    adata, qc_vars=[<span class="s">"mt"</span>], inplace=True)\n' +
          'g = adata.obs.n_genes_by_counts\nm = adata.obs.pct_counts_mt\n\n' +
          '<span class="hl" data-on="mode=hand"><span class="c"># cut-offs set by hand</span>\n' +
          'keep = (g &gt;= ' + num('genes', 'sc') + ') &amp; (m &lt;= ' + num('mito', 'sc', 0.5) + ')</span>\n\n' +
          '<span class="hl" data-on="mode=mad"><span class="c"># or read off the data: n MADs from the median</span>\n' +
          'n, lg = ' + num('nmad', 'sc') + ', np.log(g)\n' +
          'keep = (lg &gt; lg.median() - n * mad(lg, scale=<span class="s">"normal"</span>)) &amp; \\\n' +
          '       (m &lt; m.median() + n * mad(m, scale=<span class="s">"normal"</span>))</span>\n\n' +
          'adata = adata[keep].copy()</pre>' },
        { id: 'se', label: 'R · Seurat', html:
          '<pre class="code"><span class="k">library</span>(Seurat)\n' +
          'obj[[<span class="s">"percent.mt"</span>]] &lt;- <span class="k">PercentageFeatureSet</span>(\n    obj, pattern = <span class="s">"^MT-"</span>)\n' +
          '<span class="k">VlnPlot</span>(obj, c(<span class="s">"nFeature_RNA"</span>, <span class="s">"percent.mt"</span>))\n\n' +
          '<span class="c"># the PBMC tutorial uses 200 genes and 5% here.\n# your tissue is not that tutorial.</span>\n' +
          'obj &lt;- <span class="k">subset</span>(obj, subset =\n    nFeature_RNA &gt;= ' + num('genes', 'se') + ' &amp;\n    percent.mt &lt;= ' + num('mito', 'se', 0.5) + ')</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="hl" data-on="mode=hand"><span class="c"># cut-offs set by hand</span>\n' +
          'kept = ds.qc.<span class="k">filter</span>(\n    attrs=[<span class="s">"RNA_nFeatures"</span>, <span class="s">"RNA_percentMito"</span>],\n' +
          '    lows=[' + num('genes', 'ca') + ', 0],\n    highs=[10000, ' + num('mito', 'ca', 0.5) + '],\n    cell_selection=cells)</span>\n\n' +
          '<span class="hl" data-on="mode=mad"><span class="c"># or robust bounds: n scaled MADs from the median</span>\n' +
          'kept = ds.qc.<span class="k">auto_filter</span>(\n    cell_selection=cells, n_mads=' + num('nmad', 'ca') + ')</span></pre>' },
      ],
      tip: 'The dimmed block is the one you are not using right now.',
    },
  });
  G.book.onParam = (k, v) => {
    if (phase !== 'set') return;
    if (k === 'genes') { minG = G.clamp(Math.round(v), 50, 1700); nmad = null; }
    if (k === 'mito') { maxM = G.clamp(v, 2, 40); nmad = null; }
    if (k === 'nmad') snap(G.clamp(Math.round(v), 2, 8));
    lastSync = null;
  };
}

function filter() {
  G.state.tries.qc++; G.save();
  stats = measure(); phase = 'result'; pt = 0; rsel = stats.stars ? 1 : 0;
  G.book.goal('junk', stats.okA); G.book.goal('healthy', stats.okB); G.book.goal('pop', stats.okC);
  G.book.unlock('q-tut');
  if (nmad || stats.stars) G.book.unlock('q-mad');
  if (stats.stars) G.book.unlock('q-after');
  G.sfx(stats.stars ? 'star' : 'bad');
}
function retry() { phase = 'set'; stats = null; actors.forEach(o => { o.keep = true; }); ['junk', 'healthy', 'pop'].forEach(g => G.book.goal(g, null)); }
function keep() {
  const s = G.state;
  s.qc = { kept: stats.kept, junkIn: stats.junkIn, lost: stats.lost, healthy: stats.healthy, minG: Math.round(minG), maxM: Math.round(maxM * 10) / 10, nmad };
  s.rooms.qc = { done: true, stars: Math.max(s.rooms.qc.stars, stats.stars) };
  G.save();
  G.go('corridor', { from: 'qc', toast: G.fmt(stats.kept) + ' CELLS THROUGH THE GATE' });
}

G.scenes.qc = {
  phase: () => phase,
  /* test hooks: the outcome for a pair of cut-offs, and where each number of MADs falls */
  test(g, m) { const a = minG, b = maxM; minG = g; maxM = m; const s = measure(); minG = a; maxM = b; actors.forEach(o => { o.keep = true; }); return s; },
  mads() { return [3, 4, 5, 6].map(n => [n, madG(n), madM(n)]); },
  enter() {
    build();
    minG = 200; maxM = 5; nmad = null; sel = 0; pt = 0; stats = null; rsel = 0; drag = null; lastSync = null;
    beats = new G.Beats(INTRO);
    phase = G.state.tries.qc > 0 ? 'set' : 'intro';
    showBook(); sync();
  },
  leave() { G.book.onParam = null; },
  update(dt) {
    pt += dt;
    if (G.hit('b')) { G.go('corridor', { from: 'qc' }); return; }
    if (phase === 'intro') { if (beats.update(dt) === 'done') { phase = 'set'; pt = 0; } }
    else if (phase === 'set') {
      if (G.hit('up')) sel = (sel + 2) % 3;
      if (G.hit('down')) sel = (sel + 1) % 3;
      const step = (G.rep('right') ? 1 : 0) - (G.rep('left') ? 1 : 0);
      if (step && sel === 0) { minG = G.clamp(Math.round(minG * Math.pow(1.04, step)) + step, 50, 1700); nmad = null; G.sfx('tick'); }
      if (step && sel === 1) { maxM = G.clamp(Math.round(maxM * 2 + step) / 2, 2, 40); nmad = null; G.sfx('tick'); }
      if (sel === 2 && (G.hit('left') || G.hit('right'))) snap(G.clamp((nmad || 4) + (G.hit('right') ? 1 : -1), 3, 6));
      /* drag either line straight on the plot */
      if (G.ptr.pressed && G.over(PX - 3, PY - 3, PW + 6, PH + 6) && !G.uiBusy()) drag = Math.abs(G.ptr.x - gx(minG)) < Math.abs(G.ptr.y - my(maxM)) ? 'g' : 'm';
      if (!G.ptr.down) drag = null;
      if (drag === 'g') { minG = G.clamp(Math.round(invGx(G.ptr.x)), 50, 1700); nmad = null; }
      if (drag === 'm') { maxM = G.clamp(Math.round(invMy(G.ptr.y) * 2) / 2, 2, 40); nmad = null; }
      if (G.hit('a')) filter();
    } else if (phase === 'result') {
      const r = G.resultKeys(rsel, stats.stars > 0); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') retry();
    }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#0b1122');
    drawPlot(); drawSide();
    G.roomHeader('1-3  QC GATE', C.amber, true);
    if (phase === 'intro') beats.draw();
    else if (phase === 'set') drawControls();
    else {
      const s = stats;
      const msg = !s.okA ? 'Damaged cells are still in. They will form a cluster of their own and waste your day.'
        : s.busy < 0.8 ? 'You removed healthy cells with busy mitochondria. Tutorial numbers fit the tutorial.'
        : s.small !== null && s.small < 0.8 ? 'The small cells are gone. Few genes is not damage: their mitochondria are fine.'
        : s.stars === 3 ? 'Damaged cells out, every population still here. Lenient, and read off your own data.'
        : 'The junk is out, but so are too many healthy cells. Loosen the lines a little.';
      const act = G.resultDraw(130, msg, s.stars > 0, rsel, 'MOVE THE LINES', 'KEEP THESE CELLS');
      if (act === 'keep') keep(); else if (act === 'retry') retry();
    }
  },
};

function drawPlot() {
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  [[100, '100'], [300, '300'], [1000, '1K'], [3000, '3K']].forEach(k => { R(gx(k[0]), PY, 1, PH, '#16224a'); T(k[1], gx(k[0]), PY + PH + 2, C.steel, { a: 'center' }); });
  [0, 5, 10, 20, 40].forEach(m => { R(PX, my(m), PW, 1, '#16224a'); T(String(m), PX - 3, my(m) - 5, C.steel, { a: 'right' }); });
  T('MITO %', 3, PY - 7, C.mist);
  T('GENES DETECTED PER CELL', PX + PW / 2, PY + PH + 11, C.mist, { a: 'center' });
  const set = phase === 'set', shown = phase === 'result', lx = Math.round(gx(minG)), ly = Math.round(my(maxM));
  if (phase !== 'intro') {
    R(PX, PY, lx - PX, PH, 'rgba(240,101,95,.10)'); R(lx, PY, PX + PW - lx, ly - PY, 'rgba(240,101,95,.10)');
    /* where 3 to 6 MADs fall, as ticks on each axis */
    for (let n = 3; n <= 6; n++) { R(gx(madG(n)), PY + PH - 3, 1, 3, C.amber); R(PX + PW - 3, my(madM(n)), 3, 1, C.amber); }
    T('MADS', PX + PW - 3, my(madM(6)) - 9, C.amber, { a: 'right' });
  }
  const blink = Math.floor(G.t * 4) % 2 === 0;
  actors.forEach(o => {
    const k = KIND[o.kind];
    if (!shown) { const out = !set ? false : !(o.g >= minG && o.m <= maxM); R(o.x - 1, o.y - 1, 2, 2, out ? '#4f5f88' : C.fog); return; }
    const wrong = o.keep !== k.healthy;
    if (o.keep) R(o.x - 1, o.y - 1, wrong && blink ? 3 : 2, wrong && blink ? 3 : 2, k.col);
    else if (wrong && blink) G.ring(o.x, o.y, 2, k.col);
    else R(o.x - 1, o.y - 1, 2, 2, k.dim);
  });
  if (phase !== 'intro') {
    R(lx, PY, 1, PH, C.cyan); R(PX, ly, PW, 1, C.amber);
    if (set) { R(lx - 2, PY - 3, 5, 4, C.cyan); R(PX + PW - 1, ly - 2, 4, 5, C.amber); }
    T('TOO FEW GENES', Math.max(PX + 2, lx - 72), PY + PH - 10, '#b8605c');
    T('TOO MUCH MITO', PX + PW - 3, PY + 3, '#b8605c', { a: 'right' });
  }
}

function drawSide() {
  const x = 232, w = 84;
  G.panel(x, 14, w, 114, { border: C.slate, fill: '#0e1630' });
  if (phase !== 'result') {
    let kept = 0;
    actors.forEach(o => { if (o.g >= minG && o.m <= maxM) kept++; });
    T('KEEPING', x + 6, 18, C.mist); T(G.fmt(kept * wc), x + 6, 27, C.mint, { f: 'smb' });
    T('REMOVING', x + 6, 41, C.mist); T(G.fmt((actors.length - kept) * wc), x + 6, 50, C.coral, { f: 'smb' });
    R(x + 5, 63, w - 10, 1, C.slate);
    T('THE MEDIAN CELL', x + 6, 68, C.mist);
    T(G.fmt(Math.exp(st.lg)) + ' GENES', x + 6, 78, C.fog); T(st.m.toFixed(1) + '% MITO', x + 6, 87, C.fog);
    T('ONE MAD IS THE', x + 6, 102, C.steel); T('TYPICAL SPREAD', x + 6, 111, C.steel);
    return;
  }
  const s = stats, pc = v => Math.floor(v * 100) + '%';
  const row = (y, label, col, val, ok, goal) => {
    R(x + 6, y + 3, 3, 3, col); T(label, x + 12, y, C.mist);
    T(val, x + 6, y + 9, ok ? C.mint : C.coral, { f: 'smb' }); if (goal) T(goal, x + w - 6, y + 9, C.steel, { a: 'right' });
  };
  row(17, 'DAMAGED OUT', C.coral, pc(s.junkOut), s.okA, '90%+');
  row(39, 'HEALTHY IN', C.mint, pc(s.healthy), s.okB, '95%+');
  row(61, 'SMALL CELLS', C.cyan, s.small === null ? 'NONE' : pc(s.small), s.small === null || s.small >= 0.8, s.small === null ? '' : '80%+');
  row(83, 'BUSY CELLS', C.lilac, pc(s.busy), s.busy >= 0.8, '80%+');
  G.stars(x + 6, 110, s.stars);
  if (s.small === null) T('LOST AT 1-2', x + w - 6, 110, C.steel, { a: 'right' });
}

function drawControls() {
  const y0 = 130;
  G.strip(y0);
  T('MIN GENES', 14, y0 + 5, sel === 0 ? C.white : C.mist);
  const lg = G.slider('qg', 88, y0 + 8, 96, Math.log10(minG), Math.log10(50), Math.log10(1700), 0.01, { focus: sel === 0 });
  if (Math.abs(lg - Math.log10(minG)) > 1e-6) { minG = Math.round(Math.pow(10, lg)); nmad = null; sel = 0; }
  T(G.fmt(minG), 246, y0 + 5, C.cyan, { a: 'right', f: 'smb' });
  T('MAX MITO %', 14, y0 + 19, sel === 1 ? C.white : C.mist);
  const mm = G.slider('qm', 88, y0 + 22, 96, maxM, 2, 40, 0.5, { focus: sel === 1, c: C.amber });
  if (Math.abs(mm - maxM) > 1e-6) { maxM = mm; nmad = null; sel = 1; }
  T((Math.round(maxM * 10) / 10) + '%', 246, y0 + 19, C.amber, { a: 'right', f: 'smb' });
  T('SNAP TO MADS', 14, y0 + 34, sel === 2 ? C.white : C.mist);
  if (sel === 2 && Math.floor(G.t * 3) % 2 === 0) T('>', 6, y0 + 34, C.cyan);
  for (let n = 3; n <= 6; n++) {
    const bx = 88 + (n - 3) * 25, over = G.over(bx, y0 + 31, 22, 13), on = nmad === n;
    if (over && G.ptr.pressed) { snap(n); sel = 2; }
    G.panel(bx, y0 + 31, 22, 13, { border: on ? C.amber : over ? C.cyan : C.slate, fill: on ? '#3a2f12' : C.ink });
    T(String(n), bx + 11, y0 + 33, on ? C.amber : C.mist, { a: 'center' });
  }
  if (G.button('qf', 256, y0 + 4, 58, 28, 'FILTER', { primary: true, focus: true })) filter();
}
})();
