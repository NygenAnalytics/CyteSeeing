/* Station 2-2, the Gene Picker. Feature selection. Every gene is a dot: its mean expression
   against how much it varies between cells. The player chooses how genes are ranked, how many
   to keep, and whether to leave out mitochondrial and ribosomal genes. CHECK runs a real PCA on
   the kept genes and asks whether cells of one type still sit next to each other. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 180, PH = 110, SX = 190, SW = 126;
const NS = [12, 24, 40, 64, 100, 207];
/* the toy matrix has 207 genes; the terminal shows the matching number for a real one of about 20,000 */
const REAL = { 12: 500, 24: 1000, 40: 2000, 64: 3000, 100: 5000, 207: 20000 };
const KNOWN = [['CD3E', 'T CELLS', 'T cells'], ['MS4A1', 'B CELLS', 'B cells'], ['NKG7', 'NK CELLS', 'NK cells'], ['LYZ', 'MONOCYTES', 'monocytes'], ['FCER1A', 'RARE CELLS', 'the rare cells']];

const TOUR = [
  { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'Each dot is a gene. Genes on the right are expressed more. Genes higher up vary more from cell to cell.' },
  { spot: [0, 130, VW, 50], say: 'Choose how to rank the genes and how many to keep. The ones you keep turn yellow.' },
  { spot: [SX, 14, SW, 114], say: 'This list checks five marker genes, one per cell type. Get them all IN, keep the list short, then press CHECK.' },
];

let phase, beats, st, M, dots, method, ni, block, sel, picked, cut, res, rsel, checks, lastSync, range, missing, nuis;

function layout() {
  const key = method === 'raw' ? 'lv' : 'ls', r = range[key];
  st.forEach((g, i) => {
    dots[i].tx = PX + 6 + (g.lm - range.lm[0]) / (range.lm[1] - range.lm[0]) * (PW - 12);
    dots[i].ty = PY + PH - 14 - (g[key] - r[0]) / (r[1] - r[0]) * (PH - 28);
    if (dots[i].x === undefined) { dots[i].x = dots[i].tx; dots[i].y = dots[i].ty; }
  });
}
const countKind = kind => Object.keys(picked).filter(j => G.cloud.genes[j].kind === kind).length;
function repick() {
  const cl = G.cloud, cols = cl.pick(st, method, NS[ni], block), key = method === 'raw' ? 'lv' : 'ls', r = range[key];
  picked = {}; cols.forEach(j => { picked[j] = true; });
  const low = Math.min.apply(null, cols.map(j => st[j][key]));
  cut = PY + PH - 14 - (low - r[0]) / (r[1] - r[0]) * (PH - 28);
  missing = KNOWN.filter(k => !picked[cl.genes.findIndex(g => g.name === k[0])]);
  nuis = countKind('ribo');
  return cols;
}

/* ready to be checked: ranked sensibly, every marker in, and not too long */
const ready = () => method === 'trend' && !missing.length && NS[ni] < 100;
function verdict() {
  if (res.stars === 3) return 'All five cell types separate with this list. Even the 8 rare cells.';
  if (res.stars === 2) return 'It works. But mitochondrial and ribosomal genes are in the list. In this data they are technical noise, and they will cost you a component later.';
  if (res.stars === 1) {
    const lead = 'The four big cell types separate, but the 8 rare cells are lost. ';
    if (method === 'raw') return lead + 'Variance alone never reaches their marker genes.';
    if (!res.rareIn) return lead + 'None of their marker genes made the list.';
    return lead + 'Their markers are in, but ' + res.noise + ' noise genes drown them out.';
  }
  if (method === 'raw') return 'Variance alone picks highly expressed genes, not informative ones. Rank by ABOVE TREND instead.';
  if (NS[ni] <= 24) return 'The list is too short. Some cell types have no marker gene in it. Keep more genes.';
  if (NS[ni] === 207) return 'With every gene in the list, noise outweighs the markers. Keep fewer genes.';
  return 'Some cell types still overlap. Look at which markers are OUT.';
}

function sync() {
  const key = [phase, method, ni, block].join('|');
  if (key === lastSync) return;
  lastSync = key;
  G.params.hmethod = method; G.params.hn = REAL[NS[ni]]; G.params.hblock = block ? 'on' : 'off';
  G.book.sync();
}

