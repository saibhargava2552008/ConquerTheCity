import * as THREE from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

export type NPCRole = 'pedestrian' | 'shopkeeper' | 'chai_wallah' | 'chai_customer'
export type NPCArchetype = 'aarav' | 'ananya'

export interface NPCConfig {
  id: string
  name: string
  role: NPCRole
  archetype: NPCArchetype
  spawnPosition: THREE.Vector3
  facingAngle: number
  clothingColor?: number
  waypoints?: THREE.Vector3[]
  patrolSpeed?: number
  pauseAtWaypoints?: boolean
  browseLocations?: THREE.Vector3[]
  chatTargetId?: string
}

export type NPCState = 'idle' | 'walking' | 'browsing' | 'conversing' | 'serving'

export class MarketNPC {
  public readonly id: string
  public readonly name: string
  public readonly role: NPCRole
  public readonly group = new THREE.Group()

  public position: THREE.Vector3
  public facingAngle: number
  public state: NPCState = 'idle'

  private modelScene: THREE.Group | null = null
  private mixer: THREE.AnimationMixer | null = null
  private actions = new Map<string, THREE.AnimationAction>()
  private currentAction: THREE.AnimationAction | null = null
  private currentActionName = ''

  private waypoints: THREE.Vector3[] = []
  private currentWaypointIndex = 0
  private patrolSpeed = 1.25
  private pauseTimer = 0
  private browseTimer = 0
  private interactionTimer = 0
  private isForward = true

  // LOD and performance budgeting
  private distanceToPlayer = 0
  private isDormant = false
  private isShadowCasting = true

  constructor(config: NPCConfig, gltfTemplate: GLTF) {
    this.id = config.id
    this.name = config.name
    this.role = config.role
    this.position = config.spawnPosition.clone()
    this.facingAngle = config.facingAngle
    this.patrolSpeed = config.patrolSpeed ?? 1.25

    if (config.waypoints && config.waypoints.length > 0) {
      this.waypoints = config.waypoints.map(w => w.clone())
      this.state = 'walking'
    } else {
      this.state = this.role === 'chai_wallah' ? 'serving' : 'idle'
    }

    this.group.position.copy(this.position)
    this.group.rotation.y = this.facingAngle

    this.initModel(gltfTemplate, config.clothingColor)
  }

  private initModel(gltf: GLTF, clothingColor?: number): void {
    // Clone rigged model hierarchy cleanly
    this.modelScene = SkeletonUtils.clone(gltf.scene) as THREE.Group
    this.modelScene.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.frustumCulled = false

        // Custom clothing tint for individual Indian market resident look
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

    // Setup animation mixer on the cloned skeleton
    this.mixer = new THREE.AnimationMixer(this.modelScene)
    for (const clip of gltf.animations) {
      const action = this.mixer.clipAction(clip)
      const lower = clip.name.toLowerCase()
      const isOneShot =
        lower.includes('jump') ||
        lower.includes('landing') ||
        lower.includes('interaction')

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

    // Initial animation action
    if (this.state === 'walking') {
      this.playAction('walk', 0.1)
    } else {
      this.playAction('idle', 0.1)
    }
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

  public update(dt: number, playerPos: THREE.Vector3, otherNPCs: MarketNPC[]): void {
    this.distanceToPlayer = this.position.distanceTo(playerPos)

    // Distance-based LOD activation / deactivation
    if (this.distanceToPlayer > 85) {
      // Completely dormant when far away to preserve 60 FPS
      this.isDormant = true
      this.group.visible = false
      return
    }

    this.group.visible = true
    this.isDormant = false

    // Dynamic distance-based shadow culling (disable shadows beyond 28m)
    const shouldCastShadow = this.distanceToPlayer <= 28
    if (this.isShadowCasting !== shouldCastShadow) {
      this.isShadowCasting = shouldCastShadow
      this.group.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          c.castShadow = shouldCastShadow
        }
      })
    }

    // Simulation updates
    if (this.role === 'pedestrian') {
      this.updatePedestrian(dt, playerPos, otherNPCs)
    } else if (this.role === 'shopkeeper') {
      this.updateShopkeeper(dt, playerPos)
    } else if (this.role === 'chai_wallah') {
      this.updateChaiWallah(dt)
    } else if (this.role === 'chai_customer') {
      this.updateChaiCustomer(dt, playerPos)
    }

