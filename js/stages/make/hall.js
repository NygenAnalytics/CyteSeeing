/* The core facility: what the hall looks like and what its furniture says. The walking and the
   talking are in js/world/hall.js; this file holds the things that are only in here.
   It is a corridor of doors, with one analysis step behind each and Reviewer 2 at the far end.
   The player comes in by the front door at the left end, and a cleaning robot goes up and down. */
(function () {
'use strict';
const { R, T, C, VW } = G;
const WALL = 132, W = 1960;
const MIKA = { skin: C.skin2, hair: '#1b1b2a', style: 'bun', coat: '#2f9e8f', shirt: C.paper, pants: '#2c3a5e', shoes: C.ink, glasses: true };

const ITEMS = [
  { id: 'window', kind: 'prop', x: 46, label: 'LOOK OUT' },
  { id: 'board', kind: 'prop', x: 104, label: 'READ' },
  { id: 'mika', kind: 'npc', x: 176, label: 'TALK' },
  { id: 'plant', kind: 'prop', x: 232, label: 'ADMIRE' },
  { id: 'droplets', kind: 'door', x: 292, code: '1-1', name: 'DROPLET BAY', col: C.cyan },
  { id: 'scope', kind: 'prop', x: 360, label: 'LOOK', fig: 'scope' },
  { id: 'freezer', kind: 'prop', x: 428, label: 'OPEN' },
  { id: 'cliff', kind: 'door', x: 496, code: '1-2', name: 'THE CLIFF', col: C.lilac, need: 'droplets' },
  { id: 'screen', kind: 'prop', x: 556, label: 'LOOK', fig: 'matrix' },
  { id: 'seq', kind: 'prop', x: 616, label: 'LOOK', fig: 'flowcell' },
  { id: 'coffee', kind: 'prop', x: 680, label: 'POUR', stick: true },
  { id: 'student', kind: 'prop', x: 748, label: 'WAKE?' },
  { id: 'qc', kind: 'door', x: 820, code: '1-3', name: 'QC GATE', col: C.amber, need: 'cliff' },
  { id: 'poster', kind: 'prop', x: 890, label: 'LOOK', fig: 'umap' },
  { id: 'centrifuge', kind: 'prop', x: 954, label: 'SPIN' },
  { id: 'soup', kind: 'door', x: 1024, code: '1-4', name: 'SOUP KITCHEN', col: C.mint, need: 'qc' },
  { id: 'blender', kind: 'prop', x: 1094, label: 'BLEND', fig: 'smoothie' },
  { id: 'vending', kind: 'prop', x: 1162, label: 'BUY' },
  { id: 'doublet', kind: 'door', x: 1236, code: '1-5', name: 'DOUBLET HUNT', col: C.pink, need: 'soup' },
  { id: 'trace', kind: 'prop', x: 1304, label: 'LOOK', fig: 'trace' },
  { id: 'shower', kind: 'prop', x: 1370, label: 'PULL' },
  { id: 'gel', kind: 'prop', x: 1436, label: 'LOOK', fig: 'gel' },
  { id: 'printer', kind: 'prop', x: 1504, label: 'PRINT' },
  { id: 'dogma', kind: 'prop', x: 1572, label: 'READ', fig: 'dogma' },
  { id: 'volcano', kind: 'prop', x: 1642, label: 'LOOK', fig: 'volcano' },
  { id: 'bench', kind: 'prop', x: 1708, label: 'SAY HI' },
  { id: 'rev2', kind: 'prop', x: 1776, label: 'KNOCK' },
  { id: 'extinguisher', kind: 'prop', x: 1840, label: 'READ' },
  { id: 'lift', kind: 'lift', x: 1904, label: 'GO OUT' },
  { id: 'robot', kind: 'prop', x: 420, label: 'PET', floor: true, sfx: 'scan' },
];

const LINES = {
  window: [
    'WINDOW: Outside. People say it has weather. You have a library to load.',
    'WINDOW: It is dark. It was dark when you arrived, too. Science.',
  ],
  board: [
    "NOTICE BOARD: Journal club, Friday. This week: 'A UMAP is a map, not a result.' Bring biscuits.",
    'NOTICE BOARD: LOST: one statistical power. Last seen before the pilot study. Reward offered.',
    'NOTICE BOARD: Whoever labelled their tubes 1 to 48 with no key: we need to talk.',
    'NOTICE BOARD: FOR SALE: 400 left-hand gloves, size S. Never matched.',
  ],
  plant: [
    'PLANT: The only thing in this building with consistent growth conditions.',
    'PLANT: Technically a negative control. Nobody waters it and it is fine.',
  ],
  freezer: [
    'FREEZER: Minus eighty. A box at the back says DO NOT THAW, 2014. You close the door quietly.',
    "FREEZER: A tube labelled 'IMPORTANT!!' in handwriting nobody recognises.",
    'FREEZER: The alarm has been beeping since Tuesday. Everyone assumes someone else told someone.',
  ],
  coffee: [
    'COFFEE: You pour a cup. Normalised to ten thousand sips per day, then log transformed.',
    'COFFEE: Cup two. This machine has better uptime than the compute cluster.',
    'COFFEE: Cup three. Your hands shake. Your pipetting accuracy is now a distribution.',
    'COFFEE: Empty. Now this is a real batch effect.',
  ],
  student: [
    'TOMO: Zzz... just one more clustering resolution... zzz...',
    'TOMO: Zzz... but it worked on the tutorial data... zzz...',
    'TOMO: Zzz... p equals zero point zero five one... nooo...',
    'TOMO: (wakes) Is the cluster free? (checks) It is not free. (sleeps)',
  ],
  centrifuge: [
    'CENTRIFUGE: Balanced? You check. You check again. You will check a third time from the door.',
    'CENTRIFUGE: 300 g, five minutes. Long enough to doubt every decision that led you here.',
  ],
  vending: [
    'VENDING: B4 is stuck. It has been stuck since the last grant renewal.',
    "VENDING: You buy 'Significance Crisps'. The bag is 95% air. Very confident, though.",
    'VENDING: Out of order. Please use the machine in the Laundry.',
  ],
  shower: [
    'SHOWER: You pull the handle. You are now completely free of ambient RNA. And of dry clothes.',
    'SHOWER: Tested weekly, says the tag. The last signature is from a different decade.',
  ],
  printer: [
    'PRINTER: Paper jam. There is no paper in it. It is jammed in principle.',
    'PRINTER: It prints one thing: a conference poster from 2016, at A0, one strip at a time.',
    "PRINTER: 'Low on cyan.' You only print in black. It wants cyan anyway.",
  ],
  bench: [
    "POSTDOC: Waiting for Reviewer 2's comments. Has been for a while, by the look of it.",
    "POSTDOC: The skeleton is holding a letter. It says 'MINOR REVISIONS'.",
    'POSTDOC: You leave a coffee on the bench. It seems to appreciate the gesture.',
  ],
  rev2: [
    "REVIEWER 2: Nobody answers. A note is taped to the glass: 'Did you correct for batch?'",
    "REVIEWER 2: A second note: 'The authors should cite the following eleven papers.' All from one group.",
    "REVIEWER 2: A third note: 'Interesting. Have you tried it in a different organism?'",
  ],
  extinguisher: [
    'EXTINGUISHER: For fires only. Not for burning questions, hot takes or heated lab meetings.',
  ],
  robot: [
    'ROBOT: A cleaning robot called PCR. It goes back and forth and doubles its coverage every cycle.',
    'ROBOT: PCR bumps into your shoe, apologises in beeps, and resumes amplification.',
    "ROBOT: Somebody has stuck a label on it: 'NO TEMPLATE CONTROL'.",
  ],
  /* one box, and then the first station: what else Mika has to say waits until she is asked */
  intro: [
    () => 'MIKA: You must be ' + G.you() + '. I am Mika. Your sample is dissociated and waiting. Bay 1-1 is free, so go and load the chip.',
  ],
  /* what Mika says depends on how many rooms are done, the review included */
  mika: [
    ['MIKA: I run the core facility. The coffee is bad and the freezers are full.',
      'MIKA: Bay 1-1 is the first door on your right. The cells will not load themselves. I have asked.',
      'MIKA: One warning. Whatever you do in a room follows you down this corridor. Like a reputation.'],
    ['MIKA: Good run. The sequencer has finished with your library too. It only complained twice.',
      'MIKA: Next is the Cliff. There are far more barcodes than cells. Work out which ones are real.'],
    ['MIKA: Cells called. Room 1-3 is quality control. Not every called cell is a healthy cell.',
      'MIKA: Somebody left the thresholds at the values from a tutorial. Do not trust them. Or the somebody.'],
    ['MIKA: Filtered. Next is the soup kitchen. Stray RNA got into every droplet you made.',
      'MIKA: Bring your empty droplets from the Cliff. They are the recipe.'],
    ['MIKA: One room left. The doublets you loaded on day one are still in there. Go and get them.'],
    ['MIKA: A clean matrix. That is the whole core facility. I am almost impressed.',
      'MIKA: Reviewer 2 will see you now. Their door is at the far end. Bring your reasons.',
      'MIKA: After that, the Cloud is next along the road. Noor runs the dry lab. Say hello from me.'],
    ['MIKA: You survived review. The Cloud is next along the road. Further on, some of it is still building sites.',
      'MIKA: If you can code, you could build one. The whole institute is open source, on GitHub.',
      'MIKA: Have a coffee first. Not from that machine.'],
  ],
};

/* the stage's page in the notebook: its steps, and its field notes */
const GOALS = [['droplets', '1-1 Droplet bay: load the chip'], ['cliff', '1-2 The Cliff: call the cells'], ['qc', '1-3 QC gate: filter damaged cells'],
  ['soup', '1-4 Soup kitchen: remove stray RNA'], ['doublet', '1-5 Doublet hunt: find the doublets'], ['review', 'Face Reviewer 2']];
const NOTES = [
  { id: 'walk', open: true, html: 'Arrow keys walk. Space talks, reads, pokes and opens doors. Most things answer back, and some have more than one thing to say.' },
  { id: 'plan', open: true, html: 'The rooms open in order, because the analysis has an order. Finish them and the next stage of the project opens.' },
  { id: 'jump', open: true, html: 'In a hurry? Press <b>L</b>, or tap MAP, to step out to the map from anywhere. If you have no data for a stage or a room, Tomo will make some. No stars for work you did not do.' },
];

/* ---------- Reviewer 2 ---------- */
/* Reviewer 2's door is a thing to knock on, like any other, until every room is done. After that
   it is the way in to the review. */
const reviewOpen = () => G.STAGES.make.rooms.every(k => G.state.rooms[k].done);
function use(it) {
  if (it.id === 'rev2' && reviewOpen()) { G.sfx('door'); G.go('review', {}); return true; }
  return false;
}

/* the third time the player says hello to the postdoc, a coffee is left on the bench, and it stays there */
function line(id, n) {
  if (id === 'bench' && (n - 1) % LINES.bench.length === 2) { G.state.eggs.cup = true; G.save(); }
  return null;
}
/* the first time in, the player walks in by the front door and Mika has something to say */
const arrive = () => (G.state.met ? null : { walk: 128, say: LINES.intro, then: () => { G.state.met = true; G.save(); } });

/* ---------- the cleaning robot ---------- */
/* it keeps cleaning whatever else is going on, and turns round when it meets the player */
const ROBOT = ITEMS.find(i => i.id === 'robot'), SHOWER = ITEMS.find(i => i.id === 'shower');
const robot = { x: 420, dir: 1, wait: 0 };
/* when it last bumped into the player */
let bump = -99;
function tick(dt, hero) {
  if (robot.wait > 0) robot.wait -= dt;
  else {
    robot.x += robot.dir * 24 * dt;
    if (robot.x > 1560 || robot.x < 250) { robot.dir *= -1; robot.wait = 1.2; }
    if (Math.abs(robot.x - hero.x) < 9 && G.t - bump > 4) { bump = G.t; robot.dir *= -1; robot.wait = 0.8; G.sfx('pop'); }
  }
  ROBOT.x = robot.x;
}

const table = (x, w) => { R(x - w / 2, 116, w, 16, '#4a587f'); R(x - w / 2, 114, w, 3, '#6577a5'); };

/* draws one thing in the hall; returns false for the things hall.js draws itself (the doors, the way out) */
function draw(it, x, o) {
  const s = G.state, t = G.t, since = o.since, pokes = o.pokes;
  switch (it.id) {
    case 'window':
      R(x - 17, 64, 34, 38, '#0c1329'); R(x - 15, 66, 30, 34, '#0a1430');
      G.disc(x + 7, 75, 4, C.paper); R(x + 5, 73, 2, 2, '#d8d2bf');
      [[-11, 70], [-4, 78], [-9, 86], [2, 69], [11, 88]].forEach((p, i) => { if (Math.floor(t * 1.5 + i * 3) % 7) R(x + p[0], p[1], 1, 1, C.fog); });
      R(x - 15, 90, 12, 10, '#131c3c'); R(x - 2, 86, 9, 14, '#131c3c'); R(x + 8, 92, 7, 8, '#131c3c');
      R(x - 12, 93, 2, 2, C.amber); R(x + 1, 89, 2, 2, Math.floor(t / 3) % 2 ? C.amber : '#131c3c');
      R(x - 1, 66, 1, 34, '#0c1329'); R(x - 15, 82, 30, 1, '#0c1329');
      return true;
    case 'board':
      R(x - 18, 70, 36, 28, '#6b4630'); R(x - 16, 72, 32, 24, '#b0835a');
      R(x - 13, 75, 9, 11, C.paper); R(x - 2, 74, 8, 8, C.amber); R(x + 8, 76, 6, 12, C.paper); R(x - 3, 85, 9, 8, C.cyan);
      R(x - 9, 75, 1, 1, C.coral); R(x + 2, 74, 1, 1, C.coral); R(x + 10, 76, 1, 1, C.coral);
      return true;
    case 'mika':
      G.panel(x - 37, 52, 74, 12, { border: C.mint, fill: C.ink });
      T('CORE FACILITY', x, 53, C.mint, { a: 'center' });
      G.person(x, WALL - 11, MIKA, { dir: -1, t });
      R(x - 24, 116, 48, 16, '#6b4630'); R(x - 24, 114, 48, 3, '#8f6245');
      R(x + 8, 102, 13, 10, C.ink); R(x + 9, 103, 11, 8, Math.floor(t * 1.3) % 2 ? '#1f6d7d' : '#22808f'); R(x + 13, 112, 3, 2, C.ink);
      R(x - 19, 109, 5, 5, C.paper); R(x - 18, 108, 3, 1, C.paper);
      return true;
    case 'plant': {
      const sw = since('plant') < 1 ? Math.round(Math.sin(t * 30)) : 0;
      R(x - 5, 120, 10, 12, '#8a5a3c'); R(x - 6, 119, 12, 2, '#a06c48');
      R(x - 1 + sw, 102, 3, 18, C.green); R(x - 6 + sw, 106, 5, 6, C.green); R(x + 3 + sw, 99, 5, 8, C.green); R(x - 3 + sw, 96, 3, 7, C.mint); R(x + 5 + sw, 108, 3, 5, C.mint);
      return true;
    }
    case 'scope':
      table(x, 34);
      R(x - 7, 110, 14, 4, C.ink); R(x + 3, 94, 3, 16, C.fog); R(x - 5, 92, 10, 5, C.fog); R(x - 8, 87, 4, 6, C.fog);
      R(x - 2, 97, 3, 7, C.steel); R(x - 8, 106, 13, 2, C.steel); R(x - 2, 105, 3, 1, C.amber);
      R(x + 9, 108, 5, 6, '#c9d3e8'); R(x + 10, 109, 3, 2, C.cyan);
      return true;
    case 'freezer': {
      const open = since('freezer') < 1.2;
      R(x - 13, 82, 26, 50, '#aab6cf'); R(x - 12, 83, 24, 48, '#dfe6f3');
      R(x - 12, 106, 24, 1, '#aab6cf'); R(x + 7, 90, 2, 10, C.steel); R(x + 7, 111, 2, 10, C.steel);
      R(x - 10, 86, 19, 9, C.ink); T('-80', x - 8, 86, Math.floor(t * 2) % 2 ? C.cyan : C.coral);
      if (open) { R(x - 12, 107, 24, 24, '#0c1329'); R(x - 10, 110, 8, 5, C.paper); R(x, 112, 9, 4, C.cyan); R(x - 9, 120, 12, 5, C.lilac); R(x - 14, 104, 28, 2, 'rgba(200,230,255,.35)'); }
      return true;
    }
    case 'screen': {
      R(x - 15, 74, 30, 22, C.ink); R(x - 13, 76, 26, 18, '#0e1630'); R(x - 2, 96, 4, 3, C.ink);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) {
        const v = Math.sin((i * 7 + j * 13) * 12.9898) * 43758.5; const f = v - Math.floor(v);
        R(x - 12 + i * 4, 77 + j * 4, 3, 3, j === 0 ? C.cyan : f > 0.86 ? C.teal : '#16224a');
      }
      R(x - 12 + (Math.floor(t * 3) % 6) * 4, 77, 3, 15, 'rgba(246,186,76,.25)');
      return true;
    }
    case 'seq':
      table(x, 38);
      R(x - 15, 90, 30, 24, '#c9d3e8'); R(x - 14, 91, 28, 22, '#e7ecf6');
      R(x - 11, 96, 22, 8, C.ink); R(x - 10 + (Math.floor(t * 8) % 10) * 2, 98, 2, 4, [C.mint, C.cyan, C.amber, C.coral][Math.floor(t * 8) % 4]);
      R(x - 11, 107, 8, 3, '#aab6cf'); R(x + 8, 107, 2, 2, C.mint);
      return true;
    case 'coffee': {
      const empty = (pokes.coffee || 0) >= 4;
      R(x - 16, 112, 32, 20, '#4a587f'); R(x - 16, 110, 32, 3, '#6577a5');
      R(x - 8, 92, 16, 18, '#1b2340'); R(x - 6, 94, 12, 5, '#2c3a66'); R(x + 3, 95, 2, 2, empty ? C.coral : C.mint);
      R(x - 3, 104, 6, 6, C.paper); R(x + 3, 105, 2, 3, C.paper);
      if (!empty) { const k = Math.floor(t * 3) % 3; R(x - 2 + k, 100 - k, 1, 2, 'rgba(255,255,255,.5)'); R(x + 1 - k, 98 - k, 1, 2, 'rgba(255,255,255,.35)'); }
      if (since('coffee') < 0.8) R(x - 1, 99, 2, 5, '#5a3a22');
      return true;
    }
    case 'student': {
      const awake = since('student') < 1.4 && (pokes.student || 0) % 4 === 0;
      R(x - 22, 116, 44, 16, '#6b4630'); R(x - 22, 114, 44, 3, '#8f6245');
      R(x + 2, 104, 14, 9, C.ink); R(x + 3, 105, 12, 7, '#22808f'); R(x, 113, 18, 1, C.steel);
      /* slumped over the desk */
      R(x - 17, 106, 12, 8, '#5b6ea8');
      if (awake) { R(x - 14, 98, 7, 7, C.skin3); R(x - 14, 97, 7, 2, '#20182a'); R(x - 9, 101, 1, 1, C.ink); T('!', x - 12, 86, C.amber, { f: 'smb' }); }
      else {
        R(x - 9, 108, 7, 6, C.skin3); R(x - 9, 107, 7, 2, '#20182a'); R(x - 10, 108, 1, 4, '#20182a');
        for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i * 0.33) % 1; T('Z', x - 6 + k * 12, 100 - k * 20, 'rgba(197,208,230,' + (1 - k).toFixed(2) + ')'); }
      }
      R(x - 21, 109, 4, 5, C.paper);
      return true;
    }
    case 'poster': {
      R(x - 15, 66, 30, 38, C.ink); R(x - 14, 67, 28, 36, C.paper);
      const rnd = G.rng(5);
      [[x - 7, 78, C.teal], [x + 5, 76, C.violet], [x - 2, 90, C.orange], [x + 7, 91, C.green]].forEach(p => {
        for (let i = 0; i < 14; i++) R(p[0] + (rnd() - .5) * 9, p[1] + (rnd() - .5) * 8, 1, 1, p[2]);
      });
      R(x - 11, 70, 16, 2, C.steel);
      return true;
    }
    case 'centrifuge': {
      const on = since('centrifuge') < 3, sh = on ? Math.round(Math.sin(t * 70)) : 0;
      table(x, 34);
      R(x - 13 + sh, 98, 26, 16, '#c9d3e8'); R(x - 13 + sh, 96, 26, 3, '#aab6cf');
      R(x - 10 + sh, 103, 9, 6, C.ink); R(x - 9 + sh, 104, on ? 7 : 2, 4, on ? C.mint : C.steel);
      R(x + 4 + sh, 103, 3, 3, on ? C.coral : C.steel); R(x + 8 + sh, 103, 3, 3, C.steel);
      return true;
    }
    case 'blender': {
      const on = since('blender') < 1.2, sh = on ? Math.round(Math.sin(t * 60)) : 0;
      R(x - 19, 112, 38, 20, '#4a587f'); R(x - 19, 110, 38, 3, '#6577a5');
      R(x - 6 + sh, 104, 10, 6, C.slate); R(x - 5 + sh, 89, 8, 15, 'rgba(200,230,255,.3)'); R(x - 4 + sh, 95, 6, 9, on && Math.floor(t * 20) % 2 ? '#96708a' : '#7a566c'); R(x - 6 + sh, 87, 10, 2, C.fog);
      R(x + 6, 106, 11, 4, C.fog); G.cell(x + 7, 101, C.cyan, 5); G.cell(x + 11, 100, C.amber, 5); G.cell(x + 9, 97, C.pink, 5);
      return true;
    }
    case 'vending': {
      const drop = since('vending');
      R(x - 15, 76, 30, 56, '#1c2a52'); R(x - 14, 77, 28, 54, '#283a6b');
      R(x - 11, 81, 17, 32, '#0c1329');
      for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) if (!(i === 1 && j === 1)) R(x - 9 + i * 5, 84 + j * 7, 4, 4, G.TYPES[(i + j * 2) % 5]);
      R(x - 9 + 5, 84 + 7 + 2, 4, 4, C.coral);
      R(x + 8, 83, 5, 12, C.ink); R(x + 9, 84, 3, 2, Math.floor(t * 2) % 2 ? C.coral : '#5c2826');
      R(x - 10, 118, 20, 7, C.ink);
      if (drop < 0.7) R(x - 4, 112 + drop * 12, 5, 4, C.amber); else if (drop < 4) R(x - 4, 120, 5, 4, C.amber);
      return true;
    }
    case 'trace': {
      table(x, 36);
      R(x - 14, 102, 28, 12, '#dfe6f3'); R(x - 11, 106, 10, 3, '#aab6cf'); R(x + 6, 106, 3, 3, C.mint);
      R(x - 13, 82, 26, 17, C.ink); R(x - 12, 83, 24, 15, '#0e1630'); R(x - 2, 99, 4, 3, C.ink);
      for (let i = 0; i < 22; i++) { const u = i / 21, y = 95 - Math.round(8 * Math.exp(-Math.pow((u - 0.55) / 0.18, 2)) + (i === 1 ? 9 : 0) + (i === 20 ? 7 : 0)); R(x - 11 + i, y, 1, 1, C.mint); }
      return true;
    }
    case 'shower':
      R(x - 1, 14, 2, 32, C.steel); R(x - 8, 46, 16, 4, C.amber); R(x - 6, 50, 12, 1, '#b98a2c');
      R(x + 10, 48, 1, 20, C.steel); R(x + 7, 68, 7, 4, C.amber);
      R(x - 27, 60, 12, 14, C.green); R(x - 23, 63, 4, 2, C.white); R(x - 22, 66, 2, 6, C.white);
      R(x - 9, WALL + 12, 18, 2, '#0c1329');
      return true;
    case 'gel':
      R(x - 14, 66, 28, 34, C.ink); R(x - 12, 68, 24, 30, '#1a1430');
      [[-10, [72, 76, 80, 85, 91]], [-5, [79]], [0, [79, 88]], [5, [78]]].forEach(l => l[1].forEach(y => R(x + l[0], y, 4, 1, '#ffb37c')));
      for (let y = 73; y < 95; y++) R(x + 9, y, 3, 1, 'rgba(255,179,124,.28)');
      return true;
    case 'printer': {
      const out = Math.min(6, since('printer') * 6);
      table(x, 36);
      R(x - 14, 100, 28, 14, '#dfe6f3'); R(x - 14, 100, 28, 3, '#aab6cf'); R(x - 10, 106, 20, 2, C.ink);
      R(x - 8, 94, 16, 6, C.paper);
      if (since('printer') < 6) R(x - 8, 108, 16, out, C.paper);
      R(x + 9, 103, 2, 2, Math.floor(t * 4) % 2 ? C.coral : '#5c2826');
      return true;
    }
    case 'dogma':
      R(x - 21, 64, 42, 32, '#9aa6c2'); R(x - 19, 66, 38, 28, '#eef1f6'); R(x - 21, 96, 42, 2, C.steel);
      R(x - 16, 70, 8, 4, '#1b2340'); R(x - 4, 70, 8, 4, '#1b2340'); R(x + 8, 70, 9, 4, '#1b2340');
      R(x - 8, 72, 4, 1, '#d2453f'); R(x + 4, 72, 4, 1, '#d2453f'); R(x + 12, 75, 1, 8, '#d2453f');
      R(x + 6, 84, 10, 4, '#1b2340'); R(x - 8, 84, 10, 4, '#1b2340'); R(x + 2, 86, 4, 1, '#d2453f'); R(x - 13, 76, 1, 10, '#d2453f'); R(x - 13, 86, 5, 1, '#d2453f');
      R(x - 15, 97, 4, 2, '#d2453f'); R(x - 9, 97, 4, 2, '#1b2340');
      return true;
    case 'volcano': {
      R(x - 15, 66, 30, 34, C.ink); R(x - 13, 68, 26, 30, C.paper);
      const rnd = G.rng(8);
      for (let i = 0; i < 46; i++) { const u = (rnd() + rnd() - 1) * 11, h = Math.min(24, Math.abs(u) * (1 + rnd() * 1.6)); R(x + u, 95 - h, 1, 1, Math.abs(u) > 5 && h > 9 ? (u > 0 ? C.coral : C.teal) : '#8a93ab'); }
      return true;
    }
    case 'bench': {
      const bone = C.paper;
      R(x - 19, 121, 38, 3, '#8a5a3c'); R(x - 17, 124, 2, 8, '#6b4630'); R(x + 15, 124, 2, 8, '#6b4630');
      R(x - 3, 100, 7, 6, bone); R(x - 2, 106, 5, 2, bone); R(x - 2, 102, 2, 2, C.ink); R(x + 1, 102, 2, 2, C.ink); R(x, 105, 1, 1, C.ink);
      R(x, 108, 1, 11, bone); for (let r = 0; r < 4; r++) R(x - 3, 110 + r * 2, 7, 1, bone);
      R(x - 5, 110, 1, 8, bone); R(x + 5, 110, 1, 6, bone); R(x + 5, 116, 5, 1, bone);
      R(x - 3, 119, 7, 2, bone); R(x - 4, 121, 1, 11, bone); R(x + 3, 121, 1, 11, bone); R(x - 6, 131, 3, 1, bone); R(x + 3, 131, 3, 1, bone);
      R(x + 8, 108, 12, 9, bone); R(x + 10, 110, 8, 1, C.steel); R(x + 10, 113, 6, 1, C.steel);
      G.line(x - 3, 100, x - 13, 90, 'rgba(255,255,255,.18)'); G.line(x - 8, 100, x - 13, 90, 'rgba(255,255,255,.18)'); G.line(x - 9, 97, x - 5, 99, 'rgba(255,255,255,.18)');
      if (s.eggs.cup) { R(x - 14, 116, 5, 5, C.paper); R(x - 9, 117, 2, 3, C.paper); R(x - 13, 113 - (Math.floor(t * 3) % 2), 1, 2, 'rgba(255,255,255,.4)'); }
      return true;
    }
    case 'rev2': {
      const knock = since('rev2') < 0.5;
      R(x - 17, 78, 34, 54, '#0c1329'); R(x - 15, 80, 30, 52, '#1a1426');
      R(x - 10, 86, 20, 22, knock ? '#3a2f4d' : '#2a2238');
      const sway = Math.round(Math.sin(t * 0.7) * 2);
      R(x - 3 + sway, 91, 6, 6, '#110d1a'); R(x - 6 + sway, 97, 12, 11, '#110d1a');
      if (knock) { R(x - 2 + sway, 93, 1, 1, C.coral); R(x + 1 + sway, 93, 1, 1, C.coral); }
      R(x + 9, 112, 2, 5, C.steel);
      R(x - 13, 130, 26, 2, reviewOpen() ? C.coral : Math.floor(t * 5) % 7 ? '#5a1f2a' : '#a8323f');
      if (s.rooms.review.done) G.stars(x - 13, 49, s.rooms.review.stars);
      for (let i = 0; i < Math.min(3, pokes.rev2 || 0); i++) R(x - 12 + i * 5, 110 + i * 3, 5, 6, C.paper);
      G.panel(x - 34, 60, 68, 12, { border: C.coral, fill: C.ink });
      T('REVIEWER 2', x, 61, C.coral, { a: 'center' });
      return true;
    }
    case 'extinguisher':
      R(x - 5, 92, 11, 30, '#0c1329'); R(x - 3, 100, 7, 19, C.coral); R(x - 3, 100, 2, 19, '#ff8f89'); R(x - 1, 96, 3, 4, C.ink); R(x + 2, 97, 4, 1, C.ink); R(x + 5, 97, 1, 8, C.ink);
      R(x - 3, 107, 7, 4, C.paper);
      return true;
  }
  return false;
}

