/* The end of the Weigh House: the read-out. Vera wants one sentence for the clinic, and the player
   builds it from tiles in five slots: who, when, which cells, what they do, and the word that ties
   it to response. Each part is checked against the samples, with the tests the stations used: a
   change in number against a reference (the Census), a change in a gene for everyone or for
   responders only (the Formula bench), a claim that was one donor's doing (the Scales). The last
   word is the lesson of this scene: goes with, not predicts and not causes. Vera pushes for the
   stronger word, and Amara holds the line. The finished sentence is kept in the save.
   Which tiles there are, and what they stand for, the pack of the cell system says. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const SX = 204, SW = 110, SHEET = [8, 16, 190, 110], ROWY = [22, 42, 62, 82, 102], PUSHX = [36, 182], PUSHW = 132;
const TR = () => G.trial;

let phase, beats, say, after, pick, foc, slips, res, rsel, W, SLOTS, TYPES, facts, pushed, psel, pushT, trueSlip, tieSlip, shake;

const opt = i => (pick[i] < 0 ? null : SLOTS[i].opts[pick[i]]);
const full = () => pick.every(p => p >= 0);
const by = id => opt(SLOTS.findIndex(s => s.id === id));
/* the sentence as it will be quoted: who, when, which cells, what they do, and what that has to do with response */
const sentence = () => { const o = SLOTS.map((s, i) => opt(i).s); return 'In ' + o[0] + ', ' + o[1] + ', ' + o[2] + ' ' + o[3] + '. This ' + o[4] + ' response.'; };
const KIND = { stamp: C.oil, gene: C.cyan, number: C.mint };

/* ---------- what the samples support ---------- */
/* For one tile of the "do" slot in one cell type: does it happen in responders, in the other
   patients, and was it there before treatment. Worked out from the samples each time. */
function evidence(what, cells) {
  const t = TR(), a = t.ALPHA;
  if (what.kind === 'number') {
    /* against a steady cell type: the one in the player's ledger, or the first that one pump leaves alone */
    const moved = t.moved(), saved = G.state.weigh && G.state.weigh.ref;
    let ref = saved !== undefined && saved !== null && moved.indexOf(saved) < 0 && saved !== cells.type ? saved : -1;
    if (ref < 0) for (let k = 0; k < t.jars().K; k++) if (moved.indexOf(k) < 0 && k !== cells.type) { ref = k; break; }
    const led = t.ledger(ref)[cells.type], oth = t.others(cells.type, ref), dir = what.dir;
    return { resp: led.changed && Math.sign(led.mean) === dir, rest: oth.p < a && Math.sign(oth.mean) === dir, stood: false, number: true, opposite: led.changed && Math.sign(led.mean) !== dir };
  }
  if (what.kind === 'stamp') return { stamp: true, holds: t.claim(what.claim).holds };
  /* a gene, on the formula bench: with visit:response in, visit is the other patients and the two together are the responders */
  const inter = t.fit(what.set, what.gene, ['donor', 'visit', 'vr']), pair = t.fit(what.set, what.gene, ['donor', 'visit']), loose = t.fit(what.set, what.gene, ['visit', 'response']);
  const only = inter.fx.vr.clear && inter.fx.vr.est > 0, every = pair.fx.visit.clear && pair.fx.visit.est > 0 && !inter.fx.vr.clear;
  return { resp: only || every, rest: every, stood: loose.fx.response.clear && !inter.fx.vr.clear };
}
/* The first part of the sentence that does not hold, and why; null when all of it holds. */
function judge() {
  const who = by('who'), when = by('when'), cells = by('cells'), what = by('do'), tie = by('tie'), e = evidence(what, cells);
  if (e.stamp && !e.holds) return { slot: 'do', why: "That claim was weighed at the scales, and it was a few donors' doing." };
  if (what.type !== undefined && what.type !== cells.type) return { slot: 'cells', why: 'That was weighed in ' + TYPES[what.type].word + ', not in ' + TYPES[cells.type].word + '.' };
  if (e.opposite) return { slot: 'do', why: 'The ledger has it the other way round.' };
  if (!e.resp && !e.rest) return { slot: 'do', why: e.number ? 'Against the reference, ' + TYPES[cells.type].word + ' kept their number. Their share fell because a jar is full.' : 'That is not on the books.' };
  if (who.id === 'resp' && e.rest) return { slot: 'who', why: 'It happened in the other patients as well. Say "responders", and the clinic will hear a difference that is not there.' };
  if (who.id === 'all' && !e.rest) return { slot: 'who', why: 'The other patients show no such change. It belongs to the responders.' };
  if (when.id === 'both' && !e.stood) return { slot: 'when', why: 'Before treatment the two groups were alike in this. The change came after.' };
  if (who.id === 'all') return { slot: 'who', why: 'That is true, and true of every patient. So it cannot say why six of them responded.' };
  if (tie.id === 'pred') return { slot: 'tie', why: PRED };
  if (tie.id === 'cause') return { slot: 'tie', why: 'Nobody made this happen in a patient to see what followed. Seen together is all this study can say.' };
  return null;
}
const PRED = 'A predictor is tested on patients it has never seen. These twelve are the patients the finding came from.';

