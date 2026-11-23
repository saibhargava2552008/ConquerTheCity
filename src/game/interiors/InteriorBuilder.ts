import * as THREE from 'three'
import type { MaterialFactory } from '../world/MaterialFactory'
import type { CollisionSystem } from '../physics/CollisionSystem'
import type { BuildingInteriorConfig } from './InteriorTypes'

/**
 * InteriorBuilder — Milestone 4
 * Modular 3D interior environment generator with solid collision boundaries,
 * warm interior PBR illumination, authentic coastal Indian furniture, and functional props.
 */
export class InteriorBuilder {
  /**
   * Builds the foundational room shell: floor, ceiling, perimeter walls with door opening, and warm lights.
   */
  public static buildRoomShell(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    config: BuildingInteriorConfig
  ): THREE.Group {
    const roomGroup = new THREE.Group()
    roomGroup.name = `Room_${config.id}`
    roomGroup.position.copy(config.interiorOrigin)

    const w = config.roomWidth
    const d = config.roomDepth
    const h = config.roomHeight
    const ox = config.interiorOrigin.x
    const oy = config.interiorOrigin.y
    const oz = config.interiorOrigin.z

    // 1. Floor (Surface type 'interior')
    const floorMat =
      config.id === 'market_kirana_interior'
        ? materials.getPromenadeTileMaterial()
        : materials.getTimberWoodMaterial()

    const floor = new THREE.Mesh(materials.boxGeometry, floorMat)
    floor.scale.set(w, 0.2, d)
    floor.position.set(0, -0.1, 0)
    floor.receiveShadow = true
    roomGroup.add(floor)

    // Floor Collider
    collisionSystem.addCollider({
      id: `${config.id}_floor`,
      isStatic: true,
      surfaceType: 'interior',
      box: new THREE.Box3(
        new THREE.Vector3(ox - w / 2, oy - 0.2, oz - d / 2),
        new THREE.Vector3(ox + w / 2, oy, oz + d / 2)
      ),
    })

    // 2. Ceiling / Roof (Blocks exterior light and prevents camera clipping)
    const ceilingMat = materials.getStuccoMaterial('#f4f1de', '#e07a5f')
    const ceiling = new THREE.Mesh(materials.boxGeometry, ceilingMat)
    ceiling.scale.set(w + 0.4, 0.2, d + 0.4)
    ceiling.position.set(0, h + 0.1, 0)
    ceiling.receiveShadow = true
    roomGroup.add(ceiling)

    // Ceiling Collider
    collisionSystem.addCollider({
      id: `${config.id}_ceiling`,
      isStatic: true,
      box: new THREE.Box3(
        new THREE.Vector3(ox - w / 2 - 0.2, oy + h, oz - d / 2 - 0.2),
        new THREE.Vector3(ox + w / 2 + 0.2, oy + h + 0.3, oz + d / 2 + 0.2)
      ),
    })

    // 3. Perimeter Walls
    const wallMat = materials.getStuccoMaterial(config.wallColorHex, config.trimColorHex)
    const wallThick = 0.3

    // North Wall (Z = -d / 2)
    const wallN = new THREE.Mesh(materials.boxGeometry, wallMat)
    wallN.scale.set(w, h, wallThick)
    wallN.position.set(0, h / 2, -d / 2)
    wallN.castShadow = true
    wallN.receiveShadow = true
    roomGroup.add(wallN)

    collisionSystem.addCollider({
      id: `${config.id}_wall_north`,
      isStatic: true,
      box: new THREE.Box3(
        new THREE.Vector3(ox - w / 2, oy, oz - d / 2 - wallThick / 2),
        new THREE.Vector3(ox + w / 2, oy + h, oz - d / 2 + wallThick / 2)
      ),
    })

    // East Wall (X = w / 2)
    const wallE = new THREE.Mesh(materials.boxGeometry, wallMat)
    wallE.scale.set(wallThick, h, d)
    wallE.position.set(w / 2, h / 2, 0)
    wallE.castShadow = true
    wallE.receiveShadow = true
    roomGroup.add(wallE)

    collisionSystem.addCollider({
      id: `${config.id}_wall_east`,
      isStatic: true,
      box: new THREE.Box3(
        new THREE.Vector3(ox + w / 2 - wallThick / 2, oy, oz - d / 2),
        new THREE.Vector3(ox + w / 2 + wallThick / 2, oy + h, oz + d / 2)
      ),
    })

    // West Wall (X = -w / 2)
    const wallW = new THREE.Mesh(materials.boxGeometry, wallMat)
    wallW.scale.set(wallThick, h, d)
    wallW.position.set(-w / 2, h / 2, 0)
    wallW.castShadow = true
    wallW.receiveShadow = true
    roomGroup.add(wallW)

    collisionSystem.addCollider({
      id: `${config.id}_wall_west`,
      isStatic: true,
      box: new THREE.Box3(
        new THREE.Vector3(ox - w / 2 - wallThick / 2, oy, oz - d / 2),
        new THREE.Vector3(ox - w / 2 + wallThick / 2, oy + h, oz + d / 2)
      ),
    })

    // South Wall (Split with 1.6m door opening in center)
    const doorWidth = 1.6
    const sideWallWidth = (w - doorWidth) / 2

    // South Left
    const wallSL = new THREE.Mesh(materials.boxGeometry, wallMat)
    wallSL.scale.set(sideWallWidth, h, wallThick)
    wallSL.position.set(-doorWidth / 2 - sideWallWidth / 2, h / 2, d / 2)
    wallSL.castShadow = true
    wallSL.receiveShadow = true
    roomGroup.add(wallSL)

    collisionSystem.addCollider({
      id: `${config.id}_wall_south_left`,
      isStatic: true,
      box: new THREE.Box3(
        new THREE.Vector3(ox - w / 2, oy, oz + d / 2 - wallThick / 2),
        new THREE.Vector3(ox - doorWidth / 2, oy + h, oz + d / 2 + wallThick / 2)
      ),
    })

    // South Right
    const wallSR = new THREE.Mesh(materials.boxGeometry, wallMat)
    wallSR.scale.set(sideWallWidth, h, wallThick)
    wallSR.position.set(doorWidth / 2 + sideWallWidth / 2, h / 2, d / 2)
    wallSR.castShadow = true
    wallSR.receiveShadow = true
    roomGroup.add(wallSR)

    collisionSystem.addCollider({
      id: `${config.id}_wall_south_right`,
      isStatic: true,
      box: new THREE.Box3(
        new THREE.Vector3(ox + doorWidth / 2, oy, oz + d / 2 - wallThick / 2),
        new THREE.Vector3(ox + w / 2, oy + h, oz + d / 2 + wallThick / 2)
      ),
    })

    // Door Header Lintel (above door opening at y = 2.4 to h)
    const doorLintel = new THREE.Mesh(materials.boxGeometry, wallMat)
    doorLintel.scale.set(doorWidth, h - 2.4, wallThick)
    doorLintel.position.set(0, 2.4 + (h - 2.4) / 2, d / 2)
    roomGroup.add(doorLintel)

    // Door Frame Posts (Teak wood finish)
    const woodMat = materials.getTimberWoodMaterial()
    const frameL = new THREE.Mesh(materials.boxGeometry, woodMat)
    frameL.scale.set(0.12, 2.4, 0.35)
    frameL.position.set(-doorWidth / 2, 1.2, d / 2)
    roomGroup.add(frameL)

    const frameR = new THREE.Mesh(materials.boxGeometry, woodMat)
    frameR.scale.set(0.12, 2.4, 0.35)
    frameR.position.set(doorWidth / 2, 1.2, d / 2)
    roomGroup.add(frameR)

    // 4. Warm Interior PBR Point Illumination
    const light = new THREE.PointLight(config.lightColorHex, 1.6, Math.max(w, d) * 1.5, 1.4)
    light.position.set(0, h - 0.5, 0)
    light.castShadow = true
    light.shadow.bias = -0.002
    roomGroup.add(light)

    // Secondary subtle ambient fill for warm soft shadows
    const fillLight = new THREE.PointLight(0xfff1e6, 0.8, Math.max(w, d) * 1.2, 1.6)
    fillLight.position.set(0, 1.6, 0)
    roomGroup.add(fillLight)

    parent.add(roomGroup)
    return roomGroup
  }

