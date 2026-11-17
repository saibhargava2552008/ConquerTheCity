import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

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
          const scene = gltf.scene

          // Configure PBR shadows and material settings
          scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true
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
   * Clones a cached model with fresh transformation hierarchy and shared PBR materials
   */
  public getClone(id: AssetId): THREE.Group | null {
    const original = this.cache.get(id)
    if (!original) return null

    const clone = original.clone(true)
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
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
