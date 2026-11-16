/* Station 5-4, the Census. Every sample is a jar, filled in layers by cell type. In the responders
   after treatment one layer is thicker, and every other layer is thinner. The player works a
   pump on a copy of their "before" jar: choose a cell type, put cells in or take them out, and
   watch all five shares move, until the copy matches "after". One pump on one cell type matches
   everything; no other single cell type does. Then the ledger: mark one cell type as the
   reference the changes are stated against, and mark what changed. The trap is to mark the four
   cell types whose share only fell.
   The shares, the pump and the ledger are worked out from the counts (see trial.jars, trial.pump, trial.ledger). */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const JY = 30, JH = 80, TR = () => G.trial;
const NONE = 0, CHANGED = 1, REF = 2;

let phase, load, beats, say, after, steps, sel, mark, row, onBtn, slips, res, rsel, shown, J, K, TYPES, COLS, W, lastSync, shownRef, pumpSlip, refSlip, chgSlip, squirt;

const pumps = () => steps.filter(s => s !== 0).length;
const gap = () => TR().gap(steps);
const refOf = () => mark.indexOf(REF);
const mult = k => Math.pow(2, steps[k] / TR().STEP);
const fmtX = v => 'x' + (v >= 10 ? v.toFixed(0) : v.toFixed(v >= 1 ? 1 : 2));

/* ---------- the pump ---------- */
function pump(d) {
  const s = G.clamp(steps[sel] + d, -TR().REACH, TR().REACH);
  if (s === steps[sel]) { G.sfx('bad'); return; }
  steps[sel] = s; squirt = G.t; G.sfx(d > 0 ? 'drop' : 'pop'); sync(); lights();
}
function matched() {
  G.state.tries.census++; G.save();
  if (gap() > TR().TOL) { slips++; pumpSlip = true; G.sfx('bad'); lights(); tell('The copy is not the "after" jar yet. Watch the layer that is furthest from its mark.', false); return; }
  if (pumps() > 1) { slips++; pumpSlip = true; G.sfx('bad'); lights(); tell('That matches too, with more than one cell type moved. A jar cannot tell that from a shorter account. Start again, and find it.', 'reset'); return; }
  G.sfx('ok'); G.book.goal('pump', !pumpSlip); G.book.unlock('n-ref');
  tell(W.pumped, 'ledger');
}
/* ---------- the ledger ---------- */
function cycle(k, d) {
  let m = (mark[k] + (d || 1) + 3) % 3;
  if (m === REF) mark = mark.map(v => (v === REF ? NONE : v));
  mark[k] = m; shownRef = -1; G.sfx('tick'); sync(); lights();
}
function enter() {
  const ref = refOf();
  if (ref < 0) { G.sfx('bad'); tell('A change is stated against something. Mark one cell type as the reference.', false); return; }
  G.state.tries.census++; G.save();
  shownRef = ref;                                   /* the ledger now shows every cell type against the reference */
  const led = TR().ledger(ref), moved = TR().moved();
  if (moved.indexOf(ref) >= 0) { slips++; refSlip = true; G.sfx('bad'); lights(); tell('A reference has to be steady. This is the cell type the pump had to move, so all the others seem to have fallen.', false); return; }
  const extra = led.filter(x => !x.ref && !x.changed && mark[x.k] === CHANGED), missed = led.filter(x => x.changed && mark[x.k] !== CHANGED);
  if (extra.length) { slips++; chgSlip = true; G.sfx('bad'); lights(); tell('Against the reference, ' + (extra.length === 1 ? 'one of those has' : 'some of those have') + ' not moved. A share can fall in a full jar while the cells do nothing.', false); return; }
  if (missed.length) { slips++; chgSlip = true; G.sfx('bad'); lights(); tell('One cell type did change against the reference. The pump found it.', false); return; }
  res = { stars: slips === 0 ? 3 : slips === 1 ? 2 : 1, ref }; G.sfx('ok');
  tell(W.entered, 'result');
}
function tell(text, next) { say = new G.Beats([{ say: text }]); after = next; phase = phase === 'ledger' || phase === 'saidL' ? 'saidL' : 'said'; }
function advance() {
  const was = phase; say = null;
  if (after === 'reset') { steps = new Array(K).fill(0); phase = 'pump'; sync(); return; }
  if (after === 'ledger') { phase = 'ledger'; mark = new Array(K).fill(NONE); row = 0; onBtn = false; shownRef = -1; lights(); sync(); return; }
  if (after === 'result') { phase = 'result'; rsel = 1; ['n-coda', 'n-prop', 'n-milo', 'n-toy'].forEach(id => G.book.unlock(id)); lights(); G.sfx('star'); return; }
  phase = was === 'saidL' ? 'ledger' : 'pump';
}
function lights() {
  const done = phase === 'result', led = phase === 'ledger' || phase === 'saidL' || done;
  G.book.goal('pump', pumpSlip ? false : led ? true : null);
  G.book.goal('ref', refSlip ? false : done ? true : null);
  G.book.goal('chg', chgSlip ? false : done ? true : null);
}
function keep() {
  const s = G.state;
  s.weigh = Object.assign({}, s.weigh, { ref: res.ref });
  s.rooms.census = { done: true, stars: Math.max(s.rooms.census.stars, res.stars) };
  G.save(); G.go('corridor', { from: 'census' });
}
function restart() { steps = new Array(K).fill(0); sel = W.first; mark = new Array(K).fill(NONE); row = 0; onBtn = false; slips = 0; pumpSlip = refSlip = chgSlip = false; res = null; shownRef = -1; shown = null; phase = 'pump'; lights(); sync(); }

