import { chromium } from 'playwright'

async function drillIntoMeshes() {
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

    const counts = {}

    // Group by direct child of engine.scene or engine.seaviewTown.group
    for (const child of engine.seaviewTown.group.children) {
      let mCount = 0
      child.traverse((obj) => {
        if (obj.isMesh) mCount++
      })
      const key = child.constructor ? child.constructor.name : (child.name || 'Group')
      counts[`Town -> ${key} (${child.name || 'unnamed'})`] = mCount
    }

    // Also check other direct children of scene
    for (const child of engine.scene.children) {
      if (child === engine.seaviewTown.group) continue
      let mCount = 0
      child.traverse((obj) => {
        if (obj.isMesh) mCount++
      })
      counts[`SceneDirect -> ${child.name || child.constructor.name}`] = mCount
    }

    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  })

  console.log('=== BREAKDOWN OF MESHES IN SCENE ===')
  for (const [name, count] of breakdown) {
    console.log(`${count.toString().padStart(5)} meshes : ${name}`)
  }

  await browser.close()
}

drillIntoMeshes().catch(console.error)
