/* The immune cell system's pack for the Long Gallery (the end of the blood project): the questions from the floor, what
   the Weigh House's stations rule out, and what Vera says at the lectern. It is loaded with the gallery, after js/systems/immune.js.
   The gallery itself (js/stages/gallery/hall.js) hangs a frame for every station on the project's route, and knows what the
   stations of the four shared stages rule out. Everything here is about this project's own cells and its own fifth stage. */
(function () {
'use strict';
const C = G.C;
G.systems.immune.gallery = {
  /* somebody who asks a question, is in no other stage and belongs to this project: how they look */
  cast: {
    CLINICIAN: { skin: C.skin3, hair: '#1a1a22', style: 'short', coat: '#dfe8f2', shirt: '#2f9e8f', pants: '#2a3348', glasses: true },
  },
  /* ---- the five questions from the floor, one for each stage ---- */
  /* who: who asks. hand: they wait with a hand up. ask: the question. tag: its short form, shown while they walk with the player.
     room: the one station that answers it. right: what they say at its frame (own: if they ran that step for the player
     themselves). near: what is said at a frame that looks as if it
     might answer and does not, by the person whose stage that frame is (or by whoever the line names). At any other frame,
     that person says what the station there rules out instead. */
  questions: [
    { who: 'TOMO', hand: true, room: 'soup', tag: 'A NEW KIND OF T CELL?',
      ask: ['TOMO: Sorry. A question. I looked at your raw counts. Every T cell carries a little haemoglobin RNA.',
        'TOMO: T cells do not make haemoglobin. Is it a new kind of T cell? Or was that ruled out somewhere on this wall?'],
      right: 'TOMO: Loose RNA from burst red cells, in every droplet. Its share was measured and taken out. So, not a new cell.',
      own: 'TOMO: Oh. That is the step I ran for you. So the loose RNA was measured and taken out, and I asked all the same.',
      near: {
        doublet: 'The doublet hunt took out droplets that held two cells. Tomo sees this in every single cell, which is another matter.',
        cliff: 'The Cliff told droplets that hold a cell from empty ones. It left the cells it kept exactly as they were.' } },
    { who: 'VISITOR', room: 'umap', tag: 'FAR APART, LEAST ALIKE?',
      ask: ['VISITOR: I have been looking at your map. Two islands lie far apart, and a third sits between them.',
        'VISITOR: So the far two are the least alike, and the one between is a little like both. Have I read that right?'],
      right: 'VISITOR: The same graph, drawn twice, and the islands moved. So who shares an island counts, and the distances do not.',
      near: {
        knn: 'Neighbours set how many links each cell gets. The map was drawn from those links afterwards, at another station.',
        club: 'Tomo made that very claim at journal club, and you objected. Point at the station that showed you why.' } },
    { who: 'CHIEF', room: 'cut', tag: 'WHY EIGHT CLUSTERS?',
      ask: ['CHIEF: Eight clusters. I am told the same cells can be cut into five, or into fourteen.',
        'CHIEF: So who settled on eight, and on what grounds?'],
      right: 'CHIEF: The resolution was a choice, and every split was checked for genes behind it. Hm. Eight it is.',
      near: {
        lineup: 'The line-up found each cluster a marker gene, after the cut was made. It did not decide how many clusters there are.',
        chief: 'CHIEF: That is my office. In there you showed me a record of the cut. Take me to where the cut was made.' } },
    { who: 'REVIEWER 2', room: 'wash', tag: 'CELL TYPES, OR RUNS?',
      ask: ['REVIEWER 2: Your cells were run on two days. I have seen the dates on the tubes.',
        'REVIEWER 2: How do I know that the islands on your map are cell types, and not simply the two runs?'],
      right: 'REVIEWER 2: The runs were pulled together, and the cells that one run alone held kept their island. Acceptable.',
      near: {
        sort: 'At the sorting table the two runs still lay apart. You found which islands were partners. Nothing had been moved yet.',
        lost: 'Lost and found placed a third run on the finished map and checked its labels. The first two were joined before that.',
        counter: 'The counter is where the next study was planned, so run and condition can be told apart. This one was already run.',
        formula: 'The bench kept the run out of a test, patient by patient. The islands on the map were made long before that.' } },
    { who: 'CLINICIAN', room: 'census', tag: 'DOES IT REMOVE THEM?',
      ask: ['CLINICIAN: In the responders, four kinds of cell take a smaller share of the blood after treatment.',
        'CLINICIAN: Does the treatment remove those cells?'],
      right: 'CLINICIAN: So only the CD8 T cells changed in number. The other four gave up share, and nothing happened to them.',
      near: {
        scales: 'The Scales weighed three claims about genes, on donors instead of cells. They did not count the cells of each kind.',
        readout: 'The read-out is the sentence that went to the clinic. It states the finding. The step that found it hangs nearby.' } },
  ],
  /* ---- what each station of the Weigh House rules out, as Amara puts it when a question is brought to the wrong one ---- */
  rules: {
    scales: 'The Scales weighed each claim on twelve donors instead of on cells. They rule out a finding that is one patient\'s doing.',
    formula: 'The bench set every patient against their own baseline. It rules out taking a difference between patients for a change.',
    stairs: 'The Stairs set how many false alarms to allow among two hundred genes. They rule out a gene that passed by luck.',
    census: 'The Census found which cell types changed in number, against a steady one. It rules out a share that fell only to make room.',
    readout: 'The read-out is the sentence itself. It says what was found. The steps that found it hang to the left of it.',
  },
  /* what Amara says in the gallery when spoken to */
  mentor: ['AMARA: The Weigh House, on a wall. Everything in these frames was weighed before it was hung.',
    'AMARA: If somebody brings a question to the wrong frame, I shall say what that frame can bear.'],

  /* ---- the close, at the lectern ---- */
  /* lead: how Vera comes to what was found (s is the save, you the player's name); null if the save does not hold it.
     head: the heading over it on the screen. found: the finding in the player's own words, as one text or as rows.
     gloss: what Vera says once it has been read. open: what the project did not show: a line on the screen and what Vera says. */
  close: {
    head: 'SENT TO THE CLINIC',
    lead: (s, you) => (s.weigh && s.weigh.sentence ? 'VERA: I asked ' + you + ' what differs between the six who responded and the six who did not. This went to the clinic.' : null),
    found: s => ({ text: (s.weigh && s.weigh.sentence) || '' }),
    gloss: s => (s.weigh && s.weigh.sentence ? 'VERA: That is what differs. One sentence, and every word in it was weighed.' : null),
    open: [
      { tag: 'NEW PATIENTS: NOT TESTED', say: 'VERA: Now what we did not show. The finding was not tested in patients it did not come from.' },
      { tag: 'A CAUSE: NOT SHOWN', say: 'VERA: It goes with response. Whether it brings a response about, nobody here has shown.' },
      { tag: 'WHO SIGNALS TO WHOM: NOT KNOWN', say: 'VERA: And which cells signal to which, we do not know. That stage is still a building site.' },
    ],
  },
};
})();
