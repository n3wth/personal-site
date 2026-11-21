import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Shared plumbing for the field-guide piece. The GLB helpers mirror the
 * homepage's (src/components/NightField.tsx) but always work on a clone,
 * so mutating materials here can never leak into the cached scene the
 * night field renders from.
 */

/** Rodin/Blender GLBs ship exotic material state (spec-gloss extension,
    metalness 1) that renders black under plain point lights — the first
    bug the night field ever hit. Rebuild every material the way the
    homepage does. Returns the materials it created so callers can
    dispose them on unmount (r3f never disposes <primitive> content, and
    the geometries stay shared with the useGLTF cache — only what we
    created here is ours to free). */
export function rebuildMaterials(root: THREE.Object3D, tint = '#ffffff'): THREE.Material[] {
  const created: THREE.Material[] = []
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    const old = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial
    m.material = new THREE.MeshStandardMaterial({
      map: old.map ?? null,
      color: old.map ? new THREE.Color(tint) : (old.color ?? new THREE.Color(0x888888)),
      roughness: 0.7,
      metalness: 0.15,
      side: THREE.DoubleSide,
    })
    created.push(m.material)
    m.frustumCulled = false
  })
  return created
}

/** Clone a GLB scene, center it on the origin, and scale its longest
    axis to `fit` world units — same normalization as the night-field
    piece's LiveMaterialDemo, so any asset reads at a comfortable size. */
export function useNormalizedClone(url: string, fit = 1.8, tint?: string) {
  const { scene } = useGLTF(url)
  const built = useMemo(() => {
    const clone = scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const scale = fit / Math.max(size.x, size.y, size.z, 0.001)
    clone.children.forEach((c) => c.position.sub(center))
    clone.scale.setScalar(scale)
    const created = tint !== undefined ? rebuildMaterials(clone, tint) : []
    return { clone, created }
  }, [scene, fit, tint])

  // Free only the materials this hook created; the geometries (and any
  // original materials) belong to the shared useGLTF cache.
  useEffect(() => {
    const { created } = built
    return () => created.forEach((m) => m.dispose())
  }, [built])

  return built.clone
}

/** Count real triangles in a loaded object — the pipeline scene shows
    this number live instead of quoting folklore poly budgets. */
export function countTriangles(root: THREE.Object3D): number {
  let tris = 0
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh && m.geometry) {
      const g = m.geometry
      tris += (g.index ? g.index.count : g.getAttribute('position').count) / 3
    }
  })
  return Math.round(tris)
}

export function configureTiledTexture(tex: THREE.Texture, repeat = 1) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat, repeat)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
}

/** Additive radial gradient — the pool of light every homepage structure
    stands in. Module-level singleton, built on first use. */
export const poolTexture = (() => {
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

/** Smoothstep ramp: 0 before `a`, 1 after `b`. The pipeline and
    flythrough scenes derive every crossfade weight from scroll progress
    through these. */
export function ramp(p: number, a: number, b: number): number {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
