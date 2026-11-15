/* The end of the Laundry: Vera, the group leader, with three study plans. None of them repeats a station. Each is a
   study design, and the question is the same every time: if the run is washed out, what goes
   with it? The player moves, splits or relabels tubes on a rack until the answer is "nothing".
   1. One condition on Monday, the other on Thursday: swap tubes until each run holds both.
   2. Nothing may change its day: split a sample over both runs (a bridging sample).
   3. Choose what to call the batch: the run cuts across the two conditions, the donor does not.
   The gauge is arithmetic on the rack: Cramer's V between the batch label and the condition.
   What the two conditions are, the pack of the cell system says (in blood, patients and controls).
   In the code they are P and C whatever they are called. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const RX = [10, 164], RY = 34, RW = 146, RH = 72, SLOT = 26, TAGS = ['RUN', 'DONOR', 'CONDITION'], DAYS = ['MONDAY', 'THURSDAY'];
const COL = { P: C.coral, C: C.mint };
const GRUNT = ['HM.', 'IF YOU MUST.', 'FINE.'];
/* the pack's words for the two conditions, taken on the way in: on a cap, in the key, under a tube, and in a sentence */
let W;

/* what Vera asks for, and what is said when the plan is right. A line that names the conditions is a function, read when it is said. */
const ORDERS = [
  { ask: [() => 'VERA: A study plan. Four ' + W.many[0] + ', run on Monday. Four ' + W.many[1] + ', run on Thursday. Wash the day out. I need it by Friday.',
    () => 'Before any wash, look at who was run when. Swap tubes until the day and the ' + W.what + ' can be told apart, then run it.'],
    won: () => 'Now each day holds ' + W.both + ' alike. Whatever the day did, it did to both, so it can be taken out.' },
  { ask: [() => W.days,
    'No tube can change its day. But a tube can be split: half is run now, and half is frozen for the other run.'],
    won: 'The same sample in both runs shows what the day alone does to it. That is a bridging sample.' },
  { ask: [() => 'VERA: Last one. Mixed over both days, the way you like it. I want to see what ' + W.asks + '.',
    () => 'VERA: No two ' + W.donors + ' are alike. So wash out the donor.',
    'Whatever is called the batch is washed out, and so is all that changes with it. Choose what to call the batch.'],
    won: () => 'The run cuts across ' + W.both + ', so it can go. The donor does not, so it stays in the map.' },
];

let phase, oi, tubes, foc, onBtn, hold, tag, slips, res, rsel, beats, tip, reply, wonT, nextId;

/* ---------- the rack ---------- */
function setup() {
  tubes = []; nextId = 0; hold = null; foc = 0; onBtn = false; tag = 1;
  const put = (donor, cond, run, slot, locked) => tubes.push({ id: nextId++, donor, cond, run, slot, locked: !!locked, half: false, twin: null });
  if (oi === 2) [[1, 'P', 0], [5, 'C', 0], [2, 'P', 0], [6, 'C', 0], [3, 'P', 1], [7, 'C', 1], [4, 'P', 1], [8, 'C', 1]].forEach((q, i) => put(q[0], q[1], q[2], i % 4));
  else for (let i = 0; i < 4; i++) { put(i + 1, 'P', 0, i, oi === 1); put(i + 5, 'C', 1, i, oi === 1); }
}
const order = () => tubes.slice().sort((a, b) => a.run - b.run || a.slot - b.slot);
/* what the machine would treat as one batch, for a tube */
const level = (t, k) => (k === 0 ? DAYS[t.run].slice(0, 3) : k === 1 ? 'D' + t.donor : W.tag[t.cond === 'P' ? 0 : 1]);
/* Cramer's V between a batch label and the condition: 1 when one tells you the other, 0 when it tells you nothing */
function tie(k) {
  const n = tubes.length, row = {}, col = { P: 0, C: 0 }, cell = {};
  tubes.forEach(t => { const g = level(t, k); row[g] = (row[g] || 0) + 1; col[t.cond]++; cell[g + t.cond] = (cell[g + t.cond] || 0) + 1; });
  let chi = 0; Object.keys(row).forEach(g => ['P', 'C'].forEach(c => { const e = row[g] * col[c] / n; if (e) chi += ((cell[g + c] || 0) - e) * ((cell[g + c] || 0) - e) / e; }));
  return Math.sqrt(chi / n);
}
const bridges = () => tubes.filter(t => t.twin !== null).length / 2;
const gauge = () => (oi === 1 ? bridges() : tie(oi === 2 ? tag : 0));

