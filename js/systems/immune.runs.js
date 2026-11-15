/* The immune cell system's pack for the Laundry (stage 4): cell types and gene table of the three runs, and what each station says about them.
   It is loaded with the stage, after js/systems/immune.js.
   Monday's and Thursday's runs hold the same five cell types. Thursday's also holds platelets, and
   the run of a month later holds plasma cells, which neither has. */
(function () {
'use strict';
G.systems.immune.runs = {
  /* what the cells really are, and how many of each kind every load holds. label: what one such
     cell is called on a reference. short: the name tag on a map. mark: the gene the label is known by. */
  types: [
    { id: 'CD4T', name: 'CD4 T CELLS', label: 'CD4 T CELL', short: 'CD4 T', mark: 'IL7R', n: [40, 34, 16], size: 0.95 },
    { id: 'CD8T', name: 'CD8 T CELLS', label: 'CD8 T CELL', short: 'CD8 T', mark: 'CD8B', n: [22, 20, 9], size: 0.95 },
    { id: 'NK', name: 'NK CELLS', label: 'NK CELL', short: 'NK', mark: 'GNLY', n: [18, 16, 8], size: 1 },
    { id: 'B', name: 'B CELLS', label: 'B CELL', short: 'B', mark: 'MS4A1', n: [24, 20, 12], size: 0.95 },
    { id: 'MONO', name: 'MONOCYTES', label: 'MONOCYTE', short: 'MONO', mark: 'CD14', n: [32, 28, 14], size: 1.1 },
    { id: 'PLT', name: 'PLATELETS', label: 'PLATELET', short: 'PLT', mark: 'PPBP', n: [0, 14, 0], size: 0.45 },
    { id: 'PLASMA', name: 'PLASMA CELLS', label: 'PLASMA CELL', mark: 'JCHAIN', n: [0, 0, 7], size: 1.3 },
  ],
  /* name, kind, then the mean count in CD4 T, CD8 T, NK, B, monocytes, platelets and plasma cells */
  genes: [
    ['ACTB', 'house', 600], ['MALAT1', 'house', 800], ['B2M', 'house', 500], ['EEF1A1', 'house', 400],
    ['TMSB4X', 'house', 450], ['FTL', 'house', 300], ['TPT1', 'house', 350], ['GAPDH', 'house', 250],
    ['RPS27', 'ribo', 620, 540, 430, 560, 330, 120, 300], ['RPL13', 'ribo', 560, 500, 400, 520, 320, 110, 280],
    ['MT-CO1', 'mito', 250],
    /* what waiting on the bench does to a cell: the same genes rise in every kind */
    ['JUN', 'stress', 2.5], ['FOS', 'stress', 3], ['DUSP1', 'stress', 2], ['HSPA1A', 'stress', 1], ['IER2', 'stress', 2],
    ['CD3E', 'mark', 3.5, 3.2, 0.15, 0, 0, 0, 0], ['CD3D', 'mark', 3, 3, 0.1, 0, 0, 0, 0], ['TRAC', 'mark', 3.2, 3, 0.05, 0, 0, 0, 0],
    ['IL32', 'mark', 5, 8, 4, 0.1, 0.1, 0, 0.1], ['CD2', 'mark', 2.2, 2.6, 1.6, 0, 0, 0, 0], ['CD7', 'mark', 2, 2.4, 3.5, 0, 0, 0, 0],
    ['LTB', 'mark', 5, 1.6, 0.3, 4.5, 0.1, 0, 0.2], ['IL7R', 'mark', 3.5, 1.2, 0.1, 0.1, 0.1, 0, 0],
    ['CCR7', 'mark', 1.4, 0.5, 0, 0.6, 0, 0, 0], ['TCF7', 'mark', 1.8, 0.9, 0.3, 0.1, 0, 0, 0], ['MAL', 'mark', 1.5, 0.15, 0, 0, 0, 0, 0],
    ['LDHB', 'mark', 5, 3, 1.6, 2.4, 0.8, 0.1, 1],
    ['CD8A', 'mark', 0.02, 2.2, 0.25, 0, 0, 0, 0], ['CD8B', 'mark', 0.02, 2.6, 0, 0, 0, 0, 0], ['GZMK', 'mark', 0.15, 2.6, 0.15, 0, 0, 0, 0],
    ['CCL5', 'mark', 0.5, 9, 8, 0, 0.15, 7, 0], ['NKG7', 'mark', 0.2, 5, 14, 0, 0.08, 0, 0], ['GZMA', 'mark', 0.15, 3, 4.5, 0, 0, 0, 0],
    ['CST7', 'mark', 0.3, 2.6, 3.5, 0, 0, 0, 0], ['GNLY', 'mark', 0.08, 0.9, 13, 0, 0, 0, 0], ['KLRF1', 'mark', 0, 0.04, 2.2, 0, 0, 0, 0],
    ['KLRD1', 'mark', 0.05, 0.7, 3, 0, 0, 0, 0], ['PRF1', 'mark', 0.05, 0.9, 3.5, 0, 0, 0, 0],
    ['FCER1G', 'mark', 0, 0.08, 4.5, 0, 6, 1.5, 0], ['TYROBP', 'mark', 0.08, 0.15, 8, 0.08, 12, 1, 0],
    ['MS4A1', 'mark', 0, 0, 0, 3.5, 0, 0, 0.1], ['CD79A', 'mark', 0, 0, 0, 6, 0, 0, 3], ['CD79B', 'mark', 0.15, 0.15, 0.15, 5, 0, 0, 0.5],
    ['BANK1', 'mark', 0, 0, 0, 2, 0, 0, 0], ['IGHM', 'mark', 0, 0, 0, 7, 0, 0, 2], ['TCL1A', 'mark', 0, 0, 0, 1.6, 0, 0, 0],
    ['CD74', 'mark', 0.8, 1, 1, 22, 14, 0.3, 6], ['HLA-DRA', 'mark', 0.4, 0.6, 0.4, 18, 12, 0.2, 2],
    ['LYZ', 'mark', 0.2, 0.2, 0.2, 0.2, 28, 0.5, 0.2], ['S100A8', 'mark', 0.15, 0.15, 0.15, 0.15, 24, 0.8, 0.1], ['S100A9', 'mark', 0.15, 0.15, 0.15, 0.15, 30, 1, 0.1],
    ['CD14', 'mark', 0, 0, 0, 0, 3.2, 0, 0], ['FCN1', 'mark', 0, 0, 0, 0, 9, 0, 0], ['VCAN', 'mark', 0, 0, 0, 0, 3.5, 0, 0],
    ['MNDA', 'mark', 0.2, 0.2, 0.2, 0.4, 18, 0.5, 0.3], ['AIF1', 'mark', 0.2, 0.2, 0.2, 0.2, 8, 0.3, 0], ['LST1', 'mark', 0.15, 0.15, 0.5, 0.15, 7, 0.2, 0],
    ['PPBP', 'mark', 0, 0, 0, 0, 0.1, 25, 0], ['PF4', 'mark', 0, 0, 0, 0, 0.05, 14, 0], ['GNG11', 'mark', 0, 0, 0, 0, 0.05, 8, 0],
    ['TUBB1', 'mark', 0, 0, 0, 0, 0, 6, 0], ['GP9', 'mark', 0, 0, 0, 0, 0, 3, 0], ['NRGN', 'mark', 0, 0, 0, 0, 0.2, 7, 0], ['CLU', 'mark', 0, 0, 0, 0, 0.1, 5, 0],
    ['MZB1', 'mark', 0, 0, 0, 0.05, 0, 0, 9], ['JCHAIN', 'mark', 0, 0, 0, 0.05, 0, 0, 20], ['IGHG1', 'mark', 0, 0, 0, 0.02, 0, 0, 30],
    ['XBP1', 'mark', 0.3, 0.3, 0.3, 0.6, 0.4, 0, 10], ['IGKC', 'mark', 0, 0, 0, 8, 0, 0, 60], ['TNFRSF17', 'mark', 0, 0, 0, 0, 0, 0, 2], ['PRDM1', 'mark', 0.1, 0.3, 0.3, 0, 0, 0, 2.5],
  ],
  /* three slots of `types` that the runs are built around. bench: monocytes take being left on the bench worse than lymphocytes do */
  bench: 4,
  /* the cells only Thursday's run holds: a wash that is too strong pushes them in among other cells */
  lone: { slot: 5, word: 'platelets' },
  /* the cells only the third run holds (the last row of `types`). called: the slot whose label the reference gives them.
     found: what is said once the player has flagged them. */
  unseen: { word: 'plasma cells', called: 3,
    found: 'Plasma cells. The reference holds none, so each took the label of its nearest relative, and every neighbour agreed.' },
  /* what the next stage of the project does, as Bea puts it when this one is finished */
  next: 'compares patients with controls',
  /* the counter: the two conditions that Vera's study plans compare */
  counter: {
    /* the letter on a cap, the word in the key, and the tag under a tube */
    caps: ['P', 'C'], key: ['PATIENT', 'CONTROL'], tag: ['PAT', 'CTL'],
    /* in a sentence: many of each, one of the first, both together, and what each donor is */
    many: ['patients', 'controls'], one: 'patient', both: 'patients and controls', either: 'a patient or a control',
    /* what the condition stands for, what Vera's third plan wants to see, and what she calls the donors */
    what: 'disease', asks: "patients' cells do that controls' do not", donors: 'people',
    /* her second plan: why no sample can change its day */
    days: 'VERA: Next study. The clinic only draws patients on Mondays. The controls are students, and they only turn up on Thursdays.',
    /* where this project compares its conditions by a test */
    test: 'floor 5',
  },
};
})();
