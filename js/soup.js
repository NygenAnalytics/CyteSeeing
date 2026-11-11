/* Room 1-4, the soup kitchen. Ambient RNA: every droplet holds a ladle of the soup, so every cell
   reports a little of genes it does not express. The player measures the soup share with a gene
   that a cell cannot make (haemoglobin in white blood cells), then subtracts that share.
   Too little leaves ghosts; too much erases real, quiet signal. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;

const ROWS = ['T CELLS', 'B CELLS', 'MONOCYTES', 'NK CELLS'], SHORT = ['T', 'B', 'MONO', 'NK'], RCOL = [C.cyan, C.lilac, C.amber, C.mint];
const GENES = ['CD3E', 'IL7R', 'MS4A1', 'LYZ', 'NKG7', 'HBB'];
/* what each cell type really expresses, per 1,000 counts. IL7R in T cells is real but quiet. */
const REAL = [[100, 3, 0, 0, 0, 0], [0, 0, 100, 0, 0, 0], [0, 0, 0, 100, 0, 0], [0, 0, 0, 0, 100, 0]];
/* the soup: what the empty droplets hold, per 1,000 counts. Burst red cells make it rich in HBB. */
const SOUP = [20, 14, 10, 34, 12, 48];
const MX = 62, MYT = 34, CW = 21, CH = 16;

const INTRO = [
  { say: 'Cells that burst before loading spill their RNA into the liquid. That is the soup, and every droplet gets a ladle.' },
  { say: 'So each cell reports a little of everybody\'s genes. Monocyte LYZ in your T cells. Haemoglobin in everything.' },
  { say: 'The empty droplets from the Cliff give you the recipe. They cannot tell you how much soup is in each cell.' },
  { say: 'Find the soup share and subtract it. Hint: the red cells all burst. Nothing left in here can make haemoglobin.' },
];

let phase, beats, pt, rho, truth, obs, cur, focus, rsel, res, lastSync, laneR, probed;

function build() {
  const ld = G.state.load, rnd = G.rng(29);
  laneR = ld ? ld.R : 4500;
  truth = [9, 12, 15][ld ? (ld.lanes + Math.round(ld.R / 500)) % 3 : 1];
  obs = REAL.map(row => row.map((e, c) => (1 - truth / 100) * e + truth / 100 * SOUP[c] + (rnd() - 0.5) * 0.3));
}
const corrected = (r, c) => Math.max(0, obs[r][c] - rho / 100 * SOUP[c]);
const side = v => (v < 0.3 ? 0 : Math.min(12, Math.round(2 * (1 + 2.3 * Math.log10(1 + v)))));

/* what one square says about the soup share, and how far to trust it */
function probe(r, c) {
  const est = obs[r][c] / SOUP[c] * 100, real = REAL[r][c];
  if (real >= 50) return { est, use: false, tag: 'A BAD PROBE', why: ['THIS GENE BELONGS', 'TO THIS CELL TYPE'] };
  if (real > 0) return { est, use: true, tag: 'ODD ONE OUT', why: ['ABOVE THE OTHERS.', 'SOMETHING IS REAL'] };
  if (c === 5) return { est, use: true, tag: 'BEST PROBE', why: ['NO CELL IN HERE', 'MAKES HAEMOGLOBIN'] };
  if (SOUP[c] < 13) return { est, use: true, tag: 'SHAKY PROBE', why: ['FEW COUNTS: THE', 'ESTIMATE WOBBLES'] };
  return { est, use: true, tag: 'GOOD PROBE', why: ['THIS CELL TYPE', 'CANNOT MAKE IT'] };
}

function sync() {
  const key = phase + '|' + rho;
  if (key === lastSync) return;
  lastSync = key;
  G.params.rho = (rho / 100).toFixed(2); G.params.ecells = laneR;
  G.book.sync();
}

