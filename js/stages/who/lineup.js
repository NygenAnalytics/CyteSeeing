/* Station 3-2, the Line-up. A marker gene is one that picks a cluster out: it lights up that
   cluster on the map and little else. For four clusters in turn the player moves through five
   genes, watching where each one is expressed, and pins the marker. Each line-up has its own
   lesson, and each lesson is taught here and nowhere else on the floor: a gene that other cell
   types share, a gene with a tiny p-value that is in every cell, a gene the neighbouring cluster
   makes too. The last cluster has no gene of its own, because it is two cells in one droplet,
   and it leaves the board. Every number on the screen is computed from the cells. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 180, PH = 110, SX = 190, SW = 126;
const IN_MIN = 0.6, OUT_MAX = 0.2;
const at = () => G.atlas, pc = v => G.atlas.pc(v);

/* The line-ups and the genes Ida pinned before the player arrived are in the pack of the cell
   system (js/systems/<id>.who.js, lineup), and are read each time the station is entered.
   A round says which cluster (role), the five genes, and what its lesson needs: a famous gene that
   is a poor marker (trap), a gene brighter than the marker (bright), or that no gene fits (none). */
let ROUNDS, GIVEN;
const good = g => g.in >= IN_MIN && g.out <= OUT_MAX;
/* why a gene is not the marker. The numbers are on the screen, so Ida gives the reason only. */
function why(g) {
  if (g.name === round().trap) return round().trapWhy;
  if (g.in < IN_MIN) return g.name + ' is in too few of these cells. It marks a handful of cells, not the cluster.';
  if (g.out > 0.9) return g.name + ' is in every cell on the board. It picks nothing out.';
  return g.name + ' lights up other clusters too.';
}

/* what Ida adds once the marker is pinned, if the player has not already heard it by pinning the wrong gene */
function added(r) {
  if (r.trap && !tried[r.trap]) return r.ok;
  if (r.bright && !tried[r.bright]) return 'Pinned. ' + r.bright + ' is brighter, but a marker has to tell a cluster from its neighbours.';
  return null;
}

let phase, load, beats, say, ri, gi, btn, mistakes, pins, pos, f, lit, res, rsel, lastSync, after, hold, tried, bars;

const round = () => ROUNDS[ri];
const cluster = () => f.role[round().role];
const gene = k => at().stats(cluster())[round().genes[k === undefined ? gi : k]];

/* how brightly each cell shows the gene under the cursor */
function light() {
  const M = at().prep().M, j = at().gi[round().genes[gi]]; let mx = 0;
  for (let i = 0; i < M.length; i++) mx = Math.max(mx, M[i][j]);
  lit = M.map(row => (row[j] > 0 ? 1 + Math.min(3, Math.floor(row[j] / (mx || 1) * 4)) : 0));
}
function setGene(k) { k = (k + 5) % 5; if (k === gi) return; gi = k; light(); G.sfx('tick'); }

