import * as THREE from 'three'
import type { DialogueMessage } from '../core/Types'

export type InteractionCategory =
  | 'world'
  | 'object'
  | 'npc'
  | 'vehicle'
  | 'commercial'

export type InteractionType =
  | 'vehicle_enter'
  | 'vehicle_exit'
  | 'npc_talk'
  | 'bench_sit'
  | 'door_open'
  | 'examine'
  | 'commercial'
  | 'pickup'
  | 'activate'
  | 'generic'

export interface InteractionPriority {
  readonly CRITICAL: number   // 100 - Vehicle exit, emergency dismount
  readonly VEHICLE: number    // 80  - Vehicle entry
  readonly DOOR: number       // 70  - Building entrance / exit transitions
  readonly NPC: number        // 50  - Conversing with NPCs
  readonly COMMERCIAL: number // 40  - Shop counters and street vendors
  readonly OBJECT: number     // 30  - Examine objects, notes, evidence
  readonly WORLD: number      // 20  - Informational plaques, gates, environmental objects
  readonly LOW: number        // 10  - Background ambient interactables
}

export const INTERACTION_PRIORITIES: InteractionPriority = {
  CRITICAL: 100,
  VEHICLE: 80,
  DOOR: 70,
  NPC: 50,
  COMMERCIAL: 40,
  OBJECT: 30,
  WORLD: 20,
  LOW: 10,
}

export interface InteractionContext {
  playerPos: THREE.Vector3
  playerFacing?: number
  cameraForward?: THREE.Vector3
  isGrounded?: boolean
  isDriving?: boolean
  isIndoor?: boolean
  activeBuildingId?: string | null
  player?: any
  dt?: number
}

export interface InteractionConditionResult {
  allowed: boolean
  reason?: string
}

export interface IInteractionTarget {
  id: string
  type: InteractionType
  category?: InteractionCategory
  priority?: number
  position: THREE.Vector3
  interactionRadius: number
  promptText: string
  promptKey?: string
  actionName?: string
  targetName?: string
  secondaryAction?: string
  secondaryKey?: string
  isOneTime?: boolean
  hasTriggered?: boolean
  district?: string
  metadata?: Record<string, any>
  canInteract?: (context: InteractionContext | any) => boolean | InteractionConditionResult
  onInteract: (context: InteractionContext | any) => void
}

export interface InteractionPrompt {
  active: boolean
  prompt: string
  key: string
  targetId: string
  interactionType?: InteractionType
  category?: InteractionCategory
  actionName?: string
  targetName?: string
  secondaryAction?: string
  secondaryKey?: string
  priority?: number
  isBlocked?: boolean
  blockedReason?: string
}

export interface InteractionLogEntry {
  targetId: string
  type: InteractionType
  category: InteractionCategory
  timestamp: number
  success: boolean
  actionName?: string
  targetName?: string
}

export interface InteractionFeedback {
  success: boolean
  message?: string
  dialogue?: DialogueMessage
}
