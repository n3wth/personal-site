import { useEffect, useRef } from 'react'
import { withTheme } from '../components/withTheme'
import './home.css'

const contours = Array.from({ length: 40 }, (_, i) => {
  const depth = (i / 39) ** 1.35
  return `M -180 ${520 + depth * 650}
    C 30 ${420 + depth * 700}, 140 ${340 + depth * 680}, 300 ${440 + depth * 570}
    S 500 ${690 + depth * 330}, 760 ${690 + depth * 350}
    S 1090 ${650 + depth * 330}, 1230 ${470 + depth * 540}
    S 1430 ${250 + depth * 730}, 1760 ${340 + depth * 820}`
})
const passages = [
  { color: 'cyan', index: 5 },
  { color: 'yellow', index: 29 },
  { color: 'green', index: 17 },
  { color: 'cyan', index: 11 },
] as const

function Home() {
  const landscape = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const svg = landscape.current
    if (!svg || typeof IntersectionObserver === 'undefined') return
    let visible = true
    const sync = () => svg.classList.toggle('is-paused', document.hidden || !visible)
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
    observer.observe(svg)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync) }
  }, [])

  return <div className="home-opening">
    <h1 className="sr-only">Oliver Newth</h1>
    <section aria-label="Contour landscape" className="bleed home-opening-scene">
      <div className="home-artwork">
      <svg ref={landscape} className="home-contours" viewBox="0 0 1586 992" fill="none" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
        <g className="home-contours__terrain">
          {contours.map((d, i) => <path key={i} d={d} />)}
        </g>
        {passages.map(({ color, index }, i) => <g key={i} style={{ color: `var(--color-icon-${color})` }}>
          <path d={contours[index]} className="home-contours__accent" />
          <path d={contours[index]} pathLength="1" className={`home-contours__current home-contours__current--${i}`} />
        </g>)}
      </svg>
      </div>
    </section>
  </div>
}

export default withTheme(Home)
