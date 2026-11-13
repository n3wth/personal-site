import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'
import { ToggleCompare } from '../kit/ToggleCompare'
import { FlowDiagram } from '../kit/FlowDiagram'
import type { FlowEdge, FlowNode } from '../kit/FlowDiagram'

/* One real bug from hop.flights (points-vs-cash flight search), sourced
   from a DeepWiki audit logged 2026-07-02: assembleSearch (lib/search.ts)
   computed award cpp from Seats.aero's per-seat miles/taxes against
   Duffel's cash total, which is already summed across every passenger.
   lib/seatsaero.ts never reads params.adults at all. Stage numbers are
   the real symptom -> root cause -> fix order the audit found it in, the
   same spine NightField uses for its five bugs. No specific cpp/dollar
   figures are asserted — the source material states the inflation is
   "roughly party size," not an exact multiplier, so the specimen stays
   schematic rather than inventing numbers that were never measured. */

const ROOT_CAUSE_NODES: FlowNode[] = [
  { id: 'seats', label: 'Seats.aero miles + taxes per seat', x: 90, y: 50 },
  { id: 'duffel', label: 'Duffel cash total for whole party', x: 90, y: 180 },
  { id: 'join', label: 'assembleSearch joins them', x: 420, y: 115, active: true },
  { id: 'cpp', label: 'cpp computed', x: 700, y: 115 },
  { id: 'verdict', label: 'verdict shown', x: 920, y: 115 },
]
const ROOT_CAUSE_EDGES: FlowEdge[] = [
  { from: 'seats', to: 'join' },
  { from: 'duffel', to: 'join' },
  { from: 'join', to: 'cpp' },
  { from: 'cpp', to: 'verdict' },
]

function VerdictSpecimen({ inflated }: { inflated: boolean }) {
  const barHeight = inflated ? 128 : 62
  return (
    <svg viewBox="0 0 300 190" className="h-48 w-full max-w-sm" role="presentation" focusable="false">
      <line x1={20} y1={160} x2={280} y2={160} stroke="var(--rail)" strokeWidth={1} />
      <line
        x1={20}
        y1={95}
        x2={280}
        y2={95}
        stroke="var(--rail-strong)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      <rect
        x={120}
        y={160 - barHeight}
        width={60}
        height={barHeight}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={1.5}
      />
      <text x={150} y={178} textAnchor="middle" fontSize={12} fill="var(--ink-dim)">
        2 passengers, same flight
      </text>
      <text
        x={150}
        y={160 - barHeight - 12}
        textAnchor="middle"
        fontSize={13}
        fill="var(--ink)"
      >
        {inflated ? 'USE POINTS' : 'PAY CASH'}
      </text>
    </svg>
  )
}

export default function HopFlights() {
  return (
    <div>
      <Beat
        prose={
          <>
            hop.flights answers one question: use points, or pay cash. The whole pitch of the
            verdict engine — the assembleSearch function in the search library — is that the
            answer is computed from a user's real loyalty balances and real cash prices, never
            generated. That's the moat: no hedge, no disclaimer, just a number. Which also means
            that when the number is wrong, it's wrong with the same flat confidence as when it's
            right.
          </>
        }
      />

      <Beat
        stage={{ n: '01', label: 'Symptom' }}
        prose={
          <>
            A solo search checks out. Add a second passenger to the same search and the verdict
            can flip outright — points to cash, or cash to points — not a rounding difference, the
            opposite recommendation, while the page still states it with total certainty. A DeepWiki
            audit run against the codebase in July surfaced it as the highest-priority open issue:
            live, in production, on the exact search pattern a family actually runs.
          </>
        }
      >
        <ToggleCompare
          beforeLabel="1 passenger"
          afterLabel="2 passengers"
          before={<VerdictSpecimen inflated={false} />}
          after={<VerdictSpecimen inflated />}
          caption="same flight, same fare class — the only input that changed is party size."
        />
      </Beat>

      <Beat
        stage={{ n: '02', label: 'Root cause' }}
        prose={
          <>
            Seats.aero returns award pricing per seat: miles and taxes for one passenger. Duffel
            returns cash pricing as a total, already summed across everyone on the itinerary.
            assembleSearch divides one against the other without checking which is which — the
            per-seat miles become the denominator, the whole-party cash total becomes part of the
            numerator. The Seats.aero client never reads the party-size parameter at all, so the
            number typed into the search box is invisible to the function computing the award
            side. The result inflates the cents-per-point figure (cpp) by roughly party size: two
            passengers runs the number roughly double, three roughly triple.
          </>
        }
      >
        <div className="h-64 w-full max-w-3xl sm:h-72">
          <FlowDiagram nodes={ROOT_CAUSE_NODES} edges={ROOT_CAUSE_EDGES} width={1000} height={220} />
        </div>
      </Beat>

      <Beat
        stage={{ n: '03', label: 'Fix' }}
        prose={
          <>
            The fix is arithmetic, not architecture: scale the award side by party size before it
            meets the cash side, so both numbers describe the same trip. It survived this long
            because the mock fixtures used in day-to-day development don't scale by party size
            either — the same flat numbers come back whether the search box says one passenger or
            four, so the bug never got a chance to surface in the normal dev loop. It only shows up
            against real data, on a real multi-passenger search. It's tracked in Linear now as one
            of four hard gates the project holds before billing turns on at all — alongside one
            payment lane tested end to end, alerts confirmed live, and written commercial terms
            with the seat-availability provider. None of the four ship until the verdict itself
            holds for more than one passenger.
          </>
        }
      />

      <Blockquote className="mt-4 max-w-[48ch]">
        A verdict that's computed instead of guessed is only a better product if the arithmetic
        actually checks out — otherwise it's just a guess that sounds more certain than it is.
      </Blockquote>
    </div>
  )
}
