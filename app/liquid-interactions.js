/* Glisse-inspired bounded press/tug and held-slider lift. Presentation only:
 * native pointer, range, checkbox and click events remain their owners.
 * Source study: vendor/glisse/README.md; no React/runtime dependency. */
(function(){
 const body=document.body,reduce=matchMedia('(prefers-reduced-motion: reduce)'),contrast=matchMedia('(forced-colors: active)');
 const reduced=()=>body.dataset.motion!=='full'||reduce.matches||contrast.matches;
 const num=name=>parseFloat(getComputedStyle(body).getPropertyValue(name));
 let held=null;const lens=document.createElement('div');lens.className='liquid-range-lens';lens.hidden=true;lens.setAttribute('aria-hidden','true');body.append(lens);
 const optical=()=>!reduced()&&body.dataset.material==='blur'&&body.dataset.refractionProof==='passed';
 function fitRange(){if(!held||held.el.type!=='range')return;const el=held.el,b=el.getBoundingClientRect(),thumb=parseFloat(getComputedStyle(el).getPropertyValue('--range-thumb-width')),lift=num('--space-xs'),min=Number(el.min)||0,max=Number(el.max)||100,progress=max>min?Math.max(0,Math.min(1,(Number(el.value)-min)/(max-min))):0;
  const rtl=getComputedStyle(el).direction==='rtl',share=rtl?1-progress:progress;
  const scale=el.offsetWidth?b.width/el.offsetWidth:1,knob=thumb*scale,lensWidth=(thumb+lift)*scale,lensHeight=(num('--size-icon')+lift)*scale;let visible=b.bottom>0&&b.top<innerHeight&&b.right>0&&b.left<innerWidth;
  for(let node=el.parentElement;node&&node!==body;node=node.parentElement){if(/auto|scroll|hidden|clip/.test(getComputedStyle(node).overflowY)){const clip=node.getBoundingClientRect();if(b.top<clip.top||b.bottom>clip.bottom)visible=false;}}
  const parent=el.closest('#modal')||body;if(lens.parentElement!==parent)parent.append(lens);Object.assign(lens.style,{width:lensWidth+'px',height:lensHeight+'px',left:(b.left+knob/2+(b.width-knob)*share-lensWidth/2)+'px',top:(b.top+b.height/2-lensHeight/2)+'px'});lens.hidden=!optical()||!visible;el.toggleAttribute('data-liquid-lens',!lens.hidden);document.dispatchEvent(new Event('gumshelf-appearance'));
 }
 const selector='button:not(:disabled):not(.window-controls button):not(.cover-button):not(.rail-nav .nav),input[type=range]:not(:disabled)';
 function clear(){lens.hidden=true;if(!held)return;const {el,styles}=held;held=null;delete el.dataset.liquidHeld;delete el.dataset.liquidLens;for(const key of ['scale','translate'])styles[key]?el.style[key]=styles[key]:el.style.removeProperty(key);}
 function down(e){if(reduced()||!e.isPrimary||e.button!==0)return;const el=e.target.closest?.(selector);if(!el||!el.closest('#app,#modal'))return;clear();held={el,id:e.pointerId,x:e.clientX,y:e.clientY,styles:{scale:el.style.scale,translate:el.style.translate}};el.dataset.liquidHeld='true';if(el.type!=='range')el.style.scale=String(2-num('--motion-press-scale'));else fitRange();}
 function move(e){if(!held||e.pointerId!==held.id)return;if(!held.el.isConnected||reduced())return clear();if(held.el.type==='range')return;const max=num('--space-tiny'),rubber=v=>max*v/(Math.abs(v)+max);held.el.style.translate=`${rubber(e.clientX-held.x)}px ${rubber(e.clientY-held.y)}px`;}
 document.addEventListener('pointerdown',down,{passive:true});window.addEventListener('pointermove',move,{passive:true});
 document.addEventListener('input',e=>{if(e.target===held?.el)fitRange();});document.addEventListener('scroll',fitRange,{capture:true,passive:true});window.addEventListener('resize',fitRange);
 for(const event of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(event,e=>{if(e.pointerId===held?.id)clear();},{passive:true});
 window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});document.addEventListener('keydown',e=>{if(e.key==='Escape')clear();});
 const cancel=()=>{if(reduced())clear();else fitRange();};reduce.addEventListener('change',cancel);contrast.addEventListener('change',cancel);new MutationObserver(cancel).observe(body,{attributes:true,attributeFilter:['data-motion','data-material','data-refraction-proof']});
 new MutationObserver(()=>{if(held&&!held.el.isConnected)clear();}).observe(document.querySelector('#app'),{childList:true,subtree:true});
})();
