import { test, expect } from '@playwright/test'
import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { layoutWritingGroves, type WritingNode } from '../../apps/portfolio/src/lib/writingGroves'

test('prefix search lists elephant-goldfish without an empty answer', async ({ page }, testInfo) => {
  await page.route('**/api/search', route => route.fulfill({
    json: { answer: 'No relevant information found. Try another search.' },
  }))
  await page.goto('/work')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Search n3wth.com' })
  await expect(dialog.getByRole('option', { name: 'Work', exact: true })).toBeVisible()
  await expect(dialog.getByRole('option', { name: 'elephant-goldfish', exact: true })).toBeVisible()
  const input = dialog.getByRole('combobox')
  const elapsed = await input.evaluate(async (element) => {
    const started = performance.now()
    const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    proto?.set?.call(element, 'elepha')
    element.dispatchEvent(new Event('input', { bubbles: true }))
    const ready = () => document.querySelector('.command-palette-mark')?.textContent === 'elepha'
    while (!ready()) {
      if (performance.now() - started > 500) break
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
    return performance.now() - started
  })
  expect(elapsed).toBeLessThan(150)
  const option = dialog.getByRole('option', { name: 'elephant-goldfish', exact: true })
  await expect(option).toBeVisible()
  await expect(option.locator('.command-palette-mark')).toHaveText('elepha')
  await expect(option.locator('.command-palette-mark')).toHaveCSS('font-style', 'normal')
  expect(Number(await option.locator('.command-palette-mark').evaluate(el => getComputedStyle(el).fontWeight))).toBeGreaterThanOrEqual(600)
  await expect(page.getByText('No relevant information found. Try another search.')).toHaveCount(0)
  await page.waitForResponse('**/api/search')
  await expect(page.getByText(/No relevant information found/)).toHaveCount(0)
  await expect(option).toBeVisible()
  await dialog.screenshot({ path: testInfo.outputPath('search-elepha.png') })
  await input.focus()
  await page.keyboard.press('ArrowDown')
  await expect(input).toHaveAttribute('aria-activedescendant', /command-palette-option-/)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('long search answers remain scrollable without hiding local results', async ({ page }, testInfo) => {
  await page.route('**/api/search', route => route.fulfill({ json: {
    answer: 'This is an example answer about the projects and experience on this portfolio. '.repeat(28)
      + ' Sources: [Work](https://n3wth.com/work).',
  } }))
  await page.goto('/work')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await page.getByRole('combobox').fill('projects')
  const answer = page.getByRole('region', { name: 'Search answer' })
  await expect(answer.getByText('This is an example answer', { exact: false })).toBeVisible()
  const results = page.getByRole('listbox', { name: 'Search results' })
  await expect(results.getByRole('option', { name: 'Projects', exact: true, selected: true })).toBeInViewport()
  expect(await answer.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)
  await answer.focus()
  await page.keyboard.press('End')
  await expect(answer.getByRole('link', { name: 'Work', exact: true })).toBeInViewport()
  await expect(results.getByRole('option', { name: 'Projects', exact: true, selected: true })).toBeInViewport()
  await page.screenshot({ path: testInfo.outputPath('search-long-answer.png') })
  await page.getByRole('combobox').focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects$/)
})

test('permanent footer navigation starts new pages at the top', async ({ page }, testInfo) => {
  await page.goto('/work')
  const continuation = page.getByRole('navigation', { name: 'Footer', exact: true })
  await continuation.scrollIntoViewIfNeeded()
  await expect(continuation.getByRole('link')).toHaveText(['Work', 'Projects', 'Art', 'Thinking', 'Library', 'Contact', 'Privacy', 'Terms', 'Support', 'SMS consent', 'GitHub'])
  await expect(page.locator('.n3wth-site-footer')).toHaveCSS('border-top-width', '0px')
  await page.screenshot({ path: testInfo.outputPath('work-continuation.png') })
  await page.locator('.n3wth-site-footer').screenshot({ path: testInfo.outputPath('footer.png') })
  await continuation.getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.locator('main h1')).toHaveText('Projects')
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  await page.locator('footer').getByRole('link', { name: 'Contact', exact: true }).click()
  await expect(page.locator('main h1')).toHaveText('Contact')
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  await page.goto('/thinking/frameworks/5-whys')
  await expect(page.getByRole('navigation', { name: 'Continue exploring' })).toHaveCount(0)
})

test('section content follows the hero without repeated artwork', async ({ page }, testInfo) => {
  for (const route of ['/work', '/thinking']) {
    await page.goto(route)
    const content = page.locator(route === '/work' ? '#work' : '.thinking-page')
    await expect(content).toBeVisible()
    const hero = await page.locator('.portfolio-story-hero').boundingBox()
    const bounds = await content.boundingBox()
    expect(bounds!.y - (hero!.y + hero!.height)).toBeLessThan(180)
    await expect(page.locator('.section-story')).toHaveCount(1)
    await content.locator('h2, input').first().scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`${route.slice(1)}-content.png`) })
  }
})