function hand() {
  if (!full()) { G.sfx('bad'); return; }
  G.state.tries.readout++; G.save();
  const bad = judge();
  if (bad) {
    slips++; if (bad.slot === 'tie') tieSlip = true; else trueSlip = true; shake = { slot: bad.slot, t: G.t }; G.sfx('bad'); lights();
    foc = SLOTS.findIndex(s => s.id === bad.slot); tell(bad.why, false); return;
  }
  /* every word holds. Vera wants a stronger last word. */
  G.sfx('ok'); G.book.goal('true', !trueSlip);
  say = new G.Beats(W.push.map(s => ({ say: s }))); after = 'push'; phase = 'said';
}
function answer(k) {
  if (k === 1) {
    /* the player gives in: the word goes in, Amara takes it out again */
    slips++; tieSlip = true; pushed = true; G.sfx('bad'); lights();
    say = new G.Beats([{ say: 'AMARA: ' + PRED }, { say: W.gave }]); after = 'result'; phase = 'said'; return;
  }
  G.sfx('ok'); say = new G.Beats([{ say: W.held }]); after = 'result'; phase = 'said';
}
function tell(text, next) { say = new G.Beats([{ say: text }]); after = next; phase = 'said'; }
function advance() {
  say = null;
  /* neither answer is in hand when Vera asks: the player has to choose one */
  if (after === 'push') { phase = 'push'; psel = -1; pushT = G.t; return; }
  if (after === 'result') { res = { stars: slips === 0 ? 3 : slips === 1 ? 2 : 1 }; phase = 'result'; rsel = 1; ['o-pred', 'o-cause', 'o-real'].forEach(id => G.book.unlock(id)); lights(); G.sfx('star'); return; }
  phase = 'play';
}
function lights() {
  const done = phase === 'result';
  G.book.goal('true', trueSlip ? false : done || phase === 'push' ? true : null);
  G.book.goal('tie', tieSlip ? false : done ? true : null);
}
function keep() {
  const s = G.state;
  s.weigh = Object.assign({}, s.weigh, { sentence: sentence() });
  s.rooms.readout = { done: true, stars: Math.max(s.rooms.readout.stars, res.stars) };
  G.save(); G.go('corridor', { from: 'readout', party: true });
}
function restart() { pick = SLOTS.map(() => -1); foc = 0; slips = 0; res = null; trueSlip = tieSlip = false; pushed = false; phase = 'play'; lights(); }
function cycle(i, d) { const n = SLOTS[i].opts.length; pick[i] = pick[i] < 0 ? (d > 0 ? 0 : n - 1) : (pick[i] + d + n) % n; G.sfx('tick'); }

function showBook() {
  G.book.show({
    floor: 'The Weigh House · The read-out', room: 'One sentence', aim: 'Vera wants one sentence for the clinic. Build one that the books support, and no stronger.',
    file: 'js/stages/changes/readout.js',
    goals: [
      { id: 'true', text: 'Every part of the sentence is on the books' },
      { id: 'tie', text: 'The last word claims no more than was tested' },
    ],
    notes: [
      { id: 'o-assoc', open: true, html: 'An <b>association</b> is two things seen together: here, a change in the blood and a response to treatment. It does not say which came first, or whether something else drives both.' },
      { id: 'o-pred', html: 'A <b>predictor</b> has to work on patients it was not found in. A feature picked out of thousands by looking at twelve patients will fit those twelve better than it fits anyone else, so it is tested again in a new group before anybody relies on it.' },
      { id: 'o-cause', html: 'A <b>cause</b> needs an intervention: change the thing on purpose and see whether the outcome follows. A study that only watches cannot show that, however small its p-values.' },
      { id: 'o-real', html: 'The patients of this project are invented, and their numbers are cleaner than any real cohort. In real studies an effect is partial: some responders do not show it, and some of the other patients do.' },
    ],
    term: null, termNote: 'No code in this room. The sentence at the end of an analysis is written by the people who sign it.',
  });
}

