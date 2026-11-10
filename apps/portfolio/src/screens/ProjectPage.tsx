import { withTheme } from '../components/withTheme'
import { CodeBlock } from '@n3wth/ui'
import { SiteSection, SiteHeading } from '@n3wth/ui/site'
import { projects } from '../data/content'
import { ProjectVisual } from '../components/ProjectVisual'

const details = {
  r3: {
    title: 'r3',
    question: 'Useful context beyond a single conversation',
    description: 'A local memory service for AI assistants. r3 combines semantic search, vector embeddings, and a knowledge graph behind an MCP interface so context can survive between sessions and tools.',
    install: 'npx @n3wth/r3',
    sections: [
      ['Memory that stays available', 'r3 stores memories locally and retrieves them by meaning. The same context can be used from desktop clients, command line tools, and custom MCP integrations.'],
      ['A graph underneath', 'Entities and relationships are extracted as memories are written, giving an assistant more than a flat list of matching text.'],
      ['Source and package', 'The website moved here; the open-source server and npm package remain in the r3 repository.'],
    ],
    docs: '/docs/r3/quickstart',
    source: 'https://github.com/n3wth/r3',
  },
  ui: {
    title: '@n3wth/ui',
    question: 'A common visual system for individual sites',
    description: 'A shared React theme and page system built on Astryx. The package brings typography, tokens, and page compositions together across the n3wth sites while each app owns its content and routes.',
    install: 'npm install @n3wth/ui',
    sections: [
      ['A clear boundary', 'Astryx supplies generic controls and their interaction behavior. UI owns the React integration, brand theme, fonts, and shared page structure. Applications own routing, data, and specialized interactions.'],
      ['One foundation across sites', 'The portfolio and related sites share color, type, spacing, navigation, and footer components. A shared package keeps those decisions together without making every page the same.'],
      ['Inspect and try it', 'The current implementation and package releases live in the n3wth monorepo. The documentation includes a working page example, native control APIs, and the shared layout components used on this site.'],
    ],
    docs: '/docs/ui/quickstart',
    source: 'https://github.com/n3wth/personal-site/tree/main/packages/ui',
  },
} as const

type ProjectSlug = keyof typeof details

function ProjectPage({ slug }: { slug: string }) {
  const detail = slug && slug in details ? details[slug as ProjectSlug] : undefined
  const project = projects.find(item => item.id === slug)

  if (!detail || !project) {
    return <div className="site-content-gutter py-24"><SiteHeading level={1}>Project not found</SiteHeading><a className="mt-6 inline-block underline" href="/projects">All projects</a></div>
  }

  return <>
    <header className="site-content-gutter project-detail">
      <div className="project-detail-hero">
        <div>
          <h1 className="project-detail-title">{detail.title}</h1>
          <p className="project-detail-purpose">{detail.question}</p>
          <p className="project-detail-description">{detail.description}</p>
          <div className="project-actions">
            <a href={detail.docs}>Documentation</a>
            <a href={detail.source} target="_blank" rel="noopener noreferrer">Source</a>
          </div>
        </div>
        <ProjectVisual slug={slug!} />
      </div>
    </header>
    <SiteSection className="site-content-gutter">
      <div className="project-detail-body">
        <div className="project-install">
          <SiteHeading level={2}>Install</SiteHeading>
          <CodeBlock code={detail.install} language="bash" size="sm" isWrapped showCopyButton />
        </div>
        <div className="project-detail-notes">
          {detail.sections.map(([heading, body]) => <article key={heading}><SiteHeading variant="item" level={2}>{heading}</SiteHeading><p>{body}</p></article>)}
        </div>
      </div>
    </SiteSection>
  </>
}

export default withTheme(ProjectPage)
