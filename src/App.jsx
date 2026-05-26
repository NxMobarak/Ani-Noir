import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './styles/app.css';
import NAV from './constants/nav';
import { playClick } from './utils/audio';
import { useSwipe } from './utils/swipe';
import { safeGet, safeSet, migrateData } from './utils/dataValidator';
import { getXP, getRank } from './utils/xpSystem';
import SidebarContent from './components/SidebarContent';
import SpadesModal from './components/SpadesModal';
import RulesModal from './components/RulesModal';
import ErrorBoundary from './components/ErrorBoundary';

// ─── Code Splitting: Lazy-loaded game modes ─────────────────
const AnimeQuiz = lazy(() => import('./games/anime-quiz'));
const WordNinja = lazy(() => import('./games/word-ninja'));
const EmojiWars = lazy(() => import('./games/emoji-wars'));
const AnimeShadow = lazy(() => import('./games/anime-shadow'));
const AnimeMoments = lazy(() => import('./games/anime-moments'));
const AnimeTheme = lazy(() => import('./games/anime-theme'));
const FrameGuess = lazy(() => import('./games/frame-guess'));
const DialogueClash = lazy(() => import('./games/dialogue-clash'));

// ─── Code Splitting: Lazy-loaded pages ──────────────────────
const HomePage = lazy(() => import('./pages/HomePage'));
const SurvivalPage = lazy(() => import('./pages/SurvivalPage'));
const DailyPage = lazy(() => import('./pages/DailyPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const CharacterSearchPage = lazy(() => import('./pages/CharacterSearchPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const BirthdaysPage = lazy(() => import('./pages/BirthdaysPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Loading fallback for lazy-loaded pages
function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60 }}>
      <div className="skeleton" style={{ width: 120, height: 20 }} />
    </div>
  );
}

