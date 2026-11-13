import { useState } from 'react'
import { Beat } from '../kit/Beat'

/**
 * A cron-run timeline for the Mac Mini's Things-3 triage loop — the
 * "timeline scrubber" described in the essay itself, built as a real
 * first version rather than a mockup. One tick per fifteen-minute run
 * through a working day; filled ticks changed something, empty ticks
 * passed through unchanged. Tap (or hover, on desktop) a tick to see
 * what that run did, exactly the interaction the essay asks for.
 *
 * Data below is illustrative — a plausible day, not a real log capture —
 * and labeled as such rather than presented as a real export.
 */

interface Run {
  time: string
  changed: boolean
  caption: string
}

const RUNS: Run[] = [
  { time: '9:00', changed: false, caption: 'No change — task list matched last night’s priorities.' },
  { time: '9:15', changed: true, caption: 'Bumped a stale draft to today after two days idle.' },
  { time: '9:30', changed: false, caption: 'No change — nothing in the list moved.' },
  { time: '9:45', changed: false, caption: 'No change.' },
  { time: '10:00', changed: true, caption: 'Reordered the afternoon block after a calendar invite landed.' },
  { time: '10:15', changed: false, caption: 'No change.' },
  { time: '10:30', changed: false, caption: 'No change.' },
  { time: '10:45', changed: true, caption: 'Flagged a task waiting on someone else with no reply in 48 hours.' },
  { time: '11:00', changed: false, caption: 'No change.' },
  { time: '11:15', changed: false, caption: 'No change.' },
  { time: '11:30', changed: false, caption: 'No change — state already matched priorities.' },
  { time: '11:45', changed: true, caption: 'Split a vague task into two smaller, actionable ones.' },
  { time: '12:00', changed: false, caption: 'No change.' },
  { time: '12:15', changed: false, caption: 'No change.' },
  { time: '12:30', changed: true, caption: 'Deferred a low-priority task to next week.' },
  { time: '12:45', changed: false, caption: 'No change.' },
  { time: '13:00', changed: false, caption: 'No change.' },
  {
    time: '13:15',
    changed: true,
    caption: 'Applied a reply sent over iMessage: moved a follow-up above the deck.',
  },
  { time: '13:30', changed: false, caption: 'No change.' },
  { time: '13:45', changed: false, caption: 'No change.' },
  { time: '14:00', changed: false, caption: 'No change.' },
  { time: '14:15', changed: true, caption: 'Surfaced a task due tomorrow that had no tag on it.' },
  { time: '14:30', changed: false, caption: 'No change.' },
  { time: '14:45', changed: false, caption: 'No change — confirming the status quo.' },
  { time: '15:00', changed: true, caption: 'Reordered the list after a project got marked done.' },
  { time: '15:15', changed: false, caption: 'No change.' },
  { time: '15:30', changed: false, caption: 'No change.' },
  { time: '15:45', changed: false, caption: 'No change.' },
  { time: '16:00', changed: true, caption: 'Flagged three tasks that had sat idle for over a week.' },
  { time: '16:15', changed: false, caption: 'No change.' },
  { time: '16:30', changed: false, caption: 'No change.' },
  { time: '16:45', changed: false, caption: 'No change — day’s last run, nothing left to move.' },
]

