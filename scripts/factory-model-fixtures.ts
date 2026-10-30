import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { FactoryAsset } from '../src/components/factoryScenarios';
// Canvas textures and embedded cabinet images do not affect physical bounds.
const context = { createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {}, fillText() {} };
Object.assign(globalThis, {
  self: globalThis,
  document: { createElement: () => ({ getContext: () => context }) },
  createImageBitmap: async () => ({ width: 1, height: 1, close() {} }),
});
const dracoModule = { exports: {} as any };
const decoderSource = readFileSync(new URL('../public/draco/draco_decoder.js', import.meta.url), 'utf8');
vm.runInThisContext(`(function(module,exports,require,__dirname){${decoderSource}\n})`)(dracoModule, dracoModule.exports, createRequire(import.meta.url), new URL('../public/draco/', import.meta.url).pathname);
const D = await dracoModule.exports();
const decoder = {
  preload() {},
  decodeDracoFile(buffer: ArrayBuffer, callback: (g: THREE.BufferGeometry) => void, ids: Record<string, number>) {
    const d = new D.Decoder(), input = new D.DecoderBuffer(), mesh = new D.Mesh();
    input.Init(new Int8Array(buffer), buffer.byteLength);
    const status = d.DecodeBufferToMesh(input, mesh);
    if (!status.ok()) throw new Error(status.error_msg());
    const geometry = new THREE.BufferGeometry();
    for (const [name, id] of Object.entries(ids)) {
      const attr = d.GetAttributeByUniqueId(mesh, id), data = new D.DracoFloat32Array();
      d.GetAttributeFloatForAllPoints(mesh, attr, data);
      const values = new Float32Array(data.size());
      for (let i = 0; i < values.length; i++) values[i] = data.GetValue(i);
      geometry.setAttribute(name, new THREE.BufferAttribute(values, attr.num_components()));
      D.destroy(data);
    }
    const face = new D.DracoInt32Array(), indices = new Uint32Array(mesh.num_faces() * 3);
    for (let i = 0; i < mesh.num_faces(); i++) { d.GetFaceFromMesh(mesh, i, face); for (let j = 0; j < 3; j++) indices[i * 3 + j] = face.GetValue(j); }
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    D.destroy(face); D.destroy(mesh); D.destroy(input); D.destroy(d);
    return Promise.resolve(geometry).then(callback);
  },
};
const loader = new GLTFLoader().setDRACOLoader(decoder as any);
export const original = new Map<FactoryAsset, THREE.Group>();
for (const asset of ['agv', 'cnc', 'mcr', 'factory-rack', 'factory-server'] as FactoryAsset[]) {
  const bytes = readFileSync(new URL(`../public/models/${asset}.glb`, import.meta.url));
  original.set(asset, (await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene);
}
