import { useRef } from 'react'
import type { ReactNode } from 'react'
import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../../kit/Beat'
import { gsap, useGSAP, ScrollTrigger, SplitText } from '../../../../lib/scroll'
import { Cameo } from './Cameo'
import { ChapterRail } from './ChapterRail'
import { SpineScene } from './SpineScene'
import { PipelineScene } from './PipelineScene'
import { ToolboxDemo } from './ToolboxDemo'
import { Flythrough } from './Flythrough'
import { useReducedMotionFlag } from './support'

/**
 * A field guide to building a personal site that tells a story, taught
 * by the site it lives on. Three chapters, three pinned set pieces (the
 * story spine, the bike pipeline, the annotated flythrough), one
 * pointer-driven interactive, and plain flowing prose everywhere else —
 * the ratio is the argument. Scroll plumbing comes from lib/scroll.ts;
 * this is the first piece to reintroduce ScrollTrigger to the site, so
 * everything here doubles as the house style for the next one.
 */

const CHAPTERS = [
  { id: 'ch-story', numeral: 'I', title: 'Figure out the story' },
  { id: 'ch-world', numeral: 'II', title: 'Build the world' },
  { id: 'ch-scroll', numeral: 'III', title: 'Let scroll play it back' },
]

const SWATCHES = [
  { src: '/textures/steel-tile.webp', file: 'steel-tile.webp', home: 'sculpture skin' },
  { src: '/textures/wood-tile.webp', file: 'wood-tile.webp', home: 'campfire logs' },
  { src: '/textures/playa-tile.webp', file: 'playa-tile.webp', home: 'the ground' },
  { src: '/textures/horizon.webp', file: 'horizon.webp', home: 'the ridge line' },
  { src: '/textures/sky-pano.webp', file: 'sky-pano.webp', home: 'the sky itself' },
]

const MISTAKES = [
  'scrub and toggleActions on the same trigger. The trigger takes scrub and silently drops the rest; every trigger on this page picked one.',
  'A ScrollTrigger on a child tween inside a timeline. Triggers belong on the timeline itself; children just play when the playhead reaches them.',
  'A pixel end value with no invalidateOnRefresh. Rotate a phone once and every pin is measuring a viewport that no longer exists.',
  'Creating triggers out of page order. Refresh math runs in creation order, so lazily mounted scenes need refreshPriority, or a ScrollTrigger.sort() after mount, which is what this page does.',
  'Animating the pinned element itself. The pin owns that transform; fight it for control and the whole section flickers. Animate children.',
  'Treating reduced motion as a nice-to-have. Every scene above has a static form that keeps all of the content. The choreography is garnish.',
]

function Marker({
  numeral,
  title,
  dek,
  cameo,
}: {
  numeral: string
  title: string
  dek: string
  cameo?: ReactNode
}) {
  return (
    <div className="pt-14 md:pt-20">
      <div className="md:grid md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] md:items-center md:gap-12">
        <div>
          <span
            className="index inline-flex h-10 w-10 items-center justify-center rounded-full"
            style={{ border: '1px solid var(--rail-strong)', color: 'var(--ink-dim)' }}
            aria-hidden
          >
            {numeral}
          </span>
          {/* No here: the title animates by SplitText line
              mask on enter, and textWrap must not be `balance` while
              split (it fights the line measurement). */}
          <h2
            data-marker-title
            className="display mt-5 text-[clamp(2rem,4.4vw,3.4rem)]"
            style={{ letterSpacing: '-0.03em', lineHeight: 1.05, textWrap: 'initial' }}
          >
            {title}
          </h2>
          <p className="mt-3 max-w-[52ch] text-base md:text-lg" style={{ color: 'var(--ink-dim)' }}>
            {dek}
          </p>
        </div>
        {cameo}
      </div>
    </div>
  )
}

