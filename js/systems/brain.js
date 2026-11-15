/* A cell system: the developing human cortex. Radial glia are the stem cells; they give rise to
   intermediate progenitors, which give rise to excitatory neurons. Inhibitory neurons are born
   elsewhere and migrate in. Outer radial glia are a rarer kind of radial glia with a few genes
   of their own.
   The numbers follow the same plan as the blood system (two related kinds, one kind apart, one
   large kind and a rare relative of it), so the shared stations behave the same way. The genes
   and the kinship between the cell types are the cortex's own. */
(function () {
'use strict';
G.systems = G.systems || {};
G.systems.brain = {
  id: 'brain',
  /* words the notebook uses when it writes up stages 3 and 4, wherever the player is standing */
  book: { ref: 'a fetal cortex reference', refMethods: 'a fetal-cortex reference', doublet: 'neuron and radial glia genes',
    loner: 'microglia', unseen: 'striatal neurons', called: 'interneurons' }, name: 'BRAIN CELLS', tissue: 'developing cortex',

  /* ---- making the data ---- */
  /* SEMA3E is real but quiet: only some excitatory neurons make it. No brain cell makes haemoglobin: it
     comes from red blood cells that burst when the tissue was taken apart. */
  soup: {
    rows: ['EXC NEURONS', 'PROGENITORS', 'RADIAL GLIA', 'INH NEURONS'], short: ['EXC', 'IPC', 'RG', 'INH'],
    genes: ['SATB2', 'SEMA3E', 'EOMES', 'HES1', 'GAD1', 'HBB'],
    probe: 'haemoglobin, HBB', cannot: 'haemoglobin in neurons',
    note: 'haemoglobin in neurons, or neuron genes in glia',
  },
  /* intermediate progenitors turning into excitatory neurons are a real transition, not doublets */
  doublets: { names: ['EXC', 'INH', 'RG', 'IPC'] },
  review: {
    ambient: { q: 'Your neurons express haemoglobin. Explain yourself.',
      o: ['IT IS A NEW TYPE OF NEURON', 'IT IS AMBIENT RNA FROM BURST RED BLOOD CELLS', 'STRESSED NEURONS MAKE SOME HAEMOGLOBIN'] },
    mixed: { q: 'A small cluster shows neuron and radial glia genes together. What is it?' },
  },

  /* ---- drawing the map ---- */
  /* excitatory and inhibitory neurons share the genes every neuron has. Intermediate progenitors
     still divide, as radial glia do, and already carry NEUROD1, as young neurons do. SOX6 marks
     both cortical progenitors and inhibitory neurons. */
  cloud: {
    types: [
      { id: 'EXC', name: 'EXC NEURONS', n: 60, size: 0.95 }, { id: 'INH', name: 'INH NEURONS', n: 26, size: 1 },
      { id: 'IPC', name: 'PROGENITORS', n: 34, size: 0.95 }, { id: 'RG', name: 'RADIAL GLIA', n: 46, size: 1.1 },
      { id: 'ORG', name: 'OUTER RG', n: 8, size: 1.05 },
    ],
    genes: [
      ['ACTB', 'house', 600], ['MALAT1', 'house', 800], ['B2M', 'house', 500], ['EEF1A1', 'house', 400],
      ['TMSB4X', 'house', 450], ['FTL', 'house', 300], ['TPT1', 'house', 350], ['GAPDH', 'house', 250],
      ['RPL13', 'ribo', 400], ['RPS27', 'ribo', 450], ['RPLP1', 'ribo', 350], ['RPS12', 'ribo', 300], ['MT-CO1', 'ribo', 250], ['MT-ND1', 'ribo', 200],
      ['MEF2C', 'mark', 60, 55, 0, 0, 0], ['INA', 'mark', 50, 55, 0, 0, 0], ['SNAP25', 'mark', 50, 45, 0, 0, 0], ['GAP43', 'mark', 40, 55, 0, 0, 0], ['CELF4', 'mark', 30, 45, 0, 0, 0],
      ['SATB2', 'mark', 25, 0, 0, 0, 0], ['ARPP21', 'mark', 20, 0, 0, 0, 0], ['NELL2', 'mark', 20, 0, 0, 0, 0], ['LDB2', 'mark', 25, 0, 0, 0, 0], ['NEUROD1', 'mark', 15, 0, 30, 0, 0],
      ['GAD1', 'mark', 5, 35, 0, 0, 0], ['GAD2', 'mark', 3, 40, 0, 0, 0], ['DLX5', 'mark', 2, 15, 0, 0, 0], ['DLX2', 'mark', 3, 15, 0, 0, 0],
      ['EOMES', 'mark', 0, 0, 60, 0, 0], ['PPP1R17', 'mark', 0, 0, 70, 0, 0], ['NEUROG2', 'mark', 0, 0, 50, 0, 0], ['HMGB2', 'mark', 5, 5, 120, 80, 85],
      ['TOP2A', 'mark', 3, 3, 100, 80, 85], ['NHLH1', 'mark', 0, 0, 60, 0, 0], ['PENK', 'mark', 0, 0, 30, 0, 0],
      ['VIM', 'mark', 2, 2, 2, 140, 115], ['SOX9', 'mark', 1, 1, 1, 120, 95], ['SLC1A3', 'mark', 1, 1, 1, 140, 110], ['PAX6', 'mark', 0, 0, 0, 50, 38],
      ['HES1', 'mark', 0, 0, 0, 60, 46], ['TTYH1', 'mark', 2, 2, 5, 100, 100], ['SOX6', 'mark', 5, 50, 2, 80, 70], ['BCAN', 'mark', 2, 2, 2, 60, 55],
      ['HOPX', 'rare', 0, 0, 0, 0, 16], ['TNC', 'rare', 0, 0, 0, 0, 12], ['FAM107A', 'rare', 0, 0, 0, 0, 10], ['MOXD1', 'rare', 0, 0, 0, 0, 8],
    ],
  },
  norm: { cell: 'radial glia cell', title: 'TWO RADIAL GLIA', genes: ['VIM', 'SLC1A3', 'TTYH1', 'ACTB', 'RPL13'] },
  hvg: { known: [['SATB2', 'EXC NEURONS', 'excitatory neurons'], ['EOMES', 'PROGENITORS', 'intermediate progenitors'], ['GAD1', 'INH NEURONS', 'inhibitory neurons'], ['VIM', 'RADIAL GLIA', 'radial glia'], ['HOPX', 'RARE CELLS', 'the rare cells']] },
  pca: { gx: 'HMGB2', gy: 'VIM', cell: 'radial glia', names: ['excitatory neurons', 'inhibitory neurons', 'progenitors', 'radial glia', 'rare cells'] },
  umap: { colours: [['VIM', 'A RADIAL GLIA GENE'], ['SATB2', 'AN EXC NEURON GENE'], ['GAD1', 'AN INH NEURON GENE'], ['EOMES', 'A PROGENITOR GENE'], ['HOPX', 'A RARE-CELL GENE']] },
};
})();
