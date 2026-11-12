(function(){
 const root=document.querySelector('#app');if(!root)return;
 function decorate(){for(const input of root.querySelectorAll('.search-wrap input.search')){const wrap=input.closest('.search-wrap');let button=wrap.querySelector('.search-clear');if(!button){button=document.createElement('button');button.type='button';button.className='search-clear';button.setAttribute('aria-label','Clear search');button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+window.GumVisuals.glyphs.close+'</svg>';wrap.append(button);button.onclick=()=>{input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById(input.id)?.focus();};}button.hidden=!input.value;}}
 root.addEventListener('input',e=>{if(e.target.matches('.search'))decorate();});new MutationObserver(decorate).observe(root,{childList:true,subtree:true});decorate();
})();
