import * as THREE from 'three'
import { CollisionSystem } from '../physics/CollisionSystem'
import { MaterialFactory } from '../world/MaterialFactory'
import { CityBuilder } from '../world/CityBuilder'
import { SkyAndLighting } from '../world/SkyAndLighting'
import { Player } from '../entities/Player'
import { PlayerController } from '../entities/PlayerController'
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera'
import { InputManager } from '../input/InputManager'
import { MissionSystem } from '../systems/MissionSystem'
import type { MissionEvents } from '../systems/MissionSystem'
import { EventEmitter } from './EventEmitter'
import type { EngineStats, PlayerStats } from './Types'

export type EngineEvents = MissionEvents & {
  stats: EngineStats
  playerStats: PlayerStats
  pointerLockChange: boolean
}

export class Engine {
  public readonly container: HTMLElement
  public readonly scene: THREE.Scene
  public readonly camera: THREE.PerspectiveCamera
  public readonly renderer: THREE.WebGLRenderer

  public readonly events = new EventEmitter<EngineEvents>()
  public readonly collisionSystem: CollisionSystem
  public readonly materials: MaterialFactory
  public readonly cityBuilder: CityBuilder
  public readonly skyAndLighting: SkyAndLighting
  public readonly player: Player
  public readonly playerController: PlayerController
  public readonly thirdPersonCamera: ThirdPersonCamera
  public readonly inputManager: InputManager
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

  constructor(container: HTMLElement) {
    this.container = container

    // 1. Scene
    this.scene = new THREE.Scene()

    // 2. Camera
    const width = Math.max(container.clientWidth, 1)
    const height = Math.max(container.clientHeight, 1)
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 400)

    // 3. Renderer with Intel integrated graphics optimizations
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'mediump',
    })
    this.renderer.setSize(width, height)
    // Cap pixel ratio to 1.5 to protect Intel UHD/Iris Xe laptops
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05

    container.appendChild(this.renderer.domElement)

    // 4. Core Systems
    this.collisionSystem = new CollisionSystem()
    this.materials = new MaterialFactory()
    this.skyAndLighting = new SkyAndLighting(this.scene)
    this.cityBuilder = new CityBuilder(this.scene, this.materials, this.collisionSystem)
    this.cityBuilder.build()

    // 5. Player Entity & Controller
    this.player = new Player()
    // Spawn player in the plaza facing North
    this.player.setPosition(0, 0.5, 8)
    this.scene.add(this.player.mesh)

    this.playerController = new PlayerController(this.player, this.collisionSystem)

    // 6. Camera Controller
    this.thirdPersonCamera = new ThirdPersonCamera(this.camera, this.collisionSystem)
    this.thirdPersonCamera.snapBehindPlayer(this.player.getPosition(), Math.PI)

    // 7. Input System
    this.inputManager = new InputManager(this.renderer.domElement, locked => {
      this.events.emit('pointerLockChange', locked)
    })

    // 8. Mission System
    this.missionSystem = new MissionSystem(this.events as unknown as EventEmitter<MissionEvents>)

    // 9. Resize Handling
    this.setupResize()

    // 10. Start Loop
    this.start()
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

      // Player kinematics & simulation
      const playerStats = this.playerController.update(input, this.thirdPersonCamera.yaw, dt)

      // Camera follow with smooth interpolation
      this.thirdPersonCamera.update(playerStats.position, dt)

      // Update directional light & shadow coverage
      this.skyAndLighting.update(playerStats.position)

      // Update missions / objectives
      this.missionSystem.update(playerStats.position)

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
    this.cityBuilder.dispose()
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
