/* Station 2-3, the Rotator. PCA in two parts. First the player turns one line through a plot
   of two genes to find the direction with the most variance: that is what a principal component
   is. Then a real PCA runs on the genes kept at station 2-2, and the player decides how many
   components to keep. With too few, some cell types cannot be told apart. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 180, PH = 110, SX = 190, SW = 126;
const CX = PX + PW / 2, CY = PY + PH / 2 + 2, GX = 'CD74', GY = 'LYZ';
const NAMES = ['T cells', 'NK cells', 'B cells', 'monocytes', 'rare cells'];
const PLOT = [PX - 1, PY - 1, PW + 2, PH + 2], SIDE = [SX, 14, SW, 114], STRIP = [0, 130, VW, 50];

let phase, beats, M, ang, spin, miss, pc, K, pur, need, dims, res, rsel, checks, lastSync, nGenes, ext, plat;

/* ---------- part one: two genes, one line ---------- */
function buildSpin() {
  const cl = G.cloud, jx = cl.genes.findIndex(g => g.name === GX), jy = cl.genes.findIndex(g => g.name === GY), n = M.length;
  let mx = 0, my = 0; M.forEach(r => { mx += r[jx]; my += r[jy]; }); mx /= n; my /= n;
  const pts = M.map(r => ({ x: r[jx] - mx, y: r[jy] - my }));
  let sxx = 0, syy = 0, sxy = 0, rmax = 0;
  pts.forEach(p => { sxx += p.x * p.x; syy += p.y * p.y; sxy += p.x * p.y; rmax = Math.max(rmax, Math.hypot(p.x, p.y)); });
  spin = { pts, tot: sxx + syy, rmax, s: 46 / rmax, top: 0, seen: 0 };
  spin.top = captured(0.5 * Math.atan2(2 * sxy, sxx - syy) * 180 / Math.PI);
  spin.seen = captured(0);
}
/* the share of the two genes' variance that lies along a line at this angle */
function captured(deg) {
  const c = Math.cos(deg * Math.PI / 180), s = Math.sin(deg * Math.PI / 180); let q = 0;
  spin.pts.forEach(p => { const t = p.x * c + p.y * s; q += t * t; });
  return q / spin.tot;
}
function lock() {
  if (captured(ang) >= spin.top - 0.012) {
    G.sfx('star'); G.book.unlock('p-what'); G.book.goal('axis', true);
    beats = new G.Beats([
      { spot: PLOT, say: 'That line is a principal component. PCA finds the best one across all ' + nGenes + ' genes, then the next best, and the next.' },
      { spot: SIDE, say: 'Each small picture shows the cells along two components. These bars show how much variance each one carries.' },
      { spot: STRIP, say: 'Keep the components whose pictures still show separate groups. Drop the blobs. Then press CHECK.' },
    ]);
    phase = 'bridge';
  } else { miss = new G.Beats([{ say: 'Not the widest yet. Keep turning the line, and watch the percentage.' }]); G.sfx('bad'); }
}

/* ---------- part two: all the genes, and how many components to keep ---------- */
function buildPca() {
  const cl = G.cloud, o = cl.settings(), st = cl.geneStats(), cols = cl.pick(st, o.method, o.n, o.block);
  nGenes = cols.length;
  pc = cl.pca(M, cols, 12, true); K = pc.ev.length;
  /* the sign of a component is arbitrary: fix it so the pictures are the same on every visit */
  for (let c = 0; c < K; c++) { let m = 0; pc.S.forEach((s, i) => { if (cl.cells[i].type === 3) m += s[c]; }); if (m < 0) pc.S.forEach(s => { s[c] = -s[c]; }); }
  pur = [null]; for (let d = 1; d <= K; d++) pur.push(cl.purity(pc.S, d).by);
  /* where each cell type settles once there are plenty of components, and the fewest components that get every type there */
  const late = pur.slice(Math.max(1, K - 5));
  plat = cl.TYPES.map((t, i) => cl.median(late.map(b => b[i])));
  need = 1; for (let d = 1; d <= K; d++) if (!pur[d].every((v, i) => okKind(d, i))) need = Math.min(K, d + 1);
  ext = 0; pc.S.forEach(s => { ext = Math.max(ext, Math.abs(s[0]), Math.abs(s[1])); });
}
/* a cell type counts as separated when it is close to where it settles. Eight cells give a
   jumpy score, so the rare type gets more room. A type that settles below half was lost earlier. */