test('projects artwork fills the available stage without visible captions', async ({ page }) => {
  const widths = [page.viewportSize()!.width]
  // The project matrix covers mobile, tablet and desktop; check the two
  // artwork breakpoints once, rather than repeating every width per project.
  if (widths[0] === 1440) widths.push(768, 1024)
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/projects')
    const artwork = page.locator('.section-story--projects svg')
    await expect(artwork).toBeVisible()
    const geometry = await artwork.evaluate(svg => {
      const bounds = svg.getBoundingClientRect()
      const hero = document.querySelector('.portfolio-story-hero')!.getBoundingClientRect()
      const stage = document.querySelector('.portfolio-story-hero > .section-story')!.getBoundingClientRect()
      return { center: bounds.x + bounds.width / 2, heroLeft: hero.x, heroWidth: hero.width, width: bounds.width, height: bounds.height, stageHeight: stage.height, stageBottom: stage.bottom, heroBottom: hero.bottom }
    })
    const center = geometry.heroLeft + geometry.heroWidth / 2
    expect(Math.abs(geometry.center - center)).toBeLessThanOrEqual(1)
    expect(geometry.width).toBeGreaterThan(Math.min(width * .6, geometry.stageHeight * .9))
    expect(geometry.height).toBeGreaterThan(Math.min(width, geometry.stageHeight) * .8)
    expect(Math.abs(geometry.stageBottom - geometry.heroBottom)).toBeLessThanOrEqual(1)
    await expect(page.getByRole('heading', { level: 1 })).toHaveClass('sr-only')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('malformed fragments keep public pages usable', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  for (const route of ['/work#%', '/thinking/frameworks/5-whys#%E0%A4%A', '/projects#%ZZ']) {
    await page.goto(route)
    await expect(page.locator('main h1')).toBeVisible()
    await expect(page.locator('header').first()).toBeVisible()
    await expect(page.getByText('Unexpected Application Error!')).toHaveCount(0)
  }
  expect(errors).toEqual([])
})

test('encoded fragments still reach their headings', async ({ page }) => {
  await page.goto('/thinking/frameworks/5-whys#%75sage')
  await expect(page.locator('#usage')).toBeInViewport()
})

test('reading pages center their columns and put dates below the title', async ({ page }, testInfo) => {
  for (const slug of ['personal-knowledge-graph', 'audit-retrieval-before-trusting-an-answer']) {
    await page.goto(`/thinking/${slug}`)
    const title = page.getByRole('heading', { level: 1 })
    await expect(title).toBeVisible()
    const bounds = await page.locator('.thinking-reading-page').boundingBox()
    // The root reserves a stable scrollbar gutter even before content overflows.
    // Measure the rendered body rather than viewport/clientWidth, which include it.
    const body = await page.locator('body').boundingBox()
    const left = bounds!.x - body!.x
    const right = body!.x + body!.width - bounds!.x - bounds!.width
    expect(Math.abs(left - right), JSON.stringify({ bounds, body })).toBeLessThan(2)
    const heading = await title.boundingBox()
    const date = await page.locator('main time').first().boundingBox()
    expect(date!.y).toBeGreaterThan(heading!.y + heading!.height)
    await expect(page.locator('main a', { hasText: 'Oliver Newth' })).toHaveCount(0)
    await page.screenshot({ path: testInfo.outputPath(`${slug}.png`) })
  }
})

test('section openings fill the screen with distinct accessible stories', async ({ page }, testInfo) => {
  for (const route of ['/art', '/thinking', '/work', '/library', '/projects', '/contact']) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.locator('.portfolio-story-hero > h1')).toHaveClass('sr-only')
    await expect(page.locator('.portfolio-story-copy')).toHaveCount(0)
    const hero = page.locator('.portfolio-story-hero')
    const bounds = await hero.boundingBox()
    await expect(page.locator('.section-story')).toHaveCount(1)
    const artwork = await hero.locator('.section-story svg').boundingBox()
    expect(Math.abs(artwork!.x + artwork!.width / 2 - (bounds!.x + bounds!.width / 2))).toBeLessThanOrEqual(1)
    expect(bounds!.y + bounds!.height).toBeGreaterThanOrEqual(page.viewportSize()!.height - 1)
    await expect(hero.locator('svg').first()).toHaveAttribute('aria-hidden', 'true')
    const stage = await hero.locator('.section-story').boundingBox()
    const navigation = await page.locator('.n3wth-site-navigation-island').boundingBox()
    if (route === '/thinking') {
      const rootY = artwork!.y + artwork!.height * (740 + 25) / 860
      expect(Math.abs(rootY - (bounds!.y + bounds!.height))).toBeLessThanOrEqual(1)
    } else {
      expect(stage!.y).toBeGreaterThanOrEqual(navigation!.y + navigation!.height)
      expect(Math.abs(stage!.y + stage!.height - (bounds!.y + bounds!.height))).toBeLessThanOrEqual(1)
      expect(Math.abs(artwork!.y + artwork!.height / 2 - (stage!.y + stage!.height / 2))).toBeLessThanOrEqual(1)
    }
    await expect(page.locator('.portfolio-story-description')).toHaveCount(0)
    await expect(hero.locator('a, button')).toHaveCount(0)
    expect(await hero.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`${route.slice(1)}-hero.png`) })
  }
})

