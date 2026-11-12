/* Room 1-1, the droplet bay. A microfluidic chip: cells and barcoded beads meet, oil pinches
   them into droplets. The player sets how many cells to load and across how many lanes.
   Rule of thumb used here: about 0.8% doublets per 1,000 cells recovered on a standard chip. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;

const GOAL_CELLS = 8000, GOAL_RATE = 0.04;
const JX = 126, CY = 62, EXIT_X = 236, TUBE_X = 250;

/* Mika's walk through the chip. The animation on screen follows the step: see stream(). */
const BEATS = [
  { say: 'Your tissue is now single cells. They flow into the chip from the left, one after another.' },
  { say: 'Gel beads come in from the top. Every bead carries its own barcode.' },
  { say: 'Oil pinches the stream into droplets. One bead and one cell in a droplet: all of that cell\'s RNA gets the same barcode.' },
  { say: 'Most droplets get no cell. A few get two. Those are doublets: two cells sharing one barcode.' },
  { spot: [0, 111, VW, 69], say: 'Collect 8,000 single cells, with 4% doublets or fewer. Set the cells per lane and the number of lanes. Then press RUN.' },
];

const POKE = [
  { r: [4, 50, 26, 26], say: ['CELLS: 92% VIABLE, 100% NERVOUS.', 'CELLS: SINGLE FILE, PLEASE.'] },
  { r: [53, 15, 22, 22], say: ['BEADS: EACH KNOWS ONLY ITS OWN BARCODE.', 'BEADS: MILLIONS OF OLIGOS, ONE OPINION.'] },
  { r: [116, 15, 20, 38], say: ['OIL: KEEPS EVERYONE IN THEIR OWN BUBBLE.', 'OIL: THE REAGENT NOBODY THANKS.'] },
  { r: [116, 72, 20, 36], say: ['OIL: KEEPS EVERYONE IN THEIR OWN BUBBLE.', 'OIL: THE REAGENT NOBODY THANKS.'] },
  { r: [238, 40, 24, 68], say: ['TUBE: DO NOT DROP. NO, SERIOUSLY.', 'TUBE: A WEEK OF WORK IN 100 MICROLITRES.'] },
];
let pokeN = 0;
let phase, beats, now, R_, lanes, sel, planned, lastPlan, cells, beads, drops, landed, run, res, rnd, forecast, rsel, dblSeen, say;

function compute(r, n) {
  const d = 0.008 * r / 1000, dbl = Math.round(r * d), lam = 2 * d;
  const empties = Math.round(r / (1 - Math.exp(-lam)) - r);
  return { R: r, lanes: n, rate: d, singlets: (r - dbl) * n, doublets: dbl * n, empties: empties * n };
}
function judge(o) {
  const okCells = o.singlets >= GOAL_CELLS, okRate = o.rate <= GOAL_RATE + 1e-9;
  const pass = okCells && okRate;
  return { okCells, okRate, pass, stars: pass ? (o.lanes <= 2 ? 3 : o.lanes === 3 ? 2 : 1) : 0 };
}

/* what the stream looks like in each phase */
function stream() {
  if (phase === 'intro') {
    const i = beats.i;
    return { P: 0.62, travel: 2.6, lam: i === 3 ? 0.5 : 0.38, beads: i >= 1, rings: i >= 2, maxK: i === 3 ? 2 : 1, force: i === 3 ? 5 : 0, mark: i === 3 };
  }
  const lam = 2 * 0.008 * R_ / 1000;
  if (phase === 'run') return { P: 0.13, travel: 1.0, lam, beads: true, rings: true, maxK: 3, force: 0, mark: true };
  return { P: 0.3, travel: 1.8, lam, beads: true, rings: true, maxK: 3, force: 0, mark: forecast };
}
function verdict() {
  const o = res.o, j = res.j;
  if (!j.okRate && j.okCells) return 'Enough cells, but too many doublets. The more cells you load into one lane, the more doublets: about 0.8% per 1,000 cells. Load fewer per lane, and use more lanes.';
  if (j.okRate && !j.okCells) return 'Few doublets, but not enough cells. One lane cannot give more at this rate. Use more lanes.';
  if (!j.pass) return 'Too few cells and too many doublets. Load fewer cells per lane, and use more lanes.';
  if (j.stars === 3) return 'Enough cells, and few doublets. Splitting them across lanes kept the rate down. The ' + G.fmt(o.doublets) + ' doublets you did make stay in the data until room 1-5.';
  return 'It works, but two lanes would have been enough. Every lane is another kit.';
}
function resetStream() { planned = []; cells = []; beads = []; drops = []; lastPlan = now; dblSeen = 0; }

