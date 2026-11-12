const test=require('node:test'),assert=require('node:assert/strict');const Headline=require('../app/headline.js');
function clock(){let now=0,id=0;const tasks=new Map();return {tasks,set(fn,ms){const next=++id;tasks.set(next,{fn,at:now+ms});return next;},clear(id){tasks.delete(id);},advance(ms){const end=now+ms;for(;;){const first=[...tasks].sort((a,b)=>a[1].at-b[1].at)[0];if(!first||first[1].at>end)break;now=first[1].at;tasks.delete(first[0]);first[1].fn();}now=end;}};}
test('phrase settings trim and deduplicate while rejecting invalid text and timing',()=>{
 assert.deepEqual(Headline.parse(' First\n\nSecond\n First '),['First','Second']);assert.deepEqual(Headline.parse(''),[]);assert.deepEqual(Headline.settingsPatch({theme:'dark'}),{});
 for(const p of [{homePhrases:['x'.repeat(161)]},{homePhrases:'not an array'},{homePhrases:['A\tB']},{homePhraseSeconds:29},{homePhraseSeconds:601},{homePhraseSeconds:60.1},{homeTypewriter:'yes'}])assert.throws(()=>Headline.settingsPatch(p));
 assert.deepEqual(Headline.settingsPatch({homePhrases:[],homePhraseSeconds:60,homeTypewriter:false}),{homePhrases:[],homePhraseSeconds:60,homeTypewriter:false});
});
test('typewriter types complete emoji graphemes, holds, erases and changes without busy timers',()=>{
 const c=clock(),frames=[];const runner=Headline.create({items:['A👩🏽‍💻','Second'],intervalMs:30000,write:f=>frames.push(f),setTimer:c.set,clearTimer:c.clear});assert.equal(frames.at(-1).text,'A');c.advance(35);assert.equal(frames.at(-1).text,'A👩🏽‍💻');assert.equal(frames.at(-1).typing,false);c.advance(29999);assert.equal(frames.at(-1).text,'A👩🏽‍💻');c.advance(1);assert.equal(frames.at(-1).text,'A');c.advance(198);assert.equal(frames.at(-1).text,'S');assert.equal(runner.index,1);runner.stop();assert.equal(c.tasks.size,0);const count=frames.length;c.advance(90000);assert.equal(frames.length,count);
});
test('pause, reduced motion and a single phrase avoid background cycling',()=>{
 const c=clock(),frames=[];const runner=Headline.create({items:['First','Second'],intervalMs:30000,write:f=>frames.push(f),setTimer:c.set,clearTimer:c.clear});runner.pause();assert.equal(frames.at(-1).text,'First');assert.equal(c.tasks.size,0);c.advance(60000);assert.equal(runner.index,0);runner.resume();assert.equal(c.tasks.size,1);runner.next();assert.equal(runner.index,1);runner.stop();
 const staticFrames=[];const fixed=Headline.create({items:['First','Second'],animate:false,write:f=>staticFrames.push(f),setTimer:c.set,clearTimer:c.clear});assert.equal(staticFrames.at(-1).text,'First');assert.equal(c.tasks.size,0);fixed.next();assert.equal(staticFrames.at(-1).text,'Second');fixed.stop();
 const one=Headline.create({items:['Single'],write(){},setTimer:c.set,clearTimer:c.clear});c.advance(2000);assert.equal(c.tasks.size,0);one.stop();
});
