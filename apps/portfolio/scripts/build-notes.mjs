import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPublishedNotes, getAllTags, resolveWikilink } from './notes/lib/content.ts'
import { markdownToHtml, extractHeadings } from './notes/lib/markdown.ts'
import { getBacklinksForSlug } from './notes/lib/backlinks.ts'
import { extractWikilinks } from './notes/lib/note-links.mjs'
import { createRedirects, notePath, topicPath } from './notes/routes.mjs'
import { parseThinkingMeta } from './lib/thinking-meta.mjs'
import { noteDates } from './notes/lib/dates.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = resolve(root, 'public/writing')
const history = JSON.parse(readFileSync(resolve(root, 'scripts/notes/content-history.json'), 'utf8'))
const notes = getPublishedNotes()
const slugs = new Set(notes.map(note => note.slug))
const sourceTargets = new Map(notes.map(note => [note.filePath.toLowerCase(), notePath(note.slug)]))
if (slugs.size !== notes.length) throw new Error('Duplicate published note slugs')
const redirects = createRedirects(notes, getAllTags().keys())
for (const file of readdirSync(resolve(root, 'public/figures'), { recursive: true })) {
  if (/\.[a-z0-9]+$/i.test(file)) redirects[`/figures/${file}`] = `/figures/${file}`
}
const write = (file, data) => {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
}
// Only generated output is replaced. Markdown remains the source of truth.
rmSync(output, { recursive: true, force: true })
const edges = []
const index = []
for (const note of notes) {
  const { date, updated } = noteDates(note, history[note.filePath])
  const meta = { slug: note.slug, href: notePath(note.slug), title: note.title, description: note.description || '', tags: note.tags, stage: note.stage, readingTime: note.readingTime, ...(date ? { date } : {}), ...(updated ? { updated } : {}) }
  let html = await markdownToHtml(note.content)
  // Existing absolute Garden links and root-relative links share the redirect map.
  // Keep external links, fragment-only links, and unknown references unchanged.
  html = html.replace(/\b(href|src)="([^"]+)"/g, (whole, attr, value) => {
    const decoded = value.replaceAll('&amp;', '&')
    if (/^(?:mailto:|tel:|#|data:)/.test(decoded)) return whole
    let url
    try { url = new URL(decoded, `https://garden.n3wth.com/${note.slug}`) } catch { return whole }
    if (url.origin !== 'https://garden.n3wth.com') return whole
    if (url.pathname.startsWith('/thinking/')) return whole
    if (attr === 'href' && /\.md$/i.test(url.pathname)) {
      const sourceUrl = new URL(decoded, `https://garden.n3wth.com/${note.filePath.split('/').map(encodeURIComponent).join('/')}`)
      const source = decodeURIComponent(sourceUrl.pathname).slice(1).toLowerCase()
      const target = sourceTargets.get(source)
      // Unpublished or missing Markdown targets remain readable without a dead link.
      return target ? `${attr}="${target}${url.search}${url.hash}"` : ''
    }
    const target = redirects[decodeURIComponent(url.pathname).replace(/\/$/, '') || '/']
    if (target) return `${attr}="${target}${target.includes('?') ? '' : url.search}${url.hash || ''}"`
    if (url.pathname.startsWith('/figures/')) {
      if (!existsSync(resolve(root, `public${decodeURIComponent(url.pathname)}`))) throw new Error(`Missing asset ${url.pathname} in ${note.slug}`)
      return `${attr}="${url.pathname}${url.hash}"`
    }
    return whole
  })
  const outgoing = [...new Set(extractWikilinks(note.content).map(resolveWikilink).filter(slug => slug && slugs.has(slug) && slug !== note.slug))]
  edges.push(...outgoing.map(slug => ({ source: meta.href, target: notePath(slug) })))
  const backlinks = getBacklinksForSlug(note.slug).map(link => ({ ...link, href: notePath(link.slug) }))
  write(resolve(output, `notes/${note.slug}.json`), { ...meta, html, headings: extractHeadings(html), backlinks })
  index.push(meta)
}
index.sort((a, b) => a.title.localeCompare(b.title))
write(resolve(root, 'src/data/writing-index.json'), index)
write(resolve(output, 'index.json'), index)
write(resolve(root, '../garden/redirects.json'), redirects)
// Preserve the existing palette's data interface while making it entirely local.
write(resolve(root, 'src/data/garden-search.json'), { notes: index.map(note => ({ title: note.title, href: note.href, description: note.description, tags: note.tags, section: note.slug.includes('/') ? note.slug.split('/')[0] : null })) })
write(resolve(root, 'src/data/garden-index.json'), { noteCount: index.length, indexedCount: index.length, topics: [...getAllTags()].map(([name, notes]) => ({ name, href: topicPath(name), count: notes.length })) })
// Read literal article metadata without importing React or article bodies into Node.
const registry = readFileSync(resolve(root, 'src/components/thinking/registry.tsx'), 'utf8')
const articleMeta = parseThinkingMeta(registry)
const articles = articleMeta.map(meta => ({ id: `/thinking/${meta.id}`, title: meta.title, description: meta.dek, stage: 'evergreen', tags: ['articles'], linkCount: 0 }))
if (articles.length !== (registry.match(/meta:\s*\{/g) || []).length) throw new Error('Article metadata could not be read')
// Search and indexes need titles and dates, never the interactive article bodies.
write(resolve(root, 'src/data/article-index.json'), articleMeta)
for (const article of articles) {
  if (index.some(note => note.href === article.id)) throw new Error(`Article and note route collision: ${article.id}`)
}
const linkCounts = new Map()
for (const edge of edges) {
  for (const id of [edge.source, edge.target]) linkCounts.set(id, (linkCounts.get(id) || 0) + 1)
}
write(resolve(output, 'world.json'), { nodes: [...index.map(note => ({ id: note.href, title: note.title, description: note.description, stage: note.stage, tags: note.tags, linkCount: linkCounts.get(note.href) || 0 })), ...articles], edges })
console.log(`Built ${index.length} notes, ${articles.length} articles, ${edges.length} connections`)
