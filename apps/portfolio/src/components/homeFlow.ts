import { useEffect, type RefObject } from 'react'
import { ribbonEase as smooth, ribbonFrame } from './ribbonSurface'

export function createHomeFlow(svg: SVGSVGElement) {
  const plane = svg.querySelector<SVGGElement>('[data-home-plane]')
  const strands = svg.querySelector<SVGPathElement>('.home-ribbon__strands')
  const skin = svg.querySelector<SVGPathElement>('.home-ribbon__skin')
  const foreground = svg.querySelector<SVGPathElement>('.home-ribbon__front')
  const backdrop = svg.closest<HTMLElement>('.home-opening-scene')
  const palette = ['cyan', 'red', 'yellow', 'green']
  let lastFrame = -1
  const draw = (time: number) => {
    const energy = smooth((time - 12) / 24), frame = ribbonFrame(time)
    const phase = time / 24, index = Math.floor(phase) % palette.length
    const blend = (offset: number) => `color-mix(in oklch shorter hue, var(--color-icon-${palette[(index + offset) % 4]}) ${(1 - smooth(phase % 1)) * 100}%, var(--color-icon-${palette[(index + offset + 1) % 4]}))`
    const color = blend(0), ground = blend(2)
    const background = `color-mix(in oklab, ${ground} ${energy * 22}%, var(--color-background-body))`
    if (backdrop) backdrop.style.backgroundColor = background
    if (plane) plane.style.stroke = `color-mix(in oklab, ${color} ${energy * 100}%, var(--color-text-primary))`
    strands?.setAttribute('d', frame.strands)
    skin?.setAttribute('d', frame.surface)
    if (skin) skin.style.fill = background
    foreground?.setAttribute('d', frame.foreground)
  }
  return {
    update(time: number) {
      // Absorb browser timestamp rounding at frame boundaries.
      const frame = Math.floor((time + .0005) * 30)
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
