import * as THREE from 'three';
const $=s=>document.querySelector(s), app=$('#app'), prog=$('#progress'), fail=$('#fail');
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x78c9f4); scene.fog=new THREE.FogExp2(0x78c9f4,.0018);
const camera=new THREE.PerspectiveCamera(67,innerWidth/innerHeight,.1,2200);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight); renderer.shadowMap.enabled=true; app.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x244761,2.7)); const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(-80,180,40);scene.add(sun);
const seg=[{L:150,k:0,g:-.16},{L:180,k:.0055,g:-.30},{L:120,k:0,g:-.48},{L:190,k:-.007,g:-.22},{L:120,k:0,g:.16},{L:220,k:.009,g:-.38},{L:170,k:0,g:-.55},{L:210,k:-.010,g:-.18},{L:160,k:0,g:.22},{L:260,k:.006,g:-.34},{L:260,k:0,g:-.48}];
const samples=[]; let pos=new THREE.Vector3(0,260,0),yaw=0,S=0; const ds=2;
for(const q of seg){for(let d=0;d<q.L;d+=ds){samples.push({s:S,p:pos.clone(),yaw,k:q.k,g:q.g});yaw+=q.k*ds;pos.add(new THREE.Vector3(Math.sin(yaw)*ds,q.g*ds,-Math.cos(yaw)*ds));S+=ds}} const total=S;
const frameAt=s=>{let i=Math.max(0,Math.min(samples.length-2,Math.floor(s/ds))),a=samples[i],b=samples[i+1],u=(s-a.s)/ds;return {p:a.p.clone().lerp(b.p,u),yaw:THREE.MathUtils.lerp(a.yaw,b.yaw,u),k:THREE.MathUtils.lerp(a.k,b.k,u),g:THREE.MathUtils.lerp(a.g,b.g,u)}};
const R=2.15, lip=1.12, cols=11, verts=[],idx=[],colors=[], palette=[new THREE.Color(0x16a9e6),new THREE.Color(0x84ddf7),new THREE.Color(0xf5fbff)];
for(let i=0;i<samples.length;i++){const f=samples[i],right=new THREE.Vector3(Math.cos(f.yaw),0,Math.sin(f.yaw)),c=palette[Math.floor(f.s/22)%palette.length];for(let j=0;j<cols;j++){let th=-lip+(2*lip*j/(cols-1));let p=f.p.clone().addScaledVector(right,R*Math.sin(th));p.y+=R*(1-Math.cos(th));verts.push(p.x,p.y,p.z);colors.push(c.r,c.g,c.b)}}
for(let i=0;i<samples.length-1;i++)for(let j=0;j<cols-1;j++){let a=i*cols+j,b=a+1,c=a+cols,d=c+1;idx.push(a,c,b,b,c,d)}
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(idx);geo.computeVertexNormals();scene.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.32,metalness:.03,side:THREE.DoubleSide})));
const rider=new THREE.Group(), skin=new THREE.MeshStandardMaterial({color:0xffc3a1}), suit=new THREE.MeshStandardMaterial({color:0xff594d});
const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.34,1.0,5,9),suit);torso.rotation.x=Math.PI/2;rider.add(torso);
const head=new THREE.Mesh(new THREE.SphereGeometry(.31,14,10),skin);head.position.z=-.9;rider.add(head);
const arms=[],forearms=[],legs=[],shins=[];
function jointedLimb(x,z,upperLen,lowerLen,rad,mat,upperList,lowerList){
  const upper=new THREE.Group(); upper.position.set(x,.02,z);
  const upperMesh=new THREE.Mesh(new THREE.CapsuleGeometry(rad,upperLen,4,7),mat); upperMesh.rotation.x=Math.PI/2; upperMesh.position.z=upperLen*.5; upper.add(upperMesh);
  const lower=new THREE.Group(); lower.position.z=upperLen;
  const lowerMesh=new THREE.Mesh(new THREE.CapsuleGeometry(rad*.88,lowerLen,4,7),mat); lowerMesh.rotation.x=Math.PI/2; lowerMesh.position.z=lowerLen*.5; lower.add(lowerMesh); upper.add(lower); rider.add(upper);
  upperList.push(upper); lowerList.push(lower);
}
jointedLimb(-.42,-.42,.38,.36,.10,skin,arms,forearms); jointedLimb(.42,-.42,.38,.36,.10,skin,arms,forearms);
jointedLimb(-.23,.55,.42,.42,.13,suit,legs,shins); jointedLimb(.23,.55,.42,.42,.13,suit,legs,shins);
scene.add(rider);
const cloudMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.65,depthWrite:false});for(let i=0;i<55;i++){let c=new THREE.Mesh(new THREE.SphereGeometry(10+Math.random()*22,10,7),cloudMat);c.scale.y=.25;c.position.set((Math.random()-.5)*650,20+Math.random()*90,-Math.random()*1900);scene.add(c)}
let s=4,v=26,theta=0,omega=0,input=0,holdTime=0,dead=false,airVel=new THREE.Vector3(),last=performance.now(),checkpoint=4;
function reset(){s=checkpoint;v=26;theta=omega=input=holdTime=0;dead=false;fail.style.display='none'}
$('#retry').onclick=reset;function bind(id,val){let e=$(id);e.addEventListener('pointerdown',x=>{x.preventDefault();input=val;holdTime=0});['pointerup','pointercancel','pointerleave'].forEach(n=>e.addEventListener(n,()=>{if(input===val){input=0;holdTime=0}}))}bind('#l',-1);bind('#r',1);
function tangent(f){return new THREE.Vector3(Math.sin(f.yaw),f.g,-Math.cos(f.yaw)).normalize()} function right(f){return new THREE.Vector3(Math.cos(f.yaw),0,Math.sin(f.yaw)).normalize()}
function worldPos(f,th){return f.p.clone().addScaledVector(right(f),R*Math.sin(th)).add(new THREE.Vector3(0,R*(1-Math.cos(th))+.42,0))}
function tick(now){
  const dt=Math.min(.03,(now-last)/1000); last=now;
  const flap=now*.009;
  arms[0].rotation.y=.35*Math.sin(flap); arms[1].rotation.y=-.35*Math.sin(flap+.7);
  arms[0].rotation.z=.18*Math.sin(flap*1.31); arms[1].rotation.z=-.18*Math.sin(flap*1.31+.5);
  legs[0].rotation.y=.22*Math.sin(flap*1.17+1.2); legs[1].rotation.y=-.22*Math.sin(flap*1.17+.2);
  legs[0].rotation.z=.12*Math.sin(flap*.91); legs[1].rotation.z=-.12*Math.sin(flap*.91+.8);
  forearms[0].rotation.x=.35+.38*Math.sin(flap*1.43+.4); forearms[1].rotation.x=.35+.38*Math.sin(flap*1.37+1.7);
  forearms[0].rotation.y=.18*Math.sin(flap*.83); forearms[1].rotation.y=-.18*Math.sin(flap*.89+.6);
  shins[0].rotation.x=-.25+.42*Math.sin(flap*1.21+2.1); shins[1].rotation.x=-.25+.42*Math.sin(flap*1.29+.9);
  shins[0].rotation.y=.15*Math.sin(flap*.77+.3); shins[1].rotation.y=-.15*Math.sin(flap*.81+1.1);
  if(!dead){
    let f=frameAt(s);
    v+=(-9.81*f.g+4.6-.055*v)*dt; v=THREE.MathUtils.clamp(v,15,70); s+=v*dt;
    const curveA=-v*v*f.k;
    if(input!==0) holdTime=Math.min(1.4,holdTime+dt); else holdTime=0;
    // Hold-to-build steering: taps are gentle; sustained press ramps sharply for corner recovery.
    const h=holdTime/1.4;
    const steerScale=5+55*Math.pow(h,1.65);
    const control=input*steerScale, center=-9.81*Math.sin(theta);
    omega+=((control+curveA+center)/R-omega*2.25)*dt; omega=THREE.MathUtils.clamp(omega,-1.25,1.25); theta+=omega*dt;
    if(s-checkpoint>220) checkpoint=s;
    f=frameAt(Math.min(s,total-3));
    const p=worldPos(f,theta),t=tangent(f),rr=right(f);
    const normal=rr.clone().multiplyScalar(-Math.sin(theta)).add(new THREE.Vector3(0,Math.cos(theta),0)).normalize();
    rider.position.copy(p); rider.up.copy(normal); rider.lookAt(p.clone().add(t));
    camera.position.copy(p).addScaledVector(t,-7.6).addScaledVector(normal,3.5);
    camera.lookAt(frameAt(Math.min(total-3,s+95)).p);
    prog.textContent=Math.min(100,Math.floor(s/total*100))+'%';
    if(Math.abs(theta)>=lip||s>=total-4){
      dead=true; airVel.copy(t).multiplyScalar(v).addScaledVector(rr,omega*R).addScaledVector(normal,3);
      setTimeout(()=>fail.style.display='grid',180);
    }
  } else {
    rider.position.addScaledVector(airVel,dt); airVel.y-=9.81*dt; camera.lookAt(rider.position);
  }
  renderer.render(scene,camera); requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
