import { useEffect, type RefObject } from 'react'
import { ribbonEase as smooth } from './ribbonSurface'
import { groundLag, harmonyMix, harmonySeconds, paintHarmony } from './harmony'
import { readStoryJourney, saveStoryJourney } from './storySpace'

/** `start` is the harmony phase the visitor arrives with, so the ribbon resumes their journey. */
export function createHomeFlow(svg: SVGSVGElement, start = 0) {
  const plane = svg.querySelector<SVGGElement>('[data-home-plane]')
  const currents = [...svg.querySelectorAll<SVGPathElement>('[data-home-flow-full]')]
  try {
    const lengths = currents.map(path => {
      const front = svg.querySelector<SVGPathElement>(`[data-home-flow-front="${path.dataset.homeFlowFull}"]`)!
      return { front, full: path.getTotalLength(), length: front.getTotalLength() }
    })
    if (lengths.length && lengths.every(({ full, length }) => Number.isFinite(full + length) && length > 0 && full >= length)) {
      for (const { front, full, length } of lengths) {
        // Match the material phase across the foreground's shortened path.
        front.style.setProperty('--home-flow-prefix', `${full - length}px`)
      }
      svg.setAttribute('data-home-flow-ready', '')
    }
  } catch { /* Keep the complete still ribbon when path metrics are unavailable. */ }
  let lastFrame = -1
  let lastEnergy = -1, lastIndex = -1, lastTransition = -1, phase = start
  const draw = (time: number) => {
    svg.style.setProperty('--home-flow-offset', `${-time * 260}px`)
    const energy = smooth((time - .35) / 2.4)
    phase = start + Math.max(0, time - 2.75) / 8
    const index = Math.floor(phase) % 4
    const transition = smooth((phase % 1 - .25) / .75)
    if (energy === lastEnergy && index === lastIndex && transition === lastTransition) return
    // The ground holds its harmony from first paint; only the line gathers colour.
    if (index !== lastIndex || transition !== lastTransition) paintHarmony(index, transition)
    lastEnergy = energy; lastIndex = index; lastTransition = transition
    if (plane) {
      plane.style.stroke = `color-mix(in oklab, ${harmonyMix('ink', index, transition)} ${energy * 88}%, var(--home-neutral-ink))`
      plane.style.setProperty('--home-flow-ink', `color-mix(in oklab, ${harmonyMix('accent', index, transition)} ${energy * 70}%, var(--color-text-primary))`)
    }
  }
  return {
    update(time: number) {
      // Absorb browser timestamp rounding at frame boundaries.
      const frame = Math.floor((time + .0005) * 60)
      if (frame === lastFrame) return
      lastFrame = frame
      draw(time)
    },
    reset() { lastFrame = -1; draw(0) },
    /** The section pages ease across the whole interval; the ribbon holds first. */
    journeyPhase() { return Math.floor(phase) + Math.max(0, (phase % 1 - .25) / .75) },
  }
}

export function useHomeFlow(ref: RefObject<SVGSVGElement | null>) {
  useEffect(() => {
    const svg = ref.current
    if (!svg) return
    const journey = readStoryJourney()
    const arrived = (((Date.now() - journey.epoch) / 1000 - groundLag) / harmonySeconds % 4 + 4) % 4
    const flow = createHomeFlow(svg, Math.floor(arrived) + .25 + .75 * (arrived % 1)), media = matchMedia('(prefers-reduced-motion: reduce)')
    const leave = () => saveStoryJourney({ epoch: Date.now() - (flow.journeyPhase() % 4 * harmonySeconds + groundLag) * 1000, color: journey.color })
    window.addEventListener('pagehide', leave)
    let visible = typeof IntersectionObserver === 'undefined', frame = 0, elapsed = 0
    let previous: number | undefined
    const tick = (now: number) => {
      if (previous !== undefined) elapsed += Math.min(now - previous, 100) / 1000
      previous = now
      flow.update(elapsed)
      frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      cancelAnimationFrame(frame)
      previous = undefined
      const paused = media.matches || document.hidden || !visible
      svg.toggleAttribute('data-story-paused', paused)
      if (media.matches) flow.reset()
      if (!paused) frame = requestAnimationFrame(tick)
    }
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    })
    observer?.observe(svg.parentElement ?? svg)
    media.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pagehide', leave)
      observer?.disconnect()
      media.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
      svg.removeAttribute('data-story-paused')
    }
  }, [ref])
}
