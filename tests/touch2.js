const { chromium, devices } = require('playwright');
(async () => {
  const [,, indexPath, outDir] = process.argv;
  const b = await chromium.launch();
  const errs = [];
  const run = async (name, dev) => {
    const ctx = await b.newContext({ ...dev });
    /* a player who has signed in and taken a project, so the title leads straight into the first hall (as f4touch.js does) */
    await ctx.addInitScript(sc => { if (!localStorage.getItem('cyteseeing-profile-v1')) localStorage.setItem('cyteseeing-profile-v1', JSON.stringify({ name: 'ARI', scenario: sc, sound: false, metVera: true })); }, process.env.SCEN || 'response');
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ' PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(name + ' CONSOLE ' + m.text()); });
    await p.goto('file://' + indexPath + '?debug'); await p.waitForTimeout(1500);
    const wait = ms => p.waitForTimeout(ms);
    const box = async () => p.locator('#screen').boundingBox();
    const raw = async (vx, vy) => { const r = await box(); await p.touchscreen.tap(r.x + vx * r.width / 320, r.y + vy * r.height / 180); await wait(170); };
    // somebody talking? tap through it first, then make the tap that was asked for (as touch.js and f4touch.js do)
    const tap = async (vx, vy) => { for (let i = 0; i < 40 && await p.evaluate(() => !!__game.narrating); i++) await raw(160, 100); await raw(vx, vy); };
    const ph = room => p.evaluate(r => __game.scenes[r].phase(), room);
    const scene = () => p.evaluate(() => __game.scene());
    const dbg = (fn, arg) => p.evaluate(([f, a]) => __game.scenes.corridor.dbg[f](a), [fn, arg]);
    const tapUntil = async (room, want, vx = 160, vy = 60) => { for (let i = 0; i < 50 && await ph(room) !== want; i++) await tap(vx, vy); await wait(350); if (await p.evaluate(() => __game.card.open)) { await tap(160, 90); await wait(150); } return ph(room); };
    const settle = async () => { for (let i = 0; i < 40 && await dbg('busy'); i++) await tap(160, 150); };
    const door = async (x, name) => { await settle(); await dbg('at', x - 60); await wait(300); const cam = await dbg('cam'); await tap(x - cam, 100); for (let i = 0; i < 30 && await scene() !== name; i++) await wait(150); const s = await scene(); if (s !== name) console.log(name, 'DOOR FAIL got', s); return s === name; };
    // stage 1 is done: go on to stage 2 by touch
    await tap(160, 90); await wait(3600); await settle();
    await p.evaluate(() => { const s = __game.state; ['droplets', 'cliff', 'qc', 'soup', 'doublet', 'review'].forEach(r => { s.rooms[r] = { done: true, stars: 3 }; }); });
    // out to the map by the header button, then a tap on the Cloud (as f4touch.js does for the Laundry)
    const bx = await p.evaluate(() => { const G = __game, st = G.STAGES[G.state.floor]; return 5 + Math.ceil(G.tw((st.n ? st.n + '  ' : '') + st.name, 'sm')) + 8 + 8; });
    await tap(bx, 5); for (let i = 0; i < 20 && await scene() !== 'campus'; i++) await wait(150); await wait(500);
    await p.screenshot({ path: `${outDir}/${name}_map.png` });
    const nd = (await p.evaluate(() => __game.scenes.campus.dbg.nodes())).find(n => n.id === 'map');
    await tap(nd.x, nd.y - 10);
    for (let i = 0; i < 60 && !(await scene() === 'corridor' && await p.evaluate(() => __game.state.floor) === 'map'); i++) await wait(150);
    await wait(1500);
    console.log(name, 'after lift: floor', await p.evaluate(() => __game.state.floor), 'scene', await scene());
    await p.screenshot({ path: `${outDir}/${name}_floor2.png` });
    await settle();
    // 2-1 by taps
    await door(296, 'norm'); await tapUntil('norm', 'set'); await tap(140, 140); await tap(140, 154); await wait(900); await p.screenshot({ path: `${outDir}/${name}_norm_set.png` });
    await tap(284, 150); await wait(500); console.log(name, 'norm', await ph('norm')); await tap(240, 166); await wait(1400); 
    // 2-2
    await door(440, 'hvg'); await tapUntil('hvg', 'set'); await tap(212, 140); await wait(200);
    { const r = await box(); const sx = v => r.x + v * r.width / 320, sy = v => r.y + v * r.height / 180; await p.touchscreen.tap(sx(116 + 76 * 2 / 5), sy(154)); await wait(300); }
    await tap(144, 168); await wait(700); await p.screenshot({ path: `${outDir}/${name}_hvg_set.png` });
    console.log(name, 'hvg params', JSON.stringify(await p.evaluate(() => __game.params)));
    await tap(284, 150); await wait(500); console.log(name, 'hvg', await ph('hvg')); await p.screenshot({ path: `${outDir}/${name}_hvg_res.png` }); await tap(240, 166); await wait(1400);
    // 2-3: drag the axis in the picture, lock, then tap a panel
    await door(584, 'pca'); await tapUntil('pca', 'spin'); await tap(103 + 30, 72 - 43); await wait(300); await p.screenshot({ path: `${outDir}/${name}_pca_spin.png` });
    await tap(284, 148); await wait(500); console.log(name, 'pca after lock', await ph('pca')); await tapUntil('pca', 'set', 160, 150); await wait(300);
    await tap(8 + 64 * 2 + 30, 16 + 30); await wait(300); await p.screenshot({ path: `${outDir}/${name}_pca_set.png` });
    await tap(284, 148); await wait(500); console.log(name, 'pca', await ph('pca')); await p.screenshot({ path: `${outDir}/${name}_pca_res.png` }); await tap(240, 166); await wait(1500);
    // added for the hall refactor: the jam by touch. The station after the valve has no data, three taps on the valve clear the pipe.
    await settle(); await wait(2500); await p.screenshot({ path: `${outDir}/${name}_stuck.png` });
    const poke = async x => { await settle(); await dbg('at', x - 60); await wait(300); const cam = await dbg('cam'); await tap(x - cam, 100); for (let i = 0; i < 30 && !(await dbg('busy')); i++) await wait(150); await wait(200); };
    await poke(794); console.log(name, 'knn while stuck:', await scene(), '|', await p.evaluate(() => __game.said));
    for (let i = 0; i < 3; i++) { await poke(726); console.log(name, 'valve', i + 1, '|', await p.evaluate(() => __game.said)); }
    await settle(); await wait(1500); console.log(name, 'unclog', await p.evaluate(() => __game.state.unclog), 'capsule at', await dbg('capX'), 'clog found', await p.evaluate(() => !!__game.state.eggs.clog));
    await p.screenshot({ path: `${outDir}/${name}_clear.png` });
    console.log(name, 'knn opens', await door(794, 'knn')); await wait(400); await tap(300, 5); await wait(900); console.log(name, 'tap LEAVE ->', await scene()); await settle();
    await p.screenshot({ path: `${outDir}/${name}_end.png` });
    console.log(name, JSON.stringify(await p.evaluate(() => ({ scene: __game.scene(), stars: __game.totalStars() + '/' + __game.maxStars(), cloud: __game.state.cloud, rooms: ['norm', 'hvg', 'pca'].map(k => k + ':' + __game.state.rooms[k].stars).join(' ') }))));
    await ctx.close();
  };
  await run('iphone', devices['iPhone 13']);
  await run('iphone_land', devices['iPhone 13 landscape']);
  console.log('ERRORS', JSON.stringify(errs.slice(0, 8)));
  await b.close();
})();
