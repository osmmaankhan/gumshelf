(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./search.js'):root.GumSearch,typeof module==='object'&&module.exports?require('./catalog.js'):root.GumCatalog);if(typeof module==='object'&&module.exports)module.exports=api;else root.GumIntent=api;})(globalThis,function(search,catalog){
 const entries=[['brand branding logo identity streetwear apparel merch clothing',['branding','mockups','fonts','graphics'],['Illustrator']],['packaging package label box bottle product',['mockups','textures'],[]],['poster flyer print brochure editorial magazine',['fonts','textures','mockups'],[]],['youtube thumbnail video reel film cinematic',['graphics','effects','audio','motion'],['Premiere Pro','After Effects']],['3d blender render rendering model scene hdri',['models','materials','scenes','textures'],['Blender']],['ui app website web figma interface ux',['ui','graphics','fonts'],['Figma']],['game gaming pixel sprite character',['graphics','models','characters','textures'],['Unity']],['photo photography lightroom preset color',['effects','textures'],['Lightroom']],['illustration illustrate procreate brush drawing sketch paint',['brushes','textures','graphics'],['Procreate']],['social instagram template post story content',['templates','mockups','graphics'],['Canva']]];
 const stem=w=>w.length>4?w.replace(/ing$/,'').replace(/ies$/,'y').replace(/(ch|sh|x|z)es$/,'$1').replace(/s$/,''):w;
 function plan(text,products,catalog){const words=search.normalize(text).split(' ').filter(Boolean),visible=products.filter(p=>!p.hidden);if(!words.length)return {types:[],software:[],groups:[],unmatchedWords:[]};const matched=new Set(),ids=new Map(),software=new Set();for(const [keys,types,apps] of entries){const terms=keys.split(' ').map(stem),hits=words.filter(w=>terms.includes(stem(w)));if(!hits.length)continue;hits.forEach(w=>matched.add(w));types.forEach(id=>{if(catalog.types.some(t=>t.id===id)&&!ids.has(id))ids.set(id,hits[0]);});apps.forEach(s=>software.add(s));}const types=[...ids].map(([id,why])=>({id,label:catalog.byId(id).label,count:visible.filter(p=>catalog.infer(p).type===id).length,why}));const groups=types.filter(t=>t.count).map(t=>({type:t,products:visible.filter(p=>catalog.infer(p).type===t.id).map(p=>({p,score:words.reduce((n,w)=>n+search.match(p,w,catalog).score,0)})).sort((a,b)=>b.score-a.score||String(a.p.name).localeCompare(String(b.p.name))).slice(0,8).map(x=>x.p)}));return {types,software:[...software],groups,unmatchedWords:words.filter(w=>!matched.has(w))};}
 function homeTries(products){
  const counts=new Map();for(const p of products.filter(p=>!p.hidden&&!p.archived)){const type=catalog.infer(p).type;counts.set(type,(counts.get(type)||0)+1);}
  const tasks={mockups:['Mockups for a product launch','plan'],fonts:['Fonts for a brand identity','plan'],textures:['Textures with grain','find'],brushes:['Brushes for an illustration','plan'],models:['Models for a 3D scene','plan'],graphics:['Graphics for a social campaign','plan'],templates:['Templates for social posts','plan'],branding:['Branding for a new identity','plan']};
  const tries=[...counts].filter(([id])=>id!=='uncategorized').sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,3).map(([id])=>{const [text,mode]=tasks[id]||[catalog.byId(id).label,'find'];return {text,mode};});
  for(const [text,mode] of [['Plan a brand identity','plan'],['Find a resource','find'],['Plan a product launch','plan']]){if(tries.length===3)break;tries.push({text,mode});}
  return tries;
 }
 function rediscoverPicks(products,seed=0,recentIds=[]){
  const recent=new Set(recentIds),titles=new Set();
  // Deduplicate in library order so the first title variant always wins.
  const eligible=products.filter(p=>{
   if(p.hidden||p.archived||recent.has(p.id))return false;
   const words=search.normalize(p.name).split(' ').filter(Boolean),prefix=words.slice(0,3).join(' ');
   if(prefix&&titles.has(prefix))return false;
   if(prefix)titles.add(prefix);
   return true;
  });
  const artwork=p=>/^gumasset:\/\/image\/[a-f0-9]{64}$/.test(p.thumbnail||'');
  const groups=new Map(),offset=Number.isFinite(seed)?Math.abs(Math.trunc(seed)):0;
  for(const p of eligible){const type=catalog.infer(p).type;if(!groups.has(type))groups.set(type,[]);groups.get(type).push(p);}
  const groupEntries=[...groups],start=groupEntries.length?offset%groupEntries.length:0;
  const queues=[...groupEntries.slice(start),...groupEntries.slice(0,start)].map(([type,items])=>{
   const rotate=pool=>pool.length?[...pool.slice(offset%pool.length),...pool.slice(0,offset%pool.length)]:[];
   return {type,items:[...rotate(items.filter(artwork)),...rotate(items.filter(p=>!artwork(p)))]};
  });
  const picks=[],creators=new Set();
  // Each pass takes one candidate per type, with artwork first within that pass.
  for(let round=0;round<2&&picks.length<8;round++){
   const candidates=queues.map(queue=>({queue,product:queue.items.find(p=>!creators.has(search.normalize(p.creator||'')||'unknown'))})).filter(row=>row.product).sort((a,b)=>Number(artwork(b.product))-Number(artwork(a.product)));
   for(const {queue} of candidates){
    if(picks.length===8)break;
    const product=queue.items.find(p=>!creators.has(search.normalize(p.creator||'')||'unknown'));
    if(!product)continue;
    picks.push(product);creators.add(search.normalize(product.creator||'')||'unknown');
   }
  }
  return picks;
 }
 return {plan,homeTries,rediscoverPicks};
});
