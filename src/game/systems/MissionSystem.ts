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
        id: 'lighthouse',
        title: 'Seaview Lighthouse',
        description: 'Visit the landmark coastal lighthouse at the Town Centre.',
        targetPosition: new THREE.Vector3(0, 0.5, -5),
        radius: 6.5,
        completed: false,
      },
      {
        id: 'promenade_beach',
        title: 'Golden Sands Beach',
        description: 'Explore the seaside promenade and beach shacks along the ocean.',
        targetPosition: new THREE.Vector3(-32, 0.5, 0),
        radius: 9.0,
        completed: false,
      },
      {
        id: 'fishing_harbour',
        title: 'Fisherman’s Wharf',
        description: 'Inspect the traditional wooden fishing boats moored at the docks.',
        targetPosition: new THREE.Vector3(-38, 0.5, 72),
        radius: 8.5,
        completed: false,
      },
      {
        id: 'market_bazaar',
        title: 'Bazaar Street',
        description: 'Navigate the vibrant spice stalls and shops in the Local Market.',
        targetPosition: new THREE.Vector3(38, 0.5, 50),
        radius: 8.0,
        completed: false,
      },
      {
        id: 'residential_quarter',
        title: 'Coastal Neighbourhood',
        description: 'Stroll down the residential avenue lined with Goan/Konkan villas.',
        targetPosition: new THREE.Vector3(45, 0.5, -50),
        radius: 8.5,
        completed: false,
      },
      {
        id: 'highway_outpost',
        title: 'Highway Outpost',
        description: 'Reach the countryside toll gate and highway leading outside town.',
        targetPosition: new THREE.Vector3(95, 0.5, 0),
        radius: 8.0,
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
