import { withTheme } from '../components/withTheme'
import { PageHeader } from '@n3wth/ui/site'
import '../notes.css'

export interface Note {
  slug: string
  href: string
  title: string
  description: string
  tags: string[]
  stage: 'seedling' | 'budding' | 'evergreen'
  readingTime: string
  date?: string
  updated?: string
  html: string
  headings: { id: string; text: string; level: number }[]
  backlinks: { slug: string; title: string; href: string; context: { before: string; mention: string; after: string } | null }[]
}

function ThinkingNote({ note }: { note: Note }) {
  const headings = note.headings.filter(heading => heading.level <= 3)

  return (
    <article className="site-content-gutter thinking-note thinking-reading-page">
      <PageHeader title={note.title} description={note.description} />
      <p className="text-sm mt-6" style={{ color: 'var(--ink-dim)' }}>
        {note.date && <><time dateTime={note.date}>{new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</time>{' · '}</>}
        {note.readingTime} · {note.stage}
      </p>
      <nav aria-label="Note topics" className="flex flex-wrap gap-x-5 mt-2">
        {note.tags.map(tag => <a className="link-underline inline-flex min-h-11 items-center text-sm" key={tag} href={`/thinking?topic=${encodeURIComponent(tag)}#notes`}>{tag}</a>)}
      </nav>
      <div className="thinking-note-layout">
        {headings.length > 0 && <details className="thinking-note-outline n3wth-site-reading-outline">
          <summary className="n3wth-site-reading-outline-label">Contents</summary>
          <nav aria-label="Contents" className="n3wth-site-reading-outline-content">
            {headings.map(({ id, text, level }) => <a key={id} className={level === 3 ? 'ms-3' : undefined} href={`#${id}`}>{text}</a>)}
          </nav>
        </details>}
        <div className="min-w-0">
          {/* HTML comes from the repository's trusted Markdown build pipeline. */}
          <div className="n3wth-site-prose thinking-note-prose" dangerouslySetInnerHTML={{ __html: note.html }} />
          {note.backlinks.length > 0 && <section className="mt-16" aria-labelledby="backlinks-heading">
            <h2 id="backlinks-heading" className="text-lg">Linked from</h2>
            <ul className="mt-6 space-y-6">
              {note.backlinks.map(link => <li key={link.slug}>
                <a href={link.href} className="link-underline">{link.title}</a>
                {link.context && <p className="text-sm mt-2" style={{ color: 'var(--ink-dim)' }}>{link.context.before}{link.context.mention}{link.context.after}</p>}
              </li>)}
            </ul>
          </section>}
        </div>
      </div>
    </article>
  )
}

export default withTheme(ThinkingNote)
