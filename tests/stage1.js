const open = require('./lib.js');
(async () => {
  const [,, indexPath, outDir] = process.argv;
  const h = await open(indexPath, outDir), { key, wait, shot, ph, at, door, talk, until, settle, p } = h;
  await key('Space'); await wait(3600); await settle('mika'); await wait(300); await shot('a_corridor');
  await at(820); await key('Space'); await wait(400); await shot('a_locked'); await key('Space'); await wait(200);
  await door(292, 'droplets'); await wait(300); await until('droplets', 'config', 'droplets brief', true); await wait(200); await shot('d_config');
  await key('Space'); await wait(7600); await shot('d_verdict'); await talk('droplets fail'); await wait(200); await shot('d_result1');
  await key('Space'); await wait(300); await key('ArrowLeft', 9); await key('ArrowDown'); await key('ArrowRight'); await key('ArrowDown'); await key('Space'); await wait(7600); await talk('droplets pass'); await shot('d_result2'); await key('Space'); await wait(1400); await shot('a_next');
  await door(496, 'cliff'); await wait(300); await until('cliff', 'cut', 'cliff brief', true); await wait(200); await shot('c_cut'); await key('Space'); await wait(600);
  await talk('cliff cutres', true); await wait(200); await key('Space'); await wait(500); await talk('cliff test brief', true); await wait(200); await shot('c_test');
  await key('Space'); await wait(5200); await talk('cliff pass', true); await shot('c_result'); console.log('cliff', await ph('cliff')); await key('Space'); await wait(1400);
  await door(820, 'qc'); await wait(300); await until('qc', 'set', 'qc brief', true); await wait(200); await key('Space'); await wait(500); await talk('qc fail', true); await shot('q_fail');
  await key('Space'); await wait(300); await key('ArrowDown', 2); await key('ArrowRight'); await wait(200); await key('Space'); await wait(500); await talk('qc pass'); await shot('q_pass'); await key('Space'); await wait(1400);
  await door(1024, 'soup'); await wait(300); await until('soup', 'set', 'soup brief', true); await wait(200); await shot('s_set'); await key('ArrowRight', 2); await key('Space'); await wait(200); await key('Space'); await wait(500); await talk('soup pass'); await shot('s_result'); await key('Space'); await wait(1400);
  await door(1236, 'doublet'); await wait(300); await until('doublet', 'ready', 'doublet brief', true); await wait(200); await key('Space'); await wait(3400); await talk('doublet score', true); await wait(200); await shot('x_score');
  await key('ArrowRight', 5); await key('Space'); await wait(500); await talk('doublet pass'); await shot('x_result'); await key('Space'); await wait(1400); await wait(4500); await shot('a_done');
  await door(1776, 'review'); await wait(400); await until('review', 'ask', 'review intro'); await wait(500); await shot('r_ask');
  const ans = [0, 2, 1, 1, 0];
  for (let i = 0; i < 5; i++) { await wait(450); await key('ArrowDown', i === 2 ? 0 : ans[i]); await key('Space'); await wait(300); if (i === 2) await shot('r_wrong'); for (let k = 0; k < 10 && await ph('review') === 'reply'; k++) { await h.note('review reply ' + (i + 1)); await key('Space'); await wait(150); } }
  console.log('review', await ph('review')); await wait(600); await shot('r_verdict'); await h.note('review verdict'); await key('Space', 2); await wait(1500); await settle(); await wait(200); await shot('a_end');
  console.log(JSON.stringify(await p.evaluate(() => ({ scene: __game.scene(), stars: __game.totalStars() + '/' + __game.maxStars(), rooms: Object.keys(__game.state.rooms).slice(0, 6).map(k => k + ':' + __game.state.rooms[k].stars).join(' ') }))));
  await h.done(outDir + '/said_ground.txt');
})();
