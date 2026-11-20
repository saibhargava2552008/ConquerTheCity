import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import fs from 'fs'

// Helper to optimize a static model hierarchy by merging meshes with identical materials
function optimizeStaticModel(root) {
  // If model contains bones/skinning, do not merge via static BufferGeometryUtils
  let hasSkinnedMesh = false
  root.traverse((obj) => {
    if (obj.isSkinnedMesh) hasSkinnedMesh = true
  })
  if (hasSkinnedMesh) return root

  // Update world matrices within root's local space
  root.updateMatrixWorld(true)

  // Map: material -> array of transformed geometries
  const materialMeshMap = new Map()
  const preserveNodes = []

  root.traverse((child) => {
    if (child === root) return
    if (child.name && (child.name.startsWith('Collider_') || child.name === 'Colliders')) {
      child.visible = false
      return
    }

    if (child.isMesh) {
      const mat = child.material
      if (!materialMeshMap.has(mat)) {
        materialMeshMap.set(mat, [])
      }

      // Clone geometry and apply child's local transformation relative to root
      const geo = child.geometry.clone()
      geo.applyMatrix4(child.matrixWorld)
      materialMeshMap.get(mat).push({
        geometry: geo,
        castShadow: child.castShadow,
        receiveShadow: child.receiveShadow,
      })
    }
  })

  // Create optimized root group
  const optimizedGroup = new THREE.Group()
  optimizedGroup.name = root.name ? `${root.name}_Optimized` : 'OptimizedGroup'

  for (const [mat, geoList] of materialMeshMap.entries()) {
    if (geoList.length === 1) {
      const singleMesh = new THREE.Mesh(geoList[0].geometry, mat)
      singleMesh.castShadow = geoList[0].castShadow
      singleMesh.receiveShadow = geoList[0].receiveShadow
      optimizedGroup.add(singleMesh)
    } else {
      const geometries = geoList.map(g => g.geometry)
      try {
        const mergedGeo = BufferGeometryUtils.mergeGeometries(geometries, false)
        if (mergedGeo) {
          const mergedMesh = new THREE.Mesh(mergedGeo, mat)
          mergedMesh.castShadow = geoList.some(g => g.castShadow)
          mergedMesh.receiveShadow = geoList.some(g => g.receiveShadow)
          optimizedGroup.add(mergedMesh)
        } else {
          // Fallback if merge fails (e.g. differing vertex attributes)
          for (const item of geoList) {
            optimizedGroup.add(new THREE.Mesh(item.geometry, mat))
          }
        }
      } catch (err) {
        // Fallback
        for (const item of geoList) {
          optimizedGroup.add(new THREE.Mesh(item.geometry, mat))
        }
      }
    }
  }

  return optimizedGroup
}

console.log('Testing optimization algorithm on sample models...')
