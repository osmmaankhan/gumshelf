const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../app/appearance.js'),W=require('../lib/window-appearance.cjs'),T=require('../app/tokens.json').tokens;
test('appearance settings reject CSS injection and unknown materials without touching other preferences',()=>{
 assert.deepEqual(A.appearancePatch({accent:'#12abEF',windowSurface:'lens',notifications:false}),{accent:'#12ABEF',windowSurface:'lens'});
 for(const accent of ['red','#123','#123456;url(x)',12])assert.throws(()=>A.appearancePatch({accent}));
 assert.throws(()=>A.appearancePatch({windowSurface:'unknown'}));assert.deepEqual(A.appearancePatch({accent:null}),{accent:null});
});
test('custom accent always has readable label foreground and a contrast-safe focus fallback',()=>{
 for(const theme of ['light','dark'])for(let n=0;n<256;n+=7){
  const accent='#'+[n,255-n,(n*3)%256].map(v=>v.toString(16).padStart(2,'0')).join(''),role=k=>T['color.'+theme+'.'+k].value;
  const result=A.accentColors(accent,role('canvas'),role('focus'),T['color.mono.lightAccent'].value,T['color.mono.darkAccent'].value,T['standard.contrastLarge'].value);
  assert.ok(A.contrast(result.accent,result.onAccent)>=T['standard.contrastText'].value);
  assert.ok(A.contrast(result.focus,role('canvas'))>=T['standard.contrastLarge'].value);
 }
});
test('native Acrylic uses explicit zero-alpha caption color; lens and solid clear native effects',()=>{
 const calls=[],win={setBackgroundMaterial:v=>calls.push(v),setBackgroundColor:v=>calls.push(v),setTitleBarOverlay:o=>{if(o.color==='transparent')throw Error('Could not parse color as CSS color');calls.push(o.color);}};
 const theme={prefersReducedTransparency:false,inForcedColorsMode:false,shouldUseHighContrastColors:false,shouldUseDarkColors:false},sys={getAnimationSettings:()=>({prefersReducedMotion:false})},env={platform:'win32',release:'10.0.26300'};
 assert.equal(W.applyWindowAppearance(win,{},theme,sys,env).nativeBackdrop,'acrylic');assert.ok(calls.includes('#00000000'));
 for(const windowSurface of ['lens','solid']){calls.length=0;assert.equal(W.applyWindowAppearance(win,{windowSurface},theme,sys,env).nativeBackdrop,'none');assert.equal(calls[0],'none');}
 assert.equal(A.materialPolicy({transparency:true,forcedColors:false,highContrast:false,animations:true},{blurSupported:true},'color','solid').mode,'solid');
});
