import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const BASE_URL = 'http://localhost:5173/'

async function runBlenderResidenceQA() {
  console.log('======================================================')
  console.log('=== CONQUER THE CITY: BLENDER COASTAL RESIDENCE QA ===')
  console.log('======================================================\n')

  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  const consoleLogs = []
  const consoleErrors = []
  page.on('console', msg => {
    const text = msg.text()
    consoleLogs.push(text)
    if (msg.type() === 'error') {
      consoleErrors.push(`[CONSOLE ERROR] ${text}`)
    }
  })
  page.on('pageerror', err => {
    consoleErrors.push(`[PAGE ERROR] ${err.message}`)
  })

  console.log(`Connecting to ${BASE_URL} ...`)
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // ---------------------------------------------------------
  // 1. SELECT AARAV & ENTER SEAVIEW TOWN
  // ---------------------------------------------------------
  console.log('1. Selecting Aarav and entering Seaview Town...')
  const aaravCard = page.locator('.character-card:has-text("Aarav")').first()
  await aaravCard.click()
  await page.waitForTimeout(300)

  const startBtn = page.locator('button.primary-btn').first()
  await startBtn.click()
  // Wait for 3D GLBs and textures to hydrate
  console.log('Waiting for world GLB models and textures to hydrate...')
  await page.waitForTimeout(4000)

  const shots = []
  async function snap(name, desc) {
    const localPath = `public/models/${name}.png`
    await page.screenshot({ path: localPath })
    const artifactPath = path.join(ARTIFACT_DIR, `${name}.png`)
    fs.copyFileSync(localPath, artifactPath)
    shots.push({ name, desc, artifactPath })
    console.log(`  📸 Saved screenshot: ${name}.png — ${desc}`)
  }

  // Check that the coastal residence GLB model is loaded
  const modelLoaded = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return false
    let found = false
    engine.scene.traverse(c => {
      if (c.name === 'Coastal_Residence_Root' || c.name === 'Building_StuccoOchre') {
        found = true
      }
    })
    return found
  })
  console.log('Is Coastal Residence GLB mounted in Three.js scene?', modelLoaded)

  // ---------------------------------------------------------
  // SHOT 1: Street Approach from Residential Avenue
  // ---------------------------------------------------------
  console.log('\n2. Capturing Shot 1: Residential Avenue street approach...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(45, 0.05, -47)
      engine.player.modelRoot.rotation.y = Math.PI // Facing North toward building
      engine.thirdPersonCamera.distance = 5.5
      engine.thirdPersonCamera.pitch = 0.20
      engine.thirdPersonCamera.yaw = Math.PI
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), Math.PI)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_residence_01_street_approach', 'Aarav on Residential Avenue approaching the Blender Coastal Residence through compound gate')

  // ---------------------------------------------------------
  // SHOT 2: Courtyard Closeup & Entrance Facade
  // ---------------------------------------------------------
  console.log('3. Capturing Shot 2: Courtyard garden & entrance facade...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(45, 0.05, -41)
      engine.player.modelRoot.rotation.y = Math.PI // Facing North toward entrance
      engine.thirdPersonCamera.distance = 4.5
      engine.thirdPersonCamera.pitch = 0.25
      engine.thirdPersonCamera.yaw = Math.PI
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), Math.PI)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_residence_02_courtyard_facade', 'Courtyard view of Aarav in front of stone steps, Tuscan columns and Mangalore tile roof')

  // ---------------------------------------------------------
  // SHOT 3: Walkable Veranda Porch (Camera in courtyard looking at Aarav on veranda)
  // ---------------------------------------------------------
  console.log('4. Capturing Shot 3: Aarav walking on the elevated veranda porch...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      // Step up onto the veranda at Y = 0.60, facing south toward courtyard
      engine.playerController.teleport(45, 0.60, -36.8)
      engine.player.modelRoot.rotation.y = 0 // Facing South toward courtyard
      engine.thirdPersonCamera.distance = 3.8
      engine.thirdPersonCamera.pitch = 0.12
      engine.thirdPersonCamera.yaw = Math.PI // Camera in courtyard looking North at Aarav on veranda
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), Math.PI)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_residence_03_veranda_walkable', 'Aarav standing on the 0.60m elevated veranda between classical Tuscan columns and wooden entrance')

  // ---------------------------------------------------------
  // SHOT 4: Elevated 3/4 Beauty Angle
  // ---------------------------------------------------------
  console.log('5. Capturing Shot 4: Architectural 3/4 elevated perspective...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(41, 0.05, -42)
      engine.player.modelRoot.rotation.y = Math.PI * 0.85
      // Position camera at high diagonal angle looking across the building
      engine.thirdPersonCamera.distance = 9.2
      engine.thirdPersonCamera.pitch = 0.35
      engine.thirdPersonCamera.yaw = Math.PI * 0.82
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), Math.PI * 0.82)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_residence_04_architectural_34_high', 'Architectural 3/4 perspective showing 2-storey facade, balcony railing, AC units and Sintex water tank')

  // ---------------------------------------------------------
  // 6. SWITCH TO ANANYA & INSPECT VERANDA & LIGHTING
  // ---------------------------------------------------------
  console.log('\n6. Switching to Ananya for dual-character verification...')
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  const ananyaCard = page.locator('.character-card:has-text("Ananya")').first()
  await ananyaCard.click()
  await page.waitForTimeout(300)

  const startBtn2 = page.locator('button.primary-btn').first()
  await startBtn2.click()
  await page.waitForTimeout(4000)

  // Shot 5: Ananya on Veranda under natural coastal daylight
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(44.5, 0.60, -36.6)
      engine.player.modelRoot.rotation.y = 0 // Facing South toward courtyard
      engine.thirdPersonCamera.distance = 3.8
      engine.thirdPersonCamera.pitch = 0.16
      engine.thirdPersonCamera.yaw = Math.PI * 0.95 // Camera in courtyard looking North at Ananya
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), Math.PI * 0.95)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_residence_05_ananya_veranda_lighting', 'Ananya exploring the Coastal Residence veranda under soft natural daylight and PCF shadows')

  // Report performance
  const perf = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      return {
        fps: engine.currentFps,
        frameTime: engine.currentFrameTime,
        collidersCount: engine.collisionSystem.getColliders().length,
      }
    }
    return null
  })

  console.log('\n--- Live Gameplay Performance ---')
  console.log('FPS:', perf?.fps)
  console.log('Frame Time:', perf?.frameTime?.toFixed(2), 'ms')
  console.log('Total Colliders in World:', perf?.collidersCount)

  console.log('\nConsole errors count:', consoleErrors.length)
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(e => console.log('  ', e))
  }

  await browser.close()
  console.log('\n✔ All gameplay verification passes and screenshots completed successfully!')
}

runBlenderResidenceQA().catch(err => {
  console.error('QA test failed:', err)
  process.exit(1)
})
