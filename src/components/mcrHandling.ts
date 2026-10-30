import * as THREE from 'three';
import { MCR_HOME } from './warehouseScene';

export type ToolTarget = { position: [number, number, number]; direction: [number, number, number]; reach: number; reuseBufferMotion?: boolean };
// Grasp centre in the source gripper's link6 frame; its approach axis is +Z.
export const GRASP_CENTRE = new THREE.Vector3(0.002, -0.002, 0.205);

function solveLinear(matrix: number[][], vector: number[]) {
  const rows = matrix.map((row, i) => [...row, vector[i]]);
  for (let column = 0; column < 6; column++) {
    let pivot = column;
    for (let row = column + 1; row < 6; row++) if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column])) pivot = row;
    [rows[column], rows[pivot]] = [rows[pivot], rows[column]];
    const divisor = rows[column][column];
    if (Math.abs(divisor) < 1e-12) return Array(6).fill(0);
    for (let j = column; j <= 6; j++) rows[column][j] /= divisor;
    for (let row = 0; row < 6; row++) if (row !== column) {
      const scale = rows[row][column];
      for (let j = column; j <= 6; j++) rows[row][j] -= scale * rows[column][j];
    }
  }
  return rows.map(row => row[6]);
}

export function createMCRHandling(robot: THREE.Group, pose: (degrees: number[]) => void) {
  const link = robot.getObjectByName('link6')!;
  const shoulder = robot.getObjectByName('link2')!, elbow = robot.getObjectByName('link3')!;
  const tcp = new THREE.Object3D(); tcp.name = 'Grasp centre'; tcp.position.copy(GRASP_CENTRE); link.add(tcp);
  const cache = new Map<string, number[][]>();
  const forward = (degrees: number[]) => {
    pose(degrees); tcp.updateWorldMatrix(true, false);
    return { position: tcp.getWorldPosition(new THREE.Vector3()), quaternion: tcp.getWorldQuaternion(new THREE.Quaternion()) };
  };
  const solve = (position: THREE.Vector3, quaternion: THREE.Quaternion, seed: number[]) => {
    const seeds = [seed, ...[-90, 90, 0, 180].flatMap(base => [[base, -45, 90, -45, -90, 270], [base, 45, -90, 45, 90, 270]])];
    const elbowIsRaised = () => {
      elbow.updateWorldMatrix(true, false); shoulder.updateWorldMatrix(true, false);
      return elbow.getWorldPosition(new THREE.Vector3()).y > shoulder.getWorldPosition(new THREE.Vector3()).y + 0.12;
    };
    let best = Infinity, details: unknown;
    for (const seedAngles of seeds) {
      let angles = [...seedAngles];
      for (let iteration = 0; iteration < 180; iteration++) {
        const current = forward(angles), errorPosition = position.clone().sub(current.position);
        const targetDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
        const currentDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(current.quaternion);
        const errorRotation = targetDirection.clone().sub(currentDirection);
        if (errorPosition.length() < 0.001 && errorRotation.length() < 0.005) {
          if (elbowIsRaised()) return angles;
          break;
        }
        const error = [...errorPosition.toArray(), ...errorRotation.multiplyScalar(0.45).toArray()];
        const jacobian = Array.from({ length: 6 }, () => Array(6).fill(0));
        const step = 0.001;
        for (let joint = 0; joint < 6; joint++) {
          const shifted = [...angles]; shifted[joint] += THREE.MathUtils.radToDeg(step);
          const next = forward(shifted);
          const dp = next.position.sub(current.position).multiplyScalar(1 / step);
          const dr = new THREE.Vector3(0, 0, 1).applyQuaternion(next.quaternion).sub(currentDirection).multiplyScalar(0.45 / step);
          [...dp.toArray(), ...dr.toArray()].forEach((value, row) => { jacobian[row][joint] = value; });
        }
        const matrix = jacobian.map((row, r) => jacobian.map((other, c) => row.reduce((sum, value, i) => sum + value * other[i], 0) + (r === c ? 0.0016 : 0)));
        const adjustment = solveLinear(matrix, error);
        angles = angles.map((angle, joint) => {
          const delta = jacobian.reduce((sum, row, i) => sum + row[joint] * adjustment[i], 0);
          return angle + THREE.MathUtils.radToDeg(THREE.MathUtils.clamp(delta, -0.16, 0.16));
        });
      }
      const result = forward(angles);
      const positionError = result.position.distanceTo(position), angleError = new THREE.Vector3(0, 0, 1).applyQuaternion(result.quaternion).angleTo(new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion));
      if (positionError < 0.008 && angleError < 0.03 && elbowIsRaised()) return angles;
      if (positionError + angleError < best) { best = positionError + angleError; details = { position: position.toArray(), actual: result.position.toArray(), positionError, angleError, angles }; }
    }
    throw new Error(`上下料目标不可达: ${JSON.stringify(details)}`);
  };
  const apply = (target?: ToolTarget) => {
    if (!target || target.reach <= 0) { pose(MCR_HOME); return; }
    const position = new THREE.Vector3(...target.position), direction = new THREE.Vector3(...target.direction).normalize();
    const station = robot.parent!;
    station.updateWorldMatrix(true, false);
    // Solve the accepted buffer motion once. CNC uses the same joint motion,
    // turning only the arm's base toward the opposite side of the chassis.
    if (target.reuseBufferMotion) {
      const pivot = shoulder.getWorldPosition(new THREE.Vector3());
      position.x = 2 * pivot.x - position.x; position.z = 2 * pivot.z - position.z;
      direction.x *= -1; direction.z *= -1;
    }
    const stroke = 0.24;
    const up = new THREE.Vector3(0, 1, 0), across = up.clone().cross(direction);
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across, up, direction));
    const localPosition = station.worldToLocal(position.clone());
    const localDirection = direction.clone().applyQuaternion(station.getWorldQuaternion(new THREE.Quaternion()).invert());
    const key = [...localPosition.toArray(), ...localDirection.toArray()].map(value => value.toFixed(4)).join(',');
    let path = cache.get(key);
    if (!path) {
      path = [];
      let seed = [...MCR_HOME];
      // Buffer and CNC share the same 24 cm horizontal stroke.
      for (let index = 0; index <= 24; index++) {
        const point = position.clone().addScaledVector(direction, -stroke * (1 - index / 24));
        seed = solve(point, quaternion, seed); path.push(seed);
      }
      cache.set(key, path);
    }
    let baseTurn = 0;
    if (target.reuseBufferMotion) {
      const desired = path[0][0] + 180;
      baseTurn = THREE.MathUtils.euclideanModulo(desired - MCR_HOME[0] + 180, 360) - 180 + MCR_HOME[0] - path[0][0];
    }
    const oriented = (angles: number[]) => angles.map((angle, i) => angle + (i === 0 ? baseTurn : 0));
    if (target.reach < 0.65) {
      const approach = oriented(path[0]);
      pose(MCR_HOME.map((angle, i) => THREE.MathUtils.lerp(angle, approach[i], target.reach / 0.65)));
    } else {
      const progress = THREE.MathUtils.clamp((target.reach - 0.65) / 0.35, 0, 1) * 24;
      const lower = Math.floor(progress), upper = Math.min(lower + 1, 24);
      pose(oriented(path[lower].map((angle, i) => THREE.MathUtils.lerp(angle, path![upper][i], progress - lower))));
    }
  };
  return { apply, tcp };
}
