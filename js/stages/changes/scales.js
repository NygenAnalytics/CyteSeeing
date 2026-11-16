/* Station 5-1, the Scales. A two-pan balance: responders on one pan, the other patients on the
   other, for one gene in one cell type after treatment. Every cell is a grain, so the pans hold
   more than a thousand grains and the needle swings to SURE. The player bags each donor's grains
   into one weight, the pseudobulk of that donor, and the needle then shows what twelve donors say.
   Three claims in turn: a gene only some people carry, a gene that is truly higher in responders,
   and a gene raised by the one donor who gave a very large sample.
   The needle is a Welch t-test on whatever is on the pans (see trial.weigh). */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PIVOT = [160, 44], ARM = 80, PAN = [10, 170], PANW = 140, FLOOR = 116, BAG = 0.35, SWING = 60;
const BRASS = C.oil, DULL = '#8a6c40', LIT = C.amber, DIM = ['#6a3d3b', '#39477a'], SIDE = [C.coral, '#6f8ff0'];
const TR = () => G.trial;

let phase, load, beats, say, after, ci, heaps, bagged, cur, prog, armed, onStamp, si, slips, loose, wrong, res, rsel, phi, stampT, stamped, held;
/* the pack's words: the claims, and the cells they are about */
let W, CLAIMS;

const allBagged = () => bagged.every(b => b);
const test = () => TR().weigh(ci, bagged);
/* where the needle points: how sure the scales are, from -1 (the right pan) to 1 (the left). Four orders of magnitude of p fill the dial. */
const lean = t => (t.p >= 1 ? 0 : Math.sign(t.diff) * Math.min(1, -Math.log10(Math.max(t.p, 1e-300)) / 4));
const MARK = -Math.log10(0.05) / 4;

/* ---------- the heaps ---------- */
/* every donor's cells as a stack of grains on the donor's side of the balance, and the weight the stack becomes */
function build() {
  const src = TR().heaps(ci), cols = src.map(h => G.clamp(Math.round(Math.sqrt(h.n) * 0.8), 5, 16));
  heaps = [];
  [0, 1].forEach(side => {
    const mine = src.filter(h => (h.d < TR().HALF ? 0 : 1) === side), wide = mine.reduce((s, h) => s + cols[h.d] * 2, 0) + (mine.length - 1) * 4;
    let x = PAN[side] + Math.round((PANW - wide) / 2);
    mine.forEach(h => {
      const c = cols[h.d], gx = new Int16Array(h.n), gy = new Int16Array(h.n);
      for (let i = 0; i < h.n; i++) { gx[i] = (i % c) * 2; gy[i] = Math.floor(i / c) * 2 + 2; }
      heaps[h.d] = { d: h.d, side, x, w: c * 2, h: Math.ceil(h.n / c) * 2, n: h.n, gx, gy, v: h.x, lit: h.lit, tall: 2 + Math.round(h.level * 38) };
      x += c * 2 + 4;
    });
  });
  bagged = new Array(TR().N).fill(false); cur = 0; prog = 0; armed = false; onStamp = false; si = 0; stamped = null;
}
function bag(d) {
  bagged[d] = true; prog = 0; G.sfx('drop');
  /* the cursor goes on to the next heap that is still loose; when none is left, to the stamps */
  for (let k = 1; k <= TR().N; k++) { const n = (d + k) % TR().N; if (!bagged[n]) { cur = n; return; } }
  onStamp = true; armed = false; G.sfx('ok');
}

