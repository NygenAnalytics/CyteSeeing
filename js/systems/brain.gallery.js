/* The brain cell system's pack for the Long Gallery (the end of the cortex project): the questions from the floor, what
   the Marshalling Yard's stations rule out, and what Vera says at the lectern. It is loaded with the gallery, after js/systems/brain.js.
   The gallery itself (js/stages/gallery/hall.js) hangs a frame for every station on the project's route, and knows what the
   stations of the four shared stages rule out. Everything here is about this project's own cells and its own fifth stage. */
(function () {
'use strict';
const C = G.C;
G.systems.brain.gallery = {
  /* somebody who asks a question, is in no other stage and belongs to this project: how they look */
  cast: {
    CURATOR: { skin: C.skin1, hair: '#b0b6c2', style: 'bun', coat: '#5a6b4a', shirt: '#e8d9a8', pants: '#33302a', glasses: true },
  },
  /* ---- the five questions from the floor, one for each stage ---- */
  /* who: who asks. hand: they wait with a hand up. ask: the question. tag: its short form, shown while they walk with the player.
     room: the one station that answers it. right: what they say at its frame (own: if they ran that step for the player
     themselves). near: what is said at a frame that looks as if it
     might answer and does not, by the person whose stage that frame is (or by whoever the line names). At any other frame,
     that person says what the station there rules out instead. */
  questions: [
    /* no brain cell makes haemoglobin: it comes from red blood cells that burst when the tissue was taken apart */
    { who: 'TOMO', hand: true, room: 'soup', tag: 'A NEW KIND OF NEURON?',
      ask: ['TOMO: Sorry. A question. I looked at your raw counts. Every neuron carries a little haemoglobin RNA.',
        'TOMO: Neurons do not make haemoglobin. Is it a new kind of neuron? Or was that ruled out somewhere on this wall?'],
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
        counter: 'The counter is where the next study was planned, so run and condition can be told apart. This one was already run.' } },
    /* the interneurons are born in the ganglionic eminences and migrate in: on the map of the Track they land beside the
       maturing neurons, and no link of the neighbour graph leads to them */
    { who: 'CURATOR', room: 'track', tag: 'WHY NOT ON THE LINE?',
      ask: ['CURATOR: On your map the interneurons sit right beside the maturing neurons.',
        'CURATOR: Yet your line runs past them and leaves them out. Why are they not on it?'],
      right: 'CURATOR: The links between islands were counted, and none led to the interneurons. Beside is not joined. Thank you.',
      near: {
        umap: 'The map table showed that distance on a map means little. So the question is fair. It does not say what is joined.',
        turntable: 'The Turntable set where the line starts. It did not test which islands the line may pass through.',
        board: 'The board says the interneurons are not on the line. It is the result. The step that showed it hangs nearby.' } },
  ],
  /* ---- what each station of the Marshalling Yard rules out, as Jun puts it when a question is brought to the wrong one ---- */
  rules: {
    turntable: 'The Turntable set the root of the line, from a stem-cell gene. It rules out a story told backwards.',
    track: 'The Track counted the links between islands. It rules out a line through cells that only sit close on the map.',
    timetable: 'The Timetable read the order in which genes come on. It rules out an order made of single cells flickering.',
    clock: 'The Clock set the line against the ages of the samples. It rules out an order that runs the wrong way through time.',
    board: 'The board is the result itself. It says what was found. The steps that found it hang to the left of it.',
  },
  /* what Jun says in the gallery when spoken to */
  mentor: ['JUN: The yard, in five frames. They are hung in order, which is the least one could ask.',
    'JUN: Bring a question to the wrong frame, and I shall say where that train does go.'],

  /* ---- the close, at the lectern ---- */
  /* lead: how Vera comes to what was found (s is the save, you the player's name); null if the save does not hold it.
     head: the heading over it on the screen. found: the finding in the player's own words, as one text or as rows.
     gloss: what Vera says once it has been read. open: what the project did not show: a line on the screen and what Vera says. */
  close: {
    head: 'THE DEPARTURE BOARD',
    lead: (s, you) => (s.yard && s.yard.lines ? 'VERA: I asked ' + you + ' who is there, and who comes from whom. This is the board that was hung in the yard.' : null),
    found: s => ({ rows: (s.yard && s.yard.lines) || [] }),
    gloss: s => (s.yard && s.yard.lines ? 'VERA: Who is there: answered. Who comes from whom: an order of states' + (s.yard.root ? ', starting among the ' + s.yard.root : '') + '.' : null),
    open: [
      { tag: 'DESCENT: NOT SHOWN', say: 'VERA: Now what we did not show. Nothing here proves that one cell came from another. That takes lineage tracing.' },
      { tag: 'HOW LONG A STEP TAKES: NOT KNOWN', say: 'VERA: We did not show how long any step takes either. The board says as much itself.' },
      { tag: 'WHICH FATE A CELL TAKES: NOT ASKED', say: 'VERA: And which fate a cell takes, we did not ask. That stage is still a building site.' },
    ],
  },
};
})();
