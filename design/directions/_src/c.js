// Direction C: Atlas noci. Czechia read as a star chart; every calendar is a star, a village is a constellation that grows each night.
const {D,T,qrPath,page,tonightCount,V,cz}=require('./common');
const C={ground:'#0b0d0b',ground2:'#121511',hair:'#2b2e27',line:'#4b4b40',mid:'#8c8672',text:'#ece3cc',star:'#ffe6b0',amber:'#f5b54e',gold:'#efc56d'};
const f=n=>+n.toFixed(2);
const LON0=12.09,LAT1=51.06,K=Math.cos(49.8*Math.PI/180),S=1000/((18.86-12.09)*K);
const css=`
:root{--ground:${C.ground};--text:${C.text};--mid:${C.mid};--gold:${C.gold};--line:${C.line}}
body{background:var(--ground);color:var(--text);font-family:'Jost',sans-serif;-webkit-font-smoothing:antialiased;position:relative}
::selection{background:var(--gold);color:var(--ground)}
svg.full{position:absolute;inset:0}
.it{font-family:'EB Garamond',serif;font-style:italic;font-weight:400;letter-spacing:-.005em}
.caps{font-family:'Jost',sans-serif;font-weight:500;text-transform:uppercase;letter-spacing:.16em;font-size:12px}
.btn{display:flex;align-items:center;justify-content:center;gap:10px;height:52px;border:0;border-radius:2px;font:500 14px 'Jost',sans-serif;text-transform:uppercase;letter-spacing:.16em}
.btn.gold{background:var(--gold);color:#16130c}
.btn.line{background:transparent;color:var(--text);box-shadow:inset 0 0 0 1px var(--mid)}
.btn:focus-visible{outline:1px solid var(--gold);outline-offset:4px}
@keyframes kindle{0%{opacity:0;r:0}100%{opacity:1}}
.kindle{animation:kindle 1.8s cubic-bezier(.16,1,.3,1) both}
`;
// star mark: crisp disc, the window cross is cut into the brightest ones
function star(x,y,r,{cross=false,ring=false,col=C.star}={}){let o='';
  if(ring)o+=`<circle cx="${x}" cy="${y}" r="${f(r+5.5)}" fill="none" stroke="${C.amber}" stroke-width="1.1"/><path d="M${x} ${f(y-r-9)}v-5M${x} ${f(y+r+9)}v5M${f(x-r-9)} ${y}h-5M${f(x+r+9)} ${y}h5" stroke="${C.amber}" stroke-width="1.1"/>`;
  o+=`<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>`;
  if(cross)o+=`<path d="M${x} ${f(y-r)}V${f(y+r)}M${f(x-r)} ${y}H${f(x+r)}" stroke="${C.ground}" stroke-width="${f(Math.max(.9,r*.2))}"/>`;
  return o}
