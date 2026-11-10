# Portfolio

Oliver Newth's personal site, n3wth.com. Follow the root [AGENTS.md](../../AGENTS.md), [DESIGN.md](../../DESIGN.md), and [STYLE.md](../../STYLE.md) for shared setup, UI ownership, typography, and validation.

## Source and validation

- Astro routes live in `src/pages`; `src/layouts/SiteLayout.astro` owns the static document, metadata and shell. React bodies in `src/screens` hydrate independently.
- `src/data/content.ts` owns navigation, experience, installations, and `siteConfig`. Canonical origins come from `@n3wth/site-config`.
- From the repository root, run `npm run dev -w @n3wth/portfolio`, `npm run build:portfolio`, and `npm run check -w @n3wth/portfolio`. Build shared packages before app checks.
- Run `AFFECTED_WORKSPACES='["@n3wth/portfolio"]' npm run check:browser` for route, layout, or packaging changes. See [portfolio quality checks](../../docs/workspace/portfolio-quality.md) for action events and release validation.

## Content invariants

- Do not reword, trim, or alter installation credits or credit links in `src/data/content.ts`, rendered by `src/components/sections/Creative.tsx`.
- Preserve social metadata and `og-image.png` references in the Astro layout, route metadata and site schema. Article and note prose must render in static HTML without JavaScript.
- Use `siteConfig.email` for `hey@n3wth.com`. The separate `support@n3wth.com` address on Support is intentional.
- `content/` owns the migrated Garden Markdown. `scripts/build-notes.mjs` generates pages, search data, and compatibility snapshots; `scripts/verify-content.mjs` validates them offline. Builds must not fetch content.
- Preserve nested note slugs and existing article URLs under `/thinking/<slug>`. Homepage groves use the same local writing data. Garden is a redirect Worker, not a content source.
- `npm run content:refresh -w @n3wth/portfolio` refreshes only the UI registry snapshot. A failed refresh exits nonzero and preserves the prior file. Commit successful changes. Keep this network command separate from `build`, `prebuild`, and `check`; sources live in `scripts/lib/content-sources.mjs`.

## Motion and diagrams

- Import GSAP through `src/lib/gsap.ts`; scroll-driven pieces use `src/lib/scroll.ts`. Do not register plugins again. Read the relevant root `.agents/skills/gsap-*` skill before animation changes.
- Scene colour comes from `src/components/harmony.ts` and `harmony.css`: four harmonies, each with an ink, accent, and ground. The home ribbon and section scenes share one journey phase, and the layout paints `--journey-body` before hydration. Use `var(--bg)` for the page ground; `--color-background-body` is the untinted base.
- Respect reduced motion. Keep PostHog deferred and Creative background images lazy.
- NightField garnish models share the scene Suspense boundary. Deferring them requires a nested boundary.
- Use the shared curve in `src/components/thinking/kit/edgePath.ts` for node/edge diagrams.
- Do not stretch multi-segment curves with `preserveAspectRatio="none"`. Use a fixed-aspect motif such as `MarginNote.tsx`, or a plain CSS border.

## Copy

- Use plain, quiet declarative sentences. Avoid hype, exclamation points, and mirrored “X, not Y” conclusions. Keep personal-site copy free of model and assistant brands.
- Do not introduce “The test:” callouts or large display numerals on the Thinking index.
- Reserve `font-mono` for code, timestamp logs, or terminal output; dates and labels use shared text styles.
- Keep portfolio heading and control weights at semibold (600) or below.
