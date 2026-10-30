import * as THREE from 'three';
import { finishModel, rigMCR, ROBOT_BASE_LENGTH } from './warehouseScene';
import { agvPose, type FactoryAsset, type FactoryLayout } from './factoryScenarios';
import { createMCRHandling } from './mcrHandling';

export function populateFactoryScenario(stage: THREE.Group, layout: FactoryLayout, models: Map<FactoryAsset, THREE.Group>) {
  const robots: THREE.Group[] = [], fixtures: THREE.Group[] = [];
  const updates: ((seconds: number) => void)[] = [];
  const discarded: THREE.Object3D[] = [];

  for (const [asset, model] of models) {
    if (asset === 'mcr') {
      let detached: THREE.Object3D | undefined;
      model.traverse(node => { if (node.name.startsWith('Radar') && node.name.includes('BoardAndModels')) detached = node; });
      if (detached) { detached.removeFromParent(); discarded.push(detached); }
      rigMCR(model);
      let chassis: THREE.Object3D | undefined;
      model.traverse(node => { if (node.name.replace(/[._]/g, '') === 'Mesh18001') chassis = node; });
      if (!chassis) throw new Error('MCR 底盘参考网格缺失');
      finishModel(model, ROBOT_BASE_LENGTH, chassis);
    } else {
      finishModel(model, asset === 'agv' ? ROBOT_BASE_LENGTH : asset === 'cnc' ? 2.85 : asset === 'factory-rack' ? 2.65 : 2.35, asset === 'agv' ? model : undefined);
    }
    layout.placements.filter(placement => placement.asset === asset).forEach((placement, index) => {
      const station = new THREE.Group(); station.name = `${asset} ${index + 1}`;
      station.position.set(placement.x, placement.y ?? 0, placement.z); station.rotation.y = placement.yaw;
      station.add(model.clone(true)); stage.add(station); fixtures.push(station);
      if (asset === 'cnc' && layout.operatesCNC) {
        station.updateWorldMatrix(true, true);
        const panels: THREE.Object3D[] = [];
        station.traverse(node => {
          if (!(node instanceof THREE.Mesh) || !/^Mesh_[23]_[123]$/.test(node.name)) return;
          const centre = station.worldToLocal(new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3()));
          if (centre.z < -0.6) panels.push(node);
        });
        const door = new THREE.Group(); door.name = 'Sliding CNC door'; station.add(door);
        panels.forEach(panel => door.attach(panel));
        updates.push(seconds => {
          const dock = layout.robotTasks.map(task => task.sample(seconds).dock).find(dock => dock && Math.abs(dock.x - placement.x) < 0.01 && Math.abs(dock.z - placement.z) < 0.01);
          door.position.z = (dock?.open ?? 0) * 0.56;
        });
      }
    });
    if (asset === 'agv') layout.agvRoutes.forEach((path, index) => {
      const carrier = new THREE.Group(); carrier.name = `AGV ${index + 1}`;
      carrier.add(model.clone(true)); stage.add(carrier); robots.push(carrier);
      updates.push(seconds => {
        const sample = agvPose(path, seconds, index, layout.agvRoutes.length);
        carrier.position.set(sample.x, 0, sample.z); carrier.rotation.y = sample.yaw;
      });
    });
    layout.robotTasks.filter(task => task.asset === asset).forEach((task, index) => {
      const robot = model.clone(true), station = new THREE.Group();
      station.name = task.inspection ? 'Inspection AGV' : `MCR ${index + 1}`;
      station.add(robot); stage.add(station); robots.push(station);
      const pose = asset === 'mcr' ? rigMCR(robot) : undefined;
      const handling = task.carriesPart ? createMCRHandling(robot, pose!) : undefined;
      let part: THREE.Mesh | undefined;
      if (handling) {
        part = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.36, 16).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xb5b8b5, metalness: 0.55, roughness: 0.4 }));
        part.castShadow = true; handling.tcp.add(part);
        const toolScale = handling.tcp.getWorldScale(new THREE.Vector3());
        part.scale.copy(new THREE.Vector3(1, 1, 1).divide(toolScale));
        part.position.z = 0.14 / toolScale.z;
        station.userData.tcp = handling.tcp;
      }
      let sensor: THREE.Group | undefined;
      if (task.inspection) {
        sensor = new THREE.Group(); sensor.name = 'LiDAR field of view';
        // A sensor field, without adding cargo or a manipulator to the source AGV.
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-0.68, 0.13, 0), new THREE.Vector3(-2.5, 0.13, -0.7), new THREE.Vector3(-2.5, 0.13, 0.7),
        ]);
        geometry.setIndex([0, 1, 2]); geometry.computeVertexNormals();
        sensor.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x9baa8b, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })));
        const edge = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-2.5, 0.13, -0.7), new THREE.Vector3(-0.68, 0.13, 0), new THREE.Vector3(-2.5, 0.13, 0.7),
        ]);
        sensor.add(new THREE.Line(edge, new THREE.LineBasicMaterial({ color: 0xb1bd9f, transparent: true, opacity: 0.5 })));
        station.add(sensor);
      }
      // Cache the body alone separately from the arm's legitimate contact envelope.
      const bodyBounds = new THREE.Box3(); robot.updateMatrixWorld(true);
      const inverse = station.matrixWorld.clone().invert();
      robot.traverse(node => {
        if (!(node instanceof THREE.Mesh)) return;
        let ancestor: THREE.Object3D | null = node;
        while (ancestor && ancestor !== robot && ancestor.name !== 'joint1') ancestor = ancestor.parent;
        if (ancestor?.name === 'joint1') return;
        node.geometry.computeBoundingBox();
        bodyBounds.union(node.geometry.boundingBox!.clone().applyMatrix4(inverse.clone().multiply(node.matrixWorld)));
      });
      station.userData.bodyBounds = bodyBounds;
      updates.push(seconds => {
        const sample = task.sample(seconds);
        station.position.set(sample.x, 0, sample.z); station.rotation.y = sample.yaw;
        if (handling) handling.apply(sample.tool); else pose?.(sample.angles);
        if (part) part.visible = !!sample.holding;
        if (sensor) { sensor.visible = !!sample.scanning; sensor.rotation.y = 0; }
        station.userData.sample = sample;
      });
    });
  }
  const templates = new THREE.Group(); templates.visible = false;
  templates.add(...models.values(), ...discarded); stage.add(templates);
  const update = (seconds: number) => { updates.forEach(animate => animate(seconds)); layout.update(seconds); };
  update(0);
  return { update, robots, fixtures };
}
