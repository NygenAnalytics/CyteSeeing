/* Play statistics: which stations are played, for how long, and how far people get. They go to
   PostHog without a cookie, without anything kept in the browser, and without anything that says
   who the player is: the name typed at sign-in never leaves the page (README: Play statistics).

   Nothing is loaded and nothing is sent unless the page is served from one of the sites listed in
   `sites`. A fork, a copy in a local folder, the preview and the test suite count nothing. A
   browser that asks not to be tracked is left alone too. To count the players of your own copy, set
   window.CYTESEEING_STATS = { key, host, sites } in the page before the scripts, or edit the three
   values below.

   G.track(name, props) is the only way an event leaves the game. The engine tells this file about
   three things (G.onScene, G.onSave, G.onProject in core.js), and everything about stations and
   stages is worked out from those, so a new station is counted without a line written for it. */
(function () {
'use strict';
const CFG = Object.assign({
  /* the project's public token. It can send events and read nothing: every page that counts its visitors carries one */
  key: 'phc_vY2kmi5qsNXwSJjo2cJHtpZcKki3ceJVx4JgShth4QbV',
  host: 'https://eu.i.posthog.com',
  sites: ['docs.nygen.io'],
}, window.CYTESEEING_STATS || {});

/* with ?debug in the address (the test suite) events are written down in G.track.log and not sent */
const debug = /[?&]debug\b/.test(location.search);
const dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1';
const wanted = !!CFG.key && CFG.sites.indexOf(location.hostname) >= 0 && !dnt && (!debug || !!CFG.force);
/* idle: wanted, the script not fetched yet. loading. on. off: not wanted, or the script did not arrive (a blocker) */
let state = wanted ? 'idle' : 'off', ph = null;
const queue = [], log = [];

/* what PostHog is told to leave alone. The game is one canvas, so clicks on it say nothing, and
   nothing here needs a recording, a survey, a feature flag or a second script. */
const OPTIONS = {
  api_host: CFG.host,
  cookieless_mode: 'always',            // no cookie, nothing in localStorage: a visitor is counted for a day and cannot be followed after it
  person_profiles: 'identified_only',   // and nobody is ever identified
  respect_dnt: true,
  autocapture: false, rageclick: false, capture_dead_clicks: false, capture_heatmaps: false,
  capture_pageview: true, capture_pageleave: true,   // one page view for each visit: where people come from, and how long they stay
  capture_performance: false, capture_exceptions: false,
  disable_session_recording: true, disable_surveys: true, disable_conversations: true, disable_product_tours: true, disable_web_experiments: true,
  advanced_disable_flags: true, disable_external_dependency_loading: true,
};
/* a copy that counts for itself may set more: window.CYTESEEING_STATS = { ..., options: { ... } } */
Object.assign(OPTIONS, CFG.options || {});

/* what goes with every event: the project in hand and how far it has come */
function base() {
  const s = G.state || {}, rooms = s.rooms || {};
  let done = 0;
  for (const k in rooms) if (rooms[k].done && !rooms[k].by) done++;
  return { project: (G.profile && G.profile.scenario) || null, rooms_done: done, stars: G.totalStars ? G.totalStars() : 0, touch: !!G.touch, game_version: G.VERSION || null };
}
G.track = function (name, props) {
  try {
    const p = Object.assign(base(), props || {});
    if (debug) { log.push({ name, props: p }); if (log.length > 400) log.shift(); }
    if (state === 'off') return;
    if (ph) ph.capture(name, p); else { queue.push([name, p]); if (queue.length > 200) queue.shift(); }
  } catch (e) {}
};
/* true where a tick on the request sheet will be counted (or, in a test, written down). With no key nothing ever is */
G.track.on = () => state !== 'off' || (debug && !!CFG.key);
G.track.log = log;
G.track.state = () => state;

function load() {
  if (state !== 'idle') return;
  state = 'loading';
  const s = document.createElement('script');
  s.async = true; s.crossOrigin = 'anonymous';
  s.src = CFG.host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
  s.onerror = () => { state = 'off'; queue.length = 0; };
  s.onload = () => {
    try {
      ph = window.posthog; ph.init(CFG.key, OPTIONS);
      state = 'on'; queue.splice(0).forEach(q => ph.capture(q[0], q[1]));
    } catch (e) { state = 'off'; ph = null; queue.length = 0; }
  };
  document.head.appendChild(s);
}
/* after the game has drawn its first frames: counting never holds up the title screen. And the page says that it counts */
if (wanted) { setTimeout(load, 1500); const note = document.getElementById('nb-stats'); if (note) note.hidden = false; }

/* ---------- what the engine reports ---------- */
const now = () => (window.performance && performance.now ? performance.now() : Date.now());
const secs = t0 => Math.round((now() - t0) / 1000);
let ROOMS = null;
/* the stage a room belongs to; null for a scene that is not a station */
function stageOf(room) {
  if (!ROOMS) { ROOMS = {}; Object.keys(G.STAGES || {}).forEach(id => { const st = G.STAGES[id]; (st.rooms || []).concat(st.extra || []).forEach(r => { ROOMS[r] = id; }); }); }
  return ROOMS[room] || null;
}
const roomsOf = id => { const st = G.STAGES[id]; return (st.rooms || []).concat(st.extra || []); };
const copy = rooms => { const out = {}; for (const k in rooms) out[k] = { done: !!rooms[k].done, stars: rooms[k].stars || 0, by: rooms[k].by || null }; return out; };
const full = (rooms, id) => roomsOf(id).every(r => rooms[r] && rooms[r].done);

let started = false, floor = null, visit = null, snapKey, snap = {};
function resnap() { snapKey = (G.profile && G.profile.scenario) || null; snap = copy((G.state && G.state.rooms) || {}); }

/* a scene has changed: the start of a visit, a station entered or left, a stage walked into */
G.onScene = function (from, to) {
  try {
    if (snapKey === undefined) resnap();
    if (!started && from === 'title') { started = true; G.track('game_start', { returning: !!(G.hasProgress && G.hasProgress()) }); }
    if (visit && from === visit.room) {
      /* again: the station was already done, so leaving it is not giving up */
      if (!visit.done) G.track('station_left', { room: visit.room, stage: stageOf(visit.room), seconds: secs(visit.t0), again: visit.again });
      visit = null;
    }
    if (stageOf(to)) {
      const r = (G.state.rooms || {})[to] || {};
      visit = { room: to, t0: now(), done: false, again: !!(r.done && !r.by) };
      G.track('station_started', { room: to, stage: stageOf(to), again: visit.again });
    }
    if (to === 'corridor') {
      const f = G.state.floor || null;
      if (f && f !== floor && f !== 'bay') G.track('stage_entered', { stage: f });
      floor = f;
    }
  } catch (e) {}
};
/* the save has been written: whatever is newly done since the last one is a station finished, a step
   Tomo ran, a stage finished or a project through its review */
G.onSave = function () {
  try {
    const key = (G.profile && G.profile.scenario) || null, s = G.state || {}, rooms = s.rooms || {};
    if (key !== snapKey || !key) { resnap(); return; }
    let lent = 0; const touched = {};
    for (const r in rooms) {
      const b = rooms[r], a = snap[r] || {};
      if (b.done && !b.by && (!a.done || a.by || (b.stars || 0) > (a.stars || 0))) {
        const here = !!(visit && visit.room === r);
        if (here) visit.done = true;
        G.track('station_finished', { room: r, stage: stageOf(r), stars: b.stars || 0, first: !a.done || !!a.by, seconds: here ? secs(visit.t0) : null, tries: (s.tries || {})[r] || 0 });
        touched[stageOf(r)] = true;
      } else if (b.done && b.by && !a.done) { lent++; touched[stageOf(r)] = true; }
    }
    if (lent) G.track('tomo_asked', { steps: lent });
    Object.keys(touched).forEach(id => {
      if (!G.STAGES[id] || !full(rooms, id) || full(snap, id)) return;
      const rs = roomsOf(id);
      G.track('stage_finished', { stage: id, stage_stars: rs.reduce((n, r) => n + (rooms[r].stars || 0), 0), stage_max: rs.length * 3, tomo_steps: rs.filter(r => rooms[r].by).length });
    });
    if (rooms.close && rooms.close.done && !(snap.close || {}).done) {
      G.track('project_finished', { max: G.maxStars ? G.maxStars() : null, slips: (s.review || {}).slips || 0, tomo_steps: Object.keys(rooms).filter(r => rooms[r].by).length });
    }
    snap = copy(rooms);
  } catch (e) {}
};
/* a parcel has been taken */
G.onProject = function (id, was) {
  try { if (id && id !== was) G.track('project_chosen', { project: id, from: was || null }); } catch (e) {}
};

/* ---------- and what happens on the page around the game ---------- */
const where = () => { const sc = G.scene ? G.scene() : ''; return sc === 'corridor' ? 'hall:' + ((G.state && G.state.floor) || '') : sc; };
const listen = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', e => { try { fn(e); } catch (x) {} }); };
listen('term-langs', e => { const b = e.target.closest('[data-lang]'); if (b) G.track('code_tab_opened', { room: where(), tool: (b.textContent || '').trim(), tool_id: b.getAttribute('data-lang') }); });
listen('btn-copy', () => G.track('methods_copied', { room: where() }));
listen('link-repo', () => G.track('github_opened', { from: 'page' }));
})();
