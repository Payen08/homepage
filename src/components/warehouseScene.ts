import * as THREE from 'three';
import robotConfig from './mcr-urdf.json';

export const MCR_HOME = [-25.073, -4.399, 124.635, -31.02, -88.08, 291.178];
const material = (color: number, metalness = 0.25) => new THREE.MeshStandardMaterial({ color, metalness, roughness: 0.65 });
export function box(group: THREE.Object3D, mat: THREE.Material, size: number[], at: number[]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
  mesh.position.set(at[0], at[1], at[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function label(stage: THREE.Group, text: string, x: number, z: number, width = 2) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 96;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#85898a'; context.font = '500 36px sans-serif';
  context.textAlign = 'center'; context.fillText(text, 256, 63);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 96 / 512), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, 0.018, z); stage.add(mesh);
}

function route(stage: THREE.Group, coordinates: number[][]) {
  const vertices = coordinates.map(([x, z]) => new THREE.Vector3(x, 0.025, z));
  const path = new THREE.CurvePath<THREE.Vector3>();
  const radius = 0.9;
  const before = vertices.map((p, i) => p.clone().lerp(vertices[(i + vertices.length - 1) % vertices.length], Math.min(radius / p.distanceTo(vertices[(i + vertices.length - 1) % vertices.length]), 0.3)));
  const after = vertices.map((p, i) => p.clone().lerp(vertices[(i + 1) % vertices.length], Math.min(radius / p.distanceTo(vertices[(i + 1) % vertices.length]), 0.3)));
  vertices.forEach((p, i) => {
    path.add(new THREE.QuadraticBezierCurve3(before[i], p, after[i]));
    path.add(new THREE.LineCurve3(after[i], before[(i + 1) % vertices.length]));
  });
  stage.add(new THREE.Mesh(new THREE.TubeGeometry(path, 240, 0.018, 5, true), new THREE.MeshBasicMaterial({ color: 0x999c94, transparent: true, opacity: 0.22 })));
  for (let i = 0; i < 16; i++) {
    const point = path.getPointAt(i / 16);
    const marker = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.05, 12), new THREE.MeshBasicMaterial({ color: 0x80877d }));
    marker.rotation.x = -Math.PI / 2; marker.position.copy(point); stage.add(marker);
  }
  return path;
}

// Source CNC operator doors face local +X. Both rows face the centre aisle.
export const CNC_STATIONS = [4.1, 8.3].flatMap(x => [-5.6, -2.4, 0.8, 4].map(z => [x, z, x < 6 ? 0 : Math.PI]));
export const RACK_STATIONS = [-3.1, -0.9, 1.3, 3.5].map(z => [-11.2, z, Math.PI / 2]);
export const ROBOT_BASE_LENGTH = 1.5;
export const MCR_STATIONS = [[3, 6.4], [6.3, -0.8], [-9.3, 2.1]];

