/* Scroll-driven 3D solar system background (three.js r128, procedural textures) */
(()=>{
if(!window.THREE||!document.getElementById('solar'))return;
const cv=document.getElementById('solar');
let W=innerWidth,H=innerHeight;
const R=new THREE.WebGLRenderer({canvas:cv,antialias:true});
R.setPixelRatio(Math.min(devicePixelRatio||1,1.5));R.setSize(W,H,false);R.outputEncoding=THREE.sRGBEncoding;
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(45,W/H,.05,9000);
function viewOff(){cam.aspect=W/H;cam.updateProjectionMatrix()}
addEventListener('resize',()=>{W=innerWidth;H=innerHeight;R.setSize(W,H,false);viewOff()});viewOff();

// ---------- noise ----------
function hs(x,y,z){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,1274126177);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
function vn(x,y,z){const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z);let fx=x-xi,fy=y-yi,fz=z-zi;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);fz=fz*fz*(3-2*fz);
 const L=(a,b,t)=>a+(b-a)*t;
 return L(L(L(hs(xi,yi,zi),hs(xi+1,yi,zi),fx),L(hs(xi,yi+1,zi),hs(xi+1,yi+1,zi),fx),fy),L(L(hs(xi,yi,zi+1),hs(xi+1,yi,zi+1),fx),L(hs(xi,yi+1,zi+1),hs(xi+1,yi+1,zi+1),fx),fy),fz)}
function fbm(x,y,z,o){let a=.5,s=0,f=1;for(let i=0;i<o;i++){s+=a*vn(x*f,y*f,z*f);f*=2.03;a*=.5}return s/(1-Math.pow(.5,o))*.98}
const mix=(a,b,t)=>{t=Math.max(0,Math.min(1,t));return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]};
function gen(fn,w=512,h=256,color=true){
 const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),d=g.createImageData(w,h);
 for(let j=0;j<h;j++){const lat=(j/h-.5)*Math.PI,cl=Math.cos(lat),y=-Math.sin(lat);
  for(let i=0;i<w;i++){const lon=i/w*6.2832,x=cl*Math.cos(lon),z=cl*Math.sin(lon),q=fn(x,y,z,lat,lon),k=(j*w+i)*4;
   d.data[k]=q[0];d.data[k+1]=q[1];d.data[k+2]=q[2];d.data[k+3]=q.length>3?q[3]:255}}
 g.putImageData(d,0,0);const t=new THREE.CanvasTexture(c);if(color)t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t}

