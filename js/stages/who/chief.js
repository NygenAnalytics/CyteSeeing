/* The end of floor 3: the Chief reads the file and objects, five times. No objection repeats
   a lesson from a station: each is a new situation, and the player answers by presenting the
   piece of evidence that settles it: the marker table, the record of the cut, or the machine's
   printout. One objection is simply right, and the answer to it is to say so.
   Every number quoted is computed from the cells. */
(function () {
'use strict';
const { R, T, C, VW, VH } = G;
const at = () => G.atlas;
const pc = v => G.atlas.pc(v), PASS = 3;
const MX = 8, MY = 62, MW = 132, MH = 64;

const CARDS = [
  { id: 'MARK', name: ['MARKER', 'TABLE'] }, { id: 'CUT', name: ['RECORD', 'OF THE CUT'] },
  { id: 'MACH', name: ['MACHINE', 'PRINTOUT'] }, { id: 'YES', name: ['THE CHIEF', 'IS RIGHT'] },
];
const CHIEF = { skin: C.skin1, hair: '#9aa0ad', style: 'short', coat: '#3a3f4f', shirt: C.paper, pants: '#23262f', shoes: C.ink };
const HERO = { skin: C.skin1, hair: '#3a2a22', style: 'short', coat: C.paper, shirt: C.cyan, pants: '#2c3a5e', shoes: C.ink };

let phase, beats, reply, qi, sel, right, last, f, pos, Q, askT, rsel, lastSync, wag;

/* the objections are written once the clusters are known, so that they can quote them. Which
   clusters, which gene and the words for the tissue come from the pack of the cell system
   (js/systems/<id>.who.js: chief, refs). */
function build() {
  f = at().final(); pos = at().place(MX + 6, MY + 6, MW - 14, MH - 14);
  const w = G.sys.who.chief, far = G.sys.who.refs.far, fit = G.sys.who.refs.fit, both = w.shared;
  const n = r => f.role[r] + 1, m = r => f.mem[f.role[r]];
  const fine = at().audit(at().DIAL[at().DIAL.length - 1]), rna = at().depth(f.role[w.rna]).toFixed(1);
  const sureFar = at().opinion('far')[f.role[w.sure]], sureFit = at().opinion('fit')[f.role[w.sure]];
  const apart = at().apart(m(both[0]), m(both[1])).length;
  Q = [
    { on: null, say: 'The last inspector cut this board into ' + fine.part.k + ' clusters. More clusters, more cell types. You bring me eight.', ok: ['CUT'],
      you: () => fine.weak.length + ' of his splits had no gene behind them. More clusters is not more cell types.',
      ida: 'Not that. The record of the cut: ' + fine.weak.length + ' of those splits had no gene behind them.' },
    { on: w.rna, say: 'Cluster ' + n(w.rna) + ' carries ' + rna + ' times the usual RNA. More doublets. Take them off the board too.', ok: ['MARK'],
      you: () => 'More RNA alone proves nothing. Cluster ' + n(w.rna) + ' has genes of its own, and the markers of one cell type only.',
      ida: 'Not that. The marker table: cluster ' + n(w.rna) + ' has genes of its own.' },
    { on: w.sure, say: 'The ' + far.word + ' cartridge gave cluster ' + n(w.sure) + ' ' + pc(sureFar.share) + ' of the votes. The ' + fit.word + ' one gave it ' + pc(sureFit.share) + '. Use the ' + far.word + ' one. It is surer.', ok: ['MACH'],
      you: () => 'It was sure of "' + sureFar.label.toLowerCase() + '", in ' + w.where + '. Votes say how sure the machine is, not whether its reference fits.',
      ida: 'Not that. The printout: those votes were for ' + far.cell + '.' },
    { on: both[0], say: 'Clusters ' + n(both[0]) + ' and ' + n(both[1]) + ' both carry ' + both[2] + '. One cell type. Merge them.', ok: ['MARK', 'CUT'],
      you: () => 'They share that one gene, and ' + apart + ' others tell them apart. One shared gene is not one cell type.',
      ida: 'Not that. The marker table: ' + apart + ' genes tell those two apart.' },
    { on: null, say: 'One sample. One donor. I am not signing off the cell types of ' + w.whole + ' on that.', ok: ['YES'],
      you: () => 'Agreed. These names are hypotheses until the next sample agrees.',
      ida: 'This time the Chief is right, and the answer is to say so.' },
  ];
}
/* what the Chief says to an answer: one word, over the desk, while the answer is still on the screen */
const GRUNT = ['HM.', 'I SEE.', 'HMPH.', 'FINE.', 'GOOD.'];

function present() {
  const q = Q[qi], card = CARDS[sel].id, ok = q.ok.indexOf(card) >= 0;
  if (ok) right++;
  last = ok; wag = G.t;
  G.state.tries.chief++; G.save(); G.sfx(ok ? 'ok' : 'bad');
  reply = new G.Beats([{ say: ok ? 'YOU: ' + q.you(card) : q.ida }]);
  phase = 'reply';
}
function next() {
  reply = null;
  if (qi < Q.length - 1) { qi++; sel = 0; askT = 0; phase = 'ask'; return; }
  phase = 'result'; rsel = right >= PASS ? 1 : 0;
  G.book.goal('most', right >= PASS); G.book.goal('all', right === Q.length); G.sfx(right >= PASS ? 'star' : 'bad');
}
function verdict() {
  return right >= PASS ? 'CHIEF: Case closed. Now get out of my office.'
    : 'The Chief is not convinced. Each objection is settled by one piece of evidence from the case.';
}
function keep() {
  const s = G.state, stars = right === Q.length ? 3 : right === Q.length - 1 ? 2 : 1;
  s.rooms.chief = { done: true, stars: Math.max(s.rooms.chief.stars, stars) };
  G.save();
  G.go('corridor', { from: 'chief', party: true });
}
function restart() { qi = 0; sel = 0; right = 0; askT = 0; phase = 'ask'; G.book.goal('most', null); G.book.goal('all', null); }

function showBook() {
  G.book.show({
    floor: 'The Bureau · The far end', room: "The Chief's office", aim: 'Answer each of the Chief\'s 5 objections with the piece of evidence that settles it.',
    methods: true, file: 'js/stages/who/chief.js', fileText: 'edit the objections', fileTail: ' if a reviewer has sent you a better one.',
    goals: [{ id: 'most', text: 'Answer at least 3 of the 5 objections' }, { id: 'all', text: 'Answer all 5' }],
    notes: [
      { id: 'f-hint', open: true, html: 'What you hold. The <b>marker table</b> says which genes are in which cluster. The <b>record of the cut</b> says how the clusters were made, and what tells them apart. The <b>printout</b> says what the machine answered, and what it was trained on.' },
    ],
    term: null,
  });
}

G.scenes.chief = {
  phase: () => phase,
  dbg: { state: () => ({ qi, right, ok: Q ? Q[qi].ok.slice() : [], cards: CARDS.map(c => c.id) }) },
  enter() {
    build();
    qi = 0; sel = 0; right = 0; askT = 0; reply = null; last = null; rsel = 1; wag = -9;
    beats = new G.Beats([
      { say: 'CHIEF: Sit. I have read your file, and I have objections.' },
      { spot: [0, 130, VW, 50], say: 'Answer each one with a piece of evidence from the case. If the Chief is right, say so.' },
    ]);
    phase = G.state.tries.chief > 0 ? 'ask' : 'intro';
    showBook();
  },
  update(dt) {
    if (G.hit('b')) { G.go('corridor', { from: 'chief' }); return; }
    if (phase === 'intro') { if (beats.update(dt) === 'done') { phase = 'ask'; askT = 0; } }
    else if (phase === 'ask') {
      askT += dt;
      if (G.hit('right')) { sel = (sel + 1) % CARDS.length; G.sfx('tick'); }
      if (G.hit('left')) { sel = (sel + CARDS.length - 1) % CARDS.length; G.sfx('tick'); }
      if (G.hit('a')) { if (askT < 0.6) askT = 99; else present(); }
    } else if (phase === 'reply') { if (reply.update(dt) === 'done') next(); }
    else if (phase === 'result') {
      const pass = right >= PASS, r = G.resultKeys(rsel, pass); rsel = r.rsel;
      if (r.act === 'keep') keep(); else if (r.act === 'retry') restart();
    }
  },
  draw() {
    drawOffice();
    G.roomHeader("THE CHIEF'S OFFICE", C.coral, true);
    const y0 = 130;
    if (phase === 'result') {
      const pass = right >= PASS, act = G.resultDraw(y0, verdict(), pass, rsel, 'TRY AGAIN', 'CLOSE THE CASE');
      T(right + ' OF ' + Q.length, VW - 10, y0 + 6, pass ? C.mint : C.coral, { a: 'right', f: 'lg' });
      if (act === 'keep') keep(); else if (act === 'retry') restart();
      return;
    }
    G.strip(y0);
    const live = phase === 'ask';
    CARDS.forEach((k, i) => {
      const x = 6 + i * 78, on = i === sel && live, hot = live && G.over(x, y0 + 4, 74, 42);
      if (hot && G.ptr.pressed) { sel = i; if (askT >= 0.6) present(); else askT = 99; }
      G.panel(x, y0 + 4 - (on ? 1 : 0), 74, 42, { border: on ? C.amber : hot ? C.cyan : C.slate, fill: k.id === 'YES' ? '#2a1d22' : '#1b2340' });
      icon(k.id, x + 29, y0 + 8 - (on ? 1 : 0));
      k.name.forEach((l, n) => T(l, x + 37, y0 + 26 + n * 8 - (on ? 1 : 0), on ? C.white : C.fog, { a: 'center' }));
      if (on && Math.floor(G.t * 3) % 2 === 0) G.cue(x + 37, y0 + 4, true);
    });
    /* the objection stays up while it is being answered */
    if (phase === 'ask' || phase === 'reply') {
      G.caption('CHIEF: ' + Q[qi].say, phase === 'ask' ? askT : 99, { top: true, noPrompt: true, border: C.coral, accent: '#8a2f3a' });
      T((qi + 1) + ' / ' + Q.length, 146, 62, C.fog);
    }
    if (phase === 'intro') beats.draw();
    if (phase === 'reply') reply.draw();
  },
};

/* small pictures for the evidence cards */
function icon(id, x, y) {
  if (id === 'MARK') { for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const big = r === c; R(x + c * 4 + (big ? 0 : 1), y + 1 + r * 5 + (big ? 0 : 1), big ? 3 : 1, big ? 3 : 1, big ? C.amber : C.steel); } }
  else if (id === 'CUT') { G.disc(x + 8, y + 8, 7, '#6b4630'); G.line(x + 8, y + 8, x + 13, y + 4, C.cyan); for (let i = 0; i < 5; i++) R(x + 1 + i * 4, y, 1, 1, C.fog); }
  else if (id === 'MACH') { R(x + 2, y, 12, 16, C.paper); for (let i = 0; i < 5; i++) R(x + 4, y + 2 + i * 3, 4 + (i * 3) % 5, 1, C.steel); }
  else { R(x + 2, y + 8, 3, 3, C.mint); R(x + 5, y + 10, 2, 3, C.mint); R(x + 7, y + 3, 3, 8, C.mint); R(x + 10, y + 1, 2, 4, C.mint); }
}

function drawOffice() {
  const t = G.t, q = Q[qi];
  R(0, 0, VW, VH, '#1c1512'); R(0, 14, VW, 100, '#3d2f29'); R(0, 114, VW, 16, '#241a15'); R(0, 113, VW, 1, '#5a4638');
  /* blinds, with the light coming through */
  R(196, 62, 60, 40, '#140e0c'); R(198, 64, 56, 36, '#101a2c');
  for (let r = 0; r < 7; r++) R(198, 65 + r * 5, 56, 3, '#8a7a5c');
  for (let i = 0; i < 5; i++) R(150 + i * 6, 104 + i * 2, 120 - i * 10, 1, 'rgba(246,220,140,.05)');
  /* the board, brought in on an easel: the cluster under discussion is ringed */
  R(MX - 2, MY - 2, MW + 4, MH + 4, '#3a2a1c'); R(MX, MY, MW, MH, '#0e1630');
  const gone = f.dbl;
  pos.forEach((p, i) => R(p[0], p[1], 2, 2, f.lab[i] === gone ? at().GONE : at().COLS[f.lab[i]]));
  f.mem.forEach((m, c) => { if (c === gone) return; const q2 = at().centre(pos, m); R(q2[0] - 4, q2[1] - 5, 9, 10, 'rgba(10,15,30,.8)'); T(String(c + 1), q2[0], q2[1] - 5, at().COLS[c], { a: 'center' }); });
  if (q && q.on && (phase === 'ask' || phase === 'reply')) {
    const b = at().box(pos, f.mem[f.role[q.on]]), w = Math.floor(t * 4) % 2 ? C.white : C.amber;
    R(b[0], b[1], b[2], 1, w); R(b[0], b[1] + b[3], b[2], 1, w); R(b[0], b[1], 1, b[3], w); R(b[0] + b[2], b[1], 1, b[3] + 1, w);
  }
  R(MX + 20, MY + MH + 2, 2, 12, '#3a2a1c'); R(MX + MW - 22, MY + MH + 2, 2, 12, '#3a2a1c');
  /* the Chief behind the desk, and you in front of it */
  const up = phase === 'reply' && last === false && t - wag < 1.2 ? -1 : 0;
  G.person(236, 105 + up, CHIEF, { dir: -1, t });
  R(232, 95 + up, 5, 1, '#9aa0ad');
  R(196, 103, 86, 25, '#4a3626'); R(194, 101, 90, 3, '#6b4630'); R(200, 107, 78, 1, '#3a2a1c');
  R(270, 90, 2, 11, C.ink); R(264, 87, 12, 4, '#2e9a68'); R(261, 91, 18, 10, 'rgba(246,220,140,.10)');
  R(202, 96, 14, 5, C.paper); R(204, 97, 9, 1, C.steel); R(218, 98, 8, 3, '#d8d2bf');
  G.panel(220, 110, 38, 12, { border: C.oil, fill: C.ink }); T('CHIEF', 239, 111, C.oil, { a: 'center' });
  if (phase === 'reply') {
    const w = last ? GRUNT[qi] : 'NO.', ww = Math.ceil(G.tw(w, 'sm')) + 8;
    G.panel(238 - ww / 2, 70, ww, 12, { border: last ? C.fog : C.coral, fill: C.ink }); T(w, 238, 71, last ? C.fog : C.coral, { a: 'center' }); R(236, 82, 3, 2, last ? C.fog : C.coral);
  }
  G.person(166, 128, HERO, { dir: 1, t });
  G.person(150, 128, G.bureau.IDA, { dir: 1, t });
  if (phase === 'result') G.stars(146, 62, right === Q.length ? 3 : right === Q.length - 1 ? 2 : right >= PASS ? 1 : 0);
}
})();
