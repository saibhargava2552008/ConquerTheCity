import * as THREE from 'three'
import type { MaterialFactory } from '../MaterialFactory'
import type { CollisionSystem } from '../../physics/CollisionSystem'
import { DistrictHelper } from './DistrictHelper'

export class CountrysideEdge {
  public readonly group = new THREE.Group()

  constructor(materials: MaterialFactory, collisionSystem: CollisionSystem) {
    this.build(materials, collisionSystem)
  }

  private build(materials: MaterialFactory, collisionSystem: CollisionSystem): void {
    const grassMat = materials.getParkMaterial()
    const roadMat = materials.getRoadMaterial()
    const outpostMat = materials.getStuccoMaterial('#e9c46a', '#264653')
    const roofMat = materials.getTerracottaRoofMaterial()
    const signMat = materials.getColorMaterial(0x2a9d8f, 0.4, 0.2)
    const barrierMat = materials.getColorMaterial(0xe76f51, 0.5, 0.3)
    const hillMat = materials.getColorMaterial(0x2d6a4f, 0.9, 0.0)

    // 1. Open Countryside Terrain (X: 85 to 130, Z: -120 to 120)
    const terrain = new THREE.Mesh(materials.boxGeometry, grassMat)
    terrain.scale.set(45, 0.4, 240)
    terrain.position.set(107.5, -0.1, 0)
    terrain.receiveShadow = true
    this.group.add(terrain)

    // 2. Coastal Highway Extension Exiting Town (X: 85 to 130, Z: 0)
    const highway = new THREE.Mesh(materials.boxGeometry, roadMat)
    highway.scale.set(45, 0.06, 12)
    highway.position.set(107.5, 0.03, 0)
    highway.receiveShadow = true
    this.group.add(highway)

    // 3. Highway Border Outpost & Toll Booth (X: 95, Z: 0)
    // Checkpoint cabin building (North side of highway at Z: 9)
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      95,
      2.0,
      9,
      6.0,
      4.0,
      4.5,
      outpostMat,
      'Outpost_Checkpoint_Cabin'
    )

    // Overhanging canopy over the highway
    const tollRoof = new THREE.Mesh(materials.boxGeometry, roofMat)
    tollRoof.scale.set(8.5, 0.4, 16.0)
    tollRoof.position.set(95, 4.4, 0)
    tollRoof.castShadow = true
    this.group.add(tollRoof)

    // Highway support pillars
    for (const sz of [-7, 0, 7]) {
      const pillar = new THREE.Mesh(materials.cylinderGeometry, barrierMat)
      pillar.scale.set(0.18, 4.2, 0.18)
      pillar.position.set(95, 2.1, sz)
      pillar.castShadow = true
      this.group.add(pillar)
      DistrictHelper.registerBoxCollider(
        collisionSystem,
        95,
        2.1,
        sz,
        0.5,
        4.2,
        0.5,
        `Toll_Pillar_${sz}`
      )
    }

    // Directional Highway Signboard ("VARDHAN CITY -> 42 KM | SEAVIEW TOWN")
    const signBoard = new THREE.Mesh(materials.boxGeometry, signMat)
    signBoard.scale.set(0.2, 1.8, 6.0)
    signBoard.position.set(95, 5.5, 0)
    this.group.add(signBoard)

    // 4. Undulating Green Coastal Hills / Perimeter Natural Barrier (East perimeter X: 125)
    // East perimeter hill ridge
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      126,
      5.0,
      0,
      12.0,
      10.0,
      240,
      hillMat,
      'Perimeter_East_Ridge'
    )

    // North perimeter hill ridge (Z: 118)
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      45,
      5.0,
      118,
      170,
      10.0,
      12.0,
      hillMat,
      'Perimeter_North_Ridge'
    )

    // South perimeter hill ridge (Z: -118)
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      45,
      5.0,
      -118,
      170,
      10.0,
      12.0,
      hillMat,
      'Perimeter_South_Ridge'
    )

    // Highway Outpost barrier arm (at X: 115 across road)
    DistrictHelper.registerBoxCollider(
      collisionSystem,
      115,
      3.0,
      0,
      2.0,
      6.0,
      14.0,
      'Highway_End_Boundary'
    )

    // 5. Dense Coconut Palm Groves in Countryside
    const palmCoordinates = [
      [90, 30],
      [95, 45],
      [105, 25],
      [112, 40],
      [115, 60],
      [102, 75],
      [92, -30],
      [98, -45],
      [108, -25],
      [114, -40],
      [116, -65],
      [104, -80],
    ]

    for (let i = 0; i < palmCoordinates.length; i++) {
      const [px, pz] = palmCoordinates[i]
      DistrictHelper.addCoconutPalm(
        this.group,
        collisionSystem,
        materials,
        px,
        pz,
        8.0 + (i % 3) * 0.5,
        0.14,
        (i * 0.9) % (Math.PI * 2),
        `Countryside_Palm_${i}`
      )
    }
  }

  public dispose(): void {
    // Handled by parent
  }
}
