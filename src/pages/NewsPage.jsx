import { useState, useEffect, useCallback } from 'react';
import T from '../constants/theme';
import { NEWS_CATEGORIES, categorizeNewsItem } from '../constants/data';
import { fetchWithRetry } from '../utils/api';
import BackButton from '../components/BackButton';

const RSS_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fcr-news-api-service.prd.crunchyrollsvc.com%2Fv1%2Fen-US%2Frss';

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [retryCount, setRetryCount] = useState(0);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithRetry(RSS_URL, {}, {
        retries: 3,
        backoff: 1000,
        cacheKey: 'news_feed',
      });
      if (data.status === 'ok' && data.items) {
        const enriched = data.items.map(item => ({
          ...item,
          categories: categorizeNewsItem(item.title, item.description || ''),
        }));
        setArticles(enriched);
        // Cache for offline use
        try {
          localStorage.setItem('ani_news_cache', JSON.stringify(enriched.slice(0, 20)));
        } catch {}
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      // Try offline cache
      try {
        const cached = JSON.parse(localStorage.getItem('ani_news_cache') || '[]');
        if (cached.length > 0) {
          setArticles(cached);
          setError('Showing cached news (offline mode)');
        } else {
          setError('Failed to load news. Check your connection.');
        }
      } catch {
        setError('Failed to load news. Check your connection.');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleRetry = () => {
    setRetryCount(r => r + 1);
    fetchNews();
  };

  const filtered = activeCategory === 'all'
    ? articles
    : articles.filter(a => a.categories.includes(activeCategory));

  return (
    <section aria-label="Anime News">
      <BackButton />
      <h2 style={{ color: T.text, fontSize: 18, marginBottom: 12 }}>Anime News</h2>

      {/* Category tabs */}
      <nav aria-label="News categories" style={{
        display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16,
        paddingBottom: 4, scrollbarWidth: 'none',
      }}>
        {NEWS_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            aria-pressed={activeCategory === cat.id}
            style={{
              padding: '8px 14px', borderRadius: 20, whiteSpace: 'nowrap',
              background: activeCategory === cat.id ? T.rose : T.card,
              border: `1px solid ${activeCategory === cat.id ? T.rose : T.border}`,
              color: activeCategory === cat.id ? '#fff' : T.textMid,
              fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </nav>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', color: T.textDim, padding: 40 }} aria-live="polite">
          Loading news...
        </div>
      )}

      {/* Error with retry */}
      {error && !loading && (
        <div style={{ textAlign: 'center', color: error.includes('cached') ? T.gold : T.error, padding: 20 }} role="alert">
          {error}
          <br />
          {!error.includes('cached') && (
            <button onClick={handleRetry} className="btn btn-secondary" style={{ marginTop: 10, fontSize: 12 }}>
              Retry ({retryCount > 0 ? `attempt ${retryCount}` : 'tap to retry'})
            </button>
          )}
        </div>
      )}

      {/* Articles */}
      {!loading && filtered.length === 0 && !error && (
        <div style={{ textAlign: 'center', color: T.textDim, padding: 20 }}>
          No articles in this category.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} role="feed" aria-label="News articles">
        {filtered.map((article, idx) => (
          <article key={idx}>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', gap: 12, padding: 12, borderRadius: 12,
                background: T.card, border: `1px solid ${T.border}`,
                textDecoration: 'none', transition: 'border-color 0.2s',
              }}
            >
              {article.thumbnail && (
                <img
                  src={article.thumbnail}
                  alt=""
                  style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                  loading="lazy"
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ color: T.text, fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
                  {article.title}
                </h3>
                <time style={{ color: T.textDim, fontSize: 11 }} dateTime={article.pubDate}>
                  {article.pubDate ? new Date(article.pubDate).toLocaleDateString() : ''}
                </time>
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
