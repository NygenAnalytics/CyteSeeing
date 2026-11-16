/* Station 5-4, the Clock. The tissue came at three ages, and the labels have been kept face down.
   Three trains stand on the line, one for each sample, every wagon a cell at its pseudotime.
   1. The player puts the trains in order of age from where their wagons stand, and the labels are
      turned over: the direction of the line is checked against real time.
   2. Two stretches of the same length are marked, one crowded and one nearly empty. Which takes a
      cell longer? The snapshot cannot say, and that is the third button.
   3. A newborn neuron of the oldest sample is ringed, and the maturing neurons of the youngest are
      bracketed. Will the one become one of the others? No: one line of states is not one line of
      descent.
   Where the wagons stand and which stretches are marked are worked out from the cells (see line.trains, line.stretches). */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 308, PH = 110, X0 = 66, AW = 240, BINS = 24, BW = AW / BINS, ROWH = 32, FLIP = 0.5;
const COLS = [C.cyan, C.amber, C.pink];
const L = () => G.lineage;
const ry = r => PY + 5 + r * ROWH, base = r => ry(r) + 27, px = v => X0 + G.clamp(v, 0, 1) * AW;

let phase, load, beats, say, after, W, AGES, trains, bins, str, rows, cur, held, swaps, flipT, turned, psel, askT, slips, ageSlip, timeSlip, kinSlip, res, rsel, ring, brac;

const sorted = () => rows.every((s, r) => s === L().byProgress()[r]);
const rowOf = s => rows.indexOf(s);