function showBook() {
  G.book.show({
    floor: 'Ground floor · Room 1-1', room: 'The droplet bay', aim: 'Load the chip so that you get enough single cells without too many doublets.', file: 'js/droplets.js',
    goals: [
      { id: 'cells', text: 'At least 8,000 singlets' },
      { id: 'rate', text: 'Doublets at 4% or less' },
      { id: 'lanes', text: 'Use as few lanes as you can' },
    ],
    notes: [
      { id: 'd-bead', open: true, html: 'A droplet needs <b>one bead and one cell</b>. Beads are packed so nearly every droplet gets one. Cells are dilute, so most droplets get none.' },
      { id: 'd-rule', html: 'Rule of thumb on a standard 10x chip: about <b>0.8% doublets per 1,000 cells recovered</b>. 10,000 cells means about 8%. The rate is set by how many cells you load, not by the instrument.' },
      { id: 'd-later', html: 'Doublets that get through are found later, in code, with tools such as <b>scDblFinder</b> or <b>Scrublet</b>. Run them on each lane by itself, never on lanes pooled together.' },
    ],
    term: {
      title: 'What happens to the library next',
      intro: 'No code at the bench. Once the lanes are sequenced, one command turns the reads into a count matrix:',
      tabs: [{ id: 'cr', label: 'Cell Ranger', html:
        '<pre class="code"><span class="c"># one run per lane</span>\n' +
        '<span class="k">cellranger count</span> --id=lane1 \\\n' +
        '  --transcriptome=refdata-gex-GRCh38-2024-A \\\n' +
        '  --fastqs=fastqs/ --sample=tissue_lane1 \\\n' +
        '  --create-bam=false</pre>' }],
      tip: 'Other tools do the same job: STARsolo, alevin-fry, kallisto | bustools.',
    },
  });
}

G.scenes.droplets = {
  phase: () => phase,
  enter() {
    rnd = G.rng(42);
    now = 0; R_ = 9000; lanes = 1; sel = 0; rsel = 1; res = null; run = null; landed = 0;
    forecast = !!G.state.notes['d-rule'];
    if (G.state.load) { R_ = G.state.load.R; lanes = G.state.load.lanes; }
    phase = G.state.rooms.droplets.done || G.state.tries.droplets > 0 ? 'config' : 'intro';
    beats = new G.Beats(BEATS);
    resetStream();
    showBook();
  },
  update(dt) {
    now += dt;
    if (G.hit('b') && phase !== 'run') { G.go('corridor', { from: 'droplets' }); return; }
    simulate(dt);

    if (phase === 'intro') {
      const was = beats.i;
      const r = beats.update(dt);
      if (beats.i !== was) resetStream();
      if (r === 'done') { phase = 'config'; resetStream(); }
    } else if (phase === 'config') {
      if (G.hit('up')) sel = (sel + 2) % 3;
      if (G.hit('down')) sel = (sel + 1) % 3;
      const step = (G.rep('right') ? 1 : 0) - (G.rep('left') ? 1 : 0);
      if (step && sel === 0) { R_ = G.clamp(R_ + step * 500, 1000, 16000); G.sfx('tick'); }
      if (step && sel === 1 && G.hit(step > 0 ? 'right' : 'left')) { lanes = G.clamp(lanes + step, 1, 4); G.sfx('tick'); }
      if (G.hit('a')) startRun();
      if (G.ptr.pressed && G.ptr.y < 110) {
        const h = POKE.find(p => G.over(p.r[0], p.r[1], p.r[2], p.r[3]));
        if (h) { G.toast(h.say[pokeN++ % h.say.length], 3.5); G.sfx('pop'); }
      }
    } else if (phase === 'run') {
      run.t += dt;
      if (G.skip() && run.t > 0.3) run.t = run.D;
      if (run.t >= run.D) finish();
    } else if (phase === 'result') {
      const j = res.j;
      /* Mika says why first */
      if (say) { if (say.update(dt) === 'done') say = null; return; }
      if (G.hit('left') || G.hit('right')) { rsel = 1 - rsel; G.sfx('tick'); }
      if (G.hit('a')) { if (rsel === 1 && j.pass) keep(); else retry(); }
    }
  },
  draw() {
    drawChip();
    drawStream();
    drawTally();
    G.roomHeader('1-1  DROPLET BAY', C.cyan, phase !== 'run');

    if (phase === 'intro') { drawConfig(); beats.draw(); }
    else if (phase === 'config') drawConfig();
    else if (phase === 'run') drawRun();
    else if (phase === 'result') { drawResult(); if (say) say.draw({ top: true }); }
  },
};