function showBook() {
  const n = '<span class="p" data-b="hn"></span>';
  G.book.show({
    floor: 'Floor 2 · Station 2-2', room: 'The Gene Picker', aim: 'Keep the genes that differ between cell types, and leave out the genes that only add noise.',
    codeFirst: true, file: 'js/hvg.js',
    goals: [
      { id: 'common', text: 'Each of the four large cell types stays separate' },
      { id: 'rare', text: 'The 8 rare cells stay separate too' },
      { id: 'nuis', text: 'No mitochondrial or ribosomal genes in the list' },
    ],
    notes: [
      { id: 'h-what', open: true, html: 'Of about 20,000 genes, a few thousand differ between cell types. The rest add noise to every comparison between cells. <b>Feature selection keeps the informative genes</b>, usually called highly variable genes.' },
      { id: 'h-trend', html: 'Highly expressed genes vary more, whatever they do. So genes are not ranked by variance alone. They are ranked by how far their variance is <b>above what their mean expression predicts</b>.' },
      { id: 'h-many', html: 'Common choices are <b>1,000 to 5,000</b> genes. With too few, some cell types have no marker gene in the list. With too many, noise comes back. In this data set the 8 rare cells are the first to be lost either way.' },
      { id: 'h-scale', html: 'Before PCA, each gene is usually scaled to the same variance, so that highly expressed genes do not dominate. The cost is that an uninformative gene in the list then counts as much as a marker gene.' },
      { id: 'h-check', html: 'After selecting, <b>look up a few marker genes you know</b>. If the marker of a population you care about is missing, that population may not be found later.' },
      { id: 'h-skip', html: 'Mitochondrial and ribosomal genes often rank high because they follow cell quality and library composition. Many pipelines exclude them by name. This is a judgement call: keep them if they are part of your question.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'This toy matrix has 207 genes. The <b>highlighted number</b> is the matching choice for a real matrix of about 20,000 genes. Real tools do not offer ranking by variance alone.',
      tabs: [
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          'sc.pp.<span class="k">highly_variable_genes</span>(\n    adata,\n    n_top_genes=' + n + ',\n' +
          '<span class="hl" data-on="hmethod=trend">    <span class="c"># variance above the trend</span>\n    flavor=<span class="s">"seurat_v3"</span>,</span>\n' +
          '    layer=<span class="s">"counts"</span>,  <span class="c"># reads raw counts</span>\n)\n\n' +
          '<span class="hl" data-on="hblock=on"><span class="c"># leave mito and ribosomal genes out</span>\n' +
          'skip = adata.var_names.str.<span class="k">match</span>(\n    <span class="s">r"^MT-|^RP[SL]"</span>)\n' +
          'adata.var.loc[skip, <span class="s">"highly_variable"</span>] = <span class="k">False</span></span></pre>' },
        { id: 'se', label: 'R · Seurat', html:
          '<pre class="code"><span class="k">library</span>(Seurat)\n' +
          'obj &lt;- <span class="k">FindVariableFeatures</span>(obj,\n' +
          '<span class="hl" data-on="hmethod=trend">    selection.method = <span class="s">"vst"</span>,</span>\n' +
          '    nfeatures = ' + n + ')\n\n' +
          '<span class="hl" data-on="hblock=on"><span class="c"># leave mito and ribosomal genes out</span>\n' +
          'hvg &lt;- <span class="k">VariableFeatures</span>(obj)\n' +
          '<span class="k">VariableFeatures</span>(obj) &lt;-\n    hvg[!<span class="k">grepl</span>(<span class="s">"^MT-|^RP[SL]"</span>, hvg)]</span>\n\n' +
          '<span class="c"># look up a marker you know</span>\n' +
          '<span class="s">"FCER1A"</span> %in% <span class="k">VariableFeatures</span>(obj)</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="hl" data-on="hblock=on"><span class="c"># by default a name blacklist leaves out mito,\n# ribosomal and a few other gene families</span>\n' +
          'features = ds.features.<span class="k">hvgs</span>(\n    cells, top_n=' + n + ')</span>\n\n' +
          '<span class="hl" data-on="hblock=off"><span class="c"># an empty blacklist keeps every gene name</span>\n' +
          'features = ds.features.<span class="k">hvgs</span>(\n    cells, top_n=' + n + ', blacklist=<span class="s">""</span>)</span>\n\n' +
          '<span class="hl" data-on="hmethod=trend"><span class="c"># the same score as Seurat and Scanpy</span>\n' +
          'features = ds.features.<span class="k">hvgs</span>(\n    cells, top_n=' + n + ',\n    flavor=<span class="s">"seurat_v3"</span>)</span></pre>' },
      ],
    },
  });
}

