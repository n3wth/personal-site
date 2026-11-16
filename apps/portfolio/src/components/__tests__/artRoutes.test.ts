import { describe, expect, it } from 'vitest'
import { measurePath } from '../artRoutes'

describe('art route path measurement', () => {
  it('measures straight runs and a closing segment', () => {
    const square = measurePath('M 0 0 H 10 V 10 L 0 10 Z')
    expect(square.length).toBe(40)
    expect(square.pointAt(15)).toEqual({ x: 10, y: 5 })
    expect(square.pointAt(35)).toEqual({ x: 0, y: 5 })
  })

  it('clamps distances to the ends of the path', () => {
    const line = measurePath('M 2 3 L 12 3')
    expect(line.pointAt(-5)).toEqual({ x: 2, y: 3 })
    expect(line.pointAt(50)).toEqual({ x: 12, y: 3 })
  })

  it('follows a cubic curve through its midpoint', () => {
    const arch = measurePath('M 0 0 C 0 -100, 100 -100, 100 0')
    const middle = arch.pointAt(arch.length / 2)
    expect(middle.x).toBeCloseTo(50, 1)
    expect(middle.y).toBeCloseTo(-75, 1)
  })

  it('reflects the previous quadratic control for a smooth continuation', () => {
    const wave = measurePath('M 0 0 Q 50 -50 100 0 T 200 0')
    const trough = wave.pointAt(wave.length * .75)
    expect(trough.x).toBeCloseTo(150, 0)
    expect(trough.y).toBeCloseTo(25, 0)
  })
})
