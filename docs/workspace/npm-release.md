# UI npm releases

`packages/ui` in `n3wth/personal-site` is the release source starting with 2.0.0.
The former `n3wth/ui` repository is historical; retire its publishing workflow
after the first verified monorepo release. Do not publish from both repositories.

After the repository rename, publishing is paused with
`UI_NPM_PUBLISH_ENABLED=false`. Update npm's Trusted Publisher repository to
`personal-site` before re-enabling this variable. The former `n3wth/n3wth`
name now belongs to the profile README repository.

## First release cutover

1. Merge the validated release preparation into main. Keep the repository
   variable `UI_NPM_PUBLISH_ENABLED` unset until the npm trust change is complete.
2. In npm's @n3wth/ui Trusted Publisher settings, change GitHub owner to `n3wth`,
   repository to `personal-site`, workflow filename to `publish-ui.yml`, and leave
   environment blank. Allow `npm publish`. No npm token is required.
3. Set repository Actions variable `UI_NPM_PUBLISH_ENABLED=true`. Run Release UI
   on main. The workflow checks the library, installs the exact tarball into
   a standalone app, builds it, checks browsers, then publishes that tarball.
4. Verify npm version, provenance, exports and a clean registry consumer install.
   Then disable the old publishing workflow and link its README to the monorepo.

## Subsequent releases

1. Open one PR that bumps `version` in `packages/ui/package.json`, sets the
   same version in the starter's `@n3wth/ui` dependency, adds an entry to
   `packages/ui/CHANGELOG.md`, and runs `npm install --package-lock-only --ignore-scripts`.
2. Merge the PR after Site CI passes.
3. Push a tag `ui-v<version>` on the merge commit, matching the version in
   `packages/ui/package.json`. Release UI checks the package, validates the
   packed consumer, and publishes that exact tarball with provenance.
4. Verify the registry version and a clean consumer install.

`npm run check:package` stages npm's allowlisted files with `scripts/ui/pack-ui.mjs`.
The staged CSS omits excluded commercial font rules and uses package-relative
URLs for shipped fonts. Workspace CSS and licensed site assets stay unchanged.
The publish step uses this exact tested tarball, not a direct pack of workspace output.

For retries, manually run Release UI on main with `workflow_dispatch`. An
already-published version is skipped, so this is a safe retry or smoke test.
Package checks still run. The publish job alone has OIDC permission, and uses
GitHub-hosted runners. Never publish locally. Site deployments are separate
from npm publishing.

The initial 2.0.0 version and migration notes are prepared directly for this
cutover. Future version increments follow this same tag-triggered flow.

The source adapter for v0 is `packages/ui/v0/n3wth-ui`. It ships with npm but
must still be imported into v0 to become a saved personal/team skill.
