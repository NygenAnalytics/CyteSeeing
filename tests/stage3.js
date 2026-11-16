// stage 3 by keyboard, for any cell system: every move is read from the station's dbg hooks, so no cell type or gene is named here
const open = require('./lib.js');
(async () => {
  const [,, indexPath, outDir, mode] = process.argv;
  const h = await open(indexPath, outDir), { key, wait, shot, ph, at, door, talk, until, settle, p } = h;
  const sc = (room, fn) => p.evaluate(([r, f]) => __game.scenes[r].dbg[f](), [room, fn]);
  const clean = mode !== 'slips';   // 'slips' makes one mistake of each kind on the way
  // wait for a station to want input again, pressing through anything said on the way
  const ready = async (room, label, shots) => { for (let i = 0; i < 80; i++) { const q = await ph(room); if (await h.talking()) { await talk(label, shots); continue; } if (q === 'pinned' || q === 'print' || q === 'load' || q === 'open' || q === 'slot') { await wait(200); continue; } return q; } };
  await key('Space'); await wait(3600); await settle('mika'); await wait(200);
  await h.travel('who');
  await wait(1800); await settle('ida intro'); await wait(300); await shot('b1_bureau');
  const ida = async n => { await at(170); await key('Space'); await wait(300); await settle('ida ' + n); };
  await ida(0);
  // 3-1
  await door(280, 'cut'); await wait(900); await ready('cut', 'cut brief', true); await shot('c_dial0');
  if (!clean) { await key('Space'); await wait(500); await ready('cut', 'cut too coarse'); await shot('c_coarse'); await key('Space'); await wait(400); await key('ArrowRight', 9); await wait(300); await shot('c_dial9'); await key('Space'); await wait(500); await ready('cut', 'cut too fine'); await key('Space'); await wait(400); await key('ArrowLeft', 9); }
  await key('ArrowRight', 3); await wait(300); await shot('c_dial3'); await key('Space'); await wait(500); await ready('cut', 'cut close'); await shot('c_close'); await key('Space'); await wait(500); await ready('cut', 'cut tip'); await shot('c_fix');
  if (!clean) { await key('Space'); await wait(400); await ready('cut', 'cut zoom wrong'); await key('ArrowDown'); await key('Space'); await wait(400); await ready('cut', 'cut merge wrong'); await key('ArrowUp'); }
  await key('ArrowRight'); await wait(200); await key('Space'); await wait(500); await ready('cut', 'cut verdict'); await shot('c_done');
  console.log('cut', await ph('cut'), 'slips', await sc('cut', 'mistakes')); await key('Space'); await wait(1600); await settle(); await shot('d_board1'); await ida(1);
  // 3-2
  await door(452, 'lineup'); await wait(700); await ready('lineup', 'lineup brief', true); await shot('l_r1');
  for (let r = 0; r < 4; r++) {
    await ready('lineup', 'lineup'); const gs = await sc('lineup', 'genes'), k = gs.findIndex(g => g.good);
    console.log('round', r, gs.map(g => g.name + ' ' + Math.round(g.in * 100) + '/' + Math.round(g.out * 100) + (g.good ? '*' : '')).join(', '));
    let cur = 0;
    if (!clean) { for (let w = 0; w < 5; w++) { if (!gs[w].good) { await key('Space'); await wait(400); if (w === 0) await shot('l_wrong' + r); await ready('lineup', 'lineup wrong r' + r + ' ' + gs[w].name); } if (w < 4) { await key('ArrowDown'); await wait(120); cur++; } } }
    if (k >= 0) { if (k >= cur) await key('ArrowDown', k - cur); else await key('ArrowUp', cur - k); await wait(150); await shot('l_r' + (r + 1) + '_pick'); await key('Space'); await wait(450); await shot('l_r' + (r + 1) + '_pinned'); }
    else { await shot('l_r4'); await key('ArrowRight'); await key('Space'); await wait(500); await shot('l_r4_out'); }
    await ready('lineup', 'lineup ok r' + r, r === 3);
  }
  await wait(300); await shot('l_dots'); console.log('lineup', await ph('lineup'), 'slips', await sc('lineup', 'mistakes')); await ready('lineup', 'lineup verdict'); await shot('l_done'); await key('Space'); await wait(1600); await settle(); await shot('d_board2'); await ida(2);
  // 3-3
  await door(676, 'name'); await wait(700); await ready('name', 'name brief', true); await shot('n_0');
  for (let i = 0; i < 40 && await ready('name', 'name') !== 'result'; i++) {
    const st = await sc('name', 'state'), k = st.opts.findIndex(o => o.fits);
    if (!clean && k > 0 && !h['w' + st.ci + st.path.length]) { h['w' + st.ci + st.path.length] = 1; await key('Space'); await wait(400); await shot('n_wrong' + st.ci); await ready('name', 'name wrong c' + st.ci); continue; }
    if (!clean && st.ci === 1 && st.path.length === 1 && !h.early) { h.early = 1; await key('ArrowRight'); await key('Space'); await wait(400); await ready('name', 'name early'); await key('ArrowLeft'); continue; }
    if (!clean && st.ci === 2 && st.path.length === 2 && !h.sub) { h.sub = 1; await shot('n_sub'); await key('Space'); await wait(400); await ready('name', 'name subtype'); continue; }
    if (k >= 0) { await key('ArrowDown', k); await wait(120); await shot('n_c' + st.ci + '_d' + st.path.length); await key('Space'); await wait(400); if (st.path.length >= 1) await shot('n_c' + st.ci + '_filed'); }
    else { await key('ArrowRight'); await key('Space'); await wait(400); await shot('n_c' + st.ci + '_filed'); }
    await ready('name', 'name filed c' + st.ci);
  }
  await wait(300); await shot('n_files'); console.log('name', await ph('name'), JSON.stringify(await sc('name', 'state'))); await ready('name', 'name verdict'); await key('Space'); await wait(1600); await settle(); await shot('d_board3'); await ida(3);
  // 3-4
  await door(892, 'oracle'); await wait(700); await ready('oracle', 'oracle brief', true); await shot('o_carts');
  if (!clean) { await key('Space'); await wait(600); await ready('oracle', 'oracle far'); await shot('o_far'); await key('ArrowRight', 2); await key('Space'); await wait(600); await ready('oracle', 'oracle broad'); await key('ArrowLeft'); } else await key('ArrowRight');
  await key('Space'); await wait(600); await ready('oracle', 'oracle fit'); await shot('o_settle1'); console.log('oracle', JSON.stringify(await sc('oracle', 'state')).slice(0, 300));
  if (!clean) { await key('Space'); await wait(400); await ready('oracle', 'oracle keep wrong'); }
  await key('ArrowRight'); await key('Space'); await wait(400); await ready('oracle', 'oracle take'); await shot('o_settle2');
  if (!clean) { await key('ArrowRight'); await key('Space'); await wait(400); await ready('oracle', 'oracle take wrong'); await key('ArrowLeft'); }
  await key('Space'); await wait(400); await ready('oracle', 'oracle keep'); await shot('o_result'); console.log('oracle', await ph('oracle')); await ready('oracle', 'oracle verdict'); await key('Space'); await wait(1600); await settle(); await shot('d_board4'); await ida(4);
  // the Chief
  await door(1048, 'chief'); await wait(700); await ready('chief', 'chief intro', true); await wait(700);
  for (let q = 0; q < 5; q++) {
    const st = await sc('chief', 'state'); let k = st.cards.indexOf(st.ok[0]); if (!clean && q === 1) k = 0;
    await wait(900); await h.note('chief q' + q); await key('ArrowRight', k); await wait(150); await shot('f_q' + q); await key('Space'); await wait(300);
    if (await ph('chief') === 'ask') { await key('Space'); await wait(300); }
    await shot('f_a' + q); await ready('chief', 'chief a' + q); await wait(300);
  }
  await wait(400); await shot('f_result'); console.log('chief', await ph('chief'), JSON.stringify(await sc('chief', 'state'))); await ready('chief', 'chief verdict'); await key('Space'); await wait(2500); await settle(); await shot('z_end'); await ida(5); await at(280); await wait(300); await shot('z_board');
  console.log(JSON.stringify(await p.evaluate(() => ({ scene: __game.scene(), stars: __game.totalStars() + '/' + __game.maxStars(), bureau: __game.state.bureau, rooms: ['cut', 'lineup', 'name', 'oracle', 'chief'].map(k => k + ':' + __game.state.rooms[k].stars) }))));
  console.log('LOG', await p.evaluate(() => document.getElementById('nb-log').innerText));
  await h.done(outDir + '/said.txt');
})();
