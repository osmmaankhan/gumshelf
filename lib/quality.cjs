const {safeUrl}=require('./core.cjs');
function productQuality(p){const verified=p.extractionVersion>=2&&p.descriptionSource==='public-product';const description=verified&&!!p.description?.trim();const previews=verified&&!!p.images?.length;const link=!!safeUrl(p.publicUrl,'public');return {description,previews,link,complete:!!(description&&previews&&link)};}
function qualityCounts(products){const out={total:products.length,descriptions:0,previews:0,links:0,missing:0,failures:0};for(const p of products){const q=productQuality(p);out.descriptions+=+q.description;out.previews+=+q.previews;out.links+=+q.link;out.missing+=+!q.complete;out.failures+=+(p.detailState==='failed');}return out;}
function canResume(scan){return !!scan?.cursor&&!scan.finishedAt&&scan.status!=='complete';}
function migrateLibrary(state){if(state.extractionSchema===2)return false;
 const frequency=new Map();for(const p of state.products)for(const img of new Set(p.images||[]))frequency.set(img,(frequency.get(img)||0)+1);
 const generic=new Set([...frequency].filter(([,count])=>count>=20&&count>state.products.length/2).map(([img])=>img));
 for(const p of state.products){if(p.extractionVersion>=2)continue;p.images=(p.images||[]).filter(img=>!generic.has(img));p.descriptionSource='legacy-download';p.detailState='limited';}
 if(state.scan?.finishedAt){state.scan.cursor=null;state.scan.libraryComplete=state.scan.expected>0&&state.scan.discovered===state.scan.expected;}
 state.extractionSchema=2;return true;
}
module.exports={productQuality,qualityCounts,canResume,migrateLibrary};
