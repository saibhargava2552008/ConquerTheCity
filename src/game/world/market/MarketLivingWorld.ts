import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MarketNPC, type NPCConfig } from './MarketNPC'
import { MarketVehicle, type VehicleConfig } from './MarketVehicle'
import type { CollisionSystem } from '../../physics/CollisionSystem'
import type { MaterialFactory } from '../MaterialFactory'

/**
 * MarketLivingWorld — Milestone M2 / Asset 5
 * Living-market simulation for Seaview Town Market Bazaar:
 * - Dynamic walking pedestrians with collision avoidance
 * - Shopkeeper NPCs stationed inside retail storefronts & market stalls
 * - Authentic Chai Stall social activity & tea brewing
 * - Ambient traffic (auto-rickshaw and bicycle) along central roadway
 * - Distance-based LOD activation / deactivation for 60 FPS lock
 */
export class MarketLivingWorld {
  public readonly group = new THREE.Group()

  private npcs: MarketNPC[] = []
  private vehicles: MarketVehicle[] = []

  private gltfAarav: GLTF | null = null
  private gltfAnanya: GLTF | null = null
  private isLoaded = false
  private isDisposed = false

  constructor(
    parent: THREE.Group,
    _collisionSystem: CollisionSystem,
    _materials: MaterialFactory
  ) {
    parent.add(this.group)
    this.preloadCharacters()
  }

