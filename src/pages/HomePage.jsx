import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import T from '../constants/theme';
import { getDailyAnime, getDailyQuote } from '../constants/data';

function LatestYouTubeCard() {
  const [video, setVideo] = useState(null);
  useEffect(() => {
    const RSS = 'https://api.rss2json.com/v1/api.json?rss_url=https://www.youtube.com/feeds/videos.xml?channel_id=UCxvnMryqeGfklJRwGM1r9eA&count=1';
    fetch(RSS).then(r=>r.json()).then(d=>{
      const v = d.items?.[0];
      if(v) setVideo({ title: v.title, link: v.link, thumb: v.thumbnail, date: new Date(v.pubDate).toLocaleDateString() });
    }).catch(()=>{});
  },[]);
  if (!video) return null;
  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      <div style={{ padding:'14px 16px 8px' }}>
        <div className="card-title" style={{ color: '#ff4444', marginBottom:8 }}>LATEST VIDEO</div>
      </div>
      <a href={video.link} target="_blank" rel="noopener noreferrer" className="yt-card" style={{ margin:'0 12px 12px', borderRadius:14 }}>
        <img src={video.thumb} alt="" className="yt-thumb" onError={e=>e.target.style.display='none'} />
        <div className="yt-info">
          <div className="yt-title">{video.title}</div>
          <div className="yt-sub">AnimeTMTalks · {video.date}</div>
        </div>
      </a>
    </div>
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
      <div className="hero-banner">
        <div className="hero-greeting">{greeting}, Otaku!</div>
        <div className="hero-sub">Ready to test your anime knowledge?</div>
        <button className="btn btn-primary" style={{ marginTop: 14, borderRadius: 10 }} onClick={() => navigate('/quiz')}>
          Start Quiz
        </button>
      </div>

      <LatestYouTubeCard />

      <div style={{ marginBottom: 6 }}>
        <div className="card-title" style={{ color: T.rose, padding: '0 2px 8px', fontSize: 11 }}>ANIME OF THE DAY</div>
        <div className="daily-anime-card">
          <img src={dailyAnime.image} alt={dailyAnime.title} className="daily-anime-img" onError={e=>{e.target.style.display='none';}} />
          <div className="daily-anime-overlay">
            <div className="daily-anime-title">{dailyAnime.title}</div>
            <div className="daily-anime-meta">⭐ {dailyAnime.rating} · {dailyAnime.genre}</div>
          </div>
        </div>
        <div className="card" style={{ marginTop: 0 }}>
          <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6 }}>{dailyAnime.desc}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ color: T.gold }}>QUOTE OF THE DAY</div>
        <div className="quote-card">
          <div className="quote-text">"{dailyQuote.text}"</div>
          <div className="quote-attr">— {dailyQuote.char} · {dailyQuote.anime}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ color: T.teal }}>QUICK PLAY</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['quiz','🧠','Quiz'],['/emoji','🎯','Emoji'],['/anagram','🔤','Scramble'],['/frames','🖼️','Frames'],['/shadow','🕵️','Shadow'],['/survival','💀','Survive'],['/daily','📅','Daily']].map(([path,ico,lbl])=>(
            <button key={path} className="btn btn-secondary" style={{ flex:'1 0 28%', flexDirection:'column', gap:4, padding:'10px 4px', fontSize:10 }} onClick={()=>navigate(path.startsWith('/')?path:`/${path}`)}>
              <span style={{ fontSize: 20 }}>{ico}</span><span>{lbl}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
