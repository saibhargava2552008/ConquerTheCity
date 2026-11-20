import * as THREE from 'three'
import { AssetLoader, type AssetId } from '../AssetLoader'

export interface VehicleConfig {
  id: string
  assetId: AssetId
  cruisingSpeed: number
  waypoints: THREE.Vector3[]
  scale?: number
}

export class MarketVehicle {
  public readonly id: string
  public readonly group = new THREE.Group()

  public position: THREE.Vector3
  public facingAngle = 0
  public currentSpeed = 0

  private readonly cruisingSpeed: number
  private readonly waypoints: THREE.Vector3[]
  private currentWaypointIndex = 0

  private model: THREE.Group | null = null
  private wheelMeshes: THREE.Mesh[] = []

  // Braking / obstacle avoidance
  private isBraking = false
  private distanceToPlayer = 0
  private isShadowCasting = true

  constructor(config: VehicleConfig) {
    this.id = config.id
    this.cruisingSpeed = config.cruisingSpeed
    this.waypoints = config.waypoints.map(w => w.clone())
    this.position = this.waypoints[0].clone()
    this.group.position.copy(this.position)

    if (config.scale) {
      this.group.scale.set(config.scale, config.scale, config.scale)
    }

    this.initModel(config.assetId)
  }

  private initModel(assetId: AssetId): void {
    const loader = AssetLoader.getInstance()
    loader.loadAsset(assetId).then(loaded => {
      if (!loaded) return
      this.model = loader.getClone(assetId)
      if (this.model) {
        // Collect wheels for dynamic spin
        this.model.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
            const name = child.name.toLowerCase()
            if (name.includes('tire') || name.includes('wheel') || name.includes('rim')) {
              this.wheelMeshes.push(child)
            }
          }
        })
        this.group.add(this.model)
      }
    })
  }

  public update(dt: number, playerPos: THREE.Vector3): void {
    this.distanceToPlayer = this.position.distanceTo(playerPos)

    // Distance LOD
    if (this.distanceToPlayer > 85) {
      this.group.visible = false
      return
    }
    this.group.visible = true

    if (this.waypoints.length < 2) return

    // 1. Forward Obstacle Detection (Player and pedestrian proximity sensor)
    const toPlayer = playerPos.clone().sub(this.position)
    const distPlayer = toPlayer.length()
    const forwardVec = new THREE.Vector3(Math.sin(this.facingAngle), 0, Math.cos(this.facingAngle))
    const dotPlayer = forwardVec.dot(toPlayer.clone().normalize())

    // If player is directly in path within 4.5m ahead
    if (distPlayer < 4.5 && dotPlayer > 0.65) {
      this.isBraking = true
    } else {
      this.isBraking = false
    }

    // Dynamic distance-based shadow culling (disable shadows beyond 35m)
    const shouldCastShadow = distPlayer <= 35
    if (this.isShadowCasting !== shouldCastShadow) {
      this.isShadowCasting = shouldCastShadow
      this.group.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          c.castShadow = shouldCastShadow
        }
      })
    }

    // 2. Speed acceleration / braking simulation
    const targetSpeed = this.isBraking ? 0 : this.cruisingSpeed
    const accelRate = this.isBraking ? 6.0 : 2.5
    this.currentSpeed += (targetSpeed - this.currentSpeed) * Math.min(dt * accelRate, 1.0)

    // 3. Waypoint Navigation
    const targetWp = this.waypoints[this.currentWaypointIndex]
    const toTarget = new THREE.Vector3(targetWp.x - this.position.x, 0, targetWp.z - this.position.z)
    const distToTarget = toTarget.length()

    if (distToTarget < 1.0) {
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length
    }

    toTarget.normalize()
    this.position.x += toTarget.x * this.currentSpeed * dt
    this.position.z += toTarget.z * this.currentSpeed * dt

    // 4. Smooth steering alignment
    const targetAngle = Math.atan2(toTarget.x, toTarget.z)
    let angleDiff = targetAngle - this.facingAngle
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
    this.facingAngle += angleDiff * Math.min(dt * 4.5, 1.0)

    this.group.position.copy(this.position)
    this.group.rotation.y = this.facingAngle

    // 5. Dynamic wheel spin rotation
    const wheelRadius = 0.28
    const spinDelta = (this.currentSpeed * dt) / wheelRadius
    for (const wheel of this.wheelMeshes) {
      wheel.rotation.x += spinDelta
    }
  }

  public dispose(): void {
    this.wheelMeshes = []
    this.group.clear()
  }
}
