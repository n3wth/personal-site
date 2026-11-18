import { useEffect, useRef, useSyncExternalStore } from 'react'
import { shipReviewPath } from '../../lib/shipReview'
import { useHydrated, useQueryString } from '../../lib/navigation'
import { Icon, Selector, TextInput } from '@n3wth/ui/primitives'
import articleMeta from '../../data/article-index.json'
import notes from '../../data/writing-index.json'
import './writingIndex.css'

const PAGE_SIZE = 24
const articles = articleMeta.map(meta => ({
  slug: meta.id, href: `/thinking/${meta.id}`, title: meta.title,
  description: meta.dek, tags: ['articles'], date: meta.date,
  readingTime: '', kind: 'articles', updated: undefined,
}))
const entries = [...articles, ...notes.map(note => ({ ...note, kind: 'notes' }))]
const topics = [...new Set(notes.flatMap(note => note.tags))].sort()
const topicLabel = (tag: string) => tag.replace(/-/g, ' ')
const topicOptions = [{ value: '', label: 'All topics' }, ...topics.map(tag => ({ value: tag, label: topicLabel(tag) }))]
const relativeDate = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const subscribeToDate = () => () => {}
const serverDate = () => null
const currentDate = () => {
  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

function WritingDate({ value, label }: { value?: string; label: string }) {
  const today = useSyncExternalStore(subscribeToDate, currentDate, serverDate)
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const days = today === null ? null : Math.round((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - today) / 86_400_000)
  const exactDate = date.toLocaleDateString('en', { dateStyle: 'long', timeZone: 'UTC' })
  return <><time dateTime={value} title={exactDate} aria-label={`${label} ${exactDate}`}>{label} {days === null ? exactDate : relativeDate.format(days, 'day')}</time>{' · '}</>
}

export function NotesIndex() {
  const ready = useHydrated()
  const [params, navigate] = useQueryString()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const query = params.get('q') ?? ''
  const topic = params.get('topic') ?? ''
  const kind = topic === 'articles' ? 'articles' : params.get('kind') ?? ''
  const sort = params.get('sort') === 'title' ? 'title' : 'newest'
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visible = entries.filter(entry => (!kind || entry.kind === kind) &&
    (!topic || entry.tags.includes(topic)) &&
    `${entry.title} ${entry.description} ${entry.tags.join(' ')}`.toLocaleLowerCase().includes(normalizedQuery))
    .sort((a, b) => (sort === 'newest' ? (b.date ?? '').localeCompare(a.date ?? '') : 0) || a.title.localeCompare(b.title))
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const requestedPage = Number(params.get('page'))
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, pageCount) : 1
  const shown = Math.min(page * PAGE_SIZE, visible.length)
  const search = params.toString()
  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || page >= pageCount || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const next = new URLSearchParams(search)
      next.set('page', String(page + 1))
      navigate(`/thinking?${next}`, { replace: true })
    }, { rootMargin: '300px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [navigate, page, pageCount, search])
  const isFiltered = Boolean(query || topic || kind)
  const href = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params)
    next.delete('page')
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    return `/thinking${next.size ? `?${next}` : ''}#notes`
  }
  const update = (changes: Record<string, string>, replace = false) => navigate(href(changes), { replace })

  return (
    <section id="notes" aria-label="Writing collection" onClick={event => {
      const link = (event.target as HTMLElement).closest('a')
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return
      const url = new URL(link.href)
      if (url.origin !== window.location.origin || url.pathname !== '/thinking') return
      event.preventDefault()
      navigate(link.href)
    }} className="site-content-gutter writing-index">
      <p className="writing-tool">
        <a href={shipReviewPath}>Before You Ship</a>
        <span>Get an acceptance test for an AI feature.</span>
      </p>
      <div className="writing-search">
        <TextInput className="writing-control" label="Search writing" isDisabled={!ready} isLabelHidden placeholder="Search writing" size="lg" width="100%" startIcon={<Icon icon="search" size="sm" color="secondary" />} value={query} onChange={value => update({ q: value }, true)} />
      </div>
      <div className="writing-toolbar" id="writing-results">
        <nav aria-label="Writing format" className="writing-formats">
          {[['', 'All'], ['articles', 'Articles'], ['notes', 'Notes']].map(([value, label]) => (
            <a key={value} href={href({ kind: value, topic: '' })} aria-current={kind === value ? 'page' : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <div className="writing-topic-picker">
          <Selector className="writing-control" label="Topic" isDisabled={!ready} isLabelHidden size="lg" options={topicOptions} value={topic === 'articles' ? '' : topic} onChange={value => update({ topic: value, kind: '' })} hasSearch searchPlaceholder="Find a topic" width="100%" />
        </div>
        <p role="status">{visible.length} {visible.length === 1 ? 'result' : 'results'}</p>
        <div className="writing-sort"><Selector className="writing-control" label="Sort writing" isDisabled={!ready} isLabelHidden size="lg" width="100%" options={[{ value: 'newest', label: 'Newest first' }, { value: 'title', label: 'Title A–Z' }]} value={sort} onChange={value => update({ sort: value === 'newest' ? '' : value })} /></div>
      </div>
      {isFiltered && <div className="writing-filter-summary">
        <span>{[kind === 'articles' ? 'Articles' : kind === 'notes' ? 'Notes' : '', topic && topic !== 'articles' ? topicLabel(topic) : '', query ? `“${query}”` : ''].filter(Boolean).join(' / ')}</span>
        <a href="/thinking#notes">Clear filters</a>
      </div>}
      <ul className="writing-results">
        {visible.slice(0, shown).map(entry => <li key={entry.href}>
          <div>
            <h2><a href={entry.href}>{entry.title}</a></h2>
            {entry.description && <p>{entry.description}</p>}
            <span className="writing-entry-meta"><WritingDate value={entry.updated ?? entry.date} label={entry.kind === 'notes' ? 'Tended' : 'Published'} />{[entry.kind === 'articles' ? 'Article' : 'Note', entry.readingTime].filter(Boolean).join(' · ')}</span>
          </div>
        </li>)}
      </ul>
      {visible.length === 0 && <div className="writing-empty"><p>No writing matches these filters.</p><p>Try a broader search, choose another topic, or <a href="/thinking#notes">browse all writing</a>.</p></div>}
      {page < pageCount && <div ref={loadMoreRef} className="writing-load-more">
        <a href={href({ page: String(page + 1) }).replace('#notes', '')}>Load more</a>
      </div>}
    </section>
  )
}
