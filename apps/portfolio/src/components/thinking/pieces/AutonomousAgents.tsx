import { useState } from 'react'
import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'

/* "What 'autonomous' actually means in production" — the argument is that
   the word describes two different things people conflate: the inner loop
   (plan, act, observe, self-correct without a human in that loop) and the
   scope of what the loop is allowed to touch (which a human decides, and
   which has nothing to do with how capable the loop is). The interactive
   specimen makes the second thing literal: a set of real actions an agent
   might take, click one, see whether it's reversible-so-the-loop-just-does-
   it or irreversible-so-a-human-signs-off, plus the one-line reason. Flat
   button grid, no cards — active state is a filled rect, not a shadow. No
   stage numbers: this is an argument, not a build log. */

interface AgentAction {
  id: string
  label: string
  boundary: 'loop' | 'human'
  reason: string
}

const ACTIONS: AgentAction[] = [
  { id: 'plan', label: 'Draft a multi-step plan', boundary: 'loop', reason: 'Nothing has executed yet. A plan is a hypothesis, not a state change.' },
  { id: 'sandbox', label: 'Run code in a sandbox', boundary: 'loop', reason: 'Docker or a browser sandbox is disposable by design. Wrong output just gets discarded.' },
  { id: 'read', label: 'Read a file over MCP', boundary: 'loop', reason: 'Perception, not action. Reading the host system changes nothing on it.' },
  { id: 'draft-pr', label: 'Open a draft PR', boundary: 'loop', reason: 'A draft is a proposal sitting in front of a human, not a change that shipped.' },
  { id: 'audit', label: 'Audit a metrics dashboard', boundary: 'loop', reason: 'Observation. The agent is reading the environment, not changing it.' },
  { id: 'retry', label: 'Retry after a compiler error', boundary: 'loop', reason: 'Self-correction inside the same sandboxed attempt — the whole point of the loop.' },
  { id: 'merge', label: 'Merge to main', boundary: 'human', reason: 'Now other people\'s work depends on it. Reverting has a cost someone else pays.' },
  { id: 'deploy', label: 'Deploy to production', boundary: 'human', reason: 'Real users hit real code. "Roll it back" is not the same as "it never happened."' },
  { id: 'spend', label: 'Spend money', boundary: 'human', reason: 'A refund is a second transaction, not an undo button.' },
  { id: 'message', label: 'Message a customer', boundary: 'human', reason: 'Words sent externally can\'t be unsent. The recipient already read them.' },
  { id: 'delete', label: 'Delete production data', boundary: 'human', reason: 'No sandbox to discard. Whatever backup strategy exists, this isn\'t it.' },
  { id: 'publish', label: 'Publish a business update', boundary: 'human', reason: 'A drafted update against the business plan is a proposal until someone signs off on it going out.' },
]

function BoundaryExplorer() {
  const [activeId, setActiveId] = useState<string>('plan')
  const active = ACTIONS.find((a) => a.id === activeId) ?? ACTIONS[0]

  return (
    <div className="w-full max-w-3xl">
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => {
          const isActive = a.id === activeId
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setActiveId(a.id)}
              aria-pressed={isActive}
              className="rounded-full px-4 py-2 text-left text-sm transition-colors"
              style={{
                border: `1px solid ${isActive ? 'var(--ink)' : 'var(--rail-strong)'}`,
                background: isActive ? 'var(--ink)' : 'transparent',
                color: isActive ? 'var(--accent-ink)' : 'var(--ink-dim)',
              }}
            >
              {a.label}
            </button>
          )
        })}
      </div>

      <div className="mt-8 flex items-start gap-4" aria-live="polite">
        <div
          className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
          style={{ background: active.boundary === 'loop' ? 'var(--ink)' : 'var(--rail-strong)' }}
          aria-hidden
        />
        <div>
          <p className="font-mono text-xs uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
            {active.boundary === 'loop' ? 'the loop just does it' : 'needs a human to say go'}
          </p>
          <p className="mt-2 max-w-[52ch] text-sm leading-relaxed md:text-base" style={{ color: 'var(--ink)' }}>
            {active.reason}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AutonomousAgents() {
  return (
    <div>
      <Beat
        prose={
          <>
            "Autonomous" gets applied to two different things, and the word doesn't distinguish
            between them. One is a loop: an agent perceives its environment, plans, acts, checks
            the result, and adjusts, without a human approving each step. The other is a boundary:
            what that loop is allowed to touch. The loop is a property of the system. The boundary
            is a decision someone made. Confusing the two is how "the agent is autonomous" ends up
            meaning "nobody's watching," which is not the same claim at all.
          </>
        }
      />

      <Beat
        prose={
          <>
            The loop itself is the easy part to describe. Hand an agent an objective and it writes
            a plan, executes code inside a sandbox — Docker, a disposable browser context, whatever
            container makes the attempt cheap to throw away — reads the runtime error or compiler
            output, and revises. It reaches out through a standardized interface like the Model
            Context Protocol to touch whatever the host system exposes: files, APIs, other tools.
            None of that requires a human in the loop, and none of it should feel controversial.
            A sandbox is built to be wrong in. That's what makes the self-correction cheap.
          </>
        }
      />

      <Beat
        prose={
          <>
            Click through the list below. Every item on it is a real action an agent can take
            mid-task. Half of them the loop just does, because being wrong costs nothing — the
            attempt gets discarded and the next plan starts from a clean sandbox. The other half
            need a person to say go, because being wrong costs something that doesn't reset: money
            spent, a message already read, a database row that isn't coming back. The line isn't
            about how smart the agent is. It's about whether the action can be taken back.
          </>
        }
      >
        <BoundaryExplorer />
      </Beat>

      <Beat
        prose={
          <>
            A multi-agent setup makes the boundary easier to see, not harder, because it forces you
            to draw it per desk instead of once for "the agent." A swarm broken into specialized
            desks — strategy, finance, growth — can continuously audit metrics, analyze funnels, and
            draft updates against the business plan entirely inside the loop. Auditing is
            perception. Drafting is a proposal. Nothing has left the building yet. The moment one of
            those desks wants to actually publish the update, or move money based on what finance
            found, the loop stops and a person picks it up. Same swarm, same models, two different
            categories of action running through it.
          </>
        }
      />

      <Beat
        prose={
          <>
            What makes a setup "production-grade" isn't a bigger loop or a less supervised one.
            It's a boundary that's drawn on purpose, before the fact, instead of discovered after
            something irreversible happens. Low-overhead runtimes at the edge and a context backend
            that lets an agent pick up where the last one left off are what let the loop run more
            of the reversible half without a human babysitting each step. They don't move the line
            between reversible and not. That line doesn't get more permissive just because the
            infrastructure around it got better.
          </>
        }
      />

      <Blockquote className="mt-4 max-w-[48ch]">
        "Autonomous" describes the loop. It says nothing about the leash — and the leash is the
        only part anyone should have to sign off on.
      </Blockquote>
    </div>
  )
}
