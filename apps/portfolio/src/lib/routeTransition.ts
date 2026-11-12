import { storyKindFromPath } from './routeLines'

/** Line wipe before the next document loads. Matches --route-leave in routeTransition.css. */
export const ROUTE_LINE_MS = 340
/** Draw-in on the next document. Matches --route-draw in routeTransition.css. */
export const ROUTE_DRAW_MS = 680
/** Leaving accelerates away and settles; the arriving draw-in decelerates (CSS). */
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'
const ARRIVE_KEY = 'route-line-arrive'
/** The scene can take this long to hydrate before the draw-in starts regardless. */
const READY_TIMEOUT_MS = 1200
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

function markArrive() {
  try { sessionStorage.setItem(ARRIVE_KEY, String(Date.now())) } catch { /* storage can be blocked */ }
}

function hint(href: string) {
  if (document.querySelector(`link[rel="prefetch"][href="${CSS.escape(href)}"]`)) return
  const prefetch = document.createElement('link')
  prefetch.rel = 'prefetch'
  prefetch.href = href
  document.head.appendChild(prefetch)
}

/** Resolves once the scene engine owns the artwork, so the draw-in never competes with hydration. */
function sceneReady(svg: SVGSVGElement) {
  return new Promise<void>(resolve => {
    if (svg.hasAttribute('data-story-ready')) return resolve()
    const done = () => { observer.disconnect(); window.clearTimeout(timer); resolve() }
    const observer = new MutationObserver(() => { if (svg.hasAttribute('data-story-ready')) done() })
    const timer = window.setTimeout(done, READY_TIMEOUT_MS)
    observer.observe(svg, { attributes: true, attributeFilter: ['data-story-ready'] })
  })
}

/** The head script holds the arriving artwork hidden; release it into the draw-in. */
async function arrive() {
  const root = document.documentElement
  try { sessionStorage.removeItem(ARRIVE_KEY) } catch { /* storage can be blocked */ }
  if (root.dataset.routeArrive === undefined) return
  const svg = document.querySelector<SVGSVGElement>('.section-story svg')
  if (!svg || !motionOk()) return root.removeAttribute('data-route-arrive')
  await sceneReady(svg)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (root.dataset.routeArrive !== '') return
    root.dataset.routeArrive = 'draw'
    window.setTimeout(() => root.removeAttribute('data-route-arrive'), ROUTE_DRAW_MS + 80)
  }))
}

/** The wipe edits the artwork, so it waits for hydration, and only runs where it can be seen. */
function canWipe() {
  const hero = document.querySelector('.portfolio-story-hero')
  if (!hero || !hero.querySelector('.section-story svg[data-story-ready]')) return false
  return hero.getBoundingClientRect().bottom > window.innerHeight * .35
}

let flight = 0

async function wipeThenVisit(href: string) {
  const id = ++flight
  hint(href)
  if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'smooth' })
  document.documentElement.dataset.routeLeave = ''
  try { await wipeLines() } catch { /* Decorative failures must not block navigation. */ }
  if (id !== flight) return
  markArrive()
  location.assign(href)
}

export function mountRouteTransitions() {
  document.documentElement.dataset.routeTransitions = 'on'
  void arrive()

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
    if (!destination || destination === storyKindFromPath(pathnameOf(location.pathname))) return
    hint(link.href)
  }, true)

  document.addEventListener('click', event => {
    if (!motionOk()) return
    const link = linkFrom(event)
    if (!link || !plainClick(event, link)) return
    const url = new URL(link.href, location.href)
    if (url.origin !== location.origin) return
    const from = storyKindFromPath(pathnameOf(location.pathname))
    const to = storyKindFromPath(pathnameOf(url.pathname))
    if (!to || from === to) return
    // Every arrival at a section draws its lines in. From elsewhere, or with the artwork
    // scrolled away or not yet running, the document cross-fade carries the exit.
    markArrive()
    if (!from || !canWipe()) return
    event.preventDefault()
    void wipeThenVisit(url.href)
  })
}
