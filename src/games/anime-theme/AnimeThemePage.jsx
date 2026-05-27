import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import T from '../../constants/theme';
import { playCorrect, playWrong, playCombo } from '../../utils/audio';
import { addXP } from '../../utils/xpSystem';
import BackButton from '../../components/BackButton';
import ResultScreen from '../../components/ResultScreen';
import CircularTimer from '../../components/CircularTimer';
import '../../styles/shadow-quiz.css';

const LEVEL_NAMES = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];
const CLIPS_PER_LEVEL = 10;
const AUDIO_PLAY_DURATION = 10;
const TIMER_TOTAL = 30;
const HINT_COST = 100;
const STARS_TO_UNLOCK = 2;
const STORAGE_KEY = 'ani_theme_progress';
const CLIPS_KEY = 'ani_theme_clips';

// Spade rewards
const SPADES_PER_CORRECT = 5;
const SPADES_STREAK_3 = 10;
const SPADES_STREAK_5 = 20;
const SPADES_LEVEL_BONUS = 50;
const SPADES_WRONG_PENALTY = -5;

// Star thresholds
function getStars(correct) {
  if (correct >= 10) return 3;
  if (correct >= 8) return 2;
  if (correct >= 5) return 1;
  return 0;
}

function getStageXP(stars) {
  if (stars >= 3) return 30;
  if (stars >= 2) return 20;
  if (stars >= 1) return 10;
  return 0;
}

