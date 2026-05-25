import { useState, useEffect } from 'react';
import T from '../constants/theme';
import { questionBank } from '../questions/index';
import { shuffle } from '../utils/helpers';
import { playCorrect, playWrong } from '../utils/audio';
import AnagramTiles from '../components/AnagramTiles';

const DAILY_KEY = 'ani_daily';
const DAILY_REWARD = 30;

function getDailyQuestion() {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const dateStr = ist.toISOString().split('T')[0];

  // Check if already completed today
  const stored = JSON.parse(localStorage.getItem(DAILY_KEY) || '{}');
  if (stored.date === dateStr) {
    return { question: stored.question, completed: true, answer: stored.answer, wasCorrect: stored.wasCorrect };
  }

  // Select a level 2-4 question based on date seed
  const eligible = questionBank.filter(q => q.level >= 2 && q.level <= 4);
  const seed = dateStr.split('-').join('');
  const idx = parseInt(seed, 10) % eligible.length;
  const question = eligible[idx];

  return { question, completed: false, answer: null, wasCorrect: null };
}

export default function DailyPage({ spades, setSpades, showFeedback }) {
  const [daily, setDaily] = useState(getDailyQuestion);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(daily.completed);

  const { question, completed, wasCorrect: storedResult } = daily;

  const handleAnswer = (option) => {
    if (answered) return;
    setAnswered(true);
    setSelectedOption(option);

    const correct = option === question.answer || option === question.correct;
    const now = new Date();
    const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const dateStr = ist.toISOString().split('T')[0];

    if (correct) {
      playCorrect();
      setSpades(s => s + DAILY_REWARD);
      showFeedback(`+${DAILY_REWARD} ♠ Daily Reward!`, 'success');
    } else {
      playWrong();
      showFeedback('Better luck tomorrow!', 'error');
    }

    localStorage.setItem(DAILY_KEY, JSON.stringify({
      date: dateStr,
      question,
      answer: option,
      wasCorrect: correct,
    }));

    setDaily(prev => ({ ...prev, completed: true, wasCorrect: correct }));
  };

  const handleAnagramSolve = (attempt) => {
    const correct = attempt.toLowerCase() === (question.answer || question.correct || '').toLowerCase();
    handleAnswer(correct ? (question.answer || question.correct) : attempt);
  };

  if (!question) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p style={{ color: T.textMid }}>No daily question available.</p>
      </div>
    );
  }

  const correctAnswer = question.answer || question.correct;
  const isAnagram = question.type === 'anagram';

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
        <h2 style={{ color: T.text, marginBottom: 4, fontSize: 18 }}>Daily Challenge</h2>
        <p style={{ color: T.textDim, fontSize: 12 }}>
          One question per day • +{DAILY_REWARD} ♠ reward
        </p>
      </div>

      {/* Already completed */}
      {completed && answered && (
        <div style={{
          textAlign: 'center', padding: 16, background: T.card,
          borderRadius: 12, border: `1px solid ${T.border}`, marginBottom: 16
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            {(storedResult ?? (selectedOption === correctAnswer)) ? '✅' : '❌'}
          </div>
          <p style={{ color: T.textMid, fontSize: 14 }}>
            {(storedResult ?? (selectedOption === correctAnswer))
              ? "You've completed today's challenge!"
              : "Better luck tomorrow!"}
          </p>
          <p style={{ color: T.textDim, fontSize: 12, marginTop: 4 }}>
            Answer: <span style={{ color: T.success }}>{correctAnswer}</span>
          </p>
        </div>
      )}

      {/* Question */}
      <div style={{
        background: T.card, borderRadius: 12, padding: 16, marginBottom: 16,
        border: `1px solid ${T.border}`
      }}>
        <div style={{ color: T.textDim, fontSize: 11, marginBottom: 8, textTransform: 'uppercase' }}>
          {question.type === 'mcq' ? 'Multiple Choice' : 'Anagram'} • Level {question.level}
        </div>
        <p style={{ color: T.text, fontSize: 15, textAlign: 'center', margin: 0 }}>
          {question.text || question.question || ''}
        </p>
      </div>

      {/* Answer section */}
      {isAnagram ? (
        <AnagramTiles
          scrambled={question.scrambled || (question.answer || '').split('').sort(() => Math.random() - 0.5)}
          onSolve={handleAnagramSolve}
          hintRevealed={false}
          hint={question.hint}
          answered={answered}
          correctAnswer={correctAnswer}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(question.options || []).map((opt, i) => {
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
      )}
    </div>
  );
}
