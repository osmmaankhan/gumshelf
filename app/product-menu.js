/* The native popover supplies light dismissal, keyboard focus and top-layer placement. */
document.addEventListener('click', event => {
 const trigger = event.target.closest('.product-menu-trigger');
 if (trigger) {
  const menu = document.getElementById(trigger.getAttribute('popovertarget'));
  menu?.toggleAttribute('data-pointer-menu',event.detail > 0);
 }
 const item = event.target.closest('.product-actions-menu [data-action]');
 if (item && !item.disabled) item.closest('[popover]').hidePopover();
}, true);
document.addEventListener('keydown',event => {
 if (event.key === 'Escape') {
  document.querySelector('.product-actions-menu:popover-open')?.removeAttribute('data-pointer-menu');
 }
},true);
