import { useState, useEffect, useRef, useCallback } from 'react';
import T from '../../constants/theme';
import { playCorrect, playWrong } from '../../utils/audio';
import { addXP, XP_REWARDS } from '../../utils/xpSystem';
import BackButton from '../../components/BackButton';
import level1 from './questions/level1';
import level2 from './questions/level2';
import level3 from './questions/level3';
import level4 from './questions/level4';
import level5 from './questions/level5';

const LEVELS = [level1, level2, level3, level4, level5];
const LEVEL_NAMES = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];
const CLIPS_PER_LEVEL = 10;
const AUDIO_PLAY_DURATION = 10; // seconds audio plays
const TIMER_TOTAL = 30; // seconds to guess
const SKIP_COST = 50;
const HINT_COST = 100;
const MAX_SKIPS = 3;
const MAX_HINT_WRONG = 3;
const PASS_THRESHOLD = 8; // need 8/10 to unlock next
const STORAGE_KEY = 'ani_theme_progress';

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

function saveProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function AnimeThemePage({ spades, setSpades, showFeedback }) {
  const [phase, setPhase] = useState('levels'); // levels, playing, countdown, result, gameover
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentClip, setCurrentClip] = useState(0);
  const [score, setScore] = useState(0);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [hintWrong, setHintWrong] = useState(0);
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(getProgress);
  const [stars, setStars] = useState(0);

  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const audioTimerRef = useRef(null);
  const countdownRef = useRef(null);

  const questions = LEVELS[currentLevel] || [];
  const currentQ = questions[currentClip];

  // Clear all timers
  const clearAllTimers = () => {
    clearInterval(timerRef.current);
    clearTimeout(audioTimerRef.current);
    clearInterval(countdownRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  // Start a clip
  const startClip = useCallback(() => {
    setGuess('');
    setAnswered(false);
    setWasCorrect(null);
    setHintUsed(false);
    setTimeLeft(TIMER_TOTAL);
    setAudioPlaying(true);

    // Play audio for 10 sec
    const q = LEVELS[currentLevel]?.[currentClip];
    if (q?.audio) {
      const audio = new Audio(`/audio/${q.audio}`);
      audioRef.current = audio;
      audio.play().catch(() => {});
      audioTimerRef.current = setTimeout(() => {
        audio.pause();
        setAudioPlaying(false);
      }, AUDIO_PLAY_DURATION * 1000);
    } else {
      // No audio file yet - simulate
      audioTimerRef.current = setTimeout(() => {
        setAudioPlaying(false);
      }, AUDIO_PLAY_DURATION * 1000);
    }

    // Start answer timer
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [currentLevel, currentClip]);

  // Handle timeout
  useEffect(() => {
    if (timeLeft === 0 && !answered && phase === 'playing') {
      handleWrong();
    }
  }, [timeLeft, answered, phase]);

  // Start clip when playing phase begins
  useEffect(() => {
    if (phase === 'playing' && !answered) {
      startClip();
    }
    return () => clearAllTimers();
  }, [phase, currentClip]);

  const handleWrong = () => {
    clearAllTimers();
    setAnswered(true);
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
    showFeedback(`Wrong! Answer: ${currentQ.answer}`);
    setTimeout(() => startCountdown(), 1500);
  };

  const handleCorrect = () => {
    clearAllTimers();
    setAnswered(true);
    setWasCorrect(true);
    playCorrect();

    // Calculate stars based on time
    const elapsed = TIMER_TOTAL - timeLeft;
    let earnedStars = 1;
    if (elapsed <= 10) earnedStars = 3;
    else if (elapsed <= 20) earnedStars = 2;
    setStars(s => s + earnedStars);
    setScore(s => s + 1);
    showFeedback(`Correct! +${earnedStars} star${earnedStars > 1 ? 's' : ''}`);
    setTimeout(() => startCountdown(), 1500);
  };

  const submitGuess = () => {
    if (answered || !guess.trim()) return;
    const normalized = guess.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const correct = currentQ.answer.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normalized === correct) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  const doSkip = () => {
    if (spades < SKIP_COST || answered) return;
    const newSkips = skipsUsed + 1;
    setSkipsUsed(newSkips);
    setSpades(s => s - SKIP_COST);
    showFeedback(`Skipped! -${SKIP_COST}♠ (${newSkips}/${MAX_SKIPS})`);
    if (newSkips >= MAX_SKIPS) {
      clearAllTimers();
      setAnswered(true);
      showFeedback('Game Over! 3 skips used');
      setTimeout(() => setPhase('gameover'), 1500);
      return;
    }
    clearAllTimers();
    setAnswered(true);
    setTimeout(() => startCountdown(), 800);
  };

  const doHint = () => {
    if (spades < HINT_COST || hintUsed || answered) return;
    setSpades(s => s - HINT_COST);
    setHintUsed(true);
    showFeedback(`Hint! -${HINT_COST}♠ Choose from options`);
  };

  const startCountdown = () => {
    setPhase('countdown');
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current);
          advanceToNext();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const advanceToNext = () => {
    const nextClip = currentClip + 1;
    if (nextClip >= CLIPS_PER_LEVEL || nextClip >= questions.length) {
      // Level complete
      const passed = score >= PASS_THRESHOLD;
      const updated = { ...progress };
      if (!updated[currentLevel] || score > (updated[currentLevel]?.score || 0)) {
        updated[currentLevel] = { score, passed };
      }
      setProgress(updated);
      saveProgress(updated);
      if (passed) addXP(XP_REWARDS.LEVEL_COMPLETE);
      setPhase('result');
    } else {
      setCurrentClip(nextClip);
      setPhase('playing');
    }
  };

  const startLevel = (levelIdx) => {
    if (levelIdx > 0 && !progress[levelIdx - 1]?.passed) return;
    setCurrentLevel(levelIdx);
    setCurrentClip(0);
    setScore(0);
    setSkipsUsed(0);
    setHintWrong(0);
    setStars(0);
    setPhase('playing');
  };

  const addLetter = (letter) => {
    if (answered) return;
    setGuess(g => g + letter);
  };

  const removeLetter = () => {
    if (answered) return;
    setGuess(g => g.slice(0, -1));
  };

  const addSpace = () => {
    if (answered) return;
    setGuess(g => g + ' ');
  };

  // ─── Level Select ─────────────────────────────────────────
  if (phase === 'levels') {
    return (
      <section>
        <BackButton />
        <div className="card" style={{ marginBottom: 12 }}>
          <h2 className="card-title" style={{ color: T.teal }}>🎵 ANIME THEME</h2>
          <p style={{ fontSize: 12, color: T.textMid }}>Listen to the audio clip and guess the anime!</p>
          <p style={{ fontSize: 11, color: T.gold, marginTop: 4 }}>10 clips per level · Need 8/10 to unlock next</p>
        </div>
        {LEVEL_NAMES.map((name, idx) => {
          const unlocked = idx === 0 || progress[idx - 1]?.passed;
          const levelData = progress[idx];
          return (
            <button key={idx} className="level-card" onClick={() => startLevel(idx)}
              style={{ opacity: unlocked ? 1 : 0.5, cursor: unlocked ? 'pointer' : 'not-allowed' }}>
              <span className="level-icon">{unlocked ? '🎵' : '🔒'}</span>
              <div className="level-info">
                <div className="level-name">{name}</div>
                <div className="level-meta">
                  {!unlocked ? 'Need 8/10 on previous level' : levelData ? `${levelData.score}/10 correct` : '10 audio clips · 30s timer'}
                </div>
              </div>
              <span style={{ color: T.textDim, fontSize: 20 }}>{unlocked ? '›' : ''}</span>
            </button>
          );
        })}
      </section>
    );
  }

  // ─── Countdown ────────────────────────────────────────────
  if (phase === 'countdown') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ fontSize: 64, fontWeight: 900, color: T.rose, marginBottom: 16 }}>{countdown}</div>
        <p style={{ fontSize: 13, color: T.textMid }}>Loading next theme...</p>
      </div>
    );
  }

  // ─── Game Over ────────────────────────────────────────────
  if (phase === 'gameover') {
    return (
      <div className="result-screen">
        <span className="result-emoji">💀</span>
        <div className="result-title">Game Over</div>
        <div className="result-sub">You got {score}/{Math.min(CLIPS_PER_LEVEL, questions.length)} correct</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={() => setPhase('levels')}>← Levels</button>
          <button className="btn btn-primary" onClick={() => startLevel(currentLevel)}>Retry</button>
        </div>
      </div>
    );
  }

  // ─── Result ───────────────────────────────────────────────
  if (phase === 'result') {
    const passed = score >= PASS_THRESHOLD;
    return (
      <div className="result-screen">
        <span className="result-emoji">{passed ? '🏆' : '😓'}</span>
        <div className="result-title">{passed ? 'Level Cleared!' : 'Level Failed'}</div>
        <div className="result-sub">{score}/{Math.min(CLIPS_PER_LEVEL, questions.length)} correct</div>
        <div style={{ fontSize: 24, marginBottom: 16 }}>{'★'.repeat(Math.min(stars, 30))}{'☆'.repeat(Math.max(0, 30 - stars))}</div>
        {passed && <div style={{ color: T.gold, fontSize: 14, marginBottom: 16 }}>Next level unlocked!</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setPhase('levels')}>← Levels</button>
          {!passed && <button className="btn btn-primary" onClick={() => startLevel(currentLevel)}>Retry</button>}
          {passed && currentLevel < 4 && <button className="btn btn-primary" onClick={() => startLevel(currentLevel + 1)}>Next Level →</button>}
        </div>
      </div>
    );
  }

  // ─── Playing ──────────────────────────────────────────────
  if (!currentQ) return <div className="card"><p>No clips available for this level yet!</p></div>;

  return (
    <div className="shadow-game" style={{ height: 'auto', minHeight: '70vh' }}>
      {/* Header */}
      <div className="sg-header">
        <button className="back-btn" onClick={() => { clearAllTimers(); setPhase('levels'); }} style={{ background: 'none', border: 'none', color: T.text, fontSize: 18 }}>←</button>
        <div className="sg-header-title">
          <span className="guess" style={{ fontSize: 12 }}>ANIME</span>
          <span className="shadow" style={{ fontSize: 14 }}>THEME</span>
        </div>
      </div>

      {/* Stats */}
      <div className="sg-stats">
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: MAX_SKIPS }).map((_, i) => (
            <span key={i} style={{ fontSize: 16, opacity: i < (MAX_SKIPS - skipsUsed) ? 1 : 0.2 }}>⏩</span>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: timeLeft <= 10 ? T.error : T.text }}>{timeLeft}s</div>
          <div style={{ fontSize: 10, color: T.textMid }}>Q{currentClip + 1}/{Math.min(CLIPS_PER_LEVEL, questions.length)}</div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.success }}>✓ {score}</div>
      </div>

      {/* Audio Visual */}
      <div style={{
        margin: '0 14px', padding: '20px', borderRadius: 16, textAlign: 'center',
        background: audioPlaying ? 'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(139,92,246,0.15))' : T.card,
        border: `1px solid ${audioPlaying ? 'rgba(20,184,166,0.4)' : T.border}`,
        transition: 'all 0.3s',
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{audioPlaying ? '🎶' : '🔇'}</div>
        <div style={{ fontSize: 12, color: audioPlaying ? T.teal : T.textDim, fontWeight: 600 }}>
          {audioPlaying ? 'Playing...' : 'Audio ended — Guess now!'}
        </div>
      </div>

      {/* Answer Display */}
      <div style={{ padding: '12px 14px', textAlign: 'center' }}>
        <div style={{
          minHeight: 40, padding: '8px 14px', background: T.surface,
          borderRadius: 12, border: `1px solid ${T.border}`,
          fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {guess || <span style={{ color: T.textDim, fontSize: 13, fontWeight: 400 }}>Type anime name...</span>}
        </div>

        {/* Answered feedback */}
        {answered && (
          <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: wasCorrect ? T.success : T.error }}>
            {wasCorrect ? '✓ Correct!' : `✗ Answer: ${currentQ.answer}`}
          </div>
        )}
      </div>

      {/* Hint Options (when hint used) */}
      {hintUsed && !answered && currentQ.options && (
        <div style={{ padding: '0 14px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {currentQ.options.map((opt, i) => (
            <button key={i} className="option-btn" onClick={() => { setGuess(opt); setTimeout(submitGuess, 100); }}
              style={{ padding: '10px 14px', fontSize: 13 }}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Keyboard (when hint NOT used) */}
      {!hintUsed && !answered && (
        <div className="sg-keyboard" style={{ padding: '8px 10px 12px' }}>
          <div className="sg-keyboard-main">
            {KEYBOARD_ROWS.map((row, ri) => (
              <div key={ri} className="sg-keyboard-row">
                {row.map(letter => (
                  <button key={letter} className="sg-key" onClick={() => addLetter(letter)}>{letter}</button>
                ))}
              </div>
            ))}
            <div className="sg-keyboard-row" style={{ justifyContent: 'center' }}>
              <button className="sg-key-space" onClick={addSpace}>SPACE</button>
            </div>
          </div>
          <div className="sg-keyboard-actions">
            <button className="sg-key-backspace" onClick={removeLetter}>⌫</button>
            <button className="sg-key-enter" onClick={submitGuess}>GO</button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!answered && (
        <div style={{ display: 'flex', gap: 8, padding: '0 14px 10px' }}>
          <button className="power-btn" onClick={doSkip} disabled={spades < SKIP_COST} style={{ flex: 1 }}>
            ⏩ SKIP<br /><span style={{ color: T.gold }}>{SKIP_COST}♠</span>
          </button>
          {!hintUsed && (
            <button className="power-btn" onClick={doHint} disabled={spades < HINT_COST} style={{ flex: 1 }}>
              💡 HINT<br /><span style={{ color: T.gold }}>{HINT_COST}♠</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
