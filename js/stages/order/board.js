/* The end of the Marshalling Yard: the departure board. Vera wants the order of events for the group
   meeting, with times. The player slides a plate for each kind of cell on to a rail: four rails
   for the line, in order, and a siding for what does not stand on it. Beside each rail a flap is
   turned to a gene those cells carry. Then the signal is pulled, and the yard checks the board
   itself: a wagon runs down the rails in the order of the line, each flap is held against where
   its gene is made, and lamps light for what was found. Vera then asks for the times, and the
   lesson of this scene is the answer: the board can carry an order, and no durations.
   The finished board is kept in the save, row by row.
   Every check is worked out from the cells (see line.sequence, line.home, line.joined). */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const BX = 8, BY = 16, BW = 190, BH = 110, RYS = [31, 45, 59, 73, 95], TY = 111, PXS = BX + 16, PWD = 104, FX = BX + 124, FW = 56, RX = 204, RW = 108, RACKY = 31, STEP = 0.32, PUSHX = [36, 176], PUSHW = 132;
const IRON = '#565b68', CREAM = '#e6dcc0', RED = '#c8413c';
const L = () => G.lineage;

let phase, beats, say, after, W, ST, rail, rack, flap, flipT, hold, col, row, slide, run, lampT, timeTag, psel, pushT, slips, orderSlip, geneSlip, timeSlip, shake, res, rsel;

const NR = 5, SIGNAL = 5;
const full = () => rail.every(s => s >= 0) && flap.every(f => f >= 0);
const gene = r => W.genes[flap[r]];
const cleared = () => phase === 'lamps' || phase === 'push' || phase === 'result' || (phase === 'said' && (after === 'push' || after === 'result'));
/* the board, row by row, as it will be quoted */
function lines() {
  const out = [];
  for (let r = 0; r < 4; r++) { const s = ST[rail[r]].name + ', ' + gene(r) + '. ORDER: SUPPORTED'; out.push(s.length <= 42 ? (r + 1) + ' ' + s : s); }
  out.push(ST[rail[4]].name + ', ' + gene(4) + '. NOT ON THIS LINE');
  out.push('DIRECTION: CHECKED AGAINST AGE'); out.push('DURATION: UNKNOWN');
  return out.map(s => s.slice(0, 44));
}

/* ---------- plates and flaps ---------- */
const railAt = r => [PXS, RYS[r]], rackAt = i => [RX + 2, RACKY + i * 14];
function act() {
  if (row === SIGNAL) { pull(); return; }
  if (col === 1) { flap[row] = (flap[row] + 1) % W.genes.length; flipT[row] = G.t; G.sfx('tick'); return; }
  if (col === 2) {
    /* the rack: take a plate, or put the one in hand back */
    const s = rack[row];
    if (hold < 0) { if (s < 0) { G.sfx('tick'); return; } hold = s; rack[row] = -1; G.sfx('blip'); const free = rail.indexOf(-1); col = 0; row = free >= 0 ? free : 0; return; }
    rack[row] = hold; hold = s; G.sfx('drop'); return;
  }
  /* a rail: slide the plate in hand on to it, or lift the plate that is there */
  const s = rail[row];
  if (hold < 0) { if (s < 0) { G.sfx('tick'); return; } hold = s; rail[row] = -1; G.sfx('blip'); return; }
  rail[row] = hold; slide = { s: hold, r: row, t: G.t }; hold = -1; G.sfx('drop');
  if (s >= 0) rack[rack.indexOf(-1)] = s;
  const next = rack.findIndex(v => v >= 0); if (next >= 0) { col = 2; row = next; } else if (flap[row] < 0) col = 1;
}

