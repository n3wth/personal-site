import { storyKindFromPath } from './routeLines'

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

/** A section link from another page: prefetches the destination document. */
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

export function mountRouteTransitions() {
  document.documentElement.dataset.routeTransitions = 'on'

  document.addEventListener('pointerenter', event => {
    if (!motionOk()) return
    const link = linkFrom(event)
    if (link && sectionLink(link)) hint(link.href)
  }, true)

  document.addEventListener('click', event => {
    if (!motionOk()) return
    const link = linkFrom(event)
    if (link && plainClick(event, link) && sectionLink(link)) hint(link.href)
  })
}