test('projects story art sits under the center of the island nav', async ({ page }) => {
  await page.goto('/projects')
  const art = page.locator('.section-story--projects svg')
  await expect(art).toBeVisible()
  const island = await page.locator('.n3wth-site-navigation-island').boundingBox()
  const bounds = await art.boundingBox()
  expect(Math.abs(bounds!.x + bounds!.width / 2 - (island!.x + island!.width / 2))).toBeLessThan(2)
})

test('Art uses each installation image once', async ({ page }) => {
  await page.goto('/art')
  await expect(page.getByRole('heading', { name: 'Art', exact: true })).toBeVisible()
  const images = await page.locator('main img').evaluateAll(elements => elements.map(element => element.getAttribute('src')))
  expect(images).toHaveLength(3)
  expect(new Set(images).size).toBe(3)
})

import { expectSiteFoundation } from './site-foundation'

test.beforeEach(async ({ page }) => {
  await page.route(/https:\/\/(elephant\.n3wth\.com|[^/]*posthog\.(com|net))\//, route => route.abort())
})

test('Thinking notes keep local links, topics, anchors and browser Back', async ({ page, request }) => {
  await page.goto('/thinking/frameworks/5-whys#usage')
  await expect(page.getByRole('heading', { level: 1, name: '5 Whys', exact: true })).toBeVisible()
  await expect(page.locator('#usage')).toBeInViewport()
  const contents = page.getByRole('button', { name: 'Contents', exact: true })
  await expect(contents).toHaveAttribute('aria-expanded', 'false')
  await contents.click()
  await expect(contents).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.thinking-note-outline a[href="#usage"]')).toBeVisible()
  await contents.click()
  await expect(contents).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://n3wth.com/thinking/frameworks/5-whys')
  await expect(page.locator('.thinking-note-prose img').first()).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('navigation', { name: 'Note topics' }).getByRole('link', { name: 'strategy', exact: true }).click()
  await expect(page).toHaveURL(/\/thinking\?topic=strategy#notes$/)
  await expect(page.getByLabel('Search writing', { exact: true })).toBeVisible()
  await page.getByLabel('Search writing', { exact: true }).fill('5 Whys')
  await expect(page.getByRole('status')).toContainText('1 result')
  await page.locator('#notes').getByRole('link', { name: '5 Whys', exact: true }).click()
  await expect(page).toHaveURL(/\/thinking\/frameworks\/5-whys$/)
  await expect(page.getByRole('heading', { name: 'Linked from', exact: true })).toBeVisible()
  await page.goBack()
  await expect(page.getByLabel('Search writing', { exact: true })).toHaveValue('5 Whys')
  const html = await (await request.get('/thinking/frameworks/5-whys/index.html')).text()
  expect(html).toMatch(/<h1[^>]*>5 Whys<\/h1>/)
  expect(html).toContain('https://n3wth.com/thinking/frameworks/5-whys')
  expect(html).toContain('href="/thinking/frameworks/frameworks-map"')
})

test('Thinking loads more writing on scroll and restores its collection and filters', async ({ page }) => {
  await page.goto('/thinking')
  await expect(page.getByRole('heading', { level: 1, name: 'Thinking', exact: true })).toBeVisible()
  await expect(page.locator('.writing-results > li')).toHaveCount(24)
  const unfilteredResults = await page.getByRole('status').innerText()
  await page.getByLabel('Search writing', { exact: true }).scrollIntoViewIfNeeded()
  const scrollBeforeSearch = await page.evaluate(() => scrollY)
  await page.getByLabel('Search writing', { exact: true }).fill('agents')
  await expect(page).toHaveURL(/q=agents#notes$/)
  await expect(page.getByLabel('Search writing', { exact: true })).toHaveValue('agents')
  expect(await page.evaluate(() => scrollY)).toBe(scrollBeforeSearch)
  await page.getByLabel('Search writing', { exact: true }).fill('')
  await expect(page).toHaveURL(/\/thinking#notes$/)
  await expect(page.getByRole('status')).toHaveText(unfilteredResults)
  await page.getByRole('navigation', { name: 'Writing format' }).getByRole('link', { name: 'Articles', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('21 results')
  await page.getByRole('navigation', { name: 'Writing format' }).getByRole('link', { name: 'Notes', exact: true }).click()
  await expect(page).toHaveURL(/kind=notes#notes$/)
  await expect(page.locator('.writing-results > li')).toHaveCount(24)
  await page.locator('.writing-results > li').last().scrollIntoViewIfNeeded()
  await expect(page).toHaveURL(/kind=notes&page=2$/)
  await expect(page.locator('.writing-results > li')).toHaveCount(48)
  const first = page.locator('.writing-results a').nth(23)
  const title = await first.innerText()
  await first.scrollIntoViewIfNeeded()
  const readingPosition = await page.evaluate(() => scrollY)
  await first.click()
  await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/kind=notes&page=2$/)
  await expect(page.locator('.writing-results > li')).toHaveCount(48)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(readingPosition, -1)
  await page.getByLabel('Search writing', { exact: true }).fill('5 Whys')
  await expect(page.getByRole('status')).toHaveText('1 result')
  await expect(page.locator('.writing-results a')).toHaveText('5 Whys')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('projects index connects navigation, product pages and documentation', async ({ page, request }, testInfo) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/projects/')
  await expect(page.getByRole('heading', { level: 1, name: 'Projects', exact: true })).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://n3wth.com/projects')
  const navigation = page.locator('.n3wth-site-navigation-links')
  await expect(navigation.locator('a').nth(0)).toHaveText('Art')
  await expect(navigation.locator('a').nth(1)).toHaveText('Work')
  await expect(navigation.locator('a').nth(2)).toHaveText('Projects')
  for (const slug of ['ui', 'r3']) {
    const feature = page.locator(`.project-feature--${slug}`)
    const copy = await feature.locator('.project-feature-copy').boundingBox()
    const visual = await feature.locator('.project-visual').boundingBox()
    if (page.viewportSize()!.width < 1024) {
      expect(visual!.y).toBeGreaterThanOrEqual(copy!.y + copy!.height)
      expect(visual!.y - copy!.y - copy!.height).toBeLessThanOrEqual(40)
    } else {
      expect(Math.abs(copy!.y - visual!.y)).toBeLessThanOrEqual(1)
      expect(visual!.x).toBeGreaterThan(copy!.x + copy!.width)
    }
    if (slug === 'r3') {
      const graph = await feature.locator('svg[role="img"]').boundingBox()
      expect(graph!.width).toBeLessThanOrEqual(384)
    }
    await feature.screenshot({ path: testInfo.outputPath(`project-${slug}.png`) })
  }
  await page.getByRole('textbox', { name: 'Edit the headline' }).fill('A shared foundation')
  await expect(page.locator('.project-type-sample')).toHaveText('A shared foundation')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(page.locator('.project-type-sample')).toHaveText('Make it yours.')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  for (const [slug, title] of [['r3', 'r3'], ['ui', '@n3wth/ui']]) {
    await expect(page.getByRole('heading', { level: 2, name: title, exact: true }).getByRole('link')).toBeVisible()
    // Astro serves the same generated document for direct and browser requests.
    const response = await request.get(`/projects/${slug}/index.html`)
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain(title)
    await page.goto(`/projects/${slug}`)
    await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Documentation', exact: true })).toHaveAttribute('href', `/docs/${slug}/quickstart`)
    await expect(page.getByRole('link', { name: 'All projects', exact: true })).toHaveCount(0)
    await expect(page.locator('.project-install button')).toBeVisible()
    await page.getByRole('button', { name: 'Copy code', exact: true }).click()
    const command = await page.locator('.project-install code').innerText()
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(command)
    if (slug === 'ui') {
      const checkbox = page.getByRole('checkbox', { name: 'Selected', exact: true })
      await expect(checkbox).toBeChecked()
      await checkbox.click()
      await expect(checkbox).not.toBeChecked()
    }
    const projectsLink = navigation.getByRole('link', { name: 'Projects', exact: true })
    if (!await projectsLink.isVisible()) await page.getByRole('button', { name: 'Open menu', exact: true }).click()
    await projectsLink.click()
    await expect(page).toHaveURL(/\/projects$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Projects', exact: true })).toBeVisible()
  }
  expect(await (await request.get('/sitemap.xml')).text()).toContain('<loc>https://n3wth.com/projects</loc>')
})

test('page content and footer are readable without client JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  try {
    await page.goto('http://127.0.0.1:4281/thinking')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('.n3wth-site-footer')).toHaveCount(1)
    await expect(page).toHaveTitle('Thinking — Oliver Newth')
  } finally {
    await context.close()
  }
})

test('the project action reaches the projects page after a cold route load', async ({ page }) => {
  // Keep GPU startup out of this routing check. Scene rendering is covered by
  // the home-page checks; this also exercises navigation while it is loading.
  let releaseScene: () => void = () => {}
  const pendingScene = new Promise<void>(resolve => { releaseScene = resolve })
  await page.route('**/_astro/NightField.*.js', async route => {
    await pendingScene
    await route.continue()
  })
  await page.route('**/assets/Projects-*.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 600))
    await route.continue()
  })
  try {
    await page.goto('/')
    const projects = page.locator('#primary-navigation').getByRole('link', { name: 'Projects', exact: true })
    if (!await projects.isVisible()) await page.getByRole('button', { name: 'Open menu', exact: true }).click()
    await projects.click()
    await expect(page).toHaveURL(/\/projects$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toHaveCount(1)
    await expect(page.locator('.section-story--projects')).toBeInViewport()
  } finally {
    releaseScene()
    await page.unrouteAll({ behavior: 'wait' })
  }
})

test('missing-page recovery works with the keyboard', async ({ page }) => {
  for (const [label, destination] of [['Go home', '/'], ['View work', '/work'], ['Contact', '/contact']]) {
    await page.goto('/missing-portfolio-page')
    const recovery = page.getByRole('link', { name: label, exact: true }).first()
    await recovery.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(destination)
    await expect(page.locator('main')).toBeVisible()
  }
})

test('public navigation clears article and utility metadata', async ({ page }) => {
  for (const initial of ['/error', '/thinking/gtd-mini']) {
    await page.goto(initial)
    const toggle = page.locator('.n3wth-site-navigation-toggle')
    if (await toggle.isVisible()) await toggle.click()
    await page.locator('.n3wth-site-navigation-links').getByRole('link', { name: 'Work', exact: true }).click()
    await expect(page).toHaveTitle('Work — Oliver Newth')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://n3wth.com/work')
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')
    await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(0)
    const articleCount = await page.locator('script[type="application/ld+json"]').evaluateAll(elements => elements.flatMap(element => {
      const schema = JSON.parse(element.textContent || '{}')
      return Array.isArray(schema) ? schema : [schema]
    }).filter(schema => schema['@type'] === 'Article').length)
    expect(articleCount).toBe(0)
  }
})

test('site identity is present in initial HTML and rendered routes', async ({ page, request }) => {
  const response = await request.get('/')
  expect(await response.text()).toMatch(/"@type":\s*"WebSite"/)
  for (const route of ['/', '/work', '/']) {
    await page.goto(route)
    const websites = await page.locator('script[type="application/ld+json"]').evaluateAll(elements => elements.map(element => JSON.parse(element.textContent || '{}')).filter(schema => schema['@type'] === 'WebSite'))
    expect(websites).toHaveLength(1)
    expect(websites[0]).toMatchObject({ name: 'Oliver Newth', alternateName: 'n3wth.com', url: 'https://n3wth.com/' })
  }
  await expect(page.getByRole('heading', { level: 1, name: 'Oliver Newth', exact: true })).toHaveCount(1)
})

test('diagrams are immediately visible with normal motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  for (const route of ['/thinking/gtd-mini', '/library']) {
    await page.goto(route)
    const nodes = page.locator('.kit-node-in')
    await expect(nodes.first()).toBeAttached()
    for (const node of await nodes.all()) await expect(node).toHaveCSS('opacity', '1')
    for (const line of await page.locator('.kit-line-draw').all()) {
      await expect(line).toHaveCSS('stroke-dashoffset', '0px')
    }
  }
})

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`shared visual bands remain visible with ${reducedMotion} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion })
    for (const route of ['/library']) {
      await page.goto(route)
      const band = page.locator('.n3wth-visual-band').first()
      await expect(band).toBeAttached()
      await band.scrollIntoViewIfNeeded()
      await expect(band).toBeVisible()
      await expect(band).toHaveAttribute('aria-hidden', 'true')
      await expect.poll(() => band.evaluate(element => {
        const marks = [...element.querySelectorAll('.n3wth-visual-dot, .n3wth-visual-light-path')]
        return marks.length > 0 && marks.every(mark => {
          const style = getComputedStyle(mark)
          return Number(style.opacity) > 0 && style.visibility !== 'hidden'
            && (!mark.classList.contains('n3wth-visual-light-path') || Number.parseFloat(style.strokeDashoffset) === 0)
        })
      })).toBe(true)
      expect(await band.locator('[data-reveal]').count()).toBe(0)
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    }
  })

  test(`hero stories remain visible and respect ${reducedMotion} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion })
    for (const route of ['/art', '/work', '/thinking', '/projects', '/library', '/contact']) {
      await page.goto(route)
      const hero = page.locator('.portfolio-story-hero')
      await expect(hero.locator('.section-story svg')).toBeVisible()
      const artwork = hero.locator('.section-story svg')
      if (reducedMotion === 'reduce') {
        await expect(artwork).toHaveAttribute('data-story-paused', '')
        await expect(hero.locator('.section-story__transfer')).toHaveCount(0)
      } else {
        await expect(artwork).not.toHaveAttribute('data-story-paused', '')
        const initial = await artwork.innerHTML()
        await expect.poll(() => artwork.innerHTML()).not.toBe(initial)
      }
      if (route !== '/contact') {
        await page.locator('footer').scrollIntoViewIfNeeded()
        await expect(artwork).toHaveAttribute('data-story-paused', '')
        const paused = await artwork.innerHTML()
        await page.waitForTimeout(150)
        expect(await artwork.innerHTML()).toBe(paused)
      }
    }
  })
}

