import { useState } from 'react'
import { Button } from '@n3wth/ui/primitives'
import { SiteHeading } from '@n3wth/ui/site'

const explanations = [
  {
    title: 'A fresh view of the same evidence',
    steps: [
      ['Elephant', 'Keeps the project history, decisions, and working conversation.'],
      ['The handoff', 'Sends the draft and the source it references. Leaves out the conversation.'],
      ['Goldfish', 'Starts fresh and checks what the draft and the code support.'],
    ],
    caption: 'The history stays with the Elephant. The draft travels to the reviewer.',
  },
  {
    title: 'A revision gets a new review',
    steps: [
      ['Review', 'A finding points to a concrete problem in this version.'],
      ['Resolve and revise', 'You choose which findings to address. The Elephant revises the design.'],
      ['Review again', 'A fresh Goldfish examines the new version without the earlier verdict.'],
    ],
    caption: 'The loop stops when the reviews converge. Unresolved findings remain visible.',
  },
] as const

export function ElephantGoldfishExplanation() {
  const [replay, setReplay] = useState(0)

  return <section className="eg-explanations" aria-label="How Elephant-Goldfish works">
    <div className="eg-explanation-heading">
      <SiteHeading level={2}>How it works</SiteHeading>
      <Button label={replay ? 'Replay illustrations' : 'Play illustrations'} variant="secondary" clickAction={() => setReplay(value => value + 1)} />
    </div>
    {explanations.map((explanation, index) => <figure className="eg-explanation" key={explanation.title}>
      <SiteHeading level={3} variant="item">{explanation.title}</SiteHeading>
      <ol className="eg-steps" key={replay} data-playing={replay > 0}>
        {explanation.steps.map(([title, body], step) => <li key={title}>
          <svg className="eg-stage" viewBox="0 0 160 112" aria-hidden="true">
            {index === 0 && step === 0 && <g className="eg-history"><path d="M20 22h58v72H20z M30 32h32 M30 43h26 M30 54h30 M30 65h24" /><path d="M39 12h58v72" /></g>}
            <g className="eg-evidence">
              <path d="M66 22h45l17 17v55H66z M111 22v17h17" />
              <path d="M77 52h39 M77 64h30 M77 76h35" />
            </g>
            {step === 2 && <g className="eg-review"><circle cx="64" cy="62" r="24" /><path d="m47 79-17 17" /></g>}
            {index === 1 && step === 0 && <path className="eg-finding" d="M91 48v17 M91 75v2" />}
            {index === 1 && step === 1 && <path className="eg-revision" d="m39 75 25-25 9 9-25 25-13 4z M59 55l9 9" />}
          </svg>
          {step < 2 && <svg className="eg-transfer" viewBox="0 0 80 24" aria-hidden="true"><path d="M2 12C25 2 52 22 76 12" /><path className="eg-packet" pathLength="1" d="M2 12C25 2 52 22 76 12" /><path d="m68 6 8 6-8 6" /></svg>}
          <h4>{title}</h4>
          <p>{body}</p>
        </li>)}
      </ol>
      <figcaption>{explanation.caption}</figcaption>
    </figure>)}
  </section>
}
