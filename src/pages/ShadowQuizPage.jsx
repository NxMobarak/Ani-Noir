import { useState, useEffect, useRef, useCallback, memo } from 'react';
import T from '../constants/theme';
import { SHADOW_CHARACTERS } from '../constants/data';
import { shuffle } from '../utils/helpers';
import { playCorrect, playWrong, playCombo } from '../utils/audio';
import CircularTimer from '../components/CircularTimer';
import BackButton from '../components/BackButton';

const ShadowImage = memo(function ShadowImage({ file, revealed }) {
  return (
    <img
      src={`/shadows/${file}`}
      alt="Shadow character silhouette"
      style={{
        width: 180, height: 180, objectFit: 'contain',
        filter: revealed ? 'none' : 'brightness(0)',
        transition: 'filter 0.5s ease',
        borderRadius: 12,
      }}
    />
  );
});

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

export default function ShadowQuizPage({ spades, setSpades, showFeedback }) {
  const [phase, setPhase] = useState('intro');
  const [characters, setCharacters] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [revealed, setRevealed] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [guess, setGuess] = useState('');
  const timerRef = useRef(null);
  const advanceRef = useRef(null);

  const startGame = useCallback(() => {
    const shuffled = shuffle(SHADOW_CHARACTERS);
    setCharacters(shuffled);
    setCurrentIdx(0);
    setLives(3);
    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    setRevealed(false);
    setWasCorrect(null);
    setGuess('');
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
  };

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
    if (key === '⌫') {
      setGuess(g => g.slice(0, -1));
    } else if (key === 'ENTER') {
      handleSubmit();
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

  // ─── Intro ─────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <section aria-label="Shadow Quiz Introduction" style={{ padding: 20, textAlign: 'center' }}>
        <BackButton />
        <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">🕶️</div>
        <h2 style={{ color: T.text, marginBottom: 8 }}>Shadow Quiz</h2>
        <p style={{ color: T.textMid, marginBottom: 8, fontSize: 14 }}>
          Guess the anime character from their silhouette!
        </p>
        <div style={{ color: T.textMid, fontSize: 13, marginBottom: 20 }}>
          • 3 lives — survival style<br />
          • 30 seconds per character<br />
          • Type the character name<br />
          • Every 5 correct = +100 ♠<br />
          • 3x streak = bonus spades
        </div>
        <button className="btn btn-primary" onClick={startGame} aria-label="Start Shadow Quiz">
          Start Game
        </button>
      </section>
    );
  }

  // ─── Result ────────────────────────────────────────────────
  if (phase === 'result') {
    return (
      <section aria-label="Game Results" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">
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
      </section>
    );
  }

  // ─── Playing ───────────────────────────────────────────────
  const progress = ((currentIdx) / characters.length) * 100;

  return (
    <section aria-label="Shadow Quiz Game" className="page-shadow-game" style={{ padding: 12 }}>
      {/* Progress bar */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: T.rose, borderRadius: 2, transition: 'width 0.4s' }} />
      </div>

      {/* Lives and Score row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="survival-lives" aria-label={`${lives} lives remaining`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} style={{ fontSize: 18, opacity: i < lives ? 1 : 0.2 }} aria-hidden="true">❤️</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: T.success, fontSize: 13, fontWeight: 700 }}>✓ {score}</span>
          <span style={{ color: T.error, fontSize: 13, fontWeight: 700 }}>✗ {(currentIdx - score)}</span>
        </div>
      </div>

      {/* Timer centered */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <CircularTimer timeLeft={timeLeft} maxTime={30} />
      </div>

      {/* Streak indicator */}
      {streak >= 2 && (
        <div style={{ textAlign: 'center', color: T.rose, fontSize: 12, marginBottom: 8, fontWeight: 600 }} aria-live="polite">
          🔥 {streak}x Streak
        </div>
      )}

      {/* Shadow image with lighter background */}
      <div style={{
        display: 'flex', justifyContent: 'center', marginBottom: 10,
        background: 'linear-gradient(135deg, #1e293b, #334155)',
        borderRadius: 16, padding: 16,
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <ShadowImage file={currentChar?.file} revealed={revealed} />
      </div>

      {/* Character name on reveal */}
      {revealed && (
        <div style={{ textAlign: 'center', marginBottom: 8 }} aria-live="polite">
          <div style={{
            fontSize: 16, fontWeight: 700,
            color: wasCorrect ? T.success : T.error,
          }}>
            {wasCorrect ? '✓ Correct!' : `✗ It was: ${currentChar?.name}`}
          </div>
          <div style={{ color: T.textMid, fontSize: 11, marginTop: 2 }}>
            Next character in 3s...
          </div>
        </div>
      )}

      {/* Guess display */}
      <div style={{
        background: '#0e1018',
        border: `1.5px solid ${revealed ? (wasCorrect ? T.success : T.error) : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 12,
        padding: '10px 14px',
        marginBottom: 10,
        textAlign: 'center',
        minHeight: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontSize: 18, fontWeight: 700, color: T.text,
          letterSpacing: 1,
        }}>
          {guess || <span style={{ color: T.textDim, fontWeight: 400, fontSize: 14 }}>Type character name...</span>}
        </span>
      </div>

      {/* On-screen Keyboard */}
      {!revealed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} style={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
              {row.map((key) => {
                const isSpecial = key === 'ENTER' || key === '⌫';
                return (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    style={{
                      minWidth: isSpecial ? 48 : 30,
                      height: 38,
                      borderRadius: 6,
                      border: 'none',
                      background: key === 'ENTER' ? T.rose : '#1e293b',
                      color: key === 'ENTER' ? '#fff' : T.text,
                      fontSize: isSpecial ? 11 : 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.1s',
                      flex: isSpecial ? '1.4' : '1',
                    }}
                    aria-label={key === '⌫' ? 'Backspace' : key}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
          {/* Space bar */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 2 }}>
            <button
              onClick={() => handleKeyPress(' ')}
              style={{
                width: '60%',
                height: 36,
                borderRadius: 6,
                border: 'none',
                background: '#1e293b',
                color: T.textDim,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              aria-label="Space"
            >
              SPACE
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
