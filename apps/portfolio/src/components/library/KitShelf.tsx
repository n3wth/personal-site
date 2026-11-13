import { Fragment } from 'react'
import type { ComponentType } from 'react'
import { Shelf, CodeBlock } from './Shelf'
import { kitPrimitives } from '../../data/library'
import type { KitPrimitive } from '../../data/library'
import articleMeta from '../../data/article-index.json'
import DemoBeat from './DemoBeat'
import DemoRails from './DemoRails'
import DemoFlow from './DemoFlow'
import DemoField from './DemoField'

/**
 * The essay kit shelf: the only place these components are written
 * down, since the Thinking pieces just import them.
 *
 * Each row borrows the kit's own layout grammar — Beat's 7fr/3fr split,
 * prose in the wide column and the file path plus the "seen in" link in
 * the margin — so the page documenting the kit is laid out the way the
 * kit lays out everything else.
 *
 * Four small specimens render with the page. The material demo stays in
 * /thinking/night-field so this shelf does not load three.js and a .glb.
 */

const DEMOS: Record<NonNullable<KitPrimitive['demo']>, ComponentType> = {
  beat: DemoBeat,
  toggle: DemoRails,
  flow: DemoFlow,
  field: DemoField,
}

/** Real title for a "seen in" link, straight off the piece registry so it
 *  can't drift from what's actually published. */
function pieceTitle(slug: string) {
  return articleMeta.find(piece => piece.id === slug)?.title ?? slug
}

/**
 * A repo path with a break opportunity after every slash. The longest of
 * these is 52 characters and the margin column is about 345px at the
 * frame's full width, so some of them have to wrap; letting them wrap
 * after `kit/` instead of mid-identifier is the difference between a
 * second line and a stray `x`. overflowWrap stays on as the backstop so
 * an unbreakable segment can never push the page sideways.
 */
function SourcePath({ path }: { path: string }) {
  const segments = path.split('/')
  return (
    <p className="mono" style={{ overflowWrap: 'anywhere' }}>
      {segments.map((segment, i) => (
        <Fragment key={segment + i}>
          {segment}
          {i < segments.length - 1 && (
            <>
              /<wbr />
            </>
          )}
        </Fragment>
      ))}
    </p>
  )
}

function KitRow({ primitive }: { primitive: KitPrimitive }) {
  const Demo = primitive.demo ? DEMOS[primitive.demo] : null

  return (
    <li
      id={`kit-${primitive.id}`}
      className="scroll-mt-24 border-t pt-8 pb-2 md:pt-11"
      style={{ borderColor: 'var(--rail)' }}
    >
      <div>
        <div className="md:grid md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] md:gap-12">
          <div>
            <h3
              className="display text-xl md:text-2xl"
              style={{ lineHeight: 1.1 }}
            >
              {primitive.name}
            </h3>
            <p
              className="mt-3 max-w-[62ch] text-base leading-relaxed"
              style={{ color: 'var(--ink-dim)' }}
            >
              {primitive.blurb}
            </p>
          </div>

          <div className="mt-5 md:mt-1.5">
            <SourcePath path={primitive.source} />
            {primitive.usedIn && (
              <p className="mt-4 text-sm leading-snug" style={{ color: 'var(--ink-dim)' }}>
                Seen in{' '}
                <a href={`/thinking/${primitive.usedIn}`} className="link-underline">
                  {pieceTitle(primitive.usedIn)}
                </a>
              </p>
            )}
          </div>
        </div>

        <CodeBlock code={primitive.signature} className="mt-7 max-w-[52ch]" />
      </div>

      {/* Specimens render immediately; shared visuals own their motion. */}
      {Demo && (
        <div className="mt-10">
          <p className="index">Live</p>
          <div className="mt-5">
            <Demo />
          </div>
        </div>
      )}
    </li>
  )
}

export function KitShelf() {
  return (
    <Shelf
      id="kit"
      title="The essay kit"
      intro={
        <>
          Components used in the Thinking essays, with props, source links, and four live demos.
          The 3D material demo is in{' '}
          <a href="/thinking/night-field" className="link-underline">
            What the night field broke
          </a>
          .
        </>
      }
    >
      <ul className="mt-11 space-y-14 md:mt-14">
        {kitPrimitives.map((primitive) => (
          <KitRow key={primitive.id} primitive={primitive} />
        ))}
      </ul>
    </Shelf>
  )
}
