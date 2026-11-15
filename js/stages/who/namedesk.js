/* Station 3-3, the Name desk. Names are filed in drawers inside drawers: lineage, then cell type,
   then subtype. For three clusters the player works down the drawers and files each one where
   the evidence stops. Each file has its own lesson, taught here and nowhere else on the floor:
   a cluster that looks like its neighbour until a gene it should lack is checked (in blood,
   cytotoxic T cells and NK cells), a cluster whose evidence reaches a subtype, and one where a
   subtype would be a guess.
   Every percentage is computed from the cells in the cluster. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 180, PH = 110, SX = 190, SW = 126;
const NEED = 0.6, LACK = 0.3;
const at = () => G.atlas;

/* The drawers, the clusters the player files and the names already on file are in the pack of the
   cell system (js/systems/<id>.who.js, name), and are read each time the station is entered.
   TREE: need are genes that should be in most of the cluster, lack are genes that should be in few,
   opts are the drawers inside. CASES: the three clusters, in order. GIVEN: on file before the
   player arrives. */
let TREE, CASES, GIVEN;
/* the one thing Ida adds when each is filed. The first lesson is about the cells, so the pack words it. */
const DONE = [
  k => k.done,
  k => 'Filed one drawer deeper than ' + k.broad + ', because the evidence went there too.',
  () => 'Filed, and no deeper. A gene in a few cells does not make a subtype.',
];
const pc = v => G.atlas.pc(v);
const frac = (c, g) => at().stats(c)[g].in;

let phase, load, beats, say, after, ci, path, oi, btn, mistakes, names, pos, f, res, rsel, lastSync, slide;

const cs = () => CASES[ci];
const cluster = () => f.role[cs().role];
const here = () => TREE[path.length ? path[path.length - 1] : 'root'];
const opts = () => here().opts || [];
const fits = (c, id) => { const n = TREE[id]; return (n.need || []).every(g => frac(c, g) >= NEED) && (n.lack || []).every(g => frac(c, g) <= LACK); };

function choose() {
  const c = cluster(), id = opts()[oi], n = TREE[id];
  if (!fits(c, id)) {
    mistakes++; G.state.tries.name++; G.save(); G.sfx('bad');
    /* the numbers are on the screen, so Ida gives the reason only */
    /* of everything that does not fit, name the gene that misses by the most */
    const bad = (n.need || []).map(g => [NEED - frac(c, g), g, 0]).concat((n.lack || []).map(g => [frac(c, g) - LACK, g, 1])).sort((x, y) => y[0] - x[0])[0];
    tell(bad[2] ? 'That drawer does not allow ' + bad[1] + ', and this cluster is full of it.' : 'That drawer needs ' + bad[1] + ', and this cluster has too little of it.', false);
    return;
  }
  /* the drawer slides open before what is inside it shows */
  slide = 0; phase = 'open'; G.sfx('door');
}
function opened() {
  const id = opts()[oi], n = TREE[id];
  path.push(id); oi = 0; btn = 0; phase = 'pick';
  if (!(n.opts && n.opts.length)) file();
}
function stop() {
  if (!path.length) return;
  const c = cluster(), deeper = opts().find(id => fits(c, id));
  if (deeper) {
    mistakes++; G.state.tries.name++; G.save(); G.sfx('bad');
    tell('A deeper drawer fits this cluster. A broad name is safe, but it throws evidence away.', false);
    return;
  }
  file();
}
function file() {
  const c = cluster(), n = here();
  names[c] = n.name; G.sfx('ok');
  tell(DONE[ci](cs()), true);
}
function tell(text, next) { say = new G.Beats([{ say: text }]); after = next; phase = 'said'; }
function advance() {
  say = null;
  if (!after) { phase = 'pick'; return; }
  [['n-neg'], [], ['n-depth']][ci].forEach(id => G.book.unlock(id));
  if (ci < CASES.length - 1) { ci++; path = []; oi = 0; btn = 0; phase = 'pick'; return; }
  const stars = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
  res = { pass: true, stars }; phase = 'result'; rsel = 1;
  G.book.goal('named', true); G.book.goal('depth', mistakes <= 1); G.book.unlock('n-onto'); G.sfx('star');
}
function keep() {
  const s = G.state;
  s.bureau = Object.assign({}, s.bureau, { names: names.slice() });
  s.rooms.name = { done: true, stars: Math.max(s.rooms.name.stars, res.stars) };
  G.save();
  G.go('corridor', { from: 'name' });
}
function start() { names = new Array(f.k).fill(null); Object.keys(GIVEN).forEach(r => { names[f.role[r]] = GIVEN[r]; }); }
function restart() { ci = 0; path = []; oi = 0; btn = 0; mistakes = 0; res = null; start(); phase = 'pick'; G.book.goal('named', null); G.book.goal('depth', null); }

