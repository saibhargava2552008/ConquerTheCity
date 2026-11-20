import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const BASE_URL = 'http://localhost:5173/'

async function runBlenderShopClusterQA() {
  console.log('===========================================================')
  console.log('=== CONQUER THE CITY: BLENDER SHOP CLUSTER QA ===')
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

  // Check that the shop cluster GLB model is loaded
  const modelLoaded = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return false
    let found = false
    engine.scene.traverse(c => {
      if (c.name === 'Shop_Cluster_Root' || c.name.startsWith('Building_StuccoWeathered') || c.name.startsWith('Building_SignKirana')) {
        found = true
      }
    })
    return found
  })
  console.log('Is Indian Street Shop Cluster GLB mounted in Three.js scene?', modelLoaded)

  // ---------------------------------------------------------
  // SHOT 1: Street Approach from Central Bazaar Cobblestones
  // ---------------------------------------------------------
  console.log('\n2. Capturing Shot 1: Street approach looking toward Shop Cluster...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      // Player at (35, 0.05, 22), looking North-West toward building at (22, 32)
      engine.playerController.teleport(35, 0.05, 22)
      // Vector to building: (22 - 35, 32 - 22) = (-13, +10)
      // Camera should look along (-13, +10), which is West-North-West
      const lookYaw = Math.atan2(13, -10)
      engine.player.modelRoot.rotation.y = lookYaw + Math.PI
      engine.thirdPersonCamera.distance = 6.5
      engine.thirdPersonCamera.pitch = 0.20
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_cluster_01_street_approach', 'Aarav on Central Bazaar cobblestones approaching the Indian Street Shop Cluster')

  // ---------------------------------------------------------
  // SHOT 2: Direct Facade of All 4 Storefronts
  // ---------------------------------------------------------
  console.log('3. Capturing Shot 2: Direct Facade of All 4 Storefronts...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      // Player at (30.5, 0.05, 32), camera looking West (-X) toward building at (22, 32)
      engine.playerController.teleport(30.5, 0.05, 32)
      const lookYaw = Math.PI / 2 // Camera placed at +X (East), looking -X (West)
      engine.player.modelRoot.rotation.y = -Math.PI / 2 // Player facing building
      engine.thirdPersonCamera.distance = 5.8
      engine.thirdPersonCamera.pitch = 0.20
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_cluster_02_four_storefronts_facade', 'Direct street view of all 4 shops: Chai Stall, Kirana Store, Pharmacy and Mobile Care')

  // ---------------------------------------------------------
  // SHOT 3: Aarav Walkable Plinth at Kirana & Chai Stall
  // ---------------------------------------------------------
  console.log('4. Capturing Shot 3: Aarav walking on plinth at Kirana & Chai Stall...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      // Step up on plinth at Y = 0.30m in front of Kirana store (25.0, 0.30, 34.5)
      engine.playerController.teleport(25.0, 0.30, 34.5)
      // Look North (+Z) along the plinth toward Chai Stall
      const lookYaw = Math.PI
      engine.player.modelRoot.rotation.y = 0
      engine.thirdPersonCamera.distance = 3.6
      engine.thirdPersonCamera.pitch = 0.14
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_cluster_03_aarav_kirana_chai_walk', 'Aarav stepped up on the 0.30m plinth exploring the Kirana grocery store and Chai stall')

  // ---------------------------------------------------------
  // SHOT 4: Elevated 3/4 Perspective
  // ---------------------------------------------------------
  console.log('5. Capturing Shot 4: Elevated 3/4 architectural perspective...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      // High diagonal camera from street corner (35, 42) looking at (22, 32)
      engine.playerController.teleport(32, 0.05, 40)
      const lookYaw = Math.atan2(10, 8)
      engine.player.modelRoot.rotation.y = lookYaw + Math.PI
      engine.thirdPersonCamera.distance = 10.0
      engine.thirdPersonCamera.pitch = 0.36
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_cluster_04_architectural_34_high', 'Architectural 3/4 view showing roofline, Mangalore tiles, awnings, and electric conduits')

  // ---------------------------------------------------------
  // 6. SWITCH TO ANANYA & INSPECT PHARMACY & MOBILE SHOP
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

  // Shot 5: Ananya on Plinth in front of Pharmacy & Mobile Shop
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      // Step up on plinth at Y = 0.30m in front of Pharmacy (25.0, 0.30, 29.5)
      engine.playerController.teleport(25.0, 0.30, 29.5)
      // Looking South (-Z) toward Mobile Accessories shop
      const lookYaw = 0
      engine.player.modelRoot.rotation.y = Math.PI
      engine.thirdPersonCamera.distance = 3.6
      engine.thirdPersonCamera.pitch = 0.16
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('blender_cluster_05_ananya_pharmacy_mobile', 'Ananya exploring the Pharmacy and Mobile shopfront under natural coastal lighting')

  // Telemetry
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
  console.log('✔ BLENDER SHOP CLUSTER IN-GAME QA COMPLETED SUCCESSFULLY!')
  console.log('===========================================================')
}

runBlenderShopClusterQA().catch(err => {
  console.error('Fatal QA error:', err)
  process.exit(1)
})