function build() {
  trains = L().trains(); str = L().stretches(); AGES = G.sys.order.samples.map(s => s.age);
  bins = trains.map(t => { const b = new Array(BINS).fill(0); t.at.forEach(v => { b[Math.min(BINS - 1, Math.floor(v * BINS))]++; }); return b; });
  /* the ringed cell: the middle one of the oldest sample's cells of one state. The bracket: the stretch the youngest sample's cells of another state stand on. */
  const old = trains[trains.length - 1], young = trains[0], a = old.at.filter((v, i) => old.type[i] === W.ringed), b = young.at.filter((v, i) => young.type[i] === W.bracketed);
  ring = a[Math.floor(a.length / 2)]; brac = [b[0], b[b.length - 1]];
  /* the trains stand in an order that is neither the answer nor its reverse */
  rows = [1, 2, 0]; cur = 0; held = -1; swaps = 0; flipT = -9; turned = false; psel = -1;
}
function act() {
  if (cur === 3) { turn(); return; }
  if (held < 0) { held = cur; G.sfx('blip'); return; }
  if (held === cur) { held = -1; G.sfx('tick'); return; }
  const t = rows[held]; rows[held] = rows[cur]; rows[cur] = t; held = -1; swaps++; G.sfx('drop');
}
function turn() {
  held = -1; G.state.tries.clock++; G.save();
  if (!sorted()) { slips++; ageSlip = true; G.sfx('bad'); lights(); tell('Not that way round. ' + W.older + ', so more of its wagons stand at the far end.', 'rank'); return; }
  turned = true; flipT = G.t; G.sfx('ok'); lights();
  tell((ageSlip ? '' : W.older + ', and stands further along. ') + 'The order runs the way real time does.', 'ask1');
}
/* the two stretches from left to right: A and B. crowdIs: which of the two answers names the crowded one. */
const marked = () => [str.crowd, str.sparse].sort((a, b) => a.lo - b.lo), crowdIs = () => (str.crowd.lo < str.sparse.lo ? 0 : 1);
function answer1(k) {
  if (k === 2) { G.sfx('ok'); tell('Right. Wagons crowd where cells wait, or divide, or were caught in numbers. One snapshot cannot tell these apart.', 'ask2'); lights(); return; }
  slips++; timeSlip = true; G.sfx('bad'); lights();
  tell(k === crowdIs() ? 'A crowd may be cells that wait, or cells that divide there, or more of them caught. One snapshot cannot say which.'
    : 'Few wagons may mean that cells pass quickly, or only that few were caught. One snapshot cannot say which.', 'ask2');
}
function answer2(k) {
  if (k === 0) { slips++; kinSlip = true; G.sfx('bad'); } else G.sfx('ok');
  say = new G.Beats(W.kin.map(s => ({ say: s }))); after = 'result'; phase = 'said'; lights();
}
function tell(text, next) { say = new G.Beats([{ say: text }]); after = next; phase = 'said'; }
function advance() {
  say = null;
  if (after === 'rank') { phase = 'rank'; return; }
  if (after === 'ask1') {
    const full = 'AB'[crowdIs()], bare = 'AB'[1 - crowdIs()];
    beats = new G.Beats([{ spot: band(str.crowd), say: 'Two stretches of the line are marked, A and B, of the same length. ' + full + ' is crowded with wagons.' }, { spot: band(str.sparse), say: bare + ' is nearly empty. Which of the two takes a cell longer to pass through?' }]);
    phase = 'brief1'; G.book.unlock('c-age'); return;
  }
  if (after === 'ask2') { beats = new G.Beats([{ spot: [PX, PY, PW, PH], say: W.mark }, { say: 'The two stand on one line. Will the ringed cell become one of the bracketed ones?' }]); phase = 'brief2'; G.book.unlock('c-dens'); return; }
  res = { stars: slips === 0 ? 3 : slips === 1 ? 2 : 1 }; phase = 'result'; rsel = 1; ['c-kin', 'c-toy'].forEach(n => G.book.unlock(n)); lights(); G.sfx('star');
}
/* the frame of a stretch ends above the words under the trains */
const band = s => [Math.round(px(s.lo)) - 1, PY + 3, Math.round(px(s.hi) - px(s.lo)) + 2, ROWH * 3];
function lights() {
  const done = phase === 'result';
  G.book.goal('age', ageSlip ? false : turned ? true : null);
  G.book.goal('time', timeSlip ? false : done || after === 'ask2' || phase === 'brief2' || phase === 'q2' ? true : null);
  G.book.goal('kin', kinSlip ? false : done ? true : null);
}
function keep() {
  const s = G.state, old = trains[trains.length - 1];
  s.yard = Object.assign({}, s.yard, { ages: AGES.slice(), oldest: AGES[AGES.length - 1], far: Math.round(old.late * 100), swaps });
  s.rooms.clock = { done: true, stars: Math.max(s.rooms.clock.stars, res.stars) };
  G.save(); G.go('corridor', { from: 'clock' });
}
function restart() { slips = 0; ageSlip = timeSlip = kinSlip = false; res = null; build(); after = null; phase = 'rank'; lights(); }

