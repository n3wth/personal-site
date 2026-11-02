import { storyKindFromPath } from './routeLines'

/** Line wipe before the next document loads. Matches the CSS draw-in. */
export const ROUTE_LINE_MS = 420
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const ARRIVE_KEY = 'route-line-arrive'
const ACCENTS = ['cyan', 'green', 'yellow', 'red'] as const

function linkFrom(event: Event) {
  const target = event.target
  if (!(target instanceof Element)) return null
  const link = target.closest('a')
  return link instanceof HTMLAnchorElement ? link : null
}

function pathnameOf(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname || '/'
}

function motionOk() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function plainClick(event: MouseEvent, link: HTMLAnchorElement) {
  if (event.defaultPrevented || event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  if (link.target && link.target !== '_self') return false
  if (link.hasAttribute('download')) return false
  return true
}

function storyLines() {
  return [...document.querySelectorAll<SVGPathElement>('.section-story path')].filter(path => {
    if (path.closest('defs')) return false
    if (path.matches('[data-story-face], [data-story-wall], [data-story-halo], [data-story-halo-loop], [data-story-border]')) return false
    if (path.classList.contains('section-story__pulse') || path.classList.contains('section-story__contact-spectrum')) return false
    if (path.classList.contains('route-line-accent')) return false
    return path.style.opacity !== '0'
  })
}

function prepareLine(path: SVGPathElement) {
  if (!path.getAttribute('pathLength')) path.setAttribute('pathLength', '1')
}

function wipeLines() {
  const lines = storyLines()
  const ranked = lines.map(path => {
    let length = 0
    try { length = path.getTotalLength() } catch { /* A detached path has no length. */ }
    return { path, length }
  }).filter(line => line.length > 40).sort((a, b) => b.length - a.length)
  const accents = ranked.filter((_, index) => index % Math.max(1, Math.floor(ranked.length / ACCENTS.length)) === 0).slice(0, ACCENTS.length)
  accents.forEach(({ path }, index) => {
    const accent = path.cloneNode(false) as SVGPathElement
    accent.setAttribute('class', 'route-line-accent')
    accent.removeAttribute('id')
    accent.removeAttribute('style')
    accent.setAttribute('fill', 'none')
    accent.setAttribute('stroke', `var(--color-icon-${ACCENTS[index]})`)
    prepareLine(accent)
    accent.style.strokeDasharray = '1 2'
    accent.style.strokeDashoffset = '1'
    path.parentElement?.appendChild(accent)
    accent.animate(
      [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
      { duration: ROUTE_LINE_MS, easing: EASE, fill: 'forwards' },
    )
  })
  const wipes = lines.map(path => {
    prepareLine(path)
    const animation = path.animate(
      [{ strokeDasharray: '1 2', strokeDashoffset: 0 }, { strokeDasharray: '1 2', strokeDashoffset: 1 }],
      { duration: ROUTE_LINE_MS, easing: EASE, fill: 'forwards' },
    )
    animation.id = 'route-line-wipe'
    return animation.finished
  })
  return Promise.all(wipes)
}

function clearArrive() {
  try { sessionStorage.removeItem(ARRIVE_KEY) } catch { /* storage can be blocked */ }
  window.setTimeout(() => {
    document.documentElement.removeAttribute('data-route-arrive')
  }, motionOk() ? ROUTE_LINE_MS + 40 : 0)
}

let flight = 0

async function wipeThenVisit(href: string) {
  const id = ++flight
  window.scrollTo(0, 0)
  document.documentElement.dataset.routeLeave = ''
  try { await wipeLines() } catch { /* Decorative failures must not block navigation. */ }
  if (id !== flight) return
  try { sessionStorage.setItem(ARRIVE_KEY, '1') } catch { /* storage can be blocked */ }
  location.assign(href)
}

export function mountRouteTransitions() {
  document.documentElement.dataset.routeTransitions = 'on'
  clearArrive()

  window.addEventListener('pageshow', event => {
    if (!event.persisted) return
    flight++
    document.documentElement.removeAttribute('data-route-leave')
    document.documentElement.removeAttribute('data-route-arrive')
    document.getAnimations().filter(animation => animation.id === 'route-line-wipe').forEach(animation => animation.cancel())
    document.querySelectorAll('.route-line-accent').forEach(element => element.remove())
  })

  document.addEventListener('pointerenter', event => {
    if (!motionOk()) return
    const link = linkFrom(event)
    if (!link) return
    const url = new URL(link.href, location.href)
    if (url.origin !== location.origin) return
    const destination = storyKindFromPath(pathnameOf(url.pathname))
    const current = storyKindFromPath(pathnameOf(location.pathname))
    if (!destination || !current || destination === current) return
    const hint = document.querySelector(`link[rel="prefetch"][href="${CSS.escape(link.href)}"]`)
    if (hint) return
    const prefetch = document.createElement('link')
    prefetch.rel = 'prefetch'
    prefetch.href = link.href
    document.head.appendChild(prefetch)
  }, true)

  document.addEventListener('click', event => {
    if (!motionOk()) return
    const link = linkFrom(event)
    if (!link || !plainClick(event, link)) return
    const url = new URL(link.href, location.href)
    const from = storyKindFromPath(pathnameOf(location.pathname))
    const to = storyKindFromPath(pathnameOf(url.pathname))
    if (!from || !to || from === to || url.origin !== location.origin) return
    if (!document.querySelector('.section-story')) return
    event.preventDefault()
    void wipeThenVisit(url.href)
  })
}
