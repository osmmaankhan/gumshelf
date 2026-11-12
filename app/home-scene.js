/* Home scene: entrance reveal, aurora parallax and the category shapes.
 * Presentation only — the shapes are buttons with data-action="browse-type",
 * so app.js's existing click delegation opens the category. Springs come from
 * glisse.js; everything is static under reduced motion. */
(function () {
  'use strict';
  const app = document.querySelector('#app');
  const G = window.Glisse;
  if (!app || !G) return;
  const reduced = () => G.reduced();
  // Labs-style soft shapes: flower, squircle, circle, hexagon, pentagon, pill.
  const SHAPES = ['flower', 'squircle', 'circle', 'hexagon', 'pentagon', 'pill'];
  let wasOnHome = false, hero = null, aurora = null, shapes = [], pointer = null, raf = 0;

  // Pointer parallax for the aurora, eased with a spring so it never jumps.
  const mx = G.spring(0, 120, 22, v => hero?.style.setProperty('--mx', v.toFixed(3)));
  const my = G.spring(0, 120, 22, v => hero?.style.setProperty('--my', v.toFixed(3)));

  function splitTitle(title) {
    if (title.dataset.split) return;
    title.dataset.split = '1';
    const words = title.textContent.trim().split(/\s+/);
    title.setAttribute('aria-label', words.join(' '));
    title.innerHTML = words.map((w, i) => `<span class="home-word" aria-hidden="true" style="--i:${i}"><span>${w.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</span></span>`).join(' ');
  }

  function buildShapes(heroEl) {
    if (heroEl.querySelector('.home-shapes')) return;
    const tiles = [...document.querySelectorAll('.home-tile[data-type]')].slice(0, 6);
    if (!tiles.length) return;
    const row = document.createElement('div');
    row.className = 'home-shapes';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', 'Your top categories');
    tiles.forEach((tile, i) => {
      const label = tile.childNodes.length ? tile.textContent.replace(/\s+\d[\d,]*\s*$/, '').trim() : tile.dataset.type;
      const count = tile.querySelector('.count')?.textContent || '';
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'home-shape';
      b.dataset.shape = SHAPES[i % SHAPES.length];
      b.dataset.action = 'browse-type';
      b.dataset.type = tile.dataset.type;
      b.style.setProperty('--shape-color', tile.style.getPropertyValue('--type-color') || 'var(--color-accent)');
      b.style.setProperty('--i', i);
      b.setAttribute('aria-label', `Browse ${label}${count ? ` (${count})` : ''}`);
      b.innerHTML = `<span class="home-shape-body" aria-hidden="true"></span><span class="home-shape-label" aria-hidden="true">${label.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}<b>${count}</b></span>`;
      row.append(b);
    });
    heroEl.append(row);
    shapes = [...row.children].map(el => {
      const s = { el, lift: 0, tilt: 0 };
      s.liftSpring = G.spring(0, 260, 18, v => { s.lift = v; paintShape(s); });
      s.tiltSpring = G.spring(0, 220, 16, v => { s.tilt = v; paintShape(s); });
      return s;
    });
  }
  function paintShape(s) { s.el.style.setProperty('--lift', s.lift.toFixed(2) + 'px'); s.el.style.setProperty('--tilt', s.tilt.toFixed(2) + 'deg'); }

  function onMove(e) {
    if (!hero || reduced()) return;
    const r = hero.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
    pointer = { x: e.clientX, y: e.clientY };
    if (!raf) raf = requestAnimationFrame(nudgeShapes);
  }
  function nudgeShapes() {
    raf = 0;
    for (const s of shapes) {
      if (!s.el.isConnected || !pointer) continue;
      const b = s.el.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const dx = pointer.x - cx, dy = pointer.y - cy, d = Math.hypot(dx, dy), reach = 180;
      const near = Math.max(0, 1 - d / reach);
      s.liftSpring.set(-14 * near * near);
      s.tiltSpring.set(Math.max(-12, Math.min(12, -dx / 18)) * near);
    }
  }
  function onLeave() { mx.set(0); my.set(0); pointer = null; for (const s of shapes) { s.liftSpring.set(0); s.tiltSpring.set(0); } }

  function sync() {
    const next = app.querySelector('.home-v2 .home-hero');
    if (next !== hero) {
      if (hero) { hero.removeEventListener('pointermove', onMove); hero.removeEventListener('pointerleave', onLeave); }
      hero = next; shapes = [];
      if (hero) {
        hero.addEventListener('pointermove', onMove, { passive: true });
        hero.addEventListener('pointerleave', onLeave, { passive: true });
        mx.paint(); my.paint();
      }
    }
    if (!hero) { wasOnHome = false; return; }
    const title = hero.querySelector('.home-title');
    if (title) splitTitle(title);
    if (hero.closest('.home-v2')?.classList.contains('is-idle')) buildShapes(hero);
    // Entrance only when arriving on Home, never on re-renders while typing.
    if (!wasOnHome && !reduced()) {
      hero.classList.add('is-entering');
      setTimeout(() => app.querySelector('.home-hero')?.classList.remove('is-entering'), 1400);
    }
    wasOnHome = true;
  }
  let queued = false;
  new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; sync(); }); } }).observe(app, { childList: true, subtree: true });
  sync();
})();
