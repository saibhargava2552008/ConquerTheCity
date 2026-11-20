import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { MaterialFactory } from '../MaterialFactory'
import type { CollisionSystem } from '../../physics/CollisionSystem'
import { DistrictHelper } from './DistrictHelper'

export class RoadNetwork {
  public readonly group = new THREE.Group()

  constructor(materials: MaterialFactory, collisionSystem: CollisionSystem) {
    this.build(materials, collisionSystem)
  }

  private build(materials: MaterialFactory, collisionSystem: CollisionSystem): void {
    const roadMat = materials.getRoadMaterial()
    const sidewalkMat = materials.getSidewalkMaterial()
    const promenadeMat = materials.getPromenadeTileMaterial()
    const railingMat = materials.getColorMaterial(0xd8d8d8, 0.5, 0.2)

    // 1. Coastal Marine Promenade (North-South, X: -20, Z: -110 to 110, width: 8m)
    const promenadeMesh = new THREE.Mesh(materials.boxGeometry, promenadeMat)
    promenadeMesh.scale.set(8, 0.25, 220)
    promenadeMesh.position.set(-20, 0.125, 0)
    promenadeMesh.receiveShadow = true
    this.group.add(promenadeMesh)

    // Promenade Sea-Facing Stone Balustrade / Railing with pedestrian and vehicle access openings:
    // - Central Grand Beach Stairway opening at Z in [-6, 6] (12m opening)
    // - South Beach access opening at Z in [-43, -37] (6m opening)
    // - North Beach access opening at Z in [17, 23] (6m opening)
    // - North Harbour Road access opening at Z in [44, 56] (12m opening for harbour connection)
    const railingSegments: [number, number, string][] = [
      [-76.5, 67, 'Promenade_Railing_SouthEnd'], // Z: -110 to -43 (length 67)
      [-21.5, 31, 'Promenade_Railing_MidSouth'], // Z: -37 to -6 (length 31)
      [11.5, 11, 'Promenade_Railing_MidNorth'],  // Z: 6 to 17 (length 11)
      [33.5, 21, 'Promenade_Railing_HarbourSouth'], // Z: 23 to 44 (length 21)
      [83.0, 54, 'Promenade_Railing_NorthEnd'],  // Z: 56 to 110 (length 54)
    ]

    for (const [cz, len, colName] of railingSegments) {
      const railSeg = new THREE.Mesh(materials.boxGeometry, railingMat)
      railSeg.scale.set(0.4, 0.9, len)
      railSeg.position.set(-23.8, 0.7, cz)
      railSeg.castShadow = true
      this.group.add(railSeg)

      DistrictHelper.registerBoxCollider(
        collisionSystem,
        -23.8,
        0.7,
        cz,
        0.5,
        1.1,
        len,
        colName
      )
    }

    // Decorative balustrade end pillars at each pedestrian and road opening
    const openingPillars = [-43, -37, -6, 6, 17, 23, 44, 56]
    for (let p = 0; p < openingPillars.length; p++) {
      const pz = openingPillars[p]
      const pillar = new THREE.Mesh(materials.boxGeometry, railingMat)
      pillar.scale.set(0.65, 1.15, 0.65)
      pillar.position.set(-23.8, 0.75, pz)
      pillar.castShadow = true
      this.group.add(pillar)

      DistrictHelper.registerBoxCollider(
        collisionSystem,
        -23.8,
        0.75,
        pz,
        0.7,
        1.2,
        0.7,
        `Promenade_Gate_Pillar_${p}`
      )
    }

    // 2. Main Coastal Boulevard (North-South 2-lane road parallel to promenade, X: -10, Z: -110 to 110)
    const coastalBlvd = new THREE.Mesh(materials.boxGeometry, roadMat)
    coastalBlvd.scale.set(12, 0.05, 220)
    coastalBlvd.position.set(-10, 0.025, 0)
    coastalBlvd.receiveShadow = true
    this.group.add(coastalBlvd)

    // 3. Central East-West Boulevard (from Promenade X: -16 to Countryside X: 90, Z: 0, width: 12m)
    const centralBlvd = new THREE.Mesh(materials.boxGeometry, roadMat)
    centralBlvd.scale.set(106, 0.05, 12)
    centralBlvd.position.set(37, 0.026, 0)
    centralBlvd.receiveShadow = true
    this.group.add(centralBlvd)

    // Sidewalks along Central East-West Boulevard
    const centralSideNorth = new THREE.Mesh(materials.boxGeometry, sidewalkMat)
    centralSideNorth.scale.set(106, 0.2, 2.5)
    centralSideNorth.position.set(37, 0.1, 7.25)
    centralSideNorth.receiveShadow = true
    this.group.add(centralSideNorth)

    const centralSideSouth = new THREE.Mesh(materials.boxGeometry, sidewalkMat)
    centralSideSouth.scale.set(106, 0.2, 2.5)
    centralSideSouth.position.set(37, 0.1, -7.25)
    centralSideSouth.receiveShadow = true
    this.group.add(centralSideSouth)

    // 4. North Harbour Access Road (X: -10 to -34, Z: 50, width: 10m)
    const harbourRoad = new THREE.Mesh(materials.boxGeometry, roadMat)
    harbourRoad.scale.set(24, 0.05, 10)
    harbourRoad.position.set(-22, 0.027, 50)
    harbourRoad.receiveShadow = true
    this.group.add(harbourRoad)

    // 5. Market Connector Street (X: 10 to 38, Z: 20, width: 9m)
    const marketRoad = new THREE.Mesh(materials.boxGeometry, roadMat)
    marketRoad.scale.set(28, 0.05, 9)
    marketRoad.position.set(24, 0.027, 20)
    marketRoad.receiveShadow = true
    this.group.add(marketRoad)

    // 6. Market Central Access Road (North-South, connecting Central Blvd Z: 6 directly to Bazaar St Z: 20 at X: 38)
    const marketCentralAccess = new THREE.Mesh(materials.boxGeometry, roadMat)
    marketCentralAccess.scale.set(14, 0.05, 14)
    marketCentralAccess.position.set(38, 0.027, 13)
    marketCentralAccess.receiveShadow = true
    this.group.add(marketCentralAccess)

    const marketSideEast = new THREE.Mesh(materials.boxGeometry, sidewalkMat)
    marketSideEast.scale.set(2, 0.2, 14)
    marketSideEast.position.set(46, 0.1, 13)
    marketSideEast.receiveShadow = true
    this.group.add(marketSideEast)

    const marketSideWest = new THREE.Mesh(materials.boxGeometry, sidewalkMat)
    marketSideWest.scale.set(2, 0.2, 14)
    marketSideWest.position.set(30, 0.1, 13)
    marketSideWest.receiveShadow = true
    this.group.add(marketSideWest)

    // 7. Residential North-South Connector Boulevard (X: 12, Z: -6 to -50, width: 10m)
    const resConnector = new THREE.Mesh(materials.boxGeometry, roadMat)
    resConnector.scale.set(10, 0.05, 44)
    resConnector.position.set(12, 0.026, -28)
    resConnector.receiveShadow = true
    this.group.add(resConnector)

    const resConnSideEast = new THREE.Mesh(materials.boxGeometry, sidewalkMat)
    resConnSideEast.scale.set(2, 0.2, 44)
    resConnSideEast.position.set(18, 0.1, -28)
    resConnSideEast.receiveShadow = true
    this.group.add(resConnSideEast)

    const resConnSideWest = new THREE.Mesh(materials.boxGeometry, sidewalkMat)
    resConnSideWest.scale.set(2, 0.2, 44)
    resConnSideWest.position.set(6, 0.1, -28)
    resConnSideWest.receiveShadow = true
    this.group.add(resConnSideWest)

    // 8. Promenade South to Residential Avenue Connector (X: -10 to 10, Z: -50, width: 10m)
    const resSouthLink = new THREE.Mesh(materials.boxGeometry, roadMat)
    resSouthLink.scale.set(20, 0.05, 10)
    resSouthLink.position.set(0, 0.026, -50)
    resSouthLink.receiveShadow = true
    this.group.add(resSouthLink)

    const resSouthSideN = new THREE.Mesh(materials.boxGeometry, sidewalkMat)
    resSouthSideN.scale.set(20, 0.2, 2.5)
    resSouthSideN.position.set(0, 0.1, -43.75)
    resSouthSideN.receiveShadow = true
    this.group.add(resSouthSideN)

    const resSouthSideS = new THREE.Mesh(materials.boxGeometry, sidewalkMat)
    resSouthSideS.scale.set(20, 0.2, 2.5)
    resSouthSideS.position.set(0, 0.1, -56.25)
    resSouthSideS.receiveShadow = true
    this.group.add(resSouthSideS)

    // 9. Promenade Ocean-Facing Benches & Streetlamps
    for (let z = -90; z <= 90; z += 24) {
      // Skip bench if within or near pedestrian beach access openings
      const nearOpening =
        Math.abs(z) <= 8 || (z >= -46 && z <= -34) || (z >= 14 && z <= 26)
      if (!nearOpening) {
        DistrictHelper.addPromenadeBench(
          this.group,
          collisionSystem,
          -22.5,
          0.25,
          z,
          Math.PI / 2,
          `Promenade_Bench_${z}`
        )
      }

      // Promenade Streetlamp
      DistrictHelper.addStreetLamp(
        this.group,
        collisionSystem,
        materials,
        -16.5,
        z + 12,
        5.2,
        `Promenade_Lamp_${z}`
      )
    }

    // Streetlamps along Main Coastal Boulevard (East side of road at X: -3.5)
    for (let z = -100; z <= 100; z += 30) {
      if (Math.abs(z) > 14) {
        // Skip right at intersection
        DistrictHelper.addStreetLamp(
          this.group,
          collisionSystem,
          materials,
          -3.5,
          z,
          5.2,
          `Coastal_Blvd_Lamp_${z}`
        )
      }
    }

    // 10. Parked Auto-Rickshaws along Coastal Boulevard roadside stands
    DistrictHelper.addAutoRickshaw(
      this.group,
      collisionSystem,
      -3.8,
      0,
      -32,
      0,
      'Coastal_Blvd_Rickshaw_South'
    )
    DistrictHelper.addAutoRickshaw(
      this.group,
      collisionSystem,
      -3.8,
      0,
      36,
      0,
      'Coastal_Blvd_Rickshaw_North'
    )

    // 11. Concrete Utility Poles along the roadside infrastructure strip
    DistrictHelper.addUtilityPole(
      this.group,
      collisionSystem,
      -3.8,
      -70,
      0,
      'Coastal_Blvd_Utility_Pole_South'
    )
    DistrictHelper.addUtilityPole(
      this.group,
      collisionSystem,
      -3.8,
      70,
      0,
      'Coastal_Blvd_Utility_Pole_North'
    )

    // 12. Realistic PBR Road Surface Markings & Zebra Pedestrian Crossings
    this.buildRoadMarkings(materials)
  }

