/* The floor finale: Reviewer 2. Five questions, one from each room, about the reasoning and not
   the numbers. Three wrong answers and the paper is rejected. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;

const QS = [
  { q: 'You wanted more cells. Why not load 20,000 of them into one lane?', a: 0,
    o: ['DOUBLETS RISE WITH EVERY CELL YOU LOAD', 'THE CHIP WOULD OVERFLOW', 'CELLS GET SHY IN A CROWD'],
    no: 'Wrong. The doublet rate climbs with the load, about 0.8% per 1,000 cells. Split it across lanes.' },
  { q: 'A barcode has 300 UMIs. Is it a cell, or an empty droplet?', a: 2,
    o: ['EMPTY. THAT IS TOO FEW.', 'A CELL. IT HAS A BARCODE.', 'DEPENDS. DOES ITS RNA LOOK LIKE THE SOUP?'],
    no: 'Wrong. A count cannot say. Small cells and soupy empty droplets overlap. Test the RNA profile.' },
  { q: 'Why did you not simply remove every cell above 5% mitochondrial reads?', a: 1,
    o: ['FIVE IS AN UNLUCKY NUMBER', 'IT DEPENDS ON THE TISSUE AND THE DATA', 'MITOCHONDRIA ARE THE POWERHOUSE OF THE CELL'],
    no: 'Wrong. Thresholds do not travel between tissues. Read them off your data, and stay lenient.' },
  { q: 'Your T cells express haemoglobin. Explain yourself.', a: 1,
    o: ['A NEW CELL TYPE. STRAIGHT TO NATURE.', 'AMBIENT RNA FROM BURST RED CELLS', 'THE T CELLS WERE TIRED'],
    no: 'Wrong. That is the soup: RNA from lysed cells, in every droplet. Measure its share and subtract it.' },
  { q: 'A small cluster shows T cell and monocyte genes together. What is it?', a: 0,
    o: ['PROBABLY DOUBLETS. CHECK BEFORE NAMING IT.', 'A MONOCYTE-LIKE T CELL. NAME IT.', 'A BATCH EFFECT'],
    no: 'Wrong. Two lineages in one cluster usually means two cells in one droplet. Flag it, then check.' },
];
const YES = ['Hm. Acceptable.', 'Fine.', 'I suppose that is correct.', 'Irritatingly, yes.', 'Correct. Do not get used to it.'];
const HERO = { skin: C.skin1, hair: '#3a2a22', style: 'short', coat: C.paper, shirt: C.cyan, pants: '#2c3a5e', shoes: C.ink };

let phase, beats, qi, sel, pick, right, hearts, flash, rsel, verdict, askT;

function record() {
  const s = G.state, bits = [];
  if (s.load) bits.push('a doublet rate of ' + (s.load.rate * 100).toFixed(1) + '%');
  if (s.qc) bits.push(G.fmt(s.qc.kept) + ' cells after QC');
  if (s.soup) bits.push('a soup share of ' + s.soup.rho + '%');
  return bits.length ? 'I see ' + bits.join(', ') + '. I have questions.' : 'I have questions.';
}
function showBook() {
  G.book.show({
    floor: 'Ground floor · The last door', room: 'Reviewer 2',
    goals: [{ id: 'three', text: 'Answer at least 3 of the 5 questions' }, { id: 'five', text: 'Answer all 5 for a clean accept' }],
    notes: [
      { id: 'r-hint', open: true, html: 'Everything Reviewer 2 asks was answered in a room on this floor. The right answer is the reasoning, not the number.' },
      { id: 'r-hearts', open: true, html: 'You have three hearts of reputation. Each wrong answer costs one.' },
    ],
    term: null, termNote: 'No code in here. Only consequences.',
  });
}
function answer(i) {
  pick = i; phase = 'reply';
  if (i === QS[qi].a) { right++; G.sfx('ok'); } else { hearts--; flash = G.t; G.sfx('bad'); }
  beats = new G.Beats([{ say: 'REVIEWER 2: ' + (i === QS[qi].a ? YES[qi] : QS[qi].no) }]);
}
function next() {
  if (hearts <= 0 || qi === QS.length - 1) { finish(); return; }
  qi++; sel = 0; pick = -1; phase = 'ask'; askT = G.t;
}
function finish() {
  const stars = hearts <= 0 ? 0 : right === 5 ? 3 : right === 4 ? 2 : 1;
  verdict = { stars, title: stars === 3 ? 'ACCEPT AS IS' : stars === 2 ? 'MINOR REVISIONS' : stars === 1 ? 'MAJOR REVISIONS' : 'REJECT AND RESUBMIT',
    line: stars === 3 ? 'REVIEWER 2: Accept. I have never typed that word before. I feel unwell.'
      : stars === 2 ? 'REVIEWER 2: Minor revisions. From me, that is a love letter.'
      : stars === 1 ? 'REVIEWER 2: Major revisions. See my eleven pages of comments. And the eleven papers to cite.'
      : 'REVIEWER 2: Reject. Walk the corridor again, and come back with reasons.' };
  phase = 'verdict'; rsel = stars ? 1 : 0;
  G.state.tries.review++;
  G.book.goal('three', right >= 3 && hearts > 0); G.book.goal('five', right === 5);
  beats = new G.Beats([{ say: verdict.line }]);
  G.sfx(stars ? 'star' : 'bad'); G.save();
}
function restart() { qi = 0; sel = 0; pick = -1; right = 0; hearts = 3; phase = 'ask'; askT = G.t; ['three', 'five'].forEach(g => G.book.goal(g, null)); }
function leave() {
  const s = G.state;
  if (verdict && verdict.stars) { s.rooms.review = { done: true, stars: Math.max(s.rooms.review.stars, verdict.stars) }; G.save(); }
  G.go('corridor', { from: 'rev2', toast: verdict && verdict.stars ? 'GROUND FLOOR COMPLETE: ' + verdict.title : null });
}

G.scenes.review = {
  phase: () => phase,
  enter() {
    qi = 0; sel = 0; pick = -1; right = 0; hearts = 3; flash = -9; verdict = null; rsel = 0; askT = 0;
    beats = new G.Beats([
      { say: 'REVIEWER 2: Sit. I have read your methods section. All of it. Twice.' },
      { say: 'REVIEWER 2: ' + record() },
      { say: 'REVIEWER 2: Five of them. Answer well and I may recommend minor revisions.' },
    ]);
    phase = 'intro';
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { leave(); return; }
    if (phase === 'intro') { if (beats.update(dt) === 'done') { phase = 'ask'; askT = G.t; } }
    else if (phase === 'ask') {
      if (G.hit('up')) { sel = (sel + 2) % 3; G.sfx('tick'); }
      if (G.hit('down')) { sel = (sel + 1) % 3; G.sfx('tick'); }
      /* a short pause, so a key mashed to skip the last reply does not answer this one */
      if (G.hit('a') && G.t - askT > 0.4) answer(sel);
    } else if (phase === 'reply') { if (beats.update(dt) === 'done') next(); }
    else if (phase === 'verdict') {
      beats.update(dt);
      const r = G.resultKeys(rsel, verdict.stars > 0); rsel = r.rsel;
      if (r.act === 'keep') leave(); else if (r.act === 'retry') restart();
    }
  },
  draw() {
    drawOffice();
    G.roomHeader('REVIEWER 2', C.coral, true);
    for (let i = 0; i < 3; i++) heart(VW - 96 + i * 11, 2, i < hearts);
    if (phase === 'intro') { beats.draw({ top: true, border: C.coral, accent: '#8a2f3a' }); return; }
    if (phase === 'verdict') {
      G.panel(40, 16, 240, 30, { border: verdict.stars ? C.mint : C.coral, fill: C.ink });
      T('DECISION', 50, 20, C.mist); T(verdict.title, 50, 31, verdict.stars ? C.mint : C.coral, { f: 'smb' });
      if (verdict.stars) G.stars(244, 33, verdict.stars);
      T(right + ' OF 5', 270, 20, C.steel, { a: 'right' });
      beats.draw({ border: C.coral, accent: '#8a2f3a', noPrompt: true });
      const y = 112;
      if (G.button('rv-a', 12, y, 110, 15, 'FACE REVIEW AGAIN', { focus: rsel === 0 || !verdict.stars })) restart();
      if (verdict.stars && G.button('rv-b', 168, y, 140, 15, 'TAKE THE PAPER AND GO', { primary: true, focus: rsel === 1 })) leave();
      return;
    }
    const q = QS[qi];
    if (phase === 'reply') beats.draw({ top: true, border: C.coral, accent: '#8a2f3a' });
    else G.caption('QUESTION ' + (qi + 1) + ': ' + q.q, 99, { top: true, noPrompt: true, border: C.fog });
    q.o.forEach((o, i) => {
      const y = 118 + i * 19;
      if (phase === 'reply') {
        const good = i === q.a, bad = i === pick && !good;
        G.panel(12, y, 296, 15, { border: good ? C.mint : bad ? C.coral : C.slate, fill: good ? '#173a2a' : bad ? '#3d1b1b' : C.night });
        T(o, 22, y + 3, good ? C.mint : bad ? C.coral : C.steel);
      } else if (G.button('rv' + i, 12, y, 296, 15, o, { focus: sel === i }) && G.t - askT > 0.4) answer(i);
    });
  },
};

