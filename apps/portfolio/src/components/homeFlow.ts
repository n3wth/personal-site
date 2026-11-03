import { ribbonEase as smooth, ribbonFrame } from './ribbonSurface'

export function createHomeFlow(svg: SVGSVGElement) {
  const plane = svg.querySelector<SVGGElement>('[data-home-plane]')
  const patches = [...svg.querySelectorAll<SVGGElement>('[data-ribbon-patch]')].sort((a, b) => Number(a.dataset.ribbonPatch) - Number(b.dataset.ribbonPatch))
  const echoes = [...svg.querySelectorAll<SVGPathElement>('.home-contours__echo')]
  const backdrop = svg.closest<HTMLElement>('.home-opening-scene')
  const palette = ['cyan', 'red', 'yellow', 'green']
  let lastTime = -1
  const draw = (time: number) => {
    const energy = smooth((time - 12) / 24), frame = ribbonFrame(time)
    const phase = time / 24, index = Math.floor(phase) % palette.length
    const blend = (offset: number) => `color-mix(in oklch shorter hue, var(--color-icon-${palette[(index + offset) % 4]}) ${(1 - smooth(phase % 1)) * 100}%, var(--color-icon-${palette[(index + offset + 1) % 4]}))`
    const color = blend(0), ground = blend(2)
    const background = `color-mix(in oklab, ${ground} ${energy * (18 + 10 * Math.sin(time * .04) ** 2)}%, var(--color-background-body))`
    if (backdrop) backdrop.style.backgroundColor = background
    for (const [order, patch] of frame.patches.sort((a, b) => a.depth - b.depth || a.index - b.index).entries()) {
      const group = patches[patch.index]
      if (!group) continue
      const [skin, strands, accent] = [...group.children] as SVGPathElement[]
      skin.setAttribute('d', patch.surface)
      strands.setAttribute('d', patch.strands)
      accent.setAttribute('d', patch.accents)
      const front = smooth((patch.facing + .2) / .4)
      skin.style.fill = `color-mix(in oklab, ${color} ${energy * (5 + (1 - front) * 12)}%, ${background})`
      const light = Math.exp(-(((patch.u - ((time * .045) % 1.8 - .4)) / .15) ** 2))
      strands.style.stroke = `color-mix(in oklab, ${color} ${energy * 100}%, var(--color-text-primary))`
      strands.style.opacity = String(.32 + .68 * smooth(patch.exposure / .35))
      accent.style.stroke = `color-mix(in oklab, ${blend(1)} ${(35 + light * 65) * energy}%, var(--color-text-primary))`
      if (plane && plane.children[order] !== group) plane.insertBefore(group, plane.children[order] ?? null)
    }
    const rehearsal = smooth((.5 - .5 * Math.cos(time * Math.PI * 2 / 64) - .12) / .5)
    echoes.forEach((echo, i) => {
      const wave = (.5 - .5 * Math.cos((time - i * 17) * Math.PI * 2 / 52)) * energy * rehearsal
      const echoFrame = wave > .001 ? ribbonFrame(Math.max(0, time + (i === 0 ? -9 : 9) * rehearsal)) : frame
      echo.setAttribute('d', echoFrame.echoes.join(' '))
      echo.style.opacity = String(wave * .35)
    })
  }
  return {
    update(time: number) {
      if (time - lastTime < 1 / 30) return
      lastTime = time
      draw(time)
    },
    reset() { lastTime = -1; draw(0) },
  }
}
