/* Station 4-2, the Wash. Harmony pulls the two runs together, and theta sets how hard. Too little
   and each cell type stays on two islands. Too much and the cells that only Thursday has (in
   blood, the platelets) are pushed into an island of other cells: over-correction. The strongest
   wash mixes the runs best, so mixing alone picks the wrong setting. The knob starts at its
   highest, where the wash looks finished, and the player has to switch the light to the marker
   gene of those cells to see what it cost.
   Every wash is Harmony run on the cells at that theta (see loads.harmony). */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 180, PH = 110, SX = 190, SW = 126, SPIN = 1.1;
const L = () => G.loads, DIAL = () => G.loads.DIAL;

let phase, beats, di, places, from, spinT, light, looked, slips, res, rsel, load, lastSync, seen, tried;
/* the cells only Thursday holds, from the pack: the word for them in a sentence, their name on a meter, and their marker gene */
let word, NAME, GENE;

const run = () => L().run(DIAL()[di]);
const fmt = v => String(v);
function place(i) { return places[i] || (places[i] = L().place(DIAL()[i], PX + 10, PY + 14, PW - 22, PH - 24)); }
/* where every cell is drawn right now: on its way from the last wash to this one, going round once as it goes */
function now() {
  const to = place(di), u = G.clamp((G.t - spinT) / SPIN, 0, 1);
  if (u >= 1 || !from) return to;
  const e = u * u * (3 - 2 * u), an = (1 - e) * Math.PI * 2, cx = PX + PW / 2, cy = PY + PH / 2 + 4, co = Math.cos(an), si = Math.sin(an);
  return to.map((q, i) => { const x = G.lerp(from[i][0], q[0], e) - cx, y = G.lerp(from[i][1], q[1], e) - cy; return [Math.round(cx + x * co - y * si * 0.8), Math.round(cy + x * si * 0.8 + y * co)]; });
}
const spinning = () => G.t - spinT < SPIN;

function setDial(i) {
  i = G.clamp(i, 0, DIAL().length - 1); if (i === di) return;
  from = now(); di = i; spinT = G.t; tried[i] = true; looked = light === 1; G.sfx('door'); lights();
}
function setLight(v) { if (v === light) return; light = v; if (v === 1) looked = true; G.sfx('tick'); lights(); }
function lights() {
  const v = L().verdict(DIAL()[di]), done = phase === 'result';
  G.book.goal('mix', done || !v.under);
  /* the second light stays grey until the player has looked at the marker gene at this setting */
  G.book.goal('keep', done ? true : looked ? !v.over : null);
}
function sync() {
  const key = String(di);
  if (key === lastSync) return;
  lastSync = key; G.params.theta = fmt(DIAL()[di]); G.book.sync();
}

