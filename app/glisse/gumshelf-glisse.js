/* Wires Glisse (glisse.js) into GumShelf's existing markup. Presentation only:
 * native clicks, inputs, checkboxes and app state stay owned by app.js.
 * app.js re-renders by replacing #app's markup, so every animated control keeps
 * its spring state by id here and the new element continues where the old one was. */
(function () {
  'use strict';
  const G = window.Glisse, body = document.body, app = document.querySelector('#app'), modal = document.querySelector('#modal');
  if (!G || !app) return;
  const full = () => !G.reduced();

  /* ---------- Input modality: focus rings only for keyboard users ---------- */
  const setInput = mode => { if (body.dataset.input !== mode) body.dataset.input = mode; };
  addEventListener('pointerdown', () => setInput('pointer'), { capture: true, passive: true });
  addEventListener('keydown', e => { if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'F6'].includes(e.key)) setInput('keyboard'); }, { capture: true });
  setInput('pointer');

  /* ---------- Glass controller -> Glisse settings (whole app) ----------
   * Settings > Glass effects writes --glass-displacement (Bend 0–12),
   * --glass-dispersion (0–1), --glass-frost (px) and --glass-rim (0–1) on body.
   * Bend/Dispersion drive every lens (sidebar, slider, segmented, sample);
   * Frost drives the blur of every glass surface; Rim drives the rim light on
   * buttons, fields, menus, the sidebar and the top bar. */
  let lastSettings = '';
  function syncSettings() {
    const cs = getComputedStyle(body), n = (name, d) => { const v = parseFloat(cs.getPropertyValue(name)); return Number.isFinite(v) ? v : d; };
    const dark = body.dataset.theme === 'dark';
    const bend = n('--glass-displacement', 12) / 12 * 0.45;
    const dispersion = n('--glass-dispersion', 0.5);
    const frost = n('--glass-frost', 3);
    const rim = n('--glass-rim', 0.45);
    const shine = Math.round(Math.min(1, rim * (dark ? 0.3 : 0.67)) * 20) / 20; // 0.05 steps: rim images are cached per value
    const next = [bend, dispersion, frost, shine, dark].join('|');
    if (next === lastSettings) return;
    lastSettings = next;
    body.style.setProperty('--lg-glass-bend', bend.toFixed(3));
    body.style.setProperty('--lg-glass-dispersion', dispersion.toFixed(3));
    body.style.setProperty('--lg-blur', frost + 'px');
    body.style.setProperty('--lg-panel-blur', Math.max(frost * 3, 8) + 'px');
    body.style.setProperty('--lg-rim-shine', shine.toFixed(3));
    body.style.setProperty('--lg-rim-alpha', Math.min(1, rim * 1.6).toFixed(3));
    if (draggingGlass) { for (const el of document.querySelectorAll('.glass-demo-lens')) G.glass(el, { bend: true }); refitPending = true; }
    else G.refitAll();
  }
  /* Slider performance: Settings > Glass effects fires an event on every pixel of a drag.
   * Coalesce to one update per frame, and while the thumb is held repaint only the
   * sample lens (one element) instead of every rim and lens filter in the app
   * (~30 canvas images + filter rebuilds per event caused the stutter). On release,
   * after the app is idle for a moment, everything catches up once. */
  let draggingGlass = false, refitPending = false, syncFrame = 0, settleTimer = 0;
  function scheduleSync() { if (!syncFrame) syncFrame = requestAnimationFrame(() => { syncFrame = 0; syncSettings(); }); }
  function settle() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { draggingGlass = false; if (refitPending) { refitPending = false; G.refitAll(); } }, 140);
  }
  document.addEventListener('pointerdown', e => { if (e.target.matches?.('input[type=range][id^="glass-"]')) { draggingGlass = true; clearTimeout(settleTimer); } }, true);
  for (const t of ['pointerup', 'pointercancel']) addEventListener(t, () => { if (draggingGlass) settle(); }, true);
  document.addEventListener('change', e => { if (e.target.matches?.('input[type=range][id^="glass-"]')) settle(); }, true);
  document.addEventListener('keyup', e => { if (e.target.matches?.('input[type=range][id^="glass-"]')) { draggingGlass = true; settle(); } }, true);
  document.addEventListener('gumshelf-appearance', scheduleSync);
  new MutationObserver(syncSettings).observe(body, { attributes: true, attributeFilter: ['data-theme', 'data-theme-variant'] });

  /* ---------- Decorate surfaces ---------- */
  const GLASS = '.btn:not(.text):not(.primary), .icon-button, .search, [popover], .home-mode, .theme-pick';
  function decorate(root) {
    for (const el of root.querySelectorAll(GLASS)) G.glass(el);
    for (const el of root.querySelectorAll('.rail, .topline')) G.glass(el, { surface: false });
    for (const el of root.querySelectorAll('.glass-demo-lens')) G.glass(el, { bend: true });
    for (const group of root.querySelectorAll('.theme-pick, .home-mode')) segmented(group);
    for (const grid of root.querySelectorAll('.category-grid, .product-list, .collection, .home-row, .home-tiles')) {
      let i = 0; for (const child of grid.children) { if (i > 12) break; child.style.setProperty('--lg-i', i++); }
    }
    for (const input of root.querySelectorAll('#notifications, #home-typewriter, #home-quote-shuffle')) switchControl(input);
  }
  let queued = false;
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; decorate(app); if (modal) decorate(modal); syncSettings(); }); } };
  new MutationObserver(schedule).observe(app, { childList: true, subtree: true });
  if (modal) new MutationObserver(schedule).observe(modal, { childList: true, subtree: true });

  /* ---------- Press (Glisse Button feel) ---------- */
  const PRESS = '.btn, .icon-button, .chip, .type-chip, .home-pick, .home-card, .home-tile, .category-card, .creator-card, .theme-pick label, .home-mode label, .search-clear, .select-row';
  document.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.button !== 0) return;
    const el = e.target.closest?.(PRESS);
    if (!el || el.matches(':disabled') || el.closest('.rail-nav')) return;
    G.press(el, e);
  }, { passive: true });

  /* ---------- Slider: the thumb grows in place into a glass lens (Glisse slider) ----------
   * At lift 0 the lens is exactly the thumb (same centre, same size); as the lift
   * spring [2000, 80] rises it grows to 1.5x wide / 1.35x tall, the white thumb
   * crossfades out and the track shows through the bending glass. It follows the
   * value every frame with no CSS transition, so it never travels or jumps. */
  const SLIDER_LENS = false;
  const lens = document.createElement('div');
  lens.className = 'lg-range-lens'; lens.setAttribute('aria-hidden', 'true'); lens.hidden = true; body.append(lens);
  const lensGlass = G.glass(lens, { bend: true, surface: false });
  let held = null, geo = null;
  function thumbGeometry(el) {
    const b = el.getBoundingClientRect(), cs = getComputedStyle(el), min = +el.min || 0, max = +el.max || 100;
    const p = max > min ? Math.max(0, Math.min(1, (+el.value - min) / (max - min))) : 0;
    const tw = parseFloat(cs.getPropertyValue('--range-thumb-width')) || 32, th = parseFloat(cs.getPropertyValue('--range-thumb-height')) || 20;
    const rtl = cs.direction === 'rtl', share = rtl ? 1 - p : p;
    return { cx: b.left + tw / 2 + (b.width - tw) * share, cy: b.top + b.height / 2, tw, th };
  }
  const W = 1.5, H = 1.35;
  function paintLens(lift) {
    if (!geo) return;
    const w = geo.tw * W, h = geo.th * H;
    // Size is the lifted size; scale shrinks it back onto the thumb at rest.
    lens.style.width = w + 'px'; lens.style.height = h + 'px';
    lens.style.transform = `translate(${geo.cx - w / 2}px, ${geo.cy - h / 2}px)`;
    const sx = 1 / W + (1 - 1 / W) * lift, sy = 1 / H + (1 - 1 / H) * lift;
    lens.style.scale = sx.toFixed(4) + ' ' + sy.toFixed(4);
    lens.style.setProperty('--lg-lift', lift.toFixed(3));
    lens.style.opacity = Math.min(1, lift * 3).toFixed(3);
    if (held) held.input.style.setProperty('--lg-thumb-fade', Math.max(0, 1 - lift * 3).toFixed(3));
  }
  const lensLift = G.spring(0, 2000, 80, v => {
    paintLens(v);
    lensGlass.lens?.update(v);
    if (v <= 0.005 && !held) { lens.hidden = true; geo = null; }
  });
  function follow() { if (held) { geo = thumbGeometry(held.input); paintLens(lensLift.value); } }
  document.addEventListener('pointerdown', e => {
    if (!SLIDER_LENS) return; // glass slider lens switched off for now (user request); sliders stay plain
    const input = e.target.closest?.('input[type=range]');
    if (!input || input.disabled || !e.isPrimary) return;
    held = { input, id: e.pointerId };
    if (!full()) return;
    input.setAttribute('data-lg-lifted', '');
    // Place it on the thumb *before* it becomes visible.
    geo = thumbGeometry(input); lensLift.jump(0); paintLens(0);
    lens.hidden = false; lensGlass.dirty(); G.refitAll();
    lensLift.set(1);
  }, { passive: true });
  const dropRange = e => {
    if (!held || (e && e.pointerId !== undefined && e.pointerId !== held.id)) return;
    const input = held.input; held = null;
    lensLift.set(0);
    // Thumb comes back as the lens settles onto it.
    const restore = () => { if (!held || held.input !== input) { input.removeAttribute('data-lg-lifted'); input.style.removeProperty('--lg-thumb-fade'); } };
    setTimeout(restore, 180);
  };
  for (const t of ['pointerup', 'pointercancel']) addEventListener(t, dropRange, { passive: true });
  addEventListener('blur', () => dropRange());
  document.addEventListener('input', e => { if (held && e.target === held.input) follow(); }, true);
  addEventListener('pointermove', e => { if (held && e.pointerId === held.id) requestAnimationFrame(follow); }, { passive: true });
  document.addEventListener('scroll', follow, { capture: true, passive: true });

  /* ---------- Eased card sizes: categories/creators and library products ---------- */
  const rootStyle = document.documentElement.style;
  function easedVar(source, live, k, c, fallback) {
    const s = G.spring(parseFloat(rootStyle.getPropertyValue(source)) || fallback, k, c, v => rootStyle.setProperty(live, v.toFixed(2) + 'px'));
    s.jump(s.value);
    let last = parseFloat(rootStyle.getPropertyValue(source));
    new MutationObserver(() => {
      const v = parseFloat(rootStyle.getPropertyValue(source));
      if (!Number.isFinite(v) || v === last) return;
      last = v; s.set(v);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return s;
  }
  const cardSize = easedVar('--category-card-min', '--category-card-live', 676, 47.8, 190);
  easedVar('--product-card-min', '--product-card-live', 676, 47.8, 340);
  document.addEventListener('input', e => { if (e.target.id === 'category-size') cardSize.set(Number(e.target.value)); }, true);

  /* ---------- Switch: position/colour [1000, 80], lift [2000, 80] ---------- */
  const switchState = new Map(); // id -> { pos, lift, input }
  function switchControl(input) {
    const id = input.id;
    let s = switchState.get(id);
    if (!s) {
      s = { input };
      s.pos = G.spring(input.checked ? 1 : 0, 1000, 80, v => s.input.style.setProperty('--lg-switch', v.toFixed(3)));
      s.lift = G.spring(0, 2000, 80, v => s.input.style.setProperty('--lg-lift', v.toFixed(3)));
      s.pos.jump(input.checked ? 1 : 0);
      switchState.set(id, s);
    }
    if (s.input !== input) { s.input = input; s.pos.paint(); s.lift.paint(); }
    if (input.dataset.lgSwitch === undefined) {
      input.setAttribute('data-lg-switch', '');
      input.addEventListener('pointerdown', () => s.lift.set(full() ? 1 : 0));
      for (const t of ['pointerup', 'pointercancel', 'pointerleave', 'blur']) input.addEventListener(t, () => s.lift.set(0));
    }
    s.pos.set(input.checked ? 1 : 0);
  }
  // Animate the instant it is clicked (before any re-render arrives).
  document.addEventListener('change', e => { const s = switchState.get(e.target.id); if (s && e.target === s.input) s.pos.set(e.target.checked ? 1 : 0); }, true);

  /* ---------- Segmented control: sliding thumb [1024, 58.9], kept across renders ---------- */
  const segState = new Map(); // key -> { x, w, springs }
  function segKey(group) { return group.className.split(' ')[0] + ':' + (group.querySelector('input')?.name || ''); }
  function segmented(group) {
    const key = segKey(group);
    let st = segState.get(key);
    if (!st) {
      st = { g: { x: 0, w: 0, y: 0, h: 0 }, thumb: null, placed: false };
      const paint = () => { if (!st.thumb) return; const g = st.g; st.thumb.style.width = g.w + 'px'; st.thumb.style.height = g.h + 'px'; st.thumb.style.transform = `translate(${g.x}px, ${g.y}px)`; };
      st.paint = paint;
      st.x = G.spring(0, 1024, 58.9, v => { st.g.x = v; paint(); });
      st.w = G.spring(0, 1024, 58.9, v => { st.g.w = v; paint(); });
      segState.set(key, st);
    }
    if (!group.classList.contains('lg-segmented')) {
      group.classList.add('lg-segmented');
      const thumb = document.createElement('span'); thumb.className = 'lg-segmented-thumb'; thumb.setAttribute('aria-hidden', 'true'); group.prepend(thumb);
      st.thumb = thumb; st.group = group;
      group.addEventListener('change', () => place(key, true));
      new ResizeObserver(() => place(key, false)).observe(group);
      st.paint();
    }
    place(key, st.placed);
  }
  function place(key, animate) {
    const st = segState.get(key); if (!st?.group?.isConnected) return;
    const span = st.group.querySelector('input:checked + span'); if (!span) { st.thumb.style.opacity = '0'; return; }
    st.thumb.style.opacity = '1';
    const a = span.getBoundingClientRect(), b = st.group.getBoundingClientRect();
    st.g.y = a.top - b.top; st.g.h = a.height;
    const x = a.left - b.left, w = a.width;
    if (!animate || !st.placed) { st.x.jump(x); st.w.jump(w); st.placed = true; } else { st.x.set(x); st.w.set(w); }
  }

  /* ---------- Menus and dropdowns open from their trigger ---------- */
  document.addEventListener('beforetoggle', e => {
    const menu = e.target;
    if (!(menu instanceof HTMLElement) || !menu.hasAttribute('popover') || e.newState !== 'open') return;
    const trigger = document.querySelector(`[popovertarget="${CSS.escape(menu.id)}"]`);
    if (!trigger) return;
    requestAnimationFrame(() => {
      const t = trigger.getBoundingClientRect(), m = menu.getBoundingClientRect();
      const ox = Math.max(0, Math.min(m.width, t.left + t.width / 2 - m.left)), oy = Math.max(0, Math.min(m.height, t.top + t.height / 2 - m.top));
      menu.style.setProperty('--lg-origin', ox + 'px ' + oy + 'px');
    });
  }, true);

  window.GumGlisse = { syncSettings, decorate: () => schedule() };
  schedule();
})();
