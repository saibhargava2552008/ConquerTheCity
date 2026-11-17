import * as THREE from 'three'
import type { MaterialFactory } from './MaterialFactory'
import type { CollisionSystem } from '../physics/CollisionSystem'
import { BeachDistrict } from './districts/BeachDistrict'
import { FishingHarbour } from './districts/FishingHarbour'
import { MarketDistrict } from './districts/MarketDistrict'
import { ResidentialDistrict } from './districts/ResidentialDistrict'
import { TownCentre } from './districts/TownCentre'
import { RoadNetwork } from './districts/RoadNetwork'
import { CountrysideEdge } from './districts/CountrysideEdge'
import { DistrictHelper } from './districts/DistrictHelper'

/**
 * Seaview Town — Milestone M2 Explorable Coastal City
 * Manages modular district generation, animated ocean waves, rotating lighthouse beacon,
 * and comprehensive spatial colliders.
 */
export class SeaviewTown {
  public readonly group = new THREE.Group()

  // 7 Explorable Districts
  public readonly beachDistrict: BeachDistrict
  public readonly fishingHarbour: FishingHarbour
  public readonly marketDistrict: MarketDistrict
  public readonly residentialDistrict: ResidentialDistrict
  public readonly townCentre: TownCentre
  public readonly roadNetwork: RoadNetwork
  public readonly countrysideEdge: CountrysideEdge

  private scene: THREE.Scene
  private materials: MaterialFactory
  private collisionSystem: CollisionSystem
  private baseGroundMesh: THREE.Mesh | null = null

  constructor(scene: THREE.Scene, materials: MaterialFactory, collisionSystem: CollisionSystem) {
    this.scene = scene
    this.materials = materials
    this.collisionSystem = collisionSystem

    // 1. Build Base Ground Terrain
    this.buildBaseTerrain()

    // 2. Instantiate and mount all 7 Districts
    this.beachDistrict = new BeachDistrict(materials, collisionSystem)
    this.group.add(this.beachDistrict.group)

    this.fishingHarbour = new FishingHarbour(materials, collisionSystem)
    this.group.add(this.fishingHarbour.group)

    this.marketDistrict = new MarketDistrict(materials, collisionSystem)
    this.group.add(this.marketDistrict.group)

    this.residentialDistrict = new ResidentialDistrict(materials, collisionSystem)
    this.group.add(this.residentialDistrict.group)

    this.townCentre = new TownCentre(materials, collisionSystem)
    this.group.add(this.townCentre.group)

    this.roadNetwork = new RoadNetwork(materials, collisionSystem)
    this.group.add(this.roadNetwork.group)

    this.countrysideEdge = new CountrysideEdge(materials, collisionSystem)
    this.group.add(this.countrysideEdge.group)

    // 3. Mount master town group to Three.js scene
    this.scene.add(this.group)
  }

  private buildBaseTerrain(): void {
    const grassMat = this.materials.getParkMaterial()

    // Town core ground plane (X: -24 to 90, Z: -120 to 120, Y: -0.1)
    const width = 114
    const depth = 240
    this.baseGroundMesh = new THREE.Mesh(this.materials.boxGeometry, grassMat)
    this.baseGroundMesh.scale.set(width, 0.2, depth)
    this.baseGroundMesh.position.set(33, -0.1, 0)
    this.baseGroundMesh.receiveShadow = true
    this.group.add(this.baseGroundMesh)

    // Base ground collider (level ground at Y = 0)
    DistrictHelper.registerBoxCollider(
      this.collisionSystem,
      33,
      -0.1,
      0,
      width,
      0.2,
      depth,
      'Town_Base_Ground_Collider'
    )
  }

  /**
   * Continuous environmental simulation (ocean wave drift, revolving lighthouse beacon)
   */
  public update(dt: number): void {
    this.beachDistrict.updateWater(dt)
    this.townCentre.updateBeacon(dt)
  }

  public dispose(): void {
    this.beachDistrict.dispose()
    this.fishingHarbour.dispose()
    this.marketDistrict.dispose()
    this.residentialDistrict.dispose()
    this.townCentre.dispose()
    this.roadNetwork.dispose()
    this.countrysideEdge.dispose()

    if (this.baseGroundMesh) {
      this.group.remove(this.baseGroundMesh)
      this.baseGroundMesh = null
    }

    this.scene.remove(this.group)
  }
}
