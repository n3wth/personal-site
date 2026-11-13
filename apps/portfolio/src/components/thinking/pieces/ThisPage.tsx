import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'
import { FlowDiagram } from '../kit/FlowDiagram'
import type { FlowEdge, FlowNode } from '../kit/FlowDiagram'

/* "How this backlog got built" — the meta piece about the process that
   produced the other pieces in this registry. Source material is this
   repo's own docs/thinking-pieces-tracker.md and its git log, not gbrain
   or invented specifics. The table specimen below is a real excerpt of
   that tracker (rows 1, 2, 5, 6, 9, 14, 16, 20, columns unchanged), not a
   mockup of one. The FlowDiagram is the real per-piece pipeline the
   tracker's "Process per piece" line describes: pull source, draft in
   voice, build in parallel isolated worktrees, verify + compliance-grep,
   merge into the one shared registry file. Stage numbers are honest —
   this is the actual order work happened in, not decoration.

   Two real mistakes are named without inventing detail beyond what the
   tracker and commit history already record: a duplicate concurrent
   build (two independent agent batches built the same four pieces at
   once, caught only at integration — this repo's own git-worktree
   history shows both lineages landing pieces 2-5 independently) and a
   compliance miss on the gtd-mini draft (an LLM named by brand three
   times, caught by the same grep step this piece describes, per that
   piece's own merge commit). Neither mistake names a specific AI product
   — the whole point of the second one is that this site can't. */

const PIPELINE_NODES: FlowNode[] = [
  { id: 'source', label: 'Real source', x: 50, y: 110 },
  { id: 'draft', label: 'Drafted in voice', x: 240, y: 110 },
  { id: 'w1', label: 'Worktree A', x: 460, y: 40 },
  { id: 'w2', label: 'Worktree B', x: 460, y: 110 },
  { id: 'w3', label: 'Worktree C', x: 460, y: 180 },
  { id: 'verify', label: 'Verify + grep', x: 700, y: 110 },
  { id: 'registry', label: 'One registry file', x: 920, y: 110, active: true },
]
const PIPELINE_EDGES: FlowEdge[] = [
  { from: 'source', to: 'draft' },
  { from: 'draft', to: 'w1' },
  { from: 'draft', to: 'w2' },
  { from: 'draft', to: 'w3' },
  { from: 'w1', to: 'verify' },
  { from: 'w2', to: 'verify' },
  { from: 'w3', to: 'verify' },
  { from: 'verify', to: 'registry' },
]

interface TrackerRow {
  n: string
  slug: string
  source: string
  status: string
}

const TRACKER_ROWS: TrackerRow[] = [
  { n: '1', slug: 'night-field', source: 'shipped in #70, #71, #72', status: 'done' },
  { n: '2', slug: 'agents-org-design', source: 'shipped in #76', status: 'done' },
  { n: '5', slug: 'gtd-mini', source: 'shipped in #76', status: 'done' },
  { n: '6', slug: 'compound-engineering', source: 'this project', status: 'queued' },
  { n: '9', slug: 'personal-knowledge-graph', source: 'gbrain concepts/knowledge-graphs', status: 'queued' },
  { n: '14', slug: 'hop-flights', source: 'gbrain career/hop-flights', status: 'queued' },
  { n: '16', slug: 'twilio-compliance', source: 'memory twilio.md', status: 'queued' },
  { n: '20', slug: 'this-page', source: 'this session', status: 'queued' },
]