const lost = i => plat[i] < 0.5;
const goal = i => plat[i] - (G.cloud.TYPES[i].n < 20 ? 0.08 : 0.05);
const okKind = (d, i) => lost(i) || pur[d][i] >= goal(i);
const keptVar = d => pc.ev.slice(0, d).reduce((a, b) => a + b, 0) / pc.tot;

function verdict() {
  const tail = lost(4) ? ' The rare cells were lost at the gene picker. No number of components brings them back.' : '';
  if (!res.pass) return 'With ' + dims + (dims === 1 ? ' component' : ' components') + ', the ' + NAMES[res.worst] + ' overlap with other cells. The component that separates them is one you dropped.';
  if (res.lean) return 'Every cell type stands apart, and the noisy components are gone. Each cell is now ' + dims + ' numbers instead of ' + nGenes + ' genes.' + tail;
  return 'Every cell type stands apart. The last components you kept are mostly noise. Still, too many is safer than too few.' + tail;
}

function sync() {
  const key = phase + '|' + dims;
  if (key === lastSync) return;
  lastSync = key;
  G.params.pdims = dims;
  G.book.sync();
}

function showBook() {
  const num = w => '<input class="p" data-p="pdims" id="p-dims-' + w + '" type="number" step="1" min="1" max="12" inputmode="numeric" aria-label="components to keep">';
  G.book.show({
    floor: 'Floor 2 · Station 2-3', room: 'The Rotator', aim: 'Describe each cell with a few principal components instead of many genes, without losing any cell type.',
    codeFirst: true, file: 'js/pca.js',
    goals: [
      { id: 'axis', text: 'Find the line that keeps the most variance' },
      { id: 'apart', text: 'Keep enough components to separate every cell type' },
      { id: 'lean', text: 'Leave out the components that are mostly noise' },
    ],
    notes: [
      { id: 'p-why', open: true, html: 'Many genes rise and fall together. Where one monocyte gene is high, the others are too. <b>PCA replaces many correlated genes with a few new axes</b>, called principal components, that keep most of the variation.' },
      { id: 'p-what', html: 'The first principal component is the direction along which the cells vary most. The second is the best direction at right angles to the first. Each one carries less variance than the one before.' },
      { id: 'p-elbow', html: 'Plot the variance of each component and look for the <b>elbow</b>, where the bars level off. Components before it carry structure. Components after it are mostly noise.' },
      { id: 'p-safe', html: 'The two mistakes are not equal. <b>Too few components lose cell types</b>, and rare ones go first. Too many cost computing time and add a little noise. When unsure, keep a few more.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'The <b>highlighted value</b> is the number of components you keep. It is live. This toy data has five cell types, so a few components are enough. Real tissues need more: 20 to 50 is common.',
      tabs: [
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          '<span class="c"># optional: give every gene the same variance</span>\n' +
          'sc.pp.<span class="k">scale</span>(adata, max_value=10)\n\n' +
          'sc.tl.<span class="k">pca</span>(adata, n_comps=50)\n\n' +
          '<span class="c"># the elbow plot</span>\n' +
          'sc.pl.<span class="k">pca_variance_ratio</span>(\n    adata, n_pcs=50, log=<span class="k">True</span>)\n\n' +
          '<span class="c"># the next step uses the components you keep</span>\n' +
          'sc.pp.<span class="k">neighbors</span>(adata, n_pcs=' + num('sc') + ')</pre>' },
        { id: 'se', label: 'R · Seurat', html:
          '<pre class="code"><span class="k">library</span>(Seurat)\n' +
          'obj &lt;- <span class="k">ScaleData</span>(obj)\n' +
          'obj &lt;- <span class="k">RunPCA</span>(obj, npcs = 50)\n\n' +
          '<span class="c"># the elbow plot</span>\n' +
          '<span class="k">ElbowPlot</span>(obj, ndims = 50)\n\n' +
          '<span class="c"># the next step uses the components you keep</span>\n' +
          'obj &lt;- <span class="k">FindNeighbors</span>(obj, dims = 1:' + num('se') + ')</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="c"># the default is 21 components</span>\n' +
          'pca = ds.reduction.<span class="k">pca</span>(\n    normalized,\n    dims=' + num('ca') + ',\n    show_elbow_plot=<span class="k">True</span>)</pre>' },
      ],
    },
  });
  G.book.onParam = (k, v) => { if (k === 'pdims' && phase === 'set') { dims = G.clamp(Math.round(v), 1, K); lastSync = null; } };
}

