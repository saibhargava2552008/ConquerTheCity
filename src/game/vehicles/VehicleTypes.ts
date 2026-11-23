import * as THREE from 'three'
import type { AssetId } from '../world/AssetLoader'

export type VehicleType = 'auto_rickshaw' | 'scooter' | 'delivery_bicycle'

export interface VehicleHandlingConfig {
  type: VehicleType
  displayName: string
  assetId: AssetId
  maxForwardSpeed: number // m/s
  maxReverseSpeed: number // m/s
  acceleration: number // m/s²
  reverseAcceleration: number // m/s²
  brakingDecel: number // m/s²
  coastingDecel: number // m/s²
  handbrakeDecel: number // m/s²
  steerSpeed: number // rad/s
  maxSteerAngle: number // rad
  steerReturnSpeed: number // rad/s
  leanMultiplier: number // banking roll on turns
  wheelRadius: number // meters for wheel rotation
  halfWidth: number
  halfLength: number
  height: number
  seatOffset: THREE.Vector3
  exitOffset: THREE.Vector3
  hasReverse: boolean
  cameraDistance: number
  cameraHeight: number
}

export const VEHICLE_CONFIGS: Record<VehicleType, VehicleHandlingConfig> = {
  auto_rickshaw: {
    type: 'auto_rickshaw',
    displayName: 'Auto-Rickshaw',
    assetId: 'prop_auto_rickshaw',
    maxForwardSpeed: 12.5, // ~45 km/h
    maxReverseSpeed: 3.5, // ~12 km/h
    acceleration: 6.8,
    reverseAcceleration: 3.2,
    brakingDecel: 15.0,
    coastingDecel: 3.5,
    handbrakeDecel: 24.0,
    steerSpeed: 3.2,
    maxSteerAngle: 0.62, // ~35 deg
    steerReturnSpeed: 4.8,
    leanMultiplier: 0.04, // subtle body roll
    wheelRadius: 0.28,
    halfWidth: 0.70,
    halfLength: 1.35,
    height: 1.70,
    seatOffset: new THREE.Vector3(0, 0.48, -0.15),
    exitOffset: new THREE.Vector3(-1.35, 0, -0.15),
    hasReverse: true,
    cameraDistance: 6.2,
    cameraHeight: 2.2,
  },
  scooter: {
    type: 'scooter',
    displayName: 'Scooter',
    assetId: 'prop_indian_scooter_01',
    maxForwardSpeed: 15.0, // ~54 km/h
    maxReverseSpeed: 1.8, // ~6 km/h (gentle pushback)
    acceleration: 8.5,
    reverseAcceleration: 1.6,
    brakingDecel: 18.0,
    coastingDecel: 3.8,
    handbrakeDecel: 20.0,
    steerSpeed: 3.5,
    maxSteerAngle: 0.54, // ~31 deg
    steerReturnSpeed: 5.5,
    leanMultiplier: 0.22, // prominent 2-wheeler lean
    wheelRadius: 0.25,
    halfWidth: 0.40,
    halfLength: 0.90,
    height: 1.15,
    seatOffset: new THREE.Vector3(0, 0.55, -0.10),
    exitOffset: new THREE.Vector3(-0.95, 0, -0.10),
    hasReverse: true,
    cameraDistance: 5.0,
    cameraHeight: 1.8,
  },
  delivery_bicycle: {
    type: 'delivery_bicycle',
    displayName: 'Delivery Bicycle',
    assetId: 'prop_delivery_bicycle_01',
    maxForwardSpeed: 6.5, // ~23 km/h
    maxReverseSpeed: 0.0, // no reverse on bicycle
    acceleration: 3.8, // pedal cadence
    reverseAcceleration: 0.0,
    brakingDecel: 12.0,
    coastingDecel: 2.2,
    handbrakeDecel: 14.0,
    steerSpeed: 3.8,
    maxSteerAngle: 0.58,
    steerReturnSpeed: 5.0,
    leanMultiplier: 0.16, // bicycle lean
    wheelRadius: 0.32,
    halfWidth: 0.35,
    halfLength: 0.90,
    height: 1.10,
    seatOffset: new THREE.Vector3(0, 0.65, -0.15),
    exitOffset: new THREE.Vector3(-0.85, 0, -0.15),
    hasReverse: false,
    cameraDistance: 4.6,
    cameraHeight: 1.7,
  },
}

export interface VehicleDrivingState {
  velocity: THREE.Vector3
  speed: number // m/s
  speedKmh: number
  steerAngle: number // rad
  leanAngle: number // rad
  inReverse: boolean
  isHandbraking: boolean
  isGrounded: boolean
}
