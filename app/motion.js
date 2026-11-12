/* Visual continuity only. App actions and state still commit in app.js.
 * The sidebar selection is a Glisse tab-bar lens (glisse/glisse.js): it slides
 * between items on a spring, lifts and bends the backdrop while pressed, and can
 * be dragged to another item. Springs from Glisse segments.tsx:
 *   slide at rest [1024, 58.9], while dragging [2500, 94], lift [676, 47.8]. */
(function(){
 const G=window.Glisse;
 const REST=[1024,58.9],DRAG=[2500,94],LIFT=[676,47.8],GROW_X=12,GROW_Y=8;
 let rail=null,puck=null,current=null,resize=null,drag=null,glass=null,held=null;
 const geom={x:0,y:0,w:0,h:0,lift:0};let springs=null;
 const reduced=()=>G?G.reduced():document.body.dataset.motion!=='full';
 function geometry(button){const a=button.getBoundingClientRect(),b=rail.getBoundingClientRect();return {x:a.x-b.x+rail.scrollLeft-rail.clientLeft,y:a.y-b.y+rail.scrollTop-rail.clientTop,w:a.width,h:a.height};}
 function paint(){
  if(!puck)return;const {x,y,w,h,lift}=geom;
  const sx=w?1+GROW_X*lift/w:1,sy=h?1+GROW_Y*lift/h:1;
  puck.style.width=w+'px';puck.style.height=h+'px';
  puck.style.transform=`translate(${x}px,${y}px) scale(${sx},${sy})`;
  puck.style.setProperty('--lg-lift',lift.toFixed(3));
  puck.toggleAttribute('data-lifted',lift>0.02);
  glass?.lens?.update(lift);
 }
 function makeSprings(){
  if(!G){springs=null;return;}
  const mk=(key,[k,c])=>G.spring(geom[key],k,c,v=>{geom[key]=v;paint();});
  springs={x:mk('x',REST),y:mk('y',REST),w:mk('w',REST),h:mk('h',REST),lift:mk('lift',LIFT)};
 }
 function tune([k,c]){if(springs)for(const key of ['x','y','w','h'])springs[key].tune(k,c);}
 function moveTo(to,animate){
  if(!springs||!animate||reduced()){Object.assign(geom,{x:to.x,y:to.y,w:to.w,h:to.h});if(springs)for(const key of ['x','y','w','h'])springs[key].jump(to[key]);paint();return;}
  for(const key of ['x','y','w','h'])springs[key].set(to[key]);
 }
 function place(animate){
  if(!rail?.isConnected)return;const selected=rail.querySelector('.nav.active');if(!selected)return;
  tune(REST);moveTo(geometry(selected),animate);current=selected.dataset.view;
 }
 function ensure(host){
  if(rail===host)return;finish();resize?.disconnect();rail=host;
  puck=document.createElement('div');puck.className='navigation-selection';puck.setAttribute('aria-hidden','true');rail.insertBefore(puck,rail.querySelector('.brand'));
  makeSprings();glass=G?G.glass(puck,{bend:true,surface:false}):null;
  resize=new ResizeObserver(()=>place(false));resize.observe(rail);place(false);
 }
 function setLift(on){if(!springs)return;springs.lift.set(on&&!reduced()?1:0);}
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
   place(true);
  }
 }
 // Any press on a nav item lifts the lens; on the selected item it can also be dragged.
 document.addEventListener('pointerdown',event => {
  if (event.button !== 0 || !event.isPrimary || !rail?.contains(event.target)) return;
  const nav=event.target.closest('.rail-nav .nav');if(!nav)return;
  held=event.pointerId;setLift(true);
  if (drag || !nav.classList.contains('active')) return;
  drag = {id:event.pointerId,clientY:event.clientY,scrollTop:rail.scrollTop,moved:false};
 });
 window.addEventListener('pointermove',event => {
  if (!drag || event.pointerId !== drag.id) return;
  const offset = event.clientY - drag.clientY;
  if (!drag.moved) {
   if (Math.abs(offset) < 6) return;
   drag.moved = true;
   drag.from = {...geom};
   rail.setPointerCapture(event.pointerId);
   puck.dataset.navDragging = '';
   tune(DRAG);
  }
  const buttons = rail.querySelectorAll('.rail-nav .nav');
  const first = geometry(buttons[0]);
  const last = geometry(buttons[buttons.length - 1]);
  const y = Math.min(last.y,Math.max(first.y,drag.from.y + offset + rail.scrollTop - drag.scrollTop));
  if(springs&&!reduced())springs.y.set(y);else{geom.y=y;paint();}
 });
 const release=event=>{if(event&&held!==null&&event.pointerId!==held)return;held=null;setLift(false);};
 window.addEventListener('pointerup',event => {release(event);finish(event,true);});
 for (const name of ['pointercancel','lostpointercapture']) {
  window.addEventListener(name,event => {release(event);finish(event);});
 }
 window.addEventListener('blur',() => {release();finish();});
 document.addEventListener('keydown',event => { if (event.key === 'Escape') finish(); });
 window.GumMotion={
  capture(){const host=document.querySelector('.rail');if(!host)return null;ensure(host);return {host,focused:host.contains(document.activeElement)?document.activeElement:null,current,from:{...geom}};},
  restore(saved,animate){const fresh=document.querySelector('.rail');if(!fresh)return;if(!saved){ensure(fresh);return;}
   const scope=b=>b.closest('.rail-nav')?'main':b.closest('.rail-bottom')?'bottom':'brand';
   const host=saved.host;for(const button of host.querySelectorAll('[data-view]')){const peer=[...fresh.querySelectorAll('[data-view]')].find(p=>p.dataset.view===button.dataset.view&&scope(p)===scope(button));if(!peer)continue;button.className=peer.className;if(peer.hasAttribute('aria-current'))button.setAttribute('aria-current',peer.getAttribute('aria-current'));else button.removeAttribute('aria-current');}
   fresh.replaceWith(host);ensure(host);const selected=host.querySelector('.nav.active');
   if (!drag?.moved) place(animate&&selected?.dataset.view!==saved.current);saved.focused?.focus({preventScroll:true});
  }
 };
 new MutationObserver(()=>{if(reduced()){setLift(false);place(false);}}).observe(document.body,{attributes:true,attributeFilter:['data-motion']});
})();
