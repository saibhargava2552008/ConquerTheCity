import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
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

    // 4. Coastal Breakwater Rip-Rap Groyne (South of Harbour Road, Z: 41.0 to 43.5, X: -24 to -46)
    this.buildBreakwaterGroyne(materials, collisionSystem)

    // 4. Accessible Wooden Beach Boardwalks & Stairways connecting Promenade to the Sand
    // 4a. Central Grand Beach Stairway (at Z: 0, 10m wide gentle stairs down from Promenade curb)
    DistrictHelper.addStairs(
      this.group,
      collisionSystem,
      materials,
      -23.5,
      0.0,
      0,
      10.0,
      0.25,
      7.0,
      2,
      'X-',
      woodMat,
      'Beach_Grand_Stairs_Central'
    )

    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -32.5,
      0.075,
      0,
      5.0,
      0.15,
      10.0,
      woodMat,
      'Beach_Landing_Central'
    )

    // 4b. South Beach Boardwalk Ramp & Stairway (at Z: -40, connecting to South Promenade opening)
    DistrictHelper.addStairs(
      this.group,
      collisionSystem,
      materials,
      -23.5,
      0.0,
      -40,
      4.5,
      0.25,
      5.0,
      2,
      'X-',
      woodMat,
      'Beach_Stairs_South'
    )

    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -36.5,
      0.075,
      -40,
      15.0,
      0.15,
      4.5,
      woodMat,
      'Beach_Boardwalk_South'
    )

    // 4c. North Beach Boardwalk Ramp & Stairway (at Z: 20, connecting to North Promenade opening)
    DistrictHelper.addStairs(
      this.group,
      collisionSystem,
      materials,
      -23.5,
      0.0,
      20,
      4.5,
      0.25,
      5.0,
      2,
      'X-',
      woodMat,
      'Beach_Stairs_North'
    )

    DistrictHelper.addStaticBox(
      this.group,
      collisionSystem,
      materials,
      -36.5,
      0.075,
      20,
      15.0,
      0.15,
      4.5,
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
      [-36, 110, 7.8, 0.20],
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

    // Counter & Bar Stools (3.2m width leaving wide 2.1m walkways on both sides)
    const counter = new THREE.Mesh(materials.boxGeometry, woodMat)
    counter.scale.set(3.2, 1.1, 1.2)
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

    // Gentle access step on the front of the wooden deck (allowing easy step-up from sand)
    const accessStep = new THREE.Mesh(materials.boxGeometry, woodMat)
    accessStep.scale.set(4.0, 0.2, 1.0)
    accessStep.position.set(0, 0.1, 4.0)
    accessStep.receiveShadow = true
    accessStep.castShadow = true
    shackGroup.add(accessStep)

    this.group.add(shackGroup)

    // Register Walkable Platform Collider for the Timber Deck (deck surface at Y = 0.4m)
    DistrictHelper.registerBoxCollider(
      collisionSystem,
      x,
      0.2,
      z,
      7.5,
      0.4,
      7.5,
      `${name}_Walkable_Deck`
    )

    // Register Deck Access Step Collider
    DistrictHelper.registerBoxCollider(
      collisionSystem,
      x,
      0.1,
      z + 4.0,
      4.0,
      0.2,
      1.0,
      `${name}_Deck_Step`
    )

    // Solid Collider for Bar Counter
    DistrictHelper.registerBoxCollider(
      collisionSystem,
      x,
      0.75,
      z + 1.8,
      3.2,
      1.1,
      1.2,
      `${name}_Counter`
    )

    // Thin post colliders for 4 corner timber posts
    for (const px of [-3.2, 3.2]) {
      for (const pz of [-3.2, 3.2]) {
        DistrictHelper.registerBoxCollider(
          collisionSystem,
          x + px,
          1.8,
          z + pz,
          0.3,
          3.2,
          0.3,
          `${name}_Post_${px}_${pz}`
        )
      }
    }
  }

  /**
   * Constructs an authentic coastal granite rip-rap breakwater groyne
   * Positioned strictly South of the Harbour Road opening (Z = 41.0 to 43.5, X = -24.0 to -46.0)
   * Protects the recreation beach from harbour silt while keeping road and vessel channels 100% open.
   */
  private buildBreakwaterGroyne(materials: MaterialFactory, collisionSystem: CollisionSystem): void {
    const rockMat = materials.getColorMaterial(0x3a3d40, 0.85, 0.1)
    const boulderGeos: THREE.BufferGeometry[] = []

    for (let i = 0; i < 16; i++) {
      const t = i / 15
      const bx = -24.0 - t * 22.0 // from -24.0 (dune) to -46.0 (low-water swash)
      const bz = 41.5 + ((i % 3) - 1) * 0.7 // Z: 40.8 to 43.2 (safe clearance from Z = 44 road opening)
      const by = 0.20 - t * 0.75 // sloping from Y = 0.20 down to Y = -0.55 in water
      const bScale = 1.2 + (i % 4) * 0.25

      const geo = new THREE.DodecahedronGeometry(bScale * 0.7, 0)
      geo.scale(1.2, 0.85, 1.1)
      geo.rotateY((i * 1.3) % Math.PI)
      geo.rotateX((i * 0.7) % 0.4)
      geo.translate(bx, by + bScale * 0.35, bz)
      boulderGeos.push(geo)
    }

    const mergedGeo = BufferGeometryUtils.mergeGeometries(boulderGeos)
    if (mergedGeo) {
      const groyneMesh = new THREE.Mesh(mergedGeo, rockMat)
      groyneMesh.castShadow = true
      groyneMesh.receiveShadow = true
      this.group.add(groyneMesh)
    }

    // Solid collision barrier across the groyne boulders
    DistrictHelper.registerBoxCollider(
      collisionSystem,
      -35.0,
      0.20,
      42.25,
      22.0,
      1.20,
      2.5,
      'Breakwater_RipRap_Groyne'
    )
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
