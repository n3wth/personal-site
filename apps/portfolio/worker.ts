import { handlePortfolioApi } from './api/runtime'
import type { ShipReviewEnv } from './api/ship-review'
import type { SubscribeEnv } from './api/subscribe'

interface Env extends SubscribeEnv, ShipReviewEnv {
  ASSETS: { fetch(request: Request): Promise<Response> }
  RESEND_API_KEY?: string
  RESEND_SEGMENT_ID?: string
  SUBSCRIBE?: { limit(options: { key: string }): Promise<{ success: boolean }> }
}

function cacheControl(path: string): string {
  if (path.startsWith('/_astro/') || path.startsWith('/assets/') || path.startsWith('/fonts/')) return 'public, max-age=31536000, immutable'
  return 'public, max-age=0, must-revalidate'
}

const SECURITY_HEADERS: Array<[string, string]> = [
  ['X-Frame-Options', 'DENY'],
  ['X-Content-Type-Options', 'nosniff'],
  ['Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
]

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [key, value] of SECURITY_HEADERS) if (!headers.has(key)) headers.set(key, value)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

function withCacheHeaders(request: Request, response: Response): Response {
  if (!response.ok) return response
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', cacheControl(new URL(request.url).pathname))
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export default {
  async fetch(request: Request, env: Env, context?: { waitUntil(task: Promise<unknown>): void }): Promise<Response> {
    const url = new URL(request.url)
    if (url.hostname === 'skills.n3wth.com') {
      if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
        return withSecurityHeaders(Response.json({ error: 'service_retired' }, {
          status: 410,
          headers: { 'Cache-Control': 'no-store' },
        }))
      }
      const destination = url.pathname === '/install.sh' ? '/skills/install.sh' : '/docs/skills'
      return Response.redirect(`https://n3wth.com${destination}`, 308)
    }
    const apiResponse = await handlePortfolioApi(request, env, fetch, {
      waitUntil: context ? task => context.waitUntil(task) : undefined,
    })
    if (apiResponse) return withSecurityHeaders(apiResponse)
    return withCacheHeaders(request, await env.ASSETS.fetch(request))
  },
}
