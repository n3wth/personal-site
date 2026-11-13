import { ecosystem } from '../../data/library'

/**
 * The closing strip: current projects and what each is for.
 *
 * A rail above each column, nothing around them. Four bordered cards here
 * would undo everything the rest of the page argues for.
 */
export function EcosystemStrip() {
  return (
    <section
      aria-labelledby="ecosystem-title"
      className="section-pad !py-0 mt-16 mb-20 md:mt-24 md:mb-28"
    >
      <div className="border-t pt-8 md:pt-11" style={{ borderColor: 'var(--rail)' }}>
        <h2
          id="ecosystem-title"
          className="display text-[clamp(1.35rem,2.3vw,1.95rem)]"
          style={{ letterSpacing: '-0.03em', lineHeight: 1.05 }}
        >
          Related projects
        </h2>

        <ul className="mt-10 grid list-none p-0 gap-x-10 gap-y-10 sm:grid-cols-3">
          {ecosystem.map((property) => {
            return (
              <li
                key={property.id}
                className="border-t pt-5"
                style={{ borderColor: 'var(--rail-strong)' }}
              >
                <h3 className="display text-lg" style={{ lineHeight: 1.1 }}>
                  <a href={property.href} className="link-underline">
                    {property.name}
                  </a>
                </h3>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
                  {property.purpose}
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
