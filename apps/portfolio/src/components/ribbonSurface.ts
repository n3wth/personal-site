export type RibbonVector = readonly [number, number, number]
const add = (a: RibbonVector, b: RibbonVector): RibbonVector => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const mul = (a: RibbonVector, n: number): RibbonVector => [a[0] * n, a[1] * n, a[2] * n]
const sub = (a: RibbonVector, b: RibbonVector) => add(a, mul(b, -1))
const dot = (a: RibbonVector, b: RibbonVector) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: RibbonVector, b: RibbonVector): RibbonVector => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const unit = (a: RibbonVector) => mul(a, 1 / Math.hypot(...a))
const mix = (a: RibbonVector, b: RibbonVector, t: number) => add(mul(a, 1 - t), mul(b, t))
export const ribbonEase = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t) }

const curves: readonly (readonly RibbonVector[])[] = [
  [[-180, 930, 0], [70, 1010, -80], [610, 750, -120], [540, 380, -40]],
  [[540, 380, -40], [470, 10, 40], [190, 360, 180], [460, 345, 180]],
  [[460, 345, 180], [730, 330, 180], [720, 710, 80], [1040, 630, -120]],
  [[1040, 630, -120], [1360, 550, -320], [1230, 210, -240], [1760, 235, 0]],
]

function center(u: number) {
  const clamped = Math.max(0, Math.min(1, u))
  const index = Math.min(3, Math.floor(clamped * 4)), t = clamped * 4 - index, q = 1 - t
  const [a, b, c, d] = curves[index]
  const point = add(add(mul(a, q ** 3), mul(b, 3 * q * q * t)), add(mul(c, 3 * q * t * t), mul(d, t ** 3)))
  const tangent = mul(add(add(mul(sub(b, a), q * q), mul(sub(c, b), 2 * q * t)), mul(sub(d, c), t * t)), 12)
  return { point: add(point, mul(tangent, u - clamped)), tangent: unit(tangent) }
}

// Parallel transport avoids the frame flips that a curvature-based ribbon develops at straight sections.
const frames: RibbonVector[] = []
let previousTangent = center(0).tangent
frames.push(unit(cross([0, 0, 1], previousTangent)))
for (let i = 1; i <= 128; i++) {
  const tangent = center(i / 128).tangent, axis = cross(previousTangent, tangent), previous = frames[i - 1]
  const transported = add(add(previous, cross(axis, previous)), mul(cross(axis, cross(axis, previous)), 1 / (1 + dot(previousTangent, tangent))))
  frames.push(unit(sub(transported, mul(tangent, dot(transported, tangent)))))
  previousTangent = tangent
}

export function ribbonSection(u: number, time = 0) {
  const { point, tangent } = center(u), position = Math.max(0, Math.min(128, u * 128)), index = Math.min(127, Math.floor(position))
  const transported = mix(frames[index], frames[index + 1], position - index)
  const across = unit(sub(transported, mul(tangent, dot(transported, tangent)))), normal = cross(tangent, across)
  const twist = .7 * Math.sin(u * Math.PI * 2) + ribbonEase((time - 12) / 24) * .45 * Math.sin(u * Math.PI * 2 - time * .07)
  const direction = add(mul(across, Math.cos(twist)), mul(normal, Math.sin(twist)))
  const halfWidth = 155 + 25 * Math.sin(u * Math.PI) ** 2
  return { center: point, tangent, direction, halfWidth, normal: cross(tangent, direction) }
}

export function ribbonPoint(u: number, across: number, time = 0): RibbonVector {
  const section = ribbonSection(u, time)
  return add(section.center, mul(section.direction, across * section.halfWidth))
}

export function ribbonCamera(time: number) {
  const depth = ribbonEase((time - 8) / 22), x = Math.sin(time * .09) * .42 * depth, y = Math.sin(time * .061) * .55 * depth
  const z = Math.sin(time * .047) * (.035 + depth * .12), cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y), cz = Math.cos(z), sz = Math.sin(z)
  const horizontal: RibbonVector = [cz * cy - sz * sx * sy, -sz * cx, cz * sy + sz * sx * cy]
  const vertical: RibbonVector = [sz * cy + cz * sx * sy, cz * cx, sz * sy - cz * sx * cy]
  const forward = cross(horizontal, vertical), viewpoint = ribbonEase(.5 - .5 * Math.cos(time * Math.PI * 2 / 88))
  const focus: RibbonVector = [793 + depth * (viewpoint - .5) * 520, 496 + depth * (viewpoint - .5) * 240, 0]
  return {
    project(point: RibbonVector): RibbonVector {
      const relative = sub(point, focus)
      return [793 + Math.sin(time * .13) * 22 + dot(relative, horizontal), 496 + Math.sin(time * .11) * 16 + dot(relative, vertical), dot(relative, forward)]
    },
    facing(normal: RibbonVector) { return dot(normal, forward) },
  }
}

const knots = [-2, -1, -.5, ...Array.from({ length: 49 }, (_, i) => i / 48), 1.5, 2, 3]
const xy = (point: RibbonVector) => `${point[0].toFixed(2)} ${point[1].toFixed(2)}`

export function ribbonFrame(time = 0) {
  const camera = ribbonCamera(time)
  const sections = knots.map(u => {
    const section = ribbonSection(u, time), before = ribbonSection(u - .0001, time), after = ribbonSection(u + .0001, time)
    return Array.from({ length: 40 }, (_, i) => {
      const v = i / 39 * 2 - 1
      const point = camera.project(add(section.center, mul(section.direction, v * section.halfWidth)))
      const p = camera.project(add(before.center, mul(before.direction, v * before.halfWidth))), q = camera.project(add(after.center, mul(after.direction, v * after.halfWidth)))
      return { point, derivative: mul(sub(q, p), 5000) }
    })
  })
  const edge = (patch: number, strand: number) => {
    const a = sections[patch][strand], b = sections[patch + 1][strand], span = (knots[patch + 1] - knots[patch]) / 3
    return { a: a.point, b: b.point, c: add(a.point, mul(a.derivative, span)), d: sub(b.point, mul(b.derivative, span)) }
  }
  const command = (patch: number, strand: number) => {
    const { a, b, c, d } = edge(patch, strand)
    return `M ${xy(a)} C ${xy(c)} ${xy(d)} ${xy(b)}`
  }
  const patches = knots.slice(0, -1).map((u, index) => {
    const left = edge(index, 0), right = edge(index, 39), middle = (u + knots[index + 1]) / 2, section = ribbonSection(middle, time)
    return {
      index, u: middle, depth: camera.project(section.center)[2], facing: camera.facing(section.normal),
      surface: `${command(index, 0)} L ${xy(right.b)} C ${xy(right.d)} ${xy(right.c)} ${xy(right.a)} Z`,
      strands: Array.from({ length: 40 }, (_, i) => command(index, i)).join(' '),
      accents: [5, 17, 29].map(i => command(index, i)).join(' '),
      exposure: Math.min(1, Math.hypot(left.a[0] - right.a[0], left.a[1] - right.a[1]) / (section.halfWidth * 2)),
    }
  })
  return {
    patches,
    echoes: [4, 10, 16, 22, 28, 34].map(strand => knots.slice(0, -1).map((_, patch) => command(patch, strand)).join(' ')),
  }
}
