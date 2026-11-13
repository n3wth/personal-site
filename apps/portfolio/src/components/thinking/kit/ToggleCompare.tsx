import { useId, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Broken/fixed or before/after, over any content. A real toggle (buttons,
 * not hover) so it works on touch and keyboard. No crossfade animation —
 * the point of these specimens is the visible difference between two
 * states, not a transition between them.
 */

export interface ToggleCompareProps {
  beforeLabel: string
  afterLabel: string
  before: ReactNode
  after: ReactNode
  caption?: ReactNode
}

export function ToggleCompare({ beforeLabel, afterLabel, before, after, caption }: ToggleCompareProps) {
  const [showAfter, setShowAfter] = useState(false)
  const groupId = useId()

  return (
    <div>
      <div
        role="group"
        aria-label={`${beforeLabel} or ${afterLabel}`}
        className="inline-flex rounded-full p-0.5"
        style={{ border: '1px solid var(--rail)' }}
      >
        {[
          { label: beforeLabel, active: !showAfter },
          { label: afterLabel, active: showAfter },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            id={`${groupId}-${opt.label}`}
            aria-pressed={opt.active}
            onClick={() => setShowAfter(opt.label === afterLabel)}
            className="kit-toggle-btn rounded-full px-4 py-1.5 text-sm"
            style={{
              color: opt.active ? 'var(--accent-ink)' : 'var(--ink-dim)',
              background: opt.active ? 'var(--accent)' : 'transparent',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="kit-specimen-swap mt-6" aria-live="polite" key={showAfter ? 'after' : 'before'}>
        {showAfter ? after : before}
      </div>
      {caption && (
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
          {caption}
        </p>
      )}
    </div>
  )
}
