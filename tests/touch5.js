// stage 5 by touch on three phones: every game finished with taps and held fingers only
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
    const sc = (room, fn, a, c) => p.evaluate(([r, f, x, y]) => __game.scenes[r].dbg[f](x, y), [room, fn, a, c]);
    const shot = n => p.screenshot({ path: `${outDir}/${name}_${n}.png` });
    const tapUntil = async (room, want, vx = 160, vy = 60) => { for (let i = 0; i < 60 && await ph(room) !== want; i++) await tap(vx, vy); await wait(350); return ph(room); };
    const settle = async () => { for (let i = 0; i < 40 && await dbg('busy'); i++) await tap(160, 150); };
    const door = async (x, nm) => { await settle(); await dbg('at', x - 60); await wait(300); const cam = await dbg('cam'); await tap(x - cam, 100); for (let i = 0; i < 30 && await scene() !== nm; i++) await wait(150); const s = await scene(); if (s !== nm) console.log(nm, 'DOOR FAIL got', s); return s === nm; };
    // a finger held on one spot of the screen, in game pixels
    const hold = async (vx, vy, ms) => { await hush(); const r = await box(), cdp = await ctx.newCDPSession(p), at = [{ x: r.x + vx * r.width / 320, y: r.y + vy * r.height / 180 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at }); await wait(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await wait(120); };
    const keepIt = async () => { await hush(); await wait(300); await tap(243, 167); await wait(1600); await settle(); };
    await tap(160, 90); await wait(3600); await settle();
    // out to the map by the header button, a tap on the Weigh House, and Tomo does the stages before it
    const bx = await p.evaluate(() => { const G = __game, st = G.STAGES[G.state.floor]; return 5 + Math.ceil(G.tw((st.n ? st.n + '  ' : '') + st.name, 'sm')) + 8 + 8; });
    await tap(bx, 5); for (let i = 0; i < 20 && await scene() !== 'campus'; i++) await wait(150); await wait(500); await shot('map');
    const nodes = await p.evaluate(() => __game.scenes.campus.dbg.nodes()), ni = nodes.findIndex(n => n.id === 'changes'), nd = nodes[ni];
    await raw(nd.x, nd.y - 10); for (let i = 0; i < 40 && !(await p.evaluate(() => __game.scenes.campus.dbg.busy())); i++) await wait(150);
    for (let i = 0; i < 60 && await p.evaluate(n => __game.scene() === 'campus' && __game.scenes.campus.dbg.at() !== n, ni); i++) await wait(150);
    await wait(500); await shot('ask'); await raw(236, 77); await wait(500);
    for (let i = 0; i < 30 && await scene() !== 'corridor'; i++) { await raw(160, 150); await wait(200); }
    for (let i = 0; i < 14 && await p.evaluate(() => __game.state.floor) !== 'changes'; i++) { await tap(160, 150); await wait(200); }
    await wait(1800); console.log(name, 'floor', await p.evaluate(() => __game.state.floor)); await settle(); await wait(400); await shot('hall');
    // 5-1: a finger held on each heap bags it; then the stamp
    await door(292, 'scales'); await wait(900); await tapUntil('scales', 'play'); await shot('scales0');
    for (let c = 0; c < 3; c++) {
      const heaps = await sc('scales', 'heaps');
      for (const hp of heaps) { for (let i = 0; i < 3 && !(await sc('scales', 'bagged'))[hp.d]; i++) await hold(hp.x, hp.y, 600); }
      const holds = await sc('scales', 'holds'); if (c === 0) await shot('scales1');
      console.log(name, 'claim', c + 1, 'bagged', (await sc('scales', 'bagged')).filter(x => x).length, 'holds', holds);
      await tap(holds ? 213 : 279, 166); await wait(500); await hush(); await wait(400);
    }
    await shot('scales2'); console.log(name, 'scales', await ph('scales'), 'slips', await sc('scales', 'slips')); await keepIt();
    // 5-2: a tap on a tile moves it; a tap on a gene shows it; then FIT
    await door(480, 'formula'); await wait(900); await tapUntil('formula', 'play', 160, 60); await shot('formula0');
    for (let r = 0; r < 3; r++) {
      await tapUntil('formula', 'play', 160, 60);
      const want = await sc('formula', 'want');
      for (const id of ['donor', 'visit', 'response', 'vr', 'run']) { if (((await sc('formula', 'terms')).indexOf(id) >= 0) !== (want.indexOf(id) >= 0)) { const q = await sc('formula', 'spot', id); await tap(q[0], q[1]); await wait(250); } }
      const ans = await sc('formula', 'answer'); if (await sc('formula', 'gene') !== ans) { const q = await sc('formula', 'spot', 'gene', ans); await tap(q[0], q[1]); await wait(300); }
      await wait(400); await shot('formula_r' + (r + 1)); console.log(name, 'round', r + 1, (await sc('formula', 'terms')).join('+'), 'gene', await sc('formula', 'gene'));
      await tap(295, 152); await wait(500); await hush(); await wait(400);
    }
    await shot('formula2'); console.log(name, 'formula', await ph('formula'), 'slips', await sc('formula', 'slips')); await keepIt();
    // 5-3: tap the rule, tap the rate, tap CHECK
    await door(728, 'stairs'); await wait(900); await tapUntil('stairs', 'play', 100, 60); await shot('stairs0');
    const pass = (await sc('stairs', 'pass'))[0]; let q = await sc('stairs', 'spot', 'rule', pass[0]); await tap(q[0], q[1]); q = await sc('stairs', 'spot', 'rate', pass[1]); await tap(q[0], q[1]); await wait(900); await shot('stairs1');
    console.log(name, 'rule', await sc('stairs', 'rule'), await sc('stairs', 'rate'), JSON.stringify(await sc('stairs', 'now')));
    await tap(282, 152); await wait(500); await hush(); await wait(300); await shot('stairs2'); console.log(name, 'stairs', await ph('stairs'), 'slips', await sc('stairs', 'slips')); await keepIt();
    // 5-4: tap the cell type in the key, tap + until the copy matches; then tap the lines of the ledger
    await door(908, 'census'); await wait(900); await tapUntil('census', 'pump', 250, 60); await shot('census0');
    const ans = await sc('census', 'answer'); q = await sc('census', 'spot', 'key', ans.k); await tap(q[0], q[1]);
    q = await sc('census', 'spot', ans.steps > 0 ? 'plus' : 'minus'); for (let i = 0; i < Math.abs(ans.steps); i++) await tap(q[0], q[1]);
    await wait(500); await shot('census1'); console.log(name, 'sel', await sc('census', 'sel'), 'steps', JSON.stringify(await sc('census', 'steps')), 'gap', (await sc('census', 'gap')).toFixed(4));
    await tap(282, 152); await wait(500); await tapUntil('census', 'ledger', 250, 60); await shot('census2');
    const want = Array.from({ length: ans.fell.length + 1 }, (_, k) => (k === ans.fell[0] ? 2 : k === ans.k ? 1 : 0));
    for (let pass2 = 0; pass2 < 2; pass2++) for (let k = 0; k < want.length; k++) { q = await sc('census', 'spot', 'row', k); for (let i = 0; i < 3 && (await sc('census', 'marks'))[k] !== want[k]; i++) await tap(q[0], q[1]); }
    await shot('census3'); console.log(name, 'marks', JSON.stringify(await sc('census', 'marks')));
    await tap(271, 152); await wait(500); await hush(); await wait(300); await shot('census4'); console.log(name, 'census', await ph('census'), 'slips', await sc('census', 'slips')); await keepIt();
    // the read-out: tap each slot until it shows its word, hand it over, keep the weaker word
    await door(1024, 'readout'); await wait(800); await tapUntil('readout', 'play', 160, 150); await shot('readout0');
    const good = (await sc('readout', 'right'))[0];
    for (let i = 0; i < good.length; i++) { q = await sc('readout', 'spot', i); for (let n = 0; n < 6 && (await sc('readout', 'picks'))[i] !== good[i]; n++) await tap(q[0], q[1]); }
    await shot('readout1'); console.log(name, 'sentence:', await sc('readout', 'sentence'));
    await tap(262, 152); await wait(500); await tapUntil('readout', 'push', 160, 150); await wait(700); await shot('readout2');
    q = await sc('readout', 'ask', 0); await raw(q[0], q[1]); await wait(500); await tapUntil('readout', 'result', 160, 150); await hush(); await wait(300); await shot('readout3');
    console.log(name, 'readout', await ph('readout'), 'slips', await sc('readout', 'slips'));
    await tap(243, 167); await wait(1800); await settle(); await shot('end');
    console.log(name, 'rooms', JSON.stringify(await p.evaluate(() => ['scales', 'formula', 'stairs', 'census', 'readout'].map(k => __game.state.rooms[k].stars))));
    await ctx.close();
  };
  await run('iphone', devices['iPhone 13']);
  await run('iphone_land', devices['iPhone 13 landscape']);
  await run('pixel', devices['Pixel 7']);
  console.log('ERRORS', JSON.stringify(errs.slice(0, 8)));
  await b.close();
})();
