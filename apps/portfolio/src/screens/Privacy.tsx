import { withTheme } from '../components/withTheme'
import { PageHeader, SiteSection, SiteDocSection, SiteText } from '@n3wth/ui/site'

function Privacy() {

  return (
    <section aria-label="Privacy Policy">
      <PageHeader
        data-reveal
        align="center"
        className="site-content-gutter mx-auto max-w-3xl"
        title="Privacy Policy"
        description={<>Last updated: September 2026</>}
      />

      <SiteSection data-reveal className="site-content-gutter mx-auto max-w-3xl">
        <SiteDocSection title="Overview">
          <SiteText>
            n3wth.com is Oliver Newth&apos;s personal portfolio website. The following policy
            describes how the site and Oliver Newth&apos;s archived Elephant-Goldfish 0.1.0 adaptation handle information.
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="Information Collection">
          <SiteText>
            The portfolio pages on n3wth.com do not require accounts for browsing. When you use the
            SMS or voice lines described below, we collect the personal information needed to operate
            those services (for example your phone number and message content). Newsletter signup,
            hosting, and analytics may also process limited data as described in this policy.
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="Elephant-Goldfish 0.1.0 adaptation">
          <SiteText>
            The Elephant-Goldfish Model plugin (EGM) is published by Google and covered by its own
            privacy documentation. This section covers only the archived 0.1.0 bundle hosted on this site.
          </SiteText>
          <SiteText>
            Elephant-Goldfish 0.1.0 is a bundle of instructions and icons for Codex. It has no
            publisher-operated backend, telemetry, account system, or credential collection.
            Installing it does not send your prompts, code, or files to Oliver Newth.
          </SiteText>
          <SiteText>
            When you use the plugin, Codex processes the conversation, selected files, tool results,
            and review context under your account settings and OpenAI&apos;s applicable privacy terms.
            Fresh reviewers receive task context through Codex. Fresh context is not a security
            sandbox. Tools and integrations you choose may process data under their own policies.
            Share only information you are authorized to use.
          </SiteText>
          <SiteText>
            If you email support@n3wth.com, we receive your email address and the information you
            include. We use it to respond and resolve the request, and retain it only as needed
            for support or legal obligations. Do not include secrets or private source code.
            You can request access, correction, or deletion by emailing the same address.
            Requests concerning data held by OpenAI must be directed to OpenAI.
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="Newsletter">
          <SiteText>
            The footer form on n3wth.com collects an email
            address for notes and new work across design, technology, AI, and the things I’m exploring.
            Resend stores the address, segment membership, and selected topic subscription.
            Signup is immediate; no confirmation click is needed. New subscribers receive a welcome email.
            A subscription is recorded only after Resend confirms the contact, segment, and topic.
            You can unsubscribe from the link on any note or by emailing{' '}
            <a href="mailto:hey@n3wth.com" className="link-underline">hey@n3wth.com</a>. Resend
            keeps unsubscribe and suppression status.
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="They Won't Shut Up Hotline">
          <SiteText>
            When you call the They Won&apos;t Shut Up hotline at{' '}
            <strong style={{ color: 'var(--ink)' }}>+1 (855) 580-0508</strong>, your phone number
            may be collected for the purpose of delivering follow-up SMS messages. Your phone number
            is not sold or shared with third parties or affiliates for their marketing, and is not
            used for cross-context behavioral advertising. Twilio acts as our SMS processor to send
            and receive those messages. You can opt out of SMS at any time by replying STOP. Message frequency varies. Message and data rates may apply. See our{' '}
            <a href="/consent" className="link-underline">SMS Consent page</a> for
            full details.
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="Elsa and Billy assistant SMS">
          <SiteText>
            When you opt in to Elsa by texting START to{' '}
            <strong style={{ color: 'var(--ink)' }}>+1 (463) 258-8004</strong>, or to Billy at{' '}
            <strong style={{ color: 'var(--ink)' }}>+1 (415) 718-0992</strong>, your phone number
            and related SMS content/metadata may be collected to send and receive assistant-related
            SMS (conversations, verification codes, transactional notices). Your phone number is not
            sold or shared with third parties or affiliates for their marketing, and is not used for
            cross-context behavioral advertising. Messaging service providers process SMS for +1 463 258-8004 and +1 415 718-0992 on our behalf. Reply STOP to
            opt out. See{' '}
            <a href="/elsa" className="link-underline">https://n3wth.com/elsa</a>{' '}
            and{' '}
            <a href="/billy" className="link-underline">https://n3wth.com/billy</a>{' '}
            for full SMS consent details. Message frequency varies. Message and data rates may apply. Consent is not a condition of purchase. SMS is optional and is not required to browse n3wth.com, contact Oliver, or use other site services. The messaging program is operated by Oliver Grosvenor-Newth (sole proprietor); Elsa and Billy are AI assistant service names.
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="Analytics">
          <SiteText>
            The site uses PostHog to understand traffic. After a successful newsletter signup,
            PostHog may receive a newsletter_subscribed event that includes only the source site.
            Subscriber email is not sent to analytics.
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="Third-Party Services">
          <SiteText>
            Cloudflare hosts n3wth.com. Cloudflare may collect standard server logs, including IP addresses,
            for security and performance purposes. Refer to{' '}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline"
            >
              Cloudflare&apos;s Privacy Policy
            </a>{' '}
            for more information.
          </SiteText>
          <SiteText>
            Resend processes newsletter addresses as a service provider on our behalf. See{' '}
            <a
              href="https://resend.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline"
            >
              Resend&apos;s Privacy Policy
            </a>
            .
          </SiteText>
          <SiteText>
            Messaging service providers process SMS for the Elsa assistant line at +1 463 258-8004
            and the Billy assistant line at +1 415 718-0992 as service providers / processors on
            our behalf.
          </SiteText>
          <SiteText>
            Twilio processes SMS for the They Won&apos;t Shut Up hotline (+1 855 580-0508) as a
            service provider / processor on our behalf. Twilio may retain data under its own
            policies. See{' '}
            <a
              href="https://www.twilio.com/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline"
            >
              Twilio&apos;s Privacy Policy
            </a>
            .
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="External Links">
          <SiteText>
            The site contains links to external websites (GitHub, LinkedIn, etc.). Each external
            site maintains its own privacy policies and practices, which are not covered here.
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="SMS data retention">
          <SiteText>
            Phone numbers and SMS conversation content or metadata related to Elsa (+1 463 258-8004),
            Billy (+1 415 718-0992), and the They Won&apos;t Shut Up hotline (+1 855 580-0508) are retained for up to 24
            months, unless a longer period is needed for security, disputes, or legal obligations.
            On a verified STOP or deletion request, we delete or anonymize that data sooner when
            feasible. Messaging providers may retain copies under their own processor policies.
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="California privacy rights (CCPA/CPRA)">
          <SiteText>
            If you are a California resident, you have the right to know/access, delete, and
            correct personal information we hold about you, including a newsletter address held by
            Resend. n3wth.com does not sell personal information or share it for cross-context
            behavioral advertising as those terms are used under the CCPA/CPRA. To exercise these
            rights, email{' '}
            <a href="mailto:hey@n3wth.com" className="link-underline">hey@n3wth.com</a>. We will not
            discriminate against you for exercising your privacy rights. See also{' '}
            <a href="/terms" className="link-underline">Terms of Service</a> and
            the SMS consent pages at{' '}
            <a href="/elsa" className="link-underline">/elsa</a>,{' '}
            <a href="/billy" className="link-underline">/billy</a>, and{' '}
            <a href="/consent" className="link-underline">/consent</a>.
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="Contact">
          <SiteText>
            For questions about this privacy policy, please contact Oliver Newth at{' '}
            <a href="mailto:hey@n3wth.com" className="link-underline">hey@n3wth.com</a>.
          </SiteText>
        </SiteDocSection>

        <SiteDocSection title="Changes">
          <SiteText>
            The privacy policy may be updated periodically. Any changes will appear on this page
            with an updated revision date.
          </SiteText>
        </SiteDocSection>
      </SiteSection>
    </section>
  )
}

export default withTheme(Privacy)
