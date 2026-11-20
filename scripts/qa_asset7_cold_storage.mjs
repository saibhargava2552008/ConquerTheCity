import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const BASE_URL = 'http://localhost:5173/'

async function runAsset7ColdStorageQA() {
  console.log('=====================================================================')
  console.log('=== FISHING HARBOUR ASSET 7: FISHERY COLD STORAGE IN-GAME QA ===')
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

  // Verify Blender Fishery Cold Storage model is mounted in Three.js scene
  const loadedCheck = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return { foundWarehouse: false, meshCount: 0 }
    let foundWarehouse = false
    let warehouseMeshes = 0
    engine.scene.traverse((c) => {
      if (
        c.name.includes('Cold_Storage') ||
        c.name.includes('building_fishery_cold_storage_01') ||
        c.name.includes('Warehouse')
      ) {
        foundWarehouse = true
        if (c.isMesh) warehouseMeshes++
      }
    })
    return { foundWarehouse, warehouseMeshes }
  })
  console.log('Blender Fishery Cold Storage mount check:', loadedCheck)

  // ---------------------------------------------------------
  // SHOT 1: Harbour Wharf Approach looking East at loading dock & facade
  // ---------------------------------------------------------
  console.log('\n2. Capturing Shot 1: Harbour Wharf Approach looking East toward Cold Storage...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-38.5, 0.40, 75.0)
      const lookYaw = -Math.PI / 2 // Looking East (+X) towards warehouse loading dock & entrance
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 7.5
      engine.thirdPersonCamera.pitch = 0.18
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset7_01_harbour_wharf_approach',
    'Harbour Wharf approach showing timber boardwalk, concrete loading dock with rubber bumpers, cantilevered canopy, and bilingual cooperative signboard'
  )

  // ---------------------------------------------------------
  // SHOT 2: Aarav Ascending South Dock Stairs onto Raised Platform
  // ---------------------------------------------------------
  console.log('3. Capturing Shot 2: Aarav ascending South dock stairs...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-33.0, 0.60, 65.0)
      const lookYaw = Math.PI // Facing positive Z looking up the stairs toward loading dock
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 4.2
      engine.thirdPersonCamera.pitch = 0.20
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset7_02_aarav_ascending_dock_stairs',
    'Aarav ascending South loading dock stairs with galvanized steel handrails onto the raised 1.20m concrete loading platform'
  )

  // ---------------------------------------------------------
  // SHOT 3: Aarav Walking Through Central Shutter Entrance
  // ---------------------------------------------------------
  console.log('4. Capturing Shot 3: Aarav entering central loading doorway past PVC curtains...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-31.5, 1.20, 75.0)
      const lookYaw = -Math.PI / 2 // Looking East (+X) walking into the facility
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 3.6
      engine.thirdPersonCamera.pitch = 0.15
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset7_03_aarav_central_loading_entrance',
    'Aarav passing through the 6.0m central loading entrance beneath the corrugated rolling shutter and translucent PVC refrigeration strip curtains'
  )

  // ---------------------------------------------------------
  // SHOT 4: Interior Warehouse Floor with Cold Storage Crates & Totes
  // ---------------------------------------------------------
  console.log('5. Capturing Shot 4: Warehouse interior floor showing cold storage props...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-24.0, 1.20, 74.0)
      const lookYaw = Math.PI / 2 // Looking West (-X) towards loading entrance and storage props
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 5.0
      engine.thirdPersonCamera.pitch = 0.25
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset7_04_interior_warehouse_crates',
    'Warehouse interior concrete floor showing stacked blue and terracotta fish crates, ISOTERM insulated ice totes, timber pallets, and hand pallet jack'
  )

  // ---------------------------------------------------------
  // SHOT 5: Ananya Inspecting South Equipment Pad with Chiller Units
  // ---------------------------------------------------------
  console.log('\n6. Switching to Ananya and capturing Shot 5: South refrigeration chiller bank...')
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
      engine.playerController.teleport(-20.25, 0.40, 59.5)
      const lookYaw = Math.PI // Looking positive Z toward South equipment pad & chiller bank
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 5.2
      engine.thirdPersonCamera.pitch = 0.22
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'asset7_05_ananya_south_refrigeration_pad',
    'Ananya inspecting the South concrete equipment pad featuring dual industrial axial fan condensing chillers and insulated copper refrigerant piping'
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

runAsset7ColdStorageQA().catch((err) => {
  console.error('QA Script failed:', err)
  process.exit(1)
})