function showBook() {
  const th = '<span class="p" data-b="theta"></span>';
  G.book.show({
    floor: 'The Laundry · Station 4-2', room: 'The Wash', aim: 'Take out the difference between the runs, and nothing else.',
    codeFirst: true, file: 'js/stages/runs/wash.js',
    goals: [
      { id: 'mix', text: 'The two runs share the islands they have in common' },
      { id: 'keep', text: 'The ' + word + ' still have an island of their own' },
    ],
    notes: [
      { id: 'w-what', open: true, html: '<b>Harmony</b> works on the principal components. It groups the cells into soft clusters, and inside each cluster it shifts every run by that run\'s offset. Then it clusters again, and repeats until nothing moves.' },
      { id: 'w-theta', open: true, html: '<b>theta</b> is the diversity penalty: how strongly a cluster that holds mostly one run is discouraged. The default is 2. At 0 there is no penalty, and Harmony only corrects clusters that already hold both runs.' },
      { id: 'w-counts', html: 'Harmony changes the components, never the counts. Clusters, maps and label transfer use the corrected components. Marker tests and differential expression still use the counts, with the run as a covariate.' },
      { id: 'w-score', html: 'With labels you trust, an integration can be scored: iLISI and graph connectivity for how well the runs mix, cLISI for whether cell types stay apart (the scIB metrics). Without labels, marker genes are the check.' },
      { id: 'w-hvg', html: 'The variable genes were ranked inside each run and then combined. A gene that differs only between the runs varies a lot across the pooled cells, and is exactly the gene to leave out. The cost: the markers of a cell type that one run alone holds are ranked in that run only, and can miss the cut.' },
      { id: 'w-other', html: 'Other methods face the same trade-off. scVI and scANVI learn a corrected space with a neural network, BBKNN corrects only the neighbour graph, and Seurat\'s CCA and RPCA correct through anchors. Benchmarks have found no single best method.' },
      { id: 'w-toy', html: 'The game runs the Harmony algorithm of 2019 on 268 cells with 9 soft clusters, for at most 20 rounds. RUNS MIXED is the share of a cell\'s 10 neighbours from the other run, against the share expected if run made no difference.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'The <b>highlighted value</b> is theta on the knob. Everything after the correction uses the corrected components.',
      tabs: [
        { id: 'sc', label: 'Python · Scanpy', html:
          '<pre class="code"><span class="k">import</span> scanpy <span class="k">as</span> sc\n\n' +
          '<span class="c"># Harmony on the PCA</span>\n' +
          'sc.external.pp.<span class="k">harmony_integrate</span>(\n    adata,\n    key=<span class="s">"batch"</span>,\n    basis=<span class="s">"X_pca"</span>,\n    adjusted_basis=<span class="s">"X_pca_harmony"</span>,\n    theta=' + th + ',\n)\n\n' +
          '<span class="c"># neighbours and the map: corrected PCA</span>\n' +
          'sc.pp.<span class="k">neighbors</span>(\n    adata, use_rep=<span class="s">"X_pca_harmony"</span>)\nsc.tl.<span class="k">umap</span>(adata)</pre>' },
        { id: 'se', label: 'R · Seurat', html:
          '<pre class="code"><span class="k">library</span>(Seurat)\n' +
          '<span class="c"># layers were split by run before the PCA</span>\n' +
          'obj &lt;- <span class="k">IntegrateLayers</span>(\n    object = obj,\n    method = HarmonyIntegration,\n    orig.reduction = <span class="s">"pca"</span>,\n    new.reduction = <span class="s">"harmony"</span>,\n    theta = ' + th + ')\n\n' +
          'obj &lt;- <span class="k">FindNeighbors</span>(obj,\n    reduction = <span class="s">"harmony"</span>, dims = 1:30)\n' +
          'obj &lt;- <span class="k">RunUMAP</span>(obj,\n    reduction = <span class="s">"harmony"</span>, dims = 1:30)</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="c"># the same recipe, Harmony after the PCA</span>\n' +
          'harmony = ds.pipeline.<span class="k">rna</span>(\n    label=<span class="s">"harmony"</span>,\n    hvg={<span class="s">"batch"</span>: <span class="s">"batch"</span>},\n    harmony={\n        <span class="s">"batch_columns"</span>: [<span class="s">"batch"</span>],\n        <span class="s">"harmony_params"</span>: {<span class="s">"theta"</span>: ' + th + '},\n    },\n)\n\n' +
          '<span class="c"># how well the runs mix, and how well the\n# cell types stay apart</span>\n' +
          'ds.integration.<span class="k">compute_ilisi</span>(\n    <span class="s">"batch"</span>, harmony[<span class="s">"neighbors"</span>])\n' +
          'ds.integration.<span class="k">compute_clisi</span>(\n    <span class="s">"cell_type"</span>, harmony[<span class="s">"neighbors"</span>])</pre>' },
        { id: 'vi', label: 'Python · scVI', html:
          '<pre class="code"><span class="k">import</span> scvi\n\n' +
          '<span class="c"># another method: a neural network that\n# models the raw counts, given the run</span>\n' +
          'scvi.model.SCVI.<span class="k">setup_anndata</span>(\n    adata,\n    layer=<span class="s">"counts"</span>,\n    batch_key=<span class="s">"batch"</span>,\n)\n' +
          'model = scvi.model.<span class="k">SCVI</span>(adata)\nmodel.<span class="k">train</span>()\n' +
          'adata.obsm[<span class="s">"X_scVI"</span>] = (\n    model.<span class="k">get_latent_representation</span>())</pre>' },
      ],
    },
  });
}

function verdict() {
  const v = L().verdict(DIAL()[di]);
  if (v.under) return 'Too gentle. The same cell type still sits on two islands, one for each run.';
  if (v.over) return 'Too strong. The runs are mixed, but the ' + word + ' were pushed in among other cells. The ' + GENE + ' light shows where.';
  return 'The runs share their islands, and the ' + word + ' kept theirs. A stronger wash mixes a little more, and loses them.';
}
function lock() {
  const v = L().verdict(DIAL()[di]), pass = !v.under && !v.over;
  G.state.tries.wash++; G.save();
  if (!pass) slips++;
  /* a wash that went too far is shown for what it is */
  if (v.over) { light = 1; looked = true; }
  res = { pass, stars: slips === 0 ? 3 : slips === 1 ? 2 : 1 }; phase = pass ? 'result' : 'locked'; rsel = pass ? 1 : 0;
  ['w-counts', 'w-score'].forEach(n => G.book.unlock(n)); if (pass) ['w-hvg', 'w-other', 'w-toy'].forEach(n => G.book.unlock(n));
  lights(); G.sfx(pass ? 'star' : 'bad');
}
function keep() {
  const s = G.state;
  s.laundry = Object.assign({}, s.laundry, { theta: DIAL()[di] });
  s.rooms.wash = { done: true, stars: Math.max(s.rooms.wash.stars, res.stars) };
  G.save(); G.go('corridor', { from: 'wash' });
}
function restart() { if (phase === 'result') slips = 0; phase = 'play'; res = null; lights(); }

G.scenes.wash = {
  phase: () => phase,
  dbg: { di: () => di, light: () => light, slips: () => slips, verdict: () => L().verdict(DIAL()[di]), spinning, dial: () => DIAL().slice() },
  enter() {
    /* the last customer left the knob as high as it goes: the runs are well mixed, and something is missing */
    phase = 'load'; load = 0; di = DIAL().length - 1; places = []; from = null; spinT = -9; light = 0; looked = false; slips = 0; res = null; rsel = 0; lastSync = null; tried = []; tried[di] = true;
    G.params.theta = fmt(DIAL()[di]);
    const pack = G.sys.runs, lone = pack.types[pack.lone.slot];
    word = pack.lone.word; NAME = lone.name; GENE = lone.mark;
    beats = new G.Beats([
      { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: 'Harmony has moved the two runs together. The knob is theta: how hard it pushes them to mix. It was left on 16.' },
      { spot: [SX, 14, SW, 114], say: 'Pushed too hard, it also joins cells that really differ. Thursday has ' + word + ', and Monday has none.' },
      { say: 'Find a setting that mixes the runs and leaves the ' + word + ' alone. Check with the ' + GENE + ' light before you take a wash out.' },
    ]);
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'wash' }); return; }
    if (phase === 'load') {
      /* one wash a frame: seven runs of Harmony, and a map of each */
      if (++load < 3) return;
      const i = load - 3;
      if (i < DIAL().length) { L().run(DIAL()[i]); place(i); return; }
      const p = L().prep(), j = L().gi[GENE]; seen = []; for (let c = 0; c < p.nr; c++) seen.push(L().X[c][j] > 0);
      phase = G.state.tries.wash > 0 ? 'play' : 'intro'; lights(); sync();
      return;
    }
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'play'; }
    else if (phase === 'play') {
      const d = (G.rep('right') ? 1 : 0) - (G.rep('left') ? 1 : 0);
      if (d) setDial(di + d);
      if (G.hit('up') || G.hit('down')) setLight(1 - light);
      if (G.act()) lock();
    } else {
      const r = G.resultKeys(rsel, res.pass); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') restart();
    }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#16101c');
    if (phase === 'load') {
      G.roomHeader('4-2  THE WASH', C.amber, true);
      const n = DIAL().length, k = G.clamp(load - 3, 0, n);
      T('FILLING THE MACHINE...', VW / 2, 78, C.fog, { a: 'center' }); R(VW / 2 - 50, 92, 100, 5, C.slate); R(VW / 2 - 50, 92, Math.round(100 * k / n), 5, C.amber);
      return;
    }
    drawDrum(); drawSide();
    G.roomHeader('4-2  THE WASH', C.amber, true);
    const y0 = 130;
    if (phase === 'locked' || phase === 'result') {
      const act = G.resultDraw(y0, verdict(), res.pass, rsel, res.pass ? 'WASH AGAIN' : 'CHANGE THE SETTING', 'KEEP THIS WASH');
      if (act === 'keep') keep(); else if (act === 'retry') restart();
      return;
    }
    G.strip(y0);
    drawKnob(y0);
    const live = phase === 'play';
    if (G.button('light', 176, y0 + 8, 62, 28, light ? 'LIGHT: ' + GENE : 'LIGHT: RUN', {}) && live) setLight(1 - light);
    if (G.button('out', 246, y0 + 8, 66, 28, 'TAKE OUT', { primary: true }) && live) lock();
    const v = L().verdict(DIAL()[di]);
    if (live && !spinning() && !v.under) { if (!looked) G.cue(207, y0 + 7, true); else if (!v.over) G.cue(279, y0 + 7, true); }
    if (phase === 'intro') beats.draw();
  },
};

