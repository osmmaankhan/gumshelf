const {safeUrl,normalizeResult,classify,mergeProducts}=require('./core.cjs');
const {recoveryFor}=require('./scan-errors.cjs');
const {productQuality,qualityCounts,canResume}=require('./quality.cjs');
const path=require('node:path');const fs=require('node:fs');const crypto=require('node:crypto');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
class Scanner {
 constructor({dir,getState,save,emit,notify,recordRun=()=>{},wait=sleep}) {Object.assign(this,{dir,getState,save,emit,notify,recordRun,wait});this.context=null;this.running=false;this.paused=false;this.cancelled=false;this.imageRequests=new Map();this.lastSave=0;this.lastEmit=0;}
 clock(){const s=this.getState().scan;const now=Date.now();if(s.activeSince)s.elapsedMs=(s.elapsedMs||0)+Math.max(0,now-s.activeSince);s.activeSince=this.running&&!this.paused?now:null;}
 status(patch,force=true){const s=this.getState();Object.assign(s.scan,patch);this.clock();const now=Date.now();if(force||now-this.lastSave>=1000){this.save();this.lastSave=now;}if(force||now-this.lastEmit>=500){this.emit(s.scan);this.lastEmit=now;}}
 async connect(){throw Error('Connect with the browser helper.');}
 async checkpoint(){if(this.cancelled)throw Error('SCAN_CANCELLED');while(this.paused){await this.wait(250);if(this.cancelled)throw Error('SCAN_CANCELLED');}}
 async library(){throw Error('Browser helper required.');}
 cachedImage(url){url=safeUrl(url,'image');if(!url)return '';const key=crypto.createHash('sha256').update(url).digest('hex');return fs.existsSync(path.join(this.dir,'images',key))?'gumasset://image/'+key:'';}
 async cacheImage(url){url=safeUrl(url,'image');if(!url)return '';if(this.imageRequests.has(url))return this.imageRequests.get(url);const request=this.downloadImage(url);this.imageRequests.set(url,request);try{return await request;}finally{this.imageRequests.delete(url);}}
 getConcurrency(){return 2;}
 async beforeDetail(){}
 async downloadImage(url){url=safeUrl(url,'image');if(!url)return '';try{
  const key=crypto.createHash('sha256').update(url).digest('hex');const target=path.join(this.dir,'images',key);if(fs.existsSync(target))return 'gumasset://image/'+key;
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),20000);
  try{const response=await fetch(url,{signal:controller.signal,redirect:'error'});if(!response.ok||!/^image\/(png|jpeg|webp|gif|avif)/i.test(response.headers.get('content-type')||''))return '';
   if(Number(response.headers.get('content-length'))>6*1024*1024)return '';const chunks=[];let length=0;for await(const chunk of response.body){length+=chunk.length;if(length>6*1024*1024){controller.abort();return '';}chunks.push(chunk);}if(!length)return '';fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,Buffer.concat(chunks));
  }finally{clearTimeout(timer);}return 'gumasset://image/'+key;
 }catch{return '';}}
 async details(){throw Error('Browser helper required.');}
 async start({resume=false,maxPages=0,refreshDetails=false,mode='full',ids=[]}={}) {
  if(this.running)throw Error('A scan is already running.');if(!this.context)throw Error('Connect the browser helper first.');
  const s=this.getState();this.running=true;this.paused=false;this.cancelled=false;let page;
  const continuing=resume&&canResume(s.scan);
  if(!continuing){if(s.scan?.startedAt)s.previousScan=structuredClone(s.scan);s.scan={id:crypto.randomUUID(),status:'running',phase:['full','library'].includes(mode)?'library':'details',mode,discovered:['full','library'].includes(mode)?0:s.products.length,processed:0,errors:[],cursor:['full','library'].includes(mode)?{partition:0,page:1}:null,seenIds:['full','library'].includes(mode)?[]:s.products.map(p=>p.id),expected:['full','library'].includes(mode)?0:s.products.length,startedAt:new Date().toISOString(),limitedTest:maxPages>0,elapsedMs:0,libraryComplete:!['full','library'].includes(mode)};}
  if(continuing){mode=s.scan.mode||mode;if(s.scan.phase==='details')ids=s.scan.targetIds||ids;}
  s.scan.activeSince=Date.now();delete s.scan.recovery;
  this.status({status:'running',message:mode==='sample'?'Checking a small product sample…':'Finding your products…'});
  try {
   page=await this.context.newPage();let pagesRead=0;
   if(s.scan.phase==='library')for(let partition=s.scan.cursor.partition;partition<2;partition++){
    let pn=s.scan.cursor.partition===partition?s.scan.cursor.page:1;
    const partitionIds=new Set(s.scan['partitionIds'+partition]||[]);
    while(true){await this.checkpoint();const data=await this.library(page,partition===1,pn);const pag=data.pagination;
     if(!Number.isInteger(pag.pages)||!Number.isInteger(pag.count)||pag.count<0||pag.page!==pn&&pag.count>0)throw Error('Pagination changed unexpectedly. Your imported products are saved.');
     if(pn===1){s.scan['expected'+partition]=pag.count;s.scan.expected=(s.scan.expected0||0)+(s.scan.expected1||0);}
     const incoming=data.results.map((r,i)=>normalizeResult(r,partition===1,(pn-1)*15+i));
     if(incoming.length&&incoming.every(p=>partitionIds.has(p.id)))throw Error('Gumroad repeated a library page. Please start a new scan.');
     for(const p of incoming){partitionIds.add(p.id);s.scan.seenIds.push(p.id);p.thumbnail=this.cachedImage(p.thumbnailUrl);}
     s.products=mergeProducts(s.products,incoming);s.scan.seenIds=[...new Set(s.scan.seenIds)];s.scan['partitionIds'+partition]=[...partitionIds];s.scan.discovered=s.scan.seenIds.length;
     const isLast=pn>=pag.pages||pag.count===0;if(isLast&&partitionIds.size!==pag.count)throw Error('Library count mismatch. Start a new scan to check it; your imported products are saved.');
     this.status({message:'Reading '+(partition?'archived':'library')+' page '+pn+' of '+Math.max(1,pag.pages),cursor:isLast?{partition:partition+1,page:1}:{partition,page:pn+1}});pagesRead++;
     if(maxPages&&pagesRead>=maxPages){this.status({status:'partial',message:'Small library test finished. Continue to collect the remaining pages.'});return;}
     if(isLast)break;pn++;await this.wait(1200);
    }
   }
   const wasLibrary=s.scan.phase==='library';s.scan.phase='details';s.scan.cursor={phase:'details'};s.scan.libraryComplete=true;if(!continuing)s.scan.errors=[];
   const seen=new Set(s.scan.seenIds);if(wasLibrary){for(const p of s.products)p.inLatestScan=seen.has(p.id);s.lastLibrarySync=new Date().toISOString();}
   let list=s.products.filter(p=>seen.has(p.id));
   if(mode==='library'){
    s.lastScan=new Date().toISOString();this.status({status:'draft',phase:'done',cursor:null,quality:qualityCounts(list),message:'Library list updated. Existing artwork is kept; add descriptions and galleries with Enrich missing products.',finishedAt:s.lastScan});this.notify('GumShelf','Your library list is ready. Add product details when you want.');return;
   }
   if(mode==='sample')list=list.filter(p=>ids.includes(p.id)).slice(0,20);
   else if(mode==='retry')list=list.filter(p=>!productQuality(p).complete||continuing&&(s.scan.targetIds||[]).includes(p.id));
   if(continuing&&s.scan.targetIds?.length){const targets=new Set(s.scan.targetIds);list=list.filter(p=>targets.has(p.id));}
   s.scan.targetIds=list.map(p=>p.id);s.scan.targetCount=list.length;if(wasLibrary||s.scan.detailStartedElapsed===undefined)s.scan.detailStartedElapsed=s.scan.elapsedMs||0;
   const completed=new Set(continuing?s.scan.completedIds||[]:[]);let processed=completed.size,next=0;
   s.scan.completedIds=[...completed];s.scan.processed=processed;s.scan.parallelism=this.getConcurrency();this.save();
   let fatal=null,slowed=false;const poolSize=Math.max(1,Math.min(2,s.scan.parallelism));
   const runSlot=async slot=>{
    try{while(true){await this.checkpoint();if(fatal||slowed&&slot>0)return;const p=list[next++];if(!p)return;if(completed.has(p.id))continue;await this.beforeDetail();
     if(refreshDetails||mode==='sample'||!productQuality(p).complete){
      this.status({message:'Checking products · '+processed+' of '+list.length+' finished',processed},false);
      try{const d=await this.details(page,p,slot);Object.assign(p,d);if(p.analysisSource==='Local keyword suggestion')Object.assign(p,classify(p.name,p.descriptionSource==='public-product'?p.description:''));}
      catch(e){if(e.message==='SCAN_CANCELLED'||this.cancelled||recoveryFor(e))throw e;p.detailState='failed';p.detailIssue=String(e.message).slice(0,250);s.scan.errors.push({id:p.id,name:p.name,message:p.detailIssue});slowed=true;s.scan.parallelism=1;await this.wait(3000);}
     }
     this.clock();completed.add(p.id);processed=completed.size;s.scan.completedIds=[...completed];
     this.status({processed,quality:qualityCounts(list),etaMs:processed>=4&&processed<list.length?Math.round(Math.max(0,s.scan.elapsedMs-(s.scan.detailStartedElapsed||0))/processed*(list.length-processed)):null},false);
    }}catch(e){fatal=fatal||e;}
   };
   await Promise.all(Array.from({length:poolSize},(_,slot)=>runSlot(slot)));if(!fatal&&next<list.length)await runSlot(0);if(fatal)throw fatal;
   const quality=qualityCounts(list);const partial=quality.missing>0;
   if(mode==='full'&&!partial)s.lastSuccessfulSync=new Date().toISOString();s.lastScan=new Date().toISOString();
   this.status({status:partial?'partial':'complete',phase:'done',cursor:null,quality,message:mode==='sample'?'Sample finished: '+(list.length-quality.missing)+' of '+list.length+' products have verified descriptions and previews.':partial?'Library saved. '+quality.missing+' products still have missing information.':'Your library is ready.',etaMs:null,finishedAt:new Date().toISOString()});
   this.notify('GumShelf',mode==='sample'?'Your product sample is ready to inspect.':partial?'Library saved with missing information.':'Your Gumroad library is ready.');
  }catch(e){const stopped=e.message==='SCAN_CANCELLED'||this.cancelled;const recovery=stopped?null:recoveryFor(e);this.status({status:stopped?'cancelled':'error',recovery,message:stopped?'Scan stopped. Your imported products are saved.':recovery?recovery.message:String(e.message).slice(0,350),etaMs:null});}

  finally{this.clock();this.running=false;this.paused=false;s.scan.activeSince=null;s.scan.endedAt=new Date().toISOString();this.recordRun(s.scan);this.save();if(page&&!page.isClosed())await page.close().catch(()=>{});this.emit(this.getState().scan);}
 }
 pause(){this.clock();this.paused=!this.paused;this.getState().scan.activeSince=this.paused?null:Date.now();this.status({status:this.paused?'paused':'running'});}
 cancel(){this.cancelled=true;}
 async disconnect(){this.cancelled=true;if(this.context)await this.context.close();this.context=null;}
}
function chooseSample(products,count=12){const list=products.filter(p=>!p.hidden);const selected=[],groups=new Set();for(const p of list){if(!groups.has(p.category)){groups.add(p.category);selected.push(p);if(selected.length>=count)return selected.map(p=>p.id);}}const creators=new Set(selected.map(p=>p.creator));for(const p of list){if(!selected.includes(p)&&!creators.has(p.creator)){selected.push(p);creators.add(p.creator);if(selected.length>=count)return selected.map(p=>p.id);}}for(const p of list){if(!selected.includes(p))selected.push(p);if(selected.length>=count)break;}return selected.map(p=>p.id);}
function chooseTargets(products,ids){
 if(!Array.isArray(ids)||!ids.length||ids.length>12||ids.some(id=>typeof id!=='string'))throw Error('Choose between 1 and 12 products.');
 const unique=[...new Set(ids)];
 if(unique.some(id=>!products.some(p=>p.id===id&&!p.hidden)))throw Error('Choose products from your visible library.');
 return unique;
}
module.exports={Scanner,chooseSample,chooseTargets};
