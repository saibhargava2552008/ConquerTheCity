import * as THREE from 'three'
import { AssetLoader } from '../world/AssetLoader'
import type { CollisionSystem } from '../physics/CollisionSystem'
import type { InputState } from '../core/Types'
import { clamp, damp } from '../physics/MathUtils'
import {
  type VehicleType,
  type VehicleHandlingConfig,
  type VehicleDrivingState,
  VEHICLE_CONFIGS,
} from './VehicleTypes'
import type { Player } from '../entities/Player'

export class DrivableVehicle {
  public readonly id: string
  public readonly type: VehicleType
  public readonly config: VehicleHandlingConfig

  public readonly group = new THREE.Group()
  public readonly bodyGroup = new THREE.Group()

  public position: THREE.Vector3
  public heading: number // Yaw in radians (0 = facing North/-Z)
  public velocity = new THREE.Vector3()
  public currentSpeed = 0 // m/s (signed: positive = forward, negative = reverse)
  public steerAngle = 0 // radians
  public leanAngle = 0 // radians (roll)

  public isOccupied = false
  public isLoaded = false
  public driver: Player | null = null

  public readonly colliderId: string
  public readonly interactableId: string

  private model: THREE.Group | null = null
  private wheelMeshes: THREE.Object3D[] = []
  private box = new THREE.Box3()

  constructor(
    id: string,
    type: VehicleType,
    spawnPosition: THREE.Vector3,
    heading = 0,
    collisionSystem: CollisionSystem
  ) {
    this.id = id
    this.type = type
    this.config = VEHICLE_CONFIGS[type]
    this.position = spawnPosition.clone()
    this.heading = heading

    this.colliderId = `vehicle_collider_${id}`
    this.interactableId = `vehicle_interact_${id}`

    // Setup scene hierarchy: group contains bodyGroup which contains visual mesh
    this.group.name = `Drivable_${id}`
    this.group.position.copy(this.position)
    this.group.rotation.y = this.heading
    this.group.add(this.bodyGroup)

    // Register initial collider
    this.updateColliderBox()
    collisionSystem.addCollider({
      id: this.colliderId,
      name: this.colliderId,
      box: this.box.clone(),
      isStatic: true, // while unoccupied, behaves as solid obstacle
      colliderType: 'vehicle',
      surfaceType: 'road',
    })

    this.loadModel()
  }