function TimelineScrubber() {
  const [selected, setSelected] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const active = hovered ?? selected
  const run = active !== null ? RUNS[active] : null

  /* On phones each tick is ~7px wide — far too small to tap. Treat the
     whole strip as a scrubber for touch: a drag (or tap) resolves to the
     run under the finger. touch-pan-y keeps vertical page scrolling
     intact while horizontal drags scrub. */
  const scrubTo = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const i = Math.floor(((e.clientX - rect.left) / rect.width) * RUNS.length)
    setHovered(Math.min(RUNS.length - 1, Math.max(0, i)))
  }

  return (
    <div>
      <p className="font-mono text-xs" style={{ color: 'var(--ink-faint)' }}>
        illustrative day — cron every 15 min, 9:00 to 17:00
      </p>

      <div
        role="group"
        aria-label="Cron runs through the day, one tick per fifteen minutes"
        className="mt-4 flex touch-pan-y items-stretch gap-[3px]"
        onMouseLeave={() => setHovered(null)}
        onPointerDown={(e) => {
          if (e.pointerType === 'touch') scrubTo(e)
        }}
        onPointerMove={(e) => {
          if (e.pointerType === 'touch' && e.buttons > 0) scrubTo(e)
        }}
      >
        {RUNS.map((r, i) => {
          const isActive = active === i
          return (
            <button
              key={r.time}
              type="button"
              className="kit-node-in group relative flex-1"
              style={{ '--kn-delay': `${i * 0.015}s` } as React.CSSProperties}
              aria-pressed={selected === i}
              aria-label={`${r.time} — ${r.changed ? 'changed something' : 'passed through unchanged'}`}
              onPointerEnter={(e) => {
                // Emulated hover from a tap would stick until focus moves,
                // making the dismissing second tap look like a dead click.
                if (e.pointerType !== 'touch') setHovered(i)
              }}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              onClick={() => {
                if (selected === i) {
                  setSelected(null)
                  setHovered(null)
                } else {
                  setSelected(i)
                }
              }}
            >
              <span
                className="block h-9 w-full transition-transform duration-150"
                style={{
                  background: r.changed ? 'var(--ink)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--rail-strong)'}`,
                  transform: isActive ? 'scaleY(1.15)' : 'scaleY(1)',
                }}
              />
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex gap-5 font-mono text-[11px]" style={{ color: 'var(--ink-faint)' }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5" style={{ background: 'var(--ink)' }} />
          changed something
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5" style={{ border: '1px solid var(--rail-strong)' }} />
          passed through unchanged
        </span>
      </div>

      <div className="kit-specimen-swap mt-5 min-h-[3.5rem]" key={active ?? 'none'} aria-live="polite">
        {run ? (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
            <span className="font-mono text-xs" style={{ color: 'var(--ink-faint)' }}>
              {run.time}
            </span>{' '}
            — {run.caption}
          </p>
        ) : (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
            Hover or tap a tick to see what that run did.
          </p>
        )}
      </div>
    </div>
  )
}

export default function GtdMini() {
  return (
    <div>
      <Beat
        prose={
          <>
            The Mac Mini sits headless in a closet, running cron jobs every fifteen minutes. It
            doesn&rsquo;t ask for confirmation. It doesn&rsquo;t wait. Things 3 holds my task
            list; an LLM processes it; iMessage carries the results to my phone. The whole chain
            runs whether I&rsquo;m at my desk or not.
          </>
        }
      />

      <Beat
        prose={
          <>
            I built it because manually triaging a backlog of tasks is slow and repetitive in
            exactly the way computers are supposed to handle. The specific problem: Things 3 has
            no API, so anything that touches my task list has to go through AppleScript. The model
            reads the output, reasons about priority, and writes back. iMessage is the transport
            layer because it&rsquo;s always available and I already have it. Nothing clever there.
            It just works.
          </>
        }
      />

      <Beat
        prose={
          <>
            The cron schedule is fifteen minutes during working hours. A run takes a few seconds.
            The model reads the current task state, applies whatever context I&rsquo;ve given it
            about my priorities, and either reorders, flags, or passes through. Most runs change
            nothing. That&rsquo;s fine. The value is not in constant churn; it&rsquo;s in not
            having to remember to check.
          </>
        }
      />

      <Beat
        prose={
          <>
            I want to build a timeline scrubber for the day&rsquo;s runs next. The idea is
            simple: a local interface that lets me watch the entire day&rsquo;s automation tick
            past in real time, or step through it like a video with a scrub bar. Each cron run is
            a frame. I can see what the model saw at 9:15, what it did at 9:30, and whether the state
            at noon matched what I expected. Right now I read logs. Logs are fine. But watching
            the day compress into a short playback would tell me things logs don&rsquo;t: whether
            the system is actually making decisions or just confirming the status quo.
          </>
        }
      >
        <TimelineScrubber />
      </Beat>

      <Beat
        prose={
          <>
            The iMessage layer is more useful than it sounds. Most automation surfaces results
            through a web UI you have to remember to open. iMessage arrives. I read it, reply if I
            want to intervene, and move on. The reply goes back to the Mac Mini and can change
            what the next run does. That feedback loop is lightweight enough that I actually use
            it, which is the whole point.
          </>
        }
      />

      <Beat
        prose={
          <>
            <span className="block">
              The system isn&rsquo;t doing anything exotic. The model is reasoning about a list of
              text items with some context about my work and day. The intelligence, such as it
              is, comes from the model knowing what &ldquo;urgent&rdquo; means in relation to
              everything else on the list. I don&rsquo;t prompt-engineer elaborate frameworks. I
              describe my situation plainly and it handles the rest.
            </span>
            <span className="mt-4 block">
              What changes with an autonomous system is pressure. Nothing depends on me checking
              in. The list processes whether I touch it or not. Most days that means I spend ten
              minutes less on triage. Some days it means a task I&rsquo;d have forgotten surfaces
              before it matters. That&rsquo;s the return. Not transformation, just slightly less
              friction.
            </span>
          </>
        }
      />
    </div>
  )
}
