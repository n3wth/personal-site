import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cp, mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { hash, isChallenge, outboundLinks, reviewsForChanges, selectNext, validateBacklog, validateLinkReport, validateReview } from './check.mjs'

const sources = JSON.parse(readFileSync(new URL('./sources.json', import.meta.url)))
const backlog = JSON.parse(readFileSync(new URL('./backlog.json', import.meta.url)))
const now = Date.parse('2026-09-18T12:00:00Z')
const article = 'A claim.\n' + ['beir', 'memory', 'prov'].map(id => `[source](${sources[id].url})`).join('\n')
const makeReview = (text = article) => ({
  id: 'G01', contentPath: 'article.md',
  contentSha256: hash(text), reviewedAt: '2026-09-17', reviewer: 'test', decision: 'pass',
  scores: { originality: 4, usefulness: 4, evidence: 4, clarity: 4, limitations: 4 },
  publicSafe: true, brandsChecked: true, internalLinksChecked: true, claimsComplete: true,
  claims: ['beir', 'memory', 'prov'].map(sourceId => ({ text: 'A claim.', kind: 'sourced', sourceId, sourcePassage: 'Test evidence', limitation: 'Test only', verdict: 'supported' }))
})
const linkResult = url => ({ url, finalUrl: url, checkedAt: new Date(now).toISOString(), status: 200, ok: true, bodySha256: hash('Source content'), title: 'Source', error: null })

test('live links are checked for changed manuscripts, changed reviews, all source changes, and full audits', () => {
  const reviews = [{ id: 'G01', contentPath: 'article.md' }, { id: 'G02', contentPath: 'second.md' }]
  assert.deepEqual(reviewsForChanges(reviews, ['article.md']), [reviews[0]])
  assert.deepEqual(reviewsForChanges(reviews, ['docs/editorial/reviews/G02.json']), [reviews[1]])
  assert.deepEqual(reviewsForChanges(reviews, ['docs/editorial/sources.json']), reviews)
  assert.deepEqual(reviewsForChanges(reviews), reviews)
  assert.deepEqual(reviewsForChanges(reviews, ['docs/editorial/backlog.json', 'unreviewed.md']), [])
})

test('an HTTP 200 challenge page is not valid source evidence', () => {
  assert.equal(isChallenge('<html><title>Client Challenge</title></html>'), true)
  assert.equal(isChallenge('<title>BEIR retrieval benchmark</title>'), false)
})

test('backlog contains complete briefs and a unique release order', () => {
  assert.deepEqual(validateBacklog(backlog, sources), [])
  const broken = structuredClone(backlog)
  broken.items.push(broken.items[0])
  assert.ok(validateBacklog(broken, sources).some(error => error.includes('Duplicate')))
  broken.cadence.order[0] = 'UNKNOWN'
  assert.ok(validateBacklog(broken, sources).some(error => error.includes('Release order')))
})

test('links are deduplicated and markdown punctuation is excluded', () => {
  assert.deepEqual(outboundLinks('[one](https://example.com/a) [two](https://example.com/a) <https://example.com/b>'), ['https://example.com/a', 'https://example.com/b'])
})

test('external links include HTTP, mixed-case schemes, and protocol-relative destinations', () => {
  const text = '[plain](http://example.com/a) <HTTPS://example.com/b> <a href="//example.com/c">C</a> <Link href={"https://example.com/d?a=1&amp;b=2"} />'
  assert.deepEqual(outboundLinks(text), ['http://example.com/a', 'HTTPS://example.com/b', 'https://example.com/c', 'https://example.com/d?a=1&b=2'])
})

test('link extraction preserves balanced parentheses and separates surrounding copy', () => {
  const text = '[paper](https://example.com/paper_(version_2)) and https://example.com/source.\n`https://example.com/code`\n[ref]: https://example.com/reference\n[dot](https://example.com/ends.)'
  assert.deepEqual(outboundLinks(text), ['https://example.com/paper_(version_2)', 'https://example.com/source', 'https://example.com/code', 'https://example.com/reference', 'https://example.com/ends.'])
})

