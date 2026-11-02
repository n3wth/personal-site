# Garden migration

## Current ownership

Garden now serves redirects through a Cloudflare Worker. Portfolio owns the published Markdown, reading routes, and writing world. Follow [the Garden instructions](../../apps/garden/AGENTS.md) and [deployment runbook](deployment.md) for current operations. The migration snapshots below describe previous deployments, not a path to reconnect Vercel.

## Retired product rationale

The former Garden product brief named three equally important audiences: friends and colleagues exploring Oliver's interests, recruiters and professional peers evaluating his work, and Oliver using his public notes for recall and thinking. Search visitors were a secondary audience who entered on individual notes. Each note needed enough context to stand alone and a useful link onward. The goal was a second and third meaningful read, not simply an initial page view.

The brief described more than 260 personally written Obsidian notes. Wikilinks, callouts, frontmatter, derived backlinks, and retained note history were meaningful content, not decoration. Growth stages (seedling, budding, evergreen), planted/tended dates, and link degree informed the visual world. It called for honest unfinished work, a quiet first-person voice, and no invented testimonials, benchmarks, or usage statistics. Accessible reading navigation and reduced-motion support remained necessary beside the 3D world. Current visual rules belong to [DESIGN.md](../../DESIGN.md) and [STYLE.md](../../STYLE.md).

The February 15, 2026 redesign proposal explored local graphs with one or two connection levels, a full graph, 300 ms hover previews, a recently tended homepage, topic clusters, random notes, and weighted tag clouds. It proposed growth-stage heuristics: seedling below 200 words or two headings; budding at 200–800 words or two to five headings; evergreen above 800 words and five headings, with a frontmatter override. These were historical proposal thresholds, not the current content contract. D3 graphs, generated graph/preview data, and GSAP entrance/scroll reveals were proposed implementation details. Search, sidenotes, stacked panes, and mobile contents were deferred. This proposal is not an instruction to restore the retired renderer or its animations.

## Historical migration record

Source: n3wth/newth-garden main d29f51dca83cf3fc5707c6664a8d9b478f1637a9. Snapshot imported into apps/garden without content, public asset or theme changes. Original source history remains in its repository.

Homepage improvements also preserved from clean feat/3d-fidelity commit 6208264: ground texture assets, GardenSurface, responsive scene framing, fixed camera position, charcoal ground, compact hero and family links in document flow. Its equivalent 480px navigation adjustment is superseded by the migration's tested 600px responsive layout; homepage top spacing uses the same breakpoint. The original worktree was not modified. Eight browser/HTTP checks now cover home, note listing and nested notes at 320/390/600/1440px, including heading clearance below the nav.

Node24/npm11 root npm ci installs the graph. `npm run check -w @n3wth/garden` runs history regression tests, typecheck and the webpack production build. Generic affected-workspace discovery includes Garden automatically. Canonical origins consume site-config; Astryx remains app-local.

The historical note dates are retained. The history generator now handles repository-relative prefixes and ignores initial imported adds for previously recorded notes, while preserving later modification dates. Content and OG fonts require app cwd; output tracing root is the workspace root and existing explicit OG font tracing is retained.

Production cutover is verified at merge aac04e9b81e296b88cf0937192e2e2aab4934038 (PR152). Vercel project prj_VHe8C5iS0N8qEvpjKTtceyUkbiyA now builds n3wth/personal-site at apps/garden on Node24, using `cd ../.. && npx --yes npm@11.19.1 ci` and `npm run build`. Production deployment dpl_FMkLPYKNquZvgJecuKkaBF3CZG9U serves garden.n3wth.com and newth.garden. Public routes, feeds, OG and textures passed without authentication headers; responsive browser checks passed at all four widths. The app's Vercel ignore command uses the same affected dependency graph as CI and preserves the /home redirect.

Independent rollback: restore deployment dpl_J2kDZcrpTTtkVByadXVY2DUwx7mi (original source main 0bb1d33510388211945c833cc825cbe6f8cc1f83), reconnect n3wth/newth-garden, set rootDirectory null, Node24, default build/install/output commands and sourceFilesOutsideRootDirectory true. Keep the same project, domain aliases and environment scopes. Do not rebuild the old repository with workspace root settings.

The old repository can be archived after this source-link cleanup is deployed. Its history remains available; no published package depends on it. Its Site check is replaced by workspace checks and Garden browser CI, and dependency maintenance moves to the root policy. Preserve the outstanding proposals in workspace issues [171](https://github.com/n3wth/personal-site/issues/171) (original PR58 exception filter) and [173](https://github.com/n3wth/personal-site/issues/173) (original PR60 dependency updates). No upgrades or exception-filter behavior are bundled into the migration.

Review follow-up bounds the existing public search proxy per request: 2048 request bytes, a trimmed 1–500 character query, 15 seconds through request/upstream streaming, and 65536 response bytes. Deadlines, output limits and client disconnects cancel upstream consumption. Six mocked tests cover invalid/chunked input, output bounds and cancellation without paid upstream calls. These are per-request limits, not a distributed rate limiter or a guarantee of provider billing limits.

Lock import preserves all existing pilot package versions. npm reconciled @opentelemetry/api 1.9.0 to existing 1.9.1. Framework/React versions remain the source versions. Package publishing and framework upgrades are outside this import.

Validation: clean root npm ci and the full workspace check succeeded; two history and six API regression tests, typecheck and production webpack build passed (959 generated pages). Source checksum comparison covered 288 content/public/theme/history files before the later homepage texture import. Generic affected selection includes site-config before Garden. Eight browser/HTTP checks pass at 320px, 390px, 600px and 1440px: home, note listing, nested note reading, each navigation control's viewport bounds, feeds and OG images. Run `AFFECTED_WORKSPACES='["@n3wth/garden"]' npm run check:browser` after building Garden; a scoped GitHub workflow captures screenshot evidence. Public serverless production validation also passed.
