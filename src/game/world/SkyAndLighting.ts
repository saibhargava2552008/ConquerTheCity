import * as THREE from 'three'

export class SkyAndLighting {
  public dirLight: THREE.DirectionalLight
  public hemiLight: THREE.HemisphereLight
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene

    // Sky background and atmospheric fog
    scene.background = new THREE.Color(0x8ec5eb)
    scene.fog = new THREE.FogExp2(0x8ec5eb, 0.0085)

    // Hemisphere light (sky blue from above, warm earthy bounce from below)
    this.hemiLight = new THREE.HemisphereLight(0xd9efff, 0x445544, 0.85)
    this.hemiLight.position.set(0, 50, 0)
    scene.add(this.hemiLight)

    // Directional Sunlight with optimized shadow mapping for Intel iGPU
    this.dirLight = new THREE.DirectionalLight(0xfffaed, 1.8)
    this.dirLight.position.set(40, 65, 30)
    this.dirLight.castShadow = true

    // Tight shadow frustum around play space
    this.dirLight.shadow.mapSize.width = 1024
    this.dirLight.shadow.mapSize.height = 1024
    this.dirLight.shadow.camera.near = 0.5
    this.dirLight.shadow.camera.far = 150

    const d = 45
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
    this.dirLight.position.x = playerPos.x + 40
    this.dirLight.position.z = playerPos.z + 30
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
