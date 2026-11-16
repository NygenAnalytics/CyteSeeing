/* Station 5-1, the Turntable. The cells of one lineage lie on the map as a band, uncoloured. A
   turntable stands below it, with a road to each end of the band and one to its middle. The
   player swings the bridge to a road and releases an engine: from where it arrives, a wave runs
   through the neighbour graph and numbers every cell by how far along it is. That number is
   pseudotime. Two rows of lamps show a gene of the stem cells and a gene of settled neurons along
   the order. From one end the stem-cell gene comes first. From the other the story runs
   backwards, and the cells fit that order just as well. The player sets the root from what is
   known about the cells.
   The ends of the band, the pseudotime and the lamps are worked out from the cells (see line.roads, line.order). */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 180, PH = 110, SX = 190, SW = 126, PIT = [PX + 90, PY + 92], PR = 12, RUN = 0.6, WAVE = 2;
/* the colour of a cell by how far the wave had to come: from the root outwards */
const RAMP = ['#3f6fa8', '#4fd6e8', '#7be0a1', '#f6ba4c', '#f0655f'], LAMP = ['#232d4b', '#6a5a2a', '#a8822e', '#e0a83c', '#ffd27a'];
const L = () => G.lineage;

let phase, load, beats, say, after, W, pos, ids, tips, byX, road, ang, anim, shown, front, ran, sent, onSet, slips, guessed, res, rsel;

const angleTo = k => Math.atan2(tips[k][1] - PIT[1], tips[k][0] - PIT[0]);
const bothEnds = () => ran[0] && ran[2];

function build() {
  const d = L().build(), xy = L().map(), rd = L().roads();
  ids = d.cells.map((c, i) => i).filter(i => d.cells[i].type < L().LINE);
  let x0 = 9, x1 = -9, y0 = 9, y1 = -9; ids.forEach(i => { x0 = Math.min(x0, xy[i][0]); x1 = Math.max(x1, xy[i][0]); y0 = Math.min(y0, xy[i][1]); y1 = Math.max(y1, xy[i][1]); });
  pos = []; ids.forEach(i => { pos[i] = [Math.round(PX + 12 + (xy[i][0] - x0) / (x1 - x0) * (PW - 26)), Math.round(PY + 9 + (xy[i][1] - y0) / (y1 - y0) * 56)]; });
  /* a road ends where its root cells sit */
  tips = rd.map(q => { let x = 0, y = 0; q.root.forEach(i => { x += pos[i][0] / q.root.length; y += pos[i][1] / q.root.length; }); return [Math.round(x), Math.round(y)]; });
  byX = [0, 1, 2].sort((a, b) => tips[a][0] - tips[b][0]);
  road = -1; ang = Math.PI / 2; anim = null; shown = -1; front = 0; ran = [false, false, false]; sent = 0; onSet = false;
}
function point(k) { if (anim || k === road) return; road = k; onSet = false; G.sfx('door'); }
function turn(d) {
  if (road < 0) { point(byX[d < 0 ? 0 : 2]); return; }
  const at = byX.indexOf(road) + d; if (at >= 0 && at < 3) point(byX[at]);
}
function release() {
  if (anim || road < 0) { G.sfx('bad'); return; }
  anim = { road, t: 0 }; shown = -1; front = 0; sent++; G.sfx('ok'); lights();
}
function arrived() { ran[anim.road] = true; shown = anim.road; front = 1.2; anim = null; G.sfx('drop'); lights(); }
function setRoot() {
  if (shown < 0) { G.sfx('bad'); return; }
  if (!bothEnds()) { G.sfx('bad'); tell('The band has two ends, and an engine has gone to one of them. Send one to the other end too, and compare the lamps.', false); return; }
  G.state.tries.turntable++; G.save();
  const o = L().order(shown);
  if (shown !== L().stem()) {
    slips++; guessed = true; G.sfx('bad'); lights();
    tell(o.back ? 'Here ' + W.early + ' is brightest at the far end. ' + W.Stem + ' are the stem cells, so this order tells the story backwards.'
      : 'From the middle the count runs both ways, and cells of the two halves share numbers. A root belongs at an end.', false);
    return;
  }
  res = { stars: slips === 0 ? 3 : slips === 1 ? 2 : 1 }; phase = 'result'; rsel = 1; onSet = false;
  ['t-dpt', 't-many', 't-toy'].forEach(id => G.book.unlock(id)); lights(); G.sfx('star');
}
function tell(text, next) { say = new G.Beats([{ say: text }]); after = next; phase = 'said'; }
function lights() {
  G.book.goal('ends', bothEnds() ? true : null);
  G.book.goal('root', guessed ? false : phase === 'result' ? true : null);
}
function keep() {
  const s = G.state;
  s.yard = Object.assign({}, s.yard, { root: W.stem, sent });
  s.rooms.turntable = { done: true, stars: Math.max(s.rooms.turntable.stars, res.stars) };
  G.save(); G.go('corridor', { from: 'turntable' });
}
function restart() { slips = 0; guessed = false; res = null; build(); phase = 'play'; lights(); }

