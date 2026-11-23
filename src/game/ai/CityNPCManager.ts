import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { CityNPC, type CityNPCConfig } from './CityNPC'
import { CityNavigationGraph } from './CityNavigationGraph'
import type { CollisionSystem } from '../physics/CollisionSystem'
import type { InteractionManager } from '../interaction/InteractionManager'
import type { DialogueMessage } from '../core/Types'
import { EventEmitter } from '../core/EventEmitter'

export type CityNPCEvents = {
  dialogue: DialogueMessage
}

/**
 * CityNPCManager
 * Milestone 3: Coordinates living, intelligent pedestrian population across all 6 city districts.
 */
export class CityNPCManager {
  public readonly group = new THREE.Group()
  public readonly navGraph = new CityNavigationGraph()
  public readonly events = new EventEmitter<CityNPCEvents>()

  private npcs: CityNPC[] = []
  private collisionSystem: CollisionSystem
  private interactionManager: InteractionManager

  private gltfAarav: GLTF | null = null
  private gltfAnanya: GLTF | null = null
  private isLoaded = false
  private isDisposed = false

  constructor(collisionSystem: CollisionSystem, interactionManager: InteractionManager) {
    this.collisionSystem = collisionSystem
    this.interactionManager = interactionManager
    this.group.name = 'CityNPCs'

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
    const p1 = new Promise<GLTF | null>(resolve => {
      loader.load(
        '/models/aarav_character.glb',
        gltf => resolve(gltf),
        undefined,
        err => {
          console.warn('[CityNPCManager] Failed to load aarav_character.glb:', err)
          resolve(null)
        }
      )
    })

    const p2 = new Promise<GLTF | null>(resolve => {
      loader.load(
        '/models/ananya_character.glb',
        gltf => resolve(gltf),
        undefined,
        err => {
          console.warn('[CityNPCManager] Failed to load ananya_character.glb:', err)
          resolve(null)
        }
      )
    })

    Promise.all([p1, p2]).then(([aarav, ananya]) => {
      if (this.isDisposed) return
      this.gltfAarav = aarav
      this.gltfAnanya = ananya
      this.isLoaded = true
      this.spawnCityPopulation()
    })
  }

