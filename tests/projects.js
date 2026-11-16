// A new player takes the brain project, looks at its stations, then switches to the blood project and back.
// Checks: the brain words reach the shared stations, each project keeps its own progress, nothing errors.
const { chromium } = require('playwright');
(async () => {
  const [,, indexPath, outDir] = process.argv;
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + indexPath + '?debug'); await p.waitForTimeout(1500);
  const shot = n => p.locator('#screen').screenshot({ path: `${outDir}/${n}.png` }), wait = ms => p.waitForTimeout(ms);
  const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await wait(130); } };
  const scene = () => p.evaluate(() => __game.scene()), said = () => p.evaluate(() => __game.said || '');
  const hall = (fn, a) => p.evaluate(([f, x]) => __game.scenes.corridor.dbg[f](x), [fn, a]);
  const settle = async () => { for (let i = 0; i < 12 && await scene() === 'corridor' && await hall('busy'); i++) { await key('Space'); await wait(260); } };
  const camp = (fn, a) => p.evaluate(([f, x]) => __game.scenes.campus.dbg[f](x), [fn, a]);
  const talkCampus = async () => { for (let i = 0; i < 8 && await scene() === 'campus' && await camp('busy'); i++) { await key('Space'); await wait(300); } };
  // sign in with the default name, meet Vera, take the brain parcel
  await key('Space'); await wait(700); await key('Enter'); await wait(1900); await wait(2200); await settle();
  console.log('name', await p.evaluate(() => __game.you()), 'scene', await scene());
  await hall('at', 300); await wait(300); await key('Space'); await wait(400); console.log('label:', await said()); await shot('b0_label'); await key('Space'); await wait(1000);
  console.log('brief:', await said(), '| scenario', await p.evaluate(() => __game.profile.scenario), 'sys', await p.evaluate(() => __game.sys.id));
  for (let i = 0; i < 8 && await scene() !== 'campus'; i++) { await key('Space'); await wait(400); }
  await wait(800); await shot('b1_campus'); console.log('nodes', JSON.stringify((await camp('nodes')).map(n => n.kind + ':' + (n.id || n.name) + (n.open === false ? '(shut)' : ''))));
  await key('ArrowRight', 1); await wait(900); await key('ArrowRight', 1); await wait(900); await key('ArrowRight', 1); await wait(900); await shot('b2_campus_who'); await key('Space'); await wait(400); console.log('sign:', await said()); await talkCampus();
  console.log('stars', await p.evaluate(() => __game.totalStars() + '/' + __game.maxStars()));
  // the shared stations, on brain cells
  await p.evaluate(() => { const s = __game.state; Object.keys(s.rooms).forEach(k => { s.rooms[k] = { done: true, stars: 3 }; }); s.met = s.met2 = true; s.unclog = true; Object.keys(s.tries).forEach(k => { s.tries[k] = 1; }); });
  for (const sc of ['soup', 'doublet', 'review', 'norm', 'hvg', 'pca', 'knn', 'umap', 'club']) {
    await p.evaluate(n => __game.go(n, {}), sc); await wait(sc === 'review' || sc === 'club' ? 1400 : 1100);
    for (let i = 0; i < 8 && await p.evaluate(() => !!__game.narrating); i++) { await key('Space'); await wait(200); }
    await wait(300); await shot('c_' + sc);
  }
  console.log('loaded', (await p.evaluate(() => __game.loaded())).length, 'scripts; systems:', JSON.stringify(await p.evaluate(() => __game.loaded().filter(f => f.indexOf('systems/') === 0))));
  // back to the bay, take the blood parcel: a separate project with its own progress
  await p.evaluate(() => __game.go('corridor', { floor: 'bay', from: 'lift' })); await wait(1200); await settle();
  await hall('at', 226); await wait(300); await key('Space'); await wait(400); await key('Space'); await wait(1000);
  for (let i = 0; i < 8 && await scene() !== 'campus'; i++) { await key('Space'); await wait(400); }
  await wait(800); await shot('d_campus_blood');
  console.log('switched to', await p.evaluate(() => __game.profile.scenario), 'sys', await p.evaluate(() => __game.sys.id), 'stars', await p.evaluate(() => __game.totalStars() + '/' + __game.maxStars()), 'droplets done?', await p.evaluate(() => __game.state.rooms.droplets.done));
  await p.evaluate(() => __game.go('corridor', { floor: 'bay', from: 'lift' })); await wait(1200); await settle(); await shot('d_bay_two');
  await hall('at', 300); await wait(300); await key('Space'); await wait(400); await key('Space'); await wait(1000);
  for (let i = 0; i < 8 && await scene() !== 'campus'; i++) { await key('Space'); await wait(400); }
  console.log('back on', await p.evaluate(() => __game.profile.scenario), 'stars', await p.evaluate(() => __game.totalStars() + '/' + __game.maxStars()), 'droplets done?', await p.evaluate(() => __game.state.rooms.droplets.done));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 6), null, 1)); await b.close();
})();
