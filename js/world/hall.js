/* The halls you walk: the inside of each stage of a project (js/scenarios.js). This file holds
   what every hall shares: the walking, the camera, the talking, the steps and the way out. What
   is in a hall, and what only that hall does, comes from the stage's kit (js/stages/<id>/,
   js/world/bay.js).
   Everything in a hall is there to be poked: most things answer with a line, some move, and some
   open a figure (see figures.js). L steps out to the map (js/world/campus.js), and a step the
   player has no data for can be handed to Tomo, the student: it gets done, with default settings
   and no stars. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const FY = 154, WALL = 132, SPEED = 100;
let W = VW;

const HERO = { skin: C.skin1, hair: '#3a2a22', style: 'short', coat: C.paper, shirt: C.cyan, pants: '#2c3a5e', shoes: C.ink };

/* A hall is the inside of a stage (js/scenarios.js), and a kit is what the stage puts in it. The
   kit's script registers it in G.kits when it arrives (js/engine/loader.js fetches it before the
   hall opens). Every kit has:
     ITEMS, W        the things in the hall, from left to right, and how long the hall is. A thing
                     is { id, kind, x, label }, and a step (a door or a station) has { code, name,
                     col, need } as well. A thing may also have fig (the figure it opens), stick
                     (its lines stop at the last one), floor (it is down on the floor, not at the
                     wall), sfx (the sound it makes) and ay (how high the arrow sits over it)
     LINES           what the things say when poked, and what the mentor says after each step
     paint           the colours of the walls and the floor
     draw(it, x, o)  draws one thing; false for the things this file draws (a door, the way out)
     room(cx)        what the room adds to its walls, behind the furniture
     line(id, n)     what a thing says on its nth poke, when that is not the next of its lines
     GOALS, NOTES    the stage's page in the notebook; or book(found, total), to write the page itself
   and, only where its hall needs one:
     use(it, api)    the player uses a thing in a way of the hall's own; true if that dealt with it
     next()          the id of the thing the arrow points at, when that is not the next step
     entry           where the player comes in from the map, when that is not the way out
     arrive(from)    the player has just come in, from a thing in the hall or from outside. It may
                     return what is said the first time: { say, then }, with walk: x if the
                     player first walks in to there
     tick(dt, hero)  called every frame, for whatever moves by itself
     over(cx, o)     draws over the furniture, behind the player
     fore(cx, o)     draws in front of the player
     locked(it)      true for a step that is shut for a reason of the hall's own
     label(it)       the prompt over a thing, when that is not the thing's own label
     mark(it)        the colour on the strip map of a thing that is not a step
     dark(n)         true while ceiling lamp n is off */
G.kits = G.kits || {};
let ITEMS = [], EGGS = [], ROOMS = [], kit = null, floorId = 'make';
function setFloor(id) {
  id = { g: 'make', 2: 'map', 3: 'who', 4: 'runs' }[id] || id;      /* what the stages were called when they were floors */
  floorId = G.STAGES[id] && G.kits[id] ? id : 'make';
  kit = G.kits[floorId];
  ITEMS = kit.ITEMS; W = kit.W; ROOMS = G.STAGES[floorId].rooms;
  if (kit.LINES) Object.assign(LINES, kit.LINES);
  EGGS = ITEMS.filter(i => i.kind === 'prop').map(i => i.id);
  G.state.floor = floorId;
}
const stageDone = id => G.STAGES[id].rooms.concat(G.STAGES[id].extra || []).every(k => G.state.rooms[k].done);
/* the stage after this one on the project's route, if it can be played */
const nextStage = () => { const r = G.route(), i = r.indexOf(floorId); return i >= 0 && r[i + 1] ? r[i + 1] : null; };
const isLocked = it => !!it.soon || (!!it.need && !G.state.rooms[it.need].done) || (!!kit.locked && !!kit.locked(it));
const isStep = it => it.kind === 'door' || it.kind === 'station';
/* how many of the stage's steps are done, counting a room it keeps for the end */
const stepsDone = () => ROOMS.concat(G.STAGES[floorId].extra || []).filter(k => G.state.rooms[k].done).length;

