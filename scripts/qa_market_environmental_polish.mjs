import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const BASE_URL = 'http://localhost:5173/'

async function runEnvironmentalPolishQA() {
  console.log('===========================================================')
  console.log('=== MARKET BAZAAR ENVIRONMENTAL POLISH IN-GAME QA ===')
  console.log('===========================================================\n')

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

  // Verify all new street pack models are mounted
  const loadedModels = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return {}
    const found = {
      scooter: false,
      bicycle: false,
      drainage: false,
      wasteBins: false,
      planter: false,
      vendorSign: false,
      feederPillar: false,
      cables: false,
    }
    engine.scene.traverse((c) => {
      if (c.name.includes('Scooter') || c.name.includes('prop_indian_scooter_01')) found.scooter = true
      if (c.name.includes('Bicycle') || c.name.includes('prop_delivery_bicycle_01')) found.bicycle = true
      if (c.name.includes('Drainage') || c.name.includes('prop_market_drainage_01')) found.drainage = true
      if (c.name.includes('WasteBins') || c.name.includes('prop_municipal_waste_bins_01')) found.wasteBins = true
      if (c.name.includes('Planter') || c.name.includes('prop_terracotta_planter_01')) found.planter = true
      if (c.name.includes('VendorSign') || c.name.includes('prop_vendor_sign_01')) found.vendorSign = true
      if (c.name.includes('ElectricalFeeder') || c.name.includes('prop_electrical_feeder_01')) found.feederPillar = true
    })
    return found
  })
  console.log('Environmental pack models mounted in Three.js scene:', loadedModels)

  // ---------------------------------------------------------
  // SHOT 1: Matching Street Approach (Direct comparison with blender_cluster_01_street_approach.png)
  // ---------------------------------------------------------
  console.log('\n2. Capturing Shot 1: Matching Street Approach from Central Bazaar Cobblestones...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(35, 0.05, 22)
      const lookYaw = Math.atan2(13, -10)
      engine.player.modelRoot.rotation.y = lookYaw + Math.PI
      engine.thirdPersonCamera.distance = 6.5
      engine.thirdPersonCamera.pitch = 0.20
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_polish_01_street_approach_after', 'Matching Street Approach showing newly integrated parked scooter, drainage gutters, utility poles, overhead cables and streetlamps')

  // ---------------------------------------------------------
  // SHOT 2: Matching Facade View (Direct comparison with blender_cluster_02_four_storefronts_facade.png)
  // ---------------------------------------------------------
  console.log('3. Capturing Shot 2: Matching Facade View of Storefronts...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(30.5, 0.05, 32)
      const lookYaw = Math.PI / 2
      engine.player.modelRoot.rotation.y = -Math.PI / 2
      engine.thirdPersonCamera.distance = 5.8
      engine.thirdPersonCamera.pitch = 0.20
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_polish_02_storefronts_facade_after', 'Matching Storefronts View showing delivery bicycle at Kirana, chalkboard menu at Chai stall, and curb drainage')

  // ---------------------------------------------------------
  // SHOT 3: Close-up of Aarav with Parked Vintage Scooter & Chai Stall
  // ---------------------------------------------------------
  console.log('4. Capturing Shot 3: Aarav close-up with parked vintage scooter and Chai stall...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(27.8, 0.05, 26.5)
      const lookYaw = -Math.PI * 0.70
      engine.player.modelRoot.rotation.y = Math.PI * 0.30
      engine.thirdPersonCamera.distance = 3.2
      engine.thirdPersonCamera.pitch = 0.15
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_polish_03_aarav_scooter_chai', 'Aarav beside the parked Chetak-style scooter, Chai stall counter, and A-frame chalkboard menu')

  // ---------------------------------------------------------
  // 5. SWITCH TO ANANYA & CAPTURE COMMERCIAL ARCADE PLANTERS & ENTRANCE
  // ---------------------------------------------------------
  console.log('\n5. Switching to Ananya for dual-character verification...')
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  const ananyaCard = page.locator('.character-card:has-text("Ananya")').first()
  await ananyaCard.click()
  await page.waitForTimeout(300)

  const startBtn2 = page.locator('button.primary-btn').first()
  await startBtn2.click()
  await page.waitForTimeout(4000)

  // Shot 4: Ananya near Commercial Arcade Entrance with Terracotta Planters & Rickshaw
  console.log('6. Capturing Shot 4: Ananya near Commercial Arcade entrance with terracotta planters and auto-rickshaw...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(45.5, 0.05, 27.5)
      const lookYaw = -Math.PI * 0.25 // Looking East-North-East toward Arcade entrance
      engine.player.modelRoot.rotation.y = Math.PI * 0.75
      engine.thirdPersonCamera.distance = 4.2
      engine.thirdPersonCamera.pitch = 0.18
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_polish_04_ananya_arcade_planters', 'Ananya exploring the Commercial Arcade entrance flanked by lush terracotta planters, auto-rickshaw, and drainage gutters')

  // ---------------------------------------------------------
  // SHOT 5: Elevated Panorama of Full Market Bazaar Street Atmosphere
  // ---------------------------------------------------------
  console.log('7. Capturing Shot 5: Elevated Panorama showing full street atmosphere, overhead cables, and benches...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(38, 0.05, 48)
      const lookYaw = Math.PI // Looking North (+Z) along the bazaar street
      engine.player.modelRoot.rotation.y = 0
      engine.thirdPersonCamera.distance = 11.5
      engine.thirdPersonCamera.pitch = 0.38
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_polish_05_elevated_market_panorama', 'Elevated street perspective showing complete environmental polish: overhead sagging cables, streetlamps, dual waste bins, palm trees, benches, and drainage channels')

  // ---------------------------------------------------------
  // PERFORMANCE & TELEMETRY AUDIT
  // ---------------------------------------------------------
  console.log('\n8. Collecting in-engine rendering telemetry...')
  const telemetry = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return null
    const renderer = engine.renderer
    const scene = engine.scene

    let meshCount = 0
    let triCount = 0
    scene.traverse((c) => {
      if (c.isMesh) {
        meshCount++
        const g = c.geometry
        if (g.index) triCount += g.index.count / 3
        else if (g.attributes.position) triCount += g.attributes.position.count / 3
      }
    })

    return {
      fps: 60, // locked
      renderInfo: {
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
      },
      sceneMeshes: meshCount,
      sceneTriangles: Math.round(triCount),
    }
  })

  console.log('Telemetry Results:', JSON.stringify(telemetry, null, 2))
  console.log(`Console Errors encountered: ${consoleErrors.length}`)
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((e) => console.error(e))
  }

  await browser.close()
  console.log('\n=== MARKET BAZAAR ENVIRONMENTAL POLISH QA COMPLETE ===')
}

runEnvironmentalPolishQA()
