import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './IndustrialSceneHero.css';
import { buildWarehouse, finishModel, rigMCR, MCR_HOME, CNC_STATIONS, MCR_STATIONS, RACK_STATIONS, ROBOT_BASE_LENGTH } from './warehouseScene';

const AGV_SPEED = 0.6;
type SceneStatus = 'loading' | 'ready' | 'fallback';

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
  const hostRef = useRef<HTMLDivElement>(null);
  const playRef = useRef(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
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
      const { routes, parcels } = buildWarehouse(stage);
      const mcrActors: { station: THREE.Group; pose: (degrees: number[]) => void; origin: THREE.Vector3; destination: THREE.Vector3 }[] = [];
      const carriers = [new THREE.Group(), new THREE.Group(), new THREE.Group()];
      carriers.forEach((carrier) => stage?.add(carrier));
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
        routes.forEach((route, index) => {
          const progress = (elapsed * AGV_SPEED / route.getLength() + index / carriers.length) % 1;
          const point = route.getPointAt(progress);
          const tangent = route.getTangentAt(progress);
          carriers[index].position.copy(point);
          carriers[index].position.y = 0;
          // The model's front sensor is on local -X; align that axis with travel.
          carriers[index].rotation.y = Math.atan2(tangent.x, tangent.z) + Math.PI / 2;
        });
        // Stop the base before arm work, return to Home before driving again.
        const cycle = elapsed % 24;
        const smooth = (t: number) => { const u = THREE.MathUtils.clamp(t, 0, 1); return u * u * (3 - 2 * u); };
        const travel = cycle < 2 ? 0 : cycle < 7 ? smooth((cycle - 2) / 5) : cycle < 15 ? 1 : cycle < 20 ? 1 - smooth((cycle - 15) / 5) : 0;
        const reach = cycle < 8 ? 0 : cycle < 10 ? smooth((cycle - 8) / 2) : cycle < 12 ? 1 : cycle < 14 ? 1 - smooth((cycle - 12) / 2) : 0;
        const outboundTurn = cycle < 1 ? 0 : cycle < 2 ? smooth(cycle - 1) : cycle < 7 ? 1 : cycle < 8 ? 1 - smooth(cycle - 7) : 0;
        mcrActors.forEach(({ station, pose, origin, destination }) => {
          station.position.lerpVectors(origin, destination, travel);
          if (origin.distanceToSquared(destination) > 0) station.rotation.y = Math.PI * outboundTurn;
          pose(MCR_HOME.map((angle, i) => angle + [35, -28, -40, 30, 18, -35][i] * reach));
        });
        parcels.forEach((parcel, i) => { parcel.position.x = -9.8 + ((elapsed * 0.22 + i * 2.1) % 6.4); });
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
      Promise.all(['agv', 'cnc', 'mcr', 'factory-rack', 'factory-server'].map(async (name) => {
        const { scene: model } = await loader.loadAsync(`${import.meta.env.BASE_URL}models/${name}.glb`);
        if (disposed) { disposeScene(model); return; }
        if (name === 'agv') {
          finishModel(model, ROBOT_BASE_LENGTH, model);
          carriers.forEach((carrier, i) => carrier.add(i === 0 ? model : model.clone(true)));
        } else if (name === 'cnc') {
          finishModel(model, 2.85);
          CNC_STATIONS.forEach(([x, z, yaw], i) => {
            const bay = new THREE.Group(); bay.position.set(x, 0, z); bay.rotation.y = yaw;
            bay.add(i === 0 ? model : model.clone(true)); stage!.add(bay);
          });
        } else if (name === 'factory-rack') {
          finishModel(model, 2.65);
          RACK_STATIONS.forEach(([x, z, yaw], i) => {
            const station = new THREE.Group(); station.name = 'Blender V7 material rack'; station.position.set(x, 0, z); station.rotation.y = yaw;
            station.add(i === 0 ? model : model.clone(true)); stage!.add(station);
          });
        } else if (name === 'factory-server') {
          finishModel(model, 2.35);
          let index = 0;
          for (const x of [-9.1, -5.3, -1.5]) for (const dx of [-0.9, 0.9]) for (const dz of [-1.15, 0, 1.15]) {
            const cabinet = new THREE.Group(); cabinet.position.set(x + dx, 0.18, -6.45 + dz);
            cabinet.rotation.y = dx < 0 ? Math.PI / 2 : -Math.PI / 2;
            cabinet.add(index++ === 0 ? model : model.clone(true)); stage!.add(cabinet);
          }
        } else {
          // Source export contains one detached PCB roughly 85 m outside the robot.
          // Exclude that export artifact so it cannot distort the robot bounds.
          let detachedBoard: THREE.Object3D | undefined;
          model.traverse((node) => { if (node.name.startsWith('Radar') && node.name.includes('BoardAndModels')) detachedBoard = node; });
          if (detachedBoard) { detachedBoard.removeFromParent(); disposeScene(detachedBoard); }
          rigMCR(model);
          // Match the same chassis footprint as AGV; arm reach must not shrink the base.
          let chassis: THREE.Object3D | undefined;
          model.traverse(node => { if (node.name.replace(/[._]/g, '') === 'Mesh18001') chassis = node; });
          if (!chassis) throw new Error('MCR 底盘参考网格缺失');
          finishModel(model, ROBOT_BASE_LENGTH, chassis);
          MCR_STATIONS.forEach(([x, z], i) => {
            const robot = i === 0 ? model : model.clone(true);
            const station = new THREE.Group(); station.position.set(x, 0, z);
            station.add(robot); stage!.add(station);
            const origin = station.position.clone();
            // Front and left service corridors have room for base travel; the CNC aisle robot stays docked.
            const destination = origin.clone().add(new THREE.Vector3([4, 0, 2.6][i], 0, 0));
            mcrActors.push({ station, pose: rigMCR(robot), origin, destination });
          });
        }
        setPose();
      })).then(() => { if (!disposed) { elapsed = 0; lastFrame = 0; ready = true; stage!.visible = true; setPose(); setStatus('ready'); } }).catch((error) => {
        console.error('无法加载仓储设备模型', error);
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
  }, []);

  return (
    <div className={`industrial-scene industrial-scene--${status}`} aria-busy={status === 'loading'} aria-label="CNC、AGV 与 MCR 协同仓储场景">
      <div className="industrial-scene__canvas" ref={hostRef} aria-hidden="true" />
      {status !== 'ready' && (
        <div className="industrial-scene__fallback" role="status">
          <span>{status === 'loading' ? '正在加载场景…' : '场景加载失败，请刷新重试'}</span>
        </div>
      )}
      <div className="industrial-scene__caption"><strong>柔性制造车间</strong></div>
      <div className="industrial-scene__controls" aria-label="场景播放控制">
        <button type="button" onClick={() => { playRef.current = !playRef.current; setPlaying(playRef.current); }} aria-label={playing ? '暂停场景动画' : '播放场景动画'} aria-pressed={!playing} disabled={status !== 'ready'}>{playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}{playing ? '暂停' : '播放'}</button>
        <button type="button" onClick={() => resetRef.current()} aria-label="重置场景动画" disabled={status !== 'ready'}><RotateCcw size={15} /></button>
      </div>
    </div>
  );
}