function sync() {
  const key = phase + '|' + ci + '|' + path.join('>');
  if (key === lastSync || !f) return;
  lastSync = key; G.params.nd = String(cluster() + 1); G.params.ndn = path.length ? here().name.toLowerCase() : '?'; G.book.sync();
}
function showBook() {
  const c = '<span class="p" data-b="nd"></span>', n = '<span class="p" data-b="ndn"></span>', w = G.sys.who.name;
  /* the code names the pack's known markers, and the genes that decide between two names */
  const str = t => '<span class="s">"' + t + '"</span>', list = gs => gs.map(str).join(', ');
  G.book.show({
    floor: 'The Bureau · Station 3-3', room: 'Name desk', aim: 'Name three clusters from their marker genes: as deep as the evidence goes, and no deeper.',
    codeFirst: true, file: 'js/stages/who/namedesk.js',
    goals: [
      { id: 'named', text: 'Give every cluster a name its marker genes support' },
      { id: 'depth', text: 'No more than 1 wrong turn' },
    ],
    notes: [
      { id: 'n-what', open: true, html: 'In this game a drawer fits when its + genes are in at least 60% of the cluster and its - genes in at most 30%. Real annotation weighs many more genes, and starts from the cell types you expect in the tissue.' },
      { id: 'n-neg', html: w.neg + ' Always check the genes a cell type should lack, as well as the ones it should have.' },
      { id: 'n-depth', html: 'How deep to go is a judgement about evidence. Some tools make it explicit: CyteType places each cluster in a hierarchy of cell types, and reports the level it stopped at and why.' },
      { id: 'n-onto', html: 'The Cell Ontology gives each cell type an identifier: ' + w.onto + '. CyteType returns the matching term with each name.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'The <b>highlighted values</b> are the cluster on the desk and the name you have reached. Annotation in code is a marker check followed by a dictionary.',
      tabs: [
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          '<span class="c"># known markers, by cell type</span>\n' +
          'known = {\n' + w.known.map(k => '    ' + str(k[0]) + ': [' + list(k[1]) + '],\n').join('') + '}\n' +
          'sc.pl.<span class="k">dotplot</span>(adata, known, groupby=<span class="s">"leiden"</span>)\n\n' +
          '<span class="c"># one name per cluster</span>\n' +
          'names = {<span class="s">"' + c + '"</span>: <span class="s">"' + n + '"</span>}\n' +
          'adata.obs[<span class="s">"cell_type"</span>] = (\n    adata.obs[<span class="s">"leiden"</span>].map(names))</pre>' },
        { id: 'se', label: 'R · Seurat', html:
          '<pre class="code"><span class="k">library</span>(Seurat)\n' +
          'known &lt;- <span class="k">list</span>(\n' + w.known.map(k => '    ' + str(k[0]) + ' = <span class="k">c</span>(' + list(k[1]) + ')').join(',\n') + ')\n' +
          '<span class="k">DotPlot</span>(obj, features = known)\n\n' +
          '<span class="c"># one name per cluster</span>\n' +
          'obj &lt;- <span class="k">RenameIdents</span>(obj,\n    <span class="s">"' + c + '"</span> = <span class="s">"' + n + '"</span>)\n' +
          'obj$cell_type &lt;- <span class="k">Idents</span>(obj)</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="c"># every gene of every cluster, filters off</span>\n' +
          'all_markers = ds.markers.<span class="k">load</span>(\n    marker=markers, min_frac_exp=None,\n    min_auc=None, max_p_adj=None)\n\n' +
          '<span class="c"># detection inside and outside the cluster,\n# for the genes that decide between two names</span>\n' +
          'rows = all_markers[\n    (all_markers[<span class="s">"group_id"</span>] == <span class="s">"' + c + '"</span>)\n    &amp; all_markers[<span class="s">"feature_name"</span>].isin(\n        [' + list(w.decide) + '])]\n' +
          'rows[[<span class="s">"feature_name"</span>, <span class="s">"frac_exp"</span>,\n      <span class="s">"frac_exp_rest"</span>, <span class="s">"auc"</span>]]\n\n' +
          '<span class="c"># save one label per cell</span>\n' +
          'ds.cells.<span class="k">insert</span>(\n    <span class="s">"cell_type"</span>, labels, overwrite=True)</pre>' },
      ],
    },
  });
}

