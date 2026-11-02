# Daily research publishing

Publish one useful piece per day across garden.n3wth.com and n3wth.com. The first 30 releases contain 20 garden notes and 10 portfolio essays, with two notes followed by one essay. The Codex task heartbeat is the scheduler; this directory is the versioned backlog, evidence registry, validation code, and runbook. There is no second cron scheduler.

## Editorial strategy

The garden carries reusable procedures, templates, and worked examples. The main site carries arguments and deeper case studies that connect those procedures. Each brief in `backlog.json` has its own question, proposed route, outline, source candidates, internal-link candidates, and original asset. These are 30 page briefs, not 30 finished articles. G01 is the initial article used to exercise the process. Backlog IDs in internal-link candidates are future links: resolve them only after that target is live. At launch use at least two already-live alternatives from the existing site inventory; add future links when those pieces ship. For example, P03 can initially link to the existing personal-knowledge-graph essay and G01; P04 can link to agents-org-design and agent-desks; P06 can link to G14 and the existing Product Management garden note. Never emit an ID as a URL or link to an unpublished page.

Topic selection combines GBrain's memory architecture, reliable-agent operating principles, evidence-guided product management, and compound-writing records with the current public repository. Some GBrain records are syntheses: use them for topic grounding, not as independent evidence. Re-read original records for personal claims. Do not publish private transcripts, performance reviews, personal details, infrastructure addresses, or unpublished employer information.

Exa and Parallel Search supplied source discovery and original-page reads. Semrush supplied US keyword estimates on September 17, 2026. `semrush-us-2026-09-17.csv` preserves the actual response. Volumes describe seed queries, not expected page visits. Missing data stays null. A difficulty of zero on a sparse term is not proof that ranking is easy. Rank editorial choices by first-hand/public evidence, usefulness, distinctness and then demand. Do not select broad competitive terms solely for volume.

The source registry holds starting points, not blanket approval for every claim. Each draft needs its own source reading and claim ledger. Prefer original research, standards and maintained implementations. Practitioner guidance is labeled; standards are not experimental evidence. Benchmark results require dates, versions and limitations. Avoid making comparative claims from vendors' own marketing.

## Daily run at 08:30 America/Los_Angeles

1. Acquire a single-run lock in the task's `work/publishing/` directory. Read the durable ledger and any open content PR before picking work. Reconcile interrupted runs against GitHub, live URLs and social account history. Resume an in-flight item before selecting another. Use the local calendar date; publish at most one new canonical page that day. A missed day does not authorize a catch-up batch.
2. Fetch `origin/main` in the repository. Use an isolated feature branch; leave other checkouts and uncommitted changes alone. Read current root/app instructions. Select the next unpublished entry in the release order, comparing the backlog with live routes, git history and the ledger. Keep a three-piece reserve by preparing additional drafts when time permits; only one becomes public per day.
3. Query relevant GBrain source scope, then read the original records that support the angle. Recheck existing site routes and topic overlap. Search Exa and Parallel independently for primary evidence and counterevidence. Refresh the relevant Semrush metrics weekly; missing research access must be recorded rather than replaced with fabricated numbers.
4. Read at least three directly relevant public sources from at least two independent domains, including two research/standards/implementation sources. Record passages, dates, versions and limitations. A working URL is only a transport check. Read the destination and verify that it supports the particular claim. Inspect redirects, soft 404s, paywalls, stale versions and retractions. Replace weak or inaccessible evidence with a suitable source; do not silently waive it.
5. Write a public-safe research packet in `work/`. Use `spiral write` with that file, the technical writing style, and explicit audience/voice/source constraints. Ask for article, LinkedIn and X drafts in one campaign. Style UUID: `f6648233-40fc-47ef-9eb2-5693ffd1afdd`. Do not use the SMS style. Use full UUIDs. Read `spiral --help`/`spiral prime` if commands change. Resolve Spiral's context questions from tools rather than forwarding them to Oliver. Preserve session ID locally for refinements. Spiral drafts are unverified input; its research or compliance claims are not an approval.
6. Review in a separate pass against the source material. Remove unsupported details, invented experience, filler and duplicate coverage. Add one usable artifact: worked example, runnable fixture, worksheet, decision table, or diagram. Garden notes should generally be 500–900 words; portfolio essays 1,000–1,800 where the subject warrants it. Length never substitutes for substance. Link to at least two relevant existing pages; add a contextual inbound link from an existing hub where useful. Preserve citation URLs and use neutral visible labels to satisfy site copy rules.
7. Record `reviews/<ID>.json` with article hash, reviewed factual claims and passages, clearly marked illustrations/recommendations, limitations, and scored review. Require at least 4/5 on originality, usefulness, evidence, clarity and limitations. Scores are editorial judgments. They cannot replace reading or outcome checks. Any article edit invalidates the hash and requires review again. For portfolio work, inspect all changed component/registry/metadata files in addition to the hashed prose file.
8. Run the checks below, the app's required checks and production build, and visual checks at desktop/mobile for new routes or UI. Add portfolio routes to the existing piece registry, metadata and sitemap pipeline; do not create an unindexed page. Garden uses Markdown filenames for slugs. Do not alter art credits or redesign navigation.
9. Open a focused PR, attach it to the Codex task, and wait for successful CI on its current head. Inspect the affected Vercel Preview and rendered citations. Merge only the tested head after review gates pass. Then verify the production deployment is Ready and the canonical article URL contains the expected title/content, correct canonical metadata, working internal links and sitemap entry. Preserve the PR, merge SHA, deployment and production check receipts. Do not call a preview a release.
10. Publish the reviewed adaptations to LinkedIn profile `https://www.linkedin.com/in/n3wth/` and X account `https://x.com/olivernewth` only after the canonical page is live. Use an available official connector first; otherwise use the authenticated browser with the Computer Use plugin. Confirm the account before posting. Use an informative standalone insight and a link; avoid engagement bait, hashtags by default, invented claims and unsolicited tagging. Use `utm_source=linkedin` or `x`, `utm_medium=social`, `utm_campaign=daily_research`, and `utm_content=<ID>`. Preserve a clean canonical URL on the article itself.
11. Record each actual social post URL and timestamp immediately after posting. Check for a matching post before retrying an interrupted send. An ambiguous result is `unknown`, not `failed`: inspect account history before doing anything that could duplicate it. Keep LinkedIn and X states independent. A social failure does not cause the article to be published twice.
12. Update the local ledger and backlog status. Notify Oliver only for a meaningful completed release, failure, or required intervention; stay quiet on unchanged/non-actionable runs. If source checks or build gates fail, hold publication and report the specific blocker. Preserve quality when a daily deadline cannot be met.