function showBook() {
  const cell = W.label;
  G.book.show({
    floor: 'The Marshalling Yard · Station 5-1', room: 'The turntable', aim: 'The cells lie in a band. Find the end the line starts from, and set the root there.',
    file: 'js/stages/order/turntable.js',
    goals: [
      { id: 'ends', text: 'An engine has run from both ends of the band' },
      { id: 'root', text: 'The root is set where the stem-cell gene comes first' },
    ],
    notes: [
      { id: 't-snap', open: true, html: 'A tissue is taken apart once, and its cells are caught wherever each one had got to. Putting them in order along the process they were going through is <b>trajectory inference</b>, and a cell\'s place in the order is its <b>pseudotime</b>.' },
      { id: 't-root', open: true, html: 'Pseudotime is counted from a <b>root</b>, and most methods have to be told where it is: a cell, or a cluster. The authors of Slingshot recommend choosing it from prior knowledge: when a sample was collected, or established marker genes.' },
      { id: 't-dpt', html: '<b>Diffusion pseudotime</b> (DPT) measures how far a cell is from the root by random walks over the neighbour graph, which take every route into account and not only the shortest. Monocle 3 measures the distance along a graph that it fits through the cells, and Slingshot along a smooth curve through the clusters.' },
      { id: 't-many', html: 'Different methods give different orders on the same cells. Compare an order with what is known before building on it: here, that ' + W.stem + ' come first.' },
      { id: 't-toy', html: 'In this game pseudotime is the shortest way through the neighbour graph from the root cells, as a share of the longest such way. The two ends of the band are found from the graph alone: the cell furthest from any cell, and then the cell furthest from that one.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'Every tool is told where the line starts. Here that is the cluster named <b>' + cell + '</b>.',
      tabs: [
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> numpy <span class="k">as</span> np\n<span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          'sc.pp.<span class="k">neighbors</span>(adata, n_pcs=10)\nsc.tl.<span class="k">diffmap</span>(adata)\n\n' +
          '<span class="c"># the root: one cell of the cluster\n# that is known to come first</span>\n' +
          'adata.uns[<span class="s">"iroot"</span>] = np.<span class="k">flatnonzero</span>(\n    adata.obs[<span class="s">"cell_type"</span>]\n    == <span class="s">"' + cell + '"</span>)[0]\n\n' +
          'sc.tl.<span class="k">dpt</span>(adata)\n\n' +
          '<span class="c"># look: does the stem-cell gene come\n# first, and the late gene last?</span>\n' +
          'sc.pl.<span class="k">umap</span>(adata, color=[\n    <span class="s">"dpt_pseudotime"</span>,\n    <span class="s">"' + W.early + '"</span>, <span class="s">"' + W.late + '"</span>])</pre>' },
        { id: 'sl', label: 'R · Slingshot', html:
          '<pre class="code"><span class="k">library</span>(slingshot)\n' +
          '<span class="c"># a tree through the clusters, then a\n# smooth curve along each lineage</span>\n' +
          'sce &lt;- <span class="k">slingshot</span>(sce,\n    clusterLabels = <span class="s">"cell_type"</span>,\n    reducedDim = <span class="s">"PCA"</span>,\n    start.clus = <span class="s">"' + cell + '"</span>)\n\n' +
          '<span class="c"># one column of pseudotime per lineage</span>\n' +
          '<span class="k">head</span>(<span class="k">slingPseudotime</span>(sce))</pre>' },
        { id: 'mo', label: 'R · Monocle 3', html:
          '<pre class="code"><span class="k">library</span>(monocle3)\n' +
          'cds &lt;- <span class="k">cluster_cells</span>(cds)\n' +
          '<span class="c"># a graph fitted through the cells</span>\n' +
          'cds &lt;- <span class="k">learn_graph</span>(cds)\n\n' +
          '<span class="c"># the root: cells known to come first</span>\n' +
          'first &lt;- <span class="k">colnames</span>(cds)[\n    <span class="k">colData</span>(cds)$cell_type ==\n        <span class="s">"' + cell + '"</span>]\n' +
          'cds &lt;- <span class="k">order_cells</span>(cds,\n    root_cells = first)\n' +
          '<span class="k">head</span>(<span class="k">pseudotime</span>(cds))</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="c"># CyteArc is told where cells enter the\n# process and where they leave it</span>\n' +
          'run = ds.pipeline.<span class="k">open</span>(label=<span class="s">"rna"</span>)\n' +
          'graph = run[<span class="s">"connectivity_map"</span>]\n' +
          'labels = ds.<span class="k">snapshot_cluster_labels</span>(\n    <span class="s">"cell_type"</span>,\n    cell_selection=run[\n        <span class="s">"analysis_cell_selection"</span>])\n' +
          'pt = ds.trajectory.<span class="k">pseudotime</span>(\n    graph,\n    source_sink=labels,\n    sources=[<span class="s">"' + cell + '"</span>],\n    sinks=[<span class="s">"' + W.sink + '"</span>],\n)\n' +
          '<span class="c"># 0 at the source, 1 at the sinks</span>\n' +
          'ds.trajectory.<span class="k">load_pseudotime</span>(pt).values</pre>' },
      ],
    },
  });
}

