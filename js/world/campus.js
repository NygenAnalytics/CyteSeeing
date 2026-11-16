/* The institute, seen from above: the way from one stage of a project to the next. A road runs
   from the arrivals bay past every stage on the project's route (js/scenarios.js). Stages that
   are built stand as buildings; stages still to come are building sites. The player walks the
   road, and goes in where they like. A stage works on what the stages before it make: skip one,
   and the student will do it, with default settings and no stars. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
/* plots along the road, in the order a project reaches them: the request board, the arrivals
   bay, then up to seven stages */
const PLOTS = [[20, 150], [62, 146], [114, 134], [168, 146], [222, 132], [276, 106], [228, 70], [170, 58], [112, 68]];
const HERO = { skin: C.skin1, hair: '#3a2a22', style: 'short', coat: C.paper, shirt: C.cyan, pants: '#2c3a5e', shoes: C.ink };
const TREES = [[30, 112], [84, 104], [140, 100], [196, 100], [300, 150], [262, 160], [300, 60], [272, 34], [200, 26], [136, 26], [70, 34], [26, 26], [142, 164], [12, 80]];
const SUMMON = [
  'YOU: Tomo, could you run the stages before this one for me? Default settings are fine.',
  'TOMO: (typing) ...done. Default settings everywhere. Please do not look at the plots.',
];

let nodes, at, hx, hy, way, facing, moving, talk, talkAfter, ask, lastBook;

const done = n => n.kind === 'stage' && n.open && G.STAGES[n.id].rooms.concat(G.STAGES[n.id].extra || []).every(k => G.state.rooms[k].done);
const stars = n => G.STAGES[n.id].rooms.concat(G.STAGES[n.id].extra || []).reduce((s, k) => s + G.state.rooms[k].stars, 0);
/* the first stage on the road that is open and not finished */
const nextUp = () => nodes.findIndex(n => n.kind === 'stage' && n.open && !done(n));

function build() {
  const sc = G.scenario(); nodes = [];
  nodes.push({ kind: 'board', name: 'REQUESTS' }, { kind: 'bay', name: 'ARRIVALS' });
  sc.route.forEach(id => { const st = G.STAGES[id]; nodes.push({ kind: 'stage', id, open: G.playable(id), name: st.name, n: st.n, col: st.col }); });
  sc.coming.forEach(name => nodes.push({ kind: 'soon', name }));
  nodes = nodes.slice(0, PLOTS.length);
  nodes.forEach((n, i) => { n.x = PLOTS[i][0]; n.y = PLOTS[i][1]; });
}
function say(lines, after) { talk = new G.Beats(lines.map(l => ({ say: l }))); talkAfter = after || null; }
function showBook() {
  const sc = G.scenario();
  G.book.show({
    floor: 'The institute', room: sc.title.charAt(0) + sc.title.slice(1).toLowerCase(), file: 'js/scenarios.js', fileText: 'add a stage or a project', fileTail: ' yourself.', methods: true,
    goals: nodes.filter(n => n.kind === 'stage' && n.open).map(n => ({ id: n.id, text: n.n + '. ' + n.name.charAt(0) + n.name.slice(1).toLowerCase() + ': ' + G.STAGES[n.id].what.toLowerCase() + (done(n) ? ' (' + stars(n) + ' stars)' : '') })),
    notes: [
      { id: 'm-road', open: true, html: 'The road is the project. Every project starts the same way, because the data is made the same way. Where it goes after that depends on the question.' },
      { id: 'm-skip', open: true, html: 'A stage works on what the stages before it make. Skip one and your student Tomo will run it for you, with default settings and no stars.' },
      { id: 'm-more', open: true, html: 'More tissues and more kinds of project are on the way. To ask for one, use the request board by the gate, or <a href="' + G.REPO + '/issues/new" target="_blank" rel="noopener">open an issue on GitHub</a>.' },
    ],
    term: null,
  });
  nodes.forEach(n => { if (n.kind === 'stage' && n.open) G.book.goal(n.id, done(n) ? true : null); });
}

