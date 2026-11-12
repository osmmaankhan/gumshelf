const {randomUUID}=require('node:crypto');

function nameOf(value){
 if(typeof value!=='string')throw Error('Enter a collection name.');
 const name=value.trim();
 if(!name||name.length>60||/[\u0000-\u001f]/.test(name))throw Error('Use a collection name between 1 and 60 characters.');
 return name;
}
function changeCollection(state,request){
 if(!request||typeof request!=='object')throw Error('Invalid collection request.');
 const collections=Array.isArray(state.collections)?state.collections:[];
 const collection=collections.find(c=>c.id===request.id);
 if(request.action==='create'||request.action==='rename'){
  const name=nameOf(request.name);
  if(collections.some(c=>(request.action==='create'||c.id!==request.id)&&c.name.toLowerCase()===name.toLowerCase()))throw Error('A collection with that name already exists.');
  if(request.action==='rename'&&!collection)throw Error('Collection not found.');
  if(request.action==='create'){
   if(collections.length>=100)throw Error('You can keep up to 100 collections.');
   state.collections=[...collections,{id:randomUUID(),name,productIds:[]}];
  }else collection.name=name;
 }else if(request.action==='delete'){
  if(!collection)throw Error('Collection not found.');
  state.collections=collections.filter(c=>c!==collection);
 }else if(request.action==='assign'){
  const p=state.products.find(p=>p.id===request.productId);
  if(!p||p.hidden)throw Error('Choose a visible product to organize.');
  if(!Array.isArray(request.collectionIds)||request.collectionIds.length>100||request.collectionIds.some(id=>!collections.some(c=>c.id===id)))throw Error('Choose existing collections.');
  const chosen=new Set(request.collectionIds);
  // Validate first, then update membership and bookmark together.
  for(const c of collections)c.productIds=chosen.has(c.id)?[...new Set([...c.productIds,p.id])]:c.productIds.filter(id=>id!==p.id);
  p.saved=true;
 }else throw Error('Unknown collection action.');
 return state;
}
function removeMembership(state,productId){
 for(const c of state.collections||[])c.productIds=c.productIds.filter(id=>id!==productId);
}
module.exports={changeCollection,removeMembership};
