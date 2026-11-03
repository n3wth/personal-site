import { describe, expect, it } from 'vitest'
import { createHomeFlow, homeContour, homeProjection } from '../homeFlow'

describe('continuous vector flow', () => {
  it('moves between viewpoints without abrupt position changes', () => {
    let previous: number[] | undefined
    for (let time = 0; time <= 180; time += 1 / 30) {
      const [a, b, c, d, e, f] = homeProjection(time)
      const point = [a * 460 + c * 180 + e, b * 460 + d * 180 + f]
      if (previous) expect(Math.hypot(point[0] - previous[0], point[1] - previous[1])).toBeLessThan(4)
      previous = point
    }
  })

  it('keeps both ends outside the view throughout the projected and expanded phases', () => {
    for (let time = 0; time <= 420; time += 2) {
      for (const scale of [1, 1.5]) {
        const [a, b, c, d, e] = homeProjection(time, scale)
        expect(a * d - b * c).toBeGreaterThan(.7)
        for (let i = 0; i < 40; i++) {
          const { start, end } = homeContour((i / 39) ** 1.35)
          expect(a * start.x + c * start.y + e).toBeLessThan(0)
          expect(a * end.x + c * end.y + e).toBeGreaterThan(1586)
        }
      }
    }
  })

  it('lets the past and future copies diverge, then quietly reunites them', () => {
    const host = document.createElement('div')
    host.className = 'home-opening-scene'
    host.innerHTML = '<svg><use class="home-contours__echo"/><use class="home-contours__echo"/><g data-home-plane/></svg>'
    const svg = host.querySelector('svg')!
    const flow = createHomeFlow(svg)
    const plane = svg.querySelector('[data-home-plane]')!
    const echo = svg.querySelector<SVGUseElement>('use')!
    flow.update(32)
    expect(echo.getAttribute('transform')).not.toBe(plane.getAttribute('transform'))
    flow.update(64)
    expect(echo.getAttribute('transform')).toBe(plane.getAttribute('transform'))
    expect(echo.style.opacity).toBe('0')
    flow.reset()
    expect(plane.hasAttribute('transform')).toBe(false)
  })
})
