import { lazy, Suspense, useId, useRef, useState, type CSSProperties } from 'react'
import { useStoryInteractions, type PulseTuning } from './storyInteractions'
import { useHydrated } from '../lib/navigation'
import './sectionStory.css'

const phase = (index: number): CSSProperties => ({ '--story-phase': index } as CSSProperties)
const PulseTuner = import.meta.env.DEV ? lazy(() => import('./PulseTuner')) : null

export type SectionStoryKind = 'work' | 'art' | 'thinking' | 'projects' | 'library' | 'contact'

const STORY_COLORS = ['cyan', 'green', 'yellow', 'red'] as const

function StoryPulse({ d, seed }: { d: string; seed: number }) {
  const id = useId()
  return <>
    <defs>
      <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor={`var(--story-color-${STORY_COLORS[seed % 4]})`} />
        <stop offset="1" stopColor={`var(--story-color-${STORY_COLORS[(seed + 1) % 4]})`} />
      </linearGradient>
    </defs>
    <path className="section-story__pulse" d={d} pathLength="1" stroke={`url(#${id})`} style={{
      '--pulse-length': .06 + (seed % 5) * .018,
    } as CSSProperties} />
  </>
}

function LitStoryLine({ d, seed, surface = false }: { d: string; seed: number; surface?: boolean }) {
  return <><path d={d} data-story-surface={surface ? '' : undefined} /><StoryPulse d={d} seed={seed} /></>
}

function WorkStory() {
  return <>
    {Array.from({ length: 7 }, (_, i) => <LitStoryLine key={i} seed={i + 10}
      d={`M -2400 ${170 + i * 28} H -100 C 280 ${170 + i * 28}, 480 ${475 + i * 20}, 790 ${370 + i * 20} S 1150 ${180 + i * 28}, 1500 ${220 + i * 28} S 2500 ${300 + i * 28}, 3600 ${220 + i * 28}`} />)}
    {Array.from({ length: 5 }, (_, i) => <g key={i} data-story-light={i * 2} className="section-story__plane" style={phase(i)}>
      <LitStoryLine seed={i + 3} surface d={`M ${690 + i * 40} ${580 - i * 10} V ${190 + i * 24} L ${950 + i * 32} ${105 + i * 26} V ${480 + i * 8} Z`} />
    </g>)}
  </>
}

function artFrame(i: number) {
  const scale = .84 ** i
  const x = 950 - 380 * scale, y = 420 + 140 * scale, height = 490 * scale, right = 950 + 80 * scale
  const arch = `M ${x} ${y} V ${y - height * .62} C ${x} ${y - height * 1.14}, ${right} ${y - height * 1.14}, ${right} ${y - height * .62} V ${y}`
  const loop = `${arch} V ${y + height * .279} C ${right} ${y + height * .513}, ${x} ${y + height * .513}, ${x} ${y + height * .279} V ${y} Z`
  return { x, y, height, right, arch, loop }
}

function ArtStory() {
  return <>
    <g stroke="none" fillRule="evenodd">
      {Array.from({ length: 8 }, (_, i) => <path key={i} data-story-wall={i} d={`${artFrame(i).loop} ${artFrame(i + 1).loop}`} style={{ opacity: 0 }} />)}
    </g>
    <g className="section-story__quiet">
      {Array.from({ length: 8 }, (_, i) => <path key={i} data-art-current={i === 7 ? '' : undefined} d={`M -2400 ${950 - i * 18} C -1100 ${950 - i * 18}, ${-50 + i * 40} ${890 - i * 26}, ${410 + i * 30} ${690 - i * 18} Q ${870 + i * 20} ${490 - i * 10} 1540 ${620 - i * 11} T 3600 ${620 - i * 11}`} />)}
    </g>
    <g className="section-story__breath">
      {Array.from({ length: 12 }, (_, index) => {
        const i = index - 3
        const { y, arch, loop } = artFrame(i)
        if (i < 0) return <path key={i} data-story-halo-loop={-i} d={loop} style={{ opacity: 0 }} />
        return <g key={i} data-story-light={i} style={phase(i)}>
          <path data-art-loop style={{ opacity: 0 }} d={loop} />
          <path d={arch} />
          <StoryPulse seed={i + 8} d={arch} />
          <g data-story-reflection transform={`translate(0 ${y * 1.45}) scale(1 -.45)`}>
            <path d={arch} /><StoryPulse seed={i + 8} d={arch} />
          </g>
        </g>
      })}
    </g>
  </>
}

