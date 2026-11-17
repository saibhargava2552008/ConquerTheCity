import * as THREE from 'three'
import { CollisionSystem } from '../physics/CollisionSystem'
import { MaterialFactory } from './MaterialFactory'

export class CityBuilder {
  private scene: THREE.Scene
  private materials: MaterialFactory
  private collisionSystem: CollisionSystem
  private meshes: THREE.Object3D[] = []

  constructor(scene: THREE.Scene, materials: MaterialFactory, collisionSystem: CollisionSystem) {
    this.scene = scene
    this.materials = materials
    this.collisionSystem = collisionSystem
  }

  public build(): void {
    this.buildGroundAndRoads()
    this.buildPerimeterWalls()
    this.buildBuildings()
    this.buildParkourArea()
    this.buildParkAndPlaza()
    this.buildStreetProps()
  }

  /**
   * Ground plane and road intersection
   */
  private buildGroundAndRoads(): void {
    const roadMat = this.materials.getRoadMaterial()
    const sidewalkMat = this.materials.getSidewalkMaterial()
    const parkMat = this.materials.getParkMaterial()

    // Base ground terrain
    const groundMesh = new THREE.Mesh(this.materials.boxGeometry, parkMat)
    groundMesh.scale.set(120, 0.2, 120)
    groundMesh.position.set(0, -0.1, 0)
    groundMesh.receiveShadow = true
    this.scene.add(groundMesh)
    this.meshes.push(groundMesh)

    // North-South Road (12m wide, 116m long)
    const roadNS = new THREE.Mesh(this.materials.boxGeometry, roadMat)
    roadNS.scale.set(12, 0.05, 116)
    roadNS.position.set(0, 0.025, 0)
    roadNS.receiveShadow = true
    this.scene.add(roadNS)
    this.meshes.push(roadNS)

    // East-West Road (12m wide, 116m long)
    const roadEW = new THREE.Mesh(this.materials.boxGeometry, roadMat)
    roadEW.scale.set(116, 0.05, 12)
    roadEW.position.set(0, 0.026, 0)
    roadEW.rotation.y = Math.PI / 2
    roadEW.receiveShadow = true
    this.scene.add(roadEW)
    this.meshes.push(roadEW)

    // Sidewalks along roads (curb height: 0.2m)
    this.addPlatform(34, 0.2, 34, 25, 0.1, 25, sidewalkMat, 'Sidewalk_NE')
    this.addPlatform(-34, 0.2, 34, 25, 0.1, 25, sidewalkMat, 'Sidewalk_NW')
    this.addPlatform(34, 0.2, -34, 25, 0.1, 25, sidewalkMat, 'Sidewalk_SE')
    this.addPlatform(-34, 0.2, -34, 25, 0.1, 25, sidewalkMat, 'Sidewalk_SW')
  }

  /**
   * Surrounding perimeter security walls
   */
  private buildPerimeterWalls(): void {
    const wallMat = this.materials.getColorMaterial(0x3e4450, 0.8, 0.1)
    const wallHeight = 6
    const wallThickness = 2
    const size = 118

    // North wall
    this.addStaticBox(0, wallHeight / 2, size / 2, size, wallHeight, wallThickness, wallMat, 'Wall_North')
    // South wall
    this.addStaticBox(0, wallHeight / 2, -size / 2, size, wallHeight, wallThickness, wallMat, 'Wall_South')
    // East wall
    this.addStaticBox(size / 2, wallHeight / 2, 0, wallThickness, wallHeight, size, wallMat, 'Wall_East')
    // West wall
    this.addStaticBox(-size / 2, wallHeight / 2, 0, wallThickness, wallHeight, size, wallMat, 'Wall_West')
  }

