import { useRef } from 'react'
import { withTheme } from '../components/withTheme'
import { useHomeFlow } from '../components/homeFlow'
import { ribbonFrame } from '../components/ribbonSurface'
import './home.css'

const opening = ribbonFrame()

function Home() {
  const landscape = useRef<SVGSVGElement>(null)
  useHomeFlow(landscape)

  return <div className="home-opening">
    <h1 className="sr-only">Oliver Newth</h1>
    <section aria-label="Contour landscape" className="bleed home-opening-scene">
      <div className="home-artwork">
      <svg ref={landscape} className="home-contours" viewBox="0 0 1586 992" fill="none" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
        <g data-home-plane className="home-contours__terrain">
          <path d={opening.strands} className="home-ribbon__strands" />
          <path d={opening.surface} className="home-ribbon__skin" />
          <path d={opening.foreground} className="home-ribbon__front" />
        </g>
      </svg>
      </div>
    </section>
  </div>
}

export default withTheme(Home)
