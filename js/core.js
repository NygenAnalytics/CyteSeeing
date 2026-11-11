/* CyteSeeing core: canvas, palette, pixel helpers, input, sound, save, scenes and the main loop.
   Plain script, no modules, so the game still runs straight from disk. */
(function () {
'use strict';

const VW = 320, VH = 180;
const cv = document.getElementById('screen');
const ctx = cv.getContext('2d');
/* The game is drawn in 320 x 180 units, but onto a canvas with as many real pixels as the screen
   gives it. Blocks stay blocky and text is drawn at full resolution, so nothing is blurred by scaling. */
function setScale(s) {
  s = Math.max(1, Math.round(s));
  cv.width = VW * s; cv.height = VH * s;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.imageSmoothingEnabled = false;
}
setScale(1);

const G = window.G = { VW, VH, cv, ctx, t: 0, scenes: {}, params: {} };
/* the game's name: change it here and the title screen and page header follow */
G.NAME = 'CyteSeeing';
/* where the game's source lives. A fork should point this at itself. */
G.REPO = 'https://github.com/NygenAnalytics/CyteSeeing';
G.setScale = setScale;
G.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
/* true on phones and tablets: hints name taps instead of keys, and tap targets get a little slack */
const coarse = window.matchMedia ? window.matchMedia('(hover: none), (pointer: coarse)') : null;
G.touch = !!(coarse && coarse.matches);
if (coarse && coarse.addEventListener) coarse.addEventListener('change', e => { G.touch = e.matches; });
G.kt = (keys, taps) => (G.touch ? taps : keys);

/* ================= palette ================= */
const C = G.C = {
  ink: '#0a0f1e', night: '#101831', deep: '#182449', slate: '#2a3966', steel: '#4f6290',
  mist: '#93a4c8', fog: '#c5d0e6', paper: '#efe9d6', white: '#ffffff',
  cyan: '#4fd6e8', teal: '#1f95ab', lilac: '#b79df6', violet: '#7658d0',
  amber: '#f6ba4c', orange: '#e7853b', coral: '#f0655f', mint: '#7be0a1', green: '#2e9a68',
  pink: '#f29ac2', oil: '#d8b45a', wood: '#8a5a3c', skin1: '#f1c8a4', skin2: '#c68e62', skin3: '#8d5a3b',
};
/* cell-type colours, reused in every room so a T cell is always the same colour */
G.TYPES = [C.cyan, C.lilac, C.amber, C.mint, C.pink];

/* ================= save ================= */
const SAVE_KEY = 'cyteseeing-save-v1';
function fresh() {
  return {
    rooms: {
      droplets: { done: false, stars: 0 }, cliff: { done: false, stars: 0 }, qc: { done: false, stars: 0 },
      soup: { done: false, stars: 0 }, doublet: { done: false, stars: 0 }, review: { done: false, stars: 0 },
    },
    load: null,      // what you loaded in 1-1: { R, lanes, singlets, doublets, rate }
    calls: null,     // what you called in 1-2: { called, recall, empties, doublets }
    qc: null,        // what you filtered in 1-3
    soup: null,      // what you corrected in 1-4
    dbl: null,       // what you removed in 1-5
    tries: { droplets: 0, cliff: 0, qc: 0, soup: 0, doublet: 0, review: 0 },
    notes: {},       // field notes unlocked so far
    eggs: {}, met: false, sound: false,
  };
}
G.state = fresh();
G.loadSave = function () {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s && s.rooms) {
      const f = fresh();
      G.state = Object.assign(f, s);
      G.state.rooms = Object.assign(fresh().rooms, s.rooms);
      G.state.tries = Object.assign(fresh().tries, s.tries || {});
    }
  } catch (e) { /* storage can be blocked; the game still runs */ }
};
G.save = function () { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); } catch (e) {} };
G.resetSave = function () { const snd = G.state.sound; G.state = fresh(); G.state.sound = snd; G.save(); };
G.hasProgress = () => G.state.met || G.state.rooms.droplets.done;
G.totalStars = () => Object.keys(G.state.rooms).reduce((n, k) => n + G.state.rooms[k].stars, 0);
G.MAX_STARS = 18;

