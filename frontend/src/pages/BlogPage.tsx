import { useEffect, useState, type CSSProperties } from 'react'
import heroImage from '../assets/blog.jpg'
import tendenciasImage from '../assets/blog-tendencias.png'
import { LandingHeader } from '../components/landing/LandingHeader'
import { PublicFooter } from '../components/landing/PublicFooter'
import { getBlogArticles, getBlogSources } from '../services/blogService'
import type { BlogArticle } from '../types/blog'

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const sources = getBlogSources()
const ARTICLES_PER_PAGE = 4

export function BlogPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [visibleArticleCount, setVisibleArticleCount] = useState(ARTICLES_PER_PAGE)
  const [isLoading, setIsLoading] = useState(true)
  const [isStale, setIsStale] = useState(false)
  const [error, setError] = useState('')

  async function loadArticles() {
    setIsLoading(true)
    setError('')
    setVisibleArticleCount(ARTICLES_PER_PAGE)

    try {
      const result = await getBlogArticles()
      setArticles(result.articles)
      setIsStale(result.isStale)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No pudimos cargar las noticias.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    void getBlogArticles()
      .then((result) => {
        if (!isActive) return

        setArticles(result.articles)
        setIsStale(result.isStale)
      })
      .catch((loadError: unknown) => {
        if (!isActive) return

        setError(loadError instanceof Error ? loadError.message : 'No pudimos cargar las noticias.')
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  const visibleArticles = articles.slice(0, visibleArticleCount)
  const hasMoreArticles = visibleArticleCount < articles.length

  return (
    <main className="landing-page blog-page">
      <LandingHeader />

      <div className="blog-content">
        <section className="blog-main" aria-label="Artículos del blog">
          <div className="blog-hero">
            <img
              src={heroImage}
              alt="Bloques de madera con la palabra Blog sobre una computadora"
            />
          </div>

          {isStale && (
            <p className="blog-status" role="status">
              Mostramos las últimas noticias guardadas mientras se actualizan las fuentes.
            </p>
          )}

          {error ? (
            <div className="blog-error" role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => void loadArticles()}>
                Reintentar
              </button>
            </div>
          ) : (
            <>
              <div id="blog-articles-grid" className="blog-grid" aria-busy={isLoading}>
                {isLoading &&
                  Array.from({ length: ARTICLES_PER_PAGE }, (_, index) => (
                    <article
                      className="blog-article blog-article--loading"
                      key={index}
                      aria-hidden="true"
                    >
                      <div className="blog-article__image" />
                      <span />
                      <span />
                    </article>
                  ))}

                {!isLoading &&
                  visibleArticles.map((article, index) => (
                    <article
                      className="blog-article"
                      key={article.id}
                      style={{ '--blog-order': index } as CSSProperties}
                    >
                      <div className="blog-article__image">
                        <img
                          src={article.imageUrl || tendenciasImage}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = tendenciasImage
                          }}
                        />
                      </div>
                      <p className="blog-article__meta">
                        <span>{article.source}</span>
                        <time dateTime={article.publishedAt}>
                          {dateFormatter.format(new Date(article.publishedAt))}
                        </time>
                      </p>
                      <h2>{article.title}</h2>
                      {article.summary && <p className="blog-article__summary">{article.summary}</p>}
                      <a href={article.url} target="_blank" rel="noopener noreferrer">
                        Leer más
                      </a>
                    </article>
                  ))}
              </div>

              {!isLoading && hasMoreArticles && (
                <div className="blog-load-more">
                  <button
                    type="button"
                    aria-controls="blog-articles-grid"
                    onClick={() => setVisibleArticleCount((count) => count + ARTICLES_PER_PAGE)}
                  >
                    Cargar más noticias
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <aside className="blog-categories" aria-labelledby="blog-categories-title">
          <h1 id="blog-categories-title">Fuentes</h1>
          <ul>
            {sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </aside>
      </div>
      <PublicFooter />
    </main>
  )
}
