import { useState, useEffect } from 'react';
import T from '../constants/theme';
import { shuffle } from '../utils/helpers';
import { playCorrect, playWrong } from '../utils/audio';
import { addXP } from '../utils/xpSystem';
import WordNinjaTiles from '../components/WordNinjaTiles';

// Import level 5 from ALL game modes
import quizL5 from '../games/anime-quiz/questions/level5';
import wordNinjaL5 from '../games/word-ninja/questions/level5';
import emojiL5 from '../games/emoji-wars/questions/level5';
import shadowL5 from '../games/anime-shadow/questions/level5';
import momentsL5 from '../games/anime-moments/questions/level5';
import dialogueL5 from '../games/dialogue-clash/questions/level5';
import themeL5 from '../games/anime-theme/questions/level5';
import frameGuessL5 from '../games/frame-guess/questions/level5';

const DAILY_KEY = 'ani_daily';
const DAILY_REWARD_SPADES = 50;
const DAILY_REWARD_XP = 300;

// Build daily question pool from all game modes level 5
function buildDailyPool() {
  const pool = [];
  quizL5.forEach(q => pool.push({ ...q, type: 'mcq', mode: 'Anime Quiz' }));
  wordNinjaL5.forEach(q => pool.push({ ...q, type: 'anagram', mode: 'Word Ninja' }));
  emojiL5.forEach(q => pool.push({ ...q, type: 'mcq', mode: 'Emoji Wars' }));
  shadowL5.forEach(q => pool.push({ ...q, type: 'mcq', mode: 'Anime Shadow' }));
  momentsL5.forEach(q => pool.push({ ...q, type: 'mcq', mode: 'Anime Moments' }));
  dialogueL5.forEach(q => pool.push({ ...q, type: 'mcq', mode: 'Dialogue Clash' }));
  themeL5.forEach(q => pool.push({ ...q, type: 'mcq', mode: 'Anime Theme' }));
  frameGuessL5.forEach(q => pool.push({ ...q, type: 'mcq', mode: 'Frame Guess' }));
  return pool.filter(q => q.text || q.emoji);
}

function getDailyQuestion() {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const dateStr = ist.toISOString().split('T')[0];

  // Check if already completed today
  const stored = JSON.parse(localStorage.getItem(DAILY_KEY) || '{}');
  if (stored.date === dateStr) {
    return { question: stored.question, completed: true, answer: stored.answer, wasCorrect: stored.wasCorrect };
  }

  // Select a question from all level 5 questions based on date seed
  const pool = buildDailyPool();
  if (pool.length === 0) return { question: null, completed: false, answer: null, wasCorrect: null };
  const seed = dateStr.split('-').join('');
  const idx = parseInt(seed, 10) % pool.length;
  const question = pool[idx];

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

    // For MCQ questions, 'correct' is an index number. For anagram, 'answer' is a string.
    let isCorrect = false;
    if (question.type === 'mcq' || (typeof question.correct === 'number' && question.options)) {
      isCorrect = option === question.options[question.correct];
    } else {
      isCorrect = option === question.answer || option === question.correct;
    }

    const now = new Date();
    const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const dateStr = ist.toISOString().split('T')[0];

    if (isCorrect) {
      playCorrect();
      setSpades(s => s + DAILY_REWARD_SPADES);
      addXP(DAILY_REWARD_XP);
      showFeedback(`+${DAILY_REWARD_SPADES} ♠ & +${DAILY_REWARD_XP} XP Daily Reward!`, 'success');
    } else {
      playWrong();
      showFeedback('Wrong! Better luck tomorrow!', 'error');
    }

    localStorage.setItem(DAILY_KEY, JSON.stringify({
      date: dateStr,
      question,
      answer: option,
      wasCorrect: isCorrect,
    }));

    setDaily(prev => ({ ...prev, completed: true, wasCorrect: isCorrect }));
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

  const correctAnswer = (typeof question.correct === 'number' && question.options)
    ? question.options[question.correct]
    : (question.answer || question.correct);
  const isAnagram = question.type === 'anagram';
  const wasWrong = answered && (storedResult === false || (selectedOption && selectedOption !== correctAnswer));

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
        <h2 style={{ color: T.text, marginBottom: 4, fontSize: 18 }}>Daily Challenge</h2>
        <p style={{ color: T.textDim, fontSize: 12 }}>
          One question per day • +{DAILY_REWARD_SPADES} ♠ & +{DAILY_REWARD_XP} XP reward
        </p>
        {question.mode && (
          <span style={{ fontSize: 10, color: T.teal, background: 'rgba(20,184,166,0.1)', padding: '3px 10px', borderRadius: 6, marginTop: 6, display: 'inline-block' }}>
            From: {question.mode} • Level 5
          </span>
        )}
      </div>

      {/* Reward Info */}
      {!completed && (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 12, padding: '10px 14px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 22 }}>🎁</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>Reward</div>
            <div style={{ fontSize: 11, color: T.textMid }}>+{DAILY_REWARD_SPADES} ♠ Spades & +{DAILY_REWARD_XP} XP on correct answer</div>
          </div>
        </div>
      )}

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
            Correct Answer: <span style={{ color: T.success, fontWeight: 700 }}>{correctAnswer}</span>
          </p>
        </div>
      )}

      {/* Wrong answer - show correct answer immediately */}
      {wasWrong && !completed && (
        <div style={{
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
          borderRadius: 12, padding: '10px 14px', marginBottom: 16, textAlign: 'center',
        }}>
          <p style={{ color: T.error, fontSize: 13, fontWeight: 700, margin: '0 0 4px' }}>Wrong Answer!</p>
          <p style={{ color: T.textMid, fontSize: 12, margin: 0 }}>
            Correct Answer: <span style={{ color: T.success, fontWeight: 700 }}>{correctAnswer}</span>
          </p>
        </div>
      )}

      {/* Question */}
      <div style={{
        background: T.card, borderRadius: 12, padding: 16, marginBottom: 16,
        border: `1px solid ${T.border}`
      }}>
        <p style={{ color: T.text, fontSize: 15, textAlign: 'center', margin: 0 }}>
          {question.text || question.emoji || question.question || ''}
        </p>
      </div>

      {/* Answer section */}
      {isAnagram ? (
        <WordNinjaTiles
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
