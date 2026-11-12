import { useEffect, type RefObject } from 'react'
import { createArtRoutes } from './artRoutes'
import { createStorySpace, pulseEnvelope, readStoryJourney, saveStoryJourney, storyEnergy, storyColor, storyChaos, type StoryAccent } from './storySpace'

type Point = { x: number; y: number }

/** Return the contact's position on the receiving segment, including near touches. */
export function segmentContact(a: Point, b: Point, c: Point, d: Point, radius = 2): number | null {
  const rx = b.x - a.x, ry = b.y - a.y
  const sx = d.x - c.x, sy = d.y - c.y
  const cross = rx * sy - ry * sx
  if (Math.abs(cross) > 1e-8) {
    const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / cross
    const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / cross
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return u
  }
  const length = sx * sx + sy * sy
  const u = length ? Math.max(0, Math.min(1, ((b.x - c.x) * sx + (b.y - c.y) * sy) / length)) : 0
  return Math.hypot(b.x - c.x - u * sx, b.y - c.y - u * sy) <= radius ? u : null
}

type Line = { path: SVGPathElement; points: DOMPoint[]; length: number }
type Trail = { previous?: Point; color?: string; position: number; direction: number; width: number; visited: Set<Line>; depth: number }
type Transfer = Trail & { path: SVGPathElement; echoes: SVGPathElement[]; fades: SVGLinearGradientElement[]; gain: number; phase: number; lengthScale: number; line: Line; start: number; end: number; born: number; duration: number; passage: number; coordinated: boolean; psychedelic: boolean }

/** Exact crossing with normalized positions on both segments. */
export function crossing(a: Point, b: Point, c: Point, d: Point) {
  const rx = b.x - a.x, ry = b.y - a.y
  const sx = d.x - c.x, sy = d.y - c.y
  const cross = rx * sy - ry * sx
  if (Math.abs(cross) < 1e-8) return null
  const first = ((c.x - a.x) * sy - (c.y - a.y) * sx) / cross
  const second = ((c.x - a.x) * ry - (c.y - a.y) * rx) / cross
  if (first < 0 || first > 1 || second < 0 || second > 1) return null
  return { first, second, x: a.x + first * rx, y: a.y + first * ry }
}

const pulseSelector = '.section-story__pulse, .section-story__contact-spectrum'
const colors = ['cyan', 'green', 'yellow', 'red']
const smooth = (n: number) => { const t = Math.max(0, Math.min(1, n)); return t * t * (3 - 2 * t) }
export interface PulseTuning { duration: number; gap: number; length: number; easing: number; noise: number; smoothing: number; afterimages: number; space: number }
export const defaultPulseTuning: PulseTuning = { duration: 2550, gap: 800, length: .2, easing: 3, noise: 0, smoothing: .5, afterimages: .7, space: .55 }

