import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import { useNormalizedClone } from './support'
import { frameloopFor } from './viewport'

function Model({
  url,
  fit,
  tint,
  spin,
  reduced,
  rotation,
}: {
  url: string
  fit: number
  tint?: string
  spin: number
  reduced: boolean
  rotation?: [number, number, number]
}) {
  const clone = useNormalizedClone(url, fit, tint ?? '#ffffff')
  const ref = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (reduced || !ref.current) return
    ref.current.rotation.y += delta * spin
  })

  return (
    <group rotation={rotation ?? [0, 0, 0]}>
      <primitive object={clone} ref={ref} />
    </group>
  )
}

export default function CameoCanvas({ camera, visible, ...model }: Parameters<typeof Model>[0] & { camera: [number, number, number]; visible: boolean }) {
  const { reduced } = model
  return (
    <Canvas camera={{ position: camera, fov: 38 }} dpr={[1, 1.5]} gl={{ alpha: true }} frameloop={frameloopFor(visible, reduced)}>
      <ambientLight intensity={0.14} />
      <hemisphereLight args={['#1c2430', '#0a0908']} intensity={0.24} />
      <pointLight position={[2, 2.4, 3]} intensity={16} />
      <pointLight position={[-2.6, 1.1, -1.8]} intensity={7} color="#dce6f2" />
      {/* Keep the WebGL context mounted while the model loads. */}
      <Suspense fallback={null}>
        <Model {...model} />
      </Suspense>
    </Canvas>
  )
}
