// stage 3 by touch on three phones, for the project named in SCEN (response or cortex): every station finished with taps only
const { chromium, devices } = require('playwright');
(async () => {
  const [,, indexPath, outDir] = process.argv;
  const b = await chromium.launch();
  const errs = [];
  const run = async (name, dev) => {
    const ctx = await b.newContext({ ...dev });
    /* a player who has signed in and taken a project, so the title leads straight into the first hall */
    await ctx.addInitScript(sc => { if (!localStorage.getItem('cyteseeing-profile-v1')) localStorage.setItem('cyteseeing-profile-v1', JSON.stringify({ name: 'ARI', scenario: sc, sound: false, metVera: true })); }, process.env.SCEN || 'response');
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ' PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(name + ' CONSOLE ' + m.text()); });
    await p.goto('file://' + indexPath + '?debug'); await p.waitForTimeout(1500);
    const wait = ms => p.waitForTimeout(ms);
    const box = async () => p.locator('#screen').boundingBox();
    const raw = async (vx, vy) => { const r = await box(); await p.touchscreen.tap(r.x + vx * r.width / 320, r.y + vy * r.height / 180); await wait(170); };
    const tap = async (vx, vy) => { for (let i = 0; i < 40 && await p.evaluate(() => !!__game.narrating); i++) await raw(160, 100); await raw(vx, vy); };
    const ph = room => p.evaluate(r => __game.scenes[r].phase(), room);
    const scene = () => p.evaluate(() => __game.scene());
    const dbg = (fn, arg) => p.evaluate(([f, a]) => __game.scenes.corridor.dbg[f](a), [fn, arg]);
    const sc = (room, fn) => p.evaluate(([r, f]) => __game.scenes[r].dbg[f](), [room, fn]);
    const shot = n => p.screenshot({ path: `${outDir}/${name}_${n}.png` });
    const tapUntil = async (room, want, vx = 160, vy = 60) => { for (let i = 0; i < 60 && await ph(room) !== want; i++) await tap(vx, vy); await wait(350); return ph(room); };
    const settle = async () => { for (let i = 0; i < 40 && await dbg('busy'); i++) await tap(160, 150); };
    const door = async (x, nm) => { await settle(); await dbg('at', x - 60); await wait(300); const cam = await dbg('cam'); await tap(x - cam, 100); for (let i = 0; i < 30 && await scene() !== nm; i++) await wait(150); const s = await scene(); if (s !== nm) console.log(nm, 'DOOR FAIL got', s); return s === nm; };
    await tap(160, 90); await wait(3600); await settle();
    // out to the map by the header button, a tap on the Bureau, and Tomo does the stages before it
    const bx = await p.evaluate(() => { const G = __game, st = G.STAGES[G.state.floor]; return 5 + Math.ceil(G.tw((st.n ? st.n + '  ' : '') + st.name, 'sm')) + 8 + 8; });
    await tap(bx, 5); for (let i = 0; i < 20 && await scene() !== 'campus'; i++) await wait(150); await wait(500); await shot('map');
    const nodes = await p.evaluate(() => __game.scenes.campus.dbg.nodes()), ni = nodes.findIndex(n => n.id === 'who'), nd = nodes[ni];
    await raw(nd.x, nd.y - 10); for (let i = 0; i < 40 && !(await p.evaluate(() => __game.scenes.campus.dbg.busy())); i++) await wait(150);
    for (let i = 0; i < 40 && await p.evaluate(n => __game.scene() === 'campus' && __game.scenes.campus.dbg.at() !== n, ni); i++) await wait(150);
    await wait(500); await shot('ask'); await raw(236, 77); await wait(500);
    for (let i = 0; i < 30 && await scene() !== 'corridor'; i++) { await raw(160, 150); await wait(200); }
    for (let i = 0; i < 14 && await p.evaluate(() => __game.state.floor) !== 'who'; i++) { await tap(160, 150); await wait(200); }
    await wait(1800); console.log(name, 'floor', await p.evaluate(() => __game.state.floor)); await settle(); await wait(400); await shot('bureau');
    // 3-1, by the zoom route
    await door(280, 'cut'); await wait(900); await tapUntil('cut', 'dial'); await shot('cut0');
    for (let i = 0; i < 3; i++) { await tap(174, 152); await wait(200); } await shot('cut'); await tap(281, 152); await wait(500); console.log(name, 'cut', await ph('cut'));
    await tap(243, 166); await wait(500); console.log(name, 'cut', await ph('cut'));
    const c = await p.evaluate(() => { const at = __game.atlas, a = at.audit(0.3), pos = at.place(15, 38, 160, 80), m = a.mem[a.mixed[0]]; let x = 0, y = 0; m.forEach(i => { x += pos[i][0]; y += pos[i][1]; }); return [x / m.length, y / m.length]; });
    await tap(c[0], c[1]); await wait(250); console.log(name, 'cut sel', await sc('cut', 'sel')); await shot('cutfix'); await tap(188, 152); await wait(500); console.log(name, 'cut', await ph('cut'), 'mistakes', await sc('cut', 'mistakes'));
    await tap(243, 166); await wait(1600);
    // 3-2
    await door(452, 'lineup'); await wait(600); await tapUntil('lineup', 'pick');
    for (let r = 0; r < 4; r++) {
      await tap(4, 100); for (let i = 0; i < 20 && await ph('lineup') !== 'pick'; i++) { await wait(200); await tap(4, 100); }
      const gs = await sc('lineup', 'genes'), k = gs.findIndex(g => g.good);
      if (k >= 0) { await tap(230, 36 + k * 11); await wait(200); if (r === 1) await shot('lineup'); await tap(166, 152); } else { await shot('lineup4'); await tap(265, 152); await wait(500); await shot('lineup_out'); }
      await wait(400);
    }
    for (let i = 0; i < 20 && await ph('lineup') !== 'result'; i++) { await wait(200); await tap(4, 100); }
    await tap(160, 60); await wait(400); console.log(name, 'lineup', await ph('lineup'), 'mistakes', await sc('lineup', 'mistakes')); await shot('dots'); await tap(243, 166); await wait(1600);
    // 3-3
    await door(676, 'name'); await wait(600); await tapUntil('name', 'pick');
    for (let i = 0; i < 30 && await ph('name') !== 'result'; i++) {
      await tap(4, 100); const st = await sc('name', 'state'), k = st.opts.findIndex(o => o.fits);
      if (k >= 0) { await tap(66, 82 + k * 12); await wait(150); if (st.ci === 2 && st.path.length === 1) await shot('name'); await tap(170, 152); } else await tap(266, 152);
      await wait(600);
    }
    await tap(4, 100); await wait(300); console.log(name, 'name', await ph('name'), JSON.stringify(await sc('name', 'state')).slice(0, 80)); await shot('files'); await tap(243, 166); await wait(1600);
    // 3-4
    await door(892, 'oracle'); await wait(600); await tapUntil('oracle', 'cart'); await shot('carts'); await tap(159, 34); await wait(250); await shot('carts2'); await tap(265, 152); await wait(900); await shot('slot'); await wait(4200);
    await tap(4, 100); await wait(300); await shot('settle'); await tap(260, 152); await wait(400); await tap(158, 152); await wait(400); await tap(4, 100); await wait(400);
    console.log(name, 'oracle', await ph('oracle'), JSON.stringify(await sc('oracle', 'state')).slice(0, 70)); await shot('oracle'); await tap(243, 166); await wait(1600);
    // the Chief
    await door(1048, 'chief'); await wait(600); await tapUntil('chief', 'ask');
    for (let q = 0; q < 5; q++) { await tap(4, 100); await wait(900); const st = await sc('chief', 'state'), k = st.cards.indexOf(st.ok[0]); if (q === 3) await shot('chief'); await tap(6 + k * 78 + 37, 155); await wait(350); if (await ph('chief') === 'ask' && (await sc('chief', 'state')).qi === q) { await tap(6 + k * 78 + 37, 155); await wait(350); } }
    await tap(4, 100); await wait(500); console.log(name, 'chief', await ph('chief'), JSON.stringify(await sc('chief', 'state')).slice(0, 40)); await shot('verdict'); await tap(243, 166); await wait(2500); await settle(); await shot('end');
    console.log(name, JSON.stringify(await p.evaluate(() => ({ scene: __game.scene(), rooms: ['cut', 'lineup', 'name', 'oracle', 'chief'].map(k => k + ':' + __game.state.rooms[k].stars), over: document.documentElement.scrollWidth > innerWidth }))));
    await ctx.close();
  };
  await run('iphone', devices['iPhone 13']);
  await run('land', devices['iPhone 13 landscape']);
  await run('pixel', devices['Pixel 7']);
  console.log('ERRORS', JSON.stringify(errs.slice(0, 8)));
  await b.close();
})();