// ---------- planet definitions ----------
const B=[
{n:'Overview',tag:'Our neighbourhood',tx:'Eight planets and a dwarf planet circle one star. Keep scrolling to fly from planet to planet.'},
{n:'The Sun',tag:'Star · 4.6 billion years old',tx:'A ball of hot plasma holding 99.8% of the system’s mass. Its surface boils at about 5,500 °C.'},
{n:'Mercury',tag:'Planet 1 · 88-day year',tx:'The smallest planet and the closest to the Sun. Days are scorching, nights are freezing.',a:47,r:1.3,sp:1.6,ph:3.3,rot:.2,bump:.04,
 f:(x,y,z)=>{const n=fbm(x*5,y*5,z*5,5),m=fbm(x*18,y*18,z*18,3);return mix([80,78,76],[175,170,164],n).map(v=>v*(.7+.5*m))}},
{n:'Venus',tag:'Planet 2 · 225-day year',tx:'Thick clouds trap heat, making Venus the hottest planet. It spins backwards.',a:62,r:2.2,sp:1.2,ph:3.9,rot:-.05,atm:[1,.8,.4],
 f:(x,y,z)=>{const w=fbm(x*2,y*2,z*2,3)*2,n=fbm(x*2+w,y*6+w,z*2+w,5);return mix([205,160,90],[250,230,180],n*1.2)}},
{n:'Earth',tag:'Planet 3 · Home',tx:'The only known world with life and liquid oceans on its surface. One moon keeps it company.',a:79,r:2.4,sp:1,ph:3.0,rot:.5,atm:[.3,.55,1],earth:1,
 f:(x,y,z)=>{const h=fbm(x*2.2+3,y*2.2,z*2.2,6),ay=Math.abs(y);if(ay>.86+fbm(x*6,y*6,z*6,3)*.06)return[240,245,250];if(h<.5)return mix([4,22,75],[25,95,170],h/.5*1.1);const e=(h-.5)*2.2,dz=fbm(x*3+9,y*3,z*3,3);return e>.75?[235,235,240]:mix(mix([40,105,45],[85,130,55],e),[190,160,100],dz>.5?(dz-.5)*2.4:0)}},
{n:'Mars',tag:'Planet 4 · The red planet',tx:'Cold, dusty, with the tallest volcano in the system, Olympus Mons. Two tiny moons.',a:96,r:1.8,sp:.8,ph:3.6,rot:.48,bump:.05,atm:[.9,.5,.3],atmI:.35,
 f:(x,y,z)=>{if(Math.abs(y)>.93)return[240,240,245];const n=fbm(x*3,y*3,z*3,6),d=fbm(x*2+5,y*2,z*2,4);return mix(mix([150,68,35],[220,135,82],n),[70,38,28],d<.4?(.4-d)*3:0)}},
{n:'Jupiter',tag:'Planet 5 · Gas giant',tx:'Bigger than all other planets combined. Its Great Red Spot is a storm older than 300 years.',a:145,r:8,sp:.45,ph:3.2,rot:1.2,
 f:(x,y,z,lat,lon)=>{const w=fbm(x*2,y*5,z*2,4),b=Math.sin(y*15+w*4)*.5+.5,n=fbm(x*3,y*22,z*3,4);let c=mix(mix([130,80,50],[240,215,180],b),[210,160,110],n*.5);const dl=Math.atan2(Math.sin(lon-2.2),Math.cos(lon-2.2)),d=(dl/.32)**2+((lat+.38)/.1)**2;if(d<1)c=mix(c,[185,70,40],1-d);return c}},
{n:'Saturn',tag:'Planet 6 · Ringed giant',tx:'Famous rings of ice and rock. Saturn is so light it would float in water.',a:195,r:6.4,sp:.33,ph:3.1,rot:1.1,ring:1,
 f:(x,y,z)=>{const w=fbm(x*2,y*4,z*2,3),b=Math.sin(y*20+w*2.5)*.5+.5,n=fbm(x*3,y*26,z*3,3);return mix(mix([190,160,100],[240,222,175],b),[225,200,150],n*.6)}},
{n:'Uranus',tag:'Planet 7 · Ice giant',tx:'Rolls around the Sun tilted on its side. A pale cyan world of icy gases.',a:242,r:3.8,sp:.23,ph:3.15,rot:-.7,tilt:1.7,atm:[.5,.9,.95],
 f:(x,y,z)=>{const n=fbm(x,y*8,z,3);return mix([140,215,222],[190,240,242],n)}},
{n:'Neptune',tag:'Planet 8 · Ice giant',tx:'Deep blue, windy, and the farthest planet. Winds exceed 2,000 km/h.',a:285,r:3.7,sp:.18,ph:3.25,rot:.8,atm:[.3,.45,1],
 f:(x,y,z,lat,lon)=>{const w=fbm(x*2,y*6,z*2,4),b=Math.sin(y*12+w*3)*.5+.5;let c=mix([22,45,160],[85,125,245],b*.8+.2*w);const dl=lon-4,d=(dl/.4)**2+((lat+.3)/.14)**2;if(d<1)c=mix(c,[10,20,90],1-d);return c}},
{n:'Pluto',tag:'Dwarf planet · Edge of the map',tx:'A small icy world with a heart-shaped glacier, orbiting out in the Kuiper Belt.',a:328,r:.9,sp:.13,ph:3.2,rot:.15,bump:.03,
 f:(x,y,z,lat,lon)=>{const n=fbm(x*4,y*4,z*4,5);let c=mix([100,72,58],[215,195,170],n*1.1);const dl=lon-3.4,d=(dl/.55)**2+((lat+.1)/.4)**2;if(d<1)c=mix(c,[240,228,215],(1-d)*.9);return c}}
];
const N=B.length,T=-.28,K=.5;

