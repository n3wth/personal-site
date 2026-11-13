import { ToggleCompare } from '../thinking/kit/ToggleCompare'

/**
 * ToggleCompare, running, with the site's own layout argument as its
 * payload: the same three rows drawn as bordered cells and then as
 * hairline rails. Neither side nests anything that carries its own
 * — a hidden-until-observed element inside a keyed swap
 * flashes empty for a frame every time you press a button.
 */

const ROWS = [
  { name: 'Beat', note: 'layout' },
  { name: 'MarginNote', note: 'related note' },
  { name: 'ToggleCompare', note: 'two views' },
]

function Boxed() {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {ROWS.map((row) => (
        <li key={row.name} className="cell px-4 py-4">
          <p className="text-sm" style={{ color: 'var(--ink)' }}>
            {row.name}
          </p>
          <p className="mono mt-1">{row.note}</p>
        </li>
      ))}
    </ul>
  )
}

function Railed() {
  return (
    <ul>
      {ROWS.map((row) => (
        <li
          key={row.name}
          className="flex items-baseline justify-between gap-4 border-t py-3"
          style={{ borderColor: 'var(--rail)' }}
        >
          <span className="text-sm" style={{ color: 'var(--ink)' }}>
            {row.name}
          </span>
          <span className="mono">{row.note}</span>
        </li>
      ))}
    </ul>
  )
}

export default function DemoRails() {
  return (
    <div className="max-w-2xl">
      <ToggleCompare
        beforeLabel="Boxes"
        afterLabel="Rails"
        before={<Boxed />}
        after={<Railed />}
        caption="Switch between two layouts of the same three components."
      />
    </div>
  )
}
