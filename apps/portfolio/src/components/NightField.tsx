import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeElements, type ThreeEvent } from '@react-three/fiber'
import { Environment, Html, Line, useCursor, useTexture } from '@react-three/drei'
import { Bloom, EffectComposer, SMAA } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useOptionalTexture } from '../lib/optionalTexture'
import { preloadOptionalGLTF, useOptionalGLTF } from '../lib/optionalGLTF'

const WritingGroves = lazy(() => import('./WritingGroves'))

/**
 * The front door as a real night field (three.js): every glowing
 * structure is one of Oliver's works standing in for a page, bloom makes
 * the light actually glow, and each structure's point light pools its
 * color on the ground — the only color on the site.
 *
 * Navigation is passed in as a callback because r3f's Canvas is its own
 * React tree: router context doesn't cross the bridge.
 */

export interface NightFieldProps {
  onEnter: (href: string, external?: boolean) => void
  reducedMotion: boolean
  softwareRendering?: boolean
}

interface PortalDef {
  id: string
  label: string
  sub: string
  href: string
  external?: boolean
}

type HoverLabel = (portal: PortalDef | null) => void

function useHoverQuery() {
  return useMemo(() => window.matchMedia('(hover: hover) and (pointer: fine)'), [])
}

const COMPACT_ASPECT = 1.35

function usePortraitLayout() {
  return useThree(({ size }) => size.width / size.height < COMPACT_ASPECT)
}

function useCompactSpread() {
  // Keep the phone's depth staging, while spreading the landmark centers
  // across the extra width of tablets. Model proportions stay untouched.
  return useThree(({ size }) => Math.max(1, Math.min(COMPACT_ASPECT, size.width / size.height) / 0.5))
}

function PortalLabel({ def, onEnter, hovered, position = [0, -0.8, 0] }: {
  def: PortalDef
  hovered: boolean
  onEnter: NightFieldProps['onEnter']
  position?: [number, number, number]
}) {
  const [mounted, setMounted] = useState(false)
  // Canvas mounts synchronously; Html needs its canvas parent in the DOM.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  if (!mounted) return null

  return (
    <Html center position={position} zIndexRange={[20, 10]}>
      <a
        className="world-portal-link"
        style={def.id === 'triangle' ? { transform: 'translateY(-28px)' } : undefined}
        data-hovered={hovered}
        href={def.href}
        aria-label={def.id === 'triangle' ? 'Pink Triangle' : def.id === 'contact' ? 'Contact' : def.label}
        aria-describedby={`portal-description-${def.id}`}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
          event.preventDefault()
          event.stopPropagation()
          onEnter(def.href, def.external)
        }}
      >
        {def.id === 'triangle' ? 'Pink Triangle' : def.id === 'contact' ? 'Contact' : def.label}
        <span id={`portal-description-${def.id}`} className="world-portal-description">{def.sub}</span>
      </a>
    </Html>
  )
}

/* 0..1 eased hover value — every hover response uses this so nothing
   in the scene ever snaps */
function useEased01(hovered: boolean, k = 7) {
  const v = useRef(0)
  useFrame((_, delta) => {
    v.current += ((hovered ? 1 : 0) - v.current) * (1 - Math.exp(-k * delta))
  })
  return v
}

function EasedLight({
  hovered,
  on,
  off,
  ...props
}: { hovered: boolean; on: number; off: number } & Omit<ThreeElements['pointLight'], 'intensity' | 'ref'>) {
  const ref = useRef<THREE.PointLight>(null)
  const h = useEased01(hovered)
  useFrame(() => {
    if (ref.current) ref.current.intensity = off + (on - off) * h.current
  })
  return <pointLight ref={ref} intensity={off} {...props} />
}

function usePortalHover(portal?: PortalDef, onLabel?: HoverLabel): [boolean, { onPointerOver: (e: ThreeEvent<PointerEvent>) => void; onPointerOut: () => void }] {
  const [hovered, setHovered] = useState(false)
  const hoverQuery = useHoverQuery()
  useCursor(hovered)
  return [
    hovered,
    {
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        if (!hoverQuery.matches || e.pointerType === 'touch') return
        e.stopPropagation()
        setHovered(true)
        if (portal && onLabel) onLabel(portal)
      },
      onPointerOut: () => {
        setHovered(false)
        if (onLabel) onLabel(null)
      },
    },
  ]
}

/* Real rocks (Hyper3D): two weathered variants shared by every stone */
function useRocks(): { geometry: THREE.BufferGeometry; material: THREE.Material }[] {
  const scene = useOptionalGLTF('/models/rocks.glb')?.scene
  return useMemo(() => {
    const out: { geometry: THREE.BufferGeometry; material: THREE.Material }[] = []
    scene?.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        const old = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial
        out.push({
          geometry: m.geometry,
          material: new THREE.MeshStandardMaterial({ map: old.map ?? null, roughness: 0.96, metalness: 0.04 }),
        })
      }
    })
    return out
  }, [scene])
}

/* A pool of light on the playa — additive radial gradient, the way a
   real lamp reveals the ground around it */
const poolTexture = (() => {
  let tex: THREE.CanvasTexture | null = null
  return () => {
    if (tex) return tex
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,255,255,0.9)')
    g.addColorStop(0.45, 'rgba(255,255,255,0.35)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    tex = new THREE.CanvasTexture(c)
    return tex
  }
})()

function LightPool({ position, scale = 1, color, opacity }: { position: [number, number, number]; scale?: number; color: string; opacity: number }) {
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

function configureTiledTexture(tex: THREE.Texture) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 1)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
}

/* Pull mesh geometries out of a GLB scene, keyed by lowercase node name */
function useGLBGeometries(url: string): Record<string, THREE.BufferGeometry> {
  const scene = useOptionalGLTF(url)?.scene
  return useMemo(() => {
    const out: Record<string, THREE.BufferGeometry> = {}
    scene?.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) out[m.name.toLowerCase()] = m.geometry
    })
    return out
  }, [scene])
}

/* Pull the first mesh geometry out of a GLB scene, or null if it dropped */
function useGLBGeometry(url: string): THREE.BufferGeometry | null {
  const geos = useGLBGeometries(url)
  return Object.values(geos)[0] ?? null
}

