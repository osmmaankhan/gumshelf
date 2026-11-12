const test=require('node:test'),assert=require('node:assert/strict');const C=require('../app/catalog.js');
test('resource types prioritize product identity over incidental file words and preserve input data',()=>{for(const [name,expected] of [['Subject 7 | VRChat Avatar — FBX + Textures Only','characters'],['Free Brand Guideline Template','branding'],['Typography Masterclass Course','courses'],['MP4 Downloader Windows App','apps'],['Blender Kitchen Full Project','scenes'],['After Effects Product Promo Project','ae-projects'],['Dockit | After Effects Plugin','plugins'],['Presetify – Text Animation Script for After Effects','scripts'],['True Marker Brush Pack','brushes'],['Fabric Texture Pack','textures'],['Cinematic LUTs','effects']]){const p={name,category:'Reviewed category',summary:'My AI text',hidden:true};const before=JSON.stringify(p);assert.equal(C.infer(p).type,expected,name);assert.equal(JSON.stringify(p),before);}});
test('mockup subtypes and software mentions filter independently of reviewed category',()=>{const p={name:'iPhone Device Mockup PSD',category:'My category'};assert.equal(C.infer(p).mockup,'devices');assert.deepEqual(C.infer(p).software,['Photoshop']);assert.equal(C.matches(p,{type:'mockups',mockup:'devices',software:'Photoshop'}),true);assert.equal(C.matches(p,{type:'mockups',mockup:'apparel'}),false);assert.equal(C.infer({name:'Oversized T-shirt Mockup'}).mockup,'apparel');assert.equal(C.infer({name:'Metallic Bubble Mailer Mockup'}).mockup,'packaging');});
test('unverified purchase text and existing generic summaries cannot drive type or software filters',()=>{const p={name:'Unknown bundle',description:'Fonts for Blender and After Effects',suggestedUse:'Make videos',category:'Motion & video'};assert.equal(C.infer(p).type,'uncategorized');assert.deepEqual(C.infer(p).software,[]);assert.equal(C.infer({...p,descriptionSource:'public-product',description:'A sound effects collection.'}).type,'audio');});

test('a recognized category reviewed by the user takes precedence over automatic title rules',()=>{assert.equal(C.infer({name:'Typography guide',category:'Courses & tutorials',analysisSource:'Your category'}).type,'courses');assert.equal(C.infer({name:'Unknown item',category:'Plugins',analysisSource:'AI suggestion · reviewed by you'}).type,'plugins');});

test('same-title search and software filtering agree on named public storefront mentions',()=>{
 const search=require('../app/search.js');
 const base={name:'Grain Brush Set',descriptionSource:'public-product'};
 const procreate={...base,description:'A grain brush kit for Procreate on iPad.'};
 const photoshop={...base,description:'A grain brush kit for Photoshop.'};
 for(const [name,correct,other] of [['Procreate',procreate,photoshop],['Photoshop',photoshop,procreate]]){
  assert.equal(search.match(correct,'grain '+name,C).matches,true);
  assert.equal(search.match(other,'grain '+name,C).matches,false);
  assert.equal(C.matches(correct,{software:name}),true);
  assert.equal(C.matches(other,{software:name}),false);
  assert.deepEqual(C.softwareMentions(correct,name),[{name,sources:['Storefront description']}]);
  assert.deepEqual(C.infer(correct).software,[]);
 }
});

test('software evidence keeps title hints and literal mentions separate from missing or private text',()=>{
 const known={name:'Procreate Ink',descriptionSource:'public-product',description:'An alternative to Procreate. Does not work with Photoshop.'};
 assert.deepEqual(C.softwareMentions(known,'Procreate'),[{name:'Procreate',sources:['Title','Storefront description']}]);
 assert.deepEqual(C.softwareMentions(known,'Photoshop'),[{name:'Photoshop',sources:['Storefront description']}]);
 assert.deepEqual(C.softwareMentions({name:'Procreate Ink'}),[{name:'Procreate',sources:['Title']}]);
 assert.deepEqual(C.softwareMentions({name:'Cloud Kit',description:'Procreate',notes:'Blender',summary:'Figma'}),[]);
 assert.deepEqual(C.softwareMentions({name:'Cloud Kit',descriptionSource:'public-product',description:'Procreated textures and PSD files.'}),[]);
});