function showBook() {
  G.book.show({
    floor: 'The Marshalling Yard · Station 5-4', room: 'The clock', aim: 'Check the line against real time, and find what it cannot tell.',
    file: 'js/stages/order/clock.js',
    goals: [
      { id: 'age', text: 'The trains are put in order of age from their wagons' },
      { id: 'time', text: 'A crowded stretch is not taken for a long one' },
      { id: 'kin', text: 'One line of states is not taken for a line of descent' },
    ],
    notes: [
      { id: 'c-not', open: true, html: '<b>Pseudotime is not time.</b> It measures how far a cell\'s expression has moved from the root. A stretch of it is long where many genes change and short where few do, however long the cells take over it.' },
      { id: 'c-age', html: 'Samples taken at known times are the plainest check of direction: later samples should hold more cells late in the order. The time a sample was collected is also one of the two grounds the authors of Slingshot give for choosing where a line starts.' },
      { id: 'c-dens', html: 'How many cells sit on a stretch depends on how long cells stay there, on whether they divide or die there, and on how the tissue was sampled. For any one snapshot, several different histories would have left the same cells behind, so durations and rates cannot be read from it alone.' },
      { id: 'c-kin', html: W.layers },
      { id: 'c-toy', html: 'In this game a train is one sample, and a column of wagons is the cells of that sample in one twenty-fourth of the line. The two marked stretches are the fullest and the emptiest of their length that do not overlap.' },
    ],
    term: {
      title: 'Same check, in code',
      intro: 'Set the pseudotime of the cells beside what is known about <b>when</b> each sample was taken.',
      tabs: [
        { id: 'py', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          '<span class="c"># where the cells of each sample sit:\n# older tissue should lie further along</span>\n' +
          'adata.obs.<span class="k">groupby</span>(<span class="s">"age"</span>)[\n    <span class="s">"dpt_pseudotime"</span>].<span class="k">describe</span>()\n' +
          'sc.pl.<span class="k">violin</span>(adata, <span class="s">"dpt_pseudotime"</span>,\n    groupby=<span class="s">"age"</span>)\n\n' +
          '<span class="c"># how many cells each stretch holds:\n# a count, and not a duration</span>\n' +
          'adata.obs[<span class="s">"dpt_pseudotime"</span>].plot.<span class="k">hist</span>(\n    bins=24)</pre>' },
        { id: 'r', label: 'R · Slingshot', html:
          '<pre class="code"><span class="c"># sce: what slingshot() returned</span>\n' +
          'pt &lt;- sce$slingPseudotime_1\n\n' +
          '<span class="c"># older tissue should lie further along</span>\n' +
          '<span class="k">boxplot</span>(pt ~ sce$age)\n' +
          '<span class="k">tapply</span>(pt, sce$age, median)\n\n' +
          '<span class="c"># how many cells each stretch holds:\n# a count, and not a duration</span>\n' +
          '<span class="k">hist</span>(pt, breaks = 24)</pre>' },
      ],
    },
  });
}