/* ================= utils ================= */
G.fmt = n => Math.round(n).toLocaleString('en-US');
G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
G.lerp = (a, b, t) => a + (b - a) * t;
G.ease = t => t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3);
G.rng = function (seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
G.poisson = function (lam, rnd) {
  const L = Math.exp(-lam); let k = 0, p = 1;
  do { k++; p *= rnd(); } while (p > L);
  return k - 1;
};

/* ================= pixel helpers ================= */
const R = G.R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const FONTS = {
  sm: '8px Silkscreen, monospace', smb: 'bold 8px Silkscreen, monospace',
  md: '16px VT323, monospace', lg: 'bold 16px Silkscreen, monospace',
};
const T = G.T = (s, x, y, c, o) => {
  o = o || {};
  ctx.font = FONTS[o.f || 'sm']; ctx.textBaseline = 'top'; ctx.textAlign = o.a || 'left';
  /* align by hand to whole pixels, so centred and right-aligned text stays crisp */
  if (o.a === 'center') x -= ctx.measureText(s).width / 2;
  else if (o.a === 'right') x -= ctx.measureText(s).width;
  ctx.textAlign = 'left';
  x = Math.round(x); y = Math.round(y);
  if (o.sh) { ctx.fillStyle = o.sh; ctx.fillText(s, x + 1, y + 1); }
  ctx.fillStyle = c; ctx.fillText(s, x, y);
};
G.tw = (s, f) => { ctx.font = FONTS[f || 'sm']; return ctx.measureText(s).width; };
const wrapCache = {};
G.wrap = function (s, maxW, f) {
  const key = (f || 'sm') + '|' + maxW + '|' + s;
  if (wrapCache[key]) return wrapCache[key];
  ctx.font = FONTS[f || 'sm'];
  const out = [];
  s.split('\n').forEach(par => {
    let line = '';
    par.split(' ').forEach(word => {
      const tryLine = line ? line + ' ' + word : word;
      if (ctx.measureText(tryLine).width > maxW && line) { out.push(line); line = word; }
      else line = tryLine;
    });
    out.push(line);
  });
  return (wrapCache[key] = out);
};
G.disc = (cx, cy, r, c) => {
  ctx.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy);
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35);
    ctx.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
  }
};
G.ring = (cx, cy, r, c) => {
  ctx.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy);
  let x = r, y = 0, err = 1 - r;
  while (x >= y) {
    [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]
      .forEach(p => ctx.fillRect(cx + p[0], cy + p[1], 1, 1));
    y++;
    if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
  }
};
G.line = (x0, y0, x1, y1, c) => {
  ctx.fillStyle = c;
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, guard = 0;
  while (guard++ < 2000) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
};
G.hdash = (x0, x1, y, c, on, off) => { on = on || 3; off = off || 2; for (let x = x0; x < x1; x += on + off) R(x, y, Math.min(on, x1 - x), 1, c); };
G.vdash = (x, y0, y1, c, on, off) => { on = on || 3; off = off || 2; for (let y = y0; y < y1; y += on + off) R(x, y, 1, Math.min(on, y1 - y), c); };

/* a cell: a rounded block with a pale nucleus. x, y is the top-left corner. */
G.cell = (x, y, c, s) => {
  s = s || 6; x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = c; ctx.fillRect(x + 1, y, s - 2, s); ctx.fillRect(x, y + 1, s, s - 2);
  const n = s >= 7 ? 3 : 2, o = Math.floor((s - n) / 2);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x + o, y + o, n, n);
};

