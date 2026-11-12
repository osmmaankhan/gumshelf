
(function(root){
 const THEMES=['system','dark','light','black'];
 function themeSource(choice){return choice==='black'?'dark':choice;}
 function resolveTheme(choice,systemDark){choice=themeSource(choice);return choice==='dark'||choice==='light'?choice:systemDark?'dark':'light';}
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

 function hexToOklch(hex){const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);const [r,g,b]=rgb;const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);const L=.2104542553*l+.793617785*m-.0040720468*s,a=1.9779984951*l-2.428592205*m+.4505937099*s,bb=.0259040371*l+.7827717662*m-.808675766*s;return [L,Math.hypot(a,bb),Math.atan2(bb,a)];}
 function oklchToHex(L,C,h){function rgb(c){const a=c*Math.cos(h),b=c*Math.sin(h),l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,s=(L-.0894841775*a-1.291485548*b)**3;return [4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s];}let lo=0,hi=C,values=rgb(C);if(values.some(v=>v<0||v>1)){for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(rgb(mid).every(v=>v>=0&&v<=1))lo=mid;else hi=mid;}values=rgb(lo);}return '#'+values.map(v=>Math.round(255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055)).toString(16).padStart(2,'0')).join('').toUpperCase();}
 function adjustFocus(accent,backgrounds,minimum){if(backgrounds.every(bg=>contrast(accent,bg)>=minimum))return accent;const [L,C,h]=hexToOklch(accent),direction=luminance(backgrounds[0])>.18?-1:1;for(let i=1;i<=200;i++){const candidate=oklchToHex(Math.max(0,Math.min(1,L+direction*i*.005)),C,h);if(backgrounds.every(bg=>contrast(candidate,bg)>=minimum))return candidate;}return oklchToHex(direction<0?0:1,0,h);}
 function accentColors(value,canvas,fallbackFocus,black,white,minimum,backgrounds=[canvas]){const accent=normalizeAccent(value);if(!accent)return null;return {accent,onAccent:contrast(accent,black)>=contrast(accent,white)?black:white,focus:adjustFocus(accent,backgrounds,minimum)};}
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
 const api={glassControls,resolveTheme,normalizeTheme,themeSource,hexToOklch,oklchToHex,adjustFocus,normalizePalette,palettePatch,materialPolicy,normalizeSurface,normalizeAccent,appearancePatch,accentColors,contrast};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GumAppearance=api;
})(globalThis);
