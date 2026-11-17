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
  console.log('✔ WASD & Diagonal normalization passed')
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

  console.log('✔ Camera-relative WASD at multiple yaws passed')
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
  console.log('✔ Direction reversal braking responsiveness passed')
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
  console.log('✔ Sprint & Stamina mechanics passed')
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
  console.log('✔ Jump kinematics and landing passed')
}

// 6. Character Turning & -PI/PI Boundary Flip Test
{
  const col = new CollisionSystem()
  const player = new Player()
  const ctrl = new PlayerController(player, col)

  // Start moving slightly positive X (+PI/2)
  for (let i = 0; i < 10; i++) {
    ctrl.update(createInput({ right: true }), 0, 0.016)
  }

  // Force velocity pointing in opposite direction
  ctrl.velocity.set(0, 0, 5)
  ctrl.update(createInput(), 0, 0.016)

  // Verify that turnRate never exhibits huge spikes (> 20 rad/s)
  const rate = Math.abs(ctrl['turnRate'])
  assert(
    rate < 15,
    `turnRate should be smooth across boundary (got ${rate})`
  )
  console.log('✔ Character turning across -PI/PI boundary passed')
}

// 7. Collision Tests: Solid Wall, Sliding, and Moving Away
{
  const col = new CollisionSystem()
  const buildingBox = new THREE.Box3(
    new THREE.Vector3(10, 0, 10),
    new THREE.Vector3(20, 15, 20)
  )
  col.addCollider({ id: 'test_bldg', box: buildingBox, isStatic: true })

  const player = new Player()
  const ctrl = new PlayerController(player, col)

  // Test 7a: Walk straight into the West wall (min.x = 10)
  ctrl.teleport(8, 0, 15)
  for (let i = 0; i < 30; i++) {
    ctrl.update(createInput({ right: true }), 0, 0.016)
  }
  assert(
    ctrl.position.x <= 9.6,
    `Player should stop at West wall face (got ${ctrl.position.x.toFixed(4)})`
  )
  assert(
    ctrl.position.x > 9.55,
    `Player should be right against the wall face (got ${ctrl.position.x.toFixed(4)})`
  )
  assert(
    ctrl.velocity.x === 0,
    'Velocity X should be zeroed upon wall collision'
  )

  // Test 7b: Diagonal Wall Sliding
  const startZ = ctrl.position.z
  for (let i = 0; i < 20; i++) {
    ctrl.update(createInput({ forward: true, right: true }), 0, 0.016)
  }
  assert(
    ctrl.position.x <= 9.6,
    'Player must not penetrate into the wall during diagonal sliding'
  )
  assert(
    ctrl.position.z < startZ - 0.5,
    `Player should slide along Z during diagonal movement (moved from ${startZ.toFixed(2)} to ${ctrl.position.z.toFixed(2)})`
  )

  // Test 7c: Moving Away from Wall
  const wallX = ctrl.position.x
  ctrl.update(createInput({ left: true }), 0, 0.016)
  assert(
    ctrl.position.x < wallX,
    'Player should immediately move away from wall without sticking'
  )

  // Test 7d: Step-Up Curbs
  const curbBox = new THREE.Box3(
    new THREE.Vector3(0, 0, -5),
    new THREE.Vector3(10, 0.2, 0)
  )
  col.addCollider({ id: 'curb', box: curbBox, isStatic: true })
  ctrl.teleport(5, 0, 1)
  for (let i = 0; i < 30; i++) {
    ctrl.update(createInput({ forward: true }), 0, 0.016)
  }
  assert(
    ctrl.position.z < 0,
    'Player should step over curb and continue moving forward'
  )
  assert(
    Math.abs(ctrl.position.y - 0.2) < 0.05,
    `Player should be on top of curb surface (Y = ${ctrl.position.y.toFixed(2)})`
  )

  console.log('✔ Collision system: stopping, sliding, backing off, and step-up passed')
}

// 8. ThirdPersonCamera Rotation & Clamping & Zoom
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

  console.log('✔ Camera orbit, pitch clamping, and zoom passed')
}

// 9. Input State & Reset on Blur / Visibility Change
{
  const dummyDiv = {
    addEventListener: () => {},
    removeEventListener: () => {},
    requestPointerLock: () => {},
  } as unknown as HTMLElement

  // Test InputManager key reset logic directly
  const { InputManager } = await import('../input/InputManager')
  const inputMgr = new InputManager(dummyDiv)

  // Simulate keys pressed
  inputMgr['state'].forward = true
  inputMgr['state'].sprint = true
  inputMgr['state'].jump = true
  inputMgr['state'].movementX = 42

  let snapshot = inputMgr.consumeInput()
  assert(snapshot.forward && snapshot.sprint && snapshot.jump, 'Inputs should be active')

  // Simulate blur / resetHeldKeys
  inputMgr['state'].forward = true
  inputMgr['state'].right = true
  inputMgr.resetHeldKeys()

  snapshot = inputMgr.consumeInput()
  assert(
    !snapshot.forward && !snapshot.backward && !snapshot.left && !snapshot.right && !snapshot.jump && !snapshot.sprint,
    'All held keys must be reset on focus loss'
  )
  assert(snapshot.movementX === 0, 'Movement deltas must be reset')

  inputMgr.dispose()
  console.log('✔ Input focus loss and held key reset passed')
}

console.log('=== ALL TESTS PASSED SUCCESSFULLY! ===')
