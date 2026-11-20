import fs from 'fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const glbPath = 'C:\\MCP\\Blender MCP\\exports\\building_commercial_arcade_01.glb';
const buffer = fs.readFileSync(glbPath);
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

console.log('Testing Three.js GLTFLoader parse on building_commercial_arcade_01.glb...');

const loader = new GLTFLoader();
loader.parse(
  arrayBuffer,
  '',
  (gltf) => {
    console.log('✅ Three.js GLTFLoader successfully parsed the GLB!');
    const scene = gltf.scene;
    
    // Compute world bounding box
    const box = new THREE.Box3().setFromObject(scene);
    console.log('\n--- Three.js World Bounding Box ---');
    console.log('Min:', box.min.x.toFixed(2), box.min.y.toFixed(2), box.min.z.toFixed(2));
    console.log('Max:', box.max.x.toFixed(2), box.max.y.toFixed(2), box.max.z.toFixed(2));
    const size = new THREE.Vector3();
    box.getSize(size);
    console.log('Size: Width (X) =', size.x.toFixed(2), 'Height (Y) =', size.y.toFixed(2), 'Depth (Z) =', size.z.toFixed(2));

    let meshCount = 0;
    let colliderCount = 0;
    let visualCount = 0;
    let totalTriangles = 0;

    scene.traverse((child) => {
      if (child.isMesh) {
        meshCount++;
        const geo = child.geometry;
        const tris = geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3;
        totalTriangles += tris;
        if (child.name.startsWith('Collider_')) {
          colliderCount++;
        } else {
          visualCount++;
        }
      }
    });

    console.log('\n--- Object Stats ---');
    console.log('Total Meshes:', meshCount);
    console.log('Visual Meshes:', visualCount);
    console.log('Collider Meshes:', colliderCount);
    console.log('Total Triangles:', totalTriangles);
    console.log('Base Y elevation (min.y):', box.min.y.toFixed(4));
    console.log('Grounding status:', Math.abs(box.min.y) < 0.01 ? 'PERFECTLY GROUNDED (Y_min = 0.00)' : 'NON-ZERO BASE');
  },
  (err) => {
    console.error('❌ GLTFLoader parse error:', err);
    process.exit(1);
  }
);
