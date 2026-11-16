// Node harness for the maths of stage 3, without a browser: a stub engine, js/data/maths.js, one pack
// (optionally edited by a patch) and js/data/atlas.js. It reports everything the stations rely on.
const fs = require('fs'), vm = require('vm'), repo = process.env.REPO || require('path').resolve(__dirname, '..');
function load(sysId, patch) {
  const G = { C: new Proxy({}, { get: () => '#000' }), state: { rooms: { lineup: { done: false } } }, lerp: (a, b, t) => a + (b - a) * t, clamp: (v, a, b) => Math.max(a, Math.min(b, v)), systems: {} };
  G.rng = function (seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  G.systems[sysId] = {};
  const ctx = vm.createContext({ G, console, Math, Float32Array, Float64Array, Array, Object, JSON, Infinity });
  ['js/data/maths.js', 'js/systems/' + sysId + '.who.js'].forEach(f => vm.runInContext(fs.readFileSync(repo + '/' + f, 'utf8'), ctx, { filename: f }));
  G.sys = { who: G.systems[sysId].who };
  if (patch) patch(G.sys.who);
  vm.runInContext(fs.readFileSync(repo + '/js/data/atlas.js', 'utf8'), ctx, { filename: 'atlas.js' });
  return G;
}
const pc = v => Math.round(v * 100);
function report(G) {
  const at = G.atlas, W = G.sys.who, f = at.final(), out = {}, ids = at.TYPES.map(t => t.id);
  const comp = cells => { const c = {}; cells.forEach(i => { const t = at.cells[i].type; c[t] = (c[t] || 0) + 1; }); return Object.keys(c).map(t => 's' + t + ':' + c[t]).join(' '); };
  out.dial = at.DIAL.map(d => { const a = at.audit(d); return { res: d, k: a.part.k, hidden: a.hidden, weak: a.weak.length, mixed: a.mixed.join(','), pairs: a.weak.map(w => w[0] + '-' + w[1]).join(','), clusters: a.mem.map(comp) }; });
  out.final = { sizes: f.mem.map(m => m.length), slots: f.of.map(id => ids.indexOf(id)), comp: f.mem.map(comp), dbl: f.dbl };
  out.depth = f.mem.map((m, c) => at.depth(c).toFixed(2));
  const st = (role, g) => { const s = at.stats(f.role[role])[g]; return { g, in: pc(s.in), out: pc(s.out), good: s.in >= 0.6 && s.out <= 0.2 }; };
  out.rounds = W.lineup.rounds.map(r => r.genes.map(g => st(r.role, g)));
  out.given = Object.keys(W.lineup.given).map(r => st(r, W.lineup.given[r]));
  const T = W.name.tree, frac = (c, g) => at.stats(c)[g].in;
  const fits = (c, id) => (T[id].need || []).every(g => frac(c, g) >= 0.6) && (T[id].lack || []).every(g => frac(c, g) <= 0.3);
  /* every cluster walked down the drawers: the drawers that fit at each level, and where it ends */
  out.walk = f.mem.map((m, c) => { const path = []; let here = 'root'; for (;;) { const ok = (T[here].opts || []).filter(id => fits(c, id)); if (!ok.length) break; path.push(ok.join('|')); here = ok[0]; } return path.join(' > '); });
  out.evidence = W.name.cases.map(k => { const c = f.role[k.role], seen = {}; const ev = id => (T[id].need || []).map(g => '+' + g + ' ' + pc(frac(c, g))).concat((T[id].lack || []).map(g => '-' + g + ' ' + pc(frac(c, g)))).join(' ');
    let here = 'root'; const rows = []; for (;;) { const o = T[here].opts || []; o.forEach(id => rows.push(id + (fits(c, id) ? '*' : '') + ': ' + ev(id))); const nx = o.find(id => fits(c, id)); if (!nx) break; here = nx; } return rows; });
  out.refs = {}; Object.keys(at.REFS).forEach(k => { out.refs[k] = at.opinion(k).map(o => o.label + ' ' + pc(o.share) + ' (' + (o.share * 100).toFixed(1) + ')'); });
  const filed = f.of.map(r => W.name.filed[r]), fit = at.opinion('fit');
  out.differ = f.mem.map((m, c) => c).filter(c => c !== f.dbl && fit[c].label !== filed[c]).map(c => c + ' ' + f.of[c] + ': file ' + filed[c] + ', machine ' + fit[c].label);
  out.oracle = [W.oracle.take, W.oracle.keep].map(k => k.genes.map(g => g + ' ' + pc(frac(f.role[k.role], g))).join(', '));
  const fine = at.audit(at.DIAL[at.DIAL.length - 1]), ch = W.chief;
  out.chief = { clusters: fine.part.k, falseSplits: fine.weak.length, rna: at.depth(f.role[ch.rna]).toFixed(1), far: at.opinion('far')[f.role[ch.sure]], fit: at.opinion('fit')[f.role[ch.sure]], apart: at.apart(f.mem[f.role[ch.shared[0]]], f.mem[f.role[ch.shared[1]]]).length,
    n: [ch.rna, ch.sure, ch.shared[0], ch.shared[1]].map(r => f.role[r] + 1) };
  out.dblDepth = at.depth(f.dbl).toFixed(1);
  return out;
}
module.exports = { load, report };
if (require.main === module) { const G = load(process.argv[2] || 'immune'); console.log(JSON.stringify(report(G), null, 1)); }
