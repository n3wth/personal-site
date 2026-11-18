import { withTheme } from '../components/withTheme'
import { sections } from '../data/content'
import { SectionHeader } from '../components/Frame'
import { shipReviewPath } from '../lib/shipReview'
import { NotesIndex } from '../components/thinking/NotesIndex'

function ThinkingPage() {

  return (
    <>
      <SectionHeader as="h1" story="thinking" title={sections.thinking.name} lede={sections.thinking.description} />
      <div className="thinking-page">
        <p><a className="link-underline" href={shipReviewPath}>Before You Ship</a> · Review an AI feature and get an acceptance test.</p>
        <NotesIndex />
      </div>
    </>
  )
}

export default withTheme(ThinkingPage)
