/* Station 5-2, the Track. The map shows six islands: the four states of the line, and beside them
   two more. The player lays a piece of track between two islands and sends a test wagon over it.
   The wagon crosses where enough cells of one island have neighbours in the other: the links of
   the neighbour graph that run between the two, counted against the number that links drawn at
   random would give (as PAGA does). Where the links are missing it stops at a gap. The goal is
   the line the cells support and nothing more. One island sits close to the line on the map and
   is joined to nothing: its cells came from elsewhere.
   The links, the chance count and the places of the islands are worked out from the cells (see line.links, line.islands). */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 180, PH = 110, SX = 190, SW = 126, ROLL = 1.1, FREE = 2;
const COLS = [C.cyan, C.lilac, C.amber, C.mint, C.pink, C.coral];
const L = () => G.lineage;

let phase, load, beats, tip, W, ST, isl, at, rad, cur, held, laid, anim, last, stops, sent, slips, early, onDone, said, res, rsel;

const piece = (a, b) => laid.find(q => (q.a === a && q.b === b) || (q.a === b && q.b === a));
const tested = k => laid.some(q => q.a === k || q.b === k);
const need = () => L().pieces();
const missing = () => need().filter(q => !piece(q[0], q[1]));
const wasted = () => stops + early;

function build() {
  ST = G.sys.order.states; isl = L().islands();
  /* the islands keep the places they have on the map, drawn to one scale both ways */
  const asp = L().map().aspect || 1; let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
  isl.forEach(q => { x0 = Math.min(x0, q.x * asp); x1 = Math.max(x1, q.x * asp); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
  const s = Math.min((PW - 70) / (x1 - x0), (PH - 30) / (y1 - y0)), ox = PX + PW / 2 - (x0 + x1) / 2 * s, oy = PY + PH / 2 - 3 - (y0 + y1) / 2 * s;
  at = isl.map(q => [Math.round(ox + q.x * asp * s), Math.round(oy + q.y * s)]); rad = isl.map(q => Math.round(2 + Math.sqrt(q.n) * 0.55));
  cur = 0; held = -1; laid = []; anim = null; last = null; stops = 0; sent = 0; early = 0; onDone = false; said = {};
}
/* the next island in a direction: the nearest one, with a penalty for being off to the side */
function step(dx, dy) {
  if (onDone) { if (dy < 0) { onDone = false; G.sfx('tick'); } return; }
  let best = -1, bs = 1e9;
  at.forEach((q, k) => { if (k === cur) return; const vx = q[0] - at[cur][0], vy = q[1] - at[cur][1], along = vx * dx + vy * dy, side = Math.abs(vx * dy) + Math.abs(vy * dx); if (along <= 2) return; const v = along + side * 2.2; if (v < bs) { bs = v; best = k; } });
  if (best >= 0) { cur = best; G.sfx('tick'); } else if (dy > 0) { onDone = true; G.sfx('tick'); }
}
function say(lines) { tip = new G.Beats(lines.map(s => ({ say: s }))); }

/* ---------- the wagon ---------- */
function act() {
  if (held < 0) { held = cur; G.sfx('blip'); return; }
  if (cur === held) { held = -1; G.sfx('tick'); return; }
  if (piece(held, cur)) { held = -1; G.sfx('tick'); return; }
  G.state.tries.track++; G.save();
  anim = { a: held, b: cur, t: 0, res: L().links(held, cur) }; last = anim; sent++; held = -1; G.sfx('door');
}
function arrived() {
  const a = anim.a, b = anim.b, r = anim.res; anim = null;
  laid.push({ a, b, holds: r.holds });
  if (r.holds) { G.sfx('ok'); lights(); return; }
  stops++; G.sfx('bad'); lights();
  /* why it stopped: said once for each kind of gap */
  const apart = a === L().APART || b === L().APART, near = L().nearest(a) === b || L().nearest(b) === a, lines = [];
  if (near && !said.near) { said.near = true; lines.push('They sit side by side on the map, and the wagon stopped. A map puts islands where it has room. Only links join them.'); }
  if (apart && !said.apart) { said.apart = true; lines.push(W.apart); G.book.unlock('k-apart'); }
  if (!apart && !near && !said.far) { said.far = true; lines.push('No cell of one island has a neighbour in the other. The way between them leads through a third.'); }
  if (lines.length) say(lines);
}
function finish() {
  held = -1;
  G.state.tries.track++; G.save();
  if (missing().length) { early++; slips++; G.sfx('bad'); lights(); say(['Not yet. An island that the cells link to the line still has no track to it.']); return; }
  if (!tested(L().APART)) { G.sfx('bad'); say(['One island has had no wagon at all. Whether it is on the line is still a guess. Send one to it.']); return; }
  res = { stars: wasted() <= FREE ? 3 : wasted() <= FREE + 2 ? 2 : 1 }; phase = 'result'; rsel = 1; onDone = false;
  ['k-map', 'k-apart', 'k-part', 'k-toy'].forEach(n => G.book.unlock(n)); lights(); G.sfx('star');
}
function lights() {
  G.book.goal('line', early ? false : phase === 'result' ? true : null);
  G.book.goal('few', wasted() > FREE ? false : phase === 'result' ? true : null);
}
function keep() {
  const s = G.state;
  s.yard = Object.assign({}, s.yard, { pieces: laid.filter(q => q.holds).length, wagons: sent, stops });
  s.rooms.track = { done: true, stars: Math.max(s.rooms.track.stars, res.stars) };
  G.save(); G.go('corridor', { from: 'track' });
}
function restart() { slips = 0; res = null; build(); phase = 'play'; lights(); }

function showBook() {
  G.book.show({
    floor: 'The Marshalling Yard · Station 5-2', room: 'The track', aim: 'Lay track between the islands that the cells join, and nowhere else.',
    file: 'js/stages/order/track.js',
    goals: [
      { id: 'line', text: 'Track joins every island that the cells link' },
      { id: 'few', text: 'No more than ' + FREE + ' test wagons stop at a gap' },
    ],
    notes: [
      { id: 'k-any', open: true, html: 'A pseudotime can be worked out for every cell the graph reaches, and a curve can be drawn through any clusters. Neither shows that cells of one kind become cells of another. A trajectory needs a <b>continuum</b>: cells at every point in between.' },
      { id: 'k-paga', open: true, html: '<b>PAGA</b> tests that cluster by cluster. It counts the links of the neighbour graph that run between two clusters, and divides by the number expected if every cell\'s neighbours were picked at random. Cells keep most of their links inside their own cluster, so even two joined clusters score well below 1, and two unjoined ones score near 0. Where to draw the line between is left to you.' },
      { id: 'k-map', html: 'The map is drawn from the same graph, but the space between its islands means little, as the Cloud\'s map table showed. Read connections from the graph, not from the picture.' },
      { id: 'k-apart', html: W.born },
      { id: 'k-part', html: 'Other tools make the same kind of test. Monocle 3 splits the cells into <b>partitions</b> and learns a separate graph in each. Slingshot can leave a cluster that lies too far from the others out of its tree (the argument omega).' },
      { id: 'k-toy', html: 'In this game the islands are the cell types as they were generated, every cell points at its 10 nearest cells, and a wagon crosses when the links between two islands come to at least ' + L().pc(L().MARK) + ' of the random count. Scanpy draws PAGA links above 1% unless told otherwise.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'Count the links between clusters <b>before</b> a line is drawn through them.',
      tabs: [
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          'sc.pp.<span class="k">neighbors</span>(adata, n_pcs=10)\n' +
          'sc.tl.<span class="k">paga</span>(adata, groups=<span class="s">"' + W.groups + '"</span>)\n\n' +
          '<span class="c"># links between every two clusters, as\n# a share of what random links give</span>\n' +
          'adata.uns[<span class="s">"paga"</span>][<span class="s">"connectivities"</span>]\n\n' +
          '<span class="c"># the clusters as islands, joined where\n# that share passes a threshold</span>\n' +
          'sc.pl.<span class="k">paga</span>(adata, threshold=<span class="p">' + L().MARK + '</span>)</pre>' },
        { id: 'mo', label: 'R · Monocle 3', html:
          '<pre class="code"><span class="k">library</span>(monocle3)\n' +
          '<span class="c"># clusters, and the groups of clusters\n# that are joined: partitions</span>\n' +
          'cds &lt;- <span class="k">cluster_cells</span>(cds,\n    partition_qval = 0.05)\n' +
          '<span class="k">table</span>(<span class="k">partitions</span>(cds))\n\n' +
          '<span class="c"># one graph per partition: no line is\n# drawn from one to another</span>\n' +
          'cds &lt;- <span class="k">learn_graph</span>(cds,\n    use_partition = TRUE)</pre>' },
        { id: 'sl', label: 'R · Slingshot', html:
          '<pre class="code"><span class="k">library</span>(slingshot)\n' +
          '<span class="c"># omega: a cluster further from the\n# rest than this allows starts a tree\n# of its own</span>\n' +
          'sce &lt;- <span class="k">slingshot</span>(sce,\n    clusterLabels = <span class="s">"' + W.groups + '"</span>,\n    reducedDim = <span class="s">"PCA"</span>,\n    start.clus = <span class="s">"' + G.sys.order.turntable.label + '"</span>,\n    omega = TRUE)\n' +
          '<span class="c"># which clusters each lineage runs through</span>\n' +
          '<span class="k">slingLineages</span>(sce)</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="c"># pseudotime is scored on one connected\n# part of the graph. Cells outside it\n# are marked, not numbered.</span>\n' +
          '<span class="c"># graph, labels: as at the turntable</span>\n' +
          'pt = ds.trajectory.<span class="k">pseudotime</span>(\n    graph,\n    source_sink=labels,\n    sources=[<span class="s">"' + G.sys.order.turntable.label + '"</span>],\n    sinks=[<span class="s">"' + G.sys.order.turntable.sink + '"</span>],\n    component_policy=<span class="s">"sources"</span>,\n)\n' +
          'res = ds.trajectory.<span class="k">load_pseudotime</span>(pt)\n' +
          'res.component_sizes\n' +
          '<span class="c"># False for cells off the line</span>\n' +
          'res.valid</pre>' },
      ],
    },
  });
}

G.scenes.track = {
  phase: () => phase,
  dbg: { cur: () => cur, held: () => held, stops: () => stops, sent: () => sent, slips: () => slips, onDone: () => onDone, busy: () => !!anim || !!tip, laid: () => laid.map(q => [q.a, q.b, q.holds]),
    islands: () => isl.map((q, k) => ({ k, id: ST[k].id, x: at[k][0], y: at[k][1], near: L().nearest(k) })), pieces: () => need().map(q => q.slice()), apart: () => L().APART,
    go: k => { cur = k; onDone = false; }, spot: what => (what === 'act' ? [146, 152] : [258, 152]) },
  enter() {
    phase = 'load'; load = 0; slips = 0; res = null; rsel = 0; tip = null; anim = null; last = null;
    W = G.sys.order.track;
    beats = new G.Beats([
      { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'The same map, drawn as islands: one for each kind of cell. Four of them were the band. Two more lie beside it.' },
      { spot: [SX, 14, SW, 114], say: 'Lay track between two islands, and a test wagon counts the cells of one that have neighbours in the other.' },
      { say: 'It crosses where the links are many, and stops at a gap. Join every island the cells link, and waste few wagons.' },
    ]);
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'track' }); return; }
    if (phase === 'load') { if (++load < 3) return; build(); phase = G.state.tries.track > 0 ? 'play' : 'intro'; lights(); return; }
    if (anim) { anim.t += dt; if (anim.t >= ROLL + 0.5) arrived(); }
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'play'; return; }
    if (phase === 'result') { const r = G.resultKeys(rsel, true); rsel = r.rsel; if (r.act === 'keep') keep(); else if (r.act === 'retry') restart(); return; }
    if (tip) { if (tip.update(dt) === 'done') tip = null; return; }
    if (anim) return;
    if (G.hit('left')) step(-1, 0); if (G.hit('right')) step(1, 0); if (G.hit('up')) step(0, -1); if (G.hit('down')) step(0, 1);
    /* a tap on an island goes there, and is a move with it */
    if (G.ptr.pressed && G.over(PX, PY, PW, PH)) { let best = -1, bd = 20; at.forEach((q, k) => { const v = Math.hypot(q[0] - G.ptr.x, q[1] - G.ptr.y); if (v < bd) { bd = v; best = k; } }); if (best >= 0) { cur = best; onDone = false; act(); return; } }
    if (G.act()) { if (onDone) finish(); else act(); }
  },
  draw() {
    R(0, 0, VW, VH, '#0f1118');
    if (phase === 'load') { G.roomHeader('5-2  THE TRACK', C.mint, true); T('SURVEYING THE ISLANDS...', VW / 2, 84, C.fog, { a: 'center' }); return; }
    drawMap(); drawSide();
    G.roomHeader('5-2  THE TRACK', C.mint, true);
    const y0 = 130;
    if (phase === 'result') {
      const act2 = G.resultDraw(y0, 'An order can be worked out between any two islands. A line runs only where the cells of one lead on to the cells of the next.', true, rsel, 'START AGAIN', 'KEEP THE LINE');
      if (act2 === 'keep') keep(); else if (act2 === 'retry') restart();
      G.stars(250, y0 + 7, res.stars); T(stops + (stops === 1 ? ' GAP' : ' GAPS'), 310, y0 + 18, C.steel, { a: 'right' });
      return;
    }
    G.strip(y0);
    const live = phase === 'play' && !tip && !anim;
    T('TRACK LAID', 10, y0 + 5, C.fog); T(String(laid.filter(q => q.holds).length), 10, y0 + 14, C.white, { f: 'lg' });
    T(G.kt('ARROWS: ISLAND', 'TAP AN ISLAND,'), 10, y0 + 31, C.steel); T(G.kt('SPACE: TRACK', 'THEN ANOTHER'), 10, y0 + 40, C.steel);
    if (G.button('lay', 92, y0 + 8, 108, 28, held < 0 ? 'START TRACK HERE' : 'SEND THE WAGON', { primary: true, focus: live && !onDone }) && live) { onDone = false; act(); }
    if (G.button('done', 208, y0 + 8, 104, 28, 'LINE COMPLETE', { focus: live && onDone }) && live) finish();
    if (live && !missing().length && tested(L().APART) && !onDone) G.cue(260, y0 + 7, true);
    if (phase === 'intro') beats.draw();
    if (tip) tip.draw();
  },
};