function act(t) {
  if (oi === 0) {
    if (!hold) { hold = t; G.sfx('blip'); return; }
    if (hold === t) { hold = null; G.sfx('tick'); return; }
    if (hold.run === t.run) { hold = t; G.sfx('tick'); return; }
    const r = hold.run, s = hold.slot; hold.run = t.run; hold.slot = t.slot; t.run = r; t.slot = s;
    /* the cursor stays on the tube that was just put down */
    foc = order().indexOf(hold); hold = null; G.sfx('drop'); lights();
    return;
  }
  if (oi === 1) {
    if (t.twin !== null) {
      /* putting a split sample back together */
      const other = tubes.find(q => q.id === t.twin), copy = t.locked ? other : t, orig = t.locked ? t : other;
      tubes = tubes.filter(q => q !== copy); orig.half = false; orig.twin = null; foc = order().indexOf(orig); G.sfx('tick'); lights();
      return;
    }
    if (tubes.some(q => q.run === 1 - t.run && q.slot === 4)) { G.sfx('bad'); return; }
    const copy = { id: nextId++, donor: t.donor, cond: t.cond, run: 1 - t.run, slot: 4, locked: false, half: true, twin: t.id };
    t.half = true; t.twin = copy.id; tubes.push(copy); foc = order().indexOf(t); G.sfx('drop'); lights();
  }
}
function lights() {
  for (let i = 0; i < 3; i++) G.book.goal('o' + (i + 1), i < oi || phase === 'result' ? true : null);
}
function submit() {
  G.state.tries.counter++; G.save(); hold = null;
  let why = null;
  if (oi === 0) { const v = tie(0); if (v > 0.99) why = 'Every ' + W.one + ' was run on Monday. Take Monday out and the ' + W.what + ' goes with it. No machine can tell the two apart.'; else if (v > 0.01) why = 'Better, but Monday still holds more ' + W.many[0] + ' than Thursday. Make the two runs alike.'; }
  else if (oi === 1) { if (!bridges()) why = 'Nothing has changed, so the day and the ' + W.what + ' are still one and the same. Split a sample over both runs.'; }
  else if (tag === 1) why = 'Each donor is ' + W.either + '. Take out what differs between donors, and the ' + W.what + ' goes too.';
  else if (tag === 2) why = 'That is the very difference the customer wants to see.';
  if (why) { slips++; G.sfx('bad'); tip = new G.Beats([{ say: why }]); return; }
  G.sfx('ok'); wonT = G.t; onBtn = false;
  reply = new G.Beats([{ say: ORDERS[oi].won }]); phase = 'reply';
  G.book.goal('o' + (oi + 1), true);
}
function next() {
  reply = null;
  if (oi < ORDERS.length - 1) { oi++; setup(); beats = new G.Beats(ORDERS[oi].ask.map(say => ({ say }))); phase = 'ask'; lights(); return; }
  res = { stars: slips === 0 ? 3 : slips === 1 ? 2 : 1 }; phase = 'result'; rsel = 1;
  ['k-bridge', 'k-multi', 'k-goal', 'k-meter'].forEach(n => G.book.unlock(n)); lights(); G.sfx('star');
}
function keep() {
  const s = G.state;
  s.rooms.counter = { done: true, stars: Math.max(s.rooms.counter.stars, res.stars) };
  G.save(); G.go('corridor', { from: 'counter', party: true });
}
function restart() { oi = 0; slips = 0; res = null; setup(); beats = new G.Beats(ORDERS[0].ask.map(say => ({ say }))); phase = 'ask'; lights(); }

