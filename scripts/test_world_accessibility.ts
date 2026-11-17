import * as THREE from 'three'

// Mock minimal DOM for Node test runner
if (typeof document === 'undefined') {
  const mockCtx = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop === 'string') {
          if (prop === 'createLinearGradient') {
            return () => ({
              addColorStop: () => {},
            })
          }
          return () => {}
        }
        return undefined
      },
    }
  )
  const mockCanvas = {
    getContext: () => mockCtx,
    width: 512,
    height: 512,
  }
  class MockDocument extends EventTarget {
    public pointerLockElement: HTMLElement | null = null
    public hidden = false
    public visibilityState = 'visible'
    createElement(tag: string) {
      if (tag === 'canvas') return mockCanvas
      return {}
    }
  }
  class MockWindow extends EventTarget {}
  ;(globalThis as unknown as { document: unknown }).document = new MockDocument()
  ;(globalThis as unknown as { window: unknown }).window = new MockWindow()
}

import { CollisionSystem } from '../src/game/physics/CollisionSystem'
import { MaterialFactory } from '../src/game/world/MaterialFactory'
import { SeaviewTown } from '../src/game/world/SeaviewTown'

/**
 * Automated World Accessibility & Path Connectivity Verification
 * Verifies that all districts, buildings, beach, harbour, market, and residential locations
 * can be physically reached by player navigation without impassable colliders or excessive step heights.
 */

