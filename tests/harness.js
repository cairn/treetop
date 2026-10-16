/* TREETOP test harnesses: run the real game code headlessly in a vm
   with stubbed DOM/canvas and drive frames manually.
   Usage: node tests/harness.js [suite ...]
   Suites: balance wisps keyboard critic pause endless gamepad grounded ghost captions pickups trunks camera roots  (default: all)
   The DOM stubs return an element for any id, so they cannot catch
   missing-node bugs; only real-browser captures can. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];

function boot(storageInit, width) {
  const grad = { addColorStop() {} };
  const ctxStub = new Proxy({}, { get: (t, k) => {
    if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad;
    if (typeof k === 'string') return t[k] !== undefined ? t[k] : (() => {});
    return undefined;
  }, set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => ({ id, style: {}, textContent: '', innerHTML: '', classList: { toggle() {}, add() {}, remove() {} },
    addEventListener() {}, setPointerCapture() {}, appendChild() {}, getContext: () => ctxStub });
  const els = new Map();
  let simNow = 0, rafCb = null;
  const sandbox = { console, Math, JSON, setTimeout, clearTimeout,
    localStorage: { _d: { ...(storageInit || {}) }, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = v; } },
    document: { addEventListener() {}, createElement: () => ({ width: 0, height: 0, style: {}, className: '', innerHTML: '',
      addEventListener() {}, appendChild() {}, getContext: () => ctxStub }),
      getElementById: id => { if (!els.has(id)) els.set(id, el(id)); return els.get(id); } },
    performance: { now: () => simNow }, location: { search: '', href: 'https://example.test/' }, URLSearchParams };
  sandbox.window = sandbox; sandbox.innerWidth = width || 1100; sandbox.innerHeight = 750; sandbox.devicePixelRatio = 1;
  const listeners = {};
  sandbox.addEventListener = (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); };
  sandbox.requestAnimationFrame = cb => { rafCb = cb; };
  sandbox.Path2D = class { moveTo() {} lineTo() {} };
  vm.createContext(sandbox); vm.runInContext(src, sandbox);
  const run = c => vm.runInContext(c, sandbox);
  const frames = (n, ms = 16.7) => { for (let i = 0; i < n; i++) { simNow += ms; const cb = rafCb; rafCb = null; cb(simNow); if (!rafCb) throw new Error('rAF chain broke'); } };
  const key = k => { for (const fn of listeners.keydown || []) fn({ key: k, preventDefault() {} }); };
  return { run, frames, sandbox, key };
}
const AIM = `(() => {
  let best = null, bd = 1e9;
  for (const o of world.orbs){ if (o.taken || o.y < S.tip.y - 5) continue;
    const d = Math.abs(o.x - S.tip.x) * 1.6 + (o.y - S.tip.y);
    if (d < bd) { bd = d; best = o; } }
  if (!best) for (const o of world.orbs){ if (o.taken) continue;
    const d = Math.abs(o.x - S.tip.x) * 1.6 + Math.abs(o.y - S.tip.y);
    if (d < bd) { bd = d; best = o; } }
  return best;
})()`;

const suites = {
  balance() {
    const { run, frames } = boot({});
    run('startGame(false)');
    for (let i = 0; i < 60 * 175 && run('S.mode') === 'play'; i++) {
      run(`(() => { const b = ${AIM}; if (b) S.pointer = { x: sx(b.x), y: sy(b.y) }; })()`);
      frames(1);
    }
    const a = run('({ won: S.won, h: Math.floor(S.height), suns: S.suns, time: +S.time.toFixed(0) })');
    console.log('competent:', JSON.stringify(a), a.won ? 'OK' : 'FAIL: competent bot must win');
    const b2 = boot({}); b2.run('startGame(false)');
    for (let i = 0; i < 60 * 175 && b2.run('S.mode') === 'play'; i++) { b2.run('S.pointer = { x: 550, y: 40 }'); b2.frames(1); }
    const b = b2.run('({ won: S.won, h: Math.floor(S.height) })');
    // Rain is unseeded, so the starve height moves. It must still die well short of 120 m.
    console.log('lazy centre-line:', JSON.stringify(b), !b.won && b.h < 100 ? 'OK' : 'FAIL: lazy bot must starve low');
  },
  wisps() {
    const { run, frames } = boot({});
    run('startGame(false)');
    run(`(() => { const w = world.wisps[0];
      S.tip.x = w.homeX + Math.sin(S.time * 0.31 + w.ph * 1.7) * 38;
      S.tip.y = w.homeY + Math.sin(S.time * 0.23 + w.ph) * 80;
      S.pointer = { x: sx(S.tip.x), y: 40 }; })()`);
    frames(6);
    console.log('wisp touch chillT:', run('S.chillT.toFixed(2)'), run('S.chillT') > 1.5 ? 'OK' : 'FAIL');
    run('startGame(false); S.tip.y = 1400;');
    frames(30);
    console.log('below crown dormant:', run('S.chillT') === 0 ? 'OK' : 'FAIL');
  },
  keyboard() {
    const { run, frames } = boot({});
    run('startGame(false)');
    for (let i = 0; i < 60 * 175 && run('S.mode') === 'play'; i++) {
      run(`(() => { const best = ${AIM};
        let des = -Math.PI / 2;
        if (best) des = Math.atan2(-(best.y - S.tip.y), best.x - S.tip.x);
        let dd = des - S.heading;
        while (dd > Math.PI) dd -= 2 * Math.PI;
        while (dd < -Math.PI) dd += 2 * Math.PI;
        keysDown['arrowleft'] = dd < -0.12; keysDown['arrowright'] = dd > 0.12;
        keysDown['arrowup'] = Math.abs(dd) <= 0.12;
        keysDown[' '] = S.sap > 58 && Math.abs(dd) < 0.3;
      })()`);
      frames(1);
    }
    const r = run('({ won: S.won, score: S.score })');
    console.log('keyboard-only:', JSON.stringify(r), r.won ? 'OK' : 'FAIL: keyboard run must be winnable');
  },
  critic() {
    { const { run, frames } = boot({ 'treetop-stats': '{"plays":1}', 'treetop-best': 'abc' });
      frames(3);
      const ok = run('S.stats.plays') === 1 && run('S.best') === 0 && run('S.mode') === 'title';
      console.log('malformed stats boot:', ok ? 'OK' : 'FAIL'); }
    { const { run, frames } = boot({});
      run('startGame(false)');
      run('S.sap = 0.05; const o = world.orbs[0]; o.x = S.tip.x; o.y = S.tip.y; o.taken = false; S.pointer = null;');
      frames(2);
      console.log('pickup on death frame:', run('S.mode') === 'play' && run('S.suns') === 1 ? 'OK' : 'FAIL'); }
    { const { run, frames } = boot({});
      run('startGame(false)');
      const sunsBefore = run('S.stats.suns');
      run('S.tip.y = 4195; S.sap = 3; S.pointer = { x: 550, y: 30 }; S.suns = 7;');
      frames(160);
      const ok = run('S.won') === true && run('S.stats.suns') - sunsBefore === 7;
      console.log('photo-finish single count:', ok ? 'OK' : 'FAIL'); }
    { const { run, frames } = boot({}, 390);
      run('startGame(false)');
      run('(() => { const tx = sx(S.tip.x), ty = sy(S.tip.y); S.pointer = { x: tx + 100, y: ty - 100 }; })()');
      frames(40);
      const h = run('S.heading');
      console.log('portrait steering heading:', h.toFixed(3), h < -0.15 && h > -0.6 ? 'OK' : 'FAIL (want near -0.375, not -0.785)'); }
  },
  pause() {
    const { run, frames, key } = boot({});
    run('startGame(false)'); frames(10);
    const t0 = run('S.time'), y0 = run('S.tip.y');
    key('Escape');
    frames(20);
    const frozen = run('S.time') === t0 && run('S.tip.y') === y0;
    console.log('esc opens pause and freezes run:', run('S.mode') === 'pause' && frozen ? 'OK' : 'FAIL');
    console.log('pause menu shows run stats:', run(`document.getElementById('pause-stats').textContent`).includes('score') ? 'OK' : 'FAIL');
    key('Escape'); frames(5);
    console.log('esc resumes:', run('S.mode') === 'play' && run('S.time') > t0 ? 'OK' : 'FAIL');
    const plays = run('S.stats.plays'), t1 = run('S.time');
    key('r'); frames(3);
    console.log('r does not restart a live run:', run('S.mode') === 'play' && run('S.stats.plays') === plays && run('S.time') > t1 ? 'OK' : 'FAIL');
    key('Escape'); key('r'); frames(2);
    console.log('r does not restart from pause:', run('S.mode') === 'pause' && run('S.stats.plays') === plays ? 'OK' : 'FAIL');
    key('Escape'); run('quitToTitle()');
    console.log('quit to title:', run('S.mode') === 'title' ? 'OK' : 'FAIL');
  },
  endless() {
    const { run, frames } = boot({});
    run('startGame(true)');
    run('S.tip.y = 20000; S.sap = 100;');
    frames(10);
    const r = run('({ ahead: world.orbs.some(o => o.y > 20000), genTop, orbs: world.orbs.length, rivals: world.rivals.length })');
    console.log('endless generates ahead and stays bounded:', JSON.stringify(r), r.ahead && r.genTop > 22800 && r.orbs < 200 ? 'OK' : 'FAIL');
  },
  gamepad() {
    const { run, frames, sandbox } = boot({});
    const btns = Array.from({ length: 10 }, () => ({ pressed: false }));
    sandbox.navigator = { getGamepads: () => [{ connected: true, id: 'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)', axes: [-1, -1], buttons: btns }] };
    run('startGame(false)'); frames(30);
    const h = run('S.heading');
    console.log('gamepad stick steers up-left:', h.toFixed(3), h < -1.9 ? 'OK' : 'FAIL');
    btns[0].pressed = true; frames(3);
    console.log('gamepad A surges:', run('S.surge') === true || run('S.sap') < 100 ? 'OK' : 'FAIL');
    const padHtml = run(`document.getElementById('padline-title').innerHTML`);
    console.log('playstation pad detected with shape glyphs:', run('pad.kind') === 'ps' && padHtml.includes('M1.8 1.8 L10.2 10.2') ? 'OK' : 'FAIL');
    btns[0].pressed = false; btns[9].pressed = true; frames(3);
    console.log('gamepad Start pauses:', run('S.mode') === 'pause' ? 'OK' : 'FAIL');
    btns[9].pressed = false; frames(2); btns[1].pressed = true; frames(3);
    console.log('gamepad B resumes:', run('S.mode') === 'play' ? 'OK' : 'FAIL');
  },
  grounded() {
    const { run, frames } = boot({});
    run('startGame(false)'); frames(3);
    const low = run(`(() => {
      const draws = []; const old = ctx.drawImage;
      ctx.drawImage = (img, x, y, w, h) => draws.push({ img, y, h });
      S.camY = 0; drawWorld(); ctx.drawImage = old;
      const sprites = treeSprites.far.concat(treeSprites.near);
      const trees = draws.filter(d => sprites.some(s => s.c === d.img));
      const want = H * 0.68 + 6;
      // bases sit on the ground line and jitter by at most 7.5px
      const ok = trees.length > 3 && trees.every(d => {
        const sp = sprites.find(s => s.c === d.img);
        return Math.abs(d.y + sp.anchorY * (d.h / sp.h) - want) < 8;
      });
      return { n: trees.length, ok };
    })()`);
    console.log('background trees stand on the ground:', JSON.stringify(low), low.ok ? 'OK' : 'FAIL');
    const high = run(`(() => {
      const draws = []; const old = ctx.drawImage;
      ctx.drawImage = (img, x, y, w, h) => draws.push({ img, y, h });
      S.camY = 3000; drawWorld(); ctx.drawImage = old;
      const sprites = treeSprites.far.concat(treeSprites.near);
      const trees = draws.filter(d => sprites.some(s => s.c === d.img));
      const band = H * 0.68 - (1050 - S.camY * 0.35);
      const ok = trees.length > 3 && trees.every(d => d.y + d.h > band + 30);
      return { n: trees.length, ok };
    })()`);
    console.log('high forest is canopy below, no floating trunks:', JSON.stringify(high), high.ok ? 'OK' : 'FAIL');
  },
  ghost() {
    const { run, frames, sandbox } = boot({});
    run('startGame(false)');
    for (let i = 0; i < 60 * 25 && run('S.mode') === 'play'; i++) {
      run(`(() => { const b = ${AIM}; if (b) S.pointer = { x: sx(b.x), y: sy(b.y) }; })()`);
      frames(1);
    }
    run('S.sap = 0.4; S.pointer = null;'); frames(30);
    const g1 = JSON.parse(sandbox.localStorage._d['treetop-ghost'] || 'null');
    console.log('ghost saved:', !!g1 && g1.samples.length > 50 ? 'OK' : 'FAIL', g1 && g1.samples.length, 'samples');
    run('startGame(false)');
    for (let i = 0; i < 240; i++) { run(`(() => { const b = ${AIM}; if (b) S.pointer = { x: sx(b.x), y: sy(b.y) }; })()`); frames(1); }
    console.log('ghost races:', run('S.ghostIdx') > 0 ? 'OK' : 'FAIL');
    run('S.sap = 0.3; S.pointer = null;'); frames(30);
    const g2 = JSON.parse(sandbox.localStorage._d['treetop-ghost'] || 'null');
    console.log('worse run keeps ghost:', g2 && g1 && Math.round(g2.score) === Math.round(g1.score) ? 'OK' : 'FAIL');
  },
  captions() {
    const curve = boot({}).run('({ z: introAlpha(0), mid: introAlpha(1), edge: introAlpha(4.6), out: introAlpha(6.2), late: introAlpha(7) })');
    console.log('intro curve:', curve.z === 0 && curve.mid === 1 && curve.edge === 1 && curve.out === 0 && curve.late === 0 ? 'OK' : 'FAIL', JSON.stringify(curve));

    const fresh = boot({});
    fresh.run('startGame(false)');
    const intro = fresh.run('({ g: S.showGoalCaption, h: S.showGhostCaption, ghost: S.ghost, mode: S.mode })');
    console.log('first run introduces:', intro.g === true && intro.h === true && intro.ghost === null && intro.mode === 'play' ? 'OK' : 'FAIL', JSON.stringify(intro));
    fresh.run('S.time = 2'); fresh.frames(1);
    console.log('still showing before the fade:', fresh.run('S.showGoalCaption') === true && fresh.sandbox.localStorage._d['treetop-seen-goal-canopy'] == null ? 'OK' : 'FAIL');
    fresh.run('S.time = 6.3'); fresh.frames(1);
    const retired = fresh.run('({ g: S.showGoalCaption, h: S.showGhostCaption })');
    const d = fresh.sandbox.localStorage._d;
    console.log('goal retires after one look:', retired.g === false && d['treetop-seen-goal-canopy'] === '1' ? 'OK' : 'FAIL', JSON.stringify(retired));
    console.log('no ghost, metre tag stays unlearned:', retired.h === true && d['treetop-seen-ghost'] == null ? 'OK' : 'FAIL');

    const endless = boot({});
    endless.run('startGame(true); S.time = 6.3'); endless.frames(1);
    console.log('endless does not spend the goal intro:', endless.sandbox.localStorage._d['treetop-seen-goal-canopy'] == null && endless.run('S.showGoalCaption') === true ? 'OK' : 'FAIL');

    const crown = boot({});
    crown.run('curLevel = 2; startGame(false); S.time = 6.3'); crown.frames(1);
    const cd = crown.sandbox.localStorage._d;
    console.log('each level is introduced on its own:', cd['treetop-seen-goal-ancient'] === '1' && cd['treetop-seen-goal-canopy'] == null ? 'OK' : 'FAIL');

    const samples = JSON.stringify({ score: 100, won: false, samples: Array.from({ length: 12 }, (_, i) => ({ t: i * 0.2, x: 0, y: i * 40 })) });
    const raced = boot({ 'treetop-ghost': samples });
    raced.run('startGame(false)');
    console.log('ghost metres wait for a ghost:', raced.run('S.ghost && S.showGhostCaption') === true ? 'OK' : 'FAIL');
    raced.run('S.time = 6.3'); raced.frames(1);
    console.log('ghost metres retire once:', raced.run('S.showGhostCaption') === false && raced.sandbox.localStorage._d['treetop-seen-ghost'] === '1' ? 'OK' : 'FAIL');

    const quiet = boot({ 'treetop-seen-goal-canopy': '1', 'treetop-seen-ghost': '1', 'treetop-ghost': samples });
    quiet.run('startGame(false)');
    const q = quiet.run('({ g: S.showGoalCaption, h: S.showGhostCaption })');
    console.log('a later run stays quiet:', q.g === false && q.h === false ? 'OK' : 'FAIL', JSON.stringify(q));
  },
  pickups() {
    const { run } = boot({}, 320);
    const cases = [['canopy', 0, false, 2], ['spire', 1, false, 2], ['ancient', 2, false, 2], ['endless', 0, true, 8]];
    let bad = 0, side = 0, checked = 0;
    for (const [name, idx, endless, blocks] of cases) {
      run(`S.endless = ${endless}; S.levelIdx = ${idx}; S.z = 0.87; rivalCount = 0;
        world.orbs.length = 0; world.fruits.length = 0; world.drops.length = 0;
        world.shades.length = 0; world.rivals.length = 0; world.birds.length = 0; world.wisps.length = 0;`);
      for (let i = 0; i < blocks; i++) run(`buildBlock(${i} * GOAL_Y)`);
      const r = run(`(() => {
        const need = 58 * 1.12 / 2 + 46 * 1.08 * 0.57 + 8;
        let bad = 0, side = 0, pairs = 0;
        for (const f of world.fruits) {
          if (Math.abs(f.x) < 170 || Math.abs(f.x) > 420) side++;
          for (const o of world.orbs) {
            if (Math.abs(f.y - o.y) > 500) continue;
            pairs++;
            if (Math.hypot(sx(f.x) - sx(o.x), sy(f.y) - sy(o.y)) < need - 0.25) bad++;
          }
        }
        return { bad, side, pairs, fruits: world.fruits.length };
      })()`);
      bad += r.bad; side += r.side; checked += r.pairs;
      if (r.bad || r.side || r.fruits < 2) console.log(name, JSON.stringify(r));
    }
    console.log('suns and sun fruit stay apart on a narrow phone:', bad === 0 && side === 0 && checked > 20 ? 'OK' : 'FAIL', bad, 'overlaps', side, 'off-side');
  },
  trunks() {
    const { run } = boot({});
    const cases = [[0, false, 2], [1, false, 2], [2, false, 2], [0, true, 6]];
    let bad = 0, n = 0;
    for (const [idx, endless, blocks] of cases) {
      run(`S.endless = ${endless}; S.levelIdx = ${idx}; rivalCount = 0;
        world.orbs.length = 0; world.fruits.length = 0; world.drops.length = 0;
        world.shades.length = 0; world.rivals.length = 0; world.birds.length = 0; world.wisps.length = 0;`);
      for (let i = 0; i < blocks; i++) run(`buildBlock(${i} * GOAL_Y)`);
      const r = run(`(() => {
        const onWood = (x, y, self) => {
          for (const o of world.rivals) {
            if (o === self) continue;
            for (const line of [o.pts, o.stalk]) {
              if (!line) continue;
              for (let i = 0; i < line.length - 1; i++) {
                const a = line[i], b = line[i + 1];
                const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1;
                let t = ((x - a.x) * dx + (y - a.y) * dy) / l2;
                t = Math.max(0, Math.min(1, t));
                if (Math.hypot(a.x + dx * t - x, a.y + dy * t - y) < 3) return true;
              }
            }
          }
          return false;
        };
        let bad = 0, n = 0;
        for (const r of world.rivals) {
          n++;
          const s = r.stalk, base = r.pts[0];
          if (!s || s.length < 3) { bad++; continue; }
          if (Math.hypot(s[1].x - base.x, s[1].y - base.y) > 1.5) bad++;
          for (let i = 1; i < s.length; i++) {
            if (s[i].y > s[i - 1].y + 0.5) bad++;
            if (Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y) > 140) bad++;
          }
          const end = s[s.length - 1];
          if (end.y > 0.5 && !onWood(end.x, end.y, r)) bad++;
        }
        return { bad, n };
      })()`);
      bad += r.bad; n += r.n;
      if (r.bad) console.log('level', idx, endless, JSON.stringify(r));
    }
    console.log('every rival trunk reaches soil or a lower trunk:', bad === 0 && n > 10 ? 'OK' : 'FAIL', bad, 'of', n);
  },
  camera() {
    // play keeps the climbing tip on the vertical centre; the title
    // demo keeps its own higher framing; takeoff stays on the soil
    const { run, frames } = boot({});
    run('startGame(false)');
    run('S.tip.y = 900; S.tip.x = 0; S.heading = -Math.PI / 2; S.pointer = null; S.camY = 0;');
    frames(120);
    const play = run('sy(S.tip.y) - H / 2');
    console.log('play centre:', play.toFixed(1), Math.abs(play) < 18 ? 'OK' : 'FAIL');
    run('S.heading = -Math.PI * 0.25;');
    frames(90);
    const turned = run('sy(S.tip.y) - H / 2');
    console.log('turned centre:', turned.toFixed(1), Math.abs(turned) < 18 ? 'OK' : 'FAIL');
    run('S.tip.y = 8; S.camY = 400; S.heading = -Math.PI / 2;');
    frames(40);
    const low = run('sy(S.tip.y) - H / 2');
    console.log('takeoff stays on the soil:', low.toFixed(1), low > 40 ? 'OK' : 'FAIL');
    run("S.mode = 'title'; S.tip = { x: 0, y: 500 }; S.path = [{ x: 0, y: 0 }, { x: 0, y: 500 }]; S.z = 1;");
    frames(20);
    const attract = run('sy(S.tip.y) / H');
    console.log('attract stays above centre:', attract.toFixed(2), attract < 0.36 ? 'OK' : 'FAIL');
  },
  roots() {
    // a trunk that reaches the soil aims at a painted root mouth and
    // arrives on it; a trunk that joins another is left alone. The
    // sapling's own contact does the same. World stalks are not moved.
    const { run } = boot({});
    run('startGame(false)');
    for (const [W, H] of [[1100, 750], [1680, 900], [390, 780], [800, 600]]) {
      const r = run(`(() => {
        W = ${W}; H = ${H}; DPR = 1; S.z = 0.9; S.camY = 0;
        const fade = Math.round(1920 * 0.14);
        const lay = { tileW: 1920, fade, step: 1920 - fade, gy: sy(0), destH: 934 };
        let rooted = 0, joined = 0, miss = 0, far = 0;
        for (const rv of world.rivals) {
          const e = rv.stalk[rv.stalk.length - 1];
          if (e.y > 0.5) { joined++; continue; }
          rooted++;
          const before = e.x;
          const hit = nearestRoot(sx(e.x), lay);
          const d = Math.abs(hit.x - sx(e.x));
          if (d > lay.tileW * 0.2) far++;
          const reach = rootReach(d);
          if (Math.abs(bendToRoot(sx(e.x), 0, hit.x, reach) - hit.x) > 0.01) miss++;
          if (Math.abs(bendToRoot(sx(e.x), reach + 5, hit.x, reach) - sx(e.x)) > 0.01) miss++;
          if (e.x !== before) miss++;
          const ap = approachPoints(rv.stalk, hit, reach);
          if (ap.length < 2) miss++;
          else {
            const top = sy(ROOT_CUT), soil = sy(0);
            if (Math.abs(ap[0].Y - top) > 1.5) miss++;
            if (Math.abs(ap[ap.length - 1].Y - soil) > 1.5) miss++;
            if (Math.abs(ap[ap.length - 1].X - hit.x) > 0.5) miss++;
          }
        }
        const ph = nearestRoot(sx(S.path[0].x), lay);
        const pd = Math.abs(ph.x - sx(S.path[0].x));
        if (pd > lay.tileW * 0.2) far++;
        if (Math.abs(bendToRoot(sx(0), 0, ph.x, rootReach(pd)) - ph.x) > 0.01) miss++;
        return { rooted, joined, miss, far, pd: Math.round(pd) };
      })()`);
      const ok = r.miss === 0 && r.far === 0 && r.rooted >= 1 && r.joined >= 1;
      console.log('roots ' + W + ':', JSON.stringify(r), ok ? 'OK' : 'FAIL');
    }
  },
};

const want = process.argv.slice(2);
const names = want.length ? want : Object.keys(suites);
let failures = 0;
const origLog = console.log;
console.log = (...a) => { if (a.join(' ').includes('FAIL')) failures++; origLog(...a); };
for (const n of names) { console.log('== ' + n); suites[n](); }
console.log = origLog;
if (failures) { origLog(failures + ' check(s) FAILED'); process.exitCode = 1; }