/* A whole GLB with its own PBR materials (Rodin-generated heroes) */
function useGLBScene(url: string, { fogOff = false, tint = '#ffffff' } = {}): THREE.Group | null {
  const scene = useOptionalGLTF(url)?.scene
  const instance = useMemo(() => {
    if (!scene) return null
    const instance = scene.clone(true)
    instance.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        /* rebuild the material from scratch: generated GLBs ship exotic
           material state (spec-gloss, metalness 1, odd alpha) that can
           render invisible under plain point lights */
        const old = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial
        m.material = new THREE.MeshStandardMaterial({
          map: old.map ?? null,
          normalMap: old.normalMap ?? null,
          roughnessMap: old.roughnessMap ?? null,
          metalnessMap: old.metalnessMap ?? null,
          aoMap: old.aoMap ?? null,
          color: old.map ? new THREE.Color(tint) : (old.color ?? new THREE.Color(0x888888)),
          roughness: Math.max(old.roughness ?? 0.7, 0.72),
          metalness: Math.min(old.metalness ?? 0.15, 0.35),
          fog: !fogOff,
          side: THREE.DoubleSide,
        })
        m.frustumCulled = false
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    return instance
  }, [scene, fogOff, tint])
  useEffect(() => () => instance?.traverse(object => {
    const mesh = object as THREE.Mesh
    if (mesh.isMesh) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach(material => material.dispose())
    }
  }), [instance])
  return instance
}

/* A sculpture the way the real ones are built: a solid body wearing a
   real material (FLORA steel or wood), revealed only where the light
   pools, and light running along its edges. */
function SteelAndWire({
  geometry,
  edgeColor,
  edgeThreshold,
  glow,
  breathe,
  reducedMotion,
  mapUrl,
  phase = 0,
  edgeFog = true,
  bodyColor = '#e2e2e2',
  bodyFog = true,
}: {
  geometry: THREE.BufferGeometry
  edgeColor: string
  edgeThreshold: number
  glow: number
  breathe: number
  reducedMotion: boolean
  mapUrl: string
  phase?: number
  edgeFog?: boolean
  bodyColor?: string
  bodyFog?: boolean
}) {
  const smoothGeometry = useMemo(() => {
    const clone = geometry.clone()
    clone.computeVertexNormals()
    const positions = clone.getAttribute('position')
    const normals = clone.getAttribute('normal')
    const shared = new Map<string, THREE.Vector3>()
    const keys: string[] = []
    for (let i = 0; i < positions.count; i++) {
      const key = `${positions.getX(i).toFixed(5)},${positions.getY(i).toFixed(5)},${positions.getZ(i).toFixed(5)}`
      keys.push(key)
      const normal = shared.get(key) ?? new THREE.Vector3()
      normal.add(new THREE.Vector3(normals.getX(i), normals.getY(i), normals.getZ(i)))
      shared.set(key, normal)
    }
    for (const normal of shared.values()) normal.normalize()
    for (let i = 0; i < normals.count; i++) {
      const normal = shared.get(keys[i])!
      normals.setXYZ(i, normal.x, normal.y, normal.z)
    }
    // Only shading normals are shared: preserve UV seams and the original
    // sculpture silhouette, and never mutate the cached model geometry.
    return clone
  }, [geometry])
  useEffect(() => () => smoothGeometry.dispose(), [smoothGeometry])
  const edges = useMemo(() => {
    const g = new THREE.EdgesGeometry(geometry, edgeThreshold)
    /* Keep the silhouette continuous, with only a slight variation in
       the LED runs so a small animal never reads as disconnected wire. */
    const count = g.getAttribute('position').count
    const colors = new Float32Array(count * 3)
    for (let seg = 0; seg < count / 2; seg++) {
      const s = Math.sin(seg * 127.1 + 311.7) * 43758.5453
      const b = 0.8 + 0.2 * (s - Math.floor(s))
      for (const vi of [seg * 2, seg * 2 + 1]) {
        colors[vi * 3] = colors[vi * 3 + 1] = colors[vi * 3 + 2] = b
      }
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [geometry, edgeThreshold])
  const mat = useRef<THREE.LineBasicMaterial>(null)
  const base = useMemo(() => new THREE.Color(edgeColor), [edgeColor])
  const configured = useTexture(mapUrl, configureTiledTexture)

  const eased = useRef(glow)
  useFrame(({ clock }, delta) => {
    if (!mat.current) return
    const t = reducedMotion ? 0 : clock.elapsedTime
    // ease toward the hover target instead of snapping
    eased.current += (glow - eased.current) * (1 - Math.exp(-7 * delta))
    const pulse = eased.current + Math.sin(t * breathe + phase) * 0.12
    mat.current.color.copy(base).multiplyScalar(pulse)
  })

  return (
    <>
      <mesh geometry={smoothGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={configured}
          bumpMap={configured}
          bumpScale={0.035}
          color={bodyColor}
          emissive="#b99567"
          emissiveIntensity={0.035}
          roughness={0.65}
          metalness={0.45}
          fog={bodyFog}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial ref={mat} vertexColors color={base.clone().multiplyScalar(glow)} toneMapped={false} fog={edgeFog} />
      </lineSegments>
    </>
  )
}

/* THEM — a pack of faceted steel thylacines (modeled in Blender), LED
   wire along the strong creases, light-bar stripes across the back.
   Extinct animals walking again at night: each one ambles a slow loop
   through the pool of light, legs trotting, body rising and falling. */

/* leg pivot points in model space (shoulder/hip joints) */
const LEG_PIVOTS: Record<string, [number, number, number]> = {
  leg_fl: [1.55, 3.35, -0.5],
  leg_fr: [1.55, 3.35, 0.5],
  leg_bl: [-1.6, 3.0, -0.5],
  leg_br: [-1.6, 3.0, 0.5],
}
/* Four-beat walk: stagger each footfall instead of hopping in pairs. */
const LEG_PHASE: Record<string, number> = { leg_fl: 0, leg_br: Math.PI / 2, leg_fr: Math.PI, leg_bl: Math.PI * 1.5 }

function WalkingLeg({ geometry, pivot, phase, stride, reducedMotion }: {
  geometry: THREE.BufferGeometry
  pivot: [number, number, number]
  phase: number
  stride: { current: number }
  reducedMotion: boolean
}) {
  const texture = useTexture('/textures/steel-tile.webp', configureTiledTexture)
  const rig = useMemo(() => {
    const geo = geometry.clone()
    const position = geo.getAttribute('position')
    const indices = new Uint16Array(position.count * 4)
    const weights = new Float32Array(position.count * 4)
    const length = pivot[1] / 2
    for (let i = 0; i < position.count; i++) {
      const lower = 1 - THREE.MathUtils.smoothstep(position.getY(i), length - 0.25, length + 0.25)
      indices[i * 4 + 1] = 1
      weights[i * 4] = 1 - lower
      weights[i * 4 + 1] = lower
    }
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4))
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4))
    const hip = new THREE.Bone()
    hip.position.set(...pivot)
    const knee = new THREE.Bone()
    knee.position.y = -length
    hip.add(knee)
    const skeleton = new THREE.Skeleton([hip, knee])
    const material = new THREE.MeshStandardMaterial({ map: texture, color: '#a7a29a', roughness: 0.65, metalness: 0.45 })
    const mesh = new THREE.SkinnedMesh(geo, material)
    mesh.add(hip)
    mesh.bind(skeleton)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    return { mesh, hip, knee, length, skeleton }
  }, [geometry, pivot, texture])
  useEffect(() => () => {
    rig.mesh.geometry.dispose()
    ;(rig.mesh.material as THREE.Material).dispose()
    rig.skeleton.dispose()
  }, [rig])
  useFrame(() => {
    const cycle = ((stride.current + phase) / (Math.PI * 2)) % 1
    const swing = Math.max(0, (cycle - 0.6) / 0.4)
    const x = reducedMotion ? 0 : cycle < 0.6 ? 0.6 - cycle * 2 : -0.6 * Math.cos(swing * Math.PI)
    const lift = reducedMotion ? 0 : Math.sin(swing * Math.PI) * 0.35
    const down = pivot[1] - 0.14 - lift
    const reach = Math.min(Math.hypot(x, down), rig.length * 2 - 0.001)
    const bend = Math.acos(reach / (rig.length * 2))
    const direction = pivot[0] > 0 ? 1 : -1
    rig.hip.rotation.set(0, 0, Math.atan2(x, down) - bend * direction)
    rig.knee.rotation.set(0, 0, bend * 2 * direction)
  })
  return <primitive object={rig.mesh} />
}

