// Direction B: Papírový betlém. Layers of cut paper in a dark box; light shines through the cuts.
const {D,T,qrPath,page,tonightCount,V,cz}=require('./common');
const C={back:'#0c0a09',sheet:'#1b1815',raised:'#26211d',edge:'#332c25',paper:'#efe4cd',paperInk:'#2a2018',paperMute:'#6b5a46',light:'#ffd88a',lightHot:'#fff4dc',ember:'#e8963a'};
const f=n=>+n.toFixed(2);
const defs=`<defs>
<filter id="lift" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#000" flood-opacity=".75"/></filter>
<filter id="liftS" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="1.4" stdDeviation="1.2" flood-color="#000" flood-opacity=".8"/></filter>
<filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="glowL" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="16"/></filter>
<filter id="fibre" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.55 0.9" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .92  0 0 0 0 .8  0 0 0 .07 -.01"/></filter>
<filter id="fibreDark" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .22  0 0 0 0 .14  0 0 0 .14 -.02"/></filter>
<radialGradient id="pane" cx="50%" cy="62%" r="70%"><stop offset="0" stop-color="${C.lightHot}"/><stop offset=".55" stop-color="${C.light}"/><stop offset="1" stop-color="${C.ember}"/></radialGradient>
<radialGradient id="spill" r="50%"><stop offset="0" stop-color="${C.light}" stop-opacity=".55"/><stop offset=".45" stop-color="${C.ember}" stop-opacity=".18"/><stop offset="1" stop-color="${C.ember}" stop-opacity="0"/></radialGradient>
</defs>`;
// arched window cut out of paper: light behind, paper mullions
function archWindow(cx,cy,w,{paper=C.sheet,glow=true}={}){
  const h=w*1.35,x=cx-w/2,y=cy-h/2,r=w/2,m=Math.max(1.2,w*0.1);
  const arch=`M${f(x)} ${f(y+h)}V${f(y+r)}A${f(r)} ${f(r)} 0 0 1 ${f(x+w)} ${f(y+r)}V${f(y+h)}Z`;
  return `${glow?`<path d="${arch}" fill="${C.light}" filter="url(#glow)" opacity=".9"/>`:''}<path d="${arch}" fill="url(#pane)"/>
  <path d="M${f(cx)} ${f(y)}V${f(y+h)}M${f(x)} ${f(y+h*0.52)}H${f(x+w)}" stroke="${paper}" stroke-width="${f(m)}"/>
  <path d="${arch}" fill="none" stroke="${paper}" stroke-width="${f(m*0.9)}"/>`}
