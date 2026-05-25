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
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 10,
              background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)',
              color: '#ff4444', fontSize: 13, textDecoration: 'none',
            }}
          >
            ▶ YouTube
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 10,
              background: 'rgba(225,48,108,0.1)', border: '1px solid rgba(225,48,108,0.3)',
              color: '#e1306c', fontSize: 13, textDecoration: 'none',
            }}
          >
            📷 Instagram
          </a>
        </div>
      </div>
    </div>
  );
}
