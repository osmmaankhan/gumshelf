(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./search.js'):root.GumSearch);if(typeof module==='object'&&module.exports)module.exports=api;else root.GumSuggest=api;})(globalThis,function(search){
 function build(query,{view,products=[],creatorGroups=[],catalog,recent=[]}) {
  const q=String(query||'').trim(),visible=products.filter(p=>!p.hidden);
  if(!q)return ['categories','creators'].includes(view)?[]:recent.filter(value=>typeof value==='string'&&value.trim()).slice(0,5).map(value=>({kind:'recent',value}));
  const tokens=search.terms(q),normalized=search.normalize(q);
  const matches=visible.map(product=>({product,match:search.match(product,q,catalog)})).filter(row=>row.match.matches).sort((a,b)=>b.match.score-a.match.score||String(a.product.name).localeCompare(String(b.product.name)));
  const productsFound=['categories','creators'].includes(view)?[]:matches.slice(0,3).map(row=>({kind:'product',product:row.product}));
  const types=catalog.types.map(type=>({kind:'type',type,count:visible.filter(p=>catalog.infer(p).type===type.id).length})).filter(row=>row.count&&tokens.every(token=>search.normalize(row.type.label).includes(token))).slice(0,2);
  const visibleIds=new Set(visible.map(p=>p.id));
  const creators=view==='categories'?[]:creatorGroups.map(group=>{
   const products=group.products.filter(p=>!p.hidden&&visibleIds.has(p.id)),name=search.normalize(group.name);
   const text=search.normalize([group.name,...products.map(p=>[p.name,p.category,catalog.byId(catalog.infer(p).type).label].join(' '))].join(' '));
   return {kind:'creator',group:{...group,products},rank:name.startsWith(normalized)?0:name.includes(normalized)?1:2,text};
  }).filter(row=>row.group.products.length&&tokens.every(token=>row.text.includes(token))).sort((a,b)=>a.rank-b.rank||b.group.products.length-a.group.products.length||a.group.name.localeCompare(b.group.name)).slice(0,2);
  const options=view==='creators'?[...creators,...types]:[...productsFound,...types,...creators];
  return [...options.slice(0,6),{kind:'all',value:q,count:matches.length}];
 }
 return {build};
});
