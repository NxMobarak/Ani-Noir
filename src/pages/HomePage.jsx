import { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import T from '../constants/theme';
import { getDailyAnime, getDailyQuote } from '../constants/data';
import { fetchWithRetry } from '../utils/api';
import { getXP, getRank, getRankIndex, getRankProgress, getNextRank, getXPToNextRank } from '../utils/xpSystem';

const LatestYouTubeCard = memo(function LatestYouTubeCard() {
  const [video, setVideo] = useState(null);
  useEffect(() => {
    const RSS = 'https://api.rss2json.com/v1/api.json?rss_url=https://www.youtube.com/feeds/videos.xml?channel_id=UCxvnMryqeGfklJRwGM1r9eA&count=1';
    fetchWithRetry(RSS, {}, { retries: 2, cacheKey: 'yt_latest' })
      .then(d => {
        const v = d.items?.[0];
        if (v) setVideo({ title: v.title, link: v.link, thumb: v.thumbnail, date: new Date(v.pubDate).toLocaleDateString() });
      })
      .catch(() => {});
  }, []);
  if (!video) return null;
  return (
    <article className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 8px' }}>
        <h3 className="card-title" style={{ color: '#ff4444', marginBottom: 8 }}>LATEST VIDEO</h3>
      </div>
      <a href={video.link} target="_blank" rel="noopener noreferrer" className="yt-card" style={{ margin: '0 12px 12px', borderRadius: 14 }}>
        <img src={video.thumb} alt="" className="yt-thumb" onError={e => e.target.style.display = 'none'} loading="lazy" />
        <div className="yt-info">
          <div className="yt-title">{video.title}</div>
          <div className="yt-sub">AnimeTMTalks · {video.date}</div>
        </div>
      </a>
    </article>
  );
});

// Calculate time until midnight IST
function getTimeUntilMidnightIST() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60000);
  const midnightIST = new Date(istNow);
  midnightIST.setHours(24, 0, 0, 0);
  const diff = midnightIST.getTime() - istNow.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { hours, minutes, seconds };
}

function DailyTimer() {
  const [time, setTime] = useState(getTimeUntilMidnightIST);
  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeUntilMidnightIST()), 1000);
    return () => clearInterval(interval);
  }, []);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <span style={{ fontSize: 10, color: T.gold, fontWeight: 700 }}>
      {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
    </span>
  );
}