/* a person, 10 wide and 20 tall. x is the centre, y is the feet. */
G.person = (x, y, L, o) => {
  o = o || {};
  const dir = o.dir || 1, walk = !!o.walk, t = o.t || 0;
  const f = walk ? Math.floor(t * 9) % 4 : 0;
  const px = Math.round(x) - 5, py = Math.round(y) - 20 + (walk && f % 2 ? -1 : 0);
  const sw = walk ? [1, 0, -1, 0][f] : 0;
  R(px + 2 + sw, py + 14, 2, 5, L.pants); R(px + 6 - sw, py + 14, 2, 5, L.pants);
  R(px + 2 + sw + (dir > 0 ? 0 : -1), py + 19, 3, 1, L.shoes); R(px + 6 - sw + (dir > 0 ? 0 : -1), py + 19, 3, 1, L.shoes);
  R(px + 1, py + 7, 8, 8, L.coat);
  R(px + 4, py + 7, 2, 4, L.shirt);
  R(px, py + 8, 1, 5, L.coat); R(px + 9, py + 8, 1, 5, L.coat);
  R(px, py + 13, 1, 1, L.skin); R(px + 9, py + 13, 1, 1, L.skin);
  R(px + 2, py + 1, 6, 6, L.skin);
  R(px + 2, py, 6, 2, L.hair);
  R(dir > 0 ? px + 2 : px + 7, py + 2, 1, 2, L.hair);
  if (L.style === 'long') { R(px + 1, py + 1, 1, 7, L.hair); R(px + 8, py + 1, 1, 7, L.hair); }
  if (L.style === 'bun') R(px + 4, py - 2, 3, 2, L.hair);
  if (L.style === 'curly') { R(px + 1, py, 1, 3, L.hair); R(px + 8, py, 1, 3, L.hair); R(px + 3, py - 1, 4, 1, L.hair); }
  R(dir > 0 ? px + 6 : px + 3, py + 3, 1, 1, C.ink);
  if (L.glasses) R(dir > 0 ? px + 5 : px + 2, py + 3, 3, 1, C.ink);
};

G.panel = (x, y, w, h, o) => {
  o = o || {};
  const b = o.border || C.fog, f = o.fill || C.ink;
  R(x + 1, y, w - 2, h, b); R(x, y + 1, w, h - 2, b);
  R(x + 1, y + 1, w - 2, h - 2, f);
};

const STAR = ['...#...', '...#...', '#######', '.#####.', '..###..', '.##.##.', '.#...#.'];
G.star = (x, y, on) => {
  const c = on ? C.amber : C.slate;
  STAR.forEach((row, j) => { for (let i = 0; i < 7; i++) if (row[i] === '#') R(x + i, y + j, 1, 1, c); });
};
G.stars = (x, y, n) => { for (let i = 0; i < 3; i++) G.star(x + i * 9, y, i < n); };

/* ================= input ================= */
const KEYMAP = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  a: 'left', d: 'right', w: 'up', s: 'down',
  ' ': 'a', Enter: 'a', z: 'a', e: 'a', Escape: 'b', Backspace: 'b', x: 'b',
};
const down = G.down = {}, hit = {}, held = {};
const isField = el => el && el !== cv && /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(el.tagName);
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || isField(e.target)) return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (key === 'm') { G.toggleSound(); return; }
  if (key === 'f' && G.toggleFull) { G.toggleFull(); return; }
  const k = KEYMAP[key];
  if (!k) return;
  e.preventDefault();
  if (!down[k]) hit[k] = true;
  down[k] = true;
});
window.addEventListener('keyup', e => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const k = KEYMAP[key];
  if (k) { down[k] = false; held[k] = 0; }
});
window.addEventListener('blur', () => { Object.keys(down).forEach(k => { down[k] = false; }); });
G.hit = k => !!hit[k];
/* press a key from code: it counts on the next frame */
const queued = {};
G.press = k => { queued[k] = true; };
/* skip an animation: the action key, or a tap or click anywhere */
G.skip = () => !!hit.a || ptr.pressed;
/* true on the first press, then repeats while the key is held */
G.rep = k => !!hit[k] || (down[k] && held[k] > 0.32 && held[k + '_r']);