function drawKnob(y0) {
  const n = DIAL().length, cx = 30, cy = y0 + 27, ang = i => (-210 + i * 240 / (n - 1)) * Math.PI / 180;
  T('THETA', 56, y0 + 6, C.white);
  T(fmt(DIAL()[di]), 56, y0 + 15, C.amber, { f: 'lg' });
  G.disc(cx, cy, 15, '#8f8a7c'); G.disc(cx, cy, 12, '#d8d2bf'); G.disc(cx, cy, 9, '#f2eee2');
  for (let i = 0; i < n; i++) { const a = ang(i); R(Math.round(cx + Math.cos(a) * 18) - 1, Math.round(cy + Math.sin(a) * 18) - 1, 2, 2, i === di ? C.amber : tried[i] ? C.fog : C.steel); }
  const a = ang(di); G.line(cx, cy, Math.round(cx + Math.cos(a) * 11), Math.round(cy + Math.sin(a) * 11), '#b0303a'); R(cx - 1, cy - 1, 3, 3, C.ink);
  if (G.button('th-dn', 104, y0 + 10, 24, 24, '-', {}) && phase === 'play') setDial(di - 1);
  if (G.button('th-up', 134, y0 + 10, 24, 24, '+', {}) && phase === 'play') setDial(di + 1);
  T(G.kt('LEFT, RIGHT: KNOB   UP: LIGHT', 'TAP - OR + TO TURN THE KNOB'), 56, y0 + 38, C.steel);
}