G.scenes.readout = {
  phase: () => phase,
  dbg: { picks: () => pick.slice(), foc: () => foc, slips: () => slips, slots: () => SLOTS.map(s => ({ id: s.id, opts: s.opts.map(o => o.id) })), sentence: () => (full() ? sentence() : ''), judge: () => (full() ? judge() : 'empty'),
    /* every way of filling the slots that holds, as lists of option numbers */
    right: () => { const keepP = pick.slice(), out = [], n = SLOTS.map(s => s.opts.length); const walk = (i, cur) => { if (i === SLOTS.length) { pick = cur.slice(); if (!judge()) out.push(cur.slice()); return; } for (let k = 0; k < n[i]; k++) walk(i + 1, cur.concat([k])); }; walk(0, []); pick = keepP; return out; },
    set: p => { pick = p.slice(); }, spot: i => (i >= SLOTS.length ? [262, 152] : [SHEET[0] + 100, ROWY[i] + 7]), ask: k => [PUSHX[k] + PUSHW / 2, 159] },
  enter() {
    W = G.sys.changes.readout; SLOTS = W.slots; TYPES = G.sys.changes.types;
    pick = SLOTS.map(() => -1); foc = 0; slips = 0; res = null; rsel = 0; say = null; trueSlip = tieSlip = false; pushed = false; shake = null; psel = 0;
    TR().build();
    /* what the stations found, for the board beside the sheet */
    facts = W.books.map(b => { const e = evidence(b, { type: b.type }); return { name: b.name, c: KIND[b.kind],
      word: e.stamp ? (e.holds ? 'HOLDS' : 'DONORS') : e.number ? (e.resp ? 'MORE CELLS' : 'STEADY') : e.resp && !e.rest ? 'RESPONDERS' : e.rest ? 'EVERYONE' : e.stood ? 'NO CHANGE' : 'NOTHING' }; });
    beats = new G.Beats(W.ask.map(s => ({ say: s })));
    phase = 'ask';
    showBook(); lights();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'readout' }); return; }
    if (phase === 'ask') { if (beats.update(dt) === 'done') phase = 'play'; return; }
    if (phase === 'said') { if (say.update(dt) === 'done') advance(); return; }
    if (phase === 'push') {
      if (G.hit('left') || G.hit('up')) { psel = 0; G.sfx('tick'); }
      if (G.hit('right') || G.hit('down')) { psel = 1; G.sfx('tick'); }
      if (G.act() && psel >= 0) answer(psel);
      return;
    }
    if (phase === 'result') { const r = G.resultKeys(rsel, true); rsel = r.rsel; if (r.act === 'keep') keep(); else if (r.act === 'retry') restart(); return; }
    const n = SLOTS.length;
    if (G.hit('right')) { foc = Math.min(n, foc + 1); G.sfx('tick'); }
    if (G.hit('left')) { foc = Math.max(0, foc - 1); G.sfx('tick'); }
    if (foc < n) { if (G.rep('down')) cycle(foc, 1); if (G.rep('up')) cycle(foc, -1); }
    if (G.ptr.pressed) for (let i = 0; i < n; i++) if (G.over(SHEET[0] + 4, ROWY[i] - 2, SHEET[2] - 8, 18)) { foc = i; cycle(i, 1); }
    if (G.act()) { if (foc >= n) hand(); else { cycle(foc, 1); } }
  },
  draw() {
    R(0, 0, VW, VH, '#14100c');
    drawSheet(); drawBooks();
    G.roomHeader('THE READ-OUT', C.coral, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, W.done, true, rsel, 'START AGAIN', 'SEND IT');
      if (act === 'keep') keep(); else if (act === 'retry') restart();
      G.stars(250, y0 + 7, res.stars); T(slips + (slips === 1 ? ' SLIP' : ' SLIPS'), 310, y0 + 18, C.steel, { a: 'right' });
      return;
    }
    G.strip(y0);
    G.face(10, y0 + 8, G.LOOKS.VERA, phase === 'ask'); T('VERA', 32, y0 + 6, C.fog);
    if (phase === 'push') {
      /* Vera's question stays up over the sheet, and the two answers take the place of the keys */
      G.caption(W.pushAsk, 99, { top: true, noPrompt: true, border: C.amber });
      T(G.kt('LEFT, RIGHT: CHOOSE', 'TAP YOUR ANSWER'), 312, y0 + 6, C.steel, { a: 'right' });
      W.pushOpts.forEach((o, i) => { if (G.button('push' + i, PUSHX[i], y0 + 18, PUSHW, 22, o, { focus: psel === i }) && G.t - pushT > 0.4) answer(i); });
      return;
    }
    T(G.kt('LEFT, RIGHT: SLOT', 'TAP A SLOT TO'), 32, y0 + 18, C.steel); T(G.kt('UP, DOWN: WORD', 'CHANGE ITS WORD'), 32, y0 + 27, C.steel);
    const live = phase === 'play';
    if (G.button('hand', 212, y0 + 8, 100, 28, 'HAND IT OVER', { primary: true, focus: live && foc >= SLOTS.length, disabled: !full() }) && live) { foc = SLOTS.length; hand(); }
    /* the arrow says that the sheet is full, not that it is right */
    if (live && full() && foc < SLOTS.length) G.cue(262, y0 + 7, true);
    if (phase === 'ask') beats.draw();
    if (phase === 'said') say.draw();
  },
};

