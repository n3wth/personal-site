import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { AspectRatio } from '@n3wth/ui/primitives'
import * as THREE from 'three'

/**
 * The actual bug, on the actual asset: /models/rocks.glb is the real
 * Hyper3D Rodin rock formation from the homepage (src/components/
 * NightField.tsx's useRocks). Toggling rebuilds its material the same
 * way the real fix does — roughness up, metalness down, same geometry,
 * same light. And the Suspense boundary for that GLTF load lives inside
 * the Canvas, not outside it — the exact placement the piece is about.
 *
 * No frame, no card — transparent canvas straight on the page's own
 * black, normalized to a comfortable size regardless of the source
 * asset's real-world scale, with a small cursor-tilt so it reads as a
 * held object rather than a screenshot.
 */

function RealRock({ broken }: { broken: boolean }) {
  const { scene } = useGLTF('/models/rocks.glb')
  const ref = useRef<THREE.Group>(null)
  const { pointer } = useThree()
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const prepared = useMemo(() => {
    const clone = scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const scale = 1.7 / Math.max(size.x, size.y, size.z, 0.001)
    clone.children.forEach((c) => c.position.sub(center))
    clone.scale.setScalar(scale)
    return clone
  }, [scene])

  useEffect(() => {
    prepared.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const old = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial
      m.material = new THREE.MeshStandardMaterial({
        map: old.map ?? null,
        metalness: broken ? 1 : 0.15,
        roughness: broken ? 0.1 : 0.7,
      })
    })
  }, [prepared, broken])

  useFrame((_, delta) => {
    if (reduced || !ref.current) return
    ref.current.rotation.y += delta * 0.28
    const targetTiltX = pointer.y * 0.3
    const targetTiltZ = -pointer.x * 0.3
    ref.current.rotation.x += (targetTiltX - ref.current.rotation.x) * Math.min(1, delta * 2)
    ref.current.rotation.z += (targetTiltZ - ref.current.rotation.z) * Math.min(1, delta * 2)
  })

  return <primitive object={prepared} ref={ref} />
}

export default function LiveMaterialDemo() {
  const [broken, setBroken] = useState(true)

  return (
    <div>
      <div
        role="group"
        aria-label="Broken or fixed material"
        className="inline-flex rounded-full p-0.5"
        style={{ border: '1px solid var(--rail)' }}
      >
        {[
          { label: 'renders black', value: true },
          { label: 'renders lit', value: false },
        ].map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            aria-pressed={broken === opt.value}
            onClick={() => setBroken(opt.value)}
            className="kit-toggle-btn rounded-full px-4 py-1.5 text-sm"
            style={{
              color: broken === opt.value ? 'var(--accent-ink)' : 'var(--ink-dim)',
              background: broken === opt.value ? 'var(--accent)' : 'transparent',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {/* Square and centered, not full-width — a wide-short mount would
          crop tall geometry top and bottom. */}
      <div className="mx-auto mt-8 w-full max-w-md">
        <AspectRatio ratio={1}>
          <Canvas camera={{ position: [0, 0.3, 4.4], fov: 40 }} dpr={[1, 1.5]} gl={{ alpha: true }}>
            {/* Same lighting language as the homepage field (NightField.tsx):
                a weak ambient + hemisphere base, plus key/fill point lights —
                no HDRI, no bloom. Ambient/hemisphere barely touch the broken
                state on purpose: metalness=1 collapses the diffuse term to
                near-zero regardless of how much ambient light hits it, so the
                black/wrong read stays intact while the fixed state gains real
                falloff and a cool rim for dimension. */}
            <ambientLight intensity={broken ? 0.05 : 0.14} />
            <hemisphereLight args={['#1c2430', '#0a0908']} intensity={broken ? 0.05 : 0.24} />
            <pointLight position={[2, 2.2, 3]} intensity={broken ? 8 : 17} />
            <pointLight position={[-2.6, 1.1, -1.8]} intensity={broken ? 0 : 8} color="#dce6f2" />
            {/* The Suspense boundary for this GLTF load lives inside the
                Canvas — see the paragraph above. */}
            <Suspense fallback={null}>
              <RealRock broken={broken} />
            </Suspense>
          </Canvas>
        </AspectRatio>
      </div>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
        The actual rock formation from the homepage — /models/rocks.glb, Rodin-generated.
        Same mesh, same light. The fix rebuilds the material on load, before anything else runs.
      </p>
    </div>
  )
}
