import * as THREE from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { CollisionSystem } from '../physics/CollisionSystem'
import type { InteractionManager } from '../interaction/InteractionManager'
import type { CityNavigationGraph } from './CityNavigationGraph'
import type { DialogueMessage } from '../core/Types'
import { EventEmitter } from '../core/EventEmitter'

export type CityNPCRole =
  | 'stroller'
  | 'bench_sitter'
  | 'conversing'
  | 'shopkeeper'
  | 'harbour_worker'
  | 'checkpoint_guard'

export type CityNPCArchetype = 'aarav' | 'ananya'

export interface CityNPCConfig {
  id: string
  name: string
  title: string
  district: 'town_centre' | 'beach_promenade' | 'fishing_harbour' | 'market_district' | 'residential_district' | 'countryside_edge'
  role: CityNPCRole
  archetype: CityNPCArchetype
  spawnPosition: THREE.Vector3
  facingAngle?: number
  clothingColor?: number
  dialogueLine: string
  startNodeId?: string
  benchSeatPosition?: THREE.Vector3
  partnerId?: string
}

export type CityNPCEvents = {
  dialogue: DialogueMessage
}

export class CityNPC {
  public readonly id: string
  public readonly name: string
  public readonly title: string
  public readonly district: string
  public readonly role: CityNPCRole
  public readonly archetype: CityNPCArchetype
  public readonly group = new THREE.Group()
  public readonly events = new EventEmitter<CityNPCEvents>()

  public position: THREE.Vector3
  public heading: number
  public currentSpeed = 0
  public state: 'idle' | 'walking' | 'sitting' | 'talking' | 'conversing' | 'browsing' = 'idle'
  public isDormant = false

  private modelScene: THREE.Group | null = null
  private mixer: THREE.AnimationMixer | null = null
  private actions = new Map<string, THREE.AnimationAction>()
  private currentAction: THREE.AnimationAction | null = null
  private currentActionName = ''

  // Navigation state
  private navGraph?: CityNavigationGraph
  private collisionSystem?: CollisionSystem
  private path: THREE.Vector3[] = []
  private pathIndex = 0
  private currentNodeId: string = ''
  private patrolSpeed = 1.35
  private pauseTimer = 0
  private converseTimer = 0
  private partnerNPC: CityNPC | null = null

  // Interaction & talking
  private interactionId: string
  private isTalkingToPlayer = false
  private talkTimer = 0
  private dialogueLine: string

  // Performance LOD
  private distanceToPlayer = 0
  private shadowCasting = true
  private lodUpdateTimer = 0

  constructor(
    config: CityNPCConfig,
    gltfTemplate: GLTF,
    collisionSystem: CollisionSystem,
    interactionManager: InteractionManager,
    navGraph?: CityNavigationGraph
  ) {
    this.id = config.id
    this.name = config.name
    this.title = config.title
    this.district = config.district
    this.role = config.role
    this.archetype = config.archetype
    this.position = config.spawnPosition.clone()
    this.heading = config.facingAngle ?? 0
    this.dialogueLine = config.dialogueLine
    this.currentNodeId = config.startNodeId ?? ''

    this.collisionSystem = collisionSystem
    this.navGraph = navGraph
    this.interactionId = `npc_talk_${this.id}`

    this.group.name = `NPC_${this.id}`
    this.group.position.copy(this.position)
    this.group.rotation.y = this.heading

    this.initModel(gltfTemplate, config.clothingColor)
    this.setupInitialState(config)
    this.registerInteraction(interactionManager)
  }

