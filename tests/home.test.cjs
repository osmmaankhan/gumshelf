const test=require('node:test'),assert=require('node:assert/strict');const Home=require('../app/home.js'),Catalog=require('../app/catalog.js');
test('Home ideas rotate through owned resources and exclude hidden/archived items',()=>{
 const products=[{id:'a',name:'Phone Mockup',saved:true},{id:'b',name:'Font Pack'},{id:'c',name:'Secret Mockup',hidden:true},{id:'d',name:'Old font',archived:true}];const before=JSON.stringify(products);
 const first=Home.suggestions(products,Catalog,0),second=Home.suggestions(products,Catalog,1);
 assert.equal(first.type,'mockups');assert.equal(second.type,'fonts');assert.deepEqual(first.products.map(p=>p.id),['a']);assert.deepEqual(second.products.map(p=>p.id),['b']);assert.equal(first.visibleCount,2);assert.equal(first.savedCount,1);assert.equal(JSON.stringify(products),before);
 assert.equal(Home.suggestions([],Catalog,0).products.length,0);assert.equal(Home.suggestions([{id:'a',name:'Something'}],Catalog,0).type,'');
});
