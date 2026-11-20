import fs from 'fs';
import path from 'path';

const glbPath = path.resolve('public/models/building_fishermen_cooperative_01.glb');

if (!fs.existsSync(glbPath)) {
  console.error(`File not found: ${glbPath}`);
  process.exit(1);
}

const stats = fs.statSync(glbPath);
console.log('=====================================================================');
console.log('=== FISHING HARBOUR ASSET 9: FISHERMEN COOPERATIVE GLB VALIDATION ===');
console.log('=====================================================================\n');
console.log(`GLB File: ${glbPath}`);
console.log(`File Size: ${(stats.size / 1024).toFixed(2)} KB (${stats.size} bytes)`);

const fd = fs.openSync(glbPath, 'r');
const headerBuf = Buffer.alloc(12);
fs.readSync(fd, headerBuf, 0, 12, 0);

const magic = headerBuf.readUInt32LE(0);
const version = headerBuf.readUInt32LE(4);
const length = headerBuf.readUInt32LE(8);

console.log(`Magic: 0x${magic.toString(16)} (glTF: 0x46546c67)`);
console.log(`Version: ${version}`);
console.log(`Reported Total Length: ${length} bytes`);

const chunk0Header = Buffer.alloc(8);
fs.readSync(fd, chunk0Header, 0, 8, 12);
const chunk0Length = chunk0Header.readUInt32LE(0);

const jsonBuf = Buffer.alloc(chunk0Length);
fs.readSync(fd, jsonBuf, 0, chunk0Length, 20);
fs.closeSync(fd);

const gltf = JSON.parse(jsonBuf.toString('utf-8'));

console.log('\n--- GLTF Structure Summary ---');
console.log(`Nodes count: ${gltf.nodes ? gltf.nodes.length : 0}`);
console.log(`Meshes count: ${gltf.meshes ? gltf.meshes.length : 0}`);
console.log(`Materials count: ${gltf.materials ? gltf.materials.length : 0}`);
console.log(`Accessors count: ${gltf.accessors ? gltf.accessors.length : 0}`);

if (gltf.materials) {
  console.log('\nMaterials:');
  gltf.materials.forEach((m, i) => console.log(`  [${i + 1}] ${m.name}`));
}

if (gltf.nodes) {
  const colliders = [];
  const visuals = [];
  gltf.nodes.forEach((n) => {
    if (n.name && n.name.startsWith('Collider_')) {
      colliders.push(n.name);
    } else if (n.name) {
      visuals.push(n.name);
    }
  });

  console.log(`\nColliders (${colliders.length}):`, colliders);
  console.log(`Visual Objects sample (first 10 of ${visuals.length}):`, visuals.slice(0, 10));
}

// Compute world-space transformed extents
let visualMin = [Infinity, Infinity, Infinity];
let visualMax = [-Infinity, -Infinity, -Infinity];
let colliderMin = [Infinity, Infinity, Infinity];
let colliderMax = [-Infinity, -Infinity, -Infinity];

gltf.nodes.forEach((node) => {
  if (node.mesh === undefined) return;
  const mesh = gltf.meshes[node.mesh];
  const t = node.translation || [0, 0, 0];
  const s = node.scale || [1, 1, 1];

  let nodeMin = [Infinity, Infinity, Infinity];
  let nodeMax = [-Infinity, -Infinity, -Infinity];

  mesh.primitives.forEach((prim) => {
    const posAccIdx = prim.attributes.POSITION;
    const acc = gltf.accessors[posAccIdx];
    if (acc && acc.min && acc.max) {
      for (let i = 0; i < 3; i++) {
        const pMin = acc.min[i] * s[i] + t[i];
        const pMax = acc.max[i] * s[i] + t[i];
        nodeMin[i] = Math.min(nodeMin[i], pMin, pMax);
        nodeMax[i] = Math.max(nodeMax[i], pMin, pMax);
      }
    }
  });

  const isCollider = node.name && node.name.startsWith('Collider_');
  for (let i = 0; i < 3; i++) {
    if (isCollider) {
      colliderMin[i] = Math.min(colliderMin[i], nodeMin[i]);
      colliderMax[i] = Math.max(colliderMax[i], nodeMax[i]);
    } else {
      visualMin[i] = Math.min(visualMin[i], nodeMin[i]);
      visualMax[i] = Math.max(visualMax[i], nodeMax[i]);
    }
  }
});

console.log('\n--- Bounding Box Extents (Local Coordinates) ---');
console.log(`Visual Geometry Extents:`);
console.log(`  Min: [X: ${visualMin[0].toFixed(2)}, Y: ${visualMin[1].toFixed(2)}, Z: ${visualMin[2].toFixed(2)}]`);
console.log(`  Max: [X: ${visualMax[0].toFixed(2)}, Y: ${visualMax[1].toFixed(2)}, Z: ${visualMax[2].toFixed(2)}]`);
console.log(`  Dimensions: ${(visualMax[0] - visualMin[0]).toFixed(2)}m (W) x ${(visualMax[1] - visualMin[1]).toFixed(2)}m (H) x ${(visualMax[2] - visualMin[2]).toFixed(2)}m (D)`);

console.log(`\nCollider Extents:`);
console.log(`  Min: [X: ${colliderMin[0].toFixed(2)}, Y: ${colliderMin[1].toFixed(2)}, Z: ${colliderMin[2].toFixed(2)}]`);
console.log(`  Max: [X: ${colliderMax[0].toFixed(2)}, Y: ${colliderMax[1].toFixed(2)}, Z: ${colliderMax[2].toFixed(2)}]`);
console.log(`  Dimensions: ${(colliderMax[0] - colliderMin[0]).toFixed(2)}m (W) x ${(colliderMax[1] - colliderMin[1]).toFixed(2)}m (H) x ${(colliderMax[2] - colliderMin[2]).toFixed(2)}m (D)`);

const groundAlignmentOk = Math.abs(visualMin[1]) < 0.05 && Math.abs(colliderMin[1]) < 0.05;
console.log(`\nGround Alignment Check (Y = 0.0m): ${groundAlignmentOk ? 'PASSED' : 'FAILED'}`);

const sizeOk = stats.size <= 1.5 * 1024 * 1024;
console.log(`File Size Check (<= 1.5 MB): ${sizeOk ? 'PASSED' : 'FAILED'}`);

console.log('\n=== ASSET 9 GLB VALIDATION COMPLETE ===');
