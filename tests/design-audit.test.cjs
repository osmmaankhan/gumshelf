const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Catalog=require('../app/catalog.js');
const Intent=require('../app/intent.js');

function fixture(){
 const source=fs.readFileSync(require.resolve('../app/app.js'),'utf8');
 const context=vm.createContext({GumSearch:require('../app/search.js'),GumSuggest:require('../app/suggest.js'),GumIntent:Intent,GumCreators:require('../app/creators.js'),GumHeadline:require('../app/headline.js'),GumQuoteData:require('../app/quotes-data.js'),GumQuotes:require('../app/quotes.js'),GumCatalog:Catalog,window:{matchMedia:()=>({addEventListener(){}})},document:{addEventListener(){},getElementById:()=>null},setTimeout,clearTimeout,setInterval:()=>{}});
 vm.runInContext(source.slice(0,source.lastIndexOf('(async()=>')),context);
 return context;
}
const artwork='gumasset://image/'+'a'.repeat(64);
const product=(id,type,creator,extra={})=>({id,name:id+' '+type+' resource',creator,...extra});

test('Rediscover round-robins types with creator, type and total caps',()=>{
 const products=['Font','Mockup','Texture','Brush','3D model','Template'].flatMap((type,index)=>Array.from({length:5},(_,i)=>product(index+'-'+i,type,'Creator '+index+'-'+i)));
 const before=JSON.stringify(products),picks=Intent.rediscoverPicks(products,0,[]),counts=new Map();
 assert.equal(picks.length,8);
 assert.equal(new Set(picks.map(p=>p.creator)).size,picks.length);
 for(const p of picks){const type=Catalog.infer(p).type;counts.set(type,(counts.get(type)||0)+1);}
 assert.ok([...counts.values()].every(count=>count<=2));
 assert.equal(new Set(picks.slice(0,6).map(p=>Catalog.infer(p).type)).size,6);
 assert.equal(JSON.stringify(products),before);
 assert.deepEqual(Intent.rediscoverPicks(products,0,[]),picks);
 assert.notDeepEqual(Intent.rediscoverPicks(products,1,[]),picks);
});

test('Rediscover excludes private, archived and recent products and keeps the first title variant',()=>{
 const products=[product('first','Font','Same',{name:'Premium Serif Font One'}),product('duplicate','Font','Other',{name:'PREMIUM serif font Two',thumbnail:artwork}),product('same-creator','Mockup',' same '),product('hidden','Brush','Private',{hidden:true}),product('archived','Texture','Old',{archived:true}),product('recent','Template','Recent')];
 const picks=Intent.rediscoverPicks(products,8,['recent']);
 assert.deepEqual(picks.map(p=>p.id),['first']);
 assert.deepEqual(Intent.rediscoverPicks([],0,[]),[]);
});

test('Rediscover prioritizes artwork and handles missing creator/title and unusual seeds',()=>{
 const products=[product('plain','Font','Plain'),product('art','Font','Art',{thumbnail:artwork}),{id:'unknown'},{id:'unknown2',name:'Mockup'}];
 assert.equal(Intent.rediscoverPicks(products,0,[])[0].id,'art');
 assert.ok(Intent.rediscoverPicks(products,-7,[]).length<=4);
 assert.deepEqual(Intent.rediscoverPicks(products,NaN,[]),Intent.rediscoverPicks(products,0,[]));
});

test('Home tries use the top three visible types and always provide three tasks',()=>{
 const products=[...Array.from({length:4},(_,i)=>product('m'+i,'Mockup','M')), ...Array.from({length:3},(_,i)=>product('f'+i,'Font','F')),product('t','Texture','T'),...Array.from({length:8},(_,i)=>product('h'+i,'Brush','Hidden',{hidden:true})),product('a','Brush','Old',{archived:true})];
 assert.deepEqual(Intent.homeTries(products),[{text:'Mockups for a product launch',mode:'plan'},{text:'Fonts for a brand identity',mode:'plan'},{text:'Textures with grain',mode:'find'}]);
 assert.equal(Intent.homeTries([]).length,3);
});

