const test=require('node:test'),assert=require('node:assert/strict');
const {materialPolicy}=require('../app/appearance.js');
const {readNativeAppearance,supportsMica,applyWindowAppearance,paint}=require('../lib/window-appearance.cjs');
const native={transparency:true,forcedColors:false,highContrast:false,animations:true};
const theme={prefersReducedTransparency:false,inForcedColorsMode:false,shouldUseHighContrastColors:false,shouldUseDarkColors:false};
const system={getAnimationSettings:()=>({prefersReducedMotion:false})};
function windowFixture(){const calls=[];return {calls,setBackgroundMaterial:value=>calls.push(['material',value]),setBackgroundColor:value=>calls.push(['background',value]),setTitleBarOverlay:value=>calls.push(['caption',value])};}
test('material permission distinguishes allowed, disabled and unknown native preferences',()=>{
 assert.equal(materialPolicy(native,{blurSupported:true}).mode,'blur');
 for(const patch of [{transparency:null},{transparency:false},{forcedColors:null},{forcedColors:true},{highContrast:null},{highContrast:true}])assert.equal(materialPolicy({...native,...patch},{blurSupported:true}).mode,'solid');
 assert.equal(materialPolicy({},{}).mode,'solid');
 assert.equal(materialPolicy(native,{blurSupported:false}).mode,'solid');
 assert.equal(materialPolicy(native,{blurSupported:true},'mono').mode,'solid');
 for(const key of ['reducedTransparency','contrastMore','forcedColors'])assert.equal(materialPolicy(native,{blurSupported:true,[key]:true}).mode,'solid');
 assert.equal(materialPolicy(native,{blurSupported:true,reducedMotion:true}).motion,'reduced');
 assert.equal(materialPolicy({...native,animations:null},{blurSupported:true}).motion,'reduced');
});
test('native readers fail closed without coercing missing preference APIs',()=>{
 assert.deepEqual(readNativeAppearance(theme,system),native);
 assert.deepEqual(readNativeAppearance({},{}),{transparency:null,forcedColors:null,highContrast:null,animations:null});
 assert.equal(readNativeAppearance(theme,{getAnimationSettings:()=>({})}).animations,null);
 assert.equal(readNativeAppearance({...theme,prefersReducedTransparency:true},system).transparency,false);
});
test('supported Windows Acrylic is cleared immediately when transparency is disabled',()=>{
 const win=windowFixture(),settings={palette:'color'},environment={platform:'win32',release:'10.0.26300'};
 assert.equal(applyWindowAppearance(win,settings,theme,system,environment).nativeBackdrop,'acrylic');
 assert.equal(win.calls.find(c=>c[0]==='background')[1],'#00000000');
 win.calls.length=0;
 assert.equal(applyWindowAppearance(win,settings,{...theme,prefersReducedTransparency:true},system,environment).nativeBackdrop,'none');
 assert.deepEqual(win.calls[0],['material','none']);assert.equal(win.calls[1][1],paint(false,'color').canvas);
});
test('unsupported Windows, monochrome, unknown settings and native failures retain opaque fallback',()=>{
 assert.equal(supportsMica('win32','10.0.22000'),false);assert.equal(supportsMica('linux','10.0.26300'),false);
 for(const [settings,prefs,env] of [[{palette:'mono'},theme,{platform:'win32',release:'10.0.26300'}],[{},theme,{platform:'win32',release:'10.0.19045'}],[{}, {},{platform:'win32',release:'10.0.26300'}]]){
  const win=windowFixture();assert.equal(applyWindowAppearance(win,settings,prefs,system,env).nativeBackdrop,'none');assert.notEqual(win.calls.find(c=>c[0]==='background')[1],'#00000000');
 }
 const win=windowFixture();win.setBackgroundMaterial=()=>{throw Error('Unsupported native compositor');};
 assert.equal(applyWindowAppearance(win,{},theme,system,{platform:'win32',release:'10.0.26300'}).nativeBackdrop,'none');
 assert.equal(win.calls.find(c=>c[0]==='background')[1],paint(false,'color').canvas);
});
test('appearance does not mutate settings and high contrast uses Windows system colors',()=>{
 const settings={theme:'dark',palette:'color',custom:'keep'},before=structuredClone(settings),win=windowFixture();
 const colors={...system,getColor:key=>key==='window'?'#000000':'#ffffff'};
 const result=applyWindowAppearance(win,settings,{...theme,inForcedColorsMode:true},colors,{platform:'win32',release:'10.0.26300'});
 assert.deepEqual(settings,before);assert.equal(result.nativeBackdrop,'none');assert.equal(win.calls.find(c=>c[0]==='background')[1],'#000000');
});
test('shell tint bounds keep foreground text readable over extreme backdrops',()=>{
 const tokens=require('../app/tokens.json').tokens;
 const luminance=rgb=>rgb.map(c=>c/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((n,c,i)=>n+c*[.2126,.7152,.0722][i],0);
 const hex=value=>value.slice(1).match(/../g).map(v=>parseInt(v,16));
 for(const theme of ['light','dark']){
  const tint=tokens['color.'+theme+'.glassTint'].value.match(/[\d.]+/g).map(Number),alpha=tint[3];
  for(const backdrop of [0,255])for(const role of ['text','secondary']){
   const foreground=luminance(hex(tokens['color.'+theme+'.'+role].value));
   const background=luminance(tint.slice(0,3).map(channel=>channel*alpha+backdrop*(1-alpha)));
   const ratio=(Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05);
   assert.ok(ratio>=tokens['standard.contrastText'].value,theme+' '+role+' over '+backdrop+': '+ratio);
  }
 }
});
test('desktop glass paints a near-opaque page tint so window recordings are not black',()=>{
 // Recorders capture only page pixels (color x alpha over black); the Acrylic behind them never appears.
 const css=require('node:fs').readFileSync(require('node:path').join(__dirname,'../app/glass.css'),'utf8');
 for(const theme of ['dark','light']){
  const rule=css.match(new RegExp(String.raw`body\[data-theme=${theme}\]\[data-material=blur\]\[data-native-backdrop=acrylic\] \{ background:rgba\((\d+),(\d+),(\d+),([\d.]+)\)`));
  assert.ok(rule,theme+' acrylic page tint');const [r,g,b,a]=rule.slice(1).map(Number);
  assert.ok(a>=.85&&Math.min(r,g,b)*a>=40,theme+' records as a visible background');
 }
});
