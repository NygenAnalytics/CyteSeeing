/* Station 3-4, the Oracle. An automatic annotator gives every cell the label of the reference
   cell type it resembles most. The player first chooses the reference, from three cartridges:
   one from the wrong tissue, one with labels too broad to be of use, and one that fits but has
   a gap. Then the machine's labels are set beside the names on file, and the player settles the
   two that differ. Once the machine is right, because it read more genes than the file did.
   Once it is wrong and sure of itself, because it has never seen that kind of cell (in blood, a
   dendritic cell).
   The machine really runs (see atlas.opinion). */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const at = () => G.atlas;
const pc = v => G.atlas.pc(v);

/* The references, the names on file and the two clusters to settle are in the pack of the cell
   system (js/systems/<id>.who.js: refs, name.filed, oracle), and are read each time the station
   is entered. What stays here is the shelf: the cartridges from left to right, by the key of
   their reference. One is from the wrong tissue, one fits but has a gap, and one has labels too
   broad to be of use. */
const SHELF = ['far', 'fit', 'broad'], FIT = 'fit';
/* why a cartridge is the wrong one */
const WHY = {
  far: r => 'Wrong ' + r.wrong + '. The machine can only hand out the labels on its cartridge.',
  broad: r => 'Too broad to help. It cannot tell ' + r.blind + '.',
};
/* CARTS: the cartridges. FILED: the names on file if the name desk was not played, which is what the
   evidence supports, with one left broad. ALIAS: what a gene is better known as.
   CASES: the two names that differ, by what the cluster really is: who is right, the genes to look at
   (their numbers are shown on the screen) and the reason, which is what Ida says. */
let CARTS, FILED, CASES, ALIAS, TAKEN;
function read() {
  const w = G.sys.who, o = w.oracle;
  CARTS = SHELF.map(id => Object.assign({ id }, w.refs[id]));
  FILED = w.name.filed; ALIAS = o.alias; TAKEN = o.take.role;
  CASES = {};
  CASES[o.take.role] = { take: true, genes: o.take.genes, note: 'o-ref',
    right: 'Taken. The machine reads thousands of genes at once, and can be more exact than a file.',
    wrong: 'Its name is narrower than the one on file, and the markers back it.' };
  CASES[o.keep.role] = { take: false, genes: o.keep.genes, note: 'o-conf',
    right: 'Kept. Its reference has no ' + o.keep.missing + ', so it gave the nearest label it had, and sounded sure.',
    wrong: 'Read the cartridge again. What is not on it, the machine cannot say.' };
}

let phase, load, beats, say, after, f, rows, names, mine, op, ref, ci, shown, pt, diffs, di, settled, btn, mistakes, res, rsel, lastSync, slot, dusty;

const roleOf = c => f.of[c];
function printed() { op = at().opinion(ref); diffs = rows.filter(c => op[c].label !== mine[c]); }
/* the cartridge goes in. The first one of a visit needs the dust blown off it, as cartridges do. */
function insert() {
  ref = CARTS[ci].id; printed(); shown = 0; pt = 0; slot = 0; phase = 'slot'; G.sfx('door');
}
function afterPrint() {
  const cart = CARTS[ci], why = WHY[cart.id];
  if (why) { mistakes++; G.state.tries.oracle++; G.save(); G.sfx('bad'); tell(why(cart), 'cart'); return; }
  G.book.goal('ref', true); G.sfx('ok');
  tell('This one fits. Now settle each name that differs.', 'settle');
}
function tell(text, next) { say = new G.Beats([{ say: text }]); after = next; phase = 'said'; }
function advance() {
  say = null;
  if (after === 'cart') { phase = 'cart'; ref = null; return; }
  if (after === 'settle') { phase = 'settle'; di = 0; btn = 0; settled = {}; return; }
  if (after === 'again') { phase = 'settle'; return; }
  if (after === 'next') {
    if (di < diffs.length - 1) { di++; btn = 0; phase = 'settle'; return; }
    const stars = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
    res = { pass: true, stars }; phase = 'result'; rsel = 1; G.book.goal('check', true); G.book.unlock('o-llm'); G.sfx('star');
  }
}
function facts(c) { const out = {}; const k = CASES[roleOf(c)]; if (k) k.genes.forEach(g => { out[g] = at().stats(c)[g].in; }); return out; }
function settle(take) {
  const c = diffs[di], k = CASES[roleOf(c)];
  if (!k || take === k.take) {
    settled[c] = take ? 'machine' : 'mine'; if (take) names[c] = op[c].label;
    G.sfx('ok'); if (k) G.book.unlock(k.note);
    tell(k ? k.right : 'Settled.', 'next'); return;
  }
  mistakes++; G.state.tries.oracle++; G.save(); G.sfx('bad');
  tell(k.wrong, 'again');
}
function keep() {
  const s = G.state;
  s.bureau = Object.assign({}, s.bureau, { names: names.slice(), ref: FIT });
  s.rooms.oracle = { done: true, stars: Math.max(s.rooms.oracle.stars, res.stars) };
  G.save();
  G.go('corridor', { from: 'oracle' });
}
function restart() { phase = 'cart'; ref = null; ci = 0; mistakes = 0; res = null; names = mine.slice(); settled = {}; G.book.goal('ref', null); G.book.goal('check', null); }

