import * as THREE from 'three'
import type { MaterialFactory } from '../MaterialFactory'
import type { CollisionSystem } from '../../physics/CollisionSystem'
import { DistrictHelper } from './DistrictHelper'

export class BeachDistrict {
  public readonly group = new THREE.Group()
  private oceanMesh: THREE.Mesh | null = null

  constructor(materials: MaterialFactory, collisionSystem: CollisionSystem) {
    this.build(materials, collisionSystem)
  }

  private build(materials: MaterialFactory, collisionSystem: CollisionSystem): void {
    const oceanMat = materials.getOceanMaterial()
    const sandMat = materials.getSandMaterial()
    const woodMat = materials.getTimberWoodMaterial()

    // 1. Expansive Tropical Ocean Plane (X: -160 to -50, Z: -140 to 140, Y: -0.8)
    const oceanGeo = new THREE.PlaneGeometry(160, 280, 8, 8)
    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat)
    this.oceanMesh.rotation.x = -Math.PI / 2
    this.oceanMesh.position.set(-110, -0.75, 0)
    this.oceanMesh.receiveShadow = true
    this.group.add(this.oceanMesh)

    // 2. Sandy Beach Slope (sloping from ocean line X: -58 up to promenade curb X: -22)
    const beachMesh = new THREE.Mesh(materials.boxGeometry, sandMat)
    beachMesh.scale.set(38, 0.6, 260)
    beachMesh.position.set(-40, -0.2, 0)
    beachMesh.receiveShadow = true
    this.group.add(beachMesh)

    // Beach Ground Collider
    DistrictHelper.registerBoxCollider(collisionSystem, -40, -0.2, 0, 38, 0.6, 260, 'Beach_Sand_Terrain')

    // 3. Deep Water Boundary Wall (Invisible safety collider at X: -62 to prevent falling into deep abyss)
    DistrictHelper.registerBoxCollider(collisionSystem, -62, 5, 0, 4, 14, 280, 'Ocean_Safety_Barrier')

    // 4. Wooden Beach Boardwalk / Pier access ramp
    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -36,
      0.15,
      -40,
      12,
      0.3,
      3.2,
      woodMat,
      'Beach_Boardwalk_South'
    )

    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -36,
      0.15,
      20,
      12,
      0.3,
      3.2,
      woodMat,
      'Beach_Boardwalk_North'
    )

    // 5. Coconut Palm Groves along the dunes (Leaning naturally toward the ocean)
    const palmPositions: [number, number, number, number][] = [
      [-32, -85, 8.0, 0.22],
      [-28, -70, 7.2, 0.18],
      [-35, -55, 8.5, 0.25],
      [-30, -30, 7.8, 0.20],
      [-34, -10, 8.2, 0.24],
      [-28, 5, 7.5, 0.16],
      [-33, 35, 8.0, 0.22],
      [-29, 65, 7.4, 0.18],
      [-36, 90, 8.6, 0.26],
      [-31, 110, 7.8, 0.20],
    ]

    for (let i = 0; i < palmPositions.length; i++) {
      const [px, pz, h, lean] = palmPositions[i]
      DistrictHelper.addCoconutPalm(
        this.group,
        collisionSystem,
        materials,
        px,
        pz,
        h,
        lean,
        -Math.PI / 2 + (i % 2 === 0 ? 0.2 : -0.2), // Lean toward the sea
        `Beach_Palm_${i}`
      )
    }

    // 6. Coastal Beach Shacks (Traditional thatched bamboo roof coastal cafe)
    this.buildBeachShack(materials, collisionSystem, -34, -45, 'Shack_Seaside_Cafe')
    this.buildBeachShack(materials, collisionSystem, -34, 15, 'Shack_Coconut_Grove')
  }

  private buildBeachShack(
    materials: MaterialFactory,
    collisionSystem: CollisionSystem,
    x: number,
    z: number,
    name: string
  ): void {
    const shackGroup = new THREE.Group()
    shackGroup.position.set(x, 0, z)

    const woodMat = materials.getTimberWoodMaterial()
    const thatchMat = materials.getColorMaterial(0xb38d53, 0.95, 0.0)
    const fabricMat = materials.getColorMaterial(0xe76f51, 0.8, 0.1)

    // Raised wooden timber deck
    const deck = new THREE.Mesh(materials.boxGeometry, woodMat)
    deck.scale.set(7.5, 0.4, 7.5)
    deck.position.set(0, 0.2, 0)
    deck.receiveShadow = true
    deck.castShadow = true
    shackGroup.add(deck)

    // 4 Corner timber posts
    for (const px of [-3.2, 3.2]) {
      for (const pz of [-3.2, 3.2]) {
        const post = new THREE.Mesh(materials.cylinderGeometry, woodMat)
        post.scale.set(0.12, 3.2, 0.12)
        post.position.set(px, 1.8, pz)
        post.castShadow = true
        shackGroup.add(post)
      }
    }

    // Thatched high pyramid roof
    const roof = new THREE.Mesh(materials.coneGeometry, thatchMat)
    roof.scale.set(9.0, 2.8, 9.0)
    roof.position.set(0, 4.4, 0)
    roof.rotation.y = Math.PI / 4
    roof.castShadow = true
    shackGroup.add(roof)

    // Counter & Bar Stools
    const counter = new THREE.Mesh(materials.boxGeometry, woodMat)
    counter.scale.set(4.0, 1.1, 1.2)
    counter.position.set(0, 0.75, 1.8)
    counter.castShadow = true
    shackGroup.add(counter)

    // Sunbeds / Loungers outside shack
    for (const lx of [-2.4, 2.4]) {
      const lounger = new THREE.Mesh(materials.boxGeometry, fabricMat)
      lounger.scale.set(1.1, 0.25, 2.4)
      lounger.position.set(lx, 0.4, -2.4)
      lounger.castShadow = true
      shackGroup.add(lounger)
    }

    this.group.add(shackGroup)

    DistrictHelper.registerBoxCollider(collisionSystem, x, 2.2, z, 7.8, 4.4, 7.8, name)
  }

  public updateWater(dt: number): void {
    if (this.oceanMesh && this.oceanMesh.material instanceof THREE.MeshStandardMaterial) {
      if (this.oceanMesh.material.map) {
        this.oceanMesh.material.map.offset.x = (this.oceanMesh.material.map.offset.x + dt * 0.015) % 1
        this.oceanMesh.material.map.offset.y = (this.oceanMesh.material.map.offset.y + dt * 0.02) % 1
      }
    }
  }

  public dispose(): void {
    if (this.oceanMesh) {
      this.oceanMesh.geometry.dispose()
      this.oceanMesh = null
    }
  }
}
