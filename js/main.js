/* Boot: load the pixel fonts, size the screen to a whole-number scale, wire the page buttons, start. */
(function () {
'use strict';
const cv = G.cv, stage = document.getElementById('stage');

function fit() {
  const mq = q => window.matchMedia(q).matches;
  const touch = mq('(hover: none), (pointer: coarse)');
  const sideways = mq('(pointer: coarse) and (orientation: landscape) and (max-height: 520px)');
  const full = document.fullscreenElement === stage;
  const lay = stage.parentElement.clientWidth, one = sideways || mq('(max-width: 900px)');
  /* the room the screen may take: everything in full screen, the full height on a phone held
     sideways, the full width on a phone held upright, and beside the notebook on a desktop */
  const fs = getComputedStyle(cv.parentElement), edge = 2 * (parseFloat(fs.paddingLeft) + parseFloat(fs.borderLeftWidth));
  let w, h;
  if (full) { w = window.innerWidth - 16 - edge; h = window.innerHeight - 16 - edge; }
  else if (sideways) { w = lay - edge; h = window.innerHeight - 6 - edge; }
  else { w = (one ? lay : lay - 18 - 320) - edge; h = touch ? 1e6 : window.innerHeight - 120; }
  /* one game pixel covers a whole number of screen pixels, whatever the display's pixel ratio */
  const dpr = window.devicePixelRatio || 1, room = Math.min(w, h * G.VW / G.VH);
  const exact = room * dpr / G.VW, k = Math.floor(exact);
  let css = k * G.VW / dpr;
  if (k >= 1 && k / exact >= 0.8) { G.setScale(k); cv.style.imageRendering = ''; }
  else {
    /* a whole number would waste a fifth of the space or more: fill it instead, drawn one step
       larger and scaled down, which costs a little sharpness */
    css = Math.max(120, Math.floor(room)); G.setScale(Math.ceil(css * dpr / G.VW)); cv.style.imageRendering = 'auto';
  }
  cv.style.width = css + 'px';
  /* thumb pads only when there is room beside the screen */
  stage.classList.toggle('no-side', sideways && (lay - (css + edge)) / 2 < 76);
}
window.addEventListener('resize', fit);
document.addEventListener('fullscreenchange', fit);
fit();

/* full screen, where the browser allows it (F toggles it too) */
const fullBtn = document.getElementById('btn-full');
G.toggleFull = function () {
  try {
    const p = document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen();
    if (p && p.catch) p.catch(() => {});
  } catch (e) { /* some app views refuse; the game is fine without it */ }
};
if (document.fullscreenEnabled && stage.requestFullscreen) { fullBtn.hidden = false; fullBtn.addEventListener('click', G.toggleFull); }

/* copy the methods section; fall back to selecting it where the clipboard is refused */
const copyBtn = document.getElementById('btn-copy');
copyBtn.addEventListener('click', () => {
  const el = document.getElementById('nb-meth');
  const done = () => { copyBtn.textContent = 'Copied'; setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1800); };
  const select = () => { const r = document.createRange(); r.selectNodeContents(el); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); copyBtn.textContent = 'Selected'; setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1800); };
  try { navigator.clipboard.writeText(el.textContent).then(done, select); } catch (e) { select(); }
});

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
  document.getElementById('link-repo').href = G.REPO;
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
