import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import RAPIER from '@dimforge/rapier3d-compat';
await RAPIER.init();
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
// Replace the primitive prototype body with the Quaternius Casual skinned character.
// Gameplay/physics still use the existing rider root and capsule, so this is a visual-only upgrade.
let characterMixer=null,characterModel=null,characterBones={},characterBase={};
function findBone(...keys){let hit=null;characterModel?.traverse(o=>{if(hit||!o.isBone)return;const n=o.name.toLowerCase().replace(/[^a-z0-9]/g,'');if(keys.some(k=>n.includes(k.toLowerCase().replace(/[^a-z0-9]/g,''))))hit=o});return hit}
function bindBone(key,b){if(b){characterBones[key]=b;characterBase[key]=b.rotation.clone()}}
function poseBone(key,x=0,y=0,z=0){const b=characterBones[key],q=characterBase[key];if(b&&q)b.rotation.set(q.x+x,q.y+y,q.z+z)}
function updateCharacterPose(){
  if(!characterModel)return;const t=performance.now()*.001;
  if(stage===1&&!dead){
    const w=Math.sin(t*6.5)*.035;
    poseBone('spine',-.18+w);poseBone('chest',-.14-w*.5);poseBone('head',.18);
    poseBone('la',-.55,0,-.18);poseBone('ra',-.55,0,.18);poseBone('lf',-.32,0,-.08);poseBone('rf',-.32,0,.08);
    poseBone('lt',.16,0,-.05);poseBone('rt',.16,0,.05);poseBone('ls',-.25);poseBone('rs',-.25);
  }else if(stage===2&&!dead&&!impactDone){
    const a=Math.sin(t*8)*.28,b=Math.sin(t*6.1+1.7)*.22;
    poseBone('spine',-.08,0,a*.1);poseBone('chest',.03,a*.08);poseBone('head',.08,-a*.1);
    poseBone('la',-.35+b,0,-.45-a*.22);poseBone('ra',-.35-b,0,.45+a*.22);poseBone('lf',-.42-a*.22);poseBone('rf',-.42+a*.22);
    poseBone('lt',.18+a*.15,0,-.08);poseBone('rt',.18-a*.15,0,.08);poseBone('ls',-.32+b*.2);poseBone('rs',-.32-b*.2);
  }else{
    const j=Math.sin(t*9)*.14;
    poseBone('spine',-.12,0,j*.15);poseBone('chest',-.08,j*.12);poseBone('head',.1,-j*.15);
    poseBone('la',-.48+j,0,-.32);poseBone('ra',-.48-j,0,.32);poseBone('lf',-.46-j*.4);poseBone('rf',-.46+j*.4);
    poseBone('lt',.22-j*.2,0,-.08);poseBone('rt',.22+j*.2,0,.08);poseBone('ls',-.4+j*.25);poseBone('rs',-.4-j*.25);
  }
}
new GLTFLoader().load('./models/Casual.gltf',g=>{
  torso.visible=false;head.visible=false;for(const x of [...arms,...legs])x.visible=false;
  characterModel=g.scene;characterModel.name='Quaternius_Casual';characterModel.rotation.x=-Math.PI/2;
  characterModel.scale.setScalar(.92);characterModel.position.set(0,.18,.18);
  characterModel.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false}});
  rider.add(characterModel);
  bindBone('spine',findBone('spine'));bindBone('chest',findBone('chest'));bindBone('head',findBone('head'));
  bindBone('la',findBone('upperarml'));bindBone('ra',findBone('upperarmr'));
  bindBone('lf',findBone('lowerarml'));bindBone('rf',findBone('lowerarmr'));
  bindBone('lt',findBone('upperlegl'));bindBone('rt',findBone('upperlegr'));
  bindBone('ls',findBone('lowerlegl'));bindBone('rs',findBone('lowerlegr'));
},undefined,e=>console.error('Character model load failed',e));
// Water spray: pooled translucent droplets emitted behind the rider while in contact with the slide.
const sprayGeo=new THREE.SphereGeometry(.075,5,4), sprayMat=new THREE.MeshBasicMaterial({color:0xe8fbff,transparent:true,opacity:.72,depthWrite:false});
const sprayPool=[]; for(let i=0;i<192;i++){const m=new THREE.Mesh(sprayGeo,sprayMat.clone());m.visible=false;scene.add(m);sprayPool.push({m,life:0,vel:new THREE.Vector3()})}
let sprayCursor=0, sprayAcc=0;
function emitSpray(p,t,rr,normal,speed,dt){
  sprayAcc+=dt*(48+speed*2.30);
  while(sprayAcc>=1){sprayAcc-=1;const q=sprayPool[sprayCursor++%sprayPool.length];q.life=.28+Math.random()*.24;q.m.visible=true;
    q.m.position.copy(p).addScaledVector(t,-.55).addScaledVector(rr,(Math.random()-.5)*.65).addScaledVector(normal,.08);
    q.vel.copy(t).multiplyScalar(-1.5-Math.random()*2.2).addScaledVector(rr,(Math.random()-.5)*(2.2+speed*.025)).addScaledVector(normal,1.1+Math.random()*2.4);
    const z=.55+Math.min(1,speed/55)*.75;q.m.scale.setScalar(z*(.65+Math.random()*.7));
  }
}
function updateSpray(dt){for(const q of sprayPool){if(q.life<=0)continue;q.life-=dt;if(q.life<=0){q.m.visible=false;continue}q.vel.y-=5.5*dt;q.m.position.addScaledVector(q.vel,dt);q.m.material.opacity=Math.max(0,q.life*1.8)}}
// Stage 2 target: stacked rigid blocks with lightweight impulse + gravity physics.
const targetFrame=frameAt(total-3), targetT=tangent(targetFrame), targetR=right(targetFrame);
const targetForward=new THREE.Vector3(targetT.x,0,targetT.z).normalize();
const targetOrigin=targetFrame.p.clone().addScaledVector(targetForward,40); targetOrigin.y-=12;
const ground=new THREE.Mesh(new THREE.BoxGeometry(30,1,24),new THREE.MeshStandardMaterial({color:0x67b85f,roughness:.9}));ground.position.copy(targetOrigin).add(new THREE.Vector3(0,-.5,0));scene.add(ground);
const physics=new RAPIER.World({x:0,y:-9.81,z:0});
const groundBody=physics.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(ground.position.x,ground.position.y,ground.position.z));
physics.createCollider(RAPIER.ColliderDesc.cuboid(15,.5,12).setFriction(.85).setRestitution(.08),groundBody);
const blocks=[], supports=[];
const blockGeo=new THREE.BoxGeometry(1.35,.95,1.35), blockMats=[0xffd166,0x06d6a0,0x118ab2,0xef476f].map(x=>new THREE.MeshStandardMaterial({color:x,roughness:.55}));
const supportMat=new THREE.MeshStandardMaterial({color:0x8c9299,roughness:.72,metalness:.08});
const scoreMaterialCache=new Map();
function scoreMaterial(baseMat,value){
  const key=value+'-'+baseMat.color.getHexString();if(scoreMaterialCache.has(key))return scoreMaterialCache.get(key);
  const cv=document.createElement('canvas');cv.width=512;cv.height=512;const x=cv.getContext('2d');
  x.fillStyle='#'+baseMat.color.getHexString();x.fillRect(0,0,512,512);
  x.font='900 190px sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineWidth=20;x.strokeStyle='rgba(0,0,0,.38)';x.strokeText(String(value),256,265);x.fillStyle='white';x.fillText(String(value),256,265);
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const mat=baseMat.clone();mat.map=tex;mat.color.set(0xffffff);mat.needsUpdate=true;scoreMaterialCache.set(key,mat);return mat;
}
function makeBody(mesh,half,density=1.35,isSupport=false,value=100){
  scene.add(mesh);
  const body=physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(mesh.position.x,mesh.position.y,mesh.position.z));
  physics.createCollider(RAPIER.ColliderDesc.cuboid(half.x,half.y,half.z).setDensity(density).setFriction(isSupport?.78:.68).setRestitution(isSupport?.015:.025),body);
  if(!isSupport&&value>0)mesh.material=scoreMaterial(mesh.material,value);const o={m:mesh,body,home:mesh.position.clone(),hit:false,removed:false,scored:false,isSupport,value};(isSupport?supports:blocks).push(o);return o;
}
// Stage-1 target: Angry-Birds-like 3D tower. Two bays, load-bearing posts, and two hard floor slabs.
// Ordinary scoring blocks can cascade, but the slabs/posts prevent a trivial bottom-row wipe from auto-clearing everything.
for(let tier=0;tier<3;tier++){
  const baseY=.5+tier*3.05;
  for(const sx of [-1,1]){
    const px=sx*3.05;
    for(let row=0;row<2;row++)for(let col=-1;col<=1;col++){
      const m=new THREE.Mesh(blockGeo,blockMats[(tier*2+row+col+7)%blockMats.length]);
      m.position.copy(targetOrigin).addScaledVector(targetR,px+col*1.38).add(new THREE.Vector3(0,baseY+row*.98,0));
      makeBody(m,new THREE.Vector3(.675,.475,.675),1.35,false,tier===2?175:(tier===1?125:100));
    }
  }
  // paired load-bearing posts between bays
  for(const px of [-1.48,1.48]){
    const m=new THREE.Mesh(new THREE.BoxGeometry(.52,2.35,1.55),supportMat);
    m.position.copy(targetOrigin).addScaledVector(targetR,px).add(new THREE.Vector3(0,baseY+.72,0));
    makeBody(m,new THREE.Vector3(.26,1.175,.775),2.8,true,0);
  }
  if(tier<2){
    const slab=new THREE.Mesh(new THREE.BoxGeometry(9.8,.42,1.75),supportMat);
    slab.position.copy(targetOrigin).add(new THREE.Vector3(0,baseY+2.18,0));
    // orient slab across target face
    slab.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),targetR.clone().normalize());
    makeBody(slab,new THREE.Vector3(4.9,.21,.875),3.8,true,0);
  }
}
// crown: fewer, higher-value blocks reward deliberate upper shots.
for(let x=-2;x<=2;x++){const m=new THREE.Mesh(blockGeo,blockMats[(x+6)%blockMats.length]);m.position.copy(targetOrigin).addScaledVector(targetR,x*1.42).add(new THREE.Vector3(0,9.65,0));makeBody(m,new THREE.Vector3(.675,.475,.675),1.25,false,250)}
const allTargetBodies=()=>blocks.concat(supports);
const fragments=[];let combo=0,comboClock=0;
const comboHud=document.querySelector('#combo'),popLayer=document.querySelector('#scorePops');
function updateComboHud(){
  if(combo<2){comboHud.classList.remove('show');return}
  comboHud.textContent='COMBO ×'+combo;comboHud.classList.add('show');
  comboHud.classList.remove('bounce');void comboHud.offsetWidth;comboHud.classList.add('bounce');
}
function scorePop(pos,value){
  combo=comboClock>0?combo+1:1;comboClock=.72;updateComboHud();
  const view=pos.clone().applyMatrix4(camera.matrixWorldInverse);if(view.z>=0)return;
  const p=pos.clone().project(camera),el=document.createElement('div');el.className='scorePop';el.textContent='+'+value;
  el.style.left=(THREE.MathUtils.clamp(p.x*.5+.5,.06,.94)*100)+'%';el.style.top=(THREE.MathUtils.clamp(-p.y*.5+.5,.10,.88)*100)+'%';popLayer.appendChild(el);
  setTimeout(()=>el.remove(),900);
}
function fractureBlock(b){
  if(b.fractured||b.removed)return;b.fractured=true;
  const p=b.body.translation(),q=b.body.rotation(),lv=b.body.linvel(),av=b.body.angvel();
  scene.remove(b.m);physics.removeRigidBody(b.body);b.removed=true;
  const offsets=[[-.34,.24,-.34],[.34,.24,.34],[-.34,-.24,.34],[.34,-.24,-.34]];
  for(const o of offsets){
    const m=new THREE.Mesh(new THREE.BoxGeometry(.62,.42,.62),b.m.material);m.position.set(p.x+o[0],p.y+o[1],p.z+o[2]);m.quaternion.set(q.x,q.y,q.z,q.w);scene.add(m);
    const rb=physics.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(m.position.x,m.position.y,m.position.z).setRotation(q).setLinearDamping(.22).setAngularDamping(.34).setCcdEnabled(true));
    physics.createCollider(RAPIER.ColliderDesc.cuboid(.31,.21,.31).setDensity(1.2).setFriction(.68).setRestitution(.02),rb);
    rb.setLinvel({x:lv.x,y:lv.y,z:lv.z},true);rb.setAngvel({x:av.x,y:av.y,z:av.z},true);fragments.push({m,body:rb,t:0,rest:0});
  }
  scorePop(new THREE.Vector3(p.x,p.y,p.z),b.value);
}
function updateEffects(dt){
  comboClock=Math.max(0,comboClock-dt);
  if(comboClock===0&&combo!==0){combo=0;comboHud.classList.remove('show')}
  for(let i=fragments.length-1;i>=0;i--){const f=fragments[i],p=f.body.translation(),q=f.body.rotation();f.m.position.set(p.x,p.y,p.z);f.m.quaternion.set(q.x,q.y,q.z,q.w);f.t+=dt;const v=f.body.linvel();if(p.y<=targetOrigin.y+.45&&Math.hypot(v.x,v.y,v.z)<.35)f.rest+=dt;else f.rest=0;if(f.rest>1.4||f.t>6){scene.remove(f.m);physics.removeRigidBody(f.body);fragments.splice(i,1)}}
}

