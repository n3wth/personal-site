import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CommandPalette } from '../CommandPalette'
import { track } from '../../lib/analytics'

vi.mock('../../lib/analytics', () => ({ track: vi.fn() }))

const noop = () => {}

describe('CommandPalette smoke', () => {
  it('does not navigate or select results while composing text', () => {
    const onClose = vi.fn()
    render(<CommandPalette open onClose={onClose} />)
    const input = screen.getByRole('combobox')
    const initial = input.getAttribute('aria-activedescendant')

    fireEvent.keyDown(input, { key: 'ArrowDown', isComposing: true })
    expect(input.getAttribute('aria-activedescendant')).toBe(initial)
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 })
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input.getAttribute('aria-activedescendant')).not.toBe(initial)
  })

  it('renders a start-here set and filters live', async () => {
    render(
      <>
        <CommandPalette open onClose={noop} />
      </>
    )
    const input = screen.getByRole('combobox')
    expect(document.activeElement).toBe(input)
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual([
      'Work', 'Projects', 'Art', 'Thinking', 'Library', 'Contact',
      'elephant-goldfish', 'markup', 'r3', '@n3wth/ui', 'hop.flights', 'lunchmoney.sh',
    ])

    // garden arrives via dynamic import
    await waitFor(() => {
      expect(screen.queryByText(/garden still loading/)).toBeNull()
    })

    fireEvent.change(input, { target: { value: 'flowdiagram' } })
    const options = screen.getAllByRole('option')
    expect(options[0].textContent).toContain('FlowDiagram')
    expect(options[0].getAttribute('aria-selected')).toBe('true')
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id)

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    const after = screen.getAllByRole('option')
    expect(after[after.length - 1].getAttribute('aria-selected')).toBe('true')

    fireEvent.change(input, { target: { value: 'zzzznotathing' } })
    expect(screen.queryAllByRole('option').length).toBe(0)
    expect(screen.getByRole('status', { name: 'Searching' })).toBeTruthy()

    fireEvent.change(input, { target: { value: 'garden' } })
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <>
        <CommandPalette open={false} onClose={noop} />
      </>
    )
    expect(container.firstChild).toBeNull()
  })

  it('finds local and external projects without duplicate destinations', () => {
    render(<CommandPalette open onClose={noop} />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'elephant-goldfish' } })
    const plugin = screen.getAllByRole('option')[0]
    expect(plugin).toHaveAttribute('href', '/projects/elephant-goldfish')
    expect(plugin).not.toHaveAttribute('target')

    fireEvent.change(input, { target: { value: 'markup' } })
    const prototype = screen.getAllByRole('option')[0]
    expect(prototype).toHaveAttribute('href', 'https://github.com/n3wth/markup')
    expect(prototype).toHaveAttribute('target', '_blank')

    fireEvent.change(input, { target: { value: '@n3wth/ui' } })
    expect(screen.getAllByRole('option').filter(option => option.getAttribute('href') === '/projects/ui')).toHaveLength(1)

    fireEvent.change(input, { target: { value: 'code review' } })
    expect(screen.getAllByRole('option').some(option => option.getAttribute('href') === '/projects/elephant-goldfish')).toBe(true)
  })
})

