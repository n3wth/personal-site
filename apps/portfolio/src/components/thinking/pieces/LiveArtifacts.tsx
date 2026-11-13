import { useState } from 'react'
import type { ReactNode } from 'react'
import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'

/* "Live Artifacts" — the argument is that "live AI-generated artifact" names
   three genuinely different architectures (sandboxed page + versioned link,
   full in-browser dev environment, production component code), and they
   trade control against containment on purpose. Prose drafted via Spiral
   from gbrain's concepts/live-ai-artifacts-architecture note, in Oliver's
   voice — no AI-brand names anywhere, per site policy, including in this
   comment.

   The one interaction is a real editable-text-in, live-render-out pair,
   plus a "publish" affordance that bumps a version counter against a
   fixed label — durable, editable, live, demonstrated rather than
   described, and it sits inside the Beat that argues for exactly that
   pattern (the sandboxed-page one, which this site's own Thinking pieces
   use). No markdown library: a small hand-rolled inline parser for
   **bold**, *italic*, `code`, and leading "# " headings, so nothing here
   touches dangerouslySetInnerHTML. */

function renderInline(line: string, keyPrefix: string): ReactNode[] {
  const tokens: ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let lastIndex = 0
  let i = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(line))) {
    if (match.index > lastIndex) {
      tokens.push(<span key={`${keyPrefix}-t${i++}`}>{line.slice(lastIndex, match.index)}</span>)
    }
    const tok = match[0]
    if (tok.startsWith('**')) {
      tokens.push(
        <strong key={`${keyPrefix}-b${i++}`} style={{ fontWeight: 600, color: 'var(--ink)' }}>
          {tok.slice(2, -2)}
        </strong>
      )
    } else if (tok.startsWith('`')) {
      tokens.push(
        <code key={`${keyPrefix}-c${i++}`} className="font-mono text-[0.9em]" style={{ color: 'var(--ink)' }}>
          {tok.slice(1, -1)}
        </code>
      )
    } else {
      tokens.push(
        <em key={`${keyPrefix}-i${i++}`} style={{ color: 'var(--ink)' }}>
          {tok.slice(1, -1)}
        </em>
      )
    }
    lastIndex = match.index + tok.length
  }
  if (lastIndex < line.length) {
    tokens.push(<span key={`${keyPrefix}-tail`}>{line.slice(lastIndex)}</span>)
  }
  return tokens
}

function LivePreview({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="min-h-[9rem] text-sm leading-relaxed md:text-base">
      {lines.map((line, idx) => {
        const key = `line-${idx}`
        if (line.startsWith('# ')) {
          return (
            <p key={key} className="mb-2 text-lg font-semibold md:text-xl" style={{ color: 'var(--ink)' }}>
              {renderInline(line.slice(2), key)}
            </p>
          )
        }
        if (line.trim() === '') {
          return <div key={key} className="h-3" aria-hidden />
        }
        return (
          <p key={key} className="mb-2" style={{ color: 'var(--ink-dim)' }}>
            {renderInline(line, key)}
          </p>
        )
      })}
    </div>
  )
}

const DEFAULT_TEXT = `# This paragraph is the artifact

Edit the text on the left. It **re-renders immediately** on the right — no refresh, no round trip to a server.

That loop is the whole trick behind every piece in this section. They're artifacts too.`