function republika(){
  const k=340/cz.W,ox=16,oy=318,mapH=cz.H*k;
  const P=c=>[f(ox+c.x*k),f(oy+c.y*k)];
  let grat='',ticks='';
  for(let lon=13;lon<=18;lon++){const x=f(ox+(lon-LON0)*K*S*k);grat+=`M${x} ${oy-14}V${f(oy+mapH+14)}`;ticks+=`<text x="${x}" y="${oy-20}" text-anchor="middle">${lon}°</text>`}
  for(let lat=49;lat<=51;lat++){const y=f(oy+(LAT1-lat)*S*k);grat+=`M${ox-8} ${y}H${ox+344}`;ticks+=`<text x="${ox+348}" y="${f(y+3)}" text-anchor="start">${lat}°</text>`}
  let stars='';
  const sorted=[...D.calendars].sort((a,b)=>a.lit-b.lit);
  for(const c of sorted){const [x,y]=P(c);const r=f(.7+c.lit*.16);
    stars+=c.tonight?star(x,y,r):`<circle cx="${x}" cy="${y}" r="1.3" fill="none" stroke="${C.mid}" stroke-width=".7"/>`}
  const regions=cz.kraje.map(r=>r.d).join('');
  const lg=(x,r,t)=>`<g>${star(x,8,r)}<text x="${x+r+6}" y="12" font-family="Jost" font-size="12" fill="${C.mid}">${t}</text></g>`;
  const body=`<svg class="full" width="390" height="844" viewBox="0 0 390 844">
  <path d="${grat}" stroke="${C.hair}" stroke-width=".6" fill="none"/>
  <g font-family="Jost" font-size="9" fill="${C.mid}" letter-spacing=".05em">${ticks}</g>
  <g transform="translate(${ox} ${oy}) scale(${f(k)})" fill="none">
    <path d="${regions}" stroke="${C.line}" stroke-width="1.6" stroke-dasharray="5 4"/>
    <path d="${regions}" stroke="${C.mid}" stroke-width="3" stroke-linejoin="round"/><path d="${regions}" fill="${C.ground}"/><path d="${regions}" stroke="${C.line}" stroke-width="1.4" stroke-dasharray="5 4"/>
  </g>
  <g transform="translate(${ox} ${oy}) scale(${f(k)})"><g id="outline"></g></g>
  <g class="kindle">${stars}</g>
  </svg>
  <header style="position:absolute;left:24px;right:24px;top:52px">
    <h1 class="it" style="font-size:44px;line-height:1">${T.date.replace('sobota ','Sobota<br>')}</h1>
    <p class="caps" style="color:var(--mid);margin-top:14px">${T.app}</p>
  </header>
  <section style="position:absolute;left:24px;right:24px;bottom:34px">
    <svg width="342" height="18" style="display:block;overflow:visible">${lg(4,1,'1 okno')}${lg(78,1.8,'6 oken')}${lg(156,2.6,'11 oken')}<g><circle cx="244" cy="8" r="1.6" fill="none" stroke="${C.mid}" stroke-width=".9"/><text x="252" y="12" font-family="Jost" font-size="12" fill="${C.mid}">dnes nesvítí</text></g></svg>
    <div style="height:1px;background:var(--line);margin:18px 0 18px"></div>
    <h2 class="it" style="font-size:29px;line-height:1.1">${T.republikaHead(tonightCount)}</h2>
    <p style="font-size:16px;line-height:1.45;color:var(--mid);margin:6px 0 22px">${T.republikaSub}</p>
    <div style="display:flex;gap:10px">
      <button class="btn gold" style="flex:1.45">${reticle(0,0,'#16130c',true)}${T.locate}</button>
      <button class="btn line" style="flex:1">${T.search}</button>
    </div>
  </section>`;
  return page({title:'C Atlas noci, republika',css,body})}
function reticle(x,y,c,icon=false){const s=`<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="${c}" stroke-width="1.4"/><path d="M${x} ${y-10}v6M${x} ${y+4}v6M${x-10} ${y}h6M${x+4} ${y}h6" stroke="${c}" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="1.4" fill="${c}"/>`;return icon?`<svg width="22" height="22" viewBox="-11 -11 22 22">${s}</svg>`:s}
function villageSvg({dim=false}={}){
  const w={trunk:1.6,primary:1.6,tertiary:1.4,minor:1.1,service:.8,track:.6,path:.5,rail:.8,bridge:1.4};
  let roads='';for(const [k,arr] of Object.entries(V.roads)){if(!w[k])continue;roads+=`<path d="${arr.join('')}" stroke="${k==='track'||k==='path'?C.hair:'#3a3c33'}" stroke-width="${w[k]}"${k==='rail'?' stroke-dasharray="4 2"':''}/>`}
  const [tx,ty]=V.tonight,[ux,uy]=V.user;const mpp=V.metersPerPx;
  let rings='';for(const m of [250,500,1000]){const r=f(m/mpp);rings+=`<circle cx="${ux}" cy="${uy}" r="${r}" fill="none" stroke="${C.line}" stroke-width=".7" stroke-dasharray="1 3"/><text x="${f(ux+4)}" y="${f(uy+r-5)}" font-family="Jost" font-size="10" fill="${C.mid}" letter-spacing=".04em">${m<1000?m+' m':'1 km'}</text>`}
  const seq=[...V.past,V.tonight];
  const cons='M'+seq.map(p=>p.join(' ')).join('L');
  const past=V.past.map(([x,y],i)=>`${star(x,y,2.4,{col:'#cdb787'})}<text x="${f(x+5)}" y="${f(y-4)}" font-family="EB Garamond" font-style="italic" font-size="12" fill="${C.mid}">${i+1}</text>`).join('');
  return `<svg class="full" width="390" height="844" viewBox="0 0 390 844">
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">${roads}<path d="${V.buildings.join('')}" stroke="${C.hair}" stroke-width=".5"/><path d="${V.waterway.join('')}" stroke="${C.hair}" stroke-width=".7" stroke-dasharray="2 2"/></g>
  ${rings}
  <path d="${cons}" fill="none" stroke="${C.mid}" stroke-width=".8" opacity=".75"/>
  ${past}
  <g class="kindle">${star(tx,ty,5.5,{ring:true,cross:true})}<text x="${tx+20}" y="${ty-14}" font-family="EB Garamond" font-style="italic" font-size="17" fill="${C.amber}">12</text></g>
  ${reticle(ux,uy,C.text)}
  ${dim?`<rect width="390" height="844" fill="${C.ground}" opacity=".3"/>`:''}
  </svg>`}
