# Kit migration

Imported tracked snapshot from n3wth/kit main 336a097e19773e1b63b242795256f54837432cb9. Original repository retains history and rollback. App is apps/kit, workspace @n3wth/kit.

Preserve direct dependency versions from the source lock, including registry @n3wth/ui 0.9.1 and Stripe 22.0.0. UI adoption is a separate compatibility change; this app does not consume workspace UI 0.9.2. The nested cli directory remains a standalone package with its own lockfile and publishing unchanged.

Vercel must keep existing Kit project/domain and change repository to n3wth/personal-site, root apps/kit, Node24 and include files outside root. Install uses root npm11.19.1 lock, build uses app Next build, output stays Next default. Next tracing and Turbopack use workspace root. Ignore script selects affected Kit changes.

Preserve STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in their existing Vercel scopes. No secret values are stored here. Webhook and waitlist routes remain unchanged; migration validation must not submit transactions or subscriptions. Preserve /r registry JSON, docs/blog routes and fonts.

Check: npm run check -w @n3wth/kit (original typecheck/build gate). Existing source lint failures remain separate work, not silently weakened. Production cutover requires preview route/assets/browser validation and recorded original project config; rollback restores prior deployment and project settings.

Validated npm11 clean install, typecheck and Next production build. All 15 browser checks pass across 390/852/1440 for home, components, getting-started docs, blog and registry download. Existing mobile intrinsic-width grids were fixed with explicit single-column tracks; no overflow hiding. Webhook source hash matches original. Root lock re-resolution preserves existing app direct versions, including portfolio @types/react 19.2.9; Kit direct versions all match original lock.

The workspace explicitly pins root @types/react 19.2.9 so hoisted React Three Fiber declarations augment the same React module as the portfolio. Kit and UI retain their original nested type versions. Merely preserving a nested portfolio copy caused hosted TypeScript builds to lose Three JSX intrinsic declarations.
