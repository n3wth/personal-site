/**
 * The matcher behind site search. Dependency-free on purpose: the corpus is
 * a few hundred short titles, and the palette has to filter them on the
 * keystroke that produced the query.
 *
 * Pure and synchronous, so it can be tested without a DOM
 * (src/lib/__tests__/search.test.ts).
 */

export type ResultGroup = 'Pages' | 'Projects' | 'Thinking' | 'Library' | 'Garden' | 'Elsewhere'

export interface SearchItem {
  id: string
  title: string
  subtitle?: string
  /** Topics and technologies. Ranked after the title and before the description. */
  tags?: string[]
  href: string
  external?: boolean
  group: ResultGroup
}

/**
 * The order groups fall back to when two results score identically. It is
 * closeness-to-here order: this site's own routes first, then its writing,
 * then things you'd install, then the notes, then the other properties.
 */
export const GROUP_ORDER: readonly ResultGroup[] = [
  'Pages',
  'Projects',
  'Thinking',
  'Library',
  'Garden',
  'Elsewhere',
]

const GROUP_RANK: Record<ResultGroup, number> = {
  Pages: 0,
  Projects: 1,
  Thinking: 2,
  Library: 3,
  Garden: 4,
  Elsewhere: 5,
}

/* Bands, not a continuous scale. Title hits outrank tags, tags outrank a
   description, and a one- or two-character typo still lands with the title
   rather than disappearing. The gaps are wide enough that a tie-breaker
   can't cross a band. */
const EXACT_TITLE = 100
const TITLE_PREFIX = 80
const TITLE_WORD_PREFIX = 60
const TITLE_SUBSTRING = 40
const FUZZY_TITLE = 36
const TAG_EXACT = 34
const TAG_PREFIX = 30
const TAG_SUBSTRING = 26
const SUBTITLE_SUBSTRING = 20
const FUZZY_TAG = 18
const FUZZY_SUBTITLE = 16

/** Typos shorter than this are too ambiguous to forgive. */
const FUZZY_MIN = 4

/** Letters and digits in any script; everything else starts a new word. */
const WORD_CHAR = /[\p{L}\p{N}]/u
const WORD = /[\p{L}\p{N}]+/gu

export interface HighlightRange {
  start: number
  end: number
}

function compact(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
}

function words(value: string): string[] {
  return value.toLowerCase().match(WORD) ?? []
}

function maxEdits(length: number): number {
  // "elefant" is two edits from "elephant" (ph -> f). Allow that from six letters.
  if (length >= 6) return 2
  if (length >= FUZZY_MIN) return 1
  return 0
}

/** Bounded Levenshtein. Returns max + 1 once the row can no longer match. */
function editDistance(a: string, b: string, max: number): number {
  if (a === b) return 0
  const gap = a.length > b.length ? a.length - b.length : b.length - a.length
  if (gap > max) return max + 1
  let prev = new Array<number>(b.length + 1)
  let next = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    next[0] = i
    let rowMin = next[0]
    const ac = a.charCodeAt(i - 1)
    for (let j = 1; j <= b.length; j++) {
      const cost = ac === b.charCodeAt(j - 1) ? 0 : 1
      const del = prev[j] + 1
      const ins = next[j - 1] + 1
      const sub = prev[j - 1] + cost
      const value = del < ins ? (del < sub ? del : sub) : (ins < sub ? ins : sub)
      next[j] = value
      if (value < rowMin) rowMin = value
    }
    if (rowMin > max) return max + 1
    const swap = prev
    prev = next
    next = swap
  }
  return prev[b.length]
}

function fuzzyDistance(word: string, qFlat: string, max: number): number {
  // Compare the whole word. A one-edit prefix of a much longer word
  // ("goldf" inside "goodfellow") is a different word, not a typo.
  if (Math.abs(word.length - qFlat.length) > max) return max + 1
  return editDistance(word, qFlat, max)
}

function fuzzyText(text: string, qFlat: string): boolean {
  const max = maxEdits(qFlat.length)
  if (max === 0) return false
  const flat = compact(text)
  if (flat && Math.abs(flat.length - qFlat.length) <= max && editDistance(flat, qFlat, max) <= max) return true
  for (const word of words(text)) {
    if (fuzzyDistance(word, qFlat, max) <= max) return true
  }
  return false
}

/**
 * True when `needle` starts one of `haystack`'s words other than the first.
 * "diagram" hits inside "FlowDiagram" once the camel case is lowercased and
 * the space is gone, so this is deliberately about separators only: the
 * first-word case is already scored higher by the caller.
 */
function startsAWord(haystack: string, needle: string): boolean {
  let at = haystack.indexOf(needle)
  while (at > 0) {
    if (!WORD_CHAR.test(haystack.charAt(at - 1))) return true
    at = haystack.indexOf(needle, at + 1)
  }
  return false
}

function wordPrefix(haystack: string, query: string): boolean {
  if (startsAWord(haystack, query)) return true
  const qFlat = compact(query)
  if (qFlat.length === 0) return false
  for (const word of words(haystack)) {
    if (word.startsWith(qFlat)) return true
  }
  return false
}

