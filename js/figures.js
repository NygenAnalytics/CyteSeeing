/* Figures: pixel-art "scientific images" that open when you poke things in the corridor.
   Each one is drawn in code and comes with a caption that is true, and a little unkind. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const X = 24, Y = 28, W = 272, H = 96;
const hash = (a, b, c) => { const v = Math.sin(a * 127.1 + b * 311.7 + (c || 0) * 74.7) * 43758.5453; return v - Math.floor(v); };

const FIGS = G.FIGS = {
  umap: {
    title: 'FIG. 1   A MAP, NOT A RESULT',
    cap: '2,700 blood cells on a map. The islands are real. The distances between them are mostly decoration.',
    draw(t) {
      const rnd = G.rng(3);
      [{ x: 70, y: 34, c: C.cyan, n: 46, sx: 22, sy: 11, l: 'T CELLS' }, { x: 150, y: 22, c: C.lilac, n: 26, sx: 12, sy: 8, l: 'B CELLS' },
        { x: 204, y: 56, c: C.amber, n: 40, sx: 18, sy: 12, l: 'MONOCYTES' }, { x: 112, y: 68, c: C.mint, n: 22, sx: 11, sy: 7, l: 'NK' },
        { x: 248, y: 20, c: C.pink, n: 8, sx: 5, sy: 4, l: '???' }].forEach(k => {
        for (let i = 0; i < k.n; i++) {
          const a = rnd() * 6.283, r = Math.sqrt(rnd());
          R(X + k.x + Math.cos(a) * r * k.sx + Math.sin(t * 1.3 + i) * 0.7, Y + k.y + Math.sin(a) * r * k.sy + Math.cos(t * 1.1 + i * 2) * 0.7, 2, 2, k.c);
        }
        T(k.l, X + k.x, Y + k.y + k.sy + 3, k.c, { a: 'center' });
      });
      R(X + 8, Y + H - 9, 26, 1, C.steel); R(X + 8, Y + H - 35, 1, 26, C.steel);
      T('UMAP 1', X + 38, Y + H - 13, C.steel); T('UMAP 2', X + 4, Y + H - 46, C.steel);
    },
  },
  smoothie: {
    title: 'FIG. 2   THE FRUIT ANALOGY',
    cap: 'Bulk RNA-seq is a smoothie. Single-cell is a fruit salad. Same fruit, but now you can find the one bad grape.',
    draw(t) {
      /* the blender */
      R(X + 46, Y + 8, 42, 5, C.steel); R(X + 49, Y + 13, 36, 52, C.fog); R(X + 51, Y + 15, 32, 48, '#0e1630');
      R(X + 51, Y + 30, 32, 33, '#7a566c'); R(X + 51, Y + 30, 32, 2, '#96708a');
      for (let i = 0; i < 5; i++) { const by = 60 - ((t * 14 + i * 9) % 28); R(X + 55 + i * 6, Y + by, 2, 2, 'rgba(255,255,255,.4)'); }
      R(X + 44, Y + 65, 46, 13, C.slate); R(X + 62, Y + 69, 10, 5, C.amber);
      T('BULK RNA-SEQ', X + 67, Y + 83, C.mist, { a: 'center' });
      T('VS', X + 136, Y + 36, C.amber, { a: 'center', f: 'lg' });
      /* the bowl */
      const fruit = [[184, 38, C.cyan, 8], [195, 33, C.lilac, 8], [206, 39, C.amber, 8], [217, 32, C.mint, 8], [227, 39, C.pink, 8], [190, 44, C.amber, 7], [212, 45, C.cyan, 7], [222, 46, C.lilac, 7], [201, 27, C.pink, 6]];
      fruit.forEach((f, i) => G.cell(X + f[0], Y + f[1] + Math.round(Math.sin(t * 2 + i) * 0.6), f[2], f[3]));
      G.cell(X + 200, Y + 46, '#6b7a3a', 8);
      if (Math.floor(t * 3) % 2 === 0) G.ring(X + 204, Y + 50, 7, C.coral);
      R(X + 176, Y + 52, 66, 3, C.fog);
      for (let i = 0; i < 14; i++) R(X + 178 + i, Y + 55 + i, 62 - i * 2, 1, i % 4 === 3 ? '#aab6cf' : '#c9d3e8');
      R(X + 198, Y + 69, 22, 3, '#aab6cf');
      T('SINGLE-CELL', X + 209, Y + 83, C.mist, { a: 'center' });
    },
  },
  scope: {
    title: 'FIG. 3   COUNTING DAY',
    cap: 'Trypan blue: 92% viable. The other 8% are planning to become your mitochondrial cluster.',
    draw(t) {
      const cx = X + 66, cy = Y + 48, r = 44;
      G.disc(cx, cy, r + 3, '#33415f'); G.disc(cx, cy, r, '#d3e8e3');
      for (let d = -42; d <= 42; d += 14) {
        const hc = Math.floor(Math.sqrt(r * r - d * d));
        R(cx + d, cy - hc, 1, hc * 2, '#a8c9c4'); R(cx - hc, cy + d, hc * 2, 1, '#a8c9c4');
      }
      const rnd = G.rng(9);
      for (let i = 0; i < 20; i++) {
        const a = rnd() * 6.283, rr = Math.sqrt(rnd()) * 36, dead = i % 9 === 4;
        const px = cx + Math.cos(a) * rr + Math.sin(t * 0.6 + i) * 1.5, py = cy + Math.sin(a) * rr + Math.cos(t * 0.5 + i * 3) * 1.5;
        if (dead) G.disc(px, py, 3, '#3a66b8'); else { G.disc(px, py, 3, '#f4fbf9'); G.ring(px, py, 3, '#58808a'); }
      }
      /* one cell dividing, on a loop, because cells do not care that you are counting */
      const ph = (t % 6) / 6, sep = Math.min(4, ph * 7);
      G.disc(cx - 8 - sep, cy + 18, 3, '#f4fbf9'); G.ring(cx - 8 - sep, cy + 18, 3, '#58808a');
      G.disc(cx - 8 + sep, cy + 18, 3, '#f4fbf9'); G.ring(cx - 8 + sep, cy + 18, 3, '#58808a');
      T('HAEMOCYTOMETER', X + 132, Y + 14, C.mist);
      T('LIVE', X + 132, Y + 32, C.mint); T('46', X + 236, Y + 32, C.mint, { a: 'right', f: 'smb' });
      T('DEAD', X + 132, Y + 44, '#7ba3f5'); T('4', X + 236, Y + 44, '#7ba3f5', { a: 'right', f: 'smb' });
      R(X + 132, Y + 56, 104, 1, C.slate);
      T('VIABILITY', X + 132, Y + 61, C.white); T('92%', X + 236, Y + 61, C.white, { a: 'right', f: 'smb' });
      T('COUNTED TWICE.', X + 132, Y + 78, C.steel); T('TRUSTED ONCE.', X + 132, Y + 87, C.steel);
    },
  },
  flowcell: {
    title: 'FIG. 4   SEQUENCING BY SYNTHESIS',
    cap: 'Each spot is one fragment, copied into a cluster. One flash, one base. Repeat a few hundred million times.',
    draw(t) {
      const cyc = Math.floor(t * 2.2), fl = (t * 2.2) % 1, base = [C.mint, C.cyan, C.amber, C.coral], dim = ['#27543d', '#1c5360', '#5e4720', '#5c2826'], L = 'ACGT';
      R(X + 8, Y + 6, W - 16, 56, C.slate); R(X + 9, Y + 7, W - 18, 54, '#070b18');
      for (let j = 0; j < 6; j++) for (let i = 0; i < 31; i++) {
        const b = Math.floor(hash(i, j, cyc) * 4), px = X + 16 + i * 8, py = Y + 13 + j * 8;
        G.disc(px, py, 2, fl < 0.45 ? base[b] : dim[b]);
      }
      G.ring(X + 16 + 12 * 8, Y + 13 + 3 * 8, 4, C.white);
      let read = '';
      for (let k = Math.max(0, cyc - 21); k <= cyc; k++) read += L[Math.floor(hash(12, 3, k) * 4)];
      T('CYCLE ' + String(cyc % 150 + 1).padStart(3, '0'), X + 10, Y + 68, C.white, { f: 'smb' });
      for (let b = 0; b < 4; b++) { R(X + 100 + b * 30, Y + 69, 6, 6, base[b]); T(L[b], X + 109 + b * 30, Y + 68, base[b], { f: 'smb' }); }
      T('READ  ' + read, X + 10, Y + 82, C.fog);
    },
  },
  trace: {
    title: 'FIG. 5   THE cDNA TRACE',
    cap: 'One broad hump: good. A sharp spike near 100 bp: primer dimers, and a long afternoon.',
    draw(t) {
      const x0 = X + 22, x1 = X + W - 14, by = Y + 76, f = u => {
        const g = (c, w) => Math.exp(-((u - c) * (u - c)) / (2 * w * w));
        return 0.78 * g(0.06, 0.008) + 0.62 * g(0.94, 0.008) + 0.52 * g(0.55 + 0.05 * (u > 0.55 ? 1 : 0), 0.12) + 0.012 * Math.sin(u * 90);
      };
      R(x0, by, x1 - x0, 1, C.steel); R(x0, Y + 8, 1, by - Y - 8, C.steel);
      const sweep = G.reduced ? 1 : Math.min(1, (t % 7) / 2.6);
      let px = x0, py = by;
      for (let x = x0; x <= x0 + (x1 - x0) * sweep; x++) {
        const u = (x - x0) / (x1 - x0), y = by - Math.round(f(u) * 64);
        if (u > 0.2 && u < 0.88) R(x, y, 1, by - y, 'rgba(123,224,161,.12)');
        G.line(px, py, x, y, C.mint); px = x; py = y;
      }
      [['35', 0.06], ['100', 0.2], ['300', 0.33], ['1000', 0.5], ['3000', 0.68], ['10K', 0.94]].forEach(k => {
        const tx = x0 + (x1 - x0) * k[1]; R(tx, by, 1, 3, C.steel); T(k[0], tx, by + 5, C.steel, { a: 'center' });
      });
      T('FU', X + 5, Y + 8, C.steel); T('BP', x1 + 2, by + 5, C.steel);
      if (sweep >= 1) { T('MARKER', x0 + 16, Y + 12, C.steel); T('YOUR cDNA', x0 + (x1 - x0) * 0.56, Y + 24, C.mint, { a: 'center' }); T('MARKER', x1 - 12, Y + 20, C.steel, { a: 'right' }); }
    },
  },
  matrix: {
    title: 'FIG. 6   THE COUNT MATRIX',
    cap: 'Mostly zeros: each cell shows a small part of what it expresses. ACTB did not get the memo.',
    draw(t) {
      const genes = ['ACTB', 'CD3E', 'LYZ', 'MS4A1', 'NKG7', 'CD14', 'IL7R', 'GNLY'], rnd = G.rng(21), cols = 26, shade = ['#16224a', C.teal, C.cyan, C.fog, C.white];
      let zeros = 0;
      const scan = Math.floor(t * 5) % (cols + 6);
      genes.forEach((g, j) => {
        T(g, X + 50, Y + 8 + j * 9, j === 0 ? C.amber : C.mist, { a: 'right' });
        for (let i = 0; i < cols; i++) {
          let v = j === 0 ? 2 + Math.floor(rnd() * 3) : (rnd() < 0.86 ? 0 : 1 + Math.floor(rnd() * 3));
          if (!v) zeros++;
          R(X + 56 + i * 8, Y + 8 + j * 9, 7, 8, i === scan ? (v ? C.amber : '#2a3966') : shade[v]);
        }
      });
      T('26 OF YOUR CELLS  >', X + 56, Y + 83, C.steel);
      T('ZEROS ' + Math.round(100 * zeros / (genes.length * cols)) + '%', X + W - 6, Y + 83, C.white, { a: 'right', f: 'smb' });
    },
  },
  volcano: {
    title: 'FIG. 7   THE VOLCANO',
    cap: 'Ten thousand cells are not ten thousand replicates. Test donors, not cells. Reviewer 2 knows.',
    draw(t) {
      const cx = X + W / 2, by = Y + 80, rnd = G.rng(33);
      R(X + 30, by, W - 60, 1, C.steel); R(X + 30, Y + 6, 1, by - Y - 6, C.steel);
      G.hdash(X + 30, X + W - 30, by - 22, C.slate); G.vdash(cx - 30, Y + 6, by, C.slate); G.vdash(cx + 30, Y + 6, by, C.slate);
      for (let i = 0; i < 300; i++) {
        let u = 0; for (let k = 0; k < 4; k++) u += rnd(); const lfc = (u - 2) * 2.1;
        const yv = Math.min(72, Math.pow(Math.abs(lfc), 1.7) * (0.5 + rnd() * 1.3) * 9 + rnd() * 6);
        const sig = Math.abs(lfc) > 1 && yv > 22, px = cx + lfc * 30, tw = sig && Math.floor(t * 3 + i) % 9 === 0;
        if (px < X + 32 || px > X + W - 32) continue;
        R(px, by - yv - 1, tw ? 3 : 2, tw ? 3 : 2, sig ? (lfc > 0 ? C.coral : C.cyan) : '#4a5b86');
      }
      T('ISG15', cx + 62, Y + 8, C.coral); T('IFI6', cx + 84, Y + 22, C.coral);
      T('-LOG10 P', X + 34, Y + 6, C.steel); T('LOG2 FOLD CHANGE', cx, by + 5, C.steel, { a: 'center' });
      T('DOWN', X + 36, by - 12, C.cyan); T('UP', X + W - 36, by - 12, C.coral, { a: 'right' });
    },
  },
  gel: {
    title: 'FIG. 8   A GEL, KEPT FOR SENTIMENTAL REASONS',
    cap: 'An agarose gel from 2011. Lane 4 is a smear. Nobody talks about lane 4.',
    draw(t) {
      const gx = X + 40, gw = W - 80, glow = Math.floor(t * 9) % 11 === 0 ? '#1f1838' : '#1a1430';
      R(gx, Y + 4, gw, H - 8, '#2a2150'); R(gx + 1, Y + 5, gw - 2, H - 10, glow);
      const names = ['L', '1', '2', '3', '4', '5', '6', 'NTC'], band = '#ffb37c', faint = '#b9744f';
      const lanes = [[14, 22, 30, 39, 49, 60, 72], [34], [34, 58], [33], null, [35], [34, 46], []];
      names.forEach((n, i) => {
        const lx = gx + 12 + i * 23;
        T(n, lx + 7, Y + 7, C.steel, { a: 'center' });
        R(lx, Y + 17, 14, 3, '#0b0817');
        if (lanes[i] === null) { for (let y = 24; y < 82; y++) R(lx + 1, Y + y, 12, 1, 'rgba(255,179,124,' + (0.42 - (y - 24) * 0.006).toFixed(3) + ')'); return; }
        lanes[i].forEach((b, k) => { R(lx, Y + 14 + b, 14, i === 0 ? 2 : 3, i === 0 ? faint : band); if (i && !k) R(lx + 1, Y + 14 + b - 1, 12, 1, 'rgba(255,179,124,.35)'); });
      });
      T('?', gx + 12 + 4 * 23 + 7, Y + 84, C.coral, { a: 'center', f: 'smb' });
    },
  },
  dogma: {
    title: 'FIG. 9   THE CENTRAL DOGMA, EXTENDED',
    cap: 'DNA makes RNA makes protein makes papers makes grants makes more sequencing.',
    draw(t) {
      const ink = '#1b2340', red = '#d2453f';
      R(X + 6, Y + 2, W - 12, H - 6, '#9aa6c2'); R(X + 8, Y + 4, W - 16, H - 10, '#eef1f6');
      const box = (x, y, s, w) => { R(x, y, w, 15, ink); R(x + 1, y + 1, w - 2, 13, '#eef1f6'); T(s, x + w / 2, y + 3, ink, { a: 'center', f: 'smb' }); };
      const arrow = (x0, y0, x1, y1) => { G.line(x0, y0, x1, y1, red); const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0); if (dx) { R(x1 - dx * 3, y1 - 2, 1, 5, red); R(x1 - dx * 2, y1 - 1, 1, 3, red); } else { R(x1 - 2, y1 - dy * 3, 5, 1, red); R(x1 - 1, y1 - dy * 2, 3, 1, red); } };
      box(X + 24, Y + 14, 'DNA', 38); box(X + 106, Y + 14, 'RNA', 38); box(X + 188, Y + 14, 'PROTEIN', 62);
      arrow(X + 64, Y + 21, X + 104, Y + 21); arrow(X + 146, Y + 21, X + 186, Y + 21);
      box(X + 194, Y + 56, 'PAPER', 50); box(X + 100, Y + 56, 'GRANT', 50);
      arrow(X + 219, Y + 31, X + 219, Y + 54); arrow(X + 192, Y + 63, X + 152, Y + 63);
      G.line(X + 98, Y + 63, X + 43, Y + 63, red); arrow(X + 43, Y + 63, X + 43, Y + 31);
      T('MORE SEQUENCING', X + 48, Y + 44, red);
      /* a helix doodle and the oldest joke on any whiteboard */
      for (let i = 0; i < 9; i++) { const s = Math.sin(i * 0.9 + t * 2); R(X + 16 + s * 3, Y + 34 + i * 2, 1, 1, ink); R(X + 16 - s * 3, Y + 34 + i * 2, 1, 1, red); }
      T('DO NOT ERASE (2019)', X + W - 14, Y + 78, '#7a86a6', { a: 'right' });
    },
  },
};

