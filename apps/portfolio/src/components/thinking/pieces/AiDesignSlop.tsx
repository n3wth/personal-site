import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'
import { ToggleCompare } from '../kit/ToggleCompare'

/* Not a pipeline, so no `stage` numbers — the four countermeasures in the
   source research are parallel practices, not sequential steps, so a
   FlowDiagram would fake an order that isn't there. The one specimen is a
   real illustration of the token-discipline countermeasure: hardcoded,
   drifting swatches versus a locked semantic-token rail with a lint check.
   No MarginNote — the one garden note that would fit this topic (the
   shadcn/Astryx design-system note) is already used in NightField, and
   nothing else in the garden is a close enough match to force in here. */

function TokenSpecimen({ locked }: { locked: boolean }) {
  const jitter = [0, 16, -10, 7]
  const labels = locked
    ? ['surface.raised', 'surface.accent', 'ink.dim', 'rail.strong']
    : ['raw-a', 'raw-b', 'raw-c', 'raw-d']

  return (
    <svg viewBox="0 0 300 150" className="h-40 w-full max-w-sm" role="presentation" focusable="false">
      <line
        x1={20}
        y1={110}
        x2={280}
        y2={110}
        stroke={locked ? 'var(--rail-strong)' : 'var(--rail)'}
        strokeWidth={1}
        strokeDasharray={locked ? undefined : '2 5'}
      />
      {labels.map((label, i) => {
        const x = 45 + i * 70
        const y = locked ? 110 : 110 - jitter[i]
        return (
          <g key={label}>
            <circle cx={x} cy={y} r={4} fill={locked ? 'var(--ink)' : 'var(--ink-faint)'} />
            <text
              x={x}
              y={y - 12}
              textAnchor="middle"
              fontSize={10}
              fill={locked ? 'var(--ink-dim)' : 'var(--ink-faint)'}
            >
              {label}
            </text>
          </g>
        )
      })}
      {locked && (
        <text x={260} y={26} textAnchor="middle" fontSize={13} fill="var(--accent)">
          ✓
        </text>
      )}
    </svg>
  )
}

export default function AiDesignSlop() {
  return (
    <div>
      <p className="max-w-[62ch] text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink-dim)' }}>
        Every AI-generated UI I see lately looks roughly the same: a particular sans-serif,
        purple-to-blue gradient cards, a centered icon grid, a low-contrast dark mode. One AI lab
        has a name for this: distributional convergence. Without explicit steering, a generative
        model samples from the safest, highest-probability region of its training distribution —
        the average of everything it has ever seen.
      </p>

      <Beat
        prose={
          <>
            I ran into this building hop, my flights side project, and while building this site.
            You prompt, you get something coherent, and then you notice it looks like everything
            else on the internet right now.
          </>
        }
      />

      <Beat
        prose={
          <>
            The scale of it is clearer with numbers. An analysis of 1,590 Show HN vibe-coded
            submissions found 22 percent showed heavy slop, four or more recognizable patterns
            stacked together, 32 percent mild slop, 46 percent clean. More than half of publicly
            shipped projects lean on the same handful of defaults. No single fix solves it. The
            countermeasures that actually move the needle share one property: they're structural,
            not a better prompt.
          </>
        }
      />

      <Beat
        prose={
          <>
            The most reliable lever is grounding generation in a real component library instead of
            letting the model synthesize freely. In hop I run a /design-sync step that pulls a set
            of locked primitives into the generation context before anything gets built, so the
            model has no route into generic territory to begin with. The same approach works with
            a known library like shadcn/ui, or a Figma- or Storybook-ingested one. The constraint
            has to be external and enforced, not requested.
          </>
        }
      />

      <Beat
        prose={
          <>
            Token discipline helps almost as much. Hand a model raw hex values and it hardcodes
            them, and drift follows within a few generations. The fix is a tiered vocabulary: raw
            color primitives stay hidden from the model entirely, semantic tokens become its actual
            working vocabulary, component tokens sit on top of those. Pair that with deterministic
            linting — not another model — to catch drift the moment it happens rather than three
            components later.
          </>
        }
      >
        <ToggleCompare
          beforeLabel="raw values"
          afterLabel="locked tokens"
          before={<TokenSpecimen locked={false} />}
          after={<TokenSpecimen locked />}
          caption="the model that sees hex codes hardcodes them; the model that only ever sees semantic tokens can't drift, and a lint pass catches it if it tries."
        />
      </Beat>

      <Beat
        prose={
          <>
            The third countermeasure is forcing an aesthetic-direction decision before generation
            starts, grounded in the brief's own subject matter rather than a default. Brainstorm
            the full system first, then review it against the brief specifically for what makes it
            distinct. Restraint is explicit guidance here, not an afterthought: concentrate the
            boldness in one place and keep the rest disciplined.
          </>
        }
      />

      <Beat
        prose={
          <>
            On AI-judged design quality, I treat it as an open problem rather than a shortcut. A
            model's critique correlates weakly with human judgment — Spearman 0.194, against 0.556
            for human critiques. Even trained designers often disagree with each other on which of
            two AI designs is better; Krippendorff's alpha lands at 0.248 on that question. What
            actually produces stronger results is fine-tuning on rich human feedback, sketches and
            direct revisions, where designers agreed 76 percent of the time, well ahead of ranking
            feedback or automated judge loops. The fixes are partial, annoying to maintain, and the
            evaluation problem stays genuinely unsolved.
          </>
        }
      />

      <Blockquote className="mt-4 max-w-[48ch]">
        The leverage is in constraints and process: grounding, token discipline, explicit
        restraint, skepticism toward automated evaluation. Everything else is hoping.
      </Blockquote>
    </div>
  )
}
