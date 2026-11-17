import * as THREE from 'three'

/**
 * Procedural material and texture factory.
 * Creates optimized, shared textures and materials so zero external assets are required,
 * maintaining high performance on Intel integrated graphics.
 */
export class MaterialFactory {
  private textures: THREE.Texture[] = []
  private materials: Map<string, THREE.Material> = new Map()

  // Shared geometries for performance
  public readonly boxGeometry = new THREE.BoxGeometry(1, 1, 1)
  public readonly planeGeometry = new THREE.PlaneGeometry(1, 1)
  public readonly cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 12)

  /**
   * Generates an asphalt road texture with road markings
   */
  public getRoadMaterial(): THREE.MeshStandardMaterial {
    const key = 'road'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Dark asphalt base
    ctx.fillStyle = '#22252a'
    ctx.fillRect(0, 0, 512, 512)

    // Subtle grain noise
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
    for (let i = 0; i < 4000; i++) {
      const rx = Math.random() * 512
      const ry = Math.random() * 512
      ctx.fillRect(rx, ry, 2, 2)
    }

    // Yellow double center line
    ctx.fillStyle = '#e6b800'
    ctx.fillRect(250, 0, 4, 512)
    ctx.fillRect(258, 0, 4, 512)

    // White dashed outer lane markers
    ctx.fillStyle = '#f0f0f0'
    for (let y = 0; y < 512; y += 64) {
      ctx.fillRect(100, y + 10, 8, 36)
      ctx.fillRect(404, y + 10, 8, 36)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1, 4)
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.85,
      metalness: 0.1,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Sidewalk concrete paving
   */
  public getSidewalkMaterial(): THREE.MeshStandardMaterial {
    const key = 'sidewalk'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#a8b0b8'
    ctx.fillRect(0, 0, 256, 256)

    // Grid lines for concrete tiles
    ctx.strokeStyle = '#7c848c'
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, 252, 252)
    ctx.beginPath()
    ctx.moveTo(128, 0)
    ctx.lineTo(128, 256)
    ctx.moveTo(0, 128)
    ctx.lineTo(256, 128)
    ctx.stroke()

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.05,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Skyscraper / Corporate building with glowing window grids
   */
  public getBuildingFacadeMaterial(accentColor = '#3a86ff'): THREE.MeshStandardMaterial {
    const key = `facade_${accentColor}`
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Modern dark building wall
    ctx.fillStyle = '#1c222e'
    ctx.fillRect(0, 0, 256, 512)

    // Vertical structural mullions
    ctx.fillStyle = '#131720'
    for (let x = 0; x < 256; x += 32) {
      ctx.fillRect(x, 0, 4, 512)
    }

    // Windows
    const cols = 6
    const rows = 14
    const w = 26
    const h = 22

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = 12 + c * 38
        const wy = 14 + r * 35

        // Semi-random lit / tinted windows
        const rand = (r * 7 + c * 13) % 10
        if (rand > 4) {
          ctx.fillStyle = rand > 7 ? '#ffd166' : accentColor
          ctx.fillRect(wx, wy, w, h)
        } else {
          ctx.fillStyle = '#0b0f15'
          ctx.fillRect(wx, wy, w, h)
        }

        ctx.strokeStyle = '#293241'
        ctx.lineWidth = 1
        ctx.strokeRect(wx, wy, w, h)
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.35,
      metalness: 0.4,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Industrial brick / warehouse material
   */
  public getBrickMaterial(): THREE.MeshStandardMaterial {
    const key = 'brick'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#8f4f38'
    ctx.fillRect(0, 0, 256, 256)

    ctx.fillStyle = '#a85b42'
    for (let y = 0; y < 256; y += 16) {
      const offset = (y / 16) % 2 === 0 ? 0 : 16
      for (let x = -16; x < 256; x += 32) {
        ctx.fillRect(x + offset + 2, y + 2, 28, 12)
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.05,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Shipping container texture (corrugated metal)
   */
  public getContainerMaterial(color: number, code: string): THREE.MeshStandardMaterial {
    const key = `container_${color}_${code}`
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 128
    const ctx = canvas.getContext('2d')!

    const hex = '#' + color.toString(16).padStart(6, '0')
    ctx.fillStyle = hex
    ctx.fillRect(0, 0, 256, 128)

    // Corrugation ridges
    for (let x = 0; x < 256; x += 16) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
      ctx.fillRect(x, 0, 4, 128)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.fillRect(x + 4, 0, 4, 128)
    }

    // Shipping cargo label
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px monospace'
    ctx.fillText(code, 24, 72)

    const texture = new THREE.CanvasTexture(canvas)
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.3,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Wooden crate material
   */
  public getCrateMaterial(): THREE.MeshStandardMaterial {
    const key = 'crate'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#b07e4d'
    ctx.fillRect(0, 0, 128, 128)

    // Wood planks
    ctx.strokeStyle = '#7c532e'
    ctx.lineWidth = 3
    ctx.strokeRect(4, 4, 120, 120)
    ctx.beginPath()
    ctx.moveTo(4, 4)
    ctx.lineTo(124, 124)
    ctx.moveTo(124, 4)
    ctx.lineTo(4, 124)
    ctx.stroke()

    const texture = new THREE.CanvasTexture(canvas)
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.85,
      metalness: 0.05,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Hazard stripes (for ramps and parkour platforms)
   */
  public getHazardMaterial(): THREE.MeshStandardMaterial {
    const key = 'hazard'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#ffcc00'
    ctx.fillRect(0, 0, 128, 128)

    ctx.fillStyle = '#111111'
    for (let i = -128; i < 256; i += 32) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + 16, 0)
      ctx.lineTo(i + 16 + 128, 128)
      ctx.lineTo(i + 128, 128)
      ctx.closePath()
      ctx.fill()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1, 2)
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.2,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Green park / turf material
   */
  public getParkMaterial(): THREE.MeshStandardMaterial {
    const key = 'park'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const mat = new THREE.MeshStandardMaterial({
      color: 0x3d6b38,
      roughness: 0.95,
      metalness: 0.0,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Simple solid color material helper
   */
  public getColorMaterial(color: number, roughness = 0.5, metalness = 0.1): THREE.MeshStandardMaterial {
    const key = `color_${color}_${roughness}_${metalness}`
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness })
    this.materials.set(key, mat)
    return mat
  }

  public dispose(): void {
    for (const texture of this.textures) {
      texture.dispose()
    }
    this.textures = []

    for (const material of this.materials.values()) {
      material.dispose()
    }
    this.materials.clear()

    this.boxGeometry.dispose()
    this.planeGeometry.dispose()
    this.cylinderGeometry.dispose()
  }
}
