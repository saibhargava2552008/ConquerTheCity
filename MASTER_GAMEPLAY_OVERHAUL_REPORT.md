# Conquer The City — Master Gameplay & World Interaction Overhaul
## Phase 0: Project Audit, Baseline Analysis & Implementation Plan
**Date:** November 20, 2026 | **Branch:** `feature/master-gameplay-overhaul` | **Commit Baseline:** `2e60a1e`

---

## 1. Executive Summary

A comprehensive architectural and live runtime probe of **Conquer The City** was performed on the clean `feature/master-gameplay-overhaul` branch. 

While the 3D environment is richly populated with 7 distinct districts, realistic Indian coastal assets, and 428 spatial colliders, the city currently functions as a **semi-interactive walking simulator**:
* **Vehicles:** 9 static vehicles and 2 ambient vehicles exist in the world, but **none are drivable, enterable, or interactive**. Static vehicles act purely as rigid obstacles, while ambient vehicles patrol fixed waypoints with no collision or player interaction.
* **NPCs:** Only 14 NPCs exist, all confined exclusively to `MarketDistrict`. 6 of them patrol predetermined waypoints without collision checking against buildings or obstacles; 5 are static shopkeepers; and 3 are at the Chai stall. The remaining 6 districts (Town Centre, Beach Promenade, Fishing Harbour, Residential District, Countryside Edge) have **zero pedestrians**.
* **Interactions:** The `InputManager` completely lacks an `interact` keybinding (`KeyF`). Even though the UI displays `[F] Interact`, pressing `F` does nothing anywhere in the world.
* **Buildings:** 8 buildings have walkable interiors or open colonnades with collision boundaries, but residential houses and shops are exterior-only bodies with walkable front verandas.

---

## 2. Architecture & Existing Systems Inventory

| System | Source Files | Current Functionality | Reusability Assessment |
| :--- | :--- | :--- | :--- |
| **Player Controller** | `src/game/entities/PlayerController.ts`<br>`src/game/entities/Player.ts` | Camera-relative WASD, sprint stamina, jump kinematics, coyote time, jump buffering, step-up curb climbing, smooth facing angle interpolation, wall sliding. | **100% Reusable.** Keep as primary on-foot controller. |
| **Camera Controller** | `src/game/camera/ThirdPersonCamera.ts` | Spherical orbit (yaw/pitch/distance), mouse look, scroll zoom, wall line-of-sight occlusion raycasting, ground height clamping. | **100% Reusable.** Extend to support vehicle follow camera mode when driving. |
| **Collision System** | `src/game/physics/CollisionSystem.ts`<br>`src/game/world/districts/DistrictHelper.ts` | 428 registered AABB colliders. Provides `resolveHorizontalMovement`, `getGroundHeight`, `isPositionBlocked`, `checkLineOfSight`, and `checkTriggers`. | **Core Foundation.** Extend with dynamic entity collision, vehicle bounds, and surface type tags. |
| **Vehicle System** | `src/game/world/market/MarketVehicle.ts`<br>`src/game/world/districts/DistrictHelper.ts` | Static props with box colliders + 2 waypoint-following ambient props in Market District. | **Needs Overhaul.** Missing driving physics, seat placement, entry/exit state machine, and player driving controls. |
| **NPC System** | `src/game/world/market/MarketNPC.ts`<br>`src/game/world/market/MarketLivingWorld.ts` | 14 market NPCs (6 walking pedestrians, 5 shopkeepers, 1 chai wallah, 2 customers) with cloned skeletal animation mixers and distance LOD. | **Reusable Skeletal Rigging.** Upgrade waypoint follower into city-wide pedestrian navigation graph with building collision avoidance. |
| **Road & Concourse Network** | `src/game/world/districts/RoadNetwork.ts` | Complete interconnected roads (Marine Boulevard, Promenade Concourse, Market Bazaar, Residential Avenue, Highway, Harbour Road) with crosswalks, curbs, and ramps. | **100% Reusable.** Ready for vehicle routes and traffic lanes. |
| **Input System** | `src/game/input/InputManager.ts`<br>`src/game/core/Types.ts` | WASD, Shift (Sprint), Space (Jump), Mouse look, Wheel zoom. Pointer lock management. | **Needs Extension.** Add `KeyF` (Interact / Enter / Exit) and `handbrake` input. |
| **HUD & UI Overlay** | `src/components/HUD.tsx`<br>`src/components/ControlsOverlay.tsx` | Live FPS, frame time, draw calls, poly count, speedometer, stamina bar, coordinates, objective checklist. | **Reusable.** Add dynamic contextual interaction prompt overlay (`[F] Enter Auto-Rickshaw`, `[F] Talk`, etc.). |
| **District Lifecycle** | `src/game/world/SeaviewTown.ts`<br>`src/game/core/Engine.ts` | Modular initialization, synchronized updates (waves, lighthouse beacon, market living world), clean disposal. | **100% Reusable.** Keep as main world container. |

