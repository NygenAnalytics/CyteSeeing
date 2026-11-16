/* Station 5-3, the Stairs. Two hundred genes, each tested on the donors and sorted by p-value: a
   staircase that rises from left to right. The player sets a rule and a rate and watches which
   steps light up: a flat line at the rate, a flat line at the rate divided by the number of genes
   (Bonferroni), or a ruler hinged at the foot whose slope is the rate over the number of genes
   (Benjamini-Hochberg: the last step under the ruler, and every step before it). Beside the
   stairs, a count of how many steps the line would light if no gene had changed at all.
   On CHECK the game, which planted the real effects, counts real and false among the lit steps.
   The p-values and the cut of every rule are worked out from the samples (see trial.stairs, trial.rule). */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const PX = 6, PY = 16, PW = 206, PH = 110, SX = 216, SW = 100, X0 = PX + 8, CW = PW - 14, Y0 = PY + PH - 12, CH = PH - 32;
const TR = () => G.trial;
const RULES = [{ id: 'plain', name: 'FLAT LINE', w: 58 }, { id: 'bonf', name: 'BONFERRONI', w: 66 }, { id: 'bh', name: 'BENJAMINI-HOCHBERG', w: 106 }];
RULES.forEach((r, i) => { r.x = i ? RULES[i - 1].x + RULES[i - 1].w + 3 : 8; });
/* what the chart shows: the first steps and the lowest p-values, close up for the two rules that live at the foot of the stairs */
const VIEW = { plain: [72, 0.25], bonf: [36, 0.012], bh: [36, 0.012] };
const STONE = '#59658c', DARKSTONE = '#39425f';

let phase, load, beats, ri, qi, st, view, res, rsel, slips, lastSync, hist, swing, cells;
const rule = () => RULES[ri].id, rate = () => TR().RATES[qi];
const now = () => TR().rule(rule(), rate());
const pct = r => Math.round(r * 100) + '%';

function setRule(i) { i = G.clamp(i, 0, RULES.length - 1); if (i === ri) return; ri = i; swing = G.t; G.sfx('door'); lights(); sync(); }
function setRate(i) { i = G.clamp(i, 0, TR().RATES.length - 1); if (i === qi) return; qi = i; swing = G.t; G.sfx('tick'); lights(); sync(); }
function lights() {
  const done = phase === 'locked' || phase === 'result';
  G.book.goal('clean', done ? res.clean : null); G.book.goal('full', done ? res.full : null);
}
function sync() {
  const key = ri + '|' + qi; if (key === lastSync) return; lastSync = key;
  G.params.wrule = rule(); G.params.wrate = String(rate()); G.params.wadj = { plain: 'none', bonf: 'bonferroni', bh: 'fdr_bh' }[rule()]; G.params.wradj = { plain: 'none', bonf: 'bonferroni', bh: 'BH' }[rule()];
  G.book.sync();
}
/* why a rule fails, or what makes the one that passes work. The counts are on the screen, so Amara gives the reason only. */
function verdict() {
  if (res.clean && res.full) return 'The ruler rises step by step: the more genes pass, the more it lets in. About one lit step in twenty is false, as asked.';
  if (!res.clean) return rule() === 'bh' ? 'The slope is the share of false alarms you accept among the lit steps. This slope accepts more than one in twenty.'
    : 'Every gene where nothing changed has that chance of passing a flat line. Test two hundred of them, and some are sure to.';
  return rule() === 'bonf' ? 'Bonferroni guards against even one false alarm. The price is on the floor: most of what is real stays dark.'
    : 'One false alarm in a hundred is a strict order. To fill it the ruler lies so flat that real effects are left out.';
}
function check() {
  G.state.tries.stairs++; G.save();
  res = TR().judge(rule(), rate()); res.pass = res.clean && res.full;
  if (!res.pass) slips++;
  res.stars = slips === 0 ? 3 : slips === 1 ? 2 : 1;
  phase = res.pass ? 'result' : 'locked'; rsel = res.pass ? 1 : 0;
  ['t-fwer', 't-known'].forEach(n => G.book.unlock(n)); if (res.pass) ['t-bh', 't-avg', 't-filter', 't-tools', 't-toy'].forEach(n => G.book.unlock(n));
  lights(); G.sfx(res.pass ? 'star' : 'bad');
}
function keep() {
  const s = G.state;
  s.weigh = Object.assign({}, s.weigh, { rule: rule(), rate: rate(), found: res.lit });
  s.rooms.stairs = { done: true, stars: Math.max(s.rooms.stairs.stars, res.stars) };
  G.save(); G.go('corridor', { from: 'stairs' });
}
function retry() { if (phase === 'result') slips = 0; phase = 'play'; res = null; lights(); }

