import { useState } from 'react'
import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'

/* "Trust Is a Runtime Property" — the argument is that a policy ("harmful
   content never surfaces without review") is actually enforced by a
   latency number, not by the document that states the policy. The one
   interaction is a real, draggable latency slider: dragging the
   classifier's finish time past the chat window's 50ms budget flips the
   review path from synchronous to async in front of you, with no
   animation smoothing the transition — the flip should read as sudden,
   because that's the point. Plain SVG/CSS + native <input type="range">,
   no canvas. No stage numbers: this is an essay's argument, not a
   pipeline, so Beat is used without `stage`. */

const LATENCY_MIN = 30
const LATENCY_MAX = 90
const CHAT_BUDGET = 50
const DEFAULT_LATENCY = 42

function LatencySlider() {
  const [ms, setMs] = useState(DEFAULT_LATENCY)
  const pct = ((ms - LATENCY_MIN) / (LATENCY_MAX - LATENCY_MIN)) * 100
  const thresholdPct = ((CHAT_BUDGET - LATENCY_MIN) / (LATENCY_MAX - LATENCY_MIN)) * 100
  const sync = ms <= CHAT_BUDGET

  return (
    <div className="w-full max-w-xl">
      <div className="relative h-11">
        <div
          className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
          style={{ background: 'var(--rail)' }}
        />
        <div
          className="absolute top-1/2 h-px -translate-y-1/2"
          style={{ left: 0, width: `${pct}%`, background: 'var(--ink-dim)' }}
        />
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{ left: `${thresholdPct}%`, background: 'var(--rail-strong)' }}
          aria-hidden
        />
        <input
          type="range"
          min={LATENCY_MIN}
          max={LATENCY_MAX}
          step={1}
          value={ms}
          onChange={(e) => setMs(Number(e.target.value))}
          className="tp-slider absolute inset-0 w-full"
          aria-label="Classifier latency in milliseconds"
          aria-valuetext={`${ms} milliseconds, ${sync ? 'inside' : 'past'} the 50 millisecond chat budget`}
        />
      </div>

      <div className="mt-2 flex justify-between text-[11px]" style={{ color: 'var(--ink-faint)' }}>
        <span>{LATENCY_MIN}ms</span>
        <span style={{ position: 'relative', left: `${thresholdPct - 50}%` }}>50ms — chat window</span>
        <span>{LATENCY_MAX}ms</span>
      </div>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 font-mono">
        <span className="text-2xl" style={{ color: 'var(--ink)' }}>
          {ms}ms
        </span>
        <span className="text-sm" style={{ color: sync ? 'var(--ink)' : 'var(--ink-dim)' }}>
          {sync ? 'synchronous review' : 'async review — content shown before human sees it'}
        </span>
      </div>

      <style>{`
        .tp-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 100%;
          background: transparent;
          cursor: pointer;
        }
        .tp-slider::-webkit-slider-runnable-track {
          background: transparent;
          height: 100%;
        }
        .tp-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--bg);
          border: 1.5px solid var(--ink);
        }
        .tp-slider::-moz-range-track {
          background: transparent;
          height: 100%;
        }
        .tp-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--bg);
          border: 1.5px solid var(--ink);
        }
        .tp-slider:focus-visible::-webkit-slider-thumb {
          outline: 1.5px solid var(--rail-strong);
          outline-offset: 2px;
        }
        .tp-slider:focus-visible::-moz-range-thumb {
          outline: 1.5px solid var(--rail-strong);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

export default function TrustProduction() {
  return (
    <div>
      <p className="max-w-[62ch] text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink-dim)' }}>
        The trust question for AI systems gets asked at the wrong time. We ask it during design
        reviews, model evaluations, red-team sessions. By the time the system is live, the
        question feels settled. It isn't.
      </p>

      <Beat
        prose={
          <>
            I've been thinking about this through safety classifiers. The standard setup: every
            piece of user-generated content passes through a classifier before it surfaces, and
            if the classifier flags it, a human reviews. The logic is sound. The failure is
            runtime.
          </>
        }
      />

      <Beat
        prose={
          <>
            Chat has a 50ms latency budget. Feed has 200ms. Those numbers aren't arbitrary – they're
            the point at which a slow response stops feeling like a response and starts feeling
            broken. If the safety classifier runs inside that window, you get synchronous review.
            If it misses, you have two options: show the content anyway, or hold it for async
            review. Either way, you've changed your policy. Not in a document. At runtime.
          </>
        }
      />

      <Beat
        prose={
          <>
            I built a small demo to make this tradeoff concrete. Drag the slider left and the
            classifier finishes at 30ms, comfortably inside the chat window. Flagged content goes
            to synchronous review before anything surfaces. Drag it right and latency climbs past
            50ms. The classifier misses its window, and async review kicks in. Content that should
            have been held gets shown, or held content creates a noticeable delay. The policy you
            thought you had – the one that says harmful content never surfaces without review –
            isn't violated by a bad actor. It's violated by a slow P99.
          </>
        }
      >
        <LatencySlider />
      </Beat>

      <Beat
        prose={
          <>
            This matters because latency rarely gets treated as a policy variable. It gets treated
            as an infrastructure problem. Engineers optimize it, but the safety team didn't sign
            off on what happens when optimization fails. Nobody wrote down that a classifier
            running at 80ms during a traffic spike means async review, and nobody told the policy
            team that async review means some percentage of flagged content goes live before a
            human sees it. The gap between the policy as written and the policy as executed is a
            runtime property.
          </>
        }
      />

      <Beat
        prose={
          <>
            Working on cross-org AI model integration has made this gap harder to ignore. When
            model dependencies cross team boundaries, the latency budget gets sliced by each hop.
            A classifier that runs at 40ms in isolation runs at 70ms when it's waiting on an
            upstream embedding service. The trust assumptions from the design review don't survive
            contact with production topology.
          </>
        }
      />

      <Blockquote className="mt-4 max-w-[48ch]">
        The slider doesn't fix anything. It just makes the tradeoff visible, which is where any
        honest conversation about AI trust has to start.
      </Blockquote>
    </div>
  )
}
