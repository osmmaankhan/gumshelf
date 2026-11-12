const property=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
window.GlassProbe={configure(vertical,displaced){
 document.body.classList.toggle('vertical',vertical);
 const canvas=document.querySelector('#grid');canvas.width=innerWidth;canvas.height=innerHeight;const ctx=canvas.getContext('2d'),cell=parseFloat(property('--space-xl')),phase=parseFloat(property('--space-sm'));
 // Put a grid transition inside each edge band instead of aligning every
 // boundary with the outside of the plane, where clipping hides displacement.
 for(let y=-cell;y<canvas.height;y+=cell)for(let x=-cell;x<canvas.width;x+=cell){ctx.fillStyle=property((x/cell+y/cell)%2?'--color-mono-light-accent':'--color-mono-dark-accent');ctx.fillRect(x+phase,y+phase,cell,cell);}
 const plane=document.querySelector('#plane'),r=plane.getBoundingClientRect();
 document.querySelector('#probe-map').setAttribute('href',GumGlassMap.dataURL(r.width,r.height,parseFloat(property('--radius-hero')),parseFloat(property('--space-md'))));
 document.querySelector('#probe-displacement').setAttribute('scale',displaced?property('--glass-displacement'):0);
 return {x:r.x,y:r.y,width:r.width,height:r.height};
}};
