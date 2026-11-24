// Play statistics (js/engine/stats.js) and the request sheet (js/world/requests.js).
//   node tests/stats.js <http address of index.html> <out>      (the runner gives both)
// 1  In a test nothing is fetched from PostHog and nothing is sent: events are only written down. A new player
//    prints a badge with a name, takes a project, ticks the request sheet, plays into a station: each is one event,
//    with the project and the progress so far, and the name on the badge is in none of them.
// 2  The sheet by taps, on a phone.
// 3  The way events really leave: over http, with the counter switched on for this address and every request to
//    PostHog caught before it leaves the machine. The real library is used where it is installed
//    (tests/node_modules, or POSTHOG_SDK=<path to array.js>); a stand-in otherwise. It must start without a
//    cookie and without anything kept in the browser, and send what the game counted.
const { chromium, devices } = require('playwright'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const INDEX = path.resolve(__dirname, '..', 'index.html'), NAME = 'ZQXJWV';
(async () => {
  const [,, address, outDir] = process.argv, b = await chromium.launch(), errs = [];
  const watch = p => { p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); }); };
  const tools = p => {
    const wait = ms => p.waitForTimeout(ms), key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await wait(130); } };
    const log = () => p.evaluate(() => __game.track.log.map(e => ({ name: e.name, props: e.props })));
    const names = async () => (await log()).map(e => e.name);
    const last = async name => (await log()).filter(e => e.name === name).pop() || null;
    const settle = async () => { for (let i = 0; i < 30 && await p.evaluate(() => __game.scenes.corridor.dbg.busy()); i++) { await key('Space'); await wait(120); } };
    const shot = n => p.locator('#screen').screenshot({ path: `${outDir}/${n}.png` });
    /* a point of the game's 320 by 180 screen, as a point of the page */
    const at = async (x, y) => { const r = await p.locator('#screen').boundingBox(); return [r.x + x * r.width / 320, r.y + y * r.height / 180]; };
    return { wait, key, log, names, last, settle, shot, at };
  };

  // ---------- 1: a new player, by keyboard, nothing sent ----------
  {
    const ctx = await b.newContext({ viewport: { width: 1400, height: 820 } }), p = await ctx.newPage(), t = tools(p), out = [];
    watch(p); p.on('request', r => { if (/posthog/i.test(r.url())) out.push(r.url()); });
    await p.addInitScript(() => { window.__opened = 0; window.open = () => { window.__opened++; return null; }; });
    await p.goto('file://' + INDEX + '?debug'); await t.wait(2600);
    console.log('in a test: counter', await p.evaluate(() => __game.track.state()), '| sheet offered', await p.evaluate(() => __game.track.on()), '| library on the page', await p.evaluate(() => typeof window.posthog));
    await t.key('Space'); await t.wait(2800); await t.settle();
    /* a name of one's own, from the badge printer by the lift */
    await p.evaluate(() => { const d = __game.scenes.corridor.dbg; d.at(d.items().find(i => i[0] === 'badge')[1]); }); await t.wait(300); await t.key('Space'); await t.wait(900);
    await p.keyboard.type(NAME, { delay: 60 }); await t.key('Enter'); await t.wait(2600); await t.settle();
    await p.evaluate(() => __game.scenes.corridor.dbg.at(226)); await t.wait(300); await t.key('Space'); await t.wait(400); await t.key('Space'); await t.wait(900);
    for (let i = 0; i < 8 && await p.evaluate(() => __game.scene()) !== 'campus'; i++) { await t.key('Space'); await t.wait(400); }
    await t.wait(900);
    console.log('signed in as', await p.evaluate(() => __game.you()), '| events so far:', (await t.names()).join(' '));
    console.log('game_start', JSON.stringify((await t.last('game_start')).props), '| project_chosen', JSON.stringify((await t.last('project_chosen')).props));
    /* the first minute, step by step: Vera's first words, a badge printed by choice, a label read, a project taken */
    const si = await t.last('badge_printed'), pr = await t.last('parcel_read'), order = (await t.names()).filter(n => ['game_start', 'badge_printed', 'arrivals_briefed', 'parcel_read', 'project_chosen'].indexOf(n) >= 0);
    console.log('the first minute:', order.join(' > '), '| badge_printed', si ? JSON.stringify({ seconds: typeof si.props.seconds, named: si.props.named }) : 'MISSING', '| parcel_read', pr ? pr.props.parcel : 'MISSING');

    /* the request board on the map: the sheet, by keyboard */
    const nodes = await p.evaluate(() => __game.scenes.campus.dbg.nodes()), board = nodes.findIndex(n => n.kind === 'board'), make = nodes.findIndex(n => n.id === 'make');
    const sheet = fn => p.evaluate(f => { const s = __game.scenes.campus.dbg.sheet(); return s ? s[f]() : null; }, fn);
    await p.evaluate(i => __game.scenes.campus.dbg.enter(i), board); await t.wait(400); await t.shot('1_sheet');
    console.log('sheet up', !!(await sheet('rows')), '| marker starts on', await sheet('marker'));
    await t.key('Space'); await t.key('ArrowDown'); await t.key('Space'); await t.key('ArrowRight'); await t.key('Space'); await t.key('Space'); await t.wait(200); await t.shot('1_sheet_ticked');
    const picks = (await t.log()).filter(e => e.name === 'request_picked').map(e => e.props.choice + ' (' + e.props.kind + ', from ' + e.props.from + ')');
    console.log('ticked by keyboard:', picks.join('; '), '| a second press on a ticked row counted again:', picks.length !== 3);
    await t.key('ArrowDown', 6); console.log('marker after going down:', await sheet('marker')); await t.key('ArrowLeft'); console.log('and left:', await sheet('marker'));
    await t.key('ArrowRight'); await t.key('Space'); await t.wait(400);
    console.log('DONE puts it away:', !(await sheet('rows')), '| kept in the profile:', Object.keys(await p.evaluate(() => __game.profile.asked)).join(', '));
    await p.evaluate(i => __game.scenes.campus.dbg.enter(i), board); await t.wait(400);
    console.log('ticks still there on the next visit:', (await sheet('rows')).flat().filter(r => r.ticked).length);
    await t.key('ArrowDown', 6); await t.key('ArrowLeft'); await t.key('Space'); await t.wait(400);
    console.log('SOMETHING ELSE: windows opened', await p.evaluate(() => window.__opened), '| event', (await t.last('request_github')) ? 'request_github from ' + (await t.last('request_github')).props.from : 'MISSING', '| sheet away', !(await sheet('rows')));
    await p.evaluate(i => __game.scenes.campus.dbg.enter(i), board); await t.wait(300); await t.key('Escape'); await t.wait(300); console.log('Esc puts it away:', !(await sheet('rows')));

    /* into the first stage, and a station: started, finished, left, a step given to Tomo, the stage finished */
    await p.evaluate(i => __game.scenes.campus.dbg.enter(i), make); await t.wait(2500); await t.settle();
    console.log('stage_entered', JSON.stringify(((await t.last('stage_entered')) || {}).props && (await t.last('stage_entered')).props.stage));
    await p.evaluate(() => __game.go('droplets', {})); await t.wait(2000);
    console.log('station_started', JSON.stringify((({ room, stage, again }) => ({ room, stage, again }))((await t.last('station_started')).props)));
    await p.evaluate(() => { const G = __game; G.state.rooms.droplets = { done: true, stars: 2 }; G.state.tries.droplets = 3; G.save(); G.save(); });
    const fin = (await t.log()).filter(e => e.name === 'station_finished');
    console.log('station_finished x' + fin.length, JSON.stringify((({ room, stage, stars, first, tries, seconds }) => ({ room, stage, stars, first, tries, seconds: typeof seconds }))(fin[0].props)), '| rooms_done with it', fin[0].props.rooms_done);
    const tr = (await t.log()).filter(e => e.name === 'station_try');
    console.log('station_try x' + tr.length, JSON.stringify((({ room, stage, tries, seconds }) => ({ room, stage, tries, seconds: typeof seconds }))((tr[0] || { props: {} }).props)));
    await p.evaluate(() => __game.go('corridor', { from: 'droplets' })); await t.wait(1500); await t.settle();
    console.log('left after finishing: station_left sent', (await t.names()).indexOf('station_left') >= 0);
    await p.evaluate(() => __game.go('cliff', {})); await t.wait(2000);
    /* the code tabs of the station, and the Copy button under the methods */
    const tabs = p.locator('#term-langs [data-lang]'), nt = await tabs.count();
    if (nt) { await tabs.nth(nt - 1).click(); await t.wait(150); const ev = await t.last('code_tab_opened'); console.log('code_tab_opened (' + nt + ' tabs)', ev ? JSON.stringify((({ room, tool, tool_id }) => ({ room, tool, tool_id }))(ev.props)) : 'MISSING'); } else console.log('code_tab_opened: NO TABS IN THIS STATION');
    await p.evaluate(() => document.getElementById('btn-copy').click()); await t.wait(150); console.log('methods_copied', !!(await t.last('methods_copied')));
    await p.evaluate(() => __game.go('corridor', { from: 'cliff' })); await t.wait(1500); await t.settle();
    const left = await t.last('station_left'); console.log('left without finishing:', left ? JSON.stringify((({ room, stage, seconds, again }) => ({ room, stage, seconds: typeof seconds, again }))(left.props)) : 'MISSING');
    await p.evaluate(() => { __game.hall.summon(['cliff', 'qc']); __game.save(); });
    console.log('tomo_asked', JSON.stringify(((await t.last('tomo_asked')) || { props: {} }).props.steps), '| counted as finished by the player:', (await t.log()).filter(e => e.name === 'station_finished').length !== 1);
    await p.evaluate(() => { const G = __game; ['soup', 'doublet', 'review'].forEach(r => { G.state.rooms[r] = { done: true, stars: 3 }; }); G.save(); G.save(); });
    const sf = (await t.log()).filter(e => e.name === 'stage_finished');
    console.log('stage_finished x' + sf.length, JSON.stringify((({ stage, stage_stars, stage_max, tomo_steps }) => ({ stage, stage_stars, stage_max, tomo_steps }))(sf[0].props)));
    /* the other project keeps its own count: taking it is one event, and its rooms are not "newly done" */
    const before = (await t.log()).length;
    await p.evaluate(() => { __game.setScenario('cortex'); });
    const after = (await t.log()).slice(before).map(e => e.name);
    console.log('another parcel:', after.join(' ') || 'nothing', '| from', ((await t.last('project_chosen')) || { props: {} }).props.from);

    const all = await t.log(), text = JSON.stringify(all), need = ['project', 'rooms_done', 'stars', 'touch', 'game_version'];
    console.log('events', all.length, '| every one carries', need.join(', ') + ':', all.every(e => need.every(k => k in e.props)));
    console.log('the name in any event:', text.indexOf(NAME) >= 0, '| requests to PostHog:', out.length, '| cookies:', (await ctx.cookies()).length,
      '| kept in the browser beside the save:', (await p.evaluate(() => Object.keys(localStorage).filter(k => !/^cyteseeing/.test(k)).join(',') || 'nothing')));
    await ctx.close();
  }

  // ---------- 2: the sheet by taps, on a phone, from the slip in arrivals ----------
  {
    const ctx = await b.newContext(devices['iPhone 13']), p = await ctx.newPage(), t = tools(p);
    watch(p);
    await ctx.addInitScript(() => { if (!localStorage.getItem('cyteseeing-profile-v1')) localStorage.setItem('cyteseeing-profile-v1', JSON.stringify({ name: 'ARI', scenario: 'cortex', sound: false, metVera: true })); });
    await p.goto('file://' + INDEX + '?debug'); await t.wait(1500);
    await p.locator('#screen').tap(); await t.wait(2500);
    await p.evaluate(() => __game.go('corridor', { floor: 'bay', from: 'lift' })); await t.wait(1500); await t.settle();
    const slip = await p.evaluate(() => __game.scenes.corridor.dbg.items().find(i => i[0] === 'slip')[1]);
    await p.evaluate(x => __game.scenes.corridor.dbg.at(x), slip); await t.wait(400); await t.key('Space'); await t.wait(400); await t.shot('2_phone_sheet');
    const sheet = fn => p.evaluate(f => { const s = __game.scenes.corridor.dbg.sheet(); return s ? s[f]() : null; }, fn);
    const rows = (await sheet('rows')).flat(), tap = async pt => { const [x, y] = await t.at(pt[0], pt[1]); await p.touchscreen.tap(x, y); await t.wait(250); };
    await tap(rows.find(r => r.id === 'gut').at); await tap(rows.find(r => r.id === 'spatial').at); await tap(rows.find(r => r.id === 'gut').at); await t.shot('2_phone_ticked');
    console.log('phone: ticked by taps:', (await t.log()).filter(e => e.name === 'request_picked').map(e => e.props.choice + ' (from ' + e.props.from + ', touch ' + e.props.touch + ')').join('; '));
    await tap((await sheet('buttons'))[1]); await t.wait(300);
    console.log('phone: DONE by tap puts it away:', !(await sheet('rows')), '| the slip counts as found:', await p.evaluate(() => !!(__game.state.eggs || {}).slip));
    await ctx.close();
  }

  // ---------- 3: the real way out, with PostHog caught at the door ----------
  if (/^https?:/.test(address || '')) {
    let sdk = process.env.POSTHOG_SDK || null;
    if (!sdk) { try { sdk = require.resolve('posthog-js/dist/array.js'); } catch (e) { sdk = null; } }
    const real = !!(sdk && fs.existsSync(sdk));
    /* what stands in for the library where it is not installed: it starts, and posts what it is given */
    const standIn = 'window.posthog={init:function(k,o){this.k=k;this.config=o},capture:function(n,p){fetch(this.config.api_host+"/e/",{method:"POST",body:JSON.stringify({event:n,properties:p,api_key:this.k,distinct_id:"stand-in"})}).catch(function(){})}};';
    const ctx = await b.newContext({ viewport: { width: 1400, height: 820 } }), sent = [], asked = [];
    /* the library will not count a browser that is driven by a script, as this one is: told here to count it all the same */
    await ctx.addInitScript(host => { window.CYTESEEING_STATS = { sites: [host], force: true, options: { opt_out_useragent_filter: true } }; }, new URL(address).hostname);
    await ctx.route(/posthog\.com/, async route => {
      const rq = route.request(), u = rq.url(); asked.push(u.split('?')[0]);
      if (/\/static\/array\.js/.test(u)) return route.fulfill({ status: 200, contentType: 'application/javascript', headers: { 'access-control-allow-origin': '*' }, body: real ? fs.readFileSync(sdk, 'utf8') : standIn });
      if (rq.method() === 'POST') {
        let buf = rq.postDataBuffer() || Buffer.alloc(0), body;
        try { if (/compression=gzip/.test(u) || (buf[0] === 0x1f && buf[1] === 0x8b)) buf = zlib.gunzipSync(buf); body = JSON.parse(buf.toString('utf8')); } catch (e) { body = null; }
        (Array.isArray(body) ? body : body && body.batch ? body.batch : body ? [body] : []).forEach(e => sent.push(e));
      }
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-credentials': 'true' }, body: '{"status":1}' });
    });
    const p = await ctx.newPage(), t = tools(p); watch(p);
    await p.goto(address + '?debug'); await t.wait(4000);
    console.log('switched on: library', real ? 'real' : 'stand-in', '| counter', await p.evaluate(() => __game.track.state()), '| fetched', asked.filter(u => /array\.js/.test(u)).join(' ') || 'NOTHING');
    const cfg = await p.evaluate(() => { const c = (window.posthog && window.posthog.config) || {}; return { api_host: c.api_host, cookieless_mode: c.cookieless_mode, autocapture: c.autocapture, disable_session_recording: c.disable_session_recording, capture_pageview: c.capture_pageview, respect_dnt: c.respect_dnt }; });
    console.log('started with', JSON.stringify(cfg));
    await t.key('Space'); await t.wait(2800); await t.settle();
    /* a name of one's own, from the badge printer by the lift */
    await p.evaluate(() => { const d = __game.scenes.corridor.dbg; d.at(d.items().find(i => i[0] === 'badge')[1]); }); await t.wait(300); await t.key('Space'); await t.wait(900);
    await p.keyboard.type(NAME, { delay: 60 }); await t.key('Enter'); await t.wait(2600); await t.settle();
    await p.evaluate(() => __game.scenes.corridor.dbg.at(226)); await t.wait(300); await t.key('Space'); await t.wait(400); await t.key('Space'); await t.wait(900);
    for (let i = 0; i < 8 && await p.evaluate(() => __game.scene()) !== 'campus'; i++) { await t.key('Space'); await t.wait(400); }
    await t.wait(4500);   // the library sends in batches
    const names = sent.map(e => e.event), ids = sent.map(e => e.distinct_id || (e.properties || {}).distinct_id).filter((v, i, a) => a.indexOf(v) === i);
    console.log('sent:', names.filter((v, i, a) => a.indexOf(v) === i).join(' '), '| to', asked.filter(u => !/array\.js/.test(u)).filter((v, i, a) => a.indexOf(v) === i).join(' '));
    console.log('game events that left:', ['game_start', 'project_chosen'].filter(n => names.indexOf(n) >= 0).join(' ') || 'NONE', '| who they say it is:', ids.join(', '));
    const gs = sent.find(e => e.event === 'game_start');
    if (gs) console.log('what goes with game_start:', Object.keys(gs.properties || {}).sort().join(' '));
    const store = await p.evaluate(() => Object.keys(localStorage).filter(k => !/^cyteseeing/.test(k)).concat(Object.keys(sessionStorage)).join(',') || 'nothing');
    console.log('cookies set:', (await ctx.cookies()).length, '| kept in the browser beside the save:', store, '| the name in anything sent:', JSON.stringify(sent).indexOf(NAME) >= 0, '| other scripts fetched from PostHog:', asked.filter(u => /\.js$/.test(u) && !/array\.js/.test(u)).length);
    console.log('the page says that it counts:', await p.evaluate(() => !document.getElementById('nb-stats').hidden));
    await ctx.close();
  } else console.log('no http address given: the way out was not tested');

  // ---------- 4: a copy with no key counts nothing, and its request board leads to GitHub as before ----------
  {
    const ctx = await b.newContext({ viewport: { width: 1400, height: 820 } }), p = await ctx.newPage(), t = tools(p);
    watch(p);
    await ctx.addInitScript(() => { window.CYTESEEING_STATS = { key: '' }; window.__opened = 0; window.open = () => { window.__opened++; return null; };
      if (!localStorage.getItem('cyteseeing-profile-v1')) localStorage.setItem('cyteseeing-profile-v1', JSON.stringify({ name: 'ARI', scenario: 'response', sound: false, metVera: true })); });
    await p.goto('file://' + INDEX + '?debug'); await t.wait(1500); await t.key('Space'); await t.wait(2500); await t.settle();
    await p.evaluate(() => __game.go('campus', {})); await t.wait(1500);
    const board = (await p.evaluate(() => __game.scenes.campus.dbg.nodes())).findIndex(n => n.kind === 'board');
    await p.evaluate(i => __game.scenes.campus.dbg.enter(i), board); await t.wait(400); await t.shot('4_no_key');
    const busy = await p.evaluate(() => __game.scenes.campus.dbg.busy()), sheet = await p.evaluate(() => !!__game.scenes.campus.dbg.sheet());
    await t.key('Space'); await t.wait(400);
    console.log('no key: sheet offered', await p.evaluate(() => __game.track.on()), '| the board asks', busy && !sheet ? 'the question about GitHub' : 'SOMETHING ELSE', '| windows opened', await p.evaluate(() => window.__opened),
      '| request events', (await t.names()).filter(n => /^request/.test(n)).length, '| the page says that it counts:', await p.evaluate(() => !document.getElementById('nb-stats').hidden));
    await ctx.close();
  }

  console.log('ERRORS', JSON.stringify(errs.slice(0, 8), null, 1)); await b.close();
})();
