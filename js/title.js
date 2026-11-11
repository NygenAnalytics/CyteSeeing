/* Title screen. The logo is built from cells, a few of which drop out at any moment,
   and cells rain down into a count matrix that is mostly zeros. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;

const GLYPH = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'], B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'], D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'], H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'], J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'], L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'], N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'], P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'], R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'], T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'], V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'], X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'], Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
};
const WORD = G.NAME.toUpperCase().replace(/[^A-Z]/g, '');
/* long names get smaller cells so the logo always fits the screen */
const PITCH = [6, 5, 4].find(p => p * (6 * WORD.length - 1) <= 312) || 4, LX = Math.round((VW - (WORD.length * 5 * PITCH + (WORD.length - 1) * PITCH)) / 2), LY = 22;
const TAGS = [
  'NO CELLS WERE HARMED. MANY WERE LYSED.', 'NOW WITH 90% MORE ZEROS.', 'BATCH EFFECTS SOLD SEPARATELY.',
  'PEER REVIEWED BY NOBODY. YET.', 'A UMAP IS A MAP, NOT A RESULT.', 'DOUBLETS INCLUDED AT NO EXTRA COST.',
];
const COLS = 35, ROWS = 4, MX = 3, MY = 138, CW = 9, CH = 10;

let rain = [], matrix = [], rnd = G.rng(11), t0 = 0;

function hash(i, k) { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }

G.scenes.title = {
  enter() {
    t0 = G.t; rain = []; matrix = [];
    for (let i = 0; i < COLS * ROWS; i++) matrix.push({ v: rnd() < 0.16 ? 1 + Math.floor(rnd() * 3) : 0, flash: 0 });
    for (let i = 0; i < 26; i++) rain.push(newDrop(true));
    G.book.show({
      floor: 'Lab notebook', room: 'Day one',
      goals: [{ id: 'start', text: 'Press Space, or click the screen, to start.' }],
      notes: [{ id: 'how', open: true, html: 'Walk the corridor, step into a room, and play the analysis step that lives there. Your choices follow you from room to room.' },
              { id: 'who', open: true, html: 'Made for people who learn single-cell analysis by doing: students, clinicians, postdocs. No install, no data to download.' }],
      term: null,
    });
  },
  update(dt) {
    rain.forEach(d => {
      d.y += d.v * dt;
      if (d.y > MY - 6) {
        const col = G.clamp(Math.floor((d.x - MX) / CW), 0, COLS - 1);
        const m = matrix[Math.floor(rnd() * ROWS) * COLS + col];
        m.v = Math.min(9, m.v + 1); m.flash = 1;
        Object.assign(d, newDrop(false));
      }
    });
    matrix.forEach(m => { m.flash = Math.max(0, m.flash - dt * 1.6); });
    /* counts decay back to zero now and then, so the matrix stays sparse */
    if (rnd() < dt * 9) { const m = matrix[Math.floor(rnd() * matrix.length)]; if (m.v > 0) m.v--; }
    if (G.t - t0 > 0.4 && (G.hit('a') || G.ptr.pressed)) { G.sfx('ok'); G.go('corridor'); }
  },
  draw() {
    const bands = ['#0b1226', '#0d1630', '#101b3a', '#132045', '#16254f'];
    bands.forEach((c, i) => R(0, i * 28, VW, 28, c));
    R(0, 140, VW, 40, C.ink);

    rain.forEach(d => G.cell(d.x, d.y, d.c, d.s));

    /* the logo: every block is a cell; dropped ones show as empty sockets */
    const tick = Math.floor(G.t / 0.55);
    let n = 0;
    for (let li = 0; li < WORD.length; li++) {
      /* a Cyte name reads as two words, so it gets two colours; anything else cycles the cell-type colours */
      const g = GLYPH[WORD[li]], col = WORD.indexOf('CYTE') === 0 ? (li < 4 ? C.cyan : C.amber) : G.TYPES[li % G.TYPES.length];
      for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) {
        if (g[j][i] !== '1') continue;
        n++;
        const x = LX + li * 6 * PITCH + i * PITCH, y = LY + j * PITCH;
        const out = !G.reduced && hash(n, tick) < 0.07;
        if (out) { R(x + 1, y + 1, PITCH - 3, PITCH - 3, C.slate); }
        else { R(x + 1, y + PITCH, PITCH - 2, 1, 'rgba(0,0,0,.35)'); G.cell(x, y, col, PITCH - 1); }
      }
    }
    T('A SINGLE-CELL ANALYSIS ADVENTURE', VW / 2, LY + 7 * PITCH + 5, C.fog, { a: 'center', sh: C.ink });

    /* menu */
    G.panel(102, 80, 116, 28, { border: C.fog, fill: 'rgba(8,12,26,.92)' });
    const label = G.hasProgress() ? 'CONTINUE' : 'START';
    if (Math.floor(G.t * 2.5) % 2 === 0) T('>', 118, 86, C.amber, { f: 'smb' });
    T(label, 128, 86, C.white, { f: 'smb' });
    T('SPACE OR CLICK', 128, 96, C.steel);
    T(TAGS[Math.floor((G.t - t0) / 3.5) % TAGS.length], VW / 2, 114, C.mist, { a: 'center', sh: C.ink });

    /* the count matrix */
    T('COUNT MATRIX: MOSTLY ZEROS', MX + 1, MY - 11, C.steel);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const m = matrix[r * COLS + c];
      T(String(m.v), MX + c * CW, MY + r * CH, m.flash > 0 ? C.amber : m.v > 0 ? C.cyan : C.slate);
    }
  },
};

function newDrop(anywhere) {
  return {
    x: MX + Math.floor(rnd() * COLS) * CW + 1, y: anywhere ? rnd() * 130 - 10 : -8 - rnd() * 40,
    v: 14 + rnd() * 22, s: rnd() < 0.3 ? 4 : 5, c: G.TYPES[Math.floor(rnd() * G.TYPES.length)],
  };
}
})();
