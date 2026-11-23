import * as THREE from 'three'
import type { MaterialFactory } from '../world/MaterialFactory'
import type { CollisionSystem } from '../physics/CollisionSystem'
import type { InteractionManager } from '../interaction/InteractionManager'
import type { ThirdPersonCamera } from '../camera/ThirdPersonCamera'
import type { Player } from '../entities/Player'
import type { BuildingId, BuildingInteriorConfig } from './InteriorTypes'
import { InteriorBuilder } from './InteriorBuilder'
import type { DialogueMessage } from '../core/Types'
import { EventEmitter } from '../core/EventEmitter'

export type InteriorEvents = {
  buildingEntered: { buildingId: BuildingId; displayName: string; district: string; spawnPos: THREE.Vector3 }
  buildingExited: { buildingId: BuildingId; exitPos: THREE.Vector3 }
  dialogue: DialogueMessage
}

export class InteriorManager {
  public readonly group = new THREE.Group()
  public readonly events = new EventEmitter<InteriorEvents>()

  private collisionSystem: CollisionSystem
  private interactionManager: InteractionManager
  private materials: MaterialFactory

  private configs = new Map<BuildingId, BuildingInteriorConfig>()
  private currentBuildingId: BuildingId | null = null
  private cooldownTimer = 0

  private registeredInteractableIds = new Set<string>()

  constructor(
    collisionSystem: CollisionSystem,
    interactionManager: InteractionManager,
    materials: MaterialFactory
  ) {
    this.collisionSystem = collisionSystem
    this.interactionManager = interactionManager
    this.materials = materials
    this.group.name = 'BuildingInteriors'

    this.registerBuildingConfigs()
    this.buildAllInteriors()
    this.registerExteriorEntrancePrompts()
  }

