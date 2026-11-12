
(function(root){
 const THEMES=['system','dark','light'];
 function resolveTheme(choice,systemDark){return choice==='dark'||choice==='light'?choice:systemDark?'dark':'light';}
 function normalizeTheme(choice){return THEMES.includes(choice)?choice:'system';}
 function normalizePalette(choice){return choice==='mono'?'mono':'color';}
 function palettePatch(patch){if(!Object.prototype.hasOwnProperty.call(patch,'palette'))return {};if(!['mono','color'].includes(patch.palette))throw Error('Choose Monochrome or Color accents.');return {palette:patch.palette};}
 function normalizeSurface(value){return ['desktop','lens','solid'].includes(value)?value:'desktop';}
 function normalizeAccent(value){return typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value.toUpperCase():null;}
 const glassControls = [
  { key: 'glassRefraction', id: 'refraction', label: 'Bend', min: 0, max: 12, step: 1, initial: 12, css: '--glass-displacement', unit: '' },
  { key: 'glassDispersion', id: 'dispersion', label: 'Dispersion', min: 0, max: 1, step: 0.05, initial: 0.5, css: '--glass-dispersion', unit: '' },
  { key: 'glassFrost', id: 'frost', label: 'Frost', min: 0, max: 16, step: 0.5, initial: 3, css: '--glass-frost', unit: 'px' },
  { key: 'glassRim', id: 'rim', label: 'Rim', min: 0, max: 1, step: 0.05, initial: 0.45, css: '--glass-rim', unit: '' }
 ];
 function appearancePatch(patch){const result={};for(const {key,max} of glassControls)if(Object.hasOwn(patch,key)){const value=patch[key];if(value!==null&&(!Number.isFinite(value)||value<0||value>max))throw Error('Choose an available glass setting.');result[key]=value;}if(Object.hasOwn(patch,'windowSurface')){if(!['desktop','lens','solid'].includes(patch.windowSurface))throw Error('Choose Desktop glass, In-app lens or Solid.');result.windowSurface=patch.windowSurface;}if(Object.hasOwn(patch,'accent')){if(patch.accent!==null&&!normalizeAccent(patch.accent))throw Error('Choose a valid six-digit accent color.');result.accent=normalizeAccent(patch.accent);}return result;}
 function luminance(hex){return hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);}
 function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
 function accentColors(value,canvas,fallbackFocus,black,white,minimum,backgrounds=[canvas]){const accent=normalizeAccent(value);if(!accent)return null;return {accent,onAccent:contrast(accent,black)>=contrast(accent,white)?black:white,focus:backgrounds.every(bg=>contrast(accent,bg)>=minimum)?accent:fallbackFocus};}
 function materialPolicy(native={},web={},palette='color',surface='desktop'){
  let reason='Glass follows Windows transparency preferences.';
  let mode='blur';
  if(normalizeSurface(surface)==='solid'){mode='solid';reason='Solid appearance is selected.';}
  else if(normalizePalette(palette)==='mono'){mode='solid';reason='Monochrome uses solid surfaces.';}
  else if(native.forcedColors!==false||native.highContrast!==false||web.forcedColors||web.contrastMore){mode='solid';reason='Solid surfaces protect contrast and accessibility.';}
  else if(native.transparency!==true){mode='solid';reason=native.transparency===false?'Windows transparency is off.':'Waiting for a known Windows transparency preference.';}
  else if(web.reducedTransparency){mode='solid';reason='Reduced transparency uses solid surfaces.';}
  else if(web.blurSupported!==true){mode='solid';reason='This renderer uses the solid fallback.';}
  const motion=native.animations===true&&!web.reducedMotion?'full':'reduced';
  return {mode,motion,reason};
 }
 const api={glassControls,resolveTheme,normalizeTheme,normalizePalette,palettePatch,materialPolicy,normalizeSurface,normalizeAccent,appearancePatch,accentColors,contrast};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GumAppearance=api;
})(globalThis);