function showBook() {
  const num = w => '<input class="p" data-p="rho" id="s-rho-' + w + '" type="number" step="0.01" min="0" max="0.4" inputmode="decimal" aria-label="soup share">';
  G.book.show({
    floor: 'Ground floor · Room 1-4', room: 'The soup kitchen', codeFirst: true, file: 'js/soup.js',
    goals: [
      { id: 'near', text: 'Get within 2 points of the real soup share' },
      { id: 'ghost', text: 'Leave no gene in a cell that cannot make it' },
      { id: 'real', text: 'Do not erase real signal' },
    ],
    notes: [
      { id: 's-what', open: true, html: 'Ambient RNA, <b>the soup</b>, comes from cells that lysed before or during loading. Every droplet holds some, so every cell shows a low level of genes it does not express.' },
      { id: 's-probe', html: 'To measure the soup share, use genes a cell <b>cannot</b> express: haemoglobin in white blood cells, immunoglobulins in T cells. Every such count came from the soup.' },
      { id: 's-over', html: 'Correction subtracts each cell\'s share of the soup profile. <b>Too much removes real genes that are quietly expressed.</b> Check a few known markers before and after.' },
      { id: 's-tools', html: 'Tools: <b>SoupX</b> estimates the share from marker genes and clusters. <b>CellBender</b> and <b>DecontX</b> model it for each cell.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'The <b>highlighted value</b> is the soup share, as a fraction. It is live.',
      tabs: [
        { id: 'sx', label: 'R · SoupX', html:
          '<pre class="code"><span class="k">library</span>(SoupX)\n' +
          '<span class="c"># raw and filtered matrices, and clusters</span>\n' +
          'sc &lt;- <span class="k">load10X</span>(<span class="s">"lane1/outs"</span>)\n\n' +
          '<span class="c"># estimate the soup share from marker genes</span>\n' +
          'sc &lt;- <span class="k">autoEstCont</span>(sc)\n\n' +
          '<span class="c"># or set it yourself</span>\n' +
          'sc &lt;- <span class="k">setContaminationFraction</span>(sc, ' + num('sx') + ')\n\n' +
          'counts &lt;- <span class="k">adjustCounts</span>(sc)</pre>' },
        { id: 'cb', label: 'CellBender', html:
          '<pre class="code"><span class="c"># learns the soup and each cell\'s share itself</span>\n' +
          '<span class="k">cellbender remove-background</span> \\\n' +
          '  --input raw_feature_bc_matrix.h5 \\\n' +
          '  --output lane1_cellbender.h5 \\\n' +
          '  --expected-cells <span class="p" data-b="ecells"></span></pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="c"># the recipe: droplets with only 2 to 10 counts</span>\n' +
          'profile = ds.qc.<span class="k">ambient_profile</span>(total_counts=(2, 10))\n\n' +
          '<span class="c"># the share, from genes some cells cannot make</span>\n' +
          'gene_sets = {<span class="s">"haemoglobin"</span>: [<span class="s">"HBA1"</span>, <span class="s">"HBA2"</span>, <span class="s">"HBB"</span>]}\n' +
          'estimate = ds.qc.<span class="k">ambient_contamination</span>(\n    cells, profile,\n    gene_sets=gene_sets, clusters=clusters)\n\n' +
          '<span class="c"># or supply a share you already know</span>\n' +
          'estimate = ds.qc.<span class="k">ambient_contamination</span>(\n    cells, profile, fraction=' + num('ca') + ')\n\n' +
          'ds.qc.<span class="k">correct_ambient</span>(\n    estimate, assay_label=<span class="s">"RNA_soupx"</span>)</pre>' },
        { id: 'ss', label: 'Scanpy · Seurat', html:
          '<pre class="code"><span class="c"># Neither has an ambient RNA step. Correct first,\n# then build the object from the corrected counts.</span>\n' +
          '<span class="k">library</span>(Seurat)\n' +
          'obj &lt;- <span class="k">CreateSeuratObject</span>(counts = counts)</pre>' },
      ],
    },
  });
  G.book.onParam = (k, v) => { if (k === 'rho' && phase === 'set') { rho = G.clamp(Math.round(v * 100), 0, 40); lastSync = null; } };
}

function correct() {
  G.state.tries.soup++; G.save();
  let ghosts = 0, erased = 0;
  REAL.forEach((row, r) => row.forEach((e, c) => { const v = corrected(r, c); if (!e && v >= 0.3) ghosts++; if (e && e < 50 && v < e * 0.5) erased++; }));
  const err = Math.abs(rho - truth);
  res = { err, ghosts, erased, under: rho < truth, stars: err <= 2 ? 3 : err <= 4 ? 2 : err <= 7 ? 1 : 0 };
  phase = 'result'; rsel = res.stars ? 1 : 0;
  G.book.goal('near', err <= 2); G.book.goal('ghost', ghosts === 0); G.book.goal('real', erased === 0);
  G.book.unlock('s-probe'); G.book.unlock('s-over');
  if (res.stars) G.book.unlock('s-tools');
  G.sfx(res.stars ? 'star' : 'bad');
}
function retry() { phase = 'set'; res = null; ['near', 'ghost', 'real'].forEach(g => G.book.goal(g, null)); }
function keep() {
  const s = G.state;
  s.soup = { rho, truth };
  s.rooms.soup = { done: true, stars: Math.max(s.rooms.soup.stars, res.stars) };
  G.save();
  G.go('corridor', { from: 'soup', toast: 'SOUP REMOVED: ' + rho + '% OF EVERY CELL' });
}
function useEstimate() {
  const p = probe(cur.r, cur.c);
  if (!p.use) { G.sfx('bad'); return; }
  rho = G.clamp(Math.round(p.est), 0, 40); focus = 'slider'; G.sfx('ok');
}

G.scenes.soup = {
  phase: () => phase,
  enter() {
    build();
    rho = 0; cur = { r: 0, c: 3 }; focus = 'grid'; pt = 0; res = null; rsel = 0; lastSync = null; probed = false;
    beats = new G.Beats(INTRO);
    phase = G.state.tries.soup > 0 ? 'set' : 'intro';
    showBook(); sync();
  },
  leave() { G.book.onParam = null; },
  update(dt) {
    pt += dt;
    if (G.hit('b')) { G.go('corridor', { from: 'soup' }); return; }
    if (phase === 'intro') { if (beats.update(dt) === 'done') { phase = 'set'; pt = 0; } }
    else if (phase === 'set') {
      if (focus === 'grid') {
        if (G.hit('left')) cur.c = (cur.c + 5) % 6;
        if (G.hit('right')) cur.c = (cur.c + 1) % 6;
        if (G.hit('up')) cur.r = (cur.r + 3) % 4;
        if (G.hit('down')) { if (cur.r === 3) focus = 'slider'; else cur.r++; }
        if (G.hit('left') || G.hit('right') || G.hit('up') || G.hit('down')) { G.sfx('tick'); probed = true; }
        if (G.hit('a')) useEstimate();
      } else {
        const step = (G.rep('right') ? 1 : 0) - (G.rep('left') ? 1 : 0);
        if (step) { rho = G.clamp(rho + step, 0, 40); G.sfx('tick'); }
        if (G.hit('up')) focus = 'grid';
        if (G.hit('a')) correct();
      }
      /* click a square to probe it */
      if (G.ptr.pressed && G.over(MX, MYT, CW * 6, CH * 4)) {
        cur = { r: Math.floor((G.ptr.y - MYT) / CH), c: Math.floor((G.ptr.x - MX) / CW) }; focus = 'grid'; probed = true; G.sfx('tick');
      }
      if (probed) G.book.unlock('s-probe');
    } else if (phase === 'result') {
      const r = G.resultKeys(rsel, res.stars > 0); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') retry();
    }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#0b1122');
    drawGrid(); drawSide();
    G.roomHeader('1-4  SOUP KITCHEN', C.mint, true);
    if (phase === 'intro') { beats.draw(); return; }
    if (phase === 'set') {
      G.strip(130);
      T('SOUP SHARE TO REMOVE', 14, 136, focus === 'slider' ? C.white : C.mist);
      rho = G.slider('rho', 14, 152, 190, rho, 0, 40, 1, { focus: focus === 'slider', c: C.mint });
      T(rho + '%', 246, 147, C.mint, { a: 'right', f: 'lg' });
      /* take the estimate from the square under the cursor */
      const p = probe(cur.r, cur.c);
      if (G.button('use', 14, 163, 150, 13, 'USE THIS PROBE: ' + Math.min(999, Math.round(p.est)) + '%', { disabled: !p.use, focus: focus === 'grid' })) useEstimate();
      if (G.button('fix', 256, 134, 58, 28, 'CORRECT', { primary: true, focus: focus === 'slider' })) correct();
    } else {
      const msg = res.stars === 3 ? 'The ghosts are gone and the quiet real signal survived. Soup removed.'
        : res.under ? 'Not enough. Your T cells still express haemoglobin, and an annotator will believe them.'
        : 'Too much. The ghosts are gone, and so is real signal that happened to be quiet.';
      const act = G.resultDraw(130, msg, res.stars > 0, rsel, 'CHANGE THE SHARE', 'KEEP THIS MATRIX');
      if (act === 'keep') keep(); else if (act === 'retry') retry();
    }
  },
};

function drawGrid() {
  G.panel(4, 14, 190, 114, { border: C.slate, fill: '#0e1630' });
  GENES.forEach((g, c) => T(g, MX + c * CW + CW / 2, c % 2 ? 24 : 16, c === 5 ? C.coral : C.mist, { a: 'center' }));
  const blink = Math.floor(G.t * 4) % 2 === 0;
  ROWS.forEach((name, r) => {
    T(SHORT[r], MX - 6, MYT + r * CH + 4, RCOL[r], { a: 'right' });
    for (let c = 0; c < 6; c++) {
      const x = MX + c * CW, y = MYT + r * CH, v = phase === 'intro' ? obs[r][c] : corrected(r, c), s = side(v), real = REAL[r][c];
      R(x, y, CW - 1, CH - 1, '#111b3a');
      if (s) G.cell(x + Math.floor((CW - 1 - s) / 2), y + Math.floor((CH - 1 - s) / 2), c === 5 ? C.coral : RCOL[r], Math.max(3, s));
      if (phase === 'result' && blink) {
        if (!real && v >= 0.3) G.ring(x + 10, y + 7, 7, C.coral);
        if (real && real < 50 && v < real * 0.5) G.ring(x + 10, y + 7, 7, C.amber);
      }
    }
  });
  if (phase === 'set' && (focus === 'grid' || G.over(MX, MYT, CW * 6, CH * 4))) {
    const x = MX + cur.c * CW, y = MYT + cur.r * CH;
    R(x - 1, y - 1, CW + 1, 1, C.white); R(x - 1, y + CH - 1, CW + 1, 1, C.white); R(x - 1, y, 1, CH - 1, C.white); R(x + CW - 1, y, 1, CH - 1, C.white);
  }
  const cap = phase === 'result' ? ['RED RING: A GHOST IS LEFT', 'AMBER RING: REAL SIGNAL LOST']
    : phase === 'intro' ? ['BIG SQUARE: A REAL MARKER', 'SMALL SQUARE: A GHOST?'] : ['COUNTS PER 1,000 COUNTS', 'SQUARES SHRINK AS SOUP GOES'];
  T(cap[0], 99, 104, C.steel, { a: 'center' }); T(cap[1], 99, 114, C.steel, { a: 'center' });
}

function drawSide() {
  const x = 198, w = 118;
  G.panel(x, 14, w, 114, { border: C.slate, fill: '#0e1630' });
  T('THE SOUP', x + 6, 18, C.mist);
  /* a small pot, simmering */
  R(x + 88, 20, 20, 9, '#51648f'); R(x + 86, 19, 24, 2, C.fog); R(x + 90, 21, 16, 2, '#96708a');
  for (let i = 0; i < 3; i++) { const k = (G.t * 0.9 + i * 0.33) % 1; R(x + 92 + i * 5, 17 - k * 6, 1, 2, 'rgba(255,255,255,' + (0.5 - k * 0.5).toFixed(2) + ')'); }
  SOUP.forEach((v, c) => {
    const h = Math.round(v * 0.5), bx = x + 8 + c * 13;
    R(bx, 58 - h, 10, h, phase !== 'intro' && c === cur.c ? C.white : c === 5 ? C.coral : C.steel);
  });
  R(x + 6, 58, w - 12, 1, C.slate);
  if (phase !== 'set') T('EMPTY DROPLETS', x + 6, 61, C.steel);
  if (phase === 'intro') { T('PICK A SQUARE TO', x + 6, 84, C.steel); T('PROBE THE SHARE', x + 6, 93, C.steel); return; }
  if (phase === 'result') {
    T('REAL SHARE', x + 6, 76, C.mist); T(truth + '%', x + w - 6, 76, C.white, { a: 'right', f: 'smb' });
    T('YOU REMOVED', x + 6, 88, C.mist); T(rho + '%', x + w - 6, 88, res.err <= 2 ? C.mint : C.coral, { a: 'right', f: 'smb' });
    T('GHOSTS LEFT', x + 6, 100, C.mist); T(String(res.ghosts), x + w - 6, 100, res.ghosts ? C.coral : C.mint, { a: 'right', f: 'smb' });
    G.stars(x + 6, 114, res.stars);
    if (res.erased) T('SIGNAL LOST', x + w - 6, 114, C.amber, { a: 'right' });
    return;
  }
  const p = probe(cur.r, cur.c);
  T(GENES[cur.c] + ' IN ' + ROWS[cur.r], x + 6, 63, C.white);
  T('SEEN ' + obs[cur.r][cur.c].toFixed(1) + '   SOUP ' + SOUP[cur.c], x + 6, 73, C.mist);
  T('SAYS ' + (p.est > 99 ? Math.round(p.est) + '%?!' : Math.round(p.est) + '%'), x + 6, 85, p.use ? C.white : C.coral, { f: 'smb' });
  T(p.tag, x + 6, 97, p.use && p.tag !== 'ODD ONE OUT' ? C.mint : C.amber, { f: 'smb' });
  T(p.why[0], x + 6, 108, C.steel); T(p.why[1], x + 6, 117, C.steel);
}
})();
