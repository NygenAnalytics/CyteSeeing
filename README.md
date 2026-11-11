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

Choices carry over. The load you pick in 1-1 sets how many doublets are waiting in 1-5. The cells you rescue or lose at the Cliff are the cells you filter in 1-3.

As you clear rooms, the notebook writes your methods section from the settings you actually chose: loading, cell calling, filtering thresholds, contamination fraction and doublet cut-off.

The corridor between the rooms has 23 things to poke. Most answer with a line or two, some move, and nine open a pixel-art figure with a caption (a UMAP, a flow cell mid-run, a cDNA trace, a volcano plot and others).

Each room has a notebook with the objective and field notes, and a terminal that shows the same step in real tool syntax: Scanpy, Seurat, CyteArc, and the specialist tool for the job (DropletUtils, SoupX, CellBender, scDblFinder, Scrublet). Highlighted values in the code are live: change them in the game or in the code.

Floors 2 to 10 are planned. The lift directory in the game lists them.

## Fork it, fix it, build a floor

The game is open source and meant to be changed. Fork this repository to make your own version, or send a pull request to improve this one. Good first changes:

- **Fix the science.** If a room teaches something wrong or out of date, edit its file. Each room's notebook page in the game links straight to it.
- **Add something to the corridor.** A prop, a line, a figure. The corridor is one file.
- **Build a room or a floor.** Floors 2 to 10 are listed in the lift and not built yet.
- **Report a problem.** Open an [issue](https://github.com/NygenAnalytics/CyteSeeing/issues).

A fork should set `G.REPO` in `js/core.js` to its own address, so the links in the game point at the fork.

## How it is put together

Plain HTML, CSS and JavaScript. Classic scripts, no modules, no dependencies. All art is drawn in code in a 320 by 180 grid, at the full resolution of the screen, so it stays sharp on phones and large monitors alike.

| File | What it holds |
| --- | --- |
| `index.html` | The page: the screen, the notebook and the terminal |
| `js/core.js` | Canvas, palette, pixel helpers, input, sound, save, scenes and the main loop. The game's name is `G.NAME` here |
| `js/book.js` | The notebook and terminal panel, and the binding between code values and the game |
| `js/title.js` | Title screen |
| `js/corridor.js` | The corridor: items, their lines, their drawings and interactions |
| `js/figures.js` | The figures that open from props |
| `js/droplets.js`, `js/cliff.js`, `js/qc.js`, `js/soup.js`, `js/doublets.js` | Rooms 1-1 to 1-5 |
| `js/review.js` | Reviewer 2 |
| `js/fonts.js` | The two pixel fonts, embedded |
| `js/main.js` | Boot |

To add something to poke, add an entry to `ITEMS` in `js/corridor.js`, its lines to `LINES` (or a figure id from `js/figures.js`), and a drawing to `drawItem`.

To add a room, register a scene (`G.scenes.name = { enter, update, draw }`), add a door to `ITEMS`, and add a `<script>` tag to `index.html`.

Open `index.html?debug` to get `window.__game` in the console, for example `__game.go('cliff')`.

## A note on the science

The rooms teach the reasoning behind each step, not exact numbers. The data is generated, not real, and some things are simplified on purpose:

- The doublet rate uses the common rule of thumb for a standard 10x chip: about 0.8% per 1,000 cells recovered.
- The profile test in room 1-2 stands in for EmptyDrops. It shows what the test does and how `lower` and the FDR threshold change the outcome, without running the real statistics.
- Room 1-4 uses one soup share for every cell. Real tools can estimate it per cluster or per cell.
- Room 1-5 scores cells on a two-dimensional map. Real doublet callers do the same thing in a space with many more dimensions.

The recommendations follow the [Single-cell best practices](https://www.sc-best-practices.org/) book and the papers behind each method: EmptyDrops ([Lun et al. 2019](https://doi.org/10.1186/s13059-019-1662-y)), SoupX ([Young and Behjati 2020](https://doi.org/10.1093/gigascience/giaa151)), Scrublet ([Wolock et al. 2019](https://doi.org/10.1016/j.cels.2018.11.005)) and scDblFinder ([Germain et al. 2021](https://doi.org/10.12688/f1000research.73600.2)).

## Credits and licence

Made by [Nygen Analytics](https://github.com/NygenAnalytics). Released under the BSD 3-Clause licence, see `LICENSE`.

The idea of a walkable pixel world with one topic per room comes from Phil Ewels's [scverse 2026 keynote](https://github.com/ewels/scverse2026-keynote). The code and art here are separate.

Fonts: Silkscreen and VT323, SIL Open Font License 1.1. Licence texts are in `licenses/`.
