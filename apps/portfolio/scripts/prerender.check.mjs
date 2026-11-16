import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { JSDOM } from 'jsdom'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')

for (const [slug, title] of [
  ['configuration', 'Configuration'],
  ['knowledge-graph', 'Knowledge Graph Tools'],
  ['cache-tools', 'Cache and Sync Tools'],
  ['memory-tools', 'Memory Tools Reference'],
  ['troubleshooting', 'Troubleshooting'],
]) {
  test(`repeated r3 path redirects to the published ${slug} page`, () => {
    const destination = `/docs/r3/${slug}`
    const alias = `/docs/r3/r3/${slug}`
    const redirects = read('../dist/_redirects').trim().split('\n').map(line => line.trim().split(/\s+/))
    for (const source of [alias, `${alias}/`]) {
      assert.ok(redirects.some(([from, to, status]) => from === source && to === destination && status === '308'), `Missing permanent redirect for ${source}`)
    }
    const redirect = new JSDOM(read(`../dist${alias}/index.html`))
    const page = new JSDOM(read(`../dist${destination}/index.html`))
    try {
      assert.equal(redirect.window.document.querySelector('meta[http-equiv="refresh"]')?.content, `0;url=${destination}`)
      assert.equal(page.window.document.querySelector('main h1')?.textContent, title)
      for (const link of page.window.document.querySelectorAll('a[href]')) {
        assert.ok(!link.getAttribute('href').startsWith('/docs/r3/r3/'), `Repeated r3 path in ${destination}`)
      }
    } finally {
      redirect.window.close()
      page.window.close()
    }
  })
}

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