The heartbeat depends on the Codex host being awake, network access, connected research apps, SSH access to `m4mini`, Spiral authentication, and browser sign-ins. It is an active local schedule, not an always-on cloud service or a promise that platforms will accept every post. If tools cannot post, retain reviewed social copy with a blocked state and surface that dependency. Do not create new credentials or broaden permissions as a workaround.

## Commands

Use Node 24 and npm 11.19.1. No dependencies were added for editorial tools.

```sh
node --test docs/editorial/check.test.mjs
node docs/editorial/check.mjs backlog
node docs/editorial/check.mjs next /absolute/path/to/work/publishing/state.json
node docs/editorial/check.mjs review G01
node docs/editorial/check.mjs links G01 /absolute/path/to/work/links-G01.json
node docs/editorial/check.mjs release G01 /absolute/path/to/work/links-G01.json
npm run build:garden
npm run check -w @n3wth/garden
# For a portfolio release, use the equivalent portfolio build and check.
```

`next` resumes unfinished ledger work before new briefs; finish missing distribution for already-live items before using it to select another page. `review` checks that evidence records match the reviewed text. `release` additionally requires successful HTTP/content checks less than 24 hours old for every outbound URL. First-party cross-site links are checked as destinations but do not count toward independent evidence. The URL scanner covers literal Markdown/HTML/JSX URLs; manually inspect rendered links too, especially dynamic components. It does not decide factual truth. Reports live in `work/` and are not committed, so a stale report cannot make future CI appear current. An inaccessible source blocks the release gate; change the citation or resolve access, then rerun.

## Research graphics

Use a graphic when it makes a relationship, comparison, mechanism or example easier to understand. Place it beside the passage it explains. Prefer original explanatory diagrams based on sources already read, or third-party assets with verified reusable rights. Cite the specific source below the figure; identify the creator and license for reused assets. A citation does not grant reuse rights. Keep local assets, descriptive alt text, intrinsic dimensions and lazy loading. Link detailed figures to their full-size asset.

Label conceptual diagrams and hypothetical examples clearly. Quantitative graphics require source values, units, population, dates and material limitations; never invent a curve or percentage to fill space. Preserve uncertainty and distinguish a framework author's guidance from empirical findings. Keep captions at the existing supporting size and regular weight.

Use SVG for original diagrams. Garden's build embeds light/dark palettes from `@n3wth/ui`; run `npm run figures:theme -w @n3wth/garden` after authoring a figure. The SVG's media query follows the embedding page's `color-scheme`, so forced dark pages stay coherent even on a light system setting. Preserve original colors in photographs. Check diagrams in both schemes and open the full-size asset when reviewing small labels.

