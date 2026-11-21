import { lazy, Suspense, useState } from 'react'
import { useNear } from './viewport'
import { tiles } from './toolboxTiles'

const TeapotCanvas = lazy(() => import('./TeapotCanvas'))

/**
 * The one interactive in the piece that ignores scroll on purpose: the
 * Utah teapot (the one waiting by the homepage campfire) wearing the
 * site's real FLORA-generated tiles. Tapping a chip swaps material.map
 * — the same texture objects the night field mounts on logs, thylacine
 * skin, and the ground. Pointer-driven so the chapter about scroll can
 * point at it and say "and this one deliberately isn't".
 */

export function ToolboxDemo({ reduced }: { reduced: boolean }) {
  const [tile, setTile] = useState(tiles[0])
  const [wrapRef, near, visible] = useNear<HTMLDivElement>()

  return (
    <div>
      <div
        role="group"
        aria-label="Pick a texture tile for the teapot"
        className="inline-flex flex-wrap rounded-full p-0.5"
        style={{ border: '1px solid var(--rail)' }}
      >
        {tiles.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tile.key === t.key}
            onClick={() => setTile(t)}
            className="kit-toggle-btn min-h-11 rounded-full px-4 py-1.5 text-sm"
            style={{
              color: tile.key === t.key ? 'var(--accent-ink)' : 'var(--ink-dim)',
              background: tile.key === t.key ? 'var(--accent)' : 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div ref={wrapRef} className="mx-auto mt-8 w-full max-w-md" role="img" aria-label={`The Utah teapot wearing the ${tile.label}`}>
        <div className="aspect-square w-full">
          {near && (
            <Suspense fallback={null}><TeapotCanvas url={tile.url} reduced={reduced} visible={visible} /></Suspense>
          )}
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
        The teapot from the homepage campfire, wearing <span className="mono">{tile.url}</span>; on
        the night field, {tile.home}. One image doing color and bump at once; no PBR set, and it
        still reads as material. The teapot ships with no UV map, so this demo box-projects one on
        at load. 3D work is full of small fixes like that.
      </p>
    </div>
  )
}
