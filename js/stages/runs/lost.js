/* Station 4-3, Lost and found. A third run arrives a month later and is mapped onto the washed
   map: each new cell lands among its nearest reference cells and takes their label. Every new
   cell gets a label, including seven cells of a kind the reference has never held (in blood,
   plasma cells). They are given the label of a relative (B cell), by neighbours that all agree.
   The lamp checks a label the way an analyst does: does the cell carry the marker gene of the
   label it was given? One dark cell is dropout. A group of dark cells is a cell type the
   reference lacks, and that is what the player has to find and flag.
   The mapping is worked out from the cells (see loads.mapTo). */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 180, PH = 110, SX = 190, SW = 126, LR = 13, SPEED = 66, NEED = 4, DROP = 1.3;
const L = () => G.loads;

let phase, beats, tip, theta, pos, Q, tags, lamp, slips, res, rsel, load, t0, pile, genes, lastTick, false1;
/* the cells only the new run holds, from the pack: the word for them, the slot whose label the reference gives them, and what is said once they are flagged */
let word, called, found;

const dim = hex => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',.3)'; };
const under = q => Math.hypot(q.x + 1 - lamp.x, q.y + 1 - lamp.y) <= LR;
const checked = () => Q.filter(q => q.seen).length;

function lights() {
  G.book.goal('find', phase === 'result' ? true : null);
  G.book.goal('calm', false1 ? false : phase === 'result' ? true : null);
}
function showBook() {
  /* the code checks the label those cells were given against its marker gene */
  const pack = G.sys.runs, mark = pack.types[called].mark;
  /* where the name tags are short forms that need saying in full, a first note says them */
  const names = pack.spell ? [{ id: 'l-names', open: true, html: 'The name tags on the map are short: ' +
    pack.types.filter(t => t.short).map(t => t.short + ' for ' + t.name.toLowerCase()).join(', ') + '.' }] : [];
  G.book.show({
    floor: 'The Laundry · Station 4-3', room: 'Lost and found', aim: 'Map a new run onto the finished map, and find what the labels got wrong.',
    file: 'js/stages/runs/lost.js',
    goals: [
      { id: 'find', text: 'Find the new cells that do not fit their label' },
      { id: 'calm', text: 'Do not flag a cell for one gene that was missed' },
    ],
    notes: names.concat([
      { id: 'l-what', open: true, html: '<b>Reference mapping</b> places new cells into an analysis that is already finished, without doing it again. Each new cell takes the label most of its nearest reference cells carry: <b>label transfer</b>.' },
      { id: 'l-fix', open: true, html: 'The reference does not move. That is the point of it: everyone who maps onto the same reference gets labels that can be compared.' },
      { id: 'l-vote', html: 'A unanimous vote says that the neighbours agree with each other. It does not say that the new cell is one of them. Vote shares and prediction scores are not calibrated probabilities.' },
      { id: 'l-dist', html: 'Distance to the nearest reference cell flags new cells that differ in the genes the reference was built on. These ' + word + ' differ in genes the reference never selected, so their distance looks ordinary. Marker genes of the new cells are the check that works.' },
      { id: 'l-new', html: 'When a group of new cells does not fit, analyse the new run on its own as well: cluster it, find its markers, and name the group from those. A reference can only hand out the labels it has.' },
      { id: 'l-toy', html: 'The game maps in the manner of Symphony: the new cells go through the reference\'s gene scaling and components, have their own run\'s offset removed cluster by cluster, and vote with their 5 nearest reference cells.' },
    ]),
    term: {
      title: 'Same step, in code',
      intro: 'The reference stays as it is. Only the new cells are placed, and then a label is checked against its <b>marker gene</b>.',
      tabs: [
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          '<span class="c"># both objects must hold the same genes.\n# The reference keeps its PCA, graph and\n# map; the new cells are projected in.</span>\n' +
          'sc.tl.<span class="k">ingest</span>(\n    adata_new,\n    adata_ref,\n    obs=<span class="s">"cell_type"</span>,\n)\n\n' +
          '<span class="c"># check a label against its marker</span>\n' +
          'sc.pl.<span class="k">umap</span>(\n    adata_new,\n    color=[<span class="s">"cell_type"</span>, <span class="s">"' + mark + '"</span>],\n)</pre>' },
        { id: 'se', label: 'R · Seurat', html:
          '<pre class="code"><span class="k">library</span>(Seurat)\n' +
          'anchors &lt;- <span class="k">FindTransferAnchors</span>(\n    reference = ref,\n    query = new,\n    dims = 1:30,\n    reference.reduction = <span class="s">"pca"</span>)\n\n' +
          '<span class="c"># ref: RunUMAP(..., return.model = TRUE)</span>\n' +
          'new &lt;- <span class="k">MapQuery</span>(\n    anchorset = anchors,\n    query = new,\n    reference = ref,\n    refdata = list(\n        cell_type = <span class="s">"cell_type"</span>),\n    reference.reduction = <span class="s">"pca"</span>,\n    reduction.model = <span class="s">"umap"</span>)\n\n' +
          '<span class="c"># labels: new$predicted.cell_type\n# check one against its marker</span>\n' +
          '<span class="k">FeaturePlot</span>(new, <span class="s">"' + mark + '"</span>,\n    reduction = <span class="s">"ref.umap"</span>)</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="c"># freeze the reference analysis</span>\n' +
          'ref_id = ref_ds.mapping.<span class="k">build_reference</span>(\n    neighbors_ref)\n' +
          'reference = ref_ds.mapping.<span class="k">load_reference</span>(\n    ref_id)\n\n' +
          '<span class="c"># place the new cells in it</span>\n' +
          'cells = new_ds.<span class="k">snapshot_cell_selection</span>(\n    <span class="s">"I"</span>)\n' +
          'result = new_ds.mapping.<span class="k">run</span>(\n    reference, cells)\n\n' +
          '<span class="c"># a label needs half of the vote</span>\n' +
          'labels = new_ds.mapping.<span class="k">transfer_labels</span>(\n    result,\n    reference=reference,\n    reference_labels=<span class="s">"cell_type"</span>,\n    threshold_fraction=0.5,\n)</pre>' },
        { id: 'sy', label: 'R · Symphony', html:
          '<pre class="code"><span class="k">library</span>(symphony)\n' +
          '<span class="c"># a Harmony reference new cells can join</span>\n' +
          'ref &lt;- <span class="k">buildReference</span>(\n    exp_ref, meta_ref,\n    vars = c(<span class="s">"batch"</span>),\n    K = 100,\n    theta = 2,\n    d = 20)\n\n' +
          'new &lt;- <span class="k">mapQuery</span>(exp_new, meta_new, ref)\n' +
          'new &lt;- <span class="k">knnPredict</span>(new, ref,\n    ref$meta_data$cell_type, k = 5)</pre>' },
      ],
    },
  });
}

