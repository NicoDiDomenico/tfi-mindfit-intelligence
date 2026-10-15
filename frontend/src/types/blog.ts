export interface BlogArticle {
  id: string
  title: string
  summary: string
  publishedAt: string
  source: string
  url: string
  imageUrl?: string
}

export interface BlogArticlesResult {
  articles: BlogArticle[]
  isStale: boolean
}
