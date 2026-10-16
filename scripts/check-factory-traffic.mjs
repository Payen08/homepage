import WebSocket from 'ws';
const pages = await (await fetch('http://[::1]:9333/json')).json();
const ws = new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(r => ws.on('open', r));
let sequence = 0;
const pending = new Map();
ws.on('message', raw => { const m = JSON.parse(raw); if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); } });
const send = (method, params = {}) => new Promise((resolve,reject) => { const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params})); });
const evaluate = async expression => { const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value; };
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'http://localhost:3001/#top'});
for(let i=0;i<100;i++){if(await evaluate(`!!document.querySelector('.industrial-scene--ready')`))break;await new Promise(r=>setTimeout(r,500));}
if(!await evaluate(`!!document.querySelector('.industrial-scene--ready')`))throw new Error('Scene did not finish loading');
console.log('Ready: true');
console.log('Placeholder geometry:',await evaluate(`document.querySelectorAll('[class*="fallback-grid"],[class*="fallback-machine"],[class*="fallback-path"]').length`));
const result = await evaluate(`(async()=>{
const THREE=await import('/node_modules/.vite/deps/three.js');
const {GLTFLoader}=await import('/node_modules/.vite/deps/three_addons_loaders_GLTFLoader__js.js');
const {DRACOLoader}=await import('/node_modules/.vite/deps/three_addons_loaders_DRACOLoader__js.js');
const W=await import('/src/components/warehouseScene.ts');
const stage=new THREE.Group();const {routes}=W.buildWarehouse(stage);
const obstacles=stage.children.filter(o=>o.isMesh&&o.geometry.type==='BoxGeometry').map(o=>new THREE.Box3().setFromObject(o)).filter(b=>b.max.y>.1);
const loader=new GLTFLoader();loader.setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
const [agv,cnc,mcr,rack]=await Promise.all(['agv','cnc','mcr','factory-rack'].map(async n=>(await loader.loadAsync('/models/'+n+'.glb')).scene));
W.finishModel(agv,W.ROBOT_BASE_LENGTH,agv);W.finishModel(cnc,2.85);W.finishModel(rack,2.65);
for(const [model,stations] of [[cnc,W.CNC_STATIONS],[rack,W.RACK_STATIONS]])for(const [x,z,yaw] of stations){const g=new THREE.Group();g.add(model.clone(true));g.position.set(x,0,z);g.rotation.y=yaw;obstacles.push(new THREE.Box3().setFromObject(g));}
let pcb; mcr.traverse(n=>{if(n.name.startsWith('Radar')&&n.name.includes('BoardAndModels'))pcb=n;});pcb?.removeFromParent();W.rigMCR(mcr);let chassis;mcr.traverse(n=>{if(n.name.replace(/[._]/g,'')==='Mesh18001')chassis=n;});W.finishModel(mcr,W.ROBOT_BASE_LENGTH,chassis);
const bots=[0,1,2].map(()=>{const g=new THREE.Group();g.add(agv.clone(true));return g;});
const arms=W.MCR_STATIONS.map(([x,z],i)=>{const g=new THREE.Group();const model=mcr.clone(true);g.add(model);return {g,pose:W.rigMCR(model),origin:new THREE.Vector3(x,0,z),dest:new THREE.Vector3(x+[4,0,2.6][i],0,z)};});
const smooth=t=>{const u=THREE.MathUtils.clamp(t,0,1);return u*u*(3-2*u);};
let collisions=[];let minGap=Infinity;
for(let tick=0;tick<=1200;tick++){
 const time=tick/10,cycle=time%24;
 const travel=cycle<2?0:cycle<7?smooth((cycle-2)/5):cycle<15?1:cycle<20?1-smooth((cycle-15)/5):0;
 const reach=cycle<8?0:cycle<10?smooth((cycle-8)/2):cycle<12?1:cycle<14?1-smooth((cycle-12)/2):0;
 const turn=cycle<1?0:cycle<2?smooth(cycle-1):cycle<7?1:cycle<8?1-smooth(cycle-7):0;
 bots.forEach((g,i)=>{const p=(time*.6/routes[i].getLength()+i/3)%1;g.position.copy(routes[i].getPointAt(p));g.position.y=0;const t=routes[i].getTangentAt(p);g.rotation.y=Math.atan2(t.x,t.z)+Math.PI/2;});
 arms.forEach(({g,pose,origin,dest})=>{g.position.lerpVectors(origin,dest,travel);if(origin.distanceToSquared(dest)>0)g.rotation.y=Math.PI*turn;pose(W.MCR_HOME.map((a,i)=>a+[35,-28,-40,30,18,-35][i]*reach));});
 const bounds=[...bots,...arms.map(a=>a.g)].map(g=>new THREE.Box3().setFromObject(g));
 for(let i=0;i<bounds.length;i++){
  const b=bounds[i];for(let j=0;j<obstacles.length;j++)if(b.intersectsBox(obstacles[j])&&collisions.length<20)collisions.push({time,robot:i,obstacle:j,robotBounds:[b.min.toArray(),b.max.toArray()],obstacleBounds:[obstacles[j].min.toArray(),obstacles[j].max.toArray()]});
  for(let j=i+1;j<bounds.length;j++){if(b.intersectsBox(bounds[j])&&collisions.length<20)collisions.push({time,robot:i,other:j});const dx=Math.max(0,b.min.x-bounds[j].max.x,bounds[j].min.x-b.max.x);const dz=Math.max(0,b.min.z-bounds[j].max.z,bounds[j].min.z-b.max.z);minGap=Math.min(minGap,Math.hypot(dx,dz));}
 }
}
return {samples:1201,seconds:120,obstacles:obstacles.length,collisions,minGap,agvRouteLength:routes[0].getLength()};
})()`);
console.log(JSON.stringify(result,null,2));
ws.close();
if(result.collisions.length)process.exitCode=1;