function sync() {
  const key = phase + '|' + (ref || CARTS[ci].id);
  if (key === lastSync) return;
  lastSync = key; G.params.oref = at().REFS[ref || CARTS[ci].id].name.toLowerCase(); G.book.sync();
}
function showBook() {
  const r = '<span class="p" data-b="oref"></span>', w = G.sys.who.oracle;
  G.book.show({
    floor: 'The Bureau · Station 3-4', room: 'The Oracle', aim: 'Get a second opinion from an automatic annotator, then check it against the marker genes.',
    codeFirst: true, file: 'js/stages/who/oracle.js',
    goals: [
      { id: 'ref', text: 'Choose the reference that fits the sample' },
      { id: 'check', text: 'Settle every disagreement from the marker genes' },
    ],
    notes: [
      { id: 'o-what', open: true, html: 'Automatic annotation transfers labels from a <b>reference</b>: cells that somebody has already named. Some tools train a classifier on it (CellTypist), some compare each cell with reference profiles (SingleR), and some map your cells onto the reference and take the labels of their neighbours (Azimuth, scArches).' },
      { id: 'o-toy', open: true, html: 'The machine in this game is the simplest kind. Each cell takes the label of the reference profile it correlates with best, and a cluster takes the label most of its cells got. VOTES is the share of its cells that got that label.' },
      { id: 'o-ref', html: 'A reference should match your tissue, species and technology, and be labelled at the level of detail your question needs. A well-matched one can refine a broad label.' },
      { id: 'o-conf', html: 'A cell type that is missing from the reference gets the nearest label, often with a high score. So do doublets and damaged cells. Some tools can decline to answer: SingleR prunes weak calls, and CellTypist reports a confidence score for each cell.' },
      { id: 'o-llm', html: 'Some newer tools need no reference atlas. CyteType sends each cluster\'s marker genes and a description of your study to a team of AI agents, and returns a name, a Cell Ontology term, the evidence for it and an independent review.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'Four ways to get a second opinion. The <b>highlighted name</b> is the cartridge in the machine: in real code that is the model or the reference you pass in.',
      tabs: [
        { id: 'ct', label: 'Python · CellTypist', html:
          '<pre class="code"><span class="k">import</span> celltypist\n\n' +
          '<span class="c"># reference in the game: ' + r + '\n# expects log1p of counts scaled to 10,000 per cell</span>\n' +
          'pred = celltypist.<span class="k">annotate</span>(\n    adata,\n    model=<span class="s">"' + w.model + '"</span>,\n    majority_voting=True,\n)\nadata = pred.<span class="k">to_adata</span>()\n\n' +
          '<span class="c"># a label per cell, and how sure the model was</span>\n' +
          'adata.obs[[<span class="s">"majority_voting"</span>, <span class="s">"conf_score"</span>]]</pre>' },
        { id: 'sr', label: 'R · SingleR', html:
          '<pre class="code"><span class="k">library</span>(SingleR)\n' + w.singler.load + '\n' +
          '<span class="c"># reference in the game: ' + r + '</span>\n' +
          'ref &lt;- ' + w.singler.ref + '\n' +
          '<span class="c"># SingleR reads log-normalised counts</span>\nsce &lt;- scuttle::<span class="k">logNormCounts</span>(sce)\n' +
          'pred &lt;- <span class="k">SingleR</span>(test = sce, ref = ref,\n    labels = ' + w.singler.labels + ')\n\n' +
          '<span class="c"># NA means no label was good enough</span>\n' +
          '<span class="k">table</span>(pred$pruned.labels, useNA = <span class="s">"ifany"</span>)</pre>' },
        { id: 'se', label: 'R · Seurat', html:
          '<pre class="code"><span class="k">library</span>(Seurat)\n' +
          '<span class="c"># reference in the game: ' + r + '\n# map the query onto the reference, then copy labels</span>\n' +
          'anchors &lt;- <span class="k">FindTransferAnchors</span>(\n    reference = ref, query = obj, dims = 1:30)\n' +
          'pred &lt;- <span class="k">TransferData</span>(\n    anchorset = anchors,\n    refdata = ref$cell_type, dims = 1:30)\n\n' +
          '<span class="c"># adds predicted.id and prediction.score.max</span>\n' +
          'obj &lt;- <span class="k">AddMetaData</span>(obj, metadata = pred)</pre>' },
        { id: 'cy', label: 'Python · CyteType', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n<span class="k">from</span> cytetype <span class="k">import</span> CyteType\n\n' +
          '<span class="c"># once, in a shell: cytetype setup\n# no reference atlas: the marker genes of each\n# cluster and your study context are the input</span>\n' +
          'sc.tl.<span class="k">rank_genes_groups</span>(\n    adata, groupby=<span class="s">"leiden"</span>,\n    method=<span class="s">"wilcoxon"</span>,\n    key_added=<span class="s">"rank_genes_leiden"</span>)\n\n' +
          'annotator = <span class="k">CyteType</span>(\n    adata, group_key=<span class="s">"leiden"</span>,\n    rank_key=<span class="s">"rank_genes_leiden"</span>)\n' +
          'adata = annotator.<span class="k">run</span>(\n    study_context=<span class="s">"' + w.context[0] + '"</span>\n    <span class="s">"' + w.context[1] + '"</span>)</pre>' },
      ],
    },
  });
}

G.scenes.oracle = {
  phase: () => phase,
  dbg: { state: () => ({ ci, ref, diffs: diffs ? diffs.slice() : [], di, mistakes, labels: op ? op.map(o => o.label + ' ' + Math.round(o.share * 100)) : [], mine: mine ? mine.slice() : [] }) },
  enter() {
    read();
    /* the notebook names the cartridge in the player's hand from the start */
    G.params.oref = CARTS[0].name.toLowerCase();
    phase = 'load'; load = 0; ci = 0; slot = 0; dusty = true; ref = null; op = null; diffs = null; di = 0; settled = {}; btn = 0; mistakes = 0; res = null; rsel = 1; say = null; lastSync = null; f = null; shown = 0;
    beats = new G.Beats([
      { say: 'A second opinion. The machine gives each cell the label of the reference cell type it most resembles.' },
      { spot: [5, 15, VW - 10, 113], say: 'It needs a reference. Insert the cartridge that fits your sample.' },
    ]);
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'oracle' }); return; }
    if (phase === 'load') {
      if (++load < 3) return;
      f = at().final();
      const filed = G.state.bureau && G.state.bureau.names;
      mine = f.of.map((r, c) => (filed && filed[c]) || FILED[r]);
      /* a name already taken from the machine on an earlier visit goes back to what was on file */
      mine[f.role[TAKEN]] = FILED[TAKEN]; names = mine.slice();
      /* the doublets left the board at the line-up, so they are not sent to the machine */
      rows = f.mem.map((m, c) => c).filter(c => c !== f.dbl);
      phase = G.state.tries.oracle > 0 || G.state.rooms.oracle.done ? 'cart' : 'intro'; sync();
      return;
    }
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'cart'; }
    else if (phase === 'cart') {
      if (G.hit('right')) { ci = (ci + 1) % 3; G.sfx('tick'); }
      if (G.hit('left')) { ci = (ci + 2) % 3; G.sfx('tick'); }
      if (G.ptr.pressed) for (let k = 0; k < 3; k++) if (G.over(8 + k * 102, 16, 98, 38) && ci !== k) { ci = k; G.sfx('tick'); }
      if (G.act()) insert();
    } else if (phase === 'slot') {
      const was = slot; slot += dt;
      if (dusty && was < 0.75 && slot >= 0.75) G.sfx('pop');
      if (slot >= (dusty ? 1.9 : 0.6)) { dusty = false; phase = 'print'; }
    } else if (phase === 'print') {
      pt += dt; const n = Math.min(rows.length, Math.floor(pt / (G.reduced ? 0.01 : 0.22)));
      if (n > shown) { shown = n; G.sfx('tick'); }
      if (shown >= rows.length && pt > rows.length * 0.22 + 0.5) afterPrint();
    } else if (phase === 'said') { if (say.update(dt) === 'done') advance(); }
    else if (phase === 'settle') {
      if (G.hit('left') || G.hit('right')) { btn = 1 - btn; G.sfx('tick'); }
      if (G.act()) settle(btn === 1);
    } else if (phase === 'result') {
      const r = G.resultKeys(rsel, true); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') restart();
    }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#150f0d');
    if (phase === 'load') { G.roomHeader('3-4  THE ORACLE', C.mint, true); T('WARMING UP THE VALVES...', VW / 2, 84, C.fog, { a: 'center' }); return; }
    const carts = phase === 'intro' || phase === 'cart' || phase === 'slot';
    if (carts) drawCarts(); else drawTable();
    G.roomHeader('3-4  THE ORACLE', C.mint, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, 'An automatic label is where annotation starts. The markers decide where it ends.', true, rsel, 'START AGAIN', 'KEEP THESE NAMES');
      if (act === 'keep') keep(); else if (act === 'retry') restart();
      return;
    }
    G.strip(y0);
    if (carts) {
      T(G.kt('LEFT, RIGHT: OTHER CARTRIDGE', 'TAP A CARTRIDGE TO READ IT'), 12, y0 + 20, C.steel);
      if (G.button('insert', 218, y0 + 8, 94, 28, 'INSERT', { primary: true, focus: phase === 'cart' }) && phase === 'cart') insert();
    } else if (phase === 'settle' || (phase === 'said' && (after === 'again' || after === 'next'))) {
      const c = diffs[di], g = facts(c), live = phase === 'settle';
      T('CLUSTER ' + (c + 1), 12, y0 + 5, at().COLS[c], { f: 'smb' });
      Object.keys(g).forEach((n, i) => { T(ALIAS[n] || n, 12, y0 + 16 + i * 9, C.fog); T(pc(g[n]), 104, y0 + 16 + i * 9, C.white, { a: 'right' }); });
      if (G.button('mine', 116, y0 + 8, 84, 28, 'KEEP MY FILE', { primary: true, focus: btn === 0 && live }) && live) { btn = 0; settle(false); }
      if (G.button('theirs', 206, y0 + 8, 108, 28, "TAKE THE MACHINE'S", { primary: true, focus: btn === 1 && live }) && live) { btn = 1; settle(true); }
    } else {
      T('REFERENCE', 12, y0 + 7, C.white); T(at().REFS[ref].name, 12, y0 + 18, C.mint, { f: 'smb' });
      if (phase === 'print' && Math.floor(G.t * 4) % 2) T('PRINTING...', 12, y0 + 34, C.amber);
    }
    if (phase === 'intro') beats.draw();
    if (phase === 'said') say.draw();
  },
};

