/** One colour model for every scene: ink for line, accent for travelling light, ground for the page. */
export const harmonies = ['ice', 'coral', 'gold', 'seafoam'] as const
export type HarmonyRole = 'ink' | 'accent' | 'ground'
/** Seconds each harmony lasts on the section pages; the home ribbon turns faster. */
export const harmonySeconds = 38
/** The page ground trails the lights, as it does behind the section artwork. */
export const groundLag = 12
const groundStrength = 18
const wrap = (phase: number) => (phase % 4 + 4) % 4

export function harmonyMix(role: HarmonyRole, index: number, blend: number) {
  return `color-mix(in ${role === 'ground' ? 'oklab' : 'oklch shorter hue'}, var(--harmony-${role}-${harmonies[index % 4]}) ${(1 - blend) * 100}%, var(--harmony-${role}-${harmonies[(index + 1) % 4]}))`
}

/** Phase counts harmonies: 0 is ice, 1 coral, 2 gold, 3 seafoam, easing between neighbours. */
export function harmonyColor(role: HarmonyRole, phase: number) {
  const position = wrap(phase), index = Math.floor(position), fraction = position - index
  return harmonyMix(role, index, fraction * fraction * (3 - 2 * fraction))
}

/** Tints the page ground and the shared content accents from one harmony blend. */
export function paintHarmony(index: number, blend: number) {
  if (typeof document === 'undefined') return
  const style = document.documentElement.style
  style.setProperty('--journey-body', `color-mix(in oklab, ${harmonyMix('ground', index, blend)} ${groundStrength}%, var(--color-background-body))`)
  style.setProperty('--journey-ink', harmonyMix('ink', index, blend))
  style.setProperty('--journey-accent', harmonyMix('accent', index, blend))
}

export function paintHarmonyPhase(phase: number) {
  const position = wrap(phase), index = Math.floor(position), fraction = position - index
  paintHarmony(index, fraction * fraction * (3 - 2 * fraction))
}
