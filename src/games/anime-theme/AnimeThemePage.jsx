import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import T from '../../constants/theme';
import { playCorrect, playWrong } from '../../utils/audio';
import { addXP, XP_REWARDS } from '../../utils/xpSystem';
import BackButton from '../../components/BackButton';
import '../../styles/shadow-quiz.css';

// Audio files are in /public/audio/ with format: l{level}-{number}-{answer-with-hyphens}.mp3 or .m4a
// Example: l1-01-naruto.mp3, l2-05-attack-on-titan.m4a

const LEVEL_NAMES = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];
const CLIPS_PER_LEVEL = 10;
const AUDIO_PLAY_DURATION = 10;
const TIMER_TOTAL = 30;
const SKIP_COST = 50;
const MAX_SKIPS = 3;
const PASS_THRESHOLD = 8;
const STORAGE_KEY = 'ani_theme_progress';
const CLIPS_KEY = 'ani_theme_clips';

// Parse filename to extract answer
// l1-01-naruto.mp3 → "Naruto"
// l2-03-attack-on-titan.m4a → "Attack On Titan"
function parseFilename(filename) {
  const withoutExt = filename.replace(/\.(mp3|m4a)$/, '');
  const parts = withoutExt.split('-');
  const answerParts = parts.slice(2);
  return answerParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

// Parse level from filename
function parseLevel(filename) {
  const match = filename.match(/^l(\d+)-/);
  return match ? parseInt(match[1], 10) : 1;
}

// Generate 4 MCQ options (1 correct + 3 wrong)
function generateOptions(correctAnswer, allAnswers) {
  const others = allAnswers.filter(a => a !== correctAnswer);
  const shuffled = others.sort(() => Math.random() - 0.5);
  const wrongOptions = shuffled.slice(0, 3);
  const options = [...wrongOptions, correctAnswer].sort(() => Math.random() - 0.5);
  return options;
}

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
  const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
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

  // Memoize options so they don't reshuffle on every re-render
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
    setAnswered(false);
    setWasCorrect(null);
    setSelectedOption(null);
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
      handleWrong(null);
    }
  }, [timeLeft, answered, phase]);

  useEffect(() => {
    if (phase === 'playing' && !answered) {
      startClip();
    }
    return () => clearAllTimers();
  }, [phase, currentClip]);

  const handleWrong = (selected) => {
    clearAllTimers();
    setAnswered(true);
    setWasCorrect(false);
    setSelectedOption(selected);
    playWrong();
    showFeedback(`Wrong! Answer: ${currentAnswer}`);
    setTimeout(() => advanceToNext(), 2500);
  };

  const handleCorrect = (selected) => {
    clearAllTimers();
    setAnswered(true);
    setWasCorrect(true);
    setSelectedOption(selected);
    playCorrect();

    const elapsed = TIMER_TOTAL - timeLeft;
    let earnedStars = 1;
    if (elapsed <= 10) earnedStars = 3;
    else if (elapsed <= 20) earnedStars = 2;
    setTotalStars(s => s + earnedStars);
    setScore(s => s + 1);
    showFeedback(`Correct! +${earnedStars} star${earnedStars > 1 ? 's' : ''}`);
    setTimeout(() => advanceToNext(), 2000);
  };

  const submitOption = (opt) => {
    if (answered) return;
    if (opt === currentAnswer) {
      handleCorrect(opt);
    } else {
      handleWrong(opt);
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
    setTimeout(() => advanceToNext(), 800);
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
    setTotalStars(0);
    setPhase('playing');
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

  // ─── Playing (MCQ) ────────────────────────────────────────
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
          {audioPlaying ? 'Playing...' : 'Audio ended — Pick your answer!'}
        </div>
      </div>

      {/* MCQ Options */}
      {!answered && (
        <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {currentOptions.map((opt, i) => (
            <button
              key={i}
              className="option-btn"
              onClick={() => submitOption(opt)}
              style={{
                padding: '14px 16px',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 12,
                border: `1px solid ${T.border}`,
                background: T.card,
                color: T.text,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ color: T.teal, marginRight: 10, fontWeight: 800 }}>{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Reveal after answer */}
      {answered && (
        <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {currentOptions.map((opt, i) => {
            const isCorrect = opt === currentAnswer;
            const isSelected = opt === selectedOption;
            let bg = T.card;
            let borderColor = T.border;
            if (isCorrect) { bg = 'rgba(16, 185, 129, 0.15)'; borderColor = 'rgba(16, 185, 129, 0.6)'; }
            else if (isSelected && !isCorrect) { bg = 'rgba(239, 68, 68, 0.15)'; borderColor = 'rgba(239, 68, 68, 0.6)'; }

            return (
              <div
                key={i}
                style={{
                  padding: '14px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 12,
                  border: `2px solid ${borderColor}`,
                  background: bg,
                  color: T.text,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  <span style={{ color: T.teal, marginRight: 10, fontWeight: 800 }}>{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </span>
                {isCorrect && <span style={{ fontSize: 18 }}>✓</span>}
                {isSelected && !isCorrect && <span style={{ fontSize: 18 }}>✗</span>}
              </div>
            );
          })}
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 12, color: T.textDim }}>Next in 2s...</div>
          </div>
        </div>
      )}

      {/* Skip Button */}
      {!answered && (
        <div style={{ padding: '0 14px 10px' }}>
          <button className="power-btn" onClick={doSkip} disabled={spades < SKIP_COST}
            style={{ width: '100%', padding: '12px', fontSize: 13 }}>
            ⏩ SKIP <span style={{ color: T.gold }}>{SKIP_COST}♠</span>
          </button>
        </div>
      )}
    </div>
  );
}
