// Direction A: Dřevoryt. The night is a carved woodblock; light is the second, yellow block.
const {D,T,qrPath,page,write,tonightCount,V,cz}=require('./common');
const C={ink:'#14100d',ink2:'#1e1814',cut:'#9a8c74',paper:'#ece4d2',paperDim:'#b8ab93',yellow:'#f4b63f',ochre:'#9a7232'};
const f=n=>+n.toFixed(2);
function ray(cx,cy,a,r0,r1,w){const c=Math.cos(a),s=Math.sin(a),px=-s*w/2,py=c*w/2;return `M${f(cx+c*r0+px)} ${f(cy+s*r0+py)}L${f(cx+c*r1)} ${f(cy+s*r1)}L${f(cx+c*r0-px)} ${f(cy+s*r0-py)}Z`}
function rays(cx,cy,n,r0,r1,w,rot=0,jit=0){let d='';for(let i=0;i<n;i++){const a=rot+i*2*Math.PI/n;const L=r1*(1-jit*((i*37)%7)/7);d+=ray(cx,cy,a,r0,L,w)}return d}
// the carved window: 4 panes in yellow, mullions as uncut wood
function windowMark(cx,cy,s,{panes=C.yellow,frame=C.ink,rays:r=true,ring=false}={}){
  const h=s/2,g=s*0.09;let o='';
  if(r)o+=`<path d="${rays(cx,cy,12,s*0.82,s*1.55,s*0.13,Math.PI/12,0.5)}" fill="${panes}"/>`;
  if(ring)o+=`<circle cx="${cx}" cy="${cy}" r="${f(s*1.85)}" fill="none" stroke="${panes}" stroke-width="${f(s*0.07)}" stroke-dasharray="${f(s*0.05)} ${f(s*0.22)}" opacity=".7"/>`;
  o+=`<rect x="${f(cx-h-g)}" y="${f(cy-h-g)}" width="${f(s+2*g)}" height="${f(s+2*g)}" fill="${frame}"/>`;
  const p=(s-g)/2;
  for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])o+=`<rect x="${f(cx-h+dx*(p+g))}" y="${f(cy-h+dy*(p+g))}" width="${f(p)}" height="${f(p)}" fill="${panes}"/>`;
  return o}
const defs=`<defs>
<filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="1.8"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.42" numOctaves="2" seed="11"/><feColorMatrix values="0 0 0 0 0.62  0 0 0 0 0.52  0 0 0 0 0.40  0 0 0 0.22 -0.08"/></filter>
<filter id="paperTex" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0.10 0"/></filter>
<pattern id="hatch" width="6" height="3.4" patternUnits="userSpaceOnUse"><path d="M0 1.7H6" stroke="${C.cut}" stroke-width=".55" opacity=".5"/></pattern>
</defs>`;
const css=`
:root{--ink:${C.ink};--ink2:${C.ink2};--paper:${C.paper};--paper-dim:${C.paperDim};--yellow:${C.yellow};--cut:${C.cut}}
body{background:var(--ink);color:var(--paper);font-family:'Alegreya Sans',sans-serif;-webkit-font-smoothing:antialiased;position:relative}
::selection{background:var(--yellow);color:var(--ink)}
svg.full{position:absolute;inset:0}
.title{font-family:'Grenze',serif;font-weight:800;letter-spacing:-.01em;line-height:.9}
.btn{display:flex;align-items:center;justify-content:center;gap:10px;height:52px;font-family:'Grenze',serif;font-weight:600;font-size:21px;letter-spacing:.01em;border:0;color:var(--ink);background:var(--paper) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='60' preserveAspectRatio='none'%3E%3Cfilter id='r'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2' seed='2'/%3E%3CfeDisplacementMap in='SourceGraphic' scale='3'/%3E%3C/filter%3E%3Crect x='-2' y='-2' width='404' height='64' fill='none' stroke='%2314100d' stroke-width='5' filter='url(%23r)'/%3E%3C/svg%3E") center/100% 100% no-repeat}
.btn.dark{background-color:var(--ink);color:var(--paper)}
.btn.ghost{background:transparent;color:var(--paper);box-shadow:inset 0 0 0 1.5px var(--paper-dim);clip-path:none}
.btn:focus-visible{outline:2px solid var(--yellow);outline-offset:3px}
@keyframes kindle{from{opacity:.25;transform:scale(.92)}to{opacity:1;transform:none}}
.kindle{transform-origin:center;transform-box:fill-box;animation:kindle 1.6s cubic-bezier(.16,1,.3,1) both}
`;
const grainRect=(w,h)=>`<rect width="${w}" height="${h}" filter="url(#grain)"/>`;
// gouge rule: a tapered cut
const gouge=(x,y,w,c=C.cut)=>`<path d="M${x} ${y}Q${x+w*.5} ${y-1.6} ${x+w} ${y+.3}Q${x+w*.5} ${y+.9} ${x} ${y}Z" fill="${c}"/>`;