  private spawnCityPopulation(): void {
    if (!this.gltfAarav || !this.gltfAnanya) return

    const configs: CityNPCConfig[] = [
      // -----------------------------------------------------------------------
      // 1. TOWN CENTRE DISTRICT (4 NPCs)
      // -----------------------------------------------------------------------
      {
        id: 'tc_flaneur',
        name: 'Karan',
        title: 'Town Plaza Stroller',
        district: 'town_centre',
        role: 'stroller',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(2.0, 0.35, 8.0),
        startNodeId: 'tc_plaza_center',
        clothingColor: 0xe67e22, // Saffron
        dialogueLine: 'The Town Plaza is beautiful today. Watch out for the auto-rickshaws making U-turns!',
      },
      {
        id: 'tc_tourist_pair_1',
        name: 'Priya',
        title: 'Coastal Tourist',
        district: 'town_centre',
        role: 'conversing',
        archetype: 'ananya',
        spawnPosition: new THREE.Vector3(5.0, 0.35, 12.0),
        facingAngle: Math.PI * 0.75,
        clothingColor: 0x1abc9c, // Turquoise
        dialogueLine: 'The view of the lighthouse from here is stunning, especially in the evening light.',
        partnerId: 'tc_tourist_pair_2',
      },
      {
        id: 'tc_tourist_pair_2',
        name: 'Rohan',
        title: 'Local Guide',
        district: 'town_centre',
        role: 'conversing',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(5.8, 0.35, 12.8),
        facingAngle: -Math.PI * 0.25,
        clothingColor: 0x34495e, // Navy
        dialogueLine: 'Seaview Town was built around this lighthouse tower in 1892. It is the heart of the city.',
        partnerId: 'tc_tourist_pair_1',
      },
      {
        id: 'tc_lighthouse_watcher',
        name: 'Meera',
        title: 'Heritage Officer',
        district: 'town_centre',
        role: 'stroller',
        archetype: 'ananya',
        spawnPosition: new THREE.Vector3(0.0, 0.35, -1.8),
        startNodeId: 'tc_lighthouse_approach',
        clothingColor: 0x27ae60, // Emerald
        dialogueLine: 'The stone spiral stairs inside the lighthouse lead up to the revolving beacon room.',
      },

      // -----------------------------------------------------------------------
      // 2. BEACH DISTRICT & PROMENADE (4 NPCs)
      // -----------------------------------------------------------------------
      {
        id: 'bp_belvedere_sitter',
        name: 'Suresh',
        title: 'Ocean Watcher',
        district: 'beach_promenade',
        role: 'bench_sitter',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(-20.0, 0.48, -120.0),
        benchSeatPosition: new THREE.Vector3(-20.0, 0.48, -120.0),
        facingAngle: Math.PI / 2, // Facing west toward sea
        clothingColor: 0xc0392b, // Crimson
        dialogueLine: 'I come south to this belvedere every afternoon. Nothing beats the Arabian Sea breeze.',
      },
      {
        id: 'bp_promenade_jogger',
        name: 'Tara',
        title: 'Promenade Runner',
        district: 'beach_promenade',
        role: 'stroller',
        archetype: 'ananya',
        spawnPosition: new THREE.Vector3(-20.0, 0.25, -20.0),
        startNodeId: 'bp_crosswalk_mid',
        clothingColor: 0x8e44ad, // Violet
        dialogueLine: 'The new stone balustrades along the promenade make the sea walkway so much safer.',
      },
      {
        id: 'bp_shack_cafe_visitor',
        name: 'Arjun',
        title: 'Cafe Visitor',
        district: 'beach_promenade',
        role: 'bench_sitter',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(-34.0, 0.50, -42.0),
        benchSeatPosition: new THREE.Vector3(-34.0, 0.50, -42.0),
        facingAngle: 0,
        clothingColor: 0xd35400, // Rust
        dialogueLine: 'The Shack Seaside Cafe serves fresh coconut water and fried fish right off the deck.',
      },
      {
        id: 'bp_beach_walker',
        name: 'Divya',
        title: 'Beachcomber',
        district: 'beach_promenade',
        role: 'stroller',
        archetype: 'ananya',
        spawnPosition: new THREE.Vector3(-32.0, 0.05, 0.0),
        startNodeId: 'bp_grand_stairs',
        clothingColor: 0xf39c12, // Amber
        dialogueLine: 'Walking down the Grand Stairs directly onto the sandy waterline is the best part of town.',
      },

      // -----------------------------------------------------------------------
      // 3. FISHING HARBOUR DISTRICT (4 NPCs)
      // -----------------------------------------------------------------------
      {
        id: 'fh_wharf_docker',
        name: 'Vikram',
        title: 'Wharf Docker',
        district: 'fishing_harbour',
        role: 'stroller',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(-30.0, 0.35, 58.0),
        startNodeId: 'fh_wharf_entry',
        clothingColor: 0x7f8c8d, // Khaki
        dialogueLine: 'Watch your step near the mooring ropes! The timber wharf deck can get slippery with spray.',
      },
      {
        id: 'fh_coop_manager',
        name: 'Sunita',
        title: 'Co-op Officer',
        district: 'fishing_harbour',
        role: 'conversing',
        archetype: 'ananya',
        spawnPosition: new THREE.Vector3(-30.0, 0.40, 70.0),
        facingAngle: Math.PI * 0.5,
        clothingColor: 0x16a085, // Teal
        dialogueLine: 'All local fishing dhonis register their morning catches right here at the Cooperative office.',
      },
      {
        id: 'fh_auctioneer',
        name: 'Mohan',
        title: 'Fish Auctioneer',
        district: 'fishing_harbour',
        role: 'stroller',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(-38.0, 0.40, 75.0),
        startNodeId: 'fh_auction_apron',
        clothingColor: 0x5d4037, // Brown
        dialogueLine: 'Mackerel, kingfish, and tiger prawns — the morning auction starts promptly at 7 AM.',
      },
      {
        id: 'fh_pier_fisherman',
        name: 'Govind',
        title: 'Veteran Fisherman',
        district: 'fishing_harbour',
        role: 'bench_sitter',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(-45.0, 0.48, 85.0),
        benchSeatPosition: new THREE.Vector3(-45.0, 0.48, 85.0),
        facingAngle: -Math.PI / 2, // Facing sea
        clothingColor: 0x2c3e50, // Dark slate
        dialogueLine: 'The "Sea Queen" brought in a record haul today. The sea is calm beyond the breakwater groyne.',
      },

      // -----------------------------------------------------------------------
      // 4. MARKET DISTRICT (2 Shoppers linking with existing Market living world)
      // -----------------------------------------------------------------------
      {
        id: 'mk_bazaar_shopper',
        name: 'Anjali',
        title: 'Bazaar Shopper',
        district: 'market_district',
        role: 'stroller',
        archetype: 'ananya',
        spawnPosition: new THREE.Vector3(27.8, 0.05, 26.0),
        startNodeId: 'mk_west_curb',
        clothingColor: 0x9b59b6, // Purple
        dialogueLine: 'The spice aroma from the kirana store and the fresh tea from the chai stall make this street special.',
      },
      {
        id: 'mk_arcade_browser',
        name: 'Sameer',
        title: 'Arcade Shopper',
        district: 'market_district',
        role: 'stroller',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(47.0, 0.35, 55.0),
        startNodeId: 'mk_arcade_colonnade',
        clothingColor: 0xf1c40f, // Gold
        dialogueLine: 'The covered colonnade of the Commercial Arcade keeps you shaded from the hot coastal sun.',
      },

      // -----------------------------------------------------------------------
      // 5. RESIDENTIAL DISTRICT (2 NPCs)
      // -----------------------------------------------------------------------
      {
        id: 'res_avenue_resident',
        name: 'Kavita',
        title: 'Avenue Resident',
        district: 'residential_district',
        role: 'stroller',
        archetype: 'ananya',
        spawnPosition: new THREE.Vector3(28.0, 0.05, -35.0),
        startNodeId: 'res_mid_walkway',
        clothingColor: 0xe91e63, // Magenta
        dialogueLine: 'It is so peaceful living along Residential Avenue under the blooming gulmohar trees.',
      },
      {
        id: 'res_villa_owner',
        name: 'Deepak',
        title: 'Villa Owner',
        district: 'residential_district',
        role: 'conversing',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(38.0, 0.05, -35.0),
        facingAngle: Math.PI,
        clothingColor: 0xecf0f1, // White
        dialogueLine: 'Heritage Villa Gulmohar was constructed over eighty years ago. Notice the authentic veranda woodwork.',
      },

      // -----------------------------------------------------------------------
      // 6. COUNTRYSIDE EDGE DISTRICT (2 NPCs)
      // -----------------------------------------------------------------------
      {
        id: 'cs_highway_guard',
        name: 'Rajesh',
        title: 'Checkpoint Guard',
        district: 'countryside_edge',
        role: 'conversing',
        archetype: 'aarav',
        spawnPosition: new THREE.Vector3(85.0, 0.15, -70.0),
        facingAngle: -Math.PI / 2,
        clothingColor: 0x2e7d32, // Forest green
        dialogueLine: 'Halt! Welcome to the Seaview Town boundary checkpoint. Drive carefully along the coastal highway.',
      },
      {
        id: 'cs_overlook_traveler',
        name: 'Pooja',
        title: 'Highway Traveler',
        district: 'countryside_edge',
        role: 'bench_sitter',
        archetype: 'ananya',
        spawnPosition: new THREE.Vector3(95.0, 0.18, -60.0),
        benchSeatPosition: new THREE.Vector3(95.0, 0.18, -60.0),
        facingAngle: -Math.PI * 0.75,
        clothingColor: 0xff6f00, // Deep orange
        dialogueLine: 'From this highway bluff, you can see the entire arc of Seaview Town and the distant ocean horizon.',
      },
    ]

    // Create and index NPCs
    const npcMap = new Map<string, CityNPC>()
    for (const cfg of configs) {
      const template = cfg.archetype === 'ananya' ? this.gltfAnanya : this.gltfAarav
      const npc = new CityNPC(
        cfg,
        template,
        this.collisionSystem,
        this.interactionManager,
        this.navGraph
      )

      npc.events.on('dialogue', msg => {
        this.events.emit('dialogue', msg)
      })

      this.npcs.push(npc)
      this.group.add(npc.group)
      npcMap.set(cfg.id, npc)
    }

    // Link conversational partners
    for (const cfg of configs) {
      if (cfg.partnerId && npcMap.has(cfg.partnerId)) {
        const npc = npcMap.get(cfg.id)
        const partner = npcMap.get(cfg.partnerId)
        if (npc && partner) {
          npc.setPartner(partner)
        }
      }
    }
  }

  public getAllNPCs(): CityNPC[] {
    return this.npcs
  }

  public getNPC(id: string): CityNPC | undefined {
    return this.npcs.find(n => n.id === id)
  }

  public update(dt: number, playerPos: THREE.Vector3): void {
    if (!this.isLoaded) return

    for (let i = 0; i < this.npcs.length; i++) {
      this.npcs[i].update(dt, playerPos, this.npcs)
    }
  }

  public dispose(): void {
    this.isDisposed = true
    for (const npc of this.npcs) {
      npc.dispose(this.interactionManager)
    }
    this.npcs = []
    this.group.clear()
    this.events.removeAllListeners()
  }
}
