# Shared site design system

The root [DESIGN.md](../../DESIGN.md) and [STYLE.md](../../STYLE.md) define current visual and implementation rules. This document covers architecture, package usage and setup.

## Dependency direction

Sites → `@n3wth/ui` → Astryx. Only the UI package depends on Astryx; applications import `@n3wth/ui/primitives` for native controls, `@n3wth/ui/site` for site compositions and `@n3wth/ui/site.css` for the complete foundation. Tailwind consumers use `@n3wth/ui/tailwind-theme.css`. The design check rejects direct Astryx imports or dependencies in applications.

[Astryx](https://github.com/facebook/astryx) is the external package supplying control behavior and accessibility. [UI](https://github.com/n3wth/personal-site/tree/main/packages/ui) owns the pinned Astryx version, React runtime integration, Newth theme, typography and shared site layout. Applications own content, routes, data and specialized interactions. Add reusable design decisions to UI rather than redefining them per site.

Import one complete stylesheet: `@n3wth/ui/site.css` for new sites, or `@n3wth/ui/styles` when legacy component styles are needed. The latter already includes the site foundation and fonts; do not import both.

Metadata and analytics belong in `@n3wth/site-config`, outside UI. Its framework-neutral `metadata` helpers generate canonical/social metadata and page JSON-LD while leaving copy and page types in the app. Its `analytics` initializer shares defaults and prevents duplicate initialization; apps supply their own installed client and host options. Specialized deferred-loading policies remain app-owned.

The package root retains compatibility adapters for existing component APIs. New code should prefer the native primitives and site entries. Brand illustrations, OG rendering and application-specific scenes are not generic control replacements and remain purpose-built. The compatibility Nav, Hero, Footer and Section delegate to the same site compositions; old decorative hero settings no longer introduce gradients or entry animations.

```tsx
import { Button } from '@n3wth/ui/primitives'

<Button label="Save" onClick={save} />
```

Portfolio and Skills use one Astryx foundation from `packages/ui`. Their content, routes and specialized interactions remain app-owned. New design decisions belong in the shared package; applications should not copy its theme definition or generated CSS.

Navigation and footers also come from `SiteNavigation` and `SiteFooter`. Apps pass router-aware home links, primary links and relevant actions as ReactNode slots. The shared navigation owns its 48px height, subtle 1px theme border, spacing, mobile disclosure and Escape focus restoration. Do not add local island styles, separators, blur or alternate mobile breakpoints. Do not use sparkle icons.

Keep footers minimal: use `SiteFooter` defaults for the Oliver Newth home link, Contact and GitHub; pass `sourceHref` for the app source and `legalLinks` only where needed. Newsletter forms use the `signup` slot; delivery and success-only analytics follow the [newsletter guide](newsletter.md). Avoid repeated site directories, product descriptions or separate copyright rows. Navigation should feel instant: do not add route-entry fades, slides, staggered content reveals or delayed page content. Keep functional feedback and specialized interactive demos.

Use `n3wth-site-main` for the standard 96px fixed-navigation offset. `PageHeader` owns hero typography and vertical spacing; its optional `aside` accepts demonstrations in a shared responsive split layout. Use `SiteSection` and semantic heading/text roles for page sections. Immersive scenes and long-form reading layouts can retain their content-specific structure.

## Use

```tsx
import { N3wthProvider, PageHeader, SiteContainer, SiteSection, SiteHeading, SiteText } from '@n3wth/ui/site'
import '@n3wth/ui/site.css'

<N3wthProvider mode="dark">
  <SiteContainer as="main">
    <PageHeader title="An idea" description="What this helps people do." actions={<a href="/start">Get started</a>} />
    <SiteSection>
      <SiteHeading variant="section">How it works</SiteHeading>
      <SiteText>Explain the useful behavior.</SiteText>
    </SiteSection>
  </SiteContainer>
</N3wthProvider>
```

`site.css` includes Astryx component CSS, the generated canonical theme, fonts and scoped site layout/type rules. It does not load the legacy UI reset. Vite and Next consume the same exported entry. Next must retain the client boundary; router-specific link adapters stay in each application. Bind the provider to the existing theme state for sites supporting light mode rather than maintaining two theme states.

## Roles

- Suisse Intl for headings, body text, actions and supporting labels. Geist Mono only for code.
- Page titles are responsive. Section and item titles use shared sizes rather than separate scales per page. Body text and supporting labels have distinct semantic roles.
- Content width and horizontal padding come from `SiteContainer` or the matching `n3wth-site-container` class. Sections use `SiteSection` when its spacing applies.
- Use `PageHeader.actions` for page-level links such as the resume. Do not create a separate padded section for one link.
- Garden reading typography and the portfolio scene may retain specialized layouts. Product names, content and interactions remain distinct; colors, type roles and common controls share the system.

The canonical theme is `packages/ui/src/theme/n3wthTheme.ts`. Its CSS is generated during the UI build. Apps declare `"@n3wth/ui": "*"` so npm always links the workspace copy and never installs a nested registry copy. Starting with 2.0.0, this monorepo owns public npm releases through `ui-v*` tags and trusted publishing; see [npm-release.md](npm-release.md).

## Decorative artwork

Decorative artwork uses `@n3wth/ui/visuals`: VisualBand owns full-width layout, while AssembleField, ForkLight and ConvergeLight own their drawing and motion. Styles are included in `site.css`. Keep seeds, cluster positions and heights in the app. Artwork is visible without an observer or a parent reveal class, and reduced motion keeps a still composition. VisualBand is aria-hidden; keep text and controls outside it. Use `fullBleed={false}` for contained previews.

## New sites

```sh
npm run site:new -- idea-name "Idea name"
npm install
npm run build -- --workspace @n3wth/idea-name
npm run dev --workspace @n3wth/idea-name
```

The generator creates a small Vite/React application using the shared provider, type and layout components. It rejects invalid names and existing directories. Replace starter copy before publishing. Configure deployment and the canonical domain separately; generation does not provision external services.

## Validation

Run `npm run check` with Node 24 and npm 11.19.1. It builds shared packages before consumers, checks the generator and runs the existing app suites. Check rendered mobile/desktop pages and keyboard navigation; typechecking alone cannot detect a missing font or theme scope. Verify production Next routes after any Astryx upgrade. Avoid upgrading the pre-1.0 component API solely to align versions: the current patch is pinned and tested as a unit.

Published UI documentation lives in [docs/ui](../ui). Run `node docs/check.mjs` to validate its navigation, links, and MDX. Run `npm run check:package` to verify public exports in standalone consumers. Reuse the packaged starter for adoption checks; do not create another example framework.
