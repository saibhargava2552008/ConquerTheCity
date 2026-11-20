import { chromium } from 'playwright'

async function inspectMeshSources() {
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

  const analysis = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return null

    const counts = {}

    function getTopParent(obj) {
      let cur = obj
      let lastNamed = cur.name || 'Unnamed'
      while (cur.parent && cur.parent !== engine.scene) {
        cur = cur.parent
        if (cur.name) lastNamed = cur.name
      }
      return lastNamed
    }

    engine.scene.traverse((obj) => {
      if (obj.isMesh) {
        const top = getTopParent(obj)
        counts[top] = (counts[top] || 0) + 1
      }
    })

    // Sort descending
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return sorted.slice(0, 30)
  })

  console.log('=== TOP MESH PRODUCERS IN SCENE ===')
  for (const [name, count] of analysis) {
    console.log(`${count.toString().padStart(5)} meshes : ${name}`)
  }

  await browser.close()
}

inspectMeshSources().catch(console.error)
