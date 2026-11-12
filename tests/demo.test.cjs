const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Catalog = require('../app/catalog.js');
const Search = require('../app/search.js');
const Creators = require('../app/creators.js');

const demoSource = fs.readFileSync(require.resolve('../app/demo.js'), 'utf8');
const appSource = fs.readFileSync(require.resolve('../app/app.js'), 'utf8');

function demoData() {
 const context = vm.createContext({window: {}});
 vm.runInContext(demoSource, context);
 return context.window;
}

function renderer() {
 const calls = [];
 const context = vm.createContext({
  window: {
   gum: new Proxy({}, {get: (_, name) => async () => { calls.push(name); throw Error('Unexpected desktop call ' + name); }}),
   matchMedia: () => ({addEventListener() {}})
  },
  document: {addEventListener() {}},
  GumCatalog: Catalog, GumSearch: Search, GumCreators: Creators,
  structuredClone, setTimeout, clearTimeout, setInterval() {}
 });
 vm.runInContext(demoSource, context);
 vm.runInContext(appSource.slice(0, appSource.lastIndexOf('(async()=>')), context);
 vm.runInContext(`
  render = () => {};
  toast = () => {};
  applyAppearance = () => {};
  openDialog = html => { window.dialogHTML = html; };
  state = {
   products: [{id: 'real-product', name: 'Local resource', notes: 'Original'}],
   collections: [{id: 'real-collection', name: 'My collection', productIds: ['real-product']}],
   settings: {theme: 'dark', nested: {value: 'original'}}, scan: {status: 'idle'}
  };
  window.originalState = state;
 `, context);
 return {context, calls, run: code => vm.runInContext(code, context)};
}

test('demo contains 40 distinct complete fictional products and the requested library states', () => {
 const {demoProducts: products} = demoData();
 assert.equal(products.length, 40);
 assert.equal(new Set(products.map(p => p.id)).size, 40);
 assert.equal(new Set(products.map(p => p.name)).size, 40);
 assert.equal(new Set(products.map(p => p.creator)).size, 14);
 assert.equal(products.filter(p => p.saved).length, 12);
 assert.equal(products.filter(p => p.archived).length, 4);
 assert.equal(products.filter(p => p.hidden).length, 2);
 assert.equal(products.filter(p => p.notes).length, 10);
 for (const product of products) {
  for (const field of ['id', 'name', 'creator', 'category', 'format', 'description', 'summary', 'suggestedUse', 'analysisSource', 'thumbnail']) {
   assert.equal(typeof product[field], 'string', product.id + ' ' + field);
   assert.ok(product[field].trim(), product.id + ' ' + field);
  }
  const sentences = product.description.match(/[.!?](?:\s|$)/g) || [];
  assert.ok(sentences.length >= 2 && sentences.length <= 4, product.id + ' description sentences');
  assert.ok(product.uses.length >= 2 && product.uses.length <= 3, product.id + ' uses');
  assert.ok(product.uses.every(use => typeof use === 'string' && use.trim()));
  assert.equal(product.analysisSource, 'AI review (demo)');
  assert.equal(product.detailState, 'complete');
 }
});

test('four demo collections use valid saved memberships in the real collection shape', () => {
 const {demoProducts: products, demoCollections: collections} = demoData();
 assert.equal(collections.length, 4);
 assert.equal(new Set(collections.map(c => c.id)).size, 4);
 for (const collection of collections) {
  assert.deepEqual(Object.keys(collection).sort(), ['id', 'name', 'productIds']);
  assert.ok(collection.name.trim());
  assert.ok(collection.productIds.length >= 4 && collection.productIds.length <= 8);
  assert.equal(new Set(collection.productIds).size, collection.productIds.length);
  for (const id of collection.productIds) {
   const product = products.find(p => p.id === id);
   assert.ok(product, id);
   assert.ok(product.saved && !product.hidden && !product.archived, id);
  }
 }
});

