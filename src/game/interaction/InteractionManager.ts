import * as THREE from 'three'
import type { IInteractable } from '../core/Types'
import { EventEmitter } from '../core/EventEmitter'
import { InteractionRegistry } from './InteractionRegistry'
import { InteractionDetector } from './InteractionDetector'
import { InteractionExecutor } from './InteractionExecutor'
import type {
  IInteractionTarget,
  InteractionContext,
  InteractionPrompt,
  InteractionLogEntry,
  InteractionCategory,
} from './InteractionTypes'

export type InteractionEvents = {
  promptChanged: InteractionPrompt
  interacted: { targetId: string; type: string; category?: string; timestamp: number }
  interactionFailed: { targetId: string; reason: string }
  historyUpdated: { history: InteractionLogEntry[] }
}

/**
 * InteractionManager — Milestone 5 Universal Framework
 * Central coordinator connecting Detection, Registry, and Execution pipelines.
 * Preserves 100% backward compatibility with all Milestones 1-4 systems.
 */
export class InteractionManager {
  public readonly events = new EventEmitter<InteractionEvents>()
  private registry: InteractionRegistry
  private detector: InteractionDetector
  private executor: InteractionExecutor

  private currentPrompt: InteractionPrompt = {
    active: false,
    prompt: '',
    key: '',
    targetId: '',
  }

  constructor() {
    this.registry = new InteractionRegistry()
    this.detector = new InteractionDetector(this.registry)
    this.executor = new InteractionExecutor(this.registry)

    // Forward executor events
    this.executor.events.on('interacted', data => {
      this.events.emit('interacted', data)
    })

    this.executor.events.on('interactionFailed', data => {
      this.events.emit('interactionFailed', data)
    })

    this.executor.events.on('historyUpdated', data => {
      this.events.emit('historyUpdated', data)
    })
  }

  // ---------------------------------------------------------------------------
  // 1. REGISTRATION & LIFECYCLE (Preserves IInteractable compatibility)
  // ---------------------------------------------------------------------------

  public register(target: IInteractable | IInteractionTarget): void {
    this.registry.register(target as IInteractionTarget)
  }

  public unregister(id: string): void {
    this.registry.unregister(id)
    if (this.currentPrompt.targetId === id) {
      this.clearPrompt()
    }
  }

  public getTarget(id: string): IInteractionTarget | undefined {
    return this.registry.get(id)
  }

  public getAllTargets(): IInteractionTarget[] {
    return this.registry.getAll()
  }

  public getTargetsByCategory(category: InteractionCategory): IInteractionTarget[] {
    return this.registry.getByCategory(category)
  }

  public clear(): void {
    this.registry.clear()
    this.clearPrompt()
    this.executor.clearHistory()
  }

  // ---------------------------------------------------------------------------
  // 2. CONVENIENCE BUILDER HELPERS FOR DISTINCT CATEGORIES
  // ---------------------------------------------------------------------------

  public registerWorld(
    id: string,
    position: THREE.Vector3,
    radius: number,
    prompt: string,
    onInteract: (ctx: any) => void,
    options?: Partial<IInteractionTarget>
  ): void {
    this.register({
      id,
      type: options?.type || 'door_open',
      category: 'world',
      priority: options?.priority ?? 70,
      position,
      interactionRadius: radius,
      promptText: prompt,
      promptKey: options?.promptKey || 'F',
      ...options,
      onInteract,
    })
  }

  public registerObject(
    id: string,
    position: THREE.Vector3,
    radius: number,
    prompt: string,
    onInteract: (ctx: any) => void,
    options?: Partial<IInteractionTarget>
  ): void {
    this.register({
      id,
      type: options?.type || 'examine',
      category: 'object',
      priority: options?.priority ?? 30,
      position,
      interactionRadius: radius,
      promptText: prompt,
      promptKey: options?.promptKey || 'F',
      ...options,
      onInteract,
    })
  }

  public registerNPC(
    id: string,
    position: THREE.Vector3,
    radius: number,
    prompt: string,
    onInteract: (ctx: any) => void,
    options?: Partial<IInteractionTarget>
  ): void {
    this.register({
      id,
      type: options?.type || 'npc_talk',
      category: 'npc',
      priority: options?.priority ?? 50,
      position,
      interactionRadius: radius,
      promptText: prompt,
      promptKey: options?.promptKey || 'F',
      ...options,
      onInteract,
    })
  }