// Run data migration on first load
migrateData();

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [spades, setSpades] = useState(() => safeGet('ani_spades', 100));
  const [badges, setBadges] = useState(() => safeGet('ani_badges', []));
  const [feedback, setFeedback] = useState('');
  const [spadesModal, setSpadesModal] = useState(false);
  const [rulesModal, setRulesModal] = useState(false);
  const [showChipHint, setShowChipHint] = useState(() => !localStorage.getItem('ani_chip_hint_shown'));
  const [spadesFloat, setSpadesFloat] = useState(null);
  const feedbackTimer = useRef(null);
  const spadesFloatTimer = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Memoized feedback function to avoid re-renders
  const showFeedback = useCallback((msg) => {
    setFeedback(msg);
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(''), 2200);
    const spadesMatch = msg.match(/\+(\d+)\s*(?:spades|♠)/i);
    if (spadesMatch) {
      setSpadesFloat(`+${spadesMatch[1]}♠`);
      clearTimeout(spadesFloatTimer.current);
      spadesFloatTimer.current = setTimeout(() => setSpadesFloat(null), 1300);
    }
  }, []);

  // Persist spades and badges
  useEffect(() => { safeSet('ani_spades', String(spades)); }, [spades]);
  useEffect(() => { safeSet('ani_badges', badges); }, [badges]);

  useEffect(() => {
    if (!localStorage.getItem('ani_offline_shown')) {
      setTimeout(() => {
        showFeedback('Quizzes work offline! No internet needed.');
        localStorage.setItem('ani_offline_shown', '1');
      }, 2000);
    }
  }, [showFeedback]);

  useEffect(() => {
    if (showChipHint) {
      const timer = setTimeout(() => {
        setShowChipHint(false);
        localStorage.setItem('ani_chip_hint_shown', '1');
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showChipHint]);

  // Swipe to open/close sidebar on mobile
  const sidebarSwipe = useSwipe({
    onSwipeRight: useCallback(() => setSidebarOpen(true), []),
    onSwipeLeft: useCallback(() => setSidebarOpen(false), []),
    threshold: 60,
  });

  const currentNav = NAV.find(n => n.path === location.pathname);
  const pageTitle = currentNav?.label || 'AniNoir';

  // Memoized setSpades to avoid child re-renders
  const memoizedSetSpades = useCallback((updater) => {
    setSpades(updater);
  }, []);

  return (
    <>
    <div className="app-shell" {...sidebarSwipe}>
      {/* Skip to content link for keyboard users */}
      <a href="#main-content" className="skip-to-content" style={{
        position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px',
        overflow: 'hidden', zIndex: 9999,
      }} onFocus={(e) => { e.target.style.cssText = 'position:fixed;top:10px;left:10px;z-index:9999;padding:12px 20px;background:#f43f5e;color:#fff;border-radius:8px;font-weight:700;text-decoration:none;'; }}
        onBlur={(e) => { e.target.style.cssText = 'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;z-index:9999;'; }}
      >
        Skip to content
      </a>

      {/* Desktop Sidebar */}
      <nav className="desktop-sidebar" aria-label="Main navigation">
        <SidebarContent spades={spades} onSpadesClick={() => setSpadesModal(true)} onRulesClick={() => setRulesModal(true)} />
      </nav>

      {/* Mobile Sidebar */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Mobile navigation" role="navigation">
        <SidebarContent spades={spades} onSpadesClick={() => setSpadesModal(true)} onCloseSidebar={() => setSidebarOpen(false)} onRulesClick={() => setRulesModal(true)} />
      </nav>

      {/* Main Content */}
      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu" aria-expanded={sidebarOpen}>☰</button>
          <h1 className="topbar-title" style={{ fontSize: 16, fontWeight: 700 }}>{pageTitle}</h1>
          <div className="topbar-chips" role="toolbar" aria-label="Quick actions">
            <button className={`chip ${showChipHint ? 'chip-pulse' : ''}`} onClick={() => { setSpadesModal(true); if (showChipHint) { setShowChipHint(false); localStorage.setItem('ani_chip_hint_shown', '1'); } }} aria-label={`${spades} spades`}>
              ♠ {spades}
              {showChipHint && <span className="chip-tooltip">Tap for info</span>}
            </button>
            <button className="chip" onClick={() => { showFeedback(`You have ${badges.length} badge${badges.length !== 1 ? 's' : ''}! Check About page.`); }} aria-label={`${badges.length} badges`}>
              🏅 {badges.length}
            </button>
            <button className="chip" onClick={() => navigate('/profile')} aria-label={`Rank: ${getRank(getXP()).name}`}>
              {getRank(getXP()).icon} {getRank(getXP()).name}
            </button>
          </div>
        </header>

        <main id="main-content" className="page" role="main">
          <div className="page-enter" key={location.pathname}>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/quiz" element={<AnimeQuiz spades={spades} setSpades={memoizedSetSpades} showFeedback={showFeedback} />} />
                  <Route path="/ninja" element={<WordNinja spades={spades} setSpades={memoizedSetSpades} showFeedback={showFeedback} />} />
                  <Route path="/emoji" element={<EmojiWars spades={spades} setSpades={memoizedSetSpades} showFeedback={showFeedback} />} />
                  <Route path="/shadow" element={<AnimeShadow spades={spades} setSpades={memoizedSetSpades} showFeedback={showFeedback} />} />
                  <Route path="/moments" element={<AnimeMoments spades={spades} setSpades={memoizedSetSpades} showFeedback={showFeedback} />} />
                  <Route path="/theme" element={<AnimeTheme spades={spades} setSpades={memoizedSetSpades} showFeedback={showFeedback} />} />
                  <Route path="/frameguess" element={<FrameGuess spades={spades} setSpades={memoizedSetSpades} showFeedback={showFeedback} />} />
                  <Route path="/dialogue" element={<DialogueClash spades={spades} setSpades={memoizedSetSpades} showFeedback={showFeedback} />} />
                  <Route path="/survival" element={<SurvivalPage spades={spades} setSpades={memoizedSetSpades} showFeedback={showFeedback} />} />
                  <Route path="/daily" element={<DailyPage spades={spades} setSpades={memoizedSetSpades} showFeedback={showFeedback} />} />
                  <Route path="/search" element={<SearchPage showFeedback={showFeedback} />} />
                  <Route path="/charsearch" element={<CharacterSearchPage showFeedback={showFeedback} />} />
                  <Route path="/watchlist" element={<WatchlistPage showFeedback={showFeedback} />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/birthdays" element={<BirthdaysPage />} />
                  <Route path="/settings" element={<SettingsPage showFeedback={showFeedback} />} />
                  <Route path="/profile" element={<ProfilePage spades={spades} badges={badges} showFeedback={showFeedback} />} />
                  <Route path="/about" element={<AboutPage spades={spades} badges={badges} />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>

    </div>

    {/* Bottom Navigation Bar - Outside app-shell for proper fixed positioning in PWA standalone mode */}
    <nav className="bottom-nav" aria-label="Bottom navigation">
      <a href="https://www.youtube.com/@AnimeTMTalks" target="_blank" rel="noopener noreferrer" className="bottom-nav-item" aria-label="YouTube">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      </a>
      <a href="https://www.instagram.com/mobarak.jpg" target="_blank" rel="noopener noreferrer" className="bottom-nav-item" aria-label="Instagram">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
      </a>
      <button className="bottom-nav-item bottom-nav-home" onClick={() => { if (location.pathname === '/') { window.location.reload(); } else { navigate('/'); } }} aria-label="Home">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </button>
      <button className="bottom-nav-item" onClick={() => navigate('/settings')} aria-label="Settings">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </button>
      <button className="bottom-nav-item" onClick={() => navigate('/profile')} aria-label="Profile">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </button>
    </nav>

    {/* Feedback Toast */}
    {feedback && (
      <div
        className={`feedback-toast ${feedback.startsWith('Correct') ? 'correct-toast' : (feedback.startsWith('Wrong') || feedback.startsWith("Time")) ? 'wrong-toast' : ''}`}
        role="status"
        aria-live="polite"
      >
        {feedback.startsWith('Correct') ? `✓ ${feedback}` : (feedback.startsWith('Wrong') || feedback.startsWith("Time")) ? `✗ ${feedback}` : feedback}
      </div>
    )}
    {spadesFloat && <div className="spades-float" key={Date.now()} aria-hidden="true">{spadesFloat}</div>}
    {spadesModal && <SpadesModal onClose={() => setSpadesModal(false)} />}
    {rulesModal && <RulesModal onClose={() => setRulesModal(false)} />}
    </>
  );
}
