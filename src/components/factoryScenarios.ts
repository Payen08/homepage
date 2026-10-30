import * as THREE from 'three';
import type { ToolTarget } from './mcrHandling';
import {
  box, buildFactoryShell, buildMachineRooms, buildWarehouse, label, route,
  CNC_STATIONS, RACK_STATIONS, MCR_STATIONS, MCR_HOME,
} from './warehouseScene';

export const FACTORY_SCENARIOS = [
  { id: 'delivery', title: '线边物料配送' },
  { id: 'tending', title: '跨工位上下料' },
  { id: 'inspection', title: '厂区自主巡检' },
] as const;
export type FactoryScenario = typeof FACTORY_SCENARIOS[number]['id'];
export type FactoryAsset = 'agv' | 'cnc' | 'mcr' | 'factory-rack' | 'factory-server';
export type Placement = { asset: FactoryAsset; x: number; z: number; yaw: number; y?: number };
export type RobotPose = { x: number; z: number; yaw: number; angles: number[]; holding?: boolean; scanning?: boolean; tool?: ToolTarget; reverse?: boolean; dock?: { x: number; z: number; open: number } };
export type RobotTask = { asset: 'agv' | 'mcr'; sample: (seconds: number) => RobotPose; carriesPart?: boolean; inspection?: boolean };
export type FactoryLayout = {
  placements: Placement[];
  agvRoutes: THREE.CurvePath<THREE.Vector3>[];
  robotTasks: RobotTask[];
  update: (seconds: number) => void;
  operatesCNC?: boolean;
};

const smooth = (value: number) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };
const blend = (from: number, to: number, value: number) => THREE.MathUtils.lerp(from, to, smooth(value));
const arm = (reach: number, offsets = [35, -28, -40, 30, 18, -35]) => MCR_HOME.map((angle, i) => angle + offsets[i] * reach);
const work = (time: number, start: number) => smooth((time - start) / 2) - smooth((time - start - 4) / 2);
const placements = (asset: FactoryAsset, stations: number[][]): Placement[] => stations.map(([x, z, yaw = 0]) => ({ asset, x, z, yaw }));

function serverRows(rooms: number[]) {
  return rooms.flatMap(x => [-0.9, 0.9].flatMap(dx => [-1.15, 0, 1.15].map(dz => ({
    asset: 'factory-server' as const, x: x + dx, z: -6.45 + dz, y: 0.18, yaw: dx < 0 ? Math.PI / 2 : -Math.PI / 2,
  }))));
}

// The motion sampler is also used by the geometry regression check.
// Bases stop before either arm extends; both return to Home before driving.
// Local +X is the driving axis. At a workstation the chassis stays along
// the aisle, exactly as in transit; only the arm turns toward the machine.
export const MCR_FORWARD = new THREE.Vector3(1, 0, 0);
export const TENDING_CYCLE = 64;
// Reflect the buffer TCP around the arm pedestal, preserving the accepted reach.
const cncToolX = (side: number) => side * (2 * 3.4 - 2.25) + 2 * 0.01275;
export function tendingPose(seconds: number, lane: number): RobotPose {
  const cycle = seconds % TENDING_CYCLE, side = lane === 0 ? -1 : 1;
  const sourceZ = 5.9, moduleZ = [3.4, -0.6, -4.6][Math.floor(seconds / TENDING_CYCLE) % 3];
  const targetZ = moduleZ + side * 0.94;
  // Offset the parking centre from the arm pedestal, so the shoulder lines
  // up with the fixture without turning or translating the chassis sideways.
  const parkedSourceZ = sourceZ + 0.6044, parkedTargetZ = targetZ + 0.6044;
  const x = side * 3.4, yaw = Math.PI / 2;
  let z = parkedSourceZ;
  if (cycle >= 9 && cycle < 18) z = blend(parkedSourceZ, parkedTargetZ, (cycle - 9) / 9);
  else if (cycle >= 18 && cycle < 44) z = parkedTargetZ;
  else if (cycle >= 44 && cycle < 53) z = blend(parkedTargetZ, parkedSourceZ, (cycle - 44) / 9);
  const pickup = work(cycle, 1), load = work(cycle, 23), unload = work(cycle, 33), deposit = work(cycle, 56);
  const tool: ToolTarget | undefined = pickup > 0 ? { position: [side * 2.25, 1.3, sourceZ], direction: [-side, 0, 0], reach: pickup }
    : load + unload > 0 ? { position: [cncToolX(side), 1.3, targetZ], direction: [side, 0, 0], reach: load + unload, reuseBufferMotion: true }
    : deposit > 0 ? { position: [side * 2.25, 1.3, sourceZ], direction: [-side, 0, 0], reach: deposit } : undefined;
  const open = Math.max(smooth((cycle - 20) / 2) - smooth(cycle - 29), smooth(cycle - 31) - smooth(cycle - 39));
  return { x, z, yaw, angles: MCR_HOME, tool, reverse: cycle >= 44 && cycle <= 53,
    holding: (cycle >= 5 && cycle < 27) || (cycle >= 37 && cycle < 60),
    dock: { x: side * 4.8, z: moduleZ, open },
  };
}

