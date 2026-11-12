const Catalog=require('../app/catalog.js');
const categories = [
 ['3D & materials', /blender|3d|shader|material|sculpt|zbrush|mesh|rigged|houdini/i, 'Build scenes, shade models, and speed up your 3D workflow.'],
 ['Motion & video', /after effects|premiere|motion|video|animation|lut\b|davinci|pinrig|dockit/i, 'Create motion graphics and streamline video production.'],
 ['Design & UI', /figma|ui kit|web design|website|wireframe|icon|mockup|typography|font|design system/i, 'Design interfaces, explore visual directions, and present your work.'],
 ['Art & brushes', /brush|procreate|texture|painting|illustration|wallpaper|poster/i, 'Add detail, texture, and new techniques to your artwork.'],
 ['Learning & books', /course|tutorial|book|guide|handbook|lesson|pdf|checklist/i, 'Learn a skill or keep a useful reference close at hand.'],
 ['Tools & templates', /template|plugin|notion|tool|script|preset|spreadsheet/i, 'Reduce repetitive work and start projects with a reusable foundation.']
];
function classify(name, description='') {
 const c=categories.find(c=>c[1].test(name+' '+description));
 return {category:c?.[0]||'Uncategorized', suggestedUse:c?.[2]||'Open the product description or use AI Review to explore possible uses.', analysisSource:'Local keyword suggestion'};
}
function safeUrl(value, kind='any') {
 try { const u=new URL(value); if(u.protocol!=='https:'||u.username||u.password) return '';
 const h=u.hostname.toLowerCase(); if((kind==='gumroad'||kind==='public')&& !(h==='gumroad.com'||h.endsWith('.gumroad.com')))return '';
 if(kind==='image'&& !['gumroad.com','gumroadusercontent.com','gumroad-attachments.com','cloudfront.net'].some(d=>h===d||h.endsWith('.'+d)))return '';
 if(kind==='public'&&!/^\/l\/[^/]+/.test(u.pathname))return '';
 if(kind==='public') {u.search='';u.hash='';} return u.href;
 } catch{return ''}
}
function normalizeResult(row, archived, order) {
 const p=row.product, purchase=row.purchase;
 if(!p||!purchase||typeof purchase.id!=='string'||typeof p.name!=='string')throw Error('Gumroad returned an unexpected library item.');
 return {id:purchase.id, name:p.name+(purchase.variants?' — '+purchase.variants:''), creator:p.creator?.name||'Unknown creator', creatorUrl:safeUrl(p.creator?.profile_url,'gumroad'), sourceUrl:safeUrl(purchase.download_url,'gumroad'), publicUrl:'', thumbnailUrl:safeUrl(p.thumbnail_url,'image'), images:[], description:'', archived:!!purchase.is_archived||archived, purchaseOrder:order, format:String(p.native_type||'Digital product'), ...classify(p.name), detailState:'pending', seenAt:new Date().toISOString()};
}
function mergeProducts(existing,incoming) {
 const map=new Map(existing.map(p=>[p.id,p]));
 for(const p of incoming) {const old=map.get(p.id); map.set(p.id,old?{...old,...p, description:p.description||old.description, publicUrl:p.publicUrl||old.publicUrl, images:p.images?.length?p.images:old.images||[], thumbnail:p.thumbnail||old.thumbnail, category:old.category, suggestedUse:old.suggestedUse,analysisSource:old.analysisSource, saved:!!old.saved,hidden:!!old.hidden,reviewed:!!old.reviewed,notes:old.notes||'',detailState:old.detailState==='complete'?'complete':p.detailState}:p);}
 return [...map.values()];
}
function redactForExport(value) {
 // Defense in depth for public text; old purchase-page descriptions are excluded entirely.
 const lines=String(value||'').replace(/\r/g,'').split('\n');
 const sensitive=/(?:licen[cs]e|access|activation|registration|verification|authentication|pairing|recovery|secret|api)[ _-]*(?:key|code|token)|password|passcode|purchase[_ -]?id|email[_ -]?digest/i;
 const out=[];let skipNext=false;
 for(const line of lines){if(sensitive.test(line)){skipNext=true;continue;}if(skipNext&&line.trim()){skipNext=false;continue;}out.push(line);}
 return out.join('\n').replace(/\b[A-Z0-9]{8}(?:-[A-Z0-9]{4,}){2,}\b/gi,'[private code removed]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email removed]').replace(/https?:\/\/[^\s<>]+/gi,'[link removed]').replace(/\b(?:gumroad\.com|[\w.-]+\.gumroad\.com)\/[^\s<>]+/gi,'[link removed]').replace(/\n{3,}/g,'\n\n').trim().slice(0,6000);
}
function aiPayload(products) {return products.filter(p=>!p.hidden).map(p=>{
 const verified=p.extractionVersion>=2&&p.descriptionSource==='public-product'&&!!safeUrl(p.publicUrl,'public');
 return {id:p.id,title:redactForExport(p.name),creator:redactForExport(p.creator),description:verified?redactForExport(p.description):'',descriptionSource:verified?'Public product page':'Missing or unverified; purchase-page text excluded',category:redactForExport(p.category),resourceTypeSuggestion:Catalog.byId(Catalog.infer(p).type).label,softwareTitleMentions:Catalog.infer(p).software,url:safeUrl(p.publicUrl,'public')};
 });}
function validateReview(input, products) {
 if(typeof input==='string') input=JSON.parse(input.replace(/^\s*```(?:json)?\s*/,'').replace(/\s*```\s*$/,''));
 if(!input||input.version!==1||!Array.isArray(input.products)||input.products.length>10000)throw Error('Expected JSON with version: 1 and a products array.');
 const allowed=new Set(products.filter(p=>!p.hidden).map(p=>p.id)), ids=new Set();
 return input.products.map(r=>{if(!r||!allowed.has(r.id)||ids.has(r.id))throw Error('The answer contains a duplicate, hidden, or unknown product ID.');ids.add(r.id);
 for(const [k,max] of [['category',80],['summary',1800]])if(typeof r[k]!=='string'||!r[k].trim()||r[k].length>max)throw Error('Each product needs a short category and summary.');
 if(!Array.isArray(r.uses)||r.uses.length>8||r.uses.some(x=>typeof x!=='string'||x.length>400))throw Error('Uses must be a list of up to eight short suggestions.');
 return {id:r.id,category:r.category.trim(),summary:r.summary.trim(),uses:r.uses};});
}
module.exports={redactForExport,categories,classify,safeUrl,normalizeResult,mergeProducts,aiPayload,validateReview};
