import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import fs from 'fs'

// Node environment mock for GLTFLoader
class MockFileReader {
  readAsArrayBuffer(blob) {
    this.result = blob
    if (this.onload) this.onload()
  }
}

async function testMerge() {
  console.log('Testing geometry merger for static GLBs...')

  const loader = new GLTFLoader()

  async function loadGlb(filePath) {
    const data = fs.readFileSync(filePath)
    const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
    return new Promise((resolve, reject) => {
      loader.parse(
        arrayBuffer,
        '',
        (gltf) => resolve(gltf.scene),
        (err) => reject(err)
      )
    })
  }

  function optimizeHierarchy(root) {
    let hasSkinnedMesh = false
    root.traverse((c) => {
      if (c.isSkinnedMesh) hasSkinnedMesh = true
    })
    if (hasSkinnedMesh) return root

    root.updateMatrixWorld(true)

    const matMap = new Map()
    const nonMeshChildren = []

    // Collect meshes
    root.traverse((child) => {
      if (child === root) return
      if (child.name && (child.name.startsWith('Collider_') || child.name === 'Colliders')) {
        child.visible = false
        nonMeshChildren.push(child)
        return
      }

      if (child.isMesh && child.geometry) {
        // Material could be single or array
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        const mat = mats[0] // GLTF standard

        if (!matMap.has(mat)) {
          matMap.set(mat, [])
        }

        const geo = child.geometry.clone()
        // Compute matrix relative to root
        const relMatrix = new THREE.Matrix4()
        const rootInverse = root.matrixWorld.clone().invert()
        relMatrix.multiplyMatrices(rootInverse, child.matrixWorld)
        geo.applyMatrix4(relMatrix)

        // Ensure normal attribute exists
        if (!geo.attributes.normal) {
          geo.computeVertexNormals()
        }

        matMap.get(mat).push({
          geometry: geo,
          castShadow: child.castShadow !== false,
          receiveShadow: child.receiveShadow !== false,
          name: child.name,
        })
      } else if (!child.isMesh) {
        // Keep non-mesh nodes if needed (lights, empties)
        if (child.children.length === 0 || child.name.includes('Pivot')) {
          nonMeshChildren.push(child)
        }
      }
    })

    const optimized = new THREE.Group()
    optimized.name = root.name ? `${root.name}_Optimized` : 'OptimizedGroup'

    let totalIn = 0
    let totalOut = 0

    for (const [mat, items] of matMap.entries()) {
      totalIn += items.length
      if (items.length === 1) {
        const m = new THREE.Mesh(items[0].geometry, mat)
        m.name = items[0].name
        m.castShadow = items[0].castShadow
        m.receiveShadow = items[0].receiveShadow
        optimized.add(m)
        totalOut++
      } else {
        const geos = items.map(it => it.geometry)
        // Clean attributes: ensure all geometries have the exact same attributes before merging
        const firstAttrNames = Object.keys(geos[0].attributes)
        for (const g of geos) {
          for (const attr of Object.keys(g.attributes)) {
            if (!firstAttrNames.includes(attr)) {
              g.deleteAttribute(attr)
            }
          }
          for (const required of firstAttrNames) {
            if (!g.attributes[required]) {
              // Missing attribute, skip strict merge for safety
            }
          }
        }

        try {
          const merged = BufferGeometryUtils.mergeGeometries(geos, false)
          if (merged) {
            const m = new THREE.Mesh(merged, mat)
            m.castShadow = items.some(it => it.castShadow)
            m.receiveShadow = items.some(it => it.receiveShadow)
            optimized.add(m)
            totalOut++
          } else {
            for (const it of items) {
              const m = new THREE.Mesh(it.geometry, mat)
              optimized.add(m)
              totalOut++
            }
          }
        } catch (e) {
          console.warn('Merge failed for material, keeping separate:', e.message)
          for (const it of items) {
            optimized.add(new THREE.Mesh(it.geometry, mat))
            totalOut++
          }
        }
      }
    }

    for (const nonMesh of nonMeshChildren) {
      optimized.add(nonMesh)
    }

    return { optimized, totalIn, totalOut }
  }

  const testFiles = [
    'public/models/tree_coconut_palm.glb',
    'public/models/coastal_residence.glb',
    'public/models/prop_coastal_streetlamp.glb',
    'public/models/prop_promenade_bench.glb',
    'public/models/prop_market_drainage_01.glb',
  ]

  for (const f of testFiles) {
    const scene = await loadGlb(f)
    const res = optimizeHierarchy(scene)
    console.log(`Model ${f}: ${res.totalIn} meshes -> ${res.totalOut} meshes (reduction: -${res.totalIn - res.totalOut})`)
  }
}

testMerge().catch(console.error)
