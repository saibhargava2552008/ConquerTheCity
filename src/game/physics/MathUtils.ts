import * as THREE from 'three'

/**
 * Pre-allocated reusable math objects to avoid garbage collection allocations
 * during the main animation and simulation loop (essential for 60fps on integrated graphics).
 */
export const _v1 = new THREE.Vector3()
export const _v2 = new THREE.Vector3()
export const _v3 = new THREE.Vector3()
export const _v4 = new THREE.Vector3()

export const _q1 = new THREE.Quaternion()
export const _q2 = new THREE.Quaternion()

export const _euler = new THREE.Euler(0, 0, 0, 'YXZ')
export const _box1 = new THREE.Box3()
export const _box2 = new THREE.Box3()
export const _raycaster = new THREE.Raycaster()

export const UP = new THREE.Vector3(0, 1, 0)
export const FORWARD = new THREE.Vector3(0, 0, -1)
export const RIGHT = new THREE.Vector3(1, 0, 0)

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

/**
 * Smooth exponential damping toward target value
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt))
}

/**
 * Interpolate angle via shortest path
 */
export function lerpAngle(current: number, target: number, alpha: number): number {
  const diff = (target - current + Math.PI * 3) % (Math.PI * 2) - Math.PI
  return current + diff * clamp(alpha, 0, 1)
}

/**
 * Smooth exponential damping for angles along shortest path
 */
export function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  return lerpAngle(current, target, 1 - Math.exp(-lambda * dt))
}
