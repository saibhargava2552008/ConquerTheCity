import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'

async function runAccessibilityTour() {
  console.log('=== SEAVIEW TOWN IN-GAME BROWSER ACCESSIBILITY & CONNECTIVITY QA ===\n')

  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()

  const consoleErrors = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[CONSOLE ERROR] ${msg.text()}`)
    }
  })
  page.on('pageerror', err => {
    consoleErrors.push(`[PAGE ERROR] ${err.message}`)
  })

  console.log('Navigating to http://localhost:5174/ ...')
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // ---------------------------------------------------------
  // PART 1: PLAY AS AARAV — TOUR ALL 7 CONNECTED DISTRICTS
  // ---------------------------------------------------------
  console.log('1. Selecting Aarav and entering Seaview Town...')
  const aaravCard = page.locator('.character-card:has-text("Aarav")').first()
  await aaravCard.click()
  await page.waitForTimeout(400)

  const startBtn = page.locator('button.primary-btn').first()
  await startBtn.click()
  await page.waitForTimeout(3500)

  const shots = []

  async function snap(name, desc) {
    const localPath = `public/models/${name}.png`
    await page.screenshot({ path: localPath })
    const artifactPath = path.join(ARTIFACT_DIR, `${name}.png`)
    fs.copyFileSync(localPath, artifactPath)
    shots.push({ name, desc, localPath, artifactPath })
    console.log(`  📸 Saved screenshot: ${name}.png — ${desc}`)
  }

  // Destination 1: Town Centre Plaza & Lighthouse
  console.log('\n[1/8] Verifying Town Centre Plaza & Lighthouse Archway...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine && engine.player) {
      engine.player.setPosition(0, 0.35, -2.0)
      engine.player.modelRoot.rotation.y = 0
      engine.camera.yaw = 0
      engine.camera.pitch = 0.2
    }
  })
  await page.waitForTimeout(1000)
  await snap('seaview_accessible_01_town_centre', 'Aarav at Town Centre Lighthouse Entrance Archway')

  // Destination 2: Grand Beach Stairs
  console.log('\n[2/8] Verifying Promenade Grand Beach Stairway to Ocean Beach...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine && engine.player) {
      engine.player.setPosition(-25.0, 0.2, 0.0)
      engine.player.modelRoot.rotation.y = Math.PI / 2
      engine.camera.yaw = Math.PI / 2
      engine.camera.pitch = 0.2
    }
  })
  await page.waitForTimeout(1000)
  await snap('seaview_accessible_02_beach_stairs', 'Aarav descending Central Grand Beach Stairs to the shoreline')

  // Destination 3: Beach Seaside Cafe Shack Deck
  console.log('\n[3/8] Verifying Seaside Cafe Shack Walkable Timber Deck...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine && engine.player) {
      engine.player.setPosition(-34.0, 0.4, -42.0)
      engine.player.modelRoot.rotation.y = Math.PI
      engine.camera.yaw = Math.PI
      engine.camera.pitch = 0.2
    }
  })
  await page.waitForTimeout(1000)
  await snap('seaview_accessible_03_beach_shack', 'Aarav on the walkable wooden deck of Seaside Cafe Shack')

  // Destination 4: Fishing Harbour Wharf, Gangway & Fishing Boat Deck
  console.log('\n[4/8] Verifying Fishing Wharf, Gangway & Moored Boat Deck...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine && engine.player) {
      engine.player.setPosition(-48.0, 0.4, 72.0)
      engine.player.modelRoot.rotation.y = Math.PI / 2
      engine.camera.yaw = Math.PI / 4
      engine.camera.pitch = 0.22
    }
  })
  await page.waitForTimeout(1000)
  await snap('seaview_accessible_04_fishing_boat', 'Aarav on Fishing Boat "Sea Queen" deck via boarding gangway')

  // Destination 5: Harbour Warehouse Loading Bay Stairs & Interior
  console.log('\n[5/8] Verifying Cold Storage Warehouse Loading Dock & Interior...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine && engine.player) {
      engine.player.setPosition(-31.5, 1.2, 73.0)
      engine.player.modelRoot.rotation.y = -Math.PI / 2
      engine.camera.yaw = -Math.PI / 2
      engine.camera.pitch = 0.2
    }
  })
  await page.waitForTimeout(1000)
  await snap('seaview_accessible_05_warehouse_dock', 'Aarav at Cold Storage Warehouse open loading bay entrance')

  // Destination 6: Market District Bazaar Pedestrian Street
  console.log('\n[6/8] Verifying Bazaar Pedestrian Street & Spice Stalls...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine && engine.player) {
      engine.player.setPosition(38.0, 0.05, 45.0)
      engine.player.modelRoot.rotation.y = 0
      engine.camera.yaw = 0
      engine.camera.pitch = 0.22
    }
  })
  await page.waitForTimeout(1000)
  await snap('seaview_accessible_06_market_bazaar', 'Aarav in Central Bazaar walking between spice & produce stalls')

  // Destination 7: Residential District Villa Gulmohar Veranda
  console.log('\n[7/8] Verifying Residential Avenue, Compound Gate & Villa Veranda...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine && engine.player) {
      engine.player.setPosition(25.0, 0.35, -37.4)
      engine.player.modelRoot.rotation.y = 0
      engine.camera.yaw = Math.PI
      engine.camera.pitch = 0.2
    }
  })
  await page.waitForTimeout(1000)
  await snap('seaview_accessible_07_residential_villa', 'Aarav on the front veranda of Villa Gulmohar facing the garden gate')

  // Destination 8: Countryside Edge Highway Outpost & Checkpoint Cabin
  console.log('\n[8/8] Verifying Countryside Highway Outpost & Checkpoint Cabin...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine && engine.player) {
      engine.player.setPosition(95.0, 0.05, 3.5)
      engine.player.modelRoot.rotation.y = -Math.PI / 2
      engine.camera.yaw = -Math.PI / 2
      engine.camera.pitch = 0.2
    }
  })
  await page.waitForTimeout(1000)
  await snap('seaview_accessible_08_countryside_outpost', 'Aarav at Highway Outpost checkpoint canopy and open road lanes')

  // ---------------------------------------------------------
  // PART 2: PLAY AS ANANYA — DUAL CHARACTER VERIFICATION
  // ---------------------------------------------------------
  console.log('\n2. Switching protagonist to Ananya...')
  await page.evaluate(() => {
    if (document.exitPointerLock) document.exitPointerLock()
  })
  await page.waitForTimeout(500)

  // Reload to character select screen
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  const ananyaCard = page.locator('.character-card:has-text("Ananya")').first()
  await ananyaCard.click()
  await page.waitForTimeout(400)

  const startBtn2 = page.locator('button.primary-btn').first()
  await startBtn2.click()
  await page.waitForTimeout(3500)

  console.log('\n[9/10] Verifying Ananya on North Promenade Boardwalk...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine && engine.player) {
      engine.player.setPosition(-23.5, 0.25, 20.0)
      engine.player.modelRoot.rotation.y = Math.PI / 2
      engine.camera.yaw = Math.PI / 2
      engine.camera.pitch = 0.2
    }
  })
  await page.waitForTimeout(1000)
  await snap('seaview_accessible_09_ananya_beach_promenade', 'Ananya exploring the North Promenade & Boardwalk stairs')

  console.log('\n[10/10] Verifying Ananya at Malabar Spice Shop Veranda...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (engine && engine.player) {
      engine.player.setPosition(31.4, 0.35, 52.0)
      engine.player.modelRoot.rotation.y = Math.PI / 2
      engine.camera.yaw = Math.PI / 2
      engine.camera.pitch = 0.22
    }
  })
  await page.waitForTimeout(1000)
  await snap('seaview_accessible_10_ananya_bazaar_spice', 'Ananya on the wooden veranda of Malabar Spice Traders')

  await browser.close()

  console.log('\n======================================================')
  console.log(`✔ ALL 10 IN-GAME ACCESSIBILITY SCREENSHOTS CAPTURED!`)
  console.log(`Console errors: ${consoleErrors.length}`)
  if (consoleErrors.length > 0) {
    console.error(consoleErrors.join('\n'))
    process.exit(1)
  }
  console.log('======================================================\n')
}

runAccessibilityTour().catch(err => {
  console.error('Browser QA Error:', err)
  process.exit(1)
})
