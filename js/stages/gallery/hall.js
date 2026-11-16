/* The Long Gallery: the end of a project, where it is reviewed. The walking and the talking are
   in js/world/hall.js; this file holds the things that are only in here.
   One long wall. On it hangs a frame for every station on the project's route, in order, grouped
   by stage, and by each group stands the person whose stage it was. Standing at a frame shows
   its plate: what the player did there, in their own numbers (the notebook's line for that room).
   Five people each have a question about the project. The player hears one, its owner walks with
   them, and the player takes them to the frame that answers it and says so there. Then Vera
   closes the review at the lectern (close.js).
   The frames are made from G.route() and G.STAGES when the hall opens, so a project with another
   route gets another wall. What is asked, and by whom, the pack of the cell system says
   (js/systems/<id>.gallery.js). */
(function () {
'use strict';
const { R, T, C, VW } = G;
/* DROP: how far below the wall line somebody stands who walks with the player, clear of the prompt over the player's head */
const WALL = 132, FY = 154, PITCH = 42, GAP = 24, DROP = FY - 2 - (WALL - 1);
const GILT = '#d8b45a', GILT2 = '#8a6c40', GLOW = '#f6dc8c', MAT = '#101831', WOOD = '#6b5134', DARK = '#2a1a16', INK = '#14100c', VELVET = '#8a2f3a';
const BAND = [6, 80, 308, 30], TEXTX = 48;
const SPEAKER = /^[A-Z0-9 .'-]{2,16}: /;

/* somebody who asks a question in every project, and is in no other stage */
const CAST = { VISITOR: { skin: C.skin2, hair: '#6b4a2a', style: 'long', coat: '#b98f2a', shirt: '#3d5a80', pants: '#2c3a5e' } };
/* Reviewer 2 has only ever been a shape in a doorway */
const SHADE = { skin: '#0b0912', hair: '#05040a', style: 'short', coat: '#0b0912', shirt: '#16121c', pants: '#05040a', shoes: '#05040a' };

/* What each station of the four shared stages rules out. It is said by the person whose stage it is,
   when a question is brought to a frame that does not answer it. The stations of a project's own
   stage are in the pack of its cell system, and a pack can say any of these in its own words. */
const RULES = {
  droplets: 'The droplet bay set how many cells went into each lane. That decides how many doublets to expect, and nothing more.',
  cliff: 'The Cliff told droplets that hold a cell from empty ones. It rules out counting an empty droplet as a cell.',
  qc: 'The QC gate took out damaged cells. It rules out a group of cells that is only cells falling apart.',
  soup: 'The soup kitchen measured the loose RNA in every droplet and took it out. It rules out genes a cell never made.',
  doublet: 'The doublet hunt took out droplets that held two cells. It rules out a cell type that is two cells in one droplet.',
  review: 'That is Reviewer 2. Nothing was made in that room. You defended what the rooms before it made.',
  norm: 'The Leveller divided every cell by its depth. It rules out a map sorted by how deeply each cell was sequenced.',
  hvg: 'The Gene picker kept the genes that differ between cell types. It rules out a map drowned by genes that only add noise.',
  pca: 'The Rotator kept the components that still separate groups. It rules out distances measured mostly in noise.',
  knn: 'Neighbours set how many links each cell gets. It rules out a cell type torn to pieces, or a rare one swallowed.',
  umap: 'The Map table drew one graph twice. It rules out reading the place, the distance or the size of an island.',
  club: 'That is journal club. Nothing was made there. You judged claims about the map against what the stations showed.',
  cut: 'The Cut set the resolution and checked each split for genes behind it. It rules out a split that no gene supports.',
  lineup: 'The line-up pinned a marker gene on each cluster. It rules out a marker that is only a small p-value.',
  name: 'The name desk filed each cluster as deep as its genes went. It rules out a name finer than the evidence.',
  oracle: "The Oracle set a machine's labels against yours. It rules out a confident label from a reference that does not fit.",
  chief: "That is the Chief's office. Nothing was made there. You defended the case with what the stations made.",
  sort: 'The sorting table tied each island to its partner in the other run. It rules out washing out cells only one run holds.',
  wash: 'The Wash set how hard the runs are pulled together. It rules out islands that are runs, and a wash that joins what differs.',
  lost: 'Lost and found checked the labels of a new run against marker genes. It rules out a label for cells no reference held.',
  counter: 'The counter planned the next study, so that run and condition can be told apart. It changed nothing in this one.',
};
/* what the people of the shared stages say when they are spoken to. They only point the way. */
const MENTOR = {
  MIKA: ['MIKA: The core facility, framed. If a question lands on one of mine, I shall say what that room was for.',
    'MIKA: They hung the Cliff a little crooked. I have decided that it is deliberate.'],
  NOOR: ['NOOR: This stretch of wall is the Cloud. Ask at the frames. They have the numbers, and I only have opinions.',
    'NOOR: Your map looks better in a frame. Do not tell anybody I said so.'],
  IDA: ['IDA: The Bureau, on a wall. Every frame of it is evidence. Point at the right piece when somebody asks.',
    'IDA: I have stood in worse line-ups than this one.'],
  BEA: ['BEA: The Laundry hangs here. Somebody has framed the washing line, which I take as a compliment.',
    'BEA: Clean work, pegged up where everyone can see it. That is all a review is.'],
};
/* the things to poke: one before the first frames, and one between each group and the next */
const PROPS = [
  { id: 'g-book', label: 'READ', w: 46 }, { id: 'g-bench', label: 'SIT', w: 60 }, { id: 'g-crate', label: 'OPEN', w: 52 },
  { id: 'g-plinth', label: 'READ', w: 46 }, { id: 'g-rope', label: 'UNHOOK', w: 60 },
];
const LINES = {
  'g-book': [
    "VISITORS' BOOK: 'Very nice. Which one is the result?' The entry is not signed.",
    "VISITORS' BOOK: 'I liked the map. I am told that I should not.' Somebody has underlined 'told'.",
    "VISITORS' BOOK: The last entry is a methods section. It runs on to the inside of the back cover.",
  ],
  'g-bench': [
    'BENCH: A bench for looking at one figure for a long time. There is a dip worn in it, opposite the map.',
    'BENCH: You sit. The figures stay exactly as they were. In this building that is called reproducibility.',
    "BENCH: Under the seat, in pencil. 'Reviewer 2 sat here. For hours.'",
  ],
  'g-crate': [
    'CRATE: Figures that did not make the wall. The stencil on the side reads SUPPLEMENTARY.',
    'CRATE: You lift the lid. One plot, forty-one times, in forty-one colour schemes. The data are the same in each.',
    'CRATE: At the bottom, a pie chart. You close the lid quietly.',
  ],
  'g-plinth': [
    "PLINTH: Empty, under a spotlight. The plate reads 'THE MECHANISM. ON LOAN.'",
    "PLINTH: A second plate, smaller. 'Expected back after the next grant.'",
    'PLINTH: A ring in the dust where something stood. It is the size of a coffee cup.',
  ],
  'g-rope': [
    'ROPE: A velvet rope across a bare stretch of wall. The sign on the post says FUTURE WORK.',
    'ROPE: You unhook it. Nothing is behind it yet. You hook it up again, out of respect.',
    'ROPE: People have been queueing here. Nobody could say what for.',
  ],
  /* what Vera says the first time in: before the project is finished, and on the day of the review */
  hung: [
    'VERA: This is the long gallery. A project is reviewed here when all of it is done, and yours is not.',
    'VERA: Every station you finish gets a frame. The empty ones are owed. Come back when the wall is full.',
  ],
  review: [
    'VERA: Review day. Your work is on the wall, a frame for each station, and five people here have a question.',
    'VERA: Every step you took is there to rule out one way of being wrong. A question is answered by the step that rules it out.',
    'VERA: Hear a question, walk whoever asked to the frame that answers it, and say so there. Then find me at the lectern.',
  ],
  called: ['VERA: That is all five. The lectern, when you are ready.'],
};

/* ---------- the wall, made when the hall opens ---------- */
let ITEMS = [], W = 640, Q = [], FRAMES = [], GROUPS = [], ASKERS = [], hold = -1, hero = null, inHand = null, tapAt = null;
const swing = {}, BODY = {};
const since = t => (t === undefined ? 99 : G.t - t);
const stages = () => G.route().filter(id => !G.STAGES[id].end);
const roomsOf = id => G.STAGES[id].rooms.concat(G.STAGES[id].extra || []);
const done = r => !!(G.state.rooms[r] && G.state.rooms[r].done);
/* every station of every other stage on the route is done: the wall is full, and the review can start */
const complete = () => stages().every(id => roomsOf(id).every(done));
/* what the save keeps of the review */
function review() {
  const s = G.state;
  if (!s.review) s.review = { settled: {}, slips: 0 };
  if (!s.review.settled) s.review.settled = {};
  return s.review;
}
const settled = q => !!((G.state.review || {}).settled || {})[q.room];
const settledCount = () => Q.filter(settled).length;
const frameOf = room => FRAMES.find(f => f.room === room) || null;

function open() {
  const pack = G.sys.gallery;
  Q = pack.questions;
  Object.assign(G.LOOKS, CAST, pack.cast || {});
  ITEMS = [{ id: 'lift', kind: 'lift', x: 44, label: 'GO OUT' }, Object.assign({ kind: 'prop', x: 104 }, PROPS[0])];
  FRAMES = []; GROUPS = []; ASKERS = []; hold = -1; inHand = null; tapAt = null;
  /* things stand side by side along the wall: each takes its own width, or the width of its name tag if that is more */
  let edge = 104 + PROPS[0].w / 2;
  const put = half => { const x = Math.round(edge + half + 4); edge = x + half; return x; }, named = name => Math.max(10, Math.ceil(G.tw(name, 'sm') / 2) + 5);
  stages().forEach((id, gi) => {
    const st = G.STAGES[id], rooms = roomsOf(id), prop = gi > 0 && PROPS[gi];
    if (prop) ITEMS.push(Object.assign({ kind: 'prop', x: put(prop.w / 2) }, prop));
    /* whoever has a question that this stage answers waits where its frames begin */
    Q.forEach((q, k) => { if (rooms.indexOf(q.room) >= 0) { const x = put(named(q.who)), a = { id: 'q' + k, kind: 'asker', q: k, who: q.who, x, home: x, dir: 1, ay: 77 }; ASKERS[k] = a; ITEMS.push(a); } });
    ITEMS.push({ id: 'm-' + id, kind: 'mentor', who: st.mentor, stage: id, x: put(named(st.mentor)), label: 'TALK' });
    const g = { st, title: (st.n ? st.n + '  ' : '') + st.name };
    rooms.forEach((r, i) => {
      const x = i ? edge + PITCH - 18 : put(18) + 2, f = { id: 'f-' + r, kind: 'frame', room: r, stage: id, x, col: st.col, code: st.n + (st.makes.indexOf(r) >= 0 ? '-' + (st.rooms.indexOf(r) + 1) : ' END') };
      edge = x + 18; if (!i) g.x0 = x - 18;
      FRAMES.push(f); ITEMS.push(f);
    });
    g.x1 = edge; GROUPS.push(g); edge += 8;
  });
  /* its prompt floats between the sign and Vera's name, so that it covers neither her nor the lectern */
  ITEMS.push({ id: 'close', kind: 'lectern', x: Math.round(edge + 76), ay: 22, py: 77 });
  W = Math.round(edge + 76 + 70);
  /* whoever has been answered stands at the frame that answered */
  ASKERS.forEach(a => { if (a && settled(Q[a.q])) { const f = frameOf(Q[a.q].room); a.x = -999; a.at = f ? f.x + 13 : a.home; } });
  kit.ITEMS = ITEMS; kit.W = W;
}

/* ---------- what the player does here ---------- */
/* what somebody with a question says before the review has started, and while another question is in hand */
const WAITS = ': I have a question about this project. It will keep until the wall is full.', KEEPS = ': One question at a time. Mine will keep.';
/* what is said at a frame that does not answer the question in hand */
function wrong(q, f) {
  const line = (q.near && q.near[f.room]) || (G.sys.gallery.rules || {})[f.room] || RULES[f.room] || 'That station answers another question.';
  return SPEAKER.test(line) ? line : G.STAGES[f.stage].mentor + ': ' + line;
}
function answer(f, api) {
  const s = G.state, q = Q[hold], rv = review(), a = ASKERS[hold];
  s.tries.close++;
  if (f.room === q.room) {
    rv.settled[q.room] = true; G.sfx('star');
    /* its owner stays at the frame */
    a.at = a.x; a.to = f.x + 13; a.going = true; a.up = G.t; a.x = -999; hold = -1;
    G.save(); api.refresh();
    /* whoever asked may have run that very step for the player, and then says so */
    api.say([q.own && s.rooms[q.room].by ? q.own : q.right], () => { if (settledCount() === Q.length) api.say(LINES.called); });
    return;
  }
  rv.slips++; swing[f.id] = G.t; G.sfx('bad'); G.save();
  api.say([wrong(q, f)]);
}
function useFrame(f, api) {
  if (hold < 0 || !done(f.room)) { swing[f.id] = G.t; G.sfx('tick'); return true; }
  /* a tap on a frame walks to it. Only the key, or a tap on the frame the player already stands at, says "this one". */
  if (!(G.hit('a') || G.hit('up')) && tapAt !== f) return true;
  /* and not the one press too many that follows a speech */
  if (G.t < (G.quiet || 0)) return true;
  answer(f, api);
  return true;
}
function useAsker(a, api) {
  const q = Q[a.q];
  if (!complete()) { api.say([q.who + WAITS]); return true; }
  if (hold === a.q) { api.say(q.ask); return true; }
  if (hold >= 0) { api.say([q.who + KEEPS]); return true; }
  G.sfx('blip');
  api.say(q.ask, () => { hold = a.q; a.down = G.t; a.dir = hero && hero.x < a.x ? -1 : 1; });
  return true;
}
function useMentor(it, api) {
  const owed = roomsOf(it.stage).filter(r => !done(r)).length;
  if (owed) { api.say([it.who + ': ' + (owed === 1 ? 'One of my frames hangs empty.' : owed + ' of my frames hang empty.') + ' The station is where you left it.']); return true; }
  const lines = MENTOR[it.who] || G.sys.gallery.mentor || [it.who + ': These frames are mine. Bring a question to the wrong one, and I shall say so.'];
  it.n = (it.n || 0) + 1;
  api.say([lines[(it.n - 1) % lines.length]]);
  return true;
}
/* a stage's name as it is said in a sentence, and a small number as a word */
const proper = name => name.toLowerCase().replace(/(^|\s)[a-z]/g, c => c.toUpperCase()), COUNT = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
function useLectern(api) {
  if (!complete()) {
    /* which stations are still owed, stage by stage: one short sentence for each, so that a long list turns the page */
    const owed = stages().map(id => [G.STAGES[id].name, roomsOf(id).filter(r => !done(r)).length]).filter(o => o[1]);
    api.say(['VERA: No review until the wall is full. ' + owed.map(o => proper(o[0]) + ' owes ' + (COUNT[o[1]] || o[1]) + (o[1] === 1 ? ' station.' : ' stations.')).join(' ')]);
    return true;
  }
  const n = settledCount();
  if (n < Q.length) { api.say(['VERA: The floor comes first. ' + (n ? n + ' of the ' + Q.length + ' questions ' + (n === 1 ? 'is' : 'are') + ' settled. Settle the others, then come back.' : 'None of the ' + Q.length + ' questions is settled yet.')]); return true; }
  G.sfx('door'); G.go('close', {});
  return true;
}
function use(it, api) {
  if (it.kind === 'frame') return useFrame(it, api);
  if (it.kind === 'asker') return useAsker(it, api);
  if (it.kind === 'mentor') return useMentor(it, api);
  if (it.kind === 'lectern') return useLectern(api);
  return false;
}
/* the first time in, Vera has something to say: one thing while frames hang empty, another on the day of the review */
function arrive() {
  const rv = review(), full = complete();
  if (!full && !rv.hung) return { say: LINES.hung, then: () => { rv.hung = true; G.save(); } };
  if (full && !rv.open) return { say: LINES.review, then: () => { rv.open = true; G.save(); } };
  return null;
}
/* where the arrow points: at somebody with a question, at nothing while one is in hand, then at the lectern.
   While a plate is up there is no arrow: the plate has that part of the wall. */
function next() {
  if (inHand) return 'none';
  if (!complete()) return 'lift';
  if (hold >= 0) return 'none';
  const k = Q.findIndex(q => !settled(q));
  if (k >= 0) return ASKERS[k] ? ASKERS[k].id : 'none';
  return G.state.rooms.close.done ? 'none' : 'close';
}
function label(it) {
  /* a frame shows its plate without being asked, so it has a prompt only while a question is in hand */
  if (it.kind === 'frame') return hold >= 0 && done(it.room) ? G.kt('THIS ANSWERS IT', 'TAP IT AGAIN: THIS ANSWERS IT') : null;
  if (it.kind === 'asker') return hold === it.q ? 'ASK AGAIN' : 'TALK';
  if (it.kind === 'lectern') return complete() && settledCount() === Q.length ? 'HEAR THE CLOSE' : 'TALK TO VERA';
  return null;
}
const mark = it => (it.kind === 'frame' ? (done(it.room) ? it.col : C.slate) : it.kind === 'lectern' ? C.white : null);

/* every frame: whoever is walking with the player keeps up, and whoever has been answered goes to their frame */
function tick(dt, h) {
  hero = h;
  if (G.ptr.pressed) tapAt = inHand;
  if (hold >= 0) {
    const a = ASKERS[hold], d = hero.x - a.x;
    a.walking = false;
    if (Math.abs(d) > 400) a.x = hero.x - Math.sign(d) * GAP;
    else if (Math.abs(d) > GAP) { const step = Math.min(Math.abs(d) - GAP, 190 * dt); a.x += Math.sign(d) * step; a.dir = Math.sign(d); a.walking = step > 0.3; }
  }
  ASKERS.forEach(a => {
    if (!a || !a.going) return;
    const d = a.to - a.at;
    if (Math.abs(d) < 1.5) { a.at = a.to; a.going = false; } else { a.at += Math.sign(d) * Math.min(Math.abs(d), 80 * dt); a.dir = Math.sign(d); }
  });
}

/* ---------- the plate under the frame in hand ---------- */
/* the notebook's line for a room, as words: bold ones are the player's own numbers. A word that follows
   another without a space (a full stop after a number) is glued to it. */
function words(html) {
  const out = []; let bold = false, spaced = true;
  (html.replace(/×/g, 'x').match(/<b>|<\/b>|\s+|[^\s<]+/g) || []).forEach(p => {
    if (p === '<b>') bold = true; else if (p === '</b>') bold = false; else if (/^\s/.test(p)) spaced = true;
    else { out.push({ t: p.toUpperCase(), b: bold, glue: !spaced }); spaced = false; }
  });
  return out;
}
function plateText(f) {
  const room = G.state.rooms[f.room];
  if (!room || !room.done) return 'Not hung yet. This station is still to do.';
  const line = G.book.line(f.room);
  /* a step that Tomo ran says so, on a line of its own, before whatever the notebook has to say of it */
  return room.by ? 'Tomo ran this step, with default settings.' + (line ? '\n' + line : '') : line;
}
/* a text set in lines no wider than the band: each line a list of words with where they start. A new line in the text starts one here. */
function setLines(text) {
  const maxW = BAND[2] - TEXTX - 6, sp = Math.ceil(G.tw(' ', 'sm')), lines = [];
  text.split('\n').forEach(par => {
    let x = 0; lines.push([]);
    /* a group of glued words stays on one line */
    const groups = [];
    words(par).forEach(w => { if (w.glue && groups.length) groups[groups.length - 1].push(w); else groups.push([w]); });
    groups.forEach(g => {
      const gw = g.reduce((n, w) => n + Math.ceil(G.tw(w.t, 'sm')), 0);
      if (x > 0 && x + sp + gw > maxW) { lines.push([]); x = 0; }
      if (x > 0) x += sp;
      g.forEach(w => { lines[lines.length - 1].push({ t: w.t, b: w.b, x }); x += Math.ceil(G.tw(w.t, 'sm')); });
    });
  });
  return lines;
}
/* the plate of a frame, kept until its text changes. The band holds three lines: if Tomo's line and the notebook's
   do not fit in it together, the plate says who ran the step and leaves it there. */
function plate(f) {
  const text = plateText(f);
  if (f.plate && f.plate.text === text) return f.plate.lines;
  let lines = setLines(text);
  if (lines.length > 3 && text.indexOf('\n') > 0) lines = setLines(text.split('\n')[0]);
  f.plate = { text, lines };
  return lines;
}
function drawBand(f, cx) {
  const [bx, by, bw, bh] = BAND, room = G.state.rooms[f.room] || {}, ok = !!room.done, lines = plate(f);
  const px = G.clamp(f.x - cx, bx + 6, bx + bw - 7);
  R(px - 1, by - 2, 3, 1, GILT); R(px - 2, by - 1, 5, 1, GILT);
  G.panel(bx, by, bw, bh, { border: GILT, fill: INK });
  T(f.code, bx + 7, by + 5, ok ? f.col : C.steel, { f: 'smb' });
  if (ok && room.by) { R(bx + 7, by + 16, 9, 9, '#e8dc9a'); R(bx + 9, by + 19, 5, 1, C.steel); R(bx + 9, by + 21, 3, 1, C.steel); } else if (ok) G.stars(bx + 7, by + 17, room.stars);
  R(bx + TEXTX - 6, by + 4, 1, bh - 8, GILT2);
  const y0 = by + Math.round((bh - lines.length * 8) / 2);
  lines.forEach((ln, i) => ln.forEach(w => T(w.t, bx + TEXTX + w.x, y0 + i * 8, w.b ? GLOW : ok ? C.fog : C.steel)));
}
/* the question in hand: who asks, and its short form */
function drawTag() {
  const q = Q[hold], w = 28 + Math.ceil(G.tw(q.tag, 'sm')) + 8;
  G.panel(4, 159, w, 20, { border: C.amber, fill: C.ink });
  G.face(6, 161, G.LOOKS[q.who] || G.LOOKS.TOMO, false);
  T(q.tag, 28, 165, C.amber);
}

/* ---------- drawing ---------- */
/* somebody standing or walking: x is the middle, y the feet */
function figure(who, x, y, o) {
  o = o || {};
  const k = G.LOOKS[who] || G.LOOKS.TOMO, L = BODY[who] || (BODY[who] = k.shade ? SHADE : Object.assign({ pants: '#2b2a3a', shoes: C.ink }, k));
  G.person(x, y, L, o);
  const dir = o.dir || 1, px = Math.round(x) - 5, py = Math.round(y) - 20 + (o.walk && Math.floor((o.t || 0) * 9) % 2 ? -1 : 0);
  if (k.shade) { R(dir > 0 ? px + 4 : px + 3, py + 3, 1, 1, C.coral); R(dir > 0 ? px + 6 : px + 5, py + 3, 1, 1, C.coral); }
  if (k.tash) R(dir > 0 ? px + 4 : px + 2, py + 5, 4, 1, k.tash);
  if (o.hand) { const ax = dir > 0 ? px + 9 : px; R(ax, py + 3, 1, 6, L.coat); R(ax, py + 2, 1, 1, L.skin); }
}
function nameTag(name, x, y, col) {
  const w = Math.ceil(G.tw(name, 'sm')) + 8;
  G.panel(Math.round(x - w / 2), y, w, 11, { border: col || GILT2, fill: C.ink }); T(name, x, y + 1, C.fog, { a: 'center' });
}
const facing = x => (hero && hero.x < x ? -1 : 1);

/* the picture in each frame: a small emblem of its station, 30 by 26, with (x, y) its top left corner */
const face = who => (x, y) => { R(x, y, 30, 26, '#1b2647'); G.face(x + 7, y + 5, G.LOOKS[who], false); };
const ART = {
  droplets: (x, y) => { R(x, y + 11, 30, 5, '#1b2647'); R(x + 13, y + 2, 4, 9, C.oil); [5, 15, 25].forEach((dx, i) => { G.disc(x + dx, y + 13, 4, '#31457e'); if (i !== 1) G.cell(x + dx - 2, y + 11, i ? C.amber : C.cyan, 4); }); },
  cliff: (x, y) => { R(x + 3, y + 3, 1, 20, C.steel); R(x + 3, y + 22, 24, 1, C.steel); R(x + 4, y + 6, 10, 2, C.cyan); G.line(x + 14, y + 7, x + 17, y + 17, C.cyan); R(x + 17, y + 18, 9, 2, C.cyan); G.vdash(x + 15, y + 3, y + 22, C.amber, 2, 2); },
  qc: (x, y) => { [[20, 17], [23, 14], [17, 19], [24, 19], [20, 21], [16, 15], [26, 16]].forEach(q => R(x + q[0], y + q[1], 2, 2, C.cyan)); [[6, 5], [9, 8], [5, 9]].forEach(q => R(x + q[0], y + q[1], 2, 2, C.coral)); R(x + 13, y + 3, 1, 20, C.amber); R(x + 3, y + 12, 24, 1, C.amber); },
  soup: (x, y) => { for (let i = 0; i < 6; i++) R(x + 6 + i, y + 13 + i, 18 - 2 * i, 1, C.paper); R(x + 7, y + 13, 16, 2, C.oil); R(x + 4, y + 12, 22, 1, C.paper); R(x + 11, y + 20, 8, 2, C.paper); [10, 15, 20].forEach((dx, i) => R(x + dx, y + 5 + (i % 2) * 2, 1, 5, 'rgba(255,255,255,.55)')); },
  doublet: (x, y) => { G.cell(x + 3, y + 4, C.cyan, 6); G.cell(x + 22, y + 17, C.amber, 6); G.ring(x + 15, y + 13, 8, C.coral); G.cell(x + 10, y + 10, C.cyan, 6); G.cell(x + 15, y + 10, C.amber, 6); },
  review: face('REVIEWER 2'),
  norm: (x, y) => { [15, 6, 19, 9, 13].forEach((h, i) => R(x + 4 + i * 5, y + 23 - h, 3, h, i % 2 ? C.steel : C.cyan)); R(x + 3, y + 11, 24, 1, C.amber); },
  hvg: (x, y) => { const r = G.rng(7); G.line(x + 3, y + 22, x + 26, y + 14, C.steel); for (let i = 0; i < 9; i++) { const u = r(), v = r(); R(x + 3 + Math.round(u * 22), y + 20 - Math.round(u * 8 + v * 3), 2, 2, '#6f82ad'); } [[7, 8], [13, 5], [19, 8], [24, 3]].forEach(q => R(x + q[0], y + q[1], 3, 3, C.amber)); },
  pca: (x, y) => { const r = G.rng(11); for (let i = 0; i < 11; i++) { const u = r() * 21, v = (r() - 0.5) * 8; R(x + 4 + Math.round(u), y + 19 - Math.round(u * 0.6 + v), 2, 2, C.lilac); } G.line(x + 3, y + 22, x + 27, y + 6, C.amber); G.line(x + 3, y + 23, x + 27, y + 7, C.amber); },
  knn: (x, y) => { const P = [[6, 7], [14, 4], [23, 9], [10, 17], [19, 20], [25, 17]]; [[0, 1], [1, 2], [0, 3], [3, 4], [4, 5], [2, 5], [1, 3]].forEach(l => G.line(x + P[l[0]][0], y + P[l[0]][1], x + P[l[1]][0], y + P[l[1]][1], C.steel)); P.forEach(p => R(x + p[0] - 1, y + p[1] - 1, 3, 3, C.mint)); },
  /* the map is drawn from the player's own seed */
  umap: (x, y, s) => { const r = G.rng(((s.cloud || {}).seed || 3) * 97 + 5), a = r() * 6.3; G.TYPES.forEach((c, k) => { const u = a + k * 1.257, d = k ? 8 + r() * 3 : 2; G.disc(x + 15 + Math.round(Math.cos(u) * d * 1.2), y + 13 + Math.round(Math.sin(u) * d), k === 4 ? 2 : 3, c); }); },
  club: face('TOMO'),
  cut: (x, y) => { G.disc(x + 9, y + 13, 6, C.steel); G.disc(x + 9, y + 13, 4, C.ink); G.line(x + 9, y + 13, x + 12, y + 9, C.amber); [C.cyan, C.lilac, C.amber, C.mint, C.pink, C.coral, C.orange, C.teal].forEach((c, k) => R(x + 18 + (k % 2) * 5, y + 3 + Math.floor(k / 2) * 5, 4, 4, c)); },
  lineup: (x, y) => { for (let i = 0; i < 4; i++) R(x + 3, y + 5 + i * 5, 24, 1, '#2a3966'); [C.cyan, C.amber, C.mint, C.lilac].forEach((c, i) => G.cell(x + 4 + i * 6, y + 16 - (i % 2) * 2, c, 5)); R(x + 17, y + 5, 3, 3, C.coral); R(x + 18, y + 8, 1, 5, C.fog); },
  name: (x, y) => { R(x + 5, y + 3, 20, 20, C.wood); for (let i = 0; i < 3; i++) { R(x + 7, y + 5 + i * 6, 16, 4, '#5a3a28'); R(x + 12, y + 6 + i * 6, 6, 2, C.paper); } },
  oracle: (x, y) => { R(x + 6, y + 4, 18, 18, '#3d4a70'); R(x + 6, y + 4, 18, 1, 'rgba(255,255,255,.4)'); G.disc(x + 15, y + 11, 4, C.ink); G.disc(x + 15, y + 11, 2, C.mint); R(x + 9, y + 18, 12, 2, C.ink); R(x + 10, y + 17, 5, 2, C.amber); },
  chief: face('CHIEF'),
  sort: (x, y) => { const sock = (sx, sy, c) => { R(sx, sy, 4, 9, c); R(sx, sy + 7, 8, 4, c); R(sx, sy, 4, 2, C.paper); }; sock(x + 4, y + 5, C.cyan); sock(x + 17, y + 9, C.amber); G.line(x + 8, y + 8, x + 17, y + 12, C.paper); },
  wash: (x, y) => { R(x + 6, y + 3, 18, 20, '#d8d2bf'); R(x + 6, y + 3, 18, 4, '#8f8a7c'); R(x + 20, y + 4, 2, 2, C.amber); G.disc(x + 15, y + 15, 6, C.ink); G.disc(x + 15, y + 15, 4, '#3f8fb5'); R(x + 13, y + 13, 2, 2, C.cyan); R(x + 16, y + 16, 2, 2, C.amber); },
  lost: (x, y) => { for (let i = 0; i < 7; i++) R(x + 9 - i, y + 5 + i * 2, 3 + 2 * i, 2, 'rgba(246,220,140,.22)'); R(x + 8, y + 2, 5, 3, C.oil); [[5, 14], [9, 17], [13, 13], [20, 16], [24, 14], [21, 20]].forEach((q, i) => R(x + q[0], y + q[1], 2, 2, i < 3 ? C.pink : C.steel)); R(x + 22, y + 4, 1, 9, C.fog); R(x + 23, y + 4, 4, 3, C.coral); },
  counter: (x, y) => { R(x + 3, y + 20, 24, 3, C.wood); for (let i = 0; i < 5; i++) R(x + 11 - i, y + 14 + i, 8 + 2 * i, 1, C.oil); R(x + 14, y + 12, 2, 2, C.oil); R(x + 8, y + 19, 14, 1, GILT2); [3, 24].forEach(dx => { R(x + dx, y + 8, 3, 12, C.fog); R(x + dx, y + 8, 3, 2, dx < 10 ? C.coral : C.cyan); }); },
  scales: (x, y) => { R(x + 14, y + 5, 2, 16, C.oil); R(x + 9, y + 21, 12, 2, GILT2); G.line(x + 4, y + 9, x + 26, y + 6, C.oil); [[4, 9], [26, 6]].forEach(q => { R(x + q[0], y + q[1], 1, 6, C.steel); R(x + q[0] - 3, y + q[1] + 6, 7, 2, C.oil); }); },
  formula: (x, y) => { T('~', x + 3, y + 7, C.paper, { f: 'smb' }); [[11, C.cyan, 7], [20, C.amber, 7]].forEach(q => { R(x + q[0], y + 9, q[2], 6, q[1]); R(x + q[0], y + 9, q[2], 1, 'rgba(255,255,255,.5)'); }); R(x + 3, y + 19, 24, 1, C.steel); },
  stairs: (x, y) => { for (let i = 0; i < 8; i++) { const h = 2 + Math.round(i * i * 0.3); R(x + 3 + i * 3, y + 23 - h, 3, h, i < 4 ? C.amber : '#8a8474'); } G.line(x + 2, y + 22, x + 27, y + 13, C.coral); },
  census: (x, y) => { R(x + 8, y + 5, 14, 18, '#1c2420'); let yy = y + 23; [6, 5, 2, 2, 3].forEach((h, k) => { yy -= h; R(x + 8, yy, 14, h, G.TYPES[k]); }); R(x + 10, y + 2, 10, 3, '#b9b3a2'); R(x + 9, y + 6, 2, 16, 'rgba(255,255,255,.2)'); },
  readout: (x, y) => { R(x + 6, y + 3, 18, 20, C.paper); for (let i = 0; i < 4; i++) R(x + 8, y + 6 + i * 4, i === 3 ? 7 : 14, 1, C.steel); R(x + 17, y + 16, 5, 5, '#b0303a'); },
  turntable: (x, y) => { G.disc(x + 15, y + 13, 10, '#1a1c22'); G.ring(x + 15, y + 13, 10, '#565b68'); G.line(x + 6, y + 17, x + 24, y + 11, '#aab2c4'); R(x + 11, y + 9, 7, 5, '#2f6e62'); R(x + 16, y + 6, 3, 8, '#24564c'); },
  track: (x, y) => { G.disc(x + 7, y + 9, 4, C.cyan); G.disc(x + 22, y + 9, 4, C.mint); G.disc(x + 15, y + 20, 3, C.pink); R(x + 11, y + 8, 8, 1, '#aab2c4'); R(x + 11, y + 10, 8, 1, '#aab2c4'); for (let i = 0; i < 3; i++) R(x + 12 + i * 3, y + 8, 1, 3, WOOD); },
  timetable: (x, y) => { for (let i = 0; i < 5; i++) { R(x + 3, y + 3 + i * 4, 24, 3, '#1c2a44'); R(x + 4 + i * 4, y + 4 + i * 4, 3, 1, C.amber); R(x + 8 + i * 4, y + 4 + i * 4, 18 - i * 4, 1, C.steel); } },
  clock: (x, y) => { G.disc(x + 15, y + 13, 10, C.oil); G.disc(x + 15, y + 13, 8, C.paper); G.line(x + 15, y + 13, x + 15, y + 7, C.ink); G.line(x + 15, y + 13, x + 19, y + 15, C.ink); },
  board: (x, y) => { R(x + 3, y + 3, 24, 20, '#10131c'); for (let i = 0; i < 4; i++) { R(x + 5, y + 5 + i * 4, 12, 3, C.paper); R(x + 19, y + 5 + i * 4, 6, 3, C.amber); } },
  /* a station this file has no emblem for still gets a picture */
  any: (x, y) => { [9, 15, 6, 12].forEach((h, i) => R(x + 5 + i * 6, y + 22 - h, 4, h, G.TYPES[i])); R(x + 3, y + 22, 24, 1, C.steel); },
};
function drawFrame(f, x) {
  const s = G.state, room = s.rooms[f.room], ok = !!(room && room.done), lit = inHand === f, sw = since(swing[f.id]);
  const dx = sw < 0.6 && !G.reduced ? Math.round(Math.sin(sw * 22) * 2 * (1 - sw / 0.6)) : 0, fx = x - 18 + dx;
  /* a picture lamp, lit over the frame in hand */
  R(x - 1, 27, 2, 3, GILT2); R(x - 9, 29, 18, 2, lit ? GLOW : GILT2);
  R(fx, 32, 36, 32, '#16101c'); R(fx + 1, 33, 34, 30, ok ? GILT : '#7a6a58'); R(fx + 1, 33, 34, 1, ok ? '#f6e6a8' : '#93856f'); R(fx + 1, 62, 34, 1, GILT2);
  R(fx + 2, 34, 32, 28, ok ? f.col : '#3a2a30');
  if (ok) { R(fx + 3, 35, 30, 26, MAT); (ART[f.room] || ART.any)(fx + 3, 35, s); }
  else { R(fx + 3, 35, 30, 26, '#3f222c'); R(fx + 17, 38, 2, 2, '#7a6a58'); }
  if (lit) R(fx + 3, 35, 30, 26, 'rgba(255,240,180,.1)');
  /* a note where Tomo ran the step, and a ribbon where a question was answered */
  if (ok && room.by) { R(fx - 2, 30, 9, 9, '#16101c'); R(fx - 1, 31, 7, 7, '#e8dc9a'); R(fx, 33, 5, 1, C.steel); R(fx, 35, 3, 1, C.steel); }
  if (Q.some(q => q.room === f.room && settled(q))) { R(fx + 28, 36, 3, 9, C.coral); R(fx + 33, 36, 3, 9, C.coral); G.disc(fx + 32, 34, 5, C.coral); G.disc(fx + 32, 34, 3, C.amber); R(fx + 31, 33, 3, 3, C.paper); }
  const w = Math.ceil(G.tw(f.code, 'sm')) + 8;
  G.panel(Math.round(x - w / 2), 67, w, 11, { border: ok ? GILT2 : C.slate, fill: C.ink }); T(f.code, x, 68, ok ? C.fog : C.steel, { a: 'center' });
}
/* draws one thing in the hall; returns false for the things hall.js draws itself (the way out) */
function draw(it, x, o) {
  const t = G.t;
  switch (it.kind) {
    case 'frame': drawFrame(it, x); return true;
    case 'mentor':
      if (!inHand) nameTag(it.who, x, 96);
      figure(it.who, x, WALL - 1, { dir: facing(it.x), t });
      return true;
    case 'asker': {
      /* walking with the player, they are drawn in front of the furniture (see over) */
      if (hold === it.q) return true;
      const q = Q[it.q], waiting = complete();
      if (!inHand) nameTag(it.who, x, 96, waiting ? C.amber : GILT2);
      if (waiting && !inHand) { const b = Math.round(Math.sin(t * 3 + it.q)); R(x - 6, 80 + b, 12, 13, C.ink); R(x - 5, 81 + b, 10, 11, C.paper); R(x - 1, 93 + b, 2, 1, C.ink); T('?', x - 2, 82 + b, C.ink, { f: 'smb' }); }
      figure(it.who, x, WALL - 1, { dir: facing(it.x), t, hand: waiting && !!q.hand && Math.floor(t * 1.5) % 4 !== 0 });
      return true;
    }
    case 'lectern': {
      const st = G.state.rooms.close, vx = x - 30;
      /* a screen on its roller, let down a little way, with a sign under it; a low platform, Vera, and the lectern with its lamp */
      R(x - 34, 28, 68, 4, '#8f8a7c'); R(x - 34, 28, 68, 1, 'rgba(255,255,255,.35)'); R(x - 31, 32, 62, 14, '#e6dfcc'); R(x - 31, 45, 62, 1, '#b9b3a2'); R(x - 1, 46, 2, 4, '#8f8a7c');
      const w = Math.ceil(G.tw('THE REVIEW', 'sm')) + 10;
      G.panel(Math.round(x - w / 2), 52, w, 12, { border: C.paper, fill: C.ink }); T('THE REVIEW', x, 53, C.fog, { a: 'center' });
      if (st.done) G.stars(x - 13, 67, st.stars);
      R(x - 44, 128, 72, 4, WOOD); R(x - 44, 128, 72, 1, 'rgba(255,255,255,.25)');
      if (!inHand) nameTag('VERA', vx, 93, C.oil);
      figure('VERA', vx, WALL - 4, { dir: facing(it.x - 30), t });
      R(x - 9, 106, 18, 22, DARK); R(x - 8, 107, 16, 21, WOOD); R(x - 8, 107, 16, 1, 'rgba(255,255,255,.25)'); R(x - 12, 102, 24, 5, '#8a6c40'); R(x - 12, 102, 24, 1, 'rgba(255,255,255,.35)');
      R(x - 7, 99, 12, 3, C.paper); R(x + 8, 92, 1, 10, GILT2); R(x + 4, 91, 6, 2, Math.floor(t * 2) % 7 ? GLOW : GILT);
      return true;
    }
  }
  switch (it.id) {
    case 'g-book': {
      /* a stand with the book lying open on it. The page turns when it is read. */
      const tu = o.since('g-book') < 0.4;
      R(x - 1, 108, 3, 22, GILT2); R(x - 9, 129, 19, 3, DARK); R(x - 12, 102, 24, 7, WOOD); R(x - 12, 102, 24, 1, 'rgba(255,255,255,.3)');
      R(x - 10, 99, 20, 5, C.paper); R(x, 99, 1, 5, C.steel); for (let i = 0; i < 2; i++) { R(x - 8, 100 + i * 2, 6, 1, C.steel); R(x + 2, 100 + i * 2, tu ? 3 : 6, 1, C.steel); }
      if (tu) R(x + 1, 96, 5, 4, '#fff6d8');
      R(x + 12, 104, 1, 9, C.steel); R(x + 11, 113, 3, 4, C.ink);
      return true;
    }
    case 'g-bench': {
      /* a long padded bench. The seat gives when somebody sits. */
      const dip = o.since('g-bench') < 0.8 ? 1 : 0;
      R(x - 24, 117 + dip, 48, 6 - dip, VELVET); R(x - 24, 117 + dip, 48, 1, 'rgba(255,255,255,.3)'); for (let i = 0; i < 5; i++) R(x - 18 + i * 9, 119 + dip, 1, 2, '#5a1f28');
      R(x - 25, 123, 50, 2, DARK); R(x - 22, 125, 3, 7, DARK); R(x + 19, 125, 3, 7, DARK);
      return true;
    }
    case 'g-crate': {
      /* a packing crate. The lid lifts when it is opened. */
      const up = o.since('g-crate') < 0.9 ? Math.round(Math.sin(Math.min(1, o.since('g-crate') / 0.9) * Math.PI) * 5) : 0;
      R(x - 20, 106, 40, 26, DARK); R(x - 19, 107, 38, 25, '#a57a50'); for (let i = 0; i < 4; i++) R(x - 19 + i * 12, 107, 2, 25, '#8a5a3c');
      R(x - 21, 103 - up, 42, 4, '#8a5a3c'); R(x - 21, 103 - up, 42, 1, 'rgba(255,255,255,.3)');
      if (up > 2) { R(x - 12, 104 - up + 4, 8, up - 1, C.paper); R(x + 2, 105 - up + 4, 8, up - 2, C.paper); }
      R(x - 12, 115, 24, 8, C.paper); for (let i = 0; i < 2; i++) R(x - 10, 117 + i * 3, 20 - i * 6, 1, C.ink);
      return true;
    }
    case 'g-plinth': {
      /* a plinth with nothing on it, and a lamp over it that brightens when the plate is read */
      const on = o.since('g-plinth') < 2;
      R(x - 12, 108, 24, 24, '#16101c'); R(x - 11, 109, 22, 23, '#c9c2b0'); R(x - 14, 105, 28, 4, '#e6dfcc'); R(x - 11, 109, 22, 1, 'rgba(0,0,0,.2)');
      R(x - 6, 117, 12, 6, GILT); R(x - 4, 119, 8, 1, DARK); R(x - 3, 121, 6, 1, DARK);
      for (let i = 0; i < 9; i++) R(x - 2 - i, 86 + i * 2, 5 + 2 * i, 2, 'rgba(255,240,180,' + (on ? '.14' : '.06') + ')');
      R(x - 3, 82, 6, 4, GILT2);
      return true;
    }
    case 'g-rope': {
      /* two brass posts and a velvet rope, which swings when it is unhooked */
      const sw = o.since('g-rope') < 1 && !G.reduced ? Math.round(Math.sin(o.since('g-rope') * 14) * 2 * (1 - o.since('g-rope'))) : 0;
      [-22, 22].forEach(d => { R(x + d - 1, 108, 3, 22, GILT); R(x + d - 4, 129, 9, 3, GILT2); G.disc(x + d, 106, 2, GILT); });
      for (let i = -20; i <= 20; i++) { const sag = Math.round((1 - (i * i) / 400) * (6 + sw)); R(x + i, 109 + sag, 1, 3, VELVET); }
      R(x + 17, 96, 12, 9, C.ink); R(x + 18, 97, 10, 7, C.paper); R(x + 20, 99, 6, 1, C.ink); R(x + 20, 101, 4, 1, C.ink);
      return true;
    }
  }
  return false;
}
/* what the room itself adds: a picture rail in the colour of each stage with the stage's name over it, panelling, and a parquet floor */
function room(cx) {
  R(0, 26, VW, 1, '#5c3340');
  GROUPS.forEach(g => {
    const x0 = g.x0 - cx, x1 = g.x1 - cx;
    if (x1 < -4 || x0 > VW + 4) return;
    R(x0, 26, x1 - x0, 2, g.st.col); T(g.title, x0 + 1, 16, g.st.col);
  });
  for (let x = -(cx % 28); x < VW; x += 28) { R(x, 110, 1, 16, 'rgba(0,0,0,.25)'); R(x + 1, 110, 1, 16, 'rgba(255,255,255,.04)'); }
  for (let x = -(cx % 34); x < VW; x += 34) for (let k = 0; k < 4; k++) R(x + (k % 2 ? 17 : 0), 142 + k * 10, 17, 1, 'rgba(0,0,0,.22)');
}
/* in front of the furniture and behind the player: whoever walks with them, and whoever stands at an answered frame */
function over(cx, o) {
  const n = o.near();
  if (n && n.kind === 'frame') inHand = n;
  else if (n || !hero || !inHand || Math.abs(hero.x - inHand.x) > 23) inHand = null;
  ASKERS.forEach(a => {
    if (!a) return;
    /* between the wall and the floor they take a few steps, down when a question is taken and back up when it is answered */
    if (a.x < 0 && a.at !== undefined) { const x = a.at - cx; if (x > -20 && x < VW + 20) figure(a.who, x, WALL - 1 + Math.round(DROP * (1 - Math.min(1, since(a.up) / 0.3))), { dir: a.going ? a.dir : -1, walk: !!a.going, t: G.t }); }
    else if (hold === a.q) figure(a.who, a.x - cx, WALL - 1 + Math.round(DROP * Math.min(1, since(a.down) / 0.3)), { dir: a.dir, walk: a.walking || since(a.down) < 0.3, t: G.t });
  });
}
/* in front of the player: the plate of the frame in hand, and the question in hand */
function fore(cx) {
  if (inHand) drawBand(inHand, cx);
  if (hold >= 0) drawTag();
}

/* the hall's page in the notebook */
function book(found, total) {
  const n = settledCount(), full = complete();
  G.book.show({
    floor: 'The long gallery', room: 'The review', file: 'js/stages/gallery/hall.js', fileText: 'hang something in this gallery', fileTail: ' yourself.', methods: true,
    aim: full ? 'Five people have a question about your project. Walk each of them to the frame that answers it.'
      : 'The review starts when every station of the project is done. The empty frames are the ones still owed.',
    goals: [{ id: 'wall', text: 'Every frame on the wall is hung' }, { id: 'five', text: 'Settle every question: ' + n + ' of ' + Q.length },
      { id: 'close', text: 'Hear the close at the lectern' }, { id: 'e', text: 'Poke around: ' + found + ' of ' + total + ' things found' }],
    notes: [
      { id: 'g-why', open: true, html: 'A review asks one thing of every claim: what would make it wrong, and which step ruled that out. The answer is a step and the setting it was run with, which is what a methods section is for.' },
      { id: 'g-jump', open: true, html: 'Press <b>L</b>, or tap MAP, to step out to the map from anywhere. A frame hangs empty until its station is done, and a frame for a step that Tomo ran says so.' },
    ],
    term: null, termNote: 'No code in this hall. The code for each step is in the terminal of its own station.',
  });
  G.book.goal('wall', full ? true : null); G.book.goal('five', Q.length && n === Q.length ? true : null);
  G.book.goal('close', G.state.rooms.close.done ? true : null); G.book.goal('e', found === total ? true : null);
}

G.kits = G.kits || {};
const kit = G.kits.gallery = { ITEMS, LINES, W, open, draw, room, use, arrive, next, label, mark, tick, over, fore, book, line: () => null,
  /* for the close, which stands the same people behind the lectern */
  figure, stages, roomsOf, complete,
  /* test hooks: where everything is, what is in hand, what a plate says, and every line this hall can say */
  dbg: {
    frames: () => FRAMES.map(f => ({ room: f.room, code: f.code, x: f.x, stage: f.stage })), groups: () => GROUPS.map(g => ({ title: g.title, x0: g.x0, x1: g.x1 })),
    askers: () => ASKERS.map((a, k) => ({ who: a.who, room: Q[k].room, x: Math.round(a.x), home: a.home, at: a.at, settled: settled(Q[k]) })),
    hold: () => hold, inHand: () => (inHand ? inHand.room : null), complete, settled: settledCount, slips: () => (G.state.review || {}).slips || 0, lectern: () => ITEMS.find(i => i.id === 'close').x,
    plate: room => { const f = frameOf(room); return f ? { text: plateText(f), lines: plate(f).map(l => l.map(w => w.t).join(' ')), wide: Math.max.apply(null, plate(f).map(l => (l.length ? l[l.length - 1].x + G.tw(l[l.length - 1].t, 'sm') : 0))) } : null; },
    wrong: (k, room) => wrong(Q[k], frameOf(room)),
    said: () => { const out = []; Object.keys(LINES).forEach(k => LINES[k].forEach(l => out.push(l))); Object.keys(MENTOR).forEach(k => MENTOR[k].forEach(l => out.push(l)));
      (G.sys.gallery.mentor || []).forEach(l => out.push(l)); Q.forEach(q => { q.ask.forEach(l => out.push(l)); out.push(q.right, q.who + WAITS, q.who + KEEPS); if (q.own) out.push(q.own); FRAMES.forEach(f => { if (f.room !== q.room) out.push(wrong(q, f)); }); });
      return out.filter((l, i) => out.indexOf(l) === i); },
  },
  paint: ['#120d12', '#4a2733', '#c9b98a', '#3a1f29', '#120d12', '#3b2a1e', '#5a4330', '#2e2016'] };
})();
