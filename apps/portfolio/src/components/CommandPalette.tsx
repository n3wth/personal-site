import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, ReactElement } from 'react'
import { Search, X, RotateCcw } from 'lucide-react'
import { highlightRanges, searchItems } from '../lib/search'
import { answerLinkHref } from '../lib/answerLinks'
import { track } from '../lib/analytics'
import type { HighlightRange, ResultGroup, SearchItem } from '../lib/search'
import articleMeta from '../data/article-index.json'
import gardenSearch from '../data/garden-search.json'
import { ecosystem, kitPrimitives, uiTiers, uiHooks } from '../data/library'
import { navigation, projects } from '../data/content'

/** Minimum query length for automatic AI search. */
const AI_MIN_CHARS = 2

/**
 * One input over four properties: this site's routes, every Thinking piece,
 * every kit primitive and @n3wth/ui component, and all of the garden.
 *
 * Pages, projects, articles, and garden notes all come from data the build
 * already wrote. The garden list is generated with the notes and imported
 * here, so the first keystroke can filter it without waiting on a chunk or
 * a network round trip. The other groups are derived from the same modules
 * the pages themselves render from, so the palette can't drift out of sync
 * with what actually ships.
 *
 * Article metadata is generated from the registry during the existing local
 * content build. Importing the registry itself also pulls interactive article
 * code into the header, even though search only reads titles and descriptions.
 */

/** How many results are drawn at once. The true match count is still shown. */
const MAX_RESULTS = 40

/* Mirrors the route table in src/main.tsx minus the utility routes
   (/error, /login, /logout, 404), which nobody searches for.
   A new user-facing route must be added here too. */
const PAGES: SearchItem[] = [
  {
    id: 'page-home',
    title: 'Home',
    subtitle: 'One full-screen scene, and the way into the rest of it',
    href: '/',
    group: 'Pages',
  },
  ...navigation.map(({ name, href, description }) => ({
    id: `page-${href.slice(1)}`, title: name, subtitle: description, href, group: 'Pages' as const,
  })),
  {
    id: 'page-support',
    title: 'Support',
    subtitle: 'One inbox for n3wth.com, hop.flights, lunchmoney.sh and theywontshutup.com',
    href: '/support',
    group: 'Pages',
  },
]

const THINKING: SearchItem[] = articleMeta.map(meta => ({
  id: `thinking-${meta.id}`,
  title: meta.title,
  subtitle: meta.dek,
  href: `/thinking/${meta.id}`,
  group: 'Thinking',
}))

/** Blurbs are written to be read on /library, which has room for them. */
function firstSentence(text: string): string {
  const stop = text.indexOf('. ')
  return stop === -1 ? text : text.slice(0, stop + 1)
}

const KIT: SearchItem[] = kitPrimitives.map((primitive) => ({
  id: `kit-${primitive.id}`,
  title: primitive.name,
  subtitle: firstSentence(primitive.blurb),
  href: `/library#kit-${primitive.id}`,
  group: 'Library',
}))

const HOOKS: SearchItem[] = uiHooks.map((name) => ({
  id: `ui-hook-${name.toLowerCase()}`,
  title: name,
  subtitle: '@n3wth/ui hook',
  href: `/library#ui-hook-${name.toLowerCase()}`,
  group: 'Library' as ResultGroup,
}))

const UI: SearchItem[] = uiTiers.flatMap((tier) => {
  const tierLabel = tier.name.replace(/s$/, '').toLowerCase()
  return tier.components.map((name) => ({
    id: `ui-${name.toLowerCase()}`,
    title: name,
    subtitle: `@n3wth/ui ${tierLabel}`,
    href: `/library#ui-${name.toLowerCase()}`,
    group: 'Library' as ResultGroup,
  }))
})

