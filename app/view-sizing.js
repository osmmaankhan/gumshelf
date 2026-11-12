/* Per-view Ctrl+wheel density. Categories/Creators delegate to their existing size slider. */
(function(){
 const sizes={min:150,max:250,step:20,base:190},values=new Map();let pending;const root=document.querySelector('#app');if(!root)return;
 const route=()=>document.querySelector('.rail .nav.active')?.dataset.view||'home';
 function paint(){const panel=document.querySelector('.main-panel');if(panel){const v=route();panel.style.zoom=['categories','creators'].includes(v)?'':String((values.get(v)||sizes.base)/sizes.base);}}
 function adjust(direction,reset=false){const v=route(),slider=document.getElementById('category-size');if(['categories','creators'].includes(v)&&slider){slider.value=reset?sizes.base:Math.max(Number(slider.min),Math.min(Number(slider.max),Number(slider.value)+direction*Number(slider.step)));window.GumRange?.paint(slider);const value=Number(slider.value);document.documentElement.style.setProperty('--category-card-min',value+'px');clearTimeout(pending);pending=setTimeout(()=>window.GumUpdateAppearance?.({categorySize:value}).catch(e=>window.toast?.(e.message)),parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--glass-resize-debounce')));return;}
  const next=reset?sizes.base:Math.max(sizes.min,Math.min(sizes.max,(values.get(v)||sizes.base)+direction*sizes.step));values.set(v,next);paint();window.toast?.('View size '+Math.round(next/sizes.base*100)+'% · Ctrl+0 resets');}
 document.addEventListener('wheel',e=>{if(!e.ctrlKey||e.deltaY===0||document.querySelector('#modal')?.open)return;e.preventDefault();adjust(e.deltaY<0?1:-1);},{passive:false});
 document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key==='0'&&!document.querySelector('#modal')?.open){e.preventDefault();adjust(0,true);}});
 new MutationObserver(paint).observe(root,{childList:true,subtree:true});window.GumViewSizing={paint,adjust};
})();
