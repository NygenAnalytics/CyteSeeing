/* The brain cell system's pack for the Marshalling Yard (stage 5 of the cortex project): the cells of the line, their genes, and what each station says about them.
   It is loaded with the stage, after js/systems/brain.js. js/data/line.js generates the cells from the numbers here.
   Developing cortex at three ages. Radial glia are the stem cells. They give rise to intermediate progenitors, which give rise
   to excitatory neurons, which then mature. Radial glia also give rise to oligodendrocyte precursors. Interneurons are born
   in the ganglionic eminences, outside the cortex, and migrate in. */
(function () {
'use strict';
G.systems.brain.order = {
  /* ---- the cells (js/data/line.js) ---- */
  /* The six states, each with a fixed job in the data module, by position: the first four are the line, in order, and
     `span` is the stretch of the hidden process each one covers. The fifth is a spur off the first. The sixth is apart.
     name: on a plate. short: a tag on the map. word: in a sentence. */
  states: [
    { id: 'RG', name: 'RADIAL GLIA', short: 'RADIAL GLIA', word: 'radial glia', span: [0, 0.3] },
    { id: 'IPC', name: 'PROGENITORS', short: 'PROGENITORS', word: 'intermediate progenitors', span: [0.3, 0.45] },
    { id: 'NEW', name: 'NEWBORN NEURONS', short: 'NEWBORN', word: 'newborn neurons', span: [0.45, 0.7] },
    { id: 'MAT', name: 'MATURING NEURONS', short: 'MATURING', word: 'maturing neurons', span: [0.7, 1] },
    { id: 'OPC', name: 'OPC', short: 'OPC', word: 'oligodendrocyte precursors' },
    { id: 'INH', name: 'INTERNEURONS', short: 'INTERNEURONS', word: 'interneurons' },
  ],
  /* the three samples, youngest first. age: on the label of a train. mix: the share of a sample's line cells in each of
     the four states. Older tissue has had longer to make neurons. spur, apart: how many cells of the last two states. */
  samples: [
    { age: '14 WEEKS', n: 110, mix: [0.5, 0.16, 0.21, 0.13], spur: 10, apart: 10 },
    { age: '17 WEEKS', n: 110, mix: [0.37, 0.14, 0.23, 0.26], spur: 12, apart: 12 },
    { age: '20 WEEKS', n: 110, mix: [0.26, 0.11, 0.22, 0.41], spur: 14, apart: 14 },
  ],
  /* where the radial glia crowd: most of them sit in one short stretch of the process, as a pool of dividing stem cells does */
  crowd: { span: [0.06, 0.2], share: 0.45 },
  /* how many of the cells of the first two states are caught dividing */
  dividing: [0.3, 0],
  /* where the spur leaves the line, and how far along the spur its cells are spread */
  spur: { from: 0.12, reach: [0.05, 1] },
  /* name, shape along the line, then for a shape that changes: where, how sharply, and the mean count per cell at its height.
     Then the mean count in an oligodendrocyte precursor and in an interneuron.
     fall: on from the start, off after `where`. rise: off, then on. bump: on for a while around `where`.
     cycle: on in dividing cells only. off: not made on the line. house: the same in every cell. */
  genes: [
    ['ACTB', 'house', 40], ['MALAT1', 'house', 60], ['EEF1A1', 'house', 30], ['TMSB4X', 'house', 30], ['RPL13', 'house', 30], ['RPS27', 'house', 30],
    /* radial glia */
    ['SOX2', 'fall', 0.27, 0.03, 4, 3, 0.3], ['PAX6', 'fall', 0.25, 0.03, 2.8, 0.15, 0.1], ['HES1', 'fall', 0.23, 0.03, 2.4, 1.2, 0.05],
    ['VIM', 'fall', 0.28, 0.03, 6, 3, 0.3], ['SOX9', 'fall', 0.26, 0.03, 1.8, 1.4, 0.15], ['SLC1A3', 'fall', 0.26, 0.03, 3.2, 1.6, 0.1],
    /* dividing cells */
    ['TOP2A', 'cycle', 1.6, 0.3, 0.05], ['MKI67', 'cycle', 1, 0.2, 0.03],
    /* intermediate progenitors: a short wave */
    ['NEUROG2', 'bump', 0.315, 0.04, 3, 0, 0], ['EOMES', 'bump', 0.375, 0.022, 3.2, 0, 0], ['PPP1R17', 'bump', 0.385, 0.035, 3, 0, 0],
    /* the switch from progenitor to neuron */
    ['NEUROD1', 'bump', 0.53, 0.1, 2.8, 0, 0], ['SLC17A6', 'bump', 0.53, 0.08, 2.2, 0, 0],
    /* neurons */
    ['STMN2', 'rise', 0.44, 0.04, 7, 0.5, 7], ['DCX', 'rise', 0.46, 0.04, 2.6, 0.5, 2.6], ['NEUROD2', 'rise', 0.5, 0.03, 2.2, 0, 0.1],
    ['NEUROD6', 'rise', 0.52, 0.03, 3, 0, 0.1], ['SLA', 'rise', 0.5, 0.035, 2.4, 0, 0.1], ['TBR1', 'rise', 0.57, 0.03, 2.8, 0, 0.05],
    ['SYT1', 'rise', 0.6, 0.05, 3.6, 0.4, 3.6], ['SATB2', 'rise', 0.66, 0.04, 2.4, 0.1, 0.1], ['MEF2C', 'rise', 0.7, 0.045, 3, 0.3, 2.4],
    /* neurons that have settled */
    ['MAPT', 'rise', 0.72, 0.05, 2, 0.4, 2], ['SNAP25', 'rise', 0.72, 0.04, 4, 0.4, 3.4], ['GRIN2B', 'rise', 0.77, 0.03, 2.8, 0.3, 1.2],
    /* oligodendrocyte precursors */
    ['OLIG1', 'off', 4, 0], ['OLIG2', 'off', 3, 0], ['PDGFRA', 'off', 5, 0], ['SOX10', 'off', 2, 0], ['EGFR', 'off', 2, 0.05], ['PCDH15', 'off', 4, 0.2],
    /* interneurons */
    ['GAD1', 'off', 0.1, 2.6], ['GAD2', 'off', 0, 2.2], ['DLX2', 'off', 0, 2.2], ['DLX5', 'off', 0, 2.4], ['DLX6-AS1', 'off', 0, 5],
  ],

  /* ---- 5-1, the turntable ---- */
  /* the two genes on the lamps, and what Jun says each one is. stem: the cells the line starts from, in a sentence and at the
     head of one. label: what that cluster is called in the code. sink: the cluster at the far end, for a tool that wants one. */
  turntable: { early: 'SOX2', late: 'SNAP25', earlyIs: 'from radial glia, the stem cells', lateIs: 'from settled neurons',
    stem: 'radial glia', Stem: 'Radial glia', label: 'radial glia', sink: 'maturing neuron' },

  /* ---- 5-2, the track ---- */
  /* tag: where the name of each island goes on the map, by position in `states` (above, below, left or right of it).
     apart: what Jun says when a wagon stops short of the cells that came from elsewhere. born: the same, for the notebook. */
  track: { tag: ['S', 'E', 'W', 'S', 'E', 'S'],
    apart: 'Interneurons are born outside the cortex and migrate in. They are in this tissue, and they are not on this line.',
    born: 'Cortical <b>interneurons</b> are born below the cortex, in the ganglionic eminences, and migrate in. A sample of cortex holds them with none of their own progenitors, so no path through these cells leads to them. Oligodendrocyte precursors are different: some arise from the radial glia of the cortex itself.',
    groups: 'cell_type' },

  /* ---- 5-3, the timetable ---- */
  /* the five genes in the order they come on along the line, as published. brief: the gene of the short wave, and whose it is.
     order: a field note on that order. */
  timetable: { genes: ['PAX6', 'EOMES', 'NEUROD1', 'TBR1', 'GRIN2B'], brief: 'EOMES',
    order: 'PAX6, EOMES (also called TBR2), NEUROD1 and TBR1 come on one after another as radial glia become intermediate progenitors and then neurons. GRIN2B, part of a receptor at synapses, follows as the neurons settle.',
    path: ['radial glia', 'IPC', 'newborn neuron', 'maturing neuron'] },

  /* ---- 5-4, the clock ---- */
  /* older: why older tissue stands further along. ringed, bracketed: the two states Jun marks for his last question, by position
     in `states`. mark: how he points them out. kin: what he says once it is answered. layers: the same, for the notebook. */
  clock: { older: 'Older tissue has had longer to make neurons',
    ringed: 2, bracketed: 3,
    mark: 'One wagon of the oldest train is ringed: a newborn neuron. In the youngest train, the maturing neurons are bracketed.',
    kin: ['No. The bracketed neurons were there weeks before the ringed one was born, and lie in deeper layers than it will.',
      'The two stand on one line of states. That is not one line of descent.'],
    layers: 'The neurons of the deep layers of the cortex are born first, and those of the upper layers later. So the maturing neurons of an early sample and the newborn neurons of a late one are different cells with different fates, though they stand on one line of states. Descent is shown by lineage tracing, in which cells carry a mark that their daughters inherit.' },

  /* ---- the departure board ---- */
  /* plates: the states that have a plate, by position in `states`. genes: what the flaps can show, in the order they turn.
     ask: what is said at the start. apart: when a plate that is not on the line stands on it. push, pushOpts: Vera wants
     times. held, gave: what she says to each answer. why: what Jun says to the wrong one. done: at the end. */
  board: { plates: [3, 5, 1, 0, 2], genes: ['GRIN2B', 'EOMES', 'GAD2', 'PAX6', 'TBR1', 'NEUROD1'],
    ask: ['VERA: Group meeting on Friday. I want the order of events on that board: every kind of cell, and a gene to know it by.',
      'VERA: And times. How long each step takes, in days. Hours, if you have them.',
      'JUN: Slide a plate on to each rail in the order of the line. Turn each flap to a gene of those cells. Pull the signal.'],
    apart: 'Interneurons do not stand on this line. No test wagon found a way to them.',
    push: ['VERA: The order is up. Now the times. From radial glia to settled neuron: how many days? Put it on the board.'],
    pushOpts: ['HANG "UNKNOWN"', 'WRITE IN THE DAYS'],
    why: 'JUN: The board cannot carry that. A stretch of this line is long where many genes change, not where much time passes.',
    held: 'VERA: "Unknown", on a timetable. Fine. Then the next experiment is the one that puts days on it.',
    gave: 'VERA: Then "unknown" it is. And the next experiment is the one that puts days on it.',
    done: 'JUN: That board says what the yard can stand behind, and nothing more. It will hold on Friday.' },

  /* what the next stage of the project does, as Jun puts it when this one is finished */
  next: 'asks which fate each cell takes',
};
})();