function slip() { mistakes++; G.state.tries.lineup++; G.save(); G.sfx('bad'); }
function pin() {
  const g = gene(), r = round();
  if (r.none || !good(g)) { slip(); tried[g.name] = true; tell(why(g), false); return; }
  pins[cluster()] = g.name; G.sfx('ok');
  /* the tag goes on the map. Ida speaks only where there is something to add. */
  const line = added(r);
  if (line) tell(line, true); else { after = true; phase = 'pinned'; hold = 0.9; }
}
function none() {
  const r = round(), c = cluster();
  if (!r.none) { slip(); tell('One of these does fit.', false); return; }
  pins[c] = null; G.sfx('ok');
  say = new G.Beats([
    { say: 'No gene of its own. ' + G.sys.who.lineup.both + ' in the same cells, and ' + at().depth(c).toFixed(1) + ' times the usual RNA.' },
    { say: 'Two cells in one droplet. Doublets get no name. They leave the board.' },
  ]);
  after = true; phase = 'said';
}
function tell(text, next) { say = new G.Beats([{ say: text }]); after = next; phase = 'said'; }
function advance() {
  say = null;
  if (!after) { phase = 'pick'; return; }
  [[], ['m-p', 'm-rna'], [], ['m-dbl']][ri].forEach(id => G.book.unlock(id));
  if (ri < ROUNDS.length - 1) { ri++; gi = 0; btn = 0; tried = {}; light(); phase = 'pick'; return; }
  const stars = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
  res = { pass: true, stars }; phase = 'result'; rsel = 1;
  G.book.goal('pin', true); G.book.goal('few', mistakes <= 1); G.book.unlock('m-plot'); G.sfx('star');
}
function keep() {
  const s = G.state;
  s.bureau = Object.assign({}, s.bureau, { pins: pins.slice() });
  s.rooms.lineup = { done: true, stars: Math.max(s.rooms.lineup.stars, res.stars) };
  G.save();
  G.go('corridor', { from: 'lineup' });
}
function restart() { ri = 0; gi = 0; btn = 0; mistakes = 0; res = null; tried = {}; start(); light(); phase = 'pick'; G.book.goal('pin', null); G.book.goal('few', null); }
function start() { pins = new Array(f.k).fill(undefined); Object.keys(GIVEN).forEach(r => { pins[f.role[r]] = GIVEN[r]; }); }

function sync() {
  const key = phase + '|' + ri + '|' + gi;
  if (key === lastSync || !f) return;
  lastSync = key; G.params.lu = String(cluster() + 1); G.book.sync();
}
function showBook() {
  const c = '<span class="p" data-b="lu"></span>';
  G.book.show({
    floor: 'The Bureau · Station 3-2', room: 'The line-up', aim: 'Pin a marker gene on each cluster. If no gene fits a cluster, say so.',
    codeFirst: true, file: 'js/stages/who/lineup.js',
    goals: [
      { id: 'pin', text: 'In at least 60% of the cluster, and at most 20% of other cells' },
      { id: 'few', text: 'No more than 1 wrong pin' },
    ],
    notes: [
      { id: 'm-what', open: true, html: 'Tools test every gene in a cluster against all other cells, usually with a Wilcoxon rank-sum test, and report the share of cells with the gene inside and outside the cluster. The 60% and 20% used here are a rule of thumb: Scanpy\'s filter defaults to 25% inside and 50% outside.' },
      { id: 'm-p', html: 'A small p-value is not enough. The clusters were made from the same data the test uses, so the p-values are far too small, and with thousands of cells even a slight difference is significant.' },
      { id: 'm-rna', html: G.sys.who.lineup.rna + ' Prefer markers that were established in RNA data.' },
      { id: 'm-dbl', html: 'Doublets that slip past the filter in the core facility often gather in a small cluster of their own. The signs are the markers of two cell types at once, no gene of their own, and more RNA per cell.' },
      { id: 'm-plot', html: 'A <b>dot plot</b> shows every cluster at once: dot size is the share of cells with the gene, and colour is the average level.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'The <b>highlighted number</b> is the cluster in the line-up. Every tool reports the two fractions you are reading on the screen.',
      tabs: [
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          '<span class="c"># every cluster against all other cells</span>\n' +
          'sc.tl.<span class="k">rank_genes_groups</span>(\n    adata, groupby=<span class="s">"leiden"</span>,\n    method=<span class="s">"wilcoxon"</span>,\n    pts=True)  <span class="c"># also report the fractions</span>\n\n' +
          '<span class="c"># keep genes found inside and not outside</span>\n' +
          'sc.tl.<span class="k">filter_rank_genes_groups</span>(\n    adata,\n    min_in_group_fraction=0.6,\n    max_out_group_fraction=0.2)\n\n' +
          '<span class="c"># the table for one cluster</span>\n' +
          'sc.get.<span class="k">rank_genes_groups_df</span>(\n    adata, group=<span class="s">"' + c + '"</span>, pval_cutoff=0.05)\n\n' +
          'sc.pl.<span class="k">rank_genes_groups_dotplot</span>(\n    adata, n_genes=3,\n    key=<span class="s">"rank_genes_groups_filtered"</span>)</pre>' },
        { id: 'se', label: 'R · Seurat', html:
          '<pre class="code"><span class="k">library</span>(Seurat)\n' +
          'markers &lt;- <span class="k">FindAllMarkers</span>(obj,\n    only.pos = TRUE,\n    test.use = <span class="s">"wilcox"</span>)\n\n' +
          '<span class="c"># pct.1: fraction of cells inside the cluster\n# pct.2: fraction of all other cells</span>\n' +
          'good &lt;- <span class="k">subset</span>(markers,\n    cluster == <span class="s">"' + c + '"</span> &amp;\n    pct.1 &gt;= 0.6 &amp; pct.2 &lt;= 0.2)\n\n' +
          '<span class="k">DotPlot</span>(obj, features = <span class="k">unique</span>(good$gene))</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="c"># each cluster against the other cells</span>\n' +
          'markers = ds.markers.<span class="k">search</span>(\n    clusters,\n    features=run[<span class="s">"feature_universe"</span>])\n\n' +
          '<span class="c"># every gene for one cluster, filters off</span>\n' +
          'table = ds.markers.<span class="k">load</span>(\n    marker=markers, group_id=<span class="s">"' + c + '"</span>,\n    min_frac_exp=None, min_auc=None,\n    max_p_adj=None)\n' +
          'table[[<span class="s">"feature_name"</span>, <span class="s">"frac_exp"</span>,\n       <span class="s">"frac_exp_rest"</span>, <span class="s">"auc"</span>]]\n\n' +
          'ds.plots.<span class="k">marker_heatmap</span>(\n    marker=markers, topn=3)</pre>' },
      ],
    },
  });
}

