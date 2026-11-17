import * as THREE from 'three'
import { Player } from './Player'
import { CollisionSystem } from '../physics/CollisionSystem'
import type { InputState, MovementState, PlayerStats } from '../core/Types'
import { damp, dampAngle } from '../physics/MathUtils'

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

  // Movement tuning
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

  constructor(player: Player, collisionSystem: CollisionSystem) {
    this.player = player
    this.collisionSystem = collisionSystem
    this.position = player.mesh.position
  }

  public update(input: InputState, cameraYaw: number, dt: number): PlayerStats {
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

    // 2. Compute Input Direction relative to Camera Yaw
    this._moveDir.set(0, 0, 0)

    let inputX = 0
    let inputZ = 0

    if (input.forward) inputZ -= 1
    if (input.backward) inputZ += 1
    if (input.left) inputX -= 1
    if (input.right) inputX += 1

    const hasInput = inputX !== 0 || inputZ !== 0

    if (hasInput) {
      // Normalize input vector so diagonals don't move faster
      const len = Math.hypot(inputX, inputZ)
      inputX /= len
      inputZ /= len

      // Rotate direction vector by camera yaw
      // In Three.js: forward with yaw 0 is -Z, right is +X
      const sinYaw = Math.sin(cameraYaw)
      const cosYaw = Math.cos(cameraYaw)

      this._moveDir.x = inputX * cosYaw - inputZ * sinYaw
      this._moveDir.z = inputX * sinYaw + inputZ * cosYaw
    }

    // 3. Horizontal Acceleration & Deceleration
    this._targetVel.copy(this._moveDir).multiplyScalar(targetMaxSpeed)

    const accelRate = this.isGrounded ? this.groundAcceleration : this.airAcceleration
    const decelRate = this.isGrounded ? this.groundDeceleration : this.airDrag

    if (hasInput) {
      // Accelerate towards target velocity
      this.velocity.x = damp(this.velocity.x, this._targetVel.x, accelRate, delta)
      this.velocity.z = damp(this.velocity.z, this._targetVel.z, accelRate, delta)
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

    // 8. Player Orientation / Facing Angle
    const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z)

    if (horizontalSpeed > 0.4) {
      // Character faces in the direction of actual velocity
      const targetFacing = Math.atan2(this.velocity.x, this.velocity.z)
      this.facingAngle = dampAngle(this.facingAngle, targetFacing, 18, delta)
    }

    // Calculate turning rate for body roll/tilt
    this.turnRate = (this.facingAngle - this.lastFacingAngle) / delta
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
}
