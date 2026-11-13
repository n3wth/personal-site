import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'
import { ToggleCompare } from '../kit/ToggleCompare'
import { FlowDiagram } from '../kit/FlowDiagram'
import type { FlowEdge, FlowNode } from '../kit/FlowDiagram'

/* Five real pull requests from this repo's own history, in the order they
   actually landed (a genuine chronological sequence, so `stage` numbering
   is honest here rather than decorative): the first Thinking piece
   shipping with in-PR fixes already, a curation pass that caught
   structural drift before it spread to nineteen more pieces, a three-line
   flat-design fix, the extraction of that piece's layout into the shared
   kit/Beat.tsx every later piece (including this one) imports, and a
   compliance rule that got applied automatically to the next batch of
   work without anyone restating it. No invented specifics — line counts,
   commit numbers, and quoted rationale below are drawn from `git log`
   in this repo. Two real commits (PR #75, PR #76) touched copy that
   named specific third-party AI products by brand; per this site's
   compliance rule, those names are described here rather than quoted. */

const STAGES = [
  { n: '01', label: 'Ship' },
  { n: '02', label: 'Review' },
  { n: '03', label: 'Fix' },
  { n: '04', label: 'Extract' },
  { n: '05', label: 'Compound' },
]

const COMPOUND_NODES: FlowNode[] = [
  { id: 'rule', label: 'Rule written in PR #75', x: 70, y: 130 },
  { id: 'batch', label: 'Next batch built in parallel in PR #76', x: 380, y: 60 },
  { id: 'caught', label: 'Violation caught without new instruction', x: 700, y: 130, active: true },
  { id: 'fixed', label: 'Fixed before merge', x: 980, y: 60 },
]
const COMPOUND_EDGES: FlowEdge[] = [
  { from: 'rule', to: 'batch' },
  { from: 'batch', to: 'caught' },
  { from: 'caught', to: 'fixed' },
]

type DiffLine = { t: string; changed: boolean }

const DIFF_BEFORE: DiffLine[] = [
  { t: '<span', changed: false },
  { t: 'style={{', changed: false },
  { t: "  color: broken ? '#4a4d52' : 'var(--ink-dim)',", changed: true },
  { t: "  textShadow: broken ? '0 0 24px rgba(255,255,255,0.08)' : 'none',", changed: true },
  { t: "  animation: broken ? 'kit-glitch 2.6s ease-in-out infinite' : undefined,", changed: false },
  { t: '}}>', changed: false },
]

const DIFF_AFTER: DiffLine[] = [
  { t: '<span', changed: false },
  { t: 'style={{', changed: false },
  { t: "  color: broken ? 'var(--ink-faint)' : 'var(--ink-dim)',", changed: true },
  { t: "  animation: broken ? 'kit-glitch 2.6s ease-in-out infinite' : undefined,", changed: false },
  { t: '}}>', changed: false },
]

function DiffBlock({ lines, sign }: { lines: DiffLine[]; sign: '-' | '+' }) {
  return (
    <pre className="max-w-xl overflow-x-auto font-mono text-[13px] leading-relaxed">
      {lines.map((l, i) => (
        <div key={i} style={{ color: l.changed ? 'var(--ink)' : 'var(--ink-dim)' }}>
          <span style={{ color: 'var(--ink-faint)' }}>{l.changed ? sign : ' '} </span>
          {l.t}
        </div>
      ))}
    </pre>
  )
}

export default function CompoundEngineering() {
  return (
    <div>
      <p className="max-w-[62ch] text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink-dim)' }}>
        Five real pull requests from this site's own history, in the order they landed: a build, a
        review, a three-line fix, an extraction, and a rule that got reused three PRs later without
        anyone repeating it.
      </p>

      <Beat
        stage={STAGES[0]}
        prose={
          <>
            The first Thinking piece shipped with two fixes already caught before merge, not after.
            The homepage's bottom link grid repeated three destinations already in the persistent
            nav; review cut it down to the one link that wasn't already there, the garden. The
            pointer-driven camera sway was too wide — 3x horizontal, 1.2x vertical — and came down to
            1.1x and 0.45x with softer damping, so a mouse move reads as ambient parallax instead of a
            wide pan. Neither fix took more than a few lines. What mattered is that they landed in the
            same pull request as the build, not in a bug report filed a week later.
          </>
        }
      />

      <Beat
        stage={STAGES[1]}
        prose={
          <>
            The second pull request was a review, not a build. It read the piece that had just
            shipped and found problems that were about to get copied into the other nineteen: every
            specimen sat inside a bordered, rounded card, fighting the site's flat, no-chrome rule.
            The lighting demo used a synthetic torus knot instead of the real generated rock model
            already sitting on the homepage. There was no spine — no ordering, no closing quote. None
            of that was a bug in the sense of broken code. It was drift, the kind that costs nothing
            in one file and a rewrite of twenty.
          </>
        }
      />

      <Beat
        stage={STAGES[2]}
        prose={
          <>
            Two pull requests later, a smaller thing slipped through anyway: a raw hex color and a
            text-shadow glow in one specimen, both banned by the site's flat rule on their own
            terms — 1px borders and CSS variables, no glows, no gradients, no hardcoded color. Three
            lines, caught and reverted before it could set a precedent. This is the actual diff.
          </>
        }
      >
        <ToggleCompare
          beforeLabel="before — PR #72"
          afterLabel="after — PR #72"
          before={<DiffBlock lines={DIFF_BEFORE} sign="-" />}
          after={<DiffBlock lines={DIFF_AFTER} sign="+" />}
          caption="a hex color and a text-shadow glow, swapped for var(--ink-faint) and removed entirely — the exact three-line change from the real commit."
        />
      </Beat>

      <Beat
        stage={STAGES[3]}
        prose={
          <>
            The pattern under the last two fixes was the same one: the two-column magazine grid, the
            optional stage number, the optional margin note — all of it lived inside a single file,
            written once for a single piece. Four more pieces were about to need the identical
            layout. Instead of rewriting it a second time with small drift already baked in, it moved
            into a shared component that every later piece imports rather than redefines slightly
            differently. The paragraph you are reading now is laid out by that same import.
          </>
        }
      />

      <Beat
        stage={STAGES[4]}
        prose={
          <>
            Two pull requests after that, a compliance pass found project copy and a code comment
            naming specific third-party AI products by brand — a hard constraint here, not a style
            preference, since this site is written by someone who can't publicly endorse a
            competitor's model while working at Google. The rule got written down once. It did not
            get re-explained. The very next pull request — four more Thinking pieces, built by
            isolated agents in parallel — turned up one draft that had named an LLM by brand in three
            places, and it was caught and rewritten before merge, same rule, zero new instructions.
            That's the actual claim under "compound engineering": not that agents get smarter, but
            that a fix, once written down as a standing rule instead of a one-off patch, keeps paying
            out on work nobody has started yet. This piece is itself an instance of it — the same grep
            ran against this file before it shipped.
          </>
        }
      >
        <div className="h-64 w-full max-w-3xl sm:h-72">
          <FlowDiagram nodes={COMPOUND_NODES} edges={COMPOUND_EDGES} width={1040} height={220} />
        </div>
      </Beat>

      <Blockquote className="mt-4 max-w-[48ch]">
        A rule that has to be re-explained every time isn't a rule, it's a request. Compound
        engineering is just what you call it once the second request never has to be made.
      </Blockquote>
    </div>
  )
}
