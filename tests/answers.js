// A question with two answers: a parcel label in arrivals, a stage on the map and a door in a corridor that need what
// comes before them. The left-hand answer, pressed with a mouse or a finger, must put the question away and leave the
// game running: it once froze it. And a mistake in one frame must not stop the next: it is reported, and the clock moves on.
const { chromium, devices } = require('playwright');
(async () => {
  const [,, indexPath] = process.argv;
  const b = await chromium.launch();
  const errs = [];
  const run = async (name, dev, how) => {
    const ctx = await b.newContext({ ...dev });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ' PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(name + ' CONSOLE ' + m.text()); });
    await p.goto('file://' + indexPath + '?debug'); await p.waitForTimeout(1500);
    const wait = ms => p.waitForTimeout(ms);
    const press = async (vx, vy) => { const r = await p.locator('#screen').boundingBox(), x = r.x + vx * r.width / 320, y = r.y + vy * r.height / 180; if (how === 'finger') await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await wait(170); };
    const scene = () => p.evaluate(() => __game.scene());
    const hall = (fn, a) => p.evaluate(([f, x]) => __game.scenes.corridor.dbg[f](x), [fn, a]);
    const camp = (fn, a) => p.evaluate(([f, x]) => __game.scenes.campus.dbg[f](x), [fn, a]);
    const moves = async () => { const t1 = await p.evaluate(() => __game.t); await wait(400); return (await p.evaluate(() => __game.t)) > t1; };
    const hush = async () => { for (let i = 0; i < 20 && await hall('busy'); i++) { await press(160, 150); await wait(120); } };
    /* walk to something in a hall and press it, until a question is up */
    const ask = async x => { await hall('at', x - 50); await wait(300); await press(x - await hall('cam'), 110); for (let i = 0; i < 30 && !(await hall('asking')); i++) await wait(150); return hall('asking'); };
    const LEFT = [84, 77], RIGHT = [236, 77];

    await press(160, 90); for (let i = 0; i < 30 && await scene() !== 'corridor'; i++) await wait(150); await wait(2200); await hush();
    /* arrivals: read a label, put the parcel back, read it again and take it */
    const label = await ask(226); await press(...LEFT); await wait(500);
    console.log(name, 'parcel: label', label, '| PUT IT BACK: clock moves', await moves(), '| question away', !(await hall('asking')), '| project', await p.evaluate(() => __game.profile.scenario || 'none'));
    const again = await ask(226); await press(...RIGHT); await wait(900);
    for (let i = 0; i < 30 && await scene() !== 'campus'; i++) { await press(160, 150); await wait(200); }
    await wait(700); console.log(name, 'parcel: read again', again, '| taken', await p.evaluate(() => __game.profile.scenario || 'none'), '| scene', await scene());
    /* the map: stage 3 works on what stages 1 and 2 make */
    const nodes = await camp('nodes');
    await camp('enter', nodes.findIndex(n => n.id === 'who')); await wait(400);
    const asked = await camp('asking'); await press(...LEFT); await wait(500);
    console.log(name, 'map: asked', asked, '| DO IT MYSELF: clock moves', await moves(), '| question away', !(await camp('asking')), '| scene', await scene());
    /* a corridor: the second door needs what the first one makes */
    await camp('enter', nodes.findIndex(n => n.id === 'make')); for (let i = 0; i < 40 && await scene() !== 'corridor'; i++) await wait(150); await wait(1500); await hush();
    const door = (await hall('items')).find(i => i[0] === 'cliff')[1];
    const locked = await ask(door); await press(...LEFT); await wait(500);
    console.log(name, 'door: asked', locked, '| DO IT MYSELF: clock moves', await moves(), '| question away', !(await hall('asking')), '| scene', await scene(), '| steps Tomo did', await p.evaluate(() => Object.keys(__game.state.rooms).filter(r => __game.state.rooms[r].by).length));
    /* one frame goes wrong: it is reported once, and the next frame is drawn all the same */
    if (how === 'mouse') {
      const before = errs.length;
      await p.evaluate(() => { const sc = __game.scenes[__game.scene()], draw = sc.draw; sc.draw = function () { sc.draw = draw; throw new Error('a deliberate mistake in one frame'); }; });
      await wait(300); const went = await moves(), mine = errs.splice(before).filter(e => /deliberate mistake/.test(e));
      console.log(name, 'a frame that throws: reported', mine.length, '| clock moves', went);
    }
    await ctx.close();
  };
  await run('desk', { viewport: { width: 1200, height: 760 } }, 'mouse');
  await run('phone', devices['iPhone 13'], 'finger');
  console.log('ERRORS', JSON.stringify(errs.slice(0, 8)));
  await b.close();
})();
