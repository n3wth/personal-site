import { withTheme } from '../components/withTheme'
import { CodeBlock } from '@n3wth/ui'
import { SiteSection, SiteHeading } from '@n3wth/ui/site'
import { projects } from '../data/content'
import { ProjectVisual } from '../components/ProjectVisual'
import { ElephantGoldfishExplanation } from '../components/ElephantGoldfishExplanation'

const details = {
  'elephant-goldfish': {
    title: 'elephant-goldfish',
    question: 'Check your assumptions before you ship.',
    description: 'An assistant reviewing its own work already knows why each choice seemed right. elephant-goldfish brings a fresh reviewer into Codex to question a design, investigate a bug, or inspect a change. It reviews the evidence without inheriting the working conversation.',
    install: 'Review my staged changes with elephant-goldfish.\nReport findings without editing files.',
    sections: [
      ['Before you build', 'Challenge an idea, clarify the requirements, and find unanswered questions in a design before committing to an approach.'],
      ['When a bug resists a fix', 'Give a fresh reviewer the symptoms and reproduction. Compare its diagnosis with yours before making another change.'],
      ['Before you commit', 'Review the exact change you intend to ship. Get findings tied to evidence, with a clear account of what was checked.'],
    ],
    docs: '/docs/elephant-goldfish/quickstart',
    source: '/downloads/elephant-goldfish-0.1.0.zip',
  },
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
            <a href={detail.source} target="_blank" rel="noopener noreferrer">{slug === 'elephant-goldfish' ? 'Download 0.1.0 source' : 'Source'}</a>
          </div>
        </div>
        <ProjectVisual slug={slug!} />
      </div>
    </header>
    <SiteSection className="site-content-gutter">
      <div className="project-detail-body">
        {slug === 'elephant-goldfish' && <div className="project-detail-notes">
          {detail.sections.map(([heading, body]) => <article key={heading}><SiteHeading variant="item" level={2}>{heading}</SiteHeading><p>{body}</p></article>)}
        </div>}
        {slug === 'elephant-goldfish' && <ElephantGoldfishExplanation />}
        <div className="project-install">
          <SiteHeading level={2}>{slug === 'elephant-goldfish' ? 'Try it on your next change' : 'Install'}</SiteHeading>
          {slug === 'elephant-goldfish' && <p>After <a className="link-underline" href={detail.docs}>installing the plugin</a>, open your repository in Codex and ask:</p>}
          <CodeBlock code={detail.install} language={slug === 'elephant-goldfish' ? 'text' : 'bash'} size="sm" isWrapped showCopyButton />
        </div>
        {slug === 'elephant-goldfish' && <section className="project-attribution n3wth-site-prose">
          <SiteHeading level={2}>Sources and attribution</SiteHeading>
          <p><a href="https://drensin.medium.com/elephants-goldfish-and-the-new-golden-age-of-software-engineering-c33641a48874">Dave Rensin</a> introduced the Elephant-Goldfish model. <a href="https://github.com/vshvedov/elephant-goldfish/tree/b8ebb3d6b00e39fbb6c619faa27f5bb994091d78">Vladyslav Shvedov</a> published the five upstream workflows under the MIT license. Oliver Newth adapted them for this Codex plugin.</p>
          <p>This is an independent adaptation. The bundle preserves the upstream <a href="/downloads/elephant-goldfish/LICENSE">MIT license and copyright notice</a>. Its research notes document the adaptation.</p>
        </section>}
        {slug !== 'elephant-goldfish' && <div className="project-detail-notes">
          {detail.sections.map(([heading, body]) => <article key={heading}><SiteHeading variant="item" level={2}>{heading}</SiteHeading><p>{body}</p></article>)}
        </div>}
      </div>
    </SiteSection>
  </>
}

export default withTheme(ProjectPage)
