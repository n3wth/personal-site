import { Shelf, CodeBlock } from './Shelf'
import { uiTiers, uiHooks, uiQuickStart } from '../../data/library'
import uiMeta from '../../data/ui-meta.json'

/**
 * @n3wth/ui: install line, quick start, then the whole export surface as
 * a dense index rather than a wall of component cards. Component names are
 * code identifiers, so they're set in Geist Mono; the tier labels beside
 * them are not, so they're not.
 *
 * Version and install line come from src/data/ui-meta.json, a committed
 * snapshot refreshed by scripts/refresh-content.mjs (npm run
 * content:refresh), not fetched at build time; the totals are summed from
 * the tiers, so nothing on this shelf is a number typed by hand.
 */

function IndexRow({ label, count, items }: { label: string; count: number; items: string[] }) {
  return (
    <div
      className="border-t py-5 md:grid md:grid-cols-[minmax(0,8rem)_minmax(0,1fr)] md:gap-8"
      style={{ borderColor: 'var(--rail)' }}
    >
      <div className="flex items-baseline gap-2.5">
        <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
          {label}
        </span>
        <span className="mono">{count}</span>
      </div>
      {/* Each name carries its own anchor: the command palette lists all 36
          components individually and links to /library#ui-<name>, so without
          these the fragment resolves to nothing and the result just dumps you
          at the top of the page. scroll-mt-24 clears the fixed nav. */}
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 md:mt-0">
        {items.map((item) => (
          <li
            key={item}
            id={`ui-${item.toLowerCase()}`}
            className="scroll-mt-24 font-mono text-xs"
            style={{ color: 'var(--ink-dim)' }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function UiShelf() {
  return (
    <Shelf
      id="ui"
      title="@n3wth/ui"
      intro={
        <>
          An MIT-licensed React component library with theme tokens and a Tailwind preset.
          Peer dependencies: React 18 or 19, React DOM, and GSAP 3.12.
        </>
      }
    >
      <div className="mt-10">
        <CodeBlock code={uiMeta.install} className="max-w-[34ch]" />
        {/* 62ch, not 52: the import line is 55 characters and the block is
            border-box, so a tighter cap clips it behind a scrollbar on the
            one snippet people are most likely to copy. */}
        <CodeBlock code={uiQuickStart} className="mt-3 max-w-[62ch]" />
      </div>

      <div className="mt-12">
        <p className="index">Components and hooks</p>
        <div className="mt-5">
          {uiTiers.map((tier) => (
            <IndexRow
              key={tier.name}
              label={tier.name}
              count={tier.count}
              items={tier.components}
            />
          ))}
          <IndexRow label="Hooks" count={uiHooks.length} items={uiHooks} />
        </div>
      </div>

      <div className="mt-10 md:grid md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] md:gap-12">
        <p className="max-w-[62ch] text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
          This list follows the package exports. The documentation covers a smaller selection.
        </p>
        <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm md:mt-0">
          <a
            href="/projects/ui"
            className="link-underline"
          >
            Project page
          </a>
          <a
            href="https://github.com/n3wth/ui"
            target="_blank"
            rel="noreferrer"
            className="link-underline"
          >
            Source
          <span className="sr-only"> (opens in new tab)</span>
          </a>
        </p>
      </div>
    </Shelf>
  )
}
