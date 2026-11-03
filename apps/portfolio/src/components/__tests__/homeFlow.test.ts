import { describe, expect, it, vi } from 'vitest'
import { ribbonFrame, ribbonPoint, ribbonSection } from '../ribbonSurface'
import { createHomeFlow } from '../homeFlow'
import { crossing } from '../storyInteractions'

describe('continuous ribbon surface', () => {
  it('keeps a perpendicular, constant-width frame through the bend', () => {
    for (let u = 0; u <= 1; u += .005) {
      const section = ribbonSection(u), a = ribbonPoint(u, -1), b = ribbonPoint(u, 1)
      expect(Math.hypot(...section.direction)).toBeCloseTo(1)
      expect(section.direction.reduce((sum, value, i) => sum + value * section.tangent[i], 0)).toBeCloseTo(0)
      expect(Math.hypot(...a.map((value, i) => value - b[i]))).toBeCloseTo(220)
    }
    expect(Math.abs(ribbonPoint(.4, 1)[2] - ribbonPoint(.4, -1)[2])).toBeGreaterThan(10)
  })

  it('keeps strands separated and prevents the inner edge from doubling back', () => {
    const h = .0001
    for (let u = .002; u < .999; u += .004) {
      const a = ribbonSection(u - h).center, b = ribbonSection(u + h).center, section = ribbonSection(u)
      const dx = b[0] - a[0], dy = b[1] - a[1]
      const gap = Math.abs(dx * section.direction[1] - dy * section.direction[0]) / Math.hypot(dx, dy) * 220 / 27
      expect(gap).toBeGreaterThan(7)
      for (const across of [-1, 1]) {
        const p = ribbonPoint(u - h, across), q = ribbonPoint(u + h, across)
        expect(((q[0] - p[0]) * dx + (q[1] - p[1]) * dy) / (dx * dx + dy * dy)).toBeGreaterThan(.3)
      }
    }
  })

  it('has one crossing with the outgoing sweep safely in front of the incoming tail', () => {
    const xy = (p: readonly number[]) => ({ x: p[0], y: p[1] })
    const points = Array.from({ length: 201 }, (_, i) => ribbonSection(i / 200).center)
    let count = 0
    for (let i = 0; i < 100; i++) for (let j = 100; j < 200; j++) {
      if (j - i < 12) continue
      const hit = crossing(xy(points[i]), xy(points[i + 1]), xy(points[j]), xy(points[j + 1]))
      if (!hit) continue
      count++
      const rear = (i + hit.first) / 200, front = (j + hit.second) / 200
      for (const offset of [-.06, 0, .06]) for (const other of [-.06, 0, .06]) {
        expect(ribbonSection(front + offset).center[2] - ribbonSection(rear + other).center[2]).toBeGreaterThan(220)
      }
    }
    expect(count).toBe(1)
  })

  it('keeps both ends offscreen', () => {
    for (const across of [-1, 0, 1]) {
      expect(ribbonPoint(-2, across)[0]).toBeLessThan(0)
      expect(ribbonPoint(3, across)[0]).toBeGreaterThan(1586)
    }
  })

  it('draws continuous strands with one continuous foreground surface', () => {
    const frame = ribbonFrame()
    expect(frame.strands.match(/M /g)).toHaveLength(28)
    expect(frame.foreground.match(/M /g)).toHaveLength(28)
    expect(frame.surface.match(/M /g)).toHaveLength(1)
    expect(frame.flow).toHaveLength(6)
    expect(/NaN|Infinity/.test(JSON.stringify(frame))).toBe(false)
  })

  it('returns to the calm opening for reduced motion', () => {
    const host = document.createElement('div')
    host.className = 'home-opening-scene'
    host.innerHTML = '<svg><g data-home-plane><path class="home-ribbon__strands"/><path class="home-ribbon__skin"/><path class="home-ribbon__front"/></g></svg>'
    const svg = host.querySelector('svg')!, flow = createHomeFlow(svg)
    flow.update(0)
    const opening = host.style.backgroundColor
    flow.update(32)
    expect(host.style.backgroundColor).not.toBe(opening)
    flow.reset()
    expect(host.style.backgroundColor).toBe(opening)
    expect(svg.style.getPropertyValue('--home-flow-offset')).toBe('0px')
  })

  it('advects at a steady 60fps without rewriting geometry', () => {
    const host = document.createElement('div')
    host.innerHTML = '<svg><path class="home-ribbon__skin"/></svg>'
    const svg = host.querySelector('svg')!, flow = createHomeFlow(svg), writes = vi.spyOn(svg.style, 'setProperty')
    const geometry = vi.spyOn(svg.querySelector('path')!, 'setAttribute')
    for (let frame = 0; frame <= 240; frame++) {
      const before = writes.mock.calls.length
      flow.update(Math.round(frame / 120 * 10_000) / 10_000)
      expect(writes.mock.calls.length - before).toBe(frame % 2 === 0 ? 1 : 0)
    }
    expect(svg.style.getPropertyValue('--home-flow-offset')).toBe('-520px')
    expect(geometry).not.toHaveBeenCalled()
    writes.mockRestore()
  })

  it('aligns the travelling material across the hidden crossing', () => {
    const host = document.createElement('div')
    host.innerHTML = '<svg><path data-home-flow-full="0"/><path data-home-flow-front="0"/></svg>'
    const svg = host.querySelector('svg')!, paths = svg.querySelectorAll('path')
    Object.assign(paths[0], { getTotalLength: () => 1000 })
    Object.assign(paths[1], { getTotalLength: () => 400 })
    const flow = createHomeFlow(svg)
    expect(svg.hasAttribute('data-home-flow-ready')).toBe(true)
    expect(paths[1].style.getPropertyValue('--home-flow-prefix')).toBe('600px')
    flow.update(1)
    const first = parseFloat(svg.style.getPropertyValue('--home-flow-offset'))
    flow.update(2)
    expect(parseFloat(svg.style.getPropertyValue('--home-flow-offset'))).toBeLessThan(first)
  })

  it('keeps flow moving without rewriting colors during a palette hold', () => {
    const host = document.createElement('div')
    host.innerHTML = '<svg><g data-home-plane/></svg>'
    const svg = host.querySelector('svg')!, plane = svg.querySelector('g')!
    const flow = createHomeFlow(svg), colors = vi.spyOn(plane.style, 'setProperty')
    flow.update(3)
    const first = svg.style.getPropertyValue('--home-flow-offset')
    flow.update(4)
    expect(colors).toHaveBeenCalledTimes(1)
    expect(svg.style.getPropertyValue('--home-flow-offset')).not.toBe(first)
    flow.update(6)
    expect(colors).toHaveBeenCalledTimes(2)
    flow.reset()
    expect(colors).toHaveBeenCalledTimes(3)
  })

  it('retains the still ribbon when native metrics fail', () => {
    const host = document.createElement('div')
    host.innerHTML = '<svg><path data-home-flow-full="0"/><path data-home-flow-front="0"/></svg>'
    const svg = host.querySelector('svg')!
    Object.assign(svg.querySelector('path')!, { getTotalLength: () => { throw new Error('unavailable') } })
    expect(() => createHomeFlow(svg).update(1)).not.toThrow()
    expect(svg.hasAttribute('data-home-flow-ready')).toBe(false)
  })
})
