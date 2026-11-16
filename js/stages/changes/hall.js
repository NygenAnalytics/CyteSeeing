/* The Weigh House: what the hall looks like and what its furniture says. The walking and the
   talking are in js/world/hall.js; this file holds the things that are only in here.
   An old public weigh house: brass scales, weights, and a wall of ledgers. Over every station
   hangs a small balance, which sits crooked until the station is done. */
(function () {
'use strict';
const { R, T, C, VW } = G;
const WALL = 132, W = 1100;
const AMARA = { skin: '#7a4a30', hair: '#16121c', style: 'curly', coat: '#2f5d4a', shirt: '#d8b45a', pants: '#2a2620', shoes: C.ink };
const VERA = { skin: C.skin2, hair: '#3a2f3a', style: 'long', coat: '#7a2f45', shirt: '#e8d9a8', pants: '#2b2430', shoes: C.ink };
const BRASS = C.oil, DULL = '#8a6c40', WOOD = '#6b5134', DARK = '#3a2c1e', STONE = '#8a8474', INK = '#14100c';
const RESP = C.coral, REST = '#6f8ff0';

const ITEMS = [
  { id: 'lift', kind: 'lift', x: 44, label: 'GO OUT' },
  { id: 'rules', kind: 'prop', x: 108, label: 'READ' },
  { id: 'amara', kind: 'npc', x: 176, label: 'TALK' },
  { id: 'scales', kind: 'station', x: 292, code: '5-1', name: 'THE SCALES', col: C.oil, ay: 40 },
  { id: 'weights', kind: 'prop', x: 386, label: 'LIFT' },
  { id: 'formula', kind: 'station', x: 480, code: '5-2', name: 'FORMULA BENCH', col: C.cyan, need: 'scales', ay: 40 },
  { id: 'sacks', kind: 'prop', x: 572, label: 'LOOK' },
  { id: 'dome', kind: 'prop', x: 638, label: 'LOOK' },
  { id: 'stairs', kind: 'station', x: 728, code: '5-3', name: 'THE STAIRS', col: C.lilac, need: 'formula', ay: 40 },
  { id: 'stamps', kind: 'prop', x: 818, label: 'TRY' },
  { id: 'census', kind: 'station', x: 908, code: '5-4', name: 'THE CENSUS', col: C.mint, need: 'stairs', ay: 40 },
  { id: 'readout', kind: 'station', x: 1024, code: 'VERA', name: 'THE READ-OUT', col: C.coral, need: 'census', ay: 40, label: 'HAND IT IN' },
];

const LINES = {
  rules: [
    "RULES OF THE HOUSE: 'No thumbs on the scale. This includes thumbs you did not know you had.'",
    "RULES OF THE HOUSE: 'Outliers may not be removed from the premises without a reason in writing.'",
    "RULES OF THE HOUSE: 'The weighmaster does not negotiate p-values. Please stop asking.'",
  ],
  weights: [
    'WEIGHTS: A rack of brass weights, largest to smallest. The smallest is marked 0.05 and worn shiny from handling.',
    "WEIGHTS: One slot is empty. The label under it reads 'n'. Somebody always needs a bigger one.",
    "WEIGHTS: You lift the heaviest. It is stamped 'PRIOR'. You put it back before anyone sees.",
  ],
  sacks: [
    'SACKS: Grain, one sack for each patient. One sack is five times the size of the others, and looks pleased with itself.',
    'SACKS: A mouse looks out of the big sack. It has been sampling, without replacement.',
    "SACKS: A tag on the smallest sack. 'Underpowered. Handle with care.'",
  ],
  dome: [
    'GLASS DOME: The house standard, under glass. Everything in here is weighed against it. Nobody has ever weighed it.',
    "GLASS DOME: A card beside it. 'Believed not to change. Do not breathe on it.'",
    'GLASS DOME: You breathe on it. Somewhere, a result becomes slightly harder to reproduce.',
  ],
  stamps: [
    "STAMPS: A rack of rubber stamps. SIGNIFICANT. NOT SIGNIFICANT. One reads 'TRENDING', and has been filed flat.",
    "STAMPS: The ink pad for 'NOVEL' is dry. The pad for 'AS EXPECTED' has never been opened.",
    "STAMPS: At the back, a stamp that reads 'MORE PATIENTS NEEDED'. The handle is worn down to the wood.",
  ],
  amaraIntro: [
    'AMARA: Amara. I keep the scales. In this house a thing is weighed before anyone is allowed to believe it.',
    'AMARA: Your twelve patients are on the books. Six responded and six did not. Start at the scales.',
  ],
  /* Amara only points the way. What each station teaches is said at the station, once. */
  amara: [
    ['AMARA: The scales first. Bring nothing but the grain.'],
    ['AMARA: The formula bench is next along. Mind your fingers on the tiles.'],
    ['AMARA: Two hundred genes are waiting on the stairs. The ruler is by the bottom step.'],
    ['AMARA: The census jars, along the wall. Count before you conclude.'],
    ['AMARA: Vera is at the read-out desk, and wants one sentence. Give her one that holds.'],
    /* what comes next depends on the project: the pack of its cell system says */
    [() => 'AMARA: It is all on the books now. The next stage ' + G.sys.changes.next + '. The builders are still arguing over the plans.'],
  ],
};

/* the stage's page in the notebook: its steps, and its field notes */
const GOALS = [['scales', '5-1 The Scales: weigh donors, not cells'], ['formula', '5-2 Formula bench: say what the test should answer'], ['stairs', '5-3 The Stairs: test many genes, and keep the false ones few'],
  ['census', '5-4 The Census: find which cell types changed in number'], ['readout', 'Give Vera one sentence for the clinic']];
const NOTES = [
  { id: 'h-one', open: true, html: 'Twelve patients, each sampled before and after treatment: 24 samples, five cell types in each. Six patients responded. Everything in this house is worked out from those samples.' },
  { id: 'h-jump', open: true, html: 'Press <b>L</b>, or tap MAP, to step out to the map from anywhere. If a station has no data, Tomo can run the steps before it. No stars for work you did not do.' },
];
/* the first time in, Amara has something to say */
const arrive = () => (G.state.met5 ? null : { say: LINES.amaraIntro, then: () => { G.state.met5 = true; G.save(); } });

const done = k => G.state.rooms[k].done;

function plate(it, x, y, locked) {
  const label = it.code + '  ' + it.name, w = Math.ceil(G.tw(label, 'sm')) + 8;
  G.panel(x - w / 2, y, w, 12, { border: locked ? C.steel : it.col, fill: C.ink }); T(label, x, y + 1, locked ? C.steel : C.fog, { a: 'center' });
}
/* how a station was left: stars, or a note that the student did it */
function marks(it, x) {
  const room = G.state.rooms[it.id];
  if (room.done && room.by) T('BY TOMO', x, 66, C.fog, { a: 'center' });
  else if (room.done) G.stars(x - 13, 66, room.stars);
}
/* a small balance hanging over a station: crooked until the station is done, then level */
function balance(x, ok, locked) {
  const c = locked ? '#5a5346' : BRASS, sway = ok || locked || G.reduced ? 0 : Math.round(Math.sin(G.t * 1.7 + x) * 1), dy = ok ? 0 : 3 + sway;
  R(x, 14, 1, 10, '#5a5346'); R(x - 1, 23, 3, 3, c);
  G.line(x - 13, 25 + dy, x + 13, 25 - dy, c);
  [[-13, dy], [13, -dy]].forEach(q => { const px = x + q[0], py = 25 + q[1]; R(px, py, 1, 9, '#5a5346'); R(px - 5, py + 9, 11, 2, c); R(px - 4, py + 11, 9, 1, DULL); });
  if (ok) { R(x - 2, 28, 5, 5, '#b0303a'); R(x - 1, 29, 3, 3, '#e2504a'); }
}
/* a brass weight: a body and a knob */
const weight = (x, y, w, h, c) => { R(x, y, w, h, c || BRASS); R(x, y, w, 1, 'rgba(255,255,255,.45)'); R(x + Math.floor(w / 2) - 1, y - 2, 2, 2, c || BRASS); R(x, y + h - 1, w, 1, DULL); };

/* draws one thing in the hall; returns false for the things hall.js draws itself (the way out) */
function draw(it, x, o) {
  const t = G.t, locked = o.locked(it), since = o.since;
  switch (it.id) {
    case 'scales': {
      /* the great balance: loose grain in the pans, and weights once the donors have been bagged */
      const ok = done('scales'), dy = locked || ok ? 0 : 4;
      plate(it, x, 52, locked); balance(x, ok, locked);
      const c = locked ? '#6f6b62' : BRASS;
      R(x - 12, 128, 24, 4, DARK); R(x - 2, 82, 4, 46, c); R(x - 1, 82, 1, 46, 'rgba(255,255,255,.3)'); G.disc(x, 81, 3, c);
      G.line(x - 30, 84 + dy, x + 30, 84 - dy, c); G.line(x - 30, 85 + dy, x + 30, 85 - dy, DULL);
      [[-30, dy, RESP], [30, -dy, REST]].forEach(q => {
        const px = x + q[0], py = 85 + q[1];
        G.line(px, py, px - 8, py + 22, '#5a5346'); G.line(px, py, px + 8, py + 22, '#5a5346');
        R(px - 11, py + 22, 23, 3, c); R(px - 9, py + 25, 19, 1, DULL);
        if (locked) return;
        if (ok) [[-8, 6], [-2, 8], [4, 5]].forEach(v => weight(px + v[0], py + 22 - v[1], 5, v[1], BRASS));
        else for (let i = 0; i < 16; i++) R(px - 8 + (i * 5) % 17, py + 20 - (i % 3) - (q[0] < 0 && i % 2 ? 2 : 0), 2, 2, i % 4 ? q[2] : C.paper);
      });
      marks(it, x);
      return true;
    }
    case 'formula': {
      /* a workbench, a slate with a formula half written, and tiles */
      const ok = done('formula');
      plate(it, x, 52, locked); balance(x, ok, locked);
      R(x - 30, 76, 60, 30, INK); R(x - 28, 78, 56, 26, locked ? '#2a2620' : '#23302b'); R(x - 28, 78, 56, 1, 'rgba(255,255,255,.15)');
      if (!locked) { T('~', x - 24, 84, C.paper, { f: 'smb' }); [[-14, 12, C.cyan], [2, 10, C.amber]].forEach((q, i) => { if (i === 0 || ok) R(x + q[0], 87, q[1], 5, q[2]); }); if (ok) T('+', x - 1, 84, C.paper); else if (Math.floor(t * 2) % 2) R(x + 2, 87, 2, 5, C.paper); }
      R(x - 34, 110, 68, 4, WOOD); R(x - 34, 114, 68, 2, DARK); R(x - 30, 116, 3, 16, DARK); R(x + 27, 116, 3, 16, DARK); R(x - 27, 122, 54, 2, DARK);
      if (!locked) [[-26, C.cyan], [-14, C.amber], [-2, C.pink], [10, C.mint], [20, C.lilac]].forEach(q => { R(x + q[0], 105, 9, 5, q[1]); R(x + q[0], 105, 9, 1, 'rgba(255,255,255,.5)'); });
      marks(it, x);
      return true;
    }
    case 'stairs': {
      /* stone steps that climb to the right, and a ruler hinged at the foot */
      const ok = done('stairs');
      plate(it, x, 52, locked); balance(x, ok, locked);
      for (let i = 0; i < 9; i++) {
        const h = 2 + Math.round(i * i * 0.62), sx = x - 32 + i * 7, lit = ok && i < 5;
        R(sx, 132 - h, 7, h, locked ? '#4a463e' : lit ? C.amber : STONE); R(sx, 132 - h, 7, 1, 'rgba(255,255,255,.35)'); R(sx + 6, 132 - h, 1, h, 'rgba(0,0,0,.25)');
      }
      if (!locked) { const lift = ok ? 14 : 5 + Math.round(Math.sin(t * 0.9) * 3); G.line(x - 33, 131, x + 30, 131 - lift, C.paper); G.line(x - 33, 130, x + 30, 130 - lift, '#b0303a'); R(x - 35, 129, 4, 4, BRASS); }
      marks(it, x);
      return true;
    }
    case 'census': {
      /* jars on a shelf, each filled in layers */
      const ok = done('census'), cols = G.TYPES;
      plate(it, x, 52, locked); balance(x, ok, locked);
      R(x - 34, 118, 68, 3, WOOD); R(x - 34, 121, 68, 2, DARK); R(x - 30, 123, 3, 9, DARK); R(x + 27, 123, 3, 9, DARK);
      [[-27, 0], [-10, 1], [7, 0], [24, 2]].forEach((q, n) => {
        const jx = x + q[0] - 6, sh = q[1] === 2 ? [10, 10, 4, 4, 8] : q[1] === 1 ? [13, 5, 5, 4, 9] : [13, 5, 5, 5, 8];
        R(jx - 1, 80, 14, 38, INK); R(jx, 81, 12, 36, '#1c2420'); R(jx + 2, 77, 8, 4, locked ? '#4a463e' : '#b9b3a2');
        if (locked) return;
        let y = 117; sh.forEach((h, k) => { y -= h; R(jx, y, 12, h, cols[k]); R(jx, y, 12, 1, 'rgba(255,255,255,.3)'); });
        R(jx + 1, 82, 2, 34, 'rgba(255,255,255,.18)');
        if (n === 3 && !ok && Math.floor(t * 2) % 2) R(jx + 3, 72, 6, 3, C.paper);
      });
      marks(it, x);
      return true;
    }
    case 'readout': {
      /* a high desk with a speaking tube to the clinic. Until the sentence is handed in, Vera is waiting. */
      const here = !locked && !done('readout');
      plate(it, x, 52, locked); balance(x, done('readout'), locked);
      R(x - 24, 100, 48, 32, INK); R(x - 23, 101, 46, 31, WOOD); R(x - 27, 97, 54, 4, '#8a6c40'); for (let i = 0; i < 4; i++) R(x - 18 + i * 12, 104, 1, 28, 'rgba(0,0,0,.25)');
      R(x + 19, 80, 3, 17, locked ? '#5a5346' : BRASS); R(x + 15, 76, 11, 6, locked ? '#5a5346' : BRASS); R(x + 17, 78, 7, 2, INK);
      if (!locked) { R(x - 16, 91, 20, 6, C.paper); for (let i = 0; i < 2; i++) R(x - 14, 93 + i * 2, done('readout') ? 16 : 9, 1, C.steel); }
      if (done('readout')) { R(x - 2, 90, 5, 5, '#b0303a'); R(x - 1, 91, 3, 3, '#e2504a'); }
      if (here) { const tap = Math.floor(t * 4) % 4 === 0 ? 1 : 0; G.person(x - 40, WALL - tap, VERA, { dir: 1, t }); }
      marks(it, x);
      return true;
    }
    case 'amara':
      G.panel(x - 18, 52, 36, 12, { border: BRASS, fill: C.ink }); T('AMARA', x, 53, BRASS, { a: 'center' });
      G.person(x, WALL - 11, AMARA, { dir: 1, t });
      /* a clerk's desk: a ledger lying open, and a hand balance */
      R(x - 24, 113, 48, 4, WOOD); R(x - 24, 117, 48, 2, DARK); R(x - 20, 119, 3, 13, DARK); R(x + 17, 119, 3, 13, DARK);
      R(x - 20, 109, 18, 4, C.paper); R(x - 11, 109, 1, 4, C.steel); for (let i = 0; i < 2; i++) { R(x - 18, 110 + i * 2, 6, 1, C.steel); R(x - 9, 110 + i * 2, 6, 1, C.steel); }
      R(x + 13, 100, 1, 13, BRASS); G.line(x + 7, 101, x + 19, 103, BRASS); R(x + 5, 104, 5, 1, BRASS); R(x + 17, 106, 5, 1, BRASS);
      return true;
    case 'rules': {
      const fl = since('rules') < 0.6 ? 1 : 0;
      R(x - 19, 56 - fl, 38, 34, INK); R(x - 18, 57 - fl, 36, 32, '#e6dcc0'); R(x - 18, 57 - fl, 36, 6, DULL);
      for (let i = 0; i < 6; i++) R(x - 14, 67 + i * 4 - fl, 28 - (i * 7) % 11, 1, '#6b5f4a');
      R(x - 1, 54 - fl, 2, 3, BRASS);
      return true;
    }
    case 'weights': {
      /* a stepped rack of weights; the heaviest lifts when it is poked */
      const up = since('weights') < 0.9 ? Math.round(Math.sin(Math.min(1, since('weights') / 0.9) * Math.PI) * 6) : 0;
      R(x - 26, 122, 52, 4, WOOD); R(x - 26, 126, 52, 2, DARK); R(x - 22, 128, 3, 4, DARK); R(x + 19, 128, 3, 4, DARK);
      [[-24, 12, 18], [-10, 10, 14], [2, 8, 10], [12, 6, 7], [20, 4, 4]].forEach((q, i) => { if (i === 2) { R(x + q[0], 121, q[1], 1, INK); return; } weight(x + q[0], 122 - q[2] - (i === 0 ? up : 0), q[1], q[2]); });
      return true;
    }
    case 'sacks': {
      /* a sack for each patient, and one much bigger than the rest. On the second poke a mouse looks out. */
      const n = o.pokes.sacks || 0, peek = n >= 2 && since('sacks') < 2.5;
      const sack = (sx, w, h) => { R(sx, 132 - h, w, h, '#b9a27a'); R(sx + 1, 132 - h - 2, w - 2, 2, '#b9a27a'); R(sx + Math.floor(w / 2) - 2, 132 - h - 4, 4, 3, '#8a7a5c'); R(sx, 132 - h, 2, h, 'rgba(255,255,255,.2)'); R(sx + w - 2, 132 - h, 2, h, 'rgba(0,0,0,.18)'); };
      sack(x - 28, 9, 12); sack(x - 18, 9, 13); sack(x + 12, 9, 12); sack(x + 22, 9, 11); sack(x - 7, 18, 30);
      if (peek) { R(x + 1, 96, 5, 4, '#8f8a7c'); R(x + 1, 95, 2, 2, '#8f8a7c'); R(x + 4, 95, 2, 2, '#8f8a7c'); R(x + 2, 98, 1, 1, INK); R(x + 6, 99, 3, 1, '#c9a0a0'); }
      return true;
    }
    case 'dome': {
      /* the standard: one polished weight on a plinth, under glass that fogs when it is breathed on */
      const fog = (o.pokes.dome || 0) >= 3 && since('dome') < 3;
      R(x - 12, 112, 24, 20, INK); R(x - 11, 113, 22, 19, STONE); R(x - 13, 110, 26, 3, '#a8a290');
      weight(x - 4, 100, 8, 10, BRASS);
      for (let i = 0; i < 9; i++) { const w = i < 3 ? 6 + i * 4 : 18; R(x - Math.floor(w / 2), 90 + i * 2 + (i < 3 ? 0 : 0), w, 2, fog ? 'rgba(220,230,240,.4)' : 'rgba(200,220,240,.13)'); }
      R(x - 9, 94, 1, 16, 'rgba(255,255,255,.4)'); R(x - 6, 90, 12, 1, 'rgba(255,255,255,.35)');
      return true;
    }
    case 'stamps': {
      /* a rack of stamps; the one that is tried comes down on the pad */
      const dn = since('stamps') < 0.5 ? Math.round(Math.sin(since('stamps') / 0.5 * Math.PI) * 5) : 0;
      R(x - 24, 118, 48, 3, WOOD); R(x - 24, 121, 48, 2, DARK); R(x - 20, 123, 3, 9, DARK); R(x + 17, 123, 3, 9, DARK);
      R(x - 22, 98, 44, 2, DARK); R(x - 22, 98, 2, 20, DARK); R(x + 20, 98, 2, 20, DARK);
      [[-17, C.coral], [-8, C.mint], [1, C.steel], [10, C.amber]].forEach((q, i) => { const y = 102 + (i === 3 ? dn : 0); R(x + q[0] + 1, y, 4, 7, DARK); R(x + q[0], y + 7, 6, 4, q[1]); });
      R(x + 8, 115, 10, 3, '#231a2c'); if (dn > 3) R(x + 9, 114, 8, 1, C.amber);
      return true;
    }
  }
  return false;
}

/* what the room itself adds: timber posts, and a shelf of ledgers the length of the wall */
function room(cx) {
  for (let wx = 0; wx < W; wx += 96) { const x = wx - cx; if (x > -8 && x < VW + 8) { R(x - 3, 14, 6, 92, DARK); R(x - 3, 14, 1, 92, 'rgba(255,255,255,.08)'); } }
  /* the wainscot */
  for (let x = -(cx % 16); x < VW; x += 16) R(x, 108, 1, 20, 'rgba(0,0,0,.22)');
  R(0, 118, VW, 1, 'rgba(255,255,255,.05)');
  /* ledgers: spines of five dull colours, with a gap wherever a balance hangs */
  const SP = ['#7a2f45', '#2f5d4a', '#5b4a7a', '#8a6c40', '#3d5a80'];
  R(0, 46, VW, 2, DARK);
  for (let wx = 8; wx < W - 8; wx += 4) {
    const x = wx - cx; if (x < -4 || x > VW) continue;
    if (ITEMS.some(i => (i.kind === 'station' || i.kind === 'lift') && Math.abs(i.x - wx) < 22)) continue;
    const k = Math.floor(wx / 4), h = 11 + (k * 7) % 6, lean = (k * 13) % 23 === 0;
    if ((k * 5) % 17 === 0) continue;
    R(x, 46 - h, 3, h, SP[(k * 3) % 5]); R(x, 46 - h + 2, 3, 1, lean ? C.paper : 'rgba(255,255,255,.25)');
  }
}

G.kits = G.kits || {};
G.kits.changes = G.weighhouse = { ITEMS, LINES, W, GOALS, NOTES, draw, room, arrive, line: () => null, AMARA, weight, RESP, REST,
  paint: ['#14100c', '#4a3d2c', '#8a6c40', '#33402f', '#14100c', '#1e1a14', '#3a3226', '#17130e'] };
})();
