import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@n3wth/ui/primitives'
import { PageHeader, SiteContainer } from '@n3wth/ui/site'
import { withTheme } from '../components/withTheme'
import { useHydrated } from '../lib/navigation'
import { track } from '../lib/analytics'
import { acceptanceFields, consequenceLimit, evidenceLimit, featureLimit, formatReviewTest, isShipReview, shareTestLimit, shipReviewApi, shipReviewPath, type ShipReview } from '../lib/shipReview'
import { PolicyChallenge } from './PolicyChallenge'
import './before-you-ship.css'

const examples = [
  {
    name: 'Email agent',
    feature: 'An agent drafts customer replies and sends them once a teammate approves.',
    consequence: 'The agent sends refund terms the teammate never approved.',
    failure: 'Approval sticks to the conversation while the draft changes. The agent sends wording the teammate never saw.',
    setup: 'Prepare and approve a synthetic customer reply that includes a refund amount.',
    input: 'Edit the refund amount, then try to send the revised reply.',
    passCondition: 'Delivery is blocked and the revised draft requires fresh approval.',
    inspect: 'Compare the draft revision on the approval record with the revision on the blocked send attempt.',
    article: { title: 'Agents are an org design problem', path: '/thinking/agents-org-design' },
  },
  {
    name: 'Personal memory',
    feature: 'A planning assistant remembers preferences from earlier conversations and uses them to suggest a schedule.',
    consequence: 'The assistant keeps scheduling meetings for a day the person ruled out.',
    failure: 'An old preference outranks a newer correction. The assistant keeps proposing the time the person already ruled out.',
    setup: 'Save “I prefer Monday mornings,” then “Mondays no longer work, use Thursday.”',
    input: 'Start a fresh conversation and ask for a meeting time.',
    passCondition: 'The assistant suggests Thursday or asks for clarification if it cannot retrieve the newer preference.',
    inspect: 'Check which preference record was retrieved and whether it includes the newer correction.',
    article: { title: 'A personal knowledge graph', path: '/thinking/personal-knowledge-graph' },
  },
]

function ReviewText({ review }: { review: ShipReview }) {
  return (
    <dl className="ship-review-text">
      <div className="ship-failure"><dt>Failure to test</dt><dd>{review.failure}</dd></div>
      {acceptanceFields.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{review[key]}</dd></div>)}
      {review.inspect && <div className="ship-inspect"><dt>What to inspect</dt><dd>{review.inspect}</dd></div>}
    </dl>
  )
}

function BeforeYouShip() {
  const ready = useHydrated()
  const [busy, setBusy] = useState(false)
  const [brief, setBrief] = useState({ feature: '', consequence: '', evidence: '' })
  const featureInput = useRef<HTMLTextAreaElement>(null)
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
    setBusy(true)
    setError('')
    setReview(undefined)
    setShare(undefined)
    setNotice('')
    try {
      const response = await fetch(shipReviewApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: brief.feature, consequence: brief.consequence, ...(brief.evidence.trim() && { evidence: brief.evidence }) }),
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
      <PageHeader
        spacing="compact"
        title={<span className="ship-title">Before You Ship</span>}
        description="Find one way your AI feature could fail and get a test to run before launch."
      />
      <PolicyChallenge ready={ready} />
      <div className="ship-review-grid">
        <section id="review-a-feature" aria-labelledby="ship-form-heading">
          <header className="ship-workspace-heading">
            <h2 id="ship-form-heading">Review a feature</h2>
            <p>Bring a feature brief or an example of what it actually did.</p>
          </header>
          <form method="post" onSubmit={submit} className="ship-review-form ship-brief">
            <label htmlFor="ship-feature">What are you building?</label>
            <textarea id="ship-feature" ref={featureInput} name="feature" rows={3} required minLength={20} maxLength={featureLimit}
              value={brief.feature} onChange={event => setBrief({ ...brief, feature: event.target.value })}
              placeholder="A workplace assistant that answers benefits questions from company policy documents." />
            <label htmlFor="ship-consequence">What happens if it gets something wrong?</label>
            <textarea id="ship-consequence" name="consequence" rows={2} required minLength={5} maxLength={consequenceLimit}
              value={brief.consequence} onChange={event => setBrief({ ...brief, consequence: event.target.value })}
              placeholder="Someone makes a leave decision based on the wrong policy." />
            <details className="ship-evidence-input">
              <summary>Add a reply or source excerpt</summary>
              <label className="sr-only" htmlFor="ship-evidence">Reply or source excerpt</label>
              <textarea id="ship-evidence" name="evidence" rows={4} maxLength={evidenceLimit}
                value={brief.evidence} onChange={event => setBrief({ ...brief, evidence: event.target.value })}
                placeholder="Employee: Canada. Assistant: “You’re eligible for 18 weeks.” Cited document: UK parental leave policy." />
            </details>
            <div className="ship-brief-actions">
              <Button type="submit" variant="primary" isDisabled={!ready || busy} label={busy ? 'Reviewing…' : 'Generate a test'} />
              <p className="ship-note">Your brief is sent to an AI model. Remove confidential details before submitting.</p>
            </div>
          </form>
          {busy && <p role="status" className="ship-note">Looking for a failure worth testing.</p>}
          {error && <p role="alert" className="ship-note">{error}</p>}
          {review && (
            <section ref={output} tabIndex={-1} aria-labelledby="ship-result-heading" className="ship-result">
              <h2 id="ship-result-heading">Your review</h2>
              <p className="ship-note">Check the scenario against your feature before using it.</p>
              <ReviewText review={review} />
              <div className="ship-actions">
                <Button type="button" label="Copy test" onClick={() => void copy(formatReviewTest(review), 'test')} />
                <Button type="button" variant="secondary" label="Prepare to share" onClick={() => {
                  setShare(formatReviewTest(review))
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
          <h2 id="ship-examples-heading">Worked examples</h2>
          {examples.map(example => (
            <details key={example.name} name="ship-examples">
              <summary>{example.name}</summary>
              <p className="ship-note">{example.feature}</p>
              <ReviewText review={example} />
              <div className="ship-actions ship-example-actions">
                <Button type="button" variant="secondary" label="Use this brief" isDisabled={!ready || busy} onClick={() => {
                  setBrief({ feature: example.feature, consequence: example.consequence, evidence: '' })
                  setError('')
                  setReview(undefined)
                  setShare(undefined)
                  setNotice('')
                  featureInput.current?.focus()
                }} />
                <a className="link-underline" href={example.article.path}>{example.article.title}</a>
              </div>
            </details>
          ))}
        </section>
      </div>
    </SiteContainer>
  )
}

export default withTheme(BeforeYouShip)
