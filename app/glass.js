/* Appearance-only DOM decoration. Does not own app state or handle commands. */
(function(){
 const body=document.body,root=document.documentElement,records=new Map();let queued=false,sequence=0;
 const ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');svg.classList.add('glass-definitions');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');const defs=document.createElementNS(ns,'defs');svg.append(defs);body.append(svg);
 const variable=name=>getComputedStyle(body).getPropertyValue(name).trim();
 const number=name=>parseFloat(variable(name));
 const rgb=value=>value.startsWith('#')?value.slice(1).match(/../g).slice(0,3).map(n=>parseInt(n,16)):(value.match(/[\d.]+/g)||[]).map(Number).slice(0,3);
 const luminance=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 function controlled(host){
  const canvas=rgb(variable('--color-canvas')),paint=getComputedStyle(body);
  if(paint.backgroundImage!=='none'||rgb(paint.backgroundColor).some((v,i)=>v!==canvas[i]))return false;
  for(let p=host.parentElement;p&&p!==body;p=p.parentElement){const s=getComputedStyle(p);if(s.backgroundImage!=='none'||(!['transparent','rgba(0, 0, 0, 0)'].includes(s.backgroundColor)&&s.backgroundColor!==paint.backgroundColor))return false;}
  const content=document.querySelector('.main-panel'),a=host.getBoundingClientRect(),b=content?.getBoundingClientRect();
  return !b||a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom;
 }
 function candidatePasses(){
  const dark=body.dataset.theme==='dark',tint=variable(dark?'--color-dark-lens-tint':'--color-light-lens-tint').match(/[\d.]+/g).map(Number),base=rgb(variable('--color-canvas'));
  const composite=base.map((v,i)=>v*(1-tint[3])+tint[i]*tint[3]);
  // Thresholds are the supplied standard tokens, not new design estimates.
  return contrast(rgb(variable('--color-text')),composite)>=number('--glass-contrast-text')&&contrast(rgb(variable('--color-secondary')),composite)>=number('--glass-contrast-text')&&contrast(rgb(variable('--color-focus')),composite)>=number('--glass-contrast-large');
 }
 function selectionPasses(){
  const dark=body.dataset.theme==='dark',tint=variable(dark?'--color-dark-lens-tint':'--color-light-lens-tint').match(/[\d.]+/g).map(Number),surface=rgb(variable('--color-surface')),text=rgb(variable('--color-text'));
  const composite=values=>values.map((v,i)=>v*(1-tint[3])+tint[i]*tint[3]);
  return contrast(composite(text),composite(surface))>=number('--glass-contrast-text');
 }
 function addDispersion(filter) {
  const append = (tag, attributes) => {
   const node = document.createElementNS(ns,tag);
   for (const [key,value] of Object.entries(attributes)) node.setAttribute(key,value);
   filter.append(node);
   return node;
  };
  const channels = ['red','green','blue'].map((channel,index) => {
   const across = append('feDisplacementMap',{in:'SourceGraphic',in2:'across-neutral',xChannelSelector:'R',yChannelSelector:'A',result:channel+'-across'});
   const down = append('feDisplacementMap',{in:channel+'-across',in2:'down-neutral',xChannelSelector:'A',yChannelSelector:'R',result:channel+'-down'});
   const matrix = [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,1,0];
   matrix[index*6] = 1;
   append('feColorMatrix',{in:channel+'-down',type:'matrix',values:matrix.join(' '),result:channel});
   return {across,down};
  });
  append('feBlend',{in:'red',in2:'green',mode:'screen',result:'red-green'});
  append('feBlend',{in:'red-green',in2:'blue',mode:'screen'});
  return channels;
 }
 function create(host){
  const layer=document.createElement('div');layer.className='glass-optics';layer.setAttribute('aria-hidden','true');host.prepend(layer);host.classList.add('glass-host');
  const filter=document.createElementNS(ns,'filter'),map=document.createElementNS(ns,'feImage'),downMap=document.createElementNS(ns,'feImage'),displace=document.createElementNS(ns,'feDisplacementMap'),downDisplace=document.createElementNS(ns,'feDisplacementMap');
  const id='gs-navigation-glass-'+(++sequence);filter.id=id;
  for(const [k,v]of Object.entries({x:'0',y:'0',width:'100%',height:'100%','color-interpolation-filters':'sRGB'}))filter.setAttribute(k,v);
  // Glisse's separate greys avoid display-colour conversion coupling X to Y.
  // Constant half alpha is an exactly neutral unused displacement direction.
  const half=(input,result)=>{const transfer=document.createElementNS(ns,'feComponentTransfer'),alpha=document.createElementNS(ns,'feFuncA');transfer.setAttribute('in',input);transfer.setAttribute('result',result);alpha.setAttribute('type','table');alpha.setAttribute('tableValues','0.5 0.5');transfer.append(alpha);return transfer;};
  for(const [image,result]of [[map,'across-map'],[downMap,'down-map']]){image.setAttribute('result',result);image.setAttribute('preserveAspectRatio','none');}
  for(const [k,v]of Object.entries({in:'SourceGraphic',in2:'across-neutral',xChannelSelector:'R',yChannelSelector:'A',result:'pulled-across'}))displace.setAttribute(k,v);
  for(const [k,v]of Object.entries({in:'pulled-across',in2:'down-neutral',xChannelSelector:'A',yChannelSelector:'R'}))downDisplace.setAttribute(k,v);
  filter.append(map,half('across-map','across-neutral'),downMap,half('down-map','down-neutral'),displace,downDisplace);defs.append(filter);layer.style.setProperty('--navigation-lens-filter','url("#'+id+'")');
  const channels = host.matches('.glass-demo-lens') ? addDispersion(filter) : [];
  const resize=new ResizeObserver(schedule);resize.observe(host);const record={layer,filter,map,downMap,displace,downDisplace,channels,resize,signature:''};records.set(host,record);return record;
 }
 function update(){
  queued=false;
  for(const [host,r]of records)if(!host.isConnected){r.resize.disconnect();r.filter.remove();records.delete(host);}
  let lenses=0;
  for(const host of document.querySelectorAll('.rail .navigation-selection,.topline,.glass-demo-lens,.liquid-range-lens:not([hidden])')){
   const r=records.get(host)||create(host),beforeRect=r.layer.getBoundingClientRect(),limit=number('--glass-max-side');
   const outer=host.getBoundingClientRect(),outerRadius=Math.min(parseFloat(getComputedStyle(host).borderTopLeftRadius),outer.width/2,outer.height/2);
   r.layer.style.borderRadius=Math.max(0,outerRadius-number('--space-hairline'))+'px';
   const sample=host.matches('.glass-demo-lens');
   const selection=host.classList.contains('navigation-selection'),thumb=host.classList.contains('liquid-range-lens');const allowed=body.dataset.material==='blur'&&(sample||selection||thumb||!['mica','acrylic'].includes(body.dataset.nativeBackdrop));
   // A solid/native mode hides the optical layer. Measure its visible host for
   // eligibility, then remeasure the layer after selecting lens mode.
   const width=beforeRect.width||host.clientWidth,height=beforeRect.height||host.clientHeight;
   const lens=allowed&&(!selection||selectionPasses())&&body.dataset.refractionProof==='passed'&&width>0&&height>0&&width<=limit&&height<=limit&&CSS.supports('backdrop-filter','url("#'+r.filter.id+'")');
   host.dataset.glassMode=lens?'lens':allowed&&!selection?'blur':'solid';
   host.dataset.glassProfile=lens&&(selection?selectionPasses():controlled(host)&&candidatePasses())?'candidate':'fallback';
   if(lens){
    const rect=r.layer.getBoundingClientRect();
    lenses++;const radius=Math.min(parseFloat(getComputedStyle(r.layer).borderTopLeftRadius),rect.width/2,rect.height/2),signature=[Math.round(rect.width),Math.round(rect.height),radius].join(':');
    if(signature!==r.signature){const maps=GumLiquidMap.dataURLs(rect.width,rect.height,radius,number('--space-md'));r.map.setAttribute('href',maps.across);r.downMap.setAttribute('href',maps.down);r.signature=signature;}
    r.displace.setAttribute('scale',number('--glass-displacement'));r.downDisplace.setAttribute('scale',number('--glass-displacement'));
    const bend = number('--glass-displacement');
    const dispersion = number('--glass-dispersion');
    for (const [index,{across,down}] of r.channels.entries()) {
     const strength = bend * (1 + (index-1) * dispersion * 0.35);
     across.setAttribute('scale',strength);
     down.setAttribute('scale',strength);
    }
   }
  }
  const status=document.querySelector('#material-status'),message=['mica','acrylic'].includes(body.dataset.nativeBackdrop)?'Desktop glass and refractive navigation. Reading content stays solid.':'Refractive navigation. Product content stays solid.';if(status&&lenses&&status.textContent!==message)status.textContent=message;
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
 new MutationObserver(schedule).observe(document.querySelector('#app'),{childList:true,subtree:true});
 new MutationObserver(schedule).observe(body,{attributes:true,attributeFilter:['data-theme','data-palette','data-material','data-native-backdrop','data-refraction-proof']});
 document.addEventListener('gumshelf-appearance',schedule);
 schedule();
})();
