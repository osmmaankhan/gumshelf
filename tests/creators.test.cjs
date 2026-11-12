const test=require('node:test'),assert=require('node:assert/strict');const Creators=require('../app/creators.js'),Catalog=require('../app/catalog.js');const {ConnectedScanner}=require('../lib/connected-scanner.cjs');
const image='gumasset://image/'+'a'.repeat(64);
test('creator profiles group identity, preserve data and exclude hidden creators and portraits',()=>{
 const products=[{id:'a',creator:'Same Name',creatorUrl:'https://one.gumroad.com/',name:'Phone Mockup',saved:true},{id:'b',creator:'Same Name',creatorUrl:'https://two.gumroad.com',name:'Font',archived:true},{id:'c',creator:'New display name',creatorUrl:'https://one.gumroad.com',name:'Brush Pack',creatorAvatar:image,creatorAvatarProfile:'https://one.gumroad.com/'},{id:'secret',creator:'Secret',name:'Secret',creatorUrl:'https://private.gumroad.com',hidden:true,creatorAvatar:image,creatorAvatarProfile:'https://private.gumroad.com'}];
 const before=JSON.stringify(products),groups=Creators.groups(products,Catalog);assert.equal(groups.length,2);assert.equal(groups[0].products.length,2);assert.equal(groups[0].saved,1);assert.equal(groups[0].avatar,image);assert.equal(groups[1].archived,1);assert.equal(groups[1].avatar,'');assert.equal(JSON.stringify(products),before);
 assert.equal(Creators.avatar({...products[0],creatorAvatar:image,creatorAvatarProfile:'https://other.gumroad.com'}),'');
});
test('creator profile validation rejects executable, unrelated and private-purchase URLs',()=>{
 for(const url of ['javascript:alert(1)','https://gumroad.com/d/private','https://maker.gumroad.com/l/product','https://gumroad.com/library','https://evil.test','https://user:pass@maker.gumroad.com'])assert.equal(Creators.profile(url),'');
 assert.equal(Creators.profile('https://Maker.gumroad.com/?sort=new'),'https://maker.gumroad.com');assert.equal(Creators.profile('https://gumroad.com/maker/'),'https://gumroad.com/maker');
});
test('creator avatar is cached only from a matching verified storefront seller; old helpers remain compatible',async()=>{
 const state={products:[],scan:{},settings:{}};const calls=[];let result={publicUrl:'https://maker.gumroad.com/l/pack',description:'Description',images:[],source:'public-product',extractionVersion:2,creatorProfileUrl:'https://maker.gumroad.com',creatorAvatarUrl:'https://public-files.gumroad.com/portrait.jpg'};
 const scanner=new ConnectedScanner({dir:'.',getState:()=>state,save(){},emit(){},notify(){}},{run:async()=>result,info:{slots:2}});scanner.cacheImage=async url=>{calls.push(url);return url?image:'';};const p={id:'a',name:'Pack',creatorUrl:'https://maker.gumroad.com',publicUrl:'https://maker.gumroad.com/l/pack',thumbnail:image};
 assert.equal((await scanner.details(null,p)).creatorAvatar,image);assert.deepEqual(calls,['https://public-files.gumroad.com/portrait.jpg']);
 result.creatorProfileUrl='https://different.gumroad.com';calls.length=0;assert.equal((await scanner.details(null,p)).creatorAvatar,undefined);assert.equal(calls.length,0);
 delete result.creatorProfileUrl;delete result.creatorAvatarUrl;assert.equal((await scanner.details(null,p)).description,'Description');
 result.source='unavailable';result.creatorProfileUrl=p.creatorUrl;result.creatorAvatarUrl='https://public-files.gumroad.com/portrait.jpg';assert.equal((await scanner.details(null,p)).creatorAvatar,undefined);
});