test('Home keeps its prompt structure, hides shelves during queries and removes the complete quote strip',()=>{
 const ctx=fixture();
 vm.runInContext("state.products=[{id:'1',name:'Font',creator:'Amy'}];state.settings.homeQuoteSource='off'",ctx);
 const idle=vm.runInContext('homeHTML()',ctx),searching=vm.runInContext("query='font';homeHTML()",ctx);
 for(const html of [idle,searching]){
  assert.match(html,/<h1 class="home-title">What are you making today\?<\/h1>/);
  assert.match(html,/class="home-prompt"><div class="search-wrap">/);
  assert.match(html,/class="home-prompt-bar"><div class="home-mode" role="radiogroup"/);
  assert.equal((html.match(/class="home-try"/g)||[]).length,3);
  assert.doesNotMatch(html,/class="home-quote"|class="home-quote-strip"/);
 }
 assert.match(idle,/id="rediscover-title"/);
 assert.doesNotMatch(idle,/id="jump-back-title"/);
 assert.doesNotMatch(searching,/id="rediscover-title"|id="shelves-title"/);
 assert.match(searching,/home-results-tools/);
 vm.runInContext("query='';state.settings.homeQuoteSource='custom';state.settings.homePhrases=['A quote'];recentProducts=['1']",ctx);
 const quoted=vm.runInContext('homeHTML()',ctx);
 assert.match(quoted,/home-quote-strip/);
 assert.match(quoted,/id="home-headline"/);
 assert.match(quoted,/home-row is-few/);
 assert.match(quoted,/popovertarget="quote-actions-menu"/);
 assert.ok(quoted.indexOf('home-quote-strip')>quoted.indexOf('</section>'));
 const planning=vm.runInContext("homeMode='plan';query='brand';homePlanText='brand';homeHTML()",ctx);
 assert.match(planning,/home-plan/);
 assert.doesNotMatch(planning,/home-quote-strip|id="rediscover-title"/);
});

test('dropdown omits empty wrapper and exposes true expanded state',()=>{
 const ctx=fixture();
 vm.runInContext('creatorSuggestOpen=true;recentSearches=[]',ctx);
 assert.equal(vm.runInContext('suggestHTML()',ctx),'');
 assert.match(vm.runInContext('suggestAria()',ctx),/aria-expanded="false"/);
 vm.runInContext("recentSearches=['<recent>']",ctx);
 assert.match(vm.runInContext('suggestHTML()',ctx),/Recent searches/);
 assert.match(vm.runInContext('suggestHTML()',ctx),/&lt;recent&gt;/);
 vm.runInContext("query='no match'",ctx);
 assert.match(vm.runInContext('suggestHTML()',ctx),/data-kind="all"/);
 assert.match(vm.runInContext('suggestHTML()',ctx),/View all results \(0\)/);
});

test('cards escape library text and move secondary actions into a unique popover',()=>{
 const ctx=fixture();ctx.product={id:'x"<',name:'<Title>',creator:'<Creator>',saved:true,archived:true};
 const html=vm.runInContext("view='library';productHTML(product)",ctx);
 assert.match(html,/title-button product-title/);
 assert.ok(html.indexOf('product-title')<html.indexOf('creator-label'));
 assert.match(html,/&lt;Title&gt;/);assert.match(html,/&lt;Creator&gt;/);
 assert.doesNotMatch(html,/<Title>|<Creator>/);
 const visible=html.slice(html.indexOf('class="row-actions"'),html.indexOf('<div class="product-actions-menu"'));
 assert.match(visible,/is-saved/);assert.match(visible,/product-more product-menu-trigger/);
 assert.doesNotMatch(visible,/data-action="hide"|data-action="select"/);
 assert.match(html,/popovertarget="card-actions-x&quot;&lt;"/);
 for(const label of ['Open details','Visit on Gumroad','Hide','Select for AI review','Archived on Gumroad'])assert.ok(html.includes(label));
 ctx.product.hidden=true;
 assert.match(vm.runInContext("view='hidden';productHTML(product)",ctx),/Unhide/);
 assert.doesNotMatch(vm.runInContext('productHTML(product)',ctx),/type="checkbox"/);
});

