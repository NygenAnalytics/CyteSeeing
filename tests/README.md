# Tests

The game has no build and nothing to install. The tests do: they play the game in a headless browser with [Playwright](https://playwright.dev).

```bash
cd tests
npm install
npx playwright install chromium
```

Then, from the repository root:

```bash
node tests/run.js quick
```

```bash
node tests/run.js full
```

`quick` takes about a minute and a half and runs on every push (`.github/workflows/test.yml`). `full` plays every stage for both projects, by keyboard and by touch, and takes about an hour. Name tests to run only those, for example `node tests/run.js stage3 touch4`.

A playthrough waits fixed times between key presses, so a busy machine can make one stumble. The runner gives a failed test one more go before it calls it failed. Output, screenshots and a transcript of every line spoken go to `tests/out/<name>/`.

## What each script does

| Script | What it checks |
| --- | --- |
| `maths.js` | Without a browser: for every cell system, the numbers the stations of stages 3 and 4 are tuned to (clusters at each resolution, the final clusters, the line-up, the wash verdict at each theta, the islands). Run this first after changing a gene table |
| `smoke.js` | A new player: title, sign-in, the arrivals bay, taking a parcel, the map, walking into stage 1. Prints which scripts were fetched on demand |
| `http.js` | The game served over http: a stage's scripts arrive on demand, with the version tag |
| `projects.js` | Taking the brain project, opening its stations, switching to blood and back: each project keeps its own progress |
| `stage1.js` to `stage4.js` | One stage by keyboard, start to finish. `stage3.js` and `stage4.js` take `clean` or `slips` (one mistake of each kind on the way) |
| `touch-start.js`, `touch1.js` to `touch4.js` | The same by taps and drags on three phone sizes |
| `soak.js` | In and out of every scene for eight rounds, changing project each round: page elements and listeners must not grow, and the heap must settle |
| `fuzz.js` | Random keys and clicks from a cold start: no errors, and the game keeps running |
| `live.js` | The deployed site in a real browser: `node tests/live.js https://docs.nygen.io/CyteSeeing/ tests/out/live` |
| `maths-bureau.js`, `maths-laundry.js` | The harnesses behind `maths.js`. Each also prints its full record: `node tests/maths-bureau.js brain` |
| `sheet.py` | Puts screenshots side by side for a quick look: `python3 tests/sheet.py out.png a.png b.png c.png` |

Most scripts take the page to test and a folder for their output, and read the project from `SCEN` (`response` for blood, `cortex` for brain):

```bash
SCEN=cortex node tests/stage3.js "$PWD/index.html" tests/out/try clean
```

## How the scripts drive the game

Open `index.html?debug` and the game exposes itself as `window.__game`. Every scene has a `dbg` object with what a test needs: where things are, what the right answer is, a way to jump to a spot in a hall. The scripts press keys and tap the screen as a player would, and use `dbg` only to know where to press. `lib.js` holds the helpers they share.

A new station should come with `dbg` hooks, and a new stage with a script like `stage4.js`.