/* walk along the road from the plot the player is on to another one */
function walkTo(i) {
  if (i === at || i < 0 || i >= nodes.length) return;
  const step = i > at ? 1 : -1; way = [];
  for (let k = at + step; k !== i + step; k += step) way.push(k);
  G.sfx('step');
}
function goIn(n) {
  if (n.kind === 'board') {
    ask = { text: 'REQUESTS: Missing a tissue, or a kind of project? Ask for it on GitHub, and it joins the queue.', opts: ['NOT NOW', 'OPEN GITHUB'], sel: 1,
      pick: k => { ask = null; if (k === 1) { try { window.open(G.REPO + '/issues/new?title=' + encodeURIComponent('Request: a cell system or a scenario'), '_blank', 'noopener'); } catch (e) {} G.toast('IF NOTHING OPENED, THE LINK IS IN THE NOTEBOOK.', 4); } } };
    G.sfx('blip'); return;
  }
  if (n.kind === 'bay') { G.sfx('door'); G.go('corridor', { floor: 'bay', from: 'lift' }); return; }
  if (n.kind === 'soon') { G.sfx('bad'); say(['SIGN: BUILDING SITE. This stage is planned, and nobody has built it yet. It is open source: you could.']); return; }
  if (!n.open) { G.sfx('bad'); say(['SIGN: This stage is built, but not yet for ' + G.sys.name.toLowerCase() + '. It is next on the list.']); return; }
  /* what the stages before this one should have made */
  const r = G.route(), need = []; r.slice(0, r.indexOf(n.id)).forEach(id => G.STAGES[id].makes.forEach(k => need.push(k)));
  const missing = need.filter(k => !G.state.rooms[k].done);
  if (missing.length) {
    G.sfx('blip');
    ask = { text: n.name + ': This stage works on what the stages before it make, and you have not made it. Do it yourself, or ask Tomo?', opts: ['DO IT MYSELF', 'ASK TOMO'], sel: 0,
      pick: k => { ask = null; if (k === 1) say(SUMMON, () => { G.hall.summon(missing); G.go('corridor', { floor: n.id, from: 'lift', toast: 'TOMO DID THE STAGES BEFORE THIS ONE. NO STARS FOR THAT.' }); }); } };
    return;
  }
  G.sfx('door'); G.go('corridor', { floor: n.id, from: 'lift' });
}

G.scenes.campus = {
  dbg: { nodes: () => nodes.map(n => ({ kind: n.kind, id: n.id, open: n.open, name: n.name, x: n.x, y: n.y })), at: () => at, busy: () => !!(talk || ask || way.length), to: i => { at = i; hx = nodes[i].x; hy = nodes[i].y; way = []; },
    enter: i => { at = i; hx = nodes[i].x; hy = nodes[i].y; way = []; goIn(nodes[i]); }, clear: () => { talk = null; ask = null; } },
  enter(a) {
    if (!G.scenario()) { G.go('corridor', { floor: 'bay' }); nodes = []; way = []; at = 0; return; }
    build(); talk = null; ask = null; way = []; facing = 1; moving = false; lastBook = '';
    /* stand outside the place the player has just left */
    const from = nodes.findIndex(n => (n.kind === 'stage' && n.id === a.from) || (n.kind === 'bay' && a.from === 'bay'));
    at = from >= 0 ? from : Math.max(1, nodes.findIndex(n => n.kind === 'stage' && n.id === G.state.floor));
    hx = nodes[at].x; hy = nodes[at].y;
    showBook();
    if (a.say) say(a.say);
  },
  update(dt) {
    if (!nodes.length) return;
    if (ask) {
      if (G.hit('left') || G.hit('right') || G.hit('up') || G.hit('down')) { ask.sel = 1 - ask.sel; G.sfx('tick'); }
      if (G.hit('a')) ask.pick(ask.sel); else if (G.hit('b')) ask.pick(0);
      return;
    }
    if (talk) { if (talk.update(dt) === 'done') { talk = null; const f = talkAfter; talkAfter = null; if (f) f(); } return; }
    moving = false;
    if (way.length) {
      /* one plot at a time, along the road */
      const n = nodes[way[0]], dx = n.x - hx, dy = n.y - hy, d = Math.hypot(dx, dy), v = 96 * dt;
      if (d <= v) { hx = n.x; hy = n.y; at = way.shift(); if (!way.length && nodes[at].tap) { nodes[at].tap = false; goIn(nodes[at]); } }
      else { hx += dx / d * v; hy += dy / d * v; if (Math.abs(dx) > 1) facing = dx > 0 ? 1 : -1; moving = true; if (Math.floor(G.t * 9) % 4 === 0 && Math.floor((G.t - dt) * 9) % 4 !== 0) G.sfx('step'); }
      return;
    }
    if (G.hit('right') || G.hit('up')) walkTo(at + 1);
    else if (G.hit('left') || G.hit('down')) walkTo(at - 1);
    else if (G.act() || G.hit('lift')) goIn(nodes[at]);
    else if (G.ptr.pressed && G.ptr.y > 12) {
      /* a tap on a place walks there; a tap on the place the player is at goes in */
      let best = -1, bd = 30; nodes.forEach((n, i) => { const d = Math.hypot(n.x - G.ptr.x, n.y - 10 - G.ptr.y); if (d < bd) { bd = d; best = i; } });
      if (best === at) goIn(nodes[at]); else if (best >= 0) { nodes[best].tap = true; walkTo(best); }
    }
  },
  draw() {
    if (!nodes.length) { R(0, 0, VW, VH, C.ink); return; }
    ground();
    road();
    /* things further up the screen are further away, and drawn first */
    const order = nodes.map((n, i) => i).sort((a, b) => nodes[a].y - nodes[b].y); let drawn = false;
    order.forEach(i => { if (!drawn && nodes[i].y > hy) { hero(); drawn = true; } place(nodes[i], i); });
    if (!drawn) hero();
    const up = nextUp();
    if (up >= 0 && up !== at && !talk && !ask) G.cue(nodes[up].x, nodes[up].y - 34, true);
    /* header: the project, and the stars it has earned */
    R(0, 0, VW, 11, 'rgba(8,12,26,.9)');
    const sc = G.scenario(); R(5, 3, 3, 5, sc.col); T(sc.title, 12, 1, C.fog);
    G.star(VW - 44, 2, true); T(G.totalStars() + '/' + G.maxStars(), VW - 5, 1, C.amber, { a: 'right' });
    if (!talk && !ask && !way.length) prompt(nodes[at]);
    if (ask) { G.caption(ask.text, 99, { top: true, noPrompt: true, border: C.amber }); ask.opts.forEach((o, i) => { if (G.button('ask' + i, 12 + i * 152, 70, 144, 15, o, { focus: ask.sel === i, primary: i === 1 }) && ask) ask.pick(i); }); }
    if (talk) talk.draw();
  },
};

