// the new start by touch on phones: sign in with the letter grid, take a parcel, walk the map, enter stage 1
const { chromium, devices } = require('playwright');
(async () => {
  const [,, indexPath, outDir] = process.argv;
  const b = await chromium.launch();
  const errs = [];
  const run = async (name, dev, parcel) => {
    const ctx = await b.newContext({ ...dev });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ' PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(name + ' CONSOLE ' + m.text()); });
    await p.goto('file://' + indexPath + '?debug'); await p.waitForTimeout(1500);
    const wait = ms => p.waitForTimeout(ms);
    const box = async () => p.locator('#screen').boundingBox();
    const raw = async (vx, vy) => { const r = await box(); await p.touchscreen.tap(r.x + vx * r.width / 320, r.y + vy * r.height / 180); await wait(170); };
    const talking = () => p.evaluate(() => !!__game.narrating);
    const scene = () => p.evaluate(() => __game.scene());
    const hall = (fn, a) => p.evaluate(([f, x]) => __game.scenes.corridor.dbg[f](x), [fn, a]);
    const camp = (fn, a) => p.evaluate(([f, x]) => __game.scenes.campus.dbg[f](x), [fn, a]);
    const shot = n => p.screenshot({ path: `${outDir}/${name}_${n}.png` });
    await raw(160, 90); for (let i = 0; i < 20 && await scene() !== 'start'; i++) await wait(150); await wait(500);
    // the letter grid: 7 columns, 22 by 20 pixels, from (150, 58)
    const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(['DEL', 'OK']);
    const letter = async k => { const i = KEYS.indexOf(k); await raw(150 + (i % 7) * 22 + 10, 58 + Math.floor(i / 7) * 20 + 9); };
    for (const k of ['M', 'A', 'X', 'X', 'DEL']) await letter(k);
    await shot('0_signin'); console.log(name, 'typed', await p.evaluate(() => __game.scenes.start.dbg.name()));
    await letter('OK'); for (let i = 0; i < 30 && await scene() !== 'corridor'; i++) await wait(150); await wait(2200);
    for (let i = 0; i < 20 && await hall('busy'); i++) { await raw(160, 150); await wait(120); }
    await shot('1_bay'); console.log(name, 'name', await p.evaluate(() => __game.you()), 'scene', await scene());
    // tap the parcel: the hero walks over and reads the label; then the right-hand answer takes it
    const px = parcel === 'cortex' ? 300 : 226;
    await hall('at', px - 50); await wait(300); const cam = await hall('cam'); await raw(px - cam, 110);
    for (let i = 0; i < 30 && !(await hall('asking')); i++) await wait(150); await shot('2_label');
    await raw(236, 77); await wait(900);
    for (let i = 0; i < 30 && await scene() !== 'campus'; i++) { await raw(160, 150); await wait(200); }
    await wait(700); await shot('3_map'); console.log(name, 'project', await p.evaluate(() => __game.profile.scenario), 'scene', await scene());
    // a tap on stage 1 walks there and goes in
    const nd = (await camp('nodes')).find(n => n.id === 'make');
    await raw(nd.x, nd.y - 10); for (let i = 0; i < 40 && await scene() !== 'corridor'; i++) await wait(150); await wait(1500);
    for (let i = 0; i < 20 && await hall('busy'); i++) { await raw(160, 150); await wait(120); }
    await shot('4_stage1'); console.log(name, 'scene', await scene(), 'stage', await p.evaluate(() => __game.state.floor), 'met', await p.evaluate(() => !!__game.state.met));
    // and back out by the header button
    const bx = await p.evaluate(() => { const G = __game, st = G.STAGES[G.state.floor]; return 5 + Math.ceil(G.tw((st.n ? st.n + '  ' : '') + st.name, 'sm')) + 8 + 8; });
    await raw(bx, 5); for (let i = 0; i < 20 && await scene() !== 'campus'; i++) await wait(150); await wait(400);
    // a building site: tap it, read the sign
    const site = (await camp('nodes')).find(n => n.kind === 'soon');
    await raw(site.x, site.y - 10); for (let i = 0; i < 50 && !(await talking()); i++) await wait(150);
    await shot('5_site'); console.log(name, 'sign:', (await p.evaluate(() => __game.said || '')).slice(0, 60));
    await ctx.close();
  };
  await run('iphone', devices['iPhone 13'], 'cortex');
  await run('iphone_land', devices['iPhone 13 landscape'], 'response');
  await run('pixel', devices['Pixel 7'], 'cortex');
  console.log('ERRORS', JSON.stringify(errs.slice(0, 8)));
  await b.close();
})();