const ptr = G.ptr = { x: -1, y: -1, down: false, pressed: false, released: false };
function ptrPos(e) {
  const r = cv.getBoundingClientRect();
  ptr.x = (e.clientX - r.left) * VW / r.width;
  ptr.y = (e.clientY - r.top) * VH / r.height;
}
cv.addEventListener('pointerdown', e => {
  ptrPos(e); ptr.down = true; ptr.pressed = true; ptr.lift = false;
  if (e.pointerType === 'touch') G.touch = true;
  try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  cv.focus({ preventScroll: true });
  e.preventDefault();
});
cv.addEventListener('pointermove', ptrPos);
const ptrUp = e => { ptrPos(e); if (ptr.down) ptr.released = true; ptr.down = false; if (e.pointerType === 'touch') ptr.lift = true; };
cv.addEventListener('pointerup', ptrUp);
cv.addEventListener('pointercancel', ptrUp);
G.over = (x, y, w, h) => { const s = G.touch ? 2 : 0; return ptr.x >= x - s && ptr.x < x + w + s && ptr.y >= y - s && ptr.y < y + h + s; };

/* on-screen pad, for phones */
document.querySelectorAll('[data-key]').forEach(b => {
  const k = b.getAttribute('data-key');
  const on = e => { e.preventDefault(); if (!down[k]) hit[k] = true; down[k] = true; };
  const off = () => { down[k] = false; held[k] = 0; };
  b.addEventListener('pointerdown', on);
  b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
  b.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hit[k] = true; } });
});

/* ================= immediate-mode controls ================= */
const ui = { active: null };
G.button = function (id, x, y, w, h, label, o) {
  o = o || {};
  const over = G.over(x, y, w, h) && !o.disabled;
  let clicked = false;
  if (over && ptr.pressed) ui.active = id;
  if (ui.active === id && ptr.released) { if (over) clicked = true; ui.active = null; }
  const pressed = ui.active === id && over;
  const border = o.disabled ? C.slate : (o.focus || over) ? (o.accent || C.cyan) : C.mist;
  const fill = o.disabled ? C.night : pressed ? C.steel : o.primary ? (o.fill || C.teal) : C.slate;
  G.panel(x, y + (pressed ? 1 : 0), w, h, { border, fill });
  T(label, x + w / 2, y + Math.floor((h - 8) / 2) - 1 + (pressed ? 1 : 0), o.disabled ? C.steel : C.white, { a: 'center', f: o.f || 'sm' });
  if (o.focus && !o.disabled && Math.floor(G.t * 3) % 2 === 0) T('>', x - 7, y + Math.floor((h - 8) / 2) - 1, o.accent || C.cyan);
  if (clicked) G.sfx('blip');
  return clicked;
};
/* returns the new value; drag or click on the track */
G.slider = function (id, x, y, w, v, min, max, step, o) {
  o = o || {};
  const over = G.over(x - 3, y - 5, w + 6, 13);
  if (over && ptr.pressed) ui.active = id;
  if (ui.active === id) {
    if (ptr.down || ptr.released) {
      const f = G.clamp((ptr.x - x) / w, 0, 1);
      v = Math.round((min + f * (max - min)) / step) * step;
    }
    if (!ptr.down) ui.active = null;
  }
  const f = (v - min) / (max - min);
  R(x, y, w, 3, C.slate);
  R(x, y, Math.round(w * f), 3, o.c || C.cyan);
  if (o.marks) o.marks.forEach(m => R(x + Math.round(w * (m - min) / (max - min)), y - 2, 1, 2, C.steel));
  const kx = x + Math.round(w * f);
  R(kx - 2, y - 3, 5, 9, o.focus || over || ui.active === id ? C.white : C.fog);
  R(kx - 1, y - 2, 3, 7, o.c || C.cyan);
  if (o.focus && Math.floor(G.t * 3) % 2 === 0) T('>', x - 8, y - 3, C.cyan);
  return v;
};
G.uiBusy = () => ui.active !== null;

