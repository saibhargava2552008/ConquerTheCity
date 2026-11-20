import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type AssetId =
  | 'building_coastal_arcade'
  | 'building_heritage_villa'
  | 'landmark_seaview_lighthouse'
  | 'tree_coconut_palm'
  | 'prop_auto_rickshaw'
  | 'prop_coastal_streetlamp'
  | 'prop_promenade_bench'
  | 'prop_utility_pole'
  | 'prop_coastal_boat'
  | 'coastal_residence'
  | 'building_commercial_arcade_01'
  | 'building_shop_cluster_01'
  | 'prop_indian_scooter_01'
  | 'prop_delivery_bicycle_01'
  | 'prop_market_drainage_01'
  | 'prop_municipal_waste_bins_01'
  | 'prop_terracotta_planter_01'
  | 'prop_vendor_sign_01'
  | 'prop_electrical_feeder_01'
  | 'prop_market_street_pack_01'
  | 'prop_indian_dhoni_boat_01'
  | 'building_fishery_cold_storage_01'
  | 'building_fish_auction_pavilion_01'
  | 'building_fishermen_cooperative_01'

export const ASSET_URLS: Record<AssetId, string> = {
  building_coastal_arcade: '/models/building_coastal_arcade.glb',
  building_heritage_villa: '/models/building_heritage_villa.glb',
  landmark_seaview_lighthouse: '/models/landmark_seaview_lighthouse.glb',
  tree_coconut_palm: '/models/tree_coconut_palm.glb',
  prop_auto_rickshaw: '/models/prop_auto_rickshaw.glb',
  prop_coastal_streetlamp: '/models/prop_coastal_streetlamp.glb',
  prop_promenade_bench: '/models/prop_promenade_bench.glb',
  prop_utility_pole: '/models/prop_utility_pole.glb',
  prop_coastal_boat: '/models/prop_coastal_boat.glb',
  coastal_residence: '/models/coastal_residence.glb',
  building_commercial_arcade_01: '/models/building_commercial_arcade_01.glb',
  building_shop_cluster_01: '/models/building_shop_cluster_01.glb',
  prop_indian_scooter_01: '/models/prop_indian_scooter_01.glb',
  prop_delivery_bicycle_01: '/models/prop_delivery_bicycle_01.glb',
  prop_market_drainage_01: '/models/prop_market_drainage_01.glb',
  prop_municipal_waste_bins_01: '/models/prop_municipal_waste_bins_01.glb',
  prop_terracotta_planter_01: '/models/prop_terracotta_planter_01.glb',
  prop_vendor_sign_01: '/models/prop_vendor_sign_01.glb',
  prop_electrical_feeder_01: '/models/prop_electrical_feeder_01.glb',
  prop_market_street_pack_01: '/models/prop_market_street_pack_01.glb',
  prop_indian_dhoni_boat_01: '/models/prop_indian_dhoni_boat_01.glb',
  building_fishery_cold_storage_01: '/models/building_fishery_cold_storage_01.glb',
  building_fish_auction_pavilion_01: '/models/building_fish_auction_pavilion_01.glb',
  building_fishermen_cooperative_01: '/models/building_fishermen_cooperative_01.glb',
}

/**
 * AssetLoader & Cache Manager for High-Quality GLB World Models.
 * Loads 3D assets asynchronously, optimizes meshes for shadows & PBR rendering,
 * and provisions instant clones for building districts.
 */
export class AssetLoader {
  private static instance: AssetLoader | null = null

  private cache = new Map<AssetId, THREE.Group>()
  private loadingPromises = new Map<AssetId, Promise<THREE.Group | null>>()
  private loader: GLTFLoader | null = null

  private constructor() {
    if (this.isBrowserEnvironment()) {
      this.loader = new GLTFLoader()
    }
  }