// Keep project discovery in step with the public portfolio. Section routes
// already appear in PAGES, even if an older project still points to one.
const PROJECTS: SearchItem[] = projects
  .filter(project => !navigation.some(section => section.href === project.url))
  .map(project => ({
    id: `project-${project.id}`,
    title: project.name,
    subtitle: project.description,
    tags: [project.focus, ...project.tech].filter((tag): tag is string => Boolean(tag)),
    href: project.url,
    external: project.url.startsWith('http'),
    group: 'Projects',
  }))

interface GardenNote {
  title: string
  href: string
  /** Empty string, not undefined, when the note carried no description. */
  description: string
  tags?: string[]
  section: string | null
}

/** src/data/garden-search.json — the note list built with the rest of the writing. */
interface GardenSearchIndex {
  notes: GardenNote[]
}

const GARDEN: SearchItem[] = (gardenSearch as GardenSearchIndex).notes.map((note) => ({
  id: `garden-${note.href}`,
  title: note.title,
  subtitle:
    [note.description, note.section]
      .filter((part): part is string => Boolean(part && part.length > 0))
      .join(' · ') || undefined,
  tags: note.tags,
  href: note.href,
  external: false,
  group: 'Garden' as ResultGroup,
}))

const ELSEWHERE: SearchItem[] = [
  ...ecosystem.filter(property => !PROJECTS.some(project => project.href === property.href)).map((property) => ({
    id: `elsewhere-${property.id}`,
    title: property.name,
    subtitle: property.purpose,
    href: property.href,
    external: property.href.startsWith('http'),
    group: 'Elsewhere' as const,
  })),
]

const STATIC_ITEMS: SearchItem[] = [
  ...PAGES, ...PROJECTS,
  ...THINKING, ...KIT, ...UI, ...HOOKS, ...GARDEN, ...ELSEWHERE,
]

/** The answer service says this, exactly, when retrieval has nothing to add. */
const NO_ANSWER = 'No relevant information found.'

/**
 * A local hit is already on screen. Hide the abstain sentence, including the
 * tokens streamed before it finishes, so the two never contradict.
 */
function answerContradicts(text: string, hasMatches: boolean): boolean {
  if (!hasMatches) return false
  const value = text.trim()
  if (value.length === 0) return false
  return NO_ANSWER.startsWith(value) || value.startsWith(NO_ANSWER)
}