G.scenes.turntable = {
  phase: () => phase,
  dbg: { road: () => road, shown: () => shown, ran: () => ran.slice(), sent: () => sent, onSet: () => onSet, slips: () => slips, busy: () => !!anim, stem: () => L().stem(),
    /* the roads from left to right, with where each one ends on the screen */
    roads: () => byX.map(k => ({ road: k, x: tips[k][0], y: tips[k][1], right: L().order(k).right, back: L().order(k).back })),
    spot: what => (what === 'release' ? [155, 152] : [262, 152]) },
  enter() {
    phase = 'load'; load = 0; slips = 0; guessed = false; res = null; rsel = 0; say = null; anim = null; shown = -1; road = -1; ran = [false, false, false];
    W = G.sys.order.turntable;
    beats = new G.Beats([
      { spot: [PX - 1, PY - 1, PW + 2, 72], say: 'Each dot is a cell of one lineage. They lie in a band, because cells were caught at every point of one process.' },
      { spot: [PIT[0] - 40, PIT[1] - 22, 80, 40], say: 'Swing the bridge to an end and release an engine. A wave numbers each cell by how far along it is: its pseudotime.' },
      { spot: [SX, 14, SW, 114], say: 'The lamps show two genes along that order: ' + W.early + ', ' + W.earlyIs + ', and ' + W.late + ', ' + W.lateIs + '.' },
    ]);
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'turntable' }); return; }
    if (phase === 'load') { if (++load < 3) return; build(); phase = G.state.tries.turntable > 0 ? 'play' : 'intro'; lights(); return; }
    /* the bridge swings to the road it is pointed at */
    const to = road < 0 ? Math.PI / 2 : angleTo(road); ang += (to - ang) * Math.min(1, dt * 7);
    if (anim) {
      anim.t += dt; if (G.skip() && phase === 'play') anim.t = RUN + WAVE;
      front = Math.max(0, (anim.t - RUN) / WAVE) * 1.1;
      if (anim.t >= RUN + WAVE) arrived();
    }
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'play'; return; }
    if (phase === 'said') { if (say.update(dt) === 'done') { say = null; phase = 'play'; } return; }
    if (phase === 'result') { const r = G.resultKeys(rsel, true); rsel = r.rsel; if (r.act === 'keep') keep(); else if (r.act === 'retry') restart(); return; }
    if (anim) return;
    if (G.hit('left')) turn(-1); if (G.hit('right')) turn(1);
    if (G.hit('down') && shown >= 0) { onSet = true; G.sfx('tick'); }
    if (G.hit('up') && onSet) { onSet = false; G.sfx('tick'); }
    /* a tap on the end of a road swings the bridge to it */
    if (G.ptr.pressed && G.over(PX, PY, PW, PH)) { let best = -1, bd = 22; tips.forEach((q, k) => { const v = Math.hypot(q[0] - G.ptr.x, q[1] - G.ptr.y); if (v < bd) { bd = v; best = k; } }); if (best >= 0) point(best); }
    if (G.act()) { if (onSet) setRoot(); else release(); }
  },
  draw() {
    R(0, 0, VW, VH, '#0f1118');
    if (phase === 'load') { G.roomHeader('5-1  THE TURNTABLE', C.cyan, true); T('SHUNTING THE CELLS INTO THE YARD...', VW / 2, 84, C.fog, { a: 'center' }); return; }
    drawYard(); drawLamps();
    G.roomHeader('5-1  THE TURNTABLE', C.cyan, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, 'The cells fit either order equally well. Nothing in them says where a line starts. What is known about ' + W.stem + ' does.', true, rsel, 'START AGAIN', 'KEEP THIS ROOT');
      if (act === 'keep') keep(); else if (act === 'retry') restart();
      G.stars(250, y0 + 7, res.stars); T(slips + (slips === 1 ? ' SLIP' : ' SLIPS'), 310, y0 + 18, C.steel, { a: 'right' });
      return;
    }
    G.strip(y0);
    const live = phase === 'play' && !anim;
    T('ENGINES SENT', 10, y0 + 5, C.fog); T(String(sent), 10, y0 + 14, C.white, { f: 'lg' });
    T(G.kt('ARROWS: SWING', 'TAP THE END'), 10, y0 + 31, C.steel); T(G.kt('DOWN: SET ROOT', 'OF A ROAD'), 10, y0 + 40, C.steel);
    if (G.button('release', 106, y0 + 8, 98, 28, 'RELEASE ENGINE', { primary: true, focus: live && !onSet, disabled: road < 0 }) && live) { onSet = false; release(); }
    if (G.button('set', 212, y0 + 8, 100, 28, 'SET THE ROOT', { focus: live && onSet, disabled: shown < 0, accent: C.amber }) && live) { onSet = true; setRoot(); }
    if (live && road < 0) G.cue(PIT[0], PIT[1] - PR - 4, true);
    else if (live && bothEnds() && !onSet) G.cue(262, y0 + 7, true);
    if (phase === 'intro') beats.draw();
    if (phase === 'said') say.draw();
  },
};

