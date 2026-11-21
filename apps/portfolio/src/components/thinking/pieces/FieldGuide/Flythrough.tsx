import { lazy, Suspense, useRef, useState } from 'react'
import { gsap, useGSAP } from '../../../../lib/scroll'
import type { CamState } from './FlythroughCanvas'
import { useNear } from './viewport'

const FlythroughCanvas = lazy(() => import('./FlythroughCanvas'))

/**
 * Set piece three, and the piece's signature: a camera flythrough of a
 * quiet corner of the night field — signpost, the THEM pack, the dish —
 * that annotates its own machinery while it runs. The corner readouts
 * are the real ScrollTrigger state (label, progress), written straight
 * to the DOM from onUpdate. The camera is a plain mutated object; a
 * useFrame callback copies it onto the real camera every frame, so the
 * scroll path never touches React state.
 */

const CAM_START: CamState = { x: 6, y: 24, z: 30, tx: -12, ty: 0, tz: -10 }
const CAM_PACK_VIEW: CamState = { x: -8, y: 2.8, z: 1, tx: -16, ty: 1.1, tz: -10 }

const CAPTIONS = [
  {
    label: 'descend',
    text:
      'This scene is one GSAP timeline with four labels. Your scroll is the playhead, scrub: 1 gives it a second of catch-up, and the section stays pinned until the timeline runs out. The one free agent is a breath of camera sway; a perfectly rigid camera reads as a screen recording.',
  },
  {
    label: 'signpost',
    text:
      'Every camera move is a tween on a plain object with ease: "none", copied onto the real camera in a useFrame callback. A scrubbed tween maps scroll distance to motion; any other ease would warp that map.',
  },
  {
    label: 'pack',
    text:
      'The pack is holding still. On the homepage these three amble on their own clock; that is the movie. A flythrough running two clocks at once reads as broken, so each scene picks one and commits.',
  },
  {
    label: 'dish',
    text:
      'The corner readouts are the trigger’s actual state, written to the DOM from onUpdate. No React state anywhere on the scroll path; one re-render per scroll tick is how pages like this start to stutter.',
  },
]

export function Flythrough({ reduced }: { reduced: boolean }) {
  const rootRef = useRef<HTMLElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const [wrapRef, near, visible] = useNear<HTMLDivElement>('900px')
  // Mutable camera carrier: GSAP tweens it, the Rig copies it onto the
  // real camera each frame. useState for a stable identity without ref
  // reads during render.
  const [cam] = useState<CamState>(() => ({ ...CAM_START }))

  useGSAP(
    () => {
      if (reduced) return
      const root = rootRef.current
      if (!root) return
      const captions = gsap.utils.toArray<HTMLElement>('[data-fly-caption]', root)

      const mm = gsap.matchMedia()
      mm.add(
        { desktop: '(min-width: 768px)', mobile: '(max-width: 767px)' },
        (ctx) => {
          const { mobile } = ctx.conditions as { mobile: boolean }

          gsap.set(captions, { autoAlpha: 0 })
          gsap.set(captions[0], { autoAlpha: 1 })

          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            // The label readout follows the timeline playhead — the
            // trigger's onUpdate goes quiet while the scrub catches up,
            // which left the HUD a label behind.
            onUpdate: () => {
              const label = (tl.currentLabel() as string | null) ?? 'descend'
              if (labelRef.current && labelRef.current.textContent !== label) {
                labelRef.current.textContent = label
              }
            },
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: () => '+=' + Math.round(window.innerHeight * (mobile ? 2.6 : 4.2)),
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              fastScrollEnd: true,
              onUpdate: (self) => {
                if (progressRef.current) progressRef.current.textContent = self.progress.toFixed(2)
              },
            },
          })

          const c = cam
          tl.addLabel('descend', 0)
          tl.to(c, { x: 5, y: 2.6, z: 10, tx: 0, ty: 1.3, tz: 0, duration: 1 }, 0)
          tl.addLabel('signpost', 1)
          tl.to(c, { x: -7, y: 3.4, z: 3.5, tx: -16.5, ty: 1.2, tz: -10.5, duration: 0.9 }, 1.15)
          tl.addLabel('pack', 2.05)
          tl.to(c, { x: -22.5, y: 2.8, z: -2.5, tx: -33, ty: 3, tz: -17.5, duration: 0.95 }, 2.35)
          tl.addLabel('dish', 3.3)
          tl.to(c, { y: 5.5, ty: 4, duration: 0.7 }, 3.3)

          CAPTIONS.forEach((cap, i) => {
            if (i === 0) return
            const at = tl.labels[cap.label]
            tl.to(captions[i - 1], { autoAlpha: 0, y: -10, duration: 0.16 }, at - 0.2)
            tl.fromTo(captions[i], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.2 }, at)
          })
        }
      )
      return () => mm.revert()
    },
    { scope: rootRef, dependencies: [reduced], revertOnUpdate: true }
  )

  // Reduced motion gets a fixed pose (the pack view) instead of the rig.
  const pose = reduced ? CAM_PACK_VIEW : cam
  const canvas = near && (
    <Suspense fallback={null}><FlythroughCanvas pose={pose} reduced={reduced} visible={visible} /></Suspense>
  )

  if (reduced) {
    return (
      <section aria-label="A corner of the night field, annotated" className="bleed py-10">
        <div style={{ paddingInline: 'var(--gutter)' }}>
          <div
            ref={wrapRef}
            className="mx-auto aspect-[16/9] w-full max-w-5xl"
            role="img"
            aria-label="A still corner of the homepage night field: signpost, the THEM pack, and the dish under pooled light"
          >
            {canvas}
          </div>
          <div className="mx-auto mt-8 flex max-w-[62ch] flex-col gap-6">
            {CAPTIONS.map((cap) => (
              <div key={cap.label}>
                <p className="mono">{cap.label}</p>
                <p className="mt-2 text-base leading-relaxed" style={{ color: 'var(--ink)' }}>
                  {cap.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section ref={rootRef} aria-label="A corner of the night field, annotated" className="bleed relative h-svh">
      {/* Complete caption list for assistive tech: the animated stack
          keeps every caption except the active one at visibility:hidden. */}
      <ol className="sr-only">
        {CAPTIONS.map((cap) => (
          <li key={cap.label}>
            {cap.label}. {cap.text}
          </li>
        ))}
      </ol>
      <div
        ref={wrapRef}
        className="absolute inset-0"
        role="img"
        aria-label="A slow camera pass over a corner of the homepage night field: signpost, the THEM pack, and the dish under pooled light"
      >
        {canvas}
      </div>

      {/* live machinery readouts: real trigger state, not decoration */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-6 flex justify-between" style={{ paddingInline: 'var(--gutter)' }}>
        <span className="mono">
          label · <span ref={labelRef}>descend</span>
        </span>
        <span className="mono">
          progress <span ref={progressRef}>0.00</span>
        </span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-6" style={{ paddingInline: 'var(--gutter)' }}>
        <div aria-hidden className="relative min-h-[7.5rem] max-w-[52ch] md:min-h-[6.5rem]">
          {CAPTIONS.map((cap) => (
            <p
              key={cap.label}
              data-fly-caption
              className="absolute inset-x-0 top-0 text-sm leading-relaxed md:text-base"
              style={{ color: 'var(--ink)' }}
            >
              {cap.text}
            </p>
          ))}
        </div>
        <p aria-hidden className="mono mt-4">pin active · scrub 1 · four labels · ease none</p>
      </div>
    </section>
  )
}
