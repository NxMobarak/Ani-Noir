import { QUESTIONS_PER_STAGE, MAIN_LEVELS, HINT_COST, SHUFFLE_COST } from '../shared/config';
import { shuffle } from '../../utils/helpers';
import StageQuizPage from '../../components/StageQuizPage';
import CircularTimer from '../../components/CircularTimer';
import WordNinjaTiles from '../../components/WordNinjaTiles';
import T from '../../constants/theme';
import level1 from './questions/level1';
import level2 from './questions/level2';
import level3 from './questions/level3';
import level4 from './questions/level4';
import level5 from './questions/level5';

const POOLS = [level1, level2, level3, level4, level5];

export default function WordNinjaPage({ spades, setSpades, showFeedback }) {
  const getQuestionPool = (mainLevelIdx, stageIdx) => {
    const pool = POOLS[mainLevelIdx] || [];
    const start = stageIdx * QUESTIONS_PER_STAGE;
    const stageQuestions = pool.slice(start, start + QUESTIONS_PER_STAGE);
    return shuffle(stageQuestions).map(q => ({ ...q, type: 'anagram' }));
  };

  const renderQuestion = ({ q, qIndex, questions, progress, timeLeft, maxTime, score, combo, streak, answered, hintRevealed, currentMainLevel, currentStage, submitAnagram, doHint, doShuffle, scrambled, spades: sp }) => (
    <div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '2px 0' }}>
        <span style={{ fontSize: 12, color: T.textMid }}>{MAIN_LEVELS[currentMainLevel].name} · S{currentStage+1} · Q{qIndex+1}/{questions.length}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#22c55e' }}>✓ {score}</span>
          {streak >= 3 && <span className="combo-badge">🔥 {streak}x</span>}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <CircularTimer timeLeft={timeLeft} maxTime={maxTime} />
      </div>
      <div className="card" key={qIndex}>
        <div className="question-text question-enter">
          {q.text}
        </div>
        <WordNinjaTiles scrambled={scrambled} onSolve={submitAnagram} hintRevealed={hintRevealed} hint={q.hint} answered={answered} correctAnswer={q.answer} />
      </div>
      <div className="power-btns">
        <button className="power-btn" onClick={doShuffle} disabled={sp < SHUFFLE_COST || answered}>
          🔀 SHUFFLE<br /><span style={{ color: T.gold }}>{SHUFFLE_COST}♠</span>
        </button>
        {q.hint && (
          <button className="power-btn" onClick={doHint} disabled={sp < HINT_COST || hintRevealed || answered}>
            💡 HINT<br /><span style={{ color: T.gold }}>{HINT_COST}♠</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <StageQuizPage
      mode="word-ninja"
      getQuestionPool={getQuestionPool}
      spades={spades}
      setSpades={setSpades}
      showFeedback={showFeedback}
      renderQuestion={renderQuestion}
    />
  );
}
