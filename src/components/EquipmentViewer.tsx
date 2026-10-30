import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Expand, Minus, Pause, Play, Plus, RotateCcw, Box, Image, ScanLine } from 'lucide-react';

type ViewerApi = { reset: () => void; view: (name: string) => void; zoom: (factor: number) => void; focus: (part: string) => void };
export function EquipmentViewer({ model, image, name }: { model: string | null; image: string; name: string }) {
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const api = useRef<ViewerApi | null>(null);
  const auto = useRef(false);
  const wire = useRef(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [mode, setMode] = useState<'model' | 'image'>(model ? 'model' : 'image');
  const source = model;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [part, setPart] = useState('');
  const [view, setView] = useState('iso');
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => { const change = () => setFullscreen(document.fullscreenElement === frame.current); document.addEventListener('fullscreenchange', change); return () => document.removeEventListener('fullscreenchange', change); }, []);
  useEffect(() => {
    if (!host.current || !source || mode !== 'model') return;
    let stopped = false; let request = 0; let root: THREE.Object3D | null = null;
    const el = host.current;
    setStatus('loading'); setError(''); setPart('');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, .01, 100);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { setStatus('error'); setError('当前浏览器无法创建 3D 视图，请查看产品图片。'); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000,0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .9; el.appendChild(renderer.domElement);
    const pmrem = new THREE.PMREMGenerator(renderer); const room = new RoomEnvironment(); const env = pmrem.fromScene(room); scene.environment = env.texture; room.dispose(); pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 1.2));
    const light = new THREE.DirectionalLight(0xffffff, 2.4); light.position.set(3, 5, 4); scene.add(light);
    const groundGeometry = new THREE.CylinderGeometry(1.48,1.48,.035,96);
    const groundMaterial = new THREE.MeshStandardMaterial({ color:0x292929,roughness:.8,metalness:.15 });
    const ground = new THREE.Mesh(groundGeometry,groundMaterial); ground.position.y=-.035; scene.add(ground);
    const ringGeometry = new THREE.RingGeometry(1.48,1.495,96);
    const ringMaterial = new THREE.MeshBasicMaterial({ color:0x6366f1,transparent:true,opacity:.6,side:THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeometry,ringMaterial); ring.rotation.x=-Math.PI/2; ring.position.y=-.012; scene.add(ring);
    const grid = new THREE.GridHelper(8,40,0x555555,0x353535); grid.position.y=-.015;
    grid.material.transparent=true; grid.material.opacity=.42; scene.add(grid);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.minDistance = 1; controls.maxDistance = 9; controls.autoRotateSpeed = 1.1; controls.maxPolarAngle = Math.PI * .91;
    let modelHeight = 1.8;
    const target = new THREE.Vector3(0, .9, 0);
    const reset = () => { target.set(0,modelHeight*.5,0); controls.target.copy(target); camera.position.set(2.8,modelHeight*.5+1.8,3.2); controls.update(); setPart(''); setView('iso'); };
    reset();
    api.current = { reset, zoom: factor => { camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target); controls.update(); }, view: name => { controls.target.set(0,modelHeight*.5,0); camera.position.copy(name === 'front' ? new THREE.Vector3(0,modelHeight*.5,4) : name === 'side' ? new THREE.Vector3(4,modelHeight*.5,0) : new THREE.Vector3(.01,5,.01)); controls.update(); setPart(''); setView(name); }, focus: part => { const y = part === 'platform' ? modelHeight*.55 : part === 'sensor' ? modelHeight*.85 : modelHeight*.12; controls.target.set(0,y,0); camera.position.set(2.3,y+1.2,2.7); controls.update(); setPart(part); setView(''); } };
    const draco = new DRACOLoader(); draco.setDecoderPath(`${import.meta.env.BASE_URL}draco/`); const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
    const disposeModel = (object: THREE.Object3D) => object.traverse(node => { if (!(node instanceof THREE.Mesh)) return; node.geometry.dispose(); for (const material of Array.isArray(node.material) ? node.material : [node.material]) { for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose(); material.dispose(); } });
    loader.loadAsync(source).then(gltf => {
      if (stopped) { disposeModel(gltf.scene); return; }
      root = gltf.scene;
      root.traverse(node => { if (node instanceof THREE.Mesh) for (const material of Array.isArray(node.material) ? node.material : [node.material]) if ('emissiveIntensity' in material) (material as THREE.MeshStandardMaterial).emissiveIntensity = Math.min((material as THREE.MeshStandardMaterial).emissiveIntensity, .35); });
      // A detached CAD part in the MCR asset lies far beyond the robot assembly.
      // Fit only the main mesh cluster; do not mutate the source GLB file.
      root.updateMatrixWorld(true);
      const meshes: { node: THREE.Mesh; center: THREE.Vector3; span: number }[] = [];
      root.traverse(node => { if (node instanceof THREE.Mesh) { const box = new THREE.Box3().setFromObject(node); if (!box.isEmpty()) meshes.push({ node, center: box.getCenter(new THREE.Vector3()), span: box.getSize(new THREE.Vector3()).length() }); } });
      if (meshes.length) {
        const median = (values: number[]) => values.sort((a,b) => a-b)[Math.floor(values.length/2)];
        const center = new THREE.Vector3(median(meshes.map(m=>m.center.x)),median(meshes.map(m=>m.center.y)),median(meshes.map(m=>m.center.z)));
        const clusterRadius = Math.max(...meshes.map(m=>m.span)) * 4;
        const detached = meshes.filter(m=>m.center.distanceTo(center)>clusterRadius);
        detached.forEach(({node}) => { node.removeFromParent(); disposeModel(node); });
      }
      const bounds = new THREE.Box3().setFromObject(root); const size = bounds.getSize(new THREE.Vector3()); const largest = Math.max(size.x,size.y,size.z);
      if (!Number.isFinite(largest) || largest <= 0) throw new Error('模型没有可显示的几何体');
      root.scale.multiplyScalar(2 / largest); const scaled = new THREE.Box3().setFromObject(root); const center = scaled.getCenter(new THREE.Vector3()); root.position.sub(new THREE.Vector3(center.x,scaled.min.y,center.z)); modelHeight=scaled.max.y-scaled.min.y; reset(); scene.add(root); setStatus('ready');
    }).catch(() => { if (!stopped) { setStatus('error'); setError('模型加载失败，请切换产品图片后重试。'); } });
    const resize = () => { const w=el.clientWidth,h=el.clientHeight; if (!w || !h) return; renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    const animate = () => { if (stopped) return; request=requestAnimationFrame(animate); controls.autoRotate=auto.current; controls.update(); root?.traverse(node => { if (node instanceof THREE.Mesh) for (const m of Array.isArray(node.material) ? node.material : [node.material]) if ('wireframe' in m) (m as THREE.MeshStandardMaterial).wireframe=wire.current; }); renderer.render(scene,camera); }; animate();
    return () => { stopped=true; cancelAnimationFrame(request); observer.disconnect(); controls.dispose(); draco.dispose(); if(root) disposeModel(root); groundGeometry.dispose(); groundMaterial.dispose(); ringGeometry.dispose(); ringMaterial.dispose(); grid.geometry.dispose(); grid.material.dispose(); env.dispose(); renderer.dispose(); renderer.domElement.remove(); api.current=null; };
  }, [source, mode]);
  return <div className="equipment-viewer" ref={frame}>
    <div className="ev-stage">
      {mode==='model' ? <><div className="ev-canvas" ref={host}/>{status==='loading' && <div className="ev-message" role="status">正在加载模型…</div>}{status==='error' && <div className="ev-message">{error}<button onClick={()=>setMode('image')}>查看产品图片</button></div>}</> : <img src={image} alt={name}/>}
      <div className="ev-top"><div className="ev-modes"><button className={mode==='model'?'active':''} disabled={!source} onClick={()=>setMode('model')}><Box size={14}/>3D 模型</button><button className={mode==='image'?'active':''} onClick={()=>setMode('image')}><Image size={14}/>产品图片</button></div></div>
      <button className="ev-fullscreen" title="全屏预览" aria-label="全屏预览" onClick={async()=>{try{if(document.fullscreenElement) await document.exitFullscreen();else await frame.current?.requestFullscreen();}catch{setError('当前浏览器不支持全屏查看。');}}}><Expand size={17}/>{fullscreen?'退出全屏':''}</button>
      {mode==='model' && <>
        <div className="ev-views">{[['iso','ISO 等轴'],['front','正视'],['top','俯视'],['side','侧视']].map(([id,label])=><button key={id} className={view===id?'active':''} aria-pressed={view===id} disabled={status!=='ready'} onClick={()=>id==='iso'?api.current?.reset():api.current?.view(id)}>{label}</button>)}</div>
        <div className="ev-controls"><button title="放大" aria-label="放大" disabled={status!=='ready'} onClick={()=>api.current?.zoom(.8)}><Plus size={17}/></button><button title="缩小" aria-label="缩小" disabled={status!=='ready'} onClick={()=>api.current?.zoom(1.25)}><Minus size={17}/></button><button title="重置视角" aria-label="重置视角" disabled={status!=='ready'} onClick={()=>api.current?.reset()}><RotateCcw size={16}/></button><button title="自动旋转" aria-label="自动旋转" aria-pressed={autoRotate} disabled={status!=='ready'} onClick={()=>{ auto.current=!autoRotate;setAutoRotate(!autoRotate); }}>{autoRotate?<Pause size={16}/>:<Play size={16}/>}</button><button title="线框显示" aria-label="线框显示" aria-pressed={wireframe} disabled={status!=='ready'} onClick={()=>{ wire.current=!wireframe;setWireframe(!wireframe); }}><ScanLine size={17}/></button></div>
        <div className="ev-parts"><strong>结构定位</strong>{[['platform','承载平台'],['sensor','环境感知'],['base','驱动底盘']].map(([id,label])=><button key={id} className={part===id?'active':''} disabled={status!=='ready'} onClick={()=>api.current?.focus(id)}>{label}</button>)}</div>
        {status==='ready' && <span className="ev-hint">拖动旋转 · 右键平移 · 滚轮缩放</span>}
      </>}
      {error && status!=='error' && <div className="ev-error" role="alert">{error}</div>}
    </div>
  </div>;
}
