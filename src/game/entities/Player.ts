import * as THREE from 'three'
import { Entity } from './Entity'
import type { MovementState } from '../core/Types'
import { damp } from '../physics/MathUtils'

export class Player extends Entity {
  // Visual limbs and parts for procedural animation
  private modelRoot: THREE.Group
  private head: THREE.Mesh
  private torso: THREE.Mesh
  private leftArmPivot: THREE.Group
  private rightArmPivot: THREE.Group
  private leftLegPivot: THREE.Group
  private rightLegPivot: THREE.Group

  private animPhase = 0
  private currentTilt = 0

  constructor() {
    super('player_character')

    this.modelRoot = new THREE.Group()
    this.mesh.add(this.modelRoot)

    // Materials
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x1d3557, // Deep Navy Urban Jacket
      roughness: 0.6,
      metalness: 0.1,
    })
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x2b2d42, // Charcoal pants
      roughness: 0.7,
      metalness: 0.1,
    })
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe0a96d, // Warm skin tone
      roughness: 0.8,
    })
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4, // Cyan visor/sunglasses
      emissive: 0x00bbf9,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.9,
    })
    const bootsMat = new THREE.MeshStandardMaterial({
      color: 0x111111, // Dark boots
      roughness: 0.8,
    })
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xf72585, // Neon magenta accent stripes
      emissive: 0xf72585,
      emissiveIntensity: 0.3,
    })

    // Torso (center at y = 1.05)
    const torsoGeo = new THREE.BoxGeometry(0.65, 0.75, 0.35)
    this.torso = new THREE.Mesh(torsoGeo, jacketMat)
    this.torso.position.y = 1.05
    this.torso.castShadow = true
    this.torso.receiveShadow = true
    this.modelRoot.add(this.torso)

    // Torso accent stripe
    const stripeGeo = new THREE.BoxGeometry(0.67, 0.1, 0.36)
    const stripe = new THREE.Mesh(stripeGeo, accentMat)
    stripe.position.y = 0.05
    this.torso.add(stripe)

    // Backpack / Cyber Gear
    const packGeo = new THREE.BoxGeometry(0.45, 0.5, 0.2)
    const pack = new THREE.Mesh(packGeo, pantsMat)
    pack.position.set(0, 0.05, -0.25)
    pack.castShadow = true
    this.torso.add(pack)

    // Head (center at y = 1.65)
    const headGeo = new THREE.BoxGeometry(0.35, 0.38, 0.35)
    this.head = new THREE.Mesh(headGeo, skinMat)
    this.head.position.y = 1.62
    this.head.castShadow = true
    this.modelRoot.add(this.head)

    // Visor (indicates front direction clearly)
    const visorGeo = new THREE.BoxGeometry(0.37, 0.12, 0.18)
    const visor = new THREE.Mesh(visorGeo, visorMat)
    visor.position.set(0, 0.02, 0.14)
    this.head.add(visor)

    // Left Arm Pivot (at shoulder height y = 1.35, x = -0.45)
    this.leftArmPivot = new THREE.Group()
    this.leftArmPivot.position.set(-0.45, 1.35, 0)
    this.modelRoot.add(this.leftArmPivot)

    const armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.2)
    const leftArmMesh = new THREE.Mesh(armGeo, jacketMat)
    leftArmMesh.position.y = -0.3
    leftArmMesh.castShadow = true
    this.leftArmPivot.add(leftArmMesh)

    // Right Arm Pivot (at shoulder height y = 1.35, x = +0.45)
    this.rightArmPivot = new THREE.Group()
    this.rightArmPivot.position.set(0.45, 1.35, 0)
    this.modelRoot.add(this.rightArmPivot)

    const rightArmMesh = new THREE.Mesh(armGeo, jacketMat)
    rightArmMesh.position.y = -0.3
    rightArmMesh.castShadow = true
    this.rightArmPivot.add(rightArmMesh)

    // Left Leg Pivot (at hip height y = 0.72, x = -0.2)
    this.leftLegPivot = new THREE.Group()
    this.leftLegPivot.position.set(-0.2, 0.72, 0)
    this.modelRoot.add(this.leftLegPivot)

    const legGeo = new THREE.BoxGeometry(0.22, 0.7, 0.24)
    const leftLegMesh = new THREE.Mesh(legGeo, pantsMat)
    leftLegMesh.position.y = -0.32
    leftLegMesh.castShadow = true
    this.leftLegPivot.add(leftLegMesh)

    const bootGeo = new THREE.BoxGeometry(0.23, 0.16, 0.32)
    const leftBootMesh = new THREE.Mesh(bootGeo, bootsMat)
    leftBootMesh.position.set(0, -0.62, 0.04)
    leftBootMesh.castShadow = true
    this.leftLegPivot.add(leftBootMesh)

    // Right Leg Pivot (at hip height y = 0.72, x = +0.2)
    this.rightLegPivot = new THREE.Group()
    this.rightLegPivot.position.set(0.2, 0.72, 0)
    this.modelRoot.add(this.rightLegPivot)

    const rightLegMesh = new THREE.Mesh(legGeo, pantsMat)
    rightLegMesh.position.y = -0.32
    rightLegMesh.castShadow = true
    this.rightLegPivot.add(rightLegMesh)

    const rightBootMesh = new THREE.Mesh(bootGeo, bootsMat)
    rightBootMesh.position.set(0, -0.62, 0.04)
    rightBootMesh.castShadow = true
    this.rightLegPivot.add(rightBootMesh)
  }

  /**
   * Updates visual orientation and procedural walk/run/jump animation
   */
  public updateAnimation(
    dt: number,
    speed: number,
    isGrounded: boolean,
    facingAngle: number,
    turnRate: number,
    state: MovementState
  ): void {
    // Smoothly rotate the character model to face movement direction
    this.modelRoot.rotation.y = facingAngle

    // Subtle banking/tilt into turns
    const targetTilt = turnRate * 0.15
    this.currentTilt = damp(this.currentTilt, targetTilt, 8, dt)
    this.modelRoot.rotation.z = this.currentTilt

    if (isGrounded) {
      if (speed > 0.2) {
        // Walking or sprinting: swing arms and legs in opposition
        const animSpeed = state === 'sprinting' ? 14 : 9
        this.animPhase += dt * animSpeed

        const maxLimbAngle = state === 'sprinting' ? 0.75 : 0.45
        const legSwing = Math.sin(this.animPhase) * maxLimbAngle
        const armSwing = Math.sin(this.animPhase) * maxLimbAngle

        this.leftLegPivot.rotation.x = legSwing
        this.rightLegPivot.rotation.x = -legSwing
        this.leftArmPivot.rotation.x = -armSwing
        this.rightArmPivot.rotation.x = armSwing

        // Slight vertical bobbing while running
        const bob = Math.abs(Math.cos(this.animPhase * 2)) * 0.06
        this.torso.position.y = 1.05 + bob
        this.head.position.y = 1.62 + bob
      } else {
        // Idle breathing motion
        this.animPhase += dt * 2.0
        const breath = Math.sin(this.animPhase) * 0.02

        this.leftLegPivot.rotation.x = damp(this.leftLegPivot.rotation.x, 0, 10, dt)
        this.rightLegPivot.rotation.x = damp(this.rightLegPivot.rotation.x, 0, 10, dt)
        this.leftArmPivot.rotation.x = damp(this.leftArmPivot.rotation.x, 0, 10, dt)
        this.rightArmPivot.rotation.x = damp(this.rightArmPivot.rotation.x, 0, 10, dt)

        this.torso.position.y = 1.05 + breath
        this.head.position.y = 1.62 + breath
      }
    } else {
      // In air (Jumping or Falling)
      const targetArmPose = state === 'jumping' ? -0.8 : -0.4
      const targetLegPose = state === 'jumping' ? 0.4 : 0.2

      this.leftArmPivot.rotation.x = damp(this.leftArmPivot.rotation.x, targetArmPose, 6, dt)
      this.rightArmPivot.rotation.x = damp(this.rightArmPivot.rotation.x, targetArmPose, 6, dt)
      this.leftLegPivot.rotation.x = damp(this.leftLegPivot.rotation.x, targetLegPose, 6, dt)
      this.rightLegPivot.rotation.x = damp(this.rightLegPivot.rotation.x, -0.1, 6, dt)
    }
  }

  public override update(): void {
    // Entity base update
  }
}