describe('CommandPalette AI search', () => {
  let originalFetch: typeof fetch

  beforeEach(() => {
    vi.mocked(track).mockClear()
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('does not show AI row for queries under 2 characters', () => {
    render(
      <>
        <CommandPalette open onClose={noop} />
      </>
    )
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'a' } })
    // No AI row (Thinking... or Ask AI) should appear for single-char queries
    // Use aria-live="polite" to find the AI status area specifically
    expect(screen.queryByText(/Thinking…/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Ask about/ })).toBeNull()
  })

  it('renders unsafe answer destinations as text and excludes unsafe source links', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({
      answer: '[Unsafe](javascript:alert) and [Work page](/work). Sources: [Invalid source](data:text/html,test), [Valid source](https://n3wth.com/work)',
    }), { headers: { 'content-type': 'application/json' } }))
    render(<CommandPalette open onClose={noop} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'career' } })
    await waitFor(() => expect(screen.getByText('Unsafe')).toBeTruthy())
    expect(screen.queryByRole('link', { name: 'Unsafe' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Invalid source' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Work page' }).getAttribute('href')).toBe('/work')
    expect(screen.getByRole('link', { name: 'Valid source' }).getAttribute('href')).toBe('https://n3wth.com/work')
  })

  it('requests an AI answer after typing pauses', async () => {
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        body: null,
        json: () => Promise.resolve({ answer: 'Test answer with [citation](https://example.com)', model: 'test-model' }),
      })
    )
    globalThis.fetch = mockFetch

    render(
      <>
        <CommandPalette open onClose={noop} />
      </>
    )
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'astryx' } })

    expect(mockFetch).not.toHaveBeenCalled()
    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/search',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('astryx'),
          })
        )
      },
      { timeout: 1000 }
    )
    await waitFor(() => expect(track).toHaveBeenCalledWith('$ai_generation', expect.objectContaining({
      $ai_model: 'test-model',
      $ai_provider: 'cloudflare',
      $ai_latency: expect.any(Number),
      $ai_time_to_first_token: expect.any(Number),
      outcome: 'success',
    })))
    const generation = vi.mocked(track).mock.calls.find(([event]) => event === '$ai_generation')?.[1]
    const asked = vi.mocked(track).mock.calls.find(([event]) => event === 'ai_search_asked')?.[1]
    expect(generation?.$ai_trace_id).toBe(asked?.$ai_trace_id)
    expect(JSON.stringify(generation)).not.toContain('astryx')
    expect(JSON.stringify(generation)).not.toContain('Test answer')
  })

  it('shows pending feedback immediately and ignores an answer after the query is cleared', async () => {
    let complete!: (value: unknown) => void
    globalThis.fetch = vi.fn(() => new Promise(resolve => { complete = resolve })) as typeof fetch
    render(<><CommandPalette open onClose={noop} /></>)
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'zzzznotathing' } })
    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(screen.getByRole('status', { name: 'Searching' })).toBeTruthy()
    expect(screen.queryByText(/Nothing matches/)).toBeNull()
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledOnce())
    fireEvent.change(input, { target: { value: '' } })
    complete({ ok: true, body: null, json: async () => ({ answer: 'Stale answer' }) })
    await waitFor(() => expect(screen.queryByRole('status', { name: 'Searching' })).toBeNull())
    expect(screen.queryByText('Stale answer')).toBeNull()
    expect(track).toHaveBeenCalledWith('$ai_generation', expect.objectContaining({ outcome: 'cancelled' }))
  })

  it('lists elephant-goldfish for elepha and hides an abstain answer', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({
      answer: 'No relevant information found. Try another search.',
    }), { headers: { 'content-type': 'application/json' } }))
    render(<><CommandPalette open onClose={noop} /></>)
    const input = screen.getByRole('combobox')
    const started = performance.now()
    fireEvent.change(input, { target: { value: 'elepha' } })
    const option = screen.getByRole('option', { name: 'elephant-goldfish' })
    expect(performance.now() - started).toBeLessThan(50)
    expect(option).toHaveAttribute('href', '/projects/elephant-goldfish')
    expect(option.querySelector('.command-palette-mark')?.textContent).toBe('elepha')
    expect(screen.queryByText(/No relevant information found/)).toBeNull()
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
    expect(screen.queryByText(/No relevant information found/)).toBeNull()
    expect(screen.getByRole('option', { name: 'elephant-goldfish' })).toBeTruthy()
  })

  it('records the model and no-answer outcome from a streamed response', async () => {
    const events = 'data: {"model":"stream-model"}\n\ndata: {"delta":"No relevant information found. Try another search."}\n\ndata: [DONE]\n\n'
    globalThis.fetch = vi.fn(async () => new Response(events, { headers: { 'content-type': 'text/event-stream' } }))
    render(<><CommandPalette open onClose={noop} /></>)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'fgh' } })
    await waitFor(() => expect(track).toHaveBeenCalledWith('$ai_generation', expect.objectContaining({
      $ai_model: 'stream-model',
      $ai_is_error: false,
      outcome: 'no_answer',
    })))
    expect(vi.mocked(track).mock.calls.filter(([event]) => event === '$ai_generation')).toHaveLength(1)
  })

  it('cancels the pending automatic search when the dialog closes', async () => {
    vi.useFakeTimers()
    try {
      globalThis.fetch = vi.fn()
      const { rerender } = render(<><CommandPalette open onClose={noop} /></>)
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'garden' } })
      rerender(<><CommandPalette open={false} onClose={noop} /></>)
      await vi.advanceTimersByTimeAsync(400)
      expect(globalThis.fetch).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('cancels the pending automatic search when the dialog closes', async () => {
    vi.useFakeTimers()
    try {
      globalThis.fetch = vi.fn()
      const { rerender } = render(<><CommandPalette open onClose={noop} /></>)
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'garden' } })
      rerender(<><CommandPalette open={false} onClose={noop} /></>)
      await vi.advanceTimersByTimeAsync(400)
      expect(globalThis.fetch).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('aborts previous request when typing a new query', async () => {
    const abortSpy = vi.fn()

    class MockAbortController {
      signal = { aborted: false }
      abort = abortSpy
    }

    const OriginalAbortController = globalThis.AbortController
    globalThis.AbortController = MockAbortController as unknown as typeof AbortController

    let resolveFirst: (value: unknown) => void
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve
    })

    const mockFetch = vi.fn().mockImplementation(() => firstPromise)
    globalThis.fetch = mockFetch

    render(
      <>
        <CommandPalette open onClose={noop} />
      </>
    )
    const input = screen.getByRole('combobox')

    // Type first query
    fireEvent.change(input, { target: { value: 'astryx' } })

    // Wait for the automatic request to start
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    }, { timeout: 1000 })

    // Type second query before first completes
    fireEvent.change(input, { target: { value: 'astryx g' } })

    // Wait for abort to be called
    await waitFor(() => {
      expect(abortSpy).toHaveBeenCalled()
    }, { timeout: 1000 })

    // Cleanup
    resolveFirst!({ ok: true, body: null, json: () => Promise.resolve({ answer: 'test' }) })
    globalThis.AbortController = OriginalAbortController
  })

  it('shows only loading dots while waiting for an automatic answer', () => {
    render(
      <>
        <CommandPalette open onClose={noop} />
      </>
    )
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'astryx' } })

    expect(screen.queryByRole('button', { name: /Ask about/ })).toBeNull()
    expect(screen.queryByText('AI answer from this site and garden notes')).toBeNull()
    expect(screen.getByRole('status', { name: 'Searching' })).toBeTruthy()
  })

  it('shows retry button only on error', async () => {
    const mockFetch = vi.fn().mockImplementation(() => Promise.reject(new Error('Network error')))
    globalThis.fetch = mockFetch

    render(
      <>
        <CommandPalette open onClose={noop} />
      </>
    )
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'astryx' } })

    // Use a function matcher since the apostrophe may be a curly quote
    await waitFor(
      () => {
        expect(screen.getByText((content) => content.includes('reach the answering service'))).toBeTruthy()
      },
      { timeout: 1000 }
    )

    expect(screen.getByRole('button', { name: /Retry/i })).toBeTruthy()
    expect(track).toHaveBeenCalledWith('$ai_generation', expect.objectContaining({ outcome: 'error', $ai_is_error: true }))
  })

  it('Enter on a page match does not request an AI answer', async () => {
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        body: null,
        json: () => Promise.resolve({ answer: 'Test answer' }),
      })
    )
    globalThis.fetch = mockFetch

    render(
      <>
        <CommandPalette open onClose={noop} />
      </>
    )
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'astryx' } })
    // Enter selects the page result.
    fireEvent.keyDown(input, { key: 'Enter' })

    // Navigation must not also start an AI request.
    await waitFor(
      () => {
        expect(mockFetch).not.toHaveBeenCalled()
      },
      { timeout: 500 }
    )
  })
})
