(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./quotes-data.js'):root.GumQuoteData);if(typeof module==='object'&&module.exports)module.exports=api;else root.GumQuotes=api;})(globalThis,function(data){
 const shortQuotes=data.quotes.filter(q=>q.bookId==='short-and-sharp');
 let records=data.quotes,books=data.books,themes=[];
 function configure(items){records=items;const groups=new Map();for(const q of items){if(!groups.has(q.bookId))groups.set(q.bookId,{id:q.bookId,title:q.book,author:q.bookId==='short-and-sharp'?'Various':q.author,count:0});groups.get(q.bookId).count++;}books=[...groups.values()];themes=[...new Set(items.map(q=>q.theme).filter(Boolean))].sort();}
 configure(records);
 const source=settings=>settings.homeQuoteSource||((settings.homePhrases||[]).length?'custom':'books');
 function select(settings){const mode=source(settings);const bookIds=settings.homeQuoteBooks===undefined?books.map(b=>b.id):settings.homeQuoteBooks;const theme=settings.homeQuoteTheme||'';const result=[];
  if(mode==='books'||mode==='both')result.push(...records.filter(q=>bookIds.includes(q.bookId)&&(!theme||q.theme===theme)));
  if(mode==='custom'||mode==='both')result.push(...(settings.homePhrases||[]).filter(text=>typeof text==='string').map((text,index)=>({id:'custom-'+index,text,author:'',book:'',theme:'My phrases',context:'',page:'',chapter:''})));
  return result;
 }
 function home(settings){
  if(source(settings)==='off')return [];
  let items=select(settings).filter(q=>typeof q.text==='string'&&q.text.trim());
  if(!items.length){
   items=records.filter(q=>q.bookId==='short-and-sharp'&&typeof q.text==='string'&&q.text.trim());
   if(!items.length)items=shortQuotes;
  }
  const short=items.filter(q=>q.text.length<=90);
  return short.length?short:items;
 }
 function shuffle(items,random=Math.random){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
 function settingsPatch(value){const out={};if('homeQuoteSource'in value){if(!['books','custom','both','off'].includes(value.homeQuoteSource))throw Error('Choose a quote source.');out.homeQuoteSource=value.homeQuoteSource;}if('homeQuoteBooks'in value){if(!Array.isArray(value.homeQuoteBooks)||value.homeQuoteBooks.length>books.length||value.homeQuoteBooks.some(id=>!books.some(b=>b.id===id)))throw Error('Choose books from the quote collection.');out.homeQuoteBooks=[...new Set(value.homeQuoteBooks)];}if('homeQuoteTheme'in value){if(value.homeQuoteTheme!==''&&!themes.includes(value.homeQuoteTheme))throw Error('Choose an available quote theme.');out.homeQuoteTheme=value.homeQuoteTheme;}if('homeQuoteShuffle'in value){if(typeof value.homeQuoteShuffle!=='boolean')throw Error('Choose whether to shuffle quotes.');out.homeQuoteShuffle=value.homeQuoteShuffle;}return out;}
 const attribution=q=>q?[q.author,q.book,q.page].filter(Boolean).join(' • '):'';
 const shuffleEnabled=settings=>settings.homeQuoteShuffle===undefined?source(settings)!=='custom':settings.homeQuoteShuffle;
 return {get books(){return books;},get themes(){return themes;},get quotes(){return records;},configure,source,select,home,shuffle,shuffleEnabled,settingsPatch,attribution};
});
