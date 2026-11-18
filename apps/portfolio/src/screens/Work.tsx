import { withTheme } from '../components/withTheme'
import { sections } from '../data/content'
import { SectionHeader } from '../components/Frame'
import { Experience } from '../components/sections/Experience'
import './work.css'

function Work() {

  return (
    <>
      <SectionHeader
        as="h1"
        story="work"
        title={sections.work.name}
        lede={sections.work.description}
      />
      <Experience />
    </>
  )
}

export default withTheme(Work)
