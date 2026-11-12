/**
 * Draw the section link-preview covers from the live hero artwork:
 * public/og/hero-{home,work,art,thinking,projects,library,contact}.png.
 *
 * Each cover is the page's own still composition (the reduced-motion render),
 * restaged at 1200x630 with the artwork to the right and the page name and
 * description at the lower left in the site's type. Nothing is redrawn here, so
 * a change to a hero or to the route copy reaches its cover by rerunning this.
 *
 * It needs a built site being served and an installed Chrome:
 *
 *   npm run build:portfolio
 *   npm run preview -w @n3wth/portfolio -- --port 4321 &
 *   node apps/portfolio/scripts/generate-hero-covers.mjs [--base http://127.0.0.1:4321] [--banners <dir>]
 *
 * --banners also writes text-free profile banners (LinkedIn 1584x396, X 1500x500)
 * from the home artwork into <dir>; they are not part of the site.
 */
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const arg = name => { const at = process.argv.indexOf(name); return at > -1 ? process.argv[at + 1] : undefined }
const base = arg('--base') ?? 'http://127.0.0.1:4321'
const banners = arg('--banners')
const routes = JSON.parse(readFileSync(join(ROOT, 'src/data/routes.json'), 'utf8'))
const WIDTH = 1200, HEIGHT = 630

/* harmony: 0 ice, 1 coral, 2 gold, 3 seafoam. It sets the ground tint the page paints before hydration. */
const COVERS = [
  { id: 'home', path: '', title: 'Oliver Newth', harmony: 0 },
  { id: 'work', path: 'work', title: 'Work', harmony: 0 },
  { id: 'art', path: 'art', title: 'Art', harmony: 1 },
  { id: 'thinking', path: 'thinking', title: 'Thinking', harmony: 3 },
  { id: 'projects', path: 'projects', title: 'Projects', harmony: 3 },
  { id: 'library', path: 'library', title: 'Library', harmony: 2 },
  { id: 'contact', path: 'contact', title: 'Contact', harmony: 1 },
]

/* Everything but the artwork leaves the frame; the artwork moves right to clear the copy. */
const stage = `
  .n3wth-site-navigation, .n3wth-site-footer, .skip-link, .portfolio-story-hero ~ *, .home-opening ~ *, .home-opening-scene ~ * { display: none !important; }
  html, body { overflow: hidden !important; }
  .n3wth-site-main { padding-top: 0 !important; }
  /* The hero covers the page, so no section below it can reach the frame. */
  .portfolio-story-hero { position: fixed !important; inset: 0 !important; z-index: 40; width: 100vw !important; max-width: none !important; margin: 0 !important; min-height: 0 !important; height: 100vh !important; padding: 0 !important; background: var(--bg); }
  .home-opening-scene { min-height: 100vh !important; height: 100vh !important; padding: 0 !important; }
  .portfolio-story-hero > .section-story svg { --story-size: var(--cover-size, 96vh) !important; left: var(--cover-x, 70%) !important; top: var(--cover-y, 50%) !important; bottom: auto !important; transform: translate(-50%, -50%) !important; }
  .cover-copy { position: fixed; left: 72px; bottom: 64px; z-index: 50; max-width: 500px; font-family: var(--font-family-heading); color: var(--color-text-primary); }
  .cover-name { position: fixed; left: 72px; top: 60px; z-index: 50; font: 500 24px/1 var(--font-family-heading); letter-spacing: -.01em; color: var(--color-text-primary); }
  .cover-title { margin: 0; font-size: 84px; line-height: 1; font-weight: 600; letter-spacing: -.035em; }
  .cover-description { margin: 22px 0 0; font: 400 23px/1.4 var(--font-family-body); color: var(--color-text-secondary); text-wrap: pretty; }
`
const perCover = {
  /* Mirrored so the band leaves by the lower right and the copy has clear ground. */
  home: '.home-artwork { transform: translate(6%, -20%) scale(-1, 1); transform-origin: 50% 50%; }',
  thinking: '.portfolio-story-hero > .section-story svg { --cover-size: 118vh; --cover-y: 62%; }',
  /* Mirrored and raised so the horizon lines pass above the copy. */
  art: '.portfolio-story-hero > .section-story svg { --cover-size: 100vh; --cover-x: 28%; --cover-y: 27%; } .portfolio-story-hero > .section-story { transform: scaleX(-1); }',
  contact: '.portfolio-story-hero > .section-story svg { --cover-x: 72%; }',
}

async function open(browser, cover, viewport, css) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, reducedMotion: 'reduce' })
  await context.addInitScript(harmony => {
    try { sessionStorage.setItem('n3wth-story-journey', JSON.stringify({ epoch: Date.now() - (12 + 38 * harmony) * 1000, color: harmony })) } catch { /* storage is optional */ }
  }, cover.harmony)
  const page = await context.newPage()
  await page.goto(`${base}/${cover.path}`, { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: css })
  await page.evaluate(() => document.fonts.ready)
  return { context, page }
}

async function write(page, file, width, height, clip) {
  const shot = await page.screenshot({ type: 'png', clip })
  mkdirSync(dirname(file), { recursive: true })
  // Supersampled from 2x so the hairlines stay even at the declared size.
  const png = await sharp(shot).resize(width, height, { kernel: 'lanczos3' }).removeAlpha().png({ compressionLevel: 9 }).toBuffer()
  await sharp(png).toFile(file)
  console.log(`${file.replace(ROOT + '/', '')}  ${width}x${height}  ${(png.length / 1024).toFixed(0)}KB`)
}

const browser = await chromium.launch({ channel: 'chrome' })
for (const cover of COVERS) {
  const route = routes.find(entry => entry.path === cover.path)
  if (!route) throw new Error(`no route metadata for /${cover.path}`)
  const { context, page } = await open(browser, cover, { width: WIDTH, height: HEIGHT }, stage + (perCover[cover.id] ?? ''))
  await page.evaluate(({ title, description }) => {
    const name = Object.assign(document.createElement('div'), { className: 'cover-name', textContent: title === 'Oliver Newth' ? 'n3wth.com' : 'Oliver Newth' })
    const copy = Object.assign(document.createElement('div'), { className: 'cover-copy' })
    copy.append(Object.assign(document.createElement('p'), { className: 'cover-title', textContent: title }), Object.assign(document.createElement('p'), { className: 'cover-description', textContent: description }))
    document.body.append(name, copy)
  }, { title: cover.title, description: route.description })
  await write(page, join(ROOT, 'public/og', `hero-${cover.id}.png`), WIDTH, HEIGHT)
  await context.close()
}
if (banners) {
  /* The ribbon is only seamless at its own proportions, so each banner is a band cut from a full-height render. */
  for (const [name, width, height] of [['linkedin-banner', 1584, 396], ['x-banner', 1500, 500]]) {
    const full = Math.round(width * 992 / 1586)
    const { context, page } = await open(browser, COVERS[0], { width, height: full }, stage)
    await write(page, join(banners, `${name}.png`), width, height, { x: 0, y: Math.round(full * .06), width, height })
    await context.close()
  }
}
await browser.close()
