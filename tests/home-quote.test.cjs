const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const data = require('../app/quotes-data.js');

function fixture(items = data.quotes, settings = {}) {
 const context = vm.createContext({
  GumQuoteData: data,
  GumCatalog: require('../app/catalog.js'),
  window: {gum: {}, matchMedia: () => ({matches: false, addEventListener() {}})},
  document: {addEventListener() {}},
  setTimeout, clearTimeout, setInterval() {}
 });
 vm.runInContext(fs.readFileSync(require.resolve('../app/quotes.js'), 'utf8'), context);
 const source = fs.readFileSync(require.resolve('../app/app.js'), 'utf8');
 vm.runInContext(source.slice(0, source.lastIndexOf('(async()=>')), context);
 context.GumQuotes.configure(items);
 context.settings = settings;
 vm.runInContext('state.settings=settings', context);
 return context;
}

test('empty phrases, book selections, themes and libraries fall back to attributed short quotes', () => {
 for (const settings of [
  {homeQuoteSource: 'custom', homePhrases: []},
  {homeQuoteSource: 'custom', homePhrases: [' ', '']},
  {homeQuoteSource: 'books', homeQuoteBooks: []},
  {homeQuoteSource: 'books', homeQuoteTheme: 'Missing theme'},
  {homeQuoteSource: 'both', homeQuoteBooks: [], homePhrases: []}
 ]) {
  for (const items of [data.quotes, []]) {
   const ctx = fixture(items, settings);
   const quote = vm.runInContext('currentHomeQuote()', ctx);
   assert.equal(quote.bookId, 'short-and-sharp');
   assert.ok(quote.text.length > 0 && quote.text.length <= 90);
   assert.ok(quote.author);
   const html = vm.runInContext('headlineMarkup()+quoteAttributionHTML()', ctx);
   assert.match(html, /id="headline-visible"/);
   assert.match(html, /id="quote-attribution"/);
   assert.ok(html.includes(quote.author));
   assert.doesNotMatch(html, /Feeling creative\?/);
  }
 }
});

test('deleting the last selected quote refreshes Home and never produces a bare fallback', () => {
 const quote = {id: 'only', text: 'Selected quote', author: 'Author', bookId: 'selected', book: 'Selected'};
 const ctx = fixture([quote], {homeQuoteSource: 'books', homeQuoteBooks: ['selected']});
 assert.equal(vm.runInContext('currentHomeQuote().id', ctx), 'only');
 assert.match(vm.runInContext('homeQuoteActions()', ctx), /quote-delete-action/);
 ctx.GumQuotes.configure([]);
 vm.runInContext('state.quoteLibrary={revision:2}', ctx);
 assert.equal(vm.runInContext('currentHomeQuote().bookId', ctx), 'short-and-sharp');
 const html = vm.runInContext('headlineMarkup()+quoteAttributionHTML()+homeQuoteActions()', ctx);
 assert.doesNotMatch(html, /Feeling creative\?|quote-delete-action/);
 assert.match(html, /Aristotle|Leonardo da Vinci|Mark Twain|Marcus Aurelius|Seneca|Confucius|Benjamin Franklin|Theodore Roosevelt|Robert Frost|Friedrich Nietzsche/);
 const remaining = fixture(data.quotes.filter(q => q.id !== 'short-01'), {homeQuoteSource: 'custom', homePhrases: []});
 assert.equal(vm.runInContext("homeQuoteRecords().some(q=>q.id==='short-01')", remaining), false);
 assert.equal(vm.runInContext('homeQuoteRecords().length', remaining), 9);
});

test('Home prefers quotes up to 90 characters and keeps longer quotes when needed', () => {
 const quotes = [90, 91, 45].map(length => ({id: String(length), text: 'x'.repeat(length), author: 'Author', bookId: 'mixed'}));
 const ctx = fixture(quotes, {homeQuoteSource: 'books', homeQuoteShuffle: false});
 assert.deepEqual(Array.from(vm.runInContext('homeQuoteRecords()', ctx), q => q.text.length), [90, 45]);
 ctx.GumQuotes.configure([quotes[1]]);
 vm.runInContext('state.quoteLibrary={revision:2}', ctx);
 assert.equal(vm.runInContext('currentHomeQuote().text.length', ctx), 91);
 const custom = fixture([], {homeQuoteSource: 'custom', homePhrases: ['a'.repeat(91), 'Brief phrase']});
 assert.equal(vm.runInContext('currentHomeQuote().text', custom), 'Brief phrase');
 assert.equal(vm.runInContext("GumQuotes.home({homeQuoteSource:'off'}).length", ctx), 0);
});

test('Home escapes quote text, attribution and theme from the library', () => {
 const quote = {id: 'html', text: '<img src=x onerror=alert(1)>', author: '<b>Author</b>', book: 'Book & notes', bookId: 'html', theme: '<script>theme</script>'};
 const ctx = fixture([quote]);
 const html = vm.runInContext('headlineMarkup()+quoteAttributionHTML()', ctx);
 assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
 assert.ok(html.includes('&lt;b&gt;Author&lt;/b&gt;'));
 assert.ok(html.includes('Book &amp; notes'));
 assert.doesNotMatch(html, /<img|<b>|<script>/);
});
