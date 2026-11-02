---
title: Unifying the n3wth UI Package Across Six Sites
description: How a single Changesets release pinned @n3wth/ui to 2.1.1 across six apps, Next.js and Vite alike, and why the exact pin was the right call
tags:
  - monorepo
  - changesets
  - n3wth
  - dependency-management
---

# Unifying the n3wth UI Package Across Six Sites

Six apps in the n3wth monorepo — garden, kit, r3-web, skills, portfolio, ui-docs — all depend on the same shared package, `@n3wth/ui`. As of today they all sit on the exact same version: `2.1.1`. Not `^2.1.1`. Not a range. The literal string `2.1.1` in every `package.json`.

## What actually shipped

The chain was short. A fix landed in [PR #381](https://github.com/n3wth/personal-site/pull/381), "align shared theme, docs, and package behavior" — it synchronized the theme hook across callers and stopped a system theme change from silently overwriting a user's saved preference. That patch bumped `@n3wth/ui` to 2.1.1.

Changesets then opened its usual release PR, [#382](https://github.com/n3wth/personal-site/pull/382), which fanned that single version bump out to every dependent app in the workspace: garden, kit, portfolio, r3-web, skills, ui-docs each got a patch release that updates their `@n3wth/ui` dependency to match. I merged it the same morning.

## Why the exact pin, not a range

Changesets has a documented quirk here: when a changeset bumps a workspace dependency, it can replace a loose or lower-bounded range with the exact new version rather than leaving a compatible range alone ([changesets/changesets#230](https://github.com/atlassian/changesets/issues/230)). Combined with the `workspace:*` protocol resolving to an exact version on publish ([changesets/changesets#664](https://github.com/changesets/changesets/issues/664)), the six apps end up locked to the identical build of `@n3wth/ui`, not just a compatible one.

That's the right tradeoff for this repo. The six sites split across two frameworks — garden, kit, r3-web, and skills build on Next.js; portfolio and ui-docs build on Vite. A shared UI package crossing that boundary is exactly the case where "compatible enough" is a weaker guarantee than "identical." A caret range lets Next.js and Vite builds drift onto different patch versions of the same component library without anyone noticing until a rendering difference shows up in one but not the other. An exact pin means every site's theme hook, every site's exported component, is running the same code, full stop.

## The upstream question this settles

This is the same tradeoff [[Astryx vs shadcn vs Angular Material]] raised when comparing component libraries: do you own the component code directly, or do you consume it as a versioned dependency and accept whatever drift that brings? [[Choose UI Component Ownership]] framed it as a choice to make once, early. Pinning `@n3wth/ui` to an exact version across six sites is that choice showing up in practice — the package is owned centrally, versioned deliberately, and every consumer is required to catch up in lockstep rather than pull updates on their own schedule.

The cost is real: nobody gets a stray patch for free, and a bump means touching (or at least reviewing) six `package.json` files at once. The benefit is that "it works on garden" and "it works on portfolio" mean the same thing, because they're running the same package.

## What's still in flight

Two related cleanups from the same session haven't merged yet: removing the retired Vercel deployment fallback ([PR #384](https://github.com/n3wth/personal-site/pull/384)) and adding a `docs.n3wth.com` link to the shared `SiteFooter` component ([PR #385](https://github.com/n3wth/personal-site/pull/385)), which would propagate to every app that uses the default footer. Both are open, not landed — the UI version unification is the one piece of this week's cleanup that's actually done.
