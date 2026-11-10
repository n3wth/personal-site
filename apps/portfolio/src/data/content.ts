import { siteUrls } from './sites'

export const siteConfig = {
  name: 'Oliver Newth',
  title: 'Oliver Newth — AI Product Lead at Google',
  description: 'AI product lead at Google. Previously at Covariant, Meta, and Microsoft. Independent AI projects and large-scale light art.',
  email: 'hey@n3wth.com',
  social: {
    github: 'https://github.com/n3wth',
    linkedin: 'https://www.linkedin.com/in/n3wth',
  },
  gardenSite: '/thinking',
}

export const sections = {
  work: { name: 'Work', href: '/work', description: 'Building AI products.' },
  projects: { name: 'Projects', href: '/projects', description: 'Tools and experiments.' },
  art: { name: 'Art', href: '/art', description: 'Large-scale light installations.' },
  thinking: { name: 'Thinking', href: '/thinking', description: 'AI, design, and everyday life.' },
  library: { name: 'Library', href: '/library', description: 'Notes and reusable components.' },
  contact: { name: 'Contact', href: '/contact', description: 'Product, AI, art, or coffee.' },
} as const

export const navigation = Object.values(sections)

export interface Metric {
  value: string
  label: string
}

export interface Experience {
  id: string
  company: string
  role: string
  period: string
  /** One confident line — the ship log reads like an index, not a résumé. */
  summary: string
  metric?: Metric
}

export const experiences: Experience[] = [
  {
    id: 'google',
    company: 'Google',
    role: 'AI Product Lead',
    period: '2025 to present',
    summary:
      'Product development for AI platforms that integrate DeepMind models into production software. Part of the team behind EGM, Google’s open-source plugin for designing and reviewing software with agents.',
  },
  {
    id: 'covariant',
    company: 'Covariant',
    role: 'Staff Product Manager',
    period: '2022 – 24',
    summary:
      'Product work on computer vision for warehouse robotics.',
  },
  {
    id: 'meta',
    company: 'Meta',
    role: 'Product Manager',
    period: '2017 – 22',
    summary:
      'Ran video calling across Instagram and Portal; before that, core growth and integrity.',
    metric: { value: '2020', label: 'Build Social Value Award' },
  },
  {
    id: 'microsoft',
    company: 'Microsoft',
    role: 'Product Manager, Azure',
    period: '2014 – 17',
    summary:
      'Product on Azure Cognitive Services; the job was getting enterprises to trust AI enough to adopt it.',
  },
]

/** One quiet line under the ship log — the foundation before it. */
export const education =
  'MIT MEng, High Performance Structures (Kennedy Scholar). Warwick Civil Engineering, First Class.'

export interface CreditLink {
  /** Must appear verbatim in the installation's tagline. */
  text: string
  href: string
}

export interface Installation {
  id: string
  title: string
  /** Credits only — place detail belongs in `location`. */
  tagline: string
  /** Institutions named in the tagline that have a public URL to point at. */
  creditLinks?: CreditLink[]
  year: string
  location: string
  type: 'burning-man' | 'public-art' | 'memorial' | 'interactive'
  image: string
  imageAlt: string
  lightBg?: boolean
}

export const installations: Installation[] = [
  {
    id: 'them',
    title: 'THEM',
    tagline:
      'Lighting and Circle of Light ring. Design: Simón Malvaez. Fabrication: Brenden Blaine Darby. Fractured Atlas',
    creditLinks: [
      {
        text: 'Fractured Atlas',
        href: 'https://fundraising.fracturedatlas.org/them-a-burning-man-art-piece',
      },
    ],
    year: '2022',
    location: 'Black Rock City, Nevada',
    type: 'burning-man',
    image: '/images/installations/them.webp',
    imageAlt: 'THEM sculpture at Burning Man casting dramatic shadows on desert floor',
    lightBg: true,
  },
  {
    id: 'pink-triangle',
    title: 'Pink Triangle',
    tagline:
      'Project coordination as part of Illuminate on Patrick Carney’s Pride memorial.',
    creditLinks: [
      {
        text: 'Illuminate',
        href: 'https://illuminate.org/projects/the-pink-triangle/',
      },
    ],
    year: '2022',
    location: 'Twin Peaks, San Francisco',
    type: 'memorial',
    image: '/images/installations/pink-triangle.webp',
    imageAlt: 'Pink Triangle LED installation illuminating Twin Peaks during Pride Month',
  },
  {
    id: 'circle-of-light',
    title: 'Circle of Light',
    tagline: 'World AIDS Day memorial for the National AIDS Memorial.',
    creditLinks: [
      {
        text: 'National AIDS Memorial',
        href: 'https://www.aidsmemorial.org/grove',
      },
    ],
    year: '2021',
    location: 'AIDS Memorial Grove, San Francisco',
    type: 'memorial',
    image: '/images/installations/circle-of-light.webp',
    imageAlt: 'Circle of Light illuminated memorial in Golden Gate Park',
  },
]

export interface Project {
  id: string
  name: string
  description: string
  tech: string[]
  url: string
  github?: string
  docs?: string
  question?: string
  focus?: string
}

export const projects: Project[] = [
  {
    id: 'elephant-goldfish',
    name: 'elephant-goldfish',
    description: 'EGM is Google’s open-source plugin for designing software with coding agents. One agent drafts the specification with full project context, and fresh reviewers test it before any code is written. I was part of the team that built it.',
    tech: ['Agent Skills'],
    url: 'https://egm.dev',
    github: 'https://github.com/google/elephant-goldfish-model',
  },
  {
    id: 'markup',
    name: 'markup',
    description: 'An independent prototype I built to explore personal AI agents working alongside people in shared documents and chat. Visible cursors and edits make agent activity easier to follow.',
    tech: ['TypeScript', 'React', 'Tiptap'],
    url: 'https://github.com/n3wth/markup',
    github: 'https://github.com/n3wth/markup',
  },
  {
    id: 'r3',
    name: 'r3',
    focus: 'Personal agents',
    question: 'Useful context beyond a single conversation',
    description: 'A memory service for AI apps with semantic search and a knowledge graph. An MCP interface makes that context available across tools.',
    tech: ['TypeScript', 'Redis', 'Vector Embeddings', 'MCP'],
    url: '/projects/r3',
    docs: '/docs/r3/quickstart',
    github: 'https://github.com/n3wth/r3',
  },
  {
    id: 'ui',
    name: '@n3wth/ui',
    focus: 'Shared foundation',
    question: 'A common visual system for individual sites',
    description: 'A React component library with theme tokens, typography, native controls, and page compositions shared across the n3wth sites.',
    tech: ['React', 'TypeScript', 'Tailwind CSS'],
    url: '/projects/ui',
    docs: '/docs/ui/quickstart',
    github: 'https://github.com/n3wth/personal-site/tree/main/packages/ui',
  },
  {
    id: 'hop-flights',
    name: 'hop.flights',
    description: 'A flight comparison tool that weighs cash fares against points and taxes.',
    tech: ['Next.js', 'AI SDK', 'Duffel'],
    url: siteUrls.hop,
  },
  {
    id: 'lunchmoney',
    name: 'lunchmoney.sh',
    description: 'An unofficial Lunch Money plugin for Claude, Codex, and Cursor. Ask about spending, budgets, and bills; access is read-only.',
    tech: ['MCP', 'TypeScript', 'Cloudflare'],
    url: siteUrls.lunch,
    github: 'https://github.com/n3wth/lunchmoney-mcp',
  },
]
