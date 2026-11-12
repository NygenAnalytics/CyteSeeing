/* The end of floor 2: journal club. The student presents the map the player made and makes
   seven claims about it. Some are fair. Some read more into a UMAP than it can show. The player
   judges each one. Every claim goes back to something a station on this floor showed.
   The student makes the claims and Noor, sitting next to the player, says why each answer was
   right or wrong. All of it is speech on the screen. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const SX = 12, SY = 18, SWD = 150, SH = 88;

const CLAIMS = [
  { say: 'Each dot is one cell. Cells that sit together on the map have similar expression.', fair: true,
    why: 'Fair. Cells that sit together on the map are usually neighbours in the graph.' },
  { say: 'These two islands are the furthest apart. So they are the two most different cell types.', fair: false, mark: 'far',
    why: 'Not fair. The layout decides how far apart islands land. To compare cell types, compare their expression.' },
  { say: 'The eight rare cells only became an island of their own once we chose better genes.', fair: true, mark: 'rare',
    why: 'Fair. You saw it at the gene picker: without their markers in the list, the rare cells had no island.' },
  { say: 'This island takes up the most room on the slide, so it is the most varied population.', fair: false, mark: 'big',
    why: 'Not fair. The room an island takes depends on the layout and the number of cells. It does not measure variety.' },
  { say: 'I ran it again with another seed and the islands moved. So the analysis is not reproducible.', fair: false, mark: 'shake',
    why: 'Not fair. Only the drawing moved. The graph under it is the same. Fix the seed and report it.' },
  { say: 'To be safe, we kept a few more components than the elbow suggested.', fair: true,
    why: 'Fair. Too few components can lose cell types. A few extra cost very little.' },
  { say: 'Next we will count the clusters by eye, straight off this map.', fair: false,
    why: 'Not fair. Clusters are computed on the graph, with all the components. Not by eye on a flat map.' },
];
const HERO = { skin: C.skin1, hair: '#3a2a22', style: 'short', coat: C.paper, shirt: C.cyan, pants: '#2c3a5e', shoes: C.ink };
const NOOR = { skin: C.skin3, hair: '#15101f', style: 'long', coat: '#5a3f8c', shirt: '#2a2140', pants: '#1f2a3a', shoes: C.ink };
const STUDENT = { skin: C.skin3, hair: '#20182a', style: 'short', coat: '#5b6ea8', shirt: '#5b6ea8', pants: '#2c3a5e', shoes: C.ink };

let phase, beats, qi, sel, right, askT, handT, nodT, last, verdict, rsel, A, B, cen, far, big;

function fitMap(P) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; const n = P.length / 2, out = [];
  for (let i = 0; i < n; i++) { x0 = Math.min(x0, P[2 * i]); x1 = Math.max(x1, P[2 * i]); y0 = Math.min(y0, P[2 * i + 1]); y1 = Math.max(y1, P[2 * i + 1]); }
  const s = Math.min((SWD - 24) / (x1 - x0 || 1), (SH - 26) / (y1 - y0 || 1));
  for (let i = 0; i < n; i++) out.push([SX + SWD / 2 + (P[2 * i] - (x0 + x1) / 2) * s, SY + SH / 2 + 5 + (P[2 * i + 1] - (y0 + y1) / 2) * s]);
  return out;
}
function build() {
  const cl = G.cloud, o = cl.settings();
  A = fitMap(cl.map(o)); B = fitMap(cl.map(Object.assign({}, o, { seed: o.seed + 1 })));
  /* where each cell type landed on the map, and how much room it takes */
  cen = cl.TYPES.map((t, k) => {
    let x = 0, y = 0, m = 0, x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    A.forEach((p, i) => { if (cl.cells[i].type !== k) return; x += p[0]; y += p[1]; m++; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    return { x: x / m, y: y / m, r: Math.max(5, Math.round(Math.max(x1 - x0, y1 - y0) / 2) + 3), area: (x1 - x0) * (y1 - y0) };
  });
  far = [0, 1]; let fd = 0;
  for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) { const d = Math.hypot(cen[a].x - cen[b].x, cen[a].y - cen[b].y); if (d > fd) { fd = d; far = [a, b]; } }
  big = 0; cen.forEach((c, k) => { if (c.area > cen[big].area) big = k; });
}