function Thylacine({
  parts,
  hovered,
  reducedMotion,
  scale,
  theta0,
  phase,
  portrait = false,
}: {
  parts: Record<string, THREE.BufferGeometry>
  hovered: boolean
  reducedMotion: boolean
  scale: number
  theta0: number
  phase: number
  portrait?: boolean
}) {
  const walker = useRef<THREE.Group>(null)
  const bodyGroup = useRef<THREE.Group>(null)
  const stripesMat = useRef<THREE.MeshBasicMaterial>(null)
  const stride = useRef(phase)
  const travel = useRef(0)
  const h = useEased01(hovered)
  // concentric, non-intersecting ellipses per animal, derived from phase
  const RX = portrait ? 3 : 7.5 - phase * 0.5
  const RZ = portrait ? 2.5 : 5.5 - phase * 0.35
  const OMEGA = (2 * Math.PI) / (70 + phase * 6) // Slow laps keep the pack from competing with the plant signals.

  useFrame(({ clock }, delta) => {
    const g = walker.current
    if (!g) return
    const t = reducedMotion ? 0 : clock.elapsedTime
    // Each animal slows to a brief rest on its own schedule. Integrating
    // travel and stride with the same pace avoids sliding feet on stops.
    const restCycle = (t + phase * 9) % (24 + phase * 3)
    const pace = reducedMotion ? 0 : THREE.MathUtils.smoothstep(restCycle, 1.5, 4)
      * (1 - THREE.MathUtils.smoothstep(restCycle, 20 + phase * 3, 23 + phase * 3))
    if (!reducedMotion) travel.current += Math.min(delta, 0.1) * pace
    const th = theta0 - travel.current * OMEGA
    const depth = portrait ? (phase === 0 ? 3 : phase < 2 ? -5 : -18) : 0
    const lane = portrait ? (phase === 0 ? 0 : phase < 2 ? -1.2 : 1) : 0
    g.position.set(lane + Math.cos(th) * RX, 0, depth + Math.sin(th) * RZ)
    // face along the direction of travel (ellipse tangent)
    g.rotation.y = Math.atan2(Math.cos(th) * RZ, Math.sin(th) * RX)
    // Derive cadence from path speed so narrower phone paths don't skate.
    const speed = OMEGA * Math.hypot(Math.sin(th) * RX, Math.cos(th) * RZ)
    if (!reducedMotion) stride.current += speed * Math.min(delta, 0.1) * pace * Math.PI * 2 / (2 * scale)
    if (bodyGroup.current) {
      bodyGroup.current.position.y = reducedMotion ? 0 : Math.sin(stride.current * 4) * 0.012
      bodyGroup.current.rotation.x = 0
    }
    if (stripesMat.current) {
      stripesMat.current.color.set('#ffdda8').multiplyScalar(1.35 + h.current * 0.65)
    }
  })

  const body = parts['them']
  const stripes = parts['them_stripes']

  return (
    <group ref={walker} scale={scale}>
      <group ref={bodyGroup} scale-z={1.4}>
        {body && (
          <SteelAndWire
            geometry={body}
            edgeColor="#ffdda8"
            edgeThreshold={48}
            glow={hovered ? 1.5 : 0.85}
            breathe={1.1}
            phase={phase}
            reducedMotion={reducedMotion}
            mapUrl="/textures/steel-tile.webp"
            bodyColor="#a7a29a"
            bodyFog={false}
          />
        )}
        {stripes && (
          <mesh geometry={stripes}>
            <meshBasicMaterial ref={stripesMat} color={new THREE.Color('#ffdda8').multiplyScalar(1.35)} toneMapped={false} />
          </mesh>
        )}
      {Object.entries(LEG_PIVOTS).map(([name, pivot]) => {
        const geo = parts[name]
        if (!geo) return null
        return (
          <WalkingLeg key={name} geometry={geo} pivot={pivot} phase={LEG_PHASE[name]} stride={stride} reducedMotion={reducedMotion} />
        )
      })}
      </group>
    </group>
  )
}

function Them({ def, onEnter, reducedMotion, onLabel }: { def: PortalDef; onEnter: NightFieldProps['onEnter']; reducedMotion: boolean; onLabel?: HoverLabel }) {
  const [hovered, handlers] = usePortalHover(def, onLabel)
  const parts = useGLBGeometries('/models/them.glb')
  const portrait = usePortraitLayout()
  const spread = useCompactSpread()

  return (
    <group
      position={portrait ? [4.6 * spread, 0, -28] : [27, 0, -46]}
      scale={portrait ? 1.1 : 1}
      {...handlers}
      onClick={(e) => {
        e.stopPropagation()
        onEnter(def.href, def.external)
      }}
    >
      <PortalLabel def={def} onEnter={onEnter} hovered={hovered} position={portrait ? [0, -1.5, 0] : [0, 7, 0]} />
      <Thylacine parts={parts} hovered={hovered} reducedMotion={reducedMotion} portrait={portrait} scale={1.1} theta0={1.2} phase={0} />
      <Thylacine parts={parts} hovered={hovered} reducedMotion={reducedMotion} portrait={portrait} scale={0.95} theta0={3.6} phase={1.7} />
      <Thylacine parts={parts} hovered={hovered} reducedMotion={reducedMotion} portrait={portrait} scale={0.95} theta0={5.4} phase={3.1} />
      {/* invisible hit volume covering the loop the pack walks; grows while
          hovered so the camera glide can't slide it out from under the
          cursor between press and release */}
      <mesh position={[0, 3, 0]} scale={hovered ? 1.5 : 1} visible={false}>
        <boxGeometry args={[19, 7, 13]} />
      </mesh>
      <EasedLight hovered={hovered} on={190} off={145} position={[-6, 10, 6]} color="#ffce8a" distance={36} decay={2} />
    </group>
  )
}

