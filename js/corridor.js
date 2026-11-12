/* The floors you walk. The ground floor is a corridor of doors, one analysis step behind each.
   Floor 2 has no rooms: it is one hall with a glass pipeline along the wall, and the player's
   data rides it from station to station. Everything else is there to be poked: most things
   answer with a line, some move, and some open a figure (see figures.js).
   The lift directory opens from anywhere (L), and a step the player has no data for can be
   handed to the student: it gets done, with default settings and no stars. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const FY = 154, WALL = 132, SPEED = 100;
let W = 1960;

const HERO = { skin: C.skin1, hair: '#3a2a22', style: 'short', coat: C.paper, shirt: C.cyan, pants: '#2c3a5e', shoes: C.ink };
const NOOR = { skin: C.skin3, hair: '#15101f', style: 'long', coat: '#5a3f8c', shirt: '#2a2140', pants: '#1f2a3a', shoes: C.ink };
const MIKA = { skin: C.skin2, hair: '#1b1b2a', style: 'bun', coat: '#2f9e8f', shirt: C.paper, pants: '#2c3a5e', shoes: C.ink, glasses: true };

const ITEMS_G = [
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
  { id: 'lift', kind: 'lift', x: 1904, label: 'CALL LIFT' },
  { id: 'robot', kind: 'prop', x: 420, label: 'PET', floor: true },
];
/* floor 2, the Cloud: one hall, one pipeline, six stations */
const ITEMS_2 = [
  { id: 'lift', kind: 'lift', x: 44, label: 'CALL LIFT' },
  { id: 'rack', kind: 'prop', x: 122, label: 'LISTEN' },
  { id: 'noor', kind: 'npc', x: 204, label: 'TALK' },
  { id: 'norm', kind: 'station', x: 300, code: '2-1', name: 'LEVELLER', col: C.cyan },
  { id: 'duck', kind: 'prop', x: 372, label: 'EXPLAIN' },
  { id: 'hvg', kind: 'station', x: 444, code: '2-2', name: 'GENE PICKER', col: C.lilac, need: 'norm' },
  { id: 'seeds', kind: 'prop', x: 516, label: 'SHAKE' },
  { id: 'pca', kind: 'station', x: 588, code: '2-3', name: 'ROTATOR', col: C.amber, need: 'hvg' },
  { id: 'elbow', kind: 'prop', x: 660, label: 'LOOK', fig: 'elbow' },
  { id: 'clog', kind: 'prop', x: 726, label: 'LOOK' },
  { id: 'knn', kind: 'station', x: 794, code: '2-4', name: 'NEIGHBOURS', col: C.mint, need: 'pca' },
  { id: 'stickies', kind: 'prop', x: 866, label: 'READ' },
  { id: 'umap', kind: 'station', x: 938, code: '2-5', name: 'MAP TABLE', col: C.pink, need: 'knn' },
  { id: 'gpu', kind: 'prop', x: 1010, label: 'WARM HANDS' },
  { id: 'club', kind: 'station', x: 1086, code: 'FRI', name: 'JOURNAL CLUB', col: C.coral, need: 'umap' },
  { id: 'sky', kind: 'prop', x: 1162, label: 'LOOK OUT' },
];
const FLOORSET = {
  g: { title: 'G  CORE FACILITY', label: 'Ground floor · Core facility', W: 1960, items: ITEMS_G, rooms: ['droplets', 'cliff', 'qc', 'soup', 'doublet'] },
  2: { title: '2  THE CLOUD', label: 'Floor 2 · The Cloud', W: 1226, items: ITEMS_2, rooms: ['norm', 'hvg', 'pca', 'knn', 'umap', 'club'] },
};
let ITEMS = ITEMS_G, EGGS = [], ROBOT = null, ROOMS = [], floorId = 'g';
function setFloor(id) {
  floorId = FLOORSET[id] ? String(id) : 'g';
  const f = FLOORSET[floorId];
  ITEMS = f.items; W = f.W; ROOMS = f.rooms;
  EGGS = ITEMS.filter(i => i.kind === 'prop').map(i => i.id);
  ROBOT = ITEMS.find(i => i.id === 'robot') || null;
  G.state.floor = floorId;
}
setFloor('g');
const groundDone = () => FLOORSET.g.rooms.every(k => G.state.rooms[k].done);
/* the data sticks in the pipe once, after the Rotator, until somebody hits the pipe */
const stuck = () => G.state.rooms.pca.done && !G.state.unclog;
const isLocked = it => !!it.soon || (!!it.need && !G.state.rooms[it.need].done) || (it.id === 'knn' && stuck());
const isStep = it => it.kind === 'door' || it.kind === 'station';
const roomsDone = () => ROOMS.filter(k => G.state.rooms[k].done).length;

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
    'PLANT: The only thing on this floor with consistent growth conditions.',
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
    'PHD STUDENT: Zzz... just one more clustering resolution... zzz...',
    'PHD STUDENT: Zzz... but it worked on the tutorial data... zzz...',
    'PHD STUDENT: Zzz... p equals zero point zero five one... nooo...',
    'PHD STUDENT: (wakes) Is the cluster free? (checks) It is not free. (sleeps)',
  ],
  centrifuge: [
    'CENTRIFUGE: Balanced? You check. You check again. You will check a third time from the door.',
    'CENTRIFUGE: 300 g, five minutes. Long enough to doubt every decision that led you here.',
  ],
  vending: [
    'VENDING: B4 is stuck. It has been stuck since the last grant renewal.',
    "VENDING: You buy 'Significance Crisps'. The bag is 95% air. Very confident, though.",
    'VENDING: Out of order. Please use the machine on floor 3, which is under construction.',
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
  rack: [
    'SERVER RACK: The cluster. The other kind of cluster. Neither one is ever free.',
    "SERVER RACK: A label says DO NOT TURN OFF. Underneath, in pencil: 'again'.",
    'SERVER RACK: Job 4,471 has been pending since Tuesday. It still believes in you.',
  ],
  duck: [
    'RUBBER DUCK: You explain your bug to it. Halfway through, you find the bug. The duck takes no credit.',
    'RUBBER DUCK: It has reviewed more code than anyone else on this floor.',
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
    'SPACE HEATER: On closer inspection it is a GPU. It is training something. It heats the whole floor.',
    "SPACE HEATER: The model has been 'almost converged' for a week.",
  ],
  sky: [
    'WINDOW: Clouds. Up here they call it the Cloud floor. The actual compute is in the basement.',
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
  summonFloor: [
    'YOU: Could you run the sample for me? Load it, call the cells, QC, soup, doublets. By lunch.',
    'PHD STUDENT: (wakes) All of it? By lunch? ...Fine. I did not need lunch.',
    'PHD STUDENT: Done. Default settings everywhere. Please do not look at the QC plots.',
  ],
  summonStep: [
    'YOU: (typing) Could you run the steps before this one for me? Default settings are fine.',
    'PHD STUDENT: (three dots, for a long time) ...ok. Done. Please never open my notebook.',
  ],
  noorIntro: [
    'NOOR: New here? Good. You brought a count matrix, which is more than most people manage.',
    'NOOR: No rooms up here. One pipeline, six stations. Your data rides the pipe, and you walk beside it.',
    'NOOR: Start at the first station. Your cells were sequenced to different depths, and right now that is all anyone can see.',
  ],
  noor: [
    ['NOOR: First station. Until depth is dealt with, every plot you make is a plot of depth.'],
    ['NOOR: Depth is out of the way. Follow your data down the pipe, and pick the genes that differ between cells.'],
    ['NOOR: Good genes. The next station squeezes them into a few axes. Bring your sense of direction.'],
    ['NOOR: Axes found. If the pipe jams on the way, hit it. Then give every cell some neighbours.'],
    ['NOOR: Every cell knows its neighbours now. The map table turns that web into a picture. Do not fall in love with it.'],
    ['NOOR: You have a map. Journal club is at the far end, and somebody is about to read far too much into it.'],
    ['NOOR: That is the whole floor. Floor 3 turns the web into clusters and names. It is still scaffolding.',
      'NOOR: Until then, remember: a UMAP is a map, not a result. I will keep saying it.'],
  ],
  intro: [
    'MIKA: You must be the new postdoc. Welcome to the core facility. The coffee is bad and the freezers are full.',
    'MIKA: Your tissue is dissociated and waiting. Bay 1-1 is free, so go and load the chip.',
    'MIKA: One warning. Whatever you do in a room follows you down this corridor. Like a reputation.',
  ],
  mika: [
    ['MIKA: Bay 1-1 is the first door on your right. The cells will not load themselves. I have asked.'],
    ['MIKA: Good run. The sequencer has finished with your library too. It only complained twice.',
      'MIKA: Next is the Cliff. There are far more barcodes than cells. Work out which ones are real.'],
    ['MIKA: Cells called. Room 1-3 is quality control. Not every called cell is a healthy cell.',
      'MIKA: Somebody left the thresholds at the values from a tutorial. Do not trust them. Or the somebody.'],
    ['MIKA: Filtered. Next is the soup kitchen. Stray RNA got into every droplet you made.',
      'MIKA: Bring your empty droplets from the Cliff. They are the recipe.'],
    ['MIKA: One room left. The doublets you loaded on day one are still in there. Go and get them.'],
    ['MIKA: A clean matrix. That is the whole ground floor. I am almost impressed.',
      'MIKA: Reviewer 2 will see you now. Their door is at the far end. Bring your reasons.',
      'MIKA: The lift beside it goes up to floor 2 now. Noor runs the dry lab. Tell her I said hello.'],
    ['MIKA: You survived review. The lift at the far end goes up to floor 2. Floors 3 to 10 are still scaffolding.',
      'MIKA: If you can code, you could build one. The whole institute is open source, on GitHub.',
      'MIKA: Have a coffee first. Not from that machine.'],
  ],
};
const FLOORS = [
  ['10', 'MECHANISMS', 'perturbation, cell talk'],
  ['9', 'TISSUE', 'spatial omics'],
  ['8', 'SURFACE', 'proteins, receptors'],
  ['7', 'CHROMATIN', 'scATAC-seq'],
  ['6', 'TIME', 'trajectories, velocity'],
  ['5', 'CONDITIONS', 'DE, composition'],
  ['4', 'BATCHES', 'integration, mapping'],
  ['3', 'IDENTITY', 'clusters, annotation'],
  ['2', 'THE CLOUD', 'PCA, neighbours, UMAP'],
  ['G', 'CORE FACILITY', 'droplets to QC'],
];

let hero = { x: 24, dir: 1, walking: false }, cam = 0, talk = null, talkAfter = null, auto = null, dir = false, near = null, fig = null, goal = null, runT = 0, party = -99, liftHint = 0, ask = null;
const cap = { x: 0 };
const pokes = {}, fx = {};
const robot = { x: 420, dir: 1, wait: 0 };
const since = id => (fx[id] === undefined ? 99 : G.t - fx[id]);

function eggCount() { return EGGS.filter(e => G.state.eggs[e]).length; }
function showBook() {
  const s = G.state, st = r => (!r.done ? '' : r.by ? ' (your student did it)' : ' (' + '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars) + ')');
  const todo = floorId === '2'
    ? [['norm', '2-1 Leveller: take sequencing depth out'], ['hvg', '2-2 Gene picker: keep the genes that vary'], ['pca', '2-3 Rotator: find the main axes'],
      ['knn', '2-4 Neighbours: link each cell to its nearest'], ['umap', '2-5 Map table: draw the map, twice'], ['club', 'Journal club: nod or object']]
    : [['droplets', '1-1 Droplet bay: load the chip'], ['cliff', '1-2 The Cliff: call the cells'], ['qc', '1-3 QC gate: filter damaged cells'],
      ['soup', '1-4 Soup kitchen: remove stray RNA'], ['doublet', '1-5 Doublet hunt: find the doublets'], ['review', 'Face Reviewer 2']];
  G.book.show({
    floor: FLOORSET[floorId].label, room: 'The corridor', methods: true, file: 'js/corridor.js', fileText: 'add something to this corridor', fileTail: ' yourself.',
    goals: todo.map(r => ({ id: r[0], text: r[1] + st(s.rooms[r[0]]) })).concat([
      { id: 'e', text: 'Poke around: ' + eggCount() + ' of ' + EGGS.length + ' things found' }]),
    notes: floorId === '2' ? [
      { id: 'c-one', open: true, html: 'No rooms up here. One pipeline, six stations, and the same 174 cells and 207 genes all the way. What you choose at one station is what the next one gets.' },
      { id: 'c-jump', open: true, html: 'Press <b>L</b>, or tap FLOORS, to change floor from anywhere. If a station has no data, your student can run the steps before it. No stars for work you did not do.' },
    ] : [
      { id: 'walk', open: true, html: 'Arrow keys walk. Space talks, reads, pokes and opens doors. Most things answer back, and some have more than one thing to say.' },
      { id: 'plan', open: true, html: 'The rooms open in order, because the analysis has an order. Finish this floor and the lift goes up to floor 2.' },
      { id: 'jump', open: true, html: 'In a hurry? Press <b>L</b>, or tap FLOORS, to change floor from anywhere. If you have no data for a floor or a room, your student will fetch some. No stars for work you did not do.' },
    ],
    term: null,
  });
  todo.forEach(r => G.book.goal(r[0], s.rooms[r[0]].done ? true : null));
  G.book.goal('e', eggCount() === EGGS.length ? true : null);
}
function say(lines, after) { talk = new G.Beats(lines.map(l => ({ say: l }))); talkAfter = after || null; }
function found(id) {
  const s = G.state;
  if (s.eggs[id]) return;
  s.eggs[id] = true; G.save(); showBook();
  const n = eggCount();
  G.toast(n === EGGS.length ? 'ALL ' + n + ' FOUND. YOUR H-INDEX IS UNCHANGED.' : 'FOUND ' + n + ' OF ' + EGGS.length + ' ON THIS FLOOR', n === EGGS.length ? 6 : 3);
  G.sfx('star');
}

/* the student does these steps: default settings, and no stars */
function summon(ids) {
  const s = G.state;
  ids.forEach(r => { if (!s.rooms[r].done) s.rooms[r] = { done: true, stars: 0, by: 'student' }; });
  if (ids.indexOf('pca') >= 0 || ids.indexOf('knn') >= 0) s.unclog = true;
  if (groundDone()) s.liftTold = true;
  G.save(); showBook(); G.sfx('star');
}
function openDir() { if (talk || fig || ask || auto) return; dir = { sel: floorId === '2' ? 8 : 9 }; goal = null; G.sfx('door'); }
function ride(i) {
  const id = i === 8 ? '2' : 'g';
  dir = false;
  if (id === floorId) { G.sfx('blip'); return; }
  if (id === '2' && !groundDone()) {
    G.sfx('blip');
    ask = { text: 'FLOOR 2: The Cloud works on a clean count matrix, and you have not made one. Make it down here, or ask your student?', opts: ['MAKE IT MYSELF', 'ASK MY STUDENT'], sel: 0,
      pick: k => { ask = null; if (k === 1) say(LINES.summonFloor, () => { summon(FLOORSET.g.rooms); G.sfx('door'); G.go('corridor', { floor: '2', from: 'lift', toast: 'YOUR STUDENT MADE THE MATRIX. NO STARS FOR THAT.' }); }); } };
    return;
  }
  G.sfx('door'); G.go('corridor', { floor: id, from: 'lift' });
}

function interact(it) {
  const s = G.state;
  if (isStep(it)) {
    if (it.id === 'knn' && stuck() && s.rooms.pca.done) { G.sfx('bad'); say(['NO DATA: Your data is stuck in the pipe, just before this station. Go back and hit it.']); return; }
    if (isLocked(it)) {
      const need = ITEMS.find(i => i.id === it.need), ids = ROOMS.slice(0, ROOMS.indexOf(it.id)).filter(r => !s.rooms[r].done);
      G.sfx('bad');
      ask = { text: 'NO DATA: ' + it.code + ' needs what ' + need.code + ' makes, and you have not made it. Do it yourself, or ask your student?', opts: ['DO IT MYSELF', 'ASK MY STUDENT'], sel: 0,
        pick: k => { ask = null; if (k === 1) say(LINES.summonStep, () => { summon(ids); G.toast('YOUR STUDENT DID ' + ids.length + (ids.length === 1 ? ' STEP' : ' STEPS') + '. NO STARS FOR THOSE.', 5); }); } };
      return;
    }
    G.sfx('door'); G.go(it.id, {});
    return;
  }
  if (it.id === 'clog') {
    fx.clog = G.t;
    if (stuck()) {
      s.clogHits = (s.clogHits || 0) + 1; G.sfx('pop');
      if (s.clogHits >= 3) { s.unclog = true; G.save(); say([LINES.clog.hit[2]], () => { found('clog'); G.toast('THE PIPE IS CLEAR. FOLLOW YOUR DATA.', 4); }); }
      else { G.save(); say([LINES.clog.hit[s.clogHits - 1]]); }
    } else { G.sfx('blip'); say([s.unclog ? LINES.clog.clear : LINES.clog.idle], () => found('clog')); }
    return;
  }
  if (it.id === 'mika') { say(LINES.mika[roomsDone() + (s.rooms.review.done ? 1 : 0)]); return; }
  if (it.id === 'noor') { say(LINES.noor[roomsDone()]); return; }
  if (it.id === 'rev2' && roomsDone() === ROOMS.length) { G.sfx('door'); G.go('review', {}); return; }
  if (it.kind === 'lift') { openDir(); return; }
  const n = pokes[it.id] = (pokes[it.id] || 0) + 1;
  fx[it.id] = G.t;
  G.sfx(it.id === 'robot' ? 'scan' : 'blip');
  if (it.fig) { fig = { id: it.fig, t: 0, after: () => found(it.id) }; return; }
  const lines = LINES[it.id], i = it.stick ? Math.min(n - 1, lines.length - 1) : (n - 1) % lines.length;
  if (it.id === 'bench' && i === 2) { s.eggs.cup = true; G.save(); }
  say([lines[i]], () => found(it.id));
}

G.scenes.corridor = {
  /* test hooks: jump to an x, or open a figure */
  dbg: { at: x => { hero.x = x; cam = G.clamp(x - 150, 0, W - VW); }, fig: id => { fig = { id, t: 1 }; }, clear: () => { talk = null; fig = null; dir = false; goal = null; ask = null; }, cam: () => cam, heroX: () => hero.x, busy: () => !!(talk || fig || dir || auto || ask), asking: () => !!ask, capX: () => Math.round(cap.x), items: () => ITEMS.map(i => [i.id, Math.round(i.x)]) },
  enter(a) {
    talk = null; dir = false; auto = null; near = null; fig = null; goal = null; runT = 0; ask = null;
    const was = floorId;
    setFloor(a.floor || G.state.floor || 'g');
    const from = a.from && ITEMS.find(i => i.id === a.from);
    if (from) { hero.x = from.x; hero.dir = floorId === '2' && a.from === 'lift' ? 1 : hero.dir; }
    else if (was !== floorId) { hero.x = ITEMS.find(i => i.kind === 'lift').x; }
    else if (!G.state.met) { hero.x = -8; hero.dir = 1; auto = { to: 128, then: () => { say(LINES.intro, () => { G.state.met = true; G.save(); }); } }; }
    else { hero.x = Math.max(30, hero.x); }
    cam = G.clamp(hero.x - 150, 0, W - VW);
    /* the data leaves the station that has just finished with it, and rides on to the next */
    if (floorId === '2') cap.x = from && from.kind === 'station' && G.state.rooms[from.id].done ? from.x : capTarget();
    showBook();
    if (a.toast) G.toast(a.toast, 4);
    if (a.party) party = G.t;
    /* first time upstairs: the bioinformatician has something to say */
    if (floorId === '2' && !G.state.met2 && !auto) say(LINES.noorIntro, () => { G.state.met2 = true; G.save(); });
    /* the last room downstairs is done: say once, after the room's own toast, that the lift now goes up */
    liftHint = floorId === 'g' && groundDone() && !G.state.liftTold ? G.t + (a.toast ? 4.3 : 1) : 0;
    G.save();
  },
  update(dt) {
    hero.walking = false;
    if (liftHint && G.t > liftHint && !talk && !fig && !dir) { G.toast('THE LIFT NOW GOES UP TO FLOOR 2', 5); G.sfx('ok'); G.state.liftTold = true; G.save(); liftHint = 0; }
    /* the robot keeps cleaning whatever else is going on */
    if (ROBOT) {
      if (robot.wait > 0) robot.wait -= dt;
      else {
        robot.x += robot.dir * 24 * dt;
        if (robot.x > 1560 || robot.x < 250) { robot.dir *= -1; robot.wait = 1.2; }
        if (Math.abs(robot.x - hero.x) < 9 && since('bump') > 4) { fx.bump = G.t; robot.dir *= -1; robot.wait = 0.8; G.sfx('pop'); }
      }
      ROBOT.x = robot.x;
    }

    if (floorId === '2') { const d = capTarget() - cap.x; cap.x += Math.abs(d) > 1 ? Math.sign(d) * Math.min(Math.abs(d), 170 * dt) : d; }
    if (G.hit('lift') || (G.ptr.pressed && floorsBtn().hot)) { if (dir) { dir = false; G.sfx('blip'); } else openDir(); }
    if (ask) {
      if (G.hit('left') || G.hit('right') || G.hit('up') || G.hit('down')) { ask.sel = 1 - ask.sel; G.sfx('tick'); }
      if (G.hit('a')) ask.pick(ask.sel); else if (G.hit('b')) ask.pick(0);
      return;
    }
    if (fig) {
      fig.t += dt;
      if (fig.t > 0.35 && (G.hit('a') || G.hit('b') || G.hit('left') || G.hit('right') || G.ptr.pressed)) { const f = fig.after; fig = null; G.sfx('blip'); if (f) f(); }
      return;
    }
    if (dir) {
      /* the directory: the two built floors can always be picked */
      if (G.hit('up') || G.hit('down')) { dir.sel = dir.sel === 9 ? 8 : 9; G.sfx('tick'); }
      if (G.hit('a')) ride(dir.sel);
      else if (G.hit('b') || G.hit('left') || G.hit('right')) { dir = false; G.sfx('blip'); }
      else if (G.ptr.pressed && !floorsBtn().hot) {
        const row = Math.floor((G.ptr.y - 29) / 12);
        if (row === 8 || row === 9) ride(row);
        else if (row >= 0 && row < 8) { G.toast('UNDER CONSTRUCTION', 2.5); G.sfx('bad'); }
        else { dir = false; G.sfx('blip'); }
      }
      return;
    }
    if (talk) {
      const r = talk.update(dt);
      if (r === 'done') { talk = null; const f = talkAfter; talkAfter = null; if (f) f(); }
      return;
    }
    if (auto) {
      hero.x += 62 * dt; hero.walking = true; hero.dir = 1;
      if (hero.x >= auto.to) { const f = auto.then; auto = null; f(); }
    } else {
      let mv = (G.down.right ? 1 : 0) - (G.down.left ? 1 : 0);
      if (mv) goal = null;
      /* a tap or click sets somewhere to walk to. On a thing, the player walks over and pokes it. */
      if (G.ptr.pressed && G.ptr.y > 13 && !G.uiBusy()) {
        const wx = G.ptr.x + cam;
        let it = null, best = 24;
        ITEMS.forEach(i => { const d = Math.abs(i.x - wx), band = i.floor ? G.ptr.y > WALL + 18 : G.ptr.y < WALL + 4; if (band && d < best) { best = d; it = i; } });
        goal = { x: it ? it.x : G.clamp(wx, 12, W - 14), it };
      }
      if (goal && !mv) {
        if (goal.it) goal.x = goal.it.x;                                        /* the robot moves */
        else if (G.ptr.down) goal.x = G.clamp(G.ptr.x + cam, 12, W - 14);      /* a held finger keeps leading */
        const dx = goal.x - hero.x;
        if (Math.abs(dx) > 3) mv = dx > 0 ? 1 : -1;
        else { const it = goal.it; if (it || !G.ptr.down) goal = null; if (it) interact(it); }
      }
      if (mv) {
        /* a long walk breaks into a jog */
        runT += dt;
        const v = SPEED + Math.min(70, Math.max(0, runT - 0.8) * 110);
        hero.x = G.clamp(hero.x + mv * v * dt, 12, W - 14); hero.dir = mv; hero.walking = true;
        if (Math.floor(G.t * 9) % 4 === 0 && Math.floor((G.t - dt) * 9) % 4 !== 0) G.sfx('step');
      } else runT = 0;
    }
    cam += (G.clamp(hero.x - 150, 0, W - VW) - cam) * Math.min(1, dt * 8);


    near = null; let best = 20;
    ITEMS.forEach(it => { const d = Math.abs(it.x - hero.x) + (it.floor ? 4 : 0); if (d < best) { best = d; near = it; } });
    if (near && !auto && !talk && !fig && !dir && !ask) {
      if (G.hit('a') || G.hit('up')) { goal = null; interact(near); }
    }
  },
  draw() {
    const cx = Math.round(cam);
    drawRoom(cx);
    ITEMS.forEach(it => { if (!it.floor && it.x - cx > -70 && it.x - cx < VW + 70) drawItem(it, it.x - cx); });
    drawCapsule(cx);
    G.person(hero.x - cx, FY, HERO, { dir: hero.dir, walk: hero.walking, t: G.t });
    drawFront(cx);
    drawNext(cx);

    /* header */
    R(0, 0, VW, 11, 'rgba(8,12,26,.85)');
    T(FLOORSET[floorId].title, 5, 1, C.fog);
    /* the way to the other floors, from anywhere */
    const fb = floorsBtn();
    G.panel(fb.x, 0, fb.w, 11, { border: fb.hot ? C.cyan : C.slate, fill: C.night }); T(fb.label, fb.x + 4, 1, fb.hot ? C.white : C.mist);
    /* a strip map of the corridor: the doors, and you */
    R(0, 11, VW, 2, '#0c1329');
    ITEMS.forEach(i => {
      if (isStep(i)) R(Math.round(i.x * VW / W) - 1, 11, 3, 2, isLocked(i) ? C.slate : i.col);
      else if (i.id === 'rev2') R(Math.round(i.x * VW / W) - 1, 11, 3, 2, roomsDone() === ROOMS.length ? C.coral : '#5a1f2a');
    });
    R(Math.round(hero.x * VW / W) - 1, 10, 2, 4, C.white);
    G.star(VW - 44, 2, true);
    T(G.totalStars() + '/' + G.maxStars(), VW - 5, 1, C.amber, { a: 'right' });

    if (near && !talk && !auto && !dir && !fig && !ask) {
      const lab = near.kind === 'door' ? (isLocked(near) ? 'LOCKED' : 'ENTER ' + near.code)
        : near.kind === 'station' ? (isLocked(near) ? 'NO DATA' : near.id === 'club' ? 'TAKE A SEAT' : 'USE ' + near.code)
        : near.id === 'clog' && stuck() ? 'HIT THE PIPE'
        : near.id === 'rev2' && roomsDone() === ROOMS.length ? 'FACE REVIEW' : near.label;
      const w = Math.ceil(G.tw(lab, 'sm')) + 10, x = G.clamp(Math.round(hero.x - cx - w / 2), 2, VW - w - 2), y = FY - 36 + Math.round(Math.sin(G.t * 4));
      G.panel(x, y, w, 12, { border: C.amber, fill: C.ink });
      T(lab, x + 5, y + 1, C.amber);
    }
    if (talk) talk.draw({ top: true });
    if (ask) {
      G.caption(ask.text, 99, { top: true, noPrompt: true, border: C.amber });
      ask.opts.forEach((o, i) => { if (G.button('ask' + i, 12 + i * 152, 70, 144, 15, o, { focus: ask.sel === i, primary: i === 1 }) && ask) ask.pick(i); });
    }
    if (dir) drawDirectory();
    if (fig) G.drawFigure(fig.id, fig.t);
  },
};

/* ---------- where to go next ---------- */
/* No words: an arrow bounces over the next thing to do. If that is off the screen, the arrow
   sits at the edge it lies beyond. */
function nextStop() {
  const s = G.state;
  if (floorId === 'g') {
    const d = ITEMS.find(i => i.kind === 'door' && !s.rooms[i.id].done);
    if (d) return d;
    return s.rooms.review.done ? ITEMS.find(i => i.kind === 'lift') : ITEMS.find(i => i.id === 'rev2');
  }
  if (stuck()) return ITEMS.find(i => i.id === 'clog');
  return stations().find(i => !s.rooms[i.id].done) || null;
}
function drawNext(cx) {
  const it = nextStop();
  if (!it || talk || ask || dir || fig || auto) return;
  const x = it.x - cx, y = it.id === 'clog' ? 62 : it.kind === 'station' ? 42 : it.kind === 'lift' ? 56 : 42;
  if (x < 8 || x > VW - 8) {
    /* beyond the edge: point that way */
    const right = x > VW - 8, ax = right ? VW - 6 : 6, b = Math.round(Math.abs(Math.sin(G.t * 6)) * 3) * (right ? 1 : -1);
    for (let i = 0; i < 5; i++) R(ax + b + (right ? i - 4 : 4 - i), 84 - 4 + i, 1, 9 - 2 * i, C.amber);
    return;
  }
  if (near !== it) G.cue(x, y, true);
}

/* ---------- the header button, the pipeline and what rides in it ---------- */
function floorsBtn() {
  const label = G.kt('L: FLOORS', 'FLOORS'), x = 5 + Math.ceil(G.tw(FLOORSET[floorId].title, 'sm')) + 8, w = Math.ceil(G.tw(label, 'sm')) + 8;
  return { label, x, w, hot: G.ptr.y >= 0 && G.ptr.y < 12 && G.ptr.x >= x - 2 && G.ptr.x < x + w + 2 };
}
const PIPE = 24;
const stations = () => ITEMS.filter(i => i.kind === 'station');
/* where the data is waiting: over the first station that has not had it, or jammed at the valve */
function capTarget() {
  const st = stations(), next = st.find(i => !G.state.rooms[i.id].done);
  if (!next) return st[st.length - 1].x;
  if (next.id === 'knn' && stuck()) return ITEMS.find(i => i.id === 'clog').x - 13;
  return next.x;
}
function drawCapsule(cx) {
  if (floorId !== '2') return;
  const t = G.t, moving = Math.abs(cap.x - capTarget()) > 1, jam = stuck() && !moving;
  const x = Math.round(cap.x - cx) + (jam ? Math.round(Math.sin(t * 34)) : 0);
  if (x < -30 || x > VW + 30) return;
  R(x - 9, PIPE + 1, 18, 6, 'rgba(200,240,255,.30)'); R(x - 9, PIPE + 1, 18, 1, 'rgba(255,255,255,.45)'); R(x - 10, PIPE + 2, 1, 4, '#bfe8f4'); R(x + 9, PIPE + 2, 1, 4, '#bfe8f4');
  G.TYPES.forEach((c, i) => R(x - 7 + i * 3, PIPE + 3 + ((i + (moving ? Math.floor(t * 12) : 0)) % 2), 2, 2, c));
  const all = stations().every(i => G.state.rooms[i.id].done);
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

/* ---------- drawing ---------- */
function drawRoom(cx) {
  /* each floor has its own paint: blue for the wet lab, green-grey for the dry lab */
  const p = floorId === '2' ? ['#0b1a1f', '#234650', '#33707a', '#1b343c', '#0b1a1f', '#13272e', '#1c3a43', '#0e1f25']
    : ['#0c1329', '#27385f', '#3a5187', '#1e2b4c', '#0c1329', '#161f3d', '#222e57', '#111833'];
  R(0, 0, VW, 14, p[0]);
  R(0, 14, VW, 92, p[1]);
  R(0, 106, VW, 2, p[2]);
  R(0, 108, VW, 20, p[3]);
  R(0, 128, VW, 4, p[4]);
  R(0, WALL, VW, VH - WALL, p[5]);
  R(0, WALL, VW, 3, p[6]);
  for (let x = -(cx % 34); x < VW; x += 34) R(x, WALL + 3, 1, VH - WALL - 3, p[7]);
  /* guide lines on the floor, one per open room, the way hospitals and institutes mark routes */
  ITEMS.filter(i => i.kind === 'door').forEach((d, n) => {
    const y = 163 + n * 3, x1 = d.x - cx, col = isLocked(d) ? '#2a3560' : d.col;
    R(-cx, y, d.x, 2, col); R(x1 - 1, WALL + 4, 2, y - WALL - 2, col);
  });
  /* ceiling pipe and lamps; one of them has been flickering since 2022 */
  R(0, 9, VW, 2, '#1b2647');
  for (let wx = 48, n = 0; wx < W; wx += 110, n++) {
    const x = wx - cx;
    if (x < -40 || x > VW + 40) continue;
    const off = n === 7 && floorId === 'g' && (Math.floor(G.t * 11) % 9 === 0 || Math.floor(G.t * 3) % 13 === 0);
    R(x - 9, 13, 18, 3, off ? C.steel : C.fog);
    if (!off) { R(x - 26, 16, 52, 112, 'rgba(255,255,255,.035)'); R(x - 14, 16, 28, 112, 'rgba(255,255,255,.03)'); }
  }
  /* floor 2: the pipeline, from where the data comes up to where it is presented */
  if (floorId === '2') {
    const st = stations(), a = st[0].x - 34, b = st[st.length - 1].x + 2;
    R(a - cx, PIPE, b - a, 8, '#143039'); R(a - cx, PIPE, b - a, 1, '#5aa0ae'); R(a - cx, PIPE + 7, b - a, 1, '#2c5a66'); R(a - cx, PIPE + 2, b - a, 1, 'rgba(255,255,255,.12)');
    for (let wx = a; wx < b; wx += 44) { const x = wx - cx; if (x > -4 && x < VW + 4) R(x, PIPE - 1, 2, 10, '#5aa0ae'); }
    R(a - cx - 4, 11, 6, PIPE - 3, '#143039'); R(a - cx - 4, 11, 1, PIPE - 3, '#5aa0ae');
  }
  /* way in, at the far left */
  const ex = 6 - cx;
  if (ex > -30 && floorId === 'g') { R(ex - 6, 70, 22, 62, '#0c1329'); R(ex - 4, 72, 18, 60, '#1a3a52'); R(ex + 4, 72, 1, 60, '#0c1329'); T('IN', ex - 1, 61, C.mint); }
}

const table = (x, w) => { R(x - w / 2, 116, w, 16, '#4a587f'); R(x - w / 2, 114, w, 3, '#6577a5'); };

function drawItem(it, x) {
  const s = G.state, t = G.t;
  if (it.kind === 'door') {
    const locked = isLocked(it);
    const done = s.rooms[it.id] && s.rooms[it.id].done;
    const col = locked ? C.steel : it.col;
    R(x - 17, 78, 34, 54, '#0c1329');
    R(x - 15, 80, 30, 52, locked ? '#232d4b' : '#30406d');
    R(x - 15, 80, 30, 2, col);
    R(x - 6, 88, 12, 12, '#0c1329');
    R(x - 5, 89, 10, 10, locked ? '#161d35' : col);
    if (!locked) { R(x - 5, 89, 10, 3, 'rgba(255,255,255,.35)'); if (Math.floor(t * 2 + it.x) % 5 === 0) R(x - 2, 93, 3, 3, 'rgba(255,255,255,.5)'); }
    R(x + 9, 108, 2, 5, C.fog);
    if (locked) { R(x - 3, 110, 7, 6, C.mist); R(x - 2, 107, 5, 4, C.mist); R(x - 1, 108, 3, 3, '#232d4b'); R(x, 112, 1, 2, C.ink); }
    const nw = Math.ceil(G.tw(it.name, 'sm')), w = Math.max(nw, 20) + 10;
    G.panel(x - w / 2, 54, w, 21, { border: col, fill: C.ink });
    T(it.code, x, 55, col, { a: 'center', f: 'smb' });
    T(it.name, x, 64, locked ? C.steel : C.fog, { a: 'center' });
    if (done && s.rooms[it.id].by) T('STUDENT DID IT', x, 45, C.steel, { a: 'center' });
    else if (done) G.stars(x - 13, 44, s.rooms[it.id].stars);
    else if (it.soon) T('SOON', x, 45, C.steel, { a: 'center' });
    return;
  }
  if (it.kind === 'station') {
    /* a monitor fed from the pipe, a name plate, and a console to stand at */
    const locked = isLocked(it), room = s.rooms[it.id], done = room.done, col = locked ? C.steel : it.col;
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
    if (done && room.by) T('BY STUDENT', x, 120, C.fog, { a: 'center' });
    else if (done) G.stars(x - 13, 120, room.stars);
    return;
  }
  switch (it.id) {
    case 'window':
      R(x - 17, 64, 34, 38, '#0c1329'); R(x - 15, 66, 30, 34, '#0a1430');
      G.disc(x + 7, 75, 4, C.paper); R(x + 5, 73, 2, 2, '#d8d2bf');
      [[-11, 70], [-4, 78], [-9, 86], [2, 69], [11, 88]].forEach((p, i) => { if (Math.floor(t * 1.5 + i * 3) % 7) R(x + p[0], p[1], 1, 1, C.fog); });
      R(x - 15, 90, 12, 10, '#131c3c'); R(x - 2, 86, 9, 14, '#131c3c'); R(x + 8, 92, 7, 8, '#131c3c');
      R(x - 12, 93, 2, 2, C.amber); R(x + 1, 89, 2, 2, Math.floor(t / 3) % 2 ? C.amber : '#131c3c');
      R(x - 1, 66, 1, 34, '#0c1329'); R(x - 15, 82, 30, 1, '#0c1329');
      break;
    case 'board':
      R(x - 18, 70, 36, 28, '#6b4630'); R(x - 16, 72, 32, 24, '#b0835a');
      R(x - 13, 75, 9, 11, C.paper); R(x - 2, 74, 8, 8, C.amber); R(x + 8, 76, 6, 12, C.paper); R(x - 3, 85, 9, 8, C.cyan);
      R(x - 9, 75, 1, 1, C.coral); R(x + 2, 74, 1, 1, C.coral); R(x + 10, 76, 1, 1, C.coral);
      break;
    case 'mika':
      G.panel(x - 37, 52, 74, 12, { border: C.mint, fill: C.ink });
      T('CORE FACILITY', x, 53, C.mint, { a: 'center' });
      G.person(x, WALL - 11, MIKA, { dir: -1, t });
      R(x - 24, 116, 48, 16, '#6b4630'); R(x - 24, 114, 48, 3, '#8f6245');
      R(x + 8, 102, 13, 10, C.ink); R(x + 9, 103, 11, 8, Math.floor(t * 1.3) % 2 ? '#1f6d7d' : '#22808f'); R(x + 13, 112, 3, 2, C.ink);
      R(x - 19, 109, 5, 5, C.paper); R(x - 18, 108, 3, 1, C.paper);
      break;
    case 'plant': {
      const sw = since('plant') < 1 ? Math.round(Math.sin(t * 30)) : 0;
      R(x - 5, 120, 10, 12, '#8a5a3c'); R(x - 6, 119, 12, 2, '#a06c48');
      R(x - 1 + sw, 102, 3, 18, C.green); R(x - 6 + sw, 106, 5, 6, C.green); R(x + 3 + sw, 99, 5, 8, C.green); R(x - 3 + sw, 96, 3, 7, C.mint); R(x + 5 + sw, 108, 3, 5, C.mint);
      break;
    }
    case 'scope':
      table(x, 34);
      R(x - 7, 110, 14, 4, C.ink); R(x + 3, 94, 3, 16, C.fog); R(x - 5, 92, 10, 5, C.fog); R(x - 8, 87, 4, 6, C.fog);
      R(x - 2, 97, 3, 7, C.steel); R(x - 8, 106, 13, 2, C.steel); R(x - 2, 105, 3, 1, C.amber);
      R(x + 9, 108, 5, 6, '#c9d3e8'); R(x + 10, 109, 3, 2, C.cyan);
      break;
    case 'freezer': {
      const open = since('freezer') < 1.2;
      R(x - 13, 82, 26, 50, '#aab6cf'); R(x - 12, 83, 24, 48, '#dfe6f3');
      R(x - 12, 106, 24, 1, '#aab6cf'); R(x + 7, 90, 2, 10, C.steel); R(x + 7, 111, 2, 10, C.steel);
      R(x - 10, 86, 19, 9, C.ink); T('-80', x - 8, 86, Math.floor(t * 2) % 2 ? C.cyan : C.coral);
      if (open) { R(x - 12, 107, 24, 24, '#0c1329'); R(x - 10, 110, 8, 5, C.paper); R(x, 112, 9, 4, C.cyan); R(x - 9, 120, 12, 5, C.lilac); R(x - 14, 104, 28, 2, 'rgba(200,230,255,.35)'); }
      break;
    }
    case 'screen': {
      R(x - 15, 74, 30, 22, C.ink); R(x - 13, 76, 26, 18, '#0e1630'); R(x - 2, 96, 4, 3, C.ink);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) {
        const v = Math.sin((i * 7 + j * 13) * 12.9898) * 43758.5; const f = v - Math.floor(v);
        R(x - 12 + i * 4, 77 + j * 4, 3, 3, j === 0 ? C.cyan : f > 0.86 ? C.teal : '#16224a');
      }
      R(x - 12 + (Math.floor(t * 3) % 6) * 4, 77, 3, 15, 'rgba(246,186,76,.25)');
      break;
    }
    case 'seq':
      table(x, 38);
      R(x - 15, 90, 30, 24, '#c9d3e8'); R(x - 14, 91, 28, 22, '#e7ecf6');
      R(x - 11, 96, 22, 8, C.ink); R(x - 10 + (Math.floor(t * 8) % 10) * 2, 98, 2, 4, [C.mint, C.cyan, C.amber, C.coral][Math.floor(t * 8) % 4]);
      R(x - 11, 107, 8, 3, '#aab6cf'); R(x + 8, 107, 2, 2, C.mint);
      break;
    case 'coffee': {
      const empty = (pokes.coffee || 0) >= 4;
      R(x - 16, 112, 32, 20, '#4a587f'); R(x - 16, 110, 32, 3, '#6577a5');
      R(x - 8, 92, 16, 18, '#1b2340'); R(x - 6, 94, 12, 5, '#2c3a66'); R(x + 3, 95, 2, 2, empty ? C.coral : C.mint);
      R(x - 3, 104, 6, 6, C.paper); R(x + 3, 105, 2, 3, C.paper);
      if (!empty) { const k = Math.floor(t * 3) % 3; R(x - 2 + k, 100 - k, 1, 2, 'rgba(255,255,255,.5)'); R(x + 1 - k, 98 - k, 1, 2, 'rgba(255,255,255,.35)'); }
      if (since('coffee') < 0.8) R(x - 1, 99, 2, 5, '#5a3a22');
      break;
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
      break;
    }
    case 'poster': {
      R(x - 15, 66, 30, 38, C.ink); R(x - 14, 67, 28, 36, C.paper);
      const rnd = G.rng(5);
      [[x - 7, 78, C.teal], [x + 5, 76, C.violet], [x - 2, 90, C.orange], [x + 7, 91, C.green]].forEach(p => {
        for (let i = 0; i < 14; i++) R(p[0] + (rnd() - .5) * 9, p[1] + (rnd() - .5) * 8, 1, 1, p[2]);
      });
      R(x - 11, 70, 16, 2, C.steel);
      break;
    }
    case 'centrifuge': {
      const on = since('centrifuge') < 3, sh = on ? Math.round(Math.sin(t * 70)) : 0;
      table(x, 34);
      R(x - 13 + sh, 98, 26, 16, '#c9d3e8'); R(x - 13 + sh, 96, 26, 3, '#aab6cf');
      R(x - 10 + sh, 103, 9, 6, C.ink); R(x - 9 + sh, 104, on ? 7 : 2, 4, on ? C.mint : C.steel);
      R(x + 4 + sh, 103, 3, 3, on ? C.coral : C.steel); R(x + 8 + sh, 103, 3, 3, C.steel);
      break;
    }
    case 'blender': {
      const on = since('blender') < 1.2, sh = on ? Math.round(Math.sin(t * 60)) : 0;
      R(x - 19, 112, 38, 20, '#4a587f'); R(x - 19, 110, 38, 3, '#6577a5');
      R(x - 6 + sh, 104, 10, 6, C.slate); R(x - 5 + sh, 89, 8, 15, 'rgba(200,230,255,.3)'); R(x - 4 + sh, 95, 6, 9, on && Math.floor(t * 20) % 2 ? '#96708a' : '#7a566c'); R(x - 6 + sh, 87, 10, 2, C.fog);
      R(x + 6, 106, 11, 4, C.fog); G.cell(x + 7, 101, C.cyan, 5); G.cell(x + 11, 100, C.amber, 5); G.cell(x + 9, 97, C.pink, 5);
      break;
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
      break;
    }
    case 'trace': {
      table(x, 36);
      R(x - 14, 102, 28, 12, '#dfe6f3'); R(x - 11, 106, 10, 3, '#aab6cf'); R(x + 6, 106, 3, 3, C.mint);
      R(x - 13, 82, 26, 17, C.ink); R(x - 12, 83, 24, 15, '#0e1630'); R(x - 2, 99, 4, 3, C.ink);
      for (let i = 0; i < 22; i++) { const u = i / 21, y = 95 - Math.round(8 * Math.exp(-Math.pow((u - 0.55) / 0.18, 2)) + (i === 1 ? 9 : 0) + (i === 20 ? 7 : 0)); R(x - 11 + i, y, 1, 1, C.mint); }
      break;
    }
    case 'shower':
      R(x - 1, 14, 2, 32, C.steel); R(x - 8, 46, 16, 4, C.amber); R(x - 6, 50, 12, 1, '#b98a2c');
      R(x + 10, 48, 1, 20, C.steel); R(x + 7, 68, 7, 4, C.amber);
      R(x - 27, 60, 12, 14, C.green); R(x - 23, 63, 4, 2, C.white); R(x - 22, 66, 2, 6, C.white);
      R(x - 9, WALL + 12, 18, 2, '#0c1329');
      break;
    case 'gel':
      R(x - 14, 66, 28, 34, C.ink); R(x - 12, 68, 24, 30, '#1a1430');
      [[-10, [72, 76, 80, 85, 91]], [-5, [79]], [0, [79, 88]], [5, [78]]].forEach(l => l[1].forEach(y => R(x + l[0], y, 4, 1, '#ffb37c')));
      for (let y = 73; y < 95; y++) R(x + 9, y, 3, 1, 'rgba(255,179,124,.28)');
      break;
    case 'printer': {
      const out = Math.min(6, since('printer') * 6);
      table(x, 36);
      R(x - 14, 100, 28, 14, '#dfe6f3'); R(x - 14, 100, 28, 3, '#aab6cf'); R(x - 10, 106, 20, 2, C.ink);
      R(x - 8, 94, 16, 6, C.paper);
      if (since('printer') < 6) R(x - 8, 108, 16, out, C.paper);
      R(x + 9, 103, 2, 2, Math.floor(t * 4) % 2 ? C.coral : '#5c2826');
      break;
    }
    case 'dogma':
      R(x - 21, 64, 42, 32, '#9aa6c2'); R(x - 19, 66, 38, 28, '#eef1f6'); R(x - 21, 96, 42, 2, C.steel);
      R(x - 16, 70, 8, 4, '#1b2340'); R(x - 4, 70, 8, 4, '#1b2340'); R(x + 8, 70, 9, 4, '#1b2340');
      R(x - 8, 72, 4, 1, '#d2453f'); R(x + 4, 72, 4, 1, '#d2453f'); R(x + 12, 75, 1, 8, '#d2453f');
      R(x + 6, 84, 10, 4, '#1b2340'); R(x - 8, 84, 10, 4, '#1b2340'); R(x + 2, 86, 4, 1, '#d2453f'); R(x - 13, 76, 1, 10, '#d2453f'); R(x - 13, 86, 5, 1, '#d2453f');
      R(x - 15, 97, 4, 2, '#d2453f'); R(x - 9, 97, 4, 2, '#1b2340');
      break;
    case 'volcano': {
      R(x - 15, 66, 30, 34, C.ink); R(x - 13, 68, 26, 30, C.paper);
      const rnd = G.rng(8);
      for (let i = 0; i < 46; i++) { const u = (rnd() + rnd() - 1) * 11, h = Math.min(24, Math.abs(u) * (1 + rnd() * 1.6)); R(x + u, 95 - h, 1, 1, Math.abs(u) > 5 && h > 9 ? (u > 0 ? C.coral : C.teal) : '#8a93ab'); }
      break;
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
      break;
    }
    case 'rev2': {
      const knock = since('rev2') < 0.5;
      R(x - 17, 78, 34, 54, '#0c1329'); R(x - 15, 80, 30, 52, '#1a1426');
      R(x - 10, 86, 20, 22, knock ? '#3a2f4d' : '#2a2238');
      const sway = Math.round(Math.sin(t * 0.7) * 2);
      R(x - 3 + sway, 91, 6, 6, '#110d1a'); R(x - 6 + sway, 97, 12, 11, '#110d1a');
      if (knock) { R(x - 2 + sway, 93, 1, 1, C.coral); R(x + 1 + sway, 93, 1, 1, C.coral); }
      R(x + 9, 112, 2, 5, C.steel);
      R(x - 13, 130, 26, 2, roomsDone() === ROOMS.length ? C.coral : Math.floor(t * 5) % 7 ? '#5a1f2a' : '#a8323f');
      if (s.rooms.review.done) G.stars(x - 13, 49, s.rooms.review.stars);
      for (let i = 0; i < Math.min(3, pokes.rev2 || 0); i++) R(x - 12 + i * 5, 110 + i * 3, 5, 6, C.paper);
      G.panel(x - 34, 60, 68, 12, { border: C.coral, fill: C.ink });
      T('REVIEWER 2', x, 61, C.coral, { a: 'center' });
      break;
    }
    case 'extinguisher':
      R(x - 5, 92, 11, 30, '#0c1329'); R(x - 3, 100, 7, 19, C.coral); R(x - 3, 100, 2, 19, '#ff8f89'); R(x - 1, 96, 3, 4, C.ink); R(x + 2, 97, 4, 1, C.ink); R(x + 5, 97, 1, 8, C.ink);
      R(x - 3, 107, 7, 4, C.paper);
      break;
    case 'rack': {
      R(x - 14, 72, 28, 60, '#0b1a1f'); R(x - 12, 74, 24, 56, '#16262c');
      for (let r = 0; r < 8; r++) {
        R(x - 10, 77 + r * 6, 20, 4, '#0b1a1f');
        const k = Math.floor(t * (3 + r % 3) + r * 1.7) % 6;
        R(x - 9 + k * 3, 78 + r * 6, 2, 2, since('rack') < 1 ? C.coral : r % 3 ? C.mint : C.amber);
      }
      R(x - 12, 126, 24, 2, '#33707a');
      break;
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
      break;
    case 'duck': {
      const bob = since('duck') < 1.2 ? Math.round(Math.abs(Math.sin(t * 12)) * 2) : 0;
      R(x - 14, 106, 28, 2, '#8a5a3c'); R(x - 12, 108, 2, 5, '#6b4630'); R(x + 10, 108, 2, 5, '#6b4630');
      R(x - 5, 99 - bob, 9, 7, C.amber); R(x + 1, 94 - bob, 6, 6, C.amber); R(x + 7, 97 - bob, 2, 2, C.orange); R(x + 4, 96 - bob, 1, 1, C.ink);
      R(x - 6, 101 - bob, 2, 3, '#d99a2e');
      break;
    }
    case 'seeds': {
      const sh = since('seeds') < 1 ? Math.round(Math.sin(t * 50)) : 0, rnd = G.rng(12);
      table(x, 28);
      R(x - 7 + sh, 96, 14, 3, C.steel); R(x - 6 + sh, 99, 12, 15, 'rgba(200,230,255,.22)'); R(x - 6 + sh, 99, 1, 15, 'rgba(255,255,255,.3)');
      for (let i = 0; i < 9; i++) R(x - 4 + sh + Math.floor(rnd() * 8), 104 + Math.floor(rnd() * 9) - (since('seeds') < 1 ? Math.floor(rnd() * 3) : 0), 1, 1, C.amber);
      R(x - 5, 84, 11, 9, C.paper); T('42', x - 5, 84, C.ink);
      break;
    }
    case 'elbow':
      R(x - 15, 66, 30, 34, C.ink); R(x - 13, 68, 26, 30, C.paper);
      [18, 11, 6, 5, 4, 3, 2, 2].forEach((h, i) => R(x - 11 + i * 3, 94 - h, 2, h, i < 4 ? C.teal : '#8a93ab'));
      R(x - 11, 94, 23, 1, C.steel);
      break;
    case 'stickies': {
      const cols = [C.amber, C.pink, C.mint, C.cyan, C.amber, C.lilac, C.mint, C.pink, C.amber];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
        const k = j * 3 + i, lift = k === 4 && (since('stickies') < 1 || Math.floor(t * 0.5) % 6 === 0) ? 1 : 0;
        R(x - 14 + i * 10, 68 + j * 10 - lift, 8, 8, cols[k]); R(x - 13 + i * 10, 70 + j * 10 - lift, 5, 1, 'rgba(10,15,30,.5)'); R(x - 13 + i * 10, 72 + j * 10 - lift, 4, 1, 'rgba(10,15,30,.5)');
      }
      break;
    }
    case 'gpu': {
      const k = Math.floor(t * 14) % 2;
      R(x - 14, 112, 28, 20, '#1b2540'); R(x - 14, 110, 28, 3, since('gpu') < 1.5 ? C.coral : '#8a3a3a');
      [-6, 6].forEach(d => { G.ring(x + d, 122, 4, C.steel); R(x + d - (k ? 3 : 0), 122 - (k ? 0 : 3), k ? 7 : 1, k ? 1 : 7, C.fog); });
      for (let i = 0; i < 3; i++) { const u = (t * 0.8 + i * 0.33) % 1; R(x - 8 + i * 8 + Math.round(Math.sin(t * 3 + i) * 1.5), 106 - u * 14, 1, 3, 'rgba(240,101,95,' + (0.5 - u * 0.5).toFixed(2) + ')'); }
      break;
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
      break;
    }
    case 'clog': {
      /* a drop from the pipe with a gauge and a valve. The needle shakes while the data is jammed. */
      const jam = stuck(), hitT = since('clog'), spin = hitT < 0.5 ? Math.floor(t * 20) % 2 : 0;
      R(x - 2, PIPE + 8, 4, 62, '#143039'); R(x - 2, PIPE + 8, 1, 62, '#5aa0ae');
      G.disc(x, 78, 9, '#081418'); G.disc(x, 78, 7, C.paper);
      R(x + 2, 72, 4, 3, C.coral);
      const ang = jam ? -0.3 + Math.sin(t * 40) * 0.2 : -2.2 + Math.sin(t * 1.3) * 0.15;
      G.line(x, 78, x + Math.cos(ang) * 6, 78 + Math.sin(ang) * 6, C.ink);
      G.ring(x, 100, 6, jam ? C.coral : '#8a3a3a'); R(x - (spin ? 5 : 0), 100 - (spin ? 0 : 5), spin ? 11 : 1, spin ? 1 : 11, jam ? C.coral : '#8a3a3a'); R(x - 1, 99, 3, 3, C.ink);
      R(x - 12, 110, 24, 9, C.paper); T('ENV', x, 110, C.ink, { a: 'center' });
      if (jam) for (let i = 0; i < 3; i++) { const u = (t * 0.9 + i * 0.33) % 1; R(x - 6 + i * 5, 68 - u * 12, 2, 2, 'rgba(230,240,255,' + (0.6 - u * 0.6).toFixed(2) + ')'); }
      break;
    }
    case 'lift':
      R(x - 22, 72, 44, 60, '#0c1329'); R(x - 19, 76, 18, 56, '#8794b3'); R(x + 1, 76, 18, 56, '#8794b3');
      R(x - 19, 76, 18, 2, '#a9b4cf'); R(x + 1, 76, 18, 2, '#a9b4cf'); R(x - 1, 76, 2, 56, '#0c1329');
      G.panel(x - 9, 59, 18, 12, { border: C.fog, fill: C.ink }); T('G', x, 60, C.amber, { a: 'center', f: 'smb' });
      R(x + 25, 100, 5, 9, C.ink); R(x + 26, 102, 3, 2, Math.floor(t * 2) % 2 ? C.amber : C.steel);
      break;
  }
}

/* things in front of the player: the shower's water and the robot */
function drawFront(cx) {
  /* the floor is finished: it rains cells for a moment */
  const pa = G.t - party;
  if (pa < 6 && !G.reduced) {
    const rnd = G.rng(77);
    for (let i = 0; i < 46; i++) { const x = rnd() * VW, v = 30 + rnd() * 50, y = (pa * v + rnd() * 200) % 210 - 20; if (pa < 5 || y > pa * 40 - 200) G.cell(x, y, G.TYPES[i % 5], 4 + (i % 3)); }
  }
  const t = G.t, shower = ITEMS.find(i => i.id === 'shower'), sh = shower ? shower.x - cx : -999;
  if (since('shower') < 2.2 && sh > -30 && sh < VW + 30) {
    for (let i = 0; i < 7; i++) for (let k = 0; k < 6; k++) R(sh - 6 + i * 2, 51 + ((t * 190 + i * 37 + k * 19) % 92), 1, 5, 'rgba(140,210,255,.75)');
    R(sh - 12, WALL + 13, 24, 2, 'rgba(140,210,255,.5)');
  }
  const x = Math.round(robot.x - cx), petted = since('robot') < 1;
  if (ROBOT && x > -20 && x < VW + 20) {
    const y = 166 + (petted ? -Math.abs(Math.round(Math.sin(t * 16) * 3)) : 0);
    R(x - 7, y + 4, 14, 1, 'rgba(0,0,0,.35)');
    R(x - 6, y, 12, 4, '#c9d3e8'); R(x - 4, y - 2, 8, 2, C.fog); R(x - 7, y + 2, 14, 2, '#51648f');
    R(x + (robot.dir > 0 ? 3 : -5), y - 1, 2, 1, Math.floor(t * 4) % 2 ? C.cyan : C.teal);
    if (petted) T('<3', x - 5, y - 13, C.pink);
    else if (robot.wait > 0 && since('bump') < 1) T('!', x - 1, y - 12, C.amber, { f: 'smb' });
  }
}

function drawDirectory() {
  R(0, 0, VW, VH, 'rgba(6,9,20,.8)');
  G.panel(18, 6, 284, 170, { border: C.fog, fill: C.ink });
  T('FLOORS', 28, 14, C.amber, { f: 'smb' });
  T(G.kt('UP, DOWN, SPACE TO GO', 'TAP A FLOOR'), 292, 14, C.steel, { a: 'right' });
  R(26, 25, 268, 1, C.slate);
  FLOORS.forEach((f, i) => {
    const y = 30 + i * 12, built = i >= 8, here = (i === 9 && floorId === 'g') || (i === 8 && floorId === '2'), sel = dir && dir.sel === i;
    const noData = i === 8 && !groundDone() && !here;
    if (sel) R(24, y - 1, 272, 11, C.deep);
    if (sel && Math.floor(G.t * 3) % 2 === 0) T('>', 27, y, C.cyan);
    T(f[0], 46, y, here ? C.amber : built ? C.fog : C.steel, { a: 'right', f: 'smb' });
    T(f[1], 54, y, built ? C.white : C.mist, { f: 'smb' });
    T(here ? 'YOU ARE HERE' : noData ? 'NO DATA? ASK YOUR STUDENT' : f[2], 154, y, here || noData ? C.amber : built ? C.fog : C.steel);
    if (!built) { R(286, y + 3, 5, 4, C.steel); R(287, y + 1, 3, 3, C.steel); R(288, y + 2, 1, 1, C.ink); }
  });
  R(26, 152, 268, 1, C.slate);
  T('FLOORS 3 TO 10 ARE UNDER CONSTRUCTION.', 28, 155, C.fog);
  T('BUILDERS WANTED: IT IS OPEN SOURCE, ON GITHUB.', 28, 165, C.cyan);
}
})();
