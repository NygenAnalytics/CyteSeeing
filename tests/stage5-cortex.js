// stage 5 of the cortex project (the Marshalling Yard) by keyboard: every line said is written down. mode 'slips' makes each kind of mistake on the way
const open = require('./lib.js');
(async () => {
  const [,, indexPath, outDir, mode] = process.argv;
  const h = await open(indexPath, outDir), { key, wait, shot, ph, at, door, talk, settle, p } = h;
  const sc = (room, fn, a, b) => p.evaluate(([r, f, x, y]) => __game.scenes[r].dbg[f](x, y), [room, fn, a, b]);
  const clean = mode !== 'slips';
  const ready = async (room, label, shots) => { for (let i = 0; i < 90; i++) { const q = await ph(room); if (await h.talking()) { await talk(label, shots); continue; } if (q === 'load') { await wait(200); continue; } return q; } };
  const idle = async (room, ms) => { for (let i = 0; i < (ms || 6000) / 150 && await sc(room, 'busy'); i++) await wait(150); };
  await key('Space'); await wait(3600); await settle('mika'); await wait(200);
  await h.travel('order');
  await wait(1800); await shot('a0_arrive'); await settle('jun intro'); await wait(300); await shot('a1_hall');
  console.log('floor', await p.evaluate(() => __game.state.floor), 'stars', await p.evaluate(() => __game.totalStars() + '/' + __game.maxStars()));
  const jun = async n => { await at(176); await key('Space'); await wait(300); await settle('jun ' + n); };
  await jun(0);

  // 5-1: swing the bridge to a road, release an engine, read the lamps, set the root
  await door(292, 'turntable'); await wait(900); await ready('turntable', 'turntable brief', true); await shot('t_0');
  const roads = await sc('turntable', 'roads'), order = roads.map(r => r.road), stem = await sc('turntable', 'stem'), back = roads.find(r => r.back).road, mid = order[1];
  console.log('roads', JSON.stringify(roads), 'stem', stem);
  const point = async rd => { for (let i = 0; i < 5 && await sc('turntable', 'road') !== rd; i++) { const cur = await sc('turntable', 'road'); await key(cur < 0 ? (order.indexOf(rd) < 2 ? 'ArrowLeft' : 'ArrowRight') : order.indexOf(rd) > order.indexOf(cur) ? 'ArrowRight' : 'ArrowLeft'); await wait(150); } };
  const send = async (rd, label) => { await point(rd); await wait(450); await key('Space'); await wait(700); if (label) await shot('t_' + label + '_wave'); await idle('turntable'); await wait(300); if (label) await shot('t_' + label); };
  const setRoot = async label => { await key('ArrowDown'); await key('Space'); await wait(500); await shot('t_set_' + label.replace(/ /g, '_')); await ready('turntable', 'turntable ' + label); await wait(400); };
  await send(back, 'back'); console.log('shown', await sc('turntable', 'shown'), 'ran', JSON.stringify(await sc('turntable', 'ran')));
  if (!clean) { await setRoot('one end only'); console.log('slips after the guard', await sc('turntable', 'slips')); await send(mid, 'mid'); }
  await send(stem, 'stem');
  if (!clean) { await send(back); await setRoot('backwards'); await send(mid); await setRoot('middle'); await send(stem); }
  await setRoot('root'); await ready('turntable', 'turntable verdict'); await shot('t_done'); console.log('turntable', await ph('turntable'), 'slips', await sc('turntable', 'slips'), 'sent', await sc('turntable', 'sent'));
  await key('Space'); await wait(1600); await settle(); await shot('d_hall1'); await jun(1);

  // 5-2: lay track between two islands and send the test wagon
  await door(480, 'track'); await wait(900); await ready('track', 'track brief', true); await shot('k_0');
  const isl = await sc('track', 'islands'), pieces = await sc('track', 'pieces'), apart = await sc('track', 'apart'); console.log('islands', JSON.stringify(isl), 'pieces', JSON.stringify(pieces), 'apart', apart);
  // arrow keys really move between islands
  const seen = new Set(); for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowUp']) { await key(k); seen.add(await sc('track', 'cur')); }
  console.log('islands reached by arrows', [...seen].sort((a, b) => a - b).join(','), 'onDone', await sc('track', 'onDone'));
  const lay = async (a, b, label) => { await sc('track', 'go', a); await key('Space'); await sc('track', 'go', b); await wait(150); await key('Space'); await wait(600); if (label) await shot('k_' + label.replace(/ /g, '_') + '_roll'); await wait(1300); if (label) await shot('k_' + label.replace(/ /g, '_')); await ready('track', 'track ' + (label || a + '-' + b)); await wait(300); };
  const done = async label => { await key('ArrowDown', 6); await key('Space'); await wait(500); await shot('k_' + label.replace(/ /g, '_')); await ready('track', 'track ' + label); await wait(300); await key('ArrowUp'); };
  const id = name => isl.find(q => q.id === name).k, near = isl[apart].near;
  if (!clean) { await done('nothing laid'); }
  await lay(pieces[0][0], pieces[0][1], 'first piece');
  await lay(apart, near, 'nearest on the map');
  if (!clean) {
    await lay(id('RG'), id('NEW'), 'a jump'); await lay(id('OPC'), apart, 'two beside the line'); await lay(id('IPC'), id('MAT'), 'another jump'); await lay(id('NEW'), id('OPC'), 'a third');
    await done('too early');
  }
  for (const q of pieces.slice(1)) await lay(q[0], q[1]);
  await shot('k_laid'); console.log('laid', JSON.stringify(await sc('track', 'laid')), 'stops', await sc('track', 'stops'), 'sent', await sc('track', 'sent'));
  await key('ArrowDown', 6); await key('Space'); await wait(500); await ready('track', 'track verdict'); await shot('k_done'); console.log('track', await ph('track'), 'slips', await sc('track', 'slips'));
  await key('Space'); await wait(1600); await settle(); await shot('d_hall2'); await jun(2);

  // 5-3: set the lever, run the trolley along the line, peg each card where its lamp comes on
  await door(728, 'timetable'); await wait(900); await ready('timetable', 'timetable brief', true); await shot('m_0');
  const genes = await sc('timetable', 'genes'), truth = await sc('timetable', 'truth'), pass = await sc('timetable', 'pass'); console.log('cards', genes.join(','), 'order', truth.join(','), 'readable notches', JSON.stringify(pass));
  const focus = async f => { for (let i = 0; i < 10 && await sc('timetable', 'foc') !== f; i++) await key(await sc('timetable', 'foc') < f ? 'ArrowDown' : 'ArrowUp'); };
  const notch = async n => { await focus(0); for (let i = 0; i < 6 && await sc('timetable', 'si') !== n; i++) await key(await sc('timetable', 'si') < n ? 'ArrowRight' : 'ArrowLeft'); await wait(200); };
  const runTo = async s => { for (let i = 0; i < 40 && await sc('timetable', 'stop') !== s; i++) await key(await sc('timetable', 'stop') < s ? 'ArrowRight' : 'ArrowLeft'); };
  /* the trolley back to the root, then along the whole line with the key held down */
  const sweep = async () => { await focus(1); for (const q of [['ArrowLeft', 0], ['ArrowRight', 34]]) { if (await sc('timetable', 'stop') === q[1]) continue; await p.keyboard.down(q[0]); for (let i = 0; i < 60 && await sc('timetable', 'stop') !== q[1]; i++) await wait(100); await p.keyboard.up(q[0]); await wait(150); } await wait(200); };
  /* peg every card where its lamp first lights at this setting; `swap` pegs two of them the wrong way round */
  const pegAll = async swap => { const r = await sc('timetable', 'read'); for (let g = 0; g < genes.length; g++) { let s = r.first[truth.indexOf(genes[g])]; if (s < 0) continue; if (swap && genes[g] === truth[2]) s = r.first[3] + 1; await focus(g + 1); await runTo(s); await key('Space'); await wait(150); if (await h.talking()) await talk('timetable peg'); } await wait(200); };
  const check = async label => { await focus(genes.length + 1); await key('Space'); await wait(500); await shot('m_' + label.replace(/ /g, '_')); await ready('timetable', 'timetable ' + label); await wait(400); };
  if (!clean) {
    await sweep(); await shot('m_raw'); console.log('no smoothing', JSON.stringify(await sc('timetable', 'read'))); await pegAll(); await check('raw');
    await notch(1); await sweep(); await pegAll(); await check('a little');
    await notch(3); await sweep(); await wait(300); await shot('m_much'); await ready('timetable', 'timetable lost'); console.log('much smoothing', JSON.stringify(await sc('timetable', 'read')));
    await focus(genes.indexOf(truth[1]) + 1); await key('Space'); await wait(300); await ready('timetable', 'timetable dark lamp'); await check('not all pegged');
    await notch(pass[0]); await sweep(); await pegAll(true); await shot('m_swapped'); await check('wrong order');
  }
  await notch(pass[0]); await sweep(); await shot('m_swept'); await pegAll(); await shot('m_pegged'); console.log('pegs', JSON.stringify(await sc('timetable', 'pegs')), JSON.stringify(await sc('timetable', 'read')));
  await check('checked'); await ready('timetable', 'timetable verdict'); await shot('m_done'); console.log('timetable', await ph('timetable'), 'slips', await sc('timetable', 'slips'));
  await key('Space'); await wait(1600); await settle(); await shot('d_hall3'); await jun(3);

  // 5-4: put the trains in order of age, turn the labels, and answer Jun twice
  await door(908, 'clock'); await wait(900); await ready('clock', 'clock brief', true); await shot('c_0');
  const want = await sc('clock', 'truth'), right = await sc('clock', 'right'); console.log('trains', JSON.stringify(await sc('clock', 'rows')), 'by age', JSON.stringify(want));
  const row = async r => { for (let i = 0; i < 6 && await sc('clock', 'cur') !== r; i++) await key(await sc('clock', 'cur') < r ? 'ArrowDown' : 'ArrowUp'); };
  const turn = async label => { await row(3); await key('Space'); await wait(700); await shot('c_' + label.replace(/ /g, '_')); await ready('clock', 'clock ' + label, true); await wait(300); };
  if (!clean) await turn('as they stand');
  for (let r = 0; r < want.length; r++) { const rows = await sc('clock', 'rows'), j = rows.indexOf(want[r]); if (j === r) continue; await row(r); await key('Space'); await row(j); if (r === 0) await shot('c_held'); await key('Space'); await wait(150); }
  console.log('sorted', JSON.stringify(await sc('clock', 'rows'))); await shot('c_sorted'); await turn('turned');
  console.log('clock', await ph('clock')); await shot('c_q1');
  const pick = async k => { for (let i = 0; i < 5 && await sc('clock', 'psel') !== k; i++) await key(await sc('clock', 'psel') < k ? 'ArrowRight' : 'ArrowLeft'); await shot('c_pick' + k); await key('Space'); await wait(500); };
  await pick(clean ? right.q1 : 0); await ready('clock', 'clock stretches', true); await wait(300); console.log('clock', await ph('clock')); await shot('c_q2');
  await pick(clean ? right.q2 : 0); await ready('clock', 'clock descent'); await ready('clock', 'clock verdict'); await shot('c_done'); console.log('clock', await ph('clock'), 'slips', await sc('clock', 'slips'));
  await key('Space'); await wait(1600); await settle(); await shot('d_hall4'); await jun(4);

  // the departure board: slide the plates on to the rails, turn the flaps, pull the signal, and answer Vera
  await door(1024, 'board'); await wait(800); await ready('board', 'vera asks', true); await shot('b_0');
  const ok = await sc('board', 'right'); console.log('the yard bears out', JSON.stringify(ok));
  const goTo = async (c, r) => { for (let i = 0; i < 12; i++) { const q = await sc('board', 'cur'); if (q[1] === r) break; await key(q[1] < r ? 'ArrowDown' : 'ArrowUp'); } for (let i = 0; i < 4; i++) { const q = await sc('board', 'cur'); if (q[0] === c) break; await key(q[0] < c ? 'ArrowRight' : 'ArrowLeft'); } };
  const place = async (state, r) => { const rails = await sc('board', 'rails'); if (rails[r] === state) return; const i = (await sc('board', 'rack')).indexOf(state); await goTo(i < 0 ? 0 : 2, i < 0 ? rails.indexOf(state) : i); await key('Space'); await goTo(0, r); await key('Space'); await wait(260); };
  const flap = async (r, allowed) => { await goTo(1, r); for (let i = 0; i < 8 && allowed.indexOf((await sc('board', 'flaps'))[r]) < 0; i++) { await key('Space'); await wait(150); } };
  const pull = async label => { await goTo(0, 5); await key('Space'); await wait(600); await shot('b_' + label.replace(/ /g, '_') + '_run'); await wait(1500); await shot('b_' + label.replace(/ /g, '_')); await ready('board', 'board ' + label); await wait(400); };
  const fill = async (states, flaps) => { for (let r = 0; r < 5; r++) await place(states[r], r); for (let r = 0; r < 5; r++) await flap(r, flaps[r]); };
  if (!clean) {
    await pull('empty');
    await fill(ok.states.slice(0, 4).reverse().concat([ok.states[4]]), ok.flaps.slice(0, 4).reverse().concat([ok.flaps[4]])); await pull('backwards');
    const sw = ok.states.slice(); sw[3] = ok.states[4]; sw[4] = ok.states[3]; await fill(sw, ok.flaps); await pull('off the line');
    await fill(ok.states, ok.flaps); await flap(1, ok.flaps[3]); await pull('wrong gene');
  }
  await fill(ok.states, ok.flaps); await shot('b_full'); console.log('rails', JSON.stringify(await sc('board', 'rails')), 'flaps', JSON.stringify(await sc('board', 'flaps')));
  await pull('pulled'); for (let i = 0; i < 40 && await ph('board') !== 'push'; i++) { if (await h.talking()) await talk('vera pushes'); else await wait(200); }
  await wait(600); await shot('b_push0'); await key(clean ? 'ArrowLeft' : 'ArrowRight'); if (!clean) await key('ArrowRight'); await wait(200); await shot('b_push'); await key('Space'); await wait(500);
  await ready('board', clean ? 'vera gives way' : 'wrote the days'); await ready('board', 'board verdict'); await shot('b_done'); console.log('board', await ph('board'), 'slips', await sc('board', 'slips'));
  await key('Space'); await wait(1800); await shot('d_hall5'); await settle(); await jun(5); await shot('d_hall6');
  console.log('rooms', JSON.stringify(await p.evaluate(() => ['turntable', 'track', 'timetable', 'clock', 'board'].map(k => __game.state.rooms[k]))), 'yard', JSON.stringify(await p.evaluate(() => __game.state.yard)));
  console.log('log', JSON.stringify(await p.evaluate(() => Array.from(document.querySelectorAll('#nb-log li')).map(li => li.textContent).slice(-6))));
  console.log('methods', await p.evaluate(() => document.getElementById('nb-meth').textContent.slice(-900)));
  await h.done(outDir + '/said.txt');
})();