/* three cartridges, and the sticker of the one in your hand, large enough to read */
function drawCarts() {
  const going = phase === 'slot', up = going && dusty && slot > 0.45 && slot < 1.3;
  CARTS.forEach((k, i) => {
    const x = 8 + i * 102, on = i === ci;
    /* the chosen cartridge bobs, then drops into the slot. A dusty one comes back up once. */
    const y = 17 + (on && phase === 'cart' ? Math.round(Math.sin(G.t * 5)) : on && going ? (up ? -5 : Math.min(8, Math.round(slot * 40))) : 0);
    /* the plastic, with its grip lines and the contacts at the bottom */
    R(x, y, 98, 36, on ? C.amber : '#3a332c'); R(x + 1, y + 1, 96, 34, '#55504a'); R(x + 1, y + 1, 96, 3, '#6f6a62');
    for (let g = 0; g < 2; g++) R(x + 6, y + 6 + g * 3, 86, 1, '#3f3b36');
    R(x + 5, y + 12, 88, 15, C.paper); R(x + 5, y + 12, 88, 3, on ? C.mint : '#9fb0a0');
    T(k.short, x + 49, y + 16, C.ink, { a: 'center', f: 'smb' });
    R(x + 30, y + 31, 38, 5, '#150f0d'); for (let q = 0; q < 8; q++) R(x + 33 + q * 4, y + 32, 2, 4, C.oil);
    if (on && !going) R(x + 48, y + 36, 2, 58 - y - 36, C.amber);
    /* dust, blown off the contacts */
    if (on && up && slot > 0.75) for (let d = 0; d < 9; d++) { const u = (slot - 0.75) * 2 + d * 0.07; R(x + 30 + d * 4 + Math.round(Math.sin(d * 3 + u * 9) * 3), y + 38 + Math.round(u * 9), 2, 2, 'rgba(239,233,214,' + Math.max(0, 0.8 - u * 0.9).toFixed(2) + ')'); }
  });
  const k = CARTS[ci], refd = at().REFS[k.id];
  if (going) {
    /* the machine's screen */
    G.panel(8, 58, 304, 69, { border: C.mint, fill: '#0a1418' });
    const bad = dusty && slot > 0.25 && slot < 1.3, dots = '.'.repeat(1 + Math.floor(slot * 6) % 3);
    T(bad ? 'NO SIGNAL' : 'READING ' + refd.name + dots, 160, 84, bad ? (Math.floor(slot * 8) % 2 ? C.coral : '#5a1f2a') : C.mint, { a: 'center', f: 'smb' });
    if (bad && slot > 0.75) T('(YOU BLOW ON IT)', 160, 98, C.steel, { a: 'center' });
    return;
  }
  G.panel(8, 58, 304, 69, { border: C.amber, fill: C.paper });
  T(refd.name, 15, 61, C.ink, { f: 'smb' });
  k.made.forEach((l, n) => T(l, 15, 72 + n * 8, '#4a4038'));
  R(14, 90, 292, 1, '#b8b09a');
  T('KNOWS ' + refd.labels.length + ' CELL TYPES', 15, 92, '#7a5c36');
  refd.labels.forEach((l, n) => T(l, 15 + (n % 2) * 148, 101 + Math.floor(n / 2) * 8, C.ink));
}