  /**
   * Adds a solid furniture counter / reception desk.
   */
  public static addCounter(
    room: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    ox: number,
    oy: number,
    oz: number,
    relX: number,
    relY: number,
    relZ: number,
    w: number,
    h: number,
    d: number,
    name: string
  ): void {
    const woodMat = materials.getTimberWoodMaterial()
    const counter = new THREE.Mesh(materials.boxGeometry, woodMat)
    counter.scale.set(w, h, d)
    counter.position.set(relX, relY + h / 2, relZ)
    counter.castShadow = true
    counter.receiveShadow = true
    room.add(counter)

    // Countertop granite / polished brass slab
    const topMat = materials.getColorMaterial(0x2f3640, 0.3, 0.4)
    const top = new THREE.Mesh(materials.boxGeometry, topMat)
    top.scale.set(w + 0.1, 0.08, d + 0.1)
    top.position.set(relX, relY + h + 0.04, relZ)
    top.castShadow = true
    room.add(top)

    collisionSystem.addCollider({
      id: `${name}_collider`,
      isStatic: true,
      box: new THREE.Box3(
        new THREE.Vector3(ox + relX - w / 2, oy + relY, oz + relZ - d / 2),
        new THREE.Vector3(ox + relX + w / 2, oy + relY + h + 0.08, oz + relZ + d / 2)
      ),
    })
  }