export function agvPose(path: THREE.CurvePath<THREE.Vector3>, seconds: number, index: number, count: number): RobotPose {
  const progress = (seconds * 0.6 / path.getLength() + index / count) % 1;
  const point = path.getPointAt(progress), tangent = path.getTangentAt(progress);
  return { x: point.x, z: point.z, yaw: Math.atan2(tangent.x, tangent.z) + Math.PI / 2, angles: MCR_HOME };
}

function buildDelivery(stage: THREE.Group): FactoryLayout {
  const { routes, parcels } = buildWarehouse(stage);
  return {
    placements: [...placements('cnc', CNC_STATIONS), ...placements('factory-rack', RACK_STATIONS), ...serverRows([-9.1, -5.3, -1.5])],
    agvRoutes: routes,
    robotTasks: MCR_STATIONS.map(([x, z], i) => ({ asset: 'mcr', sample: seconds => {
      const cycle = seconds % 24;
      const travel = cycle < 2 ? 0 : cycle < 7 ? smooth((cycle - 2) / 5) : cycle < 15 ? 1 : cycle < 20 ? 1 - smooth((cycle - 15) / 5) : 0;
      const turn = cycle < 1 ? 0 : cycle < 2 ? smooth(cycle - 1) : cycle < 7 ? 1 : cycle < 8 ? 1 - smooth(cycle - 7) : 0;
      const reach = cycle < 8 ? 0 : cycle < 10 ? smooth((cycle - 8) / 2) : cycle < 12 ? 1 : cycle < 14 ? 1 - smooth((cycle - 12) / 2) : 0;
      return { x: x + [4, 0, 2.6][i] * travel, z, yaw: i === 1 ? 0 : Math.PI * turn, angles: arm(reach) };
    } })),
    update: seconds => parcels.forEach((parcel, i) => { parcel.position.x = -9.8 + ((seconds * 0.22 + i * 2.1) % 6.4); }),
  };
}

function conveyor(stage: THREE.Group, x: number, z: number, length: number, yaw: number) {
  const line = new THREE.Group(); line.name = 'Material conveyor'; line.position.set(x, 0, z); line.rotation.y = yaw; stage.add(line);
  const white = new THREE.MeshStandardMaterial({ color: 0xd7dada, metalness: 0.3, roughness: 0.65 });
  const green = new THREE.MeshStandardMaterial({ color: 0x306747, metalness: 0.2, roughness: 0.65 });
  for (let dx = -length / 2 + 0.2; dx < length / 2; dx += 1.3) for (const dz of [-0.38, 0.38]) box(line, white, [0.055, 0.83, 0.055], [dx, 0.42, dz]);
  box(line, white, [length, 0.1, 0.9], [0, 0.87, 0]);
  box(line, green, [length - 0.1, 0.05, 0.66], [0, 0.94, 0]);
  for (const dz of [-0.44, 0.44]) box(line, white, [length, 0.07, 0.035], [0, 1.0, dz]);
  for (const dx of [-length * 0.3, 0, length * 0.3]) box(line, white, [0.4, 0.24, 0.4], [dx, 1.08, 0]);
}