function ThinkingStory() {
  return <g className="section-story__canopy">
    {Array.from({ length: 23 }, (_, i) => {
      const angle = -Math.PI + i / 22 * Math.PI
      const x = 890 + Math.cos(angle) * 360
      const y = 370 + Math.sin(angle) * 300 + Math.sin(i * .8) * 20
      const root = 890 + (i - 11) * 2.5
      const jointX = 890 + (i - 11) * 3
      const jointY = 420 - Math.abs(i - 11) * 6
      const d = `M ${root} 740 C ${root + 55} 590, ${jointX - Math.cos(angle) * 45} ${jointY + 85}, ${jointX} ${jointY} C ${jointX + Math.cos(angle) * 70} ${jointY - 130}, ${x} ${y + 115}, ${x} ${y}`
        .replace(/-?\d+(?:\.\d+)?/g, value => String(Math.round(Number(value) * 1000) / 1000))
      return <g key={i} data-story-light={Math.round(i / 22 * 8)} className="section-story__branch" style={{
        transformOrigin: `${root}px 740px`,
        '--branch-duration': `${11 + ((i * 7) % 13) * 1.13}s`,
        '--branch-delay': `${-i * 2.37}s`,
        '--branch-angle': `${.7 + (i % 5) * .18}deg`,
      } as CSSProperties}>
        <LitStoryLine d={d} seed={i + 16} />
      </g>
    })}
  </g>
}

function ProjectsStory() {
  const blocks = Array.from({ length: 9 }, (_, i) => ({ x: Math.round((120 + Math.sin(i * .7) * 70) * 1000) / 1000, y: 100 + i * 48 }))
  return <>
    {[-2, -1, 1, 2].map(side => <g key={side} transform={`translate(${side * 260} 0)`}>
      {blocks.map(({ x, y }, i) => <path key={i} data-story-border={i} data-border-side={side}
        pathLength="1" style={{ opacity: 0, vectorEffect: 'none' }}
        d={`M ${x} ${y} l 260 -95 l 240 120 l -260 95 l -240 -120 v 28 l 240 120 l 260 -95 v -28 l -260 95 v 28`} />)}
    </g>)}
    <g stroke="none">
      {blocks.map(({ x, y }, i) => <g key={i}>
        <path data-story-face={i} data-face-shade="1" d={`M ${x} ${y} l 260 -95 l 240 120 l -260 95 Z`} />
        <path data-story-face={i} data-face-shade=".5" d={`M ${x} ${y} l 240 120 v 28 l -240 -120 Z`} />
        <path data-story-face={i} data-face-shade=".75" d={`M ${x + 240} ${y + 120} l 260 -95 v 28 l -260 95 Z`} />
      </g>)}
    </g>
    {blocks.map(({ x, y }, i) => {
      return <g key={i} data-story-block={i}>
        <LitStoryLine seed={i + 4} d={`M ${x} ${y} l 260 -95 l 240 120 l -260 95 Z`} />
        <path className="section-story__quiet" d={`M ${x} ${y} v 28 l 240 120 v -28`} />
        <path className="section-story__quiet" d={`M ${x + 240} ${y + 148} l 260 -95 v -28`} />
      </g>
    })}
    <LitStoryLine seed={19} d="M 380 -1800 C 330 -600 335 -130 380 5 C 425 140 305 270 360 365 S 465 460 430 650 C 395 840 400 1050 400 2200" />
  </>
}

