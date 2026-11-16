/* Station 5-2, the Formula bench. A slope chart: one line for each patient, from before treatment
   to after, for one gene in one cell type. Under it a formula, ~, and five tiles that go in or
   come out: donor, visit, response, visit:response, run. The chart and the share left unexplained
   redraw with every tile, and a card asks a question that only one formula answers.
   Round 1: what treatment changed (~ donor + visit: with donor in, every patient is compared with
   their own baseline). Round 2: what changed in responders only (the interaction), with a second
   gene that is merely higher in responders at both visits. Round 3: a formula with every tile in
   it, which jams, because donor already tells response and run.
   Every formula is fitted by least squares to the log pseudobulks (see trial.fit). */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 180, PH = 110, SX = 190, SW = 126, XB = PX + 48, XA = PX + 134;
const SIDE = [C.coral, '#6f8ff0'];
const TR = () => G.trial;
/* the tiles, in the order a formula is written: what each is called, how wide it is, and its colour */
const TILES = [
  { id: 'donor', name: 'DONOR', code: 'donor', w: 38, c: C.cyan }, { id: 'visit', name: 'VISIT', code: 'visit', w: 34, c: C.amber },
  { id: 'response', name: 'RESPONSE', code: 'response', w: 54, c: C.pink }, { id: 'vr', name: 'VISIT:RESPONSE', code: 'visit:response', w: 84, c: C.mint },
  { id: 'run', name: 'RUN', code: 'run', w: 28, c: C.lilac },
];
TILES.forEach((t, i) => { t.x = i ? TILES[i - 1].x + TILES[i - 1].w + 3 : 22; });
const tile = id => TILES.find(t => t.id === id);

/* why a tile that the others can spell out has to come off */
const JAM = {
  response: 'Each patient is a responder or not, so donor already tells response. That tile has to come off.',
  run: 'Both samples of a patient shared a run, so donor already tells the run. That tile has to come off.',
};

let phase, load, beats, say, after, ri, terms, gi, foc, slips, res, rsel, shown, bar, told, lastSync, flash, passed;
/* the rounds, from the pack: the question on the card, the cells and genes, the formula that answers, and what is said */
let ROUNDS;
const round = () => ROUNDS[ri];
const gene = () => round().genes[gi];
const has = id => terms.indexOf(id) >= 0;
const fit = () => TR().fit(round().set, gene(), terms);
const stops = () => TILES.map(t => t.id).concat(round().genes.length > 1 ? ['gene'] : [], ['fit']);
const text = () => TILES.filter(t => has(t.id)).map(t => t.code).join(' + ') || '1';

/* ---------- the chart ---------- */
/* where every sample is drawn. With donor in the formula each line is moved to start from the
   same point, which is what "compared with their own baseline" looks like. */
let placed, placedFor;
function places() {
  const key = ri + '|' + gi + '|' + text();
  if (key === placedFor) return placed;
  const y = TR().series(round().set, gene()), f = fit(), n = TR().N, rebase = !f.jam && has('donor'), out = { y: new Float32Array(2 * n), line: null };
  let mb = 0; for (let d = 0; d < n; d++) mb += y[2 * d] / n;
  for (let d = 0; d < n; d++) for (let v = 0; v < 2; v++) out.y[2 * d + v] = rebase ? y[2 * d + v] - y[2 * d] + mb : y[2 * d + v];
  if (!f.jam) {
    /* what the formula makes of the two groups: its fitted values, averaged over each */
    out.line = [0, 1].map(g => [0, 1].map(v => { let s = 0; for (let d = g * TR().HALF; d < (g + 1) * TR().HALF; d++) s += (rebase ? f.fitted[2 * d + v] - f.fitted[2 * d] + mb : f.fitted[2 * d + v]) / TR().HALF; return s; }));
  }
  placedFor = key;
  return (placed = out);
}
let span;
function scale() { const y = TR().series(round().set, gene()); let lo = Infinity, hi = -Infinity; for (let i = 0; i < y.length; i++) { lo = Math.min(lo, y[i]); hi = Math.max(hi, y[i]); } span = [lo - 0.4, hi + 0.4]; }
const py = v => PY + PH - 14 - (v - span[0]) / (span[1] - span[0]) * (PH - 34);