  /**
   * Adds an authentic wooden table with solid collider.
   */
  public static addTable(
    room: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    ox: number,
    oy: number,
    oz: number,
    relX: number,
    relZ: number,
    w: number,
    d: number,
    name: string
  ): void {
    const woodMat = materials.getTimberWoodMaterial()
    const tableTop = new THREE.Mesh(materials.boxGeometry, woodMat)
    tableTop.scale.set(w, 0.08, d)
    tableTop.position.set(relX, 0.75, relZ)
    tableTop.castShadow = true
    room.add(tableTop)

    // 4 legs
    const legGeo = materials.cylinderGeometry
    const legPositions = [
      [-w / 2 + 0.1, -d / 2 + 0.1],
      [w / 2 - 0.1, -d / 2 + 0.1],
      [-w / 2 + 0.1, d / 2 - 0.1],
      [w / 2 - 0.1, d / 2 - 0.1],
    ]
    for (const [lx, lz] of legPositions) {
      const leg = new THREE.Mesh(legGeo, woodMat)
      leg.scale.set(0.06, 0.72, 0.06)
      leg.position.set(relX + lx, 0.36, relZ + lz)
      leg.castShadow = true
      room.add(leg)
    }

    collisionSystem.addCollider({
      id: `${name}_collider`,
      isStatic: true,
      box: new THREE.Box3(
        new THREE.Vector3(ox + relX - w / 2, oy, oz + relZ - d / 2),
        new THREE.Vector3(ox + relX + w / 2, oy + 0.8, oz + relZ + d / 2)
      ),
    })
  }

