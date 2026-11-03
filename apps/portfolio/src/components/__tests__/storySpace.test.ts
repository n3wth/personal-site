import { describe, expect, it } from 'vitest'
import { createStorySpace } from '../storySpace'

describe('story material reset', () => {
  it('starts the homepage without a surge and clears its later color field', () => {
    const host = document.createElement('div')
    host.className = 'home-opening-scene'
    host.innerHTML = '<svg></svg>'
    const space = createStorySpace(host.querySelector('svg')!, 'home', .55, .5)
    space.update(0)
    const opening = host.style.backgroundColor
    space.startPattern(0, 1, 'red', 0, new Set([0]), 0, false, 'return')
    space.update(32)
    expect(host.style.backgroundColor).not.toBe(opening)
    space.reset()
    expect(host.style.getPropertyValue('--home-surge')).toBe('')
    expect(host.style.getPropertyValue('--home-surge-color')).toBe('')
  })

  it('returns animated faces to stylesheet colors for reduced motion', () => {
    const host = document.createElement('div')
    host.innerHTML = '<svg><path data-story-face="0" data-face-shade="1" /></svg>'
    const svg = host.querySelector('svg')!
    const face = svg.querySelector('path')!
    const space = createStorySpace(svg, 'projects', .55, .5)
    space.update(30)
    expect(face.style.fill).not.toBe('')
    space.reset()
    expect(face.style.fill).toBe('')
    expect(face.style.fillOpacity).toBe('')
    space.dispose()
    expect(face.style.fill).toBe('')
  })
})