/* ---------- the tiles ---------- */
function toggle(id, on) {
  const want = on === undefined ? !has(id) : on;
  if (want === has(id)) return;
  terms = want ? terms.concat([id]) : terms.filter(t => t !== id); G.sfx(want ? 'drop' : 'tick'); sync();
  const f = fit();
  if (f.jam) {
    flash = G.t; G.sfx('bad');
    /* the first time a tile jams the bench, Amara says why */
    const why = f.extra.filter(t => JAM[t] && !told[t])[0];
    if (why && want) { told[why] = true; say = new G.Beats([{ say: 'Jammed. ' + JAM[why] }]); after = false; phase = 'said'; }
  }
}
function setGene(k) { gi = k; scale(); shown = null; G.sfx('tick'); sync(); }

/* ---------- the check ---------- */
function verdict() {
  const f = fit(), r = round();
  if (f.jam) return 'Jammed. ' + (JAM[f.extra[0]] || 'One tile says what the others already say.');
  if (!has(r.term)) return r.term === 'visit' ? 'Nothing in that formula says before or after. What treatment changed is the visit tile.'
    : 'visit is what changed in everyone. What changed in responders beyond that is visit:response.';
  if (has('vr') && !has('visit')) return 'Without visit, the formula assumes the others did not change. Put visit in: visit:response is what responders add.';
  if (!has('donor')) return r.unjam ? 'It fits now, but donor was telling more than the tiles you kept. Take out the ones that add nothing.'
    : 'Most of what is left is one patient differing from the next. Each was sampled twice: let donor take that out.';
  if (has('vr') && r.term === 'visit') return 'With visit:response in, visit alone means the patients who did not respond. The question was about everyone.';
  /* the formula is right. Where there are two genes, the one on the bench has to be the one that answers. */
  if (!f.fx[r.term].clear) return r.trapWhy || 'The formula is right, and on this gene its answer is no: nothing stands clear.';
  return null;
}
function check() {
  G.state.tries.formula++; G.save();
  const why = verdict();
  if (why) { slips++; G.sfx('bad'); say = new G.Beats([{ say: why }]); after = false; phase = 'said'; return; }
  G.sfx('ok'); passed = G.t; G.book.goal('r' + (ri + 1), true);
  say = new G.Beats([{ say: round().won }]); after = true; phase = 'said';
}
function advance() {
  say = null;
  if (!after) { phase = 'play'; return; }
  [[], ['f-inter'], ['f-nest', 'f-code', 'f-run', 'f-toy']][ri].forEach(id => G.book.unlock(id));
  if (ri < ROUNDS.length - 1) { ri++; start(); beats = new G.Beats(round().ask.map(s => ({ say: s }))); phase = 'ask'; return; }
  res = { stars: slips === 0 ? 3 : slips === 1 ? 2 : 1 }; phase = 'result'; rsel = 1; lights(); G.sfx('star');
}
function start() { terms = round().start.slice(); gi = 0; foc = 0; shown = null; bar = 1; flash = -9; scale(); sync(); }
function lights() { for (let i = 0; i < ROUNDS.length; i++) G.book.goal('r' + (i + 1), i < ri || phase === 'result' ? true : null); }
function keep() {
  const s = G.state;
  s.weigh = Object.assign({}, s.weigh, { formula: ROUNDS[1].want.map(id => tile(id).code).join(' + ') });
  s.rooms.formula = { done: true, stars: Math.max(s.rooms.formula.stars, res.stars) };
  G.save(); G.go('corridor', { from: 'formula' });
}
function restart() { ri = 0; slips = 0; res = null; told = {}; start(); beats = new G.Beats(intro()); phase = 'ask'; lights(); }