let removedScore=0;
function releaseTarget(){for(const b of allTargetBodies()){if(b.removed)continue;const p=b.body.translation(),q=b.body.rotation();b.body.setBodyType(RAPIER.RigidBodyType.Dynamic,true);b.body.setTranslation(p,true);b.body.setRotation(q,true);b.body.setLinvel({x:0,y:0,z:0},true);b.body.setAngvel({x:0,y:0,z:0},true);b.body.setLinearDamping(b.isSupport?.28:.18);b.body.setAngularDamping(b.isSupport?.42:.30);b.body.wakeUp()}}
const PHYS_STEP=1/60;let physAcc=0;
function syncPhysics(dt){
  physAcc=Math.min(physAcc+Math.min(dt||PHYS_STEP,.05),PHYS_STEP*4);
  physics.timestep=PHYS_STEP;
  let steps=0;
  while(physAcc>=PHYS_STEP&&steps<4){physics.step();physAcc-=PHYS_STEP;steps++}
  for(const b of allTargetBodies()){if(b.removed)continue;const p=b.body.translation(),q=b.body.rotation();b.m.position.set(p.x,p.y,p.z);b.m.quaternion.set(q.x,q.y,q.z,q.w)}
}
function removeScoredBlocks(dt){
  if(!impactDone)return;
  for(const b of blocks){if(b.removed)continue;
    const moved=b.m.position.distanceTo(b.home),onGround=b.m.position.y<=targetOrigin.y+.72;
    b.groundTime=onGround?(b.groundTime||0)+dt:0;
    if(!b.scored&&(moved>3.25||b.groundTime>.38)){
      b.scored=true;removedScore+=b.value;fractureBlock(b);
    }
  }
}
let stage=1,score=0,launchVel=new THREE.Vector3(),impactDone=false,flightCamBlend=0,launchCamPos=new THREE.Vector3(),launchCamLook=new THREE.Vector3(),finishTimer=0,riderGrounded=false,ragdoll=false,resultShown=false,stage2Time=0,impactTime=0;
const riderSpin=new THREE.Vector3();
const riderBody=physics.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,-500,0).setCanSleep(true).setCcdEnabled(true));
const riderCollider=physics.createCollider(RAPIER.ColliderDesc.capsule(.72,.38).setDensity(11.0).setFriction(.62).setRestitution(.04),riderBody);
function startRagdoll(){
  if(ragdoll)return;ragdoll=true;
  riderBody.setTranslation({x:rider.position.x,y:rider.position.y,z:rider.position.z},true);
  riderBody.setLinvel({x:launchVel.x,y:launchVel.y,z:launchVel.z},true);
  riderBody.setAngvel({x:riderSpin.x*.75,y:riderSpin.y*.35,z:riderSpin.z*.75},true);riderBody.setLinearDamping(.18);riderBody.setAngularDamping(1.35);
}
function syncRiderBody(){if(!ragdoll)return;const p=riderBody.translation(),q=riderBody.rotation();rider.position.set(p.x,p.y,p.z);rider.quaternion.set(q.x,q.y,q.z,q.w)}

const cloudMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.65,depthWrite:false});for(let i=0;i<55;i++){let c=new THREE.Mesh(new THREE.SphereGeometry(10+Math.random()*22,10,7),cloudMat);c.scale.y=.25;c.position.set((Math.random()-.5)*650,20+Math.random()*90,-Math.random()*1900);scene.add(c)}
let s=4,v=26,theta=0,omega=0,input=0,holdTime=0,dead=false,airVel=new THREE.Vector3(),last=performance.now(),checkpoint=4;
const TEST_STAGE2=true;
const camState={back:5.15,height:2.35,side:0,lookAhead:72,aheadMix:.18};
function reset(){s=TEST_STAGE2?total-38:checkpoint;v=TEST_STAGE2?10:26;theta=omega=input=holdTime=0;dead=false;stage=1;score=0;removedScore=0;impactDone=false;flightCamBlend=0;finishTimer=0;riderGrounded=false;ragdoll=false;resultShown=false;stage2Time=0;impactTime=0;combo=0;comboClock=0;physAcc=0;riderSpin.set(0,0,0);rider.rotation.set(0,0,0);riderBody.setTranslation({x:0,y:-500,z:0},true);riderBody.setLinvel({x:0,y:0,z:0},true);riderBody.setAngvel({x:0,y:0,z:0},true);fail.style.display='none';const ft=fail.querySelector('h1'),fp=fail.querySelector('p');if(ft)ft.textContent='실패!';if(fp)fp.textContent='재도전 할까요?';for(const b of allTargetBodies()){if(b.removed){b.removed=false;scene.add(b.m);const nb=physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(b.home.x,b.home.y,b.home.z));physics.createCollider(RAPIER.ColliderDesc.cuboid(b.isSupport?(b.m.geometry.parameters.width/2):.675,b.isSupport?(b.m.geometry.parameters.height/2):.475,b.isSupport?(b.m.geometry.parameters.depth/2):.675).setDensity(b.isSupport?3.2:.22).setFriction(b.isSupport?.72:.42),nb);b.body=nb}b.hit=false;b.scored=false;b.fractured=false;b.groundTime=0;b.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);b.body.setTranslation({x:b.home.x,y:b.home.y,z:b.home.z},true);b.body.setRotation({x:0,y:0,z:0,w:1},true);b.body.setLinvel({x:0,y:0,z:0},true);b.body.setAngvel({x:0,y:0,z:0},true)}}
function launchStage2(p,t,rr){launchCamPos.copy(camera.position);launchCamLook.copy(p).addScaledVector(t,10);stage=2;dead=false;impactDone=false;flightCamBlend=0;finishTimer=0;riderGrounded=false;resultShown=false;stage2Time=0;impactTime=0;
  rider.position.copy(p).addScaledVector(t,2.0).add(new THREE.Vector3(0,1.0,0));
  if(TEST_STAGE2){
    // Calibrated destruction-test shot: nominal no-input trajectory intersects the middle of the block wall.
    const aim=targetOrigin.clone().add(new THREE.Vector3(0,4.6,0)), flightTime=3.25, delta=aim.sub(rider.position);
    launchVel.set(delta.x/flightTime,(delta.y+.5*9.81*flightTime*flightTime)/flightTime,delta.z/flightTime);
    launchVel.addScaledVector(rr,omega*R*.35);riderSpin.set(1.1+Math.abs(omega)*.8,omega*.9,(Math.random()-.5)*.35);
  }else{
    launchVel.copy(t).multiplyScalar(v).addScaledVector(rr,omega*R*2.4);riderSpin.set(.7+Math.abs(omega),omega*1.1,omega*.35);
  }
  prog.textContent='DESTROY · 0';}
