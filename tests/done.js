// A save with every stage of a project finished, for testing what comes after them (the Long Gallery) without playing
// five stages first. It holds what the game writes on a clean playthrough: every room of the route done, and the
// settings and numbers each station leaves behind.
//   const done = require('./done.js');
//   done('cortex')                         the profile and the save, as { profile, key, state }
//   done('response', { by: ['soup'] })     as if Tomo had run that step: no stars, and nothing left behind by it
//   done('response', { owe: ['census'] })  with that room not done
//   done('cortex', { stars: 2 })           every room at two stars; { floor: 'order' } to start in another hall
//   await done.init(context, 'cortex')     puts it in the browser before the game loads
const ROUTE = {
  response: ['droplets', 'cliff', 'qc', 'soup', 'doublet', 'review', 'norm', 'hvg', 'pca', 'knn', 'umap', 'club', 'cut', 'lineup', 'name', 'oracle', 'chief', 'sort', 'wash', 'lost', 'counter', 'scales', 'formula', 'stairs', 'census', 'readout'],
  cortex: ['droplets', 'cliff', 'qc', 'soup', 'doublet', 'review', 'norm', 'hvg', 'pca', 'knn', 'umap', 'club', 'cut', 'lineup', 'name', 'oracle', 'chief', 'sort', 'wash', 'lost', 'counter', 'turntable', 'track', 'timetable', 'clock', 'board'],
};
const OTHER = { response: ['turntable', 'track', 'timetable', 'clock', 'board'], cortex: ['scales', 'formula', 'stairs', 'census', 'readout'] };
/* what each station leaves in the save, by the slot it writes to */
const LEFT = {
  droplets: s => { s.load = { R: 4000, lanes: 2, singlets: 7744, doublets: 256, rate: 0.032 }; },
  cliff: s => { s.calls = { called: 3912, recall: 0.98, empties: 0.006, doublets: 128, lower: 100, fdr: 0.001 }; },
  qc: s => { s.qc = { kept: 3611, junkIn: 9, lost: null, healthy: 0.97, minG: 520, maxM: 13.5, nmad: 5 }; },
  soup: s => { s.soup = { rho: 9, truth: 10 }; },
  doublet: s => { s.dbl = { removed: 121, missed: 11, fp: 1, thr: '0.42' }; },
  norm: s => { Object.assign(s.cloud, { depth: true, log: true }); },
  hvg: s => { Object.assign(s.cloud, { method: 'vst', n: 40, block: true }); },
  pca: s => { Object.assign(s.cloud, { dims: 6 }); },
  knn: s => { Object.assign(s.cloud, { k: 10 }); },
  umap: s => { Object.assign(s.cloud, { seed: 3, pack: 'loose' }); },
  cut: s => { Object.assign(s.bureau, { res: 0.5, fix: 'zoom' }); },
  lineup: s => { Object.assign(s.bureau, { pins: ['a', 'b', 'c', 'd', 'e', 'f', 'g', null] }); },
  name: s => { Object.assign(s.bureau, { names: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }); },
  oracle: s => { Object.assign(s.bureau, { ref: 'fit' }); },
  wash: s => { s.laundry = { theta: 2 }; },
  scales: s => { Object.assign(s.weigh, { stamps: [false, true, false] }); },
  formula: s => { Object.assign(s.weigh, { formula: 'donor + visit + visit:response' }); },
  stairs: s => { Object.assign(s.weigh, { rule: 'bh', rate: 0.05, found: 20 }); },
  census: s => { Object.assign(s.weigh, { ref: 0 }); },
  readout: s => { Object.assign(s.weigh, { sentence: 'In responders, after treatment, CD8 T cells raise MKI67 and CD38. This goes with response.' }); },
  turntable: s => { Object.assign(s.yard, { root: 'radial glia', sent: 2 }); },
  track: s => { Object.assign(s.yard, { pieces: 4, wagons: 5, stops: 1 }); },
  timetable: s => { Object.assign(s.yard, { span: 0.03, genes: ['PAX6', 'EOMES', 'NEUROD1', 'TBR1', 'GRIN2B'] }); },
  clock: s => { Object.assign(s.yard, { ages: ['14 WEEKS', '17 WEEKS', '20 WEEKS'], oldest: '20 WEEKS', far: 74, swaps: 2 }); },
  board: s => { Object.assign(s.yard, { lines: ['1 RADIAL GLIA, PAX6. ORDER: SUPPORTED', '2 PROGENITORS, EOMES. ORDER: SUPPORTED', '3 NEWBORN NEURONS, NEUROD1. ORDER: SUPPORTED',
    '4 MATURING NEURONS, GRIN2B. ORDER: SUPPORTED', 'INTERNEURONS, GAD2. NOT ON THIS LINE', 'DIRECTION: CHECKED AGAINST AGE', 'DURATION: UNKNOWN'] }); },
};
/* what the student's steps leave behind: the same defaults as js/world/hall.js gives them */
const LENT = {
  cut: s => { Object.assign(s.bureau, { res: 0.5, fix: 'zoom' }); }, wash: s => { s.laundry = { theta: 2 }; },
  stairs: s => { Object.assign(s.weigh, { rule: 'bh', rate: 0.05 }); }, turntable: s => { Object.assign(s.yard, { root: 'radial glia' }); },
};
function done(project, o) {
  o = o || {};
  const cortex = project === 'cortex', by = o.by || [], owe = o.owe || [], rooms = {}, tries = {};
  const s = { cloud: {}, bureau: {}, laundry: null, weigh: {}, yard: {}, load: null, calls: null, qc: null, soup: null, dbl: null };
  ROUTE[cortex ? 'cortex' : 'response'].forEach(r => {
    tries[r] = 1;
    if (owe.indexOf(r) >= 0) { rooms[r] = { done: false, stars: 0 }; tries[r] = 0; return; }
    if (by.indexOf(r) >= 0) { rooms[r] = { done: true, stars: 0, by: 'student' }; if (LENT[r]) LENT[r](s); return; }
    rooms[r] = { done: true, stars: o.stars || 3 }; if (LEFT[r]) LEFT[r](s);
  });
  OTHER[cortex ? 'cortex' : 'response'].concat(['close']).forEach(r => { rooms[r] = { done: false, stars: 0 }; tries[r] = 0; });
  if (cortex) s.weigh = null; else s.yard = null;
  const state = Object.assign(s, { rooms, tries, floor: o.floor || (cortex ? 'order' : 'changes'), review: null, notes: {}, eggs: {},
    met: true, met2: true, met3: true, met4: true, met5: true, told: { make: true, map: true, who: true, runs: true }, unclog: true, sound: false });
  return { profile: { name: o.name || 'ARI', scenario: cortex ? 'cortex' : 'response', sound: false, metVera: true }, key: cortex ? 'cyteseeing-save-v1:cortex' : 'cyteseeing-save-v1', state };
}
/* put the save in the browser before the page's own scripts run, unless the game has since written one of its own */
done.init = (ctx, project, o) => {
  const d = done(project, o);
  return ctx.addInitScript(q => { if (localStorage.getItem('test-done')) return; localStorage.setItem('test-done', '1'); localStorage.setItem('cyteseeing-profile-v1', q[0]); localStorage.setItem(q[1], q[2]); },
    [JSON.stringify(d.profile), d.key, JSON.stringify(d.state)]);
};
module.exports = done;