function showBook() {
  const q = '<span class="p" data-b="wrate"></span>', on = (k, t) => '<span class="hl" data-on="wrule=' + k + '">' + t + '</span>';
  G.book.show({
    floor: 'The Weigh House · Station 5-3', room: 'The Stairs', aim: 'Two hundred genes were tested. Choose the rule that lights the real effects, and few others.',
    codeFirst: true, file: 'js/stages/changes/stairs.js',
    goals: [
      { id: 'clean', text: 'At most 1 lit step in 20 is a false alarm' },
      { id: 'full', text: 'At least two thirds of the real effects are lit' },
    ],
    notes: [
      { id: 't-p', open: true, html: 'A <b>p-value</b> is the chance of a result at least this extreme if the gene did not change. Where nothing changed, every p-value is as likely as any other, so of 200 such genes about 10 have p below 0.05.' },
      { id: 't-fwer', html: '<b>Bonferroni</b> divides the threshold by the number of tests. That keeps the chance of even one false alarm below the rate (the family-wise error rate), which is the right aim for a handful of claims and too strict for a screen of thousands of genes.' },
      { id: 't-bh', html: '<b>Benjamini-Hochberg</b>: sort the p-values, find the last one that is at most rank × rate ÷ number of tests, and call it and every gene before it. The expected share of false calls among the calls is then at most the rate: the <b>false discovery rate</b>. A gene\'s adjusted p-value (padj, FDR) is the smallest rate at which it would be called.' },
      { id: 't-avg', html: 'The rate is kept on average over many experiments, not in each one. The guarantee is for tests that are independent, or that tend to agree with one another. Genes are not independent, and the procedure is used all the same.' },
      { id: 't-filter', html: 'The number of tests is partly a choice. Genes with too few counts to ever reach significance are removed before the correction (edgeR\'s filterByExpr, the independent filtering of DESeq2), which leaves fewer tests to pay for.' },
      { id: 't-tools', html: 'Check what "adjusted" means in the table you are reading. DESeq2, edgeR and limma report Benjamini-Hochberg by default. Seurat\'s FindMarkers reports Bonferroni over all the genes in the data.' },
      { id: 't-known', html: 'The game knows which effects are real because it made the data. With real data nobody knows, which is why a rule is chosen for the rate of false alarms it keeps, and not for the result it gives.' },
      { id: 't-toy', html: 'The test on the stairs is the one from the formula bench, ~ donor + visit, on the log2 pseudobulk level of each of 200 genes in ' + G.sys.changes.stairs.cells + '. With twelve patients that is a paired t-test.' },
    ],
    term: {
      title: 'Same step, in code',
      intro: 'The <b>highlighted values</b> are the rate and the rule on the stairs. The bright line is the rule in use.',
      tabs: [
        { id: 'r', label: 'R', html:
          '<pre class="code"><span class="c"># p: one p-value for each gene tested</span>\n' +
          on('plain', 'called &lt;- p &lt; ' + q) + '\n' +
          on('bonf', 'called &lt;- <span class="k">p.adjust</span>(p,\n    method = <span class="s">"bonferroni"</span>) &lt; ' + q) + '\n' +
          on('bh', 'called &lt;- <span class="k">p.adjust</span>(p,\n    method = <span class="s">"BH"</span>) &lt; ' + q) + '\n' +
          '<span class="k">sum</span>(called)\n\n' +
          '<span class="c"># DESeq2 adjusts by BH. Tell it the rate,\n# which it also uses to filter out genes\n# with too few counts</span>\n' +
          'res &lt;- <span class="k">results</span>(dds, alpha = ' + q + ')\n' +
          '<span class="k">sum</span>(res$padj &lt; ' + q + ', na.rm = TRUE)\n\n' +
          '<span class="c"># edgeR, limma: BH unless told otherwise</span>\n' +
          '<span class="k">topTags</span>(qlf, n = Inf,\n    adjust.method = <span class="s">"BH"</span>)</pre>' },
        { id: 'py', label: 'Python · statsmodels', html:
          '<pre class="code"><span class="k">from</span> statsmodels.stats.multitest <span class="k">import</span> (\n    multipletests)\n\n' +
          '<span class="c"># p: one p-value for each gene tested</span>\n' +
          on('plain', 'called = p &lt; ' + q) + '\n' +
          on('bonf', 'called, padj, _, _ = <span class="k">multipletests</span>(\n    p, alpha=' + q + ', method=<span class="s">"bonferroni"</span>)') + '\n' +
          on('bh', 'called, padj, _, _ = <span class="k">multipletests</span>(\n    p, alpha=' + q + ', method=<span class="s">"fdr_bh"</span>)') + '\n' +
          'called.<span class="k">sum</span>()\n\n' +
          '<span class="c"># PyDESeq2 adjusts by BH. Tell it the rate</span>\n' +
          'res = <span class="k">DeseqStats</span>(\n    dds,\n    contrast=[<span class="s">"visit"</span>, <span class="s">"after"</span>, <span class="s">"before"</span>],\n    alpha=' + q + ',\n)\nres.<span class="k">summary</span>()\n' +
          '(res.results_df[<span class="s">"padj"</span>] &lt; ' + q + ').<span class="k">sum</span>()</pre>' },
        { id: 'ca', label: 'Python · CyteArc', html:
          '<pre class="code"><span class="k">from</span> cytearc.plotting <span class="k">import</span> (\n    CellField, StudyDesign)\n\n' +
          '<span class="c"># each donor after against before, gene\n# by gene, on the mean of their cells</span>\n' +
          'result = ds.compare.<span class="k">test</span>(\n    genes,\n    CellField(<span class="s">"visit"</span>),\n    cell_selection=cells,\n    groups=[<span class="s">"before"</span>, <span class="s">"after"</span>],\n    study_design=StudyDesign(\n        sample_by=<span class="s">"sample"</span>,\n        pair_by=<span class="s">"donor"</span>),\n    test=<span class="s">"wilcoxon"</span>,\n' +
          '    adjustment=<span class="s">"<span class="p" data-b="wadj"></span>"</span>,\n)\n' +
          '<span class="c"># p_value and p_value_adjusted, per gene</span>\n' +
          'result.tables[genes[0]]</pre>' },
      ],
    },
  });
}

