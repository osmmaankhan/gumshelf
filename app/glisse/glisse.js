/* Glisse for GumShelf — a plain-JS port of Glisse 0.5.0's internals.
 * Upstream: https://github.com/0kzh/glisse (src/internal/spring.ts, press.ts,
 * lens.ts, refraction.ts). Copyright (c) 2026 Kelvin Zhang. MIT License:
 * see app/vendor/glisse/LICENSE. Ported without React; GumShelf owns the DOM,
 * this file only animates and paints it.
 *
 * window.Glisse:
 *   spring(value, stiffness, damping, paint)  closed-form damped spring
 *   press(el)                                 iOS-26-style press tug on an element
 *   glass(el, {bend})                         lit rim + (optionally) refracting backdrop
 *   backdropLens(el)                          a backdrop lens whose bend grows with lift
 *   refitAll()                                re-read --lg-* settings and repaint
 *   reduced()                                 whether motion is reduced
 */
(function (root) {
  'use strict';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const NS = 'http://www.w3.org/2000/svg';
  const body = () => document.body;

  function reduced() {
    const b = body();
    return !!b && (b.dataset.motion !== 'full' || matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(forced-colors: active)').matches);
  }

  /* ---------- spring.ts ---------- */
  const moving = new Set();
  let frame = 0, last = 0;
  function advance(s, dt) {
    const x = s.value - s.target, v = s.velocity, half = s.damping / 2, disc = half * half - s.stiffness;
    if (Math.abs(disc) < 1e-4) {
      const decay = Math.exp(-half * dt), b = v + half * x;
      s.value = s.target + decay * (x + b * dt);
      s.velocity = decay * (v - half * b * dt);
    } else if (disc > 0) {
      const r = Math.sqrt(disc), r1 = -half + r, r2 = -half - r, a = (v - r2 * x) / (r1 - r2), b = x - a;
      s.value = s.target + a * Math.exp(r1 * dt) + b * Math.exp(r2 * dt);
      s.velocity = a * r1 * Math.exp(r1 * dt) + b * r2 * Math.exp(r2 * dt);
    } else {
      const w = Math.sqrt(-disc), decay = Math.exp(-half * dt), cos = Math.cos(w * dt), sin = Math.sin(w * dt);
      s.value = s.target + decay * (x * cos + ((v + half * x) / w) * sin);
      s.velocity = decay * (v * cos - ((half * v + s.stiffness * x) / w) * sin);
    }
  }
  function tick(time) {
    frame = 0;
    const dt = Math.min(0.1, Math.max(0, (time - last) / 1000));
    last = time;
    for (const s of moving) {
      advance(s, dt);
      if (Math.abs(s.value - s.target) < 1e-4 && Math.abs(s.velocity) < 1e-3) { s.value = s.target; s.velocity = 0; moving.delete(s); }
      s.paint(s.value);
    }
    if (moving.size) frame = requestAnimationFrame(tick);
  }
  function spring(value, stiffness, damping, paint) {
    const s = { value, target: value, velocity: 0, stiffness, damping, paint };
    return {
      get value() { return s.value; },
      get target() { return s.target; },
      paint: () => paint(s.value),
      set(target, instant = false) {
        s.target = target;
        if (instant || document.hidden || reduced()) { s.value = target; s.velocity = 0; moving.delete(s); paint(target); return; }
        moving.add(s);
        if (!frame) { last = Number(document.timeline?.currentTime ?? performance.now()); frame = requestAnimationFrame(tick); }
      },
      jump(value) { s.value = s.target = value; s.velocity = 0; moving.delete(s); paint(value); },
      tune(k, c) { s.stiffness = k; s.damping = c; },
      stop() { moving.delete(s); }
    };
  }

  /* ---------- press.ts ---------- */
  const POINTER = { grow: 6, press: [417.6, 29.2], release: [230, 23.7] };
  const TOUCH = { grow: 15, press: [515, 27.3], release: [250, 11.8] };
  const pressed = new WeakMap();
  function press(el, event) {
    let p = pressed.get(el);
    if (!p) {
      const value = [1, 1, 0, 0];
      const paint = () => { el.style.scale = value[0] + ' ' + value[1]; el.style.translate = value[2] + 'px ' + value[3] + 'px'; };
      p = { springs: value.map((v, i) => spring(v, ...POINTER.release, n => { value[i] = n; paint(); })), pointer: null };
      pressed.set(el, p);
    }
    const target = (next, [k, c]) => p.springs.forEach((s, i) => { s.tune(k, c); s.set(next[i]); });
    const track = e => {
      const { box, feel } = p.pointer;
      el.style.setProperty('--lg-x', ((e.clientX - box.left) / box.width) * 100 + '%');
      el.style.setProperty('--lg-y', ((e.clientY - box.top) / box.height) * 100 + '%');
      const { width, height } = box;
      const base = 1 + feel.grow / Math.max(width, height), aspect = width / height;
      const dx = (e.clientX - p.pointer.x) / aspect, dy = e.clientY - p.pointer.y, len = Math.hypot(dx, dy);
      if (!len) return target([base, base, 0, 0], feel.press);
      const nx = dx / len, ny = dy / len, rubber = 1 - 1 / (1 + len / height / (5 * aspect));
      const stretch = 1 + (6 / height) * rubber * Math.abs(Math.abs(nx) - Math.abs(ny)), horizontal = Math.abs(nx) > Math.abs(ny);
      target([base * (horizontal ? stretch : 1 / stretch), base * (horizontal ? 1 / stretch : stretch), nx * 8 * rubber, ny * 8 * rubber], feel.press);
    };
    const move = e => { if (e.pointerId === p.pointer?.id) track(e); };
    const end = e => {
      if (e && e.pointerId !== p.pointer?.id) return;
      const feel = p.pointer?.feel || POINTER;
      p.pointer = null;
      delete el.dataset.pressed;
      removeEventListener('pointermove', move); removeEventListener('pointerup', end); removeEventListener('pointercancel', end); removeEventListener('blur', end);
      target([1, 1, 0, 0], feel.release);
    };
    if (p.pointer || reduced()) return;
    p.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, box: el.getBoundingClientRect(), feel: event.pointerType === 'mouse' ? POINTER : TOUCH };
    el.dataset.pressed = '';
    addEventListener('pointermove', move); addEventListener('pointerup', end); addEventListener('pointercancel', end); addEventListener('blur', end);
    track(event);
  }

  /* ---------- lens.ts (backdrop lens, Chromium) ---------- */
  const erf = x => Math.tanh(1.7724538509 * x);
  function distance(x, y, hw, hh, r) {
    const qx = Math.abs(x) - hw + r, qy = Math.abs(y) - hh + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  }
  function arc(sag, half) {
    const radius = (half * half + sag * sag) / (2 * sag);
    let sum = 0;
    for (let i = 0; i <= 200; i++) { const x = (i / 200) * half, sl = x / Math.sqrt(radius * radius - x * x); sum += i === 0 || i === 200 ? sl / 2 : sl; }
    const mean = sum / 200;
    return { radius, scale: mean > 0 ? 0.5 / mean : 1 };
  }
  const slope = (x, { radius, scale }) => { const inside = Math.min(x, 0.999 * radius); return (inside / Math.sqrt(radius * radius - inside * inside)) * scale; };
  // Glass: a rim band a quarter of the shorter side, a dome sagging half of it (refraction.ts GLASS).
  const GLASS = { strength: 0.45, dispersion: 0.4, depth: 0.25, dome: 0.5, splay: 1, relative: true };
  function lensMap(shape, o, density) {
    const { width, height } = shape, hw = width / 2, hh = height / 2, radius = clamp(shape.radius, 0, Math.min(hw, hh));
    const columns = Math.max(1, Math.round(width * density)), rows = Math.max(1, Math.round(height * density));
    const across = new Uint8ClampedArray(columns * rows * 4), down = new Uint8ClampedArray(columns * rows * 4), cover = new Uint8ClampedArray(columns * rows * 4);
    const grey = (d, i, v, a = 255) => { d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = a; };
    const share = o.relative ? Math.min(width, height) : 1, depth = o.depth * share, dome = o.dome * share;
    const iw = Math.max(0, hw - depth), ih = Math.max(0, hh - depth), ir = clamp(radius, 0, Math.min(iw, ih));
    const ramp = depth > 0 ? 1 / (depth * Math.SQRT2) : 1e6, sag = Math.max(0.01, Math.min(dome, Math.min(hw, hh) - 1));
    const ax = dome > 0 ? arc(sag, hw) : null, ay = dome > 0 ? arc(sag, hh) : null;
    for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
      const i = (row * columns + col) * 4, x = ((col + 0.5) / columns) * width - hw, y = ((row + 0.5) / rows) * height - hh;
      const edge = distance(x, y, hw, hh, radius);
      if (edge >= 0) { grey(across, i, 128); grey(down, i, 128); grey(cover, i, 128, 0); continue; }
      const dx = ax ? Math.sign(x) * slope(Math.abs(x), ax) : clamp(x / hw, -1, 1);
      const dy = ay ? Math.sign(y) * slope(Math.abs(y), ay) : clamp(y / hh, -1, 1);
      const falloff = 0.5 * (1 + erf(distance(x, y, iw, ih, ir) * ramp));
      grey(across, i, Math.round((0.5 - 0.5 * dx * falloff) * 255));
      grey(down, i, Math.round((0.5 - 0.5 * dy * falloff) * 255));
      grey(cover, i, 128, Math.round(255 * Math.min(1, falloff * 20, -edge)));
    }
    return { columns, rows, across, down, cover };
  }
  const encoded = new Map();
  function png(columns, rows, data) {
    const c = document.createElement('canvas'); c.width = columns; c.height = rows;
    const ctx = c.getContext('2d'), img = ctx.createImageData(columns, rows); img.data.set(data); ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }
  function maps(shape, density) {
    const key = [shape.width, shape.height, shape.radius, density].join('|');
    let m = encoded.get(key);
    if (!m) { const l = lensMap(shape, GLASS, density); m = { across: png(l.columns, l.rows, l.across), down: png(l.columns, l.rows, l.down), cover: png(l.columns, l.rows, l.cover) }; encoded.set(key, m); if (encoded.size > 80) encoded.delete(encoded.keys().next().value); }
    return m;
  }
  let defs = null;
  function container() {
    if (defs?.isConnected) return defs;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;pointer-events:none';
    defs = document.createElementNS(NS, 'defs'); svg.append(defs); document.body.append(svg);
    return defs;
  }
  const node = (name, attrs) => { const e = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v)); return e; };
  const CHANNELS = ['1 0 0 0 0  0 0 0 0 0  0 0 0 0 0', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0'];
  // One lens's filter: rim displaced three times (R, G, B) as the glass disperses; elsewhere untouched.
  function buildFilter(m, width, height) {
    const f = node('filter', { filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB', x: 0, y: 0, width, height });
    const box = { x: 0, y: 0, width, height, preserveAspectRatio: 'none' };
    f.append(node('feImage', { href: m.across, result: 'across', ...box }), node('feImage', { href: m.down, result: 'down', ...box }), node('feImage', { href: m.cover, result: 'raw', ...box }), node('feFlood', { 'flood-color': 'rgb(128,128,128)', result: 'neutral' }));
    for (const pull of ['across', 'down']) {
      const half = node('feComponentTransfer', { in: pull + '-grey', result: pull + '-pull' }); half.append(node('feFuncA', { type: 'linear', slope: 0, intercept: 0.5 }));
      f.append(node('feComposite', { in: pull, in2: 'neutral', operator: 'over', result: pull + '-grey' }), half);
    }
    const rays = CHANNELS.map((_, i) => {
      const a = node('feDisplacementMap', { in: 'SourceGraphic', in2: 'across-pull', xChannelSelector: 'R', yChannelSelector: 'A', result: 'a' + i });
      const d = node('feDisplacementMap', { in: 'a' + i, in2: 'down-pull', xChannelSelector: 'A', yChannelSelector: 'R', result: 'ray' + i });
      f.append(a, d); return [a, d];
    });
    CHANNELS.forEach((c, i) => f.append(node('feColorMatrix', { in: 'ray' + i, type: 'matrix', values: c + '  0 0 0 0.3333 0', result: 'l' + i })));
    f.append(
      node('feComposite', { in: 'l0', in2: 'l1', operator: 'arithmetic', k2: 1, k3: 1, result: 'l01' }),
      node('feComposite', { in: 'l01', in2: 'l2', operator: 'arithmetic', k2: 1, k3: 1, result: 'spread' }),
      node('feColorMatrix', { in: 'spread', type: 'matrix', values: '3 0 0 0 0  0 3 0 0 0  0 0 3 0 0  0 0 0 1 0', result: 'bent' }),
      node('feComposite', { in: 'bent', in2: 'raw', operator: 'in', result: 'inside' }),
      node('feComposite', { in: 'SourceGraphic', in2: 'raw', operator: 'out', result: 'outside' }),
      node('feComposite', { in: 'inside', in2: 'outside', operator: 'arithmetic', k2: 1, k3: 1 })
    );
    return { filter: f, rays };
  }
  function shapeOf(el, style = getComputedStyle(el)) {
    const width = el.offsetWidth, height = el.offsetHeight;
    if (!width || !height) return null;
    const corner = style.borderTopLeftRadius;
    const radius = Math.min(width / 2, height / 2, corner.endsWith('%') ? (Math.min(width, height) * parseFloat(corner)) / 100 : parseFloat(corner) || 0);
    return { width, height, radius };
  }
  // Settings live on body as --lg-glass-bend / --lg-glass-dispersion / --lg-rim-shine / --lg-blur.
  function settings(style) {
    const n = (name, fallback) => { const v = parseFloat(style.getPropertyValue(name)); return Number.isFinite(v) ? v : fallback; };
    return { strength: clamp(n('--lg-glass-bend', GLASS.strength), 0, 1), dispersion: clamp(n('--lg-glass-dispersion', GLASS.dispersion), 0, 1), shine: clamp(n('--lg-rim-shine', 0.13), 0, 1) };
  }
  const canRefract = () => /Chrom(?:e|ium)\//.test(navigator.userAgent) && CSS.supports('backdrop-filter', 'url("#x")');

  // A backdrop lens whose bend scales with `amount` (0..1), as a lifted lens.
  function backdropLens(el) {
    let built = null, key = '', amount = 1, version = 0, fitted = null;
    const draw = () => {
      if (!built || !fitted) return;
      const { width, height, strength, dispersion } = fitted, reach = strength * Math.min(width, height) * amount;
      const spectrum = [1 + 0.2 * dispersion, 1 + 0.1 * dispersion, 1];
      built.rays.forEach(([a, d], i) => { a.setAttribute('scale', reach * spectrum[i]); d.setAttribute('scale', reach * spectrum[i]); });
      built.filter.id = 'gs-lens-' + (++version) + '-' + Math.random().toString(36).slice(2, 7);
      el.style.setProperty('--lg-filter', 'url("#' + built.filter.id + '") saturate(1.5)');
    };
    return {
      update(next) { next = Math.round(clamp(next, 0, 1) * 20) / 20; if (next === amount && built) return; amount = next; draw(); },
      refit() {
        if (!canRefract()) { el.style.removeProperty('--lg-filter'); return; }
        const style = getComputedStyle(el), shape = shapeOf(el, style);
        if (!shape) return;
        const density = Math.min(devicePixelRatio || 1, 2), s = settings(style);
        fitted = { ...shape, ...s };
        const k = [shape.width, shape.height, shape.radius, density].join('|');
        if (k !== key) { built?.filter.remove(); built = buildFilter(maps(shape, density), shape.width, shape.height); container().append(built.filter); key = k; }
        draw();
      },
      destroy() { built?.filter.remove(); built = null; el.style.removeProperty('--lg-filter'); }
    };
  }

  /* ---------- refraction.ts rim light ---------- */
  const RIM_WIDTH = 1.22, EDGE_WIDTH = 0.5;
  let palette = null;
  function colour(c) {
    palette ??= document.createElement('canvas').getContext('2d');
    palette.fillStyle = '#0000'; palette.fillStyle = c;
    const v = String(palette.fillStyle);
    if (v.startsWith('#')) return [1, 3, 5].map(a => parseInt(v.slice(a, a + 2), 16)).concat(1);
    const [r = 0, g = 0, b = 0, a = 1] = (v.match(/[\d.]+/g) || []).map(Number);
    return [r, g, b, a];
  }
  function rimMap({ width, height, radius }, shine, density, edge) {
    const columns = Math.max(1, Math.round(width * density)), rows = Math.max(1, Math.round(height * density));
    const data = new Uint8ClampedArray(columns * rows * 4), hw = width / 2, hh = height / 2, corner = clamp(radius, 0, Math.min(hw, hh)), half = 0.5 / density;
    for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
      const x = ((col + 0.5) / columns) * width - hw, y = ((row + 0.5) / rows) * height - hh, depth = -distance(x, y, hw, hh, corner);
      if (depth < -half || depth > 2 * RIM_WIDTH) continue;
      const qx = Math.abs(x) - hw + corner, qy = Math.abs(y) - hh + corner;
      let nx = 0, ny = 0;
      if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy); nx = (Math.sign(x) * qx) / l; ny = (Math.sign(y) * qy) / l; }
      else if (qx > qy) nx = Math.sign(x); else ny = Math.sign(y);
      const facing = Math.abs(nx + ny), along = Math.max(0, depth) / (RIM_WIDTH * Math.sqrt(Math.max(1, facing)));
      const cov = clamp((depth + half) * density, 0, 1), lined = clamp((Math.min(EDGE_WIDTH, depth + half) - Math.max(0, depth - half)) * density, 0, 1);
      const light = along < 1 ? shine * Math.min(1, facing) ** 1.5 * (1 - along ** 1.5) * cov : 0;
      const line = edge[3] * lined * (1 - light), alpha = light + line;
      if (alpha <= 0) continue;
      const i = (row * columns + col) * 4;
      for (let ch = 0; ch < 3; ch++) data[i + ch] = Math.round((255 * light + edge[ch] * line) / alpha);
      data[i + 3] = Math.round(255 * alpha);
    }
    return { columns, rows, data };
  }
  const rims = new Map();
  function paintRim(el) {
    const style = getComputedStyle(el), shape = shapeOf(el, style);
    if (!shape) return;
    const shine = settings(style).shine, edge = colour(style.getPropertyValue('--lg-edge').trim() || 'transparent'), density = Math.min(devicePixelRatio || 1, 3);
    const key = [shape.width, shape.height, shape.radius, shine, edge, density].join('|');
    let url = rims.get(key);
    if (!url) { const m = rimMap(shape, shine, density, edge); url = 'url("' + png(m.columns, m.rows, m.data) + '")'; rims.set(key, url); if (rims.size > 200) rims.delete(rims.keys().next().value); }
    el.style.setProperty('--lg-rim', url);
    el.setAttribute('data-rim', '');
  }

  /* ---------- glass registry ---------- */
  const glasses = new Map();
  let queued = false;
  const resize = new ResizeObserver(entries => { for (const e of entries) glasses.get(e.target)?.dirty(); schedule(); });
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(flush); } }
  function flush() {
    queued = false;
    for (const [el, g] of glasses) {
      if (!el.isConnected) { resize.unobserve(el); g.lens?.destroy(); glasses.delete(el); continue; }
      if (g.needs) { g.needs = false; paintRim(el); g.lens?.refit(); }
    }
  }
  function glass(el, { bend = false, surface = true } = {}) {
    let g = glasses.get(el);
    if (!g) {
      g = { needs: true, lens: bend ? backdropLens(el) : null, dirty() { this.needs = true; } };
      glasses.set(el, g); resize.observe(el); if (surface) el.classList.add('lg-glass'); if (bend) el.setAttribute('data-lg-bend', '');
    }
    g.dirty(); schedule();
    return g;
  }
  function refitAll() { for (const g of glasses.values()) g.dirty(); schedule(); }
  new MutationObserver(refitAll).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'], subtree: false });
  document.addEventListener('DOMContentLoaded', () => new MutationObserver(refitAll).observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'data-theme-variant', 'data-material', 'style'] }));
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', refitAll);

  const api = { spring, press, glass, backdropLens, refitAll, reduced, lensMap, rimMap, distance, GLASS, POINTER, TOUCH };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Glisse = api;
})(globalThis);