/* ---------- the stamp ---------- */
function stamp(holds) {
  G.state.tries.scales++; G.save();
  if (!allBagged()) {
    slips++; loose = true; onStamp = false; G.sfx('bad'); lights();
    tell('That stamp is on loose grain. Each grain is a cell, and a thousand cells are not a thousand patients. Bag every heap first.', false);
    return;
  }
  const truth = TR().claim(ci).holds;
  if (holds !== truth) {
    slips++; wrong = true; G.sfx('bad'); lights();
    tell(truth ? 'With one weight per patient the needle is still past the mark. A difference between the groups looks like that.'
      : 'With one weight per patient the needle sits inside the marks. The grains agreed because so many shared a patient.', false);
    return;
  }
  stamped = holds; stampT = G.t; G.sfx('ok');
  tell(CLAIMS[ci].won, true);
}
function tell(text, next) { say = new G.Beats([{ say: text }]); after = next; phase = 'said'; }
function advance() {
  say = null;
  if (!after) { phase = 'play'; return; }
  [['c-geno'], [], ['c-mixed', 'c-power', 'c-toy']][ci].forEach(id => G.book.unlock(id));
  held[ci] = stamped;
  if (ci < CLAIMS.length - 1) { ci++; build(); phase = 'play'; sync(); return; }
  res = { stars: slips === 0 ? 3 : slips === 1 ? 2 : 1 }; phase = 'result'; rsel = 1; lights(); G.sfx('star');
}
function lights() {
  const done = phase === 'result';
  G.book.goal('bag', loose ? false : done ? true : null);
  G.book.goal('stamp', wrong ? false : done ? true : null);
}
function keep() {
  const s = G.state;
  s.weigh = Object.assign({}, s.weigh, { stamps: held.slice() });
  s.rooms.scales = { done: true, stars: Math.max(s.rooms.scales.stars, res.stars) };
  G.save(); G.go('corridor', { from: 'scales' });
}
function restart() { ci = 0; slips = 0; loose = false; wrong = false; res = null; held = []; build(); phase = 'play'; lights(); sync(); }

let lastSync;
function sync() { const key = String(ci); if (key === lastSync) return; lastSync = key; G.params.wgene = CLAIMS[ci].gene; G.book.sync(); }
function showBook() {
  const g = '<span class="p" data-b="wgene"></span>', cell = W.label;
  G.book.show({
    floor: 'The Weigh House · Station 5-1', room: 'The Scales', aim: 'Three claims about responders. Weigh each on patients, not on cells, and stamp what holds.',
    file: 'js/stages/changes/scales.js',
    goals: [
      { id: 'bag', text: 'Every claim is weighed with one weight for each patient' },
      { id: 'stamp', text: 'Every claim gets the stamp that twelve weights support' },
    ],
    notes: [
      { id: 'c-pseudo', open: true, html: 'Cells from one person share that person\'s genes, health, treatment and sample handling, so they are not independent observations. A test that counts every cell as a replicate reports p-values far smaller than the number of people can support. This is <b>pseudoreplication</b>.' },
      { id: 'c-bulk', open: true, html: 'A <b>pseudobulk</b> is one gene\'s counts summed over all the cells of one cell type in one sample. Thousands of cells become one profile per donor and cell type, and the donors are then tested with the methods made for bulk RNA-seq: edgeR, DESeq2, limma.' },
      { id: 'c-geno', html: W.geno },
      { id: 'c-mixed', html: 'Summing is not the only way to respect the donor. A mixed model keeps every cell and gives each donor a random effect. In benchmarks, pseudobulk methods and such mixed models both did better than tests that ignore the donor, such as a Wilcoxon test on cells.' },
      { id: 'c-power', html: 'More cells from a donor make that donor\'s number more precise. They do not add donors. The power to find a difference between groups of people comes from the number of people.' },
      { id: 'c-toy', html: 'In this game the needle is a Welch t-test on log-normalised values: of every cell while the grain is loose, and of twelve pseudobulks once it is bagged. Real pipelines fit a count model to the pseudobulk counts.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'Sum the raw counts of each donor\'s cells, cell type by cell type. The claim on the pans is about <b>' + g + '</b> in ' + cell + '.',
      tabs: [
        { id: 'dc', label: 'Python · decoupler', html:
          '<pre class="code"><span class="k">import</span> decoupler <span class="k">as</span> dc\n\n' +
          '<span class="c"># one profile per sample and cell type:\n# the raw counts of its cells, summed</span>\n' +
          'pb = dc.pp.<span class="k">pseudobulk</span>(\n    adata,\n    sample_col=<span class="s">"sample"</span>,\n    groups_col=<span class="s">"cell_type"</span>,\n    layer=<span class="s">"counts"</span>,\n    mode=<span class="s">"sum"</span>,\n)\n\n' +
          '<span class="c"># drop profiles made of too few cells</span>\n' +
          'dc.pp.<span class="k">filter_samples</span>(\n    pb, min_cells=10, min_counts=1000)\n\n' +
          '<span class="c"># the gene on the pans, donor by donor</span>\n' +
          'pb[pb.obs[<span class="s">"cell_type"</span>] == <span class="s">"' + cell + '"</span>,\n   <span class="s">"' + g + '"</span>].X</pre>' },
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          '<span class="c"># the same sums: one row per sample\n# and cell type</span>\n' +
          'pb = sc.get.<span class="k">aggregate</span>(\n    adata,\n    by=[<span class="s">"sample"</span>, <span class="s">"cell_type"</span>],\n    func=<span class="s">"sum"</span>,\n    layer=<span class="s">"counts"</span>,\n)\n' +
          'pb.X = pb.layers[<span class="s">"sum"</span>]</pre>' },
        { id: 'se', label: 'R · Seurat', html:
          '<pre class="code"><span class="k">library</span>(Seurat)\n' +
          '<span class="c"># sums the counts of every group of cells</span>\n' +
          'pb &lt;- <span class="k">AggregateExpression</span>(obj,\n    assays = <span class="s">"RNA"</span>,\n    return.seurat = TRUE,\n    group.by = c(<span class="s">"sample"</span>, <span class="s">"cell_type"</span>))\n\n' +
          '<span class="c"># each "cell" of pb is now one sample\n# of one cell type</span>\n' +
          '<span class="k">tail</span>(<span class="k">Cells</span>(pb))</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="c"># raw counts summed per donor, for a\n# frozen selection of one cell type</span>\n' +
          'pb = ds.compare.<span class="k">compute_bulk</span>(\n    <span class="s">"donor_id"</span>,\n    cell_selection=cells,\n    aggr_type=<span class="s">"sum"</span>,\n    feature_label=<span class="s">"name"</span>,\n)\n' +
          '<span class="c"># CyteArc 1.3 returns the table itself;\n# later versions hold it in pb.profiles</span></pre>' },
      ],
    },
  });
}