G.scenes.lineup = {
  phase: () => phase,
  dbg: { round: () => ri, genes: () => round().genes.map((n, k) => { const g = gene(k); return { name: n, in: g.in, out: g.out, good: good(g) }; }), mistakes: () => mistakes },
  enter() {
    ROUNDS = G.sys.who.lineup.rounds; GIVEN = G.sys.who.lineup.given;
    phase = 'load'; load = 0; ri = 0; gi = 0; btn = 0; mistakes = 0; res = null; rsel = 1; say = null; lastSync = null; f = null; tried = {}; bars = [0, 0];
    beats = new G.Beats([
      { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'One cluster is marked. Before it can be named it needs a marker: a gene that lights up that cluster and little else.' },
      { spot: [SX, 14, SW, 114], say: 'Move through its genes and watch the map. Pin the marker. If no gene fits, say so.' },
    ]);
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'lineup' }); return; }
    if (phase === 'load') {
      if (++load < 3) return;
      f = at().final(); pos = at().place(PX + 9, PY + 12, PW - 20, PH - 22); start(); light();
      phase = G.state.tries.lineup > 0 || G.state.rooms.lineup.done ? 'pick' : 'intro'; sync();
      return;
    }
    /* the two bars slide to the gene under the cursor */
    { const g = gene(), k = Math.min(1, dt * 14); bars[0] += (g.in - bars[0]) * k; bars[1] += (g.out - bars[1]) * k; }
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'pick'; }
    else if (phase === 'pick') {
      if (G.rep('down')) setGene(gi + 1);
      if (G.rep('up')) setGene(gi - 1);
      if (G.hit('left') || G.hit('right')) { btn = 1 - btn; G.sfx('tick'); }
      if (G.ptr.pressed) for (let k = 0; k < 5; k++) if (G.over(SX + 2, 30 + k * 11, SW - 4, 11)) setGene(k);
      if (G.act()) { if (btn) none(); else pin(); }
    } else if (phase === 'pinned') { hold -= dt; if (hold <= 0) { after = true; advance(); } }
    else if (phase === 'said') { if (say.update(dt) === 'done') advance(); }
    else if (phase === 'result') {
      const r = G.resultKeys(rsel, true); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') restart();
    }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#150f0d');
    if (phase === 'load') { G.roomHeader('3-2  THE LINE-UP', C.lilac, true); T('BRINGING IN THE SUSPECTS...', VW / 2, 84, C.fog, { a: 'center' }); return; }
    if (phase === 'result') drawDots(); else drawMap();
    drawSide();
    G.roomHeader('3-2  THE LINE-UP', C.lilac, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, 'One large dot in each row, and small ones elsewhere. That is what good markers look like.', true, rsel, 'START AGAIN', 'KEEP THESE MARKERS');
      if (act === 'keep') keep(); else if (act === 'retry') restart();
      return;
    }
    G.strip(y0);
    T('LINE-UP ' + (ri + 1) + ' OF ' + ROUNDS.length, 12, y0 + 7, C.white);
    for (let i = 0; i < ROUNDS.length; i++) R(12 + i * 9, y0 + 20, 7, 4, i < ri ? C.mint : i === ri ? C.amber : C.slate);
    T(G.kt('UP, DOWN: OTHER GENE', 'TAP A GENE TO SEE IT'), 12, y0 + 34, C.steel);
    const live = phase === 'pick';
    if (G.button('pin', 120, y0 + 8, 92, 28, 'PIN THIS GENE', { primary: true, focus: btn === 0 && live }) && live) { btn = 0; pin(); }
    if (G.button('none', 218, y0 + 8, 94, 28, 'NO GENE FITS', { focus: btn === 1 && live }) && live) { btn = 1; none(); }
    if (phase === 'intro') beats.draw();
    if (phase === 'said') say.draw();
  },
};