async function runWorldAccessibilityAudit() {
  console.log('======================================================')
  console.log('=== SEAVIEW TOWN WORLD ACCESSIBILITY & CONNECTIVITY AUDIT ===')
  console.log('======================================================\n')

  const scene = new THREE.Scene()
  const materials = new MaterialFactory()
  const collisionSystem = new CollisionSystem()
  const seaview = new SeaviewTown(scene, materials, collisionSystem)

  const colliders = collisionSystem.getColliders()
  console.log(`Total spatial colliders registered in Seaview Town: ${colliders.length}\n`)

  const PLAYER_RADIUS = 0.3
  const PLAYER_HEIGHT = 1.8
  const MAX_STEP_HEIGHT = 0.45

  // Navigation waypoint test routes from Town Spawn (0, 0, 8)
  interface DestinationTest {
    name: string
    category: string
    waypoints: [number, number, number][] // [x, y, z] path
    targetDesc: string
  }

  const destinations: DestinationTest[] = [
    {
      name: 'Town Centre - Plaza Platform',
      category: 'Town Centre',
      waypoints: [
        [0, 0, 8],
        [0, 0.35, 3],
        [0, 0.35, 0],
      ],
      targetDesc: 'Central Plaza Platform at Y = 0.35m',
    },
    {
      name: 'Town Centre - Lighthouse Base Archway',
      category: 'Town Centre',
      waypoints: [
        [0, 0.35, 0],
        [0, 0.35, -2.4],
      ],
      targetDesc: 'Lighthouse South entrance vestibule',
    },
    {
      name: 'Beach District - Central Grand Stairway & Beachfront',
      category: 'Beach District',
      waypoints: [
        [0, 0, 8],
        [0, 0.05, 0],
        [-10, 0.05, 0],
        [-18, 0.25, 0],
        [-23.5, 0.25, 0], // Promenade opening
        [-27.0, 0.15, 0], // Grand Stairs mid
        [-32.0, 0.1, 0],  // Sand landing
        [-40.0, 0.1, 0],  // Beach sand
      ],
      targetDesc: 'Sandy beach waterline through Central Grand Stairs',
    },
    {
      name: 'Beach District - Seaside Cafe Shack Deck',
      category: 'Beach District',
      waypoints: [
        [-20, 0.25, 0],
        [-20, 0.25, -40],
        [-23.5, 0.25, -40], // South Promenade opening
        [-28.0, 0.15, -40], // South boardwalk stairs
        [-34.0, 0.1, -40],  // Boardwalk
        [-34.0, 0.2, -41],  // Front access step onto timber deck
        [-34.0, 0.4, -42],  // Standing at bar counter
        [-36.2, 0.4, -42],  // Deck aisle beside counter
        [-36.2, 0.4, -46],  // Rear deck lounger seating
      ],
      targetDesc: 'Walkable timber deck of Shack Seaside Cafe',
    },
    {
      name: 'Fishing Harbour - Wharf & Finger Pier',
      category: 'Fishing Harbour',
      waypoints: [
        [0, 0, 8],
        [0, 0.05, 0],
        [-10, 0.05, 0],
        [-10, 0.05, 50],
        [-24, 0.05, 50], // Harbour access road through Promenade railing opening
        [-34, 0.4, 50],  // Transition onto Wharf
        [-38.5, 0.4, 70], // Main Wharf pedestrian deck
      ],
      targetDesc: 'Harbour main wharf deck at Y = 0.4m',
    },
    {
      name: 'Fishing Harbour - Moored Boat Deck ("Sea Queen")',
      category: 'Fishing Harbour',
      waypoints: [
        [-38.5, 0.4, 70],
        [-38.5, 0.4, 72],
        [-44.5, 0.4, 72], // Boarding gangway
        [-48.0, 0.4, 72], // Boat open forward deck
      ],
      targetDesc: 'Walkable boat deck via gangway ramp',
    },
    {
      name: 'Fishing Harbour - Warehouse Loading Dock & Interior',
      category: 'Fishing Harbour',
      waypoints: [
        [-38.5, 0.4, 70],
        [-33, 0.4, 63], // Base of South dock stairs
        [-33, 0.8, 66], // Mid-stairs
        [-33, 1.2, 70], // Top of loading dock
        [-31.5, 1.2, 75], // Through open bay door
        [-24.0, 1.2, 75], // Warehouse interior floor
      ],
      targetDesc: 'Warehouse interior concrete floor at Y = 1.2m',
    },
    {
      name: 'Market District - Bazaar Pedestrian Street',
      category: 'Market District',
      waypoints: [
        [0, 0, 8],
        [15, 0.05, 8],
        [38, 0.05, 8], // Central Blvd
        [38, 0.05, 13], // Market Central Access Road
        [38, 0.05, 25], // Enter Bazaar Street
        [38, 0.05, 50], // Central Bazaar
      ],
      targetDesc: 'Bazaar cobblestone pedestrian street',
    },
    {
      name: 'Market District - Stall Counter Front & Shop Veranda',
      category: 'Market District',
      waypoints: [
        [38, 0.05, 50],
        [34, 0.05, 52], // Customer aisle
        [31.4, 0.35, 52], // Shop veranda plinth between pillars
      ],
      targetDesc: 'Walkable shop veranda plinth and stall aisle',
    },
    {
      name: 'Residential District - Avenue via Connector Boulevard',
      category: 'Residential District',
      waypoints: [
        [0, 0, 8],
        [12, 0.05, 8],
        [12, 0.05, 0],
        [12, 0.05, -28], // North-South Residential Connector
        [12, 0.05, -50], // Enter Residential Avenue
        [45, 0.05, -50], // Central Residential Avenue
      ],
      targetDesc: 'Residential Avenue roadway and sidewalks',
    },
    {
      name: 'Residential District - Villa Gulmohar Courtyard & Veranda',
      category: 'Residential District',
      waypoints: [
        [25, 0.05, -50], // Avenue
        [25, 0.05, -43.75], // Sidewalk
        [25, 0.05, -41.0], // Through compound gateway
        [25, 0.05, -39.0], // Garden courtyard
        [25, 0.35, -37.4], // Veranda plinth
      ],
      targetDesc: 'Villa Gulmohar veranda plinth through compound gate',
    },
    {
      name: 'Countryside Outpost - Highway Lanes & Cabin Interior',
      category: 'Countryside District',
      waypoints: [
        [0, 0, 8],
        [20, 0.05, 8],
        [20, 0.05, 3],
        [80, 0.05, 3], // Highway lane
        [95, 0.05, 3], // Highway lane past toll island
        [95, 0.05, 6.8], // Checkpoint cabin doorstep
        [95, 0.15, 9.25], // Inside checkpoint cabin
      ],
      targetDesc: 'Checkpoint cabin interior through front doorway',
    },
  ]

  let allPassed = true

  for (const dest of destinations) {
    console.log(`Testing Path: [${dest.category}] ${dest.name}`)
    console.log(`  Goal: ${dest.targetDesc}`)

    let pathOk = true
    let prevPoint = dest.waypoints[0]

    for (let i = 1; i < dest.waypoints.length; i++) {
      const nextPoint = dest.waypoints[i]
      const [x1, y1, z1] = prevPoint
      const [x2, y2, z2] = nextPoint

      // Check step height increment
      const stepDiff = Math.abs(y2 - y1)
      if (stepDiff > MAX_STEP_HEIGHT) {
        console.error(
          `  ❌ FAILED: Step height ${stepDiff.toFixed(2)}m exceeds max step ${MAX_STEP_HEIGHT}m between (${x1}, ${y1}, ${z1}) and (${x2}, ${y2}, ${z2})`
        )
        pathOk = false
      }

      // Check for unintended solid box collisions along segment
      const numSamples = Math.max(5, Math.ceil(Math.hypot(x2 - x1, z2 - z1) / 0.5))
      for (let s = 0; s <= numSamples; s++) {
        const t = s / numSamples
        const cx = x1 + (x2 - x1) * t
        const cy = y1 + (y2 - y1) * t
        const cz = z1 + (z2 - z1) * t

        // Find which collider blocked the player
        for (let cIdx = 0; cIdx < colliders.length; cIdx++) {
          const c = colliders[cIdx]
          const box = c.box
          if (box.max.y <= cy + MAX_STEP_HEIGHT || box.min.y >= cy + PLAYER_HEIGHT) continue
          if (
            cx + PLAYER_RADIUS > box.min.x &&
            cx - PLAYER_RADIUS < box.max.x &&
            cz + PLAYER_RADIUS > box.min.z &&
            cz - PLAYER_RADIUS < box.max.z
          ) {
            console.error(
              `  ❌ FAILED: Solid obstacle "${c.id}" blocking player at (${cx.toFixed(1)}, ${cy.toFixed(1)}, ${cz.toFixed(1)}), box=[min:(${box.min.x.toFixed(1)},${box.min.y.toFixed(1)},${box.min.z.toFixed(1)}), max:(${box.max.x.toFixed(1)},${box.max.y.toFixed(1)},${box.max.z.toFixed(1)})]`
            )
            pathOk = false
            break
          }
        }

        if (!pathOk) break
      }

      if (!pathOk) break
      prevPoint = nextPoint
    }

    if (pathOk) {
      console.log(`  ✔ PASSED: Completely walkable path verified to ${dest.name}!\n`)
    } else {
      console.log(`  ❌ FAILED: Pathway blocked!\n`)
      allPassed = false
    }
  }

  seaview.dispose()
  materials.dispose()

  if (allPassed) {
    console.log('======================================================')
    console.log('✔ ALL 12 WORLD ACCESSIBILITY DESTINATIONS REACHABLE!')
    console.log('======================================================')
  } else {
    console.error('❌ SOME DESTINATIONS ARE INACCESSIBLE!')
    process.exit(1)
  }
}

runWorldAccessibilityAudit().catch((err) => {
  console.error('Audit Error:', err)
  process.exit(1)
})
