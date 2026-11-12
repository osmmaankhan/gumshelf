importScripts('extractor.js');
const base='http://127.0.0.1:43187';let polling=false,scanTabs=[null,null];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function allowed(url){try{const u=new URL(url);return u.protocol==='https:'&&(u.hostname==='gumroad.com'||u.hostname.endsWith('.gumroad.com'));}catch{return false;}}
async function call(route,token,body){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);try{const r=await fetch(base+route,{signal:controller.signal,method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{'X-GumShelf-Token':token}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok){const error=Error(data.error||'Open GumShelf to connect.');error.status=r.status;throw error;}return data;}catch(e){if(e.name==='AbortError'||e instanceof TypeError)throw Error('Open the GumShelf desktop app, then try connecting again.');throw e;}finally{clearTimeout(timer);}}
// strict: the page must stay on Gumroad (library pages). Product pages may redirect to a creator's own site; that only limits that one product.
async function waitReady(id,strict=true){for(let i=0;i<90;i++){const tab=await chrome.tabs.get(id);if(tab.status==='complete'){if(!allowed(tab.url)){if(strict)throw Error('Finish signing in on your normal Gumroad tab, then retry the scan.');return false;}return true;}await sleep(500);}throw Error('Gumroad took too long to load. Resume the scan when the browser is ready.');}
const unavailable=()=>({publicUrl:'',description:'',images:[],source:'unavailable',extractionVersion:2});
function hex(bytes){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');}
// Ask the server on the bridge port to prove it holds our pairing token before sending the token or running its jobs.
async function verifyServer(token){const nonce=hex(crypto.getRandomValues(new Uint8Array(32)));const {proof}=await call('/hello',null,{nonce});const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(token),{name:'HMAC',hash:'SHA-256'},false,['sign']);const expected=hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('gumshelf-bridge:'+nonce)));if(typeof proof!=='string'||proof.length!==expected.length||proof!==expected)throw Error('Another program is answering for GumShelf on this PC. Close it, open GumShelf, then reconnect.');}
async function page(url,slot=0,strict=true){if(!allowed(url))throw Error('Only Gumroad pages can be scanned.');if(slot!==0&&slot!==1)throw Error('Invalid scan slot.');let scanTab=scanTabs[slot];if(scanTab){try{await chrome.tabs.get(scanTab);}catch{scanTab=null;scanTabs[slot]=null;}}
 if(!scanTab){const {selectedTab}=await chrome.storage.local.get('selectedTab');let selected;try{selected=await chrome.tabs.get(selectedTab);}catch{}if(!selected||!allowed(selected.url)){const tabs=await chrome.tabs.query({url:['https://gumroad.com/library*','https://*.gumroad.com/library*']});if(tabs.length!==1)throw Error('Choose your signed-in Gumroad Library tab in the helper.');selected=tabs[0];await chrome.storage.local.set({selectedTab:selected.id});}scanTab=(await chrome.tabs.create({url,windowId:selected.windowId,active:false})).id;scanTabs[slot]=scanTab;}else await chrome.tabs.update(scanTab,{url});return {id:scanTab,ok:await waitReady(scanTab,strict)};}
async function execute(job){if(!['library','details','finish'].includes(job.kind))throw Error('Unsupported task.');if(job.kind==='finish'){for(const tab of scanTabs){if(tab)await chrome.tabs.remove(tab).catch(()=>{});}scanTabs=[null,null];return {ok:true};}
 const {id,ok}=await page(job.url,job.slot===1?1:0,job.kind==='library');
 if(!ok)return unavailable();
 const read=async mode=>{const [out]=await chrome.scripting.executeScript({target:{tabId:id},args:[mode],func:readGumroadPage});if(!out?.result)throw Error('Gumroad page information is unavailable.');return out.result;};
 if(job.kind==='library')return read('library');
 const located=await read('locate');
 if(!located.publicUrl)return unavailable();
 if(located.publicUrl!==job.url){await chrome.tabs.update(id,{url:located.publicUrl});if(!await waitReady(id,false))return unavailable();}
 return read('product');
}
async function poll(){if(polling)return;polling=true;let verified='';try{while(true){const {token,selectedTab}=await chrome.storage.local.get(['token','selectedTab']);if(!token||!selectedTab)break;let busy=false;try{if(verified!==token){await verifyServer(token);verified=token;}const {jobs}=await call('/jobs',token,{protocolVersion:3,slots:2});await chrome.storage.local.set({status:'Connected to GumShelf · up to 2 background tabs',lastContact:Date.now()});busy=jobs.length>0;
 const heartbeat=busy?setInterval(()=>call('/connection',token,{}).catch(()=>{}),10000):null;
 try{await Promise.all(jobs.map(async job=>{try{const result=await execute(job);await call('/result',token,{id:job.id,result});}catch(e){await call('/result',token,{id:job.id,error:e.message}).catch(()=>{});}}));}finally{if(heartbeat)clearInterval(heartbeat);}
 }catch(e){await chrome.storage.local.set({status:e.message});if(e.status===401)await chrome.storage.local.remove('token');break;}await sleep(busy?100:750);}}finally{polling=false;}}
async function connect(message){
 const {token}=await chrome.storage.local.get('token');
 if(token){try{await verifyServer(token);await call('/connection',token,{});await chrome.storage.local.set({selectedTab:message.tab,status:'Connected to GumShelf'});poll();return {ok:true};}catch(e){if(e.status!==401)throw e;await chrome.storage.local.remove('token');}}
 if(message.type==='reconnect')return {error:'This connection has expired. Enter the pairing code shown in GumShelf.',needsPair:true};
 const r=await call('/pair',null,{code:message.code,label:'Browser profile · Gumroad'});await chrome.storage.local.set({token:r.token,selectedTab:message.tab,status:'Connected to GumShelf'});poll();return {ok:true};
}
chrome.runtime.onMessage.addListener((m,_sender,reply)=>{if(m.type==='pair'||m.type==='reconnect'){connect(m).then(reply).catch(e=>reply({error:e.message}));return true;}if(m.type==='wake'){poll();reply({ok:true});}});
chrome.alarms.create('gumshelf-connection',{periodInMinutes:.5});chrome.alarms.onAlarm.addListener(()=>poll());chrome.runtime.onStartup.addListener(()=>poll());poll();
