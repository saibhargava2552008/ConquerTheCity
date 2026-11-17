import React from 'react'
import type { EngineStats, PlayerStats, MissionObjective } from '../game/core/Types'

interface HUDProps {
  stats: EngineStats | null
  playerStats: PlayerStats | null
  objectives: MissionObjective[]
}

export const HUD: React.FC<HUDProps> = ({ stats, playerStats, objectives }) => {
  const fps = stats ? stats.fps : 60
  const frameTime = stats ? stats.frameTime : 16.6
  const fpsColor = fps >= 50 ? '#00f5d4' : fps >= 30 ? '#ffd166' : '#ff595e'

  const speedKmh = playerStats ? (playerStats.speed * 3.6).toFixed(1) : '0.0'
  const stateLabel = playerStats ? playerStats.state.toUpperCase() : 'IDLE'
  const staminaPercent = playerStats ? Math.round(playerStats.stamina) : 100

  const posX = playerStats ? playerStats.position.x.toFixed(1) : '0.0'
  const posY = playerStats ? playerStats.position.y.toFixed(1) : '0.0'
  const posZ = playerStats ? playerStats.position.z.toFixed(1) : '0.0'

  return (
    <div className="hud-root">
      {/* Top Left: FPS and Hardware Metrics */}
      <div className="hud-panel hud-perf">
        <div className="fps-row">
          <span className="fps-value" style={{ color: fpsColor }}>
            {fps}
          </span>
          <span className="fps-label">FPS</span>
          <span className="frametime-badge">{frameTime} ms</span>
        </div>
        <div className="perf-subtext">
          <span>Draw Calls: {stats?.drawCalls ?? 0}</span>
          <span>Poly: {((stats?.triangles ?? 0) / 1000).toFixed(1)}k</span>
        </div>
      </div>

      {/* Top Center: Speed and Movement State */}
      <div className="hud-panel hud-status">
        <div className="status-badge" data-state={playerStats?.state ?? 'idle'}>
          {stateLabel}
        </div>
        <div className="speed-display">
          <span className="speed-val">{speedKmh}</span>
          <span className="speed-unit">km/h</span>
        </div>
        <div className="stamina-track">
          <div
            className="stamina-fill"
            style={{
              width: `${staminaPercent}%`,
              backgroundColor: staminaPercent < 25 ? '#ff595e' : '#3a86ff',
            }}
          />
        </div>
      </div>

      {/* Top Right: Mission Objectives */}
      <div className="hud-panel hud-mission">
        <div className="mission-title">CITY RECON</div>
        <ul className="mission-list">
          {objectives.map(obj => (
            <li key={obj.id} className={obj.completed ? 'obj-done' : 'obj-pending'}>
              <span className="obj-checkbox">{obj.completed ? '✓' : '○'}</span>
              <span className="obj-text">{obj.title}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Left: Coordinates and Heading */}
      <div className="hud-panel hud-coords">
        <span>X: {posX}</span>
        <span>Y: {posY}</span>
        <span>Z: {posZ}</span>
        <span className="ground-tag">{playerStats?.isGrounded ? 'GROUNDED' : 'AIR'}</span>
      </div>
    </div>
  )
}
