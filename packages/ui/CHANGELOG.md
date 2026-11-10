# @n3wth/ui

## Unreleased

### Minor Changes

- Add `SiteSignup`, a one-line email capture with app-owned delivery, and a `signup` slot on `SiteFooter` above the identity row.

### Patch Changes

- Let apps tint the page ground behind the site shell and navigation with `--n3wth-site-ground`. It falls back to the body background token.
- Keep newsletter signup fields out of PostHog autocapture and session replay.

## 2.1.1

### Patch Changes

- 9561acc: Synchronize theme hook callers and keep automatic system changes separate from saved user preferences. Preserve client behavior in emitted package modules and verify public exports through standalone consumers.
  
  Remove excluded commercial font rules from release CSS so external consumers use the documented system-font fallback without unresolved asset imports.

## 2.1.0

### Minor Changes

- d473db5: Keep footer identity and links on one row when they fit, with content-driven wrapping on narrow screens.
  
  Add compact PageHeader spacing for documentation articles whose parents own the surrounding margins.
  
  Allow SiteNavigation to display contextual menu content on compact screens and align its collapse breakpoint with a desktop documentation sidebar.
  
  Expose native CodeBlock line wrapping and inset headerless copy controls with reserved space beside code.

## 2.0.0

The monorepo becomes the release source for the shared Newth design system.

- Add the shared site provider, navigation, page headers, layout, typography,
  reading outline and footer through `@n3wth/ui/site`.
- Expose native controls through `@n3wth/ui/primitives` and decorative artwork
  through `@n3wth/ui/visuals`.
- Ship the canonical theme, fonts and complete site foundation in `site.css`,
  plus the Tailwind v4 token bridge.
- Include a v0 Design Systems 2.0 skill and standalone starter.
- Preserve legacy entry points while aligning their compositions with the
  shared flat design system. Existing applications should review appearance,
  typography and navigation when migrating from 0.9.1.

### Migration from 0.9.1

Use Node 24. Install `@n3wth/ui@2.0.0`, import one complete foundation CSS file,
and wrap the app in `N3wthProvider`. Prefer site compositions and native
primitives in new code. Native Button uses `label`; its API differs from the
compatibility Button exported at the package root. Remove direct application
Astryx dependencies, duplicate theme definitions and app-level JSX shims.
Keep router adapters and metadata in the app. Preserve client boundaries in
Next.js. Check both themes, responsive navigation, fonts and CSS asset loading.