function check() {
  checks++; G.state.tries.hvg++; G.save();
  const cl = G.cloud, cols = repick(), pc = cl.pca(M, cols, 6, true), pu = cl.purity(pc.S, 6);
  const common = Math.min(pu.by[0], pu.by[1], pu.by[2], pu.by[3]), pass = common >= 0.9, rare = pu.by[4] >= 0.85;
  res = { pass, by: pu.by, rare, nuis, noise: countKind('noise') + countKind('house'), rareIn: countKind('rare'), stars: !pass ? 0 : !rare ? 1 : nuis ? 2 : 3 };
  phase = 'result'; rsel = pass ? 1 : 0;
  G.book.goal('common', pass); G.book.goal('rare', rare); G.book.goal('nuis', nuis === 0);
  G.book.unlock('h-trend'); G.book.unlock('h-many'); G.book.unlock('h-scale');
  if (pass) { G.book.unlock('h-check'); G.book.unlock('h-skip'); }
  G.sfx(pass ? 'star' : 'bad');
}
function retry() { phase = 'set'; res = null; ['common', 'rare', 'nuis'].forEach(g => G.book.goal(g, null)); }
function keep() {
  const s = G.state;
  s.cloud = Object.assign({}, s.cloud, { method, n: NS[ni], block });
  s.rooms.hvg = { done: true, stars: Math.max(s.rooms.hvg.stars, res.stars) };
  G.save();
  G.go('corridor', { from: 'hvg', toast: NS[ni] + ' GENES KEPT' });
}
function change(i, d) {
  if (i === 0) method = method === 'raw' ? 'trend' : 'raw';
  else if (i === 1) { const k = G.clamp(ni + d, 0, NS.length - 1); if (k === ni) return; ni = k; }
  else block = !block;
  layout(); repick(); G.sfx('tick');
}

G.scenes.hvg = {
  phase: () => phase,
  enter() {
    const cl = G.cloud; cl.build();
    st = cl.geneStats(); M = cl.normalise({ depth: true, log: true });
    const span = k => { const v = st.map(g => g[k]); return [Math.min.apply(null, v), Math.max.apply(null, v)]; };
    range = { lm: span('lm'), lv: span('lv'), ls: span('ls') };
    dots = st.map(() => ({}));
    method = 'raw'; ni = 5; block = false; sel = 0; res = null; rsel = 0; checks = 0; lastSync = null;
    layout(); repick();
    beats = new G.Beats(TOUR);
    phase = G.state.tries.hvg > 0 ? 'set' : 'intro';
    showBook(); sync();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'hvg' }); return; }
    dots.forEach(p => { p.x += (p.tx - p.x) * Math.min(1, dt * 7); p.y += (p.ty - p.y) * Math.min(1, dt * 7); });
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'set'; }
    else if (phase === 'set') {
      if (G.hit('up')) sel = (sel + 3) % 4;
      if (G.hit('down')) sel = (sel + 1) % 4;
      if (sel < 3) { const d = (G.hit('right') ? 1 : 0) - (G.hit('left') ? 1 : 0); if (d) change(sel, d); }
      if (G.hit('a')) { if (sel === 3) check(); else if (sel === 1) sel = 3; else change(sel, 1); }
    } else if (phase === 'result') {
      const r = G.resultKeys(rsel, res.pass); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') retry();
    }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#0b1122');
    drawPlot(); drawSide();
    G.roomHeader('2-2  THE GENE PICKER', C.lilac, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, verdict(), res.pass, rsel, 'CHANGE THE LIST', 'KEEP THIS LIST');
      if (act === 'keep') keep(); else if (act === 'retry') retry();
      return;
    }
    G.strip(y0);
    const row = (i, y, label) => { T(label, 14, y + 2, sel === i ? C.white : C.mist); if (sel === i && Math.floor(G.t * 3) % 2 === 0) T('>', 6, y + 2, C.cyan); };
    const pair = (i, y, on, a, b) => [a, b].forEach((txt, k) => {
      const bx = 112 + k * 68, act = (k === 0) === on, over = G.over(bx, y, 64, 12);
      if (over && G.ptr.pressed && !act) { sel = i; change(i, 1); }
      G.panel(bx, y, 64, 12, { border: act ? C.amber : over ? C.cyan : C.slate, fill: act ? '#3a2f12' : C.ink });
      T(txt, bx + 32, y + 2, act ? C.amber : C.mist, { a: 'center' });
    });
    row(0, y0 + 4, 'RANK GENES BY'); pair(0, y0 + 4, method === 'raw', 'VARIANCE', 'ABOVE TREND');
    row(1, y0 + 18, 'NUMBER TO KEEP');
    const k = G.slider('hn', 116, y0 + 23, 76, ni, 0, NS.length - 1, 1, { c: C.amber, marks: [1, 2, 3, 4] });
    if (k !== ni) { sel = 1; change(1, k - ni); }
    T(NS[ni] === 207 ? 'ALL 207' : NS[ni] + ' GENES', 244, y0 + 20, C.amber, { a: 'right' });
    row(2, y0 + 32, 'MITO, RIBO GENES'); pair(2, y0 + 32, block, 'LEAVE OUT', 'KEEP');
    if (G.button('chk', 250, y0 + 8, 62, 28, 'CHECK', { primary: true, focus: sel === 3 })) check();
    if (phase === 'set' && ready()) G.cue(281, y0 + 7, true);
    if (phase === 'intro') beats.draw();
  },
};

