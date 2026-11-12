// Local appearance capability check only. No preload, IPC command, persistence,
// account, extension, network or user content access.
const path=require('node:path');
const T=require('../app/tokens.json').tokens;
async function verify(BrowserWindow){
 let probe,timer;
 const run=async()=>{
  probe=new BrowserWindow({show:false,width:T['layout.wide'].value,height:T['layout.windowHeight'].value,useContentSize:true,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
  probe.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  await probe.loadFile(path.join(__dirname,'../app/glass-probe.html'));
  const axes=[];
  for(const vertical of [false,true]){
   let rect;
   const capture=async displaced=>{rect=await probe.webContents.executeJavaScript('GlassProbe.configure('+vertical+','+displaced+')');await new Promise(resolve=>setTimeout(resolve,T['glass.resizeDebounce'].value));return probe.webContents.capturePage();};
   const off=await capture(false),on=await capture(true),size=off.getSize();
   const a=off.toBitmap(),b=on.toBitmap(),scale=size.width/T['layout.wide'].value;
   const inset=T['space.xs'].value,band=T['space.md'].value,radius=T['radius.hero'].value;
   let edgeTotal=0,centerTotal=0,edgeCount=0,centerCount=0,changed=0;
   for(let y=Math.ceil((rect.y+inset)*scale);y<Math.floor((rect.y+rect.height-inset)*scale);y++)for(let x=Math.ceil((rect.x+inset)*scale);x<Math.floor((rect.x+rect.width-inset)*scale);x++){
    const localX=x/scale-rect.x,localY=y/scale-rect.y;
    if(vertical?(localY<radius||localY>rect.height-radius):(localX<radius||localX>rect.width-radius))continue;
    const i=(y*size.width+x)*4,d=(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]))/3;
    const distance=vertical?Math.min(localX,rect.width-localX):Math.min(localY,rect.height-localY);
    if(distance<band){edgeTotal+=d;edgeCount++;if(d>0)changed++;}else{centerTotal+=d;centerCount++;}
   }
   const edgeMean=edgeTotal/edgeCount,centerMean=centerTotal/centerCount;
   axes.push({vertical,passed:changed>0&&edgeMean>centerMean,edgeMean,centerMean,changed});
  }
  return {passed:axes.every(a=>a.passed),axes};
 };
 // Technical watchdog: a GPU/renderer failure must never hold app startup.
 try{return await Promise.race([run(),new Promise(resolve=>{timer=setTimeout(()=>resolve({passed:false,reason:'Rendering check timed out.'}),10000);})]);}
 catch{return {passed:false,reason:'Rendering check unavailable.'};}
 finally{clearTimeout(timer);if(probe&&!probe.isDestroyed())probe.destroy();}
}
module.exports={verify};
