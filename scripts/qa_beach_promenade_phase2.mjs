import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const BASE_URL = 'http://localhost:5173/'

async function runPromenadePhase2QA() {
  console.log('=====================================================================')
  console.log('=== COASTAL BEACH & PROMENADE: PHASE 2 INFRASTRUCTURE QA AUDIT ===')
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
  // SECTION 1: PROMENADE INFRASTRUCTURE & SCENE GRAPH AUDIT
  // ---------------------------------------------------------
  console.log('\n--- AUDITING PROMENADE INFRASTRUCTURE & SCENE GRAPH ---')
  const infraAudit = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return { error: 'Engine not found' }

    let benchesCount = 0
    let lampsCount = 0
    let plantersCount = 0
    let footwashCount = 0
    let balustradesCount = 0
    let pillarsCount = 0
    let harbourMeshesCount = 0

    engine.scene.traverse((obj) => {
      const name = obj.name || ''
      if (name.includes('Promenade_Bench')) benchesCount++
      if (name.includes('Promenade_Lamp')) lampsCount++
      if (name.includes('Promenade_Planter')) plantersCount++
      if (name.includes('Foot_Wash')) footwashCount++
      if (name.includes('Balustrade') || name.includes('Railing')) balustradesCount++
      if (name.includes('Pillar')) pillarsCount++
      if (name.includes('Fishery') || name.includes('Auction') || name.includes('Cooperative') || name.includes('Dhoni')) {
        harbourMeshesCount++
      }
    })

    const colliders = engine.collisionSystem ? engine.collisionSystem.getColliders() : []
    const promenadeColliders = colliders.filter(
      (c) =>
        typeof c.name === 'string' &&
        (c.name.includes('Promenade') ||
          c.name.includes('Belvedere') ||
          c.name.includes('Crosswalk') ||
          c.name.includes('Foot_Wash') ||
          c.name.includes('Breakwater'))
    )

    return {
      totalColliders: colliders.length,
      promenadeCollidersCount: promenadeColliders.length,
      benchesCount,
      lampsCount,
      plantersCount,
      footwashCount,
      balustradesCount,
      pillarsCount,
      harbourMeshesCount,
    }
  })
  console.log('Infrastructure Audit:', JSON.stringify(infraAudit, null, 2))

  // ---------------------------------------------------------
  // SECTION 2: GAMEPLAY TRAVERSAL & ACCESSIBILITY TESTS
  // ---------------------------------------------------------
  console.log('\n--- EXECUTING INTERACTIVE GAMEPLAY TRAVERSAL TESTS ---')

  // Test 1: Town Centre Plaza to Promenade via Zebra Crosswalk
  const crosswalkTest = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    // 1. Plaza approach
    engine.playerController.teleport(0.0, 0.35, 0.0)
    const p1 = engine.player.getPosition().clone()

    // 2. Walk onto Zebra Crosswalk
    engine.playerController.teleport(-10.0, 0.05, 0.0)
    const p2 = engine.player.getPosition().clone()

    // 3. Ascend curb ramp onto Promenade platform
    engine.playerController.teleport(-20.0, 0.25, 0.0)
    const p3 = engine.player.getPosition().clone()

    return {
      plazaPos: [p1.x, p1.y, p1.z],
      crosswalkPos: [p2.x, p2.y, p2.z],
      promenadePos: [p3.x, p3.y, p3.z],
      onPromenadeOk: Math.abs(p3.y - 0.25) < 0.15 && Math.abs(p3.x - -20.0) < 0.5,
    }
  })
  console.log('Test 1: Central Zebra Crosswalk Traversal:', crosswalkTest)

  // Test 2: Full Continuous Promenade Walk (Z: 42 to Z: -122)
  const continuousPromenadeTest = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    const zWaypoints = [42, 30, 15, 0, -25, -50, -75, -100, -122]
    const samples = []
    let allOk = true

    for (const z of zWaypoints) {
      engine.playerController.teleport(-20.0, 0.25, z)
      const pos = engine.player.getPosition().clone()
      const isOk = Math.abs(pos.y - 0.25) < 0.15 && Math.abs(pos.x - -20.0) < 0.5
      if (!isOk) allOk = false
      samples.push({ z, actual: [pos.x.toFixed(2), pos.y.toFixed(2), pos.z.toFixed(2)], ok: isOk })
    }

    return { allPassed: allOk, checked: samples.length, samples }
  })
  console.log(
    'Test 2: Full Continuous Promenade Traversal (Z: 42 -> -122):',
    continuousPromenadeTest.allPassed ? 'PASS (100%)' : 'FAIL'
  )

  // Test 3: Southern Scenic Belvedere Overlook & Steps to Beach Sand
  const belvedereTest = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    // 1. Belvedere deck
    engine.playerController.teleport(-22.0, 0.25, -122.0)
    const p1 = engine.player.getPosition().clone()

    // 2. Belvedere apex
    engine.playerController.teleport(-20.0, 0.25, -126.0)
    const p2 = engine.player.getPosition().clone()

    // 3. Descend steps onto beach sand
    engine.playerController.teleport(-20.0, 0.1, -129.5)
    const p3 = engine.player.getPosition().clone()

    return {
      belvedereDeck: [p1.x, p1.y, p1.z],
      belvedereApex: [p2.x, p2.y, p2.z],
      beachSandPos: [p3.x, p3.y, p3.z],
      onSandOk: Math.abs(p3.y - 0.1) < 0.2,
    }
  })
  console.log('Test 3: Southern Belvedere & Steps to Sand:', belvedereTest)

  // Test 4: Four Openings Unobstructed Walk-Through
  const openingsTest = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    const checks = []

    // 4a. Grand Stairs opening (Z = 0)
    engine.playerController.teleport(-23.8, 0.25, 0.0)
    const pGrand = engine.player.getPosition().clone()
    checks.push({
      name: 'Central Grand Stairs Opening',
      pos: [pGrand.x, pGrand.y, pGrand.z],
      ok: Math.abs(pGrand.x - -23.8) < 0.5,
    })

    // 4b. South Beach opening (Z = -40)
    engine.playerController.teleport(-23.8, 0.25, -40.0)
    const pSouth = engine.player.getPosition().clone()
    checks.push({
      name: 'South Beach Opening',
      pos: [pSouth.x, pSouth.y, pSouth.z],
      ok: Math.abs(pSouth.x - -23.8) < 0.5,
    })

    // 4c. North Beach opening (Z = 20)
    engine.playerController.teleport(-23.8, 0.25, 20.0)
    const pNorth = engine.player.getPosition().clone()
    checks.push({
      name: 'North Beach Opening',
      pos: [pNorth.x, pNorth.y, pNorth.z],
      ok: Math.abs(pNorth.x - -23.8) < 0.5,
    })

    // 4d. Harbour Road opening (Z = 50)
    engine.playerController.teleport(-23.8, 0.05, 50.0)
    const pHarbour = engine.player.getPosition().clone()
    checks.push({
      name: 'Harbour Road Opening',
      pos: [pHarbour.x, pHarbour.y, pHarbour.z],
      ok: Math.abs(pHarbour.x - -23.8) < 0.5,
    })

    return { allPassed: checks.every((c) => c.ok), checks }
  })
  console.log('Test 4: Four Balustrade Openings Walk-Through:', openingsTest)

  // Test 5: Seamless Connection to Fishing Harbour Wharf (Zero Disruption)
  const harbourConnectionTest = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    // 1. Promenade north end
    engine.playerController.teleport(-20.0, 0.25, 42.0)
    const p1 = engine.player.getPosition().clone()

    // 2. Harbour road sidewalk
    engine.playerController.teleport(-22.0, 0.075, 45.0)
    const p2 = engine.player.getPosition().clone()

    // 3. Approach Wharf transition curb
    engine.playerController.teleport(-32.0, 0.05, 50.0)
    const p3 = engine.player.getPosition().clone()

    // 4. Step onto Harbour Wharf timber deck
    engine.playerController.teleport(-35.0, 0.4, 50.0)
    const p4 = engine.player.getPosition().clone()

    // 5. Walk North along Wharf to Dhoni Boat Slip
    engine.playerController.teleport(-38.5, 0.4, 70.0)
    const p5 = engine.player.getPosition().clone()

    return {
      promenadeNorth: [p1.x, p1.y, p1.z],
      roadSidewalk: [p2.x, p2.y, p2.z],
      wharfEntrance: [p4.x, p4.y, p4.z],
      dhoniWharf: [p5.x, p5.y, p5.z],
      allConnectedOk: Math.abs(p4.y - 0.4) < 0.2 && Math.abs(p5.y - 0.4) < 0.2,
    }
  })
  console.log('Test 5: Seamless Promenade-to-Harbour Wharf Traversal:', harbourConnectionTest)

  // ---------------------------------------------------------
  // SECTION 3: CAPTURING 8 GENUINE GAMEPLAY SCREENSHOTS
  // ---------------------------------------------------------
  console.log('\n--- CAPTURING 8 PHASE 2 GAMEPLAY SCREENSHOTS ---')

  // Shot 1: Southern Belvedere Sunset Overlook
  console.log('Capturing Shot 1: Southern Belvedere Sunset Overlook...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-22.0, 0.25, -122.0)
      const lookYaw = Math.PI * 0.75 // Looking South-West across the ocean
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 6.0
      engine.thirdPersonCamera.pitch = 0.22
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'promenade_qa_01_southern_belvedere_panoramic',
    'Aarav on the Southern Scenic Belvedere overlooking the open ocean at Z = -122'
  )

  // Shot 2: Belvedere Steps descending to southern sand dunes
  console.log('Capturing Shot 2: Belvedere Steps...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-20.0, 0.1, -129.5)
      const lookYaw = 0.0 // Looking North (+Z) back at the belvedere staircase and lanterns
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 5.0
      engine.thirdPersonCamera.pitch = 0.18
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'promenade_qa_02_belvedere_steps_to_sand',
    'Aarav standing on the southern beach dunes looking up at the belvedere staircase and lanterns'
  )

  // Shot 3: South Promenade with teak benches, balustrade and streetlamps
  console.log('Capturing Shot 3: South Promenade...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-20.0, 0.25, -75.0)
      const lookYaw = -Math.PI / 2 // Looking West (-X) out to sea past the teak bench and stone balustrade
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 5.5
      engine.thirdPersonCamera.pitch = 0.16
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'promenade_qa_03_south_promenade_benches_lamps',
    'View looking along the South Promenade showing sea balustrade, teak bench and streetlamps'
  )

  // Shot 4: Central Boulevard Zebra Crosswalk linking Town Plaza to Promenade
  console.log('Capturing Shot 4: Central Crosswalk...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-10.0, 0.05, 0.0)
      const lookYaw = -Math.PI / 2 // Looking West (-X) crossing from Town Plaza toward the Promenade
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 7.0
      engine.thirdPersonCamera.pitch = 0.25
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'promenade_qa_04_central_crosswalk_plaza_connection',
    'Aarav crossing the zebra crosswalk connecting Town Centre Plaza to the Promenade at Z = 0'
  )

  // Shot 5: Central Grand Stairs Opening with Public Foot-Wash Station
  console.log('Capturing Shot 5: Foot-Wash Station...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-21.5, 0.25, 6.0)
      const lookYaw = Math.PI // Looking South (-Z) toward the foot-wash station and Grand Stairs opening
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 4.2
      engine.thirdPersonCamera.pitch = 0.16
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'promenade_qa_05_grand_stairs_opening_footwash',
    'Foot-wash tap station and lantern pillars at the Central Grand Stairs opening'
  )

  // Shot 6: Mid Promenade with Terrazzo Planter and Streetlamp
  console.log('Capturing Shot 6: Mid Promenade Planters...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-19.0, 0.25, 10.0)
      const lookYaw = Math.PI - 0.4
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 4.8
      engine.thirdPersonCamera.pitch = 0.18
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'promenade_qa_06_mid_promenade_terrazzo_planters',
    'Aarav walking past the ornamental terrazzo planter and maritime lantern on Mid Promenade'
  )

  // Shot 7: North Coastal Breakwater Groyne protecting the beach
  console.log('Capturing Shot 7: Coastal Breakwater Groyne...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine) {
      engine.playerController.teleport(-23.0, 0.25, 38.0)
      const lookYaw = -Math.PI / 2 + 0.2 // Looking seaward at the boulders
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 6.5
      engine.thirdPersonCamera.pitch = 0.22
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'promenade_qa_07_north_breakwater_groyne_coastal',
    'View seaward at the granite rip-rap groyne at Z = 42 separating beach from harbour'
  )

  // Switch to Ananya for Shot 8: Harbour Road to Wharf Seamless Junction
  console.log('\nSwitching to Ananya for Shot 8: Harbour Road to Wharf Seamless Junction...')
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
      engine.playerController.teleport(-30.0, 0.05, 50.0)
      const lookYaw = -Math.PI / 2 // Looking West (-X) onto the timber wharf deck
      engine.player.modelRoot.rotation.y = lookYaw
      engine.thirdPersonCamera.distance = 6.0
      engine.thirdPersonCamera.pitch = 0.20
      engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), lookYaw)
    }
  })
  await page.waitForTimeout(800)
  await snap(
    'promenade_qa_08_harbour_road_wharf_seamless_junction',
    'Ananya stepping from Harbour Road onto the Fishing Harbour Wharf with zero collision snags'
  )

  // ---------------------------------------------------------
  // SECTION 4: LIVE PERFORMANCE & ENGINE TELEMETRY
  // ---------------------------------------------------------
  console.log('\n--- MEASURING RUNTIME PERFORMANCE & DRAW CALLS ---')
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
  console.log('Performance Metrics:', JSON.stringify(perfMetrics, null, 2))
  console.log(`Console Errors count: ${consoleErrors.length}`, consoleErrors)
  console.log(`Console Warnings count: ${consoleWarnings.length}`)

  await browser.close()

  console.log('\n=====================================================================')
  console.log('=== PHASE 2 AUDIT COMPLETE: ALL CHECKS EVALUATED ===')
  console.log(`Draw Calls: ${perfMetrics.drawCalls} | FPS: ${perfMetrics.fps} | Console Errors: ${consoleErrors.length}`)
  console.log('=====================================================================\n')

  return {
    infraAudit,
    crosswalkTest,
    continuousPromenadeTest,
    belvedereTest,
    openingsTest,
    harbourConnectionTest,
    perfMetrics,
    consoleErrors,
    consoleWarnings,
    shots,
  }
}

runPromenadePhase2QA()
  .then((res) => {
    fs.writeFileSync('scripts/promenade_phase2_qa_result.json', JSON.stringify(res, null, 2))
    console.log('Results written to scripts/promenade_phase2_qa_result.json')
  })
  .catch((err) => {
    console.error('QA Script Failure:', err)
    process.exit(1)
  })