---

## 3. Detailed Audit Findings

### 3.1 Existing Functional Systems
1. **Playable Character Kinematics & Animations:** 8 animation clips each for Aarav and Ananya (`Idle`, `Walk`, `Run`, `Sprint`, `Jump`, `Landing`, `Turn_Left`, `Hand_Interaction`) with stride phase synchronization.
2. **Static Collision & Wall Depenetration:** 428 static colliders prevent player movement through building walls, retaining walls, balustrades, pier edges, and large props.
3. **Third-Person Orbit Camera:** Smooth damping, wall occlusion pull-forward, and pitch clamping.
4. **Mission Objectives:** 6 recon checkpoints (Lighthouse, Beach, Wharf, Bazaar, Residential, Outpost) with trigger radii.

### 3.2 Decorative-Only Objects
1. **All Vehicles:**
   - 6 Auto-Rickshaws (`prop_auto_rickshaw`): 2 in Town Centre, 2 along Road Network, 1 in Market District, 1 moving ambient. None can be entered or driven.
   - 2 Scooters (`prop_indian_scooter_01`): Parked along Market District curbs. Decorative only.
   - 2 Delivery Bicycles (`prop_delivery_bicycle_01`): 1 parked, 1 moving ambient. Decorative only.
   - 4 Fishing Boats (`prop_indian_dhoni_boat_01` & `prop_coastal_boat`): Moored at Fishing Harbour. Walkable decks, but engines/rudders are decorative.
   - **Note on Cars, Trucks, Buses, Emergency Vehicles:** No 3D model assets or code exist in the project for cars, trucks, or buses. They are currently completely absent.
2. **Street Furniture:**
   - 12 Promenade & Plaza Benches: Solid colliders, but player and NPCs cannot sit on them.
   - Beach Foot-wash Stations: Visual props with water taps; no interaction.
   - Waste Bins, Electrical Feeders, Drainage Gutters: Static visual dressing.

### 3.3 Broken & Missing Interactions
1. **Interaction Key (`KeyF`) Unbound:** `InputManager` ignores `KeyF`. Pressing `F` produces no state change.
2. **Contextual Prompt Missing:** No proximity detection to inform the player when near a drivable vehicle, an enterable building, a bench, or an NPC.
3. **No Vehicle Entry/Exit Logic:** No state machine to transition from on-foot player controller to vehicle driving controller.

### 3.4 Missing Collision Boundaries & NPC Clipping
1. **NPC Building Clipping:** `MarketNPC` updates position purely via waypoint lerp (`this.position.add(...)`). It performs **no collision checks** against `CollisionSystem`. If nudged or if waypoints cross a structure, NPCs walk directly through solid walls.
2. **Ambient Vehicle Clipping:** `MarketVehicle` only checks player proximity; it does not check static obstacles, buildings, or pedestrians.
3. **Water Hazard Boundary:** Deep water barrier exists at $X = -62$, but shallow harbor water under piers allows walking along the sea floor at $Y = -0.75\text{m}$ unless blocked by water surface colliders.

### 3.5 Building Accessibility Breakdown