function showBook() {
  G.book.show({
    floor: 'Floor 2 · The far end', room: 'Journal club', aim: 'Your student presents your map and makes 7 claims about it. Decide which claims the map really supports.',
    methods: true, file: 'js/club.js', fileText: 'edit the claims', fileTail: ' if you have heard a better one at a real journal club.',
    goals: [{ id: 'most', text: 'Judge at least 5 of the 7 claims correctly' }, { id: 'all', text: 'Judge all 7 correctly' }],
    notes: [
      { id: 'j-hint', open: true, html: 'Every claim relates to something a station on this floor showed you.' },
      { id: 'j-map', open: true, html: 'A UMAP is a drawing of the neighbour graph. <b>You can trust which cells sit together.</b> Do not interpret the position of an island, its distance from other islands, or its size.' },
    ],
    term: null, termNote: 'No code here. Only slides.',
  });
}
function call(fair) {
  const c = CLAIMS[qi];
  last = fair === c.fair;
  if (last) { right++; G.sfx('ok'); } else G.sfx('bad');
  if (fair) nodT = G.t; else handT = G.t;
  phase = 'reply';
  beats = new G.Beats([{ say: 'NOOR: ' + c.why }]);
}
function next() {
  if (qi === CLAIMS.length - 1) { finish(); return; }
  qi++; sel = 0; phase = 'ask'; askT = G.t;
}
function finish() {
  const stars = right === 7 ? 3 : right === 6 ? 2 : right === 5 ? 1 : 0;
  verdict = { stars, line: stars === 3 ? 'NOOR: Seven for seven. You may have the last biscuit.'
    : stars === 2 ? 'NOOR: One got past you. Still better than most journal clubs.'
    : stars === 1 ? 'NOOR: Two got past you. The notes from the map table are worth another look.'
    : 'NOOR: Too many got past you. Sit through it again. There are more biscuits.' };
  phase = 'verdict'; rsel = stars ? 1 : 0;
  G.state.tries.club++;
  G.book.goal('most', right >= 5); G.book.goal('all', right === 7);
  beats = new G.Beats([{ say: verdict.line }]);
  G.sfx(stars ? 'star' : 'bad'); G.save();
}
function restart() { qi = 0; sel = 0; right = 0; phase = 'ask'; askT = G.t; ['most', 'all'].forEach(g => G.book.goal(g, null)); }
function leave() {
  const s = G.state, ok = verdict && verdict.stars;
  if (ok) { s.rooms.club = { done: true, stars: Math.max(s.rooms.club.stars, verdict.stars) }; G.save(); }
  G.go('corridor', { from: 'club', toast: ok ? 'FLOOR 2 COMPLETE' : null, party: !!ok });
}

G.scenes.club = {
  phase: () => phase,
  enter() {
    build();
    qi = 0; sel = 0; right = 0; askT = 0; handT = -9; nodT = -9; last = true; verdict = null; rsel = 0;
    beats = new G.Beats([
      { say: 'NOOR: Journal club. Your student is presenting the map you made.' },
      { say: 'NOOR: Seven claims. Choose FAIR if the map supports the claim. Choose NOT FAIR if it reads too much into the map.' },
    ]);
    phase = 'intro';
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { leave(); return; }
    if (phase === 'intro') { if (beats.update(dt) === 'done') { phase = 'ask'; askT = G.t; } }
    else if (phase === 'ask') {
      if (G.hit('left') || G.hit('right') || G.hit('up') || G.hit('down')) { sel = 1 - sel; G.sfx('tick'); }
      /* a short pause, so a key pressed to move on from the last answer does not judge this claim */
      if (G.hit('a') && G.t - askT > 0.5) call(sel === 0);
    } else if (phase === 'reply') { if (beats.update(dt) === 'done') next(); } else if (phase === 'verdict') {
      beats.update(dt);
      const r = G.resultKeys(rsel, verdict.stars > 0); rsel = r.rsel;
      if (r.act === 'keep') leave(); else if (r.act === 'retry') restart();
    }
  },
  draw() {
    drawRoom();
    G.roomHeader('JOURNAL CLUB', C.coral, true);
    if (phase === 'intro') { beats.draw(); return; }
    if (phase === 'verdict') {
      G.panel(170, 20, 140, 30, { border: verdict.stars ? C.mint : C.coral, fill: C.ink });
      T('CORRECT', 178, 24, C.mist); T(right + ' OF 7', 302, 24, C.white, { a: 'right', f: 'smb' });
      if (verdict.stars) G.stars(178, 37, verdict.stars); else T('5 NEEDED TO PASS', 178, 36, C.coral);
      beats.draw({ noPrompt: true, free: true });
      if (G.button('jc-a', 12, 109, 124, 14, 'HEAR IT AGAIN', { focus: rsel === 0 || !verdict.stars })) restart();
      if (verdict.stars && G.button('jc-b', 176, 109, 132, 14, 'LEAVE WITH YOUR MAP', { primary: true, focus: rsel === 1 })) leave();
      return;
    }
    if (phase === 'reply') {
      G.panel(12, 109, 296, 14, { border: last ? C.mint : C.coral, fill: last ? '#173a2a' : '#3d1b1b' });
      T(last ? 'RIGHT CALL' : 'WRONG CALL', 160, 111, last ? C.mint : C.coral, { a: 'center' });
      beats.draw();
      return;
    }
    G.caption('PHD STUDENT: ' + CLAIMS[qi].say, G.t - askT, { noPrompt: true });
    const live = G.t - askT > 0.5;
    if (G.button('jc-f', 12, 109, 140, 14, 'FAIR', { focus: sel === 0 }) && live) call(true);
    if (G.button('jc-o', 168, 109, 140, 14, 'NOT FAIR', { focus: sel === 1, accent: C.coral }) && live) call(false);
  },
};