/* ---------- drawing ---------- */
function ground() {
  R(0, 0, VW, VH, '#10261f');
  /* mown stripes, a pond, and the fence along the bottom */
  for (let y = 14; y < VH; y += 16) R(0, y, VW, 8, 'rgba(255,255,255,.018)');
  G.disc(44, 76, 15, '#16384a'); G.disc(56, 80, 10, '#16384a'); R(38, 72 + Math.round(Math.sin(G.t * 1.3) * 1), 9, 1, 'rgba(255,255,255,.18)'); R(50, 81, 6, 1, 'rgba(255,255,255,.12)');
  TREES.forEach((q, i) => { const sw = G.reduced ? 0 : Math.round(Math.sin(G.t * 0.8 + i) * 0.6); R(q[0] - 1, q[1] + 2, 2, 5, '#3a2a1c'); G.disc(q[0] + sw, q[1] - 2, 6, '#1d4a36'); G.disc(q[0] - 2 + sw, q[1] - 4, 3, '#2a6a4a'); });
}
function road() {
  const up = nextUp();
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1], lit = i >= 1 && (up < 0 || i < up) && nodes[i + 1].kind === 'stage' && nodes[i + 1].open;
    const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 4));
    for (let k = 0; k <= n; k++) { const x = Math.round(G.lerp(a.x, b.x, k / n)), y = Math.round(G.lerp(a.y, b.y, k / n)); R(x - 2, y - 1, 5, 3, '#2b2a3a'); }
    for (let k = 0; k <= n; k += 2) { const x = Math.round(G.lerp(a.x, b.x, k / n)), y = Math.round(G.lerp(a.y, b.y, k / n)); R(x, y, 1, 1, lit ? C.amber : '#57566a'); }
  }
}
function hero() { G.person(Math.round(hx), Math.round(hy) + 2, HERO, { dir: facing, walk: moving, t: G.t }); }
function place(n, i) {
  const x = n.x, y = n.y, t = G.t;
  if (n.kind === 'board') {
    R(x - 9, y - 16, 18, 12, '#3a2a1c'); R(x - 8, y - 15, 16, 10, '#a57a50'); R(x - 6, y - 13, 5, 4, C.paper); R(x + 1, y - 12, 5, 5, '#e8dc9a'); R(x - 4, y - 8, 4, 2, C.pink);
    R(x - 7, y - 4, 2, 6, '#3a2a1c'); R(x + 5, y - 4, 2, 6, '#3a2a1c');
    return;
  }
  if (n.kind === 'bay') {
    /* a loading dock with its shutter half up */
    R(x - 17, y - 20, 34, 20, '#16101c'); R(x - 16, y - 19, 32, 19, '#4a587f'); R(x - 16, y - 19, 32, 3, '#6577a5');
    R(x - 10, y - 13, 20, 13, '#0c1329'); for (let k = 0; k < 3; k++) R(x - 10, y - 13 + k * 2, 20, 1, '#8794b3');
    R(x - 6, y - 5, 6, 5, '#e6dfcc'); R(x + 1, y - 4, 5, 4, '#e6dfcc'); R(x - 6, y - 5, 6, 1, G.scenario().col);
    return;
  }
  if (n.kind === 'soon' || !n.open) {
    /* a building site: scaffolding, tape, and a lamp that blinks */
    R(x - 15, y - 3, 30, 3, '#3a3340');
    for (let k = 0; k < 4; k++) R(x - 14 + k * 9, y - 22, 1, 20, '#8a6c40');
    for (let k = 0; k < 3; k++) R(x - 14, y - 21 + k * 7, 28, 1, '#8a6c40');
    for (let k = 0; k < 7; k++) R(x - 14 + k * 4, y - 8, 2, 2, k % 2 ? C.ink : C.amber);
    R(x + 12, y - 25, 3, 3, Math.floor(t * 2) % 2 ? C.amber : '#5a4a20');
    return;
  }
  /* a built stage: walls, a roof in the stage's colour, lit windows, a door, and a number plate */
  const fin = done(n);
  R(x - 17, y - 24, 34, 24, '#16101c'); R(x - 16, y - 20, 32, 20, '#3d4a70'); R(x - 18, y - 25, 36, 6, n.col); R(x - 18, y - 25, 36, 1, 'rgba(255,255,255,.4)');
  for (let k = 0; k < 3; k++) { const on = (Math.floor(t * 0.5 + k * 1.7 + n.n) % 5) !== 0; R(x - 13 + k * 10, y - 15, 5, 5, on ? '#f6dc8c' : '#232d4b'); }
  R(x - 3, y - 8, 7, 8, '#0c1329'); R(x - 2, y - 7, 5, 7, i === at ? '#f6dc8c' : '#30406d');
  R(x - 16, y - 34, 11, 10, C.ink); T(String(n.n), x - 13, y - 34, n.col, { f: 'smb' });
  if (fin) { R(x + 10, y - 36, 1, 12, C.paper); R(x + 11, y - 36, 6, 4, C.mint); }
  /* its stars, beside it; over the roof where the next building stands close on that side */
  const s = stars(n), tight = nodes.some(m => m !== n && m.x > x && m.x - x < 58 && m.y > y - 13 && m.y < y + 31), sy = tight ? y - 31 : y - 12;
  if (s) { G.star(x + 21, sy, true); T(String(s), x + 30, sy - 1, C.amber); }
}
/* what the place the player stands at is, and what can be done there */
function prompt(n) {
  const name = n.kind === 'board' ? 'REQUEST BOARD' : n.kind === 'bay' ? 'ARRIVALS: CHOOSE OR CHANGE YOUR PROJECT'
    : n.kind === 'soon' ? 'BUILDING SITE: ' + n.name : !n.open ? 'BUILDING SITE: ' + n.name + ', FOR THESE CELLS' : n.n + '  ' + n.name + ': ' + G.STAGES[n.id].what;
  const what = n.kind === 'board' ? 'READ' : n.kind === 'soon' || n.open === false ? 'READ THE SIGN' : 'GO IN';
  const hint = G.kt('ARROWS: WALK   SPACE: ' + what, 'TAP A PLACE TO GO THERE');
  R(0, VH - 22, VW, 22, 'rgba(8,12,26,.9)'); R(0, VH - 22, VW, 1, C.slate);
  T(name, 6, VH - 20, n.kind === 'stage' && n.open ? n.col : C.fog, { f: 'smb' }); T(hint, 6, VH - 10, C.steel);
}
})();
