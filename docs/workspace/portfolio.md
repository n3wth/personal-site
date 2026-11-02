# Portfolio workspace inventory

Verified 2026-09-06 against local source and GitHub/Vercel CLIs.

- Source: n3wth/personal-site main at 2452a9d4754dae5554df68e8ae2cf933223466a7.
- Destination feature branch: feature/personal-sites-workspace in work/sites-workspace. Existing repository history is retained.
- React 19, Vite 7, Tailwind 4, TypeScript 5.9, Node 24 and npm lockfile.
- Required local command: npm run check (ESLint, Vitest and production build).
- The build reads committed content snapshots in `src/data/*.json` (garden notes/index, `@n3wth/ui` version). It validates them offline. It does not fetch them.
- Refreshing those snapshots from their live sources is a separate command: `npm run content:refresh` (`apps/portfolio/scripts/refresh-content.mjs`). It never runs as part of a build.
- Build also prerenders routes from that source tree.
- Vercel project n3wth (prj_ZiimaNLqgocwBC7elQp5cRQuu9cH), team n3wth, root '.', Vite, Node 24.x. Domain n3wth.com.
- Current vercel.json skips all preview builds. Preserve redirect/header/API rules while enabling pilot previews separately.
- Routes: /, /work, /art, /thinking, /thinking/:slug, /library, /contact, /error, /login, /logout, /support, plus static /privacy /consent /terms. Redirects /blog /news /press to /thinking, including trailing slash variants. Preserve public assets and API functions.
- Environment names/scopes: GEMINI_API_KEY (production and preview), OPENROUTER_API_KEY (production and preview), POSTHOG_PERSONAL_API_KEY (production). Values are not recorded.
- Active GitHub Main ruleset prevents deletion and non-fast-forward updates; no required status checks appear in that ruleset. Continue requiring existing validation in the PR workflow.
- Source code has no current @n3wth/ui dependency despite stale AGENTS.md statements. Keep custom Astryx navigation and 3D implementation intact. Shared canonical origins currently live in src/data/sites.ts.
- Rollback: retain existing Vercel deployment and root settings until pilot previews pass. A root-directory switch requires restoring both old deployment and old root/build settings when rolling back.
- Preserve work/n3wth on feature/contact-form: modified privacy and Contact section, garden-search snapshot, new ContactForm component/test and workers directory. Do not move or reset that checkout. Port that change separately after path migration using its original diff.

Validation baseline from maintenance: 43 tests, lint and build passed. Re-run on the migrated tree before submitting the pilot. No redesign or framework upgrades are part of this move.