G.scenes.scales = {
  phase: () => phase,
  dbg: { claim: () => ci, cur: () => cur, bagged: () => bagged.slice(), onStamp: () => onStamp, si: () => si, slips: () => slips, holds: () => TR().claim(ci).holds, p: () => test().p,
    heaps: () => heaps.map(h => ({ d: h.d, x: h.x + h.w / 2, y: FLOOR - Math.min(h.h, 20) / 2, n: h.n })), go: d => { cur = d; onStamp = false; } },
  enter() {
    phase = 'load'; load = 0; ci = 0; slips = 0; loose = false; wrong = false; res = null; rsel = 0; say = null; phi = 0; stampT = -9; held = []; lastSync = null;
    W = G.sys.changes.scales; CLAIMS = W.claims; G.params.wgene = CLAIMS[0].gene;
    beats = new G.Beats([
      { spot: [PAN[0] - 4, 50, VW - 12, 78], say: 'Each grain is one ' + W.cell + ' after treatment: responders left, the others right. A bright grain carries the gene.' },
      { spot: [118, 12, 84, 36], say: 'The needle shows how sure the scales are that the pans differ. Weighed grain by grain, they are sure.' },
      { say: () => G.kt('Hold SPACE on a heap', 'Hold a finger on a heap') + ' to bag it: one weight for each patient. Bag all twelve, then stamp the claim.' },
    ]);
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'scales' }); return; }
    if (phase === 'load') { if (++load < 3) return; TR().build(); build(); phase = G.state.tries.scales > 0 ? 'play' : 'intro'; lights(); sync(); return; }
    /* the needle follows what is on the pans */
    phi += (lean(test()) - phi) * Math.min(1, dt * 5);
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'play'; return; }
    if (phase === 'said') { if (say.update(dt) === 'done') advance(); return; }
    if (phase === 'result') { const r = G.resultKeys(rsel, true); rsel = r.rsel; if (r.act === 'keep') keep(); else if (r.act === 'retry') restart(); return; }
    if (G.hit('down') && !onStamp) { onStamp = true; armed = false; prog = 0; G.sfx('tick'); }
    if (G.hit('up') && onStamp) { onStamp = false; G.sfx('tick'); }
    const d = (G.rep('right') ? 1 : 0) - (G.rep('left') ? 1 : 0);
    if (d) { if (onStamp) si = G.clamp(si + d, 0, 1); else { cur = G.clamp(cur + d, 0, TR().N - 1); prog = 0; } G.sfx('tick'); }
    if (onStamp) { if (G.act()) stamp(si === 0); return; }
    /* a finger or the pointer on a heap picks it; held there, or with the action key held, the heap is bagged.
       Held on, it goes from heap to heap, and after the first claim the bagging takes half the time. */
    let press = false;
    if (G.ptr.down && G.ptr.y < 128 && G.ptr.y > 46) heaps.forEach(h => { if (G.over(h.x - 2, FLOOR - Math.max(h.h, 22) - 8, h.w + 4, Math.max(h.h, 22) + 20)) { if (cur !== h.d && !bagged[h.d]) { cur = h.d; prog = 0; } press = true; } });
    if (G.act()) armed = true;
    if (!G.down.a) armed = false;
    if ((press || armed) && !bagged[cur]) { prog += dt / (ci ? BAG / 2 : BAG); if (prog >= 1) bag(cur); } else prog = 0;
  },
  draw() {
    R(0, 0, VW, VH, '#14100c');
    if (phase === 'load') { G.roomHeader('5-1  THE SCALES', C.oil, true); T('POURING OUT THE GRAIN...', VW / 2, 84, C.fog, { a: 'center' }); return; }
    drawBalance(); drawReadings();
    G.roomHeader('5-1  THE SCALES', C.oil, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, 'Cells from one patient agree with each other, whatever the treatment did. The patient is the replicate, not the cell.', true, rsel, 'START AGAIN', 'KEEP THE STAMPS');
      if (act === 'keep') keep(); else if (act === 'retry') restart();
      G.stars(250, y0 + 7, res.stars); T(slips + (slips === 1 ? ' SLIP' : ' SLIPS'), 310, y0 + 18, C.steel, { a: 'right' });
      return;
    }
    G.strip(y0);
    T('CLAIM ' + (ci + 1) + ' OF ' + CLAIMS.length, 10, y0 + 4, C.amber, { f: 'smb' });
    for (let i = 0; i < CLAIMS.length; i++) R(84 + i * 9, y0 + 7, 7, 4, i < ci ? C.mint : i === ci ? C.amber : C.slate);
    T(CLAIMS[ci].gene, 10, y0 + 15, C.white, { f: 'smb' }); T('IS HIGHER IN RESPONDERS', 14 + Math.ceil(G.tw(CLAIMS[ci].gene, 'smb')), y0 + 15, C.fog);
    T(G.kt('LEFT, RIGHT: PICK A HEAP', 'HOLD A FINGER ON A HEAP'), 10, y0 + 30, C.steel);
    T(G.kt('HOLD SPACE: BAG   DOWN: STAMPS', 'TO BAG IT. THEN STAMP THE CLAIM'), 10, y0 + 39, C.steel);
    const live = phase === 'play';
    if (G.button('holds', 186, y0 + 26, 54, 20, 'HOLDS', { primary: true, focus: live && onStamp && si === 0 }) && live) { onStamp = true; si = 0; stamp(true); }
    if (G.button('few', 244, y0 + 26, 70, 20, 'FEW DONORS', { focus: live && onStamp && si === 1, accent: C.coral }) && live) { onStamp = true; si = 1; stamp(false); }
    if (live && allBagged() && !onStamp) G.cue(250, y0 + 25, true);
    if (phase === 'intro') beats.draw();
    if (phase === 'said') say.draw();
  },
};