function showBook() {
  /* where the project itself compares its conditions by a test, if it has a stage for that */
  const test = W.test, Many = W.many[0].charAt(0).toUpperCase() + W.many[0].slice(1);
  G.book.show({
    floor: 'The Laundry · The counter', room: 'Three study plans', aim: 'Vera has three study plans. Wash out the run without washing out the study.',
    file: 'js/stages/runs/counter.js',
    goals: [
      { id: 'o1', text: 'Plan 1: the run and the ' + W.what + ' can be told apart' },
      { id: 'o2', text: 'Plan 2: one sample is in both runs' },
      { id: 'o3', text: 'Plan 3: only the run is washed out' },
    ],
    notes: [
      { id: 'k-conf', open: true, html: 'Two things are <b>confounded</b> when they always change together. If every ' + W.one + ' was run on one day, no method can say whether a difference comes from the ' + W.what + ' or from the day. That is settled at the bench, before anything is sequenced.' },
      { id: 'k-bridge', html: 'A <b>bridging sample</b> is one sample split over several runs, or one reference sample added to every run. It shows what the run alone does, and afterwards it tests the correction: its cells should mix.' },
      { id: 'k-multi', html: 'The strongest design puts every sample in the same run. The cells are pooled, and the donors are told apart afterwards by their genotypes or by hashtag antibodies.' },
      { id: 'k-goal', html: 'What to call the batch depends on what the map is for. If it is only for finding shared cell types, each sample or donor is the usual batch. ' + Many + ' are then compared with ' + W.many[1] + ' by a test, not by eye on the corrected map' + (test ? ': that is ' + test : '') + '.' },
      { id: 'k-meter', html: 'The gauge is Cramér\'s V between the batch label and the condition: 100% when knowing one tells you the other, 0% when it tells you nothing.' },
    ],
    term: {
      title: 'Same check, in code',
      intro: 'One table, made <b>before</b> any correction: how many cells of each condition every run holds.',
      tabs: [
        { id: 'py', label: 'Python · pandas', html:
          '<pre class="code"><span class="k">import</span> pandas <span class="k">as</span> pd\n\n' +
          '<span class="c"># cells per run and condition. A zero is\n# a run that cannot be compared.</span>\n' +
          'pd.<span class="k">crosstab</span>(\n    adata.obs[<span class="s">"batch"</span>],\n    adata.obs[<span class="s">"condition"</span>],\n)\n\n' +
          '<span class="c"># donors per run and condition</span>\n' +
          'adata.obs.<span class="k">groupby</span>(\n    [<span class="s">"batch"</span>, <span class="s">"condition"</span>]\n)[<span class="s">"donor"</span>].<span class="k">nunique</span>()</pre>' },
        { id: 'r', label: 'R · Seurat', html:
          '<pre class="code"><span class="c"># cells per run and condition. A zero is\n# a run that cannot be compared.</span>\n' +
          '<span class="k">table</span>(obj$batch, obj$condition)\n\n' +
          '<span class="c"># donors per run and condition</span>\n' +
          'meta &lt;- <span class="k">unique</span>(obj@meta.data[,\n    c(<span class="s">"donor"</span>, <span class="s">"batch"</span>, <span class="s">"condition"</span>)])\n' +
          '<span class="k">table</span>(meta$batch, meta$condition)</pre>' },
      ],
    },
  });
}

