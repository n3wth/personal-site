import { answerFromSite, type SiteAnswerEnv } from './site-answers'
import { handleShipReview, type ShipReviewEnv } from './ship-review'
import { shipReviewApi } from '../src/lib/shipReview'
import { handleSubscribe, type SubscribeEnv, type SubscribeOptions } from './subscribe'
import { handleUnsubscribeRequest } from './unsubscribe'

type FetchImplementation = typeof fetch

const AI_SEARCH_ENDPOINT =
  'https://ns-5d811e45-2200-4a51-815d-66292af832dd.search.ai.cloudflare.com/chat/completions'

const NO_SEARCH_ANSWER = "No relevant information found. Try another search."

const SYSTEM_PROMPT = `You answer questions about n3wth.com and its related properties (the garden, @n3wth/ui) using ONLY the retrieved context. Never use outside knowledge about Oliver Newth or these projects.

Rules:
- This is search on Oliver Newth's personal website. Unqualified career and work experience queries refer to Oliver Newth, not the visitor. Do not infer facts about the visitor.
- Ground every claim in the retrieved context. If it doesn't answer the question, or the query is unintelligible, reply exactly: ${NO_SEARCH_ANSWER}
- Two to four sentences. No preamble, no "Based on the provided context".
- No marketing language, no emoji, no exclamation marks.
- Do not fabricate links yourself — citations are added separately.`

interface SearchChunk {
  item?: { key?: string; metadata?: { title?: string } }
}

function corsHeaders(): Headers {
  return new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
}

function json(body: unknown, status = 200, cors = false): Response {
  const headers = cors ? corsHeaders() : new Headers()
  headers.set('Content-Type', 'application/json; charset=utf-8')
  return new Response(JSON.stringify(body), { status, headers })
}