function drawRoom() {
  const cl = G.cloud, t = G.t, c = phase === 'ask' || phase === 'reply' ? CLAIMS[qi] : null, mark = c ? c.mark : null;
  R(0, 0, VW, VH, '#12101c'); R(0, 12, VW, 96, '#1d1a2e'); R(0, 108, VW, 3, '#0b0914'); R(0, 111, VW, VH - 111, '#161322');
  /* the slide */
  R(SX - 2, SY - 2, SWD + 4, SH + 4, '#3a3552'); R(SX, SY, SWD, SH, '#0e1630');
  T('YOUR MAP', SX + 4, SY + 3, C.steel); T('CLAIM ' + (phase === 'intro' ? 1 : qi + 1) + ' OF 7', SX + SWD - 4, SY + 3, C.steel, { a: 'right' });
  /* for the claim about seeds, the map slides between two seeds */
  const mix = mark === 'shake' ? (Math.sin(t * 1.6) + 1) / 2 : 0;
  A.forEach((p, i) => R(p[0] + (B[i][0] - p[0]) * mix - 1, p[1] + (B[i][1] - p[1]) * mix - 1, 2, 2, cl.TYPES[cl.cells[i].type].col));
  const blink = Math.floor(t * 3) % 2 === 0;
  if (mark === 'far') {
    const a = cen[far[0]], b = cen[far[1]];
    G.ring(a.x, a.y, a.r, C.white); G.ring(b.x, b.y, b.r, C.white);
    if (blink) G.line(a.x, a.y, b.x, b.y, C.white);
  } else if (mark === 'big' && blink) G.ring(cen[big].x, cen[big].y, cen[big].r, C.white);
  else if (mark === 'rare' && blink) G.ring(cen[4].x, cen[4].y, cen[4].r, C.white);
  /* what is on today, and a clock */
  if (phase !== 'verdict') {
    G.panel(172, 18, 136, 34, { border: '#3a3552', fill: '#191628' });
    T('JOURNAL CLUB', 180, 22, C.coral, { f: 'smb' }); T('TODAY: OUR CELL MAP', 180, 32, C.mist); T('BRING BISCUITS', 180, 41, C.steel);
  }
  G.disc(186, 66, 6, '#0b0914'); G.disc(186, 66, 5, C.paper); G.line(186, 66, 186, 62, C.ink); G.line(186, 66, 189 + Math.round(Math.sin(t * 0.5)), 67, C.coral);
  /* the student with a pointer */
  G.person(184, 108, STUDENT, { dir: -1, t });
  G.line(178, 96, SX + SWD - 6, SY + SH - 22 + Math.round(Math.sin(t * 2) * 3), '#c9a94a');
  /* the audience: Noor, you, and two people who came for the biscuits */
  const nod = t - nodT < 0.8 ? Math.round(Math.abs(Math.sin((t - nodT) * 12)) * 2) : 0;
  [296, 312].forEach((x, i) => { R(x - 6, 92, 12, 16, '#0b0914'); R(x - 4, 84 + (i ? Math.round(Math.sin(t * 0.7) * 1) : 0), 8, 8, '#0b0914'); });
  G.person(226, 108, NOOR, { dir: -1, t });
  G.person(256, 108 + nod, HERO, { dir: -1, t });
  if (t - handT < 1.2) { R(259, 108 - 31, 2, 9, C.paper); R(259, 108 - 33, 2, 2, C.skin1); }
  /* one biscuit for every claim judged correctly */
  R(264, 100, 26, 8, '#3a2416'); R(264, 98, 26, 3, '#5a3a24');
  T('CORRECT SO FAR', 308, 62, C.steel, { a: 'right' });
  for (let i = 0; i < 7; i++) { const on = i < right; R(308 - 7 * 7 + i * 7, 72, 5, 5, on ? '#d9a35a' : '#2c2740'); if (on) R(308 - 7 * 7 + i * 7 + 1, 73, 1, 1, '#7a4a22'); }
}
})();
