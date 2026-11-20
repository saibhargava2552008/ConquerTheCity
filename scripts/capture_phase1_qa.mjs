import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const BASE_URL = 'http://localhost:5173/'

async function capturePhase1QA() {
  console.log('=== CAPTURING PHASE 1 OPTIMIZATION VERIFICATION SCREENSHOTS ===\n')

  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // Start with Aarav
  const aaravCard = page.locator('.character-card:has-text("Aarav")').first()
  if (await aaravCard.isVisible()) {
    await aaravCard.click()
    await page.waitForTimeout(200)
    await page.locator('button.primary-btn').first().click()
  }

  await page.waitForTimeout(4500)

  async function snap(name, desc) {
    const localPath = `public/models/${name}.png`
    await page.screenshot({ path: localPath })
    const artifactPath = path.join(ARTIFACT_DIR, `${name}.png`)
    fs.copyFileSync(localPath, artifactPath)
    console.log(`  📸 Saved screenshot: ${name}.png — ${desc}`)
  }

  // 1. Town Centre Plaza Spawn Overview
  await snap('phase1_01_town_centre_spawn', 'Town Centre Plaza at spawn with optimized geometry')

  // 2. Aarav Character Closeup & Shadows
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return
    engine.thirdPersonCamera.distance = 2.4
    engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), Math.PI)
  })
  await page.waitForTimeout(600)
  await snap('phase1_02_aarav_unified_character', 'Aarav unified skinned mesh character with high-res crisp shadows')

  // 3. Move into Market Bazaar
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return
    engine.playerController.position.set(38, 0, 30)
    engine.player.setPosition(38, 0, 30)
    engine.thirdPersonCamera.distance = 4.8
    engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), 0)
  })
  await page.waitForTimeout(1200)
  await snap('phase1_03_market_bazaar_overview', 'Market Bazaar corridor with merged road markings and living world')

  // 4. Chai Stall Social Cluster in Market
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return
    engine.playerController.position.set(28, 0, 26)
    engine.player.setPosition(28, 0, 26)
    engine.thirdPersonCamera.distance = 4.2
    engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), Math.PI * 0.7)
  })
  await page.waitForTimeout(1200)
  await snap('phase1_04_chai_stall_npcs', 'Chai stall social hub with unified character NPCs and props')

  // 5. Promenade & Beach Ocean View
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return
    engine.playerController.position.set(-20, 0.25, 0)
    engine.player.setPosition(-20, 0.25, 0)
    engine.thirdPersonCamera.distance = 5.0
    engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), -Math.PI / 2)
  })
  await page.waitForTimeout(1200)
  await snap('phase1_05_promenade_beach_ocean', 'Marine Promenade and Ocean with optimized palms and lighting')

  console.log('\nAll Phase 1 QA screenshots captured successfully!')
  await browser.close()
}

capturePhase1QA().catch(console.error)