  /**
   * Diverse urban buildings
   */
  private buildBuildings(): void {
    const blueFacade = this.materials.getBuildingFacadeMaterial('#00b4d8')
    const goldFacade = this.materials.getBuildingFacadeMaterial('#ffd166')
    const brickMat = this.materials.getBrickMaterial()
    const roofMat = this.materials.getColorMaterial(0x282c34, 0.9, 0.1)

    // 1. Skyscraper Alpha (North-East Block) - 34m tall
    this.addBuildingWithRoof(25, 25, 16, 34, 18, blueFacade, roofMat, 'Skyscraper_Alpha')

    // 2. Commercial Plaza Tower (North-West Block) - 22m tall
    this.addBuildingWithRoof(-28, 26, 18, 22, 16, goldFacade, roofMat, 'Tower_Commercial')

    // 3. Brick Industrial Warehouse (South-East Block) - 9m tall
    this.addBuildingWithRoof(26, -26, 22, 9, 20, brickMat, roofMat, 'Industrial_Warehouse')

    // 4. Two-Tier Apartment Complex (South-West Block)
    // Lower tier (5m high)
    this.addStaticBox(-24, 2.5, -20, 16, 5, 14, brickMat, 'Apartment_Lower')
    // Upper tier (12m high)
    this.addBuildingWithRoof(-28, -26, 12, 12, 12, blueFacade, roofMat, 'Apartment_Upper')

    // Rooftop AC units on buildings (acting as cover/obstacle on roofs)
    this.addStaticBox(25, 34.8, 25, 3, 1.6, 3, this.materials.getColorMaterial(0x8899aa), 'AC_Unit_Alpha')
    this.addStaticBox(26, 9.8, -26, 4, 1.6, 2.5, this.materials.getColorMaterial(0x778899), 'AC_Unit_Warehouse')
  }

  /**
   * Parkour test zone with crates, containers, stairs, and ramps
   */
  private buildParkourArea(): void {
    const crateMat = this.materials.getCrateMaterial()
    const hazardMat = this.materials.getHazardMaterial()
    const redContainer = this.materials.getContainerMaterial(0xc0392b, 'CARGO-01')
    const blueContainer = this.materials.getContainerMaterial(0x2980b9, 'CARGO-02')
    const orangeContainer = this.materials.getContainerMaterial(0xd35400, 'CARGO-03')

    // Shipping container stack in North-West parkour quadrant
    // Container 1 (Ground level: height 2.6m, width 2.6m, length 6m)
    this.addStaticBox(-12, 1.3, 14, 2.6, 2.6, 6.2, redContainer, 'Container_Red')
    // Container 2 (Ground level next to it)
    this.addStaticBox(-15, 1.3, 14, 2.6, 2.6, 6.2, blueContainer, 'Container_Blue')
    // Container 3 (Stacked on top of #1 and #2: top height 5.2m!)
    this.addStaticBox(-13.5, 3.9, 14, 2.6, 2.6, 6.2, orangeContainer, 'Container_Orange_Top')

    // Step-up Wooden Crates leading up to Container 1 (Jumping test)
    // Crate 1 (0.8m high)
    this.addStaticBox(-12, 0.4, 9.5, 1.4, 0.8, 1.4, crateMat, 'Crate_Step1')
    // Crate 2 (1.6m high)
    this.addStaticBox(-12, 0.8, 11.0, 1.4, 1.6, 1.4, crateMat, 'Crate_Step2')

    // An inclined ramp leading up to an elevated observation deck
    // Observation deck platform (height: 3.2m, size: 8m x 8m)
    const deckMat = this.materials.getColorMaterial(0x444d5c, 0.6, 0.2)
    this.addPlatform(-38, 3.2, -10, 8, 0.3, 8, deckMat, 'Observation_Deck')

    // Ramp (stairs / slope test)
    this.buildRamp(-38, 0, -3.5, 4, 3.2, 7, hazardMat, 'Access_Ramp')

    // High catwalk / bridge connecting Observation Deck to the Apartment Roof
    this.addPlatform(-31, 3.2, -14, 6, 0.25, 2.2, hazardMat, 'Catwalk_Bridge')

    // Jump training crates in South-East area
    this.addStaticBox(14, 0.5, -12, 1.2, 1.0, 1.2, crateMat, 'Practice_Crate_1')
    this.addStaticBox(17, 0.75, -12, 1.5, 1.5, 1.5, crateMat, 'Practice_Crate_2')
    this.addStaticBox(20, 1.0, -12, 1.8, 2.0, 1.8, crateMat, 'Practice_Crate_3')
  }

