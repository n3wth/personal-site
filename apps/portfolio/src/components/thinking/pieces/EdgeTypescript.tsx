import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'
import { ToggleCompare } from '../kit/ToggleCompare'
import { FlowDiagram } from '../kit/FlowDiagram'
import type { FlowEdge, FlowNode } from '../kit/FlowDiagram'

const STAGES = [
  { n: '01', label: 'Isolate' },
  { n: '02', label: 'State' },
  { n: '03', label: 'Agents' },
]

/* Grounded in gbrain concepts/typescript-cloudflare-workers: V8 isolates
   instead of VMs/containers, sub-millisecond start, Durable Objects as
   stateful isolates with strongly-consistent in-memory storage, and the
   Cloudflare Agents SDK (Oliver's own project) as the concrete case for
   why this runtime is a plausible agent host. No KV/D1/origin-fallback
   specifics exist in the source, so the request-path map below only
   claims the three hops the source actually supports: isolate, Durable
   Object, model binding. */

const REQUEST_NODES: FlowNode[] = [
  { id: 'req', label: 'Request', x: 60, y: 120 },
  { id: 'isolate', label: 'V8 isolate (edge)', x: 320, y: 120, active: true },
  { id: 'object', label: 'Durable Object (state)', x: 600, y: 120 },
  { id: 'model', label: 'Model binding', x: 860, y: 120 },
  { id: 'res', label: 'Response', x: 1080, y: 120 },
]
const REQUEST_EDGES: FlowEdge[] = [
  { from: 'req', to: 'isolate' },
  { from: 'isolate', to: 'object' },
  { from: 'object', to: 'model' },
  { from: 'model', to: 'res' },
]

function RequestPulse({ nodes, width, height }: { nodes: FlowNode[]; width: number; height: number }) {
  const xs = nodes.map((n) => n.x).join(';')
  const ys = nodes.map((n) => n.y).join(';')
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
      role="presentation"
      focusable="false"
    >
      <circle r={6} fill="var(--ink)">
        <animate attributeName="cx" values={xs} dur="5s" calcMode="linear" repeatCount="indefinite" />
        <animate attributeName="cy" values={ys} dur="5s" calcMode="linear" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

function ColdStartSpecimen({ mode }: { mode: 'container' | 'isolate' }) {
  const bootWidth = mode === 'container' ? 190 : 6
  return (
    <svg viewBox="0 0 320 90" className="h-24 w-full max-w-sm" role="presentation" focusable="false">
      <line x1={10} y1={70} x2={310} y2={70} stroke="var(--rail)" strokeWidth={1} />
      <circle cx={10} cy={70} r={3} fill="var(--ink)" />
      <text x={10} y={54} fontSize={11} fill="var(--ink-dim)">
        request arrives
      </text>
      {mode === 'container' && (
        <>
          <rect x={10} y={30} width={bootWidth} height={14} fill="none" stroke="var(--rail-strong)" strokeWidth={1.5} />
          <text x={12} y={24} fontSize={10} fill="var(--ink-faint)">
            boot
          </text>
        </>
      )}
      <rect x={10 + bootWidth} y={30} width={310 - (10 + bootWidth)} height={14} fill="var(--ink)" />
      <text x={10 + bootWidth + 4} y={24} fontSize={10} fill="var(--ink-dim)">
        execute
      </text>
    </svg>
  )
}

export default function EdgeTypescript() {
  return (
    <div>
      <p className="max-w-[62ch] text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink-dim)' }}>
        A request to a Cloudflare Worker doesn't reach a server. It reaches a V8 isolate — the same
        sandboxing technology that keeps browser tabs apart from each other — spun up in under a
        millisecond, wherever on Cloudflare's network the request happened to land.
      </p>

      <Beat
        stage={STAGES[0]}
        prose={
          <>
            A traditional serverless function runs inside a virtual machine or a container, and
            both carry a boot cost: real time spent before your code executes for the first time.
            Workers skip that step. A V8 isolate isn't a small VM — it's the sandbox Chrome uses to
            keep one tab from touching another, and Cloudflare runs one per request instead of one
            per tab. There's no machine to boot and no container to schedule, so execution starts in
            under a millisecond, on whichever edge location the request actually reached.
          </>
        }
      >
        <ToggleCompare
          beforeLabel="container"
          afterLabel="isolate"
          before={<ColdStartSpecimen mode="container" />}
          after={<ColdStartSpecimen mode="isolate" />}
          caption="same request, same code — the boot bar is what a container pays every cold start and an isolate doesn't."
        />
      </Beat>

      <Beat
        prose={
          <>
            TypeScript's job here isn't stylistic. A Worker's binding surface — the other services,
            storage, and models it's wired to — is a contract that has to hold at every edge
            location it runs at, with no shell to attach a debugger to after the fact. Compile-time
            types catch a broken binding or a malformed API contract before it ships everywhere at
            once, which matters more on a runtime built to be distributed and stateless by default
            than it does on a single server you can just log into.
          </>
        }
      />

      <Beat
        stage={STAGES[1]}
        prose={
          <>
            Isolates are disposable by design, which is fine until a request needs to remember
            something — a WebSocket connection, a session, the current state of a coordination
            problem shared across users on different continents. Durable Objects are the answer:
            stateful V8 isolates with strongly consistent, in-memory storage, each one addressable
            by an ID that always routes back to the same instance. That's what makes real-time
            apps, WebSockets, and coordinating distributed state possible on a runtime whose default
            unit of compute has no memory of the last request.
          </>
        }
      />

      <Beat
        stage={STAGES[2]}
        prose={
          <>
            The same properties that make Workers cheap for stateless HTTP handlers make them
            plausible as an agent runtime. An isolate is lightweight and cheap enough that running
            thousands of distinct agent profiles — each one waking up only when a webhook or API
            call arrives — is a reasonable default instead of a scaling problem. That's the premise
            behind the Cloudflare Agents SDK: type-safe agents that run on Workers and get
            distributed database integrations, stateful coordination through Durable Objects, and
            native bindings to AI models, without a separate server sitting idle to keep warm.
          </>
        }
      />

      <Beat
        prose={
          <>
            Trace one request through that stack and the hops are always the same three: it lands
            on an isolate at the edge, the isolate reaches into a Durable Object for whatever state
            it needs to remember, it calls out to a model through a native binding, and the response
            leaves from the same edge location it arrived at. Nothing routes back to a home region
            in the middle.
          </>
        }
      >
        <div className="relative h-64 w-full max-w-3xl sm:h-72">
          <FlowDiagram nodes={REQUEST_NODES} edges={REQUEST_EDGES} width={1140} height={240} />
          <RequestPulse nodes={REQUEST_NODES} width={1140} height={240} />
        </div>
      </Beat>

      <Blockquote className="mt-4 max-w-[48ch]">
        A V8 isolate isn't a fast server. It's a unit of compute cheap enough to hand one to every
        agent that needs one.
      </Blockquote>
    </div>
  )
}
