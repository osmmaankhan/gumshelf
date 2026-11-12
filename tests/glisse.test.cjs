const test=require('node:test');const assert=require('node:assert/strict');
// glisse.js touches DOM APIs only when used; stub the few globals it reads at load.
globalThis.matchMedia ??= ()=>({matches:false,addEventListener(){}});
globalThis.ResizeObserver ??= class{observe(){}unobserve(){}};
globalThis.MutationObserver ??= class{observe(){}};
globalThis.document ??= {documentElement:{},addEventListener(){}};
const G=require('../app/glisse/glisse.js');

test('lens map leaves the middle untouched and pulls inward at the rim',()=>{
 const m=G.lensMap({width:80,height:40,radius:20},G.GLASS,1);
 const at=(data,x,y)=>data[(y*m.columns+x)*4];
 assert.equal(m.columns,80);assert.equal(m.rows,40);
 assert.ok(Math.abs(at(m.across,40,20)-128)<=1,'centre has no pull across');
 assert.ok(Math.abs(at(m.down,40,20)-128)<=1,'centre has no pull down');
 assert.ok(at(m.across,2,20)>150,'left rim pulls from the right (lighter grey)');
 assert.ok(at(m.across,77,20)<106,'right rim pulls from the left (darker grey)');
});
test('rim light sits on the edge and fades within ~2.5px',()=>{
 const r=G.rimMap({width:60,height:30,radius:15},0.3,1,[0,0,0,0]);
 const alpha=(x,y)=>r.data[(y*r.columns+x)*4+3];
 assert.ok(alpha(30,0)>0||alpha(0,15)>0,'edge is lit');
 assert.equal(alpha(30,15),0,'centre is clear');
 assert.equal(alpha(30,5),0,'5px in is clear');
});
test('press feel matches Glisse constants',()=>{
 assert.deepEqual(G.POINTER,{grow:6,press:[417.6,29.2],release:[230,23.7]});
 assert.deepEqual(G.TOUCH,{grow:15,press:[515,27.3],release:[250,11.8]});
});
test('rounded-rect distance is negative inside, zero on the edge',()=>{
 assert.ok(G.distance(0,0,40,20,10)<0);assert.ok(Math.abs(G.distance(40,0,40,20,10))<1e-9);assert.ok(G.distance(50,0,40,20,10)>0);
});