G.scenes.name = {
  phase: () => phase,
  dbg: { state: () => ({ ci, path: path.slice(), opts: opts().map(id => ({ id, fits: fits(cluster(), id) })), mistakes }) },
  enter() {
    const w = G.sys.who.name;
    TREE = w.tree; CASES = w.cases;
    /* Ida has filed every cluster that the player does not */
    GIVEN = {}; Object.keys(w.filed).forEach(r => { if (!CASES.some(k => k.role === r)) GIVEN[r] = w.filed[r]; });
    phase = 'load'; load = 0; ci = 0; path = []; oi = 0; btn = 0; mistakes = 0; res = null; rsel = 1; say = null; lastSync = null; f = null;
    /* no name has been reached yet, whatever the last visit or the last project left in the notebook */
    G.params.ndn = '?';
    beats = new G.Beats([
      { spot: [PX - 1, PY + 47, PW + 2, PH - 46], say: 'Names sit in drawers inside drawers: lineage, then cell type, then subtype.' },
      { spot: [SX, 14, SW, 114], say: 'Each drawer shows the evidence it asks for. Open the one that fits. When no deeper drawer fits, file the cluster there.' },
    ]);
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'name' }); return; }
    if (phase === 'load') {
      if (++load < 3) return;
      f = at().final(); pos = at().place(PX + 6, PY + 6, 60, 36); start();
      phase = G.state.tries.name > 0 || G.state.rooms.name.done ? 'pick' : 'intro'; sync();
      return;
    }
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'pick'; }
    else if (phase === 'pick') {
      const n = opts().length;
      if (n && G.rep('down')) { oi = (oi + 1) % n; G.sfx('tick'); }
      if (n && G.rep('up')) { oi = (oi + n - 1) % n; G.sfx('tick'); }
      if (G.hit('left') || G.hit('right')) { btn = path.length ? 1 - btn : 0; G.sfx('tick'); }
      if (G.ptr.pressed) for (let k = 0; k < n; k++) if (G.over(PX + 2, PY + 60 + k * 12, PW - 4, 12) && oi !== k) { oi = k; G.sfx('tick'); }
      if (G.act()) { if (btn) stop(); else choose(); }
    } else if (phase === 'open') { slide += dt; if (slide >= 0.22) opened(); }
    else if (phase === 'said') { if (say.update(dt) === 'done') advance(); }
    else if (phase === 'result') {
      const r = G.resultKeys(rsel, true); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') restart();
    }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#150f0d');
    if (phase === 'load') { G.roomHeader('3-3  NAME DESK', C.amber, true); T('OPENING THE FILES...', VW / 2, 84, C.fog, { a: 'center' }); return; }
    if (phase === 'result') drawFiles(); else { drawDesk(); drawEvidence(); }
    G.roomHeader('3-3  NAME DESK', C.amber, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, 'On file. Use the names other people use, so that their data can be compared with yours.', true, rsel, 'START AGAIN', 'KEEP THESE NAMES');
      if (act === 'keep') keep(); else if (act === 'retry') restart();
      return;
    }
    G.strip(y0);
    T('FILE ' + (ci + 1) + ' OF ' + CASES.length, 12, y0 + 7, C.white);
    for (let i = 0; i < CASES.length; i++) R(12 + i * 9, y0 + 20, 7, 4, i < ci ? C.mint : i === ci ? C.amber : C.slate);
    T(G.kt('UP, DOWN: OTHER DRAWER', 'TAP A DRAWER TO LOOK'), 12, y0 + 34, C.steel);
    const live = phase === 'pick';
    if (G.button('open', 126, y0 + 8, 88, 28, 'OPEN DRAWER', { primary: true, focus: btn === 0 && live }) && live) { btn = 0; choose(); }
    if (G.button('file', 220, y0 + 8, 92, 28, 'FILE IT HERE', { focus: btn === 1 && live, disabled: !path.length }) && live && path.length) { btn = 1; stop(); }
    if (phase === 'intro') beats.draw();
    if (phase === 'said') say.draw();
  },
};

