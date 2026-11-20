import * as THREE from 'three'
import type { MaterialFactory } from '../MaterialFactory'
import type { CollisionSystem } from '../../physics/CollisionSystem'
import { DistrictHelper } from './DistrictHelper'
import { MarketLivingWorld } from '../market/MarketLivingWorld'

export class MarketDistrict {
  public readonly group = new THREE.Group()
  public livingWorld: MarketLivingWorld | null = null

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

    // 2. West Side Market Shopfronts & Commercial Buildings (Facing East onto Bazaar Street)
    // Shop 1: Indian Street Shop Cluster (Asset 3: Blender MCP Production GLB)
    // Contains: Kirana Grocery, Chai Stall, Pharmacy & Mobile Accessories
    DistrictHelper.addBlenderShopCluster(
      this.group,
      collisionSystem,
      materials,
      22,
      32,
      'E',
      'Shop_Cluster_West'
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
      'Shop_Malabar_Spices',
      'E'
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
      'Shop_Coastline_Chai',
      'E'
    )

    // 3. East Side Market Buildings (Facing West onto Bazaar Street)
    // Building 1: Two-storey coastal commercial arcade (Asset 2: Blender MCP Production GLB)
    DistrictHelper.addBlenderCommercialArcade(
      this.group,
      collisionSystem,
      materials,
      54,
      32,
      'W',
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
      'Bazaar_Textile_Emporium',
      'W'
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
      'Bazaar_Sea_Crafts',
      'W'
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
      22,
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
        29.2,
        lz,
        4.8,
        `Market_Street_Lamp_W_${lz}`
      )
      DistrictHelper.addStreetLamp(
        this.group,
        collisionSystem,
        materials,
        46.8,
        lz,
        4.8,
        `Market_Street_Lamp_E_${lz}`
      )
    }

    // Overhead string bunting / festival flags across the street
    const flagMat = materials.getColorMaterial(0xffb703, 0.8, 0.1)
    for (let fz = 28; fz <= 72; fz += 12) {
      const stringMesh = new THREE.Mesh(materials.boxGeometry, flagMat)
      stringMesh.scale.set(16, 0.12, 0.08)
      stringMesh.position.set(38, 4.2, fz)
      this.group.add(stringMesh)
    }

    // =========================================================================
    // 6. ASSET 4: MARKET BAZAAR ENVIRONMENTAL POLISH PACK
    // Lightweight Indian coastal-town street environment props
    // =========================================================================

    // A. Parked Vintage Indian Geared Scooters (Bajaj Chetak style)
    // Scooter 1: Parked near Chai Stall curb outside Shop Cluster
    DistrictHelper.addBlenderScooter(
      this.group,
      collisionSystem,
      27.5,
      25.2,
      Math.PI * 0.75,
      'Market_Scooter_ChaiStall'
    )

    // Scooter 2: Parked near Pharmacy / Mobile Care curb
    DistrictHelper.addBlenderScooter(
      this.group,
      collisionSystem,
      27.5,
      38.5,
      Math.PI * 0.25,
      'Market_Scooter_Pharmacy'
    )

    // B. Classic Delivery Roadster Bicycle with Milk Cans & Tiffins
    // Leaning outside Kirana Grocery Store
    DistrictHelper.addBlenderBicycle(
      this.group,
      collisionSystem,
      27.2,
      35.0,
      Math.PI * 0.15,
      'Market_Bicycle_Kirana'
    )

    // C. Parked Indian Auto-Rickshaw at Market Bazaar South Entrance Curb
    DistrictHelper.addAutoRickshaw(
      this.group,
      collisionSystem,
      materials,
      46.8,
      23.0,
      -Math.PI * 0.25,
      'Market_Rickshaw_Entrance'
    )

    // D. Modular Concrete Drainage Gutters with Cast-Iron Storm Grates
    // West Curb line (X = 29.6)
    for (const dz of [24, 32, 40, 56, 68]) {
      DistrictHelper.addBlenderDrainageGutter(
        this.group,
        collisionSystem,
        29.6,
        dz,
        0
      )
    }
    // East Curb line (X = 46.4)
    for (const dz of [24, 32, 40, 56, 68]) {
      DistrictHelper.addBlenderDrainageGutter(
        this.group,
        collisionSystem,
        46.4,
        dz,
        Math.PI
      )
    }

    // E. Swachh Bharat Municipal Dual Waste Bins (Wet / Dry)
    DistrictHelper.addBlenderWasteBins(
      this.group,
      collisionSystem,
      45.8,
      38.5,
      -Math.PI / 2,
      'Market_WasteBins_Stalls'
    )
    DistrictHelper.addBlenderWasteBins(
      this.group,
      collisionSystem,
      29.5,
      48.0,
      Math.PI / 2,
      'Market_WasteBins_West'
    )

    // F. Fluted Terracotta Planter Pots with Tropical Coastal Greenery
    // Flanking the Commercial Arcade Colonnade Entrance Piers
    DistrictHelper.addBlenderPlanter(
      this.group,
      collisionSystem,
      47.0,
      28.5,
      0,
      'Market_Planter_Arcade_South'
    )
    DistrictHelper.addBlenderPlanter(
      this.group,
      collisionSystem,
      47.0,
      35.5,
      0,
      'Market_Planter_Arcade_North'
    )
    // Outside the Chai Stall corner
    DistrictHelper.addBlenderPlanter(
      this.group,
      collisionSystem,
      26.8,
      23.5,
      0,
      'Market_Planter_ChaiStall'
    )

    // G. Folding Wooden A-Frame Vendor Chalkboard Menu Sign
    // On walkway step near Chai Stall
    DistrictHelper.addBlenderVendorSign(
      this.group,
      collisionSystem,
      26.8,
      27.0,
      Math.PI * 0.85,
      'Market_VendorSign_Chai'
    )

    // H. Municipal Roadside Electrical Feeder Pillar Box
    DistrictHelper.addBlenderElectricalFeeder(
      this.group,
      collisionSystem,
      46.8,
      74.0,
      -Math.PI / 2,
      'Market_FeederPillar_East'
    )

    // I. Street Furniture & Shaded Coastal Palms
    DistrictHelper.addPromenadeBench(
      this.group,
      collisionSystem,
      materials,
      46.5,
      70.0,
      -Math.PI / 2,
      'Market_Bench_East'
    )
    DistrictHelper.addCoconutPalm(
      this.group,
      collisionSystem,
      materials,
      47.5,
      76.0,
      1.1,
      'Market_Palm_East'
    )
    DistrictHelper.addCoconutPalm(
      this.group,
      collisionSystem,
      materials,
      28.0,
      76.0,
      1.05,
      'Market_Palm_West'
    )

    // J. Utility Poles & Overhead Power Cables
    const poles = [
      { x: 28.5, z: 22.0, name: 'Market_Pole_W1' },
      { x: 47.5, z: 22.0, name: 'Market_Pole_E1' },
      { x: 28.5, z: 50.0, name: 'Market_Pole_W2' },
      { x: 47.5, z: 50.0, name: 'Market_Pole_E2' },
      { x: 28.5, z: 78.0, name: 'Market_Pole_W3' },
      { x: 47.5, z: 78.0, name: 'Market_Pole_E3' },
    ]
    for (const p of poles) {
      DistrictHelper.addUtilityPole(
        this.group,
        collisionSystem,
        materials,
        p.x,
        p.z,
        6.2,
        p.name
      )
    }

    // Sagging overhead cables connecting cross-street and along street
    // Cross street cables
    DistrictHelper.addOverheadCable(
      this.group,
      materials,
      new THREE.Vector3(28.5, 5.8, 22.0),
      new THREE.Vector3(47.5, 5.8, 22.0),
      0.65
    )
    DistrictHelper.addOverheadCable(
      this.group,
      materials,
      new THREE.Vector3(28.5, 5.8, 50.0),
      new THREE.Vector3(47.5, 5.8, 50.0),
      0.65
    )
    DistrictHelper.addOverheadCable(
      this.group,
      materials,
      new THREE.Vector3(28.5, 5.8, 78.0),
      new THREE.Vector3(47.5, 5.8, 78.0),
      0.65
    )
    // Cables from poles to building roof eaves
    DistrictHelper.addOverheadCable(
      this.group,
      materials,
      new THREE.Vector3(28.5, 5.8, 22.0),
      new THREE.Vector3(25.0, 4.2, 26.0),
      0.35
    )
    DistrictHelper.addOverheadCable(
      this.group,
      materials,
      new THREE.Vector3(47.5, 5.8, 22.0),
      new THREE.Vector3(49.5, 5.2, 27.0),
      0.40
    )

    // =========================================================================
    // 7. ASSET 5: MARKET BAZAAR LIVING WORLD SIMULATION
    // Pedestrian NPCs, Shopkeepers, Chai Stall activity, and Ambient Traffic
    // =========================================================================
    this.livingWorld = new MarketLivingWorld(this.group, collisionSystem, materials)
  }

  public update(dt: number, playerPos?: THREE.Vector3): void {
    if (this.livingWorld) {
      this.livingWorld.update(dt, playerPos)
    }
  }

  public dispose(): void {
    if (this.livingWorld) {
      this.livingWorld.dispose()
      this.livingWorld = null
    }
  }
}
