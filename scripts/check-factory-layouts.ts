/** Runs production layouts and real model geometry, without a browser. */
import * as THREE from 'three';
import { buildFactoryScenario, FACTORY_SCENARIOS, MCR_FORWARD } from '../src/components/factoryScenarios';
import { populateFactoryScenario } from '../src/components/factorySceneModels';
import { original } from './factory-model-fixtures';
import { jointGaps } from './mcr-connection-check';
let failed = false;
for (const { id } of FACTORY_SCENARIOS) {
  const stage = new THREE.Group(), layout = buildFactoryScenario(stage, id);
  const obstacles: { name: string; bounds: THREE.Box3 }[] = [];
  stage.updateMatrixWorld(true);
  stage.traverse(node => {
    if (node instanceof THREE.Mesh && node.geometry.type === 'BoxGeometry') {
      const bounds = new THREE.Box3().setFromObject(node);
      if (bounds.max.y > 0.1) obstacles.push({ name: `structure ${obstacles.length}`, bounds });
    }
  });
  const assets = new Map([...original].map(([name, model]) => [name, model.clone(true)]));
  const { update, robots, fixtures } = populateFactoryScenario(stage, layout, assets);
  fixtures.forEach(group => {
    if (group.name.startsWith('cnc') && id === 'tending') group.traverse(node => {
      if (node instanceof THREE.Mesh) obstacles.push({ name: group.name + '/' + node.name, bounds: new THREE.Box3().setFromObject(node) });
    });
    else obstacles.push({ name: group.name, bounds: new THREE.Box3().setFromObject(group) });
  });
  if (id === 'inspection' && (layout.robotTasks.some(task => task.asset !== 'agv') || layout.placements.some(item => item.asset === 'factory-server' && item.z > -4.5))) throw new Error('巡检必须使用空载 AGV，柜体只允许位于机房内部');
  const previousSamples = new Map<THREE.Group, { x: number; z: number; yaw: number; reverse?: boolean; holding?: boolean }>();
  const connectionSamples: unknown[] = [];
  let minGap = Infinity, maxTCPError = 0, maxApproachAngle = 0, contactSamples = 0;
  const collisions: unknown[] = [];
  for (let tick = 0; tick <= 2000; tick++) {
    const seconds = tick / 10; update(seconds);
    stage.updateMatrixWorld(true);
    if (id === 'tending' && [0, 40, 140, 260, 370, 600].includes(tick)) {
      const robot = robots.find(robot => robot.name === 'MCR 1')!;
      const connections = jointGaps(robot);
      connectionSamples.push({ seconds, connections });
      if (connections.some(connection => connection.gap > 0.025)) throw new Error(`机械臂关节断开: ${JSON.stringify(connections)}`);
    }
    const bounds = robots.map(robot => {
      if (robot.userData.bodyBounds) return robot.userData.bodyBounds.clone().applyMatrix4(robot.matrixWorld) as THREE.Box3;
      return new THREE.Box3().setFromObject(robot);
    });
    for (const robot of robots) {
      const sample = robot.userData.sample, tcp = robot.userData.tcp as THREE.Object3D | undefined;
      const previous = previousSamples.get(robot);
      if (id === 'tending' && sample && Math.abs(sample.yaw - Math.PI / 2) > 1e-8) throw new Error('取放时车身必须保持沿通道的行驶姿态');
      if (sample && previous) {
        const velocity = new THREE.Vector3(sample.x - previous.x, 0, sample.z - previous.z);
        if (velocity.length() > 0.0001 && !sample.reverse && !previous.reverse) {
          const nose = (id === 'tending' ? MCR_FORWARD.clone() : new THREE.Vector3(-1, 0, 0)).applyAxisAngle(new THREE.Vector3(0, 1, 0), sample.yaw);
          if (nose.dot(velocity.clone().normalize()) < 0.995) throw new Error('车头方向与前进行驶方向不一致');
        }
        if (id === 'inspection' && velocity.length() < 0.05) throw new Error('巡检出现停顿或原地转向');
      }
      if (sample?.tool) {
        const nose = MCR_FORWARD.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), sample.yaw);
        if (Math.abs(nose.dot(new THREE.Vector3(...sample.tool.direction))) > 0.001) throw new Error('取放必须由侧向伸臂完成，不能让车身转向机床');
      }
      if (tcp && sample?.tool && previous && Math.hypot(sample.x - previous.x, sample.z - previous.z) > 0.001) throw new Error('机械臂伸出时底盘仍在移动');
      if (tcp && previous && previous.holding !== sample.holding && (!sample.tool || sample.tool.reach < 0.999)) throw new Error('工件交接时夹爪尚未到位');
      if (sample) previousSamples.set(robot, sample);
      if (!tcp || !sample?.tool || sample.tool.reach < 0.65) continue;
      if (Math.abs(sample.tool.position[0]) > 3 && (sample.dock?.open ?? 0) < 0.99) throw new Error('机床门未打开就开始上下料');
      const direction = new THREE.Vector3(...sample.tool.direction).normalize();
      const expected = new THREE.Vector3(...sample.tool.position).addScaledVector(direction, -0.24 * (1 - (sample.tool.reach - 0.65) / 0.35));
      const error = tcp.getWorldPosition(new THREE.Vector3()).distanceTo(expected);
      const angle = new THREE.Vector3(0, 0, 1).applyQuaternion(tcp.getWorldQuaternion(new THREE.Quaternion())).angleTo(direction);
      const payload = tcp.children.find(node => node instanceof THREE.Mesh);
      if (sample.holding && payload && payload.getWorldPosition(new THREE.Vector3()).distanceTo(expected.clone().addScaledVector(direction, 0.14)) > 0.008) throw new Error('工件没有跟随夹爪抓取位置');
      maxTCPError = Math.max(maxTCPError, error); maxApproachAngle = Math.max(maxApproachAngle, THREE.MathUtils.radToDeg(angle)); contactSamples++;
      if ((error > 0.008 || angle > 0.03) && collisions.length < 6) collisions.push({ seconds, robot: robot.name, invalidGrasp: true, error, angle });
    }
    bounds.forEach((box, i) => {
      for (const obstacle of obstacles) if (box.intersectsBox(obstacle.bounds) && collisions.length < 6) {
        collisions.push({ seconds, robot: robots[i].name, obstacle: obstacle.name, robotBounds: [box.min.toArray(), box.max.toArray()], obstacleBounds: [obstacle.bounds.min.toArray(), obstacle.bounds.max.toArray()] });
      }
      for (let j = i + 1; j < bounds.length; j++) {
        if (box.intersectsBox(bounds[j]) && collisions.length < 6) collisions.push({ seconds, robots: [robots[i].name, robots[j].name] });
        const dx = Math.max(0, box.min.x - bounds[j].max.x, bounds[j].min.x - box.max.x), dz = Math.max(0, box.min.z - bounds[j].max.z, bounds[j].min.z - box.max.z);
        minGap = Math.min(minGap, Math.hypot(dx, dz));
      }
      if (box.min.x < -12 || box.max.x > 12 || box.min.z < -9 || box.max.z > 9) if (collisions.length < 6) collisions.push({ seconds, robot: robots[i].name, outsideFloor: true });
    });
  }
  if (id === 'tending') {
    for (const [lane, robot] of robots.filter(robot => robot.name.startsWith('MCR')).entries()) {
      const capture = (phase: number) => {
        update((phase - lane * 20 + 64) % 64);
        return Array.from({ length: 6 }, (_, i) => robot.getObjectByName(`link${i + 1}`)!.quaternion.clone());
      };
      const buffer = capture(4), cnc = capture(26);
      if (buffer.slice(1).some((rotation, i) => rotation.angleTo(cnc[i + 1]) > 0.001)) throw new Error('CNC 没有复用绿色料台的取放动作');
      if (Math.abs(buffer[0].angleTo(cnc[0]) - Math.PI) > 0.001) throw new Error('复用取放动作时，只有机械臂底座应转向另一侧');
    }
  }
  console.log(JSON.stringify({ scene: id, seconds: 200, samples: 2001, movingRobots: robots.length, obstacles: obstacles.length, minRobotGap: Number.isFinite(minGap) ? minGap : undefined, contactSamples, maxTCPError, maxApproachAngle, connectionSamples, collisions }, null, 2));
  if (collisions.length) failed = true;
}
if (failed) process.exitCode = 1;
