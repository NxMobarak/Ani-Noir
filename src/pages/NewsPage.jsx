import { useState, useEffect } from 'react';
import T from '../constants/theme';
import { NEWS_CATEGORIES, categorizeNewsItem } from '../constants/data';

const RSS_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fcr-news-api-service.prd.crunchyrollsvc.com%2Fv1%2Fen-US%2Frss';

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(RSS_URL);
      const data = await res.json();
      if (data.status === 'ok' && data.items) {
        const enriched = data.items.map(item => ({
          ...item,
          categories: categorizeNewsItem(item.title, item.description || ''),
        }));
        setArticles(enriched);
      } else {
        setError('Failed to load news.');
      }
    } catch (err) {
      setError('Failed to load news. Check your connection.');
    }
    setLoading(false);
  };

  const filtered = activeCategory === 'all'
    ? articles
    : articles.filter(a => a.categories.includes(activeCategory));

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: T.text, fontSize: 18, marginBottom: 12 }}>Anime News</h2>

      {/* Category tabs */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16,
        paddingBottom: 4, scrollbarWidth: 'none',
      }}>
        {NEWS_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
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
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ textAlign: 'center', color: T.textDim, padding: 40 }}>
          Loading news...
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', color: T.error, padding: 20 }}>
          {error}
          <br />
          <button onClick={fetchNews} className="btn btn-secondary" style={{ marginTop: 10, fontSize: 12 }}>
            Retry
          </button>
        </div>
      )}

      {/* Articles */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: T.textDim, padding: 20 }}>
          No articles in this category.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((article, idx) => (
          <a
            key={idx}
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
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: T.text, fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
                {article.title}
              </div>
              <div style={{ color: T.textDim, fontSize: 11 }}>
                {article.pubDate ? new Date(article.pubDate).toLocaleDateString() : ''}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
