/* The immune cell system's pack for the Weigh House (stage 5): the cell types and genes of the trial, and what each station says about them.
   It is loaded with the stage, after js/systems/immune.js. js/data/trial.js generates the patients from the numbers here.
   Blood from twelve patients, before and after a treatment. Six responded. */
(function () {
'use strict';
G.systems.immune.changes = {
  /* ---- the samples (js/data/trial.js) ---- */
  /* the five cell types of every sample, and the share each has of a sample before treatment.
     short: the tag on a jar. word: the name in a sentence. */
  types: [
    { id: 'CD4T', name: 'CD4 T CELLS', short: 'CD4 T', word: 'CD4 T cells', share: 0.36 },
    { id: 'CD8T', name: 'CD8 T CELLS', short: 'CD8 T', word: 'CD8 T cells', share: 0.14 },
    { id: 'NK', name: 'NK CELLS', short: 'NK', word: 'NK cells', share: 0.12 },
    { id: 'B', name: 'B CELLS', short: 'B', word: 'B cells', share: 0.12 },
    { id: 'MONO', name: 'MONOCYTES', short: 'MONO', word: 'monocytes', share: 0.26 },
  ],
  /* planted: in responders, after treatment, the cells of one slot double in number */
  grows: { type: 1, fold: 2 },
  /* planted: in the same cells, in responders after treatment, these genes rise. name, log2 level before, log2 rise.
     MKI67 marks dividing cells; HLA-DR and CD38 mark activated T cells. */
  rise: { type: 1, genes: [['MKI67', 2.4, 1.5], ['HLA-DRB1', 5.2, 0.9]] },
  /* planted: one gene of the same cells is higher in responders at both visits. That is a difference between patients, not a change. */
  stand: { gene: 'GZMK', level: 6, gap: 1.3 },
  /* planted: a gene some donors carry and others have no copy of (donors by their place in the trial: the first six responded) */
  carried: { gene: 'HLA-DRB5', donors: [2, 4, 9] },
  /* planted: in everyone, after treatment, interferon-stimulated genes rise in one slot. name, log2 rise,
     and for the first one how far donors differ in it. still: named genes of those cells that do not move. */
  wave: { type: 4,
    genes: [['ISG15', 1.05, 1.35], ['IFI6', 1.0], ['IFI44L', 0.95], ['MX1', 0.9],
      ['IFI44', 0.5], ['IFIT1', 0.47], ['IFIT2', 0.4], ['IFIT3', 0.5], ['IFITM3', 0.42], ['OAS1', 0.5], ['OAS2', 0.44], ['OAS3', 0.46],
      ['OASL', 0.4], ['MX2', 0.48], ['RSAD2', 0.5], ['ISG20', 0.4], ['STAT1', 0.45], ['IRF7', 0.48], ['XAF1', 0.5], ['EPSTI1', 0.42],
      ['LY6E', 0.5], ['SIGLEC1', 0.46], ['HERC5', 0.44], ['CMPK2', 0.48]],
    still: ['LYZ', 'S100A8', 'S100A9', 'CD14', 'FCN1', 'VCAN', 'MNDA', 'AIF1', 'LST1', 'TYROBP', 'FCER1G', 'CST3', 'CD74', 'HLA-DRA', 'HLA-DRB5', 'FTL'] },

  /* ---- 5-1, the Scales: three claims about one slot after treatment ---- */
  /* cell: one such cell, in a sentence. label: the cell type as the code names it.
     kind: carried (by genotype), rise (truly higher in responders), own (one donor's). rate: the mean count
     per cell in the donors that have it, and in the others. won: what Amara says once the claim has its stamp. */
  scales: { type: 1, cell: 'CD8 T cell', label: 'CD8 T cells',
    claims: [
      { gene: 'HLA-DRB5', kind: 'carried', rate: [0.45, 0.004],
        won: 'Three patients carry HLA-DRB5, and nine have no copy of the gene. One carrier gave five times the cells, all on one pan.' },
      { gene: 'CD38', kind: 'rise', rate: [0.3, 0.07],
        won: 'This one holds. CD38 is higher from one responder to the next, so twelve weights say what the grains said.' },
      { gene: 'FKBP5', kind: 'own', rate: [0.9, 0.12],
        won: 'One patient carries most of the FKBP5, and gave five times the cells. A large sample is still one patient.' },
    ],
    /* a field note on the first claim */
    geno: 'Genes that depend on genotype turn up whenever few donors are compared. HLA-DRB5 sits on some HLA haplotypes only, so many people have no copy of it, and every cell of a carrier can show it. That says who the donors are, not what the treatment did.' },

  /* ---- 5-2, the Formula bench: three rounds ---- */
  /* set: which pseudobulks (mono or cd8). cells: their name on the chart. genes: what is on the bench, the first one first.
     term: the tile the question is about. want: the formula that answers. start: the tiles in the formula when the round begins.
     card: the question, in two lines of at most 20 letters. ask: what is said when the round begins. won: when it is solved.
     trapWhy: when the formula is right and the gene on the bench is not the one that answers. */
  bench: {
    note: 'A gene that is simply higher in responders at both visits, as GZMK is here, has no interaction at all.',
    rounds: [
      { set: 'mono', cells: 'MONOCYTES', genes: ['ISG15'], term: 'visit', want: ['donor', 'visit'], start: [],
        card: ['WHAT DID TREATMENT', 'CHANGE IN EVERYONE?'],
        ask: ['One line for each patient: ISG15 in their monocytes, before treatment and after. Responders are red.'],
        won: 'Every patient is now weighed against their own baseline, and what treatment did stands clear of what patients are.' },
      { set: 'cd8', cells: 'CD8 T CELLS', genes: ['GZMK', 'MKI67'], term: 'vr', want: ['donor', 'visit', 'vr'], start: [],
        card: ['WHAT CHANGED IN', 'RESPONDERS ONLY?'],
        ask: ['A new card, and CD8 T cells this time. Two genes are on the bench, and you can switch between them.',
          'Build the formula for the question. Then leave the gene that answers it on the bench.'],
        trapWhy: 'GZMK is higher in responders before treatment too. That is a difference between patients, not a change.',
        won: 'visit is what changed in everyone, and here that is nothing. visit:response is what changed in responders beyond it.' },
      { set: 'cd8', cells: 'CD8 T CELLS', genes: ['MKI67'], term: 'vr', want: ['donor', 'visit', 'vr'], start: ['donor', 'visit', 'response', 'vr', 'run'], unjam: true,
        card: ['UNJAM THE FORMULA.', 'LOSE NOTHING REAL.'],
        ask: ['TOMO: I put every tile in, to be safe. Now the bench will not fit anything.',
          'Take out the tiles that add nothing. Keep every tile that does.'],
        won: 'Donor already told response and run, so nothing was lost. Every column left says something the others cannot.' },
    ] },

  /* ---- 5-3, the Stairs: every gene of one slot, tested after against before ---- */
  stairs: { cells: 'monocytes' },

  /* ---- 5-4, the Census ---- */
  /* first: the slot the pump is on when the player arrives. steady: a slot nothing happens to, for the code tab before a reference is marked.
     seen: what Amara points out in the jars. pumped: when one pump has matched them. entered: when the ledger is right. */
  census: { first: 0, steady: 0,
    seen: 'In the responders, after treatment, the CD8 T layer is thicker. Every other layer is thinner.',
    pumped: 'One pump, and all five layers fell into place. The other four only moved because a jar is always full.',
    entered: 'Entered. CD8 T cells about doubled against a steady cell type. That is the whole account, and all a jar can show.' },

  /* ---- the read-out: one sentence for the clinic ---- */
  /* slots: the five parts of the sentence, each with its tiles. t: on the tile. s: in the sentence as it is kept.
     A tile of the "do" slot says what it stands on: number (the Census; dir 1 for more cells, -1 for fewer), gene (the
     Formula bench: which pseudobulks and which gene) or stamp (a claim of the Scales). type: the slot of `types` it was measured in.
     books: what the stations found, for the board beside the sheet. */
  readout: {
    slots: [
      { id: 'who', lead: 'IN', opts: [{ id: 'all', t: 'ALL PATIENTS', s: 'all patients' }, { id: 'resp', t: 'RESPONDERS', s: 'responders' }] },
      { id: 'when', opts: [{ id: 'both', t: 'BEFORE AND AFTER', s: 'before and after treatment' }, { id: 'after', t: 'AFTER TREATMENT', s: 'after treatment' }] },
      { id: 'cells', opts: [{ id: 'mono', t: 'MONOCYTES', s: 'monocytes', type: 4 }, { id: 'cd8', t: 'CD8 T CELLS', s: 'CD8 T cells', type: 1 }] },
      { id: 'do', opts: [
        { id: 'isg', t: 'RAISE ISG15, MX1', s: 'raise ISG15 and MX1', kind: 'gene', set: 'mono', gene: 'ISG15', type: 4 },
        { id: 'geno', t: 'RAISE HLA-DRB5', s: 'raise HLA-DRB5', kind: 'stamp', claim: 0, type: 1 },
        { id: 'less', t: 'FALL IN NUMBER', s: 'fall in number', kind: 'number', dir: -1 },
        { id: 'more', t: 'GROW IN NUMBER', s: 'grow in number', kind: 'number', dir: 1 },
        { id: 'act', t: 'RAISE MKI67, CD38', s: 'raise MKI67 and CD38', kind: 'gene', set: 'cd8', gene: 'MKI67', type: 1 }] },
      { id: 'tie', lead: 'THIS', tail: 'RESPONSE.', opts: [{ id: 'cause', t: 'CAUSES', s: 'causes' }, { id: 'pred', t: 'PREDICTS', s: 'predicts' }, { id: 'with', t: 'GOES WITH', s: 'goes with' }] },
    ],
    books: [
      { name: 'CD38', kind: 'stamp', claim: 1 }, { name: 'HLA-DRB5', kind: 'stamp', claim: 0 }, { name: 'FKBP5', kind: 'stamp', claim: 2 },
      { name: 'MKI67', kind: 'gene', set: 'cd8', gene: 'MKI67' }, { name: 'GZMK', kind: 'gene', set: 'cd8', gene: 'GZMK' }, { name: 'ISG15', kind: 'gene', set: 'mono', gene: 'ISG15' },
      { name: 'CD8 T', kind: 'number', dir: 1, type: 1 }, { name: 'MONO', kind: 'number', dir: -1, type: 4 },
    ],
    /* what is said: at the start, when every word holds, the question Vera then puts, the two answers to it, and at the end */
    ask: ['VERA: The clinic rings at four. They want one sentence: why did six patients respond?',
      'VERA: Make it a strong one.',
      'AMARA: Make it one that is on the books. Every word in it has been weighed, or it comes out.'],
    push: ['VERA: "Goes with." The clinic has to decide whom to treat. They want to know who will respond.'],
    pushAsk: 'VERA: Write "predicts". It is one word.', pushOpts: ['KEEP "GOES WITH"', 'WRITE "PREDICTS"'],
    held: 'VERA: Fine. "Goes with." Then find me twelve new patients, and we shall see about the other word.',
    gave: 'VERA: Fine. "Goes with." And twelve new patients, before anyone says the other word.',
    done: 'VERA: Short, and nobody can take it apart. It goes to the clinic as it stands.',
  },

  /* what the next stage of the project does, as Amara puts it when this one is finished */
  next: 'asks which cells signal to which',
};
})();
