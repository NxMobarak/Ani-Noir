import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { playCorrect, playWrong } from '../../utils/audio';
import { addXP, XP_REWARDS } from '../../utils/xpSystem';
import BackButton from '../../components/BackButton';
import '../../styles/shadow-quiz.css';

import level1 from './questions/level1';
import level2 from './questions/level2';
import level3 from './questions/level3';
import level4 from './questions/level4';
import level5 from './questions/level5';

const LEVELS = [level1, level2, level3, level4, level5];
const LEVEL_NAMES = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];
const CHARS_PER_LEVEL = 10;
const TIMER_TOTAL = 30;
const SKIP_COST = 50;
const HINT_COST = 100;
const MAX_SKIPS = 3;
const MAX_HINT_WRONG = 3;
const PASS_THRESHOLD = 8; // 8/10 to unlock next
const STORAGE_KEY = 'ani_shadow_progress';

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

/* ─── SVG Icons ───────────────────────────────────────────────── */
const BackspaceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
    <line x1="18" y1="9" x2="12" y2="15"/>
    <line x1="12" y1="9" x2="18" y2="15"/>
  </svg>
);

/* ─── Shadow Image Component ─────────────────────────────────── */
const ShadowImage = memo(function ShadowImage({ file, revealed }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && (
        <div style={{ width: 160, height: 160, borderRadius: 12, background: '#e0e0e0', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)' }} />
      )}
      <img
        src={`/shadows/${file}`}
        alt="Shadow character silhouette"
        className={`sg-silhouette ${revealed ? 'revealed' : 'hidden'}`}
        style={loaded ? {} : { position: 'absolute', opacity: 0 }}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
});

