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
const R=1.72, lip=1.12, cols=11, verts=[],idx=[],colors=[], palette=[new THREE.Color(0x16a9e6),new THREE.Color(0x84ddf7),new THREE.Color(0xf5fbff)];
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
// Water spray: pooled translucent droplets emitted behind the rider while in contact with the slide.
const sprayGeo=new THREE.SphereGeometry(.075,5,4), sprayMat=new THREE.MeshBasicMaterial({color:0xe8fbff,transparent:true,opacity:.72,depthWrite:false});
const sprayPool=[]; for(let i=0;i<96;i++){const m=new THREE.Mesh(sprayGeo,sprayMat.clone());m.visible=false;scene.add(m);sprayPool.push({m,life:0,vel:new THREE.Vector3()})}
let sprayCursor=0, sprayAcc=0;
function emitSpray(p,t,rr,normal,speed,dt){
  sprayAcc+=dt*(24+speed*1.15);
  while(sprayAcc>=1){sprayAcc-=1;const q=sprayPool[sprayCursor++%sprayPool.length];q.life=.28+Math.random()*.24;q.m.visible=true;
    q.m.position.copy(p).addScaledVector(t,-.55).addScaledVector(rr,(Math.random()-.5)*.65).addScaledVector(normal,.08);
    q.vel.copy(t).multiplyScalar(-1.5-Math.random()*2.2).addScaledVector(rr,(Math.random()-.5)*(2.2+speed*.025)).addScaledVector(normal,1.1+Math.random()*2.4);
    const z=.55+Math.min(1,speed/55)*.75;q.m.scale.setScalar(z*(.65+Math.random()*.7));
  }
}
function updateSpray(dt){for(const q of sprayPool){if(q.life<=0)continue;q.life-=dt;if(q.life<=0){q.m.visible=false;continue}q.vel.y-=5.5*dt;q.m.position.addScaledVector(q.vel,dt);q.m.material.opacity=Math.max(0,q.life*1.8)}}
// Stage 2 target: stacked rigid blocks with lightweight impulse + gravity physics.
const targetFrame=frameAt(total-3), targetT=tangent(targetFrame), targetR=right(targetFrame);
const targetOrigin=targetFrame.p.clone().addScaledVector(targetT,105); targetOrigin.y-=38;
const ground=new THREE.Mesh(new THREE.BoxGeometry(30,1,24),new THREE.MeshStandardMaterial({color:0x67b85f,roughness:.9}));ground.position.copy(targetOrigin).add(new THREE.Vector3(0,-.5,0));scene.add(ground);
const blocks=[], blockGeo=new THREE.BoxGeometry(1.45,1.0,1.45), blockMats=[0xffd166,0x06d6a0,0x118ab2,0xef476f].map(x=>new THREE.MeshStandardMaterial({color:x,roughness:.55}));
for(let y=0;y<9;y++)for(let x=-4;x<=4;x++){const m=new THREE.Mesh(blockGeo,blockMats[(x+y+8)%blockMats.length]);m.position.copy(targetOrigin).addScaledVector(targetR,x*1.48).add(new THREE.Vector3(0,.52+y*1.02,0));scene.add(m);blocks.push({m,vel:new THREE.Vector3(),spin:new THREE.Vector3(),active:false,hit:false})}
let stage=1,score=0,launchVel=new THREE.Vector3(),impactDone=false;
function activateBlock(b,imp){if(!b.active)b.active=true;b.vel.add(imp);b.spin.add(new THREE.Vector3((Math.random()-.5)*5,(Math.random()-.5)*5,(Math.random()-.5)*5))}
function updateBlocks(dt){for(const b of blocks){if(!b.active)continue;b.vel.y-=18*dt;b.m.position.addScaledVector(b.vel,dt);b.m.rotation.x+=b.spin.x*dt;b.m.rotation.y+=b.spin.y*dt;b.m.rotation.z+=b.spin.z*dt;b.vel.multiplyScalar(Math.pow(.992,dt*60));if(b.m.position.y<targetOrigin.y+.52){b.m.position.y=targetOrigin.y+.52;if(b.vel.y<0)b.vel.y*=-.22;b.vel.x*=.82;b.vel.z*=.82}
  for(const o of blocks){if(o===b||!o.active)continue;const d=b.m.position.distanceTo(o.m.position);if(d<1.38&&d>.001){const n=o.m.position.clone().sub(b.m.position).normalize(),rv=b.vel.clone().sub(o.vel),sep=Math.max(0,rv.dot(n));if(sep>0){const j=n.multiplyScalar(sep*.52);b.vel.sub(j);o.vel.add(j);activateBlock(o,new THREE.Vector3())}}}
}}
const cloudMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.65,depthWrite:false});for(let i=0;i<55;i++){let c=new THREE.Mesh(new THREE.SphereGeometry(10+Math.random()*22,10,7),cloudMat);c.scale.y=.25;c.position.set((Math.random()-.5)*650,20+Math.random()*90,-Math.random()*1900);scene.add(c)}
let s=4,v=26,theta=0,omega=0,input=0,holdTime=0,dead=false,airVel=new THREE.Vector3(),last=performance.now(),checkpoint=4;
const TEST_STAGE2=true;
const camState={back:5.15,height:2.35,side:0,lookAhead:72,aheadMix:.18};
function reset(){s=TEST_STAGE2?total-300:checkpoint;v=TEST_STAGE2?30:26;theta=omega=input=holdTime=0;dead=false;stage=1;score=0;impactDone=false;fail.style.display='none';for(const b of blocks){b.active=false;b.hit=false;b.vel.set(0,0,0);b.spin.set(0,0,0)}}
function launchStage2(p,t,rr){stage=2;dead=false;impactDone=false;launchVel.copy(t).multiplyScalar(v).addScaledVector(rr,omega*R*2.4);launchVel.y+=8;rider.position.copy(p).addScaledVector(t,4.5).add(new THREE.Vector3(0,1.2,0));prog.textContent='DESTROY · 0';}
$('#retry').onclick=reset;function bind(id,val){let e=$(id);e.addEventListener('contextmenu',x=>x.preventDefault());e.addEventListener('selectstart',x=>x.preventDefault());e.addEventListener('pointerdown',x=>{x.preventDefault();e.setPointerCapture?.(x.pointerId);input=val;holdTime=0});['pointerup','pointercancel','lostpointercapture'].forEach(n=>e.addEventListener(n,x=>{x.preventDefault?.();if(input===val){input=0;holdTime=0}}))}bind('#l',-1);bind('#r',1);
function tangent(f){return new THREE.Vector3(Math.sin(f.yaw),f.g,-Math.cos(f.yaw)).normalize()} function right(f){return new THREE.Vector3(Math.cos(f.yaw),0,Math.sin(f.yaw)).normalize()}
function worldPos(f,th){return f.p.clone().addScaledVector(right(f),R*Math.sin(th)).add(new THREE.Vector3(0,R*(1-Math.cos(th))+.42,0))}
function tick(now){
  const dt=Math.min(.03,(now-last)/1000); last=now;
  const flap=now*(dead?.016:.0065), amp=dead?1:0.28;
  arms[0].rotation.y=amp*.48*Math.sin(flap); arms[1].rotation.y=-amp*.48*Math.sin(flap+.7);
  arms[0].rotation.z=amp*.32*Math.sin(flap*1.31); arms[1].rotation.z=-amp*.32*Math.sin(flap*1.31+.5);
  legs[0].rotation.y=amp*.34*Math.sin(flap*1.17+1.2); legs[1].rotation.y=-amp*.34*Math.sin(flap*1.17+.2);
  legs[0].rotation.z=amp*.22*Math.sin(flap*.91); legs[1].rotation.z=-amp*.22*Math.sin(flap*.91+.8);
  forearms[0].rotation.x=.22+amp*.72*Math.sin(flap*1.43+.4); forearms[1].rotation.x=.22+amp*.72*Math.sin(flap*1.37+1.7);
  forearms[0].rotation.y=amp*.32*Math.sin(flap*.83); forearms[1].rotation.y=-amp*.32*Math.sin(flap*.89+.6);
  shins[0].rotation.x=-.16+amp*.78*Math.sin(flap*1.21+2.1); shins[1].rotation.x=-.16+amp*.78*Math.sin(flap*1.29+.9);
  shins[0].rotation.y=amp*.28*Math.sin(flap*.77+.3); shins[1].rotation.y=-amp*.28*Math.sin(flap*.81+1.1);
  if(!dead&&stage===1){
    let f=frameAt(s);
    v+=(-9.81*f.g+4.6-.055*v)*dt; v=THREE.MathUtils.clamp(v,15,70); s+=v*dt;
    const curveA=-v*v*f.k;
    if(input!==0) holdTime=Math.min(.9,holdTime+dt); else holdTime=0;
    // Hold-to-build steering: taps are gentle; sustained press ramps sharply for corner recovery.
    const h=holdTime/.9;
    const steerScale=22+42*Math.pow(h,1.35);
    const control=input*steerScale, center=-9.81*Math.sin(theta);
    omega+=((control+curveA+center)/R-omega*2.25)*dt; omega=THREE.MathUtils.clamp(omega,-1.25,1.25); theta+=omega*dt;
    if(s-checkpoint>220) checkpoint=s;
    f=frameAt(Math.min(s,total-3));
    const p=worldPos(f,theta),t=tangent(f),rr=right(f);
    const normal=rr.clone().multiplyScalar(-Math.sin(theta)).add(new THREE.Vector3(0,Math.cos(theta),0)).normalize();
    rider.position.copy(p); rider.up.copy(normal); rider.lookAt(p.clone().add(t));
    emitSpray(p,t,rr,normal,v,dt);
    // Look-ahead camera state machine: anticipate upcoming course shape, then blend shot parameters.
    const fNear=frameAt(Math.min(total-3,s+28)), fFar=frameAt(Math.min(total-3,s+65));
    const futureK=Math.abs(fNear.k)>.003?fNear.k:fFar.k;
    const turn=THREE.MathUtils.clamp(Math.max(Math.abs(f.k),Math.abs(fNear.k),Math.abs(fFar.k))/.009,0,1);
    const steepDown=THREE.MathUtils.clamp((Math.max(-f.g,-fNear.g,-fFar.g)-.18)/.37,0,1);
    const uphill=THREE.MathUtils.clamp((Math.max(f.g,fNear.g,fFar.g)-.02)/.20,0,1);
    const crest=THREE.MathUtils.clamp((fNear.g-fFar.g+.08)/.32,0,1)*THREE.MathUtils.clamp((fNear.g+.03)/.18,0,1);
    let targetBack=5.15,targetHeight=2.35,targetSide=0,targetLook=72,targetMix=.18;
    if(steepDown>.08){targetBack+=1.25*steepDown;targetHeight+=1.55*steepDown;targetLook+=38*steepDown;targetMix+=.09*steepDown}
    if(uphill>.08){targetBack-=.55*uphill;targetHeight-=.62*uphill;targetLook-=20*uphill;targetMix-=.045*uphill}
    if(crest>.08){targetBack-=.28*crest;targetHeight+=1.0*crest;targetLook-=24*crest;targetMix-=.04*crest}
    if(turn>.08){targetSide=-Math.sign(futureK||f.k)*2.05*turn;targetBack+=.42*turn;targetHeight+=.28*turn;targetLook+=16*turn;targetMix+=.055*turn}
    const blend=1-Math.exp(-3.8*dt);
    camState.back=THREE.MathUtils.lerp(camState.back,targetBack,blend);camState.height=THREE.MathUtils.lerp(camState.height,targetHeight,blend);
    camState.side=THREE.MathUtils.lerp(camState.side,targetSide,blend);camState.lookAhead=THREE.MathUtils.lerp(camState.lookAhead,targetLook,blend);camState.aheadMix=THREE.MathUtils.lerp(camState.aheadMix,targetMix,blend);
    const camTarget=p.clone().addScaledVector(normal,.34).addScaledVector(t,1.0);
    const desiredCam=p.clone().addScaledVector(t,-camState.back).addScaledVector(normal,camState.height).addScaledVector(rr,camState.side);
    camera.position.copy(desiredCam);
    const ahead=frameAt(Math.min(total-3,s+camState.lookAhead)).p;
    const lookTarget=camTarget.clone().addScaledVector(normal,-.58).lerp(ahead,THREE.MathUtils.clamp(camState.aheadMix,.11,.35));
    camera.up.copy(normal); camera.lookAt(lookTarget);
    prog.textContent=Math.min(100,Math.floor(s/total*100))+'%';
    if(Math.abs(theta)>=lip){dead=true;airVel.copy(t).multiplyScalar(v).addScaledVector(rr,omega*R).addScaledVector(normal,3);setTimeout(()=>{if(dead&&stage===1)fail.style.display='grid'},2000)}
    else if(s>=total-10){launchStage2(p,t,rr)}
    } else if(!dead&&stage===2){
      const steer=right(targetFrame).multiplyScalar(input*7.5*dt); launchVel.add(steer); launchVel.y-=9.81*dt; rider.position.addScaledVector(launchVel,dt);
      const toTarget=targetOrigin.clone().sub(rider.position),flightDir=launchVel.clone().normalize();rider.lookAt(rider.position.clone().add(flightDir));
      const desired=rider.position.clone().addScaledVector(flightDir,-6.2).add(new THREE.Vector3(0,2.0,0));camera.position.lerp(desired,1-Math.exp(-8*dt));camera.up.set(0,1,0);camera.lookAt(rider.position.clone().lerp(targetOrigin,.28));
      if(!impactDone){for(const b of blocks){const d=rider.position.distanceTo(b.m.position);if(d<1.25){impactDone=true;const impact=launchVel.clone().multiplyScalar(.42);for(const o of blocks){const dist=o.m.position.distanceTo(rider.position);if(dist<4.8){const fall=Math.max(.08,1-dist/4.8),dir=o.m.position.clone().sub(rider.position).normalize();activateBlock(o,dir.multiplyScalar(impact.length()*fall).addScaledVector(impact.clone().normalize(),impact.length()*.32*fall));if(!o.hit){o.hit=true;score+=Math.round(100*fall)}}}launchVel.multiplyScalar(.18);break}}}
      let destroyed=0;for(const b of blocks){if(b.active&&(Math.abs(b.m.position.x-targetOrigin.x)>7||b.m.position.y<targetOrigin.y+.2))destroyed++}score+=destroyed;prog.textContent='DESTROY · '+score;
      if(rider.position.y<targetOrigin.y-3||toTarget.length()>170){dead=true;setTimeout(()=>{fail.style.display='grid'},2000)}

  } else {
    rider.position.addScaledVector(airVel,dt); airVel.y-=9.81*dt;
    // Airborne shot: detach from slide framing and orbit slightly above/behind the falling rider.
    const fallDir=airVel.clone(); if(fallDir.lengthSq()<.01) fallDir.set(0,-1,0); fallDir.normalize();
    const fallCam=rider.position.clone().addScaledVector(fallDir,-5.8).add(new THREE.Vector3(0,2.3,0));
    camera.position.lerp(fallCam,1-Math.exp(-5.5*dt)); camera.up.set(0,1,0); camera.lookAt(rider.position);
  }
  updateSpray(dt); updateBlocks(dt);
  renderer.render(scene,camera); requestAnimationFrame(tick);
}
reset(); requestAnimationFrame(tick);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
