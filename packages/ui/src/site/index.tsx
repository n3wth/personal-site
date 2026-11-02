'use client'

import { useEffect, useId, useRef, useState, type ComponentProps, type HTMLAttributes, type ReactNode } from 'react'
import { Heading, Text } from '@astryxdesign/core'
import { cn } from '../utils/cn'

export { N3wthProvider } from '../theme/N3wthProvider'
export type { N3wthProviderProps } from '../theme/N3wthProvider'
export { n3wthTheme } from '../theme/n3wthTheme'
export { useRouteScrollReset } from '../hooks/useRouteScrollReset'
export { ReadingOutline } from './ReadingOutline'
export type { ReadingOutlineProps } from './ReadingOutline'

export interface SiteContainerProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'main' | 'section' | 'article'
}

export function SiteContainer({ as: Component = 'div', className, ...props }: SiteContainerProps) {
  return <Component className={cn('n3wth-site-container', className)} {...props} />
}

export function SiteSection({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn('n3wth-site-section', className)} {...props} />
}

/** In-flow section or documentation links. Sticky navigation owns active state separately. */
export function SiteSectionLinks({ className, ...props }: ComponentProps<'nav'>) {
  return <nav className={cn('n3wth-site-section-links', className)} {...props} />
}

export interface SiteHeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'color'> {
  variant?: 'page' | 'section' | 'item'
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

const headingLevels = { page: 1, section: 2, item: 3 } as const

export function SiteHeading({ variant = 'section', level, className, children, ...props }: SiteHeadingProps) {
  return <Heading level={level ?? headingLevels[variant]} className={cn('n3wth-site-heading', `n3wth-site-heading--${variant}`, className)} {...props}>{children}</Heading>
}

export interface SiteTextProps extends Omit<HTMLAttributes<HTMLElement>, 'color'> {
  /** lede is body-sized Astryx Text with larger site CSS. */
  variant?: 'body' | 'supporting' | 'lede'
  as?: 'p' | 'span' | 'div'
}

export function SiteText({ variant = 'body', as = 'p', className, children, ...props }: SiteTextProps) {
  const textType = variant === 'lede' ? 'body' : variant
  return <Text as={as} type={textType} display={as === 'span' ? 'inline' : 'block'} className={cn('n3wth-site-text', `n3wth-site-text--${variant}`, className)} {...props}>{children}</Text>
}

/** Titled stack for long-form / legal pages. Rhythm lives in site.css. */
export interface SiteDocSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  level?: 2 | 3
}

export function SiteDocSection({ title, level = 2, className, children, ...props }: SiteDocSectionProps) {
  return (
    <div className={cn('n3wth-site-doc-section', className)} {...props}>
      {title != null ? (
        <SiteHeading variant="section" level={level}>
          {title}
        </SiteHeading>
      ) : null}
      {children}
    </div>
  )
}

/** Disc list with site doc spacing (replaces per-page BulletList helpers). */
export function SiteDocList({ items, className, ...props }: { items: ReactNode[] } & Omit<ComponentProps<'ul'>, 'children'>) {
  return (
    <ul className={cn('n3wth-site-doc-list', className)} {...props}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode
  level?: 1 | 2
  description?: ReactNode
  actions?: ReactNode
  aside?: ReactNode
  align?: 'start' | 'center'
  spacing?: 'default' | 'compact'
}

export function PageHeader({ title, level = 1, description, actions, aside, align = 'start', spacing = 'default', className, ...props }: PageHeaderProps) {
  return (
    <header className={cn('n3wth-site-page-header', aside != null && 'n3wth-site-page-header--split', align === 'center' && 'n3wth-site-page-header--center', spacing === 'compact' && 'n3wth-site-page-header--compact', className)} {...props}>
      <div className="n3wth-site-page-header-copy">
        <SiteHeading variant={level === 1 ? 'page' : 'section'} level={level}>{title}</SiteHeading>
        {description != null && <SiteText className="n3wth-site-description">{description}</SiteText>}
        {/* Actions always follow the copy. Never place them beside it, where
            a short label drifts to the far right of the heading it belongs to. */}
        {actions != null && <div className="n3wth-site-actions">{actions}</div>}
      </div>
      {aside != null && <div className="n3wth-site-page-header-aside">{aside}</div>}
    </header>
  )
}

export interface SiteNavigationProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  brand: ReactNode
  links: ReactNode
  actions?: ReactNode
  navigationLabel?: string
  navigationId?: string
  menuLabel?: string
  menuContent?: ReactNode
  collapseAt?: 'md' | 'lg'
  /** Use a flush header and attached menu on compact screens. */
  compactBar?: boolean
  /** Disable scripted controls until the consuming island has hydrated. */
  controlsReady?: boolean
}

