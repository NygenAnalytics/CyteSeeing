/* Room 1-2, the Cliff. The barcode rank plot: which barcodes are cells, which are empty droplets?
   First the player draws a UMI cut-off and finds that no line works. Then they test each barcode's
   RNA profile against the soup, the way EmptyDrops does (Lun et al. 2019). */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;

const PX = 34, PY = 18, PW = 190, PH = 92, LX = 5, LY = 4.6;
const KNEE = 1500, GOAL_RECALL = 0.97, GOAL_EMPTY = 0.01;
const LOWERS = [20, 50, 100, 200, 500, 1000], FDRS = [0.000001, 0.0001, 0.001, 0.01, 0.05, 0.2];
const FDR_LABEL = ['1E-6', '1E-4', '.001', '.01', '.05', '.2'];
const SOUP = [6, 5, 4, 4, 3, 3, 2, 2];

const sx = rank => PX + Math.log10(Math.max(1, rank)) / LX * PW;
const sy = umi => PY + PH - Math.log10(Math.max(1, umi)) / LY * PH;

/* Mika's walk through the plot. On the second line the barcodes slide into rank order. */
const INTRO = [
  { say: 'The sequencer is done. Every read carries the barcode of its droplet. But most droplets never held a cell.' },
  { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'Here every barcode is ranked by its UMI count: the RNA molecules counted for it. Cells are the flat part on the left.' },
  { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'Then the counts fall off a cliff. After it come empty droplets, which still caught some free-floating RNA.' },
  { say: 'Move the line. Everything left of it is called a cell. Keep 97% of the real cells, and let in 1% empty droplets at most.' },
];
const TEST_TOUR = [
  { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'This works like EmptyDrops. Barcodes at or below LOWER are taken as empty. They show what background RNA looks like.' },
  { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'Barcodes between the two lines are tested against that background. Above the KNEE they are kept without a test.' },
  { spot: [0, 130, VW, 50], say: 'Set LOWER and FDR. A smaller FDR is stricter: fewer empty droplets get in, but small cells can fail. Then press RUN TEST.' },
];

let phase, beats, pt, actors, total, gi, sel, li, fi, stats, scan, lastSync, rsel, laneR, laneDbl, tour;

function verdict() {
  const s = stats, got = 'You kept ' + Math.round(s.recall * 100) + '% of the real cells and let in ' + (s.empties * 100).toFixed(1) + '% empty droplets. ';
  if (s.stars === 3) return got + 'The test found the small cells that every line lost.';
  if (s.pool) return got + 'LOWER is too high. Real cells at or below it were taken as empty, and nothing down there can be called. Lower it.';
  if (!s.okE) return got + 'Too many empty droplets got in. Choose a smaller FDR.';
  if (!s.stars) return got + 'The test is too strict, and small cells failed it. Choose a slightly larger FDR.';
  return got + 'That passes. A slightly different LOWER or FDR would keep a few more cells.';
}

