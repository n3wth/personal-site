import { useEffect, useRef } from 'react'
import { withTheme } from '../components/withTheme'
import './home.css'

const passages = [
  { color: 'cyan', d: 'M 75 548 C 150 550 200 440 295 439 S 405 450 465 490' },
  { color: 'yellow', d: 'M 0 774 C 155 813 288 890 424 915 S 730 950 900 918' },
  { color: 'green', d: 'M 996 622 C 952 649 1160 651 1310 628 S 1435 590 1490 563' },
  { color: 'cyan', d: 'M 1100 570 C 1025 592 1180 608 1315 596 S 1435 585 1480 568' },
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
      <img className="home-landscape-image" src="/images/contour-landscape.webp" width="1586" height="992" alt="" fetchPriority="high" />
      <svg ref={landscape} className="home-contours" viewBox="0 0 1586 992" fill="none" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
        {passages.map(({ color, d }, i) => <g key={i} style={{ color: `var(--color-icon-${color})` }}>
          <path d={d} pathLength="1" className={`home-contours__current home-contours__current--${i}`} />
        </g>)}
      </svg>
      </div>
    </section>
  </div>
}

export default withTheme(Home)
