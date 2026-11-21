import { lazy, Suspense, useRef, useState } from 'react'
import { gsap, useGSAP } from '../../../../lib/scroll'
import type { Progress } from './BikeCanvas'
import { useNear } from './viewport'

const BikeCanvas = lazy(() => import('./BikeCanvas'))

/**
 * Set piece two: the Blender-to-browser pipeline, performed by the
 * homepage's own bike (/models/bike.glb — the dusty cruiser leaned by
 * the campfire). One pinned scroll carries it through four states:
 * edges, clay, textured, night-lit. All three body variants are clones
 * of one normalized scene inside one spinning group; scroll drives a
 * plain progress object and useFrame turns that into crossfade weights,
 * so nothing on the scroll path touches React state.
 */

const STAGES = [
  {
    name: 'geometry',
    text:
      'Blender first. Lay the scene out at real scale and apply every transform before export. The night field skipped that once; the parked models orbited a ghost point in empty space until location was zeroed.',
  },
  {
    name: 'export',
    text:
      'Export a GLB. Lights and modifiers stay behind, and materials barely make the trip; what survives is geometry, UVs, and whatever the Principled BSDF could describe.',
  },
  {
    name: 'materials',
    text:
      'Rebuild materials at load. Generated meshes ship exotic state; Rodin sets metalness to 1, which renders pure black under point lights. The homepage fix is two floats: metalness 0.15, roughness 0.7.',
  },
  {
    name: 'light',
    text:
      'Then light it like a place, not a product shot. Point lights, a pool on the ground, no HDRI. Somebody’s dusty cruiser, leaned where they left it.',
  },
]

const BIKE_BYTES = 1_216_456 // real size of /public/models/bike.glb on disk

// The reduced-motion pose: textured, lit, no pin. A fixed object (never
// tweened) so a mid-session reduced-motion flip can't strand the bike
// half-crossfaded at whatever the live progress happened to be.
const REDUCED_POSE: Progress = { p: 0.72 }