  public static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader()
    }
    return AssetLoader.instance
  }

  private isBrowserEnvironment(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.location !== 'undefined' &&
      typeof window.location.origin === 'string' &&
      window.location.origin.startsWith('http')
    )
  }

  /**
   * Preload all world assets concurrently
   */
  public async preloadAll(): Promise<void> {
    if (!this.isBrowserEnvironment()) return
    const ids = Object.keys(ASSET_URLS) as AssetId[]
    await Promise.all(ids.map(id => this.loadAsset(id)))
  }

  /**
   * Loads a single asset or retrieves it from cache
   */
  public loadAsset(id: AssetId): Promise<THREE.Group | null> {
    if (this.cache.has(id)) {
      return Promise.resolve(this.getClone(id))
    }

    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!.then(() => this.getClone(id))
    }

    if (!this.loader) {
      return Promise.resolve(null)
    }

    const url = ASSET_URLS[id]
    const promise = new Promise<THREE.Group | null>((resolve) => {
      this.loader!.load(
        url,
        (gltf: GLTF) => {
          let scene = gltf.scene

          // 1. Optimize static model geometry by merging meshes with identical materials
          scene = this.optimizeStaticModel(scene, id)

          // 2. Configure PBR shadows and material settings
          const isShadowExcluded = id === 'prop_market_drainage_01'
          scene.traverse((child) => {
            if (child.name.startsWith('Collider_') || child.name === 'Colliders') {
              child.visible = false
            } else if (child instanceof THREE.Mesh) {
              child.castShadow = !isShadowExcluded
              child.receiveShadow = true
            }
          })

          this.cache.set(id, scene)
          resolve(this.getClone(id))
        },
        undefined,
        (err) => {
          console.warn(`[AssetLoader] Failed to load ${id} from ${url}:`, err)
          resolve(null)
        }
      )
    })

    this.loadingPromises.set(id, promise)
    return promise
  }

  /**
   * Consolidates static meshes sharing identical materials to minimize WebGL draw calls
   */
  private optimizeStaticModel(root: THREE.Group, id: AssetId): THREE.Group {
    let hasSkinnedMesh = false
    root.traverse((obj) => {
      if ((obj as THREE.SkinnedMesh).isSkinnedMesh) hasSkinnedMesh = true
    })
    if (hasSkinnedMesh) return root

    root.updateMatrixWorld(true)

    const matMap = new Map<
      THREE.Material,
      {
        geometry: THREE.BufferGeometry
        castShadow: boolean
        receiveShadow: boolean
        name: string
      }[]
    >()
    const preservedNodes: THREE.Object3D[] = []
    const rootInverse = root.matrixWorld.clone().invert()

    root.traverse((child) => {
      if (child === root) return

      if (child.name && (child.name.startsWith('Collider_') || child.name === 'Colliders')) {
        child.visible = false
        preservedNodes.push(child)
        return
      }

      if (child instanceof THREE.Mesh && child.geometry) {
        const mat = Array.isArray(child.material) ? child.material[0] : child.material
        if (!mat) return

        if (!matMap.has(mat)) {
          matMap.set(mat, [])
        }

        const geo = child.geometry.clone()
        const relMatrix = new THREE.Matrix4()
        relMatrix.multiplyMatrices(rootInverse, child.matrixWorld)
        geo.applyMatrix4(relMatrix)

        if (!geo.attributes.normal) {
          geo.computeVertexNormals()
        }

        matMap.get(mat)!.push({
          geometry: geo,
          castShadow: child.castShadow,
          receiveShadow: child.receiveShadow,
          name: child.name,
        })
      } else if (!(child instanceof THREE.Mesh) && child.children.length === 0) {
        preservedNodes.push(child)
      }
    })

    if (matMap.size === 0) return root

    const optimizedGroup = new THREE.Group()
    optimizedGroup.name = root.name ? `${root.name}_Optimized` : `${id}_Optimized`
    const isShadowExcluded = id === 'prop_market_drainage_01'

    for (const [mat, items] of matMap.entries()) {
      if (items.length === 1) {
        const singleMesh = new THREE.Mesh(items[0].geometry, mat)
        singleMesh.name = items[0].name
        singleMesh.castShadow = !isShadowExcluded && items[0].castShadow !== false
        singleMesh.receiveShadow = items[0].receiveShadow !== false
        optimizedGroup.add(singleMesh)
      } else {
        const geos = items.map((it) => it.geometry)
        // Keep only attributes present across ALL geometries in geos to guarantee successful merge
        const commonAttrs = Object.keys(geos[0].attributes).filter((attr) =>
          geos.every((g) => g.attributes[attr] !== undefined)
        )
        for (const g of geos) {
          for (const attr of Object.keys(g.attributes)) {
            if (!commonAttrs.includes(attr)) {
              g.deleteAttribute(attr)
            }
          }
        }

        try {
          const merged = BufferGeometryUtils.mergeGeometries(geos, false)
          if (merged) {
            const mergedMesh = new THREE.Mesh(merged, mat)
            mergedMesh.name = `${id}_Merged_${mat.id}`
            mergedMesh.castShadow = !isShadowExcluded && items.some((it) => it.castShadow !== false)
            mergedMesh.receiveShadow = items.some((it) => it.receiveShadow !== false)
            optimizedGroup.add(mergedMesh)
          } else {
            for (const item of items) {
              const fallbackMesh = new THREE.Mesh(item.geometry, mat)
              fallbackMesh.name = item.name
              fallbackMesh.castShadow = !isShadowExcluded && item.castShadow !== false
              fallbackMesh.receiveShadow = item.receiveShadow !== false
              optimizedGroup.add(fallbackMesh)
            }
          }
        } catch {
          for (const item of items) {
            const fallbackMesh = new THREE.Mesh(item.geometry, mat)
            fallbackMesh.name = item.name
            fallbackMesh.castShadow = !isShadowExcluded && item.castShadow !== false
            fallbackMesh.receiveShadow = item.receiveShadow !== false
            optimizedGroup.add(fallbackMesh)
          }
        }
      }
    }

    for (const node of preservedNodes) {
      optimizedGroup.add(node)
    }

    return optimizedGroup
  }

  /**
   * Clones a cached model with fresh transformation hierarchy and shared PBR materials
   */
  public getClone(id: AssetId): THREE.Group | null {
    const original = this.cache.get(id)
    if (!original) return null

    const clone = original.clone(true)
    const isShadowExcluded = id === 'prop_market_drainage_01'
    clone.traverse((child) => {
      if (child.name.startsWith('Collider_') || child.name === 'Colliders') {
        child.visible = false
      } else if (child instanceof THREE.Mesh) {
        child.castShadow = !isShadowExcluded
        child.receiveShadow = true
      }
    })
    return clone
  }

  /**
   * Instantiates a model at the given position and orientation.
   * If already loaded, mounts immediately. If loading asynchronously, mounts once ready.
   * Returns the anchor group which is immediately added to parent.
   */
  public instantiate(
    id: AssetId,
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    scale = 1,
    onLoaded?: (model: THREE.Group) => void
  ): THREE.Group {
    const anchor = new THREE.Group()
    anchor.position.set(x, y, z)
    if (rotY !== 0) {
      anchor.rotation.y = rotY
    }
    if (scale !== 1) {
      anchor.scale.set(scale, scale, scale)
    }
    parent.add(anchor)

    const immediate = this.getClone(id)
    if (immediate) {
      anchor.add(immediate)
      if (onLoaded) onLoaded(immediate)
    } else if (this.isBrowserEnvironment()) {
      this.loadAsset(id).then((model) => {
        if (model) {
          anchor.add(model)
          if (onLoaded) onLoaded(model)
        }
      })
    }

    return anchor
  }
}