  private registerBuildingConfigs(): void {
    // 1. Heritage Villa Gulmohar (Residential District)
    this.configs.set('heritage_villa_gulmohar', {
      id: 'heritage_villa_gulmohar',
      displayName: 'Heritage Villa Gulmohar',
      district: 'Residential District',
      description: 'Historic Indo-Portuguese coastal residence with carved teak furniture.',
      exteriorDoorPos: new THREE.Vector3(38.0, 0.35, -31.5),
      exteriorExitPos: new THREE.Vector3(38.0, 0.35, -29.8),
      interiorOrigin: new THREE.Vector3(300.0, 0.0, -35.0),
      interiorSpawnPos: new THREE.Vector3(300.0, 0.05, -32.5),
      interiorExitDoorPos: new THREE.Vector3(300.0, 0.05, -31.2),
      roomWidth: 9.0,
      roomDepth: 8.0,
      roomHeight: 3.2,
      wallColorHex: '#fdf0d5',
      trimColorHex: '#780000',
      lightColorHex: 0xffe8d6,
      examineTargets: [
        {
          id: 'villa_samovar',
          label: 'Brass Tea Samovar',
          prompt: 'Examine Brass Samovar',
          position: new THREE.Vector3(300.0, 0.8, -35.0),
          radius: 2.0,
          examineText: 'An antique brass tea samovar engraved with traditional coastal paisley motifs. It still smells faintly of cardamom and cinnamon.',
        },
        {
          id: 'villa_bookshelf',
          label: 'Carved Teak Bookshelf',
          prompt: 'Inspect Teak Bookshelf',
          position: new THREE.Vector3(296.2, 1.2, -35.0),
          radius: 2.0,
          examineText: 'Filled with vintage maritime navigation logs, botany folios of coastal flora, and classical Marathi and Konkani literature.',
        },
        {
          id: 'villa_portrait',
          label: 'Ancestral Portrait',
          prompt: 'View Ancestral Portrait',
          position: new THREE.Vector3(300.0, 1.8, -38.8),
          radius: 2.2,
          examineText: 'A framed portrait of the master shipwright who founded Villa Gulmohar over eighty years ago.',
        },
      ],
    })

    // 2. Market Kirana & Spices Store (Market District)
    this.configs.set('market_kirana_interior', {
      id: 'market_kirana_interior',
      displayName: 'Royal Coastal Kirana & Spices',
      district: 'Market District',
      description: 'Aromatic neighbourhood grocery store stocked with fresh coastal spices and grains.',
      exteriorDoorPos: new THREE.Vector3(27.2, 0.05, 34.0),
      exteriorExitPos: new THREE.Vector3(27.2, 0.05, 32.2),
      interiorOrigin: new THREE.Vector3(300.0, 0.0, 35.0),
      interiorSpawnPos: new THREE.Vector3(300.0, 0.05, 37.5),
      interiorExitDoorPos: new THREE.Vector3(300.0, 0.05, 38.8),
      roomWidth: 8.5,
      roomDepth: 8.0,
      roomHeight: 3.0,
      wallColorHex: '#fefae0',
      trimColorHex: '#d4a373',
      lightColorHex: 0xfff3b0,
      examineTargets: [
        {
          id: 'kirana_register',
          label: 'Billing Register & Weigh Scale',
          prompt: 'Inspect Billing Register',
          position: new THREE.Vector3(298.5, 0.9, 34.5),
          radius: 2.0,
          examineText: 'A traditional brass balancing scale beside a handwritten ledger recording daily sales of Basmati rice, jaggery, and turmeric.',
        },
        {
          id: 'kirana_spices',
          label: 'Coastal Spice Jars',
          prompt: 'Inspect Spice Jars',
          position: new THREE.Vector3(296.2, 1.2, 35.0),
          radius: 2.0,
          examineText: 'Jars of sun-dried Malabar black pepper, green cardamom pods, and intense red Byadgi chili powder fill the shelves.',
        },
      ],
    })

    // 3. Fishermen's Cooperative Reception & Archive (Fishing Harbour)
    this.configs.set('fishermen_cooperative', {
      id: 'fishermen_cooperative',
      displayName: "Fishermen's Cooperative Office",
      district: 'Fishing Harbour',
      description: 'Port authority administration centre and catch recording headquarters.',
      exteriorDoorPos: new THREE.Vector3(-28.0, 0.40, 114.6),
      exteriorExitPos: new THREE.Vector3(-29.8, 0.40, 114.6),
      interiorOrigin: new THREE.Vector3(300.0, 0.0, 75.0),
      interiorSpawnPos: new THREE.Vector3(300.0, 0.05, 77.5),
      interiorExitDoorPos: new THREE.Vector3(300.0, 0.05, 78.8),
      roomWidth: 9.5,
      roomDepth: 8.5,
      roomHeight: 3.4,
      wallColorHex: '#e0e1dd',
      trimColorHex: '#1b263b',
      lightColorHex: 0xe0fbfc,
      examineTargets: [
        {
          id: 'coop_logbook',
          label: 'Harbour Catch Logbook',
          prompt: 'Read Catch Logbook',
          position: new THREE.Vector3(298.5, 0.9, 74.5),
          radius: 2.0,
          examineText: 'Daily records show the "Sea Queen" brought in 800 kg of kingfish and mackerel at dawn today.',
        },
        {
          id: 'coop_chart',
          label: 'Navigational Chart',
          prompt: 'Examine Nautical Chart',
          position: new THREE.Vector3(300.0, 1.8, 70.9),
          radius: 2.2,
          examineText: 'A detailed coastal bathymetry map depicting underwater sandbanks, reef hazards, and the lighthouse beacon arc.',
        },
      ],
    })

    // 4. Highway Outpost Cabin (Countryside Edge)
    this.configs.set('highway_outpost_cabin', {
      id: 'highway_outpost_cabin',
      displayName: 'Highway Checkpoint Outpost',
      district: 'Countryside Edge',
      description: 'Rural boundary station monitoring coastal highway transit.',
      exteriorDoorPos: new THREE.Vector3(95.0, 0.15, 6.85),
      exteriorExitPos: new THREE.Vector3(95.0, 0.15, 5.2),
      interiorOrigin: new THREE.Vector3(300.0, 0.0, -75.0),
      interiorSpawnPos: new THREE.Vector3(300.0, 0.05, -72.5),
      interiorExitDoorPos: new THREE.Vector3(300.0, 0.05, -71.2),
      roomWidth: 7.0,
      roomDepth: 7.0,
      roomHeight: 2.8,
      wallColorHex: '#e9ecef',
      trimColorHex: '#495057',
      lightColorHex: 0xffeedd,
      examineTargets: [
        {
          id: 'outpost_radio',
          label: 'Emergency Transit Radio',
          prompt: 'Check Transit Radio',
          position: new THREE.Vector3(298.5, 0.85, -75.0),
          radius: 2.0,
          examineText: 'VHF shortwave transceiver crackles with occasional coastguard weather bulletins and traffic updates.',
        },
        {
          id: 'outpost_map',
          label: 'Regional Highway Map',
          prompt: 'Inspect Highway Map',
          position: new THREE.Vector3(300.0, 1.6, -78.3),
          radius: 2.0,
          examineText: 'Shows the highway corridor connecting Seaview Town northward to the fishing wharf and eastward into the hinterland.',
        },
      ],
    })
  }

