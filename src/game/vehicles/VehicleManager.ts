import * as THREE from 'three'
import { DrivableVehicle } from './DrivableVehicle'
import type { VehicleType, VehicleDrivingState } from './VehicleTypes'
import type { CollisionSystem } from '../physics/CollisionSystem'
import type { InteractionManager } from '../interaction/InteractionManager'
import type { ThirdPersonCamera } from '../camera/ThirdPersonCamera'
import type { Player } from '../entities/Player'
import type { InputState } from '../core/Types'
import { EventEmitter } from '../core/EventEmitter'

export type VehicleEvents = {
  vehicleEntered: { vehicle: DrivableVehicle }
  vehicleExited: { vehicle: DrivableVehicle; exitPosition: THREE.Vector3 }
  vehicleStats: VehicleDrivingState
}

export class VehicleManager {
  public readonly events = new EventEmitter<VehicleEvents>()
  public readonly group = new THREE.Group()

  private vehicles = new Map<string, DrivableVehicle>()
  private activeVehicle: DrivableVehicle | null = null

  private collisionSystem: CollisionSystem
  private interactionManager: InteractionManager

  private interactCooldownTimer = 0
  private registeredInteractables = new Set<string>()

  constructor(collisionSystem: CollisionSystem, interactionManager: InteractionManager) {
    this.collisionSystem = collisionSystem
    this.interactionManager = interactionManager
    this.group.name = 'DrivableVehicles'
  }

  /**
   * Spawns and registers a new drivable vehicle in the world.
   */
  public spawnVehicle(
    id: string,
    type: VehicleType,
    position: THREE.Vector3,
    heading = 0
  ): DrivableVehicle {
    if (this.vehicles.has(id)) {
      return this.vehicles.get(id)!
    }

    const vehicle = new DrivableVehicle(id, type, position, heading, this.collisionSystem)
    this.vehicles.set(id, vehicle)
    this.group.add(vehicle.group)

    this.registerVehicleInteraction(vehicle)

    return vehicle
  }

  private registerVehicleInteraction(vehicle: DrivableVehicle): void {
    if (this.registeredInteractables.has(vehicle.interactableId)) return

    this.interactionManager.register({
      id: vehicle.interactableId,
      type: 'vehicle_enter',
      position: vehicle.position,
      interactionRadius: 2.8,
      promptText: `Drive ${vehicle.config.displayName}`,
      promptKey: 'F',
      canInteract: () => !vehicle.isOccupied && this.activeVehicle === null && this.interactCooldownTimer <= 0,
      onInteract: (player: Player) => {
        this.enterVehicle(vehicle, player)
      },
    })

    this.registeredInteractables.add(vehicle.interactableId)
  }

  private unregisterVehicleInteraction(vehicle: DrivableVehicle): void {
    this.interactionManager.unregister(vehicle.interactableId)
    this.registeredInteractables.delete(vehicle.interactableId)
  }

  public getActiveVehicle(): DrivableVehicle | null {
    return this.activeVehicle
  }

  public isDriving(): boolean {
    return this.activeVehicle !== null
  }

  public getVehicle(id: string): DrivableVehicle | undefined {
    return this.vehicles.get(id)
  }

  public getAllVehicles(): DrivableVehicle[] {
    return Array.from(this.vehicles.values())
  }

  /**
   * Enters the specified vehicle.
   */
  public enterVehicle(vehicle: DrivableVehicle, player: Player): boolean {
    if (this.activeVehicle || vehicle.isOccupied || this.interactCooldownTimer > 0) return false

    const entered = vehicle.enter(player, this.collisionSystem)
    if (!entered) return false

    this.activeVehicle = vehicle
    this.interactCooldownTimer = 0.45 // Prevent accidental exit on key release

    // Register active exit interactable prompt
    this.interactionManager.register({
      id: 'vehicle_exit_action',
      type: 'vehicle_exit',
      position: vehicle.position,
      interactionRadius: 10.0,
      promptText: 'Exit Vehicle',
      promptKey: 'F',
      canInteract: () => this.isDriving() && this.interactCooldownTimer <= 0,
      onInteract: (p: Player) => {
        this.exitVehicle(p)
      },
    })

    this.events.emit('vehicleEntered', { vehicle })
    return true
  }

  /**
   * Exits the current active vehicle.
   */
  public exitVehicle(player: Player): boolean {
    if (!this.activeVehicle || this.interactCooldownTimer > 0) return false

    const vehicle = this.activeVehicle
    const safePos = vehicle.exit(this.collisionSystem)

    // Remove exit prompt
    this.interactionManager.unregister('vehicle_exit_action')

    // Reset player position and orientation
    player.setPosition(safePos.x, safePos.y, safePos.z)
    player.modelRoot.rotation.y = vehicle.heading

    this.activeVehicle = null
    this.interactCooldownTimer = 0.45

    this.events.emit('vehicleExited', { vehicle, exitPosition: safePos })
    return true
  }

  /**
   * Main per-frame update loop for vehicle system.
   */
  public update(
    dt: number,
    input: InputState,
    player: Player,
    camera: ThirdPersonCamera
  ): VehicleDrivingState | null {
    if (this.interactCooldownTimer > 0) {
      this.interactCooldownTimer -= dt
    }

    if (this.activeVehicle) {
      // 1. Process active driven vehicle
      const state = this.activeVehicle.update(dt, input, this.collisionSystem)

      // 2. Lock driver player position to seat
      const seatPos = this.activeVehicle.getDriverSeatWorldPosition()
      player.mesh.position.copy(seatPos)
      player.modelRoot.rotation.y = this.activeVehicle.heading

      // 3. Dynamic Vehicle Driving Camera Follow
      camera.distance = this.activeVehicle.config.cameraDistance

      // Smooth auto-alignment of camera yaw when moving forward or reversing
      if (Math.abs(this.activeVehicle.currentSpeed) > 0.8) {
        // Auto align camera gently to vehicle heading when driver isn't actively moving mouse
        if (Math.abs(input.movementX) < 1.0) {
          let yawDiff = this.activeVehicle.heading - camera.yaw
          while (yawDiff > Math.PI) yawDiff -= Math.PI * 2
          while (yawDiff < -Math.PI) yawDiff += Math.PI * 2
          camera.yaw += yawDiff * Math.min(dt * 3.2, 0.15)
        }
      }

      this.events.emit('vehicleStats', state)
      return state
    } else {
      // Unoccupied vehicles physics settling
      for (const v of this.vehicles.values()) {
        if (Math.abs(v.currentSpeed) > 0.01) {
          v.update(dt, null, this.collisionSystem)
        }
      }
      return null
    }
  }

  public dispose(): void {
    this.interactionManager.unregister('vehicle_exit_action')
    for (const v of this.vehicles.values()) {
      this.unregisterVehicleInteraction(v)
      v.dispose(this.collisionSystem)
    }
    this.vehicles.clear()
    this.activeVehicle = null
    this.group.clear()
  }
}
