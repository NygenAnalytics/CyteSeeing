/* A cell system: everything about one kind of tissue that the shared stations need. The stations
   hold the game and the maths; this file holds the cells, the genes and the words.
   This one is human blood: the immune cells every single-cell tutorial starts with.
   To add a tissue, copy this file, change the names and the biology, and list it in js/scenarios.js. */
(function () {
'use strict';
G.systems = G.systems || {};
G.systems.immune = {
  id: 'immune',
  /* words the notebook uses when it writes up stages 3 and 4, wherever the player is standing */
  book: { ref: 'a blood reference', refMethods: 'a sorted-blood reference', doublet: 'T-cell and monocyte genes',
    loner: 'platelets', unseen: 'plasma cells', called: 'B cells',
    /* stage 5: the cell type that grows, and the five cell types of a sample in the order of the changes pack */
    grew: 'CD8 T cells', types: ['CD4 T cells', 'CD8 T cells', 'NK cells', 'B cells', 'monocytes'] }, name: 'IMMUNE CELLS', tissue: 'blood',

  /* ---- making the data ---- */
  /* the soup kitchen: four cell types, one gene each (the second is real but quiet in the first
     type), and a last gene that none of them can make. per: what each type really expresses per
     1,000 counts. ambient: what the empty droplets hold. */
  soup: {
    rows: ['T CELLS', 'B CELLS', 'MONOCYTES', 'NK CELLS'], short: ['T', 'B', 'MONO', 'NK'],
    genes: ['CD3D', 'CD40LG', 'MS4A1', 'LYZ', 'KLRF1', 'HBB'],
    probe: 'haemoglobin, HBB', cannot: 'haemoglobin in T cells',
    note: 'haemoglobin in white blood cells or immunoglobulins in T cells',
  },
  /* the doublet hunt: the four groups on its map, clockwise from top left; the first and the last
     are joined by cells in a real transition */
  doublets: { names: ['T', 'B', 'MONO', 'NK'] },
  /* two of the last questions at the end of the stage */
  review: {
    ambient: { q: 'Your T cells express haemoglobin. Explain yourself.',
      o: ['IT IS A NEW TYPE OF T CELL', 'IT IS AMBIENT RNA FROM BURST RED BLOOD CELLS', 'STRESSED T CELLS MAKE SOME HAEMOGLOBIN'] },
    mixed: { q: 'A small cluster shows T cell and monocyte genes together. What is it?' },
  },

  /* ---- drawing the map ---- */
  /* five cell types, the fifth rare. Then every named gene: name, kind, and its mean count in
     each of the five at average depth. A gene with one number is the same everywhere. */
  cloud: {
    types: [
      { id: 'T', name: 'T CELLS', n: 60, size: 0.95 }, { id: 'NK', name: 'NK CELLS', n: 26, size: 1 },
      { id: 'B', name: 'B CELLS', n: 34, size: 0.95 }, { id: 'MONO', name: 'MONOCYTES', n: 46, size: 1.1 },
      { id: 'DC', name: 'DENDRITIC', n: 8, size: 1.05 },
    ],
    genes: [
      ['ACTB', 'house', 600], ['MALAT1', 'house', 800], ['B2M', 'house', 500], ['EEF1A1', 'house', 400],
      ['TMSB4X', 'house', 450], ['FTL', 'house', 300], ['TPT1', 'house', 350], ['GAPDH', 'house', 250],
      ['RPL13', 'ribo', 400], ['RPS27', 'ribo', 450], ['RPLP1', 'ribo', 350], ['RPS12', 'ribo', 300], ['MT-CO1', 'ribo', 250], ['MT-ND1', 'ribo', 200],
      ['IL32', 'mark', 60, 55, 0, 0, 0], ['CD7', 'mark', 50, 55, 0, 0, 0], ['CD2', 'mark', 50, 45, 0, 0, 0], ['CCL5', 'mark', 40, 55, 0, 0, 0], ['CTSW', 'mark', 30, 45, 0, 0, 0],
      ['CD3D', 'mark', 25, 0, 0, 0, 0], ['CD3G', 'mark', 20, 0, 0, 0, 0], ['IL7R', 'mark', 20, 0, 0, 0, 0], ['TRAC', 'mark', 25, 0, 0, 0, 0], ['LTB', 'mark', 15, 0, 30, 0, 0],
      ['NKG7', 'mark', 5, 35, 0, 0, 0], ['GNLY', 'mark', 3, 40, 0, 0, 0], ['KLRD1', 'mark', 2, 15, 0, 0, 0], ['PRF1', 'mark', 3, 15, 0, 0, 0],
      ['MS4A1', 'mark', 0, 0, 60, 0, 0], ['CD79A', 'mark', 0, 0, 70, 0, 0], ['CD79B', 'mark', 0, 0, 50, 0, 0], ['CD74', 'mark', 5, 5, 120, 80, 85],
      ['HLA-DRA', 'mark', 3, 3, 100, 80, 85], ['IGHM', 'mark', 0, 0, 60, 0, 0], ['BANK1', 'mark', 0, 0, 30, 0, 0],
      ['LYZ', 'mark', 2, 2, 2, 140, 115], ['S100A8', 'mark', 1, 1, 1, 120, 95], ['S100A9', 'mark', 1, 1, 1, 140, 110], ['MNDA', 'mark', 0, 0, 0, 50, 38],
      ['FCN1', 'mark', 0, 0, 0, 60, 46], ['CST3', 'mark', 2, 2, 5, 100, 100], ['TYROBP', 'mark', 5, 50, 2, 80, 70], ['AIF1', 'mark', 2, 2, 2, 60, 55],
      ['FCER1A', 'rare', 0, 0, 0, 0, 16], ['CLEC10A', 'rare', 0, 0, 0, 0, 12], ['CD1C', 'rare', 0, 0, 0, 0, 10], ['ENHO', 'rare', 0, 0, 0, 0, 8],
    ],
  },
  /* the Leveller compares a deep and a shallow cell of one type, gene by gene */
  norm: { cell: 'monocyte', title: 'TWO MONOCYTES', genes: ['LYZ', 'S100A9', 'CST3', 'ACTB', 'RPL13'] },
  /* the Gene picker watches one known marker per cell type, in the order of cloud.types */
  hvg: { known: [['CD3D', 'T CELLS', 'T cells'], ['MS4A1', 'B CELLS', 'B cells'], ['NKG7', 'NK CELLS', 'NK cells'], ['LYZ', 'MONOCYTES', 'monocytes'], ['FCER1A', 'RARE CELLS', 'the rare cells']] },
  /* the Rotator starts from two genes that rise and fall together */
  pca: { gx: 'CD74', gy: 'LYZ', cell: 'monocyte', names: ['T cells', 'NK cells', 'B cells', 'monocytes', 'rare cells'] },
  /* the Map table can colour the map by one gene per cell type */
  umap: { colours: [['LYZ', 'A MONOCYTE GENE'], ['CD3D', 'A T CELL GENE'], ['NKG7', 'AN NK CELL GENE'], ['MS4A1', 'A B CELL GENE'], ['FCER1A', 'A RARE-CELL GENE']] },
};
})();