/* ---------- pieces every room uses ---------- */
G.roomHeader = function (title, col, leave) {
  R(0, 0, VW, 11, 'rgba(8,12,26,.9)');
  T(title, 5, 1, col);
  if (!leave) return;
  /* the way out: Esc, or a tap or click on the label */
  const over = G.over(VW - 64, 0, 64, 12);
  if (G.touch) { G.panel(VW - 44, 0, 42, 11, { border: over ? C.cyan : C.steel, fill: C.night }); T('LEAVE', VW - 23, 1, C.fog, { a: 'center' }); }
  else T('ESC: LEAVE', VW - 5, 1, over ? C.fog : C.steel, { a: 'right' });
  if (ptr.pressed && over) G.press('b');
};
G.strip = function (y0) { R(0, y0, VW, VH - y0, '#0e1630'); R(0, y0, VW, 1, C.slate); };
/* a result: two lines of text and two buttons. Returns 'retry', 'keep' or null. */
G.resultDraw = function (y0, msg, pass, rsel, a, b) {
  G.strip(y0);
  G.wrap(msg, 300, 'md').slice(0, 2).forEach((l, i) => T(l, 10, y0 + 3 + i * 11, C.paper, { f: 'md' }));
  let act = null;
  if (G.button('res-a', 10, y0 + 29, 104, 15, a, { focus: rsel === 0 || !pass })) act = 'retry';
  if (pass && G.button('res-b', 176, y0 + 29, 134, 15, b, { primary: true, focus: rsel === 1 })) act = 'keep';
  return act;
};
G.resultKeys = function (rsel, pass) {
  if (G.hit('left') || G.hit('right')) { rsel = 1 - rsel; G.sfx('tick'); }
  return { rsel, act: G.hit('a') ? (rsel === 1 && pass ? 'keep' : 'retry') : null };
};

/* ================= sound ================= */
let ac = null;
const SFX = {
  blip: [[660, .05]], step: [[150, .02]], door: [[220, .06], [330, .09]],
  ok: [[523, .07], [784, .12]], bad: [[196, .12], [147, .2]],
  star: [[784, .07], [988, .07], [1319, .16]], drop: [[880, .025]], pop: [[420, .03]],
  tick: [[1200, .012]], scan: [[980, .02]],
};
G.sfx = function (name) {
  if (!G.state.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    let t = ac.currentTime;
    (SFX[name] || SFX.blip).forEach(n => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'square'; o.frequency.value = n[0];
      g.gain.setValueAtTime(0.035, t); g.gain.exponentialRampToValueAtTime(0.0008, t + n[1]);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + n[1] + 0.01);
      t += n[1];
    });
  } catch (e) {}
};
G.toggleSound = function () {
  G.state.sound = !G.state.sound; G.save();
  const b = document.getElementById('btn-sound');
  if (b) { b.textContent = G.state.sound ? 'Sound on' : 'Sound off'; b.setAttribute('aria-pressed', G.state.sound ? 'true' : 'false'); }
  G.sfx('ok');
};

