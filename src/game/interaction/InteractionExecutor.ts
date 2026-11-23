import type {
  IInteractionTarget,
  InteractionContext,
  InteractionLogEntry,
} from './InteractionTypes'
import { EventEmitter } from '../core/EventEmitter'
import type { InteractionRegistry } from './InteractionRegistry'

export type ExecutorEvents = {
  interacted: { targetId: string; type: string; category?: string; timestamp: number }
  interactionFailed: { targetId: string; reason: string }
  historyUpdated: { history: InteractionLogEntry[] }
}

/**
 * InteractionExecutor — Milestone 5
 * Enforces debounce cooldowns, duplicate trigger prevention, execution logging,
 * and dispatching for the universal interaction architecture.
 */
export class InteractionExecutor {
  public readonly events = new EventEmitter<ExecutorEvents>()
  private cooldownTimer = 0
  private readonly defaultCooldown = 0.35 // 350ms debounce
  private history: InteractionLogEntry[] = []
  private readonly maxHistoryLength = 100
  private registry: InteractionRegistry

  constructor(registry: InteractionRegistry) {
    this.registry = registry
  }

  public update(dt: number): void {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt
    }
  }

  public getCooldown(): number {
    return this.cooldownTimer
  }

  public setCooldown(seconds: number): void {
    this.cooldownTimer = seconds
  }

  public isReady(): boolean {
    return this.cooldownTimer <= 0
  }

  public execute(target: IInteractionTarget, context: InteractionContext): boolean {
    if (this.cooldownTimer > 0) {
      return false
    }

    // Check one-time constraints
    if (target.isOneTime && this.registry.hasTriggered(target.id)) {
      this.events.emit('interactionFailed', {
        targetId: target.id,
        reason: 'One-time interaction already completed',
      })
      return false
    }

    // Validate conditions
    if (target.canInteract) {
      const cond = target.canInteract(context)
      let allowed = true
      let reason = 'Interaction unavailable'

      if (typeof cond === 'boolean') {
        allowed = cond
      } else if (cond && typeof cond === 'object') {
        allowed = cond.allowed
        if (cond.reason) reason = cond.reason
      }

      if (!allowed) {
        this.events.emit('interactionFailed', { targetId: target.id, reason })
        return false
      }
    }

    // Set cooldown
    this.cooldownTimer = this.defaultCooldown

    // Mark one-time interaction if applicable
    if (target.isOneTime) {
      this.registry.markTriggered(target.id)
    }

    // Execute target callback
    try {
      target.onInteract(context.player || context)

      const entry: InteractionLogEntry = {
        targetId: target.id,
        type: target.type,
        category: target.category || 'world',
        timestamp: Date.now(),
        success: true,
        actionName: target.actionName,
        targetName: target.targetName,
      }
      this.recordLog(entry)

      this.events.emit('interacted', {
        targetId: target.id,
        type: target.type,
        category: target.category,
        timestamp: entry.timestamp,
      })

      return true
    } catch (err) {
      console.error(`[InteractionExecutor] Error executing target ${target.id}:`, err)
      this.events.emit('interactionFailed', {
        targetId: target.id,
        reason: err instanceof Error ? err.message : 'Execution error',
      })
      return false
    }
  }

  public getHistory(): InteractionLogEntry[] {
    return [...this.history]
  }

  public getLastInteraction(): InteractionLogEntry | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null
  }

  public clearHistory(): void {
    this.history = []
  }

  private recordLog(entry: InteractionLogEntry): void {
    this.history.push(entry)
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift()
    }
    this.events.emit('historyUpdated', { history: this.history })
  }
}
