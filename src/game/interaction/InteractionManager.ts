import * as THREE from 'three'
import type { IInteractable, InteractionPrompt } from '../core/Types'
import { EventEmitter } from '../core/EventEmitter'

export type InteractionEvents = {
  promptChanged: InteractionPrompt
  interacted: { targetId: string; type: string }
}

/**
 * InteractionManager — Milestone 1 & 5
 * Manages proximity detection, contextual prompt emission, and interaction dispatch.
 */
export class InteractionManager {
  public readonly events = new EventEmitter<InteractionEvents>()
  private targets = new Map<string, IInteractable>()
  private currentPrompt: InteractionPrompt = {
    active: false,
    prompt: '',
    key: '',
    targetId: '',
  }

  public register(target: IInteractable): void {
    this.targets.set(target.id, target)
  }

  public unregister(id: string): void {
    this.targets.delete(id)
    if (this.currentPrompt.targetId === id) {
      this.clearPrompt()
    }
  }

  public getTarget(id: string): IInteractable | undefined {
    return this.targets.get(id)
  }

  public getAllTargets(): IInteractable[] {
    return Array.from(this.targets.values())
  }

  public clear(): void {
    this.targets.clear()
    this.clearPrompt()
  }

  private clearPrompt(): void {
    if (this.currentPrompt.active) {
      this.currentPrompt = { active: false, prompt: '', key: '', targetId: '' }
      this.events.emit('promptChanged', this.currentPrompt)
    }
  }

  /**
   * Updates proximity checks and handles interaction trigger.
   */
  public update(playerPos: THREE.Vector3, isInteractPressed: boolean, player: any): InteractionPrompt {
    let closestTarget: IInteractable | null = null
    let closestDistSq = Infinity

    for (const target of this.targets.values()) {
      if (target.canInteract && !target.canInteract(player)) {
        continue
      }

      const distSq = playerPos.distanceToSquared(target.position)
      const radiusSq = target.interactionRadius * target.interactionRadius

      if (distSq <= radiusSq && distSq < closestDistSq) {
        closestDistSq = distSq
        closestTarget = target
      }
    }

    if (closestTarget) {
      const prompt: InteractionPrompt = {
        active: true,
        prompt: closestTarget.promptText,
        key: closestTarget.promptKey || 'F',
        targetId: closestTarget.id,
        interactionType: closestTarget.type,
      }

      // If prompt changed, emit event
      if (
        !this.currentPrompt.active ||
        this.currentPrompt.targetId !== prompt.targetId ||
        this.currentPrompt.prompt !== prompt.prompt
      ) {
        this.currentPrompt = prompt
        this.events.emit('promptChanged', prompt)
      }

      // Execute interaction if pressed
      if (isInteractPressed) {
        closestTarget.onInteract(player)
        this.events.emit('interacted', { targetId: closestTarget.id, type: closestTarget.type })
      }

      return prompt
    } else {
      this.clearPrompt()
      return this.currentPrompt
    }
  }

  public dispose(): void {
    this.clear()
    this.events.removeAllListeners()
  }
}
