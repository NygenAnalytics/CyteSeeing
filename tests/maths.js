// The numbers the stations of stages 3 and 4 are tuned to, checked without a browser for every cell system.
// A cell system's pack may change names freely. If it changes a number, these are the things that must still hold.
const bureau = require('./maths-bureau.js'), laundry = require('./maths-laundry.js'), path = require('path');
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
if (bad.length) { console.log(bad.join('\n')); process.exit(1); }
console.log('MATHS OK');