  private buildAllInteriors(): void {
    for (const config of this.configs.values()) {
      const room = InteriorBuilder.buildRoomShell(
        this.group,
        this.collisionSystem,
        this.materials,
        config
      )

      const ox = config.interiorOrigin.x
      const oy = config.interiorOrigin.y
      const oz = config.interiorOrigin.z

      // Furnish each building with specific authentic interior props
      if (config.id === 'heritage_villa_gulmohar') {
        InteriorBuilder.addRug(room, this.materials, 0, 0, 4.0, 3.2, 0x780000)
        InteriorBuilder.addTable(room, this.collisionSystem, this.materials, ox, oy, oz, 0, 0, 1.8, 1.2, 'Villa_Table')
        InteriorBuilder.addChair(room, this.collisionSystem, this.materials, ox, oy, oz, -1.4, 0, Math.PI / 2, 'Villa_Chair_1')
        InteriorBuilder.addChair(room, this.collisionSystem, this.materials, ox, oy, oz, 1.4, 0, -Math.PI / 2, 'Villa_Chair_2')
        InteriorBuilder.addWallShelf(room, this.collisionSystem, this.materials, ox, oy, oz, -3.8, 0, 0.6, 2.2, 2.8, 'Villa_Shelf')
        InteriorBuilder.addWallArt(room, this.materials, 0, 1.8, -3.9, 2.0, 1.4, 0x3d5a80)
      } else if (config.id === 'market_kirana_interior') {
        InteriorBuilder.addCounter(room, this.collisionSystem, this.materials, ox, oy, oz, -1.5, 0, -0.5, 3.0, 0.9, 0.8, 'Kirana_Counter')
        InteriorBuilder.addWallShelf(room, this.collisionSystem, this.materials, ox, oy, oz, -3.8, 0, 0.6, 2.4, 3.2, 'Kirana_Shelf_West')
        InteriorBuilder.addWallShelf(room, this.collisionSystem, this.materials, ox, oy, oz, 0, -3.8, 4.2, 2.4, 0.6, 'Kirana_Shelf_North')
        InteriorBuilder.addTable(room, this.collisionSystem, this.materials, ox, oy, oz, 2.0, 0.5, 1.8, 1.4, 'Kirana_Produce_Table')
      } else if (config.id === 'fishermen_cooperative') {
        InteriorBuilder.addCounter(room, this.collisionSystem, this.materials, ox, oy, oz, -1.5, 0, -0.5, 3.2, 0.9, 0.9, 'Coop_Desk')
        InteriorBuilder.addChair(room, this.collisionSystem, this.materials, ox, oy, oz, -1.5, -1.5, 0, 'Coop_Clerk_Chair')
        InteriorBuilder.addWallShelf(room, this.collisionSystem, this.materials, ox, oy, oz, 3.8, 0, 0.6, 2.4, 3.0, 'Coop_Cabinet')
        InteriorBuilder.addWallArt(room, this.materials, 0, 1.8, -4.1, 2.6, 1.6, 0x1d3557)
      } else if (config.id === 'highway_outpost_cabin') {
        InteriorBuilder.addTable(room, this.collisionSystem, this.materials, ox, oy, oz, -1.5, 0, 1.8, 1.0, 'Outpost_Desk')
        InteriorBuilder.addChair(room, this.collisionSystem, this.materials, ox, oy, oz, -1.5, -1.0, 0, 'Outpost_Chair')
        InteriorBuilder.addCounter(room, this.collisionSystem, this.materials, ox, oy, oz, 2.0, 0, -1.5, 2.2, 0.55, 1.2, 'Outpost_Cot_Bed')
        InteriorBuilder.addWallArt(room, this.materials, 0, 1.6, -3.4, 2.0, 1.2, 0x2b2d42)
      }
    }
  }

  private registerExteriorEntrancePrompts(): void {
    for (const config of this.configs.values()) {
      const enterPromptId = `enter_${config.id}`
      this.interactionManager.register({
        id: enterPromptId,
        type: 'door_open',
        position: config.exteriorDoorPos,
        interactionRadius: 2.2,
        promptText: `Enter ${config.displayName}`,
        promptKey: 'F',
        canInteract: () => this.currentBuildingId === null && this.cooldownTimer <= 0,
        onInteract: player => {
          this.enterBuilding(config.id, player)
        },
      })
      this.registeredInteractableIds.add(enterPromptId)
    }
  }

