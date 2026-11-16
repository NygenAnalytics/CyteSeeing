/* Station 5-3, the Timetable. Five genes rise and fall along the line in an order. A trolley runs
   along the line with five lamps on it, one for each gene, and each lamp shows that gene's level
   among the cells around the trolley. A lever sets how many cells count as "around": the span of
   the smoothing. The player sets the lever, runs the trolley along the line, and pegs each gene's
   card where its lamp comes on. The timetable then lists the genes in the order of their pegs.
   With too little smoothing the lamps flicker and no order can be read. With too much, the wave
   of the progenitor gene, which few cells carry, never lights its lamp, and its card has nowhere
   to go.
   The curves and what each lamp shows are worked out from the cells (see line.curve, line.read). */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 180, PH = 110, SX = 190, SW = 126, X0 = PX + 20, CW = 4, RY = PY + 26, RH = 16, NX = 10, NW = 22;
const ORD = ['1ST', '2ND', '3RD', '4TH', '5TH'], LAMP = ['#161d35', '#4a4424', '#a8822e', '#e0a83c', '#ffd27a'];
const L = () => G.lineage;

let phase, load, beats, tip, W, GENES, si, stop, foc, pegs, seen, said, slips, flick, wrong, res, rsel, lastSync;

const read = () => L().read(si);
const ry = i => RY + i * RH;
const allSeen = () => { for (let s = 0; s < seen.length; s++) if (!seen[s]) return false; return true; };
const allPegged = () => pegs.every(p => p >= 0);
/* the genes in the order of their pegs; null if two cards share a peg hole */
function pegged() {
  const o = GENES.map((g, i) => i).filter(i => pegs[i] >= 0).sort((a, b) => pegs[a] - pegs[b]);
  for (let i = 1; i < o.length; i++) if (pegs[o[i]] === pegs[o[i - 1]]) return null;
  return o;
}
const rank = i => { const o = pegged(); return o ? o.indexOf(i) : -1; };
const label = v => (v ? String(v).replace(/^0/, '') : '0');
/* about how many cells one stop takes in at a span: the cells within a span and a quarter either side */
const cellsAt = v => Math.max(1, Math.round(2.5 * v * L().trains().reduce((n, t) => n + t.at.length, 0)));

function say(text) { tip = new G.Beats([{ say: text }]); }
function setNotch(i) {
  i = G.clamp(i, 0, L().SPANS.length - 1); if (i === si) return;
  si = i; seen.fill(0); seen[stop] = 1; pegs.fill(-1); G.sfx('door'); lights(); sync();
}
function move(to) {
  to = G.clamp(to, 0, L().STOPS - 1); if (to === stop) return;
  for (let s = Math.min(stop, to); s <= Math.max(stop, to); s++) seen[s] = 1;
  stop = to;
  /* the whole line has been seen at this setting, and a lamp never lit */
  const lost = read().lost;
  if (lost.length && !said.lost && allSeen()) { said.lost = true; G.sfx('bad'); G.book.unlock('m-span2'); say('The ' + lost[0] + ' lamp never lit. Few cells carry its wave, and so much smoothing has spread them too thin to see.'); }
}
function peg(i) {
  if (i < 0 || i >= GENES.length) return;
  if (!read().rows[W.genes.indexOf(GENES[i])].lit[stop]) { G.sfx('bad'); if (!said.dark) { said.dark = true; say('A card pegs only where its lamp is lit.'); } return; }
  pegs[i] = stop; G.sfx('drop'); lights();
}
function check() {
  if (!allPegged()) { G.sfx('bad'); say('Five cards, and not all of them are pegged. Peg each one where its lamp comes on.'); return; }
  G.state.tries.timetable++; G.save();
  const r = read(), o = pegged(), truth = W.genes;
  if (r.flicker.length) { slips++; flick = true; G.sfx('bad'); lights(); say('At this setting a lamp goes on, off and on again along the line. A stop shows a cell or two, and single cells are noisy.'); return; }
  if (!o || o.some((g, k) => GENES[g] !== truth[k])) { slips++; wrong = true; G.sfx('bad'); lights(); say('The pegs are not in the order the lamps come on. Run the trolley from the root again, and watch each lamp light.'); return; }
  res = { stars: slips === 0 ? 3 : slips === 1 ? 2 : 1 }; phase = 'result'; rsel = 1;
  ['m-span2', 'm-trade', 'm-order', 'm-toy'].forEach(n => G.book.unlock(n)); lights(); G.sfx('star');
}
function lights() {
  G.book.goal('span', flick ? false : phase === 'result' ? true : null);
  G.book.goal('order', wrong ? false : phase === 'result' ? true : null);
}
function keep() {
  const s = G.state;
  s.yard = Object.assign({}, s.yard, { span: L().SPANS[si], genes: pegged().map(g => GENES[g]) });
  s.rooms.timetable = { done: true, stars: Math.max(s.rooms.timetable.stars, res.stars) };
  G.save(); G.go('corridor', { from: 'timetable' });
}
function restart() { slips = 0; flick = wrong = false; res = null; said = {}; si = 0; stop = 0; foc = 0; pegs = GENES.map(() => -1); seen = new Uint8Array(L().STOPS); seen[0] = 1; phase = 'play'; lights(); sync(); }

