# TREETOP

**From twig to treetop.** A tiny race against the seasons, in one HTML file.

You are a sprout. Your branch never stops growing; steer its tip toward the
light and climb 120 metres to the canopy before winter arrives.

- **Sunlight orbs** feed your sap. No sap, no growth.
- **Rain drops** are a drink on the way up.
- **Shade clouds** drain you, **wind** bends you, rival branches block you.
- Controls: mouse, touch, or arrow keys / WASD-ish steering. `P` pause,
  `M` sound, `R` restart.

Built for [Project Treetop](https://twigpine.com/treetop), Round 01 (Games),
in October 2026. No engine, no assets, no build step: the art is procedural
canvas and the music-box sound effects are synthesized with WebAudio.

## Play

Open `index.html` in any browser, or serve the folder:

```sh
python3 -m http.server 8903
# then open http://localhost:8903
```

Your best climb is kept in `localStorage`.

## Layout

- `index.html` — the whole game (markup, style, world generation, physics,
  rendering, sound).
- The course (sun orbs, shade, rival trees) is generated from a fixed seed,
  so every player races the same sky.
