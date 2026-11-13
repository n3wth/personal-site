import { useMemo, useState } from 'react'
import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'
import { buildEdgePath } from '../kit/edgePath'

/* "Personal knowledge graph" — the argument is that a knowledge base stops
   being a passive archive once its links become something a second party
   (an AI agent) can query and audit. The one interaction is a small,
   illustrative graph — generic node types (Person, Project, Meeting,
   Concept, Decision, Infra), not real private data — that you click
   through to reveal direct connections, the same multi-hop traversal the
   essay argues a flat semantic index can't do. No stage numbers: this is
   an essay's argument, not a build pipeline. Drafted via Spiral from
   gbrain's personal-knowledge-management and knowledge-graphs pages. */

interface GraphNode {
  id: string
  label: string
  x: number
  y: number
}
interface GraphEdge {
  from: string
  to: string
}

const NODES: GraphNode[] = [
  { id: 'person', label: 'Person', x: 110, y: 70 },
  { id: 'project', label: 'Project', x: 340, y: 46 },
  { id: 'meeting', label: 'Meeting', x: 540, y: 110 },
  { id: 'concept', label: 'Concept', x: 300, y: 220 },
  { id: 'decision', label: 'Decision', x: 500, y: 236 },
  { id: 'infra', label: 'Infra', x: 100, y: 232 },
]

const EDGES: GraphEdge[] = [
  { from: 'person', to: 'project' },
  { from: 'person', to: 'meeting' },
  { from: 'project', to: 'meeting' },
  { from: 'project', to: 'concept' },
  { from: 'concept', to: 'decision' },
  { from: 'project', to: 'infra' },
]

