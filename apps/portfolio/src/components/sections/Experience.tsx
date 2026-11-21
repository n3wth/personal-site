import { education, experiences } from '../../data/content'
import { SiteSection, SiteHeading, SiteText } from '@n3wth/ui/site'

export function Experience() {
  return (
    <SiteSection id="work" aria-label="Experience" className="site-content-gutter" style={{ paddingTop: 0 }}>
      <div className="work-body">
        <div className="work-intro">
          <SiteText>
            I build AI products and developer tools. At Google, I work on platforms
            that bring DeepMind models into production software. My earlier work
            spans robotics, video calling, and enterprise AI.
          </SiteText>
          <a className="work-resume" href="https://r2.n3wth.com/resume/oliver-newth-resume.pdf">Open resume</a>
        </div>
        <ol className="work-chapters">
          {experiences.map((exp) => (
            <li key={exp.id} id={exp.id} className="work-chapter">
              <div>
                <SiteHeading variant="item" level={2}>
                  <span className="work-company">{exp.company}</span>
                </SiteHeading>
                <SiteText className="work-detail">{exp.role} · {exp.period}</SiteText>
              </div>
              <div className="work-chapter-story">
                <p>{exp.summary}</p>
                {exp.metric && <p className="work-recognition">{exp.metric.label}, {exp.metric.value}</p>}
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <SiteText className="work-detail">{education}</SiteText>
        </div>
      </div>
    </SiteSection>
  )
}