test('work uses the shared theme and a usable resume action', async ({ page }, testInfo) => {
  await page.goto('/work')
  await expectSiteFoundation(page, {
    artworkHero: true,
    sectionTopPadding: '0px',
    headerPadding: '0px',
    navigationBorder: page.viewportSize()!.width < 1024 ? '0px' : '1px',
  })
  await expect(page.locator('#building')).toHaveCount(0)
  const chapters = await page.locator('.work-chapters').boundingBox()
  for (const paragraph of await page.locator('.work-chapter-story > p:first-child').all()) {
    const bounds = await paragraph.boundingBox()
    expect(bounds!.x).toBeCloseTo(chapters!.x, 0)
    expect(bounds!.width).toBeCloseTo(chapters!.width, 0)
  }
  if (page.viewportSize()!.width < 1024) {
    const brand = await page.locator('.n3wth-site-navigation-brand').boundingBox()
    expect(brand!.x).toBeCloseTo(chapters!.x, 0)
  }
  await page.locator('.work-chapter').last().scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath('work-alignment.png') })
  await expect(page.getByRole('link', { name: 'Open resume', exact: true })).toHaveAttribute('href', 'https://r2.n3wth.com/resume/oliver-newth-resume.pdf')
})

test('hybrid planting remains navigable with motion', async ({ page }, testInfo) => {
  test.setTimeout(60_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    const original = WebGL2RenderingContext.prototype.drawElements
    let draws = 0
    Object.defineProperty(window, '__sceneDraws', { get: () => draws })
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      draws++
      return original.apply(this, args)
    }
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(page.locator('.night-field-stage.is-settled')).toBeVisible({ timeout: 45_000 })
  const notes = page.locator('.world-portal-link[aria-label="Notes"]')
  await expect(notes).toBeVisible()
  await notes.focus()
  await page.screenshot({ path: testInfo.outputPath('hybrid-planting.png') })
  // Real WebGL draw calls stop below the scene and resume when it returns.
  const draws = () => page.evaluate(() => Reflect.get(window, '__sceneDraws') as number)
  expect(await draws()).toBeGreaterThan(0)
  // Scroll fully past the scene; an edge touching the viewport still intersects.
  await page.evaluate(() => {
    const spacer = document.createElement('div')
    spacer.id = 'test-scroll-room'
    spacer.style.height = '200vh'
    document.body.append(spacer)
    window.scrollTo(0, document.body.scrollHeight)
  })
  await expect.poll(() => page.locator('.night-field-stage').evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThan(0)
  // Late model uploads can request one final frame; continuous drawing must stop.
  await expect.poll(async () => {
    const before = await draws()
    await page.waitForTimeout(500)
    return await draws() - before
  }).toBe(0)
  const paused = await draws()
  await page.evaluate(() => {
    document.getElementById('test-scroll-room')?.remove()
    window.scrollTo(0, 0)
  })
  await expect.poll(draws).toBeGreaterThan(paused)
  await notes.press('Enter')
  await expect(page).toHaveURL(/\/thinking#notes$/)
  expect(errors).toEqual([])
})

test('a selected plant opens a compact, dismissible reading card', async ({ page }, testInfo) => {
  const node: WritingNode = { id: '/thinking/test-note', title: 'Connected thoughts', description: 'A short note about shared ideas.', stage: 'evergreen', tags: ['ideas'], linkCount: 0 }
  await page.route('**/writing/world.json', route => route.fulfill({ json: { nodes: [node], edges: [] } }))
  await page.goto('/')
  await expect(page.locator('.night-field-stage.is-settled')).toBeVisible({ timeout: 45_000 })
  const canvas = await page.locator('.night-field-stage canvas').boundingBox()
  const aspect = canvas!.width / canvas!.height
  const compact = aspect < 1.35
  const spread = compact ? Math.max(1, Math.min(1.35, aspect) / .5) : 1
  const [plant] = layoutWritingGroves([node], compact, spread)
  // Project the fixture's hit target through the scene's fitted camera.
  const camera = new PerspectiveCamera(Math.max(compact ? 54 : 48, MathUtils.radToDeg(2 * Math.atan((compact ? .25 : .68) / aspect))), aspect)
  camera.position.set(0, compact ? 14 : 7, compact ? 26 : 22 + Math.max(0, 1.8 - aspect) * 14)
  camera.lookAt(0, compact ? 1 : 2, -30)
  camera.updateMatrixWorld()
  const point = new Vector3(plant.x, plant.height * .65, plant.z).project(camera)
  const select = () => page.mouse.click(canvas!.x + (point.x + 1) * canvas!.width / 2, canvas!.y + (1 - point.y) * canvas!.height / 2)
  await select()
  const card = page.getByRole('region', { name: 'Selected writing' })
  await expect(card).toBeVisible()
  await expect(card.getByRole('heading')).toHaveText(node.title)
  await expect(card.getByRole('link')).toHaveCount(1)
  await expect(card.getByRole('link', { name: 'Read', exact: true })).toHaveAttribute('href', node.id)
  await page.screenshot({ path: testInfo.outputPath('selected-note.png') })
  await card.getByRole('button', { name: 'Close note' }).click()
  await expect(card).toHaveCount(0)
  await select()
  await expect(card).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(card).toHaveCount(0)
})

test('search leaves composition keys to the input method', async ({ page }) => {
  await page.goto('/work')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  const input = page.getByRole('combobox')
  await expect(input).toBeFocused()
  await input.dispatchEvent('keydown', { key: 'ArrowDown', isComposing: true })
  await expect(page.getByRole('option', { selected: true })).toHaveText('Work')
  await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true })
  await input.dispatchEvent('keydown', { key: 'Enter', keyCode: 229 })
  await input.dispatchEvent('keydown', { key: 'Escape', isComposing: true })
  await expect(input).toBeVisible()
  await expect(page).toHaveURL(/\/work$/)
  await input.press('ArrowDown')
  await expect(page.getByRole('option', { selected: true })).toHaveText('Projects')
  await input.press('Enter')
  await expect(page).toHaveURL(/\/projects$/)
})