const RAMP = ['#27304e', '#8a6a2e', '#c9952f', '#f6ba4c', '#fff3c4'];
function drawMap() {
  const c = cluster(), cells = f.mem[c], b = at().box(pos, cells);
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  pos.forEach((q, i) => R(q[0], q[1], 2, 2, RAMP[lit[i]]));
  /* what the label over the cluster says: its number, then the gene pinned on it, or that it has gone */
  const done = (phase === 'pinned' || phase === 'said') && after !== false, out = done && round().none, tag = done && pins[c];
  if (out) { cells.forEach(i => R(pos[i][0], pos[i][1], 2, 2, at().GONE)); G.line(b[0], b[1], b[0] + b[2], b[1] + b[3], C.coral); G.line(b[0], b[1] + b[3], b[0] + b[2], b[1], C.coral); }
  else at().corners(b, Math.floor(G.t * 4) % 2 ? C.white : C.fog);
  const lab = out ? 'DOUBLETS' : tag;
  if (lab) {
    const lw = Math.ceil(G.tw(lab, 'sm')) + (tag ? 11 : 4), lx = G.clamp(b[0] + b[2] / 2 - lw / 2, PX + 2, PX + PW - lw - 2), ly = b[1] > PY + 24 ? b[1] - 11 : b[1] + b[3] + 2;
    R(lx, ly, lw, 10, tag ? C.paper : 'rgba(10,15,30,.85)'); T(lab, lx + (tag ? 9 : 2), ly, tag ? C.ink : C.coral);
    if (tag) { G.disc(lx + 4, ly + 4, 2, C.coral); R(lx + 4, ly + 6, 1, 3, '#7a2f2a'); }
  }
  T(round().genes[gi], PX + 5, PY + 3, C.amber, { f: 'smb' });
  for (let i = 0; i < 5; i++) R(PX + PW - 60 + i * 5, PY + 5, 5, 4, RAMP[i]);
  T('NONE', PX + PW - 62, PY + 3, C.steel, { a: 'right' }); T('HIGH', PX + PW - 5, PY + 3, C.steel, { a: 'right' });
}

