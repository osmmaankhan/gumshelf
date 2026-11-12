(function(){
 const app=document.querySelector('#app'),modal=document.querySelector('#modal');if(!app)return;
 function paint(input){const min=Number(input.min)||0,max=Number(input.max)||100,value=Number(input.value),percent=Math.max(0,Math.min(100,(value-min)/(max-min)*100));input.style.setProperty('--range-percent',percent+'%');}
 function update(){for(const input of [...app.querySelectorAll('input[type=range]'),...(modal?.querySelectorAll('input[type=range]')||[])])paint(input);}
 document.addEventListener('input',e=>{if(e.target.matches('input[type=range]'))paint(e.target);});
 new MutationObserver(update).observe(app,{childList:true,subtree:true});if(modal)new MutationObserver(update).observe(modal,{childList:true,subtree:true});window.GumRange={paint};update();
})();
