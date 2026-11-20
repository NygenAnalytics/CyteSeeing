// An upright phone with the game turned on its side (G.turn, js/engine/main.js): the button under the screen lays the
// game along the long side of the phone. Checked on two phones: the screen grows, the thumb pads stand at its ends,
// a tap lands where the finger is (a parcel is read and taken by taps alone), a pad button walks the map, turning the
// phone for real hands over to the ordinary sideways layout and back, and UPRIGHT undoes it.
const { chromium, devices } = require('playwright');
(async () => {
  const [,, indexPath, outDir] = process.argv, b = await chromium.launch(), errs = [];
  const run = async (name, dev) => {
    const ctx = await b.newContext({ ...dev }), p = await ctx.newPage(), wait = ms => p.waitForTimeout(ms);
    p.on('pageerror', e => errs.push(name + ' PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(name + ' CONSOLE ' + m.text()); });
    /* a new player who has already heard Vera, so that the bay is quiet */
    await ctx.addInitScript(() => { if (!localStorage.getItem('cyteseeing-profile-v1')) localStorage.setItem('cyteseeing-profile-v1', JSON.stringify({ name: '', scenario: null, sound: false, metVera: true })); });
    await p.goto('file://' + indexPath + '?debug'); await wait(1500);
    const turned = () => p.evaluate(() => document.documentElement.classList.contains('turned'));
    const box = () => p.locator('#screen').boundingBox();
    /* a point of the game's 320 by 180 screen as a point of the page, whichever way the screen lies */
    const tap = async (gx, gy) => { const r = await box(), t = await turned(); const pt = t ? [r.x + r.width - gy * r.width / 180, r.y + gx * r.height / 320] : [r.x + gx * r.width / 320, r.y + gy * r.height / 180]; await p.touchscreen.tap(pt[0], pt[1]); await wait(170); };
    const scene = () => p.evaluate(() => __game.scene()), hall = (f, a) => p.evaluate(([f, a]) => __game.scenes.corridor.dbg[f](a), [f, a]);
    const size = async () => { const r = await box(), t = await turned(); return Math.round(t ? r.height : r.width) + ' x ' + Math.round(t ? r.width : r.height); };
    const vp = p.viewportSize(), up = await size();
    console.log(name, 'window', vp.width + ' x ' + vp.height, '| upright: screen', up, '| button shown', await p.locator('#btn-turn').isVisible());
    await p.screenshot({ path: `${outDir}/${name}_0_upright.png` });
    await p.locator('#btn-turn').tap(); await wait(500);
    const r = await box(), pads = await p.evaluate(() => [...document.querySelectorAll('.side')].map(e => { const q = e.getBoundingClientRect(); return getComputedStyle(e).display === 'none' ? null : [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)]; }));
    console.log(name, 'turned', await turned(), '| screen', await size(), '(' + (r.height / parseFloat(up)).toFixed(2) + ' times as wide) | inside the window', r.x >= 0 && r.y >= 0 && r.x + r.width <= vp.width + 0.5 && r.y + r.height <= vp.height + 0.5,
      '| pads', pads.every(q => q) ? 'at both ends, ' + Math.min(pads[0][2], pads[0][3]) + ' px across' : 'none', '| pads inside the window', pads.every(q => !q || (q[0] >= 0 && q[1] >= 0 && q[0] + q[2] <= vp.width + 0.5 && q[1] + q[3] <= vp.height + 0.5)),
      '| page scrolls', await p.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 1 && getComputedStyle(document.documentElement).overflow !== 'hidden'));
    await p.screenshot({ path: `${outDir}/${name}_1_turned.png` });
    /* taps land where the finger is: start, a parcel read, the right-hand answer taken */
    await tap(160, 90); for (let i = 0; i < 30 && await scene() !== 'corridor'; i++) await wait(150); await wait(1800);
    for (let i = 0; i < 10 && await hall('busy'); i++) { await tap(160, 150); await wait(150); }
    await hall('at', 176); await wait(300); await tap(226 - await hall('cam'), 110);
    for (let i = 0; i < 30 && !(await hall('asking')); i++) await wait(150);
    await p.screenshot({ path: `${outDir}/${name}_2_label.png` });
    console.log(name, 'a tap on the parcel: label up', await hall('asking'), '| hero at', Math.round(await hall('heroX')));
    await tap(236, 77); await wait(900);
    for (let i = 0; i < 30 && await scene() !== 'campus'; i++) { await tap(160, 150); await wait(200); }
    await wait(900); console.log(name, 'a tap on TAKE THIS PROJECT:', await p.evaluate(() => __game.profile.scenario), '| scene', await scene());
    /* a thumb pad: one press of the right arrow walks to the next plot on the map */
    const at0 = await p.evaluate(() => __game.scenes.campus.dbg.at());
    if (pads.every(q => q)) { await p.locator('.side-r [data-key="right"]').tap(); await wait(1200); console.log(name, 'pad, right arrow: on the map from plot', at0, 'to', await p.evaluate(() => __game.scenes.campus.dbg.at())); }
    else console.log(name, 'pad, right arrow: no pads on this phone');
    await p.screenshot({ path: `${outDir}/${name}_3_map.png` });
    /* the phone really turned: the ordinary sideways layout takes over, and hands back when it is upright again */
    await p.setViewportSize({ width: vp.height, height: vp.width }); await wait(500); const land = [await turned(), await size()];
    await p.setViewportSize(vp); await wait(500);
    console.log(name, 'phone turned for real: turned', land[0], 'screen', land[1], '| upright again: turned', await turned(), 'screen', await size());
    await p.locator('#btn-unturn').tap(); await wait(500);
    console.log(name, 'UPRIGHT: turned', await turned(), '| screen', await size(), '| kept in the profile', await p.evaluate(() => __game.profile.turned), '| events', (await p.evaluate(() => __game.track.log.filter(e => e.name === 'screen_turned').map(e => e.props.on))).join(','));
    await ctx.close();
  };
  await run('iphone', devices['iPhone 13']);
  await run('pixel', devices['Pixel 7']);
  console.log('ERRORS', JSON.stringify(errs.slice(0, 8))); await b.close();
})();
