/* The immune cell system's pack for the Bureau (stage 3): cell types, gene table, references, and what each station says about them.
   It is loaded with the stage, after js/systems/immune.js.
   The stations and js/data/atlas.js hold the game and the maths. A cell type is named here by its id,
   and the stations look up which cluster it became. */
(function () {
'use strict';
G.systems.immune.who = {
  /* ---- the cells (js/data/atlas.js) ---- */
  /* what the cells really are. The player never sees this: clusters only get a name at the Name desk.
     The eight slots have fixed jobs in the data module, by position: the second runs a programme at a
     different strength in every cell, some cells of the sixth are only part of the way there from the
     fifth, and the eighth is doublets, each the sum of a cell of the first and a cell of the fifth. */
  types: [
    { id: 'CD4T', name: 'CD4 T CELLS', n: 62, size: 0.95 }, { id: 'CD8T', name: 'CD8 T CELLS', n: 34, size: 0.95 },
    { id: 'NK', name: 'NK CELLS', n: 26, size: 1 }, { id: 'B', name: 'B CELLS', n: 36, size: 0.95 },
    { id: 'MONO14', name: 'CD14 MONOCYTES', n: 54, size: 1.1 }, { id: 'MONO16', name: 'CD16 MONOCYTES', n: 20, size: 1.1 },
    { id: 'DC', name: 'DENDRITIC CELLS', n: 14, size: 1.05 }, { id: 'DBL', name: 'DOUBLETS', n: 12, size: 1 },
  ],
  /* name, kind, then the mean count in CD4 T, CD8 T, NK, B, CD14 monocytes, CD16 monocytes and
     dendritic cells at average depth. A doublet gets the sum of a CD4 T cell and a CD14 monocyte. */
  genes: [
    ['ACTB', 'house', 600], ['MALAT1', 'house', 800], ['B2M', 'house', 500], ['EEF1A1', 'house', 400],
    ['TMSB4X', 'house', 450], ['FTL', 'house', 300], ['TPT1', 'house', 350], ['GAPDH', 'house', 250],
    /* ribosomal genes run higher in T and B cells: real, strong, and no use for telling cell types apart */
    ['RPS27', 'ribo', 620, 540, 430, 560, 330, 330, 380], ['RPL13', 'ribo', 560, 500, 400, 520, 320, 320, 360],
    ['RPLP1', 'ribo', 450, 400, 330, 420, 270, 270, 300], ['RPS12', 'ribo', 420, 370, 300, 390, 240, 240, 270],
    ['MT-CO1', 'mito', 250], ['MT-ND1', 'mito', 200],
    ['CD3E', 'mark', 3.5, 3.2, 0.15, 0, 0, 0, 0], ['CD3D', 'mark', 3, 3, 0.1, 0, 0, 0, 0], ['TRAC', 'mark', 3.2, 3, 0.05, 0, 0, 0, 0],
    ['IL32', 'mark', 5, 8, 4, 0.1, 0.1, 0.1, 0.1], ['CD2', 'mark', 2.2, 2.6, 1.6, 0, 0, 0, 0], ['CD7', 'mark', 2, 2.4, 3.5, 0, 0, 0, 0],
    ['LTB', 'mark', 5, 1.6, 0.3, 4.5, 0.1, 0.1, 0.3], ['IL7R', 'mark', 3.5, 1.2, 0.1, 0.1, 0.1, 0, 0.1],
    /* CD4 the gene is a poor guide to CD4 T cells: it is caught in few of them, and monocytes make it too */
    ['CD4', 'mark', 0.45, 0, 0, 0, 0.9, 1, 1.1],
    ['CCR7', 'mark', 1.4, 0.5, 0, 0.6, 0, 0, 0.2], ['TCF7', 'mark', 1.8, 0.9, 0.3, 0.1, 0, 0, 0], ['MAL', 'mark', 1.5, 0.15, 0, 0, 0, 0, 0],
    ['LDHB', 'mark', 5, 3, 1.6, 2.4, 0.8, 0.8, 1], ['FOXP3', 'mark', 0.04, 0, 0, 0, 0, 0, 0],
    ['CD8A', 'mark', 0.02, 2.2, 0.25, 0, 0, 0, 0], ['CD8B', 'mark', 0.02, 2.6, 0, 0, 0, 0, 0], ['GZMK', 'mark', 0.15, 2.6, 0.15, 0, 0, 0, 0],
    ['CCL5', 'mark', 0.5, 9, 8, 0, 0.15, 0.15, 0], ['NKG7', 'mark', 0.2, 5, 14, 0, 0.08, 0.3, 0], ['GZMA', 'mark', 0.15, 3, 4.5, 0, 0, 0, 0],
    ['CST7', 'mark', 0.3, 2.6, 3.5, 0, 0, 0.15, 0], ['GNLY', 'mark', 0.08, 0.9, 13, 0, 0, 0, 0], ['KLRF1', 'mark', 0, 0.04, 2.2, 0, 0, 0, 0],
    ['KLRD1', 'mark', 0.05, 0.7, 3, 0, 0, 0, 0], ['PRF1', 'mark', 0.05, 0.9, 3.5, 0, 0, 0.1, 0],
    ['FCER1G', 'mark', 0, 0.08, 4.5, 0, 6, 9, 4], ['TYROBP', 'mark', 0.08, 0.15, 8, 0.08, 12, 14, 8], ['FCGR3A', 'mark', 0, 0.08, 3, 0, 0.15, 8, 0.08],
    ['MS4A1', 'mark', 0, 0, 0, 3.5, 0, 0, 0], ['CD79A', 'mark', 0, 0, 0, 6, 0, 0, 0.08], ['CD79B', 'mark', 0.15, 0.15, 0.15, 5, 0, 0.15, 0.15],
    ['BANK1', 'mark', 0, 0, 0, 2, 0, 0, 0], ['IGHM', 'mark', 0, 0, 0, 7, 0, 0, 0], ['TCL1A', 'mark', 0, 0, 0, 1.6, 0, 0, 0],
    ['IGHD', 'mark', 0, 0, 0, 1.3, 0, 0, 0],
    ['CD74', 'mark', 0.8, 1, 1, 22, 14, 16, 30], ['HLA-DRA', 'mark', 0.4, 0.6, 0.4, 18, 12, 14, 28], ['HLA-DQA1', 'mark', 0, 0, 0, 2, 0.5, 0.7, 5],
    ['LYZ', 'mark', 0.2, 0.2, 0.2, 0.2, 28, 10, 11], ['S100A8', 'mark', 0.15, 0.15, 0.15, 0.15, 24, 1.5, 1], ['S100A9', 'mark', 0.15, 0.15, 0.15, 0.15, 30, 3, 2],
    ['CD14', 'mark', 0, 0, 0, 0, 3.2, 0.25, 0.2], ['FCN1', 'mark', 0, 0, 0, 0, 9, 6, 0.7], ['S100A12', 'mark', 0, 0, 0, 0, 3.5, 0.15, 0.08],
    ['CST3', 'mark', 0.2, 0.2, 0.2, 0.4, 18, 16, 22], ['AIF1', 'mark', 0.2, 0.2, 0.2, 0.2, 8, 13, 6], ['LST1', 'mark', 0.15, 0.15, 0.5, 0.15, 7, 14, 5],
    ['MS4A7', 'mark', 0, 0, 0, 0, 0.4, 4, 0.15], ['CDKN1C', 'mark', 0, 0, 0, 0, 0.05, 2.4, 0.05],
    ['FCER1A', 'mark', 0, 0, 0, 0, 0, 0, 4], ['CLEC10A', 'mark', 0, 0, 0, 0, 0.03, 0, 3], ['CD1C', 'mark', 0, 0, 0, 0.05, 0, 0, 2.4],
    ['ENHO', 'mark', 0, 0, 0, 0, 0, 0, 1.4], ['CLEC9A', 'mark', 0, 0, 0, 0, 0, 0, 0.15],
    /* asked about at the Name desk, and found in almost nothing here: regulatory T, plasma and plasmacytoid dendritic cells */
    ['IL2RA', 'mark', 0.1, 0, 0, 0, 0, 0, 0], ['MZB1', 'mark', 0, 0, 0, 0.03, 0, 0, 0], ['TNFRSF17', 'mark', 0, 0, 0, 0.03, 0, 0, 0], ['LILRA4', 'mark', 0, 0, 0, 0, 0, 0, 0],
  ],
  /* genes of the killing programme, which runs at a different strength in every CD8 T cell */
  programme: ['CCL5', 'NKG7', 'GZMA', 'GZMK', 'CST7', 'GNLY', 'PRF1', 'KLRD1'],

  /* ---- the references (js/data/atlas.js, the Oracle, the Chief) ---- */
  /* far is from the wrong tissue, fit matches the sample but has a gap, broad has labels too coarse to help.
     like: what each label's profile is made of. A list of slots is the average of those cell types, a
     table is a profile of its own, and nothing is a cell type that shares no marker with these cells:
     it has nothing to correlate with, and never wins.
     short and made are the cartridge and its sticker. The other words go into what Ida and the Chief say. */
  refs: {
    far: { name: 'LUNG ATLAS', short: 'LUNG ATLAS', made: ['MADE FROM: HUMAN LUNG', 'LABELS: FINE'],
      labels: ['T CELL', 'B CELL', 'ALVEOLAR MACROPHAGE', 'AT2 CELL', 'FIBROBLAST', 'ENDOTHELIAL CELL'],
      like: [[0, 1], [3], { LYZ: 30, CST3: 25, CD74: 40, 'HLA-DRA': 35, 'HLA-DQA1': 8, AIF1: 12, TYROBP: 14, FCER1G: 10, MS4A7: 6, FTL: 0 }, null, null, null],
      word: 'lung', wrong: 'tissue', cell: 'a lung cell' },
    fit: { name: 'SORTED BLOOD CELLS', short: 'SORTED BLOOD', made: ['MADE FROM: HUMAN BLOOD, SORTED BY CELL TYPE', 'SAME KIT AS YOUR SAMPLE. LABELS: FINE'],
      labels: ['CD4 T CELL', 'CD8 T CELL', 'NK CELL', 'NAIVE B CELL', 'CD14 MONOCYTE', 'CD16 MONOCYTE'],
      like: [[0], [1], [2], [3], [4], [5]],
      word: 'blood' },
    broad: { name: 'WHOLE-BODY ATLAS', short: 'WHOLE BODY', made: ['MADE FROM: 30 HUMAN TISSUES', 'LABELS: BROAD'],
      labels: ['T CELL', 'NK CELL', 'B CELL', 'MYELOID CELL'],
      like: [[0, 1], [2], [3], [4, 5, 6]],
      blind: 'a monocyte from a dendritic cell' },
  },

  /* ---- the hall (js/stages/who/bureau.js) ---- */
  /* what an old file in the cold cases calls its cells */
  hall: { vague: 'T cells' },

  /* ---- the Line-up (js/stages/who/lineup.js) ---- */
  lineup: {
    /* role: which cluster (by what it really is). genes: the line-up.
       trap: a famous gene that is a poor marker. trapWhy is why, and ok is what Ida adds once the marker is
       pinned, if the player has not already heard it by pinning the trap.
       bright: a gene that is brighter than the marker, and shared with the neighbours.
       none: no gene fits, because the cluster is doublets. */
    rounds: [
      { role: 'B', genes: ['CD74', 'ACTB', 'MS4A1', 'HLA-DRA', 'CD79A'] },
      { role: 'CD4T', genes: ['RPS27', 'LTB', 'CD4', 'MAL', 'IL2RA'], trap: 'CD4',
        trapWhy: 'CD4 RNA is rarely caught, and monocytes make it too. The protein marks these cells. The RNA does not.',
        ok: 'Pinned. Not CD4, the famous one: its RNA is rarely caught, and monocytes make it too.' },
      { role: 'MONO16', genes: ['LYZ', 'FCN1', 'MS4A7', 'AIF1', 'CDKN1C'], bright: 'LYZ' },
      { role: 'DBL', genes: ['CD14', 'CD3D', 'S100A9', 'LYZ', 'TCF7'], none: true },
    ],
    /* pinned by Ida before the player arrives, so the board ends up complete */
    given: { MONO14: 'S100A12', CD8T: 'CD8B', NK: 'KLRF1', DC: 'FCER1A' },
    /* the two sets of genes a doublet shows at once */
    both: 'T-cell genes and monocyte genes',
    /* the start of the note on famous markers */
    rna: 'Markers known from flow cytometry are proteins. Their RNA can be hard to catch, as with CD4.',
  },

  /* ---- the Name desk (js/stages/who/namedesk.js) ---- */
  name: {
    /* need: genes that should be in most of the cluster. lack: genes that should be in few. opts: the drawers inside. */
    tree: {
      root: { opts: ['NK', 'T', 'B', 'MYE'] },
      T: { name: 'T CELL', need: ['CD3D', 'CD3E'], lack: ['LYZ'], opts: ['CD8T', 'CD4T'] },
      NK: { name: 'NK CELL', need: ['NKG7', 'GNLY', 'KLRF1'], lack: ['CD3D'] },
      B: { name: 'B CELL', need: ['CD79A', 'CD74'], opts: ['PLASMA', 'NAIVEB'] },
      MYE: { name: 'MYELOID CELL', need: ['CST3'], lack: ['CD3D'], opts: ['MONO', 'DC'] },
      CD4T: { name: 'CD4 T CELL', need: ['LTB'], lack: ['CD8A', 'CD8B'], opts: ['TREG'] },
      CD8T: { name: 'CD8 T CELL', need: ['CD8A', 'CD8B'] },
      TREG: { name: 'REGULATORY T CELL', need: ['FOXP3', 'IL2RA'] },
      NAIVEB: { name: 'NAIVE B CELL', need: ['MS4A1', 'TCL1A', 'IGHD'] },
      PLASMA: { name: 'PLASMA CELL', need: ['MZB1', 'TNFRSF17'], lack: ['MS4A1'] },
      MONO: { name: 'MONOCYTE', need: ['FCN1', 'S100A9'], lack: ['FCER1A'], opts: ['MONO14', 'MONO16'] },
      MONO14: { name: 'CD14 MONOCYTE', need: ['CD14', 'S100A12'] },
      MONO16: { name: 'CD16 MONOCYTE', need: ['FCGR3A', 'MS4A7'] },
      DC: { name: 'DENDRITIC CELL', need: ['HLA-DQA1', 'CD74'], opts: ['CDC2', 'CDC1', 'PDC'] },
      CDC2: { name: 'CD1C+ DENDRITIC CELL', need: ['FCER1A', 'CLEC10A'] },
      CDC1: { name: 'CLEC9A+ DENDRITIC CELL', need: ['CLEC9A'] },
      PDC: { name: 'PLASMACYTOID DC', need: ['LILRA4'] },
    },
    /* the clusters the player files, in order. Each file has its lesson: a cluster that looks like its
       neighbour until a gene it should lack is checked (done is what Ida adds), one whose evidence goes a
       drawer deeper than its broad name, and one where a subtype would be a guess. */
    cases: [
      { role: 'CD8T', done: 'Filed. NK cells carry the same killing genes. What they lack is CD3D.' },
      { role: 'B', broad: 'B cell' },
      { role: 'CD4T' },
    ],
    /* the name on every file: what the evidence supports. Ida files the ones the player does not, and
       leaves one of hers broad on purpose: see the Oracle. */
    filed: { CD4T: 'CD4 T CELL', MONO14: 'MONOCYTE', B: 'NAIVE B CELL', CD8T: 'CD8 T CELL', NK: 'NK CELL', MONO16: 'CD16 MONOCYTE', DC: 'CD1C+ DENDRITIC CELL', DBL: 'DOUBLETS' },
    /* the start of the note on genes a cell type should lack, and a Cell Ontology term to quote */
    neg: 'Cytotoxic T cells and NK cells share NKG7, GNLY and the granzymes. CD3D is in most T cells and in few NK cells. CD3E is no use here: a quarter of NK cells carry its RNA.',
    onto: 'B cell is CL:0000236',
    /* for the code: known markers by cell type, and the genes that decide between two names */
    known: [['T cell', ['CD3D', 'CD3E']], ['NK cell', ['NKG7', 'GNLY', 'KLRF1']], ['B cell', ['MS4A1', 'CD79A']], ['myeloid', ['LYZ', 'CST3']]],
    decide: ['CD3D', 'NKG7', 'GNLY'],
  },

  /* ---- the Oracle (js/stages/who/oracle.js) ---- */
  oracle: {
    /* the two names that differ once the fitting reference is in, by what the cluster really is, and
       the genes to look at (their numbers are shown on the screen).
       take: the machine is right, because its name is narrower than the one on file.
       keep: the machine is wrong and sure of itself, because its reference has none of these cells. */
    take: { role: 'MONO14', genes: ['CD14', 'S100A8', 'FCGR3A'] },
    keep: { role: 'DC', genes: ['FCER1A', 'CD1C', 'FCGR3A'], missing: 'dendritic cells' },
    /* what a gene is better known as, where a player may know the other name */
    alias: { FCGR3A: 'FCGR3A=CD16' },
    /* for the code: a CellTypist model, the reference SingleR loads, and what CyteType is told about the study */
    model: 'Immune_All_Low.pkl',
    singler: { load: '<span class="k">library</span>(celldex)\n', ref: 'celldex::<span class="k">MonacoImmuneData</span>()', labels: 'ref$label.fine' },
    context: ['Peripheral blood mononuclear ', 'cells from a healthy human donor.'],
  },

  /* ---- the Chief (js/stages/who/chief.js) ---- */
  chief: {
    /* rna: a cluster with more RNA than most that is not doublets. sure: the cluster the far reference
       is surest of. shared: two clusters and one gene they both carry. */
    rna: 'B', sure: 'MONO14', shared: ['NK', 'MONO16', 'FCGR3A'],
    /* where the sample is from, and what one sample cannot settle */
    where: 'blood', whole: 'human blood',
  },
};
})();
