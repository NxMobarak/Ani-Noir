import { useState, useEffect } from 'react';
import T from '../constants/theme';
import { getLeaderboard, getWatchlist } from '../utils/storage';
import { levels } from '../questions/index';

export default function AboutPage({ spades, badges }) {
  const [leaderboard, setLeaderboard] = useState({});
  const [watchlistCount, setWatchlistCount] = useState(0);

  useEffect(() => {
    setLeaderboard(getLeaderboard());
    setWatchlistCount(getWatchlist().length);
  }, []);

  const dailyStreak = (() => {
    try {
      const daily = JSON.parse(localStorage.getItem('ani_daily') || '{}');
      return daily.streak || 0;
    } catch { return 0; }
  })();

  // Get personal bests from leaderboard
  const personalBests = Object.entries(leaderboard).map(([key, val]) => ({
    key,
    ...val,
  }));

  return (
    <div style={{ padding: 16 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>♠️</div>
        <h2 style={{ color: T.text, fontSize: 20, marginBottom: 4 }}>Ani-Noir</h2>
        <p style={{ color: T.textDim, fontSize: 12 }}>The Ultimate Anime Quiz App</p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20
      }}>
        <div style={{
          background: T.card, borderRadius: 12, padding: 14, textAlign: 'center',
          border: `1px solid ${T.border}`
        }}>
          <div style={{ color: T.gold, fontSize: 22, fontWeight: 700 }}>{spades}</div>
          <div style={{ color: T.textDim, fontSize: 11 }}>Spades ♠</div>
        </div>
        <div style={{
          background: T.card, borderRadius: 12, padding: 14, textAlign: 'center',
          border: `1px solid ${T.border}`
        }}>
          <div style={{ color: T.violet, fontSize: 22, fontWeight: 700 }}>{badges?.length || 0}</div>
          <div style={{ color: T.textDim, fontSize: 11 }}>Badges</div>
        </div>
        <div style={{
          background: T.card, borderRadius: 12, padding: 14, textAlign: 'center',
          border: `1px solid ${T.border}`
        }}>
          <div style={{ color: T.teal, fontSize: 22, fontWeight: 700 }}>{dailyStreak}</div>
          <div style={{ color: T.textDim, fontSize: 11 }}>Daily Streak</div>
        </div>
        <div style={{
          background: T.card, borderRadius: 12, padding: 14, textAlign: 'center',
          border: `1px solid ${T.border}`
        }}>
          <div style={{ color: T.rose, fontSize: 22, fontWeight: 700 }}>{watchlistCount}</div>
          <div style={{ color: T.textDim, fontSize: 11 }}>Watchlist</div>
        </div>
      </div>

      {/* Personal Bests */}
      {personalBests.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ color: T.text, fontSize: 15, marginBottom: 10 }}>🏆 Personal Bests</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {personalBests.slice(0, 10).map((pb, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 10,
                background: T.card, border: `1px solid ${T.border}`
              }}>
                <span style={{ color: T.textMid, fontSize: 13 }}>{pb.key.replace(/_/g, ' ')}</span>
                <span style={{ color: T.gold, fontSize: 13, fontWeight: 700 }}>
                  {pb.score}/{pb.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {badges && badges.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ color: T.text, fontSize: 15, marginBottom: 10 }}>🎖️ Badges</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {badges.map((badge, i) => (
              <div key={i} style={{
                padding: '8px 14px', borderRadius: 12,
                background: T.card, border: `1px solid ${T.gold}`,
                color: T.gold, fontSize: 12, textAlign: 'center',
              }}>
                {badge}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About */}
      <div style={{
        background: T.card, borderRadius: 12, padding: 16, marginBottom: 20,
        border: `1px solid ${T.border}`
      }}>
        <h3 style={{ color: T.text, fontSize: 14, marginBottom: 8 }}>About</h3>
        <p style={{ color: T.textMid, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          Ani-Noir is your ultimate anime companion. Test your knowledge with quizzes,
          track your watchlist, stay up to date with anime news, and discover character
          birthdays. Earn spades and badges as you progress!
        </p>
      </div>

      {/* Social Links */}
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ color: T.text, fontSize: 14, marginBottom: 12 }}>Follow Us</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* YouTube */}
          <a
            href="https://youtube.com/@animetmtalks?si=ANiLHy2G23IuILi3"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.preventDefault(); window.open('https://youtube.com/@animetmtalks?si=ANiLHy2G23IuILi3', '_blank', 'noopener,noreferrer'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 12,
              background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.25)',
              color: '#ff4444', fontSize: 13, textDecoration: 'none',
              textAlign: 'left',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#ff4444" style={{ flexShrink: 0 }}>
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Anime TM Talks</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Anime reviews, podcasts & live streams</div>
            </div>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/mobarak.jpg?igsh=azk2MTFvcmxteGxp"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.preventDefault(); window.open('https://www.instagram.com/mobarak.jpg?igsh=azk2MTFvcmxteGxp', '_blank', 'noopener,noreferrer'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 12,
              background: 'rgba(225,48,108,0.08)', border: '1px solid rgba(225,48,108,0.25)',
              color: '#e1306c', fontSize: 13, textDecoration: 'none',
              textAlign: 'left',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#e1306c" style={{ flexShrink: 0 }}>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
            </svg>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>@mobarak.jpg</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Developer of Ani-Noir. Follow for behind the scenes, updates and more quiz</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
