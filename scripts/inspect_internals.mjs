import { chromium } from 'playwright'

async function inspectDistrictInternals() {
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

  const details = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return null

    function getSubtreeSummary(group) {
      const breakdown = {}
      for (const child of group.children) {
        let count = 0
        child.traverse((c) => {
          if (c.isMesh) count++
        })
        const name = child.name || child.constructor.name || 'unnamed'
        breakdown[name] = (breakdown[name] || 0) + count
      }
      return Object.entries(breakdown).sort((a, b) => b[1] - a[1])
    }

    return {
      Market: getSubtreeSummary(engine.seaviewTown.marketDistrict.group).slice(0, 15),
      Residential: getSubtreeSummary(engine.seaviewTown.residentialDistrict.group).slice(0, 15),
      RoadNetwork: getSubtreeSummary(engine.seaviewTown.roadNetwork.group).slice(0, 15),
      Beach: getSubtreeSummary(engine.seaviewTown.beachDistrict.group).slice(0, 15),
      Countryside: getSubtreeSummary(engine.seaviewTown.countrysideEdge.group).slice(0, 15),
    }
  })

  console.log('=== MARKET TOP SUBTREES ===')
  console.log(JSON.stringify(details.Market, null, 2))
  console.log('=== RESIDENTIAL TOP SUBTREES ===')
  console.log(JSON.stringify(details.Residential, null, 2))
  console.log('=== ROAD NETWORK TOP SUBTREES ===')
  console.log(JSON.stringify(details.RoadNetwork, null, 2))
  console.log('=== COUNTRYSIDE TOP SUBTREES ===')
  console.log(JSON.stringify(details.Countryside, null, 2))
  console.log('=== BEACH TOP SUBTREES ===')
  console.log(JSON.stringify(details.Beach, null, 2))

  await browser.close()
}

inspectDistrictInternals().catch(console.error)
