const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture(product) {
 const context = vm.createContext({
  GumCatalog: require('../app/catalog.js'),
  window: {matchMedia: () => ({addEventListener() {}})},
  document: {addEventListener() {}},
  setTimeout, clearTimeout, setInterval() {}, product
 });
 vm.runInContext(fs.readFileSync(require.resolve('../app/visual-icons.js'), 'utf8'), context);
 const source = fs.readFileSync(require.resolve('../app/app.js'), 'utf8');
 vm.runInContext(source.slice(0, source.lastIndexOf('(async()=>')), context);
 return context;
}

test('library, detail hero, Home and search artwork use the category cover for missing images', () => {
 const ctx = fixture({id: 'mockup', name: '<Product> Mockup', format: 'digital', native_type: 'digital'});
 for (const expression of ['cover(product)', 'cover(product,true)', 'homeCard(product)', 'productArt(product)']) {
  const html = vm.runInContext(expression, ctx);
  assert.match(html, /class="cover-placeholder"/);
  assert.match(html, /class="cover-placeholder-icon"><svg/);
  assert.match(html, /class="cover-placeholder-label">Mockups<\/span>/);
  assert.doesNotMatch(html, /digital|preview unavailable|<Product>/i);
 }
 assert.match(vm.runInContext('homeCard(product)', ctx), /&lt;Product&gt;/);
 ctx.product.thumbnail = 'https://untrusted.test/image.jpg';
 assert.match(vm.runInContext('cover(product)', ctx), /cover-placeholder/);
});

test('valid artwork and hidden product concealment keep their existing behavior', () => {
 const thumbnail = 'gumasset://image/' + 'a'.repeat(64);
 const gallery = 'gumasset://image/' + 'b'.repeat(64);
 const ctx = fixture({id: 'hidden', name: '<Title>', thumbnail, images: [gallery], extractionVersion: 2, hidden: true});
 for (const expression of ['cover(product)', 'cover(product,true)']) {
  const html = vm.runInContext(expression, ctx);
  assert.match(html, /class="hidden-art"/);
  assert.doesNotMatch(html, /<img|cover-placeholder/);
 }
 vm.runInContext("revealed.add('hidden')", ctx);
 assert.ok(vm.runInContext('cover(product)', ctx).includes(thumbnail));
 assert.ok(vm.runInContext('cover(product,true)', ctx).includes(gallery));
 assert.match(vm.runInContext('cover(product)', ctx), /alt="&lt;Title&gt; preview"/);
 assert.ok(vm.runInContext('productArt(product)', ctx).includes(thumbnail));
});

test('missing previews use subtle neutral grays in both themes without category color overrides', () => {
 const ctx = fixture({id: 'plain', name: 'Uncategorized product'});
 assert.doesNotMatch(vm.runInContext('cover(product)', ctx), /style=|--type-color/);
 const css = fs.readFileSync(require.resolve('../app/home-v2.css'), 'utf8');
 const light = css.match(/body\[data-theme\] \.cover-placeholder \{([^}]+)\}/)[1];
 const dark = css.match(/body\[data-theme=dark\] \.cover-placeholder \{([^}]+)\}/)[1];
 for (const rule of [light, dark]) {
  assert.match(rule, /linear-gradient/);
  assert.doesNotMatch(rule, /--type-color|--color-accent|radial-gradient/);
  for (const [, r, g, b] of rule.matchAll(/#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/gi)) {
   assert.equal(r, g);
   assert.equal(g, b);
  }
 }
});
