import { useId, useRef } from 'react'
import { withTheme } from '../components/withTheme'
import { useStoryInteractions } from '../components/storyInteractions'
import { homeContour } from '../components/homeFlow'
import './home.css'

const contours = Array.from({ length: 40 }, (_, i) => homeContour((i / 39) ** 1.35))
const passages = [
  { color: 'cyan', index: 5 },
  { color: 'yellow', index: 29 },
  { color: 'green', index: 17 },
  { color: 'cyan', index: 11 },
] as const

function Home() {
  const contourId = useId()
  const landscape = useRef<SVGSVGElement>(null)
  useStoryInteractions(landscape, 'home')

  return <div className="home-opening">
    <h1 className="sr-only">Oliver Newth</h1>
    <section aria-label="Contour landscape" className="bleed home-opening-scene">
      <div className="home-artwork">
      <svg ref={landscape} className="home-contours" viewBox="0 0 1586 992" fill="none" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
        <defs><g id={contourId}>{contours.map(({ d }, i) => <path key={i} d={d} />)}</g></defs>
        <use href={`#${contourId}`} className="home-contours__echo" />
        <use href={`#${contourId}`} className="home-contours__echo home-contours__echo--answer" />
        <g data-home-plane>
        <g className="home-contours__terrain">
          {contours.map(({ d, route }, i) => <g key={i} data-story-light={i % 5 === 0 || i === 39 ? Math.round(i / 39 * 8) : undefined}>
            <path d={d} data-story-decoration="" />
            {(i % 5 === 0 || i === 39) && <path d={route} style={{ opacity: 0 }} />}
          </g>)}
        </g>
        {passages.map(({ color, index }) => <g key={index} style={{ color: `var(--color-icon-${color})` }}>
          <path d={contours[index].d} className="home-contours__accent" data-story-decoration="" />
        </g>)}
        </g>
      </svg>
      </div>
    </section>
  </div>
}

export default withTheme(Home)
