import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { configureTiledTexture, poolTexture, useNormalizedClone } from './support'

import { frameloopFor } from './viewport'

export interface CamState {
  x: number
  y: number
  z: number
  tx: number
  ty: number
  tz: number
}


function Rig({ cam, reduced }: { cam: CamState; reduced: boolean }) {
  useFrame(({ camera, clock }) => {
    // A slow two-frequency drift on top of the scrubbed path — the one
    // motion in this scene that runs on the page's clock, admitted to
    // in the first caption. Off under reduced motion.
    const t = reduced ? 0 : clock.elapsedTime
    const bx = Math.sin(t * 0.31) * 0.16
    const by = Math.sin(t * 0.23 + 1.3) * 0.11
    camera.position.set(cam.x + bx, cam.y + by, cam.z)
    camera.lookAt(cam.tx, cam.ty + by * 0.4, cam.tz)
  })
  return null
}

/** Dust hanging in the pooled light — a few dozen slow motes cycling
    upward around each station, seeded deterministically. */
function Motes({ reduced }: { reduced: boolean }) {
  const inst = useRef<THREE.InstancedMesh>(null)
  const CENTERS: [number, number, number][] = [
    [0, 0, 0],
    [-16.5, 0, -10.5],
    [-34, 0, -18],
  ]
  const PER = 9
  const N = CENTERS.length * PER
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const seeds = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => {
        const r = (salt: number) => {
          const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
          return x - Math.floor(x)
        }
        return { a: r(1) * Math.PI * 2, rad: 1.2 + r(2) * 3.4, speed: 0.02 + r(3) * 0.05, phase: r(4), size: 0.028 + r(5) * 0.03 }
      }),
    [N]
  )

  useFrame(({ clock }) => {
    const mesh = inst.current
    if (!mesh) return
    const t = reduced ? 40 : clock.elapsedTime
    for (let i = 0; i < N; i++) {
      const c = CENTERS[Math.floor(i / PER)]
      const s = seeds[i]
      const cycle = (t * s.speed + s.phase) % 1
      dummy.position.set(
        c[0] + Math.cos(s.a + t * 0.05) * s.rad,
        0.25 + cycle * 3.4,
        c[2] + Math.sin(s.a + t * 0.05) * s.rad
      )
      const fade = Math.sin(cycle * Math.PI)
      dummy.scale.setScalar(s.size * (0.4 + 0.6 * fade))
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={inst} args={[undefined, undefined, N]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color={new THREE.Color('#b9c2cc').multiplyScalar(1.4)}
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  )
}

function Terrain() {
  const tile = useTexture('/textures/playa-tile.webp', (t) => configureTiledTexture(t))
  const { scene } = useGLTF('/models/terrain.glb')
  const geometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh && !geo) geo = m.geometry
    })
    return geo
  }, [scene])
  if (!geometry) return null
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial map={tile} bumpMap={tile} bumpScale={0.75} color="#8e9194" roughness={0.96} metalness={0} />
    </mesh>
  )
}

function Sky() {
  const tex = useTexture('/textures/sky-pano.webp', (t) => {
    t.colorSpace = THREE.SRGBColorSpace
  })
  return (
    <mesh position={[0, 70, 0]} rotation-y={0.4}>
      <cylinderGeometry args={[210, 210, 180, 48, 1, true]} />
      <meshBasicMaterial
        map={tex}
        side={THREE.BackSide}
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        fog={false}
        toneMapped={false}
      />
    </mesh>
  )
}

/** Normalized model standing on the ground at a station. */
function Station({
  url,
  fit,
  tint,
  position,
  rotationY = 0,
}: {
  url: string
  fit: number
  tint?: string
  position: [number, number, number]
  rotationY?: number
}) {
  const clone = useNormalizedClone(url, fit, tint ?? '#ffffff')
  const lift = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clone)
    return -box.min.y
  }, [clone])
  return (
    <group position={[position[0], position[1] + lift, position[2]]} rotation-y={rotationY}>
      <primitive object={clone} />
    </group>
  )
}

/** One static thylacine in steel and warm edge light — the homepage
    pack, paused. */