G.scenes.counter = {
  phase: () => phase,
  dbg: { order: () => oi, tubes: () => order().map(t => ({ id: t.id, donor: t.donor, cond: t.cond, run: t.run, slot: t.slot, half: t.half })), foc: () => foc, onBtn: () => onBtn, tag: () => tag, gauge: () => gauge(), slips: () => slips,
    spot: i => { const t = order()[i]; return [RX[t.run] + 8 + t.slot * SLOT + 12, RY + 30]; } },
  enter() {
    oi = 0; slips = 0; res = null; rsel = 0; tip = null; reply = null; wonT = -9;
    W = G.sys.runs.counter;
    setup(); beats = new G.Beats(ORDERS[0].ask.map(say => ({ say }))); phase = 'ask';
    showBook(); lights();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'counter' }); return; }
    if (phase === 'ask') { if (beats.update(dt) === 'done') phase = 'play'; return; }
    if (phase === 'reply') { if (reply.update(dt) === 'done') next(); return; }
    if (phase === 'result') { const r = G.resultKeys(rsel, true); rsel = r.rsel; if (r.act === 'keep') keep(); else if (r.act === 'retry') restart(); return; }
    if (tip) { if (tip.update(dt) === 'done') tip = null; return; }
    const list = order(), n = oi === 2 ? TAGS.length : list.length;
    if (G.hit('down') && !onBtn) { onBtn = true; G.sfx('tick'); }
    if (G.hit('up') && onBtn) { onBtn = false; G.sfx('tick'); }
    if (!onBtn) {
      const d = (G.hit('right') ? 1 : 0) - (G.hit('left') ? 1 : 0);
      if (d) { if (oi === 2) { tag = G.clamp(tag + d, 0, n - 1); lights(); } else foc = G.clamp(foc + d, 0, n - 1); G.sfx('tick'); }
    }
    /* a tap on a tube is a move with it */
    if (G.ptr.pressed && oi < 2) list.forEach((t, i) => { const x = RX[t.run] + 8 + t.slot * SLOT; if (G.over(x, RY + 12, SLOT - 2, 46)) { foc = i; onBtn = false; act(t); } });
    if (G.act()) { if (onBtn) submit(); else if (oi === 2) { onBtn = true; G.sfx('tick'); } else act(list[foc]); }
  },
  draw() {
    R(0, 0, VW, VH, '#16101c');
    drawTop(); drawRacks();
    G.roomHeader('THE COUNTER', C.coral, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, 'VERA: Three plans, and you changed every one of them. The results will be right, I suppose. I shall tell the others.', true, rsel, 'START AGAIN', 'CLOSE THE TILL');
      if (act === 'keep') keep(); else if (act === 'retry') restart();
      G.stars(250, y0 + 7, res.stars); T(slips + (slips === 1 ? ' SLIP' : ' SLIPS'), 310, y0 + 18, C.steel, { a: 'right' });
      return;
    }
    G.strip(y0);
    /* the customer, and what the customer thinks of the last answer */
    G.face(10, y0 + 8, G.LOOKS.VERA, phase === 'ask'); T('VERA', 32, y0 + 6, C.fog);
    if (G.t - wonT < 2.5 && oi > 0 || phase === 'reply') { const g = GRUNT[phase === 'reply' ? oi : oi - 1], w = Math.ceil(G.tw(g, 'smb')) + 8; G.panel(32, y0 + 17, w, 13, { border: C.fog, fill: C.ink }); T(g, 36, y0 + 19, C.white, { f: 'smb' }); }
    const live = phase === 'play' && !tip;
    T(oi === 0 ? G.kt('ARROWS, SPACE: PICK UP, SWAP', 'TAP A TUBE, THEN ANOTHER') : oi === 1 ? G.kt('ARROWS, SPACE: SPLIT A TUBE', 'TAP A TUBE TO SPLIT IT') : G.kt('LEFT, RIGHT: CHOOSE', 'TAP WHAT TO WASH OUT'), 32, y0 + 34, C.steel);
    T(G.kt('DOWN: THE BUTTON', ''), 32, y0 + 42, C.steel);
    if (G.button('go', 214, y0 + 8, 98, 28, 'RUN THE WASH', { primary: true, focus: live && onBtn }) && live) submit();
    const ok = oi === 1 ? bridges() > 0 : gauge() < 0.01;
    if (live && ok) G.cue(263, y0 + 7, true);
    if (phase === 'ask') beats.draw();
    if (phase === 'reply') reply.draw();
    if (tip) tip.draw();
  },
};

