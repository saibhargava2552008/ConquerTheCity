import * as THREE from 'three'

/**
 * High-Quality Atmospheric Coastal Sky and PBR Sunlight Simulation for Seaview Town
 * Replaces flat background color with a realistic procedural sky dome, soft atmospheric
 * Rayleigh depth haze, and tuned PCFSoftShadow directional sun lighting.
 */
export class SkyAndLighting {
  public dirLight: THREE.DirectionalLight
  public hemiLight: THREE.HemisphereLight
  private scene: THREE.Scene
  private skyDome: THREE.Mesh | null = null

  constructor(scene: THREE.Scene) {
    this.scene = scene

    // 1. Procedural Realistic Atmosphere & Coastal Sky Dome
    this.buildSkyDome()

    // 2. Soft Maritime Atmospheric Depth Fog (blends terrain into horizon sky)
    scene.fog = new THREE.FogExp2(0xc5d8d1, 0.0038)

    // 3. Hemisphere Ambient Lighting (Rich tropical sky above, warm sand/stone bounce below)
    this.hemiLight = new THREE.HemisphereLight(0x90caf9, 0xd7ccc8, 0.85)
    this.hemiLight.position.set(0, 80, 0)
    scene.add(this.hemiLight)

    // 4. Directional Sunlight (Warm coastal afternoon sun with cinematic soft shadows)
    this.dirLight = new THREE.DirectionalLight(0xfff6e5, 2.4)
    this.dirLight.position.set(50, 75, 40)
    this.dirLight.castShadow = true

    // High-quality shadow mapping (2048x2048 PCFSoft for smooth natural penumbra)
    this.dirLight.shadow.mapSize.width = 2048
    this.dirLight.shadow.mapSize.height = 2048
    this.dirLight.shadow.camera.near = 1.0
    this.dirLight.shadow.camera.far = 170

    // Crisp, focused shadow frustum following player (56m x 56m)
    const d = 28
    this.dirLight.shadow.camera.left = -d
    this.dirLight.shadow.camera.right = d
    this.dirLight.shadow.camera.top = d
    this.dirLight.shadow.camera.bottom = -d
    this.dirLight.shadow.bias = -0.00035
    this.dirLight.shadow.normalBias = 0.025

    scene.add(this.dirLight)
    scene.add(this.dirLight.target)
  }

  private buildSkyDome(): void {
    const skyGeo = new THREE.SphereGeometry(320, 32, 16)

    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x1976d2) },      // Deep tropical blue zenith
        horizonColor: { value: new THREE.Color(0xc5d8d1) },  // Soft maritime horizon mist
        groundColor: { value: new THREE.Color(0xd7ccc8) },   // Warm coastal shoreline base
        sunColor: { value: new THREE.Color(0xfff9e6) },      // Solar disc glow
        sunDirection: { value: new THREE.Vector3(50, 75, 40).normalize() },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 groundColor;
        uniform vec3 sunColor;
        uniform vec3 sunDirection;
        varying vec3 vWorldPosition;

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float h = dir.y;

          // Sky gradient from horizon to zenith
          vec3 sky = h > 0.0 
            ? mix(horizonColor, topColor, pow(max(h, 0.0), 0.65))
            : mix(horizonColor, groundColor, clamp(-h * 4.0, 0.0, 1.0));

          // Solar glow disc
          float sunCos = dot(dir, sunDirection);
          if (sunCos > 0.0) {
            float sunGlow = pow(sunCos, 64.0) * 0.85 + pow(sunCos, 8.0) * 0.25;
            sky = mix(sky, sunColor, clamp(sunGlow, 0.0, 1.0));
          }

          gl_FragColor = vec4(sky, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    })

    this.skyDome = new THREE.Mesh(skyGeo, skyMat)
    this.scene.add(this.skyDome)
  }

  /**
   * Follows player horizontally so shadow map remains centered and high-res
   */
  public update(playerPos: THREE.Vector3): void {
    this.dirLight.position.x = playerPos.x + 50
    this.dirLight.position.z = playerPos.z + 40
    this.dirLight.target.position.set(playerPos.x, 0, playerPos.z)
    this.dirLight.target.updateMatrixWorld()

    if (this.skyDome) {
      this.skyDome.position.set(playerPos.x, 0, playerPos.z)
    }
  }

  public dispose(): void {
    this.scene.remove(this.hemiLight)
    this.scene.remove(this.dirLight)
    this.scene.remove(this.dirLight.target)
    if (this.skyDome) {
      this.scene.remove(this.skyDome)
      this.skyDome.geometry.dispose()
      if (this.skyDome.material instanceof THREE.Material) {
        this.skyDome.material.dispose()
      }
      this.skyDome = null
    }
    this.dirLight.dispose()
    this.hemiLight.dispose()
  }
}
