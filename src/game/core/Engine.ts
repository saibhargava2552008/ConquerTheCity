import * as THREE from 'three'
import { CollisionSystem } from '../physics/CollisionSystem'
import { MaterialFactory } from '../world/MaterialFactory'
import { SeaviewTown } from '../world/SeaviewTown'
import { SkyAndLighting } from '../world/SkyAndLighting'
import { Player, type CharacterId } from '../entities/Player'
import { PlayerController } from '../entities/PlayerController'
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera'
import { InputManager } from '../input/InputManager'
import { InteractionManager } from '../interaction/InteractionManager'
import { VehicleManager } from '../vehicles/VehicleManager'
import { CityNPCManager } from '../ai/CityNPCManager'
import { InteriorManager } from '../interiors/InteriorManager'
import { WorldInteractions } from '../interaction/WorldInteractions'
import { MissionSystem } from '../systems/MissionSystem'
import type { MissionEvents } from '../systems/MissionSystem'
import { EventEmitter } from './EventEmitter'
import type { EngineStats, PlayerStats, InteractionPrompt, DialogueMessage } from './Types'

export type EngineEvents = MissionEvents & {
  stats: EngineStats
  playerStats: PlayerStats
  pointerLockChange: boolean
  interactionPrompt: InteractionPrompt
  dialogue: DialogueMessage | null
}

export class Engine {
  public readonly container: HTMLElement
  public readonly scene: THREE.Scene
  public readonly camera: THREE.PerspectiveCamera
  public readonly renderer: THREE.WebGLRenderer

  public readonly events = new EventEmitter<EngineEvents>()
  public readonly characterId: CharacterId
  public readonly collisionSystem: CollisionSystem
  public readonly materials: MaterialFactory
  public readonly seaviewTown: SeaviewTown
  public readonly skyAndLighting: SkyAndLighting
  public readonly player: Player
  public readonly playerController: PlayerController
  public readonly thirdPersonCamera: ThirdPersonCamera
  public readonly inputManager: InputManager
  public readonly interactionManager: InteractionManager
  public readonly vehicleManager: VehicleManager
  public readonly cityNPCManager: CityNPCManager
  public readonly interiorManager: InteriorManager
  public readonly worldInteractions: WorldInteractions
  public readonly missionSystem: MissionSystem

  private animationId = 0
  private isRunning = false
  private lastTime = 0

  // Performance / FPS tracking
  private frameCount = 0
  private lastFpsTime = 0
  private currentFps = 60
  private currentFrameTime = 16.6
  private uiEmissionTimer = 0

  // Resize handler
  private resizeObserver: ResizeObserver | null = null
  private boundOnResize: (() => void) | null = null

  constructor(container: HTMLElement, characterId: CharacterId = 'aarav') {
    this.container = container
    this.characterId = characterId

    // 1. Scene
    this.scene = new THREE.Scene()

    // 2. Camera
    const width = Math.max(container.clientWidth, 1)
    const height = Math.max(container.clientHeight, 1)
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 400)