/* ---------- drawing ---------- */
const ramp = v => RAMP[Math.min(RAMP.length - 1, Math.floor(G.clamp(v, 0, 0.999) * RAMP.length))];
function drawYard() {
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  /* the three roads: sleepers, and a rail down the middle of each */
  tips.forEach((q, k) => {
    const a = angleTo(k), x0 = PIT[0] + Math.cos(a) * PR, y0 = PIT[1] + Math.sin(a) * PR, n = Math.round(Math.hypot(q[0] - x0, q[1] - y0) / 5), hot = k === road;
    for (let i = 0; i <= n; i++) R(Math.round(G.lerp(x0, q[0], i / n)) - 1, Math.round(G.lerp(y0, q[1], i / n)) - 1, 3, 3, '#3a2c1e');
    G.line(x0, y0, q[0], q[1], hot ? C.white : '#6b748c');
  });
  /* the cells: grey until a wave has reached them, then coloured by how far it came */
  const o = anim ? L().order(anim.road) : shown >= 0 ? L().order(shown) : null;
  ids.forEach(i => { const p = pos[i], v = o ? o.pt[i] : 2; R(p[0], p[1], 2, 2, o && v <= front ? ramp(v) : '#56628a'); });
  /* the end of each road: a post with a lamp, lit where the bridge points and ticked once an engine has been there */
  tips.forEach((q, k) => {
    const hot = k === road;
    R(q[0] - 3, q[1] - 3, 7, 7, hot ? C.white : C.ink); R(q[0] - 2, q[1] - 2, 5, 5, hot ? (Math.floor(G.t * 4) % 2 ? C.amber : '#b8862c') : ran[k] ? C.steel : '#2a3350');
    if (ran[k]) R(q[0] - 1, q[1] - 1, 3, 3, C.ink);
  });
  /* the pit, the bridge and the engine */
  G.disc(PIT[0], PIT[1], PR + 2, '#4a4d57'); G.disc(PIT[0], PIT[1], PR, '#14161b');
  const cx = Math.cos(ang), sy = Math.sin(ang);
  G.line(PIT[0] - cx * PR, PIT[1] - sy * PR, PIT[0] + cx * PR, PIT[1] + sy * PR, C.fog); G.line(PIT[0] - cx * PR + 1, PIT[1] - sy * PR, PIT[0] + cx * PR + 1, PIT[1] + sy * PR, '#6b748c');
  /* the way in, from the bottom of the yard */
  R(PIT[0] - 1, PIT[1] + PR + 2, 3, PY + PH - PIT[1] - PR - 2, '#3a2c1e'); R(PIT[0], PIT[1] + PR + 2, 1, PY + PH - PIT[1] - PR - 2, '#6b748c');
  let ex = PIT[0], ey = PIT[1];
  if (anim && anim.t < RUN) { const f = G.ease(anim.t / RUN), q = tips[anim.road]; ex = G.lerp(PIT[0], q[0], f); ey = G.lerp(PIT[1], q[1], f); }
  if (!anim || anim.t < RUN) { R(ex - 3, ey - 3, 7, 7, '#2f6e62'); R(ex - 2, ey - 2, 5, 5, '#3f9a88'); R(ex - 1, ey - 1, 2, 2, '#f6dc8c'); }
  T(G.fmt(ids.length) + ' CELLS', PX + PW - 4, PY + PH - 10, C.steel, { a: 'right' });
}
function drawLamps() {
  const x = SX, wd = SW, o = anim ? L().order(anim.road) : shown >= 0 ? L().order(shown) : null, B = L().BINS;
  G.panel(x, 14, wd, 114, { border: C.slate, fill: '#0e1630' });
  T('ALONG THE ORDER', x + 6, 17, C.mist);
  [[W.early, 30], [W.late, 62]].forEach((q, r) => {
    T(q[0], x + 6, q[1], C.white, { f: 'smb' });
    for (let b = 0; b < B; b++) {
      /* a lamp lights once the wave has passed its stretch of the order */
      const on = o && front >= (b + 1) / B, v = on ? o.lamps[r][b] : 0;
      R(x + 6 + b * 9, q[1] + 11, 8, 8, C.ink); R(x + 7 + b * 9, q[1] + 12, 6, 6, on ? LAMP[Math.min(4, Math.round(v * 4))] : '#161d35');
    }
  });
  /* what the colours of the cells mean: from the root outwards */
  T('ROOT', x + 6, 94, C.steel); T('FAR END', x + wd - 6, 94, C.steel, { a: 'right' });
  RAMP.forEach((c, i) => R(x + 36 + i * 8, 96, 7, 5, c));
  R(x + 5, 106, wd - 10, 1, C.slate);
  T(o ? (anim ? 'NUMBERING...' : 'ALL CELLS NUMBERED') : 'NO ENGINE SENT YET', x + 6, 112, o && !anim ? C.fog : C.steel);
}
})();
