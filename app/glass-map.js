(function(root){
 // Independent rounded-rectangle normal map. Coordinates/byte encoding are
 // geometry, not UI dimensions; callers provide every dimensional token.
 function pixels(width,height,radius,edge){
  const w=Math.max(1,Math.round(width)),h=Math.max(1,Math.round(height));
  const r=Math.min(radius,w/2,h/2),out=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const cx=Math.min(Math.max(x,r),w-r),cy=Math.min(Math.max(y,r),h-r),dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy);
   const inside=r-d,strength=inside>=0&&inside<edge?(1-inside/edge)**2:0,i=(y*w+x)*4;
   out[i]=Math.round(255*(.5+(d?dx/d:0)*strength*.5));out[i+1]=Math.round(255*(.5+(d?dy/d:0)*strength*.5));out[i+2]=128;out[i+3]=255;
  }
  return out;
 }
 function dataURL(width,height,radius,edge){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(width));c.height=Math.max(1,Math.round(height));const ctx=c.getContext('2d');const image=ctx.createImageData(c.width,c.height);image.data.set(pixels(c.width,c.height,radius,edge));ctx.putImageData(image,0,0);return c.toDataURL();}
 const api={pixels,dataURL};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GumGlassMap=api;
})(globalThis);