| Building / Asset | District | Classification | Current State | Target Overhaul State |
| :--- | :--- | :--- | :--- | :--- |
| **Fishermen's Cooperative** (Asset 9) | Fishing Harbour | **Enterable (Interior)** | Walkable veranda, reception counter, interior office floor ($Y = 0.4\text{m}$). | **VERIFIED PLAYABLE.** Retain all colliders; add NPC clerk & interaction. |
| **Fish Auction Pavilion** (Asset 8) | Fishing Harbour | **Enterable (Covered)** | Raised covered floor, sorting tables, scale station ($Y = 0.4\text{m}$). | **VERIFIED PLAYABLE.** Retain all colliders; add auctioneer NPC. |
| **Fishery Cold Storage** (Asset 7) | Fishing Harbour | **Enterable (Interior)** | Concrete loading dock ($Y = 1.2\text{m}$), interior warehouse floor. | **VERIFIED PLAYABLE.** Retain all colliders. |
| **Dhoni Fishing Boat** (Asset 6) | Fishing Harbour | **Enterable (Vessel)** | Walkable gangway ramp and boat deck ($Y = 0.35\text{m}$). | **VERIFIED PLAYABLE.** Retain colliders; evaluate helm interaction. |
| **Shop Cluster** (Asset 3) | Market District | **Enterable (Plinth/Stalls)** | Granite plinth walkway ($Y = 0.30\text{m}$), 4 open stall counters. | **VERIFIED PLAYABLE.** Add vendor interactions at Kirana & Pharmacy. |
| **Commercial Arcade** (Asset 2) | Market District | **Enterable (Colonnade)** | Covered colonnade walkway ($Y = 0.35\text{m}$), arches. | **VERIFIED PLAYABLE.** Add pedestrian shoppers and shopkeeper. |
| **Highway Outpost Cabin** | Countryside Edge | **Enterable (Interior)** | Interior floor ($Y = 0.15\text{m}$), open doorway, 3 solid walls. | **VERIFIED PLAYABLE.** Retain colliders; add outpost guard. |
| **Seaview Lighthouse Base** | Town Centre | **Enterable (Vestibule)** | South archway opening, circular base interior. | **VERIFIED PLAYABLE.** Retain colliders. |
| **Beach Shacks** (2 locations) | Beach District | **Enterable (Deck/Cafe)** | Raised timber deck ($Y = 0.4\text{m}$), bar counters, side stairs. | **VERIFIED PLAYABLE.** Retain colliders; add shack vendor. |
| **Coastal Residence** (Asset 4) | Residential | **Exterior-Only (Veranda)** | Solid house body collider, walkable front veranda ($Y = 0.35\text{m}$). | **SOLID EXTERIOR.** No interior modeled in GLB. Keep solid. |
| **Heritage Villa Gulmohar** | Residential | **Exterior-Only (Veranda)** | Solid body collider, walkable veranda & gate courtyard. | **SOLID EXTERIOR.** No interior modeled. Keep solid. |
| **Residential Villas (3 houses)** | Residential | **Exterior-Only (Veranda)** | Solid body colliders, walkable porches. | **SOLID EXTERIOR.** No interior modeled. Keep solid. |
| **Market Houses (2 shops)** | Market District | **Exterior-Only (Veranda)** | Solid body colliders, walkable shopfront verandas. | **SOLID EXTERIOR.** No interior modeled. Keep solid. |

---

## 4. Implementation Plan (Phased Milestones)

### Milestone 1: Universal Collision & World Physics (Phase 1)
- Extend `CollisionSystem.ts` with:
  - Dynamic collider support (moving vehicles and NPCs).
  - Surface type query (`road`, `sidewalk`, `sand`, `wood_deck`, `water_hazard`).
  - Water surface boundary preventing character walking into sea water unless on boat gangway/deck.
- Verify every building footprint has tight, non-penetrating colliders matching visible geometry.
- Run automated physics and collision tests.

### Milestone 2: Complete Vehicle System (Phase 2)
- Implement `src/game/vehicles/VehicleSystem.ts` and `VehicleController.ts`:
  - **Auto-Rickshaw (`prop_auto_rickshaw`):** 3-wheel kinematics, top speed $12.5\text{ m/s}$ ($45\text{ km/h}$), agile steering, reverse gear, handbrake.
  - **Scooter (`prop_indian_scooter_01`):** 2-wheel lean kinematics, top speed $15.0\text{ m/s}$ ($54\text{ km/h}$), responsive braking.
  - **Delivery Bicycle (`prop_delivery_bicycle_01`):** Pedal acceleration curve, top speed $6.0\text{ m/s}$ ($22\text{ km/h}$).
  - *Vehicle Classification:* Clearly document that cars, trucks, and buses are not present in assets and remain non-implemented.
- Implement **Vehicle Entry & Exit**:
  - Proximity detection ($< 2.5\text{m}$ to driver seat).
  - Press `F` to enter: Player seated in vehicle, character on-foot mesh hidden/aligned, camera switches to vehicle driving follow mode.
  - Press `F` to exit: Safe raycast de-penetration beside driver door; prevents exiting inside walls or obstacles.
- Implement Driving Controls:
  - `W` (Accelerate), `S` (Brake / Reverse), `A`/`D` (Steer), `Space` (Handbrake), `F` (Exit).
  - Vehicle collision resolution vs buildings, walls, and other vehicles.

### Milestone 3: NPC & Pedestrian Intelligence (Phase 3)
- Implement `src/game/ai/CityNavigationGraph.ts`:
  - Waypoint network covering sidewalks, plazas, and pedestrian concourses across **all 5 major pedestrian districts** (Town Centre, Beach Promenade, Market Bazaar, Residential Avenue, Fishing Harbour Wharf).
  - Nodes and edges strictly validated to be outside building collision boundaries.
