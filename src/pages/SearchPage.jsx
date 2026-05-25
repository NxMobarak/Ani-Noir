import { useState, useRef, useCallback } from 'react';
import T from '../constants/theme';
import { getWatchlist, saveWatchlist } from '../utils/storage';
import { STREAMING_MAP } from '../constants/data';
import { fetchWithRetry } from '../utils/api';
import BackButton from '../components/BackButton';

export default function SearchPage({ showFeedback }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const searchAnime = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setError(null); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithRetry(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=15`,
        {},
        { retries: 3, backoff: 1500, cacheKey: `search_${q}` }
      );
      setResults(data.data || []);
      if (!data.data?.length) {
        // Cache empty result awareness
      }
    } catch (err) {
      setError('Search failed. The API might be down — please try again in a moment.');
      showFeedback('Search failed. Retrying...');
    }
    setLoading(false);
  }, [showFeedback]);

  const handleInput = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAnime(val), 500);
  };

  const addToWatchlist = (anime) => {
    const list = getWatchlist();
    if (list.find(a => a.mal_id === anime.mal_id)) {
      showFeedback('Already in watchlist!');
      return;
    }
    list.push({
      mal_id: anime.mal_id,
      title: anime.title,
      image: anime.images?.jpg?.image_url,
      score: anime.score,
      episodes: anime.episodes,
    });
    saveWatchlist(list);
    showFeedback('Added to watchlist! 📋');
  };

  const getStreamingLinks = (anime) => {
    if (!anime.streaming || !anime.streaming.length) return [];
    return anime.streaming.map(s => ({
      name: STREAMING_MAP[s.name] || s.name,
      url: s.url,
    }));
  };

  // ─── Detail View ───────────────────────────────────────────
  if (selected) {
    const streaming = getStreamingLinks(selected);
    return (
      <article aria-label={`Details for ${selected.title}`} style={{ padding: 16 }}>
        <button
          onClick={() => setSelected(null)}
          aria-label="Back to results"
          style={{
            background: 'none', border: 'none', color: T.teal,
            fontSize: 14, cursor: 'pointer', marginBottom: 12, padding: 0
          }}
        >
          ← Back to results
        </button>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img
            src={selected.images?.jpg?.large_image_url || selected.images?.jpg?.image_url}
            alt={`Poster for ${selected.title}`}
            style={{ width: 180, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
          />
        </div>

        <h2 style={{ color: T.text, fontSize: 18, textAlign: 'center', marginBottom: 4 }}>
          {selected.title}
        </h2>
        {selected.title_japanese && (
          <p style={{ color: T.textDim, fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
            {selected.title_japanese}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          {selected.score && <span style={{ color: T.gold, fontSize: 13 }}>⭐ {selected.score}</span>}
          {selected.episodes && <span style={{ color: T.textMid, fontSize: 13 }}>📺 {selected.episodes} eps</span>}
          {selected.status && <span style={{ color: T.textMid, fontSize: 13 }}>📡 {selected.status}</span>}
          {selected.year && <span style={{ color: T.textMid, fontSize: 13 }}>📅 {selected.year}</span>}
        </div>

        {selected.genres?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
            {selected.genres.map(g => (
              <span key={g.mal_id} style={{
                padding: '4px 10px', borderRadius: 12,
                background: T.surface, border: `1px solid ${T.border}`,
                color: T.textMid, fontSize: 11
              }}>
                {g.name}
              </span>
            ))}
          </div>
        )}

        {selected.synopsis && (
          <div style={{
            background: T.card, borderRadius: 12, padding: 14,
            border: `1px solid ${T.border}`, marginBottom: 16
          }}>
            <p style={{ color: T.textMid, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              {selected.synopsis}
            </p>
          </div>
        )}

        {streaming.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ color: T.textDim, fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>
              Where to Watch
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {streaming.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{
                  padding: '8px 12px', borderRadius: 8, background: T.surface,
                  border: `1px solid ${T.border}`, color: T.teal, fontSize: 12,
                  textDecoration: 'none'
                }}>
                  {s.name} ↗
                </a>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => addToWatchlist(selected)}>
          + Add to Watchlist
        </button>
      </article>
    );
  }

  // ─── Search View ───────────────────────────────────────────
  return (
    <section aria-label="Anime Search" style={{ padding: 16 }}>
      <BackButton />
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="anime-search" className="sr-only" style={{ position: 'absolute', left: '-9999px' }}>
          Search anime
        </label>
        <input
          id="anime-search"
          type="search"
          value={query}
          onChange={e => handleInput(e.target.value)}
          placeholder="Search anime..."
          aria-label="Search anime"
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 10,
            background: T.surface, border: `1px solid ${T.border}`,
            color: T.text, fontSize: 15, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: T.textDim, padding: 20 }} aria-live="polite">
          Searching...
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', color: T.error, padding: 20 }} role="alert">
          {error}
          <br />
          <button onClick={() => searchAnime(query)} className="btn btn-secondary" style={{ marginTop: 10, fontSize: 12 }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && results.length === 0 && query && (
        <div style={{ textAlign: 'center', color: T.textDim, padding: 20 }}>
          No results found.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} role="list" aria-label="Search results">
        {results.map(anime => (
          <div
            key={anime.mal_id}
            role="listitem"
            onClick={() => setSelected(anime)}
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter') setSelected(anime); }}
            style={{
              display: 'flex', gap: 12, padding: 12, borderRadius: 12,
              background: T.card, border: `1px solid ${T.border}`,
              cursor: 'pointer', transition: 'border-color 0.2s',
            }}
          >
            <img
              src={anime.images?.jpg?.small_image_url}
              alt={`${anime.title} poster`}
              style={{ width: 50, height: 70, objectFit: 'cover', borderRadius: 8 }}
              loading="lazy"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: T.text, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                {anime.title}
              </div>
              <div style={{ color: T.textDim, fontSize: 12 }}>
                {anime.score ? `⭐ ${anime.score}` : ''} {anime.episodes ? `• ${anime.episodes} eps` : ''} {anime.year ? `• ${anime.year}` : ''}
              </div>
              {anime.genres?.slice(0, 3).map(g => (
                <span key={g.mal_id} style={{ color: T.textMid, fontSize: 11, marginRight: 6 }}>
                  {g.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
