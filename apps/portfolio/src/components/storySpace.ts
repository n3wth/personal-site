import { groundLag, harmonyColor, harmonySeconds, paintHarmonyPhase, type HarmonyRole } from './harmony'

const storageKey = 'n3wth-story-journey'
const paletteSpace = typeof CSS !== 'undefined' && CSS.supports?.('color', 'color-mix(in oklab, red, blue)') ? 'oklab' : 'srgb'
export type StoryAccent = 'return' | 'depth' | 'suspend' | null
export const storyEnergy = (time: number) => .12 + .88 * (.5 + .28 * Math.cos(time * .09) + .22 * Math.cos(time * .047 + 1)) ** 2
export const storyChaos = (time: number) => Math.max(0, Math.sin(time * .067 + 1)) ** 2
export function storyColor(time: number, offset = 0, role: HarmonyRole = 'ink') {
  return harmonyColor(role, time / harmonySeconds + offset)
}
export function pulseEnvelope(t: number, smoothing: number) {
  const smooth = (n: number) => { const x = Math.max(0, Math.min(1, n)); return x * x * (3 - 2 * x) }
  return smooth(t / (.16 + smoothing * .24)) * (1 - smooth((t - (.7 - smoothing * .12)) / (.3 + smoothing * .12)))
}
const profiles: Record<string, { speed: number; gap: number; chorus: number }> = {
  art: { speed: 1, gap: 1.4, chorus: .25 },
  thinking: { speed: 1.4, gap: 2, chorus: .08 },
  work: { speed: .8, gap: 1.6, chorus: .1 },
  projects: { speed: .7, gap: 1.2, chorus: .15 },
  library: { speed: 1.5, gap: 2.8, chorus: .04 },
  contact: { speed: 1.1, gap: 1.8, chorus: .18 },
}

/** A tab-local clock and palette connect the scenes without changing navigation. */
let documentJourney: { epoch: number; color: number } | undefined
export function readStoryJourney() {
  if (documentJourney) return documentJourney
  // The layout paints the ground before hydration from the same journey.
  const painted = (globalThis as { __storyJourney?: { epoch: number; color: number } }).__storyJourney
  if (painted && Number.isFinite(painted.epoch) && Number.isFinite(painted.color)) return documentJourney = painted
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) || 'null')
    if (navigation?.type !== 'reload' && Number.isFinite(value?.epoch) && Number.isFinite(value?.color)) {
      documentJourney = value as { epoch: number; color: number }
      return documentJourney
    }
  } catch { /* Storage is optional. */ }
  documentJourney = { epoch: Date.now() - Math.random() * 600000, color: Math.floor(Math.random() * 4) }
  return documentJourney
}

export function saveStoryJourney(journey: { epoch: number; color: number }) {
  documentJourney = journey
  try { sessionStorage.setItem(storageKey, JSON.stringify(journey)) } catch { /* Private browsing remains usable. */ }
}

