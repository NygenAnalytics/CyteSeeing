/* Station 3-1, the Cut. Clustering cuts the neighbour graph into groups, and the resolution says
   how fine the cut is. Too low and a cluster hides a group that has genes of its own. Too high
   and a split appears that no gene supports. On this sample no setting clears both, which is
   usual: big clusters start splitting on noise before a small difference elsewhere is found.
   So the dial gets the player close, and the last problem is fixed by hand: zoom into one
   cluster (sub-clustering) or merge two that no gene tells apart. Both ways end at the same
   eight clusters. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 180, PH = 110, SX = 190, SW = 126;
const at = () => G.atlas;

let phase, beats, tip, di, aud, cols, pos, seen, load, mistakes, res, rsel, sel, tool, fix, final, lastSync, pulse, flash;

const DIAL = () => at().DIAL;
const issues = a => a.hidden + a.weak.length;
const fmt = v => String(v);

function audit(i) {
  if (!aud[i]) { const a = at().audit(DIAL()[i]); aud[i] = a; cols[i] = at().colours(a.mem); a.cent = a.mem.map(centre); }
  return aud[i];
}
const centre = cells => at().centre(pos, cells), box = cells => at().box(pos, cells);
/* the parts of a cluster that have genes of their own, smallest first: the hidden groups */
const hiddenParts = cells => at().split(cells).parts.slice(1);

function setDial(i) {
  i = G.clamp(i, 0, DIAL().length - 1); if (i === di) return;
  di = i; audit(di); seen[di] = true; pulse = G.t; G.sfx('tick'); lights();
}
function lights() {
  const a = audit(di), done = phase === 'result' && res && res.pass;
  G.book.goal('hid', done || a.hidden === 0); G.book.goal('inv', done || a.weak.length === 0);
}
function sync() {
  const key = phase + '|' + di;
  if (key === lastSync) return;
  lastSync = key; G.params.res = fmt(DIAL()[di]); G.book.sync();
}

function showBook() {
  const r = '<span class="p" data-b="res"></span>';
  G.book.show({
    floor: 'The Bureau · Station 3-1', room: 'The Cut', aim: 'Cut the neighbour graph into clusters that hide no group and invent no split.',
    codeFirst: true, file: 'js/stages/who/cut.js',
    goals: [
      { id: 'hid', text: 'No cluster hides a group with genes of its own' },
      { id: 'inv', text: 'Every split has genes behind it' },
    ],
    notes: [
      { id: 'c-what', open: true, html: 'Clustering works on the <b>neighbour graph</b>, not on the map. The usual algorithm is <b>Leiden</b>: it looks for groups of cells with more links inside the group than chance would give.' },
      { id: 'c-res', open: true, html: 'There is no correct <b>resolution</b>. The default is 1 in Scanpy and 0.8 in Seurat, whose tutorial suggests 0.4 to 1.2 for about 3,000 cells and more for larger data. CyteArc\'s recipe compares 0.5, 0.75, 1.0 and 1.25 for you. Try several.' },
      { id: 'c-genes', html: 'In this game a split has genes behind it when at least 3 genes differ 3-fold and separate most cells of one side from most of the other (AUC of 0.85 or more).' },
      { id: 'c-tech', html: 'Before trusting a split, check that it does not simply follow a technical measure, such as sequencing depth or the share of ribosomal reads.' },
      { id: 'c-toy', html: 'The game runs <b>Louvain</b>, the method Leiden grew out of. Both maximise the same score, modularity with a resolution. Leiden adds a step that keeps every cluster well connected, so use Leiden on real data.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'The <b>highlighted value</b> is the resolution on the dial. The last lines of each tab are the fix by hand: clustering one cluster again.',
      tabs: [
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          '<span class="c"># clusters come from the neighbour graph</span>\n' +
          'sc.tl.<span class="k">leiden</span>(\n    adata,\n    resolution=' + r + ',\n    key_added=<span class="s">"leiden"</span>,\n    flavor=<span class="s">"igraph"</span>,\n    n_iterations=2,\n)\n\n' +
          '<span class="c"># zoom into cluster 2 only (sub-clustering)</span>\n' +
          'sc.tl.<span class="k">leiden</span>(\n    adata,\n    resolution=0.5,\n    restrict_to=(<span class="s">"leiden"</span>, [<span class="s">"2"</span>]),\n    key_added=<span class="s">"leiden_sub"</span>,\n    flavor=<span class="s">"igraph"</span>,\n    n_iterations=2,\n)</pre>' },
        { id: 'se', label: 'R · Seurat', html:
          '<pre class="code"><span class="k">library</span>(Seurat)\n' +
          '<span class="c"># algorithm 4 is Leiden</span>\n' +
          'obj &lt;- <span class="k">FindClusters</span>(obj,\n    resolution = ' + r + ',\n    algorithm = 4)\n\n' +
          '<span class="c"># zoom into cluster 2 only (sub-clustering)</span>\n' +
          'obj &lt;- <span class="k">FindSubCluster</span>(obj,\n    cluster = <span class="s">"2"</span>,\n    graph.name = <span class="s">"RNA_snn"</span>,\n    resolution = 0.5,\n    algorithm = 4)</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="c"># Leiden on the graph from the Cloud</span>\n' +
          'clusters = ds.clusters.<span class="k">leiden</span>(\n    graph, resolution=' + r + ')\n\n' +
          '<span class="c"># how strongly each cell belongs to its cluster:\n# the share of its neighbours with the same label</span>\n' +
          'strength = ds.clusters.<span class="k">membership_strength</span>(\n    clusters, graph)\n\n' +
          '<span class="c"># agreement of two partitions (adjusted Rand index)</span>\n' +
          'ds.clusters.<span class="k">compute_concordance</span>(a, b)</pre>' },
      ],
    },
  });
}