/* Work — a real radio telescope (Hyper3D-generated, PBR): weathered
   white dish with panel segments on an alt-az pedestal, tilted at the
   sky and slowly tracking something across it. Listening at production
   scale. */
function Constellation({ def, onEnter, reducedMotion, onLabel }: { def: PortalDef; onEnter: NightFieldProps['onEnter']; reducedMotion: boolean; onLabel?: HoverLabel }) {
  const [hovered, handlers] = usePortalHover(def, onLabel)
  const portrait = usePortraitLayout()
  const spread = useCompactSpread()
  const telescope = useGLBScene('/models/telescope.glb?v=2', { fogOff: true, tint: '#a5adb8' })
  const azimuth = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!azimuth.current || reducedMotion) return
    // one slow sweep and back across the sky, like a long observation;
    // the whole alt-az assembly turns on its pedestal, the way they do
    azimuth.current.rotation.y = Math.sin(clock.elapsedTime * 0.045) * 0.55
  })

  return (
    <group
      position={portrait ? [-14 * spread, 0, -85] : [-52, 0, -100]}
      rotation-y={0.35}
      scale={portrait ? 2.15 : 2.2}
      {...handlers}
      onClick={(e) => {
        e.stopPropagation()
        onEnter(def.href, def.external)
      }}
    >
      <PortalLabel def={def} onEnter={onEnter} hovered={hovered} />
      <group ref={azimuth} position-y={-0.16}>{telescope && <primitive object={telescope} />}</group>
      {/* hit volume covering the full dish sweep so hover stays stable;
          hover hysteresis keeps it under the cursor through the camera pan */}
      <mesh position={[0, 5, 0]} scale={hovered ? 1.5 : 1} visible={false}>
        <boxGeometry args={[10.5, 10.5, 10.5]} />
      </mesh>
      {/* night lighting: a cool key from behind-left rims the dish edge
          while the bowl stays in soft shadow; a weak fill keeps the
          pedestal legible. No frontal floodlight — that flattens the
          bowl into a white disc. */}
      <EasedLight hovered={hovered} on={700} off={430} position={[-7, 9, -6]} color="#b8c4d8" distance={70} decay={2} />
      <EasedLight hovered={hovered} on={150} off={85} position={[0, 3.5, 2]} color="#8fa8d8" distance={50} decay={2} />
    </group>
  )
}

/* Thinking — a weathered wooden trail signpost (Hyper3D-generated,
   PBR): four finger boards pointing different ways, stones at the base,
   lantern-lit at the fork where the marker-stone paths split */
function Fork({ def, onEnter, onLabel }: { def: PortalDef; onEnter: NightFieldProps['onEnter']; onLabel?: HoverLabel }) {
  const [hovered, handlers] = usePortalHover(def, onLabel)
  const portrait = usePortraitLayout()
  const spread = useCompactSpread()
  const signpost = useGLBScene('/models/signpost-hd.glb', { tint: '#a7a29a' })
  const rocks = useRocks()

  /* two rows of dim marker stones diverging where the paths split */
  const markers = useMemo(() => {
    const rows: { x: number; z: number; s: number }[] = []
    for (let i = 0; i < 5; i++) {
      const d = 1.3 + i * 0.85
      rows.push({ x: d * 0.55, z: -d, s: 0.1 + (i % 2) * 0.025 })
      rows.push({ x: -d * 0.5, z: -d * 1.05, s: 0.11 - (i % 2) * 0.02 })
    }
    return rows
  }, [])

  return (
    <group
      position={portrait ? [3.6 * spread, 0, 3] : [6.5, 0, 4]}
      rotation-y={0.45}
      scale={portrait ? 0.56 : 0.48}
      {...handlers}
      onClick={(e) => {
        e.stopPropagation()
        onEnter(def.href, def.external)
      }}
    >
      <PortalLabel def={def} onEnter={onEnter} hovered={hovered} />
      {signpost && <primitive object={signpost} />}
      {rocks.length > 0 && markers.map((m, i) => (
        <mesh
          key={i}
          geometry={rocks[i % rocks.length].geometry}
          material={rocks[i % rocks.length].material}
          position={[m.x, 0, m.z]}
          rotation-y={i * 1.7}
          scale={m.s * 1.3}
        />
      ))}
      {/* Suzanne on a plinth beside the fork, thinking it over — garnish,
          so she streams in behind her own Suspense instead of holding up
          the field's first frame */}
      {!portrait && <Suspense fallback={null}>
        <ForkSuzanne />
      </Suspense>}
      <LightPool position={[0, 0.03, 0]} scale={3} color="#d9cba4" opacity={0.025} />
      <mesh position={[0, 2.4, 0]} scale={hovered ? 1.5 : 1} visible={false}>
        <boxGeometry args={[6.5, 5.4, 3.5]} />
      </mesh>
      <EasedLight hovered={hovered} on={6} off={3} position={[1.6, 3.4, 1.8]} color="#d8c294" distance={9} decay={2} />
    </group>
  )
}

/* Procedural fire: fbm noise scrolling up crossed planes, shaped
   into a flame silhouette — the way fire actually flickers, not a cone */