function startRun() {
  G.state.tries.droplets++; G.save();
  phase = 'run'; resetStream(); landed = 0;
  run = { t: 0, D: G.reduced ? 1.2 : 6.5, o: compute(R_, lanes) };
  ['cells', 'rate', 'lanes'].forEach(g => G.book.goal(g, null));
  G.sfx('ok');
}
function finish() {
  const o = run.o, j = judge(o);
  res = { o, j }; phase = 'result'; rsel = j.pass ? 1 : 0; say = new G.Beats([{ say: verdict() }]);
  G.book.goal('cells', j.okCells); G.book.goal('rate', j.okRate);
  G.book.goal('lanes', j.pass ? (j.stars === 3 ? true : false) : null);
  G.book.unlock('d-rule'); forecast = true;
  if (j.pass) G.book.unlock('d-later');
  G.sfx(j.pass ? 'star' : 'bad');
}
function retry() { phase = 'config'; res = null; resetStream(); landed = 0; sel = 0; }
function keep() {
  const s = G.state, o = res.o;
  s.load = { R: o.R, lanes: o.lanes, singlets: o.singlets, doublets: o.doublets, rate: o.rate };
  s.rooms.droplets = { done: true, stars: Math.max(s.rooms.droplets.stars, res.j.stars) };
  G.save();
  G.go('corridor', { from: 'droplets', toast: 'THE ' + G.fmt(o.doublets) + ' DOUBLETS GO WITH YOU' });
}

/* ---------- the stream of cells, beads and droplets ---------- */
function simulate(dt) {
  const s = stream();
  /* plan droplets far enough ahead that their cells have time to travel the channel */
  let guard = 0;
  while (lastPlan < now + s.travel && guard++ < 200) {
    lastPlan += s.P;
    let k = Math.min(s.maxK, G.poisson(s.lam, rnd));
    dblSeen++;
    if (s.force && dblSeen % s.force === 0) k = 2;
    planned.push({ at: lastPlan, k });
    for (let i = 0; i < k; i++) {
      cells.push({ t0: lastPlan - s.travel, t1: lastPlan - i * Math.min(0.12, s.P * 0.45), c: G.TYPES[Math.floor(rnd() * G.TYPES.length)], dy: Math.floor(rnd() * 5) - 2, at: lastPlan });
    }
    if (s.beads) beads.push({ t0: lastPlan - s.travel, t1: lastPlan });
  }
  while (planned.length && planned[0].at <= now) {
    const p = planned.shift();
    const mine = cells.filter(c => c.at === p.at).map(c => c.c);
    cells = cells.filter(c => c.at !== p.at);
    beads = beads.filter(b => b.t1 > now);
    drops.push({ born: p.at, k: p.k, cols: mine, bead: s.beads, ring: s.rings, v: 18 / s.P, fall: 0 });
    if (s.rings && phase === 'run' && drops.length % 2 === 0) G.sfx('drop');
  }
  drops.forEach(d => {
    d.x = JX + 8 + d.v * (now - d.born);
    if (d.x >= EXIT_X) { d.fall += dt; }
  });
  const before = drops.length;
  drops = drops.filter(d => d.fall < 0.35);
  landed += before - drops.length;
}

