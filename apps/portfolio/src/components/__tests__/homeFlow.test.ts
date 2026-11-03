import { describe, expect, it, vi } from 'vitest'
import { ribbonFrame, ribbonPoint, ribbonSection } from '../ribbonSurface'
import { createHomeFlow } from '../homeFlow'
import { crossing } from '../storyInteractions'

describe('continuous ribbon surface', () => {
  it('keeps a perpendicular, constant-width frame through the bend', () => {
    for (const time of [0, 10, 20, 30, 40]) for (let u = 0; u <= 1; u += .005) {
      const section = ribbonSection(u, time), a = ribbonPoint(u, -1, time), b = ribbonPoint(u, 1, time)
      expect(Math.hypot(...section.direction)).toBeCloseTo(1)
      expect(section.direction.reduce((sum, value, i) => sum + value * section.tangent[i], 0)).toBeCloseTo(0)
      expect(Math.hypot(...a.map((value, i) => value - b[i]))).toBeCloseTo(220)
    }
    expect(Math.abs(ribbonPoint(.4, 1)[2] - ribbonPoint(.4, -1)[2])).toBeGreaterThan(10)
  })

  it('keeps strands separated and prevents the inner edge from doubling back', () => {
    const h = .0001
    for (const time of [0, 10, 20, 30, 40]) for (let u = .002; u < .999; u += .004) {
      const a = ribbonSection(u - h).center, b = ribbonSection(u + h).center, section = ribbonSection(u, time)
      const dx = b[0] - a[0], dy = b[1] - a[1]
      const gap = Math.abs(dx * section.direction[1] - dy * section.direction[0]) / Math.hypot(dx, dy) * 220 / 27
      expect(gap).toBeGreaterThan(7)
      for (const across of [-1, 1]) {
        const p = ribbonPoint(u - h, across, time), q = ribbonPoint(u + h, across, time)
        expect(((q[0] - p[0]) * dx + (q[1] - p[1]) * dy) / (dx * dx + dy * dy)).toBeGreaterThan(.3)
      }
    }
  })

  it('has one crossing with the outgoing sweep safely in front of the incoming tail', () => {
    const points = Array.from({ length: 201 }, (_, i) => ribbonSection(i / 200).center)
    const xy = (p: readonly number[]) => ({ x: p[0], y: p[1] })
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

  it('moves immediately and smoothly while keeping both ends offscreen', () => {
    expect(ribbonPoint(.4, 1, 1)).not.toEqual(ribbonPoint(.4, 1, 0))
    for (let time = 0; time <= 120; time += .5) {
      for (const across of [-1, 0, 1]) {
        expect(ribbonPoint(-2, across, time)[0]).toBeLessThan(0)
        expect(ribbonPoint(3, across, time)[0]).toBeGreaterThan(1586)
      }
      const a = ribbonPoint(.4, .6, time), b = ribbonPoint(.4, .6, time + 1 / 30)
      expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeLessThan(1)
    }
  })

  it('draws continuous strands with one continuous foreground surface', () => {
    for (const time of [0, 12, 32, 64, 98, 180]) {
      const frame = ribbonFrame(time)
      expect(frame.strands.match(/M /g)).toHaveLength(28)
      expect(frame.foreground.match(/M /g)).toHaveLength(28)
      expect(frame.surface.match(/M /g)).toHaveLength(1)
      expect(/NaN|Infinity/.test(Object.values(frame).join(' '))).toBe(false)
    }
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
    expect(svg.querySelector('.home-ribbon__strands')?.getAttribute('d')).toBe(ribbonFrame().strands)
  })

  it('draws at a steady 30fps on a rounded 60Hz clock', () => {
    const host = document.createElement('div')
    host.innerHTML = '<svg><path class="home-ribbon__skin"/></svg>'
    const svg = host.querySelector('svg')!, flow = createHomeFlow(svg), writes = vi.spyOn(svg.querySelector('path')!, 'setAttribute')
    for (let frame = 0; frame <= 120; frame++) {
      const before = writes.mock.calls.length
      flow.update(Math.round(frame / 60 * 10_000) / 10_000)
      expect(writes.mock.calls.length - before).toBe(frame % 2 === 0 ? 1 : 0)
    }
    writes.mockRestore()
  })
})
