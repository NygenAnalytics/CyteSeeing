/* The Bureau: what the hall looks like and what its furniture says. The walking and the
   talking are in js/world/hall.js; this file holds the things that are only in here.
   One big case board hangs on the wall and fills in as the player works: pins, then colours,
   then gene tags, then names, then a stamp. */
(function () {
'use strict';
const { R, T, C, VW } = G;
const WALL = 132, W = 1166;
const IDA = { skin: C.skin2, hair: '#5a2a1a', style: 'short', coat: '#b08a55', shirt: '#2a2a33', pants: '#3a3028', shoes: C.ink, hat: '#6b5230' };

const ITEMS = [
  { id: 'lift', kind: 'lift', x: 44, label: 'GO OUT' },
  { id: 'hatstand', kind: 'prop', x: 104, label: 'TRY ON' },
  { id: 'ida', kind: 'npc', x: 170, label: 'TALK' },
  { id: 'cut', kind: 'station', x: 280, code: '3-1', name: 'THE CUT', col: C.cyan, ay: 25 },
  { id: 'doughnuts', kind: 'prop', x: 372, label: 'TAKE ONE', stick: true },
  { id: 'lineup', kind: 'station', x: 452, code: '3-2', name: 'THE LINE-UP', col: C.lilac, need: 'cut', ay: 39 },
  { id: 'suspect', kind: 'prop', x: 532, label: 'QUESTION' },
  { id: 'wanted', kind: 'prop', x: 600, label: 'READ' },
  { id: 'name', kind: 'station', x: 676, code: '3-3', name: 'NAME DESK', col: C.amber, need: 'lineup', ay: 43 },
  { id: 'phone', kind: 'prop', x: 752, label: 'ANSWER' },
  { id: 'cold', kind: 'prop', x: 816, label: 'OPEN' },
  { id: 'oracle', kind: 'station', x: 892, code: '3-4', name: 'THE ORACLE', col: C.mint, need: 'name', ay: 35 },
  { id: 'blinds', kind: 'prop', x: 970, label: 'PEEK' },
  { id: 'chief', kind: 'station', x: 1048, code: 'BOSS', name: 'THE CHIEF', col: C.coral, need: 'oracle', ay: 45, label: 'KNOCK' },
  { id: 'ficus', kind: 'prop', x: 1120, label: 'WATER' },
];

const LINES = {
  hatstand: [
    'HAT STAND: A trench coat and a fedora. The pockets are full of marker pens. Of course they are.',
    'HAT STAND: You try the hat on. Your confidence interval narrows at once.',
  ],
  doughnuts: [
    'DOUGHNUTS: Evidence of a torus-shaped manifold. You eat the evidence.',
    'DOUGHNUTS: One left, with sprinkles. You count them, and then you check the count for doublets.',
    'DOUGHNUTS: The box is empty. The Chief will hear of this.',
  ],
  wanted: [
    'WANTED: THE DOUBLET. Last seen in two places at once. Do not approach. There are two of them.',
    "WANTED: AMBIENT RNA. Has been in every droplet in town. Goes by 'the soup'.",
    'WANTED: BATCH EFFECT. Travels with a confounded design. Believed to be hiding in the Laundry.',
    'MISSING: Cluster 12. Vanished when somebody changed the resolution. The family is not concerned.',
  ],
  cold: [
    "COLD CASES: A box of clusters nobody could name. The top file says 'Unknown 1'. So does the one under it.",
    /* the second file names a kind of cell: see lines() */
    '',
    "COLD CASES: A cluster labelled 'interesting'. Nobody has been interested since.",
  ],
  blinds: [
    'BLINDS: Rain on the glass. In this city it always rains, and the reads are always shallow.',
    "BLINDS: Across the street a neon sign says 'P < 0.05'. It flickers.",
  ],
  suspect: [
    "SUSPECT: A tall cell in a long coat, waiting for the line-up. 'I am one cell,' it says. In two voices.",
    'SUSPECT: The coat has four feet. You decide not to mention it.',
  ],
  suspectGone: ['BENCH: Empty. One long coat, folded. Two small hats.'],
  phone: [
    "PHONE: It rings. 'Identity Bureau? I seem to have lost mine.' Click.",
    "PHONE: It rings again. 'Is this cluster 12?' You say there is no cluster 12. A long silence.",
    "PHONE: A recorded voice. 'Your call is important to us. You are cell 258 in the queue.'",
  ],
  ficus: [
    'FICUS: The office plant. It has outlived three reference genomes.',
    'FICUS: You water it. It remains unannotated.',
  ],
  idaIntro: [
    'IDA: I am Ida. I name cells for a living. Yours are pinned to the board, and nobody knows who they are.',
    'IDA: Everything in this building ends up in a file, and the Chief reads every file. Start at the board.',
  ],
  /* Ida only points the way. What each station teaches is said at the station, once. */
  ida: [
    ['IDA: The board first. It will not cut itself.'],
    ['IDA: Clusters are numbers, not names. The line-up is next along.'],
    ['IDA: The name desk is next. Mind the drawers, they stick.'],
    ['IDA: Before the Chief sees those names, ask the machine. Then check the machine.'],
    ['IDA: The Chief is in. Knock. The Chief objects to everything, and now and then the Chief is right.'],
    ['IDA: One sample, one donor. The Laundry is where the next sample comes in. Bea runs it.'],
  ],
};

/* One line in the hall names a kind of cell, and the pack of the cell system has the word for it
   (js/systems/<id>.who.js). The hall asks for the lines each time the player walks in. */
function lines() {
  LINES.cold[1] = "COLD CASES: '" + G.sys.who.hall.vague + ", probably.' Filed in 2019. The 'probably' is underlined twice.";
  return LINES;
}
/* the stage's page in the notebook: its steps, and its field notes */
const GOALS = [['cut', '3-1 The Cut: turn the graph into clusters'], ['lineup', '3-2 The line-up: find a gene for each cluster'], ['name', '3-3 Name desk: name them, as far as the evidence goes'],
  ['oracle', '3-4 The Oracle: get a second opinion, and check it'], ['chief', 'Face the Chief']];
const NOTES = [
  { id: 'b-one', open: true, html: 'One case, one board. The sample is new: 258 cells and 178 genes, already normalised and turned into a neighbour graph and a map, the way the Cloud does it. The board on the wall fills in as you work.' },
  { id: 'b-jump', open: true, html: 'Press <b>L</b>, or tap MAP, to step out to the map from anywhere. If a station has no data, Tomo can run the steps before it. No stars for work you did not do.' },
];
/* the first time in, Ida has something to say */
const arrive = () => (G.state.met3 ? null : { say: LINES.idaIntro, then: () => { G.state.met3 = true; G.save(); } });

/* ---------- the case board ---------- */
/* the cells as pins, at their places on the map, in whatever state the case has reached */
let pins = null, warm = 0;
function board(x, t) {
  const s = G.state, done = k => s.rooms[k].done, at = G.atlas, bx = x - 60, by = 26, bw = 120, bh = 62;
  R(bx - 3, by - 3, bw + 6, bh + 6, '#3a2a1c'); R(bx - 2, by - 2, bw + 4, bh + 4, '#6b4630'); R(bx, by, bw, bh, '#a57a50');
  for (let i = 0; i < 9; i++) R(bx + 7 + i * 13, by + ((i * 7) % 5), 1, bh - 4, 'rgba(60,30,10,.12)');
  /* pins kept from another project's cells are thrown away */
  if (pins && pins.turn !== at.turn) { pins = null; warm = 0; }
  if (!pins) {
    /* the layout is worked out the first time the board is on screen, a few frames after the floor appears */
    if (++warm < 6) { T('...', x, by + 26, '#3a2a1c', { a: 'center', f: 'smb' }); return; }
    pins = at.prep().xy.map(q => [Math.round(6 + q[0] * (bw - 14)), Math.round(5 + q[1] * (bh - 12))]); pins.turn = at.turn;
  }
  const cut = done('cut'), fin = cut ? at.final() : null;
  if (fin && !pins.cent) pins.cent = fin.mem.map(m => { let a = 0, b = 0; m.forEach(i => { a += pins[i][0]; b += pins[i][1]; }); return [Math.round(a / m.length), Math.round(b / m.length)]; });
  const gone = fin ? at.gone() : -1;
  pins.forEach((q, i) => R(bx + q[0], by + q[1], 2, 2, !fin ? '#4a3a2c' : fin.lab[i] === gone ? '#8a6a4a' : at.COLS[fin.lab[i]]));
  if (!cut) { if (Math.floor(t * 1.5) % 2) T('WHO ARE THEY?', x, by + bh - 11, '#3a2a1c', { a: 'center' }); return; }
  /* gene tags from the line-up, name flags from the desk, and at the end a stamp */
  if (done('lineup') && !done('name')) pins.cent.forEach((c, k) => { if (k === gone) return; R(bx + c[0] - 3, by + c[1] - 5, 7, 4, C.paper); R(bx + c[0], by + c[1] - 6, 1, 1, C.coral); });
  if (gone >= 0) { const c = pins.cent[gone]; G.line(bx + c[0] - 4, by + c[1] - 4, bx + c[0] + 5, by + c[1] + 5, '#b0303a'); G.line(bx + c[0] - 4, by + c[1] + 5, bx + c[0] + 5, by + c[1] - 4, '#b0303a'); }
  if (done('name')) pins.cent.forEach((c, k) => { if (k === gone) return; R(bx + c[0] - 5, by + c[1] - 6, 11, 5, C.ink); R(bx + c[0] - 4, by + c[1] - 5, 9, 3, at.COLS[k]); });
  if (done('oracle')) { R(bx + bw - 15, by + 3, 11, 13, C.paper); for (let i = 0; i < 4; i++) R(bx + bw - 13, by + 5 + i * 3, 4 + (i * 3) % 4, 1, C.steel); }
  if (done('chief')) { G.panel(x - 37, by + 22, 74, 14, { border: '#b0303a', fill: 'rgba(239,233,214,.92)' }); T('CASE CLOSED', x, by + 24, '#b0303a', { a: 'center', f: 'smb' }); }
}

function plate(it, x, y, locked) {
  const label = it.code + '  ' + it.name, w = Math.ceil(G.tw(label, 'sm')) + 8;
  G.panel(x - w / 2, y, w, 12, { border: locked ? C.steel : it.col, fill: C.ink }); T(label, x, y + 1, locked ? C.steel : C.fog, { a: 'center' });
}
function marks(it, x) {
  const room = G.state.rooms[it.id];
  if (room.done && room.by) T('BY TOMO', x, 121, C.fog, { a: 'center' });
  else if (room.done) G.stars(x - 13, 121, room.stars);
}

/* draws one thing in the hall; returns false for the things hall.js draws itself (the way out) */
function draw(it, x, o) {
  const s = G.state, t = G.t, locked = o.locked(it), since = o.since;
  switch (it.id) {
    case 'cut':
      board(x, t);
      plate(it, x, 96, locked);
      /* a lectern with the dial on it */
      R(x - 9, 112, 18, 20, '#2a1d16'); R(x - 11, 110, 22, 3, '#6b4630');
      G.disc(x, 108, 4, C.ink); G.line(x, 108, x + Math.round(Math.cos(t * 0.8) * 3), 108 + Math.round(Math.sin(t * 0.8) * 3), it.col);
      marks(it, x);
      return true;
    case 'lineup': {
      /* a window onto the line-up room: a height chart, and the suspects standing against it */
      R(x - 34, 40, 68, 50, '#140e0c'); R(x - 32, 42, 64, 46, locked ? '#1c1714' : '#2b3340');
      if (!locked) {
        for (let i = 0; i < 5; i++) R(x - 32, 48 + i * 8, 64, 1, 'rgba(255,255,255,.10)');
        const cols = G.atlas.COLS, done = s.rooms.lineup.done;
        [0, 2, 4, 5, 6].forEach((k, i) => { const cx = x - 29 + i * 12, bob = Math.round(Math.sin(t * 2 + i) * 0.6); G.cell(cx, 76 + bob, s.rooms.cut.done ? cols[k] : '#7a7f8c', 8); if (done) { R(cx - 1, 84, 10, 4, C.paper); R(cx + 1, 85, 6, 1, C.ink); } });
        /* two cells in a trench coat: the doublet cluster has turned up to the line-up */
        R(x - 32, 42, 64, 46, 'rgba(180,220,255,.06)'); G.line(x - 28, 84, x - 6, 44, 'rgba(255,255,255,.08)');
      } else T('NO DATA', x, 60, '#4a4038', { a: 'center' });
      plate(it, x, 96, locked);
      R(x - 12, 114, 24, 18, '#2a1d16'); R(x - 14, 112, 28, 3, '#6b4630'); R(x - 3, 106, 6, 6, C.ink); R(x - 2, 107, 4, 2, locked ? C.steel : it.col);
      marks(it, x);
      return true;
    }
    case 'name': {
      /* filing cabinets: a drawer inside a drawer inside a drawer */
      const open = !locked && Math.floor(t * 0.7) % 4 === 0;
      [-22, 0, 22].forEach((d, i) => {
        R(x + d - 10, 44, 20, 46, '#140e0c'); R(x + d - 9, 45, 18, 44, locked ? '#3a332c' : '#6f7a66');
        for (let r = 0; r < 4; r++) {
          const out = open && i === 1 && r === 1 ? 2 : 0;
          R(x + d - 8, 47 + r * 11 + out, 16, 9, locked ? '#2f2a25' : '#8b9680'); R(x + d - 3, 50 + r * 11 + out, 6, 2, C.ink);
          if (s.rooms.name.done) R(x + d - 6, 48 + r * 11 + out, 5, 1, G.atlas.COLS[(i * 4 + r) % 8]);
        }
      });
      plate(it, x, 96, locked);
      R(x - 16, 116, 32, 16, '#4a3626'); R(x - 18, 114, 36, 3, '#6b4630'); R(x - 12, 108, 10, 6, C.paper); R(x + 4, 110, 8, 4, it.col);
      marks(it, x);
      return true;
    }
    case 'oracle': {
      /* a fortune-teller cabinet that takes cartridges */
      const on = !locked;
      R(x - 17, 36, 34, 96, '#140e0c'); R(x - 15, 38, 30, 92, '#5a2f3a'); R(x - 15, 38, 30, 3, '#8a4a58');
      R(x - 11, 44, 22, 26, C.ink); R(x - 10, 45, 20, 24, on ? '#1a2a38' : '#15110f');
      if (on) { G.disc(x, 58, 6, Math.floor(t * 2) % 2 ? '#7be0a1' : '#4aa878'); R(x - 2, 56, 4, 3, 'rgba(255,255,255,.6)'); R(x - 4, 63, 8, 4, '#3a2a40'); for (let i = 0; i < 3; i++) { const u = (t * 0.5 + i / 3) % 1; R(x - 7 + i * 6, 52 - Math.round(u * 6), 1, 1, 'rgba(255,255,255,' + (0.7 - u * 0.7).toFixed(2) + ')'); } }
      R(x - 9, 76, 18, 6, C.ink); R(x - 7, 78, 14, 2, on ? '#33707a' : '#2a2420');
      R(x - 9, 86, 18, 5, C.ink); if (s.rooms.oracle.done) R(x - 6, 88, 12, 8 + Math.round(Math.abs(Math.sin(t)) * 2), C.paper);
      plate(it, x, 96, locked);
      T('25c', x, 110, on ? C.amber : C.steel, { a: 'center' });
      marks(it, x);
      return true;
    }
    case 'chief': {
      /* a frosted glass door with a light on behind it */
      const in_ = !locked, sway = Math.round(Math.sin(t * 0.6) * 5);
      R(x - 19, 46, 38, 86, '#140e0c'); R(x - 17, 48, 34, 84, '#4a3626');
      R(x - 13, 52, 26, 40, in_ ? '#c9b78a' : '#3a332c');
      if (in_) { R(x - 4 + sway, 66, 8, 8, 'rgba(40,25,15,.55)'); R(x - 7 + sway, 74, 14, 18, 'rgba(40,25,15,.55)'); R(x - 6 + sway, 64, 12, 2, 'rgba(40,25,15,.55)'); }
      T('CHIEF', x, 54, in_ ? '#3a2a1c' : '#55493f', { a: 'center' });
      R(x + 11, 110, 3, 5, C.oil);
      plate(it, x, 96, locked);
      marks(it, x);
      return true;
    }
    case 'ida':
      G.panel(x - 14, 52, 28, 12, { border: C.oil, fill: C.ink }); T('IDA', x, 53, C.oil, { a: 'center' });
      G.person(x, WALL - 11, IDA, { dir: 1, t });
      R(x - 26, 116, 52, 16, '#4a3626'); R(x - 26, 114, 52, 3, '#6b4630');
      /* a desk lamp and a typewriter */
      R(x + 14, 100, 2, 14, C.ink); R(x + 9, 97, 12, 4, '#2e9a68'); R(x + 7, 101, 16, 13, 'rgba(246,220,140,.10)');
      R(x - 20, 106, 14, 8, C.ink); R(x - 19, 103, 12, 4, C.paper); R(x - 18, 108 + (Math.floor(t * 6) % 3 === 0 ? 1 : 0), 10, 2, C.steel);
      return true;
    case 'hatstand': {
      const sw = since('hatstand') < 1 ? Math.round(Math.sin(t * 24)) : 0;
      R(x - 1, 74, 2, 58, '#3a2a1c'); R(x - 7, 130, 14, 2, '#3a2a1c'); R(x - 7, 78, 14, 2, '#3a2a1c');
      R(x - 9 + sw, 80, 10, 30, '#b08a55'); R(x - 5 + sw, 82, 1, 26, '#7a5c36'); R(x - 2 + sw, 70, 10, 2, '#6b5230'); R(x + sw, 66, 6, 4, '#6b5230');
      return true;
    }
    case 'doughnuts': {
      const left = Math.max(0, 3 - (o.pokes.doughnuts || 0));
      R(x - 16, 112, 32, 20, '#4a3626'); R(x - 16, 110, 32, 3, '#6b4630');
      R(x - 12, 104, 24, 6, C.pink); R(x - 12, 104, 24, 1, C.paper);
      for (let i = 0; i < left; i++) { R(x - 10 + i * 8, 100, 6, 4, '#c98a4a'); R(x - 8 + i * 8, 101, 2, 2, '#4a3626'); R(x - 10 + i * 8, 100, 6, 1, i % 2 ? C.pink : '#6b3a1c'); }
      /* a mug of coffee keeps the box company */
      R(x + 6, 99, 6, 5, C.paper); R(x + 12, 100, 2, 3, C.paper); if (Math.floor(t * 3) % 2) R(x + 8, 96, 1, 2, 'rgba(255,255,255,.4)');
      return true;
    }
    case 'wanted': {
      const fl = since('wanted') < 0.6 ? 1 : 0;
      [[-15, 60, C.pink], [3, 58, C.cyan], [-6, 82, C.amber]].forEach((q, i) => {
        R(x + q[0], q[1] - (fl && i === 1 ? 1 : 0), 15, 20, C.paper); R(x + q[0] + 2, q[1] + 2, 11, 2, C.ink);
        G.cell(x + q[0] + 4, q[1] + 6, q[2], 7); if (i === 0) G.cell(x + q[0] + 6, q[1] + 8, q[2], 7);
        R(x + q[0] + 2, q[1] + 15, 11, 1, C.steel); R(x + q[0] + 2, q[1] + 17, 8, 1, C.steel); R(x + q[0] + 7, q[1] - 1, 1, 1, C.coral);
      });
      return true;
    }
    case 'cold': {
      const open = since('cold') < 1.2;
      R(x - 14, 106, 28, 26, '#6b5230'); R(x - 14, 106, 28, 3, '#8a6c40'); R(x - 9, 113, 18, 8, C.paper); T('COLD', x, 113, C.ink, { a: 'center' });
      R(x - 12, 100 - (open ? 5 : 0), 24, 6, '#7a5c36');
      if (open) { R(x - 8, 99, 5, 8, C.paper); R(x - 1, 97, 5, 10, '#d8d2bf'); R(x + 6, 100, 4, 7, C.paper); }
      return true;
    }
    case 'blinds': {
      const peek = since('blinds') < 1.5;
      R(x - 24, 44, 48, 50, '#140e0c'); R(x - 22, 46, 44, 46, '#0e1626');
      for (let i = 0; i < 9; i++) { const u = (t * 60 + i * 23) % 46; R(x - 20 + (i * 5) % 40, 46 + u, 1, 3, 'rgba(160,200,255,.35)'); }
      R(x + 6, 52, 12, 5, Math.floor(t * 7) % 9 ? '#f0655f' : '#5a1f2a');
      for (let r = 0; r < 9; r++) if (!(peek && (r === 4 || r === 5))) R(x - 22, 47 + r * 5, 44, 3, '#8a7a5c');
      R(x + 20, 46, 1, 46, '#3a2a1c');
      return true;
    }
    case 'suspect': {
      /* a bench outside the line-up room. Until the line-up is over, somebody tall is waiting on it. */
      const here = !s.rooms.lineup.done, sh = since('suspect') < 0.8 ? Math.round(Math.sin(t * 40)) : 0, col = G.atlas.COLS[7];
      R(x - 20, 120, 40, 3, '#8a5a3c'); R(x - 18, 123, 2, 9, '#6b4630'); R(x + 16, 123, 2, 9, '#6b4630'); R(x - 20, 108, 40, 2, '#6b4630'); R(x - 19, 110, 2, 10, '#6b4630'); R(x + 17, 110, 2, 10, '#6b4630');
      if (here) {
        R(x - 5 + sh, 102, 10, 18, '#b08a55'); R(x + sh, 104, 1, 16, '#7a5c36'); R(x - 6 + sh, 110, 2, 8, '#b08a55'); R(x + 5 + sh, 110, 2, 8, '#b08a55');
        G.cell(x - 4 + sh, 94, col, 8); G.cell(x - 4 + sh, 87, col, 8); R(x - 6 + sh, 86, 12, 2, '#6b5230'); R(x - 3 + sh, 82, 7, 4, '#6b5230');
        R(x - 5, 128, 3, 2, C.ink); R(x - 1, 128, 3, 2, C.ink); R(x + 3, 128, 3, 2, C.ink); R(x + 7, 128, 3, 2, C.ink);
      } else { R(x - 8, 116, 16, 4, '#b08a55'); R(x - 8, 116, 16, 1, '#c9a070'); R(x + 10, 117, 7, 1, '#6b5230'); R(x + 12, 115, 4, 2, '#6b5230'); R(x - 16, 117, 7, 1, '#6b5230'); R(x - 15, 115, 4, 2, '#6b5230'); }
      return true;
    }
    case 'phone': {
      const ring = since('phone') < 1 ? Math.round(Math.sin(t * 60)) : 0;
      R(x - 12, 114, 24, 18, '#4a3626'); R(x - 14, 112, 28, 3, '#6b4630');
      R(x - 8 + ring, 104, 16, 8, C.ink); R(x - 10 + ring, 100, 20, 4, C.ink); R(x - 10 + ring, 100, 4, 6, C.ink); R(x + 6 + ring, 100, 4, 6, C.ink);
      G.ring(x + ring, 108, 3, C.fog); R(x + ring, 108, 1, 1, C.fog);
      if (ring || since('phone') < 1) { T('!', x + 12, 92, C.amber, { f: 'smb' }); T('!', x - 15, 94, C.amber); }
      return true;
    }
    case 'ficus': {
      const sw = since('ficus') < 1 ? Math.round(Math.sin(t * 30)) : 0;
      R(x - 6, 118, 12, 14, '#8a5a3c'); R(x - 7, 117, 14, 2, '#a06c48');
      R(x - 1 + sw, 92, 2, 26, '#5a4028'); [[-8, 88, 9, 8], [1, 84, 9, 9], [-5, 78, 8, 8], [3, 96, 7, 7], [-9, 100, 7, 6]].forEach(q => R(x + q[0] + sw, q[1], q[2], q[3], q[1] % 3 ? C.green : '#3aa878'));
      if (since('ficus') < 1.5) for (let i = 0; i < 3; i++) R(x - 3 + i * 3, 110 + ((t * 40 + i * 5) % 8), 1, 2, 'rgba(140,210,255,.8)');
      return true;
    }
  }
  return false;
}

/* what the room itself adds to its walls: light through blinds, and a slow fan */
function room(cx) {
  for (let wx = 150; wx < W; wx += 300) {
    const x = wx - cx; if (x < -60 || x > VW + 60) continue;
    for (let i = 0; i < 6; i++) R(x - 40 + i * 2, 20 + i * 14, 80 - i * 4, 5, 'rgba(246,220,140,.035)');
  }
  const fx = 640 - cx;
  if (fx > -30 && fx < VW + 30) { const a = G.reduced ? 0.4 : G.t * 1.7; R(fx - 1, 9, 2, 6, '#3a2a1c'); for (let b = 0; b < 3; b++) { const an = a + b * 2.094; G.line(fx, 15, fx + Math.round(Math.cos(an) * 16), 15 + Math.round(Math.sin(an) * 3), '#6b5546'); } }
}

/* a thing whose line depends on how far the case has got */
function line(id) { return id === 'suspect' && G.state.rooms.lineup.done ? LINES.suspectGone[0] : null; }

G.kits = G.kits || {};
G.kits.who = G.bureau = { ITEMS, get LINES() { return lines(); }, W, GOALS, NOTES, draw, room, line, arrive, IDA, plate, marks,
  paint: ['#140e0c', '#4a3a33', '#6b5546', '#33261f', '#140e0c', '#2a1d16', '#3d2b20', '#20150f'] };
})();
