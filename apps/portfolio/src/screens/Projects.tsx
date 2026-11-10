import { withTheme } from '../components/withTheme'
import { Github } from 'lucide-react'
import { SiteHeading } from '@n3wth/ui/site'
import { projects, sections } from '../data/content'
import { ProjectVisual } from '../components/ProjectVisual'
import { SectionHeader } from '../components/Frame'

const featuredIds = ['r3', 'ui']

function Projects() {

  return <>
    <SectionHeader as="h1" story="projects" title={sections.projects.name} lede={sections.projects.description} />
    <div className="site-content-gutter project-index">
      {featuredIds.map(slug => {
        const project = projects.find(item => item.id === slug)!
        return <article key={slug} className={`project-feature project-feature--${slug}`}>
          <div className="project-feature-copy">
            <div className="project-feature-heading">
              <SiteHeading level={2}><a href={`/projects/${slug}`}>{project.name}</a></SiteHeading>
              {project.github && <a className="project-source" href={project.github} aria-label={`${project.name} source on GitHub`} title="Source on GitHub" target="_blank" rel="noopener noreferrer"><Github size={24} strokeWidth={2} aria-hidden="true" /></a>}
            </div>
            <p className="project-purpose">{project.question}</p>
            <p>{project.description}</p>
            <div className="project-actions">
              <a href={`/projects/${slug}`}>About {project.name}</a>
              {project.docs && <a href={project.docs}>Documentation</a>}
            </div>
          </div>
          <ProjectVisual slug={slug} />
        </article>
      })}
      <section className="project-other">
        <div className="project-other-list">{projects.filter(project => !featuredIds.includes(project.id)).map(project => <article key={project.id}>
          <SiteHeading level={2} variant="item"><a href={project.url} target={project.url.startsWith('/') ? undefined : '_blank'} rel={project.url.startsWith('/') ? undefined : 'noopener noreferrer'}>{project.name}</a></SiteHeading>
          <p>{project.description}</p>
          {project.github && project.github !== project.url && <p><a className="link-underline" href={project.github} target="_blank" rel="noopener noreferrer">Source on GitHub</a></p>}
        </article>)}</div>
      </section>
    </div>
  </>
}

export default withTheme(Projects)
