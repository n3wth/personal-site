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
        <path className="home-contours__echo" />
        <path className="home-contours__echo home-contours__echo--answer" />
        <g data-home-plane className="home-contours__terrain">
          {[...opening.patches].sort((a, b) => a.depth - b.depth || a.index - b.index).map(patch => <g key={patch.index} data-ribbon-patch={patch.index}>
            <path d={patch.surface} className="home-ribbon__skin" />
            <path d={patch.strands} className="home-ribbon__strands" />
            <path d={patch.accents} className="home-contours__accent" />
          </g>)}
        </g>
      </svg>
      </div>
    </section>
  </div>
}

export default withTheme(Home)