FIGS.elbow = {
  title: 'FIG. 10   THE ELBOW',
  cap: 'A scree plot. The elbow is where extra components stop adding much. People tend to find it wherever they need it.',
  draw(t) {
    const h = [40, 21, 8, 6, 4, 3, 3, 2, 2, 2, 1, 1], x0 = X + 62, by = Y + 78;
    R(x0 - 6, by, 188, 1, C.steel); R(x0 - 6, Y + 8, 1, by - Y - 8, C.steel);
    h.forEach((v, i) => { R(x0 + i * 15, by - v * 1.6, 11, v * 1.6, i < 4 ? C.teal : '#4a5b86'); T(String(i + 1), x0 + i * 15 + 5, by + 3, C.steel, { a: 'center' }); });
    T('VARIANCE', X + 6, Y + 8, C.steel); T('COMPONENT', x0 + 84, by + 12, C.steel, { a: 'center' });
    /* three people, three elbows */
    [[2, 'HERE'], [4, 'NO, HERE'], [7, 'SURELY HERE']].forEach((e, i) => {
      if (Math.floor(t * 0.8) % 3 !== i && !G.reduced) return;
      const ex = x0 + e[0] * 15 + 5, ey = by - h[e[0]] * 1.6 - 6;
      R(ex, ey - 12, 1, 12, C.amber); R(ex - 2, ey - 3, 5, 1, C.amber); R(ex - 1, ey - 2, 3, 1, C.amber);
      T(e[1], ex + 4, ey - 20, C.amber);
    });
  },
};

/* the overlay: a framed figure with a caption. t is seconds since it opened. */
G.drawFigure = function (id, t) {
  const f = FIGS[id];
  R(0, 0, VW, VH, 'rgba(6,9,20,.82)');
  G.panel(14, 8, 292, 164, { border: C.fog, fill: C.ink });
  T(f.title, 24, 14, C.amber, { f: 'smb' });
  R(X - 1, Y - 1, W + 2, H + 2, C.slate); R(X, Y, W, H, '#0e1630');
  f.draw(t);
  G.wrap(f.cap, W, 'md').slice(0, 3).forEach((l, i) => T(l, X, Y + H + 3 + i * 12, C.paper, { f: 'md' }));
  if (t > 0.5 && Math.floor(G.t * 2.5) % 2 === 0) T('>', 296, 160, C.cyan);
};
})();