const KCOL = { mark: C.cyan, rare: C.pink, ribo: C.coral, house: '#8a93ad', noise: '#8a93ad' };
function drawPlot() {
  const cl = G.cloud, shown = phase === 'result';
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  T(method === 'raw' ? 'VARIANCE' : 'VARIANCE ABOVE TREND', PX + 3, PY + 3, C.steel);
  if (!shown) T('MEAN EXPRESSION', PX + PW - 3, PY + PH - 10, C.steel, { a: 'right' });
  G.hdash(PX + 2, PX + PW - 2, Math.round(cut) + 2, C.amber, 2, 3); T('KEPT ABOVE', PX + PW - 3, Math.round(cut) - 7, C.amber, { a: 'right' });
  /* genes that are not kept first, so the kept ones sit on top */
  [false, true].forEach(top => st.forEach((g, i) => {
    const p = dots[i], kind = cl.genes[g.j].kind, on = !!picked[g.j];
    if (on !== top) return;
    if (shown) { if (on) R(p.x - 1, p.y - 1, 3, 3, KCOL[kind]); else R(p.x, p.y, 1, 1, kind === 'noise' || kind === 'house' ? '#3d4868' : KCOL[kind]); }
    else if (kind === 'ribo') R(p.x - 1, p.y - 1, on ? 3 : 2, on ? 3 : 2, on ? C.coral : '#8a3f4a');
    else R(p.x - 1, p.y - 1, 2, 2, on ? C.amber : '#4a5a85');
  }));
  const y = PY + PH - 10;
  if (shown) {
    R(PX + 3, y + 2, 3, 3, C.cyan); T('MARKER', PX + 8, y, C.cyan); R(PX + 46, y + 2, 3, 3, C.pink); T('RARE-CELL MARKER', PX + 51, y, C.pink);
    R(PX + 140, y + 2, 3, 3, '#8a93ad'); T('NOISE', PX + 145, y, '#8a93ad');
  } else { R(PX + 3, y + 2, 2, 2, C.amber); T('KEPT', PX + 7, y, C.amber); R(PX + 32, y + 2, 2, 2, C.coral); T('MITO, RIBO', PX + 36, y, C.coral); }
}

function drawSide() {
  const x = SX, w = SW, cl = G.cloud;
  G.panel(x, 14, w, 114, { border: C.slate, fill: '#0e1630' });
  if (phase === 'result') {
    T('NEIGHBOURS OF THE', x + 6, 18, C.mist); T('SAME CELL TYPE', x + 6, 27, C.mist);
    cl.TYPES.forEach((t, i) => {
      const y = 39 + i * 10, v = res.by[i];
      R(x + 6, y + 2, 4, 4, t.col); T(i === 4 ? 'RARE CELLS' : t.name, x + 13, y, C.fog);
      T(Math.floor(v * 100) + '%', x + w - 6, y, v >= (i === 4 ? 0.85 : 0.9) ? C.mint : C.coral, { a: 'right' });
    });
    R(x + 5, 91, w - 10, 1, C.slate);
    T('NOISE GENES KEPT', x + 6, 95, C.fog); T(String(res.noise), x + w - 6, 95, res.noise > 12 ? C.coral : C.mint, { a: 'right' });
    T('MITO, RIBO KEPT', x + 6, 105, C.fog); T(String(res.nuis), x + w - 6, 105, res.nuis ? C.coral : C.mint, { a: 'right' });
    if (res.pass) G.stars(x + 6, 117, res.stars); else T('AIM: 90% OR MORE', x + 6, 117, C.steel);
    return;
  }
  T('GENES KEPT', x + 6, 18, C.mist); T(NS[ni] + ' OF 207', x + w - 6, 18, C.amber, { a: 'right' });
  R(x + 5, 29, w - 10, 1, C.slate);
  T('MARKER GENE CHECK', x + 6, 33, C.mist);
  KNOWN.forEach((k, i) => {
    const y = 45 + i * 10, on = !!picked[cl.genes.findIndex(g => g.name === k[0])];
    T(k[0], x + 6, y, C.fog); T(k[1], x + 44, y, C.steel);
    T(on ? 'IN' : 'OUT', x + w - 6, y, on ? C.mint : C.coral, { a: 'right' });
  });
  R(x + 5, 97, w - 10, 1, C.slate);
  T('MITOCHONDRIAL AND', x + 6, 101, C.fog); T('RIBOSOMAL GENES IN', x + 6, 110, C.fog);
  T(String(nuis), x + w - 6, 110, nuis ? C.coral : C.mint, { a: 'right', f: 'smb' });
}
})();
