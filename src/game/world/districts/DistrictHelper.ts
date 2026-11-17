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
    name = 'Street_Lamp'
  ): void {
    const lampGroup = new THREE.Group()
    lampGroup.position.set(x, 0, z)

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
        proceduralGroup.visible = false
      }
    )

    parent.add(lampGroup)

    this.registerBoxCollider(collisionSystem, x, height / 2, z, 0.4, height, 0.4, name)
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
}
