const path=require('node:path');
// Appearance-only local artwork choice. Invalid or absent overrides use the bundled icon.
module.exports=function(nativeImage,directory,fallback){const candidate=path.join(directory,'app-icon.png');try{if(!nativeImage.createFromPath(candidate).isEmpty())return candidate;}catch{}return fallback;};
