/* The brain cell system's pack for the Bureau (stage 3): cell types, gene table, references, and what each station says about them.
   It is loaded with the stage, after js/systems/brain.js.
   The sample is developing human cortex at mid-gestation. The numbers are those of the blood pack,
   slot for slot and row for row, so the maths behaves the same way; the names and the kinship
   between the cell types are the cortex's own. A cell type is named here by its id, and the
   stations look up which cluster it became. */
(function () {
'use strict';
G.systems.brain.who = {
  /* ---- the cells (js/data/atlas.js) ---- */
  /* what the cells really are. The player never sees this: clusters only get a name at the Name desk.
     Deep-layer neurons are the older excitatory neurons, and newborn neurons the young ones, still
     migrating. Interneurons are born elsewhere and migrate in.
     The eight slots have fixed jobs in the data module, by position: the second runs a programme at a
     different strength in every cell, some cells of the sixth are only part of the way there from the
     fifth, and the eighth is doublets, each the sum of a cell of the first and a cell of the fifth. */
  types: [
    { id: 'DLN', name: 'DEEP-LAYER NEURONS', n: 62, size: 0.95 }, { id: 'NEW', name: 'NEWBORN NEURONS', n: 34, size: 0.95 },
    { id: 'IPC', name: 'INTERMEDIATE PROGENITORS', n: 26, size: 1 }, { id: 'INH', name: 'INTERNEURONS', n: 36, size: 0.95 },
    { id: 'VRG', name: 'RADIAL GLIA', n: 54, size: 1.1 }, { id: 'ORG', name: 'OUTER RADIAL GLIA', n: 20, size: 1.1 },
    { id: 'OPC', name: 'OLIGODENDROCYTE PRECURSORS', n: 14, size: 1.05 }, { id: 'DBL', name: 'DOUBLETS', n: 12, size: 1 },
  ],
  /* name, kind, then the mean count in deep-layer neurons, newborn neurons, intermediate progenitors,
     interneurons, radial glia, outer radial glia and oligodendrocyte precursors at average depth.
     A doublet gets the sum of a deep-layer neuron and a radial glia cell. */
  genes: [
    ['ACTB', 'house', 600], ['MALAT1', 'house', 800], ['B2M', 'house', 500], ['EEF1A1', 'house', 400],
    ['TMSB4X', 'house', 450], ['FTL', 'house', 300], ['TPT1', 'house', 350], ['GAPDH', 'house', 250],
    /* ribosomal genes differ between cell types: real, strong, and no use for telling cell types apart */
    ['RPS27', 'ribo', 620, 540, 430, 560, 330, 330, 380], ['RPL13', 'ribo', 560, 500, 400, 520, 320, 320, 360],
    ['RPLP1', 'ribo', 450, 400, 330, 420, 270, 270, 300], ['RPS12', 'ribo', 420, 370, 300, 390, 240, 240, 270],
    ['MT-CO1', 'mito', 250], ['MT-ND1', 'mito', 200],
    ['SATB2', 'mark', 3.5, 3.2, 0.15, 0, 0, 0, 0], ['NEUROD6', 'mark', 3, 3, 0.1, 0, 0, 0, 0], ['NEUROD2', 'mark', 3.2, 3, 0.05, 0, 0, 0, 0],
    ['SLA', 'mark', 5, 8, 4, 0.1, 0.1, 0.1, 0.1], ['ZBTB18', 'mark', 2.2, 2.6, 1.6, 0, 0, 0, 0], ['SEMA3C', 'mark', 2, 2.4, 3.5, 0, 0, 0, 0],
    ['SNAP25', 'mark', 5, 1.6, 0.3, 4.5, 0.1, 0.1, 0.3], ['SEMA3E', 'mark', 3.5, 1.2, 0.1, 0.1, 0.1, 0, 0.1],
    /* FEZF2, the famous deep-layer gene, is a poor guide to deep-layer neurons: it is caught in few of them, and radial glia make it too */
    ['FEZF2', 'mark', 0.45, 0, 0, 0, 0.9, 1, 1.1],
    ['MEF2C', 'mark', 1.4, 0.5, 0, 0.6, 0, 0, 0.2], ['TBR1', 'mark', 1.8, 0.9, 0.3, 0.1, 0, 0, 0], ['CRYM', 'mark', 1.5, 0.15, 0, 0, 0, 0, 0],
    ['CELF2', 'mark', 5, 3, 1.6, 2.4, 0.8, 0.8, 1], ['NR4A2', 'mark', 0.04, 0, 0, 0, 0, 0, 0],
    ['NRP1', 'mark', 0.02, 2.2, 0.25, 0, 0, 0, 0], ['BHLHE22', 'mark', 0.02, 2.6, 0, 0, 0, 0, 0], ['CPNE8', 'mark', 0.15, 2.6, 0.15, 0, 0, 0, 0],
    ['SLC17A6', 'mark', 0.5, 9, 8, 0, 0.15, 0.15, 0], ['SSTR2', 'mark', 0.2, 5, 14, 0, 0.08, 0.3, 0], ['NEUROD1', 'mark', 0.15, 3, 4.5, 0, 0, 0, 0],
    ['NEUROG2', 'mark', 0.3, 2.6, 3.5, 0, 0, 0.15, 0], ['PPP1R17', 'mark', 0.08, 0.9, 13, 0, 0, 0, 0], ['EOMES', 'mark', 0, 0.04, 2.2, 0, 0, 0, 0],
    ['NHLH1', 'mark', 0.05, 0.7, 3, 0, 0, 0, 0], ['NEUROD4', 'mark', 0.05, 0.9, 3.5, 0, 0, 0.1, 0],
    /* genes of dividing cells, shared by intermediate progenitors and radial glia */
    ['TOP2A', 'mark', 0, 0.08, 4.5, 0, 6, 9, 4], ['HMGB2', 'mark', 0.08, 0.15, 8, 0.08, 12, 14, 8], ['CCND2', 'mark', 0, 0.08, 3, 0, 0.15, 8, 0.08],
    ['ERBB4', 'mark', 0, 0, 0, 3.5, 0, 0, 0], ['GAD2', 'mark', 0, 0, 0, 6, 0, 0, 0.08], ['DLX2', 'mark', 0.15, 0.15, 0.15, 5, 0, 0.15, 0.15],
    ['DLX1', 'mark', 0, 0, 0, 2, 0, 0, 0], ['GAD1', 'mark', 0, 0, 0, 7, 0, 0, 0], ['LHX6', 'mark', 0, 0, 0, 1.6, 0, 0, 0],
    ['MAF', 'mark', 0, 0, 0, 1.3, 0, 0, 0],
    /* genes that interneurons share with radial glia and with oligodendrocyte precursors */
    ['SOX6', 'mark', 0.8, 1, 1, 22, 14, 16, 30], ['NPAS3', 'mark', 0.4, 0.6, 0.4, 18, 12, 14, 28], ['ASCL1', 'mark', 0, 0, 0, 2, 0.5, 0.7, 5],
    ['TTYH1', 'mark', 0.2, 0.2, 0.2, 0.2, 28, 10, 11], ['TAGLN2', 'mark', 0.15, 0.15, 0.15, 0.15, 24, 1.5, 1], ['FBXO32', 'mark', 0.15, 0.15, 0.15, 0.15, 30, 3, 2],
    ['PDGFD', 'mark', 0, 0, 0, 0, 3.2, 0.25, 0.2], ['PAX6', 'mark', 0, 0, 0, 0, 9, 6, 0.7], ['CRYAB', 'mark', 0, 0, 0, 0, 3.5, 0.15, 0.08],
    ['BCAN', 'mark', 0.2, 0.2, 0.2, 0.4, 18, 16, 22], ['HOPX', 'mark', 0.2, 0.2, 0.2, 0.2, 8, 13, 6], ['SOX9', 'mark', 0.15, 0.15, 0.5, 0.15, 7, 14, 5],
    ['FAM107A', 'mark', 0, 0, 0, 0, 0.4, 4, 0.15], ['MOXD1', 'mark', 0, 0, 0, 0, 0.05, 2.4, 0.05],
    ['PDGFRA', 'mark', 0, 0, 0, 0, 0, 0, 4], ['OLIG1', 'mark', 0, 0, 0, 0, 0.03, 0, 3], ['OLIG2', 'mark', 0, 0, 0, 0.05, 0, 0, 2.4],
    ['SOX10', 'mark', 0, 0, 0, 0, 0, 0, 1.4], ['MBP', 'mark', 0, 0, 0, 0, 0, 0, 0.15],
    /* genes of drawers at the Name desk that the evidence in these cells does not reach: subplate neurons,
       CGE interneurons (these interneurons are the MGE kind) and astrocytes */
    ['ST18', 'mark', 0.1, 0, 0, 0, 0, 0, 0], ['NR2F2', 'mark', 0, 0, 0, 0.03, 0, 0, 0], ['SCGN', 'mark', 0, 0, 0, 0.03, 0, 0, 0], ['AQP4', 'mark', 0, 0, 0, 0, 0, 0, 0],
  ],
  /* genes of the switch from progenitor to neuron, which intermediate progenitors carry too. Every
     newborn neuron is at its own point of switching them off. CPNE8 runs with them, but is the
     newborn neurons' own. */
  programme: ['SLC17A6', 'SSTR2', 'NEUROD1', 'CPNE8', 'NEUROG2', 'PPP1R17', 'NEUROD4', 'NHLH1'],

  /* ---- the references (js/data/atlas.js, the Oracle, the Chief) ---- */
  /* far is from the wrong age, fit matches the sample but has a gap (it was made from younger tissue,
     so it has no oligodendrocyte precursors), broad has labels too coarse to help.
     like: what each label's profile is made of. A list of slots is the average of those cell types, a
     table is a profile of its own, and nothing is a cell type that shares no marker with these cells:
     it has nothing to correlate with, and never wins.
     short and made are the cartridge and its sticker. The other words go into what Ida and the Chief say. */
  refs: {
    far: { name: 'ADULT CORTEX ATLAS', short: 'ADULT CORTEX', made: ['MADE FROM: ADULT HUMAN CORTEX', 'LABELS: FINE'],
      labels: ['EXCITATORY NEURON', 'INHIBITORY NEURON', 'ASTROCYTE', 'OLIGODENDROCYTE', 'MICROGLIA', 'ENDOTHELIAL CELL'],
      /* an adult astrocyte does not divide, so its profile has none of the dividing genes */
      like: [[0, 1], [3], { TTYH1: 30, BCAN: 25, SOX9: 40, HOPX: 12, FAM107A: 6 }, null, null, null],
      word: 'adult', wrong: 'age', cell: 'an adult cell' },
    fit: { name: 'FETAL CORTEX ATLAS', short: 'FETAL CORTEX', made: ['MADE FROM: FETAL HUMAN CORTEX, A LITTLE YOUNGER', 'SAME KIT AS YOUR SAMPLE. LABELS: FINE'],
      labels: ['DEEP-LAYER NEURON', 'NEWBORN NEURON', 'IPC', 'MGE INTERNEURON', 'VENTRICULAR RG', 'OUTER RG'],
      like: [[0], [1], [2], [3], [4], [5]],
      word: 'fetal' },
    broad: { name: 'WHOLE-BRAIN ATLAS', short: 'WHOLE BRAIN', made: ['MADE FROM: ALL REGIONS OF THE DEVELOPING BRAIN', 'LABELS: BROAD'],
      labels: ['EXCITATORY NEURON', 'PROGENITOR', 'INHIBITORY NEURON', 'GLIA'],
      like: [[0, 1], [2], [3], [4, 5, 6]],
      blind: 'a radial glia cell from an OPC' },
  },

  /* ---- the hall (js/stages/who/bureau.js) ---- */
  /* what an old file in the cold cases calls its cells */
  hall: { vague: 'Neurons' },

  /* ---- the Line-up (js/stages/who/lineup.js) ---- */
  lineup: {
    /* role: which cluster (by what it really is). genes: the line-up.
       trap: a famous gene that is a poor marker. trapWhy is why, and ok is what Ida adds once the marker is
       pinned, if the player has not already heard it by pinning the trap.
       bright: a gene that is brighter than the marker, and shared with the neighbours.
       none: no gene fits, because the cluster is doublets. */
    rounds: [
      { role: 'INH', genes: ['SOX6', 'ACTB', 'ERBB4', 'NPAS3', 'GAD2'] },
      { role: 'DLN', genes: ['RPS27', 'SNAP25', 'FEZF2', 'CRYM', 'ST18'], trap: 'FEZF2',
        trapWhy: 'FEZF2 RNA is rarely caught, and radial glia make it too. A famous gene is not always a good marker.',
        ok: 'Pinned. Not FEZF2, the famous one: its RNA is rarely caught, and radial glia make it too.' },
      { role: 'ORG', genes: ['TTYH1', 'PAX6', 'FAM107A', 'HOPX', 'MOXD1'], bright: 'TTYH1' },
      { role: 'DBL', genes: ['PDGFD', 'NEUROD6', 'FBXO32', 'TTYH1', 'TBR1'], none: true },
    ],
    /* pinned by Ida before the player arrives, so the board ends up complete */
    given: { VRG: 'CRYAB', NEW: 'BHLHE22', IPC: 'EOMES', OPC: 'PDGFRA' },
    /* the two sets of genes a doublet shows at once */
    both: 'Neuron genes and radial glia genes',
    /* the start of the note on famous markers */
    rna: 'A gene can be famous for what it does and still be a poor marker. FEZF2 RNA is caught in few cells.',
  },

  /* ---- the Name desk (js/stages/who/namedesk.js) ---- */
  name: {
    /* need: genes that should be in most of the cluster. lack: genes that should be in few. opts: the drawers inside.
       Names are kept short enough for a drawer front: IPC is an intermediate progenitor cell, RG is
       radial glia, OPC is an oligodendrocyte precursor cell. */
    tree: {
      root: { opts: ['IPC', 'EXC', 'INH', 'GLIA'] },
      EXC: { name: 'EXCITATORY NEURON', need: ['SATB2', 'NEUROD6', 'NEUROD2'], lack: ['TTYH1'], opts: ['NEW', 'DLN'] },
      IPC: { name: 'IPC', need: ['SSTR2', 'PPP1R17', 'EOMES'], lack: ['SATB2'] },
      INH: { name: 'INTERNEURON', need: ['ERBB4', 'GAD2', 'DLX2'], opts: ['CGE', 'MGE'] },
      GLIA: { name: 'GLIA', need: ['TTYH1', 'BCAN', 'HOPX'], lack: ['SATB2'], opts: ['RG', 'OLIG', 'ASTRO'] },
      DLN: { name: 'DEEP-LAYER NEURON', need: ['SEMA3E', 'CRYM'], lack: ['NRP1', 'BHLHE22'], opts: ['SUBPLATE'] },
      NEW: { name: 'NEWBORN NEURON', need: ['NRP1', 'BHLHE22'] },
      SUBPLATE: { name: 'SUBPLATE NEURON', need: ['NR4A2', 'ST18'] },
      /* interneurons are named by where they were born: the medial or the caudal ganglionic eminence */
      MGE: { name: 'MGE INTERNEURON', need: ['LHX6', 'MAF'] },
      CGE: { name: 'CGE INTERNEURON', need: ['NR2F2', 'SCGN'] },
      RG: { name: 'RADIAL GLIA', need: ['PAX6', 'TAGLN2'], lack: ['PDGFRA'], opts: ['VRG', 'ORG'] },
      VRG: { name: 'VENTRICULAR RG', need: ['PDGFD', 'CRYAB'] },
      ORG: { name: 'OUTER RG', need: ['FAM107A', 'MOXD1'] },
      OLIG: { name: 'OLIGODENDROGLIA', need: ['OLIG2', 'OLIG1'], opts: ['OPC', 'OL'] },
      OPC: { name: 'OPC', need: ['PDGFRA'], lack: ['MBP'] },
      OL: { name: 'OLIGODENDROCYTE', need: ['MBP'] },
      ASTRO: { name: 'ASTROCYTE', need: ['AQP4'] },
    },
    /* the clusters the player files, in order. Each file has its lesson: a cluster that looks like its
       neighbour until a gene it should lack is checked (done is what Ida adds), one whose evidence goes a
       drawer deeper than its broad name, and one where a subtype would be a guess. */
    cases: [
      { role: 'NEW', done: 'Filed. Intermediate progenitors carry the same differentiation genes. What they lack is SATB2.' },
      { role: 'INH', broad: 'interneuron' },
      { role: 'DLN' },
    ],
    /* the name on every file: what the evidence supports. Ida files the ones the player does not, and
       leaves one of hers broad on purpose: see the Oracle. */
    filed: { DLN: 'DEEP-LAYER NEURON', VRG: 'RADIAL GLIA', INH: 'MGE INTERNEURON', NEW: 'NEWBORN NEURON', IPC: 'IPC', ORG: 'OUTER RG', OPC: 'OPC', DBL: 'DOUBLETS' },
    /* the start of the note on genes a cell type should lack, and a Cell Ontology term to quote */
    neg: 'Newborn neurons and intermediate progenitors (IPCs) share SSTR2, NEUROD1 and NEUROG2. SATB2 is in most excitatory neurons and in few IPCs.',
    onto: 'interneuron is CL:0000099',
    /* for the code: known markers by cell type, and the genes that decide between two names */
    known: [['exc neuron', ['SATB2', 'NEUROD6']], ['IPC', ['EOMES', 'PPP1R17']], ['interneuron', ['ERBB4', 'GAD2']], ['glia', ['TTYH1', 'BCAN']]],
    decide: ['SATB2', 'SSTR2', 'PPP1R17'],
  },

  /* ---- the Oracle (js/stages/who/oracle.js) ---- */
  oracle: {
    /* the two names that differ once the fitting reference is in, by what the cluster really is, and
       the genes to look at (their numbers are shown on the screen).
       take: the machine is right, because its name is narrower than the one on file.
       keep: the machine is wrong and sure of itself, because its reference has none of these cells. */
    take: { role: 'VRG', genes: ['PDGFD', 'TAGLN2', 'MOXD1'] },
    keep: { role: 'OPC', genes: ['PDGFRA', 'OLIG2', 'MOXD1'], missing: 'OPCs' },
    /* what a gene is better known as, where a player may know the other name: none here */
    alias: {},
    /* for the code: a CellTypist model, the reference SingleR loads, and what CyteType is told about the study */
    model: 'Developing_Human_Brain.pkl',
    singler: { load: '', ref: '<span class="k">readRDS</span>(<span class="s">"fetal_cortex.rds"</span>)', labels: 'ref$cell_type' },
    context: ['Human cortex at ', 'mid-gestation, from one donor.'],
  },

  /* ---- the Chief (js/stages/who/chief.js) ---- */
  chief: {
    /* rna: a cluster with more RNA than most that is not doublets. sure: the cluster the far reference
       is surest of. shared: two clusters and one gene they both carry. */
    rna: 'INH', sure: 'VRG', shared: ['IPC', 'ORG', 'CCND2'],
    /* where the sample is from, and what one sample cannot settle */
    where: 'fetal cortex', whole: 'the human cortex',
  },
};
})();
