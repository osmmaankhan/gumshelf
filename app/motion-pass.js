/* App-wide motion pass (presentation only).
 * - Page transitions: the new page rises and un-blurs into place (ease-out); the
 *   sidebar lens keeps animating live. Render stays synchronous.
 * - Entrance stagger after any view change (30ms per item).
 * - Success pulses with crossfaded, blurred icons when you save or select a product.
 * - Glowing grid: a light follows the pointer across neighbouring cards' borders,
 *   with a soft spotlight inside the hovered card (adapted from the user's
 *   glowing_grid_effect.html).
 * Everything is skipped under reduced motion or forced colours. */
(function () {
  'use strict';
  const app = document.querySelector('#app');
  const body = document.body;
  if (!app) return;
  const full = () => window.Glisse ? !window.Glisse.reduced() : body.dataset.motion === 'full';

  /* ---------- View transitions + entrance stagger ---------- */
  let lastView = typeof view !== 'undefined' ? view : null;
  function markEntering() {
    const panel = document.querySelector('.main-panel');
    if (!panel) return;
    panel.classList.add('is-view-entering');
    clearTimeout(markEntering.t);
    markEntering.t = setTimeout(() => document.querySelector('.main-panel')?.classList.remove('is-view-entering'), 700);
  }
  if (typeof window.render === 'function') {
    const original = window.render;
    window.render = function (...args) {
      const next = typeof view !== 'undefined' ? view : null;
      const changed = next !== lastView;
      lastView = next;
      // Render stays synchronous (app code may query the new DOM right after); the new page animates in with CSS.
      const out = original.apply(this, args);
      if (changed && full()) markEntering();
      return out;
    };
  }

  /* ---------- Success pulses ---------- */
  const pending = new Map(); // key -> expires
  const remember = key => pending.set(key, performance.now() + 1500);
  document.addEventListener('click', e => {
    const save = e.target.closest?.('[data-action=save]');
    if (save?.dataset.id) remember('save:' + save.dataset.id);
    const more = e.target.closest?.('[data-action=hide],[data-action=unsave-product]');
    if (more?.dataset.id) remember('row:' + more.dataset.id);
  }, true);
  document.addEventListener('change', e => {
    if (e.target.matches?.('.select-row input[type=checkbox]')) pulse(e.target.closest('.select-row'));
  }, true);
  function pulse(el) {
    if (!el || !full()) return;
    el.classList.remove('lg-pulse'); void el.offsetWidth; el.classList.add('lg-pulse');
    setTimeout(() => el.classList.remove('lg-pulse'), 700);
  }
  function flushPulses() {
    const now = performance.now();
    for (const [key, until] of pending) {
      if (until < now) { pending.delete(key); continue; }
      const [kind, id] = key.split(':');
      if (kind === 'save') {
        const btn = document.querySelector(`[data-action=save][data-id="${CSS.escape(id)}"]`);
        if (btn) { pulse(btn); pending.delete(key); }
      }
    }
  }
  // Toasts confirm with a small pulse.
  const toast = document.querySelector('#toast');
  if (toast) new MutationObserver(() => { if (toast.classList.contains('show')) pulse(toast); }).observe(toast, { attributes: true, attributeFilter: ['class'], childList: true, characterData: true });

  /* ---------- Glowing grid ---------- */
  const GRID = '.product-list, .category-grid, .home-row, .home-tiles';
  const CARD = '.product, .category-card, .creator-card, .home-card, .home-tile';
  let pointer = null, raf = 0, activeGrid = null;
  function paintGlow() {
    raf = 0;
    if (!pointer || !activeGrid?.isConnected) return;
    for (const card of activeGrid.querySelectorAll(CARD)) {
      const r = card.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      card.style.setProperty('--mouse-x', (pointer.x - r.left) + 'px');
      card.style.setProperty('--mouse-y', (pointer.y - r.top) + 'px');
    }
  }
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const grid = e.target.closest?.(GRID);
    if (grid !== activeGrid) { activeGrid?.classList.remove('is-glowing'); activeGrid = grid; activeGrid?.classList.add('is-glowing'); }
    if (!grid) return;
    pointer = { x: e.clientX, y: e.clientY };
    if (!raf) raf = requestAnimationFrame(paintGlow);
  }, { passive: true });
  document.addEventListener('pointerleave', () => { activeGrid?.classList.remove('is-glowing'); activeGrid = null; }, true);

  /* The details pane is sticky inside the main panel; size it to the panel's real
   * visible height (100vh overshot it, so its bottom and the ⋯ button were out of reach). */
  let boundPanel = null, measureFrame = 0;
  function measurePanel() {
    const panel = document.querySelector('.main-panel');
    if (!panel) return;
    document.documentElement.style.setProperty('--panel-h', panel.clientHeight + 'px');
    // The pane may start below the page header; give it exactly the space left in the panel.
    const pane = panel.querySelector(':is(.discovery-layout, .home-v2) .detail, .detail');
    if (pane) { const room = panel.getBoundingClientRect().bottom - pane.getBoundingClientRect().top - 16; pane.style.setProperty('--detail-max', Math.max(240, Math.round(room)) + 'px'); }
    if (panel !== boundPanel) { boundPanel = panel; panel.addEventListener('scroll', () => { if (!measureFrame) measureFrame = requestAnimationFrame(() => { measureFrame = 0; measurePanel(); }); }, { passive: true }); }
  }
  addEventListener('resize', measurePanel);

  /* After every render: pulses for actions that just re-rendered their button. */
  let queued = false;
  new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; flushPulses(); measurePanel(); }); } }).observe(app, { childList: true, subtree: true });
})();
