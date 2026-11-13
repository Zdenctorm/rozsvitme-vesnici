// Shared illustrative data for all three directions.
// Region shapes: RÚIAN kraje via siwekm/czech-geojson. Village streets: OpenStreetMap via OpenFreeMap tiles, z14.
const fs=require('fs');const path=require('path');
const cz=JSON.parse(fs.readFileSync(path.join(__dirname,'cz.json'),'utf8'));
const osm=JSON.parse(fs.readFileSync(path.join(__dirname,'radlo_osm.json'),'utf8'));
const LON0=12.09,LAT1=51.06,K=Math.cos(49.8*Math.PI/180),S=1000/((18.86-12.09)*K);
const proj=(lat,lon)=>[(lon-LON0)*K*S,(LAT1-lat)*S];
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
const anchors=[[50.702,15.115,'Rádlo'],[48.901,17.317,'Strážnice'],[49.071,16.107,'Rouchovany'],[50.10,14.47],[50.05,14.38],[50.03,14.52],[50.08,14.30],[49.19,16.61],[49.21,16.68],[49.59,17.25],[49.83,18.28],[49.74,13.37],[50.77,15.06],[50.72,15.17],[50.21,15.83],[50.04,15.78],[48.97,14.47],[49.40,15.59],[49.22,17.67],[50.23,12.87],[50.66,14.03],[49.21,15.88],[49.41,14.68],[49.31,14.15],[49.95,15.27],[50.03,15.20],[50.41,14.90],[50.59,15.16],[50.44,15.35],[50.56,15.91],[50.42,16.16],[49.97,16.39],[49.76,16.47],[49.56,15.94],[49.36,16.01],[48.86,16.05],[48.81,16.64],[48.76,16.88],[48.85,17.13],[49.01,17.12],[49.07,17.46],[49.34,17.99],[49.46,18.14],[49.55,18.21],[49.68,18.35],[49.68,18.67],[49.94,17.90],[50.09,17.70],[49.97,16.97],[50.23,17.20],[49.45,17.45],[49.47,17.11],[49.30,17.39],[49.28,17.00],[49.36,16.64],[49.49,16.66],[49.61,15.58],[49.43,15.22],[49.14,15.00],[49.00,14.77],[48.81,14.32],[49.01,14.00],[49.26,13.90],[49.40,13.29],[49.44,12.93],[49.80,12.63],[50.08,12.37],[50.18,12.64],[50.46,13.42],[50.50,13.64],[50.64,13.82],[50.77,14.21],[50.69,14.54],[50.53,14.13],[50.35,14.47],[50.15,14.10],[49.96,14.07],[49.69,14.01],[49.78,14.69],[50.10,13.73],[50.36,13.80],[50.19,15.04],[50.14,15.12],[49.95,15.79],[50.16,16.27],[50.63,15.61],[50.60,15.33],[50.92,15.08],[50.91,14.62],[50.95,14.56]];
const calendars=[];
anchors.forEach(([la,lo,name],i)=>{
  const n=name?1:1+Math.floor(rnd()*3);
  for(let k=0;k<n;k++){
    const jl=name&&k===0?0:(rnd()-.5)*0.34,jo=name&&k===0?0:(rnd()-.5)*0.5;
    const [x,y]=proj(la+jl,lo+jo);
    const lit=name?11:Math.floor(4+rnd()*8);
    calendars.push({x,y,lit,tonight:name?true:rnd()<0.8,name:name&&k===0?name:null});
  }
});
// Village view around Rádlo. Units: z14 tile px relative to tile 8879/5506, ~0.38 m each.
const s=0.17,W=390,H=844;
const view={x0:3700-195/s,y0:2790-340/s,s};
const T=([x,y])=>[+((x-view.x0)*s).toFixed(1),+((y-view.y0)*s).toFixed(1)];
const inView=p=>p[0]>-60&&p[0]<W+60&&p[1]>-60&&p[1]<H+60;
const toD=pts=>'M'+pts.map(p=>p.join(' ')).join('L');
const roads={};
for(const r of osm.roads){const pts=r.p.map(T);if(!pts.some(inView))continue;(roads[r.c]=roads[r.c]||[]).push(toD(pts))}
const buildings=[];const bcent=[];
for(const b of osm.buildings){const pts=b.p.map(T);if(!pts.some(inView))continue;buildings.push(toD(pts)+'Z');
  const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cy=pts.reduce((a,p)=>a+p[1],0)/pts.length;bcent.push([cx,cy,b.p.length])}
const waterway=osm.waterway.map(w=>w.p.map(T)).filter(p=>p.some(inView)).map(toD);
const water=osm.water.map(w=>w.p.map(T)).filter(p=>p.some(inView)).map(p=>toD(p)+'Z');
// Past houses of the Rádlo calendar: spread picks among buildings in the village core.
const core=bcent.filter(c=>c[0]>24&&c[0]<370&&c[1]>200&&c[1]<520&&c[2]>=5);
let T0=bcent.reduce((a,c)=>Math.hypot(c[0]-196,c[1]-318)<Math.hypot(a[0]-196,a[1]-318)?c:a,bcent[0]).slice(0,2).map(v=>+v.toFixed(1));
const past=[];let cand=core.slice();
const far=(p,set)=>Math.min(...set.map(q=>Math.hypot(p[0]-q[0],p[1]-q[1])));
const picked=[T0];
for(let i=0;i<11;i++){cand.sort((a,b)=>far(b,picked)-far(a,picked));const c=cand[Math.floor(cand.length*0.15*rnd())];picked.push(c);past.push([+c[0].toFixed(1),+c[1].toFixed(1)]);cand=cand.filter(x=>x!==c)}
// order past houses into a walkable day sequence, nearest neighbour from the far end
const seq=[];{let cur=T0,left=past.slice();while(left.length){left.sort((a,b)=>Math.hypot(a[0]-cur[0],a[1]-cur[1])-Math.hypot(b[0]-cur[0],b[1]-cur[1]));cur=left.shift();seq.unshift(cur)}}
// user location: a point on a road below the house
let user=[240,540],best=1e9;
for(const r of osm.roads){if(!['minor','service','tertiary'].includes(r.c))continue;for(const p of r.p.map(T)){const d=Math.hypot(p[0]-240,p[1]-540);if(d<best){best=d;user=p}}}
module.exports={cz,calendars,village:{W,H,roads,buildings,waterway,water,tonight:T0,past:seq,user,metersPerPx:0.38/s}};
if(require.main===module){const v=module.exports.village;console.log(Object.fromEntries(Object.entries(v.roads).map(([k,a])=>[k,a.length])),v.buildings.length,v.tonight,v.past,v.user,calendars.length,v.metersPerPx)}