test('AI answers start automatically after typing pauses', async ({ page }, testInfo) => {
  let requests = 0
  await page.route('**/api/search', async route => {
    requests += 1
    await route.fulfill({ json: { answer: 'An answer from the site. Sources: [UI](https://ui.n3wth.com/), [Agent Skills](https://n3wth.com/projects/skills).' } })
  })
  await page.goto('/work')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.getByRole('option')).toHaveText(['Work', 'Projects', 'Art', 'Thinking', 'Library', 'Contact'])
  await expect(page.getByRole('dialog', { name: 'Search n3wth.com' })).toHaveCSS('opacity', '1')
  await page.screenshot({ path: testInfo.outputPath('search.png') })
  await page.getByRole('combobox').fill('garden')
  await expect(page.getByRole('option').first()).toBeVisible()
  await expect(page.getByRole('status', { name: 'Searching', exact: true })).toBeVisible()
  await expect(page.getByText('An answer from the site.')).toBeVisible()
  await expect(page.getByText('AI answer from this site and garden notes')).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Answer sources' }).getByRole('link')).toHaveCount(2)
  expect(requests).toBe(1)
  await expect(page).toHaveURL(/\/work$/)
})

for (const route of ['/', '/work', '/art', '/thinking', '/library', '/contact']) {
  test(`${route} renders without runtime errors or horizontal overflow`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    const response = await page.goto(route)
    expect(response?.ok()).toBe(true)
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('header').first()).toBeVisible()
    if (route !== '/') await expect(page.locator('h1').first()).toBeVisible()
    if (route === '/') {
      test.setTimeout(60_000)
      await expect(page.locator('.night-field-stage.is-settled')).toBeVisible({ timeout: 45_000 })
      await expect(page.locator('.night-field-loader')).toHaveAttribute('data-ready', 'true')
      for (const name of ['Art', 'Work', 'Thinking', 'Contact', 'Notes', 'Pink Triangle']) {
        const label = page.locator(`.world-portal-link[aria-label="${name}"]`)
        await expect(label).toBeVisible()
        await expect(label).toHaveCSS('opacity', '0')
      }
      const work = page.locator('.world-portal-link[aria-label="Work"]')
      await work.focus()
      await expect(work).toHaveCSS('opacity', '1')
      await work.click({ trial: true })
      const screenshot = testInfo.outputPath('portfolio-home.png')
      await page.screenshot({ path: screenshot })
      await testInfo.attach('portfolio-home', { path: screenshot, contentType: 'image/png' })
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    expect(errors).toEqual([])
  })
}

