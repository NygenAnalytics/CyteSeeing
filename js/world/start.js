/* The badge printer in arrivals: the player's name goes on a badge, and the characters use it from
   then on. Nobody has to come here: a player who never does is called Ari.
   Letters can be typed, or picked from the grid with the arrow keys or a finger. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(['DEL', 'OK']), COLSN = 7, MAX = 8;
const GX = 150, GY = 58, CW = 22, CH = 20;
const HERO = { skin: C.skin1, hair: '#3a2a22', style: 'short', coat: C.paper, shirt: C.cyan, pants: '#2c3a5e', shoes: C.ink };

let name, cur, t0, out;

function press(k) {
  if (out) return;
  if (k === 'OK') { finish(); return; }
  if (k === 'DEL') { name = name.slice(0, -1); G.sfx('tick'); return; }
  if (name.length < MAX) { name += k; G.sfx('blip'); } else G.sfx('bad');
}
function finish() {
  G.profile.name = name || 'ARI'; G.save(); G.sfx('star'); out = G.t;
}
/* typing: letters, backspace and enter go straight to the badge */
function typed(e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return false;
  if (/^[a-zA-Z]$/.test(e.key)) { press(e.key.toUpperCase()); return true; }
  if (e.key === 'Backspace') { press('DEL'); return true; }
  if (e.key === 'Enter') { press('OK'); return true; }
  return false;
}

G.scenes.start = {
  dbg: { name: () => name, set: s => { name = s; }, ok: () => finish() },
  enter() {
    name = G.profile.name || ''; cur = 0; t0 = G.t; out = 0; G.rawKey = typed;
    G.book.show({
      floor: 'Arrivals', room: 'Your badge', aim: 'Put a name on your badge.',
      goals: [{ id: 'n', text: 'Type a name, or leave it empty to be called Ari' }],
      notes: [{ id: 'g-why', open: true, html: 'The people you meet will use this name. It is kept in this browser and nowhere else.' }],
      term: null,
    });
  },
  leave() { G.rawKey = null; },
  update() {
    if (out) { if (G.t - out > 0.9) G.go('corridor', { floor: 'bay', from: 'badge' }); return; }
    const n = KEYS.length;
    if (G.hit('right')) { cur = (cur + 1) % n; G.sfx('tick'); }
    if (G.hit('left')) { cur = (cur + n - 1) % n; G.sfx('tick'); }
    if (G.hit('down')) { cur = Math.min(n - 1, cur + COLSN); G.sfx('tick'); }
    if (G.hit('up')) { cur = Math.max(0, cur - COLSN); G.sfx('tick'); }
    if (G.hit('a') && G.t - t0 > 0.3) press(KEYS[cur]);
    if (G.ptr.pressed) KEYS.forEach((k, i) => { const x = GX + (i % COLSN) * CW, y = GY + Math.floor(i / COLSN) * CH; if (G.over(x, y, CW - 2, CH - 2)) { cur = i; press(k); } });
  },
  draw() {
    R(0, 0, VW, VH, '#0b1022');
    R(0, 0, VW, 11, 'rgba(8,12,26,.92)'); T('ARRIVALS', 5, 1, C.amber);
    T('YOUR BADGE', GX, 22, C.white, { f: 'lg' }); T(G.kt('TYPE A NAME, THEN ENTER', 'TAP THE LETTERS, THEN OK'), GX, 42, C.steel);
    /* the badge: a face, a name, a job */
    const bx = 24, by = 34 - (out ? Math.round(Math.min(1, (G.t - out) * 3) * 6) : 0);
    R(bx + 3, by + 3, 104, 112, 'rgba(0,0,0,.45)'); R(bx, by, 104, 112, C.paper); R(bx, by, 104, 18, C.teal); T('VISITOR', bx + 52, by + 5, C.white, { a: 'center', f: 'smb' });
    R(bx + 44, by - 6, 16, 9, '#8f8a7c'); R(bx + 48, by - 3, 8, 3, '#0b1022');
    R(bx + 34, by + 26, 36, 40, '#dfe8f2'); G.person(bx + 52, by + 62, HERO, { dir: 1, t: 0 });
    const shown = name || 'ARI', blink = !out && Math.floor(G.t * 2.5) % 2 === 0;
    T(shown, bx + 52, by + 74, name ? C.ink : '#a8a294', { a: 'center', f: 'lg' });
    if (blink && name.length < MAX) R(bx + 52 + Math.ceil(G.tw(shown, 'lg') / 2) + 2, by + 76, 2, 11, name ? C.ink : '#a8a294');
    T('POSTDOC', bx + 52, by + 96, '#6b6456', { a: 'center' });
    if (out) { T('PRINTED', GX + 76, 100, C.mint, { a: 'center', f: 'lg' }); return; }
    KEYS.forEach((k, i) => {
      const x = GX + (i % COLSN) * CW, y = GY + Math.floor(i / COLSN) * CH, on = i === cur, wide = k.length > 1;
      G.panel(x, y, CW - 2, CH - 2, { border: on ? C.cyan : C.slate, fill: k === 'OK' ? C.teal : on ? '#17224a' : C.night });
      T(k, x + (CW - 2) / 2, y + 5, on ? C.white : C.fog, { a: 'center', f: wide ? 'sm' : 'smb' });
    });
  },
};
})();
