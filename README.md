# TREETOP

**From twig to treetop.** A tiny race against the seasons, built for
[Project Treetop Round 01 (Games)](https://twigpine.com/treetop).

You are a sprout. Your branch never stops growing. Steer its tip with the
mouse, touch, or arrow keys and climb 120 metres to the canopy before
winter, or before your sap runs out.

## Play

Open `index.html` in any browser. No build step, no dependencies, no
network. One self-contained file: game, art, and a generative music
engine are all inside it.

## The climb

Four biomes, each with its own weather and temper:

- **The Forest Floor** (0-30 m): gentle wind, tutorial sunlight near the
  centre line so the first lesson lands in seconds.
- **The Trunk** (30-65 m): telegraphed **gusts** shove the branch
  sideways; the wind gauge flashes amber before one lands.
- **The Storm Band** (65-95 m): grey skies, visible rain, the strongest
  wind on the mountain.
- **The Crown** (95-120 m): golden light and **sun fruit**, worth 45 sap
  and 100 points each, always placed as a deliberate detour. **Frost
  wisps** drift here: touching one chills the branch for two seconds,
  growth and steering stiffened, in the stretch where the winter clock
  bites hardest.

Systems to master:

- **Sap is life.** Growth drains it; sunlight refills it (+20); rain is
  a sip (+7); shade clouds drain it fast and slow growth.
- **Surge.** Hold the mouse button, space, or a second finger to grow
  45% faster at roughly double the drain. Sprint the Storm Band; drift
  the Forest Floor. Speed is a resource decision, not a default.
- **Sun Chains.** Collect sunlight in quick succession to build a combo
  (up to x10). Chains multiply your **score** and raise the pitch of the
  pickup chime; they never feed you, so a straight line up the middle
  still starves.
- **Style points.** Near misses on rival branches (+5), startled birds
  (+15), biome crossings (+25).
- **The Ghost.** Your best-scoring run is kept, and the next run races
  it: a small gold sprout on the same clock, with a faint dotted trail.
  Beating yourself is the long game. Endless Autumn keeps its own ghost.
- **Score and grades.** Height, pickups, chains, and a win time bonus
  add up to a grade: C, B, A, or S.

## Endless Autumn

The second button on the title screen. No winter deadline and no top:
the seasons cycle, the drain deepens a little each autumn, and the only
question is how high you get. Height and score carry the run.

## Craft notes

- The course is generated from a fixed seed, so every player races the
  same sky. Rival branch layouts, shade, and orb trails are identical
  run to run; mastery is real.
- The soundtrack is a generative pentatonic sequencer (Web Audio, no
  audio files) that layers bass, harmony, and bells as you cross
  biomes, over wind and rain noise beds driven by the actual weather
  simulation.
- Best height, lifetime stats, and best score persist in `localStorage`.
- Pauses automatically when the tab loses focus. `P` pause, `M` mute,
  `R` restart, `E` from the title for Endless.
- The results card has a **Share result** button (copies your score
  line and the play link), and its advice line is cause-aware: starve
  with few suns collected and it tells you to hunt orbs; die to winter
  and it tells you where to surge.
- `prefers-reduced-motion` is honoured: no screen shake, no slow
  motion on the win.
- The test harnesses in `tests/harness.js` drive the real game code
  headlessly (balance bots, keyboard-only win, frost wisps, ghost,
  and regression tests for the critic rounds): `node tests/harness.js`.
- The four hero actors (the sprout tip, sun orbs, frost wisps, and
  sun fruits) are generated watercolour sprites, embedded in the
  file as data URIs and sized near their on-screen size so software
  rendering stays fast; each keeps its procedural drawing as a
  fallback. Sprite sources and the keying script live in
  `sprites-src/`, the processed sprites in `sprites-final/`.

Built with AI assistance (allowed by the round rules) during the round
window, 14-16 October 2026.

## For the judges

- **Trailer:** [`docs/trailer.mp4`](docs/trailer.mp4), 29 seconds of
  real gameplay (title, climb, Crown, win card) with an original piano
  loop. The in-game music is generative; the trailer score is a
  stand-in in the same pentatonic family.
- **Screenshots:** [`docs/floor.png`](docs/floor.png) ·
  [`docs/storm.png`](docs/storm.png) · [`docs/crown.png`](docs/crown.png) ·
  [`docs/win.png`](docs/win.png) · [`docs/portrait.png`](docs/portrait.png)
  (phone layout) · share card [`docs/share.png`](docs/share.png).
- **Balance, measured:** scripted playtest bots drive the real game
  code. A passive centre-line run starves at ~50 m; an orb-seeking run
  wins in ~65 s with ~35 s of season to spare; a casual run wins in
  ~45 s. The economy was tuned against those bots, not by feel.
- **Performance, measured:** the game's own JavaScript costs about
  2 ms per frame; in a fully software-rendered browser (no GPU) it
  holds 57-60 fps. Rendering uses prerendered tree sprites and width
  batched branch paths, so ordinary hardware has ample headroom.
- **Robustness:** every `localStorage` access sits behind a fallback,
  so the game boots and plays even in sandboxed embeds and strict
  privacy modes; tested with a storage layer that throws on every call.