function buildTending(stage: THREE.Group): FactoryLayout {
  const { steel, white, dark, green } = buildFactoryShell(stage);
  // Source CNC doors face local +X. Opposing rows share a wide service aisle.
  const machines = [-4.8, 4.8].flatMap(x => [-4.6, -0.6, 3.4].map(z => [x, z, x < 0 ? 0 : Math.PI]));
  const racks = [-4.8, -1.6, 1.6].map(z => [-10.9, z, Math.PI / 2]);
  const buffers = [-1.95, 1.95].map(x => {
    box(stage, steel, [0.85, 0.92, 1.25], [x, 0.48, 5.9]);
    box(stage, dark, [0.95, 0.08, 1.35], [x, 0.98, 5.9]);
    box(stage, green, [0.7, 0.025, 1.05], [x, 1.03, 5.9]);
    box(stage, steel, [0.18, 0.21, 0.18], [Math.sign(x) * 2, 1.13, 5.9]);
    const parts = Array.from({ length: 2 }, () => {
      const part = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.36, 16).rotateZ(Math.PI / 2), white);
      part.position.set(Math.sign(x) * 2.11, 1.3, 5.9); part.castShadow = true; stage.add(part); return part;
    });
    return parts;
  });
  const machineParts = [-1, 1].flatMap(side => [-4.6, -0.6, 3.4].map(moduleZ => {
    const z = moduleZ + side * 0.94;
    box(stage, steel, [0.16, 0.33, 0.18], [cncToolX(side) + side * 0.24, 1.07, z]);
    const part = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.36, 16).rotateZ(Math.PI / 2), white);
    part.position.set(cncToolX(side) + side * 0.14, 1.3, z); part.castShadow = true; stage.add(part);
    return { part, side, moduleZ };
  }));
  // Dedicated MCR lanes terminate at the pickup buffers, never cross the AGV lane.
  for (const x of [-3.4, 3.4]) {
    const path = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 0.025, -4.6 + Math.sign(x) * 0.94 + 0.6044), new THREE.Vector3(x, 0.025, 6.5044)]);
    stage.add(new THREE.Line(path, new THREE.LineBasicMaterial({ color: 0x9a9e94, transparent: true, opacity: 0.28 })));
    for (const z of [-4.6, -0.6, 3.4].map(z => z + Math.sign(x) * 0.94 + 0.6044).concat(6.5044)) {
      const mark = new THREE.Mesh(new THREE.RingGeometry(0.58, 0.6, 40), new THREE.MeshBasicMaterial({ color: 0xb8ab76, transparent: true, opacity: 0.45, depthWrite: false }));
      mark.rotation.x = -Math.PI / 2; mark.position.set(x, 0.03, z); stage.add(mark);
    }
  }
  label(stage, 'CNC / 01', -4.8, 6.2, 2);
  label(stage, 'CNC / 02', 4.8, 6.2, 2);
  label(stage, 'MATERIAL BUFFER', 0, 7.4, 2.5);
  // Side feed line and rear stock bays support the machining cells.
  conveyor(stage, -8.3, 1.2, 5.4, Math.PI / 2);
  const logistics = route(stage, [[7.4, -7.4], [10.5, -7.4], [10.5, 6.8], [7.4, 6.8]]);
  return {
    placements: [...placements('cnc', machines), ...placements('factory-rack', [...racks, ...[-7.3, -4, -0.7, 2.6].map(x => [x, -7.7, 0])])],
    agvRoutes: [logistics, logistics],
    robotTasks: [0, 1].map(lane => ({ asset: 'mcr', sample: seconds => tendingPose(seconds + lane * 20, lane), carriesPart: true })),
    operatesCNC: true,
    update: seconds => {
      buffers.forEach(([raw, finished], lane) => {
        const cycle = (seconds + lane * 20) % TENDING_CYCLE;
        raw.visible = cycle < 5 || cycle >= 62;
        finished.visible = cycle >= 60 && cycle < 62;
      });
      machineParts.forEach(({ part, side, moduleZ }) => {
        const lane = side < 0 ? 0 : 1, time = seconds + lane * 20;
        const selected = [3.4, -0.6, -4.6][Math.floor(time / TENDING_CYCLE) % 3];
        part.visible = selected === moduleZ && time % TENDING_CYCLE >= 27 && time % TENDING_CYCLE < 37;
      });
    },
  };
}

function buildInspection(stage: THREE.Group): FactoryLayout {
  const { steel, dark } = buildFactoryShell(stage);
  const rooms = [-7.5, -3.6, 0.3];
  buildMachineRooms(stage, rooms);
  const machines = [-4.6, -0.6, 3.4].map(z => [7.1, z, Math.PI]);
  const racks = [-1.6, 1.6, 4.8].map(z => [-11, z, Math.PI / 2]);
  // Actual production and storage zones surround the inspection aisle.
  conveyor(stage, -4.5, 1.2, 4.3, 0);
  conveyor(stage, -4.5, 4.0, 4.3, 0);
  const innerMachines = [-0.6, 3.4].map(z => [0.2, z, 0]);
  const patrol = route(stage, [[-8.5, -3.1], [4.7, -3.1], [4.7, 6.5], [-8.5, 6.5]]);
  // Two empty AGVs are parked in the charging area, outside the inspection circuit.
  for (const x of [8.1, 10.3]) {
    box(stage, steel, [1.8, 0.025, 1.5], [x, 0.005, 6.8]);
    box(stage, dark, [0.14, 0.42, 0.72], [x + 0.8, 0.23, 6.8]);
  }
  label(stage, 'CHARGING', 9.2, 8.1, 2);
  label(stage, 'PRODUCTION', 3.5, 6.3, 2.3);
  label(stage, 'MATERIAL TRANSFER', -4.5, 5.3, 2.8);
  return {
    placements: [...serverRows(rooms), ...placements('cnc', [...machines, ...innerMachines]), ...placements('factory-rack', racks), ...placements('agv', [[8.1, 6.8, Math.PI], [10.3, 6.8, Math.PI]])],
    agvRoutes: [],
    robotTasks: [{ asset: 'agv', inspection: true, sample: seconds => ({
      ...agvPose(patrol, seconds, 0, 1), scanning: true,
    }) }],
    update: () => undefined,
  };
}

export function buildFactoryScenario(stage: THREE.Group, scenario: FactoryScenario): FactoryLayout {
  if (scenario === 'tending') return buildTending(stage);
  if (scenario === 'inspection') return buildInspection(stage);
  return buildDelivery(stage);
}