/* ─── Helper ──────────────────────────────────────────────────── */
function getProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
function saveProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function ShadowQuizPage({ spades, setSpades, showFeedback }) {
  const [phase, setPhase] = useState('levels');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [hintWrong, setHintWrong] = useState(0);
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL);
  const [revealed, setRevealed] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintLetters, setHintLetters] = useState([]);
  const [progress, setProgress] = useState(getProgress);
  const [totalStars, setTotalStars] = useState(0);

  const timerRef = useRef(null);
  const advanceRef = useRef(null);

  const levelChars = LEVELS[currentLevel] || [];
  const currentChar = levelChars[currentIdx];
  const currentAnswer = currentChar ? currentChar.name : '';

  const clearAllTimers = () => {
    clearInterval(timerRef.current);
    clearTimeout(advanceRef.current);
  };

  // Timer countdown
  useEffect(() => {
    if (phase !== 'playing' || revealed) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, currentIdx, revealed]);

  // Time out handler
  useEffect(() => {
    if (timeLeft === 0 && !revealed && phase === 'playing') {
      handleWrong();
    }
  }, [timeLeft, revealed, phase]);

  const handleWrong = () => {
    clearAllTimers();
    setRevealed(true);
    setWasCorrect(false);
    playWrong();
    if (hintUsed) {
      const newHintWrong = hintWrong + 1;
      setHintWrong(newHintWrong);
      if (newHintWrong >= MAX_HINT_WRONG) {
        showFeedback('Game Over! 3 wrong after hints');
        setTimeout(() => setPhase('gameover'), 1500);
        return;
      }
    }
    showFeedback(`Wrong! Answer: ${currentAnswer}`);
    advanceRef.current = setTimeout(() => advanceToNext(), 3000);
  };

  const handleCorrect = () => {
    clearAllTimers();
    setRevealed(true);
    setWasCorrect(true);
    playCorrect();

    const elapsed = TIMER_TOTAL - timeLeft;
    let earnedStars = 1;
    if (elapsed <= 10) earnedStars = 3;
    else if (elapsed <= 20) earnedStars = 2;
    setTotalStars(s => s + earnedStars);
    setScore(s => s + 1);
    showFeedback(`Correct! +${earnedStars} star${earnedStars > 1 ? 's' : ''}`);
    advanceRef.current = setTimeout(() => advanceToNext(), 2500);
  };

  const advanceToNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= CHARS_PER_LEVEL || nextIdx >= levelChars.length) {
      // Level complete
      const passed = score + (wasCorrect ? 0 : 0) >= PASS_THRESHOLD; // score already updated
      const finalScore = score; // score is already correct from handleCorrect
      const updated = { ...progress };
      if (!updated[currentLevel] || finalScore > (updated[currentLevel]?.score || 0)) {
        updated[currentLevel] = { score: finalScore, passed: finalScore >= PASS_THRESHOLD };
      }
      setProgress(updated);
      saveProgress(updated);
      if (finalScore >= PASS_THRESHOLD) addXP(XP_REWARDS.LEVEL_COMPLETE);
      setPhase('result');
    } else {
      setCurrentIdx(nextIdx);
      setTimeLeft(TIMER_TOTAL);
      setRevealed(false);
      setWasCorrect(null);
      setGuess('');
      setHintUsed(false);
      setHintLetters([]);
    }
  };

  // Build full answer by merging typed letters with hinted letters
  const getFullGuess = useCallback(() => {
    if (!currentChar) return '';
    const name = currentChar.name;
    let typedIdx = 0;
    let result = '';
    for (let i = 0; i < name.length; i++) {
      if (name[i] === ' ') {
        result += ' ';
      } else if (hintLetters.includes(i)) {
        result += name[i];
      } else {
        result += (guess[typedIdx] || '');
        typedIdx++;
      }
    }
    return result;
  }, [currentChar, guess, hintLetters]);

  const submitGuess = () => {
    if (revealed || !guess.trim()) return;
    const fullGuess = getFullGuess();
    const normalized = fullGuess.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const correct = currentAnswer.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normalized === correct) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  const doSkip = () => {
    if (spades < SKIP_COST || revealed) return;
    const newSkips = skipsUsed + 1;
    setSkipsUsed(newSkips);
    setSpades(s => s - SKIP_COST);
    showFeedback(`Skipped! -${SKIP_COST}♠ (${newSkips}/${MAX_SKIPS})`);
    if (newSkips >= MAX_SKIPS) {
      clearAllTimers();
      setRevealed(true);
      showFeedback('Game Over! 3 skips used');
      setTimeout(() => setPhase('gameover'), 1500);
      return;
    }
    clearAllTimers();
    setRevealed(true);
    setWasCorrect(false);
    advanceRef.current = setTimeout(() => advanceToNext(), 800);
  };

  const doHint = () => {
    if (spades < HINT_COST || hintUsed || revealed || !currentChar) return;
    setSpades(s => s - HINT_COST);
    setHintUsed(true);
    // Reveal 2 random letters as hint
    const name = currentChar.name;
    const available = [];
    for (let i = 0; i < name.length; i++) {
      if (name[i] !== ' ' && !hintLetters.includes(i)) {
        available.push(i);
      }
    }
    const toReveal = [];
    const count = Math.min(2, available.length);
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    for (let i = 0; i < count; i++) {
      toReveal.push(shuffled[i]);
    }
    setHintLetters(prev => [...prev, ...toReveal]);
    showFeedback(`💡 Hint! -${HINT_COST}♠ — 2 letters revealed`);
  };

  const startLevel = (levelIdx) => {
    if (levelIdx > 0 && !progress[levelIdx - 1]?.passed) return;
    setCurrentLevel(levelIdx);
    setCurrentIdx(0);
    setScore(0);
    setSkipsUsed(0);
    setHintWrong(0);
    setTotalStars(0);
    setTimeLeft(TIMER_TOTAL);
    setRevealed(false);
    setWasCorrect(null);
    setGuess('');
    setHintUsed(false);
    setHintLetters([]);
    setPhase('playing');
  };

  const addLetter = (letter) => { if (!revealed) setGuess(g => g + letter); };
  const removeLetter = () => { if (!revealed) setGuess(g => g.slice(0, -1)); };

  // Physical keyboard support
  useEffect(() => {
    if (phase !== 'playing' || revealed) return;
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      const key = e.key;
      if (key === 'Backspace') {
        e.preventDefault();
        removeLetter();
      } else if (key === 'Enter') {
        e.preventDefault();
        submitGuess();
      } else if (/^[a-zA-Z]$/.test(key)) {
        e.preventDefault();
        addLetter(key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, revealed, guess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  // Timer visual calculations
  const timerRadius = 21;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerProgress = Math.max(0, timeLeft / TIMER_TOTAL);
  const timerOffset = timerCircumference * (1 - timerProgress);
  const isUrgent = timeLeft <= 5;

  // ═══════════════════════════════════════════════════════════════
  // LEVEL SELECT SCREEN
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'levels') {
    return (
      <section>
        <BackButton />
        <div className="card" style={{ marginBottom: 12 }}>
          <h2 className="card-title" style={{ color: 'var(--sg-crimson-bright, #c62839)' }}>🕶️ ANIME SHADOW</h2>
          <p style={{ fontSize: 12, color: '#7a7873' }}>Identify the anime character from their silhouette!</p>
          <p style={{ fontSize: 11, color: '#c4953a', marginTop: 4 }}>10 shadows per level · Need 8/10 to unlock next</p>
        </div>
        {LEVEL_NAMES.map((name, idx) => {
          const unlocked = idx === 0 || progress[idx - 1]?.passed;
          const levelData = progress[idx];
          const hasChars = LEVELS[idx] && LEVELS[idx].length > 0;
          return (
            <button key={idx} className="level-card" onClick={() => hasChars && unlocked && startLevel(idx)}
              style={{ opacity: unlocked && hasChars ? 1 : 0.5, cursor: unlocked && hasChars ? 'pointer' : 'not-allowed' }}>
              <span className="level-icon">{unlocked ? '🕶️' : '🔒'}</span>
              <div className="level-info">
                <div className="level-name">{name}</div>
                <div className="level-meta">
                  {!unlocked ? 'Need 8/10 on previous level' : !hasChars ? 'Coming soon' : levelData ? `${levelData.score}/10 correct` : '10 shadows · 30s timer'}
                </div>
              </div>
              <span style={{ color: '#4a4844', fontSize: 20 }}>{unlocked && hasChars ? '›' : ''}</span>
            </button>
          );
        })}
      </section>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // GAME OVER SCREEN
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'gameover') {
    return (
      <div className="result-screen">
        <span className="result-emoji">💀</span>
        <div className="result-title">Game Over</div>
        <div className="result-sub">You got {score}/{Math.min(CHARS_PER_LEVEL, levelChars.length)} correct</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={() => setPhase('levels')}>← Levels</button>
          <button className="btn btn-primary" onClick={() => startLevel(currentLevel)}>Retry</button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RESULT SCREEN
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'result') {
    const passed = score >= PASS_THRESHOLD;
    return (
      <div className="result-screen">
        <span className="result-emoji">{passed ? '🏆' : '😓'}</span>
        <div className="result-title">{passed ? 'Level Cleared!' : 'Level Failed'}</div>
        <div className="result-sub">{score}/{Math.min(CHARS_PER_LEVEL, levelChars.length)} correct</div>
        {passed && <div style={{ color: '#c4953a', fontSize: 14, marginBottom: 16 }}>Next level unlocked!</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setPhase('levels')}>← Levels</button>
          {!passed && <button className="btn btn-primary" onClick={() => startLevel(currentLevel)}>Retry</button>}
          {passed && currentLevel < 4 && <button className="btn btn-primary" onClick={() => startLevel(currentLevel + 1)}>Next Level →</button>}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PLAYING SCREEN
  // ═══════════════════════════════════════════════════════════════
  if (!currentChar) return <div className="card"><p>No characters available for this level!</p></div>;

  return (
    <section className="shadow-game" aria-label="Anime Shadow Game">

      {/* ─── Header ───────────────────────────────────────────── */}
      <div className="sg-header">
        <button className="back-btn" onClick={() => { clearAllTimers(); setPhase('levels'); }} style={{ background: 'none', border: 'none', color: 'var(--sg-text)', fontSize: 18, position: 'absolute', left: 14 }}>←</button>
        <div className="sg-header-title">
          <span className="guess" style={{ fontSize: 12 }}>ANIME</span>
          <span className="shadow" style={{ fontSize: 14 }}>SHADOW</span>
        </div>
      </div>

      {/* ─── Stats ────────────────────────────────────────────── */}
      <div className="sg-stats">
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: MAX_SKIPS }).map((_, i) => (
            <span key={i} style={{ fontSize: 16, opacity: i < (MAX_SKIPS - skipsUsed) ? 1 : 0.2 }}>⏩</span>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
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
          <div style={{ fontSize: 10, color: 'var(--sg-text-mid)', marginTop: 2 }}>Q{currentIdx + 1}/{Math.min(CHARS_PER_LEVEL, levelChars.length)}</div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sg-success)' }}>✓ {score}</div>
      </div>

      {/* ─── Shadow Card ──────────────────────────────────────── */}
      <div className={`sg-shadow-card ${!revealed ? 'active-glow' : ''}`} key={`${currentLevel}-${currentIdx}`}>
        <div className="sg-particles">
          <div className="sg-particle" />
          <div className="sg-particle" />
          <div className="sg-particle" />
          <div className="sg-particle" />
          <div className="sg-particle" />
          <div className="sg-particle" />
        </div>
        <ShadowImage file={currentChar.file} revealed={revealed} />
      </div>

      {/* ─── Letter Blanks ────────────────────────────────────── */}
      {!revealed && currentChar && (
        <div className="sg-hint-display" aria-label="Character name letters">
          {(() => {
            const name = currentChar.name;
            let typedIdx = 0;
            return name.split('').map((letter, i) => {
              const isSpace = letter === ' ';
              const isHinted = hintLetters.includes(i);
              let display = '_';
              let className = 'sg-hint-letter';

              if (isSpace) {
                display = ' ';
                className += ' space';
              } else if (isHinted) {
                display = letter.toUpperCase();
                className += ' shown';
              } else {
                const typedChar = guess[typedIdx];
                typedIdx++;
                if (typedChar) {
                  display = typedChar.toUpperCase();
                  className += ' typed';
                }
              }

              return (
                <span key={i} className={className}>
                  {display}
                </span>
              );
            });
          })()}
        </div>
      )}

      {/* ─── Reveal Info ──────────────────────────────────────── */}
      {revealed && (
        <div className="sg-reveal-info" aria-live="polite">
          <div className={`sg-reveal-name ${wasCorrect ? 'correct' : 'wrong'}`}>
            {wasCorrect ? `✓ ${currentAnswer}` : `✗ Answer: ${currentAnswer}`}
          </div>
          <div className="sg-reveal-next">Next shadow in 3s...</div>
        </div>
      )}

      {/* ─── Keyboard ─────────────────────────────────────────── */}
      {!revealed && (
        <div className="sg-keyboard">
          <div className="sg-keyboard-main">
            {KEYBOARD_ROWS.slice(0, 2).map((row, ri) => (
              <div key={ri} className="sg-keyboard-row">
                {row.map(letter => (
                  <button key={letter} className="sg-key" onClick={() => addLetter(letter)} aria-label={letter}>{letter}</button>
                ))}
              </div>
            ))}
            <div className="sg-keyboard-row">
              {KEYBOARD_ROWS[2].map(letter => (
                <button key={letter} className="sg-key" onClick={() => addLetter(letter)} aria-label={letter}>{letter}</button>
              ))}
              <button className="sg-key-backspace" onClick={removeLetter} aria-label="Backspace">
                <BackspaceIcon />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Action Buttons (GO + Skip + Hint) ────────────────── */}
      {!revealed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 14px 10px' }}>
          <button className="power-btn" onClick={submitGuess} style={{ width: '100%', background: 'var(--sg-crimson)', color: 'var(--sg-text)', fontSize: 16, fontWeight: 800, letterSpacing: 2 }}>
            GO
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="power-btn" onClick={doSkip} disabled={spades < SKIP_COST} style={{ flex: 1 }}>
              ⏩ SKIP<br /><span style={{ color: '#c4953a' }}>{SKIP_COST}♠</span>
            </button>
            <button className="power-btn" onClick={doHint} disabled={spades < HINT_COST || hintUsed} style={{ flex: 1, opacity: hintUsed ? 0.4 : 1 }}>
              💡 HINT<br /><span style={{ color: '#c4953a' }}>{HINT_COST}♠</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