function build() {
  theta = L().theta();
  const m = L().mapTo(theta), x0 = PX + 10, y0 = PY + 14, w = PW - 22, h = PH - 24;
  pos = L().place(theta, x0, y0, w, h);
  /* cells that land on the same spot are nudged apart, so that each can be seen */
  Q = m.cells.map((c, n) => ({ x: Math.round(x0 + c.xy[0] * w) + (n * 37) % 5 - 2, y: Math.round(y0 + c.xy[1] * h) + (n * 53) % 5 - 2, label: c.label, lit: c.lit, share: c.share, i: c.i, seen: false, at: (n * 29 % m.cells.length) / m.cells.length }));
  /* a name tag for every kind of cell the reference holds, set above its island */
  const p = L().prep(); tags = [];
  L().TYPES.forEach((ty, t) => { let x = 0, top = 999, n = 0; for (let i = 0; i < p.nr; i++) if (L().cells[i].type === t) { x += pos[i][0]; top = Math.min(top, pos[i][1]); n++; } if (n) tags.push([Math.round(x / n), top - 9, t]); });
  lamp = { x: PX + 24, y: PY + PH - 20 };
}
function flag() {
  const dark = Q.filter(q => under(q) && !q.lit);
  G.state.tries.lost++; G.save();
  if (dark.length >= NEED) {
    /* the whole group: every dark cell close to the ones under the lamp */
    const cx = dark.reduce((s, q) => s + q.x, 0) / dark.length, cy = dark.reduce((s, q) => s + q.y, 0) / dark.length, lab = dark[0].label;
    pile = Q.filter(q => !q.lit && q.label === lab && Math.hypot(q.x - cx, q.y - cy) < LR * 1.6); pile.forEach(q => { q.seen = true; });
    genes = L().differ(pile.map(q => q.i), lab).slice(0, 4);
    res = { stars: slips === 0 ? 3 : slips === 1 ? 2 : 1, label: lab }; phase = 'result'; rsel = 1;
    ['l-vote', 'l-dist', 'l-new', 'l-toy'].forEach(n => G.book.unlock(n)); lights(); G.sfx('star');
    return;
  }
  slips++; G.sfx('bad');
  if (dark.length) false1 = true;
  tip = new G.Beats([{ say: dark.length ? 'One cell without its marker is a gene that was not caught. Look for many of them in one place.'
    : 'Every new cell under the lamp carries its marker. Flag the place where a group of them does not.' }]);
  lights();
}
function keep() {
  const s = G.state;
  s.rooms.lost = { done: true, stars: Math.max(s.rooms.lost.stars, res.stars) };
  G.save(); G.go('corridor', { from: 'lost' });
}
function restart() { Q.forEach(q => { q.seen = false; }); slips = 0; false1 = false; res = null; pile = null; phase = 'sweep'; lamp = { x: PX + 24, y: PY + PH - 20 }; lights(); }