test('home keeps ordinary writing navigation when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (...args) {
      return String(args[0]).includes('webgl') ? null : getContext.apply(this, args)
    } as typeof getContext
  })
  await page.goto('/')
  await expect(page.locator('section[aria-label="Explore the night scene"] img')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Explore my projects' })).toHaveCount(0)
  await expect(page.getByText('I build new ways to work with AI.', { exact: true })).toHaveCount(0)
  const scene = await page.getByRole('region', { name: 'Explore the night scene' }).boundingBox()
  expect(scene!.height).toBeGreaterThanOrEqual(page.viewportSize()!.height)
  const thinking = page.locator('#primary-navigation').getByRole('link', { name: 'Thinking', exact: true })
  if (!await thinking.isVisible()) await page.getByRole('button', { name: 'Open menu', exact: true }).click()
  await thinking.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/thinking$/)
  await expect(page.getByLabel('Search writing', { exact: true })).toBeVisible()
  await page.getByLabel('Search writing', { exact: true }).fill('5 Whys')
  await page.locator('#notes').getByRole('link', { name: '5 Whys', exact: true }).click()
  await expect(page).toHaveURL(/\/thinking\/frameworks\/5-whys$/)
  await expect(page.getByRole('heading', { level: 1, name: '5 Whys', exact: true })).toBeVisible()
})