const topBar=`<nav style="position:absolute;top:46px;left:16px;right:16px;display:flex;justify-content:space-between">
  <button class="btn line" style="height:44px;padding:0 16px 0 12px;font-size:12px;background:${C.ground}">
   <svg width="12" height="12" viewBox="0 0 12 12"><path d="M8 1L3 6l5 5" fill="none" stroke="${C.text}" stroke-width="1.4"/></svg>${T.back}</button>
  <button class="btn line" aria-label="Moje poloha" style="width:44px;height:44px;padding:0;background:${C.ground}">${reticle(0,0,C.text,true)}</button></nav>`;
function okoli(){
  const body=`${villageSvg()}${topBar}
  <section style="position:absolute;left:0;right:0;bottom:0;padding:22px 24px 34px;background:${C.ground};border-top:4px double ${C.line}">
    <div style="display:flex;align-items:center;gap:16px">
      <svg width="34" height="34" viewBox="-17 -17 34 34">${star(0,0,5,{ring:true,cross:true}).replace(/v-5|v5|h-5|h5/g,m=>m[0]+(m[1]==='-'?'-2':'2'))}</svg>
      <div style="flex:1"><h2 class="it" style="font-size:26px;line-height:1.1">${T.okoliHead}</h2>
      <p style="font-size:15px;color:var(--mid);margin-top:4px">${T.okoliSub}</p></div>
      <svg width="10" height="18" viewBox="0 0 10 18"><path d="M1.5 1.5l7 7.5-7 7.5" fill="none" stroke="${C.text}" stroke-width="1.6"/></svg>
    </div>
    <p style="font-size:13px;color:var(--mid);margin-top:16px;display:flex;align-items:center;gap:10px">
      <svg width="40" height="10" viewBox="0 0 40 10"><path d="M4 7L20 3L36 6" stroke="${C.mid}" stroke-width=".8" fill="none"/>${star(4,7,2.2,{col:'#cdb787'})}${star(20,3,2.2,{col:'#cdb787'})}${star(36,6,2.2,{col:'#cdb787'})}</svg>Okénka, která už svítila, spojuje čára po dnech</p>
  </section>`;
  return page({title:'C Atlas noci, okolí',css,body})}
function karta(){
  const top=410;
  const row=(l,v,big)=>`<div style="display:grid;grid-template-columns:84px 1fr;gap:10px;padding:14px 0 15px;border-top:1px solid ${C.hair}"><span class="caps" style="font-size:11px;color:var(--mid);padding-top:5px">${l}</span><span style="font-family:'EB Garamond';font-size:${big?19:18}px;line-height:1.4">${v}</span></div>`;
  const body=`${villageSvg({dim:true})}${topBar}
  <section style="position:absolute;left:0;right:0;top:${top}px;bottom:0;background:${C.ground2};border-top:4px double ${C.mid}">
    <div style="padding:22px 24px 0">
      <h2 class="it" style="font-size:42px;line-height:1">${T.house}</h2>
      <p class="caps" style="color:var(--mid);margin:10px 0 14px">${T.houseMeta}</p>
      ${row('Svítí','dnes od pěti do osmi večer',true)}
      ${row('Program',T.houseProgram)}
      ${row('Cesta',T.houseWalk)}
      <button class="btn gold" style="width:100%;height:54px;margin-top:10px"><svg width="16" height="16" viewBox="0 0 18 18"><path d="M2 8.5L16 2l-6.5 14-1.6-5.9z" fill="#16130c"/></svg>${T.navigate}</button>
      <p style="font-size:14px;color:var(--mid);margin-top:10px;text-align:center">${T.navigateHint}</p>
    </div>
  </section>`;
  return page({title:'C Atlas noci, karta domečku',css,body})}

