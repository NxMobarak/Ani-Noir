import { useState, useEffect, useRef, useCallback } from 'react';
import T from '../constants/theme';
import { shuffle } from '../utils/helpers';
import { useSwipe } from '../utils/swipe';
import { playCorrect, playWrong, playCombo } from '../utils/audio';
import { getStageProgress, saveStageProgress } from '../utils/storage';
import {
  MAIN_LEVELS, STAGES_PER_LEVEL, QUESTIONS_PER_STAGE,
  getStars, MIN_STARS_TO_UNLOCK, STARS_TO_UNLOCK_LEVEL,
  STAGE_REWARD, MAIN_LEVEL_REWARD, ALL_LEVELS_REWARD,
  getStageXP, SPADES_PER_CORRECT, SPADES_STREAK_3, SPADES_STREAK_5,
  SPADES_STAGE_BONUS, SPADES_WRONG_PENALTY, HINT_COST, SHUFFLE_COST
} from '../games/shared/config';
import { addXP, XP_REWARDS } from '../utils/xpSystem';
import CircularTimer from './CircularTimer';
import WordNinjaTiles from './WordNinjaTiles';
import BackButton from './BackButton';
import ResultScreen from './ResultScreen';


export default function StageQuizPage({ mode, getQuestionPool, spades, setSpades, showFeedback, renderQuestion }) {
  const [phase, setPhase] = useState('mainLevels');
  const [selectedMainLevel, setSelectedMainLevel] = useState(null);
  const [currentMainLevel, setCurrentMainLevel] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [maxTime, setMaxTime] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctOption, setCorrectOption] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [stageProgress, setStageProgress] = useState(() => getStageProgress(mode));
  const [scrambled, setScrambled] = useState([]);
  const [stageStartTime, setStageStartTime] = useState(null);
  const [stageElapsed, setStageElapsed] = useState(0);
  const [earnedSpades, setEarnedSpades] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timerRef.current);
    }
    if (timerActive && timeLeft === 0) handleTimeout();
  }, [timerActive, timeLeft]);

  useEffect(() => {
    const q = questions[qIndex];
    if (q?.type === 'anagram') {
      const letters = q.text.replace(/\s/g, '').toUpperCase().split('');
      setScrambled(shuffle(letters));
    }
  }, [qIndex, questions]);


  const isStageUnlocked = (mainIdx, stageIdx) => {
    if (mainIdx === 0 && stageIdx === 0) return true;
    if (stageIdx === 0) {
      return getMainLevelStars(mainIdx - 1) >= STARS_TO_UNLOCK_LEVEL;
    }
    const prevKey = `${mainIdx}_${stageIdx - 1}`;
    return stageProgress[prevKey] && stageProgress[prevKey].stars >= MIN_STARS_TO_UNLOCK;
  };

  const isMainLevelUnlocked = (mainIdx) => {
    if (mainIdx === 0) return true;
    return getMainLevelStars(mainIdx - 1) >= STARS_TO_UNLOCK_LEVEL;
  };

  const getMainLevelStars = (mainIdx) => {
    let total = 0;
    for (let s = 0; s < STAGES_PER_LEVEL; s++) {
      const key = `${mainIdx}_${s}`;
      if (stageProgress[key]) total += stageProgress[key].stars;
    }
    return total;
  };

  const getCompletedStages = (mainIdx) => {
    let count = 0;
    for (let s = 0; s < STAGES_PER_LEVEL; s++) {
      const key = `${mainIdx}_${s}`;
      if (stageProgress[key] && stageProgress[key].stars >= 1) count++;
    }
    return count;
  };

  const startStage = (mainIdx, stageIdx) => {
    if (!isStageUnlocked(mainIdx, stageIdx)) return;
    const qs = getQuestionPool(mainIdx, stageIdx);
    if (!qs || !qs.length) { showFeedback('No questions available for this stage!'); return; }
    setCurrentMainLevel(mainIdx);
    setCurrentStage(stageIdx);
    setQuestions(qs);
    setQIndex(0);
    setScore(0);
    setCombo(0);
    setStreak(0);
    setHintRevealed(false);
    setAnswered(false);
    setSelectedOption(null);
    setCorrectOption(null);
    setStageStartTime(Date.now());
    setStageElapsed(0);
    setEarnedSpades(0);
    setEarnedXP(0);
    const t = MAIN_LEVELS[mainIdx].timeSeconds;
    setTimeLeft(t);
    setMaxTime(t);
    setTimerActive(true);
    setPhase('playing');
  };

  const clearTimer = () => { clearInterval(timerRef.current); setTimerActive(false); };

  const handleTimeout = () => {
    clearTimer();
    setAnswered(true);
    const q = questions[qIndex];
    if (q?.type === 'mcq' || q?.correct !== undefined) setCorrectOption(q.correct);
    playWrong();
    setStreak(0);
    // Wrong answer penalty
    setSpades(s => Math.max(0, s + SPADES_WRONG_PENALTY));
    setEarnedSpades(prev => prev + SPADES_WRONG_PENALTY);
    showFeedback(`Time's up! ${SPADES_WRONG_PENALTY}♠`);
    setTimeout(() => advance(false, score), 1200);
  };

  // Calculate spade reward based on streak
  const getStreakReward = (currentStreak) => {
    if (currentStreak >= 5 && currentStreak % 5 === 0) return SPADES_STREAK_5;
    if (currentStreak >= 3 && currentStreak % 3 === 0) return SPADES_STREAK_3;
    return SPADES_PER_CORRECT;
  };

  const advance = (wasCorrect, currentScore) => {
    const nextIdx = qIndex + 1;
    if (nextIdx < questions.length) {
      setQIndex(nextIdx);
      setHintRevealed(false);
      setAnswered(false);
      setSelectedOption(null);
      setCorrectOption(null);
      const t = MAIN_LEVELS[currentMainLevel].timeSeconds;
      setTimeLeft(t);
      setMaxTime(t);
      setTimerActive(true);
    } else {
      const fs = currentScore;
      const stars = getStars(fs);
      const passed = stars >= MIN_STARS_TO_UNLOCK;
      const key = `${currentMainLevel}_${currentStage}`;
      const updated = { ...stageProgress };
      if (!updated[key] || stars > updated[key].stars) {
        updated[key] = { stars };
      }
      if (passed) {
        const wasAlreadyPassed = stageProgress[key] && stageProgress[key].stars >= MIN_STARS_TO_UNLOCK;
        if (!wasAlreadyPassed) {
          // Stage clear bonus spades
          setSpades(s => s + SPADES_STAGE_BONUS);
          setEarnedSpades(prev => prev + SPADES_STAGE_BONUS);
          // XP based on stars
          const xpReward = getStageXP(stars);
          addXP(xpReward);
          setEarnedXP(prev => prev + xpReward);
        }
        let newTotalStars = 0;
        for (let s = 0; s < STAGES_PER_LEVEL; s++) {
          const sk = `${currentMainLevel}_${s}`;
          if (sk === key) newTotalStars += stars;
          else if (updated[sk]) newTotalStars += updated[sk].stars;
        }
        let oldTotalStars = 0;
        for (let s = 0; s < STAGES_PER_LEVEL; s++) {
          const sk = `${currentMainLevel}_${s}`;
          if (stageProgress[sk]) oldTotalStars += stageProgress[sk].stars;
        }
        if (newTotalStars >= STARS_TO_UNLOCK_LEVEL && oldTotalStars < STARS_TO_UNLOCK_LEVEL) {
          setSpades(s => s + MAIN_LEVEL_REWARD);
          setEarnedSpades(prev => prev + MAIN_LEVEL_REWARD);
          addXP(XP_REWARDS.LEVEL_COMPLETE);
          setEarnedXP(prev => prev + XP_REWARDS.LEVEL_COMPLETE);
          showFeedback(`${MAIN_LEVELS[currentMainLevel].name} mastered! +${MAIN_LEVEL_REWARD} spades!`);
        }
        let allLevelsMastered = true;
        for (let ml = 0; ml < MAIN_LEVELS.length; ml++) {
          let mlStars = 0;
          for (let s = 0; s < STAGES_PER_LEVEL; s++) {
            const sk = `${ml}_${s}`;
            if (sk === key) mlStars += stars;
            else if (updated[sk]) mlStars += updated[sk].stars;
          }
          if (mlStars < STARS_TO_UNLOCK_LEVEL) { allLevelsMastered = false; break; }
        }
        let wasAllLevelsMastered = true;
        for (let ml = 0; ml < MAIN_LEVELS.length; ml++) {
          let mlStars = 0;
          for (let s = 0; s < STAGES_PER_LEVEL; s++) {
            const sk = `${ml}_${s}`;
            if (stageProgress[sk]) mlStars += stageProgress[sk].stars;
          }
          if (mlStars < STARS_TO_UNLOCK_LEVEL) { wasAllLevelsMastered = false; break; }
        }
        if (allLevelsMastered && !wasAllLevelsMastered) {
          setSpades(s => s + ALL_LEVELS_REWARD);
          setEarnedSpades(prev => prev + ALL_LEVELS_REWARD);
          showFeedback(`ALL levels mastered! +${ALL_LEVELS_REWARD} spades!`);
        }
      }
      setStageProgress(updated);
      saveStageProgress(mode, updated);
      setFinalScore(fs);
      setStageElapsed(Math.round((Date.now() - stageStartTime) / 1000));
      clearTimer();
      setPhase('result');
    }
  };


  const submitMCQ = (optIdx) => {
    if (answered) return;
    clearTimer();
    const q = questions[qIndex];
    const isCorrect = optIdx === q.correct;
    setSelectedOption(optIdx);
    setCorrectOption(q.correct);
    setAnswered(true);
    if (isCorrect) {
      const newStreak = streak + 1;
      setScore(s => s + 1);
      setStreak(newStreak);
      setCombo(c => c + 1);
      playCorrect();
      // Spade reward based on streak
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
      setTimeout(() => advance(true, score + 1), 1000);
    } else {
      setStreak(0);
      setCombo(0);
      playWrong();
      // Wrong answer penalty
      setSpades(s => Math.max(0, s + SPADES_WRONG_PENALTY));
      setEarnedSpades(prev => prev + SPADES_WRONG_PENALTY);
      showFeedback(`Wrong! ${SPADES_WRONG_PENALTY}♠`);
      setTimeout(() => advance(false, score), 1000);
    }
  };

  const submitAnagram = (ans) => {
    if (answered) return;
    clearTimer();
    const q = questions[qIndex];
    const norm = ans.trim().toUpperCase().replace(/[^A-Z]/g, '');
    const correct = q.answer.toUpperCase().replace(/[^A-Z]/g, '');
    const isCorrect = norm === correct;
    setAnswered(true);
    if (isCorrect) {
      const newStreak = streak + 1;
      setScore(s => s + 1);
      setStreak(newStreak);
      setCombo(c => c + 1);
      playCorrect();
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
      setTimeout(() => advance(true, score + 1), 1200);
    } else {
      setStreak(0);
      setCombo(0);
      playWrong();
      setSpades(s => Math.max(0, s + SPADES_WRONG_PENALTY));
      setEarnedSpades(prev => prev + SPADES_WRONG_PENALTY);
      showFeedback(`Wrong! Answer: ${q.answer} · ${SPADES_WRONG_PENALTY}♠`);
      setTimeout(() => advance(false, score), 1400);
    }
  };

  const doHint = () => {
    if (spades < HINT_COST || hintRevealed || answered) return;
    setSpades(s => s - HINT_COST);
    setHintRevealed(true);
    showFeedback(`Hint revealed! -${HINT_COST}♠`);
  };

  const doShuffle = () => {
    if (spades < SHUFFLE_COST || answered) return;
    const q = questions[qIndex];
    const letters = q.text.replace(/\s/g, '').toUpperCase().split('');
    setScrambled(shuffle(letters));
    setSpades(s => s - SHUFFLE_COST);
    showFeedback(`Shuffled! -${SHUFFLE_COST}♠`);
  };

  const shareResult = () => {
    const lvlName = MAIN_LEVELS[currentMainLevel].name;
    const stars = getStars(finalScore);
    const starStr = Array(3).fill(0).map((_, i) => i < stars ? '\u2B50' : '\u2606').join('');
    const text = `AniNoir ${mode} - ${lvlName} Stage ${currentStage + 1}: ${finalScore}/${QUESTIONS_PER_STAGE} ${starStr} #AniNoir`;
    if (navigator.share) {
      navigator.share({ title: 'AniNoir', text }).catch(()=>{});
    } else {
      navigator.clipboard?.writeText(text);
      showFeedback('Copied to clipboard!');
    }
  };


  // ─── PHASE 1: Main Levels ───────────────────────────────────
  if (phase === 'mainLevels') {
    return (
      <section aria-label="Level Selection">
        <BackButton />
        <div className="card" style={{ marginBottom: 14 }}>
          <h2 className="card-title" style={{ color: T.rose }}>
            {mode === 'quiz' ? '🧠 ANIME QUIZ' : mode === 'word-ninja' ? '🔤 WORD NINJA' : mode === 'emoji' ? '🎯 EMOJI WARS' : mode === 'shadow' ? '🕵️ ANIME SHADOW' : mode === 'frames' ? '🖼️ ANIME MOMENTS' : '💬 DIALOGUE CLASH'}
          </h2>
          <p style={{ fontSize: 13, color: T.textMid }}>5 main levels, {STAGES_PER_LEVEL} stages each. Earn stars to progress!</p>
          <p style={{ fontSize: 12, color: T.gold, marginTop: 4 }}>Need {STARS_TO_UNLOCK_LEVEL}★ per level to unlock next · Need {MIN_STARS_TO_UNLOCK}★ per stage</p>
        </div>
        {MAIN_LEVELS.map((ml, idx) => {
          const unlocked = isMainLevelUnlocked(idx);
          const completed = getCompletedStages(idx);
          const stars = getMainLevelStars(idx);
          const prevStars = idx > 0 ? getMainLevelStars(idx - 1) : 0;
          return (
            <button key={idx} className="level-card" onClick={() => { if (unlocked) { setSelectedMainLevel(idx); setPhase('stages'); } }}
              style={{ opacity: unlocked ? 1 : 0.5, cursor: unlocked ? 'pointer' : 'not-allowed' }}
              aria-disabled={!unlocked}
              aria-label={`${ml.name} - ${unlocked ? `${stars} stars, ${completed} stages passed` : 'Locked'}`}>
              <span className="level-icon" aria-hidden="true">{unlocked ? ml.icon : '🔒'}</span>
              <div className="level-info">
                <div className="level-name">{ml.name}</div>
                <div className="level-meta">{unlocked ? ml.tagline : `Need ${STARS_TO_UNLOCK_LEVEL}★ in ${MAIN_LEVELS[idx-1]?.name} (${prevStars}/${STARS_TO_UNLOCK_LEVEL})`}</div>
                {unlocked && stars > 0 && (
                  <div className="level-best">{stars}★ · {completed}/{STAGES_PER_LEVEL} stages passed</div>
                )}
              </div>
              <span style={{ color: T.textDim, fontSize: 20 }} aria-hidden="true">{unlocked ? '›' : ''}</span>
            </button>
          );
        })}
      </section>
    );
  }

  // ─── PHASE 2: Stages List ───────────────────────────────────
  if (phase === 'stages') {
    const ml = MAIN_LEVELS[selectedMainLevel];
    const totalStars = getMainLevelStars(selectedMainLevel);
    const nextLevelName = MAIN_LEVELS[selectedMainLevel + 1]?.name;
    return (
      <section aria-label={`${ml.name} Stages`}>
        <button className="btn btn-secondary" style={{ marginBottom: 12, fontSize: 13 }} onClick={() => setPhase('mainLevels')}>
          ← Back to Levels
        </button>
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ color: T.gold }}>{ml.icon} {ml.name}</div>
          <p style={{ fontSize: 12, color: T.textMid }}>{ml.tagline} · {ml.timeSeconds}s per question</p>
          <div style={{ marginTop: 10, padding: '10px 12px', background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>★ {totalStars} / {STARS_TO_UNLOCK_LEVEL}</span>
              {nextLevelName && <span style={{ fontSize: 11, color: totalStars >= STARS_TO_UNLOCK_LEVEL ? T.success : T.textMid }}>{totalStars >= STARS_TO_UNLOCK_LEVEL ? `${nextLevelName} unlocked!` : `${STARS_TO_UNLOCK_LEVEL - totalStars}★ to unlock ${nextLevelName}`}</span>}
            </div>
            <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (totalStars / STARS_TO_UNLOCK_LEVEL) * 100)}%`, background: totalStars >= STARS_TO_UNLOCK_LEVEL ? T.success : `linear-gradient(90deg, ${T.gold}, ${T.rose})`, borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
          </div>
        </div>
        {Array.from({ length: STAGES_PER_LEVEL }, (_, stageIdx) => {
          const key = `${selectedMainLevel}_${stageIdx}`;
          const stageDone = stageProgress[key];
          const unlocked = isStageUnlocked(selectedMainLevel, stageIdx);
          const starsEarned = stageDone ? stageDone.stars : 0;
          const starDisplay = Array(3).fill(0).map((_, i) => i < starsEarned ? '\u2605' : '\u2606').join('');
          return (
            <button key={stageIdx} className="level-card" onClick={() => startStage(selectedMainLevel, stageIdx)}
              style={{ opacity: unlocked ? 1 : 0.5, cursor: unlocked ? 'pointer' : 'not-allowed' }}>
              <span className="level-icon" style={{ fontSize: 18 }}>{unlocked ? (stageDone && starsEarned >= MIN_STARS_TO_UNLOCK ? '✓' : `${stageIdx + 1}`) : '🔒'}</span>
              <div className="level-info">
                <div className="level-name">Stage {stageIdx + 1}</div>
                <div className="level-meta">
                  {!unlocked ? `Need ${MIN_STARS_TO_UNLOCK}★ on Stage ${stageIdx}` : stageDone ? `${starDisplay}` : `${QUESTIONS_PER_STAGE} questions · ${ml.timeSeconds}s`}
                </div>
              </div>
              <span style={{ color: T.textDim, fontSize: 20 }}>{unlocked ? '›' : ''}</span>
            </button>
          );
        })}
      </section>
    );
  }


  // ─── PHASE 4: Result ────────────────────────────────────────
  if (phase === 'result') {
    const stars = getStars(finalScore);
    const passed = stars >= MIN_STARS_TO_UNLOCK;
    const hasNext = currentStage < STAGES_PER_LEVEL - 1;

    const buttons = [];
    buttons.push({ label: '\u2190 Stages', onClick: () => { setSelectedMainLevel(currentMainLevel); setPhase('stages'); }, variant: 'secondary' });
    if (passed && hasNext) {
      buttons.push({ label: 'Next Stage \u2192', onClick: () => startStage(currentMainLevel, currentStage + 1), variant: 'primary' });
    }
    if (passed && !hasNext && currentMainLevel < MAIN_LEVELS.length - 1) {
      buttons.push({ label: 'Next Level \u2192', onClick: () => { setSelectedMainLevel(currentMainLevel + 1); setPhase('stages'); }, variant: 'primary' });
    }
    if (!passed) {
      buttons.push({ label: 'Retry', onClick: () => startStage(currentMainLevel, currentStage), variant: 'primary' });
    }

    const accuracyPct = Math.round((finalScore / QUESTIONS_PER_STAGE) * 100);
    const mins = Math.floor(stageElapsed / 60);
    const secs = stageElapsed % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    return (
      <ResultScreen
        passed={passed}
        title={passed ? 'Stage Cleared!' : 'Stage Failed'}
        subtitle={`You scored ${finalScore}/${QUESTIONS_PER_STAGE}`}
        stars={stars}
        timeTaken={timeStr}
        accuracy={`${accuracyPct}%`}
        spadesEarned={earnedSpades}
        xpEarned={earnedXP}
        onShare={shareResult}
        buttons={buttons}
      />
    );
  }

  // ─── PHASE 3: Playing ───────────────────────────────────────
  const q = questions[qIndex];
  if (!q) return <div className="card"><p>Loading...</p></div>;
  const progress = ((qIndex) / questions.length) * 100;

  if (renderQuestion) {
    return renderQuestion({
      q, qIndex, questions, progress, timeLeft, maxTime, score, combo, streak,
      answered, selectedOption, correctOption, hintRevealed, currentMainLevel,
      currentStage, submitMCQ, submitAnagram, doHint, doShuffle,
      scrambled, spades
    });
  }

  return (
    <div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '2px 0' }}>
        <span style={{ fontSize: 12, color: T.textMid }}>{MAIN_LEVELS[currentMainLevel].name} · S{currentStage+1} · Q{qIndex+1}/{questions.length}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: T.success }}>✓ {score}</span>
          {streak >= 3 && <span className="combo-badge">🔥 {streak}x</span>}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <CircularTimer timeLeft={timeLeft} maxTime={maxTime} />
      </div>
      <div className="card" key={qIndex}>
        <div className="question-text question-enter">
          {q.type === 'anagram' ? q.text : q.text}
        </div>
        {q.type === 'anagram' ? (
          <WordNinjaTiles scrambled={scrambled} onSolve={submitAnagram} hintRevealed={hintRevealed} hint={q.hint} answered={answered} correctAnswer={q.answer} />
        ) : (
          <div className="question-options-enter">
            {hintRevealed && q.hint && (
              <div style={{ marginBottom: 12, fontSize: 13, color: T.gold }}>Hint: {q.hint}</div>
            )}
            {q.options.map((opt, idx) => {
              let cls = 'option-btn';
              if (answered) {
                cls += ' answered-visible';
                if (idx === correctOption) cls += ' correct';
                else if (idx === selectedOption) cls += ' wrong';
              }
              return (
                <button key={`${qIndex}-${idx}`} className={cls} onClick={() => submitMCQ(idx)} disabled={answered}>{opt}</button>
              );
            })}
          </div>
        )}
      </div>
      <div className="power-btns">
        {q.type === 'anagram' && (
          <button className="power-btn" onClick={doShuffle} disabled={spades < SHUFFLE_COST || answered}>
            🔀 SHUFFLE<br /><span style={{ color: T.gold }}>{SHUFFLE_COST}♠</span>
          </button>
        )}
        {q.hint && (
          <button className="power-btn" onClick={doHint} disabled={spades < HINT_COST || hintRevealed || answered}>
            💡 HINT<br /><span style={{ color: T.gold }}>{HINT_COST}♠</span>
          </button>
        )}
      </div>
    </div>
  );
}