function check() {
  checks++; G.state.tries.pca++; G.save();
  const pass = dims >= need, lean = dims <= need + 4;
  let worst = -1; pur[dims].forEach((v, i) => { if (!lost(i) && (worst < 0 || v - goal(i) < pur[dims][worst] - goal(worst))) worst = i; });
  res = { pass, lean, worst, by: pur[dims], stars: !pass ? 0 : Math.max(1, (lean ? 3 : 2) - (checks > 3 ? 1 : 0)) };
  phase = 'result'; rsel = pass ? 1 : 0;
  G.book.goal('apart', pass); G.book.goal('lean', pass && lean);
  G.book.unlock('p-elbow'); if (pass) G.book.unlock('p-safe');
  G.sfx(pass ? 'star' : 'bad');
}
function retry() { phase = 'set'; res = null; ['apart', 'lean'].forEach(g => G.book.goal(g, null)); }
function keep() {
  const s = G.state;
  s.cloud = Object.assign({}, s.cloud, { dims });
  s.rooms.pca = { done: true, stars: Math.max(s.rooms.pca.stars, res.stars) };
  G.save();
  G.go('corridor', { from: 'pca', toast: dims + ' PRINCIPAL COMPONENTS KEPT' });
}

G.scenes.pca = {
  phase: () => phase,
  enter() {
    const cl = G.cloud; cl.build();
    M = cl.normalise({ depth: true, log: true });
    buildPca(); buildSpin();
    ang = 0; miss = null; dims = 1; res = null; rsel = 0; checks = 0; lastSync = null;
    beats = new G.Beats([
      { spot: PLOT, say: 'You kept ' + nGenes + ' genes. Many of them say the same thing. Here are two, ' + GX + ' and ' + GY + '. Each dot is a cell.' },
      { spot: SIDE, say: 'The yellow line is a new axis. This panel shows how far the cells spread along it. That spread is the variance.' },
      { spot: STRIP, say: 'Turn the line until the variance is as large as it gets. Then press LOCK.' },
    ]);
    phase = G.state.tries.pca > 0 ? 'set' : 'intro';
    showBook(); sync();
    if (phase === 'set') G.book.goal('axis', true);
  },
  leave() { G.book.onParam = null; },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'pca' }); return; }
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'spin'; }
    else if (phase === 'spin' && miss) { if (miss.update(dt) === 'done') miss = null; }
    else if (phase === 'spin') {
      const d = (G.rep('right') ? 1 : 0) - (G.rep('left') ? 1 : 0);
      if (d) { ang = (ang + d * 5 + 180) % 180; G.sfx('tick'); }
      /* drag in the picture: the line points at the pointer */
      if ((G.ptr.down || G.ptr.pressed) && !G.uiBusy() && G.over(PX, PY, PW, PH) && Math.hypot(G.ptr.x - CX, G.ptr.y - CY) > 6) {
        const a = Math.atan2(-(G.ptr.y - CY), G.ptr.x - CX) * 180 / Math.PI;
        ang = (Math.round(((a % 180) + 180) % 180 / 5) * 5) % 180;
      }
      spin.seen = Math.max(spin.seen, captured(ang));
      if (G.hit('a')) lock();
    } else if (phase === 'bridge') { if (beats.update(dt) === 'done') phase = 'set'; }
    else if (phase === 'set') {
      const d = (G.rep('right') ? 1 : 0) - (G.rep('left') ? 1 : 0);
      if (d) { const k = G.clamp(dims + d, 1, K); if (k !== dims) { dims = k; G.sfx('tick'); } }
      /* tap a picture to keep everything up to it */
      if (G.ptr.pressed && G.over(PX, PY, PW, PH)) {
        const k = Math.floor((G.ptr.x - PX) / 60) + 3 * Math.floor((G.ptr.y - PY) / 55);
        dims = G.clamp(2 * (G.clamp(k, 0, 5) + 1), 1, K); G.sfx('tick');
      }
      if (G.hit('a')) check();
    } else if (phase === 'result') {
      const r = G.resultKeys(rsel, res.pass); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') retry();
    }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#0b1122');
    const two = phase === 'intro' || phase === 'spin';
    if (two) { drawSpin(); drawShadow(); } else { drawPanels(); drawScree(); }
    G.roomHeader('2-3  THE ROTATOR', C.amber, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, verdict(), res.pass, rsel, 'CHOOSE AGAIN', 'KEEP ' + dims + ' COMPONENTS');
      if (act === 'keep') keep(); else if (act === 'retry') retry();
      return;
    }
    G.strip(y0);
    if (two) {
      T('ANGLE OF THE LINE', 14, y0 + 7, C.white);
      const v = G.slider('ang', 14, y0 + 26, 190, ang, 0, 175, 5, { focus: true, c: C.amber });
      if (v !== ang) ang = v;
      T(ang + ' DEGREES', 204, y0 + 7, C.amber, { a: 'right' });
      if (G.button('lock', 250, y0 + 8, 62, 28, 'LOCK', { primary: true })) lock();
    } else {
      T('COMPONENTS TO KEEP', 14, y0 + 7, C.white);
      const v = G.slider('dims', 14, y0 + 26, 190, dims, 1, K, 1, { focus: true, c: C.amber });
      if (v !== dims) dims = v;
      T(dims + ' OF ' + K, 204, y0 + 7, C.amber, { a: 'right' });
      if (G.button('chk', 250, y0 + 8, 62, 28, 'CHECK', { primary: true })) check();
    }
    if (phase === 'intro' || phase === 'bridge') beats.draw();
    else if (miss) miss.draw();
  },
};

