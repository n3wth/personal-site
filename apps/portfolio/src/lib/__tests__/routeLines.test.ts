import { describe, expect, it } from 'vitest'
import { storyKindFromPath } from '../routeLines'

describe('story routes', () => {
  it('recognizes only the six section paths', () => {
    expect(storyKindFromPath('/projects')).toBe('projects')
    expect(storyKindFromPath('/projects/')).toBe('projects')
    expect(storyKindFromPath('/projects/r3')).toBeNull()
    expect(storyKindFromPath('/')).toBeNull()
    expect(storyKindFromPath('/thinking/frameworks/5-whys')).toBeNull()
  })
})
