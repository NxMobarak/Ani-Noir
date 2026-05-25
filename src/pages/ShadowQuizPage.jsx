import { useState, useEffect, useRef, useCallback } from 'react';
import T from '../constants/theme';
import { SHADOW_CHARACTERS } from '../constants/data';
import { shuffle } from '../utils/helpers';
import { playCorrect, playWrong, playCombo } from '../utils/audio';
import CircularTimer from '../components/CircularTimer';

export default function ShadowQuizPage({ spades, setSpades, showFeedback }) {
  const [phase, setPhase] = useState('intro'); // intro, playing, result
  const [characters, setCharacters] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [revealed, setRevealed] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const timerRef = useRef(null);
  const advanceRef = useRef(null);
  const inputRef = useRef(null);

  const startGame = () => {
    const shuffled = shuffle(SHADOW_CHARACTERS);
    setCharacters(shuffled);
    setCurrentIdx(0);
    setLives(3);
    setScore(0);
    setStreak(0);
    setGuess('');
    setTimeLeft(30);
    setRevealed(false);
    setWasCorrect(null);
    setPhase('playing');
  };

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
    playWrong();
    const newLives = lives - 1;
    setLives(newLives);
    if (newLives <= 0) {
      setTimeout(() => setPhase('result'), 2000);
    } else {
      advanceRef.current = setTimeout(() => advanceToNext(), 5000);
    }
  };

  const advanceToNext = () => {
    if (currentIdx + 1 >= characters.length) {
      setPhase('result');
      return;
    }
    setCurrentIdx(i => i + 1);
    setGuess('');
    setTimeLeft(30);
    setRevealed(false);
    setWasCorrect(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!guess.trim() || revealed || !currentChar) return;
    clearInterval(timerRef.current);

    const normalizedGuess = guess.trim().toLowerCase().replace(/\s+/g, '');
    const normalizedAnswer = currentChar.name.toLowerCase().replace(/\s+/g, '');

    if (normalizedGuess === normalizedAnswer) {
      setRevealed(true);
      setWasCorrect(true);
      const newScore = score + 1;
      setScore(newScore);
      const newStreak = streak + 1;
      setStreak(newStreak);

      // Every 5 correct = +100 spades
      if (newScore % 5 === 0) {
        setSpades(s => s + 100);
        showFeedback('+100 ♠ Milestone!', 'success');
      }

      // 3x streak gives bonus
      if (newStreak % 3 === 0) {
        playCombo();
        const bonus = 50;
        setSpades(s => s + bonus);
        showFeedback(`🔥 ${newStreak}x Streak! +${bonus} ♠`, 'success');
      } else {
        playCorrect();
      }

      advanceRef.current = setTimeout(() => advanceToNext(), 5000);
    } else {
      setRevealed(true);
      setWasCorrect(false);
      setStreak(0);
      playWrong();
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setTimeout(() => setPhase('result'), 2000);
      } else {
        advanceRef.current = setTimeout(() => advanceToNext(), 5000);
      }
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(advanceRef.current);
    };
  }, []);

  const maxLength = currentChar ? currentChar.name.replace(/\s+/g, '').length : 20;

  // ─── Intro ─────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🕶️</div>
        <h2 style={{ color: T.text, marginBottom: 8 }}>Shadow Quiz</h2>
        <p style={{ color: T.textMid, marginBottom: 8, fontSize: 14 }}>
          Guess the anime character from their silhouette!
        </p>
        <div style={{ color: T.textDim, fontSize: 13, marginBottom: 20 }}>
          • 3 lives – survival style<br />
          • 30 seconds per character<br />
          • Type the character's name<br />
          • Every 5 correct = +100 ♠<br />
          • 3x streak = bonus spades
        </div>
        <button className="btn btn-primary" onClick={startGame}>
          Start Game
        </button>
      </div>
    );
  }

  // ─── Result ────────────────────────────────────────────────
  if (phase === 'result') {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {score >= 20 ? '🏆' : score >= 10 ? '⭐' : '💀'}
        </div>
        <h2 style={{ color: T.text, marginBottom: 8 }}>Game Over</h2>
        <p style={{ color: T.gold, fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Score: {score}
        </p>
        <p style={{ color: T.textMid, fontSize: 14, marginBottom: 20 }}>
          Characters guessed correctly
        </p>
        <button className="btn btn-primary" onClick={startGame}>
          Play Again
        </button>
      </div>
    );
  }

  // ─── Playing ───────────────────────────────────────────────
  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} style={{ fontSize: 20, opacity: i < lives ? 1 : 0.2 }}>❤️</span>
          ))}
        </div>
        <CircularTimer timeLeft={timeLeft} maxTime={30} />
        <div style={{ color: T.gold, fontWeight: 700, fontSize: 16 }}>
          {score} 🎯
        </div>
      </div>

      {/* Streak indicator */}
      {streak >= 2 && (
        <div style={{ textAlign: 'center', color: T.rose, fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
          🔥 {streak}x Streak
        </div>
      )}

      {/* Shadow image */}
      <div style={{
        display: 'flex', justifyContent: 'center', marginBottom: 16,
        position: 'relative'
      }}>
        <img
          src={`/shadows/${currentChar?.file}`}
          alt="Shadow character"
          style={{
            width: 200, height: 200, objectFit: 'contain',
            filter: revealed ? 'none' : 'brightness(0)',
            transition: 'filter 0.5s ease',
            borderRadius: 12,
          }}
        />
      </div>

      {/* Character name on reveal */}
      {revealed && (
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{
            fontSize: 18, fontWeight: 700,
            color: wasCorrect ? T.success : T.error,
          }}>
            {wasCorrect ? '✓ Correct!' : `✗ It was: ${currentChar?.name}`}
          </div>
          <div style={{ color: T.textDim, fontSize: 12, marginTop: 4 }}>
            Next character in 5s...
          </div>
        </div>
      )}

      {/* Input */}
      {!revealed && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            type="text"
            value={guess}
            onChange={e => setGuess(e.target.value)}
            maxLength={maxLength}
            placeholder="Type character name..."
            autoFocus
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 8,
              background: T.surface, border: `1px solid ${T.border}`,
              color: T.text, fontSize: 15, outline: 'none',
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>
            Guess
          </button>
        </form>
      )}

      {/* Hint: character length */}
      {!revealed && (
        <div style={{ textAlign: 'center', color: T.textDim, fontSize: 12, marginTop: 8 }}>
          Name has {currentChar?.name.replace(/\s+/g, '').length} letters (no spaces)
        </div>
      )}
    </div>
  );
}