G.scenes.stairs = {
  phase: () => phase,
  dbg: { rule: () => rule(), rate: () => rate(), ri: () => ri, qi: () => qi, slips: () => slips, now: () => { const r = now(); return { lit: r.lit, cut: r.cut, chance: r.chance }; },
    /* which settings pass, for a test that wants to know where to go */
    pass: () => { const out = []; RULES.forEach((r, a) => TR().RATES.forEach((q, b) => { const j = TR().judge(r.id, q); if (j.clean && j.full) out.push([a, b]); })); return out; },
    spot: (kind, i) => (kind === 'rule' ? [RULES[i].x + RULES[i].w / 2, 142] : kind === 'rate' ? [58 + i * 30 + 13, 161] : [282, 152]) },
  enter() {
    phase = 'load'; load = 0; ri = 0; qi = 1; res = null; rsel = 0; slips = 0; lastSync = null; swing = -9; view = null;
    cells = G.sys.changes.stairs.cells;
    beats = new G.Beats([
      { spot: [PX - 1, PY - 1, PW + 2, PH + 2], say: '200 genes in ' + cells + ', each tested on the twelve patients and sorted by p-value. The smallest p is the lowest step.' },
      { spot: [SX, 14, SW, 114], say: 'Where nothing changed, a p-value can land anywhere, so the bars are level. The tall bar near zero is where something did.' },
      { spot: [0, 130, VW, 50], say: 'Pick a rule and a rate. Steps under the line light up: allow one false alarm in twenty, and keep most of what is real.' },
    ]);
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'stairs' }); return; }
    if (phase === 'load') {
      if (++load < 3) return;
      st = TR().stairs(); hist = new Array(20).fill(0); st.steps.forEach(s => { hist[Math.min(19, Math.floor(s.p * 20))]++; });
      view = VIEW[rule()].slice(); phase = G.state.tries.stairs > 0 ? 'play' : 'intro'; lights(); sync();
      return;
    }
    /* the chart moves in or out to where the rule draws its line */
    const to = VIEW[rule()], k = Math.min(1, dt * 6);
    if (!view) view = to.slice(); else { view[0] += (to[0] - view[0]) * k; view[1] *= Math.pow(to[1] / view[1], k); }
    if (phase === 'intro') { if (beats.update(dt) === 'done') phase = 'play'; }
    else if (phase === 'play') {
      if (G.rep('right')) setRule(ri + 1); if (G.rep('left')) setRule(ri - 1);
      if (G.rep('up')) setRate(qi + 1); if (G.rep('down')) setRate(qi - 1);
      if (G.act()) check();
    } else {
      const r = G.resultKeys(rsel, res.pass); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') retry();
    }
    sync();
  },
  draw() {
    R(0, 0, VW, VH, '#14100c');
    if (phase === 'load') { G.roomHeader('5-3  THE STAIRS', C.lilac, true); T('SORTING TWO HUNDRED GENES...', VW / 2, 84, C.fog, { a: 'center' }); return; }
    drawStairs(); drawSide();
    G.roomHeader('5-3  THE STAIRS', C.lilac, true);
    const y0 = 130;
    if (phase === 'locked' || phase === 'result') {
      const act = G.resultDraw(y0, verdict(), res.pass, rsel, res.pass ? 'TRY ANOTHER' : 'CHANGE THE RULE', 'KEEP THIS RULE');
      if (act === 'keep') keep(); else if (act === 'retry') retry();
      return;
    }
    G.strip(y0);
    const live = phase === 'play';
    /* the rule and the rate in use are the lit ones */
    RULES.forEach((r, i) => { if (G.button('rule' + i, r.x, y0 + 4, r.w, 16, r.name, { primary: i === ri, fill: '#8a5a12', accent: C.amber }) && live) setRule(i); if (i === ri) R(r.x + 2, y0 + 20, r.w - 4, 1, C.amber); });
    T('RATE', 10, y0 + 28, C.fog);
    TR().RATES.forEach((q, i) => { if (G.button('rate' + i, 58 + i * 30, y0 + 24, 27, 15, pct(q), { primary: i === qi, fill: '#8a5a12', accent: C.amber }) && live) setRate(i); if (i === qi) R(60 + i * 30, y0 + 39, 23, 1, C.amber); });
    T(G.kt('LEFT, RIGHT: RULE   UP, DOWN: RATE', 'TAP A RULE AND A RATE'), 10, y0 + 41, C.steel);
    if (G.button('check', 250, y0 + 8, 64, 28, 'CHECK', { primary: true, focus: live }) && live) check();
    if (phase === 'intro') beats.draw();
  },
};

