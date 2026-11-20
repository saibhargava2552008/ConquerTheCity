import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const BASE_URL = 'http://localhost:5173/'

async function runAsset9FishermenCooperativeQA() {
  console.log('=====================================================================')
  console.log('=== FISHING HARBOUR ASSET 9: FISHERMEN COOPERATIVE IN-GAME QA ===')
  console.log('=====================================================================\n')

  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  const consoleLogs = []
  const consoleErrors = []
  page.on('console', (msg) => {
    const text = msg.text()
    consoleLogs.push(text)
    if (msg.type() === 'error') {
      consoleErrors.push(`[CONSOLE ERROR] ${text}`)
    }
  })
  page.on('pageerror', (err) => {
    consoleErrors.push(`[PAGE ERROR] ${err.message}`)
  })

  console.log(`Connecting to ${BASE_URL} ...`)
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // 1. SELECT AARAV & ENTER SEAVIEW TOWN
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

  // Verify Blender Fishermen's Cooperative model is mounted in Three.js scene
  const loadedCheck = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return { foundCoop: false, meshCount: 0 }
    let foundCoop = false
    let coopMeshes = 0
    engine.scene.traverse((c) => {
      if (
        c.name.includes('Fishermen_Cooperative') ||
        c.name.includes('building_fishermen_cooperative_01') ||
        c.name.includes('Coop_')
      ) {
        foundCoop = true
        if (c.isMesh) coopMeshes++
      }
    })
    return { foundCoop, coopMeshes }
  })
  console.log("Blender Fishermen's Cooperative mount check:", loadedCheck)

  // ---------------------------------------------------------
  // SHOT 1: Harbour Wharf approach looking East at Fishermen's Cooperative
  // ---------------------------------------------------------
  console.log('\n2. Capturing Shot 1: Harbour Wharf approach looking East toward Fishermen\'s Cooperative...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-37.5, 0.40, 114.0)
      const lookYaw = -Math.PI / 2 // Looking East (+X) towards veranda and bilingual signboard
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 7.0
      engine.thirdPersonCamera.pitch = 0.18
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset9_01_harbour_wharf_approach',
    'Harbour Wharf approach showing timber boardwalk, Mangalore terracotta tile roof, four veranda columns with teal bases, and bilingual Telugu/English signboard'
  )

  // ---------------------------------------------------------
  // SHOT 2: Aarav Ascending Entrance Steps onto Veranda Plinth
  // ---------------------------------------------------------
  console.log('3. Capturing Shot 2: Aarav ascending entrance steps onto veranda plinth...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-30.5, 0.40, 114.0)
      const lookYaw = -Math.PI / 2 // Looking East (+X) onto the veranda floor
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 3.8
      engine.thirdPersonCamera.pitch = 0.16
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset9_02_aarav_ascending_veranda_steps',
    'Aarav ascending the concrete entrance steps onto the polished terrazzo veranda floor under the column architrave'
  )

  // ---------------------------------------------------------
  // SHOT 3: Aarav at Interior Reception Counter with Ledger & Bell
  // ---------------------------------------------------------
  console.log('4. Capturing Shot 3: Aarav at interior reception counter...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      // Position Aarav in front of the reception counter facing South-East towards desk
      engine.playerController.teleport(-25.2, 0.40, 115.0)
      const lookYaw = -Math.PI / 4 // Looking South-East towards reception desk & ledger
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 4.2
      engine.thirdPersonCamera.pitch = 0.22
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset9_03_aarav_reception_counter_ledger',
    'Aarav inside the cooperative office standing in front of the L-shaped wooden service counter, inspection ledger book, brass desk bell, and filing storage'
  )

  // ---------------------------------------------------------
  // SHOT 4: Aarav at North Open-Air Net Repair Shelter
  // ---------------------------------------------------------
  console.log('5. Capturing Shot 4: Aarav at North net repair shelter...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      // Net repair bay is located at Z = 109.2, X = -24 to -18
      // Position Aarav at entrance of bay looking East (+X) under the timber shelter
      engine.playerController.teleport(-25.5, 0.40, 109.2)
      const lookYaw = -Math.PI / 2 // Looking East (+X) straight into net repair shelter
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 3.6
      engine.thirdPersonCamera.pitch = 0.16
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset9_04_north_net_repair_shelter',
    'Aarav examining the covered North net repair bay with timber support posts, wooden pallets, stacked nylon fish nets, and marine rope coils'
  )

  // ---------------------------------------------------------
  // SHOT 5: Panoramic Harbour Sequence (Asset 6, 7, 8, 9 Continuity)
  // ---------------------------------------------------------
  console.log('6. Capturing Shot 5: Panoramic harbour continuity overview...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      // Position on South wharf approach looking North (+Z) towards all 4 harbour assets
      engine.playerController.teleport(-38.0, 0.40, 62.0)
      const lookYaw = Math.PI - 0.28 // Looking North-Northeast along the wharf boardwalk
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 11.5
      engine.thirdPersonCamera.pitch = 0.32
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset9_05_panoramic_harbour_continuity',
    'Elevated panoramic view of Fishing Harbour demonstrating architectural continuity: Asset 6 Dhoni Boat, Asset 7 Cold Storage, Asset 8 Fish Auction Pavilion, and Asset 9 Fishermen\'s Cooperative'
  )

  // ---------------------------------------------------------
  // SHOT 6: Ananya on Veranda Inspecting Public Notices Board
  // ---------------------------------------------------------
  console.log('\n7. Switching to Ananya and capturing Shot 6: Veranda public notices board...')
  // Reload page to switch character cleanly
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  const ananyaCard = page.locator('.character-card:has-text("Ananya")').first()
  await ananyaCard.click()
  await page.waitForTimeout(300)

  const startBtn2 = page.locator('button.primary-btn').first()
  await startBtn2.click()
  await page.waitForTimeout(3000)

  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      // Position Ananya walking along the shaded veranda colonnade gallery
      engine.playerController.teleport(-29.2, 0.40, 111.5)
      const lookYaw = Math.PI - 0.15 // Looking North (+Z) along the length of the veranda colonnade
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 3.8
      engine.thirdPersonCamera.pitch = 0.16
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset9_06_ananya_evening_veranda',
    'Ananya on the cooperative veranda inspecting the official government circulars and coastal weather advisory notice board beside the office entrance doorway'
  )

  // Performance telemetry
  const perfMetrics = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return null
    const renderer = engine.renderer
    const info = renderer.info
    return {
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      points: info.render.points,
      lines: info.render.lines,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      fps: Math.round(1000 / Math.max(1, engine.lastDeltaTime * 1000 || 16.6)),
    }
  })

  console.log('\n--- PERFORMANCE TELEMETRY ---')
  console.log(perfMetrics)
  console.log(`Console Errors (${consoleErrors.length}):`, consoleErrors)

  await browser.close()
  return { shots, perfMetrics, consoleErrors }
}

runAsset9FishermenCooperativeQA().catch((err) => {
  console.error('QA Script failed:', err)
  process.exit(1)
})
