/* Orthographic sphere renderer: no package installation or WebGL required. */
const canvas=document.querySelector('#globe'),ctx=canvas.getContext('2d');
const rad=Math.PI/180;
const homeLongitude=134,homeLatitude=-15; let longitude=homeLongitude,latitude=homeLatitude; // Australia is the lowest allowed home camera; drag upward to explore north.
let zoom=1,selectedPool=-1,press=null,moved=false,animation=0;
let width=800,height=560,radius=230,cx=400,cy=280;
const pools=[{name:'Sydney Harbour',pair:'LED / AUD',lat:-33.87,lon:151.21,value:'$124K',cell:30},{name:'Melbourne Exchange',pair:'LED / ETH',lat:-37.81,lon:144.96,value:'$89K',cell:37},{name:'Perth West',pair:'LED / USDC',lat:-31.95,lon:115.86,value:'$62K',cell:24}];
// Deliberately simplified fallback geography. Full country geometry loads separately.
const fallback=[
['Australia',[[113,-22],[114,-27],[115,-34],[120,-34],[125,-33],[130,-32],[133,-32],[136,-35],[139,-37],[146,-39],[150,-36],[153,-28],[151,-24],[146,-19],[143,-12],[140,-17],[136,-14],[130,-12],[126,-14],[122,-18],[116,-21],[113,-22]]],
['Tasmania',[[144,-40],[148,-41],[147,-44],[145,-43],[144,-40]]],
['New Zealand',[[173,-35],[178,-38],[176,-41],[172,-42],[166,-46],[168,-47],[174,-42],[173,-39],[173,-35]]],
['Papua New Guinea',[[141,-3],[149,-5],[153,-10],[146,-9],[141,-6],[141,-3]]],
['Indonesia',[[95,5],[105,-3],[114,-8],[122,-8],[130,-4],[139,-3],[141,-6],[131,-8],[122,-10],[113,-9],[104,-6],[95,5]]],
['India',[[68,24],[73,31],[80,34],[88,27],[90,22],[83,17],[77,8],[73,16],[68,24]]],
['China',[[74,40],[80,49],[96,49],[108,43],[120,53],[134,48],[130,40],[122,39],[121,30],[116,23],[108,21],[100,26],[90,28],[80,34],[74,40]]],
['Japan',[[130,31],[135,34],[140,40],[145,44],[143,45],[139,39],[133,34],[130,31]]],
['Southeast Asia',[[92,28],[101,26],[108,21],[109,11],[104,9],[100,1],[98,8],[97,18],[92,28]]],
['Russia',[[28,70],[50,68],[75,73],[110,77],[145,70],[179,66],[170,60],[140,50],[120,53],[108,43],[96,49],[80,49],[60,55],[40,50],[28,60],[28,70]]],
['Europe',[[ -10,36],[-9,44],[-1,49],[8,54],[8,59],[20,70],[28,70],[28,60],[40,50],[30,44],[26,36],[20,40],[15,37],[10,44],[3,42],[-10,36]]],
['United Kingdom',[[-6,50],[1,52],[-3,59],[-6,57],[-6,50]]],
['Africa',[[-17,15],[-17,23],[-10,31],[0,36],[12,37],[25,32],[33,31],[42,12],[51,12],[43,-1],[40,-12],[33,-26],[25,-35],[18,-34],[12,-17],[9,4],[0,5],[-10,6],[-17,15]]],
['Madagascar',[[49,-12],[51,-17],[47,-26],[44,-24],[46,-16],[49,-12]]],
['Canada',[[-141,60],[-130,70],[-112,73],[-95,78],[-65,60],[-53,52],[-67,45],[-83,42],[-95,49],[-124,49],[-141,60]]],
['United States',[[-124,49],[-95,49],[-83,42],[-67,45],[-75,35],[-81,25],[-87,30],[-97,26],[-106,32],[-117,32],[-124,42],[-124,49]]],
['Mexico',[[-117,32],[-106,32],[-97,26],[-90,21],[-86,21],[-92,15],[-105,20],[-111,28],[-114,28],[-117,32]]],
['South America',[[-81,8],[-71,12],[-60,7],[-51,4],[-35,-5],[-39,-17],[-48,-28],[-58,-39],[-68,-55],[-74,-50],[-73,-35],[-81,-5],[-81,8]]],
['Greenland',[[-52,60],[-42,60],[-20,75],[-27,83],[-50,83],[-60,74],[-52,60]]]
];
let countries=fallback.map(([name,ring])=>({name,rings:[ring]}));
function project(lon,lat){const l=(lon-longitude)*rad,p=lat*rad,t=latitude*rad;const z=Math.sin(t)*Math.sin(p)+Math.cos(t)*Math.cos(p)*Math.cos(l);return{x:cx+radius*Math.cos(p)*Math.sin(l),y:cy-radius*(Math.cos(t)*Math.sin(p)-Math.sin(t)*Math.cos(p)*Math.cos(l)),z};}
function resize(){const box=canvas.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
function ringPath(ring){let started=false;ctx.beginPath();for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];let dl=b[0]-a[0];if(dl>180)dl-=360;if(dl< -180)dl+=360;const n=Math.max(1,Math.ceil(Math.max(Math.abs(dl),Math.abs(b[1]-a[1]))/2));for(let j=0;j<n;j++){const p=project(a[0]+dl*j/n,a[1]+(b[1]-a[1])*j/n);if(p.z>0){if(started)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);started=true;}else started=false;}}ctx.stroke();}
function fillRing(ring,colour){const points=ring.map(a=>project(...a));if(points.every(p=>p.z>0)){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=colour;ctx.fill();}}
function draw(){radius=Math.min(width*.42,height*.43)*zoom;cx=width*.5;cy=height*.48;ctx.clearRect(0,0,width,height);
 const glow=ctx.createRadialGradient(cx,cy,radius*.8,cx,cy,radius*1.23);glow.addColorStop(0,'#358dae00');glow.addColorStop(.65,'#3b94bd12');glow.addColorStop(.82,'#63d5e825');glow.addColorStop(1,'#3b94bd00');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
 ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip();const ocean=ctx.createRadialGradient(cx-radius*.35,cy-radius*.45,0,cx,cy,radius*1.4);ocean.addColorStop(0,'#14374c');ocean.addColorStop(.65,'#0b2539');ocean.addColorStop(1,'#020a15');ctx.fillStyle=ocean;ctx.fillRect(0,0,width,height);
 ctx.strokeStyle='#5795ac22';ctx.lineWidth=.6;for(let lat=-60;lat<=60;lat+=20)ringPath(Array.from({length:181},(_,i)=>[i*2-180,lat]));for(let lon=-180;lon<180;lon+=20)ringPath(Array.from({length:91},(_,i)=>[lon,i*2-90]));
 countries.forEach(c=>{const australia=c.name==='Australia';for(const ring of c.rings){fillRing(ring,australia?'#317a6977':'#1e475e77');ctx.strokeStyle=australia?'#86f3cf':'#5d90a5';ctx.lineWidth=australia?1.7:.7;ringPath(ring);}});
 const shade=ctx.createLinearGradient(cx-radius,cy-radius,cx+radius,cy+radius);shade.addColorStop(0,'#ffffff03');shade.addColorStop(.6,'#00000000');shade.addColorStop(1,'#00000077');ctx.fillStyle=shade;ctx.fillRect(0,0,width,height);ctx.restore();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.strokeStyle='#74c8df55';ctx.lineWidth=1;ctx.stroke();
 const au=project(133,-25);if(au.z>.2){ctx.fillStyle='#c5f5e9';ctx.font='600 10px Segoe UI';ctx.textAlign='center';ctx.fillText('A U S T R A L I A',au.x,au.y-8);}
 pools.forEach((p,i)=>{const q=project(p.lon,p.lat);if(q.z<.08)return;ctx.beginPath();ctx.arc(q.x,q.y,i===selectedPool?12:9,0,Math.PI*2);ctx.fillStyle='#6ceac426';ctx.fill();ctx.beginPath();ctx.arc(q.x,q.y,i===selectedPool?5:3.5,0,Math.PI*2);ctx.fillStyle='#96ffe0';ctx.fill();ctx.strokeStyle='#092725';ctx.lineWidth=1.5;ctx.stroke();if(i===selectedPool){ctx.font='11px Segoe UI';ctx.textAlign='left';const tw=ctx.measureText(p.name).width;ctx.fillStyle='#071521ee';ctx.fillRect(q.x+13,q.y-13,tw+18,26);ctx.fillStyle='#bfffe9';ctx.fillText(p.name,q.x+22,q.y+4);}});
 document.querySelector('#coordinates').textContent=`${Math.abs(latitude).toFixed(1)}° ${latitude<0?'S':'N'} / ${((longitude%360+540)%360-180).toFixed(1)}°`;
}
function focusAustralia(){cancelAnimationFrame(animation);longitude=homeLongitude;latitude=homeLatitude;const startZoom=zoom;const start=performance.now();function frame(now){const t=Math.min((now-start)/850,1),e=1-Math.pow(1-t,3);zoom=startZoom+(1.12-startZoom)*e;draw();if(t<1)animation=requestAnimationFrame(frame);}animation=requestAnimationFrame(frame);}
function changeZoom(delta){cancelAnimationFrame(animation);zoom=Math.max(.65,Math.min(1.7,zoom+delta));draw();}
// Track movement only to distinguish a selection tap from a drag.
canvas.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;press={x:e.clientX,y:e.clientY,id:e.pointerId,startLongitude:longitude,startLatitude:latitude};moved=false;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!press||e.pointerId!==press.id)return;const dx=e.clientX-press.x,dy=e.clientY-press.y;if(Math.hypot(dx,dy)>5)moved=true;if(moved){longitude=press.startLongitude-dx*.25;latitude=Math.max(homeLatitude,Math.min(30,press.startLatitude-dy*.18));draw();}});
canvas.addEventListener('pointerup',e=>{if(!press||e.pointerId!==press.id)return;const wasMoved=moved||Math.hypot(e.clientX-press.x,e.clientY-press.y)>5;press=null;if(wasMoved)return;const box=canvas.getBoundingClientRect(),x=e.clientX-box.left,y=e.clientY-box.top;const hit=pools.findIndex(p=>{const q=project(p.lon,p.lat);return q.z>0&&Math.hypot(q.x-x,q.y-y)<17;});if(hit>=0){selectPool(hit);return;}const xn=(x-cx)/radius,yn=-(y-cy)/radius;if(xn*xn+yn*yn>1)return;const z=Math.sqrt(1-xn*xn-yn*yn),t=latitude*rad;const lat=Math.asin(yn*Math.cos(t)+z*Math.sin(t))/rad;const lon=longitude+Math.atan2(xn,z*Math.cos(t)-yn*Math.sin(t))/rad;const au=countries.find(c=>c.name==='Australia');if(au&&au.rings.some(r=>inside(lon,lat,r)))focusAustralia();});
canvas.addEventListener('pointercancel',()=>press=null);
canvas.addEventListener('lostpointercapture',()=>press=null);
function inside(x,y,ring){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
canvas.addEventListener('wheel',e=>{e.preventDefault();changeZoom(-e.deltaY*.001);},{passive:false});
canvas.addEventListener('keydown',e=>{if(['+','-','=','Enter'].includes(e.key)){e.preventDefault();if(e.key==='+'||e.key==='=')changeZoom(.1);if(e.key==='-')changeZoom(-.1);if(e.key==='Enter')focusAustralia();}});
document.querySelector('#zoom-in').onclick=()=>changeZoom(.1);document.querySelector('#zoom-out').onclick=()=>changeZoom(-.1);document.querySelector('#focus').onclick=focusAustralia;document.querySelector('#reset').onclick=()=>{cancelAnimationFrame(animation);longitude=homeLongitude;latitude=homeLatitude;zoom=1;selectedPool=-1;document.querySelectorAll('.pool').forEach(b=>b.classList.remove('selected'));draw();};
function selectPool(i){selectedPool=i;document.querySelectorAll('.pool').forEach((b,j)=>{b.classList.toggle('selected',j===i);b.setAttribute('aria-pressed',String(j===i));});focusAustralia();}
pools.forEach((p,i)=>{const b=document.createElement('button');b.className='pool';b.setAttribute('aria-pressed','false');b.innerHTML=`<span class="pool-dot"></span><span class="pool-info"><strong>${p.name}</strong><small>${p.pair} · demo liquidity</small></span><span class="pool-value">${p.value}</span>`;b.onclick=()=>selectPool(i);document.querySelector('#pools').append(b);});
const dialog=document.querySelector('#grid-dialog');document.querySelector('#enter').onclick=()=>dialog.showModal();document.querySelector('#close-grid').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
for(let i=0;i<48;i++){const b=document.createElement('button'),pool=pools.find(p=>p.cell===i),label=`${String.fromCharCode(65+Math.floor(i/8))}${i%8+1}`;b.textContent=pool?'◎':label;b.className=pool?'has-pool':'';b.setAttribute('aria-label',`Cell ${label}${pool?`, ${pool.name} demo pool`:''}`);b.onclick=()=>{document.querySelectorAll('#country-grid button').forEach(c=>c.classList.remove('active'));b.classList.add('active');document.querySelector('#cell-detail').textContent=pool?`${label} — ${pool.name} · ${pool.pair} · ${pool.value} fictional liquidity`:`${label} — Unoccupied demo cell. Available for future world-building.`;};document.querySelector('#country-grid').append(b);}
new ResizeObserver(resize).observe(canvas);resize();
// Browser-only public geography download; fallback stays usable on network failure.
fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json',{signal:AbortSignal.timeout(10000)}).then(r=>{if(!r.ok)throw Error('Map unavailable');return r.json();}).then(data=>{countries=data.features.map(f=>({name:f.properties.name,rings:f.geometry.type==='Polygon'?f.geometry.coordinates:f.geometry.coordinates.flat()}));document.querySelector('#map-status').textContent='Country borders loaded';draw();}).catch(()=>{document.querySelector('#map-status').textContent='Simplified borders · offline map';});
