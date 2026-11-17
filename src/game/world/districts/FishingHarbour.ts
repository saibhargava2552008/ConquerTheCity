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
    // Floating at water level (y = -0.9m so deck top is flush with wharf at Y = 0.4m)
    // Boat 1: Red & Gold ("Sea Queen") at Slip 1
    DistrictHelper.addFishingBoat(
      this.group,
      collisionSystem,
      materials,
      -48,
      -0.9,
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
      -0.9,
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
      -0.9,
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
      -0.9,
      98,
      -0.1,
      '#1d3557',
      '#e9c46a',
      'Fishing_Boat_Harbour_Rider'
    )

    // Gangway ramps connecting wharf to moored fishing boats
    // Gangway to Boat 1 ("Sea Queen") open forward deck at Z: 72
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -44.5,
      0.35,
      72,
      5.0,
      0.15,
      1.8,
      woodMat,
      'Fishing_Boat_Gangway_1'
    )

    // Gangway to Boat 2 ("Matsya Star") at Z: 88
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -48,
      0.35,
      85,
      1.8,
      0.15,
      4.0,
      woodMat,
      'Fishing_Boat_Gangway_2'
    )

    // Gangway to Boat 3 ("Konkan Pride") at Z: 56
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -48,
      0.35,
      59,
      1.8,
      0.15,
      4.0,
      woodMat,
      'Fishing_Boat_Gangway_3'
    )

    // 3. Central Fishery Cold Storage & Processing Warehouse (X: -24, Z: 75)
    // Walkable Interior Concrete Floor (height: 1.2m matching loading dock)
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -24,
      0.6,
      75,
      14,
      1.2,
      20,
      materials.getSidewalkMaterial(),
      'Warehouse_Interior_Floor'
    )

    // North Wall (Z: 85.5)
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -24,
      3.85,
      85.5,
      16,
      5.3,
      1.0,
      warehouseWallMat,
      'Warehouse_Wall_North'
    )

    // South Wall (Z: 64.5)
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -24,
      3.85,
      64.5,
      16,
      5.3,
      1.0,
      warehouseWallMat,
      'Warehouse_Wall_South'
    )

    // East Wall (X: -15.5)
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -15.5,
      3.85,
      75,
      1.0,
      5.3,
      22,
      warehouseWallMat,
      'Warehouse_Wall_East'
    )

    // West Front Wall with Accessible Loading Bay Door Opening (Z: 72 to 78 open)
    // West Wall South Wing (Z: 64.5 to 72)
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -31.5,
      3.85,
      68.25,
      1.0,
      5.3,
      7.5,
      warehouseWallMat,
      'Warehouse_Wall_West_South'
    )

    // West Wall North Wing (Z: 78 to 85.5)
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -31.5,
      3.85,
      81.75,
      1.0,
      5.3,
      7.5,
      warehouseWallMat,
      'Warehouse_Wall_West_North'
    )

    // West Wall Doorway Header (above Z: 72 to 78, Y: 4.8 to 6.5)
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -31.5,
      5.65,
      75,
      1.0,
      1.7,
      6.0,
      warehouseWallMat,
      'Warehouse_Door_Header'
    )

    // Corrugated metal pitched roof
    const whRoof = new THREE.Mesh(materials.boxGeometry, roofMat)
    whRoof.scale.set(17, 0.4, 23)
    whRoof.position.set(-24, 6.7, 75)
    whRoof.rotation.z = 0.05
    whRoof.castShadow = true
    this.group.add(whRoof)

    // Raised concrete loading bay dock (X: -33, Z: 75, height: 1.2m)
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -33,
      0.6,
      75,
      2.0,
      1.2,
      18,
      materials.getSidewalkMaterial(),
      'Warehouse_Loading_Dock'
    )

    // Accessible stairs from Wharf (Y = 0.4m) up to Loading Dock (Y = 1.2m):
    // South Loading Bay Stairs (4 steps, 0.2m rise each)
    DistrictHelper.addStairs(
      this.group,
      collisionSystem,
      materials,
      -33,
      0.4,
      66.0,
      2.0,
      0.8,
      3.5,
      4,
      'Z+',
      materials.getSidewalkMaterial(),
      'Warehouse_Dock_Stairs_South'
    )

    // North Loading Bay Stairs (4 steps, 0.2m rise each)
    DistrictHelper.addStairs(
      this.group,
      collisionSystem,
      materials,
      -33,
      0.4,
      84.0,
      2.0,
      0.8,
      3.5,
      4,
      'Z-',
      materials.getSidewalkMaterial(),
      'Warehouse_Dock_Stairs_North'
    )

    // 4. Props: Stacked Fish Crates & Barrels (positioned neatly against dock retaining walls)
    for (let i = 0; i < 4; i++) {
      DistrictHelper.addStaticBox(
        this.group,
        collisionSystem,
        materials,
        -34.8,
        0.65 + i * 0.4,
        60,
        1.0,
        0.4,
        1.0,
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