test('failed, missing, and stale link checks block release', () => {
  const now = Date.parse('2026-09-17T12:00:00Z')
  const url = 'https://example.com/a'
  const result = { ...linkResult(url), checkedAt: new Date(now).toISOString() }
  assert.deepEqual(validateLinkReport([url], { results: [result] }, now), [])
  for (const entry of [{ ...result, ok: false }, { ...result, checkedAt: '2026-09-15' }, { ...result, checkedAt: 'bad date' }]) {
    assert.equal(validateLinkReport([url], { results: [entry] }, now).length, 1)
  }
  assert.equal(validateLinkReport([url], { results: [] }, now).length, 1)
})

test('incomplete, contradictory, future, and duplicate link receipts fail closed', () => {
  const url = 'https://example.com/a'
  const result = linkResult(url)
  for (const patch of [
    { status: 404 }, { status: 302 }, { status: '200' }, { status: undefined },
    { bodySha256: undefined }, { bodySha256: 'invalid' },
    { finalUrl: undefined }, { finalUrl: 'http://example.com/a' },
    { finalUrl: 'https://127.0.0.1/a' }, { error: 'fetch failed' },
    { checkedAt: '2026-09-19T12:00:00Z' }, { checkedAt: null }
  ]) {
    assert.ok(validateLinkReport([url], { results: [{ ...result, ...patch }] }, now).length, JSON.stringify(patch))
  }
  for (const results of [[result, { ...result, ok: false }], [{ ...result, ok: false }, result]]) {
    assert.ok(validateLinkReport([url], { results }, now).length)
  }
  for (const report of [null, {}, { results: {} }, { results: [null, {}] }]) {
    assert.ok(validateLinkReport([url], report, now).length)
  }
  assert.ok(validateLinkReport([url], { results: [result] }, NaN).length)
})

test('receipt matching keeps distinct paths separate and ignores page fragments', () => {
  const url = 'https://example.com/a'
  assert.ok(validateLinkReport([`${url}/`], { results: [linkResult(url)] }, now).length)
  assert.deepEqual(validateLinkReport([`${url}#section`], { results: [linkResult(url)] }, now), [])
})

test('content edits and missing evidence invalidate editorial approval', () => {
  const text = article
  const review = makeReview()
  assert.deepEqual(validateReview(text, review, sources), [])
  assert.ok(validateReview(text + ' Changed.', review, sources).includes('Article changed after editorial review'))
  const broken = structuredClone(review)
  broken.claims[0].sourcePassage = ''
  assert.ok(validateReview(text, broken, sources).some(error => error.includes('Unsupported claim')))
  broken.scores.evidence = 3
  assert.ok(validateReview(text, broken, sources).some(error => error.includes('below 4/5')))
  assert.ok(validateReview(text + ' https://unknown.example/source', review, sources).some(error => error.includes('Unreviewed outbound')))
})

test('registry membership alone does not approve a citation for this article', () => {
  for (const url of [sources.pgvector.url, 'http://unknown.example/source', '//unknown.example/source']) {
    const text = article + `\n[extra](${url})`
    assert.ok(validateReview(text, makeReview(text), sources, now).some(error => error.includes('Unreviewed outbound')))
  }
})

