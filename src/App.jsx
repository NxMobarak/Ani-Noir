import { useState, useEffect, useRef } from 'react';
import { questionBank, levels, getRandomQuestions } from './questions/index';

// ── Design tokens ──────────────────────────────────────
const T = {
  bg: "#050811",
  cardBg: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  rose: "#f472b6",
  gold: "#fbbf24",
  teal: "#2dd4bf",
  violet: "#a78bfa",
  text: "#f1f5f9",
  textMid: "#94a3b8",
  textDim: "#475569"
};

// Helper to shuffle array
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function App() {
  // Game state
  const [gameState, setGameState] = useState('menu');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [spades, setSpades] = useState(() => parseInt(localStorage.getItem('aninoir_spades') || 100));
  const [badges, setBadges] = useState(() => JSON.parse(localStorage.getItem('aninoir_badges') || '[]'));
  const [dailyCompleted, setDailyCompleted] = useState(() => localStorage.getItem('aninoir_daily') === new Date().toDateString());
  const [dailyQuestion, setDailyQuestion] = useState(null);
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [skipUsed, setSkipUsed] = useState(false);

  // Anime search, facts, quotes, news
  const [animeSearch, setAnimeSearch] = useState('');
  const [animeDetails, setAnimeDetails] = useState(null);
  const [fact, setFact] = useState('');
  const [quote, setQuote] = useState({ text: '', character: '', anime: '' });
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const timerRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    loadDaily();
    fetchFact();
    fetchQuote();
    fetchNews();
  }, []);

  useEffect(() => {
    localStorage.setItem('aninoir_spades', spades);
  }, [spades]);

  useEffect(() => {
    localStorage.setItem('aninoir_badges', JSON.stringify(badges));
  }, [badges]);

  // Timer logic
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  useEffect(() => {
    if (timerActive && timeLeft === 0) handleTimeout();
  }, [timeLeft, timerActive]);

  // Shuffle anagram letters
  useEffect(() => {
    if (questions[qIndex]?.type === 'anagram') {
      const word = questions[qIndex].text.replace(/\s/g, '');
      const letters = word.toUpperCase().split('');
      setScrambledLetters(shuffleArray([...letters]));
    }
  }, [qIndex, questions]);

  // ── API calls ─────────────────────────────────────────
  const fetchFact = async () => {
    try {
      const res = await fetch('https://waifu.it/api/v4/fact');
      const data = await res.json();
      setFact(data.fact || "Did you know? The first anime was Namakura Gatana (1917).");
    } catch {
      setFact("Did you know? Studio Ghibli was founded in 1985.");
    }
  };

  const fetchQuote = async () => {
    try {
      const res = await fetch('https://animechan.xyz/api/random');
      const data = await res.json();
      setQuote({ text: data.quote, character: data.character, anime: data.anime });
    } catch {
      setQuote({ text: "Believe in yourself.", character: "April", anime: "AniNoir" });
    }
  };

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      // Using AnimeNewsNetwork RSS feed (CORS enabled)
      const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.animenewsnetwork.com/all/rss.xml');
      const data = await res.json();
      if (data.items && data.items.length) {
        const items = data.items.slice(0, 5).map(item => ({
          title: item.title,
          link: item.link,
          description: item.description.replace(/<[^>]*>/g, '').slice(0, 150) + '…',
          image: item.thumbnail || item.enclosure?.link || '',
          pubDate: item.pubDate
        }));
        setNews(items);
      }
    } catch (err) {
      console.error(err);
      setNews([]);
    } finally {
      setNewsLoading(false);
    }
  };

  const searchAnime = async () => {
    if (!animeSearch.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(animeSearch)}&limit=1`);
      const data = await res.json();
      if (data.data && data.data.length) {
        const a = data.data[0];
        setAnimeDetails({
          title: a.title,
          synopsis: a.synopsis,
          score: a.score,
          episodes: a.episodes,
          status: a.status,
          year: a.year,
          studios: a.studios?.map(s => s.name).join(', ') || 'Unknown',
          genres: a.genres?.map(g => g.name).join(', ') || 'None'
        });
      } else {
        setAnimeDetails(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  // ── Daily challenge ───────────────────────────────────
  const loadDaily = () => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('aninoir_daily');
    if (storedDate === today && localStorage.getItem('aninoir_daily_q')) {
      setDailyQuestion(JSON.parse(localStorage.getItem('aninoir_daily_q')));
      return;
    }
    const pool = questionBank.filter(q => q.level >= 2 && q.level <= 4);
    if (pool.length) {
      const rand = { ...pool[Math.floor(Math.random() * pool.length)] };
      if (rand.type === 'anagram') rand.options = null;
      else rand.options = [...rand.options];
      setDailyQuestion(rand);
      localStorage.setItem('aninoir_daily_q', JSON.stringify(rand));
      localStorage.setItem('aninoir_daily', today);
    }
  };

  const submitDaily = (answer) => {
    if (dailyCompleted || !dailyQuestion) return;
    let correct = false;
    if (dailyQuestion.type === 'mcq') {
      correct = (answer === dailyQuestion.options[dailyQuestion.correct]);
    } else {
      const normalized = answer.trim().toUpperCase().replace(/[^A-Z]/g, '');
      const correctAns = dailyQuestion.answer.toUpperCase().replace(/[^A-Z]/g, '');
      correct = (normalized === correctAns);
    }
    if (correct) {
      setSpades(s => s + 30);
      setDailyCompleted(true);
      localStorage.setItem('aninoir_daily', new Date().toDateString());
      setFeedback('🎉 Daily challenge complete! +30♠');
      setTimeout(() => setFeedback(''), 2000);
    } else {
      setFeedback('❌ Wrong answer. Try again tomorrow!');
      setTimeout(() => setFeedback(''), 2000);
    }
  };

  // ── Quiz logic ────────────────────────────────────────
  const startLevel = (levelIdx) => {
    setCurrentLevel(levelIdx);
    const qs = getRandomQuestions(levelIdx + 1, 5);
    setQuestions(qs);
    setQIndex(0);
    setScore(0);
    setStreak(0);
    setUserInput('');
    setFeedback('');
    setHintRevealed(false);
    setSkipUsed(false);
    setShuffleCount(0);
    setTimeLeft(levels[levelIdx].timeSeconds);
    setTimerActive(true);
    setGameState('playing');
  };

  const handleCorrect = () => {
    const newScore = score + 1;
    const newStreak = streak + 1;
    setScore(newScore);
    setStreak(newStreak);
    if (newStreak === 5) setSpades(s => s + 10);
    if (newStreak === 10) setSpades(s => s + 25);
    setFeedback('✅ Correct!');
    setTimeout(() => moveToNextQuestion(true), 1000);
  };

  const handleWrong = () => {
    setStreak(0);
    setFeedback('❌ Wrong!');
    setTimeout(() => moveToNextQuestion(false), 1000);
  };

  const moveToNextQuestion = (wasCorrect) => {
    if (qIndex + 1 < questions.length) {
      setQIndex(i => i + 1);
      setUserInput('');
      setHintRevealed(false);
      setSkipUsed(false);
      setShuffleCount(0);
      setTimeLeft(levels[currentLevel].timeSeconds);
      setFeedback('');
    } else {
      const passed = (wasCorrect ? score + 1 : score) >= levels[currentLevel].minCorrect;
      if (passed) {
        const reward = levels[currentLevel].reward;
        setSpades(s => s + reward);
        if (currentLevel === 4) {
          const season = Math.floor(Date.now() / (90 * 24 * 3600000));
          const badgeId = `season_${season}`;
          if (!badges.includes(badgeId)) setBadges(b => [...b, badgeId]);
        }
        setFeedback(`🎉 Level cleared! +${reward}♠`);
      } else {
        setFeedback(`❌ Failed. Need ${levels[currentLevel].minCorrect} correct.`);
      }
      setTimerActive(false);
      setGameState('result');
      setTimeout(() => setFeedback(''), 2000);
    }
  };

  const handleTimeout = () => {
    setTimerActive(false);
    setFeedback('⏰ Time\'s up!');
    setStreak(0);
    setTimeout(() => moveToNextQuestion(false), 1000);
  };

  const submitAnswer = () => {
    if (!timerActive) return;
    const q = questions[qIndex];
    let isCorrect = false;
    if (q.type === 'mcq') {
      if (userInput === q.options[q.correct]) isCorrect = true;
    } else if (q.type === 'anagram') {
      const normalized = userInput.trim().toUpperCase().replace(/[^A-Z]/g, '');
      const correctAns = q.answer.toUpperCase().replace(/[^A-Z]/g, '');
      isCorrect = (normalized === correctAns);
    }
    if (isCorrect) handleCorrect();
    else handleWrong();
    setTimerActive(false);
  };

  const shuffleLetters = () => {
    if (spades < 20 || questions[qIndex]?.type !== 'anagram') return;
    const word = questions[qIndex].text.replace(/\s/g, '');
    const letters = word.toUpperCase().split('');
    setScrambledLetters(shuffleArray([...letters]));
    setSpades(s => s - 20);
    setShuffleCount(c => c + 1);
  };

  const useHint = () => {
    if (spades < 30 || hintRevealed) return;
    setSpades(s => s - 30);
    setHintRevealed(true);
  };

  const skipQuestion = () => {
    if (spades < 50 || skipUsed || !timerActive) return;
    setSpades(s => s - 50);
    setSkipUsed(true);
    setFeedback('⏩ Skipped!');
    setStreak(0);
    setTimerActive(false);
    setTimeout(() => moveToNextQuestion(false), 1000);
  };

  const renderAnagramDisplay = () => {
    if (questions[qIndex]?.type !== 'anagram') return null;
    return (
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <div style={{ fontSize: 28, letterSpacing: 12, fontWeight: 'bold', color: T.rose, wordBreak: 'break-word' }}>
          {scrambledLetters.join(' ')}
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: T.textMid }}>
          {hintRevealed && questions[qIndex].hint && <div>💡 Hint: {questions[qIndex].hint}</div>}
        </div>
      </div>
    );
  };

  // ── UI ─────────────────────────────────────────────────
  return (
    <div style={{ background: T.bg, minHeight: '100dvh', color: T.text, padding: '1rem' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ background: T.cardBg, padding: '5px 12px', borderRadius: 20, border: `1px solid ${T.border}` }}>♠ {spades}</span>
            <span style={{ background: T.cardBg, padding: '5px 12px', borderRadius: 20, border: `1px solid ${T.border}` }}>🏅 {badges.length}</span>
          </div>
          <a href="https://www.instagram.com/mobarak_sekh_?igsh=MTlmamVqcXl5bnI1Mg==" target="_blank" rel="noopener noreferrer" style={{ color: T.gold, textDecoration: 'none', fontSize: 14 }}>📷 Follow @AniNoir</a>
        </div>

        {gameState === 'menu' && (
          <>
            {/* Daily challenge */}
            {dailyQuestion && !dailyCompleted && (
              <div style={{ background: T.cardBg, borderRadius: 24, padding: 20, marginBottom: 24, borderLeft: `4px solid ${T.gold}` }}>
                <h3 style={{ color: T.gold, marginBottom: 8 }}>📅 Daily Challenge</h3>
                <p>{dailyQuestion.type === 'mcq' ? dailyQuestion.text : `Untangle: ${dailyQuestion.text}`}</p>
                {dailyQuestion.type === 'mcq' ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                    {dailyQuestion.options.map((opt, idx) => (
                      <button key={idx} onClick={() => submitDaily(opt)} style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 30, padding: '8px 16px', cursor: 'pointer' }}>{opt}</button>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <input type="text" onKeyDown={e => e.key==='Enter' && submitDaily(e.target.value)} placeholder="Your answer..." style={{ flex:1, padding: 10, borderRadius: 30, border: `1px solid ${T.border}`, background: 'transparent', color: T.text }} />
                    <button onClick={e => submitDaily(document.querySelector('input')?.value)} style={{ background: T.rose, border: 'none', borderRadius: 30, padding: '8px 20px', cursor: 'pointer' }}>Submit</button>
                  </div>
                )}
                {feedback && <div style={{ marginTop: 12, color: T.rose }}>{feedback}</div>}
              </div>
            )}

            {/* Level selection */}
            <h2 style={{ fontSize: 24, marginBottom: 20 }}>Choose your level</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {levels.map((lvl, idx) => (
                <button key={idx} onClick={() => startLevel(idx)} style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 40, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div><span style={{ fontSize: 20 }}>{lvl.name}</span><br /><span style={{ fontSize: 12, color: T.textMid }}>Min {lvl.minCorrect}/5 · {lvl.timeSeconds}s · ♠{lvl.reward}</span></div>
                  <span style={{ fontSize: 24 }}>➡</span>
                </button>
              ))}
            </div>

            {/* What's New Otaku - Anime News */}
            <div style={{ marginTop: 40 }}>
              <h3 style={{ color: T.teal, marginBottom: 16 }}>📰 What's New, Otaku?</h3>
              {newsLoading && <div>Loading news...</div>}
              {!newsLoading && news.length === 0 && <div>No news available.</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {news.map((item, idx) => (
                  <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: T.text, background: T.cardBg, borderRadius: 20, padding: 12, display: 'flex', gap: 12, border: `1px solid ${T.border}` }}>
                    {item.image && <img src={item.image} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 12, background: T.bg }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: T.textMid }}>{item.description}</div>
                      <div style={{ fontSize: 11, color: T.rose, marginTop: 4 }}>Read full article →</div>
                    </div>
                  </a>
                ))}
              </div>
              <button onClick={fetchNews} style={{ marginTop: 12, background: 'none', border: `1px solid ${T.border}`, borderRadius: 30, padding: '8px 16px', cursor: 'pointer', width: '100%' }}>⟳ Refresh news</button>
            </div>

            {/* Anime search, facts, quotes */}
            <div style={{ marginTop: 30 }}>
              <div style={{ background: T.cardBg, borderRadius: 24, padding: 20, marginBottom: 16 }}>
                <h3 style={{ color: T.teal }}>🔍 Anime details</h3>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <input type="text" value={animeSearch} onChange={e => setAnimeSearch(e.target.value)} placeholder="Search anime..." style={{ flex:1, padding: 10, borderRadius: 30, border: `1px solid ${T.border}`, background: 'transparent', color: T.text }} />
                  <button onClick={searchAnime} style={{ background: T.rose, border: 'none', borderRadius: 30, padding: '8px 20px' }}>Search</button>
                </div>
                {searchLoading && <div style={{ marginTop: 12 }}>Loading...</div>}
                {animeDetails && (
                  <div style={{ marginTop: 12, fontSize: 14 }}>
                    <h4>{animeDetails.title}</h4>
                    <p>{animeDetails.synopsis?.slice(0, 150)}…</p>
                    <p>⭐ {animeDetails.score} · 📺 {animeDetails.episodes} eps · {animeDetails.status}</p>
                    <p>🎬 {animeDetails.studios} · {animeDetails.genres}</p>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, background: T.cardBg, borderRadius: 24, padding: 16 }}>
                  <h3 style={{ color: T.violet }}>📖 Did you know?</h3>
                  <p style={{ marginTop: 8, fontSize: 14 }}>{fact}</p>
                  <button onClick={fetchFact} style={{ marginTop: 12, background: 'none', border: `1px solid ${T.border}`, borderRadius: 20, padding: '6px 12px', cursor: 'pointer' }}>⟳ New fact</button>
                </div>
                <div style={{ flex: 1, background: T.cardBg, borderRadius: 24, padding: 16 }}>
                  <h3 style={{ color: T.gold }}>💬 Quote of the day</h3>
                  <p style={{ marginTop: 8, fontSize: 14, fontStyle: 'italic' }}>“{quote.text}”</p>
                  <p style={{ fontSize: 12, color: T.textMid }}>— {quote.character} ({quote.anime})</p>
                  <button onClick={fetchQuote} style={{ marginTop: 12, background: 'none', border: `1px solid ${T.border}`, borderRadius: 20, padding: '6px 12px', cursor: 'pointer' }}>⟳ New quote</button>
                </div>
              </div>
            </div>
          </>
        )}

        {gameState === 'playing' && questions.length > 0 && (
          <div style={{ background: T.cardBg, borderRadius: 32, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>{levels[currentLevel].name} · Lvl {currentLevel+1}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 20, color: timeLeft <= 5 ? T.rose : T.text }}>⏱️ {timeLeft}s</div>
              <div>✅ {score}/{questions.length}</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>{questions[qIndex].type === 'mcq' ? questions[qIndex].text : 'UNTANGLE THE ANAGRAM'}</div>
            {renderAnagramDisplay()}
            {questions[qIndex].type === 'mcq' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {questions[qIndex].options.map((opt, idx) => (
                  <button key={idx} onClick={() => { setUserInput(opt); submitAnswer(); }} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 50, padding: '12px 20px', textAlign: 'left', cursor: 'pointer' }}>{opt}</button>
                ))}
              </div>
            ) : (
              <div>
                <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key==='Enter' && submitAnswer()} placeholder="Your answer..." style={{ width: '100%', padding: 14, borderRadius: 40, border: `1px solid ${T.border}`, background: 'transparent', color: T.text, marginBottom: 16 }} />
                <button onClick={submitAnswer} style={{ background: T.rose, border: 'none', borderRadius: 40, padding: '12px 24px', width: '100%', cursor: 'pointer' }}>Submit</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={shuffleLetters} disabled={spades < 20 || questions[qIndex]?.type !== 'anagram'} style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 30, padding: '8px 16px', flex:1, opacity: (spades < 20 || questions[qIndex]?.type !== 'anagram') ? 0.5 : 1 }}>🔀 SHUFFLE 20♠</button>
              <button onClick={useHint} disabled={hintRevealed || spades < 30} style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 30, padding: '8px 16px', flex:1, opacity: (hintRevealed || spades < 30) ? 0.5 : 1 }}>💡 HINT 30♠</button>
              <button onClick={skipQuestion} disabled={skipUsed || spades < 50} style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 30, padding: '8px 16px', flex:1, opacity: (skipUsed || spades < 50) ? 0.5 : 1 }}>⏭️ SKIP 50♠</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, fontSize: 14 }}>
              <span>🔥 STREAK {streak}</span>
              <span>♠ {spades}</span>
            </div>
            {feedback && <div style={{ marginTop: 20, textAlign: 'center', fontSize: 16 }}>{feedback}</div>}
          </div>
        )}

        {gameState === 'result' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>{score >= levels[currentLevel].minCorrect ? '🏆' : '😓'}</div>
            <h2>{score >= levels[currentLevel].minCorrect ? 'Level cleared!' : 'Level failed'}</h2>
            <p>You got {score}/{questions.length} correct.</p>
            <button onClick={() => setGameState('menu')} style={{ background: T.rose, border: 'none', borderRadius: 40, padding: '12px 30px', marginTop: 24, cursor: 'pointer' }}>Back to menu</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;