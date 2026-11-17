// mash keys, held arrows and taps at random in the Long Gallery and at its close, from saves that done.js makes:
// a finished project with its five questions already settled (so that the close is reached), one with a step
// that Tomo ran, and one whose wall is not full.
// It must never throw, and must stay responsive.   node tests/fuzz-gallery.js <index.html> [seed]
const { chromium } = require('playwright'), done = require('./done.js');
(async () => {
  const b = await chromium.launch(), errs = [];
  let seed = Number(process.argv[3] || 7); const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Space', 'Space', 'Enter', 'Escape', 'g', 'ArrowRight', 'ArrowLeft'];
  const back = p => p.evaluate(() => __game.go('corridor', { floor: 'gallery', from: 'lift' }));
  for (const [project, o, settled] of [['response', {}, true], ['cortex', { by: ['turntable'] }], ['response', { by: ['soup', 'cut', 'wash'], owe: ['readout'] }]]) {
    const ctx = await b.newContext({ viewport: { width: 1200, height: 760 } }); await done.init(ctx, project, o);
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' @' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
    await p.goto('file://' + process.argv[2] + '?debug'); await p.waitForTimeout(1200);
    await p.keyboard.press('Space'); await p.waitForTimeout(2200);
    await back(p); await p.waitForTimeout(1500);
    /* every question answered: the lectern now opens the close */
    if (settled) { await p.evaluate(() => { const G = __game, rv = G.state.review = { settled: {}, slips: 0, open: true }; G.sys.gallery.questions.forEach(q => { rv.settled[q.room] = true; }); G.save(); }); await back(p); await p.waitForTimeout(1200); }
    const box = await p.locator('#screen').boundingBox(), seen = {};
    for (let i = 0; i < 800; i++) {
      const r = rnd();
      if (r < 0.25) await p.mouse.click(box.x + rnd() * box.width, box.y + rnd() * box.height);
      else if (r < 0.4) { const k = rnd() < 0.7 ? 'ArrowRight' : 'ArrowLeft'; await p.keyboard.down(k); await p.waitForTimeout(150 + rnd() * 400); await p.keyboard.up(k); }
      else await p.keyboard.press(keys[Math.floor(rnd() * keys.length)]);
      if (i % 4 === 0) await p.waitForTimeout(30);
      if (i % 20 === 0) {
        const sc = await p.evaluate(() => __game.scene() + (__game.scene() === 'corridor' ? ':' + __game.state.floor : '')); seen[sc] = (seen[sc] || 0) + 1;
        /* keep it in the gallery: if it wandered off, bring it back, and now and then stand it at the lectern */
        if (sc !== 'corridor:gallery' && sc !== 'close' && rnd() < 0.5) { await back(p); await p.waitForTimeout(900); }
        if (i % 100 === 0 && i) { await p.evaluate(() => { const G = __game; if (G.scene() === 'corridor' && G.state.floor === 'gallery') G.scenes.corridor.dbg.at(G.kits.gallery.dbg.lectern()); }); await p.waitForTimeout(300); await p.keyboard.press('Space'); }
      }
    }
    // still alive: the frame counter moves
    const t1 = await p.evaluate(() => __game.t); await p.waitForTimeout(400); const t2 = await p.evaluate(() => __game.t);
    console.log(project, JSON.stringify(o), settled ? 'settled' : '', JSON.stringify(seen), 'clock moves', t2 > t1, 'review', JSON.stringify(await p.evaluate(() => __game.state.review)), 'close', JSON.stringify(await p.evaluate(() => __game.state.rooms.close)), 'errors', errs.length);
    await ctx.close();
  }
  console.log('ERRORS', JSON.stringify(errs.slice(0, 10), null, 1)); await b.close();
})();
