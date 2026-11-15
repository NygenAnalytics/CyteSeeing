# CyteSeeing

A pixel-art game for learning single-cell analysis. You take a project, walk a research institute from one stage of it to the next, poke at everything, and play each analysis step as a small hands-on puzzle. The aim is to make an abstract subject visible, and to have some fun on the way.

It is built for people who learn by doing: students, clinicians, postdocs, and anyone who has been handed a count matrix and a deadline.

## Play

**[Play it in your browser](https://docs.nygen.io/CyteSeeing/)**, or open `index.html` from a copy of this repository. There is nothing to install and no build step.

| Key | Does |
| --- | --- |
| <kbd>←</kbd> <kbd>→</kbd> | Walk, and adjust the selected control |
| <kbd>Space</kbd> / <kbd>Enter</kbd> | Talk, read, poke, open doors, confirm |
| <kbd>↑</kbd> <kbd>↓</kbd> | Pick a control inside a room |
| <kbd>Esc</kbd> | Leave a room |
| <kbd>G</kbd> | Show the goals of the game you are in |
| <kbd>L</kbd> | Step out to the map of the institute, from any hall |
| <kbd>M</kbd> | Sound on or off (off by default) |
| <kbd>F</kbd> | Full screen |

Mouse and touch work for everything: click or tap a spot to walk there, click a thing to walk over and poke it, drag sliders and lines, and tap "Leave" to step out of a room.

On a phone the game is playable with taps alone. Held upright, there is a row of buttons under the screen. Held sideways, the screen fills the height and a thumb pad sits on each side.

Progress is saved in the browser. "Restart game" in the page header wipes it.

## What is in it so far

You sign in at the gate, and in the arrivals bay you pick a parcel. Each parcel is a **project**: a question, and the samples to answer it with. Nobody runs every kind of single-cell analysis on one study, so the project decides which stages you go through. A road across the institute leads from one stage to the next.

| Project | Cells | Stages built | Still to come |
| --- | --- | --- | --- |
| Why do some patients respond? | Immune cells in blood | Core facility, the Cloud, the Bureau, the Laundry | What changes, who signals, the review |
| How does a cortex build itself? | The developing brain | Core facility, the Cloud, the Bureau, the Laundry | The order of events, cell fate, the review |

Every project starts the same way, because the data is made the same way. The two share their stages so far, each played on its own cells: T cells and monocytes in one, neurons and radial glia in the other. More tissues and more kinds of project are planned. To ask for one, use the request board in the game or open an [issue](https://github.com/NygenAnalytics/CyteSeeing/issues).

Stage 1, the core facility: from a tube of cells to a clean count matrix.

| Room | You do | You learn |
| --- | --- | --- |
| 1-1 Droplet bay | Choose how many cells to load, and across how many lanes | Doublets rise with every cell you load |
| 1-2 The Cliff | Separate cells from empty droplets on the barcode rank plot | A count cut-off is not enough; test each barcode against the ambient profile |
| 1-3 QC gate | Filter damaged cells by genes detected and mitochondrial share | Thresholds from a tutorial do not transfer; read lenient ones off the data |
| 1-4 Soup kitchen | Measure and remove ambient RNA | Use genes a cell cannot express; too much correction erases real signal |
| 1-5 Doublet hunt | Make artificial doublets, score the cells, pick a cut-off | Same-type doublets are invisible, and real transitions sit between clusters too |
| Reviewer 2 | Answer five questions about what you just did | Whether any of it stuck |

Stage 2, the Cloud: from a count matrix to a map you know how to read. This hall has no rooms. It is one hall with a glass pipeline along the wall. Your data rides the pipe from station to station, you walk beside it, and each finished station shows what the data looks like now on its monitor.

| Station | You do | You learn |
| --- | --- | --- |
| 2-1 Leveller | Colour the cells to find what drives the picture, then divide by depth and take logs | Until you normalise, sequencing depth is the biggest difference between cells |
| 2-2 Gene picker | Choose how to rank genes, how many to keep, and whether to skip mitochondrial and ribosomal genes | Rank by variance above the trend; too few genes or too many both lose the rare cells |
| 2-3 Rotator | Turn an axis through two genes to find the widest spread, then choose how many components to keep | What a principal component is, how to read the elbow, and why too few is the worse mistake |
| 2-4 Neighbours | Choose how many neighbours each cell is linked to, and watch the neighbour graph redraw | Too few neighbours and a cell type falls into pieces; too many and a small population is absorbed |
| 2-5 Map table | Draw the neighbour graph as a flat map, draw it again from a new random start, and say what is the same in both | Which cells share an island can be trusted; the position, distance and size of islands cannot |
| Journal club | Your student presents your map. Nod at the fair claims, object to the rest | A UMAP is a map, not a result |

Stage 3, the Bureau: from a map to cell types you can defend. This hall is a detective's office built around one case board. Nobody knows who the cells are yet. The board on the wall fills in as you work: pins, then clusters, then marker genes, then names, then a stamp.

| Station | You do | You learn |
| --- | --- | --- |
| 3-1 The Cut | Turn the resolution dial, then fix what one dial cannot: zoom into one cluster, or merge two | Resolution is a choice. Too coarse hides a group, too fine invents a split, and a split needs genes behind it |
| 3-2 The line-up | Move through candidate genes while the map lights up with each one, and pin the marker | A marker lights up its cluster and little else. A tiny p-value does not make one, and a cluster with no gene of its own may be doublets |
| 3-3 Name desk | Work down drawers of names, lineage to subtype, and file each cluster where the evidence stops | Check the genes a cell type should lack, go as deep as the evidence goes, and no deeper |
| 3-4 The Oracle | Pick a reference cartridge for an automatic annotator, then settle where it differs from the file | A good reference can refine a name. A cell type the reference lacks gets the nearest label, with confidence |
| The Chief | Answer five objections by presenting the right piece of evidence, or concede | How to defend each decision you made in the Bureau |

Each lesson in a stage has one home. The doublets, for example, are found at the line-up and leave the board there. No later station asks about them again.

Stage 4, the Laundry: more than one sample. The same kind of sample is run on Monday, on Thursday and again a month later, and no two runs come out looking alike. This hall is a laundrette under one washing line, which changes as you work: two runs pegged apart, then pegged together, then joined by a third.

| Station | You do | You learn |
| --- | --- | --- |
| 4-1 Sorting table | Tie each island of cells to its partner in the other run by comparing marker genes, and leave the one island that has no partner | A batch effect is a shift every cell type shares. Look before you correct, and a cell type found in one run only is not a batch effect |
| 4-2 The Wash | The knob for Harmony's theta was left on its highest setting, and the wash looks finished. Switch the light to PPBP to see what that cost, then find the setting to take out | Too little leaves the runs apart, too much pulls real differences together, and the strongest wash mixes best. Mixing alone picks the wrong setting |
| 4-3 Lost and found | Sweep a lamp over a newly mapped run to see which cells carry the marker of the label they were given, and flag the group that does not | Mapping gives every new cell a label, including cells the reference has never held, and the neighbours all agree. Check labels against markers |
| The counter | Deal with three study plans from Vera, the group leader: swap tubes between runs, split a sample over both, and choose what to call the batch | Confounding is fixed at the bench. A bridging sample shows what the run alone does. Whatever is called the batch is removed, with all that changes with it |

Every station in the Cloud runs real arithmetic on one small generated matrix (174 cells of five cell types, 207 genes): normalisation, a variance score, PCA, nearest neighbours and a force layout. Nothing is scripted. The map you unfold is computed live, from your own choices upstream. The Bureau does the same on a second, larger sample (258 cells of seven cell types plus a few doublets, 178 genes): community detection with a resolution, sub-clustering, marker statistics per cluster and a small reference classifier all run in the browser. The Laundry has three more runs (136, 132 and 66 cells, 152 genes): the Wash runs Harmony itself at whatever theta you set, and the new run is mapped onto the result the way Symphony does it.

Everything the game tells you is said inside the game. The same small cast runs through every project: Vera leads the group and hands out the work, Tomo is the student, and each stage has someone who knows it (Mika, Noor, Ida, Bea). They use the name you signed in with. The one whose stage it is briefs you in a few short lines when you arrive, with the part of the screen being talked about lit up. When a result passes or fails, the mentor says why. While you play there is no text: an arrow points at what to press next, the meters show their targets, and the goals show as lights. <kbd>G</kbd> opens the goals as a list. In the halls and on the map, a bouncing arrow marks where to go next.

In a hurry, or only here for one topic? Step out to the map with <kbd>L</kbd> and walk to the stage you want. If you have no data for a stage or a step, Tomo will make some for you, with default settings. You get no stars for work you did not do, and you can always go back and do it yourself.

Choices carry over. The load you pick in 1-1 sets how many doublets are waiting in 1-5. The cells you rescue or lose at the Cliff are the cells you filter in 1-3. The genes you pick in 2-2 are the genes 2-3 rotates, the components you keep are the ones 2-4 measures neighbours in, and the neighbour graph you lock is the one 2-5 draws. The eight clusters you cut in 3-1 are the ones the line-up, the name desk, the Oracle and the Chief work on. The wash you take out in 4-2 is the map the new run is placed on in 4-3.

As you clear rooms, the notebook writes your methods section from the settings you actually chose: loading, cell calling, filtering thresholds, contamination fraction, doublet cut-off, normalisation, gene selection, the number of components, the number of neighbours, the layout seed, the clustering resolution, how the clusters were named, and how the runs were corrected and a new one mapped.

The halls have more than 50 things to poke. Most answer with a line or two, some move, and ten open a pixel-art figure with a caption (a UMAP, a flow cell mid-run, a cDNA trace, a volcano plot, a scree plot and others).

Each room has a notebook with the objective and field notes, and a terminal that shows the same step in real tool syntax: Scanpy, Seurat, CyteArc, and the specialist tool for the job (DropletUtils, SoupX, CellBender, scDblFinder, Scrublet, CellTypist, SingleR, CyteType, Harmony, scVI, Symphony). Highlighted values in the code are live: change them in the game or in the code.

More stages are planned: comparing conditions, trajectories and cell fate, chromatin, surface proteins, spatial data, perturbations. On the map they are building sites.

## Fork it, fix it, build a stage

The game is open source and meant to be changed. Fork this repository to make your own version, or send a pull request to improve this one. Good first changes:

- **Fix the science.** If a room teaches something wrong or out of date, edit its file. Each room's notebook page in the game links straight to it.
- **Add something to a hall.** A prop, a line, a figure.
- **Add a tissue.** A cell system is a file of cell types, genes and words (`js/systems/`), and a pack for each later stage it can play. The shared stations read them.
- **Build a station or a stage.** The stages still to come are building sites on the map.
- **Report a problem.** Open an [issue](https://github.com/NygenAnalytics/CyteSeeing/issues).

A fork should set `G.REPO` in `js/engine/core.js` to its own address, so the links in the game point at the fork.

## How it is put together

Plain HTML, CSS and JavaScript. Classic scripts, no modules, no dependencies. All art is drawn in code in a 320 by 180 grid, at the full resolution of the screen, so it stays sharp on phones and large monitors alike.

| Path | What it holds |
| --- | --- |
| `index.html` | The page: the screen, the notebook and the terminal. It loads the engine and the world only |
| `js/engine/` | `core.js`: canvas, palette, pixel helpers, input, sound, saves, scenes, speech boxes, the main loop. `book.js`: the notebook and terminal panel. `loader.js`: fetches a stage's scripts when the player walks in. `fonts.js`, `main.js` |
| `js/scenarios.js` | The registry: every stage (its stations, the scripts it needs) and every project (its cell system and its route) |
| `js/world/` | `title.js`, `start.js` (signing in), `bay.js` (choosing a project), `campus.js` (the map), `hall.js` (walking a hall: what every hall shares), `figures.js` |
| `js/systems/` | One file per cell system: `immune.js`, `brain.js`. Cell types, gene tables and every tissue-specific word the first two stages use. A later stage needs more of a cell system, and that is a pack of its own: `immune.who.js` and `brain.who.js` for the Bureau, `immune.runs.js` and `brain.runs.js` for the Laundry |
| `js/data/` | The maths. `maths.js`: median, PCA, community detection, graph layout. `cloud.js`, `atlas.js`, `loads.js`: the generated data behind stages 2, 3 and 4 and what is computed on it |
| `js/stages/make/` | The core facility's furniture (`hall.js`), rooms 1-1 to 1-5 and Reviewer 2 |
| `js/stages/map/` | The Cloud's furniture (`hall.js`), stations 2-1 to 2-5 and journal club |
| `js/stages/who/` | The Bureau's furniture (`bureau.js`), stations 3-1 to 3-4 and the Chief |
| `js/stages/runs/` | The Laundry's furniture (`laundry.js`), stations 4-1 to 4-3 and the counter |

The game stays light as it grows. The page starts with about a quarter of the code. A stage's stations, its maths and the cell system of the project in hand are fetched when the player walks into that stage, and what one project worked out is dropped when the player takes up another.

**To add a cell system**, copy `js/systems/immune.js`, change the cell types, genes and words, and name it in a project in `js/scenarios.js`. The first two stages work for any system written this way. The Bureau and the Laundry need more: the sample's gene table, the references, the line-up's rounds, the name desk's drawers, and every line that names a cell or a gene. That is the system's pack for the stage, `js/systems/<id>.who.js` and `js/systems/<id>.runs.js`, loaded when the player walks in. A stage lists the systems that have a pack for it (`systems:` in `js/scenarios.js`); for any other system it shows as a building site on the map. The stations of those two stages are tuned to the numbers in the blood packs. The brain packs keep those numbers slot for slot and change the names, which is the safe way to add a tissue: a new table of numbers needs every verdict checked again.

**To add a project**, add an entry to `G.SCENARIOS` in `js/scenarios.js`: a question, a cell system, a route through the stages, and the names of the stages still to come.

**To add a stage**, add it to `G.STAGES` and put its files in `js/stages/<id>/`. Every stage brings its hall as a kit, `G.kits.<id> = { ITEMS, LINES, W, GOALS, NOTES, draw, room, line, paint }`: the things in the hall, what they say, the hall's page in the notebook and how it is drawn. A kit may add hooks for what only that hall does: `use` (what happens when the player uses one of its things), `arrive` (what is said on the first visit), `tick`, `over` and `fore` (things that move by themselves, drawn behind or in front of the player), `locked`, `label`, `mark`, `dark`, `book` and `next`. `js/stages/runs/laundry.js` is the shortest example, and `js/world/hall.js` lists the hooks.

**To add a station**, register a scene (`G.scenes.name = { enter, update, draw }`), add it to the stage's `rooms` and `scenes` in `js/scenarios.js` and to `rooms` and `tries` in `fresh()` in `js/engine/core.js`, and add an item for it to the stage's hall. Give its notebook page an `aim` and some `goals` and the goal lights appear by themselves. A `G.Beats` list of lines is spoken in a speech box on the screen: by the stage's mentor, or by whoever the line names (`'NOOR: ...'`). A line can carry a `spot` rectangle, which is lit while it is said, and can be a function when its words depend on the cell system. `G.resultDraw` has the mentor explain a result before the buttons appear, and `G.cue(x, y)` draws the bouncing arrow. For the key that commits an answer use `G.act()` instead of `G.hit('a')`: it ignores the one press too many that often follows a speech. Take anything tissue-specific from `G.sys`, not from the station's own code.

**To add something to poke**, add an item, its lines and a drawing to the kit of the hall it belongs in. The notebook page of each hall links to that file.

Open `index.html?debug` to get `window.__game` in the console, for example `__game.go('cliff')`.

## A note on the science

The rooms teach the reasoning behind each step, not exact numbers. The data is generated, not real, and some things are simplified on purpose:

- The doublet rate uses the common rule of thumb for a standard 10x chip: about 0.8% per 1,000 cells recovered.
- The profile test in room 1-2 stands in for EmptyDrops. It shows what the test does and how `lower` and the FDR threshold change the outcome, without running the real statistics.
- Room 1-4 uses one soup share for every cell. Real tools can estimate it per cluster or per cell.
- Room 1-5 scores cells on a two-dimensional map. Real doublet callers do the same thing in a space with many more dimensions.
- The Cloud uses 207 genes where a real matrix has about 20,000, so the numbers are scaled down: 40 genes there stands for roughly 2,000, and a handful of components for the usual 10 to 50. The terminal shows the real-size gene counts.
- Room 2-2 scores genes the way Seurat's "vst" does (variance of values standardised by the mean-variance trend, then clipped), with a running median in place of the fitted curve.
- The Cloud judges a setting by how often a cell's nearest neighbours are of its own cell type. The game knows the cell types because it generated the cells. With real data you do not.
- The Map table is not UMAP. It is a plain force layout of the neighbour graph: linked cells pull together, crowded cells push apart. It also starts from random positions, where real UMAP starts from a rough first guess (a spectral layout or the principal components). That exaggerates how much a map changes between runs, and the station says so. The lesson itself holds for real UMAP: do not interpret the position, distance or size of islands.
- In room 2-2 the mitochondrial and ribosomal genes are built to vary for technical reasons, so leaving them out helps. With real data that is a judgement call, and the room says so.
- The Bureau uses a second generated sample. Expression levels are set so that detection looks like real droplet data: CD4 RNA, for example, is caught in about a third of the CD4 T cells and in more of the monocytes. The game knows what each cluster really is, because it generated the cells, and uses that only to decide which cluster each lesson is about. The numbers on screen are computed from the cells.
- The Cut runs Louvain, modularity optimisation with a resolution parameter, on a neighbour graph whose links are weighted by shared neighbours. Leiden optimises the same score and guarantees well-connected clusters, and is what you should use on real data.
- "A split has genes behind it" is a rule made for the game: at least 3 genes with a 3-fold difference and an AUC of 0.85 or more between the two sides. "A cluster hides a group" means that clustering it again on its own links gives parts that pass that rule. On this sample no single resolution clears both, which is common with real data but not guaranteed.
- The Bureau's map is a force layout started from the first two principal components. Like a UMAP, it is for looking at.
- The line-up's 60% inside and 20% outside are a rule of thumb, not a standard. Its p-values come from a rank-sum test with a normal approximation and a correction for ties.
- The Name desk's drawers are a small hand-made hierarchy for blood cells, not the Cell Ontology, and a name counts as supported when its genes are in at least 60% of the cluster and the genes it should lack are in at most 30%.
- The Oracle is the simplest kind of label transfer: each cell takes the label of the reference profile it correlates with best over the marker genes, and a cluster takes the majority label. Its blood reference is built from the same averages the cells were generated from, so it is as good as a reference gets, and it still cannot name a cell type it does not contain. The lung reference is invented.
- The Laundry uses three generated runs of one kind of sample. A run's effect is one factor per gene, shared by every cell type, and the run that waited on the bench also carries a handling signature (JUN, FOS and others), stronger in monocytes. Real batch effects are messier and differ more between cell types.
- At the sorting table, two islands are partners when each is the other's best match by correlation of their mean expression, after each run's own mean is subtracted. It stands in for mutual nearest neighbours, which do the same cell by cell.
- The Wash runs the Harmony algorithm of 2019 (soft clustering with a diversity penalty, then a ridge regression in each cluster) on 268 cells with 9 clusters, from the best of 8 k-means starts, for at most 20 rounds. It is written from the paper and will not match any implementation number for number. On this sample theta 2 and 4 pass, lower values leave the runs apart, and 8 and 16 pull the platelets into another island. Where those boundaries fall is a property of this small sample, not of Harmony.
- RUNS MIXED and PLATELETS APART are counts over each cell's 10 nearest neighbours, in the spirit of iLISI and cLISI. The second one uses the game's knowledge of which cells are platelets. With real data you would look at their marker genes, which is what the PPBP light is for.
- Lost and found maps in the manner of Symphony, with a vote among the 5 nearest reference cells. The plasma cells land among the B cells with unanimous votes and at ordinary distances, because the genes that set them apart were never among the reference's variable genes. The lamp's test, one marker gene per label, seen or not seen, is deliberately crude. A real check uses several markers and compares groups of cells.
- The counter's gauge is Cramér's V between the batch label and the condition. Real designs have more to balance (sex, age, where a sample was collected), and a bridging sample helps only as far as the run affects it the way it affects the other samples.
- The brain cell system follows the numbers of the blood one, slot for slot, in every stage. Only the names change, so each station gives the verdicts that were tuned on blood. In the first two stages: two related cell types, one apart, one large and a rare relative of it (pan-neuronal genes shared by excitatory and inhibitory neurons, intermediate progenitors between radial glia and neurons, outer radial glia as the rare type). In the Bureau: deep-layer neurons, newborn neurons, intermediate progenitors, interneurons, ventricular and outer radial glia, oligodendrocyte precursors, and doublets of a neuron and a radial glia cell. Real developing cortex has more cell types and far more gradual transitions.
- What the blood lessons become in the cortex. The programme that runs at its own strength in every CD8 T cell is the switch from progenitor to neuron, still running in newborn neurons. CD4, famous and rarely caught, is FEZF2, which radial glia make too ([Guo et al. 2013](https://doi.org/10.1016/j.neuron.2013.09.037)). The genes B cells share with monocytes are SOX6 ([Azim et al. 2009](https://doi.org/10.1038/nn.2387)) and NPAS3, which interneurons share with radial glia and oligodendrocyte precursors. CD14 and CD16 monocytes are ventricular and outer radial glia ([Pollen et al. 2015](https://doi.org/10.1016/j.cell.2015.09.004)). The reference with a gap is a fetal atlas made from younger tissue, with no oligodendrocyte precursors, and the wrong reference is an adult atlas, which calls radial glia astrocytes.
- The genes of both cell systems were checked against expression data in [CZ CELLxGENE](https://doi.org/10.1093/nar/gkae1142): blood from healthy donors (13 million cells from 63 data sets), and fetal human brain, mainly [Bhaduri et al. 2021](https://doi.org/10.1038/s41586-021-03910-8) and [Wang et al. 2025](https://doi.org/10.1038/s41586-024-08351-7). Where a row did not fit, the gene was changed and the numbers were kept. Some rows still do not fit. In blood: MAL is the best RNA marker of CD4 T cells there is, and it is caught in about a quarter of them; CD8A and CD8B are in about half of CD8 T cells, and FOXP3 in about one regulatory T cell in six; the table gives NK cells less CD3E than the quarter of them that carry it; JCHAIN is also in about a quarter of B cells; in the first two stages the rare dendritic cells carry S100A8 and S100A9 almost as monocytes do, which is too much. In the cortex: CCND2 is also made by oligodendrocyte precursors and by ventricular radial glia ([Glickstein et al. 2009](https://doi.org/10.1523/JNEUROSCI.2284-09.2009); [Tsunekawa et al. 2012](https://doi.org/10.1038/emboj.2012.43)); the precursors make no FEZF2; intermediate progenitors carry NEUROD6, NEUROD2 and TBR1 at about half the rate of neurons, where the table gives them almost none; HMGB2 and TOP2A run higher in radial glia than in intermediate progenitors, not lower; the sample's interneurons are all of one kind, where real tissue of this age has many from the caudal ganglionic eminence too; the subplate genes are NR4A2, a marker from rodents, and ST18, which [Polioudakis et al. 2019](https://doi.org/10.1016/j.neuron.2019.06.011) confirmed in human tissue. That data does not tell ventricular from outer radial glia, so those rows rest on Pollen et al. 2015.
- In the brain's Laundry, microglia are the cells only one run caught, and striatal neurons are the cells the reference has never seen: they are given the interneuron label, and NXPH1, which these cortical interneurons carry, is dark in them. Four numbers differ from the blood table, because the blood ones would be false: microglia make no SLC17A6, striatal neurons make SNAP25, microglia make MEF2C ([Deczkowska et al. 2017](https://doi.org/10.1038/s41467-017-00769-0)), and CX3CR1 is set higher so that the microglia stay an island of their own. The handling signature of the run that waited is stronger in one cell type because the game makes it so; nothing says radial glia react more than other cells.

The recommendations follow the [Single-cell best practices](https://www.sc-best-practices.org/) book and the papers behind each method. For the Laundry: the [integration chapter](https://www.sc-best-practices.org/cellular-structure/integration/) of that book, Harmony ([Korsunsky et al. 2019](https://doi.org/10.1038/s41592-019-0619-0)), mutual nearest neighbours ([Haghverdi et al. 2018](https://doi.org/10.1038/nbt.4091)), a benchmark of integration methods and the metrics it scores them by ([Luecken et al. 2022](https://doi.org/10.1038/s41592-021-01336-8)), Symphony ([Kang et al. 2021](https://doi.org/10.1038/s41467-021-25957-x)), pooling donors in one run and telling them apart by genotype ([Kang et al. 2018](https://doi.org/10.1038/nbt.4042)), and the CyteArc pages on [batch correction](https://docs.nygen.io/CyteArc/tutorials/batch-correction/) and [reference mapping](https://docs.nygen.io/CyteArc/tutorials/mapping-and-label-transfer/). For the Bureau: Leiden ([Traag et al. 2019](https://doi.org/10.1038/s41598-019-41695-z)), why p-values computed after clustering are too small ([Zhang et al. 2019](https://doi.org/10.1016/j.cels.2019.07.012)), a benchmark of marker gene methods ([Pullin and McCarthy 2024](https://doi.org/10.1186/s13059-024-03183-0)), CellTypist ([Domínguez Conde et al. 2022](https://doi.org/10.1126/science.abl5197)), SingleR ([Aran et al. 2019](https://doi.org/10.1038/s41590-018-0276-y)) and the [CyteType](https://docs.nygen.io/CyteType/) and [CyteArc](https://docs.nygen.io/CyteArc/) documentation. For the first two stages: EmptyDrops ([Lun et al. 2019](https://doi.org/10.1186/s13059-019-1662-y)), SoupX ([Young and Behjati 2020](https://doi.org/10.1093/gigascience/giaa151)), Scrublet ([Wolock et al. 2019](https://doi.org/10.1016/j.cels.2018.11.005)), scDblFinder ([Germain et al. 2021](https://doi.org/10.12688/f1000research.73600.2)), variable gene selection in Seurat v3 ([Stuart et al. 2019](https://doi.org/10.1016/j.cell.2019.05.031)), sctransform ([Hafemeister and Satija 2019](https://doi.org/10.1186/s13059-019-1874-1)) and a comparison of normalising transformations ([Ahlmann-Eltze and Huber 2023](https://doi.org/10.1038/s41592-023-01814-1)).

## Credits and licence

Made by [Nygen Analytics](https://github.com/NygenAnalytics). Released under the BSD 3-Clause licence, see `LICENSE`.

The idea of a walkable pixel world with one topic per room comes from Phil Ewels's [scverse 2026 keynote](https://github.com/ewels/scverse2026-keynote). The code and art here are separate.

Fonts: Silkscreen and VT323, SIL Open Font License 1.1. Licence texts are in `licenses/`.
