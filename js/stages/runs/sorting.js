/* Station 4-1, the Sorting table. Two runs of the same kind of sample are drawn on one map
   before anything is corrected, and every cell type turns up twice: once per run. The player
   ties each island to its partner in the other run by comparing marker genes, and leaves alone
   the one island that has no partner. The threads then all point the same way, which is what a
   batch effect looks like: a shift every cell type shares.
   Which islands are partners is worked out from the cells (see loads.islands). */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 180, PH = 110, SX = 190, SW = 126;
const L = () => G.loads;

let phase, beats, tip, I, pos, cent, cur, held, ties, slips, res, rsel, load, snap, flash, onDone, saidSame;

const partnerOf = k => { const t = ties.find(q => q[0] === k || q[1] === k); return t ? (t[0] === k ? t[1] : t[0]) : -1; };
const isl = k => I.isl[k];
const dist = (a, b) => Math.hypot(cent[a][0] - cent[b][0], cent[a][1] - cent[b][1]);
/* the island of the other run that sits closest on the map */
const closest = k => { let best = -1, bd = 1e9; I.isl.forEach(o => { if (o.load !== isl(k).load && dist(k, o.id) < bd) { bd = dist(k, o.id); best = o.id; } }); return best; };

function lights() {
  const all = ties.length === I.pairs.length;
  G.book.goal('pair', all ? true : null); G.book.goal('lone', phase === 'result' ? true : null);
}
function showBook() {
  G.book.show({
    floor: 'The Laundry · Station 4-1', room: 'The sorting table', aim: 'Find the islands that are one cell type, split in two by the run.',
    file: 'js/stages/runs/sorting.js',
    goals: [
      { id: 'pair', text: 'Every shared cell type is tied across the two runs' },
      { id: 'lone', text: 'An island with no partner is left alone' },
    ],
    notes: [
      { id: 's-what', open: true, html: 'A <b>batch effect</b> is a difference that comes from handling, not from the cells: the day, the kit, the operator, the sequencer. Here Thursday\'s tubes waited on the bench, and every gene came out a little higher or lower than on Monday.' },
      { id: 's-bio', html: 'A shift that every cell type shares is what handling looks like, but it is not proof. An infection or a drug can also change every cell type at once. Only the design of the study can say which it is.' },
      { id: 's-look', open: true, html: 'Always draw the samples together <b>before</b> correcting anything. If they already overlap, there is nothing to correct, and a correction can only do harm.' },
      { id: 's-mnn', html: 'Seurat\'s <b>anchors</b> and the MNN method find these pairs cell by cell: two cells from different runs that are each among the other\'s nearest neighbours (mutual nearest neighbours).' },
      { id: 's-comp', html: 'Runs rarely hold the same cells. A cell type found in one run only, or in very different numbers, is not a batch effect. Methods that expect the runs to match will pull such cells toward the wrong partner.' },
      { id: 's-toy', html: 'In this game two islands are partners when each is the other\'s best match: the correlation of their mean expression over the variable genes, after each run\'s own mean is subtracted.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'Analyse the runs together with <b>no correction</b> first, and colour the map by run.',
      tabs: [
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          '<span class="c"># variable genes, ranked inside each run</span>\n' +
          'sc.pp.<span class="k">highly_variable_genes</span>(\n    adata,\n    n_top_genes=2000,\n    batch_key=<span class="s">"batch"</span>,\n)\n' +
          'sc.pp.<span class="k">pca</span>(adata)\nsc.pp.<span class="k">neighbors</span>(adata)\nsc.tl.<span class="k">umap</span>(adata)\n' +
          'sc.tl.<span class="k">leiden</span>(adata, flavor=<span class="s">"igraph"</span>,\n    n_iterations=2)\n\n' +
          '<span class="c"># look first: do the runs sit apart?</span>\n' +
          'sc.pl.<span class="k">umap</span>(\n    adata, color=[<span class="s">"batch"</span>, <span class="s">"leiden"</span>])</pre>' },
        { id: 'se', label: 'R · Seurat', html:
          '<pre class="code"><span class="k">library</span>(Seurat)\n' +
          '<span class="c"># one layer of counts per run</span>\n' +
          'obj[[<span class="s">"RNA"</span>]] &lt;- <span class="k">split</span>(\n    obj[[<span class="s">"RNA"</span>]], f = obj$batch)\n' +
          'obj &lt;- <span class="k">NormalizeData</span>(obj)\nobj &lt;- <span class="k">FindVariableFeatures</span>(obj)\nobj &lt;- <span class="k">ScaleData</span>(obj)\nobj &lt;- <span class="k">RunPCA</span>(obj)\n' +
          'obj &lt;- <span class="k">RunUMAP</span>(obj, dims = 1:30,\n    reduction = <span class="s">"pca"</span>,\n    reduction.name = <span class="s">"umap.unintegrated"</span>)\n\n' +
          '<span class="c"># look first: do the runs sit apart?</span>\n' +
          '<span class="k">DimPlot</span>(obj,\n    reduction = <span class="s">"umap.unintegrated"</span>,\n    group.by = <span class="s">"batch"</span>)</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="k">from</span> cytearc.plotting <span class="k">import</span> CellField\n\n' +
          '<span class="c"># the whole recipe with no correction, and\n# variable genes ranked inside each run</span>\n' +
          'uncorrected = ds.pipeline.<span class="k">rna</span>(\n    label=<span class="s">"uncorrected"</span>,\n    hvg={<span class="s">"batch"</span>: <span class="s">"batch"</span>},\n)\n\n' +
          '<span class="c"># look first: do the runs sit apart?</span>\n' +
          'ds.plots.<span class="k">embedding</span>(\n    run=uncorrected,\n    color_by=CellField(<span class="s">"batch"</span>),\n)</pre>' },
      ],
    },
  });
}