// ---------- lights & sun ----------
scene.add(new THREE.AmbientLight(0x1a2036,.55));
const sunLight=new THREE.PointLight(0xfff1d6,2.2,0,0);scene.add(sunLight);
const sunMat=new THREE.ShaderMaterial({uniforms:{t:{value:0}},
vertexShader:'varying vec3 vP,vN;void main(){vP=position;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
fragmentShader:`uniform float t;varying vec3 vP,vN;
float h(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fb(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n3(p);p*=2.1;a*=.5;}return s;}
void main(){vec3 p=normalize(vP)*3.2;float n=fb(p+vec3(0.,t*.06,t*.03));float m=fb(p*2.+vec3(t*.1,0.,fb(p+t*.05)*2.));
vec3 c=mix(vec3(.8,.12,0.),vec3(1.,.55,.05),n*1.4);c=mix(c,vec3(1.,.92,.55),smoothstep(.5,.9,m*n*2.6));c*=.8+.8*pow(m,2.);
float l=pow(max(normalize(vN).z,0.),.45);c*=.55+.75*l;gl_FragColor=vec4(c*1.15,1.);}`});
const sun=new THREE.Mesh(new THREE.SphereGeometry(30,64,64),sunMat);scene.add(sun);
function glowTex(stops){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),r=g.createRadialGradient(128,128,0,128,128,128);stops.forEach(s=>r.addColorStop(s[0],s[1]));g.fillStyle=r;g.fillRect(0,0,256,256);return new THREE.CanvasTexture(c)}
const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex([[0,'rgba(255,200,90,.9)'],[.25,'rgba(255,150,40,.45)'],[.6,'rgba(255,110,20,.1)'],[1,'rgba(255,100,0,0)']]),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
glow.scale.set(150,150,1);scene.add(glow);

// ---------- stars ----------
{const n=5000,p=new Float32Array(n*3),c=new Float32Array(n*3);for(let i=0;i<n;i++){const u=Math.random()*2-1,a=Math.random()*6.2832,s=Math.sqrt(1-u*u),R=3500+Math.random()*1000;p.set([R*s*Math.cos(a),R*u,R*s*Math.sin(a)],i*3);const k=.5+Math.random()*.5,w=Math.random();c.set([k*(.8+.2*w),k*.9,k*(1-.2*w)],i*3)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
 window.stars=new THREE.Points(g,new THREE.PointsMaterial({size:1.8,sizeAttenuation:false,vertexColors:true,transparent:true,depthWrite:false}));scene.add(stars);
 const neb=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex([[0,'rgba(110,140,230,.35)'],[1,'rgba(40,60,140,0)']]),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));neb.scale.set(3500,2500,1);neb.position.set(-2400,900,-2500);scene.add(neb)}

// ---------- orbits & belt ----------
const ell=(a,th)=>{const x=a*Math.cos(th),z=a*K*Math.sin(th),c=Math.cos(T),s=Math.sin(T);return[x*c-z*s,x*s+z*c]};
function addOrbit(a){const pts=[];for(let i=0;i<=256;i++){const q=ell(a,i/256*6.2832);pts.push(new THREE.Vector3(q[0],0,q[1]))}
 scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xd8e0f5,transparent:true,opacity:.35})))}
const belt=(()=>{const n=3500,p=new Float32Array(n*3);for(let i=0;i<n;i++){const q=ell(112+Math.random()*16,Math.random()*6.2832);p.set([q[0],(Math.random()-.5)*2.5,q[1]],i*3)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));const o=new THREE.Points(g,new THREE.PointsMaterial({color:0xb5aa98,size:.45,transparent:true,opacity:.85}));scene.add(o);return o})();

// ---------- planets (built after loader shows) ----------
const P=[];
function atmo(r,c,i){return new THREE.Mesh(new THREE.SphereGeometry(r*1.12,48,48),new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false,
 uniforms:{c:{value:new THREE.Vector3(...c)},i:{value:i||1}},
 vertexShader:'varying vec3 n,v;void main(){n=normalize(normalMatrix*normal);vec4 m=modelViewMatrix*vec4(position,1.);v=normalize(-m.xyz);gl_Position=projectionMatrix*m;}',
 fragmentShader:'uniform vec3 c;uniform float i;varying vec3 n,v;void main(){float f=pow(.72-dot(n,v),3.);gl_FragColor=vec4(c*f*i*2.2,f);}'}))}
