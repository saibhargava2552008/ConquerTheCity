import { chromium } from 'playwright'

async function drillIntoMeshesPerDistrict() {
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

  const breakdown = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return null

    const districts = [
      { name: 'BeachDistrict', group: engine.seaviewTown.beachDistrict.group },
      { name: 'FishingHarbour', group: engine.seaviewTown.fishingHarbour.group },
      { name: 'MarketDistrict', group: engine.seaviewTown.marketDistrict.group },
      { name: 'ResidentialDistrict', group: engine.seaviewTown.residentialDistrict.group },
      { name: 'TownCentre', group: engine.seaviewTown.townCentre.group },
      { name: 'RoadNetwork', group: engine.seaviewTown.roadNetwork.group },
      { name: 'CountrysideEdge', group: engine.seaviewTown.countrysideEdge.group },
    ]

    const result = {}
    for (const d of districts) {
      let meshes = 0
      let shadowCasters = 0
      d.group.traverse((obj) => {
        if (obj.isMesh) {
          meshes++
          if (obj.castShadow) shadowCasters++
        }
      })
      result[d.name] = { meshes, shadowCasters }
    }

    if (engine.seaviewTown.marketDistrict.livingWorld) {
      let lwMeshes = 0
      let lwShadows = 0
      engine.seaviewTown.marketDistrict.livingWorld.group.traverse((obj) => {
        if (obj.isMesh) {
          lwMeshes++
          if (obj.castShadow) lwShadows++
        }
      })
      result['MarketLivingWorld'] = { meshes: lwMeshes, shadowCasters: lwShadows }
    }

    let playerMeshes = 0
    let playerShadows = 0
    engine.player.mesh.traverse((obj) => {
      if (obj.isMesh) {
        playerMeshes++
        if (obj.castShadow) playerShadows++
      }
    })
    result['Player'] = { meshes: playerMeshes, shadowCasters: playerShadows }

    return result
  })

  console.log('=== EXACT MESH & SHADOW COUNTS PER DISTRICT ===')
  console.log(JSON.stringify(breakdown, null, 2))

  await browser.close()
}

drillIntoMeshesPerDistrict().catch(console.error)