/* ---------- the yard checks the board ---------- */
/* the first thing on the board that the yard does not bear out, or null */
function fault() {
  const seq = L().sequence().order, word = s => ST[s].word;
  for (let r = 0; r < 4; r++) if (rail[r] !== seq[r]) {
    const back = [0, 1, 2, 3].every(k => rail[k] === seq[3 - k]);
    return { rail: r, why: back ? 'The wagon will not start. This is the line read from its far end, and the root was set among the ' + word(seq[0]) + '.'
      : rail[r] === L().APART ? W.apart : 'The wagon stopped at rail ' + (r + 1) + '. On the line that was laid, a different island comes next.' };
  }
  for (let r = 0; r < NR; r++) {
    const m = L().marks(gene(r), rail[r]);
    if (!m.ok) return { rail: r, gene: true, why: m.shared ? gene(r) + ' will not do for ' + word(rail[r]) + ': ' + word(m.best) + ' carry more of it. Choose a gene to know them by.' : gene(r) + ' does not belong with ' + word(rail[r]) + '. Its lamp was lit elsewhere.' };
  }
  return null;
}
function pull() {
  if (hold >= 0 || !full()) { G.sfx('bad'); tell('A rail is still empty, or a flap is still blank. The signal stays at danger until the board is full.', 'play'); return; }
  G.state.tries.board++; G.save();
  const f = fault(); run = { t: 0, fail: f, upto: f && !f.gene ? f.rail : 4 }; phase = 'run'; G.sfx('door');
}
function ran() {
  const f = run.fail;
  if (f) { slips++; if (f.gene) geneSlip = true; else orderSlip = true; shake = { rail: f.rail, gene: !!f.gene, t: G.t }; G.sfx('bad'); lights(); row = f.rail; col = f.gene ? 1 : 0; tell(f.why, 'play'); return; }
  phase = 'lamps'; lampT = G.t; G.sfx('ok'); lights();
}
function answer(k) {
  timeTag = true;
  if (k === 1) { slips++; timeSlip = true; G.sfx('bad'); lights(); say = new G.Beats([{ say: W.why }, { say: W.gave }]); after = 'result'; phase = 'said'; return; }
  G.sfx('ok'); say = new G.Beats([{ say: W.held }]); after = 'result'; phase = 'said';
}
function tell(text, next) { say = new G.Beats([{ say: text }]); after = next; phase = 'said'; }
function advance() {
  say = null;
  if (after === 'push') { phase = 'push'; psel = -1; pushT = G.t; return; }
  if (after === 'result') { res = { stars: slips === 0 ? 3 : slips === 1 ? 2 : 1 }; phase = 'result'; rsel = 1; ['b-not', 'b-real'].forEach(id => G.book.unlock(id)); lights(); G.sfx('star'); return; }
  run = null; phase = 'play';
}
function lights() {
  const ok = cleared() || phase === 'result';
  G.book.goal('order', orderSlip ? false : ok ? true : null);
  G.book.goal('genes', geneSlip ? false : ok ? true : null);
  G.book.goal('time', timeSlip ? false : phase === 'result' ? true : null);
}
function keep() {
  const s = G.state;
  s.yard = Object.assign({}, s.yard, { lines: lines(), root: (s.yard && s.yard.root) || G.sys.order.turntable.stem });
  s.rooms.board = { done: true, stars: Math.max(s.rooms.board.stars, res.stars) };
  G.save(); G.go('corridor', { from: 'board', party: true });
}
function reset() {
  rail = new Array(NR).fill(-1); rack = W.plates.slice(); flap = new Array(NR).fill(-1); flipT = new Array(NR).fill(-9); hold = -1; col = 2; row = 0; slide = null; run = null; timeTag = false; shake = null; psel = -1;
}
function restart() { slips = 0; orderSlip = geneSlip = timeSlip = false; res = null; reset(); phase = 'play'; lights(); }

function showBook() {
  G.book.show({
    floor: 'The Marshalling Yard · Departures', room: 'The departure board', aim: 'Vera wants the order of events, with times. Put on the board what the yard found, and no more.',
    file: 'js/stages/order/board.js',
    goals: [
      { id: 'order', text: 'The cells of the line stand in order, and the rest stand apart' },
      { id: 'genes', text: 'Every rail shows a gene that its cells carry' },
      { id: 'time', text: 'The board gives an order, and claims no times' },
    ],
    notes: [
      { id: 'b-say', open: true, html: 'A trajectory supports statements of <b>order</b>: which state comes before which, and which genes change on the way.' },
      { id: 'b-not', html: 'It does not support durations or rates, and it says nothing of single cells: not "this cell will become that one". Those need time points, labelled RNA or lineage tracing.' },
      { id: 'b-real', html: 'The cells of this project are invented, and their line is tidier than a real one. In real tissue the states overlap, some radial glia make neurons without an intermediate progenitor, and one cluster can hold cells of several lineages.' },
    ],
    term: null, termNote: 'No code in this room. What a trajectory is said to show is decided by the people who present it.',
  });
}