function sync() { if (si === lastSync) return; lastSync = si; G.params.yavg = cellsAt(L().SPANS[si]); G.book.sync(); }
function showBook() {
  const n = '<span class="p" data-b="yavg"></span>', q = s => '<span class="s">"' + s + '"</span>';
  G.book.show({
    floor: 'The Marshalling Yard · Station 5-3', room: 'The timetable', aim: 'Five genes come on along the line, one after another. Find the order.',
    codeFirst: true, file: 'js/stages/order/timetable.js',
    goals: [
      { id: 'span', text: 'The lever is set where every lamp can be read' },
      { id: 'order', text: 'The five cards stand in the order the lamps come on' },
    ],
    notes: [
      { id: 'm-curve', open: true, html: 'Once the cells have a pseudotime, any gene can be drawn as a curve along it. Single cells are noisy and full of zeros, so the curve is <b>smoothed</b>: each point is an average of the cells around it.' },
      { id: 'm-span', open: true, html: 'How many cells count as "around it" is a choice: a window, the width of a kernel, the number of knots of a spline. It decides what the curve can show.' },
      { id: 'm-span2', html: 'Too narrow, and the curve follows single cells. Too wide, and anything brief is averaged with what lies either side of it. Before trusting a pattern, change the setting and see whether the pattern stays.' },
      { id: 'm-trade', html: '<b>tradeSeq</b> fits a smooth curve to each gene\'s counts along pseudotime, with a negative binomial additive model, and tests whether the curve changes. The number of knots sets how much a curve may bend, and the function evaluateK helps to choose it.' },
      { id: 'm-order', html: W.order },
      { id: 'm-toy', html: 'In this game the lever sets the width of a Gaussian kernel, as a share of the line\'s whole pseudotime. A lamp is lit where a gene\'s smoothed level reaches half of its usual level in the cells that carry it.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'The <b>highlighted value</b> follows the lever: about how many cells each point of a curve is averaged over.',
      tabs: [
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          '<span class="c"># genes along a path through clusters,\n# cell by cell in order of pseudotime,\n# as a running mean over n_avg cells</span>\n' +
          'sc.pl.<span class="k">paga_path</span>(\n    adata,\n    nodes=[' + q(W.path[0]) + ', ' + q(W.path[1]) + ',\n           ' + q(W.path[2]) + ',\n           ' + q(W.path[3]) + '],\n' +
          '    keys=[' + q(W.genes[0]) + ', ' + q(W.genes[1]) + ', ' + q(W.genes[2]) + ',\n          ' + q(W.genes[3]) + ', ' + q(W.genes[4]) + '],\n    n_avg=' + n + ',\n)</pre>' },
        { id: 'ts', label: 'R · tradeSeq', html:
          '<pre class="code"><span class="k">library</span>(tradeSeq)\n' +
          '<span class="c"># pseudotime and weights of the cells,\n# from the curves Slingshot fitted</span>\n' +
          'crv &lt;- <span class="k">SlingshotDataSet</span>(sce)\n' +
          'pt &lt;- <span class="k">slingPseudotime</span>(crv, na = FALSE)\n' +
          'w &lt;- <span class="k">slingCurveWeights</span>(crv)\n\n' +
          '<span class="c"># knots set how far a curve may bend:\n# compare several numbers of them</span>\n' +
          '<span class="k">evaluateK</span>(counts = counts,\n    pseudotime = pt, cellWeights = w,\n    k = 3:10)\n\n' +
          'fit &lt;- <span class="k">fitGAM</span>(counts = counts,\n    pseudotime = pt, cellWeights = w,\n    nknots = 6)\n' +
          '<span class="c"># does a gene change along the line?</span>\n' +
          '<span class="k">associationTest</span>(fit)\n' +
          '<span class="k">plotSmoothers</span>(fit, counts,\n    gene = ' + q(W.brief) + ')</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="c"># every gene along pseudotime: a rolling\n# mean over window_size cells, and genes\n# with similar curves put in one module</span>\n' +
          '<span class="c"># pt: the pseudotime from the turntable</span>\n' +
          'mods = ds.trajectory.<span class="k">aggregation</span>(\n    pt,\n    features=run[<span class="s">"feature_universe"</span>],\n    window_size=200,\n    chunk_size=50,\n    n_clusters=10,\n)\n' +
          'ds.plots.<span class="k">pseudotime_heatmap</span>(\n    aggregation=mods)\n' +
          '<span class="c"># a narrower window keeps brief peaks,\n# and more noise</span></pre>' },
      ],
    },
  });
}