function build(){
 for(let i=2;i<N;i++){const b=B[i];addOrbit(b.a);
  const grp=new THREE.Group(),tilt=new THREE.Group();tilt.rotation.z=b.tilt||(i===7?.45:.1);grp.add(tilt);
  const map=gen(b.f),mat=new THREE.MeshStandardMaterial({map,roughness:.95,metalness:0});
  if(b.bump){mat.bumpMap=map;mat.bumpScale=b.bump*b.r*4}
  const m=new THREE.Mesh(new THREE.SphereGeometry(b.r,64,64),mat);tilt.add(m);b.mesh=m;
  if(b.atm){const a=atmo(b.r,b.atm,b.atmI);tilt.add(a)}
  if(b.earth){const cl=gen((x,y,z)=>{const n=fbm(x*3.2+20,y*3.2,z*3.2,6),a=Math.max(0,Math.min(1,(n-.5)*4));return[255,255,255,a*230]});
   const cm=new THREE.Mesh(new THREE.SphereGeometry(b.r*1.012,64,64),new THREE.MeshStandardMaterial({map:cl,transparent:true,roughness:1,depthWrite:false}));tilt.add(cm);b.clouds=cm;
   const mm=gen((x,y,z)=>{const n=fbm(x*6,y*6,z*6,5),d=fbm(x*3,y*3,z*3,3);const v=130+n*90-(d>.55?40:0);return[v,v,v*.98]});
   const moon=new THREE.Mesh(new THREE.SphereGeometry(b.r*.27,32,32),new THREE.MeshStandardMaterial({map:mm,bumpMap:mm,bumpScale:.1,roughness:1}));grp.add(moon);b.moon=moon}
  if(b.ring){const inn=b.r*1.3,out=b.r*2.3,g=new THREE.RingGeometry(inn,out,128,1),uv=g.attributes.uv,pos=g.attributes.position,v=new THREE.Vector3();
   for(let k=0;k<pos.count;k++){v.fromBufferAttribute(pos,k);uv.setXY(k,(v.length()-inn)/(out-inn),1)}
   const c=document.createElement('canvas');c.width=1024;c.height=2;const x=c.getContext('2d');
   for(let k=0;k<1024;k++){const u=k/1024,n=vn(u*60,1,2)*.6+vn(u*200,3,4)*.4;let a=.2+n*.8;if(u>.5&&u<.56)a*=.05;if(u<.08)a*=.35;if(u>.9)a*=.5;x.fillStyle=`rgba(${215+n*30|0},${190+n*30|0},${150+n*20|0},${Math.min(1,a)})`;x.fillRect(k,0,1,2)}
   const rt=new THREE.CanvasTexture(c);rt.encoding=THREE.sRGBEncoding;
   const rm=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:rt,side:THREE.DoubleSide,transparent:true,depthWrite:false,opacity:.95}));rm.rotation.x=Math.PI/2;tilt.add(rm);
   const sh=new THREE.Mesh(new THREE.RingGeometry(inn,out,64,1),new THREE.MeshBasicMaterial({visible:false}));}
  scene.add(grp);b.grp=grp}
 cv.classList.add('ready');start()}

// ---------- phone tilt: background follows the tilt (only while the page is still) ----------
const TILT={x:0,y:0,cx:0,cy:0,w:0,base:null,lastScroll:0};
const TILT_YAW=.15,TILT_PITCH=.11,STILL_MS=160;
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduceMotion){
 const cl=(v,a,b)=>v<a?a:v>b?b:v;
 addEventListener('scroll',()=>{TILT.lastScroll=performance.now()},{passive:true});
 addEventListener('touchmove',()=>{TILT.lastScroll=performance.now()},{passive:true});
 addEventListener('deviceorientation',e=>{
  if(e.gamma==null&&e.beta==null)return;
  let g=e.gamma||0,b=e.beta||0;
  // landscape: swap the axes so "right" is still the screen's right
  const ang=(screen.orientation&&screen.orientation.angle)||window.orientation||0;
  if(ang===90){const t=g;g=b;b=-t}else if(ang===-90||ang===270){const t=g;g=-b;b=t}else if(ang===180){g=-g;b=-b}
  if(!TILT.base)TILT.base={g,b};
  TILT.x=cl((g-TILT.base.g)/28,-1,1);          // tilt right -> background goes right
  TILT.y=cl((b-TILT.base.b)/28,-1,1);          // bottom edge down -> background goes down
 },true);
 // mouse (desktop) so it can be tried without a phone
 addEventListener('pointermove',e=>{
  if(e.pointerType==='touch')return;
  TILT.x=(e.clientX/innerWidth)*2-1;TILT.y=(e.clientY/innerHeight)*2-1;
 },{passive:true});
}

