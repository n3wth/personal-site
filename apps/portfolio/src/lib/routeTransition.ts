import { storyKindFromPath } from './routeLines'

function pathnameOf(pathname: string) {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

export function mountRouteTransitions() {
  document.documentElement.dataset.routeTransitions = 'on'
  const hinted = new Set<string>()

  function hint(event: Event) {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    if (connection?.saveData || /2g$/.test(connection?.effectiveType ?? '')) return
    if (!(event.target instanceof Element)) return
    const link = event.target.closest('a')
    if (!(link instanceof HTMLAnchorElement) || link.hasAttribute('download') || (link.target && link.target !== '_self')) return
    if (event.type === 'focusin' && !link.matches(':focus-visible')) return
    if (event instanceof PointerEvent && (event.pointerType === 'touch' || (event.relatedTarget instanceof Node && link.contains(event.relatedTarget)))) return
    const url = new URL(link.href)
    if (url.origin !== location.origin || url.search) return
    const path = pathnameOf(url.pathname)
    if (path === pathnameOf(location.pathname) || (path !== '/' && !storyKindFromPath(path)) || hinted.has(path)) return

    hinted.add(path)
    const prefetch = document.createElement('link')
    prefetch.rel = 'prefetch'
    prefetch.href = path
    document.head.appendChild(prefetch)
  }

  document.addEventListener('pointerover', hint, { passive: true })
  document.addEventListener('focusin', hint)
}