export function PipelineScene({ reduced }: { reduced: boolean }) {
  const rootRef = useRef<HTMLElement>(null)
  const stageNameRef = useRef<HTMLSpanElement>(null)
  const [wrapRef, near, visible] = useNear<HTMLDivElement>()
  const [tris, setTris] = useState<number | null>(null)
  // Portrait viewports need the camera further back or the bike's
  // wheels crop out of frame. Read once at mount; a rotation mid-read
  // just gets a slightly looser or tighter crop.
  const [camZ] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 8.6 : 5.2
  )
  // Mutable scroll-progress carrier: GSAP writes it, useFrame reads it.
  // useState keeps the identity stable without ref reads during render.
  const [prog] = useState<Progress>(() => ({ p: 0 }))

  useGSAP(
    () => {
      if (reduced) return
      const root = rootRef.current
      if (!root) return
      const captions = gsap.utils.toArray<HTMLElement>('[data-stage-caption]', root)
      const clip = root.querySelector<HTMLElement>('[data-stage-clip]')

      const mm = gsap.matchMedia()
      mm.add(
        { desktop: '(min-width: 768px)', mobile: '(max-width: 767px)' },
        (ctx) => {
          const { mobile } = ctx.conditions as { mobile: boolean }

          gsap.set(captions, { autoAlpha: 0 })
          gsap.set(captions[0], { autoAlpha: 1 })

          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            // Read the stage from the timeline, not the trigger — the
            // scrub playhead keeps moving after the last scroll event.
            onUpdate: () => {
              const label = (tl.currentLabel() as string | null) ?? 'geometry'
              if (stageNameRef.current && stageNameRef.current.textContent !== label) {
                stageNameRef.current.textContent = label
              }
            },
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: () => '+=' + Math.round(window.innerHeight * (mobile ? 2.4 : 3.2)),
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              fastScrollEnd: true,
            },
          })

          // fromTo, not to: after a reduced-motion round trip prog may
          // hold a stale value, and the scrub must map from 0.
          tl.fromTo(prog, { p: 0 }, { p: 1, duration: 1 }, 0)

          // The stage opens as the wireframe forms: a framed column of
          // scene widening to the full viewport over the first beat.
          // clip-path interpolates on the compositor; no layout runs.
          if (clip) {
            tl.fromTo(
              clip,
              { clipPath: mobile ? 'inset(4% 7% round 14px)' : 'inset(7% 16% round 18px)' },
              { clipPath: 'inset(0% 0% round 0px)', duration: 0.16 },
              0
            )
          }
          const marks = [0, 0.25, 0.5, 0.8]
          STAGES.forEach((s, i) => {
            tl.addLabel(s.name, marks[i])
            if (i > 0) {
              tl.to(captions[i - 1], { autoAlpha: 0, y: -10, duration: 0.04 }, marks[i] - 0.05)
              tl.fromTo(captions[i], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.05 }, marks[i])
            }
          })
        }
      )
      return () => mm.revert()
    },
    { scope: rootRef, dependencies: [reduced], revertOnUpdate: true }
  )

  const statsLine = tris
    ? `${tris.toLocaleString('en-US')} triangles · ${BIKE_BYTES.toLocaleString('en-US')} bytes · /models/bike.glb`
    : '/models/bike.glb'

  if (reduced) {
    return (
      <section aria-label="The pipeline, on the homepage bike" className="py-10">
        <div ref={wrapRef} className="mx-auto aspect-[4/3] w-full max-w-2xl" role="img" aria-label="The homepage bike model, textured and lit">
          {near && (
            <Suspense fallback={null}><BikeCanvas camZ={camZ} visible={visible} prog={REDUCED_POSE} reduced onStats={setTris} /></Suspense>
          )}
        </div>
        <p className="mono mt-3">{statsLine}</p>
        <ol className="mt-8 flex max-w-[62ch] flex-col gap-6">
          {STAGES.map((s, i) => (
            <li key={s.name}>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
                {String(i + 1).padStart(2, '0')} — {s.name}
              </p>
              <p className="mt-2 text-base leading-relaxed" style={{ color: 'var(--ink)' }}>
                {s.text}
              </p>
            </li>
          ))}
        </ol>
      </section>
    )
  }

  return (
    <section ref={rootRef} aria-label="The pipeline, on the homepage bike" className="bleed relative h-svh">
      {/* Complete stage list for assistive tech: the animated captions
          below live at visibility:hidden except the active one, so AT
          gets this linear copy instead. */}
      <ol className="sr-only">
        {STAGES.map((s, i) => (
          <li key={s.name}>
            {String(i + 1).padStart(2, '0')}, {s.name}. {s.text}
          </li>
        ))}
      </ol>

      {/* data-stage-clip: the scrubbed timeline opens this window from a
          framed column to the full viewport as the wireframe forms. */}
      <div
        ref={wrapRef}
        data-stage-clip
        className="absolute inset-0"
        role="img"
        aria-label="The homepage bike model rebuilding itself from wireframe to textured and lit"
      >
        {near && (
          <Suspense fallback={null}><BikeCanvas camZ={camZ} visible={visible} prog={prog} reduced={false} onStats={setTris} /></Suspense>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-8" style={{ paddingInline: 'var(--gutter)' }}>
        <p aria-hidden className="text-right text-xs uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
          stage · <span ref={stageNameRef}>geometry</span>
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-8" style={{ paddingInline: 'var(--gutter)' }}>
        <div aria-hidden className="relative min-h-[7.5rem] max-w-[46ch] md:min-h-[6rem]">
          {STAGES.map((s) => (
            <p
              key={s.name}
              data-stage-caption
              className="absolute inset-x-0 top-0 text-sm leading-relaxed md:text-base"
              style={{ color: 'var(--ink)' }}
            >
              {s.text}
            </p>
          ))}
        </div>
        <p className="mono mt-4">{statsLine}</p>
      </div>
    </section>
  )
}
