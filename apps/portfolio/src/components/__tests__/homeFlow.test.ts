import { describe, expect, it } from 'vitest'
import { ribbonCamera, ribbonFrame, ribbonPoint, ribbonSection } from '../ribbonSurface'
import { createHomeFlow } from '../homeFlow'

describe('continuous ribbon surface', () => {
  it('carries a perpendicular width frame through folds without changing its width', () => {
    for (const time of [0, 32, 90]) for (let u = 0; u <= 1; u += .005) {
      const section = ribbonSection(u, time), a = ribbonPoint(u, -1, time), b = ribbonPoint(u, 1, time)
      expect(Math.hypot(...section.direction)).toBeCloseTo(1)
      expect(section.direction.reduce((sum, value, i) => sum + value * section.tangent[i], 0)).toBeCloseTo(0)
      expect(Math.hypot(...a.map((value, i) => value - b[i]))).toBeCloseTo(section.halfWidth * 2)
    }
    expect(Math.abs(ribbonPoint(.4, 1)[2] - ribbonPoint(.4, -1)[2])).toBeGreaterThan(30)
  })

  it('keeps the ends offscreen and projected motion continuous', () => {
    for (let time = 0; time <= 420; time += .5) {
      const camera = ribbonCamera(time)
      for (const across of [-1, 0, 1]) {
        expect(camera.project(ribbonPoint(-2, across, time))[0]).toBeLessThan(0)
        expect(camera.project(ribbonPoint(3, across, time))[0]).toBeGreaterThan(1586)
      }
      const a = camera.project(ribbonPoint(.4, .6, time)), b = ribbonCamera(time + 1 / 30).project(ribbonPoint(.4, .6, time + 1 / 30))
      expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeLessThan(4)
    }
  })

  it('uses finite, connected cubic segments and a fixed surface pool', () => {
    for (const time of [0, 12, 32, 64, 98, 180]) {
      const { patches } = ribbonFrame(time)
      expect(patches).toHaveLength(54)
      expect(patches.every(patch => !/NaN|Infinity/.test(patch.surface + patch.strands))).toBe(true)
      expect(patches.every(patch => patch.strands.match(/M /g)?.length === 40)).toBe(true)
    }
  })

  it('reunites echoes and resets to the calm opening geometry', () => {
    const host = document.createElement('div')
    host.className = 'home-opening-scene'
    host.innerHTML = '<svg><path class="home-contours__echo"/><path class="home-contours__echo"/><g data-home-plane><g data-ribbon-patch="0"><path/><path/><path/></g></g></svg>'
    const svg = host.querySelector('svg')!, flow = createHomeFlow(svg), echo = svg.querySelector<SVGPathElement>('.home-contours__echo')!
    flow.update(32)
    expect(Number(echo.style.opacity)).toBeGreaterThan(0)
    flow.update(64)
    expect(echo.style.opacity).toBe('0')
    flow.reset()
    expect(svg.querySelector('[data-ribbon-patch] path')?.getAttribute('d')).toBe(ribbonFrame().patches[0].surface)
  })
})
