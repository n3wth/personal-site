import { useMemo, useState } from 'react'
import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'
import { AssembleField } from '@n3wth/ui/visuals'

/* "Working notes: 2026" — grounded in a personal annual-planning document
   that spans career, money, home life, and the infrastructure underneath
   all three (source: gbrain goals/2026-goals). Per the privacy constraint
   on this source, every specific — company names, dollar figures, people's
   names, product names — is abstracted to a generic category. What
   survives, and what the piece argues, is the shape: the plan names a
   recurring check for three of its four categories and not the fourth.
   That gap is real and load-bearing, not invented filler.

   Interaction: a constellation built on the shared AssembleField kit
   primitive,
   with one cluster per generic goal category. Each cluster carries a
   partial ring — not a completion percentage (none exists in the source),
   but the review cadence attached to that category: how often something
   actually checks on it. Click a cluster to read its cadence. No stage
   numbers: this is a standing personal system, not a sequential build.

   Layout note: AssembleField's <svg> hardcodes preserveAspectRatio
   "xMidYMid slice", so the overlay <svg> repeats that value explicitly —
   two layers sharing one container must scale identically or the rings
   drift off their dot clusters. A near-square 2x2 layout (not a wide
   1x4 row) with generous margin from every viewBox edge keeps all four
   rings on-screen under "slice" across the container's real aspect
   range, roughly 1.25:1 on a narrow phone up to 2.67:1 at max-w-3xl. */

interface Category {
  id: string
  label: string
  x: number
  y: number
  fill: number
  cadence: string
  note: string
}

const CATEGORIES: Category[] = [
  {
    id: 'career',
    label: 'Career',
    x: 350,
    y: 220,
    fill: 0.6,
    cadence: 'Checked every two weeks.',
    note: 'Sponsorship and evidence-gathering sit on a fixed two-week sync — someone else is on the other end of it, so it happens.',
  },
  {
    id: 'financial',
    label: 'Financial',
    x: 650,
    y: 220,
    fill: 0.85,
    cadence: 'Checked weekly, then again monthly.',
    note: 'A script runs weekly to prune drifted subscriptions and cloud spend; a monthly pass checks the running total against the plan.',
  },
  {
    id: 'systems',
    label: 'Systems',
    x: 350,
    y: 380,
    fill: 0.3,
    cadence: 'Checked once a quarter.',
    note: 'Hardware and the knowledge base underneath everything else get one formal review a quarter. In between, upkeep happens ambiently or not at all.',
  },
  {
    id: 'personal',
    label: 'Personal',
    x: 650,
    y: 380,
    fill: 0.05,
    cadence: 'No recurring check.',
    note: 'Family and household commitments are written down on the same page as the rest. Nothing on any calendar comes back to look at them.',
  },
]

const RADIUS = 34

function GoalConstellation() {
  const [selected, setSelected] = useState<string | null>(null)
  const clusters = useMemo<[number, number][]>(() => CATEGORIES.map((c) => [c.x, c.y]), [])
  const active = CATEGORIES.find((c) => c.id === selected)

  return (
    <div>
      <div className="relative h-64 w-full max-w-3xl sm:h-72">
        <AssembleField
          seed={11}
          clusters={clusters}
          width={1000}
          height={600}
          cols={34}
          rows={18}
          className="absolute inset-0 h-full w-full"
        />
        <svg
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          role="group"
          aria-label="Four generic goal categories. Each ring shows how often something checks on it, not how complete it is. Select one to read its review cadence."
        >
          {CATEGORIES.map((c) => {
            const isSelected = c.id === selected
            const circumference = 2 * Math.PI * RADIUS
            const dash = circumference * c.fill
            return (
              <g
                key={c.id}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                aria-label={`${c.label}: ${c.cadence}`}
                onClick={() => setSelected((cur) => (cur === c.id ? null : c.id))}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault()
                    setSelected((cur) => (cur === c.id ? null : c.id))
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Invisible, generously-sized hit target: the visible rings below are
                    fill="none", so without this only their ~3px stroke would be
                    clickable — well under the site's 44px touch-target rule. */}
                <circle cx={c.x} cy={c.y} r={RADIUS + 18} fill="transparent" style={{ pointerEvents: 'all' }} />
                <circle cx={c.x} cy={c.y} r={RADIUS} fill="none" stroke="var(--rail)" strokeWidth={2} />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={RADIUS}
                  fill="none"
                  stroke={isSelected ? 'var(--accent)' : 'var(--ink)'}
                  strokeWidth={isSelected ? 3.5 : 2.5}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${c.x} ${c.y})`}
                  opacity={c.fill < 0.1 ? 0.5 : 1}
                />
                <text
                  x={c.x}
                  y={c.y + RADIUS + 24}
                  textAnchor="middle"
                  fontSize={15}
                  fill={isSelected ? 'var(--ink)' : 'var(--ink-dim)'}
                >
                  {c.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <p className="mt-3 max-w-[62ch] text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
        {active
          ? `${active.cadence} ${active.note}`
          : 'Ring fill is review frequency, not completion — select a category to see how often it actually gets checked.'}
      </p>
    </div>
  )
}

export default function WorkingNotes2026() {
  return (
    <div>
      <p className="max-w-[62ch] text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink-dim)' }}>
        Every year I rewrite one document: a single page listing what has to be true across career,
        money, and home life by December, plus the infrastructure underneath all three. The
        organizing idea is that a milestone in one column should leave behind something reusable in
        another — a technical artifact that also reads as evidence, a habit that protects both time
        and budget. That's the theory. The plan itself quietly admits it doesn't hold evenly.
      </p>

      <Beat
        prose={
          <>
            The tell is in the last section, the one most planning documents skip: who actually
            checks on this, and how often. Career gets a fixed two-week sync. Money gets a weekly
            script and a monthly pass. The infrastructure underneath — hardware, the knowledge
            system it all runs on — gets a quarterly review. Home life gets written down in the same
            document and then nothing. No cadence, no calendar entry, no second party expecting an
            update.
          </>
        }
      >
        <GoalConstellation />
      </Beat>

      <Beat
        prose={
          <>
            That's not an oversight so much as a structural fact about which goals have external
            pressure attached. The two-week sync exists because someone else is waiting on the
            other end of it. The weekly script exists because drift there costs real money if it
            goes unchecked. The category with no cadence is the one where the only person keeping
            score is me, and I'm bad at scoring myself on a fixed schedule — I have to build the
            schedule in from outside, or it doesn't happen.
          </>
        }
      />

      <Beat
        prose={
          <>
            So the fix isn't a better goal. It's giving the neglected category the same thing the
            others already have: a date, on a calendar, that isn't contingent on how busy the other
            three columns get. A quarterly review that already exists for the systems underneath
            everything else is the cheapest place to bolt this on — the meeting is already
            scheduled; it just needs one more item on the agenda.
          </>
        }
      />

      <Blockquote className="mt-4 max-w-[48ch]">
        A goal with no scheduled check isn't a priority. It's a wish with better formatting.
      </Blockquote>
    </div>
  )
}