function decodeEntities(text: string): string {
  const entities: Record<string, string> = { '&quot;': '"', '&#39;': "'", '&amp;': '&', '&lt;': '<', '&gt;': '>' }
  return text.replace(/&quot;|&#39;|&amp;|&lt;|&gt;/g, (match) => entities[match])
}

function titleFromKey(key: string): string {
  try {
    const url = new URL(key)
    const slug = url.pathname.replace(/\/$/, '').split('/').filter(Boolean).pop()
    return slug ? slug.replace(/[-_]/g, ' ') : url.hostname
  } catch {
    return key
  }
}

function hasNoSearchAnswer(content: string): boolean {
  return content.includes(NO_SEARCH_ANSWER)
    || /(?:no (?:relevant|related) (?:information|results|content)|(?:documents?|context|sources?) (?:do(?:es)? not|doesn't|don't) (?:contain|provide|include)|(?:cannot|can't|unable to|not possible to) (?:provide|find) (?:a )?(?:relevant|answer))/i.test(content)
}

function citations(chunks: SearchChunk[], content: string): string {
  // Retrieval candidates are not evidence when the model abstains.
  if (hasNoSearchAnswer(content)) return ''
  const seen = new Set<string>()
  const links: string[] = []
  for (const chunk of chunks) {
    const key = chunk.item?.key
    if (!key || seen.has(key)) continue
    seen.add(key)
    const title = decodeEntities(chunk.item?.metadata?.title ?? titleFromKey(key))
    links.push(`[${title}](${key})`)
    if (links.length >= 4) break
  }
  return links.length ? ` Sources: ${links.join(', ')}.` : ''
}

function streamSearch(upstream: Response, responseHeaders: Headers): Response {
  const reader = upstream.body?.getReader()
  if (!reader) return json({ answer: "Couldn't reach the search index — try browsing instead.", fallback: true }, 200, true)
  let clientCanceled = false
  let released = false
  const cancelReader = async (reason?: unknown): Promise<void> => {
    if (released) return
    try {
      await reader.cancel(reason)
    } catch {
      // The upstream reader may already be closed or errored.
    } finally {
      released = true
      reader.releaseLock()
    }
  }
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const stream = new ReadableStream({
    async start(controller) {
      let buffer = ''
      let currentEvent = ''
      let chunks: SearchChunk[] = []
      let content = ''
      let model: string | undefined
      const emit = (value: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`))
      const emitDone = () => controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      const processLine = (line: string) => {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
          return
        }
        if (!line.startsWith('data: ')) return
        const data = line.slice(6)
        if (data === '[DONE]') {
          const sourceText = citations(chunks, content)
          if (sourceText) emit({ delta: sourceText })
          emitDone()
          return
        }
        try {
          if (currentEvent === 'chunks') {
            chunks = JSON.parse(data) as SearchChunk[]
          } else {
            const completion = JSON.parse(data) as { model?: string; choices?: Array<{ delta?: { content?: string } }> }
            if (completion.model && completion.model !== model) {
              model = completion.model
              emit({ model })
            }
            const delta = completion.choices?.[0]?.delta?.content
            if (delta) {
              content += delta
              emit({ delta })
            }
          }
        } catch {
          // Ignore malformed upstream events, matching the Vercel handler.
        }
        currentEvent = ''
      }
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          lines.forEach(processLine)
        }
        if (buffer) processLine(buffer)
        if (!content) {
          emit({ delta: "Couldn't generate an answer — try browsing instead." })
          emitDone()
        }
        controller.close()
      } catch (error) {
        await cancelReader(error)
        if (clientCanceled) return
        if (!content) emit({ delta: "Couldn't generate an answer — try browsing instead." })
        emitDone()
        controller.close()
      } finally {
        if (!released) {
          released = true
          reader.releaseLock()
        }
      }
    },
    cancel(reason) {
      clientCanceled = true
      return cancelReader(reason)
    },
  })
  responseHeaders.set('Content-Type', 'text/event-stream')
  responseHeaders.set('Cache-Control', 'no-cache')
  responseHeaders.set('Connection', 'keep-alive')
  return new Response(stream, { status: 200, headers: responseHeaders })
}

async function search(request: Request, fetchImpl: FetchImplementation, env: SiteAnswerEnv): Promise<Response> {
  const cors = corsHeaders()
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, true)
  const body = await request.json().catch(() => ({})) as { query?: string; stream?: boolean }
  if (!body.query || typeof body.query !== 'string' || body.query.length > 300) return json({ error: 'Invalid query' }, 400, true)
  // Resolve portfolio shorthand before retrieval, not just during generation.
  const query = body.query.trim().replace(/^(?:(?:my|your)\s+)?(work experience|career|professional background|resume|cv)[?.!]?$/i, 'Oliver Newth $1')
  if (env.AI) return json(await answerFromSite(query, env, request), 200, true)
  try {
    const upstream = await fetchImpl(AI_SEARCH_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }], max_tokens: 180, temperature: 0.3, stream: Boolean(body.stream) }), signal: request.signal })
    if (!upstream.ok) return json({ answer: "Couldn't reach the search index — try browsing instead.", fallback: true }, 200, true)
    if (body.stream && upstream.body) return streamSearch(upstream, cors)
    const data = await upstream.json() as { model?: string; choices?: Array<{ message?: { content?: string } }>; chunks?: SearchChunk[] }
    const content = data.choices?.[0]?.message?.content
    return content ? json({ answer: hasNoSearchAnswer(content) ? NO_SEARCH_ANSWER : content.trim() + citations(data.chunks ?? [], content), ...(data.model && { model: data.model }) }, 200, true) : json({ answer: "Couldn't reach the search index — try browsing instead.", fallback: true }, 200, true)
  } catch {
    return json({ answer: "Couldn't reach the search index — try browsing instead.", fallback: true }, 200, true)
  }
}

export async function handlePortfolioApi(request: Request, env: SubscribeEnv & ShipReviewEnv & SiteAnswerEnv = {}, fetchImpl: FetchImplementation = fetch, subscribeOptions: SubscribeOptions = {}): Promise<Response | undefined> {
  const path = new URL(request.url).pathname.replace(/\/$/, '')
  if (path === '/api/agent' || path === '/api/github-stats') return json({ error: 'This endpoint has been retired' }, 410)
  if (path === shipReviewApi) return handleShipReview(request, env)
  if (path === '/api/search') return search(request, fetchImpl, env)
  if (path === '/api/subscribe') return handleSubscribe(request, env, fetchImpl, subscribeOptions)
  if (path === '/api/unsubscribe') return handleUnsubscribeRequest(request, env, fetchImpl)
  return undefined
}
