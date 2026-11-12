(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GumCatalog=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const types=[
 ['mockups','Mockups','#ab7fda'],['fonts','Typography & fonts','#d39465'],['branding','Branding kits','#cf7a98'],['ui','UI & web design','#64a9bf'],['characters','3D characters','#9297dd'],['scenes','Blender scenes & projects','#74aa91'],['models','3D models & assets','#8d9ecb'],['materials','Materials & shaders','#b2a16b'],['brushes','Brushes','#c481a4'],['textures','Textures','#a5a275'],['ae-projects','After Effects projects','#a18bd2'],['motion','Animation assets','#6dabb2'],['effects','Effects & presets','#879cda'],['plugins','Plugins','#a1a772'],['scripts','Scripts & automation','#77ac99'],['apps','Applications','#759bbb'],['templates','Templates & planners','#c39870'],['audio','Audio & sound effects','#c08cb7'],['courses','Courses & tutorials','#a595d7'],['books','Books & references','#b5a17b'],['graphics','Graphics & icons','#82aba8'],['uncategorized','Uncategorized','#929ba4']
 ].map(([id,label,color])=>({id,label,color}));
 const byId=id=>types.find(t=>t.id===id)||types[types.length-1];
 const rules=[
 ['courses',/\b(course|courses|tutorials?|masterclass|lessons?|training)\b/i],
 ['mockups',/mock.?ups?/i],
 ['brushes',/\bbrush(?:es)?\b/i],
 ['branding',/\bbranding\b|brand.{0,18}(?:kit|identity|guideline|guide)|brand guide/i],
 ['characters',/\bvrchat\b|(?:3d|fbx).{0,35}(?:characters?|avatars?|creatures?)|(?:characters?|avatars?|creatures?).{0,35}(?:3d|fbx)/i],
 ['ae-projects',/\.aep\b|after effects.{0,40}(?:projects?|templates?)|(?:projects?|templates?).{0,40}after effects/i],
 ['scenes',/\.blend\b|blender.{0,35}(?:scenes?|projects?)|(?:scenes?|projects?).{0,35}blender/i],
 ['apps',/\bdownloader\b|\b(?:windows|desktop|android|pc) app\b|\bapplication\b|\.apk\b/i],
 ['scripts',/\bscripts?\b|\bautomation\b|\.jsx(?:bin)?\b|\bkbar\b/i],
 ['plugins',/\bplug.?ins?\b|\bextensions?\b/i],
 ['fonts',/\bfonts?\b|\btypefaces?\b|\btypograph(?:y|ic)\b/i],
 ['materials',/\bmaterials?\b|\bshaders?\b/i],
 ['textures',/\btextures?\b/i],
 ['audio',/\bsfx\b|\bsounds?\b|\baudio\b|\bmusic\b|\bfoley\b/i],
 ['effects',/\b(?:effects?|presets?|luts?|blur)\b/i],
 ['models',/\b3d\b|\bmodels?\b|\bmeshes?\b|\bfbx\b|\bblender\b|\bzbrush\b|\bhoudini\b/i],
 ['ui',/\bfigma\b|\bui kit\b|web design|wireframe|design system|website/i],
 ['audio',/\bsfx\b|\bsounds?\b|\baudio\b|\bmusic\b|\bfoley\b/i],
 ['motion',/\banimat(?:ion|ions|ed)\b|motion graphics|\bmemoji\b/i],
 ['templates',/\btemplates?\b|\bplanners?\b|\bnotion\b|\bcanva\b/i],
 ['books',/\b(?:ebooks?|handbooks?|books?|reports?|checklists?|guides?|pdf)\b/i],
 ['graphics',/\bgraphics?\b|\bicons?\b|\bvectors?\b|\bstickers?\b|\billustrations?\b|\bwallpapers?\b|\bposters?\b/i]
 ];
 const softwareRules=[['Blender',/\bblender\b|\.blend\b/i],['After Effects',/after effects|\.aep\b/i],['Photoshop',/photoshop|\.?\bpsd\b/i],['Figma',/\bfigma\b/i],['Procreate',/\bprocreate\b/i],['Canva',/\bcanva\b/i],['Notion',/\bnotion\b/i],['Illustrator',/\billustrator\b/i],['Premiere Pro',/\bpremiere\b/i],['DaVinci Resolve',/davinci|resolve studio/i],['Unity',/\bunity\b/i],['Unreal Engine',/unreal|\bue[45]\b/i],['ZBrush',/\bzbrush\b/i],['Houdini',/\bhoudini\b/i]];
 const mockupKinds=[['devices','Devices',/iphone|ipad|macbook|laptop|phone|device|screen|spotify/i],['apparel','Apparel',/shirt|hoodie|apparel|clothing|merch|cap\b/i],['packaging','Packaging',/packag|mailer|bottle|bag\b|box\b|pouch|can\b|cup\b/i],['posters','Posters',/poster|billboard/i],['presentations','Presentations',/presentation|slide|16:9/i],['stationery','Paper & stationery',/paper|stationery|business card|stamp|book|vellum|sticker/i],['other','Other mockups',/./]];
 function infer(p){const title=String(p.name||p.title||'');const explicit=types.find(t=>t.label===p.category);let type=rules.find(([,pattern])=>pattern.test(title))?.[0];let basis='Title';
  if(explicit&&explicit.id!=='uncategorized'&&['Your category','AI suggestion · reviewed by you'].includes(p.analysisSource)){type=explicit.id;basis='Your reviewed category';}
  // Only fall back to a short verified storefront excerpt, never purchase text or generic summaries.
  if(!type&&p.descriptionSource==='public-product'){const text=String(p.description||'').split(/upgrade|follow me|more tools|subscribe|youtube/i)[0].slice(0,500);type=rules.find(([,pattern])=>pattern.test(text))?.[0];if(type)basis='Public description';}
  type=type||'uncategorized';const mockup=type==='mockups'?mockupKinds.find(([, ,pattern])=>pattern.test(title)):null;
  return {type,basis,suggested:true,mockup:mockup?.[0]||'',software:softwareRules.filter(([,pattern])=>pattern.test(title)).map(([name])=>name)};
 }
 // Public descriptions contribute explicit names only. File hints remain a title signal.
 const mentionRules=softwareRules.map(([name,title])=>({name,title,description:new RegExp('\\b'+name+'\\b','i')}));
 function softwareMentions(p,software=''){
  const title=String(p.name||p.title||'');
  const description=p.descriptionSource==='public-product'?String(p.description||''):'';
  const mentions=[];
  for(const rule of mentionRules){
   if(software&&software!==rule.name)continue;
   const sources=[];
   if(rule.title.test(title))sources.push('Title');
   if(rule.description.test(description))sources.push('Storefront description');
   if(sources.length)mentions.push({name:rule.name,sources});
  }
  return mentions;
 }
 function matches(p,{type='',mockup='',software=''}={}){
  if(type||mockup){
   const f=infer(p);
   if((type&&f.type!==type)||(mockup&&f.mockup!==mockup))return false;
  }
  return !software||softwareMentions(p,software).length>0;
 }
 return {types,byId,infer,matches,softwareMentions,mockupKinds:mockupKinds.map(([id,label])=>({id,label}))};
});
