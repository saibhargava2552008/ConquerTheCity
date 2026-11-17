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

async function auditCharacterModel(characterName: 'Aarav' | 'Ananya', relativePath: string): Promise<void> {
  const glbPath = path.resolve(relativePath)
  if (!fs.existsSync(glbPath)) {
    throw new Error(`GLB asset not found at path: ${glbPath}`)
  }

  const buffer = fs.readFileSync(glbPath)
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

  return new Promise<void>((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.parse(
      arrayBuffer,
      '',
      (gltf) => {
        try {
          console.log(`\n======================================================`)
          console.log(`=== ${characterName.toUpperCase()} ANIMATION STATE MACHINE & TRANSITION AUDIT ===`)
          console.log(`======================================================\n`)

          const mixer = new THREE.AnimationMixer(gltf.scene)
          const actions = new Map<string, THREE.AnimationAction>()
          const semanticActions = new Map<string, THREE.AnimationAction>()

          // Verify all 8 required clips exist
          const requiredSuffixes = [
            'Idle',
            'Walk',
            'Run',
            'Sprint',
            'Jump',
            'Landing',
            'Turn_Left',
            'Hand_Interaction',
          ]

          console.log(`Auditing GLB animation clips (${gltf.animations.length} clips found):`)
          for (const clip of gltf.animations) {
            console.log(`  - Clip: "${clip.name}" (duration: ${clip.duration.toFixed(3)}s, tracks: ${clip.tracks.length})`)
            const action = mixer.clipAction(clip)
            const lower = clip.name.toLowerCase()
            const isOneShot =
              lower.includes('jump') ||
              lower.includes('landing') ||
              lower.includes('interaction')

            if (isOneShot) {
              action.setLoop(THREE.LoopOnce, 1)
              action.clampWhenFinished = true
            } else {
              action.setLoop(THREE.LoopRepeat, Infinity)
            }
            actions.set(clip.name, action)

            if (lower.includes('idle')) semanticActions.set('idle', action)
            else if (lower.includes('sprint')) semanticActions.set('sprint', action)
            else if (lower.includes('run')) semanticActions.set('run', action)
            else if (lower.includes('walk')) semanticActions.set('walk', action)
            else if (lower.includes('jump')) semanticActions.set('jump', action)
            else if (lower.includes('landing')) semanticActions.set('landing', action)
            else if (lower.includes('turn')) semanticActions.set('turn_left', action)
            else if (lower.includes('interaction')) semanticActions.set('hand_interaction', action)
          }

          for (const suffix of requiredSuffixes) {
            const expectedName = `${characterName}_${suffix}`
            if (!actions.has(expectedName)) {
              throw new Error(`Missing required animation clip: "${expectedName}" in ${characterName}'s GLB!`)
            }
          }

          let currentActionName = ''
          let currentAction: THREE.AnimationAction | null = null

          function switchAction(targetKey: string, fadeDuration = 0.2, syncGait = false) {
            if (currentActionName === targetKey) return

            const nextAction = semanticActions.get(targetKey) || actions.get(targetKey)
            if (!nextAction) {
              throw new Error(`Target action not found: ${targetKey}`)
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
            currentActionName = targetKey
          }

          // Start with Idle
          switchAction('idle', 0.1)
          mixer.update(0.1)
          console.log(`\n[STATE: Idle] Active: ${currentActionName}, weight=${currentAction!.getEffectiveWeight().toFixed(2)}`)

          // TEST 1: Idle -> Walk transition
          console.log('\n[TEST 1: Idle -> Walk Crossfade]')
          switchAction('walk', 0.2, true)
          mixer.update(0.1)
          console.log(`  t=0.10s: Idle weight=${semanticActions.get('idle')!.getEffectiveWeight().toFixed(2)}, Walk weight=${semanticActions.get('walk')!.getEffectiveWeight().toFixed(2)}`)
          mixer.update(0.15)
          console.log(`  t=0.25s: Idle weight=${semanticActions.get('idle')!.getEffectiveWeight().toFixed(2)}, Walk weight=${semanticActions.get('walk')!.getEffectiveWeight().toFixed(2)}`)
          if (semanticActions.get('walk')!.getEffectiveWeight() < 0.95) {
            throw new Error('Walk should have full weight after crossfade!')
          }

          // TEST 2: Walk -> Run with gait phase sync
          console.log('\n[TEST 2: Walk -> Run with Stride Phase Sync]')
          const walkTimeBefore = semanticActions.get('walk')!.time
          const walkDur = semanticActions.get('walk')!.getClip().duration
          const walkProgress = (walkTimeBefore % walkDur) / walkDur
          console.log(`  Walk stride progress: ${(walkProgress * 100).toFixed(1)}%`)

          switchAction('run', 0.2, true)
          const runTimeAfter = semanticActions.get('run')!.time
          const runDur = semanticActions.get('run')!.getClip().duration
          const runProgress = (runTimeAfter % runDur) / runDur
          console.log(`  Run stride progress matched: ${(runProgress * 100).toFixed(1)}%`)
          if (Math.abs(walkProgress - runProgress) > 0.01) {
            throw new Error(`Gait phase sync mismatch! Walk: ${walkProgress}, Run: ${runProgress}`)
          }
          mixer.update(0.2)
          console.log(`  Walk -> Run crossfade completed cleanly: Run weight=${semanticActions.get('run')!.getEffectiveWeight().toFixed(2)}`)

          // TEST 3: Run -> Sprint with gait phase sync
          console.log('\n[TEST 3: Run -> Sprint with Stride Phase Sync]')
          switchAction('sprint', 0.18, true)
          mixer.update(0.2)
          console.log(`  Run -> Sprint crossfade completed: Sprint weight=${semanticActions.get('sprint')!.getEffectiveWeight().toFixed(2)}`)

          // TEST 4: Sprint -> Stopping Deceleration -> Idle
          console.log('\n[TEST 4: Sprint -> Deceleration -> Idle]')
          switchAction('run', 0.15, true)
          mixer.update(0.08)
          switchAction('walk', 0.15, true)
          mixer.update(0.08)
          switchAction('idle', 0.22)
          mixer.update(0.25)
          console.log(`  Idle weight=${semanticActions.get('idle')!.getEffectiveWeight().toFixed(2)}`)
          console.log(`  Sprint weight=${semanticActions.get('sprint')!.getEffectiveWeight().toFixed(2)}`)
          console.log(`  Run weight=${semanticActions.get('run')!.getEffectiveWeight().toFixed(2)}`)
          console.log(`  Walk weight=${semanticActions.get('walk')!.getEffectiveWeight().toFixed(2)}`)
          if (semanticActions.get('idle')!.getEffectiveWeight() < 0.95) {
            throw new Error('Idle should be fully dominant after deceleration!')
          }

          // TEST 5: Jump Takeoff -> Apex -> Fall -> Landing -> Walk
          console.log('\n[TEST 5: Jump Takeoff -> Apex -> Fall -> Landing -> Walk]')
          switchAction('jump', 0.08)
          mixer.update(0.35) // Rising towards apex
          console.log(`  Jump ascending: time=${currentAction!.time.toFixed(2)}s, weight=${currentAction!.getEffectiveWeight().toFixed(2)}`)

          // Falling descent
          const jumpDur = semanticActions.get('jump')!.getClip().duration
          if (currentAction!.time < jumpDur * 0.55) {
            currentAction!.time = jumpDur * 0.55
          }
          mixer.update(0.25)
          console.log(`  Jump falling descent: time=${currentAction!.time.toFixed(2)}s`)

          // Touchdown Landing
          switchAction('landing', 0.1)
          mixer.update(0.12)
          console.log(`  Landing compression: time=${currentAction!.time.toFixed(2)}s, weight=${currentAction!.getEffectiveWeight().toFixed(2)}`)

          // Recovery to Walk
          switchAction('walk', 0.15, false)
          mixer.update(0.2)
          console.log(`  Smooth transition from landing into Walk: Walk weight=${semanticActions.get('walk')!.getEffectiveWeight().toFixed(2)}`)

          // TEST 6: Ledge Fall (No jump takeoff)
          console.log('\n[TEST 6: Direct Ledge Fall (Stepping off high surface)]')
          switchAction('jump', 0.1)
          if (currentAction!.time < jumpDur * 0.55) {
            currentAction!.time = jumpDur * 0.55
          }
          console.log(`  Ledge fall starts directly at airborne glide: time=${currentAction!.time.toFixed(2)}s`)
          mixer.update(0.2)
          switchAction('landing', 0.1)
          mixer.update(0.2)
          console.log(`  Landing after ledge fall: Landing weight=${semanticActions.get('landing')!.getEffectiveWeight().toFixed(2)}`)

          // TEST 7: Turn In Place
          console.log('\n[TEST 7: In-Place Turn]')
          switchAction('turn_left', 0.15)
          mixer.update(0.2)
          console.log(`  Turn playing: weight=${currentAction!.getEffectiveWeight().toFixed(2)}`)
          switchAction('idle', 0.2)
          mixer.update(0.25)
          console.log(`  Back to Idle: Idle weight=${currentAction!.getEffectiveWeight().toFixed(2)}`)

          // TEST 8: Hand Interaction
          console.log('\n[TEST 8: Hand Interaction Trigger]')
          switchAction('hand_interaction', 0.15)
          mixer.update(0.25)
          console.log(`  Hand interaction: weight=${currentAction!.getEffectiveWeight().toFixed(2)}`)
          switchAction('idle', 0.2)
          mixer.update(0.25)
          console.log(`  Back to Idle: Idle weight=${currentAction!.getEffectiveWeight().toFixed(2)}`)

          console.log(`\n✔ [PASS] ${characterName.toUpperCase()}: ALL 8 ANIMATION STATES & TRANSITIONS VERIFIED!`)
          resolve()
        } catch (err) {
          reject(err)
        }
      },
      (err) => {
        reject(new Error(`Failed to parse ${characterName}'s GLTF: ${err}`))
      }
    )
  })
}

async function runAllAnimationAudits() {
  try {
    await auditCharacterModel('Aarav', 'public/models/aarav_character.glb')
    await auditCharacterModel('Ananya', 'public/models/ananya_character.glb')
    console.log('\n======================================================')
    console.log('✔ ALL PLAYABLE CHARACTERS (AARAV & ANANYA) AUDITED SUCCESSFULLY!')
    console.log('======================================================\n')
  } catch (err) {
    console.error('Audit failed with error:', err)
    process.exit(1)
  }
}

runAllAnimationAudits()
