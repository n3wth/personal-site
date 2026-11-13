/**
 * A sidenote pointing out to a Thinking note — the connector is a
 * small organic stem-and-leaf line, the same base/mid/tip + leaf-offshoot
 * construction as the night field's GardenPatch (src/components/NightField.tsx),
 * just flattened to 2D. On desktop it sits in the margin beside the
 * paragraph that earned it (see PieceLayout's two-column grid); on mobile
 * there's no margin to put it in, so it drops inline below the paragraph,
 * footnote-style. No card, no border — just the branch and the words.
 *
 * Use only when a real garden note is actually relevant. Skip it rather
 * than force a connection that isn't there.
 */

export interface MarginNoteProps {
  href: string
  title: string
  description?: string
}

export function MarginNote({ href, title, description }: MarginNoteProps) {
  return (
    <aside className="kit-margin-note mt-8 md:mt-0">
      <svg
        viewBox="0 0 48 32"
        className="kit-line-draw mb-2 h-6 w-12"
        role="presentation"
        focusable="false"
      >
        <path
          d="M 0 28 C 10 26, 14 22, 18 14 C 20 9, 24 6, 30 5"
          pathLength={1}
          fill="none"
          stroke="var(--rail-strong)"
          strokeWidth={1}
        />
        <path
          d="M 16 17 C 20 15, 24 16, 27 20"
          pathLength={1}
          fill="none"
          stroke="var(--rail-strong)"
          strokeWidth={1}
          style={{ animationDelay: '0.15s' }}
          className="kit-line-draw"
        />
      </svg>
      <a
        href={href}
        className="link-underline block max-w-[26ch]"
      >
        <p className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>
          From the garden
        </p>
        <p className="mt-1 text-sm font-medium leading-snug" style={{ color: 'var(--ink)' }}>
          {title}
        </p>
        {description && (
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
            {description}
          </p>
        )}
      </a>
    </aside>
  )
}
