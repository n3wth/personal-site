import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { configureTiledTexture, useNormalizedClone } from './support'

import { frameloopFor } from './viewport'
import { tiles } from './toolboxTiles'

/** The Utah teapot ships with no UV map at all, so tiles have nowhere
    to land. Box-project one on at load: each vertex picks its dominant
    normal axis and takes the other two coordinates as uv. Rough seams,
    honest fix. */
function ensureBoxUVs(geometry: THREE.BufferGeometry) {
  if (geometry.getAttribute('uv')) return geometry
  const g = geometry.clone() // never mutate the cached GLTF's geometry
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  const nor = g.getAttribute('normal') as THREE.BufferAttribute | null
  g.computeBoundingBox()
  const bb = g.boundingBox!
  const size = new THREE.Vector3().subVectors(bb.max, bb.min)
  const inv = new THREE.Vector3(1 / (size.x || 1), 1 / (size.y || 1), 1 / (size.z || 1))
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const nx = nor ? Math.abs(nor.getX(i)) : 0
    const ny = nor ? Math.abs(nor.getY(i)) : 1
    const nz = nor ? Math.abs(nor.getZ(i)) : 0
    let u: number
    let v: number
    if (nx >= ny && nx >= nz) {
      u = (z - bb.min.z) * inv.z
      v = (y - bb.min.y) * inv.y
    } else if (ny >= nx && ny >= nz) {
      u = (x - bb.min.x) * inv.x
      v = (z - bb.min.z) * inv.z
    } else {
      u = (x - bb.min.x) * inv.x
      v = (y - bb.min.y) * inv.y
    }
    uv[i * 2] = u
    uv[i * 2 + 1] = v
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return g
}

function Teapot({ url, reduced }: { url: string; reduced: boolean }) {
  const clone = useNormalizedClone('/models/teapot.glb', 2.1)
  const ref = useRef<THREE.Group>(null)
  const { pointer } = useThree()
  const textures = useTexture(
    tiles.map((t) => t.url),
    (loaded) => (Array.isArray(loaded) ? loaded : [loaded]).forEach((t) => configureTiledTexture(t, 2))
  )
  const map = textures[tiles.findIndex((t) => t.url === url)] ?? textures[0]

  // UV projection happens once per clone; the projected geometries are
  // ours, so they get freed on unmount.
  const uvPrepared = useMemo(() => {
    const created: THREE.BufferGeometry[] = []
    clone.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        const g = ensureBoxUVs(m.geometry)
        if (g !== m.geometry) {
          created.push(g)
          m.geometry = g
        }
      }
    })
    return { root: clone, created }
  }, [clone])

  useEffect(() => {
    const { created } = uvPrepared
    return () => created.forEach((g) => g.dispose())
  }, [uvPrepared])

  // A fresh material per tile keeps the swap declarative — three cheap
  // materials over the demo's life, each freed when the next arrives.
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map,
        bumpMap: map,
        bumpScale: 0.5,
        roughness: 0.8,
        metalness: 0.18,
        side: THREE.DoubleSide,
      }),
    [map]
  )
  useEffect(() => () => material.dispose(), [material])

  const prepared = useMemo(() => {
    const { root } = uvPrepared
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) m.material = material
    })
    return root
  }, [uvPrepared, material])

  useFrame((_, delta) => {
    if (reduced || !ref.current) return
    ref.current.rotation.y += delta * 0.24
    const tiltX = pointer.y * 0.25
    const tiltZ = -pointer.x * 0.25
    ref.current.rotation.x += (tiltX - ref.current.rotation.x) * Math.min(1, delta * 2)
    ref.current.rotation.z += (tiltZ - ref.current.rotation.z) * Math.min(1, delta * 2)
  })

  return <primitive object={prepared} ref={ref} />
}

export default function TeapotCanvas({ url, reduced, visible }: { url: string; reduced: boolean; visible: boolean }) {
  return (
    <Canvas camera={{ position: [0, 0.4, 4.6], fov: 38 }} dpr={[1, 1.5]} gl={{ alpha: true }} frameloop={frameloopFor(visible, reduced)}>
      {/* The mid-dark tiles need brighter light than the cameo rig. */}
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#2a3442', '#141210']} intensity={0.5} />
      <pointLight position={[2.2, 2.4, 3]} intensity={30} />
      <pointLight position={[-2.6, 1.1, 1.6]} intensity={14} color="#dce6f2" />
      <pointLight position={[0, -1.6, 2.4]} intensity={6} color="#ffd9a8" />
      <Suspense fallback={null}>
        <Teapot url={url} reduced={reduced} />
      </Suspense>
    </Canvas>
  )
}