G.scenes.timetable = {
  phase: () => phase,
  dbg: { si: () => si, stop: () => stop, foc: () => foc, pegs: () => pegs.slice(), slips: () => slips, busy: () => !!tip, genes: () => GENES.slice(), truth: () => W.genes.slice(), pass: () => L().readable(),
    /* at the lever's setting: where each lamp first lights, which lamps flicker and which never light */
    read: () => { const r = read(); return { first: r.rows.map(q => q.first), flicker: r.flicker, lost: r.lost, ok: r.ok }; },
    spot: (what, a, b) => (what === 'notch' ? [NX + a * NW + 10, 150] : what === 'stop' ? [X0 + a * CW + 2, ry(b) + 5] : what === 'card' ? [SX + 60, ry(a) + 5] : what === 'peg' ? [177, 152] : [267, 152]) },
  enter() {
    phase = 'load'; load = 0; slips = 0; flick = wrong = false; res = null; rsel = 0; tip = null; said = {}; lastSync = null;
    W = G.sys.order.timetable; GENES = W.genes.slice();
    /* the cards hang in an order that is not the answer */
    GENES = [GENES[3], GENES[1], GENES[4], GENES[0], GENES[2]];
    si = 0; stop = 0; foc = 0; pegs = GENES.map(() => -1);
    beats = new G.Beats([
      { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'This is the line, with its root on the left. The trolley carries a lamp for each of five genes, and leaves a trace.' },
      { spot: [0, 130, 134, 50], say: 'Each lamp shows its gene in the cells around the trolley. The lever sets how many cells that is.' },
      { spot: [SX, 14, SW, 114], say: 'Pick a card, run the trolley along the line, and peg the card where its lamp comes on. Five pegs make the timetable.' },
    ]);
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'timetable' }); return; }
    if (phase === 'load') { if (++load < 3) return; L().build(); seen = new Uint8Array(L().STOPS); seen[0] = 1; read(); phase = G.state.tries.timetable > 0 ? 'play' : 'intro'; lights(); sync(); return; }
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'play'; return; }
    if (phase === 'result') { const r = G.resultKeys(rsel, true); rsel = r.rsel; if (r.act === 'keep') keep(); else if (r.act === 'retry') restart(); return; }
    if (tip) { if (tip.update(dt) === 'done') tip = null; return; }
    const n = GENES.length;
    if (G.hit('down')) { foc = Math.min(n + 1, foc + 1); G.sfx('tick'); }
    if (G.hit('up')) { foc = Math.max(0, foc - 1); G.sfx('tick'); }
    const d = (G.rep('right') ? 1 : 0) - (G.rep('left') ? 1 : 0);
    if (d && foc === 0) setNotch(si + d); else if (d && foc <= n) move(stop + d);
    /* a finger on a row picks that card and brings the trolley; a tap on a card picks it */
    if ((G.ptr.down || G.ptr.pressed) && G.ptr.x >= X0 - 6 && G.ptr.x < X0 + L().STOPS * CW + 6 && G.ptr.y >= PY + 8 && G.ptr.y < PY + PH) {
      const row = Math.floor((G.ptr.y - RY + 3) / RH); if (row >= 0 && row < n) foc = row + 1; else if (foc < 1 || foc > n) foc = 1;
      move(Math.floor((G.ptr.x - X0) / CW));
    }
    if (G.ptr.pressed) for (let i = 0; i < n; i++) if (G.over(SX + 2, ry(i) - 3, SW - 4, RH)) { foc = i + 1; G.sfx('tick'); }
    if (G.act()) { if (foc === n + 1) check(); else if (foc >= 1) peg(foc - 1); }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#0f1118');
    if (phase === 'load') { G.roomHeader('5-3  THE TIMETABLE', C.amber, true); T('HANGING THE LAMPS...', VW / 2, 84, C.fog, { a: 'center' }); return; }
    drawLine(); drawTable();
    G.roomHeader('5-3  THE TIMETABLE', C.amber, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, 'With too little smoothing, single cells drown the order. With too much, a wave that few cells carry is gone.', true, rsel, 'START AGAIN', 'KEEP THE TIMETABLE');
      if (act === 'keep') keep(); else if (act === 'retry') restart();
      G.stars(250, y0 + 7, res.stars); T(slips + (slips === 1 ? ' SLIP' : ' SLIPS'), 310, y0 + 18, C.steel, { a: 'right' });
      return;
    }
    G.strip(y0);
    const live = phase === 'play' && !tip, n = GENES.length;
    /* the lever: a slot with a notch for each span, and a knob in the one that is set */
    T('SMOOTHING: ' + (si ? cellsAt(L().SPANS[si]) + ' CELLS' : '1 CELL'), NX, y0 + 3, foc === 0 && live ? C.white : C.fog);
    R(NX, y0 + 28, L().SPANS.length * NW - 2, 2, C.slate);
    L().SPANS.forEach((v, i) => {
      if (G.button('notch' + i, NX + i * NW, y0 + 13, NW - 2, 13, label(v), { primary: i === si, fill: '#8a5a12', accent: C.amber }) && live) { foc = 0; setNotch(i); }
      if (i === si) { R(NX + i * NW + 7, y0 + 25, 6, 8, '#c8413c'); R(NX + i * NW + 8, y0 + 26, 4, 2, 'rgba(255,255,255,.5)'); }
    });
    if (foc === 0 && live && Math.floor(G.t * 3) % 2 === 0) T('>', NX - 7, y0 + 15, C.cyan);
    T(G.kt('UP, DOWN: LEVER, CARDS   LEFT, RIGHT: MOVE', 'TAP A CARD. DRAG ALONG THE LINE.'), NX, y0 + 40, C.steel);
    if (G.button('peg', 138, y0 + 8, 78, 28, 'PEG THE CARD', { focus: live && foc >= 1 && foc <= n, disabled: foc < 1 || foc > n }) && live) peg(foc - 1);
    if (G.button('check', 222, y0 + 8, 90, 28, 'CHECK', { primary: true, focus: live && foc === n + 1 }) && live) { foc = n + 1; check(); }
    if (live && allPegged() && foc !== n + 1) G.cue(267, y0 + 7, true);
    if (phase === 'intro') beats.draw();
    if (tip) tip.draw();
  },
};