  private loadModel(): void {
    const loader = AssetLoader.getInstance()
    loader.loadAsset(this.config.assetId).then(loaded => {
      if (!loaded) return
      this.model = loader.getClone(this.config.assetId)
      if (this.model) {
        this.model.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
            const name = child.name.toLowerCase()
            if (name.includes('wheel') || name.includes('tire') || name.includes('rim')) {
              this.wheelMeshes.push(child)
            }
          }
        })
        this.bodyGroup.add(this.model)
        this.isLoaded = true
      }
    })
  }

  private updateColliderBox(): void {
    const hw = this.config.halfWidth
    const hl = this.config.halfLength
    const h = this.config.height

    this.box.min.set(
      this.position.x - hw,
      this.position.y,
      this.position.z - hl
    )
    this.box.max.set(
      this.position.x + hw,
      this.position.y + h,
      this.position.z + hl
    )
  }

  /**
   * Physics update cycle for the vehicle.
   */
  public update(dt: number, input: InputState | null, collisionSystem: CollisionSystem): VehicleDrivingState {
    const delta = Math.min(dt, 0.05)

    // 1. Process Steering Input
    if (this.isOccupied && input) {
      if (input.left && !input.right) {
        this.steerAngle = damp(this.steerAngle, this.config.maxSteerAngle, this.config.steerSpeed, delta)
      } else if (input.right && !input.left) {
        this.steerAngle = damp(this.steerAngle, -this.config.maxSteerAngle, this.config.steerSpeed, delta)
      } else {
        this.steerAngle = damp(this.steerAngle, 0, this.config.steerReturnSpeed, delta)
      }
    } else {
      this.steerAngle = damp(this.steerAngle, 0, this.config.steerReturnSpeed, delta)
    }

    // 2. Process Acceleration, Braking & Reverse
    const isHandbraking = !!(this.isOccupied && input && input.handbrake)

    if (this.isOccupied && input) {
      if (isHandbraking) {
        // Handbrake: sharp deceleration
        this.currentSpeed = damp(this.currentSpeed, 0, this.config.handbrakeDecel, delta)
      } else if (input.forward) {
        if (this.currentSpeed < -0.2) {
          // Braking out of reverse
          this.currentSpeed = damp(this.currentSpeed, 0, this.config.brakingDecel, delta)
        } else {
          // Accelerate forward
          this.currentSpeed = damp(this.currentSpeed, this.config.maxForwardSpeed, this.config.acceleration, delta)
        }
      } else if (input.backward) {
        if (this.currentSpeed > 0.2) {
          // Braking forward movement
          this.currentSpeed = damp(this.currentSpeed, 0, this.config.brakingDecel, delta)
        } else if (this.config.hasReverse) {
          // Reverse acceleration
          this.currentSpeed = damp(this.currentSpeed, -this.config.maxReverseSpeed, this.config.reverseAcceleration, delta)
        } else {
          // Bicycle: stop at 0
          this.currentSpeed = damp(this.currentSpeed, 0, this.config.brakingDecel, delta)
        }
      } else {
        // Coasting drag
        this.currentSpeed = damp(this.currentSpeed, 0, this.config.coastingDecel, delta)
      }
    } else {
      // Unoccupied: damp to halt
      this.currentSpeed = damp(this.currentSpeed, 0, this.config.coastingDecel * 1.5, delta)
    }

    // Stop micro-creeping jitter
    if (Math.abs(this.currentSpeed) < 0.02) {
      this.currentSpeed = 0
    }

    // 3. Angular Kinematics (Ackermann Yaw Evolution)
    if (Math.abs(this.currentSpeed) > 0.05 && Math.abs(this.steerAngle) > 0.005) {
      const wheelbase = this.config.halfLength * 1.6
      const angularVelocity = (this.currentSpeed / wheelbase) * Math.sin(this.steerAngle)
      this.heading += angularVelocity * delta

      // Keep heading in [-PI, PI] range
      while (this.heading > Math.PI) this.heading -= Math.PI * 2
      while (this.heading < -Math.PI) this.heading += Math.PI * 2
    }

    // 4. Compute Velocity Vector along Heading
    // Heading 0 = North (-Z), PI/2 = West (-X), PI = South (+Z), -PI/2 = East (+X)
    const forwardX = -Math.sin(this.heading)
    const forwardZ = -Math.cos(this.heading)
    this.velocity.x = forwardX * this.currentSpeed
    this.velocity.z = forwardZ * this.currentSpeed

    // 5. Collision Resolution with World
    if (Math.abs(this.currentSpeed) > 0.01) {
      const col = collisionSystem.resolveVehicleMovement(
        this.position,
        this.velocity,
        this.config.halfWidth,
        this.config.halfLength,
        this.config.height,
        delta,
        this.colliderId
      )

      if (col.collided) {
        // Absorb impact shock
        this.currentSpeed *= 0.25
      }
    }

    // 6. Ground Height Snapping & Surface Elevation
    const groundHeight = collisionSystem.getGroundHeight(
      this.position.x,
      this.position.y,
      this.position.z,
      this.config.halfWidth
    )
    this.position.y = damp(this.position.y, groundHeight, 25, delta)

    // 7. Dynamic Collider Synchronization
    this.updateColliderBox()
    collisionSystem.updateCollider(this.colliderId, this.box)

    // 8. Vehicle Body Roll / Banking (2-wheelers lean into turns)
    const lateralG = (this.currentSpeed * this.steerAngle) * this.config.leanMultiplier
    this.leanAngle = damp(this.leanAngle, clamp(lateralG, -0.32, 0.32), 10, delta)
    this.bodyGroup.rotation.z = -this.leanAngle

    // 9. Wheel Spin Animation
    if (Math.abs(this.currentSpeed) > 0.05) {
      const spinDelta = (this.currentSpeed * delta) / this.config.wheelRadius
      for (let i = 0; i < this.wheelMeshes.length; i++) {
        this.wheelMeshes[i].rotation.x += spinDelta
      }
    }

    // 10. Visual Mesh Transform Synchronization
    this.group.position.copy(this.position)
    this.group.rotation.y = this.heading

    const forwardVec = new THREE.Vector3(
      Math.sin(this.heading) * this.currentSpeed,
      0,
      Math.cos(this.heading) * this.currentSpeed
    )

    return {
      velocity: forwardVec,
      speed: Math.abs(this.currentSpeed),
      speedKmh: Math.abs(this.currentSpeed) * 3.6,
      steerAngle: this.steerAngle,
      leanAngle: this.leanAngle,
      inReverse: this.currentSpeed < -0.1,
      isHandbraking,
      isGrounded: true,
    }
  }

  /**
   * Computes the world coordinates of the driver seat.
   */
  public getDriverSeatWorldPosition(out = new THREE.Vector3()): THREE.Vector3 {
    const offset = this.config.seatOffset.clone()
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading)
    return out.copy(this.position).add(offset)
  }

  /**
   * Driver enters the vehicle.
   */
  public enter(player: Player, collisionSystem: CollisionSystem): boolean {
    if (this.isOccupied) return false
    this.isOccupied = true
    this.driver = player

    // Temporarily disable the vehicle's own box collider so the player inside doesn't collide with it
    collisionSystem.removeCollider(this.colliderId)

    return true
  }

  /**
   * Driver exits the vehicle to a safe, unblocked position.
   */
  public exit(collisionSystem: CollisionSystem): THREE.Vector3 {
    this.isOccupied = false
    this.driver = null
    this.currentSpeed = 0
    this.steerAngle = 0

    // Re-register solid collider
    this.updateColliderBox()
    collisionSystem.addCollider({
      id: this.colliderId,
      name: this.colliderId,
      box: this.box.clone(),
      isStatic: true,
      colliderType: 'vehicle',
      surfaceType: 'road',
    })

    // Search for unblocked exit point around vehicle
    // 1. Left side (standard exit)
    // 2. Right side
    // 3. Rear
    // 4. Front
    const candidates = [
      new THREE.Vector3(-this.config.halfWidth - 0.7, 0, this.config.seatOffset.z),
      new THREE.Vector3(this.config.halfWidth + 0.7, 0, this.config.seatOffset.z),
      new THREE.Vector3(0, 0, this.config.halfLength + 0.8),
      new THREE.Vector3(0, 0, -this.config.halfLength - 0.8),
    ]

    const safePos = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    let foundSafe = false

    for (const offset of candidates) {
      offset.applyAxisAngle(up, this.heading)
      const testPos = this.position.clone().add(offset)
      const groundH = collisionSystem.getGroundHeight(testPos.x, testPos.y, testPos.z, 0.4)
      testPos.y = groundH

      if (!collisionSystem.isPositionBlocked(testPos.x, testPos.y, testPos.z, 0.4, 1.8, this.colliderId)) {
        safePos.copy(testPos)
        foundSafe = true
        break
      }
    }

    if (!foundSafe) {
      // Fallback: spawn 1m behind vehicle
      const fallback = new THREE.Vector3(0, 0, this.config.halfLength + 0.8).applyAxisAngle(up, this.heading)
      safePos.copy(this.position).add(fallback)
      safePos.y = collisionSystem.getGroundHeight(safePos.x, safePos.y, safePos.z, 0.4)
    }

    return safePos
  }

  public dispose(collisionSystem: CollisionSystem): void {
    collisionSystem.removeCollider(this.colliderId)
    this.group.clear()
    this.model = null
    this.wheelMeshes = []
  }
}
