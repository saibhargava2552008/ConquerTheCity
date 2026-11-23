import * as THREE from 'three'
import type { InteractionManager } from './InteractionManager'
import type { DialogueMessage } from '../core/Types'
import { EventEmitter } from '../core/EventEmitter'

export type WorldInteractionEvents = {
  dialogue: DialogueMessage
  missionTrigger: { triggerId: string; metadata?: any }
}

/**
 * WorldInteractions — Milestone 5
 * Registers authentic world, environmental, commercial, and investigative interactions
 * across all Seaview Town districts.
 */
export class WorldInteractions {
  public readonly events = new EventEmitter<WorldInteractionEvents>()
  private interactionManager: InteractionManager
  private registeredIds: string[] = []

  constructor(interactionManager: InteractionManager) {
    this.interactionManager = interactionManager
    this.registerAll()
  }

  private registerAll(): void {
    // 1. Town Centre: Lighthouse Historical Plaque
    this.registerInteraction({
      id: 'tc_heritage_plaque',
      type: 'examine',
      category: 'world',
      priority: 25,
      position: new THREE.Vector3(2.2, 0.35, -2.0),
      interactionRadius: 2.2,
      actionName: 'Read',
      targetName: 'Lighthouse Historical Plaque',
      promptText: 'Read Lighthouse Historical Plaque',
      promptKey: 'F',
      onInteract: () => {
        this.emitDialogue(
          'Lighthouse Historical Plaque',
          'HERITAGE ARCHIVE',
          'Inaugurated in 1892 by the coastal port trust. The beacon lantern has guided merchant dhows, steam schooners, and local trawlers for over a century.',
          'Town Centre',
          5.0
        )
      },
    })

    // 2. Market District: Harish's Authentic Chai Stall at Stall_Chai_Snacks
    this.registerInteraction({
      id: 'market_chai_stall',
      type: 'commercial',
      category: 'commercial',
      priority: 45,
      position: new THREE.Vector3(44.0, 0.35, 62.0),
      interactionRadius: 2.4,
      actionName: 'Order',
      targetName: 'Masala Chai',
      secondaryAction: 'Ask for Ginger',
      secondaryKey: 'E',
      promptText: 'Order Masala Chai (Harish the Chaiwala)',
      promptKey: 'F',
      onInteract: () => {
        this.emitDialogue(
          'Harish (Chaiwala)',
          'MARKET VENDOR',
          'Garama-garam ginger-cardamom chai brewed in fresh coastal buffalo milk! Hand-crushed spices only, dost!',
          'Market District',
          4.5
        )
        this.events.emit('missionTrigger', { triggerId: 'chai_ordered', metadata: { price: 15 } })
      },
    })

    // 3. Coastal Beach District: Municipal Lifeguard Advisory Board
    this.registerInteraction({
      id: 'beach_lifeguard_notice',
      type: 'examine',
      category: 'world',
      priority: 25,
      position: new THREE.Vector3(-16.5, 0.35, 0.0),
      interactionRadius: 2.2,
      actionName: 'Read',
      targetName: 'Marine Safety Advisory',
      promptText: 'Read Marine Safety Advisory',
      promptKey: 'F',
      onInteract: () => {
        this.emitDialogue(
          'Lifeguard Tower Notice',
          'SAFETY BULLETIN',
          'Notice to Bathers: Seasonal monsoon undercurrents active near the northern groyne. Safe swimming restricted between flags 1 and 4.',
          'Coastal Beach',
          4.5
        )
      },
    })

    // 4. Fishing Harbour: Wharf Cargo Net Hoist Crane
    this.registerInteraction({
      id: 'harbour_cargo_crane',
      type: 'activate',
      category: 'world',
      priority: 30,
      position: new THREE.Vector3(-34.0, 0.40, 92.0),
      interactionRadius: 2.4,
      actionName: 'Inspect',
      targetName: 'Wharf Cargo Crane',
      promptText: 'Inspect Wharf Cargo Crane',
      promptKey: 'F',
      onInteract: () => {
        this.emitDialogue(
          'Crane Control Console',
          'HARBOUR MACHINERY',
          'Heavy-duty diesel hydraulic crane #2. Servicing trawler berths 1-3. Winch cables inspected and certified by port authority this morning.',
          'Fishing Harbour',
          5.0
        )
      },
    })

    // 5. Market District: Community Bulletin Board
    this.registerInteraction({
      id: 'market_lost_item_notice',
      type: 'examine',
      category: 'object',
      priority: 25,
      position: new THREE.Vector3(22.0, 0.35, 30.5),
      interactionRadius: 2.0,
      actionName: 'Inspect',
      targetName: 'Community Notice Board',
      promptText: 'Inspect Community Notice Board',
      promptKey: 'F',
      onInteract: () => {
        this.emitDialogue(
          'Community Bulletin Board',
          'LOST & FOUND',
          'Notice pinned with a brass tack: "Lost vintage brass compass near south beach promenade. Reward offered at Royal Coastal Kirana."',
          'Market District',
          5.0
        )
        this.events.emit('missionTrigger', { triggerId: 'compass_clue_discovered' })
      },
    })
  }

  private registerInteraction(target: any): void {
    this.interactionManager.register(target)
    this.registeredIds.push(target.id)
  }

  private emitDialogue(
    speaker: string,
    title: string,
    text: string,
    district: string,
    duration: number
  ): void {
    const msg: DialogueMessage = {
      speaker,
      title,
      text,
      district,
      duration,
    }
    this.events.emit('dialogue', msg)
  }

  public dispose(): void {
    for (const id of this.registeredIds) {
      this.interactionManager.unregister(id)
    }
    this.registeredIds = []
    this.events.removeAllListeners()
  }
}
