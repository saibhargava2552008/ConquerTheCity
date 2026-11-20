import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const BASE_URL = 'http://localhost:5173/'

async function runAsset6DhoniBoatQA() {
  console.log('===========================================================')
  console.log('=== FISHING HARBOUR ASSET 6: INDIAN DHONI BOAT IN-GAME QA ===')
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

  // Verify Blender Dhoni Boat model is mounted in Three.js scene
  const loadedCheck = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return { foundBoat: false, meshCount: 0 }
    let foundBoat = false
    let boatMeshes = 0
    engine.scene.traverse((c) => {
      if (c.name.includes('Boat') || c.name.includes('prop_indian_dhoni_boat_01') || c.name.includes('Sea_Queen')) {
        foundBoat = true
        if (c.isMesh) boatMeshes++
      }
    })
    return { foundBoat, boatMeshes }
  })
  console.log('Blender Dhoni Boat mount check:', loadedCheck)

  // ---------------------------------------------------------
  // SHOT 1: Harbour Wharf Approach looking at Moored Dhoni Boat & Gangway 1
  // ---------------------------------------------------------
  console.log('\n2. Capturing Shot 1: Harbour Wharf Approach looking West toward Moored Dhoni Boat...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-38.5, 0.40, 72.0)
      const lookYaw = Math.PI / 2 // Looking West (-X) towards boat slip and open water
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 6.0
      engine.thirdPersonCamera.pitch = 0.15
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('asset6_01_harbour_wharf_approach', 'Harbour Wharf pedestrian deck approach showing timber wharf, Gangway 1, and the newly integrated Indian Dhoni Boat moored at Slip 1')

  // ---------------------------------------------------------
  // SHOT 2: Aarav Boarding via Gangway 1 onto Boat Deck
  // ---------------------------------------------------------
  console.log('3. Capturing Shot 2: Aarav boarding via Gangway 1...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-44.5, 0.35, 72.0)
      const lookYaw = Math.PI / 2 // Walking West across gangway
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 3.8
      engine.thirdPersonCamera.pitch = 0.14
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('asset6_02_aarav_boarding_gangway', 'Aarav walking across Gangway 1 at Y = 0.35m entering through the starboard boarding opening directly onto the boat deck')

  // ---------------------------------------------------------
  // SHOT 3: Aarav on Boat Deck inspecting Fishing Nets, Crates, Buoys & Winch
  // ---------------------------------------------------------
  console.log('4. Capturing Shot 3: Aarav inspecting deck fishing gear...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-48.0, 0.35, 73.0)
      const lookYaw = -Math.PI * 0.35 // Looking South-West across foredeck equipment and nets
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 3.2
      engine.thirdPersonCamera.pitch = 0.18
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('asset6_03_aarav_deck_equipment', 'Aarav on the walkable wooden deck inspecting stacked emerald fishing nets, marine float buoys, fish crates, cargo hatch, and hauling capstan')

  // ---------------------------------------------------------
  // SHOT 4: Elevated Harbour Panorama showing Dhoni Boat & Procedural Boats
  // ---------------------------------------------------------
  console.log('5. Capturing Shot 4: Elevated Harbour Panorama...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-37.0, 0.40, 56.0)
      const lookYaw = Math.PI * 0.82 // Looking North-West across open wharf and boat slips
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 15.0
      engine.thirdPersonCamera.pitch = 0.28
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('asset6_04_harbour_panoramic_overview', 'Elevated wide-angle view of Fishing Harbour showing the high-fidelity Blender Dhoni Boat at Slip 1 alongside the remaining procedural boats and wharves')

  // ---------------------------------------------------------
  // 6. SWITCH TO ANANYA & CAPTURE BOAT HELM & WHEELHOUSE
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

  // Shot 5: Ananya at the Boat Wheelhouse & Helm
  console.log('7. Capturing Shot 5: Ananya at the boat wheelhouse and helm...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-47.2, 0.35, 71.8)
      const lookYaw = -0.35 // 3/4 view looking at wheelhouse door, front windows, and lantern
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 3.2
      engine.thirdPersonCamera.pitch = 0.14
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap('asset6_05_ananya_helm_wheelhouse', 'Ananya on the boat deck beside the wooden wheelhouse cabin, sliding door, helm window, navigation lights, and diesel exhaust stack')

  // Query performance metrics
  const perfMetrics = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return {}
    return {
      drawCalls: engine.renderer.info.render.calls,
      triangles: engine.renderer.info.render.triangles,
      geometries: engine.renderer.info.memory.geometries,
      textures: engine.renderer.info.memory.textures,
    }
  })
  console.log('\n--- Real-Time Three.js Renderer Metrics at Fishing Harbour ---')
  console.log('Draw calls:', perfMetrics.drawCalls)
  console.log('Rendered triangles:', perfMetrics.triangles)
  console.log('Active geometries:', perfMetrics.geometries)
  console.log('Active textures:', perfMetrics.textures)

  await browser.close()
  console.log('\n✅ Asset 6 Dhoni Boat QA completed successfully!')
  return { shots, perfMetrics, consoleErrors }
}

runAsset6DhoniBoatQA().catch((err) => {
  console.error('QA Runner error:', err)
  process.exit(1)
})
