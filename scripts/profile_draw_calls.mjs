import { chromium } from 'playwright'

async function profileDrawCalls() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // Start game with Aarav
  const aaravCard = page.locator('.character-card:has-text("Aarav")').first()
  if (await aaravCard.isVisible()) {
    await aaravCard.click()
    await page.waitForTimeout(200)
    await page.locator('button.primary-btn').first().click()
  }

  await page.waitForTimeout(4000)

  const stats = await page.evaluate(() => {
    const engine = window.__CTC_ENGINE__
    if (!engine) return null

    const rInfo = engine.renderer.info
    const spawnCalls = rInfo.render.calls
    const spawnTriangles = rInfo.render.triangles

    // Move player into Market Bazaar
    engine.playerController.position.set(38, 0, 30)
    engine.player.setPosition(38, 0, 30)
    engine.thirdPersonCamera.snapBehindPlayer(engine.player.getPosition(), 0)

    // Render one frame
    engine.renderer.render(engine.scene, engine.camera)

    const marketCalls = rInfo.render.calls
    const marketTriangles = rInfo.render.triangles

    // Count meshes by category
    let npcMeshes = 0
    let roadMeshes = 0
    let districtMeshes = 0
    let shadowCasters = 0
    let totalMeshes = 0

    engine.scene.traverse((obj) => {
      if (obj.isMesh) {
        totalMeshes++
        if (obj.castShadow) shadowCasters++

        let cur = obj
        let isNPC = false
        while (cur) {
          if (cur.name && (cur.name.includes('NPC') || cur.name.includes('aarav') || cur.name.includes('ananya'))) {
            isNPC = true
            break
          }
          cur = cur.parent
        }
        if (isNPC) npcMeshes++
      }
    })

    return {
      spawnCalls,
      spawnTriangles,
      marketCalls,
      marketTriangles,
      totalMeshes,
      shadowCasters,
      npcMeshes,
    }
  })

  console.log('=== CURRENT RENDER PROFILING ===')
  console.log(JSON.stringify(stats, null, 2))

  await browser.close()
}

profileDrawCalls().catch(console.error)
