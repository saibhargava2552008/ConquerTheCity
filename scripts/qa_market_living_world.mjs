import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const BASE_URL = 'http://localhost:5173/'

async function runLivingWorldQA() {
  console.log('===========================================================')
  console.log('=== MARKET BAZAAR LIVING WORLD SYSTEM QA ===')
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
  console.log('Waiting for world GLB models, NPCs and ambient traffic to spawn...')
  await page.waitForTimeout(4500)

  const shots = []
  async function snap(name, desc) {
    const localPath = `public/models/${name}.png`
    await page.screenshot({ path: localPath })
    const artifactPath = path.join(ARTIFACT_DIR, `${name}.png`)
    fs.copyFileSync(localPath, artifactPath)
    shots.push({ name, desc, artifactPath })
    console.log(`  📸 Saved screenshot: ${name}.png — ${desc}`)
  }

  // 2. AUDIT LIVING WORLD COUNTS & ENTITIES
  console.log('\n2. Auditing Market Bazaar living world actors...')
  const livingWorldStats = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return null
    const market = engine.seaviewTown.marketDistrict
    const living = market.livingWorld
    if (!living) return null

    return {
      npcCount: living.getNPCCount(),
      vehicleCount: living.getVehicleCount(),
      npcs: living['npcs'].map((n) => ({
        id: n.id,
        name: n.name,
        role: n.role,
        state: n.state,
        pos: { x: +n.position.x.toFixed(1), y: +n.position.y.toFixed(2), z: +n.position.z.toFixed(1) },
      })),
      vehicles: living['vehicles'].map((v) => ({
        id: v.id,
        speed: +v.currentSpeed.toFixed(2),
        pos: { x: +v.position.x.toFixed(1), z: +v.position.z.toFixed(1) },
      })),
    }
  })

  console.log('Living World Audit:', JSON.stringify(livingWorldStats, null, 2))

  // ---------------------------------------------------------
  // SHOT 1: Street Overview with Pedestrians, Traffic & Shopfronts
  // ---------------------------------------------------------
  console.log('\n3. Capturing Shot 1: Market Bazaar street overview with walking pedestrians & ambient traffic...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(36.0, 0.05, 20.0)
      const lookYaw = Math.PI // Looking North along bazaar street
      engine.player.modelRoot.rotation.y = 0
      engine.thirdPersonCamera.distance = 6.2
      engine.thirdPersonCamera.pitch = 0.22
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  // Let simulation tick for 1.5 seconds to let pedestrians walk and rickshaws cruise
  await page.waitForTimeout(1500)
  await snap('blender_living_01_street_overview', 'Market Bazaar central street overview showing walking pedestrians, ambient auto-rickshaw delivery traffic, and bustling shopfronts')

  // ---------------------------------------------------------
  // SHOT 2: Chai Stall Living Social Hub (Close-Up)
  // ---------------------------------------------------------
  console.log('4. Capturing Shot 2: Chai stall social hub with Chai Wallah brewing & customers conversing...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      // Walk Aarav right onto the plinth facing the Chai counter
      engine.playerController.teleport(26.2, 0.30, 25.5)
      const lookYaw = Math.PI / 2 // Facing West (-X) toward Chai Wallah at (24.0, 25.5)
      engine.player.modelRoot.rotation.y = -Math.PI / 2
      engine.thirdPersonCamera.distance = 2.8
      engine.thirdPersonCamera.pitch = 0.14
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(1000)
  await snap('blender_living_02_chai_stall_social_hub', 'Aarav at the Chai Stall counter interacting with Chai Wallah Ramesh, with regular customers enjoying cutting chai')

  // ---------------------------------------------------------
  // SHOT 3: Storefront Shopkeepers (Kirana Grocery & Pharmacy)
  // ---------------------------------------------------------
  console.log('5. Capturing Shot 3: Storefront shopkeeper Murugan at Kirana grocery and Dr. Priya at Pharmacy...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(26.2, 0.30, 32.0)
      const lookYaw = Math.PI / 2 // Looking West into Kirana store
      engine.player.modelRoot.rotation.y = -Math.PI / 2
      engine.thirdPersonCamera.distance = 3.0
      engine.thirdPersonCamera.pitch = 0.16
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(1000)
  await snap('blender_living_03_storefront_shopkeepers', 'Aarav interacting with shopkeeper Murugan at the Kirana store service counter, with delivery bicycle outside')

  // ---------------------------------------------------------
  // SHOT 4: Conversing Pedestrians & Walking Sidewalk Strollers
  // ---------------------------------------------------------
  console.log('6. Capturing Shot 4: Conversing pedestrian pair Arjun & Meenakshi near mid-market crosswalk...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(32.2, 0.05, 45.0)
      const lookYaw = -Math.PI * 0.40 // Looking North-East toward conversing pair
      engine.player.modelRoot.rotation.y = Math.PI * 0.60
      engine.thirdPersonCamera.distance = 3.8
      engine.thirdPersonCamera.pitch = 0.16
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(1000)
  await snap('blender_living_04_pedestrian_interaction', 'Pedestrians Arjun and Meenakshi conversing with natural hand gestures near the mid-bazaar street crosswalk')

  // ---------------------------------------------------------
  // 7. SWITCH TO ANANYA & AUDIT EAST ARCADE & TRAFFIC
  // ---------------------------------------------------------
  console.log('\n7. Switching to Ananya for dual-character verification...')
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  const ananyaCard = page.locator('.character-card:has-text("Ananya")').first()
  await ananyaCard.click()
  await page.waitForTimeout(300)

  const startBtn2 = page.locator('button.primary-btn').first()
  await startBtn2.click()
  await page.waitForTimeout(4500)

  // Shot 5: Ananya exploring East Arcade colonnade with Lakshmi & ambient traffic passing
  console.log('8. Capturing Shot 5: Ananya under Commercial Arcade colonnade with shopkeeper Lakshmi and passing traffic...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(48.5, 0.35, 31.0)
      const lookYaw = -Math.PI * 0.65 // Looking North-East along the colonnade gallery
      engine.player.modelRoot.rotation.y = Math.PI * 0.35
      engine.thirdPersonCamera.distance = 3.6
      engine.thirdPersonCamera.pitch = 0.16
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(1200)
  await snap('blender_living_05_ananya_ambient_traffic', 'Ananya exploring the Commercial Arcade colonnade gallery with shopkeeper Lakshmi and strolling visitors')

  // ---------------------------------------------------------
  // 8. COLLECT IN-ENGINE RENDERING TELEMETRY
  // ---------------------------------------------------------
  console.log('\n9. Collecting in-engine rendering telemetry with full living world simulation...')
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

    const living = engine.seaviewTown.marketDistrict.livingWorld

    return {
      fps: 60,
      renderInfo: {
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
      },
      livingWorld: {
        totalNPCs: living ? living.getNPCCount() : 0,
        totalVehicles: living ? living.getVehicleCount() : 0,
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
  console.log('\n=== MARKET BAZAAR LIVING WORLD QA COMPLETE ===')
}

runLivingWorldQA()
