/* The request sheet: what the player would like to see next. It hangs in two places, the request
   board on the map and the request slip in arrivals, and is the same sheet in both.
   A tick is counted once, as an anonymous play statistic (js/engine/stats.js), and kept in the
   profile so that it is still ticked on the next visit. Anything that is not on the sheet goes to
   GitHub, as before. Where nothing is counted (a fork, a local copy, a browser that blocks the
   counter) there is no sheet: G.requests.sheet returns null, and whoever asked puts the question
   about GitHub instead.
   To offer other things, change G.REQUESTS: [what is counted, what the sheet says]. */
(function () {
'use strict';
const { R, T, C, VW } = G;
G.REQUESTS = [
  { kind: 'tissue', head: 'A TISSUE', items: [['tumour', 'A TUMOUR'], ['bone marrow', 'BONE MARROW'], ['gut', 'GUT'], ['lung', 'LUNG'], ['skin', 'SKIN']] },
  { kind: 'data', head: 'A KIND OF DATA', items: [['spatial', 'SPATIAL'], ['chromatin', 'CHROMATIN (ATAC)'], ['surface proteins', 'SURFACE PROTEINS'], ['perturbations', 'PERTURBATIONS']] },
];
const PX = 8, PY = 16, PW = 304, PH = 160, COLX = [16, 164], ROWW = 140, ROWH = 12, ROW0 = 58, PITCH = 14, BY = 152;
const BTN = [{ x: 16, w: 176, label: 'SOMETHING ELSE: OPEN GITHUB' }, { x: 200, w: 104, label: 'DONE' }];
const asked = () => (G.profile.asked || (G.profile.asked = {}));
const github = () => {
  try { window.open(G.REPO + '/issues/new?title=' + encodeURIComponent('Request: a cell system or a scenario'), '_blank', 'noopener'); } catch (e) {}
  G.toast('IF NOTHING OPENED, THE LINK IS IN THE NOTEBOOK.', 4);
};

/* a sheet to put in front of the player: { update(), draw() }, and close() is called when it is put away */
function sheet(from, close) {
  if (!G.track || !G.track.on()) return null;
  const cols = G.REQUESTS, n = cols.map(c => c.items.length);
  /* where the marker is: a column and a row, or the row of buttons under the columns */
  let col = 0, row = 0, foot = -1, fresh = 0, down = null, flash = null;
  const rect = (c, r) => [COLX[c], ROW0 + r * PITCH, ROWW, ROWH];
  function done() {
    if (fresh) G.toast(fresh === 1 ? 'ONE REQUEST COUNTED. THANK YOU.' : fresh + ' REQUESTS COUNTED. THANK YOU.', 4);
    close();
  }
  function tick(c, r) {
    const it = cols[c].items[r], a = asked();
    col = c; row = r; foot = -1;
    if (a[it[0]]) { G.sfx('tick'); return; }
    a[it[0]] = true; fresh++; flash = { c, r, t: G.t };
    G.save(); G.sfx('star');
    G.track('request_picked', { choice: it[0], kind: cols[c].kind, from });
  }
  function press(k) {
    if (k === 0) { G.track('request_github', { from }); close(); github(); } else done();
  }
  function move(dx, dy) {
    if (foot >= 0) { if (dy < 0) { col = Math.min(foot, cols.length - 1); row = n[col] - 1; foot = -1; } else if (dx) foot = G.clamp(foot + dx, 0, BTN.length - 1); }
    else if (dy) { if (row + dy < 0) row = 0; else if (row + dy >= n[col]) foot = Math.min(col, BTN.length - 1); else row += dy; }
    else if (dx) { col = G.clamp(col + dx, 0, cols.length - 1); row = Math.min(row, n[col] - 1); }
    G.sfx('tick');
  }
  /* a tap counts where the finger went down and came up on the same thing */
  function tapped(id, x, y, w, h) {
    const over = G.over(x, y, w, h);
    if (over && G.ptr.pressed) down = id;
    if (down === id && G.ptr.released) { down = null; return over; }
    return false;
  }
  return {
    /* for the tests: where everything is, and what is ticked */
    dbg: { rows: () => cols.map((c, ci) => c.items.map((it, ri) => ({ id: it[0], kind: c.kind, at: [COLX[ci] + ROWW / 2, ROW0 + ri * PITCH + ROWH / 2], ticked: !!asked()[it[0]] }))), buttons: () => BTN.map(b => [b.x + b.w / 2, BY + 7]), marker: () => (foot >= 0 ? 'button ' + foot : cols[col].items[row][0]) },
    update() {
      if (G.hit('b')) { done(); return; }
      if (G.hit('up')) move(0, -1); else if (G.hit('down')) move(0, 1); else if (G.hit('left')) move(-1, 0); else if (G.hit('right')) move(1, 0);
      if (G.hit('a')) { if (foot >= 0) press(foot); else tick(col, row); }
    },
    draw() {
      R(0, 13, VW, 167, 'rgba(8,12,26,.72)');
      G.panel(PX, PY, PW, PH, { border: C.amber, fill: C.ink });
      T('WHAT SHOULD COME NEXT?', PX + 8, PY + 5, C.amber, { f: 'smb' });
      T('TICK AS MANY AS YOU LIKE.', PX + 8, PY + 16, C.fog);
      cols.forEach((c, ci) => {
        T(c.head, COLX[ci] + 1, ROW0 - 12, C.mist);
        c.items.forEach((it, ri) => {
          const [x, y, w, h] = rect(ci, ri), on = !!asked()[it[0]], here = foot < 0 && col === ci && row === ri, over = G.over(x, y, w, h);
          if (tapped('rq' + ci + '-' + ri, x, y, w, h)) tick(ci, ri);
          G.panel(x, y, w, h, { border: here || over ? C.cyan : C.slate, fill: on ? '#12302a' : C.night });
          /* the box, and the tick in it */
          R(x + 3, y + 2, 8, 8, on ? C.mint : C.steel); R(x + 4, y + 3, 6, 6, on ? '#12302a' : C.ink);
          if (on) { R(x + 5, y + 6, 1, 2, C.mint); R(x + 6, y + 7, 1, 1, C.mint); R(x + 7, y + 6, 1, 1, C.mint); R(x + 8, y + 5, 1, 1, C.mint); R(x + 9, y + 4, 1, 1, C.mint); }
          T(it[1], x + 16, y + 2, on ? C.mint : C.white);
          if (flash && flash.c === ci && flash.r === ri && G.t - flash.t < 0.35) R(x + 1, y + 1, w - 2, h - 2, 'rgba(123,224,161,.25)');
        });
      });
      T('A TICK IS COUNTED ONCE. NO NAME GOES WITH IT.', PX + 8, BY - 13, C.steel);
      BTN.forEach((b, k) => { if (G.button('rq-b' + k, b.x, BY, b.w, 15, b.label, { focus: foot === k, primary: k === 1 })) press(k); });
    },
  };
}
G.requests = { sheet, github };
})();
