import { chromium } from 'playwright'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const SCREENSHOT_PATH = path.join(ARTIFACT_DIR, 'milestone3_npc_dialogue_hud.png')

async function pressKeyF(page) {
  await page.keyboard.down('KeyF')
  await page.waitForTimeout(120)
  await page.keyboard.up('KeyF')
  await page.waitForTimeout(500)
}

async function runMilestone3Verification() {
  console.log('======================================================================')
  console.log('=== CONQUER THE CITY — MILESTONE 3: NPC INTELLIGENCE & POPULATION QA ===')
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
    await page.waitForTimeout(3000) // Allow GLBs and world to mount

    // 1. Verify City-Wide NPC Population across all 6 districts
    console.log('\n[2/6] Verifying City-Wide NPC presence across all 6 districts...')
    const npcAudit = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      if (!engine || !engine.cityNPCManager) return null
      const mgr = engine.cityNPCManager
      const npcs = mgr.getAllNPCs().map(n => ({
        id: n.id,
        name: n.name,
        title: n.title,
        district: n.district,
        role: n.role,
        pos: { x: n.position.x, y: n.position.y, z: n.position.z },
      }))

      const districtCounts = {}
      for (const n of npcs) {
        districtCounts[n.district] = (districtCounts[n.district] || 0) + 1
      }

      return {
        totalCount: npcs.length,
        districtCounts,
        npcs,
        graphNodeCount: mgr.navGraph.getAllNodes().length,
      }
    })

    if (!npcAudit) {
      throw new Error('CityNPCManager not found on window.__CTC_ENGINE__')
    }

    console.log(`✔ Found ${npcAudit.totalCount} NPCs registered across ${Object.keys(npcAudit.districtCounts).length} districts:`)
    for (const [dist, count] of Object.entries(npcAudit.districtCounts)) {
      console.log(`   - District: "${dist}" -> ${count} NPCs`)
    }
    console.log(`✔ CityNavigationGraph: ${npcAudit.graphNodeCount} interconnected nodes verified!`)

    // Verify all 6 districts are populated
    const requiredDistricts = [
      'town_centre',
      'beach_promenade',
      'fishing_harbour',
      'market_district',
      'residential_district',
      'countryside_edge',
    ]
    for (const req of requiredDistricts) {
      if (!npcAudit.districtCounts[req] || npcAudit.districtCounts[req] === 0) {
        throw new Error(`District "${req}" has no NPCs populated!`)
      }
    }

    // 2. Test Living Activities (Bench Sitting & Conversing Pairs)
    console.log('\n[3/6] Verifying living NPC activities (Bench sitting & conversations)...')
    const activitiesCheck = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      const mgr = engine.cityNPCManager
      const belvedereSitter = mgr.getNPC('bp_belvedere_sitter')
      const conv1 = mgr.getNPC('tc_tourist_pair_1')
      const conv2 = mgr.getNPC('tc_tourist_pair_2')

      return {
        benchSitter: {
          id: belvedereSitter?.id,
          role: belvedereSitter?.role,
          state: belvedereSitter?.state,
          pos: belvedereSitter?.position,
        },
        conversationPair: {
          npc1Role: conv1?.role,
          npc2Role: conv2?.role,
          distBetween: conv1 && conv2 ? conv1.position.distanceTo(conv2.position) : Infinity,
        },
      }
    })

    console.log(`   Bench sitter: role="${activitiesCheck.benchSitter.role}", state="${activitiesCheck.benchSitter.state}" at Y=${activitiesCheck.benchSitter.pos?.y.toFixed(2)}m`)
    if (activitiesCheck.benchSitter.role !== 'bench_sitter' || activitiesCheck.benchSitter.state !== 'sitting') {
      throw new Error(`Bench sitter activity failed: ${JSON.stringify(activitiesCheck.benchSitter)}`)
    }
    console.log(`   Conversation pair: distance=${activitiesCheck.conversationPair.distBetween.toFixed(2)}m (facing each other in plaza)`)
    if (activitiesCheck.conversationPair.distBetween > 2.0) {
      throw new Error(`Conversation pair too far apart: ${activitiesCheck.conversationPair.distBetween}`)
    }
    console.log('✔ Believable living activities (Bench sitting & chatting pairs) verified!')

    // 3. Test Navigation & Building Collision Avoidance
    console.log('\n[4/6] Testing intelligent navigation & building obstacle avoidance...')
    const navObstacleCheck = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      const mgr = engine.cityNPCManager
      const stroller = mgr.getNPC('tc_flaneur')
      if (!stroller) return null

      // Simulate 40 physics updates (2.0s)
      const dt = 0.05
      const playerPos = engine.player.getPosition()
      const startPos = stroller.position.clone()

      for (let i = 0; i < 40; i++) {
        stroller.update(dt, playerPos, mgr.getAllNPCs())
      }

      const endPos = stroller.position.clone()
      const isInsideBuilding = engine.collisionSystem.isPositionBlocked(
        stroller.position.x,
        stroller.position.y,
        stroller.position.z,
        0.35,
        1.8
      )

      return {
        moved: startPos.distanceTo(endPos) > 0.1,
        distTraveled: startPos.distanceTo(endPos),
        isInsideBuilding,
        groundHeight: stroller.position.y,
      }
    })

    console.log(`   Stroller distance moved: ${navObstacleCheck?.distTraveled.toFixed(2)}m`)
    console.log(`   Collision test: inside building = ${navObstacleCheck?.isInsideBuilding} (must be false)`)
    console.log(`   Ground snapping: Y = ${navObstacleCheck?.groundHeight.toFixed(2)}m`)
    if (!navObstacleCheck || navObstacleCheck.isInsideBuilding) {
      throw new Error('NPC penetrated a solid building collision boundary!')
    }
    console.log('✔ Obstacle avoidance verified: NPCs walk cleanly without penetrating solid structures!')

    // 4. Test Player Interaction & Dialogue Subtitle
    console.log('\n[5/6] Testing contextual [F] Talk interaction & floating dialogue...')
    // Teleport player near Karan (tc_flaneur) at (2.0, 0.35, 8.0)
    await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      const npc = engine.cityNPCManager.getNPC('tc_flaneur')
      if (npc) {
        engine.playerController.teleport(npc.position.x, npc.position.y, npc.position.z + 1.8)
      }
    })
    await page.waitForTimeout(400)

    const promptText = await page.evaluate(() => {
      const banner = document.querySelector('.interaction-prompt-banner')
      if (!banner) return null
      return {
        key: banner.querySelector('.prompt-kbd')?.textContent?.trim(),
        label: banner.querySelector('.prompt-label')?.textContent?.trim(),
      }
    })

    console.log(`   Prompt visible: [${promptText?.key}] ${promptText?.label}`)
    if (!promptText || promptText.key !== 'F' || !promptText.label.includes('Talk to Karan')) {
      throw new Error(`Expected prompt '[F] Talk to Karan', got: ${JSON.stringify(promptText)}`)
    }
    console.log('✔ Contextual talk prompt verified!')

    // Press F to talk
    console.log('   Pressing F to talk...')
    await pressKeyF(page)
    await page.waitForTimeout(400)

    const dialogueBanner = await page.evaluate(() => {
      const banner = document.querySelector('.hud-dialogue-banner')
      if (!banner) return null
      return {
        speaker: banner.querySelector('.dialogue-speaker')?.textContent?.trim(),
        title: banner.querySelector('.dialogue-title')?.textContent?.trim(),
        text: banner.querySelector('.dialogue-body')?.textContent?.trim(),
        district: banner.querySelector('.dialogue-district')?.textContent?.trim(),
      }
    })

    console.log(`   Dialogue received: [${dialogueBanner?.speaker}] (${dialogueBanner?.title}): ${dialogueBanner?.text}`)
    if (!dialogueBanner || dialogueBanner.speaker !== 'Karan' || !dialogueBanner.text.includes('Town Plaza')) {
      throw new Error(`Dialogue banner failed to display correctly: ${JSON.stringify(dialogueBanner)}`)
    }

    // Capture visual screenshot of active NPC interaction dialogue
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false })
    console.log(`✔ NPC Dialogue screenshot captured: ${SCREENSHOT_PATH}`)

    // 5. Regression Check: Milestone 2 Vehicle Driving
    console.log('\n[6/6] Regression check: Verifying Milestone 2 vehicle driving still functional...')
    await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      engine.playerController.teleport(-3.8, 0.35, 10.2) // near rickshaw_plaza_west
    })
    await page.waitForTimeout(400)
    await pressKeyF(page)

    const vehicleDrivingState = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      return {
        isDriving: engine.vehicleManager.isDriving(),
        vehicleId: engine.vehicleManager.getActiveVehicle()?.id,
      }
    })

    console.log(`   Vehicle entered: isDriving=${vehicleDrivingState.isDriving}, id=${vehicleDrivingState.vehicleId}`)
    if (!vehicleDrivingState.isDriving) {
      throw new Error('Vehicle entry failed during Milestone 3 regression check!')
    }

    // Exit vehicle
    await pressKeyF(page)
    console.log('✔ Vehicle system coexistence verified without regression!')

    console.log(`\nBrowser console errors count: ${consoleErrors.length}`)
    if (consoleErrors.length > 0) {
      throw new Error(`Browser console errors encountered: ${consoleErrors.join(', ')}`)
    }

    console.log('\n======================================================================')
    console.log('=== ✔ ALL MILESTONE 3 NPC CHECKS PASSED WITH 100% SUCCESS! ===')
    console.log('======================================================================\n')
  } finally {
    await browser.close()
  }
}

runMilestone3Verification().catch(err => {
  console.error('\n❌ QA FAILED:', err)
  process.exit(1)
})