function drawChip() {
  R(0, 0, VW, VH, '#0b1122');
  /* the glass chip */
  R(4, 14, 258, 96, '#22325a'); R(5, 15, 256, 94, '#121c38');
  for (let x = 12; x < 258; x += 16) R(x, 15, 1, 94, 'rgba(255,255,255,.02)');
  const aq = '#1f5f79', oil = '#5a4c22';
  /* cell inlet and main channel */
  G.disc(17, CY, 9, aq); R(17, CY - 6, JX - 11, 12, aq);
  /* bead inlet */
  G.disc(63, 25, 7, aq); R(58, 25, 10, CY - 25, aq);
  /* oil, top and bottom */
  G.disc(JX, 25, 7, oil); R(JX - 6, 25, 12, CY - 31, oil);
  G.disc(JX, 100, 7, oil); R(JX - 6, CY + 6, 12, 100 - CY - 6, oil);
  /* the junction and the way out */
  R(JX - 6, CY - 6, 12, 12, '#3c5c58');
  R(JX + 6, CY - 10, EXIT_X - JX - 6, 20, oil);
  /* oil flowing in, as moving ticks */
  for (let i = 0; i < 4; i++) {
    const k = (G.t * 18 + i * 9) % 30;
    R(JX - 1, 28 + k, 2, 3, '#8a7636'); R(JX - 1, 97 - k, 2, 3, '#8a7636');
  }
  T('CELLS', 7, CY + 13, C.mist); T('BEADS', 73, 20, C.mist); T('OIL', JX + 10, 20, C.oil); T('OIL', JX + 10, 97, C.oil);
  T('DROPLETS', 158, CY + 14, C.mist);
  /* collection tube */
  R(TUBE_X - 9, 44, 18, 62, C.fog); R(TUBE_X - 8, 44, 16, 61, '#0b1122');
  R(TUBE_X - 11, 42, 22, 3, C.fog);
  const level = Math.min(52, Math.round(landed * 0.6));
  R(TUBE_X - 8, 105 - level, 16, level, '#5a4c22');
  for (let i = 0; i < Math.min(landed, 70); i++) {
    const hx = (i * 37) % 13, hy = (i * 53) % Math.max(1, level - 2);
    R(TUBE_X - 7 + hx, 103 - hy, 2, 2, 'rgba(190,230,255,.5)');
  }
}

function drawStream() {
  beads.forEach(b => {
    const f = G.clamp((now - b.t0) / (b.t1 - b.t0), 0, 1), len = (CY - 25) + (JX - 6 - 63), d = f * len;
    const x = d < CY - 25 ? 63 : 63 + (d - (CY - 25)), y = d < CY - 25 ? 25 + d : CY;
    G.disc(x, y + 2, 2, C.orange);
  });
  cells.forEach(c => {
    const f = G.clamp((now - c.t0) / (c.t1 - c.t0), 0, 1);
    G.cell(18 + f * (JX - 24) - 2, CY - 3 + c.dy - 1, c.c, 5);
  });
  const mark = stream().mark;
  drops.forEach(d => {
    let x = Math.min(d.x, EXIT_X), y = CY;
    if (d.fall > 0) { const f = d.fall / 0.35; x = G.lerp(EXIT_X, TUBE_X, G.ease(f)); y = CY + f * f * 34; }
    const dbl = d.k >= 2;
    if (d.ring) {
      G.disc(x, y, 8, 'rgba(160,215,255,.16)');
      G.ring(x, y, 8, dbl && mark ? C.coral : d.k === 0 ? '#6f86b3' : C.fog);
      if (dbl && mark && d.fall === 0) T('2', x, y - 19, C.coral, { a: 'center', f: 'smb' });
    }
    if (d.bead) G.disc(x - 3, y + 3, 2, C.orange);
    if (d.cols[0]) G.cell(x - 2, y - 5, d.cols[0], 5);
    if (d.cols[1]) G.cell(x + 1, y - 1, d.cols[1], 5);
  });
}

function tallyNow() {
  if (phase === 'run') { const f = G.ease(run.t / run.D), o = run.o; return { e: o.empties * f, s: o.singlets * f, d: o.doublets * f }; }
  if (phase === 'result') return { e: res.o.empties, s: res.o.singlets, d: res.o.doublets };
  return null;
}
function drawTally() {
  const x = 265, t = tallyNow();
  G.panel(x, 14, 53, 96, { border: C.slate, fill: '#0e1630' });
  const row = (y, label, v, col, icon) => {
    T(label, x + 5, y, C.mist);
    icon(x + 43, y + 4);
    T(t ? G.fmt(v) : '-', x + 48, y + 12, t ? col : C.steel, { a: 'right' });
  };
  row(20, 'EMPTY', t && t.e, C.fog, (ix, iy) => { G.ring(ix + 2, iy, 3, '#6f86b3'); });
  row(50, 'SINGLE', t && t.s, C.mint, (ix, iy) => { G.cell(ix - 1, iy - 3, C.mint, 6); });
  row(80, 'DOUBLE', t && t.d, C.coral, (ix, iy) => { G.cell(ix - 3, iy - 4, C.coral, 5); G.cell(ix + 1, iy - 1, C.coral, 5); });
}