  private buildRoadMarkings(_materials: MaterialFactory): void {
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8f9fa,
      roughness: 0.45,
      metalness: 0.05,
    })
    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xfdb813,
      roughness: 0.45,
      metalness: 0.05,
    })
    const drainGrateMat = new THREE.MeshStandardMaterial({
      color: 0x212529,
      roughness: 0.55,
      metalness: 0.8,
    })

    const Y_MARKING = 0.038 // Elevated above road level (0.025m) to ensure sharp visibility without z-fighting

    const whiteGeos: THREE.BufferGeometry[] = []
    const yellowGeos: THREE.BufferGeometry[] = []
    const grateGeos: THREE.BufferGeometry[] = []

    const addBox = (
      list: THREE.BufferGeometry[],
      sx: number,
      sy: number,
      sz: number,
      px: number,
      py: number,
      pz: number
    ) => {
      const geo = new THREE.BoxGeometry(sx, sy, sz)
      geo.translate(px, py, pz)
      list.push(geo)
    }

    // A. White Dashed Centerlines
    // 1. Coastal Boulevard North-South Dashed Centerline (X: -10, Z: -105 to 105)
    for (let z = -105; z <= 105; z += 6.0) {
      if (Math.abs(z) < 14 || (z >= 44 && z <= 56) || (z <= -44 && z >= -56)) continue
      addBox(whiteGeos, 0.18, 0.01, 3.2, -10, Y_MARKING, z)
    }

    // 2. Central Boulevard East-West Dashed Centerline (Z: 0, X: 5 to 88)
    for (let x = 6; x <= 86; x += 6.0) {
      if (x < 16) continue
      addBox(whiteGeos, 3.2, 0.01, 0.18, x, Y_MARKING, 0)
    }

    // 3. Residential Connector Dashed Centerline (X: 12, Z: -12 to -46)
    for (let z = -12; z >= -46; z -= 5.0) {
      addBox(whiteGeos, 0.18, 0.01, 2.6, 12, Y_MARKING, z)
    }

    // B. Solid White Edge Lines
    const edgeLength = 80
    for (const zCenter of [-60, 60]) {
      for (const xEdge of [-15.2, -4.8]) {
        addBox(whiteGeos, 0.15, 0.01, edgeLength, xEdge, Y_MARKING, zCenter)
      }
    }

    for (const zEdge of [-5.2, 5.2]) {
      addBox(whiteGeos, 70, 0.01, 0.15, 52, Y_MARKING, zEdge)
    }

    // C. Realistic Zebra Pedestrian Crossings
    this.appendZebraCrossing(whiteGeos, -10, 0, 10.4, 3.2, false)
    this.appendZebraCrossing(whiteGeos, -10, -40, 10.4, 2.8, false)
    this.appendZebraCrossing(whiteGeos, -10, 20, 10.4, 2.8, false)
    this.appendZebraCrossing(whiteGeos, 18, 0, 10.4, 3.0, true)

    // D. Yellow Curb Loading Zones
    for (const zCurb of [-28, 32]) {
      addBox(yellowGeos, 0.2, 0.01, 8.0, -4.2, Y_MARKING, zCurb)
    }

    // E. Storm Drain Grates along Boulevard Gutter Curbs
    for (const zGrate of [-80, -50, -20, 20, 50, 80]) {
      addBox(grateGeos, 0.85, 0.02, 0.55, -4.3, Y_MARKING, zGrate)
    }

    // Merge all white road markings into 1 mesh
    if (whiteGeos.length > 0) {
      const mergedWhite = BufferGeometryUtils.mergeGeometries(whiteGeos, false)
      if (mergedWhite) {
        const whiteMesh = new THREE.Mesh(mergedWhite, whiteMat)
        whiteMesh.receiveShadow = true
        whiteMesh.castShadow = false
        this.group.add(whiteMesh)
      }
    }

    // Merge all yellow road markings into 1 mesh
    if (yellowGeos.length > 0) {
      const mergedYellow = BufferGeometryUtils.mergeGeometries(yellowGeos, false)
      if (mergedYellow) {
        const yellowMesh = new THREE.Mesh(mergedYellow, yellowMat)
        yellowMesh.receiveShadow = true
        yellowMesh.castShadow = false
        this.group.add(yellowMesh)
      }
    }

    // Merge all storm drain grates into 1 mesh
    if (grateGeos.length > 0) {
      const mergedGrates = BufferGeometryUtils.mergeGeometries(grateGeos, false)
      if (mergedGrates) {
        const grateMesh = new THREE.Mesh(mergedGrates, drainGrateMat)
        grateMesh.receiveShadow = true
        grateMesh.castShadow = false
        this.group.add(grateMesh)
      }
    }
  }

  private appendZebraCrossing(
    geoList: THREE.BufferGeometry[],
    cx: number,
    cz: number,
    roadSpan: number,
    stripeLength: number,
    isAcrossEW: boolean
  ): void {
    const stripeWidth = 0.5
    const gap = 0.4
    const step = stripeWidth + gap
    const numStripes = Math.floor(roadSpan / step)
    const startOffset = -((numStripes - 1) * step) / 2

    for (let i = 0; i < numStripes; i++) {
      const offset = startOffset + i * step
      const sx = isAcrossEW ? stripeLength : stripeWidth
      const sz = isAcrossEW ? stripeWidth : stripeLength
      const px = isAcrossEW ? cx : cx + offset
      const pz = isAcrossEW ? cz + offset : cz
      const geo = new THREE.BoxGeometry(sx, 0.01, sz)
      geo.translate(px, 0.038, pz)
      geoList.push(geo)
    }
  }

  public dispose(): void {
    // Handled by parent
  }
}
