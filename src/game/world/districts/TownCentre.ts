import * as THREE from 'three'
import type { MaterialFactory } from '../MaterialFactory'
import type { CollisionSystem } from '../../physics/CollisionSystem'
import { DistrictHelper } from './DistrictHelper'

export class TownCentre {
  public readonly group = new THREE.Group()
  private beaconLight: THREE.PointLight | null = null
  private beaconPivot: THREE.Group | null = null

  constructor(materials: MaterialFactory, collisionSystem: CollisionSystem) {
    this.build(materials, collisionSystem)
  }

  private build(materials: MaterialFactory, collisionSystem: CollisionSystem): void {
    const plazaTileMat = materials.getPromenadeTileMaterial()
    const lighthouseMat = materials.getLighthouseMaterial()
    const stoneMat = materials.getColorMaterial(0x8d99ae, 0.6, 0.2)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.6,
    })
    const beaconGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffe600,
      emissive: 0xffaa00,
      emissiveIntensity: 2.5,
      roughness: 0.1,
    })
    const woodMat = materials.getTimberWoodMaterial()
    const metalMat = materials.getColorMaterial(0x2b2d42, 0.4, 0.6)

    // 1. Central Plaza Platform (X: 0, Z: 0, 28m x 28m)
    const plaza = new THREE.Mesh(materials.boxGeometry, plazaTileMat)
    plaza.scale.set(30, 0.35, 30)
    plaza.position.set(0, 0.175, 0)
    plaza.receiveShadow = true
    this.group.add(plaza)

    // 2. The Seaview Lighthouse Landmark (Center at X: 0, Z: -5)
    // Lighthouse Octagonal Stone Foundation Base (8m x 8m, height: 4m)
    const baseH = 4.0
    const base = new THREE.Mesh(materials.cylinderGeometry, stoneMat)
    base.scale.set(4.2, baseH, 4.2)
    base.position.set(0, baseH / 2, -5)
    base.castShadow = true
    base.receiveShadow = true
    this.group.add(base)

    // Lighthouse Main Tapered Tower (Height: 20m, radius: 3.2m to 2.2m)
    const towerH = 20.0
    const tower = new THREE.Mesh(materials.cylinderGeometry, lighthouseMat)
    tower.scale.set(2.8, towerH, 2.8)
    tower.position.set(0, baseH + towerH / 2, -5)
    tower.castShadow = true
    this.group.add(tower)

    // Observation Gallery Walkway (Height: 0.6m, width: 6.8m)
    const galleryY = baseH + towerH
    const gallery = new THREE.Mesh(materials.cylinderGeometry, stoneMat)
    gallery.scale.set(3.6, 0.6, 3.6)
    gallery.position.set(0, galleryY + 0.3, -5)
    gallery.castShadow = true
    this.group.add(gallery)

    // Gallery Metal Safety Railing
    const railing = new THREE.Mesh(materials.cylinderGeometry, metalMat)
    railing.scale.set(3.6, 1.1, 3.6)
    railing.position.set(0, galleryY + 1.1, -5)
    this.group.add(railing)

    // Glass Lantern Room (Height: 3.2m)
    const lanternY = galleryY + 0.6
    const lantern = new THREE.Mesh(materials.cylinderGeometry, glassMat)
    lantern.scale.set(2.2, 3.0, 2.2)
    lantern.position.set(0, lanternY + 1.5, -5)
    this.group.add(lantern)

    // Lighthouse Conical Copper Dome Roof
    const domeMat = materials.getColorMaterial(0x2a9d8f, 0.4, 0.5)
    const dome = new THREE.Mesh(materials.coneGeometry, domeMat)
    dome.scale.set(2.8, 2.2, 2.8)
    dome.position.set(0, lanternY + 3.0 + 1.1, -5)
    dome.castShadow = true
    this.group.add(dome)

    // Revolving Light Beacon Emitter
    this.beaconPivot = new THREE.Group()
    this.beaconPivot.position.set(0, lanternY + 1.5, -5)

    const beaconBulb = new THREE.Mesh(materials.sphereGeometry, beaconGlowMat)
    beaconBulb.scale.set(0.6, 0.6, 0.6)
    this.beaconPivot.add(beaconBulb)

    this.group.add(this.beaconPivot)

    // Register Lighthouse Solid Box Collider
    DistrictHelper.registerBoxCollider(
      collisionSystem,
      0,
      (baseH + towerH + 6) / 2,
      -5,
      6.4,
      baseH + towerH + 6,
      6.4,
      'Seaview_Lighthouse'
    )

    // 3. Stately Royal Palms in the Plaza Corners
    const plazaPalms = [
      [10, 10],
      [-10, 10],
      [10, -10],
      [-10, -10],
    ]

    for (let i = 0; i < plazaPalms.length; i++) {
      const [px, pz] = plazaPalms[i]
      DistrictHelper.addCoconutPalm(
        this.group,
        collisionSystem,
        materials,
        px,
        pz,
        8.5,
        0.08,
        (i * Math.PI) / 2,
        `Plaza_Palm_${i}`
      )
    }

    // 4. Teak Wood Plaza Benches
    const benches = [
      [6, 0.3, 6, 0],
      [-6, 0.3, 6, 0],
      [6, 0.3, -6, Math.PI],
      [-6, 0.3, -6, Math.PI],
    ]

    for (let i = 0; i < benches.length; i++) {
      const [bx, by, bz, rot] = benches[i]
      const bench = DistrictHelper.addStaticBox(
        this.group,
        collisionSystem,
        materials,
        bx,
        by,
        bz,
        2.2,
        0.5,
        0.8,
        woodMat,
        `Plaza_Bench_${i}`
      )
      bench.rotation.y = rot
    }

    // 5. Colonial Streetlamps at Plaza Perimeters
    for (const [lx, lz] of [[12, 0], [-12, 0], [0, 12], [0, -14]]) {
      DistrictHelper.addStreetLamp(
        this.group,
        collisionSystem,
        materials,
        lx,
        lz,
        5.2,
        `TownCentre_Lamp_${lx}_${lz}`
      )
    }
  }

  public updateBeacon(dt: number): void {
    if (this.beaconPivot) {
      this.beaconPivot.rotation.y += dt * 1.5
    }
  }

  public dispose(): void {
    if (this.beaconLight) {
      this.group.remove(this.beaconLight)
      this.beaconLight.dispose()
      this.beaconLight = null
    }
  }
}
