const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');const {QuoteStore}=require('../lib/quote-store.cjs');
const seed=[{id:'one',text:'Original one',book:'Book',author:'Author',theme:'Work'},{id:'two',text:'Original two',book:'Book',theme:'Work'}];
function store(t,items=seed){const workspace=os.tmpdir();const dir=fs.mkdtempSync(path.join(workspace,'gumshelf-quotes-'));t.after(()=>{assert.ok(path.resolve(dir).startsWith(workspace+path.sep));fs.rmSync(dir,{recursive:true,force:true});});return {dir,store:new QuoteStore(dir,items)};}
test('quote edits, deletions and new seed entries survive restarts without overwriting user choices',t=>{const {dir,store:s}=store(t);assert.equal(s.doc.quotes.length,2);s.upsert({...s.doc.quotes[0],text:'Edited locally'});s.remove('two');const reopened=new QuoteStore(dir,[...seed,{id:'three',text:'New bundled quote',book:'Book'}]);assert.equal(reopened.doc.quotes.find(q=>q.id==='one').text,'Edited locally');assert.equal(reopened.doc.quotes.some(q=>q.id==='two'),false);assert.equal(reopened.doc.quotes.some(q=>q.id==='three'),true);const before=JSON.stringify(reopened.doc);const result=reopened.import([...seed,{id:'four',text:'Imported quote',book:'Book'}]);assert.deepEqual(result,{added:1,kept:2});assert.equal(reopened.doc.quotes.find(q=>q.id==='one').text,'Edited locally');reopened.undo();assert.equal(JSON.stringify(reopened.doc),before);assert.ok(fs.existsSync(reopened.backup));});
test('manual JSON edits reload; malformed files stay untouched and retain the last loaded quotes',t=>{const {dir,store:s}=store(t);const edited=JSON.parse(fs.readFileSync(s.file));edited.quotes[0].text='Edited in a text editor';edited.quotes=edited.quotes.slice(0,1);fs.writeFileSync(s.file,JSON.stringify(edited));assert.equal(s.reload(),true);assert.equal(s.doc.quotes[0].text,'Edited in a text editor');const valid=fs.readFileSync(s.file);fs.writeFileSync(s.file,'{bad JSON');assert.equal(s.reload(),false);assert.equal(s.doc.quotes.length,1);assert.throws(()=>s.upsert({text:'Cannot overwrite malformed file'}));assert.equal(fs.readFileSync(s.file,'utf8'),'{bad JSON');fs.writeFileSync(s.file,valid);assert.equal(s.reload(),true);const reopened=new QuoteStore(dir,seed);assert.equal(reopened.doc.quotes.length,1);});
test('invalid quote mutations do not alter stored data',t=>{const {store:s}=store(t);const before=fs.readFileSync(s.file,'utf8');for(const q of [{text:''},{text:'x'.repeat(2001)},{id:'missing',text:'Unknown'}])assert.throws(()=>s.upsert(q));assert.throws(()=>s.remove('unknown'));assert.equal(fs.readFileSync(s.file,'utf8'),before);});

test('all ten Short & sharp entries seed an existing library while edits and deletions survive',t=>{
 const bundled=require('../app/quotes-data.js');
 const dir=fs.mkdtempSync(path.join(__dirname,'gumshelf-quotes-'));
 t.after(()=>{assert.ok(path.resolve(dir).startsWith(__dirname+path.sep));fs.rmSync(dir,{recursive:true,force:true});});
 const original=bundled.quotes.filter(q=>q.bookId!=='short-and-sharp');
 const existing=new QuoteStore(dir,original);
 existing.upsert({...existing.doc.quotes[0],text:'My edited quote'});
 existing.remove(original[1].id);
 const reopened=new QuoteStore(dir,bundled.quotes);
 const short=reopened.doc.quotes.filter(q=>q.bookId==='short-and-sharp');
 assert.deepEqual(short.map(q=>q.id),Array.from({length:10},(_,i)=>'short-'+String(i+1).padStart(2,'0')));
 assert.deepEqual(short.map(({origin,...q})=>q),bundled.quotes.filter(q=>q.bookId==='short-and-sharp'));
 assert.ok(short.every(q=>q.theme==='Short'&&q.text.length<=90&&q.author));
 assert.deepEqual(bundled.books.find(b=>b.id==='short-and-sharp'),{id:'short-and-sharp',title:'Short & sharp',author:'Various',count:10});
 assert.equal(reopened.doc.quotes.find(q=>q.id===original[0].id).text,'My edited quote');
 assert.equal(reopened.doc.quotes.some(q=>q.id===original[1].id),false);
 reopened.remove('short-01');
 reopened.upsert({...short[1],text:'My edited short quote'});
 const restarted=new QuoteStore(dir,bundled.quotes);
 assert.equal(restarted.doc.quotes.some(q=>q.id==='short-01'),false);
 assert.equal(restarted.doc.quotes.find(q=>q.id==='short-02').text,'My edited short quote');
 assert.equal(restarted.doc.quotes.filter(q=>q.bookId==='short-and-sharp').length,9);
});
