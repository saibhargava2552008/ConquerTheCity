import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Entity } from './Entity'
import type { MovementState } from '../core/Types'
import { damp, clamp } from '../physics/MathUtils'

export class Player extends Entity {
  // Visual root for orientation and banking
  public readonly modelRoot: THREE.Group

  // Fallback procedural visual limbs
  private readonly placeholderGroup: THREE.Group
  private readonly head: THREE.Mesh
  private readonly torso: THREE.Mesh
  private readonly leftArmPivot: THREE.Group
  private readonly rightArmPivot: THREE.Group
  private readonly leftLegPivot: THREE.Group
  private readonly rightLegPivot: THREE.Group

  // Skeletal model & Animation Mixer
  private aaravModel: THREE.Group | null = null
  private mixer: THREE.AnimationMixer | null = null
  private readonly actions = new Map<string, THREE.AnimationAction>()
  private currentAction: THREE.AnimationAction | null = null
  private currentActionName = ''
  private isLoaded = false
  private loadFailed = false

  // Animation states & timers
  private animPhase = 0
  private currentTilt = 0
  private wasGrounded = true
  private landingTimer = 0
  private interactionTimer = 0

  constructor(modelUrl = '/models/aarav_character.glb') {
    super('player_character')

    this.modelRoot = new THREE.Group()
    this.mesh.add(this.modelRoot)

    // ------------------------------------------------------------------
    // 1. PROCEDURAL PLACEHOLDER MODEL (Fallback & Zero-Lag Immediate Render)
    // ------------------------------------------------------------------
    this.placeholderGroup = new THREE.Group()
    this.modelRoot.add(this.placeholderGroup)

    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x1d3557,
      roughness: 0.6,
      metalness: 0.1,
    })
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x2b2d42,
      roughness: 0.7,
      metalness: 0.1,
    })
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe0a96d,
      roughness: 0.8,
    })
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00bbf9,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.9,
    })
    const bootsMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.8,
    })
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xf72585,
      emissive: 0xf72585,
      emissiveIntensity: 0.3,
    })

    // Torso (center at y = 1.05)
    const torsoGeo = new THREE.BoxGeometry(0.65, 0.75, 0.35)
    this.torso = new THREE.Mesh(torsoGeo, jacketMat)
    this.torso.position.y = 1.05
    this.torso.castShadow = true
    this.torso.receiveShadow = true
    this.placeholderGroup.add(this.torso)

    const stripeGeo = new THREE.BoxGeometry(0.67, 0.1, 0.36)
    const stripe = new THREE.Mesh(stripeGeo, accentMat)
    stripe.position.y = 0.05
    this.torso.add(stripe)

    const packGeo = new THREE.BoxGeometry(0.45, 0.5, 0.2)
    const pack = new THREE.Mesh(packGeo, pantsMat)
    pack.position.set(0, 0.05, -0.25)
    pack.castShadow = true
    this.torso.add(pack)

    // Head (center at y = 1.62)
    const headGeo = new THREE.BoxGeometry(0.35, 0.38, 0.35)
    this.head = new THREE.Mesh(headGeo, skinMat)
    this.head.position.y = 1.62
    this.head.castShadow = true
    this.placeholderGroup.add(this.head)

    const visorGeo = new THREE.BoxGeometry(0.37, 0.12, 0.18)
    const visor = new THREE.Mesh(visorGeo, visorMat)
    visor.position.set(0, 0.02, 0.14)
    this.head.add(visor)

    // Left Arm Pivot
    this.leftArmPivot = new THREE.Group()
    this.leftArmPivot.position.set(-0.45, 1.35, 0)
    this.placeholderGroup.add(this.leftArmPivot)

    const armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.2)
    const leftArmMesh = new THREE.Mesh(armGeo, jacketMat)
    leftArmMesh.position.y = -0.3
    leftArmMesh.castShadow = true
    this.leftArmPivot.add(leftArmMesh)

    // Right Arm Pivot
    this.rightArmPivot = new THREE.Group()
    this.rightArmPivot.position.set(0.45, 1.35, 0)
    this.placeholderGroup.add(this.rightArmPivot)

    const rightArmMesh = new THREE.Mesh(armGeo, jacketMat)
    rightArmMesh.position.y = -0.3
    rightArmMesh.castShadow = true
    this.rightArmPivot.add(rightArmMesh)

    // Left Leg Pivot
    this.leftLegPivot = new THREE.Group()
    this.leftLegPivot.position.set(-0.2, 0.72, 0)
    this.placeholderGroup.add(this.leftLegPivot)

    const legGeo = new THREE.BoxGeometry(0.22, 0.7, 0.24)
    const leftLegMesh = new THREE.Mesh(legGeo, pantsMat)
    leftLegMesh.position.y = -0.32
    leftLegMesh.castShadow = true
    this.leftLegPivot.add(leftLegMesh)

    const bootGeo = new THREE.BoxGeometry(0.23, 0.16, 0.32)
    const leftBootMesh = new THREE.Mesh(bootGeo, bootsMat)
    leftBootMesh.position.set(0, -0.62, 0.04)
    leftBootMesh.castShadow = true
    this.leftLegPivot.add(leftBootMesh)

    // Right Leg Pivot
    this.rightLegPivot = new THREE.Group()
    this.rightLegPivot.position.set(0.2, 0.72, 0)
    this.placeholderGroup.add(this.rightLegPivot)

    const rightLegMesh = new THREE.Mesh(legGeo, pantsMat)
    rightLegMesh.position.y = -0.32
    rightLegMesh.castShadow = true
    this.rightLegPivot.add(rightLegMesh)

    const rightBootMesh = new THREE.Mesh(bootGeo, bootsMat)
    rightBootMesh.position.set(0, -0.62, 0.04)
    rightBootMesh.castShadow = true
    this.rightLegPivot.add(rightBootMesh)

    // ------------------------------------------------------------------
    // 2. ASYNC LOAD AARAV GLTF ASSET (Browser runtime only)
    // ------------------------------------------------------------------
    const isBrowser =
      typeof window !== 'undefined' &&
      typeof window.location !== 'undefined' &&
      typeof window.location.origin === 'string' &&
      window.location.origin.startsWith('http')

    if (isBrowser && modelUrl) {
      this.loadModel(modelUrl)
    }
  }

  /**
   * Asynchronously loads Aarav 3D GLTF asset with shadow binding and animation setup
   */
  private loadModel(url: string): void {
    try {
      const loader = new GLTFLoader()
      loader.load(
        url,
        (gltf: GLTF) => {
          this.onModelLoaded(gltf)
        },
        undefined,
        (err: unknown) => {
          console.warn(`[Player] Failed to load 3D character asset from ${url}. Using procedural model fallback.`, err)
          this.loadFailed = true
        }
      )
    } catch (err) {
      console.warn(`[Player] Error initiating 3D model load:`, err)
      this.loadFailed = true
    }
  }

  private onModelLoaded(gltf: GLTF): void {
    if (this.isDisposed) {
      return
    }

    this.aaravModel = gltf.scene

    // Setup shadows and render optimization for mobile / Intel graphics
    this.aaravModel.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        // Skinned meshes in Three.js require frustumCulled false to avoid clipping near screen borders
        child.frustumCulled = false
      }
    })

    // Mount Aarav model to the orientation root
    this.modelRoot.add(this.aaravModel)

    // Hide procedural placeholder once Aarav is in place
    this.placeholderGroup.visible = false

    // Initialize Three.js Animation Mixer
    this.mixer = new THREE.AnimationMixer(this.aaravModel)

    for (const clip of gltf.animations) {
      const action = this.mixer.clipAction(clip)
      if (
        clip.name === 'Aarav_Jump' ||
        clip.name === 'Aarav_Landing' ||
        clip.name === 'Aarav_Hand_Interaction'
      ) {
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
      } else {
        action.setLoop(THREE.LoopRepeat, Infinity)
      }
      this.actions.set(clip.name, action)
    }

    this.isLoaded = true

    // Start with Idle animation
    this.switchAction('Aarav_Idle', 0.1)
  }

  /**
   * Smoothly crossfades between animation clips with optional gait cycle phase sync
   */
  private switchAction(targetName: string, fadeDuration = 0.2, syncGait = false): void {
    if (this.currentActionName === targetName) {
      return
    }

    const nextAction = this.actions.get(targetName)
    if (!nextAction) {
      return
    }

    const prevAction = this.currentAction

    // 1. Cleanly fade out previous action
    if (prevAction && prevAction !== nextAction) {
      prevAction.fadeOut(fadeDuration)
    }

    // 2. Prevent conflicting animations: fade out all other running actions
    for (const [, action] of this.actions) {
      if (action !== nextAction && action !== prevAction && action.isRunning()) {
        action.fadeOut(fadeDuration * 0.5)
      }
    }

    // 3. Reset and enable next action
    nextAction.reset()
    nextAction.enabled = true
    nextAction.setEffectiveTimeScale(1.0)
    nextAction.setEffectiveWeight(1.0)

    // 4. Stride phase synchronization for seamless locomotion transitions (Walk <-> Run <-> Sprint)
    if (syncGait && prevAction) {
      const prevDur = prevAction.getClip().duration
      const nextDur = nextAction.getClip().duration
      if (prevDur > 0 && nextDur > 0) {
        const progress = (((prevAction.time % prevDur) + prevDur) % prevDur) / prevDur
        nextAction.time = progress * nextDur
      }
    }

    // 5. Fade in smoothly and play
    nextAction.fadeIn(fadeDuration)
    nextAction.play()

    this.currentAction = nextAction
    this.currentActionName = targetName
  }

  /**
   * Updates visual orientation and locomotion animation state
   */
  public updateAnimation(
    dt: number,
    speed: number,
    isGrounded: boolean,
    facingAngle: number,
    turnRate: number,
    state: MovementState
  ): void {
    // 1. Smoothly rotate character model root to face movement direction
    this.modelRoot.rotation.y = facingAngle

    // 2. Subtle banking/tilt into turns with bounded limit
    const targetTilt = clamp(turnRate * 0.08, -0.2, 0.2)
    this.currentTilt = damp(this.currentTilt, targetTilt, 8, dt)
    this.modelRoot.rotation.z = this.currentTilt

    // 3. Process Skeletal Animation State Machine if GLB is loaded
    if (this.isLoaded && this.mixer) {
      // Landing detection
      if (!this.wasGrounded && isGrounded) {
        this.landingTimer = 0.22
      }
      this.wasGrounded = isGrounded

      if (this.interactionTimer > 0) {
        this.interactionTimer -= dt
      }

      if (!isGrounded) {
        // Airborne: Jump ascent or Fall descent
        const isAscending =
          state === 'jumping' ||
          (this.currentActionName === 'Aarav_Jump' &&
            this.currentAction &&
            this.currentAction.time < 0.45)

        if (isAscending) {
          this.switchAction('Aarav_Jump', 0.08)
          if (this.currentAction) {
            // Synchronize takeoff and rise with jump physics impulse (~0.38s to apex)
            this.currentAction.timeScale = 1.15
          }
        } else {
          // Descending / falling (or stepped off a high ledge)
          this.switchAction('Aarav_Jump', 0.12)
          if (this.currentAction) {
            const clipDur = this.currentAction.getClip().duration
            // If just entered falling directly (e.g. walked off an edge), skip takeoff crouch to airborne glide
            if (this.currentAction.time < clipDur * 0.55) {
              this.currentAction.time = clipDur * 0.55
            }
            // Loop/hold the mid-air glide pose (frame 14-20) while falling
            if (this.currentAction.time > clipDur * 0.85) {
              this.currentAction.time = clipDur * 0.58
            }
            this.currentAction.timeScale = 0.85
          }
        }
      } else if (this.landingTimer > 0) {
        // Landing impact recovery
        this.landingTimer -= dt
        const landFade = speed > 2.0 ? 0.08 : 0.12
        this.switchAction('Aarav_Landing', landFade)
        if (this.currentAction) {
          this.currentAction.timeScale = speed > 2.0 ? 1.6 : 1.2
        }
      } else if (this.interactionTimer > 0) {
        // Hand interaction clip playing
        this.switchAction('Aarav_Hand_Interaction', 0.15)
      } else if (speed > 0.25) {
        // Ground locomotion: Walk, Run, or Sprint
        const isSprinting = (state === 'sprinting' || speed > 7.2) && isGrounded
        const isRunning = !isSprinting && speed > 3.2

        if (isSprinting) {
          this.switchAction('Aarav_Sprint', 0.18, true)
          if (this.currentAction) {
            // Duration 0.533s: At 10.5 m/s, cadence matches ground displacement
            this.currentAction.timeScale = clamp(speed / 9.8, 0.75, 1.35)
          }
        } else if (isRunning) {
          this.switchAction('Aarav_Run', 0.20, true)
          if (this.currentAction) {
            // Duration 0.800s: At 5.5 m/s, cadence matches ground displacement
            this.currentAction.timeScale = clamp(speed / 5.2, 0.65, 1.35)
          }
        } else {
          // Walk (acceleration, slow maneuver, stopping)
          this.switchAction('Aarav_Walk', 0.20, true)
          if (this.currentAction) {
            // Duration 1.067s: At 2.2 m/s, cadence matches ground displacement
            this.currentAction.timeScale = clamp(speed / 2.2, 0.45, 1.35)
          }
        }
      } else {
        // Stationary: Idle or In-Place Turning
        if (Math.abs(turnRate) > 1.8) {
          this.switchAction('Aarav_Turn_Left', 0.15)
          if (this.currentAction) {
            this.currentAction.timeScale = clamp(Math.abs(turnRate) / 2.5, 0.8, 1.6)
          }
        } else {
          this.switchAction('Aarav_Idle', 0.22)
          if (this.currentAction) {
            this.currentAction.timeScale = 1.0
          }
        }
      }

      this.mixer.update(dt)
      return
    }

    // ------------------------------------------------------------------
    // 4. FALLBACK PROCEDURAL ANIMATION (Active during load or fallback)
    // ------------------------------------------------------------------
    if (isGrounded) {
      if (speed > 0.2) {
        const animSpeed = state === 'sprinting' ? 14 : 9
        this.animPhase += dt * animSpeed

        const maxLimbAngle = state === 'sprinting' ? 0.75 : 0.45
        const legSwing = Math.sin(this.animPhase) * maxLimbAngle
        const armSwing = Math.sin(this.animPhase) * maxLimbAngle

        this.leftLegPivot.rotation.x = legSwing
        this.rightLegPivot.rotation.x = -legSwing
        this.leftArmPivot.rotation.x = -armSwing
        this.rightArmPivot.rotation.x = armSwing

        const bob = Math.abs(Math.cos(this.animPhase * 2)) * 0.06
        this.torso.position.y = 1.05 + bob
        this.head.position.y = 1.62 + bob
      } else {
        this.animPhase += dt * 2.0
        const breath = Math.sin(this.animPhase) * 0.02

        this.leftLegPivot.rotation.x = damp(this.leftLegPivot.rotation.x, 0, 10, dt)
        this.rightLegPivot.rotation.x = damp(this.rightLegPivot.rotation.x, 0, 10, dt)
        this.leftArmPivot.rotation.x = damp(this.leftArmPivot.rotation.x, 0, 10, dt)
        this.rightArmPivot.rotation.x = damp(this.rightArmPivot.rotation.x, 0, 10, dt)

        this.torso.position.y = 1.05 + breath
        this.head.position.y = 1.62 + breath
      }
    } else {
      const targetArmPose = state === 'jumping' ? -0.8 : -0.4
      const targetLegPose = state === 'jumping' ? 0.4 : 0.2

      this.leftArmPivot.rotation.x = damp(this.leftArmPivot.rotation.x, targetArmPose, 6, dt)
      this.rightArmPivot.rotation.x = damp(this.rightArmPivot.rotation.x, targetArmPose, 6, dt)
      this.leftLegPivot.rotation.x = damp(this.leftLegPivot.rotation.x, targetLegPose, 6, dt)
      this.rightLegPivot.rotation.x = damp(this.rightLegPivot.rotation.x, -0.1, 6, dt)
    }
  }

  /**
   * Optional manual trigger for Aarav's hand interaction clip
   */
  public triggerHandInteraction(): void {
    if (this.actions.has('Aarav_Hand_Interaction')) {
      this.interactionTimer = 0.8
      this.switchAction('Aarav_Hand_Interaction', 0.15)
    }
  }

  public getIsModelLoaded(): boolean {
    return this.isLoaded
  }

  public getHasLoadFailed(): boolean {
    return this.loadFailed
  }

  public override update(): void {
    // Entity base update
  }

  public override dispose(): void {
    if (this.isDisposed) return

    if (this.mixer) {
      this.mixer.stopAllAction()
      this.mixer.uncacheRoot(this.aaravModel || this.modelRoot)
      this.mixer = null
    }
    this.actions.clear()
    this.currentAction = null

    super.dispose()
  }
}
