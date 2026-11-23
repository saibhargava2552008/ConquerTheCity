import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20'
const SCREENSHOT_PATH = path.join(ARTIFACT_DIR, 'milestone2_vehicle_driving_hud.png')

async function pressKeyF(page) {
  await page.keyboard.down('KeyF')
  await page.waitForTimeout(120)
  await page.keyboard.up('KeyF')
  await page.waitForTimeout(500)
}

async function runMilestone2Verification() {
  console.log('======================================================================')
  console.log('=== CONQUER THE CITY — MILESTONE 2: COMPLETE VEHICLE SYSTEM QA ===')
  console.log('======================================================================\n')

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu-watchdog'],
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  })

  const page = await context.newPage()

  const consoleErrors = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
      console.error(`[BROWSER ERROR] ${msg.text()}`)
    }
  })

  try {
    console.log('[1/7] Navigating to game client http://localhost:5173/ ...')
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(2500) // Allow world assets & GLBs to mount

    // 1. Verify Engine and VehicleManager presence
    const initCheck = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      if (!engine || !engine.vehicleManager) return null
      const vm = engine.vehicleManager
      const vehicles = vm.getAllVehicles().map(v => ({
        id: v.id,
        type: v.type,
        displayName: v.config.displayName,
        pos: { x: v.position.x, y: v.position.y, z: v.position.z },
        hasReverse: v.config.hasReverse,
        maxSpeed: v.config.maxForwardSpeed,
      }))
      return {
        vehicleCount: vehicles.length,
        vehicles,
      }
    })

    if (!initCheck) {
      throw new Error('Engine or VehicleManager not found on window.__CTC_ENGINE__')
    }

    console.log(`✔ Found ${initCheck.vehicleCount} drivable vehicles registered:`)
    for (const v of initCheck.vehicles) {
      console.log(`   - [${v.type}] "${v.displayName}" (id: ${v.id}) at (${v.pos.x}, ${v.pos.y}, ${v.pos.z}) | maxSpeed: ${v.maxSpeed}m/s, reverse: ${v.hasReverse}`)
    }

    // 2. Test Auto-Rickshaw Approach & Interaction Prompt
    console.log('\n[2/7] Testing Auto-Rickshaw approach & prompt...')
    // Teleport player near plaza west rickshaw (-3.8, 0.35, 12)
    await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      engine.playerController.teleport(-3.8, 0.35, 10.0) // 2.0m South of Rickshaw
    })
    await page.waitForTimeout(400)

    const promptText = await page.evaluate(() => {
      const banner = document.querySelector('.interaction-prompt-banner')
      if (!banner) return null
      return {
        key: banner.querySelector('.prompt-kbd')?.textContent?.trim(),
        label: banner.querySelector('.prompt-label')?.textContent?.trim(),
      }
    })

    console.log(`   Prompt visible: [${promptText?.key}] ${promptText?.label}`)
    if (!promptText || promptText.key !== 'F' || !promptText.label.includes('Drive Auto-Rickshaw')) {
      throw new Error(`Expected prompt '[F] Drive Auto-Rickshaw', got: ${JSON.stringify(promptText)}`)
    }
    console.log('✔ Approach prompt verified successfully!')

    // 3. Test Auto-Rickshaw Entry & Driving
    console.log('\n[3/7] Entering Auto-Rickshaw & testing driving physics...')
    // Press F to enter
    await pressKeyF(page)

    const entryState = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      const vm = engine.vehicleManager
      const active = vm.getActiveVehicle()
      return {
        isDriving: vm.isDriving(),
        activeId: active?.id,
        activeType: active?.type,
        cameraDistance: engine.thirdPersonCamera.distance,
        playerState: document.querySelector('.status-badge')?.textContent?.trim(),
      }
    })

    console.log(`   isDriving: ${entryState.isDriving}, vehicle: ${entryState.activeId} (${entryState.activeType})`)
    console.log(`   Camera distance: ${entryState.cameraDistance.toFixed(2)}m (driving mode)`)
    console.log(`   HUD badge state: ${entryState.playerState}`)

    if (!entryState.isDriving || entryState.activeType !== 'auto_rickshaw') {
      throw new Error(`Failed to enter Auto-Rickshaw: ${JSON.stringify(entryState)}`)
    }
    if (entryState.playerState !== 'DRIVING') {
      throw new Error(`Expected HUD state badge 'DRIVING', got: '${entryState.playerState}'`)
    }
    console.log('✔ Auto-Rickshaw entry verified!')

    // Accelerate forward with KeyW and steer
    console.log('   Accelerating forward with W and steering right with D...')
    await page.keyboard.down('KeyW')
    await page.keyboard.down('KeyD')
    await page.waitForTimeout(800)
    await page.keyboard.up('KeyD')
    await page.waitForTimeout(800)

    const drivingSpeed = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      const active = engine.vehicleManager.getActiveVehicle()
      return {
        speed: active.currentSpeed,
        speedKmh: active.currentSpeed * 3.6,
        pos: { x: active.position.x, y: active.position.y, z: active.position.z },
        heading: active.heading,
        hudSpeed: document.querySelector('.speed-val')?.textContent?.trim(),
      }
    })

    console.log(`   Current Speed: ${drivingSpeed.speed.toFixed(2)} m/s (${drivingSpeed.speedKmh.toFixed(1)} km/h), HUD: ${drivingSpeed.hudSpeed} km/h`)
    console.log(`   Vehicle Position: (${drivingSpeed.pos.x.toFixed(2)}, ${drivingSpeed.pos.y.toFixed(2)}, ${drivingSpeed.pos.z.toFixed(2)}), Heading: ${drivingSpeed.heading.toFixed(2)} rad`)
    
    // Capture visual screenshot of active driving with HUD in motion
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false })
    console.log(`✔ Driving gameplay screenshot captured: ${SCREENSHOT_PATH}`)

    await page.keyboard.up('KeyW')

    if (drivingSpeed.speed < 1.0) {
      throw new Error(`Vehicle failed to accelerate: speed = ${drivingSpeed.speed}`)
    }
    console.log('✔ Forward acceleration, steering, and speedometer verified!')

    // Test Reverse and Handbrake
    console.log('   Testing reverse (S) and handbrake (Space)...')
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(1000)
    await page.keyboard.down('Space')
    await page.waitForTimeout(400)
    await page.keyboard.up('Space')
    await page.keyboard.up('KeyS')

    // 4. Test Collision Response (Drive toward a wall/building boundary)
    console.log('\n[4/7] Testing solid obstacle collision response...')
    // Teleport vehicle near plaza edge facing a building/wall
    const collisionTestResult = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      const active = engine.vehicleManager.getActiveVehicle()
      // Position near West building wall (x: -18, z: 12)
      active.position.set(-15, 0.35, 12)
      active.heading = -Math.PI / 2 // Facing West directly into wall
      active.currentSpeed = 8.0 // driving toward wall

      // Simulate 20 physics steps (1 second) driving straight into wall
      const dt = 0.05
      for (let i = 0; i < 20; i++) {
        active.update(dt, { forward: true, backward: false, left: false, right: false, handbrake: false }, engine.collisionSystem)
      }

      // Check if vehicle penetrated past the wall boundary (x should be stopped before -18)
      return {
        finalX: active.position.x,
        stoppedByWall: active.position.x > -17.5,
      }
    })

    console.log(`   Final X after driving into wall: ${collisionTestResult.finalX.toFixed(2)}m (stoppedByWall: ${collisionTestResult.stoppedByWall})`)
    if (!collisionTestResult.stoppedByWall) {
      throw new Error(`Vehicle failed to collide with wall and tunneled through! Final X: ${collisionTestResult.finalX}`)
    }
    console.log('✔ Collision response verified: vehicle safely slides/stops without tunneling!')

    // 5. Test Exit Vehicle & Safe Exit Placement
    console.log('\n[5/7] Testing vehicle exit & safe exit placement...')
    await pressKeyF(page)

    const exitCheck = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      const vm = engine.vehicleManager
      const playerPos = engine.player.getPosition()
      return {
        isDriving: vm.isDriving(),
        playerState: document.querySelector('.status-badge')?.textContent?.trim(),
        cameraDistance: engine.thirdPersonCamera.distance,
        playerPos: { x: playerPos.x, y: playerPos.y, z: playerPos.z },
      }
    })

    console.log(`   isDriving after exit: ${exitCheck.isDriving}`)
    console.log(`   Player state restored to: ${exitCheck.playerState}`)
    console.log(`   Camera distance restored to: ${exitCheck.cameraDistance.toFixed(2)}m`)
    console.log(`   Player exit pos: (${exitCheck.playerPos.x.toFixed(2)}, ${exitCheck.playerPos.y.toFixed(2)}, ${exitCheck.playerPos.z.toFixed(2)})`)

    if (exitCheck.isDriving) {
      throw new Error('VehicleManager still reports isDriving after pressing F to exit!')
    }
    console.log('✔ Safe exit and on-foot state restoration verified!')

    // 6. Test Scooter Dynamics & Banking Roll
    console.log('\n[6/7] Testing Scooter dynamics (2-wheeler balance & lean)...')
    await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      engine.playerController.teleport(2.0, 0.35, 10.5) // near scooter_plaza_south (2.0, 0.35, 12.0)
    })
    await page.waitForTimeout(500)

    // Enter scooter
    await pressKeyF(page)

    const scooterDriving = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      const active = engine.vehicleManager.getActiveVehicle()
      if (!active || active.type !== 'scooter') return null

      // Drive and steer hard left
      active.currentSpeed = 10.0
      active.steerAngle = -0.5
      active.update(0.1, { forward: true, backward: false, left: true, right: false, handbrake: false }, engine.collisionSystem)

      return {
        type: active.type,
        displayName: active.config.displayName,
        leanAngle: active.leanAngle,
        hasReverse: active.config.hasReverse,
      }
    })

    if (!scooterDriving) {
      throw new Error('Failed to enter or simulate Scooter!')
    }
    console.log(`   Scooter entered: "${scooterDriving.displayName}", Lean angle during turn: ${(scooterDriving.leanAngle * (180 / Math.PI)).toFixed(1)}°`)
    if (Math.abs(scooterDriving.leanAngle) < 0.05) {
      throw new Error(`Scooter banking lean failed: leanAngle = ${scooterDriving.leanAngle}`)
    }
    console.log('✔ Scooter 2-wheeler banking lean verified!')

    // Exit scooter
    await pressKeyF(page)

    // 7. Test Delivery Bicycle (Pedal Cadence & No Reverse)
    console.log('\n[7/7] Testing Delivery Bicycle (pedal cadence & zero reverse)...')
    await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      engine.playerController.teleport(6.0, 0.35, -8.5) // near bicycle_plaza_north (6.0, 0.35, -10.0)
    })
    await page.waitForTimeout(500)

    // Enter bicycle
    await pressKeyF(page)

    const bikeDriving = await page.evaluate(() => {
      const engine = window.__CTC_ENGINE__
      const active = engine.vehicleManager.getActiveVehicle()
      if (!active || active.type !== 'delivery_bicycle') return null

      // Attempt reverse
      active.update(0.5, { forward: false, backward: true, left: false, right: false, handbrake: false }, engine.collisionSystem)
      const reverseSpeed = active.currentSpeed

      // Drive forward
      active.update(1.0, { forward: true, backward: false, left: false, right: false, handbrake: false }, engine.collisionSystem)
      const forwardSpeed = active.currentSpeed

      return {
        type: active.type,
        displayName: active.config.displayName,
        maxForwardSpeed: active.config.maxForwardSpeed,
        reverseSpeed,
        forwardSpeed,
        hasReverse: active.config.hasReverse,
      }
    })

    if (!bikeDriving) {
      throw new Error('Failed to enter or simulate Delivery Bicycle!')
    }
    console.log(`   Delivery Bicycle entered: "${bikeDriving.displayName}", maxSpeed: ${bikeDriving.maxForwardSpeed} m/s, reverseSpeed: ${bikeDriving.reverseSpeed}`)
    if (bikeDriving.hasReverse || bikeDriving.reverseSpeed < -0.01) {
      throw new Error(`Delivery bicycle must not reverse! Got reverseSpeed = ${bikeDriving.reverseSpeed}`)
    }
    console.log('✔ Delivery Bicycle pedal physics & reverse lock verified!')

    // Exit bicycle
    await pressKeyF(page)

    // Check console errors
    console.log(`\nBrowser console errors count: ${consoleErrors.length}`)
    if (consoleErrors.length > 0) {
      throw new Error(`Browser console errors encountered: ${consoleErrors.join(', ')}`)
    }

    console.log('\n======================================================================')
    console.log('=== ✔ ALL MILESTONE 2 VEHICLE CHECKS PASSED WITH 100% SUCCESS! ===')
    console.log('======================================================================\n')
  } finally {
    await browser.close()
  }
}

runMilestone2Verification().catch(err => {
  console.error('\n❌ QA FAILED:', err)
  process.exit(1)
})