    // Mixer update with distance throttle (every frame when close, every 2nd frame when medium)
    if (this.mixer) {
      this.mixer.update(dt)
    }
  }

  private updatePedestrian(dt: number, playerPos: THREE.Vector3, otherNPCs: MarketNPC[]): void {
    if (this.waypoints.length === 0) {
      this.playAction('idle')
      return
    }

    // Check pause/browse timers
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt
      if (this.pauseTimer <= 0) {
        this.state = 'walking'
        this.playAction('walk', 0.3)
      } else {
        // Paused looking at shop or stall
        return
      }
    }

    // Check player proximity avoidance (stop or yield if player is directly ahead within 1.3m)
    const distToPlayer = this.position.distanceTo(playerPos)
    if (distToPlayer < 1.3) {
      this.playAction('idle', 0.2)
      return
    }

    // Check other NPC avoidance
    for (const other of otherNPCs) {
      if (other === this) continue
      const dist = this.position.distanceTo(other.position)
      if (dist < 1.1) {
        // Small lateral nudge
        const nudge = this.position.clone().sub(other.position).normalize().multiplyScalar(0.2 * dt)
        this.position.x += nudge.x
        this.position.z += nudge.z
      }
    }

    // Navigate to current waypoint
    const targetWp = this.waypoints[this.currentWaypointIndex]
    const toTarget = new THREE.Vector3(targetWp.x - this.position.x, 0, targetWp.z - this.position.z)
    const distToTarget = toTarget.length()

    if (distToTarget < 0.6) {
      // Reached waypoint: chance to browse or pause
      const shouldBrowse = Math.random() < 0.28
      if (shouldBrowse) {
        this.state = 'browsing'
        this.pauseTimer = 2.5 + Math.random() * 3.5
        this.playAction(Math.random() < 0.5 ? 'hand_interaction' : 'idle', 0.25)
      }

      // Advance waypoint index
      if (this.isForward) {
        this.currentWaypointIndex++
        if (this.currentWaypointIndex >= this.waypoints.length) {
          this.currentWaypointIndex = this.waypoints.length - 2
          this.isForward = false
        }
      } else {
        this.currentWaypointIndex--
        if (this.currentWaypointIndex < 0) {
          this.currentWaypointIndex = 1
          this.isForward = true
        }
      }
      return
    }

    // Step forward along path
    toTarget.normalize()
    const moveStep = this.patrolSpeed * dt
    this.position.x += toTarget.x * moveStep
    this.position.z += toTarget.z * moveStep

    // Smoothly turn to face movement vector
    const targetAngle = Math.atan2(toTarget.x, toTarget.z)
    let angleDiff = targetAngle - this.facingAngle
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
    this.facingAngle += angleDiff * Math.min(dt * 6.0, 1.0)

    this.group.position.copy(this.position)
    this.group.rotation.y = this.facingAngle
    this.playAction('walk', 0.2)
  }

  private updateShopkeeper(dt: number, playerPos: THREE.Vector3): void {
    this.interactionTimer += dt

    // Turn toward player if player walks up close to shop counter
    const distToPlayer = this.position.distanceTo(playerPos)
    if (distToPlayer < 3.5) {
      const toPlayer = playerPos.clone().sub(this.position)
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z)
      let angleDiff = targetAngle - this.facingAngle
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      this.group.rotation.y += angleDiff * Math.min(dt * 3.0, 1.0)

      // Friendly greeting hand gesture
      if (this.interactionTimer > 5.0 && Math.random() < 0.3) {
        this.playAction('hand_interaction', 0.2)
        this.interactionTimer = 0
      }
    } else {
      // Natural shopkeeper idle
      if (this.interactionTimer > 8.0) {
        this.interactionTimer = 0
        if (Math.random() < 0.4) {
          this.playAction('hand_interaction', 0.2)
        } else {
          this.playAction('idle', 0.2)
        }
      }
    }
  }

  private updateChaiWallah(dt: number): void {
    this.interactionTimer += dt
    // Chai brewing rhythm: cycles between serving gestures and idle
    if (this.interactionTimer > 4.5) {
      this.interactionTimer = 0
      if (this.currentActionName === 'hand_interaction') {
        this.playAction('idle', 0.3)
      } else {
        this.playAction('hand_interaction', 0.25)
      }
    }
  }

  private updateChaiCustomer(dt: number, playerPos: THREE.Vector3): void {
    this.interactionTimer += dt
    // Casual conversing gestures
    if (this.interactionTimer > 6.0) {
      this.interactionTimer = 0
      if (Math.random() < 0.35) {
        this.playAction('hand_interaction', 0.3)
      } else {
        this.playAction('idle', 0.3)
      }
    }
  }

  public dispose(): void {
    if (this.mixer) {
      this.mixer.stopAllAction()
      this.mixer = null
    }
    this.actions.clear()
    this.group.clear()
  }
}
