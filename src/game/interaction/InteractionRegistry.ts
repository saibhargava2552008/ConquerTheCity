import type { IInteractionTarget, InteractionCategory, InteractionType } from './InteractionTypes'

/**
 * InteractionRegistry — Milestone 5
 * Centralized, zero-allocation repository for all registered interactable targets in the open world.
 */
export class InteractionRegistry {
  private targets = new Map<string, IInteractionTarget>()
  private triggeredOneTimes = new Set<string>()

  public register(target: IInteractionTarget): void {
    // If priority is not explicitly set, assign default priority based on type/category
    if (target.priority === undefined) {
      target.priority = this.inferPriority(target)
    }
    if (target.category === undefined) {
      target.category = this.inferCategory(target.type)
    }
    this.targets.set(target.id, target)
  }

  public unregister(id: string): boolean {
    return this.targets.delete(id)
  }

  public get(id: string): IInteractionTarget | undefined {
    return this.targets.get(id)
  }

  public has(id: string): boolean {
    return this.targets.has(id)
  }

  public getAll(): IInteractionTarget[] {
    return Array.from(this.targets.values())
  }

  public getByCategory(category: InteractionCategory): IInteractionTarget[] {
    const result: IInteractionTarget[] = []
    for (const target of this.targets.values()) {
      if (target.category === category) {
        result.push(target)
      }
    }
    return result
  }

  public getByType(type: InteractionType): IInteractionTarget[] {
    const result: IInteractionTarget[] = []
    for (const target of this.targets.values()) {
      if (target.type === type) {
        result.push(target)
      }
    }
    return result
  }

  public count(): number {
    return this.targets.size
  }

  public markTriggered(id: string): void {
    this.triggeredOneTimes.add(id)
    const target = this.targets.get(id)
    if (target) {
      target.hasTriggered = true
    }
  }

  public hasTriggered(id: string): boolean {
    return this.triggeredOneTimes.has(id)
  }

  public resetTriggered(id: string): void {
    this.triggeredOneTimes.delete(id)
    const target = this.targets.get(id)
    if (target) {
      target.hasTriggered = false
    }
  }

  public clear(): void {
    this.targets.clear()
    this.triggeredOneTimes.clear()
  }

  private inferCategory(type: InteractionType): InteractionCategory {
    switch (type) {
      case 'vehicle_enter':
      case 'vehicle_exit':
        return 'vehicle'
      case 'npc_talk':
      case 'bench_sit':
        return 'npc'
      case 'door_open':
        return 'world'
      case 'commercial':
        return 'commercial'
      case 'examine':
      case 'pickup':
        return 'object'
      default:
        return 'world'
    }
  }

  private inferPriority(target: IInteractionTarget): number {
    switch (target.type) {
      case 'vehicle_exit':
        return 100
      case 'vehicle_enter':
        return 80
      case 'door_open':
        return 70
      case 'npc_talk':
        return 50
      case 'commercial':
        return 40
      case 'examine':
      case 'pickup':
        return 30
      case 'bench_sit':
        return 25
      default:
        return 20
    }
  }
}