/* ---------- moving about ---------- */
/* the next island in a direction: the one that is nearest, with a penalty for being off to the side */
function step(dx, dy) {
  if (onDone) { if (dy < 0) { onDone = false; G.sfx('tick'); } return; }
  let best = -1, bs = 1e9;
  I.isl.forEach(o => {
    if (o.id === cur) return;
    const vx = cent[o.id][0] - cent[cur][0], vy = cent[o.id][1] - cent[cur][1], along = vx * dx + vy * dy, side = Math.abs(vx * dy) + Math.abs(vy * dx);
    if (along <= 2) return;
    const s = along + side * 2.2; if (s < bs) { bs = s; best = o.id; }
  });
  if (best >= 0) { cur = best; G.sfx('tick'); }
  else if (dy > 0) { onDone = true; G.sfx('tick'); }
}
function say(text) { tip = new G.Beats([{ say: text }]); }

/* ---------- the thread ---------- */
function thread() {
  if (held < 0) { if (partnerOf(cur) < 0) { held = cur; G.sfx('blip'); } else G.sfx('tick'); return; }
  if (cur === held) { held = -1; G.sfx('tick'); return; }
  if (isl(cur).load === isl(held).load) { G.sfx('bad'); if (!saidSame) { saidSame = true; say('A thread joins an island from Monday to an island from Thursday.'); } return; }
  if (partnerOf(cur) >= 0) { G.sfx('tick'); return; }
  G.state.tries.sort++; G.save();
  if (isl(held).partner === cur) {
    ties.push(isl(held).load === 0 ? [held, cur] : [cur, held]); flash = G.t; held = -1; G.sfx('ok'); lights();
    return;
  }
  slips++; snap = { a: held, b: cur, t: G.t }; G.sfx('bad');
  const lone = isl(held).partner < 0 ? held : isl(cur).partner < 0 ? cur : -1;
  say(lone >= 0 ? 'No island in the other run carries these genes. Some cells are in one run only, and have no partner.'
    : closest(held) === cur || closest(cur) === held ? 'Those two are close on the map, but their genes differ. Closest is not the same as matching.'
    : 'Not a pair. Partners carry the same marker genes.');
  held = -1;
}
function finish() {
  held = -1;
  G.state.tries.sort++; G.save();
  if (ties.length < I.pairs.length) { slips++; G.sfx('bad'); say('Not yet. An island from Monday still has no thread.'); return; }
  res = { stars: slips === 0 ? 3 : slips === 1 ? 2 : 1 }; phase = 'result'; rsel = 1; flash = G.t; onDone = false;
  ['s-bio', 's-mnn', 's-comp', 's-toy'].forEach(n => G.book.unlock(n)); lights(); G.sfx('star');
}
function keep() {
  const s = G.state;
  s.rooms.sort = { done: true, stars: Math.max(s.rooms.sort.stars, res.stars) };
  G.save(); G.go('corridor', { from: 'sort' });
}
function restart() { ties = []; held = -1; slips = 0; res = null; phase = 'play'; onDone = false; lights(); }

