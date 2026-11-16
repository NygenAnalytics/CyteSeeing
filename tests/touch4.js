// floor 4 by touch on three phones: every game finished with taps and drags only
const { chromium, devices } = require('playwright');
(async () => {
  const [,, indexPath, outDir] = process.argv;
  const b = await chromium.launch();
  const errs = [];
  const run = async (name, dev) => {
    const ctx = await b.newContext({ ...dev });
    await ctx.addInitScript(sc => { if (!localStorage.getItem('cyteseeing-profile-v1')) localStorage.setItem('cyteseeing-profile-v1', JSON.stringify({ name: 'ARI', scenario: sc, sound: false, metVera: true })); }, process.env.SCEN || 'response');
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
    const ph = room => p.evaluate(r => __game.scenes[r].phase(), room);
    const scene = () => p.evaluate(() => __game.scene());
    const dbg = (fn, arg) => p.evaluate(([f, a]) => __game.scenes.corridor.dbg[f](a), [fn, arg]);
    const sc = (room, fn, a) => p.evaluate(([r, f, x]) => __game.scenes[r].dbg[f](x), [room, fn, a]);
    const shot = n => p.screenshot({ path: `${outDir}/${name}_${n}.png` });
    const tapUntil = async (room, want, vx = 160, vy = 60) => { for (let i = 0; i < 60 && await ph(room) !== want; i++) await tap(vx, vy); await wait(350); return ph(room); };
    const settle = async () => { for (let i = 0; i < 40 && await dbg('busy'); i++) await tap(160, 150); };
    const door = async (x, nm) => { await settle(); await dbg('at', x - 60); await wait(300); const cam = await dbg('cam'); await tap(x - cam, 100); for (let i = 0; i < 30 && await scene() !== nm; i++) await wait(150); const s = await scene(); if (s !== nm) console.log(nm, 'DOOR FAIL got', s); return s === nm; };
    // a finger dragged across the screen, in game pixels
    const drag = async (pts) => { const r = await box(), cdp = await ctx.newCDPSession(p); const at = q => [{ x: r.x + q[0] * r.width / 320, y: r.y + q[1] * r.height / 180 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(pts[0]) }); await wait(60);
      for (const q of pts.slice(1)) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(q) }); await wait(70); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await wait(120); };
    await tap(160, 90); await wait(3600); await settle();
    // out to the map by the header button, a tap on the Laundry, and Tomo does the stages before it
    const bx = await p.evaluate(() => { const G = __game, st = G.STAGES[G.state.floor]; return 5 + Math.ceil(G.tw((st.n ? st.n + '  ' : '') + st.name, 'sm')) + 8 + 8; });
    await tap(bx, 5); for (let i = 0; i < 20 && await scene() !== 'campus'; i++) await wait(150); await wait(500); await shot('map');
    const nd = (await p.evaluate(() => __game.scenes.campus.dbg.nodes())).find(n => n.id === 'runs');
    await raw(nd.x, nd.y - 10); for (let i = 0; i < 40 && !(await p.evaluate(() => __game.scenes.campus.dbg.busy())); i++) await wait(150);
    for (let i = 0; i < 40 && await p.evaluate(() => __game.scene() === 'campus' && __game.scenes.campus.dbg.at() !== 5); i++) await wait(150);
    await wait(500); await shot('ask'); await raw(236, 77); await wait(500);
    for (let i = 0; i < 30 && await scene() !== 'corridor'; i++) { await raw(160, 150); await wait(200); }
    for (let i = 0; i < 14 && await p.evaluate(() => __game.state.floor) !== 'runs'; i++) { await tap(160, 150); await wait(200); }
    await wait(1800); console.log(name, 'floor', await p.evaluate(() => __game.state.floor)); await settle(); await wait(400); await shot('laundry');
    // 4-1: tap an island, tap the thread button, tap its partner, tap the button
    await door(284, 'sort'); await wait(900); await tapUntil('sort', 'play'); await shot('sort0');
    const isl = await sc('sort', 'islands');
    for (const a of isl.filter(q => q.load === 0)) { const bq = isl[a.partner]; await tap(a.x, a.y); await tap(146, 152); await tap(bq.x, bq.y); await tap(146, 152); await wait(150); }
    await shot('sort1'); console.log(name, 'ties', (await sc('sort', 'ties')).length, 'slips', await sc('sort', 'slips'));
    await tap(258, 152); await wait(500); await hush(); await wait(300); await shot('sort2'); console.log(name, 'sort', await ph('sort')); await tap(243, 167); await wait(1600); await settle();
    // 4-2: - twice, the PPBP light, take out
    await door(466, 'wash'); await wait(3200); await tapUntil('wash', 'play'); await shot('wash0');
    /* - until the wash is neither too gentle nor too strong (blood: twice; cortex: three times) */
    for (let i = 0; i < 6; i++) { await tap(116, 152); await wait(1300); const v = await sc('wash', 'verdict'); if (!v.under && !v.over) break; } await shot('wash1');
    await tap(280, 94); await wait(300); await shot('wash2'); console.log(name, 'light', await sc('wash', 'light'), 'di', await sc('wash', 'di'));
    await tap(279, 152); await wait(500); await hush(); await wait(300); await shot('wash3'); console.log(name, 'wash', await ph('wash')); await tap(243, 167); await wait(1600); await settle();
    // 4-3: drag the lamp across the map to the dark group, then the flag button
    await door(716, 'lost'); await wait(2500); await tapUntil('lost', 'sweep', 250, 60); await shot('lost0');
    const cells = await sc('lost', 'cells'), dark = cells.filter(c => !c.lit), grp = dark.filter(c => dark.filter(d => Math.hypot(d.x - c.x, d.y - c.y) < 14).length >= 4);
    const gx = grp.reduce((s, c) => s + c.x, 0) / grp.length, gy = grp.reduce((s, c) => s + c.y, 0) / grp.length;
    await drag([[30, 100], [60, 90], [90, 70], [110, 60], [gx - 20, gy - 10], [gx - 6, gy - 2], [gx, gy]]); await wait(300);
    console.log(name, 'lamp', JSON.stringify((await sc('lost', 'lamp')).map(Math.round)), 'want', Math.round(gx), Math.round(gy), 'checked', await sc('lost', 'checked')); await shot('lost1');
    await tap(263, 152); await wait(500); await hush(); await wait(300); await shot('lost2'); console.log(name, 'lost', await ph('lost')); await tap(243, 167); await wait(1600); await settle();
    // the counter: tap tubes to swap, tap a tube to split, tap RUN
    await door(956, 'counter'); await wait(800); await tapUntil('counter', 'play', 160, 20); await shot('k1');
    const spot = i => sc('counter', 'spot', i);
    let q = await spot(0); await tap(q[0], q[1]); q = await spot(4); await tap(q[0], q[1]);
    let tubes = await sc('counter', 'tubes'); const a = tubes.findIndex(t => t.run === 0 && t.cond === 'P'), c = tubes.findIndex(t => t.run === 1 && t.cond === 'C');
    q = await spot(a); await tap(q[0], q[1]); q = await spot(c); await tap(q[0], q[1]); await shot('k1b'); console.log(name, 'order 1 gauge', await sc('counter', 'gauge'));
    await tap(263, 152); await wait(500); await tapUntil('counter', 'play', 160, 20); console.log(name, 'order', await sc('counter', 'order')); await shot('k2');
    q = await spot(1); await tap(q[0], q[1]); await shot('k2b'); console.log(name, 'order 2 gauge', await sc('counter', 'gauge'));
    await tap(263, 152); await wait(500); await tapUntil('counter', 'play', 160, 20); console.log(name, 'order', await sc('counter', 'order')); await shot('k3');
    await tap(82, 119); await wait(200); await shot('k3b'); console.log(name, 'tag', await sc('counter', 'tag'), 'gauge', await sc('counter', 'gauge'));
    await tap(263, 152); await wait(500); await tapUntil('counter', 'result', 160, 20); await hush(); await wait(300); await shot('k4'); console.log(name, 'counter', await ph('counter'));
    await tap(243, 167); await wait(1800); await settle(); await shot('end');
    console.log(name, 'rooms', JSON.stringify(await p.evaluate(() => ['sort', 'wash', 'lost', 'counter'].map(k => __game.state.rooms[k].stars))));
    await ctx.close();
  };
  await run('iphone', devices['iPhone 13']);
  await run('iphone_land', devices['iPhone 13 landscape']);
  await run('pixel', devices['Pixel 7']);
  console.log('ERRORS', JSON.stringify(errs.slice(0, 8)));
  await b.close();
})();