function GraphExplorer() {
  const [selected, setSelected] = useState<string | null>(null)
  const byId = useMemo(() => new Map(NODES.map((n) => [n.id, n])), [])
  const neighbors = useMemo(() => {
    if (!selected) return new Set<string>()
    const s = new Set<string>()
    EDGES.forEach((e) => {
      if (e.from === selected) s.add(e.to)
      if (e.to === selected) s.add(e.from)
    })
    return s
  }, [selected])

  const selectedNode = selected ? byId.get(selected) : null
  const toggle = (id: string) => setSelected((cur) => (cur === id ? null : id))

  return (
    <div>
      <svg
        viewBox="0 0 640 280"
        className="h-64 w-full max-w-2xl"
        role="group"
        aria-label="A small illustrative knowledge graph of generic node types. Select a node to reveal its direct connections."
      >
        {EDGES.map((e, i) => {
          const a = byId.get(e.from)!
          const b = byId.get(e.to)!
          const touchesSelected = selected && (e.from === selected || e.to === selected)
          const dim = selected !== null && !touchesSelected
          return (
            <path
              key={`${e.from}-${e.to}-${i}`}
              d={buildEdgePath(a.x, a.y, b.x, b.y, i)}
              fill="none"
              stroke={touchesSelected ? 'var(--accent)' : 'var(--ink-dim)'}
              strokeWidth={touchesSelected ? 2 : 1.25}
              opacity={dim ? 0.25 : 1}
            />
          )
        })}
        {NODES.map((n) => {
          const isSelected = n.id === selected
          const isNeighbor = neighbors.has(n.id)
          const dim = selected !== null && !isSelected && !isNeighbor
          return (
            <g
              key={n.id}
              className="pkg-node"
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              aria-label={`${n.label} node${isSelected ? ', selected' : ''}`}
              onClick={() => toggle(n.id)}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault()
                  toggle(n.id)
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              {/* Invisible hit halo: the visible dot is r=6-9, ~12px on a
                  phone once the SVG scales down — far below a usable tap
                  target. r=48 lands ~44px at the smallest render width and
                  never overlaps a neighbor (closest pair is ~132 units). */}
              <circle className="pkg-hit" cx={n.x} cy={n.y} r={48} fill="transparent" />
              <circle
                cx={n.x}
                cy={n.y}
                r={isSelected ? 9 : isNeighbor ? 7 : 6}
                fill={isSelected ? 'var(--accent)' : isNeighbor ? 'var(--ink)' : 'var(--bg)'}
                stroke={dim ? 'var(--ink-faint)' : 'var(--ink)'}
                strokeWidth={1.5}
                opacity={dim ? 0.4 : 1}
              />
              <text
                x={n.x}
                y={n.y - 16}
                textAnchor="middle"
                fontSize={13}
                fontWeight={500}
                fill={dim ? 'var(--ink-faint)' : 'var(--ink)'}
                opacity={dim ? 0.5 : 1}
              >
                {n.label}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
        {selectedNode
          ? `${selectedNode.label} — its direct connections are highlighted. This is one hop; a flat search over the same notes would only tell you which pages sound similar.`
          : 'Generic node types standing in for a real graph — click one to see what it actually connects to.'}
      </p>
      <style>{`
        .pkg-node { outline: none; }
        .pkg-node:focus-visible circle:not(.pkg-hit) { stroke: var(--accent); stroke-width: 2.5; }
      `}</style>
    </div>
  )
}

export default function PersonalKnowledgeGraph() {
  return (
    <div>
      <p className="max-w-[62ch] text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink-dim)' }}>
        For most of recorded history, personal knowledge management meant a notebook or a folder
        tree. Tiago Forte's PARA method and Niklas Luhmann's Zettelkasten pushed back on hierarchy,
        arguing that notes should link to each other the way ideas actually relate: in webs, not
        trees. The insight is obvious in retrospect. The problem is that most tools claiming to
        support networked notes still treat linking as an afterthought, a cosmetic layer on top of
        a document store.
      </p>

      <Beat
        prose={
          <>
            My system splits across three backends by function. GBrain is the core: a Postgres
            database hosted on Supabase, git-synced, holding long-term structured knowledge across
            projects, meetings, people, and career history. A separate store handles small atomic
            facts — contacts, addresses, the kind of thing that changes infrequently and needs fast
            lookup. A third holds behavioral instructions for how my agents should act, not facts
            about the world. Each backend does one thing; none tries to do all three.
          </>
        }
      />

      <Beat
        prose={
          <>
            GBrain is a knowledge graph, not a collection of markdown files that happen to link to
            each other. Pages connect via wiki-links, forming explicit nodes and edges between
            people, projects, meetings, and infrastructure. The graph shape itself carries meaning.
            A meeting that links to three active projects and two people tells me something a
            folder called "Q3 meetings" cannot.
          </>
        }
      >
        <GraphExplorer />
      </Beat>

      <Beat
        prose={
          <>
            I enforce hygiene rules on it mechanically: no duplicate pages, and I track orphan
            metrics — pages with no incoming links. An orphaned page is a warning: something got
            written down but didn't connect to anything. Facts are also tracked bi-temporally,
            meaning the graph records when something was true, not just whether it's currently
            true. When a person's role changes, the old fact gets a time boundary; it doesn't
            disappear.
          </>
        }
      />

      <Beat
        prose={
          <>
            I publish a curated subset of this to my site as a digital garden. The deliberate
            choice is to expose structure, not just polished essays. A visitor can see how notes
            connect to each other. That's different from a blog, where each post stands alone. The
            structure is the content.
          </>
        }
      />

      <Beat
        prose={
          <>
            The more interesting consequence is what happens when an AI agent reads and writes to
            the graph. Vector search is good at "what sounds similar." It is bad at "what connects
            to what." An agent operating on a flat semantic index can surface relevant-sounding
            documents; it cannot traverse three hops to answer a question spanning a person, a
            project they worked on, and a meeting where a decision was made. An agent operating on
            GBrain can follow explicit links, detect orphaned pages mechanically, and catch
            contradictions across sessions that semantic search would miss. A flat index gets fuzzy
            under pressure. The graph holds the error.
          </>
        }
      />

      <Blockquote className="mt-4 max-w-[48ch]">
        The graph is not a nicer notebook. It is a system with a second party.
      </Blockquote>
    </div>
  )
}