export function useStoryInteractions(ref: RefObject<SVGSVGElement | null>, kind: string, tuning: PulseTuning = defaultPulseTuning) {
  useEffect(() => {
    const svg = ref.current
    if (!svg || typeof SVGPathElement === 'undefined' || !SVGPathElement.prototype.getTotalLength) return
    let visible = typeof IntersectionObserver === 'undefined'
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const easeOut = (t: number) => 1 - (1 - t) ** tuning.easing
    const { noise, smoothing, afterimages } = tuning
    const spectralColor = CSS.supports('color', 'color-mix(in oklab, red, blue)')
    const sources = [...svg.querySelectorAll<SVGPathElement>(pulseSelector)]
    sources.forEach(path => { path.style.opacity = '0' })
    const artRoutes = kind === 'art' ? createArtRoutes(svg) : []
    const lines: Line[] = [...svg.querySelectorAll<SVGPathElement>('path')]
      .filter(path => !path.matches(pulseSelector) && !path.matches('[data-story-decoration], [data-story-face], [data-story-border], [data-story-halo], [data-story-halo-loop], [data-story-wall]') && !path.closest('defs'))
      .filter(path => kind !== 'art' || !path.closest('[data-story-light]') || path.hasAttribute('data-art-route'))
      .map(path => {
        const length = path.getTotalLength()
        const count = Math.max(8, Math.min(160, Math.ceil(length / 10)))
        return { path, length, points: Array.from({ length: count + 1 }, (_, i) => path.getPointAtLength(length * i / count)) }
      }).filter(line => line.length > 0)
    // Sample once: nearby outlines share a breath rather than flickering independently.
    const restingLines = lines.filter(line => !line.path.hasAttribute('data-art-route')).map(({ path, points }) => ({
      path, opacity: path.style.opacity,
      y: points[Math.floor(points.length / 2)].y,
    }))
    const low = Math.min(...restingLines.map(line => line.y))
    const span = Math.max(1, Math.max(...restingLines.map(line => line.y)) - low)
    let breathStart = 2000 + Math.random() * 4000
    let breathDuration = 14000 + Math.random() * 9000
    let breathDirection = Math.random() < .5 ? 1 : -1
    const resetBreath = () => restingLines.forEach(({ path, opacity }) => { path.style.opacity = opacity })
    let transfers: Transfer[] = []
    const journey = readStoryJourney()
    const space = createStorySpace(svg, kind, tuning.space, smoothing)
    const journeyOffset = (Date.now() - journey.epoch) / 1000
    const saveJourney = () => saveStoryJourney({ epoch: journey.epoch, color })
    let frame = 0, lastTime = 0, time = 0, lastCollision = -100, color = journey.color
    saveJourney()
    window.addEventListener('pagehide', saveJourney)

    let nextBurst = 0
    let synchronized = false, ordered = false, longChase = false, white = false, burstDuration = 500
    let patternColor = '', sceneTime = 0
    let psychedelic = false
    let passage = 0
    let nextAccent = 25000
    let nextMotif = 0, motifOrdered = true, motifExpansion = false
    let nextExpansion = 10000 + Math.random() * 8000, expansionUntil = 0
    let nextPerformance = 45000 + Math.random() * 45000, awaitingAnswer = false
    let order = new Map<Line, number>()
    const seeded = new Set<Line>()
    const pulseLimit = () => lines.length * 4

    function clearTransfers() {
      transfers.forEach(pulse => { pulse.path.remove(); pulse.echoes.forEach(path => path.remove()); pulse.fades.forEach(fade => fade.remove()) })
      transfers = []
    }

    // Travelling light fades along its line: a gradient laid from tail to head, re-aimed each frame.
    // A stroke cannot vary along its own path, and a hard-ended dash reads as a broken line.
    const fadeDefs = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'defs')
    svg.appendChild(fadeDefs)
    const fadeId = Math.random().toString(36).slice(2, 8)
    let fadeCount = 0
    function softStroke(path: SVGPathElement, strokeColor: string) {
      const fade = svg!.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
      fade.id = `story-fade-${fadeId}-${fadeCount++}`
      fade.setAttribute('gradientUnits', 'userSpaceOnUse')
      for (const [offset, opacity] of [[0, 0], [.5, 1], [.82, 1], [1, 0]]) {
        const stop = svg!.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'stop')
        stop.setAttribute('offset', String(offset))
        stop.setAttribute('stop-opacity', String(opacity))
        stop.style.stopColor = strokeColor
        fade.appendChild(stop)
      }
      fadeDefs.appendChild(fade)
      path.setAttribute('stroke', `url(#${fade.id})`)
      return fade
    }
    function pointAt(line: Line, fraction: number) {
      const at = Math.max(0, Math.min(1, fraction)) * (line.points.length - 1)
      const a = line.points[Math.floor(at)], b = line.points[Math.min(line.points.length - 1, Math.floor(at) + 1)], t = at - Math.floor(at)
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    }
    /** Lays the fade from the trailing end to the leading end of a light. */
    function aimFade(fade: SVGLinearGradientElement, line: Line, trailing: number, leading: number) {
      const from = pointAt(line, trailing), to = pointAt(line, leading)
      // A zero-length gradient paints nothing; a new light is a point, so give it a direction.
      if (Math.hypot(to.x - from.x, to.y - from.y) < .01) to.x += .01
      fade.setAttribute('x1', String(from.x)); fade.setAttribute('y1', String(from.y))
      fade.setAttribute('x2', String(to.x)); fade.setAttribute('y2', String(to.y))
    }

    function emit(line: Line, position: number, parent: Trail) {
      // Cuboid edges ignite at real corners, even when a crossing triggers them.
      const cuboid = kind === 'projects' && !!line.path.closest('[data-story-block]')
      const anchored = cuboid || line.path.hasAttribute('data-art-route')
      if (anchored) position = position < .5 ? 0 : 1
      const ends = anchored ? [1 - position] : kind === 'thinking' ? [1] : synchronized || ordered || Math.random() < .5 ? [0, 1] : [Math.random() < .5 ? 0 : 1]
      for (const end of ends) {
        if (Math.abs(end - position) < .001 || transfers.length >= pulseLimit()) continue
        const path = line.path.cloneNode(false) as SVGPathElement
        path.removeAttribute('id')
        path.removeAttribute('style')
        path.removeAttribute('opacity')
        path.removeAttribute('transform')
        path.setAttribute('class', 'section-story__transfer')
        path.setAttribute('pathLength', '1')
        path.style.vectorEffect = 'none'
        path.dataset.generation = String(parent.depth + 1)
        path.dataset.passage = String(passage)
        path.dataset.origin = String(position)
        path.dataset.direction = String(end > position ? 1 : -1)
        color += 1 + Math.floor(Math.random() * 3)
        const matchedColor = space.colorFor(line.path, sceneTime, ordered || synchronized)
        const independent = `var(--story-color-${colors[color % colors.length]})`
        const chaos = synchronized ? 0 : storyChaos(sceneTime)
        const themedColor = `color-mix(in srgb, ${patternColor} ${(1 - chaos) * 100}%, ${independent})`
        const pulseColor = parent.color || matchedColor || (synchronized ? patternColor : themedColor)
        const fades = [softStroke(path, pulseColor)]
        path.style.opacity = '0'
        // Render above the artwork so quiet/reflection groups do not hide a real contact.
        svg!.appendChild(path)
        const echoes = afterimages > 0 ? Array.from({ length: 3 }, (_, index) => {
          const echo = path.cloneNode(false) as SVGPathElement
          echo.setAttribute('class', 'section-story__transfer section-story__echo')
          echo.removeAttribute('data-generation')
          fades.push(softStroke(echo, psychedelic && !white ? `var(--story-color-${colors[(index + color) % colors.length]})` : pulseColor))
          if (psychedelic && !white) {
            echo.dataset.spectrumFrom = `var(--story-color-${colors[(index + color) % colors.length]})`
            echo.dataset.spectrumTo = `var(--story-color-${colors[(index + color + 1) % colors.length]})`
            if (index === 1) echo.style.mixBlendMode = 'difference'
          }
          svg!.insertBefore(echo, path)
          return echo
        }) : []
        transfers.push({
          gain: line.path.closest('[data-story-reflection]') || line.path.dataset.artRoute === 'reflection' ? .55 : 1,
          passage, color: pulseColor, coordinated: ordered || synchronized, psychedelic,
          path, echoes, fades, phase: synchronized ? 0 : Math.random() * Math.PI * 2,
          lengthScale: synchronized || ordered ? (longChase ? 2.4 : 1) : longChase ? 1.8 + Math.random() * 1.2 : .45 + Math.random() * .9,
          line, start: position, end, position, direction: end > position ? 1 : -1, width: 0,
          born: time + (synchronized ? 0 : ordered ? (order.get(line) ?? 0) * burstDuration * .65 : Math.random() * burstDuration * .3),
          duration: synchronized || ordered ? burstDuration : burstDuration * (.5 + Math.abs(end - position) * .5) * (.7 + Math.random() * .6),
          depth: parent.depth + 1, visited: new Set([...parent.visited, line]),
        })
      }
      seeded.add(line)
      parent.visited.add(line)
    }

    function geometry() {
      return lines.map(line => {
        const matrix = line.path.getScreenCTM()
        return { line, matrix, points: matrix ? line.points.map(p => ({ x: matrix.a * p.x + matrix.c * p.y + matrix.e, y: matrix.b * p.x + matrix.d * p.y + matrix.f })) : [] }
      })
    }

    function startBurst(paths: ReturnType<typeof geometry>) {
      const bounds = svg!.parentElement!.getBoundingClientRect()
      const offset = Math.floor(Math.random() * paths.length)
      for (let a = 0; a < paths.length; a++) {
        const first = paths[(a + offset) % paths.length]
        for (let b = a + 1; b < paths.length; b++) {
          const second = paths[(b + offset) % paths.length]
          if (seeded.has(first.line) && seeded.has(second.line)) continue
          for (let i = 1; i < first.points.length; i++) {
            const p = first.line.points[i - 1], q = first.line.points[i]
            if (Math.hypot(q.x - p.x, q.y - p.y) > first.line.length / (first.points.length - 1) * 1.1) continue
            for (let j = 1; j < second.points.length; j++) {
              const r = second.line.points[j - 1], t = second.line.points[j]
              if (Math.hypot(t.x - r.x, t.y - r.y) > second.line.length / (second.points.length - 1) * 1.1) continue
              const hit = crossing(first.points[i - 1], first.points[i], second.points[j - 1], second.points[j])
              if (!hit || hit.x < Math.max(0, bounds.left) || hit.x > Math.min(innerWidth, bounds.right)
                || hit.y < Math.max(0, bounds.top) || hit.y > Math.min(innerHeight, bounds.bottom)) continue
              const parent: Trail = { position: 0, direction: 1, width: 0, visited: new Set([first.line, second.line]), depth: -1 }
              if (!seeded.has(first.line)) emit(first.line, (i - 1 + hit.first) / (first.points.length - 1), parent)
              if (!seeded.has(second.line)) emit(second.line, (j - 1 + hit.second) / (second.points.length - 1), parent)
              seeded.add(first.line)
              seeded.add(second.line)
              return true
            }
          }
        }
      }
      return false
    }

    function tick(now: number) {
      const delta = lastTime ? Math.min(now - lastTime, 100) : 0
      time += delta
      lastTime = now
      sceneTime = journeyOffset + time / 1000
      const energy = storyEnergy(sceneTime)
      space.update(sceneTime)
      if (time > breathStart + breathDuration + 4000) {
        breathStart = time + 5000 + Math.random() * 7000
        breathDuration = 14000 + Math.random() * 9000
        breathDirection = Math.random() < .5 ? 1 : -1
      }
      restingLines.forEach(({ path, opacity, y }) => {
        const position = (y - low) / span
        const delay = (breathDirection > 0 ? position : 1 - position) * 4000
        const age = (time - breathStart - delay) / breathDuration
        // A soft exhale passes through the structure, then returns fully to rest.
        const breath = age > 0 && age < 1 ? Math.sin(Math.PI * age) ** 2 : 0
        const undertone = (.5 + .5 * Math.sin(sceneTime * .31 - position * 2.4)) * .04
        path.style.opacity = String((opacity ? Number(opacity) : 1) * (1 - (undertone + breath * .18) * (1 - energy * .65)))
      })
      if (time >= nextBurst && transfers.length <= lines.length * 2) {
        passage++
        const calm = .65 + Math.sin(sceneTime * .037) * .18 + Math.sin(sceneTime * .013) * .1
        if (time >= nextMotif && (energy < .45 || passage === 1)) {
          motifOrdered = Math.random() < calm
          nextMotif = time + 18000 + Math.random() * 18000
        }
        if (time >= nextExpansion) {
          expansionUntil = time + 9000 + Math.random() * 5000
          nextExpansion = expansionUntil + 40000 + Math.random() * 30000
        }
        motifExpansion = time < expansionUntil
        const answering = awaitingAnswer
        const accent: StoryAccent = !answering && kind === 'projects' && time >= nextPerformance
          ? motifExpansion ? 'return' : Math.random() < .5 ? 'depth' : 'suspend' : null
        if (accent) nextPerformance = time + 90000 + Math.random() * 60000
        awaitingAnswer = accent === 'suspend'
        synchronized = answering || (!accent && Math.random() < space.profile.chorus * energy)
        ordered = !synchronized && (motifOrdered || motifExpansion || !!accent)
        longChase = Math.random() < (kind === 'work' ? .55 : ordered ? .35 : .2)
        if (kind === 'work' && motifExpansion) longChase = true
        white = synchronized && Math.random() < .4
        psychedelic = !accent && !answering && !white && energy > .45 && time >= nextAccent && Math.random() < .12
        if (psychedelic) nextAccent = time + 35000 + Math.random() * 45000
        burstDuration = tuning.duration * space.profile.speed * (.85 + Math.random() * .3) * (longChase ? 2 + Math.random() : 1)
        if (accent) burstDuration = tuning.duration * space.profile.speed * 2
        if (accent === 'depth') burstDuration *= 2
        patternColor = white ? 'white' : storyColor(sceneTime, 0, 'accent')
        const blocks = new Set(Array.from({ length: 9 }, (_, i) => i).filter(i => accent === 'suspend' ? i === 4 : !!accent || motifExpansion || synchronized || energy > .65 || Math.random() < energy * (.55 + space.affinity(i))))
        const focus = kind === 'projects' ? Array.from({ length: 9 }, (_, i) => i).reduce((best, i) => space.affinity(i) > space.affinity(best) ? i : best, 0) : 0
        if (!blocks.size) blocks.add(kind === 'projects' ? focus : Math.floor(Math.random() * 9))
        // Alternate familiar sweeps with passages growing out of the lingering light.
        const origin = kind === 'projects' && ordered && !accent && !motifExpansion && passage % 3 !== 0 ? focus : 0
        const circulating = kind === 'projects' && ordered && !accent && !motifExpansion && passage % 3 !== 0
        const reverse = Math.sin(sceneTime * .023) > 0
        if (ordered || synchronized) space.startPattern(sceneTime, burstDuration / 1000, patternColor, accent ? 0 : ordered ? burstDuration * .00065 : 0, blocks, accent || synchronized ? 0 : storyChaos(sceneTime), motifExpansion && accent !== 'suspend', accent, origin)
        seeded.clear()
        const paths = geometry()
        const sorted = [...paths].sort((a, b) => Math.min(...a.points.map(p => p.y)) - Math.min(...b.points.map(p => p.y)))
        order = new Map(sorted.map(({ line }, index) => {
          const block = line.path.closest<SVGGElement>('[data-story-block]')
          const group = line.path.closest<SVGGElement>('[data-story-light]')
          if (group) {
            const layer = Number(group.dataset.storyLight) / 8
            if (kind === 'art') return [line, layer + (line.path.dataset.artRoute === 'reflection' ? .55 : 0)]
            if (kind === 'contact') return [line, (Number(line.path.closest<SVGGElement>('[data-story-side]')?.dataset.storySide) === passage % 2 ? 0 : .85) + layer * .15]
            if (kind === 'thinking') return [line, Math.abs(layer - (.5 + .35 * Math.sin(sceneTime * .021)))]
            return [line, passage % 2 ? layer : 1 - layer]
          }
          return [line, block ? Math.abs(Number(block.dataset.storyBlock) - origin) / 8 : index / Math.max(1, sorted.length - 1)]
        }))
        // Usually one local spark; occasionally light the whole connected drawing.
        if (kind === 'thinking' || ordered || synchronized) {
          // The canopy is one rooted drawing. Every branch starts at the floor.
          for (const line of lines) {
            const block = line.path.closest<SVGGElement>('[data-story-block]')
            const light = line.path.closest<SVGGElement>('[data-story-light]')
            // Work opens through its actual junctions before feeding the long currents.
            if (kind === 'work' && motifExpansion && !light) continue
            if (light && kind !== 'thinking' && !motifExpansion && !synchronized) {
              const focus = 4 + 3 * Math.sin(sceneTime * .021)
              if (Math.abs(Number(light.dataset.storyLight) - focus) > 2) continue
            }
            if (accent === 'suspend' && (!block || line.path.classList.contains('section-story__quiet'))) continue
            if (block && !blocks.has(Number(block.dataset.storyBlock))) continue
            if (kind === 'thinking' && !synchronized && !motifExpansion && energy < .65) {
              const layer = Number(line.path.closest<SVGGElement>('[data-story-light]')?.dataset.storyLight ?? 4) / 8
              const focus = .5 + .35 * Math.sin(sceneTime * .021)
              if (Math.abs(layer - focus) > .15 + energy * .35) continue
            }
            const start = circulating && block && (reverse !== line.path.classList.contains('section-story__quiet')) ? 1 : 0
            emit(line, start, { position: start, direction: start ? -1 : 1, width: 0, visited: new Set(), depth: -1 })
          }
        } else {
          const count = synchronized ? lines.length : ordered ? Math.max(1, Math.round(lines.length * energy)) : 1 + Math.floor(Math.random() * 3 * energy)
          for (let i = 0; i < count && startBurst(paths); i++) { /* seed connected lines */ }
        }
        nextBurst = time + burstDuration * (ordered ? 1.2 : .85) + tuning.gap * (.25 + (1 - energy) * 2) * space.profile.gap
        if (accent === 'return') nextBurst = time + burstDuration * 4.5
        if (accent === 'suspend') nextBurst = time + burstDuration * 1.6
        saveJourney()
      }
      transfers = transfers.filter(pulse => {
        const age = (time - pulse.born) / pulse.duration
        if (age < 0) return true
        if (age >= 1 + afterimages * (pulse.psychedelic ? .9 : .45)) {
          pulse.path.remove()
          pulse.echoes.forEach(path => path.remove())
          pulse.fades.forEach(fade => fade.remove())
          return false
        }
        const progress = Math.min(1, age)
        const travel = (age: number) => {
          const t = Math.min(1, age / .8)
          if (pulse.coordinated) return smooth(t)
          return easeOut(t + .03 * noise * Math.sin(t * Math.PI * 2 + pulse.phase) * Math.sin(t * Math.PI) ** 2)
        }
        pulse.position = pulse.start + (pulse.end - pulse.start) * travel(progress)
        const width = Math.min(tuning.length * pulse.lengthScale, Math.abs(pulse.position - pulse.start))
        pulse.width = width
        const tail = pulse.end > pulse.start ? pulse.position - width : pulse.position
        const rootMatrix = svg!.getScreenCTM()
        const lineMatrix = pulse.line.path.getScreenCTM()
        let transform = ''
        if (rootMatrix && lineMatrix) {
          const m = rootMatrix.inverse().multiply(lineMatrix)
          transform = `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`
          pulse.path.setAttribute('transform', transform)
          pulse.path.style.strokeWidth = String(1.5 / Math.hypot(lineMatrix.a, lineMatrix.b))
        }
        pulse.path.style.strokeDasharray = `${Math.max(.0001, width)} 2`
        pulse.path.style.strokeDashoffset = String(-tail)
        aimFade(pulse.fades[0], pulse.line, pulse.position - pulse.direction * width, pulse.position)
        const envelope = (t: number) => pulseEnvelope(t, smoothing)
        const brightness = pulse.gain * (1 - noise * .25 * (.5 + .5 * Math.sin(time * .003 + pulse.phase)))
        pulse.path.style.opacity = String(envelope(progress) * brightness)
        pulse.echoes.forEach((echo, index) => {
          const depth = (index + 1) * afterimages
          const t = Math.max(0, Math.min(1, age - (pulse.psychedelic ? depth * .3 : pulse.coordinated ? 0 : depth * .15)))
          const position = pulse.start + (pulse.end - pulse.start) * travel(t)
          const length = Math.min(tuning.length * pulse.lengthScale, Math.abs(position - pulse.start))
          const ghost = pulse.psychedelic ? smooth((progress - .55) / .45) * depth : 0
          const drift = Math.sin(pulse.phase + index * .7)
          echo.setAttribute('transform', ghost ? `translate(${ghost * (10 + drift * 12)} ${-ghost * (8 + index * 3)}) ${transform}` : transform)
          echo.style.strokeWidth = pulse.path.style.strokeWidth
          echo.style.strokeDasharray = `${Math.max(.0001, length)} 2`
          echo.style.strokeDashoffset = String(-(pulse.end > pulse.start ? position - length : position))
          aimFade(pulse.fades[index + 1], pulse.line, position - pulse.direction * length, position)
          const reveal = pulse.psychedelic ? smooth((progress - .5) / .35) : 1
          if (spectralColor && echo.dataset.spectrumFrom) {
            const spectrum = `color-mix(in oklab, ${echo.dataset.spectrumFrom} ${(1 - smooth(t)) * 100}%, ${echo.dataset.spectrumTo})`
            for (const stop of pulse.fades[index + 1].children) (stop as SVGStopElement).style.stopColor = spectrum
          }
          echo.style.opacity = String(envelope(t) * brightness * afterimages * (pulse.psychedelic ? .8 : .38) / (index + 1) * reveal)
        })
        return true
      })

      // Sample contacts frequently enough to catch the fast launch of each pulse.
      if (!awaitingAnswer && time - lastCollision >= 16) {
        lastCollision = time
        // Existing reactions get the first chance to continue before new sources start chains.
        const active: { path: SVGPathElement; trail: Trail }[] = transfers.filter(pulse => pulse.passage === passage && time >= pulse.born && time - pulse.born < pulse.duration).map(pulse => ({ path: pulse.path, trail: pulse }))
        const targets = active.length ? geometry() : []

        for (const { path, trail } of active) {
          const matrix = path.getScreenCTM()
          if (!matrix) continue
          const local = path.getPointAtLength(path.getTotalLength() * trail.position)
          const head = { x: matrix.a * local.x + matrix.c * local.y + matrix.e, y: matrix.b * local.x + matrix.d * local.y + matrix.f }
          const previous = trail.previous || head
          trail.previous = head
          if (transfers.length >= pulseLimit()) continue
          const tailPosition = Math.max(0, Math.min(1, trail.position - trail.direction * trail.width))
          const litPoints = Array.from({ length: 5 }, (_, i) => {
            const p = path.getPointAtLength(path.getTotalLength() * (tailPosition + (trail.position - tailPosition) * i / 4))
            return { x: matrix.a * p.x + matrix.c * p.y + matrix.e, y: matrix.b * p.x + matrix.d * p.y + matrix.f }
          })
          for (const target of targets) {
            const { line, points, matrix: targetMatrix } = target
            if (!targetMatrix || trail.visited.has(line) || seeded.has(line)) continue
            // The faint base beneath an animated overlay is the same line, not a contact.
            if (line.path.getAttribute('d') === path.getAttribute('d') &&
              ['a', 'b', 'c', 'd', 'e', 'f'].every(key => Math.abs(matrix[key as keyof DOMMatrix] as number - (targetMatrix[key as keyof DOMMatrix] as number)) < .001)) continue
            let contact: number | null = null
            for (let i = 1; i < points.length; i++) {
              // A new SVG moveto is a gap, not a segment joining the subpaths.
              const p = line.points[i - 1], q = line.points[i]
              if (Math.hypot(q.x - p.x, q.y - p.y) > line.length / (points.length - 1) * 1.1) continue
              let hit = segmentContact(previous, head, points[i - 1], points[i])
              for (let j = 1; hit === null && j < litPoints.length; j++) hit = segmentContact(litPoints[j - 1], litPoints[j], points[i - 1], points[i])
              if (hit !== null) { contact = (i - 1 + hit) / (points.length - 1); break }
            }
            if (contact !== null) emit(line, contact, trail)
          }
        }
      }
      frame = requestAnimationFrame(tick)
    }

    function sync() {
      cancelAnimationFrame(frame)
      lastTime = 0
      const paused = media.matches || document.hidden || !visible
      svg!.toggleAttribute('data-story-paused', paused)
      if (media.matches) {
        clearTransfers()
        space.reset()
        resetBreath()
        sources.forEach(path => { path.style.opacity = '0' })
      }
      if (!paused) frame = requestAnimationFrame(tick)
    }
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    })
    // Observe the clipped scene, not overflowing SVG paths or the whole page.
    observer?.observe(svg.parentElement ?? svg)
    media.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    sync()
    // Route arrival waits for this before drawing the lines in.
    svg.setAttribute('data-story-ready', '')
    return () => {
      svg.removeAttribute('data-story-ready')
      cancelAnimationFrame(frame)
      observer?.disconnect()
      media.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
      clearTransfers()
      saveJourney()
      space.dispose()
      artRoutes.forEach(path => path.remove())
      fadeDefs.remove()
      resetBreath()
      window.removeEventListener('pagehide', saveJourney)
      sources.forEach(path => { path.style.opacity = ''; path.style.strokeDashoffset = '' })
      svg.removeAttribute('data-story-paused')
    }
  }, [ref, kind, tuning])
}
