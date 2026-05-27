import { QUESTIONS_PER_STAGE, MAIN_LEVELS, HINT_COST } from '../shared/config';
import { shuffle } from '../../utils/helpers';
import StageQuizPage from '../../components/StageQuizPage';
import CircularTimer from '../../components/CircularTimer';
import T from '../../constants/theme';
import level1 from './questions/level1';
import level2 from './questions/level2';
import level3 from './questions/level3';
import level4 from './questions/level4';
import level5 from './questions/level5';

const POOLS = [level1, level2, level3, level4, level5];

export default function AnimeQuizPage({ spades, setSpades, showFeedback }) {
  const getQuestionPool = (mainLevelIdx, stageIdx) => {
    const pool = POOLS[mainLevelIdx] || [];
    const start = stageIdx * QUESTIONS_PER_STAGE;
    const stageQuestions = pool.slice(start, start + QUESTIONS_PER_STAGE);
    return shuffle(stageQuestions);
  };

  const renderQuestion = ({ q, qIndex, questions, progress, timeLeft, maxTime, score, combo, streak, answered, selectedOption, correctOption, hintRevealed, currentMainLevel, currentStage, submitMCQ, doHint, spades: sp }) => {
    // When hint is revealed, disable/hide one wrong option
    let disabledIdx = null;
    if (hintRevealed) {
      const wrongIndices = q.options.map((_, i) => i).filter(i => i !== q.correct);
      disabledIdx = wrongIndices[qIndex % wrongIndices.length];
    }

    return (
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
          <div className="question-text question-enter" style={{ fontSize: 15, color: T.text }}>
            {q.text}
          </div>
          <div className="question-options-enter">
          {q.options.map((opt, idx) => {
            const isDisabled = disabledIdx === idx && !answered;
            let cls = 'option-btn';
            if (answered) {
              if (idx === correctOption) cls += ' correct';
              else if (idx === selectedOption) cls += ' wrong';
            }
            return (
              <button
                key={`${qIndex}-${idx}`}
                className={cls}
                onClick={() => submitMCQ(idx)}
                disabled={answered || isDisabled}
                style={isDisabled ? { opacity: 0.25, textDecoration: 'line-through', pointerEvents: 'none' } : {}}
              >
                {opt}
              </button>
            );
          })}
          </div>
        </div>
        <div className="power-btns">
          <button className="power-btn" onClick={doHint} disabled={sp < HINT_COST || hintRevealed || answered}>
            💡 HINT<br /><span style={{ color: T.gold }}>{HINT_COST}♠</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <StageQuizPage
      mode="quiz"
      getQuestionPool={getQuestionPool}
      spades={spades}
      setSpades={setSpades}
      showFeedback={showFeedback}
      renderQuestion={renderQuestion}
    />
  );
}
