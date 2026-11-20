import { chromium } from 'playwright'

async function breakdownRemainingMeshes() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  const aaravCard = page.locator('.character-card:has-text("Aarav")').first()
  if (await aaravCard.isVisible()) {
    await aaravCard.click()
    await page.waitForTimeout(200)
    await page.locator('button.primary-btn').first().click()
  }

  await page.waitForTimeout(4000)

  const meshTypes = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return null

    const types = {}
    engine.scene.traverse((obj) => {
      if (obj.isMesh) {
        let label = 'Unknown'
        if (obj.name) label = obj.name
        else if (obj.parent && obj.parent.name) label = obj.parent.name
        else if (obj.parent && obj.parent.parent && obj.parent.parent.name) label = obj.parent.parent.name

        // Group by prefix
        const prefix = label.split('_')[0] || label
        types[prefix] = (types[prefix] || 0) + 1
      }
    })

    return Object.entries(types).sort((a, b) => b[1] - a[1])
  })

  console.log('=== REMAINING MESHES GROUPED BY PREFIX ===')
  for (const [p, c] of meshTypes) {
    console.log(`${c.toString().padStart(4)} meshes : ${p}`)
  }

  await browser.close()
}

breakdownRemainingMeshes().catch(console.error)
