import { useState } from 'react'
import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'

/* Grounded in a real map-of-content page from a personal knowledge base for
   a kids'-media venture (screen-free audio IP, no numbers, sparking
   curiosity) — one page linking out to four clusters of working documents.
   Names of individual mentors and partners are generalized to their role
   (mentor, partner, impact-investing contact) rather than reproduced, per
   the site's privacy rule; the cluster structure and document counts are
   real. No `stage` numbering — the four clusters are categorical, not a
   sequence, so Beat is used without it, matching AgentsOrgDesign.

   The one interaction is a hub-and-spoke graph of that exact structure,
   built as its own layout rather than reusing FlowDiagram (which is for
   linear pipelines only). Four category buttons sit outside the SVG and
   drive the highlight state — real HTML buttons for accessibility, not
   clickable SVG nodes — while the graph itself is presentational. */

interface Cluster {
  id: string
  label: string
  y: number
  leaves: string[]
}

const CLUSTERS: Cluster[] = [
  {
    id: 'strategy',
    label: 'Strategy & foundation',
    y: 60,
    leaves: ['Company foundation', 'Go-to-market & growth', 'Market & competitive intel', 'Accelerator application'],
  },
  {
    id: 'content',
    label: 'Content research',
    y: 170,
    leaves: [
      'Studying an established kids’ show',
      'Studying a second established kids’ show',
      'Applying a bestselling framework',
      'Launch newsletter copy',
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & outreach',
    y: 280,
    leaves: ['Crowdfunding / campaign plan', 'School outreach draft', 'Partner marketing meeting'],
  },
  {
    id: 'feedback',
    label: 'Feedback & partners',
    y: 380,
    leaves: ['Mentor feedback', 'Partner meeting notes', 'Impact-investor meeting'],
  },
]

const HUB = { x: 70, y: 220, label: 'Kroots' }
const CLUSTER_X = 330
const LEAF_X = 610
const LEAF_SPACING = 24

function leafPositions(cluster: Cluster) {
  const n = cluster.leaves.length
  return cluster.leaves.map((label, i) => ({
    label,
    x: LEAF_X,
    y: cluster.y + (i - (n - 1) / 2) * LEAF_SPACING,
  }))
}

function KrootsGraph() {
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const active = hovered ?? selected
  const activeCluster = active ? CLUSTERS.find((c) => c.id === active) : null

  return (
    <div>
      <div
        role="group"
        aria-label="Highlight a cluster of the map"
        className="flex flex-wrap gap-2"
        onMouseLeave={() => setHovered(null)}
      >
        {CLUSTERS.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={selected === c.id}
            aria-label={`${c.label}, ${c.leaves.length} documents`}
            onPointerEnter={(e) => {
              // Emulated hover from a tap sticks until focus moves — the
              // dismissing second tap would look like a dead click.
              if (e.pointerType !== 'touch') setHovered(c.id)
            }}
            onFocus={() => setHovered(c.id)}
            onBlur={() => setHovered(null)}
            onClick={() => {
              if (selected === c.id) {
                setSelected(null)
                setHovered(null)
              } else {
                setSelected(c.id)
              }
            }}
            className="kit-toggle-btn rounded-full px-3 py-1.5 text-xs"
            style={{
              border: '1px solid var(--rail)',
              color: active === c.id ? 'var(--accent-ink)' : 'var(--ink-dim)',
              background: active === c.id ? 'var(--accent)' : 'transparent',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-5 h-64 w-full max-w-3xl sm:h-72">
        <svg viewBox="0 0 1080 440" className="block h-full w-full" role="presentation" focusable="false">
          {CLUSTERS.map((c, ci) => {
            const dim = active !== null && active !== c.id
            return (
              <line
                key={`hub-${c.id}`}
                x1={HUB.x + 26}
                y1={HUB.y}
                x2={CLUSTER_X - 8}
                y2={c.y}
                pathLength={1}
                stroke={dim ? 'var(--rail)' : 'var(--rail-strong)'}
                strokeWidth={1}
                className="kit-line-draw"
                style={{ animationDelay: `${0.1 + ci * 0.1}s` }}
              />
            )
          })}
          {CLUSTERS.flatMap((c, ci) =>
            leafPositions(c).map((leaf, li) => {
              const dim = active !== null && active !== c.id
              return (
                <line
                  key={`${c.id}-${leaf.label}`}
                  x1={CLUSTER_X + 8}
                  y1={c.y}
                  x2={LEAF_X - 8}
                  y2={leaf.y}
                  pathLength={1}
                  stroke={dim ? 'var(--rail)' : 'var(--rail-strong)'}
                  strokeWidth={1}
                  className="kit-line-draw"
                  style={{ animationDelay: `${0.25 + ci * 0.1 + li * 0.04}s` }}
                />
              )
            })
          )}

          <g className="kit-node-in" style={{ '--kn-delay': '0.05s' } as React.CSSProperties}>
            <circle cx={HUB.x} cy={HUB.y} r={7} fill="var(--ink)" stroke="var(--rail-strong)" strokeWidth={1} />
            <text x={HUB.x} y={HUB.y - 16} textAnchor="middle" fontSize={13} fill="var(--ink)" style={{ fontFamily: 'var(--font-sans)' }}>
              {HUB.label}
            </text>
          </g>

          {CLUSTERS.map((c, ci) => {
            const isActive = active === c.id
            const dim = active !== null && !isActive
            return (
              <g key={c.id} className="kit-node-in" style={{ '--kn-delay': `${0.15 + ci * 0.1}s` } as React.CSSProperties}>
                <circle
                  cx={CLUSTER_X}
                  cy={c.y}
                  r={5.5}
                  fill={isActive ? 'var(--ink)' : 'var(--bg)'}
                  stroke={dim ? 'var(--rail)' : 'var(--rail-strong)'}
                  strokeWidth={1}
                />
                <text
                  x={CLUSTER_X}
                  y={c.y - 14}
                  textAnchor="middle"
                  fontSize={12.5}
                  fill={dim ? 'var(--ink-faint)' : 'var(--ink)'}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {c.label}
                </text>
              </g>
            )
          })}

          {CLUSTERS.flatMap((c, ci) =>
            leafPositions(c).map((leaf, li) => {
              const isActive = active === c.id
              const dim = active !== null && !isActive
              return (
                <g key={`${c.id}-leaf-${leaf.label}`} className="kit-node-in" style={{ '--kn-delay': `${0.3 + ci * 0.1 + li * 0.04}s` } as React.CSSProperties}>
                  <circle
                    cx={leaf.x}
                    cy={leaf.y}
                    r={3}
                    fill={dim ? 'var(--bg)' : 'var(--ink-dim)'}
                    stroke={dim ? 'var(--rail)' : 'var(--rail-strong)'}
                    strokeWidth={1}
                  />
                  <text
                    x={leaf.x + 12}
                    y={leaf.y + 4}
                    fontSize={11}
                    fill={dim ? 'var(--ink-faint)' : 'var(--ink-dim)'}
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {leaf.label}
                  </text>
                </g>
              )
            })
          )}
        </svg>
      </div>

      <div className="kit-specimen-swap mt-3 min-h-[2.5rem]" key={active ?? 'none'} aria-live="polite">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
          {activeCluster
            ? `${activeCluster.label} — ${activeCluster.leaves.length} documents, all one link from the hub.`
            : 'Hover or tap a cluster to trace it back to the hub.'}
        </p>
      </div>
    </div>
  )
}

export default function KrootsMap() {
  return (
    <div>
      <Beat
        prose={
          <>
            The page is called a map of content, and it looks like nothing: a title, a mission
            line, and four short lists of links. It is the closest thing my kids&rsquo;-media
            project has to an org chart. There is no team to chart. There is one person and a
            folder of notes that had to behave like a company anyway, so the map is standing in
            for departments that don&rsquo;t exist yet.
          </>
        }
      />

      <Beat
        prose={
          <>
            The first cluster is the one a founding team would usually split three ways: a
            foundation document that states what the company is for, a go-to-market strategy, a
            page of competitor and market research, and an application to a startup accelerator.
            Four different jobs, four documents, one person writing all of them in the same week.
            Nothing about the map hides that. It just lists the four links side by side and lets
            you notice.
          </>
        }
      />

      <Beat
        prose={
          <>
            The second cluster is where the map earns its name. It holds notes on two established
            kids&rsquo; properties, studied for structure rather than admired, plus a note applying
            a bestselling framework about how ideas spread, and then, one link away, the actual
            copy for a launch newsletter. Research and shipped material sit in the same cluster
            because they are the same activity. The map doesn&rsquo;t separate a research phase
            from a production phase &mdash; it never had one to separate.
          </>
        }
      >
        <KrootsGraph />
      </Beat>

      <Beat
        prose={
          <>
            The other two clusters are smaller and that&rsquo;s the point of looking at them.
            Marketing & outreach holds a campaign plan, a school-outreach draft, and one partner
            meeting. Feedback & partners holds notes from a mentor, a partner meeting, and an
            impact-investing conversation. Three links each, thinner than the first two clusters
            by a full document. A folder wouldn&rsquo;t show you that difference; scrolling past
            three files feels the same as scrolling past four. The graph shows the gap as a gap.
          </>
        }
      />

      <Beat
        prose={
          <>
            What the map is actually for isn&rsquo;t remembering where things are &mdash; a search
            box does that. It&rsquo;s seeing the shape of the work from above: which cluster is
            dense with real documents and which one is three thin links because I keep finding
            reasons to work on strategy instead of outreach. The map doesn&rsquo;t fix that
            imbalance. It just refuses to let it stay invisible.
          </>
        }
      />

      <Blockquote className="mt-4 max-w-[48ch]">
        A one-person company still needs an org chart. It just has to double as a map of notes,
        because there&rsquo;s no one else to hand the departments to.
      </Blockquote>
    </div>
  )
}
