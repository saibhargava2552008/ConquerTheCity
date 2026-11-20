import fs from 'fs'
import path from 'path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

global.THREE = THREE
global.window = global
global.self = global
global.createImageBitmap = async () => ({
  width: 128,
  height: 128,
  close: () => {},
})
global.document = {
  createElement: () => ({ setAttribute: () => {}, getAttribute: () => null })
}

async function testClone() {
  console.log('Testing SkeletonUtils.clone on aarav_character.glb...')
  const filePath = path.resolve('public/models/aarav_character.glb')
  const buffer = fs.readFileSync(filePath)
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

  const loader = new GLTFLoader()
  loader.parse(arrayBuffer, '', (gltf) => {
    console.log(`Original loaded: ${gltf.scene.children.length} children, ${gltf.animations.length} animations`)
    
    // Test cloning
    const clone1 = SkeletonUtils.clone(gltf.scene)
    const clone2 = SkeletonUtils.clone(gltf.scene)
    console.log(`Clone 1 created: ${clone1.children.length} children`)
    console.log(`Clone 2 created: ${clone2.children.length} children`)

    // Test animation mixer on clone
    const mixer1 = new THREE.AnimationMixer(clone1)
    const action1 = mixer1.clipAction(gltf.animations[0])
    action1.play()
    mixer1.update(0.016)

    const mixer2 = new THREE.AnimationMixer(clone2)
    const action2 = mixer2.clipAction(gltf.animations[1])
    action2.play()
    mixer2.update(0.016)

    console.log('Both mixers updated successfully with distinct animations!')
    console.log('SkeletonUtils.clone verification: 100% PASSED!')
  }, (err) => {
    console.error('Failed to parse:', err)
  })
}

testClone()