test('home primary navigation works before the scene settles', async ({ page }) => {
  // Hold the lazy scene module so navigation is tested during loading,
  // independently of the runner's graphics speed. Full scene coverage stays above.
  let releaseScene!: () => void
  let sceneRequested = false
  const sceneReady = new Promise<void>(resolve => { releaseScene = resolve })
  await page.route('**/_astro/NightField.*.js', async route => {
    sceneRequested = true
    await sceneReady
    await route.continue().catch(() => {}) // The page may have closed after a failed assertion.
  })
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect.poll(() => sceneRequested).toBe(true)
    await expect(page.locator('.night-field-loader img')).toBeVisible()
    await expect(page.getByRole('progressbar')).toHaveCount(0)
    await expect(page.locator('.night-field-loader-track')).toHaveCount(0)
    await expect(page.getByRole('navigation', { name: 'Scene destinations' })).toHaveCount(0)
    const navigation = page.locator('#primary-navigation')
    if (!await navigation.getByRole('link', { name: 'Work', exact: true }).isVisible()) {
      await page.getByRole('button', { name: 'Open menu', exact: true }).click()
    }
    for (const name of ['Work', 'Art', 'Thinking', 'Library']) {
      const link = navigation.getByRole('link', { name, exact: true })
      await expect(link).toBeVisible()
      const box = await link.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)
    }
    await expect(page.locator('h1')).toHaveCount(1)
    await navigation.getByRole('link', { name: 'Work', exact: true }).click()
    await expect(page).toHaveURL(/\/work$/)
  } finally {
    releaseScene()
  }
})

