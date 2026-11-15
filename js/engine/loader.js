/* Scripts are fetched when they are needed, not all at the start. The page loads the engine and
   the world. A stage's hall, its stations, the maths under them and the cell system of the
   current project arrive when the player walks in (see js/scenarios.js for what each needs). */
(function () {
'use strict';
const done = {}, waiting = {};
/* a page may also carry any of these files as plain script tags (a single-folder bundle, a preview):
   a file that is already on the page is not fetched again */
const here = f => done[f] || (done[f] = !!document.querySelector('script[src="js/' + f + '"]'));
const url = f => 'js/' + f + (G.VERSION && /^http/.test(location.protocol) ? '?v=' + G.VERSION : '');
/* fetch scripts side by side and run them in the order given; a promise for all of them */
G.load = function (files) {
  return Promise.all(files.map(f => {
    if (here(f)) return null;
    if (!waiting[f]) waiting[f] = new Promise((ok, bad) => {
      const s = document.createElement('script');
      s.src = url(f); s.async = false;
      /* the handlers are let go once they have fired, so a loaded script holds on to nothing */
      s.onload = () => { s.onload = s.onerror = null; done[f] = true; delete waiting[f]; ok(); };
      s.onerror = () => { s.onload = s.onerror = null; delete waiting[f]; s.remove(); bad(new Error('could not load ' + f)); };
      document.head.appendChild(s);
    });
    return waiting[f];
  }));
};
const have = files => files.every(here);
/* the stage a scene belongs to */
const stageOf = name => Object.keys(G.STAGES).find(id => G.STAGES[id].scenes[name]);
const system = () => { const sc = G.scenario(); return sc ? ['systems/' + sc.system + '.js'] : []; };
/* a stage can need more of a cell system than the first stages do: its pack, js/systems/<system>.<pack>.js */
const pack = st => { const sc = G.scenario(); return st && st.pack && sc ? ['systems/' + sc.system + '.' + st.pack + '.js'] : []; };
const use = () => { const sc = G.scenario(); if (sc && G.systems && G.systems[sc.system]) G.sys = G.systems[sc.system]; };

/* what must be in before a scene can start: null if nothing is missing, or a promise */
G.ready = function (name, args) {
  let files = system();
  if (name === 'corridor') {
    const st = G.STAGES[{ g: 'make', 2: 'map', 3: 'who', 4: 'runs' }[args.floor] || args.floor || G.state.floor] || G.STAGES.make;
    files = files.concat(pack(st), st.hall);
    const rest = Object.keys(st.scenes).map(k => st.scenes[k]);
    /* the stations of the stage follow while the player is still in the hall */
    const then = () => { use(); G.load(rest).catch(() => {}); };
    if (have(files)) { then(); return null; }
    return G.load(files).then(then);
  }
  const id = stageOf(name);
  if (id) files = files.concat(pack(G.STAGES[id]), G.STAGES[id].hall, [G.STAGES[id].scenes[name]]);
  if (have(files)) { use(); return null; }
  return G.load(files).then(use);
};
G.loaded = () => Object.keys(done).filter(f => done[f]);
})();
