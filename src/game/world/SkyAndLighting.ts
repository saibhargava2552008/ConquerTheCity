import * as THREE from 'three'

/**
 * Tropical coastal atmosphere and sunlight simulation for Seaview Town
 */
export class SkyAndLighting {
  public dirLight: THREE.DirectionalLight
  public hemiLight: THREE.HemisphereLight
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene

    // Tropical coastal azure sky and warm maritime horizon haze
    const skyColor = new THREE.Color(0x76b5c5)
    scene.background = skyColor
    scene.fog = new THREE.FogExp2(0x99c1b9, 0.0055)

    // Hemisphere light (tropical sky blue above, warm coastal sand bounce below)
    this.hemiLight = new THREE.HemisphereLight(0xd8f3dc, 0xd4a373, 0.95)
    this.hemiLight.position.set(0, 60, 0)
    scene.add(this.hemiLight)

    // Directional Sunlight (warm golden coastal afternoon sun)
    this.dirLight = new THREE.DirectionalLight(0xfffaed, 2.0)
    this.dirLight.position.set(50, 75, 40)
    this.dirLight.castShadow = true

    // Optimized shadow mapping for Intel iGPU
    this.dirLight.shadow.mapSize.width = 1024
    this.dirLight.shadow.mapSize.height = 1024
    this.dirLight.shadow.camera.near = 0.5
    this.dirLight.shadow.camera.far = 180

    const d = 55
    this.dirLight.shadow.camera.left = -d
    this.dirLight.shadow.camera.right = d
    this.dirLight.shadow.camera.top = d
    this.dirLight.shadow.camera.bottom = -d
    this.dirLight.shadow.bias = -0.0005
    this.dirLight.shadow.normalBias = 0.02

    scene.add(this.dirLight)
    scene.add(this.dirLight.target)
  }

  /**
   * Follows player horizontally so shadow map remains centered and high-res
   */
  public update(playerPos: THREE.Vector3): void {
    this.dirLight.position.x = playerPos.x + 50
    this.dirLight.position.z = playerPos.z + 40
    this.dirLight.target.position.set(playerPos.x, 0, playerPos.z)
    this.dirLight.target.updateMatrixWorld()
  }

  public dispose(): void {
    this.scene.remove(this.hemiLight)
    this.scene.remove(this.dirLight)
    this.scene.remove(this.dirLight.target)
    this.dirLight.dispose()
    this.hemiLight.dispose()
  }
}
