/* TREETOP test harnesses: run the real game code headlessly in a vm
   with stubbed DOM/canvas and drive frames manually.
   Usage: node tests/harness.js [suite ...]
   Suites: balance wisps keyboard critic ghost  (default: all)
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
  }, set: () => true });
  const el = id => ({ id, style: {}, textContent: '', classList: { toggle() {}, add() {}, remove() {} },
    addEventListener() {}, setPointerCapture() {}, getContext: () => ctxStub });
  const els = new Map();
  let simNow = 0, rafCb = null;
  const sandbox = { console, Math, JSON, setTimeout, clearTimeout,
    localStorage: { _d: { ...(storageInit || {}) }, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = v; } },
    document: { addEventListener() {}, createElement: () => ({ width: 0, height: 0, style: {}, getContext: () => ctxStub }),
      getElementById: id => { if (!els.has(id)) els.set(id, el(id)); return els.get(id); } },
    performance: { now: () => simNow }, location: { search: '', href: 'https://example.test/' }, URLSearchParams };
  sandbox.window = sandbox; sandbox.innerWidth = width || 1100; sandbox.innerHeight = 750; sandbox.devicePixelRatio = 1;
  sandbox.addEventListener = () => {};
  sandbox.requestAnimationFrame = cb => { rafCb = cb; };
  sandbox.Path2D = class { moveTo() {} lineTo() {} };
  vm.createContext(sandbox); vm.runInContext(src, sandbox);
  const run = c => vm.runInContext(c, sandbox);
  const frames = (n, ms = 16.7) => { for (let i = 0; i < n; i++) { simNow += ms; const cb = rafCb; rafCb = null; cb(simNow); if (!rafCb) throw new Error('rAF chain broke'); } };
  return { run, frames, sandbox };
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
    console.log('lazy centre-line:', JSON.stringify(b), !b.won && b.h < 70 ? 'OK' : 'FAIL: lazy bot must starve low');
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
};

const want = process.argv.slice(2);
const names = want.length ? want : Object.keys(suites);
for (const n of names) { console.log('== ' + n); suites[n](); }