function sync() {
  const ref = refOf(), key = phase + '|' + ref; if (key === lastSync) return; lastSync = key;
  G.params.wref = TYPES[ref >= 0 ? ref : W.steady].word; G.book.sync();
}
function showBook() {
  const ref = '<span class="p" data-b="wref"></span>';
  G.book.show({
    floor: 'The Weigh House · Station 5-4', room: 'The Census', aim: 'Find which cell types changed in number between the jars, and enter it in the ledger.',
    file: 'js/stages/changes/census.js',
    goals: [
      { id: 'pump', text: 'The copy matches the "after" jar with one pump' },
      { id: 'ref', text: 'Changes are stated against a steady cell type' },
      { id: 'chg', text: 'Only what changed in number is marked as changed' },
    ],
    notes: [
      { id: 'n-comp', open: true, html: 'Cell-type proportions are <b>compositional</b>. A sample is a limited number of cells, so the shares add up to one, and when one cell type takes a larger share every other share must fall, whether or not anything happened to those cells.' },
      { id: 'n-uni', open: true, html: 'A test of each cell type\'s share on its own can therefore call the cell types that only made room. Methods for compositions look at all the cell types together.' },
      { id: 'n-ref', html: 'The jars cannot tell one cell type doubling from all the others halving: both fill a jar the same way. A <b>reference</b> breaks the tie: a cell type that is taken not to change. Every statement about composition is relative to one, so say which.' },
      { id: 'n-coda', html: '<b>scCODA</b> models the counts of all cell types together and reports changes relative to a reference cell type. You name the reference, or it picks a cell type whose share is nearly constant across the samples. Its prior favours accounts in which few cell types change.' },
      { id: 'n-prop', html: '<b>propeller</b>, in the speckle package, transforms each sample\'s proportions (logit, or arcsine square root) and tests every cell type with a linear model that uses the samples as replicates.' },
      { id: 'n-milo', html: 'Both need cell types with clear borders. <b>Milo</b> does not: it counts cells from each sample in small neighbourhoods of the neighbour graph, and tests those. That finds a shift inside a cell type, or along a gradient.' },
      { id: 'n-toy', html: 'In this game the pump multiplies one cell type\'s count in the average "before" jar of the six responders. The ledger tests, patient by patient in the responders, the ratio of each cell type to the reference, after against before.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'The <b>highlighted value</b> is the reference in your ledger. Until you mark one, it is a cell type that the pump left alone.',
      tabs: [
        { id: 'cd', label: 'Python · scCODA', html:
          '<pre class="code"><span class="k">import</span> pertpy <span class="k">as</span> pt\n\n' +
          'sccoda = pt.tl.<span class="k">Sccoda</span>()\n' +
          '<span class="c"># count the cells of every type in every\n# sample of the responders</span>\n' +
          'data = sccoda.<span class="k">load</span>(\n    adata,\n    type=<span class="s">"cell_level"</span>,\n    generate_sample_level=True,\n    cell_type_identifier=<span class="s">"cell_type"</span>,\n    sample_identifier=<span class="s">"sample"</span>,\n    covariate_obs=[<span class="s">"visit"</span>],\n)\n' +
          'data = sccoda.<span class="k">prepare</span>(\n    data,\n    modality_key=<span class="s">"coda"</span>,\n    formula=<span class="s">"visit"</span>,\n    reference_cell_type=<span class="s">"' + ref + '"</span>,\n)\n' +
          'sccoda.<span class="k">run_nuts</span>(data, modality_key=<span class="s">"coda"</span>)\n' +
          '<span class="c"># which cell types changed against it</span>\n' +
          'sccoda.<span class="k">credible_effects</span>(\n    data, modality_key=<span class="s">"coda"</span>)</pre>' },
        { id: 'pr', label: 'R · propeller', html:
          '<pre class="code"><span class="k">library</span>(speckle)\n' +
          '<span class="c"># one test per cell type, on transformed\n# proportions, with samples as replicates</span>\n' +
          'res &lt;- <span class="k">propeller</span>(\n    clusters = meta$cell_type,\n    sample = meta$sample,\n    group = meta$visit,\n    transform = <span class="s">"logit"</span>)</pre>' },
        { id: 'mi', label: 'Python · Milo', html:
          '<pre class="code"><span class="k">import</span> pertpy <span class="k">as</span> pt\n\n' +
          '<span class="c"># no cell types needed: neighbourhoods\n# of the neighbour graph are tested</span>\n' +
          'milo = pt.tl.<span class="k">Milo</span>()\n' +
          'mdata = milo.<span class="k">load</span>(adata)\n' +
          'milo.<span class="k">make_nhoods</span>(mdata, prop=0.1)\n' +
          'milo.<span class="k">count_nhoods</span>(\n    mdata, sample_col=<span class="s">"sample"</span>)\n' +
          'milo.<span class="k">da_nhoods</span>(\n    mdata, design=<span class="s">"~visit"</span>)</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="c"># the jars as a figure: every cell type\'s\n# share of each sample, with a line from\n# a donor\'s "before" to their "after"</span>\n' +
          'ds.plots.<span class="k">composition</span>(\n    category_by=<span class="s">"cell_type"</span>,\n    kind=<span class="s">"per_sample"</span>,\n    sample_by=<span class="s">"sample"</span>,\n    condition_by=<span class="s">"visit"</span>,\n    subject_by=<span class="s">"donor"</span>,\n)\n' +
          '<span class="c"># CyteArc draws the shares. It has no\n# test for them.</span></pre>' },
      ],
    },
  });
}

/* where the jars stand while the pump is worked */
const X = { nb: 10, na: 58, rb: 116, copy: 186, ra: 220, key: 280 };
G.scenes.census = {
  phase: () => phase,
  dbg: { steps: () => steps.slice(), sel: () => sel, gap: () => gap(), tol: () => TR().TOL, pumps: () => pumps(), marks: () => mark.slice(), row: () => row, onBtn: () => onBtn, slips: () => slips,
    /* the one cell type a single pump has to move, and how far */
    answer: () => { const one = TR().single().filter(s => s.gap <= TR().TOL)[0]; return { k: one.k, steps: one.steps, fell: TYPES.map((t, k) => k).filter(k => k !== one.k) }; },
    spot: (what, k) => (what === 'key' ? [X.key + 14, 40 + (K - 1 - k) * 11] : what === 'minus' ? [128, 152] : what === 'plus' ? [156, 152] : what === 'row' ? [90, 43 + k * 15] : [270, 152]) },
  enter() {
    phase = 'load'; load = 0; slips = 0; res = null; rsel = 0; say = null; lastSync = null; shown = null; shownRef = -1; squirt = -9; pumpSlip = refSlip = chgSlip = false; onBtn = false; row = 0;
    W = G.sys.changes.census; TYPES = G.sys.changes.types; K = TYPES.length; COLS = G.TYPES;
    steps = new Array(K).fill(0); mark = new Array(K).fill(NONE); sel = W.first;
    beats = new G.Beats([
      { spot: [4, 14, 104, 114], say: 'A jar is a sample, sorted by cell type. A wide jar is the average of six patients: the thin jars beside it.' },
      { spot: [110, 14, 166, 114], say: W.seen },
      { spot: [0, 130, VW, 50], say: 'The middle jar copies "before", and has a pump. Put cells of one type in or take them out until it matches "after".' },
    ]);
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'census' }); return; }
    if (phase === 'load') { if (++load < 3) return; TR().build(); J = TR().jars(); TR().single(); phase = G.state.tries.census > 0 ? 'pump' : 'intro'; lights(); sync(); return; }
    /* the layers of the copy flow to where the pump has put them */
    const to = TR().pump(steps), k = Math.min(1, dt * 10);
    if (!shown) shown = to.slice(); else for (let i = 0; i < K; i++) shown[i] += (to[i] - shown[i]) * k;
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'pump'; return; }
    if (phase === 'said' || phase === 'saidL') { if (say.update(dt) === 'done') advance(); return; }
    if (phase === 'result') { const r = G.resultKeys(rsel, true); rsel = r.rsel; if (r.act === 'keep') keep(); else if (r.act === 'retry') restart(); return; }
    if (phase === 'pump') {
      if (G.rep('up')) { sel = (sel + 1) % K; G.sfx('tick'); }      /* up the jar: the next layer */
      if (G.rep('down')) { sel = (sel + K - 1) % K; G.sfx('tick'); }
      if (G.rep('right')) pump(1); if (G.rep('left')) pump(-1);
      /* a tap on a name in the key, or on a layer of the copy, picks the cell type */
      if (G.ptr.pressed) {
        for (let i = 0; i < K; i++) if (G.over(X.key - 4, 36 + (K - 1 - i) * 11, 42, 11)) { sel = i; G.sfx('tick'); }
        if (G.over(X.copy, JY, 26, JH)) { let y = JY + JH; for (let i = 0; i < K; i++) { const h = shown[i] * JH; if (G.ptr.y <= y && G.ptr.y > y - h) { sel = i; G.sfx('tick'); } y -= h; } }
      }
      if (G.act()) matched();
      return;
    }
    /* the ledger */
    if (G.hit('down')) { if (row < K - 1) row++; else onBtn = true; G.sfx('tick'); }
    if (G.hit('up')) { if (onBtn) onBtn = false; else if (row > 0) row--; G.sfx('tick'); }
    if (!onBtn) { if (G.hit('right')) cycle(row, 1); if (G.hit('left')) cycle(row, -1); }
    if (G.ptr.pressed) for (let i = 0; i < K; i++) if (G.over(8, 36 + i * 15, 168, 15)) { row = i; onBtn = false; cycle(i, 1); }
    if (G.act()) { if (onBtn) enter(); else cycle(row, 1); }
  },
  draw() {
    R(0, 0, VW, VH, '#14100c');
    if (phase === 'load') { G.roomHeader('5-4  THE CENSUS', C.mint, true); T('FILLING THE JARS...', VW / 2, 84, C.fog, { a: 'center' }); return; }
    const led = phase === 'ledger' || phase === 'saidL' || phase === 'result';
    if (led) drawLedger(); else drawJars();
    G.roomHeader('5-4  THE CENSUS', C.mint, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, 'A jar holds a fixed number of cells, so each share leans on the rest. State a change against a reference, and name it.', true, rsel, 'START AGAIN', 'KEEP THE LEDGER');
      if (act === 'keep') keep(); else if (act === 'retry') restart();
      G.stars(250, y0 + 7, res.stars); T(slips + (slips === 1 ? ' SLIP' : ' SLIPS'), 310, y0 + 18, C.steel, { a: 'right' });
      return;
    }
    G.strip(y0);
    if (led) drawLedgerStrip(y0); else drawPumpStrip(y0);
    if (phase === 'intro') beats.draw();
    if (phase === 'said' || phase === 'saidL') say.draw();
  },
};

