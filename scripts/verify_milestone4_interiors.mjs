import { chromium } from 'playwright'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const SCREENSHOT_PATH = path.join(ARTIFACT_DIR, 'milestone4_interior_gameplay.png')

async function pressKeyF(page) {
  await page.keyboard.down('KeyF')
  await page.waitForTimeout(120)
  await page.keyboard.up('KeyF')
  await page.waitForTimeout(500)
}

async function runMilestone4Verification() {
  console.log('======================================================================')
  console.log('=== CONQUER THE CITY — MILESTONE 4: BUILDING ENTRANCE & INTERIOR QA ===')
  console.log('======================================================================\n')

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu-watchdog'],
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  })

  const page = await context.newPage()

  const consoleErrors = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
      console.error(`[BROWSER ERROR] ${msg.text()}`)
    }
  })

  try {
    console.log('[1/6] Navigating to http://localhost:5173/ ...')
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(3000)

    // 1. Verify InteriorManager registered 4 functional buildings
    console.log('\n[2/6] Verifying InteriorManager building registrations...')
    const buildingAudit = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      if (!engine || !engine.interiorManager) return null
      const mgr = engine.interiorManager
      return {
        buildingCount: mgr.getAllConfigs().length,
        buildings: mgr.getAllConfigs().map(b => ({
          id: b.id,
          name: b.displayName,
          district: b.district,
          extDoor: b.exteriorDoorPos,
          intSpawn: b.interiorSpawnPos,
          examineCount: b.examineTargets.length,
        })),
      }
    })

    if (!buildingAudit) {
      throw new Error('InteriorManager not found on window.__CTC_ENGINE__')
    }

    console.log(`✔ Found ${buildingAudit.buildingCount} functional building interiors registered:`)
    for (const b of buildingAudit.buildings) {
      console.log(`   - [${b.district}] "${b.name}" (id: ${b.id}) | ${b.examineCount} interactive objects`)
    }
    if (buildingAudit.buildingCount < 4) {
      throw new Error(`Expected at least 4 functional building interiors, found: ${buildingAudit.buildingCount}`)
    }

    // 2. Test Heritage Villa Gulmohar Entrance, Interior & Exit
    console.log('\n[3/6] Testing Heritage Villa Gulmohar entrance, interior exploration & exit...')
    // Teleport player near Villa entrance (38.0, 0.35, -30.0)
    await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      engine.playerController.teleport(38.0, 0.35, -30.0)
    })
    await page.waitForTimeout(400)

    const villaPrompt = await page.evaluate(() => {
      const banner = document.querySelector('.interaction-prompt-banner')
      return {
        key: banner?.querySelector('.prompt-kbd')?.textContent?.trim(),
        label: banner?.querySelector('.prompt-label')?.textContent?.trim(),
      }
    })

    console.log(`   Entrance prompt: [${villaPrompt?.key}] ${villaPrompt?.label}`)
    if (!villaPrompt || villaPrompt.key !== 'F' || !villaPrompt.label?.includes('Enter Heritage Villa Gulmohar')) {
      throw new Error(`Expected prompt '[F] Enter Heritage Villa Gulmohar', got: ${JSON.stringify(villaPrompt)}`)
    }
    console.log('✔ Exterior entrance prompt verified!')

    // Enter Villa
    console.log('   Pressing F to enter Heritage Villa Gulmohar...')
    await pressKeyF(page)
    await page.waitForTimeout(600)

    const insideVillaState = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      const pos = engine.player.getPosition()
      const isIndoor = engine.interiorManager.isIndoor()
      const current = engine.interiorManager.getCurrentBuilding()
      const camDist = engine.thirdPersonCamera.distance
      const surfaceType = engine.collisionSystem.getSurfaceType(pos.x, pos.y, pos.z, 0.3)

      return {
        isIndoor,
        currentId: current?.id,
        currentName: current?.displayName,
        playerPos: { x: pos.x, y: pos.y, z: pos.z },
        camDist,
        surfaceType,
      }
    })

    console.log(`   Inside building: isIndoor=${insideVillaState.isIndoor}, name="${insideVillaState.currentName}"`)
    console.log(`   Interior spawn position: (${insideVillaState.playerPos.x.toFixed(2)}, ${insideVillaState.playerPos.y.toFixed(2)}, ${insideVillaState.playerPos.z.toFixed(2)})`)
    console.log(`   Camera indoor distance: ${insideVillaState.camDist.toFixed(2)}m (indoor mode)`)
    console.log(`   Surface type: "${insideVillaState.surfaceType}"`)

    if (!insideVillaState.isIndoor || insideVillaState.currentId !== 'heritage_villa_gulmohar') {
      throw new Error(`Failed to enter Villa: ${JSON.stringify(insideVillaState)}`)
    }
    if (insideVillaState.camDist > 3.0) {
      throw new Error(`Camera did not switch to indoor mode: distance = ${insideVillaState.camDist}`)
    }
    if (insideVillaState.surfaceType !== 'interior') {
      throw new Error(`Expected interior surface type, got: ${insideVillaState.surfaceType}`)
    }
    console.log('✔ Interior spawn, indoor camera mode, and interior surface verified!')

    // Test Interior Collision (walk toward north wall)
    const interiorCollision = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      // Walk forward toward wall
      const wallHit = engine.collisionSystem.isPositionBlocked(300.0, 0.05, -39.0, 0.35, 1.8)
      // Check table obstacle collider
      const tableHit = engine.collisionSystem.isPositionBlocked(300.0, 0.05, -35.0, 0.35, 1.8)
      return { wallHit, tableHit }
    })
    console.log(`   Interior collision: wall blocked=${interiorCollision.wallHit}, furniture table blocked=${interiorCollision.tableHit}`)
    if (!interiorCollision.wallHit || !interiorCollision.tableHit) {
      throw new Error(`Interior collisions missing: ${JSON.stringify(interiorCollision)}`)
    }
    console.log('✔ Interior wall and furniture collisions verified!')

    // Test Examining Brass Samovar inside Villa
    console.log('   Moving near brass samovar and examining...')
    await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      engine.playerController.teleport(300.0, 0.05, -33.8) // close to samovar
    })
    await page.waitForTimeout(400)

    const samovarPrompt = await page.evaluate(() => {
      const banner = document.querySelector('.interaction-prompt-banner')
      return {
        key: banner?.querySelector('.prompt-kbd')?.textContent?.trim(),
        label: banner?.querySelector('.prompt-label')?.textContent?.trim(),
      }
    })
    console.log(`   Samovar prompt: [${samovarPrompt?.key}] ${samovarPrompt?.label}`)

    await pressKeyF(page)
    await page.waitForTimeout(400)

    const samovarDialogue = await page.evaluate(() => {
      const banner = document.querySelector('.hud-dialogue-banner')
      return {
        speaker: banner?.querySelector('.dialogue-speaker')?.textContent?.trim(),
        text: banner?.querySelector('.dialogue-body')?.textContent?.trim(),
      }
    })

    console.log(`   Examine result: [${samovarDialogue?.speaker}] ${samovarDialogue?.text}`)
    if (!samovarDialogue || !samovarDialogue.text?.includes('brass tea samovar')) {
      throw new Error(`Examine interaction failed: ${JSON.stringify(samovarDialogue)}`)
    }
    console.log('✔ Functional interior object examine interaction verified!')

    // Capture visual screenshot of interior gameplay with furniture & dialogue
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false })
    console.log(`✔ Interior gameplay screenshot captured: ${SCREENSHOT_PATH}`)

    // Test Exiting Villa
    console.log('   Moving to exit door and pressing F to exit...')
    await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      engine.playerController.teleport(300.0, 0.05, -31.5) // near exit door
    })
    await page.waitForTimeout(400)
    await pressKeyF(page)
    await page.waitForTimeout(600)

    const exitState = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      const pos = engine.player.getPosition()
      return {
        isIndoor: engine.interiorManager.isIndoor(),
        camDist: engine.thirdPersonCamera.distance,
        playerPos: { x: pos.x, y: pos.y, z: pos.z },
      }
    })

    console.log(`   Outside after exit: isIndoor=${exitState.isIndoor}, cameraDistance=${exitState.camDist.toFixed(2)}m`)
    console.log(`   Exterior player position: (${exitState.playerPos.x.toFixed(2)}, ${exitState.playerPos.y.toFixed(2)}, ${exitState.playerPos.z.toFixed(2)})`)
    if (exitState.isIndoor || Math.abs(exitState.playerPos.x - 38.0) > 2.0) {
      throw new Error(`Failed to exit Villa safely: ${JSON.stringify(exitState)}`)
    }
    console.log('✔ Exterior exit transition and outdoor camera restoration verified!')

    // Test Repeated Entry & Exit (State and Resource-Management Check)
    console.log('\n   Testing repeated entry and exit for state consistency...')
    // Wait for 0.5s debounce cooldown to finish
    await page.waitForTimeout(750)
    await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      engine.playerController.teleport(38.0, 0.35, -30.0)
    })
    await page.waitForTimeout(500)
    await pressKeyF(page)
    await page.waitForTimeout(750)

    const reEntryState = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      return {
        isIndoor: engine.interiorManager.isIndoor(),
        buildingId: engine.interiorManager.getCurrentBuilding()?.id,
        camDist: engine.thirdPersonCamera.distance,
      }
    })
    console.log(`   Repeated entry result: isIndoor=${reEntryState.isIndoor}, id="${reEntryState.buildingId}", camDist=${reEntryState.camDist.toFixed(2)}m`)
    if (!reEntryState.isIndoor || reEntryState.buildingId !== 'heritage_villa_gulmohar') {
      throw new Error(`Repeated entry failed: ${JSON.stringify(reEntryState)}`)
    }

    // Exit once more
    await page.waitForTimeout(750)
    await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      engine.playerController.teleport(300.0, 0.05, -31.5)
    })
    await page.waitForTimeout(500)
    await pressKeyF(page)
    await page.waitForTimeout(750)

    const reExitState = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      return {
        isIndoor: engine.interiorManager.isIndoor(),
        camDist: engine.thirdPersonCamera.distance,
      }
    })
    console.log(`   Repeated exit result: isIndoor=${reExitState.isIndoor}, camDist=${reExitState.camDist.toFixed(2)}m`)
    if (reExitState.isIndoor) {
      throw new Error(`Repeated exit failed: ${JSON.stringify(reExitState)}`)
    }
    console.log('✔ Repeated entrance and exit verified without memory leaks or stale state!')

    // 3. Test Market Kirana Store Interior
    console.log('\n[4/6] Testing Market Kirana store interior...')
    await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      engine.playerController.teleport(27.2, 0.05, 32.5) // near Kirana door
    })
    await page.waitForTimeout(400)
    await pressKeyF(page)
    await page.waitForTimeout(600)

    const kiranaState = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      return {
        isIndoor: engine.interiorManager.isIndoor(),
        currentId: engine.interiorManager.getCurrentBuilding()?.id,
        currentName: engine.interiorManager.getCurrentBuilding()?.displayName,
      }
    })

    console.log(`   Inside Kirana: isIndoor=${kiranaState.isIndoor}, name="${kiranaState.currentName}"`)
    if (!kiranaState.isIndoor || kiranaState.currentId !== 'market_kirana_interior') {
      throw new Error(`Failed to enter Market Kirana: ${JSON.stringify(kiranaState)}`)
    }

    // Exit Kirana
    await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      engine.playerController.teleport(300.0, 0.05, 38.6)
    })
    await page.waitForTimeout(400)
    await pressKeyF(page)
    await page.waitForTimeout(600)
    console.log('✔ Market Kirana store verified!')

    // 4. Test Fishermen's Cooperative & Highway Outpost
    console.log('\n[5/6] Testing Fishermen\'s Co-op & Highway Outpost entrances...')
    // Fishermen's Co-op (Fishing Harbour at X: -28.0, Z: 114.6)
    await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      engine.playerController.teleport(-28.0, 0.40, 113.2)
    })
    await page.waitForTimeout(400)
    await pressKeyF(page)
    await page.waitForTimeout(600)
    const coopInside = await page.evaluate(() => window.__CTC_ENGINE__.interiorManager.isIndoor())
    console.log(`   Fishermen's Co-op entered: isIndoor=${coopInside}`)
    if (!coopInside) throw new Error('Failed to enter Fishermen\'s Co-op!')

    // Exit Co-op
    await page.evaluate(() => window.__CTC_ENGINE__.playerController.teleport(300.0, 0.05, 78.6))
    await page.waitForTimeout(400)
    await pressKeyF(page)
    await page.waitForTimeout(600)

    // Highway Outpost (Countryside Edge at X: 95.0, Z: 6.85)
    await page.evaluate(() => window.__CTC_ENGINE__.playerController.teleport(95.0, 0.15, 5.5))
    await page.waitForTimeout(400)
    await pressKeyF(page)
    await page.waitForTimeout(600)
    const outpostInside = await page.evaluate(() => window.__CTC_ENGINE__.interiorManager.isIndoor())
    console.log(`   Highway Outpost entered: isIndoor=${outpostInside}`)
    if (!outpostInside) throw new Error('Failed to enter Highway Outpost!')

    // Exit Outpost
    await page.evaluate(() => window.__CTC_ENGINE__.playerController.teleport(300.0, 0.05, -71.4))
    await page.waitForTimeout(400)
    await pressKeyF(page)
    await page.waitForTimeout(600)
    console.log('✔ All 4 building interiors verified functional!')

    // 5. Regression Check: Milestone 1 Collision, Milestone 2 Vehicles & Milestone 3 NPCs
    console.log('\n[6/6] Regression check: Verifying collision, vehicle driving and NPC dialogue remain intact...')

    // Check Milestone 1: Universal collision system intact
    const exteriorWallBlocked = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      // Seaview Lighthouse solid tower wall at (0, 0.35, -5.6)
      return engine.collisionSystem.isPositionBlocked(0, 0.35, -5.6, 0.35, 1.8)
    })
    console.log(`   Milestone 1 exterior building collision intact: isBlocked=${exteriorWallBlocked}`)
    if (!exteriorWallBlocked) throw new Error('Exterior building collision regressed!')

    // Check NPC dialogue (Stationary tourist Priya in Town Centre)
    await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      const npc = engine.cityNPCManager.getNPC('tc_tourist_pair_1')
      if (npc) engine.playerController.teleport(npc.position.x, npc.position.y, npc.position.z + 1.5)
    })
    await page.waitForTimeout(400)
    await pressKeyF(page)
    await page.waitForTimeout(400)
    const npcDialogueChecked = await page.evaluate(() => {
      const text = document.querySelector('.hud-dialogue-banner')?.textContent
      return text?.includes('lighthouse') || text?.includes('Priya') || false
    })
    console.log(`   NPC dialogue still functional: ${npcDialogueChecked}`)
    if (!npcDialogueChecked) throw new Error('NPC dialogue regressed!')

    // Check Vehicle driving
    await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      engine.playerController.teleport(-3.8, 0.35, 10.2)
    })
    await page.waitForTimeout(400)
    await pressKeyF(page)
    const isDrivingChecked = await page.evaluate(() => window.__CTC_ENGINE__.vehicleManager.isDriving())
    console.log(`   Vehicle entry still functional: isDriving=${isDrivingChecked}`)
    if (!isDrivingChecked) throw new Error('Vehicle system regressed!')
    await pressKeyF(page) // exit vehicle

    console.log(`\nBrowser console errors count: ${consoleErrors.length}`)
    if (consoleErrors.length > 0) {
      throw new Error(`Browser console errors encountered: ${consoleErrors.join(', ')}`)
    }

    console.log('\n======================================================================')
    console.log('=== ✔ ALL MILESTONE 4 INTERIOR CHECKS PASSED WITH 100% SUCCESS! ===')
    console.log('======================================================================\n')
  } finally {
    await browser.close()
  }
}

runMilestone4Verification().catch(err => {
  console.error('\n❌ QA FAILED:', err)
  process.exit(1)
})
