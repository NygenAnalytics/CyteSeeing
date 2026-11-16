/* The Marshalling Yard: what the hall looks like and what its furniture says. The walking and the
   talking are in js/world/hall.js; this file holds the things that are only in here.
   An engine shed at the edge of a yard: brick, arched windows, rails in the floor. Over every
   station stands a signal, at danger until the station is done. */
(function () {
'use strict';
const { R, T, C, VW } = G;
const WALL = 132, W = 1100;
const JUN = { skin: C.skin1, hair: '#8f8a86', style: 'short', coat: '#2c4a78', shirt: '#d8b45a', pants: '#1f2940', shoes: C.ink, hat: '#1c2c4c', glasses: true };
const VERA = { skin: C.skin2, hair: '#3a2f3a', style: 'long', coat: '#7a2f45', shirt: '#e8d9a8', pants: '#2b2430', shoes: C.ink };
const IRON = '#565b68', DARK = '#23262e', RAIL = '#aab2c4', TIMBER = '#6b5134', SOOT = '#14161b', BRASS = C.oil, RED = '#c8413c';

const ITEMS = [
  { id: 'lift', kind: 'lift', x: 44, label: 'GO OUT' },
  { id: 'notices', kind: 'prop', x: 108, label: 'READ' },
  { id: 'jun', kind: 'npc', x: 176, label: 'TALK' },
  { id: 'turntable', kind: 'station', x: 292, code: '5-1', name: 'THE TURNTABLE', col: C.cyan, ay: 40 },
  { id: 'buffer', kind: 'prop', x: 386, label: 'LEAN ON' },
  { id: 'track', kind: 'station', x: 480, code: '5-2', name: 'THE TRACK', col: C.mint, need: 'turntable', ay: 40 },
  { id: 'wagon', kind: 'prop', x: 572, label: 'LOOK IN' },
  { id: 'levers', kind: 'prop', x: 638, label: 'PULL' },
  { id: 'timetable', kind: 'station', x: 728, code: '5-3', name: 'THE TIMETABLE', col: C.amber, need: 'track', ay: 40 },
  { id: 'kettle', kind: 'prop', x: 818, label: 'LOOK' },
  { id: 'clock', kind: 'station', x: 908, code: '5-4', name: 'THE CLOCK', col: C.lilac, need: 'timetable', ay: 40 },
  { id: 'board', kind: 'station', x: 1024, code: 'VERA', name: 'DEPARTURES', col: C.coral, need: 'clock', ay: 40, label: 'FILL THE BOARD' },
];

const LINES = {
  notices: [
    "YARD NOTICE: 'Wagons are shunted into order. The wagons were not asked, and have not complained.'",
    "YARD NOTICE: 'Staff must not ask a snapshot what time it is. It was not wearing a watch.'",
    "YARD NOTICE: 'Lost: one root cell. Last seen at the start. If found, do not move it.'",
  ],
  buffer: [
    'BUFFER STOP: The end of a siding. Somebody has chalked TERMINAL STATE on the beam. Somebody else has added a question mark.',
    'BUFFER STOP: You lean on it. It has stopped heavier arguments than yours.',
    "BUFFER STOP: A brass plate. 'Nothing has ever left by this end.' No one has checked the other.",
  ],
  wagon: [
    "WAGON: One wagon, alone on a siding. Chalked on its side: 'OUTLIER. DO NOT COUPLE.'",
    'WAGON: You look in. One cell, a long way from its neighbours. It looks back.',
    'WAGON: It has rolled a little since you last looked. Nobody saw it move, so nobody can say how fast.',
  ],
  levers: [
    'LEVER FRAME: Six levers. Five have labels. The sixth has a label that reads DO NOT, and a shine on the handle.',
    'LEVER FRAME: You pull one. Far down the yard a signal drops. That is all that happens, which is how a lever should behave.',
    'LEVER FRAME: You pull the sixth. Nothing happens here. Somewhere, a cluster is renamed.',
  ],
  kettle: [
    "STOVE: Jun's kettle. It boils in its own time, which is the only kind of time this yard will vouch for.",
    'STOVE: A tin mug with a tide mark for every shift. The marks are in order. How long each shift was, they do not say.',
    'STOVE: The kettle clicks as it cools. You count the clicks for a while, and learn nothing about kettles.',
  ],
  junIntro: [
    'JUN: Jun. I keep the yard. Every wagon that comes in here goes out again in order, or it does not go out.',
    'JUN: Your three samples are on the sidings. One line runs through all of them. Start at the turntable.',
  ],
  /* Jun only points the way. What each station teaches is said at the station, once. */
  jun: [
    ['JUN: The turntable first. An engine has to start somewhere.'],
    ['JUN: The track is next along. Bring a test wagon, and no opinions.'],
    ['JUN: The timetable is on the wall past the lever frame. Mind the lever: it is stiff.'],
    ['JUN: The clock, beyond the stove. Do not set your watch by it.'],
    ['JUN: Vera is at the departure board, and wants it filled by Friday. Fill it with what the yard found.'],
    /* what comes next depends on the project: the pack of its cell system says */
    [() => 'JUN: The board is up. The next stage ' + G.sys.order.next + '. The builders have only just staked out the ground.'],
  ],
};

/* the stage's page in the notebook: its steps, and its field notes */
const GOALS = [['turntable', '5-1 The Turntable: choose where the line starts'], ['track', '5-2 The Track: join only what the cells link'], ['timetable', '5-3 The Timetable: read the order in which genes come on'],
  ['clock', '5-4 The Clock: check the order against real time'], ['board', 'Fill the departure board for Vera']];
const NOTES = [
  { id: 'y-one', open: true, html: 'Three samples of one tissue, at three ages. Each is a snapshot: its cells were caught at every point of a process that all of them go through. Everything in this yard is worked out from those cells.' },
  { id: 'y-jump', open: true, html: 'Press <b>L</b>, or tap MAP, to step out to the map from anywhere. If a station has no data, Tomo can run the steps before it. No stars for work you did not do.' },
];
/* the first time in, Jun has something to say */
const arrive = () => (G.state.met5 ? null : { say: LINES.junIntro, then: () => { G.state.met5 = true; G.save(); } });

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
/* a signal on a bracket over a station: the arm is level and the lamp red until the station is done */
function signal(x, ok, locked) {
  const c = locked ? '#4a4d57' : IRON;
  R(x, 14, 2, 30, c); R(x - 1, 42, 4, 3, c);
  if (ok) { G.line(x, 20, x - 12, 29, C.paper); G.line(x, 21, x - 12, 30, C.paper); G.line(x - 3, 23, x - 6, 25, RED); }
  else { R(x - 14, 19, 14, 4, locked ? '#5a5d66' : RED); if (!locked) R(x - 11, 19, 2, 4, C.paper); }
  R(x + 2, 26, 5, 5, DARK); R(x + 3, 27, 3, 3, locked ? '#3a3d46' : ok ? C.mint : Math.floor(G.t * 1.5 + x) % 2 ? RED : '#7a2a28');
}
/* a small open wagon: a box on two wheels. x, y is the left end of its floor. */
function wagon(x, y, w, c) {
  R(x, y - 7, w, 7, c); R(x, y - 7, w, 1, 'rgba(255,255,255,.3)'); R(x + 1, y - 5, w - 2, 1, 'rgba(0,0,0,.25)');
  R(x + 2, y, 3, 2, SOOT); R(x + w - 5, y, 3, 2, SOOT);
}
/* a short length of track on the wall line: two rails seen from the side, on sleepers */
function rails(x0, x1, y, c) { for (let x = x0; x < x1; x += 6) R(x + 1, y + 2, 3, 2, TIMBER); R(x0, y, x1 - x0, 1, c || RAIL); R(x0, y + 1, x1 - x0, 1, IRON); }

/* draws one thing in the hall; returns false for the things hall.js draws itself (the way out) */
function draw(it, x, o) {
  const t = G.t, locked = o.locked(it), since = o.since;
  switch (it.id) {
    case 'turntable': {
      /* the pit, a bridge across it that swings until the root is set, and an engine on the bridge */
      const ok = done('turntable'), a = ok ? 0 : locked ? 0.5 : t * 0.7, cx = Math.cos(a), sy = Math.sin(a);
      plate(it, x, 52, locked); signal(x + 24, ok, locked);
      for (let i = -6; i <= 6; i++) { const w = Math.round(Math.sqrt(36 - i * i) * 5.4); R(x - w, 118 + i, 2 * w, 1, i < -4 ? '#4a4d57' : '#1a1c22'); }
      R(x - 32, 124, 64, 8, DARK); R(x - 32, 124, 64, 1, '#4a4d57');
      G.line(x - cx * 30, 118 - sy * 5, x + cx * 30, 118 + sy * 5, locked ? '#5a5d66' : RAIL); G.line(x - cx * 30, 119 - sy * 5, x + cx * 30, 119 + sy * 5, IRON);
      /* the engine: boiler, cab, chimney, and a little steam when the station is open */
      const ex = x - 9, ey = 104;
      R(ex, ey + 4, 14, 8, locked ? '#3f434d' : '#2f6e62'); R(ex + 12, ey, 7, 12, locked ? '#3a3d46' : '#24564c'); R(ex + 13, ey + 2, 4, 4, locked ? DARK : '#f6dc8c');
      R(ex + 2, ey, 3, 4, SOOT); R(ex, ey + 12, 19, 2, SOOT); R(ex + 2, ey + 13, 4, 3, IRON); R(ex + 12, ey + 13, 4, 3, IRON);
      if (!locked && !G.reduced) { const p = (t * 1.2) % 1; R(ex + 2 - Math.round(p * 3), ey - 3 - Math.round(p * 8), 3, 2, 'rgba(255,255,255,' + (0.5 * (1 - p)).toFixed(2) + ')'); }
      marks(it, x);
      return true;
    }
    case 'track': {
      /* two lengths of track with a gap between them, and a test wagon waiting; the gap is closed once the line is laid */
      const ok = done('track');
      plate(it, x, 52, locked); signal(x + 24, ok, locked);
      rails(x - 34, ok ? x + 34 : x - 4, 126, locked ? '#5a5d66' : RAIL); if (!ok) rails(x + 8, x + 34, 126, locked ? '#5a5d66' : RAIL);
      wagon(x - 30 + (ok ? 40 : 0), 124, 16, locked ? '#4a4d57' : C.mint);
      if (!ok) { R(x - 4, 118, 2, 10, locked ? '#5a5d66' : RED); R(x - 6, 118, 6, 2, locked ? '#5a5d66' : RED); }
      /* a stack of spare rails and sleepers */
      for (let i = 0; i < 3; i++) R(x + 12 + i, 116 - i * 3, 20 - 2 * i, 2, i % 2 ? IRON : TIMBER);
      marks(it, x);
      return true;
    }
    case 'timetable': {
      /* a board of five rows, a lamp at the head of each, and the smoothing lever beside it */
      const ok = done('timetable');
      plate(it, x, 52, locked); signal(x + 24, ok, locked);
      R(x - 30, 74, 50, 44, SOOT); R(x - 28, 76, 46, 40, locked ? '#2a2d36' : '#1c2a44'); R(x - 28, 76, 46, 1, 'rgba(255,255,255,.2)');
      for (let i = 0; i < 5; i++) {
        const y = 79 + i * 7, lit = !locked && (ok ? true : Math.floor(t * 3 + i * 1.7) % 4 === 0);
        R(x - 25, y, 4, 4, lit ? C.amber : '#3a3d46'); R(x - 18, y + 1, ok ? 10 + i * 5 : 8 + (i * 13) % 17, 2, locked ? '#4a4d57' : C.fog);
      }
      R(x + 24, 122, 12, 10, DARK); G.line(x + 30, 124, x + (ok ? 36 : 25), 100, locked ? '#5a5d66' : BRASS); G.disc(x + (ok ? 36 : 25), 99, 2, locked ? '#5a5d66' : RED);
      marks(it, x);
      return true;
    }
    case 'clock': {
      /* a station clock on a bracket. Its hands wander until the station is done, and three short trains stand under it. */
      const ok = done('clock');
      plate(it, x, 52, locked); signal(x + 24, ok, locked);
      R(x - 1, 70, 2, 8, IRON); G.disc(x, 90, 13, locked ? '#4a4d57' : BRASS); G.disc(x, 90, 11, locked ? '#2a2d36' : C.paper);
      if (!locked) {
        const a = ok ? -1.05 : t * 1.3, b = ok ? 0.2 : t * 0.31;
        for (let k = 0; k < 12; k++) R(x + Math.round(Math.sin(k * Math.PI / 6) * 9), 90 - Math.round(Math.cos(k * Math.PI / 6) * 9), 1, 1, C.steel);
        G.line(x, 90, x + Math.sin(a) * 8, 90 - Math.cos(a) * 8, C.ink); G.line(x, 90, x + Math.sin(b) * 5, 90 - Math.cos(b) * 5, C.ink);
      }
      [[C.cyan, 3], [C.amber, 5], [C.pink, 7]].forEach((q, i) => { for (let k = 0; k < 4; k++) wagon(x - 30 + k * 9 + (k >= 4 - Math.floor(q[1] / 2) ? 26 : 0), 114 + i * 7, 8, locked ? '#4a4d57' : q[0]); });
      marks(it, x);
      return true;
    }
    case 'board': {
      /* a departure board on two posts. Its flaps turn over now and then until the board is filled. Vera waits beside it. */
      const here = !locked && !done('board'), ok = done('board');
      plate(it, x, 52, locked); signal(x + 30, ok, locked);
      R(x - 30, 72, 60, 42, SOOT); R(x - 28, 74, 56, 38, locked ? '#2a2d36' : '#10131c');
      for (let i = 0; i < 5; i++) {
        const y = 77 + i * 7, flip = here && Math.floor(t * 2 + i * 2.3) % 7 === 0;
        R(x - 25, y, 26, 5, locked ? '#3a3d46' : flip ? C.steel : ok ? C.paper : '#c9c2ae'); R(x + 4, y, 14, 5, locked ? '#3a3d46' : ok ? C.amber : '#8a8474');
        if (ok && i < 4) R(x + 21, y + 1, 3, 3, C.mint);
      }
      R(x - 24, 114, 3, 18, IRON); R(x + 21, 114, 3, 18, IRON);
      if (here) { const tap = Math.floor(t * 4) % 4 === 0 ? 1 : 0; G.person(x - 44, WALL - tap, VERA, { dir: 1, t }); }
      marks(it, x);
      return true;
    }
    case 'jun':
      G.panel(x - 14, 52, 28, 12, { border: BRASS, fill: C.ink }); T('JUN', x, 53, BRASS, { a: 'center' });
      G.person(x, WALL - 11, JUN, { dir: 1, t });
      /* the yardmaster's desk: a lamp, and a ledger of wagons */
      R(x - 24, 113, 48, 4, TIMBER); R(x - 24, 117, 48, 2, DARK); R(x - 20, 119, 3, 13, DARK); R(x + 17, 119, 3, 13, DARK);
      R(x - 19, 109, 16, 4, C.paper); for (let i = 0; i < 2; i++) R(x - 17, 110 + i * 2, 11, 1, C.steel);
      R(x + 10, 104, 7, 9, DARK); R(x + 11, 105, 5, 5, Math.floor(t * 2) % 5 ? '#f6dc8c' : C.amber); R(x + 12, 101, 3, 3, IRON);
      return true;
    case 'notices': {
      const fl = since('notices') < 0.6 ? 1 : 0;
      R(x - 19, 56 - fl, 38, 34, SOOT); R(x - 18, 57 - fl, 36, 32, '#3a4a3a'); R(x - 18, 57 - fl, 36, 5, TIMBER);
      [[-15, 65, 13, 10, C.paper], [1, 64, 14, 12, '#e8dc9a'], [-12, 78, 20, 8, C.paper]].forEach(q => { R(x + q[0], q[1] - fl, q[2], q[3], q[4]); for (let i = 2; i < q[3] - 1; i += 3) R(x + q[0] + 2, q[1] + i - fl, q[2] - 4, 1, '#6b5f4a'); });
      R(x + 9, 79 - fl, 2, 2, RED);
      return true;
    }
    case 'buffer': {
      /* a buffer stop: a timber beam on a frame, two buffers, and a red lamp. It gives a little when leant on. */
      const give = since('buffer') < 0.5 ? Math.round(Math.sin(since('buffer') / 0.5 * Math.PI) * 2) : 0;
      rails(x - 30, x + 6, 126);
      G.line(x - 4 + give, 128, x + 10 + give, 108, IRON); G.line(x + 20 + give, 128, x + 10 + give, 108, IRON); R(x + 2 + give, 104, 18, 6, TIMBER); R(x + 2 + give, 104, 18, 1, 'rgba(255,255,255,.25)');
      G.disc(x + 1 + give, 107, 3, IRON); R(x - 3 + give, 106, 3, 3, DARK);
      R(x + 9 + give, 98, 5, 6, DARK); R(x + 10 + give, 99, 3, 3, Math.floor(t * 1.5) % 2 ? RED : '#7a2a28');
      return true;
    }
    case 'wagon': {
      /* a wagon on its own. It rolls a little each time it is looked into. */
      const n = o.pokes.wagon || 0, roll = Math.min(n, 3) * 3 + (since('wagon') < 0.6 ? Math.round(Math.sin(since('wagon') / 0.6 * Math.PI) * 2) : 0);
      rails(x - 34, x + 34, 126);
      wagon(x - 22 + roll, 124, 30, '#8a5a3c'); R(x - 20 + roll, 112, 26, 1, 'rgba(0,0,0,.3)');
      R(x - 16 + roll, 119, 9, 1, C.paper); R(x - 16 + roll, 121, 14, 1, C.paper);
      if (n >= 2 && since('wagon') < 2.5) G.cell(x - 9 + roll, 110, C.lilac, 6);
      return true;
    }
    case 'levers': {
      /* a lever frame: six levers in a row. The one that is pulled comes forward. */
      const n = (o.pokes.levers || 0), pull = since('levers') < 0.8 ? Math.sin(Math.min(1, since('levers') / 0.8) * Math.PI) : 0, which = n % 3 === 0 ? 5 : 1 + n % 3;
      R(x - 26, 122, 52, 10, DARK); R(x - 26, 122, 52, 1, '#4a4d57');
      for (let i = 0; i < 6; i++) {
        const lx = x - 21 + i * 8, lean = i === which ? Math.round(pull * 6) : 0;
        G.line(lx, 124, lx + lean, 100 + Math.round(lean / 2), IRON); G.line(lx + 1, 124, lx + 1 + lean, 100 + Math.round(lean / 2), '#3a3d46');
        R(lx - 1 + lean, 97 + Math.round(lean / 2), 3, 4, [RED, C.cyan, C.amber, C.mint, C.lilac, C.paper][i]);
      }
      return true;
    }
    case 'kettle': {
      /* a stove with a kettle on it, and steam that comes and goes */
      R(x - 12, 108, 24, 24, DARK); R(x - 11, 109, 22, 22, '#33363f'); R(x - 6, 118, 12, 8, SOOT); R(x - 5, 119, 10, 6, Math.floor(t * 3) % 2 ? '#e7853b' : '#b85a2a');
      R(x - 2, 60, 4, 48, '#2a2d36'); R(x - 14, 106, 28, 2, IRON);
      R(x - 6, 98, 12, 8, '#8f9aa8'); R(x - 6, 98, 12, 1, 'rgba(255,255,255,.5)'); R(x + 6, 100, 4, 2, '#8f9aa8'); R(x - 3, 95, 6, 3, '#6f7a88');
      if (!G.reduced) for (let i = 0; i < 3; i++) { const p = (t * 0.6 + i / 3) % 1; R(x + 9 + Math.round(Math.sin(p * 6 + i) * 2), 98 - Math.round(p * 16), 2, 2, 'rgba(255,255,255,' + (0.45 * (1 - p)).toFixed(2) + ')'); }
      return true;
    }
  }
  return false;
}

/* what the room itself adds: brick courses, arched windows on to the yard, an iron girder, and rails let into the floor */
function room(cx) {
  for (let y = 20; y < 106; y += 6) R(0, y, VW, 1, 'rgba(0,0,0,.16)');
  for (let wx = -(cx % 24); wx < VW; wx += 24) for (let y = 14; y < 106; y += 12) R(wx + (Math.floor(y / 6) % 4 ? 0 : 12), y, 1, 6, 'rgba(0,0,0,.14)');
  /* the girder under the roof */
  R(0, 46, VW, 2, DARK); for (let x = -(cx % 16); x < VW; x += 16) { G.line(x, 47, x + 8, 40, DARK); G.line(x + 8, 40, x + 16, 47, DARK); } R(0, 39, VW, 1, DARK);
  /* windows, wherever no station or door stands */
  for (let wx = 60; wx < W - 30; wx += 62) {
    if (ITEMS.some(i => (i.kind === 'station' ? Math.abs(i.x - wx) < 58 : (i.kind === 'lift' || i.kind === 'npc' || i.id === 'notices' || i.id === 'kettle') && Math.abs(i.x - wx) < 40))) continue;
    const x = wx - cx; if (x < -20 || x > VW + 20) continue;
    R(x - 11, 62, 22, 36, SOOT); for (let i = 0; i < 4; i++) R(x - 9 + i, 60 - i, 18 - 2 * i, 2, SOOT);
    R(x - 9, 64, 18, 32, '#1d2b4a'); R(x - 9, 84, 18, 12, '#27354f'); for (let i = 0; i < 3; i++) R(x - 7 + i, 62 - i, 14 - 2 * i, 2, '#1d2b4a');
    /* out in the yard: a signal post, and a line of wagons */
    const k = Math.floor(wx / 62);
    R(x - 5 + (k * 5) % 9, 72, 1, 16, '#0f1420'); R(x - 5 + (k * 5) % 9 - 3, 73, 4, 1, k % 2 ? RED : C.mint);
    for (let i = 0; i < 3; i++) R(x - 8 + i * 6, 88, 5, 3, ['#3d5a80', '#8a5a3c', '#5b4a7a'][(k + i) % 3]); R(x - 9, 91, 18, 1, '#0f1420');
    R(x, 62, 1, 34, SOOT); R(x - 9, 78, 18, 1, SOOT);
  }
  /* rails in the floor */
  for (let x = -(cx % 10); x < VW; x += 10) R(x + 2, 167, 5, 10, 'rgba(0,0,0,.35)');
  R(0, 169, VW, 1, RAIL); R(0, 170, VW, 1, IRON); R(0, 174, VW, 1, RAIL); R(0, 175, VW, 1, IRON);
}

G.kits = G.kits || {};
G.kits.order = G.yardhall = { ITEMS, LINES, W, GOALS, NOTES, draw, room, arrive, line: () => null, JUN, wagon, rails, RAIL, IRON, DARK, TIMBER, SOOT, RED,
  paint: ['#0f1118', '#4a302c', '#2a2d36', '#3a2622', '#0f1118', '#1c1e24', '#34363e', '#15171c'] };
})();
