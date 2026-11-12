/* Wires Glisse (glisse.js) into GumShelf's existing markup. Presentation only:
 * native clicks, inputs, checkboxes and app state stay owned by app.js. */
(function () {
  'use strict';
  const G = window.Glisse, body = document.body, app = document.querySelector('#app'), modal = document.querySelector('#modal');
  if (!G || !app) return;
  const full = () => !G.reduced();

  /* ---------- Glass controller -> Glisse settings ----------
   * Settings > Glass effects writes --glass-displacement (Bend 0–12),
   * --glass-dispersion (0–1), --glass-frost (px) and --glass-rim (0–1) on body.
   * Glisse reads --lg-glass-bend (0–1 share of the short side), --lg-glass-dispersion,
   * --lg-blur and --lg-rim-shine. Map once here so every glass surface follows. */
  let lastSettings = '';
  function syncSettings() {
    const cs = getComputedStyle(body), n = (name, d) => { const v = parseFloat(cs.getPropertyValue(name)); return Number.isFinite(v) ? v : d; };
    const dark = body.dataset.theme === 'dark';
    const bend = n('--glass-displacement', 12) / 12 * 0.45;          // 12 -> Glisse's 0.45
    const dispersion = n('--glass-dispersion', 0.5);
    const frost = n('--glass-frost', 3);
    const rim = n('--glass-rim', 0.45);
    const shine = Math.min(1, rim * (dark ? 0.3 : 0.67));             // 0.45 -> 0.3 light / 0.13 dark (Glisse defaults)
    const next = [bend, dispersion, frost, shine].map(v => +v.toFixed(3)).join('|');
    if (next === lastSettings) return;
    lastSettings = next;
    body.style.setProperty('--lg-glass-bend', bend.toFixed(3));
    body.style.setProperty('--lg-glass-dispersion', dispersion.toFixed(3));
    body.style.setProperty('--lg-blur', frost + 'px');
    body.style.setProperty('--lg-rim-shine', shine.toFixed(3));
    G.refitAll();
  }
  document.addEventListener('gumshelf-appearance', syncSettings);
  new MutationObserver(syncSettings).observe(body, { attributes: true, attributeFilter: ['style', 'data-theme', 'data-theme-variant'] });

  /* ---------- Decorate surfaces ---------- */
  const GLASS = '.btn:not(.text):not(.primary), .icon-button, .search, [popover]';
  function decorate(root) {
    for (const el of root.querySelectorAll(GLASS)) G.glass(el);
    for (const el of root.querySelectorAll('.glass-demo-lens')) G.glass(el, { bend: true });
    for (const group of root.querySelectorAll('.theme-pick')) segmented(group);
    for (const grid of root.querySelectorAll('.category-grid, .product-list, .collection')) {
      let i = 0; for (const child of grid.children) { if (i > 12) break; child.style.setProperty('--lg-i', i++); }
    }
    for (const input of root.querySelectorAll('#notifications, #home-typewriter, #home-quote-shuffle')) switchControl(input);
  }
  let queued = false;
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; decorate(app); if (modal) decorate(modal); syncSettings(); }); } };
  new MutationObserver(schedule).observe(app, { childList: true, subtree: true });
  if (modal) new MutationObserver(schedule).observe(modal, { childList: true, subtree: true });

  /* ---------- Press (Glisse Button feel) ---------- */
  const PRESS = '.btn, .icon-button, .chip, .type-chip, .home-pick, .category-card, .creator-card, .theme-pick label, .search-clear';
  document.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.button !== 0) return;
    const el = e.target.closest?.(PRESS);
    if (!el || el.matches(':disabled') || el.closest('.rail-nav')) return;
    G.press(el, e);
  }, { passive: true });

  /* ---------- Slider: lift spring [2000, 80] and eased card size [676, 47.8] ---------- */
  const lifts = new WeakMap();
  function liftFor(input) {
    let s = lifts.get(input);
    if (!s) { s = G.spring(0, 2000, 80, v => { input.style.setProperty('--lg-lift', v.toFixed(3)); input.toggleAttribute('data-lg-lifted', v > 0.01); }); lifts.set(input, s); }
    return s;
  }
  let heldRange = null;
  document.addEventListener('pointerdown', e => {
    const input = e.target.closest?.('input[type=range]');
    if (!input || input.disabled || !e.isPrimary) return;
    heldRange = { input, id: e.pointerId }; liftFor(input).set(full() ? 1 : 0);
  }, { passive: true });
  const dropRange = e => { if (!heldRange || (e && e.pointerId !== undefined && e.pointerId !== heldRange.id)) return; liftFor(heldRange.input).set(0); heldRange = null; };
  for (const t of ['pointerup', 'pointercancel']) addEventListener(t, dropRange, { passive: true });
  addEventListener('blur', () => dropRange());

  const rootStyle = document.documentElement.style;
  const cardSize = G.spring(parseFloat(rootStyle.getPropertyValue('--category-card-min')) || 190, 676, 47.8, v => rootStyle.setProperty('--category-card-live', v.toFixed(2) + 'px'));
  cardSize.jump(cardSize.value);
  document.addEventListener('input', e => { if (e.target.id === 'category-size') cardSize.set(Number(e.target.value)); }, true);
  // Ctrl+wheel and render() set --category-card-min directly; follow them with the spring.
  // Only a change of --category-card-min itself counts (the spring's own writes also touch this style).
  let lastMin = parseFloat(rootStyle.getPropertyValue('--category-card-min'));
  new MutationObserver(() => {
    const v = parseFloat(rootStyle.getPropertyValue('--category-card-min'));
    if (!Number.isFinite(v) || v === lastMin) return;
    lastMin = v; cardSize.set(v);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

  /* ---------- Switch: position/colour [1000, 80], lift [2000, 80] ---------- */
  const switches = new WeakMap();
  function switchControl(input) {
    if (switches.has(input)) { switches.get(input).sync(true); return; }
    input.setAttribute('data-lg-switch', '');
    const pos = G.spring(input.checked ? 1 : 0, 1000, 80, v => input.style.setProperty('--lg-switch', v.toFixed(3)));
    const lift = G.spring(0, 2000, 80, v => input.style.setProperty('--lg-lift', v.toFixed(3)));
    const api = { sync(instant) { pos.set(input.checked ? 1 : 0, instant); } };
    pos.jump(input.checked ? 1 : 0);
    input.addEventListener('change', () => pos.set(input.checked ? 1 : 0));
    input.addEventListener('pointerdown', () => lift.set(full() ? 1 : 0));
    for (const t of ['pointerup', 'pointercancel', 'pointerleave', 'blur']) input.addEventListener(t, () => lift.set(0));
    switches.set(input, api);
  }

  /* ---------- Segmented control: sliding thumb [1024, 58.9] ---------- */
  const segments = new WeakMap();
  function segmented(group) {
    let seg = segments.get(group);
    if (!seg) {
      group.classList.add('lg-segmented');
      const thumb = document.createElement('span'); thumb.className = 'lg-segmented-thumb'; thumb.setAttribute('aria-hidden', 'true'); group.prepend(thumb);
      const g = { x: 0, w: 0, h: 0, y: 0 };
      const paint = () => { thumb.style.width = g.w + 'px'; thumb.style.height = g.h + 'px'; thumb.style.transform = `translate(${g.x}px, ${g.y}px)`; };
      const springs = { x: G.spring(0, 1024, 58.9, v => { g.x = v; paint(); }), w: G.spring(0, 1024, 58.9, v => { g.w = v; paint(); }) };
      seg = { thumb, g, springs, placed: false };
      group.addEventListener('change', () => place(group, true));
      new ResizeObserver(() => place(group, false)).observe(group);
      segments.set(group, seg);
    }
    place(group, false);
  }
  function place(group, animate) {
    const seg = segments.get(group); if (!seg) return;
    const span = group.querySelector('input:checked + span'); if (!span) { seg.thumb.style.opacity = '0'; return; }
    seg.thumb.style.opacity = '1';
    const a = span.getBoundingClientRect(), b = group.getBoundingClientRect();
    const x = a.left - b.left, w = a.width;
    seg.g.y = a.top - b.top; seg.g.h = a.height;
    if (!animate || !seg.placed) { seg.springs.x.jump(x); seg.springs.w.jump(w); seg.placed = true; }
    else { seg.springs.x.set(x); seg.springs.w.set(w); }
  }

  /* ---------- Menu: open from the trigger ---------- */
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
