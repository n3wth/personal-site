import { lazy, Suspense, useCallback, useState } from 'react'
import { Nav } from './Nav'
import { useCommandPalette } from '../hooks/useCommandPalette'
import { useKeyboardNav } from '../hooks/useKeyboardNav'
import { useKonamiCode } from '../hooks/useKonamiCode'
import { withTheme } from './withTheme'

const CommandPalette = lazy(() => import('./CommandPalette').then(module => ({ default: module.CommandPalette })))

function SiteHeader({ pathname }: { pathname: string }) {
  useKeyboardNav()
  const onKonami = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    import('../lib/gsap').then(({ gsap }) => {
      gsap.fromTo(document.querySelectorAll('h1, h2, h3, .display'), { color: '#ffffff' }, { clearProps: 'color', duration: 0.8, ease: 'power2.out' })
    })
  }, [])
  useKonamiCode(onKonami)
  const { open, setOpen, toggle } = useCommandPalette()
  const [searchMounted, setSearchMounted] = useState(false)
  // Keep the loaded panel mounted so closing restores focus and cancels requests.
  if (open && !searchMounted) setSearchMounted(true)
  const close = useCallback(() => setOpen(false), [setOpen])
  return <><Nav pathname={pathname} onOpenSearch={toggle} searchOpen={open} />
    {searchMounted && <Suspense fallback={open ? <span role="status" className="sr-only">Loading search…</span> : null}>
      <CommandPalette open={open} onClose={close} />
    </Suspense>}
  </>
}

export default withTheme(SiteHeader)