$('#retry').onclick=reset;function bind(id,val){let e=$(id);e.addEventListener('contextmenu',x=>x.preventDefault());e.addEventListener('selectstart',x=>x.preventDefault());e.addEventListener('pointerdown',x=>{x.preventDefault();e.setPointerCapture?.(x.pointerId);input=val;holdTime=0});['pointerup','pointercancel','lostpointercapture'].forEach(n=>e.addEventListener(n,x=>{x.preventDefault?.();if(input===val){input=0;holdTime=0}}))}bind('#l',-1);bind('#r',1);
function tangent(f){return new THREE.Vector3(Math.sin(f.yaw),f.g,-Math.cos(f.yaw)).normalize()} function right(f){return new THREE.Vector3(Math.cos(f.yaw),0,Math.sin(f.yaw)).normalize()}
function worldPos(f,th){return f.p.clone().addScaledVector(right(f),R*Math.sin(th)).add(new THREE.Vector3(0,R*(1-Math.cos(th))+.42,0))}
function tick(now){
  const dt=Math.min(.03,(now-last)/1000); last=now;
  if(characterMixer)characterMixer.update(dt);
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
    v+=(-9.81*f.g+4.6-.055*v)*dt; v=TEST_STAGE2?THREE.MathUtils.clamp(v,8,11):THREE.MathUtils.clamp(v,15,70); s+=v*dt;
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
      const prevRiderPos=rider.position.clone();
      const steer=right(targetFrame).multiplyScalar(input*7.5*dt); launchVel.add(steer); launchVel.y-=9.81*dt; rider.position.addScaledVector(launchVel,dt);
      // Airborne body attitude: angular momentum plus steering torque instead of a locked lookAt pose.
      riderSpin.y+=input*1.25*dt;riderSpin.x+=(-launchVel.y*.018-riderSpin.x*.08)*dt;riderSpin.multiplyScalar(Math.pow(.996,dt*60));
      rider.rotateX(riderSpin.x*dt);rider.rotateY(riderSpin.y*dt);rider.rotateZ(riderSpin.z*dt);
      const groundY=targetOrigin.y+.78;
      if(!ragdoll&&rider.position.y<=groundY){
        rider.position.y=groundY;
        if(!riderGrounded){riderGrounded=true;const hitVy=Math.min(0,launchVel.y);launchVel.y=Math.min(3.0,-hitVy*.16);riderSpin.x+=Math.min(2.4,launchVel.length()*.07);riderSpin.z+=(Math.random()-.5)*.9}
        else if(launchVel.y<0)launchVel.y=0;
        const groundDrag=Math.pow(.93,dt*60);launchVel.x*=groundDrag;launchVel.z*=groundDrag;riderSpin.multiplyScalar(Math.pow(.90,dt*60));
        // Hard floor constraint: never allow the visual body centre to tunnel below the platform.
        if(Math.abs(launchVel.y)<.35)launchVel.y=0;
        if(Math.hypot(launchVel.x,launchVel.z)<.35){launchVel.x=0;launchVel.z=0}
        if(launchVel.length()<.45&&riderSpin.length()<.35){launchVel.set(0,0,0);riderSpin.set(0,0,0)}
      }else if(riderGrounded&&launchVel.y>0){riderGrounded=false}
      const toTarget=targetOrigin.clone().sub(rider.position),flightDir=launchVel.lengthSq()>.01?launchVel.clone().normalize():targetOrigin.clone().sub(rider.position).normalize();
      // Continuous launch camera: preserve the slide shot, then smoothly widen to frame rider + target together.
      flightCamBlend=Math.min(1,flightCamBlend+dt/1.15);
      const targetDir=toTarget.clone().normalize(), distToTarget=toTarget.length();
      const chaseDir=targetForward.clone().normalize();
      const back=10.2,height=4.15;
      const desired=rider.position.clone().addScaledVector(chaseDir,-back).add(new THREE.Vector3(0,height,0));
      const ease=flightCamBlend*flightCamBlend*(3-2*flightCamBlend);
      const aim=rider.position.clone().lerp(targetOrigin,THREE.MathUtils.clamp(.32+distToTarget/180,.36,.55));
      camera.position.copy(launchCamPos).lerp(desired,ease);
      const smoothAim=launchCamLook.clone().lerp(aim,ease);
      camera.up.set(0,1,0);camera.lookAt(smoothAim);
      if(!impactDone){for(const b of allTargetBodies()){if(b.removed)continue;
        const seg=rider.position.clone().sub(prevRiderPos),len2=seg.lengthSq(),to=b.m.position.clone().sub(prevRiderPos);
        const u=len2>1e-6?THREE.MathUtils.clamp(to.dot(seg)/len2,0,1):0;
        const closest=prevRiderPos.clone().addScaledVector(seg,u);
        const gp=b.m.geometry.parameters||{},rad=.42+Math.sqrt((gp.width||1.35)**2+(gp.height||.95)**2+(gp.depth||1.35)**2)*.5;
        if(closest.distanceToSquared(b.m.position)<=rad*rad){impactDone=true;
        const hitDir=launchVel.clone().normalize(),hitSpeed=launchVel.length(),baseImpulse=THREE.MathUtils.clamp(hitSpeed*24.0,280,520);
        releaseTarget();startRagdoll();
        // Transfer projectile momentum locally. Secondary destruction now comes from rigid-body contacts and gravity.
        const rel=b.m.position.clone().sub(rider.position);
        const contactPoint=rider.position.clone().addScaledVector(hitDir,.65);
        const localImpulse=hitDir.clone().multiplyScalar(baseImpulse*.72);
        if(typeof b.body.applyImpulseAtPoint==='function'){
          b.body.applyImpulseAtPoint({x:localImpulse.x,y:localImpulse.y,z:localImpulse.z},{x:contactPoint.x,y:contactPoint.y,z:contactPoint.z},true);
        }else{
          b.body.applyImpulse({x:localImpulse.x,y:localImpulse.y,z:localImpulse.z},true);
        }
        score+=100;break}}}
      stage2Time+=dt;
      removeScoredBlocks(dt);
      const totalScore=score+removedScore;
      prog.textContent='DESTROY · '+totalScore;
      if(impactDone){
        impactTime+=dt;
        const local=rider.position.clone().sub(targetOrigin);
        const gx=Math.abs(local.dot(targetR)),gz=Math.abs(local.dot(targetForward));
        if((gx>15.4||gz>12.4)&&rider.position.y<targetOrigin.y-.9&&!resultShown){
          resultShown=true;dead=true;score+=removedScore;removedScore=0;prog.textContent='FALL · SCORE '+score;setTimeout(()=>{if(dead)fail.style.display='grid'},650);
        }
        // Finish from post-impact time, not total Stage-2 flight time. Residual ragdoll jitter must not keep the run alive.
        // Do not wait for tiny residual angular velocity from the physics body.
        const lv=ragdoll?riderBody.linvel():{x:0,y:0,z:0};
        const spd=Math.hypot(lv.x,lv.y,lv.z);
        const onGround=rider.position.y<=targetOrigin.y+1.35;
        if(onGround&&spd<1.8)finishTimer+=dt;else finishTimer=Math.max(0,finishTimer-dt*.35);
        if((finishTimer>.40||impactTime>3.25)&&!resultShown){
          // One last cleanup/scoring pass before freezing the result.
          removeScoredBlocks(.5);
          resultShown=true;dead=true;score+=removedScore;removedScore=0;
          prog.textContent='SCORE · '+score;
          const title=fail.querySelector('h1'),msg=fail.querySelector('p');
          if(title)title.textContent='결과';if(msg)msg.textContent='SCORE · '+score;
          fail.style.display='grid';
        }
      }else if(rider.position.y<targetOrigin.y-3||toTarget.length()>170||stage2Time>7.0){
        // Complete miss or falling out of the play area is the only Stage-2 game over.
        dead=true;setTimeout(()=>{if(dead&&!impactDone)fail.style.display='grid'},700);
      }

  } else {
    rider.position.addScaledVector(airVel,dt); airVel.y-=9.81*dt;
    // Airborne shot: detach from slide framing and orbit slightly above/behind the falling rider.
    const fallDir=airVel.clone(); if(fallDir.lengthSq()<.01) fallDir.set(0,-1,0); fallDir.normalize();
    const fallCam=rider.position.clone().addScaledVector(fallDir,-5.8).add(new THREE.Vector3(0,2.3,0));
    camera.position.lerp(fallCam,1-Math.exp(-5.5*dt)); camera.up.set(0,1,0); camera.lookAt(rider.position);
  }
  updateCharacterPose();
  updateSpray(dt); syncPhysics(dt); syncRiderBody(); updateEffects(dt);
  renderer.render(scene,camera); requestAnimationFrame(tick);
}
reset(); requestAnimationFrame(tick);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
