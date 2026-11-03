import { useEffect, type RefObject } from 'react'
import { ribbonEase as smooth } from './ribbonSurface'

export function createHomeFlow(svg: SVGSVGElement) {
  const plane = svg.querySelector<SVGGElement>('[data-home-plane]')
  const skin = svg.querySelector<SVGPathElement>('.home-ribbon__skin')
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
  const backdrop = svg.closest<HTMLElement>('.home-opening-scene')
  const palette = ['ice', 'coral', 'gold', 'seafoam']
  let lastFrame = -1
  let lastEnergy = -1, lastIndex = -1, lastTransition = -1
  const draw = (time: number) => {
    svg.style.setProperty('--home-flow-offset', `${-time * 260}px`)
    const energy = smooth((time - .35) / 2.4)
    const phase = Math.max(0, time - 2.75) / 8, index = Math.floor(phase) % palette.length
    const transition = smooth((phase % 1 - .25) / .75)
    if (energy === lastEnergy && index === lastIndex && transition === lastTransition) return
    lastEnergy = energy; lastIndex = index; lastTransition = transition
    const blend = (role: 'ink' | 'ground' | 'accent') => `color-mix(in ${role === 'ground' ? 'oklab' : 'oklch shorter hue'}, var(--home-${role}-${palette[index]}) ${(1 - transition) * 100}%, var(--home-${role}-${palette[(index + 1) % 4]}))`
    const background = `color-mix(in oklab, ${blend('ground')} ${energy * 18}%, var(--color-background-body))`
    if (backdrop) backdrop.style.backgroundColor = background
    const ink = `color-mix(in oklab, ${blend('ink')} ${energy * 88}%, var(--home-neutral-ink))`
    if (plane) {
      plane.style.stroke = ink
      plane.style.setProperty('--home-flow-ink', `color-mix(in oklab, ${blend('accent')} ${energy * 70}%, var(--color-text-primary))`)
    }
    if (skin) skin.style.fill = background
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
  }
}

export function useHomeFlow(ref: RefObject<SVGSVGElement | null>) {
  useEffect(() => {
    const svg = ref.current
    if (!svg) return
    const flow = createHomeFlow(svg), media = matchMedia('(prefers-reduced-motion: reduce)')
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
      observer?.disconnect()
      media.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
      svg.removeAttribute('data-story-paused')
    }
  }, [ref])
}
