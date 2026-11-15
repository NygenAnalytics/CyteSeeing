/* The Cloud: what the hall looks like and what its furniture says. The walking and the talking
   are in js/world/hall.js; this file holds the things that are only in here.
   There are no rooms in here. One glass pipeline runs along the ceiling, and the player's data
   rides it from station to station. Once, after the Rotator, the data sticks at a valve, and it
   stays there until somebody hits the pipe. */
(function () {
'use strict';
const { R, T, C, VW } = G;
const WALL = 132, W = 1226, PIPE = 24;
const NOOR = { skin: C.skin3, hair: '#15101f', style: 'long', coat: '#5a3f8c', shirt: '#2a2140', pants: '#1f2a3a', shoes: C.ink };

/* one hall, one pipeline, six stations */
const ITEMS = [
  { id: 'lift', kind: 'lift', x: 44, label: 'GO OUT' },
  { id: 'rack', kind: 'prop', x: 122, label: 'LISTEN' },
  { id: 'noor', kind: 'npc', x: 204, label: 'TALK' },
  { id: 'norm', kind: 'station', x: 300, code: '2-1', name: 'LEVELLER', col: C.cyan },
  { id: 'duck', kind: 'prop', x: 372, label: 'EXPLAIN' },
  { id: 'hvg', kind: 'station', x: 444, code: '2-2', name: 'GENE PICKER', col: C.lilac, need: 'norm' },
  { id: 'seeds', kind: 'prop', x: 516, label: 'SHAKE' },
  { id: 'pca', kind: 'station', x: 588, code: '2-3', name: 'ROTATOR', col: C.amber, need: 'hvg' },
  { id: 'elbow', kind: 'prop', x: 660, label: 'LOOK', fig: 'elbow' },
  { id: 'clog', kind: 'prop', x: 726, label: 'LOOK', ay: 62 },
  { id: 'knn', kind: 'station', x: 794, code: '2-4', name: 'NEIGHBOURS', col: C.mint, need: 'pca' },
  { id: 'stickies', kind: 'prop', x: 866, label: 'READ' },
  { id: 'umap', kind: 'station', x: 938, code: '2-5', name: 'MAP TABLE', col: C.pink, need: 'knn' },
  { id: 'gpu', kind: 'prop', x: 1010, label: 'WARM HANDS' },
  { id: 'club', kind: 'station', x: 1086, code: 'FRI', name: 'JOURNAL CLUB', col: C.coral, need: 'umap', label: 'TAKE A SEAT' },
  { id: 'sky', kind: 'prop', x: 1162, label: 'LOOK OUT' },
];

const LINES = {
  rack: [
    'SERVER RACK: The cluster. The other kind of cluster. Neither one is ever free.',
    "SERVER RACK: A label says DO NOT TURN OFF. Underneath, in pencil: 'again'.",
    'SERVER RACK: Job 4,471 has been pending since Tuesday. It still believes in you.',
  ],
  duck: [
    'RUBBER DUCK: You explain your bug to it. Halfway through, you find the bug. The duck takes no credit.',
    'RUBBER DUCK: It has reviewed more code than anyone else in this building.',
  ],
  seeds: [
    'JAR OF SEEDS: Random seeds. Every single one of them is 42.',
    "JAR OF SEEDS: A note inside: 'If your result needs one particular seed, it is not a result.'",
  ],
  stickies: [
    "STICKY NOTES: 'TODO: rerun everything with the correct metadata.' Dated last spring.",
    "STICKY NOTES: 'final_v2_REAL_final.h5ad'. Somebody has added: 'no'.",
    "STICKY NOTES: 'Which normalisation did we use?' Three answers, in three different pens.",
  ],
  gpu: [
    'SPACE HEATER: On closer inspection it is a GPU. It is training something. It heats the whole building.',
    "SPACE HEATER: The model has been 'almost converged' for a week.",
  ],
  sky: [
    'WINDOW: Clouds. They call this building the Cloud. The actual compute is in the basement.',
    'WINDOW: A point cloud has no weather. You check anyway.',
  ],
  clog: {
    idle: 'PIPE: A valve and a gauge. The label says "Solving environment". Nothing is stuck in it. Yet.',
    hit: [
      'PIPE: Your data is stuck right here. The label says "Solving environment". It has said that since Tuesday.',
      'PIPE: You hit it. It prints four thousand lines of dependency conflicts, and one line that matters.',
      'PIPE: You delete the environment and build it again from nothing. The data moves. Nobody will ever know why.',
    ],
    clear: 'PIPE: It flows. Do not update anything. Do not even look at it.',
  },
  noorIntro: [
    'NOOR: I am Noor. I do the analysis round here. No rooms in this hall: one pipeline, six stations, and you walk beside your data.',
    'NOOR: Start at the first station. Your cells were sequenced to different depths, and right now that is all anyone can see.',
  ],
  /* what Noor says depends on how many stations are done */
  noor: [
    ['NOOR: First station. Until depth is dealt with, every plot you make is a plot of depth.'],
    ['NOOR: Depth is out of the way. Follow your data down the pipe, and pick the genes that differ between cells.'],
    ['NOOR: Good genes. The next station squeezes them into a few axes. Bring your sense of direction.'],
    ['NOOR: Axes found. If the pipe jams on the way, hit it. Then give every cell some neighbours.'],
    ['NOOR: Every cell knows its neighbours now. The map table turns that web into a picture. Do not fall in love with it.'],
    ['NOOR: You have a map. Journal club is at the far end, and somebody is about to read far too much into it.'],
    ['NOOR: That is the whole pipeline. The Bureau turns the web into clusters and names. Ida runs it.',
      'NOOR: It is next along the road. And remember: a UMAP is a map, not a result. I will keep saying it.'],
  ],
};

/* the stage's page in the notebook: its steps, and its field notes */
const GOALS = [['norm', '2-1 Leveller: take sequencing depth out'], ['hvg', '2-2 Gene picker: keep the genes that vary'], ['pca', '2-3 Rotator: find the main axes'],
  ['knn', '2-4 Neighbours: link each cell to its nearest'], ['umap', '2-5 Map table: draw the map, twice'], ['club', 'Journal club: nod or object']];
const NOTES = [
  { id: 'c-one', open: true, html: 'No rooms up here. One pipeline, six stations, and the same 174 cells and 207 genes all the way. What you choose at one station is what the next one gets.' },
  { id: 'c-jump', open: true, html: 'Press <b>L</b>, or tap MAP, to step out to the map from anywhere. If a station has no data, Tomo can run the steps before it. No stars for work you did not do.' },
];

/* ---------- the jam ---------- */
const STATIONS = ITEMS.filter(i => i.kind === 'station'), CLOG = ITEMS.find(i => i.id === 'clog');
/* the data sticks in the pipe once, after the Rotator, until somebody hits the pipe */
const stuck = () => G.state.rooms.pca.done && !G.state.unclog;
/* when the pipe was last hit */
let hit = -99;
/* what happens when the player uses something that only this hall has */
function use(it, api) {
  const s = G.state;
  if (it.id === 'knn' && stuck()) { G.sfx('bad'); api.say(['NO DATA: Your data is stuck in the pipe, just before this station. Go back and hit it.']); return true; }
  if (it.id === 'clog') {
    hit = G.t;
    if (stuck()) {
      s.clogHits = (s.clogHits || 0) + 1; G.sfx('pop');
      if (s.clogHits >= 3) { s.unclog = true; G.save(); api.say([LINES.clog.hit[2]], () => { api.found('clog'); G.toast('THE PIPE IS CLEAR. FOLLOW YOUR DATA.', 4); }); }
      else { G.save(); api.say([LINES.clog.hit[s.clogHits - 1]]); }
    } else { G.sfx('blip'); api.say([s.unclog ? LINES.clog.clear : LINES.clog.idle], () => api.found('clog')); }
    return true;
  }
  return false;
}

/* ---------- the pipeline and what rides in it ---------- */
const cap = { x: 0 };
/* where the data is waiting: over the first station that has not had it, or jammed at the valve */
function capTarget() {
  const next = STATIONS.find(i => !G.state.rooms[i.id].done);
  if (!next) return STATIONS[STATIONS.length - 1].x;
  if (next.id === 'knn' && stuck()) return CLOG.x - 13;
  return next.x;
}
function arrive(from) {
  /* the data leaves the station that has just finished with it, and rides on to the next */
  cap.x = from && from.kind === 'station' && G.state.rooms[from.id].done ? from.x : capTarget();
  /* first time in here: the bioinformatician has something to say */
  return G.state.met2 ? null : { say: LINES.noorIntro, then: () => { G.state.met2 = true; G.save(); } };
}
function tick(dt) { const d = capTarget() - cap.x; cap.x += Math.abs(d) > 1 ? Math.sign(d) * Math.min(Math.abs(d), 170 * dt) : d; }
/* over the furniture: the capsule the data rides in */
function over(cx) {
  const t = G.t, moving = Math.abs(cap.x - capTarget()) > 1, jam = stuck() && !moving;
  const x = Math.round(cap.x - cx) + (jam ? Math.round(Math.sin(t * 34)) : 0);
  if (x < -30 || x > VW + 30) return;
  R(x - 9, PIPE + 1, 18, 6, 'rgba(200,240,255,.30)'); R(x - 9, PIPE + 1, 18, 1, 'rgba(255,255,255,.45)'); R(x - 10, PIPE + 2, 1, 4, '#bfe8f4'); R(x + 9, PIPE + 2, 1, 4, '#bfe8f4');
  G.TYPES.forEach((c, i) => R(x - 7 + i * 3, PIPE + 3 + ((i + (moving ? Math.floor(t * 12) : 0)) % 2), 2, 2, c));
  const all = STATIONS.every(i => G.state.rooms[i.id].done);
  if (!moving && !all && Math.floor(t * 2) % 2 === 0) T(jam ? 'STUCK' : 'YOUR DATA', x, PIPE + 10, jam ? C.coral : C.amber, { a: 'center' });
}
/* what a finished station shows on its monitor: its own step, run on the player's data */
let thumbs = {}, thumbKey = '';
function thumb(id) {
  const cl = G.cloud, key = JSON.stringify(G.state.cloud || {});
  if (key !== thumbKey) { thumbs = {}; thumbKey = key; }
  if (thumbs[id]) return thumbs[id];
  cl.build();
  const o = cl.settings(), out = [], TW = 36, TH = 20, kind = i => cl.TYPES[cl.cells[i].type].col;
  const scatter = (pts, col, flip) => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    pts.forEach(q => { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    return pts.map((q, i) => { const v = (q[1] - y0) / (y1 - y0 || 1); return [1 + Math.round((q[0] - x0) / (x1 - x0 || 1) * (TW - 2)), 1 + Math.round((flip ? 1 - v : v) * (TH - 2)), 1, 1, col(i)]; });
  };
  if (id === 'norm') {
    const pc = cl.pca(cl.normalise({ depth: true, log: true }), cl.genes.map((g, j) => j), 2, false);
    scatter(pc.S, kind, true).forEach(q => out.push(q));
  } else if (id === 'hvg') {
    const st = cl.geneStats(), on = {}; cl.pick(st, o.method, o.n, o.block).forEach(j => { on[j] = true; });
    scatter(st.map(g => [g.lm, g.ls]), i => (on[i] ? C.amber : '#3d4868'), true).forEach(q => out.push(q));
  } else if (id === 'pca') {
    const e = cl.scores();
    for (let i = 0; i < Math.min(11, e.ev.length); i++) { const h = Math.max(1, Math.round(e.ev[i] / e.ev[0] * (TH - 2))); out.push([2 + i * 3, TH - 1 - h, 2, h, i < o.dims ? C.amber : '#3d4868']); }
  } else if (id === 'knn') {
    const e = cl.scores(), pts = scatter(e.S.map(q => [q[0] + 0.6 * (q[2] || 0), q[1] + 0.6 * (q[3] || 0)]), () => '#9fb0d8', true);
    cl.web(o.k, o.dims).links.forEach((l, n) => { if (n % 6 === 0) out.push([pts[l[0]][0], pts[l[0]][1], pts[l[1]][0], pts[l[1]][1], '#2f4a80', 'line']); });
    pts.forEach(q => out.push(q));
  } else {
    const P = cl.map(o);
    scatter(cl.cells.map((c, i) => [P[2 * i], P[2 * i + 1]]), kind, false).forEach(q => out.push(q));
  }
  return (thumbs[id] = out);
}

const table = (x, w) => { R(x - w / 2, 116, w, 16, '#4a587f'); R(x - w / 2, 114, w, 3, '#6577a5'); };

/* draws one thing in the hall; returns false for the things hall.js draws itself (the way out) */
function draw(it, x, o) {
  const s = G.state, t = G.t, since = o.since;
  if (it.kind === 'station') {
    /* a monitor fed from the pipe, a name plate, and a console to stand at */
    const locked = o.locked(it), room = s.rooms[it.id], done = room.done, col = locked ? C.steel : it.col;
    R(x - 1, PIPE + 8, 3, 13, '#2c5a66');
    R(x - 21, 44, 42, 26, '#081418'); R(x - 19, 46, 38, 22, locked ? '#0c1417' : '#0e1630');
    if (done) thumb(it.id).forEach(q => { if (q[5]) G.line(x - 18 + q[0], 47 + q[1], x - 18 + q[2], 47 + q[3], q[4]); else R(x - 18 + q[0], 47 + q[1], q[2], q[3], q[4]); });
    else if (locked) T('NO DATA', x, 53, '#3f5560', { a: 'center' });
    else if (Math.floor(t * 2) % 2) T('READY', x, 53, it.col, { a: 'center' });
    const label = it.code + '  ' + it.name, w = Math.ceil(G.tw(label, 'sm')) + 8;
    G.panel(x - w / 2, 73, w, 12, { border: col, fill: C.ink }); T(label, x, 74, locked ? C.steel : C.fog, { a: 'center' });
    if (it.id === 'club') {
      /* the far end: a table, two chairs, and biscuits */
      R(x - 30, 108, 10, 24, '#3a2f4a'); R(x - 30, 100, 3, 10, '#3a2f4a'); R(x + 20, 108, 10, 24, '#3a2f4a'); R(x + 27, 100, 3, 10, '#3a2f4a');
      R(x - 17, 116, 34, 16, '#4a3a2a'); R(x - 17, 114, 34, 3, '#6b5238');
      for (let i = 0; i < 4; i++) R(x - 9 + i * 5, 111, 4, 3, '#d9a35a');
    } else {
      R(x - 17, 92, 34, 40, '#081418'); R(x - 15, 94, 30, 38, locked ? '#182a30' : '#23424b'); R(x - 15, 94, 30, 2, col);
      R(x - 12, 100, 24, 8, '#081418');
      for (let i = 0; i < 5; i++) R(x - 11 + i * 5, 101, 3, 2, !locked && Math.floor(t * 3 + i + it.x) % 4 === 0 ? it.col : '#2f4f58');
      R(x - 11, 104, 22, 3, '#16262c');
      R(x + 8, 111, 3, 3, locked ? '#8a3a3a' : done ? C.mint : Math.floor(t * 2) % 2 ? it.col : C.steel);
    }
    if (done && room.by) T('BY TOMO', x, 120, C.fog, { a: 'center' });
    else if (done) G.stars(x - 13, 120, room.stars);
    return true;
  }
  switch (it.id) {
    case 'rack': {
      R(x - 14, 72, 28, 60, '#0b1a1f'); R(x - 12, 74, 24, 56, '#16262c');
      for (let r = 0; r < 8; r++) {
        R(x - 10, 77 + r * 6, 20, 4, '#0b1a1f');
        const k = Math.floor(t * (3 + r % 3) + r * 1.7) % 6;
        R(x - 9 + k * 3, 78 + r * 6, 2, 2, since('rack') < 1 ? C.coral : r % 3 ? C.mint : C.amber);
      }
      R(x - 12, 126, 24, 2, '#33707a');
      return true;
    }
    case 'noor':
      G.panel(x - 25, 52, 50, 12, { border: C.lilac, fill: C.ink });
      T('DRY LAB', x, 53, C.lilac, { a: 'center' });
      G.person(x, WALL - 11, NOOR, { dir: -1, t });
      R(x - 5, 100, 10, 1, C.ink); R(x - 6, 102, 2, 4, C.coral); R(x + 4, 102, 2, 4, C.coral);
      R(x - 26, 116, 52, 16, '#33444d'); R(x - 26, 114, 52, 3, '#4b626d');
      [[-23, C.mint], [9, C.cyan]].forEach((m, i) => {
        R(x + m[0], 100, 14, 11, C.ink); R(x + m[0] + 1, 101, 12, 9, '#0e1630'); R(x + m[0] + 5, 111, 4, 3, C.ink);
        for (let l = 0; l < 3; l++) R(x + m[0] + 2, 102 + l * 3, 3 + ((Math.floor(t * 2) + l * 5 + i * 3) % 7), 1, m[1]);
      });
      return true;
    case 'duck': {
      const bob = since('duck') < 1.2 ? Math.round(Math.abs(Math.sin(t * 12)) * 2) : 0;
      R(x - 14, 106, 28, 2, '#8a5a3c'); R(x - 12, 108, 2, 5, '#6b4630'); R(x + 10, 108, 2, 5, '#6b4630');
      R(x - 5, 99 - bob, 9, 7, C.amber); R(x + 1, 94 - bob, 6, 6, C.amber); R(x + 7, 97 - bob, 2, 2, C.orange); R(x + 4, 96 - bob, 1, 1, C.ink);
      R(x - 6, 101 - bob, 2, 3, '#d99a2e');
      return true;
    }
    case 'seeds': {
      const sh = since('seeds') < 1 ? Math.round(Math.sin(t * 50)) : 0, rnd = G.rng(12);
      table(x, 28);
      R(x - 7 + sh, 96, 14, 3, C.steel); R(x - 6 + sh, 99, 12, 15, 'rgba(200,230,255,.22)'); R(x - 6 + sh, 99, 1, 15, 'rgba(255,255,255,.3)');
      for (let i = 0; i < 9; i++) R(x - 4 + sh + Math.floor(rnd() * 8), 104 + Math.floor(rnd() * 9) - (since('seeds') < 1 ? Math.floor(rnd() * 3) : 0), 1, 1, C.amber);
      R(x - 5, 84, 11, 9, C.paper); T('42', x - 5, 84, C.ink);
      return true;
    }
    case 'elbow':
      R(x - 15, 66, 30, 34, C.ink); R(x - 13, 68, 26, 30, C.paper);
      [18, 11, 6, 5, 4, 3, 2, 2].forEach((h, i) => R(x - 11 + i * 3, 94 - h, 2, h, i < 4 ? C.teal : '#8a93ab'));
      R(x - 11, 94, 23, 1, C.steel);
      return true;
    case 'stickies': {
      const cols = [C.amber, C.pink, C.mint, C.cyan, C.amber, C.lilac, C.mint, C.pink, C.amber];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
        const k = j * 3 + i, lift = k === 4 && (since('stickies') < 1 || Math.floor(t * 0.5) % 6 === 0) ? 1 : 0;
        R(x - 14 + i * 10, 68 + j * 10 - lift, 8, 8, cols[k]); R(x - 13 + i * 10, 70 + j * 10 - lift, 5, 1, 'rgba(10,15,30,.5)'); R(x - 13 + i * 10, 72 + j * 10 - lift, 4, 1, 'rgba(10,15,30,.5)');
      }
      return true;
    }
    case 'gpu': {
      const k = Math.floor(t * 14) % 2;
      R(x - 14, 112, 28, 20, '#1b2540'); R(x - 14, 110, 28, 3, since('gpu') < 1.5 ? C.coral : '#8a3a3a');
      [-6, 6].forEach(d => { G.ring(x + d, 122, 4, C.steel); R(x + d - (k ? 3 : 0), 122 - (k ? 0 : 3), k ? 7 : 1, k ? 1 : 7, C.fog); });
      for (let i = 0; i < 3; i++) { const u = (t * 0.8 + i * 0.33) % 1; R(x - 8 + i * 8 + Math.round(Math.sin(t * 3 + i) * 1.5), 106 - u * 14, 1, 3, 'rgba(240,101,95,' + (0.5 - u * 0.5).toFixed(2) + ')'); }
      return true;
    }
    case 'sky': {
      R(x - 28, 60, 56, 46, '#0b1a1f'); R(x - 26, 62, 52, 42, '#101c3a');
      G.disc(x + 16, 72, 4, C.paper);
      for (let i = 0; i < 3; i++) {
        const cxp = ((t * (3 + i) + i * 40) % 70) - 9, cy = 74 + i * 9;
        const x0 = x - 26 + cxp, w = 14 + i * 3;
        if (x0 > x - 27 && x0 + w < x + 26) { R(x0, cy, w, 4, 'rgba(197,208,230,.55)'); R(x0 + 3, cy - 2, w - 7, 2, 'rgba(197,208,230,.55)'); }
      }
      R(x - 1, 62, 2, 42, '#0b1a1f'); R(x - 26, 82, 52, 1, '#0b1a1f');
      return true;
    }
    case 'clog': {
      /* a drop from the pipe with a gauge and a valve. The needle shakes while the data is jammed. */
      const jam = stuck(), hitT = G.t - hit, spin = hitT < 0.5 ? Math.floor(t * 20) % 2 : 0;
      R(x - 2, PIPE + 8, 4, 62, '#143039'); R(x - 2, PIPE + 8, 1, 62, '#5aa0ae');
      G.disc(x, 78, 9, '#081418'); G.disc(x, 78, 7, C.paper);
      R(x + 2, 72, 4, 3, C.coral);
      const ang = jam ? -0.3 + Math.sin(t * 40) * 0.2 : -2.2 + Math.sin(t * 1.3) * 0.15;
      G.line(x, 78, x + Math.cos(ang) * 6, 78 + Math.sin(ang) * 6, C.ink);
      G.ring(x, 100, 6, jam ? C.coral : '#8a3a3a'); R(x - (spin ? 5 : 0), 100 - (spin ? 0 : 5), spin ? 11 : 1, spin ? 1 : 11, jam ? C.coral : '#8a3a3a'); R(x - 1, 99, 3, 3, C.ink);
      R(x - 12, 110, 24, 9, C.paper); T('ENV', x, 110, C.ink, { a: 'center' });
      if (jam) for (let i = 0; i < 3; i++) { const u = (t * 0.9 + i * 0.33) % 1; R(x - 6 + i * 5, 68 - u * 12, 2, 2, 'rgba(230,240,255,' + (0.6 - u * 0.6).toFixed(2) + ')'); }
      return true;
    }
  }
  return false;
}

/* what the room itself adds: the pipeline, from where the data comes in to where it is presented */
function room(cx) {
  const a = STATIONS[0].x - 34, b = STATIONS[STATIONS.length - 1].x + 2;
  R(a - cx, PIPE, b - a, 8, '#143039'); R(a - cx, PIPE, b - a, 1, '#5aa0ae'); R(a - cx, PIPE + 7, b - a, 1, '#2c5a66'); R(a - cx, PIPE + 2, b - a, 1, 'rgba(255,255,255,.12)');
  for (let wx = a; wx < b; wx += 44) { const x = wx - cx; if (x > -4 && x < VW + 4) R(x, PIPE - 1, 2, 10, '#5aa0ae'); }
  R(a - cx - 4, 11, 6, PIPE - 3, '#143039'); R(a - cx - 4, 11, 1, PIPE - 3, '#5aa0ae');
}

G.kits = G.kits || {};
G.kits.map = { ITEMS, LINES, W, GOALS, NOTES, draw, room, over, use, tick, arrive, line: () => null,
  /* while the data sticks, the station after the valve has nothing to work on */
  locked: it => it.id === 'knn' && stuck(),
  label: it => (it.id === 'clog' && stuck() ? 'HIT THE PIPE' : null),
  /* the arrow points at the valve until the pipe is clear */
  next: () => (stuck() ? 'clog' : null),
  /* green-grey, for the dry lab */
  paint: ['#0b1a1f', '#234650', '#33707a', '#1b343c', '#0b1a1f', '#13272e', '#1c3a43', '#0e1f25'] };
/* a test hook: where the capsule is */
G.scenes.corridor.dbg.capX = () => Math.round(cap.x);
})();