test('editorial metadata and claim evidence must contain valid values', () => {
  for (const patch of [
    { reviewer: ' \n' }, { reviewer: {} }, { reviewedAt: 'bad date' },
    { reviewedAt: '2026-02-30' }, { reviewedAt: '2099-01-01' }, { reviewedAt: true },
    { claims: null }, { claims: {} }, { claims: [null] }
  ]) {
    assert.ok(validateReview(article, { ...makeReview(), ...patch }, sources, now).length, JSON.stringify(patch))
  }
  assert.ok(validateReview(article, null, sources, now).length)
  for (const field of ['text', 'sourcePassage', 'limitation']) {
    for (const value of ['', ' \n', true, {}]) {
      const review = makeReview()
      review.claims[0][field] = value
      assert.ok(validateReview(article, review, sources, now).length, `${field}: ${JSON.stringify(value)}`)
    }
  }
  const review = makeReview()
  review.claims.push({ kind: 'recommendation', text: 'A claim.', rationale: ' ' })
  assert.ok(validateReview(article, review, sources, now).includes('Unclassified claim'))
})

test('source aliases cannot inflate the number of reviewed or primary sources', () => {
  const registry = { ...sources, memory: sources.beir, prov: { ...sources.prov, kind: 'practitioner' } }
  const text = article.replace(sources.memory.url, sources.beir.url)
  const errors = validateReview(text, makeReview(text), registry, now)
  assert.ok(errors.includes('Need three reviewed sources'))
  assert.ok(errors.includes('Need two primary/standards/implementation sources'))
})

test('invalid source URLs produce review errors', () => {
  for (const url of ['bad URL', 'http://example.com/source', null]) {
    const registry = { ...sources, beir: { ...sources.beir, url } }
    assert.ok(validateReview(article, makeReview(), registry, now).some(error => error.includes('Unsupported claim')))
  }
})

test('cross-site links are navigation, never independent evidence', () => {
  const url = 'https://garden.n3wth.com/system-design'
  const text = article + `\n[Related](${url})`
  assert.deepEqual(validateReview(text, makeReview(text), sources, now), [])
  assert.ok(outboundLinks(text).includes(url))
  assert.ok(validateLinkReport(outboundLinks(text), { results: outboundLinks(article).map(linkResult) }, now).some(error => error.includes(url)))
  const registry = { ...sources, beir: { ...sources.beir, url } }
  assert.ok(validateReview(text, makeReview(text), registry, now).some(error => error.includes('Unsupported claim')))
  const spoof = article + '\n[Related](https://garden.n3wth.com.evil.example/path)'
  assert.ok(validateReview(spoof, makeReview(spoof), sources, now).some(error => error.includes('Unreviewed outbound')))
})

test('optional review head metadata must be a full hash matching the checked head', () => {
  const headSha = 'a'.repeat(40)
  assert.deepEqual(validateReview(article, { ...makeReview(), headSha }, sources, now, headSha), [])
  for (const value of [null, {}, '', 'abc123', 'b'.repeat(40)]) {
    assert.ok(validateReview(article, { ...makeReview(), headSha: value }, sources, now, headSha).includes('Invalid or stale review headSha'))
  }
})

test('next resumes unfinished work and skips live or distributed ledger receipts', () => {
  const queue = { cadence: { order: ['G01', 'G02', 'G03'] }, items: [
    { id: 'G01', status: 'planned' }, { id: 'G02', status: 'drafted' }, { id: 'G03', status: 'planned' }
  ] }
  assert.equal(selectNext(queue).id, 'G02')
  assert.equal(selectNext(queue, { items: { G03: { phase: 'pr_open' } } }).id, 'G03')
  assert.equal(selectNext(queue, { items: { G01: { phase: 'live' }, G02: { phase: 'distributed' } } }).id, 'G03')
  assert.equal(selectNext(queue, { items: { G02: { phase: 'merged', liveUrl: 'https://garden.n3wth.com/already-live' } } }).id, 'G01')
  assert.equal(selectNext(queue, { items: Object.fromEntries(queue.items.map(item => [item.id, { phase: 'live' }])) }), null)
  for (const ledger of [null, {}, { items: [] }, { items: { G01: null } }, { items: { G01: { phase: 'typo' } } }]) assert.throws(() => selectNext(queue, ledger), /Invalid publishing ledger/)
})

