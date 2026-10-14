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
  and 100 points each, always placed as a deliberate detour.

Systems to master:

- **Sap is life.** Growth drains it; sunlight refills it (+20); rain is
  a sip (+7); shade clouds drain it fast and slow growth.
- **Sun Chains.** Collect sunlight in quick succession to build a combo
  (up to x10). Chains multiply your **score** and raise the pitch of the
  pickup chime; they never feed you, so a straight line up the middle
  still starves.
- **Style points.** Near misses on rival branches (+5), startled birds
  (+15), biome crossings (+25).
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

Built with AI assistance (allowed by the round rules) during the round
window, 14-16 October 2026.
