/* Boot: load the pixel fonts, size the screen to a whole-number scale, wire the page buttons, start. */
(function () {
'use strict';
const cv = G.cv, stage = document.getElementById('stage');

function fit() {
  /* one column on narrow screens; otherwise leave the notebook at least 320px */
  const lay = stage.parentElement.clientWidth, one = window.matchMedia('(max-width: 900px)').matches;
  const avail = (one ? lay : lay - 18 - 320) - 16;
  let k = Math.floor(avail / G.VW);
  const tall = Math.floor((window.innerHeight - 120) / G.VH);
  if (tall >= 1) k = Math.min(k, tall);
  cv.style.width = k >= 1 ? (k * G.VW) + 'px' : '100%';
}
window.addEventListener('resize', fit);
fit();

document.getElementById('btn-sound').addEventListener('click', () => G.toggleSound());
const reset = document.getElementById('btn-reset');
let armed = 0;
reset.addEventListener('click', () => {
  /* two clicks, because this wipes the save */
  if (Date.now() - armed < 4000) {
    armed = 0; reset.textContent = 'Restart game';
    G.resetSave(); G.go('title');
  } else { armed = Date.now(); reset.textContent = 'Click again to wipe'; setTimeout(() => { if (armed) { armed = 0; reset.textContent = 'Restart game'; } }, 4000); }
});

function boot() {
  G.loadSave();
  document.querySelector('.logo').textContent = G.NAME.toUpperCase();
  const b = document.getElementById('btn-sound');
  b.textContent = G.state.sound ? 'Sound on' : 'Sound off';
  b.setAttribute('aria-pressed', G.state.sound ? 'true' : 'false');
  fit();
  G.start('title');
  if (/[?&]debug\b/.test(location.search)) window.__game = G;
}

const faces = (window.GAME_FONTS || []).map(f => {
  try { const face = new FontFace(f.family, f.src, { weight: f.weight }); document.fonts.add(face); return face.load(); }
  catch (e) { return Promise.resolve(); }
});
let started = false;
const go = () => { if (!started) { started = true; boot(); } };
Promise.all(faces).then(go, go);
setTimeout(go, 2500);
})();
