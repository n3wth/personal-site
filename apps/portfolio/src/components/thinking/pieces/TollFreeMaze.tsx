import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'
import { FlowDiagram } from '../kit/FlowDiagram'
import type { FlowEdge, FlowNode } from '../kit/FlowDiagram'

/* Twilio toll-free verification, told as a maze: each Beat is one real
   rejection or fix from the actual application (business_website,
   opt_in_type, business_type). The FlowDiagram compresses the three
   fields that mattered into forks — the value that gets rejected next to
   the value that doesn't — and the dead-end branches are exactly that:
   nodes with no outgoing edge, because that submission went nowhere.
   The final node (IN_REVIEW) is also a dead end structurally, but for a
   different reason — the outcome isn't known yet, which is the honest
   ending here, not a narrative gap. No account IDs, tokens, or the actual
   phone number appear anywhere; only the field names and enum values that
   actually decided the outcome. */

const STAGES = [
  { n: '01', label: 'First submission' },
  { n: '02', label: 'Second submission' },
  { n: '03', label: 'A wall routed around blind' },
  { n: '04', label: 'Where it stands' },
]

const MAZE_NODES: FlowNode[] = [
  { id: 'start', label: 'Submit #1', x: 40, y: 90 },
  { id: 'webBad', label: 'business_website → old domain (redirects)', x: 280, y: 230 },
  { id: 'webGood', label: 'business_website → product domain', x: 280, y: 90 },
  { id: 'optBad', label: 'opt_in_type → WEB_FORM', x: 540, y: 230 },
  { id: 'optGood', label: 'opt_in_type → VERBAL', x: 540, y: 90 },
  { id: 'typeBad', label: 'business_type → PRIVATE_PROFIT (needs EIN)', x: 800, y: 230 },
  { id: 'typeGood', label: 'business_type → SOLE_PROPRIETOR', x: 800, y: 90 },
  { id: 'review', label: 'IN_REVIEW — outcome unknown', x: 960, y: 90, active: true },
]

const MAZE_EDGES: FlowEdge[] = [
  { from: 'start', to: 'webBad' },
  { from: 'start', to: 'webGood' },
  { from: 'webGood', to: 'optBad' },
  { from: 'webGood', to: 'optGood' },
  { from: 'optGood', to: 'typeBad' },
  { from: 'optGood', to: 'typeGood' },
  { from: 'typeGood', to: 'review' },
]

export default function TollFreeMaze() {
  return (
    <div>
      <p className="max-w-[62ch] text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink-dim)' }}>
        A toll-free number needs Twilio's sign-off before it can send a single text. The
        application is one form — business details, opt-in method, use case. It reads like
        paperwork. It behaves like a maze: you can't see a wall until you've already walked into
        it, and the rejection notice is the only map you get.
      </p>

      <Beat
        stage={STAGES[0]}
        prose={
          <>
            The number was for one narrow job: an AI voice hotline sending a single follow-up text
            after a call, capped low, filed under customer-care use. First submission came back
            rejected — business details inaccurate. The field at fault was business_website. It
            pointed at a personal domain that redirects elsewhere, and the reviewer followed the
            redirect to a page that matched nothing else in the application. Nothing else in the
            form was wrong. One URL sank the whole submission.
          </>
        }
      />

      <Beat
        stage={STAGES[1]}
        prose={
          <>
            Fix the website field, resubmit, and the wall moves. Second rejection — opt-in doesn't
            reflect the actual business. The field this time was opt_in_type, set to WEB_FORM, as
            if there were a signup box somewhere collecting numbers. There isn't. The only way
            anyone ends up on this list is by calling the hotline and hearing a disclosure before
            anything gets sent — that's VERBAL, a different enum value entirely. Twilio's taxonomy
            doesn't treat "close enough" as valid. WEB_FORM and VERBAL aren't two names for the
            same consent; they're different mechanisms with different proof requirements attached.
          </>
        }
      />

      <Beat
        stage={STAGES[2]}
        prose={
          <>
            One more field got changed in that same pass, before it had the chance to reject
            anything on its own: business_type, set to SOLE_PROPRIETOR. Not because the business
            is legally structured that way in any deeper sense — because that value is the one
            that skips the business-registration-number and EIN fields, paperwork a one-person
            operation registered only with the city doesn't have. Reading the enum definitions
            before submitting instead of after is the one wall you can route around blind.
            Compressed into a single picture: three fields, each with a value that goes nowhere
            next to the value that doesn't. Nobody hands you this diagram going in. You build it
            out of rejection notices, one at a time.
          </>
        }
      >
        <div className="h-64 w-full max-w-3xl sm:h-72">
          <FlowDiagram nodes={MAZE_NODES} edges={MAZE_EDGES} width={1000} height={320} />
        </div>
      </Beat>

      <Beat
        stage={STAGES[3]}
        prose={
          <>
            The application can only be edited while its status is rejected and editing is still
            allowed — miss that window, or miss the seven-day clock that keeps a resubmission in
            the priority queue, and the next attempt gets treated as brand new, back of the line.
            This round, the status flipped to in-review faster than expected, before two free-text
            fields — additional information, use-case summary — could be updated. They still cite
            the old domain and the old consent page. Whether that triggers a third rejection isn't
            known yet. The only way to fix those two fields now is to wait for that rejection to
            arrive.
          </>
        }
      />

      <Blockquote className="mt-4 max-w-[48ch]">
        A maze doesn't publish its map. You learn each wall by walking into it, and you don't get
        to fix the last one until the next collision tells you it's still there.
      </Blockquote>
    </div>
  )
}