/* ---------- drawing ---------- */
function drawBalance() {
  const tilt = phi * 6, by = [PIVOT[1] + Math.round(tilt), PIVOT[1] - Math.round(tilt)], fy = [FLOOR + Math.round(tilt), FLOOR - Math.round(tilt)];
  /* the dial: an arc over the pivot, with a mark either side where a claim begins to hold */
  for (let a = -SWING; a <= SWING; a += 4) {
    const r = a * Math.PI / 180, far = Math.abs(a) / SWING, x = PIVOT[0] + Math.sin(r) * 30, y = PIVOT[1] - Math.cos(r) * 30;
    R(x, y, 2, 2, far > 0.74 ? C.amber : far > MARK ? '#8a6c40' : C.slate);
  }
  [-1, 1].forEach(s => { const r = s * MARK * SWING * Math.PI / 180; G.line(PIVOT[0] + Math.sin(r) * 26, PIVOT[1] - Math.cos(r) * 26, PIVOT[0] + Math.sin(r) * 34, PIVOT[1] - Math.cos(r) * 34, C.white); });
  T('SURE', PIVOT[0] - 32, 31, C.amber, { a: 'right' }); T('SURE', PIVOT[0] + 34, 31, C.amber);
  /* the post, the beam, and the needle */
  R(PIVOT[0] - 2, PIVOT[1], 5, 80, BRASS); R(PIVOT[0] - 2, PIVOT[1], 1, 80, 'rgba(255,255,255,.35)'); R(PIVOT[0] - 16, 124, 33, 4, DULL); R(PIVOT[0] - 16, 124, 33, 1, BRASS);
  G.line(PIVOT[0] - ARM, by[0], PIVOT[0] + ARM, by[1], BRASS); G.line(PIVOT[0] - ARM, by[0] + 1, PIVOT[0] + ARM, by[1] + 1, DULL);
  const nr = -phi * SWING * Math.PI / 180;
  G.line(PIVOT[0], PIVOT[1], PIVOT[0] + Math.sin(nr) * 27, PIVOT[1] - Math.cos(nr) * 27, C.white); G.disc(PIVOT[0], PIVOT[1], 2, BRASS);
  /* the pans, each on two chains, and whatever stands on them */
  [0, 1].forEach(s => {
    const ex = PIVOT[0] + (s ? ARM : -ARM), x = PAN[s], y = fy[s];
    G.line(ex, by[s], x + 3, y, '#5a5346'); G.line(ex, by[s], x + PANW - 4, y, '#5a5346');
    R(x, y, PANW, 3, BRASS); R(x, y, PANW, 1, 'rgba(255,255,255,.4)'); R(x + 4, y + 3, PANW - 8, 1, DULL);
    T(s ? 'OTHER PATIENTS' : 'RESPONDERS', s ? x + PANW : x, 52, SIDE[s], { a: s ? 'right' : 'left' });
  });
  heaps.forEach(h => {
    const y = fy[h.side], focus = phase === 'play' && !onStamp && cur === h.d;
    if (bagged[h.d]) { G.weighhouse.weight(h.x + Math.floor(h.w / 2) - 5, y - h.tall, 10, h.tall, BRASS); }
    else {
      /* while a heap is being bagged, its grains go from the top down */
      const keepN = focus && prog > 0 ? Math.round(h.n * (1 - prog)) : h.n, dim = DIM[h.side];
      for (let i = 0; i < keepN; i++) R(h.x + h.gx[i], y - h.gy[i], 2, 2, h.v[i] > 0 ? LIT : dim);
      if (keepN < h.n) G.weighhouse.weight(h.x + Math.floor(h.w / 2) - 5, y - Math.round(h.tall * prog), 10, Math.round(h.tall * prog), BRASS);
    }
    if (focus) G.corners([h.x - 2, y - Math.max(h.h, 8) - 3, h.w + 3, Math.max(h.h, 8) + 2], Math.floor(G.t * 4) % 2 ? C.white : C.fog);
  });
  /* the stamp, for a moment after it comes down */
  if (stamped !== null && G.t - stampT < 3 && phase === 'said') {
    const lab = stamped ? 'HOLDS' : 'A FEW DONORS', c = stamped ? C.mint : C.coral, w = Math.ceil(G.tw(lab, 'lg')) + 12, x = Math.round(PIVOT[0] - w / 2), y = 84;
    R(x, y, w, 20, c); R(x + 2, y + 2, w - 4, 16, '#14100c'); T(lab, PIVOT[0], y + 2, c, { a: 'center', f: 'lg' });
  }
}
function drawReadings() {
  /* left: the heap under the cursor. right: what is on the pans, and what the scales make of it. */
  const h = heaps[cur], d = TR().donors()[cur], t = test(), nb = bagged.filter(b => b).length, grains = heaps.reduce((s, x) => s + (bagged[x.d] ? 0 : x.n), 0);
  if (phase === 'play' && !onStamp) {
    T(d.name, 8, 15, SIDE[h.side], { f: 'smb' });
    T(bagged[cur] ? 'ONE WEIGHT' : G.fmt(h.n) + ' CELLS', 8, 25, C.fog);
    T(Math.round(100 * h.lit / h.n) + '% BRIGHT', 8, 34, C.steel);
  }
  T('ON THE PANS', VW - 8, 15, C.mist, { a: 'right' });
  T(nb === 0 ? G.fmt(grains) + ' GRAINS' : grains === 0 ? nb + ' WEIGHTS' : nb + ' + ' + G.fmt(grains), VW - 8, 25, C.white, { a: 'right' });
  T(t.p < 0.001 ? 'P < 0.001' : 'P = ' + t.p.toFixed(t.p < 0.1 ? 3 : 2), VW - 8, 34, t.p < TR().ALPHA ? C.amber : C.steel, { a: 'right' });
}
})();