function LibraryStory() {
  return <g transform="translate(850 390) rotate(-22)">
    {Array.from({ length: 9 }, (_, i) => <g key={i} transform={`translate(${(i - 4) * 4} 0) rotate(${(i - 4) * 8} 0 235)`}>
      <g data-story-light={i} className="section-story__page" style={phase(i)}>
      <LitStoryLine seed={i + 25} surface d="M 0 235 C -143 125 -219 -5 -192 -205 C -77 -185 57 -151 142 -74 C 128 73 79 183 0 235 Z" />
      <path className="section-story__quiet" d="M 0 235 C -30 57 -107 -90 -192 -205" />
      </g>
    </g>)}
    {Array.from({ length: 9 }, (_, i) => {
      const x = (i - 4) * 4
      return <LitStoryLine key={i} seed={41 + i} d={`M ${x} 235 C ${x - 30} 410 ${x - 220} 700 ${x - 680} 1900`} />
    })}
  </g>
}

function ContactStory() {
  const spectrum = useId()
  return <>
    <defs>
      {STORY_COLORS.map((color, i) => <linearGradient key={color} id={`${spectrum}-${i}`} gradientUnits="userSpaceOnUse" x1="924" y1="350" x2="660" y2="100">
        <stop offset="0" stopColor={`var(--story-color-${color})`} />
        <stop offset="1" stopColor={`var(--story-color-${STORY_COLORS[(i + 1) % STORY_COLORS.length]})`} />
      </linearGradient>)}
    </defs>
    {[0, 180].map((rotation, side) => <g key={rotation} data-story-side={side} transform={`rotate(${rotation} 924 350)`}>
        {Array.from({ length: 11 }, (_, i) => {
          const d = i === 0
            ? 'M -1800 350 C -200 350 540 210 660 100 C 780 -10 1010 120 924 350 C 730 410 540 210 660 100'
            : `M 924 350 C ${730 + i * 12} ${410 - i * 10}, ${540 + i * 15} ${210 + i * 6}, ${660 + i * 12} ${100 + i * 15} C ${780 + i * 8} ${-10 + i * 21}, ${1010 - i * 7} ${120 + i * 10}, 924 350`
          return <g key={i} data-story-light={Math.round(i / 10 * 8)}>
            <path d={d} />
              <path className="section-story__contact-spectrum" d={d} pathLength="1" stroke={`url(#${spectrum}-${(i * 3 + side) % STORY_COLORS.length})`} style={{
                '--pulse-length': .06 + (i % 5) * .018,
              } as CSSProperties} />
          </g>
        })}
    </g>)}
  </>
}

const stories = { work: WorkStory, art: ArtStory, thinking: ThinkingStory, projects: ProjectsStory, library: LibraryStory, contact: ContactStory }
const storyBounds: Record<SectionStoryKind, string> = {
  work: '575 32.5 620 620',
  art: '458 50 760 760',
  thinking: '460 -25 860 860',
  projects: '-20 -55 760 760',
  library: '465 55 690 690',
  contact: '594 20 660 660',
}

export function SectionStory({ kind }: { kind: SectionStoryKind }) {
  const scene = useRef<SVGSVGElement>(null)
  const [tuning, setTuning] = useState<PulseTuning>()
  const ready = useHydrated()
  useStoryInteractions(scene, kind, tuning)
  const Story = stories[kind]
  return <><div className={`section-story section-story--${kind}`} aria-hidden="true">
    <svg ref={scene} viewBox={storyBounds[kind]} fill="none" style={{ isolation: 'isolate' }} preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true">
      <g data-story-space><Story /></g>
    </svg>
  </div>
    {PulseTuner && ready && new URLSearchParams(window.location.search).has('tune') &&
      <Suspense fallback={null}><PulseTuner onChange={setTuning} /></Suspense>}
  </>
}
