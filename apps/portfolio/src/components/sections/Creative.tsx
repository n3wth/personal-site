import { Fragment } from 'react'
import { SectionHeader } from '../Frame'
import './art.css'
import {
  installations,
  sections,
  type CreditLink,
  type Installation,
} from '../../data/content'

function sentenceCase(type: string) {
  if (type === 'burning-man') return 'Burning Man'
  const label = type.replace(/-/g, ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const [opener, ...works] = installations

/* Institutions named in a credit line become inline links at the credit's
   own type size. Each link's text has to appear verbatim in the tagline; a
   miss leaves that phrase as plain text rather than dropping the credit. */
function taglineParts(inst: Installation) {
  let parts: (string | CreditLink)[] = [inst.tagline]

  for (const link of inst.creditLinks ?? []) {
    parts = parts.flatMap((part) => {
      if (typeof part !== 'string') return [part]
      const at = part.indexOf(link.text)
      if (at === -1) return [part]
      return [part.slice(0, at), link, part.slice(at + link.text.length)]
    })
  }

  return parts.filter((part) => part !== '')
}

/* Title, provenance, and credits form one caption beside the same edge. */
const railClass = 'art-caption'

function WorkCredit({ inst }: { inst: Installation }) {
  return (
    <>
      <div className="min-w-0">
        <h2
          className="display text-2xl md:text-3xl mb-2"
          style={{ letterSpacing: '-0.02em' }}
        >
          {inst.title}
        </h2>
        <p className="meta m-0 mb-3">
          <span>{inst.year}</span>
          <span className="mx-2" style={{ color: 'var(--ink-faint)' }}>·</span>
          {inst.location}
          <span className="mx-2" style={{ color: 'var(--ink-faint)' }}>·</span>
          {sentenceCase(inst.type)}
        </p>
        <p
          className="text-sm leading-relaxed m-0"
          style={{ color: 'var(--ink-dim)', maxWidth: '72ch', textWrap: 'balance' }}
        >
          {taglineParts(inst).map((part, i) =>
            typeof part === 'string' ? (
              <Fragment key={i}>{part}</Fragment>
            ) : (
              <a
                key={i}
                href={part.href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline"
              >
                {part.text}
              </a>
            )
          )}
        </p>
      </div>
    </>
  )
}

export function Creative() {
  return (
    <section aria-label="Art" className="art-exhibition">
      <SectionHeader as="h1" story="art" title={sections.art.name} lede={sections.art.description} />
      <figure id={opener.id} className="art-opening m-0">
        <div className="art-opening-scene">
          <div className="art-opening-image">
            <img
              src={opener.image}
              srcSet={`${opener.image.replace('.webp', '-800.webp')} 800w, ${opener.image.replace('.webp', '-1200.webp')} 1200w, ${opener.image} 2000w`}
              sizes="(max-width: 767px) max(100vw, 91svh), max(100vw, 114svh)"
              width={2000}
              height={1500}
              alt={opener.imageAlt}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
        <figcaption className={railClass}>
          <WorkCredit inst={opener} />
        </figcaption>
      </figure>
      <div className="art-works">
        {works.map((inst) => (
          <figure id={inst.id} key={inst.id} className="art-work m-0 scroll-mt-20">
            <div className="art-work-image">
              <img
                src={inst.image}
                alt={inst.imageAlt}
                loading="lazy"
                decoding="async"
              />
            </div>
            <figcaption className={railClass}>
              <WorkCredit inst={inst} />
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