/* the drum, seen through the door: every cell of both runs, where this wash leaves it */
function drawDrum() {
  R(PX - 1, PY - 1, PW + 2, PH + 2, '#8f8a7c'); R(PX, PY, PW, PH, '#0e1630');
  /* the corners of the glass are rounded off, as a door's are */
  [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(k => { for (let i = 0; i < 6; i++) R(PX + (k[0] ? PW - 6 + i : 0), PY + (k[1] ? PH - 1 - i : i), 6 - i, 1, '#8f8a7c'); });
  const pos = now(), p = L().prep(), cols = L().COLS;
  if (light === 0) pos.forEach((q, i) => R(q[0], q[1], 2, 2, cols[p.lab[i]]));
  else {
    pos.forEach((q, i) => { if (!seen[i]) R(q[0], q[1], 2, 2, '#3a4468'); });
    pos.forEach((q, i) => { if (seen[i]) R(q[0] - 1, q[1] - 1, 3, 3, C.coral); });
  }
  if (light === 0) { R(PX + 8, PY + 4, 4, 4, cols[0]); T('MONDAY', PX + 15, PY + 2, C.fog); R(PX + 60, PY + 4, 4, 4, cols[1]); T('THURSDAY', PX + 67, PY + 2, C.fog); }
  else { R(PX + 8, PY + 4, 4, 4, C.coral); T(GENE + ' SEEN', PX + 15, PY + 2, C.fog); }
  if (spinning()) { const u = (G.t - spinT) / SPIN; for (let i = 0; i < 6; i++) { const a = u * 9 + i * 1.05; R(Math.round(PX + PW / 2 + Math.cos(a) * 84), Math.round(PY + PH / 2 + Math.sin(a) * 50), 2, 2, 'rgba(255,255,255,.25)'); } }
}
function meter(x, y, w, label, v, min, c) {
  T(label, x, y, C.fog); T(L().pc(v), x + w, y - 2, v >= min ? C.mint : c, { a: 'right', f: 'smb' });
  R(x, y + 11, w, 5, C.slate); R(x, y + 11, Math.round(w * G.clamp(v, 0, 1)), 5, v >= min ? C.mint : c);
  /* the mark it has to reach */
  R(x + Math.round(w * min), y + 9, 1, 9, C.white);
}
function drawSide() {
  const x = SX, wd = SW, r = run(), v = L().verdict(DIAL()[di]), spin = spinning();
  G.panel(x, 14, wd, 114, { border: C.slate, fill: '#0e1630' });
  /* Harmony's rounds count up while the drum turns */
  const shown = spin ? Math.max(1, Math.round(r.rounds * (G.t - spinT) / SPIN)) : r.rounds;
  T('ROUNDS', x + 6, 18, C.mist); T(String(shown), x + wd - 6, 15, C.white, { a: 'right', f: 'lg' });
  if (!spin && !r.converged) T('NOT SETTLED', x + 6, 27, C.coral);
  R(x + 5, 37, wd - 10, 1, C.slate);
  if (phase === 'result') {
    meter(x + 6, 43, wd - 12, 'RUNS MIXED', v.mix, L().MIX_MIN, C.amber);
    meter(x + 6, 67, wd - 12, NAME + ' APART', v.lone, L().KEEP_MIN, C.coral);
    R(x + 5, 96, wd - 10, 1, C.slate);
    G.stars(x + 6, 106, res.stars); T(slips + (slips === 1 ? ' SLIP' : ' SLIPS'), x + wd - 6, 106, C.steel, { a: 'right' });
    return;
  }
  /* one reading for each light: the player sees the second only by switching to it */
  if (light === 0) { if (spin) T('RUNS MIXED', x + 6, 43, C.fog); else meter(x + 6, 43, wd - 12, 'RUNS MIXED', v.mix, L().MIX_MIN, C.amber); }
  else if (spin) T(NAME + ' APART', x + 6, 43, C.fog); else meter(x + 6, 43, wd - 12, NAME + ' APART', v.lone, L().KEEP_MIN, C.coral);
  R(x + 5, 70, wd - 10, 1, C.slate);
  T('LIGHT', x + 6, 75, C.mist);
  [['RUN', C.amber], [GENE, C.coral]].forEach((q, i) => {
    const bx = x + 6 + i * 58, on = light === i;
    G.panel(bx, 86, 54, 16, { border: on ? q[1] : C.slate, fill: on ? '#1c2748' : C.night }); G.disc(bx + 8, 94, 3, on ? q[1] : C.steel); T(q[0], bx + 15, 89, on ? C.white : C.steel);
    if (G.ptr.pressed && G.over(bx, 86, 54, 16) && phase === 'play') setLight(i);
  });
  T(light ? NAME + ' CARRY ' + GENE : 'COLOURED BY RUN', x + 6, 110, C.steel);
}
})();