/* what the room itself adds to its walls: the way in, at the far left */
function room(cx) {
  const ex = 6 - cx;
  if (ex > -30) { R(ex - 6, 70, 22, 62, '#0c1329'); R(ex - 4, 72, 18, 60, '#1a3a52'); R(ex + 4, 72, 1, 60, '#0c1329'); T('IN', ex - 1, 61, C.mint); }
}
/* things in front of the player: the shower's water and the robot */
function fore(cx, o) {
  const t = G.t, since = o.since, sh = SHOWER.x - cx;
  if (since('shower') < 2.2 && sh > -30 && sh < VW + 30) {
    for (let i = 0; i < 7; i++) for (let k = 0; k < 6; k++) R(sh - 6 + i * 2, 51 + ((t * 190 + i * 37 + k * 19) % 92), 1, 5, 'rgba(140,210,255,.75)');
    R(sh - 12, WALL + 13, 24, 2, 'rgba(140,210,255,.5)');
  }
  const x = Math.round(robot.x - cx), petted = since('robot') < 1;
  if (x > -20 && x < VW + 20) {
    const y = 166 + (petted ? -Math.abs(Math.round(Math.sin(t * 16) * 3)) : 0);
    R(x - 7, y + 4, 14, 1, 'rgba(0,0,0,.35)');
    R(x - 6, y, 12, 4, '#c9d3e8'); R(x - 4, y - 2, 8, 2, C.fog); R(x - 7, y + 2, 14, 2, '#51648f');
    R(x + (robot.dir > 0 ? 3 : -5), y - 1, 2, 1, Math.floor(t * 4) % 2 ? C.cyan : C.teal);
    if (petted) T('<3', x - 5, y - 13, C.pink);
    else if (robot.wait > 0 && G.t - bump < 1) T('!', x - 1, y - 12, C.amber, { f: 'smb' });
  }
}

G.kits = G.kits || {};
G.kits.make = { ITEMS, LINES, W, GOALS, NOTES, draw, room, fore, line, use, tick, arrive,
  /* the player comes in from the map by the front door, not by the way out at the far end */
  entry: 30,
  /* Reviewer 2's door says so when it is open, and it shows on the strip map */
  label: it => (it.id === 'rev2' && reviewOpen() ? 'FACE REVIEW' : null),
  mark: it => (it.id === 'rev2' ? (reviewOpen() ? C.coral : '#5a1f2a') : null),
  /* where the arrow points once the rooms are done: at Reviewer 2, and after the review at the way out */
  next: () => (!reviewOpen() ? null : G.state.rooms.review.done ? 'lift' : 'rev2'),
  /* one of the ceiling lamps has been flickering since 2022 */
  dark: n => n === 7 && (Math.floor(G.t * 11) % 9 === 0 || Math.floor(G.t * 3) % 13 === 0),
  /* blue, for the wet lab */
  paint: ['#0c1329', '#27385f', '#3a5187', '#1e2b4c', '#0c1329', '#161f3d', '#222e57', '#111833'] };
})();