G.scenes.lost = {
  phase: () => phase,
  dbg: { lamp: () => [lamp.x, lamp.y], to: (x, y) => { lamp.x = x; lamp.y = y; }, slips: () => slips, checked: () => checked(),
    cells: () => Q.map(q => ({ x: q.x, y: q.y, lit: q.lit, label: q.label, seen: q.seen })), theta: () => theta },
  enter() {
    phase = 'load'; load = 0; slips = 0; res = null; rsel = 0; tip = null; pile = null; lastTick = 0; false1 = false;
    word = G.sys.runs.unseen.word; called = G.sys.runs.unseen.called; found = G.sys.runs.unseen.found;
    beats = new G.Beats([
      { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'A new run, a month later. Each new cell was placed among its nearest cells on the washed map, and took their label.' },
      { spot: [SX, 14, SW, 114], say: 'The lamp checks a label. Under it, a new cell lights up if it carries the marker gene of the label it was given.' },
      { say: 'Sweep the lamp over the new cells. Where a whole group stays dark, plant a flag.' },
    ]);
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'lost' }); return; }
    if (phase === 'load') {
      if (++load < 3) return;
      build(); t0 = G.t; phase = 'drop'; lights();
      return;
    }
    if (phase === 'drop') { if (G.t - t0 > DROP + 0.3 || G.skip()) phase = G.state.tries.lost > 0 ? 'sweep' : 'intro'; return; }
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'sweep'; return; }
    if (phase === 'sweep') {
      if (tip) { if (tip.update(dt) === 'done') tip = null; return; }
      const d = G.down, vx = (d.right ? 1 : 0) - (d.left ? 1 : 0), vy = (d.down ? 1 : 0) - (d.up ? 1 : 0);
      lamp.x += vx * SPEED * dt; lamp.y += vy * SPEED * dt;
      if (G.ptr.down && G.over(PX, PY, PW, PH)) { lamp.x = G.ptr.x; lamp.y = G.ptr.y; }
      lamp.x = G.clamp(lamp.x, PX + 4, PX + PW - 4); lamp.y = G.clamp(lamp.y, PY + 4, PY + PH - 4);
      /* a cell that shows its marker ticks; one that does not makes a duller sound */
      let fresh = 0, dull = 0; Q.forEach(q => { if (!q.seen && under(q)) { q.seen = true; fresh++; if (!q.lit) dull++; } });
      if (fresh && G.t - lastTick > 0.07) { lastTick = G.t; G.sfx(dull ? 'pop' : 'tick'); }
      if (G.act()) flag();
      return;
    }
    const r = G.resultKeys(rsel, true); rsel = r.rsel;
    if (r.act === 'keep') keep(); else if (r.act === 'retry') restart();
  },
  draw() {
    R(0, 0, VW, VH, '#16101c');
    if (phase === 'load') { G.roomHeader('4-3  LOST AND FOUND', C.pink, true); T('OPENING THE NEW BAG...', VW / 2, 84, C.fog, { a: 'center' }); return; }
    drawMap(); drawSide();
    G.roomHeader('4-3  LOST AND FOUND', C.pink, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, found, true, rsel, 'START AGAIN', 'KEEP THE FLAG');
      if (act === 'keep') keep(); else if (act === 'retry') restart();
      return;
    }
    G.strip(y0);
    const n = checked();
    T('CHECKED', 12, y0 + 5, C.fog); T(n + ' OF ' + Q.length, 12, y0 + 14, C.white, { f: 'lg' });
    T(G.kt('ARROWS: MOVE THE LAMP', 'DRAG THE LAMP ON THE MAP,'), 12, y0 + 30, C.steel); T(G.kt('SPACE: PLANT A FLAG', 'THEN TAP THE BUTTON'), 12, y0 + 39, C.steel);
    const live = phase === 'sweep' && !tip;
    if (G.button('flag', 214, y0 + 8, 98, 28, 'PLANT A FLAG', { primary: true }) && live) flag();
    if (live && Q.filter(q => under(q) && !q.lit).length >= NEED) G.cue(263, y0 + 7, true);
    if (phase === 'intro') beats.draw();
    if (tip) tip.draw();
  },
};

