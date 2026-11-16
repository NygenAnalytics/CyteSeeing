/* The end of a project: the close, at the lectern of the Long Gallery. Vera states the question the
   project began with, reads out what the player found in the player's own words (the sentence
   that went to the clinic, or the departure board as it was hung), says what the project did not
   show, and shows the page: the title, its author, the stars, how many steps Tomo ran, and what
   is still a building site. Then the way on: the map, and the other parcel if it is still waiting.
   Nothing is asked here. The stars are for the questions from the floor in the gallery: one fewer
   for the first slip, and one for any more. A finished project is written into the profile.
   What was asked for, what was found and what was not shown come from the pack of the cell
   system (js/systems/<id>.gallery.js: close). */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const SX = 52, SY = 16, SW = 266, SH = 86, TX = SX + 9, TW = SW - 18, FEET = 124, STEP = 0.55, BTN = [[10, 104], [176, 134]];
const HERO = { skin: C.skin1, hair: '#3a2a22', style: 'short', coat: C.paper, shirt: C.cyan, pants: '#2c3a5e', shoes: C.ink };
const kit = () => G.kits.gallery;
/* where to go next: with another project still to do, and with none */
const ENDS = ['VERA: The map is outside. And there is another parcel waiting in the arrivals bay.', 'VERA: The map is outside. When the builders are done, the road goes on.'];

let phase, beats, sc, pack, found, shown, readT, slips, stars, lent, sel, crowd, endT;

const sentence = s => s.charAt(0) + s.slice(1).toLowerCase();
/* the finding as rows for the screen: a text is set in lines, and rows are shown as they were written */
function layout(f) {
  if (!f) return [];
  if (f.text) return G.wrap(f.text, TW, 'md').map(t => ({ t, f: 'md' }));
  return (f.rows || []).filter(t => t).map(t => ({ t, f: 'sm' }));
}
const pitch = () => (found.length && found[0].f === 'md' ? 12 : 9);
/* is another project still to be finished */
const waiting = () => Object.keys(G.SCENARIOS).some(id => id !== G.profile.scenario && !G.finished(id));

function open() {
  const s = G.state, gloss = pack.gloss ? pack.gloss(s) : null, list = [];
  if (gloss && found.length) list.push({ say: gloss, slide: 'found' });
  (pack.open || []).forEach((o, i) => list.push({ say: o.say, slide: 'open', n: i + 1 }));
  if (!list.length) { page(); return; }
  beats = new G.Beats(list); phase = 'open';
}
/* the page is shown: the review is over, and what it came to is kept */
function page() {
  const s = G.state;
  s.rooms.close = { done: true, stars: Math.max(s.rooms.close.stars, stars) };
  if (G.profile.scenario) G.profile.finished[G.profile.scenario] = { stars: G.totalStars(), max: G.maxStars(), lent };
  G.save(); G.sfx('star');
  G.book.goal('heard', true); G.book.goal('clean', slips === 0);
  beats = new G.Beats([{ say: () => 'VERA: That is the page, with ' + G.you() + ' as its author. It will do.', slide: 'page' }, { say: ENDS[waiting() ? 0 : 1], slide: 'page' }]);
  phase = 'page';
}
function toMap() { G.go('campus', { from: 'gallery' }); }
/* the five questions again: the ribbons come off the frames, and the player starts at the door */
function again() {
  const rv = G.state.review || {};
  G.state.review = { settled: {}, slips: 0, hung: rv.hung, open: rv.open }; G.save();
  G.go('corridor', { floor: 'gallery', from: 'lift' });
}

function showBook() {
  G.book.show({
    floor: 'The long gallery · The lectern', room: 'The close', aim: 'Vera closes the review: the question, what you found, what is still open, and the page.',
    file: 'js/stages/gallery/close.js', methods: true,
    goals: [
      { id: 'clean', text: 'The questions from the floor were settled without a slip' },
      { id: 'heard', text: 'Hear the close to the end' },
    ],
    notes: [
      { id: 'z-open', open: true, html: 'A report says what was not shown as plainly as what was. Each open point here is a statement the data cannot support yet, and the next experiment is usually the one that would.' },
      { id: 'z-page', open: true, html: 'The methods section below is written from the settings you chose, station by station. The Copy button takes it with you.' },
    ],
    term: null, termNote: 'No code in this room. The code for each step is in the terminal of its own station.',
  });
  G.book.goal('clean', slips ? false : null);
}