function republika(){
  const k=374/cz.W,ox=8,oy=300;const P=c=>[f(ox+c.x*k),f(oy+c.y*k)];
  let lights='';
  for(const c of D.calendars){const [x,y]=P(c);
    if(c.tonight){const L=3.2+c.lit*0.42;lights+=`<path d="${rays(x,y,8,1.6,L,1.05,(c.x%7)/7,0.45)}" fill="${C.yellow}"/><rect x="${f(x-1.5)}" y="${f(y-1.5)}" width="3" height="3" fill="${C.yellow}"/>`}
    else lights+=`<rect x="${f(x-1)}" y="${f(y-1)}" width="2" height="2" fill="${C.ochre}" opacity=".8"/>`}
  const regions=cz.kraje.map(r=>r.d).join('');
  const body=`<svg class="full" width="390" height="844" viewBox="0 0 390 844">${defs}${grainRect(390,844)}
  <g transform="translate(${ox} ${oy}) scale(${f(k)})">
    <clipPath id="cz"><path d="${regions}"/></clipPath>
    <g filter="url(#rough)"><path d="${regions}" fill="none" stroke="${C.cut}" stroke-width="4.4" stroke-linejoin="round"/><path d="${regions}" fill="${C.ink}"/></g>
    <rect width="${cz.W}" height="${cz.H}" fill="url(#hatch)" clip-path="url(#cz)" opacity=".7"/>
    <path d="${regions}" filter="url(#rough)" fill="none" stroke="${C.cut}" stroke-width="1.3" stroke-dasharray="2 6" opacity=".6"/>
  </g>
  <g class="kindle">${lights}</g>
  <g transform="translate(33 58)">${windowMark(0,0,14,{rays:false})}</g>
  </svg>
  <header style="position:absolute;left:52px;top:42px">
    <h1 class="title" style="font-size:31px">${T.app}</h1>
    <p style="font-size:16px;color:var(--paper-dim);margin-top:6px">${T.date}</p>
  </header>
  <section style="position:absolute;left:24px;right:24px;bottom:34px">
    <svg width="342" height="6" style="display:block;margin-bottom:18px">${gouge(0,3,342)}</svg>
    <h2 class="title" style="font-size:30px;font-weight:600">${T.republikaHead(tonightCount)}</h2>
    <p style="font-size:17px;line-height:1.4;color:var(--paper-dim);margin:8px 0 22px">${T.republikaSub}</p>
    <div style="display:flex;gap:12px">
      <button class="btn" style="flex:1.6">${locIcon(C.ink)}${T.locate}</button>
      <button class="btn ghost" style="flex:1">${T.search}</button>
    </div>
  </section>`;
  return page({title:'A Dřevoryt, republika',css,body})}
function locIcon(c){return `<svg width="20" height="20" viewBox="-10 -10 20 20"><circle r="5.2" fill="none" stroke="${c}" stroke-width="2.2"/><path d="M0 -9.5V-6M0 6V9.5M-9.5 0H-6M6 0H9.5" stroke="${c}" stroke-width="2.2"/><circle r="1.6" fill="${c}"/></svg>`}

function villageSvg({dim=false}={}){
  const w={trunk:2.6,primary:2.6,tertiary:2.2,minor:1.7,service:1.2,track:.9,path:.8,rail:1,bridge:2};
  const op={trunk:.6,primary:.6,tertiary:.55,minor:.48,service:.36,track:.2,path:.16,rail:.3,bridge:.5};
  let roads='';for(const [k,arr] of Object.entries(V.roads)){if(!w[k])continue;const da=k==='track'||k==='path'?' stroke-dasharray="3 3.5"':k==='rail'?' stroke-dasharray="1 4"':'';roads+=`<path d="${arr.join('')}" stroke="${C.cut}" stroke-width="${w[k]}" opacity="${op[k]}"${da}/>`}
  const past=V.past.map(([x,y])=>windowMark(x,y,6.5,{panes:C.ochre,rays:false})).join('');
  const [tx,ty]=V.tonight,[ux,uy]=V.user;
  return `<svg class="full" width="390" height="844" viewBox="0 0 390 844">${defs}${grainRect(390,844)}
  <g filter="url(#rough)" fill="none" stroke-linecap="round" stroke-linejoin="round">${roads}
   <path d="${V.waterway.join('')}" stroke="${C.cut}" stroke-width=".8" opacity=".22" stroke-dasharray="6 2 1 2"/>
   <path d="${V.buildings.join('')}" stroke="${C.cut}" stroke-width=".7" opacity=".2"/></g>
  <g opacity=".85">${past}</g>
  <g class="kindle">${windowMark(tx,ty,17,{ring:true})}</g>
  <g><circle cx="${ux}" cy="${uy}" r="15" fill="none" stroke="${C.paper}" stroke-width="1" opacity=".35" stroke-dasharray="2 3"/><circle cx="${ux}" cy="${uy}" r="7" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.5"/></g>
  ${dim?`<rect width="390" height="844" fill="${C.ink}" opacity=".35"/>`:''}
  </svg>`}