  /**
   * Adds a wooden chair / lounge seat.
   */
  public static addChair(
    room: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    ox: number,
    oy: number,
    oz: number,
    relX: number,
    relZ: number,
    rotY = 0,
    name = 'Chair'
  ): void {
    const woodMat = materials.getTimberWoodMaterial()
    const chairGroup = new THREE.Group()
    chairGroup.position.set(relX, 0, relZ)
    chairGroup.rotation.y = rotY

    const seat = new THREE.Mesh(materials.boxGeometry, woodMat)
    seat.scale.set(0.55, 0.06, 0.55)
    seat.position.set(0, 0.45, 0)
    seat.castShadow = true
    chairGroup.add(seat)

    const back = new THREE.Mesh(materials.boxGeometry, woodMat)
    back.scale.set(0.55, 0.5, 0.06)
    back.position.set(0, 0.72, -0.24)
    back.castShadow = true
    chairGroup.add(back)

    room.add(chairGroup)

    collisionSystem.addCollider({
      id: `${name}_collider`,
      isStatic: true,
      box: new THREE.Box3(
        new THREE.Vector3(ox + relX - 0.3, oy, oz + relZ - 0.3),
        new THREE.Vector3(ox + relX + 0.3, oy + 0.9, oz + relZ + 0.3)
      ),
    })
  }

  /**
   * Adds wall shelving / merchandise cabinet.
   */
  public static addWallShelf(
    room: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    ox: number,
    oy: number,
    oz: number,
    relX: number,
    relZ: number,
    w: number,
    h: number,
    d: number,
    name: string
  ): void {
    const woodMat = materials.getTimberWoodMaterial()
    const shelf = new THREE.Mesh(materials.boxGeometry, woodMat)
    shelf.scale.set(w, h, d)
    shelf.position.set(relX, h / 2, relZ)
    shelf.castShadow = true
    room.add(shelf)

    // Add colorful spice jars / merchandise props on shelves
    const jarColors = [0xe76f51, 0xf4a261, 0xe9c46a, 0x2a9d8f, 0x264653]
    for (let i = 0; i < 6; i++) {
      const jarMat = materials.getColorMaterial(jarColors[i % jarColors.length], 0.4, 0.1)
      const jar = new THREE.Mesh(materials.cylinderGeometry, jarMat)
      jar.scale.set(0.12, 0.22, 0.12)
      jar.position.set(relX - w / 2 + 0.3 + i * (w / 7), 1.2, relZ + d / 4)
      jar.castShadow = true
      room.add(jar)
    }

    collisionSystem.addCollider({
      id: `${name}_collider`,
      isStatic: true,
      box: new THREE.Box3(
        new THREE.Vector3(ox + relX - w / 2, oy, oz + relZ - d / 2),
        new THREE.Vector3(ox + relX + w / 2, oy + h, oz + relZ + d / 2)
      ),
    })
  }

  /**
   * Adds framed painting / nautical chart on wall.
   */
  public static addWallArt(
    room: THREE.Group,
    materials: MaterialFactory,
    relX: number,
    relY: number,
    relZ: number,
    w: number,
    h: number,
    accentColor = 0x1d3557
  ): void {
    const frameMat = materials.getColorMaterial(0x8d5b4c, 0.5, 0.1)
    const frame = new THREE.Mesh(materials.boxGeometry, frameMat)
    frame.scale.set(w, h, 0.04)
    frame.position.set(relX, relY, relZ)
    room.add(frame)

    const canvasMat = materials.getColorMaterial(accentColor, 0.8, 0.0)
    const art = new THREE.Mesh(materials.boxGeometry, canvasMat)
    art.scale.set(w - 0.1, h - 0.1, 0.05)
    art.position.set(relX, relY, relZ + 0.01)
    room.add(art)
  }

  /**
   * Adds decorative floor rug.
   */
  public static addRug(
    room: THREE.Group,
    materials: MaterialFactory,
    relX: number,
    relZ: number,
    w: number,
    d: number,
    color = 0x9b2226
  ): void {
    const rugMat = materials.getColorMaterial(color, 0.9, 0.0)
    const rug = new THREE.Mesh(materials.boxGeometry, rugMat)
    rug.scale.set(w, 0.02, d)
    rug.position.set(relX, 0.01, relZ)
    rug.receiveShadow = true
    room.add(rug)
  }
}
