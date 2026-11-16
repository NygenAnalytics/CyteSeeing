// shared helpers for the playthrough scripts
const { chromium, devices } = require('playwright');
module.exports = async function open(indexPath, outDir, opts, before) {
  const b = await chromium.launch();
  const errs = [];
  const ctx = await b.newContext(opts || { viewport: { width: 1400, height: 820 }, deviceScaleFactor: 1 });
  /* a script may put a save of its own in the browser first (see done.js) */
  if (before) await before(ctx);
  /* a player who has signed in and taken a project (SCEN: response or cortex), so the title leads straight into the first hall */
  const scen = process.env.SCEN || 'response';
  await ctx.addInitScript(sc => { if (!localStorage.getItem('cyteseeing-profile-v1')) localStorage.setItem('cyteseeing-profile-v1', JSON.stringify({ name: 'ARI', scenario: sc, sound: false, metVera: true })); }, scen);
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + indexPath + '?debug'); await p.waitForTimeout(1500);
  const h = { p, b, errs, texts: [] };
  h.wait = ms => p.waitForTimeout(ms);
  h.shot = async n => { await p.locator('#screen').screenshot({ path: `${outDir}/${n}.png` }); };
  h.key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await h.wait(120); } };
  h.ph = room => p.evaluate(r => __game.scenes[r].phase(), room);
  h.scene = () => p.evaluate(() => __game.scene());
  h.talking = () => p.evaluate(() => !!__game.narrating);
  h.said = () => p.evaluate(() => __game.said || '');
  let last = '';
  h.note = async label => { const s = await h.said(); if (s && s !== last) { last = s; h.texts.push('[' + label + '] ' + s); } };
  // press through whatever is being said, writing each line down
  h.talk = async (label, shots) => { let n = 0; for (let i = 0; i < 60 && await h.talking(); i++) { const before = last; await h.note(label); if (shots && last !== before) await h.shot(label.replace(/ /g, '_') + '_' + (n++)); await h.key('Space'); await h.wait(140); } await h.wait(400); };
  h.until = async (room, want, label, shots) => { let n = 0; for (let i = 0; i < 80 && await h.ph(room) !== want; i++) { const before = last; if (await h.talking()) { await h.note(label || room); if (shots && last !== before) await h.shot((label || room).replace(/ /g, '_') + '_' + (n++)); } await h.key('Space'); await h.wait(140); } await h.wait(400); return h.ph(room); };
  h.dbg = (fn, arg) => p.evaluate(([f, a]) => __game.scenes.corridor.dbg[f](a), [fn, arg]);
  h.settle = async label => { for (let i = 0; i < 40 && await h.dbg('busy'); i++) { if (label) await h.note(label); await h.key('Space'); await h.wait(90); } };
  h.at = async x => { await h.settle(); await h.dbg('at', x); await h.wait(300); };
  h.door = async (x, name) => { await h.at(x); await h.key('Space'); await h.wait(1000); const s = await h.scene(); if (s !== name) console.log('DOOR FAIL', name, 'got', s); return s === name; };
  /* go to another stage of the project the way the map would: the student does whatever the earlier stages should have made */
  h.travel = async stage => { await h.settle(); await p.evaluate(st => { const G = __game, r = G.route(), need = []; r.slice(0, r.indexOf(st)).forEach(id => G.STAGES[id].makes.forEach(k => need.push(k))); const missing = need.filter(k => !G.state.rooms[k].done); if (missing.length) G.hall.summon(missing); G.go('corridor', { floor: st, from: 'lift' }); }, stage); await h.wait(1600); };
  h.done = async file => { require('fs').writeFileSync(file, h.texts.join('\n')); console.log('ERRORS', JSON.stringify(errs.slice(0, 8))); await b.close(); };
  return h;
};