/* ================= captions, beats, toasts ================= */
/* A caption box across the bottom. Returns true once the whole line is on screen. */
G.caption = function (text, t, o) {
  o = o || {};
  const x = 5, w = VW - 10, h = 44, y = o.top ? 15 : VH - h - 4;
  let who = null;
  const m = /^([A-Z0-9 .'-]{2,16}): /.exec(text);
  if (m) { who = m[1]; text = text.slice(m[0].length); }
  G.panel(x, y, w, h, { border: o.border || C.fog, fill: C.ink });
  if (who) {
    const ww = Math.ceil(G.tw(who, 'smb')) + 8;
    /* above the box when it sits at the bottom; under its right end when it sits at the top,
       where a third line of text would otherwise run into it */
    const ty = o.top ? y + h - 4 : y - 7, tx = o.top ? x + w - ww - 6 : x + 6;
    G.panel(tx, ty, ww, 11, { border: o.border || C.fog, fill: o.accent || C.teal });
    T(who, tx + 4, ty + 1, C.white, { f: 'smb' });
  }
  const lines = G.wrap(text, w - 18, 'md');
  const total = lines.join('').length;
  let n = G.reduced ? total : Math.floor(t * 70);
  for (let i = 0; i < lines.length && i < 3; i++) {
    const s = lines[i].slice(0, Math.max(0, n));
    T(s, x + 8, y + 4 + i * 12, C.paper, { f: 'md' });
    n -= lines[i].length;
  }
  const full = n >= 0;
  if (full && !o.noPrompt && Math.floor(G.t * 2.5) % 2 === 0) T('>', x + w - 10, y + h - 12, C.cyan);
  return full;
};
/* A list of captions stepped with Right, Space or a click; Left goes back. */
G.Beats = function (list) { this.list = list; this.i = 0; this.t = 0; this.full = false; };
G.Beats.prototype.cur = function () { return this.list[this.i]; };
G.Beats.prototype.update = function (dt) {
  this.t += dt;
  const fwd = G.hit('a') || G.hit('right') || G.ptr.pressed;
  if (fwd) {
    if (!this.full) { this.t = 99; return null; }
    if (this.i < this.list.length - 1) { this.i++; this.t = 0; this.full = false; G.sfx('blip'); return 'next'; }
    return 'done';
  }
  if (G.hit('left') && this.i > 0) { this.i--; this.t = 99; return 'prev'; }
  return null;
};
G.Beats.prototype.draw = function (o) { this.full = G.caption(this.cur().say, this.t, o); };

let toast = null;
G.toast = function (text, secs) { toast = { text, t: 0, secs: secs || 3 }; };
function drawToast(dt) {
  if (!toast) return;
  toast.t += dt;
  const a = Math.min(1, toast.t * 6, (toast.secs - toast.t) * 4);
  if (toast.t > toast.secs) { toast = null; return; }
  const w = Math.ceil(G.tw(toast.text, 'sm')) + 14, x = Math.round((VW - w) / 2), y = Math.round(-14 + 15 * G.ease(a));
  G.panel(x, y, w, 13, { border: C.amber, fill: C.ink });
  T(toast.text, VW / 2, y + 2, C.amber, { a: 'center' });
}

/* ================= scenes and the loop ================= */
let cur = null, curName = '', next = null, fade = 1, fadeDir = -1;
G.scene = () => curName;
G.go = function (name, args) {
  if (next) return;
  next = { name, args }; fadeDir = 1;
};
function swap() {
  if (cur && cur.leave) cur.leave();
  curName = next.name; cur = G.scenes[curName];
  cur.enter(next.args || {});
  next = null;
  if (G.book) G.book.sync();
}
let last = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  G.t += dt;
  Object.keys(queued).forEach(k => { hit[k] = true; delete queued[k]; });
  ['left', 'right', 'up', 'down'].forEach(k => {
    if (down[k]) { held[k] = (held[k] || 0) + dt; held[k + '_t'] = (held[k + '_t'] || 0) + dt; held[k + '_r'] = false; if (held[k + '_t'] > 0.06) { held[k + '_t'] = 0; held[k + '_r'] = true; } }
  });
  if (fadeDir === 1) {
    fade += dt * 5;
    if (fade >= 1) { fade = 1; swap(); fadeDir = -1; }
  } else if (fadeDir === -1) {
    fade -= dt * 4;
    if (fade <= 0) { fade = 0; fadeDir = 0; }
  }
  if (cur) {
    if (fadeDir !== 1) cur.update(dt);
    cur.draw();
  }
  drawToast(dt);
  if (fade > 0) { ctx.globalAlpha = Math.min(1, fade); R(0, 0, VW, VH, C.ink); ctx.globalAlpha = 1; }
  Object.keys(hit).forEach(k => { delete hit[k]; });
  ptr.pressed = false; ptr.released = false;
  /* a finger that has left the screen is not hovering over anything */
  if (ptr.lift) { ptr.lift = false; ptr.x = -1; ptr.y = -1; }
  requestAnimationFrame(frame);
}
G.start = function (first) {
  next = { name: first, args: {} }; swap(); fade = 1; fadeDir = -1;
  requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
};
})();