- Upgrade `NPCManager.ts`:
  - Pedestrians query `CollisionSystem.isPositionBlocked` during movement, guaranteeing **zero wall penetration**.
  - Local collision avoidance between pedestrians and parked vehicles.
  - Authentic daily activities: walking on sidewalks, browsing stall counters, sitting on benches, conversing in pairs in plazas.
  - Ambient vehicle drivers seated inside moving vehicles.

### Milestone 4: Building Entrance & Interior System (Phase 4)
- Formalize building accessibility contracts:
  - Enterable buildings verified: Fishermen's Co-op, Auction Pavilion, Cold Storage, Dhoni Boat, Shop Cluster, Commercial Arcade, Lighthouse Base, Outpost Cabin, Beach Shacks.
  - Exterior-only buildings kept solidly enclosed (no artificial wall clipping).
  - Add entry waypoints and interior navigation markers for NPCs.

### Milestone 5: Universal Interaction Framework (Phase 5)
- Extend `InputManager.ts` to capture `KeyF` (Interact).
- Create `src/game/interaction/InteractionSystem.ts`:
  - Scans interactables within $2.5\text{m}$ interaction cone.
  - Emits events to React HUD: displays dynamic badge (`[F] Drive Auto-Rickshaw`, `[F] Talk to Murugan`, `[F] Sit on Bench`, `[F] Exit Vehicle`).
  - Dispatches interaction triggers cleanly without key conflicts.

### Milestone 6: Road Network & Connectivity (Phase 6)
- Verify and tune seamless transitions between:
  - Marine Boulevard $\leftrightarrow$ Central Promenade $\leftrightarrow$ Town Plaza.
  - Marine Boulevard $\leftrightarrow$ Harbour Road $\leftrightarrow$ Wharf.
  - Town Plaza $\leftrightarrow$ Market Bazaar $\leftrightarrow$ Residential Avenue $\leftrightarrow$ Highway.
- Ensure vehicle curbs, crosswalks, and pedestrian ramps have zero invisible step obstructions.

### Milestone 7: Gameplay QA & Player Perspective Verification (Phases 7, 8, 9)
- Run unit and movement test suites (`npm test`).
- End-to-end Playwright live browser testing:
  - Player driving Auto-Rickshaw, Scooter, and Bicycle along roads.
  - Entering and exiting vehicles without collision clipping.
  - NPCs walking along sidewalks without crossing walls.
  - Player entering all 8 supported building interiors.
  - Sitting on benches and interacting with shop vendors.
  - Measure 60 FPS performance, draw calls, and memory.
  - Capture genuine gameplay screenshots.

### Milestone 8: Final Report & Delivery (Phase 10)
- Update `MASTER_GAMEPLAY_OVERHAUL_REPORT.md` with complete verification data, screenshot embeds, and final status classifications (`VERIFIED PLAYABLE`, `DECORATIVE ONLY`, etc.).

---

## 5. Milestone 1 Completion & Verification Report

**Status:** ✅ **PASS — ALL ACCEPTANCE TESTS VERIFIED IN LIVE ENGINE**  
**Date:** November 20, 2026 | **Branch:** `feature/master-gameplay-overhaul`

### 5.1 Systems Implemented
1. **Dynamic Collider Updating & Management:**
   - Added `updateCollider(id, newBox)` to `CollisionSystem.ts` for real-time tracking of dynamic colliders (vehicles, moving objects).
   - Added `inferSurfaceType(c)` and `getGroundInfo(x, y, z, r): { height, surfaceType }` and `getSurfaceType(...)` supporting `'ground' | 'road' | 'sidewalk' | 'sand' | 'wood_deck' | 'interior' | 'water_hazard'`.
   - Registered road colliders for Marine Coastal Boulevard, Central Boulevard, and North Harbour Access Road in `RoadNetwork.ts` to guarantee authentic road detection.
   - Protected ground planes from horizontal de-penetration false-positives and fixed negative ground height query bugs.
2. **Vehicle Kinematics Movement Solver Foundation:**
   - Implemented `resolveVehicleMovement(position, velocity, halfWidth, halfLength, height, dt, ignoreColliderId)` in `CollisionSystem.ts` supporting continuous AABB collision resolution, curb stepping (up to $0.25\text{m}$), and wall sliding for vehicle chassis.