function heart(x, y, on) {
  const c = on ? C.coral : C.slate;
  R(x + 1, y, 2, 1, c); R(x + 5, y, 2, 1, c); R(x, y + 1, 8, 3, c); R(x + 1, y + 4, 6, 1, c); R(x + 2, y + 5, 4, 1, c); R(x + 3, y + 6, 2, 1, c);
}

function drawOffice() {
  const t = G.t, angry = t - flash < 0.6;
  R(0, 0, VW, VH, '#150f20'); R(0, 0, VW, 112, '#1c1430'); R(0, 108, VW, 4, '#0d0915');
  /* shelves of other people's manuscripts */
  for (let s = 0; s < 3; s++) {
    R(8, 62 + s * 14, 96, 2, '#3a2c52');
    for (let i = 0; i < 15; i++) { const h = 6 + (i * 7 + s * 5) % 6; R(10 + i * 6, 62 + s * 14 - h, 5, h, ['#5a4a7a', '#7a3f4a', '#3f5f7a', '#6d6a3f'][(i + s) % 4]); }
  }
  /* framed decisions */
  [['REJECT', 114], ['REJECT', 160]].forEach(f => { R(f[1], 64, 42, 14, '#3a2c52'); R(f[1] + 1, 65, 40, 12, C.paper); T(f[0], f[1] + 21, 67, '#b33a3a', { a: 'center' }); });
  /* the desk and whoever is behind it */
  const x = 252, sway = Math.round(Math.sin(t * 0.8) * 1.5);
  R(x - 22 + sway, 70, 44, 30, '#0a0712'); R(x - 9 + sway, 54, 18, 18, '#0a0712'); R(x - 6 + sway, 51, 12, 4, '#0a0712');
  const blink = Math.floor(t * 0.7) % 9 === 0 && !angry;
  if (!blink) { R(x - 5 + sway, 61, 3, angry ? 3 : 2, C.coral); R(x + 3 + sway, 61, 3, angry ? 3 : 2, C.coral); }
  if (angry) { R(x - 6 + sway, 59, 5, 1, C.coral); R(x + 2 + sway, 59, 5, 1, C.coral); }
  R(196, 96, 116, 14, '#3a2416'); R(196, 94, 116, 3, '#5a3a24');
  R(204, 86, 16, 8, C.paper); R(206, 84, 16, 8, '#ddd6c2'); R(208, 82, 16, 8, C.paper);
  R(290, 80, 3, 14, '#8a7a4a'); R(284, 76, 14, 5, '#c9a94a'); R(280, 81, 22, 14, 'rgba(246,186,76,.07)');
  R(232, 88, 9, 6, '#7a1f2a'); T('R', 234, 87, C.paper);
  /* you, standing where authors stand */
  G.person(150, 108, HERO, { dir: 1, t });
}
})();
