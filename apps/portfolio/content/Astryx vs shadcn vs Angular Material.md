---
title: "Astryx vs shadcn: which design system for LLM-written UI"
description: "Compare Astryx, shadcn and Angular Material by component ownership, with a working React outline example and the limits of type-level accessibility checks."
tags: [technology, engineering, design, development]
date: 2026-07-14
updated: 2026-09-25
---

# Astryx vs shadcn: which design system for LLM-written UI

For these React sites, I use Astryx through a shared UI package. I would consider shadcn when a project needs to edit and maintain component source locally. Angular Material is a choice for an Angular application. The useful comparison is who owns the implementation and its future changes.

This site's reading interface gave me a practical way to examine that decision with coding agents. The table of contents on this page is a useful example. Its underlying behavior worked, but the first composition looked too much like a large settings control above a reading surface.

The fix was a small shared reading component. It kept the existing navigation behavior and changed its presentation. That experience is more useful than declaring one library the universal winner.

*Implementation reviewed September 2026, using Astryx 0.1.6 in this workspace. This is a report on this integration, not a controlled benchmark of three libraries.*

## Three ownership models

[Astryx](https://astryx.atmeta.com/) supplies the primitives used here. Our shared `@n3wth/ui` package owns the theme, page compositions and compatibility work. The portfolio imports that package; it does not maintain its own copy of the primitives.

[shadcn/ui](https://ui.shadcn.com/docs) distributes component source that you can edit in your repository. That makes local changes straightforward, while making those changes part of your maintenance work. It also gives a coding agent the implementation to inspect.

[Angular Material](https://material.angular.dev/) belongs in a different framework decision. An existing Angular application can use Material components and the CDK's accessibility utilities. I did not rebuild this site in Angular, so I cannot use this project to rank its development experience.

| Choice | Where changes belong | Maintenance tradeoff |
| --- | --- | --- |
| Astryx through `@n3wth/ui` | Shared themes and compositions live in our package; primitives come from Astryx. | One shared fix can reach several sites. Primitive changes depend on the upstream API and package upgrades. |
| shadcn/ui | Component source lives in the consuming repository. | Direct edits are possible. The project owns those edits and must reconcile upstream changes. |
| Angular Material | Angular components and CDK utilities provide the framework-specific foundation. | The application follows Angular's integration and upgrade requirements. |

The choice I made here was to keep product pages thin and put reusable presentation into one package. You can use that ownership pattern with more than one component system.

## What the portfolio actually imports

The current dependency path is **Portfolio → @n3wth/ui → Astryx**. Notes now live in the portfolio; the former Garden domain redirects to their `/thinking/` URLs. The shared package pins Astryx 0.1.6 and exposes two relevant entry points:

- `@n3wth/ui/primitives` exposes native component APIs, including `Outline`.
- `@n3wth/ui/site` adds the site's page and reading compositions, including `ReadingOutline`.

The [shared build configuration](https://github.com/n3wth/personal-site/blob/main/packages/ui/vite.config.ts) also normalizes the JSX development-runtime calls shipped in this Astryx version. This happens once inside UI. The portfolio does not need an application-owned shim for that integration.

These examples describe the monorepo checkout. Check the exports of a published package before copying them into another project; the [getting-started guide](https://ui.n3wth.com/docs/getting-started) explains the workspace setup.

## A small example: the table of contents

Inside a page already wrapped in `N3wthProvider`, with `@n3wth/ui/site.css` loaded, a native outline needs heading IDs that match real elements:

```tsx
import { Outline } from '@n3wth/ui/primitives'

const items = [
  { id: 'ownership', label: 'Ownership', level: 2 },
  { id: 'testing', label: 'Testing', level: 2 },
]

export function Example() {
  return (
    <>
      <Outline items={items} label="On this page" density="compact" />
      <h2 id="ownership">Ownership</h2>
      <p>Who maintains the component and its behavior?</p>
      <h2 id="testing">Testing</h2>
      <p>Check navigation in the page where it will be used.</p>
    </>
  )
}
```

For the compact reading treatment used here, replace the `Outline` import and element with:

```tsx
import { ReadingOutline } from '@n3wth/ui/site'

<ReadingOutline items={items} collapsible />
```

The shared [ReadingOutline implementation](https://github.com/n3wth/personal-site/blob/main/packages/ui/src/site/ReadingOutline.tsx) still renders Astryx's `Outline`, which owns scroll-spy and anchor navigation. Astryx's `useCollapsible` owns disclosure state. Our composition supplies the label, disclosure button, linked content region and compact styling. With `collapsible`, it starts closed; without it, the outline remains visible.

The portfolio's [ThinkingNote page](https://github.com/n3wth/personal-site/blob/main/apps/portfolio/src/pages/ThinkingNote.tsx) selects headings through level three and renders the collapsible outline with the label "Contents". The shared package owns its presentation.

## What types and tests establish

A required label prop can catch a missing label at compile time. It cannot establish whether the label is useful, the text has enough contrast, or the whole page meets WCAG. Those questions remain part of implementation and review.

Our [ReadingOutline tests](https://github.com/n3wth/personal-site/blob/main/packages/ui/src/site/ReadingOutline.test.tsx) check the closed default, disclosure state, visibility and matching anchor URLs. Browser checks confirmed that the mobile outline opens and closes and that the article fits the tested mobile and desktop widths. Those checks establish specific behavior; they are not an accessibility certification or proof that another library would perform worse.

The initial oversized table of contents is a reminder of that boundary. Correct primitive behavior does not automatically produce a good reading interface.

## What I would choose again

For these sites, I would keep the shared UI layer over Astryx. It gives a correction one home, while letting the portfolio keep its reading typography and content structure.

I would consider shadcn where owning and changing component source is a central requirement. For an Angular application, I would evaluate Material in that application's context. In each case, I would test a real page before treating component documentation or required props as evidence of the finished experience.

Next: [shared UI examples](https://ui.n3wth.com/components) · [theme ownership](https://ui.n3wth.com/docs/theming) · [portfolio note reader source](https://github.com/n3wth/personal-site/blob/main/apps/portfolio/src/pages/ThinkingNote.tsx)

Follow-up: [Choose UI component ownership](/thinking/choose-ui-component-ownership) explains the maintenance decision behind the shared layer.

---

*Oliver Newth · July 2026 · [garden.n3wth.com/astryx-vs-shadcn-vs-angular-material](https://garden.n3wth.com/astryx-vs-shadcn-vs-angular-material)*
