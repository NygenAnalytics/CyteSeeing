// Node harness for the stage 4 data module: a stub engine, then maths.js, the cell system, its runs pack and loads.js.
// usage: node loads_node.js <repo> [immune|brain]      (as a module: require it, then call it with (repo, system))
const fs = require('fs'), vm = require('vm');
function boot(repo, sysId) {
  const G = { C: new Proxy({}, { get: () => '#000' }), state: { rooms: {} }, lerp: (a, b, t) => a + (b - a) * t, clamp: (v, a, b) => Math.max(a, Math.min(b, v)) };
  G.rng = function (seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  if (process.env.LOADS) G.loadsCfg = JSON.parse(process.env.LOADS);
  const ctx = vm.createContext({ G, console, Math, Float32Array, Float64Array, Array, Object, JSON, Infinity, String, Number, isFinite, parseInt });
  const run = f => vm.runInContext(fs.readFileSync(repo + '/' + f, 'utf8'), ctx, { filename: f });
  run('js/data/maths.js');
  ['immune', 'brain'].forEach(id => { run('js/systems/' + id + '.js'); run('js/systems/' + id + '.runs.js'); });
  G.use = id => { G.sys = G.systems[id]; if (G.loads && G.loads.reset) G.loads.reset(); };
  G.sys = G.systems[sysId || 'immune'];
  run('js/data/loads.js');
  return G;
}
/* everything the stations rely on, as plain numbers: one record per system */
function record(G) {
  const L = G.loads, p = L.prep(), out = {};
  const T = (L.TYPES.length ? L.TYPES : G.sys.runs.types).map(t => t.id);
  out.types = T; out.cells = { ref: p.nr, all: p.n, genes: L.genes.length };
  out.hvg = p.hvg.map(j => L.genes[j].name);
  out.dial = L.DIAL.map(th => { const v = L.verdict(th), r = L.run(th); return { theta: th, mix: v.mix, kept: v.plt !== undefined ? v.plt : v.lone, verdict: v.under ? 'UNDER' : v.over ? 'OVER' : 'GOOD', rounds: r.rounds, converged: r.converged, keptAll: r.kept.slice() }; });
  const I = L.islands();
  out.islands = { k: I.k, pairs: I.pairs.map(q => [q.a, q.b, +q.len.toFixed(4), +q.cos.toFixed(4)]), agree: I.agree,
    isl: I.isl.map(a => ({ id: a.id, load: a.load, n: a.cells.length, pure: +a.pure.toFixed(3), kind: T[a.kind], best: a.best, sim: +a.sim.toFixed(4), partner: a.partner, genes: a.genes.map(g => g.name) })) };
  out.map = {};
  [2, 4].forEach(th => {
    const m = L.mapTo(th), by = {};
    m.cells.forEach(c => { const k = T[c.type] + '>' + T[c.label]; by[k] = (by[k] || 0) + 1; });
    const un = m.cells.filter(c => c.type === 6), dark = m.cells.filter(c => !c.lit);
    out.map[th] = { n: m.cells.length, by, unseen: un.length, unseenLabels: un.map(c => T[c.label]).join(','), unseenShareMin: Math.min.apply(null, un.map(c => c.share)), unseenShares: un.map(c => +c.share.toFixed(3)),
      unseenLit: un.filter(c => c.lit).length, unseenPct: un.map(c => +c.pct.toFixed(2)), dark: dark.length, darkWho: dark.map(c => T[c.type] + '>' + T[c.label]).join(' '),
      differ: L.differ(un.map(c => c.i), 3).slice(0, 8).map(g => g.name + ' ' + g.in.toFixed(2) + '/' + g.out.toFixed(2) + ' lfc ' + g.lfc.toFixed(2)) };
  });
  return out;
}
module.exports = { boot, record };
if (require.main === module) {
  const G = boot(process.argv[2], process.argv[3] || 'immune'), r = record(G);
  if (process.argv[4]) fs.writeFileSync(process.argv[4], JSON.stringify(r, null, 1));
  console.log('system', G.sys.id, 'ref', r.cells.ref, 'all', r.cells.all, 'genes', r.cells.genes);
  r.dial.forEach(d => console.log('theta', d.theta, 'mix', d.mix.toFixed(4), 'kept', d.kept.toFixed(4), d.verdict, 'rounds', d.rounds, d.converged));
  console.log('islands', r.islands.k, 'pairs', JSON.stringify(r.islands.pairs), 'agree', r.islands.agree.toFixed(4));
  r.islands.isl.forEach(a => console.log('  ', a.id, 'load', a.load, 'n', a.n, 'pure', a.pure, a.kind, 'best', a.best, a.sim, 'partner', a.partner, '|', a.genes.join(' ')));
  [2, 4].forEach(th => { const m = r.map[th]; console.log('map theta', th, JSON.stringify(m.by), '| unseen', m.unseen, 'labels', m.unseenLabels, 'share min', m.unseenShareMin.toFixed(3), 'lit', m.unseenLit, 'pct', m.unseenPct.join(','), '| dark', m.dark, m.darkWho, '|', m.differ.join(', ')); });
}