The first 100 enhanced notes have per-page evidence and rights records in `visuals/*.json`. Run `node docs/editorial/visuals/check.mjs` to check the records, article markup and asset integrity. Add `--links /absolute/path/to/report.json` for a fresh transport check of all cited sources; review the destinations as well. These checks complement source reading and visual review. Recheck evidence and update the article's editorial review hash when adding or changing a figure.

Enhanced notes also have a short Further reading section with up to three curated source previews. Show the publisher, source title and a concise explanation of what the reader will learn. Use the verified source records, keep metadata local and render it with the page. Do not fetch third-party previews on a reader's visit or assume an open-graph image grants reuse rights. Inline citations remain beside the claims they support; previews help readers choose what to explore next.

## Durable ledger

Keep `work/publishing/state.json` in the task directory with a top-level `timezone`, `lastPublishedDate`, and `items` keyed by backlog ID. Each item records `phase`, `contentSha256`, `branch`, `prUrl`, `headSha`, `mergeSha`, `liveUrl`, `deployedAt`, `deploymentUrl`, `linkReportPath`, `reviewPath`, `linkedin` and `x` objects (`state`, `postUrl`, `postedAt`), and optional `upstream` receipts. Phase progresses through `researching`, `drafted`, `validated`, `pr_open`, `merged`, `live`, and `distributed`. Record failures separately with cause and next action. A phase changes only after the corresponding external read-back succeeds. Keep write receipts before advancing to the next action.

Use an atomic `mkdir work/publishing/run.lock` to claim a run, with a timestamp and owner record inside. Release the lock in a finally/cleanup path. If the lock exists after interruption, inspect the prior run and its external outcomes; never delete a possibly active lock blindly. The scheduler is the sole owner. Store all secrets in existing key stores, never this ledger or Git.

## Useful upstream contributions

Research can produce documentation corrections, test cases, examples, and bug fixes. Treat those as contributions with an independent reason to exist. The user authorized this distribution channel; do not turn it into a daily backlink quota. On the weekly review, inspect current open issues and `CONTRIBUTING` in relevant maintained repositories. At most two unsolicited PRs per week, only where the contribution solves a demonstrated problem and the project permits it. Disclose authorship where linking your article is useful. If a link adds no necessary evidence, leave it out. Never add unrelated promotional links, bulk comments, or duplicate resource-list submissions. Maintainers decide whether to merge; an opened PR is not an acquired backlink.

Initial candidates, with stars observed through Exa on September 17, 2026 (recheck before acting):

| Repository | Observed stars | Relevant briefs | Potential contribution, subject to issue/policy review |
| --- | ---: | --- | --- |
| [pgvector/pgvector](https://github.com/pgvector/pgvector) | 22,882 | G05, G06 | Tested retrieval example or reproduction of a real documentation ambiguity |
| [modelcontextprotocol/modelcontextprotocol](https://github.com/modelcontextprotocol/modelcontextprotocol) | 8,386 | G08, G09, G11 | Precise tool outcome or trust-boundary documentation correction |
| [beir-cellar/beir](https://github.com/beir-cellar/beir) | 2,217 | G01, G04, P03 | Reproducible evaluation fixture or documentation improvement |
| [open-telemetry/semantic-conventions-genai](https://github.com/open-telemetry/semantic-conventions-genai) | 259 | G10, G17 | Accurate trace example; a specialist target, not a high-popularity claim |

Link counts are not the success criterion. Record accepted useful contributions, referral visits, engaged reads, and subsequent citations. Use the article's evidence assets for relevant community answers only when there is a real question and community rules allow it. No unsolicited DMs or mass outreach.

## Weekly maintenance and replenishment

Pull requests validate every reviewed manuscript's hash and claims. Live outbound-link checks run for changed manuscripts or review records; changing the source registry checks every reviewed manuscript's links. Run the Editorial evidence workflow manually for a full live-link audit, including unchanged manuscripts.

During the Sunday daily run, review the previous seven days without publishing an extra piece. Measure release completion, source-check failures, time to publish, social receipts, referral visits and accepted upstream contributions. Read available site analytics and search performance through their connectors; do not fabricate unavailable data. Compare at 7 and 28 days and avoid causal conclusions from small samples. Track indexed pages, search queries and engaged visits alongside rankings. Refresh source links and correct decayed claims.

Keep at least seven unreleased briefs. When the queue drops below seven, add ten distinct research-grounded briefs with roughly the same 2:1 garden/portfolio mix. Re-read current GBrain work, site inventory, Semrush and original sources. Preserve the rule that a brief is not an approved article. Stop generating near-duplicates when a topic would be better handled as a correction to an existing page.
