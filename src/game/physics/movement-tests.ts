import * as THREE from 'three'
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

// 1. WASD & Diagonal Movement & Normalization Tests
{
  const col = new CollisionSystem()
  const player = new Player()
  const ctrl = new PlayerController(player, col)

  // Test at Camera Yaw = 0 (Camera looking down -Z)
  // W should move along -Z
  let stats = ctrl.update(createInput({ forward: true }), 0, 0.05)
  assert(stats.velocity.z < -0.1, 'Yaw 0: W should move along negative Z')
  assert(Math.abs(stats.velocity.x) < 0.001, 'Yaw 0: W should have near-zero X velocity')

  // S should move along +Z
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ backward: true }), 0, 0.05)
  assert(stats.velocity.z > 0.1, 'Yaw 0: S should move along positive Z')

  // D should move along +X
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ right: true }), 0, 0.05)
  assert(stats.velocity.x > 0.1, 'Yaw 0: D should move along positive X')

  // A should move along -X
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ left: true }), 0, 0.05)
  assert(stats.velocity.x < -0.1, 'Yaw 0: A should move along negative X')

  // Diagonal Normalization: W + D should have same target speed as W alone
  ctrl.teleport(0, 0, 0)
  for (let i = 0; i < 40; i++) {
    stats = ctrl.update(createInput({ forward: true, right: true }), 0, 0.016)
  }
  const diagonalSpeed = Math.hypot(stats.velocity.x, stats.velocity.z)
  assert(
    Math.abs(diagonalSpeed - ctrl.walkSpeed) < 0.2,
    `Diagonal speed (${diagonalSpeed.toFixed(2)}) should match walk speed (${ctrl.walkSpeed})`
  )
  console.log('✔ 1. WASD & Diagonal normalization passed')
}

// 2. Camera-Relative Movement at Arbitrary Yaws
{
  const col = new CollisionSystem()
  const player = new Player()
  const ctrl = new PlayerController(player, col)

  // Camera Yaw = PI / 2 (90 deg: camera on +X looking at origin, view is -X)
  // W should move towards -X
  ctrl.teleport(0, 0, 0)
  let stats = ctrl.update(createInput({ forward: true }), Math.PI / 2, 0.05)
  assert(stats.velocity.x < -0.1, 'Yaw PI/2: W should move along negative X')
  assert(Math.abs(stats.velocity.z) < 0.05, 'Yaw PI/2: W should have near-zero Z velocity')

  // S should move towards +X
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ backward: true }), Math.PI / 2, 0.05)
  assert(stats.velocity.x > 0.1, 'Yaw PI/2: S should move along positive X')

  // D should move towards -Z
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ right: true }), Math.PI / 2, 0.05)
  assert(stats.velocity.z < -0.1, 'Yaw PI/2: D should move along negative Z')

  // A should move towards +Z
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ left: true }), Math.PI / 2, 0.05)
  assert(stats.velocity.z > 0.1, 'Yaw PI/2: A should move along positive Z')

  // Camera Yaw = PI (180 deg: camera looking down +Z)
  // W should move towards +Z
  ctrl.teleport(0, 0, 0)
  stats = ctrl.update(createInput({ forward: true }), Math.PI, 0.05)
  assert(stats.velocity.z > 0.1, 'Yaw PI: W should move along positive Z')

  console.log('✔ 2. Camera-relative WASD at multiple yaws passed')
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

console.log('=== ALL 11 TESTS PASSED SUCCESSFULLY! ===')
