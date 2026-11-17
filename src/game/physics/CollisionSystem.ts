import * as THREE from 'three'
import type { ICollider } from '../core/Types'
import { _box1, _box2, clamp } from './MathUtils'

export class CollisionSystem {
  private colliders: ICollider[] = []
  private triggers: ICollider[] = []

  public addCollider(collider: ICollider): void {
    if (collider.isTrigger) {
      this.triggers.push(collider)
    } else {
      this.colliders.push(collider)
    }
  }

  public removeCollider(id: string): void {
    this.colliders = this.colliders.filter(c => c.id !== id)
    this.triggers = this.triggers.filter(t => t.id !== id)
  }

  public clear(): void {
    this.colliders = []
    this.triggers = []
  }

  public getColliders(): readonly ICollider[] {
    return this.colliders
  }

  /**
   * Finds the highest solid surface directly below or at the player's feet
   * within step-up tolerance.
   */
  public getGroundHeight(posX: number, posY: number, posZ: number, radius = 0.35): number {
    let highestGround = 0 // Base ground level is y = 0

    const minX = posX - radius
    const maxX = posX + radius
    const minZ = posZ - radius
    const maxZ = posZ + radius

    // Margin above current feet position where stepping up is allowed (e.g. curbs, stairs)
    const stepUpLimit = posY + 0.45

    for (let i = 0; i < this.colliders.length; i++) {
      const box = this.colliders[i].box

      // Check horizontal footprint overlap
      if (maxX > box.min.x && minX < box.max.x && maxZ > box.min.z && minZ < box.max.z) {
        // Only consider surfaces that are at or below the player's step-up threshold
        if (box.max.y <= stepUpLimit && box.max.y >= highestGround) {
          highestGround = box.max.y
        }
      }
    }

    return highestGround
  }

  /**
   * Resolves horizontal motion with sliding along walls.
   * Modifies position and velocity in-place.
   */
  public resolveHorizontalMovement(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    radius: number,
    height: number,
    dt: number
  ): void {
    const halfWidth = radius
    const stepHeight = 0.45

    // 1. Resolve X movement
    if (Math.abs(velocity.x) > 0.0001) {
      const nextX = position.x + velocity.x * dt

      // Construct proposed player AABB for X movement
      _box1.min.set(nextX - halfWidth, position.y + stepHeight, position.z - halfWidth)
      _box1.max.set(nextX + halfWidth, position.y + height, position.z + halfWidth)

      let collidedX = false
      let resolvedX = nextX

      for (let i = 0; i < this.colliders.length; i++) {
        const box = this.colliders[i].box

        // Skip obstacles whose top is below the step-up height
        if (box.max.y <= position.y + stepHeight) continue

        // Quick AABB intersection test
        if (_box1.intersectsBox(box)) {
          collidedX = true
          if (velocity.x > 0) {
            // Moving positive X -> snap to box min X minus halfWidth
            const allowed = box.min.x - halfWidth - 0.001
            resolvedX = Math.min(resolvedX, allowed)
          } else {
            // Moving negative X -> snap to box max X plus halfWidth
            const allowed = box.max.x + halfWidth + 0.001
            resolvedX = Math.max(resolvedX, allowed)
          }
        }
      }

      if (collidedX) {
        position.x = resolvedX
        velocity.x = 0
      } else {
        position.x = nextX
      }
    }

    // 2. Resolve Z movement
    if (Math.abs(velocity.z) > 0.0001) {
      const nextZ = position.z + velocity.z * dt

      // Construct proposed player AABB for Z movement
      _box1.min.set(position.x - halfWidth, position.y + stepHeight, nextZ - halfWidth)
      _box1.max.set(position.x + halfWidth, position.y + height, nextZ + halfWidth)

      let collidedZ = false
      let resolvedZ = nextZ

      for (let i = 0; i < this.colliders.length; i++) {
        const box = this.colliders[i].box

        if (box.max.y <= position.y + stepHeight) continue

        if (_box1.intersectsBox(box)) {
          collidedZ = true
          if (velocity.z > 0) {
            // Moving positive Z -> snap to box min Z minus halfWidth
            const allowed = box.min.z - halfWidth - 0.001
            resolvedZ = Math.min(resolvedZ, allowed)
          } else {
            // Moving negative Z -> snap to box max Z plus halfWidth
            const allowed = box.max.z + halfWidth + 0.001
            resolvedZ = Math.max(resolvedZ, allowed)
          }
        }
      }

      if (collidedZ) {
        position.z = resolvedZ
        velocity.z = 0
      } else {
        position.z = nextZ
      }
    }

    // Keep player within city bounds
    const worldLimit = 58
    position.x = clamp(position.x, -worldLimit, worldLimit)
    position.z = clamp(position.z, -worldLimit, worldLimit)
  }

  /**
   * Raycast from origin to target to detect if line-of-sight is blocked by a solid obstacle.
   * Returns distance to intersection or null if unobstructed.
   */
  public checkLineOfSight(from: THREE.Vector3, to: THREE.Vector3): number | null {
    const ray = new THREE.Ray(from, _box1.min.copy(to).sub(from).normalize())
    const maxDist = from.distanceTo(to)
    let closestDist: number | null = null

    for (let i = 0; i < this.colliders.length; i++) {
      const box = this.colliders[i].box
      const hitPoint = _box2.min // reuse vector buffer
      const intersect = ray.intersectBox(box, hitPoint)

      if (intersect) {
        const dist = from.distanceTo(hitPoint)
        if (dist < maxDist && (closestDist === null || dist < closestDist)) {
          closestDist = dist
        }
      }
    }

    return closestDist
  }

  /**
   * Checks triggers against the player position and executes callbacks.
   */
  public checkTriggers(position: THREE.Vector3, radius = 0.5): void {
    _box1.min.set(position.x - radius, position.y, position.z - radius)
    _box1.max.set(position.x + radius, position.y + 1.8, position.z + radius)

    for (let i = 0; i < this.triggers.length; i++) {
      const trigger = this.triggers[i]
      if (_box1.intersectsBox(trigger.box)) {
        trigger.onCollide?.()
      }
    }
  }
}
