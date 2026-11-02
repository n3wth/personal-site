# Personal site

Source for [n3wth.com](https://n3wth.com), its documentation, and shared site packages. The GitHub profile README lives in [n3wth/n3wth](https://github.com/n3wth/n3wth).

## Docs

Documentation lives alongside the portfolio at **[n3wth.com/docs](https://n3wth.com/docs)**. Astro builds the site; Starlight owns documentation pages and search. Both use the same repository and deployment.

## Workspace

Use Node 24 and npm 11.19.1. Install from the repository root.

```bash
npm ci
npm run dev             # Portfolio and docs
npm run build           # Packages and remaining consumers, in dependency order
npm run check           # Workspace validation
npm run check:browser   # Browser validation after building
```

The content site lives in `apps/portfolio`; docs source is `apps/portfolio/src/content/docs/docs`. Shared packages live in `packages/ui` and `packages/site-config`. Garden is a compatibility redirect Worker. UI/r3 folders test legacy redirects. Skills retains static download compatibility only, with no application runtime.

`@n3wth/ui` remains a public npm package published from this repository by the Release UI workflow on a `ui-v*` tag. The r3 runtime is maintained separately in `n3wth/r3`.

## Deployment

Cloudflare serves the site. Pull requests receive isolated previews; validated changes on `main` deploy through the production workflow. Vercel is retired. Moving old docs and Skills domains requires the separate, verified redirect cutover in the deployment runbook.

See [architecture](docs/workspace/architecture.md), [deployment](docs/workspace/deployment.md), and [maintenance](docs/workspace/maintenance.md). Wait for CI and previews before merging; verify live routes and APIs after deployment.

## Contact

[n3wth.com](https://n3wth.com) · [LinkedIn](https://linkedin.com/in/n3wth) · hey@n3wth.com
