import React from 'react'
import type { CharacterId } from '../game/entities/Player'

interface ControlsOverlayProps {
  isLocked: boolean
  selectedCharacter: CharacterId
  onSelectCharacter: (id: CharacterId) => void
  onRequestLock: () => void
  onResetPosition?: () => void
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  isLocked,
  selectedCharacter,
  onSelectCharacter,
  onRequestLock,
  onResetPosition,
}) => {
  if (isLocked) {
    return (
      <>
        {/* Subtle center reticle */}
        <div className="reticle">
          <div className="reticle-dot" />
        </div>

        {/* Minimalist in-game controls reminder */}
        <div className="controls-hint-bar">
          <span className="character-active-tag">
            Playing as: <strong>{selectedCharacter === 'aarav' ? 'Aarav' : 'Ananya'}</strong>
          </span>
          <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</span>
          <span><kbd>Mouse</kbd> Look</span>
          <span><kbd>Shift</kbd> Sprint</span>
          <span><kbd>Space</kbd> Jump</span>
          <span><kbd>F</kbd> Interact</span>
          <span><kbd>Esc</kbd> Pause</span>
        </div>
      </>
    )
  }

  return (
    <div className="pause-overlay" onClick={onRequestLock}>
      <div className="pause-modal" onClick={e => e.stopPropagation()}>
        <div className="game-badge">M0 PLAYABLE PROTOTYPE</div>
        <h1 className="game-title">CONQUER THE CITY</h1>
        <p className="game-subtitle">Third-Person Open-World Action Adventure • Indian-Inspired Metropolis</p>

        {/* CHARACTER SELECTION SECTION */}
        <div className="character-selection-section">
          <div className="selection-header">
            <span className="selection-title">CHOOSE YOUR PROTAGONIST</span>
            <span className="selection-subtext">Both characters share full progression, movement mechanics, and physics parity</span>
          </div>

          <div className="character-cards-grid">
            {/* AARAV CARD */}
            <div
              className={`character-card ${selectedCharacter === 'aarav' ? 'selected aarav-active' : ''}`}
              onClick={() => onSelectCharacter('aarav')}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') onSelectCharacter('aarav')
              }}
            >
              <div className="char-badge-row">
                <span className="char-gender-badge male">MALE LEAD</span>
                {selectedCharacter === 'aarav' && <span className="char-active-indicator">SELECTED</span>}
              </div>

              <div className="char-portrait-container">
                <img
                  src="/images/characters/aarav-selection.png"
                  alt="Aarav - Tactical Enforcer"
                  className="char-portrait-img"
                  loading="eager"
                  onError={e => {
                    // Fallback to previous render if needed
                    e.currentTarget.src = '/models/aarav_idle_front.png'
                  }}
                />
              </div>

              <div className="char-info">
                <h3 className="char-name">Aarav</h3>
                <span className="char-role">Tactical Enforcer & Driver</span>
                <p className="char-bio">
                  Calculated, steadfast operator with deep ties to the underground automotive network and waterfront district.
                </p>
                <div className="char-stats-mini">
                  <span className="mini-stat">Linen Shirt & Denim</span>
                  <span className="mini-stat">Balanced Stature (1.82m)</span>
                </div>
              </div>
            </div>

            {/* ANANYA CARD */}
            <div
              className={`character-card ${selectedCharacter === 'ananya' ? 'selected ananya-active' : ''}`}
              onClick={() => onSelectCharacter('ananya')}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') onSelectCharacter('ananya')
              }}
            >
              <div className="char-badge-row">
                <span className="char-gender-badge female">FEMALE LEAD</span>
                {selectedCharacter === 'ananya' && <span className="char-active-indicator">SELECTED</span>}
              </div>

              <div className="char-portrait-container">
                <img
                  src="/images/characters/ananya-selection.png"
                  alt="Ananya - Operations Architect"
                  className="char-portrait-img"
                  loading="eager"
                  onError={e => {
                    // Fallback to previous render if needed
                    e.currentTarget.src = '/models/ananya_idle_front.png'
                  }}
                />
              </div>

              <div className="char-info">
                <h3 className="char-name">Ananya</h3>
                <span className="char-role">Street-Smart Operations Architect</span>
                <p className="char-bio">
                  Sharp tactical strategist and logistics mastermind with unmatched street agility and district connections.
                </p>
                <div className="char-stats-mini">
                  <span className="mini-stat">Tactical Olive & Cargo</span>
                  <span className="mini-stat">Agile Stature (1.72m)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS GUIDE GRID */}
        <div className="controls-grid">
          <div className="control-card">
            <span className="control-key">W A S D</span>
            <span className="control-desc">Walk & Strafe</span>
          </div>
          <div className="control-card">
            <span className="control-key">Mouse Move</span>
            <span className="control-desc">Orbit Camera</span>
          </div>
          <div className="control-card">
            <span className="control-key">Shift</span>
            <span className="control-desc">Hold to Sprint</span>
          </div>
          <div className="control-card">
            <span className="control-key">Space</span>
            <span className="control-desc">Jump & Ledge Climb</span>
          </div>
          <div className="control-card">
            <span className="control-key">F</span>
            <span className="control-desc">Hand Gesture</span>
          </div>
          <div className="control-card">
            <span className="control-key">Esc</span>
            <span className="control-desc">Release Mouse</span>
          </div>
        </div>

        <div className="features-note">
          <span>Shared Locomotion & Physics Parity</span> • 
          <span>Intel iGPU Optimized</span> • 
          <span>Single-Model Memory Conservation</span>
        </div>

        <div className="action-buttons">
          <button className="primary-btn pulse-glow" onClick={onRequestLock}>
            PLAY AS {selectedCharacter.toUpperCase()} & LOCK MOUSE
          </button>
          {onResetPosition && (
            <button className="secondary-btn" onClick={onResetPosition}>
              Reset to Spawn
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
