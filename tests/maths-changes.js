// Node harness for the stage 5 data module: a stub engine, then the cell system, its changes pack and trial.js.
// usage: node tests/maths-changes.js [immune] [out.json]      (as a module: require it, then boot(repo, system) and record(G))
// TRIAL='{"seedMono":5}' overrides the generator's settings, which is how the seeds were chosen.
const fs = require('fs'), vm = require('vm'), path = require('path');
function boot(repo, sysId, over) {
  const G = { state: { rooms: {} }, lerp: (a, b, t) => a + (b - a) * t, clamp: (v, a, b) => Math.max(a, Math.min(b, v)) };
  G.rng = function (seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  if (over || process.env.TRIAL) G.trialCfg = over || JSON.parse(process.env.TRIAL);
  const ctx = vm.createContext({ G, console, Math, Float32Array, Float64Array, Uint8Array, Array, Object, JSON, Infinity, String, Number, isFinite });
  const run = f => vm.runInContext(fs.readFileSync(repo + '/' + f, 'utf8'), ctx, { filename: f });
  const id = sysId || 'immune';
  run('js/systems/' + id + '.js'); run('js/systems/' + id + '.changes.js');
  G.sys = G.systems[id];
  run('js/data/trial.js');
  return G;
}
/* everything the stations rely on, as plain numbers */
function record(G) {
  const T = G.trial, P = G.sys.changes, D = T.build(), out = {};
  out.donors = D.donors.map(d => d.name + (d.resp ? ' R' : ' N') + (d.big ? ' big' : '') + (d.carrier ? ' carrier' : '') + ' run' + (d.run + 1));
  out.cells = D.n.map(v => v.join('/'));
  /* the t distribution against printed tables: two-sided p for t and degrees of freedom */
  out.pt = [[2.228139, 10, 0.05], [3.169273, 10, 0.01], [4.586894, 10, 0.001], [12.7062, 1, 0.05], [2.200985, 11, 0.05], [3.105807, 11, 0.01], [4.436979, 11, 0.001], [2.570582, 5, 0.05]].map(q => ({ t: q[0], df: q[1], want: q[2], got: T.pt(q[0], q[1]) }));
  /* 5-1: each claim on cells and on donors */
  out.scales = P.scales.claims.map((cl, k) => { const c = T.claim(k), h = T.heaps(k);
    return { gene: cl.gene, kind: cl.kind, grains: h.reduce((s, x) => s + x.n, 0), heaps: h.map(x => x.n), lit: h.map(x => +(x.lit / x.n).toFixed(2)), bags: h.map(x => +x.bag.toFixed(3)),
      cells: { t: c.cells.t, df: c.cells.df, p: c.cells.p }, donors: { t: c.donors.t, df: c.donors.df, p: c.donors.p }, holds: c.holds }; });
  /* 5-2: every formula the bench's rounds turn on */
  const fx = (set, gene, terms) => { const f = T.fit(set, gene, terms); return f.jam ? { jam: true, cols: f.cols, rank: f.rank, extra: f.extra } : { cols: f.cols, rank: f.rank, left: f.left, fx: Object.keys(f.fx).reduce((o, t) => { o[t] = { est: f.fx[t].est, p: f.fx[t].p, lo: f.fx[t].lo, hi: f.fx[t].hi }; return o; }, {}) }; };
  const a = P.wave.genes[0][0], b = P.rise.genes[0][0], trap = P.stand.gene;
  out.bench = {
    a: { gene: a, visit: fx('mono', a, ['visit']), paired: fx('mono', a, ['donor', 'visit']), response: fx('mono', a, ['visit', 'response']), inter: fx('mono', a, ['donor', 'visit', 'vr']) },
    b: { gene: b, paired: fx('cd8', b, ['donor', 'visit']), inter: fx('cd8', b, ['donor', 'visit', 'vr']), loose: fx('cd8', b, ['visit', 'response']), nodonor: fx('cd8', b, ['visit', 'response', 'vr']) },
    trap: { gene: trap, inter: fx('cd8', trap, ['donor', 'visit', 'vr']), loose: fx('cd8', trap, ['visit', 'response']), nodonor: fx('cd8', trap, ['visit', 'response', 'vr']) },
    other: P.rise.genes.slice(1).map(g => ({ gene: g[0], inter: fx('cd8', g[0], ['donor', 'visit', 'vr']) })),
    jams: [['donor', 'response'], ['donor', 'run'], ['donor', 'visit', 'response', 'vr', 'run'], ['donor', 'visit', 'vr', 'run'], ['donor', 'visit', 'response', 'vr'], ['visit', 'response', 'vr', 'run'], ['visit', 'run'], ['response', 'run']].map(t => Object.assign({ terms: t.join('+') }, fx('cd8', b, t))),
  };
  /* 5-3: the staircase, and what every rule lights at every rate */
  const st = T.stairs();
  out.stairs = { m: st.m, real: st.real, p: st.steps.map(s => s.p), order: st.steps.slice(0, 40).map(s => (s.real ? '' : '!') + s.name + ' ' + s.p.toExponential(2)),
    hist: (() => { const h = new Array(20).fill(0); st.steps.forEach(s => { h[Math.min(19, Math.floor(s.p * 20))]++; }); return h; })(),
    rules: [].concat.apply([], T.RULES.map(k => T.RATES.map(r => { const j = T.judge(k, r); return { rule: k, rate: r, cut: j.cut, lit: j.lit, real: j.real, wrong: j.wrong, chance: j.chance, clean: j.clean, full: j.full }; }))) };
  out.stairs.pass = out.stairs.rules.filter(r => r.clean && r.full).map(r => r.rule + ' ' + r.rate);
  /* Benjamini-Hochberg a second way: adjusted p-values (the running minimum, from the last step down, of p times genes over rank), then count those within the rate */
  const adj = out.stairs.p.slice(); for (let i = st.m - 1, run = 1; i >= 0; i--) { run = Math.min(run, out.stairs.p[i] * st.m / (i + 1)); adj[i] = run; }
  out.stairs.bh = T.RATES.map(r => ({ rate: r, lit: T.rule('bh', r).lit, byAdjusted: adj.filter(v => v <= r).length }));
  /* the same test by least squares: ~ donor + visit must give the paired p-value */
  out.stairs.lm = [0, 5, 30].map(i => { const s = st.steps[i]; return { gene: s.name, paired: s.p, lm: T.fit('mono', s.name, ['donor', 'visit']).fx.visit.p }; });
  /* 5-4: the jars, what one pump can do, and the ledger against every reference */
  const J = T.jars(), ids = P.types.map(t => t.id);
  out.census = { before: J.mean[0][0].map(v => +v.toFixed(4)), after: J.mean[0][1].map(v => +v.toFixed(4)), otherBefore: J.mean[1][0].map(v => +v.toFixed(4)), otherAfter: J.mean[1][1].map(v => +v.toFixed(4)),
    single: T.single().map(s => ({ type: ids[s.k], steps: s.steps, gap: +s.gap.toFixed(4) })), moved: T.moved().map(k => ids[k]),
    near: [-2, -1, 0, 1, 2].map(o => { const s = new Array(J.K).fill(0), k = P.grows.type; s[k] = T.single()[k].steps + o; return +T.gap(s).toFixed(4); }),
    halved: (() => { const s = new Array(J.K).fill(-T.single()[P.grows.type].steps); s[P.grows.type] = 0; return +T.gap(s).toFixed(4); })(),
    ledger: ids.map((id, r) => ({ ref: id, rows: T.ledger(r).filter(x => !x.ref).map(x => ids[x.k] + ' ' + x.mean.toFixed(2) + ' p=' + x.p.toExponential(1) + (x.changed ? ' *' : '')) })),
    others: ids.map((id, k) => (k === P.grows.type ? null : T.others(P.grows.type, k).p)).filter(x => x !== null) };
  return out;
}
module.exports = { boot, record };
if (require.main === module) {
  const repo = path.resolve(__dirname, '..'), G = boot(repo, process.argv[2] || 'immune'), r = record(G), e = v => v.toExponential(2);
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(r, null, 1));
  console.log('donors', r.donors.join(', ')); console.log('cells per sample (before/after)', r.cells.join(' '));
  console.log('t table', r.pt.map(q => q.want + ':' + q.got.toFixed(6)).join(' '));
  r.scales.forEach(s => console.log('scales', s.gene, s.kind, 'grains', s.grains, '| cells t', s.cells.t.toFixed(1), 'p', e(s.cells.p), '| donors t', s.donors.t.toFixed(2), 'df', s.donors.df.toFixed(1), 'p', s.donors.p.toFixed(4), s.holds ? 'HOLDS' : 'DOES NOT', '| heaps', s.heaps.join(','), '| lit', s.lit.join(','), '| bags', s.bags.join(',')));
  const show = (name, f) => console.log('  ', name, f.jam ? 'JAM cols ' + f.cols + ' rank ' + f.rank + ' extra ' + f.extra.join(',') : 'left ' + (f.left * 100).toFixed(1) + '% ' + Object.keys(f.fx).map(t => t + ' ' + f.fx[t].est.toFixed(2) + ' [' + f.fx[t].lo.toFixed(2) + ',' + f.fx[t].hi.toFixed(2) + '] p=' + e(f.fx[t].p)).join(' | '));
  ['a', 'b', 'trap'].forEach(k => { console.log('bench', k, r.bench[k].gene); Object.keys(r.bench[k]).forEach(m => { if (m !== 'gene') show(m, r.bench[k][m]); }); });
  r.bench.other.forEach(o => show(o.gene + ' inter', o.inter)); r.bench.jams.forEach(j => show('~ ' + j.terms, j));
  console.log('stairs', r.stairs.m, 'genes', r.stairs.real, 'real | hist', r.stairs.hist.join(','));
  console.log('  first steps:', r.stairs.order.join(', '));
  r.stairs.rules.forEach(q => console.log('  ', q.rule, q.rate, 'cut', e(q.cut), 'lit', q.lit, 'real', q.real, 'false', q.wrong, 'chance', q.chance.toFixed(2), q.clean ? 'clean' : '-', q.full ? 'full' : '-'));
  console.log('  BH, counted two ways:', r.stairs.bh.map(q => q.rate + ': ' + q.lit + '=' + q.byAdjusted).join(' '));
  console.log('  pass:', r.stairs.pass.join(', '), '| lm check', r.stairs.lm.map(q => q.gene + ' ' + e(q.paired) + '=' + e(q.lm)).join(' '));
  console.log('census responders before', r.census.before.join(' '), 'after', r.census.after.join(' ')); console.log('  others before', r.census.otherBefore.join(' '), 'after', r.census.otherAfter.join(' '));
  console.log('  one pump:', r.census.single.map(s => s.type + ' steps ' + s.steps + ' gap ' + s.gap).join(' | '), '| moved', r.census.moved.join(','), '| near', r.census.near.join(' '), '| four halved', r.census.halved);
  r.census.ledger.forEach(l => console.log('  ref', l.ref, '|', l.rows.join(' | '))); console.log('  expansion in non-responders, p against each reference', r.census.others.map(p => p.toFixed(3)).join(' '));
}