function drawConfig() {
  R(0, 111, VW, VH - 111, '#0e1630'); R(0, 111, VW, 1, C.slate);
  T('CELLS PER LANE', 14, 116, sel === 0 ? C.white : C.mist);
  R_ = G.slider('load', 104, 119, 110, R_, 1000, 16000, 500, { focus: sel === 0 });
  T(G.fmt(R_), 252, 116, C.cyan, { a: 'right', f: 'smb' });

  T('LANES', 14, 134, sel === 1 ? C.white : C.mist);
  if (G.button('lm', 104, 131, 13, 13, '-', { disabled: lanes <= 1, focus: false })) { lanes--; sel = 1; }
  T(String(lanes), 127, 134, C.cyan, { a: 'center', f: 'smb' });
  if (G.button('lp', 137, 131, 13, 13, '+', { disabled: lanes >= 4 })) { lanes++; sel = 1; }
  if (sel === 1 && Math.floor(G.t * 3) % 2 === 0) T('>', 96, 134, C.cyan);
  for (let i = 0; i < 4; i++) { R(160 + i * 13, 132, 10, 11, i < lanes ? C.teal : C.slate); R(162 + i * 13, 134, 6, 2, i < lanes ? C.cyan : C.steel); }

  if (G.button('run', 262, 114, 52, 30, 'RUN', { primary: true, focus: sel === 2 })) startRun();
  if (G.ptr.pressed && G.ptr.y > 111) { if (G.ptr.y < 128 && G.ptr.x < 256) sel = 0; }

  if (forecast) {
    const o = compute(R_, lanes), j = judge(o);
    T('FORECAST', 14, 151, C.mist);
    T((o.rate * 100).toFixed(1) + '% DOUBLETS', 104, 151, j.okRate ? C.mint : C.coral);
    T(G.fmt(o.singlets) + ' SINGLETS', 200, 151, j.okCells ? C.mint : C.coral);
  } else {
    T('NO FORECAST YET. RUN THE CHIP AND SEE.', 14, 151, C.steel);
  }
  R(0, 163, VW, 1, C.slate);
  T('GOAL', 14, 167, C.amber, { f: 'smb' });
  T('8,000 SINGLETS OR MORE.  DOUBLETS 4% OR LESS.', 48, 167, C.amber);
}

function drawRun() {
  R(0, 111, VW, VH - 111, '#0e1630'); R(0, 111, VW, 1, C.slate);
  const f = G.clamp(run.t / run.D, 0, 1), lane = Math.min(lanes, 1 + Math.floor(f * lanes));
  T('RUNNING LANE ' + lane + ' OF ' + lanes, 14, 120, C.white, { f: 'smb' });
  R(14, 136, 240, 7, C.slate); R(14, 136, Math.round(240 * f), 7, C.cyan);
  for (let i = 1; i < lanes; i++) R(14 + Math.round(240 * i / lanes), 134, 1, 11, C.ink);
  T(G.fmt(R_) + ' CELLS PER LANE', 14, 150, C.mist);
  T(G.kt('SPACE: SKIP', 'TAP: SKIP'), 306, 167, C.steel, { a: 'right' });
}

function drawResult() {
  const o = res.o, j = res.j, x = 12, y = 80, w = 250, h = 92;
  R(0, 111, VW, VH - 111, '#0e1630');
  G.panel(x, y, w, h, { border: j.pass ? C.mint : C.coral, fill: C.ink });
  T(j.pass ? 'PASSED' : 'NOT YET', x + 10, y + 7, j.pass ? C.mint : C.coral, { f: 'smb' });
  if (j.pass) G.stars(x + w - 36, y + 7, j.stars);
  const row = (yy, label, val, ok, goal) => {
    T(label, x + 10, yy, C.mist); T(val, x + 122, yy, C.white, { a: 'right', f: 'smb' });
    if (ok !== null) T(ok ? 'OK' : 'MISSED', x + 130, yy, ok ? C.mint : C.coral);
    if (goal) T(goal, x + w - 10, yy, C.steel, { a: 'right' });
  };
  row(y + 22, 'SINGLETS', G.fmt(o.singlets), j.okCells, '8,000+');
  row(y + 33, 'DOUBLETS', (o.rate * 100).toFixed(1) + '%', j.okRate, '4% MAX');
  row(y + 44, 'LANES', String(o.lanes), null, o.lanes === 1 ? '' : G.fmt(o.R) + ' EACH');
  T(j.pass ? 'Keep this run, or try again.' : 'Change the load and try again.', x + 10, y + 57, C.fog, { f: 'md' });
  if (G.button('retry', x + 10, y + 72, 70, 14, 'TRY AGAIN', { focus: rsel === 0 || !j.pass })) retry();
  if (j.pass && G.button('keep', x + w - 104, y + 72, 94, 14, 'KEEP THIS RUN', { primary: true, focus: rsel === 1 })) keep();
}
})();
