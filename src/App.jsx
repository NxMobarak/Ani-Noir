import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './styles/app.css';
import T from './constants/theme';
import NAV from './constants/nav';
import { playClick } from './utils/audio';
import SidebarContent from './components/SidebarContent';
import SpadesModal from './components/SpadesModal';
import RulesModal from './components/RulesModal';

// Pages
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import EmojiQuizPage from './pages/EmojiQuizPage';
import AnimeFramesPage from './pages/AnimeFramesPage';
import ShadowQuizPage from './pages/ShadowQuizPage';
import SurvivalPage from './pages/SurvivalPage';
import DailyPage from './pages/DailyPage';
import SearchPage from './pages/SearchPage';
import CharacterSearchPage from './pages/CharacterSearchPage';
import WatchlistPage from './pages/WatchlistPage';
import NewsPage from './pages/NewsPage';
import BirthdaysPage from './pages/BirthdaysPage';
import AboutPage from './pages/AboutPage';
import SettingsPage from './pages/SettingsPage';


// Coming Soon placeholder
function ComingSoonPage({ title, icon }) {
  return (
    <div className="shadow-lock">
      <div style={{ fontSize: 72, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: T.textMid, marginBottom: 20, lineHeight: 1.7 }}>
        This mode is coming soon!
      </div>
      <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 14, padding: '12px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.gold }}>Coming Soon</div>
        <div style={{ fontSize: 12, color: T.textMid, marginTop: 4 }}>Stay tuned for updates!</div>
      </div>
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [spades, setSpades] = useState(() => parseInt(localStorage.getItem('ani_spades') || '100'));
  const [badges, setBadges] = useState(() => JSON.parse(localStorage.getItem('ani_badges') || '[]'));
  const [feedback, setFeedback] = useState('');
  const [spadesModal, setSpadesModal] = useState(false);
  const [rulesModal, setRulesModal] = useState(false);
  const [showChipHint, setShowChipHint] = useState(() => !localStorage.getItem('ani_chip_hint_shown'));
  const [spadesFloat, setSpadesFloat] = useState(null);
  const feedbackTimer = useRef(null);
  const spadesFloatTimer = useRef(null);
  const location = useLocation();


  const showFeedback = (msg) => {
    setFeedback(msg);
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(''), 2200);
    const spadesMatch = msg.match(/\+(\d+)\s*(?:spades|♠)/i);
    if (spadesMatch) {
      setSpadesFloat(`+${spadesMatch[1]}♠`);
      clearTimeout(spadesFloatTimer.current);
      spadesFloatTimer.current = setTimeout(() => setSpadesFloat(null), 1300);
    }
  };

  useEffect(() => { localStorage.setItem('ani_spades', spades); }, [spades]);
  useEffect(() => { localStorage.setItem('ani_badges', JSON.stringify(badges)); }, [badges]);

  useEffect(() => {
    if (!localStorage.getItem('ani_offline_shown')) {
      setTimeout(() => {
        showFeedback('Quizzes work offline! No internet needed.');
        localStorage.setItem('ani_offline_shown', '1');
      }, 2000);
    }
  }, []);

  useEffect(() => {
    if (showChipHint) {
      const timer = setTimeout(() => {
        setShowChipHint(false);
        localStorage.setItem('ani_chip_hint_shown', '1');
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showChipHint]);

  const currentNav = NAV.find(n => n.path === location.pathname);
  const pageTitle = currentNav?.label || 'AniNoir';

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <div className="desktop-sidebar">
        <SidebarContent spades={spades} onSpadesClick={() => setSpadesModal(true)} />
      </div>

      {/* Mobile Sidebar */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <SidebarContent spades={spades} onSpadesClick={() => setSpadesModal(true)} onCloseSidebar={() => setSidebarOpen(false)} />
      </div>


      {/* Main Content */}
      <div className="main">
        <div className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <span className="topbar-title">{pageTitle}</span>
          <div className="topbar-chips">
            <span className="chip" onClick={() => setRulesModal(true)}>📜</span>
            <span className={`chip ${showChipHint ? 'chip-pulse' : ''}`} onClick={() => { setSpadesModal(true); if (showChipHint) { setShowChipHint(false); localStorage.setItem('ani_chip_hint_shown', '1'); } }}>
              ♠ {spades}
              {showChipHint && <span className="chip-tooltip">Tap for info</span>}
            </span>
            <span className={`chip ${showChipHint ? 'chip-pulse' : ''}`} onClick={() => { showFeedback(`You have ${badges.length} badge${badges.length !== 1 ? 's' : ''}! Check About page.`); if (showChipHint) { setShowChipHint(false); localStorage.setItem('ani_chip_hint_shown', '1'); } }}>
              🏅 {badges.length}
            </span>
          </div>
        </div>

        <div className="page">
          <div className="page-enter" key={location.pathname}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/quiz" element={<QuizPage spades={spades} setSpades={setSpades} showFeedback={showFeedback} mcqOnly={true} mode="quiz" />} />
              <Route path="/anagram" element={<QuizPage spades={spades} setSpades={setSpades} showFeedback={showFeedback} anagramOnly={true} mode="anagram" />} />
              <Route path="/emoji" element={<EmojiQuizPage spades={spades} setSpades={setSpades} showFeedback={showFeedback} />} />
              <Route path="/shadow" element={<ShadowQuizPage spades={spades} setSpades={setSpades} showFeedback={showFeedback} />} />
              <Route path="/frames" element={<AnimeFramesPage spades={spades} setSpades={setSpades} showFeedback={showFeedback} />} />
              <Route path="/opening" element={<ComingSoonPage title="Opening Challenge" icon="🎵" />} />
              <Route path="/ending" element={<ComingSoonPage title="Ending Challenge" icon="🎶" />} />
              <Route path="/sceneguess" element={<ComingSoonPage title="Guess the Scene" icon="🎬" />} />
              <Route path="/dialogue" element={<ComingSoonPage title="Dialogue Challenge" icon="💬" />} />
              <Route path="/survival" element={<SurvivalPage spades={spades} setSpades={setSpades} showFeedback={showFeedback} />} />
              <Route path="/daily" element={<DailyPage spades={spades} setSpades={setSpades} showFeedback={showFeedback} />} />
              <Route path="/search" element={<SearchPage showFeedback={showFeedback} />} />
              <Route path="/charsearch" element={<CharacterSearchPage showFeedback={showFeedback} />} />
              <Route path="/watchlist" element={<WatchlistPage showFeedback={showFeedback} />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/birthdays" element={<BirthdaysPage />} />
              <Route path="/settings" element={<SettingsPage showFeedback={showFeedback} />} />
              <Route path="/about" element={<AboutPage spades={spades} badges={badges} />} />
            </Routes>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && <div className={`feedback-toast ${feedback.startsWith('Correct') ? 'correct-toast' : (feedback.startsWith('Wrong') || feedback.startsWith("Time")) ? 'wrong-toast' : ''}`}>{feedback.startsWith('Correct') ? `✓ ${feedback}` : (feedback.startsWith('Wrong') || feedback.startsWith("Time")) ? `✗ ${feedback}` : feedback}</div>}
      {spadesFloat && <div className="spades-float" key={Date.now()}>{spadesFloat}</div>}
      {spadesModal && <SpadesModal onClose={() => setSpadesModal(false)} />}
      {rulesModal && <RulesModal onClose={() => setRulesModal(false)} />}
    </div>
  );
}
