// floor 4 by keyboard: every line said is written down. mode 'slips' makes each kind of mistake on the way
const open = require('./lib.js');
(async () => {
  const [,, indexPath, outDir, mode] = process.argv;
  const h = await open(indexPath, outDir), { key, wait, shot, ph, at, door, talk, until, settle, p } = h;
  const sc = (room, fn, arg) => p.evaluate(([r, f, a]) => __game.scenes[r].dbg[f](a), [room, fn, arg]);
  const clean = mode !== 'slips';
  const ready = async (room, label, shots) => { for (let i = 0; i < 90; i++) { const q = await ph(room); if (await h.talking()) { await talk(label, shots); continue; } if (q === 'load' || q === 'drop') { await wait(200); continue; } return q; } };
  await key('Space'); await wait(3600); await settle('mika'); await wait(200);
  await h.travel('runs');
  await wait(1800); await shot('b0_arrive'); await settle('bea intro'); await wait(300); await shot('b1_laundry');
  console.log('floor', await p.evaluate(() => __game.state.floor));
  const bea = async n => { await at(172); await key('Space'); await wait(300); await settle('bea ' + n); };
  await bea(0);
  // 4-1
  await door(284, 'sort'); await wait(900); await ready('sort', 'sort brief', true); await shot('s_0');
  const isl = await sc('sort', 'islands'); console.log('islands', isl.length, 'cur', await sc('sort', 'cur'));
  // arrow keys really move between islands
  const seen = new Set(); for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowLeft', 'ArrowUp', 'ArrowUp', 'ArrowRight', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowUp']) { await key(k); seen.add(await sc('sort', 'cur')); }
  console.log('islands reached by arrows', [...seen].sort((a, b) => a - b).join(','), 'onDone', await sc('sort', 'onDone'));
  const lone = isl.find(a => a.partner < 0), A = isl.filter(a => a.load === 0);
  if (!clean) {
    const tie = async (x, y, label) => { await sc('sort', 'go', x); await key('Space'); await sc('sort', 'go', y); await wait(150); await key('Space'); await wait(300); await shot('s_' + label.replace(/ /g, '_')); await ready('sort', 'sort ' + label); };
    const near = k => { const a = isl[k]; return isl.filter(b => b.load !== a.load).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0].id; };
    await tie(A[0].id, A[1].id, 'same load'); await sc('sort', 'go', A[0].id); await key('Space');
    await tie(A[0].id, lone.id, 'lone');
    const c = A.find(a => near(a.id) !== a.partner && isl[near(a.id)].partner >= 0); if (c) await tie(c.id, near(c.id), 'closest'); else console.log('no closest case');
    const far = A.map(a => [a, isl.find(b => b.load === 1 && b.partner >= 0 && b.id !== a.partner && near(a.id) !== b.id && near(b.id) !== a.id)]).find(q => q[1]); await tie(far[0].id, far[1].id, 'plain wrong');
    await key('ArrowDown', 6); await key('Space'); await wait(300); await ready('sort', 'sort early'); await key('ArrowUp');
  }
  for (const a of A) { await sc('sort', 'go', a.id); await key('Space'); await sc('sort', 'go', a.partner); await wait(150); if (a === A[2]) await shot('s_hold2'); await key('Space'); await wait(250); }
  await shot('s_tied'); console.log('ties', JSON.stringify(await sc('sort', 'ties')), 'slips', await sc('sort', 'slips'));
  await key('ArrowDown', 6); await wait(200); await shot('s_btn'); await key('Space'); await wait(500); await ready('sort', 'sort verdict'); await shot('s_done');
  console.log('sort', await ph('sort')); await key('Space'); await wait(1600); await settle(); await shot('d_hall1'); await bea(1);
  // 4-2
  await door(466, 'wash'); await wait(400); await shot('w_load'); await wait(2500); await ready('wash', 'wash brief', true); await shot('w_0');
  console.log('dial', JSON.stringify(await sc('wash', 'dial')));
  await key('ArrowUp'); await wait(300); await shot('w_16_ppbp'); console.log('start', JSON.stringify(await sc('wash', 'verdict'))); await key('ArrowUp');
  if (!clean) {
    await key('Space'); await wait(500); await ready('wash', 'wash over'); await shot('w_over'); await key('Space'); await wait(400);
    await key('ArrowLeft', 6); await wait(1500); await shot('w_cold'); await key('Space'); await wait(500); await ready('wash', 'wash under'); await shot('w_under'); await key('Space'); await wait(400);
    await key('ArrowRight', 3); await wait(1300);
  } else {
    /* one step down at a time until the wash is neither too gentle nor too strong (blood: two steps; cortex: three) */
    for (let i = 1; i <= 6; i++) { await key('ArrowLeft'); if (i === 2) { await wait(350); await shot('w_spin'); } await wait(1300); const v = await sc('wash', 'verdict'); console.log('theta step', i, JSON.stringify(v)); await shot('w_' + i); if (!v.under && !v.over) break; }
  }
  await key('ArrowUp'); await wait(300); await shot('w_ppbp'); await key('Space'); await wait(500); await ready('wash', 'wash verdict'); await shot('w_done');
  console.log('wash', await ph('wash'), 'slips', await sc('wash', 'slips')); await key('Space'); await wait(1600); await settle(); await shot('d_hall2'); await bea(2);
  // 4-3
  await door(716, 'lost'); await wait(700); await shot('l_drop'); await wait(1800); await ready('lost', 'lost brief', true); await shot('l_0');
  const cells = await sc('lost', 'cells'), dark = cells.filter(c => !c.lit); console.log('new cells', cells.length, 'dark', dark.length, 'theta', await sc('lost', 'theta'));
  // hold an arrow key: the lamp moves and checks cells
  await p.keyboard.down('ArrowRight'); await wait(900); await p.keyboard.up('ArrowRight'); await p.keyboard.down('ArrowUp'); await wait(700); await p.keyboard.up('ArrowUp'); await wait(100);
  console.log('lamp after holds', JSON.stringify(await sc('lost', 'lamp')), 'checked', await sc('lost', 'checked')); await shot('l_sweep');
  if (!clean) {
    const lit = cells.filter(c => c.lit && dark.every(d => Math.hypot(d.x - c.x, d.y - c.y) > 16))[0]; await p.evaluate(([x, y]) => __game.scenes.lost.dbg.to(x, y), [lit.x + 1, lit.y + 1]); await wait(300); await key('Space'); await wait(400); await shot('l_nothing'); await ready('lost', 'lost nothing');
    const single = dark.find(c => dark.filter(d => Math.hypot(d.x - c.x, d.y - c.y) < 14).length < 3);
    if (single) { await sc('lost', 'to', [single.x, single.y]); await p.evaluate(([x, y]) => __game.scenes.lost.dbg.to(x, y), [single.x + 1, single.y + 1]); await wait(300); await shot('l_single'); await key('Space'); await wait(400); await ready('lost', 'lost single'); }
  }
  const grp = dark.filter(c => dark.filter(d => Math.hypot(d.x - c.x, d.y - c.y) < 14).length >= 4), gx = grp.reduce((s, c) => s + c.x, 0) / grp.length, gy = grp.reduce((s, c) => s + c.y, 0) / grp.length;
  await p.evaluate(([x, y]) => __game.scenes.lost.dbg.to(x, y), [gx, gy]); await wait(400); await shot('l_pile'); await key('Space'); await wait(500); await ready('lost', 'lost verdict'); await shot('l_done');
  console.log('lost', await ph('lost'), 'slips', await sc('lost', 'slips')); await key('Space'); await wait(1600); await settle(); await shot('d_hall3'); await bea(3);
  // the counter
  await door(956, 'counter'); await wait(700); await ready('counter', 'order 1', true); await shot('k_1');
  if (!clean) { await key('ArrowDown'); await key('Space'); await wait(400); await ready('counter', 'order 1 unchanged'); await key('ArrowUp'); }
  await key('Space'); await key('ArrowRight', 4); await wait(150); await shot('k_1_hold'); await key('Space'); await wait(200);
  if (!clean) { await key('ArrowDown'); await key('Space'); await wait(400); await ready('counter', 'order 1 half'); await key('ArrowUp'); }
  const t1 = await sc('counter', 'tubes'); const a = t1.findIndex(t => t.run === 0 && t.cond === 'P'), b = t1.findIndex(t => t.run === 1 && t.cond === 'C'), f = await sc('counter', 'foc');
  await key(a > f ? 'ArrowRight' : 'ArrowLeft', Math.abs(a - f)); await key('Space'); await key('ArrowRight', b - a); await key('Space'); await wait(200); await shot('k_1_even');
  console.log('order 1 gauge', await sc('counter', 'gauge')); await key('ArrowDown'); await key('Space'); await wait(500); await shot('k_1_won'); await ready('counter', 'order 1 won');
  await ready('counter', 'order 2', true); await shot('k_2');
  if (!clean) { await key('ArrowDown'); await key('Space'); await wait(400); await ready('counter', 'order 2 unchanged'); await key('ArrowUp'); }
  await key('Space'); await wait(200); await key('ArrowRight', 6); await key('Space'); await wait(200); await shot('k_2_split'); console.log('order 2 gauge', await sc('counter', 'gauge'), JSON.stringify(await sc('counter', 'tubes')).slice(0, 200));
  await key('ArrowDown'); await key('Space'); await wait(500); await ready('counter', 'order 2 won');
  await ready('counter', 'order 3', true); await shot('k_3');
  if (!clean) { await key('ArrowDown'); await key('Space'); await wait(400); await ready('counter', 'order 3 donor'); await key('ArrowUp'); await key('ArrowRight'); await wait(150); await shot('k_3_cond'); await key('ArrowDown'); await key('Space'); await wait(400); await ready('counter', 'order 3 condition'); await key('ArrowUp'); await key('ArrowLeft'); }
  await key('ArrowLeft'); await wait(200); await shot('k_3_run'); console.log('order 3 gauge', await sc('counter', 'gauge')); await key('Space'); await key('Space'); await wait(500); await ready('counter', 'order 3 won');
  await ready('counter', 'counter verdict'); await shot('k_done'); console.log('counter', await ph('counter'), 'slips', await sc('counter', 'slips'));
  await key('Space'); await wait(1800); await shot('d_hall4'); await settle(); await bea(4); await shot('d_hall5');
  console.log('rooms', JSON.stringify(await p.evaluate(() => ['sort', 'wash', 'lost', 'counter'].map(k => __game.state.rooms[k]))), 'laundry', JSON.stringify(await p.evaluate(() => __game.state.laundry)));
  await h.done(outDir + '/said.txt');
})();
