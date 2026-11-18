export const shipReviewPath = '/before-you-ship'
export const shipReviewApi = '/api/before-you-ship'
export const featureLimit = 750
export const consequenceLimit = 350

export interface ShipReview {
  failure: string
  test: string
}

export function isShipReview(value: unknown): value is ShipReview {
  if (!value || typeof value !== 'object' || !('failure' in value) || !('test' in value)) return false
  return [value.failure, value.test].every(text => typeof text === 'string' && text.trim().length > 0 && text.length <= 700)
}
