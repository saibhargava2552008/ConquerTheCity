import React from 'react'

interface ControlsOverlayProps {
  isLocked: boolean
  onRequestLock: () => void
  onResetPosition?: () => void
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  isLocked,
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
          <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</span>
          <span><kbd>Mouse</kbd> Look</span>
          <span><kbd>Shift</kbd> Sprint</span>
          <span><kbd>Space</kbd> Jump</span>
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
        <p className="game-subtitle">Third-Person Open-World Action Adventure</p>

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
            <span className="control-desc">Jump & Climb</span>
          </div>
          <div className="control-card">
            <span className="control-key">Mouse Wheel</span>
            <span className="control-desc">Zoom Camera</span>
          </div>
          <div className="control-card">
            <span className="control-key">Esc</span>
            <span className="control-desc">Release Mouse</span>
          </div>
        </div>

        <div className="features-note">
          <span>Smooth Acceleration & Deceleration</span> • 
          <span>Wall Sliding & Step-Up Collisions</span> • 
          <span>Intel iGPU Optimized</span>
        </div>

        <div className="action-buttons">
          <button className="primary-btn pulse-glow" onClick={onRequestLock}>
            CLICK TO PLAY & LOCK MOUSE
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