/* ---------- drawing ---------- */
function drawSheet() {
  const [x, y, w, h] = SHEET, live = phase === 'play';
  R(x - 1, y - 1, w + 2, h + 2, '#3a2c1e'); R(x, y, w, h, '#e6dcc0'); R(x, y, w, 1, '#fff6d8');
  SLOTS.forEach((s, i) => {
    const ry = ROWY[i], o = opt(i), on = live && foc === i, lead = s.lead || '', lx = x + 8, bx = lx + (lead ? Math.ceil(G.tw(lead, 'sm')) + 6 : 0);
    const text = o ? o.t : '', bw = Math.max(62, Math.ceil(G.tw(text, 'smb')) + 12), jig = shake && shake.slot === s.id && G.t - shake.t < 0.4 ? Math.round(Math.sin(G.t * 60)) : 0;
    if (lead) T(lead, lx, ry + 2, '#6b5f4a');
    /* a slot: an empty frame, or a tile */
    R(bx + jig, ry - 1, bw, 14, on ? C.amber : o ? '#3a2c1e' : '#b9ad8c'); R(bx + 1 + jig, ry, bw - 2, 12, o ? (s.id === 'tie' ? '#f6ba4c' : '#fff6d8') : '#d8cdae');
    if (o) T(text, bx + 6 + jig, ry + 2, C.ink, { f: 'smb' }); else for (let k = 0; k < 3; k++) R(bx + 8 + k * 6, ry + 6, 2, 2, '#8a7f66');
    if (s.tail) T(s.tail, bx + bw + 5, ry + 2, '#6b5f4a'); else T(i === SLOTS.length - 2 ? '.' : ',', bx + bw + 2, ry + 2, '#6b5f4a');
    /* the slot in hand can be turned up or down */
    if (on) { const ax = bx + bw + (s.tail ? Math.ceil(G.tw(s.tail, 'sm')) + 12 : 12), b = Math.floor(G.t * 3) % 2; for (let k = 0; k < 3; k++) { R(ax + 2 - k, ry + 1 - b + k, 1 + 2 * k, 1, C.amber); R(ax + 2 - k, ry + 11 + b - k, 1 + 2 * k, 1, C.amber); } }
  });
}
function drawBooks() {
  const x = SX, wd = SW;
  G.panel(x, 14, wd, 114, { border: C.slate, fill: '#0e1630' });
  T('ON THE BOOKS', x + 6, 17, C.mist);
  facts.forEach((f, i) => { const y = 29 + i * 12; R(x + 6, y + 2, 4, 4, f.c); T(f.name, x + 13, y, C.fog); T(f.word, x + wd - 5, y, f.word === 'HOLDS' || f.word === 'RESPONDERS' || f.word === 'MORE CELLS' ? C.mint : C.steel, { a: 'right' }); });
}
})();
