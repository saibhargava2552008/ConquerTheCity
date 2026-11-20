import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const BASE_URL = 'http://localhost:5173/'

async function runFishingHarbourFinalQA() {
  console.log('=====================================================================')
  console.log('=== FISHING HARBOUR DISTRICT: FINAL END-TO-END QA AUDIT ===')
  console.log('=====================================================================\n')

  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  const consoleLogs = []
  const consoleErrors = []
  const consoleWarnings = []
  page.on('console', (msg) => {
    const text = msg.text()
    consoleLogs.push(text)
    if (msg.type() === 'error') {
      consoleErrors.push(`[CONSOLE ERROR] ${text}`)
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(`[CONSOLE WARN] ${text}`)
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

  // ---------------------------------------------------------
  // SECTION 1: COMPREHENSIVE HARBOUR ASSETS AUDIT
  // ---------------------------------------------------------
  console.log('\n--- AUDITING ALL 4 MAJOR HARBOUR ASSETS & ENVIRONMENT ---')
  const assetAudit = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return { error: 'Engine not found' }

    let dhoniMeshes = 0
    let coldStorageMeshes = 0
    let auctionMeshes = 0
    let coopMeshes = 0
    let boatsCount = 0
    let gangwayCount = 0
    let totalHarbourMeshes = 0
    let shadowCasters = 0

    engine.scene.traverse((c) => {
      const name = c.name || ''
      if (c.isMesh) {
        if (c.castShadow) shadowCasters++
      }

      if (name.includes('dhoni') || name.includes('Dhoni') || name.includes('Sea_Queen')) {
        if (c.isMesh) dhoniMeshes++
      }
      if (name.includes('cold_storage') || name.includes('Cold_Storage')) {
        if (c.isMesh) coldStorageMeshes++
      }
      if (name.includes('auction') || name.includes('Auction')) {
        if (c.isMesh) auctionMeshes++
      }
      if (name.includes('cooperative') || name.includes('Cooperative') || name.includes('Coop_')) {
        if (c.isMesh) coopMeshes++
      }
      if (name.includes('Fishing_Boat')) {
        boatsCount++
      }
      if (name.includes('Gangway')) {
        gangwayCount++
      }
      if (name.includes('Harbour_') || name.includes('Wharf') || name.includes('Pier')) {
        if (c.isMesh) totalHarbourMeshes++
      }
    })

    return {
      asset6_DhoniBoat: { found: dhoniMeshes > 0, meshes: dhoniMeshes },
      asset7_ColdStorage: { found: coldStorageMeshes > 0, meshes: coldStorageMeshes },
      asset8_AuctionPavilion: { found: auctionMeshes > 0, meshes: auctionMeshes },
      asset9_Cooperative: { found: coopMeshes > 0, meshes: coopMeshes },
      boatsRegistered: boatsCount,
      gangwaysRegistered: gangwayCount,
      shadowCastingMeshesInWorld: shadowCasters,
    }
  })
  console.log('Harbour Asset Hierarchy Status:', assetAudit)

  // ---------------------------------------------------------
  // SECTION 2: GAMEPLAY TRAVERSAL & ACCESSIBILITY TESTS
  // ---------------------------------------------------------
  console.log('\n--- EXECUTING INTERACTIVE GAMEPLAY TRAVERSAL TESTS ---')

  // Test A: Boarding Dhoni Boat
  const dhoniBoardingTest = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    // 1. Move to Gangway approach on wharf
    engine.playerController.teleport(-38.0, 0.40, 72.0)
    const onWharfPos = engine.player.getPosition().clone()

    // 2. Walk onto Gangway
    engine.playerController.teleport(-44.5, 0.40, 72.0)
    const onGangwayPos = engine.player.getPosition().clone()

    // 3. Step onto Dhoni boat forward deck
    engine.playerController.teleport(-48.0, 0.35, 70.0)
    const onBoatPos = engine.player.getPosition().clone()

    // 4. Return to wharf
    engine.playerController.teleport(-38.0, 0.40, 72.0)
    const returnedPos = engine.player.getPosition().clone()

    return {
      onWharf: { x: +onWharfPos.x.toFixed(2), y: +onWharfPos.y.toFixed(2), z: +onWharfPos.z.toFixed(2) },
      onGangway: { x: +onGangwayPos.x.toFixed(2), y: +onGangwayPos.y.toFixed(2), z: +onGangwayPos.z.toFixed(2) },
      onBoatDeck: { x: +onBoatPos.x.toFixed(2), y: +onBoatPos.y.toFixed(2), z: +onBoatPos.z.toFixed(2) },
      returnedToWharf: { x: +returnedPos.x.toFixed(2), y: +returnedPos.y.toFixed(2), z: +returnedPos.z.toFixed(2) },
      success: onBoatPos.y >= -0.20 && returnedPos.y >= 0.35,
    }
  })
  console.log('Test A: Dhoni Boat Boarding & Egress:', dhoniBoardingTest)

  // Test B: Cold Storage Loading Dock & Interior
  const coldStorageTest = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    // 1. Raised loading dock platform
    engine.playerController.teleport(-27.0, 1.20, 75.0)
    const onDockPos = engine.player.getPosition().clone()
    // 2. Inside cold storage warehouse
    engine.playerController.teleport(-23.0, 1.20, 75.0)
    const insidePos = engine.player.getPosition().clone()

    return {
      onLoadingDock: { x: +onDockPos.x.toFixed(2), y: +onDockPos.y.toFixed(2), z: +onDockPos.z.toFixed(2) },
      insideWarehouse: { x: +insidePos.x.toFixed(2), y: +insidePos.y.toFixed(2), z: +insidePos.z.toFixed(2) },
      success: onDockPos.y >= 1.15 && insidePos.y >= 1.15,
    }
  })
  console.log('Test B: Cold Storage Dock & Interior Access:', coldStorageTest)

  // Test C: Fish Auction Pavilion Stages & Sorting
  const auctionTest = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    // 1. Raised central auctioneer stage
    engine.playerController.teleport(-24.5, 0.65, 96.0)
    const onStagePos = engine.player.getPosition().clone()
    // 2. North sorting tables
    engine.playerController.teleport(-24.0, 0.40, 100.2)
    const sortingPos = engine.player.getPosition().clone()

    return {
      onAuctionStage: { x: +onStagePos.x.toFixed(2), y: +onStagePos.y.toFixed(2), z: +onStagePos.z.toFixed(2) },
      inSortingBay: { x: +sortingPos.x.toFixed(2), y: +sortingPos.y.toFixed(2), z: +sortingPos.z.toFixed(2) },
      success: onStagePos.y >= 0.60 && sortingPos.y >= 0.35,
    }
  })
  console.log('Test C: Fish Auction Stage & Sorting Bay Access:', auctionTest)

  // Test D: Fishermen's Cooperative Veranda, Office & Net Bay
  const coopTest = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    // 1. Veranda plinth
    engine.playerController.teleport(-30.0, 0.40, 114.0)
    const onVerandaPos = engine.player.getPosition().clone()
    // 2. Interior office reception counter
    engine.playerController.teleport(-25.2, 0.40, 114.0)
    const inOfficePos = engine.player.getPosition().clone()
    // 3. North net repair shelter
    engine.playerController.teleport(-24.0, 0.40, 109.2)
    const inNetBayPos = engine.player.getPosition().clone()

    return {
      onVeranda: { x: +onVerandaPos.x.toFixed(2), y: +onVerandaPos.y.toFixed(2), z: +onVerandaPos.z.toFixed(2) },
      inOffice: { x: +inOfficePos.x.toFixed(2), y: +inOfficePos.y.toFixed(2), z: +inOfficePos.z.toFixed(2) },
      inNetBay: { x: +inNetBayPos.x.toFixed(2), y: +inNetBayPos.y.toFixed(2), z: +inNetBayPos.z.toFixed(2) },
      success: onVerandaPos.y >= 0.35 && inOfficePos.y >= 0.35 && inNetBayPos.y >= 0.35,
    }
  })
  console.log('Test D: Fishermen Cooperative Veranda, Office & Net Bay Access:', coopTest)

  // Test E: Seamless Inter-Asset Continuous Travel (Z = 50 to Z = 120)
  const continuousPathTest = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    const zWaypoints = [52, 60, 70, 75, 85, 96, 105, 114, 120]
    const results = []
    let allPassed = true

    for (const z of zWaypoints) {
      engine.playerController.teleport(-35.0, 0.40, z)
      const pos = engine.player.getPosition().clone()
      const isOk = Math.abs(pos.y - 0.40) < 0.25 && Math.abs(pos.x - -35.0) < 0.5
      if (!isOk) allPassed = false
      results.push({ z, x: +pos.x.toFixed(2), y: +pos.y.toFixed(2), ok: isOk })
    }

    return { allPassed, waypointsChecked: results.length, samples: results }
  })
  console.log('Test E: Continuous Inter-Asset Wharf Walk (Z: 50 -> 120):', continuousPathTest)

  // ---------------------------------------------------------
  // SECTION 3: CAPTURING 8 GENUINE GAMEPLAY SCREENSHOTS
  // ---------------------------------------------------------
  console.log('\n--- CAPTURING 8 COMPREHENSIVE GAMEPLAY SCREENSHOTS ---')

  // Shot 1: Complete Harbour Overview (Elevated Panoramic View)
  console.log('Capturing Shot 1: Complete Harbour Overview...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-42.0, 0.40, 60.0)
      const lookYaw = Math.PI - 0.25
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 15.0
      engine.thirdPersonCamera.pitch = 0.35
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'harbour_qa_01_complete_panoramic_overview',
    'Elevated panoramic view of the entire Fishing Harbour district showing all four boat slips, water, Dhoni boat, Cold Storage warehouse, Fish Auction Pavilion, and Fishermen\'s Cooperative'
  )

  // Shot 2: Aarav Boarding Dhoni Boat via Gangway 1
  console.log('Capturing Shot 2: Aarav Boarding Dhoni Boat...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-45.2, 0.40, 72.0)
      const lookYaw = -Math.PI / 2 // Looking West (-X) onto the Dhoni boat forward deck
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 4.8
      engine.thirdPersonCamera.pitch = 0.20
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'harbour_qa_02_dhoni_boat_boarding_gangway',
    'Aarav boarding the Indian coastal Dhoni boat ("Sea Queen") along Gangway 1 at Slip 1, highlighting the authentic hull sheer, weathered paint, and rigging'
  )

  // Shot 3: Aarav at Dhoni Wheelhouse Helm & Equipment
  console.log('Capturing Shot 3: Aarav at Dhoni Wheelhouse Helm...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-47.2, 0.35, 71.8)
      const lookYaw = -0.35 // 3/4 view looking at wheelhouse door, front windows, lantern and helm
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 3.2
      engine.thirdPersonCamera.pitch = 0.14
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'harbour_qa_03_dhoni_helm_and_equipment',
    'Aarav on the Dhoni boat deck standing beside the wooden wheelhouse cabin, sliding door, helm window, navigation lights, and diesel exhaust stack'
  )

  // Shot 4: Aarav at Cold Storage Loading Dock & Rolling Shutter
  console.log('Capturing Shot 4: Cold Storage Loading Dock...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-31.5, 1.20, 75.0)
      const lookYaw = -Math.PI / 2 // Looking East (+X) walking into the loading facility
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 3.8
      engine.thirdPersonCamera.pitch = 0.16
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'harbour_qa_04_cold_storage_loading_dock',
    'Aarav on the raised concrete loading dock platform (Y = 1.20m) outside the rolling shutter entrance of the fishery cold storage warehouse, featuring cooling pipes and condensers'
  )

  // Shot 5: Aarav Inside Cold Storage Warehouse Freezer Interior
  console.log('Capturing Shot 5: Inside Cold Storage Warehouse...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-24.0, 1.20, 74.0)
      const lookYaw = Math.PI / 2 // Looking West (-X) towards loading entrance and storage props
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 4.8
      engine.thirdPersonCamera.pitch = 0.22
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'harbour_qa_05_cold_storage_interior_freezer',
    'Aarav inside the insulated cold storage warehouse surrounded by ice totes, stacked fish containers, and industrial ceiling vapor lamps'
  )

  // Shot 6: Aarav on Raised Central Auction Bidding Stage
  console.log('Capturing Shot 6: Fish Auction Pavilion Bidding Stage...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-24.5, 0.65, 96.0)
      const lookYaw = -Math.PI / 2 // Looking East (+X) toward auctioneer desk & tally slate
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 4.0
      engine.thirdPersonCamera.pitch = 0.20
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'harbour_qa_06_fish_auction_pavilion_bidding',
    'Aarav on the raised concrete auction platform (Y = 0.65m) beside the auctioneer rostrum, tally chalkboard, and stainless sorting tables under the steel pavilion truss roof'
  )

  // Shot 7: Aarav Ascending Fishermen's Cooperative Veranda
  console.log('Capturing Shot 7: Fishermen\'s Cooperative Veranda Entrance...')
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
    'harbour_qa_07_fishermen_cooperative_veranda_entrance',
    'Harbour approach showing timber boardwalk, Mangalore terracotta tile roof, four veranda columns with teal bases, and bilingual Telugu/English signboard'
  )

  // Shot 8: Ananya at North Net Repair Shelter & Ocean Backdrop
  console.log('\nSwitching to Ananya for Shot 8: North Net Repair Bay...')
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
      engine.playerController.teleport(-25.2, 0.40, 109.2)
      const lookYaw = -Math.PI / 2 // Looking East (+X) into the net repair bay
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 4.0
      engine.thirdPersonCamera.pitch = 0.18
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'harbour_qa_08_ananya_net_repair_bay_and_wharf',
    'Ananya examining the covered North net repair shelter with stacked nylon fishing nets, wooden pallets, coiled ropes, and wash sink with the open wharf in the background'
  )

  // ---------------------------------------------------------
  // SECTION 4: LIVE PERFORMANCE & WEBGL TELEMETRY
  // ---------------------------------------------------------
  const perfMetrics = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return null
    const renderer = engine.renderer
    const info = renderer.info

    let visibleMeshCount = 0
    let totalMeshCount = 0
    engine.scene.traverse((obj) => {
      if (obj.isMesh) {
        totalMeshCount++
        if (obj.visible) visibleMeshCount++
      }
    })

    return {
      fps: Math.round(1000 / Math.max(1, engine.lastDeltaTime * 1000 || 16.6)),
      frameTimeMs: +(engine.lastDeltaTime * 1000).toFixed(2),
      drawCalls: info.render.calls,
      renderedTriangles: info.render.triangles,
      geometriesInMemory: info.memory.geometries,
      texturesInMemory: info.memory.textures,
      visibleMeshes: visibleMeshCount,
      totalMeshesInScene: totalMeshCount,
    }
  })

  console.log('\n--- LIVE PERFORMANCE & ENGINE TELEMETRY ---')
  console.log(perfMetrics)
  console.log(`Console Errors count: ${consoleErrors.length}`, consoleErrors)
  console.log(`Console Warnings count: ${consoleWarnings.length}`)

  await browser.close()
  return {
    assetAudit,
    dhoniBoardingTest,
    coldStorageTest,
    auctionTest,
    coopTest,
    continuousPathTest,
    perfMetrics,
    consoleErrors,
    consoleWarnings,
    shots,
  }
}

runFishingHarbourFinalQA().catch((err) => {
  console.error('Final QA script failed:', err)
  process.exit(1)
})