G.scenes.board = {
  phase: () => phase,
  dbg: { rails: () => rail.slice(), rack: () => rack.slice(), flaps: () => flap.slice(), hold: () => hold, cur: () => [col, row], slips: () => slips, genes: () => W.genes.slice(), lines: () => (full() ? lines() : []),
    /* what the yard bears out: the state for each rail, and for each rail the flaps that would pass */
    right: () => { const seq = L().sequence().order.concat([L().APART]); return { states: seq, flaps: seq.map(s => W.genes.map((g, k) => k).filter(k => L().marks(W.genes[k], s).ok)) }; },
    spot: (what, k) => (what === 'rack' ? [RX + 54, RACKY + k * 14 + 6] : what === 'rail' ? [PXS + 50, RYS[k] + 6] : what === 'flap' ? [FX + 28, RYS[k] + 6] : what === 'pull' ? [262, 152] : [PUSHX[k] + PUSHW / 2, 159]) },
  enter() {
    W = G.sys.order.board; ST = G.sys.order.states;
    slips = 0; orderSlip = geneSlip = timeSlip = false; res = null; rsel = 0; say = null; after = null; reset();
    L().build(); L().sequence();
    beats = new G.Beats(W.ask.map(s => ({ say: s })));
    phase = G.state.tries.board > 0 ? 'play' : 'ask';
    showBook(); lights();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'board' }); return; }
    if (phase === 'ask') { if (beats.update(dt) === 'done') phase = 'play'; return; }
    if (phase === 'said') { if (say.update(dt) === 'done') advance(); return; }
    if (phase === 'run') { run.t += dt; if (run.t >= (run.upto + 1) * STEP) ran(); return; }
    if (phase === 'lamps') { if (G.t - lampT > 2.6) { say = new G.Beats(W.push.map(s => ({ say: s }))); after = 'push'; phase = 'said'; } return; }
    if (phase === 'push') {
      const d = (G.hit('right') || G.hit('down') ? 1 : 0) - (G.hit('left') || G.hit('up') ? 1 : 0);
      if (d) { psel = psel < 0 ? 0 : G.clamp(psel + d, 0, 1); G.sfx('tick'); }
      if (G.act() && psel >= 0) answer(psel);
      return;
    }
    if (phase === 'result') { const r = G.resultKeys(rsel, true); rsel = r.rsel; if (r.act === 'keep') keep(); else if (r.act === 'retry') restart(); return; }
    if (G.hit('down')) { row = Math.min(SIGNAL, row + 1); G.sfx('tick'); }
    if (G.hit('up')) { row = Math.max(0, row - 1); G.sfx('tick'); }
    if (row < SIGNAL) { if (G.hit('right')) { col = Math.min(2, col + 1); G.sfx('tick'); } if (G.hit('left')) { col = Math.max(0, col - 1); G.sfx('tick'); } }
    if (G.ptr.pressed) {
      for (let r = 0; r < NR; r++) {
        if (G.over(PXS - 2, RYS[r] - 1, PWD + 4, 14)) { col = 0; row = r; act(); return; }
        if (G.over(FX - 2, RYS[r] - 1, FW + 4, 14)) { col = 1; row = r; act(); return; }
        if (G.over(RX, RACKY + r * 14 - 1, RW, 14)) { col = 2; row = r; act(); return; }
      }
    }
    if (G.act()) act();
  },
  draw() {
    R(0, 0, VW, VH, '#0f1118');
    drawBoard(); drawSide();
    G.roomHeader('DEPARTURES', C.coral, true);
    const y0 = 130;
    if (phase === 'result') {
      const act2 = G.resultDraw(y0, W.done, true, rsel, 'START AGAIN', 'HANG IT UP');
      if (act2 === 'keep') keep(); else if (act2 === 'retry') restart();
      G.stars(250, y0 + 7, res.stars); T(slips + (slips === 1 ? ' SLIP' : ' SLIPS'), 310, y0 + 18, C.steel, { a: 'right' });
      return;
    }
    G.strip(y0);
    G.face(10, y0 + 8, G.LOOKS.VERA, phase === 'ask'); T('VERA', 32, y0 + 6, C.fog);
    if (phase === 'push') {
      /* Vera's question is answered in the strip, with the board still in view above it */
      T('WANTS TIMES ON THE BOARD', 64, y0 + 6, C.white); T(G.kt('LEFT, RIGHT: CHOOSE', ''), 312, y0 + 6, C.steel, { a: 'right' });
      W.pushOpts.forEach((o, i) => { if (G.button('push' + i, PUSHX[i], y0 + 19, PUSHW, 22, o, { focus: psel === i }) && G.t - pushT > 0.4) answer(i); });
      return;
    }
    const live = phase === 'play';
    T(G.kt('ARROWS: MOVE', 'TAP A PLATE, THEN A RAIL.'), 32, y0 + 18, C.steel); T(G.kt('SPACE: PLATE OR FLAP', 'TAP A FLAP TO TURN IT.'), 32, y0 + 27, C.steel);
    if (G.button('pull', 212, y0 + 8, 100, 28, 'PULL THE SIGNAL', { primary: true, focus: live && row === SIGNAL, disabled: !full() || hold >= 0 }) && live) { row = SIGNAL; pull(); }
    if (live && full() && hold < 0 && row !== SIGNAL) G.cue(262, y0 + 7, true);
    if (phase === 'ask') beats.draw();
    if (phase === 'said') say.draw();
  },
};