function getHeroBannerData() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return {
      greeting: 'Good morning',
      tagline: 'Think you know Anime?',
      image: '/hero-character-1.webp',
      greetingColor: '#ffffff',
      subColor: '#e2e8f0',
    };
  } else if (hour < 17) {
    return {
      greeting: 'Good afternoon',
      tagline: 'Your Anime Knowledge Has Limits.',
      image: '/hero-character-2.webp',
      greetingColor: '#ffffff',
      subColor: '#e2e8f0',
    };
  } else {
    return {
      greeting: 'Good evening',
      tagline: 'Can You Survive the Anime Gauntlet?',
      image: '/hero-character-3.webp',
      greetingColor: '#fecdd3',
      subColor: '#fda4af',
    };
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const dailyAnime = getDailyAnime();
  const dailyQuote = getDailyQuote();
  const { greeting, tagline, image, greetingColor, subColor } = getHeroBannerData();

  return (
    <div>
      <section className="hero-banner" style={{ backgroundImage: `url(${image})` }} aria-label="Welcome">
        <div className="hero-greeting" style={{ color: greetingColor }}>{greeting}, Otaku!</div>
        <p className="hero-sub" style={{ color: subColor }}>{tagline}</p>
        <button className="btn btn-primary" style={{ marginTop: 12, borderRadius: 10, fontSize: 12, padding: '8px 16px' }} onClick={() => {
          const modes = ['/quiz', '/ninja', '/emoji', '/shadow', '/moments', '/frame', '/theme', '/dialogue'];
          navigate(modes[Math.floor(Math.random() * modes.length)]);
        }}>
          Play Now
        </button>
      </section>

      <LatestYouTubeCard />

      {/* XP RANK CARD */}
      {(() => {
        const xp = getXP();
        const rank = getRank(xp);
        const rankIdx = getRankIndex(xp);
        const progress = getRankProgress(xp);
        const nextRank = getNextRank(xp);
        const xpNeeded = getXPToNextRank(xp);
        return (
          <section className="card" aria-label="Your Ninja Rank" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 30 }}>{rank.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: rank.color }}>{rank.name}</div>
                <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>{xp.toLocaleString()} XP · Rank {rankIdx + 1}/10</div>
                {nextRank && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ height: 5, background: T.surface, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, progress * 100)}%`, background: `linear-gradient(90deg, ${rank.color}, ${nextRank.color})`, borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ fontSize: 10, color: T.textDim, marginTop: 3 }}>{xpNeeded.toLocaleString()} XP to {nextRank.name}</div>
                  </div>
                )}
                {!nextRank && <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, marginTop: 4 }}>MAX RANK!</div>}
              </div>
              <span style={{ color: T.textDim, fontSize: 18 }}>›</span>
            </div>
          </section>
        );
      })()}

      {/* DAILY CHALLENGE */}
      <section className="card" aria-label="Daily Challenge">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <rect x="2" y="5" width="32" height="29" rx="4" fill="#1a1d2e" stroke="#f43f5e" strokeWidth="1.5"/>
            <rect x="2" y="5" width="32" height="10" rx="4" fill="#f43f5e"/>
            <text x="18" y="13" textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff">{new Date().toLocaleString('en', { month: 'short' }).toUpperCase()}</text>
            <text x="18" y="29" textAnchor="middle" fontSize="13" fontWeight="800" fill="#f1f5f9">{new Date().getDate()}</text>
          </svg>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Daily Challenge</span>
            <span style={{ fontSize: 9, color: T.textDim, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              Resets in <DailyTimer />
            </span>
          </div>
          <button className="btn btn-primary" style={{ fontSize: 10, padding: '6px 14px', borderRadius: 8 }} onClick={() => navigate('/daily')}>Play</button>
        </div>
      </section>

      {/* GAME MODES */}
      <section aria-label="Game Modes" style={{ marginBottom: 10 }}>
        <h2 className="card-title" style={{ color: '#94a3b8', fontSize: 12, padding: '0 2px 8px' }}>GAME MODES</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }} role="group" aria-label="Game modes">
          {[
            ['/quiz', '🧠', 'Anime Quiz', 'Test your general anime knowledge', 'brain'],
            ['/ninja', '🔤', 'Word Ninja', 'Guess the anime by words', 'brain'],
            ['/emoji', '🎯', 'Emoji Wars', 'Decode anime emoji puzzles', 'brain'],
            ['/shadow', '🕵️', 'Anime Shadow', 'Guess anime from silhouettes', 'visual'],
            ['/moments', '🖼️', 'Moments', 'Identify iconic anime scenes', 'visual'],
            ['/frame', '🎬', 'Frame Guess', 'Guess from a single frame', 'visual'],
            ['/theme', '🎵', 'Anime Theme', 'Name that opening or ending!', 'audio'],
            ['/dialogue', '💬', 'Dialogue Clash', 'Who said this dialogue?', 'brain'],
          ].map(([path, ico, lbl, desc, glow]) => (
            <button key={path} className={`game-mode-card glow-${glow}`} onClick={() => navigate(path)}>
              <span className="game-mode-icon" aria-hidden="true">{ico}</span>
              <span className="game-mode-name">{lbl}</span>
              <span className="game-mode-desc">{desc}</span>
              <span className="game-mode-play">PLAY &rarr;</span>
            </button>
          ))}
        </div>
      </section>

      {/* SURVIVAL MODE */}
      <section className="card" aria-label="Survival Mode">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 26 }} aria-hidden="true">💀</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Survival Mode</span>
            <div style={{ fontSize: 9, color: T.textDim, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span>❤️❤️❤️</span> <span>3 Lives · No Timer</span>
            </div>
          </div>
          <button className="btn btn-primary" style={{ fontSize: 10, padding: '6px 14px', borderRadius: 8 }} onClick={() => navigate('/survival')}>Play</button>
        </div>
      </section>

      {/* ANIME OF THE DAY + QUOTE OF THE DAY - Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <section className="card" style={{ marginBottom: 0 }} aria-label="Anime of the Day">
          <h2 className="card-title" style={{ color: T.rose }}>ANIME OF THE DAY</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <img src={dailyAnime.image} alt={dailyAnime.title} style={{ width: 55, height: 80, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} loading="lazy" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{dailyAnime.title}</h3>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>⭐ {dailyAnime.rating} · {dailyAnime.genre}</div>
              <button className="btn btn-primary" style={{ marginTop: 6, fontSize: 9, padding: '4px 10px', borderRadius: 6, width: 'fit-content' }} onClick={() => navigate('/search')}>View More</button>
            </div>
          </div>
        </section>

        <section className="card" style={{ marginBottom: 0 }} aria-label="Quote of the Day">
          <h2 className="card-title" style={{ color: T.gold }}>QUOTE OF THE DAY</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 28, color: T.gold, lineHeight: 1, flexShrink: 0 }}>"</span>
            <div>
              <p style={{ fontSize: 11, fontStyle: 'italic', color: '#f1f5f9', lineHeight: 1.5 }}>{dailyQuote.text}</p>
              <cite style={{ fontSize: 10, color: T.gold, marginTop: 6, fontStyle: 'normal', display: 'block' }}>— {dailyQuote.char} • {dailyQuote.anime}</cite>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
