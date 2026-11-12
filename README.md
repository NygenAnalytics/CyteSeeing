# CyteSeeing

A pixel-art game for learning single-cell analysis. You walk through a research institute, poke at everything, and play each analysis step as a small hands-on puzzle. The aim is to make an abstract subject visible, and to have some fun on the way.

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
| <kbd>L</kbd> | Floor directory, from anywhere in a corridor |
| <kbd>M</kbd> | Sound on or off (off by default) |
| <kbd>F</kbd> | Full screen |

Mouse and touch work for everything: click or tap a spot to walk there, click a thing to walk over and poke it, drag sliders and lines, and tap "Leave" to step out of a room.

On a phone the game is playable with taps alone. Held upright, there is a row of buttons under the screen. Held sideways, the screen fills the height and a thumb pad sits on each side.

Progress is saved in the browser. "Restart game" in the page header wipes it.

## What is in it so far

The ground floor, the core facility: from a tube of cells to a clean count matrix.

| Room | You do | You learn |
| --- | --- | --- |
| 1-1 Droplet bay | Choose how many cells to load, and across how many lanes | Doublets rise with every cell you load |
| 1-2 The Cliff | Separate cells from empty droplets on the barcode rank plot | A count cut-off is not enough; test each barcode against the ambient profile |
| 1-3 QC gate | Filter damaged cells by genes detected and mitochondrial share | Thresholds from a tutorial do not transfer; read lenient ones off the data |
| 1-4 Soup kitchen | Measure and remove ambient RNA | Use genes a cell cannot express; too much correction erases real signal |
| 1-5 Doublet hunt | Make artificial doublets, score the cells, pick a cut-off | Same-type doublets are invisible, and real transitions sit between clusters too |
| Reviewer 2 | Answer five questions about what you just did | Whether any of it stuck |

Floor 2, the Cloud: from a count matrix to a map you know how to read. This floor has no rooms. It is one hall with a glass pipeline along the wall. Your data rides the pipe from station to station, you walk beside it, and each finished station shows what the data looks like now on its monitor.

| Station | You do | You learn |
| --- | --- | --- |
| 2-1 Leveller | Colour the cells to find what drives the picture, then divide by depth and take logs | Until you normalise, sequencing depth is the biggest difference between cells |
| 2-2 Gene picker | Choose how to rank genes, how many to keep, and whether to skip mitochondrial and ribosomal genes | Rank by variance above the trend; too few genes or too many both lose the rare cells |
| 2-3 Rotator | Turn an axis through two genes to find the widest spread, then choose how many components to keep | What a principal component is, how to read the elbow, and why too few is the worse mistake |
| 2-4 Neighbours | Choose how many neighbours each cell is linked to, and watch the neighbour graph redraw | Too few neighbours and a cell type falls into pieces; too many and a small population is absorbed |
| 2-5 Map table | Draw the neighbour graph as a flat map, draw it again from a new random start, and say what is the same in both | Which cells sit together can be trusted; the position, distance and size of islands cannot |
| Journal club | Your student presents your map. Nod at the fair claims, object to the rest | A UMAP is a map, not a result |

Every station on floor 2 runs real arithmetic on one small generated matrix (174 cells of five cell types, 207 genes): normalisation, a variance score, PCA, nearest neighbours and a force layout. Nothing is scripted. The map you unfold is computed live, from your own choices upstream.

Everything the game tells you is said inside the game. Your mentor, Mika on the ground floor and Noor on floor 2, briefs you in a few short lines when you arrive, with the part of the screen being talked about lit up. When a result passes or fails, the mentor says why. While you play there is no text: an arrow points at what to press next, the meters show their targets, and the goals show as lights. <kbd>G</kbd> opens the goals as a list. In the corridors, a bouncing arrow marks where to go next.

In a hurry, or only here for one topic? Open the floor directory with <kbd>L</kbd> and go where you like. If you have no data for a floor or a step, your student will make some for you, with default settings. You get no stars for work you did not do, and you can always go back and do it yourself.

Choices carry over. The load you pick in 1-1 sets how many doublets are waiting in 1-5. The cells you rescue or lose at the Cliff are the cells you filter in 1-3. The genes you pick in 2-2 are the genes 2-3 rotates, the components you keep are the ones 2-4 measures neighbours in, and the neighbour graph you lock is the one 2-5 draws.

As you clear rooms, the notebook writes your methods section from the settings you actually chose: loading, cell calling, filtering thresholds, contamination fraction, doublet cut-off, normalisation, gene selection, the number of components, the number of neighbours and the layout seed.

The two corridors have more than 30 things to poke. Most answer with a line or two, some move, and ten open a pixel-art figure with a caption (a UMAP, a flow cell mid-run, a cDNA trace, a volcano plot, a scree plot and others).

Each room has a notebook with the objective and field notes, and a terminal that shows the same step in real tool syntax: Scanpy, Seurat, CyteArc, and the specialist tool for the job (DropletUtils, SoupX, CellBender, scDblFinder, Scrublet). Highlighted values in the code are live: change them in the game or in the code.

Floors 3 to 10 are planned. The lift directory in the game lists them.

## Fork it, fix it, build a floor

The game is open source and meant to be changed. Fork this repository to make your own version, or send a pull request to improve this one. Good first changes:

