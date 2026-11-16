/* The Laundry: what the hall looks like and what its furniture says. The walking and the
   talking are in js/world/hall.js; this file holds the things that are only in here.
   One washing line runs the length of the room and changes as the player works: two runs pegged
   apart, then pegged together, then joined by a third. */
(function () {
'use strict';
const { R, T, C, VW } = G;
const WALL = 132, W = 1100;
const BEA = { skin: C.skin3, hair: '#d9d3c4', style: 'bun', coat: '#3f8fb5', shirt: C.paper, pants: '#2a3348', shoes: C.ink, glasses: true };
const VERA = { skin: C.skin2, hair: '#3a2f3a', style: 'long', coat: '#7a2f45', shirt: '#e8d9a8', pants: '#2b2430', shoes: C.ink };
const A = C.cyan, B = C.amber, NEW = C.pink, BODY = '#d8d2bf', TRIM = '#8f8a7c';

const ITEMS = [
  { id: 'lift', kind: 'lift', x: 44, label: 'GO OUT' },
  { id: 'notice', kind: 'prop', x: 104, label: 'READ' },
  { id: 'bea', kind: 'npc', x: 172, label: 'TALK' },
  { id: 'sort', kind: 'station', x: 284, code: '4-1', name: 'SORTING TABLE', col: C.cyan, ay: 40 },
  { id: 'socks', kind: 'prop', x: 372, label: 'RUMMAGE' },
  { id: 'wash', kind: 'station', x: 466, code: '4-2', name: 'THE WASH', col: C.amber, need: 'sort', ay: 40 },
  { id: 'soap', kind: 'prop', x: 560, label: 'READ' },
  { id: 'cat', kind: 'prop', x: 630, label: 'STROKE' },
  { id: 'lost', kind: 'station', x: 716, code: '4-3', name: 'LOST AND FOUND', col: C.pink, need: 'wash', ay: 40 },
  { id: 'iron', kind: 'prop', x: 802, label: 'PRESS' },
  { id: 'vend', kind: 'prop', x: 866, label: 'BUY' },
  { id: 'counter', kind: 'station', x: 956, code: 'VERA', name: 'THE COUNTER', col: C.coral, need: 'lost', ay: 40, label: 'RING THE BELL' },
  { id: 'dryer', kind: 'prop', x: 1046, label: 'WATCH' },
];

const LINES = {
  notice: [
    "NOTICE: 'The management is not responsible for cell types lost in the wash.'",
    "NOTICE: 'Do not overload the machines. Do not overfit them either.'",
    "NOTICE: 'Lost a sock? So has everyone. Dropout is normal at this depth.'",
  ],
  socks: [
    "ODD SOCKS: A box of socks with no partner. Somebody has written 'NOT A BATCH EFFECT' on the lid.",
    'ODD SOCKS: You try to pair two of them anyway. They are both left feet.',
    'ODD SOCKS: At the bottom, a single glove. Different modality.',
  ],
  soap: [
    "SHELF: Detergents. HARMONY, 'gentle on embeddings'. SCVI, 'deep clean'. COMBAT, 'for bulk loads'.",
    "SHELF: A bottle of BBKNN. The label says it only does the neighbours' washing.",
    "SHELF: Fabric softener. 'Smooths away all variation.' You put it back, carefully.",
  ],
  cat: [
    "CAT: Asleep on the warm dryer. It has two cats' worth of fur. Possibly a doublet.",
    'CAT: You stroke it. It purrs at the same rate on Mondays and Thursdays.',
    'CAT: It opens one eye, judges your experimental design, and goes back to sleep.',
  ],
  iron: [
    'IRON: For over-smoothing. Somebody has left it face down on a UMAP.',
    'IRON: Still warm. The crease runs exactly along principal component 1.',
  ],
  vend: [
    'VENDING: This is the machine the sign in the core facility sends you to. It sells detergent.',
    'VENDING: You press B4. It thinks about it, and gives you fabric softener. No refunds.',
    "VENDING: A note taped to the glass. 'Coffee machine: next building. Under construction.'",
  ],
  dryer: [
    "DRYER: Somebody's lab coats, going round. You watch for a while. It is better than the seminar.",
    'DRYER: 40 minutes left. It has said 40 minutes for an hour.',
    'DRYER: One red sock in with the lab coats. Everything in there is going to be pink.',
  ],
  beaIntro: [
    'BEA: I am Bea. Samples come in here run on different days, and no two runs come out looking alike.',
    'BEA: We take out what the day did, and leave what the cells did. Start at the sorting table.',
  ],
  /* Bea only points the way. What each station teaches is said at the station, once. */
  bea: [
    ['BEA: The sorting table first. See what you have before you wash anything.'],
    ['BEA: The machines are next along. Mind the knob.'],
    ['BEA: A new bag came in this morning. Lost and found, along the wall.'],
    ['BEA: Vera is at the counter with three study plans, and a bell. The bell has already been rung.'],
    /* what comes next depends on the project: the pack of its cell system says */
    /* where the project's next stage is built, Bea sends the player on; where it is not, she says so */
    [() => 'BEA: The next stage ' + G.sys.runs.next + '. ' + (G.route().indexOf('runs') < G.route().length - 1 ? 'It is up the road, and it is open.' : 'The builders have not agreed on a design yet.')],
  ],
};

/* the stage's page in the notebook: its steps, and its field notes */
const GOALS = [['sort', '4-1 Sorting table: find what the two runs share'], ['wash', '4-2 The Wash: take the run out, and nothing else'], ['lost', '4-3 Lost and found: map a new sample, and check it'],
  ['counter', 'Serve the customer']];
const NOTES = [
  { id: 'w-one', open: true, html: 'Three runs of the same kind of sample: 136 cells on Monday, 132 on Thursday, and 66 a month later. Each run left its own mark on every gene. The washing line fills in as you work.' },
  { id: 'w-jump', open: true, html: 'Press <b>L</b>, or tap MAP, to step out to the map from anywhere. If a station has no data, Tomo can run the steps before it. No stars for work you did not do.' },
];
/* the first time in, Bea has something to say */
const arrive = () => (G.state.met4 ? null : { say: LINES.beaIntro, then: () => { G.state.met4 = true; G.save(); } });

const done = k => G.state.rooms[k].done;
const sock = (x, y, c) => { R(x, y, 3, 5, c); R(x, y + 4, 5, 2, c); R(x, y, 3, 1, 'rgba(255,255,255,.45)'); };

/* ---------- the washing line ---------- */
/* Twenty-four socks. Before the wash each run hangs on its own stretch of line. After it they hang
   together, kind by kind, except for the few that only Thursday had. The new load joins at the end. */
const LINE_A = 236, LINE_B = 900;
function line(cx) {
  const y0 = 20, sag = x => y0 + Math.round(Math.sin((x - LINE_A) / (LINE_B - LINE_A) * Math.PI * 6) * 1.5 + 2);
  for (let wx = LINE_A; wx < LINE_B; wx += 2) { const x = wx - cx; if (x > -2 && x < VW) R(x, sag(wx), 2, 1, '#cfc8b4'); }
  [LINE_A, LINE_B].forEach(wx => { const x = wx - cx; if (x > -6 && x < VW + 6) { R(x - 1, 12, 3, 14, '#5a4a66'); R(x - 2, 12, 5, 2, '#7a66a0'); } });
  const washed = done('wash'), mapped = done('lost'), n = 24, gap = (LINE_B - LINE_A - 60) / n;
  for (let i = 0; i < n; i++) {
    /* unwashed: Monday's socks, then a gap, then Thursday's. Washed: the two runs alternate. */
    const wx = LINE_A + 14 + i * gap + (!washed && i >= n / 2 ? 30 : 0), x = Math.round(wx - cx);
    if (x < -8 || x > VW + 8) continue;
    const odd = i >= n - 3, col = odd ? B : washed ? (i % 2 ? B : A) : (i < n / 2 ? A : B), y = sag(wx), sw = Math.round(Math.sin(G.t * 1.3 + i) * 0.6);
    R(x + 1, y - 1, 1, 3, '#8a5a3c'); sock(x + sw, y + 2, col);
    /* the socks only one run had are shorter, and hang apart from the pairs */
    if (odd) R(x + sw, y + 2, 3, 2, '#231a2c');
  }
  if (mapped) for (let i = 0; i < 4; i++) { const wx = LINE_B - 44 + i * 9, x = Math.round(wx - cx); if (x > -8 && x < VW + 8) { R(x + 1, sag(wx) - 1, 1, 3, '#8a5a3c'); sock(x, sag(wx) + 2, NEW); if (i === 3) { R(x + 5, sag(wx) + 4, 6, 7, C.paper); T('?', x + 6, sag(wx) + 3, C.ink); } } }
}

/* one front-loading machine: a body, a door, and whatever is going round behind the glass */
function machine(x, y, o) {
  R(x - 14, y, 28, 132 - y, '#16101c'); R(x - 13, y + 1, 26, 131 - y, o.off ? '#6f6b62' : BODY); R(x - 13, y + 1, 26, 2, 'rgba(255,255,255,.5)');
  R(x - 11, y + 4, 12, 4, '#231a2c'); R(x + 4, y + 4, 3, 3, o.off ? TRIM : o.col || C.mint); R(x + 8, y + 4, 3, 3, TRIM);
  const cy = y + 26; G.disc(x, cy, 10, TRIM); G.disc(x, cy, 8, o.off ? '#2a2630' : '#0e1630');
  if (!o.off) {
    for (let i = 0; i < 7; i++) {
      const a = (o.still ? 0 : G.t * 2.2) + i * 0.9, r = 2 + (i * 5) % 5, c = o.mix ? (i % 2 ? B : A) : (i < 4 ? o.only || A : o.only || B);
      const px = o.mix || o.only ? Math.cos(a) * r : Math.cos(a) * (r * 0.5) + (i < 4 ? -3 : 3);
      R(Math.round(x + px), Math.round(cy + Math.sin(a) * r), 2, 2, c);
    }
    R(x - 5, cy - 6, 3, 2, 'rgba(255,255,255,.35)');
  }
  R(x - 13, 128, 26, 3, '#16101c');
}

function plate(it, x, y, locked) {
  const label = it.code + '  ' + it.name, w = Math.ceil(G.tw(label, 'sm')) + 8;
  G.panel(x - w / 2, y, w, 12, { border: locked ? C.steel : it.col, fill: C.ink }); T(label, x, y + 1, locked ? C.steel : C.fog, { a: 'center' });
}
/* how a station was left: stars, or a note that the student did it. Up here they hang under the name plate. */
function marks(it, x) {
  const room = G.state.rooms[it.id];
  if (room.done && room.by) T('BY TOMO', x, 66, C.fog, { a: 'center' });
  else if (room.done) G.stars(x - 13, 66, room.stars);
}
/* draws one thing in the hall; returns false for the things hall.js draws itself (the way out) */
function draw(it, x, o) {
  const t = G.t, locked = o.locked(it), since = o.since;
  switch (it.id) {
    case 'sort': {
      /* a folding table with a basket for each run */
      plate(it, x, 52, locked);
      R(x - 34, 108, 68, 3, '#b9a98a'); R(x - 34, 111, 68, 2, '#8a7a5c'); R(x - 30, 113, 2, 19, '#6b5f4a'); R(x + 28, 113, 2, 19, '#6b5f4a'); G.line(x - 29, 114, x + 28, 130, '#4a4236');
      [[-20, A], [20, B]].forEach((q, k) => {
        const bx = x + q[0];
        R(bx - 11, 96, 22, 12, '#16101c'); R(bx - 10, 97, 20, 11, locked ? '#4a4452' : '#e6dfcc'); for (let i = 0; i < 5; i++) R(bx - 9 + i * 4, 98, 1, 9, 'rgba(0,0,0,.18)');
        if (!locked) for (let i = 0; i < 4; i++) sock(bx - 8 + i * 4, 91 + (i * 3 + k) % 3, q[1]);
      });
      /* once the pairs are known, a thread runs from basket to basket */
      if (done('sort')) for (let i = 0; i < 3; i++) G.line(x - 12, 93 + i * 2, x + 12, 93 + i * 2, 'rgba(255,255,255,.7)');
      marks(it, x);
      return true;
    }
    case 'wash':
      plate(it, x, 52, locked);
      machine(x - 30, 78, { off: locked, mix: done('wash') }); machine(x, 78, { off: locked, mix: done('wash'), col: it.col }); machine(x + 30, 78, { off: locked, mix: done('wash') });
      marks(it, x);
      return true;
    case 'lost': {
      /* shelves of bags nobody came back for, and a lamp that shows what daylight does not */
      plate(it, x, 52, locked);
      R(x - 30, 78, 60, 54, '#16101c'); R(x - 28, 80, 56, 52, '#3a2f48');
      for (let r = 0; r < 3; r++) {
        R(x - 28, 95 + r * 17, 56, 2, '#5a4a66');
        for (let i = 0; i < 4; i++) { const bx = x - 24 + i * 13, by = 84 + r * 17, c = locked ? '#4a4452' : [A, B, NEW, C.mint, C.lilac][(i + r * 2) % 5]; R(bx, by + 2, 10, 9, c); R(bx + 3, by, 4, 3, c); R(bx + 2, by + 5, 6, 1, 'rgba(0,0,0,.25)'); }
      }
      if (!locked) { const u = (Math.sin(t * 1.2) + 1) / 2, lx = Math.round(x - 22 + u * 44); for (let i = 0; i < 5; i++) R(lx - 5 - i, 82 + i * 9, 10 + i * 2, 9, 'rgba(190,120,255,.10)'); R(lx - 3, 78, 6, 3, '#b07cff'); }
      marks(it, x);
      return true;
    }
    case 'counter': {
      /* a counter with a bell on it. Until the plans are dealt with, Vera is waiting. */
      const here = !locked && !done('counter');
      plate(it, x, 52, locked);
      R(x - 36, 106, 72, 26, '#16101c'); R(x - 35, 107, 70, 25, '#6b5546'); R(x - 37, 104, 74, 4, '#b9a98a'); for (let i = 0; i < 5; i++) R(x - 30 + i * 14, 110, 1, 22, 'rgba(0,0,0,.2)');
      G.disc(x + 18, 101, 4, here && Math.floor(t * 6) % 6 === 0 ? C.white : C.oil); R(x + 13, 103, 11, 2, '#8a6c40'); R(x + 18, 96, 1, 2, C.oil);
      R(x - 28, 94, 14, 10, '#231a2c'); R(x - 27, 95, 12, 5, locked ? '#3a3340' : '#7be0a1'); R(x - 26, 101, 10, 2, TRIM);
      if (here) {
        /* Vera stands at the end of the counter, with a bag of washing for each day */
        const tap = Math.floor(t * 4) % 4 === 0 ? 1 : 0;
        G.person(x - 50, WALL - tap, VERA, { dir: 1, t });
        R(x - 30, 92, 10, 12, A); R(x - 28, 90, 6, 3, A); R(x - 68, 121, 12, 11, B); R(x - 65, 118, 6, 4, B);
      }
      if (done('counter')) { R(x - 6, 96, 9, 8, C.paper); for (let i = 0; i < 3; i++) R(x - 4, 98 + i * 2, 5, 1, C.steel); }
      marks(it, x);
      return true;
    }
    case 'bea':
      G.panel(x - 14, 52, 28, 12, { border: C.oil, fill: C.ink }); T('BEA', x, 53, C.oil, { a: 'center' });
      G.person(x, WALL - 11, BEA, { dir: 1, t });
      /* a folding table, and a stack of towels that is never finished */
      R(x - 26, 114, 52, 3, '#b9a98a'); R(x - 22, 117, 2, 15, '#6b5f4a'); R(x + 20, 117, 2, 15, '#6b5f4a');
      for (let i = 0; i < 4; i++) R(x + 6, 111 - i * 3, 14, 3, [A, C.paper, B, C.paper][i]);
      R(x - 20, 109, 12, 5, C.paper); R(x - 18, 111, 8, 1, C.steel);
      return true;
    case 'notice': {
      const fl = since('notice') < 0.6 ? 1 : 0;
      R(x - 18, 56 - fl, 36, 30, '#16101c'); R(x - 17, 57 - fl, 34, 28, C.paper); R(x - 17, 57 - fl, 34, 5, '#b0303a');
      for (let i = 0; i < 5; i++) R(x - 13, 66 + i * 4 - fl, 26 - (i * 5) % 9, 1, C.steel);
      R(x - 1, 54 - fl, 2, 3, C.coral);
      return true;
    }
    case 'socks': {
      const sh = since('socks') < 0.8 ? Math.round(Math.sin(t * 40)) : 0;
      R(x - 14, 114, 28, 18, '#8a6c40'); R(x - 14, 114, 28, 3, '#b08a55'); R(x - 9, 121, 18, 7, C.paper); T('ODD', x, 121, C.ink, { a: 'center' });
      [[-10, A], [-4, C.lilac], [2, B], [7, C.mint]].forEach((q, i) => sock(x + q[0] + (i % 2 ? sh : -sh), 106 + (i * 2) % 3, q[1]));
      return true;
    }
    case 'soap': {
      const wob = since('soap') < 0.8 ? Math.round(Math.sin(t * 30)) : 0;
      R(x - 22, 70, 44, 3, '#b9a98a'); R(x - 22, 96, 44, 3, '#b9a98a'); R(x - 20, 73, 2, 4, '#6b5f4a'); R(x + 18, 73, 2, 4, '#6b5f4a'); R(x - 20, 99, 2, 4, '#6b5f4a'); R(x + 18, 99, 2, 4, '#6b5f4a');
      [[-18, C.mint], [-8, C.cyan], [2, C.coral], [12, C.lilac]].forEach((q, i) => { const bx = x + q[0] + (i === 1 ? wob : 0); R(bx, 56, 8, 14, q[1]); R(bx + 2, 52, 4, 4, C.paper); R(bx + 1, 61, 6, 4, C.paper); });
      [[-16, C.amber], [-4, C.pink], [8, '#6f8ff0']].forEach(q => { R(x + q[0], 84, 10, 12, q[1]); R(x + q[0] + 3, 81, 4, 3, C.ink); R(x + q[0] + 2, 88, 6, 3, C.paper); });
      return true;
    }
    case 'cat': {
      /* a dryer, and on it a cat */
      const purr = since('cat') < 1.5, br = Math.round(Math.sin(t * (purr ? 9 : 1.6)) * 0.6);
      R(x - 14, 96, 28, 36, '#16101c'); R(x - 13, 97, 26, 35, BODY); G.disc(x, 114, 9, TRIM); G.disc(x, 114, 7, '#3a2f48');
      for (let i = 0; i < 4; i++) { const a = t * 1.4 + i * 1.6; R(Math.round(x + Math.cos(a) * 4), Math.round(114 + Math.sin(a) * 4), 2, 2, C.paper); }
      R(x - 9, 90 - br, 16, 7, '#e0a04a'); R(x + 5, 87 - br, 6, 6, '#e0a04a'); R(x + 5, 85 - br, 2, 2, '#e0a04a'); R(x + 9, 85 - br, 2, 2, '#e0a04a'); R(x - 12, 93, 5, 2, '#e0a04a');
      R(x - 6, 91 - br, 3, 5, '#b9782f'); R(x, 91 - br, 3, 5, '#b9782f');
      if (purr) { R(x + 7, 89 - br, 1, 1, C.ink); T('PRR', x + 14, 78, C.fog); } else R(x + 6, 90 - br, 3, 1, C.ink);
      return true;
    }
    case 'iron': {
      const hot = since('iron') < 1.2;
      R(x - 22, 108, 44, 3, '#a8b3c8'); R(x - 20, 111, 40, 1, '#6f7a90'); G.line(x - 14, 112, x + 12, 131, '#6b5f4a'); G.line(x + 14, 112, x - 12, 131, '#6b5f4a');
      R(x - 8, 100, 16, 6, '#c9c2d8'); R(x - 10, 105, 20, 3, '#8f8a9c'); R(x - 4, 96, 10, 3, C.ink); R(x - 4, 98, 2, 3, C.ink); R(x + 4, 98, 2, 3, C.ink);
      if (hot) for (let i = 0; i < 3; i++) { const u = (t * 1.5 + i / 3) % 1; R(x - 6 + i * 6, 96 - Math.round(u * 10), 1, 2, 'rgba(255,255,255,' + (0.7 - u * 0.7).toFixed(2) + ')'); }
      return true;
    }
    case 'vend': {
      const sh = since('vend') < 0.6 ? Math.round(Math.sin(t * 50)) : 0;
      R(x - 15 + sh, 60, 30, 72, '#16101c'); R(x - 14 + sh, 61, 28, 70, '#3f8fb5'); R(x - 11 + sh, 65, 16, 44, '#0e1630');
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { R(x - 10 + c * 5 + sh, 67 + r * 10, 4, 7, [C.mint, C.cyan, C.coral, C.lilac][(r + c) % 4]); R(x - 9 + c * 5 + sh, 69 + r * 10, 2, 2, C.paper); }
      R(x + 7 + sh, 66, 5, 8, C.ink); R(x + 8 + sh, 67, 3, 2, C.amber); R(x + 8 + sh, 78, 3, 6, TRIM); R(x - 10 + sh, 114, 20, 8, C.ink);
      if (since('vend') < 2 && (o.pokes.vend || 0) >= 2) R(x - 4, 116, 8, 5, C.pink);
      return true;
    }
    case 'dryer': {
      /* a big tumble dryer with a window worth watching */
      const fast = since('dryer') < 2 ? 4 : 1.2;
      R(x - 20, 62, 40, 70, '#16101c'); R(x - 19, 63, 38, 69, BODY); R(x - 16, 66, 20, 5, '#231a2c'); T('40', x - 14, 65, C.coral);
      G.disc(x, 98, 16, TRIM); G.disc(x, 98, 14, '#0e1630');
      for (let i = 0; i < 9; i++) { const a = t * fast + i * 0.7, r = 4 + (i * 4) % 9; R(Math.round(x + Math.cos(a) * r), Math.round(98 + Math.sin(a) * r), 3, 3, i === 4 ? '#e2504a' : C.paper); }
      R(x - 9, 87, 5, 3, 'rgba(255,255,255,.3)');
      return true;
    }
  }
  return false;
}

/* what the room itself adds: tiles on the lower wall, the washing line, and a strip light */
function room(cx) {
  for (let x = -(cx % 12); x < VW; x += 12) R(x, 108, 1, 20, 'rgba(0,0,0,.18)');
  R(0, 117, VW, 1, 'rgba(0,0,0,.18)');
  line(cx);
}

G.kits = G.kits || {};
G.kits.runs = G.laundry = { ITEMS, LINES, W, GOALS, NOTES, draw, room, arrive, line: () => null, BEA, sock,
  paint: ['#16101c', '#4b3a5e', '#7a66a0', '#2e5560', '#16101c', '#231a2c', '#34283f', '#1b1422'] };
})();
