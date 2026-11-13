import type { ReactNode } from 'react'
import { Button } from '@n3wth/ui/primitives'
import { SiteSection, SiteHeading, SiteText, SiteDocSection, SiteDocList } from '@n3wth/ui/site'

export interface AssistantSmsLine {
  /** Assistant service name, e.g. "Elsa". */
  name: string
  /** Route path without a leading slash. */
  slug: string
  /** E.164 number, e.g. "+14157180992". */
  number: string
  /** Human-readable number, e.g. "+1 (415) 718-0992". */
  display: string
  /** Subject used to start the intro's second sentence ("She", or the name). */
  subject: string
  /** Object used in "How to text …" ("her", or the name). */
  object: string
  /** 512×512 glyph drawn in white over the black tile. */
  glyph: ReactNode
}

const FEATURES = [
  { title: 'Email', copy: 'Draft, triage, and follow up when Oliver asks.' },
  { title: 'Scheduling', copy: 'Coordinate times and reminders over SMS.' },
  { title: 'Purchases', copy: 'Run authorized buys and status updates.' },
] as const

const strong = (children: ReactNode) => <strong style={{ color: 'var(--ink)' }}>{children}</strong>

export default function AssistantSmsPage({ line }: { line: AssistantSmsLine }) {
  const { name, display } = line
  const sms = `sms:${line.number}`

  const features = [
    ...FEATURES,
    { title: 'Tasks', copy: `Anything else Oliver greenlights for ${name}.` },
  ]

  return (
    <section aria-label={name}>
      <header
        className="n3wth-site-page-header n3wth-site-page-header--center site-content-gutter mx-auto max-w-3xl"
      >
        <svg
          className="assistant-hero-mark"
          viewBox="0 0 512 512"
          width="160"
          height="160"
          role="img"
          aria-label={name}
          focusable="false"
        >
          <rect width="512" height="512" rx="96" fill="#000" />
          {line.glyph}
        </svg>
        <div className="n3wth-site-page-header-copy assistant-hero-copy">
          <SiteHeading variant="page" level={1}>
            {name}
          </SiteHeading>
          <SiteText className="n3wth-site-description assistant-hero-description">
            A personal AI assistant in your texts.
          </SiteText>
          <div className="n3wth-site-actions assistant-hero-actions">
            <Button label={display} variant="primary" size="md" href={sms} />
          </div>
        </div>
      </header>

      <SiteSection className="site-content-gutter mx-auto max-w-3xl">
        <SiteDocSection>
          <SiteText variant="lede">
            {name} is the AI assistant service name for messaging operated by Oliver
            Grosvenor-Newth (sole proprietor) on n3wth.com. {line.subject} helps with email,
            scheduling, purchases, and other tasks Oliver authorizes, over a simple text thread.
          </SiteText>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature.title} className="flex flex-col gap-3">
                <SiteHeading variant="item" level={3}>
                  {feature.title}
                </SiteHeading>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
                  {feature.copy}
                </p>
              </li>
            ))}
          </ul>
        </SiteDocSection>

        <SiteDocSection title={`How to text ${line.object}`}>
          <SiteText>
            There is no website signup form, phone number field, or SMS consent checkbox on
            n3wth.com. Consumers opt in only by voluntarily texting {strong('START')} to{' '}
            {strong(display)} after reading this page.
            SMS is optional and is not required to use n3wth.com.
          </SiteText>
          <div className="flex flex-col gap-3">
            <SiteHeading variant="item" level={3}>
              <a href={sms} className="link-underline">
                {display}
              </a>
            </SiteHeading>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
              Tap to open Messages and send START.
            </p>
            <Button label={`Text ${name}`} variant="primary" size="md" href={sms} />
          </div>
        </SiteDocSection>

        <SiteDocSection title="What you will get">
          <SiteText>
            By opting in, you consent to receive automated assistant and transactional SMS (and MMS
            when needed) from {strong(display)}, including:
          </SiteText>
          <SiteDocList
            items={[
              `Two-way assistant conversations (replies to texts you send ${name})`,
              `Account and verification codes when ${name} is completing a task for Oliver that requires SMS OTP`,
              `Transactional notices about tasks ${name} is running (confirmations, status, reminders Oliver has authorized)`,
              `Occasional service notices about the ${name} / n3wth assistant line`,
            ]}
          />
          <SiteText>
            Message frequency varies. You may receive multiple messages in a day when actively
            texting {name} or when a verification flow is in progress; otherwise expect low volume
            (typically under 50 messages per month). {strong('Message and data rates may apply.')}
          </SiteText>
        </SiteDocSection>

        <SiteDocSection>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            <li className="flex flex-col gap-5">
              <SiteHeading variant="item" level={3}>
                Opt in
              </SiteHeading>
              <SiteDocList
                items={[
                  <>
                    Text {strong('START')} to{' '}
                    <a href={sms} className="link-underline">
                      {display}
                    </a>{' '}
                    after reading the disclosures on this page
                  </>,
                  'Consent is voluntary and is not a condition of purchase',
                ]}
              />
            </li>
            <li className="flex flex-col gap-5">
              <SiteHeading variant="item" level={3}>
                Opt out / help
              </SiteHeading>
              <SiteDocList
                items={[
                  <>
                    Reply {strong('STOP')} to any message from the {name} number
                  </>,
                  <>
                    Or email{' '}
                    <a href="mailto:hey@n3wth.com" className="link-underline">
                      hey@n3wth.com
                    </a>{' '}
                    with your number
                  </>,
                  <>
                    Reply {strong('HELP')} for help anytime
                  </>,
                ]}
              />
            </li>
          </ul>
          <SiteText>
            After opting out you will receive a one-time confirmation and no further messages will
            be sent unless you opt in again (for example reply START). SMS is optional. You can use
            n3wth.com without texting {name}. Consent to receive messages is voluntary and is not
            required to browse the site, contact Oliver, or use other n3wth.com services.
          </SiteText>
          <SiteText>
            By texting START to {display} after reading this page, you
            agree to receive automated assistant and transactional SMS messages from {name}{' '}
            (n3wth.com / Oliver Grosvenor-Newth, sole proprietor). Message frequency varies. Message
            and data rates may apply. Reply STOP to opt out. Consent is not a condition of purchase.
            Reply HELP for help. See{' '}
            <a href="/privacy" className="link-underline">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="/terms" className="link-underline">
              Terms of Service
            </a>
            .
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="Privacy">
          <SiteText>
            Your phone number is used only to deliver {name} / n3wth assistant-related SMS and to
            operate conversations you start. We do {strong('not')} sell or share mobile numbers with
            third parties or affiliates for their marketing. See the full{' '}
            <a href="/privacy" className="link-underline">
              Privacy Policy
            </a>
            .{' '}
            <a href="/terms" className="link-underline">
              Terms of Service
            </a>
            .
          </SiteText>
        </SiteDocSection>

        <SiteText variant="supporting" as="p" className="n3wth-site-doc-meta">
          Last updated September 2026
        </SiteText>
      </SiteSection>
    </section>
  )
}
