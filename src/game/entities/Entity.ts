import * as THREE from 'three'
import type { IEntity } from '../core/Types'

export abstract class Entity implements IEntity {
  public readonly id: string
  public readonly mesh: THREE.Group
  protected position: THREE.Vector3
  protected isDisposed = false

  constructor(id: string) {
    this.id = id
    this.mesh = new THREE.Group()
    this.position = this.mesh.position
  }

  public getPosition(): THREE.Vector3 {
    return this.position
  }

  public setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z)
  }

  public abstract update(dt: number): void

  public dispose(): void {
    if (this.isDisposed) return
    this.isDisposed = true

    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        } else {
          child.material?.dispose()
        }
      }
    })
  }
}