/* the printout: the names on file beside the machine's, cluster by cluster */
function drawTable() {
  const x = 5, w = VW - 10;
  G.panel(x, 14, w, 114, { border: C.slate, fill: '#0e1630' });
  T('ON FILE', x + 34, 17, C.mist); T('THE MACHINE SAYS', x + 164, 17, C.mist); T('VOTES', x + w - 5, 17, C.mist, { a: 'right' });
  R(x + 4, 27, w - 8, 1, C.slate);
  rows.forEach((c, r) => {
    const y = 31 + r * 12, o = op[c], same = o.label === mine[c], cur = (phase === 'settle' || (phase === 'said' && (after === 'again' || after === 'next'))) && diffs[di] === c;
    if (cur && phase !== 'result') R(x + 2, y - 1, w - 4, 11, C.deep);
    R(x + 6, y + 1, 6, 6, at().COLS[c]); T(String(c + 1), x + 26, y, at().COLS[c], { a: 'right', f: 'smb' });
    const st = settled[c];
    T(mine[c], x + 34, y, st === 'machine' ? C.steel : C.white);
    if (st === 'machine') R(x + 34, y + 4, Math.ceil(G.tw(mine[c], 'sm')), 1, C.steel);
    if (r >= shown && phase === 'print') return;
    T(o.label, x + 164, y, st === 'mine' ? C.steel : same ? C.fog : C.amber);
    if (st === 'mine') R(x + 164, y + 4, Math.ceil(G.tw(o.label, 'sm')), 1, C.steel);
    T(pc(o.share), x + w - 5, y, st === 'mine' ? C.steel : C.fog, { a: 'right' });
    /* a tick where the two agree, a question mark where they do not */
    if (same || st) { R(x + 152, y + 4, 2, 2, C.mint); R(x + 154, y + 5, 1, 2, C.mint); R(x + 155, y + 2, 2, 4, C.mint); }
    else if (Math.floor(G.t * 3) % 2 || !cur) T('?', x + 152, y, C.amber, { f: 'smb' });
  });
  if (phase === 'result') { G.stars(x + 6, 118, res.stars); T(mistakes + (mistakes === 1 ? ' WRONG TURN' : ' WRONG TURNS'), x + w - 5, 118, C.steel, { a: 'right' }); }
}
})();
