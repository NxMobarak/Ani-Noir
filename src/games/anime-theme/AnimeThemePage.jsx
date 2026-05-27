import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import T from '../../constants/theme';
import { playCorrect, playWrong, playKeyTap } from '../../utils/audio';
import { addXP, XP_REWARDS } from '../../utils/xpSystem';
import BackButton from '../../components/BackButton';
import '../../styles/shadow-quiz.css';

const BackspaceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
    <line x1="18" y1="9" x2="12" y2="15"/>
    <line x1="12" y1="9" x2="18" y2="15"/>
  </svg>
);

// Audio files are in /public/audio/ with format: l{level}-{number}-{answer-with-hyphens}.mp3 or .m4a
// Example: l1-01-naruto.mp3, l2-05-attack-on-titan.m4a

const LEVEL_NAMES = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];
const CLIPS_PER_LEVEL = 10;
const AUDIO_PLAY_DURATION = 10;
const TIMER_TOTAL = 30;
const SKIP_COST = 50;
const HINT_COST = 100;
const MAX_SKIPS = 3;
const MAX_HINT_WRONG = 3;
const PASS_THRESHOLD = 8;
const STORAGE_KEY = 'ani_theme_progress';
const CLIPS_KEY = 'ani_theme_clips';

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

// Parse filename to extract answer
// l1-01-naruto.mp3 → "Naruto"
// l2-03-attack-on-titan.m4a → "Attack On Titan"
function parseFilename(filename) {
  const withoutExt = filename.replace(/\.(mp3|m4a)$/, '');
  const parts = withoutExt.split('-');
  // First part is level (l1), second is number (01), rest is answer
  const answerParts = parts.slice(2);
  return answerParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

// Parse level from filename
function parseLevel(filename) {
  const match = filename.match(/^l(\d+)-/);
  return match ? parseInt(match[1], 10) : 1;
}

// Generate random wrong options from other answers in same level
function generateOptions(correctAnswer, allAnswers) {
  const others = allAnswers.filter(a => a !== correctAnswer);
  const shuffled = others.sort(() => Math.random() - 0.5);
  const wrongOptions = shuffled.slice(0, 3);
  const options = [...wrongOptions, correctAnswer].sort(() => Math.random() - 0.5);
  return options;
}

// Scan for audio files - uses a manifest approach
// Since we can't dynamically scan folders in browser, we use a clips list
// User adds filenames to this list OR we detect from pre-built manifest
function getClipsForLevel(level, allClips) {
  return allClips
    .filter(f => parseLevel(f) === level)
    .sort()
    .slice(0, CLIPS_PER_LEVEL);
}

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

function saveProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Get clips manifest from localStorage or use default
function getClipsManifest() {
  try {
    const stored = localStorage.getItem(CLIPS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  // Actual uploaded clips - add new filenames here when uploading more levels
  return [
    // Level 1
    'l1-01-my-hero-academia.m4a',
    'l1-02-one-piece.m4a',
    'l1-03-hunter-x-hunter.m4a',
    'l1-04-your-name.m4a',
    'l1-05-tokyo-ghoul.m4a',
    'l1-06-naruto-shippuden.m4a',
    'l1-07-fairy-tail.m4a',
    'l1-08-one-punch-man.m4a',
    'l1-09-demon-slayer.m4a',
    'l1-10-parasyte-the-maxim.m4a',
    // Level 2
    'l2-01-kaguya-sama-love-is-war.m4a',
    'l2-02-tower-of-god.m4a',
    'l2-03-dragon-ball-z.m4a',
    'l2-04-jojo-bizarre-adventure.m4a',
    'l2-05-domestic-girlfriend.m4a',
    'l2-06-wotakoi-love-hard-for-otaku.m4a',
    'l2-07-tokyo-revengers.m4a',
    'l2-08-code-geass.m4a',
    'l2-09-jujutsu-kaisen.m4a',
    'l2-10-neon-genesis-evangelion.m4a',
    // Level 3
    'l3-01-attack-on-titan.m4a',
    'l3-02-blue-exorcist.m4a',
    'l3-03-overlord.m4a',
    'l3-04-lucky-star.m4a',
    'l3-05-hyouka.m4a',
    'l3-06-attack-on-titan.m4a',
    'l3-07-ya-boy-kongming.m4a',
    'l3-08-the-seven-deadly-sins.m4a',
    'l3-09-the-promised-neverland.m4a',
    'l3-10-violet-evergarden.m4a',
    // Level 4
    'l4-01-assassination-classroom.m4a',
    'l4-02-teasing-master-takagi-san.m4a',
    'l4-03-dr.-stone.m4a',
    'l4-04-bna-brand-new-animal.m4a',
    'l4-05-stein-gates.m4a',
    'l4-06-spy-x-family.m4a',
    'l4-07-spice-and-wolf.m4a',
    'l4-08-uzaki-chan-wants-to-hang-out.m4a',
    'l4-09-black-clover.m4a',
    'l4-10-plastic-memories.m4a',
    // Level 5
    'l5-01-food-wars.m4a',
    'l5-02-beyond-the-boundary.m4a',
    'l5-03-the-quintessential-quintuplets.m4a',
    'l5-04-free.m4a',
    'l5-05-samurai-champloo.m4a',
    'l5-06-kokoro-connect.m4a',
    'l5-07-assassins-pride.m4a',
    'l5-08-bleach.m4a',
    'l5-09-gintama.m4a',
    'l5-10-fairy-tail.m4a',
  ];
}

export default function AnimeThemePage({ spades, setSpades, showFeedback }) {
  const [phase, setPhase] = useState('levels');
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
  const [hintLetters, setHintLetters] = useState([]);
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(getProgress);
  const [totalStars, setTotalStars] = useState(0);
  const [clips] = useState(getClipsManifest);

  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const audioTimerRef = useRef(null);
  const countdownRef = useRef(null);

  const levelClips = getClipsForLevel(currentLevel + 1, clips);
  const currentFilename = levelClips[currentClip];
  const currentAnswer = currentFilename ? parseFilename(currentFilename) : '';
  const allLevelAnswers = levelClips.map(f => parseFilename(f));
  // Memoize options so they don't reshuffle on every re-render (e.g. timer tick)
  const currentOptions = useMemo(() => {
    if (!currentFilename) return [];
    return generateOptions(currentAnswer, allLevelAnswers);
  }, [currentFilename, currentAnswer]);

  const clearAllTimers = () => {
    clearInterval(timerRef.current);
    clearTimeout(audioTimerRef.current);
    clearTimeout(countdownRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const startClip = useCallback(() => {
    setGuess('');
    setAnswered(false);
    setWasCorrect(null);
    setHintUsed(false);
    setHintLetters([]);
    setTimeLeft(TIMER_TOTAL);
    setAudioPlaying(true);

    // Play audio
    if (currentFilename) {
      const audio = new Audio(`/audio/${currentFilename}`);
      audioRef.current = audio;
      audio.play().catch(() => {});
      audioTimerRef.current = setTimeout(() => {
        audio.pause();
        setAudioPlaying(false);
      }, AUDIO_PLAY_DURATION * 1000);
    } else {
      audioTimerRef.current = setTimeout(() => {
        setAudioPlaying(false);
      }, AUDIO_PLAY_DURATION * 1000);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [currentFilename]);

  useEffect(() => {
    if (timeLeft === 0 && !answered && phase === 'playing') {
      handleWrong();
    }
  }, [timeLeft, answered, phase]);

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
    showFeedback(`Wrong! Answer: ${currentAnswer}`);
    setTimeout(() => startCountdown(), 1500);
  };

  const handleCorrect = () => {
    clearAllTimers();
    setAnswered(true);
    setWasCorrect(true);
    playCorrect();

    const elapsed = TIMER_TOTAL - timeLeft;
    let earnedStars = 1;
    if (elapsed <= 10) earnedStars = 3;
    else if (elapsed <= 20) earnedStars = 2;
    setTotalStars(s => s + earnedStars);
    setScore(s => s + 1);
    showFeedback(`Correct! +${earnedStars} star${earnedStars > 1 ? 's' : ''}`);
    setTimeout(() => startCountdown(), 1500);
  };

  const submitGuess = () => {
    if (answered || !guess.trim()) return;
    // Build full guess merging hinted letters with typed
    const fullGuess = getFullGuess();
    const normalized = fullGuess.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const correct = currentAnswer.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normalized === correct) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  // Build full answer by merging typed letters with hinted letters (like shadow game)
  const getFullGuess = useCallback(() => {
    const name = currentAnswer;
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
  }, [currentAnswer, guess, hintLetters]);

  const submitOption = (opt) => {
    if (answered) return;
    if (opt === currentAnswer) {
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
    // 3 second delay then advance — countdown shown in reveal info area
    countdownRef.current = setTimeout(() => {
      advanceToNext();
    }, 3000);
  };

  const advanceToNext = () => {
    const nextClip = currentClip + 1;
    if (nextClip >= CLIPS_PER_LEVEL || nextClip >= levelClips.length) {
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
      setAnswered(false);
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
    setTotalStars(0);
    setPhase('playing');
  };

  const addLetter = (letter) => { if (!answered) { setGuess(g => g + letter); playKeyTap(); } };
  const removeLetter = () => { if (!answered) { setGuess(g => g.slice(0, -1)); playKeyTap(); } };
  const addSpace = () => { if (!answered) setGuess(g => g + ' '); };

  // Physical keyboard support
  useEffect(() => {
    if (phase !== 'playing' || answered) return;
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
  }, [phase, answered, guess]);

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
          const hasClips = getClipsForLevel(idx + 1, clips).length > 0;
          return (
            <button key={idx} className="level-card" onClick={() => hasClips && startLevel(idx)}
              style={{ opacity: unlocked && hasClips ? 1 : 0.5, cursor: unlocked && hasClips ? 'pointer' : 'not-allowed' }}>
              <span className="level-icon">{unlocked ? '🎵' : '🔒'}</span>
              <div className="level-info">
                <div className="level-name">{name}</div>
                <div className="level-meta">
                  {!unlocked ? 'Need 8/10 on previous level' : !hasClips ? 'No clips uploaded yet' : levelData ? `${levelData.score}/10 correct` : '10 audio clips · 30s timer'}
                </div>
              </div>
              <span style={{ color: T.textDim, fontSize: 20 }}>{unlocked && hasClips ? '›' : ''}</span>
            </button>
          );
        })}
      </section>
    );
  }

  // (countdown phase removed — delay handled via setTimeout in playing phase)

  // ─── Game Over ────────────────────────────────────────────
  if (phase === 'gameover') {
    return (
      <div className="result-screen">
        <span className="result-emoji">💀</span>
        <div className="result-title">Game Over</div>
        <div className="result-sub">You got {score}/{Math.min(CLIPS_PER_LEVEL, levelClips.length)} correct</div>
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
        <div className="result-sub">{score}/{Math.min(CLIPS_PER_LEVEL, levelClips.length)} correct</div>
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
  if (!currentFilename) return <div className="card"><p>No clips available for this level yet! Upload audio files to /public/audio/</p></div>;

  return (
    <div className="shadow-game" style={{ height: 'auto', minHeight: '70vh' }}>
      {/* Header */}
      <div className="sg-header">
        <button className="back-btn" onClick={() => { clearAllTimers(); setPhase('levels'); }} style={{ background: 'none', border: 'none', color: T.text, fontSize: 18 }}>←</button>
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
          <div style={{ fontSize: 10, color: T.textMid }}>Q{currentClip + 1}/{Math.min(CLIPS_PER_LEVEL, levelClips.length)}</div>
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

      {/* Letter Blanks — typing & hints appear here (like shadow game) */}
      {!hintUsed && !answered && currentAnswer && (
        <div className="sg-hint-display" aria-label="Anime name letters">
          {(() => {
            const name = currentAnswer;
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

      {/* Reveal Info */}
      {answered && (
        <div className="sg-reveal-info" aria-live="polite">
          <div className={`sg-reveal-name ${wasCorrect ? 'correct' : 'wrong'}`}>
            {wasCorrect ? `✓ ${currentAnswer}` : `✗ Answer: ${currentAnswer}`}
          </div>
          <div className="sg-reveal-next">Next theme in 3s...</div>
        </div>
      )}

      {/* Hint Options (when hint used) — keyboard hides, 4 MCQ options show */}
      {hintUsed && !answered && (
        <div style={{ padding: '12px 14px 10px', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {currentOptions.map((opt, i) => (
            <button key={i} className="option-btn" onClick={() => submitOption(opt)}
              style={{ padding: '12px 14px', fontSize: 14 }}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Keyboard (like shadow game — only when hint NOT used) */}
      {!hintUsed && !answered && (
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

      {/* Action Buttons */}
      {!answered && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 14px 10px' }}>
          {!hintUsed && (
            <button className="power-btn" onClick={submitGuess} style={{ width: '100%', background: 'var(--sg-crimson)', color: 'var(--sg-text)', fontSize: 16, fontWeight: 800, letterSpacing: 2 }}>
              GO
            </button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="power-btn" onClick={doSkip} disabled={spades < SKIP_COST} style={{ flex: 1 }}>
              ⏩ SKIP<br /><span style={{ color: T.gold }}>{SKIP_COST}♠</span>
            </button>
            {!hintUsed && (
              <button className="power-btn" onClick={doHint} disabled={spades < HINT_COST} style={{ flex: 1 }}>
                💡 HINT<br /><span style={{ color: T.gold }}>{HINT_COST}♠</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