function build() {
  const rnd = G.rng(7), ld = G.state.load;
  laneR = ld ? ld.R : 5000;
  const rate = ld ? ld.rate : 0.04;
  laneDbl = Math.round(laneR * rate);
  const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) / 0.7071; };
  const wc = laneR / 176, a = [];
  const nd = Math.round(150 * rate);
  for (let i = 0; i < 150; i++) {
    let u = Math.exp(Math.log(5200) + 0.42 * gauss());
    u = G.clamp(u, 1900, 16000);
    const dbl = i < nd;
    a.push({ kind: dbl ? 'dbl' : 'big', cell: true, umi: Math.min(22000, dbl ? u * 1.85 : u), w: wc, p: 0 });
  }
  const faint = [0.004, 0.008, 0.02, 0.03], sly = [0.006, 0.015, 0.025, 0.04];
  for (let i = 0; i < 26; i++) {
    a.push({ kind: 'small', cell: true, umi: Math.exp(G.lerp(Math.log(150), Math.log(950), rnd())), w: wc,
      p: i < 22 ? Math.pow(10, -G.lerp(4, 7, rnd())) : faint[i - 22], prof: profile(rnd, i < 22 ? 'cell' : 'faint') });
  }
  for (let i = 0; i < 34; i++) {
    a.push({ kind: 'soupy', cell: false, umi: Math.exp(G.lerp(Math.log(115), Math.log(620), rnd())), w: wc,
      p: i < 30 ? G.lerp(0.08, 1, rnd()) : sly[i - 30], prof: profile(rnd, i < 30 ? 'soup' : 'odd') });
  }
  for (let i = 0; i < 150; i++) {
    a.push({ kind: 'bg', cell: false, umi: Math.exp(G.lerp(0, Math.log(100), Math.pow(rnd(), 1.5))), w: 560, p: G.lerp(0.25, 1, rnd()), prof: profile(rnd, 'soup') });
  }
  a.sort((p, q) => q.umi - p.umi);
  let cum = 0;
  a.forEach(o => { o.rank = cum + o.w / 2; cum += o.w; o.cum = cum; o.x = sx(o.rank); o.y = sy(o.umi); o.rx = PX + 4 + rnd() * (PW - 8); o.called = false; o.seen = false; });
  actors = a; total = cum;
}
function profile(rnd, type) {
  if (type === 'soup') return SOUP.map(v => Math.max(0, v + Math.round((rnd() - 0.5) * 1.6)));
  if (type === 'odd') { const p = SOUP.slice(); p[Math.floor(rnd() * 8)] += 3; return p; }
  const p = SOUP.map(() => Math.floor(rnd() * 2)), hi = type === 'cell' ? 3 : 2;
  for (let i = 0; i < hi; i++) p[Math.floor(rnd() * 8)] = (type === 'cell' ? 7 : 5) + Math.floor(rnd() * 3);
  if (type === 'faint') for (let i = 0; i < 8; i++) p[i] = Math.round((p[i] + SOUP[i]) / 2);
  return p;
}

function measure() {
  let tp = 0, fp = 0, all = 0, called = 0, lost = 0;
  actors.forEach(o => {
    if (o.cell) all += o.w;
    if (o.called) { called += o.w; if (o.cell) tp += o.w; else fp += o.w; }
    if (o.cell && o.umi <= LOWERS[li] && phase !== 'cutres') lost += o.w;
  });
  const recall = tp / all, empties = called ? fp / called : 0;
  const ok = recall >= GOAL_RECALL - 1e-9 && empties <= GOAL_EMPTY + 1e-9;
  let stars = 0;
  if (ok) stars = 3; else if (recall >= 0.94 && empties <= 0.03) stars = 2; else if (recall >= 0.90 && empties <= 0.06) stars = 1;
  return { recall, empties, called: Math.round(called), stars, okR: recall >= GOAL_RECALL - 1e-9, okE: empties <= GOAL_EMPTY + 1e-9, pool: lost > 0 };
}
function calledAt(n) { return n > 0 ? Math.round(actors[n - 1].cum) : 0; }

function sync() {
  const key = [phase, gi, li, fi].join('|');
  if (key === lastSync) return;
  lastSync = key;
  G.params.mode = (phase === 'test' || phase === 'scan' || phase === 'result') ? 'test' : 'cut';
  G.params.thr = gi > 0 ? Math.ceil(actors[gi - 1].umi) : 99999;
  G.params.nforce = calledAt(gi);
  G.params.lower = LOWERS[li]; G.params.fdr = FDRS[fi];
  G.book.sync();
}

