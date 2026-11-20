import fs from 'fs';
import path from 'path';

const glbPath = path.resolve('public/models/building_fishery_cold_storage_01.glb');

if (!fs.existsSync(glbPath)) {
  console.error(`File not found: ${glbPath}`);
  process.exit(1);
}

const stats = fs.statSync(glbPath);
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
const chunk0Type = chunk0Header.readUInt32LE(4);

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
  console.log('\nNodes Analysis:');
  const colliders = [];
  const visuals = [];
  
  gltf.nodes.forEach((n) => {
    if (n.name && n.name.startsWith('Collider_')) {
      colliders.push(n.name);
    } else if (n.name) {
      visuals.push(n.name);
    }
  });

  console.log(`Collider Objects (${colliders.length}):`, colliders);
  console.log(`Visual Objects sample (first 10 of ${visuals.length}):`, visuals.slice(0, 10));
}

// Bounding box from mesh accessors
let minX = Infinity, minY = Infinity, minZ = Infinity;
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

if (gltf.accessors) {
  gltf.accessors.forEach((acc) => {
    if (acc.type === 'VEC3' && acc.min && acc.max) {
      minX = Math.min(minX, acc.min[0]);
      minY = Math.min(minY, acc.min[1]);
      minZ = Math.min(minZ, acc.min[2]);
      maxX = Math.max(maxX, acc.max[0]);
      maxY = Math.max(maxY, acc.max[1]);
      maxZ = Math.max(maxZ, acc.max[2]);
    }
  });

  console.log('\nBounding Box Extents (Raw Accessor Range):');
  console.log(`  X: [${minX.toFixed(2)}, ${maxX.toFixed(2)}] (Width: ${(maxX - minX).toFixed(2)}m)`);
  console.log(`  Y: [${minY.toFixed(2)}, ${maxY.toFixed(2)}] (Height: ${(maxY - minY).toFixed(2)}m)`);
  console.log(`  Z: [${minZ.toFixed(2)}, ${maxZ.toFixed(2)}] (Depth: ${(maxZ - minZ).toFixed(2)}m)`);
}
