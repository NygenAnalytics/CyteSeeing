// "Restart game" (two clicks) wipes the save. It used to leave the old scene drawing for a few frames on a project that
// was gone, which threw on the map and in a stage hall. From each: the title at once, no error, and a new game starts.
const { chromium } = require('playwright');
(async () => {
  const [,, indexPath] = process.argv;
  const b = await chromium.launch(), errs = [];
  const p = await b.newPage({ viewport: { width: 1200, height: 760 } });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + indexPath + '?debug'); await p.waitForTimeout(1500);
  const wait = ms => p.waitForTimeout(ms), key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await wait(140); } };
  const scene = () => p.evaluate(() => __game.scene());
  const moves = async () => { const t1 = await p.evaluate(() => __game.t); await wait(400); return (await p.evaluate(() => __game.t)) > t1; };
  const restart = async () => { await p.click('#btn-reset'); await wait(150); await p.click('#btn-reset'); await wait(900); };
  const report = async from => console.log('restart from ' + from + ': scene', await scene(), '| project', await p.evaluate(() => __game.profile.scenario || 'none'), '| stars', await p.evaluate(() => __game.totalStars()),
    '| clock moves', await moves(), '| errors', errs.length);
  /* a project in hand, then: the map */
  const take = async () => { await p.evaluate(() => { __game.setScenario('response'); }); await wait(300); };
  await key('Space'); await wait(2500); await take();
  await p.evaluate(() => __game.go('campus', {})); for (let i = 0; i < 30 && await scene() !== 'campus'; i++) await wait(150); await wait(600);
  await restart(); await report('the map');
  /* the hall of stage 3, which draws from the cells of the project */
  await key('Space'); await wait(2500); await take();
  await p.evaluate(() => { const G = __game; G.hall.summon(G.STAGES.make.makes.concat(G.STAGES.map.makes)); G.go('corridor', { floor: 'who', from: 'lift' }); });
  for (let i = 0; i < 60 && !(await scene() === 'corridor' && await p.evaluate(() => __game.state.floor) === 'who'); i++) await wait(150); await wait(1500);
  console.log('in the hall of', await p.evaluate(() => __game.state.floor));
  await restart(); await report('a stage hall');
  /* a station, with its notebook page and code tabs */
  await key('Space'); await wait(2500); await take();
  await p.evaluate(() => __game.go('droplets', {})); for (let i = 0; i < 40 && await scene() !== 'droplets'; i++) await wait(150); await wait(800);
  await restart(); await report('a station');
  /* and the game starts again from the top, by keyboard: the click on the button must not keep the keys */
  console.log('keys go to', await p.evaluate(() => document.activeElement.id || document.activeElement.tagName));
  await key('Space'); for (let i = 0; i < 30 && await scene() !== 'corridor'; i++) await wait(150); await wait(1200);
  console.log('a new game: scene', await scene(), '| floor', await p.evaluate(() => __game.state.floor), '| project', await p.evaluate(() => __game.profile.scenario || 'none'));
  /* the same after a click on the sound button and on a code tab: the arrow keys still walk */
  for (let i = 0; i < 20 && await p.evaluate(() => __game.scenes.corridor.dbg.busy()); i++) { await key('Space'); await wait(150); }
  const x0 = await p.evaluate(() => __game.scenes.corridor.dbg.heroX());
  await p.click('#btn-sound'); await wait(150); await p.click('#btn-sound'); await wait(150);
  await p.keyboard.down('ArrowRight'); await wait(500); await p.keyboard.up('ArrowRight'); await wait(150);
  const x1 = await p.evaluate(() => __game.scenes.corridor.dbg.heroX());
  console.log('after a click on SOUND: keys go to', await p.evaluate(() => document.activeElement.id), '| walked', x1 > x0);
  await p.evaluate(() => { __game.setScenario('response'); __game.go('droplets', {}); }); for (let i = 0; i < 40 && await scene() !== 'droplets'; i++) await wait(150); await wait(900);
  const tab = p.locator('#term-langs [data-lang]').first(); const tabs = await p.locator('#term-langs [data-lang]').count();
  if (tabs) { await tab.click(); await wait(150); }
  console.log('after a click on a code tab (' + tabs + '): keys go to', await p.evaluate(() => document.activeElement.id));
  /* a field that is typed into keeps the keyboard, and a button pressed from the keyboard keeps it too */
  await p.focus('#btn-sound'); await p.keyboard.press('Enter'); await wait(150);
  console.log('SOUND pressed from the keyboard: keys stay on', await p.evaluate(() => document.activeElement.id)); await p.keyboard.press('Enter'); await wait(100);
  console.log('ERRORS', JSON.stringify(errs.slice(0, 6)));
  await b.close();
})();