/* ---------- drawing ---------- */
const sx = k => X0 + k * CW / view[0];                      /* the left edge of step k + 1 */
const sy = p => Y0 - Math.min(1, p / view[1]) * CH;
function drawStairs() {
  const r = now(), shownRes = phase === 'locked' || phase === 'result', m = st.m;
  R(PX - 1, PY - 1, PW + 2, PH + 2, C.slate); R(PX, PY, PW, PH, '#0e1630');
  const n = Math.min(m, Math.ceil(view[0]));
  for (let k = 0; k < n; k++) {
    const s = st.steps[k], x = Math.round(sx(k)), w = Math.max(1, Math.round(sx(k + 1)) - x), top = Math.round(sy(s.p)), off = s.p > view[1], lit = k < r.lit;
    let c = lit ? C.amber : off ? DARKSTONE : STONE;
    if (shownRes) c = lit ? (s.real ? C.mint : C.coral) : s.real ? '#3f6a55' : off ? DARKSTONE : STONE;
    R(x, top, w, Y0 - top + 1, c); if (w > 2) { R(x + w - 1, top, 1, Y0 - top + 1, 'rgba(0,0,0,.3)'); R(x, top, w - 1, 1, 'rgba(255,255,255,.3)'); }
  }
  R(X0 - 1, Y0 + 1, CW + 2, 1, C.steel);
  /* the line of the rule: flat, or a ruler from the foot of the stairs */
  const u = G.clamp((G.t - swing) / 0.35, 0, 1);
  if (rule() === 'bh') {
    const slope = rate() / m, kTop = Math.min(view[0], view[1] / slope), ex = sx(kTop), ey = sy(kTop * slope);
    const x1 = X0 + (ex - X0) * u, y1 = Y0 + (ey - Y0) * u;
    G.line(X0, Y0 + 1, x1, y1 + 1, C.ink); G.line(X0, Y0, x1, y1, C.paper); G.line(X0, Y0 - 1, x1, y1 - 1, '#b0303a');
    R(X0 - 2, Y0 - 2, 5, 5, C.oil); R(X0 - 1, Y0 - 1, 3, 3, C.ink);
    /* where the last step under the ruler puts the cut */
    if (r.lit) { G.hdash(X0, Math.round(sx(r.lit)), Math.round(sy(r.cut)), 'rgba(255,255,255,.55)', 2, 2); }
  } else {
    const y = Math.round(sy(r.cut)); G.hdash(X0, X0 + Math.round(CW * u), y, C.paper, 4, 2); G.hdash(X0, X0 + Math.round(CW * u), y - 1, '#b0303a', 4, 2);
  }
  /* what the chart is showing */
  T('P', PX + 3, PY + 3, C.steel); T(view[1] < 0.02 ? view[1].toFixed(3) : view[1].toFixed(2), PX + 11, PY + 3, C.steel);
  T('THE FIRST ' + Math.round(view[0]) + ' OF ' + m + ' GENES', PX + PW - 4, PY + PH - 10, C.steel, { a: 'right' });
  const lab = rule() === 'plain' ? 'P UP TO ' + rate() : rule() === 'bonf' ? 'P UP TO ' + rate() + ' / ' + m : 'P UP TO RANK x ' + rate() + ' / ' + m;
  T(lab, PX + PW - 4, PY + 3, C.paper, { a: 'right' });
}
function drawSide() {
  const x = SX, wd = SW, r = now(), shownRes = phase === 'locked' || phase === 'result';
  G.panel(x, 14, wd, 114, { border: C.slate, fill: '#0e1630' });
  /* every p-value, in twenty bins from 0 to 1 */
  T('ALL ' + st.m + ' P-VALUES', x + 6, 17, C.mist);
  const top = Math.max.apply(null, hist), bw = 4, bx = x + 9, by = 58;
  hist.forEach((h, i) => { const hh = Math.max(1, Math.round(h / top * 28)); R(bx + i * bw, by - hh, bw - 1, hh, i === 0 ? C.amber : C.steel); });
  R(bx - 1, by, 20 * bw + 1, 1, C.slate); T('0', bx - 1, by + 2, C.steel); T('1', bx + 20 * bw - 5, by + 2, C.steel);
  R(x + 5, 70, wd - 10, 1, C.slate);
  if (shownRes) {
    T('LIT', x + 6, 74, C.fog); T(String(res.lit), x + wd - 6, 74, C.white, { a: 'right', f: 'smb' });
    R(x + 7, 87, 5, 5, C.mint); T('REAL', x + 16, 85, C.fog); T(res.real + ' OF ' + st.real, x + wd - 6, 85, res.full ? C.mint : C.coral, { a: 'right', f: 'smb' });
    R(x + 7, 98, 5, 5, C.coral); T('FALSE', x + 16, 96, C.fog); T(String(res.wrong), x + wd - 6, 96, res.clean ? C.mint : C.coral, { a: 'right', f: 'smb' });
    if (res.pass) G.stars(x + 6, 112, res.stars); T(slips + (slips === 1 ? ' SLIP' : ' SLIPS'), x + wd - 6, 112, C.steel, { a: 'right' });
    return;
  }
  T('LIT', x + 6, 74, C.fog); T(String(r.lit), x + wd - 6, 71, C.amber, { a: 'right', f: 'lg' });
  /* how many steps this line would light if nothing had changed in any gene */
  T('BY CHANCE', x + 6, 92, C.fog); T('ALONE', x + 6, 101, C.fog);
  T(r.chance >= 10 ? String(Math.round(r.chance)) : r.chance < 0.05 ? '0' : r.chance.toFixed(1), x + wd - 6, 93, C.white, { a: 'right', f: 'lg' });
  T(G.kt('SPACE: CHECK', 'THEN TAP CHECK'), x + 6, 117, C.steel);
}
})();
