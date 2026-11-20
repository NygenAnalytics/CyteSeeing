// a new player: the title, straight into arrivals, a name from the badge printer, a parcel, the map, into stage 1
const { chromium } = require('playwright');
(async () => {
  const [,, indexPath, outDir] = process.argv;
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + indexPath + '?debug'); await p.waitForTimeout(1500);
  const shot = n => p.locator('#screen').screenshot({ path: `${outDir}/${n}.png` }), key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(130); } }, wait = ms => p.waitForTimeout(ms);
  const scene = () => p.evaluate(() => __game.scene()), said = () => p.evaluate(() => __game.said || '');
  await shot('0_title'); await key('Space'); await wait(2600); console.log('after title:', await scene(), 'as', await p.evaluate(() => __game.you()));
  await shot('2_bay_intro'); console.log('said:', await said());
  for (let i = 0; i < 8 && await p.evaluate(() => __game.scenes.corridor.dbg.busy()); i++) { await key('Space'); await wait(250); }
  await shot('2_bay');
  /* nobody is asked for a name. The badge printer by the lift takes one from whoever wants it */
  const printer = await p.evaluate(() => __game.scenes.corridor.dbg.items().find(i => i[0] === 'badge')[1]);
  await p.evaluate(x => __game.scenes.corridor.dbg.at(x), printer); await wait(300); await shot('1_printer'); await key('Space'); await wait(900); console.log('at the printer:', await scene()); await shot('1_badge');
  await p.keyboard.type('KIM', { delay: 80 }); await wait(200); await shot('1_badge_typed'); await key('Enter'); await wait(2400); console.log('after the badge:', await scene(), JSON.stringify(await p.evaluate(() => __game.profile)));
  await shot('2_bay_named');
  await p.evaluate(() => __game.scenes.corridor.dbg.at(226)); await wait(300); await shot('2_bay_parcel'); await key('Space'); await wait(400); await shot('2_bay_label'); console.log('label:', await said());
  await key('Space'); await wait(900); console.log('scenario:', await p.evaluate(() => __game.profile.scenario), 'sys:', await p.evaluate(() => __game.sys && __game.sys.id)); await shot('2_bay_brief'); console.log('brief:', await said());
  for (let i = 0; i < 8 && await scene() !== 'campus'; i++) { await key('Space'); await wait(400); }
  await wait(900); console.log('scene:', await scene()); await shot('3_campus');
  console.log('nodes', JSON.stringify(await p.evaluate(() => __game.scenes.campus.dbg.nodes().map(n => n.kind + ':' + (n.id || n.name) + (n.open === false ? '(shut)' : '')))), 'at', await p.evaluate(() => __game.scenes.campus.dbg.at()));
  await key('ArrowRight'); await wait(900); await shot('3_campus_stage1'); await key('Space'); await wait(1500); console.log('scene:', await scene(), 'floor', await p.evaluate(() => __game.state.floor)); await wait(2500); await shot('4_make'); console.log('said:', await said());
  console.log('loaded', JSON.stringify(await p.evaluate(() => __game.loaded())));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 6), null, 1)); await b.close();
})();
