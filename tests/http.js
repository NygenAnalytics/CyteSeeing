// the game over http, as the live site serves it: lazy scripts carry the version query, and a stage loads on demand
const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2];
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1400, height: 820 } });
  await ctx.addInitScript(() => { if (!localStorage.getItem('cyteseeing-profile-v1')) localStorage.setItem('cyteseeing-profile-v1', JSON.stringify({ name: 'ARI', scenario: 'cortex', sound: false, metVera: true })); });
  const p = await ctx.newPage(), errs = [], reqs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  p.on('response', r => { if (/\.js/.test(r.url())) reqs.push(r.status() + ' ' + r.url().split('/js/')[1]); });
  await p.goto(url + '?debug'); await p.waitForTimeout(1200);
  console.log('boot requests', reqs.length);
  await p.keyboard.press('Space'); await p.waitForTimeout(2500);
  console.log('scene', await p.evaluate(() => __game.scene()), 'stage', await p.evaluate(() => __game.state.floor));
  await p.evaluate(() => __game.go('pca', {})); await p.waitForTimeout(1500);
  console.log('scene', await p.evaluate(() => __game.scene()));
  console.log('lazy requests', JSON.stringify(reqs.slice(12)));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 6))); await b.close();
})();
