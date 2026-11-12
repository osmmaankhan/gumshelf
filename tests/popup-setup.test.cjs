
const test=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');const code=fs.readFileSync(path.join(__dirname,'../extension/popup.js'),'utf8');
test('opening popup.html as a file shows installation guidance without calling extension APIs',()=>{const body={innerHTML:''};const document={body,querySelector:()=>{throw Error('Pairing form must not be used in file context');}};vm.runInNewContext(code,{document,location:{protocol:'file:'}});assert.match(body.innerHTML,/Load unpacked/);assert.match(body.innerHTML,/browser-helper/);assert.match(body.innerHTML,/puzzle-piece/);assert.doesNotMatch(body.innerHTML,/sendMessage|undefined/);});
test('a missing Gumroad tab disables pairing and explains the next step',async()=>{const nodes={};const node=s=>nodes[s]??=( {textContent:'',value:'',hidden:false,disabled:false,replaceChildren(){},append(){},addEventListener(){}});const chrome={runtime:{id:'a'.repeat(32),sendMessage:async()=>({ok:true})},tabs:{query:async()=>[]},storage:{local:{get:async()=>({})},onChanged:{addListener(){}}}};vm.runInNewContext(code,{document:{querySelector:node},location:{protocol:'chrome-extension:'},chrome});await new Promise(r=>setImmediate(r));assert.equal(node('#pair').disabled,true);assert.match(node('#status').textContent,/Open gumroad.com\/library/);});
test('invalid pairing codes are explained before sending any pairing request',async()=>{const nodes={};const node=s=>nodes[s]??=({textContent:'',value:'',hidden:false,disabled:false,replaceChildren(){},append(){},addEventListener(){}});const sent=[];const chrome={runtime:{id:'a'.repeat(32),sendMessage:async m=>{sent.push(m);return {ok:true};}},tabs:{query:async()=>[{id:7,title:'Library',windowId:1}]},storage:{local:{get:async()=>({})},onChanged:{addListener(){}}}};vm.runInNewContext(code,{document:{querySelector:node,createElement:()=>({})},location:{protocol:'chrome-extension:'},chrome});await new Promise(r=>setImmediate(r));node('#code').value='abc';await node('#pair').onclick();assert.equal(sent.filter(m=>m.type==='pair').length,0);assert.match(node('#status').textContent,/8-digit/);});

test('saved connection hides first-time pairing and offers the selected Library',async()=>{const nodes={};const node=s=>nodes[s]??=({textContent:'',value:'',hidden:false,disabled:false,replaceChildren(){},append(){},addEventListener(){}});const chrome={runtime:{id:'a'.repeat(32),sendMessage:async()=>({ok:true})},tabs:{query:async()=>[{id:7,title:'Library',windowId:1}]},storage:{local:{get:async()=>({token:'saved'})},onChanged:{addListener(){}}}};vm.runInNewContext(code,{document:{querySelector:node,createElement:()=>({})},location:{protocol:'chrome-extension:'},chrome});await new Promise(r=>setImmediate(r));assert.equal(node('#pair').hidden,true);assert.equal(node('#code').hidden,true);assert.equal(node('#reconnect').hidden,false);});

test('popup exposes all four connection statuses and offers re-pairing after expiry',async()=>{
 const nodes={};
 const node=s=>nodes[s]??=({textContent:'',value:'',hidden:false,disabled:false,replaceChildren(){},append(){},addEventListener(){}});
 let changed;
 const sent=[];
 const chrome={runtime:{id:'a'.repeat(32),sendMessage:async message=>{sent.push(message);return {ok:true};}},tabs:{query:async()=>[]},storage:{local:{get:async()=>({token:'saved'})},onChanged:{addListener:fn=>{changed=fn;}}}};
 vm.runInNewContext(code,{document:{querySelector:node},location:{protocol:'chrome-extension:'},chrome});
 await new Promise(resolve=>setImmediate(resolve));
 assert.ok(sent.some(message=>message.type==='wake'));
 for(const status of ['Connected','Not paired','App not running','Pairing expired']){
  changed({status:{newValue:status+'. More information.'}},'local');
  assert.equal(node('#connection-status').textContent,status);
 }
 await node('#repair').onclick();
 assert.equal(node('#code').hidden,false);
 assert.equal(node('#pair').hidden,false);
 assert.ok(sent.some(message=>message.type==='forget'));
});