/* the buttons of the two questions */
const Q1 = [{ x: 10, w: 92, t: 'STRETCH A' }, { x: 108, w: 92, t: 'STRETCH B' }, { x: 206, w: 106, t: 'CANNOT BE TOLD' }], Q2 = [{ x: 36, w: 116, t: 'YES' }, { x: 168, w: 116, t: 'NO' }];
G.scenes.clock = {
  phase: () => phase,
  dbg: { rows: () => rows.slice(), truth: () => L().byProgress().slice(), cur: () => cur, held: () => held, slips: () => slips, psel: () => psel, right: () => ({ q1: 2, q2: 1 }),
    spot: (what, k) => (what === 'row' ? [X0 + AW / 2, ry(k) + 16] : what === 'turn' ? [259, 152] : what === 'q1' ? [Q1[k].x + Q1[k].w / 2, 156] : [Q2[k].x + Q2[k].w / 2, 156]) },
  enter() {
    phase = 'load'; load = 0; slips = 0; ageSlip = timeSlip = kinSlip = false; res = null; rsel = 0; say = null; after = null;
    W = G.sys.order.clock;
    beats = new G.Beats([
      { spot: [PX, PY, PW, PH], say: 'Three trains, one for each sample. Every wagon is a cell, standing at its pseudotime, with the root on the left.' },
      { spot: [PX + 1, PY + 2, 58, PH - 12], say: 'The ages are face down. From where the wagons stand, put the trains in order of age, the youngest at the top.' },
      { say: () => G.kt('Pick up a train with SPACE, and put it down on the train to swap it with.', 'Tap a train, then the train to swap it with.') + ' Then turn the labels.' },
    ]);
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'clock' }); return; }
    if (phase === 'load') { if (++load < 3) return; build(); phase = G.state.tries.clock > 0 ? 'rank' : 'intro'; lights(); return; }
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'rank'; return; }
    if (phase === 'brief1' || phase === 'brief2') { if (beats.update(dt) === 'done') { phase = phase === 'brief1' ? 'q1' : 'q2'; psel = -1; askT = G.t; } return; }
    if (phase === 'said') { if (say.update(dt) === 'done') advance(); return; }
    if (phase === 'result') { const r = G.resultKeys(rsel, true); rsel = r.rsel; if (r.act === 'keep') keep(); else if (r.act === 'retry') restart(); return; }
    if (phase === 'q1' || phase === 'q2') {
      /* neither answer is in hand when the question is put */
      const n = phase === 'q1' ? 3 : 2, d = (G.hit('right') ? 1 : 0) - (G.hit('left') ? 1 : 0);
      if (d) { psel = psel < 0 ? 0 : G.clamp(psel + d, 0, n - 1); G.sfx('tick'); }
      if (G.act() && psel >= 0) { if (phase === 'q1') answer1(psel); else answer2(psel); }
      return;
    }
    if (G.hit('down')) { cur = Math.min(3, cur + 1); G.sfx('tick'); }
    if (G.hit('up')) { cur = Math.max(0, cur - 1); G.sfx('tick'); }
    if (G.ptr.pressed) for (let r = 0; r < 3; r++) if (G.over(PX, ry(r), PW, ROWH - 2)) { cur = r; act(); return; }
    if (G.act()) act();
  },
  draw() {
    R(0, 0, VW, VH, '#0f1118');
    if (phase === 'load') { G.roomHeader('5-4  THE CLOCK', C.lilac, true); T('COUPLING THE WAGONS...', VW / 2, 84, C.fog, { a: 'center' }); return; }
    drawTrains();
    G.roomHeader('5-4  THE CLOCK', C.lilac, true);
    const y0 = 130;
    if (phase === 'result') {
      const act2 = G.resultDraw(y0, 'Pseudotime puts states in order. How long a state lasts, and which cell descends from which, one snapshot cannot give.', true, rsel, 'START AGAIN', 'KEEP THE CHECK');
      if (act2 === 'keep') keep(); else if (act2 === 'retry') restart();
      G.stars(250, y0 + 7, res.stars); T(slips + (slips === 1 ? ' SLIP' : ' SLIPS'), 310, y0 + 18, C.steel, { a: 'right' });
      return;
    }
    G.strip(y0);
    if (phase === 'q1' || phase === 'q2') {
      /* the question stays in the strip, under the trains it is about */
      const q = phase === 'q1' ? Q1 : Q2;
      T(phase === 'q1' ? 'WHICH STRETCH TAKES A CELL LONGER?' : 'WILL THE RINGED CELL BECOME ONE OF THE BRACKETED CELLS?', 10, y0 + 4, C.white);
      q.forEach((b, i) => { if (G.button('q' + i, b.x, y0 + 15, b.w, 21, b.t, { focus: psel === i }) && G.t - askT > 0.4) { if (phase === 'q1') answer1(i); else answer2(i); } });
      T(G.kt('LEFT, RIGHT: CHOOSE   SPACE: ANSWER', 'TAP YOUR ANSWER'), 10, y0 + 40, C.steel);
      return;
    }
    const live = phase === 'rank';
    T('YOUNGEST AT THE TOP', 10, y0 + 6, turned ? C.mint : C.fog); T('SWAPS', 10, y0 + 17, C.steel); T(String(swaps), 46, y0 + 17, C.white);
    T(G.kt('UP, DOWN: TRAIN', 'TAP A TRAIN, THEN'), 10, y0 + 31, C.steel); T(G.kt('SPACE: PICK UP, SWAP', 'THE ONE TO SWAP WITH'), 10, y0 + 40, C.steel);
    if (G.button('turn', 206, y0 + 8, 106, 28, 'TURN THE LABELS', { primary: true, focus: live && cur === 3, disabled: turned }) && live) { cur = 3; turn(); }
    if (live && sorted() && cur !== 3) G.cue(259, y0 + 7, true);
    if (phase === 'intro' || phase === 'brief1' || phase === 'brief2') beats.draw();
    if (phase === 'said') say.draw();
  },
};

