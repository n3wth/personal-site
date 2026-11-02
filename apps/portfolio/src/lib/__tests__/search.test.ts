import { describe, it, expect } from 'vitest'
import { highlightRanges, scoreItem, searchItems } from '../search'
import type { SearchItem } from '../search'

const item = (over: Partial<SearchItem> & { id: string; title: string }): SearchItem => ({
  href: `/${over.id}`,
  group: 'Pages',
  ...over,
})

const items: SearchItem[] = [
  item({ id: 'beat', title: 'Beat', subtitle: 'The layout unit every piece is built from', group: 'Library' }),
  item({ id: 'work', title: 'Work', subtitle: 'A decade of AI in production' }),
  item({ id: 'zettelkasten', title: 'Zettelkasten Method', subtitle: 'Connected atomic notes', group: 'Garden' }),
  item({ id: 'flow', title: 'FlowDiagram', subtitle: 'Labelled nodes, curved edges', group: 'Library' }),
  item({ id: 'night', title: 'What the night field broke', subtitle: 'A build log', group: 'Thinking' }),
]

describe('scoreItem', () => {
  it('returns 0 when nothing matches', () => {
    expect(scoreItem(items[0], 'xylophone')).toBe(0)
  })

  it('is case insensitive', () => {
    expect(scoreItem(items[0], 'BEAT')).toBeGreaterThan(0)
    expect(scoreItem(items[0], 'beat')).toBeGreaterThan(0)
  })

  it('ranks an exact title match above a plain substring match', () => {
    const exact = scoreItem(item({ id: 'a', title: 'flow' }), 'flow')
    const substring = scoreItem(item({ id: 'b', title: 'overflowing' }), 'flow')
    expect(exact).toBeGreaterThan(substring)
  })

  it('ranks a title prefix above a mid-word title match', () => {
    const prefix = scoreItem(item({ id: 'a', title: 'Flowchart' }), 'flow')
    const mid = scoreItem(item({ id: 'b', title: 'Overflow' }), 'flow')
    expect(prefix).toBeGreaterThan(mid)
  })

  it('ranks a title match above a subtitle-only match', () => {
    const inTitle = scoreItem(item({ id: 'a', title: 'Notes' }), 'notes')
    const inSubtitle = scoreItem(item({ id: 'b', title: 'Garden', subtitle: 'Connected notes' }), 'notes')
    expect(inTitle).toBeGreaterThan(inSubtitle)
  })

  it('matches on the subtitle when the title does not match', () => {
    expect(scoreItem(items[1], 'production')).toBeGreaterThan(0)
  })

  it('ranks a title prefix above a tag, and a tag above a description', () => {
    const prefix = scoreItem(item({ id: 'a', title: 'Codex review' }), 'codex')
    const tag = scoreItem(item({ id: 'b', title: 'Plugin', tags: ['Codex'] }), 'codex')
    const description = scoreItem(item({ id: 'c', title: 'Other', subtitle: 'Uses codex daily' }), 'codex')
    expect(prefix).toBeGreaterThan(tag)
    expect(tag).toBeGreaterThan(description)
  })

  it('forgives a short typo in the title', () => {
    const project = item({ id: 'eg', title: 'elephant-goldfish', group: 'Projects' })
    expect(scoreItem(project, 'elefant')).toBeGreaterThan(0)
    expect(scoreItem(project, 'elephnat')).toBeGreaterThan(0)
    expect(scoreItem(project, 'zzzz')).toBe(0)
  })

  it('does not treat a one-edit prefix of a longer word as a match', () => {
    const book = item({ id: 'book', title: 'Deep Learning', subtitle: "Notes on Goodfellow's textbook" })
    expect(scoreItem(book, 'goldf')).toBe(0)
  })
})

describe('searchItems', () => {
  it('returns nothing for an empty query', () => {
    expect(searchItems(items, '')).toEqual([])
    expect(searchItems(items, '   ')).toEqual([])
  })

  it('filters out non-matches', () => {
    const found = searchItems(items, 'zettel')
    expect(found).toHaveLength(1)
    expect(found[0].title).toBe('Zettelkasten Method')
  })

  it('respects the limit', () => {
    const found = searchItems(items, 'e', 2)
    expect(found.length).toBeLessThanOrEqual(2)
  })

  it('is stable: the same query returns the same order twice', () => {
    const a = searchItems(items, 'e').map((r) => r.id)
    const b = searchItems(items, 'e').map((r) => r.id)
    expect(a).toEqual(b)
  })

  it('puts the strongest match first', () => {
    const found = searchItems(items, 'beat')
    expect(found[0].id).toBe('beat')
  })

  it('searches across groups at once', () => {
    const groups = new Set(searchItems(items, 'a').map((r) => r.group))
    expect(groups.size).toBeGreaterThan(1)
  })

  it('matches a prefix, a later word, and a typo of elephant-goldfish', () => {
    const project = item({ id: 'eg', title: 'elephant-goldfish', group: 'Projects' })
    for (const query of ['elepha', 'goldf', 'elefant']) {
      expect(searchItems([project, ...items], query)[0]?.id).toBe('eg')
    }
  })

  it('filters a few hundred titles inside one frame', () => {
    const corpus = Array.from({ length: 400 }, (_, index) => item({
      id: `note-${index}`,
      title: `Note ${index} about writing`,
      subtitle: 'A short description of the note',
      tags: ['notes'],
    }))
    corpus.push(item({ id: 'eg', title: 'elephant-goldfish', group: 'Projects' }))
    const start = performance.now()
    const found = searchItems(corpus, 'elepha')
    expect(performance.now() - start).toBeLessThan(20)
    expect(found[0]?.id).toBe('eg')
  })
})

describe('highlightRanges', () => {
  it('marks the matched prefix, word, and typo without covering the whole title', () => {
    expect(highlightRanges('elephant-goldfish', 'elepha')).toEqual([{ start: 0, end: 6 }])
    expect(highlightRanges('elephant-goldfish', 'goldf')).toEqual([{ start: 9, end: 14 }])
    expect(highlightRanges('elephant-goldfish', 'elefant')).toEqual([{ start: 0, end: 8 }])
  })
})
