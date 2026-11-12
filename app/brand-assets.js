/* Local, optional artwork overrides. No preferences, bridge or product data access. */
(function(){
 const root=document.querySelector('#app');if(!root)return;const seen=new WeakSet();
 const names={'brand.png':'app-icon.png','brand-color.png':'logo-color.png','brand-dark.png':'logo-dark.png','brand-light.png':'logo-light.png'};
 function update(){for(const image of root.querySelectorAll('.brand img,.ecosystem-core img')){
  if(seen.has(image))continue;seen.add(image);const original=image.getAttribute('src'),name=names[original];if(!name)continue;
  image.addEventListener('error',()=>{image.src=original;},{once:true});
  image.src=new URL('../../branding/'+name,location.href).href;
 }}
 new MutationObserver(update).observe(root,{childList:true,subtree:true});update();
})();
