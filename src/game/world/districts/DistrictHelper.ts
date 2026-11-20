import * as THREE from 'three'
import type { MaterialFactory } from '../MaterialFactory'
import type { CollisionSystem } from '../../physics/CollisionSystem'
import { AssetLoader } from '../AssetLoader'

/**
 * Reusable helper utilities for procedural Indian coastal architecture and props
 */
export class DistrictHelper {
  public static registerBoxCollider(
    collisionSystem: CollisionSystem,
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

    collisionSystem.addCollider({
      id: name,
      name,
      box,
      isStatic: true,
    })
  }

  public static addStaticBox(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    name: string,
    hasCollider = true
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(materials.boxGeometry, mat)
    mesh.scale.set(w, h, d)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)

    if (hasCollider) {
      this.registerBoxCollider(collisionSystem, x, y, z, w, h, d, name)
    }

    return mesh
  }

  /**
   * Generates accessible stairs with walkable step colliders
   */
  public static addStairs(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    startX: number,
    startY: number,
    startZ: number,
    width: number,
    totalHeight: number,
    totalLength: number,
    numSteps: number,
    dir: 'X+' | 'X-' | 'Z+' | 'Z-',
    mat: THREE.Material,
    name: string
  ): THREE.Group {
    const stairGroup = new THREE.Group()
    const stepH = totalHeight / numSteps
    const stepL = totalLength / numSteps

    for (let i = 0; i < numSteps; i++) {
      const curH = (i + 1) * stepH
      let stepX = startX
      let stepZ = startZ
      let sx = width
      let sz = stepL

      if (dir === 'X+') {
        stepX = startX + i * stepL + stepL / 2
        sx = stepL
        sz = width
      } else if (dir === 'X-') {
        stepX = startX - i * stepL - stepL / 2
        sx = stepL
        sz = width
      } else if (dir === 'Z+') {
        stepZ = startZ + i * stepL + stepL / 2
        sx = width
        sz = stepL
      } else if (dir === 'Z-') {
        stepZ = startZ - i * stepL - stepL / 2
        sx = width
        sz = stepL
      }

      const stepY = startY + curH / 2
      const stepMesh = new THREE.Mesh(materials.boxGeometry, mat)
      stepMesh.scale.set(sx, curH, sz)
      stepMesh.position.set(stepX, stepY, stepZ)
      stepMesh.castShadow = true
      stepMesh.receiveShadow = true
      stairGroup.add(stepMesh)

      this.registerBoxCollider(collisionSystem, stepX, stepY, stepZ, sx, curH, sz, `${name}_step_${i}`)
    }

    parent.add(stairGroup)
    return stairGroup
  }

  /**
   * Generates an authentic tropical coconut palm tree with curved trunk and radiating star canopy
   */
  public static addCoconutPalm(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    x: number,
    z: number,
    height = 7.5,
    leanAngle = 0.15,
    leanDir = Math.PI / 4,
    name = 'Coconut_Palm'
  ): THREE.Group {
    const palmGroup = new THREE.Group()
    palmGroup.position.set(x, 0, z)

    // Fallback procedural palm mesh group (for headless test environments)
    const proceduralGroup = new THREE.Group()
    palmGroup.add(proceduralGroup)

    const trunkMat = materials.getPalmTrunkMaterial()
    const leafMat = materials.getPalmLeafMaterial()
    const coconutMat = materials.getColorMaterial(0x5c4033, 0.9, 0.0)

    // Segmented curved trunk (3 segments)
    const segH = height / 3
    let curX = 0
    let curZ = 0
    let curY = 0

    const dx = Math.sin(leanDir) * Math.sin(leanAngle) * segH
    const dz = Math.cos(leanDir) * Math.sin(leanAngle) * segH

    for (let s = 0; s < 3; s++) {
      const seg = new THREE.Mesh(materials.cylinderGeometry, trunkMat)
      const rRadius = 0.28 - s * 0.04
      seg.scale.set(rRadius, segH, rRadius)
      seg.position.set(curX + dx / 2, curY + segH / 2, curZ + dz / 2)
      seg.rotation.z = -Math.sin(leanDir) * leanAngle * (0.8 + s * 0.2)
      seg.rotation.x = Math.cos(leanDir) * leanAngle * (0.8 + s * 0.2)
      seg.castShadow = true
      proceduralGroup.add(seg)

      curX += dx
      curZ += dz
      curY += Math.cos(leanAngle) * segH
    }

    // Top crown fronds
    const crown = new THREE.Group()
    crown.position.set(curX, curY, curZ)

    const numFronds = 8
    for (let i = 0; i < numFronds; i++) {
      const angle = (i / numFronds) * Math.PI * 2
      const frond = new THREE.Mesh(materials.boxGeometry, leafMat)
      frond.scale.set(0.65, 0.04, 3.4)
      frond.position.set(Math.sin(angle) * 1.5, -0.4, Math.cos(angle) * 1.5)
      frond.rotation.y = angle
      frond.rotation.x = 0.35 + (i % 2 === 0 ? 0.1 : -0.05)
      frond.castShadow = true
      crown.add(frond)
    }

    // Coconut cluster
    for (let c = 0; c < 3; c++) {
      const nut = new THREE.Mesh(materials.sphereGeometry, coconutMat)
      nut.scale.set(0.2, 0.24, 0.2)
      nut.position.set(Math.cos(c * 2) * 0.25, -0.15, Math.sin(c * 2) * 0.25)
      crown.add(nut)
    }

    proceduralGroup.add(crown)

    // Mount high-fidelity 3D GLB Coconut Palm asset
    const scaleFactor = height / 8.5
    AssetLoader.getInstance().instantiate(
      'tree_coconut_palm',
      palmGroup,
      0,
      0,
      0,
      leanDir,
      scaleFactor,
      () => {
        palmGroup.remove(proceduralGroup)
        proceduralGroup.visible = false
      }
    )

    parent.add(palmGroup)

    // Base trunk collider
    this.registerBoxCollider(collisionSystem, x, height / 2, z, 0.7, height, 0.7, name)

    return palmGroup
  }

  /**
   * Generates an authentic Indian coastal house with Mangalore tiled hip roof,
   * stucco facade, front veranda with timber pillars, and walkable porch.
   */
  public static addCoastalHouse(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    x: number,
    z: number,
    width = 12,
    depth = 10,
    wallHeight = 4.2,
    wallColor = '#fdf0d5',
    hasVeranda = true,
    name = 'Coastal_House',
    facing: 'N' | 'S' | 'E' | 'W' = 'S'
  ): void {
    const houseGroup = new THREE.Group()
    houseGroup.position.set(x, 0, z)

    let rotY = Math.PI // Default 'S' faces negative Z
    if (facing === 'N') rotY = 0
    else if (facing === 'E') rotY = Math.PI / 2
    else if (facing === 'W') rotY = -Math.PI / 2
    houseGroup.rotation.y = rotY

    const proceduralGroup = new THREE.Group()
    houseGroup.add(proceduralGroup)

    const stuccoMat = materials.getStuccoMaterial(wallColor, '#802604')
    const roofMat = materials.getTerracottaRoofMaterial()
    const timberMat = materials.getTimberWoodMaterial()
    const darkWoodMat = materials.getColorMaterial(0x3e2723, 0.8, 0.1)

    // 1. Main House Body
    const body = new THREE.Mesh(materials.boxGeometry, stuccoMat)
    body.scale.set(width, wallHeight, depth)
    body.position.set(0, wallHeight / 2, 0)
    body.castShadow = true
    body.receiveShadow = true
    proceduralGroup.add(body)

    // Register solid collider for main house body ONLY (does not block veranda)
    const isEW = facing === 'E' || facing === 'W'
    const colBodyW = isEW ? depth : width
    const colBodyD = isEW ? width : depth

    this.registerBoxCollider(
      collisionSystem,
      x,
      (wallHeight + 2.4) / 2,
      z,
      colBodyW,
      wallHeight + 2.4,
      colBodyD,
      `${name}_Body`
    )

    // 2. Pitched Mangalore Terracotta Roof
    const roofH = 2.4
    const roofMesh = new THREE.Mesh(materials.coneGeometry, roofMat)
    roofMesh.scale.set(width + 1.6, roofH, depth + 1.6)
    roofMesh.position.set(0, wallHeight + roofH / 2, 0)
    roofMesh.rotation.y = Math.PI / 4
    roofMesh.castShadow = true
    proceduralGroup.add(roofMesh)

    // 3. Front Veranda / Porch (Walkable plinth at height 0.35m)
    if (hasVeranda) {
      const verandaDepth = 2.8
      const verandaZ = depth / 2 + verandaDepth / 2
      const verandaRoofH = 0.3

      // Veranda plinth platform
      const plinth = new THREE.Mesh(materials.boxGeometry, materials.getPromenadeTileMaterial())
      plinth.scale.set(width, 0.35, verandaDepth)
      plinth.position.set(0, 0.175, verandaZ)
      plinth.receiveShadow = true
      proceduralGroup.add(plinth)

      // Calculate world coordinates for veranda collider based on facing direction
      let verColX = x
      let verColZ = z
      let verColW = width
      let verColD = verandaDepth

      if (facing === 'N') {
        verColZ = z + verandaZ
      } else if (facing === 'S') {
        verColZ = z - verandaZ
      } else if (facing === 'E') {
        verColX = x + verandaZ
        verColW = verandaDepth
        verColD = width
      } else if (facing === 'W') {
        verColX = x - verandaZ
        verColW = verandaDepth
        verColD = width
      }

      this.registerBoxCollider(
        collisionSystem,
        verColX,
        0.175,
        verColZ,
        verColW,
        0.35,
        verColD,
        `${name}_Veranda_Floor`
      )

      // Veranda sloped roof
      const verandaRoof = new THREE.Mesh(materials.boxGeometry, roofMat)
      verandaRoof.scale.set(width + 0.4, verandaRoofH, verandaDepth + 0.3)
      verandaRoof.position.set(0, wallHeight * 0.78, verandaZ)
      verandaRoof.rotation.x = 0.15
      verandaRoof.castShadow = true
      proceduralGroup.add(verandaRoof)

      // Veranda timber pillars
      const numPillars = 4
      const pSpacing = (width - 1.2) / (numPillars - 1)
      for (let p = 0; p < numPillars; p++) {
        const px = -(width - 1.2) / 2 + p * pSpacing
        const pillar = new THREE.Mesh(materials.cylinderGeometry, timberMat)
        pillar.scale.set(0.14, wallHeight * 0.75, 0.14)
        pillar.position.set(px, (wallHeight * 0.75) / 2 + 0.3, depth / 2 + verandaDepth - 0.2)
        pillar.castShadow = true
        proceduralGroup.add(pillar)

        // World coordinates of pillar
        let pilX = x
        let pilZ = z
        if (facing === 'N') {
          pilX = x + px
          pilZ = z + depth / 2 + verandaDepth - 0.2
        } else if (facing === 'S') {
          pilX = x - px
          pilZ = z - (depth / 2 + verandaDepth - 0.2)
        } else if (facing === 'E') {
          pilX = x + depth / 2 + verandaDepth - 0.2
          pilZ = z - px
        } else if (facing === 'W') {
          pilX = x - (depth / 2 + verandaDepth - 0.2)
          pilZ = z + px
        }

        this.registerBoxCollider(
          collisionSystem,
          pilX,
          (wallHeight * 0.75) / 2 + 0.3,
          pilZ,
          0.3,
          wallHeight * 0.75,
          0.3,
          `${name}_Pillar_${p}`
        )
      }

      // Wooden front door
      const door = new THREE.Mesh(materials.boxGeometry, darkWoodMat)
      door.scale.set(1.4, 2.4, 0.1)
      door.position.set(0, 1.2, depth / 2 + 0.05)
      proceduralGroup.add(door)
    }

    // Windows with painted wooden shutters
    const winMat = materials.getColorMaterial(0x1a2530, 0.3, 0.6)
    const shutterMat = materials.getColorMaterial(0x1e6091, 0.8, 0.1)

    for (const wx of [-width / 3, width / 3]) {
      const win = new THREE.Mesh(materials.boxGeometry, winMat)
      win.scale.set(1.4, 1.5, 0.1)
      win.position.set(wx, 2.2, depth / 2 + 0.05)
      proceduralGroup.add(win)

      const shutL = new THREE.Mesh(materials.boxGeometry, shutterMat)
      shutL.scale.set(0.4, 1.5, 0.08)
      shutL.position.set(wx - 0.9, 2.2, depth / 2 + 0.08)
      proceduralGroup.add(shutL)

      const shutR = new THREE.Mesh(materials.boxGeometry, shutterMat)
      shutR.scale.set(0.4, 1.5, 0.08)
      shutR.position.set(wx + 0.9, 2.2, depth / 2 + 0.08)
      proceduralGroup.add(shutR)
    }

    // Mount high-fidelity 3D GLB Architecture Asset (Commercial Arcade or Heritage Villa)
    const isCommercial =
      name.toLowerCase().includes('arcade') ||
      name.toLowerCase().includes('shop') ||
      name.toLowerCase().includes('store') ||
      name.toLowerCase().includes('spice') ||
      name.toLowerCase().includes('bakery') ||
      name.toLowerCase().includes('chai')

    const assetId = isCommercial ? 'building_coastal_arcade' : 'building_heritage_villa'
    const targetScale = isCommercial ? width / 12.0 : width / 14.0

    AssetLoader.getInstance().instantiate(
      assetId,
      houseGroup,
      0,
      0,
      0,
      0,
      targetScale,
      () => {
        houseGroup.remove(proceduralGroup)
        proceduralGroup.visible = false
      }
    )

    parent.add(houseGroup)
  }

  /**
   * Generates a traditional Indian wooden coastal fishing boat (Dhoni / Vallam) with walkable deck
   */
  public static addFishingBoat(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    hullColor = '#d90429',
    stripeColor = '#ffbe0b',
    name = 'Fishing_Boat'
  ): THREE.Group {
    const boatGroup = new THREE.Group()
    boatGroup.position.set(x, y, z)
    boatGroup.rotation.y = rotY

    const proceduralGroup = new THREE.Group()
    boatGroup.add(proceduralGroup)

    const hullMat = materials.getBoatHullMaterial(hullColor, stripeColor)
    const woodMat = materials.getTimberWoodMaterial()
    const mastMat = materials.getColorMaterial(0x4a3b32, 0.8, 0.1)

    // Main Curved Hull
    const length = 9.0
    const width = 2.6
    const height = 1.4

    const hull = new THREE.Mesh(materials.boxGeometry, hullMat)
    hull.scale.set(width, height, length)
    hull.position.set(0, height / 2, 0)
    hull.castShadow = true
    proceduralGroup.add(hull)

    // Pointed Bow
    const bow = new THREE.Mesh(materials.coneGeometry, hullMat)
    bow.scale.set(width * 0.85, 2.2, width * 0.85)
    bow.position.set(0, height / 2 + 0.1, length / 2 + 1.0)
    bow.rotation.x = Math.PI / 2
    bow.castShadow = true
    proceduralGroup.add(bow)

    // Pointed Stern
    const stern = new THREE.Mesh(materials.coneGeometry, hullMat)
    stern.scale.set(width * 0.75, 1.8, width * 0.75)
    stern.position.set(0, height / 2 + 0.1, -length / 2 - 0.8)
    stern.rotation.x = -Math.PI / 2
    stern.castShadow = true
    proceduralGroup.add(stern)

    // Walkable Wooden Deck Floor
    const deck = new THREE.Mesh(materials.boxGeometry, woodMat)
    deck.scale.set(width - 0.3, 0.15, length - 0.4)
    deck.position.set(0, height - 0.1, 0)
    deck.receiveShadow = true
    proceduralGroup.add(deck)

    // Small Wheelhouse / Shelter Cabin
    const cabin = new THREE.Mesh(materials.boxGeometry, woodMat)
    cabin.scale.set(1.6, 1.4, 2.2)
    cabin.position.set(0, height + 0.7, -1.2)
    cabin.castShadow = true
    proceduralGroup.add(cabin)

    // Mast
    const mast = new THREE.Mesh(materials.cylinderGeometry, mastMat)
    mast.scale.set(0.08, 4.2, 0.08)
    mast.position.set(0, height + 2.1, 1.2)
    mast.castShadow = true
    proceduralGroup.add(mast)

    // Folded Fishing Net Prop on deck
    const netMat = materials.getColorMaterial(0x2d6a4f, 0.95, 0.0)
    const net = new THREE.Mesh(materials.sphereGeometry, netMat)
    net.scale.set(0.6, 0.35, 0.8)
    net.position.set(0.4, height + 0.15, 2.5)
    proceduralGroup.add(net)

    // Mount high-fidelity 3D GLB Coastal Fishing Boat (Dhoni) asset
    AssetLoader.getInstance().instantiate(
      'prop_coastal_boat',
      boatGroup,
      0,
      0,
      0,
      0,
      1.0,
      () => {
        boatGroup.remove(proceduralGroup)
        proceduralGroup.visible = false
      }
    )

    parent.add(boatGroup)

    // Register Walkable Deck Collider accounting for rotation
    const deckWorldY = y + height - 0.1
    const cosR = Math.cos(rotY)
    const sinR = Math.sin(rotY)
    const deckColW = Math.abs((width - 0.2) * cosR) + Math.abs((length - 0.4) * sinR)
    const deckColD = Math.abs((width - 0.2) * sinR) + Math.abs((length - 0.4) * cosR)

    this.registerBoxCollider(
      collisionSystem,
      x,
      deckWorldY,
      z,
      deckColW,
      0.2,
      deckColD,
      `${name}_Deck`
    )

    // Solid Collider for Wheelhouse Cabin
    const cabinOffsetX = -1.2 * sinR
    const cabinOffsetZ = -1.2 * cosR
    const cabinColW = Math.abs(1.6 * cosR) + Math.abs(2.2 * sinR)
    const cabinColD = Math.abs(1.6 * sinR) + Math.abs(2.2 * cosR)

    this.registerBoxCollider(
      collisionSystem,
      x + cabinOffsetX,
      deckWorldY + 0.7,
      z + cabinOffsetZ,
      cabinColW,
      1.4,
      cabinColD,
      `${name}_Cabin`
    )

    return boatGroup
  }

  /**
   * Generates a bustling Indian bazaar street food or craft stall with walkable counter space
   */
  public static addMarketStall(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    x: number,
    z: number,
    rotY = 0,
    color1 = '#e76f51',
    color2 = '#f4a261',
    stallName = 'Market_Stall'
  ): void {
    const stallGroup = new THREE.Group()
    stallGroup.position.set(x, 0, z)
    stallGroup.rotation.y = rotY

    const woodMat = materials.getTimberWoodMaterial()
    const awningMat = materials.getBazaarAwningMaterial(color1, color2)

    // Wooden sales counter
    const counter = new THREE.Mesh(materials.boxGeometry, woodMat)
    counter.scale.set(3.4, 1.05, 1.6)
    counter.position.set(0, 0.525, 0)
    counter.castShadow = true
    counter.receiveShadow = true
    stallGroup.add(counter)

    // 4 Corner Timber Poles
    const poleMat = materials.getColorMaterial(0x4a3828, 0.8, 0.1)
    const pX = 1.6
    const pZ = 0.8
    for (const sx of [-pX, pX]) {
      for (const sz of [-pZ, pZ]) {
        const pole = new THREE.Mesh(materials.cylinderGeometry, poleMat)
        pole.scale.set(0.06, 2.6, 0.06)
        pole.position.set(sx, 1.3, sz)
        pole.castShadow = true
        stallGroup.add(pole)
      }
    }

    // Slanted striped awning canopy
    const canopy = new THREE.Mesh(materials.boxGeometry, awningMat)
    canopy.scale.set(3.8, 0.05, 2.2)
    canopy.position.set(0, 2.6, 0.1)
    canopy.rotation.x = 0.12
    canopy.castShadow = true
    stallGroup.add(canopy)

    // Crates & produce on counter
    const crate1 = new THREE.Mesh(materials.boxGeometry, materials.getCrateMaterial())
    crate1.scale.set(0.8, 0.4, 0.6)
    crate1.position.set(-0.9, 1.25, 0)
    stallGroup.add(crate1)

    // Fruit/spice pyramid pile
    const fruitMat = materials.getColorMaterial(0xf4a261, 0.6, 0.1)
    const fruitPile = new THREE.Mesh(materials.coneGeometry, fruitMat)
    fruitPile.scale.set(0.6, 0.5, 0.6)
    fruitPile.position.set(0.6, 1.3, 0)
    stallGroup.add(fruitPile)

    parent.add(stallGroup)

    // Collider covers ONLY the counter (leaving the street and rear completely walkable)
    const cosR = Math.cos(rotY)
    const sinR = Math.sin(rotY)
    const colW = Math.abs(3.4 * cosR) + Math.abs(1.6 * sinR)
    const colD = Math.abs(3.4 * sinR) + Math.abs(1.6 * cosR)

    this.registerBoxCollider(collisionSystem, x, 0.525, z, colW, 1.05, colD, stallName)
  }

  /**
   * Coastal Street Lamp with Victorian cast-iron marine luminaire
   */
  public static addStreetLamp(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    x: number,
    z: number,
    height = 5.2,
    name = 'Street_Lamp',
    y = 0
  ): void {
    const lampGroup = new THREE.Group()
    lampGroup.position.set(x, y, z)

    const proceduralGroup = new THREE.Group()
    lampGroup.add(proceduralGroup)

    const metalMat = materials.getColorMaterial(0x2f3640, 0.5, 0.6)
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xfffaed,
      emissive: 0xffd166,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    })

    const pole = new THREE.Mesh(materials.cylinderGeometry, metalMat)
    pole.scale.set(0.12, height, 0.12)
    pole.position.set(0, height / 2, 0)
    pole.castShadow = true
    proceduralGroup.add(pole)

    const base = new THREE.Mesh(materials.cylinderGeometry, metalMat)
    base.scale.set(0.3, 0.6, 0.3)
    base.position.set(0, 0.3, 0)
    proceduralGroup.add(base)

    const arm = new THREE.Mesh(materials.boxGeometry, metalMat)
    arm.scale.set(0.8, 0.08, 0.08)
    arm.position.set(0.35, height - 0.1, 0)
    proceduralGroup.add(arm)

    const lantern = new THREE.Mesh(materials.sphereGeometry, glowMat)
    lantern.scale.set(0.24, 0.32, 0.24)
    lantern.position.set(0.7, height - 0.28, 0)
    proceduralGroup.add(lantern)

    // Mount high-fidelity 3D GLB Victorian Coastal Streetlamp
    const scaleFactor = height / 5.4
    AssetLoader.getInstance().instantiate(
      'prop_coastal_streetlamp',
      lampGroup,
      0,
      0,
      0,
      0,
      scaleFactor,
      () => {
        lampGroup.remove(proceduralGroup)
        proceduralGroup.visible = false
      }
    )

    parent.add(lampGroup)

    this.registerBoxCollider(collisionSystem, x, y + height / 2, z, 0.4, height, 0.4, name)
  }

  /**
   * Adds an iconic Indian Bajaj-style Auto-Rickshaw vehicle prop
   */
  public static addAutoRickshaw(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    name = 'Auto_Rickshaw'
  ): THREE.Group {
    const rickshawGroup = AssetLoader.getInstance().instantiate(
      'prop_auto_rickshaw',
      parent,
      x,
      y,
      z,
      rotY
    )

    this.registerBoxCollider(
      collisionSystem,
      x,
      y + 0.85,
      z,
      1.4,
      1.7,
      2.7,
      name
    )

    return rickshawGroup
  }

  /**
   * Adds a high-quality Teak Wood and Cast-Iron Promenade Bench
   */
  public static addPromenadeBench(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    name = 'Promenade_Bench'
  ): THREE.Group {
    const benchGroup = AssetLoader.getInstance().instantiate(
      'prop_promenade_bench',
      parent,
      x,
      y,
      z,
      rotY
    )

    this.registerBoxCollider(
      collisionSystem,
      x,
      y + 0.4,
      z,
      2.2,
      0.8,
      0.8,
      name
    )

    return benchGroup
  }

  /**
   * Adds an Indian concrete roadside utility pole with transformer drum and crossarms
   */
  public static addUtilityPole(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    x: number,
    z: number,
    rotY = 0,
    name = 'Utility_Pole'
  ): THREE.Group {
    const poleGroup = AssetLoader.getInstance().instantiate(
      'prop_utility_pole',
      parent,
      x,
      0,
      z,
      rotY
    )

    this.registerBoxCollider(
      collisionSystem,
      x,
      3.9,
      z,
      0.6,
      7.8,
      0.6,
      name
    )

    return poleGroup
  }

  /**
   * Adds the high-fidelity Blender 5.3 Coastal Residence ArchViz building to Seaview Town,
   * fully integrating its 21 spatial collision boundaries with adapted step risers for
   * natural step-up locomotion to the elevated veranda.
   */
  public static addBlenderCoastalResidence(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    x: number,
    z: number,
    facing: 'N' | 'S' | 'E' | 'W' = 'S',
    name = 'Coastal_Residence_ArchViz'
  ): THREE.Group {
    const houseGroup = new THREE.Group()
    houseGroup.position.set(x, 0, z)

    let rotY = Math.PI // Default 'S' faces negative Z (toward avenue)
    if (facing === 'N') rotY = 0
    else if (facing === 'E') rotY = Math.PI / 2
    else if (facing === 'W') rotY = -Math.PI / 2
    houseGroup.rotation.y = rotY

    // 1. Procedural fallback group (ensures instant solid presence in Node.js headless tests)
    const proceduralGroup = new THREE.Group()
    houseGroup.add(proceduralGroup)

    const stuccoMat = materials.getStuccoMaterial('#efd395', '#802604')
    const roofMat = materials.getTerracottaRoofMaterial()
    const graniteMat = materials.getPromenadeTileMaterial()

    // Fallback main plinth
    const plinth = new THREE.Mesh(materials.boxGeometry, graniteMat)
    plinth.scale.set(8.8, 0.6, 11.2)
    plinth.position.set(0, 0.3, 0)
    proceduralGroup.add(plinth)

    // Fallback veranda plinth
    const veranda = new THREE.Mesh(materials.boxGeometry, graniteMat)
    veranda.scale.set(4.8, 0.6, 2.2)
    veranda.position.set(0, 0.3, 6.7)
    proceduralGroup.add(veranda)

    // Fallback house walls
    const walls = new THREE.Mesh(materials.boxGeometry, stuccoMat)
    walls.scale.set(8.8, 6.45, 11.2)
    walls.position.set(0, 0.6 + 6.45 / 2, 0)
    walls.castShadow = true
    proceduralGroup.add(walls)

    // Fallback roof
    const roof = new THREE.Mesh(materials.coneGeometry, roofMat)
    roof.scale.set(10.2, 2.8, 12.6)
    roof.position.set(0, 7.05 + 1.4, 0)
    roof.rotation.y = Math.PI / 4
    proceduralGroup.add(roof)

    // 2. Register the 21 spatial colliders synchronously
    this.registerBlenderCoastalResidenceColliders(collisionSystem, x, z, facing, name)

    // 3. Mount high-fidelity 3D GLB ArchViz asset
    AssetLoader.getInstance().instantiate(
      'coastal_residence',
      houseGroup,
      0,
      0,
      0,
      0,
      1.0,
      () => {
        houseGroup.remove(proceduralGroup)
        proceduralGroup.visible = false
      }
    )

    parent.add(houseGroup)
    return houseGroup
  }

  /**
   * Registers all 21 collision boundaries of the Blender Coastal Residence,
   * adapting the 3 entrance steps for smooth step-up locomotion (riser <= 0.20m)
   * onto the elevated front veranda.
   */
  public static registerBlenderCoastalResidenceColliders(
    collisionSystem: CollisionSystem,
    x: number,
    z: number,
    facing: 'N' | 'S' | 'E' | 'W' = 'S',
    name = 'Coastal_Residence'
  ): void {
    // 21 Local colliders defined in Blender GLB model space (+Z is front entrance)
    // Step heights adapted: Step 3 (outermost) = 0.20m, Step 2 (middle) = 0.40m, Step 1 (innermost) = 0.60m
    const localColliders: Array<{
      id: string
      min: [number, number, number]
      max: [number, number, number]
    }> = [
      { id: 'Balcony_Floor', min: [-2.50, 3.80, 5.60], max: [2.50, 4.05, 7.90] },
      { id: 'Balcony_Rail_Front', min: [-2.50, 4.05, 7.78], max: [2.50, 5.10, 7.90] },
      { id: 'Balcony_Rail_L', min: [-2.50, 4.05, 5.60], max: [-2.38, 5.10, 7.90] },
      { id: 'Balcony_Rail_R', min: [2.38, 4.05, 5.60], max: [2.50, 5.10, 7.90] },
      { id: 'Col_0', min: [-2.30, 0.60, 7.32], max: [-1.90, 3.55, 7.72] },
      { id: 'Col_1', min: [-0.95, 0.60, 7.32], max: [-0.55, 3.55, 7.72] },
      { id: 'Col_2', min: [0.55, 0.60, 7.32], max: [0.95, 3.55, 7.72] },
      { id: 'Col_3', min: [1.90, 0.60, 7.32], max: [2.30, 3.55, 7.72] },
      { id: 'Plinth', min: [-4.40, 0.00, -5.60], max: [4.40, 0.60, 5.60] },
      { id: 'Step_1', min: [-1.10, 0.00, 7.80], max: [1.10, 0.60, 8.15] },
      { id: 'Step_2', min: [-1.02, 0.00, 8.15], max: [1.02, 0.40, 8.50] },
      { id: 'Step_3', min: [-0.95, 0.00, 8.50], max: [0.95, 0.20, 8.85] },
      { id: 'Terrace_Parapet_B', min: [-4.40, 7.05, -5.62], max: [4.40, 8.00, -5.32] },
      { id: 'Terrace_Parapet_L', min: [-4.43, 7.05, -5.60], max: [-4.13, 8.00, -1.20] },
      { id: 'Terrace_Parapet_R', min: [4.13, 7.05, -5.60], max: [4.43, 8.00, -1.20] },
      { id: 'Veranda', min: [-2.40, 0.00, 5.60], max: [2.40, 0.60, 7.80] },
      { id: 'Wall_Back', min: [-4.40, 0.60, -5.60], max: [4.40, 7.05, -5.20] },
      { id: 'Wall_Front_L', min: [-4.40, 0.60, 5.20], max: [-2.40, 7.05, 5.60] },
      { id: 'Wall_Front_R', min: [2.40, 0.60, 5.20], max: [4.40, 7.05, 5.60] },
      { id: 'Wall_Left', min: [-4.40, 0.60, -5.60], max: [-4.00, 7.05, 5.60] },
      { id: 'Wall_Right', min: [4.00, 0.60, -5.60], max: [4.40, 7.05, 5.60] },
      { id: 'Front_Door_Facade', min: [-2.40, 0.60, 5.20], max: [2.40, 3.55, 5.60] },
    ]

    for (const c of localColliders) {
      let wMinX = 0, wMaxX = 0, wMinZ = 0, wMaxZ = 0
      const wMinY = c.min[1]
      const wMaxY = c.max[1]

      if (facing === 'S') {
        wMinX = x - c.max[0]
        wMaxX = x - c.min[0]
        wMinZ = z - c.max[2]
        wMaxZ = z - c.min[2]
      } else if (facing === 'N') {
        wMinX = x + c.min[0]
        wMaxX = x + c.max[0]
        wMinZ = z + c.min[2]
        wMaxZ = z + c.max[2]
      } else if (facing === 'E') {
        wMinX = x + c.min[2]
        wMaxX = x + c.max[2]
        wMinZ = z - c.max[0]
        wMaxZ = z - c.min[0]
      } else if (facing === 'W') {
        wMinX = x - c.max[2]
        wMaxX = x - c.min[2]
        wMinZ = z + c.min[0]
        wMaxZ = z + c.max[0]
      }

      collisionSystem.addCollider({
        id: `${name}_${c.id}_${Math.round(x)}_${Math.round(z)}`,
        box: new THREE.Box3(
          new THREE.Vector3(wMinX, wMinY, wMinZ),
          new THREE.Vector3(wMaxX, wMaxY, wMaxZ)
        ),
      })
    }
  }

  /**
   * Adds the high-fidelity Blender MCP Commercial Arcade (Asset 2) to Seaview Town Market Bazaar.
   * Features two ground-floor shops (Spice Mart & Chai/Textiles) behind an open covered colonnade
   * with smooth step-up locomotion (curb ramp step <= 0.18m).
   */
  public static addBlenderCommercialArcade(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    x: number,
    z: number,
    facing: 'N' | 'S' | 'E' | 'W' = 'W',
    name = 'Commercial_Arcade_South'
  ): THREE.Group {
    const arcadeGroup = new THREE.Group()
    arcadeGroup.position.set(x, 0, z)

    let rotY = Math.PI
    if (facing === 'N') rotY = 0
    else if (facing === 'E') rotY = Math.PI / 2
    else if (facing === 'W') rotY = -Math.PI / 2
    arcadeGroup.rotation.y = rotY

    // 1. Procedural fallback group (ensures instant presence in tests / before asset download)
    const proceduralGroup = new THREE.Group()
    arcadeGroup.add(proceduralGroup)

    const stuccoMat = materials.getStuccoMaterial('#faedcd', '#802604')
    const graniteMat = materials.getPromenadeTileMaterial()
    const roofMat = materials.getTerracottaRoofMaterial()

    // Fallback main plinth
    const plinth = new THREE.Mesh(materials.boxGeometry, graniteMat)
    plinth.scale.set(12.0, 0.35, 7.4)
    plinth.position.set(0, 0.175, -1.1)
    proceduralGroup.add(plinth)

    // Fallback arcade plinth
    const arcadePlinth = new THREE.Mesh(materials.boxGeometry, graniteMat)
    arcadePlinth.scale.set(12.0, 0.35, 2.2)
    arcadePlinth.position.set(0, 0.175, 3.7)
    proceduralGroup.add(arcadePlinth)

    // Fallback walls
    const walls = new THREE.Mesh(materials.boxGeometry, stuccoMat)
    walls.scale.set(12.0, 7.35, 9.6)
    walls.position.set(0, 0.35 + 7.35 / 2, 0)
    walls.castShadow = true
    proceduralGroup.add(walls)

    // Fallback roof
    const roof = new THREE.Mesh(materials.coneGeometry, roofMat)
    roof.scale.set(13.0, 2.5, 10.5)
    roof.position.set(0, 8.0 + 1.25, 0)
    proceduralGroup.add(roof)

    // 2. Register all 23 collision boundaries synchronously
    this.registerBlenderCommercialArcadeColliders(collisionSystem, x, z, facing, name)

    // 3. Mount high-fidelity 3D GLB asset
    AssetLoader.getInstance().instantiate(
      'building_commercial_arcade_01',
      arcadeGroup,
      0,
      0,
      0,
      0,
      1.0,
      () => {
        arcadeGroup.remove(proceduralGroup)
        proceduralGroup.visible = false
      }
    )

    parent.add(arcadeGroup)
    return arcadeGroup
  }

  /**
   * Registers all 23 collision boundaries of the Blender Commercial Arcade,
   * supporting walk-in exploration of the covered colonnade gallery and
   * solid shopfront barriers.
   */
  public static registerBlenderCommercialArcadeColliders(
    collisionSystem: CollisionSystem,
    x: number,
    z: number,
    facing: 'N' | 'S' | 'E' | 'W' = 'W',
    name = 'Commercial_Arcade'
  ): void {
    const localColliders: Array<{
      id: string
      min: [number, number, number]
      max: [number, number, number]
    }> = [
      { id: 'Arcade_Plinth', min: [-6.00, 0.00, 2.60], max: [6.00, 0.35, 4.80] },
      { id: 'Curb_Ramp', min: [-6.00, 0.00, 4.80], max: [6.00, 0.17, 5.20] },
      { id: 'Main_Plinth', min: [-6.00, 0.00, -4.80], max: [6.00, 0.35, 2.60] },
      { id: 'Pier_L', min: [-6.05, 0.18, 4.05], max: [-5.25, 3.77, 4.85] },
      { id: 'Pier_C', min: [-0.40, 0.18, 4.05], max: [0.40, 3.77, 4.85] },
      { id: 'Pier_R', min: [5.25, 0.18, 4.05], max: [6.05, 3.77, 4.85] },
      { id: 'Shop_A_Backwall', min: [-5.42, 0.18, 2.40], max: [-0.23, 3.77, 2.80] },
      { id: 'Shop_A_Counter', min: [-5.42, 0.35, 2.10], max: [-0.23, 1.50, 2.70] },
      { id: 'Shop_B_Storefront', min: [0.23, 0.18, 2.40], max: [5.42, 3.77, 2.80] },
      { id: 'Divider_Wall', min: [-0.20, 0.18, -4.80], max: [0.20, 3.77, 2.60] },
      { id: 'Wall_Left', min: [-6.00, 0.17, -4.80], max: [-5.60, 7.67, 4.80] },
      { id: 'Wall_Right', min: [5.60, 0.17, -4.80], max: [6.00, 7.67, 4.80] },
      { id: 'Wall_Back', min: [-6.00, 0.17, -4.80], max: [6.00, 7.67, -4.40] },
      { id: 'Balcony_Floor_L', min: [-4.65, 4.10, 4.40], max: [-1.05, 4.35, 5.80] },
      { id: 'Balcony_Floor_R', min: [1.05, 4.10, 4.40], max: [4.65, 4.35, 5.80] },
      { id: 'Balcony_Rail_Front_L', min: [-4.65, 4.35, 5.67], max: [-1.05, 5.40, 5.83] },
      { id: 'Balcony_Rail_Front_R', min: [1.05, 4.35, 5.67], max: [4.65, 5.40, 5.83] },
      { id: 'Balcony_Rail_Side_L1', min: [-4.67, 4.35, 4.40], max: [-4.52, 5.40, 5.80] },
      { id: 'Balcony_Rail_Side_L2', min: [-1.18, 4.35, 4.40], max: [-1.03, 5.40, 5.80] },
      { id: 'Balcony_Rail_Side_R1', min: [1.03, 4.35, 4.40], max: [1.18, 5.40, 5.80] },
      { id: 'Balcony_Rail_Side_R2', min: [4.52, 4.35, 4.40], max: [4.67, 5.40, 5.80] },
      { id: 'Parapet_Front', min: [-6.00, 8.00, 4.25], max: [6.00, 9.20, 4.65] },
      { id: 'Parapet_Back', min: [-6.00, 8.00, -4.80], max: [6.00, 9.00, -4.40] },
    ]

    for (const c of localColliders) {
      let wMinX = 0, wMaxX = 0, wMinZ = 0, wMaxZ = 0
      const wMinY = c.min[1]
      const wMaxY = c.max[1]

      if (facing === 'S') {
        wMinX = x - c.max[0]
        wMaxX = x - c.min[0]
        wMinZ = z - c.max[2]
        wMaxZ = z - c.min[2]
      } else if (facing === 'N') {
        wMinX = x + c.min[0]
        wMaxX = x + c.max[0]
        wMinZ = z + c.min[2]
        wMaxZ = z + c.max[2]
      } else if (facing === 'E') {
        wMinX = x + c.min[2]
        wMaxX = x + c.max[2]
        wMinZ = z - c.max[0]
        wMaxZ = z - c.min[0]
      } else if (facing === 'W') {
        wMinX = x - c.max[2]
        wMaxX = x - c.min[2]
        wMinZ = z + c.min[0]
        wMaxZ = z + c.max[0]
      }

      collisionSystem.addCollider({
        id: `${name}_${c.id}_${Math.round(x)}_${Math.round(z)}`,
        box: new THREE.Box3(
          new THREE.Vector3(wMinX, wMinY, wMinZ),
          new THREE.Vector3(wMaxX, wMaxY, wMaxZ)
        ),
      })
    }
  }

  /**
   * Adds the high-fidelity Blender MCP Indian Street Shop Cluster (Asset 3) to Seaview Town Market Bazaar.
   * Features 4 commercial shopfronts: Chai Stall, Kirana General Store, Pharmacy, and Mobile Accessories
   * on a shared granite plinth with smooth step-up locomotion (curb step rise <= 0.15m).
   */
  public static addBlenderShopCluster(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    x: number,
    z: number,
    facing: 'N' | 'S' | 'E' | 'W' = 'E',
    name = 'Shop_Cluster_West'
  ): THREE.Group {
    const clusterGroup = new THREE.Group()
    clusterGroup.position.set(x, 0, z)

    let rotY = Math.PI
    if (facing === 'N') rotY = 0
    else if (facing === 'E') rotY = Math.PI / 2
    else if (facing === 'W') rotY = -Math.PI / 2
    clusterGroup.rotation.y = rotY

    // 1. Procedural fallback group (ensures instant presence in tests / before asset download)
    const proceduralGroup = new THREE.Group()
    clusterGroup.add(proceduralGroup)

    const stuccoMat = materials.getStuccoMaterial('#faedcd', '#802604')
    const graniteMat = materials.getPromenadeTileMaterial()
    const roofMat = materials.getTerracottaRoofMaterial()

    // Fallback main plinth
    const plinth = new THREE.Mesh(materials.boxGeometry, graniteMat)
    plinth.scale.set(14.0, 0.30, 8.4)
    plinth.position.set(0, 0.15, 0.0)
    proceduralGroup.add(plinth)

    // Fallback building walls
    const walls = new THREE.Mesh(materials.boxGeometry, stuccoMat)
    walls.scale.set(14.0, 4.20, 6.2)
    walls.position.set(0, 0.30 + 4.20 / 2, -1.1)
    walls.castShadow = true
    proceduralGroup.add(walls)

    // Fallback roof
    const roof = new THREE.Mesh(materials.coneGeometry, roofMat)
    roof.scale.set(15.0, 1.8, 7.2)
    roof.position.set(0, 4.5 + 0.9, -1.1)
    proceduralGroup.add(roof)

    // 2. Register all 21 collision boundaries synchronously
    this.registerBlenderShopClusterColliders(collisionSystem, x, z, facing, name)

    // 3. Mount high-fidelity 3D GLB asset
    AssetLoader.getInstance().instantiate(
      'building_shop_cluster_01',
      clusterGroup,
      0,
      0,
      0,
      0,
      1.0,
      () => {
        clusterGroup.remove(proceduralGroup)
        proceduralGroup.visible = false
      }
    )

    parent.add(clusterGroup)
    return clusterGroup
  }

  /**
   * Registers all 21 collision boundaries of the Blender Indian Street Shop Cluster,
   * supporting step-up access onto the granite plinth walkway in front of all 4 shops.
   */
  public static registerBlenderShopClusterColliders(
    collisionSystem: CollisionSystem,
    x: number,
    z: number,
    facing: 'N' | 'S' | 'E' | 'W' = 'E',
    name = 'Shop_Cluster'
  ): void {
    const localColliders: Array<{
      id: string
      min: [number, number, number]
      max: [number, number, number]
    }> = [
      { id: 'Building_Plinth', min: [-7.00, 0.00, -4.20], max: [7.00, 0.30, 2.00] },
      { id: 'Curb_Step', min: [-7.00, 0.00, 4.20], max: [7.00, 0.15, 4.50] },
      { id: 'Walkway_Plinth', min: [-7.00, 0.00, 2.00], max: [7.00, 0.30, 4.20] },
      { id: 'Chai_Bench', min: [-6.25, 0.30, 3.60], max: [-4.45, 0.78, 4.00] },
      { id: 'Crates', min: [6.37, 0.30, 3.57], max: [6.82, 0.95, 4.02] },
      { id: 'Chai_Counter', min: [-6.70, 0.30, 1.72], max: [-4.00, 1.25, 2.47] },
      { id: 'Kirana_Counter', min: [-3.25, 0.30, 1.80], max: [-0.45, 1.45, 2.50] },
      { id: 'Pharm_Counter', min: [0.45, 0.30, 1.77], max: [3.05, 1.45, 2.42] },
      { id: 'Mobile_Counter', min: [3.95, 0.30, 1.77], max: [6.55, 1.45, 2.42] },
      { id: 'Pier_0', min: [-7.00, 0.30, 1.80], max: [-6.65, 3.50, 2.20] },
      { id: 'Pier_1', min: [-3.88, 0.30, 1.80], max: [-3.53, 3.50, 2.20] },
      { id: 'Pier_2', min: [-0.17, 0.30, 1.80], max: [0.17, 3.50, 2.20] },
      { id: 'Pier_3', min: [3.33, 0.30, 1.80], max: [3.67, 3.50, 2.20] },
      { id: 'Pier_4', min: [6.65, 0.30, 1.80], max: [7.00, 3.50, 2.20] },
      { id: 'Divider_1', min: [-3.85, 0.30, -4.20], max: [-3.55, 4.50, 2.00] },
      { id: 'Divider_2', min: [-0.15, 0.30, -4.20], max: [0.15, 4.50, 2.00] },
      { id: 'Divider_3', min: [3.35, 0.30, -4.20], max: [3.65, 4.50, 2.00] },
      { id: 'Wall_Back', min: [-7.00, 0.30, -4.20], max: [7.00, 4.50, -3.85] },
      { id: 'Wall_Left', min: [-7.00, 0.30, -4.20], max: [-6.65, 4.50, 2.00] },
      { id: 'Wall_Right', min: [6.65, 0.30, -4.20], max: [7.00, 4.50, 2.00] },
      { id: 'Roof_Parapet', min: [-7.00, 4.50, 1.78], max: [7.00, 5.00, 2.22] },
    ]

    for (const c of localColliders) {
      let wMinX = 0, wMaxX = 0, wMinZ = 0, wMaxZ = 0
      const wMinY = c.min[1]
      const wMaxY = c.max[1]

      if (facing === 'S') {
        wMinX = x - c.max[0]
        wMaxX = x - c.min[0]
        wMinZ = z - c.max[2]
        wMaxZ = z - c.min[2]
      } else if (facing === 'N') {
        wMinX = x + c.min[0]
        wMaxX = x + c.max[0]
        wMinZ = z + c.min[2]
        wMaxZ = z + c.max[2]
      } else if (facing === 'E') {
        wMinX = x + c.min[2]
        wMaxX = x + c.max[2]
        wMinZ = z - c.max[0]
        wMaxZ = z - c.min[0]
      } else if (facing === 'W') {
        wMinX = x - c.max[2]
        wMaxX = x - c.min[2]
        wMinZ = z + c.min[0]
        wMaxZ = z + c.max[0]
      }

      collisionSystem.addCollider({
        id: `${name}_${c.id}_${Math.round(x)}_${Math.round(z)}`,
        box: new THREE.Box3(
          new THREE.Vector3(wMinX, wMinY, wMinZ),
          new THREE.Vector3(wMaxX, wMaxY, wMaxZ)
        ),
      })
    }
  }

  /**
   * Asset 4: Market Bazaar Street Environment Pack Helpers
   */
  public static addBlenderScooter(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    x: number,
    z: number,
    rotY = 0,
    name = 'Blender_Scooter'
  ): THREE.Group {
    const anchor = AssetLoader.getInstance().instantiate(
      'prop_indian_scooter_01',
      parent,
      x,
      0,
      z,
      rotY
    )
    this.registerBoxCollider(collisionSystem, x, 0.55, z, 0.8, 1.1, 0.8, name)
    return anchor
  }

  public static addBlenderBicycle(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    x: number,
    z: number,
    rotY = 0,
    name = 'Blender_Bicycle'
  ): THREE.Group {
    const anchor = AssetLoader.getInstance().instantiate(
      'prop_delivery_bicycle_01',
      parent,
      x,
      0,
      z,
      rotY
    )
    this.registerBoxCollider(collisionSystem, x, 0.52, z, 0.6, 1.05, 1.0, name)
    return anchor
  }

  public static addBlenderDrainageGutter(
    parent: THREE.Group,
    _collisionSystem: CollisionSystem,
    x: number,
    z: number,
    rotY = 0
  ): THREE.Group {
    // Low curb step (0.15m), walkable without blocking colliders
    return AssetLoader.getInstance().instantiate(
      'prop_market_drainage_01',
      parent,
      x,
      0,
      z,
      rotY
    )
  }

  public static addBlenderWasteBins(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    x: number,
    z: number,
    rotY = 0,
    name = 'Blender_WasteBins'
  ): THREE.Group {
    const anchor = AssetLoader.getInstance().instantiate(
      'prop_municipal_waste_bins_01',
      parent,
      x,
      0,
      z,
      rotY
    )
    this.registerBoxCollider(collisionSystem, x, 0.55, z, 0.85, 1.1, 0.5, name)
    return anchor
  }

  public static addBlenderPlanter(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    x: number,
    z: number,
    rotY = 0,
    name = 'Blender_Planter',
    y = 0
  ): THREE.Group {
    const anchor = AssetLoader.getInstance().instantiate(
      'prop_terracotta_planter_01',
      parent,
      x,
      y,
      z,
      rotY
    )
    this.registerBoxCollider(collisionSystem, x, y + 0.6, z, 0.65, 1.2, 0.65, name)
    return anchor
  }

  /**
   * Adds an authentic Indian coastal public foot-wash tap station for beach sand rinse
   */
  public static addFootWashStation(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    name = 'Foot_Wash_Station'
  ): THREE.Group {
    const stationGroup = new THREE.Group()
    stationGroup.position.set(x, y, z)
    stationGroup.rotation.y = rotY

    const graniteMat = materials.getColorMaterial(0x64748b, 0.4, 0.1)
    const chromeMat = materials.getColorMaterial(0xe2e8f0, 0.2, 0.8)
    const basinMat = materials.getColorMaterial(0x334155, 0.3, 0.3)

    // Granite vertical tap pedestal
    const pedestal = new THREE.Mesh(materials.boxGeometry, graniteMat)
    pedestal.scale.set(0.45, 0.90, 0.45)
    pedestal.position.set(0, 0.45, 0)
    pedestal.castShadow = true
    stationGroup.add(pedestal)

    // Chrome press-action water tap fixture
    const tapPipe = new THREE.Mesh(materials.cylinderGeometry, chromeMat)
    tapPipe.scale.set(0.04, 0.20, 0.04)
    tapPipe.position.set(0, 0.75, 0.25)
    tapPipe.rotation.x = Math.PI / 4
    stationGroup.add(tapPipe)

    // Stainless steel lower foot wash basin & sand drain
    const basin = new THREE.Mesh(materials.boxGeometry, basinMat)
    basin.scale.set(0.75, 0.08, 0.75)
    basin.position.set(0, 0.04, 0.35)
    basin.receiveShadow = true
    stationGroup.add(basin)

    parent.add(stationGroup)

    this.registerBoxCollider(
      collisionSystem,
      x,
      y + 0.45,
      z + 0.15,
      0.75,
      0.90,
      0.75,
      name
    )

    return stationGroup
  }

  public static addBlenderVendorSign(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    x: number,
    z: number,
    rotY = 0,
    name = 'Blender_VendorSign'
  ): THREE.Group {
    const anchor = AssetLoader.getInstance().instantiate(
      'prop_vendor_sign_01',
      parent,
      x,
      0,
      z,
      rotY
    )
    this.registerBoxCollider(collisionSystem, x, 0.52, z, 0.65, 1.05, 0.55, name)
    return anchor
  }

  public static addBlenderElectricalFeeder(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    x: number,
    z: number,
    rotY = 0,
    name = 'Blender_ElectricalFeeder'
  ): THREE.Group {
    const anchor = AssetLoader.getInstance().instantiate(
      'prop_electrical_feeder_01',
      parent,
      x,
      0,
      z,
      rotY
    )
    this.registerBoxCollider(collisionSystem, x, 0.62, z, 0.7, 1.25, 0.5, name)
    return anchor
  }

  /**
   * Instantiates the high-fidelity Blender 5.3 MCP Indian Coastal Wooden Fishing Boat (Dhoni / Nava) - Asset 6.
   * Features authentic compound-curved wooden hull, walkable teak deck, mid-aft wheelhouse cabin,
   * fishing nets, hauling capstan winch, buoys, crates, and boarding gap matching Gangway 1.
   */
  public static addBlenderIndianDhoniBoat(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    name = 'Fishing_Boat_Sea_Queen'
  ): THREE.Group {
    const boatGroup = new THREE.Group()
    boatGroup.position.set(x, y, z)
    boatGroup.rotation.y = rotY

    // 1. Procedural fallback group (removed when GLB mounts)
    const proceduralGroup = new THREE.Group()
    boatGroup.add(proceduralGroup)

    const hullMat = materials.getBoatHullMaterial('#046671', '#d90429')
    const woodMat = materials.getTimberWoodMaterial()
    const fallbackHull = new THREE.Mesh(materials.boxGeometry, hullMat)
    fallbackHull.scale.set(3.4, 1.8, 10.5)
    fallbackHull.position.set(0, 0.9, 0)
    proceduralGroup.add(fallbackHull)

    const fallbackDeck = new THREE.Mesh(materials.boxGeometry, woodMat)
    fallbackDeck.scale.set(3.0, 0.15, 9.8)
    fallbackDeck.position.set(0, 1.25, 0)
    proceduralGroup.add(fallbackDeck)

    // 2. Synchronous collision registration
    this.registerBlenderIndianDhoniBoatColliders(collisionSystem, x, y, z, rotY, name)

    // 3. Mount high-fidelity 3D GLB model
    AssetLoader.getInstance().instantiate(
      'prop_indian_dhoni_boat_01',
      boatGroup,
      0,
      0,
      0,
      0,
      1.0,
      () => {
        boatGroup.remove(proceduralGroup)
        proceduralGroup.visible = false
      }
    )

    parent.add(boatGroup)
    return boatGroup
  }

  /**
   * Registers all 5 collision boundaries for the Blender Indian Dhoni boat:
   * - Walkable Deck collider (flush with Gangway 1 at Y = 0.35m)
   * - Wheelhouse Cabin solid obstacle collider
   * - Port Bulwark barrier
   * - Starboard Aft Bulwark barrier
   * - Starboard Forward Bulwark barrier (preserving Gangway 1 boarding passage)
   */
  public static registerBlenderIndianDhoniBoatColliders(
    collisionSystem: CollisionSystem,
    x: number,
    y: number,
    z: number,
    rotY: number,
    name: string
  ): void {
    const cosR = Math.abs(Math.cos(rotY))
    const sinR = Math.abs(Math.sin(rotY))
    const actualCos = Math.cos(rotY)
    const actualSin = Math.sin(rotY)

    // 1. Walkable Deck Collider
    const deckColW = 3.0 * cosR + 9.8 * sinR
    const deckColD = 3.0 * sinR + 9.8 * cosR
    this.registerBoxCollider(
      collisionSystem,
      x,
      y + 1.15,
      z,
      deckColW,
      0.20,
      deckColD,
      `${name}_Deck`
    )

    // 2. Wheelhouse Cabin Collider (local center: 0, 2.10, -0.65; size: 1.90, 1.72, 2.50)
    const cabinOffsetX = -0.65 * actualSin
    const cabinOffsetZ = -0.65 * actualCos
    const cabinColW = 1.90 * cosR + 2.50 * sinR
    const cabinColD = 1.90 * sinR + 2.50 * cosR
    this.registerBoxCollider(
      collisionSystem,
      x + cabinOffsetX,
      y + 2.10,
      z + cabinOffsetZ,
      cabinColW,
      1.72,
      cabinColD,
      `${name}_Cabin`
    )

    // 3. Port Gunwale Bulwark Collider (local center: -1.58, 1.55, 0.0; size: 0.28, 0.65, 9.60)
    const portOffsetX = -1.58 * actualCos
    const portOffsetZ = 1.58 * actualSin
    const portColW = 0.28 * cosR + 9.60 * sinR
    const portColD = 0.28 * sinR + 9.60 * cosR
    this.registerBoxCollider(
      collisionSystem,
      x + portOffsetX,
      y + 1.55,
      z + portOffsetZ,
      portColW,
      0.65,
      portColD,
      `${name}_Gunwale_Port`
    )

    // 4. Starboard Aft Gunwale Collider (local center: 1.58, 1.55, -2.20; size: 0.28, 0.65, 4.40)
    const starAftOffsetX = 1.58 * actualCos + 2.20 * actualSin
    const starAftOffsetZ = -1.58 * actualSin - 2.20 * actualCos
    const starAftColW = 0.28 * cosR + 4.40 * sinR
    const starAftColD = 0.28 * sinR + 4.40 * cosR
    this.registerBoxCollider(
      collisionSystem,
      x + starAftOffsetX,
      y + 1.55,
      z + starAftOffsetZ,
      starAftColW,
      0.65,
      starAftColD,
      `${name}_Gunwale_Star_Aft`
    )

    // 5. Starboard Forward Gunwale Collider (local center: 1.58, 1.55, 4.10; size: 0.28, 0.65, 1.80)
    // Leaves wide clear boarding passage (World Z: 70.0 to 73.2) around Gangway 1 at Z = 72.0!
    const starFwdOffsetX = 1.58 * actualCos - 4.10 * actualSin
    const starFwdOffsetZ = -1.58 * actualSin + 4.10 * actualCos
    const starFwdColW = 0.28 * cosR + 1.80 * sinR
    const starFwdColD = 0.28 * sinR + 1.80 * cosR
    this.registerBoxCollider(
      collisionSystem,
      x + starFwdOffsetX,
      y + 1.55,
      z + starFwdOffsetZ,
      starFwdColW,
      0.65,
      starFwdColD,
      `${name}_Gunwale_Star_Fwd`
    )
  }

  /**
   * Instantiates the high-fidelity Blender 5.3 MCP Fishery Cold Storage & Processing Warehouse (Asset 7).
   * Features insulated concrete architecture, raised 1.20m loading dock, accessible stair ramps,
   * 6.0m central loading entrance, refrigeration condenser chiller banks, and marine cold storage props.
   */
  public static addBlenderFisheryColdStorage(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    x = -24,
    y = 0,
    z = 75,
    rotY = 0,
    name = 'Fishery_Cold_Storage'
  ): THREE.Group {
    const warehouseGroup = new THREE.Group()
    warehouseGroup.position.set(x, y, z)
    warehouseGroup.rotation.y = rotY

    // 1. Procedural fallback group (instant presence in tests and while GLB streams)
    const proceduralGroup = new THREE.Group()
    warehouseGroup.add(proceduralGroup)

    const floorMat = materials.getSidewalkMaterial()
    const wallMat = materials.getStuccoMaterial('#d6dcd8', '#4a5d6e')
    const roofMat = materials.getTerracottaRoofMaterial()

    // Fallback interior floor (height 1.20m)
    const floor = new THREE.Mesh(materials.boxGeometry, floorMat)
    floor.scale.set(15.5, 1.2, 21.0)
    floor.position.set(0.25, 0.6, 0.0)
    proceduralGroup.add(floor)

    // Fallback loading dock (height 1.20m)
    const dock = new THREE.Mesh(materials.boxGeometry, floorMat)
    dock.scale.set(2.0, 1.2, 18.0)
    dock.position.set(-8.5, 0.6, 0.0)
    proceduralGroup.add(dock)

    // Fallback North Wall
    const wallN = new THREE.Mesh(materials.boxGeometry, wallMat)
    wallN.scale.set(16.0, 5.3, 1.0)
    wallN.position.set(0.25, 3.85, 10.5)
    wallN.castShadow = true
    proceduralGroup.add(wallN)

    // Fallback South Wall
    const wallS = new THREE.Mesh(materials.boxGeometry, wallMat)
    wallS.scale.set(16.0, 5.3, 1.0)
    wallS.position.set(0.25, 3.85, -10.5)
    wallS.castShadow = true
    proceduralGroup.add(wallS)

    // Fallback East Wall
    const wallE = new THREE.Mesh(materials.boxGeometry, wallMat)
    wallE.scale.set(1.0, 5.3, 22.0)
    wallE.position.set(8.0, 3.85, 0.0)
    wallE.castShadow = true
    proceduralGroup.add(wallE)

    // Fallback West Wall South Wing
    const wallWS = new THREE.Mesh(materials.boxGeometry, wallMat)
    wallWS.scale.set(1.0, 5.3, 7.5)
    wallWS.position.set(-7.5, 3.85, -6.75)
    wallWS.castShadow = true
    proceduralGroup.add(wallWS)

    // Fallback West Wall North Wing
    const wallWN = new THREE.Mesh(materials.boxGeometry, wallMat)
    wallWN.scale.set(1.0, 5.3, 7.5)
    wallWN.position.set(-7.5, 3.85, 6.75)
    wallWN.castShadow = true
    proceduralGroup.add(wallWN)

    // Fallback West Wall Doorway Header
    const wallHeader = new THREE.Mesh(materials.boxGeometry, wallMat)
    wallHeader.scale.set(1.0, 1.7, 6.0)
    wallHeader.position.set(-7.5, 5.65, 0.0)
    proceduralGroup.add(wallHeader)

    // Fallback roof
    const roof = new THREE.Mesh(materials.boxGeometry, roofMat)
    roof.scale.set(17.0, 0.4, 23.0)
    roof.position.set(0.25, 6.7, 0.0)
    roof.rotation.z = 0.05
    roof.castShadow = true
    proceduralGroup.add(roof)

    // Fallback stairs steps
    const southStepLen = 3.5 / 4
    for (let i = 0; i < 4; i++) {
      const stepH = (i + 1) * 0.20
      const stepZ = -12.0 + i * southStepLen + southStepLen / 2
      const stepMesh = new THREE.Mesh(materials.boxGeometry, floorMat)
      stepMesh.scale.set(2.0, stepH, southStepLen)
      stepMesh.position.set(-8.5, 0.40 + stepH / 2, stepZ)
      proceduralGroup.add(stepMesh)
    }

    const northStepLen = 3.5 / 4
    for (let i = 0; i < 4; i++) {
      const stepH = (i + 1) * 0.20
      const stepZ = 12.0 - i * northStepLen - northStepLen / 2
      const stepMesh = new THREE.Mesh(materials.boxGeometry, floorMat)
      stepMesh.scale.set(2.0, stepH, northStepLen)
      stepMesh.position.set(-8.5, 0.40 + stepH / 2, stepZ)
      proceduralGroup.add(stepMesh)
    }

    // 2. Synchronous collision registration
    this.registerBlenderFisheryColdStorageColliders(collisionSystem, x, y, z, rotY, name)

    // 3. Mount high-fidelity 3D GLB asset
    AssetLoader.getInstance().instantiate(
      'building_fishery_cold_storage_01',
      warehouseGroup,
      0,
      0,
      0,
      0,
      1.0,
      () => {
        warehouseGroup.remove(proceduralGroup)
      }
    )

    parent.add(warehouseGroup)
    return warehouseGroup
  }

  /**
   * Registers all 10 simplified collision boundaries for the Fishery Cold Storage Warehouse.
   */
  public static registerBlenderFisheryColdStorageColliders(
    collisionSystem: CollisionSystem,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    name = 'Fishery_Cold_Storage'
  ): void {
    // 1. Walkable Interior Floor (x: -24, z: 75, width: 14, height: 1.2, depth: 20)
    this.registerBoxCollider(
      collisionSystem,
      x,
      0.60,
      z,
      14.0,
      1.20,
      20.0,
      `${name}_Interior_Floor`
    )

    // 2. Walkable Loading Bay Dock (x: -33, z: 75, width: 2, height: 1.2, depth: 18)
    this.registerBoxCollider(
      collisionSystem,
      x - 9.0,
      0.60,
      z,
      2.0,
      1.20,
      18.0,
      `${name}_Loading_Dock`
    )

    // 3. Accessible South Stairs (startZ = 66.0, length = 3.5m, rising along Z+ from 66.0 to 69.5)
    const southStepLen = 3.5 / 4
    for (let i = 0; i < 4; i++) {
      const stepH = (i + 1) * 0.20
      const stepZ = (z - 9.0) + i * southStepLen + southStepLen / 2
      this.registerBoxCollider(
        collisionSystem,
        x - 9.0,
        0.40 + stepH / 2,
        stepZ,
        2.0,
        stepH,
        southStepLen,
        `${name}_Dock_Stairs_South_${i}`
      )
    }

    // 4. Accessible North Stairs (startZ = 84.0, length = 3.5m, rising along Z- from 84.0 to 80.5)
    const northStepLen = 3.5 / 4
    for (let i = 0; i < 4; i++) {
      const stepH = (i + 1) * 0.20
      const stepZ = (z + 9.0) - i * northStepLen - northStepLen / 2
      this.registerBoxCollider(
        collisionSystem,
        x - 9.0,
        0.40 + stepH / 2,
        stepZ,
        2.0,
        stepH,
        northStepLen,
        `${name}_Dock_Stairs_North_${i}`
      )
    }

    // 5. Solid North Wall (x: -24, z: 85.5)
    this.registerBoxCollider(
      collisionSystem,
      x,
      3.85,
      z + 10.5,
      16.0,
      5.30,
      1.0,
      `${name}_Wall_North`
    )

    // 6. Solid South Wall (x: -24, z: 64.5)
    this.registerBoxCollider(
      collisionSystem,
      x,
      3.85,
      z - 10.5,
      16.0,
      5.30,
      1.0,
      `${name}_Wall_South`
    )

    // 7. Solid East Wall (x: -15.5, z: 75)
    this.registerBoxCollider(
      collisionSystem,
      x + 8.5,
      3.85,
      z,
      1.0,
      5.30,
      22.0,
      `${name}_Wall_East`
    )

    // 8. Solid West Wall South Wing (x: -31.5, z: 68.25)
    this.registerBoxCollider(
      collisionSystem,
      x - 7.5,
      3.85,
      z - 6.75,
      1.0,
      5.30,
      7.50,
      `${name}_Wall_West_South`
    )

    // 9. Solid West Wall North Wing (x: -31.5, z: 81.75)
    this.registerBoxCollider(
      collisionSystem,
      x - 7.5,
      3.85,
      z + 6.75,
      1.0,
      5.30,
      7.50,
      `${name}_Wall_West_North`
    )

    // 10. West Wall Doorway Header (above Z: 72 to 78, leaves Y: 1.20 to 4.80 open)
    this.registerBoxCollider(
      collisionSystem,
      x - 7.5,
      5.65,
      z,
      1.0,
      1.70,
      6.0,
      `${name}_Door_Header`
    )

    // 11. Outdoor Commercial Chiller Equipment Pad (x: -20.25, z: 64.2)
    this.registerBoxCollider(
      collisionSystem,
      x + 3.75,
      0.90,
      z - 10.8,
      5.5,
      1.80,
      2.0,
      `${name}_Chillers`
    )
  }

  /**
   * Instantiates the high-fidelity Blender 5.3 MCP Fish Auction Pavilion (Asset 8).
   * Features open-sided reinforced concrete & steel architecture, 0.40m washable floor plinth,
   * raised 0.65m central auction stage, 4 stainless steel fish grading tables with ice beds,
   * hanging clock dial scales, stacked multi-colored fish crates, insulated ice totes (ISOTERM),
   * water washdown stations with hoses, and bilingual signboard:
   * "సముద్ర చేపల వేలం కేంద్రం / SEAVIEW FISH AUCTION CENTRE".
   */
  public static addBlenderFishAuctionPavilion(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    x = -24,
    y = 0,
    z = 96,
    rotY = 0,
    name = 'Fish_Auction_Pavilion'
  ): THREE.Group {
    const pavilionGroup = new THREE.Group()
    pavilionGroup.position.set(x, y, z)
    pavilionGroup.rotation.y = rotY

    // 1. Procedural fallback group (instant presence in tests and while GLB streams)
    const proceduralGroup = new THREE.Group()
    pavilionGroup.add(proceduralGroup)

    const floorMat = materials.getSidewalkMaterial()
    const pillarMat = materials.getStuccoMaterial('#d6dcd8', '#4a5d6e')
    const roofMat = materials.getColorMaterial(0x3d5a80, 0.7, 0.3)
    const tableMat = materials.getColorMaterial(0x8a9ba8, 0.3, 0.8)

    // Fallback washable floor plinth (16m x 16m x 0.40m)
    const floor = new THREE.Mesh(materials.boxGeometry, floorMat)
    floor.scale.set(16.0, 0.40, 16.0)
    floor.position.set(0.0, 0.20, 0.0)
    floor.receiveShadow = true
    proceduralGroup.add(floor)

    // Fallback raised central auction stage (4.2m x 3.2m x 0.25m)
    const stage = new THREE.Mesh(materials.boxGeometry, floorMat)
    stage.scale.set(4.20, 0.25, 3.20)
    stage.position.set(0.0, 0.525, 0.0)
    stage.receiveShadow = true
    proceduralGroup.add(stage)

    // Fallback perimeter columns
    const colCoords: [number, number][] = [
      [-7.4, -7.4], [0.0, -7.4], [7.4, -7.4],
      [-7.4, 7.4],  [0.0, 7.4],  [7.4, 7.4],
      [-7.4, -2.5], [-7.4, 2.5],
      [7.4, -2.5],  [7.4, 2.5]
    ]
    for (const [cx, cz] of colCoords) {
      const colMesh = new THREE.Mesh(materials.boxGeometry, pillarMat)
      colMesh.scale.set(0.50, 3.80, 0.50)
      colMesh.position.set(cx, 0.40 + 1.90, cz)
      colMesh.castShadow = true
      proceduralGroup.add(colMesh)
    }

    // Fallback 4 sorting tables
    const tableCoords: [number, number][] = [
      [-4.2, -4.0], [4.2, -4.0],
      [-4.2, 4.0],  [4.2, 4.0]
    ]
    for (const [tx, tz] of tableCoords) {
      const tableMesh = new THREE.Mesh(materials.boxGeometry, tableMat)
      tableMesh.scale.set(3.20, 0.85, 1.40)
      tableMesh.position.set(tx, 0.40 + 0.425, tz)
      tableMesh.castShadow = true
      proceduralGroup.add(tableMesh)
    }

    // Fallback pitched roof
    const roofMesh = new THREE.Mesh(materials.boxGeometry, roofMat)
    roofMesh.scale.set(17.2, 0.35, 17.2)
    roofMesh.position.set(0.0, 4.80, 0.0)
    roofMesh.castShadow = true
    proceduralGroup.add(roofMesh)

    // 2. Synchronous collision registration
    this.registerBlenderFishAuctionPavilionColliders(collisionSystem, x, y, z, rotY, name)

    // 3. Mount high-fidelity 3D GLB asset
    AssetLoader.getInstance().instantiate(
      'building_fish_auction_pavilion_01',
      pavilionGroup,
      0,
      0,
      0,
      0,
      1.0,
      () => {
        pavilionGroup.remove(proceduralGroup)
      }
    )

    parent.add(pavilionGroup)
    return pavilionGroup
  }

  /**
   * Registers simplified collision boundaries for the Fish Auction Pavilion.
   * Ensures all auction lanes, entrance breezeways, and sorting aisles remain fully walkable.
   */
  public static registerBlenderFishAuctionPavilionColliders(
    collisionSystem: CollisionSystem,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    name = 'Fish_Auction_Pavilion'
  ): void {
    // 1. Walkable Foundation Floor Plinth (height 0.40m, matching wharf height)
    this.registerBoxCollider(
      collisionSystem,
      x,
      y + 0.20,
      z,
      16.0,
      0.40,
      16.0,
      `${name}_Floor`
    )

    // 2. Walkable Raised Central Auction Stage (height 0.65m; smooth 0.25m step-up)
    this.registerBoxCollider(
      collisionSystem,
      x,
      y + 0.525,
      z,
      4.20,
      0.25,
      3.20,
      `${name}_Stage`
    )

    // 3. Solid Auctioneer Desk & Bench (on stage)
    this.registerBoxCollider(
      collisionSystem,
      x,
      y + 1.15,
      z - 0.85,
      1.80,
      1.00,
      0.90,
      `${name}_Desk`
    )

    // 4. Solid Sorting & Grading Tables (4 tables)
    this.registerBoxCollider(
      collisionSystem,
      x - 4.2,
      y + 0.85,
      z - 4.0,
      3.20,
      0.90,
      1.40,
      `${name}_Table_NW`
    )
    this.registerBoxCollider(
      collisionSystem,
      x + 4.2,
      y + 0.85,
      z - 4.0,
      3.20,
      0.90,
      1.40,
      `${name}_Table_NE`
    )
    this.registerBoxCollider(
      collisionSystem,
      x - 4.2,
      y + 0.85,
      z + 4.0,
      3.20,
      0.90,
      1.40,
      `${name}_Table_SW`
    )
    this.registerBoxCollider(
      collisionSystem,
      x + 4.2,
      y + 0.85,
      z + 4.0,
      3.20,
      0.90,
      1.40,
      `${name}_Table_SE`
    )

    // 5. Solid Perimeter Columns (10 columns, leaving huge breezeway openings)
    const colCoords: [number, number, string][] = [
      [-7.4, -7.4, 'Col_NW'],
      [0.0, -7.4,  'Col_N'],
      [7.4, -7.4,  'Col_NE'],
      [-7.4, 7.4,  'Col_SW'],
      [0.0, 7.4,   'Col_S'],
      [7.4, 7.4,   'Col_SE'],
      [-7.4, -2.5, 'Col_W_North'],
      [-7.4, 2.5,  'Col_W_South'],
      [7.4, -2.5,  'Col_E_North'],
      [7.4, 2.5,   'Col_E_South']
    ]

    for (const [cx, cz, colId] of colCoords) {
      this.registerBoxCollider(
        collisionSystem,
        x + cx,
        y + 2.30,
        z + cz,
        0.55,
        3.80,
        0.55,
        `${name}_${colId}`
      )
    }
  }

  /**
   * Creates realistic sagging electrical cables between two world points
   */
  public static addOverheadCable(
    parent: THREE.Group,
    materials: MaterialFactory,
    start: THREE.Vector3,
    end: THREE.Vector3,
    sag = 0.45
  ): THREE.Mesh {
    const mid = start.clone().lerp(end, 0.5)
    mid.y -= sag

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
    const points = curve.getPoints(12)
    const tubeGeom = new THREE.TubeGeometry(curve, 12, 0.02, 4, false)
    const cableMat = materials.getColorMaterial(0x1a1a1a, 0.85, 0.05)
    const cableMesh = new THREE.Mesh(tubeGeom, cableMat)
    cableMesh.castShadow = true
    parent.add(cableMesh)
    return cableMesh
  }

  /**
   * Instantiates the high-fidelity Blender 5.3 MCP Fishermen's Cooperative Building (Asset 9).
   * Features authentic Andhra Pradesh coastal architecture, Mangalore-tiled pitched roof,
   * shaded front veranda, non-slip terrazzo floor, reception counter, clerk registration desk,
   * notice board, file storage cabinets, and covered net repair / marine gear storage bay.
   */
  public static addBlenderFishermenCooperative(
    parent: THREE.Group,
    collisionSystem: CollisionSystem,
    materials: MaterialFactory,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    name = 'Fishermen_Cooperative'
  ): THREE.Group {
    const coopGroup = new THREE.Group()
    coopGroup.position.set(x, y, z)
    coopGroup.rotation.y = rotY

    // 1. Procedural fallback group (instant presence while GLB streams)
    const proceduralGroup = new THREE.Group()
    coopGroup.add(proceduralGroup)

    const plinthMat = materials.getColorMaterial(0x8d99ae, 0.8, 0.1)
    const wallMat = materials.getStuccoMaterial('#f4f1de', '#e07a5f')
    const roofMat = materials.getColorMaterial(0xb23a22, 0.75, 0.15)

    // Fallback foundation plinth
    const plinth = new THREE.Mesh(materials.boxGeometry, plinthMat)
    plinth.scale.set(14.0, 0.40, 13.0)
    plinth.position.set(0.0, 0.20, 0.0)
    plinth.receiveShadow = true
    proceduralGroup.add(plinth)

    // Fallback main walls
    const walls = new THREE.Mesh(materials.boxGeometry, wallMat)
    walls.scale.set(10.5, 3.4, 9.0)
    walls.position.set(1.25, 2.10, -1.0)
    walls.castShadow = true
    walls.receiveShadow = true
    proceduralGroup.add(walls)

    // Fallback roof
    const roof = new THREE.Mesh(materials.boxGeometry, roofMat)
    roof.scale.set(12.0, 0.40, 11.0)
    roof.position.set(1.25, 4.20, -1.0)
    roof.castShadow = true
    proceduralGroup.add(roof)

    // 2. Synchronous collision registration
    this.registerBlenderFishermenCooperativeColliders(collisionSystem, x, y, z, rotY, name)

    // 3. Mount high-fidelity 3D GLB asset
    AssetLoader.getInstance().instantiate(
      'building_fishermen_cooperative_01',
      coopGroup,
      0,
      0,
      0,
      0,
      1.0,
      () => {
        coopGroup.remove(proceduralGroup)
      }
    )

    parent.add(coopGroup)
    return coopGroup
  }

  /**
   * Registers simplified collision boundaries for the Fishermen's Cooperative Building.
   * Ensures front veranda, entrance doorway, interior office, and net storage bay remain accessible.
   */
  public static registerBlenderFishermenCooperativeColliders(
    collisionSystem: CollisionSystem,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    name = 'Fishermen_Cooperative'
  ): void {
    // 1. Walkable Foundation Plinth (height 0.40m, matching wharf height)
    this.registerBoxCollider(
      collisionSystem,
      x,
      y + 0.20,
      z,
      14.0,
      0.40,
      13.0,
      `${name}_Plinth`
    )

    // 2. Main Building Perimeter Solid Walls
    // East wall (rear)
    this.registerBoxCollider(
      collisionSystem,
      x + 6.5,
      y + 2.10,
      z + 1.0,
      0.35,
      3.40,
      9.0,
      `${name}_Wall_East`
    )

    // South wall
    this.registerBoxCollider(
      collisionSystem,
      x + 1.25,
      y + 2.10,
      z + 5.5,
      10.5,
      3.40,
      0.35,
      `${name}_Wall_South`
    )

    // North interior dividing wall
    this.registerBoxCollider(
      collisionSystem,
      x + 2.25,
      y + 2.10,
      z - 3.5,
      8.5,
      3.40,
      0.35,
      `${name}_Wall_North_Div`
    )

    // West Front Wall Wings (flanking central 2.4m doorway)
    this.registerBoxCollider(
      collisionSystem,
      x - 4.0,
      y + 2.10,
      z + 3.35,
      0.35,
      3.40,
      4.30,
      `${name}_Wall_West_South`
    )

    this.registerBoxCollider(
      collisionSystem,
      x - 4.0,
      y + 2.10,
      z - 2.35,
      0.35,
      3.40,
      2.30,
      `${name}_Wall_West_North`
    )

    // 3. Veranda Pillars (4 pillars along X = -6.8)
    const colZ = [-5.0, -1.8, 1.8, 5.0]
    for (let i = 0; i < colZ.length; i++) {
      this.registerBoxCollider(
        collisionSystem,
        x - 6.8,
        y + 1.80,
        z + colZ[i],
        0.50,
        2.80,
        0.50,
        `${name}_Pillar_${i}`
      )
    }

    // 4. Interior Counters and Furniture
    // L-Shaped Service Counter
    this.registerBoxCollider(
      collisionSystem,
      x + 0.0,
      y + 1.00,
      z + 1.8,
      3.20,
      1.20,
      0.85,
      `${name}_Reception_Counter`
    )
    this.registerBoxCollider(
      collisionSystem,
      x + 1.2,
      y + 1.00,
      z + 0.65,
      0.75,
      1.20,
      1.80,
      `${name}_Counter_Return`
    )

    // Document Shelves & Filing Cabinet
    this.registerBoxCollider(
      collisionSystem,
      x + 6.15,
      y + 1.40,
      z + 2.0,
      0.50,
      2.00,
      2.20,
      `${name}_Doc_Shelves`
    )
    this.registerBoxCollider(
      collisionSystem,
      x + 6.15,
      y + 1.10,
      z + 4.2,
      0.65,
      1.40,
      0.95,
      `${name}_Filing_Cabinet`
    )

    // Inspection Table
    this.registerBoxCollider(
      collisionSystem,
      x - 3.2,
      y + 0.90,
      z - 1.8,
      1.05,
      1.00,
      1.25,
      `${name}_Inspection_Table`
    )

    // 5. Net Bay Pallets
    this.registerBoxCollider(
      collisionSystem,
      x + 0.5,
      y + 0.80,
      z - 4.8,
      1.50,
      0.80,
      1.90,
      `${name}_Net_Pallet_1`
    )
    this.registerBoxCollider(
      collisionSystem,
      x + 3.2,
      y + 0.80,
      z - 4.8,
      1.50,
      0.80,
      1.90,
      `${name}_Net_Pallet_2`
    )
  }
}
