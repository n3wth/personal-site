import { shipReviewPath } from './shipReview'

export function downloadShipReviewCard(text: string) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas unavailable')
  const width = 1200
  const inset = 80
  const font = '38px system-ui, sans-serif'
  context.font = font
  const lines: string[] = []
  let line = ''
  for (const { segment } of new Intl.Segmenter(undefined, { granularity: 'word' }).segment(text.replace(/\s+/g, ' '))) {
    if (context.measureText(line + segment).width > width - inset * 2 && line) {
      lines.push(line.trimEnd())
      line = ''
    }
    if (context.measureText(segment).width > width - inset * 2) {
      for (const { segment: character } of new Intl.Segmenter().segment(segment)) {
        if (context.measureText(line + character).width > width - inset * 2) {
          lines.push(line)
          line = ''
        }
        line += character
      }
    } else {
      line += line ? segment : segment.trimStart()
    }
  }
  if (line) lines.push(line.trimEnd())

  canvas.width = width
  canvas.height = Math.max(630, 260 + 51 * lines.length)
  context.fillStyle = '#08090b'
  context.fillRect(0, 0, width, canvas.height)
  context.fillStyle = '#f2f3f5'
  context.font = '600 48px system-ui, sans-serif'
  context.fillText('Before You Ship', inset, 110)
  context.font = font
  lines.forEach((line, index) => context.fillText(line, inset, 195 + index * 51))
  context.fillStyle = '#9aa0a8'
  context.font = '28px system-ui, sans-serif'
  context.fillText(`n3wth.com${shipReviewPath}`, inset, canvas.height - 60)

  const link = document.createElement('a')
  link.download = 'before-you-ship.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}
