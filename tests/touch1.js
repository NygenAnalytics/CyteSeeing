const { chromium, devices } = require('playwright');
(async () => {
  const [,, indexPath, outDir] = process.argv;
  const b = await chromium.launch();
  const errs = [];
  const run = async (name, dev, full) => {
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
    // somebody talking? tap through it first, then make the tap that was asked for
    const tap = async (vx, vy) => { for (let i = 0; i < 40 && await p.evaluate(() => !!__game.narrating); i++) await raw(160, 100); await raw(vx, vy); };
    const ph = room => p.evaluate(r => __game.scenes[r].phase(), room);
    const scene = () => p.evaluate(() => __game.scene());
    const dbg = (fn, arg) => p.evaluate(([f, a]) => __game.scenes.corridor.dbg[f](a), [fn, arg]);
    const tapUntil = async (room, want, vx = 160, vy = 90) => { for (let i = 0; i < 50 && await ph(room) !== want; i++) await tap(vx, vy); await wait(350); if (await p.evaluate(() => __game.card.open)) { await tap(160, 90); await wait(150); } return ph(room); };
    const settle = async () => { for (let i = 0; i < 40 && await dbg('busy'); i++) await tap(160, 150); };
    const door = async (x, name) => { await dbg('clear'); await dbg('at', x - 60); await wait(300); const cam = await dbg('cam'); await tap(x - cam, 100); for (let i = 0; i < 30 && await scene() !== name; i++) await wait(150); const s = await scene(); if (s !== name) console.log(name, 'DOOR FAIL got', s); return s === name; };
    const info = await p.evaluate(() => ({ vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio, canvas: __game.cv.width, css: __game.cv.style.width, touch: __game.touch,
      pad: getComputedStyle(document.querySelector('.pad')).display, side: getComputedStyle(document.querySelector('.side')).display, overflow: document.documentElement.scrollWidth - innerWidth }));
    console.log(name, JSON.stringify(info));
    await p.screenshot({ path: `${outDir}/t_${name}_title.png` });
    await tap(160, 90); await wait(3600); await settle();
    await p.screenshot({ path: `${outDir}/t_${name}_corridor.png` });
    // walk to something far away by tapping it, and poke it on arrival
    await dbg('at', 110); await wait(300); let cam = await dbg('cam'); await tap(232 - cam, 110);
    for (let i = 0; i < 30 && !(await dbg('busy')); i++) await wait(150);
    console.log(name, 'tap-to-poke opened a line:', await dbg('busy')); await settle();
    console.log(name, 'plant found:', await p.evaluate(() => !!__game.state.eggs.plant));
    if (!full) { await ctx.close(); return; }
    // 1-1
    await door(292, 'droplets'); await tapUntil('droplets', 'config');
    await tap(104 + 110 * (4500 - 1000) / 15000, 120); await tap(143, 137); await wait(200);
    await p.screenshot({ path: `${outDir}/t_${name}_droplets.png` });
    await tap(288, 129); await wait(900); await tap(160, 60); await wait(600); console.log(name, '1-1', await ph('droplets'));
    await tap(205, 163); await wait(1300);
    // 1-2
    await door(496, 'cliff'); await tapUntil('cliff', 'cut'); await tap(274, 114); await wait(1500);
    for (let i = 0; i < 12 && await ph('cliff') === 'cutres'; i++) { await tap(207, 161); await wait(150); }
    console.log(name, '1-2', await ph('cliff')); await tap(285, 148); await wait(700); await tap(120, 60); await wait(600);
    console.log(name, '1-2', await ph('cliff')); await tap(243, 166); await wait(1300);
    // 1-3
    await door(820, 'qc'); await tapUntil('qc', 'set'); await tap(149, 167); await wait(200); await tap(285, 148); await wait(600);
    console.log(name, '1-3', await ph('qc')); await p.screenshot({ path: `${outDir}/t_${name}_qc.png` }); await tap(243, 166); await wait(1300);
    // 1-4
    await door(1024, 'soup'); await tapUntil('soup', 'set'); await tap(177, 42); await wait(200); await tap(89, 169); await wait(200);
    await p.screenshot({ path: `${outDir}/t_${name}_soup.png` }); await tap(285, 148); await wait(600);
    console.log(name, '1-4', await ph('soup')); await tap(243, 166); await wait(1300);
    // 1-5
    await door(1236, 'doublet'); await tapUntil('doublet', 'ready'); await tap(89, 166); await wait(3300);
    await tap(14 + 176 * (0.75 - 0.3) / 0.7, 153); await wait(200); await tap(282, 150); await wait(600);
    console.log(name, '1-5', await ph('doublet')); await tap(243, 166); await wait(1300);
    // Reviewer 2
    await door(1776, 'review'); await tapUntil('review', 'ask', 160, 40); await wait(500);
    const ans = [0, 2, 1, 1, 0];
    for (let i = 0; i < 5; i++) { await wait(500); await tap(160, 118 + ans[i] * 19 + 7); await wait(300); for (let k = 0; k < 6 && await ph('review') === 'reply'; k++) await tap(160, 40); }
    console.log(name, 'review', await ph('review')); await wait(400); await p.screenshot({ path: `${outDir}/t_${name}_verdict.png` });
    await tap(238, 119); await wait(1500);
    // leave a room with a tap on LEAVE
    await door(292, 'droplets'); await wait(400); await tap(300, 5); await wait(900); console.log(name, 'tap LEAVE ->', await scene());
    await p.screenshot({ path: `${outDir}/t_${name}_end.png`, fullPage: name === 'portrait' });
    console.log(name, JSON.stringify(await p.evaluate(() => ({ scene: __game.scene(), stars: __game.totalStars() + '/' + __game.maxStars(), methods: __game.book.methods() }))));
    await ctx.close();
  };
  await run('portrait', devices['iPhone 13'], true);
  await run('landscape', devices['iPhone 13 landscape'], true);
  await run('pixel', devices['Pixel 7'], false);
  console.log('ERRORS', JSON.stringify(errs.slice(0, 8)));
  await b.close();
})();
