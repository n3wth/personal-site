import type { ReactNode } from 'react'
import { PageHeader } from '@n3wth/ui/site'
import { SectionStory, type SectionStoryKind } from './SectionStory'
import './sectionHero.css'

/**
 * Section header: a large display headline and an optional lede.
 * Pass as="h1" on a route's first section — every page needs a
 * top-level heading, not an outline that starts at h2.
 */
export function SectionHeader({
  title,
  lede,
  story,
  as: Heading = 'h2',
}: {
  title: ReactNode
  lede?: ReactNode
  story?: SectionStoryKind
  as?: 'h1' | 'h2'
}) {
  const header = (
    <PageHeader
      className={`site-content-gutter${Heading === 'h1' ? ' portfolio-section-hero' : ''}`}
      spacing={story ? 'compact' : 'default'}
      title={Heading === 'h1' ? <span className="portfolio-section-title">{title}</span> : title}
      description={story && lede ? <span className="portfolio-story-description">{lede}</span> : lede}
      level={Heading === 'h1' ? 1 : 2}
    />
  )

  if (!story) return header
  return (
    <div className="portfolio-story-hero">
      <SectionStory kind={story} />
      <Heading className="sr-only">{title}</Heading>
    </div>
  )
}
