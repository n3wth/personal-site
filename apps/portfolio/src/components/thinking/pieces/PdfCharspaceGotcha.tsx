import { useState } from 'react'
import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'

/* "The PDF Gotcha That Cost an Afternoon" — a single real bug from a
   reportlab-based document generator (recipes/editorial-pdf-charspace-gotcha).
   Symptom -> Cause -> Fix -> Verification is the actual order the bug was
   found and closed in, so Beat's stage numbers are honest here, not a
   forced sequence.

   The one interaction is a slider that reproduces the defect itself rather
   than describing it: it drives PDF's Tc (character spacing) operator on
   two rows at once, left-pinned rather than right-aligned, so increasing
   it pushes the *right* edge of a value past a fixed column rule — the
   same overshoot the recipe describes, not a cosmetic letter-spacing
   toggle. The itinerary example in the source note is abstracted to a
   generic table row; no real document content is reproduced. */

function CharSpaceSpecimen() {
  const [tc, setTc] = useState(0)
  const value = '482.15'
  const valueLen = value.length
  const colCh = 16
  const leftCh = colCh - valueLen
  const overshootPt = Math.round(tc * valueLen * 10) / 10
  const aligned = tc === 0

  return (
    <div className="w-full max-w-lg">
      <p className="font-mono text-xs" style={{ color: 'var(--ink-faint)' }}>
        illustrative row — not a real document, math is the real bug
      </p>

      <div className="mt-4 space-y-2 font-mono text-sm" style={{ color: 'var(--ink)' }}>
        <div className="flex items-baseline gap-3">
          <span className="w-20 shrink-0 text-xs" style={{ color: 'var(--ink-dim)' }}>
            date chip
          </span>
          <div className="relative flex-1" style={{ height: '1.4em' }}>
            <span className="absolute left-0 top-0 whitespace-nowrap" style={{ letterSpacing: `${tc}pt` }}>
              18 Jul
            </span>
          </div>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="w-20 shrink-0 text-xs" style={{ color: 'var(--ink-dim)' }}>
            row total
          </span>
          <div className="relative flex-1" style={{ height: '1.4em' }}>
            <span
              aria-hidden
              className="absolute top-[-4px] bottom-[-4px]"
              style={{ left: `${colCh}ch`, width: '1px', background: 'var(--rail-strong)' }}
            />
            <span
              className="absolute top-0 whitespace-nowrap"
              style={{ left: `${leftCh}ch`, letterSpacing: `${tc}pt` }}
            >
              {value}
            </span>
          </div>
        </div>
      </div>

      <div className="relative mt-6 h-11">
        <div
          className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
          style={{ background: 'var(--rail)' }}
        />
        <div
          className="absolute top-1/2 h-px -translate-y-1/2"
          style={{ left: 0, width: `${(tc / 1.2) * 100}%`, background: 'var(--ink-dim)' }}
        />
        <input
          type="range"
          min={0}
          max={1.2}
          step={0.1}
          value={tc}
          onChange={(e) => setTc(Number(e.target.value))}
          className="pc-slider absolute inset-0 w-full"
          aria-label="Leaked character spacing, Tc, in points per glyph"
          aria-valuetext={`${tc.toFixed(1)} points per glyph, ${aligned ? 'row total aligned to the rule' : `row total overshoots by about ${overshootPt}pt`}`}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 font-mono">
        <span className="text-2xl" style={{ color: 'var(--ink)' }}>
          Tc {tc.toFixed(1)}pt
        </span>
        <span className="text-sm" style={{ color: aligned ? 'var(--ink)' : 'var(--ink-dim)' }}>
          {aligned
            ? 'row total lands exactly on the rule'
            : `overshoots the rule by ≈${overshootPt}pt — leaked Tc × glyph count`}
        </span>
      </div>

      <style>{`
        .pc-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 100%;
          background: transparent;
          cursor: pointer;
        }
        .pc-slider::-webkit-slider-runnable-track {
          background: transparent;
          height: 100%;
        }
        .pc-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--bg);
          border: 1.5px solid var(--ink);
        }
        .pc-slider::-moz-range-track {
          background: transparent;
          height: 100%;
        }
        .pc-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--bg);
          border: 1.5px solid var(--ink);
        }
        .pc-slider:focus-visible::-webkit-slider-thumb {
          outline: 1.5px solid var(--rail-strong);
          outline-offset: 2px;
        }
        .pc-slider:focus-visible::-moz-range-thumb {
          outline: 1.5px solid var(--rail-strong);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

const STAGES = [
  { n: '01', label: 'Symptom' },
  { n: '02', label: 'Cause' },
  { n: '03', label: 'Fix' },
  { n: '04', label: 'Verification' },
]

export default function PdfCharspaceGotcha() {
  return (
    <div>
      <p className="max-w-[62ch] text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink-dim)' }}>
        A document generator built on reportlab started drawing right-aligned numbers past the
        end of their column, by exactly the amount you&rsquo;d expect from a bug that isn&rsquo;t
        in the math at all.
      </p>

      <Beat
        stage={STAGES[0]}
        prose={
          <>
            Right-aligned values in a table overshot the column&rsquo;s hairline rule by 10 to 25
            points, and the affected rows felt crowded. But only some rows: specifically, only the
            ones that followed a row with a letterspaced chip in it &mdash; a small label drawn
            with extra tracking between characters, the kind of thing you&rsquo;d use to make a
            date or code stand out. Rows without a chip above them aligned perfectly. The
            right-align call, <code className="font-mono text-[0.9em]">drawRightString</code>,
            looked correct on inspection. Nothing about its math had changed.
          </>
        }
      >
        <CharSpaceSpecimen />
      </Beat>

      <Beat
        stage={STAGES[1]}
        prose={
          <>
            PDF has an operator called Tc, character spacing, that a chip sets to widen the gaps
            between its own letters. The bug is that Tc is a graphics-state operator, not a
            property of the text object that set it. It survives past{' '}
            <code className="font-mono text-[0.9em]">ET</code>, the operator that&rsquo;s supposed
            to end a text block, and keeps applying to every text object drawn after it on the
            same page &mdash; including the row total two lines down. reportlab&rsquo;s{' '}
            <code className="font-mono text-[0.9em]">stringWidth</code>, the function that
            measures a string to compute where a right-aligned draw should start, has no idea any
            of this happened. It measures the string assuming zero spacing, so the start position
            it hands back is correct for a string that&rsquo;s about to render wider than that
            measurement says.
          </>
        }
      />

      <Beat
        stage={STAGES[2]}
        prose={
          <>
            The fix is one extra line, in the same text object that set the spacing, before it
            gets drawn:
            <br />
            <span className="mt-3 block font-mono text-sm" style={{ color: 'var(--ink-dim)' }}>
              t.setCharSpace(0.9)
              <br />
              t.textOut(label)
              <br />
              t.setCharSpace(0){'  '}
              <span style={{ color: 'var(--ink-faint)' }}># Tc survives ET — always reset</span>
              <br />
              c.drawText(t)
            </span>
            <span className="mt-3 block">
              Reset it before the object closes, not after &mdash; by the time you&rsquo;re back
              in the caller, the state has already leaked into whatever the next draw call does.
            </span>
          </>
        }
      />

      <Beat
        stage={STAGES[3]}
        prose={
          <>
            The habit that caught it wasn&rsquo;t reading the reportlab source, it was
            rasterizing. Render the page with pdftoppm, then measure the rightmost dark pixel in
            each row with numpy and compare it to the hairline&rsquo;s end column. Aligned rows
            land within a pixel or two, the rounding error you&rsquo;d expect from antialiasing.
            Anything wider than that is a real defect, not a visual quirk. Worth keeping alongside
            it: a guard in the row-drawing function that adds up{' '}
            <code className="font-mono text-[0.9em]">stringWidth</code> for the label, the gap,
            and the value, and raises before drawing if the sum exceeds the column&rsquo;s span.
            That one catches copy that&rsquo;s simply too long before a person notices it, which
            is a different failure than this one but sits in the same function.
          </>
        }
      />

      <Blockquote className="mt-4 max-w-[48ch]">
        The math was never wrong. An operator from two lines up was still switched on.
      </Blockquote>
    </div>
  )
}
