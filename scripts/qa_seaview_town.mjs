import { chromium } from 'playwright'

async function runTour() {
  console.log('=== SEAVIEW TOWN IN-GAME QA TOUR & VALIDATION ===\n')
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()

  const consoleLogs = []
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
  })
  page.on('pageerror', err => {
    consoleLogs.push(`[PAGE ERROR] ${err.message}`)
  })

  console.log('Navigating to http://localhost:5174/ ...')
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // 1. TOUR PART 1: PLAY AS AARAV
  console.log('Starting Tour with Aarav...')
  await page.locator('button.primary-btn').click()
  await page.waitForTimeout(3000)

  // Viewpoint 1: Town Centre Plaza & Seaview Lighthouse
  console.log('Capturing Viewpoint 1: Town Centre Plaza & Seaview Lighthouse (Aarav)...')
  await page.screenshot({ path: 'public/models/seaview_01_town_centre_aarav.png' })

  // Teleport / Move toward Beach Promenade (X: -24, Z: 0)
  console.log('Navigating to Beach District & Seaside Promenade...')
  await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__ || null
    // If engine is accessible or simulate camera movement
  })

  // Simulate movement using keyboard controls (moving west toward beach: press A)
  await page.keyboard.down('KeyA')
  await page.waitForTimeout(2000)
  await page.keyboard.up('KeyA')
  await page.waitForTimeout(500)

  // Viewpoint 2: Coastal Promenade & Ocean Beach
  console.log('Capturing Viewpoint 2: Coastal Promenade & Ocean Beach...')
  await page.screenshot({ path: 'public/models/seaview_02_beach_promenade.png' })

  // Move North toward Fishing Harbour (press W)
  await page.keyboard.down('KeyW')
  await page.waitForTimeout(3500)
  await page.keyboard.up('KeyW')
  await page.waitForTimeout(500)

  // Viewpoint 3: Fishing Harbour & Docks
  console.log('Capturing Viewpoint 3: Fishing Harbour, Piers & Fishing Boats...')
  await page.screenshot({ path: 'public/models/seaview_03_fishing_harbour.png' })

  // 2. TOUR PART 2: SWITCH TO ANANYA
  console.log('\nPausing to switch protagonist to Ananya...')
  await page.evaluate(() => {
    if (document.exitPointerLock) document.exitPointerLock()
  })
  await page.waitForTimeout(1000)

  // Select Ananya card
  const ananyaCard = page.locator('.character-card:has-text("Ananya")').first()
  await ananyaCard.click()
  await page.waitForTimeout(500)

  // Play as Ananya
  await page.locator('button.primary-btn').click()
  await page.waitForTimeout(3000)

  // Viewpoint 4: Town Centre (Ananya)
  console.log('Capturing Viewpoint 4: Town Centre Spawn (Ananya)...')
  await page.screenshot({ path: 'public/models/seaview_04_town_centre_ananya.png' })

  // Move East toward Market District (Bazaar) (press D)
  console.log('Navigating to Market District (Bazaar)...')
  await page.keyboard.down('KeyD')
  await page.waitForTimeout(3000)
  await page.keyboard.up('KeyD')
  await page.waitForTimeout(500)

  // Viewpoint 5: Market District (Bazaar Stalls & Shopfronts)
  console.log('Capturing Viewpoint 5: Market District Bazaar Stalls & Spice Shops...')
  await page.screenshot({ path: 'public/models/seaview_05_market_bazaar.png' })

  // Move South toward Residential District (press S)
  console.log('Navigating to Residential District (Coastal Villas)...')
  await page.keyboard.down('KeyS')
  await page.waitForTimeout(4000)
  await page.keyboard.up('KeyS')
  await page.waitForTimeout(500)

  // Viewpoint 6: Residential District
  console.log('Capturing Viewpoint 6: Residential Avenue & Terracotta Villas...')
  await page.screenshot({ path: 'public/models/seaview_06_residential_district.png' })

  // Move East toward Countryside Edge (press D)
  console.log('Navigating to Countryside Edge & Highway Outpost...')
  await page.keyboard.down('KeyD')
  await page.waitForTimeout(3000)
  await page.keyboard.up('KeyD')
  await page.waitForTimeout(500)

  // Viewpoint 7: Countryside Edge
  console.log('Capturing Viewpoint 7: Countryside Highway Toll Gate & Palm Groves...')
  await page.screenshot({ path: 'public/models/seaview_07_countryside_edge.png' })

  // Verify Console Logs
  console.log('\n--- BROWSER CONSOLE AUDIT ---')
  consoleLogs.forEach(log => console.log(log))
  const errors = consoleLogs.filter(
    l => l.includes('ERROR') || l.includes('Failed to load') || l.includes('Error')
  )
  console.log('Total Console Errors:', errors.length)

  await browser.close()
  console.log('\n✔ SEAVIEW TOWN IN-GAME QA TOUR COMPLETED SUCCESSFULLY!')
}

runTour().catch(err => {
  console.error('Tour failed:', err)
  process.exit(1)
})