/** Fixed geometry; light travels through the stack and shades each solid face. */
export function createStorySpace(svg: SVGSVGElement, kind: string, amount: number, smoothing: number) {
  const faces = [...svg.querySelectorAll<SVGPathElement>('[data-story-face]')]
  const borders = [...svg.querySelectorAll<SVGPathElement>('[data-story-border]')]
  const halos = [...svg.querySelectorAll<SVGPathElement>('[data-story-halo]')]
  const walls = [...svg.querySelectorAll<SVGPathElement>('[data-story-wall]')]
  let haloStart: number | undefined
  let nextHalo: number | undefined
  const backdrop = svg.closest<HTMLElement>('.portfolio-story-hero')
  let crescendo: { start: number; duration: number; color: string } | null = null
  const palette = ['cyan', 'green', 'yellow', 'red']
  const ink = (index: number) => `var(--story-color-${palette[index]})`
  type Light = { start: number; duration: number; color: string; coordinated: boolean; expansion?: boolean; accent?: StoryAccent }
  const lights = Array.from({ length: 9 }, () => ({ next: 0, events: [] as Light[] }))
  const outlines = [...svg.querySelectorAll<SVGPathElement>('[data-story-block] > path:not(.section-story__pulse), [data-story-light] path:not(.section-story__pulse):not(.section-story__contact-spectrum):not([data-art-loop]):not([data-art-route])')]
    .map(path => {
      const group = path.closest<SVGGElement>('[data-story-block], [data-story-light]')!
      return { path, stroke: path.style.stroke, fill: path.style.fill, fillOpacity: path.style.fillOpacity, layer: Number(group.dataset.storyBlock ?? group.dataset.storyLight) }
    })
  const atmosphere = { projects: 1, art: .8, work: .45, thinking: .55, library: .3, contact: .5 }[kind] ?? 0
  const attention = Array<number>(9).fill(0)
  const trace = Array<number>(9).fill(0)
  const phase = Math.random() * Math.PI * 2
  let lastAttentionTime: number | undefined
  let groundPainted = -Infinity
  const strength = (light: Light, time: number) => {
    const age = (time - light.start) / light.duration
    return age > 0 && age < 1 ? (light.coordinated ? pulseEnvelope(age, smoothing) : Math.sin(age * Math.PI) ** 2) : 0
  }
  let initialized = false
  let orderedUntil = 0
  const reset = () => {
    svg.style.filter = ''
    svg.style.color = ''
    if (backdrop) backdrop.style.backgroundColor = ''
    crescendo = null
    groundPainted = -Infinity
    outlines.forEach(({ path, stroke, fill, fillOpacity }) => { path.style.stroke = stroke; path.style.fill = fill; path.style.fillOpacity = fillOpacity })
    lastAttentionTime = undefined
    faces.forEach(face => { face.style.fill = ''; face.style.fillOpacity = ''; face.style.stroke = 'none' })
    borders.forEach(border => { border.style.opacity = '0'; border.removeAttribute('transform') })
    halos.forEach(halo => { halo.style.opacity = '0' })
    walls.forEach(wall => { wall.style.opacity = '0' })
    haloStart = nextHalo = undefined
  }
  reset()
  return {
    profile: profiles[kind] ?? profiles.art,
    affinity(layer: number) { return kind === 'projects' ? attention[layer] * .65 + trace[layer] * .35 : .45 },
    startPattern(time: number, duration: number, color: string, stagger: number, blocks: Set<number>, chaos: number, expansion = false, accent: StoryAccent = null, origin = 0) {
      if (accent === 'return') crescendo = { start: time + stagger + duration * 3.3, duration: Math.max(5, duration * 1.6), color }
      lights.forEach((light, index) => {
        if (!blocks.has(index)) return
        const independent = ink(index * 3 % palette.length)
        const tint = chaos > .001 ? `color-mix(in srgb, ${color} ${(1 - chaos) * 100}%, ${independent})` : color
        light.events.push({ start: time + Math.abs(index - origin) / 8 * stagger, duration, color: tint, coordinated: true, expansion, accent })
        if (accent === 'return') light.events.push({ start: time + stagger + duration * 3.5, duration: duration * .8, color: 'white', coordinated: true })
      })
      orderedUntil = time + stagger + duration * (accent === 'return' ? 4.5 : accent === 'suspend' ? 2 : 1)
      lights.forEach(light => { light.next = orderedUntil + 1 + Math.random() * 4 })
    },
    colorFor(path: SVGPathElement, time: number, planned = false) {
      const block = path.closest<SVGGElement>('[data-story-block]')
      if (!block) {
        const group = path.closest<SVGGElement>('[data-story-light]')
        return group && !planned && storyChaos(time) < .6 ? storyColor(time, (Number(group.dataset.storyLight) - 4) * .035) : null
      }
      const events = lights[Number(block.dataset.storyBlock)].events
      if (planned) return events.at(-1)?.color ?? null
      const active = events.filter(light => strength(light, time) > .05)
      active.sort((a, b) => strength(b, time) - strength(a, time))
      return active[0]?.color ?? null
    },
    update(time: number) {
      const energy = storyEnergy(time)
      if (halos.length) {
        nextHalo ??= time + 10 + Math.random() * 8
        if (time >= nextHalo) {
          haloStart = time
          nextHalo = time + 16 + 40 + Math.random() * 30
        }
        halos.forEach(halo => {
          const distance = Number(halo.dataset.storyHalo)
          const age = haloStart === undefined ? -1 : (time - haloStart - distance * 1.4) / 10
          halo.style.opacity = String(pulseEnvelope(age, .8) * (.55 - distance * .08))
          halo.style.stroke = storyColor(time, distance * .12, 'accent')
          const head = Math.max(0, Math.min(1, age))
          const tail = Math.min(.34, head)
          halo.style.strokeDasharray = `${Math.max(.0001, tail)} 2`
          halo.style.strokeDashoffset = String(-(head - tail))
        })
      }
      // Two wandering centers share neighboring edges; their wake guides later passages.
      const first = 4 + 3.5 * Math.sin(time * .021 + phase)
      const second = 4 + 3.5 * Math.sin(time * .016 + phase + 2.1)
      const delta = lastAttentionTime === undefined ? 0 : Math.min(.1, Math.max(0, time - lastAttentionTime))
      lastAttentionTime = time
      const meeting = Math.exp(-((first - second) ** 2) / 2)
      attention.forEach((_, layer) => {
        attention[layer] = Math.min(1, Math.exp(-((layer - first) ** 2) / 2) * .7 + Math.exp(-((layer - second) ** 2) / 2) * .5)
        trace[layer] += (attention[layer] - trace[layer]) * (1 - Math.exp(-delta / 12))
      })
      const ambientColor = storyColor(time - groundLag)
      const bloom = crescendo ? pulseEnvelope((time - crescendo.start) / crescendo.duration, .8) : 0
      // The page ground drifts too slowly to see a step; once a second spares the cascade.
      if (Math.abs(time - groundPainted) >= 1) {
        groundPainted = time
        paintHarmonyPhase((time - groundLag) / harmonySeconds)
      }
      if (backdrop) backdrop.style.backgroundColor = bloom > 0 ? `color-mix(in srgb, ${crescendo!.color} ${bloom * 65}%, var(--bg))` : ''
      svg.style.color = bloom > 0 ? `color-mix(in srgb, var(--bg) ${bloom * 100}%, color-mix(in srgb, var(--color-text-primary) 40%, var(--bg)))` : ''
      if (!initialized) {
        lights.forEach(light => { light.next = time + Math.random() * 5 })
        initialized = true
      }
      lights.forEach((light, layer) => {
        light.events = light.events.filter(event => time < event.start + event.duration * (event.accent === 'return' ? 4.5 : event.expansion ? 2.3 : 1))
        if (time < orderedUntil || time < light.next) return
        const duration = 1.8 + Math.random() * 2.7
        light.next = time + duration + 3 + Math.random() * 7 + (1 - energy) * 10 + (1 - attention[layer]) * 8
        const chaos = storyChaos(time)
        const related = storyColor(time, (layer - 4) * .035)
        const color = `color-mix(in ${paletteSpace}, ${related} ${(1 - chaos) * 100}%, ${ink(Math.floor(Math.random() * palette.length))})`
        light.events.push({ start: time, duration, color, coordinated: false })
      })
      const illumination = lights.map(light => Math.min(1, light.events.reduce((sum, event) => sum + strength(event, time), 0)))
      const dimension = Math.max(0, Math.sin(time * .035 + phase)) ** 6
      const tunnel = kind === 'art' ? .18 + .82 * Math.max(0, Math.sin(time * .047 + phase)) ** 4 : 0
      walls.forEach(wall => {
        const layer = Number(wall.dataset.storyWall)
        const wave = (.5 + .5 * Math.sin(time * .7 - layer * .65 * Math.sin(time * .019 + phase))) ** 3
        wall.style.fill = storyColor(time, layer * .32)
        wall.style.opacity = String(amount * (.025 + tunnel * wave * .65) * (1 - layer * .045))
      })
      outlines.forEach(({ path, layer }) => {
        const weight = (attention[layer] * .12 + trace[layer] * .08) * (1 - energy * .5)
        const quiet = `color-mix(in oklab, ${ambientColor} ${32 + atmosphere * 18 + weight * 100}%, currentColor)`
        // Neutral edges become ink over lit faces instead of muddy grey on color.
        const contrast = kind === 'projects' ? illumination[layer] * Math.min(1, amount * 1.8) : 0
        const near = kind === 'art' ? 1 - layer / 8 : kind === 'contact' ? Number(path.closest<SVGGElement>('[data-story-side]')?.dataset.storySide ?? 0) : layer / 8
        const depthInk = kind === 'projects' ? quiet : `color-mix(in srgb, var(--color-text-primary) ${dimension * near * 24}%, ${quiet})`
        const reflected = path.closest('[data-story-reflection]')
        const recession = kind === 'art' ? layer / 8 * 45 : 0
        const neutral = reflected ? `color-mix(in srgb, var(--bg) ${Math.max(recession, dimension * 45)}%, ${depthInk})` : `color-mix(in srgb, var(--bg) ${Math.max(recession, contrast * 88)}%, ${depthInk})`
        const direction = Math.sin(time * .019 + phase)
        const wave = (.5 + .5 * Math.sin(time * .7 - layer * .65 * direction - (reflected ? .6 : 0))) ** 3
        const spectral = tunnel * wave * (reflected ? .4 : .85)
        path.style.stroke = spectral > .001 ? `color-mix(in ${paletteSpace}, ${storyColor(time, layer * .32)} ${spectral * 100}%, ${neutral})` : neutral
        if ((kind === 'work' || kind === 'library') && /Z\s*$/i.test(path.getAttribute('d') ?? '')) {
          path.style.fill = storyColor(time - layer * 2)
          path.style.fillOpacity = String(.09 + dimension * amount * (.07 + near * .16) + illumination[layer] * amount * .2)
        }
      })
      faces.forEach(face => {
        const layer = Number(face.dataset.storyFace)
        const shade = Number(face.dataset.faceShade)
        let total = kind === 'projects' ? (attention[layer] * .045 + trace[layer] * .025) * (1 + meeting * .5) : 0
        let depth = 0, color = ambientColor
        for (const light of lights[layer].events) {
          const weight = strength(light, time)
          if (!weight) continue
          color = total ? `color-mix(in srgb, ${color} ${total / (total + weight) * 100}%, ${light.color})` : light.color
          total += weight
          if (light.accent === 'depth') depth = Math.max(depth, weight)
        }
        const sideDepth = depth * (1 - shade) * 1.3
        face.style.fill = sideDepth > .001 ? `color-mix(in srgb, var(--bg) ${sideDepth * 100}%, ${color})` : color
        face.style.fillOpacity = String(Math.min(1, total) * amount * (shade + (1.5 - 2 * shade) * depth))
      })
      const scale = borders.length ? Math.abs(svg.getScreenCTM()?.a || 1) : 1
      borders.forEach(border => {
        const side = Number(border.dataset.borderSide)
        const distance = Math.abs(side)
        const events = lights[Number(border.dataset.storyBorder)].events
        let brightness = 0
        border.removeAttribute('transform')
        for (const event of events) {
          if (!event.expansion) continue
          const elapsed = (time - event.start) / event.duration
          const returning = event.accent === 'return' && elapsed >= 2.3
          const age = elapsed - (returning ? 2.3 + (3 - distance) * .4 : distance * .45)
          const envelope = pulseEnvelope(age / 1.35, smoothing) / (1 + (distance - 1) * .5)
          if (envelope <= brightness) continue
          brightness = envelope
          const t = Math.max(0, Math.min(1, age / 1.1))
          const head = t * t * (3 - 2 * t)
          const tail = Math.min(.38, head)
          border.style.stroke = event.color
          border.style.strokeWidth = String(1.25 / scale)
          border.style.strokeDasharray = `${tail} 2`
          border.style.strokeDashoffset = String((side < 0) !== returning ? -(1 - head) : -(head - tail))
          if (returning) {
            const release = Math.max(0, Math.min(1, (age - .85) / .5))
            border.setAttribute('transform', `translate(${Math.sign(side) * release * release * 24} ${-release * release * 12})`)
          }
        }
        border.style.opacity = String(brightness)
      })
    },
    reset,
    dispose: reset,
  }
}
