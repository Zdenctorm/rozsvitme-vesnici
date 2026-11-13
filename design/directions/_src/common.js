const fs=require('fs'),path=require('path');
const D=require('./data'),T=require('./strings');
const qr=JSON.parse(fs.readFileSync(path.join(__dirname,'qr.json')));
// QR as one SVG path, size in user units
function qrPath(size){const n=qr.length,u=size/n;let d='';qr.forEach((r,y)=>r.forEach((v,x)=>{if(v)d+=`M${(x*u).toFixed(2)} ${(y*u).toFixed(2)}h${u.toFixed(2)}v${u.toFixed(2)}h-${u.toFixed(2)}z`}));return d}
function page({title,css,body,w=390,h=844}){return `<!doctype html>
<html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><link rel="stylesheet" href="fonts.css"><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px;overflow:hidden}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
${css}</style></head><body>${body}</body></html>`}
function write(dir,name,html){fs.writeFileSync(path.join(__dirname,'..',dir,name+'.html'),html)}
const tonightCount=D.calendars.filter(c=>c.tonight).length;
module.exports={D,T,qrPath,page,write,tonightCount,V:D.village,cz:D.cz};
