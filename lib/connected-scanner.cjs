const {Scanner}=require('./scanner.cjs');const {safeUrl,redactForExport}=require('./core.cjs');const {productQuality}=require('./quality.cjs');
const Creators=require('../app/creators.js');
class ConnectedScanner extends Scanner {
 constructor(options,bridge){super(options);this.bridge=bridge;this.context={newPage:async()=>({isClosed:()=>false,close:async()=>{}})};}
 async connect(){return this.bridge.info;}
 async library(_page,archived,pageNum){await this.checkpoint();const url=new URL('https://gumroad.com/library');url.searchParams.set('sort','purchase_date');url.searchParams.set('page',pageNum);if(archived)url.searchParams.set('show_archived_only','true');const r=await this.bridge.run('library',url.href);if(!Array.isArray(r?.results)||!r.pagination||r.results.length>100)throw Error('The browser returned an unsupported library format.');return r;}
 getConcurrency(){return Math.min(this.getState().settings?.scanTabs===1?1:2,this.bridge.info?.slots||1);}
 async beforeDetail(){if(!this.bridge.connected)throw Error('Browser disconnected. Reopen the helper, then continue this scan.');}
 async details(_page,p,slot=0){await this.checkpoint();const url=safeUrl(p.publicUrl,'public')||safeUrl(p.sourceUrl,'gumroad');if(!url)throw Error('No accessible Gumroad page is available.');const d=await this.bridge.run('details',url,p.name,{slot});
 if(typeof d?.description!=='string'||!Array.isArray(d.images)||d.extractionVersion!==2)throw Error('Reload GumShelf Browser Helper in Chrome Extensions, then retry this sample.');
 const publicUrl=safeUrl(d.publicUrl,'public');
 if(d.source!=='public-product'||!publicUrl)return {detailState:'limited',detailIssue:'The public product page is unavailable. Your existing artwork is preserved.',lastDetailAttempt:new Date().toISOString()};
 const candidates=[...new Set(d.images)].slice(0,24),images=[];for(let index=0;index<candidates.length;index+=2){await this.checkpoint();const batch=await Promise.all(candidates.slice(index,index+2).map(u=>this.cacheImage(u)));images.push(...batch.filter(Boolean));}
 const verifiedOld=p.extractionVersion>=2&&p.descriptionSource==='public-product';
 const result={thumbnail:p.thumbnail||images[0]||await this.cacheImage(p.thumbnailUrl),description:redactForExport(d.description).slice(0,18000)|| (verifiedOld?p.description:''),descriptionSource:'public-product',publicUrl,images:images.length?images:verifiedOld?p.images||[]:[],extractionVersion:2,lastDetailAttempt:new Date().toISOString()};
 const avatarUrl=safeUrl(d.creatorAvatarUrl,'image');
 if(avatarUrl&&Creators.profile(p.creatorUrl)&&Creators.profile(d.creatorProfileUrl)===Creators.profile(p.creatorUrl)){
  const image=await this.cacheImage(avatarUrl);if(image){result.creatorAvatar=image;result.creatorAvatarProfile=Creators.profile(p.creatorUrl);}
 }
 result.detailState=productQuality({...p,...result}).complete?'complete':'limited';result.detailIssue=result.detailState==='limited'?'Some public descriptions or preview images are unavailable.':'';return result;
 }
 async start(o){if(!this.bridge.connected)throw Error('Connect your browser helper first.');try{return await super.start(o);}finally{this.finishing=true;try{if(this.bridge.connected)await this.bridge.run('finish','https://gumroad.com/library');}catch{}finally{this.finishing=false;this.emit();}}}
 async disconnect(){this.cancelled=true;this.bridge.disconnect();}
}
module.exports={ConnectedScanner};