function cell(q, y) {
  const c = L().KIND[q.label];
  if (!q.seen) { R(q.x - 1, y - 1, 5, 5, C.ink); R(q.x, y, 3, 3, c); return; }
  if (q.lit) { R(q.x - 1, y - 1, 5, 5, c); R(q.x, y, 3, 3, C.white); }
  else { R(q.x - 1, y - 1, 5, 5, C.coral); R(q.x, y, 3, 3, C.ink); }
}
function drawMap() {
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  /* the reference: every washed cell, faint, in the colour of its cell type */
  const kinds = L().KIND.map(dim);
  pos.forEach((q, i) => R(q[0], q[1], 2, 2, kinds[L().cells[i].type]));
  tags.forEach(q => { const name = L().TYPES[q[2]].short, w = Math.ceil(G.tw(name, 'sm')) + 4, x = G.clamp(q[0] - w / 2, PX + 1, PX + PW - w - 1), y = Math.max(PY + 1, q[1]); R(x, y, w, 9, 'rgba(10,15,30,.8)'); T(name, x + 2, y, L().KIND[q[2]]); });
  /* the new cells drop in from the top of the map, a few at a time */
  const u = phase === 'drop' ? (G.t - t0) / DROP : 2;
  Q.forEach(q => { const k = G.clamp((u - q.at * 0.7) / 0.3, 0, 1); if (k > 0) cell(q, Math.round(G.lerp(PY + 2, q.y, k * k))); });
  if (phase === 'result') {
    let x0 = 999, x1 = 0, y0 = 999, y1 = 0; pile.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
    G.corners([x0 - 5, y0 - 5, x1 - x0 + 12, y1 - y0 + 12], Math.floor(G.t * 4) % 2 ? C.white : C.amber);
    /* the flag */
    R(x1 + 6, y0 - 12, 1, 12, C.paper); R(x1 + 7, y0 - 12, 7, 5, C.coral);
    return;
  }
  if (phase !== 'sweep' && phase !== 'intro') return;
  G.ring(Math.round(lamp.x), Math.round(lamp.y), LR, '#b07cff'); G.ring(Math.round(lamp.x), Math.round(lamp.y), LR - 1, 'rgba(176,124,255,.35)');
  R(Math.round(lamp.x), Math.round(lamp.y) - 1, 1, 3, 'rgba(176,124,255,.5)'); R(Math.round(lamp.x) - 1, Math.round(lamp.y), 3, 1, 'rgba(176,124,255,.5)');
}
function drawSide() {
  const x = SX, wd = SW;
  G.panel(x, 14, wd, 114, { border: C.slate, fill: '#0e1630' });
  if (phase === 'result') {
    T('LABELLED', x + 6, 18, C.mist); T(L().TYPES[res.label].label, x + wd - 6, 18, L().KIND[res.label], { a: 'right' });
    T('CELLS', x + 6, 28, C.fog); T(String(pile.length), x + wd - 6, 28, C.white, { a: 'right' });
    const all = pile.every(q => q.share > 0.99);
    T('NEIGHBOURS AGREED', x + 6, 38, C.fog); T(all ? 'ALL' : 'MOST', x + wd - 6, 38, C.white, { a: 'right' });
    R(x + 5, 50, wd - 10, 1, C.slate);
    T('THEY CARRY INSTEAD', x + 6, 54, C.mist);
    genes.forEach((g, i) => T(g.name, x + 6 + (i % 2) * 58, 65 + Math.floor(i / 2) * 10, C.amber, { f: 'smb' }));
    R(x + 5, 96, wd - 10, 1, C.slate);
    G.stars(x + 6, 106, res.stars); T(slips + (slips === 1 ? ' SLIP' : ' SLIPS'), x + wd - 6, 106, C.steel, { a: 'right' });
    return;
  }
  T('UNDER THE LAMP', x + 6, 18, C.mist);
  /* the label most of the new cells under the lamp were given, and how many of them show its marker */
  const here = phase === 'sweep' ? Q.filter(under) : [], cnt = {}; here.forEach(q => { cnt[q.label] = (cnt[q.label] || 0) + 1; });
  const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
  if (top === undefined) { T('NO NEW CELLS', x + 6, 32, C.steel); }
  else {
    const mine = here.filter(q => q.label === +top), lit = mine.filter(q => q.lit).length;
    T('LABEL', x + 6, 30, C.fog); T(L().TYPES[top].label, x + wd - 6, 30, L().KIND[top], { a: 'right' });
    T('MARKER', x + 6, 41, C.fog); T(L().TYPES[top].mark, x + wd - 6, 41, C.amber, { a: 'right', f: 'smb' });
    T('SEEN IN', x + 6, 52, C.fog); T(lit + ' OF ' + mine.length, x + wd - 6, 52, lit === mine.length ? C.mint : C.coral, { a: 'right', f: 'smb' });
  }
  R(x + 5, 68, wd - 10, 1, C.slate);
  /* the key shows a new cell in the colour of the label the unseen ones are given */
  const k = L().KIND[called];
  R(x + 7, 76, 5, 5, C.ink); R(x + 8, 77, 3, 3, k); T('NEW CELL', x + 18, 74, C.fog);
  R(x + 7, 88, 5, 5, k); R(x + 8, 89, 3, 3, C.white); T('MARKER SEEN', x + 18, 86, C.fog);
  R(x + 7, 100, 5, 5, C.coral); R(x + 8, 101, 3, 3, C.ink); T('MARKER NOT SEEN', x + 18, 98, C.fog);
  T(slips + (slips === 1 ? ' SLIP' : ' SLIPS'), x + wd - 6, 114, C.steel, { a: 'right' });
}
})();