const topBar=`<nav style="position:absolute;top:44px;left:16px;right:16px;display:flex;justify-content:space-between">
  <button class="btn ghost" style="height:44px;padding:0 16px 0 12px;font-size:18px;background:${C.ink}">
   <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9.5 1.5L3.5 7l6 5.5" fill="none" stroke="${C.paper}" stroke-width="2.2"/></svg>${T.back}</button>
  <button class="btn ghost" aria-label="Moje poloha" style="width:44px;height:44px;padding:0;background:${C.ink}">${locIcon(C.paper)}</button></nav>`;
function okoli(){
  const body=`${villageSvg()}${topBar}
  <section style="position:absolute;left:0;right:0;bottom:0;padding:0 24px 34px;background:linear-gradient(to bottom,transparent,${C.ink} 34px)">
    <p style="display:flex;align-items:center;gap:10px;font-size:15px;color:var(--paper-dim);padding:40px 0 14px">
      <svg width="12" height="12" viewBox="-6 -6 12 12">${windowMark(0,0,8,{panes:C.ochre,rays:false})}</svg>${T.doutnaLegend}</p>
    <svg width="342" height="6" style="display:block;margin-bottom:16px">${gouge(0,3,342)}</svg>
    <div style="display:flex;align-items:center;gap:16px">
      <svg width="40" height="40" viewBox="-20 -20 40 40">${windowMark(0,0,14,{rays:false})}</svg>
      <div style="flex:1"><h2 class="title" style="font-size:26px;font-weight:600">${T.okoliHead}</h2>
      <p style="font-size:16px;color:var(--paper-dim);margin-top:4px">${T.okoliSub}</p></div>
      <svg width="12" height="20" viewBox="0 0 12 20"><path d="M2 2l8 8-8 8" fill="none" stroke="${C.paper}" stroke-width="2.4"/></svg>
    </div>
  </section>`;
  return page({title:'A Dřevoryt, okolí',css,body})}
function karta(){
  const top=402;
  const edge=(()=>{let d=`M0 14`;for(let x=0;x<=390;x+=6)d+=`L${x} ${f(9+Math.sin(x*0.37)*1.6+((x*13)%5)*.5)}`;return d+`L390 600L0 600Z`})();
  const body=`${villageSvg({dim:true})}${topBar}
  <section style="position:absolute;left:0;right:0;top:${top}px;bottom:0;color:${C.ink};background:linear-gradient(transparent 16px,${C.paper} 16px)">
    <svg class="full" width="390" height="${844-top}" style="position:absolute;inset:0">${defs}<path d="${edge}" fill="${C.paper}"/><path d="${edge}" filter="url(#paperTex)"/></svg>
    <div style="position:relative;padding:36px 24px 0">
      <div style="display:flex;gap:16px;align-items:flex-start">
        <div style="flex:1"><h2 class="title" style="font-size:40px">${T.house}</h2>
        <p style="font-size:16px;font-weight:500;color:#5b4f3f;margin-top:8px">${T.houseMeta}</p></div>
        <svg width="54" height="54" viewBox="-27 -27 54 54" style="margin-top:-4px">${windowMark(0,0,15,{frame:C.ink})}</svg>
      </div>
      <svg width="342" height="6" style="display:block;margin:18px 0 16px">${gouge(0,3,342,'#3a3128')}</svg>
      <p style="font-size:19px;font-weight:700">${T.houseTime}</p>
      <p style="font-size:18px;line-height:1.42;margin-top:8px;max-width:34ch">${T.houseProgram}</p>
      <p style="font-size:16px;color:#5b4f3f;margin-top:12px">${T.houseWalk}</p>
      <button class="btn dark" style="width:100%;height:58px;margin-top:22px;font-size:24px;background-image:none;box-shadow:0 0 0 0 transparent">
        <svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 8.5L16 2l-6.5 14-1.6-5.9z" fill="${C.yellow}"/></svg>${T.navigate}</button>
      <p style="font-size:15px;color:#5b4f3f;margin-top:10px;text-align:center">${T.navigateHint}</p>
    </div>
  </section>`;
  return page({title:'A Dřevoryt, karta domečku',css,body})}