/* the result: genes down the side, the clusters still on the board along the top. Dot size is the share of cells with the gene. */
function drawDots() {
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  const M = at().prep().M, cols = [], rows = []; pins.forEach((g, c) => { if (g) { rows.push(g); cols.push(c); } });
  const x0 = PX + 62, y0 = PY + 18, cw = 16, rh = 12;
  cols.forEach((c, k) => T(String(c + 1), x0 + k * cw, PY + 4, at().COLS[c], { a: 'center', f: 'smb' }));
  rows.forEach((g, r) => {
    const y = y0 + r * rh, j = at().gi[g];
    T(g, PX + 5, y - 4, C.fog);
    const mean = cols.map(c => f.mem[c].reduce((s, i) => s + M[i][j], 0) / f.mem[c].length), top = Math.max.apply(null, mean);
    cols.forEach((c, k) => {
      const fr = at().stats(c)[g].in, rad = fr < 0.05 ? 0 : Math.max(1, Math.round(fr * 5));
      if (!rad) R(x0 + k * cw, y, 1, 1, C.slate); else G.disc(x0 + k * cw, y, rad, RAMP[1 + Math.min(3, Math.floor(mean[k] / (top || 1) * 3.99))]);
    });
  });
}

function drawSide() {
  const x = SX, wd = SW;
  G.panel(x, 14, wd, 114, { border: C.slate, fill: '#0e1630' });
  if (phase === 'result') {
    T('THE DOT PLOT', x + 6, 18, C.mist);
    T('SIZE OF A DOT:', x + 6, 32, C.fog); T('SHARE OF THE', x + 6, 41, C.fog); T('CLUSTER WITH THE GENE', x + 6, 50, C.fog);
    [0.2, 0.6, 1].forEach((v, i) => G.disc(x + 14 + i * 22, 68, Math.round(v * 5), RAMP[3]));
    T('20%', x + 22, 76, C.steel, { a: 'right' }); T('60%', x + 44, 76, C.steel, { a: 'right' }); T('100%', x + 70, 76, C.steel, { a: 'right' });
    R(x + 5, 90, wd - 10, 1, C.slate);
    T('WRONG PINS', x + 6, 95, C.fog); T(String(mistakes), x + wd - 6, 95, mistakes ? C.amber : C.mint, { a: 'right' });
    G.stars(x + 6, 111, res.stars);
    return;
  }
  const c = cluster(), col = at().COLS[c];
  T('CLUSTER ' + (c + 1), x + 6, 18, col, { f: 'smb' }); T(f.mem[c].length + ' CELLS', x + wd - 6, 18, C.fog, { a: 'right' });
  R(x + 5, 29, wd - 10, 1, C.slate);
  round().genes.forEach((n, k) => {
    const y = 31 + k * 11, on = k === gi;
    if (on) R(x + 2, y - 1, wd - 4, 11, C.deep);
    if (on && Math.floor(G.t * 3) % 2 === 0) T('>', x + 4, y, C.amber);
    T(n, x + 12, y, on ? C.white : C.fog, { f: on ? 'smb' : 'sm' });
    if (tried[n]) { R(x + wd - 12, y + 2, 5, 1, C.coral); R(x + wd - 10, y, 1, 5, C.coral); }
  });
  R(x + 5, 88, wd - 10, 1, C.slate);
  const g = gene(), bw = wd - 12;
  T('IN THE CLUSTER', x + 6, 91, C.fog); T(pc(g.in), x + wd - 6, 91, C.white, { a: 'right' });
  R(x + 6, 101, bw, 4, C.slate); R(x + 6, 101, Math.round(bw * bars[0]), 4, col); R(x + 6 + Math.round(bw * IN_MIN), 99, 1, 8, C.white);
  T('IN OTHER CELLS', x + 6, 108, C.fog); T(pc(g.out), x + wd - 6, 108, C.white, { a: 'right' });
  R(x + 6, 118, bw, 4, C.slate); R(x + 6, 118, Math.round(bw * bars[1]), 4, C.mist); R(x + 6 + Math.round(bw * OUT_MAX), 116, 1, 8, C.white);
}
})();