/** Router links remain app-owned; layout and disclosure behavior live here. */
export function SiteNavigation({ brand, links, actions, navigationLabel = 'Primary', navigationId, menuLabel = 'Open menu', menuContent, collapseAt = 'md', compactBar = false, controlsReady = true, className, ...props }: SiteNavigationProps) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const generatedId = useId()
  const menuId = navigationId ?? `site-navigation-${generatedId}`
  const button = useRef<HTMLButtonElement>(null)
  const header = useRef<HTMLElement>(null)
  const hasMenuContent = menuContent != null

  useEffect(() => {
    if (!compactBar) return
    const update = () => setScrolled(window.scrollY > 0)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [compactBar])

  useEffect(() => {
    if (!open) return
    header.current?.querySelector<HTMLAnchorElement>(hasMenuContent ? '.n3wth-site-navigation-menu a' : '.n3wth-site-navigation-links a')?.focus()
    const desktop = window.matchMedia(`(min-width: ${collapseAt === 'lg' ? 1024 : 768}px)`)
    const collapse = () => {
      if (desktop.matches) setOpen(false)
    }
    const dismiss = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    desktop.addEventListener('change', collapse)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
      desktop.removeEventListener('change', collapse)
    }
  }, [open, collapseAt, hasMenuContent])

  return (
    <header {...props} ref={header} data-scrolled={scrolled} data-open={open} className={cn('n3wth-site-navigation', `n3wth-site-navigation--${collapseAt}`, compactBar && 'n3wth-site-navigation--compact-bar', className)}>
      <div className="n3wth-site-navigation-island" data-nosnippet>
        <div className="n3wth-site-navigation-brand" onClick={() => setOpen(false)}>{brand}</div>
        <nav id={menuId} aria-label={navigationLabel} className="n3wth-site-navigation-links" data-open={open} onClick={(event) => {
          if ((event.target as Element).closest('a')) setOpen(false)
        }}>{hasMenuContent ? <>
          <div className="n3wth-site-navigation-inline">{links}</div>
          <div className="n3wth-site-navigation-menu">{menuContent}</div>
        </> : links}</nav>
        <div className="n3wth-site-navigation-actions" onClick={() => setOpen(false)}>{actions}</div>
        <button ref={button} type="button" disabled={!controlsReady} className="n3wth-site-navigation-toggle" aria-label={open ? 'Close menu' : menuLabel} aria-controls={menuId} aria-expanded={open} onClick={() => setOpen(value => !value)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>
    </header>
  )
}

export interface SiteSignupProps extends Omit<ComponentProps<'form'>, 'onSubmit'> {
  /** Receives the trimmed address. Reject to show the error state. The sink is app-owned. */
  onSubmit: (email: string) => void | Promise<void>
  label?: ReactNode
  buttonLabel?: ReactNode
  successMessage?: ReactNode
  errorMessage?: ReactNode
  compact?: boolean
  disabled?: boolean
}

type SignupStatus = 'idle' | 'sending' | 'done' | 'error'

/** One-line email capture for footers. Native controls, app-owned delivery. */
export function SiteSignup({ onSubmit, label = 'Notes and new work across design, technology, AI, and the things I’m exploring.', buttonLabel = 'Subscribe', successMessage = 'Thanks. You are on the list.', errorMessage = 'That did not go through. Try again.', compact = false, disabled = false, className, ...props }: SiteSignupProps) {
  const id = useId()
  const [status, setStatus] = useState<SignupStatus>('idle')
  const busy = disabled || status === 'sending' || status === 'done'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const email = new FormData(form).get('email')
    if (typeof email !== 'string' || !form.reportValidity()) return
    setStatus('sending')
    try {
      await onSubmit(email.trim())
      form.reset()
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <form {...props} className={cn('n3wth-site-signup', compact && 'n3wth-site-signup--compact', 'ph-no-capture', 'ph-mask', className)} data-ph-no-capture onSubmit={handleSubmit} noValidate={false}>
      <label htmlFor={id} className="n3wth-site-signup-label">{label}</label>
      <div className="n3wth-site-signup-row">
        <input id={id} name="email" type="email" required autoComplete="email" inputMode="email" placeholder={compact ? 'Email to subscribe' : 'you@example.com'} disabled={busy} className="ph-no-capture ph-mask" data-ph-no-capture />
        <button type="submit" disabled={busy} aria-label={compact ? 'Subscribe' : undefined}>{compact ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg> : buttonLabel}</button>
      </div>
      {/* Established before it changes so assistive technology announces the update.
          Not role="status": shared chrome must not duplicate a page's own status element. */}
      <p aria-live="polite" className="n3wth-site-signup-status">
        {status === 'done' ? successMessage : status === 'error' ? errorMessage : null}
      </p>
    </form>
  )
}

export interface SiteFooterProps extends HTMLAttributes<HTMLElement> {
  brand?: ReactNode
  links?: ReactNode
  sourceHref?: string
  legalLinks?: ReactNode
  /** Usually a SiteSignup. Rendered above the identity row. */
  signup?: ReactNode
  /** Place a compact signup beside the footer links. */
  inlineSignup?: boolean
  /** Separate the footer from adjacent content with a rule. */
  separator?: boolean
}

export function SiteFooter({ brand = <a href="https://n3wth.com">Oliver Newth</a>, links, sourceHref = 'https://github.com/n3wth/personal-site', legalLinks, signup, inlineSignup = false, separator = true, children, className, ...props }: SiteFooterProps) {
  const footerLinks = links ?? <>
    <a href="https://n3wth.com/library">Library</a>
    <a href="https://skills.n3wth.com">Skills</a>
    <a href="https://r3.n3wth.com">r3</a>
    <a href="https://docs.n3wth.com">Docs</a>
    <a href="https://n3wth.com/contact">Contact</a>
    <a href={sourceHref}>GitHub</a>
    {legalLinks}
  </>
  return <footer {...props} className={cn('n3wth-site-footer', !separator && 'n3wth-site-footer--unruled', className)}>
    <SiteContainer data-nosnippet>
      {signup != null && !inlineSignup && <div className="n3wth-site-footer-signup">{signup}</div>}
      <div className="n3wth-site-footer-row">
        {brand != null && <div className="n3wth-site-footer-brand">{brand}</div>}
        <nav aria-label="Footer" className="n3wth-site-footer-links">{footerLinks}</nav>
        {signup != null && inlineSignup && <div className="n3wth-site-footer-inline-signup">{signup}</div>}
      </div>
      {children != null && <div className="n3wth-site-footer-meta">{children}</div>}
    </SiteContainer>
  </footer>
}
