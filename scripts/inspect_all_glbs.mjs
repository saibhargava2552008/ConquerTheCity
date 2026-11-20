import fs from 'fs'
import path from 'path'

// Simple GLB header and JSON chunk reader
function inspectGlb(glbPath) {
  const buf = fs.readFileSync(glbPath)
  if (buf.readUInt32LE(0) !== 0x46546c67) { // 'glTF'
    return { error: 'Not a GLB' }
  }
  const jsonChunkLen = buf.readUInt32LE(12)
  const jsonBuf = buf.subarray(20, 20 + jsonChunkLen)
  const gltf = JSON.parse(jsonBuf.toString('utf8'))
  const meshCount = gltf.meshes ? gltf.meshes.length : 0
  let primitiveCount = 0
  if (gltf.meshes) {
    for (const m of gltf.meshes) {
      primitiveCount += m.primitives ? m.primitives.length : 0
    }
  }
  const nodeCount = gltf.nodes ? gltf.nodes.length : 0
  const materialCount = gltf.materials ? gltf.materials.length : 0
  return {
    meshCount,
    primitiveCount,
    nodeCount,
    materialCount,
    sizeKb: Math.round(buf.length / 1024),
  }
}

const dir = 'public/models'
const files = fs.readdirSync(dir).filter(f => f.endsWith('.glb'))
console.log('=== GLB MODEL AUDIT (MESH & PRIMITIVE COUNTS) ===')
for (const f of files) {
  const info = inspectGlb(path.join(dir, f))
  console.log(`${f.padEnd(35)} : ${info.meshCount.toString().padStart(3)} meshes, ${info.primitiveCount.toString().padStart(3)} prims, ${info.materialCount.toString().padStart(2)} mats (${info.sizeKb} KB)`)
}
