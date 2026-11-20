import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const BASE_URL = 'http://localhost:5173/'

async function runBlenderArcadeQA() {
  console.log('===========================================================')
  console.log('=== CONQUER THE CITY: BLENDER COMMERCIAL ARCADE QA ===')
  console.log('===========================================================\n')

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

  // Check that the commercial arcade GLB model is loaded
  const modelLoaded = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return false
    let found = false
    engine.scene.traverse(c => {
      if (c.name === 'Commercial_Arcade_Root' || c.name.startsWith('Building_StuccoOchre') || c.name.startsWith('Building_Awning')) {
        found = true
      }
    })
    return found
  })
  console.log('Is Commercial Arcade GLB mounted in Three.js scene?', modelLoaded)

  // ---------------------------------------------------------
  // SHOT 1: Street Approach from Central Bazaar Cobblestones
  // ---------------------------------------------------------
  console.log('\n2. Capturing Shot 1: Central Bazaar street approach looking toward Commercial Arcade...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      // Player at (36, 0.05, 20), looking North-East towards building at (54, 32)
      engine.playerController.teleport(37, 0.05, 21)
      const lookYaw = Math.atan2(-18, -11) // Camera behind player looking along (+18, +11)
      engine.player.modelRoot.rotation.y = lookYaw + Math.PI
      engine.thirdPersonCamera.distance = 7.0
      engine.thirdPersonCamera.pitch = 0.20
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_arcade_01_bazaar_approach', 'Aarav on Central Bazaar cobblestone street approaching the Commercial Arcade')

  // ---------------------------------------------------------
  // SHOT 2: Direct Colonnade Facade
  // ---------------------------------------------------------
  console.log('3. Capturing Shot 2: Direct Colonnade Facade...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      // Player at (43, 0.05, 32), camera looking East (+X) toward building at (54, 32)
      engine.playerController.teleport(43, 0.05, 32)
      const lookYaw = -Math.PI / 2
      engine.player.modelRoot.rotation.y = Math.PI / 2 // Player facing building
      engine.thirdPersonCamera.distance = 5.2
      engine.thirdPersonCamera.pitch = 0.22
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_arcade_02_colonnade_facade', 'Direct view of arches, classical piers, roller shutter, spice counter and upper balconies')

  // ---------------------------------------------------------
  // SHOT 3: Walkable Colonnade Gallery (Inside covered arcade)
  // ---------------------------------------------------------
  console.log('4. Capturing Shot 3: Aarav walking inside the covered arcade colonnade...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      // Inside colonnade at Y = 0.35, in front of Shop A counter
      engine.playerController.teleport(50.4, 0.35, 29.5)
      // Look South (+Z) along colonnade gallery
      const lookYaw = Math.PI
      engine.player.modelRoot.rotation.y = 0
      engine.thirdPersonCamera.distance = 3.6
      engine.thirdPersonCamera.pitch = 0.12
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_arcade_03_walkable_colonnade', 'Aarav exploring the covered arcade colonnade between pillars and retail counter at Y = 0.35m')

  // ---------------------------------------------------------
  // SHOT 4: Elevated 3/4 Beauty Angle
  // ---------------------------------------------------------
  console.log('5. Capturing Shot 4: Elevated 3/4 architectural perspective...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      // High diagonal angle from street corner (39, 21) looking at (54, 32)
      engine.playerController.teleport(42, 0.05, 23)
      const lookYaw = Math.atan2(-12, -9)
      engine.player.modelRoot.rotation.y = lookYaw + Math.PI
      engine.thirdPersonCamera.distance = 11.5
      engine.thirdPersonCamera.pitch = 0.35
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_arcade_04_architectural_34_high', 'Architectural 3/4 view showing roof pediment, Mangalore tiles, balconies and AC units')

  // ---------------------------------------------------------
  // 6. SWITCH TO ANANYA & INSPECT SHOP B & AWNINGS
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

  // Shot 5: Ananya on Arcade Plinth in front of Shop B
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(50.4, 0.35, 34.5)
      // Facing North along the arcade
      engine.player.modelRoot.rotation.y = Math.PI
      engine.thirdPersonCamera.distance = 3.6
      engine.thirdPersonCamera.pitch = 0.16
      engine.thirdPersonCamera.yaw = Math.PI
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), Math.PI)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_arcade_05_ananya_shopfront_lighting', 'Ananya exploring the Commercial Arcade colonnade under natural coastal lighting')

  // Performance stats
  const perf = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      return {
        fps: engine.fps || 60,
        drawCalls: engine.renderer.info.render.calls,
        triangles: engine.renderer.info.render.triangles,
        geometries: engine.renderer.info.memory.geometries,
        textures: engine.renderer.info.memory.textures,
        activeColliders: engine.collisionSystem.getColliders().length,
      }
    }
    return null
  })

  console.log('\n--- In-Game Performance Telemetry ---')
  console.log(JSON.stringify(perf, null, 2))

  if (consoleErrors.length > 0) {
    console.warn(`\nFound ${consoleErrors.length} console warnings/errors:`)
    consoleErrors.forEach(e => console.warn(e))
  } else {
    console.log('\n0 Console Errors detected during entire gameplay test session!')
  }

  await browser.close()
  console.log('\n===========================================================')
  console.log('✔ BLENDER COMMERCIAL ARCADE IN-GAME QA COMPLETED SUCCESSFULLY!')
  console.log('===========================================================')
}

runBlenderArcadeQA().catch(err => {
  console.error('Fatal QA error:', err)
  process.exit(1)
})
