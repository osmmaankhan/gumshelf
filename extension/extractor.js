// Only named product fields leave this isolated page reader. Never return purchase content.
function readGumroadPage(mode) {
 const cleanPublic=value=>{if(typeof value!=='string'||!value.trim())return '';try{const u=new URL(value,location.href);if(u.protocol!=='https:'||u.username||u.password||!(u.hostname==='gumroad.com'||u.hostname.endsWith('.gumroad.com'))||!/^\/l\/[^/]+\/?$/.test(u.pathname))return '';u.search='';u.hash='';return u.href;}catch{return '';}};
 const cleanImage=value=>{if(typeof value!=='string'||!value.trim())return '';try{const u=new URL(value,location.href);if(u.protocol!=='https:'||u.username||u.password||!['gumroad.com','gumroadusercontent.com','gumroad-attachments.com','cloudfront.net'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h))||/gumroad[-_]?logo|opengraph|og[-_]?image|default[-_]?(cover|image)|\/assets\//i.test(u.pathname))return '';return u.href;}catch{return '';}};
 let props={};try{props=JSON.parse(document.querySelector('[data-page]')?.getAttribute('data-page')||'{}').props||{};}catch{}
 if(mode==='library'){
  if(!Array.isArray(props.results)||!props.pagination)throw Error('This is not a signed-in Gumroad Library page.');
  return {results:props.results.map(r=>({product:{name:r.product.name,creator:r.product.creator?{name:r.product.creator.name,profile_url:r.product.creator.profile_url}:null,thumbnail_url:r.product.thumbnail_url,native_type:r.product.native_type},purchase:{id:r.purchase.id,is_archived:r.purchase.is_archived,download_url:r.purchase.download_url,variants:r.purchase.variants}})),pagination:{page:props.pagination.page,pages:props.pagination.pages,count:props.pagination.count}};
 }
 if(mode==='locate'){
  // DownloadPage.LayoutProps.purchase.product_long_url is the storefront link.
  const publicUrl=cleanPublic(props.purchase?.product_long_url)||cleanPublic(props.product?.long_url)||cleanPublic(document.querySelector('link[rel="canonical"]')?.href)||cleanPublic(location.href);
  return {publicUrl};
 }
 // Never use .rich-text on a download page: it can contain keys and receipt content.
 if(!cleanPublic(location.href))return {publicUrl:'',description:'',images:[],source:'unavailable',extractionVersion:2};
 const product=props.product;
 if(!product||typeof product.name!=='string'||!('description_html' in product)||!Array.isArray(product.covers))return {publicUrl:cleanPublic(location.href),description:'',images:[],source:'unavailable',extractionVersion:2};
 const html=new DOMParser().parseFromString('<!doctype html><html><body>'+String(product.description_html||'').slice(0,200000)+'</body></html>','text/html');
 for(const el of html.querySelectorAll('script,style,iframe,form,input,button'))el.remove();
 for(const el of html.querySelectorAll('br'))el.replaceWith('\n');
 for(const el of html.querySelectorAll('p,div,li,h1,h2,h3,h4'))el.append('\n');
 const description=(html.body.textContent||'').replace(/\u00a0/g,' ').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim().slice(0,18000);
 const images=[];
 for(const cover of product.covers.slice(0,24)){
  const candidate=cover.type==='video'||cover.type==='embed'?cover.thumbnail:cover.url||cover.original_url;
  const image=cleanImage(candidate);if(image&&!images.includes(image))images.push(image);
 }
 // thumbnail_url is product-specific; generic site meta imagery is deliberately ignored.
 if(!images.length){const image=cleanImage(product.thumbnail_url);if(image)images.push(image);}
 // Seller fields belong to the verified storefront, never receipt or collaborator data.
 let creatorProfileUrl='';try{const u=new URL(product.seller?.profile_url);if(u.protocol==='https:'&&!u.username&&!u.password&&(u.hostname==='gumroad.com'||u.hostname.endsWith('.gumroad.com'))){u.search='';u.hash='';creatorProfileUrl=u.href;}}catch{}
 const creatorAvatarUrl=creatorProfileUrl?cleanImage(product.seller?.avatar_url):'';
 return {publicUrl:cleanPublic(location.href),description,images,source:'public-product',extractionVersion:2,creatorProfileUrl,creatorAvatarUrl};
}
if(typeof module!=='undefined')module.exports={readGumroadPage};
