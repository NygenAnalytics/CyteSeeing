// the live site after the deploy, in a real browser through the session proxy:
// a new player signs in, takes the brain parcel, walks to stage 1; then stations of every stage open for
// both projects. Counts what was fetched at boot and on demand, and any failed request or error.
const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2], out = process.argv[3];
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const b = await chromium.launch({ proxy: proxy ? { server: proxy } : undefined });
  const p = await (await b.newContext({ viewport: { width: 1400, height: 820 } })).newPage();
  const errs = [], bad = [], js = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message.slice(0, 160)));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 160)); });
  p.on('response', r => { const u = r.url(); if (r.status() >= 400) bad.push(r.status() + ' ' + u.slice(-70)); if (/\/js\/.*\.js/.test(u)) js.push(u.split('/js/')[1]); });
  const wait = ms => p.waitForTimeout(ms), key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await wait(140); } };
  const scene = () => p.evaluate(() => __game.scene());
  await p.goto(url + '?debug', { waitUntil: 'load', timeout: 60000 }); await wait(2000);
  const boot = js.length; console.log('boot scripts', boot, '| title scene:', await scene());
  await key('Space'); await wait(3500); console.log('after start:', await scene());
  for (let i = 0; i < 12 && await p.evaluate(() => __game.scenes.corridor.dbg.busy()); i++) { await key('Space'); await wait(260); }
  console.log('playing as', await p.evaluate(() => __game.you()), '| scene', await scene(), '| stage', await p.evaluate(() => __game.state.floor));
  await p.evaluate(() => __game.scenes.corridor.dbg.at(300)); await wait(300); await key('Space'); await wait(500); await key('Space'); await wait(1200);
  for (let i = 0; i < 10 && await scene() !== 'campus'; i++) { await key('Space'); await wait(450); }
  console.log('project', await p.evaluate(() => __game.profile.scenario), '| scene', await scene(), '| system', await p.evaluate(() => __game.sys && __game.sys.id));
  await p.locator('#screen').screenshot({ path: out + '/live_map.png' });
  await key('ArrowRight'); await wait(1200); await key('Space'); await wait(3000);
  console.log('walked in:', await scene(), await p.evaluate(() => __game.state.floor), '| on demand so far:', js.length - boot);
  const open = async rooms => { for (const r of rooms) { await p.evaluate(x => __game.go(x, {}), r); await wait(2600); const s = await scene(); if (s !== r) console.log('  ROOM DID NOT OPEN', r, 'got', s); } };
  await p.evaluate(() => { const s = __game.state; Object.keys(s.rooms).forEach(k => { s.rooms[k] = { done: true, stars: 3 }; }); s.met = s.met2 = s.met3 = s.met4 = true; s.unclog = true; });
  await open(['soup', 'hvg', 'cut', 'lineup', 'name', 'oracle', 'sort', 'wash', 'lost', 'counter']);
  console.log('brain: ten stations opened; scene now', await scene());
  await p.locator('#screen').screenshot({ path: out + '/live_brain_counter.png' });
  await p.evaluate(() => __game.load(['systems/immune.js']).then(() => { __game.setScenario('response'); const s = __game.state; Object.keys(s.rooms).forEach(k => { s.rooms[k] = { done: true, stars: 3 }; }); s.met = s.met2 = s.met3 = s.met4 = true; s.unclog = true; }));
  await wait(600); await open(['soup', 'hvg', 'lineup', 'name', 'wash', 'lost']);
  console.log('blood: six stations opened; system', await p.evaluate(() => __game.sys.id), '| scene', await scene());
  await p.locator('#screen').screenshot({ path: out + '/live_blood_lost.png' });
  /* every script fetched on demand carries the version the site is serving, whatever that is today */
  const lazy = js.slice(boot), version = await p.evaluate(() => __game.VERSION);
  console.log('on demand in total:', lazy.length, '| version', version, '| all carry it:', lazy.every(f => f.endsWith('?v=' + version)), '| sample:', lazy.slice(0, 4).join(', '));
  console.log('failed requests', JSON.stringify(bad)); console.log('ERRORS', JSON.stringify(errs.slice(0, 6)));
  await b.close();
})();