function drawSpin() {
  const c = Math.cos(ang * Math.PI / 180), s = Math.sin(ang * Math.PI / 180), k = spin.s;
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  T(GY + ' LEVEL', PX + 3, PY + 3, C.steel); T(GX + ' LEVEL', PX + PW - 3, PY + PH - 10, C.steel, { a: 'right' });
  G.vdash(Math.round(CX), PY + 14, PY + PH - 12, '#1c2748', 1, 3); G.hdash(PX + 4, PX + PW - 4, Math.round(CY), '#1c2748', 1, 3);
  spin.pts.forEach(p => R(CX + p.x * k - 1, CY - p.y * k - 1, 2, 2, '#5a6c9c'));
  /* the line, and each cell projected onto it */
  G.line(CX - c * 52, CY + s * 52, CX + c * 52, CY - s * 52, '#7a5a1e');
  spin.pts.forEach(p => { const t = (p.x * c + p.y * s) * k; R(CX + t * c, CY - t * s, 1, 1, C.amber); });
  R(CX + c * 52 - 1, CY - s * 52 - 1, 3, 3, C.amber); R(CX - c * 52 - 1, CY + s * 52 - 1, 3, 3, C.amber);
}

function drawShadow() {
  const x = SX, w = SW, v = captured(ang), c = Math.cos(ang * Math.PI / 180), s = Math.sin(ang * Math.PI / 180);
  G.panel(x, 14, w, 114, { border: C.slate, fill: '#0e1630' });
  T('VARIANCE ON THE LINE', x + 6, 18, C.mist);
  T(Math.round(v * 100) + '%', x + 6, 28, C.amber, { f: 'lg' });
  R(x + 6, 46, w - 12, 3, C.slate); R(x + 6, 46, Math.round((w - 12) * v), 3, C.amber);
  T('BEST SO FAR: ' + Math.round(spin.seen * 100) + '%', x + 6, 52, C.steel);
  R(x + 5, 63, w - 10, 1, C.slate);
  T('CELLS ALONG THE LINE', x + 6, 67, C.mist);
  /* how the cells pile up along the line */
  const bins = new Array(28).fill(0);
  spin.pts.forEach(p => { const t = (p.x * c + p.y * s) / spin.rmax; bins[G.clamp(Math.floor((t + 1) / 2 * 28), 0, 27)]++; });
  bins.forEach((b, i) => { const h = Math.min(40, Math.round(b * 1.1)); if (h) R(x + 7 + i * 4, 120 - h, 3, h, C.amber); });
  R(x + 6, 120, w - 12, 1, C.slate);
}