3. **Collision-Aware Pedestrian Navigation:**
   - Injected `CollisionSystem` into `MarketNPC`.
   - Pedestrians now execute real-time collision verification via `collisionSystem.isPositionBlocked` before advancing along waypoints and when receiving lateral avoidance nudges.
   - Added dynamic `getGroundHeight` foot snapping so NPC elevations naturally adapt to sidewalk curbs and plinth steps.
   - Adjusted east pedestrian waypoint corridor away from utility feeder pillar.
4. **Interaction Foundation & Contextual HUD Overlay:**
   - Created `src/game/interaction/InteractionManager.ts` with proximity tracking, prompt dispatching, and single-pulse key consumption.
   - Bound `KeyF` (`interact`) and `Space` (`handbrake`) into `InputManager.ts`.
   - Added floating `.interaction-prompt-banner` with styled `<kbd>F</kbd>` badge and action description in `HUD.tsx` and `App.css`.

### 5.2 Live Automated Playwright Browser Verification
A full browser audit was executed on the live Vite development server at `http://localhost:5173/` (`scripts/verify_milestone1_complete.mjs`):

| Test Suite / Category | Metric / Target | Result | Status |
| :--- | :--- | :--- | :--- |
| **Spatial Colliders** | Registration count | **431 colliders** active | ✅ PASS |
| **Surface Detection** | Marine Coastal Boulevard | `road` | ✅ PASS |
| **Surface Detection** | Coastal Beach | `sand` | ✅ PASS |
| **Surface Detection** | Fishing Wharf Deck | `wood_deck` | ✅ PASS |
| **Surface Detection** | Town Centre Plaza | `sidewalk` | ✅ PASS |
| **Dynamic Collider Update** | Add, update Box3, remove | Verified in live collision tree | ✅ PASS |
| **Solid Wall Collision** | Solid building perimeter | Blocked = `true` | ✅ PASS |
| **Vehicle Movement Solver** | Multi-axis sliding & normal reflection | Verified with Vector3 kinematics | ✅ PASS |
| **NPC Obstacle Avoidance** | Active pedestrians (6) | **0 inside solid buildings** | ✅ PASS |
| **NPC Ground Snapping** | All living world NPCs (14) | **14 / 14 grounded** | ✅ PASS |
| **HUD Interaction Prompt** | Proximity detection & badge rendering | `[F] Drive Auto-Rickshaw` rendered | ✅ PASS |
| **KeyF Keypress Execution** | `onInteract` trigger dispatch | Fired successfully on `KeyF` | ✅ PASS |
| **Prompt Cleanup** | Unregister target | Prompt removed from HUD | ✅ PASS |
| **Console Errors** | Browser console error log | **0 errors detected** | ✅ PASS |
| **Visual QA Capture** | Player perspective HUD capture | [milestone1_interaction_prompt_hud.png](file:///C:/Users/ssaib/.gemini/antigravity/brain/b9ea6186-3db1-4278-b58c-983263793b20/milestone1_interaction_prompt_hud.png) | ✅ PASS |

### 5.3 Automated Physics & Lifecycle Unit Tests (`npm test`)
All unit tests passed cleanly:
- **Movement Physics:** 12 / 12 tests passed (camera-relative kinematics, reversal braking, stamina, coyote time, de-penetration, tunneling prevention).
- **Aarav Character Rig:** 8 / 8 animation states and transitions verified.
- **Ananya Character Rig:** 8 / 8 animation states and transitions verified.
- **World Accessibility:** 12 / 12 district destinations verified completely walkable without obstruction across all 431 spatial colliders.

---

## 6. Ready for Milestone 2: Complete Vehicle System
With universal collision boundaries, surface detection, dynamic collider management, and the `KeyF` interaction foundation established and verified, the project is ready to proceed to **Milestone 2**:
1. Implement `VehicleController.ts` and `VehicleSystem.ts`.
2. Implement 3 drivable vehicles:
   - **Auto-Rickshaw (`prop_auto_rickshaw`):** 3-wheel kinematics, top speed $12.5\text{ m/s}$ ($45\text{ km/h}$), agile steering, reverse gear, handbrake.
   - **Scooter (`prop_indian_scooter_01`):** 2-wheel lean kinematics, top speed $15.0\text{ m/s}$ ($54\text{ km/h}$).
   - **Delivery Bicycle (`prop_delivery_bicycle_01`):** Pedal acceleration curve, top speed $6.0\text{ m/s}$ ($22\text{ km/h}$).
3. Implement vehicle entry/exit state machine with proximity detection, driver seating, camera mode switching, and safe exit de-penetration.
4. Vehicle driving HUD (speedometer, gear, headlight indicator).