const css=`
:root{--back:${C.back};--paper:${C.paper};--ink:${C.paperInk};--mute:${C.paperMute};--light:${C.light}}
body{background:var(--back);color:var(--paper);font-family:'Albert Sans',sans-serif;-webkit-font-smoothing:antialiased;position:relative}
::selection{background:var(--light);color:var(--ink)}
svg.full{position:absolute;inset:0}
.serif{font-family:'Young Serif',serif;font-weight:400;letter-spacing:-.01em}
.tag{background:var(--paper);color:var(--ink);box-shadow:0 2px 3px rgba(0,0,0,.5),0 8px 18px rgba(0,0,0,.45);border:0}
.btn{display:flex;align-items:center;justify-content:center;gap:10px;height:52px;border-radius:12px;font:700 18px 'Albert Sans',sans-serif;border:0}
.btn:focus-visible{outline:2px solid var(--light);outline-offset:3px}
@keyframes kindle{from{opacity:0}to{opacity:1}}
.kindle{animation:kindle 2.2s cubic-bezier(.16,1,.3,1) both}
`;
const fibreRect=(w,h)=>`<rect width="${w}" height="${h}" filter="url(#fibre)"/>`;
// paper sheet with a cut rooftop skyline as its top edge; one roof window is cut through
function skylineEdge(w,base,seed=1){let d=`M0 ${base}`;let x=0;const wins=[];let i=0;
  const roofs=[[34,18,'g'],[22,0,'f'],[46,26,'g'],[30,8,'f'],[18,30,'t'],[40,20,'g'],[26,0,'f'],[52,24,'g'],[28,12,'h'],[36,22,'g'],[30,0,'f'],[44,28,'g']];
  while(x<w){const [rw,rh,t]=roofs[(i+seed)%roofs.length];const y0=base-8-((i*7)%3)*4;
    d+=`L${x} ${y0}`;
    if(t==='g')d+=`L${f(x+rw/2)} ${y0-rh}L${x+rw} ${y0}`;
    else if(t==='h')d+=`L${x+6} ${y0-rh}L${x+rw-6} ${y0-rh}L${x+rw} ${y0}`;
    else if(t==='t')d+=`L${x+rw*.3} ${y0}L${x+rw*.3} ${y0-rh*.6}L${f(x+rw/2)} ${y0-rh-10}L${x+rw*.7} ${y0-rh*.6}L${x+rw*.7} ${y0}`;
    else d+=`L${x+rw} ${y0}`;
    if(t==='g'&&rh>20)wins.push([x+rw/2,y0-rh*0.42]);
    x+=rw;i++}
  return {d:d+`L${w} ${base}L${w} 2000L0 2000Z`,wins}}

function republika(){
  const k=370/cz.W,ox=10,oy=236;const P=c=>[f(ox+c.x*k),f(oy+c.y*k)];
  let glows='',holes='';
  for(const c of D.calendars){const [x,y]=P(c);const n=c.lit;
    glows+=`<circle cx="${x}" cy="${y}" r="${f(1.5+Math.sqrt(n)*0.8)}" fill="${c.tonight?C.light:C.ember}" opacity="${c.tonight?.38:.16}"/>`;
    for(let i=0;i<n;i++){const a=i*2.39996,r=Math.sqrt(i)*1.25;holes+=`<circle cx="${f(x+Math.cos(a)*r)}" cy="${f(y+Math.sin(a)*r)}" r="${i===0&&c.tonight?1.15:.55}" fill="${i===0&&c.tonight?C.lightHot:C.light}" opacity="${i===0&&c.tonight?1:.7}"/>`}}
  const regions=cz.kraje.map(r=>r.d).join('');
  const sk=skylineEdge(390,560,3);
  const body=`<svg class="full" width="390" height="844" viewBox="0 0 390 844">${defs}
  <g transform="translate(${ox} ${oy}) scale(${f(k)})">
    <path d="${regions}" fill="${C.sheet}" stroke="${C.back}" stroke-width="3.4" stroke-linejoin="round" filter="url(#lift)"/>
  </g>
  <g transform="translate(${ox} ${oy}) scale(${f(k)})" opacity=".9"><clipPath id="cz"><path d="${regions}"/></clipPath><rect width="${cz.W}" height="${cz.H}" filter="url(#fibreDark)" clip-path="url(#cz)"/></g>
  <g class="kindle"><g filter="url(#glow)">${glows}</g>${holes}</g>
  <g filter="url(#lift)"><path d="${sk.d}" fill="${C.paper}"/></g>
  <path d="${sk.d}" filter="url(#fibreDark)" opacity=".5"/>
  ${sk.wins.slice(1,2).map(([x,y])=>archWindow(x,y+4,9,{paper:C.paper})).join('')}
  </svg>
  <header style="position:absolute;left:24px;top:52px;right:24px">
    <h1 class="serif" style="font-size:34px;line-height:1">${T.app}</h1>
    <p style="font-size:16px;color:#bfae92;margin-top:10px">${T.date}</p>
  </header>
  <section style="position:absolute;left:0;right:0;top:584px;bottom:0;padding:16px 24px 0;color:var(--ink);background:var(--paper)">
    <h2 class="serif" style="font-size:26px;line-height:1.1">${T.republikaHead(tonightCount)}</h2>
    <p style="font-size:16px;line-height:1.45;color:var(--mute);margin:8px 0 22px">${T.republikaSub}</p>
    <div style="display:flex;gap:10px">
      <button class="btn" style="flex:1.5;background:var(--ink);color:var(--paper)">${locIcon(C.paper)}${T.locate}</button>
      <button class="btn" style="flex:1;background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--ink)">${T.search}</button>
    </div>
  </section>`;
  return page({title:'B Papírový betlém, republika',css,body})}
