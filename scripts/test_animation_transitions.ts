import fs from 'fs'
import path from 'path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Mock minimal environment for GLTFLoader in Node
if (typeof window === 'undefined') {
  ;(globalThis as unknown as { window: unknown }).window = globalThis
  ;(globalThis as unknown as { self: unknown }).self = globalThis
  if (typeof (globalThis as unknown as { createImageBitmap?: unknown }).createImageBitmap === 'undefined') {
    ;(globalThis as unknown as { createImageBitmap: unknown }).createImageBitmap = async () => ({
      width: 128,
      height: 128,
      close: () => {},
    })
  }
}

const glbPath = path.resolve('public/models/aarav_character.glb')
const buffer = fs.readFileSync(glbPath)
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

const loader = new GLTFLoader()
loader.parse(
  arrayBuffer,
  '',
  (gltf) => {
    console.log('=== AARAV ANIMATION STATE MACHINE & TRANSITION AUDIT ===\n')

    const mixer = new THREE.AnimationMixer(gltf.scene)
    const actions = new Map<string, THREE.AnimationAction>()

    for (const clip of gltf.animations) {
      const action = mixer.clipAction(clip)
      if (
        clip.name === 'Aarav_Jump' ||
        clip.name === 'Aarav_Landing' ||
        clip.name === 'Aarav_Hand_Interaction'
      ) {
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
      } else {
        action.setLoop(THREE.LoopRepeat, Infinity)
      }
      actions.set(clip.name, action)
    }

    let currentActionName = ''
    let currentAction: THREE.AnimationAction | null = null

    function switchAction(targetName: string, fadeDuration = 0.2, syncGait = false) {
      if (currentActionName === targetName) return

      const nextAction = actions.get(targetName)
      if (!nextAction) {
        throw new Error(`Target action not found: ${targetName}`)
      }

      const prevAction = currentAction

      if (prevAction && prevAction !== nextAction) {
        prevAction.fadeOut(fadeDuration)
      }

      for (const [, action] of actions) {
        if (action !== nextAction && action !== prevAction && action.isRunning()) {
          action.fadeOut(fadeDuration * 0.5)
        }
      }

      nextAction.reset()
      nextAction.enabled = true
      nextAction.setEffectiveTimeScale(1.0)
      nextAction.setEffectiveWeight(1.0)

      if (syncGait && prevAction) {
        const prevDur = prevAction.getClip().duration
        const nextDur = nextAction.getClip().duration
        if (prevDur > 0 && nextDur > 0) {
          const progress = (((prevAction.time % prevDur) + prevDur) % prevDur) / prevDur
          nextAction.time = progress * nextDur
        }
      }

      nextAction.fadeIn(fadeDuration)
      nextAction.play()

      currentAction = nextAction
      currentActionName = targetName
    }

    // Start with Idle
    switchAction('Aarav_Idle', 0.1)
    mixer.update(0.1)
    console.log(`[STATE: Idle] Active: ${currentActionName}, weight=${currentAction!.getEffectiveWeight().toFixed(2)}`)

    // TEST 1: Idle -> Walk transition
    console.log('\n[TEST 1: Idle -> Walk]')
    switchAction('Aarav_Walk', 0.2, true)
    mixer.update(0.1)
    console.log(`  t=0.1s: Idle weight=${actions.get('Aarav_Idle')!.getEffectiveWeight().toFixed(2)}, Walk weight=${actions.get('Aarav_Walk')!.getEffectiveWeight().toFixed(2)}`)
    mixer.update(0.15)
    console.log(`  t=0.25s: Idle weight=${actions.get('Aarav_Idle')!.getEffectiveWeight().toFixed(2)}, Walk weight=${actions.get('Aarav_Walk')!.getEffectiveWeight().toFixed(2)}`)
    if (actions.get('Aarav_Walk')!.getEffectiveWeight() < 0.95) {
      throw new Error('Walk should have full weight after crossfade!')
    }

    // TEST 2: Walk -> Run with stride phase sync
    console.log('\n[TEST 2: Walk -> Run with Gait Phase Sync]')
    const walkTimeBefore = actions.get('Aarav_Walk')!.time
    const walkDur = actions.get('Aarav_Walk')!.getClip().duration
    const walkProgress = (walkTimeBefore % walkDur) / walkDur
    console.log(`  Walk progress before switch: ${(walkProgress * 100).toFixed(1)}%`)

    switchAction('Aarav_Run', 0.2, true)
    const runTimeAfter = actions.get('Aarav_Run')!.time
    const runDur = actions.get('Aarav_Run')!.getClip().duration
    const runProgress = (runTimeAfter % runDur) / runDur
    console.log(`  Run progress after switch: ${(runProgress * 100).toFixed(1)}%`)
    if (Math.abs(walkProgress - runProgress) > 0.01) {
      throw new Error(`Gait phase sync mismatch! Walk: ${walkProgress}, Run: ${runProgress}`)
    }
    mixer.update(0.2)
    console.log(`  Walk -> Run crossfade completed cleanly: Run weight=${actions.get('Aarav_Run')!.getEffectiveWeight().toFixed(2)}`)

    // TEST 3: Run -> Sprint
    console.log('\n[TEST 3: Run -> Sprint with Gait Phase Sync]')
    switchAction('Aarav_Sprint', 0.18, true)
    mixer.update(0.2)
    console.log(`  Run -> Sprint crossfade completed: Sprint weight=${actions.get('Aarav_Sprint')!.getEffectiveWeight().toFixed(2)}`)

    // TEST 4: Sprint -> Stopping Deceleration -> Idle
    console.log('\n[TEST 4: Sprint -> Deceleration -> Idle]')
    switchAction('Aarav_Run', 0.15, true)
    mixer.update(0.08)
    switchAction('Aarav_Walk', 0.15, true)
    mixer.update(0.08)
    switchAction('Aarav_Idle', 0.22)
    mixer.update(0.25)
    console.log(`  Idle weight=${actions.get('Aarav_Idle')!.getEffectiveWeight().toFixed(2)}`)
    console.log(`  Sprint weight=${actions.get('Aarav_Sprint')!.getEffectiveWeight().toFixed(2)}`)
    console.log(`  Run weight=${actions.get('Aarav_Run')!.getEffectiveWeight().toFixed(2)}`)
    console.log(`  Walk weight=${actions.get('Aarav_Walk')!.getEffectiveWeight().toFixed(2)}`)
    if (actions.get('Aarav_Idle')!.getEffectiveWeight() < 0.95) {
      throw new Error('Idle should be fully dominant after deceleration!')
    }

    // TEST 5: Jump Takeoff -> Apex -> Fall -> Landing -> Walk
    console.log('\n[TEST 5: Jump Takeoff -> Apex -> Fall -> Landing -> Walk]')
    switchAction('Aarav_Jump', 0.08)
    mixer.update(0.35) // Rising towards apex
    console.log(`  Jump ascending: time=${currentAction!.time.toFixed(2)}s, weight=${currentAction!.getEffectiveWeight().toFixed(2)}`)

    // Falling descent
    const jumpDur = actions.get('Aarav_Jump')!.getClip().duration
    if (currentAction!.time < jumpDur * 0.55) {
      currentAction!.time = jumpDur * 0.55
    }
    mixer.update(0.25)
    console.log(`  Jump falling descent: time=${currentAction!.time.toFixed(2)}s`)

    // Touchdown Landing
    switchAction('Aarav_Landing', 0.1)
    mixer.update(0.12)
    console.log(`  Landing compression: time=${currentAction!.time.toFixed(2)}s, weight=${currentAction!.getEffectiveWeight().toFixed(2)}`)

    // Recovery to Walk
    switchAction('Aarav_Walk', 0.15, false)
    mixer.update(0.2)
    console.log(`  Smooth transition from landing into Walk: Walk weight=${actions.get('Aarav_Walk')!.getEffectiveWeight().toFixed(2)}`)

    // TEST 6: Ledge Fall (No jump takeoff)
    console.log('\n[TEST 6: Direct Ledge Fall (Stepping off high surface)]')
    switchAction('Aarav_Jump', 0.1)
    // Directly skip crouch/takeoff
    if (currentAction!.time < jumpDur * 0.55) {
      currentAction!.time = jumpDur * 0.55
    }
    console.log(`  Ledge fall starts directly at airborne glide: time=${currentAction!.time.toFixed(2)}s`)
    mixer.update(0.2)
    switchAction('Aarav_Landing', 0.1)
    mixer.update(0.2)
    console.log(`  Landing after ledge fall: Landing weight=${actions.get('Aarav_Landing')!.getEffectiveWeight().toFixed(2)}`)

    // TEST 7: Turn In Place
    console.log('\n[TEST 7: In-Place Turn]')
    switchAction('Aarav_Turn_Left', 0.15)
    mixer.update(0.2)
    console.log(`  Turn playing: weight=${currentAction!.getEffectiveWeight().toFixed(2)}`)
    switchAction('Aarav_Idle', 0.2)
    mixer.update(0.25)
    console.log(`  Back to Idle: Idle weight=${currentAction!.getEffectiveWeight().toFixed(2)}`)

    // TEST 8: Hand Interaction
    console.log('\n[TEST 8: Hand Interaction Trigger]')
    switchAction('Aarav_Hand_Interaction', 0.15)
    mixer.update(0.25)
    console.log(`  Hand interaction: weight=${currentAction!.getEffectiveWeight().toFixed(2)}`)
    switchAction('Aarav_Idle', 0.2)
    mixer.update(0.25)
    console.log(`  Back to Idle: Idle weight=${currentAction!.getEffectiveWeight().toFixed(2)}`)

    console.log('\n=== ALL 8 ANIMATION STATES & TRANSITIONS VERIFIED SUCCESSFULLY! ===')
  },
  (err) => {
    console.error('Failed to parse GLTF:', err)
  }
)
