import { chromium } from 'playwright'

async function inspectMarketInternals() {
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

  const marketList = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return null

    const items = []
    for (const child of engine.seaviewTown.marketDistrict.group.children) {
      let count = 0
      child.traverse((c) => {
        if (c.isMesh) count++
      })
      items.push({
        name: child.name || 'unnamed',
        type: child.constructor.name,
        meshCount: count,
      })
    }
    return items.sort((a, b) => b.meshCount - a.meshCount)
  })

  console.log('=== MARKET DISTRICT CHILDREN BREAKDOWN ===')
  for (const it of marketList) {
    console.log(`${it.meshCount.toString().padStart(4)} meshes : [${it.type}] ${it.name}`)
  }

  await browser.close()
}

inspectMarketInternals().catch(console.error)