test('demo covers are unique self-contained SVGs and demo data has no HTTP product or image URLs', () => {
 const {demoProducts: products, demoCollections: collections, demoCover} = demoData();
 assert.doesNotMatch(JSON.stringify({products, collections}), /https?:\/\//i);
 assert.equal(new Set(products.map(p => p.thumbnail)).size, 40);
 assert.ok(Buffer.byteLength(demoSource) < 250_000);
 for (const product of products) {
  assert.match(product.thumbnail, /^data:image\/svg\+xml;charset=utf-8,/);
  const svg = decodeURIComponent(product.thumbnail.split(',')[1]);
  assert.match(svg, /viewBox="0 0 640 400"/);
  // The SVG namespace identifies the format. It never triggers a request.
  assert.doesNotMatch(svg.replace('xmlns="http://www.w3.org/2000/svg"', ''), /https?:|\b(?:href|src)=|<script|<foreignObject|@import/i);
  assert.match(svg, /<(?:path|circle|ellipse|rect)\b/);
  assert.equal(product.images.length, 1);
  assert.equal(product.images[0], product.thumbnail);
  assert.equal(demoCover(product.id), product.thumbnail);
  for (const field of ['sourceUrl', 'publicUrl', 'creatorUrl']) assert.equal(product[field], '');
 }
 assert.equal(demoCover('real-product'), '');
});

test('demo covers every catalog type and mockup kind through the normal inference path', () => {
 const {demoProducts: products} = demoData();
 assert.deepEqual([...new Set(products.map(p => Catalog.infer(p).type))].sort(), Catalog.types.map(t => t.id).sort());
 for (const product of products) assert.equal(Catalog.byId(Catalog.infer(product).type).label, product.category, product.name);
 const kinds = new Set(products.map(p => Catalog.infer(p).mockup).filter(Boolean));
 for (const kind of ['devices', 'packaging', 'apparel', 'stationery', 'posters', 'presentations']) assert.ok(kinds.has(kind), kind);
 const active = products.filter(p => !p.hidden && !p.archived);
 assert.equal(new Set(active.map(p => Catalog.infer(p).type)).size, Catalog.types.length - 1);
 assert.equal(Creators.groups(active, Catalog).length, 14);
});

test('demo format labels drive software filters while real-library inference keeps its title evidence', () => {
 const {demoProducts: products} = demoData();
 const brush = products.find(p => p.id === 'demo-06');
 assert.equal(Catalog.matches(brush, {software: 'Procreate', type: 'brushes'}), true);
 assert.deepEqual(Catalog.softwareMentions(brush, 'Procreate'), [{name: 'Procreate', sources: ['Demo format']}]);
 assert.equal(Catalog.matches({...brush, analysisSource: 'Local keyword suggestion'}, {software: 'Procreate'}), false);
 assert.equal(Catalog.infer({name: 'Conservatory Scene', format: 'Blender'}).type, 'uncategorized');
 for (const [query, id] of [['Morroway', 'demo-01'], ['Orrava', 'demo-01'], ['soft studio lighting', 'demo-10'], ['bounce-light', 'demo-16'], ['Procreate', 'demo-06'], ['folding cartons', 'demo-02']]) {
  assert.equal(Search.match(products.find(p => p.id === id), query, Catalog).matches, true, query);
 }
});

test('entering and exiting demo isolates products, collections, settings and pending AI edits', async () => {
 const {run, calls} = renderer();
 await run("act('demo', {dataset: {}})");
 assert.equal(run('state.products.length'), 40);
 assert.equal(run('state.collections.length'), 4);
 assert.equal(run('state.products === window.demoProducts'), false);
 assert.equal(run('state.collections[0] === window.demoCollections[0]'), false);
 await run("updateProduct('demo-01', {notes: 'Session-only edit'})");
 await run("window.GumUpdateAppearance({accent: '#123456'})");
 run("state.settings.nested.value = 'session-only'; state.collections[0].name = 'Session-only collection'; reviewRows = [{id: 'demo-01'}]");
 assert.equal(run('window.originalState.settings.nested.value'), 'original');
 assert.equal(run('window.demoProducts[0].notes'), 'Try the compact navigation for the client portal. Keep the activity feed on the right.');
 // Re-entering from Settings must retain the real-state snapshot.
 await run("act('demo', {dataset: {}})");
 await run("act('exit-demo', {dataset: {}})");
 assert.equal(run('state === window.originalState'), true);
 assert.equal(run('state.products[0].notes'), 'Original');
 assert.equal(run('state.settings.accent'), undefined);
 assert.equal(run('reviewRows.length'), 0);
 assert.equal(run('realState'), null);
 assert.deepEqual(calls, []);
});

test('demo cannot invoke library writes, scan actions or review undo through desktop IPC', async () => {
 const {run, calls} = renderer();
 await run("act('demo', {dataset: {}})");
 for (const action of ['connect', 'repair-helper', 'full-scan', 'test-scan', 'refresh-product', 'quick-scan', 'sample-scan', 'retry-details', 'resume', 'pause', 'cancel', 'disconnect', 'visit', 'review', 'mark-reviewed', 'undo-review', 'quote-import-confirm']) {
  await run(`act('${action}', {dataset: {id: 'demo-01'}})`);
 }
 assert.equal(await run("changeCollection({action: 'create', name: 'No disk writes'})"), false);
 assert.equal(await run("quoteChange({action: 'remove', id: 'example'})"), false);
 await run("act('preview-export', {dataset: {}})");
 assert.match(run('window.dialogHTML'), /Morroway UI Kit/);
 assert.deepEqual(calls, []);
 assert.equal(run('state.products.length'), 40);
});

test('normal demo render paths show covers, summaries, collection counts and hidden concealment', async () => {
 const {run, calls} = renderer();
 await run("act('demo', {dataset: {}})");
 for (const expression of ['cover(state.products[0])', 'cover(state.products[0],true)', 'productArt(state.products[0])', 'homeCard(state.products[0])', 'productHTML(state.products[0])']) {
  assert.match(run(expression), /<img[^>]+src="data:image\/svg\+xml/);
 }
 run("selected = 'demo-01'");
 assert.match(run('detailHTML()'), /About this resource/);
 assert.match(run('detailHTML()'), /AI review \(demo\)/);
 assert.match(run('savedCollectionsHTML()'), /Client pitch kit <span>5<\/span>/);
 run("view = 'saved'; savedCollection = 'demo-learning'");
 assert.equal(run('allowedProducts().length'), 4);
 assert.match(run('cover(byId("demo-36"))'), /hidden-art/);
 assert.doesNotMatch(run('productArt(byId("demo-36"))'), /<img/);
 run("revealed.add('demo-36')");
 assert.match(run('cover(byId("demo-36"),true)'), /data:image\/svg\+xml/);
 await run("act('exit-demo', {dataset: {}})");
 run("state.products[0].thumbnail = window.demoProducts[0].thumbnail");
 assert.match(run('cover(state.products[0])'), /cover-placeholder/);
 assert.match(run('productArt(state.products[0])'), /cover-placeholder/);
 assert.deepEqual(calls, []);
});
