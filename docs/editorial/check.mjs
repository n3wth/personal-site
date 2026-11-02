import { createHash } from 'node:crypto'
import { readFile, writeFile, readdir, realpath } from 'node:fs/promises'
import { resolve, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { siteUrls } from '../../packages/site-config/index.js'

const root = fileURLToPath(new URL('../../', import.meta.url))
export const hash = text => createHash('sha256').update(text).digest('hex')
const readJson = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'))
const nonempty = value => typeof value === 'string' && value.trim().length > 0
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const normalize = url => {
  try {
    if (!nonempty(url)) return null
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    parsed.hash = ''
    return parsed.href
  } catch { return null }
}
const internalOrigins = new Set(Object.values(siteUrls))
const isInternal = url => Boolean(normalize(url)) && internalOrigins.has(new URL(url).origin)
const isPublicHttps = url => {
  if (!normalize(url)) return false
  const parsed = new URL(url)
  return parsed.protocol === 'https:' && !parsed.username && !parsed.password && parsed.hostname.includes('.') && !/^(localhost|0\.|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(parsed.hostname) && !parsed.hostname.endsWith('.local')
}
const validDate = (value, now) => nonempty(value) && /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(`${value.slice(0, 10)}T00:00:00Z`).toISOString().slice(0, 10) === value.slice(0, 10) && Date.parse(value) <= now + 60_000

export const isChallenge = body => /<title>[^<]*(access denied|just a moment|page not found|captcha|sign in|client challenge|checking your browser|security check)/i.test(body)

export function reviewsForChanges(reviews, paths) {
  if (!paths || paths.includes('docs/editorial/sources.json')) return reviews
  const changed = new Set(paths)
  return reviews.filter(review => changed.has(review.contentPath) || changed.has(`docs/editorial/reviews/${review.id}.json`))
}

export function outboundLinks(text) {
  const urls = []
  for (const match of text.matchAll(/https?:\/\/[^\s<>"'`\]}]+|(?<![\w:/])\/\/[^\s<>"'`\]}]+/gi)) {
    let url = match[0]
    let depth = 0
    let end = url.length
    for (let i = 0; i < url.length; i++) {
      if (url[i] === '(') depth++
      if (url[i] === ')' && --depth < 0) { end = i; break }
    }
    url = url.slice(0, end)
    if (end === match[0].length && !['(', '<', '"', "'", '`'].includes(text[match.index - 1])) url = url.replace(/[.,;:!?]+$/, '')
    urls.push((url.startsWith('//') ? `https:${url}` : url).replace(/&amp;/gi, '&'))
  }
  return [...new Set(urls)]
}

export function selectNext(backlog, ledger = { items: {} }) {
  if (!record(ledger) || !record(ledger.items)) throw new Error('Invalid publishing ledger')
  const unfinished = ['researching', 'drafted', 'validated', 'pr_open', 'merged']
  const finished = ['live', 'distributed', 'published']
  for (const entry of Object.values(ledger.items)) {
    if (!record(entry) || ![...unfinished, ...finished, 'planned'].includes(entry.phase)) throw new Error('Invalid publishing ledger phase')
  }
  const items = backlog.cadence.order.map(id => {
    const item = backlog.items.find(item => item.id === id)
    if (!item || !['planned', ...unfinished, ...finished].includes(item.status)) throw new Error('Invalid release order or status')
    return item
  }).filter(item => !finished.includes(item.status) && !finished.includes(ledger.items[item.id]?.phase) && !ledger.items[item.id]?.liveUrl)
  return items.find(item => unfinished.includes(ledger.items[item.id]?.phase)) || items.find(item => unfinished.includes(item.status)) || items[0] || null
}

export function validateBacklog(backlog, sources) {
  const errors = []
  const ids = new Set()
  const urls = new Set()
  for (const item of backlog.items) {
    if (ids.has(item.id) || urls.has(item.url)) errors.push(`Duplicate item: ${item.id}`)
    ids.add(item.id)
    urls.add(item.url)
    if (!['garden', 'portfolio'].includes(item.site)) errors.push(`Unknown site: ${item.id}`)
    if (!item.angle || item.outline.length < 3 || !item.originalAsset || item.internalLinks.length < 2) errors.push(`Incomplete brief: ${item.id}`)
    if (item.sources.length < 2 || item.sources.some(id => !sources[id])) errors.push(`Missing sources: ${item.id}`)
    const expected = item.site === 'garden' ? `https://garden.n3wth.com/${item.slug}` : `https://n3wth.com/thinking/${item.slug}`
    if (item.url !== expected || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) errors.push(`Invalid route: ${item.id}`)
  }
  for (const [site, minimum] of [['garden', 20], ['portfolio', 10]]) {
    if (backlog.items.filter(item => item.site === site).length < minimum) errors.push(`Need ${minimum} ${site} briefs`)
  }
  if (new Set(backlog.cadence.order).size !== ids.size || backlog.cadence.order.length !== ids.size || backlog.cadence.order.some(id => !ids.has(id))) errors.push('Release order must contain each item once')
  return errors
}

export function validateReview(text, review, sources, now = Date.now(), headSha) {
  const errors = []
  if (!record(review)) return ['Invalid editorial review']
  if (hash(text) !== review.contentSha256) errors.push('Article changed after editorial review')
  if (!validDate(review.reviewedAt, now) || !nonempty(review.reviewer) || review.decision !== 'pass') errors.push('Editorial review missing or invalid')
  if (review.headSha !== undefined && (typeof review.headSha !== 'string' || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(review.headSha) || (headSha !== undefined && review.headSha !== headSha))) errors.push('Invalid or stale review headSha')
  for (const field of ['originality', 'usefulness', 'evidence', 'clarity', 'limitations']) {
    if (!Number.isInteger(review.scores?.[field]) || review.scores[field] < 4 || review.scores[field] > 5) errors.push(`Editorial score below 4/5: ${field}`)
  }
  for (const field of ['publicSafe', 'brandsChecked', 'internalLinksChecked', 'claimsComplete']) {
    if (review[field] !== true) errors.push(`Review check missing: ${field}`)
  }
  const citations = new Set()
  const links = outboundLinks(text)
  const linked = new Set(links.map(normalize).filter(Boolean))
  if (!Array.isArray(review.claims)) errors.push('Invalid review claims')
  for (const claim of Array.isArray(review.claims) ? review.claims : []) {
    if (!record(claim) || !nonempty(claim.text) || !text.includes(claim.text)) {
      errors.push(`Claim no longer matches article: ${claim?.text}`)
      continue
    }
    if (claim.kind === 'sourced') {
      const source = Object.hasOwn(sources, claim.sourceId) ? sources[claim.sourceId] : null
      if (!source || !isPublicHttps(source.url) || isInternal(source.url) || !nonempty(claim.sourcePassage) || !nonempty(claim.limitation) || claim.verdict !== 'supported') errors.push(`Unsupported claim: ${claim.text}`)
      else {
        citations.add(claim.sourceId)
        if (!linked.has(normalize(source.url))) errors.push(`Missing citation: ${claim.sourceId}`)
      }
    } else if (!['illustration', 'recommendation'].includes(claim.kind) || !nonempty(claim.rationale)) errors.push('Unclassified claim')
  }
  const reviewedUrls = new Set([...citations].map(id => normalize(sources[id].url)))
  if (reviewedUrls.size < 3) errors.push('Need three reviewed sources')
  const domains = new Set([...citations].map(id => new URL(sources[id].url).hostname))
  if (domains.size < 2) errors.push('Need two independent source domains')
  const primary = new Set([...citations].filter(id => ['research', 'standard', 'implementation'].includes(sources[id].kind)).map(id => normalize(sources[id].url)))
  if (primary.size < 2) errors.push('Need two primary/standards/implementation sources')
  for (const url of links) if (!isInternal(url) && !reviewedUrls.has(normalize(url))) errors.push(`Unreviewed outbound link: ${url}`)
  if (/\b(TODO|TBD|ARTICLE_URL)\b|\[insert /i.test(text)) errors.push('Unfinished copy')
  // Repo copy rules apply to visible text, while canonical citations retain their exact URLs.
  const visible = text.replace(/https?:\/\/\S+/g, '')
  if (/\b(ChatGPT|Claude|OpenAI|Anthropic|Gemini|Grok|GPT-\d|Llama|DeepSeek|Qwen)\b/i.test(visible)) errors.push('Assistant, model, or vendor name in visible copy')
  return errors
}

export function validateLinkReport(urls, report, now = Date.now()) {
  const errors = []
  if (!record(report) || !Array.isArray(report.results) || report.results.some(item => !record(item) || !normalize(item.url))) return ['Invalid link report']
  for (const url of urls) {
    const entries = report.results.filter(item => normalize(item.url) === normalize(url))
    const entry = entries[0]
    const age = now - Date.parse(entry?.checkedAt)
    if (entries.length !== 1 || !isPublicHttps(url) || entry.ok !== true || !Number.isInteger(entry.status) || entry.status < 200 || entry.status >= 300 || !isPublicHttps(entry.finalUrl) || typeof entry.bodySha256 !== 'string' || !/^[a-f0-9]{64}$/.test(entry.bodySha256) || entry.error != null || !validDate(entry.checkedAt, now) || !Number.isFinite(age) || age < -60_000 || age >= 24 * 60 * 60 * 1000) errors.push(`Link not verified within 24 hours: ${url}`)
  }
  return errors
}

async function probe(url) {
  const checkedAt = new Date().toISOString()
  try {
    let target = url
    let response
    for (let redirects = 0; redirects <= 5; redirects++) {
      if (!isPublicHttps(target)) throw new Error('Non-public HTTPS URL')
      response = await fetch(target, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'n3wth-editorial-link-check/1.0 (+https://n3wth.com)' } })
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location')
        if (!location) throw new Error('Redirect without location')
        await response.body?.cancel()
        if (redirects === 5) throw new Error('Too many redirects')
        target = new URL(location, target).href
        continue
      }
      break
    }
    const body = await response.text()
    const blocked = isChallenge(body)
    const ok = response.ok && body.length > 100 && !blocked
    return { url, finalUrl: target, checkedAt, status: response.status, ok, bodySha256: hash(body), title: body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || null, error: ok ? null : 'HTTP, empty body, or challenge page; inspect with source tools before publication' }
  } catch (error) {
    return { url, checkedAt, ok: false, error: error.message }
  }
}

async function readReview(id) {
  const review = await readJson(`docs/editorial/reviews/${id}.json`)
  if (!record(review) || review.id !== id) throw new Error('Review ID does not match backlog item')
  if (!nonempty(review.contentPath)) throw new Error('Invalid review content path')
  const contentPath = await realpath(resolve(root, review.contentPath))
  const path = relative(await realpath(root), contentPath)
  if (path === '..' || path.startsWith(`..${sep}`)) throw new Error('Content path outside repository')
  return { review, text: await readFile(contentPath, 'utf8') }
}

async function main() {
  const [command = 'backlog', id, reportPath] = process.argv.slice(2)
  const backlog = await readJson('docs/editorial/backlog.json')
  const sources = await readJson('docs/editorial/sources.json')
  if (command === 'affected-reviews') {
    const names = (await readdir(resolve(root, 'docs/editorial/reviews'))).filter(name => name.endsWith('.json'))
    const reviews = await Promise.all(names.map(name => readJson(`docs/editorial/reviews/${name}`)))
    const paths = id ? execFileSync('git', ['diff', '--name-only', '-z', id, 'HEAD', '--'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean) : undefined
    console.log(reviewsForChanges(reviews, paths).map(review => review.id).join('\n'))
    return
  }
  if (command === 'backlog') {
    const errors = validateBacklog(backlog, sources)
    const mdFiles = await readdir(resolve(root, 'apps/portfolio/content'), { recursive: true })
    const registry = await readFile(resolve(root, 'apps/portfolio/src/components/thinking/registry.tsx'), 'utf8')
    for (const item of backlog.items) {
      const path = item.site === 'garden' ? mdFiles.find(path => path.endsWith('.md') && path.slice(0, -3).toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9/]+/g, '-').replace(/^-|-$/g, '') === item.slug) : null
      const exists = item.site === 'garden' ? Boolean(path) : registry.includes(`id: '${item.slug}'`)
      if (exists && item.status === 'planned') errors.push(`Existing route still marked planned: ${item.id}`)
    }
    console.log(JSON.stringify({ items: backlog.items.length, errors }, null, 2))
    if (errors.length) process.exitCode = 1
    return
  }
  if (command === 'next') {
    const ledger = id ? JSON.parse(await readFile(resolve(id), 'utf8')) : undefined
    console.log(JSON.stringify(selectNext(backlog, ledger), null, 2))
    return
  }
  const item = backlog.items.find(item => item.id === id)
  if (!item && !(command === 'links' && id === 'all')) throw new Error('Supply a known backlog ID or all for link discovery')
  if (command === 'links') {
    const urls = id === 'all' ? [...new Set(Object.values(sources).map(source => source.url))] : outboundLinks((await readReview(id)).text)
    const results = []
    for (let start = 0; start < urls.length; start += 4) results.push(...await Promise.all(urls.slice(start, start + 4).map(probe)))
    const report = { checkedAt: new Date().toISOString(), results }
    if (reportPath) await writeFile(resolve(reportPath), JSON.stringify(report, null, 2) + '\n')
    console.log(JSON.stringify(report, null, 2))
    if (results.some(result => !result.ok)) process.exitCode = 1
    return
  }
  if (!['review', 'release'].includes(command)) throw new Error('Use backlog, next [ledger], links <ID|all> [report], review <ID>, or release <ID> <report>')
  const { review, text } = await readReview(id)
  const headSha = review.headSha === undefined ? undefined : execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  const errors = validateReview(text, review, sources, Date.now(), headSha)
  if (command === 'release') {
    if (!reportPath) throw new Error('Release requires a fresh link report')
    errors.push(...validateLinkReport(outboundLinks(text), JSON.parse(await readFile(resolve(reportPath), 'utf8'))))
  }
  console.log(JSON.stringify({ id, contentSha256: hash(text), errors }, null, 2))
  if (errors.length) process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1 })
