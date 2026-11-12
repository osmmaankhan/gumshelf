
(() => {
 const $=s=>document.querySelector(s);
 const extension=globalThis.chrome;
 if(location.protocol!=='chrome-extension:'||!extension?.runtime?.id||!extension?.tabs){
  document.body.innerHTML='<h1>One setup step first.</h1><p>This helper works after Chrome or Edge loads it as an extension.</p><ol class="setup-list"><li>Open your browser’s <strong>Extensions → Manage extensions</strong> page.</li><li>Turn on <strong>Developer mode</strong>.</li><li>Click <strong>Load unpacked</strong> and select the whole <strong>browser-helper</strong> folder.</li><li>Open <strong>GumShelf Browser Helper</strong> from the puzzle-piece button in your browser toolbar.</li><li>Choose your signed-in Gumroad Library tab and enter the app’s pairing code.</li></ol><p class="help-note">Opening popup.html directly cannot connect to your browser. Your Gumroad sign-in can stay exactly as it is.</p>';
  return;
 }
 function pairedUI(paired){$('#pair').hidden=paired;$('#code').hidden=paired;document.querySelector('label[for="code"]').hidden=paired;$('#reconnect').hidden=!paired;$('#repair').hidden=!paired;}
 const status=message=>{
  $('#status').textContent=message;
  if(/^Connected/i.test(message))$('#connection-status').textContent='Connected';
  else if(/^App not running/i.test(message))$('#connection-status').textContent='App not running';
  else if(/Pairing expired|connection has expired/i.test(message))$('#connection-status').textContent='Pairing expired';
  else if(/^Not paired/i.test(message))$('#connection-status').textContent='Not paired';
 };
 async function tabs(){const open=await extension.tabs.query({url:['https://gumroad.com/library*','https://*.gumroad.com/library*']});$('#tabs').replaceChildren();for(const t of open){const o=document.createElement('option');o.value=t.id;o.textContent=(t.title||'Gumroad Library')+' · window '+t.windowId;$('#tabs').append(o);}$('#pair').disabled=!open.length;$('#reconnect').disabled=!open.length;if(!open.length)status('Open gumroad.com/library in this browser profile, then refresh this list.');return open.length;}
 async function send(message){try{return await extension.runtime.sendMessage(message);}catch{throw Error('The helper could not start. Open Manage extensions, reload GumShelf Browser Helper, then open it again.');}}
 async function pair(){if(!/^\d{8}$/.test($('#code').value.trim())){status('Enter the 8-digit code shown in the desktop app.');return;}$('#pair').disabled=true;status('Connecting to GumShelf on this PC…');try{const r=await send({type:'pair',code:$('#code').value.trim(),tab:Number($('#tabs').value)});status(r?.error||'Connected. Return to GumShelf and start your scan.');if(r?.needsPair)pairedUI(false);if(r?.ok){pairedUI(true);$('#code').value='';}}catch(e){status(e.message);}finally{$('#pair').disabled=false;}}
 $('#repair').onclick=async()=>{await send({type:'forget'});pairedUI(false);status('Not paired. Enter the pairing code shown in GumShelf.');};
 $('#pair').onclick=pair;$('#code').addEventListener('keydown',e=>{if(e.key==='Enter')pair();});
 $('#refresh-tabs').onclick=()=>tabs().catch(()=>status('Could not read the tab list. Reload the helper.'));
 $('#reconnect').onclick=async()=>{status('Reconnecting…');try{const r=await send({type:'reconnect',tab:Number($('#tabs').value)});if(r?.error)status(r.error);else status('Connected. Return to GumShelf and continue your scan.');if(r?.needsPair)pairedUI(false);}catch(e){status(e.message);}};
 extension.storage.onChanged.addListener((changes,area)=>{if(area==='local'){if(changes.status)status(changes.status.newValue);if(changes.token)pairedUI(!!changes.token.newValue);}});
 (async()=>{const s=await extension.storage.local.get(['status','token']);pairedUI(!!s.token);if(await tabs())status(s.status||'Not paired. Enter the pairing code shown in GumShelf.');await send({type:'wake'});})().catch(e=>status(e.message));
})();