function TrackerExcerpt() {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse font-mono text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--rail-strong)' }}>
              {['#', 'Slug', 'Source', 'Status'].map((h) => (
                <th
                  key={h}
                  className="px-2 py-2 text-left font-medium"
                  style={{ color: 'var(--ink-faint)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRACKER_ROWS.map((row) => (
              <tr key={row.n} style={{ borderBottom: '1px solid var(--rail)' }}>
                <td className="px-2 py-2" style={{ color: 'var(--ink-faint)' }}>
                  {row.n}
                </td>
                <td className="px-2 py-2" style={{ color: 'var(--ink)' }}>
                  {row.slug}
                </td>
                <td className="px-2 py-2" style={{ color: 'var(--ink-dim)' }}>
                  {row.source}
                </td>
                <td
                  className="px-2 py-2"
                  style={{ color: row.status === 'done' ? 'var(--ink)' : 'var(--ink-faint)' }}
                >
                  {row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 max-w-[52ch] text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
        Eight of the twenty rows in <code>docs/thinking-pieces-tracker.md</code> — slugs and statuses
        verbatim, the source column trimmed to one reference where the tracker lists several. Row 20
        is this piece. By the time you're reading this, more rows than shown here have flipped to
        done — a tracker written by hand describes the backlog as of the last time someone looked at
        it, not the backlog as it currently stands.
      </p>
    </div>
  )
}

export default function ThisPage() {
  return (
    <div>
      <p className="max-w-[62ch] text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink-dim)' }}>
        Every piece in this registry, including this one, went through the same process: pulled from
        something real, drafted in voice, built by an agent in its own isolated corner of the repo,
        checked, merged into one shared file. The table below is a real excerpt of the document that
        tracked all twenty. Two of the rows exist because that process broke, once each, in two
        different ways.
      </p>

      <Beat
        stage={{ n: '01', label: 'Source' }}
        prose={
          <>
            The backlog started as a single markdown table: a slug, a topic, a source, an
            interaction idea, a status, one row per piece. The rule from the top was no invented
            filler — every row traces to something that already existed. A shipped pull request. A
            saved note. An actual git log. Where the source material was thin, the instruction was to
            write around the gap rather than manufacture specifics to fill it.
          </>
        }
      >
        <TrackerExcerpt />
      </Beat>

      <Beat
        stage={{ n: '02', label: 'Draft and build' }}
        prose={
          <>
            Each row became a job with the same shape: pull the real source, draft it in voice, fit
            it to a shared kit of layout primitives — a prose-and-specimen unit, a labeled flow
            diagram, a before/after toggle, a sidenote — then build it. Several rows ran at once, each
            handed to an agent in its own isolated git worktree, so one agent's half-finished edit
            couldn't collide with another's mid-build. The one file every worktree agreed to leave
            alone was the registry: the single list of which pieces exist, wired in by hand after
            each batch landed, specifically so parallel agents never had to resolve a conflict in the
            same file.
          </>
        }
      >
        <div className="h-64 w-full max-w-3xl sm:h-72">
          <FlowDiagram nodes={PIPELINE_NODES} edges={PIPELINE_EDGES} width={1000} height={220} />
        </div>
      </Beat>

      <Beat
        stage={{ n: '03', label: 'Verify' }}
        prose={
          <>
            Verification was mechanical and non-negotiable before anything shipped: typecheck, lint,
            tests, a production build. One more check sat on top of those, specific to this site: grep
            every draft for the brand names of AI products, because a personal site tied to a day job
            at a company with its own model can't casually name a competitor's. It caught something
            real. One of the twenty drafts named a specific LLM by brand, three separate times — the
            source material it was pulled from had quoted the name verbatim, and the draft carried it
            straight through. The grep caught it before merge, in the same pull request. A separate,
            site-wide sweep run around the same time found a couple of stray mentions already live
            elsewhere and pulled those too.
          </>
        }
      />

      <Beat
        stage={{ n: '04', label: 'Integrate' }}
        prose={
          <>
            The registry file was supposed to be the one place parallel work couldn't collide. It
            mostly held. Then two independent batches of agents, started from two different sessions
            neither aware of the other, built the same four pieces at the same time — same slugs, same
            arguments, one batch naming a file with a lowercase final letter and the other with an
            uppercase one, two on-disk names for one essay. Nobody caught it mid-build, because nothing
            in either worktree could see the other. It surfaced at integration, when a second batch's
            git-worktree listing came back already full of work that looked exactly like its own. The
            fix wasn't a smarter agent. It was a habit: check what's already running before starting
            a new batch, not after.
          </>
        }
      />

      <Beat
        prose={
          <>
            The table near the top of this piece is real, and it's already wrong by the time you read
            it — a few of the rows marked queued there will have shipped between the draft and this
            sentence rendering on your screen. That's not a bug in the tracker. A backlog built by a
            swarm of parallel agents doesn't have a single moment when it's fully described anywhere;
            it has a table someone updates by hand, a registry file that's the actual source of truth,
            and a gap between them that closes and reopens with every batch.
          </>
        }
      />

      <Blockquote className="mt-4 max-w-[48ch]">
        The tracker says what was planned. The registry says what shipped. Believe the registry.
      </Blockquote>
    </div>
  )
}
