import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { N3wthProvider, SiteNavigation, SiteContainer, PageHeader, SiteSection, SiteHeading, SiteText, SiteFooter } from '@n3wth/ui/site'
import { Button } from '@n3wth/ui/primitives'
import '@n3wth/ui/site.css'

function App() {
  const [mode, setMode] = useState<'dark' | 'light'>('dark')
  const [count, setCount] = useState(0)
  return <N3wthProvider mode={mode}>
    <SiteNavigation brand={<a href="/">n3wth UI</a>} links={<a href="#components">Components</a>}
      actions={<Button label={mode === 'dark' ? 'Light' : 'Dark'} onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} />} />
    <SiteContainer as="main" className="n3wth-site-main">
      <PageHeader title="Build with n3wth UI" description="Shared components, typography and theme for your next site." />
      <SiteSection id="components">
        <SiteHeading>Components</SiteHeading>
        <SiteText>Start with the shared foundation, then add your content.</SiteText>
        <Button label="Try the button" onClick={() => setCount(count + 1)} />
        <SiteText as="div"><output aria-live="polite">Clicked {count} times</output></SiteText>
      </SiteSection>
    </SiteContainer>
    <SiteFooter sourceHref="https://github.com/n3wth/personal-site/tree/main/packages/ui" />
  </N3wthProvider>
}

createRoot(document.getElementById('root')!).render(<App />)
