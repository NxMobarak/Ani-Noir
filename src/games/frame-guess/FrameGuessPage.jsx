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
const QUESTIONS_PER_LEVEL = 10;
const TIMER_TOTAL = 30;
const SKIP_COST = 50;
const HINT_COST = 100;
const MAX_SKIPS = 3;
const PASS_THRESHOLD = 8;
const STORAGE_KEY = 'ani_frame_progress';

function getProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
function saveProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function FrameGuessPage({ spades, setSpades, showFeedback }) {
  const [phase, setPhase] = useState('levels');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL);
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [progress, setProgress] = useState(getProgress);

  const timerRef = useRef(null);
  const advanceRef = useRef(null);

  const levelQuestions = LEVELS[currentLevel] || [];
  const currentQ = levelQuestions[currentIdx];

  const clearAllTimers = () => {
    clearInterval(timerRef.current);
    clearTimeout(advanceRef.current);
  };

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || answered) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, currentIdx, answered]);

  useEffect(() => {
    if (timeLeft === 0 && !answered && phase === 'playing') {
      handleWrong(-1);
    }
  }, [timeLeft, answered, phase]);

  const handleWrong = (optIdx) => {
    clearAllTimers();
    setAnswered(true);
    setWasCorrect(false);
    setSelectedOption(optIdx);
    playWrong();
    showFeedback(`Wrong! Answer: ${currentQ.options[currentQ.correct]}`);
    advanceRef.current = setTimeout(() => advanceToNext(), 2500);
  };

  const handleCorrect = (optIdx) => {
    clearAllTimers();
    setAnswered(true);
    setWasCorrect(true);
    setSelectedOption(optIdx);
    playCorrect();
    setScore(s => s + 1);
    showFeedback('Correct!');
    advanceRef.current = setTimeout(() => advanceToNext(), 1500);
  };

  const submitAnswer = (optIdx) => {
    if (answered) return;
    if (optIdx === currentQ.correct) {
      handleCorrect(optIdx);
    } else {
      handleWrong(optIdx);
    }
  };

  const advanceToNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= QUESTIONS_PER_LEVEL || nextIdx >= levelQuestions.length) {
      const finalScore = score;
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
      setAnswered(false);
      setWasCorrect(null);
      setSelectedOption(null);
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
    advanceRef.current = setTimeout(() => advanceToNext(), 800);
  };

  const startLevel = (levelIdx) => {
    if (levelIdx > 0 && !progress[levelIdx - 1]?.passed) return;
    setCurrentLevel(levelIdx);
    setCurrentIdx(0);
    setScore(0);
    setSkipsUsed(0);
    setTimeLeft(TIMER_TOTAL);
    setAnswered(false);
    setWasCorrect(null);
    setSelectedOption(null);
    setPhase('playing');
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  // ─── Level Select ─────────────────────────────────────────
  if (phase === 'levels') {
    return (
      <section>
        <BackButton />
        <div className="card" style={{ marginBottom: 12 }}>
          <h2 className="card-title" style={{ color: T.teal }}>🎬 FRAME GUESS</h2>
          <p style={{ fontSize: 12, color: T.textMid }}>Guess the anime from a scene description!</p>
          <p style={{ fontSize: 11, color: T.gold, marginTop: 4 }}>10 questions per level · Need 8/10 to unlock next</p>
        </div>
        {LEVEL_NAMES.map((name, idx) => {
          const unlocked = idx === 0 || progress[idx - 1]?.passed;
          const levelData = progress[idx];
          const hasQs = LEVELS[idx] && LEVELS[idx].length > 0;
          return (
            <button key={idx} className="level-card" onClick={() => hasQs && unlocked && startLevel(idx)}
              style={{ opacity: unlocked && hasQs ? 1 : 0.5, cursor: unlocked && hasQs ? 'pointer' : 'not-allowed' }}>
              <span className="level-icon">{unlocked ? '🎬' : '🔒'}</span>
              <div className="level-info">
                <div className="level-name">{name}</div>
                <div className="level-meta">
                  {!unlocked ? 'Need 8/10 on previous level' : !hasQs ? 'Coming soon' : levelData ? `${levelData.score}/10 correct` : '10 questions · 30s timer'}
                </div>
              </div>
              <span style={{ color: T.textDim, fontSize: 20 }}>{unlocked && hasQs ? '›' : ''}</span>
            </button>
          );
        })}
      </section>
    );
  }

  // ─── Game Over ────────────────────────────────────────────
  if (phase === 'gameover') {
    return (
      <div className="result-screen">
        <span className="result-emoji">💀</span>
        <div className="result-title">Game Over</div>
        <div className="result-sub">You got {score}/{Math.min(QUESTIONS_PER_LEVEL, levelQuestions.length)} correct</div>
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
        <div className="result-sub">{score}/{Math.min(QUESTIONS_PER_LEVEL, levelQuestions.length)} correct</div>
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
  if (!currentQ) return <div className="card"><p>No questions available for this level!</p></div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0', marginBottom: 8 }}>
        <button className="back-btn" onClick={() => { clearAllTimers(); setPhase('levels'); }} style={{ background: 'none', border: 'none', color: T.text, fontSize: 18, marginRight: 12 }}>←</button>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: T.success }}>✓ {score}</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: MAX_SKIPS }).map((_, i) => (
            <span key={i} style={{ fontSize: 16, opacity: i < (MAX_SKIPS - skipsUsed) ? 1 : 0.2 }}>⏩</span>
          ))}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: timeLeft <= 10 ? T.error : T.text }}>{timeLeft}s</div>
        <div style={{ fontSize: 10, color: T.textMid }}>Q{currentIdx + 1}/{Math.min(QUESTIONS_PER_LEVEL, levelQuestions.length)}</div>
      </div>

      {/* Question */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.6, color: T.text }}>
          {currentQ.text}
        </div>
      </div>

      {/* MCQ Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {currentQ.options.map((opt, idx) => {
          let cls = 'option-btn';
          if (answered) {
            if (idx === currentQ.correct) cls += ' correct';
            else if (idx === selectedOption) cls += ' wrong';
          }
          return (
            <button key={idx} className={cls} onClick={() => submitAnswer(idx)} disabled={answered}
              style={{ padding: '12px 14px', fontSize: 14 }}>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Skip Button */}
      {!answered && (
        <div style={{ display: 'flex', gap: 8, padding: '0 0 10px' }}>
          <button className="power-btn" onClick={doSkip} disabled={spades < SKIP_COST} style={{ flex: 1 }}>
            ⏩ SKIP<br /><span style={{ color: T.gold }}>{SKIP_COST}♠</span>
          </button>
        </div>
      )}
    </div>
  );
}
