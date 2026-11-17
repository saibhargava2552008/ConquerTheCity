import * as THREE from 'three'

// Mock minimal DOM for Node test runner
if (typeof document === 'undefined') {
  const mockCtx = new Proxy({}, {
    get: (_target, prop) => {
      if (typeof prop === 'string') return () => {}
      return undefined
    }
  })
  const mockCanvas = {
    getContext: () => mockCtx,
    width: 256,
    height: 256,
  }
  class MockDocument extends EventTarget {
    public pointerLockElement: HTMLElement | null = null
    public hidden = false
    public visibilityState = 'visible'
    createElement(tag: string) {
      if (tag === 'canvas') return mockCanvas
      return {}
    }
    exitPointerLock() {
      this.pointerLockElement = null
    }
  }
  class MockWindow extends EventTarget {}
  ;(globalThis as unknown as { document: unknown }).document = new MockDocument()
  ;(globalThis as unknown as { window: unknown }).window = new MockWindow()
}

import { CollisionSystem } from './CollisionSystem'
import { Player } from '../entities/Player'
import { PlayerController } from '../entities/PlayerController'
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera'
import type { InputState } from '../core/Types'

function createInput(overrides: Partial<InputState> = {}): InputState {
  return {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    movementX: 0,
    movementY: 0,
    scrollDelta: 0,
    ...overrides,
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`)
  }
}

console.log('=== RUNNING CONQUER THE CITY TEST SUITE ===')

// 1. Camera-Relative Movement, Reversed Camera, Strafing, Pitch Independence & Diagonal Normalization
{
  const col = new CollisionSystem()
  const player = new Player()
  const ctrl = new PlayerController(player, col)

  // 1a. Camera positioned at (0, 5, 10) looking at (0, 1.5, 0) -> horizontal forward is -Z, right is +X
  const cam1 = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  cam1.position.set(0, 5, 10)
  cam1.lookAt(0, 1.5, 0)

  // W moves forward in horizontal camera direction (-Z)
  ctrl.teleport(0, 0, 0)
  let stats = ctrl.update(createInput({ forward: true }), cam1, 0.05)
  assert(stats.velocity.z < -0.1, 'Camera looking -Z: W must move along negative Z')
  assert(Math.abs(stats.velocity.x) < 0.001, 'Camera looking -Z: W must have zero X velocity')
  assert(stats.velocity.y === 0, 'Camera pitch must not cause vertical velocity')

  // S moves backward (+Z)
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ backward: true }), cam1, 0.05)
  assert(stats.velocity.z > 0.1, 'Camera looking -Z: S must move along positive Z')
  assert(stats.velocity.y === 0, 'S must have zero vertical velocity')

  // D moves right (+X)
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ right: true }), cam1, 0.05)
  assert(stats.velocity.x > 0.1, 'Camera looking -Z: D must move along positive X (right)')

  // A moves left (-X)
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ left: true }), cam1, 0.05)
  assert(stats.velocity.x < -0.1, 'Camera looking -Z: A must move along negative X (left)')

  // 1b. Reversed Camera Direction: Camera at (0, 5, -10) looking at (0, 1.5, 0) -> horizontal forward is +Z
  const camReversed = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camReversed.position.set(0, 5, -10)
  camReversed.lookAt(0, 1.5, 0)

  // W must move forward in the camera direction (+Z)
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ forward: true }), camReversed, 0.05)
  assert(stats.velocity.z > 0.1, 'Reversed Camera looking +Z: W must move along positive Z')
  assert(Math.abs(stats.velocity.x) < 0.001, 'Reversed Camera: W must have zero X velocity')

  // S must move backward (-Z)
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ backward: true }), camReversed, 0.05)
  assert(stats.velocity.z < -0.1, 'Reversed Camera looking +Z: S must move along negative Z')

  // D must move right (-X when looking +Z)
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ right: true }), camReversed, 0.05)
  assert(stats.velocity.x < -0.1, 'Reversed Camera: D must move right (negative X)')

  // A must move left (+X when looking +Z)
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ left: true }), camReversed, 0.05)
  assert(stats.velocity.x > 0.1, 'Reversed Camera: A must move left (positive X)')

  // 1c. Camera Pitch Independence: Steep Pitch (Looking from high above at y = 25)
  const camSteepPitch = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camSteepPitch.position.set(0, 25, 10)
  camSteepPitch.lookAt(0, 1.5, 0)

  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ forward: true }), camSteepPitch, 0.05)
  assert(stats.velocity.z < -0.1, 'Steep pitch: W must still move horizontally along -Z')
  assert(stats.velocity.y === 0, 'Steep camera pitch must not cause any vertical velocity')

  // 1d. Diagonal Normalization: W + D must have identical steady speed to W alone
  ctrl.teleport(0, 0, 0)
  for (let i = 0; i < 40; i++) {
    stats = ctrl.update(createInput({ forward: true, right: true }), cam1, 0.016)
  }
  const diagonalSpeed = Math.hypot(stats.velocity.x, stats.velocity.z)
  assert(
    Math.abs(diagonalSpeed - ctrl.walkSpeed) < 0.2,
    `Diagonal speed (${diagonalSpeed.toFixed(2)}) must be normalized to walk speed (${ctrl.walkSpeed})`
  )
  assert(stats.velocity.y === 0, 'Diagonal movement must have zero vertical velocity')

  console.log('✔ 1. Camera-relative movement, reversed camera, strafing, pitch independence & diagonal normalization passed')
}

// 2. Camera-Relative Movement at Arbitrary Lateral Angles
{
  const col = new CollisionSystem()
  const player = new Player()
  const ctrl = new PlayerController(player, col)

  // Camera on +X axis looking at origin -> horizontal forward is -X, right is -Z
  const camEast = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camEast.position.set(10, 3, 0)
  camEast.lookAt(0, 1.5, 0)

  // W should move towards -X
  ctrl.teleport(0, 0, 0)
  let stats = ctrl.update(createInput({ forward: true }), camEast, 0.05)
  assert(stats.velocity.x < -0.1, 'Camera looking -X: W should move along negative X')
  assert(Math.abs(stats.velocity.z) < 0.05, 'Camera looking -X: W should have near-zero Z velocity')
  assert(stats.velocity.y === 0, 'W must have zero vertical velocity')

  // S should move towards +X
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ backward: true }), camEast, 0.05)
  assert(stats.velocity.x > 0.1, 'Camera looking -X: S should move along positive X')

  // D should move towards -Z
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ right: true }), camEast, 0.05)
  assert(stats.velocity.z < -0.1, 'Camera looking -X: D should move along negative Z (right)')

  // A should move towards +Z
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ left: true }), camEast, 0.05)
  assert(stats.velocity.z > 0.1, 'Camera looking -X: A should move along positive Z (left)')

  console.log('✔ 2. Camera-relative WASD at lateral angles passed')
}

// 3. Direction Reversal Braking Responsiveness
{
  const col = new CollisionSystem()
  const player = new Player()
  const ctrl = new PlayerController(player, col)

  // Accelerate forward to full speed
  for (let i = 0; i < 30; i++) {
    ctrl.update(createInput({ forward: true }), 0, 0.016)
  }
  const forwardVel = ctrl.velocity.z
  assert(forwardVel < -4.5, `Player should be moving forward fast (got ${forwardVel})`)

  // Reverse direction: press backward (S) for 4 frames
  for (let i = 0; i < 4; i++) {
    ctrl.update(createInput({ backward: true }), 0, 0.016)
  }
  assert(
    ctrl.velocity.z > forwardVel + 2.0,
    `Player should brake rapidly when reversing (went from ${forwardVel} to ${ctrl.velocity.z})`
  )
  console.log('✔ 3. Direction reversal braking responsiveness passed')
}

// 4. Sprint & Stamina Test
{
  const col = new CollisionSystem()
  const player = new Player()
  const ctrl = new PlayerController(player, col)

  // Sprinting forward
  let stats = ctrl.update(createInput({ forward: true, sprint: true }), 0, 0.05)
  for (let i = 0; i < 30; i++) {
    stats = ctrl.update(createInput({ forward: true, sprint: true }), 0, 0.016)
  }
  assert(stats.speed > ctrl.walkSpeed, 'Sprint speed should exceed walk speed')
  assert(stats.stamina < 100, 'Stamina should deplete during sprint')
  assert(stats.state === 'sprinting', 'State should be sprinting')

  // Release sprint: walk and recover stamina
  for (let i = 0; i < 30; i++) {
    stats = ctrl.update(createInput({ forward: true, sprint: false }), 0, 0.016)
  }
  assert(stats.stamina > 50, 'Stamina should recover when not sprinting')
  console.log('✔ 4. Sprint & Stamina mechanics passed')
}

// 5. Jump Kinematics & Coyote Time & Grounding
{
  const col = new CollisionSystem()
  const player = new Player()
  const ctrl = new PlayerController(player, col)

  assert(ctrl.isGrounded, 'Player should start grounded')

  // Trigger jump
  let stats = ctrl.update(createInput({ jump: true }), 0, 0.016)
  assert(!stats.isGrounded, 'Player should leave the ground on jump')
  assert(stats.state === 'jumping', 'State should be jumping')

  // Advance simulation through apex until landing
  let apexReached = false
  let maxHeight = 0
  for (let i = 0; i < 100; i++) {
    stats = ctrl.update(createInput(), 0, 0.016)
    if (stats.position.y > maxHeight) maxHeight = stats.position.y
    if (stats.state === 'falling') apexReached = true
    if (stats.isGrounded) break
  }

  assert(apexReached, 'Player should transition to falling state at jump apex')
  assert(maxHeight > 1.2, `Jump apex height (${maxHeight.toFixed(2)}) should reach > 1.2m`)
  assert(stats.isGrounded, 'Player should land back on ground')
  assert(stats.position.y === 0, 'Landed position Y should be 0')
  console.log('✔ 5. Jump kinematics and landing passed')
}

// 6. Character Turning: Genuine Continuous Rotation Crossing +PI to -PI and -PI to +PI
{
  const col = new CollisionSystem()
  const player = new Player()
  const ctrl = new PlayerController(player, col)

  // PART A: Test crossing from +PI to -PI (counter-clockwise across 180 deg)
  // Set initial facing angle just below +PI (~ +177.6 deg)
  ctrl.teleport(0, 0, 0)
  ctrl['facingAngle'] = 3.10
  ctrl['lastFacingAngle'] = 3.10

  let maxObservedTurnRate = 0
  let crossedBoundary = false

  for (let i = 0; i < 25; i++) {
    // Maintain forward velocity angled slightly negative X (targetFacing ~ -3.12 rad)
    ctrl.velocity.set(-0.1, 0, -5.0)
    ctrl.update(createInput({ forward: true }), 0, 0.016)
    const turnRate = Math.abs(ctrl['turnRate'])
    if (turnRate > maxObservedTurnRate) maxObservedTurnRate = turnRate

    // Check if angle crossed +PI into negative space
    if (ctrl['facingAngle'] < 0) {
      crossedBoundary = true
    }

    // Verify visual tilt of the player mesh never snaps or exceeds safe bounds
    const modelTilt = Math.abs(player.mesh.children[0]?.rotation.z ?? 0)
    assert(modelTilt <= 0.25, `Visual tilt (${modelTilt.toFixed(3)}) must stay bounded`)
  }

  assert(crossedBoundary, 'Facing angle must cross +PI to -PI boundary')
  assert(
    maxObservedTurnRate < 12.0,
    `Turn rate (${maxObservedTurnRate.toFixed(2)} rad/s) must not spike when crossing +PI to -PI`
  )

  // PART B: Test crossing from -PI to +PI (clockwise across 180 deg)
  ctrl.teleport(0, 0, 0)
  ctrl['facingAngle'] = -3.10
  ctrl['lastFacingAngle'] = -3.10

  maxObservedTurnRate = 0
  crossedBoundary = false

  for (let i = 0; i < 25; i++) {
    // Maintain forward velocity angled slightly positive X (targetFacing ~ +3.12 rad)
    ctrl.velocity.set(0.1, 0, -5.0)
    ctrl.update(createInput({ forward: true }), 0, 0.016)
    const turnRate = Math.abs(ctrl['turnRate'])
    if (turnRate > maxObservedTurnRate) maxObservedTurnRate = turnRate

    if (ctrl['facingAngle'] > 0) {
      crossedBoundary = true
    }

    const modelTilt = Math.abs(player.mesh.children[0]?.rotation.z ?? 0)
    assert(modelTilt <= 0.25, `Visual tilt (${modelTilt.toFixed(3)}) must stay bounded`)
  }

  assert(crossedBoundary, 'Facing angle must cross -PI to +PI boundary')
  assert(
    maxObservedTurnRate < 12.0,
    `Turn rate (${maxObservedTurnRate.toFixed(2)} rad/s) must not spike when crossing -PI to +PI`
  )
  console.log('✔ 6. Character turning crossing +PI <-> -PI without spikes or tilt snaps passed')
}

// 7. InputManager Event Handlers: Actual Event Dispatching (blur, visibilitychange, pointerlockchange)
{
  class MockDOMElement extends EventTarget {
    requestPointerLock() {}
  }
  const mockContainer = new MockDOMElement() as unknown as HTMLElement

  class MockWindow extends EventTarget {}
  class MockDocument extends EventTarget {
    public pointerLockElement: HTMLElement | null = null
    public hidden = false
    public visibilityState = 'visible'
    exitPointerLock() {
      this.pointerLockElement = null
    }
  }

  const mockWindow = new MockWindow()
  const mockDoc = new MockDocument()

  // Event factory helpers for Node test environment
  const createKeyEvent = (type: string, code: string) => {
    const e = new Event(type)
    Object.assign(e, { code })
    return e
  }
  const createMouseEvent = (type: string, movementX: number, movementY: number) => {
    const e = new Event(type)
    Object.assign(e, { movementX, movementY })
    return e
  }
  const createWheelEvent = (type: string, deltaY: number) => {
    const e = new Event(type)
    Object.assign(e, { deltaY })
    return e
  }

  // Attach mock globals
  const origWindow = (globalThis as unknown as { window: unknown }).window
  const origDoc = (globalThis as unknown as { document: unknown }).document
  ;(globalThis as unknown as { window: unknown }).window = mockWindow
  ;(globalThis as unknown as { document: unknown }).document = mockDoc

  const { InputManager } = await import('../input/InputManager')
  const inputMgr = new InputManager(mockContainer)

  // 7a. Test keydown and mouse movement
  mockWindow.dispatchEvent(createKeyEvent('keydown', 'KeyW'))
  mockWindow.dispatchEvent(createKeyEvent('keydown', 'ShiftLeft'))
  mockWindow.dispatchEvent(createKeyEvent('keydown', 'Space'))
  mockDoc.pointerLockElement = mockContainer
  mockDoc.dispatchEvent(new Event('pointerlockchange'))

  // Dispatch mouse movement when locked
  mockWindow.dispatchEvent(createMouseEvent('mousemove', 35, -15))
  mockWindow.dispatchEvent(createWheelEvent('wheel', 120))

  let snapshot = inputMgr.consumeInput()
  assert(snapshot.forward, 'KeyW should be registered')
  assert(snapshot.sprint, 'ShiftLeft should be registered')
  assert(snapshot.jump, 'Space should be registered')

  // 7b. Test window 'blur' event
  mockWindow.dispatchEvent(createKeyEvent('keydown', 'KeyW'))
  mockWindow.dispatchEvent(createKeyEvent('keydown', 'KeyD'))
  mockWindow.dispatchEvent(createMouseEvent('mousemove', 20, 10))

  // Dispatch actual window blur
  mockWindow.dispatchEvent(new Event('blur'))

  snapshot = inputMgr.consumeInput()
  assert(!snapshot.forward && !snapshot.right, 'All keys must be reset on blur event')
  assert(snapshot.movementX === 0 && snapshot.movementY === 0, 'Mouse deltas must be reset on blur')

  // 7c. Test document 'visibilitychange' event
  mockWindow.dispatchEvent(createKeyEvent('keydown', 'KeyA'))
  mockDoc.hidden = true
  mockDoc.visibilityState = 'hidden'
  mockDoc.dispatchEvent(new Event('visibilitychange'))

  snapshot = inputMgr.consumeInput()
  assert(!snapshot.left, 'Held keys must be reset on visibilitychange (hidden)')

  // 7d. Test document 'pointerlockchange' unlock
  mockWindow.dispatchEvent(createKeyEvent('keydown', 'KeyS'))
  mockDoc.pointerLockElement = null // unlock
  mockDoc.dispatchEvent(new Event('pointerlockchange'))

  snapshot = inputMgr.consumeInput()
  assert(!snapshot.backward, 'Held keys must be reset on pointerlockchange release')

  // 7e. Test dispose removes all event listeners
  inputMgr.dispose()

  // After dispose, dispatching events must not update inputMgr state
  mockWindow.dispatchEvent(createKeyEvent('keydown', 'KeyW'))
  snapshot = inputMgr.consumeInput()
  assert(!snapshot.forward, 'Listeners must be detached after dispose()')

  // Restore globals
  ;(globalThis as unknown as { window: unknown }).window = origWindow
  ;(globalThis as unknown as { document: unknown }).document = origDoc

  console.log('✔ 7. InputManager actual event dispatching (blur, visibility, pointerlock) and cleanup passed')
}

// 8. Expanded Collision Tests: Corners, Adjacent Walls, Overlapping Colliders, High-Speed Tunneling
{
  const col = new CollisionSystem()

  // 8a. High-Speed Movement into Thin Obstacle (Tunneling Test)
  // Thin wall at X in [10, 10.5], Z in [0, 20]
  const thinWall = new THREE.Box3(
    new THREE.Vector3(10, 0, 0),
    new THREE.Vector3(10.5, 10, 20)
  )
  col.addCollider({ id: 'thin_wall', box: thinWall, isStatic: true })

  const player = new Player()
  const ctrl = new PlayerController(player, col)

  // Start 0.2m in front of the thin wall (X = 9.4, radius = 0.4 -> right edge at 9.8)
  ctrl.teleport(9.4, 0, 10)
  // Super high speed forward (+X) velocity: 30 m/s for 1 frame (deltaX = 1.5m, would end up at 10.9)
  ctrl.velocity.set(30, 0, 0)
  ctrl.update(createInput(), 0, 0.05)

  assert(
    ctrl.position.x <= 9.6,
    `Player must not tunnel through thin obstacle at high speed (got X = ${ctrl.position.x.toFixed(3)})`
  )
  assert(
    ctrl.velocity.x === 0,
    'High speed collision must zero forward velocity'
  )

  // 8b. Building Corners: Diagonal Movement into an External Vertex
  col.clear()
  // Corner at (10, 10) of box [10, 20] x [10, 20]
  const cornerBldg = new THREE.Box3(
    new THREE.Vector3(10, 0, 10),
    new THREE.Vector3(20, 10, 20)
  )
  col.addCollider({ id: 'corner_bldg', box: cornerBldg, isStatic: true })

  // Position player diagonally adjacent to corner at (9.4, 9.4)
  ctrl.teleport(9.4, 0, 9.4)
  // Run diagonally into corner (+X, +Z)
  for (let i = 0; i < 20; i++) {
    ctrl.update(createInput({ right: true, backward: true }), 0, 0.016)
  }
  const isCornerBlocked = col.isPositionBlocked(ctrl.position.x, 0, ctrl.position.z, ctrl.radius, ctrl.height)
  assert(!isCornerBlocked, 'Player must never penetrate inside corner building')
  assert(
    ctrl.position.x <= 9.601 || ctrl.position.z <= 9.601,
    `Player must remain strictly outside one of the exterior faces while sliding around corner (X=${ctrl.position.x.toFixed(3)}, Z=${ctrl.position.z.toFixed(3)})`
  )

  // 8c. Adjacent Walls with a Seam: Smooth Sliding across Seams
  col.clear()
  // Building A: X in [0, 10], Z in [20, 30]
  // Building B: X in [10, 20], Z in [20, 30] (Seam at X = 10, collinear front face at Z = 20)
  const bldgA = new THREE.Box3(new THREE.Vector3(0, 0, 20), new THREE.Vector3(10, 10, 30))
  const bldgB = new THREE.Box3(new THREE.Vector3(10, 0, 20), new THREE.Vector3(20, 10, 30))
  col.addCollider({ id: 'bldg_a', box: bldgA, isStatic: true })
  col.addCollider({ id: 'bldg_b', box: bldgB, isStatic: true })

  // Place player touching front face of Building A (X = 7, Z = 19.598)
  ctrl.teleport(7, 0, 19.598)
  // Walk along face (+X) into and across the seam at X = 10
  for (let i = 0; i < 60; i++) {
    ctrl.update(createInput({ right: true }), 0, 0.016)
  }
  assert(
    ctrl.position.x > 11.0,
    `Player should slide smoothly across adjacent wall seam into Building B territory (got X = ${ctrl.position.x.toFixed(2)})`
  )
  assert(
    ctrl.position.z <= 19.601,
    `Player must stay outside the collinear front wall face (got Z = ${ctrl.position.z.toFixed(3)})`
  )

  // 8d. Overlapping Colliders: Outer Boundary Respected
  col.clear()
  // Box 1: [30, 40] x [0, 10]
  // Box 2: [35, 45] x [0, 10] (Overlaps Box 1)
  const overlap1 = new THREE.Box3(new THREE.Vector3(30, 0, 0), new THREE.Vector3(40, 10, 10))
  const overlap2 = new THREE.Box3(new THREE.Vector3(35, 0, 0), new THREE.Vector3(45, 10, 10))
  col.addCollider({ id: 'overlap_1', box: overlap1, isStatic: true })
  col.addCollider({ id: 'overlap_2', box: overlap2, isStatic: true })

  ctrl.teleport(28, 0, 5)
  for (let i = 0; i < 30; i++) {
    ctrl.update(createInput({ right: true }), 0, 0.016)
  }
  assert(
    ctrl.position.x <= 29.601,
    `Player must stop at the outermost surface of overlapping colliders (got X = ${ctrl.position.x.toFixed(3)})`
  )

  console.log('✔ 8. Expanded collisions (corners, seams, overlaps, high-speed tunneling) passed')
}

// 9. De-Penetration Safety: Never Pushes Player into Another Collider
{
  const col = new CollisionSystem()

  // Create an alleyway scenario:
  // Wall Left:  X in [10, 20], Z in [10, 30]
  // Wall Right: X in [7, 9.4], Z in [10, 30]
  // Gap along X is only 0.6m (between 9.4 and 10), but player diameter is 0.8m!
  // At Z < 10, space is completely open (street).
  const wallLeft = new THREE.Box3(new THREE.Vector3(10, 0, 10), new THREE.Vector3(20, 10, 30))
  const wallRight = new THREE.Box3(new THREE.Vector3(7, 0, 10), new THREE.Vector3(9.4, 10, 30))
  col.addCollider({ id: 'alley_left', box: wallLeft, isStatic: true })
  col.addCollider({ id: 'alley_right', box: wallRight, isStatic: true })

  const player = new Player()
  const ctrl = new PlayerController(player, col)

  // Force artificial penetration into Wall Left at X = 10.1, Z = 10.2 (near the mouth of the alley)
  ctrl.position.set(10.1, 0, 10.2)
  ctrl.velocity.set(0, 0, 0)

  // Run resolution
  col.resolveHorizontalMovement(ctrl.position, ctrl.velocity, ctrl.radius, ctrl.height, 0.016)

  // Check that player is NOT intersecting Wall Left AND NOT intersecting Wall Right!
  const isLeftBlocked = col.isPositionBlocked(ctrl.position.x, 0, ctrl.position.z, ctrl.radius, ctrl.height, 'alley_right')
  const isRightBlocked = col.isPositionBlocked(ctrl.position.x, 0, ctrl.position.z, ctrl.radius, ctrl.height, 'alley_left')

  assert(!isLeftBlocked, 'De-penetration must not leave player inside Wall Left')
  assert(!isRightBlocked, 'De-penetration must NEVER push player inside Wall Right')

  // Total blocked check across all obstacles
  const isAnyBlocked = col.isPositionBlocked(ctrl.position.x, 0, ctrl.position.z, ctrl.radius, ctrl.height)
  assert(!isAnyBlocked, 'Player must be pushed into valid, unblocked free space')

  console.log('✔ 9. De-penetration safety (never pushing into another collider) passed')
}

// 10. ThirdPersonCamera Rotation & Clamping & Zoom
{
  const col = new CollisionSystem()
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  const tpCam = new ThirdPersonCamera(cam, col)

  // Mouse orbit
  tpCam.handleInput(100, 50, 0)
  assert(tpCam.yaw !== 0, 'Camera yaw should change with mouse X')
  assert(tpCam.pitch > 0.25, 'Camera pitch should change with mouse Y')

  // Pitch clamping: large upward pitch
  tpCam.handleInput(0, 10000, 0)
  assert(
    tpCam.pitch <= 1.3,
    `Pitch should be clamped at max (~1.3, got ${tpCam.pitch})`
  )

  // Pitch clamping: large downward pitch
  tpCam.handleInput(0, -20000, 0)
  assert(
    tpCam.pitch >= -0.2,
    `Pitch should be clamped at min (~-0.2, got ${tpCam.pitch})`
  )

  // Zoom distance clamping
  tpCam.handleInput(0, 0, 50000)
  assert(tpCam.distance <= 9.0, 'Distance should be clamped at max 9.0')
  tpCam.handleInput(0, 0, -100000)
  assert(tpCam.distance >= 2.0, 'Distance should be clamped at min 2.0')

  console.log('✔ 10. Camera orbit, pitch clamping, and zoom passed')
}

// 11. Lifecycle Cleanup: EventBus, MaterialFactory, Player, and InputManager Disposals
{
  // 11a. EventEmitter registration, unsubscription, and removeAllListeners
  const { EventEmitter } = await import('../core/EventEmitter')
  type TestEvents = { ping: string; score: number }
  const bus = new EventEmitter<TestEvents>()

  let pingCount = 0
  const unsubPing = bus.on('ping', msg => {
    assert(msg === 'hello', 'Payload must match')
    pingCount++
  })

  bus.emit('ping', 'hello')
  assert(pingCount === 1, 'Ping listener should be called')

  unsubPing()
  bus.emit('ping', 'hello')
  assert(pingCount === 1, 'Ping listener must not be called after unsub()')

  let scoreCount = 0
  bus.on('score', () => {
    scoreCount++
  })
  bus.emit('score', 100)
  assert(scoreCount === 1, 'Score listener should be called')

  bus.removeAllListeners()
  bus.emit('score', 200)
  assert(scoreCount === 1, 'All listeners must be purged after removeAllListeners()')

  // 11b. MaterialFactory & CollisionSystem & Player Disposals
  const { MaterialFactory } = await import('../world/MaterialFactory')
  const matFactory = new MaterialFactory()
  // Generate cached materials and dispose
  matFactory.getColorMaterial(0xff0000)
  matFactory.getColorMaterial(0x00ff00)
  matFactory.dispose()
  assert(matFactory['textures'].length === 0, 'All textures must be disposed and cleared')
  assert(matFactory['materials'].size === 0, 'All materials must be disposed and cleared')

  const player = new Player()
  player.dispose()
  assert(player['isDisposed'], 'Player entity must be marked as disposed')

  console.log('✔ 11. Comprehensive lifecycle cleanup (EventBus, materials, player, colliders) passed')
}

// 12. Spawn-Area Initialization, Camera Synchronization, 360 Rotation, Round-Trip Travel & Collider Regression
{
  const { CityBuilder } = await import('../world/CityBuilder')
  const { MaterialFactory } = await import('../world/MaterialFactory')

  const scene = new THREE.Scene()
  const col = new CollisionSystem()
  const mat = new MaterialFactory()
  const city = new CityBuilder(scene, mat, col)
  city.build()

  // Verify full collider set was built (50+ colliders)
  const colliders = col.getColliders()
  assert(colliders.length > 50, 'City colliders should be populated')

  // Verify that distant obstacles (Crate_Step1 at X=-12, Lamp_Pole_9 at X=-20) do NOT overlap X at spawn (X=0)
  const crate = colliders.find(c => c.id === 'Crate_Step1')
  assert(!!crate, 'Crate_Step1 must exist in world')
  const pole = colliders.find(c => c.id === 'Lamp_Pole_9')
  assert(!!pole, 'Lamp_Pole_9 must exist in world')

  const spawnX = 0
  const halfW = 0.4
  const skin = 0.002
  const crateOverlapsX =
    spawnX + halfW - skin > crate!.box.min.x && spawnX - halfW + skin < crate!.box.max.x
  assert(!crateOverlapsX, 'Crate_Step1 (X=-12) must NOT have horizontal overlap with player at X=0')

  const poleOverlapsX =
    spawnX + halfW - skin > pole!.box.min.x && spawnX - halfW + skin < pole!.box.max.x
  assert(!poleOverlapsX, 'Lamp_Pole_9 (X=-20) must NOT have horizontal overlap with player at X=0')

  // 12a. Spawn Initialization & Grounding
  const player = new Player()
  player.setPosition(0, 0, 8)
  const ctrl = new PlayerController(player, col)

  const cam = new THREE.PerspectiveCamera(65, 1, 0.1, 400)
  const tpCam = new ThirdPersonCamera(cam, col)
  tpCam.snapBehindPlayer(ctrl.position, Math.PI)

  // Verify player is grounded at y = 0 from frame 0
  assert(ctrl.isGrounded, 'Player must be grounded immediately upon spawning')
  assert(ctrl.position.y === 0, 'Player feet must be at ground level (y = 0)')
  const groundH = col.getGroundHeight(ctrl.position.x, ctrl.position.y, ctrl.position.z, ctrl.radius)
  assert(groundH === 0, 'Ground height at spawn (0, 0, 8) must be 0')

  // Immediate Jump check on frame 0
  const jumpStats = ctrl.update(createInput({ jump: true }), cam, 0.016)
  assert(!jumpStats.isGrounded, 'Player must leave the ground immediately on jump')
  assert(jumpStats.state === 'jumping', 'Player state must be jumping on frame 0')
  assert(jumpStats.position.y > 0, 'Player position Y should increase above ground on jump')

  // Reset to spawn
  ctrl.teleport(0, 0, 8)
  tpCam.snapBehindPlayer(ctrl.position, Math.PI)

  // 12b. Camera Synchronization at Spawn
  const camFwd = tpCam.getHorizontalForward()
  assert(camFwd.z > 0.99 && Math.abs(camFwd.x) < 0.01, 'Initial camera forward must point North (+Z)')
  const camRight = tpCam.getHorizontalRight()
  assert(camRight.x < -0.99 && Math.abs(camRight.z) < 0.01, 'Initial camera right must point West (-X)')

  // 12c. Immediate WASD near spawn: Moving forward (+Z) past Crate_Step1 z-bound
  for (let i = 0; i < 25; i++) {
    tpCam.update(ctrl.position, 0.016)
    const s = ctrl.update(createInput({ forward: true }), cam, 0.016)
    tpCam.update(s.position, 0.016)
  }
  assert(
    ctrl.position.z > 9.5,
    `Player pressing W must move freely past Z=8.4 without being blocked (reached Z=${ctrl.position.z.toFixed(2)})`
  )
  assert(ctrl.velocity.z > 4.5, 'Player must maintain full forward walking speed')

  // Reset to spawn & test S (backward, -Z past Lamp_Pole_9 z-bound)
  ctrl.teleport(0, 0, 8)
  tpCam.snapBehindPlayer(ctrl.position, Math.PI)
  for (let i = 0; i < 25; i++) {
    tpCam.update(ctrl.position, 0.016)
    const s = ctrl.update(createInput({ backward: true }), cam, 0.016)
    tpCam.update(s.position, 0.016)
  }
  assert(
    ctrl.position.z < 6.5,
    `Player pressing S must move freely past Z=7.6 without being blocked (reached Z=${ctrl.position.z.toFixed(2)})`
  )
  assert(ctrl.velocity.z < -4.5, 'Player must maintain full backward walking speed')

  // Reset to spawn & test A (left, +X)
  ctrl.teleport(0, 0, 8)
  tpCam.snapBehindPlayer(ctrl.position, Math.PI)
  for (let i = 0; i < 20; i++) {
    tpCam.update(ctrl.position, 0.016)
    const s = ctrl.update(createInput({ left: true }), cam, 0.016)
    tpCam.update(s.position, 0.016)
  }
  assert(ctrl.position.x > 1.0, `Player pressing A must move left (+X) (reached X=${ctrl.position.x.toFixed(2)})`)

  // Reset to spawn & test D (right, -X)
  ctrl.teleport(0, 0, 8)
  tpCam.snapBehindPlayer(ctrl.position, Math.PI)
  for (let i = 0; i < 20; i++) {
    tpCam.update(ctrl.position, 0.016)
    const s = ctrl.update(createInput({ right: true }), cam, 0.016)
    tpCam.update(s.position, 0.016)
  }
  assert(ctrl.position.x < -1.0, `Player pressing D must move right (-X) (reached X=${ctrl.position.x.toFixed(2)})`)

  // 12d. Diagonal Movement near spawn
  ctrl.teleport(0, 0, 8)
  tpCam.snapBehindPlayer(ctrl.position, Math.PI)
  for (let i = 0; i < 20; i++) {
    tpCam.update(ctrl.position, 0.016)
    const s = ctrl.update(createInput({ forward: true, right: true }), cam, 0.016)
    tpCam.update(s.position, 0.016)
  }
  assert(ctrl.position.z > 8.5 && ctrl.position.x < -0.5, 'Diagonal W+D must move forward-right')
  assert(ctrl.velocity.length() <= ctrl.walkSpeed + 0.1, 'Diagonal speed must be normalized to walkSpeed')

  // 12e. 360-Degree Mouse Camera Rotation at Spawn
  ctrl.teleport(0, 0, 8)
  tpCam.snapBehindPlayer(ctrl.position, Math.PI)
  for (let step = 0; step < 12; step++) {
    const mouseMoveX = -(Math.PI / 6) / tpCam.mouseSensitivity
    tpCam.handleInput(mouseMoveX, 0, 0)
    tpCam.update(ctrl.position, 0.05)

    const fwd = tpCam.getHorizontalForward()
    const stats = ctrl.update(createInput({ forward: true }), cam, 0.05)
    assert(stats.speed > 2.0, `Player must move at 360 rotation step ${step} (yaw ${(tpCam.yaw * 180 / Math.PI).toFixed(0)} deg)`)

    // Verify velocity aligns with camera forward
    const dot = (stats.velocity.x * fwd.x + stats.velocity.z * fwd.z) / stats.speed
    assert(dot > 0.8, `Movement velocity must align with camera horizontal forward (dot=${dot.toFixed(2)})`)

    ctrl.teleport(0, 0, 8)
  }

  // 12f. Travel 10-20m away from spawn & return round-trip test
  ctrl.teleport(0, 0, 8)
  tpCam.snapBehindPlayer(ctrl.position, Math.PI)

  // Sprint North 25m
  for (let f = 0; f < 60; f++) {
    tpCam.update(ctrl.position, 0.033)
    ctrl.update(createInput({ forward: true, sprint: true }), cam, 0.033)
    tpCam.update(ctrl.position, 0.033)
  }
  assert(ctrl.position.z > 25, `Player must travel 15+ meters away (reached Z=${ctrl.position.z.toFixed(2)})`)
  assert(ctrl.velocity.length() > 9.0, 'Player must achieve full sprint speed away from spawn')

  // Turn around 180 degrees and run back to spawn
  tpCam.handleInput(-Math.PI / tpCam.mouseSensitivity, 0, 0)
  tpCam.update(ctrl.position, 0.033)

  while (ctrl.position.z > 8.05) {
    tpCam.update(ctrl.position, 0.033)
    ctrl.update(createInput({ forward: true, sprint: true }), cam, 0.033)
    tpCam.update(ctrl.position, 0.033)
  }
  assert(Math.abs(ctrl.position.z - 8.0) < 0.5, 'Player must successfully navigate back to spawn')

  // Continue moving through the spawn area to ensure no freeze or snag
  for (let f = 0; f < 30; f++) {
    tpCam.update(ctrl.position, 0.033)
    const stats = ctrl.update(createInput({ forward: true }), cam, 0.033)
    tpCam.update(ctrl.position, 0.033)
    assert(stats.speed > 2.0, `Player must not stop or freeze upon returning to spawn area (frame ${f})`)
  }

  // 12g. Restart Game / Reset Position Test
  ctrl.teleport(0, 0, 8)
  tpCam.snapBehindPlayer(ctrl.position, Math.PI)
  assert(ctrl.position.x === 0 && ctrl.position.y === 0 && ctrl.position.z === 8, 'Reset must restore spawn coords')
  assert(ctrl.velocity.length() === 0, 'Reset must zero velocity')
  assert(ctrl.isGrounded, 'Reset must ensure player is grounded')

  city.dispose()
  mat.dispose()
  player.dispose()

  console.log('✔ 12. Spawn-area movement, camera synchronization, 360-degree rotation, round-trip travel & collider regression passed')
}

console.log('=== ALL 12 TESTS PASSED SUCCESSFULLY! ===')