  private initModel(gltf: GLTF, clothingColor?: number): void {
    this.modelScene = SkeletonUtils.clone(gltf.scene) as THREE.Group
    this.modelScene.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.frustumCulled = false

        if (clothingColor !== undefined && child.material) {
          const matName = (child.material.name || '').toLowerCase()
          if (
            matName.includes('shirt') ||
            matName.includes('overshirt') ||
            matName.includes('tshirt') ||
            matName.includes('cloth') ||
            matName.includes('jacket')
          ) {
            const tinted = child.material.clone()
            if (tinted.color) {
              tinted.color.setHex(clothingColor)
            }
            child.material = tinted
          }
        }
      }
    })

    this.group.add(this.modelScene)

    this.mixer = new THREE.AnimationMixer(this.modelScene)
    for (const clip of gltf.animations) {
      const action = this.mixer.clipAction(clip)
      const lower = clip.name.toLowerCase()
      const isOneShot = lower.includes('interaction') || lower.includes('landing') || lower.includes('jump')

      if (isOneShot) {
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
      } else {
        action.setLoop(THREE.LoopRepeat, Infinity)
      }

      this.actions.set(clip.name, action)
      if (lower.includes('idle')) this.actions.set('idle', action)
      else if (lower.includes('walk')) this.actions.set('walk', action)
      else if (lower.includes('run')) this.actions.set('run', action)
      else if (lower.includes('turn')) this.actions.set('turn_left', action)
      else if (lower.includes('interaction')) this.actions.set('hand_interaction', action)
    }
  }

  private setupInitialState(config: CityNPCConfig): void {
    if (this.role === 'bench_sitter') {
      this.state = 'sitting'
      if (config.benchSeatPosition) {
        this.position.copy(config.benchSeatPosition)
        this.group.position.copy(this.position)
      }
      this.playAction('idle', 0.1)
    } else if (this.role === 'conversing') {
      this.state = 'conversing'
      this.converseTimer = 2.0 + Math.random() * 4.0
      this.playAction('idle', 0.1)
    } else if (this.role === 'stroller') {
      this.state = 'walking'
      this.playAction('walk', 0.1)
      this.requestNextPath()
    } else {
      this.state = 'idle'
      this.playAction('idle', 0.1)
    }
  }

  public setPartner(partner: CityNPC): void {
    this.partnerNPC = partner
  }

  private registerInteraction(interactionManager: InteractionManager): void {
    interactionManager.register({
      id: this.interactionId,
      type: 'npc_talk',
      position: this.position,
      interactionRadius: 2.6,
      promptText: `Talk to ${this.name} (${this.title})`,
      promptKey: 'F',
      canInteract: () => !this.isTalkingToPlayer,
      onInteract: (player: any) => {
        this.talkToPlayer(player)
      },
    })
  }

  public talkToPlayer(player: any): void {
    this.isTalkingToPlayer = true
    this.talkTimer = 4.5
    this.state = 'talking'

    // Smoothly turn toward player
    const playerPos = player.getPosition ? player.getPosition() : player.mesh.position
    const dx = playerPos.x - this.position.x
    const dz = playerPos.z - this.position.z
    this.heading = Math.atan2(dx, dz)
    this.group.rotation.y = this.heading

    // Play greeting hand gesture
    this.playAction('hand_interaction', 0.15)

    // Emit dialogue line
    const msg: DialogueMessage = {
      speaker: this.name,
      title: this.title,
      text: this.dialogueLine,
      district: this.district,
      duration: 4.5,
    }
    this.events.emit('dialogue', msg)
  }

  public playAction(actionName: string, fadeDuration = 0.25): void {
    if (this.currentActionName === actionName) return
    const next = this.actions.get(actionName)
    if (!next) return

    if (this.currentAction && this.currentAction !== next) {
      this.currentAction.fadeOut(fadeDuration)
    }

    next.reset()
    next.enabled = true
    next.fadeIn(fadeDuration)
    next.play()

    this.currentAction = next
    this.currentActionName = actionName
  }

  private requestNextPath(): void {
    if (!this.navGraph) return
    let current = this.currentNodeId ? this.navGraph.getNode(this.currentNodeId) : undefined
    if (!current) {
      current = this.navGraph.getNearestNode(this.position, this.district)
      this.currentNodeId = current.id
    }

    // Pick random connected node
    const nextNode = this.navGraph.getRandomConnectedNode(this.currentNodeId)
    this.path = this.navGraph.findShortestPath(this.currentNodeId, nextNode.id)
    this.pathIndex = 0
    this.currentNodeId = nextNode.id
  }

  public update(dt: number, playerPos: THREE.Vector3, otherNPCs: CityNPC[]): void {
    this.distanceToPlayer = this.position.distanceTo(playerPos)

    // 1. Distance-based LOD
    if (this.distanceToPlayer > 80) {
      this.isDormant = true
      this.group.visible = false
      return
    }

    this.group.visible = true
    this.isDormant = false

    // Shadow culling beyond 30m
    const castShadow = this.distanceToPlayer <= 30
    if (this.shadowCasting !== castShadow) {
      this.shadowCasting = castShadow
      this.group.traverse(c => {
        if ((c as THREE.Mesh).isMesh) {
          c.castShadow = castShadow
        }
      })
    }

    // 2. Talking to player state
    if (this.isTalkingToPlayer) {
      this.talkTimer -= dt
      if (this.talkTimer <= 0) {
        this.isTalkingToPlayer = false
        if (this.role === 'stroller') {
          this.state = 'walking'
          this.playAction('walk', 0.25)
        } else if (this.role === 'bench_sitter') {
          this.state = 'sitting'
          this.playAction('idle', 0.25)
        } else {
          this.state = 'idle'
          this.playAction('idle', 0.25)
        }
      }
      if (this.mixer) this.mixer.update(dt)
      return
    }

    // 3. Role-specific behavior
    if (this.role === 'stroller') {
      this.updateStroller(dt, playerPos, otherNPCs)
    } else if (this.role === 'conversing') {
      this.updateConversing(dt)
    } else if (this.role === 'bench_sitter') {
      this.updateBenchSitter()
    } else {
      this.updateStationary(dt)
    }

    // 4. Update skeletal animation mixer
    if (this.mixer) {
      // Throttle mixer update when medium distance (45m - 80m) to save CPU
      if (this.distanceToPlayer <= 45) {
        this.mixer.update(dt)
      } else {
        this.lodUpdateTimer += dt
        if (this.lodUpdateTimer >= 0.033) {
          this.mixer.update(this.lodUpdateTimer)
          this.lodUpdateTimer = 0
        }
      }
    }
  }

  private updateBenchSitter(): void {
    // Sits peacefully enjoying view
    if (this.currentActionName !== 'idle') {
      this.playAction('idle', 0.2)
    }
  }

  private updateConversing(dt: number): void {
    this.converseTimer -= dt
    if (this.converseTimer <= 0) {
      this.converseTimer = 3.5 + Math.random() * 5.0
      // Chance of gesturing during conversation
      if (Math.random() < 0.45) {
        this.playAction('hand_interaction', 0.2)
      } else {
        this.playAction('idle', 0.2)
      }
    }

    // Face conversational partner if set
    if (this.partnerNPC) {
      const dx = this.partnerNPC.position.x - this.position.x
      const dz = this.partnerNPC.position.z - this.position.z
      this.heading = Math.atan2(dx, dz)
      this.group.rotation.y = this.heading
    }
  }

  private updateStationary(dt: number): void {
    this.pauseTimer -= dt
    if (this.pauseTimer <= 0) {
      this.pauseTimer = 4.0 + Math.random() * 6.0
      if (Math.random() < 0.3) {
        this.playAction('hand_interaction', 0.2)
      } else {
        this.playAction('idle', 0.2)
      }
    }
  }

  private updateStroller(dt: number, _playerPos: THREE.Vector3, otherNPCs: CityNPC[]): void {
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt
      if (this.pauseTimer <= 0) {
        this.state = 'walking'
        this.playAction('walk', 0.25)
      } else {
        return
      }
    }

    // Yield if player is directly in front (< 1.5m)
    if (this.distanceToPlayer < 1.5) {
      this.playAction('idle', 0.15)
      return
    }

    // Advance path
    if (this.path.length === 0 || this.pathIndex >= this.path.length) {
      this.requestNextPath()
      if (this.path.length === 0) {
        this.playAction('idle', 0.2)
        return
      }
    }

    const targetPos = this.path[this.pathIndex]
    const toTarget = new THREE.Vector3(targetPos.x - this.position.x, 0, targetPos.z - this.position.z)
    const distToTarget = toTarget.length()

    if (distToTarget < 0.8) {
      this.pathIndex++
      if (this.pathIndex >= this.path.length) {
        // Reached end of path: chance to rest / look at view
        if (Math.random() < 0.3) {
          this.state = 'browsing'
          this.pauseTimer = 2.5 + Math.random() * 3.5
          this.playAction(Math.random() < 0.5 ? 'hand_interaction' : 'idle', 0.2)
        }
        this.requestNextPath()
      }
      return
    }

    toTarget.normalize()

    // Smooth heading rotation
    const targetHeading = Math.atan2(toTarget.x, toTarget.z)
    let headingDiff = targetHeading - this.heading
    while (headingDiff > Math.PI) headingDiff -= Math.PI * 2
    while (headingDiff < -Math.PI) headingDiff += Math.PI * 2
    this.heading += headingDiff * Math.min(dt * 5.0, 1.0)
    this.group.rotation.y = this.heading

    // Dynamic obstacle avoidance against other NPCs
    const forwardStep = this.patrolSpeed * dt
    let moveDir = toTarget.clone()

    for (const other of otherNPCs) {
      if (other === this || other.isDormant) continue
      const dist = this.position.distanceTo(other.position)
      if (dist < 1.4) {
        // Deflect slightly sideways away from other NPC
        const away = this.position.clone().sub(other.position).normalize()
        away.y = 0
        moveDir.add(away.multiplyScalar(0.75)).normalize()
      }
    }

    const nextX = this.position.x + moveDir.x * forwardStep
    const nextZ = this.position.z + moveDir.z * forwardStep

    // Obstacle collision check: verify next step does not penetrate buildings or walls
    if (this.collisionSystem) {
      const isBlocked = this.collisionSystem.isPositionBlocked(nextX, this.position.y, nextZ, 0.35, 1.8)
      if (!isBlocked) {
        this.position.x = nextX
        this.position.z = nextZ

        // Ground snapping to adapt to curbs, platforms, decks, and sand
        const groundHeight = this.collisionSystem.getGroundHeight(
          this.position.x,
          this.position.y + 0.6,
          this.position.z,
          0.35
        )
        if (groundHeight > -5.0) {
          this.position.y = groundHeight
        }
      } else {
        // Path blocked by obstacle: request alternate path or pause
        this.pauseTimer = 1.0
        this.playAction('idle', 0.2)
        this.requestNextPath()
        return
      }
    } else {
      this.position.x = nextX
      this.position.z = nextZ
    }

    this.group.position.copy(this.position)
    if (this.currentActionName !== 'walk') {
      this.playAction('walk', 0.2)
    }
  }

  public dispose(interactionManager: InteractionManager): void {
    interactionManager.unregister(this.interactionId)
    if (this.mixer) {
      this.mixer.stopAllAction()
      this.mixer = null
    }
    this.actions.clear()
    this.group.clear()
    this.events.removeAllListeners()
  }
}
