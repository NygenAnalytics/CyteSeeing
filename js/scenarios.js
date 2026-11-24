/* What there is to play, and in what order a project goes through it.
   A STAGE is a place: a hall and the stations in it. `rooms` are its stations in order (the last
   one closes the stage), `makes` are the ones later stages depend on, `hall` are the scripts the
   hall itself needs and `scenes` the script of each station. `systems` lists the cell systems a
   stage is written for; leave it out when the stage works for any. `end` marks the ending of a
   project: the last entry of a route.
   A SCENARIO is a project: a question, a cell system (js/systems) and a route through the stages.
   To add a stage, add it here and put its files in js/stages/<id>/. To add a project, add it
   here; to add a tissue, add a file to js/systems/. */
(function () {
'use strict';
const C = G.C;
G.VERSION = '12';
G.STAGES = {
  /* not a stage of any project: the hall where a project is chosen */
  bay: { n: 0, name: 'ARRIVALS', mentor: 'VERA', rooms: [], makes: [], hall: [], scenes: {} },
  make: { n: 1, name: 'CORE FACILITY', what: 'DROPLETS TO QC', mentor: 'MIKA', col: C.cyan,
    rooms: ['droplets', 'cliff', 'qc', 'soup', 'doublet'], extra: ['review'], makes: ['droplets', 'cliff', 'qc', 'soup', 'doublet'],
    hall: ['stages/make/hall.js'],
    scenes: { droplets: 'stages/make/droplets.js', cliff: 'stages/make/cliff.js', qc: 'stages/make/qc.js', soup: 'stages/make/soup.js', doublet: 'stages/make/doublets.js', review: 'stages/make/review.js' } },
  map: { n: 2, name: 'THE CLOUD', what: 'PCA, NEIGHBOURS, UMAP', mentor: 'NOOR', col: C.lilac,
    rooms: ['norm', 'hvg', 'pca', 'knn', 'umap', 'club'], makes: ['norm', 'hvg', 'pca', 'knn', 'umap'],
    hall: ['data/maths.js', 'data/cloud.js', 'stages/map/hall.js'],
    scenes: { norm: 'stages/map/norm.js', hvg: 'stages/map/hvg.js', pca: 'stages/map/pca.js', knn: 'stages/map/knn.js', umap: 'stages/map/umap.js', club: 'stages/map/club.js' } },
  who: { n: 3, name: 'THE BUREAU', what: 'CLUSTERS, CELL TYPES', mentor: 'IDA', col: C.amber, systems: ['immune', 'brain'], pack: 'who',
    rooms: ['cut', 'lineup', 'name', 'oracle', 'chief'], makes: ['cut', 'lineup', 'name', 'oracle'],
    hall: ['data/maths.js', 'data/atlas.js', 'stages/who/bureau.js'],
    scenes: { cut: 'stages/who/cut.js', lineup: 'stages/who/lineup.js', name: 'stages/who/namedesk.js', oracle: 'stages/who/oracle.js', chief: 'stages/who/chief.js' } },
  runs: { n: 4, name: 'THE LAUNDRY', what: 'BATCHES, MAPPING', mentor: 'BEA', col: C.pink, systems: ['immune', 'brain'], pack: 'runs',
    rooms: ['sort', 'wash', 'lost', 'counter'], makes: ['sort', 'wash', 'lost'],
    hall: ['data/maths.js', 'data/loads.js', 'stages/runs/laundry.js'],
    scenes: { sort: 'stages/runs/sorting.js', wash: 'stages/runs/wash.js', lost: 'stages/runs/lost.js', counter: 'stages/runs/counter.js' } },
  /* the first stage where the projects part ways: comparing conditions is only for a project that has conditions */
  changes: { n: 5, name: 'THE WEIGH HOUSE', what: 'CONDITIONS, DONORS', mentor: 'AMARA', col: C.orange, systems: ['immune'], pack: 'changes',
    rooms: ['scales', 'formula', 'stairs', 'census', 'readout'], makes: ['scales', 'formula', 'stairs', 'census'],
    hall: ['data/trial.js', 'stages/changes/hall.js'],
    scenes: { scales: 'stages/changes/scales.js', formula: 'stages/changes/formula.js', stairs: 'stages/changes/stairs.js', census: 'stages/changes/census.js', readout: 'stages/changes/readout.js' } },
  /* the fifth stage of a project that asks how a tissue builds itself: putting the cells of a snapshot in order */
  order: { n: 5, name: 'THE MARSHALLING YARD', what: 'PSEUDOTIME, TRAJECTORIES', mentor: 'JUN', col: C.green, systems: ['brain'], pack: 'order',
    rooms: ['turntable', 'track', 'timetable', 'clock', 'board'], makes: ['turntable', 'track', 'timetable', 'clock'],
    hall: ['data/maths.js', 'data/line.js', 'stages/order/hall.js'],
    scenes: { turntable: 'stages/order/turntable.js', track: 'stages/order/track.js', timetable: 'stages/order/timetable.js', clock: 'stages/order/clock.js', board: 'stages/order/board.js' } },
  /* the end of a project: its review. `end` puts it last on the road, after the stages still to come. It has no
     number and no stations: one hall, where the work of every other stage on the route hangs, and a close */
  gallery: { name: 'THE LONG GALLERY', what: 'THE REVIEW', mentor: 'VERA', col: C.paper, end: true, systems: ['immune', 'brain'], pack: 'gallery',
    rooms: ['close'], makes: [],
    hall: ['stages/gallery/hall.js'],
    scenes: { close: 'stages/gallery/close.js' } },
};
/* `route` lists every stage the project will have. A stage that is not built yet, or not yet
   written for the project's cells, shows on the map as still to come. */
G.SCENARIOS = {
  response: { system: 'immune', col: C.coral, parcel: 'BLOOD', from: 'THE CLINIC',
    title: 'WHY DO SOME PATIENTS RESPOND?', sample: 'BLOOD, BEFORE AND AFTER TREATMENT',
    label: 'Blood from the clinic, taken before and after a treatment. The question: why do some patients respond?',
    route: ['make', 'map', 'who', 'runs', 'changes', 'gallery'], coming: ['WHO SIGNALS'],
    brief: ['VERA: Twelve patients started the same treatment. Six got better. Nobody can say why.',
      'VERA: That box holds their blood, taken before and after. Find what differs between them.'] },
  cortex: { system: 'brain', col: C.mint, parcel: 'BRAIN', from: 'THE TISSUE BANK',
    title: 'HOW DOES A CORTEX BUILD ITSELF?', sample: 'DEVELOPING CORTEX, THREE STAGES',
    label: 'Tissue from the tissue bank: developing cortex, at three ages. The question: how does a cortex build itself?',
    route: ['make', 'map', 'who', 'runs', 'order', 'gallery'], coming: ['WHICH FATE'],
    brief: ['VERA: A cortex builds itself from one sheet of stem cells. Nobody tells it how.',
      'VERA: That box holds tissue from three stages of development. Find who is there, and who comes from whom.'] },
};
/* is a stage playable in the current project: built, and written for these cells */
G.playable = function (id) {
  const st = G.STAGES[id], sc = G.scenario();
  return !!st && !!sc && (!st.systems || st.systems.indexOf(sc.system) >= 0);
};
})();
