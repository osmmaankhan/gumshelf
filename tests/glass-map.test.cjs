const test=require('node:test'),assert=require('node:assert/strict');
const {pixels}=require('../app/glass-map.js');
test('rounded-rectangle displacement points toward distinct edges while preserving a neutral center',()=>{
 const w=100,h=80,p=pixels(w,h,20,12),at=(x,y,c)=>p[(y*w+x)*4+c];
 assert.ok(at(2,40,0)<128);assert.ok(at(97,40,0)>128);
 assert.ok(at(50,2,1)<128);assert.ok(at(50,77,1)>128);
 assert.equal(at(50,40,0),128);assert.equal(at(50,40,1),128);
 assert.equal(at(50,40,3),255);
});
test('horizontal and vertical navigation maps are bounded with opaque byte encoding',()=>{
 for(const [w,h]of [[640,56],[56,640],[1,1]]){
  const p=pixels(w,h,24,12);assert.equal(p.length,w*h*4);
  for(let i=3;i<p.length;i+=4)assert.equal(p[i],255);
 }
});
