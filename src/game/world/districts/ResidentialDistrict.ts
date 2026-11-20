import * as THREE from 'three'
import type { MaterialFactory } from '../MaterialFactory'
import type { CollisionSystem } from '../../physics/CollisionSystem'
import { DistrictHelper } from './DistrictHelper'

export class ResidentialDistrict {
  public readonly group = new THREE.Group()

  constructor(materials: MaterialFactory, collisionSystem: CollisionSystem) {
    this.build(materials, collisionSystem)
  }

  private build(materials: MaterialFactory, collisionSystem: CollisionSystem): void {
    const wallMat = materials.getStuccoMaterial('#f4f1de', '#3d405b')
    const streetMat = materials.getRoadMaterial()
    const sidewalkMat = materials.getSidewalkMaterial()

    // 1. Residential Neighbourhood Roads & Sidewalks
    // Residential East-West Avenue (X: 10 to 80, Z: -50, width: 10m)
    const resAvenue = new THREE.Mesh(materials.boxGeometry, streetMat)
    resAvenue.scale.set(70, 0.05, 10)
    resAvenue.position.set(45, 0.025, -50)
    resAvenue.receiveShadow = true
    this.group.add(resAvenue)

    // Sidewalks along Residential Avenue
    const sideNorth = new THREE.Mesh(materials.boxGeometry, sidewalkMat)
    sideNorth.scale.set(70, 0.2, 2.5)
    sideNorth.position.set(45, 0.1, -43.75)
    sideNorth.receiveShadow = true
    this.group.add(sideNorth)

    const sideSouth = new THREE.Mesh(materials.boxGeometry, sidewalkMat)
    sideSouth.scale.set(70, 0.2, 2.5)
    sideSouth.position.set(45, 0.1, -56.25)
    sideSouth.receiveShadow = true
    this.group.add(sideSouth)

    // 2. North Row Coastal Residences (Facing South onto Avenue)
    // House 1: "Gulmohar Villa" (Terracotta & Gold)
    DistrictHelper.addCoastalHouse(
      this.group,
      collisionSystem,
      materials,
      25,
      -30,
      14,
      12,
      4.6,
      '#e07a5f',
      true,
      'Villa_Gulmohar',
      'S'
    )

    // House 2: "Coastal Residence ArchViz" (Blender 5.3 Production Asset)
    DistrictHelper.addBlenderCoastalResidence(
      this.group,
      collisionSystem,
      materials,
      45,
      -30,
      'S',
      'Coastal_Residence_ArchViz'
    )

    // House 3: "Sandalwood Villa" (Warm Ochre)
    DistrictHelper.addCoastalHouse(
      this.group,
      collisionSystem,
      materials,
      65,
      -30,
      15,
      14,
      5.2,
      '#f2cc8f',
      true,
      'Villa_Sandalwood',
      'S'
    )

    // 3. South Row Coastal Residences (Facing North onto Avenue)
    // House 4: "Ocean Breeze Duplex" (Whitewashed Stucco with Sky Blue Accents)
    DistrictHelper.addCoastalHouse(
      this.group,
      collisionSystem,
      materials,
      25,
      -75,
      14,
      14,
      6.0,
      '#edf2f4',
      true,
      'Residence_Ocean_Breeze',
      'N'
    )

    // House 5: "Coral Cove Cottage"
    DistrictHelper.addCoastalHouse(
      this.group,
      collisionSystem,
      materials,
      45,
      -75,
      12,
      12,
      4.4,
      '#ffcad4',
      true,
      'Cottage_Coral_Cove',
      'N'
    )

    // House 6: "Palm Haven Villa"
    DistrictHelper.addCoastalHouse(
      this.group,
      collisionSystem,
      materials,
      65,
      -75,
      16,
      14,
      5.0,
      '#b5e2fa',
      true,
      'Villa_Palm_Haven',
      'N'
    )

    // 4. Low Compound Boundary Walls with Open Entry Gateways & Pillars
    // Compound walls along North row gardens (Z: -41) and South row gardens (Z: -60)
    const compoundWalls: [number, number, number, number][] = [
      [25, -41, 15, 1.4],
      [45, -41, 14, 1.4],
      [65, -41, 16, 1.4],
      [25, -60, 15, 1.4],
      [45, -60, 14, 1.4],
      [65, -60, 16, 1.4],
    ]

    const pathMat = materials.getPromenadeTileMaterial()

    for (let i = 0; i < compoundWalls.length; i++) {
      const [wx, wz, totalLength, h] = compoundWalls[i]
      const gateWidth = 3.6
      const wingLength = (totalLength - gateWidth) / 2

      // Left wall wing
      const leftCenterX = wx - gateWidth / 2 - wingLength / 2
      DistrictHelper.addStaticBox(
        this.group,
        collisionSystem,
        materials,
        leftCenterX,
        h / 2,
        wz,
        wingLength,
        h,
        0.5,
        wallMat,
        `Compound_Wall_${i}_Left`
      )

      // Right wall wing
      const rightCenterX = wx + gateWidth / 2 + wingLength / 2
      DistrictHelper.addStaticBox(
        this.group,
        collisionSystem,
        materials,
        rightCenterX,
        h / 2,
        wz,
        wingLength,
        h,
        0.5,
        wallMat,
        `Compound_Wall_${i}_Right`
      )

      // Left gate post pillar
      DistrictHelper.addStaticBox(
        this.group,
        collisionSystem,
        materials,
        wx - gateWidth / 2,
        (h + 0.3) / 2,
        wz,
        0.6,
        h + 0.3,
        0.6,
        wallMat,
        `Compound_Pillar_${i}_Left`
      )

      // Right gate post pillar
      DistrictHelper.addStaticBox(
        this.group,
        collisionSystem,
        materials,
        wx + gateWidth / 2,
        (h + 0.3) / 2,
        wz,
        0.6,
        h + 0.3,
        0.6,
        wallMat,
        `Compound_Pillar_${i}_Right`
      )

      // Paved walkway from sidewalk through gateway toward villa veranda
      const pathLength = 6.0
      const pathZ = wz > -50 ? wz + pathLength / 2 : wz - pathLength / 2
      const pathMesh = new THREE.Mesh(materials.boxGeometry, pathMat)
      pathMesh.scale.set(2.4, 0.04, pathLength)
      pathMesh.position.set(wx, 0.02, pathZ)
      pathMesh.receiveShadow = true
      this.group.add(pathMesh)
    }

    // 5. Garden Coconut Palms in Residential Courtyards
    const gardenPalms = [
      [16, -30],
      [36, -26],
      [56, -26],
      [74, -32],
      [16, -72],
      [36, -78],
      [56, -76],
      [74, -72],
    ]

    for (let i = 0; i < gardenPalms.length; i++) {
      const [gx, gz] = gardenPalms[i]
      DistrictHelper.addCoconutPalm(
        this.group,
        collisionSystem,
        materials,
        gx,
        gz,
        7.2,
        0.12,
        (i * 1.1) % (Math.PI * 2),
        `Garden_Palm_${i}`
      )
    }

    // 6. Street Lighting along Residential Avenue
    for (const lx of [15, 35, 55, 75]) {
      DistrictHelper.addStreetLamp(
        this.group,
        collisionSystem,
        materials,
        lx,
        -43,
        4.8,
        `Res_Street_Lamp_N_${lx}`
      )
      DistrictHelper.addStreetLamp(
        this.group,
        collisionSystem,
        materials,
        lx,
        -57,
        4.8,
        `Res_Street_Lamp_S_${lx}`
      )
    }
  }

  public dispose(): void {
    // Handled by parent
  }
}