    // 3. Renderer with Intel integrated graphics optimizations & high-quality PBR settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'mediump',
    })
    this.renderer.setSize(width, height)
    // Cap pixel ratio to 1.5 to protect Intel UHD/Iris Xe laptops
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.12

    container.appendChild(this.renderer.domElement)

    // 4. Core Systems & Seaview Town World Generation
    this.collisionSystem = new CollisionSystem()
    this.materials = new MaterialFactory()
    this.skyAndLighting = new SkyAndLighting(this.scene)
    this.seaviewTown = new SeaviewTown(this.scene, this.materials, this.collisionSystem)

    // 5. Player Entity & Controller
    this.player = new Player(this.characterId)
    // Spawn player in Seaview Town Centre Plaza facing North toward the Lighthouse
    this.player.setPosition(0, 0.35, 8)
    this.scene.add(this.player.mesh)

    this.playerController = new PlayerController(this.player, this.collisionSystem)

    // 6. Camera Controller
    this.thirdPersonCamera = new ThirdPersonCamera(this.camera, this.collisionSystem)
    this.thirdPersonCamera.snapBehindPlayer(this.player.getPosition(), Math.PI)

    // 7. Input System
    this.inputManager = new InputManager(this.renderer.domElement, locked => {
      this.events.emit('pointerLockChange', locked)
    })

    // 8. Interaction System
    this.interactionManager = new InteractionManager()
    this.interactionManager.events.on('promptChanged', prompt => {
      this.events.emit('interactionPrompt', prompt)
    })

    // 9. Drivable Vehicle System
    this.vehicleManager = new VehicleManager(this.collisionSystem, this.interactionManager)
    this.scene.add(this.vehicleManager.group)

    this.vehicleManager.events.on('vehicleEntered', ({ vehicle }) => {
      this.thirdPersonCamera.setDrivingMode(true, vehicle.config.cameraDistance, vehicle.config.cameraHeight)
    })

    this.vehicleManager.events.on('vehicleExited', () => {
      this.thirdPersonCamera.setDrivingMode(false)
    })

    this.spawnVehicles()

    // 10. City-Wide Intelligent Pedestrian System
    this.cityNPCManager = new CityNPCManager(this.collisionSystem, this.interactionManager)
    this.scene.add(this.cityNPCManager.group)

    this.cityNPCManager.events.on('dialogue', msg => {
      this.events.emit('dialogue', msg)
    })

    // 11. Building Entrance & Interior System
    this.interiorManager = new InteriorManager(
      this.collisionSystem,
      this.interactionManager,
      this.materials
    )
    this.scene.add(this.interiorManager.group)

    this.interiorManager.events.on('dialogue', msg => {
      this.events.emit('dialogue', msg)
    })

    this.interiorManager.events.on('buildingEntered', ({ spawnPos }) => {
      this.playerController.teleport(spawnPos.x, spawnPos.y, spawnPos.z)
      this.player.setPosition(spawnPos.x, spawnPos.y, spawnPos.z)
      this.thirdPersonCamera.distance = 2.6
      this.thirdPersonCamera.snapBehindPlayer(spawnPos, 0)
    })

    this.interiorManager.events.on('buildingExited', ({ exitPos }) => {
      this.playerController.teleport(exitPos.x, exitPos.y, exitPos.z)
      this.player.setPosition(exitPos.x, exitPos.y, exitPos.z)
      this.thirdPersonCamera.distance = 4.8
      this.thirdPersonCamera.snapBehindPlayer(exitPos, Math.PI)
    })

    // 12. World Environmental & Commercial Interactions
    this.worldInteractions = new WorldInteractions(this.interactionManager)
    this.worldInteractions.events.on('dialogue', msg => {
      this.events.emit('dialogue', msg)
    })

    // 13. Mission System
    this.missionSystem = new MissionSystem(this.events as unknown as EventEmitter<MissionEvents>)

    // 14. Resize Handling
    this.setupResize()

    // 15. Start Loop
    this.start()
  }

  private spawnVehicles(): void {
    // 1. Auto-Rickshaws
    this.vehicleManager.spawnVehicle(
      'rickshaw_plaza_west',
      'auto_rickshaw',
      new THREE.Vector3(-3.8, 0.35, 12),
      -Math.PI / 4
    )
    this.vehicleManager.spawnVehicle(
      'rickshaw_plaza_east',
      'auto_rickshaw',
      new THREE.Vector3(12, 0.35, 12),
      Math.PI / 4
    )
    this.vehicleManager.spawnVehicle(
      'rickshaw_coastal_south',
      'auto_rickshaw',
      new THREE.Vector3(-3.8, 0, -32),
      0
    )
    this.vehicleManager.spawnVehicle(
      'rickshaw_coastal_north',
      'auto_rickshaw',
      new THREE.Vector3(-3.8, 0, 36),
      0
    )
    this.vehicleManager.spawnVehicle(
      'rickshaw_market_entrance',
      'auto_rickshaw',
      new THREE.Vector3(46.8, 0, 23.0),
      -Math.PI * 0.25
    )

    // 2. Scooters
    this.vehicleManager.spawnVehicle(
      'scooter_plaza_south',
      'scooter',
      new THREE.Vector3(2.0, 0.35, 12.0),
      0
    )
    this.vehicleManager.spawnVehicle(
      'scooter_market_chai',
      'scooter',
      new THREE.Vector3(27.5, 0, 25.2),
      Math.PI * 0.75
    )
    this.vehicleManager.spawnVehicle(
      'scooter_market_pharmacy',
      'scooter',
      new THREE.Vector3(27.5, 0, 38.5),
      Math.PI * 0.25
    )

    // 3. Delivery Bicycles
    this.vehicleManager.spawnVehicle(
      'bicycle_promenade_plaza',
      'delivery_bicycle',
      new THREE.Vector3(-14.5, 0.35, 10.0),
      0
    )
    this.vehicleManager.spawnVehicle(
      'bicycle_market_kirana',
      'delivery_bicycle',
      new THREE.Vector3(27.2, 0, 35.0),
      Math.PI * 0.15
    )
    this.vehicleManager.spawnVehicle(
      'bicycle_plaza_north',
      'delivery_bicycle',
      new THREE.Vector3(6.0, 0.35, -10.0),
      Math.PI
    )
  }

  private setupResize(): void {
    const handleResize = () => {
      if (!this.container) return
      const w = Math.max(this.container.clientWidth, 1)
      const h = Math.max(this.container.clientHeight, 1)
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(w, h)
    }

    this.boundOnResize = handleResize

    if (typeof window !== 'undefined') {
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => handleResize())
        this.resizeObserver.observe(this.container)
      } else {
        window.addEventListener('resize', this.boundOnResize)
      }
    }
  }

  public start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.lastTime = performance.now()
    this.lastFpsTime = performance.now()

    const tick = (now: number) => {
      if (!this.isRunning) return
      this.animationId = requestAnimationFrame(tick)

      const rawDt = (now - this.lastTime) / 1000
      this.lastTime = now
      // Clamp delta time to maximum 0.05s to prevent physics explosions
      const dt = Math.min(rawDt, 0.05)

      // Calculate FPS and frame time
      this.frameCount++
      if (now - this.lastFpsTime >= 500) {
        this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime))
        this.currentFrameTime = +(rawDt * 1000).toFixed(1)
        this.frameCount = 0
        this.lastFpsTime = now
      }

      // Read Input
      const input = this.inputManager.consumeInput()

      // Mouse camera rotation
      this.thirdPersonCamera.handleInput(input.movementX, input.movementY, input.scrollDelta)

      // Update camera orientation with latest mouse input
      const currentPos = this.player.mesh.position
      this.thirdPersonCamera.update(currentPos, dt)

      let playerStats: PlayerStats
      if (this.vehicleManager.isDriving()) {
        const vState = this.vehicleManager.update(dt, input, this.player, this.thirdPersonCamera)
        this.playerController.position.copy(this.player.mesh.position)
        this.playerController.velocity.set(0, 0, 0)

        playerStats = {
          position: this.player.mesh.position,
          velocity: vState ? vState.velocity : new THREE.Vector3(),
          speed: vState ? Math.abs(vState.speed) : 0,
          state: 'driving',
          isGrounded: true,
          isSprinting: false,
          stamina: this.playerController.stamina,
        }

        this.player.updateAnimation(dt, playerStats.speed, true, this.player.modelRoot.rotation.y, 0, 'driving')
      } else {
        // Player kinematics & simulation using camera's horizontal forward & right vectors
        playerStats = this.playerController.update(input, this.camera, dt)
        this.vehicleManager.update(dt, input, this.player, this.thirdPersonCamera)
      }

      // Update camera follow to track player's new position
      this.thirdPersonCamera.update(playerStats.position, dt)

      // Update environmental world animations (ocean waves, lighthouse beacon, living market)
      this.seaviewTown.update(dt, playerStats.position)

      // Update City-Wide NPC population and intelligent navigation
      this.cityNPCManager.update(dt, playerStats.position)

      // Update Building Entrance & Interior System
      this.interiorManager.update(dt, playerStats.position, this.player, this.thirdPersonCamera)

      // Update directional light & shadow coverage
      this.skyAndLighting.update(playerStats.position)

      // Update missions / objectives
      this.missionSystem.update(playerStats.position)

      // Update interaction system with proximity detection, priority resolution, and KeyF interact input
      const camForward = new THREE.Vector3()
      this.thirdPersonCamera.getHorizontalForward(camForward)

      this.interactionManager.update(playerStats.position, input.interact, this.player, {
        dt,
        playerFacing: this.playerController.getFacingAngle(),
        cameraForward: camForward,
        isGrounded: playerStats.isGrounded,
        isDriving: this.vehicleManager.isDriving(),
        isIndoor: this.interiorManager.isIndoor(),
        activeBuildingId: this.interiorManager.getCurrentBuilding()?.id,
      })

      // Render 3D scene
      this.renderer.render(this.scene, this.camera)

      // Emit throttled stats to React UI (10 Hz)
      this.uiEmissionTimer += dt
      if (this.uiEmissionTimer >= 0.1) {
        this.uiEmissionTimer = 0
        this.events.emit('stats', {
          fps: this.currentFps,
          frameTime: this.currentFrameTime,
          drawCalls: this.renderer.info.render.calls,
          triangles: this.renderer.info.render.triangles,
          entitiesCount: 1,
        })
        this.events.emit('playerStats', playerStats)
      }
    }

    this.animationId = requestAnimationFrame(tick)
  }

  public stop(): void {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = 0
    }
  }

  public dispose(): void {
    this.stop()

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    if (this.boundOnResize && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.boundOnResize)
      this.boundOnResize = null
    }

    this.inputManager.dispose()
    this.worldInteractions.dispose()
    this.interactionManager.dispose()
    this.vehicleManager.dispose()
    this.cityNPCManager.dispose()
    this.interiorManager.dispose()
    this.seaviewTown.dispose()
    this.skyAndLighting.dispose()
    this.player.dispose()
    this.materials.dispose()
    this.collisionSystem.clear()
    this.events.removeAllListeners()

    this.renderer.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
