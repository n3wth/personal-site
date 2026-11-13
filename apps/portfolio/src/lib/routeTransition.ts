import { storyKindFromPath } from './routeLines'

/** The arriving artwork settles for this long. Matches route-settle in routeTransition.css. */
export const ROUTE_SETTLE_MS = 760
const ARRIVE_KEY = 'route-line-arrive'
/** The scene can take this long to hydrate before the artwork is released regardless. */
const READY_TIMEOUT_MS = 1200

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

/** A section link from another page: the only navigation that gets a hint or an arrival. */
function sectionLink(link: HTMLAnchorElement) {
  const url = new URL(link.href, location.href)
  if (url.origin !== location.origin) return false
  const destination = storyKindFromPath(pathnameOf(url.pathname))
  return Boolean(destination) && destination !== storyKindFromPath(pathnameOf(location.pathname))
}

function hint(href: string) {
  if (document.querySelector(`link[rel="prefetch"][href="${CSS.escape(href)}"]`)) return
  const prefetch = document.createElement('link')
  prefetch.rel = 'prefetch'
  prefetch.href = href
  document.head.appendChild(prefetch)
}

/** Resolves once the scene engine owns the artwork, so the arrival never competes with hydration. */
function sceneReady(svg: SVGSVGElement) {
  return new Promise<void>(resolve => {
    if (svg.hasAttribute('data-story-ready')) return resolve()
    const done = () => { observer.disconnect(); window.clearTimeout(timer); resolve() }
    const observer = new MutationObserver(() => { if (svg.hasAttribute('data-story-ready')) done() })
    const timer = window.setTimeout(done, READY_TIMEOUT_MS)
    observer.observe(svg, { attributes: true, attributeFilter: ['data-story-ready'] })
  })
}

/** The head script holds the arriving artwork hidden; release it to settle into place. */
async function arrive() {
  const root = document.documentElement
  try { sessionStorage.removeItem(ARRIVE_KEY) } catch { /* storage can be blocked */ }
  if (root.dataset.routeArrive === undefined) return
  const svg = document.querySelector<SVGSVGElement>('.section-story svg')
  if (!svg || !motionOk()) return root.removeAttribute('data-route-arrive')
  await sceneReady(svg)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (root.dataset.routeArrive !== '') return
    root.dataset.routeArrive = 'settle'
    // The animation ends on the resting state, so releasing it changes nothing on screen.
    window.setTimeout(() => root.removeAttribute('data-route-arrive'), ROUTE_SETTLE_MS + 80)
  }))
}

export function mountRouteTransitions() {
  document.documentElement.dataset.routeTransitions = 'on'
  void arrive()

  // A page restored from the back/forward cache is already running; never hold it.
  window.addEventListener('pageshow', event => {
    if (event.persisted) document.documentElement.removeAttribute('data-route-arrive')
  })

  document.addEventListener('pointerenter', event => {
    if (!motionOk()) return
    const link = linkFrom(event)
    if (link && sectionLink(link)) hint(link.href)
  }, true)

  // Navigation itself is never intercepted: the browser's view transition carries every exit.
  // The mark only tells the next section to hold its artwork where the Navigation API is missing.
  document.addEventListener('click', event => {
    if (!motionOk()) return
    const link = linkFrom(event)
    if (!link || !plainClick(event, link) || !sectionLink(link)) return
    hint(link.href)
    try { sessionStorage.setItem(ARRIVE_KEY, String(Date.now())) } catch { /* storage can be blocked */ }
  })
}
