import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useOptionalGLTF } from '../../../../lib/optionalGLTF'
import { countTriangles, poolTexture, ramp, rebuildMaterials } from './support'
import { frameloopFor } from './viewport'

export interface Progress { p: number }

function BikeStates({
  prog,
  reduced,
  onStats,
}: {
  prog: Progress
  reduced: boolean
  onStats: (tris: number) => void
}) {
  const scene = useOptionalGLTF('/models/bike.glb')?.scene
  const spinRef = useRef<THREE.Group>(null)
  const wireRef = useRef<THREE.Group>(null)
  const clayRef = useRef<THREE.Group>(null)
  const texRef = useRef<THREE.Group>(null)
  const keyRef = useRef<THREE.PointLight>(null)
  const warmRef = useRef<THREE.PointLight>(null)
  const poolRef = useRef<THREE.MeshBasicMaterial>(null)

  const built = useMemo(() => {
    if (!scene) return null
    const normalize = (root: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(root)
      const size = new THREE.Vector3()
      const center = new THREE.Vector3()
      box.getSize(size)
      box.getCenter(center)
      const scale = 3.1 / Math.max(size.x, size.y, size.z, 0.001)
      root.children.forEach((c) => c.position.sub(center))
      root.scale.setScalar(scale)
    }

    // Everything created here (not the cache-shared source geometry)
    // gets disposed on unmount — r3f won't free <primitive> content.
    const disposables: { dispose: () => void }[] = []

    // Wire: hide each mesh's surface, hang its edge lines off the mesh so
    // they inherit the exact transform.
    const wire = scene.clone(true)
    const wireMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#aab2ba'),
      transparent: true,
      opacity: 1,
    })
    disposables.push(wireMat)
    wire.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const hidden = new THREE.MeshBasicMaterial({ visible: false })
      const edges = new THREE.EdgesGeometry(m.geometry, 12)
      disposables.push(hidden, edges)
      m.material = hidden
      m.add(new THREE.LineSegments(edges, wireMat))
    })
    normalize(wire)

    // Clay: one shared untextured material.
    const clay = scene.clone(true)
    const clayMat = new THREE.MeshStandardMaterial({
      color: '#8d8781',
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    })
    clay.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) m.material = clayMat
    })
    normalize(clay)

    // Textured: the homepage's material rebuild, opacity managed per frame.
    const tex = scene.clone(true)
    disposables.push(...rebuildMaterials(tex))
    const texMats: THREE.MeshStandardMaterial[] = []
    tex.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        const mat = m.material as THREE.MeshStandardMaterial
        mat.transparent = true
        mat.opacity = 0
        texMats.push(mat)
      }
    })
    normalize(tex)
    disposables.push(clayMat)

    return { wire, wireMat, clay, clayMat, tex, texMats, disposables, tris: countTriangles(scene) }
  }, [scene])

  useEffect(() => {
    if (built) onStats(built.tris)
  }, [built, onStats])

  useEffect(() => {
    if (!built) return
    const { disposables } = built
    return () => disposables.forEach((d) => d.dispose())
  }, [built])

  useFrame((_, delta) => {
    if (!built) return
    const p = prog.p
    const w = 1 - ramp(p, 0.2, 0.34)
    const c = ramp(p, 0.18, 0.32) * (1 - ramp(p, 0.52, 0.66))
    const t = ramp(p, 0.52, 0.66)
    const n = ramp(p, 0.8, 0.93)

    // Mutations run through refs and setValues() — never property writes
    // on memoized objects — matching the homepage's useFrame discipline.
    built.wireMat.setValues({ opacity: w })
    built.clayMat.setValues({ opacity: c })
    for (const mat of built.texMats) {
      mat.setValues({ opacity: t, transparent: t < 0.999 })
    }
    if (wireRef.current) wireRef.current.visible = w > 0.001
    if (clayRef.current) clayRef.current.visible = c > 0.001
    if (texRef.current) texRef.current.visible = t > 0.001

    if (keyRef.current) {
      keyRef.current.intensity = 16 - 7 * n
      keyRef.current.color.set(n > 0.5 ? '#b8c4d8' : '#ffffff')
    }
    if (warmRef.current) warmRef.current.intensity = 15 * n
    if (poolRef.current) poolRef.current.opacity = 0.15 * n

    if (!reduced && spinRef.current) spinRef.current.rotation.y += delta * 0.16
  })

  if (!built) return null

  return (
    <>
      <group ref={spinRef} rotation={[0, 0.7, 0]}>
        <primitive object={built.wire} ref={wireRef} />
        <primitive object={built.clay} ref={clayRef} />
        <primitive object={built.tex} ref={texRef} />
      </group>
      {/* the pool only exists in the last stage — the night rig arriving */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -1.05, 0]} scale={7} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={poolRef}
          map={poolTexture()}
          color="#ffb066"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <ambientLight intensity={0.12} />
      <hemisphereLight args={['#1c2430', '#0a0908']} intensity={0.22} />
      <pointLight ref={keyRef} position={[2.4, 2.6, 3.2]} intensity={16} />
      <pointLight ref={warmRef} position={[-1.6, -0.4, 1.8]} intensity={0} color="#ffb066" distance={9} decay={2} />
    </>
  )
}


export default function BikeCanvas({ camZ, visible, ...bike }: Parameters<typeof BikeStates>[0] & { camZ: number; visible: boolean }) {
  return (
    <Canvas camera={{ position: [0, 0.5, camZ], fov: 36 }} dpr={[1, 1.5]} gl={{ alpha: true }} frameloop={frameloopFor(visible, bike.reduced)}>
      <Suspense fallback={null}><BikeStates {...bike} /></Suspense>
    </Canvas>
  )
}
