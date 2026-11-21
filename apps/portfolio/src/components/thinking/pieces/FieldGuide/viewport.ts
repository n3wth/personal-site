import { useEffect, useRef, useState } from 'react'

/** Viewport tracking for the piece's canvases. `near` flips true once
    (mount trigger, the same deferral the Creative section uses for its
    background images); `visible` keeps toggling, so a scene can stop
    its frame loop the moment it scrolls away instead of drawing off
    screen forever. */
export function useNear<T extends HTMLElement>(rootMargin = '600px') {
  const ref = useRef<T>(null)
  const [near, setNear] = useState(false)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      const frame = requestAnimationFrame(() => {
        setNear(true)
        setVisible(true)
      })
      return () => cancelAnimationFrame(frame)
    }
    const io = new IntersectionObserver(
      (entries) => {
        const isIn = entries.some((e) => e.isIntersecting)
        if (isIn) setNear(true)
        setVisible(isIn)
      },
      { rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])
  return [ref, near, visible] as const
}

/** Which r3f frame loop a scene deserves right now: full loop only
    while on screen, single-invalidate renders for static reduced-motion
    scenes, nothing at all once scrolled past. */
export function frameloopFor(visible: boolean, reduced: boolean): 'always' | 'demand' | 'never' {
  if (!visible) return 'never'
  return reduced ? 'demand' : 'always'
}

/** Live prefers-reduced-motion flag; every scene in the piece takes this
    and renders its static form when true. */
export function useReducedMotionFlag() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}
