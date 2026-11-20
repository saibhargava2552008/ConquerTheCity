import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const BASE_URL = 'http://localhost:5173/'

async function runAsset8FishAuctionQA() {
  console.log('=====================================================================')
  console.log('=== FISHING HARBOUR ASSET 8: FISH AUCTION PAVILION IN-GAME QA ===')
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

  // Verify Blender Fish Auction Pavilion model is mounted in Three.js scene
  const loadedCheck = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return { foundPavilion: false, meshCount: 0 }
    let foundPavilion = false
    let pavilionMeshes = 0
    engine.scene.traverse((c) => {
      if (
        c.name.includes('Auction_Pavilion') ||
        c.name.includes('building_fish_auction_pavilion_01') ||
        c.name.includes('Auction')
      ) {
        foundPavilion = true
        if (c.isMesh) pavilionMeshes++
      }
    })
    return { foundPavilion, pavilionMeshes }
  })
  console.log('Blender Fish Auction Pavilion mount check:', loadedCheck)

  // ---------------------------------------------------------
  // SHOT 1: Wharf Approach looking East at Fish Auction Pavilion and bilingual signboard
  // ---------------------------------------------------------
  console.log('\n2. Capturing Shot 1: Wharf approach looking East toward Fish Auction Pavilion...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-38.5, 0.40, 96.0)
      const lookYaw = -Math.PI / 2 // Looking East (+X) towards pavilion entrance and gable signboard
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 7.5
      engine.thirdPersonCamera.pitch = 0.18
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset8_01_wharf_approach_signboard',
    'Harbour Wharf approach showing timber boardwalk, open-sided steel pavilion structure, and bilingual Telugu/English gable signboard'
  )

  // ---------------------------------------------------------
  // SHOT 2: Aarav Entering Open West Breezeway into Central Auction Aisle
  // ---------------------------------------------------------
  console.log('3. Capturing Shot 2: Aarav entering central auction aisle...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-30.0, 0.40, 96.0)
      const lookYaw = -Math.PI / 2 // Looking East (+X) down the central auction lane
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 4.2
      engine.thirdPersonCamera.pitch = 0.16
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset8_02_aarav_west_entrance_aisle',
    'Aarav walking through the open West entrance portal onto the non-slip concrete floor past cast-iron drainage grates into the central auction aisle'
  )

  // ---------------------------------------------------------
  // SHOT 3: Aarav on Raised Central Auction Stage with Desk & Tally Slate
  // ---------------------------------------------------------
  console.log('4. Capturing Shot 3: Aarav on raised central auction stage...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-24.5, 0.65, 96.0)
      const lookYaw = -Math.PI / 2 // Looking East toward auctioneer desk & chalk tally board
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 3.8
      engine.thirdPersonCamera.pitch = 0.20
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset8_03_aarav_auction_bidding_stage',
    'Aarav on the raised concrete auction platform (Y = 0.65m) standing beside the timber auctioneer rostrum, tally chalkboard, and bench'
  )

  // ---------------------------------------------------------
  // SHOT 4: Aarav Inspecting Stainless-Steel Sorting Tables & Dial Scale
  // ---------------------------------------------------------
  console.log('5. Capturing Shot 4: Aarav inspecting North sorting tables & hanging dial scale...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-24.0, 0.40, 100.2)
      const lookYaw = 0 // Looking North (+Z) towards marine stainless sorting tables
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 3.6
      engine.thirdPersonCamera.pitch = 0.22
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset8_04_sorting_tables_dial_scale',
    'Aarav examining the marine-grade stainless steel sorting table with iced catch bed, drainage trough, and overhead hanging dial scale'
  )

  // ---------------------------------------------------------
  // SHOT 5: Ananya on East Delivery Ramp with Plastic Crates & Ice Totes
  // ---------------------------------------------------------
  console.log('\n6. Switching to Ananya and capturing Shot 5: East delivery staging area...')
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
      engine.playerController.teleport(-17.0, 0.40, 93.0)
      const lookYaw = Math.PI / 2 // Looking West (-X) towards stacked fish crates, totes, and washdown station
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 4.6
      engine.thirdPersonCamera.pitch = 0.22
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset8_05_ananya_east_delivery_crates',
    'Ananya inspecting the East delivery staging area featuring multi-colored stacked plastic fish crates, insulated ice totes, and coiled washdown hose station'
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

runAsset8FishAuctionQA().catch((err) => {
  console.error('QA Script failed:', err)
  process.exit(1)
})