  /**
   * Park and Central Plaza with monument and benches
   */
  private buildParkAndPlaza(): void {
    const marbleMat = this.materials.getColorMaterial(0xdedee5, 0.4, 0.1)
    const goldMat = this.materials.getColorMaterial(0xffbe0b, 0.3, 0.7)
    const foliageMat = this.materials.getColorMaterial(0x2d6a4f, 0.9, 0.0)
    const woodMat = this.materials.getColorMaterial(0x5c4033, 0.8, 0.0)

    // Central Plaza Monument Platform (Center crossroad median plaza: 10m x 10m x 0.6m)
    this.addPlatform(0, 0.4, 0, 8, 0.4, 8, marbleMat, 'Plaza_Pillar_Base')

    // Central Monolith Obelisk (landmark)
    const obelisk = new THREE.Mesh(this.materials.boxGeometry, goldMat)
    obelisk.scale.set(1.5, 6, 1.5)
    obelisk.position.set(0, 3.4, 0)
    obelisk.castShadow = true
    this.scene.add(obelisk)
    this.meshes.push(obelisk)
    this.registerBoxCollider(0, 3.4, 0, 1.5, 6, 1.5, 'Central_Obelisk')

    // Park Trees in North-East / South-East quadrants
    const treePositions = [
      [14, 14],
      [14, 28],
      [38, 14],
      [-14, -14],
      [-14, -28],
      [-38, -28],
    ]

    for (const [tx, tz] of treePositions) {
      // Trunk
      const trunk = new THREE.Mesh(this.materials.cylinderGeometry, woodMat)
      trunk.scale.set(0.3, 2.5, 0.3)
      trunk.position.set(tx, 1.25, tz)
      trunk.castShadow = true
      this.scene.add(trunk)
      this.meshes.push(trunk)
      this.registerBoxCollider(tx, 1.25, tz, 0.8, 2.5, 0.8, `Tree_Trunk_${tx}_${tz}`)

      // Foliage (low-poly tiered canopies)
      const foliage = new THREE.Mesh(this.materials.boxGeometry, foliageMat)
      foliage.scale.set(2.8, 2.5, 2.8)
      foliage.position.set(tx, 3.2, tz)
      foliage.castShadow = true
      this.scene.add(foliage)
      this.meshes.push(foliage)
    }

    // Plaza Benches
    this.addStaticBox(3.2, 0.3, -3.2, 1.8, 0.5, 0.6, woodMat, 'Bench_1')
    this.addStaticBox(-3.2, 0.3, -3.2, 1.8, 0.5, 0.6, woodMat, 'Bench_2')
  }

  /**
   * Street lamps and urban props
   */
  private buildStreetProps(): void {
    const metalMat = this.materials.getColorMaterial(0x2f3640, 0.6, 0.5)
    const lampGlowMat = new THREE.MeshStandardMaterial({
      color: 0xfff3b0,
      emissive: 0xffe873,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    })

    const lampPositions = [
      [7, 10],
      [7, 30],
      [7, -10],
      [7, -30],
      [-7, 10],
      [-7, 30],
      [-7, -10],
      [-7, -30],
      [20, 7],
      [-20, 7],
      [20, -7],
      [-20, -7],
    ]

    for (let i = 0; i < lampPositions.length; i++) {
      const [lx, lz] = lampPositions[i]

      // Pole
      const pole = new THREE.Mesh(this.materials.cylinderGeometry, metalMat)
      pole.scale.set(0.12, 5.0, 0.12)
      pole.position.set(lx, 2.5, lz)
      pole.castShadow = true
      this.scene.add(pole)
      this.meshes.push(pole)
      this.registerBoxCollider(lx, 2.5, lz, 0.4, 5.0, 0.4, `Lamp_Pole_${i}`)

      // Arm & Lamp Head
      const head = new THREE.Mesh(this.materials.boxGeometry, lampGlowMat)
      head.scale.set(0.4, 0.2, 0.4)
      head.position.set(lx, 5.0, lz)
      this.scene.add(head)
      this.meshes.push(head)
    }
  }

