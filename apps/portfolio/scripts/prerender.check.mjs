import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { JSDOM } from 'jsdom'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')

test('final article HTML preserves authored chapters and links without JavaScript', () => {
  const dom = new JSDOM(read('../dist/thinking/field-guide/index.html'))
  try {
    const main = dom.window.document.querySelector('main')
    assert.equal(main.querySelectorAll('h1').length, 1)
    assert.ok([...main.querySelectorAll('h2')].some(h => h.textContent === 'Figure out the story'))
    assert.ok(main.querySelector('a[href="/thinking/night-field"]'))
    for (const path of ['/support', '/privacy', '/terms', '/consent']) {
      assert.ok(dom.window.document.querySelector(`a[href="${path}"]`), `Missing crawlable ${path}`)
    }
  } finally { dom.window.close() }
})

test('final note schema, sitemap and feed preserve source publication and revision dates', () => {
  const notes = JSON.parse(read('../src/data/writing-index.json'))
  const sitemap = new JSDOM(read('../dist/sitemap.xml'), { contentType: 'application/xml' })
  const feed = new JSDOM(read('../dist/feed.xml'), { contentType: 'application/xml' })
  try {
    const urls = new Map([...sitemap.window.document.querySelectorAll('url')].map(node => [node.querySelector('loc').textContent, node.querySelector('lastmod')?.textContent]))
    const entries = new Map([...feed.window.document.querySelectorAll('entry')].map(node => [node.querySelector('id').textContent, node]))
    for (const note of notes) {
      const url = `https://n3wth.com${note.href}`
      const dom = new JSDOM(read(`../dist${note.href}/index.html`))
      try {
        const article = [...dom.window.document.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent)).find(value => value['@type'] === 'Article')
        assert.equal(article.datePublished, note.date, `${note.slug}: publication`)
        assert.equal(article.dateModified, note.updated || note.date, `${note.slug}: revision`)
        assert.equal(urls.get(url), note.date ? note.updated || note.date : undefined, `${note.slug}: sitemap`)
        if (note.date) {
          assert.equal(entries.get(url)?.querySelector('published')?.textContent, new Date(note.date).toISOString(), `${note.slug}: feed publication`)
          assert.equal(entries.get(url)?.querySelector('updated')?.textContent, new Date(note.updated || note.date).toISOString(), `${note.slug}: feed revision`)
        }
      } finally { dom.window.close() }
    }
  } finally {
    sitemap.window.close()
    feed.window.close()
  }
})

test('final docs canonical and Open Graph URLs match the sitemap', () => {
  const sitemap = new JSDOM(read('../dist/sitemap.xml'), { contentType: 'application/xml' })
  try {
    const docs = [...sitemap.window.document.querySelectorAll('loc')]
      .map(node => new URL(node.textContent))
      .filter(({ pathname }) => pathname === '/docs' || pathname.startsWith('/docs/'))
    assert.ok(docs.length, 'Missing docs URLs in the sitemap')
    for (const url of docs) {
      assert.ok(!url.pathname.endsWith('/'), `${url}: sitemap URL must be slashless`)
      const dom = new JSDOM(read(`../dist${url.pathname}/index.html`))
      try {
        const { document } = dom.window
        const canonical = [...document.querySelectorAll('link[rel="canonical"]')].map(tag => tag.href)
        const openGraph = [...document.querySelectorAll('meta[property="og:url"]')].map(tag => tag.content)
        assert.deepEqual(canonical, [url.href], `${url}: canonical`)
        assert.deepEqual(openGraph, [url.href], `${url}: Open Graph URL`)
      } finally { dom.window.close() }
    }
  } finally { sitemap.window.close() }
})
