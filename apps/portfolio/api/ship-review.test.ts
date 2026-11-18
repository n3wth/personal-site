import { expect, it, vi } from 'vitest'
import { handlePortfolioApi } from './runtime'

const origin = 'https://n3wth.com'
const brief = { feature: 'An assistant answers benefit questions from policy documents.', consequence: 'People plan leave based on the wrong policy.' }
const review = { failure: 'A citation points to the wrong country.', setup: 'Index two sample policies.', input: 'Ask about leave without specifying a location.', passCondition: 'It asks for a country.', inspect: 'Check the cited policy ID in the reply.' }

function submit(body: string, source = origin) {
  return new Request(origin + '/api/before-you-ship', {
    method: 'POST',
    headers: { Origin: source, 'Content-Type': 'application/json' },
    body,
  })
}

it('runs one rate-limited model call and returns the review fields and a plain-text test', async () => {
  const run = vi.fn().mockResolvedValue({ response: { ...review, extra: 'ignored' } })
  const limit = vi.fn().mockResolvedValue({ success: true })
  const response = await handlePortfolioApi(submit(JSON.stringify(brief)), { AI: { run }, SHIP_REVIEW: { limit } })
  expect(response?.status).toBe(200)
  expect(response?.headers.get('Cache-Control')).toBe('no-store')
  expect(await response?.json()).toEqual({ ...review, test: 'Setup: Index two sample policies.\nInput: Ask about leave without specifying a location.\nPass condition: It asks for a country.' })
  expect(run).toHaveBeenCalledTimes(1)
  expect(limit).toHaveBeenCalledTimes(1)
})

it('rejects cross-origin, oversized and rate-limited requests before inference', async () => {
  const run = vi.fn()
  const env = { AI: { run }, SHIP_REVIEW: { limit: vi.fn().mockResolvedValue({ success: false }) } }
  expect((await handlePortfolioApi(submit(JSON.stringify(brief), 'https://example.com'), env))?.status).toBe(403)
  expect((await handlePortfolioApi(submit(JSON.stringify({ ...brief, feature: 'a'.repeat(9000) })), env))?.status).toBe(400)
  expect((await handlePortfolioApi(submit(JSON.stringify(brief)), env))?.status).toBe(429)
  expect(run).not.toHaveBeenCalled()
})

it('returns a retryable error for incomplete model output', async () => {
  const env = {
    AI: { run: vi.fn().mockResolvedValue({ response: { failure: review.failure } }) },
    SHIP_REVIEW: { limit: vi.fn().mockResolvedValue({ success: true }) },
  }
  expect((await handlePortfolioApi(submit(JSON.stringify(brief)), env))?.status).toBe(502)
})

it('passes optional evidence to the model and rejects oversized evidence', async () => {
  const run = vi.fn().mockResolvedValue({ response: review })
  const env = { AI: { run }, SHIP_REVIEW: { limit: vi.fn().mockResolvedValue({ success: true }) } }
  const withEvidence = { ...brief, evidence: 'The reply points to UK-LEAVE for a Canadian employee.' }
  expect((await handlePortfolioApi(submit(JSON.stringify(withEvidence)), env))?.status).toBe(200)
  expect(JSON.parse(run.mock.calls[0][1].messages[1].content)).toEqual(withEvidence)
  expect((await handlePortfolioApi(submit(JSON.stringify({ ...brief, evidence: 'x'.repeat(901) })), env))?.status).toBe(400)
  expect(run).toHaveBeenCalledTimes(1)
})
