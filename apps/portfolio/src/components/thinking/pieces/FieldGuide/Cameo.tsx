import { lazy, Suspense } from 'react'
import { useNear } from './viewport'

const CameoCanvas = lazy(() => import('./CameoCanvas'))

/**
 * A small transparent canvas holding one real asset from /public/models,
 * lit with the homepage's night rig (weak ambient + key/fill points, no
 * HDRI). No frame, no card — the object sits straight on the page black,
 * slowly turning, the way LiveMaterialDemo mounts the rock. The canvas
 * itself only mounts once the wrapper is near the viewport.
 */

export function Cameo({
  url,
  label,
  fit = 1.8,
  tint,
  spin = 0.22,
  rotation,
  camera = [0, 0.4, 4.2],
  reduced,
  className = '',
}: {
  url: string
  /** Accessible one-line description of what the object is. */
  label: string
  fit?: number
  tint?: string
  spin?: number
  rotation?: [number, number, number]
  camera?: [number, number, number]
  reduced: boolean
  className?: string
}) {
  const [wrapRef, near, visible] = useNear<HTMLDivElement>()

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={label}
      className={`aspect-square w-full ${className}`}
    >
      {near && (
        <Suspense fallback={null}>
          <CameoCanvas camera={camera} visible={visible} url={url} fit={fit} tint={tint} spin={spin} reduced={reduced} rotation={rotation} />
        </Suspense>
      )}
    </div>
  )
}
