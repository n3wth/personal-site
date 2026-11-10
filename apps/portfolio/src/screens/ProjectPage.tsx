import { withTheme } from '../components/withTheme'
import { CodeBlock } from '@n3wth/ui'
import { SiteSection, SiteHeading } from '@n3wth/ui/site'
import { projects } from '../data/content'
import { ProjectVisual } from '../components/ProjectVisual'
import { ElephantGoldfishExplanation } from '../components/ElephantGoldfishExplanation'

const details = {
  'elephant-goldfish': {
    title: 'Elephant-Goldfish Model',
    question: 'Design with an elephant. Review with a goldfish.',
    description: 'EGM is Google’s open-source plugin for designing software with coding agents. The Elephant holds the project context and drafts the specification. Goldfish reviewers read the draft and the source it references, without the earlier conversation. You make the trade-offs and approve the design before anything is built.',
    install: '/egm:egm-brainstorm Add webhook delivery to this project.',
    sections: [
      ['Explore the idea', 'Start with a rough feature. The agent asks about requirements and trade-offs, fresh reviewers challenge the proposal, and the agreed direction is saved as a concept brief.'],
      ['Draft the specification', 'The brief becomes a design document, written one section at a time with a pause for your feedback after each.'],
      ['Review before you build', 'Fresh reviewers check the design, its clarity, its fit with the code, and its implementation plan. You choose which findings to address.'],
    ],
    docs: '/docs/elephant-goldfish/quickstart',
    source: 'https://github.com/google/elephant-goldfish-model',
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

const egmInstalls = [
  ['Claude Code', 'claude plugin marketplace add google/elephant-goldfish-model\nclaude plugin install egm@egm'],
  ['Codex', 'codex plugin marketplace add google/elephant-goldfish-model\ncodex plugin add egm@egm'],
  ['Antigravity', 'agy plugin install https://github.com/google/elephant-goldfish-model'],
] as const

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
            <a href={detail.source} target="_blank" rel="noopener noreferrer">{slug === 'elephant-goldfish' ? 'Source on GitHub' : 'Source'}</a>
            {slug === 'elephant-goldfish' && <a href="https://egm.dev" target="_blank" rel="noopener noreferrer">egm.dev</a>}
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
          <SiteHeading level={2}>Install</SiteHeading>
          {slug === 'elephant-goldfish' ? <>
            <p>Choose your coding agent, then start a new session. The <a className="link-underline" href="https://github.com/google/elephant-goldfish-model/blob/main/docs/harnesses.md">setup guide</a> covers other agents.</p>
            {egmInstalls.map(([agent, code]) => <div key={agent}>
              <SiteHeading level={3} variant="item">{agent}</SiteHeading>
              <CodeBlock code={code} language="bash" size="sm" isWrapped showCopyButton />
            </div>)}
            <p>Open a project and pick a feature that needs design decisions. See the <a className="link-underline" href={detail.docs}>quickstart</a> for the full sequence.</p>
            <CodeBlock code={detail.install} language="text" size="sm" isWrapped showCopyButton />
          </> : <CodeBlock code={detail.install} language="bash" size="sm" isWrapped showCopyButton />}
        </div>
        {slug === 'elephant-goldfish' && <section className="project-attribution n3wth-site-prose">
          <SiteHeading level={2}>Credits and my part</SiteHeading>
          <p>Dave Rensin introduced the model in <a href="https://drensin.medium.com/elephants-goldfish-and-the-new-golden-age-of-software-engineering-c33641a48874">Elephants, Goldfish, and the New Golden Age of Software Engineering</a>. EGM is a Google open-source project under the Apache 2.0 license. Thousands of Google engineers use it. The first public release was in October 2026.</p>
          <p>I was part of the team that built and released it. My work covered plugin packaging and releases, support for additional coding agents, the documentation, and <a href="https://egm.dev">egm.dev</a>.</p>
          <p>This page once described my independent 0.1.0 Codex adaptation, based on <a href="https://github.com/vshvedov/elephant-goldfish/tree/b8ebb3d6b00e39fbb6c619faa27f5bb994091d78">Vladyslav Shvedov</a>’s workflows. EGM replaces it. The <a href="/downloads/elephant-goldfish-0.1.0.zip">archived bundle</a> keeps its <a href="/downloads/elephant-goldfish/LICENSE">MIT license and copyright notice</a>.</p>
        </section>}
        {slug !== 'elephant-goldfish' && <div className="project-detail-notes">
          {detail.sections.map(([heading, body]) => <article key={heading}><SiteHeading variant="item" level={2}>{heading}</SiteHeading><p>{body}</p></article>)}
        </div>}
      </div>
    </SiteSection>
  </>
}

export default withTheme(ProjectPage)