// ─── Helper Functions ────────────────────────────────────────
function parseFilename(filename) {
  const withoutExt = filename.replace(/\.(mp3|m4a)$/, '');
  const parts = withoutExt.split('-');
  return parts.slice(2).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function parseLevel(filename) {
  const match = filename.match(/^l(\d+)-/);
  return match ? parseInt(match[1], 10) : 1;
}

function generateOptions(correctAnswer, allAnswers) {
  const others = allAnswers.filter(a => a !== correctAnswer);
  const shuffled = [...others].sort(() => Math.random() - 0.5);
  return [...shuffled.slice(0, 3), correctAnswer].sort(() => Math.random() - 0.5);
}

function getClipsForLevel(level, allClips) {
  return allClips.filter(f => parseLevel(f) === level).sort().slice(0, CLIPS_PER_LEVEL);
}

function getProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveProgress(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function getClipsManifest() {
  try {
    const stored = localStorage.getItem(CLIPS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [
    'l1-01-my-hero-academia.m4a', 'l1-02-one-piece.m4a', 'l1-03-hunter-x-hunter.m4a',
    'l1-04-your-name.m4a', 'l1-05-tokyo-ghoul.m4a', 'l1-06-naruto-shippuden.m4a',
    'l1-07-fairy-tail.m4a', 'l1-08-one-punch-man.m4a', 'l1-09-demon-slayer.m4a',
    'l1-10-parasyte-the-maxim.m4a',
    'l2-01-kaguya-sama-love-is-war.m4a', 'l2-02-tower-of-god.m4a', 'l2-03-dragon-ball-z.m4a',
    'l2-04-jojo-bizarre-adventure.m4a', 'l2-05-domestic-girlfriend.m4a',
    'l2-06-wotakoi-love-hard-for-otaku.m4a', 'l2-07-tokyo-revengers.m4a',
    'l2-08-code-geass.m4a', 'l2-09-jujutsu-kaisen.m4a', 'l2-10-neon-genesis-evangelion.m4a',
    'l3-01-attack-on-titan.m4a', 'l3-02-blue-exorcist.m4a', 'l3-03-overlord.m4a',
    'l3-04-lucky-star.m4a', 'l3-05-hyouka.m4a', 'l3-06-attack-on-titan.m4a',
    'l3-07-ya-boy-kongming.m4a', 'l3-08-the-seven-deadly-sins.m4a',
    'l3-09-the-promised-neverland.m4a', 'l3-10-violet-evergarden.m4a',
    'l4-01-assassination-classroom.m4a', 'l4-02-teasing-master-takagi-san.m4a',
    'l4-03-dr.-stone.m4a', 'l4-04-bna-brand-new-animal.m4a', 'l4-05-stein-gates.m4a',
    'l4-06-spy-x-family.m4a', 'l4-07-spice-and-wolf.m4a',
    'l4-08-uzaki-chan-wants-to-hang-out.m4a', 'l4-09-black-clover.m4a',
    'l4-10-plastic-memories.m4a',
    'l5-01-food-wars.m4a', 'l5-02-beyond-the-boundary.m4a',
    'l5-03-the-quintessential-quintuplets.m4a', 'l5-04-free.m4a',
    'l5-05-samurai-champloo.m4a', 'l5-06-kokoro-connect.m4a',
    'l5-07-assassins-pride.m4a', 'l5-08-bleach.m4a', 'l5-09-gintama.m4a',
    'l5-10-fairy-tail.m4a',
  ];
}

// ─── Audio Bars Component ────────────────────────────────────
const AudioBars = memo(function AudioBars({ playing }) {
  return (
    <div className={`audio-bars ${!playing ? 'audio-bars-stopped' : ''}`}>
      <div className="bar" /><div className="bar" /><div className="bar" />
      <div className="bar" /><div className="bar" />
    </div>
  );
});

// ─── Main Component ──────────────────────────────────────────
export default function AnimeThemePage({ spades, setSpades, showFeedback }) {
  const [phase, setPhase] = useState('levels');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentClip, setCurrentClip] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [hiddenOption, setHiddenOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [progress, setProgress] = useState(getProgress);
  const [earnedSpades, setEarnedSpades] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);
  const [clips] = useState(getClipsManifest);

  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const audioTimerRef = useRef(null);

  const levelClips = useMemo(() => getClipsForLevel(currentLevel + 1, clips), [currentLevel, clips]);
  const currentFilename = levelClips[currentClip];
  const currentAnswer = currentFilename ? parseFilename(currentFilename) : '';
  const allLevelAnswers = useMemo(() => levelClips.map(f => parseFilename(f)), [levelClips]);

  const [currentOptions, setCurrentOptions] = useState([]);

  // Generate options only when the clip changes
  useEffect(() => {
    if (!currentFilename) {
      setCurrentOptions([]);
      return;
    }
    const answer = parseFilename(currentFilename);
    const answers = levelClips.map(f => parseFilename(f));
    setCurrentOptions(generateOptions(answer, answers));
  }, [currentFilename, levelClips]);

  // Get streak reward
  const getStreakReward = (currentStreak) => {
    if (currentStreak >= 5 && currentStreak % 5 === 0) return SPADES_STREAK_5;
    if (currentStreak >= 3 && currentStreak % 3 === 0) return SPADES_STREAK_3;
    return SPADES_PER_CORRECT;
  };

  // ─── Timer & Audio Management ─────────────────────────────
  const clearAllTimers = useCallback(() => {
    clearInterval(timerRef.current);
    clearTimeout(audioTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const startClip = useCallback(() => {
    setAnswered(false);
    setWasCorrect(null);
    setSelectedOption(null);
    setHintUsed(false);
    setHiddenOption(null);
    setTimeLeft(TIMER_TOTAL);
    setAudioPlaying(true);

    if (currentFilename) {
      const audio = new Audio(`/audio/${currentFilename}`);
      audioRef.current = audio;
      audio.play().catch(() => {});
      audioTimerRef.current = setTimeout(() => {
        audio.pause();
        setAudioPlaying(false);
      }, AUDIO_PLAY_DURATION * 1000);
    } else {
      audioTimerRef.current = setTimeout(() => setAudioPlaying(false), AUDIO_PLAY_DURATION * 1000);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  }, [currentFilename]);

  useEffect(() => {
    if (timeLeft === 0 && !answered && phase === 'playing') handleWrong(null);
  }, [timeLeft, answered, phase]);

  useEffect(() => {
    if (phase === 'playing' && !answered) startClip();
    return () => clearAllTimers();
  }, [phase, currentClip, currentLevel]);

  // ─── Game Logic ───────────────────────────────────────────
  const currentClipRef = useRef(currentClip);
  const scoreRef = useRef(score);
  const progressRef = useRef(progress);
  const streakRef = useRef(streak);
  const earnedSpadesRef = useRef(earnedSpades);
  const earnedXPRef = useRef(earnedXP);
  currentClipRef.current = currentClip;
  scoreRef.current = score;
  progressRef.current = progress;
  streakRef.current = streak;
  earnedSpadesRef.current = earnedSpades;
  earnedXPRef.current = earnedXP;

  const advanceToNext = () => {
    const nextClip = currentClipRef.current + 1;
    if (nextClip >= CLIPS_PER_LEVEL || nextClip >= levelClips.length) {
      const finalScore = scoreRef.current;
      const stars = getStars(finalScore);
      const updated = { ...progressRef.current };
      if (!updated[currentLevel] || finalScore > (updated[currentLevel]?.score || 0)) {
        updated[currentLevel] = { score: finalScore, stars, passed: stars >= 1 };
      }
      if (stars >= 1) {
        const wasAlreadyPassed = progressRef.current[currentLevel] && progressRef.current[currentLevel].stars >= 1;
        if (!wasAlreadyPassed) {
          setSpades(s => s + SPADES_LEVEL_BONUS);
          setEarnedSpades(prev => prev + SPADES_LEVEL_BONUS);
          const xpReward = getStageXP(stars);
          addXP(xpReward);
          setEarnedXP(prev => prev + xpReward);
        }
      }
      setProgress(updated);
      saveProgress(updated);
      setPhase('result');
    } else {
      setCurrentClip(nextClip);
    }
  };

  const handleWrong = (selected) => {
    clearAllTimers();
    setAnswered(true);
    setWasCorrect(false);
    setSelectedOption(selected);
    setStreak(0);
    playWrong();
    setSpades(s => Math.max(0, s + SPADES_WRONG_PENALTY));
    setEarnedSpades(prev => prev + SPADES_WRONG_PENALTY);
    showFeedback(selected ? `Wrong! It was "${currentAnswer}" · ${SPADES_WRONG_PENALTY}♠` : `Time's up! Answer: "${currentAnswer}" · ${SPADES_WRONG_PENALTY}♠`);
    setTimeout(() => advanceToNext(), 2500);
  };

  const handleCorrect = (selected) => {
    clearAllTimers();
    setAnswered(true);
    setWasCorrect(true);
    setSelectedOption(selected);
    playCorrect();

    const newStreak = streak + 1;
    setStreak(newStreak);
    setScore(s => s + 1);

    const reward = getStreakReward(newStreak);
    setSpades(s => s + reward);
    setEarnedSpades(prev => prev + reward);

    if (newStreak >= 5 && newStreak % 5 === 0) {
      playCombo();
      showFeedback(`Correct! 🔥 ${newStreak}x Streak! +${reward}♠`);
    } else if (newStreak >= 3 && newStreak % 3 === 0) {
      playCombo();
      showFeedback(`Correct! 🔥 ${newStreak}x Streak! +${reward}♠`);
    } else {
      showFeedback(`Correct! +${reward}♠`);
    }
    setTimeout(() => advanceToNext(), 2000);
  };

  const submitOption = (opt) => {
    if (answered) return;
    opt === currentAnswer ? handleCorrect(opt) : handleWrong(opt);
  };

  const doHint = () => {
    if (spades < HINT_COST || hintUsed || answered) return;
    setSpades(s => s - HINT_COST);
    setHintUsed(true);
    const wrongOptions = currentOptions.filter(opt => opt !== currentAnswer);
    setHiddenOption(wrongOptions[Math.floor(Math.random() * wrongOptions.length)]);
    showFeedback(`💡 1 wrong option removed! -${HINT_COST}♠`);
  };

  const startLevel = useCallback((levelIdx) => {
    if (levelIdx > 0 && !(progress[levelIdx - 1]?.stars >= STARS_TO_UNLOCK)) return;
    setCurrentLevel(levelIdx);
    setCurrentClip(0);
    setScore(0);
    setStreak(0);
    setEarnedSpades(0);
    setEarnedXP(0);
    setPhase('playing');
  }, [progress]);

  // ─── Level Select ─────────────────────────────────────────
  if (phase === 'levels') {
    return (
      <section className="phase-enter">
        <BackButton />
        <div className="card" style={{ marginBottom: 12 }}>
          <h2 className="card-title" style={{ color: T.teal }}>🎵 ANIME THEME</h2>
          <p style={{ fontSize: 12, color: T.textMid }}>Listen to the opening theme and guess the anime!</p>
          <p style={{ fontSize: 11, color: T.gold, marginTop: 4 }}>10 clips per level · Need {STARS_TO_UNLOCK}★ to unlock next</p>
        </div>
        {LEVEL_NAMES.map((name, idx) => {
          const unlocked = idx === 0 || (progress[idx - 1]?.stars >= STARS_TO_UNLOCK);
          const levelData = progress[idx];
          const hasClips = getClipsForLevel(idx + 1, clips).length > 0;
          const prevStars = idx > 0 ? (progress[idx - 1]?.stars || 0) : 0;
          return (
            <button key={idx} className="level-card level-card-enter" onClick={() => hasClips && unlocked && startLevel(idx)}
              style={{ opacity: unlocked && hasClips ? 1 : 0.5, cursor: unlocked && hasClips ? 'pointer' : 'not-allowed' }}>
              <span className="level-icon">{unlocked ? '🎵' : '🔒'}</span>
              <div className="level-info">
                <div className="level-name">{name}</div>
                <div className="level-meta">
                  {!unlocked ? `Need ${STARS_TO_UNLOCK}★ on ${LEVEL_NAMES[idx-1]} (${prevStars}/${STARS_TO_UNLOCK}★)` : !hasClips ? 'No clips uploaded yet' : levelData ? `Best: ${levelData.score}/10 · ${levelData.stars || 0}★` : '10 audio clips · 30s timer'}
                </div>
              </div>
              <span style={{ color: T.textDim, fontSize: 20 }}>{unlocked && hasClips ? '›' : ''}</span>
            </button>
          );
        })}
      </section>
    );
  }

  // ─── Result ───────────────────────────────────────────────
  if (phase === 'result') {
    const stars = getStars(score);
    const passed = stars >= 1;
    const accuracyPct = Math.round((score / Math.min(CLIPS_PER_LEVEL, levelClips.length)) * 100);
    const buttons = [
      { label: '\u2190 Levels', onClick: () => setPhase('levels'), variant: 'secondary' },
    ];
    if (!passed) buttons.push({ label: 'Retry', onClick: () => startLevel(currentLevel), variant: 'primary' });
    if (passed && currentLevel < 4) buttons.push({ label: 'Next Level \u2192', onClick: () => startLevel(currentLevel + 1), variant: 'primary' });

    return (
      <ResultScreen
        passed={passed}
        title={passed ? 'Level Cleared!' : 'Not Quite!'}
        subtitle={`${score}/${Math.min(CLIPS_PER_LEVEL, levelClips.length)} correct`}
        stars={stars}
        accuracy={`${accuracyPct}%`}
        spadesEarned={earnedSpades}
        xpEarned={earnedXP}
        buttons={buttons}
      />
    );
  }

  // ─── Playing (MCQ) ────────────────────────────────────────
  if (!currentFilename) return <div className="card phase-enter"><p>No clips available for this level yet!</p></div>;

  const progressPct = ((currentClip) / Math.min(CLIPS_PER_LEVEL, levelClips.length)) * 100;

  return (
    <div className="shadow-game question-swap-in" key={currentClip} style={{ height: 'auto', minHeight: '70vh' }}>
      {/* Header */}
      <div className="sg-header">
        <button className="back-btn" onClick={() => { clearAllTimers(); setPhase('levels'); }}
          style={{ background: 'none', border: 'none', color: T.text, fontSize: 18 }}>←</button>
        <div style={{ flex: 1 }}>
          {streak >= 3 && <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: 10 }}>🔥 {streak}x</span>}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.success }}>✓ {score}</div>
      </div>

      {/* Progress Bar */}
      <div style={{ padding: '0 14px 8px' }}>
        <div className="progress-bar" style={{ height: 3 }}>
          <div className={`progress-fill ${audioPlaying ? 'progress-fill-shimmer' : ''}`} style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Timer - Using CircularTimer like Anime Quiz */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', marginBottom: 12 }}>
        <CircularTimer timeLeft={timeLeft} maxTime={TIMER_TOTAL} />
        <div style={{ fontSize: 10, color: T.textMid, marginTop: 4 }}>Q{currentClip + 1}/{Math.min(CLIPS_PER_LEVEL, levelClips.length)}</div>
      </div>

      {/* Audio Visual */}
      <div className={audioPlaying ? 'audio-playing-card' : ''} style={{
        margin: '0 14px', padding: '20px', borderRadius: 16, textAlign: 'center',
        background: audioPlaying ? 'linear-gradient(135deg, rgba(20,184,166,0.12), rgba(139,92,246,0.12))' : T.card,
        border: `1px solid ${audioPlaying ? 'rgba(20,184,166,0.35)' : T.border}`,
        transition: 'all 0.4s cubic-bezier(.4,0,.2,1)',
      }}>
        <AudioBars playing={audioPlaying} />
        <div style={{ fontSize: 12, color: audioPlaying ? T.teal : T.textDim, fontWeight: 600, marginTop: 10, transition: 'color 0.3s' }}>
          {audioPlaying ? 'Listening...' : 'Audio ended — Pick your answer!'}
        </div>
      </div>

      {/* MCQ Options */}
      {!answered && (
        <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {currentOptions.filter(opt => opt !== hiddenOption).map((opt, i) => (
            <button key={opt} className="option-btn" onClick={() => submitOption(opt)}
              style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, borderRadius: 12, animationDelay: `${i * 0.08}s` }}>
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
            const cls = isCorrect ? 'theme-option-correct' : (isSelected && !isCorrect) ? 'theme-option-wrong' : '';
            return (
              <div key={opt} className={cls} style={{
                padding: '14px 16px', fontSize: 14, fontWeight: 600, borderRadius: 12,
                border: `2px solid ${T.border}`, background: T.card, color: T.text,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.3s',
              }}>
                <span>
                  <span style={{ color: T.teal, marginRight: 10, fontWeight: 800 }}>{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </span>
                {isCorrect && <span style={{ fontSize: 16, color: '#22c55e' }}>✓</span>}
                {isSelected && !isCorrect && <span style={{ fontSize: 16, color: '#ef4444' }}>✗</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Hint Button Only */}
      {!answered && (
        <div style={{ padding: '0 14px 10px', display: 'flex', gap: 8 }}>
          {!hintUsed && (
            <button className="power-btn" onClick={doHint} disabled={spades < HINT_COST}
              style={{ flex: 1, padding: '12px', fontSize: 13 }}>
              💡 HINT <span style={{ color: T.gold }}>{HINT_COST}♠</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
