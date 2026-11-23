import * as THREE from 'three'

export type BuildingId =
  | 'heritage_villa_gulmohar'
  | 'market_kirana_interior'
  | 'fishermen_cooperative'
  | 'highway_outpost_cabin'

export interface InteriorExamineTarget {
  id: string
  label: string
  prompt: string
  position: THREE.Vector3
  radius: number
  examineText: string
}

export interface BuildingInteriorConfig {
  id: BuildingId
  displayName: string
  district: string
  description: string
  exteriorDoorPos: THREE.Vector3
  exteriorExitPos: THREE.Vector3
  interiorOrigin: THREE.Vector3 // Origin offset for the interior cell in world space
  interiorSpawnPos: THREE.Vector3
  interiorExitDoorPos: THREE.Vector3
  roomWidth: number
  roomDepth: number
  roomHeight: number
  wallColorHex: string
  trimColorHex: string
  lightColorHex: number
  examineTargets: InteriorExamineTarget[]
}
