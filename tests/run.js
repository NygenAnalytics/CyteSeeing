// Runs the test scripts and says which passed.
//   node tests/run.js quick          the maths, a new player's first minutes, loading over http, switching projects, saves of older versions
//   node tests/run.js full           the above, then every stage by keyboard and by touch for both projects, memory and fuzz
//   node tests/run.js stage3 touch4  any tests by name
// Each script plays the game in a headless browser (Playwright) through the hooks the game offers when the
// page address ends in ?debug. Screenshots and transcripts go to tests/out/.
const { spawn } = require('child_process'), http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), INDEX = path.join(ROOT, 'index.html'), OUT = path.join(__dirname, 'out');
const PORT = Number(process.env.PORT) || 8765, URL ='http://127.0.0.1:' + PORT + '/index.html';
const ALL3 = /"cut:3","lineup:3","name:3","oracle:3","chief:3"/, ALL4 = /rooms \[(\{"done":true,"stars":3\},?){4}\]/, ALL5 = /rooms \[(\{"done":true,"stars":3\},?){5}\]/, ONE5 = /rooms \[(\{"done":true,"stars":1\},?){5}\]/;

// name, script, arguments after the page, project, what the output must hold, and a time limit in seconds
const T = (name, script, o) => Object.assign({ name, script, args: [], want: [], limit: 300 }, o);
const both = (name, script, o) => ['response', 'cortex'].map(p => T(name + ':' + p, script, Object.assign({ project: p }, o)));
const QUICK = [
  T('maths', 'maths.js', { plain: true, want: [/MATHS OK/], limit: 120 }),
  T('smoke', 'smoke.js', { want: [/scene: corridor floor make/] }),
  T('http', 'http.js', { url: true, want: [/200 systems\//, /scene pca/], not: [/ 404 /] }),
  T('projects', 'projects.js', { want: [/back on cortex stars \d+\/\d+ droplets done\? true/] }),
  T('oldsave:response', 'oldsave.js', { project: 'response', want: [/loaded \{"rooms":32,.*"stars":"42\/81"/, /station scales play heaps 12/, /saved \{"droplets":\{"done":true,"stars":1\}/] }),
  T('oldsave:cortex', 'oldsave.js', { project: 'cortex', want: [/loaded \{"rooms":32,.*"stars":"42\/81"/, /station turntable play roads 3/, /saved \{"droplets":\{"done":true,"stars":1\}/] }),
  /* play statistics: written down and never sent in a test, the name in none of them, the request sheet by keyboard and
     by touch, and the way events really leave, with every request to PostHog caught before it goes */
  T('stats', 'stats.js', { url: true, limit: 240, not: [/MISSING/], want: [/in a test: counter off \| sheet offered true \| library on the page undefined/,
    /ticked by keyboard: tumour \(tissue, from board\); bone marrow \(tissue, from board\); chromatin \(data, from board\) \| a second press on a ticked row counted again: false/,
    /the first minute: game_start > arrivals_briefed > badge_printed > parcel_read > project_chosen \| badge_printed \{"seconds":"number","named":true\} \| parcel_read response/,
    /station_finished x1 .*"first":true,"tries":3/, /station_try x1 \{"room":"droplets","stage":"make","tries":3,"seconds":"number"\}/, /left after finishing: station_left sent false/, /tomo_asked 2 \| counted as finished by the player: false/, /stage_finished x1 /,
    /another parcel: project_chosen \| from response/, /every one carries project, rooms_done, stars, touch, game_version: true/,
    /the name in any event: false \| requests to PostHog: 0 \| cookies: 0 \| kept in the browser beside the save: nothing/,
    /phone: ticked by taps: gut \(from arrivals, touch true\); spatial \(from arrivals, touch true\)/, /phone: DONE by tap puts it away: true \| the slip counts as found: true/,
    /switched on: library (real|stand-in) \| counter on/, /started with \{"api_host":"https:\/\/eu\.i\.posthog\.com","cookieless_mode":"always","autocapture":false,"disable_session_recording":true/,
    /game events that left: game_start project_chosen \| who they say it is: (\$posthog_cookieless|stand-in)$/m,
    /cookies set: 0 \| kept in the browser beside the save: nothing \| the name in anything sent: false \| other scripts fetched from PostHog: 0/, /the page says that it counts: true$/m,
    /no key: sheet offered false \| the board asks the question about GitHub \| windows opened 1 \| request events 0 \| the page says that it counts: false/] }),
  /* an upright phone with the game turned on its side: the size, the pads, where a tap lands, and the way back */
  T('turn', 'turn.js', { limit: 200, not: [/turned false \| screen \d+ x \d+ \(/, /label up false/, /inside the window false/, /page scrolls true/],
    want: [/iphone turned true \| screen 533 x 300 .* pads at both ends, 48 px across \| pads inside the window true/, /pixel turned true \| screen 610 x 343 .* pads at both ends, 64 px across/,
      /iphone a tap on TAKE THIS PROJECT: response \| scene campus/, /pixel pad, right arrow: on the map from plot 1 to 2/,
      /iphone phone turned for real: turned false screen 533 x 300 \| upright again: turned true screen 533 x 300/, /pixel UPRIGHT: turned false \| screen 366 x 206 \| kept in the profile false \| events true,false/] }),
  /* and a save of version 8, with five stages done and nothing in it about the ending */
].concat(both('oldsave-v8', 'oldsave.js', { args: ['v8'], want: [/loaded \{"rooms":32,"close":\{"done":false,"stars":0\},"tries":0,"review":null,"finished":\{\},"stars":"50\/81"/, /soon:\S+( \S+)* stage:gallery$/m,
  /gallery frames 26 complete true/, /settled 1 lectern: VERA: The floor comes first\. 1 of the 5/, /saved \{"droplets":\{"done":true,"stars":2\},"hvg":\{"done":true,"stars":0,"by":"student"\},"close":\{"done":false,"stars":0\}/] }));
const FULL = QUICK.concat(
  both('stage1', 'stage1.js', { want: [/droplets:3 cliff:3 qc:3 soup:3 doublet:3 review:2/] }),
  both('stage2', 'stage2.js', { want: [/norm:2 hvg:3 pca:3 knn:1 umap:2 club:3/] }),
  both('stage3', 'stage3.js', { args: ['clean'], want: [ALL3] }),
  both('stage3-slips', 'stage3.js', { args: ['slips'], want: [/"chief:3"/] }),
  both('stage4', 'stage4.js', { args: ['clean'], want: [ALL4] }),
  [T('touch-start', 'touch-start.js', { want: [/pixel scene corridor stage make met true/] }),
    T('touch1', 'touch1.js', { want: [/18\/81/], limit: 420 }),
    T('touch2', 'touch2.js', { want: [/norm:3 hvg:3 pca:3/], limit: 420 })],
  both('touch3', 'touch3.js', { want: [ALL3], limit: 420 }),
  both('touch4', 'touch4.js', { want: [/pixel rooms \[3,3,3,3\]/], limit: 520 }),
  /* stage 5 is where the projects part ways: each has a fifth stage of its own, with its own scripts */
  [T('stage5:response', 'stage5.js', { project: 'response', args: ['clean'], want: [ALL5] }),
    T('stage5:cortex', 'stage5-cortex.js', { project: 'cortex', args: ['clean'], want: [ALL5] }),
    T('stage5-slips:response', 'stage5.js', { project: 'response', args: ['slips'], want: [ONE5], limit: 420 }),
    T('stage5-slips:cortex', 'stage5-cortex.js', { project: 'cortex', args: ['slips'], want: [ONE5], limit: 420 }),
    T('touch5:response', 'touch5.js', { project: 'response', want: [/pixel rooms \[3,3,3,3,3\]/], limit: 520 }),
    T('touch5:cortex', 'touch5-cortex.js', { project: 'cortex', want: [/pixel rooms \[3,3,3,3,3\]/], limit: 520 })],
  /* the end of each project, the Long Gallery, from a save with every stage done (done.js): by keyboard without a slip and with
     every kind of slip, for a player whose wall is not full, and by touch */
  both('gallery', 'gallery.js', { args: ['clean'], want: [/name tags that touch 0/, /plates checked 26 too long 0/, /hall lines checked \d+ do not fit 0/, /close lines checked \d+ do not fit 0 .* fits/, /gallery clean close \{"done":true,"stars":3\} slips 0 stars 81\/81/] }),
  both('gallery-slips', 'gallery.js', { args: ['slips'], want: [/close end stars 1 slips 2\d/, /again: scene corridor at 44 settled 0 slips 0 next q0 \{"done":true,"stars":1\}/], limit: 420 }),
  both('gallery-hung', 'gallery.js', { args: ['hung'], want: [/hung: complete false floor gallery frames 26 lent 21/, /plates checked 26 too long 0/, /full: complete true/, /settled 1 slips 0/, /gallery hung close \{"done":true,"stars":3\} slips 0 stars 13\/81 finished \{"\w+":\{"stars":13,"max":81,"lent":21\}\}/] }),
  both('gallery-touch', 'touch-gallery.js', { want: [/pixel close 3 slips 0/], limit: 520 }),
  [T('soak', 'soak.js', { args: ['8'], noOut: true, check: flat }),
    T('fuzz', 'fuzz.js', { args: ['5'], noOut: true, project: 'both', not: [/clock moves false/] }),
    /* a cold start never gets as far as the end of a project, so the gallery has random input of its own */
    T('fuzz-gallery', 'fuzz-gallery.js', { args: ['7'], noOut: true, want: [/"corridor:gallery":\d+/, /"close":\d+/], not: [/clock moves false/], limit: 420 })]);

// memory: the number of page elements and listeners must not grow, and the heap must settle
function flat(out) {
  const m = /second half of the run \(MB\): (-?[\d.]+) \| nodes (\d+) -> (\d+) \| listeners (\d+) -> (\d+)/.exec(out);
  if (!m) return 'no summary line';
  if (m[2] !== m[3] || m[4] !== m[5]) return 'elements or listeners grew';
  return Number(m[1]) < 1 ? null : 'heap grew by ' + m[1] + ' MB';
}
function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript' };
  return http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (file.indexOf(ROOT) !== 0 || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
  }).listen(PORT, '127.0.0.1');
}
function run(t) {
  return new Promise(done => {
    const out = path.join(OUT, t.name.replace(/:/g, '-')); fs.mkdirSync(out, { recursive: true });
    const args = t.plain ? [] : [t.url ? URL : INDEX].concat(t.noOut ? [] : [out], t.args);
    const env = Object.assign({}, process.env, t.project ? { SCEN: t.project === 'both' ? '1' : t.project } : {});
    const p = spawn(process.execPath, [path.join(__dirname, t.script)].concat(args), { env });
    let text = ''; p.stdout.on('data', d => { text += d; }); p.stderr.on('data', d => { text += d; });
    const timer = setTimeout(() => { text += '\nTIMED OUT'; p.kill(); }, t.limit * 1000);
    p.on('close', () => {
      clearTimeout(timer); fs.writeFileSync(path.join(out, 'output.txt'), text);
      let why = /TIMED OUT/.test(text) ? 'timed out' : !t.plain && !/ERRORS \[\]/.test(text) ? 'page errors, or it did not finish' : null;
      t.want.forEach(r => { if (!why && !r.test(text)) why = 'missing ' + r; });
      (t.not || []).forEach(r => { if (!why && r.test(text)) why = 'found ' + r; });
      if (!why && t.check) why = t.check(text);
      done(why);
    });
  });
}
(async () => {
  const asked = process.argv.slice(2), names = asked.length ? asked : ['quick'];
  const list = names[0] === 'full' ? FULL : names[0] === 'quick' ? QUICK : FULL.filter(t => names.indexOf(t.name) >= 0 || names.indexOf(t.name.split(':')[0]) >= 0);
  if (!list.length) { console.log('No such test. Names: ' + FULL.map(t => t.name).join(', ')); process.exit(2); }
  const server = serve(); let failed = 0;
  for (const t of list) {
    const t0 = Date.now(); let why = await run(t);
    // the playthroughs wait fixed times, so a busy machine can make one stumble: a failure gets one more go
    if (why) why = await run(t);
    console.log((why ? 'FAIL  ' : 'pass  ') + t.name + '  (' + Math.round((Date.now() - t0) / 1000) + ' s)' + (why ? '  ' + why : ''));
    if (why) failed++;
  }
  server.close();
  console.log(failed ? failed + ' of ' + list.length + ' failed. See tests/out/<name>/output.txt.' : 'All ' + list.length + ' passed.');
  process.exit(failed ? 1 : 0);
})();
