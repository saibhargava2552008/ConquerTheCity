import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Engine } from '../game/core/Engine'
import type { CharacterId } from '../game/entities/Player'
import type { EngineStats, PlayerStats, MissionObjective, InteractionPrompt, DialogueMessage } from '../game/core/Types'
import { HUD } from './HUD'
import { ControlsOverlay } from './ControlsOverlay'

export const GameCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Engine | null>(null)

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ctc_selected_character')
      if (saved === 'aarav' || saved === 'ananya') {
        return saved
      }
    }
    return 'aarav'
  })

  const [isLocked, setIsLocked] = useState(false)
  const [stats, setStats] = useState<EngineStats | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)
  const [objectives, setObjectives] = useState<MissionObjective[]>([])
  const [interactionPrompt, setInteractionPrompt] = useState<InteractionPrompt | null>(null)
  const [dialogue, setDialogue] = useState<DialogueMessage | null>(null)
  const dialogueTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // Instantiate modular engine with ONLY the selected character (preventing loading both models)
    const engine = new Engine(container, selectedCharacter)
    engineRef.current = engine
    ;(window as unknown as { __CTC_ENGINE__: Engine | null }).__CTC_ENGINE__ = engine

    // Initialize objectives
    setObjectives([...engine.missionSystem.getObjectives()])

    // Subscribe to engine events
    const unsubStats = engine.events.on('stats', newStats => {
      setStats(newStats)
    })

    const unsubPlayer = engine.events.on('playerStats', newPlayerStats => {
      setPlayerStats(newPlayerStats)
    })

    const unsubLock = engine.events.on('pointerLockChange', locked => {
      setIsLocked(locked)
    })

    const unsubObjectives = engine.events.on('objectiveUpdated', objs => {
      setObjectives(objs)
    })

    const unsubPrompt = engine.events.on('interactionPrompt', p => {
      setInteractionPrompt(p.active ? p : null)
    })

    const unsubDialogue = engine.events.on('dialogue', msg => {
      if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current)
      setDialogue(msg)
      if (msg) {
        dialogueTimerRef.current = window.setTimeout(() => {
          setDialogue(null)
        }, (msg.duration || 4.5) * 1000)
      }
    })

    // Listen for 'KeyF' to trigger character hand interaction gesture
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyF' && !e.repeat) {
        engine.player.triggerHandInteraction()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      unsubStats()
      unsubPlayer()
      unsubLock()
      unsubObjectives()
      unsubPrompt()
      unsubDialogue()
      if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current)
      engine.dispose()
      engineRef.current = null
      ;(window as unknown as { __CTC_ENGINE__: Engine | null }).__CTC_ENGINE__ = null
    }
  }, [selectedCharacter])

  const handleSelectCharacter = useCallback((id: CharacterId) => {
    setSelectedCharacter(id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ctc_selected_character', id)
    }
  }, [])

  const handleRequestLock = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.inputManager.requestPointerLock()
    }
  }, [])

  const handleResetPosition = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.playerController.teleport(0, 0, 8)
      engineRef.current.thirdPersonCamera.snapBehindPlayer(
        engineRef.current.player.getPosition(),
        Math.PI
      )
    }
  }, [])

  return (
    <div className="game-wrapper">
      {/* 3D Rendering Canvas Container */}
      <div ref={mountRef} className="canvas-container" />

      {/* Heads-Up Display */}
      <HUD
        stats={stats}
        playerStats={playerStats}
        objectives={objectives}
        interactionPrompt={interactionPrompt}
        dialogue={dialogue}
      />

      {/* Controls and Pause/Entry Overlay */}
      <ControlsOverlay
        isLocked={isLocked}
        selectedCharacter={selectedCharacter}
        onSelectCharacter={handleSelectCharacter}
        onRequestLock={handleRequestLock}
        onResetPosition={handleResetPosition}
      />
    </div>
  )
}
