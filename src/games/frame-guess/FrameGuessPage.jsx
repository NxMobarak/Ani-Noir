import { useState, useEffect, useRef } from 'react';
import T from '../../constants/theme';
import { playCorrect, playWrong, playCombo } from '../../utils/audio';
import { addXP, XP_REWARDS } from '../../utils/xpSystem';
import BackButton from '../../components/BackButton';
import ResultScreen from '../../components/ResultScreen';

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

// Shuffle options and track correct index
function shuffleOptions(options, correctIdx) {
  const indexed = options.map((opt, i) => ({ opt, isCorrect: i === correctIdx }));
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }
  const newCorrect = indexed.findIndex(item => item.isCorrect);
  return { shuffled: indexed.map(item => item.opt), correctIndex: newCorrect };
}

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
  const [streak, setStreak] = useState(0);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [hiddenOption, setHiddenOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL);
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [progress, setProgress] = useState(getProgress);
  const [shuffledData, setShuffledData] = useState({ shuffled: [], correctIndex: 0 });

  const timerRef = useRef(null);
  const advanceRef = useRef(null);

  const levelQuestions = LEVELS[currentLevel] || [];
  const currentQ = levelQuestions[currentIdx];

  // Shuffle options whenever question changes
  useEffect(() => {
    if (currentQ) {
      const result = shuffleOptions(currentQ.options, currentQ.correct);
      setShuffledData(result);
    }
  }, [currentLevel, currentIdx]);

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
    setStreak(0);
    playWrong();
    showFeedback(`Wrong! Answer: ${shuffledData.shuffled[shuffledData.correctIndex]}`);
    advanceRef.current = setTimeout(() => advanceToNext(), 2500);
  };

  const handleCorrect = (optIdx) => {
    clearAllTimers();
    setAnswered(true);
    setWasCorrect(true);
    setSelectedOption(optIdx);
    const newScore = score + 1;
    setScore(newScore);
    const newStreak = streak + 1;
    setStreak(newStreak);

    if (newStreak >= 3 && newStreak % 3 === 0) {
      const bonus = 50;
      setSpades(s => s + bonus);
      playCombo();
      showFeedback(`🔥 ${newStreak}x Streak! +${bonus}♠`);
    } else {
      playCorrect();
      showFeedback('Correct!');
    }

    advanceRef.current = setTimeout(() => advanceToNext(), 1500);
  };

  const submitAnswer = (optIdx) => {
    if (answered || optIdx === hiddenOption) return;
    if (optIdx === shuffledData.correctIndex) {
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
      setHintUsed(false);
      setHiddenOption(null);
    }
  };

  const doSkip = () => {
    if (spades < SKIP_COST || answered) return;
    const newSkips = skipsUsed + 1;
    setSkipsUsed(newSkips);
    setSpades(s => s - SKIP_COST);
    setStreak(0);
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

  const doHint = () => {
    if (spades < HINT_COST || hintUsed || answered) return;
    setSpades(s => s - HINT_COST);
    setHintUsed(true);
    // Hide one wrong option
    const wrongIndices = shuffledData.shuffled
      .map((_, i) => i)
      .filter(i => i !== shuffledData.correctIndex && i !== hiddenOption);
    if (wrongIndices.length > 0) {
      const randomWrong = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
      setHiddenOption(randomWrong);
    }
    showFeedback(`💡 Hint! -${HINT_COST}♠ — 1 option removed`);
  };

  const startLevel = (levelIdx) => {
    if (levelIdx > 0 && !progress[levelIdx - 1]?.passed) return;
    setCurrentLevel(levelIdx);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setSkipsUsed(0);
    setHintUsed(false);
    setHiddenOption(null);
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
          <p style={{ fontSize: 12, color: T.textMid }}>Guess the anime from a screenshot!</p>
          <p style={{ fontSize: 11, color: T.gold, marginTop: 4 }}>10 frames per level · Need 8/10 to unlock next</p>
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
                  {!unlocked ? 'Need 8/10 on previous level' : !hasQs ? 'Coming soon' : levelData ? `${levelData.score}/10 correct` : '10 frames · 30s timer'}
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
    const accuracyPct = Math.round((score / Math.min(QUESTIONS_PER_LEVEL, levelQuestions.length)) * 100);
    return (
      <ResultScreen
        passed={false}
        gameOver={true}
        title="Game Over"
        subtitle={`You got ${score}/${Math.min(QUESTIONS_PER_LEVEL, levelQuestions.length)} correct`}
        accuracy={`${accuracyPct}%`}
        buttons={[
          { label: '\u2190 Levels', onClick: () => setPhase('levels'), variant: 'secondary' },
          { label: 'Retry', onClick: () => startLevel(currentLevel), variant: 'primary' },
        ]}
      />
    );
  }

  // ─── Result ───────────────────────────────────────────────
  if (phase === 'result') {
    const passed = score >= PASS_THRESHOLD;
    const accuracyPct = Math.round((score / Math.min(QUESTIONS_PER_LEVEL, levelQuestions.length)) * 100);
    const buttons = [
      { label: '\u2190 Levels', onClick: () => setPhase('levels'), variant: 'secondary' },
    ];
    if (!passed) buttons.push({ label: 'Retry', onClick: () => startLevel(currentLevel), variant: 'primary' });
    if (passed && currentLevel < 4) buttons.push({ label: 'Next Level \u2192', onClick: () => startLevel(currentLevel + 1), variant: 'primary' });

    return (
      <ResultScreen
        passed={passed}
        title={passed ? 'Level Cleared!' : 'Level Failed'}
        subtitle={`${score}/${Math.min(QUESTIONS_PER_LEVEL, levelQuestions.length)} correct`}
        accuracy={`${accuracyPct}%`}
        buttons={buttons}
      />
    );
  }

  // ─── Playing ──────────────────────────────────────────────
  if (!currentQ) return <div className="card"><p>No questions available for this level!</p></div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0', marginBottom: 8 }}>
        <button className="back-btn" onClick={() => { clearAllTimers(); setPhase('levels'); }} style={{ background: 'none', border: 'none', color: T.text, fontSize: 18, marginRight: 12 }}>←</button>
        <div style={{ flex: 1 }}>
          {streak >= 3 && <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: 10 }}>🔥 {streak}x</span>}
        </div>
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

      {/* Frame Image */}
      <div style={{ margin: '0 0 12px', borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border}`, aspectRatio: '16/9', background: T.surface }}>
        <img
          src={`/frames/${currentQ.image}`}
          alt="Guess this anime frame"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>

      {/* MCQ Options */}
      <div key={`q-${currentLevel}-${currentIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {shuffledData.shuffled.map((opt, idx) => {
          if (idx === hiddenOption) return null; // hidden by hint
          let cls = 'option-btn';
          if (answered) {
            if (idx === shuffledData.correctIndex) cls += ' correct';
            else if (idx === selectedOption) cls += ' wrong';
          }
          return (
            <button key={`${currentIdx}-${idx}`} className={cls} onClick={() => submitAnswer(idx)} disabled={answered}
              style={{ padding: '12px 14px', fontSize: 14 }}>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Skip + Hint Buttons */}
      {!answered && (
        <div style={{ display: 'flex', gap: 8, padding: '0 0 10px' }}>
          <button className="power-btn" onClick={doSkip} disabled={spades < SKIP_COST} style={{ flex: 1 }}>
            ⏩ SKIP<br /><span style={{ color: T.gold }}>{SKIP_COST}♠</span>
          </button>
          <button className="power-btn" onClick={doHint} disabled={spades < HINT_COST || hintUsed} style={{ flex: 1, opacity: hintUsed ? 0.4 : 1 }}>
            💡 HINT<br /><span style={{ color: T.gold }}>{HINT_COST}♠</span>
          </button>
        </div>
      )}
    </div>
  );
}
