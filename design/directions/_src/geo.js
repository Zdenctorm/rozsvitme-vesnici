// Builds simplified SVG paths of Czech regions from kraje.json (siwekm/czech-geojson, RÚIAN data).
const fs=require('fs');
const src=process.argv[2];
const gj=JSON.parse(fs.readFileSync(src,'utf8'));
const LON0=12.09,LAT1=51.06,K=Math.cos(49.8*Math.PI/180);
const W=1000; const S=W/((18.86-12.09)*K);
const P=([lon,lat])=>[(lon-LON0)*K*S,(LAT1-lat)*S];
function dp(pts,eps){if(pts.length<3)return pts;let m=0,i0=0;const [a,b]=[pts[0],pts[pts.length-1]];
 for(let i=1;i<pts.length-1;i++){const p=pts[i];const dx=b[0]-a[0],dy=b[1]-a[1];const L=Math.hypot(dx,dy)||1;const d=Math.abs(dy*p[0]-dx*p[1]+b[0]*a[1]-b[1]*a[0])/L;if(d>m){m=d;i0=i}}
 if(m>eps){return dp(pts.slice(0,i0+1),eps).slice(0,-1).concat(dp(pts.slice(i0),eps))}return [a,b]}
const out={W,H:+((LAT1-48.55)*S).toFixed(1),kraje:[]};
for(const f of gj.features){const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
 let d='';for(const poly of polys){const ring=poly[0].map(P);const h=ring.length>>1;const s=dp(ring.slice(0,h+1),0.9).slice(0,-1).concat(dp(ring.slice(h),0.9));if(s.length<4)continue;d+='M'+s.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')+'Z'}
 out.kraje.push({name:f.name,d})}
out.project=null;
fs.writeFileSync('cz.json',JSON.stringify(out));
console.log(out.W,out.H,out.kraje.length,JSON.stringify(out).length);
