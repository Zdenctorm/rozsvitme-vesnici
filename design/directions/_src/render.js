const {chromium}=require('/opt/node-tools/node_modules/playwright');const path=require('path');
(async()=>{const b=await chromium.launch();
for(const d of process.argv.slice(2))for(const n of ['map-republika','map-okoli','karta-domecku','karta-razitka','karta-razitka-bw']){
 const card=n.startsWith('karta-razitka');const p=await b.newPage({viewport:card?{width:592,height:840}:{width:390,height:844},deviceScaleFactor:2,reducedMotion:'reduce'});
 await p.goto('file://'+path.resolve(__dirname,'..',d,n+'.html'));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(250);
 await p.screenshot({path:path.resolve(__dirname,'..',d,n+'.png')});await p.close()}
await b.close()})();