- **Fix the science.** If a room teaches something wrong or out of date, edit its file. Each room's notebook page in the game links straight to it.
- **Add something to the corridor.** A prop, a line, a figure. The corridor is one file.
- **Build a room or a floor.** Floors 3 to 10 are listed in the lift and not built yet.
- **Report a problem.** Open an [issue](https://github.com/NygenAnalytics/CyteSeeing/issues).

A fork should set `G.REPO` in `js/core.js` to its own address, so the links in the game point at the fork.

## How it is put together

Plain HTML, CSS and JavaScript. Classic scripts, no modules, no dependencies. All art is drawn in code in a 320 by 180 grid, at the full resolution of the screen, so it stays sharp on phones and large monitors alike.

| File | What it holds |
| --- | --- |
| `index.html` | The page: the screen, the notebook and the terminal |
| `js/core.js` | Canvas, palette, pixel helpers, input, sound, save, scenes, speech boxes and the main loop. The game's name is `G.NAME` here |
| `js/book.js` | The notebook and terminal panel, and the binding between code values and the game |
| `js/title.js` | Title screen |
| `js/corridor.js` | Both floors and the lift: items, their lines, their drawings and interactions, the pipeline on floor 2, and the student who does your work |
| `js/figures.js` | The figures that open from props |
| `js/droplets.js`, `js/cliff.js`, `js/qc.js`, `js/soup.js`, `js/doublets.js` | Rooms 1-1 to 1-5 |
| `js/review.js` | Reviewer 2 |
| `js/cloud.js` | The count matrix behind floor 2 and its maths: normalisation, gene scores, PCA, neighbours, the map layout |
| `js/norm.js`, `js/hvg.js`, `js/pca.js`, `js/knn.js`, `js/umap.js` | Stations 2-1 to 2-5 |
| `js/club.js` | Journal club |
| `js/fonts.js` | The two pixel fonts, embedded |
| `js/main.js` | Boot |

To add something to poke, add an entry to `ITEMS_G` or `ITEMS_2` in `js/corridor.js`, its lines to `LINES` (or a figure id from `js/figures.js`), and a drawing to `drawItem`.

To add a room, register a scene (`G.scenes.name = { enter, update, draw }`), add a door or a station to the floor's items and its id to the floor's `rooms` in `FLOORSET`, add it to `rooms` and `tries` in `fresh()` in `js/core.js`, and add a `<script>` tag to `index.html`. Give its notebook page an `aim` and some `goals` and the goal lights appear by themselves. A `G.Beats` list of lines is spoken in a speech box on the screen: by the floor's mentor, or by whoever the line names (`'NOOR: ...'`). A line can carry a `spot` rectangle, which is lit while it is said. `G.resultDraw` has the mentor explain a result before the buttons appear, and `G.cue(x, y)` draws the bouncing arrow.

Open `index.html?debug` to get `window.__game` in the console, for example `__game.go('cliff')`.

## A note on the science

The rooms teach the reasoning behind each step, not exact numbers. The data is generated, not real, and some things are simplified on purpose:

- The doublet rate uses the common rule of thumb for a standard 10x chip: about 0.8% per 1,000 cells recovered.
- The profile test in room 1-2 stands in for EmptyDrops. It shows what the test does and how `lower` and the FDR threshold change the outcome, without running the real statistics.
- Room 1-4 uses one soup share for every cell. Real tools can estimate it per cluster or per cell.
- Room 1-5 scores cells on a two-dimensional map. Real doublet callers do the same thing in a space with many more dimensions.
- Floor 2 uses 207 genes where a real matrix has about 20,000, so the numbers are scaled down: 40 genes there stands for roughly 2,000, and a handful of components for the usual 20 to 50. The terminal shows the real-size gene counts.
- Room 2-2 scores genes the way Seurat's "vst" does (variance of values standardised by the mean-variance trend, then clipped), with a running median in place of the fitted curve.
- Floor 2 judges a setting by how often a cell's nearest neighbours are of its own cell type. The game knows the cell types because it generated the cells. With real data you do not.
- The Map table is not UMAP. It is a plain force layout of the neighbour graph: linked cells pull together, crowded cells push apart. It also starts from random positions, where real UMAP starts from a rough first guess (a spectral layout or the principal components). That exaggerates how much a map changes between runs, and the station says so. The lesson itself holds for real UMAP: do not interpret the position, distance or size of islands.
- In room 2-2 the mitochondrial and ribosomal genes are built to vary for technical reasons, so leaving them out helps. With real data that is a judgement call, and the room says so.

The recommendations follow the [Single-cell best practices](https://www.sc-best-practices.org/) book and the papers behind each method: EmptyDrops ([Lun et al. 2019](https://doi.org/10.1186/s13059-019-1662-y)), SoupX ([Young and Behjati 2020](https://doi.org/10.1093/gigascience/giaa151)), Scrublet ([Wolock et al. 2019](https://doi.org/10.1016/j.cels.2018.11.005)), scDblFinder ([Germain et al. 2021](https://doi.org/10.12688/f1000research.73600.2)), variable gene selection in Seurat v3 ([Stuart et al. 2019](https://doi.org/10.1016/j.cell.2019.05.031)), sctransform ([Hafemeister and Satija 2019](https://doi.org/10.1186/s13059-019-1874-1)) and a comparison of normalising transformations ([Ahlmann-Eltze and Huber 2023](https://doi.org/10.1038/s41592-023-01814-1)).

## Credits and licence

Made by [Nygen Analytics](https://github.com/NygenAnalytics). Released under the BSD 3-Clause licence, see `LICENSE`.

The idea of a walkable pixel world with one topic per room comes from Phil Ewels's [scverse 2026 keynote](https://github.com/ewels/scverse2026-keynote). The code and art here are separate.

Fonts: Silkscreen and VT323, SIL Open Font License 1.1. Licence texts are in `licenses/`.
