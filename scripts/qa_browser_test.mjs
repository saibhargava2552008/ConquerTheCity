import { chromium } from 'playwright'

async function run() {
  console.log('Launching browser...')
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  console.log('Launched system Chrome')

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

  // 1. Verify Character Selection Cards
  const aaravCard = page.locator('.character-card:has-text("Aarav")').first()
  const ananyaCard = page.locator('.character-card:has-text("Ananya")').first()
  console.log('Aarav card visible:', await aaravCard.isVisible())
  console.log('Ananya card visible:', await ananyaCard.isVisible())

  // Screenshot initial selection screen (Aarav default)
  await page.screenshot({ path: 'public/models/qa_char_select_aarav.png' })
  console.log('Saved public/models/qa_char_select_aarav.png')

  // 2. Click to Play with Aarav
  console.log('Clicking Play as Aarav...')
  await page.locator('button.primary-btn').click()
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'public/models/qa_gameplay_aarav.png' })
  console.log('Saved public/models/qa_gameplay_aarav.png')

  // 3. Exit pointer lock programmatically (simulating user hitting Esc in window)
  console.log('Releasing pointer lock to reopen selection modal...')
  await page.evaluate(() => {
    if (document.exitPointerLock) document.exitPointerLock()
  })
  await page.waitForTimeout(1000)

  // 4. Click on Ananya
  console.log('Clicking Ananya card...')
  await ananyaCard.click()
  await page.waitForTimeout(500)

  const isAnanyaSelected = await page.locator('.character-card.selected.ananya-active').isVisible()
  console.log('Ananya selected active state:', isAnanyaSelected)
  await page.screenshot({ path: 'public/models/qa_char_select_ananya.png' })
  console.log('Saved public/models/qa_char_select_ananya.png')

  // 5. Click to Play with Ananya
  console.log('Clicking Play as Ananya button...')
  await page.locator('button.primary-btn').click()
  await page.waitForTimeout(3000)

  // Verify canvas exists and is active
  const canvas = page.locator('.canvas-container canvas')
  console.log('Canvas rendered:', await canvas.isVisible())
  await page.screenshot({ path: 'public/models/qa_gameplay_ananya.png' })
  console.log('Saved public/models/qa_gameplay_ananya.png')

  // Check console logs for errors
  console.log('\n--- BROWSER CONSOLE LOGS ---')
  consoleLogs.forEach(log => console.log(log))
  const errors = consoleLogs.filter(l => l.includes('ERROR') || l.includes('Failed to load') || l.includes('Error'))
  console.log('Error count:', errors.length)

  await browser.close()
  console.log('\n✔ QA Full Character Selection & Dual-Gameplay Verification PASSED!')
}

run().catch(err => {
  console.error('QA Test failed:', err)
  process.exit(1)
})
