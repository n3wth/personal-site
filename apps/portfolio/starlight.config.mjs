import starlight from '@astrojs/starlight'
import { googleAnalyticsScript } from '@n3wth/site-config/analytics'

export default function docs() {
  return starlight({
    title: 'n3wth docs',
    description: 'Developer documentation for @n3wth/ui and the r3 memory server.',
    favicon: '/favicon.svg',
    disable404Route: true,
    components: {
      Head: './src/components/docs/Head.astro',
      SiteTitle: './src/components/docs/SiteTitle.astro',
      PageTitle: './src/components/docs/PageTitle.astro',
    },
    customCss: ['./src/styles/docs.css'],
    head: [
      { tag: 'script', content: googleAnalyticsScript },
      { tag: 'meta', attrs: { property: 'og:image', content: 'https://n3wth.com/og-image.png' } },
      { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://n3wth.com/og-image.png' } },
      { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
    ],
    social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/n3wth/personal-site' }],
    editLink: { baseUrl: 'https://github.com/n3wth/personal-site/edit/main/apps/portfolio/' },
    sidebar: [
      { label: 'Overview', slug: 'docs' },
      {
        label: 'UI',
        items: [
          { label: 'Getting started', slug: 'docs/ui/quickstart' },
          { label: 'Components', slug: 'docs/ui/primitives' },
          { label: 'Page layouts', slug: 'docs/ui/layouts' },
          { label: 'Theming', slug: 'docs/ui/theme-provider' },
          { label: 'API reference', slug: 'docs/ui/entry-points' },
          'docs/ui/troubleshooting',
          {
            label: 'Recipes', collapsed: true,
            items: ['docs/ui/tailwind', 'docs/ui/scroll-reset', 'docs/ui/reading-outline', 'docs/ui/og-images'],
          },
        ],
      },
      {
        label: 'r3',
        items: [
          { label: 'Getting started', slug: 'docs/r3/quickstart' },
          { label: 'Working with memory', slug: 'docs/r3/memory-tools' },
          'docs/r3/configuration',
          'docs/r3/troubleshooting',
          {
            label: 'Reference', collapsed: true,
            items: ['docs/r3/transport', 'docs/r3/cache-tools', 'docs/r3/knowledge-graph'],
          },
        ],
      },
      { label: 'Contribute', collapsed: true, items: ['docs/workspace', 'docs/publishing'] },
    ],
  })
}
