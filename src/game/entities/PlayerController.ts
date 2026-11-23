import * as THREE from 'three'
import { Player } from './Player'
import { CollisionSystem } from '../physics/CollisionSystem'
import type { InputState, MovementState, PlayerStats } from '../core/Types'
import type { ThirdPersonCamera } from '../camera/ThirdPersonCamera'
import { damp, dampAngle, clamp, UP } from '../physics/MathUtils'

export class PlayerController {
  private player: Player
  private collisionSystem: CollisionSystem

  // Kinematics
  public readonly position: THREE.Vector3
  public readonly velocity = new THREE.Vector3()
  private verticalVelocity = 0
  private facingAngle = 0
  private lastFacingAngle = 0
  private turnRate = 0

  // Movement tuning (preserved M0 baseline speeds)
  public walkSpeed = 5.5 // m/s
  public sprintSpeed = 10.5 // m/s
  public groundAcceleration = 32 // m/s^2
  public groundDeceleration = 26 // m/s^2
  public airAcceleration = 10 // m/s^2
  public airDrag = 2 // m/s^2
  public gravity = 24 // m/s^2
  public jumpImpulse = 9.2 // m/s

  // State
  public isGrounded = true
  public state: MovementState = 'idle'
  public stamina = 100
  public maxStamina = 100

  // Responsiveness enhancements
  private coyoteTimer = 0
  private jumpBufferTimer = 0
  private readonly coyoteTime = 0.12
  private readonly jumpBufferTime = 0.12

  // Dimensions
  public readonly radius = 0.4 // half-width
  public readonly height = 1.8 // character height

  // Reusable vector buffers
  private _moveDir = new THREE.Vector3()
  private _targetVel = new THREE.Vector3()
  private _camForward = new THREE.Vector3()
  private _camRight = new THREE.Vector3()

  constructor(player: Player, collisionSystem: CollisionSystem) {
    this.player = player
    this.collisionSystem = collisionSystem
    this.position = player.mesh.position
  }

  public update(
    input: InputState,
    cameraOrForward: THREE.Camera | ThirdPersonCamera | THREE.Vector3 | number,
    dt: number
  ): PlayerStats {
    // Clamp delta time to avoid physics tunneling on tab switches
    const delta = Math.min(dt, 0.05)

    // 1. Process Stamina & Sprint state
    let wantsSprint = input.sprint && (input.forward || input.backward || input.left || input.right)
    if (wantsSprint && this.stamina > 5) {
      this.stamina = Math.max(0, this.stamina - delta * 18)
    } else {
      wantsSprint = false
      this.stamina = Math.min(this.maxStamina, this.stamina + delta * 25)
    }

    const targetMaxSpeed = wantsSprint ? this.sprintSpeed : this.walkSpeed

    // 2. Compute Camera Horizontal Forward and Right Vectors (flattened onto XZ and normalized)
    if (cameraOrForward instanceof THREE.Camera) {
      cameraOrForward.getWorldDirection(this._camForward)
      this._camForward.y = 0
      if (this._camForward.lengthSq() > 0.00001) {
        this._camForward.normalize()
      } else {
        this._camForward.set(0, 0, -1)
      }
      this._camRight.crossVectors(this._camForward, cameraOrForward.up).normalize()
    } else if (cameraOrForward instanceof THREE.Vector3) {
      this._camForward.copy(cameraOrForward)
      this._camForward.y = 0
      if (this._camForward.lengthSq() > 0.00001) {
        this._camForward.normalize()
      } else {
        this._camForward.set(0, 0, -1)
      }
      this._camRight.crossVectors(this._camForward, UP).normalize()
    } else if (
      typeof cameraOrForward === 'object' &&
      cameraOrForward !== null &&
      'getHorizontalForward' in cameraOrForward
    ) {
      ;(cameraOrForward as ThirdPersonCamera).getHorizontalForward(this._camForward)
      ;(cameraOrForward as ThirdPersonCamera).getHorizontalRight(this._camRight)
    } else if (typeof cameraOrForward === 'number') {
      const yaw = cameraOrForward
      this._camForward.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize()
      this._camRight.crossVectors(this._camForward, UP).normalize()
    } else {
      this._camForward.set(0, 0, -1)
      this._camRight.set(1, 0, 0)
    }

    // Combine forward/backward (W/S) and right/left (D/A) inputs
    let moveForward = 0
    let moveRight = 0

    if (input.forward) moveForward += 1
    if (input.backward) moveForward -= 1
    if (input.right) moveRight += 1
    if (input.left) moveRight -= 1

    const hasInput = moveForward !== 0 || moveRight !== 0

    this._moveDir.set(0, 0, 0)

    if (hasInput) {
      this._moveDir.addScaledVector(this._camForward, moveForward)
      this._moveDir.addScaledVector(this._camRight, moveRight)
      if (this._moveDir.lengthSq() > 0.0001) {
        this._moveDir.normalize()
      }
    }

    // 3. Horizontal Acceleration & Deceleration with Reversal Braking
    this._targetVel.copy(this._moveDir).multiplyScalar(targetMaxSpeed)

    const accelRate = this.isGrounded ? this.groundAcceleration : this.airAcceleration
    const decelRate = this.isGrounded ? this.groundDeceleration : this.airDrag

    if (hasInput) {
      // Check if desired direction opposes current velocity (reversal / sharp turnaround)
      const dot = this.velocity.x * this._targetVel.x + this.velocity.z * this._targetVel.z
      const effectiveAccel = dot < 0 ? accelRate * 1.6 : accelRate

      // Accelerate towards target velocity
      this.velocity.x = damp(this.velocity.x, this._targetVel.x, effectiveAccel, delta)
      this.velocity.z = damp(this.velocity.z, this._targetVel.z, effectiveAccel, delta)
    } else {
      // Decelerate smoothly to halt
      this.velocity.x = damp(this.velocity.x, 0, decelRate, delta)
      this.velocity.z = damp(this.velocity.z, 0, decelRate, delta)
    }

    // 4. Wall Collision & Horizontal Movement
    this.collisionSystem.resolveHorizontalMovement(
      this.position,
      this.velocity,
      this.radius,
      this.height,
      delta
    )

    // 5. Jump Buffering and Coyote Time
    if (this.isGrounded) {
      this.coyoteTimer = this.coyoteTime
    } else {
      this.coyoteTimer -= delta
    }

    if (input.jump) {
      this.jumpBufferTimer = this.jumpBufferTime
    } else {
      this.jumpBufferTimer -= delta
    }

    // 6. Vertical Kinematics & Jump
    const canJump = this.coyoteTimer > 0 && this.jumpBufferTimer > 0

    if (canJump) {
      this.verticalVelocity = this.jumpImpulse
      this.isGrounded = false
      this.coyoteTimer = 0
      this.jumpBufferTimer = 0
    } else if (!this.isGrounded) {
      // Apply gravity
      this.verticalVelocity -= this.gravity * delta
    }

    // 7. Ground Collision Resolution
    const groundHeight = this.collisionSystem.getGroundHeight(
      this.position.x,
      this.position.y,
      this.position.z,
      this.radius
    )

    if (this.isGrounded) {
      // Smoothly stick to ground/slopes/steps
      if (Math.abs(this.position.y - groundHeight) < 0.45) {
        this.position.y = damp(this.position.y, groundHeight, 30, delta)
        this.verticalVelocity = 0
      } else if (this.position.y < groundHeight) {
        this.position.y = groundHeight
        this.verticalVelocity = 0
      } else {
        // Stepped off an edge -> start falling
        this.isGrounded = false
        this.verticalVelocity = 0
      }
    } else {
      // In air
      const nextY = this.position.y + this.verticalVelocity * delta

      if (nextY <= groundHeight && this.verticalVelocity <= 0) {
        // Landed!
        this.position.y = groundHeight
        this.verticalVelocity = 0
        this.isGrounded = true
      } else {
        this.position.y = nextY
      }
    }

    // 8. Player Orientation / Facing Angle with Shortest Angular Difference
    const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z)