G.scenes.close = {
  phase: () => phase,
  /* test hooks: what is on the screen, how wide it is, and where the two last buttons are */
  dbg: { slide: () => slide(), rows: () => found.map(r => r.t), shown: () => shown, slips: () => slips, stars: () => stars, sel: () => sel, crowd: () => crowd.slice(),
    wide: () => Math.max.apply(null, [0].concat(found.map(r => G.tw(r.t, r.f)), (pack.open || []).map(o => 12 + G.tw(o.tag, 'sm')))), room: () => TW,
    spot: k => [BTN[k][0] + BTN[k][1] / 2, 166],
    /* every line that can be said here, whichever way the project went */
    said: () => { const s = G.state, out = ['VERA: This project began with a parcel and one question. ' + sentence(sc.title), 'VERA: That is the page, with ' + G.you() + ' as its author. It will do.'].concat(ENDS);
      [pack.lead && pack.lead(s, G.you()), pack.gloss && pack.gloss(s)].forEach(l => { if (l) out.push(l); }); (pack.open || []).forEach(o => out.push(o.say)); return out; } },
  enter() {
    const s = G.state;
    sc = G.scenario(); pack = (G.sys.gallery && G.sys.gallery.close) || {};
    slips = (s.review || {}).slips || 0; stars = slips === 0 ? 3 : slips === 1 ? 2 : 1;
    lent = Object.keys(s.rooms).filter(k => s.rooms[k].by).length;
    found = layout(pack.found ? pack.found(s) : null); shown = 0; sel = 1;
    /* everybody who stood in the gallery stands behind the lectern: the people of the stages, then those who asked */
    crowd = kit().stages().map(id => G.STAGES[id].mentor).concat((G.sys.gallery.questions || []).map(q => q.who)).filter((w, i, a) => a.indexOf(w) === i && w !== 'VERA');
    const lead = pack.lead ? pack.lead(s, G.you()) : null;
    beats = new G.Beats([{ say: () => 'VERA: This project began with a parcel and one question. ' + sentence(sc.title), slide: 'title' }]
      .concat(lead && found.length ? [{ say: lead, slide: 'title' }] : []));
    phase = 'ask';
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'close' }); return; }
    if (phase === 'ask') { if (beats.update(dt) === 'done') { if (found.length) { phase = 'read'; readT = G.t; shown = 1; G.sfx('tick'); } else open(); } return; }
    if (phase === 'read') {
      /* Vera reads it out, a line at a time. A press shows the rest, and another goes on. */
      const n = Math.min(found.length, 1 + Math.floor((G.t - readT) / STEP));
      if (n > shown) { shown = n; G.sfx('tick'); }
      if (G.skip()) { if (shown < found.length) { shown = found.length; readT = G.t - found.length * STEP; } else open(); }
      else if (G.t - readT > found.length * STEP + 1.6) open();
      return;
    }
    if (phase === 'open') { if (beats.update(dt) === 'done') page(); return; }
    if (phase === 'page') { if (beats.update(dt) === 'done') { phase = 'end'; sel = 1; endT = G.t; } return; }
    if (G.hit('left') || G.hit('right')) { sel = 1 - sel; G.sfx('tick'); }
    if (G.act()) { if (sel) toMap(); else again(); }
  },
  draw() {
    drawHall(); drawScreen(); drawPeople();
    G.roomHeader('THE REVIEW', C.paper, true);
    const y0 = 130;
    if (phase === 'end') {
      G.resultHead(y0, true, 'REVIEWED');
      G.stars(250, y0 + 7, stars); T(slips + (slips === 1 ? ' SLIP' : ' SLIPS'), 310, y0 + 18, C.steel, { a: 'right' });
      const live = G.t - endT > 0.3;
      if (G.button('again', BTN[0][0], y0 + 29, BTN[0][1], 15, 'START AGAIN', { focus: sel === 0 }) && live) again();
      if (G.button('map', BTN[1][0], y0 + 29, BTN[1][1], 15, 'TO THE MAP', { primary: true, focus: sel === 1 }) && live) toMap();
      return;
    }
    G.strip(y0);
    if (phase === 'read') {
      G.face(10, y0 + 8, G.LOOKS.VERA, true); T('VERA', 32, y0 + 6, C.fog); T('READS IT OUT, AS IT WAS WRITTEN', 32, y0 + 18, C.steel);
      if (shown >= found.length && Math.floor(G.t * 2.5) % 2 === 0) T('>', VW - 15, VH - 16, C.cyan);
      return;
    }
    beats.draw();
  },
};

/* which of its four faces the screen shows */
function slide() { return phase === 'read' ? 'found' : phase === 'end' ? 'page' : (beats.cur() || {}).slide || 'title'; }

