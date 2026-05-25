import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { SHADOW_CHARACTERS } from '../constants/data';
import { shuffle } from '../utils/helpers';
import { playCorrect, playWrong, playCombo } from '../utils/audio';
import BackButton from '../components/BackButton';
import '../styles/shadow-quiz.css';

/* ─── Shadow Image Component ─────────────────────────────────── */
const ShadowImage = memo(function ShadowImage({ file, revealed }) {
  return (
    <img
      src={`/shadows/${file}`}
      alt="Shadow character silhouette"
      className={`sg-silhouette ${revealed ? 'revealed' : 'hidden'}`}
    />
  );
});

/* ─── Keyboard Layout ─────────────────────────────────────────── */
const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

/* ─── SVG Icons ───────────────────────────────────────────────── */
const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const BackspaceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
    <line x1="18" y1="9" x2="12" y2="15"/>
    <line x1="12" y1="9" x2="18" y2="15"/>
  </svg>
);

/* ─── Main Component ──────────────────────────────────────────── */
export default function ShadowQuizPage({ spades, setSpades, showFeedback }) {
  const [phase, setPhase] = useState('intro');
  const [characters, setCharacters] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [revealed, setRevealed] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [guess, setGuess] = useState('');
  const [hintLetters, setHintLetters] = useState([]);
  const timerRef = useRef(null);
  const advanceRef = useRef(null);

  const startGame = useCallback(() => {
    const shuffled = shuffle(SHADOW_CHARACTERS);
    setCharacters(shuffled);
    setCurrentIdx(0);
    setLives(3);
    setScore(0);
    setWrongCount(0);
    setStreak(0);
    setTimeLeft(30);
    setRevealed(false);
    setWasCorrect(null);
    setGuess('');
    setHintLetters([]);
    setPhase('playing');
  }, []);

  const currentChar = characters[currentIdx];

  // Timer countdown
  useEffect(() => {
    if (phase !== 'playing' || revealed) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, currentIdx, revealed]);

  const handleTimeout = () => {
    setRevealed(true);
    setWasCorrect(false);
    setStreak(0);
    setWrongCount(w => w + 1);
    playWrong();
    const newLives = lives - 1;
    setLives(newLives);
    if (newLives <= 0) {
      setTimeout(() => setPhase('result'), 2000);
    } else {
      advanceRef.current = setTimeout(() => advanceToNext(), 3000);
    }
  };

  const advanceToNext = () => {
    if (currentIdx + 1 >= characters.length) {
      setPhase('result');
      return;
    }
    const nextIdx = currentIdx + 1;
    setCurrentIdx(nextIdx);
    setTimeLeft(30);
    setRevealed(false);
    setWasCorrect(null);
    setGuess('');
    setHintLetters([]);
  };

  const handleHint = useCallback(() => {
    if (revealed || !currentChar) return;
    if (spades < 10) {
      showFeedback('Not enough ♠ for hint!');
      return;
    }
    const name = currentChar.name;
    // Find unrevealed letter positions (skip spaces and already hinted)
    const available = [];
    for (let i = 0; i < name.length; i++) {
      if (name[i] !== ' ' && !hintLetters.includes(i)) {
        available.push(i);
      }
    }
    if (available.length === 0) return;
    // Pick a random unrevealed position
    const randomIdx = available[Math.floor(Math.random() * available.length)];
    setHintLetters(prev => [...prev, randomIdx]);
    setSpades(s => s - 10);
    showFeedback(`💡 Hint: letter "${name[randomIdx].toUpperCase()}" revealed! -10 ♠`);
  }, [revealed, currentChar, spades, hintLetters]);

  const handleSubmit = useCallback(() => {
    if (revealed || !currentChar || !guess.trim()) return;
    clearInterval(timerRef.current);

    const isCorrect = guess.trim().toLowerCase() === currentChar.name.toLowerCase();

    if (isCorrect) {
      setRevealed(true);
      setWasCorrect(true);
      const newScore = score + 1;
      setScore(newScore);
      const newStreak = streak + 1;
      setStreak(newStreak);

      if (newScore % 5 === 0) {
        setSpades(s => s + 100);
        showFeedback('+100 ♠ Milestone!');
      }

      if (newStreak % 3 === 0) {
        playCombo();
        const bonus = 50;
        setSpades(s => s + bonus);
        showFeedback(`🔥 ${newStreak}x Streak! +${bonus} ♠`);
      } else {
        playCorrect();
      }

      advanceRef.current = setTimeout(() => advanceToNext(), 2500);
    } else {
      setRevealed(true);
      setWasCorrect(false);
      setStreak(0);
      setWrongCount(w => w + 1);
      playWrong();
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setTimeout(() => setPhase('result'), 2000);
      } else {
        advanceRef.current = setTimeout(() => advanceToNext(), 3000);
      }
    }
  }, [revealed, currentChar, guess, score, streak, lives, currentIdx, characters]);

  const handleKeyPress = useCallback((key) => {
    if (revealed) return;
    if (key === 'BACKSPACE') {
      setGuess(g => g.slice(0, -1));
    } else if (key === 'ENTER') {
      handleSubmit();
    } else if (key === 'SPACE') {
      setGuess(g => g + ' ');
    } else {
      setGuess(g => g + key);
    }
  }, [revealed, handleSubmit]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(advanceRef.current);
    };
  }, []);

  // ─── Timer calculations ────────────────────────────────────
  const timerRadius = 21;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerProgress = Math.max(0, timeLeft / 30);
  const timerOffset = timerCircumference * (1 - timerProgress);
  const isUrgent = timeLeft <= 5;

  // ═══════════════════════════════════════════════════════════════
  // INTRO SCREEN
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'intro') {
    return (
      <section className="shadow-game sg-intro" aria-label="Shadow Quiz Introduction">
        <BackButton />
        <div className="sg-intro-icon" aria-hidden="true">🕶️</div>
        <div className="sg-intro-title">
          <span className="guess">GUESS THE</span>
          <span className="shadow">SHADOW</span>
        </div>
        <p className="sg-intro-desc">
          Identify the anime character from their silhouette
        </p>
        <div className="sg-intro-rules">
          <span>❤️</span> 3 lives — survival style<br />
          <span>⏱️</span> 30 seconds per character<br />
          <span>⌨️</span> Type the character name<br />
          <span>♠️</span> Every 5 correct = +100 spades<br />
          <span>🔥</span> 3x streak = bonus reward
        </div>
        <button className="sg-start-btn" onClick={startGame} aria-label="Start Shadow Quiz">
          ENTER THE SHADOWS
        </button>
      </section>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RESULT SCREEN
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'result') {
    return (
      <section className="shadow-game sg-result" aria-label="Game Results">
        <div className="sg-result-icon" aria-hidden="true">
          {score >= 20 ? '🏆' : score >= 10 ? '⚔️' : '💀'}
        </div>
        <h2 className="sg-result-title">
          {score >= 20 ? 'LEGENDARY' : score >= 10 ? 'WELL PLAYED' : 'GAME OVER'}
        </h2>
        <div className="sg-result-score">{score}</div>
        <p className="sg-result-label">Shadows Identified</p>
        <button className="sg-play-again-btn" onClick={startGame}>
          CHALLENGE AGAIN
        </button>
      </section>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PLAYING SCREEN
  // ═══════════════════════════════════════════════════════════════
  return (
    <section className="shadow-game" aria-label="Shadow Quiz Game">
      
      {/* ─── Clean Title Header ───────────────────────────────── */}
      <div className="sg-header">
        <BackButton />
        <div className="sg-header-title">
          <span className="guess">GUESS</span>{' '}
          <span className="shadow">SHADOW</span>
        </div>
      </div>

      {/* ─── Game Stats Area ──────────────────────────────────── */}
      <div className="sg-stats">
        {/* Lives */}
        <div className="sg-lives" aria-label={`${lives} lives remaining`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`sg-life ${i >= lives ? 'lost' : ''}`}>
              <HeartIcon />
            </div>
          ))}
        </div>

        {/* Timer + Streak */}
        <div className="sg-timer-section">
          <div className={`sg-timer-ring ${isUrgent ? 'urgent' : ''}`}>
            <svg viewBox="0 0 48 48">
              <circle className="track" cx="24" cy="24" r={timerRadius} />
              <circle
                className="progress"
                cx="24" cy="24" r={timerRadius}
                strokeDasharray={timerCircumference}
                strokeDashoffset={timerOffset}
              />
            </svg>
            <div className="sg-timer-number">{timeLeft}</div>
          </div>
          {streak >= 2 && (
            <div className="sg-streak" aria-live="polite">🔥 {streak}x STREAK</div>
          )}
        </div>

        {/* Scores */}
        <div className="sg-scores">
          <div className="sg-score-correct">
            <span>✓</span> {score}
          </div>
          <div className="sg-score-wrong">
            <span>✗</span> {wrongCount}
          </div>
        </div>
      </div>

      {/* ─── Main Shadow Card ─────────────────────────────────── */}
      <div className={`sg-shadow-card ${!revealed ? 'active-glow' : ''}`}>
        {/* Floating particles */}
        <div className="sg-particles">
          <div className="sg-particle" />
          <div className="sg-particle" />
          <div className="sg-particle" />
          <div className="sg-particle" />
          <div className="sg-particle" />
          <div className="sg-particle" />
        </div>

        <ShadowImage file={currentChar?.file} revealed={revealed} />

        {/* Hint button */}
        {!revealed && (
          <button className="sg-hint-btn" onClick={handleHint} aria-label="Use hint for 10 spades">
            <span className="bulb">💡</span>
            <span className="cost">-10 ♠</span>
          </button>
        )}
      </div>

      {/* ─── Hint Letters Display ─────────────────────────────── */}
      {hintLetters.length > 0 && !revealed && currentChar && (
        <div className="sg-hint-display" aria-label="Hint letters">
          {currentChar.name.split('').map((letter, i) => (
            <span key={i} className={`sg-hint-letter ${hintLetters.includes(i) ? 'shown' : ''} ${letter === ' ' ? 'space' : ''}`}>
              {hintLetters.includes(i) ? letter.toUpperCase() : letter === ' ' ? ' ' : '_'}
            </span>
          ))}
        </div>
      )}

      {/* ─── Reveal Info ──────────────────────────────────────── */}
      {revealed && (
        <div className="sg-reveal-info" aria-live="polite">
          <div className={`sg-reveal-name ${wasCorrect ? 'correct' : 'wrong'}`}>
            {wasCorrect ? `✓ ${currentChar?.name}` : `✗ It was: ${currentChar?.name}`}
          </div>
          <div className="sg-reveal-next">Next shadow in 3s...</div>
        </div>
      )}

      {/* ─── Input Field ──────────────────────────────────────── */}
      <div className="sg-input-area">
        <div className={`sg-input ${revealed ? (wasCorrect ? 'correct-border' : 'wrong-border') : guess ? 'active' : ''}`}>
          {guess || <span className="sg-input-placeholder">Type character name...</span>}
        </div>
      </div>

      {/* ─── Keyboard ─────────────────────────────────────────── */}
      {!revealed && (
        <div className="sg-keyboard">
          <div className="sg-keyboard-main">
            {KEYBOARD_ROWS.map((row, rowIdx) => (
              <div key={rowIdx} className="sg-keyboard-row">
                {row.map((key) => (
                  <button
                    key={key}
                    className="sg-key"
                    onClick={() => handleKeyPress(key)}
                    aria-label={key}
                  >
                    {key}
                  </button>
                ))}
              </div>
            ))}
            {/* Space bar row */}
            <div className="sg-keyboard-row">
              <button
                className="sg-key-space"
                onClick={() => handleKeyPress('SPACE')}
                aria-label="Space"
              >
                SPACE
              </button>
            </div>
          </div>

          {/* Right side: Backspace + Enter */}
          <div className="sg-keyboard-actions">
            <button
              className="sg-key-backspace"
              onClick={() => handleKeyPress('BACKSPACE')}
              aria-label="Backspace"
            >
              <BackspaceIcon />
            </button>
            <button
              className="sg-key-enter"
              onClick={() => handleKeyPress('ENTER')}
              aria-label="Enter"
            >
              GO
            </button>
          </div>
        </div>
      )}

      {/* ─── Bottom Navigation ────────────────────────────────── */}
      <nav className="sg-bottom-nav" aria-label="Game navigation">
        <button className="sg-nav-item" aria-label="Home">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          <span>Home</span>
        </button>
        <button className="sg-nav-item active" aria-label="Shadow Quiz">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          <span>Shadow</span>
        </button>
        <button className="sg-nav-item" aria-label="Leaderboard">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V10M18 20V4M6 20v-4"/>
          </svg>
          <span>Rank</span>
        </button>
        <button className="sg-nav-item" aria-label="Settings">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>Settings</span>
        </button>
      </nav>
    </section>
  );
}
