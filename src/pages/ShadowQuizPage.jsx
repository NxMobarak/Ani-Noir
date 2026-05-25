import { useState, useEffect, useRef, useCallback, memo } from 'react';
import T from '../constants/theme';
import { SHADOW_CHARACTERS } from '../constants/data';
import { shuffle } from '../utils/helpers';
import { playCorrect, playWrong, playCombo } from '../utils/audio';
import { useSwipe } from '../utils/swipe';
import CircularTimer from '../components/CircularTimer';
import BackButton from '../components/BackButton';

const ShadowImage = memo(function ShadowImage({ file, revealed }) {
  return (
    <img
      src={`/shadows/${file}`}
      alt="Shadow character silhouette"
      style={{
        width: 200, height: 200, objectFit: 'contain',
        filter: revealed ? 'none' : 'brightness(0)',
        transition: 'filter 0.5s ease',
        borderRadius: 12,
      }}
    />
  );
});

function generateOptions(correctName, allCharacters) {
  const others = allCharacters
    .filter(c => c.name !== correctName)
    .map(c => c.name);
  const shuffledOthers = shuffle(others).slice(0, 3);
  const options = shuffle([correctName, ...shuffledOthers]);
  return options;
}

export default function ShadowQuizPage({ spades, setSpades, showFeedback }) {
  const [phase, setPhase] = useState('intro');
  const [characters, setCharacters] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [options, setOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [revealed, setRevealed] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const timerRef = useRef(null);
  const advanceRef = useRef(null);

  const startGame = useCallback(() => {
    const shuffled = shuffle(SHADOW_CHARACTERS);
    setCharacters(shuffled);
    setCurrentIdx(0);
    setLives(3);
    setScore(0);
    setStreak(0);
    setOptions(generateOptions(shuffled[0].name, SHADOW_CHARACTERS));
    setTimeLeft(30);
    setRevealed(false);
    setWasCorrect(null);
    setSelectedOption(null);
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
    setOptions(generateOptions(characters[nextIdx].name, SHADOW_CHARACTERS));
    setTimeLeft(30);
    setRevealed(false);
    setWasCorrect(null);
    setSelectedOption(null);
  };

  const handleOptionSelect = useCallback((optionName) => {
    if (revealed || !currentChar) return;
    clearInterval(timerRef.current);
    setSelectedOption(optionName);

    if (optionName === currentChar.name) {
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
  }, [revealed, currentChar, score, streak, lives, currentIdx, characters]);

  // Swipe to skip (costs nothing, just visual feedback)
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (!revealed && currentChar) {
        // Swipe left = skip-like gesture (no penalty, just shows "swipe doesn't skip")
      }
    },
    onSwipeRight: () => {},
  });

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
          • Tap the correct name<br />
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
  return (
    <section aria-label="Shadow Quiz Game" style={{ padding: 16 }} {...swipeHandlers}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="survival-lives" aria-label={`${lives} lives remaining`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} style={{ fontSize: 20, opacity: i < lives ? 1 : 0.2 }} aria-hidden="true">❤️</span>
          ))}
        </div>
        <CircularTimer timeLeft={timeLeft} maxTime={30} />
        <div style={{ color: T.gold, fontWeight: 700, fontSize: 16 }} aria-label={`Score: ${score}`}>
          {score} 🎯
        </div>
      </div>

      {/* Streak indicator */}
      {streak >= 2 && (
        <div style={{ textAlign: 'center', color: T.rose, fontSize: 13, marginBottom: 8, fontWeight: 600 }} aria-live="polite">
          🔥 {streak}x Streak
        </div>
      )}

      {/* Shadow image */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <ShadowImage file={currentChar?.file} revealed={revealed} />
      </div>

      {/* Character name on reveal */}
      {revealed && (
        <div style={{ textAlign: 'center', marginBottom: 12 }} aria-live="polite">
          <div style={{
            fontSize: 18, fontWeight: 700,
            color: wasCorrect ? T.success : T.error,
          }}>
            {wasCorrect ? '✓ Correct!' : `✗ It was: ${currentChar?.name}`}
          </div>
          <div style={{ color: T.textMid, fontSize: 12, marginTop: 4 }}>
            Next character in 3s...
          </div>
        </div>
      )}

      {/* Multiple Choice Options */}
      {!revealed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role="group" aria-label="Character name options">
          {options.map((name) => (
            <button
              key={name}
              className="option-btn"
              onClick={() => handleOptionSelect(name)}
              disabled={revealed}
              aria-label={`Select ${name}`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Show selected option state after reveal */}
      {revealed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((name) => {
            let cls = 'option-btn answered-visible';
            if (name === currentChar?.name) cls += ' correct';
            else if (name === selectedOption && name !== currentChar?.name) cls += ' wrong';
            return (
              <button key={name} className={cls} disabled aria-label={name}>
                {name}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
