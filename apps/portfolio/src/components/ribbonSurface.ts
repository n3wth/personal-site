export type RibbonVector = readonly [number, number, number]
const add = (a: RibbonVector, b: RibbonVector): RibbonVector => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const mul = (a: RibbonVector, n: number): RibbonVector => [a[0] * n, a[1] * n, a[2] * n]
const sub = (a: RibbonVector, b: RibbonVector) => add(a, mul(b, -1))
const cross = (a: RibbonVector, b: RibbonVector): RibbonVector => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const unit = (a: RibbonVector) => mul(a, 1 / Math.hypot(...a))
export const ribbonEase = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t) }

const curves: readonly (readonly RibbonVector[])[] = [
  [[-180, 1000, -200], [200, 1000, -200], [700, 700, -200], [700, 400, -150]],
  [[700, 400, -150], [700, 100, -100], [300, 100, 100], [300, 400, 150]],
  [[300, 400, 150], [300, 700, 200], [700, 700, 200], [1040, 550, 100]],
  [[1040, 550, 100], [1380, 400, 0], [1350, 100, 0], [1760, 100, 0]],
]

function center(u: number) {
  const clamped = Math.max(0, Math.min(1, u))
  const index = Math.min(3, Math.floor(clamped * 4)), t = clamped * 4 - index, q = 1 - t
  const [a, b, c, d] = curves[index]
  const point = add(add(mul(a, q ** 3), mul(b, 3 * q * q * t)), add(mul(c, 3 * q * t * t), mul(d, t ** 3)))
  const tangent = mul(add(add(mul(sub(b, a), q * q), mul(sub(c, b), 2 * q * t)), mul(sub(d, c), t * t)), 12)
  return { point: add(point, mul(tangent, u - clamped)), tangent: unit(tangent) }
}

export function ribbonSection(u: number, time = 0) {
  const { point, tangent } = center(u)
  // The fixed viewing-axis frame prevents the strands from collapsing edge-on.
  const across = unit(cross([0, 0, 1], tangent)), normal = cross(tangent, across)
  const clamped = Math.max(0, Math.min(1, u))
  const twist = (.25 + .08 * Math.sin(time * .16)) * Math.sin(clamped * Math.PI * 2) * Math.sin(clamped * Math.PI) ** 2
  const direction = add(mul(across, Math.cos(twist)), mul(normal, Math.sin(twist)))
  const halfWidth = 110
  return { center: point, tangent, direction, halfWidth, normal: cross(tangent, direction) }
}

export function ribbonPoint(u: number, across: number, time = 0): RibbonVector {
  const section = ribbonSection(u, time)
  return add(section.center, mul(section.direction, across * section.halfWidth))
}

const knots = [-2, ...Array.from({ length: 49 }, (_, i) => i / 48), 3]
const xy = (point: RibbonVector) => `${point[0].toFixed(2)} ${point[1].toFixed(2)}`

export function ribbonFrame(time = 0) {
  const sample = (u: number) => {
    const section = ribbonSection(u, time)
    return { point: section.center, width: mul(section.direction, section.halfWidth) }
  }
  const sections = knots.map(u => {
    const section = sample(u), before = sample(u - .0001), after = sample(u + .0001)
    const derivative = mul(sub(after.point, before.point), 5000), widthDerivative = mul(sub(after.width, before.width), 5000)
    // Orthographic projection is affine across the ribbon's width.
    return Array.from({ length: 28 }, (_, i) => {
      const v = i / 27 * 2 - 1
      return { point: add(section.point, mul(section.width, v)), derivative: add(derivative, mul(widthDerivative, v)) }
    })
  })
  const edge = (patch: number, strand: number) => {
    const a = sections[patch][strand], b = sections[patch + 1][strand], span = (knots[patch + 1] - knots[patch]) / 3
    return { a: a.point, b: b.point, c: add(a.point, mul(a.derivative, span)), d: sub(b.point, mul(b.derivative, span)) }
  }
  const commands = Array.from({ length: 28 }, (_, strand) => knots.slice(0, -1).map((_, patch) => {
    const { b, c, d } = edge(patch, strand)
    return `C ${xy(c)} ${xy(d)} ${xy(b)}`
  }))
  const path = (start: number) => commands.map((curve, strand) => `M ${xy(sections[start][strand].point)} ${curve.slice(start).join(' ')}`).join(' ')
  // shortcut: fixed overlap order requires this frontal view; use surface clipping before adding camera rotation.
  const front = knots.indexOf(.5)
  const right = knots.slice(front, -1).map((_, i) => {
    const { a, c, d } = edge(front + i, 27)
    return `C ${xy(d)} ${xy(c)} ${xy(a)}`
  }).reverse().join(' ')
  return {
    strands: path(0),
    surface: `M ${xy(sections[front][0].point)} ${commands[0].slice(front).join(' ')} L ${xy(sections.at(-1)![27].point)} ${right} Z`,
    foreground: path(front),
  }
}