G.scenes.sort = {
  phase: () => phase,
  dbg: { cur: () => cur, held: () => held, ties: () => ties.map(q => q.slice()), slips: () => slips, onDone: () => onDone,
    islands: () => I.isl.map(a => ({ id: a.id, load: a.load, partner: a.partner, x: cent[a.id][0], y: cent[a.id][1] })), go: k => { cur = k; onDone = false; } },
  enter() {
    phase = 'load'; load = 0; ties = []; held = -1; slips = 0; res = null; rsel = 0; tip = null; snap = null; flash = -9; onDone = false; saidSame = false;
    beats = new G.Beats([
      { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'Two runs of the same kind of sample, on one map. Blue cells were run on Monday, orange cells on Thursday.' },
      { spot: [SX, 14, SW, 114], say: 'Every island has marker genes. An island from each run with the same genes is one cell type, in two places.' },
      { say: 'Tie each island to its partner in the other run. When no partner is left to find, press NO MORE PAIRS.' },
    ]);
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'sort' }); return; }
    if (phase === 'load') {
      if (++load < 3) return;
      I = L().islands(); pos = L().place(null, PX + 10, PY + 14, PW - 22, PH - 24);
      cent = I.isl.map(a => { let x = 0, y = 0; a.cells.forEach(i => { x += pos[i][0]; y += pos[i][1]; }); return [Math.round(x / a.cells.length), Math.round(y / a.cells.length)]; });
      /* start on the largest island of Monday's run */
      cur = I.isl.filter(a => a.load === 0).sort((a, b) => b.cells.length - a.cells.length)[0].id;
      phase = G.state.tries.sort > 0 ? 'play' : 'intro'; lights();
      return;
    }
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'play'; }
    else if (phase === 'play') {
      if (tip) { if (tip.update(dt) === 'done') tip = null; return; }
      if (G.hit('left')) step(-1, 0); if (G.hit('right')) step(1, 0); if (G.hit('up')) step(0, -1); if (G.hit('down')) step(0, 1);
      if (G.ptr.pressed && G.over(PX, PY, PW, PH)) {
        let best = -1, bd = 26; cent.forEach((q, k) => { const d = Math.hypot(q[0] - G.ptr.x, q[1] - G.ptr.y); if (d < bd) { bd = d; best = k; } });
        if (best >= 0) { cur = best; onDone = false; G.sfx('tick'); }
      }
      if (G.act()) { if (onDone) finish(); else thread(); }
    } else if (phase === 'result') {
      const r = G.resultKeys(rsel, true); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') restart();
    }
  },
  draw() {
    R(0, 0, VW, VH, '#16101c');
    if (phase === 'load') { G.roomHeader('4-1  THE SORTING TABLE', C.cyan, true); T('TIPPING OUT TWO RUNS...', VW / 2, 84, C.fog, { a: 'center' }); return; }
    drawMap(); drawSide();
    G.roomHeader('4-1  THE SORTING TABLE', C.cyan, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, 'All five shifts match. What every cell type shares comes from the run. The island left over is real.', true, rsel, 'START AGAIN', 'KEEP THE PAIRS');
      if (act === 'keep') keep(); else if (act === 'retry') restart();
      return;
    }
    G.strip(y0);
    T('PAIRS TIED', 12, y0 + 5, C.fog); T(String(ties.length), 12, y0 + 14, C.white, { f: 'lg' });
    T(G.kt('ARROWS: ISLAND', 'TAP AN ISLAND,'), 12, y0 + 30, C.steel); T(G.kt('SPACE: THREAD', 'THEN A BUTTON'), 12, y0 + 39, C.steel);
    const live = phase === 'play' && !tip;
    if (G.button('thread', 96, y0 + 8, 100, 28, held < 0 ? 'TAKE THE THREAD' : 'TIE IT HERE', { primary: true, focus: live && !onDone }) && live) { onDone = false; thread(); }
    if (G.button('done', 204, y0 + 8, 108, 28, 'NO MORE PAIRS', { focus: live && onDone }) && live) finish();
    if (live && ties.length === I.pairs.length) G.cue(258, y0 + 7, true);
    if (phase === 'intro') beats.draw();
    if (tip) tip.draw();
  },
};

