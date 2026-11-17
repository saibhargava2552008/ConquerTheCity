import type { InputState } from '../core/Types'

export class InputManager {
  private domElement: HTMLElement
  private state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    movementX: 0,
    movementY: 0,
    scrollDelta: 0,
  }

  private isLocked = false
  private onLockStateChange?: (locked: boolean) => void

  private boundOnKeyDown: (e: KeyboardEvent) => void
  private boundOnKeyUp: (e: KeyboardEvent) => void
  private boundOnMouseMove: (e: MouseEvent) => void
  private boundOnWheel: (e: WheelEvent) => void
  private boundOnPointerLockChange: () => void
  private boundOnPointerLockError: (e: Event) => void
  private boundOnClick: () => void

  constructor(domElement: HTMLElement, onLockStateChange?: (locked: boolean) => void) {
    this.domElement = domElement
    this.onLockStateChange = onLockStateChange

    this.boundOnKeyDown = this.onKeyDown.bind(this)
    this.boundOnKeyUp = this.onKeyUp.bind(this)
    this.boundOnMouseMove = this.onMouseMove.bind(this)
    this.boundOnWheel = this.onWheel.bind(this)
    this.boundOnPointerLockChange = this.onPointerLockChange.bind(this)
    this.boundOnPointerLockError = this.onPointerLockError.bind(this)
    this.boundOnClick = this.onClick.bind(this)

    this.attachListeners()
  }

  private attachListeners(): void {
    window.addEventListener('keydown', this.boundOnKeyDown)
    window.addEventListener('keyup', this.boundOnKeyUp)
    window.addEventListener('mousemove', this.boundOnMouseMove)
    window.addEventListener('wheel', this.boundOnWheel, { passive: true })
    document.addEventListener('pointerlockchange', this.boundOnPointerLockChange)
    document.addEventListener('pointerlockerror', this.boundOnPointerLockError)
    this.domElement.addEventListener('click', this.boundOnClick)
  }

  private onClick(): void {
    if (!this.isLocked) {
      this.requestPointerLock()
    }
  }

  public requestPointerLock(): void {
    try {
      this.domElement.requestPointerLock()
    } catch (err) {
      console.warn('Pointer lock request failed:', err)
    }
  }

  public exitPointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
  }

  private onPointerLockChange(): void {
    this.isLocked = document.pointerLockElement === this.domElement
    this.onLockStateChange?.(this.isLocked)
  }

  private onPointerLockError(e: Event): void {
    console.warn('Pointer lock error:', e)
    this.isLocked = false
    this.onLockStateChange?.(false)
  }

  private onKeyDown(e: KeyboardEvent): void {
    // Avoid interfering with browser shortcuts if Alt/Meta are pressed
    if (e.altKey || e.metaKey) return

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.forward = true
        break
      case 'KeyS':
      case 'ArrowDown':
        this.state.backward = true
        break
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = true
        break
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = true
        break
      case 'Space':
        this.state.jump = true
        // Prevent default spacebar page scrolling
        e.preventDefault()
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.sprint = true
        break
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.forward = false
        break
      case 'KeyS':
      case 'ArrowDown':
        this.state.backward = false
        break
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = false
        break
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = false
        break
      case 'Space':
        this.state.jump = false
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.sprint = false
        break
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.isLocked) {
      this.state.movementX += e.movementX || 0
      this.state.movementY += e.movementY || 0
    }
  }

  private onWheel(e: WheelEvent): void {
    if (this.isLocked) {
      this.state.scrollDelta += e.deltaY
    }
  }

  /**
   * Returns current input snapshot and consumes frame-accumulated deltas
   */
  public consumeInput(): InputState {
    const snapshot: InputState = {
      forward: this.state.forward,
      backward: this.state.backward,
      left: this.state.left,
      right: this.state.right,
      jump: this.state.jump,
      sprint: this.state.sprint,
      movementX: this.state.movementX,
      movementY: this.state.movementY,
      scrollDelta: this.state.scrollDelta,
    }

    // Reset accumulated mouse/scroll deltas
    this.state.movementX = 0
    this.state.movementY = 0
    this.state.scrollDelta = 0

    return snapshot
  }

  public getIsLocked(): boolean {
    return this.isLocked
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.boundOnKeyDown)
    window.removeEventListener('keyup', this.boundOnKeyUp)
    window.removeEventListener('mousemove', this.boundOnMouseMove)
    window.removeEventListener('wheel', this.boundOnWheel)
    document.removeEventListener('pointerlockchange', this.boundOnPointerLockChange)
    document.removeEventListener('pointerlockerror', this.boundOnPointerLockError)
    this.domElement.removeEventListener('click', this.boundOnClick)

    if (this.isLocked) {
      this.exitPointerLock()
    }
  }
}