function locIcon(c){return `<svg width="20" height="20" viewBox="-10 -10 20 20"><circle r="5.5" fill="none" stroke="${c}" stroke-width="2"/><circle r="2" fill="${c}"/><path d="M0 -9.5V-6.5M0 6.5V9.5M-9.5 0H-6.5M6.5 0H9.5" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`}

// pop-up paper house standing on the map at the point, front view, with the lit arched window
function popupHouse(x,y,s=1){const w=46*s,h=34*s,r=22*s,bx=x-w/2,by=y-h;
  return `<ellipse cx="${x}" cy="${f(y+2)}" rx="${f(w*0.62)}" ry="${f(6*s)}" fill="#000" opacity=".55" filter="url(#glow)"/>
  <g filter="url(#lift)"><path d="M${f(bx)} ${f(y)}V${f(by)}L${f(x)} ${f(by-r)}L${f(bx+w)} ${f(by)}V${f(y)}Z" fill="${C.raised}"/></g>
  <path d="M${f(bx-3*s)} ${f(by+1.5*s)}L${f(x)} ${f(by-r-1*s)}L${f(bx+w+3*s)} ${f(by+1.5*s)}" fill="none" stroke="${C.edge}" stroke-width="${f(3*s)}" stroke-linejoin="round"/>
  ${archWindow(x,f(by+h*0.5),f(15*s),{paper:C.raised})}`}
