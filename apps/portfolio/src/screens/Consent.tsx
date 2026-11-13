import { withTheme } from '../components/withTheme'
import { PageHeader, SiteSection, SiteDocSection, SiteDocList, SiteText } from '@n3wth/ui/site'

function Consent() {

  return (
    <section aria-label="SMS messaging consent">
      <PageHeader
        align="center"
        className="site-content-gutter mx-auto max-w-3xl"
        title="SMS Messaging Consent"
        description={<>Last updated: February 2026</>}
      />

      <SiteSection className="site-content-gutter mx-auto max-w-3xl">
        <SiteDocSection title="About They Won't Shut Up">
          <SiteText>
            <a
              href="https://theywontshutup.com"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline"
            >
              They Won&apos;t Shut Up
            </a>{' '}
            is an AI voice hotline operated by n3wth.com. Users call{' '}
            <strong style={{ color: 'var(--ink)' }}>+1 (855) 580-0508</strong> to have conversations
            with AI characters powered by ElevenLabs Conversational AI.
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="What Messages You May Receive">
          <SiteText>
            By opting in, you consent to receive the following types of SMS messages from{' '}
            <strong style={{ color: 'var(--ink)' }}>+1 (855) 580-0508</strong>:
          </SiteText>
          <SiteDocList
            items={[
              'Call follow-up messages (e.g., a summary or check-in after your call)',
              'Service notifications (e.g., updates about the hotline or new characters)',
            ]}
          />
          <SiteText>
            Messages are sent at a frequency of no more than{' '}
            <strong style={{ color: 'var(--ink)' }}>5 messages per month</strong>. Message and data
            rates may apply.
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="How to Opt In">
          <SiteText>
            You opt in to receive SMS messages by calling the hotline at{' '}
            <strong style={{ color: 'var(--ink)' }}>+1 (855) 580-0508</strong>. By placing a call,
            you consent to receive follow-up text messages at the phone number you called from.
          </SiteText>
          <div
            className="rounded-lg border p-5"
            style={{ borderColor: 'var(--rail-strong)', background: 'color-mix(in srgb, var(--ink) 4%, transparent)' }}
          >
            <p className="text-base leading-relaxed" style={{ color: 'var(--ink)' }}>
              By calling +1 (855) 580-0508, you agree to receive automated SMS messages from They
              Won&apos;t Shut Up (n3wth.com). You can opt out at any time by replying STOP. Message
              frequency varies, up to 5 msgs/month. Msg &amp; data rates may apply.
            </p>
          </div>
        </SiteDocSection>

        <SiteDocSection title="How to Opt Out">
          <SiteText>You can stop receiving messages at any time by:</SiteText>
          <SiteDocList
            items={[
              <>Replying <strong style={{ color: 'var(--ink)' }}>STOP</strong> to any message from +1 (855) 580-0508</>,
              <>Emailing <a href="mailto:hey@n3wth.com" className="link-underline">hey@n3wth.com</a> with your phone number and a request to unsubscribe</>,
            ]}
          />
          <SiteText>
            After opting out, you will receive a one-time confirmation message and no further
            messages will be sent.
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="Help">
          <SiteText>
            Reply <strong style={{ color: 'var(--ink)' }}>HELP</strong> to any message for
            assistance, or contact{' '}
            <a href="mailto:hey@n3wth.com" className="link-underline">hey@n3wth.com</a>.
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="Privacy">
          <SiteText>
            Your phone number is used solely for delivering SMS messages related to the hotline. We
            do not sell, share, or use your number for any other purpose. See our full{' '}
            <a href="/privacy" className="link-underline">Privacy Policy</a> for
            more information.
          </SiteText>
          <SiteText>
            For the personal assistant SMS lines, see{' '}
            <a href="/elsa" className="link-underline">/elsa</a> (Elsa, +1 463
            258-8004) and{' '}
            <a href="/billy" className="link-underline">/billy</a> (Billy, +1 415
            718-0992).
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="Contact">
          <SiteText>
            n3wth.com - Oliver Newth
            <br />
            <a href="mailto:hey@n3wth.com" className="link-underline">hey@n3wth.com</a>
          </SiteText>
        </SiteDocSection>
      </SiteSection>
    </section>
  )
}
export default withTheme(Consent)