function drawTop() {
  T('PLAN ' + (oi + 1) + ' OF 3', 10, 17, C.amber, { f: 'smb' });
  /* the gauge of the order in hand */
  const x = 150, w = 160, v = gauge();
  if (oi === 1) {
    T('SAMPLES IN BOTH RUNS', x, 15, C.fog); T(String(v), x + w, 13, v ? C.mint : C.coral, { a: 'right', f: 'smb' });
    for (let i = 0; i < 2; i++) R(x + i * 14, 26, 11, 4, i < v ? C.mint : C.slate);
    return;
  }
  T(oi === 2 ? 'CONDITION TIED TO BATCH' : 'CONDITION TIED TO RUN', x, 15, C.fog); T(Math.round(v * 100) + '%', x + w, 13, v < 0.01 ? C.mint : v > 0.99 ? C.coral : C.amber, { a: 'right', f: 'smb' });
  R(x, 26, w, 4, C.slate); R(x, 26, Math.round(w * v), 4, v > 0.99 ? C.coral : C.amber);
}
function tube(t, x, y, o) {
  const c = COL[t.cond];
  /* a cap in the colour of the condition, glass, and as much sample as the tube holds */
  R(x + 6, y, 12, 4, c); R(x + 7, y + 4, 10, 26, 'rgba(255,255,255,.16)'); R(x + 7, y + 29, 10, 1, 'rgba(255,255,255,.3)');
  const fill = t.half ? 9 : 18; R(x + 8, y + 29 - fill, 8, fill, c); R(x + 8, y + 29 - fill, 8, 1, 'rgba(255,255,255,.5)');
  T(W.caps[t.cond === 'P' ? 0 : 1], x + 12, y + 13, t.half ? C.paper : C.ink, { a: 'center', f: 'smb' });
  if (t.locked) { R(x + 9, y + 34, 7, 5, C.oil); R(x + 10, y + 31, 5, 4, C.oil); R(x + 11, y + 32, 3, 3, '#231a2c'); R(x + 12, y + 36, 1, 2, C.ink); }
  T(o.label, x + 12, y + 42, o.dim ? C.steel : C.fog, { a: 'center' });
  if (o.focus) G.corners([x + 3, y - 3, 17, 52], Math.floor(G.t * 4) % 2 ? C.white : C.fog);
  if (o.held) { G.corners([x + 3, y - 3, 17, 52], C.amber); R(x + 6, y - 6, 12, 2, C.amber); }
}
function drawRacks() {
  const list = order(), live = phase === 'play' && !tip;
  RX.forEach((x, r) => {
    G.panel(x, RY, RW, RH, { border: C.slate, fill: '#0e1630' });
    T('RUN ' + (r + 1), x + 6, RY + 3, C.white, { f: 'smb' }); T(DAYS[r], x + RW - 6, RY + 3, G.loads.COLS[r], { a: 'right' });
    for (let s = 0; s < 5; s++) R(x + 8 + s * SLOT + 6, RY + 46, 12, 2, C.slate);
  });
  /* a split sample is joined to its other half */
  tubes.filter(t => t.twin !== null && t.locked).forEach(t => {
    const o = tubes.find(q => q.id === t.twin), ax = RX[t.run] + 8 + t.slot * SLOT + 12, bx = RX[o.run] + 8 + o.slot * SLOT + 12, y = RY + 15;
    G.line(ax, y, ax, y - 2, C.white); G.line(ax, y - 2, bx, y - 2, C.white); G.line(bx, y - 2, bx, y, C.white);
  });
  list.forEach((t, i) => tube(t, RX[t.run] + 8 + t.slot * SLOT, RY + 16, { label: oi === 2 ? level(t, tag) : 'D' + t.donor, focus: live && !onBtn && oi < 2 && i === foc, held: hold === t }));
  /* what the caps mean, and in the last order the choice of batch */
  const y = RY + RH + 5;
  if (oi === 2) {
    T('WASH OUT', 10, y + 4, C.mist);
    TAGS.forEach((name, k) => {
      const bx = 72 + [0, 44, 100][k], bw = [40, 52, 76][k];
      if (G.button('tag' + k, bx, y, bw, 16, name, { focus: live && !onBtn && tag === k, accent: C.amber, fill: C.deep, primary: tag === k }) && live) { tag = k; onBtn = false; lights(); }
    });
    return;
  }
  R(10, y + 5, 6, 4, COL.P); T(W.key[0], 20, y + 3, C.fog); R(66, y + 5, 6, 4, COL.C); T(W.key[1], 76, y + 3, C.fog);
  if (oi === 1) { R(124, y + 4, 7, 5, C.oil); R(125, y + 1, 5, 4, C.oil); R(126, y + 2, 3, 3, '#16101c'); T('CANNOT CHANGE ITS DAY', 136, y + 3, C.fog); }
}
})();
