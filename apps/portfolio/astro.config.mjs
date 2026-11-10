import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import docs from './starlight.config.mjs'

export default defineConfig({
  site: 'https://n3wth.com',
  output: 'static',
  integrations: [react(), docs()],
  redirects: {
    '/support': '/contact#support',
    '/docs/ui/api-and-recipes': '/docs/ui/entry-points',
    '/docs/ui/primitives-and-themes': '/docs/ui/primitives',
    '/docs/ui/site-compositions': '/docs/ui/layouts',
    '/docs/r3/tools': '/docs/r3/memory-tools',
    '/docs/r3/mcp': '/docs/r3/transport',
    '/projects/elephant-goldfish': 'https://egm.dev',
    '/docs/elephant-goldfish/quickstart': 'https://github.com/google/elephant-goldfish-model#install',
    '/docs/elephant-goldfish/workflows': 'https://github.com/google/elephant-goldfish-model#choose-a-skill',
  },
  vite: {
    envPrefix: ['PUBLIC_', 'VITE_'],
    server: { proxy: { '/api/search': { target: 'https://n3wth.com', changeOrigin: true } } },
  },
})
