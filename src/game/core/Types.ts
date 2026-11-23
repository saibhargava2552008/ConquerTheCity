import * as THREE from 'three'

export type MovementState = 'idle' | 'walking' | 'sprinting' | 'jumping' | 'falling' | 'driving'

export type SurfaceType = 'ground' | 'road' | 'sidewalk' | 'sand' | 'wood_deck' | 'interior' | 'water_hazard'
export type ColliderType = 'static' | 'dynamic' | 'trigger' | 'vehicle' | 'npc'

export interface InputState {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  sprint: boolean
  interact: boolean
  handbrake: boolean
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
  surfaceType?: SurfaceType
  colliderType?: ColliderType
  onCollide?: () => void
}

export type InteractionType = 'vehicle_enter' | 'vehicle_exit' | 'npc_talk' | 'bench_sit' | 'door_open' | 'generic'

export interface InteractionPrompt {
  active: boolean
  prompt: string
  key: string
  targetId: string
  interactionType?: InteractionType
}

export interface IInteractable {
  id: string
  type: InteractionType
  position: THREE.Vector3
  interactionRadius: number
  promptText: string
  promptKey?: string
  canInteract?: (player: any) => boolean
  onInteract(player: any): void
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

export interface DialogueMessage {
  speaker: string
  title?: string
  text: string
  district?: string
  duration?: number
}
