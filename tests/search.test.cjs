const test=require('node:test'),assert=require('node:assert/strict');const Search=require('../app/search.js'),Catalog=require('../app/catalog.js');
test('search matches all words across title, storefront, AI uses, notes and software',()=>{
 const p={name:'Character Toolkit',creator:'Maya Maker',category:'3D characters',description:'A Blender helper for rigging creatures.',descriptionSource:'public-product',summary:'Build reusable poses.',uses:['Animate a walk cycle'],notes:'Use on the café project',format:'ZIP'};
 for(const query of ['Blender rigging','walk cycle','reusable poses','cafe','MAYA helper','ZIP creatures'])assert.equal(Search.match(p,query,Catalog).matches,true,query);
 assert.equal(Search.match(p,'Blender missingword',Catalog).matches,false);assert.equal(Search.match(p,'"walk cycle"',Catalog).matches,true);assert.equal(Search.match(p,'"cycle walk"',Catalog).matches,false);
 assert.ok(Search.match(p,'rigging',Catalog).labels.includes('Storefront description'));assert.ok(Search.match(p,'cafe',Catalog).labels.includes('Your notes'));
});
test('unverified purchase-page text and private URL fields never become searchable',()=>{
 const p={name:'Pack',description:'private license supersecret',descriptionSource:'purchase-page',sourceUrl:'https://gumroad.com/d/secret',thumbnailUrl:'secretimage'};
 for(const q of ['supersecret','secretimage','gumroad'])assert.equal(Search.match(p,q,Catalog).matches,false);
 assert.equal(Search.match(p,'   ',Catalog).matches,true);assert.equal(Search.match({name:'Café-Brush Pack'},'cafe brush',Catalog).matches,true);
});
test('title matches outrank description-only matches and excerpts stay bounded',()=>{
 assert.ok(Search.match({name:'Rigging Toolkit'},'rigging',Catalog).score>Search.match({name:'Pack',descriptionSource:'public-product',description:'rigging'},'rigging',Catalog).score);
 const p={name:'Pack',descriptionSource:'public-product',description:'x '.repeat(300)+'rigging '+ 'y '.repeat(300)};const hit=Search.match(p,'rigging',Catalog);assert.ok(hit.excerpt.length<=162);assert.match(hit.excerpt,/rigging/);
});