/* ---------- drawing ---------- */
function drawTrains() {
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  const ranking = phase === 'rank' || phase === 'intro', marks1 = phase === 'brief1' || phase === 'q1' || (phase === 'said' && after === 'ask2'), marks2 = phase === 'brief2' || phase === 'q2' || (phase === 'said' && after === 'result');
  rows.forEach((s, r) => {
    const y = ry(r), b = base(r), on = phase === 'rank' && cur === r, c = COLS[s];
    if (on) R(PX + 1, y, PW - 2, ROWH - 2, C.deep);
    /* the rail, and a column of wagons for the cells in each twenty-fourth of the line */
    for (let x = X0; x < X0 + AW; x += 6) R(x + 1, b + 1, 3, 2, '#3a2c1e'); R(X0 - 2, b, AW + 4, 1, '#aab2c4');
    bins[s].forEach((n, k) => { const h = Math.min(26, n); if (!h) return; R(X0 + k * BW + 1, b - h, BW - 2, h, c); for (let yy = b - 4; yy > b - h; yy -= 4) R(X0 + k * BW + 1, yy, BW - 2, 1, '#0e1630'); R(X0 + k * BW + 1, b - h, BW - 2, 1, 'rgba(255,255,255,.4)'); });
    /* the label: face down until the trains are in order, then turned over */
    const f = G.clamp((G.t - flipT) / FLIP, 0, 1), up = turned && f >= 0.5, squash = turned && f < 1 ? Math.round(Math.abs(Math.cos(f * Math.PI)) * 6) : 6;
    R(PX + 3, y + 9 + (6 - squash), 54, 1 + 2 * squash, up ? C.paper : '#3a4468'); R(PX + 4, y + 10 + (6 - squash), 52, Math.max(0, 2 * squash - 1), up ? '#e6dcc0' : '#2a3350');
    if (squash >= 5) T(up ? AGES[s] : '?', PX + 30, y + 11, up ? C.ink : C.mist, { a: 'center', f: up ? 'smb' : 'sm' });
    if (held === r) { G.corners([PX + 2, y + 1, PW - 5, ROWH - 4], C.amber); R(PX + 2, y + 1, 3, ROWH - 4, C.amber); }
    else if (on) G.corners([PX + 2, y + 1, PW - 5, ROWH - 4], Math.floor(G.t * 4) % 2 ? C.white : C.fog);
  });
  T('ROOT', X0, PY + PH - 10, C.steel); T('FAR END', X0 + AW, PY + PH - 10, C.steel, { a: 'right' });
  /* clear of the corners that mark the train in hand */
  if (ranking) { T('YOUNGEST', PX + 8, PY + 6, C.steel); T('OLDEST', PX + 8, PY + PH - 10, C.steel); }
  /* the two stretches: a frame down all three trains, with its letter */
  if (marks1) marked().forEach((st, i) => {
    const b = band(st), q = [st, 'AB'[i]];
    R(b[0], b[1], b[2], 1, C.amber); R(b[0], b[1] + b[3], b[2], 1, C.amber); R(b[0], b[1], 1, b[3], C.amber); R(b[0] + b[2] - 1, b[1], 1, b[3], C.amber); R(b[0] + 1, b[1] + 1, b[2] - 2, b[3] - 1, 'rgba(246,186,76,.10)');
    R(b[0] + Math.round(b[2] / 2) - 5, b[1] - 1, 11, 11, C.amber); T(q[1], b[0] + Math.round(b[2] / 2), b[1], C.ink, { a: 'center', f: 'smb' });
  });
  /* the ringed cell in the oldest train, and the bracketed cells in the youngest */
  if (marks2) {
    const ro = rowOf(trains.length - 1), yo = rowOf(0), k = Math.min(BINS - 1, Math.floor(ring * BINS)), h = Math.min(26, bins[trains.length - 1][k]), rx = X0 + k * BW + BW / 2, ryy = base(ro) - Math.max(3, Math.round(h / 2));
    const c = Math.floor(G.t * 4) % 2 ? C.white : C.amber;
    G.ring(rx, ryy, 7, c); G.ring(rx, ryy, 8, c);
    const x0 = Math.round(px(brac[0])) - 2, x1 = Math.min(X0 + AW + 2, Math.round(px(brac[1])) + 3), by = ry(yo) + 1;
    R(x0, by, x1 - x0, 2, c); R(x0, by, 2, 7, c); R(x1 - 2, by, 2, 7, c);
  }
}
})();
