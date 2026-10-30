import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './IndustrialSceneHero.css';
import { buildFactoryScenario, FACTORY_SCENARIOS, type FactoryAsset, type FactoryScenario } from './factoryScenarios';
import { populateFactoryScenario } from './factorySceneModels';

type SceneStatus = 'loading' | 'ready' | 'fallback';

function scenePreview() {
  const query = new URLSearchParams(window.location.search);
  const scenario = FACTORY_SCENARIOS.find(item => item.id === query.get('factoryScene'))?.id ?? 'delivery';
  const value = query.get('factoryTime');
  const time = value !== null && Number.isFinite(Number(value)) ? THREE.MathUtils.clamp(Number(value), 0, 180) : null;
  return { scenario, time };
}

function disposeScene(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points)) return;
    if (object.geometry) geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  textures.forEach((item) => item.dispose());
  materials.forEach((item) => item.dispose());
  geometries.forEach((item) => item.dispose());
}

export function IndustrialSceneHero() {
  const initialPreview = useRef(scenePreview());
  const [scenario, setScenario] = useState<FactoryScenario>(initialPreview.current.scenario);
  const hostRef = useRef<HTMLDivElement>(null);
  const playRef = useRef(initialPreview.current.time === null && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const resetRef = useRef<() => void>(() => undefined);
  const [status, setStatus] = useState<SceneStatus>('loading');
  const [playing, setPlaying] = useState(playRef.current);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { playRef.current = !media.matches; setPlaying(!media.matches); };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let visible = true;
    let frame = 0;
    const startTime = scenario === initialPreview.current.scenario ? initialPreview.current.time ?? 0 : 0;
    let elapsed = 0;
    let ready = false;
    setStatus('loading');
    let lastFrame = 0;
    let renderer: THREE.WebGLRenderer | undefined;
    let scene: THREE.Scene | undefined;
    let environment: THREE.Texture | undefined;
    let stage: THREE.Group | undefined;
    let draco: DRACOLoader | undefined;
    let controls: OrbitControls | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    const onVisibility = () => { lastFrame = 0; };
    document.addEventListener('visibilitychange', onVisibility);

    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2', { antialias: true, alpha: true }) || canvas.getContext('webgl', { antialias: true, alpha: true });
      if (!context) throw new Error('WebGL 不可用');
      renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 760 ? 1.1 : 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.94;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      canvas.setAttribute('aria-hidden', 'true');
      host.appendChild(canvas);
      scene = new THREE.Scene();
      const room = new RoomEnvironment();
      const pmrem = new THREE.PMREMGenerator(renderer);
      environment = pmrem.fromScene(room, 0.04).texture;
      scene.environment = environment;
      scene.environmentIntensity = 0.38;
      room.dispose(); pmrem.dispose();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 250);
      camera.setFocalLength(60);
      camera.position.set(44, 27, 26);
      camera.lookAt(0, 1, 0);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x404247, 2.1));
      const key = new THREE.DirectionalLight(0xffffff, 3.4);
      key.position.set(-7, 18, 8);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      Object.assign(key.shadow.camera, { left: -22, right: 22, top: 20, bottom: -20, near: 0.5, far: 65 });
      key.shadow.normalBias = 0.025;
      key.shadow.radius = 3;
      scene.add(key);
      const rearLight = new THREE.DirectionalLight(0xffffff, 1.3);
      rearLight.position.set(8, 12, -6);
      scene.add(rearLight);
      stage = new THREE.Group();
      scene.add(stage);
      stage.visible = false;
      const layout = buildFactoryScenario(stage, scenario);
      let updateScene = (_seconds: number) => undefined;
      const render = () => renderer?.render(scene!, camera);
      controls = new OrbitControls(camera, canvas);
      controls.target.set(0, 1, 0);
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.minAzimuthAngle = Math.PI / 8;
      controls.maxAzimuthAngle = Math.PI * 0.45;
      controls.minPolarAngle = Math.PI / 4;
      controls.maxPolarAngle = Math.PI / 2.5;
      controls.update();
      controls.saveState();
      const resize = () => {
        if (!renderer || !host.clientWidth || !host.clientHeight) return;
        const width = host.clientWidth, height = host.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.setFocalLength(60);
        // Fit all eight building corners while preserving the requested physical lens.
        const target = controls!.target;
        const direction = camera.position.clone().sub(target).normalize();
        camera.updateMatrixWorld(true);
        const inverseRotation = camera.quaternion.clone().invert();
        const tanVertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const tanHorizontal = tanVertical * camera.aspect;
        let distance = 1;
        for (const x of [-12.2, 12.2]) for (const y of [-0.5, 4.1]) for (const z of [-9.2, 9.2]) {
          const point = new THREE.Vector3(x, y, z).sub(target).applyQuaternion(inverseRotation);
          distance = Math.max(distance, point.z + Math.abs(point.x) * 1.12 / tanHorizontal, point.z + Math.abs(point.y) * 1.12 / tanVertical);
        }
        camera.position.copy(target).addScaledVector(direction, distance);
        camera.updateProjectionMatrix();
        render();
      };
      controls.addEventListener('change', resize);
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();
      const setPose = () => {
        updateScene(elapsed);
        render();
      };
      resetRef.current = () => { elapsed = 0; lastFrame = 0; controls?.reset(); resize(); setPose(); };
      const animate = (now: number) => {
        if (disposed) return;
        const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 1) : 0;
        lastFrame = now;
        if (ready && visible && !document.hidden && playRef.current) { elapsed += delta; setPose(); }
        frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
      intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; lastFrame = 0; }, { threshold: 0.05 });
      intersectionObserver.observe(host);

      draco = new DRACOLoader();
      draco.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
      draco.preload();
      const loader = new GLTFLoader();
      loader.setDRACOLoader(draco);
      const assets = new Set<FactoryAsset>(layout.placements.map(placement => placement.asset));
      if (layout.agvRoutes.length) assets.add('agv');
      layout.robotTasks.forEach(task => assets.add(task.asset));
      const loadedModels: THREE.Group[] = [];
      Promise.all([...assets].map(async name => {
        const { scene: model } = await loader.loadAsync(`${import.meta.env.BASE_URL}models/${name}.glb`);
        if (disposed) { disposeScene(model); return undefined; }
        loadedModels.push(model);
        return [name, model] as const;
      })).then(entries => {
        if (disposed) return;
        updateScene = populateFactoryScenario(stage!, layout, new Map(entries.filter(entry => !!entry))).update;
        elapsed = startTime; lastFrame = 0; ready = true; stage!.visible = true; setPose(); setStatus('ready');
      }).catch(error => {
        console.error('无法加载工厂设备模型', error);
        if (!disposed) setStatus('fallback');
      });
      const onContextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); visible = false; setStatus('fallback'); };
      canvas.addEventListener('webglcontextlost', onContextLost);
      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        controls?.dispose();
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        canvas.removeEventListener('webglcontextlost', onContextLost);
        resetRef.current = () => undefined;
        if (stage) disposeScene(stage);
        loadedModels.filter(model => !model.parent).forEach(disposeScene);
        environment?.dispose();
        draco?.dispose();
        renderer?.dispose();
        renderer?.forceContextLoss();
        canvas.remove();
      };
    } catch (error) {
      console.error('无法初始化仓储数字孪生', error);
      setStatus('fallback');
      controls?.dispose();
      if (stage) disposeScene(stage);
      environment?.dispose();
      draco?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
      document.removeEventListener('visibilitychange', onVisibility);
    }
  }, [scenario]);

  return (
    <div className={`industrial-scene industrial-scene--${status}`} aria-busy={status === 'loading'} aria-label={`${FACTORY_SCENARIOS.find(item => item.id === scenario)!.title}三维场景`}>
      <div id="factory-scene-panel" role="tabpanel" aria-labelledby={`scene-tab-${scenario}`} className="industrial-scene__canvas" ref={hostRef} />
      {status !== 'ready' && (
        <div className="industrial-scene__fallback" role="status">
          <span>{status === 'loading' ? '正在加载场景…' : '场景加载失败，请刷新重试'}</span>
        </div>
      )}
      <div className="industrial-scene__tabs" role="tablist" aria-label="工业应用场景">
        {FACTORY_SCENARIOS.map((item, index) => <button
          key={item.id} id={`scene-tab-${item.id}`} type="button" role="tab"
          aria-selected={scenario === item.id} aria-controls="factory-scene-panel" tabIndex={scenario === item.id ? 0 : -1}
          onClick={() => setScenario(item.id)}
          onKeyDown={event => {
            const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
            if (!offset && event.key !== 'Home' && event.key !== 'End') return;
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? FACTORY_SCENARIOS.length - 1 : (index + offset + FACTORY_SCENARIOS.length) % FACTORY_SCENARIOS.length;
            setScenario(FACTORY_SCENARIOS[next].id);
            document.getElementById(`scene-tab-${FACTORY_SCENARIOS[next].id}`)?.focus();
          }}
        >{item.title}</button>)}
      </div>
      <div className="industrial-scene__controls" aria-label="场景播放控制">
        <button type="button" onClick={() => { playRef.current = !playRef.current; setPlaying(playRef.current); }} aria-label={playing ? '暂停场景动画' : '播放场景动画'} aria-pressed={!playing} disabled={status !== 'ready'}>{playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}{playing ? '暂停' : '播放'}</button>
        <button type="button" onClick={() => resetRef.current()} aria-label="重置场景动画" disabled={status !== 'ready'}><RotateCcw size={15} /></button>
      </div>
    </div>
  );
}
