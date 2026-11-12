/* Native popovers retain light dismissal and keyboard access. Placement stays inside the viewport. */
function positionProductMenu(menu) {
 const trigger = [...document.querySelectorAll('.product-menu-trigger')].find(button => button.getAttribute('popovertarget') === menu.id);
 if (!trigger) return;
 const gap = 8, anchor = trigger.getBoundingClientRect();
 menu.style.position = 'fixed';
 menu.style.positionAnchor = 'auto';
 menu.style.positionArea = 'none';
 menu.style.positionTryFallbacks = 'none';
 menu.style.inset = 'auto';
 menu.style.margin = '0';
 menu.style.maxHeight = Math.max(0, window.innerHeight - gap * 2) + 'px';
 const size = menu.getBoundingClientRect();
 const below = anchor.bottom + gap;
 const top = below + size.height <= window.innerHeight - gap ? below : anchor.top - size.height - gap;
 menu.style.top = Math.max(gap, Math.min(top, window.innerHeight - size.height - gap)) + 'px';
 menu.style.left = Math.max(gap, Math.min(anchor.right - size.width, window.innerWidth - size.width - gap)) + 'px';
}
document.addEventListener('click', event => {
 const trigger = event.target.closest('.product-menu-trigger');
 if (trigger) {
  const menu = document.getElementById(trigger.getAttribute('popovertarget'));
  menu?.toggleAttribute('data-pointer-menu', event.detail > 0);
 }
 const item = event.target.closest('.product-actions-menu [data-action]');
 if (item && !item.disabled) item.closest('[popover]').hidePopover();
}, true);
document.addEventListener('toggle', event => {
 if (event.newState === 'open' && event.target.matches('.product-actions-menu')) positionProductMenu(event.target);
}, true);
document.addEventListener('scroll', () => {
 document.querySelectorAll('.product-actions-menu:popover-open').forEach(positionProductMenu);
}, true);
window.addEventListener('resize', () => {
 document.querySelectorAll('.product-actions-menu:popover-open').forEach(positionProductMenu);
});
document.addEventListener('keydown', event => {
 if (event.key === 'Escape') document.querySelector('.product-actions-menu:popover-open')?.removeAttribute('data-pointer-menu');
}, true);