/* ---------- drawing ---------- */
/* one jar: glass, a lid, and the cell types in layers from the bottom up */
function jar(x, w, sh, o) {
  o = o || {};
  R(x - 1, JY - 1, w + 2, JH + 2, o.hot ? C.white : '#3d4868'); R(x, JY, w, JH, '#0a1024');
  let y = JY + JH;
  for (let k = 0; k < K; k++) { const h = Math.round(sh[k] * JH), top = k === K - 1 ? JY : y - h; R(x, top, w, y - top, COLS[k]); if (w > 6) R(x, top, w, 1, 'rgba(255,255,255,.35)'); y = top; }
  if (w > 6) { R(x + 1, JY, 2, JH, 'rgba(255,255,255,.16)'); R(x + 2, JY - 4, w - 4, 3, '#b9b3a2'); }
}
/* a wide jar for the average and a thin one for each of the six patients */
function group(x, w, g, v, label) {
  jar(x, w, J.mean[g][v]);
  for (let i = 0; i < TR().HALF; i++) jar(x + w + 3 + i * 5, 4, J.donors[g * TR().HALF + i][v]);
  T(label, x + (w + 33) / 2, JY + JH + 4, C.fog, { a: 'center' });
}
function key(x) {
  for (let k = 0; k < K; k++) {
    const y = 36 + (K - 1 - k) * 11, on = phase === 'pump' && k === sel;
    if (on) R(x - 4, y - 1, 42, 11, C.deep);
    R(x, y + 2, 5, 5, COLS[k]); T(TYPES[k].short, x + 8, y, on ? C.white : C.fog);
  }
}
function drawJars() {
  T('OTHER PATIENTS', 55, 17, '#6f8ff0', { a: 'center' }); T('RESPONDERS', 190, 17, C.coral, { a: 'center' }); R(109, 18, 1, 106, C.slate);
  group(X.nb, 14, 1, 0, 'BEFORE'); group(X.na, 14, 1, 1, 'AFTER');
  group(X.rb, 22, 0, 0, 'BEFORE'); group(X.ra, 22, 0, 1, 'AFTER');
  /* the copy, with the pump on its side, and the marks it has to reach: the layers of the "after" jar */
  const live = phase === 'pump', ok = gap() <= TR().TOL;
  jar(X.copy, 26, shown || J.mean[0][0], { hot: ok });
  T('COPY', X.copy + 13, JY + JH + 4, ok ? C.mint : C.white, { a: 'center' });
  let y = JY + JH;
  for (let k = 0; k < K - 1; k++) {
    y -= J.mean[0][1][k] * JH;
    R(X.copy + 26, Math.round(y), 6, 1, C.white); R(X.copy + 30, Math.round(y) - 1, 2, 3, C.white);
  }
  /* the pump: a handle that jumps when it is worked, and a hose to the layer in hand */
  let top = JY + JH; for (let k = 0; k < sel; k++) top -= (shown || J.mean[0][0])[k] * JH;
  const mid = Math.round(top - (shown || J.mean[0][0])[sel] * JH / 2), kick = G.t - squirt < 0.15 ? 2 : 0;
  R(X.copy - 14, 56 - kick, 8, 4, C.oil); R(X.copy - 11, 60 - kick, 2, 12 + kick, '#8a6c40'); R(X.copy - 15, 72, 10, 24, '#8a6c40'); R(X.copy - 14, 73, 8, 22, C.oil); R(X.copy - 14, 73, 2, 22, 'rgba(255,255,255,.4)');
  if (live) { G.line(X.copy - 5, 84, X.copy - 3, mid, COLS[sel]); R(X.copy - 3, mid - 1, 3, 3, COLS[sel]); }
  key(X.key);
}
function drawPumpStrip(y0) {
  const live = phase === 'pump', g = gap(), tol = TR().TOL, ok = g <= tol;
  T('PUMP', 10, y0 + 5, C.mist); T(TYPES[sel].name, 10, y0 + 14, COLS[sel], { f: 'smb' });
  T(fmtX(mult(sel)), 10, y0 + 24, C.white, { f: 'lg' });
  if (G.button('minus', 116, y0 + 10, 24, 24, '-', {}) && live) pump(-1);
  if (G.button('plus', 144, y0 + 10, 24, 24, '+', {}) && live) pump(1);
  /* how far the copy is from the "after" jar: the layer that is furthest off, in points of share */
  T('FURTHEST OFF', 180, y0 + 5, C.fog);
  const w = 62, v = Math.min(1, g / 0.12), num = (g * 100).toFixed(g < 0.1 ? 1 : 0);
  R(180, y0 + 17, w, 5, C.slate); R(180, y0 + 17, Math.round(w * v), 5, ok ? C.mint : C.amber); R(180 + Math.round(w * tol / 0.12), y0 + 15, 1, 9, C.white);
  T(num, 180, y0 + 26, ok ? C.mint : C.white, { f: 'smb' }); T('POINTS', 184 + Math.ceil(G.tw(num, 'smb')), y0 + 26, C.steel);
  if (G.button('match', 250, y0 + 8, 64, 28, 'IT MATCHES', { primary: true, focus: live }) && live) matched();
  T(G.kt('UP, DOWN: TYPE   LEFT, RIGHT: PUMP', 'TAP A CELL TYPE, THEN - OR +'), 10, y0 + 41, C.steel);
  /* more than one cell type moved: said plainly, because a match made that way is not the short account */
  if (pumps() > 1) T('MOVED: ' + pumps(), 312, y0 + 41, C.amber, { a: 'right' });
  if (live && ok && pumps() === 1) G.cue(282, y0 + 7, true);
}
function drawLedger() {
  /* the two jars the entry is about, and the book */
  jar(X.ra - 30, 22, J.mean[0][0]); T('BEFORE', X.ra - 19, JY + JH + 4, C.fog, { a: 'center' });
  jar(X.ra + 4, 22, J.mean[0][1]); T('AFTER', X.ra + 15, JY + JH + 4, C.fog, { a: 'center' });
  T('RESPONDERS', X.ra - 2, 17, C.coral, { a: 'center' });
  key(X.key - 16);
  const live = phase === 'ledger', x = 6, w = 172, led = shownRef >= 0 ? TR().ledger(shownRef) : null;
  R(x - 1, 15, w + 2, 112, '#3a2c1e'); R(x, 16, w, 110, '#e6dcc0'); R(x, 16, w, 16, '#cfc4a4');
  /* once entered, the page is headed by what every line is set against */
  T(led ? 'AGAINST ' + TYPES[shownRef].short : 'THE LEDGER', x + 5, 20, C.ink, { f: 'smb' }); if (!led) T('SHARE', x + 88, 20, '#6b5f4a', { a: 'center' }); T('MARK', x + 143, 20, '#6b5f4a', { a: 'center' });
  for (let k = 0; k < K; k++) {
    const y = 36 + k * 15, on = live && !onBtn && row === k, b = J.mean[0][0][k], a = J.mean[0][1][k];
    if (on) R(x + 1, y - 2, w - 2, 14, '#fff6d8');
    R(x + 5, y + 2, 5, 5, COLS[k]); T(TYPES[k].short, x + 13, y, C.ink);
    if (led) {
      /* after the entry: every cell type against the reference, as a log ratio with its interval */
      const e = led[k], mid = x + 80, px = 14;
      R(mid - 28, y + 4, 57, 1, '#b9ad8c'); R(mid, y + 1, 1, 7, '#6b5f4a');
      if (e.ref) { R(mid - 20, y, 41, 9, on ? '#fff6d8' : '#e6dcc0'); T('STEADY', mid, y, '#6b5f4a', { a: 'center' }); }
      else { const c = e.changed ? '#b0303a' : '#6b5f4a', lo = G.clamp(mid + Math.round(e.lo * px), mid - 28, mid + 28), hi = G.clamp(mid + Math.round(e.hi * px), mid - 28, mid + 28); R(lo, y + 4, hi - lo + 1, 1, c); R(G.clamp(mid + Math.round(e.mean * px), mid - 28, mid + 28) - 1, y + 2, 3, 5, c); }
    } else {
      T(TR().pc(b), x + 64, y, '#6b5f4a', { a: 'right' }); T(TR().pc(a), x + 101, y, C.ink, { a: 'right' });
      R(x + 68, y + 4, 9, 1, '#6b5f4a'); R(x + 75, y + 3, 1, 3, '#6b5f4a'); R(x + 77, y + 4, 1, 1, '#6b5f4a');
      /* a mark for a share that rose or fell by a point or more */
      const d = a - b; if (Math.abs(d) >= 0.01) for (let i = 0; i < 3; i++) R(x + 105 + i, d > 0 ? y + 5 - i : y + 2 + i, 5 - 2 * i, 1, d > 0 ? '#2e7a58' : '#b0303a');
    }
    /* the mark: nothing, CHANGED, or REFERENCE */
    const m = mark[k], mx = x + 115;
    if (m === CHANGED) { R(mx, y - 1, 55, 11, '#b0303a'); R(mx + 1, y, 53, 9, on ? '#fff6d8' : '#e6dcc0'); T('CHANGED', mx + 28, y, '#b0303a', { a: 'center' }); }
    else if (m === REF) { R(mx, y - 1, 55, 11, '#3d5a80'); T('REFERENCE', mx + 28, y, C.white, { a: 'center' }); }
    else R(mx + 6, y + 8, 43, 1, '#b9ad8c');
    if (on && Math.floor(G.t * 3) % 2 === 0) { for (let i = 0; i < 3; i++) R(x - 5 + i, y + 2 + i, 1, 5 - 2 * i, C.amber); }
  }
  if (led) { T('FEWER', x + 74, 113, '#6b5f4a', { a: 'right' }); T('MORE', x + 87, 113, '#6b5f4a'); } else { T('BEFORE', x + 66, 113, '#6b5f4a', { a: 'right' }); T('AFTER', x + 103, 113, '#6b5f4a', { a: 'right' }); }
}
function drawLedgerStrip(y0) {
  const live = phase === 'ledger', ref = refOf(), n = mark.filter(m => m === CHANGED).length;
  T('REFERENCE', 10, y0 + 5, C.mist); T(ref >= 0 ? TYPES[ref].name : 'NOT MARKED', 10, y0 + 14, ref >= 0 ? COLS[ref] : C.steel, { f: 'smb' });
  T('MARKED AS CHANGED', 110, y0 + 5, C.mist); T(String(n), 110, y0 + 14, C.white, { f: 'smb' });
  T(G.kt('UP, DOWN: LINE   LEFT, RIGHT: MARK', 'TAP A LINE TO CHANGE ITS MARK'), 10, y0 + 30, C.steel);
  T(G.kt('DOWN AT THE LAST LINE: THE BUTTON', ''), 10, y0 + 39, C.steel);
  if (G.button('enter', 228, y0 + 8, 86, 28, 'ENTER IT', { primary: true, focus: live && onBtn }) && live) { onBtn = true; enter(); }
  if (live && ref >= 0 && n > 0 && !onBtn) G.cue(271, y0 + 7, true);
}
})();