function sync() { const key = ri + '|' + gi + '|' + text(); if (key === lastSync) return; lastSync = key; G.params.wform = '~ ' + text(); G.params.wfgene = gene(); G.book.sync(); }
function showBook() {
  const W = G.sys.changes.bench, f = '<span class="p" data-b="wform"></span>';
  G.book.show({
    floor: 'The Weigh House · Station 5-2', room: 'The formula bench', aim: 'Build the formula that makes the test answer the question on the card.',
    codeFirst: true, file: 'js/stages/changes/formula.js',
    goals: [
      { id: 'r1', text: 'What treatment changed, patient by patient' },
      { id: 'r2', text: 'What changed in responders only' },
      { id: 'r3', text: 'A formula with no tile that the others spell out' },
    ],
    notes: [
      { id: 'f-what', open: true, html: 'A <b>design formula</b> lists what the model may use to explain a gene\'s level in each sample. The test of one term then asks what that term explains once the others have had their say.' },
      { id: 'f-pair', open: true, html: 'Each patient was sampled twice, so the samples come in pairs. With <b>donor</b> in the formula every patient is compared with their own baseline, and what differs between one patient and the next no longer counts as noise.' },
      { id: 'f-inter', html: 'An <b>interaction</b>, written a:b, asks whether the effect of a depends on b. Here visit:response is what treatment changed in responders beyond what it changed in the others. ' + W.note },
      { id: 'f-nest', html: 'A formula jams when one column of the model matrix can be made from the others: the matrix is <b>not of full rank</b>. With donor in, the formula cannot say whether responders differ from the rest, because every donor is one or the other. It can still say whether they change differently.' },
      { id: 'f-code', html: 'The three tiles of round 2 are a model, not a line to type. Given ~ donor + visit + visit:response, the formula library that PyDESeq2 uses builds one interaction column for each visit, and one of them repeats what donor tells. The DESeq2 vignette and the edgeR User\'s Guide each give a layout for patients nested within groups. The code tabs follow them.' },
      { id: 'f-run', html: 'Run cannot be estimated here, and need not be. Each patient\'s two samples shared a run, so a comparison within patients is free of it. Had every "before" sample been in one run and every "after" sample in another, run and visit would be the same column, and no formula could part them.' },
      { id: 'f-toy', html: 'The bench fits each formula by least squares to log2 pseudobulk levels, 24 samples at a time. Real tools fit a negative binomial model to the counts of every gene, and share information between genes to estimate the noise.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'On the bench: <b>' + f + '</b>. Every tool takes the pseudobulk counts and a formula. The second block of each tab is the question of round 2.',
      tabs: [
        { id: 'de', label: 'R · DESeq2', html:
          '<pre class="code"><span class="k">library</span>(DESeq2)\n' +
          '<span class="c"># "before" is the baseline of visit</span>\n' +
          'samples$visit &lt;- <span class="k">factor</span>(samples$visit,\n    levels = c(<span class="s">"before"</span>, <span class="s">"after"</span>))\n\n' +
          '<span class="c"># each donor against their own baseline</span>\n' +
          'dds &lt;- <span class="k">DESeqDataSetFromMatrix</span>(\n    countData = counts,\n    colData = samples,\n    design = ~ donor + visit)\n' +
          'dds &lt;- <span class="k">DESeq</span>(dds)\n' +
          '<span class="k">results</span>(dds, contrast = c(\n    <span class="s">"visit"</span>, <span class="s">"after"</span>, <span class="s">"before"</span>))</pre>' +
          '<pre class="code"><span class="c"># responders only. Donors are nested in\n# the response groups: number them 1 to 6\n# within their group, as ind.n</span>\n' +
          '<span class="k">design</span>(dds) &lt;- ~ response +\n    response:ind.n + response:visit\n' +
          'dds &lt;- <span class="k">DESeq</span>(dds)\n' +
          '<span class="c"># the change in responders, against the\n# change in the other patients</span>\n' +
          '<span class="k">results</span>(dds, contrast = list(\n    <span class="s">"responseR.visitafter"</span>,\n    <span class="s">"responseN.visitafter"</span>))</pre>' },
        { id: 'ed', label: 'R · edgeR', html:
          '<pre class="code"><span class="k">library</span>(edgeR)\n' +
          '<span class="c"># "before" is the baseline of visit</span>\n' +
          'samples$visit &lt;- <span class="k">factor</span>(samples$visit,\n    levels = c(<span class="s">"before"</span>, <span class="s">"after"</span>))\n' +
          'y &lt;- <span class="k">DGEList</span>(counts = counts)\n' +
          'design &lt;- <span class="k">model.matrix</span>(\n    ~ donor + visit, data = samples)\n' +
          '<span class="c"># drop genes with too few counts</span>\n' +
          'keep &lt;- <span class="k">filterByExpr</span>(y, design)\n' +
          'y &lt;- y[keep, , keep.lib.sizes = FALSE]\n' +
          'y &lt;- <span class="k">normLibSizes</span>(y)\n' +
          'y &lt;- <span class="k">estimateDisp</span>(y, design)\n' +
          'fit &lt;- <span class="k">glmQLFit</span>(y, design)\n' +
          'qlf &lt;- <span class="k">glmQLFTest</span>(fit,\n    coef = <span class="s">"visitafter"</span>)\n' +
          '<span class="k">topTags</span>(qlf)</pre>' +
          '<pre class="code"><span class="c"># responders only: one "after" column\n# for each group, added to the donors</span>\n' +
          'design &lt;- <span class="k">model.matrix</span>(\n    ~ donor, data = samples)\n' +
          'after &lt;- samples$visit == <span class="s">"after"</span>\n' +
          'resp &lt;- samples$response == <span class="s">"R"</span>\n' +
          'design &lt;- <span class="k">cbind</span>(design,\n    N.after = after &amp; !resp,\n    R.after = after &amp; resp)\n' +
          'y &lt;- <span class="k">estimateDisp</span>(y, design)\n' +
          'fit &lt;- <span class="k">glmQLFit</span>(y, design)\n' +
          'qlf &lt;- <span class="k">glmQLFTest</span>(fit,\n    contrast = <span class="k">makeContrasts</span>(\n        R.after - N.after,\n        levels = design))</pre>' },
        { id: 'py', label: 'Python · PyDESeq2', html:
          '<pre class="code"><span class="k">import</span> numpy <span class="k">as</span> np\n<span class="k">import</span> pandas <span class="k">as</span> pd\n<span class="k">from</span> pydeseq2.dds <span class="k">import</span> DeseqDataSet\n<span class="k">from</span> pydeseq2.ds <span class="k">import</span> DeseqStats\n\n' +
          '<span class="c"># counts: samples by genes, for one cell\n# type. samples: donor, visit, response,\n# with "before" as the baseline of visit</span>\n' +
          'samples[<span class="s">"visit"</span>] = pd.<span class="k">Categorical</span>(\n    samples[<span class="s">"visit"</span>], [<span class="s">"before"</span>, <span class="s">"after"</span>])\n' +
          'dds = <span class="k">DeseqDataSet</span>(\n    counts=counts,\n    metadata=samples,\n    design=<span class="s">"~ donor + visit"</span>,\n)\n' +
          'dds.<span class="k">deseq2</span>()\n' +
          'res = <span class="k">DeseqStats</span>(dds, contrast=[\n    <span class="s">"visit"</span>, <span class="s">"after"</span>, <span class="s">"before"</span>])\n' +
          'res.<span class="k">summary</span>()\nres.results_df</pre>' +
          '<pre class="code"><span class="c"># responders only: donor_n numbers the\n# donors 1 to 6 within their group</span>\n' +
          'dds = <span class="k">DeseqDataSet</span>(\n    counts=counts,\n    metadata=samples,\n    design=<span class="s">"~ response"</span>\n           <span class="s">" + response:donor_n"</span>\n           <span class="s">" + response:visit"</span>,\n)\n' +
          'dds.<span class="k">deseq2</span>()\n' +
          '<span class="c"># +1 on the responders\' "after" column,\n# -1 on the other patients\'</span>\n' +
          'cols = <span class="k">list</span>(\n    dds.obsm[<span class="s">"design_matrix"</span>].columns)\n' +
          'c = np.<span class="k">zeros</span>(<span class="k">len</span>(cols))\n' +
          'c[cols.<span class="k">index</span>(\n    <span class="s">"response[R]:visit[T.after]"</span>)] = 1\n' +
          'c[cols.<span class="k">index</span>(\n    <span class="s">"response[N]:visit[T.after]"</span>)] = -1\n' +
          'res = <span class="k">DeseqStats</span>(dds, contrast=c)\nres.<span class="k">summary</span>()</pre>' },
      ],
      tip: 'CyteArc has no model with a formula. It sums the pseudobulks, as at the Scales, and its guide hands them to DESeq2 or edgeR.',
    },
  });
}
/* the briefing of the first round */
function intro() {
  const r = ROUNDS[0];
  return [
    { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: r.ask[0] },
    { spot: [0, 130, VW, 50], say: 'Under it, a formula. It tells the test what to take into account. Put tiles in, and watch what is left unexplained.' },
    { spot: [SX, 14, SW, 114], say: 'The card asks a question. Build the formula that answers it, then press FIT.' },
  ];
}

G.scenes.formula = {
  phase: () => phase,
  dbg: { round: () => ri, terms: () => terms.slice(), gene: () => gi, genes: () => round().genes.slice(), foc: () => stops()[foc], slips: () => slips, want: () => round().want.slice(),
    /* the gene of this round on which the question's term stands clear, under the formula that answers */
    answer: () => round().genes.findIndex(g => TR().fit(round().set, g, round().want).fx[round().term].clear),
    fit: () => { const f = fit(); return { jam: f.jam, extra: f.extra, left: f.left, cols: f.cols, rank: f.rank }; },
    spot: (id, k) => (id === 'fit' ? [295, 152] : id === 'gene' ? [PX + PW - 4 - (round().genes.length - k) * 44 + 21, PY + 9] : [tile(id).x + tile(id).w / 2, has(id) ? 141 : 159]) },
  enter() {
    phase = 'load'; load = 0; ri = 0; slips = 0; res = null; rsel = 0; say = null; told = {}; lastSync = null; passed = -9; placedFor = null;
    ROUNDS = G.sys.changes.bench.rounds;
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'formula' }); return; }
    if (phase === 'load') { if (++load < 3) return; TR().build(); start(); beats = new G.Beats(intro()); phase = G.state.tries.formula > 0 ? 'play' : 'ask'; lights(); return; }
    /* lines and the bar slide to where the formula puts them */
    const to = places(), k = Math.min(1, dt * 9);
    if (!shown) shown = { y: Float32Array.from(to.y), line: to.line && to.line.map(g => g.slice()) };
    else { for (let i = 0; i < to.y.length; i++) shown.y[i] += (to.y[i] - shown.y[i]) * k; if (to.line) shown.line = shown.line ? shown.line.map((g, a) => g.map((v, b) => v + (to.line[a][b] - v) * k)) : to.line.map(g => g.slice()); }
    const f = fit(); if (!f.jam) bar += (f.left - bar) * k;
    if (phase === 'ask') { if (beats.update(dt) === 'done') phase = 'play'; return; }
    if (phase === 'said') { if (say.update(dt) === 'done') advance(); return; }
    if (phase === 'result') { const r = G.resultKeys(rsel, true); rsel = r.rsel; if (r.act === 'keep') keep(); else if (r.act === 'retry') restart(); return; }
    const st = stops(), d = (G.rep('right') ? 1 : 0) - (G.rep('left') ? 1 : 0);
    if (d) { foc = G.clamp(foc + d, 0, st.length - 1); G.sfx('tick'); }
    const at = st[foc];
    if (G.hit('up') && tile(at)) toggle(at, true);
    if (G.hit('down') && tile(at)) toggle(at, false);
    /* a tap on a tile moves it */
    if (G.ptr.pressed && G.ptr.y > 130) TILES.forEach((t, i) => { if (G.over(t.x, has(t.id) ? 134 : 152, t.w, 15)) { foc = i; toggle(t.id); } });
    if (phase === 'play' && G.act()) { if (at === 'fit') check(); else if (at === 'gene') setGene((gi + 1) % round().genes.length); else toggle(at); }
  },
  draw() {
    R(0, 0, VW, VH, '#14100c');
    if (phase === 'load') { G.roomHeader('5-2  THE FORMULA BENCH', C.cyan, true); T('LAYING OUT THE TILES...', VW / 2, 84, C.fog, { a: 'center' }); return; }
    drawChart(); drawCard();
    G.roomHeader('5-2  THE FORMULA BENCH', C.cyan, true);
    const y0 = 130;
    if (phase === 'result') {
      const act = G.resultDraw(y0, 'The same 24 samples gave three answers to three formulas. The formula decides what the test is asked.', true, rsel, 'START AGAIN', 'KEEP THE FORMULA');
      if (act === 'keep') keep(); else if (act === 'retry') restart();
      G.stars(250, y0 + 7, res.stars); T(slips + (slips === 1 ? ' SLIP' : ' SLIPS'), 310, y0 + 18, C.steel, { a: 'right' });
      return;
    }
    G.strip(y0);
    drawBench(y0);
    if (phase === 'ask') beats.draw();
    if (phase === 'said') say.draw();
  },
};

