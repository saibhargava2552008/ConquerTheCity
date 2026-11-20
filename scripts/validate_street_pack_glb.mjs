import fs from 'fs'
import path from 'path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Mock browser globals for Three.js GLTFLoader in Node environment
global.THREE = THREE
global.window = global
global.document = {
  createElement: () => ({ setAttribute: () => {}, getAttribute: () => null })
}

const MODELS = [
  'prop_indian_scooter_01',
  'prop_delivery_bicycle_01',
  'prop_market_drainage_01',
  'prop_municipal_waste_bins_01',
  'prop_terracotta_planter_01',
  'prop_vendor_sign_01',
  'prop_electrical_feeder_01',
  'prop_market_street_pack_01',
]

const MODELS_DIR = path.resolve('public/models')

async function validateGLB(filename) {
  const filePath = path.join(MODELS_DIR, `${filename}.glb`)
  const stats = fs.statSync(filePath)
  const buffer = fs.readFileSync(filePath)
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

  const loader = new GLTFLoader()
  return new Promise((resolve, reject) => {
    loader.parse(
      arrayBuffer,
      '',
      (gltf) => {
        let triCount = 0
        let meshCount = 0
        const materials = new Set()
        let hasColliders = false

        gltf.scene.traverse((child) => {
          if (child.name.startsWith('Collider_') || child.name === 'Colliders') {
            hasColliders = true
          }
          if (child.isMesh) {
            meshCount++
            const geom = child.geometry
            if (geom.index) {
              triCount += geom.index.count / 3
            } else if (geom.attributes.position) {
              triCount += geom.attributes.position.count / 3
            }
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => materials.add(m.name || m.uuid))
            } else if (child.material) {
              materials.add(child.material.name || child.material.uuid)
            }
          }
        })

        const bbox = new THREE.Box3().setFromObject(gltf.scene)
        const size = new THREE.Vector3()
        bbox.getSize(size)

        resolve({
          name: filename,
          sizeKb: (stats.size / 1024).toFixed(2),
          triCount,
          meshCount,
          materialCount: materials.size,
          hasColliders,
          dimensions: `${size.x.toFixed(2)}m x ${size.y.toFixed(2)}m x ${size.z.toFixed(2)}m`,
        })
      },
      (err) => reject(err)
    )
  })
}

async function run() {
  console.log('===========================================================')
  console.log('=== VALIDATING STREET ENVIRONMENT PACK GLBS (THREE.JS) ===')
  console.log('===========================================================\n')

  const results = []
  for (const m of MODELS) {
    try {
      const res = await validateGLB(m)
      results.push(res)
      console.log(`[PASS] ${res.name}.glb`)
      console.log(`       Size: ${res.sizeKb} KB | Tris: ${res.triCount} | Meshes: ${res.meshCount} | Mats: ${res.materialCount} | Dim: ${res.dimensions} | Collider: ${res.hasColliders ? 'YES' : 'NO'}`)
    } catch (e) {
      console.error(`[FAIL] ${m}.glb:`, e)
      process.exit(1)
    }
  }

  console.log('\nAll 8 GLBs successfully parsed by Three.js GLTFLoader!')
}

run()
