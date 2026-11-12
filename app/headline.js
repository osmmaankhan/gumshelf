(function(root){
 const owns=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function phrases(value){if(!Array.isArray(value)||value.length>100||value.some(s=>typeof s!=='string'||s.trim().length>160||/[\u0000-\u001f]/.test(s)))throw Error('Use up to 100 phrases, each no longer than 160 characters.');return [...new Set(value.map(s=>s.trim()).filter(Boolean))];}
 const parse=text=>phrases(String(text||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean));
 function settingsPatch(value){const patch={};if(owns(value,'homePhrases'))patch.homePhrases=phrases(value.homePhrases);if(owns(value,'homePhraseSeconds')){if(!Number.isInteger(value.homePhraseSeconds)||value.homePhraseSeconds<30||value.homePhraseSeconds>600)throw Error('Choose a phrase interval between 30 and 600 seconds.');patch.homePhraseSeconds=value.homePhraseSeconds;}if(owns(value,'homeTypewriter')){if(typeof value.homeTypewriter!=='boolean')throw Error('Choose whether to use the typewriter animation.');patch.homeTypewriter=value.homeTypewriter;}return patch;}
 function create({items,index=0,intervalMs=120000,animate=true,paused=false,write,setTimer=setTimeout,clearTimer=clearTimeout}){
  const texts=items.map(s=>String(s));const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;const frames=texts.map(text=>segmenter?Array.from(segmenter.segment(text),part=>part.segment):Array.from(text));let current=texts.length?Math.abs(index)%texts.length:0,timer=null,stopped=false,halted=paused,position=0,phase='typing';
  const characters=()=>frames[current]||[];
  const emit=(text,typing=false)=>write({text,full:texts[current]||'',index:current,typing});
  function clear(){if(timer!==null){clearTimer(timer);timer=null;}}
  function later(fn,delay){timer=setTimer(()=>{timer=null;if(!stopped&&!halted)fn();},delay);}
  function tick(){if(stopped||halted)return;const chars=characters();if(phase==='typing'){position=Math.min(chars.length,position+1);emit(chars.slice(0,position).join(''),position<chars.length);if(position<chars.length)later(tick,35);else if(texts.length>1){phase='erasing';later(tick,intervalMs);}}else{position=Math.max(0,position-1);emit(chars.slice(0,position).join(''),true);if(position)later(tick,18);else{current=(current+1)%texts.length;phase='typing';later(tick,180);}}}
  function complete(){position=characters().length;emit(texts[current]||'');}
  if(texts.length){if(!animate||paused)complete();else tick();}
  return {get index(){return current;},stop(){clear();stopped=true;},pause(){clear();halted=true;complete();},resume(){if(stopped||!animate||!halted)return;halted=false;complete();if(texts.length>1){phase='erasing';later(tick,intervalMs);}},next(){clear();current=(current+1)%Math.max(texts.length,1);position=0;phase='typing';if(animate&&!halted)tick();else complete();}};
 }
 const api={phrases,parse,settingsPatch,create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GumHeadline=api;
})(globalThis);
