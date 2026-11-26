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

`quick` takes about four minutes and runs on every push (`.github/workflows/test.yml`). `full` plays every stage and the review at the end of both projects, by keyboard and by touch, and takes more than an hour. Name tests to run only those, for example `node tests/run.js stage3 touch4`.

The runner serves the game on port 8765 for the tests that need http. Set `PORT` to use another, for example when two runs share a machine: `PORT=8766 node tests/run.js quick`.

A playthrough waits fixed times between key presses, so a busy machine can make one stumble. The runner gives a failed test one more go before it calls it failed. Output, screenshots and a transcript of every line spoken go to `tests/out/<name>/`.

## What each script does

| Script | What it checks |
| --- | --- |
| `maths.js` | Without a browser: for every cell system, the numbers the stations of stages 3 and 4 are tuned to (clusters at each resolution, the final clusters, the line-up, the wash verdict at each theta, the islands), and for blood the numbers of stage 5 (which claims hold on donors, which formulas jam, what every rule lights on the stairs, what one pump can do), and for brain the numbers of its stage 5 (which road runs the right way, which islands are joined, which lever notch reads, which train is oldest, which gene marks which state). Run this first after changing a gene table |
| `smoke.js` | A new player: the title, straight into the arrivals bay, a name from the badge printer, taking a parcel, the map, walking into stage 1. Prints which scripts were fetched on demand |
| `http.js` | The game served over http: a stage's scripts arrive on demand, with the version tag |
| `projects.js` | Taking the brain project, opening its stations, switching to blood and back: each project keeps its own progress |
| `stats.js` | Play statistics and the request sheet. In a test nothing is fetched from PostHog and nothing is sent: a new player's events are written down and checked, and the name on the badge must be in none of them. The sheet by keyboard and by taps. Then the way events really leave, over http, with every request to PostHog caught before it goes: no cookie, nothing kept in the browser. It uses the real library where `npm install` has put it, and a stand-in otherwise. Last, a copy with no key: it counts nothing and its board leads to GitHub |
| `oldsave.js` | A save written before stage 5 existed, for either project: it loads with its stars, the new stage is open on the map, and its first station plays. With `v8`, a save with all five stages done that was written before the Long Gallery existed: it loads, the gallery is at the end of the road with a full wall, and the review starts |
| `stage1.js` to `stage5.js` | One stage by keyboard, start to finish. `stage3.js`, `stage4.js` and `stage5.js` take `clean` or `slips` (one mistake of each kind on the way). `stage5.js` is the blood project's fifth stage and `stage5-cortex.js` is the brain project's, which takes `clean` or `slips` too |
| `touch-start.js`, `touch1.js` to `touch5.js`, `touch5-cortex.js` | The same by taps, drags and held fingers on three phone sizes |
| `gallery.js` | The Long Gallery, the end of either project, by keyboard, from a finished save. `clean` measures every plate and every line that can be said, walks the five questions to their frames, hears the close, and looks for the ribbon in the arrivals bay. `slips` points at every near miss first and starts again at the end. `hung` is a new player sent straight there: Tomo's steps say so, frames hang empty, and the review waits |
| `touch-gallery.js` | The same by taps on three phone sizes: a tap on a frame walks to it, and a second tap answers |
| `done.js` | Not a test: the finished save the gallery tests start from. `done('cortex', { by: ['soup'], owe: ['board'] })` gives one with a step run by Tomo and a room still to do |
| `turn.js` | An upright phone with the game turned on its side, on two phone sizes: the screen grows and stays inside the window, the thumb pads stand at its ends, a tap lands where the finger is, turning the phone for real hands over to the ordinary sideways layout and back, and UPRIGHT undoes it |
| `answers.js` | A question with two answers (a parcel label, a stage on the map, a door in a corridor): the left-hand answer by mouse and by finger puts the question away and the game keeps running. It once froze. And a frame that throws is reported, and the next one is drawn all the same |
| `restart.js` | Restart game from the map, a stage hall and a station: the title at once, and no error from a scene drawn on a project that has gone. And a click on a button or a code tab of the page gives the keyboard back to the game, while a button pressed from the keyboard keeps it |
| `soak.js` | In and out of every scene and along the Long Gallery for eight rounds, changing project each round: page elements and listeners must not grow, and the heap must settle |
| `fuzz.js` | Random keys and clicks from a cold start: no errors, and the game keeps running |
| `fuzz-gallery.js` | The same in the Long Gallery and at its close, which a cold start never reaches: from a finished save with the questions settled, one with a step that Tomo ran, and one whose wall is not full |
| `live.js` | The deployed site in a real browser: `node tests/live.js https://docs.nygen.io/CyteSeeing/ tests/out/live` |
| `maths-bureau.js`, `maths-laundry.js`, `maths-changes.js`, `maths-order.js` | The harnesses behind `maths.js`. Each also prints its full record: `node tests/maths-bureau.js brain`, `node tests/maths-changes.js`, `node tests/maths-order.js` |
| `sheet.py` | Puts screenshots side by side for a quick look: `python3 tests/sheet.py out.png a.png b.png c.png` |

Most scripts take the page to test and a folder for their output, and read the project from `SCEN` (`response` for blood, `cortex` for brain):

```bash
SCEN=cortex node tests/stage3.js "$PWD/index.html" tests/out/try clean
```

## How the scripts drive the game

Open `index.html?debug` and the game exposes itself as `window.__game`. Every scene has a `dbg` object with what a test needs: where things are, what the right answer is, a way to jump to a spot in a hall. The scripts press keys and tap the screen as a player would, and use `dbg` only to know where to press. `lib.js` holds the helpers they share.

A new station should come with `dbg` hooks, and a new stage with a script like `stage5.js`. A hall with a game of its own, like the Long Gallery, keeps its hooks on its kit: `__game.kits.gallery.dbg`.
