import * as THREE from 'three'
import { CollisionSystem } from '../physics/CollisionSystem'
import { clamp, damp } from '../physics/MathUtils'

export class ThirdPersonCamera {
  private camera: THREE.PerspectiveCamera
  private collisionSystem: CollisionSystem

  // Spherical orbit parameters
  public yaw = 0 // Horizontal rotation in radians
  public pitch = 0.25 // Vertical tilt in radians (~15 deg above player)
  public distance = 4.8 // Distance from target

  private minPitch = -0.2 // ~ -11 deg
  private maxPitch = 1.3 // ~ +75 deg
  private minDistance = 2.0
  private maxDistance = 9.0

  public mouseSensitivity = 0.0022
  public zoomSensitivity = 0.003

  // Interpolated targets for silky smooth motion
  private currentCameraPos = new THREE.Vector3(0, 5, 10)
  private currentLookTarget = new THREE.Vector3(0, 1.5, 0)
  private headOffset = new THREE.Vector3(0, 1.5, 0)

  // Reusable vectors for calculations
  private _desiredTarget = new THREE.Vector3()
  private _desiredCameraPos = new THREE.Vector3()
  private _offset = new THREE.Vector3()

  constructor(camera: THREE.PerspectiveCamera, collisionSystem: CollisionSystem) {
    this.camera = camera
    this.collisionSystem = collisionSystem
  }

  /**
   * Applies mouse delta rotation and zoom
   */
  public handleInput(movementX: number, movementY: number, scrollDelta: number): void {
    this.yaw -= movementX * this.mouseSensitivity
    this.pitch += movementY * this.mouseSensitivity
    this.pitch = clamp(this.pitch, this.minPitch, this.maxPitch)

    if (Math.abs(scrollDelta) > 0.01) {
      this.distance += scrollDelta * this.zoomSensitivity
      this.distance = clamp(this.distance, this.minDistance, this.maxDistance)
    }
  }

  /**
   * Updates camera position and orientation with smooth damping and wall occlusion checks
   */
  public update(playerPos: THREE.Vector3, dt: number): void {
    // 1. Desired lookAt target is the player's head/chest
    this._desiredTarget.copy(playerPos).add(this.headOffset)

    // Smoothly damp the look target
    this.currentLookTarget.x = damp(this.currentLookTarget.x, this._desiredTarget.x, 14, dt)
    this.currentLookTarget.y = damp(this.currentLookTarget.y, this._desiredTarget.y, 14, dt)
    this.currentLookTarget.z = damp(this.currentLookTarget.z, this._desiredTarget.z, 14, dt)

    // 2. Compute orbit offset vector from yaw, pitch, and distance
    const cosPitch = Math.cos(this.pitch)
    const sinPitch = Math.sin(this.pitch)
    const sinYaw = Math.sin(this.yaw)
    const cosYaw = Math.cos(this.yaw)

    let effectiveDistance = this.distance

    // Check for wall occlusion between player head and desired camera position
    this._offset.set(
      sinYaw * cosPitch * this.distance,
      sinPitch * this.distance,
      cosYaw * cosPitch * this.distance
    )
    this._desiredCameraPos.copy(this.currentLookTarget).add(this._offset)

    const hitDist = this.collisionSystem.checkLineOfSight(this.currentLookTarget, this._desiredCameraPos)
    if (hitDist !== null && hitDist < effectiveDistance) {
      // Pull camera in front of the wall
      effectiveDistance = Math.max(1.2, hitDist - 0.25)
    }

    // Recalculate with effective distance
    this._offset.set(
      sinYaw * cosPitch * effectiveDistance,
      sinPitch * effectiveDistance,
      cosYaw * cosPitch * effectiveDistance
    )
    this._desiredCameraPos.copy(this.currentLookTarget).add(this._offset)

    // Ensure camera does not dip below ground level
    if (this._desiredCameraPos.y < 0.4) {
      this._desiredCameraPos.y = 0.4
    }

    // Smoothly damp the camera position toward desired position
    this.currentCameraPos.x = damp(this.currentCameraPos.x, this._desiredCameraPos.x, 18, dt)
    this.currentCameraPos.y = damp(this.currentCameraPos.y, this._desiredCameraPos.y, 18, dt)
    this.currentCameraPos.z = damp(this.currentCameraPos.z, this._desiredCameraPos.z, 18, dt)

    this.camera.position.copy(this.currentCameraPos)
    this.camera.lookAt(this.currentLookTarget)
  }

  /**
   * Returns the camera's horizontal forward vector (flattened onto XZ and normalized).
   */
  public getHorizontalForward(out = new THREE.Vector3()): THREE.Vector3 {
    this.camera.getWorldDirection(out)
    out.y = 0
    if (out.lengthSq() > 0.00001) {
      out.normalize()
    } else {
      out.set(0, 0, -1)
    }
    return out
  }

  /**
   * Returns the camera's horizontal right vector derived consistently from the forward vector.
   */
  public getHorizontalRight(out = new THREE.Vector3()): THREE.Vector3 {
    this.getHorizontalForward(out)
    out.crossVectors(out, this.camera.up)
    if (out.lengthSq() > 0.00001) {
      out.normalize()
    } else {
      out.set(1, 0, 0)
    }
    return out
  }

  /**
   * Resets camera behind player immediately
   */
  public snapBehindPlayer(playerPos: THREE.Vector3, playerYaw: number): void {
    this.yaw = playerYaw
    this.pitch = 0.25
    this._desiredTarget.copy(playerPos).add(this.headOffset)
    this.currentLookTarget.copy(this._desiredTarget)

    const cosPitch = Math.cos(this.pitch)
    const sinPitch = Math.sin(this.pitch)
    const sinYaw = Math.sin(this.yaw)
    const cosYaw = Math.cos(this.yaw)

    this.currentCameraPos.set(
      this.currentLookTarget.x + sinYaw * cosPitch * this.distance,
      this.currentLookTarget.y + sinPitch * this.distance,
      this.currentLookTarget.z + cosYaw * cosPitch * this.distance
    )
    this._desiredCameraPos.copy(this.currentCameraPos)
    this.camera.position.copy(this.currentCameraPos)
    this.camera.lookAt(this.currentLookTarget)
  }
}