function showBook() {
  const num = (k, w) => '<input class="p" data-p="' + k + '" id="p-' + k + '-' + w + '" type="number" inputmode="numeric" aria-label="' + k + '">';
  const pick = (k, w, vals) => '<select class="p" data-p="' + k + '" id="p-' + k + '-' + w + '" aria-label="' + k + '">' + vals.map(v => '<option value="' + v + '">' + v + '</option>').join('') + '</select>';
  G.book.show({
    floor: 'Ground floor · Room 1-2', room: 'The Cliff', aim: 'Decide which barcodes are real cells and which are empty droplets.', codeFirst: true, file: 'js/cliff.js',
    goals: [
      { id: 'recall', text: 'Keep at least 97% of the real cells' },
      { id: 'empty', text: 'Let in 1% empty droplets at most' },
    ],
    notes: [
      { id: 'c-rank', open: true, html: 'Rank every barcode by its UMI count. Cells form the flat part on the left, the <b>plateau</b>. Then a <b>cliff</b> drops to the background: empty droplets that picked up free-floating RNA.' },
      { id: 'c-line', html: 'A cut-off on the UMI count either loses small cells that contain little RNA, or lets in empty droplets that picked up free-floating RNA. <b>No single cut-off avoids both.</b>' },
      { id: 'c-ed', html: '<b>EmptyDrops</b>: barcodes at or below <b>lower</b> are assumed to be empty and define the background RNA. Every barcode above it is tested against that background. Barcodes above the <b>knee</b> are kept without a test.' },
      { id: 'c-after', html: 'Cell calling does not remove ambient RNA from the called cells, and it does not find doublets. Those are separate steps: rooms 1-4 and 1-5.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'The <b>highlighted values</b> are live. Change them here or in the game.',
      tabs: [
        { id: 'r', label: 'R · DropletUtils', html:
          '<pre class="code"><span class="k">library</span>(DropletUtils)\n' +
          'sce &lt;- <span class="k">read10xCounts</span>(\n         <span class="s">"raw_feature_bc_matrix"</span>)\n' +
          'br  &lt;- <span class="k">barcodeRanks</span>(counts(sce))\n\n' +
          '<span class="hl" data-on="mode=cut"><span class="c"># a hard cut on the UMI total</span>\n' +
          'is.cell &lt;- br$total &gt;= ' + num('thr', 'r') + '</span>\n\n' +
          '<span class="hl" data-on="mode=test"><span class="c"># or test each barcode against the soup</span>\n' +
          'e.out   &lt;- <span class="k">emptyDrops</span>(counts(sce),\n                      lower = ' + pick('lower', 'r', LOWERS) + ')\n' +
          'is.cell &lt;- e.out$FDR &lt;= ' + pick('fdr', 'r', FDRS) + '</span>\n\n' +
          'sce &lt;- sce[, <span class="k">which</span>(is.cell)]</pre>' },
        { id: 'cr', label: 'Cell Ranger', html:
          '<pre class="code"><span class="hl" data-on="mode=test"><span class="c"># the default: a count threshold, then an\n# RNA-profile test for the barcodes below it</span>\n' +
          '<span class="k">cellranger count</span> --id=lane1 \\\n' +
          '  --transcriptome=refdata-gex-GRCh38-2024-A \\\n' +
          '  --fastqs=fastqs/ --sample=tissue_lane1 \\\n' +
          '  --create-bam=false</span>\n\n' +
          '<span class="hl" data-on="mode=cut"><span class="c"># a hard cut instead: keep the top N barcodes</span>\n' +
          '  --force-cells=' + num('nforce', 'cr') + '</span></pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="k">import</span> cytearc\n\n' +
          '<span class="c"># keep every barcode: the low ones are the soup</span>\n' +
          'reader = cytearc.<span class="k">CrH5Reader</span>(\n    <span class="s">"raw_feature_bc_matrix.h5"</span>,\n    is_filtered=False, filtering_cutoff=0)\n' +
          'cytearc.<span class="k">CrToZarr</span>(reader, zarr_loc=<span class="s">"lane1.zarr"</span>).dump()\n' +
          'ds = cytearc.<span class="k">DataStore</span>(<span class="s">"lane1.zarr"</span>,\n                       min_features_per_cell=-1)\n\n' +
          'ranks = ds.qc.<span class="k">barcode_ranks</span>(lower=<span class="p" data-b="lower"></span>)\n' +
          '<span class="k">print</span>(ranks.knee, ranks.inflection)\n\n' +
          '<span class="hl" data-on="mode=test"><span class="c"># EmptyDrops; barcodes above the knee are kept</span>\n' +
          'cells = ds.qc.<span class="k">call_cells</span>(\n    lower=' + pick('lower', 'ca', LOWERS) + ', fdr=' + pick('fdr', 'ca', FDRS) + ',\n    random_seed=0)</span></pre>' },
        { id: 'sc', label: 'Scanpy · Seurat', html:
          '<pre class="code"><span class="c"># Scanpy has no cell caller. It starts from\n# the matrix that this step writes.</span>\n' +
          '<span class="k">import</span> scanpy <span class="k">as</span> sc\n' +
          'adata = sc.<span class="k">read_10x_h5</span>(\n    <span class="s">"filtered_feature_bc_matrix.h5"</span>)</pre>' +
          '<pre class="code"><span class="c"># Seurat is the same: it reads the called cells.</span>\n' +
          '<span class="k">library</span>(Seurat)\n' +
          'counts &lt;- <span class="k">Read10X_h5</span>(<span class="s">"filtered_feature_bc_matrix.h5"</span>)\n' +
          'obj    &lt;- <span class="k">CreateSeuratObject</span>(counts = counts)</pre>' },
      ],
      tip: 'The dimmed block is the one you are not using right now.',
    },
  });
  G.book.onParam = (k, v) => {
    if (k === 'thr' && phase === 'cut') gi = actors.filter(o => o.umi >= v).length;
    if (k === 'nforce' && phase === 'cut') { let n = actors.findIndex(o => o.cum >= v); gi = n < 0 ? actors.length : n + 1; }
    const near = (arr) => arr.reduce((b, x, i) => Math.abs(Math.log(x) - Math.log(Math.max(v, 1e-9))) < Math.abs(Math.log(arr[b]) - Math.log(Math.max(v, 1e-9))) ? i : b, 0);
    if (k === 'lower' && phase === 'test') li = near(LOWERS);
    if (k === 'fdr' && phase === 'test') fi = near(FDRS);
    lastSync = null;
  };
}

function goCut() { phase = 'cut'; actors.forEach(o => { o.called = false; o.seen = false; }); ['recall', 'empty'].forEach(g => G.book.goal(g, null)); }
function callCut() {
  G.state.tries.cliff++; G.save();
  actors.forEach((o, i) => { o.called = i < gi; o.seen = true; });
  phase = 'cutres'; pt = 0; stats = measure();
  G.book.goal('recall', stats.okR); G.book.goal('empty', stats.okE);
  G.book.unlock('c-line');
  beats = new G.Beats([
    { say: 'You kept ' + Math.round(stats.recall * 100) + '% of the real cells and let in ' + (stats.empties * 100).toFixed(1) + '% empty droplets. No line gets both right.' },
    { say: 'Small cells hold little RNA. They sit below the cliff, next to empty droplets that caught free-floating RNA.' },
    { say: 'A count cannot tell them apart. Their RNA can: an empty droplet holds the background mix. A cell does not.' },
  ]);
  G.sfx(stats.stars ? 'ok' : 'bad');
}
function goTest() {
  if (!G.state.notes['c-ed']) tour = new G.Beats(TEST_TOUR);
  phase = 'test'; sel = 2; actors.forEach(o => { o.called = false; o.seen = false; });
  ['recall', 'empty'].forEach(g => G.book.goal(g, null));
  G.book.unlock('c-ed');
}
function runTest() {
  const lower = LOWERS[li], list = actors.filter(o => o.umi > lower && o.umi < KNEE);
  actors.forEach(o => { o.seen = false; o.called = o.umi >= KNEE; });
  phase = 'scan'; scan = { list, i: 0, t: 0, since: 0, per: G.reduced ? 0.004 : Math.max(0.018, Math.min(0.07, 3.4 / Math.max(1, list.length))) };
  G.sfx('ok');
}
function endScan() {
  const fdr = FDRS[fi];
  scan.list.forEach(o => { o.called = o.p <= fdr; });
  actors.forEach(o => { o.seen = true; });
  phase = 'result'; stats = measure(); rsel = stats.stars ? 1 : 0;
  G.book.goal('recall', stats.okR); G.book.goal('empty', stats.okE);
  if (stats.stars) G.book.unlock('c-after');
  G.sfx(stats.stars ? 'star' : 'bad');
}
function keep() {
  const s = G.state;
  s.calls = { called: stats.called, recall: stats.recall, empties: stats.empties, doublets: laneDbl, lower: LOWERS[li], fdr: FDRS[fi] };
  s.rooms.cliff = { done: true, stars: Math.max(s.rooms.cliff.stars, stats.stars) };
  G.save();
  G.go('corridor', { from: 'cliff', toast: G.fmt(stats.called) + ' CELLS CALLED' });
}

G.scenes.cliff = {
  phase: () => phase,
  enter() {
    build();
    gi = 60; li = 2; fi = 2; sel = 0; pt = 0; lastSync = null; stats = null; scan = null; rsel = 0; tour = null;
    beats = new G.Beats(INTRO);
    phase = G.state.tries.cliff > 0 ? (G.state.notes['c-ed'] ? 'test' : 'cut') : 'intro';
    if (phase === 'test') sel = 2;
    showBook();
    sync();
  },
  leave() { G.book.onParam = null; },
  update(dt) {
    pt += dt;
    if (G.hit('b') && phase !== 'scan') { G.go('corridor', { from: 'cliff' }); return; }
    if (phase === 'intro') {
      const was = beats.i, r = beats.update(dt);
      if (beats.i !== was) pt = 0;
      if (r === 'done') { phase = 'cut'; pt = 0; }
    } else if (phase === 'cut') {
      const step = (G.rep('right') ? 1 : 0) - (G.rep('left') ? 1 : 0);
      if (step) { gi = G.clamp(gi + step * (G.hit('left') || G.hit('right') ? 1 : 3), 1, actors.length); G.sfx('tick'); }
      if (G.ptr.down && G.over(PX - 4, PY - 4, PW + 8, PH + 12) && !G.uiBusy()) {
        let n = actors.findIndex(o => o.x > G.ptr.x);
        gi = G.clamp(n < 0 ? actors.length : n, 1, actors.length);
      }
      if (G.hit('a')) callCut();
      if (G.ptr.pressed && G.over(2, 10, 22, 12)) { G.toast('UMI: UNIQUE MOLECULAR IDENTIFIER. COUNT IT ONCE.', 3.5); G.sfx('pop'); }
      if (G.ptr.pressed && G.over(50, 122, 160, 8)) { G.toast(G.fmt(total) + ' BARCODES. MOST OF THEM ARE EMPTY DROPLETS.', 3.5); G.sfx('pop'); }
    } else if (phase === 'cutres') {
      if (beats) { if (beats.update(dt) === 'done') { beats = null; rsel = 1; } }
      else {
        if (G.hit('left') || G.hit('right')) { rsel = 1 - rsel; G.sfx('tick'); }
        if (G.hit('a')) { if (rsel === 1) goTest(); else goCut(); }
      }
    } else if (phase === 'test' && tour) {
      if (tour.update(dt) === 'done') tour = null;
    } else if (phase === 'test') {
      if (G.hit('up')) sel = (sel + 2) % 3;
      if (G.hit('down')) sel = (sel + 1) % 3;
      const step = (G.hit('right') ? 1 : 0) - (G.hit('left') ? 1 : 0);
      if (step && sel === 0) { li = G.clamp(li + step, 0, LOWERS.length - 1); G.sfx('tick'); }
      if (step && sel === 1) { fi = G.clamp(fi + step, 0, FDRS.length - 1); G.sfx('tick'); }
      if (G.hit('a')) runTest();
    } else if (phase === 'scan') {
      scan.t += dt;
      if (G.skip() && scan.since > 0.3) scan.i = scan.list.length;
      scan.since += dt;
      while (scan.t >= scan.per && scan.i < scan.list.length) {
        scan.t -= scan.per;
        const o = scan.list[scan.i++];
        o.seen = true; o.called = o.p <= FDRS[fi];
        if (scan.i % 3 === 0) G.sfx('scan');
      }
      if (scan.i >= scan.list.length) endScan();
    } else if (phase === 'result') {
      const r = G.resultKeys(rsel, stats.stars > 0); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') goTest();
    }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#0b1122');
    drawPlot();
    drawSide();
    G.roomHeader('1-2  THE CLIFF', C.lilac, phase !== 'scan');
    drawStrip();
  },
};

/* ---------- drawing ---------- */
function drawPlot() {
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  for (let i = 1; i < LX; i++) R(sx(Math.pow(10, i)), PY, 1, PH, '#16224a');
  for (let i = 1; i <= 4; i++) R(PX, sy(Math.pow(10, i)), PW, 1, '#16224a');
  ['1', '10', '100', '1K', '10K', '100K'].forEach((s, i) => T(s, sx(Math.pow(10, i)) + (i === 5 ? -1 : 0), PY + PH + 2, C.steel, { a: i === 0 ? 'left' : i === 5 ? 'right' : 'center' }));
  ['1', '10', '100', '1K', '10K'].forEach((s, i) => T(s, PX - 3, sy(Math.pow(10, i)) - 5, C.steel, { a: 'right' }));
  T('UMI', 4, PY - 6, C.mist);
  T('BARCODES, RANKED BY UMI COUNT', PX + PW / 2, PY + PH + 11, C.mist, { a: 'center' });

  const intro = phase === 'intro', ranked = !intro || beats.i >= 1;
  const mv = intro && beats.i === 1 ? G.ease(pt / 1.4) : ranked ? 1 : 0;
  const test = phase === 'test' || phase === 'scan' || phase === 'result';

  if (test) {
    const yk = Math.round(sy(KNEE)), yl = Math.round(sy(LOWERS[li]));
    R(PX, PY, PW, yk - PY, 'rgba(123,224,161,.07)');
    R(PX, yk, PW, yl - yk, 'rgba(183,157,246,.10)');
    R(PX, yl, PW, PY + PH - yl, 'rgba(147,164,200,.07)');
    G.hdash(PX, PX + PW, yk, C.mint); G.hdash(PX, PX + PW, yl, C.lilac);
    T('KEPT, NO TEST', PX + PW - 3, PY + 2, C.mint, { a: 'right' });
    T('KNEE', PX + 3, yk - 10, C.mint);
    if (yl - yk > 11) T('TESTED', PX + PW - 3, Math.round((yk + yl) / 2) - 4, C.lilac, { a: 'right' });
    if (yl - yk > 22) T('LOWER', PX + 3, yl - 10, C.lilac);
    if (PY + PH - yl > 12) T('ASSUMED EMPTY', PX + 3, yl + 2, C.mist);
  }
  if (phase === 'cut' || phase === 'cutres') {
    const gx = Math.round(gi >= actors.length ? PX + PW : gi <= 0 ? PX : (actors[gi - 1].x + actors[gi].x) / 2);
    R(PX, PY, gx - PX, PH, 'rgba(79,214,232,.09)');
    R(gx, PY, 1, PH, C.cyan);
    if (phase === 'cut') {
      R(gx - 3, PY - 3, 7, 5, C.cyan); R(gx - 3, PY + PH - 2, 7, 5, C.cyan);
      T('CELLS', Math.max(PX + 2, gx - 32), PY + PH - 10, C.cyan);
      T('NOT CELLS', Math.min(gx + 5, PX + PW - 52), PY + PH - 10, C.steel);
    }
  }
  /* the curve, then one dot per barcode */
  if (mv >= 1) for (let i = 1; i < actors.length; i++) G.line(actors[i - 1].x, actors[i - 1].y, actors[i].x, actors[i].y, '#2a3966');
  const blink = Math.floor(G.t * 4) % 2 === 0;
  actors.forEach(o => {
    const x = G.lerp(o.rx, o.x, mv), y = o.y;
    let col = C.fog, big = false;
    if (o.seen && (phase !== 'cutres' || o.x < PX + pt * 240)) {
      if (o.called && o.cell) col = C.mint;
      else if (o.called && !o.cell) { col = C.coral; big = blink; }
      else if (!o.called && o.cell) { col = C.amber; big = blink; }
      else col = '#44557f';
    } else if (test && o.umi >= KNEE) col = C.mint;
    else if (o.kind === 'bg') col = '#7f90b6';
    R(x - 1, y - 1, big ? 3 : 2, big ? 3 : 2, col);
    if (phase === 'result' && o.kind === 'dbl') G.ring(x, y, 3, C.pink);
  });
  if (intro && beats.i >= 1 && mv >= 1) {
    T('PLATEAU', sx(30), sy(1900) + 5, C.mint);
    T('CLIFF', sx(laneR) + 7, sy(900), C.amber);
    if (beats.i >= 2) T('BACKGROUND', sx(4500) - 4, sy(12), C.mist, { a: 'right' });
  }
  if (phase === 'scan' && scan.i > 0 && scan.i <= scan.list.length) {
    const o = scan.list[Math.min(scan.i, scan.list.length) - 1];
    G.ring(o.x, o.y, 4, C.white);
  }
}

function drawSide() {
  const x = 232, w = 84;
  G.panel(x, 14, w, 114, { border: C.slate, fill: '#0e1630' });
  if (phase === 'intro') {
    T('BARCODES', x + 6, 20, C.mist);
    T(G.fmt(total), x + 6, 30, C.white, { f: 'smb' });
    T('CELLS LOADED', x + 6, 50, C.mist);
    T(G.fmt(laneR), x + 6, 60, C.cyan, { f: 'smb' });
    T('IN LANE 1', x + 6, 71, C.steel);
    return;
  }
  if (phase === 'cut') {
    T('CALLED AS CELLS', x + 6, 20, C.mist);
    T(G.fmt(calledAt(gi)), x + 6, 30, C.cyan, { f: 'smb' });
    T('CUT-OFF', x + 6, 48, C.mist);
    T(G.fmt(G.params.thr || 0) + ' UMI', x + 6, 58, C.white, { f: 'smb' });
    T('YOU LOADED', x + 6, 76, C.steel); T(G.fmt(laneR), x + 6, 85, C.steel);
    if (G.button('call', x + 6, 106, w - 12, 16, 'CALL CELLS', { primary: true, focus: true })) callCut();
    return;
  }
  if (phase === 'test' || phase === 'scan') {
    const o = phase === 'scan' && scan.i > 0 ? scan.list[Math.min(scan.i, scan.list.length) - 1] : null;
    T('BACKGROUND RNA', x + 6, 20, C.mist);
    bars(x + 6, 30, SOUP, C.steel);
    T(o ? 'THIS BARCODE' : 'A BARCODE', x + 6, 58, C.mist);
    if (o) {
      const isCell = o.p <= FDRS[fi];
      bars(x + 6, 68, o.prof, isCell ? C.mint : C.steel);
      T(isCell ? 'A CELL' : 'JUST SOUP', x + 6, 99, isCell ? C.mint : C.mist, { f: 'smb' });
      T(G.fmt(o.umi) + ' UMI', x + 6, 110, C.steel);
    } else {
      bars(x + 6, 68, [0, 0, 0, 0, 0, 0, 0, 0], C.slate);
      T('SAME MIX AS THE', x + 6, 100, C.steel); T('BACKGROUND?', x + 6, 110, C.steel);
    }
    return;
  }
  /* cutres and result: the score */
  const s = stats;
  T('CELLS KEPT', x + 6, 18, C.mist);
  T((Math.floor(s.recall * 1000) / 10).toFixed(1) + '%', x + 6, 27, s.okR ? C.mint : C.coral, { f: 'smb' });
  T('97%+', x + w - 6, 27, C.steel, { a: 'right' });
  T('EMPTIES IN', x + 6, 41, C.mist);
  T((s.empties * 100).toFixed(1) + '%', x + 6, 50, s.okE ? C.mint : C.coral, { f: 'smb' });
  T('1% MAX', x + w - 6, 50, C.steel, { a: 'right' });
  R(x + 5, 63, w - 10, 1, C.slate);
  if (phase === 'result') {
    G.stars(x + 6, 68, s.stars);
    G.ring(x + 9, 86, 3, C.pink); R(x + 8, 85, 2, 2, C.mint);
    T(G.fmt(laneDbl), x + 17, 82, C.pink, { f: 'smb' });
    T('DOUBLETS CAME', x + 6, 94, C.pink); T('ALONG, CALLED', x + 6, 103, C.steel); T('AS CELLS.', x + 6, 112, C.steel);
  } else {
    dot(x + 7, 72, C.mint); T('CELL, KEPT', x + 14, 68, C.fog);
    dot(x + 7, 83, C.amber); T('CELL, LOST', x + 14, 79, C.fog);
    dot(x + 7, 94, C.coral); T('EMPTY, IN', x + 14, 90, C.fog);
    dot(x + 7, 105, '#44557f'); T('EMPTY, OUT', x + 14, 101, C.fog);
  }
}
function dot(x, y, c) { R(x, y, 3, 3, c); }
function bars(x, y, vals, col) {
  R(x, y + 22, 72, 1, C.slate);
  vals.forEach((v, i) => { const h = Math.min(22, v * 2); R(x + 1 + i * 9, y + 22 - h, 7, h, col); });
}

function drawStrip() {
  const y0 = 130;
  R(0, y0, VW, VH - y0, '#0e1630'); R(0, y0, VW, 1, C.slate);
  if (phase === 'cut' || phase === 'intro') {
    T('EVERYTHING LEFT OF THE LINE WILL BE CALLED A CELL.', 10, y0 + 8, C.fog);
    T('GOAL', 10, y0 + 28, C.amber, { f: 'smb' });
    T('KEEP 97% OR MORE OF THE REAL CELLS.', 44, y0 + 24, C.amber); T('LET IN 1% EMPTY DROPLETS AT MOST.', 44, y0 + 34, C.amber);
    if (phase === 'intro') beats.draw();
  } else if (phase === 'cutres') {
    T('A LINE CANNOT REACH BOTH GOALS.', 10, y0 + 8, C.fog);
    if (G.button('again', 10, y0 + 24, 124, 15, 'MOVE THE LINE AGAIN', { focus: rsel === 0 })) goCut();
    if (G.button('inside', 146, y0 + 24, 136, 15, 'TEST EACH BARCODE', { primary: true, focus: rsel === 1 })) goTest();
    if (beats) beats.draw();
  } else if (phase === 'test') {
    T('LOWER', 14, y0 + 7, sel === 0 ? C.white : C.mist);
    LOWERS.forEach((v, i) => { if (opt('lo' + i, 58 + i * 32, y0 + 4, String(v), i === li)) { li = i; sel = 0; } });
    T('FDR', 14, y0 + 23, sel === 1 ? C.white : C.mist);
    FDRS.forEach((v, i) => { if (opt('fd' + i, 58 + i * 32, y0 + 20, FDR_LABEL[i], i === fi)) { fi = i; sel = 1; } });
    if (sel < 2 && Math.floor(G.t * 3) % 2 === 0) T('>', 6, y0 + 7 + sel * 16, C.cyan);
    if (G.button('test', 256, y0 + 4, 58, 28, 'RUN TEST', { primary: true, focus: sel === 2 })) runTest();
    T('AT OR BELOW LOWER: ASSUMED EMPTY.  ABOVE KNEE: KEPT.', 14, y0 + 38, C.steel);
    if (tour) tour.draw();
  } else if (phase === 'scan') {
    T('TESTING BARCODE ' + Math.min(scan.i + 1, scan.list.length) + ' OF ' + scan.list.length, 14, y0 + 8, C.white, { f: 'smb' });
    R(14, y0 + 22, 240, 6, C.slate); R(14, y0 + 22, Math.round(240 * scan.i / Math.max(1, scan.list.length)), 6, C.lilac);
    T(G.kt('SPACE: SKIP', 'TAP: SKIP'), 306, y0 + 36, C.steel, { a: 'right' });
  } else if (phase === 'result') {
    const act = G.resultDraw(y0, verdict(), stats.stars > 0, rsel, 'CHANGE THE TEST', 'KEEP THESE CELLS');
    if (act === 'keep') keep(); else if (act === 'retry') goTest();
  }
}
function opt(id, x, y, label, on) {
  const over = G.over(x, y, 30, 13);
  let clicked = false;
  if (over && G.ptr.pressed) { clicked = true; G.sfx('tick'); }
  G.panel(x, y, 30, 13, { border: on ? C.amber : over ? C.cyan : C.slate, fill: on ? '#3a2f12' : C.ink });
  T(label, x + 15, y + 2, on ? C.amber : C.mist, { a: 'center' });
  return clicked;
}
})();
