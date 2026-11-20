import fs from 'fs';
import path from 'path';

const glbPath = 'C:\\MCP\\Blender MCP\\exports\\building_commercial_arcade_01.glb';

if (!fs.existsSync(glbPath)) {
  console.error(`File not found: ${glbPath}`);
  process.exit(1);
}

const stats = fs.statSync(glbPath);
console.log(`GLB File: ${glbPath}`);
console.log(`File Size: ${(stats.size / 1024).toFixed(2)} KB (${stats.size} bytes)`);

// Read GLB header and JSON chunk
const fd = fs.openSync(glbPath, 'r');
const headerBuf = Buffer.alloc(12);
fs.readSync(fd, headerBuf, 0, 12, 0);

const magic = headerBuf.readUInt32LE(0);
const version = headerBuf.readUInt32LE(4);
const length = headerBuf.readUInt32LE(8);

console.log(`Magic: 0x${magic.toString(16)} (glTF: 0x46546c67)`);
console.log(`Version: ${version}`);
console.log(`Reported Total Length: ${length} bytes`);

// Chunk 0 (JSON)
const chunk0Header = Buffer.alloc(8);
fs.readSync(fd, chunk0Header, 0, 8, 12);
const chunk0Length = chunk0Header.readUInt32LE(0);
const chunk0Type = chunk0Header.readUInt32LE(4);

console.log(`Chunk 0 Length: ${chunk0Length} bytes, Type: 0x${chunk0Type.toString(16)} (JSON)`);

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
  gltf.materials.forEach((m, i) => console.log(`  [${i}] ${m.name}`));
}

if (gltf.nodes) {
  console.log('\nNodes:');
  const visuals = [];
  const colliders = [];
  const other = [];
  
  gltf.nodes.forEach((n, i) => {
    if (n.name.startsWith('Collider_')) {
      colliders.push(n.name);
    } else if (n.name.startsWith('Building_')) {
      visuals.push(n.name);
    } else {
      other.push(n.name);
    }
  });

  console.log(`Visual Objects (${visuals.length}):`, visuals);
  console.log(`Collider Objects (${colliders.length}):`, colliders);
  console.log(`Other Nodes (${other.length}):`, other);
}

// Calculate total triangles
let totalTriangles = 0;
let visualTriangles = 0;
let colliderTriangles = 0;

if (gltf.meshes) {
  gltf.meshes.forEach(m => {
    let mTris = 0;
    m.primitives.forEach(p => {
      if (p.indices !== undefined && gltf.accessors[p.indices]) {
        mTris += gltf.accessors[p.indices].count / 3;
      }
    });
    totalTriangles += mTris;
    if (m.name.startsWith('Collider_')) {
      colliderTriangles += mTris;
    } else {
      visualTriangles += mTris;
    }
  });
}

console.log(`\nTriangles:`);
console.log(`  Total: ${totalTriangles}`);
console.log(`  Visual: ${visualTriangles}`);
console.log(`  Collider: ${colliderTriangles}`);
