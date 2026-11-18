import { withTheme } from '../components/withTheme'
import { sections } from '../data/content'
import { SectionHeader } from '../components/Frame'
import { NotesIndex } from '../components/thinking/NotesIndex'

function ThinkingPage() {

  return (
    <>
      <SectionHeader as="h1" story="thinking" title={sections.thinking.name} lede={sections.thinking.description} />
      <div className="thinking-page">
        <NotesIndex />
      </div>
    </>
  )
}

export default withTheme(ThinkingPage)