export default function FieldGuide() {
  const reduced = useReducedMotionFlag()
  const rootRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLParagraphElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || reduced) return

      // Opening line: masked line reveal, the one autonomous flourish that
      // plays on load. autoSplit re-splits when Suisse Intl finishes loading.
      let anim: gsap.core.Tween | undefined
      const split = SplitText.create(openerRef.current, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) => {
          anim = gsap.from(self.lines, {
            yPercent: 110,
            duration: 0.9,
            stagger: 0.09,
            ease: 'power4.out',
            delay: 0.15,
          })
          return anim
        },
      })

      // Chapter titles arrive the same way the opener does, one masked
      // line at a time, each on its own enter trigger.
      const titleSplits: SplitText[] = []
      gsap.utils.toArray<HTMLElement>('[data-marker-title]', root).forEach((h) => {
        titleSplits.push(
          SplitText.create(h, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 110,
                duration: 0.8,
                stagger: 0.08,
                ease: 'power4.out',
                scrollTrigger: { trigger: h, start: 'top 84%' },
              }),
          })
        )
      })

      // Photograph parallax: the images ride a little slower than the
      // page, scrubbed, transform-only.
      gsap.utils.toArray<HTMLElement>('[data-parallax]', root).forEach((fig) => {
        const img = fig.querySelector('img')
        if (!img) return
        gsap.fromTo(
          img,
          { yPercent: -7 },
          {
            yPercent: 7,
            ease: 'none',
            scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true },
          }
        )
      })

      // The prologue photograph opens from a framed column to the full
      // viewport as it approaches — the first hint the page can expand.
      const openFig = root.querySelector<HTMLElement>('[data-expand-clip]')
      if (openFig) {
        gsap.fromTo(
          openFig,
          { clipPath: 'inset(0% 13% round 16px)' },
          {
            clipPath: 'inset(0% 0% round 0px)',
            ease: 'none',
            scrollTrigger: { trigger: openFig, start: 'top 92%', end: 'top 30%', scrub: true },
          }
        )
      }

      // Each chapter lends the page a whisper of its own temperature:
      // violet-black for the story, ember-black for the build, a colder
      // star-black for the scroll chapter, then back to base. Scrubbed
      // crossfades on the body color, reverted with the context.
      const baseBg = getComputedStyle(document.body).backgroundColor
      const TINTS = [
        { sel: '#ch-story', color: '#0b0a10' },
        { sel: '#ch-world', color: '#0e0b08' },
        { sel: '#ch-scroll', color: '#080c11' },
      ]
      TINTS.forEach(({ sel, color }) => {
        const el = root.querySelector(sel)
        if (!el) return
        gsap.to(document.body, {
          backgroundColor: color,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 75%', end: 'top 25%', scrub: true },
        })
      })
      const colophon = root.querySelector('#colophon')
      if (colophon) {
        gsap.to(document.body, {
          backgroundColor: baseBg,
          ease: 'none',
          scrollTrigger: { trigger: colophon, start: 'top 90%', end: 'top 40%', scrub: true },
        })
      }

      // Texture swatches settle in once, staggered.
      const swatches = gsap.utils.toArray<HTMLElement>('[data-swatch]', root)
      if (swatches.length) {
        gsap.from(swatches, {
          y: 26,
          autoAlpha: 0,
          stagger: 0.08,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: swatches[0], start: 'top 88%' },
        })
      }

      // Child scenes register their pinned triggers before this parent
      // effect runs (React fires layout effects bottom-up), which is the
      // out-of-order case ScrollTrigger.sort() exists for.
      ScrollTrigger.sort()

      return () => {
        anim?.kill()
        split.revert()
        titleSplits.forEach((s) => s.revert())
      }
    },
    { scope: rootRef, dependencies: [reduced], revertOnUpdate: true }
  )

  return (
    <div ref={rootRef} id="field-guide-article">
      <ChapterRail chapters={CHAPTERS} reduced={reduced} />

      {/* ---------- prologue ---------- */}
      <p className="max-w-[62ch] text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink-dim)' }}>
        A guide in three chapters: find the story, build the world, hand the playhead to the
        reader. The worked example is this site. Every model, texture, and trick below is live on
        the homepage right now, and the page you're reading performs each technique as it explains
        it.
      </p>

      <p
        ref={openerRef}
        className="display mt-14 max-w-[24ch] text-[clamp(2.2rem,5.2vw,4rem)]"
        style={{ lineHeight: 1.02, letterSpacing: '-0.04em', textWrap: 'initial' }}
      >
        Most personal sites are inventories. Yours could be a place.
      </p>

      <figure className="bleed mt-14" data-parallax>
        <div className="h-[56svh] w-full overflow-hidden md:h-[74svh]" data-expand-clip>
          <img
            src="/images/empty-playa.webp"
            alt="The Black Rock Desert playa, empty to the horizon under a pale sky"
            className="h-full w-full scale-[1.16] object-cover will-change-transform"
            loading="lazy"
          />
        </div>
        <figcaption className="mx-auto mt-3" style={{ maxWidth: 'var(--frame-max)', paddingInline: 'var(--gutter)' }}>
          <span className="mono">/images/empty-playa.webp</span>
          <span className="meta"> · the site before anyone builds anything</span>
        </figcaption>
      </figure>

      <div className="mt-14 max-w-[62ch]">
        <p className="text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink)' }}>
          An inventory says what you've done: roles, dates, a grid of screenshots, a contact form.
          Useful, forgettable. A place says what it's like to be you for five minutes. The front
          door here is a desert at night with five glowing structures, because that's the truest
          available fact about its owner: he ships AI products for a living and builds light art
          for the playa, and one of those had to become the ground the other stands on.
        </p>
        <p className="mt-6 text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink)' }}>
          Three decisions, in order. By the end you'll have scrolled through the argument itself:
          the story spine runs on a real decade, the pipeline rebuilds a real bike, and the final
          flythrough shows its own scroll state in the corners while it plays.
        </p>
      </div>

      {/* ---------- chapter I ---------- */}
      <section id="ch-story" aria-label="Chapter one: figure out the story">
        <Marker
          numeral="I"
          title="Figure out the story"
          dek="Not the resume. The one sequence of events that explains why the rest exists."
          cameo={
            <div className="mx-auto mt-8 w-full max-w-[300px] md:mt-0 md:justify-self-end">
              <Cameo
                url="/models/signpost.glb"
                label="The homepage trail signpost, low-poly version, slowly turning"
                fit={2.6}
                spin={0.18}
                reduced={reduced}
              />
            </div>
          }
        />

        <Beat
          prose={
            <>
              Kenn Adams, an improv teacher, wrote the story spine as a rehearsal exercise: seven
              fill-in-the-blank lines that force a shape onto whatever you feed them. Pixar story
              artists later made it famous. It works because it refuses abstraction; every line
              demands an event, and a decade of "responsible for" contains surprisingly few events.
              Feed it your own last ten years and notice where it snags. The snag is the story.
            </>
          }
        />

        <div id="spine">
          <SpineScene reduced={reduced} />
        </div>

        <Beat
          prose={
            <>
              One correction before you write yours: you are not the hero of your site. The
              StoryBrand people built a whole methodology on that observation about brands, and it
              holds harder for personal pages. A visitor arrives mid-problem (hire someone, book a
              speaker, check whether you're real) and wants a guide, not an audience. So the
              homepage greets them with somewhere to go instead of a banner announcing greatness.
              The dish points at the sky for a living; this one is pointed at you.
            </>
          }
        >
          <div className="max-w-[360px]">
            <Cameo
              url="/models/dish.glb"
              label="The homepage radio dish, turned toward the reader"
              fit={2.5}
              tint="#7e848c"
              spin={0.12}
              reduced={reduced}
            />
            <p className="mt-2">
              <span className="mono">dish.glb · 71,460 bytes</span>
              <span className="meta"> · the Work portal's portrait stand-in</span>
            </p>
          </div>
        </Beat>

        <Blockquote className="mt-4 max-w-[48ch]">
          The visitor is the hero. You're the signpost with the lantern on it.
        </Blockquote>

        <Beat
          prose={
            <>
              Before moving on, compress the spine to one line you can build against. Three blanks,
              nothing else:
            </>
          }
        >
          <div className="flex max-w-2xl flex-col gap-5" aria-label="A three-blank exercise">
            {['People arrive carrying', 'I hand them', 'They leave with'].map((lead) => (
              <p key={lead} className="display text-[clamp(1.25rem,2.4vw,1.7rem)]" style={{ lineHeight: 1.2 }}>
                {lead}{' '}
                <span
                  aria-label="blank to fill in"
                  className="inline-block min-w-[10ch] align-baseline"
                  style={{ borderBottom: '1px solid var(--rail-strong)' }}
                >
                  &nbsp;
                </span>
              </p>
            ))}
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
              The desert version: people arrive in the dark, the structures glow, nobody needs a
              map.
            </p>
          </div>
        </Beat>
      </section>

      {/* ---------- chapter II ---------- */}
      <section id="ch-world" aria-label="Chapter two: build the world">
        <Marker
          numeral="II"
          title="Build the world"
          dek="3D is a medium, not a flex. It earns its bytes when the objects mean something."
        />

        <Beat
          prose={
            <>
              A place needs matter. Here it's ten GLB models, 4.3&nbsp;MB on disk, every one of
              them standing for something the owner actually made or loves. The stack behind them
              is small: Blender for layout and export, Hyper3D Rodin for generated meshes, FLORA
              for textures and skies, plus a headless bpy script in the repo that builds field
              geometry straight from code, no Blender window open. Suzanne and the Utah teapot are
              in there too, camped by the fire. Some traditions you keep.
            </>
          }
        />

        <div id="pipeline">
          <PipelineScene reduced={reduced} />
        </div>

        <Beat
          prose={
            <>
              About the AI in that pipeline, plainly. FLORA made the tiles below and the sky; it's
              a node-based canvas for image work, and these are images: color maps moonlighting as
              bump maps, not full PBR sets, and for surfaces this small that's enough. Rodin turns
              reference photos into meshes, then ships materials that render black until you
              rebuild them. Meshy will hand you a complete PBR set from a prompt; Polycam scans the
              real world instead of inventing one. None of them lays out your scene, and none of
              them decides what deserves to glow. That part stays yours.
            </>
          }
        />

        <div id="toolbox" className="py-6">
          <ToolboxDemo reduced={reduced} />
        </div>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {SWATCHES.map((s) => (
            <figure key={s.file} data-swatch>
              <div className="aspect-square w-full overflow-hidden" style={{ border: '1px solid var(--rail)' }}>
                <img src={s.src} alt={`${s.file}, one of the site's FLORA-generated textures`} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <figcaption className="mt-2">
                <span className="mono">{s.file}</span>
                <span className="meta block">{s.home}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <Beat
          prose={
            <>
              The models have referents, which is what keeps a 3D site from feeling like a tech
              demo. THEM stood in the Black Rock Desert as a pack of thylacines in steel and LED
              rope; the Pink Triangle faces the whole city from Twin Peaks every June. On the art
              page these photographs do documentary work. Here they're doing material work: proof
              that the place your site describes exists somewhere outside a GPU.
            </>
          }
        />

        <div className="bleed mt-4" style={{ paddingInline: 'var(--gutter)' }}>
          <div className="mx-auto grid gap-6 md:grid-cols-2" style={{ maxWidth: '1600px' }}>
          <figure data-parallax>
            <div className="aspect-[4/3] w-full overflow-hidden">
              <img
                src="/images/installations/them.webp"
                alt="THEM: thylacine light sculptures glowing at night in the Black Rock Desert"
                className="h-full w-full scale-[1.16] object-cover will-change-transform"
                loading="lazy"
              />
            </div>
            <figcaption className="meta mt-2">THEM, Black Rock Desert. Its steel understudies hold still in the finale below.</figcaption>
          </figure>
          <figure data-parallax>
            <div className="aspect-[4/3] w-full overflow-hidden">
              <img
                src="/images/installations/pink-triangle.webp"
                alt="The illuminated Pink Triangle installation on Twin Peaks over San Francisco at night"
                className="h-full w-full scale-[1.16] object-cover will-change-transform"
                loading="lazy"
              />
            </div>
            <figcaption className="meta mt-2">Pink Triangle, Twin Peaks. On the homepage it holds the far ridge.</figcaption>
          </figure>
          </div>
        </div>
      </section>

      {/* ---------- chapter III ---------- */}
      <section id="ch-scroll" aria-label="Chapter three: let scroll play it back">
        <Marker
          numeral="III"
          title="Let scroll play it back"
          dek="Scroll is a timeline. The craft is deciding whose clock each scene runs on."
        />

        <Beat
          prose={
            <>
              Motion on the web runs on one of two clocks. The movie runs on the page's clock:
              something enters the viewport, a timeline fires, and the moment lands the same for
              everyone. The flipbook runs on the reader's clock: scrub ties timeline progress to
              scroll position, so they conduct and they can conduct backwards. In GSAP these are
              toggleActions and scrub, and a trigger only gets one. Everything on this page picked
              a side: the spine and the bike are flipbooks, the opening line and these paragraphs
              are movies, and the teapot ignores both clocks because it answers to your pointer.
            </>
          }
        />

        <Beat
          prose={
            <>
              Chapters inside a flipbook are labels on its timeline; a snap setting keeps readers
              from parking between beats, and a pin holds the stage still while the timeline
              spends scroll instead of pixels. That's the entire vocabulary this page uses. Watch
              it once more with the gauges showing.
            </>
          }
        />
      </section>

      <div id="flythrough">
        <Flythrough reduced={reduced} />
      </div>

      <div className="mt-16 max-w-[62ch]">
        <h3 className="display text-[clamp(1.4rem,2.6vw,1.9rem)]" style={{ letterSpacing: '-0.02em' }}>
          Six ways this page could have broken
        </h3>
      </div>
      <ol className="mt-6 flex max-w-[62ch] flex-col gap-6">
        {MISTAKES.map((m, i) => (
          <li key={i} className="flex gap-4">
            <span className="index shrink-0 pt-1">{String(i + 1).padStart(2, '0')}</span>
            <p className="text-base leading-relaxed" style={{ color: 'var(--ink)' }}>
              {m}
            </p>
          </li>
        ))}
      </ol>

      {/* ---------- epilogue + colophon ---------- */}
      <div className="mt-20 max-w-[62ch]">
        <p className="text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink)' }}>
          That's the guide. Find the event your resume is hiding, give it ground to stand on, then
          decide whose clock each scene runs on. You don't need a desert. You need the thing you'd
          build anyway, taken seriously enough to become a place someone else can walk through.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/" className="btn">
            Walk the field
          </a>
          <a href="/thinking/night-field" className="btn">
            What broke building it
          </a>
        </div>
      </div>

      <aside id="colophon" className="mt-20 border-t pt-8" style={{ borderColor: 'var(--rail)' }}>
        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
          Used on this page
        </p>
        <ul className="meta mt-4 flex flex-col gap-2">
          <li>
            SplitText line masks · <a href="#field-guide-article" className="link-underline">the opening line</a> and every chapter title
          </li>
          <li>
            pin + scrub + labels + snap · <a href="#spine" className="link-underline">the story spine</a>
          </li>
          <li>
            clone crossfades on one scrubbed timeline · <a href="#pipeline" className="link-underline">the bike</a>
          </li>
          <li>
            pointer instead of scroll, on purpose · <a href="#toolbox" className="link-underline">the teapot</a>
          </li>
          <li>
            camera rig with live trigger readouts · <a href="#flythrough" className="link-underline">the flythrough</a>
          </li>
          <li>parallax + staggered entrances · the photographs and tiles between</li>
        </ul>
      </aside>
    </div>
  )
}
