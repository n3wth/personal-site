const smooth = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t) }

export function homeContour(depth: number) {
  const start = { x: -6000, y: 760 + depth * 340 - 5820 * (150 - depth * 140) / 250 }
  const end = { x: 6000, y: 70 + depth * 330 + 4240 * (-80 + depth * 210) / 530 }
  const route = `M -180 ${760 + depth * 340}
    C 70 ${910 + depth * 200}, 610 ${880 - depth * 260}, 540 ${480 - depth * 200}
    S 190 ${120 + depth * 480}, 460 ${180 + depth * 330}
    S 720 ${850 - depth * 280}, 1040 ${760 - depth * 260}
    S 1230 ${150 + depth * 120}, 1760 ${70 + depth * 330}`
  return {
    start, end, route,
    d: `M ${start.x} ${start.y} L ${route.slice(2)} L ${end.x} ${end.y}`,
  }
}

/** Orthographic plane rotation stays vector-native and never approaches a camera singularity. */
export function homeProjection(time: number, scale = 1) {
  const depth = smooth((time - 8) / 22)
  const x = Math.sin(time * .09) * .42 * depth, y = Math.sin(time * .061) * .55 * depth
  const z = Math.sin(time * .047) * (.035 + depth * .12)
  const a = (Math.cos(z) * Math.cos(y) - Math.sin(z) * Math.sin(x) * Math.sin(y)) * scale
  const b = (Math.sin(z) * Math.cos(y) + Math.cos(z) * Math.sin(x) * Math.sin(y)) * scale
  const c = -Math.sin(z) * Math.cos(x) * scale, d = Math.cos(z) * Math.cos(x) * scale
  const viewpoint = smooth(.5 - .5 * Math.cos(time * Math.PI * 2 / 88))
  const focusX = 793 + depth * (viewpoint - .5) * 520, focusY = 496 + depth * (viewpoint - .5) * 240
  return [a, b, c, d, 793 + Math.sin(time * .13) * 22 - a * focusX - c * focusY, 496 + Math.sin(time * .11) * 16 - b * focusX - d * focusY]
}

export function createHomeFlow(svg: SVGSVGElement) {
  const plane = svg.querySelector<SVGGElement>('[data-home-plane]')
  const echoes = [...svg.querySelectorAll<SVGUseElement>('.home-contours__echo')]
  const backdrop = svg.closest<HTMLElement>('.home-opening-scene')
  const palette = ['cyan', 'red', 'yellow', 'green']
  return {
    update(time: number) {
      const energy = smooth((time - 12) / 24)
      const phase = time / 24, index = Math.floor(phase) % palette.length
      const color = `color-mix(in oklch shorter hue, var(--color-icon-${palette[index]}) ${(1 - smooth(phase % 1)) * 100}%, var(--color-icon-${palette[(index + 1) % palette.length]}))`
      const ground = `color-mix(in oklch shorter hue, var(--color-icon-${palette[(index + 2) % palette.length]}) ${(1 - smooth(phase % 1)) * 100}%, var(--color-icon-${palette[(index + 3) % palette.length]}))`
      plane?.setAttribute('transform', `matrix(${homeProjection(time).join(' ')})`)
      if (plane) plane.style.stroke = `color-mix(in oklab, ${color} ${energy * 100}%, var(--color-text-primary))`
      if (backdrop) backdrop.style.backgroundColor = `color-mix(in oklab, ${ground} ${energy * (18 + 10 * Math.sin(time * .04) ** 2)}%, var(--color-background-body))`
      const rehearsal = smooth((.5 - .5 * Math.cos(time * Math.PI * 2 / 64) - .12) / .5)
      echoes.forEach((echo, i) => {
        const wave = (.5 - .5 * Math.cos((time - i * 17) * Math.PI * 2 / 52)) * energy * rehearsal
        echo.setAttribute('transform', `matrix(${homeProjection(Math.max(0, time + (i === 0 ? -9 : 9) * rehearsal), 1 + wave * .5).join(' ')})`)
        echo.style.opacity = String(wave * .45)
      })
    },
    reset() {
      plane?.removeAttribute('transform')
      if (plane) plane.style.stroke = ''
      if (backdrop) backdrop.style.backgroundColor = ''
      echoes.forEach(echo => { echo.removeAttribute('transform'); echo.style.opacity = '' })
    },
  }
}
