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

      <section className="card" aria-label="Quick Play">
        <h2 className="card-title" style={{ color: T.teal }}>QUICK PLAY</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="group" aria-label="Game modes">
          {[['quiz', '🧠', 'Quiz'], ['/emoji', '🎯', 'Emoji Wars'], ['/anagram', '🔤', 'Word Ninja'], ['/frames', '🖼️', 'Moments'], ['/shadow', '🕵️', 'Shadow'], ['/survival', '💀', 'Survival'], ['/daily', '📅', 'Daily']].map(([path, ico, lbl]) => (
            <button key={path} className="btn btn-secondary" style={{ flex: '1 0 28%', flexDirection: 'column', gap: 4, padding: '10px 4px', fontSize: 10 }} onClick={() => navigate(path.startsWith('/') ? path : `/${path}`)}>
              <span style={{ fontSize: 20 }} aria-hidden="true">{ico}</span><span>{lbl}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
