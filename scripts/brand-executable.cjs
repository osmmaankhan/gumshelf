/* Build-only resource branding. Does not load main.cjs or any library data. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
if(process.argv.includes('--help')){console.log('Close GumShelf first. This tool changes only its Windows icon/version resources and keeps an executable backup. No product data is read.');process.exit(0);}
if(process.platform!=='win32')throw Error('Run this Windows resource step on Windows.');
const root=path.resolve(__dirname,'..'),pkg=require('../package.json'),target=process.argv[2]?path.resolve(process.argv[2]):path.resolve(root,pkg.build.directories.output,'win-unpacked','GumShelf.exe');
if(path.basename(target).toLowerCase()!=='gumshelf.exe'||!fs.existsSync(target))throw Error('GumShelf.exe was not found.');
const localIcon=path.join(path.dirname(target),'resources','branding','desktop-icon.ico'),icon=fs.existsSync(localIcon)?localIcon:path.join(root,'app','brand.ico'),tool=path.join(root,'node_modules','electron-winstaller','vendor','rcedit.exe');
if(!fs.existsSync(tool))throw Error('The development workspace resource tool is missing.');
const backup=target+'.icon-backup';if(!fs.existsSync(backup))fs.copyFileSync(target,backup);
const version=pkg.version+'.0',result=spawnSync(tool,[target,'--set-icon',icon,'--set-version-string','ProductName','GumShelf','--set-version-string','FileDescription','GumShelf','--set-version-string','OriginalFilename','GumShelf.exe','--set-file-version',version,'--set-product-version',version],{stdio:'inherit',windowsHide:true});
if(result.error||result.status!==0)throw Error('Close GumShelf and try again. The executable backup is kept at '+backup);
console.log('Windows icon resources updated. App data and app.asar were not changed.');
