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

    // 1. Coastal Marine Promenade Concourse (South Belvedere at Z: -128 to North Terminus at Z: 44)
    // 1a. Straight Concourse (X: -24 to -16, Z: -122 to 44, width 8m, height 0.25m, deck surface at Y = 0.25m)
    const straightPromGeo = new THREE.BoxGeometry(8, 0.25, 166)
    straightPromGeo.translate(-20, 0.125, -39)

    // 1b. Southern Rounded Scenic Belvedere (Radius 6m centered at X: -20, Z: -122, protruding seaward and to Z: -128)
    const belvedereGeo = new THREE.CylinderGeometry(6.0, 6.0, 0.25, 32)
    belvedereGeo.translate(-20, 0.125, -122)

    const mergedPromGeo = BufferGeometryUtils.mergeGeometries([straightPromGeo, belvedereGeo])
    const promenadeMesh = new THREE.Mesh(mergedPromGeo || straightPromGeo, promenadeMat)
    promenadeMesh.receiveShadow = true
    this.group.add(promenadeMesh)

    // Register Walkable Promenade Colliders
    DistrictHelper.registerBoxCollider(
      collisionSystem,
      -20,
      0.125,
      -39,
      8,
      0.25,
      166,
      'Promenade_Concourse_Straight'
    )

    DistrictHelper.registerBoxCollider(
      collisionSystem,
      -20,
      0.125,
      -123,
      12,
      0.25,
      10,
      'Promenade_Belvedere_Platform'
    )

    // Belvedere Southern Steps down to natural sand dunes at Z = -128.0 (2 steps, Y: 0.10m to 0.25m)
    DistrictHelper.addStairs(
      this.group,
      collisionSystem,
      materials,
      -20.0,
      0.0,
      -128.0,
      3.2,
      0.25,
      2.0,
      2,
      'Z-',
      materials.getTimberWoodMaterial(),
      'Belvedere_South_Stairs'
    )

    // 1c. Modular Stone Balustrade / Railing System (Along seaward edge X: -23.8, strictly terminating at Z: 44)
    // Legacy segment 'Promenade_Railing_NorthEnd' (Z: 56 to 110) is completely removed to eliminate conflict with Fishing Harbour Assets 7-9.
    // Four planned access openings:
    // - Central Grand Beach Stairway opening: Z in [-6, 6] (12m opening)
    // - South Beach access opening: Z in [-43, -37] (6m opening)
    // - North Beach access opening: Z in [17, 23] (6m opening)
    // - North Harbour Road access opening: Z in [44, 56] (12m opening for harbour connection)
    const railingSegments: [number, number, string][] = [
      [-82.5, 79, 'Promenade_Railing_SouthEnd'],    // Z: -122 to -43 (length 79m)
      [-21.5, 31, 'Promenade_Railing_MidSouth'],    // Z: -37 to -6 (length 31m)
      [11.5, 11, 'Promenade_Railing_MidNorth'],     // Z: 6 to 17 (length 11m)
      [33.5, 21, 'Promenade_Railing_HarbourSouth'], // Z: 23 to 44 (length 21m)
    ]

    const balustradeGeos: THREE.BufferGeometry[] = []

    for (const [cz, len, colName] of railingSegments) {
      const railGeo = new THREE.BoxGeometry(0.4, 0.9, len)
      railGeo.translate(-23.8, 0.7, cz)
      balustradeGeos.push(railGeo)

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

    // Belvedere Curved Perimeter Railing (following the 6m radius arc around X: -20, Z: -122, leaving south stairs open)
    const belvedereRailAngles = [
      Math.PI * 0.55,
      Math.PI * 0.75,
      Math.PI * 0.95,
      Math.PI * 1.15,
      Math.PI * 1.35,
    ]
    for (let a = 0; a < belvedereRailAngles.length; a++) {
      const ang = belvedereRailAngles[a]
      const rx = -20 + Math.cos(ang) * 5.8
      const rz = -122 + Math.sin(ang) * 5.8
      const railArcGeo = new THREE.BoxGeometry(0.4, 0.9, 2.8)
      railArcGeo.rotateY(-ang + Math.PI / 2)
      railArcGeo.translate(rx, 0.7, rz)
      balustradeGeos.push(railArcGeo)

      DistrictHelper.registerBoxCollider(
        collisionSystem,
        rx,
        0.7,
        rz,
        1.2,
        1.1,
        2.8,
        `Promenade_Belvedere_Railing_${a}`
      )
    }

    const mergedBalustradeGeo = BufferGeometryUtils.mergeGeometries(balustradeGeos)
    if (mergedBalustradeGeo) {
      const balustradeMesh = new THREE.Mesh(mergedBalustradeGeo, railingMat)
      balustradeMesh.castShadow = true
      this.group.add(balustradeMesh)
    }

    // 1d. Decorative Stone Gate Pillars & Brass Maritime Lanterns at Openings
    const pillarPositions: [number, number][] = [
      [-23.8, -43], // South opening south edge
      [-23.8, -37], // South opening north edge
      [-23.8, -6],  // Grand stairs south edge
      [-23.8, 6],   // Grand stairs north edge
      [-23.8, 17],  // North opening south edge
      [-23.8, 23],  // North opening north edge
      [-23.8, 44],  // Harbour road entrance corner (north terminus of railing)
      [-21.8, -128], // Belvedere south stair west edge
      [-18.2, -128], // Belvedere south stair east edge
    ]

    const pillarGeos: THREE.BufferGeometry[] = []
    const lanternGeos: THREE.BufferGeometry[] = []

    for (let p = 0; p < pillarPositions.length; p++) {
      const [px, pz] = pillarPositions[p]
      const pGeo = new THREE.BoxGeometry(0.65, 1.15, 0.65)
      pGeo.translate(px, 0.75, pz)
      pillarGeos.push(pGeo)

      const lBase = new THREE.BoxGeometry(0.24, 0.22, 0.24)
      lBase.translate(px, 1.42, pz)
      pillarGeos.push(lBase)

      const lGlass = new THREE.SphereGeometry(0.12, 8, 8)
      lGlass.translate(px, 1.58, pz)
      lanternGeos.push(lGlass)

      DistrictHelper.registerBoxCollider(
        collisionSystem,
        px,
        0.75,
        pz,
        0.7,
        1.2,
        0.7,
        `Promenade_Gate_Pillar_${p}`
      )
    }

    const mergedPillars = BufferGeometryUtils.mergeGeometries(pillarGeos)
    if (mergedPillars) {
      const pillarMesh = new THREE.Mesh(mergedPillars, railingMat)
      pillarMesh.castShadow = true
      this.group.add(pillarMesh)
    }

    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xfffaed,
      emissive: 0xffd166,
      emissiveIntensity: 2.0,
      roughness: 0.1,
    })
    const mergedLanterns = BufferGeometryUtils.mergeGeometries(lanternGeos)
    if (mergedLanterns) {
      const lanternMesh = new THREE.Mesh(mergedLanterns, lanternMat)
      this.group.add(lanternMesh)
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

    // Central Boulevard Zebra Crosswalk & Promenade Curb Ramp (linking Town Centre Plaza to Promenade)
    const crosswalkWhiteMat = materials.getColorMaterial(0xf8f9fa, 0.9, 0.0)
    const zebraGeos: THREE.BufferGeometry[] = []
    for (let s = 0; s < 8; s++) {
      const zStrip = -2.625 + s * 0.75
      const stripeGeo = new THREE.BoxGeometry(11.0, 0.005, 0.40)
      stripeGeo.translate(-10.0, 0.052, zStrip)
      zebraGeos.push(stripeGeo)
    }
    const mergedZebra = BufferGeometryUtils.mergeGeometries(zebraGeos)
    if (mergedZebra) {
      const zebraMesh = new THREE.Mesh(mergedZebra, crosswalkWhiteMat)
      zebraMesh.receiveShadow = true
      this.group.add(zebraMesh)
    }

    // Beveled transition curb ramp at X: -16.0 stepping from road (Y = 0.05m) to promenade (Y = 0.25m)
    const crosswalkRamp = new THREE.Mesh(materials.boxGeometry, sidewalkMat)
    crosswalkRamp.scale.set(1.0, 0.20, 6.0)
    crosswalkRamp.position.set(-15.5, 0.15, 0)
    crosswalkRamp.receiveShadow = true
    this.group.add(crosswalkRamp)

    DistrictHelper.registerBoxCollider(
      collisionSystem,
      -15.5,
      0.15,
      0,
      1.0,
      0.20,
      6.0,
      'Central_Crosswalk_Curb_Ramp'
    )

    // 4. North Harbour Access Road (X: -10 to -34, Z: 50, width: 10m)
    const harbourRoad = new THREE.Mesh(materials.boxGeometry, roadMat)
    harbourRoad.scale.set(24, 0.05, 10)
    harbourRoad.position.set(-22, 0.027, 50)
    harbourRoad.receiveShadow = true
    this.group.add(harbourRoad)

    // Flanking pedestrian sidewalks along North Harbour Access Road
    const harbourSideNorth = new THREE.Mesh(materials.boxGeometry, sidewalkMat)
    harbourSideNorth.scale.set(24, 0.15, 1.5)
    harbourSideNorth.position.set(-22, 0.075, 55.75)
    harbourSideNorth.receiveShadow = true
    this.group.add(harbourSideNorth)

    const harbourSideSouth = new THREE.Mesh(materials.boxGeometry, sidewalkMat)
    harbourSideSouth.scale.set(24, 0.15, 1.5)
    harbourSideSouth.position.set(-22, 0.075, 44.25)
    harbourSideSouth.receiveShadow = true
    this.group.add(harbourSideSouth)

    // Beveled transition ramp at X: -34 stepping from road (Y = 0.05m) onto Harbour Wharf deck (Y = 0.40m)
    const harbourWharfRamp = new THREE.Mesh(materials.boxGeometry, materials.getTimberWoodMaterial())
    harbourWharfRamp.scale.set(1.6, 0.20, 10.0)
    harbourWharfRamp.position.set(-34.2, 0.20, 50)
    harbourWharfRamp.receiveShadow = true
    this.group.add(harbourWharfRamp)

    DistrictHelper.registerBoxCollider(
      collisionSystem,
      -34.2,
      0.20,
      50,
      1.6,
      0.20,
      10.0,
      'Harbour_Road_Wharf_Ramp'
    )

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

    // 9. Coastal Marine Promenade Street Furnishings: 8 Benches, 8 Streetlamps, 6 Planters & 2 Foot-Wash Stations
    // 9a. 8 Promenade Heritage Teak Benches (Facing ocean Westward at Y = 0.25m)
    const promenadeBenches: [number, number, number, number, string][] = [
      [-24.5, 0.25, -122.0, Math.PI / 2, 'Promenade_Bench_Belvedere'],
      [-22.5, 0.25, -100.0, Math.PI / 2, 'Promenade_Bench_South_1'],
      [-22.5, 0.25, -75.0,  Math.PI / 2, 'Promenade_Bench_South_2'],
      [-22.5, 0.25, -55.0,  Math.PI / 2, 'Promenade_Bench_Mid_1'],
      [-22.5, 0.25, -25.0,  Math.PI / 2, 'Promenade_Bench_Mid_2'],
      [-22.5, 0.25, -15.0,  Math.PI / 2, 'Promenade_Bench_Mid_3'],
      [-22.5, 0.25, 11.5,   Math.PI / 2, 'Promenade_Bench_North_1'],
      [-22.5, 0.25, 33.5,   Math.PI / 2, 'Promenade_Bench_Harbour'],
    ]
    for (const [bx, by, bz, rotY, bName] of promenadeBenches) {
      DistrictHelper.addPromenadeBench(this.group, collisionSystem, bx, by, bz, rotY, bName)
    }

    // 9b. 8 Coastal Victorian Streetlamps along Promenade Landward Curb (X: -16.5, Y: 0.25m)
    const promenadeLamps: [number, number, string][] = [
      [-16.5, -120.0, 'Promenade_Lamp_Belvedere'],
      [-16.5, -95.0,  'Promenade_Lamp_South_1'],
      [-16.5, -70.0,  'Promenade_Lamp_South_2'],
      [-16.5, -45.0,  'Promenade_Lamp_Mid_1'],
      [-16.5, -20.0,  'Promenade_Lamp_Mid_2'],
      [-16.5, 12.0,   'Promenade_Lamp_North_1'],
      [-16.5, 28.0,   'Promenade_Lamp_North_2'],
      [-16.5, 42.0,   'Promenade_Lamp_Harbour'],
    ]
    for (const [lx, lz, lName] of promenadeLamps) {
      DistrictHelper.addStreetLamp(
        this.group,
        collisionSystem,
        materials,
        lx,
        lz,
        5.2,
        lName,
        0.25
      )
    }

    // 9c. 6 Terrazzo Planters with Coastal Ornamental Flora (X: -18.5, Y: 0.25m)
    const promenadePlanters: [number, number, string][] = [
      [-18.5, -110.0, 'Promenade_Planter_1'],
      [-18.5, -85.0,  'Promenade_Planter_2'],
      [-18.5, -60.0,  'Promenade_Planter_3'],
      [-18.5, -30.0,  'Promenade_Planter_4'],
      [-18.5, 8.0,    'Promenade_Planter_5'],
      [-18.5, 38.0,   'Promenade_Planter_6'],
    ]
    for (const [px, pz, pName] of promenadePlanters) {
      DistrictHelper.addBlenderPlanter(
        this.group,
        collisionSystem,
        px,
        pz,
        0,
        pName,
        0.25
      )
    }

    // 9d. 2 Public Foot-Wash Stations (near beach stair access points)
    DistrictHelper.addFootWashStation(
      this.group,
      collisionSystem,
      materials,
      -22.5,
      0.25,
      7.5,
      Math.PI / 2,
      'Foot_Wash_Central'
    )

    DistrictHelper.addFootWashStation(
      this.group,
      collisionSystem,
      materials,
      -22.5,
      0.25,
      -35.5,
      Math.PI / 2,
      'Foot_Wash_South'
    )

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
