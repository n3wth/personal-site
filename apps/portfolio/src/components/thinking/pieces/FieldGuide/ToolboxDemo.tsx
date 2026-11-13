import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { configureTiledTexture, frameloopFor, useNear, useNormalizedClone } from './support'

/**
 * The one interactive in the piece that ignores scroll on purpose: the
 * Utah teapot (the one waiting by the homepage campfire) wearing the
 * site's real FLORA-generated tiles. Tapping a chip swaps material.map
 * — the same texture objects the night field mounts on logs, thylacine
 * skin, and the ground. Pointer-driven so the chapter about scroll can
 * point at it and say "and this one deliberately isn't".
 */

const TILES = [
  { key: 'wood', url: '/textures/wood-tile.webp', label: 'wood tile', home: 'the campfire logs wear it' },
  { key: 'steel', url: '/textures/steel-tile.webp', label: 'steel tile', home: 'the THEM pack’s skin' },
  { key: 'playa', url: '/textures/playa-tile.webp', label: 'playa tile', home: 'the ground under everything' },
]

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
    TILES.map((t) => t.url),
    (loaded) => (Array.isArray(loaded) ? loaded : [loaded]).forEach((t) => configureTiledTexture(t, 2))
  )
  const map = textures[TILES.findIndex((t) => t.url === url)] ?? textures[0]

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

export function ToolboxDemo({ reduced }: { reduced: boolean }) {
  const [tile, setTile] = useState(TILES[0])
  const [wrapRef, near, visible] = useNear<HTMLDivElement>()

  return (
    <div>
      <div
        role="group"
        aria-label="Pick a texture tile for the teapot"
        className="inline-flex flex-wrap rounded-full p-0.5"
        style={{ border: '1px solid var(--rail)' }}
      >
        {TILES.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tile.key === t.key}
            onClick={() => setTile(t)}
            className="kit-toggle-btn min-h-11 rounded-full px-4 py-1.5 text-sm"
            style={{
              color: tile.key === t.key ? 'var(--accent-ink)' : 'var(--ink-dim)',
              background: tile.key === t.key ? 'var(--accent)' : 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div ref={wrapRef} className="mx-auto mt-8 w-full max-w-md" role="img" aria-label={`The Utah teapot wearing the ${tile.label}`}>
        <div className="aspect-square w-full">
          {near && (
            <Canvas camera={{ position: [0, 0.4, 4.6], fov: 38 }} dpr={[1, 1.5]} gl={{ alpha: true }} frameloop={frameloopFor(visible, reduced)}>
              {/* brighter than the cameo rig: the tiles are mid-dark and
                  the whole point is reading their surface */}
              <ambientLight intensity={0.35} />
              <hemisphereLight args={['#2a3442', '#141210']} intensity={0.5} />
              <pointLight position={[2.2, 2.4, 3]} intensity={30} />
              <pointLight position={[-2.6, 1.1, 1.6]} intensity={14} color="#dce6f2" />
              <pointLight position={[0, -1.6, 2.4]} intensity={6} color="#ffd9a8" />
              <Suspense fallback={null}>
                <Teapot url={tile.url} reduced={reduced} />
              </Suspense>
            </Canvas>
          )}
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
        The teapot from the homepage campfire, wearing <span className="mono">{tile.url}</span>; on
        the night field, {tile.home}. One image doing color and bump at once; no PBR set, and it
        still reads as material. The teapot ships with no UV map, so this demo box-projects one on
        at load. 3D work is full of small fixes like that.
      </p>
    </div>
  )
}
