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
   * Resolves horizontal motion with clean axis-wise separation.
   * Ensures seamless wall sliding, eliminates jitter/freezing at corners,
   * preserves step-up curbs, and prevents penetration through solid obstacles.
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
    const skin = 0.002 // 2mm buffer to prevent numerical contact flutter

    const startX = position.x
    const startZ = position.z
    const footY = position.y
    const headY = position.y + height

    // 1. Resolve X movement
    if (Math.abs(velocity.x) > 0.0001) {
      const targetX = startX + velocity.x * dt
      let resolvedX = targetX
      let collidedX = false

      for (let i = 0; i < this.colliders.length; i++) {
        const box = this.colliders[i].box

        // Skip obstacles step-up can handle or that are overhead
        if (box.max.y <= footY + stepHeight || box.min.y >= headY) continue

        // Check if player overlaps the collider along Z
        const overlapsZ =
          startZ + halfWidth - skin > box.min.z && startZ - halfWidth + skin < box.max.z
        if (!overlapsZ) continue

        if (velocity.x > 0) {
          // Moving positive X (East) -> can only collide with West face (box.min.x)
          const wasOutside = startX + halfWidth <= box.min.x + 0.05
          const willEnter = targetX + halfWidth > box.min.x
          if (wasOutside && willEnter) {
            const allowed = box.min.x - halfWidth - skin
            if (!collidedX || allowed < resolvedX) {
              resolvedX = allowed
              collidedX = true
            }
          }
        } else {
          // Moving negative X (West) -> can only collide with East face (box.max.x)
          const wasOutside = startX - halfWidth >= box.max.x - 0.05
          const willEnter = targetX - halfWidth < box.max.x
          if (wasOutside && willEnter) {
            const allowed = box.max.x + halfWidth + skin
            if (!collidedX || allowed > resolvedX) {
              resolvedX = allowed
              collidedX = true
            }
          }
        }
      }

      if (collidedX) {
        position.x = resolvedX
        velocity.x = 0
      } else {
        position.x = targetX
      }
    }

    // 2. Resolve Z movement (using updated position.x)
    if (Math.abs(velocity.z) > 0.0001) {
      const targetZ = startZ + velocity.z * dt
      let resolvedZ = targetZ
      let collidedZ = false

      for (let i = 0; i < this.colliders.length; i++) {
        const box = this.colliders[i].box

        // Skip obstacles step-up can handle or that are overhead
        if (box.max.y <= footY + stepHeight || box.min.y >= headY) continue

        // Check if player overlaps the collider along X
        const overlapsX =
          position.x + halfWidth - skin > box.min.x && position.x - halfWidth + skin < box.max.x
        if (!overlapsX) continue

        if (velocity.z > 0) {
          // Moving positive Z (South) -> can only collide with North face (box.min.z)
          const wasOutside = startZ + halfWidth <= box.min.z + 0.05
          const willEnter = targetZ + halfWidth > box.min.z
          if (wasOutside && willEnter) {
            const allowed = box.min.z - halfWidth - skin
            if (!collidedZ || allowed < resolvedZ) {
              resolvedZ = allowed
              collidedZ = true
            }
          }
        } else {
          // Moving negative Z (North) -> can only collide with South face (box.max.z)
          const wasOutside = startZ - halfWidth >= box.max.z - 0.05
          const willEnter = targetZ - halfWidth < box.max.z
          if (wasOutside && willEnter) {
            const allowed = box.max.z + halfWidth + skin
            if (!collidedZ || allowed > resolvedZ) {
              resolvedZ = allowed
              collidedZ = true
            }
          }
        }
      }

      if (collidedZ) {
        position.z = resolvedZ
        velocity.z = 0
      } else {
        position.z = targetZ
      }
    }

    // 3. De-penetration safety pass
    // If player is slightly embedded inside an obstacle, push out along shortest axis
    for (let i = 0; i < this.colliders.length; i++) {
      const box = this.colliders[i].box
      if (box.max.y <= footY + stepHeight || box.min.y >= headY) continue

      const pMinX = position.x - halfWidth
      const pMaxX = position.x + halfWidth
      const pMinZ = position.z - halfWidth
      const pMaxZ = position.z + halfWidth

      // Check full AABB intersection
      if (pMaxX > box.min.x && pMinX < box.max.x && pMaxZ > box.min.z && pMinZ < box.max.z) {
        const penLeft = pMaxX - box.min.x
        const penRight = box.max.x - pMinX
        const penTop = pMaxZ - box.min.z
        const penBottom = box.max.z - pMinZ

        const minPen = Math.min(penLeft, penRight, penTop, penBottom)

        if (minPen === penLeft) {
          position.x = box.min.x - halfWidth - skin
          velocity.x = Math.min(0, velocity.x)
        } else if (minPen === penRight) {
          position.x = box.max.x + halfWidth + skin
          velocity.x = Math.max(0, velocity.x)
        } else if (minPen === penTop) {
          position.z = box.min.z - halfWidth - skin
          velocity.z = Math.min(0, velocity.z)
        } else {
          position.z = box.max.z + halfWidth + skin
          velocity.z = Math.max(0, velocity.z)
        }
      }
    }

    // 4. World bounds safety clamping
    const worldLimit = 56.5
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
