// The Long Gallery (the end of a project) by keyboard: every line said is written down.
//   clean  a finished project: every plate and every line is measured, the five questions are walked to their frames, the close, the map, the ribbon in the bay
//   slips  the same with every near miss and one other wrong frame for each question, the lectern too early, and START AGAIN at the end
//   hung   a new player sent straight to the gallery: Tomo runs the steps, frames hang empty, and the review does not start until the wall is full
// The save comes from done.js. SCEN says which project (response or cortex).
const open = require('./lib.js'), done = require('./done.js');
(async () => {
  const [,, indexPath, outDir, mode] = process.argv, project = process.env.SCEN === 'cortex' ? 'cortex' : 'response';
  const hung = mode === 'hung', clean = mode !== 'slips' && !hung;
  const h = await open(indexPath, outDir, null, hung ? null : ctx => done.init(ctx, project)), { key, wait, shot, at, settle, p } = h;
  const g = (fn, a, b) => p.evaluate(([f, x, y]) => __game.kits.gallery.dbg[f](x, y), [fn, a, b]);
  const cl = (fn, a) => p.evaluate(([f, x]) => __game.scenes.close.dbg[f](x), [fn, a]);
  const hall = fn => p.evaluate(f => __game.scenes.corridor.dbg[f](), fn);
  const state = () => p.evaluate(() => ({ close: __game.state.rooms.close, review: __game.state.review, stars: __game.totalStars() + '/' + __game.maxStars(), finished: __game.profile.finished }));
  /* every page of a line against the speech box: one box, three lines, no dash */
  const fit = lines => p.evaluate(ls => ls.filter(text => { const G = __game, pages = G.pages(text), m = /^([A-Z0-9 .'-]{2,16}): /.exec(pages[0]), who = m ? m[1] : null;
    return pages.length > 1 || text.length > 132 || new RegExp('[' + String.fromCharCode(8211, 8212) + ']').test(text) || G.wrap(m ? pages[0].slice(m[0].length) : pages[0], who && G.LOOKS[who] ? 270 : 292, 'md').length > 3; }), lines);
  /* walk there with the arrow key held down, as a player would */
  const walk = async x => { const k = (await hall('heroX')) < x ? 'ArrowRight' : 'ArrowLeft'; await p.keyboard.down(k); for (let i = 0; i < 400; i++) { const hx = await hall('heroX'); if (k === 'ArrowRight' ? hx >= x - 4 : hx <= x + 4) break; await wait(25); } await p.keyboard.up(k); await wait(250); };
  const point = async (room, label) => { const f = frames.find(q => q.room === room); await at(f.x); await wait(200); await key('Space'); await wait(350); await shot(label); await settle(label); await wait(200); };

  await key('Space'); await wait(3000); await settle('start');
  let frames;
  if (hung) {
    /* a player who has done nothing: the map hands every step to Tomo */
    await h.travel('gallery'); await wait(1200); await shot('h0_arrive'); await settle('vera hung'); await wait(300);
    frames = await g('frames');
    console.log('hung: complete', await g('complete'), 'floor', await p.evaluate(() => __game.state.floor), 'frames', frames.length, 'lent', await p.evaluate(() => Object.keys(__game.state.rooms).filter(k => __game.state.rooms[k].by).length));
    /* every plate fits its band here too: most say that Tomo ran the step, and some hang empty */
    let long = 0; for (const f of frames) { const pl = await g('plate', f.room); if (pl.lines.length > 3 || pl.wide > 254) { long++; console.log('PLATE TOO LONG', f.code, pl.lines.length, Math.round(pl.wide)); } h.texts.push('[plate ' + f.code + '] ' + pl.text.replace('\n', ' / ')); }
    console.log('plates checked', frames.length, 'too long', long);
    for (const r of ['soup', 'cut', 'wash', 'review', frames[frames.length - 1].room]) { const f = frames.find(q => q.room === r); await at(f.x); await wait(300); await shot('h_plate_' + r); console.log('plate', f.code, JSON.stringify((await g('plate', r)).text)); }
    const askers = await g('askers');
    await at(askers[0].home); await key('Space'); await wait(300); await shot('h_asker'); await settle('asker waits'); console.log('hold', await g('hold'));
    await at(frames[0].x - 42); await key('Space'); await wait(300); await settle('mentor owes');
    await at(await g('lectern')); await wait(300); await shot('h_lectern'); await key('Space'); await wait(300); await shot('h_owed'); await settle('vera owed');
    console.log('scene', await h.scene(), 'next', await p.evaluate(() => __game.kits.gallery.next()));
    /* the rooms that close each stage are done: the wall is full, and the review starts on the next visit */
    await p.evaluate(() => { const G = __game; G.route().forEach(id => { const st = G.STAGES[id]; if (!st.end) st.rooms.concat(st.extra || []).forEach(r => { if (!G.state.rooms[r].done) G.state.rooms[r] = { done: true, stars: 2 }; }); }); G.save(); G.go('corridor', { floor: 'gallery', from: 'lift' }); });
    await wait(1600); await shot('h1_review'); await settle('vera review'); await wait(300);
    console.log('full: complete', await g('complete'), 'stars', (await state()).stars);
    /* the first question is answered at a frame for a step that Tomo ran */
    const a0 = (await g('askers'))[0]; await at(a0.home); await key('Space'); await wait(300); await settle('asks'); await wait(200);
    await point(a0.room, 'h_tomo_frame'); console.log('settled', await g('settled'), 'slips', await g('slips'), 'plate', JSON.stringify((await g('plate', a0.room)).text));
    /* the other four, and the close: the page counts the steps that Tomo ran */
    const rest = await g('askers');
    for (let k = 1; k < rest.length; k++) { await at(rest[k].home); await key('Space'); await wait(300); await settle('asks'); await wait(200); await point(rest[k].room, 'h_q' + k); }
    await settle('vera calls'); await at(await g('lectern')); await wait(300); await key('Space'); await wait(1500);
    for (let i = 0; i < 200 && await h.ph('close') !== 'end'; i++) { if (await h.talking()) await h.note('close'); await key('Space'); await wait(160); }
    await wait(400); await shot('h_page');
    const st = await state(); console.log('gallery hung close', JSON.stringify(st.close), 'slips', st.review.slips, 'stars', st.stars, 'finished', JSON.stringify(st.finished));
    await h.done(outDir + '/said.txt'); return;
  }

  // out of the fifth stage by the map, along the road past the building site, and in
  await key('l'); await wait(1300);
  const nodes = await p.evaluate(() => __game.scenes.campus.dbg.nodes()); console.log('map', nodes.map(n => n.kind + ':' + (n.id || n.name)).join(' '));
  await shot('a0_map'); await key('ArrowRight'); await wait(900); await key('ArrowRight'); await wait(900); await shot('a1_map_gallery');
  console.log('at', await p.evaluate(() => __game.scenes.campus.dbg.at()), 'of', nodes.length);
  await key('Space'); await wait(2400); await shot('a2_arrive'); await settle('vera'); await wait(300); await shot('a3_hall');
  console.log('scene', await h.scene(), 'floor', await p.evaluate(() => __game.state.floor), 'stars', (await state()).stars, 'complete', await g('complete'));
  frames = await g('frames'); const askers = await g('askers'), lectern = await g('lectern');
  console.log('frames', frames.length, frames.map(f => f.code + ' ' + f.room).join(', '));
  console.log('groups', JSON.stringify(await g('groups')), 'askers', JSON.stringify(askers.map(a => a.who + ' ' + a.room + ' @' + a.home)), 'length', await p.evaluate(() => __game.kits.gallery.W));

  // nobody's name tag touches the next one's
  console.log('name tags that touch', await p.evaluate(() => { const G = __game, its = G.kits.gallery.ITEMS.filter(i => i.kind === 'asker' || i.kind === 'mentor').map(i => ({ x: i.x, w: Math.ceil(G.tw(i.who, 'sm')) + 8 }));
    let bad = 0; for (let i = 1; i < its.length; i++) if (its[i].x - its[i].w / 2 < its[i - 1].x + its[i - 1].w / 2 + 2) bad++; return bad; }));
  // every plate fits its band, and every line the hall can say fits the speech box
  let long = 0; const room = 254;
  for (const f of frames) { const pl = await g('plate', f.room); if (pl.lines.length > 3 || pl.wide > room) { long++; console.log('PLATE TOO LONG', f.code, pl.lines.length, Math.round(pl.wide)); } h.texts.push('[plate ' + f.code + '] ' + pl.text); }
  console.log('plates checked', frames.length, 'too long', long);
  const said = await g('said'), bad = await fit(said); bad.forEach(l => console.log('DOES NOT FIT', l));
  console.log('hall lines checked', said.length, 'do not fit', bad.length);
  said.forEach(l => h.texts.push('[can say] ' + l));

  // the things to poke, and the people of the stages
  for (const it of (await hall('items')).filter(i => /^g-/.test(i[0]))) for (let n = 0; n < 3; n++) { await at(it[1]); await key('Space'); await wait(350); if (n === 0) await shot('p_' + it[0]); await settle('poke ' + it[0]); }
  for (const it of (await hall('items')).filter(i => /^m-/.test(i[0]))) for (let n = 0; n < 2; n++) { await at(it[1]); await key('Space'); await wait(300); await settle('talk ' + it[0]); }
  console.log('eggs', await p.evaluate(() => Object.keys(__game.state.eggs).filter(k => /^g-/.test(k)).length));
  if (!clean) { await at(lectern); await key('Space'); await wait(300); await shot('s_too_early'); await settle('lectern too early'); console.log('scene', await h.scene()); }

  // the five questions
  for (let k = 0; k < askers.length; k++) {
    const a = askers[k], f = frames.find(q => q.room === a.room);
    await at(a.home); await wait(250); if (k === 0) await shot('q0_before');
    await key('Space'); await wait(350); await shot('q' + k + '_ask'); await settle('asks ' + a.who); await wait(250);
    console.log('question', k, a.who, 'in hand', await g('hold'), 'answer', f.code);
    if (k === 0) {
      /* walked, not jumped: whoever asked keeps up, and the plate of each frame comes up on the way */
      await walk(f.x - 84); await shot('q0_walking'); await walk(f.x);
      const who = (await g('askers'))[0]; console.log('walked to', f.code, 'hero', Math.round(await hall('heroX')), 'follower', who.x, 'plate up', await g('inHand'));
      /* asked again on the way */
      await p.keyboard.down('ArrowLeft'); await wait(120); await p.keyboard.up('ArrowLeft'); await wait(250); console.log('near the follower: busy before', await hall('busy'));
    }
    if (!clean) {
      const near = await p.evaluate(i => Object.keys(__game.sys.gallery.questions[i].near || {}), k), other = frames.find(q => q.room !== a.room && near.indexOf(q.room) < 0 && q.stage !== f.stage);
      for (const r of near.filter(r => frames.some(q => q.room === r)).concat([other.room])) { const s0 = await g('slips'); await point(r, 'q' + k + '_wrong_' + r); console.log('  wrong', r, 'slips', s0, '->', await g('slips'), 'still in hand', await g('hold')); }
      if (k === 1) { await at(askers[2].home); await key('Space'); await wait(300); await settle('one at a time'); console.log('  another asker while one is in hand: in hand', await g('hold')); }
      /* one press too many after a speech does not answer again */
      const s1 = await g('slips'); await at(frames.find(q => q.room === other.room).x); await key('Space'); await wait(60); await key('Space'); await key('Space'); await settle('double'); console.log('  three presses at a wrong frame: slips', s1, '->', await g('slips'));
    }
    await at(f.x); await wait(250); await shot('q' + k + '_at_frame'); await key('Space'); await wait(350); await shot('q' + k + '_right'); await settle('right ' + a.who); await wait(900); await shot('q' + k + '_settled');
    console.log('  settled', await g('settled'), 'slips', await g('slips'), 'asker', JSON.stringify((await g('askers'))[k]));
  }
  await settle('vera calls'); await wait(300);
  console.log('all settled', await g('settled'), 'next', await p.evaluate(() => __game.kits.gallery.next()), 'tries', await p.evaluate(() => __game.state.tries.close));

  // the lectern, and the close
  await at(lectern); await wait(300); await shot('c0_lectern'); await key('Space'); await wait(1500);
  console.log('scene', await h.scene(), 'crowd', (await cl('crowd')).join(' '));
  const lines = await cl('said'), bad2 = await fit(lines); bad2.forEach(l => console.log('DOES NOT FIT', l)); console.log('close lines checked', lines.length, 'do not fit', bad2.length, 'screen: widest', Math.round(await cl('wide')), 'of', await cl('room'), (await cl('wide')) <= (await cl('room')) ? 'fits' : 'TOO WIDE');
  let seen = '', n = 0;
  for (let i = 0; i < 200; i++) {
    const ph = await h.ph('close'), sl = await cl('slide'), tag = ph + ':' + sl + ':' + (await h.said()) + ':' + (ph === 'read' ? await cl('shown') : '');
    if (ph === 'end') break;
    if (tag !== seen) { seen = tag; await h.note('close ' + sl); if (ph !== 'read' || (await cl('shown')) === (await cl('rows')).length) await shot('c' + (++n) + '_' + sl); }
    /* the clean run lets Vera read the finding out at her own pace; the other presses on */
    if (ph === 'read' && clean) { await wait(200); continue; }
    await key('Space'); await wait(160);
  }
  console.log('read out', JSON.stringify(await cl('rows')));
  await wait(400); await shot('c9_end'); console.log('close', await h.ph('close'), 'stars', await cl('stars'), 'slips', await cl('slips'), JSON.stringify(await state()));
  if (clean) {
    await key('Space'); await wait(1600); await shot('d0_map'); console.log('scene', await h.scene(), 'at', await p.evaluate(() => __game.scenes.campus.dbg.at()));
    /* the parcel in the arrivals bay wears a ribbon, and the gallery stays open */
    await p.evaluate(() => __game.go('corridor', { floor: 'bay', from: 'lift' })); await wait(1400); await settle(); await at(project === 'cortex' ? 300 : 226); await wait(300); await shot('d1_bay'); await key('Space'); await wait(300); await h.note('label'); console.log('label:', await h.said()); await settle('label');
    await h.travel('gallery'); await wait(1200); console.log('back in the gallery: busy', await hall('busy'), 'next', await p.evaluate(() => __game.kits.gallery.next())); await at(frames[3].x); await wait(300); await shot('d2_again');
    await at(lectern); await wait(300); await shot('d3_lectern'); await key('Space'); await wait(1500); console.log('lectern again: scene', await h.scene()); await key('Escape'); await wait(1200); console.log('left to', await h.scene(), 'at', Math.round(await hall('heroX')));
  } else {
    /* START AGAIN: the ribbons come off, the stars are kept, and the first question can be asked again */
    await key('ArrowLeft'); await key('Space'); await wait(1600); await settle(); await shot('d0_again');
    console.log('again: scene', await h.scene(), 'at', Math.round(await hall('heroX')), 'settled', await g('settled'), 'slips', await g('slips'), 'next', await p.evaluate(() => __game.kits.gallery.next()), JSON.stringify((await state()).close));
    await at(askers[0].home); await key('Space'); await wait(300); await settle('asks again'); console.log('in hand', await g('hold'));
  }
  const st = await state();
  console.log('gallery', mode || 'clean', 'close', JSON.stringify(st.close), 'slips', (st.review || {}).slips, 'stars', st.stars, 'finished', JSON.stringify(st.finished));
  await h.done(outDir + '/said.txt');
})();