function tagScore(tags: string[] | undefined, query: string, qFlat: string): number {
  if (!tags || tags.length === 0) return 0
  let best = 0
  for (const tag of tags) {
    const value = tag.toLowerCase()
    const flat = compact(value)
    if (value === query || flat === qFlat) best = Math.max(best, TAG_EXACT)
    else if (value.startsWith(query) || (qFlat.length > 0 && flat.startsWith(qFlat))) best = Math.max(best, TAG_PREFIX)
    else if (value.includes(query) || (qFlat.length > 1 && flat.includes(qFlat))) best = Math.max(best, TAG_SUBSTRING)
    else if (qFlat.length >= FUZZY_MIN && fuzzyText(tag, qFlat)) best = Math.max(best, FUZZY_TAG)
  }
  return best
}

/**
 * How well one item answers a query. 0 means no match at all, which is the
 * caller's signal to drop the item rather than render it faintly.
 */
export function scoreItem(item: SearchItem, query: string): number {
  const q = query.trim().toLowerCase()
  if (q.length === 0) return 0

  const title = item.title.toLowerCase()
  const titleFlat = compact(title)
  const qFlat = compact(q)
  if (title === q || (qFlat.length > 0 && titleFlat === qFlat)) return EXACT_TITLE
  if (title.startsWith(q) || (qFlat.length > 0 && titleFlat.startsWith(qFlat))) return TITLE_PREFIX
  if (wordPrefix(title, q)) return TITLE_WORD_PREFIX
  if (title.includes(q) || (qFlat.length > 1 && titleFlat.includes(qFlat))) return TITLE_SUBSTRING
  if (qFlat.length >= FUZZY_MIN && fuzzyText(item.title, qFlat)) return FUZZY_TITLE

  const tags = tagScore(item.tags, q, qFlat)
  if (tags > 0) return tags

  const subtitle = item.subtitle?.toLowerCase()
  if (subtitle !== undefined) {
    const subtitleFlat = compact(subtitle)
    if (subtitle.includes(q) || (qFlat.length > 1 && subtitleFlat.includes(qFlat))) return SUBTITLE_SUBSTRING
    if (qFlat.length >= FUZZY_MIN && fuzzyText(subtitle, qFlat)) return FUZZY_SUBTITLE
  }

  return 0
}

/**
 * Where `query` sits inside `text`, for a weighted highlight. A direct
 * substring wins. A typo highlights the closest word instead of the query
 * itself, which is not present.
 */
export function highlightRanges(text: string, query: string): HighlightRange[] {
  const q = query.trim().toLowerCase()
  if (q.length === 0 || text.length === 0) return []
  const lower = text.toLowerCase()
  const at = lower.indexOf(q)
  if (at >= 0) return [{ start: at, end: at + q.length }]

  const parts = q.split(/[^\p{L}\p{N}]+/u).filter((part) => part.length > 1)
  if (parts.length > 1) {
    const ranges: HighlightRange[] = []
    for (const part of parts) {
      const found = lower.indexOf(part)
      if (found >= 0) ranges.push({ start: found, end: found + part.length })
    }
    if (ranges.length > 0) return ranges
  }

  const qFlat = compact(q)
  const max = maxEdits(qFlat.length)
  if (max === 0) return []
  let best: (HighlightRange & { dist: number }) | null = null
  for (const match of lower.matchAll(WORD)) {
    const word = match[0]
    const dist = fuzzyDistance(word, qFlat, max)
    const start = match.index ?? 0
    if (dist <= max && (best === null || dist < best.dist)) {
      best = { start, end: start + word.length, dist }
    }
  }
  return best ? [{ start: best.start, end: best.end }] : []
}

interface Scored {
  item: SearchItem
  score: number
}

/* Total order, so two renders of the same query can never disagree: score,
   then group, then title, then href, then id. Array.prototype.sort is stable
   in every engine that ships React 19, but relying on input order would make
   the palette jitter as soon as the garden notes arrive and change it. */
function byRank(a: Scored, b: Scored): number {
  if (a.score !== b.score) return b.score - a.score
  const group = GROUP_RANK[a.item.group] - GROUP_RANK[b.item.group]
  if (group !== 0) return group
  const title = a.item.title.localeCompare(b.item.title)
  if (title !== 0) return title
  const href = a.item.href.localeCompare(b.item.href)
  if (href !== 0) return href
  return a.item.id.localeCompare(b.item.id)
}

/**
 * Every item that matches, best first. An empty or whitespace-only query
 * returns nothing at all; showing a "start here" set instead is the caller's
 * job, not the matcher's. `limit` is uncapped by default so callers can count
 * the true number of matches and decide for themselves how many to draw.
 */
export function searchItems(
  items: SearchItem[],
  query: string,
  limit: number = Number.POSITIVE_INFINITY
): SearchItem[] {
  const q = query.trim()
  if (q.length === 0) return []

  const scored: Scored[] = []
  for (const item of items) {
    const score = scoreItem(item, q)
    if (score > 0) scored.push({ item, score })
  }
  scored.sort(byRank)

  const kept = limit < scored.length ? scored.slice(0, limit) : scored
  return kept.map((entry) => entry.item)
}