export function buildWarehouse(stage: THREE.Group) {
  const concrete = material(0x454649, 0.18), wall = material(0x303235, 0.08);
  const steel = material(0x777d7d, 0.65), white = material(0xd7dada, 0.3);
  const dark = material(0x202526, 0.5), green = material(0x306747, 0.2);
  const tote = material(0xb9bcb9, 0.12);
  // Open-front industrial building: full-height rear walls, polished dark slab.
  // Fine concrete variation avoids a flat toy-like slab without external textures.
  const surface = document.createElement('canvas'); surface.width = surface.height = 256;
  const paint = surface.getContext('2d')!;
  const pixels = paint.createImageData(256, 256);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const shade = 122 + ((Math.sin(i * 0.73) * 43758.5453) % 1) * 9;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = shade; pixels.data[i + 3] = 255;
  }
  paint.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(surface);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(8, 6);
  concrete.roughnessMap = texture; concrete.roughness = 0.62;
  box(stage, concrete, [24, 0.3, 18], [0, -0.17, 0]);
  box(stage, wall, [24.2, 0.18, 18.2], [0, -0.4, 0]);
  box(stage, wall, [24, 3.9, 0.22], [0, 1.91, -9]);
  box(stage, wall, [0.22, 3.9, 18], [-12, 1.91, 0]);
  box(stage, steel, [24, 0.12, 0.28], [0, 3.91, -9]);
  box(stage, steel, [0.28, 0.12, 18], [-12, 3.91, 0]);
  const grid = new THREE.GridHelper(24, 24, 0x626467, 0x626467);
  grid.scale.z = 18 / 24; grid.position.y = -0.012;
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.12; stage.add(grid);

  // Machine rooms contain the server cabinets exported from the source Blender file.
  // Open roofs and glazed sides keep equipment and service aisles visible.
  for (const x of [-9.1, -5.3, -1.5]) {
    const room = new THREE.Group(); room.position.set(x, 0, -6.45);
    room.name = 'Machine room'; stage.add(room);
    box(room, dark, [2.9, 0.16, 3.7], [0, 0.09, 0]);
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x9aadaa, transparent: true, opacity: 0.13, roughness: 0.2, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
    for (const dx of [-1.44, 1.44]) {
      for (const dz of [-1.84, 0, 1.84]) box(room, white, [0.085, 2.95, 0.085], [dx, 1.6, dz]);
      box(room, glass, [0.018, 2.65, 3.6], [dx, 1.6, 0]);
      box(room, white, [0.13, 0.18, 3.78], [dx, 3.1, 0]);
    }
    box(room, white, [2.9, 2.95, 0.09], [0, 1.6, -1.84]);
    box(room, white, [2.95, 0.2, 0.1], [0, 3.1, 1.84]);
    // Front service entrance, with a visible centre aisle rather than a blank wall.
    for (const dx of [-1.06, 1.06]) box(room, white, [0.68, 2.9, 0.08], [dx, 1.6, 1.84]);
    box(room, glass, [1.35, 2.5, 0.025], [0, 1.42, 1.87]);
    box(room, steel, [0.035, 0.42, 0.05], [0.32, 1.45, 1.92]);
    box(room, dark, [0.7, 0.14, 0.025], [0, 2.9, 1.91]);
    for (const dz of [-1.35, -0.45, 0.45, 1.35]) box(room, white, [2.8, 0.06, 0.045], [0, 3.12, dz]);
  }

  const parcels: THREE.Mesh[] = [];
  for (const z of [4.5, 6.9]) {
    for (const x of [-10.5, -8.8, -7.1, -5.4, -3.7]) {
      for (const dz of [-0.38, 0.38]) box(stage, white, [0.055, 0.83, 0.055], [x, 0.41, z + dz]);
      box(stage, white, [1.67, 0.1, 0.9], [x + 0.75, 0.87, z]);
      box(stage, green, [1.6, 0.06, 0.66], [x + 0.75, 0.94, z]);
      for (const dz of [-0.44, 0.44]) box(stage, steel, [1.7, 0.07, 0.035], [x + 0.75, 1.01, z + dz]);
    }
    parcels.push(box(stage, tote, [0.48, 0.28, 0.45], [-9, 1.11, z]));
  }
  // Central workstations and low safety fences leave the logistics corridors open.
  for (const x of [-4.8, -2.8, -0.8]) for (const z of [0.6, 2.7]) {
    box(stage, steel, [1.45, 0.65, 0.8], [x, 0.42, z]);
    box(stage, dark, [1.6, 0.09, 0.9], [x, 0.79, z]);
    box(stage, white, [0.3, 0.2, 0.27], [x + 0.4, 0.93, z]);
    box(stage, green, [0.2, 0.015, 0.2], [x + 0.4, 1.04, z]);
  }
  function fence(x: number, z: number, length: number) {
    for (let i = 0; i <= length; i += 1.5) box(stage, dark, [0.045, 1.25, 0.045], [x + i, 0.625, z]);
    box(stage, dark, [length, 0.055, 0.055], [x + length / 2, 1.25, z]);
    box(stage, new THREE.MeshStandardMaterial({ color: 0x444b4b, transparent: true, opacity: 0.2, roughness: 0.45, depthWrite: false }), [length, 1.15, 0.018], [x + length / 2, 0.6, z]);
  }
  fence(-11, 3.45, 9); fence(-5.8, -0.35, 5.5);
  label(stage, 'MACHINE ROOMS', -5.3, -4.15, 3);
  label(stage, 'STORAGE', -10.1, -4.1, 1.8);
  label(stage, 'MACHINING', 6, 7.7, 3);
  // Thin neutral route marks stay subordinate to the factory equipment.
  // One-way perimeter lane: outside CNC footprints and clear of conveyors,
  // fences and MCR service corridors. All AGVs keep equal spacing and speed.
  const perimeter = route(stage, [[1, -7.8], [10.8, -7.8], [10.8, 8.2], [1, 8.2]]);
  return { routes: [perimeter, perimeter, perimeter], parcels };
}

