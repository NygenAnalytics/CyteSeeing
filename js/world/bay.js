/* The arrivals bay: where a project begins. Samples come in here as parcels, and each parcel is
   a project (js/scenarios.js). The player reads the labels and takes one. The other stays on the
   pallet, and can be taken up later: each project keeps its own progress.
   The bay is a hall like any other (js/world/hall.js), with a kit of its own. */
(function () {
'use strict';
const { R, T, C, VW } = G;
const WALL = 132, W = 560;
const VERA = { skin: C.skin2, hair: '#3a2f3a', style: 'long', coat: '#7a2f45', shirt: '#e8d9a8', pants: '#2b2430', shoes: C.ink };

const ITEMS = [
  { id: 'lift', kind: 'lift', x: 44, label: 'GO OUT' },
  /* nobody is asked for a name: the printer is there for whoever wants one on their badge */
  { id: 'badge', kind: 'badge', x: 86, label: 'PRINT A BADGE' },
  { id: 'vera', kind: 'npc', x: 132, label: 'TALK' },
  { id: 'response', kind: 'parcel', x: 226, label: 'READ THE LABEL' },
  { id: 'cortex', kind: 'parcel', x: 300, label: 'READ THE LABEL' },
  { id: 'crates', kind: 'prop', x: 384, label: 'LOOK' },
  { id: 'dryice', kind: 'prop', x: 448, label: 'TOUCH' },
  { id: 'slip', kind: 'prop', x: 512, label: 'READ' },
];
const LINES = {
  /* one box, and then the parcels: the first thing to do comes before anything else is said */
  veraIntro: [
    () => 'VERA: ' + G.you() + '? Good. I am Vera, and I run this group. Two parcels came in today. Read the labels and take one.',
  ],
  crates: [
    'CRATES: More tissues, still frozen. Lung, gut, a tumour. The delivery note says they will be unpacked soon.',
    "CRATES: One is labelled 'URGENT'. It has been here the longest.",
    'CRATES: A crate with no label at all. Everybody is sure it belongs to somebody else.',
  ],
  dryice: [
    'DRY ICE: It smokes quietly. You put a hand near it, as everyone does, once.',
    'DRY ICE: Minus seventy-eight degrees. The parcels are fine. The courier was less sure.',
  ],
};
/* what Vera says when asked: it depends on whether a project has been taken */
const vera = () => {
  const sc = G.scenario();
  return [sc ? 'VERA: You took the ' + sc.parcel.toLowerCase() + ' project. The other parcel stays on the pallet. Take it whenever you like: you keep your work on both.'
    : 'VERA: Two parcels, two projects. Read the labels, and take the one you want to work on.'];
};

function take(id, api) {
  const sc = G.SCENARIOS[id];
  G.load(['systems/' + sc.system + '.js']).then(() => {
    G.setScenario(id); G.state.floor = 'bay'; G.save(); G.sfx('star');
    api.refresh();
    api.say(sc.brief, () => G.go('campus', { from: 'bay' }));
  }, () => G.toast('THAT DID NOT LOAD. CHECK THE CONNECTION AND TRY AGAIN.', 5));
}
/* what happens when the player uses something that only this hall has */
function use(it, api) {
  if (it.kind === 'parcel') {
    const sc = G.SCENARIOS[it.id];
    G.sfx('blip');
    if (G.profile.scenario === it.id) { api.say(['LABEL: ' + sc.label + ' This one is yours.' + (G.finished(it.id) ? ' It has been reviewed.' : '')], null); return true; }
    G.track('parcel_read', { parcel: it.id });
    api.ask('LABEL: ' + sc.label, ['PUT IT BACK', 'TAKE THIS PROJECT'], k => { if (k === 1) take(it.id, api); }, 1);
    return true;
  }
  if (it.id === 'vera') { api.say(vera()); return true; }
  if (it.id === 'badge') { G.sfx('blip'); G.go('start', {}); return true; }
  if (it.id === 'slip') {
    G.sfx('blip');
    /* the sheet, where a request is counted; where nothing is counted, the way to GitHub */
    if (!api.sheet(close => G.requests.sheet('arrivals', close), () => api.found('slip'))) {
      api.ask('REQUEST SLIP: Missing a tissue, or a kind of project? Ask for it on GitHub, and it joins the queue.', ['NOT NOW', 'OPEN GITHUB'], k => {
        if (k === 1) G.requests.github();
        api.found('slip');
      }, 1);
    }
    return true;
  }
  return false;
}

function parcel(it, x, mine, t) {
  const sc = G.SCENARIOS[it.id];
  /* a pallet, a foam box with a coloured band, and a breath of cold air */
  R(x - 22, 127, 44, 5, '#8a6c40'); for (let i = 0; i < 4; i++) R(x - 20 + i * 12, 129, 4, 3, '#5a4028');
  R(x - 18, 100, 36, 27, '#16101c'); R(x - 17, 101, 34, 26, '#e6dfcc'); R(x - 17, 110, 34, 5, sc.col);
  if (mine) { R(x - 19, 92, 38, 4, '#c9c2b0'); R(x - 15, 97, 30, 4, '#0c1016'); }
  else { R(x - 19, 97, 38, 5, '#f4efe0'); R(x - 19, 101, 38, 1, '#c9c2b0'); }
  R(x - 12, 117, 24, 8, C.paper); T(sc.parcel, x, 117, C.ink, { a: 'center' });
  /* a project that has been through its review wears a ribbon */
  if (G.finished(it.id)) { R(x + 9, 103, 3, 9, C.coral); R(x + 14, 103, 3, 9, C.coral); G.disc(x + 13, 102, 5, C.coral); G.disc(x + 13, 102, 3, C.amber); R(x + 12, 101, 3, 3, C.paper); }
  if (!G.reduced) for (let i = 0; i < 3; i++) { const u = (t * 0.4 + i / 3) % 1; R(x - 12 + i * 11, 98 - Math.round(u * 12), 2, 1, 'rgba(220,240,255,' + (0.5 - u * 0.5).toFixed(2) + ')'); }
  const plate = mine ? 'YOUR PROJECT' : sc.parcel, w = Math.ceil(G.tw(plate, 'sm')) + 8;
  G.panel(x - w / 2, 72, w, 12, { border: mine ? C.mint : sc.col, fill: C.ink }); T(plate, x, 73, mine ? C.mint : C.fog, { a: 'center' });
}
function draw(it, x, o) {
  const t = G.t, since = o.since;
  switch (it.id) {
    case 'vera':
      G.panel(x - 16, 52, 32, 12, { border: C.oil, fill: C.ink }); T('VERA', x, 53, C.oil, { a: 'center' });
      G.person(x, WALL - 1, VERA, { dir: 1, t });
      /* a clipboard, and a pallet truck she is not going to move herself */
      R(x + 14, 122, 22, 3, '#c0504a'); R(x + 33, 106, 2, 18, '#c0504a'); R(x + 30, 104, 8, 3, C.ink); G.disc(x + 17, 128, 3, C.ink); G.disc(x + 31, 128, 3, C.ink);
      return true;
    case 'badge': {
      /* a printer on the wall, with the badge it last made hanging from its slot: the name on it is the player's */
      const name = G.you(), w = Math.max(30, Math.ceil(G.tw(name, 'sm')) + 8);
      R(x - 11, 84, 22, 20, '#16101c'); R(x - 10, 85, 20, 18, '#4a525e'); R(x - 10, 85, 20, 1, 'rgba(255,255,255,.3)'); R(x - 7, 88, 9, 5, '#0c1016'); R(x - 6, 89, 5, 1, C.mint);
      R(x + 5, 88, 2, 2, Math.floor(t * 2) % 2 ? C.amber : '#6b5a2a'); R(x - 7, 99, 14, 2, '#0c1016');
      R(x - 1, 101, 2, 4, '#8f8a7c');
      R(x - w / 2, 105, w, 16, '#16101c'); R(x - w / 2 + 1, 106, w - 2, 14, C.paper); R(x - w / 2 + 1, 106, w - 2, 4, C.teal);
      T(name, x, 111, C.ink, { a: 'center' });
      return true;
    }
    case 'response': case 'cortex': parcel(it, x, G.profile.scenario === it.id, t); return true;
    case 'crates': {
      const sh = since('crates') < 0.6 ? Math.round(Math.sin(t * 40)) : 0;
      [[-22, 104, 22, 28], [2, 110, 24, 22], [-10, 84, 22, 20]].forEach((q, i) => {
        R(x + q[0] + (i === 2 ? sh : 0), q[1], q[2], q[3], '#16101c'); R(x + q[0] + 1 + (i === 2 ? sh : 0), q[1] + 1, q[2] - 2, q[3] - 2, '#5f6f80');
        R(x + q[0] + 1 + (i === 2 ? sh : 0), q[1] + 1, q[2] - 2, 3, 'rgba(255,255,255,.35)'); R(x + q[0] + 5 + (i === 2 ? sh : 0), q[1] + 8, 9, 6, C.paper); T('?', x + q[0] + 7 + (i === 2 ? sh : 0), q[1] + 7, C.ink);
      });
      for (let i = 0; i < 9; i++) R(x - 24 + i * 6, 96, 3, 2, i % 2 ? C.ink : C.amber);
      return true;
    }
    case 'dryice': {
      const puff = since('dryice') < 1.5 ? 2 : 1;
      R(x - 14, 112, 28, 20, '#16101c'); R(x - 13, 113, 26, 19, '#3f8fb5'); R(x - 13, 113, 26, 3, '#7fc4e0'); R(x - 8, 120, 16, 7, C.paper); T('ICE', x, 120, C.ink, { a: 'center' });
      if (!G.reduced) for (let i = 0; i < 5 * puff; i++) { const u = (t * 0.35 + i / (5 * puff)) % 1; R(x - 12 + (i * 7) % 24, 112 - Math.round(u * 22), 3, 2, 'rgba(220,240,255,' + (0.55 - u * 0.55).toFixed(2) + ')'); }
      return true;
    }
    case 'slip': {
      const fl = since('slip') < 0.6 ? 1 : 0;
      R(x - 12, 62 - fl, 24, 32, '#3a2a1c'); R(x - 10, 66 - fl, 20, 26, C.paper); R(x - 4, 60 - fl, 8, 5, '#8f8a7c');
      for (let i = 0; i < 4; i++) R(x - 7, 70 + i * 5 - fl, 14 - (i * 3) % 5, 1, C.steel);
      R(x + 14, 70, 1, 14, C.ink); R(x + 13, 84, 3, 5, C.amber);
      T('REQUESTS', x, 96, C.steel, { a: 'center' });
      return true;
    }
  }
  return false;
}
/* the room: a rolled-up shutter with daylight under it, and hazard stripes on the floor */
function room(cx) {
  const sx = 44 - cx;
  if (sx > -60 && sx < VW + 60) for (let i = 0; i < 6; i++) R(sx - 30, 20 + i * 5, 60, 3, i % 2 ? '#59616e' : '#4a525e');
  for (let wx = 180; wx < 340; wx += 12) { const x = wx - cx; if (x > -12 && x < VW) R(x, 133, 6, 2, C.amber); }
}
function book(found, total) {
  const sc = G.scenario();
  G.book.show({
    floor: 'Arrivals', room: 'Choose a project', file: 'js/scenarios.js', fileText: 'add a project', fileTail: ' yourself.',
    aim: sc ? 'Your project: ' + sc.title.charAt(0) + sc.title.slice(1).toLowerCase() : 'Read the labels on the two parcels, and take one.',
    goals: [{ id: 'pick', text: 'Take a parcel: it decides what the project needs' }, { id: 'e', text: 'Poke around: ' + found + ' of ' + total + ' things found' }],
    notes: [
      { id: 'y-why', open: true, html: 'Nobody runs every analysis. What you do depends on the question and on the samples you have. So the project comes first, and it sets the stages.' },
      { id: 'y-same', open: true, html: 'Every project starts the same way, because the data is made the same way: cells into droplets, droplets into counts, counts into a map. After that the road depends on the question.' },
      { id: 'y-two', open: true, html: 'There are two projects for now: one on immune cells in blood, one on the developing brain. To ask for another tissue or another kind of project, <a href="' + G.REPO + '/issues/new" target="_blank" rel="noopener">open an issue on GitHub</a>.' },
    ],
    term: null,
  });
  G.book.goal('pick', sc ? true : null); G.book.goal('e', found === total ? true : null);
}

G.kits = G.kits || {};
G.kits.bay = { ITEMS, LINES, W, draw, room, use, book, line: () => null,
  /* the first time in, the player walks in from the left, past the badge printer, and Vera has something to say */
  arrive: () => (G.profile.metVera ? null : { walk: 110, say: LINES.veraIntro, then: () => { G.profile.metVera = true; G.save(); G.track('arrivals_briefed'); } }),
  /* where the arrow points: at a parcel until one is taken, then at the way out */
  next: () => (G.scenario() ? 'lift' : 'response'),
  paint: ['#0c1016', '#3a4250', '#59616e', '#2a303a', '#0c1016', '#1a1e26', '#2a303a', '#141820'] };
})();
