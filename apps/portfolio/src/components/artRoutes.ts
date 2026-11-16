type Point = { x: number; y: number }

/**
 * Measure absolute M/L/H/V/C/Q/T/Z path data in script. Each DOM
 * getPointAtLength call measures the whole path again, and route building
 * needs thousands of lookups, so the DOM version blocked input for seconds.
 */
export function measurePath(d: string) {
  const tokens = d.match(/[a-df-z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []
  const points: Point[] = []
  const lengths: number[] = []
  let at = 0, command = '', start = { x: 0, y: 0 }, current = start, control = start
  const number = () => Number(tokens[at++])
  const lineTo = (p: Point) => {
    const last = points[points.length - 1]
    lengths.push(last ? lengths[lengths.length - 1] + Math.hypot(p.x - last.x, p.y - last.y) : 0)
    points.push(p)
    current = p
  }
  const curveTo = (handles: Point[], end: Point) => {
    const hull = [current, ...handles, end]
    const span = hull.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - hull[i].x, p.y - hull[i].y), 0)
    const steps = Math.max(8, Math.ceil(span / 2))
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      let level = hull
      while (level.length > 1) level = level.slice(1).map((p, j) => ({ x: level[j].x + (p.x - level[j].x) * t, y: level[j].y + (p.y - level[j].y) * t }))
      lineTo(level[0])
    }
  }
  while (at < tokens.length) {
    if (/[a-z]/i.test(tokens[at])) command = tokens[at++].toUpperCase()
    if (command === 'M') { start = { x: number(), y: number() }; lineTo(start); command = 'L' }
    else if (command === 'L') lineTo({ x: number(), y: number() })
    else if (command === 'H') lineTo({ x: number(), y: current.y })
    else if (command === 'V') lineTo({ x: current.x, y: number() })
    else if (command === 'C') {
      const first = { x: number(), y: number() }, second = { x: number(), y: number() }
      curveTo([first, second], { x: number(), y: number() })
    } else if (command === 'Q' || command === 'T') {
      control = command === 'Q' ? { x: number(), y: number() } : { x: 2 * current.x - control.x, y: 2 * current.y - control.y }
      curveTo([control], { x: number(), y: number() })
    } else if (command === 'Z') lineTo(start)
    else throw new Error(`Unsupported path command ${command}`)
    if (command !== 'Q' && command !== 'T') control = current
  }
  const length = lengths[lengths.length - 1] ?? 0
  /** Point at a distance along the path, clamped to its ends like getPointAtLength. */
  const pointAt = (distance: number): Point => {
    if (!points.length) return { x: 0, y: 0 }
    let low = 0, high = points.length - 1
    if (distance <= 0) return points[0]
    if (distance >= length) return points[high]
    while (high - low > 1) {
      const mid = (low + high) >> 1
      if (lengths[mid] < distance) low = mid
      else high = mid
    }
    const a = points[low], b = points[high], t = (distance - lengths[low]) / (lengths[high] - lengths[low])
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
  }
  return { length, pointAt }
}

/** Route light between the actual crossings with Art's uppermost current. */
export function createArtRoutes(svg: SVGSVGElement) {
  const wave = svg.querySelector<SVGPathElement>('[data-art-current]')
  if (!wave) return []
  const current = measurePath(wave.getAttribute('d') ?? '')
  const samples = Array.from({ length: 4097 }, (_, i) => current.pointAt(current.length * i / 4096))
  const heightAt = (x: number) => {
    let low = 0, high = samples.length - 1
    while (high - low > 1) {
      const mid = (low + high) >> 1
      if (samples[mid].x < x) low = mid
      else high = mid
    }
    const a = samples[low], b = samples[high]
    return a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x)
  }
  const routes: SVGPathElement[] = []
  svg.querySelectorAll<SVGPathElement>('[data-art-loop], [data-story-halo-loop]').forEach(loop => {
    const outline = measurePath(loop.getAttribute('d') ?? '')
    const total = outline.length
    const count = Math.ceil(total / 2)
    const distance = (at: number) => {
      const p = outline.pointAt(at)
      return p.y - heightAt(p.x)
    }
    const hits: number[] = []
    for (let i = 1; i <= count; i++) {
      let a = (i - 1) / count * total, b = i / count * total
      if (distance(a) * distance(b) >= 0) continue
      const sign = distance(a) > 0
      for (let step = 0; step < 16; step++) {
        const mid = (a + b) / 2
        if ((distance(mid) > 0) === sign) a = mid
        else b = mid
      }
      hits.push((a + b) / 2)
    }
    if (hits.length !== 2) return
    ;[[hits[1], hits[0] + total], [hits[0], hits[1]]].forEach(([start, end], index) => {
      const steps = Math.ceil((end - start) / 2)
      const points = Array.from({ length: steps + 1 }, (_, i) => outline.pointAt((start + (end - start) * i / steps) % total))
      const route = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      route.dataset.artRoute = index ? 'reflection' : 'arch'
      if (loop.dataset.storyHaloLoop) {
        route.dataset.storyHalo = loop.dataset.storyHaloLoop
        route.setAttribute('pathLength', '1')
      }
      route.setAttribute('d', points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' '))
      route.style.opacity = '0'
      loop.parentElement!.appendChild(route)
      routes.push(route)
    })
  })
  return routes
}