  public enterBuilding(
    buildingId: BuildingId,
    player: Player,
    camera?: ThirdPersonCamera
  ): boolean {
    if (this.currentBuildingId || this.cooldownTimer > 0) return false

    const config = this.configs.get(buildingId)
    if (!config) return false

    this.currentBuildingId = buildingId
    this.cooldownTimer = 0.5

    // Teleport player to interior spawn location
    player.setPosition(config.interiorSpawnPos.x, config.interiorSpawnPos.y, config.interiorSpawnPos.z)
    player.modelRoot.rotation.y = 0

    // Set camera to indoor mode (tighter distance)
    if (camera) {
      camera.distance = 2.6
      camera.snapBehindPlayer(config.interiorSpawnPos, 0)
    }

    // Register interior exit door prompt
    const exitPromptId = 'exit_building_door'
    this.interactionManager.register({
      id: exitPromptId,
      type: 'door_open',
      position: config.interiorExitDoorPos,
      interactionRadius: 2.0,
      promptText: `Exit to ${config.district}`,
      promptKey: 'F',
      canInteract: () => this.currentBuildingId !== null && this.cooldownTimer <= 0,
      onInteract: p => {
        this.exitBuilding(p, camera)
      },
    })
    this.registeredInteractableIds.add(exitPromptId)

    // Register interior examine targets
    for (const target of config.examineTargets) {
      this.interactionManager.register({
        id: target.id,
        type: 'generic',
        position: target.position,
        interactionRadius: target.radius,
        promptText: target.prompt,
        promptKey: 'F',
        canInteract: () => this.currentBuildingId === buildingId && this.cooldownTimer <= 0,
        onInteract: () => {
          this.examineTarget(target)
        },
      })
      this.registeredInteractableIds.add(target.id)
    }

    this.events.emit('buildingEntered', {
      buildingId: config.id,
      displayName: config.displayName,
      district: config.district,
      spawnPos: config.interiorSpawnPos,
    })
    return true
  }

  public exitBuilding(player: Player, camera?: ThirdPersonCamera): boolean {
    if (!this.currentBuildingId || this.cooldownTimer > 0) return false

    const config = this.configs.get(this.currentBuildingId)
    if (!config) return false

    // Clean up interior prompts
    this.interactionManager.unregister('exit_building_door')
    this.registeredInteractableIds.delete('exit_building_door')

    for (const target of config.examineTargets) {
      this.interactionManager.unregister(target.id)
      this.registeredInteractableIds.delete(target.id)
    }

    const prevId = this.currentBuildingId
    this.currentBuildingId = null
    this.cooldownTimer = 0.5

    // Teleport player back to exterior exit location
    player.setPosition(config.exteriorExitPos.x, config.exteriorExitPos.y, config.exteriorExitPos.z)
    player.modelRoot.rotation.y = Math.PI

    // Restore camera to normal outdoor mode
    if (camera) {
      camera.distance = 4.8
      camera.snapBehindPlayer(config.exteriorExitPos, Math.PI)
    }

    this.events.emit('buildingExited', {
      buildingId: prevId,
      exitPos: config.exteriorExitPos,
    })
    return true
  }

  private examineTarget(target: any): void {
    const msg: DialogueMessage = {
      speaker: target.label,
      title: 'EXAMINE',
      text: target.examineText,
      duration: 5.0,
    }
    this.events.emit('dialogue', msg)
  }

  public getCurrentBuilding(): BuildingInteriorConfig | null {
    if (!this.currentBuildingId) return null
    return this.configs.get(this.currentBuildingId) || null
  }

  public isIndoor(): boolean {
    return this.currentBuildingId !== null
  }

  public getAllConfigs(): BuildingInteriorConfig[] {
    return Array.from(this.configs.values())
  }

  public update(dt: number, _playerPos: THREE.Vector3, _player: Player, camera?: ThirdPersonCamera): void {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt
    }

    // Camera constraint indoor
    if (this.currentBuildingId && camera) {
      if (camera.distance > 3.0) {
        camera.distance = 2.6
      }
    }
  }

  public dispose(): void {
    for (const id of this.registeredInteractableIds) {
      this.interactionManager.unregister(id)
    }
    this.registeredInteractableIds.clear()
    this.currentBuildingId = null
    this.group.clear()
    this.events.removeAllListeners()
  }
}