function drawDesk() {
  const c = cluster(), col = at().COLS[c];
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  /* where the cluster is on the map */
  R(PX + 3, PY + 3, 68, 44, '#0a1024');
  pos.forEach((q, i) => R(q[0], q[1], 1, 1, f.lab[i] === c ? col : '#2f3a5c'));
  f.mem[c].forEach(i => R(pos[i][0], pos[i][1], 2, 2, col));
  T('CLUSTER ' + (c + 1), PX + 77, PY + 4, col, { f: 'smb' }); T(f.mem[c].length + ' CELLS', PX + 77, PY + 14, C.fog);
  /* the drawers opened so far */
  if (!path.length) T('NOT FILED YET', PX + 77, PY + 27, C.steel);
  /* the stamp, once the cluster is filed */
  if (phase === 'said' && after) { const ww = Math.ceil(G.tw('FILED', 'smb')) + 8; R(PX + 37 - ww / 2, PY + 17, ww, 13, C.mint); R(PX + 38 - ww / 2, PY + 18, ww - 2, 11, '#0a1024'); T('FILED', PX + 37, PY + 19, C.mint, { a: 'center', f: 'smb' }); }
  R(PX + 4, PY + 49, PW - 8, 1, C.slate);
  /* a long name leaves no room for the first word */
  const inside = path.length ? 'INSIDE ' + here().name : '';
  T(!path.length ? 'WHICH DRAWER?' : G.tw('DRAWERS ' + inside, 'sm') <= PW - 10 ? 'DRAWERS ' + inside : inside, PX + 5, PY + 51, C.fog);
  /* the drawers of a filing cabinet. The one being opened slides out. */
  opts().forEach((id, k) => {
    const on = k === oi, out = phase === 'open' && on ? Math.round(slide / 0.22 * 12) : 0, x = PX + 12 + out, y = PY + 61 + k * 12, w = PW - 28;
    R(x - 1, y - 1, w + 2, 11, on ? C.amber : '#1a2038'); R(x, y, w, 9, on ? '#a9b59b' : '#6f7a66'); R(x, y + 8, w, 1, on ? '#7f8a72' : '#565f4f');
    R(x + 5, y + 3, 9, 3, C.ink); R(x + 6, y + 4, 7, 1, on ? C.amber : C.steel);
    T(TREE[id].name, x + 19, y, C.ink, { f: on ? 'smb' : 'sm' });
    if (on && phase === 'pick' && Math.floor(G.t * 3) % 2 === 0) T('>', PX + 4, y, C.amber);
  });
  if (!opts().length) T('NO DRAWERS INSIDE THIS ONE', PX + 13, PY + 63, C.steel);
}

function drawEvidence() {
  const x = SX, wd = SW, c = cluster(), id = opts()[oi], n = id && TREE[id];
  G.panel(x, 14, wd, 114, { border: C.slate, fill: '#0e1630' });
  T('EVIDENCE', x + 6, 18, C.mist);
  if (!n) { T('NOTHING DEEPER', x + 6, 34, C.steel); T('TO CHECK', x + 6, 43, C.steel); return; }
  const rows = (n.need || []).map(g => ['+', g]).concat((n.lack || []).map(g => ['-', g]));
  rows.forEach((r, k) => {
    const y = 31 + k * 15, v = frac(c, r[1]), plus = r[0] === '+', bx = x + 8, bw = wd - 44;
    T(r[0], x + 6, y, plus ? C.mint : C.coral, { f: 'smb' }); T(r[1], x + 15, y, C.white);
    T(pc(v), x + wd - 6, y + 3, C.white, { a: 'right' });
    R(bx, y + 9, bw, 3, C.slate); R(bx, y + 9, Math.round(bw * v), 3, plus ? C.mint : C.coral);
    R(bx + Math.round(bw * (plus ? NEED : LACK)), y + 7, 1, 7, C.white);
  });
  R(x + 5, 106, wd - 10, 1, C.slate);
  T('+ IN MOST CELLS', x + 6, 109, C.mint); T('- IN FEW CELLS', x + 6, 118, C.coral);
}

/* the result: the finished files */
function drawFiles() {
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  T('ON FILE', PX + 5, PY + 3, C.mist);
  const gone = f.dbl;
  names.forEach((n, c) => {
    const y = PY + 15 + c * 11, out = c === gone, mine = CASES.some(k => f.role[k.role] === c), col = out ? at().GONE : at().COLS[c];
    R(PX + 5, y + 1, 6, 6, col); T(String(c + 1), PX + 20, y, col, { a: 'right', f: 'smb' });
    T(n, PX + 26, y, out ? C.steel : C.white);
    if (out) T('REMOVED', PX + PW - 5, y, C.steel, { a: 'right' }); else if (!mine) T('IDA', PX + PW - 5, y, C.steel, { a: 'right' });
  });
  const x = SX, wd = SW;
  G.panel(x, 14, wd, 114, { border: C.slate, fill: '#0e1630' });
  T('THE BOARD', x + 6, 18, C.mist);
  const q = at().place(x + 8, 32, wd - 18, 50);
  q.forEach((v, i) => R(v[0], v[1], 2, 2, f.lab[i] === gone ? at().GONE : at().COLS[f.lab[i]]));
  R(x + 5, 90, wd - 10, 1, C.slate);
  T('WRONG TURNS', x + 6, 95, C.fog); T(String(mistakes), x + wd - 6, 95, mistakes ? C.amber : C.mint, { a: 'right' });
  G.stars(x + 6, 111, res.stars);
}
})();