/* ---------- the dial ---------- */
function verdict() {
  const a = audit(di);
  if (phase === 'result') {
    return fix === 'zoom' ? 'Zooming into one cluster is called sub-clustering. This split is real: the genes on the right tell its two parts apart.'
      : 'Nothing was lost by merging: no gene told those two apart. Cutting fine and then merging is a common way to work.';
  }
  if (res.pass) return a.hidden ? 'One dial cannot do better. A finer cut finds the hidden group, but splits another cluster on noise. Fix it by hand.'
    : 'One dial cannot do better. A coarser cut removes the false split, but hides a real group again. Fix it by hand.';
  if (a.weak.length) return 'Too fine. Clusters joined by a red line differ only by noise.';
  return 'Too coarse. Each boxed group has genes of its own, and deserves its own cluster.';
}
function lock() {
  const a = audit(di), pass = issues(a) <= 1;
  G.state.tries.cut++; G.save();
  if (!pass) mistakes++;
  res = { pass }; phase = 'locked'; rsel = pass ? 1 : 0;
  G.book.unlock('c-genes');
  G.sfx(pass ? 'ok' : 'bad');
}
function toFix() {
  const a = audit(di);
  phase = 'fix'; res = null; tool = 0;
  /* start on the smallest cluster, so the player has to find the one that matters */
  sel = a.part.k - 1;
  tip = new G.Beats([{ spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'ZOOM IN clusters one cluster again, on its own links. MERGE joins two. Choose a cluster, then a tool.' }]);
}

/* ---------- fixing by hand ---------- */
function apply() {
  const a = audit(di), cells = a.mem[sel];
  if (tool === 0) {
    const s = at().split(cells);
    if (s.parts.length > 1) { final = { genes: s.genes, cells: s.parts[1] }; fix = 'zoom'; finish(); return; }
    mistakes++; G.sfx('bad');
    tip = new G.Beats([{ say: a.hidden ? 'Cluster ' + (sel + 1) + ' has nothing more in it. Try the one with the box.'
      : 'Nothing is hidden at this setting. The problem is the red line.' }]);
    return;
  }
  const w = a.weak.find(q => q[0] === sel || q[1] === sel);
  if (w) { final = { genes: [], cells: a.mem[w[0]].concat(a.mem[w[1]]) }; fix = 'merge'; finish(); return; }
  mistakes++; G.sfx('bad');
  tip = new G.Beats([{ say: a.weak.length ? 'Cluster ' + (sel + 1) + ' has genes of its own, so it stays. Merge the two joined by the red line.'
    : 'Every cluster here has genes of its own, so none should be merged. The problem is the boxed group.' }]);
}
function finish() {
  const stars = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
  res = { pass: true, stars }; phase = 'result'; rsel = 1; tip = null; flash = G.t;
  G.book.unlock('c-tech'); G.book.unlock('c-toy'); lights(); G.sfx('star');
}
function keep() {
  const s = G.state;
  s.bureau = Object.assign({}, s.bureau, { res: DIAL()[di], fix });
  s.rooms.cut = { done: true, stars: Math.max(s.rooms.cut.stars, res.stars) };
  G.save();
  G.go('corridor', { from: 'cut' });
}
/* back to the dial. Starting again after a finished cut is a fresh attempt. */
function restart() { if (phase === 'result') mistakes = 0; phase = 'dial'; res = null; fix = null; final = null; lights(); }

