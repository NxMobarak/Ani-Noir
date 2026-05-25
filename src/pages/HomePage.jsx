import { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import T from '../constants/theme';
import { getDailyAnime, getDailyQuote } from '../constants/data';
import { fetchWithRetry } from '../utils/api';

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


export default function HomePage() {
  const navigate = useNavigate();
  const dailyAnime = getDailyAnime();
  const dailyQuote = getDailyQuote();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <section className="hero-banner" aria-label="Welcome">
        <div className="hero-greeting">{greeting}, Otaku!</div>
        <p className="hero-sub">Ready to test your anime knowledge?</p>
        <button className="btn btn-primary" style={{ marginTop: 14, borderRadius: 10 }} onClick={() => navigate('/quiz')}>
          Start Anime Quiz
        </button>
      </section>

      <LatestYouTubeCard />

      {/* ALL GAMES - 9 games in 3x3 grid */}
      <section className="card" aria-label="All Games">
        <h2 className="card-title" style={{ color: T.teal }}>ALL GAMES</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }} role="group" aria-label="Game modes">
          {[
            ['/quiz', '🧠', 'Anime Quiz'],
            ['/anagram', '🔤', 'Word Ninja'],
            ['/emoji', '🎯', 'Emoji Wars'],
            ['/shadow', '🕵️', 'Anime Shadow'],
            ['/frames', '🖼️', 'Anime Moments'],
            ['/sceneguess', '🎬', 'Frame Guess'],
            ['/dialogue', '💬', 'Dialogue Clash'],
            ['/opening', '🎵', 'Opening Challenge'],
            ['/ending', '🎶', 'Ending Challenge'],
          ].map(([path, ico, lbl]) => (
            <button key={path} className="btn btn-secondary" style={{ flexDirection: 'column', gap: 4, padding: '12px 6px', fontSize: 10 }} onClick={() => navigate(path)}>
              <span style={{ fontSize: 22 }} aria-hidden="true">{ico}</span>
              <span style={{ lineHeight: 1.2, textAlign: 'center' }}>{lbl}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ULTIMATE CHALLENGE - Survival + Daily */}
      <section className="card" aria-label="Ultimate Challenge">
        <h2 className="card-title" style={{ color: T.rose }}>ULTIMATE CHALLENGE</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }} role="group" aria-label="Challenge modes">
          <button className="btn btn-secondary" style={{ flexDirection: 'column', gap: 6, padding: '14px 8px', fontSize: 11 }} onClick={() => navigate('/survival')}>
            <span style={{ fontSize: 26 }} aria-hidden="true">💀</span>
            <span style={{ fontWeight: 700 }}>Survival Mode</span>
            <span style={{ fontSize: 9, color: T.textDim }}>How far can you go?</span>
          </button>
          <button className="btn btn-secondary" style={{ flexDirection: 'column', gap: 6, padding: '14px 8px', fontSize: 11 }} onClick={() => navigate('/daily')}>
            <span style={{ fontSize: 26 }} aria-hidden="true">📅</span>
            <span style={{ fontWeight: 700 }}>Daily Challenge</span>
            <span style={{ fontSize: 9, color: T.textDim, display: 'flex', alignItems: 'center', gap: 4 }}>
              Resets in <DailyTimer />
            </span>
          </button>
        </div>
      </section>

      {/* ANIME OF THE DAY */}
      <section style={{ marginBottom: 6 }} aria-label="Anime of the Day">
        <h2 className="card-title" style={{ color: T.rose, padding: '0 2px 8px', fontSize: 11 }}>ANIME OF THE DAY</h2>
        <div className="daily-anime-card">
          <img src={dailyAnime.image} alt={dailyAnime.title} className="daily-anime-img" onError={e => { e.target.style.display = 'none'; }} loading="lazy" />
          <div className="daily-anime-overlay">
            <h3 className="daily-anime-title">{dailyAnime.title}</h3>
            <div className="daily-anime-meta">⭐ {dailyAnime.rating} · {dailyAnime.genre}</div>
          </div>
        </div>
        <div className="card" style={{ marginTop: 0 }}>
          <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6 }}>{dailyAnime.desc}</p>
        </div>
      </section>

      <section className="card" aria-label="Quote of the Day">
        <h2 className="card-title" style={{ color: T.gold }}>QUOTE OF THE DAY</h2>
        <blockquote className="quote-card">
          <p className="quote-text">"{dailyQuote.text}"</p>
          <cite className="quote-attr" style={{ fontStyle: 'normal' }}>— {dailyQuote.char} · {dailyQuote.anime}</cite>
        </blockquote>
      </section>
    </div>
  );
}
