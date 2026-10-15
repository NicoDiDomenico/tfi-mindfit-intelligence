import type { BlogArticle, BlogArticlesResult } from '../types/blog'

const DEFAULT_RSS_PROXY_URL = 'https://api.rss2json.com/v1/api.json'
const CACHE_KEY = 'mindfit.blogArticles.v1'
const CACHE_TTL_MS = 30 * 60 * 1000
const MAX_ARTICLES = 12

const RSS_SOURCES = [
  { name: 'Vitónica', url: 'https://www.vitonica.com/index.xml' },
  { name: "Runner's World España", url: 'https://www.runnersworld.com/es/rss/all.xml' },
  { name: "Men's Health España", url: 'https://www.menshealth.com/es/rss/all.xml' },
] as const

interface RssProxyItem {
  guid?: string
  title?: string
  link?: string
  pubDate?: string
  description?: string
  content?: string
  thumbnail?: string
  enclosure?: {
    link?: string
    type?: string
  }
}

interface RssProxyResponse {
  status?: string
  message?: string
  feed?: {
    title?: string
  }
  items?: RssProxyItem[]
}

interface BlogCache {
  cachedAt: number
  articles: BlogArticle[]
}

let pendingRequest: Promise<BlogArticlesResult> | null = null

function buildProxyUrl(feedUrl: string) {
  const configuredProxy = import.meta.env.VITE_RSS_PROXY_URL?.trim() || DEFAULT_RSS_PROXY_URL

  if (configuredProxy.includes('{url}')) {
    return configuredProxy.replace('{url}', encodeURIComponent(feedUrl))
  }

  const proxyUrl = new URL(configuredProxy)
  proxyUrl.searchParams.set('rss_url', feedUrl)
  return proxyUrl.toString()
}

function textFromHtml(value = '') {
  const document = new DOMParser().parseFromString(value, 'text/html')
  return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function shorten(value: string, maxLength = 180) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength).replace(/\s+\S*$/, '')}…`
}

function validExternalUrl(value?: string) {
  if (!value) {
    return undefined
  }

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function extractImage(item: RssProxyItem) {
  const directImage = validExternalUrl(item.thumbnail) ?? validExternalUrl(item.enclosure?.link)
  if (directImage) {
    return directImage
  }

  const html = item.content || item.description || ''
  const imageMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return validExternalUrl(imageMatch?.[1])
}

function normalizeItem(
  item: RssProxyItem,
  fallbackSource: string,
  feedTitle?: string,
): BlogArticle | null {
  const title = textFromHtml(item.title)
  const url = validExternalUrl(item.link)

  if (!title || !url) {
    return null
  }

  const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date()
  const validPublishedAt = Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt

  return {
    id: item.guid || url,
    title,
    summary: shorten(textFromHtml(item.description || item.content)),
    publishedAt: validPublishedAt.toISOString(),
    source: textFromHtml(feedTitle) || fallbackSource,
    url,
    imageUrl: extractImage(item),
  } satisfies BlogArticle
}

async function fetchSource(source: (typeof RSS_SOURCES)[number]) {
  const response = await fetch(buildProxyUrl(source.url), {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`No se pudo consultar ${source.name}`)
  }

  const payload = (await response.json()) as RssProxyResponse
  if (payload.status !== 'ok' || !Array.isArray(payload.items)) {
    throw new Error(payload.message || `Respuesta inválida de ${source.name}`)
  }

  return payload.items
    .map((item) => normalizeItem(item, source.name, payload.feed?.title))
    .filter((article): article is BlogArticle => article !== null)
}

function readCache() {
  try {
    const rawCache = window.localStorage.getItem(CACHE_KEY)
    if (!rawCache) {
      return null
    }

    const cache = JSON.parse(rawCache) as BlogCache
    if (!Number.isFinite(cache.cachedAt) || !Array.isArray(cache.articles)) {
      return null
    }

    return cache
  } catch {
    return null
  }
}

function writeCache(articles: BlogArticle[]) {
  try {
    const cache: BlogCache = { cachedAt: Date.now(), articles }
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // The blog can keep working when storage is unavailable or full.
  }
}

async function requestArticles(staleCache: BlogCache | null): Promise<BlogArticlesResult> {
  const results = await Promise.allSettled(RSS_SOURCES.map(fetchSource))
  const articles = results
    .filter((result): result is PromiseFulfilledResult<BlogArticle[]> => result.status === 'fulfilled')
    .flatMap((result) => result.value)

  if (articles.length === 0) {
    if (staleCache?.articles.length) {
      return { articles: staleCache.articles, isStale: true }
    }

    throw new Error('No pudimos cargar las noticias en este momento.')
  }

  const uniqueArticles = Array.from(new Map(articles.map((article) => [article.url, article])).values())
    .sort((first, second) => Date.parse(second.publishedAt) - Date.parse(first.publishedAt))
    .slice(0, MAX_ARTICLES)

  writeCache(uniqueArticles)
  return { articles: uniqueArticles, isStale: false }
}

export function getBlogSources() {
  return RSS_SOURCES.map((source) => source.name)
}

export async function getBlogArticles(): Promise<BlogArticlesResult> {
  const cache = readCache()
  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS && cache.articles.length) {
    return { articles: cache.articles, isStale: false }
  }

  if (!pendingRequest) {
    pendingRequest = requestArticles(cache).finally(() => {
      pendingRequest = null
    })
  }

  return pendingRequest
}
