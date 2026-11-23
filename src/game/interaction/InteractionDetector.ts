import * as THREE from 'three'
import type { InteractionRegistry } from './InteractionRegistry'
import type {
  IInteractionTarget,
  InteractionContext,
  InteractionPrompt,
} from './InteractionTypes'

export interface DetectionResult {
  primaryTarget: IInteractionTarget | null
  candidatePrompt: InteractionPrompt
}

/**
 * InteractionDetector — Milestone 5
 * High-performance, zero-garbage proximity detection with priority resolution and facing angle scoring.
 */
export class InteractionDetector {
  private registry: InteractionRegistry
  private _dirVec = new THREE.Vector3()

  constructor(registry: InteractionRegistry) {
    this.registry = registry
  }

  public detect(context: InteractionContext): DetectionResult {
    const playerPos = context.playerPos
    const isDriving = !!context.isDriving

    let bestTarget: IInteractionTarget | null = null
    let bestScore = -Infinity
    let bestBlockedTarget: IInteractionTarget | null = null
    let bestBlockedReason = ''

    const targets = this.registry.getAll()

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i]

      // One-time interaction check
      if (target.isOneTime && this.registry.hasTriggered(target.id)) {
        continue
      }

      // State constraint 1: When driving, only allow vehicle exit
      if (isDriving) {
        if (target.type !== 'vehicle_exit') {
          continue
        }
      } else {
        // When on foot, don't show vehicle exit
        if (target.type === 'vehicle_exit') {
          continue
        }
      }

      // Distance check
      const distSq = playerPos.distanceToSquared(target.position)
      const radiusSq = target.interactionRadius * target.interactionRadius

      if (distSq > radiusSq) {
        continue
      }

      const dist = Math.sqrt(distSq)

      // Facing angle bonus calculation
      let facingBonus = 0
      if (context.cameraForward) {
        this._dirVec.subVectors(target.position, playerPos).setY(0)
        if (this._dirVec.lengthSq() > 0.0001) {
          this._dirVec.normalize()
          const dot = context.cameraForward.dot(this._dirVec)
          if (dot > 0.3) {
            facingBonus = dot * 25.0 // Facing towards target
          }
        }
      }

      // Condition check
      let isAllowed = true
      let failureReason: string | undefined

      if (target.canInteract) {
        const cond = target.canInteract(context)
        if (typeof cond === 'boolean') {
          isAllowed = cond
        } else if (cond && typeof cond === 'object') {
          isAllowed = cond.allowed
          failureReason = cond.reason
        }
      }

      if (!isAllowed) {
        if (failureReason && !bestBlockedTarget) {
          bestBlockedTarget = target
          bestBlockedReason = failureReason
        }
        continue
      }

      // Priority and Distance Composite Scoring
      // Priority (10-100) dominates, distance refines (closer is better), facing angle breaks ties
      const priority = target.priority ?? 20
      const score = priority * 100 - dist * 10 + facingBonus

      if (score > bestScore) {
        bestScore = score
        bestTarget = target
      }
    }

    if (bestTarget) {
      const prompt: InteractionPrompt = {
        active: true,
        prompt: bestTarget.promptText,
        key: bestTarget.promptKey || 'F',
        targetId: bestTarget.id,
        interactionType: bestTarget.type,
        category: bestTarget.category,
        actionName: bestTarget.actionName,
        targetName: bestTarget.targetName,
        secondaryAction: bestTarget.secondaryAction,
        secondaryKey: bestTarget.secondaryKey,
        priority: bestTarget.priority,
        isBlocked: false,
      }
      return { primaryTarget: bestTarget, candidatePrompt: prompt }
    }

    if (bestBlockedTarget && bestBlockedReason) {
      const blockedPrompt: InteractionPrompt = {
        active: true,
        prompt: `${bestBlockedTarget.promptText} (${bestBlockedReason})`,
        key: bestBlockedTarget.promptKey || 'F',
        targetId: bestBlockedTarget.id,
        interactionType: bestBlockedTarget.type,
        category: bestBlockedTarget.category,
        isBlocked: true,
        blockedReason: bestBlockedReason,
      }
      return { primaryTarget: null, candidatePrompt: blockedPrompt }
    }

    return {
      primaryTarget: null,
      candidatePrompt: { active: false, prompt: '', key: '', targetId: '' },
    }
  }
}