const FLAME_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
const FLAME_FRAG = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = vUv;
  float n = fbm(vec2(uv.x * 3.0 + uTime * 0.3, uv.y * 3.6 - uTime * 2.4));
  float bend = (n - 0.5) * 0.3 * uv.y;
  float width = 0.32 * pow(1.0 - uv.y, 0.7);
  float flame = 1.0 - abs(uv.x - 0.5 + bend) / max(0.015, width);
  float tongues = fbm(vec2(uv.x * 7.0, uv.y * 5.0 - uTime * 1.8));
  float f = smoothstep(0.05, 0.8, flame) * smoothstep(0.2, 0.65, tongues + (1.0 - uv.y) * 0.35);
  float hot = smoothstep(0.35, 0.95, flame) * (1.0 - uv.y);
  vec3 col = mix(vec3(1.0, 0.32, 0.04), vec3(1.0, 0.85, 0.45), hot);
  float alpha = f * smoothstep(0.0, 0.14, uv.y) * (1.0 - smoothstep(0.75, 1.0, uv.y)) * 0.72;
  if (alpha < 0.02) discard;
  gl_FragColor = vec4(col * 1.8, alpha);
}`

function Flame({ hovered, reducedMotion }: { hovered: boolean; reducedMotion: boolean }) {
  const mats = useRef<THREE.ShaderMaterial[]>([])
  const grp = useRef<THREE.Group>(null)
  useFrame(({ clock }, delta) => {
    const t = reducedMotion ? 8 : clock.elapsedTime
    // Offset each plane's clock so the sheets never flicker in lockstep.
    mats.current.forEach((m, i) => {
      if (m) m.uniforms.uTime.value = t + i * 4.7
    })
    if (grp.current) {
      grp.current.scale.setScalar(THREE.MathUtils.damp(grp.current.scale.x, hovered ? 1.15 : 1, 6, delta))
    }
  })
  const uniforms = useMemo(() => Array.from({ length: 3 }, () => ({ uTime: { value: 0 } })), [])
  return (
    <group ref={grp} position={[0, 0.28, 0]}>
      {[0, Math.PI / 3, Math.PI * 2 / 3].map((ry, i) => (
        <mesh key={i} rotation-y={ry} position={[0, 0.85, 0]}>
          <planeGeometry args={[1.5, 1.9]} />
          <shaderMaterial
            ref={(el: THREE.ShaderMaterial | null) => {
              if (el) mats.current[i] = el
            }}
            vertexShader={FLAME_VERT}
            fragmentShader={FLAME_FRAG}
            uniforms={uniforms[i]}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function ForkSuzanne() {
  const suzParts = useGLBGeometries('/models/suzanne.glb')
  const suzanne = Object.entries(suzParts).find(([k]) => k.includes('suzanne'))?.[1]
  const plinth = Object.entries(suzParts).find(([k]) => k.includes('plinth'))?.[1]
  return (
    <group position={[-1.9, 0, 1.1]} rotation-y={0.9}>
      {plinth && (
        <mesh geometry={plinth}>
          <meshStandardMaterial color="#57524a" roughness={0.95} />
        </mesh>
      )}
      {suzanne && (
        <mesh geometry={suzanne}>
          <meshStandardMaterial color="#8a8078" roughness={0.85} metalness={0.15} />
        </mesh>
      )}
      {/* her own little reading lamp */}
      <pointLight position={[0.5, 2.6, 0.8]} color="#d8c294" intensity={4} distance={5} decay={2} />
    </group>
  )
}

function CampArtifacts() {
  const teapot = useGLBGeometry('/models/teapot.glb')
  const bike = useGLBScene('/models/bike.glb')

  return (
    <>
      {/* the Utah teapot, waiting by the fire for whoever shows up */}
      {teapot && (
        <mesh geometry={teapot} position={[2.3, 0, 1.1]} rotation-y={-2.1} scale={0.9}>
          <meshStandardMaterial color="#7a7168" roughness={0.6} metalness={0.35} />
        </mesh>
      )}
      {/* somebody's dusty cruiser, leaned where they left it */}
      {bike && <primitive object={bike} position={[3.1, 0, -1.6]} rotation-y={0.85} rotation-z={0.06} scale={0.55} />}
    </>
  )
}

/* Contact — a campfire: a low pile of wooden logs (FLORA wood, lit
   by its own flame), a ring of playa stones, embers rising */
function Beacon({ def, onEnter, reducedMotion, onLabel }: { def: PortalDef; onEnter: NightFieldProps['onEnter']; reducedMotion: boolean; onLabel?: HoverLabel }) {
  const [hovered, handlers] = usePortalHover(def, onLabel)
  const portrait = usePortraitLayout()
  const spread = useCompactSpread()
  const light = useRef<THREE.PointLight>(null)
  const core = useRef<THREE.Mesh>(null)
  const hEased = useEased01(hovered)
  const wood = useTexture('/textures/wood-tile.webp')
  const rocks = useRocks()

  useFrame(({ clock }) => {
    if (reducedMotion) return
    const t = clock.elapsedTime
    // three incommensurate frequencies + an amplitude-modulated term for occasional deep dips
    const flicker = 1 + Math.sin(t * 7.3) * 0.06 + Math.sin(t * 11.9 + 1.7) * 0.05 + Math.sin(t * 0.7) * Math.sin(t * 23.1) * 0.045
    if (light.current) light.current.intensity = (60 + hEased.current * 40) * flicker
    if (core.current) {
      const pulse = 1 + Math.sin(t * 2.1) * 0.06
      core.current.scale.set(1.2 * pulse, 0.35 * pulse, 1.2 * pulse)
    }
  })

  const { logs, stones } = useMemo(() => {
    const rnd = (i: number, salt: number) => {
      const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    const up = new THREE.Vector3(0, 1, 0)
    // Low crossed layers leave room for flames above the wood instead
    // of hiding them inside a tall cone of poles.
    const logs = Array.from({ length: 6 }, (_, i) => {
      const layer = Math.floor(i / 2)
      const a = layer * 1.35 + 0.3 + (rnd(i, 1) - 0.5) * 0.25
      const offset = i % 2 === 0 ? -0.34 : 0.34
      const halfLength = 0.8 + rnd(i, 2) * 0.3
      const y = 0.15 + layer * 0.22
      const base = new THREE.Vector3(
        -Math.cos(a) * halfLength - Math.sin(a) * offset, y,
        -Math.sin(a) * halfLength + Math.cos(a) * offset
      )
      const tip = new THREE.Vector3(
        Math.cos(a) * halfLength - Math.sin(a) * offset, y + (rnd(i, 4) - 0.5) * 0.12,
        Math.sin(a) * halfLength + Math.cos(a) * offset
      )
      const dir = tip.clone().sub(base)
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize())
      return {
        pos: base.clone().add(tip).multiplyScalar(0.5),
        quat,
        len: dir.length(),
        r1: 0.1 + rnd(i, 6) * 0.04,
        r2: 0.14 + rnd(i, 7) * 0.05,
        tone: 0.75 + rnd(i, 8) * 0.5,
        twist: rnd(i, 9) * Math.PI,
      }
    })
    // one log that never made it onto the pile
    logs.push({
      pos: new THREE.Vector3(-1.9, 0.09, 1.4),
      quat: new THREE.Quaternion().setFromUnitVectors(up, new THREE.Vector3(0.96, 0.05, 0.28).normalize()),
      len: 1.7,
      r1: 0.12,
      r2: 0.16,
      tone: 0.9,
      twist: 1.2,
    })
    const stones = Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2 + 0.15 + (rnd(i, 10) - 0.5) * 0.4
      const r = 1.75 + rnd(i, 11) * 0.4
      return {
        pos: new THREE.Vector3(Math.cos(a) * r, 0.1 + rnd(i, 12) * 0.05, Math.sin(a) * r),
        scale: 0.13 + rnd(i, 13) * 0.11,
        rot: i * 1.3,
        squash: 0.7 + rnd(i, 14) * 0.5,
        tone: 0.8 + rnd(i, 15) * 0.45,
      }
    })
    return { logs, stones }
  }, [])

  return (
    <group
      position={portrait ? [-2.3 * spread, 0, 3.5] : [-7, 0, 5.5]}
      scale={portrait ? 1.1 : 1}
      {...handlers}
      onClick={(e) => {
        e.stopPropagation()
        onEnter(def.href, def.external)
      }}
    >
      <PortalLabel def={def} onEnter={onEnter} hovered={hovered} position={portrait ? [1.6, 1, 0] : [0, -0.8, 0]} />
      {!portrait && (
        <Suspense fallback={null}>
          <CampArtifacts />
        </Suspense>
      )}
      {/* Crossed logs lit by their own fire. */}
      {logs.map((l, i) => (
        <mesh key={i} position={l.pos} quaternion={l.quat} rotation-order="YXZ" castShadow receiveShadow>
          <cylinderGeometry args={[l.r1, l.r2, l.len, 12]} />
          <meshStandardMaterial
            map={wood}
            color={new THREE.Color('#8a7f70').multiplyScalar(l.tone)}
            roughness={0.95}
          />
        </mesh>
      ))}
      {/* stone ring, kicked slightly out of true */}
      {rocks.length > 0 && stones.map((s, i) => (
        <mesh
          key={i}
          geometry={rocks[i % rocks.length].geometry}
          material={rocks[i % rocks.length].material}
          position={[s.pos.x, 0, s.pos.z]}
          rotation-y={s.rot}
          scale={[s.scale * 1.8, s.scale * 1.4 * s.squash, s.scale * 1.6]}
        />
      ))}
      {/* embers glowing low in the pit */}
      <mesh ref={core} position={[0, 0.1, 0]} scale={[1.2, 0.35, 1.2]}>
        <sphereGeometry args={[0.32, 24, 16]} />
        <meshBasicMaterial color={new THREE.Color('#ff7b2d').multiplyScalar(2.8)} toneMapped={false} />
      </mesh>
      {/* the flames themselves */}
      <Flame hovered={hovered} reducedMotion={reducedMotion} />
      <LightPool position={[0, 0.025, 0]} scale={6} color="#ff9d4d" opacity={0.05} />
      <Embers hovered={hovered} reducedMotion={reducedMotion} />
      {/* tight hit volume so it can't shadow the garden behind it —
          only grows once already hovered, so the garden stays reachable */}
      <mesh position={[0, 1, 0]} scale={hovered ? 1.5 : 1} visible={false}>
        <sphereGeometry args={[2.2, 8, 8]} />
      </mesh>
      <pointLight ref={light} position={[0, 0.9, 0]} color="#ff9d4d" intensity={60} distance={16} decay={2} />
    </group>
  )
}

function Embers({ hovered, reducedMotion }: { hovered: boolean; reducedMotion: boolean }) {
  const inst = useRef<THREE.InstancedMesh>(null)
  const N = 3
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const phases = useMemo(() => Array.from({ length: N }, (_, i) => {
    const s = Math.sin(i * 91.7 + 47.3) * 43758.5453
    return s - Math.floor(s)
  }), [])
  useFrame(({ clock }) => {
    const mesh = inst.current
    if (!mesh) return
    const t = reducedMotion ? 0 : clock.elapsedTime
    for (let i = 0; i < N; i++) {
      const cycle = (t * (0.38 + phases[i] * 0.3) + phases[i]) % 1
      dummy.position.set(
        Math.sin(i * 5.1 + cycle * 6) * 0.6 + Math.sin(t * 0.8 + i * 7) * 0.25,
        1.0 + cycle * 2.4,
        Math.cos(i * 3.7 + cycle * 5) * 0.5
      )
      dummy.scale.setScalar(0.035 * (1 - cycle) + 0.012)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={inst} args={[undefined, undefined, N]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={new THREE.Color('#ffc490').multiplyScalar(hovered ? 4 : 3)} toneMapped={false} />
    </instancedMesh>
  )
}

/* Pink Triangle on the far ridge — the skyline */
function PinkTriangle({ def, onEnter, onLabel }: { def: PortalDef; onEnter: NightFieldProps['onEnter']; onLabel?: HoverLabel }) {
  const [hovered, handlers] = usePortalHover(def, onLabel)
  const portrait = usePortraitLayout()
  const spread = useCompactSpread()
  const lineMat = useRef<{ color: THREE.Color } | null>(null)
  const fillMat = useRef<THREE.MeshBasicMaterial>(null)
  const h = useEased01(hovered)
  useFrame(() => {
    if (lineMat.current) lineMat.current.color.set('#ff5fa2').multiplyScalar(1.7 + h.current * 0.7)
    if (fillMat.current) fillMat.current.opacity = 0.09 + h.current * 0.05
  })
  const tri: [number, number, number][] = [
    [-3.4, 4.6, 0],
    [3.4, 4.6, 0],
    [0, 0, 0],
    [-3.4, 4.6, 0],
  ]
  const fill = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-3.4, 4.6)
    s.lineTo(3.4, 4.6)
    s.lineTo(0, 0)
    s.closePath()
    return s
  }, [])
  return (
    <group
      position={portrait ? [18 * spread, 0, -110] : [25, 0, -145]}
      scale={portrait ? 1.35 : 1.7}
      {...handlers}
      onClick={(e) => {
        e.stopPropagation()
        onEnter(def.href, def.external)
      }}
    >
      <PortalLabel def={def} onEnter={onEnter} hovered={hovered} position={[0, 4.6, 0]} />
      <LightPool position={[0, 0.03, 0]} scale={8} color="#ff5fa2" opacity={0.035} />
      <Line
        ref={(el: unknown) => {
          const line = el as { material?: { color: THREE.Color } } | null
          if (line?.material) lineMat.current = line.material
        }}
        points={tri}
        color={new THREE.Color('#ff5fa2').multiplyScalar(1.7)}
        lineWidth={1.5}
        toneMapped={false}
      />
      {/* faint pink wash inside the outline */}
      <mesh position={[0, 0, -0.05]}>
        <shapeGeometry args={[fill]} />
        <meshBasicMaterial ref={fillMat} color="#ff5fa2" transparent opacity={0.09} toneMapped={false} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 2.2, 0]} scale={hovered ? 1.5 : 1} visible={false}>
        <boxGeometry args={[8, 6, 3]} />
      </mesh>
    </group>
  )
}

/* The playa itself — real terrain (Blender): near-flat where you stand,
   swelling into dust drifts and berms toward the edges, flat pads under
   every structure. FLORA cracked-mud tiles across it, revealed by the
   pooled light. */
function Ground() {
  const configured = useOptionalTexture('/textures/playa-tile.webp', configureTiledTexture)
  const terrain = useGLBGeometry('/models/terrain.glb')
  if (!terrain) return null
  return (
    <mesh geometry={terrain} receiveShadow>
      <meshStandardMaterial
        map={configured}
        bumpMap={configured}
        bumpScale={0.75}
        color="#8e9194"
        roughness={0.96}
        metalness={0}
      />
    </mesh>
  )
}

/* One subdued panorama keeps the landscape's atmosphere without stacking
   photographs with competing horizons and star fields. */
function NightSky({ reflections = true }: { reflections?: boolean }) {
  const texture = useTexture('/textures/marble-pano.webp', tex => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
  })
  const environment = useMemo(() => {
    const map = texture.clone()
    map.mapping = THREE.EquirectangularReflectionMapping
    return map
  }, [texture])
  useEffect(() => () => environment.dispose(), [environment])
  const uniforms = useMemo(() => ({
    panorama: { value: texture },
    horizon: { value: new THREE.Color('#0e1113') },
    tint: { value: new THREE.Color('#596779') },
  }), [texture])
  return (
    <>
    {reflections && <Environment map={environment} environmentIntensity={0.4} />}
    <mesh position={[0, -4, 0]} rotation-y={2.2} renderOrder={-1}>
      <sphereGeometry args={[430, 64, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`varying vec2 vUv; varying float elevation;
          void main() { vUv = uv; elevation = normalize(position).y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`uniform sampler2D panorama; uniform vec3 horizon; uniform vec3 tint;
          varying vec2 vUv; varying float elevation;
          float starHash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }
          void main() {
            vec3 landscape = texture2D(panorama, vUv).rgb;
            vec3 sky = landscape * tint;
            // The panorama's dark ridge is the occlusion mask. Keep stars
            // on this same sphere so camera motion cannot slide them over it.
            float skyMask = smoothstep(0.018, 0.04, dot(landscape, vec3(0.2126, 0.7152, 0.0722)))
              * smoothstep(0.505, 0.52, vUv.y);
            vec2 grid = vUv * vec2(900.0, 450.0);
            vec2 cell = floor(grid);
            float seed = starHash(cell);
            vec2 center = vec2(starHash(cell + 17.3), starHash(cell + 41.8)) * 0.7 + 0.15;
            float distanceToStar = length(fract(grid) - center);
            float radius = mix(0.055, 0.12, starHash(cell + 8.2));
            float aa = fwidth(distanceToStar);
            float star = (1.0 - smoothstep(radius - aa, radius + aa, distanceToStar))
              * step(0.986, seed) * skyMask;
            sky += vec3(0.82, 0.88, 1.0) * star * mix(0.65, 1.6, starHash(cell + 3.4));
            gl_FragColor = vec4(mix(horizon, sky, smoothstep(-0.015, 0.15, elevation)), 1.0);
            #include <colorspace_fragment>
          }`}
        side={THREE.BackSide} toneMapped={false} depthWrite={false}
      />
    </mesh>
    </>
  )
}