// ---------- scroll / camera ----------
let target=0,cur=0,t0=performance.now();
function sc(){const m=document.documentElement.scrollHeight-innerHeight;target=m>0?Math.min(1,Math.max(0,scrollY/m))*(N-1):0}
addEventListener('scroll',sc,{passive:true});addEventListener('resize',sc);sc();
const sm=x=>x*x*(3-2*x);
function stage(i,t){
 if(i===0){const th=Math.tan(.3927),D=Math.max(720/(2*th*(W/H)),380/(2*th));return{p:new THREE.Vector3(-150,0,0),o:new THREE.Vector3(0,.8,.6).normalize().multiplyScalar(D)}}
 if(i===1)return{p:new THREE.Vector3(),o:new THREE.Vector3(-.5,.12,1).normalize().multiplyScalar(95)};
 const b=B[i],q=ell(b.a,b.ph+t*b.sp*.3),p=new THREE.Vector3(q[0],0,q[1]),d=b.r*(b.ring?6.6:4.6)*(W/H<.7?1.35:1);
 const dir=p.clone().negate().normalize().applyAxisAngle(new THREE.Vector3(0,1,0),.9);dir.y=.22;return{p,o:dir.normalize().multiplyScalar(d)}}
const YAX=new THREE.Vector3(0,1,0);
let lastY=scrollY,vel=0,tgts=[];
function start(){
 tgts=[...document.querySelectorAll('.section-head,#aboutText,#aboutGrid,#skillsList,#projectsGrid,#statsGrid,.contact-card')];
 let last=0;
 function frame(ms){
  if(document.hidden){requestAnimationFrame(frame);return}
  const t=ms/1000,dt=Math.min(t-last,.1);last=t;
  cur+=(target-cur)*.07;
  const sy=scrollY;vel+=((sy-lastY)-vel)*.18;lastY=sy;const tl=Math.max(-9,Math.min(9,vel*.14));
  tgts.forEach(e=>{e.style.transform=Math.abs(tl)>.05?'perspective(900px) rotateX('+tl.toFixed(2)+'deg)':''});
  const i=Math.min(Math.floor(cur),N-2),f=sm(Math.min(cur-i,1)),A=stage(i,t),C=stage(i+1,t);
  const p=A.p.clone().lerp(C.p,f),o=A.o.clone().lerp(C.o,f);o.y+=Math.sin(Math.PI*f)*A.o.length()*.25;
  o.applyAxisAngle(YAX,Math.sin(t*.3)*.28);cam.position.copy(p).add(o);cam.lookAt(p);
  // tilt only acts once scrolling has stopped; it fades in/out smoothly
  {const still=performance.now()-TILT.lastScroll>STILL_MS;TILT.w+=((still?1:0)-TILT.w)*.08;
   TILT.cx+=(TILT.x-TILT.cx)*.08;TILT.cy+=(TILT.y-TILT.cy)*.08;
   if(TILT.w>.001){cam.rotateY(TILT.cx*TILT_YAW*TILT.w);cam.rotateX(TILT.cy*TILT_PITCH*TILT.w)}}
  
  sunMat.uniforms.t.value=t;sun.rotation.y=t*.02;glow.scale.setScalar(150+Math.sin(t*.9)*6);
  stars.rotation.y=t*.002;belt.rotation.y=t*.01;
  for(let k=2;k<N;k++){const b=B[k],q=ell(b.a,b.ph+t*b.sp*.3);b.grp.position.set(q[0],0,q[1]);b.mesh.rotation.y+=b.rot*2*dt;
   if(b.clouds)b.clouds.rotation.y+=(b.rot*1.25)*dt;if(b.moon)b.moon.position.set(Math.cos(t*.6)*b.r*3.2,Math.sin(t*.6)*b.r*.4,Math.sin(t*.6)*b.r*3.2)}
  R.render(scene,cam);requestAnimationFrame(frame)}
 requestAnimationFrame(frame)}
setTimeout(build,400);

})();