    if (horizontalSpeed > 0.4) {
      // Character faces in the direction of actual velocity
      const targetFacing = Math.atan2(this.velocity.x, this.velocity.z)
      this.facingAngle = dampAngle(this.facingAngle, targetFacing, 18, delta)
    } else if (hasInput && this._moveDir.lengthSq() > 0.001) {
      // Rotate towards intended movement direction immediately when initiating motion
      const targetFacing = Math.atan2(this._moveDir.x, this._moveDir.z)
      this.facingAngle = dampAngle(this.facingAngle, targetFacing, 14, delta)
    }

    // Calculate turning rate using shortest angular difference across -PI/PI boundary
    const angleDiff =
      ((this.facingAngle - this.lastFacingAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI
    const rawTurnRate = angleDiff / Math.max(delta, 0.0001)
    this.turnRate = damp(this.turnRate, clamp(rawTurnRate, -12, 12), 12, delta)
    this.lastFacingAngle = this.facingAngle

    // 9. Determine Movement State
    if (!this.isGrounded) {
      this.state = this.verticalVelocity > 0.5 ? 'jumping' : 'falling'
    } else if (horizontalSpeed > 0.4) {
      this.state = wantsSprint && horizontalSpeed > this.walkSpeed + 0.5 ? 'sprinting' : 'walking'
    } else {
      this.state = 'idle'
    }

    // 10. Check Triggers (checkpoints / objectives)
    this.collisionSystem.checkTriggers(this.position, this.radius)

    // 11. Update Player 3D Mesh procedural animation
    this.player.updateAnimation(
      delta,
      horizontalSpeed,
      this.isGrounded,
      this.facingAngle,
      this.turnRate,
      this.state
    )

    return {
      position: this.position,
      velocity: this.velocity,
      speed: horizontalSpeed,
      state: this.state,
      isGrounded: this.isGrounded,
      isSprinting: this.state === 'sprinting',
      stamina: this.stamina,
    }
  }

  public teleport(x: number, y: number, z: number): void {
    this.position.set(x, y, z)
    this.velocity.set(0, 0, 0)
    this.verticalVelocity = 0
    this.isGrounded = true
  }

  public getFacingAngle(): number {
    return this.facingAngle
  }
}