const col = b => L().COLS[b];
function marksAt(k, c) { const a = isl(k); let x0 = 999, x1 = 0, y0 = 999, y1 = 0; a.cells.forEach(i => { x0 = Math.min(x0, pos[i][0]); x1 = Math.max(x1, pos[i][0]); y0 = Math.min(y0, pos[i][1]); y1 = Math.max(y1, pos[i][1]); }); G.corners([x0 - 3, y0 - 3, x1 - x0 + 8, y1 - y0 + 8], c); }
function drawMap() {
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  const p = L().prep();
  pos.forEach((q, i) => R(q[0], q[1], 2, 2, col(p.lab[i])));
  /* two islands that have just been tied blink once, together */
  if (phase !== 'result' && ties.length && G.t - flash < 0.45 && Math.floor((G.t - flash) * 12) % 2 === 0) ties[ties.length - 1].forEach(k => isl(k).cells.forEach(i => R(pos[i][0], pos[i][1], 2, 2, C.white)));
  R(PX + 4, PY + 4, 4, 4, col(0)); T('MONDAY', PX + 11, PY + 2, C.fog); R(PX + 56, PY + 4, 4, 4, col(1)); T('THURSDAY', PX + 63, PY + 2, C.fog);
  /* the threads: white once tied, and for a moment after a tie a little brighter */
  ties.forEach((q, n) => {
    const a = cent[q[0]], b = cent[q[1]], hot = phase === 'result' ? Math.floor((G.t - flash) * 6) % 2 === 0 && G.t - flash < 1.2 : n === ties.length - 1 && G.t - flash < 0.5;
    G.line(a[0], a[1], b[0], b[1], hot ? C.amber : C.white); R(a[0] - 1, a[1] - 1, 3, 3, C.white); R(b[0] - 1, b[1] - 1, 3, 3, C.white);
  });
  if (snap && G.t - snap.t < 0.5) { const a = cent[snap.a], b = cent[snap.b]; if (Math.floor((G.t - snap.t) * 16) % 2 === 0) G.line(a[0], a[1], b[0], b[1], C.coral); }
  if (phase === 'result') return;
  if (held >= 0) {
    marksAt(held, C.amber);
    if (!onDone && cur !== held && Math.floor(G.t * 6) % 2) { const a = cent[held], b = cent[cur]; G.line(a[0], a[1], b[0], b[1], 'rgba(255,255,255,.6)'); }
  }
  if (phase === 'play' && !tip && !onDone) marksAt(cur, Math.floor(G.t * 4) % 2 ? C.white : C.fog);
}
/* one island's card: which run, how many cells, and the genes that set it apart inside its own run */
function card(k, x, y, title) {
  const a = isl(k);
  T(title, x, y, C.mist);
  R(x, y + 11, 4, 4, col(a.load)); T(L().NAMES[a.load], x + 7, y + 9, C.white);
  T(a.cells.length + ' CELLS', x, y + 19, C.fog);
  a.genes.slice(0, 4).forEach((g, i) => T(g.name, x, y + 33 + i * 10, C.amber, { f: 'smb' }));
}
function drawSide() {
  const x = SX, wd = SW;
  G.panel(x, 14, wd, 114, { border: C.slate, fill: '#0e1630' });
  if (phase === 'result') {
    /* every pair's shift, drawn from one point: how far and which way Thursday sits from Monday */
    T('THE FIVE SHIFTS', x + 6, 18, C.mist);
    const ox = x + 16, oy = 62, sc = 0.9;
    I.pairs.forEach((q, n) => {
      const dx = (cent[q.b][0] - cent[q.a][0]) * sc, dy = (cent[q.b][1] - cent[q.a][1]) * sc, ex = Math.round(ox + dx), ey = Math.round(oy + dy + (n - 2) * 5);
      G.line(ox, oy + (n - 2) * 5, ex, ey, C.white); R(ex - 1, ey - 1, 3, 3, C.amber);
    });
    R(ox - 2, oy - 12, 3, 25, col(0));
    T('MONDAY', x + 6, 82, col(0)); T('THURSDAY', x + wd - 6, 82, col(1), { a: 'right' });
    R(x + 5, 96, wd - 10, 1, C.slate);
    G.stars(x + 6, 106, res.stars); T(slips + (slips === 1 ? ' SLIP' : ' SLIPS'), x + wd - 6, 106, C.steel, { a: 'right' });
    return;
  }
  card(cur, x + 6, 18, 'THIS ONE');
  R(x + 63, 18, 1, 106, C.slate);
  if (held >= 0) card(held, x + 69, 18, 'THREAD');
  else { T('THREAD', x + 69, 18, C.steel); T('NOT TAKEN', x + 69, 27, C.steel); }
  /* a tied island says so */
  if (partnerOf(cur) >= 0) T('TIED', x + 6, 116, C.mint);
}
})();
