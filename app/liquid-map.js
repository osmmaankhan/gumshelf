/* Adapted from Glisse's rounded-distance and split-grey lens technique.
 * Copyright (c) 2026 Kelvin Zhang. MIT: vendor/glisse/LICENSE.
 * Geometry/byte constants are mathematical; all dimensions come from tokens.
 * No chromatic split or upstream optical calibration is implied. */
(function(root){
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 function distance(x,y,w,h,r){const qx=Math.abs(x)-w+r,qy=Math.abs(y)-h+r;return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r;}
 function pixels(width,height,radius,depth){
  const w=Math.max(1,Math.round(width)),h=Math.max(1,Math.round(height)),hw=w/2,hh=h/2,r=clamp(radius,0,Math.min(hw,hh));
  const across=new Uint8ClampedArray(w*h*4),down=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const px=x+.5-hw,py=y+.5-hh,d=distance(px,py,hw,hh,r),i=(y*w+x)*4;
   // Exact gradient of the rounded rectangle, including its straight edges.
   const qx=Math.abs(px)-hw+r,qy=Math.abs(py)-hh+r,ox=Math.max(qx,0),oy=Math.max(qy,0),length=Math.hypot(ox,oy);
   const nx=length?Math.sign(px)*ox/length:qx>qy?Math.sign(px):0,ny=length?Math.sign(py)*oy/length:qy>=qx?Math.sign(py):0;
   const t=depth>0&&d<=0?clamp(1+d/depth,0,1):0,falloff=t*t*(3-2*t);
   for(const [data,n]of [[across,nx],[down,ny]]){const grey=Math.round(255*(.5-.5*n*falloff));data[i]=data[i+1]=data[i+2]=grey;data[i+3]=255;}
  }
  return {width:w,height:h,across,down};
 }
 function dataURLs(w,h,r,d){const p=pixels(w,h,r,d),canvas=document.createElement('canvas');canvas.width=p.width;canvas.height=p.height;const ctx=canvas.getContext('2d'),image=ctx.createImageData(p.width,p.height);const encode=bytes=>{image.data.set(bytes);ctx.putImageData(image,0,0);return canvas.toDataURL();};return {across:encode(p.across),down:encode(p.down)};}
 const api={distance,pixels,dataURLs};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GumLiquidMap=api;
})(globalThis);
