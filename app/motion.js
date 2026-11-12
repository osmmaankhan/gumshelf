/* Visual continuity only. App actions and state still commit in app.js. */
(function(){
 let rail=null,puck=null,current=null,animation=null,resize=null,drag=null;
 const reduced=()=>document.body.dataset.motion==='reduced'||matchMedia('(prefers-reduced-motion: reduce)').matches;
 function geometry(button){const a=button.getBoundingClientRect(),b=rail.getBoundingClientRect();return {x:a.x-b.x+rail.scrollLeft-rail.clientLeft,y:a.y-b.y+rail.scrollTop-rail.clientTop,w:a.width,h:a.height};}
 function place(animate,from){
  if(!rail?.isConnected)return;const selected=rail.querySelector('.nav.active');if(!selected)return;
  const to=geometry(selected),transform=p=>`translate(${p.x}px,${p.y}px)`;
  animation?.cancel();animation=null;
  Object.assign(puck.style,{width:to.w+'px',height:to.h+'px',transform:transform(to)});
  if(animate&&!reduced()&&from&&typeof puck.animate==='function'){
   const css=getComputedStyle(document.body);animation=puck.animate([{transform:transform(from)},{transform:transform(to)}],{duration:parseFloat(css.getPropertyValue('--motion-morph')),easing:css.getPropertyValue('--motion-ease-move').trim()});
  }
  current=selected.dataset.view;
 }
 function ensure(host){
  if(rail===host)return;finish();resize?.disconnect();animation?.cancel();rail=host;
  puck=document.createElement('div');puck.className='navigation-selection';puck.setAttribute('aria-hidden','true');rail.insertBefore(puck,rail.querySelector('.brand'));
  resize=new ResizeObserver(()=>place(false));resize.observe(rail);place(false);
 }
 function position() {
  const selection = puck.getBoundingClientRect();
  const bounds = rail.getBoundingClientRect();
  return {x:selection.x-bounds.x+rail.scrollLeft-rail.clientLeft,
   y:selection.y-bounds.y+rail.scrollTop-rail.clientTop,
   w:selection.width,h:selection.height};
 }
 function finish(event, commit = false) {
  if (!drag || (event && event.pointerId !== drag.id)) return;
  const gesture = drag;
  drag = null;
  if (!gesture.moved) return;
  delete puck.dataset.navDragging;
  if (rail.hasPointerCapture(gesture.id)) rail.releasePointerCapture(gesture.id);
  const hit = commit && document.elementFromPoint(event.clientX,event.clientY)?.closest('.rail-nav .nav');
  if (hit && rail.contains(hit) && !hit.classList.contains('active')) {
   hit.focus({preventScroll:true});
   hit.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1}));
  } else {
   place(true,position());
  }
 }
 document.addEventListener('pointerdown',event => {
  if (drag || event.button !== 0 || !event.isPrimary || !rail?.contains(event.target)) return;
  if (!event.target.closest('.rail-nav .nav.active')) return;
  drag = {id:event.pointerId,clientY:event.clientY,scrollTop:rail.scrollTop,moved:false};
 });
 window.addEventListener('pointermove',event => {
  if (!drag || event.pointerId !== drag.id) return;
  const offset = event.clientY - drag.clientY;
  if (!drag.moved) {
   if (Math.abs(offset) < 5) return;
   drag.moved = true;
   drag.from = position();
   animation?.cancel();
   animation = null;
   rail.setPointerCapture(event.pointerId);
   puck.dataset.navDragging = '';
  }
  const buttons = rail.querySelectorAll('.rail-nav .nav');
  const first = geometry(buttons[0]);
  const last = geometry(buttons[buttons.length - 1]);
  const y = Math.min(last.y,Math.max(first.y,drag.from.y + offset + rail.scrollTop - drag.scrollTop));
  puck.style.transform = 'translate(' + drag.from.x + 'px,' + y + 'px)';
 });
 window.addEventListener('pointerup',event => finish(event,true));
 for (const name of ['pointercancel','lostpointercapture']) {
  window.addEventListener(name,event => finish(event));
 }
 window.addEventListener('blur',() => finish());
 document.addEventListener('keydown',event => { if (event.key === 'Escape') finish(); });
 window.GumMotion={
  capture(){const host=document.querySelector('.rail');if(!host)return null;ensure(host);const p=puck.getBoundingClientRect(),r=host.getBoundingClientRect();return {host,focused:host.contains(document.activeElement)?document.activeElement:null,current,from:{x:p.x-r.x+host.scrollLeft-host.clientLeft,y:p.y-r.y+host.scrollTop-host.clientTop,w:p.width,h:p.height}};},
  restore(saved,animate){const fresh=document.querySelector('.rail');if(!fresh)return;if(!saved){ensure(fresh);return;}
   const scope=b=>b.closest('.rail-nav')?'main':b.closest('.rail-bottom')?'bottom':'brand';
   const host=saved.host;for(const button of host.querySelectorAll('[data-view]')){const peer=[...fresh.querySelectorAll('[data-view]')].find(p=>p.dataset.view===button.dataset.view&&scope(p)===scope(button));if(!peer)continue;button.className=peer.className;if(peer.hasAttribute('aria-current'))button.setAttribute('aria-current',peer.getAttribute('aria-current'));else button.removeAttribute('aria-current');}
   fresh.replaceWith(host);ensure(host);const selected=host.querySelector('.nav.active');
   if (!drag?.moved) place(animate&&selected?.dataset.view!==saved.current,saved.from);saved.focused?.focus({preventScroll:true});
  }
 };
 new MutationObserver(()=>{if(reduced())place(false);}).observe(document.body,{attributes:true,attributeFilter:['data-motion']});
})();
