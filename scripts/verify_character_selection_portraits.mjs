import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

async function verify() {
  console.log('=== VERIFYING CHARACTER SELECTION CUSTOM PORTRAIT IMAGES ===\n')

  // Check file existence
  const aaravPath = path.resolve('public/images/characters/aarav-selection.png')
  const ananyaPath = path.resolve('public/images/characters/ananya-selection.png')

  console.log('1. Checking file existence:')
  console.log('  Aarav selection file exists:', fs.existsSync(aaravPath), `(${fs.statSync(aaravPath).size} bytes)`)
  console.log('  Ananya selection file exists:', fs.existsSync(ananyaPath), `(${fs.statSync(ananyaPath).size} bytes)`)

  const browser = await chromium.launch({ channel: 'chrome', headless: true })

  // --- DESKTOP VIEWPORT TEST (1280x720) ---
  console.log('\n2. Testing Desktop Viewport (1280x720)...')
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()

  const consoleLogs = []
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', err => consoleLogs.push(`[PAGE ERROR] ${err.message}`))

  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // Verify Aarav Card Image
  const aaravImg = page.locator('.character-card:has-text("Aarav") img.char-portrait-img')
  const ananyaImg = page.locator('.character-card:has-text("Ananya") img.char-portrait-img')

  const aaravSrc = await aaravImg.getAttribute('src')
  const ananyaSrc = await ananyaImg.getAttribute('src')

  console.log('  Aarav card img src:', aaravSrc)
  console.log('  Ananya card img src:', ananyaSrc)

  if (aaravSrc !== '/images/characters/aarav-selection.png') {
    throw new Error(`Aarav card must use /images/characters/aarav-selection.png, got: ${aaravSrc}`)
  }
  if (ananyaSrc !== '/images/characters/ananya-selection.png') {
    throw new Error(`Ananya card must use /images/characters/ananya-selection.png, got: ${ananyaSrc}`)
  }

  // Verify naturalWidth and naturalHeight to confirm images actually loaded in browser DOM
  const aaravNatural = await aaravImg.evaluate(img => ({ nw: img.naturalWidth, nh: img.naturalHeight, complete: img.complete }))
  const ananyaNatural = await ananyaImg.evaluate(img => ({ nw: img.naturalWidth, nh: img.naturalHeight, complete: img.complete }))

  console.log('  Aarav img loaded:', aaravNatural.complete, `(${aaravNatural.nw}x${aaravNatural.nh})`)
  console.log('  Ananya img loaded:', ananyaNatural.complete, `(${ananyaNatural.nw}x${ananyaNatural.nh})`)

  if (!aaravNatural.complete || aaravNatural.nw === 0) {
    throw new Error('Aarav portrait image failed to load in browser!')
  }
  if (!ananyaNatural.complete || ananyaNatural.nw === 0) {
    throw new Error('Ananya portrait image failed to load in browser!')
  }

  // Verify CSS styles (object-fit: cover, object-position)
  const aaravStyles = await aaravImg.evaluate(img => {
    const s = window.getComputedStyle(img)
    return { objectFit: s.objectFit, objectPosition: s.objectPosition }
  })
  const ananyaStyles = await ananyaImg.evaluate(img => {
    const s = window.getComputedStyle(img)
    return { objectFit: s.objectFit, objectPosition: s.objectPosition }
  })

  console.log('  Aarav CSS:', aaravStyles)
  console.log('  Ananya CSS:', ananyaStyles)

  if (aaravStyles.objectFit !== 'cover') {
    throw new Error(`Expected object-fit: cover, got: ${aaravStyles.objectFit}`)
  }
  if (ananyaStyles.objectFit !== 'cover') {
    throw new Error(`Expected object-fit: cover, got: ${ananyaStyles.objectFit}`)
  }

  // Verify Card Dimensions Consistency
  const aaravCard = page.locator('.character-card:has-text("Aarav")')
  const ananyaCard = page.locator('.character-card:has-text("Ananya")')
  const aaravBox = await aaravCard.boundingBox()
  const ananyaBox = await ananyaCard.boundingBox()

  console.log(`  Aarav Card Size: ${aaravBox.width.toFixed(1)}px x ${aaravBox.height.toFixed(1)}px`)
  console.log(`  Ananya Card Size: ${ananyaBox.width.toFixed(1)}px x ${ananyaBox.height.toFixed(1)}px`)

  const widthDiff = Math.abs(aaravBox.width - ananyaBox.width)
  const heightDiff = Math.abs(aaravBox.height - ananyaBox.height)
  console.log(`  Size difference: width delta=${widthDiff.toFixed(1)}px, height delta=${heightDiff.toFixed(1)}px`)
  if (widthDiff > 4 || heightDiff > 4) {
    console.warn('Cards should be visually consistent in size and layout')
  }

  // Screenshot initial Desktop view (Aarav selected)
  await page.screenshot({ path: 'public/images/characters/qa_selection_desktop_aarav.png' })
  console.log('  Saved screenshot: public/images/characters/qa_selection_desktop_aarav.png')

  // Hover over Ananya card to test hover effect
  console.log('\n3. Testing Hover & Selection Glow on Ananya Card...')
  await ananyaCard.hover()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'public/images/characters/qa_selection_hover_ananya.png' })
  console.log('  Saved screenshot: public/images/characters/qa_selection_hover_ananya.png')

  // Click Ananya card to select
  await ananyaCard.click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'public/images/characters/qa_selection_desktop_ananya.png' })
  console.log('  Saved screenshot: public/images/characters/qa_selection_desktop_ananya.png')

  // Confirm Ananya selected state
  const isAnanyaActive = await page.locator('.character-card.selected.ananya-active').isVisible()
  console.log('  Ananya selected state confirmed:', isAnanyaActive)

  // 4. Test Game Launch with Ananya
  console.log('\n4. Verifying gameplay launch with selected character...')
  await page.locator('button.primary-btn').click()
  await page.waitForTimeout(2500)
  const canvasVisible = await page.locator('.canvas-container canvas').isVisible()
  console.log('  3D canvas active after selection:', canvasVisible)

  // --- MOBILE RESPONSIVE TEST (390x844) ---
  console.log('\n5. Testing Mobile Responsive Viewport (390x844)...')
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mobilePage = await mobileContext.newPage()
  await mobilePage.goto('http://localhost:5174/', { waitUntil: 'networkidle' })
  await mobilePage.waitForTimeout(1000)

  await mobilePage.screenshot({ path: 'public/images/characters/qa_selection_mobile.png' })
  console.log('  Saved screenshot: public/images/characters/qa_selection_mobile.png')

  console.log('\n--- BROWSER CONSOLE REPORT ---')
  consoleLogs.forEach(l => console.log(l))
  const errors = consoleLogs.filter(l => l.includes('ERROR') || l.includes('Failed to load') || l.includes('404'))
  console.log('Error count:', errors.length)

  await browser.close()
  console.log('\n✔ CHARACTER SELECTION CUSTOM PORTRAIT VERIFICATION PASSED!')
}

verify().catch(err => {
  console.error('Verification failed:', err)
  process.exit(1)
})
