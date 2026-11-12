/* Presentation semantics only: name the shared native dialog from its visible heading.
   Does not manage focus, dismissal, form values or product actions. */
(function(){
 const dialog=document.querySelector('#modal');if(!dialog)return;
 function nameDialog(){
  const heading=dialog.querySelector('h2,h1,h3');
  if(heading){if(!heading.id)heading.id='gumshelf-dialog-heading';dialog.setAttribute('aria-labelledby',heading.id);dialog.removeAttribute('aria-label');}
  else{dialog.removeAttribute('aria-labelledby');dialog.setAttribute('aria-label','GumShelf dialog');}
 }
 new MutationObserver(nameDialog).observe(dialog,{childList:true,subtree:true,characterData:true});
 nameDialog();
})();
