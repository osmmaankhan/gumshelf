(function(root){
 const normalize=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 function terms(query){return (String(query||'').match(/"[^"]+"|\S+/g)||[]).map(t=>normalize(t.replace(/^"|"$/g,''))).filter(Boolean).slice(0,20);}
 function fields(p,catalog){const inferred=catalog.infer(p);return [
  ['Title',p.name,12],['Creator',p.creator,7],['Category',[p.category,catalog.byId(inferred.type).label,...inferred.software].join(' '),4],['Format',p.format,3],
  ['AI summary',p.summary,5],['Suggested uses',Array.isArray(p.uses)?p.uses.join(' · '):'',4],
  [p.descriptionSource==='demo'?'Demo description':'Storefront description',['public-product','demo'].includes(p.descriptionSource)?p.description:'',3],['Your notes',p.notes,4],['Local suggestion',p.suggestedUse,1]
 ].map(([label,text,weight])=>({label,text:String(text||''),normalized:normalize(text),weight}));}
 function match(p,query,catalog){const tokens=terms(query);if(!tokens.length)return {matches:true,score:0,labels:[],excerpt:''};const entries=fields(p,catalog);if(!tokens.every(t=>entries.some(f=>f.normalized.includes(t))))return {matches:false,score:0,labels:[],excerpt:''};const hits=entries.filter(f=>tokens.some(t=>f.normalized.includes(t)));let score=hits.reduce((sum,f)=>sum+f.weight*tokens.filter(t=>f.normalized.includes(t)).length,0);if(entries[0].normalized===normalize(query))score+=40;
  const body=hits.find(f=>!['Title','Creator','Category','Format'].includes(f.label));const text=body?.text.replace(/\s+/g,' ').trim()||'';const position=Math.max(0,text.toLowerCase().indexOf(tokens[0]));const start=Math.max(0,position-45);const excerpt=(start?'…':'')+text.slice(start,start+160)+(text.length>start+160?'…':'');
  return {matches:true,score,labels:hits.map(f=>f.label),excerpt,excerptLabel:body?.label||''};
 }
 const api={normalize,terms,match};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GumSearch=api;
})(globalThis);
