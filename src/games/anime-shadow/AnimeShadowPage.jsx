import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { playCorrect, playWrong, playCombo, playKeyTap } from '../../utils/audio';
import { addXP } from '../../utils/xpSystem';
import BackButton from '../../components/BackButton';
import ResultScreen from '../../components/ResultScreen';
import CircularTimer from '../../components/CircularTimer';
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
const HINT_COST = 100;
const PASS_THRESHOLD_1_STAR = 5;
const PASS_THRESHOLD_2_STAR = 8;
const PASS_THRESHOLD_3_STAR = 10;
const STARS_TO_UNLOCK = 2; // Need 2 stars to unlock next level
const STORAGE_KEY = 'ani_shadow_progress';

// Spade rewards
const SPADES_PER_CORRECT = 5;
const SPADES_STREAK_3 = 10;
const SPADES_STREAK_5 = 20;
const SPADES_LEVEL_BONUS = 50;
const SPADES_WRONG_PENALTY = -5;

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
function getStars(correct) {
  if (correct >= PASS_THRESHOLD_3_STAR) return 3;
  if (correct >= PASS_THRESHOLD_2_STAR) return 2;
  if (correct >= PASS_THRESHOLD_1_STAR) return 1;
  return 0;
}

function getStageXP(stars) {
  if (stars >= 3) return 30;
  if (stars >= 2) return 20;
  if (stars >= 1) return 10;
  return 0;
}

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
  const [streak, setStreak] = useState(0);
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL);
  const [revealed, setRevealed] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintLetters, setHintLetters] = useState([]);
  const [progress, setProgress] = useState(getProgress);
  const [earnedSpades, setEarnedSpades] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);
  const [levelStartTime, setLevelStartTime] = useState(null);
  const [levelElapsed, setLevelElapsed] = useState(0);
  const levelStartTimeRef = useRef(null);

  const timerRef = useRef(null);
  const advanceRef = useRef(null);

  const levelChars = LEVELS[currentLevel] || [];
  const currentChar = levelChars[currentIdx];
  const currentAnswer = currentChar ? currentChar.name : '';

  const clearAllTimers = () => {
    clearInterval(timerRef.current);
    clearTimeout(advanceRef.current);
  };

  // Get streak reward
  const getStreakReward = (currentStreak) => {
    if (currentStreak >= 5 && currentStreak % 5 === 0) return SPADES_STREAK_5;
    if (currentStreak >= 3 && currentStreak % 3 === 0) return SPADES_STREAK_3;
    return SPADES_PER_CORRECT;
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
    setStreak(0);
    playWrong();
    // Wrong penalty
    setSpades(s => Math.max(0, s + SPADES_WRONG_PENALTY));
    setEarnedSpades(prev => prev + SPADES_WRONG_PENALTY);
    showFeedback(`Wrong! Answer: ${currentAnswer} · ${SPADES_WRONG_PENALTY}♠`);
    advanceRef.current = setTimeout(() => advanceToNext(), 3000);
  };

  const handleCorrect = () => {
    clearAllTimers();
    setRevealed(true);
    setWasCorrect(true);
    const newStreak = streak + 1;
    setStreak(newStreak);
    setScore(s => s + 1);
    playCorrect();

    const reward = getStreakReward(newStreak);
    setSpades(s => s + reward);
    setEarnedSpades(prev => prev + reward);

    if (newStreak >= 5 && newStreak % 5 === 0) {
      playCombo();
      showFeedback(`Correct! 🔥 ${newStreak}x Streak! +${reward}♠`);
    } else if (newStreak >= 3 && newStreak % 3 === 0) {
      playCombo();
      showFeedback(`Correct! 🔥 ${newStreak}x Streak! +${reward}♠`);
    } else {
      showFeedback(`Correct! +${reward}♠`);
    }
    advanceRef.current = setTimeout(() => advanceToNext(), 2500);
  };

  const advanceToNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= CHARS_PER_LEVEL || nextIdx >= levelChars.length) {
      // Level complete
      const finalScore = score;
      const stars = getStars(finalScore);
      const updated = { ...progress };
      if (!updated[currentLevel] || finalScore > (updated[currentLevel]?.score || 0)) {
        updated[currentLevel] = { score: finalScore, stars, passed: stars >= 1 };
      }
      // Level bonus - always give XP
      const xpReward = getStageXP(stars);
      if (xpReward > 0) {
        addXP(xpReward);
        setEarnedXP(prev => prev + xpReward);
      }
      if (stars >= 1) {
        const wasAlreadyPassed = progress[currentLevel] && progress[currentLevel].stars >= 1;
        if (!wasAlreadyPassed) {
          setSpades(s => s + SPADES_LEVEL_BONUS);
          setEarnedSpades(prev => prev + SPADES_LEVEL_BONUS);
        }
      }
      setProgress(updated);
      saveProgress(updated);
      setLevelElapsed(Math.round((Date.now() - levelStartTimeRef.current) / 1000));
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

  const doHint = () => {
    if (spades < HINT_COST || hintUsed || revealed || !currentChar) return;
    setSpades(s => s - HINT_COST);
    setHintUsed(true);
    // Reveal 1 random letter as hint
    const name = currentChar.name;
    const available = [];
    for (let i = 0; i < name.length; i++) {
      if (name[i] !== ' ' && !hintLetters.includes(i)) {
        available.push(i);
      }
    }
    if (available.length > 0) {
      const randomIdx = available[Math.floor(Math.random() * available.length)];
      setHintLetters(prev => [...prev, randomIdx]);
    }
    showFeedback(`💡 Hint! -${HINT_COST}♠ — 1 letter revealed`);
  };

  const startLevel = (levelIdx) => {
    if (levelIdx > 0 && !(progress[levelIdx - 1]?.stars >= STARS_TO_UNLOCK)) return;
    setCurrentLevel(levelIdx);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(TIMER_TOTAL);
    setRevealed(false);
    setWasCorrect(null);
    setGuess('');
    setHintUsed(false);
    setHintLetters([]);
    setEarnedSpades(0);
    setEarnedXP(0);
    setLevelStartTime(Date.now());
    levelStartTimeRef.current = Date.now();
    setLevelElapsed(0);
    setPhase('playing');
  };

  const addLetter = (letter) => { if (!revealed) { setGuess(g => g + letter); playKeyTap(); } };
  const removeLetter = () => { if (!revealed) { setGuess(g => g.slice(0, -1)); playKeyTap(); } };

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
          <p style={{ fontSize: 11, color: '#c4953a', marginTop: 4 }}>10 shadows per level · Need {STARS_TO_UNLOCK}★ to unlock next</p>
        </div>
        {LEVEL_NAMES.map((name, idx) => {
          const unlocked = idx === 0 || (progress[idx - 1]?.stars >= STARS_TO_UNLOCK);
          const levelData = progress[idx];
          const hasChars = LEVELS[idx] && LEVELS[idx].length > 0;
          const prevStars = idx > 0 ? (progress[idx - 1]?.stars || 0) : 0;
          return (
            <button key={idx} className="level-card" onClick={() => hasChars && unlocked && startLevel(idx)}
              style={{ opacity: unlocked && hasChars ? 1 : 0.5, cursor: unlocked && hasChars ? 'pointer' : 'not-allowed' }}>
              <span className="level-icon">{unlocked ? '🕶️' : '🔒'}</span>
              <div className="level-info">
                <div className="level-name">{name}</div>
                <div className="level-meta">
                  {!unlocked ? `Need ${STARS_TO_UNLOCK}★ on ${LEVEL_NAMES[idx-1]} (${prevStars}/${STARS_TO_UNLOCK}★)` : !hasChars ? 'Coming soon' : levelData ? `${levelData.score}/10 correct · ${levelData.stars || 0}★` : '10 shadows · 30s timer'}
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
  // RESULT SCREEN
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'result') {
    const stars = getStars(score);
    const passed = stars >= 1;
    const accuracyPct = Math.round((score / Math.min(CHARS_PER_LEVEL, levelChars.length)) * 100);
    const mins = Math.floor(levelElapsed / 60);
    const secs = levelElapsed % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    const buttons = [
      { label: '\u2190 Levels', onClick: () => setPhase('levels'), variant: 'secondary' },
    ];
    if (!passed) buttons.push({ label: 'Retry', onClick: () => startLevel(currentLevel), variant: 'primary' });
    if (passed && currentLevel < 4) buttons.push({ label: 'Next Level \u2192', onClick: () => startLevel(currentLevel + 1), variant: 'primary' });

    return (
      <ResultScreen
        passed={passed}
        title={passed ? 'Level Cleared!' : 'Level Failed'}
        subtitle={`${score}/${Math.min(CHARS_PER_LEVEL, levelChars.length)} correct`}
        stars={stars}
        timeTaken={timeStr}
        accuracy={`${accuracyPct}%`}
        spadesEarned={earnedSpades}
        xpEarned={earnedXP}
        buttons={buttons}
      />
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
        <button className="back-btn" onClick={() => { clearAllTimers(); setPhase('levels'); }} style={{ background: 'none', border: 'none', color: 'var(--sg-text)', fontSize: 18 }}>←</button>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sg-success)' }}>✓ {score}</div>
      </div>

      {/* ─── Stats ────────────────────────────────────────────── */}
      <div className="sg-stats">
        {streak >= 3 && (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: 10 }}>🔥 {streak}x</span>
        )}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            <CircularTimer timeLeft={timeLeft} maxTime={TIMER_TOTAL} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--sg-text-mid)', marginTop: 2 }}>Q{currentIdx + 1}/{Math.min(CHARS_PER_LEVEL, levelChars.length)}</div>
        </div>
        <div style={{ width: 40 }} />
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

      {/* ─── Action Buttons (GO + Hint) ───────────────────────── */}
      {!revealed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 14px 10px' }}>
          <button className="power-btn" onClick={submitGuess} style={{ width: '100%', background: 'var(--sg-crimson)', color: 'var(--sg-text)', fontSize: 16, fontWeight: 800, letterSpacing: 2 }}>
            GO
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="power-btn" onClick={doHint} disabled={spades < HINT_COST || hintUsed} style={{ flex: 1, opacity: hintUsed ? 0.4 : 1 }}>
              💡 HINT<br /><span style={{ color: '#c4953a' }}>{HINT_COST}♠</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
