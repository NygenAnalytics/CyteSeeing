// The numbers the stations of stages 3, 4 and 5 are tuned to, checked without a browser for every cell system.
// A cell system's pack may change names freely. If it changes a number, these are the things that must still hold.
const bureau = require('./maths-bureau.js'), laundry = require('./maths-laundry.js'), changes = require('./maths-changes.js'), path = require('path');
const repo = path.resolve(__dirname, '..'), bad = [];
const same = (what, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(what + ': got ' + JSON.stringify(got) + ', want ' + JSON.stringify(want)); };
['immune', 'brain'].forEach(sys => {
  /* the Bureau: clusters at each setting of the dial, the eight final clusters, the line-up and Ida's pins */
  const r = bureau.report(bureau.load(sys));
  same(sys + ' dial (clusters / hidden groups / invented splits)', r.dial.map(d => [d.k, d.hidden, d.weak].join('/')).join(' '), '5/3/0 6/2/0 7/1/0 7/1/0 7/1/0 9/0/1 9/0/1 10/0/3 12/0/5 14/0/7');
  same(sys + ' final cluster sizes', r.final.sizes, [63, 56, 36, 33, 26, 19, 13, 12]);
  same(sys + ' line-up: which gene of each round is a marker', r.rounds.map(g => g.map(x => (x.good ? 1 : 0)).join('')), ['00101', '00010', '00101', '00000']);
  same(sys + ' pins given by Ida all hold', r.given.every(x => x.good), true);
  same(sys + ' the wrong reference is surer than the fitting one', r.chief.far.share > r.chief.fit.share, true);
  /* the Laundry: the verdict at each theta, the islands and their pairs */
  const l = laundry.record(laundry.boot(repo, sys));
  same(sys + ' wash verdicts', l.dial.map(d => d.verdict), ['UNDER', 'UNDER', 'UNDER', 'GOOD', 'GOOD', 'OVER', 'OVER']);
  same(sys + ' the lone population is kept where the wash is good', l.dial.filter(d => d.verdict === 'GOOD').every(d => d.kept >= 0.8), true);
  same(sys + ' islands', l.islands.k, 11);
  same(sys + ' pairs', l.islands.pairs.length, 5);
});
/* the Weigh House, which only the blood project has: every lesson with its margin */
{
  const c = changes.record(changes.boot(repo, 'immune')), ok = v => v.every(x => x);
  same('t distribution against printed tables', ok(c.pt.map(q => Math.abs(q.got - q.want) < 1e-5)), true);
  same('scales: every claim is sure on cells', ok(c.scales.map(s => s.cells.p < 1e-8)), true);
  same('scales: which claims hold on donors', c.scales.map(s => s.holds), [false, true, false]);
  same('scales: the donors leave no doubt either way', ok(c.scales.map(s => (s.holds ? s.donors.p < 0.005 : s.donors.p > 0.25))), true);
  same('bench 1: unclear without donor, clear with it, no interaction', [c.bench.a.visit.fx.visit.p > 0.1, c.bench.a.paired.fx.visit.p < 1e-3, c.bench.a.inter.fx.vr.p > 0.2, c.bench.a.visit.left > 0.8, c.bench.a.paired.left < 0.05], [true, true, true, true, true]);
  same('bench 2: an interaction in the gene, none in the trap, which differs between the groups', [c.bench.b.inter.fx.vr.p < 1e-3, c.bench.b.inter.fx.visit.p > 0.2, c.bench.trap.inter.fx.vr.p > 0.3, c.bench.trap.loose.fx.response.p < 1e-3], [true, true, true, true]);
  same('bench 3: which formulas jam, and on what', c.bench.jams.map(j => (j.jam ? j.extra.join(',') : 'fits')), ['response', 'run', 'response,run', 'run', 'response', 'fits', 'fits', 'fits']);
  same('bench 3: taking donor out leaves more unexplained', c.bench.jams[5].left > 3 * c.bench.b.inter.left, true);
  same('stairs: genes, and how many are real', [c.stairs.m, c.stairs.real], [200, 24]);
  same('stairs: lit/real/false under every rule at 1, 5, 10 and 20%', c.stairs.rules.map(r => [r.lit, r.real, r.wrong].join('/')).join(' '), '21/19/2 33/24/9 37/24/13 53/24/29 5/5/0 6/6/0 9/9/0 11/11/0 9/9/0 20/19/1 23/20/3 28/22/6');
  same('stairs: the one setting that passes', c.stairs.pass, ['bh 0.05']);
  same('stairs: Benjamini-Hochberg counted two ways', ok(c.stairs.bh.map(q => q.lit === q.byAdjusted)), true);
  same('stairs: least squares gives the paired p-value', ok(c.stairs.lm.map(q => Math.abs(Math.log(q.paired / q.lm)) < 1e-6)), true);
  same('census: what one pump of each cell type can do', c.census.single.map(s => s.type + ' ' + s.steps + (s.gap <= 0.02 ? ' matches' : '')), ['CD4T -3', 'CD8T 4 matches', 'NK -9', 'B -12', 'MONO -3']);
  same('census: the match has room on both sides, and four halved is the same jar', [c.census.near[2] < 0.01, c.census.near[1] > 0.025, c.census.near[3] > 0.025, c.census.halved === c.census.near[2], ok(c.census.single.filter(s => s.type !== 'CD8T').map(s => s.gap > 0.05))], [true, true, true, true, true]);
  same('census: what the ledger marks against each reference', c.census.ledger.map(l => l.rows.filter(r => / \*$/.test(r)).map(r => r.split(' ')[0]).join(',')), ['CD8T', 'CD4T,NK,B,MONO', 'CD8T', 'CD8T', 'CD8T']);
  same('census: nothing grew in the other patients', ok(c.census.others.map(p => p > 0.2)), true);
}
if (bad.length) { console.log(bad.join('\n')); process.exit(1); }
console.log('MATHS OK');
