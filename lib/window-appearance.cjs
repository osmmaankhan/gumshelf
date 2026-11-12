// Appearance only. No settings writes, extension access, or new renderer commands.
const tokens=require('../app/tokens.json').tokens;
const {normalizePalette,materialPolicy,normalizeSurface}=require('../app/appearance.js');
function boolean(read){try{const value=read();return typeof value==='boolean'?value:null;}catch{return null;}}
function readNativeAppearance(nativeTheme,systemPreferences){
 const reduced=boolean(()=>nativeTheme.prefersReducedTransparency);
 const reducedMotion=boolean(()=>systemPreferences.getAnimationSettings().prefersReducedMotion);
 return {
  transparency:reduced===null?null:!reduced,
  forcedColors:boolean(()=>nativeTheme.inForcedColorsMode),
  highContrast:boolean(()=>nativeTheme.shouldUseHighContrastColors),
  animations:reducedMotion===null?null:!reducedMotion
 };
}
function supportsMica(platform,release){
 // Windows API availability boundary (Windows 11 22H2), not a design dimension.
 return platform==='win32'&&Number(String(release).split('.')[2])>=22621;
}
function paint(dark,palette){
 const role=key=>tokens['color.'+(dark?'dark':'light')+'.'+key].value;
 if(normalizePalette(palette)==='mono')return {canvas:tokens['color.mono.'+(dark?'lightAccent':'darkAccent')].value,text:tokens['color.mono.'+(dark?'darkAccent':'lightAccent')].value};
 return {canvas:role('canvas'),text:role('text')};
}
function applyWindowAppearance(win,settings,nativeTheme,systemPreferences,environment={platform:process.platform,release:require('node:os').release()}){
 const native=readNativeAppearance(nativeTheme,systemPreferences);
 const policy=materialPolicy(native,{blurSupported:true},settings.palette,settings.windowSurface);
 let nativeBackdrop='none';
 if(typeof win.setBackgroundMaterial==='function'){
  try{const requested=policy.mode==='blur'&&normalizeSurface(settings.windowSurface)==='desktop'&&supportsMica(environment.platform,environment.release)?'acrylic':'none';win.setBackgroundMaterial(requested);nativeBackdrop=requested;}
  catch{try{win.setBackgroundMaterial('none');}catch{}}
 }
 const colors=paint(nativeTheme.shouldUseDarkColors,settings.palette);
 if(native.forcedColors===true||native.highContrast===true){
  try{colors.canvas=systemPreferences.getColor('window').slice(0,7);colors.text=systemPreferences.getColor('window-text').slice(0,7);}catch{}
 }
 const nativeGlass=nativeBackdrop==='acrylic';
 win.setBackgroundColor(nativeGlass?'#00000000':colors.canvas);
 // Retain the existing native caption height and drag-region contract.
 // The caption API rejects the named "transparent" keyword even though the
 // background API accepts it. Explicit zero-alpha hex preserves the material.
 try{win.setTitleBarOverlay({color:nativeGlass?'#00000000':colors.canvas,symbolColor:colors.text,height:36});}
 catch{nativeBackdrop='none';try{win.setBackgroundMaterial('none');}catch{}win.setBackgroundColor(colors.canvas);win.setTitleBarOverlay({color:colors.canvas,symbolColor:colors.text,height:36});}
 return {...native,nativeBackdrop};
}
module.exports={readNativeAppearance,supportsMica,paint,applyWindowAppearance};
