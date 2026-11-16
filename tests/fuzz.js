// mash keys, letters and taps at random from a cold start: the title, the sign-in, the bay, the map and whatever opens.
// It must never throw, never open a new window (window.open is stubbed), and must stay responsive.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const errs = [];
  let seed = Number(process.argv[3] || 1); const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Space', 'Space', 'Enter', 'l', 'Escape', 'ArrowRight', 'ArrowRight', 'a', 'z', 'Backspace', 'q'];
  for (let run = 0; run < 4; run++) {
    const p = await b.newPage({ viewport: { width: 1200, height: 760 } });
    p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' @' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
    if (process.env.SCEN) await p.addInitScript(sc => { if (!localStorage.getItem('cyteseeing-profile-v1')) localStorage.setItem('cyteseeing-profile-v1', JSON.stringify({ name: 'ARI', scenario: sc, sound: false, metVera: true })); }, run % 2 ? 'cortex' : 'response');
    await p.addInitScript(() => { window.__opened = 0; window.open = () => { window.__opened++; return null; }; });
    await p.goto('file://' + process.argv[2] + '?debug'); await p.waitForTimeout(1200);
    const box = await p.locator('#screen').boundingBox(), seen = {};
    for (let i = 0; i < 900; i++) {
      if (rnd() < 0.3) await p.mouse.click(box.x + rnd() * box.width, box.y + rnd() * box.height);
      else await p.keyboard.press(keys[Math.floor(rnd() * keys.length)]);
      if (i % 4 === 0) await p.waitForTimeout(30);
      if (i % 15 === 0) { const sc = await p.evaluate(() => __game.scene() + (__game.scene() === 'corridor' ? ':' + __game.state.floor : '')); seen[sc] = (seen[sc] || 0) + 1; }
    }
    // still alive: the frame counter moves, and a scene is showing
    const t1 = await p.evaluate(() => __game.t); await p.waitForTimeout(400); const t2 = await p.evaluate(() => __game.t);
    console.log('run', run, JSON.stringify(seen), 'name', await p.evaluate(() => __game.you()), 'project', await p.evaluate(() => __game.profile.scenario || '-'), 'clock moves', t2 > t1, 'opened', await p.evaluate(() => window.__opened), 'errors', errs.length);
    await p.close();
  }
  console.log('ERRORS', JSON.stringify(errs.slice(0, 10), null, 1)); await b.close();
})();