test('library-family controls share one toolbar with a collapsible panel and scoped headers',()=>{
 const ctx=fixture();
 for(const view of ['library','saved','archive','hidden']){
  ctx.route=view;
  const html=vm.runInContext('view=route;pageHTML()',ctx);
  assert.match(html,/data-action="toggle-filters" aria-expanded="false"/);
  assert.match(html,/class="filters-panel" id="library-filters" hidden/);
  assert.match(html,/id="product-size"/);
  const heading=html.slice(0,html.indexOf('<div class="content-area'));
  if(view==='library'){assert.match(heading,/Update library/);assert.match(heading,/popovertarget="library-actions-menu"/);}else assert.doesNotMatch(heading,/Update library|Continue scan|AI Review/);
 }
 const open=vm.runInContext("filtersOpen=true;softwareMention='Figma';toolbar()",ctx);
 assert.match(open,/aria-expanded="true"/);assert.match(open,/filter-count">1/);
 assert.doesNotMatch(open,/id="library-filters" hidden/);
});


test('Home submit and try chips run their selected mode and clear old type filters',async()=>{
 const ctx=fixture();vm.runInContext('render=()=>{}',ctx);
 await vm.runInContext("homeTypes.add('textures');act('home-try',{dataset:{text:'Fonts for a brand identity',mode:'plan'}})",ctx);
 assert.equal(vm.runInContext('query',ctx),'Fonts for a brand identity');
 assert.equal(vm.runInContext('homeMode',ctx),'plan');
 assert.equal(vm.runInContext('homePlanText',ctx),'Fonts for a brand identity');
 assert.equal(vm.runInContext('homeTypes.size',ctx),0);
 await vm.runInContext("homeMode='find';act('home-submit',{dataset:{}})",ctx);
 assert.equal(vm.runInContext('homePlanText',ctx),'');
 assert.equal(vm.runInContext('creatorSuggestOpen',ctx),false);
 vm.runInContext("view='hidden';query='secret';state.products=[{id:'h',name:'Secret asset',hidden:true}]",ctx);
 assert.equal(vm.runInContext('suggestOptions().at(-1).count',ctx),1);
 assert.equal(vm.runInContext("suggestOptions().some(item=>item.kind==='product')",ctx),false);
});

test('View all uses the current result filters and returns Home planning to Find',()=>{
 const ctx=fixture();vm.runInContext("render=()=>{};state.products=[{id:'f',name:'Font asset',creator:'A'},{id:'m',name:'Mockup asset',creator:'B'},{id:'h',name:'Secret asset',hidden:true}];query='asset';homeTypes.add('fonts');homeMode='plan'",ctx);
 assert.equal(vm.runInContext("suggestOptions().at(-1).count",ctx),1);
 vm.runInContext('activateSuggestion(suggestOptions().length-1)',ctx);
 assert.equal(vm.runInContext('homeMode',ctx),'find');
 assert.equal(vm.runInContext('homePlanText',ctx),'');
});

test('popover placement stays inside the viewport near its own trigger',()=>{
 const menu={id:'card-actions-item',style:{},getBoundingClientRect:()=>({width:220,height:150})};
 const trigger={getAttribute:()=>menu.id,getBoundingClientRect:()=>({top:938,bottom:970,right:1400})};
 const ctx=vm.createContext({menu,document:{addEventListener(){},querySelectorAll:()=>[trigger]},window:{innerHeight:1000,innerWidth:1440,addEventListener(){}}});
 vm.runInContext(fs.readFileSync(require.resolve('../app/product-menu.js'),'utf8'),ctx);
 vm.runInContext('positionProductMenu(menu)',ctx);
 assert.equal(menu.style.top,'780px');assert.equal(menu.style.left,'1180px');
 assert.equal(menu.style.positionArea,'none');assert.equal(menu.style.positionTryFallbacks,'none');
});