function razitka(){
  // A5 at 4 px per mm: 592 x 840
  const W=592,H=840,m=24,ink='#16120f',paper='#ffffff';
  const gx=m+8,gw=W-2*m-16,cols=4,rows=6,cw=gw/cols,gy=218,rh=84;
  let wall='';for(let y=gy-6;y<gy+rows*rh+4;y+=4.2)wall+=`M${m} ${f(y)}H${W-m}`;
  let fields='';T.card.days.forEach((lab,i)=>{const c=i%cols,r=Math.floor(i/cols);const x=gx+c*cw+7,y=gy+r*rh+6,w=cw-14,h=rh-14;
    fields+=`<rect x="${f(x-4)}" y="${f(y-4)}" width="${f(w+8)}" height="${f(h+8)}" fill="${ink}"/><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${paper}"/>
    <rect x="${f(x-7)}" y="${f(y+h+4)}" width="${f(w+14)}" height="3.4" fill="${ink}"/>
    <text x="${f(x+6)}" y="${f(y+21)}" font-family="Grenze" font-weight="800" font-size="20" fill="${ink}">${i+1}</text>
    ${lab?`<text x="${f(x+w-6)}" y="${f(y+h-7)}" text-anchor="end" font-family="Alegreya Sans" font-weight="500" font-size="12" fill="#3a3128">${lab}</text>`:''}`});
  const roof=`M${m} 196L${W/2} 30L${W-m} 196Z`;
  const body=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}
  <rect width="${W}" height="${H}" fill="${paper}"/>
  <g filter="url(#rough)">
    <path d="${roof}" fill="${ink}"/>
    <path d="${wall}" stroke="${ink}" stroke-width="1.9"/>
    <rect x="${m}" y="${gy-10}" width="${W-2*m}" height="${rows*rh+16}" fill="none" stroke="${ink}" stroke-width="5"/>
    ${fields.replace(/<text[\s\S]*?<\/text>/g,'')}
  </g>
  ${(fields.match(/<text[\s\S]*?<\/text>/g)||[]).join('')}
  <g transform="translate(${W/2} 92)">${windowMark(0,0,22,{panes:C.yellow,frame:ink})}</g>
  <text x="${W/2}" y="152" text-anchor="middle" font-family="Grenze" font-weight="800" font-size="27" fill="${paper}">${T.card.title}</text>
  <text x="${W/2}" y="186" text-anchor="middle" font-family="Grenze" font-weight="600" font-size="25" fill="${paper}" letter-spacing=".5">${T.card.place} ${T.card.year}</text>
  <text x="${m}" y="${gy+rows*rh+40}" font-family="Grenze" font-weight="600" font-size="17" fill="${ink}">${T.card.name}</text>
  <path d="M${m+52} ${gy+rows*rh+42}H${W-m-112}" stroke="${ink}" stroke-width="1.2"/>
  <foreignObject x="${m}" y="${gy+rows*rh+52}" width="${W-2*m-112}" height="60"><p xmlns="http://www.w3.org/1999/xhtml" style="font:400 12.5px/1.35 'Alegreya Sans';color:#2a231c">${T.card.howto}</p></foreignObject>
  <g transform="translate(${W-m-88} ${gy+rows*rh+14})"><rect x="-4" y="-4" width="96" height="96" fill="${paper}"/><path d="${qrPath(88)}" fill="${ink}"/></g>
  <text x="${W-m-44}" y="${H-10}" text-anchor="middle" font-family="Alegreya Sans" font-weight="500" font-size="10.5" fill="#3a3128">${T.card.url}</text>
  <text x="${m}" y="${H-12}" font-family="Grenze" font-weight="600" font-size="12" fill="#3a3128">${T.card.kind}</text>
  </svg>`;
  return page({title:'A Dřevoryt, karta na razítka',css:css+`body{background:${paper};color:${ink}}`,body,w:W,h:H})}
module.exports={republika,okoli,karta,razitka};
