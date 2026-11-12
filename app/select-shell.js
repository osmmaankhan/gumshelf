/* Presentation wrapper only. The actual select, ID, options and events stay intact. */
(function(){
 const root=document.querySelector('#app'),modal=document.querySelector('#modal');if(!root)return;
 function update(){for(const select of [...root.querySelectorAll('select'),...(modal?.querySelectorAll('select')||[])]){
  if(select.hidden||select.parentElement?.classList.contains('select-shell'))continue;
  const focused=document.activeElement===select;
  const shell=document.createElement('span');shell.className='select-shell';
  select.before(shell);shell.append(select);
  if(focused)select.focus({preventScroll:true});
 }}
 new MutationObserver(update).observe(root,{childList:true,subtree:true});if(modal)new MutationObserver(update).observe(modal,{childList:true,subtree:true});update();
})();

