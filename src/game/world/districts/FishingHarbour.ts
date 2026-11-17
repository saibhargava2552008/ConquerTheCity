import * as THREE from 'three'
import type { MaterialFactory } from '../MaterialFactory'
import type { CollisionSystem } from '../../physics/CollisionSystem'
import { DistrictHelper } from './DistrictHelper'

export class FishingHarbour {
  public readonly group = new THREE.Group()

  constructor(materials: MaterialFactory, collisionSystem: CollisionSystem) {
    this.build(materials, collisionSystem)
  }

  private build(materials: MaterialFactory, collisionSystem: CollisionSystem): void {
    const woodMat = materials.getTimberWoodMaterial()
    const metalMat = materials.getColorMaterial(0x2f3640, 0.4, 0.6)
    const warehouseWallMat = materials.getStuccoMaterial('#e9d8a6', '#9b2226')
    const roofMat = materials.getColorMaterial(0x3d5a80, 0.7, 0.3)
    const barrelMat = materials.getColorMaterial(0x7f4f24, 0.8, 0.0)

    // 1. Main Pier / Wooden Wharf extending into the water (X: -42, Z: 50 to 95)
    // Deck platform at Y = 0.35m
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -38,
      0.2,
      72,
      8,
      0.4,
      44,
      woodMat,
      'Harbour_Main_Wharf'
    )

    // Secondary T-Jetty extending further West (X: -48 to -38, Z: 88)
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -46,
      0.2,
      88,
      12,
      0.4,
      6,
      woodMat,
      'Harbour_Finger_Pier_1'
    )

    // Secondary T-Jetty extending West at Z: 56
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -46,
      0.2,
      56,
      12,
      0.4,
      6,
      woodMat,
      'Harbour_Finger_Pier_2'
    )

    // Pilings / timber foundation posts under wharf
    for (let z = 52; z <= 92; z += 8) {
      for (const x of [-42, -34]) {
        const post = new THREE.Mesh(materials.cylinderGeometry, woodMat)
        post.scale.set(0.18, 2.5, 0.18)
        post.position.set(x, -0.6, z)
        this.group.add(post)
      }
    }

    // Mooring bollards along pier edges
    for (let z = 54; z <= 90; z += 9) {
      const bollard = new THREE.Mesh(materials.cylinderGeometry, metalMat)
      bollard.scale.set(0.15, 0.6, 0.15)
      bollard.position.set(-41.6, 0.55, z)
      this.group.add(bollard)
    }

    // 2. Traditional Indian Wooden Fishing Boats Moored Along the Wharf
    // Boat 1: Red & Gold ("Sea Queen") at Slip 1
    DistrictHelper.addFishingBoat(
      this.group,
      collisionSystem,
      materials,
      -48,
      -0.3,
      70,
      0.08,
      '#d90429',
      '#ffbe0b',
      'Fishing_Boat_Sea_Queen'
    )

    // Boat 2: Turquoise & White ("Matsya Star") at Finger Pier 1
    DistrictHelper.addFishingBoat(
      this.group,
      collisionSystem,
      materials,
      -48,
      -0.3,
      88,
      Math.PI / 2,
      '#0077b6',
      '#ffffff',
      'Fishing_Boat_Matsya_Star'
    )

    // Boat 3: Saffron & Emerald ("Konkan Pride") at Finger Pier 2
    DistrictHelper.addFishingBoat(
      this.group,
      collisionSystem,
      materials,
      -48,
      -0.3,
      56,
      Math.PI / 2,
      '#e76f51',
      '#2d6a4f',
      'Fishing_Boat_Konkan_Pride'
    )

    // Boat 4: Deep Navy & Yellow on shore slip
    DistrictHelper.addFishingBoat(
      this.group,
      collisionSystem,
      materials,
      -38,
      -0.3,
      98,
      -0.1,
      '#1d3557',
      '#e9c46a',
      'Fishing_Boat_Harbour_Rider'
    )

    // 3. Central Fishery Cold Storage & Processing Warehouse (X: -26, Z: 75)
    // Main warehouse building (width 16, height 6.5, depth 22)
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -24,
      3.25,
      75,
      16,
      6.5,
      22,
      warehouseWallMat,
      'Warehouse_Cold_Storage'
    )

    // Corrugated metal pitched roof
    const whRoof = new THREE.Mesh(materials.boxGeometry, roofMat)
    whRoof.scale.set(17, 0.4, 23)
    whRoof.position.set(-24, 6.7, 75)
    whRoof.rotation.z = 0.05
    whRoof.castShadow = true
    this.group.add(whRoof)

    // Raised concrete loading bay dock (X: -33, Z: 75)
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -33,
      0.6,
      75,
      4,
      1.2,
      18,
      materials.getSidewalkMaterial(),
      'Warehouse_Loading_Dock'
    )

    // 4. Props: Stacked Fish Crates & Barrels
    for (let i = 0; i < 4; i++) {
      DistrictHelper.addStaticBox(
        this.group,
        collisionSystem,
        materials,
        -37,
        0.65 + i * 0.4,
        64,
        1.2,
        0.4,
        1.2,
        materials.getCrateMaterial(),
        `Fish_Crate_Stack_1_${i}`
      )
    }

    for (let i = 0; i < 3; i++) {
      DistrictHelper.addStaticBox(
        this.group,
        collisionSystem,
        materials,
        -35,
        0.65 + i * 0.4,
        80,
        1.2,
        0.4,
        1.2,
        materials.getCrateMaterial(),
        `Fish_Crate_Stack_2_${i}`
      )
    }

    // Wooden Barrels
    for (const [bx, bz] of [[-36, 60], [-36, 61.5], [-35, 60.8]]) {
      const barrel = new THREE.Mesh(materials.cylinderGeometry, barrelMat)
      barrel.scale.set(0.4, 1.0, 0.4)
      barrel.position.set(bx, 0.9, bz)
      barrel.castShadow = true
      this.group.add(barrel)
    }

    // Traditional Fish Drying Racks (bamboo frames with netted mesh)
    const rackMat = materials.getColorMaterial(0xcdb4db, 0.8, 0.1)
    for (let r = 0; r < 3; r++) {
      const rack = new THREE.Mesh(materials.boxGeometry, rackMat)
      rack.scale.set(5.0, 0.1, 1.8)
      rack.position.set(-33, 1.2, 58 + r * 3)
      rack.castShadow = true
      this.group.add(rack)
    }
  }

  public dispose(): void {
    // Meshes and geometries handled by parent
  }
}
