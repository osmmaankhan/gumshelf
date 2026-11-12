const http=require('node:http');const crypto=require('node:crypto');
const fs=require('node:fs');const path=require('node:path');
class BrowserBridge {
 constructor(dir,changed=()=>{}){this.dir=dir;this.changed=changed;this.pending=[];this.inflight=new Map();this.lastSeen=0;this.slots=1;this.protocolVersion=0;this.label='';this.code=crypto.randomInt(10000000,100000000).toString();this.failures=[];this.auth=null;try{this.auth=JSON.parse(fs.readFileSync(path.join(dir,'browser-pair.json'),'utf8'));}catch{}}
 get connected(){return !!this.auth&&Date.now()-this.lastSeen<45000;}
 get info(){return {connected:this.connected,paired:!!this.auth,pairingCode:this.code,browserLabel:this.label,slots:this.slots,protocolVersion:this.protocolVersion,extensionPath:this.extensionPath||path.join(__dirname,'..','extension')};}
 async start(port=43187){this.port=port;this.server=http.createServer((req,res)=>this.handle(req,res).catch(()=>{if(!res.headersSent){res.writeHead(400);res.end('{"error":"Invalid request"}');}}));await new Promise((resolve,reject)=>this.server.once('error',reject).listen(port,'127.0.0.1',resolve));this.port=this.server.address().port;}
 async body(req){const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>8*1024*1024)throw Error('Request too large');chunks.push(c);}const s=Buffer.concat(chunks).toString('utf8');if(s.length>2*1024*1024)throw Error('Request too large');return JSON.parse(s||'{}');}
 proof(nonce){return crypto.createHmac('sha256',this.auth.token).update('gumshelf-bridge:'+nonce).digest('hex');}
 send(res,status,body){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));}
 originOK(origin){return /^chrome-extension:\/\/[a-p]{32}$/.test(origin||'');}
 async handle(req,res){const origin=req.headers.origin;if(req.headers.host!=='127.0.0.1:'+this.port||!this.originOK(origin)){this.send(res,403,{error:'Use the GumShelf browser helper.'});return;}
  res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type, X-GumShelf-Token');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  if(req.url==='/pair'&&req.method==='POST'){
   this.failures=this.failures.filter(t=>Date.now()-t<60000);if(this.failures.length>=5){this.send(res,429,{error:'Wait a minute before trying again.'});return;}
   const b=await this.body(req);if(this.connected||b.code!==this.code){this.failures.push(Date.now());this.send(res,403,{error:'Check the pairing code in GumShelf. Disconnect the current helper before pairing another.'});return;}
   this.auth={origin,token:crypto.randomBytes(32).toString('hex')};fs.writeFileSync(path.join(this.dir,'browser-pair.json'),JSON.stringify(this.auth));this.code=crypto.randomInt(10000000,100000000).toString();this.lastSeen=Date.now();this.label=String(b.label||'Your browser').slice(0,100);this.changed();this.wasConnected=true;this.send(res,200,{token:this.auth.token});return;
  }
  // The helper asks GumShelf to prove it holds the pairing token before it sends the token or accepts jobs.
  if(req.url==='/hello'&&req.method==='POST'){const b=await this.body(req);if(typeof b.nonce!=='string'||!/^[a-f0-9]{32,128}$/.test(b.nonce)||!this.auth||origin!==this.auth.origin){this.send(res,401,{error:'Pair this browser with GumShelf.'});return;}this.send(res,200,{proof:this.proof(b.nonce)});return;}
  const supplied=req.headers['x-gumshelf-token'];if(!this.auth||origin!==this.auth.origin||typeof supplied!=='string'||!/^[a-f0-9]{64}$/.test(supplied)||!crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(this.auth.token))){this.send(res,401,{error:'Pair this browser with GumShelf.'});return;}
  const reconnecting=!this.connected;this.lastSeen=Date.now();if(reconnecting)this.changed();
  if(req.url==='/connection'&&req.method==='POST'){await this.body(req);this.send(res,200,{ok:true});return;}
  if(req.url==='/jobs'&&(req.method==='GET'||req.method==='POST')){if(req.method==='POST'){const capabilities=await this.body(req);const previous=this.slots;this.protocolVersion=Number(capabilities.protocolVersion)||0;this.slots=this.protocolVersion>=3&&capabilities.slots===2?2:1;if(previous!==this.slots)this.changed();}const jobs=this.pending.splice(0,this.slots);for(const j of jobs)this.inflight.get(j.id).delivered=true;this.send(res,200,{jobs});return;}
  if(req.url==='/result'&&req.method==='POST'){const b=await this.body(req);const task=this.inflight.get(b.id);if(!task){this.send(res,409,{error:'Task expired'});return;}clearTimeout(task.timer);this.inflight.delete(b.id);if(b.error)task.reject(Error(String(b.error).slice(0,350)));else task.resolve(b.result);this.send(res,200,{ok:true});return;}
  this.send(res,404,{error:'Not found'});
 }
 run(kind,url,name='',options={}){if(!this.connected)return Promise.reject(Error('Open the browser helper and connect it to GumShelf.'));const id=crypto.randomUUID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending=this.pending.filter(j=>j.id!==id);this.inflight.delete(id);reject(Error('The browser did not respond. Open the helper and reconnect, then resume the scan.'));},kind==='details'?150000:90000);this.inflight.set(id,{resolve,reject,timer});this.pending.push({id,kind,url,name,slot:options.slot===1?1:0});});}
 disconnect(){this.auth=null;this.lastSeen=0;this.label='';this.code=crypto.randomInt(10000000,100000000).toString();fs.writeFileSync(path.join(this.dir,'browser-pair.json'),'null');for(const p of this.inflight.values()){clearTimeout(p.timer);p.reject(Error('Browser disconnected.'));}this.inflight.clear();this.pending=[];this.changed();}
 close(){this.server?.close();}
}
module.exports={BrowserBridge};