  private isBrowserEnvironment(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.location !== 'undefined' &&
      typeof window.location.origin === 'string' &&
      window.location.origin.startsWith('http')
    )
  }

  private preloadCharacters(): void {
    if (!this.isBrowserEnvironment()) return

    const loader = new GLTFLoader()
    const p1 = new Promise<GLTF | null>((resolve) => {
      loader.load(
        '/models/aarav_character.glb',
        (gltf) => resolve(gltf),
        undefined,
        (err) => {
          console.warn('[MarketLivingWorld] Failed to load aarav_character.glb:', err)
          resolve(null)
        }
      )
    })

    const p2 = new Promise<GLTF | null>((resolve) => {
      loader.load(
        '/models/ananya_character.glb',
        (gltf) => resolve(gltf),
        undefined,
        (err) => {
          console.warn('[MarketLivingWorld] Failed to load ananya_character.glb:', err)
          resolve(null)
        }
      )
    })

    Promise.all([p1, p2]).then(([aarav, ananya]) => {
      if (this.isDisposed) return
      this.gltfAarav = aarav
      this.gltfAnanya = ananya
      this.isLoaded = true
      this.spawnLivingWorld()
    })
  }

  private spawnLivingWorld(): void {
    if (!this.gltfAarav || !this.gltfAnanya) return

    // =========================================================================
    // 1. PEDESTRIAN NPCS
    // =========================================================================
    const pedestrianConfigs: NPCConfig[] = [
      // Pedestrian 1: West Sidewalk Stroller (Aarav rig, warm saffron kurta)
      {
        id: 'ped_west_1',
        name: 'Dev',
        role: 'pedestrian',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(27.8, 0.05, 24.0),
        facingAngle: 0,
        clothingColor: 0xe67e22, // Saffron orange
        patrolSpeed: 1.25,
        waypoints: [
          new THREE.Vector3(27.8, 0.05, 24.0),
          new THREE.Vector3(27.8, 0.05, 42.0),
          new THREE.Vector3(27.8, 0.05, 60.0),
          new THREE.Vector3(27.8, 0.05, 74.0),
        ],
      },
      // Pedestrian 2: West Shopper browsing stalls (Ananya rig, coastal teal kurta)
      {
        id: 'ped_west_2',
        name: 'Kavita',
        role: 'pedestrian',
        archetype: 'ananya',
        spawnPosition: new THREE.Vector3(27.5, 0.05, 33.0),
        facingAngle: Math.PI,
        clothingColor: 0x16a085, // Teal
        patrolSpeed: 1.15,
        waypoints: [
          new THREE.Vector3(27.5, 0.05, 28.0),
          new THREE.Vector3(27.5, 0.05, 38.0),
          new THREE.Vector3(27.5, 0.05, 52.0),
        ],
      },
      // Pedestrian 3: East Sidewalk Stroller (Aarav rig, crisp white linen)
      {
        id: 'ped_east_1',
        name: 'Rahul',
        role: 'pedestrian',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(46.5, 0.05, 74.0),
        facingAngle: Math.PI,
        clothingColor: 0xf8f9fa, // Crisp White
        patrolSpeed: 1.30,
        waypoints: [
          new THREE.Vector3(46.5, 0.05, 74.0),
          new THREE.Vector3(46.5, 0.05, 54.0),
          new THREE.Vector3(46.5, 0.05, 36.0),
          new THREE.Vector3(46.5, 0.05, 24.0),
        ],
      },
      // Pedestrian 4: East Colonnade Visitor (Ananya rig, marigold yellow)
      {
        id: 'ped_east_2',
        name: 'Meera',
        role: 'pedestrian',
        archetype: 'ananya',
        spawnPosition: new THREE.Vector3(48.8, 0.35, 28.0),
        facingAngle: 0,
        clothingColor: 0xf39c12, // Marigold
        patrolSpeed: 1.10,
        waypoints: [
          new THREE.Vector3(48.8, 0.35, 28.0),
          new THREE.Vector3(48.8, 0.35, 36.0),
        ],
      },
      // Pedestrians 5 & 6: Conversing pair near mid-market crossing (facing each other)
      {
        id: 'ped_chat_1',
        name: 'Arjun',
        role: 'pedestrian',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(33.5, 0.05, 46.0),
        facingAngle: Math.PI * 0.25, // Facing Meenakshi
        clothingColor: 0x2980b9,    // Royal Blue
      },
      {
        id: 'ped_chat_2',
        name: 'Meenakshi',
        role: 'pedestrian',
        archetype: 'ananya',
        spawnPosition: new THREE.Vector3(34.8, 0.05, 46.8),
        facingAngle: -Math.PI * 0.75, // Facing Arjun
        clothingColor: 0xc0392b,     // Terracotta crimson
      },
    ]

    for (const cfg of pedestrianConfigs) {
      const template = cfg.archetype === 'aarav' ? this.gltfAarav : this.gltfAnanya
      const npc = new MarketNPC(cfg, template)
      this.npcs.push(npc)
      this.group.add(npc.group)
    }

    // =========================================================================
    // 2. SHOPKEEPER NPCS (Inside Storefronts & Stalls)
    // =========================================================================
    const shopkeeperConfigs: NPCConfig[] = [
      // Kirana Grocery Storekeeper (Aarav rig, yellow merchant kurta)
      {
        id: 'shopkeeper_kirana',
        name: 'Murugan',
        role: 'shopkeeper',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(24.2, 0.30, 32.5),
        facingAngle: Math.PI / 2, // Facing East toward street
        clothingColor: 0xf1c40f,
      },
      // Pharmacy Chemist (Ananya rig, medical teal coat)
      {
        id: 'shopkeeper_pharmacy',
        name: 'Dr. Priya',
        role: 'shopkeeper',
        archetype: 'ananya',
        spawnPosition: new THREE.Vector3(24.2, 0.30, 29.0),
        facingAngle: Math.PI / 2, // Facing East toward street
        clothingColor: 0x1abc9c,
      },
      // Mobile Care Specialist (Aarav rig, modern dark blue tee)
      {
        id: 'shopkeeper_mobile',
        name: 'Kiran',
        role: 'shopkeeper',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(24.2, 0.30, 36.5),
        facingAngle: Math.PI / 2, // Facing East toward street
        clothingColor: 0x2c3e50,
      },
      // Commercial Arcade Retail Merchant (Ananya rig, traditional deep maroon)
      {
        id: 'shopkeeper_arcade',
        name: 'Lakshmi',
        role: 'shopkeeper',
        archetype: 'ananya',
        spawnPosition: new THREE.Vector3(51.5, 0.35, 32.0),
        facingAngle: -Math.PI / 2, // Facing West toward street
        clothingColor: 0x8e44ad,
      },
      // Mango Stall Vendor (Aarav rig, green apron)
      {
        id: 'vendor_mango',
        name: 'Gopal',
        role: 'shopkeeper',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(45.6, 0.05, 22.0),
        facingAngle: -Math.PI / 2, // Facing West toward street
        clothingColor: 0x27ae60,
      },
    ]

    for (const cfg of shopkeeperConfigs) {
      const template = cfg.archetype === 'aarav' ? this.gltfAarav : this.gltfAnanya
      const npc = new MarketNPC(cfg, template)
      this.npcs.push(npc)
      this.group.add(npc.group)
    }

    // =========================================================================
    // 3. CHAI STALL LIVING ACTIVITY
    // =========================================================================
    // Chai Wallah: Master tea brewer behind counter
    const chaiWallah = new MarketNPC(
      {
        id: 'npc_chai_wallah',
        name: 'Ramesh',
        role: 'chai_wallah',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(24.0, 0.30, 25.5),
        facingAngle: Math.PI / 2, // Facing East toward customers
        clothingColor: 0xf5f6fa,
      },
      this.gltfAarav
    )
    this.npcs.push(chaiWallah)
    this.group.add(chaiWallah.group)

    // Customer 1: Standing at counter edge enjoying cutting chai
    const chaiCust1 = new MarketNPC(
      {
        id: 'npc_chai_cust_1',
        name: 'Sanjay',
        role: 'chai_customer',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(25.8, 0.30, 24.8),
        facingAngle: -Math.PI / 2, // Facing Chai Wallah
        clothingColor: 0x7f8c8d,
      },
      this.gltfAarav
    )
    this.npcs.push(chaiCust1)
    this.group.add(chaiCust1.group)

    // Customer 2: Standing near bench sipping tea
    const chaiCust2 = new MarketNPC(
      {
        id: 'npc_chai_cust_2',
        name: 'Deepak',
        role: 'chai_customer',
        archetype: 'ananya',
        spawnPosition: new THREE.Vector3(25.8, 0.30, 26.5),
        facingAngle: -Math.PI * 0.70,
        clothingColor: 0x3f51b5,
      },
      this.gltfAnanya
    )
    this.npcs.push(chaiCust2)
    this.group.add(chaiCust2.group)

    // =========================================================================
    // 4. AMBIENT TRAFFIC (Auto-Rickshaw & Delivery Bicycle)
    // =========================================================================
    // Ambient Auto-Rickshaw along central delivery lane
    const rickshawTraffic = new MarketVehicle({
      id: 'traffic_rickshaw_1',
      assetId: 'prop_auto_rickshaw',
      cruisingSpeed: 3.2,
      waypoints: [
        new THREE.Vector3(39.0, 0.05, 16.0),
        new THREE.Vector3(39.0, 0.05, 74.0),
        new THREE.Vector3(37.2, 0.05, 77.0),
        new THREE.Vector3(35.5, 0.05, 74.0),
        new THREE.Vector3(35.5, 0.05, 16.0),
        new THREE.Vector3(37.2, 0.05, 13.0),
      ],
    })
    this.vehicles.push(rickshawTraffic)
    this.group.add(rickshawTraffic.group)

    // Ambient Delivery Bicycle along road margins
    const bicycleTraffic = new MarketVehicle({
      id: 'traffic_bicycle_1',
      assetId: 'prop_delivery_bicycle_01',
      cruisingSpeed: 2.1,
      waypoints: [
        new THREE.Vector3(36.2, 0.05, 20.0),
        new THREE.Vector3(36.2, 0.05, 70.0),
        new THREE.Vector3(38.2, 0.05, 72.0),
        new THREE.Vector3(38.2, 0.05, 20.0),
      ],
    })
    this.vehicles.push(bicycleTraffic)
    this.group.add(bicycleTraffic.group)

    console.log(
      `[MarketLivingWorld] Successfully spawned ${this.npcs.length} NPCs and ${this.vehicles.length} ambient vehicles!`
    )
  }

  public update(dt: number, playerPos?: THREE.Vector3): void {
    if (!this.isLoaded) return
    const pos = playerPos || new THREE.Vector3(38, 0, 50)

    // Update NPCs
    for (let i = 0; i < this.npcs.length; i++) {
      this.npcs[i].update(dt, pos, this.npcs)
    }

    // Update Vehicles
    for (let j = 0; j < this.vehicles.length; j++) {
      this.vehicles[j].update(dt, pos)
    }
  }

  public getNPCCount(): number {
    return this.npcs.length
  }

  public getVehicleCount(): number {
    return this.vehicles.length
  }

  public dispose(): void {
    this.isDisposed = true
    for (const npc of this.npcs) {
      npc.dispose()
    }
    this.npcs = []

    for (const v of this.vehicles) {
      v.dispose()
    }
    this.vehicles = []

    this.group.clear()
    this.gltfAarav = null
    this.gltfAnanya = null
  }
}
