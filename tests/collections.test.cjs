const test=require('node:test'),assert=require('node:assert/strict');
const {changeCollection,removeMembership}=require('../lib/collections.cjs');
test('collections persist without changing reviews and can hold the same bookmarked product',()=>{
 let state={products:[{id:'a',name:'Pack',summary:'Reviewed summary',notes:'Private note',images:['cached'],saved:false},{id:'b',saved:true}],collections:[]};
 changeCollection(state,{action:'create',name:' Project one '});changeCollection(state,{action:'create',name:'For later'});
 const ids=state.collections.map(c=>c.id);changeCollection(state,{action:'assign',productId:'a',collectionIds:ids});
 state=JSON.parse(JSON.stringify(state));assert.equal(state.products[0].saved,true);assert.ok(state.collections.every(c=>c.productIds.includes('a')));
 assert.equal(state.products[0].summary,'Reviewed summary');assert.equal(state.products[0].notes,'Private note');assert.deepEqual(state.products[0].images,['cached']);
 changeCollection(state,{action:'rename',id:ids[0],name:'A new name'});assert.equal(state.collections[0].name,'A new name');
 changeCollection(state,{action:'delete',id:ids[0]});assert.equal(state.products[0].saved,true);assert.deepEqual(state.collections[0].productIds,['a']);
 changeCollection(state,{action:'assign',productId:'a',collectionIds:[]});assert.equal(state.products[0].saved,true);assert.deepEqual(state.collections[0].productIds,[]);
 changeCollection(state,{action:'assign',productId:'a',collectionIds:[ids[1]]});removeMembership(state,'a');assert.deepEqual(state.collections[0].productIds,[]);
});
test('invalid, duplicate and hidden assignments cannot mutate collections',()=>{
 const state={products:[{id:'secret',hidden:true},{id:'a'}]};changeCollection(state,{action:'create',name:'Project'});const before=JSON.stringify(state),id=state.collections[0].id;
 for(const request of [{action:'create',id,name:'project'},{action:'create',name:' '},{action:'rename',id:'missing',name:'Name'},{action:'assign',productId:'secret',collectionIds:[id]},{action:'assign',productId:'a',collectionIds:['missing']},{action:'delete',id:'missing'},{action:'create',name:'x'.repeat(61)}])assert.throws(()=>changeCollection(state,request));
 assert.equal(JSON.stringify(state),before);
});