/* ---------- drawing ---------- */
/* where a piece of track meets the edge of each of its two islands */
function ends(a, b) {
  const dx = at[b][0] - at[a][0], dy = at[b][1] - at[a][1], d = Math.hypot(dx, dy) || 1;
  return [at[a][0] + dx / d * (rad[a] + 1), at[a][1] + dy / d * (rad[a] + 1), at[b][0] - dx / d * (rad[b] + 1), at[b][1] - dy / d * (rad[b] + 1)];
}
function track(a, b, upTo, c) {
  const e = ends(a, b), n = Math.max(2, Math.round(Math.hypot(e[2] - e[0], e[3] - e[1]) / 4));
  for (let i = 0; i <= n * upTo; i++) R(Math.round(G.lerp(e[0], e[2], i / n)) - 1, Math.round(G.lerp(e[1], e[3], i / n)) - 1, 3, 3, '#3a2c1e');
  G.line(e[0], e[1], G.lerp(e[0], e[2], upTo), G.lerp(e[1], e[3], upTo), c);
}
function drawMap() {
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  /* pieces that hold are track. A piece that failed leaves its two stubs, with a gap between them. */
  laid.forEach(q => {
    if (q.holds) { track(q.a, q.b, 1, phase === 'result' && Math.floor(G.t * 3) % 2 ? C.white : C.fog); return; }
    const e = ends(q.a, q.b); track(q.a, q.b, 0.3, '#8a5a50'); track(q.b, q.a, 0.3, '#8a5a50');
    [0.33, 0.67].forEach(f => R(Math.round(G.lerp(e[0], e[2], f)) - 1, Math.round(G.lerp(e[1], e[3], f)) - 1, 3, 3, C.coral));
  });
  if (anim) {
    /* the wagon runs out along the new piece; where the links are missing it gets half-way and no further */
    const f = Math.min(1, anim.t / ROLL), reach = anim.res.holds ? f : Math.min(f, 0.5), e = ends(anim.a, anim.b);
    track(anim.a, anim.b, reach, C.fog);
    const wx = Math.round(G.lerp(e[0], e[2], reach)), wy = Math.round(G.lerp(e[1], e[3], reach)), jig = !anim.res.holds && f >= 0.5 ? Math.round(Math.sin(G.t * 50)) : 0;
    R(wx - 4 + jig, wy - 4, 9, 7, C.ink); R(wx - 3 + jig, wy - 3, 7, 5, anim.res.holds || f < 0.5 ? C.paper : C.coral);
  } else if (held >= 0 && cur !== held && !onDone && phase === 'play' && Math.floor(G.t * 6) % 2) { const e = ends(held, cur); G.line(e[0], e[1], e[2], e[3], 'rgba(255,255,255,.5)'); }
  /* the islands, each with its name beside it */
  isl.forEach((q, k) => {
    const p = at[k], r = rad[k], side = W.tag[k], name = ST[k].short, tw = Math.ceil(G.tw(name, 'sm'));
    G.disc(p[0], p[1], r, COLS[k]); G.disc(p[0] - Math.round(r / 3), p[1] - Math.round(r / 3), Math.max(1, Math.round(r / 4)), 'rgba(255,255,255,.3)');
    /* the name stands clear of the corners that mark an island */
    const tx = side === 'W' ? p[0] - r - 5 - tw : side === 'E' ? p[0] + r + 6 : G.clamp(p[0] - Math.round(tw / 2), PX + 2, PX + PW - tw - 2), ty = side === 'N' ? p[1] - r - 13 : side === 'S' ? p[1] + r + 4 : p[1] - 5;
    R(tx - 1, ty + 1, tw + 2, 8, '#0e1630'); T(name, tx, ty, C.fog);
  });
  if (phase === 'result') return;
  if (held >= 0) G.corners([at[held][0] - rad[held] - 3, at[held][1] - rad[held] - 3, 2 * rad[held] + 6, 2 * rad[held] + 6], C.amber);
  if (phase === 'play' && !tip && !anim && !onDone) G.corners([at[cur][0] - rad[cur] - 3, at[cur][1] - rad[cur] - 3, 2 * rad[cur] + 6, 2 * rad[cur] + 6], Math.floor(G.t * 4) % 2 ? C.white : C.fog);
}
/* what the last test wagon counted */
function drawSide() {
  const x = SX, wd = SW, q = anim || last, f = anim ? Math.min(1, anim.t / (ROLL * 0.8)) : 1;
  G.panel(x, 14, wd, 114, { border: C.slate, fill: '#0e1630' });
  T('TEST WAGON', x + 6, 17, C.mist);
  if (!q) { T('NOT SENT YET', x + 6, 30, C.steel); }
  else {
    R(x + 6, 31, 5, 5, COLS[q.a]); T(ST[q.a].short, x + 14, 29, C.white); R(x + 6, 41, 5, 5, COLS[q.b]); T(ST[q.b].short, x + 14, 39, C.white);
    const links = Math.round(q.res.links * f), done = !anim || anim.t >= ROLL;
    T('LINKS FOUND', x + 6, 53, C.fog); T(String(links), x + wd - 6, 50, C.white, { a: 'right', f: 'lg' });
    T('IF DRAWN AT RANDOM', x + 6, 68, C.fog); T(String(Math.round(q.res.chance)), x + wd - 6, 77, C.steel, { a: 'right', f: 'smb' });
    /* the links as a share of the random count, on a scale that ends at 60%, with the mark a wagon needs */
    const w = wd - 12, v = Math.min(1, q.res.ratio * f / 0.6);
    R(x + 6, 90, w, 5, C.slate); R(x + 6, 90, Math.round(w * v), 5, q.res.holds ? C.mint : C.coral); R(x + 6 + Math.round(w * L().MARK / 0.6), 87, 2, 11, C.white);
    T(L().pc(q.res.ratio * f) + ' OF RANDOM', x + 6, 99, C.fog);
    if (done) T(q.res.holds ? 'CROSSED' : 'GAP', x + wd - 6, 17, q.res.holds ? C.mint : C.coral, { a: 'right', f: 'smb' });
  }
  R(x + 5, 110, wd - 10, 1, C.slate);
  T('GAPS', x + 6, 115, C.fog); for (let i = 0; i < Math.min(9, Math.max(FREE, stops)); i++) R(x + 36 + i * 9, 116, 7, 6, i < stops ? (i < FREE ? C.amber : C.coral) : C.slate);
  if (phase === 'result') T(sent + ' WAGONS', x + wd - 6, 115, C.steel, { a: 'right' });
}
})();
