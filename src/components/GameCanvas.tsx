import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Engine } from '../game/core/Engine'
import type { EngineStats, PlayerStats, MissionObjective } from '../game/core/Types'
import { HUD } from './HUD'
import { ControlsOverlay } from './ControlsOverlay'

export const GameCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Engine | null>(null)

  const [isLocked, setIsLocked] = useState(false)
  const [stats, setStats] = useState<EngineStats | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)
  const [objectives, setObjectives] = useState<MissionObjective[]>([])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // Instantiate modular engine
    const engine = new Engine(container)
    engineRef.current = engine

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

    return () => {
      unsubStats()
      unsubPlayer()
      unsubLock()
      unsubObjectives()
      engine.dispose()
      engineRef.current = null
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
      <HUD stats={stats} playerStats={playerStats} objectives={objectives} />

      {/* Controls and Pause/Entry Overlay */}
      <ControlsOverlay
        isLocked={isLocked}
        onRequestLock={handleRequestLock}
        onResetPosition={handleResetPosition}
      />
    </div>
  )
}
