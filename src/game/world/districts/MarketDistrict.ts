import * as THREE from 'three'
import type { MaterialFactory } from '../MaterialFactory'
import type { CollisionSystem } from '../../physics/CollisionSystem'
import { DistrictHelper } from './DistrictHelper'

export class MarketDistrict {
  public readonly group = new THREE.Group()

  constructor(materials: MaterialFactory, collisionSystem: CollisionSystem) {
    this.build(materials, collisionSystem)
  }

  private build(materials: MaterialFactory, collisionSystem: CollisionSystem): void {
    const cobbleMat = materials.getCobblestoneMaterial()

    // 1. Central Bazaar Cobblestone Pedestrian Street (X: 35, Z: 20 to 80, width: 14m)
    const street = new THREE.Mesh(materials.boxGeometry, cobbleMat)
    street.scale.set(16, 0.1, 64)
    street.position.set(38, 0.05, 52)
    street.receiveShadow = true
    this.group.add(street)

    // 2. West Side Market Shopfronts & Commercial Buildings (X: 25)
    // Shop 1: "Krishna General Stores" (width 12, height 7.5, depth 14)
    DistrictHelper.addCoastalHouse(
      this.group,
      collisionSystem,
      materials,
      22,
      32,
      12,
      14,
      5.2,
      '#faedcd',
      true,
      'Shop_Krishna_General'
    )

    // Shop 2: "Malabar Spice Traders"
    DistrictHelper.addCoastalHouse(
      this.group,
      collisionSystem,
      materials,
      22,
      52,
      12,
      16,
      5.5,
      '#fcd5ce',
      true,
      'Shop_Malabar_Spices'
    )

    // Shop 3: "Coastline Bakery & Chai"
    DistrictHelper.addCoastalHouse(
      this.group,
      collisionSystem,
      materials,
      22,
      72,
      12,
      14,
      5.0,
      '#e8e8e4',
      true,
      'Shop_Coastline_Chai'
    )

    // 3. East Side Market Buildings (X: 54)
    // Building 1: Two-storey coastal commercial arcade
    DistrictHelper.addCoastalHouse(
      this.group,
      collisionSystem,
      materials,
      54,
      32,
      14,
      14,
      6.0,
      '#d8e2dc',
      true,
      'Bazaar_Arcade_South'
    )

    // Building 2: Textiles & Handicrafts Emporium
    DistrictHelper.addCoastalHouse(
      this.group,
      collisionSystem,
      materials,
      54,
      54,
      14,
      18,
      6.2,
      '#ffe5d9',
      true,
      'Bazaar_Textile_Emporium'
    )

    // Building 3: Coastal Cafe & Sea Crafts
    DistrictHelper.addCoastalHouse(
      this.group,
      collisionSystem,
      materials,
      54,
      76,
      14,
      14,
      5.4,
      '#f0efeb',
      true,
      'Bazaar_Sea_Crafts'
    )

    // 4. Vibrant Bazaar Street Stalls running along the pedestrian street
    // West row stalls
    DistrictHelper.addMarketStall(
      this.group,
      collisionSystem,
      materials,
      31,
      28,
      Math.PI / 2,
      '#e76f51',
      '#f4a261',
      'Stall_Turmeric_Spices'
    )

    DistrictHelper.addMarketStall(
      this.group,
      collisionSystem,
      materials,
      31,
      40,
      Math.PI / 2,
      '#2a9d8f',
      '#e9c46a',
      'Stall_Fresh_Produce'
    )

    DistrictHelper.addMarketStall(
      this.group,
      collisionSystem,
      materials,
      31,
      54,
      Math.PI / 2,
      '#e63946',
      '#f1faee',
      'Stall_Seafood_Market'
    )

    DistrictHelper.addMarketStall(
      this.group,
      collisionSystem,
      materials,
      31,
      68,
      Math.PI / 2,
      '#9b5de5',
      '#f15bb5',
      'Stall_Flower_Garlands'
    )

    // East row stalls
    DistrictHelper.addMarketStall(
      this.group,
      collisionSystem,
      materials,
      45,
      34,
      -Math.PI / 2,
      '#ffbe0b',
      '#fb5607',
      'Stall_Mangoes_Coconuts'
    )

    DistrictHelper.addMarketStall(
      this.group,
      collisionSystem,
      materials,
      45,
      48,
      -Math.PI / 2,
      '#3a86ff',
      '#8338ec',
      'Stall_Handicrafts_Pottery'
    )

    DistrictHelper.addMarketStall(
      this.group,
      collisionSystem,
      materials,
      45,
      62,
      -Math.PI / 2,
      '#06d6a0',
      '#118ab2',
      'Stall_Chai_Snacks'
    )

    // 5. Street Lamps & Overhead Street Atmosphere
    for (const lz of [24, 44, 64, 80]) {
      DistrictHelper.addStreetLamp(
        this.group,
        collisionSystem,
        materials,
        37.5,
        lz,
        4.8,
        `Market_Street_Lamp_${lz}`
      )
    }

    // Overhead string bunting / festival flags across the street
    const flagMat = materials.getColorMaterial(0xffb703, 0.8, 0.1)
    for (let fz = 28; fz <= 72; fz += 12) {
      const stringMesh = new THREE.Mesh(materials.boxGeometry, flagMat)
      stringMesh.scale.set(14, 0.12, 0.08)
      stringMesh.position.set(38, 4.2, fz)
      this.group.add(stringMesh)
    }
  }

  public dispose(): void {
    // Meshes handled by parent
  }
}
