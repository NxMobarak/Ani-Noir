import { useState } from 'react';
import T from '../constants/theme';
import { getWatchlist, saveWatchlist } from '../utils/storage';

export default function WatchlistPage({ showFeedback }) {
  const [watchlist, setWatchlist] = useState(getWatchlist);

  const removeItem = (malId) => {
    const updated = watchlist.filter(a => a.mal_id !== malId);
    setWatchlist(updated);
    saveWatchlist(updated);
    showFeedback('Removed from watchlist', 'success');
  };

  if (watchlist.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h2 style={{ color: T.text, marginBottom: 8 }}>Watchlist</h2>
        <p style={{ color: T.textDim, fontSize: 14 }}>
          Your watchlist is empty. Search for anime and add them here!
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: T.text, fontSize: 18, margin: 0 }}>Watchlist</h2>
        <span style={{ color: T.textDim, fontSize: 12 }}>{watchlist.length} anime</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {watchlist.map(anime => (
          <div
            key={anime.mal_id}
            style={{
              display: 'flex', gap: 12, padding: 12, borderRadius: 12,
              background: T.card, border: `1px solid ${T.border}`,
              alignItems: 'center',
            }}
          >
            {anime.image && (
              <img
                src={anime.image}
                alt={anime.title}
                style={{ width: 45, height: 65, objectFit: 'cover', borderRadius: 8 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: T.text, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                {anime.title}
              </div>
              <div style={{ color: T.textDim, fontSize: 12 }}>
                {anime.score ? `⭐ ${anime.score}` : ''} {anime.episodes ? `• ${anime.episodes} eps` : ''}
              </div>
            </div>
            <button
              onClick={() => removeItem(anime.mal_id)}
              style={{
                background: 'rgba(244,63,94,0.1)', border: `1px solid ${T.error}`,
                borderRadius: 8, padding: '6px 10px', color: T.error,
                fontSize: 12, cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