function drawPanels() {
  const cl = G.cloud, shown = phase === 'result';
  for (let k = 0; k < 6; k++) {
    const x = PX + (k % 3) * 60, y = PY + Math.floor(k / 3) * 55, a = 2 * k, on = phase === 'bridge' || a < dims, cx = x + 29, cy = y + 30;
    if (a >= K) continue;
    R(x - 1, y - 1, 60, 55, on ? (phase === 'bridge' ? C.slate : C.amber) : '#1c2748'); R(x, y, 58, 53, on ? '#0e1630' : '#0c1226');
    T('PC ' + (a + 1) + (a + 1 < K ? ' + ' + (a + 2) : ''), x + 3, y + 2, on ? C.mist : '#4a5a85');
    pc.S.forEach((s, i) => {
      const px = cx + s[a] / ext * 25, py = cy - (a + 1 < K ? s[a + 1] : 0) / ext * 20;
      R(px, py, 2, 2, !on ? '#3a486e' : shown ? cl.TYPES[cl.cells[i].type].col : '#9aa7c7');
    });
  }
}

function drawScree() {
  const x = SX, w = SW, cl = G.cloud;
  G.panel(x, 14, w, 114, { border: C.slate, fill: '#0e1630' });
  if (phase === 'result') {
    T('NEIGHBOURS OF THE', x + 6, 18, C.mist); T('SAME CELL TYPE', x + 6, 27, C.mist);
    cl.TYPES.forEach((t, i) => {
      const y = 39 + i * 10, v = res.by[i];
      R(x + 6, y + 2, 4, 4, t.col); T(i === 4 ? 'RARE CELLS' : t.name, x + 13, y, C.fog);
      T(lost(i) ? 'LOST AT 2-2' : Math.floor(v * 100) + '%', x + w - 6, y, lost(i) ? C.steel : res.pass || okKind(dims, i) ? C.mint : C.coral, { a: 'right' });
    });
    R(x + 5, 91, w - 10, 1, C.slate);
    T('VARIANCE KEPT', x + 6, 96, C.fog); T(Math.round(keptVar(dims) * 100) + '%', x + w - 6, 96, C.white, { a: 'right' });
    if (res.pass) { G.stars(x + 6, 112, res.stars); T(checks + (checks === 1 ? ' CHECK' : ' CHECKS'), x + w - 6, 112, C.steel, { a: 'right' }); }
    return;
  }
  T('VARIANCE OF EACH PC', x + 6, 18, C.mist);
  const top = pc.ev[0] / pc.tot, bw = Math.floor((w - 14) / K), all = phase === 'bridge';
  for (let i = 0; i < K; i++) {
    const h = Math.max(1, Math.round(pc.ev[i] / pc.tot / top * 50)), on = all || i < dims;
    R(x + 7 + i * bw, 84 - h, bw - 2, h, on ? C.amber : '#3d4868');
  }
  R(x + 6, 84, w - 12, 1, C.slate);
  T('PC 1', x + 7, 87, C.steel); T('PC ' + K, x + w - 7, 87, C.steel, { a: 'right' });
  if (all) return;
  T('YOU KEEP', x + 6, 101, C.fog); T(dims + ' OF ' + K, x + w - 6, 101, C.amber, { a: 'right' });
  T('VARIANCE KEPT', x + 6, 112, C.fog); T(Math.round(keptVar(dims) * 100) + '%', x + w - 6, 112, C.white, { a: 'right' });
}
})();
