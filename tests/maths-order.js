// Node harness for the data module of the cortex project's stage 5: a stub engine, then maths.js, the cell system, its order pack and line.js.
// usage: node tests/maths-order.js [brain] [out.json]      (as a module: require it, then boot(repo, system) and record(G))
// LINE='{"seed":5}' overrides the generator's settings, which is how the seed was chosen.
const fs = require('fs'), vm = require('vm'), path = require('path');
function boot(repo, sysId, over) {
  const G = { C: new Proxy({}, { get: () => '#000' }), state: { rooms: {} }, lerp: (a, b, t) => a + (b - a) * t, clamp: (v, a, b) => Math.max(a, Math.min(b, v)) };
  G.rng = function (seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  if (over || process.env.LINE) G.lineCfg = over || JSON.parse(process.env.LINE);
  const ctx = vm.createContext({ G, console, Math, Float32Array, Float64Array, Uint8Array, Array, Object, JSON, Infinity, NaN, isNaN, String, Number, isFinite });
  const run = f => vm.runInContext(fs.readFileSync(repo + '/' + f, 'utf8'), ctx, { filename: f });
  const id = sysId || 'brain';
  run('js/data/maths.js'); run('js/systems/' + id + '.js'); run('js/systems/' + id + '.order.js');
  G.sys = G.systems[id];
  run('js/data/line.js');
  return G;
}
/* everything the stations rely on, as plain numbers */
function record(G) {
  const L = G.lineage, P = G.sys.order, D = L.build(), out = {}, ids = P.states.map(s => s.id), r3 = v => +v.toFixed(3);
  out.cells = { n: D.n, genes: D.genes.length, byState: ids.map((id, t) => D.cells.filter(c => c.type === t).length), bySample: P.samples.map((s, k) => D.cells.filter(c => c.sample === k).length) };
  /* 5-1: the three roots, where each one's tip lies, and the two lamp genes along each order */
  const roads = L.roads();
  out.roads = roads.map((rd, k) => { const o = L.order(k), u = [], pt = []; D.cells.forEach((c, i) => { if (c.type < L.LINE && !isNaN(o.pt[i])) { u.push(c.u); pt.push(o.pt[i]); } });
    return { tip: ids[D.cells[rd.tip].type], u: r3(D.cells[rd.tip].u), root: rd.root.map(i => ids[D.cells[i].type]).join(','), early: r3(o.early), late: r3(o.late), right: o.right, back: o.back, withHidden: r3(L.spearman(u, pt)),
      lamps: o.lamps.map(l => l.map(v => Math.round(v * 9)).join('')), unreached: o.pt.filter(v => isNaN(v)).length }; });
  out.stem = L.stem();
  /* 5-2: every pair of states: links, what chance would give, and whether the wagon crosses; and which islands look closest */
  out.pairs = []; for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) { const l = L.links(a, b); out.pairs.push({ pair: ids[a] + '-' + ids[b], links: l.links, chance: r3(l.chance), ratio: r3(l.ratio), holds: l.holds, apart: r3(L.apart(a, b)) }); }
  out.pieces = L.pieces().map(q => ids[q[0]] + '-' + ids[q[1]]);
  out.nearest = ids.map((id, t) => id + '>' + ids[L.nearest(t)]);
  out.closest = out.pairs.slice().sort((a, b) => a.apart - b.apart).slice(0, 4).map(p => p.pair + ' ' + p.apart);
  out.islands = L.islands().map(q => ids[q.t] + ' ' + q.n + ' @' + q.x.toFixed(2) + ',' + q.y.toFixed(2)); out.aspect = r3(L.map().aspect);
  /* 5-3: what the lamps show at every notch of the lever */
  out.lever = L.SPANS.map((sp, i) => { const r = L.read(i); return { span: sp, ok: r.ok, flicker: r.flicker, lost: r.lost, order: r.order, gap: r.gap, peaks: r.rows.map(q => +q.peak.toFixed(3)), firsts: r.rows.map(q => q.first), rows: r.rows.map(q => q.name + ' first ' + q.first + ' runs ' + q.runs + ' lit ' + q.count + ' peak ' + q.peak.toFixed(2) + ' ' + q.lit.map(v => (v ? '#' : '.')).join('')) }; });
  out.readable = L.readable(); out.arrivals = out.readable.length ? L.arrivals() : [];
  /* 5-4: the three trains, and the two stretches */
  out.trains = L.trains().map(t => ({ age: P.samples[t.sample].age, n: t.at.length, mean: r3(t.mean), late: r3(t.late) }));
  out.byProgress = L.byProgress();
  const s = L.stretches(); out.stretches = { crowd: [r3(s.crowd.lo), r3(s.crowd.hi), s.crowd.n], sparse: [r3(s.sparse.lo), r3(s.sparse.hi), s.sparse.n] };
  /* the board: the order of the states, which state each gene stands for, and which states are joined to the line */
  const q = L.sequence(); out.sequence = { order: q.order.map(t => ids[t]), median: q.median.map(r3) };
  out.homes = P.board.genes.map(g => g + ': ' + L.home(g).states.map(t => ids[t]).join(',') + ' (' + L.home(g).mean.map(v => v.toFixed(2)).join(' ') + ')');
  out.marks = P.board.genes.map(g => g + ': ' + [0, 1, 2, 3, L.APART].filter(t => L.marks(g, t).ok).map(t => ids[t]).join(','));
  out.joined = ids.map((id, t) => L.joined(t));
  return out;
}
module.exports = { boot, record };
if (require.main === module) {
  const repo = path.resolve(__dirname, '..'), t0 = Date.now(), G = boot(repo, process.argv[2] || 'brain'), r = record(G);
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(r, null, 1));
  console.log('cells', r.cells.n, 'genes', r.cells.genes, 'by state', r.cells.byState.join('/'), 'by sample', r.cells.bySample.join('/'), '(' + (Date.now() - t0) + ' ms)');
  r.roads.forEach((d, k) => console.log('road', k, 'tip', d.tip, 'u', d.u, 'root', d.root, '| early', d.early, 'late', d.late, d.right ? 'RIGHT WAY' : d.back ? 'BACKWARDS' : 'NEITHER', '| with the hidden position', d.withHidden, '| unreached', d.unreached, '| lamps', d.lamps.join(' ')));
  console.log('stem road', r.stem);
  r.pairs.forEach(p => console.log('  pair', p.pair, 'links', p.links, 'chance', p.chance, 'ratio', p.ratio, p.holds ? 'CROSSES' : '-', 'apart on the map', p.apart));
  console.log('pieces', r.pieces.join(' '), '| nearest on the map', r.nearest.join(' '), '| closest pairs', r.closest.join(', ')); console.log('islands', r.islands.join(' | '), 'aspect', r.aspect);
  r.lever.forEach(l => { console.log('lever', l.span, l.ok ? 'READABLE' : 'no', 'flicker', l.flicker.join(',') || '-', 'lost', l.lost.join(',') || '-', 'gap', l.gap, 'order', l.order.join(' ')); l.rows.forEach(q => console.log('    ', q)); });
  console.log('readable notches', r.readable.join(','), 'arrivals', r.arrivals.join(' '));
  r.trains.forEach(t => console.log('train', t.age, 'cells', t.n, 'mean pseudotime', t.mean, 'past half-way', t.late)); console.log('by progress', r.byProgress.join(','), '| crowded', r.stretches.crowd.join(' '), 'sparse', r.stretches.sparse.join(' '));
  console.log('sequence', r.sequence.order.join(' '), r.sequence.median.join(' ')); r.homes.forEach(h => console.log('  home', h)); console.log('  a gene can stand for |', r.marks.join(' | ')); console.log('joined to the line', r.joined.join(','));
}
