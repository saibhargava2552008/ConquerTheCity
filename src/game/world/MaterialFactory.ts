import * as THREE from 'three'

/**
 * Procedural material and texture factory for Conquer The City (Seaview Town).
 * Generates optimized, shared textures and materials so zero external assets are required,
 * maintaining high performance (60+ FPS) on Intel integrated graphics and mobile.
 */
export class MaterialFactory {
  private textures: THREE.Texture[] = []
  private materials: Map<string, THREE.Material> = new Map()

  // Shared geometries for performance & draw-call optimization
  public readonly boxGeometry = new THREE.BoxGeometry(1, 1, 1)
  public readonly planeGeometry = new THREE.PlaneGeometry(1, 1)
  public readonly cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 12)
  public readonly coneGeometry = new THREE.ConeGeometry(1, 1, 8)
  public readonly sphereGeometry = new THREE.SphereGeometry(1, 10, 8)

  /**
   * Generates an asphalt road texture with yellow center lines and white road markings
   */
  public getRoadMaterial(): THREE.MeshStandardMaterial {
    const key = 'road'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Dark coastal asphalt base
    ctx.fillStyle = '#22262c'
    ctx.fillRect(0, 0, 512, 512)

    // Subtle grain noise
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
    for (let i = 0; i < 3000; i++) {
      const rx = Math.random() * 512
      const ry = Math.random() * 512
      ctx.fillRect(rx, ry, 2, 2)
    }

    // Yellow double center line
    ctx.fillStyle = '#f5c518'
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

    ctx.fillStyle = '#b8c0c8'
    ctx.fillRect(0, 0, 256, 256)

    // Grid lines for concrete paving slabs
    ctx.strokeStyle = '#8a949e'
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
   * Tropical Ocean Water Material (deep turquoise, semi-translucent with wave highlights)
   */
  public getOceanMaterial(): THREE.MeshStandardMaterial {
    const key = 'ocean_water'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Deep coastal azure base
    const grad = ctx.createLinearGradient(0, 0, 512, 512)
    grad.addColorStop(0, '#0077b6')
    grad.addColorStop(0.5, '#0096c7')
    grad.addColorStop(1, '#03045e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 512, 512)

    // Gentle foam/caustic highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
    ctx.lineWidth = 3
    for (let i = 0; i < 28; i++) {
      ctx.beginPath()
      const y = i * 20
      ctx.moveTo(0, y)
      ctx.bezierCurveTo(128, y + 10, 256, y - 10, 512, y + 5)
      ctx.stroke()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(16, 16)
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0x1a8fe3,
      roughness: 0.15,
      metalness: 0.35,
      transparent: true,
      opacity: 0.90,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Warm coastal sand beach material with gentle ripples
   */
  public getSandMaterial(): THREE.MeshStandardMaterial {
    const key = 'beach_sand'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    // Warm golden sand
    ctx.fillStyle = '#e6c280'
    ctx.fillRect(0, 0, 256, 256)

    // Sand grain flecks
    ctx.fillStyle = 'rgba(212, 163, 89, 0.5)'
    for (let i = 0; i < 3000; i++) {
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
    }
    ctx.fillStyle = 'rgba(255, 243, 204, 0.4)'
    for (let i = 0; i < 2000; i++) {
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1)
    }

    // Gentle wave drift streaks
    ctx.strokeStyle = 'rgba(196, 146, 74, 0.25)'
    ctx.lineWidth = 2
    for (let y = 16; y < 256; y += 32) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(256, y + 6)
      ctx.stroke()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(8, 8)
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.95,
      metalness: 0.0,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Authentic Indian red clay Mangalore roof tiles
   */
  public getTerracottaRoofMaterial(): THREE.MeshStandardMaterial {
    const key = 'terracotta_roof'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    // Warm terracotta base
    ctx.fillStyle = '#b7410e'
    ctx.fillRect(0, 0, 256, 256)

    // Curved clay tiles horizontal rows
    const tileH = 24
    const tileW = 32
    for (let y = 0; y < 256; y += tileH) {
      const shift = ((y / tileH) % 2 === 0) ? 0 : tileW / 2
      for (let x = -tileW; x < 256 + tileW; x += tileW) {
        // Tile body
        ctx.fillStyle = '#c84b16'
        ctx.fillRect(x + shift + 2, y + 2, tileW - 4, tileH - 4)

        // Shadow under lip
        ctx.fillStyle = '#802604'
        ctx.fillRect(x + shift + 2, y + tileH - 3, tileW - 4, 3)

        // Highlight ridge
        ctx.fillStyle = '#e06228'
        ctx.fillRect(x + shift + 4, y + 3, tileW - 8, 2)
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)
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
   * Whitewashed lime plaster and pastel coastal stucco (Goan / Konkan / Kerala aesthetic)
   */
  public getStuccoMaterial(baseColorHex = '#f7ede2', accentBorderHex?: string): THREE.MeshStandardMaterial {
    const key = `stucco_${baseColorHex}_${accentBorderHex || 'none'}`
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = baseColorHex
    ctx.fillRect(0, 0, 256, 256)

    // Stucco texture specks
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)'
    for (let i = 0; i < 2000; i++) {
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
    }

    // Optional decorative coastal border molding
    if (accentBorderHex) {
      ctx.fillStyle = accentBorderHex
      ctx.fillRect(0, 0, 256, 12)
      ctx.fillRect(0, 244, 256, 12)
      ctx.fillRect(0, 0, 12, 256)
      ctx.fillRect(244, 0, 12, 256)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.02,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Weathered timber wood (for jetties, fishing piers, dock posts)
   */
  public getTimberWoodMaterial(): THREE.MeshStandardMaterial {
    const key = 'timber_wood'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#6b533f'
    ctx.fillRect(0, 0, 256, 256)

    // Wood grain planks
    ctx.strokeStyle = '#4a3828'
    ctx.lineWidth = 3
    for (let x = 0; x < 256; x += 32) {
      ctx.strokeRect(x, 0, 32, 256)
      // Salt weathering lines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.fillRect(x + 4, 0, 6, 256)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1, 3)
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
   * Coconut Palm Tree Trunk Material
   */
  public getPalmTrunkMaterial(): THREE.MeshStandardMaterial {
    const key = 'palm_trunk'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#7a5a40'
    ctx.fillRect(0, 0, 128, 256)

    // Ringed ridges characteristic of coconut palms
    ctx.fillStyle = '#523a27'
    for (let y = 0; y < 256; y += 18) {
      ctx.fillRect(0, y, 128, 5)
      ctx.fillStyle = '#9c7755'
      ctx.fillRect(0, y + 5, 128, 2)
      ctx.fillStyle = '#523a27'
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1, 4)
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.95,
      metalness: 0.0,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Tropical Palm Fronds / Coconut Leaves
   */
  public getPalmLeafMaterial(): THREE.MeshStandardMaterial {
    const key = 'palm_frond'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const mat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Painted Indian Fishing Boat Hull (vibrant hues with waterline stripe)
   */
  public getBoatHullMaterial(hullHex = '#e63946', stripeHex = '#f4a261'): THREE.MeshStandardMaterial {
    const key = `boat_hull_${hullHex}_${stripeHex}`
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 128
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = hullHex
    ctx.fillRect(0, 0, 256, 128)

    // Waterline accent stripes
    ctx.fillStyle = stripeHex
    ctx.fillRect(0, 80, 256, 18)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 74, 256, 6)

    // Weathering
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
    ctx.fillRect(0, 98, 256, 30)

    const texture = new THREE.CanvasTexture(canvas)
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.2,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Bazaar Street Market Awnings (festive striped fabric)
   */
  public getBazaarAwningMaterial(color1 = '#e76f51', color2 = '#f4a261'): THREE.MeshStandardMaterial {
    const key = `awning_${color1}_${color2}`
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!

    const stripeW = 16
    for (let x = 0; x < 128; x += stripeW * 2) {
      ctx.fillStyle = color1
      ctx.fillRect(x, 0, stripeW, 128)
      ctx.fillStyle = color2
      ctx.fillRect(x + stripeW, 0, stripeW, 128)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 1)
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.DoubleSide,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Cobblestone / Bazaar Alley Paving
   */
  public getCobblestoneMaterial(): THREE.MeshStandardMaterial {
    const key = 'cobblestone'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#6c757d'
    ctx.fillRect(0, 0, 256, 256)

    // Random stone pattern
    ctx.strokeStyle = '#495057'
    ctx.lineWidth = 3
    const stones = [
      [30, 30, 45, 30],
      [85, 25, 60, 35],
      [155, 30, 50, 30],
      [215, 25, 35, 35],
      [20, 75, 55, 35],
      [85, 70, 45, 40],
      [140, 75, 65, 35],
      [215, 70, 35, 40],
      [35, 125, 45, 35],
      [90, 120, 55, 40],
      [155, 125, 50, 35],
      [215, 120, 35, 40],
      [25, 175, 60, 35],
      [95, 170, 50, 40],
      [155, 175, 55, 35],
      [220, 170, 30, 40],
      [30, 225, 50, 25],
      [90, 220, 55, 30],
      [155, 225, 50, 25],
      [215, 220, 35, 30],
    ]

    for (const [x, y, w, h] of stones) {
      ctx.fillStyle = '#7d8590'
      ctx.fillRect(x, y, w, h)
      ctx.strokeRect(x, y, w, h)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(3, 3)
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.95,
      metalness: 0.05,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Promenade Ornamental Paving
   */
  public getPromenadeTileMaterial(): THREE.MeshStandardMaterial {
    const key = 'promenade_tile'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#e9ecef'
    ctx.fillRect(0, 0, 256, 256)

    // Coastal red/terracotta checkered decorative pattern
    ctx.fillStyle = '#d97757'
    ctx.fillRect(0, 0, 128, 128)
    ctx.fillRect(128, 128, 128, 128)

    ctx.strokeStyle = '#adb5bd'
    ctx.lineWidth = 4
    ctx.strokeRect(4, 4, 248, 248)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, 4)
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.05,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Lighthouse / Monument Material (red and white bands)
   */
  public getLighthouseMaterial(): THREE.MeshStandardMaterial {
    const key = 'lighthouse_stripe'
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    // Alternating red and white nautical warning stripes
    const bands = 6
    const bandH = 256 / bands
    for (let i = 0; i < bands; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#d90429' : '#ffffff'
      ctx.fillRect(0, i * bandH, 128, bandH)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    this.textures.push(texture)

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0.1,
    })
    this.materials.set(key, mat)
    return mat
  }

  /**
   * Skyscraper / Corporate building with glowing window grids (Legacy M0 support)
   */
  public getBuildingFacadeMaterial(accentColor = '#3a86ff'): THREE.MeshStandardMaterial {
    const key = `facade_${accentColor}`
    if (this.materials.has(key)) return this.materials.get(key) as THREE.MeshStandardMaterial

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#1c222e'
    ctx.fillRect(0, 0, 256, 512)

    for (let x = 0; x < 256; x += 32) {
      ctx.fillStyle = '#131720'
      ctx.fillRect(x, 0, 4, 512)
    }

    const cols = 6
    const rows = 14
    const w = 26
    const h = 22

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = 12 + c * 38
        const wy = 14 + r * 35
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
   * Industrial brick material (Legacy M0 support)
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
   * Shipping container material (Legacy M0 support)
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

    for (let x = 0; x < 256; x += 16) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
      ctx.fillRect(x, 0, 4, 128)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.fillRect(x + 4, 0, 4, 128)
    }

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
   * Hazard stripes (Legacy M0 support)
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
   * Crate material
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
    this.coneGeometry.dispose()
    this.sphereGeometry.dispose()
  }
}
