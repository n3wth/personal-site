export const shipReviewPath = '/before-you-ship'
export const shipReviewApi = '/api/before-you-ship'
export const featureLimit = 750
export const consequenceLimit = 350
export const shareTestLimit = 900

export const acceptanceFields = [
  ['setup', 'Setup'],
  ['input', 'Input'],
  ['passCondition', 'Pass condition'],
] as const

export type AcceptanceTest = Record<(typeof acceptanceFields)[number][0], string>
export interface ShipReview extends AcceptanceTest {
  failure: string
}

export function formatAcceptanceTest(test: AcceptanceTest) {
  return acceptanceFields.map(([key, label]) => `${label}: ${test[key]}`).join('\n')
}

export function isShipReview(value: unknown): value is ShipReview {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return ['failure', ...acceptanceFields.map(([key]) => key)].every(key => {
    const text = record[key]
    return typeof text === 'string' && text.trim().length > 0 && text.length <= 220
  })
}