/* ---------- drawing ---------- */
function drawBench(y0) {
  const f = fit(), live = phase === 'play', at = stops()[foc], shake = f.jam && G.t - flash < 0.4 ? Math.round(Math.sin(G.t * 60)) : 0;
  /* a tilde, the rail a formula stands on, and the tray under it */
  [[0, 3], [2, 1], [4, 1], [6, 3], [8, 5], [10, 5], [12, 3]].forEach(q => R(6 + q[0], y0 + 7 + q[1], 2, 2, C.paper));
  R(20, y0 + 19, 252, 1, f.jam ? C.coral : C.slate);
  let first = true;
  TILES.forEach(t => {
    const on = has(t.id), y = on ? y0 + 5 : y0 + 23, extra = f.jam && f.extra.indexOf(t.id) >= 0, x = t.x + (extra ? shake : 0), hot = live && at === t.id;
    if (on && !first) T('+', t.x - 4, y0 + 7, C.fog, { a: 'center' });
    if (on) first = false;
    R(x, y, t.w, 13, extra ? C.coral : hot ? C.white : '#0c1329'); R(x + 1, y + 1, t.w - 2, 11, on ? t.c : '#2a3350'); R(x + 1, y + 1, t.w - 2, 1, 'rgba(255,255,255,.35)');
    T(t.name, x + t.w / 2, y + 2, on ? C.ink : C.mist, { a: 'center' });
    /* an arrow on the tile in hand: up into the formula, or down out of it */
    if (hot && Math.floor(G.t * 3) % 2 === 0) { const cx = Math.round(x + t.w / 2), ay = on ? y + 15 : y - 5; for (let i = 0; i < 3; i++) R(cx - i, on ? ay + 2 - i : ay + i, 1 + 2 * i, 1, C.amber); }
  });
  if (G.button('fit', 276, y0 + 8, 38, 28, 'FIT', { primary: true, focus: live && at === 'fit' }) && live) { foc = stops().length - 1; check(); }
  T(G.kt('LEFT, RIGHT: TILE   SPACE: MOVE IT', 'TAP A TILE TO MOVE IT'), 22, y0 + 40, C.steel);
  if (live && !verdict() && at !== 'fit') G.cue(295, y0 + 7, true);
}
function drawChart() {
  const r = round(), f = fit(), n = TR().N, dim = f.jam;
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  G.vdash(XB, PY + 16, PY + PH - 12, '#1c2748', 1, 3); G.vdash(XA, PY + 16, PY + PH - 12, '#1c2748', 1, 3);
  T('BEFORE', XB, PY + PH - 10, C.steel, { a: 'center' }); T('AFTER', XA, PY + PH - 10, C.steel, { a: 'center' });
  if (!shown) return;
  for (let d = n - 1; d >= 0; d--) {
    const c = dim ? '#3a4468' : SIDE[d < TR().HALF ? 0 : 1], a = py(shown.y[2 * d]), b = py(shown.y[2 * d + 1]);
    G.line(XB, a, XA, b, c); R(XB - 1, a - 1, 3, 3, c); R(XA - 1, b - 1, 3, 3, c);
  }
  /* what the formula makes of each group, drawn over the patients */
  if (!dim && shown.line) [1, 0].forEach(g => { const a = py(shown.line[g][0]), b = py(shown.line[g][1]); G.line(XB, a + 1, XA, b + 1, C.ink); G.line(XB, a, XA, b, C.white); G.line(XB, a - 1, XA, b - 1, g ? '#b9c6ff' : '#ffc9c4'); });
  if (dim) { const w = Math.ceil(G.tw('JAMMED', 'lg')) + 12, x = Math.round(PX + PW / 2 - w / 2); R(x, PY + 44, w, 20, C.coral); R(x + 2, PY + 46, w - 4, 16, '#0e1630'); T('JAMMED', PX + PW / 2, PY + 46, C.coral, { a: 'center', f: 'lg' }); }
  /* the gene on the bench, and the other one where a round has two */
  if (r.genes.length > 1) {
    r.genes.forEach((g, k) => {
      const w = Math.ceil(G.tw(g, 'sm')) + 10, x = PX + PW - 4 - (r.genes.length - k) * 44, hot = phase === 'play' && stops()[foc] === 'gene';
      if (G.button('gene' + k, x, PY + 3, 42, 12, g, { primary: k === gi, focus: hot && k === gi, accent: C.amber, fill: C.deep }) && phase === 'play' && k !== gi) { foc = stops().indexOf('gene'); setGene(k); }
    });
    T(r.cells, PX + 4, PY + 4, C.fog);
  } else { T(gene(), PX + 4, PY + 4, C.amber, { f: 'smb' }); T('IN ' + r.cells, PX + 8 + Math.ceil(G.tw(gene(), 'smb')), PY + 4, C.fog); }
  R(PX + 4, PY + 17, 4, 4, SIDE[0]); T('RESPONDERS', PX + 11, PY + 15, C.steel); R(PX + 78, PY + 17, 4, 4, SIDE[1]); T('OTHERS', PX + 85, PY + 15, C.steel);
}
/* the card: the question, what is left unexplained, and what each term comes to */
function drawCard() {
  const x = SX, wd = SW, r = round(), f = fit();
  G.panel(x, 14, wd, 114, { border: G.t - passed < 1.2 ? C.mint : C.slate, fill: '#0e1630' });
  T('ROUND ' + (ri + 1) + ' OF ' + ROUNDS.length, x + 6, 17, C.amber, { f: 'smb' });
  r.card.forEach((l, i) => T(l, x + 6, 28 + i * 9, C.white));
  R(x + 5, 49, wd - 10, 1, C.slate);
  T('LEFT UNEXPLAINED', x + 6, 52, C.fog); T(f.jam ? '?' : TR().pc(f.left), x + wd - 6, 52, f.jam ? C.coral : C.white, { a: 'right' });
  R(x + 6, 62, wd - 12, 5, C.slate);
  if (f.jam) for (let i = 0; i < wd - 12; i += 4) R(x + 6 + i, 62, 2, 5, C.coral); else R(x + 6, 62, Math.round((wd - 12) * G.clamp(bar, 0, 1)), 5, C.amber);
  R(x + 5, 71, wd - 10, 1, C.slate);
  /* each term that is one column: its estimate and 95% interval on an axis with nothing in the middle */
  const mid = x + 6 + Math.round((wd - 12) / 2), px = 20;
  ['visit', 'response', 'vr'].filter(has).forEach((id, i) => {
    const y = 74 + i * 14, t = tile(id), e = !f.jam && f.fx[id], ask = id === r.term;
    T(t.name, x + 6, y, ask ? C.white : C.mist); if (ask) T('?', x + wd - 6, y, C.amber, { a: 'right', f: 'smb' });
    R(x + 6, y + 10, wd - 12, 1, '#1c2748'); R(mid, y + 8, 1, 5, C.steel);
    if (!e) return;
    const c = e.clear ? C.mint : C.steel, lo = G.clamp(mid + Math.round(e.lo * px), x + 6, x + wd - 7), hi = G.clamp(mid + Math.round(e.hi * px), x + 6, x + wd - 7);
    R(lo, y + 10, hi - lo + 1, 1, c); R(lo, y + 9, 1, 3, c); R(hi, y + 9, 1, 3, c); R(G.clamp(mid + Math.round(e.est * px), x + 6, x + wd - 8) - 1, y + 8, 3, 5, c);
  });
  T('COLUMNS ' + f.cols, x + 6, 118, f.jam ? C.coral : C.steel); T('RANK ' + f.rank, x + wd - 6, 118, f.jam ? C.coral : C.steel, { a: 'right' });
}
})();
