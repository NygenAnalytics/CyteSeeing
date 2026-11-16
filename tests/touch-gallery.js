// The Long Gallery by touch on three phones, from a save with every stage finished (done.js): the map, the five
// questions, the lectern and the close, with taps only. A tap on a frame walks to it; a second tap says "this one".
// The first phone points at one wrong frame on the way, so that a slip is seen by touch too.
const { chromium, devices } = require('playwright'), done = require('./done.js');
(async () => {
  const [,, indexPath, outDir] = process.argv, project = process.env.SCEN === 'cortex' ? 'cortex' : 'response';
  const b = await chromium.launch();
  const errs = [];
  const run = async (name, dev, slip) => {
    const ctx = await b.newContext({ ...dev });
    await done.init(ctx, project);
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ' PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(name + ' CONSOLE ' + m.text()); });
    await p.goto('file://' + indexPath + '?debug'); await p.waitForTimeout(1500);
    const wait = ms => p.waitForTimeout(ms);
    const box = async () => p.locator('#screen').boundingBox();
    const raw = async (vx, vy) => { const r = await box(); await p.touchscreen.tap(r.x + vx * r.width / 320, r.y + vy * r.height / 180); await wait(170); };
    const talking = () => p.evaluate(() => !!__game.narrating);
    const hush = async () => { for (let i = 0; i < 40 && await talking(); i++) await raw(160, 100); };
    const tap = async (vx, vy) => { await hush(); await raw(vx, vy); };
    const scene = () => p.evaluate(() => __game.scene());
    const dbg = (fn, arg) => p.evaluate(([f, a]) => __game.scenes.corridor.dbg[f](a), [fn, arg]);
    const g = (fn, a) => p.evaluate(([f, x]) => __game.kits.gallery.dbg[f](x), [fn, a]);
    const cl = (fn, a) => p.evaluate(([f, x]) => __game.scenes.close.dbg[f](x), [fn, a]);
    const shot = n => p.screenshot({ path: `${outDir}/${name}_${n}.png` });
    const settle = async () => { for (let i = 0; i < 40 && await dbg('busy'); i++) await tap(160, 150); };
    /* stand a little way off, tap the thing at height y, and wait until the player has walked to it */
    const go = async (x, y) => { await settle(); await dbg('at', x - 60); await wait(300); const cam = await dbg('cam'); await tap(x - cam, y); for (let i = 0; i < 40 && Math.abs(await dbg('heroX') - x) > 4; i++) await wait(100); await wait(350); };
    await tap(160, 90); await wait(3600); await settle();
    // out to the map by the header button, and a tap on the gallery at the end of the road
    const bx = await p.evaluate(() => { const G = __game, st = G.STAGES[G.state.floor]; return 5 + Math.ceil(G.tw((st.n ? st.n + '  ' : '') + st.name, 'sm')) + 8 + 8; });
    await tap(bx, 5); for (let i = 0; i < 20 && await scene() !== 'campus'; i++) await wait(150); await wait(500); await shot('map');
    const nodes = await p.evaluate(() => __game.scenes.campus.dbg.nodes()), nd = nodes.find(n => n.id === 'gallery');
    await raw(nd.x, nd.y - 10); for (let i = 0; i < 60 && await scene() !== 'corridor'; i++) await wait(200);
    await wait(1800); console.log(name, 'floor', await p.evaluate(() => __game.state.floor)); await shot('arrive'); await settle(); await wait(400); await shot('hall');
    const frames = await g('frames'), askers = await g('askers');
    for (let k = 0; k < askers.length; k++) {
      const a = askers[k], f = frames.find(q => q.room === a.room);
      await go(a.home, 120); await wait(300); if (k === 0) await shot('ask'); await hush(); await wait(300);
      if (slip && k === 1) {
        /* two taps on a frame that does not answer it */
        const w = frames.find(q => q.stage === f.stage && q.room !== a.room); await go(w.x, 48); const cam = await dbg('cam'); await raw(w.x - cam, 48); await wait(400); await shot('wrong'); await hush(); await wait(300);
        console.log(name, 'a wrong frame: slips', await g('slips'), 'in hand', await g('hold'));
      }
      await go(f.x, 48); if (k === 0) await shot('at_frame');
      const before = await g('settled'); const cam = await dbg('cam');
      await raw(f.x - cam, 48); await wait(400); if (k === 0) await shot('right'); await hush(); await wait(500);
      console.log(name, 'question', k, a.who, f.code, 'one tap: settled', before, 'two taps: settled', await g('settled'), 'slips', await g('slips'));
    }
    await settle(); await wait(300); await shot('all_settled');
    // the lectern: a tap walks there and starts the close; taps go through it
    const lx = await g('lectern'); await go(lx, 110); for (let i = 0; i < 30 && await scene() !== 'close'; i++) await wait(150); await wait(600); await shot('close0');
    let seen = '', n = 0;
    for (let i = 0; i < 80 && await p.evaluate(() => __game.scenes.close.phase()) !== 'end'; i++) { const sl = await cl('slide'); if (sl !== seen) { seen = sl; await wait(250); await shot('close_' + (++n) + '_' + sl); } await raw(160, 60); await wait(200); }
    await wait(500); await shot('close_end'); const stars = await cl('stars'), slips = await cl('slips');
    const q = await cl('spot', 1); await raw(q[0], q[1]); for (let i = 0; i < 20 && await scene() !== 'campus'; i++) await wait(150); await wait(600); await shot('end');
    console.log(name, 'scene', await scene(), 'stars', await p.evaluate(() => __game.totalStars() + '/' + __game.maxStars()), 'finished', JSON.stringify(await p.evaluate(() => __game.profile.finished)));
    console.log(name, 'close', stars, 'slips', slips);
    await ctx.close();
  };
  await run('iphone', devices['iPhone 13'], true);
  await run('iphone_land', devices['iPhone 13 landscape']);
  await run('pixel', devices['Pixel 7']);
  console.log('ERRORS', JSON.stringify(errs.slice(0, 8)));
  await b.close();
})();