  // --- Helper Methods ---

  private addBuildingWithRoof(
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
    facadeMat: THREE.Material,
    roofMat: THREE.Material,
    name: string
  ): void {
    // Main building body
    const building = new THREE.Mesh(this.materials.boxGeometry, facadeMat)
    building.scale.set(w, h, d)
    building.position.set(x, h / 2, z)
    building.castShadow = true
    building.receiveShadow = true
    this.scene.add(building)
    this.meshes.push(building)

    // Parapet roof border (lip)
    const parapet = new THREE.Mesh(this.materials.boxGeometry, roofMat)
    parapet.scale.set(w + 0.3, 0.4, d + 0.3)
    parapet.position.set(x, h + 0.2, z)
    parapet.castShadow = true
    this.scene.add(parapet)
    this.meshes.push(parapet)

    this.registerBoxCollider(x, (h + 0.4) / 2, z, w + 0.3, h + 0.4, d + 0.3, name)
  }

  private addStaticBox(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    name: string
  ): void {
    const mesh = new THREE.Mesh(this.materials.boxGeometry, mat)
    mesh.scale.set(w, h, d)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.scene.add(mesh)
    this.meshes.push(mesh)

    this.registerBoxCollider(x, y, z, w, h, d, name)
  }

  private addPlatform(
    x: number,
    topY: number,
    z: number,
    w: number,
    thickness: number,
    d: number,
    mat: THREE.Material,
    name: string
  ): void {
    const centerY = topY - thickness / 2
    const mesh = new THREE.Mesh(this.materials.boxGeometry, mat)
    mesh.scale.set(w, thickness, d)
    mesh.position.set(x, centerY, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.scene.add(mesh)
    this.meshes.push(mesh)

    this.registerBoxCollider(x, centerY, z, w, thickness, d, name)
  }

  /**
   * Constructs an accessible stepped ramp
   */
  private buildRamp(
    x: number,
    baseY: number,
    z: number,
    width: number,
    height: number,
    length: number,
    mat: THREE.Material,
    name: string
  ): void {
    const steps = 10
    const stepHeight = height / steps
    const stepLength = length / steps

    for (let i = 0; i < steps; i++) {
      const curH = (i + 1) * stepHeight
      const curZ = z + (i - steps / 2 + 0.5) * stepLength
      const curY = baseY + curH / 2

      const stepMesh = new THREE.Mesh(this.materials.boxGeometry, mat)
      stepMesh.scale.set(width, curH, stepLength + 0.05)
      stepMesh.position.set(x, curY, curZ)
      stepMesh.castShadow = true
      stepMesh.receiveShadow = true
      this.scene.add(stepMesh)
      this.meshes.push(stepMesh)

      this.registerBoxCollider(x, curY, curZ, width, curH, stepLength + 0.05, `${name}_step_${i}`)
    }
  }

  private registerBoxCollider(
    cx: number,
    cy: number,
    cz: number,
    sx: number,
    sy: number,
    sz: number,
    name: string
  ): void {
    const box = new THREE.Box3()
    box.min.set(cx - sx / 2, cy - sy / 2, cz - sz / 2)
    box.max.set(cx + sx / 2, cy + sy / 2, cz + sz / 2)

    this.collisionSystem.addCollider({
      id: name,
      name,
      box,
      isStatic: true,
    })
  }

  public dispose(): void {
    for (const mesh of this.meshes) {
      this.scene.remove(mesh)
      if (mesh instanceof THREE.Mesh) {
        // Individual geometry/materials are managed by MaterialFactory
      }
    }
    this.meshes = []
  }
}
