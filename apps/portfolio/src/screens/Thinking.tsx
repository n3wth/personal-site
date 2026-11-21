import { withTheme } from '../components/withTheme'
import { sections } from '../data/content'
import { SectionHeader } from '../components/Frame'

function ThinkingPage() {

  return <SectionHeader as="h1" story="thinking" title={sections.thinking.name} lede={sections.thinking.description} />
}

export default withTheme(ThinkingPage)