/* ---------- drawing ---------- */
/* the far end of the gallery: its wall, the rail, the floor, and a low platform for the lectern */
function drawHall() {
  const p = kit().paint;
  R(0, 0, VW, VH, p[1]); R(0, 0, VW, 13, p[0]); R(0, 104, VW, 2, p[2]); R(0, 106, VW, 20, p[3]);
  for (let x = 8; x < VW; x += 28) R(x, 108, 1, 16, 'rgba(0,0,0,.25)');
  R(0, FEET + 2, VW, VH - FEET - 2, p[5]); R(0, FEET + 2, VW, 2, p[6]);
  R(2, FEET, 48, 4, '#6b5134'); R(2, FEET, 48, 1, 'rgba(255,255,255,.25)');
}
function drawScreen() {
  const s = G.state, mode = slide();
  /* a screen let down from a roller */
  R(SX - 3, SY - 3, SW + 6, 4, '#8f8a7c'); R(SX - 1, SY, SW + 2, SH + 1, '#05060a'); R(SX, SY, SW, SH, '#0e1630'); R(SX, SY, SW, 1, 'rgba(255,255,255,.15)');
  if (mode === 'title') {
    const lines = G.wrap(sc.title, TW, 'lg'), y = SY + Math.round((SH - lines.length * 18 - 12) / 2);
    R(SX + SW / 2 - 12, y - 6, 24, 2, sc.col);
    lines.forEach((l, i) => T(l, SX + SW / 2, y + i * 18, C.white, { a: 'center', f: 'lg' }));
    T(sc.sample, SX + SW / 2, y + lines.length * 18 + 3, C.mist, { a: 'center' });
    return;
  }
  if (mode === 'found') {
    T(pack.head || '', TX, SY + 4, C.mist);
    const n = phase === 'read' ? shown : found.length, pt = pitch();
    found.forEach((r, i) => { if (i < n) T(r.t, TX, SY + 17 + i * pt, phase === 'read' && i === n - 1 ? C.white : r.f === 'md' ? C.paper : C.amber, { f: r.f }); });
    return;
  }
  if (mode === 'open') {
    const n = (beats.cur() || {}).n || 0;
    T('NOT SHOWN', TX, SY + 4, C.coral);
    (pack.open || []).forEach((o, i) => {
      if (i >= n) return;
      const y = SY + 20 + i * 15, now = i === n - 1;
      R(TX, y, 7, 7, now ? C.coral : C.steel); R(TX + 1, y + 1, 5, 5, '#0e1630');
      T(o.tag, TX + 12, y - 1, now ? C.white : C.fog);
    });
    return;
  }
  /* the page: the question, the author, and what the project came to */
  T(sc.title, SX + SW / 2, SY + 5, C.white, { a: 'center', f: 'smb' });
  T('BY ' + G.you(), SX + SW / 2, SY + 16, sc.col, { a: 'center' });
  R(TX, SY + 29, TW, 1, C.slate);
  const row = (i, label) => { const y = SY + 35 + i * 12; T(label, TX, y, C.mist); return y; };
  let y = row(0, 'STARS'); G.star(TX + TW - 8 - Math.ceil(G.tw(G.totalStars() + '/' + G.maxStars(), 'sm')) - 4, y + 1, true); T(G.totalStars() + '/' + G.maxStars(), TX + TW, y, C.amber, { a: 'right' });
  y = row(1, 'STEPS THAT TOMO RAN'); T(lent ? String(lent) : 'NONE', TX + TW, y, lent ? C.fog : C.mint, { a: 'right' });
  y = row(2, 'STILL A BUILDING SITE'); T((sc.coming || []).join(', ') || 'NOTHING', TX + TW, y, C.fog, { a: 'right' });
  y = row(3, 'THE REVIEW'); G.stars(TX + TW - 25, y + 1, s.rooms.close.done ? s.rooms.close.stars : stars);
}
function drawPeople() {
  const t = G.t, talking = phase !== 'end' && phase !== 'read' ? !beats.full : phase === 'read';
  /* Vera behind the lectern, the player beside it, and everybody else in a row under the screen */
  kit().figure('VERA', 13, FEET, { dir: 1, t });
  R(23, 104, 20, 21, '#2a1a16'); R(24, 105, 18, 20, '#6b5134'); R(24, 105, 18, 1, 'rgba(255,255,255,.25)'); R(20, 100, 26, 5, '#8a6c40'); R(20, 100, 26, 1, 'rgba(255,255,255,.35)');
  R(25, 97, 12, 3, C.paper); R(42, 90, 1, 10, '#8a6c40'); R(38, 89, 6, 2, talking && Math.floor(t * 3) % 2 ? '#f6dc8c' : '#d8b45a');
  G.person(62, FEET + 2, HERO, { dir: 1, t });
  const gap = Math.min(22, Math.floor((VW - 12 - 84) / Math.max(1, crowd.length - 1)));
  crowd.forEach((w, i) => kit().figure(w, 84 + i * gap, FEET + 2, { dir: -1, t }));
}
})();