function StillThylacine({
  position,
  rotationY,
  scale,
}: {
  position: [number, number, number]
  rotationY: number
  scale: number
}) {
  const { scene } = useGLTF('/models/them.glb')
  const steel = useTexture('/textures/steel-tile.webp', (t) => configureTiledTexture(t))

  const built = useMemo(() => {
    const group = new THREE.Group()
    const disposables: { dispose: () => void }[] = []
    const edgeMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#ffdda8').multiplyScalar(1.15),
      toneMapped: false,
    })
    disposables.push(edgeMat)
    scene.traverse((o) => {
      const src = o as THREE.Mesh
      if (!src.isMesh) return
      const isStripes = src.name.toLowerCase().includes('stripes')
      const material = isStripes
        ? new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffdda8').multiplyScalar(1.3), toneMapped: false })
        : new THREE.MeshStandardMaterial({
            map: steel,
            bumpMap: steel,
            bumpScale: 0.6,
            color: '#e2e2e2',
            roughness: 0.85,
            metalness: 0.25,
            side: THREE.DoubleSide,
          })
      disposables.push(material)
      const mesh = new THREE.Mesh(src.geometry, material)
      if (!isStripes) {
        const edges = new THREE.EdgesGeometry(src.geometry, 20)
        disposables.push(edges)
        mesh.add(new THREE.LineSegments(edges, edgeMat))
      }
      group.add(mesh)
    })
    return { group, disposables }
  }, [scene, steel])

  useEffect(() => {
    const { disposables } = built
    return () => disposables.forEach((d) => d.dispose())
  }, [built])

  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <primitive object={built.group} />
    </group>
  )
}

function LightPool({
  position,
  scale,
  color,
  opacity,
}: {
  position: [number, number, number]
  scale: number
  color: string
  opacity: number
}) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={position} scale={scale} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={poolTexture()}
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

function FieldCorner({ reduced }: { reduced: boolean }) {
  return (
    <>
      <fog attach="fog" args={['#0a0a0c', 26, 150]} />
      <ambientLight intensity={0.06} />
      <hemisphereLight args={['#141a24', '#0a0908']} intensity={0.18} />
      <Terrain />
      <Sky />

      {/* the fork in the path */}
      <Station url="/models/signpost.glb" fit={5.4} position={[0, 0, 0]} rotationY={0.45} />
      <pointLight position={[1.6, 3.8, 1.8]} color="#d8c294" intensity={11} distance={13} decay={2} />
      <LightPool position={[0, 0.03, 0]} scale={7.5} color="#d9cba4" opacity={0.09} />

      {/* the pack, paused mid-amble */}
      <StillThylacine position={[-16, 0, -10]} rotationY={0.9} scale={1.25} />
      <StillThylacine position={[-20.2, 0, -7.2]} rotationY={2.1} scale={1.08} />
      <StillThylacine position={[-13.6, 0, -14.8]} rotationY={-0.4} scale={0.92} />
      <pointLight position={[-16.5, 2.2, -10.5]} color="#ffce8a" intensity={62} distance={19} decay={2} />
      <LightPool position={[-16.5, 0.035, -10.5]} scale={15} color="#ffce8a" opacity={0.11} />

      {/* the dish, listening */}
      <Station url="/models/dish.glb" fit={6.6} tint="#7e848c" position={[-34, 0, -18]} rotationY={0.7} />
      <pointLight position={[-39, 8, -23]} color="#b8c4d8" intensity={300} distance={64} decay={2} />
      <pointLight position={[-34, 1, -16]} color="#8fa8d8" intensity={100} distance={42} decay={2} />
      <LightPool position={[-34, 0.03, -18]} scale={11} color="#b8c4d8" opacity={0.07} />

      {/* dust hanging in the light */}
      <Motes reduced={reduced} />
    </>
  )
}


export default function FlythroughCanvas({ pose, reduced, visible }: { pose: CamState; reduced: boolean; visible: boolean }) {
  return (
    <Canvas
      camera={{ position: [pose.x, pose.y, pose.z], fov: 46 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true }}
      frameloop={frameloopFor(visible, reduced)}
    >
      <Rig cam={pose} reduced={reduced} />
      <Suspense fallback={null}>
        <FieldCorner reduced={reduced} />
      </Suspense>
    </Canvas>
  )
}
