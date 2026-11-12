const test=require('node:test'),assert=require('node:assert/strict');const Quotes=require('../app/quotes.js');
test('book collection contains complete unique entries and keeps user phrases separate',()=>{
 assert.equal(Quotes.quotes.length,400);assert.equal(new Set(Quotes.quotes.map(q=>q.id)).size,400);assert.equal(Quotes.books.length,20);assert.ok(Quotes.books.every(b=>b.count===20));assert.equal(Quotes.themes.length,394);assert.equal(Math.max(...Quotes.quotes.map(q=>q.text.length)),347);assert.equal(Quotes.select({}).length,400);
 assert.equal(Quotes.source({homePhrases:['My own phrase']}),'custom');assert.deepEqual(Quotes.select({homePhrases:['My own phrase']}).map(q=>q.text),['My own phrase']);assert.equal(Quotes.select({homeQuoteSource:'both',homePhrases:['Mine']}).length,401);assert.equal(Quotes.select({homeQuoteSource:'off'}).length,0);
});
test('book/theme filters, explicit empty selection and stored settings round trips are reliable',()=>{
 const book=Quotes.books[0];const settings=Quotes.settingsPatch({homeQuoteSource:'books',homeQuoteBooks:[book.id],homeQuoteTheme:'',homeQuoteShuffle:false});assert.equal(Quotes.select(JSON.parse(JSON.stringify(settings))).length,20);const theme=Quotes.quotes.find(q=>q.bookId===book.id).theme;const selected=Quotes.select({...settings,homeQuoteTheme:theme});assert.ok(selected.length);assert.ok(selected.every(q=>q.bookId===book.id&&q.theme===theme));assert.equal(Quotes.select({...settings,homeQuoteBooks:[]}).length,0);
 for(const invalid of [{homeQuoteSource:'anything'},{homeQuoteBooks:['missing']},{homeQuoteTheme:'missing'},{homeQuoteShuffle:'yes'}])assert.throws(()=>Quotes.settingsPatch(invalid));
});
test('shuffle preserves all entries without mutation and attribution remains separate',()=>{
 const selected=Quotes.select({}),before=JSON.stringify(selected),mixed=Quotes.shuffle(selected,()=>0);assert.equal(JSON.stringify(selected),before);assert.deepEqual(new Set(mixed.map(q=>q.id)),new Set(selected.map(q=>q.id)));assert.notDeepEqual(mixed.map(q=>q.id),selected.map(q=>q.id));assert.ok(Quotes.attribution(selected[0]).includes(selected[0].author));assert.equal(Quotes.shuffleEnabled({homePhrases:['First','Second']}),false);assert.equal(Quotes.shuffleEnabled({}),true);
});
