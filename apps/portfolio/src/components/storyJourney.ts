const storageKey = 'n3wth-story-journey'

/** A tab-local clock and palette connect the scenes without changing navigation. */
let documentJourney: { epoch: number; color: number } | undefined
export function readStoryJourney() {
  if (documentJourney) return documentJourney
  // The layout paints the ground before hydration from the same journey.
  const painted = (globalThis as { __storyJourney?: { epoch: number; color: number } }).__storyJourney
  if (painted && Number.isFinite(painted.epoch) && Number.isFinite(painted.color)) return documentJourney = painted
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) || 'null')
    if (navigation?.type !== 'reload' && Number.isFinite(value?.epoch) && Number.isFinite(value?.color)) {
      documentJourney = value as { epoch: number; color: number }
      return documentJourney
    }
  } catch { /* Storage is optional. */ }
  documentJourney = { epoch: Date.now() - Math.random() * 600000, color: Math.floor(Math.random() * 4) }
  return documentJourney
}

export function saveStoryJourney(journey: { epoch: number; color: number }) {
  documentJourney = journey
  try { sessionStorage.setItem(storageKey, JSON.stringify(journey)) } catch { /* Private browsing remains usable. */ }
}
