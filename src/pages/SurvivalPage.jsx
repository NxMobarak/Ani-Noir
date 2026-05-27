import { useState, useEffect, useRef } from 'react';
import T from '../constants/theme';
import { shuffle } from '../utils/helpers';
import { playCorrect, playWrong, playCombo } from '../utils/audio';
import { questionBank } from '../questions/index';
import { ALL_EMOJI_QUESTIONS } from '../constants/questions';
import { addXP, XP_REWARDS } from '../utils/xpSystem';
import ResultScreen from '../components/ResultScreen';

const SURVIVAL_UNLOCK_KEY = 'ani_survival_unlocked';
const SURVIVAL_TRIALS_KEY = 'ani_survival_trials';
const FREE_TRIALS = 5;
const UNLOCK_COST = 1000;

export default function SurvivalPage({ spades, setSpades, showFeedback }) {
  const [phase, setPhase] = useState('intro'); // intro, playing, result
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const isUnlocked = () => localStorage.getItem(SURVIVAL_UNLOCK_KEY) === 'true';
  const getTrials = () => parseInt(localStorage.getItem(SURVIVAL_TRIALS_KEY) || '0', 10);

  const canPlay = () => isUnlocked() || getTrials() < FREE_TRIALS;

  const startGame = () => {
    if (!canPlay()) {
      // Need to pay to unlock
      if (spades < UNLOCK_COST) {
        showFeedback(`Need ${UNLOCK_COST} ♠ to unlock! (Have ${spades})`, 'error');
        return;
      }
      setSpades(s => s - UNLOCK_COST);
      localStorage.setItem(SURVIVAL_UNLOCK_KEY, 'true');
      showFeedback('Survival Mode Unlocked! 🎉', 'success');
    }

    if (!isUnlocked()) {
      const trials = getTrials();
      localStorage.setItem(SURVIVAL_TRIALS_KEY, String(trials + 1));
    }

    // Combine all MCQ questions + emoji MCQ questions
    const allQ = [
      ...questionBank.filter(q => q.type === 'mcq'),
      ...ALL_EMOJI_QUESTIONS.map(q => ({ ...q, type: 'emoji' })),
    ];
    const shuffled = shuffle(allQ);
    setQuestions(shuffled);
    setCurrentIdx(0);
    setLives(3);
    setScore(0);
    setStreak(0);
    setAnswered(false);
    setSelectedOption(null);
    setPhase('playing');
  };

  const currentQ = questions[currentIdx];

  const handleAnswer = (option) => {
    if (answered) return;
    setAnswered(true);
    setSelectedOption(option);

    // For MCQ/emoji questions, 'correct' is an index number
    let correct = false;
    if (typeof currentQ.correct === 'number' && currentQ.options) {
      correct = option === currentQ.options[currentQ.correct];
    } else {
      correct = option === currentQ.answer || option === currentQ.correct;
    }

    if (correct) {
      const newScore = score + 1;
      setScore(newScore);
      const newStreak = streak + 1;
      setStreak(newStreak);

      if (newScore % 5 === 0) {
        setSpades(s => s + 100);
        addXP(XP_REWARDS.SURVIVAL_PER_5);
        showFeedback('+100 ♠ Milestone!', 'success');
      }

      if (newStreak % 3 === 0) {
        playCombo();
        showFeedback(`🔥 ${newStreak}x Combo!`, 'success');
      } else {
        playCorrect();
      }
    } else {
      playWrong();
      setStreak(0);
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setTimeout(() => setPhase('result'), 1500);
        return;
      }
    }

    setTimeout(() => {
      if (currentIdx + 1 >= questions.length) {
        setPhase('result');
      } else {
        setCurrentIdx(i => i + 1);
        setAnswered(false);
        setSelectedOption(null);
      }
    }, 1500);
  };

  const trialsLeft = FREE_TRIALS - getTrials();
  const unlocked = isUnlocked();

  // Auto-start game on mount
  useEffect(() => {
    if (phase === 'intro') {
      startGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Result ────────────────────────────────────────────────
  if (phase === 'result') {
    return (
      <ResultScreen
        passed={score >= 15}
        gameOver={true}
        title="Game Over"
        subtitle={`Final Score: ${score}`}
        stats={[
          { icon: '🔥', label: 'Best Streak', value: streak > 0 ? `${streak}x` : 'N/A' },
          { icon: '🎯', label: 'Questions', value: `${score} correct` },
        ]}
        buttons={[
          { label: 'Play Again', onClick: startGame, variant: 'primary' },
        ]}
      />
    );
  }

  // ─── Playing ───────────────────────────────────────────────
  const correctAnswer = (typeof currentQ?.correct === 'number' && currentQ?.options)
    ? currentQ.options[currentQ.correct]
    : (currentQ?.answer || currentQ?.correct);
  const options = currentQ?.options || [];

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} style={{ fontSize: 20, opacity: i < lives ? 1 : 0.2 }}>❤️</span>
          ))}
        </div>
        <div style={{ color: T.gold, fontWeight: 700, fontSize: 16 }}>
          Score: {score}
        </div>
      </div>

      {/* Rules hint - styled like Word Ninja */}
      {currentIdx === 0 && !answered && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, marginBottom: 4 }}>Rules</div>
          <ul style={{ listStyle: 'none', fontSize: 10, color: T.textMid, lineHeight: 1.8, padding: 0, margin: 0 }}>
            <li>❤️ <strong style={{ color: T.text }}>3 lives</strong> — no timer</li>
            <li>🎯 Every <strong style={{ color: T.text }}>5 correct</strong> = +100 ♠</li>
            <li>🔥 Build <strong style={{ color: T.text }}>streaks</strong> for combo bonus</li>
          </ul>
        </div>
      )}

      {/* Streak */}
      {streak >= 2 && (
        <div style={{ textAlign: 'center', color: T.rose, fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
          🔥 {streak}x Streak
        </div>
      )}

      {/* Question */}
      <div style={{
        background: T.card, borderRadius: 12, padding: 16, marginBottom: 16,
        border: `1px solid ${T.border}`
      }}>
        <p style={{ color: T.text, fontSize: 15, textAlign: 'center', margin: 0 }}>
          {currentQ?.text || currentQ?.emoji || currentQ?.question || ''}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((opt, i) => {
          const isSelected = selectedOption === opt;
          const isCorrect = opt === correctAnswer;
          let bg = T.card;
          let borderColor = T.border;
          if (answered) {
            if (isCorrect) { bg = 'rgba(34,197,94,0.15)'; borderColor = T.success; }
            else if (isSelected && !isCorrect) { bg = 'rgba(244,63,94,0.15)'; borderColor = T.error; }
          }
          return (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={answered}
              style={{
                padding: '12px 16px', borderRadius: 10,
                background: bg, border: `1px solid ${borderColor}`,
                color: T.text, fontSize: 14, textAlign: 'left',
                cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