/* A shooting star every so often: one bright streak, in and gone */
function Meteors({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  const st = useRef({ next: 18, active: false, t0: 0, from: new THREE.Vector3(), dir: new THREE.Vector3(), rot: 0 })
  useFrame(({ clock }) => {
    const m = ref.current
    if (!m || reducedMotion) return
    const s = st.current
    const t = clock.elapsedTime
    if (!s.active && t > s.next) {
      s.active = true
      s.t0 = t
      const x = -90 + Math.random() * 180
      const y = 55 + Math.random() * 35
      s.from.set(x, y, -175)
      s.dir.set(0.5 + Math.random() * 0.5, -(0.25 + Math.random() * 0.2), 0).normalize()
      if (Math.random() > 0.5) s.dir.x *= -1
      s.rot = Math.atan2(s.dir.y, s.dir.x)
    }
    if (s.active) {
      const p = (t - s.t0) / 0.8
      if (p >= 1) {
        s.active = false
        s.next = t + 18 + Math.random() * 22
        m.visible = false
      } else {
        m.visible = true
        m.position.copy(s.from).addScaledVector(s.dir, p * 46)
        m.rotation.z = s.rot
        ;(m.material as THREE.MeshBasicMaterial).opacity = Math.sin(p * Math.PI) * 0.85
      }
    }
  })
  return (
    <mesh ref={ref} visible={false}>
      <planeGeometry args={[8, 0.07]} />
      <meshBasicMaterial
        color={new THREE.Color('#cfe0ff').multiplyScalar(3)}
        transparent
        opacity={0}
        toneMapped={false}
        fog={false}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/* A low, cool pool follows the viewer across the playa. It is deliberately
   weaker than every artwork's own light: the field is discovered, never
   floodlit. */
function SurveyLight({ reducedMotion }: { reducedMotion: boolean }) {
  const hoverQuery = useHoverQuery()
  const group = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const target = useRef(new THREE.Vector3(0, 0.04, -12))

  useFrame(({ camera, clock, pointer, raycaster }, delta) => {
    if (!reducedMotion && hoverQuery.matches) {
      raycaster.setFromCamera(pointer, camera)
      const intersection = raycaster.ray.intersectPlane(plane, hit)
      if (intersection) {
        target.current.set(
          THREE.MathUtils.clamp(intersection.x, -42, 42),
          0.04,
          THREE.MathUtils.clamp(intersection.z, -72, 13)
        )
      }
    }

    const k = 1 - Math.exp(-3.2 * delta)
    group.current?.position.lerp(target.current, k)
    if (light.current) {
      light.current.intensity = reducedMotion
        ? 4
        : 5.5 + Math.sin(clock.elapsedTime * 0.43) * 0.35
    }
  })

  return (
    <group ref={group} position={[0, 0.04, -12]}>
      <pointLight
        ref={light}
        position={[0, 4.5, 0]}
        color="#9fb6d1"
        intensity={4}
        distance={18}
        decay={2}
      />
    </group>
  )
}

function Rig({ ready, onSettled }: { ready: boolean; onSettled: () => void }) {
  const settled = useRef(false)
  useFrame(({ camera, size }) => {
    const aspect = size.width / size.height
    const portrait = aspect < COMPACT_ASPECT
    const baseZ = portrait ? 26 : 22 + Math.max(0, 1.8 - aspect) * 14
    const baseY = portrait ? 14 : 7
    const gazeY = portrait ? 1 : 2
    const fittedFov = Math.max(
      portrait ? 54 : 48,
      THREE.MathUtils.radToDeg(2 * Math.atan((portrait ? 0.25 : 0.68) / aspect))
    )
    camera.position.set(0, baseY, baseZ)
    camera.lookAt(0, gazeY, -30)
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== fittedFov) {
      camera.fov = fittedFov
      camera.updateProjectionMatrix()
    }
    if (ready && !settled.current) {
      settled.current = true
      onSettled()
    }
  })
  return null
}

/* Portals and terrain preload; garnish (suzanne, teapot, bike — ~2.5MB)
   deliberately does not. Those stream in behind nested Suspense after
   the field's first frame instead of gating it. */
preloadOptionalGLTF('/models/them.glb')
preloadOptionalGLTF('/models/terrain.glb')
preloadOptionalGLTF('/models/rocks.glb')
preloadOptionalGLTF('/models/telescope.glb?v=2')
preloadOptionalGLTF('/models/signpost-hd.glb')
useTexture.preload('/textures/playa-tile.webp')
useTexture.preload('/textures/steel-tile.webp')
useTexture.preload('/textures/wood-tile.webp')
useTexture.preload('/textures/marble-pano.webp')

const PORTALS: Record<string, PortalDef> = {
  art: { id: 'art', label: 'Art', sub: 'Light installations', href: '/art' },
  work: { id: 'work', label: 'Work', sub: 'A decade of AI in production', href: '/work' },
  thinking: { id: 'thinking', label: 'Thinking', sub: 'Trade-offs, not clean answers', href: '/thinking' },
  contact: { id: 'contact', label: "Let's talk", sub: 'hey@n3wth.com', href: '/contact' },
  triangle: { id: 'triangle', label: 'Pink Triangle', sub: 'View this artwork', href: '/art#pink-triangle' },
}

function SceneReady({ onReady }: { onReady: () => void }) {
  const sent = useRef(false)
  useFrame(() => {
    if (sent.current) return
    sent.current = true
    onReady()
  })
  return null
}

// Demand rendering avoids running the entire scene at the monitor's refresh
// rate. Keep the last frame while the canvas is offscreen or the tab is hidden.
function SceneCadence({ reducedMotion }: { reducedMotion: boolean }) {
  const gl = useThree(state => state.gl)
  const invalidate = useThree(state => state.invalidate)
  useEffect(() => {
    if (reducedMotion) return
    let intersecting = false
    let timer: ReturnType<typeof setInterval> | undefined
    const update = () => {
      clearInterval(timer)
      timer = undefined
      if (!intersecting || document.hidden) return
      invalidate()
      timer = setInterval(invalidate, 1000 / 30)
    }
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting
      update()
    })
    observer.observe(gl.domElement)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearInterval(timer)
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [gl, invalidate, reducedMotion])
  return null
}

function WorldInterface({ ready }: { ready: boolean }) {
  return (
    <>
      <div className="night-field-loader" data-ready={ready ? 'true' : 'false'} aria-hidden={ready}>
        <img src="/images/hero-playa.webp" alt="" className="night-field-loader-image" />
        <div className="night-field-loader-tint" />
        <span className="sr-only" role="status">Loading scene</span>
      </div>

    </>
  )
}

export default function NightField({ onEnter, reducedMotion, softwareRendering = false }: NightFieldProps) {
  const hoverQuery = useHoverQuery()
  const [labelsReady, setLabelsReady] = useState(false)
  const [ready, setReady] = useState(false)
  const navigationTimer = useRef<number | null>(null)
  const pendingHref = useRef<string | null>(null)

  useEffect(() => () => {
    if (navigationTimer.current !== null) window.clearTimeout(navigationTimer.current)
  }, [])

  const focusThenEnter = useCallback<NightFieldProps['onEnter']>((href, external) => {
    if (!hoverQuery.matches || reducedMotion) {
      onEnter(href, external)
      return
    }
    if (navigationTimer.current !== null) {
      window.clearTimeout(navigationTimer.current)
      // An impatient repeat click on the same portal commits immediately —
      // re-arming the timer would postpone navigation on every click,
      // reading as "the click didn't work".
      if (pendingHref.current === href) {
        navigationTimer.current = null
        pendingHref.current = null
        onEnter(href, external)
        return
      }
    }
    pendingHref.current = href
    navigationTimer.current = window.setTimeout(() => {
      navigationTimer.current = null
      pendingHref.current = null
      onEnter(href, external)
    }, 200)
  }, [onEnter, reducedMotion, hoverQuery])

  return (
    <>
    <Canvas
      shadows={!softwareRendering}
      className={labelsReady ? 'night-field-stage is-settled' : 'night-field-stage'}
      dpr={softwareRendering ? 1 : [1, 1.5]}
      camera={{ position: [0, 3.2, 22], fov: 48 }}
      gl={{ antialias: !softwareRendering, powerPreference: 'high-performance' }}
      frameloop="demand"
      style={{ position: 'absolute', inset: 0 }}
    >
      <SceneCadence reducedMotion={reducedMotion} />
      <color attach="background" args={['#0e1113']} />
      <fog attach="fog" args={['#0e1113', 30, 145]} />
      <ambientLight intensity={0.1} />
      <hemisphereLight args={['#161c28', '#0a0908']} intensity={0.3} />
      {/* one consistent moon: cool, high, from the Milky Way side — it
          shades the terrain undulation so the ground reads as ground */}
      <directionalLight position={[40, 60, -25]} color="#a8b8d0" intensity={0.42}
        castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-90} shadow-camera-right={90}
        shadow-camera-top={90} shadow-camera-bottom={-90} shadow-camera-far={220}
        shadow-normalBias={0.035} shadow-bias={-0.0001} />
      {/* the far glow behind the ridge, barely */}
      <directionalLight position={[-6, 18, -120]} color="#8a7a68" intensity={0.14} />

      {/* flat base under the terrain so nothing shows through while the
          terrain mesh suspends in */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.55, -40]} receiveShadow>
        <planeGeometry args={[600, 400]} />
        <meshStandardMaterial color="#14161a" roughness={0.95} metalness={0} />
      </mesh>

      {/* The sky and terrain reveal first. Landmarks suspend separately,
          so a slow model never holds the entire field behind black. */}
      <Suspense fallback={null}>
        <Ground />
        <NightSky reflections={!softwareRendering} />
        <SceneReady onReady={() => setReady(true)} />
      </Suspense>
      <Suspense fallback={null}>
        <Them def={PORTALS.art} onEnter={focusThenEnter} reducedMotion={reducedMotion} />
      </Suspense>
      <Suspense fallback={null}>
        <Constellation def={PORTALS.work} onEnter={focusThenEnter} reducedMotion={reducedMotion} />
      </Suspense>
      <Suspense fallback={null}>
        <Fork def={PORTALS.thinking} onEnter={focusThenEnter} />
      </Suspense>
      <Suspense fallback={null}>
        <Beacon def={PORTALS.contact} onEnter={focusThenEnter} reducedMotion={reducedMotion} />
      </Suspense>
      <Suspense fallback={null}>
        <PinkTriangle def={PORTALS.triangle} onEnter={focusThenEnter} />
      </Suspense>
      {ready && <Suspense fallback={null}>
        <WritingGroves onEnter={onEnter} reducedMotion={reducedMotion} />
      </Suspense>}

      <Meteors reducedMotion={reducedMotion} />
      <SurveyLight reducedMotion={reducedMotion} />
      <Rig ready={ready} onSettled={() => setLabelsReady(true)} />

      {!softwareRendering && <EffectComposer multisampling={4}>
        <Bloom intensity={0.35} luminanceThreshold={1.4} mipmapBlur radius={0.5} />
        <SMAA />
      </EffectComposer>}
    </Canvas>
    <WorldInterface ready={ready} />
    </>
  )
}
