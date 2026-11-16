/* The side panel: the player's lab notebook (objective, field notes, what they carry) and a
   terminal that shows the same step in real tool syntax. Highlighted values in the code are
   bound to G.params, so the game and the code always agree. */
(function () {
'use strict';
const $ = id => document.getElementById(id);
const book = G.book = { cfg: null, onParam: null, lang: {}, states: {} };

const SRC = 'Built on the <a href="https://www.sc-best-practices.org/" target="_blank" rel="noopener">Single-cell best practices</a> book ' +
  'and the papers behind each method.';

function fmtParam(k, v) {
  if (v === undefined || v === null) return '';
  if (k === 'fdr') return String(v);
  return typeof v === 'number' ? String(Math.round(v)) : String(v);
}

/* cfg: { floor, room, goals: [{id, text}], notes: [{id, html, open}], term: {title, intro, tabs: [{id, label, html}], tip} | null } */
book.show = function (cfg) {
  book.cfg = cfg; book.states = {};
  /* a page with an aim belongs to a game: the screen shows the same goals as a job card and as lights */
  G.job = cfg.aim ? { title: cfg.room, aim: cfg.aim, goals: cfg.goals } : null;
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
      : ' to change it, extend it or build the next stage.');
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
  book.states[id] = state;
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
  const cl = s.cloud || {};
  if (s.rooms.norm.done && !s.rooms.norm.by) rows.push('Normalised the counts: divided by depth, then log(1 + x).');
  if (s.rooms.hvg.done && cl.n) rows.push('Picked <b>' + cl.n + '</b> of 207 genes by ' + (cl.method === 'raw' ? 'plain variance' : 'variance above the trend') +
    (cl.block ? ', skipping MT- and RP genes.' : '. MT- and RP genes are in the list.'));
  if (s.rooms.pca.done && cl.dims) rows.push('Kept <b>' + cl.dims + '</b> principal components.');
  if (s.rooms.knn.done && cl.k) rows.push('Linked every cell to its <b>' + cl.k + '</b> nearest neighbours.');
  if (s.rooms.umap.done && cl.seed) rows.push('Drew the map with seed <b>' + cl.seed + '</b>. A map, not a result.');
  /* w: the cell system's words. On the title screen the cell system has not arrived yet, and the lines that need its words wait for it. */
  const bu = s.bureau || {}, w = (G.sys && G.sys.book) || {};
  if (s.rooms.cut.done && bu.res) rows.push('Clustered at resolution <b>' + bu.res + '</b>, then ' + (bu.fix === 'merge' ? 'merged two clusters that no gene told apart' : 'zoomed into one cluster to split it') + ': <b>8</b> clusters.');
  if (s.rooms.lineup.done && bu.pins) rows.push('Pinned a marker gene on <b>' + bu.pins.filter(g => g).length + '</b> clusters, and took a cluster of <b>doublets</b> off the board.');
  if (s.rooms.name.done && bu.names) rows.push('Named the clusters from their markers.');
  if (s.rooms.oracle.done && bu.ref && w.ref) rows.push('Took a second opinion from ' + w.ref + ': took one of its names, kept one of yours.');
  const la = s.laundry || {};
  if (s.rooms.sort.done && !s.rooms.sort.by && w.loner) rows.push('Paired <b>5</b> cell types across two runs. ' + w.loner.charAt(0).toUpperCase() + w.loner.slice(1) + ' were in one run only.');
  if (s.rooms.wash.done && la.theta && w.loner) rows.push('Corrected the run with Harmony at theta <b>' + la.theta + '</b>, and checked that the ' + w.loner + ' kept their island.');
  if (s.rooms.lost.done && !s.rooms.lost.by && w.unseen) rows.push('Mapped a third run onto the corrected map, and flagged <b>' + w.unseen + '</b> that had been labelled ' + w.called + '.');
  if (s.rooms.counter.done && !s.rooms.counter.by) rows.push('Fixed three study designs before anything was sequenced.');
  const we = s.weigh || {};
  if (s.rooms.scales.done && we.stamps) rows.push('Weighed three claims about responders on donors instead of cells. <b>' + we.stamps.filter(h => h).length + '</b> held.');
  if (s.rooms.formula.done && we.formula) rows.push('Compared every patient with their own baseline, and found what changed in responders only: <b>~ ' + we.formula + '</b>.');
  if (s.rooms.stairs.done && we.found) rows.push('Called <b>' + we.found + '</b> of 200 genes ' + (we.rule === 'bh' ? 'at a false discovery rate of' : 'with a threshold of') + ' <b>' + Math.round(we.rate * 100) + '%</b>.');
  if (s.rooms.census.done && we.ref !== undefined && w.types) rows.push('Entered in the ledger that <b>' + w.grew + '</b> grew in number in responders, against ' + w.types[we.ref] + '.');
  if (s.rooms.readout.done && we.sentence) rows.push('Sent the clinic one sentence: <b>' + we.sentence + '</b>');
  const ya = s.yard || {};
  if (s.rooms.turntable.done && ya.root && ya.sent) rows.push('Sent <b>' + ya.sent + '</b> ' + (ya.sent === 1 ? 'engine' : 'engines') + ' over the band of cells, and set the root of the line among the <b>' + ya.root + '</b>.');
  if (s.rooms.track.done && ya.pieces) rows.push('Laid <b>' + ya.pieces + '</b> pieces of track where the cells link, with <b>' + ya.wagons + '</b> test wagons' + (w.apart ? ', and left the ' + w.apart + ' off the line.' : '.'));
  if (s.rooms.timetable.done && ya.genes) rows.push('Smoothed five genes along pseudotime at a span of <b>' + ya.span + '</b>, and read the order they come on in: <b>' + ya.genes.join(', ') + '</b>.');
  if (s.rooms.clock.done && ya.oldest) rows.push('Checked the direction against real time: the <b>' + ya.oldest.toLowerCase() + '</b> sample has <b>' + ya.far + '%</b> of its cells past half-way, more than either younger one.');
  if (s.rooms.board.done && ya.lines) rows.push('Hung the departure board for Vera: <b>' + ya.lines.length + '</b> lines, with an order on it and no times.');
  const lent = Object.keys(s.rooms).filter(k => s.rooms[k].by).length;
  if (lent) rows.push('Tomo ran <b>' + lent + '</b> ' + (lent === 1 ? 'step' : 'steps') + ' for you, with default settings.');
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
  const cl = s.cloud || {};
  if (s.rooms.norm.done) m.push('Counts were normalised to the median library size and log-transformed (log1p).');
  if (s.rooms.hvg.done && cl.n) m.push('The ' + cl.n + ' most variable of 207 genes were selected' + (cl.method === 'raw' ? ' by variance' : ' by variance above the mean-variance trend') +
    (cl.block ? ', excluding mitochondrial and ribosomal genes.' : '.'));
  if (s.rooms.pca.done && cl.dims) m.push('Genes were scaled to unit variance and the first ' + cl.dims + ' principal components were kept.');
  if (s.rooms.knn.done && cl.k) m.push('A neighbour graph was built on these components with k = ' + cl.k + '.');
  if (s.rooms.umap.done && cl.seed) m.push('The graph was laid out in two dimensions (random seed ' + cl.seed + ') for display only.');
  const bu = s.bureau || {}, w = (G.sys && G.sys.book) || {};
  if (s.rooms.cut.done && bu.res) m.push('Cells were clustered on the neighbour graph by modularity optimisation (Louvain; resolution ' + bu.res + '), and ' +
    (bu.fix === 'merge' ? 'two clusters without distinguishing genes were merged' : 'one cluster was sub-clustered') + ', giving 8 clusters.');
  if (s.rooms.lineup.done) m.push('Marker genes were required to be detected in at least 60% of the cells of a cluster and in at most 20% of all other cells. One cluster had no such gene, co-expressed ' + w.doublet + ' and carried more RNA per cell; it was removed as doublets.');
  if (s.rooms.name.done) m.push('The remaining clusters were annotated manually from marker genes, to the most specific level the markers supported.');
  if (s.rooms.oracle.done) m.push('Annotations were compared with labels transferred from ' + w.refMethods + ', and disagreements were resolved from marker genes.');
  const la = s.laundry || {};
  if (s.rooms.wash.done && la.theta) m.push('Two sequencing runs were analysed together. Variable genes were selected within each run, and the principal components were corrected for run with Harmony (theta = ' + la.theta + '); counts were left unchanged. The correction was checked by run mixing among nearest neighbours and by the marker genes of a population present in one run only.');
  if (s.rooms.lost.done) m.push('A third run was mapped onto the corrected reference and labels were transferred from the 5 nearest reference cells. Transferred labels were checked against marker genes; one group of cells lacked the marker of its label and was annotated separately as ' + w.unseen + '.');
  const we = s.weigh || {};
  if (s.rooms.scales.done) m.push('To compare conditions, counts were summed per donor, visit and cell type (pseudobulk), and donors, not cells, were treated as replicates.');
  if (s.rooms.formula.done) m.push('Effects of treatment were tested within patients (~ donor + visit), and effects specific to responders as the interaction of visit and response.');
  if (s.rooms.stairs.done && we.rule) m.push(we.rule === 'bh' ? 'P-values were adjusted for the number of genes tested by the Benjamini-Hochberg procedure, and genes were called at a false discovery rate of ' + Math.round(we.rate * 100) + '%.'
    : we.rule === 'bonf' ? 'P-values were adjusted for the number of genes tested by the Bonferroni method (threshold ' + we.rate + ').' : 'Genes were called at an unadjusted p-value of ' + we.rate + '.');
  if (s.rooms.census.done && we.ref !== undefined && w.types) m.push('Changes in cell-type composition were assessed with all cell types considered together, and are reported relative to ' + w.types[we.ref] + ' as the reference.');
  if (s.rooms.readout.done) m.push('The findings are associations in twelve patients. Whether they predict response was not tested in new patients.');
  const ya = s.yard || {};
  if (s.rooms.turntable.done) m.push('Cells of one lineage were ordered by pseudotime, the distance through the neighbour graph from a root' + (ya.root ? ' placed among the ' + ya.root + ' on the basis of marker genes.' : '.'));
  if (s.rooms.track.done) m.push('Which cell types the lineage joins was assessed from the number of neighbour-graph links between them, relative to the number expected for links made at random (as in PAGA)' + (w.apart ? '; ' + w.apart + ' were not connected to it and were left out.' : '.'));
  if (s.rooms.timetable.done && ya.span) m.push('Expression was smoothed along pseudotime with a Gaussian kernel (width ' + ya.span + ' of the range) to find the order in which marker genes come on.');
  if (s.rooms.clock.done) m.push('The direction of the ordering was checked against the age of the samples. Pseudotime was not read as elapsed time.');
  if (s.rooms.board.done) m.push('The ordering describes cell states. It gives no durations, and does not show that any one cell descends from another.');
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
