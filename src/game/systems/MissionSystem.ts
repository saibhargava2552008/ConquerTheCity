import * as THREE from 'three'
import type { MissionObjective } from '../core/Types'
import { EventEmitter } from '../core/EventEmitter'

export type MissionEvents = {
  objectiveCompleted: MissionObjective
  allCompleted: void
  objectiveUpdated: MissionObjective[]
}

export class MissionSystem {
  private events: EventEmitter<MissionEvents>
  private objectives: MissionObjective[] = []

  constructor(events: EventEmitter<MissionEvents>) {
    this.events = events
    this.initDefaultMissions()
  }

  private initDefaultMissions(): void {
    this.objectives = [
      {
        id: 'monument',
        title: 'Central Plaza',
        description: 'Visit the golden obelisk at the center of the city.',
        targetPosition: new THREE.Vector3(0, 0.5, 0),
        radius: 4.5,
        completed: false,
      },
      {
        id: 'observation_deck',
        title: 'Observation Deck',
        description: 'Climb the access ramp to the elevated observation platform.',
        targetPosition: new THREE.Vector3(-38, 3.2, -10),
        radius: 4.0,
        completed: false,
      },
      {
        id: 'cargo_yard',
        title: 'Cargo Containers',
        description: 'Reach the shipping container stack in the North-West zone.',
        targetPosition: new THREE.Vector3(-13.5, 1.5, 14),
        radius: 4.0,
        completed: false,
      },
      {
        id: 'warehouse',
        title: 'Industrial Warehouse',
        description: 'Locate the brick industrial warehouse in the South-East block.',
        targetPosition: new THREE.Vector3(26, 0.5, -16),
        radius: 6.0,
        completed: false,
      },
    ]
  }

  public getObjectives(): readonly MissionObjective[] {
    return this.objectives
  }

  public update(playerPos: THREE.Vector3): void {
    let changed = false

    for (const obj of this.objectives) {
      if (!obj.completed) {
        const dist = playerPos.distanceTo(obj.targetPosition)
        if (dist <= obj.radius) {
          obj.completed = true
          changed = true
          this.events.emit('objectiveCompleted', obj)
        }
      }
    }

    if (changed) {
      this.events.emit('objectiveUpdated', [...this.objectives])

      const allDone = this.objectives.every(o => o.completed)
      if (allDone) {
        this.events.emit('allCompleted', undefined)
      }
    }
  }

  public reset(): void {
    for (const obj of this.objectives) {
      obj.completed = false
    }
    this.events.emit('objectiveUpdated', [...this.objectives])
  }
}