/* the lines of the hall the player is in are added to these when the hall opens */
const LINES = {
  summonStep: [
    'YOU: (typing) Could you run the steps before this one for me? Default settings are fine.',
    'TOMO: (three dots, for a long time) ...ok. Done. Please never open my notebook.',
  ],
};

let hero = { x: 24, dir: 1, walking: false }, cam = 0, talk = null, talkAfter = null, auto = null, near = null, fig = null, goal = null, runT = 0, party = -99, liftHint = 0, ask = null;
const pokes = {}, fx = {};
const since = id => (fx[id] === undefined ? 99 : G.t - fx[id]);

function eggCount() { return EGGS.filter(e => G.state.eggs[e]).length; }
function showBook() {
  if (kit.book) { kit.book(eggCount(), EGGS.length); return; }
  const s = G.state, st = r => (!r.done ? '' : r.by ? ' (Tomo did it)' : ' (' + '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars) + ')');
  const todo = kit.GOALS;
  G.book.show({
    floor: 'Stage ' + G.STAGES[floorId].n + ' · ' + G.STAGES[floorId].name.charAt(0) + G.STAGES[floorId].name.slice(1).toLowerCase(), room: 'The hall', methods: true, file: 'js/' + G.STAGES[floorId].hall[G.STAGES[floorId].hall.length - 1], fileText: 'add something to this corridor', fileTail: ' yourself.',
    goals: todo.map(r => ({ id: r[0], text: r[1] + st(s.rooms[r[0]]) })).concat([
      { id: 'e', text: 'Poke around: ' + eggCount() + ' of ' + EGGS.length + ' things found' }]),
    notes: kit.NOTES,
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
  G.toast(n === EGGS.length ? 'ALL ' + n + ' FOUND. YOUR H-INDEX IS UNCHANGED.' : 'FOUND ' + n + ' OF ' + EGGS.length + ' IN THIS BUILDING', n === EGGS.length ? 6 : 3);
  G.sfx('star');
}

/* the student does these steps: default settings, and no stars */
function summon(ids) {
  const s = G.state;
  ids.forEach(r => { if (!s.rooms[r].done) s.rooms[r] = { done: true, stars: 0, by: 'student' }; });
  /* what the student's steps leave behind for later ones. It is written here and not in the
     kits, because the map can ask for a stage's steps before that stage's kit has arrived. */
  if (ids.indexOf('pca') >= 0 || ids.indexOf('knn') >= 0) s.unclog = true;
  if (ids.indexOf('cut') >= 0 && !s.bureau) s.bureau = { res: 0.5, fix: 'zoom' };
  if (ids.indexOf('wash') >= 0 && !s.laundry) s.laundry = { theta: 2 };
  if (ids.indexOf('stairs') >= 0 && !(s.weigh && s.weigh.rule)) s.weigh = Object.assign({}, s.weigh, { rule: 'bh', rate: 0.05 });
  if (ids.indexOf('turntable') >= 0 && !(s.yard && s.yard.root) && G.sys && G.sys.book && G.sys.book.root) s.yard = Object.assign({}, s.yard, { root: G.sys.book.root });
  G.save(); if (G.scene() === 'corridor') showBook(); G.sfx('star');
}
/* out of the hall, to the map */
function leave() {
  if (talk || fig || ask || auto) return;
  if (!G.scenario()) { G.sfx('bad'); say(['VERA: Not yet. Take a parcel first: it decides where you are going.']); return; }
  goal = null; G.sfx('door'); G.go('campus', { from: floorId });
}

/* what a stage's own kit may ask of the hall when the player uses one of its things */
const API = {
  say, found,
  ask: (text, opts, pick, sel) => { ask = { text, opts, sel: sel || 0, pick: k => { ask = null; pick(k); } }; },
  refresh: () => showBook(),
};
/* and what it may ask while it draws */
const LOOK = { locked: isLocked, since, pokes };
function interact(it) {
  const s = G.state;
  if (kit.use && kit.use(it, API)) return;
  if (isStep(it)) {
    if (isLocked(it)) {
      const need = ITEMS.find(i => i.id === it.need), ids = ROOMS.slice(0, ROOMS.indexOf(it.id)).filter(r => !s.rooms[r].done);
      G.sfx('bad');
      ask = { text: 'NO DATA: ' + it.code + ' needs what ' + need.code + ' makes, and you have not made it. Do it yourself, or ask Tomo?', opts: ['DO IT MYSELF', 'ASK TOMO'], sel: 0,
        pick: k => { ask = null; if (k === 1) say(LINES.summonStep, () => { summon(ids); G.toast('TOMO DID ' + ids.length + (ids.length === 1 ? ' STEP' : ' STEPS') + '. NO STARS FOR THOSE.', 5); }); } };
      return;
    }
    G.sfx('door'); G.go(it.id, {});
    return;
  }
  /* the mentor says where things stand: one set of lines for each step done */
  if (it.kind === 'npc') { say(LINES[it.id][stepsDone()]); return; }
  if (it.kind === 'lift') { leave(); return; }
  const n = pokes[it.id] = (pokes[it.id] || 0) + 1;
  fx[it.id] = G.t;
  G.sfx(it.sfx || 'blip');
  if (it.fig) { fig = { id: it.fig, t: 0, after: () => found(it.id) }; return; }
  const now = kit.line(it.id, n);
  if (now) { say([now], () => found(it.id)); return; }
  const lines = LINES[it.id], i = it.stick ? Math.min(n - 1, lines.length - 1) : (n - 1) % lines.length;
  say([lines[i]], () => found(it.id));
}

/* the map hands work to the student too */
G.hall = { summon };

G.scenes.corridor = {
  /* test hooks: jump to an x, or open a figure */
  dbg: { at: x => { hero.x = x; cam = G.clamp(x - 150, 0, W - VW); }, fig: id => { fig = { id, t: 1 }; }, clear: () => { talk = null; fig = null; goal = null; ask = null; }, cam: () => cam, heroX: () => hero.x, busy: () => !!(talk || fig || auto || ask), asking: () => !!ask, items: () => ITEMS.map(i => [i.id, Math.round(i.x)]) },
  enter(a) {
    talk = null; auto = null; near = null; fig = null; goal = null; runT = 0; ask = null;
    const was = floorId;
    setFloor(a.floor || G.state.floor || 'make');
    /* a hall is entered by its way out, unless it has a way in of its own */
    const front = kit.entry !== undefined && a.from === 'lift', from = !front && a.from && ITEMS.find(i => i.id === a.from);
    const first = kit.arrive ? kit.arrive(from || null) : null;
    if (from) { hero.x = from.x; hero.dir = a.from === 'lift' ? 1 : hero.dir; }
    else if (first && first.walk) { hero.x = -8; hero.dir = 1; auto = { to: first.walk, then: () => { say(first.say, first.then); } }; }
    else if (front) { hero.x = kit.entry; hero.dir = 1; }
    else if (was !== floorId) { hero.x = ITEMS.find(i => i.kind === 'lift').x; }
    else { hero.x = Math.max(30, hero.x); }
    cam = G.clamp(hero.x - 150, 0, W - VW);
    showBook();
    if (a.toast) G.toast(a.toast, 4);
    if (a.party) party = G.t;
    /* first time in this hall: the mentor has something to say */
    if (first && !first.walk && !auto) say(first.say, first.then);
    /* the stage is finished: say once, after the room's own toast, that the way on is open */
    liftHint = stageDone(floorId) && nextStage() && !(G.state.told || {})[floorId] ? G.t + (a.toast ? 4.3 : 1) : 0;
    G.save();
  },
  update(dt) {
    hero.walking = false;
    if (liftHint && G.t > liftHint && !talk && !fig) {
      G.toast('THE NEXT STAGE IS OPEN. ' + G.kt('PRESS L FOR THE MAP.', 'TAP MAP TO GO THERE.'), 6); G.sfx('ok');
      G.state.told = Object.assign({}, G.state.told); G.state.told[floorId] = true;
      G.save(); liftHint = 0;
    }
    /* whatever moves by itself keeps moving, whatever else is going on */
    if (kit.tick) kit.tick(dt, hero);
    if (G.hit('lift') || (G.ptr.pressed && floorsBtn().hot)) leave();
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
        if (goal.it) goal.x = goal.it.x;                                        /* a thing can move */
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
    if (near && !auto && !talk && !fig && !ask) {
      if (G.hit('a') || G.hit('up')) { goal = null; interact(near); }
    }
  },
  draw() {
    const cx = Math.round(cam);
    drawRoom(cx);
    ITEMS.forEach(it => { if (!it.floor && it.x - cx > -70 && it.x - cx < VW + 70) drawItem(it, it.x - cx); });
    if (kit.over) kit.over(cx, LOOK);
    G.person(hero.x - cx, FY, HERO, { dir: hero.dir, walk: hero.walking, t: G.t });
    drawFront(cx);
    drawNext(cx);

    /* header */
    R(0, 0, VW, 11, 'rgba(8,12,26,.85)');
    T(title(), 5, 1, C.fog);
    /* the way to the other floors, from anywhere */
    const fb = floorsBtn();
    G.panel(fb.x, 0, fb.w, 11, { border: fb.hot ? C.cyan : C.slate, fill: C.night }); T(fb.label, fb.x + 4, 1, fb.hot ? C.white : C.mist);
    /* a strip map of the corridor: the steps, whatever else the hall marks, and you */
    R(0, 11, VW, 2, '#0c1329');
    ITEMS.forEach(i => {
      const col = isStep(i) ? (isLocked(i) ? C.slate : i.col) : kit.mark ? kit.mark(i) : null;
      if (col) R(Math.round(i.x * VW / W) - 1, 11, 3, 2, col);
    });
    R(Math.round(hero.x * VW / W) - 1, 10, 2, 4, C.white);
    if (G.maxStars()) { G.star(VW - 44, 2, true); T(G.totalStars() + '/' + G.maxStars(), VW - 5, 1, C.amber, { a: 'right' }); }

    if (near && !talk && !auto && !fig && !ask) {
      const lab = near.kind === 'door' ? (isLocked(near) ? 'LOCKED' : 'ENTER ' + near.code)
        : near.kind === 'station' ? (isLocked(near) ? 'NO DATA' : near.label || 'USE ' + near.code)
        : (kit.label && kit.label(near)) || near.label;
      const w = Math.ceil(G.tw(lab, 'sm')) + 10, x = G.clamp(Math.round(hero.x - cx - w / 2), 2, VW - w - 2), y = FY - 36 + Math.round(Math.sin(G.t * 4));
      G.panel(x, y, w, 12, { border: C.amber, fill: C.ink });
      T(lab, x + 5, y + 1, C.amber);
    }
    if (talk) talk.draw({ top: true });
    if (ask) {
      G.caption(ask.text, 99, { top: true, noPrompt: true, border: C.amber });
      ask.opts.forEach((o, i) => { if (G.button('ask' + i, 12 + i * 152, 70, 144, 15, o, { focus: ask.sel === i, primary: i === 1 }) && ask) ask.pick(i); });
    }
    if (fig) G.drawFigure(fig.id, fig.t);
  },
};

/* ---------- where to go next ---------- */
/* No words: an arrow bounces over the next thing to do. If that is off the screen, the arrow
   sits at the edge it lies beyond. */
function nextStop() {
  const s = G.state, id = kit.next && kit.next();
  if (id) return ITEMS.find(i => i.id === id) || null;
  /* a finished stage points at the way out, as long as the project goes on */
  return ITEMS.find(i => isStep(i) && !s.rooms[i.id].done) || (nextStage() ? ITEMS.find(i => i.kind === 'lift') : null);
}
function drawNext(cx) {
  const it = nextStop();
  if (!it || talk || ask || fig || auto) return;
  const x = it.x - cx, y = it.ay || (it.kind === 'lift' ? 56 : 42);
  if (it.kind === 'lift' && Math.abs(it.x - hero.x) > 320) {
    /* the way out is a long walk away, and the map is one press away: point at that */
    const fb = floorsBtn(), ax = Math.round(fb.x + fb.w / 2), b = Math.round(Math.abs(Math.sin(G.t * 6)) * 3);
    for (let i = 0; i < 4; i++) { R(ax - i, 15 + b + i, 1 + 2 * i, 1, C.amber); R(ax - i, 16 + b + i, 1 + 2 * i, 1, C.ink); }
    for (let i = 0; i < 4; i++) R(ax - i, 15 + b + i, 1 + 2 * i, 1, C.amber);
    return;
  }
  if (x < 8 || x > VW - 8) {
    /* beyond the edge: point that way */
    const right = x > VW - 8, ax = right ? VW - 6 : 6, b = Math.round(Math.abs(Math.sin(G.t * 6)) * 3) * (right ? 1 : -1);
    for (let i = 0; i < 5; i++) R(ax + b + (right ? i - 4 : 4 - i), 84 - 4 + i, 1, 9 - 2 * i, C.amber);
    return;
  }
  if (near !== it) G.cue(x, y, true);
}

/* ---------- the header button ---------- */
const title = () => (G.STAGES[floorId].n ? G.STAGES[floorId].n + '  ' : '') + G.STAGES[floorId].name;
function floorsBtn() {
  const label = G.kt('L: MAP', 'MAP'), x = 5 + Math.ceil(G.tw(title(), 'sm')) + 8, w = Math.ceil(G.tw(label, 'sm')) + 8;
  return { label, x, w, hot: G.ptr.y >= 0 && G.ptr.y < 12 && G.ptr.x >= x - 2 && G.ptr.x < x + w + 2 };
}

/* ---------- drawing ---------- */
function drawRoom(cx) {
  /* each hall has its own paint */
  const p = kit.paint;
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
  /* ceiling pipe and lamps */
  R(0, 9, VW, 2, '#1b2647');
  for (let wx = 48, n = 0; wx < W; wx += 110, n++) {
    const x = wx - cx;
    if (x < -40 || x > VW + 40) continue;
    const off = !!kit.dark && kit.dark(n);
    R(x - 9, 13, 18, 3, off ? C.steel : C.fog);
    if (!off) { R(x - 26, 16, 52, 112, 'rgba(255,255,255,.035)'); R(x - 14, 16, 28, 112, 'rgba(255,255,255,.03)'); }
  }
  kit.room(cx);
}

/* a thing is drawn by the kit of the hall it stands in. A door and the way out look the same in every hall. */
function drawItem(it, x) {
  const s = G.state, t = G.t;
  if (kit.draw(it, x, LOOK)) return;
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
    if (done && s.rooms[it.id].by) T('TOMO DID IT', x, 45, C.steel, { a: 'center' });
    else if (done) G.stars(x - 13, 44, s.rooms[it.id].stars);
    else if (it.soon) T('SOON', x, 45, C.steel, { a: 'center' });
    return;
  }
  if (it.kind === 'lift') {
    R(x - 22, 72, 44, 60, '#0c1329'); R(x - 19, 76, 18, 56, '#8794b3'); R(x + 1, 76, 18, 56, '#8794b3');
    R(x - 19, 76, 18, 2, '#a9b4cf'); R(x + 1, 76, 18, 2, '#a9b4cf'); R(x - 1, 76, 2, 56, '#0c1329');
    G.panel(x - 12, 59, 24, 12, { border: C.fog, fill: C.ink }); T('OUT', x, 60, C.amber, { a: 'center' });
    R(x + 25, 100, 5, 9, C.ink); R(x + 26, 102, 3, 2, Math.floor(t * 2) % 2 ? C.amber : C.steel);
  }
}

/* things in front of the player */
function drawFront(cx) {
  /* the floor is finished: it rains cells for a moment */
  const pa = G.t - party;
  if (pa < 6 && !G.reduced) {
    const rnd = G.rng(77);
    for (let i = 0; i < 46; i++) { const x = rnd() * VW, v = 30 + rnd() * 50, y = (pa * v + rnd() * 200) % 210 - 20; if (pa < 5 || y > pa * 40 - 200) G.cell(x, y, G.TYPES[i % 5], 4 + (i % 3)); }
  }
  if (kit.fore) kit.fore(cx, LOOK);
}

})();
