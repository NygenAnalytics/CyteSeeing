// stage 5 of the cortex project by touch on three phones: every game finished with taps and a dragged finger only
const { chromium, devices } = require('playwright');
(async () => {
  const [,, indexPath, outDir] = process.argv;
  const b = await chromium.launch();
  const errs = [];
  const run = async (name, dev) => {
    const ctx = await b.newContext({ ...dev });
    await ctx.addInitScript(sc => { if (!localStorage.getItem('cyteseeing-profile-v1')) localStorage.setItem('cyteseeing-profile-v1', JSON.stringify({ name: 'ARI', scenario: sc, sound: false, metVera: true })); }, process.env.SCEN || 'cortex');
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
    const sc = (room, fn, a, c, d) => p.evaluate(([r, f, x, y, z]) => __game.scenes[r].dbg[f](x, y, z), [room, fn, a, c, d]);
    const shot = n => p.screenshot({ path: `${outDir}/${name}_${n}.png` });
    const tapUntil = async (room, want, vx = 160, vy = 60) => { for (let i = 0; i < 60 && await ph(room) !== want; i++) await tap(vx, vy); await wait(350); return ph(room); };
    const settle = async () => { for (let i = 0; i < 40 && await dbg('busy'); i++) await tap(160, 150); };
    const door = async (x, nm) => { await settle(); await dbg('at', x - 60); await wait(300); const cam = await dbg('cam'); await tap(x - cam, 100); for (let i = 0; i < 30 && await scene() !== nm; i++) await wait(150); const s = await scene(); if (s !== nm) console.log(nm, 'DOOR FAIL got', s); return s === nm; };
    // a finger drawn across the screen from one spot to another, in game pixels
    const drag = async (x0, y0, x1, y1) => { await hush(); const r = await box(), cdp = await ctx.newCDPSession(p), at = (x, y) => [{ x: r.x + x * r.width / 320, y: r.y + y * r.height / 180 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(x0, y0) }); await wait(60);
      for (let i = 1; i <= 24; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(x0 + (x1 - x0) * i / 24, y0 + (y1 - y0) * i / 24) }); await wait(40); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await wait(150); };
    const idle = async room => { for (let i = 0; i < 50 && await sc(room, 'busy'); i++) await wait(150); };
    const keepIt = async () => { await hush(); await wait(300); await tap(243, 167); await wait(1600); await settle(); };
    await tap(160, 90); await wait(3600); await settle();
    // out to the map by the header button, a tap on the Marshalling Yard, and Tomo does the stages before it
    const bx = await p.evaluate(() => { const G = __game, st = G.STAGES[G.state.floor]; return 5 + Math.ceil(G.tw((st.n ? st.n + '  ' : '') + st.name, 'sm')) + 8 + 8; });
    await tap(bx, 5); for (let i = 0; i < 20 && await scene() !== 'campus'; i++) await wait(150); await wait(500); await shot('map');
    const nodes = await p.evaluate(() => __game.scenes.campus.dbg.nodes()), ni = nodes.findIndex(n => n.id === 'order'), nd = nodes[ni];
    await raw(nd.x, nd.y - 10); for (let i = 0; i < 40 && !(await p.evaluate(() => __game.scenes.campus.dbg.busy())); i++) await wait(150);
    for (let i = 0; i < 60 && await p.evaluate(n => __game.scene() === 'campus' && __game.scenes.campus.dbg.at() !== n, ni); i++) await wait(150);
    await wait(500); await shot('ask'); await raw(236, 77); await wait(500);
    for (let i = 0; i < 30 && await scene() !== 'corridor'; i++) { await raw(160, 150); await wait(200); }
    for (let i = 0; i < 14 && await p.evaluate(() => __game.state.floor) !== 'order'; i++) { await tap(160, 150); await wait(200); }
    await wait(1800); console.log(name, 'floor', await p.evaluate(() => __game.state.floor)); await settle(); await wait(400); await shot('hall');
    // 5-1: tap the end of a road to swing the bridge there, tap RELEASE, read the lamps, tap SET THE ROOT
    await door(292, 'turntable'); await wait(900); await tapUntil('turntable', 'play'); await shot('turntable0');
    const roads = await sc('turntable', 'roads'), stem = await sc('turntable', 'stem'); let q;
    for (const rd of [roads.find(r => r.back), roads.find(r => r.road === stem)]) {
      for (let i = 0; i < 3 && await sc('turntable', 'road') !== rd.road; i++) { await tap(rd.x, rd.y); await wait(400); }
      q = await sc('turntable', 'spot', 'release'); await tap(q[0], q[1]); await wait(900); if (rd.back) await shot('turntable1'); await idle('turntable'); await wait(300); await shot(rd.back ? 'turntable2' : 'turntable3');
    }
    console.log(name, 'ran', JSON.stringify(await sc('turntable', 'ran')), 'shown', await sc('turntable', 'shown'));
    q = await sc('turntable', 'spot', 'set'); await tap(q[0], q[1]); await wait(500); await hush(); await wait(300); await shot('turntable4'); console.log(name, 'turntable', await ph('turntable'), 'slips', await sc('turntable', 'slips')); await keepIt();
    // 5-2: tap an island, then another, and the wagon runs between them
    await door(480, 'track'); await wait(900); await tapUntil('track', 'play', 250, 60); await shot('track0');
    const isl = await sc('track', 'islands'), pieces = await sc('track', 'pieces'), apart = await sc('track', 'apart');
    const lay = async (a, c) => { await tap(isl[a].x, isl[a].y); await wait(200); await tap(isl[c].x, isl[c].y); await wait(700); if (a === apart) await shot('track1'); await wait(1200); await hush(); await wait(300); };
    await lay(apart, isl[apart].near); await shot('track2');
    for (const pc of pieces) await lay(pc[0], pc[1]);
    await shot('track3'); console.log(name, 'laid', JSON.stringify(await sc('track', 'laid')), 'stops', await sc('track', 'stops'));
    q = await sc('track', 'spot', 'done'); await tap(q[0], q[1]); await wait(500); await hush(); await wait(300); await shot('track4'); console.log(name, 'track', await ph('track')); await keepIt();
    // 5-3: tap a notch of the lever, draw a finger along the line, tap a stop on a card's row and peg the card
    await door(728, 'timetable'); await wait(900); await tapUntil('timetable', 'play', 250, 60); await shot('timetable0');
    const genes = await sc('timetable', 'genes'), truth = await sc('timetable', 'truth'), pass = (await sc('timetable', 'pass'))[0];
    q = await sc('timetable', 'spot', 'stop', 0, 0); const far = await sc('timetable', 'spot', 'stop', 34, 0);
    await drag(q[0], q[1], far[0], far[1]); await wait(300); await shot('timetable1');
    q = await sc('timetable', 'spot', 'notch', pass); await tap(q[0], q[1]); await wait(300);
    q = await sc('timetable', 'spot', 'stop', 34, 2); const near0 = await sc('timetable', 'spot', 'stop', 0, 2); await drag(q[0], q[1], near0[0], near0[1]); await wait(300); await shot('timetable2');
    const r = await sc('timetable', 'read'); console.log(name, 'notch', await sc('timetable', 'si'), JSON.stringify(r));
    for (let g = 0; g < genes.length; g++) { q = await sc('timetable', 'spot', 'stop', r.first[truth.indexOf(genes[g])], g); await tap(q[0], q[1]); await wait(200); q = await sc('timetable', 'spot', 'peg'); await tap(q[0], q[1]); await wait(200); }
    await shot('timetable3'); console.log(name, 'pegs', JSON.stringify(await sc('timetable', 'pegs')));
    q = await sc('timetable', 'spot', 'check'); await tap(q[0], q[1]); await wait(500); await hush(); await wait(300); await shot('timetable4'); console.log(name, 'timetable', await ph('timetable'), 'slips', await sc('timetable', 'slips')); await keepIt();
    // 5-4: tap a train, then the one to swap it with; turn the labels; tap an answer to each question
    await door(908, 'clock'); await wait(900); await tapUntil('clock', 'rank', 160, 120); await shot('clock0');
    const want = await sc('clock', 'truth'), right = await sc('clock', 'right');
    for (let k = 0; k < want.length; k++) { const rows = await sc('clock', 'rows'), j = rows.indexOf(want[k]); if (j === k) continue; q = await sc('clock', 'spot', 'row', k); await tap(q[0], q[1]); await wait(150); if (k === 0) await shot('clock1'); q = await sc('clock', 'spot', 'row', j); await tap(q[0], q[1]); await wait(200); }
    console.log(name, 'rows', JSON.stringify(await sc('clock', 'rows'))); q = await sc('clock', 'spot', 'turn'); await tap(q[0], q[1]); await wait(800); await shot('clock2');
    await tapUntil('clock', 'q1', 160, 100); await wait(500); await shot('clock3'); q = await sc('clock', 'spot', 'q1', right.q1); await raw(q[0], q[1]); await wait(500);
    await tapUntil('clock', 'q2', 160, 100); await wait(500); await shot('clock4'); q = await sc('clock', 'spot', 'q2', right.q2); await raw(q[0], q[1]); await wait(500);
    await tapUntil('clock', 'result', 160, 100); await hush(); await wait(300); await shot('clock5'); console.log(name, 'clock', await ph('clock'), 'slips', await sc('clock', 'slips')); await keepIt();
    // the departure board: tap a plate and then a rail, tap each flap until it shows its gene, pull the signal, and hang "unknown"
    await door(1024, 'board'); await wait(800); await tapUntil('board', 'play', 160, 150); await shot('board0');
    const ok = await sc('board', 'right');
    for (let k = 0; k < 5; k++) { const i = (await sc('board', 'rack')).indexOf(ok.states[k]); q = await sc('board', 'spot', 'rack', i); await tap(q[0], q[1]); await wait(150); if (k === 0) await shot('board1'); q = await sc('board', 'spot', 'rail', k); await tap(q[0], q[1]); await wait(300); }
    for (let k = 0; k < 5; k++) { q = await sc('board', 'spot', 'flap', k); for (let n = 0; n < 8 && ok.flaps[k].indexOf((await sc('board', 'flaps'))[k]) < 0; n++) { await tap(q[0], q[1]); await wait(160); } }
    await shot('board2'); console.log(name, 'rails', JSON.stringify(await sc('board', 'rails')), 'flaps', JSON.stringify(await sc('board', 'flaps')));
    q = await sc('board', 'spot', 'pull'); await tap(q[0], q[1]); await wait(900); await shot('board3'); await tapUntil('board', 'push', 100, 60); await wait(700); await shot('board4');
    q = await sc('board', 'spot', 'ask', 0); await raw(q[0], q[1]); await wait(500); await tapUntil('board', 'result', 100, 60); await hush(); await wait(300); await shot('board5');
    console.log(name, 'board', await ph('board'), 'slips', await sc('board', 'slips'));
    await tap(243, 167); await wait(1800); await settle(); await shot('end');
    console.log(name, 'rooms', JSON.stringify(await p.evaluate(() => ['turntable', 'track', 'timetable', 'clock', 'board'].map(k => __game.state.rooms[k].stars))), 'lines', JSON.stringify(await p.evaluate(() => __game.state.yard.lines)));
    await ctx.close();
  };
  await run('iphone', devices['iPhone 13']);
  await run('iphone_land', devices['iPhone 13 landscape']);
  await run('pixel', devices['Pixel 7']);
  console.log('ERRORS', JSON.stringify(errs.slice(0, 8)));
  await b.close();
})();