function Marked({ text, query }: { text: string; query: string }) {
  const ranges = query ? highlightRanges(text, query) : []
  if (ranges.length === 0) return text
  const nodes: Array<string | ReactElement> = []
  let cursor = 0
  ranges.forEach((range: HighlightRange, index: number) => {
    if (range.start < cursor) return
    if (range.start > cursor) nodes.push(text.slice(cursor, range.start))
    nodes.push(
      <span key={index} className="command-palette-mark">{text.slice(range.start, range.end)}</span>
    )
    cursor = range.end
  })
  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

function matchHint(item: SearchItem, query: string): string | null {
  if (!query || highlightRanges(item.title, query).length > 0) return null
  if (item.subtitle && highlightRanges(item.subtitle, query).length > 0) return item.subtitle
  return item.tags?.find((tag) => highlightRanges(tag, query).length > 0) ?? null
}

/** The answer endpoint returns markdown links only ([text](href)) — this
    splits on that one pattern rather than pulling in a markdown parser
    for a single construct. */
function renderAnswerLinks(text: string): Array<string | { label: string; href: string }> {
  const parts: Array<string | { label: string; href: string }> = []
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = linkRe.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const href = answerLinkHref(match[2])
    parts.push(href ? { label: match[1], href } : match[1])
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

/** An empty input is a worse first impression than a short opinionated list. */
const START_HERE: SearchItem[] = [
  ...navigation.map(({ name, href, description }) => ({
    id: `page-${href.slice(1)}`,
    title: name,
    subtitle: description,
    href,
    group: 'Pages' as const,
  })),
  ...PROJECTS,
]

interface RenderGroup {
  group: ResultGroup
  items: SearchItem[]
  /** Where this group's first row sits in the flat keyboard order. */
  startIndex: number
}

const LIST_ID = 'command-palette-results'
const optionId = (index: number) => `command-palette-option-${index}`

export interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useCallback((href: string) => window.location.assign(href), [])
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [entered, setEntered] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [askState, setAskState] = useState<'idle' | 'loading' | 'answered' | 'error'>('idle')
  const [askAnswer, setAskAnswer] = useState('')
  const sourcesAt = askAnswer.lastIndexOf(' Sources: ')
  const answerText = sourcesAt < 0 ? askAnswer : askAnswer.slice(0, sourcesAt)
  const answerSources = sourcesAt < 0 ? [] : renderAnswerLinks(askAnswer.slice(sourcesAt + 10))
    .filter((part): part is { label: string; href: string } => typeof part !== 'string')

  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  /** Tracks the current AI request; increments on each new query to detect stale responses */
  const aiRequestVersion = useRef(0)
  /** AbortController for the current AI request */
  const aiAbortController = useRef<AbortController | null>(null)

  /* Every open starts clean: empty query, first result active, focus in the
     input, and a note of where focus came from so Escape can hand it back. */
  useEffect(() => {
    if (!open) {
      setEntered(false)
      if (openerRef.current?.isConnected) openerRef.current.focus()
      openerRef.current = null
      // Abort any in-flight AI request when palette closes
      if (aiAbortController.current) {
        aiAbortController.current.abort()
        aiAbortController.current = null
      }
      return
    }
    openerRef.current = (document.activeElement as HTMLElement | null) ?? null
    track('command_palette_opened')
    setQuery('')
    setActiveIndex(0)
    setAskState('idle')
    setAskAnswer('')
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    inputRef.current?.focus()
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  // Same lock the mobile nav sheet uses, so the page behind can't scroll away.
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const trimmed = query.trim()
  const matches = useMemo(
    () => (trimmed.length === 0 ? START_HERE : searchItems(STATIC_ITEMS, trimmed)),
    [trimmed]
  )

  /* Groups appear in the order their best result did, so the strongest match
     is always the first row rather than buried under whichever group happens
     to sort first. Within a group, score order survives. */
  const rendered = useMemo(() => {
    const shown = matches.slice(0, MAX_RESULTS)
    const groups: RenderGroup[] = []
    const buckets = new Map<ResultGroup, SearchItem[]>()
    for (const item of shown) {
      const bucket = buckets.get(item.group)
      if (bucket) {
        bucket.push(item)
      } else {
        const created = [item]
        buckets.set(item.group, created)
        groups.push({ group: item.group, items: created, startIndex: 0 })
      }
    }
    let offset = 0
    for (const group of groups) {
      group.startIndex = offset
      offset += group.items.length
    }
    return groups
  }, [matches])

  const flat = useMemo(() => rendered.flatMap((group) => group.items), [rendered])
  const safeIndex = flat.length === 0 ? -1 : Math.min(activeIndex, flat.length - 1)

  /** Reset active index and AI state when query changes */
  useEffect(() => {
    setActiveIndex(0)
  }, [trimmed])

  /**
   * Runs AI search with streaming support. Aborts any previous in-flight request.
   * Uses a version number to discard stale responses that arrive after a newer query.
   */
  const askAi = useCallback(
    async (immediate = false) => {
      if (trimmed.length < AI_MIN_CHARS) return

      // Abort any previous request
      if (aiAbortController.current) {
        aiAbortController.current.abort()
      }

      const version = ++aiRequestVersion.current
      const controller = new AbortController()
      aiAbortController.current = controller

      setAskState('loading')
      setAskAnswer('')
      const traceId = crypto.randomUUID()
      const startedAt = performance.now()
      let firstTextAt: number | undefined
      let model: string | undefined
      let outcome = 'success'
      track('ai_search_asked', { query_length: trimmed.length, immediate, $ai_trace_id: traceId })

      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed, stream: true }),
          signal: controller.signal,
        })

        // Stale response check
        if (version !== aiRequestVersion.current) return

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        // Handle streaming response
        if (response.body && response.headers?.get('content-type')?.includes('text/event-stream')) {
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let accumulated = ''

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              // Stale response check during streaming
              if (version !== aiRequestVersion.current) {
                reader.cancel()
                return
              }

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() ?? ''

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                const data = line.slice(6)
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data) as { delta?: string; model?: string }
                  if (parsed.model) model = parsed.model
                  if (parsed.delta) {
                    firstTextAt ??= performance.now()
                    accumulated += parsed.delta
                    // Update answer progressively
                    if (version === aiRequestVersion.current) {
                      setAskAnswer(accumulated)
                      setAskState('answered')
                    }
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          } finally {
            reader.releaseLock()
          }

          if (version === aiRequestVersion.current && accumulated) {
            if (accumulated.startsWith('No relevant information found.')) outcome = 'no_answer'
            setAskAnswer(accumulated)
            setAskState('answered')
          } else if (version === aiRequestVersion.current && !accumulated) {
            throw new Error('empty answer')
          }
        } else {
          // Fallback for non-streaming response
          const data = (await response.json()) as { answer?: string; model?: string; fallback?: boolean }
          if (version !== aiRequestVersion.current) return
          if (!data.answer) throw new Error('empty answer')
          firstTextAt = performance.now()
          model = data.model
          outcome = data.fallback ? 'unavailable' : data.answer.startsWith('No relevant information found.') ? 'no_answer' : 'success'
          setAskAnswer(data.answer)
          setAskState('answered')
        }
      } catch (err) {
        outcome = controller.signal.aborted ? 'cancelled' : 'error'
        // Ignore abort errors (they're intentional)
        if (err instanceof Error && err.name === 'AbortError') return
        // Only update state if this is still the current request
        if (version === aiRequestVersion.current) {
          setAskState('error')
        }
      } finally {
        if (controller.signal.aborted || version !== aiRequestVersion.current) outcome = 'cancelled'
        // Reuse the site's PostHog identity and privacy filters. No typed text or answers.
        track('$ai_generation', {
          $ai_trace_id: traceId,
          $ai_span_id: crypto.randomUUID(),
          $ai_span_name: 'portfolio_search',
          $ai_provider: 'cloudflare',
          $ai_model: model,
          $ai_latency: (performance.now() - startedAt) / 1000,
          $ai_time_to_first_token: firstTextAt === undefined ? undefined : (firstTextAt - startedAt) / 1000,
          $ai_is_error: outcome === 'error' || outcome === 'unavailable',
          source: 'portfolio_search',
          outcome,
          query_length: trimmed.length,
          measurement: 'browser_request',
        })
      }
    },
    [trimmed]
  )

  /** Editing or closing search invalidates the previous AI answer. */
  useEffect(() => {
    aiAbortController.current?.abort()
    aiAbortController.current = null
    aiRequestVersion.current += 1
    setAskAnswer('')
    const shouldSearch = open && trimmed.length >= AI_MIN_CHARS
    setAskState(shouldSearch ? 'loading' : 'idle')
    const timer = shouldSearch ? window.setTimeout(() => void askAi(), 300) : undefined

    return () => {
      window.clearTimeout(timer)
      aiAbortController.current?.abort()
      aiRequestVersion.current += 1
    }
  }, [trimmed, open, askAi])

  useEffect(() => {
    if (safeIndex < 0) return
    // Optional call, not paranoia: jsdom ships no scrollIntoView, and a
    // render test of this component shouldn't have to stub one in.
    document.getElementById(optionId(safeIndex))?.scrollIntoView?.({ block: 'nearest' })
  }, [safeIndex, rendered])

  const activate = useCallback(
    (item: SearchItem) => {
      track('command_palette_result_selected', { href: item.href, group: item.group })
      onClose()
      if (item.external) {
        window.open(item.href, '_blank', 'noopener,noreferrer')
        return
      }
      navigate(item.href)
    },
    [navigate, onClose]
  )

  const onPanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    // Candidate selection belongs to the input method, not search navigation.
    if (event.defaultPrevented || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
    if (event.key === 'Tab') {
      const panel = panelRef.current
      if (!panel) return
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href]:not([tabindex="-1"]), button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      )
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
      return
    }

    if (event.target !== inputRef.current || flat.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % flat.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + flat.length) % flat.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(flat.length - 1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = flat[safeIndex]
      if (item) activate(item)
    }
  }

  const onResultClick = (item: SearchItem) => (event: ReactMouseEvent<HTMLAnchorElement>) => {
    // Let ⌘-click, middle-click and "open in new tab" behave like the link
    // the href already promises.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    activate(item)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80]">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0"
        style={{
          background: 'var(--bg)',
          opacity: entered ? 0.82 : 0,
          transition: 'opacity 180ms var(--ease)',
        }}
      />

      <div
        /* items-start, not the flex default: stretch would blow the panel out
           to the full column height, so a single result would sit at the top
           of an otherwise empty 700px box. It hugs its content and caps at
           maxHeight instead. */
        className="absolute inset-0 flex items-start justify-center overflow-hidden px-3 sm:px-4"
        style={{ paddingTop: '14vh', paddingBottom: '6vh' }}
        /* This wrapper sits above the backdrop, so clicks in the space
           around the panel land here — treat them as clicks off. */
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose()
        }}
      >
        <div
          ref={panelRef}
          id="command-palette"
          role="dialog"
          aria-modal="true"
          aria-label="Search n3wth.com"
          onKeyDown={onPanelKeyDown}
          className="flex w-full flex-col overflow-hidden"
          style={{
            maxWidth: '640px',
            maxHeight: '100%',
            background: 'var(--bg-raise)',
            border: '1px solid var(--rail)',
            borderRadius: '16px',
            opacity: entered ? 1 : 0,
            transform: reduceMotion || entered ? 'none' : 'translateY(-8px)',
            transition: reduceMotion
              ? 'opacity 140ms linear'
              : 'opacity 180ms var(--ease), transform 180ms var(--ease)',
          }}
        >
          {/* Input row */}
          <div
            className="flex shrink-0 items-center gap-3 px-4"
            style={{ borderBottom: '1px solid var(--rail)' }}
          >
            <Search size={16} strokeWidth={1.5} style={{ color: 'var(--ink-faint)' }} aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              role="combobox"
              aria-expanded="true"
              aria-controls={LIST_ID}
              aria-autocomplete="list"
              aria-label="Search pages, projects, pieces, components and garden notes"
              aria-activedescendant={safeIndex >= 0 ? optionId(safeIndex) : undefined}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Search"
              className="command-palette-input min-w-0 flex-1 bg-transparent font-sans text-sm outline-none placeholder:text-[color:var(--ink-dim)]"
              style={{ color: 'var(--ink)', height: '52px' }}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="inline-flex shrink-0 items-center justify-center"
              style={{ color: 'var(--ink-dim)', width: '44px', height: '44px', margin: '0 -12px 0 0' }}
            >
              <X size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          <p role="status" aria-live="polite" className="sr-only">
            {flat.length === 0
              ? (askState === 'loading' || askState === 'answered' ? '' : 'No results')
              : `${matches.length} result${matches.length === 1 ? '' : 's'}`}
          </p>

          {/* Local results paint with the keystroke. The answer below never gates them. */}
          <div
            ref={listRef}
            id={LIST_ID}
            role="listbox"
            aria-label="Search results"
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain${flat.length === 0 && (askState === 'loading' || askState === 'answered') ? '' : ' py-2'}`}
          >
            {flat.length === 0 ? (askState === 'loading' || askState === 'answered' ? null : (
              <p className="px-4 py-6 font-sans text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
                {`Nothing matches “${trimmed}”. Try one word instead of a phrase.`}
              </p>
            )) : (
              rendered.map((group) => {
                const labelId = `command-palette-group-${group.group.toLowerCase()}`
                return (
                  <div key={group.group} role="group" aria-labelledby={labelId} className="pb-1">
                    <p
                      id={labelId}
                      className="px-4 pb-1 pt-3 font-sans text-xs"
                      style={{ color: 'var(--ink-dim)', fontWeight: 500, letterSpacing: '0.04em' }}
                    >
                      {group.group}
                    </p>
                    {group.items.map((item, offset) => {
                      const index = group.startIndex + offset
                      const isActive = index === safeIndex
                      const hint = matchHint(item, trimmed)
                      return (
                        <a
                          key={item.id}
                          id={optionId(index)}
                          role="option"
                          aria-selected={isActive}
                          tabIndex={-1}
                          href={item.href}
                          target={item.external ? '_blank' : undefined}
                          rel={item.external ? 'noreferrer' : undefined}
                          onClick={onResultClick(item)}
                          onMouseMove={() => setActiveIndex(index)}
                          className="flex items-center px-4 py-2"
                          style={{
                            minHeight: '44px',
                            background: isActive
                              ? 'color-mix(in srgb, var(--ink) 6%, transparent)'
                              : 'transparent',
                            textDecoration: 'none',
                          }}
                        >
                          <span
                            className="min-w-0 truncate font-sans text-sm"
                            style={{ color: 'var(--ink)', fontWeight: 400 }}
                          >
                            <Marked text={item.title} query={trimmed} />
                            {hint ? (
                              <span style={{ color: 'var(--ink-dim)', fontWeight: 400 }}>
                                {' · '}
                                <Marked text={hint} query={trimmed} />
                              </span>
                            ) : null}
                          </span>
                        </a>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>

          {trimmed.length >= AI_MIN_CHARS && (askState === 'loading' || askState === 'error' || (askState === 'answered' && answerText.length > 0 && !answerContradicts(answerText, flat.length > 0))) && (
            <div
              className="max-h-[40vh] shrink-0 overflow-y-auto overscroll-contain px-4 py-3"
              role="region"
              aria-label="Search answer"
              tabIndex={askState === 'answered' ? 0 : undefined}
              style={flat.length > 0 ? { borderTop: '1px solid var(--rail)' } : undefined}
            >
              {askState === 'loading' && (
                <div className="command-palette-loading" role="status" aria-label="Searching">
                  <span /><span /><span />
                </div>
              )}
              {askState === 'error' && (
                <p className="flex items-center gap-2 font-sans text-sm" style={{ color: 'var(--ink-dim)' }} aria-live="polite">
                  <span>Couldn&rsquo;t reach the answering service.</span>
                  <button
                    type="button"
                    onClick={() => askAi(true)}
                    className="inline-flex items-center gap-1 underline underline-offset-4"
                    style={{ color: 'var(--ink-dim)' }}
                    aria-label="Retry AI search"
                  >
                    <RotateCcw size={12} strokeWidth={1.5} aria-hidden="true" />
                    Retry
                  </button>
                </p>
              )}
              {askState === 'answered' && !answerContradicts(answerText, flat.length > 0) && (
                <div>
                <p
                  className="font-sans text-sm leading-relaxed"
                  style={{ color: 'var(--ink)' }}
                  aria-live="polite"
                >
                  {renderAnswerLinks(answerText).map((part, i) =>
                    typeof part === 'string' ? (
                      <span key={i}>{part}</span>
                    ) : (
                      <a
                        key={i}
                        href={part.href}
                        className="underline underline-offset-4"
                        style={{ color: 'var(--ink)' }}
                        {...(part.href.startsWith('http')
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                        onClick={(event) => {
                          if (part.href.startsWith('http')) return
                          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
                          event.preventDefault()
                          onClose()
                          navigate(part.href)
                        }}
                      >
                        {part.label}
                      </a>
                    )
                  )}
                </p>
                {answerSources.length > 0 && (
                  <nav aria-label="Answer sources" className="command-palette-sources">
                    {answerSources.map((source, i) => (
                      <a key={i} href={source.href} target="_blank" rel="noopener noreferrer" className="command-palette-source font-sans text-sm">
                        {source.label}
                      </a>
                    ))}
                  </nav>
                )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
