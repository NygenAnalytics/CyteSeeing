// Not a test: makes preview.png, the picture shown when a link to the game is shared (og:image in index.html).
// A real screen, the label of the blood parcel in arrivals, drawn by the game at three screen pixels to one and
// set on a 1200 by 630 card under the game's name, in its own fonts.
//   node tests/card.js "$PWD/index.html" preview.png
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [,, index, out] = process.argv, root = path.dirname(index);
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 });
  await p.goto('file://' + index + '?debug'); await p.waitForTimeout(1500);
  const wait = ms => p.waitForTimeout(ms), key = async k => { await p.keyboard.press(k); await wait(160); };
  const hall = (fn, a) => p.evaluate(([f, x]) => __game.scenes.corridor.dbg[f](x), [fn, a]);
  await key('Space'); await wait(3000);
  for (let i = 0; i < 12 && await hall('busy'); i++) { await key('Space'); await wait(200); }
  const parcel = (await hall('items')).find(i => i[0] === 'response')[1];
  await hall('at', parcel); await wait(500); await key('Space'); await wait(900);
  if (!(await hall('asking'))) throw new Error('the label of the parcel did not come up');
  const shot = await p.evaluate(() => { const G = __game; G.setScale(3); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(G.cv.toDataURL('image/png'))))); });
  const card = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await card.goto('file://' + index.replace(/index\.html$/, 'LICENSE'));   // a page of the same folder, so that the fonts may be read from it
  await card.setContent('<!doctype html><meta charset="utf-8"><style>' +
    'html, body { margin: 0; width: 1200px; height: 630px; background: #070b16; overflow: hidden; }' +
    '.top { position: absolute; left: 120px; right: 120px; top: 15px; display: flex; align-items: baseline; justify-content: space-between; }' +
    '.name { font: 700 30px Silkscreen; letter-spacing: .12em; color: #4fd6e8; }' +
    '.tag { font: 400 15px Silkscreen; letter-spacing: .08em; color: #93a4c8; }' +
    'img { position: absolute; left: 118px; top: 58px; width: 960px; height: 540px; border: 2px solid #2a3966; image-rendering: pixelated; }' +
    '</style><div class="top"><span class="name">CYTESEEING</span><span class="tag">A SINGLE-CELL ANALYSIS ADVENTURE</span></div><img alt="" src="' + shot + '">');
  await card.addScriptTag({ path: path.join(root, 'js/engine/fonts.js') });
  await card.evaluate(() => Promise.all(window.GAME_FONTS.map(f => { const face = new FontFace(f.family, f.src, { weight: f.weight }); document.fonts.add(face); return face.load(); })).then(() => document.fonts.ready));
  await card.waitForTimeout(300);
  await card.screenshot({ path: out, type: 'png' });
  console.log('written', out);
  await b.close();
})();
