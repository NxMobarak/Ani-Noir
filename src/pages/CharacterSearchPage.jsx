import { useState, useRef } from 'react';
import T from '../constants/theme';

export default function CharacterSearchPage({ showFeedback }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const searchCharacters = async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(q)}&limit=20`);
      const data = await res.json();
      setResults(data.data || []);
    } catch (err) {
      showFeedback('Search failed. Try again.', 'error');
    }
    setLoading(false);
  };

  const handleInput = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCharacters(val), 500);
  };

  return (
    <div style={{ padding: 16 }}>
      {/* Search input */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          placeholder="Search characters..."
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 10,
            background: T.surface, border: `1px solid ${T.border}`,
            color: T.text, fontSize: 15, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: T.textDim, padding: 20 }}>
          Searching...
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div style={{ textAlign: 'center', color: T.textDim, padding: 20 }}>
          No characters found.
        </div>
      )}

      {/* Results grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {results.map(char => (
          <div
            key={char.mal_id}
            style={{
              background: T.card, borderRadius: 12, overflow: 'hidden',
              border: `1px solid ${T.border}`, transition: 'border-color 0.2s',
            }}
          >
            {/* Character image */}
            <div style={{ position: 'relative', paddingTop: '120%', overflow: 'hidden' }}>
              <img
                src={char.images?.jpg?.image_url}
                alt={char.name}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%', objectFit: 'cover',
                }}
              />
            </div>

            {/* Character info */}
            <div style={{ padding: 10 }}>
              <div style={{ color: T.text, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                {char.name}
              </div>
              {char.name_kanji && (
                <div style={{ color: T.textDim, fontSize: 11, marginBottom: 4 }}>
                  {char.name_kanji}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {char.favorites !== undefined && (
                  <span style={{ color: T.rose, fontSize: 11 }}>
                    ❤️ {char.favorites?.toLocaleString()}
                  </span>
                )}
                <a
                  href={char.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: T.teal, fontSize: 11, textDecoration: 'none' }}
                  onClick={e => e.stopPropagation()}
                >
                  MAL ↗
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
