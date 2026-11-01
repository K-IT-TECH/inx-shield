import {build} from 'esbuild';
import {cp,mkdir,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('dist',{recursive:true});for(const entry of await readdir('dist'))await rm('dist/'+entry,{recursive:true,force:true});await cp('public','dist',{recursive:true});
const icons=JSON.parse(await readFile('scripts/icons.json','utf8'));
for(const size of [192,512])await writeFile(`dist/icon-${size}.png`,Buffer.from(icons[size],'base64'));
await build({entryPoints:['src/app.js'],outfile:'dist/app.js',bundle:true,minify:true,format:'esm',target:['es2022']});
const hash=createHash('sha256').update(await readFile('dist/app.js')).update(await readFile('public/index.html')).update(await readFile('public/styles.css')).update(await readFile('public/sw.js')).update(await readFile('public/manifest.webmanifest')).digest('hex').slice(0,12);
await writeFile('dist/sw.js',(await readFile('public/sw.js','utf8')).replace('__BUILD__',hash));
await mkdir('dist/extension',{recursive:true});for(const file of ['manifest.json','popup.html','popup.css'])await cp('extension/'+file,'dist/extension/'+file);
await writeFile('dist/extension/icon-128.png',Buffer.from(icons[128],'base64'));
await build({entryPoints:['extension/popup-source.js'],outfile:'dist/extension/popup.js',bundle:true,minify:true,format:'iife',target:['es2022']});
// Store-only ZIP: no platform-specific archiver is needed on the build host.
function crc32(buffer){let c=0xffffffff;for(const byte of buffer){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
const chunks=[],central=[];let offset=0;
for(const name of ['manifest.json','popup.html','popup.css','popup.js','icon-128.png']){const data=await readFile('dist/extension/'+name),filename=Buffer.from(name),crc=crc32(data);const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt32LE(crc,14);h.writeUInt32LE(data.length,18);h.writeUInt32LE(data.length,22);h.writeUInt16LE(filename.length,26);chunks.push(h,filename,data);const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(filename.length,28);c.writeUInt32LE(offset,42);central.push(c,filename);offset+=h.length+filename.length+data.length;}
const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(5,8);end.writeUInt16LE(5,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);await writeFile('dist/inx-shield-extension.zip',Buffer.concat([...chunks,directory,end]));
console.log('Built app, offline worker and installable extension.');