  public registerVehicle(
    id: string,
    position: THREE.Vector3,
    radius: number,
    prompt: string,
    onInteract: (ctx: any) => void,
    options?: Partial<IInteractionTarget>
  ): void {
    this.register({
      id,
      type: options?.type || 'vehicle_enter',
      category: 'vehicle',
      priority: options?.priority ?? (options?.type === 'vehicle_exit' ? 100 : 80),
      position,
      interactionRadius: radius,
      promptText: prompt,
      promptKey: options?.promptKey || 'F',
      ...options,
      onInteract,
    })
  }

  public registerCommercial(
    id: string,
    position: THREE.Vector3,
    radius: number,
    prompt: string,
    onInteract: (ctx: any) => void,
    options?: Partial<IInteractionTarget>
  ): void {
    this.register({
      id,
      type: options?.type || 'commercial',
      category: 'commercial',
      priority: options?.priority ?? 40,
      position,
      interactionRadius: radius,
      promptText: prompt,
      promptKey: options?.promptKey || 'F',
      ...options,
      onInteract,
    })
  }

  // ---------------------------------------------------------------------------
  // 3. FRAME UPDATE & PROXIMITY EVALUATION
  // ---------------------------------------------------------------------------

  /**
   * Updates proximity checks, resolves priorities, and dispatches interactions.
   * Backward-compatible signature matching existing calls in Engine.ts.
   */
  public update(
    playerPos: THREE.Vector3,
    isInteractPressed: boolean,
    player: any,
    extraContext?: Partial<InteractionContext>
  ): InteractionPrompt {
    const dt = extraContext?.dt || 0.016
    this.executor.update(dt)

    const context: InteractionContext = {
      playerPos,
      player,
      playerFacing: extraContext?.playerFacing,
      cameraForward: extraContext?.cameraForward,
      isGrounded: extraContext?.isGrounded,
      isDriving: extraContext?.isDriving,
      isIndoor: extraContext?.isIndoor,
      activeBuildingId: extraContext?.activeBuildingId,
      dt,
    }

    const { primaryTarget, candidatePrompt } = this.detector.detect(context)

    // Handle prompt emission on state change
    if (
      this.currentPrompt.active !== candidatePrompt.active ||
      this.currentPrompt.targetId !== candidatePrompt.targetId ||
      this.currentPrompt.prompt !== candidatePrompt.prompt ||
      this.currentPrompt.isBlocked !== candidatePrompt.isBlocked
    ) {
      this.currentPrompt = candidatePrompt
      this.events.emit('promptChanged', candidatePrompt)
    }

    // Trigger execution if interact is pressed and a target is valid
    if (isInteractPressed && primaryTarget) {
      this.executor.execute(primaryTarget, context)
    }

    return this.currentPrompt
  }

  // ---------------------------------------------------------------------------
  // 4. FUTURE MISSION & AUDIT COMPATIBILITY
  // ---------------------------------------------------------------------------

  public getHistory(): InteractionLogEntry[] {
    return this.executor.getHistory()
  }

  public getLastInteraction(): InteractionLogEntry | null {
    return this.executor.getLastInteraction()
  }

  public wasInteracted(id: string): boolean {
    return this.registry.hasTriggered(id) || this.executor.getHistory().some(h => h.targetId === id)
  }

  public resetOneTimeInteraction(id: string): void {
    this.registry.resetTriggered(id)
  }

  public onInteractionCompleted(
    targetId: string,
    callback: (entry: { targetId: string; type: string }) => void
  ): () => void {
    return this.events.on('interacted', data => {
      if (data.targetId === targetId) {
        callback(data)
      }
    })
  }

  private clearPrompt(): void {
    if (this.currentPrompt.active) {
      this.currentPrompt = { active: false, prompt: '', key: '', targetId: '' }
      this.events.emit('promptChanged', this.currentPrompt)
    }
  }

  public dispose(): void {
    this.clear()
    this.events.removeAllListeners()
  }
}
