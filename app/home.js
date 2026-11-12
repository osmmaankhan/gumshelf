(function(root){
 const ideas=[
  ['mockups','Give an idea a place to live.','Try presenting one of your designs in a mockup.'],
  ['fonts','Let the type do the talking.','Explore a new headline or pair two typefaces for a small poster.'],
  ['brushes','Make something by hand.','Try a brush you have been meaning to use in a quick sketch.'],
  ['textures','Start with a little texture.','Use one texture as the starting point for a new visual direction.'],
  ['models','Build a small world.','Explore a 3D asset and sketch out a scene around it.'],
  ['courses','A little learning goes a long way.','Pick one lesson and turn it into a small practice project.'],
  ['branding','Give a new idea an identity.','Explore a branding resource for your next visual concept.'],
  ['ae-projects','Find a little momentum.','Explore an After Effects project as a starting point for motion.']
 ];
 function suggestions(products,catalog,seed=0){
  const visible=products.filter(p=>!p.hidden&&!p.archived);
  const groups=new Map();for(const p of visible){const type=catalog.infer(p).type;if(!groups.has(type))groups.set(type,[]);groups.get(type).push(p);}
  const available=ideas.filter(i=>groups.has(i[0]));
  const idea=available.length?available[Math.abs(seed)%available.length]:['','A little room for your next idea.','Choose something from your library and spend a few minutes exploring it.'];
  const pool=groups.get(idea[0])||visible;
  const picks=[];if(pool.length){const start=Math.abs(Math.floor(seed/Math.max(available.length,1)))%pool.length;for(let n=0;n<Math.min(3,pool.length);n++)picks.push(pool[(start+n)%pool.length]);}
  return {type:idea[0],title:idea[1],body:idea[2],products:picks,visibleCount:visible.length,savedCount:visible.filter(p=>p.saved).length};
 }
 const api={suggestions};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GumHome=api;
})(globalThis);
