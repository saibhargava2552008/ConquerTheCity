import fs from 'fs'
import path from 'path'

// Read the GLB file
const glbPath = path.resolve('public/models/aarav_character.glb')
const buffer = fs.readFileSync(glbPath)

console.log(`GLB file size: ${buffer.length} bytes`)

// Parse GLB header
const magic = buffer.readUInt32LE(0)
const version = buffer.readUInt32LE(4)
const length = buffer.readUInt32LE(8)

console.log(`GLB Magic: 0x${magic.toString(16)} (expected 0x46546c67)`)
console.log(`GLB Version: ${version}`)
console.log(`GLB Total Length: ${length}`)

// Chunk 0 (JSON)
const chunk0Length = buffer.readUInt32LE(12)
const chunk0JsonStr = buffer.toString('utf8', 20, 20 + chunk0Length)
const gltf = JSON.parse(chunk0JsonStr)

console.log('\n--- GLTF ANIMATIONS AUDIT ---')
console.log(`Found ${gltf.animations?.length ?? 0} animations in GLTF JSON chunk:`)

for (const anim of gltf.animations || []) {
  console.log(`\n* Animation: "${anim.name}"`)
  console.log(`  - Channels: ${anim.channels?.length ?? 0}`)
  console.log(`  - Samplers: ${anim.samplers?.length ?? 0}`)
  
  // Check target bones and paths
  const targets = new Set<string>()
  for (const ch of anim.channels || []) {
    const nodeIndex = ch.target.node
    const nodeName = gltf.nodes[nodeIndex]?.name || `Node_${nodeIndex}`
    targets.add(`${nodeName}.${ch.target.path}`)
  }
  console.log(`  - Unique Node Targets: ${targets.size}`)
  const sampleTargets = Array.from(targets).slice(0, 5).join(', ')
  console.log(`  - Sample targets: ${sampleTargets}...`)

  // Check duration by finding min/max input accessor
  let maxTime = 0
  for (const samp of anim.samplers || []) {
    const inputAccIndex = samp.input
    const acc = gltf.accessors[inputAccIndex]
    if (acc && acc.max) {
      maxTime = Math.max(maxTime, acc.max[0])
    }
  }
  console.log(`  - Duration: ${maxTime.toFixed(3)}s (${(maxTime * 30).toFixed(1)} frames @ 30fps)`)
}

console.log('\n--- GLTF NODES / BONES AUDIT ---')
const bones = gltf.nodes?.filter((n: { isBone?: boolean; name?: string }) => n.name && (n.name.includes('Spine') || n.name.includes('Arm') || n.name.includes('Thigh') || n.name.includes('Hips') || n.name.includes('Hand')))
console.log(`Found ${bones?.length ?? 0} key skeleton bones in node list.`)

console.log('\n--- GLTF MESHES & SKINS AUDIT ---')
console.log(`Meshes: ${gltf.meshes?.length ?? 0}, Skins: ${gltf.skins?.length ?? 0}`)
