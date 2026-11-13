import type { ReactNode } from 'react'

/**
 * One unit of the magazine layout every Thinking piece uses: prose plus
 * an optional margin note (side-by-side on desktop via grid-cols, stacked
 * footnote-style on mobile since there's no margin to put it in — each
 * Beat owns its own grid row so nothing needs JS position-matching), and
 * an optional specimen underneath that spans the full column, wider than
 * the prose measure, so the page opens up at each one instead of staying
 * boxed to text width.
 *
 * `stage` numbers double as the piece's spine — pass it only when the
 * beats are genuinely sequential (a real pipeline/build order); omit it
 * otherwise rather than forcing a fake sequence.
 *
 * No borderTop here: each piece now lives alone on its own route
 * (/thinking/:slug), so there's nothing beside a Beat to divide from —
 * vertical rhythm comes from the padding alone.
 */
export function Beat({
  stage,
  prose,
  margin,
  children,
}: {
  stage?: { n: string; label: string }
  prose: ReactNode
  margin?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="py-10">
      <div className={margin ? 'md:grid md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] md:gap-12' : 'mx-auto max-w-[62ch]'}>
        <div>
          {stage && (
            /* h2 so heading nav works inside long pieces; font-sans keeps
               the visual identical (headings otherwise inherit Suisse Intl). */
            <h2 className="font-sans text-xs uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>
              {stage.n} {stage.label}
            </h2>
          )}
          <p
            className={`max-w-[62ch] text-base leading-relaxed md:text-lg ${stage ? 'mt-3' : ''}`}
            style={{ color: 'var(--ink)' }}
          >
            {prose}
          </p>
        </div>
        {margin && <div className="mt-6 md:mt-0">{margin}</div>}
      </div>
      {children && <div className="mt-8">{children}</div>}
    </div>
  )
}
