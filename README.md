# TREETOP

**From twig to treetop.** A tiny race against the seasons, built for
[Project Treetop Round 01 (Games)](https://twigpine.com/treetop).

You are a sprout. Your branch never stops growing. Steer its tip with the
mouse, touch, arrow keys, or a controller and climb 120 metres to the canopy before
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

- **Sap is life.** Growth drains it; sunlight refills it (+22); rain is
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
the course generates new blocks ahead of you and prunes behind you
forever, the seasons cycle, the drain deepens a little each autumn,
and the only question is how high you get. Height and score carry the run.

## Craft notes

- The course is generated from a fixed seed, so every player races the
  same sky. Rival branch layouts, shade, and orb trails are identical
  run to run; mastery is real.
- The soundtrack is a composed 16-bar theme in D major ("The Climb":
  antecedent bars 1-8 ending on the dominant, consequent 9-16 resolving
  home, over a I-V-vi-IV progression), re-orchestrated adaptively as
  you climb: solo lead and bass on the Forest Floor, pad, counter-melody
  and arpeggio through the Trunk, driving kick, hats and pulsing bass
  in the Storm Band, and bells with an octave-radiant lead in the Crown.
  Late season adds tremolo strings and a borrowed-minor winter variant.
  All synthesized with Web Audio (no audio files) through a bus mix with
  generated-impulse reverb, dotted-eighth delay, glue compression and
  limiting, over wind and rain noise beds driven by the actual weather
  simulation. Pickup chimes are glass bells pitched in the score's key,
  and a sun chain brightens the chime as it climbs. At game
  over the score resolves onto a final tonic chord and fades to
  silence instead of looping behind the results card.
- Best height, lifetime stats, and best score persist in `localStorage`.
- **Controller:** any standard gamepad steers with the left stick or
  D-pad, surges on the bottom face button or right trigger, pauses on
  Start/Options or the top face button, toggles sound on the left face
  button, and confirms with the bottom face button. PlayStation pads
  (DualSense and DualShock are detected by name and vendor ID) get the
  △ ○ ✕ □ shape glyphs in their colours on every prompt; other pads
  get ABXY glyphs.
- Pauses automatically when the tab loses focus. `Esc` or `P` opens the
  pause menu (resume, restart, sound, quit to title), `M` mute,
  `E` from the title for Endless. Restarting a live run is only the
  pause menu's **Restart run** button: there is no restart key to hit
  by accident.
- The results card has a **Share result** button (copies your score
  line and the play link), and its advice line is cause-aware: starve
  with few suns collected and it tells you to hunt orbs; die to winter
  and it tells you where to surge.
- `prefers-reduced-motion` is honoured: no screen shake, no slow
  motion on the win.
- The test harnesses in `tests/harness.js` drive the real game code
  headlessly (balance bots, keyboard-only win, frost wisps, ghost,
  pause menu, grounded background trees, caption introductions, and
  regression tests for the critic rounds): `node tests/harness.js`.
- Typography is embedded, not system-default: Baloo 2 for the logo
  and buttons, Quicksand for body text, and Fraunces (a soft serif)
  for HUD labels, numerals, and in-world text (latin subsets, SIL
  Open Font License 1.1), inlined as data URIs so the file stays
  self-contained.
- The four hero actors (the sprout tip, sun orbs, frost wisps, and
  sun fruits) are generated watercolour sprites, embedded in the
  file as data URIs and sized near their on-screen size so software
  rendering stays fast; each keeps its procedural drawing as a
  fallback. The obstacles and background have generated assets too:
  far and near background trees, oak, pine, and blossom rival
  canopies, and the shade canopy cloud. A rival trunk runs down to
  the soil, or into a lower trunk that does. One that reaches the soil
  bends into the nearest painted root and fades along that wood, and
  the growing vine does the same where it leaves the soil. The pine
  crown is a mound of needles, seated on that wood like the other
  crowns. Rival stalks and the vine are solid limbs in that same tan.
  A wrapped bark strip drew stripes, so it is not used. The sprites
  are exported near the
  size they are drawn at, so a small bitmap is not stretched across
  the frame. The leaf sprig the branch
  wears along its stalk, a painted soil cross-section for the
  takeoff ground (tiled at device-pixel scale, not stretched),
  and wildlife (a deer and fox on the near hill, a rabbit at the
  ground line, bluebirds crossing the sky). The sun
  that crosses the sky is a painted glow too, exported near the
  size it is drawn, with the flat disc kept until it loads. The solid
  sprites are magenta-keyed from
  `sprites-src/asset-*.jpg` into `sprites-final/`; the sky sun is
  luminance-keyed from `asset-sun.jpg`. Raindrops are a painted
  teardrop (`drop.png`), with the flat ellipse kept until it loads.
  Sprite sources and the keying script live in `sprites-src/`.
- Three levels, three scores: **The First Canopy** (120 m),
  **The Storm Spire** (170 m), and **The Ancient Crown** (220 m),
  picked on the title card. Each level is its own seeded course with
  a season clock sized to its height, a per-level ghost and best
  record, and its own composed score ("The Climb", "The Storm
  Spire", "The Ancient Crown") switched at loop boundaries by
  `musicSetTrack()`.
- A cinematic layer borrows its staging from Krillbite's *The Plan*:
  light shafts behind the silhouettes that widen and warm as the
  crown nears, backlit motes drifting in the light, out-of-focus
  foreground leaves framing the edges of the frame, and a permanent
  soft vignette. Atmosphere as composition, not decoration; the
  gameplay plane stays sharp and readable in front of it.

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
  code. A passive centre-line run starves at ~52 m; an orb-seeking run
  wins in ~55 s against the 100-second season; a moderate run (quarter
  second steering reactions, imperfect aim, no surge) wins in ~58 s.
  The economy was tuned against those bots, not by feel.
- **Performance, measured:** the game's own JavaScript costs about
  2 ms per frame; in a fully software-rendered browser (no GPU) it
  holds 57-60 fps. Rendering uses prerendered tree sprites and width
  batched branch paths, so ordinary hardware has ample headroom.
- **Robustness:** every `localStorage` access sits behind a fallback,
  so the game boots and plays even in sandboxed embeds and strict
  privacy modes; tested with a storage layer that throws on every call.
