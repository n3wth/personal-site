import { useState } from 'react'
import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'
import { ToggleCompare } from '../kit/ToggleCompare'

/* Companion to the org-design piece: that one argues the leverage is in
   the org chart, not the model card. This one opens a single desk on that
   chart and asks what actually has to be true for it to count as a desk
   rather than a label — a trigger, a boundary, and a timestamp anyone can
   check without asking a person. The desks below are generic categories
   (a watcher, a reviewer, a self-updating status board, an inbox), not a
   roster of real project names — grounded in real cadences and real kinds
   of output, kept generic on purpose. Interaction is plain HTML buttons
   plus a swapped detail panel, reusing the kit's existing toggle/reveal
   classes rather than inventing new motion. */

interface Desk {
  id: string
  label: string
  trigger: string
  boundary: string
  shipped: string
}

const DESKS: Desk[] = [
  {
    id: 'watcher',
    label: 'Watcher',
    trigger: 'checks in every 30 seconds',
    boundary: "doesn't create anything — only catches and corrects",
    shipped:
      'Found an edit nobody had committed and checked it in before the session ended and the work was gone.',
  },
  {
    id: 'reviewer',
    label: 'Reviewer',
    trigger: 'runs before anything merges',
    boundary: 'can block a merge, cannot approve its own',
    shipped: 'Ran the full suite, every test green, and synced the branch to the main line.',
  },
  {
    id: 'board',
    label: 'Status board',
    trigger: 'rewrites itself on a timer',
    boundary: 'reports state, never edits the work it reports on',
    shipped: "Redrew its own priority table and flagged the line that hadn't moved since the last pass.",
  },
  {
    id: 'inbox',
    label: 'Inbox',
    trigger: 'runs every 15 minutes',
    boundary: 'can file and close, cannot decide what matters',
    shipped: 'Filed the items that had come in and cleared the ones already handled somewhere else.',
  },
]

/* Rendered as flat rectangles sitting on a shared rail — the same desk
   motif as the org-design piece's OrgBoundary (rect fills var(--ink) when
   active, text flips to var(--accent-ink)), just made clickable instead
   of toggle-driven, so this reads as one level of zoom into that chart
   rather than a second copy of the ToggleCompare pill below it. */
function DeskBoard() {
  const [selectedId, setSelectedId] = useState(DESKS[0].id)
  const active = DESKS.find((d) => d.id === selectedId) ?? DESKS[0]

  return (
    <div>
      <div role="group" aria-label="Pick a desk" className="relative">
        <div className="flex flex-wrap items-stretch gap-3 sm:gap-4">
          {DESKS.map((d) => {
            const isActive = d.id === selectedId
            return (
              <button
                key={d.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSelectedId(d.id)}
                className="kit-toggle-btn px-4 py-3 text-sm"
                style={{
                  border: '1px solid var(--rail-strong)',
                  color: isActive ? 'var(--accent-ink)' : 'var(--ink-dim)',
                  background: isActive ? 'var(--ink)' : 'var(--bg)',
                }}
              >
                {d.label}
              </button>
            )
          })}
        </div>
        <div className="mt-3 h-px w-full" style={{ background: 'var(--rail)' }} />
      </div>

      <div
        className="kit-specimen-swap mt-6 min-h-[9rem] max-w-xl sm:min-h-[7rem]"
        aria-live="polite"
        key={active.id}
      >
        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
          {active.trigger} — {active.boundary}
        </p>
        <p className="mt-3 text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink)' }}>
          {active.shipped}
        </p>
      </div>
    </div>
  )
}

function StatusLine({ stale }: { stale: boolean }) {
  return (
    <div className="flex h-32 w-full max-w-sm flex-col justify-center gap-2 font-mono text-sm">
      <span style={{ color: 'var(--ink-dim)' }}>priority table — last touched</span>
      <span style={{ color: stale ? 'var(--ink-faint)' : 'var(--ink)' }}>
        {stale ? 'a person typed this a while ago' : 'the board itself, moments ago'}
      </span>
      <span style={{ color: stale ? 'var(--rail-strong)' : 'var(--accent)' }}>
        {stale ? 'no way to tell if it is still true' : 'timestamp updates on its own'}
      </span>
    </div>
  )
}

export default function AgentDesks() {
  return (
    <div>
      <Beat
        prose={
          <>
            A desk on an org chart is a rectangle with a label in it until three more things are
            true. It fires on something other than a person remembering to click go. It is bounded
            — there's a specific list of what it's allowed to touch and what it isn't. And it
            leaves a timestamp: a real answer to "what did this desk actually do last," checkable
            without finding the person who set it up and asking them.
          </>
        }
      />

      <Beat
        prose={
          <>
            Here are four, kept generic on purpose — the pattern is what matters, not whose
            project they run against. Click through them. Each one has a different trigger and a
            different boundary, and each one has something real it shipped, not a placeholder.
          </>
        }
      >
        <DeskBoard />
      </Beat>

      <Beat
        prose={
          <>
            The desk I trust least on any chart is the one whose status a person types by hand.
            It's accurate the day it's written and a guess every day after. A status board that
            rewrites its own table on a timer is a different object entirely — not because the
            underlying information is more sophisticated, but because the timestamp on it means
            something. Stale is a property of who's holding the pen, not of the information
            itself.
          </>
        }
      >
        <ToggleCompare
          beforeLabel="a person wrote it"
          afterLabel="the desk wrote it"
          before={<StatusLine stale />}
          after={<StatusLine stale={false} />}
          caption="same table, same fields — the difference is whether the timestamp is load-bearing or decorative."
        />
      </Beat>

      <Beat
        prose={
          <>
            Not every desk creates. The watcher desk above does the opposite: its entire job is
            noticing that another desk's output went missing or wrong, fast enough that it doesn't
            matter. That's why its cadence is the shortest of the four — thirty seconds, not
            fifteen minutes, not a push hook. A desk that only corrects has to check more often
            than a desk that produces, because the cost of noticing late is exactly the cost of not
            noticing at all.
          </>
        }
      />

      <Beat
        prose={
          <>
            What none of the four desks can tell you is whether they're still running. A cron job
            that silently stops doesn't announce it — the timestamp just stops updating, and
            nothing reads a timestamp that never changes as an event. The failure mode of a
            standing team isn't a desk doing the wrong thing. It's a desk that quietly stopped
            doing anything, weeks before someone notices the gap it left.
          </>
        }
      />

      <Blockquote className="mt-4 max-w-[48ch]">
        A desk isn't real because it's drawn on the chart. It's real because it has a schedule, a
        boundary, and a timestamp that updates without you.
      </Blockquote>
    </div>
  )
}
