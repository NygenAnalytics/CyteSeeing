// A save from before stage 5 existed: it has no rooms, no tries and no slot for the Weigh House.
// It must load with its stars, show the new stage open on the map, and play.
const { chromium } = require('playwright');
(async () => {
  const [,, indexPath, outDir] = process.argv;
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1400, height: 820 } });
  /* what version 6 of the game wrote: four stages, every room of them done */
  await ctx.addInitScript(() => {
    if (localStorage.getItem('cyteseeing-profile-v1')) return;
    const done = s => ({ done: true, stars: s }), rooms = {};
    ['droplets', 'cliff', 'qc', 'soup', 'doublet', 'review', 'norm', 'hvg', 'pca', 'knn', 'umap', 'club', 'cut', 'lineup', 'name', 'oracle', 'chief', 'sort', 'wash', 'lost', 'counter'].forEach((k, i) => { rooms[k] = done(1 + i % 3); });
    const tries = {}; Object.keys(rooms).forEach(k => { tries[k] = 1; });
    localStorage.setItem('cyteseeing-profile-v1', JSON.stringify({ name: 'KIM', scenario: 'response', sound: false, metVera: true }));
    localStorage.setItem('cyteseeing-save-v1', JSON.stringify({ rooms, tries, floor: 'runs', cloud: { depth: true, log: true, method: 'vst', n: 40, block: true, dims: 6, k: 10, seed: 3 }, bureau: { res: 0.5, fix: 'zoom' }, laundry: { theta: 2 },
      load: null, calls: null, qc: null, soup: null, dbl: null, notes: {}, eggs: {}, met: true, met2: true, met3: true, met4: true, told: { make: true, map: true, who: true }, unclog: true, sound: false }));
  });
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + indexPath + '?debug'); await p.waitForFunction(() => window.__game && window.__game.scene, null, { timeout: 15000 }); await p.waitForTimeout(800);
  const wait = ms => p.waitForTimeout(ms), key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await wait(130); } };
  const shot = n => p.locator('#screen').screenshot({ path: `${outDir}/${n}.png` });
  const st = await p.evaluate(() => { const s = __game.state; return { rooms: Object.keys(s.rooms).length, scales: s.rooms.scales, tries: s.tries.scales, weigh: s.weigh, stars: __game.totalStars() + '/' + __game.maxStars(), route: __game.route() }; });
  console.log('loaded', JSON.stringify(st));
  await key('Space'); await wait(2600); console.log('scene', await p.evaluate(() => __game.scene()), 'floor', await p.evaluate(() => __game.state.floor)); await shot('0_hall');
  for (let i = 0; i < 6 && await p.evaluate(() => __game.scenes.corridor.dbg.busy()); i++) { await key('Space'); await wait(250); }
  /* the Laundry is finished, so the hall says once that the way on is open; then out to the map and along the road */
  await wait(1500); await shot('1_open'); await key('l'); await wait(1200);
  const nodes = await p.evaluate(() => __game.scenes.campus.dbg.nodes()); console.log('map', nodes.map(n => n.kind + ':' + (n.id || n.name) + (n.open === false ? '(shut)' : '')).join(' '));
  await shot('2_map'); await key('ArrowRight'); await wait(1200); await shot('3_map_at_5'); await key('Space'); await wait(2400);
  console.log('scene', await p.evaluate(() => __game.scene()), 'floor', await p.evaluate(() => __game.state.floor), 'said', await p.evaluate(() => __game.said));
  for (let i = 0; i < 8 && await p.evaluate(() => __game.scenes.corridor.dbg.busy()); i++) { await key('Space'); await wait(250); }
  await shot('4_weighhouse');
  /* into the first station, and far enough to see that its data is there */
  await p.evaluate(() => __game.scenes.corridor.dbg.at(292)); await wait(300); await key('Space'); await wait(1400);
  for (let i = 0; i < 12 && await p.evaluate(() => !!__game.narrating); i++) { await key('Space'); await wait(220); }
  await wait(400); await shot('5_scales');
  console.log('station', await p.evaluate(() => __game.scene()), await p.evaluate(() => __game.scenes.scales.phase()), 'heaps', await p.evaluate(() => __game.scenes.scales.dbg.heaps().length));
  /* and the save that is written back still holds the old stars */
  await key('Escape'); await wait(1200);
  const saved = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('cyteseeing-save-v1')); return { droplets: s.rooms.droplets, counter: s.rooms.counter, scales: s.rooms.scales, floor: s.floor }; });
  console.log('saved', JSON.stringify(saved));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 6))); await b.close();
})();