export function finishModel(model: THREE.Group, span: number, footprint?: THREE.Object3D) {
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true; object.receiveShadow = true;
    const recolor = (source: THREE.Material) => {
      const mat = source.clone() as THREE.MeshStandardMaterial;
      if (mat.color && (/navy|blue|蓝/i.test(mat.name) || (mat.color.b > mat.color.r * 1.16 && mat.color.b > mat.color.g * 1.08))) {
        mat.color.setHex(/navy/i.test(mat.name) ? 0x343b3d : 0xbac1c1); mat.map = null;
      }
      if (mat.emissive) {
        if (mat.emissive.b > mat.emissive.r || /蓝/.test(mat.name)) mat.emissive.setHex(0xd3b350);
        mat.emissiveIntensity = Math.min(mat.emissiveIntensity, 0.35);
      }
      if ('metalness' in mat) mat.metalness = Math.min(mat.metalness, 0.65);
      return mat;
    };
    object.material = Array.isArray(object.material) ? object.material.map(recolor) : recolor(object.material);
  });
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(footprint ?? model), size = bounds.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.length()) || size.length() < 0.001) throw new Error('设备模型尺寸无效');
  model.scale.multiplyScalar(span / (footprint ? Math.max(size.x, size.z) : Math.max(size.x, size.y, size.z)));
  model.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(model);
  const center = new THREE.Box3().setFromObject(footprint ?? model).getCenter(new THREE.Vector3());
  model.position.add(new THREE.Vector3(-center.x, 0.025 - fitted.min.y, -center.z));
  return model;
}

export function rigMCR(model: THREE.Group) {
  // The source GLB retains URDF joint (translation) → link (origin rotation) nodes.
  // Rotate each link in its declared local joint frame, never overwrite model root transforms.
  const joints = robotConfig.urdf.joints.map((definition) => {
    const pivot = model.getObjectByName(definition.name);
    const link = model.getObjectByName(definition.childLinkName);
    if (!pivot || !link || link.parent !== pivot) throw new Error(`MCR 关节缺失: ${definition.name}`);
    const { x, y, z, roll, pitch, yaw } = definition.origin;
    pivot.position.set(x, y, z);
    const origin = new THREE.Quaternion().setFromEuler(new THREE.Euler(roll, pitch, yaw, 'ZYX'));
    const axis = new THREE.Vector3(definition.axis.x, definition.axis.y, definition.axis.z).normalize();
    return { link, origin, axis };
  });
  const pose = (degrees: number[]) => joints.forEach(({ link, origin, axis }, i) => {
    link.quaternion.copy(origin).multiply(new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(degrees[i])));
  });
  pose(MCR_HOME);
  return pose;
}