G.scenes.cut = {
  phase: () => phase,
  dbg: { di: () => di, audit: () => { const a = audit(di); return { k: a.part.k, hidden: a.hidden, weak: a.weak.length, mixed: a.mixed.slice(), pair: a.weak[0] ? a.weak[0].slice(0, 2) : null }; }, sel: () => sel, tool: () => tool, mistakes: () => mistakes },
  enter() {
    phase = 'load'; load = 0; aud = []; cols = []; seen = []; di = 0; mistakes = 0; res = null; rsel = 0; sel = 0; tool = 0; fix = null; final = null; lastSync = null; pulse = -9; tip = null;
    G.params.res = fmt(DIAL()[0]);
    beats = new G.Beats([
      { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'Clustering cuts the neighbour graph into groups of cells. The dial below sets how fine the cut is.' },
      { spot: [SX, 30, SW, 54], say: 'A cut that is too coarse hides a group inside a cluster. One that is too fine splits a cluster where no gene differs.' },
      { say: 'Get both counts as low as the dial allows, then press LOCK.' },
    ]);
    showBook();
  },
  leave() { G.book.onParam = null; },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'cut' }); return; }
    if (phase === 'load') {
      /* the map is worked out once, after one frame has said so */
      if (++load < 3) return;
      at().prep(); at().final(); pos = at().place(PX + 9, PY + 22, PW - 20, PH - 30);
      audit(0); seen[0] = true;
      phase = G.state.tries.cut > 0 ? 'dial' : 'intro'; lights(); sync();
      return;
    }
    /* the other settings are worked out one a frame, before the player gets to them */
    const todo = DIAL().findIndex((_, i) => !aud[i]); if (todo >= 0) audit(todo);
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'dial'; }
    else if (phase === 'dial') {
      const d = (G.rep('right') || G.rep('up') ? 1 : 0) - (G.rep('left') || G.rep('down') ? 1 : 0);
      if (d) setDial(di + d);
      if (G.act()) lock();
    } else if (phase === 'locked') {
      const r = G.resultKeys(rsel, res.pass); rsel = r.rsel;
      if (r.act === 'keep') toFix(); else if (r.act === 'retry') restart();
    } else if (phase === 'fix') {
      if (tip) { if (tip.update(dt) === 'done') tip = null; }
      else {
        const a = audit(di), k = a.part.k;
        if (G.hit('right')) { sel = (sel + 1) % k; G.sfx('tick'); }
        if (G.hit('left')) { sel = (sel + k - 1) % k; G.sfx('tick'); }
        if (G.hit('up') || G.hit('down')) { tool = 1 - tool; G.sfx('tick'); }
        if (G.ptr.pressed && G.over(PX, PY, PW, PH)) {
          let bi = -1, bd = 80; pos.forEach((q, i) => { const d2 = (q[0] - G.ptr.x) * (q[0] - G.ptr.x) + (q[1] - G.ptr.y) * (q[1] - G.ptr.y); if (d2 < bd) { bd = d2; bi = i; } });
          if (bi >= 0) { sel = a.part.lab[bi]; G.sfx('blip'); }
        }
        if (G.act()) apply();
      }
    } else if (phase === 'result') {
      const r = G.resultKeys(rsel, true); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') restart();
    }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#150f0d');
    if (phase === 'load') { G.roomHeader('3-1  THE CUT', C.cyan, true); T('PINNING 258 CELLS TO THE BOARD...', VW / 2, 84, C.fog, { a: 'center' }); return; }
    drawMap(); drawSide();
    G.roomHeader('3-1  THE CUT', C.cyan, true);
    const y0 = 130;
    if (phase === 'locked') {
      const act = G.resultDraw(y0, verdict(), res.pass, rsel, 'CHANGE THE SETTING', 'FIX IT BY HAND', res.pass ? 'CLOSE ENOUGH' : null);
      if (act === 'keep') toFix(); else if (act === 'retry') restart();
      return;
    }
    if (phase === 'result') {
      const act = G.resultDraw(y0, verdict(), true, rsel, 'START AGAIN', 'KEEP THESE CLUSTERS');
      if (act === 'keep') keep(); else if (act === 'retry') restart();
      return;
    }
    G.strip(y0);
    if (phase === 'fix') {
      const a = audit(di);
      T('CLUSTER ' + (sel + 1), 12, y0 + 5, cols[di][sel], { f: 'smb' }); T(a.mem[sel].length + ' CELLS', 12, y0 + 15, C.fog);
      T(G.kt('LEFT, RIGHT: CLUSTER', 'TAP A CLUSTER,'), 12, y0 + 28, C.steel); T(G.kt('UP, DOWN: TOOL', 'THEN A TOOL'), 12, y0 + 37, C.steel);
      if (G.button('zoom', 150, y0 + 8, 76, 28, 'ZOOM IN', { primary: true, focus: tool === 0 && !tip }) && !tip) { tool = 0; apply(); }
      if (G.button('merge', 234, y0 + 8, 76, 28, 'MERGE', { primary: true, focus: tool === 1 && !tip }) && !tip) { tool = 1; apply(); }
      if (tip) tip.draw();
      return;
    }
    drawDial(y0);
    if (G.button('lock', 250, y0 + 8, 62, 28, 'LOCK', { primary: true }) && phase === 'dial') lock();
    if (phase === 'dial' && issues(audit(di)) <= 1) G.cue(281, y0 + 7, true);
    if (phase === 'intro') beats.draw();
  },
};

