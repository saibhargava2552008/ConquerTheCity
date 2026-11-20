import * as THREE from 'three'
import type { ICollider, SurfaceType } from '../core/Types'
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

  public updateCollider(id: string, newBox: THREE.Box3): boolean {
    for (let i = 0; i < this.colliders.length; i++) {
      if (this.colliders[i].id === id) {
        this.colliders[i].box.copy(newBox)
        return true
      }
    }
    for (let i = 0; i < this.triggers.length; i++) {
      if (this.triggers[i].id === id) {
        this.triggers[i].box.copy(newBox)
        return true
      }
    }
    return false
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

  private inferSurfaceType(c: ICollider): SurfaceType {
    if (c.surfaceType) return c.surfaceType
    const name = (c.name || c.id).toLowerCase()
    if (name.includes('sand') || name.includes('dune') || name.includes('beach')) return 'sand'
    if (name.includes('road') || name.includes('highway') || name.includes('boulevard') || name.includes('asphalt')) return 'road'
    if (name.includes('sidewalk') || name.includes('curb') || name.includes('plaza') || name.includes('concourse')) return 'sidewalk'
    if (name.includes('deck') || name.includes('wharf') || name.includes('pier') || name.includes('boardwalk') || name.includes('boat')) return 'wood_deck'
    if (name.includes('interior') || name.includes('floor') || name.includes('cabin') || name.includes('cooperative') || name.includes('storage') || name.includes('pavilion')) return 'interior'
    if (name.includes('water') || name.includes('ocean')) return 'water_hazard'
    return 'ground'
  }

  /**
   * Finds the highest solid surface directly below or at the player's feet
   * within step-up tolerance.
   */
  public getGroundHeight(posX: number, posY: number, posZ: number, radius = 0.35): number {
    return this.getGroundInfo(posX, posY, posZ, radius).height
  }

  /**
   * Returns both the highest surface height and its surface material type.
   */
  public getGroundInfo(
    posX: number,
    posY: number,
    posZ: number,
    radius = 0.35
  ): { height: number; surfaceType: SurfaceType } {
    let highestGround = -Infinity
    let foundGround = false
    let surfaceType: SurfaceType = 'ground'

    const minX = posX - radius
    const maxX = posX + radius
    const minZ = posZ - radius
    const maxZ = posZ + radius

    const stepUpLimit = posY + 0.45

    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i]
      const box = c.box

      if (maxX > box.min.x && minX < box.max.x && maxZ > box.min.z && minZ < box.max.z) {
        if (box.max.y <= stepUpLimit && (!foundGround || box.max.y >= highestGround)) {
          highestGround = box.max.y
          surfaceType = this.inferSurfaceType(c)
          foundGround = true
        }
      }
    }

    if (!foundGround) {
      highestGround = 0
    }

    return { height: highestGround, surfaceType }
  }

  /**
   * Returns surface material type at position.
   */
  public getSurfaceType(posX: number, posY: number, posZ: number, radius = 0.35): SurfaceType {
    return this.getGroundInfo(posX, posY, posZ, radius).surfaceType
  }

  /**
   * Checks whether a bounding box at (x, y, z) intersects any solid obstacles.
   */
  public isPositionBlocked(
    x: number,
    y: number,
    z: number,
    radius: number,
    height: number,
    ignoreColliderId?: string
  ): boolean {
    const halfWidth = radius
    const stepHeight = 0.45
    const footY = y
    const headY = y + height

    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i]
      if (ignoreColliderId && c.id === ignoreColliderId) continue
      if (typeof c.name === 'string' && c.name.toLowerCase().includes('ground')) continue
      const box = c.box
      if (box.max.y <= footY + stepHeight || box.min.y >= headY) continue

      if (
        x + halfWidth > box.min.x &&
        x - halfWidth < box.max.x &&
        z + halfWidth > box.min.z &&
        z - halfWidth < box.max.z
      ) {
        return true
      }
    }
    return false
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
        const c = this.colliders[i]
        if (typeof c.name === 'string' && c.name.toLowerCase().includes('ground')) continue
        const box = c.box

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
        const c = this.colliders[i]
        if (typeof c.name === 'string' && c.name.toLowerCase().includes('ground')) continue
        const box = c.box

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
    // Evaluates candidates and guarantees player is never pushed into another solid collider
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < this.colliders.length; i++) {
        const c = this.colliders[i]
        if (typeof c.name === 'string' && c.name.toLowerCase().includes('ground')) continue
        const box = c.box
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

          const candidates = [
            { x: box.min.x - halfWidth - skin, z: position.z, pen: penLeft, axis: 'x', dir: -1 },
            { x: box.max.x + halfWidth + skin, z: position.z, pen: penRight, axis: 'x', dir: 1 },
            { x: position.x, z: box.min.z - halfWidth - skin, pen: penTop, axis: 'z', dir: -1 },
            { x: position.x, z: box.max.z + halfWidth + skin, pen: penBottom, axis: 'z', dir: 1 },
          ].sort((a, b) => a.pen - b.pen)

          // Pick the shallowest direction that does NOT push player into another collider
          let resolved = false
          for (let k = 0; k < candidates.length; k++) {
            const cand = candidates[k]
            if (!this.isPositionBlocked(cand.x, footY, cand.z, halfWidth, height, c.id)) {
              position.x = cand.x
              position.z = cand.z
              if (cand.axis === 'x') {
                velocity.x = cand.dir < 0 ? Math.min(0, velocity.x) : Math.max(0, velocity.x)
              } else {
                velocity.z = cand.dir < 0 ? Math.min(0, velocity.z) : Math.max(0, velocity.z)
              }
              resolved = true
              break
            }
          }

          // Fallback if cornered: take smallest penetration direction
          if (!resolved) {
            const best = candidates[0]
            position.x = best.x
            position.z = best.z
            if (best.axis === 'x') {
              velocity.x = best.dir < 0 ? Math.min(0, velocity.x) : Math.max(0, velocity.x)
            } else {
              velocity.z = best.dir < 0 ? Math.min(0, velocity.z) : Math.max(0, velocity.z)
            }
          }
        }
      }
    }

    // 4. World bounds safety clamping for expanded Seaview Town (bounds: +/-120m)
    const worldLimit = 120.0
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

  /**
   * Validates whether a direct straight path from origin to destination
   * is free of solid building obstacles and walls.
   * Useful for NPC pathfinding and vehicle waypoint steering.
   */
  public isPathClear(
    from: THREE.Vector3,
    to: THREE.Vector3,
    radius = 0.4,
    height = 1.8,
    ignoreColliderId?: string
  ): boolean {
    const dist = from.distanceTo(to)
    if (dist <= 0.05) {
      return !this.isPositionBlocked(to.x, to.y, to.z, radius, height, ignoreColliderId)
    }

    const steps = Math.ceil(dist / 0.5) // sample every 50cm
    const stepVec = new THREE.Vector3().subVectors(to, from).divideScalar(steps)
    const testPos = from.clone()

    for (let s = 1; s <= steps; s++) {
      testPos.add(stepVec)
      if (this.isPositionBlocked(testPos.x, testPos.y, testPos.z, radius, height, ignoreColliderId)) {
        return false
      }
    }

    return true
  }

  /**
   * Resolves vehicle box collision against all static and dynamic world colliders.
   * Supports smooth wall-sliding for vehicles during driving.
   */
  public resolveVehicleMovement(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    halfWidth: number,
    halfLength: number,
    height: number,
    dt: number,
    ignoreColliderId?: string
  ): { collided: boolean; normal: THREE.Vector3 } {
    const skin = 0.04
    const curbStep = 0.25
    const footY = position.y
    const headY = position.y + height
    const normal = new THREE.Vector3(0, 0, 0)
    let collided = false

    // 1. Resolve X movement
    if (Math.abs(velocity.x) > 0.0001) {
      const startX = position.x
      const targetX = startX + velocity.x * dt
      let resolvedX = targetX

      for (let i = 0; i < this.colliders.length; i++) {
        const c = this.colliders[i]
        if (ignoreColliderId && c.id === ignoreColliderId) continue
        const box = c.box
        if (box.max.y <= footY + curbStep || box.min.y >= headY) continue

        const overlapsZ =
          position.z + halfLength - skin > box.min.z && position.z - halfLength + skin < box.max.z
        if (!overlapsZ) continue

        if (velocity.x > 0) {
          const wasOutside = startX + halfWidth <= box.min.x + 0.1
          const willEnter = targetX + halfWidth > box.min.x
          if (wasOutside && willEnter) {
            resolvedX = box.min.x - halfWidth - skin
            collided = true
            normal.x = -1
          }
        } else {
          const wasOutside = startX - halfWidth >= box.max.x - 0.1
          const willEnter = targetX - halfWidth < box.max.x
          if (wasOutside && willEnter) {
            resolvedX = box.max.x + halfWidth + skin
            collided = true
            normal.x = 1
          }
        }
      }

      position.x = resolvedX
      if (collided && normal.x !== 0) velocity.x *= 0.1
    }

    // 2. Resolve Z movement
    if (Math.abs(velocity.z) > 0.0001) {
      const startZ = position.z
      const targetZ = startZ + velocity.z * dt
      let resolvedZ = targetZ
      let collidedZ = false

      for (let i = 0; i < this.colliders.length; i++) {
        const c = this.colliders[i]
        if (ignoreColliderId && c.id === ignoreColliderId) continue
        const box = c.box
        if (box.max.y <= footY + curbStep || box.min.y >= headY) continue

        const overlapsX =
          position.x + halfWidth - skin > box.min.x && position.x - halfWidth + skin < box.max.x
        if (!overlapsX) continue

        if (velocity.z > 0) {
          const wasOutside = startZ + halfLength <= box.min.z + 0.1
          const willEnter = targetZ + halfLength > box.min.z
          if (wasOutside && willEnter) {
            resolvedZ = box.min.z - halfLength - skin
            collidedZ = true
            normal.z = -1
          }
        } else {
          const wasOutside = startZ - halfLength >= box.max.z - 0.1
          const willEnter = targetZ - halfLength < box.max.z
          if (wasOutside && willEnter) {
            resolvedZ = box.max.z + halfLength + skin
            collidedZ = true
            normal.z = 1
          }
        }
      }

      position.z = resolvedZ
      if (collidedZ) {
        collided = true
        velocity.z *= 0.1
      }
    }

    // World bounds safety clamping
    position.x = clamp(position.x, -118, 118)
    position.z = clamp(position.z, -118, 118)

    return { collided, normal }
  }
}
