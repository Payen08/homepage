import * as THREE from 'three';

function vertices(root: THREE.Object3D) {
  const points: THREE.Vector3[] = [];
  root.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    const attribute = node.geometry.getAttribute('position');
    const stride = Math.max(1, Math.floor(attribute.count / 3000));
    for (let i = 0; i < attribute.count; i += stride) points.push(new THREE.Vector3().fromBufferAttribute(attribute, i).applyMatrix4(node.matrixWorld));
  });
  return points;
}

function gap(first: THREE.Vector3[], second: THREE.Vector3[]) {
  const cell = 0.025, buckets = new Map<string, THREE.Vector3[]>();
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
  for (const point of first) {
    const address = key(Math.floor(point.x / cell), Math.floor(point.y / cell), Math.floor(point.z / cell));
    const list = buckets.get(address) ?? []; list.push(point); buckets.set(address, list);
  }
  let nearest = Infinity;
  for (const point of second) {
    const x = Math.floor(point.x / cell), y = Math.floor(point.y / cell), z = Math.floor(point.z / cell);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      for (const other of buckets.get(key(x + dx, y + dy, z + dz)) ?? []) nearest = Math.min(nearest, point.distanceToSquared(other));
    }
  }
  return Math.sqrt(nearest);
}

export function jointGaps(robot: THREE.Object3D) {
  robot.updateWorldMatrix(true, true);
  const names = ['base_visual', ...Array.from({ length: 6 }, (_, i) => `link${i + 1}_visual`), '夹爪001'];
  const clouds = names.map(name => vertices(robot.getObjectByName(name)!));
  return clouds.slice(1).map((cloud, i) => ({ joint: `${names[i]} → ${names[i + 1]}`, gap: gap(clouds[i], cloud) }));
}
