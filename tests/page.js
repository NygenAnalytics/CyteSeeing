// The page around the game, served over http as the live site serves it.
// Its head: the address it is known by, the tab icon, and the tags that make a link to it show a picture. And that
// picture: in the repository at the size the tags say, served, and named in the Pages workflow that copies the site.
// The game itself asks no other site for anything.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const url = process.argv[2], root = path.resolve(__dirname, '..');
  const b = await chromium.launch(), errs = [], away = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }), p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  /* nothing leaves the machine: whatever is asked of another site is written down and refused */
  await ctx.route(u => u.hostname !== '127.0.0.1', r => { away.push(r.request().url()); r.abort(); });
  await p.goto(url + '?debug'); await p.waitForTimeout(1500);
  const head = await p.evaluate(() => { const o = {}; document.querySelectorAll('head meta[property], head meta[name]').forEach(m => { o[m.getAttribute('property') || m.getAttribute('name')] = m.content; });
    return { tags: o, canonical: (document.querySelector('link[rel=canonical]') || {}).href, icons: [...document.querySelectorAll('link[rel=icon]')].map(l => l.href + ' ' + (l.sizes.value || l.type)) }; });
  const t = head.tags, png = fs.readFileSync(path.join(root, 'preview.png')), w = png.readUInt32BE(16), h = png.readUInt32BE(20);
  console.log('canonical', head.canonical, '| og:url', t['og:url'], '| type', t['og:type'], '| site', t['og:site_name']);
  console.log('og:title', JSON.stringify(t['og:title']), '| description reused', t['og:description'] === t.description && t.description.length > 40);
  console.log('og:image', t['og:image'], t['og:image:type'], t['og:image:width'] + 'x' + t['og:image:height'], '| alt', (t['og:image:alt'] || '').length > 40);
  console.log('preview.png in the repository', w + 'x' + h, '| as the tags say', String(w) === t['og:image:width'] && String(h) === t['og:image:height'], '| a PNG', png.slice(1, 4).toString() === 'PNG', '| bytes under a megabyte', png.length < 1e6);
  console.log('twitter', t['twitter:card'], t['twitter:site']);
  console.log('icons', head.icons.join(' ; '));
  const served = await p.evaluate(async () => { const r = await fetch('preview.png'); return r.status + ' ' + (await r.arrayBuffer()).byteLength; });
  const yml = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
  console.log('preview.png served', served.split(' ')[0], '| same bytes', Number(served.split(' ')[1]) === png.length, '| in the Pages workflow: watched', /-\s*"preview\.png"/.test(yml), 'copied', /cp -r [^\n]*\bpreview\.png\b/.test(yml));
  /* into the game and one stage, so that everything a new player's page loads has been asked for */
  await p.keyboard.press('Space'); await p.waitForTimeout(2500);
  await p.evaluate(() => { __game.setScenario('response'); __game.go('droplets', {}); }); await p.waitForTimeout(1500);
  console.log('scene', await p.evaluate(() => __game.scene()), '| asked of other sites', away.length, away.slice(0, 3).join(' '));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 6)));
  await b.close();
})();
