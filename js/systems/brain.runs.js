/* The brain cell system's pack for the Laundry (stage 4): cell types and gene table of the three runs, and what each station says about them.
   It is loaded with the stage, after js/systems/brain.js.
   Monday's and Thursday's runs hold the same five cell types of the developing cortex. Thursday's
   run also caught microglia, which are scarce at this age. The run of a month later holds
   striatal neurons, from a cut that went too deep: inhibitory neurons of the striatum, which
   neither earlier run has. They make GAD2 and GAD1, as cortical interneurons do, so those genes
   cannot tell the two apart. NXPH1 can: cortical interneurons carry it, and the striatal cells lack it.
   The numbers are those of the blood pack, slot for slot, so every wash and every mapping behaves
   the same way. Four numbers differ, where the cortex does. Striatal neurons make SNAP25.
   Microglia make MEF2C and no SLC17A6, and carry more CX3CR1: with less of it the wash at
   theta 4 no longer leaves them apart from the neurons. */
(function () {
'use strict';
G.systems.brain.runs = {
  /* what the cells really are, and how many of each kind every load holds. label: what one such
     cell is called on a reference, cut short to fit its panel. short: the name tag on a map.
     mark: the gene the label is known by. */
  types: [
    { id: 'DLN', name: 'DEEP-LAYER NEURONS', label: 'DEEP-LAYER', short: 'DEEP', mark: 'SEMA3E', n: [40, 34, 16], size: 0.95 },
    { id: 'NEW', name: 'NEWBORN NEURONS', label: 'NEWBORN', short: 'NEWBORN', mark: 'BHLHE22', n: [22, 20, 9], size: 0.95 },
    { id: 'IPC', name: 'INTERMEDIATE PROGENITORS', label: 'IPC', short: 'IPC', mark: 'PPP1R17', n: [18, 16, 8], size: 1 },
    { id: 'INH', name: 'INTERNEURONS', label: 'INTERNEURON', short: 'INH', mark: 'NXPH1', n: [24, 20, 12], size: 0.95 },
    { id: 'RG', name: 'RADIAL GLIA', label: 'RADIAL GLIA', short: 'RG', mark: 'PAX6', n: [32, 28, 14], size: 1.1 },
    { id: 'MG', name: 'MICROGLIA', label: 'MICROGLIA', short: 'MG', mark: 'AIF1', n: [0, 14, 0], size: 0.45 },
    { id: 'MSN', name: 'STRIATAL NEURONS', label: 'STRIATAL NEURON', mark: 'EBF1', n: [0, 0, 7], size: 1.3 },
  ],
  /* the name tags are short forms, so the notebook at Lost and found says each one in full */
  spell: true,
  /* name, kind, then the mean count in deep-layer neurons, newborn neurons, intermediate progenitors,
     interneurons, radial glia, microglia and striatal neurons */
  genes: [
    ['ACTB', 'house', 600], ['MALAT1', 'house', 800], ['B2M', 'house', 500], ['EEF1A1', 'house', 400],
    ['TMSB4X', 'house', 450], ['FTL', 'house', 300], ['TPT1', 'house', 350], ['GAPDH', 'house', 250],
    ['RPS27', 'ribo', 620, 540, 430, 560, 330, 120, 300], ['RPL13', 'ribo', 560, 500, 400, 520, 320, 110, 280],
    ['MT-CO1', 'mito', 250],
    /* what waiting on the bench does to a cell: the same genes rise in every kind */
    ['JUN', 'stress', 2.5], ['FOS', 'stress', 3], ['DUSP1', 'stress', 2], ['HSPA1A', 'stress', 1], ['IER2', 'stress', 2],
    ['SATB2', 'mark', 3.5, 3.2, 0.15, 0, 0, 0, 0], ['NEUROD6', 'mark', 3, 3, 0.1, 0, 0, 0, 0], ['NEUROD2', 'mark', 3.2, 3, 0.05, 0, 0, 0, 0],
    ['SLA', 'mark', 5, 8, 4, 0.1, 0.1, 0, 0.1], ['ZBTB18', 'mark', 2.2, 2.6, 1.6, 0, 0, 0, 0], ['SEMA3C', 'mark', 2, 2.4, 3.5, 0, 0, 0, 0],
    ['SNAP25', 'mark', 5, 1.6, 0.3, 4.5, 0.1, 0, 4.5], ['SEMA3E', 'mark', 3.5, 1.2, 0.1, 0.1, 0.1, 0, 0],
    ['MEF2C', 'mark', 1.4, 0.5, 0, 0.6, 0, 1, 0], ['TBR1', 'mark', 1.8, 0.9, 0.3, 0.1, 0, 0, 0], ['CRYM', 'mark', 1.5, 0.15, 0, 0, 0, 0, 0],
    ['CELF2', 'mark', 5, 3, 1.6, 2.4, 0.8, 0.1, 1],
    ['NRP1', 'mark', 0.02, 2.2, 0.25, 0, 0, 0, 0], ['BHLHE22', 'mark', 0.02, 2.6, 0, 0, 0, 0, 0], ['CPNE8', 'mark', 0.15, 2.6, 0.15, 0, 0, 0, 0],
    ['SLC17A6', 'mark', 0.5, 9, 8, 0, 0.15, 0, 0], ['SSTR2', 'mark', 0.2, 5, 14, 0, 0.08, 0, 0], ['NEUROD1', 'mark', 0.15, 3, 4.5, 0, 0, 0, 0],
    ['NEUROG2', 'mark', 0.3, 2.6, 3.5, 0, 0, 0, 0], ['PPP1R17', 'mark', 0.08, 0.9, 13, 0, 0, 0, 0], ['EOMES', 'mark', 0, 0.04, 2.2, 0, 0, 0, 0],
    ['NHLH1', 'mark', 0.05, 0.7, 3, 0, 0, 0, 0], ['NEUROD4', 'mark', 0.05, 0.9, 3.5, 0, 0, 0, 0],
    ['TOP2A', 'mark', 0, 0.08, 4.5, 0, 6, 1.5, 0], ['HMGB2', 'mark', 0.08, 0.15, 8, 0.08, 12, 1, 0],
    ['NXPH1', 'mark', 0, 0, 0, 3.5, 0, 0, 0.1], ['GAD2', 'mark', 0, 0, 0, 6, 0, 0, 3], ['DLX2', 'mark', 0.15, 0.15, 0.15, 5, 0, 0, 0.5],
    ['DLX1', 'mark', 0, 0, 0, 2, 0, 0, 0], ['GAD1', 'mark', 0, 0, 0, 7, 0, 0, 2], ['LHX6', 'mark', 0, 0, 0, 1.6, 0, 0, 0],
    /* ARX stands where the Bureau's table has NPAS3: striatal neurons make NPAS3 too, and little ARX */
    ['SOX6', 'mark', 0.8, 1, 1, 22, 14, 0.3, 6], ['ARX', 'mark', 0.4, 0.6, 0.4, 18, 12, 0.2, 2],
    ['TTYH1', 'mark', 0.2, 0.2, 0.2, 0.2, 28, 0.5, 0.2], ['TAGLN2', 'mark', 0.15, 0.15, 0.15, 0.15, 24, 0.8, 0.1], ['FBXO32', 'mark', 0.15, 0.15, 0.15, 0.15, 30, 1, 0.1],
    ['PDGFD', 'mark', 0, 0, 0, 0, 3.2, 0, 0], ['PAX6', 'mark', 0, 0, 0, 0, 9, 0, 0], ['CRYAB', 'mark', 0, 0, 0, 0, 3.5, 0, 0],
    ['BCAN', 'mark', 0.2, 0.2, 0.2, 0.4, 18, 0.5, 0.3], ['HOPX', 'mark', 0.2, 0.2, 0.2, 0.2, 8, 0.3, 0], ['SOX9', 'mark', 0.15, 0.15, 0.5, 0.15, 7, 0.2, 0],
    ['AIF1', 'mark', 0, 0, 0, 0, 0.1, 25, 0], ['C1QB', 'mark', 0, 0, 0, 0, 0.05, 14, 0], ['CX3CR1', 'mark', 0, 0, 0, 0, 0.05, 15, 0],
    ['P2RY12', 'mark', 0, 0, 0, 0, 0, 6, 0], ['CSF1R', 'mark', 0, 0, 0, 0, 0, 3, 0], ['TYROBP', 'mark', 0, 0, 0, 0, 0.2, 7, 0], ['CD74', 'mark', 0, 0, 0, 0, 0.1, 5, 0],
    ['RXRG', 'mark', 0, 0, 0, 0.05, 0, 0, 9], ['EBF1', 'mark', 0, 0, 0, 0.05, 0, 0, 20], ['RARB', 'mark', 0, 0, 0, 0.02, 0, 0, 30],
    ['PDE10A', 'mark', 0.3, 0.3, 0.3, 0.6, 0.4, 0, 10], ['PBX3', 'mark', 0, 0, 0, 8, 0, 0, 60], ['ISL1', 'mark', 0, 0, 0, 0, 0, 0, 2], ['PENK', 'mark', 0.1, 0.3, 0.3, 0, 0, 0, 2.5],
  ],
  /* three slots of `types` that the runs are built around. bench: some cell types show a wait on the bench more than
     others, and in these runs the cells of this slot do. It is the slot the blood pack uses, so that the runs come out
     alike: a choice of the game, not a finding about radial glia. */
  bench: 4,
  /* the cells only Thursday's run holds: a wash that is too strong pushes them in among other cells */
  lone: { slot: 5, word: 'microglia' },
  /* the cells only the third run holds (the last row of `types`). called: the slot whose label the reference gives them.
     found: what is said once the player has flagged them. */
  unseen: { word: 'striatal neurons', called: 3,
    found: 'Striatal neurons. The reference has none, so each took the label of its nearest relative, and every neighbour agreed.' },
  /* what the next stage of the project does, as Bea puts it when this one is finished */
  next: 'asks in what order the cells arise',
  /* the counter: the two conditions that Vera's study plans compare. Here they are two ages of tissue. */
  counter: {
    /* the letter on a cap, the word in the key, and the tag under a tube */
    caps: ['E', 'L'], key: ['EARLY', 'LATE'], tag: ['EAR', 'LAT'],
    /* in a sentence: many of each, one of the first, both together, and what each donor is */
    many: ['early samples', 'late ones'], one: 'early sample', both: 'early and late samples', either: 'early or late',
    /* what the condition stands for, what Vera's third plan wants to see, and what she calls the donors */
    what: 'age', asks: 'late cells do that early cells do not', donors: 'donors',
    /* her second plan: why no sample can change its day */
    days: 'VERA: Next study. The tissue bank only sends early tissue on Mondays. Late tissue comes from another bank, and only on Thursdays.',
  },
};
})();
