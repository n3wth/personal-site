import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@n3wth/ui/primitives'
import { PageHeader, SiteContainer } from '@n3wth/ui/site'
import { withTheme } from '../components/withTheme'
import { useHydrated } from '../lib/navigation'
import { track } from '../lib/analytics'
import { acceptanceFields, consequenceLimit, featureLimit, formatAcceptanceTest, isShipReview, shareTestLimit, shipReviewApi, shipReviewPath, type ShipReview } from '../lib/shipReview'
import { PolicyChallenge } from './PolicyChallenge'
import './before-you-ship.css'

const examples = [
  {
    name: 'Email agent',
    feature: 'An agent drafts customer replies and sends them once a teammate approves.',
    failure: 'Approval sticks to the conversation while the draft changes. The agent sends wording the teammate never saw.',
    setup: 'Prepare and approve a synthetic customer reply that includes a refund amount.',
    input: 'Edit the refund amount, then try to send the revised reply.',
    passCondition: 'Delivery is blocked and the revised draft requires fresh approval.',
    article: { title: 'Agents are an org design problem', path: '/thinking/agents-org-design' },
  },
  {
    name: 'Personal memory',
    feature: 'A planning assistant remembers preferences from earlier conversations and uses them to suggest a schedule.',
    failure: 'An old preference outranks a newer correction. The assistant keeps proposing the time the person already ruled out.',
    setup: 'Save “I prefer Monday mornings,” then “Mondays no longer work, use Thursday.”',
    input: 'Start a fresh conversation and ask for a meeting time.',
    passCondition: 'The assistant suggests Thursday or asks for clarification if it cannot retrieve the newer preference.',
    article: { title: 'A personal knowledge graph', path: '/thinking/personal-knowledge-graph' },
  },
]

function ReviewText({ review }: { review: ShipReview }) {
  return (
    <dl className="ship-review-text">
      <div><dt>Failure to test</dt><dd>{review.failure}</dd></div>
      {acceptanceFields.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{review[key]}</dd></div>)}
    </dl>
  )
}

function BeforeYouShip() {
  const ready = useHydrated()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [review, setReview] = useState<ShipReview>()
  const [share, setShare] = useState<string>()
  const [notice, setNotice] = useState('')
  const requestPending = useRef(false)
  const output = useRef<HTMLElement>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (requestPending.current) return
    requestPending.current = true
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    setReview(undefined)
    setShare(undefined)
    setNotice('')
    try {
      const response = await fetch(shipReviewApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: data.get('feature'), consequence: data.get('consequence') }),
        signal: AbortSignal.timeout(25_000),
      })
      const result: unknown = await response.json()
      if (!response.ok) {
        if (result && typeof result === 'object' && 'error' in result && typeof result.error === 'string') throw new Error(result.error)
        throw new Error('The review could not finish. Try again or open an example.')
      }
      if (!isShipReview(result)) throw new Error('The review came back incomplete. Try again or open an example.')
      setReview(result)
      track('ship_review_generated')
      requestAnimationFrame(() => output.current?.focus())
    } catch (failure) {
      setError(failure instanceof Error && failure.name === 'Error' ? failure.message : 'The review could not finish. Try again or open an example.')
    } finally {
      requestPending.current = false
      setBusy(false)
    }
  }

  async function copy(text: string, kind: 'test' | 'share') {
    try {
      await navigator.clipboard.writeText(text)
      setNotice(kind === 'test' ? 'Test copied.' : 'Share text copied.')
      track('ship_review_copied', { kind })
    } catch {
      setNotice('Copy is unavailable. Select and copy the text manually.')
    }
  }

  async function downloadCard(text: string) {
    try {
      const { downloadShipReviewCard } = await import('../lib/shipReviewCard')
      downloadShipReviewCard(text)
      setNotice('Share card downloaded.')
      track('ship_review_card_downloaded')
    } catch {
      setNotice('The card could not download. You can still copy the share text.')
    }
  }

  return (
    <SiteContainer className="ship-review" data-ph-no-capture>
      <PageHeader spacing="compact" title="Before You Ship" description="Find one way your AI feature could fail and get an acceptance test to run before launch." />
      <PolicyChallenge ready={ready} />
      <div className="ship-review-grid">
        <section aria-labelledby="ship-form-heading">
          <h2 id="ship-form-heading">Review a feature</h2>
          <form method="post" onSubmit={submit} className="ship-review-form">
            <label htmlFor="ship-feature">What are you building?</label>
            <textarea id="ship-feature" name="feature" rows={4} required minLength={20} maxLength={featureLimit}
              placeholder="A workplace assistant that answers benefits questions from company policy documents." />
            <label htmlFor="ship-consequence">What happens if it gets something wrong?</label>
            <textarea id="ship-consequence" name="consequence" rows={3} required minLength={5} maxLength={consequenceLimit}
              placeholder="Someone makes a leave decision based on the wrong policy." />
            <p className="ship-note">Use a fictional example or remove confidential details. Your brief is sent to an AI model to generate the review.</p>
            <div><Button type="submit" variant="primary" isDisabled={!ready || busy} label={busy ? 'Reviewing…' : 'Generate a test'} /></div>
          </form>
          {busy && <p role="status" className="ship-note">Looking for a failure worth testing.</p>}
          {error && <p role="alert" className="ship-note">{error}</p>}
          {review && (
            <section ref={output} tabIndex={-1} aria-labelledby="ship-result-heading" className="ship-result">
              <h2 id="ship-result-heading">Your review</h2>
              <p className="ship-note">Check the scenario against your feature before using it.</p>
              <ReviewText review={review} />
              <div className="ship-actions">
                <Button type="button" label="Copy test" onClick={() => void copy(formatAcceptanceTest(review), 'test')} />
                <Button type="button" variant="secondary" label="Prepare to share" onClick={() => {
                  setShare(formatAcceptanceTest(review))
                  setNotice('')
                  track('ship_review_share_opened')
                }} />
              </div>
              {share !== undefined && (
                <div className="ship-share">
                  <label htmlFor="ship-share">Edit the test before sharing</label>
                  <textarea id="ship-share" rows={4} maxLength={shareTestLimit} value={share} onChange={event => setShare(event.target.value)} />
                  <p className="ship-note">The copied text includes a link back to Before You Ship.</p>
                  <div className="ship-actions">
                    <Button type="button" label="Copy share text" isDisabled={!share.trim()} onClick={() => void copy(`${share.trim()}\n\nBefore You Ship · https://n3wth.com${shipReviewPath}`, 'share')} />
                    <Button type="button" variant="secondary" label="Download card" isDisabled={!share.trim()} onClick={() => void downloadCard(share.trim())} />
                  </div>
                </div>
              )}
              <p role="status" className="ship-note">{notice}</p>
            </section>
          )}
        </section>
        <section aria-labelledby="ship-examples-heading" className="ship-examples">
          <h2 id="ship-examples-heading">Example reviews</h2>
          {examples.map(example => (
            <details key={example.name} name="ship-examples">
              <summary>{example.name}</summary>
              <p className="ship-note">{example.feature}</p>
              <ReviewText review={example} />
              <a className="link-underline" href={example.article.path}>{example.article.title}</a>
            </details>
          ))}
        </section>
      </div>
    </SiteContainer>
  )
}

export default withTheme(BeforeYouShip)