function drawDial(y0) {
  const n = DIAL().length, cx = 30, cy = y0 + 27, ang = i => (-210 + i * 240 / (n - 1)) * Math.PI / 180;
  T('RESOLUTION', 56, y0 + 6, C.white);
  T(fmt(DIAL()[di]), 56, y0 + 15, C.cyan, { f: 'lg' });
  G.disc(cx, cy, 15, '#2a1d16'); G.disc(cx, cy, 12, '#4a3626'); G.disc(cx, cy, 9, '#6b4630');
  for (let i = 0; i < n; i++) { const a = ang(i); R(Math.round(cx + Math.cos(a) * 18) - 1, Math.round(cy + Math.sin(a) * 18) - 1, 2, 2, i === di ? C.cyan : seen[i] ? C.fog : C.steel); }
  const a = ang(di); G.line(cx, cy, Math.round(cx + Math.cos(a) * 11), Math.round(cy + Math.sin(a) * 11), C.cyan); R(cx - 1, cy - 1, 3, 3, C.ink);
  /* smaller and larger, for fingers and for people who like buttons */
  if (G.button('res-dn', 132, y0 + 10, 24, 24, '-', {}) && phase === 'dial') setDial(di - 1);
  if (G.button('res-up', 162, y0 + 10, 24, 24, '+', {}) && phase === 'dial') setDial(di + 1);
  T(G.kt('LEFT, RIGHT: TURN THE DIAL', 'TAP - OR + TO TURN THE DIAL'), 56, y0 + 38, C.steel);
}

