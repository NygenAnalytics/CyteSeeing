/* The side panel: the player's lab notebook (objective, field notes, what they carry) and a
   terminal that shows the same step in real tool syntax. Highlighted values in the code are
   bound to G.params, so the game and the code always agree. */
(function () {
'use strict';
const $ = id => document.getElementById(id);
const book = G.book = { cfg: null, onParam: null, lang: {} };

const SRC = 'Built on the <a href="https://www.sc-best-practices.org/" target="_blank" rel="noopener">Single-cell best practices</a> book ' +
  'and the papers behind each method.';

function fmtParam(k, v) {
  if (v === undefined || v === null) return '';
  if (k === 'fdr') return String(v);
  return typeof v === 'number' ? String(Math.round(v)) : String(v);
}

/* cfg: { floor, room, goals: [{id, text}], notes: [{id, html, open}], term: {title, intro, tabs: [{id, label, html}], tip} | null } */
book.show = function (cfg) {
  book.cfg = cfg;
  document.querySelector('.book').classList.toggle('code-first', !!cfg.codeFirst);
  $('nb-floor').textContent = cfg.floor || 'Lab notebook';
  $('nb-room').textContent = cfg.room;
  $('nb-goals').innerHTML = cfg.goals.map(g => '<li data-g="' + g.id + '">' + g.text + '</li>').join('');
  renderNotes();
  book.log();
  $('nb-src').innerHTML = SRC;
  /* the game is open source: every notebook page points at the file behind the room it describes */
  const link = (href, text) => '<a href="' + href + '" target="_blank" rel="noopener">' + text + '</a>';
  $('nb-edit').innerHTML = 'Open source. ' + link(G.REPO, 'Fork it on GitHub') +
    (cfg.file ? ', or ' + link(G.REPO + '/edit/main/' + cfg.file, cfg.fileText || 'edit this room') + (cfg.fileTail || ' if you spot a mistake or have a better joke.')
      : ' to change it, extend it or build the next floor.');
  const meth = cfg.methods ? book.methods() : '';
  $('nb-meth-box').hidden = !meth;
  $('nb-meth').textContent = meth;

  const t = cfg.term;
  $('term-title').textContent = t ? (t.title || 'Same step, in code') : 'No code in this room';
  if (!t) {
    $('term-langs').innerHTML = '';
    $('term-body').innerHTML = '<p class="term-intro">' + (cfg.termNote || 'Terminals light up inside the rooms. Each one shows the step you are playing in the syntax of real tools.') + '</p>';
    return;
  }
  const pick = book.lang[cfg.room] || t.tabs[0].id;
  $('term-langs').innerHTML = t.tabs.map(tab =>
    '<button class="lang" type="button" role="tab" id="lang-' + tab.id + '" data-lang="' + tab.id + '" aria-selected="' + (tab.id === pick) + '">' + tab.label + '</button>').join('');
  $('term-body').innerHTML = (t.intro ? '<p class="term-intro">' + t.intro + '</p>' : '') +
    t.tabs.map(tab => '<div data-pane="' + tab.id + '"' + (tab.id === pick ? '' : ' hidden') + '>' + tab.html + '</div>').join('') +
    (t.tip ? '<p class="term-tip">' + t.tip + '</p>' : '');
  book.sync();
};

function renderNotes(fresh) {
  const cfg = book.cfg;
  const open = cfg.notes.filter(n => n.open || G.state.notes[n.id]);
  $('nb-notes-h').hidden = !open.length;
  $('nb-notes').innerHTML = open.map(n => '<li' + (n.id === fresh ? ' class="new"' : '') + '>' + n.html + '</li>').join('');
}
/* unlock a field note; it stays unlocked for the rest of the game */
book.unlock = function (id) {
  if (G.state.notes[id]) return;
  G.state.notes[id] = true; G.save();
  if (book.cfg && book.cfg.notes.some(n => n.id === id)) renderNotes(id);
};
/* state: true = met, false = missed, null = not judged yet */
book.goal = function (id, state) {
  const li = document.querySelector('[data-g="' + id + '"]');
  if (!li) return;
  li.classList.toggle('done', state === true);
  li.classList.toggle('fail', state === false);
};
book.log = function () {
  const s = G.state, rows = [];
  if (s.load) rows.push('Loaded <b>' + s.load.lanes + (s.load.lanes > 1 ? ' lanes' : ' lane') + ' × ' + G.fmt(s.load.R) + '</b> cells: <b>' +
    G.fmt(s.load.singlets) + '</b> singlets and <b>' + G.fmt(s.load.doublets) + '</b> doublets (' + (s.load.rate * 100).toFixed(1) + '%).');
  if (s.calls) rows.push('Called <b>' + G.fmt(s.calls.called) + '</b> cells in lane 1. Kept ' + Math.round(s.calls.recall * 100) + '% of the real cells, with ' +
    (s.calls.empties * 100).toFixed(1) + '% empty droplets, and <b>' + G.fmt(s.calls.doublets) + '</b> hidden doublets.');
  if (s.qc) rows.push('Filtered to <b>' + G.fmt(s.qc.kept) + '</b> cells. <b>' + G.fmt(s.qc.junkIn) + '</b> damaged cells got through' +
    (s.qc.lost ? ', and you lost most of the <b>' + s.qc.lost + '</b>.' : '.'));
  if (s.soup) rows.push('Removed a soup share of <b>' + s.soup.rho + '%</b>. The real share was ' + s.soup.truth + '%.');
  if (s.dbl) rows.push('Removed <b>' + G.fmt(s.dbl.removed) + '</b> flagged cells. <b>' + G.fmt(s.dbl.missed) + '</b> doublets are still in the data.');
  if (!rows.length) rows.push('Nothing yet. What you do in each room follows you to the next one.');
  $('nb-log').innerHTML = rows.map(r => '<li>' + r + '</li>').join('');
};

/* a methods section, written from what the player actually did in each room */
book.methods = function () {
  const s = G.state, m = [];
  if (s.load) m.push('Cells were loaded at ' + G.fmt(s.load.R) + ' per lane across ' + s.load.lanes + (s.load.lanes > 1 ? ' lanes' : ' lane') +
    ' of a droplet chip, for an expected doublet rate of ' + (s.load.rate * 100).toFixed(1) + '%.');
  if (s.calls) m.push('Cell-containing droplets were called with EmptyDrops' + (s.calls.lower ? ' (lower = ' + s.calls.lower + ', FDR ' + s.calls.fdr + ')' : '') +
    ', giving ' + G.fmt(s.calls.called) + ' cells in the first lane.');
  if (s.qc && s.qc.minG) m.push('Cells with fewer than ' + G.fmt(s.qc.minG) + ' detected genes or more than ' + s.qc.maxM + '% mitochondrial counts were removed' +
    (s.qc.nmad ? ' (' + s.qc.nmad + ' median absolute deviations from the median)' : '') + ', leaving ' + G.fmt(s.qc.kept) + '.');
  if (s.soup) m.push('Ambient RNA was removed with a contamination fraction of ' + (s.soup.rho / 100).toFixed(2) + '.');
  if (s.dbl && s.dbl.thr) m.push('Doublets were called from simulated doublets at a score cut-off of ' + s.dbl.thr + ', and ' + G.fmt(s.dbl.removed) + ' cells were removed.');
  return m.join(' ');
};

/* push G.params into every bound control and span */
book.sync = function () {
  document.querySelectorAll('#term-body [data-p]').forEach(el => {
    if (el === document.activeElement) return;
    const v = fmtParam(el.getAttribute('data-p'), G.params[el.getAttribute('data-p')]);
    if (el.value !== v) el.value = v;
  });
  document.querySelectorAll('#term-body [data-b]').forEach(el => {
    const k = el.getAttribute('data-b'), v = G.params[k];
    const s = typeof v === 'number' ? G.fmt(v).replace(/,/g, '') : (v === undefined ? '' : String(v));
    if (el.textContent !== s) el.textContent = s;
  });
  document.querySelectorAll('#term-body [data-on]').forEach(el => {
    const kv = el.getAttribute('data-on').split('=');
    el.classList.toggle('off', String(G.params[kv[0]]) !== kv[1]);
  });
};

$('term-langs').addEventListener('click', e => {
  const b = e.target.closest('[data-lang]');
  if (!b) return;
  const id = b.getAttribute('data-lang');
  book.lang[book.cfg.room] = id;
  document.querySelectorAll('#term-langs [data-lang]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
  document.querySelectorAll('#term-body [data-pane]').forEach(p => { p.hidden = p.getAttribute('data-pane') !== id; });
});
function onEdit(e) {
  const el = e.target.closest('[data-p]');
  if (!el) return;
  const k = el.getAttribute('data-p'), v = Number(el.value);
  if (!isFinite(v)) return;
  G.params[k] = v;
  if (book.onParam) book.onParam(k, v);
  book.sync();
}
$('term-body').addEventListener('input', onEdit);
$('term-body').addEventListener('change', onEdit);
})();