/* ---------- drawing ---------- */
function drawLine() {
  const r = read(), n = GENES.length, S = L().STOPS, tx = X0 + stop * CW;
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  T('ROOT', X0, PY + 2, C.steel); T('FAR END', X0 + S * CW, PY + 2, C.steel, { a: 'right' });
  /* the rail, and the trolley on it */
  for (let x = X0 - 2; x < X0 + S * CW + 2; x += 6) R(x + 1, PY + 19, 3, 2, '#3a2c1e'); R(X0 - 4, PY + 18, S * CW + 8, 1, '#aab2c4');
  R(tx - 2, PY + 11, 8, 6, C.oil); R(tx - 2, PY + 11, 8, 1, 'rgba(255,255,255,.5)'); R(tx - 1, PY + 17, 2, 2, C.ink); R(tx + 3, PY + 17, 2, 2, C.ink);
  R(tx + 1, PY + 20, 2, n * RH + 2, 'rgba(246,186,76,.35)');
  GENES.forEach((g, i) => {
    const y = ry(i), row = r.rows[W.genes.indexOf(g)], on = phase === 'play' && foc === i + 1;
    R(X0 - 1, y - 1, S * CW + 2, 12, on ? C.steel : '#1c2748');
    /* the trace: what this lamp showed at every stop the trolley has been to */
    for (let s = 0; s < S; s++) {
      const v = row.level[s];
      R(X0 + s * CW, y, CW, 10, !seen[s] ? '#121831' : row.lit[s] ? (v >= 0.8 ? LAMP[4] : LAMP[3]) : v >= 0.25 ? LAMP[1] : LAMP[0]);
    }
    R(tx - 1, y - 1, CW + 2, 1, C.white); R(tx - 1, y + 10, CW + 2, 1, C.white);
    /* the peg: a flag over the stop where the card was pegged */
    if (pegs[i] >= 0) { const px = X0 + pegs[i] * CW; R(px + 1, y - 5, 1, 5, C.mint); R(px + 1, y - 5, 5, 3, C.mint); }
  });
}
function drawTable() {
  const x = SX, wd = SW, r = read(), n = GENES.length;
  G.panel(x, 14, wd, 114, { border: C.slate, fill: '#0e1630' });
  T('TIMETABLE', x + 6, 17, C.mist); T('COMES ON', x + wd - 6, 17, C.steel, { a: 'right' });
  GENES.forEach((g, i) => {
    const y = ry(i), row = r.rows[W.genes.indexOf(g)], on = phase === 'play' && foc === i + 1, k = rank(i), v = row.level[stop];
    if (on) R(x + 2, y - 3, wd - 4, RH - 1, C.deep);
    /* the lamp: dark, dim, or lit */
    R(x + 6, y - 1, 12, 12, C.ink); R(x + 7, y, 10, 10, row.lit[stop] ? (v >= 0.8 ? LAMP[4] : LAMP[3]) : v >= 0.25 ? LAMP[1] : LAMP[0]);
    if (row.lit[stop]) R(x + 8, y + 1, 3, 2, 'rgba(255,255,255,.6)');
    T(g, x + 23, y + 1, on ? C.white : C.fog, { f: 'smb' });
    if (pegs[i] >= 0) T(k >= 0 ? ORD[k] : 'SAME', x + wd - 6, y + 1, k >= 0 ? C.mint : C.coral, { a: 'right', f: 'smb' }); else T('NO PEG', x + wd - 6, y + 1, C.steel, { a: 'right' });
    if (on && Math.floor(G.t * 3) % 2 === 0) for (let j = 0; j < 3; j++) R(x - 4 + j, y + 2 + j, 1, 5 - 2 * j, C.amber);
  });
}
})();
