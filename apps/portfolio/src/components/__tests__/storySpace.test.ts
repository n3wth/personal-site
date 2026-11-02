import { describe, expect, it } from 'vitest'
import { createStorySpace } from '../storySpace'

describe('story material reset', () => {
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
