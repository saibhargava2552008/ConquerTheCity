import * as THREE from 'three'
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
    const woodMat = materials.getTimberWoodMaterial()

    // 1. Coastal Marine Promenade (North-South, X: -20, Z: -110 to 110, width: 8m)
    const promenadeMesh = new THREE.Mesh(materials.boxGeometry, promenadeMat)
    promenadeMesh.scale.set(8, 0.25, 220)
    promenadeMesh.position.set(-20, 0.125, 0)
    promenadeMesh.receiveShadow = true
    this.group.add(promenadeMesh)

    // Promenade Sea-Facing Stone Balustrade / Railing (at X: -23.8 along the beach edge)
    const railing = new THREE.Mesh(materials.boxGeometry, railingMat)
    railing.scale.set(0.4, 0.9, 220)
    railing.position.set(-23.8, 0.7, 0)
    railing.castShadow = true
    this.group.add(railing)

    DistrictHelper.registerBoxCollider(
      collisionSystem,
      -23.8,
      0.7,
      0,
      0.5,
      1.1,
      220,
      'Promenade_Safety_Railing'
    )

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

    // 6. Promenade Ocean-Facing Benches & Streetlamps
    for (let z = -90; z <= 90; z += 24) {
      // Ocean-facing bench
      const bench = DistrictHelper.addStaticBox(
        this.group,
        collisionSystem,
        materials,
        -22.5,
        0.35,
        z,
        1.0,
        0.5,
        2.2,
        woodMat,
        `Promenade_Bench_${z}`
      )
      bench.rotation.y = Math.PI / 2

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
  }

  public dispose(): void {
    // Handled by parent
  }
}