async function cliFixture(t) {
  const directory = await realpath(await mkdtemp(join(tmpdir(), 'editorial-check-')))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const root = join(directory, 'repo')
  const editorial = join(root, 'docs/editorial')
  await mkdir(join(editorial, 'reviews'), { recursive: true })
  await mkdir(join(root, 'packages/site-config'), { recursive: true })
  await cp(new URL('../../packages/site-config/index.js', import.meta.url), join(root, 'packages/site-config/index.js'))
  await cp(new URL('./check.mjs', import.meta.url), join(editorial, 'check.mjs'))
  await writeFile(join(editorial, 'sources.json'), JSON.stringify(sources))
  await writeFile(join(editorial, 'backlog.json'), JSON.stringify(backlog))
  await writeFile(join(root, 'article.md'), article)
  const reviewPath = join(editorial, 'reviews/G01.json')
  await writeFile(reviewPath, JSON.stringify(makeReview()))
  const run = (args, fetchCode = 'throw new Error("Unexpected network request")') => spawnSync(process.execPath, [
    '--import', `data:text/javascript,${encodeURIComponent(`globalThis.fetch = async () => { ${fetchCode} }`)}`,
    join(editorial, 'check.mjs'), ...args
  ], { encoding: 'utf8', timeout: 10000 })
  return { directory, root, reviewPath, run }
}

test('next reads only the explicitly supplied ledger and fails on a missing ledger', async t => {
  const { directory, run } = await cliFixture(t)
  const ledgerPath = join(directory, 'state.json')
  await writeFile(ledgerPath, JSON.stringify({ items: { G01: { phase: 'live' }, G03: { phase: 'validated' } } }))
  const result = run(['next', ledgerPath])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(JSON.parse(result.stdout).id, 'G03')
  assert.equal(run(['next', join(directory, 'missing.json')]).status, 1)
})

test('links, review, and release reject mismatched review identities and escaping content paths', async t => {
  const fixture = await cliFixture(t)
  await writeFile(join(fixture.directory, 'outside.md'), article)
  await symlink(join(fixture.directory, 'outside.md'), join(fixture.root, 'linked.md'))
  for (const patch of [{ id: 'G02' }, { contentPath: '../outside.md' }, { contentPath: 'linked.md' }]) {
    await writeFile(fixture.reviewPath, JSON.stringify({ ...makeReview(), ...patch }))
    for (const command of ['links', 'review', 'release']) {
      const result = fixture.run([command, 'G01'])
      assert.equal(result.status, 1)
      assert.match(result.stderr, /Review ID|Content path outside repository/)
      assert.equal(result.stdout, '')
    }
  }
})

test('link probing rejects transport failures and produces receipts accepted by release', async t => {
  const { directory, run } = await cliFixture(t)
  const body = '<title>Research source</title>' + 'Evidence. '.repeat(20)
  const reportPath = join(directory, 'links.json')
  const links = run(['links', 'G01', reportPath], `return new Response(${JSON.stringify(body)}, { status: 200 })`)
  assert.equal(links.status, 0, links.stderr)
  const release = run(['release', 'G01', reportPath])
  assert.equal(release.status, 0, release.stderr + release.stdout)
  for (const fetchCode of [
    'throw new Error("offline")',
    `return new Response(${JSON.stringify(body)}, { status: 404 })`,
    `return new Response(${JSON.stringify(body.replace('Research source', 'Client Challenge'))})`,
    'return new Response("short")',
    'return new Response(null, { status: 302, headers: { location: "https://127.0.0.1/private" } })',
    'return new Response(null, { status: 302, headers: { location: "/loop" } })'
  ]) {
    const result = run(['links', 'G01'], fetchCode)
    assert.equal(result.status, 1, `${fetchCode}\n${result.stderr}\n${result.stdout}`)
    assert.ok(JSON.parse(result.stdout).results.every(entry => entry.ok === false))
  }
})
