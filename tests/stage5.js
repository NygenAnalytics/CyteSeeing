// stage 5 by keyboard: every line said is written down. mode 'slips' makes each kind of mistake on the way
const open = require('./lib.js');
(async () => {
  const [,, indexPath, outDir, mode] = process.argv;
  const h = await open(indexPath, outDir), { key, wait, shot, ph, at, door, talk, settle, p } = h;
  const sc = (room, fn, arg) => p.evaluate(([r, f, a]) => __game.scenes[r].dbg[f](a), [room, fn, arg]);
  const clean = mode !== 'slips';
  const ready = async (room, label, shots) => { for (let i = 0; i < 90; i++) { const q = await ph(room); if (await h.talking()) { await talk(label, shots); continue; } if (q === 'load') { await wait(200); continue; } return q; } };
  await key('Space'); await wait(3600); await settle('mika'); await wait(200);
  await h.travel('changes');
  await wait(1800); await shot('a0_arrive'); await settle('amara intro'); await wait(300); await shot('a1_hall');
  console.log('floor', await p.evaluate(() => __game.state.floor));
  const amara = async n => { await at(176); await key('Space'); await wait(300); await settle('amara ' + n); };
  await amara(0);

  // 5-1: bag every heap by holding the action key, then stamp
  await door(292, 'scales'); await wait(900); await ready('scales', 'scales brief', true); await shot('s_0');
  await key('ArrowRight', 3); await key('ArrowLeft'); console.log('cursor after arrows', await sc('scales', 'cur'), 'p on cells', await sc('scales', 'p'));
  for (let c = 0; c < 3; c++) {
    if (!clean && c === 0) { await key('ArrowDown'); await key('Space'); await wait(400); await shot('s_loose'); await ready('scales', 'scales loose'); await wait(400); }
    await p.keyboard.down('Space'); for (let i = 0; i < 60 && !(await sc('scales', 'bagged')).every(b => b); i++) { await wait(150); if (c === 0 && i === 6) await shot('s_bagging'); } await p.keyboard.up('Space'); await wait(250);
    const holds = await sc('scales', 'holds'); console.log('claim', c + 1, 'bagged', (await sc('scales', 'bagged')).filter(b => b).length, 'p on donors', (await sc('scales', 'p')).toFixed(4), 'holds', holds, 'on stamps', await sc('scales', 'onStamp'));
    await shot('s_bagged' + c);
    if (!clean && c < 2) { await key(holds ? 'ArrowRight' : 'ArrowLeft'); await key('Space'); await wait(400); await ready('scales', 'scales wrong ' + c); await wait(400); await key('ArrowDown'); }
    await key(holds ? 'ArrowLeft' : 'ArrowRight'); await key('Space'); await wait(500); await shot('s_stamp' + c); await ready('scales', 'scales claim ' + (c + 1)); await wait(400);
  }
  await ready('scales', 'scales verdict'); await shot('s_done'); console.log('scales', await ph('scales'), 'slips', await sc('scales', 'slips'));
  await key('Space'); await wait(1600); await settle(); await shot('d_hall1'); await amara(1);

  // 5-2: move tiles in and out of the formula, then FIT
  await door(480, 'formula'); await wait(900); await ready('formula', 'formula brief', true); await shot('f_0');
  const ORDER = ['donor', 'visit', 'response', 'vr', 'run', 'gene', 'fit'];
  const goTo = async id => { for (let i = 0; i < 12; i++) { const f = await sc('formula', 'foc'); if (f === id) return; await key(ORDER.indexOf(id) > ORDER.indexOf(f) ? 'ArrowRight' : 'ArrowLeft'); } };
  const setTerms = async want => { for (const id of ORDER.slice(0, 5)) { const has = (await sc('formula', 'terms')).indexOf(id) >= 0; if (has !== (want.indexOf(id) >= 0)) { await goTo(id); await key('Space'); await wait(250); if (await h.talking()) { await shot('f_jam_' + id); await talk('formula jam'); await wait(400); } } } await wait(350); };
  const fitNow = async label => { await goTo('fit'); await key('Space'); await wait(450); await shot('f_' + label.replace(/ /g, '_')); await ready('formula', 'formula ' + label); await wait(400); };
  for (let r = 0; r < 3; r++) {
    await ready('formula', 'formula round ' + (r + 1), r > 0); const want = await sc('formula', 'want');
    if (!clean && r === 0) { await setTerms(['visit']); await shot('f_r1_visit'); await fitNow('r1 no donor'); await setTerms(['donor', 'visit', 'response']); await fitNow('r1 jammed'); await setTerms(['donor', 'visit', 'vr']); await fitNow('r1 extra'); }
    if (!clean && r === 1) { await setTerms(['visit', 'response']); await shot('f_r2_loose'); await fitNow('r2 no interaction'); await setTerms(['donor', 'vr']); await fitNow('r2 no visit'); await setTerms(want); await shot('f_r2_trap'); await fitNow('r2 trap gene'); }
    if (!clean && r === 2) { await setTerms(['visit', 'response', 'vr', 'run']); await shot('f_r3_nodonor'); await fitNow('r3 no donor'); }
    await setTerms(want);
    const ans = await sc('formula', 'answer'); if (await sc('formula', 'gene') !== ans) { await goTo('gene'); await key('Space'); await wait(400); }
    console.log('round', r + 1, 'terms', (await sc('formula', 'terms')).join('+'), 'gene', (await sc('formula', 'genes'))[await sc('formula', 'gene')], JSON.stringify(await sc('formula', 'fit'))); await shot('f_r' + (r + 1) + '_right');
    await fitNow('r' + (r + 1) + ' won');
  }
  await ready('formula', 'formula verdict'); await shot('f_done'); console.log('formula', await ph('formula'), 'slips', await sc('formula', 'slips'));
  await key('Space'); await wait(1600); await settle(); await shot('d_hall2'); await amara(2);

  // 5-3: a rule and a rate, then CHECK
  await door(728, 'stairs'); await wait(900); await ready('stairs', 'stairs brief', true); await shot('t_0');
  const setRule = async (ri, qi) => { for (let i = 0; i < 4 && await sc('stairs', 'ri') !== ri; i++) await key(await sc('stairs', 'ri') < ri ? 'ArrowRight' : 'ArrowLeft'); for (let i = 0; i < 5 && await sc('stairs', 'qi') !== qi; i++) await key(await sc('stairs', 'qi') < qi ? 'ArrowUp' : 'ArrowDown'); await wait(800); };
  const pass = (await sc('stairs', 'pass')); console.log('settings that pass', JSON.stringify(pass));
  if (!clean) for (const q of [[0, 1], [1, 1], [2, 3], [2, 0]]) { await setRule(q[0], q[1]); await shot('t_' + q.join('')); await key('Space'); await wait(500); await ready('stairs', 'stairs ' + q.join('')); await shot('t_' + q.join('') + '_res'); console.log('tried', await sc('stairs', 'rule'), await sc('stairs', 'rate'), JSON.stringify(await sc('stairs', 'now')), await ph('stairs')); await key('Space'); await wait(400); }
  await setRule(pass[0][0], pass[0][1]); await shot('t_right'); console.log('set', await sc('stairs', 'rule'), await sc('stairs', 'rate'), JSON.stringify(await sc('stairs', 'now')));
  await key('Space'); await wait(500); await ready('stairs', 'stairs verdict'); await shot('t_done'); console.log('stairs', await ph('stairs'), 'slips', await sc('stairs', 'slips'));
  await key('Space'); await wait(1600); await settle(); await shot('d_hall3'); await amara(3);

  // 5-4: pump one cell type until the copy matches, then the ledger
  await door(908, 'census'); await wait(900); await ready('census', 'census brief', true); await shot('c_0');
  const ans = await sc('census', 'answer'); console.log('one pump', JSON.stringify(ans), 'gap', (await sc('census', 'gap')).toFixed(4));
  const pick = async k => { for (let i = 0; i < 6 && await sc('census', 'sel') !== k; i++) await key('ArrowUp'); };
  if (!clean) {
    await key('Space'); await wait(400); await ready('census', 'census no match'); await wait(400);
    for (const k of ans.fell) { await pick(k); await key('ArrowLeft', ans.steps); } await wait(500); await shot('c_four'); console.log('four pumped: gap', (await sc('census', 'gap')).toFixed(4), 'moved', await sc('census', 'pumps'));
    await key('Space'); await wait(400); await ready('census', 'census four'); await wait(400);
  }
  await pick(ans.k); await key(ans.steps > 0 ? 'ArrowRight' : 'ArrowLeft', Math.abs(ans.steps)); await wait(500); await shot('c_one'); console.log('pumped', JSON.stringify(await sc('census', 'steps')), 'gap', (await sc('census', 'gap')).toFixed(4));
  await key('Space'); await wait(500); await ready('census', 'census pumped'); await wait(400); await shot('c_ledger');
  /* marks: 0 nothing, 1 changed, 2 reference. A line is marked by going to it and pressing right until it reads as wanted. */
  /* twice over, because marking a new reference takes the mark off the old one */
  const markAll = async want => { for (let pass = 0; pass < 2; pass++) { await key('ArrowUp', 6); for (let k = 0; k < want.length; k++) { for (let i = 0; i < 3 && (await sc('census', 'marks'))[k] !== want[k]; i++) await key('ArrowRight'); await key('ArrowDown'); } } await wait(200); };
  const enter = async label => { await key('ArrowDown', 2); await key('Space'); await wait(500); await shot('c_' + label.replace(/ /g, '_')); await ready('census', 'census ' + label); await wait(400); };
  const K = ans.fell.length + 1, steady = ans.fell[0];
  if (!clean) {
    await markAll(Array.from({ length: K }, (_, k) => (k === ans.k ? 2 : 1))); await enter('wrong reference');
    await markAll(Array.from({ length: K }, (_, k) => (k === steady ? 2 : 1))); await enter('fell in share');
    await markAll(Array.from({ length: K }, (_, k) => (k === steady ? 2 : 0))); await enter('nothing changed');
  }
  await markAll(Array.from({ length: K }, (_, k) => (k === steady ? 2 : k === ans.k ? 1 : 0))); console.log('marks', JSON.stringify(await sc('census', 'marks')));
  await enter('entered'); await ready('census', 'census verdict'); await shot('c_done'); console.log('census', await ph('census'), 'slips', await sc('census', 'slips'));
  await key('Space'); await wait(1600); await settle(); await shot('d_hall4'); await amara(4);

  // the read-out: turn each slot to its word, hand it over, and answer Vera
  await door(1024, 'readout'); await wait(800); await ready('readout', 'vera asks', true); await shot('r_0');
  const slots = await sc('readout', 'slots'), right = await sc('readout', 'right'); console.log('sentences that hold', JSON.stringify(right));
  const setSlots = async want => { await key('ArrowLeft', 6); for (let i = 0; i < want.length; i++) { for (let n = 0; n < 6 && (await sc('readout', 'picks'))[i] !== want[i]; n++) await key('ArrowDown'); await key('ArrowRight'); } await wait(200); };
  const hand = async label => { await key('ArrowRight', 6); await key('Space'); await wait(500); await shot('r_' + label.replace(/ /g, '_')); await ready('readout', 'readout ' + label); await wait(400); };
  const id = (slot, name) => slots.find(s => s.id === slot).opts.indexOf(name), good = right[0];
  if (!clean) {
    await setSlots([id('who', 'all'), id('when', 'after'), id('cells', 'mono'), id('do', 'isg'), id('tie', 'cause')]); await hand('true of everyone');
    await setSlots([id('who', 'resp'), id('when', 'after'), id('cells', 'cd8'), id('do', 'geno'), id('tie', 'with')]); await hand('a few donors');
    await setSlots([id('who', 'resp'), id('when', 'after'), id('cells', 'mono'), id('do', 'less'), id('tie', 'with')]); await hand('made room');
    await setSlots([id('who', 'resp'), id('when', 'both'), id('cells', 'cd8'), id('do', 'act'), id('tie', 'with')]); await hand('not before');
    await setSlots(good.slice(0, 4).concat([id('tie', 'cause')])); await hand('causes');
    await setSlots(good.slice(0, 4).concat([id('tie', 'pred')])); await hand('predicts');
  }
  await setSlots(good); await shot('r_built'); console.log('sentence:', await sc('readout', 'sentence'));
  await hand('handed over'); console.log('readout', await ph('readout'));
  await shot('r_push0'); await key(clean ? 'ArrowLeft' : 'ArrowRight'); await wait(300);
  await shot('r_push'); await key('Space'); await wait(500); await ready('readout', clean ? 'vera gives way' : 'gave in'); await ready('readout', 'readout verdict'); await shot('r_done');
  console.log('readout', await ph('readout'), 'slips', await sc('readout', 'slips'));
  await key('Space'); await wait(1800); await shot('d_hall5'); await settle(); await amara(5); await shot('d_hall6');
  console.log('rooms', JSON.stringify(await p.evaluate(() => ['scales', 'formula', 'stairs', 'census', 'readout'].map(k => __game.state.rooms[k]))), 'weigh', JSON.stringify(await p.evaluate(() => __game.state.weigh)));
  await h.done(outDir + '/said.txt');
})();
