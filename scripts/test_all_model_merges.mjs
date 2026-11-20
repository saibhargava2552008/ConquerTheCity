import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import fs from 'fs'
import path from 'path'

async function testAllModels() {
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
    if (hasSkinnedMesh) return { isSkinned: true }

    root.updateMatrixWorld(true)

    const matMap = new Map()

    root.traverse((child) => {
      if (child === root) return
      if (child.name && (child.name.startsWith('Collider_') || child.name === 'Colliders')) {
        return
      }

      if (child.isMesh && child.geometry) {
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        const mat = mats[0]

        if (!matMap.has(mat)) {
          matMap.set(mat, [])
        }

        const geo = child.geometry.clone()
        const relMatrix = new THREE.Matrix4()
        const rootInverse = root.matrixWorld.clone().invert()
        relMatrix.multiplyMatrices(rootInverse, child.matrixWorld)
        geo.applyMatrix4(relMatrix)

        if (!geo.attributes.normal) {
          geo.computeVertexNormals()
        }

        matMap.get(mat).push(geo)
      }
    })

    let totalIn = 0
    let totalOut = 0

    for (const [mat, geos] of matMap.entries()) {
      totalIn += geos.length
      if (geos.length === 1) {
        totalOut++
      } else {
        const firstAttrNames = Object.keys(geos[0].attributes)
        for (const g of geos) {
          for (const attr of Object.keys(g.attributes)) {
            if (!firstAttrNames.includes(attr)) {
              g.deleteAttribute(attr)
            }
          }
        }
        try {
          const merged = BufferGeometryUtils.mergeGeometries(geos, false)
          totalOut += merged ? 1 : geos.length
        } catch (e) {
          totalOut += geos.length
        }
      }
    }

    return { totalIn, totalOut, isSkinned: false }
  }

  const dir = 'public/models'
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.glb'))
  for (const f of files) {
    const scene = await loadGlb(path.join(dir, f))
    const res = optimizeHierarchy(scene)
    if (res.isSkinned) {
      console.log(`${f.padEnd(35)} : SKINNED CHARACTER (preserved)`)
    } else {
      console.log(`${f.padEnd(35)} : ${res.totalIn.toString().padStart(3)} meshes -> ${res.totalOut.toString().padStart(2)} meshes (reduction: -${res.totalIn - res.totalOut})`)
    }
  }
}

testAllModels().catch(console.error)