/* ---------- drawing ---------- */
/* an enamel plate with the name of a kind of cell */
function plate(x, y, s, o) {
  o = o || {};
  R(x, y, PWD, 12, o.hot ? C.amber : '#3a2c1e'); R(x + 1, y + 1, PWD - 2, 10, CREAM); R(x + 1, y + 1, PWD - 2, 1, '#fff6d8');
  R(x + 1, y + 10, PWD - 2, 1, '#cfc4a4');
  T(ST[s].name, x + Math.round(PWD / 2), y + 1, C.ink, { a: 'center' });
}
function drawBoard() {
  const live = phase === 'play', ok = cleared();
  R(BX - 1, BY - 1, BW + 2, BH + 2, C.slate); R(BX, BY, BW, BH, '#10131c');
  T('DEPARTURES', BX + 5, BY + 3, C.amber, { f: 'smb' }); T('GENE', FX + 2, BY + 3, C.steel);
  /* the signal on the board: at danger until the yard has borne the board out */
  R(BX + BW - 8, BY + 2, 2, 11, IRON);
  if (ok) { G.line(BX + BW - 8, BY + 4, BX + BW - 17, BY + 11, C.paper); G.line(BX + BW - 8, BY + 5, BX + BW - 17, BY + 12, C.paper); R(BX + BW - 6, BY + 8, 4, 4, C.mint); }
  else { R(BX + BW - 19, BY + 3, 12, 3, RED); R(BX + BW - 16, BY + 3, 2, 3, C.paper); R(BX + BW - 6, BY + 8, 4, 4, Math.floor(G.t * 2) % 2 ? RED : '#7a2a28'); }
  T('SIDING', BX + 5, 86, C.steel); G.hdash(BX + 46, BX + BW - 6, 90, '#2a3350', 3, 3);
  for (let r = 0; r < NR; r++) {
    const y = RYS[r], s = rail[r], jig = shake && shake.rail === r && G.t - shake.t < 0.45 ? Math.round(Math.sin(G.t * 60)) : 0;
    if (r < 4) T(String(r + 1), BX + 5, y + 1, C.amber, { f: 'smb' });
    R(PXS - 2, y + 12, PWD + FW + 12, 1, IRON);
    /* the plate on this rail, or the empty rail */
    const sliding = slide && slide.r === r && G.t - slide.t < 0.2, at = live && row === r && col === 0;
    if (s >= 0 && !sliding) plate(PXS + (shake && !shake.gene ? jig : 0), y, s, { hot: at });
    else { R(PXS, y, PWD, 12, at ? C.amber : '#2a3350'); R(PXS + 1, y + 1, PWD - 2, 10, '#151a2c'); for (let k = 0; k < 3; k++) R(PXS + 46 + k * 6, y + 5, 2, 2, C.steel); }
    if (sliding) { const f = (G.t - slide.t) / 0.2; plate(Math.round(G.lerp(RX + 2, PXS, f)), y, s); }
    /* the flap: a gene, or blank. It closes for a moment as it turns. */
    const fa = live && row === r && col === 1, turn = G.t - flipT[r] < 0.12, fx = FX + (shake && shake.gene ? jig : 0);
    R(fx, y, FW, 12, fa ? C.amber : '#05060a'); R(fx + 1, y + 1, FW - 2, 10, '#0b0d14');
    if (turn) R(fx + 1, y + 4, FW - 2, 4, '#2a2d36');
    else if (flap[r] >= 0) T(gene(r), fx + Math.round(FW / 2), y + 1, C.amber, { a: 'center', f: 'smb' }); else for (let k = 0; k < 3; k++) R(fx + 20 + k * 7, y + 5, 2, 2, '#4a4424');
    R(fx + 1, y + 6, FW - 2, 1, 'rgba(0,0,0,.45)');
    /* a lamp at the end of the rail: lit by the yard's wagon as it comes down the line */
    const passed = ok || (run && run.t >= (r + 1) * STEP && r < run.upto), stuck = run && run.fail && !run.fail.gene && r === run.fail.rail && run.t >= r * STEP;
    R(BX + BW - 6, y + 4, 4, 4, r < 4 ? (stuck ? RED : passed ? C.mint : '#2a3350') : ok ? C.amber : '#2a3350');
  }
  /* the wagon that checks the line, on its way down the rails */
  if (run && phase === 'run') { const k = Math.min(run.upto, Math.floor(run.t / STEP)), wy = RYS[Math.min(3, k)] + 2, jig = run.fail && !run.fail.gene && k >= run.upto ? Math.round(Math.sin(G.t * 50)) : 0; R(BX + 3 + jig, wy, 9, 7, C.ink); R(BX + 4 + jig, wy + 1, 7, 5, C.paper); }
  /* the time between stops: empty until Vera has had her answer */
  const tx = BX + 34, tw = BW - 42;
  T('TIME', BX + 5, TY + 2, C.steel);
  if (timeTag) { R(tx, TY, tw, 12, '#3a2c1e'); R(tx + 1, TY + 1, tw - 2, 10, CREAM); T('DURATION: UNKNOWN', tx + Math.round(tw / 2), TY + 1, C.ink, { a: 'center', f: 'smb' }); }
  else { R(tx, TY, tw, 12, phase === 'push' && Math.floor(G.t * 3) % 2 ? C.amber : '#2a3350'); R(tx + 1, TY + 1, tw - 2, 10, '#151a2c'); }
  if (live && hold >= 0 && col === 0 && row < NR && Math.floor(G.t * 3) % 2 === 0) for (let k = 0; k < 3; k++) R(PXS - 6 + k, RYS[row] + 3 + k, 1, 5 - 2 * k, C.amber);
}
/* beside the board: the rack of plates, and once the signal has cleared, what the yard found */
function drawSide() {
  const live = phase === 'play';
  G.panel(RX - 2, 14, RW + 4, 114, { border: C.slate, fill: '#0e1630' });
  if (cleared()) {
    const t = phase === 'lamps' ? G.t - lampT : 9, seqOk = true, off = !L().joined(L().APART), dir = L().byProgress().every((s, k) => s === k);
    T('THE YARD FOUND', RX + 4, 17, C.mist);
    [[['ORDER:', 'SUPPORTED'], seqOk, 0.3], [['NOT ON', 'THIS LINE'], off, 1], [['DIRECTION:', 'CHECKED', 'AGAINST AGE'], dir, 1.7]].forEach((q, i) => {
      const y = 30 + i * 22, on = q[1] && t >= q[2];
      R(RX + 4, y + 3, 9, 9, C.ink); R(RX + 5, y + 4, 7, 7, on ? (i === 1 ? C.amber : C.mint) : '#2a3350');
      q[0].forEach((s, k) => T(s, RX + 18, y + k * 9, on ? C.white : C.steel));
    });
    R(RX + 2, 106, RW - 4, 1, C.slate);
    T(timeTag ? 'DURATION: UNKNOWN' : 'TIME: NOT YET SAID', RX + 4, 112, timeTag ? C.white : C.steel);
    return;
  }
  T('PLATES', RX + 4, 17, C.mist);
  for (let i = 0; i < NR; i++) {
    const p = rackAt(i), at = live && col === 2 && row === i;
    if (rack[i] >= 0) plate(p[0], p[1], rack[i], { hot: at });
    else { R(p[0], p[1], PWD, 12, at ? C.amber : '#1c2748'); R(p[0] + 1, p[1] + 1, PWD - 2, 10, '#0e1630'); }
  }
  if (hold >= 0) { T('IN HAND', RX + 4, 104, C.amber); plate(RX + 2, 113, hold); }
}
})();
