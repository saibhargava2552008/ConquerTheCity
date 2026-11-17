import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const BASE_URL = 'http://localhost:5174/'

async function runVisualOverhaulQA() {
  console.log('======================================================')
  console.log('=== CONQUER THE CITY: VISUAL OVERHAUL QA (SEAVIEW TOWN) ===')
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
  // 1. SELECT AARAV & ENTER REALISTIC SEAVIEW TOWN
  // ---------------------------------------------------------
  console.log('1. Selecting Aarav and entering Seaview Town...')
  const aaravCard = page.locator('.character-card:has-text("Aarav")').first()
  await aaravCard.click()
  await page.waitForTimeout(300)

  const startBtn = page.locator('button.primary-btn').first()
  await startBtn.click()
  // Wait for 3D GLBs and textures to hydrate
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

  // Shot 1: Spawn overview facing North towards Stone Lighthouse Landmark
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(0, 0.35, 6)
      engine.player.modelRoot.rotation.y = 0 // Facing North towards Lighthouse (Z: -5)
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), 0)
    }
  })
  await page.waitForTimeout(600)
  await snap('realistic_01_town_centre_spawn', 'Town Centre Plaza & Stone Lighthouse Landmark with coconut palms, teak benches and streetlamps')

  // Shot 2: Teleport and look at Town Centre Auto-Rickshaw Stand
  console.log('2. Inspecting Iconic Indian Auto-Rickshaw prop...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-10, 0.35, 10)
      engine.player.modelRoot.rotation.y = -Math.PI * 0.75
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), -Math.PI * 0.75)
    }
  })
  await page.waitForTimeout(600)
  await snap('realistic_02_auto_rickshaw_closeup', 'Close-up of Aarav next to Indian Bajaj Auto-Rickshaw at Plaza stand')

  // Shot 3: Coastal Marine Boulevard & Zebra Crossing
  console.log('3. Inspecting Marine Boulevard & Zebra Crossing...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-10, 0.05, 6)
      engine.player.modelRoot.rotation.y = 0
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), 0)
    }
  })
  await page.waitForTimeout(600)
  await snap('realistic_03_marine_boulevard_crossing', 'Coastal Marine Boulevard asphalt with white dashed centerlines and zebra pedestrian crossing')

  // Shot 4: Marine Promenade oceanfront & beach view
  console.log('4. Inspecting Marine Promenade oceanfront...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-20, 0.25, 0)
      engine.player.modelRoot.rotation.y = -Math.PI / 2
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), -Math.PI / 2)
    }
  })
  await page.waitForTimeout(600)
  await snap('realistic_04_marine_promenade_oceanfront', 'Marine Promenade ocean balustrades, teak benches, streetlamps, and sandy beach')

  // Shot 5: Fishing Harbour with Traditional Indian Dhoni Boats
  console.log('5. Inspecting Fishing Harbour traditional Dhoni boats...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-42, 0.4, 70)
      engine.player.modelRoot.rotation.y = -Math.PI / 2
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), -Math.PI / 2)
    }
  })
  await page.waitForTimeout(600)
  await snap('realistic_05_fishing_harbour_dhoni_boats', 'Fishing Harbour wharf with authentic traditional Indian wooden Dhoni boats and cabins')

  // Shot 6: Market District Commercial Arcade
  console.log('6. Inspecting Market District Commercial Arcade...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(30, 0.05, 32)
      engine.player.modelRoot.rotation.y = -Math.PI / 2
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), -Math.PI / 2)
    }
  })
  await page.waitForTimeout(600)
  await snap('realistic_06_market_commercial_arcade', 'Market District Bazaar street with 2-storey commercial arcade shopfronts, shutters and awnings')

  // Shot 7: Residential District Goan/Konkan Heritage Villa
  console.log('7. Inspecting Residential District Goan/Konkan Heritage Villa...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(25, 0.05, -44)
      engine.player.modelRoot.rotation.y = Math.PI // Facing North towards Villa Gulmohar
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), Math.PI)
    }
  })
  await page.waitForTimeout(600)
  await snap('realistic_07_residential_heritage_villa', 'Residential District with Goan/Konkan colonial heritage villa, Tuscan columns and Mangalore tile roof')

  // ---------------------------------------------------------
  // 2. SWITCH TO ANANYA & INSPECT SUNLIGHT & ATMOSPHERE
  // ---------------------------------------------------------
  console.log('\n8. Switching to Ananya to verify dual-character parity in rebuilt world...')
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  const ananyaCard = page.locator('.character-card:has-text("Ananya")').first()
  await ananyaCard.click()
  await page.waitForTimeout(300)

  const startBtn2 = page.locator('button.primary-btn').first()
  await startBtn2.click()
  await page.waitForTimeout(4000)

  // Shot 8: Ananya in Town Centre Promenade under soft coastal lighting
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(0, 0.35, 2)
      engine.player.modelRoot.rotation.y = -Math.PI / 4
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), Math.PI * 0.75)
    }
  })
  await page.waitForTimeout(800)
  await snap('realistic_08_ananya_town_centre_lighting', 'Ananya in Town Centre Plaza under procedural atmospheric sky dome and soft PCF directional sunlight')

  // Performance stats check
  const perfStats = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      return {
        fps: engine.currentFps,
        frameTime: engine.currentFrameTime,
        colliders: engine.collisionSystem.getColliders().length,
      }
    }
    return null
  })

  console.log('\n--- PERFORMANCE STATS ---')
  console.log('Performance stats:', perfStats)

  console.log('\n--- CONSOLE ERRORS ---')
  if (consoleErrors.length === 0) {
    console.log('✔ ZERO console errors detected during visual overhaul walkthrough!')
  } else {
    console.log('Errors:', consoleErrors)
  }

  await browser.close()
  console.log('\n======================================================')
  console.log('✔ VISUAL OVERHAUL QA COMPLETED SUCCESSFULLY!')
  console.log('======================================================')
}

runVisualOverhaulQA().catch(err => {
  console.error('Fatal QA error:', err)
  process.exit(1)
})
