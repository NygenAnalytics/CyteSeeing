// Soak test: go in and out of every scene again and again and watch the heap, the DOM and the
// listeners. A leak shows as a number that keeps climbing from round to round after garbage collection.
// usage: node soak.js <index.html> [rounds] [scenario]
const { chromium } = require('playwright');
(async () => {
  const [,, indexPath, roundsArg, scenario] = process.argv, rounds = Number(roundsArg || 6);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 820 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const reqs = []; p.on('requestfinished', async r => { try { const s = await r.sizes(); reqs.push([r.url().split('/').slice(-2).join('/'), s.responseBodySize]); } catch (e) {} });
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('HeapProfiler.enable'); await cdp.send('Performance.enable');
  const t0 = Date.now();
  await p.goto('file://' + indexPath + '?debug'); await p.waitForFunction(() => window.__game && window.__game.scene, null, { timeout: 15000 });
  const bootMs = Date.now() - t0;
  await p.waitForTimeout(800);
  const boot = reqs.filter(r => /\.js$/.test(r[0]));
  console.log('boot: scripts', boot.length, 'bytes', boot.reduce((s, r) => s + r[1], 0), 'ms', bootMs);
  const measure = async label => {
    await cdp.send('HeapProfiler.collectGarbage'); await p.waitForTimeout(120); await cdp.send('HeapProfiler.collectGarbage');
    const h = await cdp.send('Runtime.getHeapUsage'), m = await cdp.send('Performance.getMetrics'), g = k => (m.metrics.find(x => x.name === k) || {}).value;
    const row = { label, heapMB: +(h.usedSize / 1048576).toFixed(2), nodes: g('Nodes'), listeners: g('JSEventListeners') };
    console.log(JSON.stringify(row)); return row;
  };
  // get past the title and whatever the game opens with, then mark every room done so any scene can be entered
  const setup = await p.evaluate(sc => {
    const G = window.__game;
    if (G.setScenario && sc) G.setScenario(sc);
    const s = G.state; Object.keys(s.rooms).forEach(k => { s.rooms[k] = { done: true, stars: 3 }; });
    s.met = s.met2 = s.met3 = s.met4 = s.met5 = true; s.unclog = true; Object.keys(s.tries).forEach(k => { s.tries[k] = 1; });
    return Object.keys(s.rooms);
  }, scenario || null);
  const scenes = (process.env.SCENES ? process.env.SCENES.split(',') : setup).filter(Boolean);
  const first = await measure('start');
  const series = [];
  for (let r = 1; r <= rounds; r++) {
    const id = r % 2 ? 'cortex' : 'response';
    await p.evaluate(i => window.__game.load(['systems/' + window.__game.SCENARIOS[i].system + '.js']).then(() => { const G = window.__game; G.setScenario(i); const s = G.state; Object.keys(s.rooms).forEach(k => { s.rooms[k] = { done: true, stars: 3 }; }); s.met = s.met2 = s.met3 = s.met4 = s.met5 = true; s.unclog = true; }), id);
    await p.evaluate(() => window.__game.go('corridor', { floor: 'bay' })); await p.waitForTimeout(500);
    await p.evaluate(() => window.__game.go('campus', { from: 'bay' })); await p.waitForTimeout(500);
    const playable = await p.evaluate(() => { const G = window.__game, out = []; G.route().forEach(st => { G.STAGES[st].rooms.concat(G.STAGES[st].extra || []).forEach(k => out.push(k)); }); return out; });
    for (const sc of playable) {
      await p.evaluate(n => { try { window.__game.go(n, {}); } catch (e) { console.error('go ' + n + ' ' + e.message); } }, sc);
      await p.waitForTimeout(sc === 'wash' ? 1400 : 350);
      for (const k of ['Space', 'ArrowRight', 'Space', 'ArrowDown', 'Space']) await p.keyboard.press(k);
      await p.waitForTimeout(120);
    }
    await p.evaluate(() => window.__game.go('corridor', { floor: window.__game.state.floor }));
    await p.waitForTimeout(400);
    series.push(await measure('round ' + r + ' ' + id + ' ' + playable.length + ' scenes'));
  }
  const last = series[series.length - 1], mid = series[Math.floor(series.length / 2) - 1] || first;
  console.log('scenes per round', scenes.length, '| heap growth, second half of the run (MB):', (last.heapMB - mid.heapMB).toFixed(2), '| nodes', mid.nodes, '->', last.nodes, '| listeners', mid.listeners, '->', last.listeners);
  console.log('scripts loaded in total', reqs.filter(r => /\.js$/.test(r[0])).length, 'bytes', reqs.filter(r => /\.js$/.test(r[0])).reduce((s, r) => s + r[1], 0));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 6)));
  await b.close();
})();