test('compact header is flush and its menu remains usable over photographs', async ({ page }, testInfo) => {
  test.skip(page.viewportSize()!.width >= 1024, 'Compact navigation only')
  await page.goto('/art')
  const bar = page.locator('header .n3wth-site-navigation-island')
  await expect(bar).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await page.getByRole('button', { name: 'Open menu', exact: true }).click()
  await expect(bar).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await page.keyboard.press('Escape')
  await page.locator('.art-opening').scrollIntoViewIfNeeded()
  await expect(bar).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  const bounds = await bar.boundingBox()
  expect(bounds!.x).toBe(0)
  expect(bounds!.y).toBe(0)
  // The root reserves a stable scrollbar gutter on Linux even before overflow.
  expect(bounds!.width).toBe(await page.evaluate(() => document.body.clientWidth))
  expect(bounds!.height).toBe(56)
  await expect(bar).toHaveCSS('border-radius', '0px')
  const toggle = page.getByRole('button', { name: 'Open menu', exact: true })
  await toggle.click()
  const menu = page.locator('#primary-navigation')
  await expect(menu).toBeVisible()
  expect((await menu.boundingBox())!.y).toBe(bounds!.height)
  await expect(menu.getByRole('link').first()).toBeFocused()
  for (const link of await menu.getByRole('link').all()) {
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  }
  await page.screenshot({ path: testInfo.outputPath('compact-header-menu.png') })
  await page.keyboard.press('Escape')
  await expect(toggle).toBeFocused()
  await expect(menu).not.toBeVisible()
  await toggle.click()
  await menu.getByRole('link', { name: 'Work', exact: true }).click()
  await expect(page).toHaveURL(/\/work$/)
  await expect(menu).not.toBeVisible()
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
})

test('primary navigation opens Work', async ({ page }) => {
  await page.goto('/art')
  const work = page.locator('#primary-navigation').getByRole('link', { name: 'Work', exact: true })
  // Compact navigation exposes the same links through its menu toggle.
  if (!await work.isVisible()) {
    await page.getByRole('button', { name: 'Open menu', exact: true }).click()
  }
  await work.click()
  await expect(page).toHaveURL(/\/work$/)
  await expect(page.locator('h1').first()).toBeVisible()
})