function razitka(){
  const W=592,H=840,m=22,ink='#191a16',paper='#ffffff',grey='#6e6b60';
  const fx=m,fy=m,fw=W-2*m,fh=H-2*m;
  let grat='';for(let x=fx+fw/8;x<fx+fw;x+=fw/8)grat+=`M${f(x)} ${fy}V${fy+fh}`;for(let y=fy+60;y<fy+fh;y+=fh/10)grat+=`M${fx} ${f(y)}H${fx+fw}`;
  const cols=4,rows=6,top=188,rh=94,d=66,cw=(fw-40)/cols;
  const pos=T.card.days.map((_,i)=>{const r=Math.floor(i/cols),c=i%cols;return [f(fx+20+cw*c+cw/2+(r%2?-10:10)+((i*17)%9-4)),f(top+r*rh+d/2+((i*11)%7-3))]});
  const line=pos.map((p,i)=>i%cols?`L${p.join(' ')}`:`M${p.join(' ')}`).join('');
  let fields='';T.card.days.forEach((lab,i)=>{const [x,y]=pos[i];fields+=`<circle cx="${x}" cy="${y}" r="${d/2+5}" fill="${paper}"/><circle cx="${x}" cy="${y}" r="${d/2}" fill="${paper}" stroke="${ink}" stroke-width="1.3"/><circle cx="${x}" cy="${y}" r="${d/2+4}" fill="none" stroke="${ink}" stroke-width=".5" stroke-dasharray="1.5 2.5"/>
    <text x="${f(x-d/2-4)}" y="${f(y-d/2+10)}" text-anchor="end" font-family="EB Garamond" font-style="italic" font-weight="500" font-size="19" fill="${ink}">${i+1}</text>
    ${lab?`<text x="${x}" y="${f(y+d/2+17)}" text-anchor="middle" font-family="EB Garamond" font-style="italic" font-size="13.5" fill="#3a3a33">${lab}</text>`:''}`});
  const body=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${paper}"/>
  <path d="${grat}" stroke="#d9d6cb" stroke-width=".6"/>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="none" stroke="${ink}" stroke-width="1.6"/><rect x="${fx+4}" y="${fy+4}" width="${fw-8}" height="${fh-8}" fill="none" stroke="${ink}" stroke-width=".5"/>
  <rect x="${fx+5}" y="${fy+5}" width="${fw-10}" height="150" fill="${paper}"/>
  <text x="${fx+22}" y="${fy+38}" font-family="Jost" font-weight="500" font-size="12" letter-spacing="2.4" fill="${ink}">ADVENTNÍ OKÉNKA</text>
  <text x="${fx+20}" y="${fy+92}" font-family="EB Garamond" font-style="italic" font-size="52" fill="${ink}">${T.card.place} ${T.card.year}</text>
  <text x="${fx+22}" y="${fy+122}" font-family="Jost" font-size="12" letter-spacing="1.6" fill="${grey}">KARTA NA RAZÍTKA  ·  50°42′ S. Š.  15°07′ V. D.</text>
  <g transform="translate(${fx+fw-102} ${fy+22})"><path d="${qrPath(80)}" fill="${ink}"/></g>
  <text x="${fx+fw-62}" y="${fy+118}" text-anchor="middle" font-family="Jost" font-size="8.5" fill="${grey}">${T.card.url}</text>
  <path d="M${fx+5} ${fy+150}H${fx+fw-5}" stroke="${ink}" stroke-width=".5"/>
  <path d="${line}" fill="none" stroke="${ink}" stroke-width=".8" stroke-dasharray="3 3"/>
  ${fields}
  <rect x="${fx+5}" y="${H-m-74}" width="${fw-10}" height="69" fill="${paper}"/>
  <path d="M${fx+5} ${H-m-74}H${fx+fw-5}" stroke="${ink}" stroke-width=".5"/>
  <text x="${fx+20}" y="${H-m-46}" font-family="Jost" font-weight="500" font-size="11" letter-spacing="1.8" fill="${ink}">JMÉNO</text>
  <path d="M${fx+80} ${H-m-46}H${fx+fw-20}" stroke="${ink}" stroke-width=".8"/>
  <foreignObject x="${fx+20}" y="${H-m-38}" width="${fw-40}" height="34"><p xmlns="http://www.w3.org/1999/xhtml" style="font:italic 400 13.5px/1.3 'EB Garamond';color:#2a2a24">${T.card.howto}</p></foreignObject>
  </svg>`;
  return page({title:'C Atlas noci, karta na razítka',css:css+`body{background:${paper};color:${ink}}`,body,w:W,h:H})}
module.exports={republika,okoli,karta,razitka};
