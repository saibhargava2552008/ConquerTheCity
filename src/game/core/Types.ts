import * as THREE from 'three'

export type MovementState = 'idle' | 'walking' | 'sprinting' | 'jumping' | 'falling'

export interface InputState {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  sprint: boolean
  movementX: number
  movementY: number
  scrollDelta: number
}

export interface PlayerStats {
  position: THREE.Vector3
  velocity: THREE.Vector3
  speed: number
  state: MovementState
  isGrounded: boolean
  isSprinting: boolean
  stamina: number
}

export interface EngineStats {
  fps: number
  frameTime: number
  drawCalls: number
  triangles: number
  entitiesCount: number
}

export interface ICollider {
  id: string
  box: THREE.Box3
  isStatic: boolean
  name?: string
  isTrigger?: boolean
  onCollide?: () => void
}

export interface IEntity {
  id: string
  mesh: THREE.Object3D
  update(dt: number): void
  dispose(): void
}

export interface MissionObjective {
  id: string
  title: string
  description: string
  targetPosition: THREE.Vector3
  radius: number
  completed: boolean
}