function villageSvg({dim=false}={}){
  const w={trunk:6,primary:6,tertiary:5,minor:4,service:3,track:1.8,path:1.4,rail:2,bridge:5};
  let cut='',edge='';for(const [k,arr] of Object.entries(V.roads)){if(!w[k])continue;const d=arr.join('');edge+=`<path d="${d}" stroke="${C.edge}" stroke-width="${w[k]+1.4}" transform="translate(0 .9)"/>`;cut+=`<path d="${d}" stroke="${C.back}" stroke-width="${w[k]}"/>`}
  const [tx,ty]=V.tonight,[ux,uy]=V.user;
  const past=V.past.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5" fill="${C.ember}" opacity=".35" filter="url(#glow)"/><rect x="${f(x-1.6)}" y="${f(y-1.6)}" width="3.2" height="3.2" fill="${C.light}" opacity=".75"/>`).join('');
  return `<svg class="full" width="390" height="844" viewBox="0 0 390 844">${defs}
  <rect width="390" height="844" fill="${C.sheet}"/><rect width="390" height="844" filter="url(#fibreDark)"/>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".95">${edge}${cut}<path d="${V.waterway.join('')}" stroke="${C.back}" stroke-width="1.4"/></g>
  <g filter="url(#liftS)"><path d="${V.buildings.join('')}" fill="${C.raised}"/></g>
  ${past}
  <circle cx="${tx}" cy="${ty}" r="120" fill="url(#spill)" class="kindle"/>
  <g filter="url(#lift)"><circle cx="${ux}" cy="${uy}" r="8" fill="${C.paper}"/></g><circle cx="${ux}" cy="${uy}" r="3.2" fill="${C.paperInk}"/>
  ${popupHouse(tx,ty+8,1)}
  ${dim?`<rect width="390" height="844" fill="#000" opacity=".25"/>`:''}
  </svg>`}
const topBar=`<nav style="position:absolute;top:48px;left:16px;right:16px;display:flex;justify-content:space-between">
  <button class="btn tag" style="height:44px;padding:0 16px 0 12px;font-size:16px">
   <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9.5 1.5L3.5 7l6 5.5" fill="none" stroke="${C.paperInk}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>${T.back}</button>
  <button class="btn tag" aria-label="Moje poloha" style="width:44px;height:44px;padding:0;border-radius:50%">${locIcon(C.paperInk)}</button></nav>`;
function okoli(){
  const body=`${villageSvg()}${topBar}
  <section class="tag" style="position:absolute;left:12px;right:12px;bottom:28px;border-radius:16px;padding:18px 20px 18px">
    <div style="display:flex;align-items:center;gap:14px">
      <svg width="30" height="40" viewBox="-15 -20 30 40"><rect x="-15" y="-20" width="30" height="40" rx="4" fill="${C.paperInk}"/>${archWindow(0,0,16,{paper:C.paperInk,glow:false})}</svg>
      <div style="flex:1"><h2 class="serif" style="font-size:20px;line-height:1.15;white-space:nowrap">${T.okoliHead}</h2>
      <p style="font-size:15px;color:var(--mute);margin-top:4px">${T.okoliSub}</p></div>
      <svg width="12" height="20" viewBox="0 0 12 20"><path d="M2 2l8 8-8 8" fill="none" stroke="${C.paperInk}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <p style="font-size:14px;color:var(--mute);margin-top:14px;padding-top:12px;border-top:1px dashed #c9b897;display:flex;gap:10px;align-items:center">
      <svg width="12" height="12" viewBox="-6 -6 12 12"><circle r="5" fill="${C.ember}" opacity=".5"/><rect x="-1.8" y="-1.8" width="3.6" height="3.6" fill="${C.paperInk}"/></svg>${T.doutnaLegend}</p>
  </section>`;
  return page({title:'B Papírový betlém, okolí',css,body})}
function karta(){
  const top=392;const sk=skylineEdge(390,40,5);
  const body=`${villageSvg({dim:true})}${topBar}
  <section style="position:absolute;left:0;right:0;top:${top}px;bottom:0;color:var(--ink);background:linear-gradient(transparent 44px,${C.paper} 44px)">
    <svg class="full" width="390" height="${844-top}" style="position:absolute;inset:0;overflow:visible">${defs}<g filter="url(#lift)"><path d="${sk.d}" fill="${C.paper}"/></g><path d="${sk.d}" filter="url(#fibreDark)" opacity=".45"/></svg>
    <div style="position:relative;padding:58px 24px 0">
      <p style="font-size:15px;color:var(--mute)">${T.houseMeta}</p>
      <h2 class="serif" style="font-size:38px;line-height:1.05;margin-top:6px">${T.house}</h2>
      <p style="font-size:18px;font-weight:700;margin-top:18px">${T.houseTime}</p>
      <p style="font-size:17px;line-height:1.5;margin-top:6px;max-width:34ch">${T.houseProgram}</p>
      <p style="font-size:15px;color:var(--mute);margin-top:12px">${T.houseWalk}</p>
      <button class="btn" style="width:100%;height:56px;margin-top:20px;background:var(--ink);color:var(--paper);font-size:19px;box-shadow:0 2px 0 #00000040,0 8px 16px #2a201833">
        <svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 8.5L16 2l-6.5 14-1.6-5.9z" fill="${C.light}"/></svg>${T.navigate}</button>
      <p style="font-size:14px;color:var(--mute);margin-top:10px;text-align:center">${T.navigateHint}</p>
    </div>
  </section>`;
  return page({title:'B Papírový betlém, karta domečku',css,body})}

function razitka(){
  const W=592,H=840,m=24,ink='#1c1611',paper='#ffffff',warm='#f2b14a';
  const types=['g','h','g2','f','g','t','h','g2'];
  let houses='';const cols=4,rows=6,slot=(W-2*m)/cols,top=146,rh=102;
  T.card.days.forEach((lab,i)=>{const c=i%cols,r=Math.floor(i/cols);const shift=r%2?slot*0.14:-slot*0.06;
    const bw=slot-26,bh=60,x=m+c*slot+13+shift,yb=top+r*rh+84,y=yb-bh;const t=types[(i*3+r)%types.length];
    let roof;const cx=x+bw/2;
    if(t==='g')roof=`M${x-4} ${y}L${cx} ${y-22}L${x+bw+4} ${y}Z`;
    else if(t==='g2')roof=`M${x-4} ${y}L${x+bw*.3} ${y-22}L${x+bw+4} ${y}Z`;
    else if(t==='h')roof=`M${x-4} ${y}L${x+14} ${y-20}L${x+bw-14} ${y-20}L${x+bw+4} ${y}Z`;
    else if(t==='t')roof=`M${x-4} ${y}L${cx} ${y-18}L${x+bw+4} ${y}ZM${x+bw-22} ${y-10}V${y-22}H${x+bw-12}V${y-4}`;
    else roof=`M${x-4} ${y}L${x+4} ${y-12}L${x+bw-4} ${y-12}L${x+bw+4} ${y}Z`;
    houses+=`<path d="${roof}" fill="${ink}"/><rect x="${f(x)}" y="${y}" width="${f(bw)}" height="${bh}" fill="${paper}" stroke="${ink}" stroke-width="1.6"/>
    <text x="${f(x+7)}" y="${y+19}" font-family="Young Serif" font-size="17" fill="${ink}">${i+1}</text>
    ${lab?`<text x="${f(cx)}" y="${yb+14}" text-anchor="middle" font-family="Albert Sans" font-size="11" fill="#4a3d30">${lab}</text>`:''}`});
  let streets='';for(let r=0;r<rows;r++)streets+=`<path d="M${m} ${top+r*rh+84.5}H${W-m}" stroke="${ink}" stroke-width="1" stroke-dasharray="1 3"/>`;
  const sk=skylineEdge(W,150,6);
  const body=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}<rect width="${W}" height="${H}" fill="${paper}"/>
  <path d="${sk.d.replace(/L\d+ 2000L0 2000Z$/,'')}L${W} 0L0 0Z" fill="${ink}" transform="translate(0 -18)"/>
  ${sk.wins.map(([x,y])=>`<path d="M${f(x-5)} ${f(y-18+8)}V${f(y-18-2)}a5 5 0 0 1 10 0V${f(y-18+8)}Z" fill="${warm}"/>`).join('')}
  <text x="${m}" y="50" font-family="Young Serif" font-size="28" fill="${paper}">${T.card.title}</text>
  <text x="${m}" y="84" font-family="Young Serif" font-size="28" fill="${warm}">${T.card.place} ${T.card.year}</text>
  ${streets}${houses}
  <g transform="translate(${W-m-76} 16)"><rect x="-6" y="-6" width="88" height="88" fill="${paper}"/><path d="${qrPath(76)}" fill="${ink}"/></g>
  <text x="${m}" y="${H-60}" font-family="Young Serif" font-size="15" fill="${ink}">${T.card.name}</text>
  <path d="M${m+58} ${H-60}H${W-m}" stroke="${ink}" stroke-width="1"/>
  <foreignObject x="${m}" y="${H-48}" width="${W-2*m}" height="44"><p xmlns="http://www.w3.org/1999/xhtml" style="font:400 12px/1.4 'Albert Sans';color:#2e251c">${T.card.howto} ${T.card.qr}: <b>${T.card.url}</b></p></foreignObject>
  </svg>`;
  return page({title:'B Papírový betlém, karta na razítka',css:css+`body{background:${paper};color:${ink}}`,body,w:W,h:H})}
module.exports={republika,okoli,karta,razitka};