function drawMap() {
  const a = audit(di), col = cols[di], blink = Math.floor(G.t * 3) % 2 === 0, done = phase === 'result';
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  /* after the fix the board shows the final eight */
  const f = at().final(), fc = at().COLS;
  if (done) {
    pos.forEach((q, i) => R(q[0], q[1], 2, 2, fc[f.lab[i]]));
    /* the cells the fix changed flash once, so the eye finds them */
    if (G.t - flash < 1.2 && Math.floor((G.t - flash) * 8) % 2 === 0) final.cells.forEach(i => R(pos[i][0] - 1, pos[i][1] - 1, 4, 4, C.white));
    f.mem.forEach((m, c) => { const q = centre(m); label(q[0], q[1], String(c + 1), fc[c]); });
    return;
  }
  pos.forEach((q, i) => R(q[0], q[1], 2, 2, col[a.part.lab[i]]));
  /* a group hiding inside a cluster: its cells blink white, inside a dashed box */
  a.mixed.forEach(c => hiddenParts(a.mem[c]).forEach(part => {
    if (blink) part.forEach(i => R(pos[i][0], pos[i][1], 1, 1, C.white));
    const b = box(part);
    for (let x = b[0]; x < b[0] + b[2]; x += 4) { R(x, b[1], 2, 1, C.amber); R(x, b[1] + b[3], 2, 1, C.amber); }
    for (let y = b[1]; y < b[1] + b[3]; y += 4) { R(b[0], y, 1, 2, C.amber); R(b[0] + b[2], y, 1, 2, C.amber); }
  }));
  /* a split with no gene behind it: a red line joins the two clusters */
  a.weak.forEach(w => { const p = a.cent[w[0]], q = a.cent[w[1]]; G.line(p[0], p[1], q[0], q[1], C.coral); G.line(p[0], p[1] + 1, q[0], q[1] + 1, C.coral); });
  a.cent.forEach((q, c) => { if (a.mem[c].length >= 3) label(q[0], q[1], String(c + 1), col[c]); });
  if (phase === 'fix' && !tip) at().corners(box(a.mem[sel]), Math.floor(G.t * 4) % 2 ? C.white : C.fog);
}
function label(x, y, s, c) { const w = Math.ceil(G.tw(s, 'sm')) + 4; R(x - w / 2, y - 5, w, 10, 'rgba(10,15,30,.85)'); T(s, x, y - 5, c, { a: 'center' }); }
function drawSide() {
  const x = SX, wd = SW, a = audit(di);
  G.panel(x, 14, wd, 114, { border: C.slate, fill: '#0e1630' });
  if (phase === 'result') {
    T('CLUSTERS', x + 6, 18, C.mist); T('8', x + wd - 6, 15, C.mint, { a: 'right', f: 'lg' });
    R(x + 5, 31, wd - 10, 1, C.slate);
    T('GENES APART', x + 6, 35, C.fog); T(String(final.genes.length), x + wd - 6, 35, C.amber, { a: 'right', f: 'smb' });
    final.genes.slice(0, 8).forEach((g, i) => T(at().genes[g.j].name, x + 6 + (i % 2) * 58, 49 + Math.floor(i / 2) * 9, C.amber));
    R(x + 5, 102, wd - 10, 1, C.slate);
    G.stars(x + 6, 110, res.stars); T(mistakes + (mistakes === 1 ? ' SLIP' : ' SLIPS'), x + wd - 6, 110, C.steel, { a: 'right' });
    return;
  }
  T('CLUSTERS', x + 6, 18, C.mist); T(String(a.part.k), x + wd - 6, 15, C.white, { a: 'right', f: 'lg' });
  R(x + 5, 31, wd - 10, 1, C.slate);
  /* each count carries the mark that shows it on the map: a dashed box, a red line */
  for (let i = 0; i < 3; i++) { R(x + 6 + i * 4, 37, 2, 1, C.amber); R(x + 6 + i * 4, 45, 2, 1, C.amber); } R(x + 6, 39, 1, 2, C.amber); R(x + 6, 42, 1, 2, C.amber); R(x + 15, 39, 1, 2, C.amber); R(x + 15, 42, 1, 2, C.amber);
  T('HIDDEN GROUPS', x + 21, 37, C.fog); T(String(a.hidden), x + wd - 6, 35, a.hidden ? C.amber : C.mint, { a: 'right', f: 'smb' });
  R(x + 5, 57, wd - 10, 1, C.slate);
  R(x + 6, 67, 10, 2, C.coral);
  T('FALSE SPLITS', x + 21, 63, C.fog); T(String(a.weak.length), x + wd - 6, 61, a.weak.length ? C.coral : C.mint, { a: 'right', f: 'smb' });
  R(x + 5, 83, wd - 10, 1, C.slate);
  /* the settings tried so far: how many clusters each gave, and what was wrong with it */
  T('SETTINGS TRIED', x + 6, 87, C.fog);
  const n = DIAL().length, bw = Math.floor((wd - 12) / n);
  for (let i = 0; i < n; i++) {
    const bx = x + 6 + i * bw, q = aud[i];
    if (!seen[i] || !q) { R(bx, 122, bw - 2, 1, C.slate); continue; }
    const h = Math.max(2, Math.round(q.part.k * 1.7)), c = q.weak.length ? C.coral : q.hidden ? C.amber : C.mint;
    R(bx, 123 - h, bw - 2, h, i === di ? c : 'rgba(255,255,255,.14)'); R(bx, 123 - h, bw - 2, 1, c);
    if (i === di) R(bx, 124, bw - 2, 1, C.white);
  }
}
})();
