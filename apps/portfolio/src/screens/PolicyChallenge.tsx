import { useRef, useState } from 'react'
import { Button } from '@n3wth/ui/primitives'
import { track } from '../lib/analytics'
import { acceptanceFields, formatAcceptanceTest, shareTestLimit, shipReviewPath } from '../lib/shipReview'

const caseId = 'policy-search'
const test = {
  setup: 'Index two fictional leave policies with different allowances. Set the employee’s work country to Canada.',
  input: 'Ask “How much parental leave do I get?”',
  passCondition: 'The reply gives the Canadian fixture’s allowance and cites the Canadian policy.',
}

export function PolicyChallenge({ ready }: { ready: boolean }) {
  const [decision, setDecision] = useState<'ship' | 'hold'>()
  const [draft, setDraft] = useState<string>()
  const [notice, setNotice] = useState('')
  const reveal = useRef<HTMLHeadingElement>(null)
  const editor = useRef<HTMLTextAreaElement>(null)

  function choose(value: 'ship' | 'hold') {
    setDecision(value)
    track('ship_review_case_decided', { case: caseId, decision: value })
    requestAnimationFrame(() => reveal.current?.focus())
  }

  async function copy(text: string, kind: 'case_link' | 'adapted_test') {
    try {
      await navigator.clipboard.writeText(text)
      setNotice(kind === 'case_link' ? 'Case link copied.' : 'Test copied.')
      track('ship_review_case_copied', { case: caseId, kind })
    } catch {
      setNotice('Copy is unavailable in this browser.')
    }
  }

  return (
    <section id={caseId} className="ship-case" aria-labelledby="ship-case-heading">
      <div className="ship-case-heading">
        <h2 id="ship-case-heading">Would you ship this?</h2>
        <p>A fictional employee in <strong>Canada</strong> asks, “How much parental leave do I get?”</p>
      </div>
      <div className="ship-case-evidence">
        <figure>
          <figcaption>Assistant reply</figcaption>
          <blockquote>“You’re eligible for 18 weeks of paid parental leave.”</blockquote>
        </figure>
        <figure>
          <figcaption>Cited source · Company leave policy</figcaption>
          <blockquote>“Employees based in the {decision ? <mark>United Kingdom</mark> : 'United Kingdom'} are eligible for 18 weeks of paid parental leave.”</blockquote>
        </figure>
      </div>
      {!decision ? (
        <div className="ship-actions">
          <Button type="button" label="Ship it" variant="secondary" isDisabled={!ready} onClick={() => choose('ship')} />
          <Button type="button" label="Hold it" variant="secondary" isDisabled={!ready} onClick={() => choose('hold')} />
        </div>
      ) : (
        <div className="ship-case-reveal">
          <h3 ref={reveal} tabIndex={-1}>{decision === 'hold' ? 'Good call. The policy is for the UK.' : 'Hold it. The policy is for the UK.'}</h3>
          <p>The source supports the number for UK employees. It doesn’t establish what this employee in Canada gets.</p>
          <dl className="ship-review-text ship-case-test">
            {acceptanceFields.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{test[key]}</dd></div>)}
          </dl>
          <div className="ship-actions">
            <Button type="button" label="Adapt this test" variant="primary" onClick={() => {
              setDraft(value => value ?? formatAcceptanceTest(test))
              track('ship_review_case_adapted', { case: caseId })
              requestAnimationFrame(() => editor.current?.focus())
            }} />
            <Button type="button" label="Copy case link" variant="secondary" onClick={() => {
              const url = new URL(shipReviewPath, window.location.origin)
              url.hash = caseId
              void copy(url.href, 'case_link')
            }} />
          </div>
          {draft !== undefined && (
            <div className="ship-share">
              <label htmlFor="ship-case-draft">Edit the acceptance test</label>
              <textarea id="ship-case-draft" ref={editor} value={draft} rows={5} maxLength={shareTestLimit} onChange={event => setDraft(event.target.value)} />
              <div><Button type="button" label="Copy adapted test" isDisabled={!draft.trim()} onClick={() => void copy(draft.trim(), 'adapted_test')} /></div>
            </div>
          )}
          <p role="status" className="ship-note">{notice}</p>
          <a href="/thinking/audit-retrieval-before-trusting-an-answer">Audit retrieval before trusting an answer</a>
        </div>
      )}
    </section>
  )
}