function LiveEditorSpecimen() {
  const [text, setText] = useState(DEFAULT_TEXT)
  const [version, setVersion] = useState(1)

  return (
    <div className="w-full max-w-3xl">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-xs" style={{ color: 'var(--ink-faint)' }}>
            edit
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            spellCheck={false}
            className="w-full resize-none bg-transparent font-mono text-sm leading-relaxed outline-none"
            style={{ color: 'var(--ink)', border: '1px solid var(--rail-strong)', padding: '0.75rem' }}
            aria-label="Editable source text for the live artifact demo"
          />
        </div>
        <div>
          <p className="mb-2 font-mono text-xs" style={{ color: 'var(--ink-faint)' }}>
            rendered — live
          </p>
          <div style={{ borderLeft: '1px solid var(--rail)', paddingLeft: '0.75rem' }} aria-live="polite">
            <LivePreview text={text} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-baseline gap-3">
        <button
          type="button"
          onClick={() => setVersion((v) => v + 1)}
          className="kit-toggle-btn px-4 py-1.5 text-sm"
          style={{ border: '1px solid var(--rail-strong)', color: 'var(--ink)', background: 'transparent' }}
        >
          Publish
        </button>
        <span className="font-mono text-sm" style={{ color: 'var(--ink-dim)' }}>
          v{version} · same link
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
        nothing here touches a server — the state lives in this tab, and a refresh reverts it. Publish
        doesn't write anywhere either; it just bumps the number, the way a real version bumps against a
        link that never changes.
      </p>
    </div>
  )
}

export default function LiveArtifacts() {
  return (
    <div>
      <p className="max-w-[62ch] text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink-dim)' }}>
        &ldquo;Live artifact&rdquo; names three different things. The term gets used for a rendered
        sandbox inside a chat interface, for a full development environment running in a browser tab,
        and for production-grade component code that deploys to a real host. These share a surface
        feature: the output renders rather than displaying as text. The underlying architectures are
        genuinely different, and they trade off different things.
      </p>

      <Beat
        prose={
          <>
            The first pattern: an AI chat platform renders generated HTML, React, or markdown inside a
            sandboxed frame, assembled from the model&apos;s full context — the codebase, connected
            tools, the conversation thread. When you iterate, the platform republishes in place.
            Durability here comes from &ldquo;publish again, same link, new version.&rdquo; The link is
            stable because the URL is versioned, not because a new one is minted each time. Call this
            the sandboxed-page pattern.
          </>
        }
      >
        <LiveEditorSpecimen />
      </Beat>

      <Beat
        prose={
          <>
            The second pattern runs a full Node.js environment compiled to WebAssembly, entirely inside
            the browser tab. No remote VM, no server-side execution. A virtual filesystem, a virtualized
            network stack, an install step that actually works, a terminal, a real dev server — all
            client-side. This is the approach behind tools built on WebContainers. A model operating
            here controls an entire environment, not just a rendered output. That&apos;s a meaningful
            difference, not a cosmetic one.
          </>
        }
      />

      <Beat
        prose={
          <>
            The third is generative UI: real React, Tailwind, and component-library code, iteratively
            edited inside the platform, optimized for production-realistic reuse rather than a sandboxed
            preview or a full in-browser OS. The artifact here is closer to a deployable component than
            a live demo. The point isn&apos;t the preview. It&apos;s the code that ships.
          </>
        }
      />

      <Beat
        prose={
          <>
            The three patterns diverge on security, and the divergence is intentional. OS-level
            sandboxing — Linux bubblewrap, macOS Seatbelt — wraps every subprocess a coding agent
            spawns, combining filesystem and network isolation into one boundary, which in practice cuts
            permission prompts dramatically. A microVM-per-execution model, purpose-built for AI-agent
            and code-generation workloads, assumes process isolation can&apos;t be taken for granted and
            gives each run its own machine instead. The plain web-platform CSP and iframe sandbox
            directive, underlying most live-preview-in-an-iframe tools, disables scripts, forms, and
            popups by default and re-enables them token by token.
          </>
        }
      />

      <Beat
        prose={
          <>
            The design decision underneath all of this is how much control you hand the model versus
            how contained the blast radius is if it&apos;s wrong. A full in-browser OS gives the most
            control and the least containment. A CSP iframe gives the least control and the most
            containment. The sandboxed-page pattern sits in the middle, and that middle position is
            intentional. It&apos;s the same tradeoff every piece in this Thinking section is quietly
            making — they&apos;re artifacts too, durable at a stable link, editable, live, running inside
            exactly this kind of sandbox.
          </>
        }
      />

      <Blockquote className="mt-4 max-w-[48ch]">
        I picked the control-versus-containment balance the same way anyone does — by deciding how much
        I trust the model, and how much I&apos;d rather not find out.
      </Blockquote>
    </div>
  )
}
