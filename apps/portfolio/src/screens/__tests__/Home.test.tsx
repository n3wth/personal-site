import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import Home from '../Home'
import { Nav } from '../../components/Nav'

vi.mock('../../lib/analytics', () => ({ track: vi.fn() }))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('Contour homepage', () => {
  it.each([false, true])('keeps identity available (WebGL: %s)', (webgl) => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      webgl ? { getExtension: () => null, getParameter: () => 'hardware' } as unknown as WebGLRenderingContext : null
    )

    render(<><Nav /><Home /></>)

    expect(screen.getByRole('heading', { level: 1, name: 'Oliver Newth' })).toBeInTheDocument()
    expect(screen.getAllByText('Oliver Newth').length).toBeGreaterThan(0)
    for (const name of ['Work', 'Projects', 'Art', 'Thinking', 'Library', 'Contact']) {
      expect(screen.getByRole('link', { name, exact: true })).toHaveAttribute('href', `/${name.toLowerCase()}`)
    }
    expect(screen.queryByRole('navigation', { name: 'Scene destinations' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Explore my projects' })).toBeNull()
    expect(screen.queryByText('I build new ways to work with AI.')).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Site chapters' })).toBeNull()
    const landscape = screen.getByRole('region', { name: 'Contour landscape' })
    expect(landscape.querySelector('svg')).toBeInTheDocument()
    expect(landscape.querySelectorAll('.home-contours__current')).toHaveLength(4)
    expect(landscape.querySelectorAll('.home-contours__terrain path')).toHaveLength(40)
    expect(landscape.querySelector('img, image')).toBeNull()
    for (const path of landscape.querySelectorAll('.home-contours__current')) {
      expect([...landscape.querySelectorAll('.home-contours__terrain path')].some(contour => contour.getAttribute('d') === path.getAttribute('d'))).toBe(true)
    }
    expect(landscape.querySelector('canvas')).toBeNull()
  })

})
