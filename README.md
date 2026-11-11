# CyteSeeing

A pixel-art game for learning single-cell analysis. You walk through a research institute, poke at everything, and play each analysis step as a small hands-on puzzle. The aim is to make an abstract subject visible, and to have some fun on the way.

It is built for people who learn by doing: students, clinicians, postdocs, and anyone who has been handed a count matrix and a deadline.

## Play

Open `index.html` in a browser. There is nothing to install and no build step.

| Key | Does |
| --- | --- |
| <kbd>←</kbd> <kbd>→</kbd> | Walk, and adjust the selected control |
| <kbd>Space</kbd> / <kbd>Enter</kbd> | Talk, read, poke, open doors, confirm |
| <kbd>↑</kbd> <kbd>↓</kbd> | Pick a control inside a room |
| <kbd>Esc</kbd> | Leave a room |
| <kbd>M</kbd> | Sound on or off (off by default) |

Mouse and touch work too: click the floor to walk, click things to poke them, drag sliders and lines.

Progress is saved in the browser. "Restart game" in the page header wipes it.

## What is in it so far

The ground floor, the core facility:

- **The corridor.** 23 things to poke. Most answer with a line or two, some move, and nine open a pixel-art figure with a caption (a UMAP, a flow cell mid-run, a cDNA trace, a volcano plot and others).
- **Room 1-1, the droplet bay.** A microfluidic chip. Choose how many cells to load and across how many lanes, to get 8,000 singlets with 4% doublets or fewer.
- **Room 1-2, the Cliff.** The barcode rank plot. First draw a UMI cut-off and find that no line works, then test each barcode against the ambient profile, the way EmptyDrops does.

Choices carry over: the load you pick in 1-1 sets the data in 1-2, and the doublets you made come along as called cells.

Each room has a notebook with the objective and field notes, and a terminal that shows the same step in real tool syntax (DropletUtils, Cell Ranger, CyteArc, Scanpy and Seurat). Highlighted values in the code are live: change them in the game or in the code.

Rooms 1-3 to 1-5 (quality control, ambient RNA, doublets) and floors 2 to 10 are planned. The lift directory in the game lists them.

## How it is put together

Plain HTML, CSS and JavaScript. Classic scripts, no modules, no dependencies. All art is drawn in code on a 320 by 180 canvas and scaled up by a whole number.

| File | What it holds |
| --- | --- |
| `index.html` | The page: the screen, the notebook and the terminal |
| `js/core.js` | Canvas, palette, pixel helpers, input, sound, save, scenes and the main loop. The game's name is `G.NAME` here |
| `js/book.js` | The notebook and terminal panel, and the binding between code values and the game |
| `js/title.js` | Title screen |
| `js/corridor.js` | The corridor: items, their lines, their drawings and interactions |
| `js/figures.js` | The figures that open from props |
| `js/droplets.js` | Room 1-1 |
| `js/cliff.js` | Room 1-2 |
| `js/fonts.js` | The two pixel fonts, embedded |
| `js/main.js` | Boot |

To add something to poke, add an entry to `ITEMS` in `js/corridor.js`, its lines to `LINES` (or a figure id from `js/figures.js`), and a drawing to `drawItem`.

To add a room, register a scene (`G.scenes.name = { enter, update, draw }`), add a door to `ITEMS`, and add a `<script>` tag to `index.html`.

Open `index.html?debug` to get `window.__game` in the console, for example `__game.go('cliff')`.

## A note on the science

The rooms teach the reasoning behind each step, not exact numbers. The data is generated, not real, and some things are simplified on purpose:

- The doublet rate uses the common rule of thumb for a standard 10x chip: about 0.8% per 1,000 cells recovered.
- The profile test in room 1-2 stands in for EmptyDrops. It shows what the test does and how `lower` and the FDR threshold change the outcome, without running the real statistics.

The recommendations follow the [Single-cell best practices](https://www.sc-best-practices.org/) book, the 10x Genomics analysis guides, and EmptyDrops ([Lun et al. 2019](https://doi.org/10.1186/s13059-019-1662-y)).

## Credits

Made by [Nygen Analytics](https://www.nygen.io/).

The idea of a walkable pixel world with one topic per room comes from Phil Ewels's [scverse 2026 keynote](https://github.com/ewels/scverse2026-keynote). The code and art here are separate.

Fonts: Silkscreen and VT323, SIL Open Font License 1.1. Licence texts are in `licenses/`.
