import { QUESTIONS_PER_STAGE, MAIN_LEVELS } from '../shared/config';
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

export default function DialogueClashPage({ spades, setSpades, showFeedback }) {
  const getQuestionPool = (mainLevelIdx, stageIdx) => {
    const pool = POOLS[mainLevelIdx] || [];
    const start = stageIdx * QUESTIONS_PER_STAGE;
    const stageQuestions = pool.slice(start, start + QUESTIONS_PER_STAGE);
    return shuffle(stageQuestions);
  };

  const renderQuestion = ({ q, qIndex, questions, progress, timeLeft, maxTime, score, combo, answered, selectedOption, correctOption, hintRevealed, currentMainLevel, currentStage, submitMCQ, doHint, doSkip, spades: sp, skipUsed }) => {
    // When hint is revealed, pick one wrong option to blacken/disable
    let blackenedIdx = null;
    if (hintRevealed) {
      const wrongIndices = q.options.map((_, i) => i).filter(i => i !== q.correct);
      blackenedIdx = wrongIndices[qIndex % wrongIndices.length];
    }

    return (
      <div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '2px 0' }}>
          <span style={{ fontSize: 12, color: T.textMid }}>{MAIN_LEVELS[currentMainLevel].name} · S{currentStage+1} · Q{qIndex+1}/{questions.length}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#22c55e' }}>✓ {score}</span>
            {combo >= 3 && <span className="combo-badge">🔥 {combo}x</span>}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <CircularTimer timeLeft={timeLeft} maxTime={maxTime} />
        </div>
        <div className="card" key={qIndex}>
          <div style={{ fontSize: 11, color: T.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>💬 Who said this?</div>
          <div className="question-text question-enter" style={{ fontSize: 15, fontStyle: 'italic', lineHeight: 1.6, color: T.text }}>
            "{q.text}"
          </div>
          {hintRevealed && q.hint && (
            <div style={{ display: 'none' }}>{q.hint}</div>
          )}
          <div className="question-options-enter">
          {q.options.map((opt, idx) => {
            const isBlackened = blackenedIdx === idx && !answered;
            let cls = 'option-btn';
            if (answered) {
              cls += ' answered-visible';
              if (idx === correctOption) cls += ' correct';
              else if (idx === selectedOption) cls += ' wrong';
            }
            return (
              <button
                key={`${qIndex}-${idx}`}
                className={cls}
                onClick={() => submitMCQ(idx)}
                disabled={answered || isBlackened}
                style={isBlackened ? { opacity: 0.25, textDecoration: 'line-through', pointerEvents: 'none' } : {}}
              >
                {opt}
              </button>
            );
          })}
          </div>
        </div>
        <div className="power-btns">
          <button className="power-btn" onClick={doHint} disabled={sp < 30 || hintRevealed || answered}>
            🚫 ELIMINATE<br /><span style={{ color: T.gold }}>30♠</span>
          </button>
          <button className="power-btn" onClick={doSkip} disabled={sp < 50 || skipUsed || answered}>
            ⏩ SKIP<br /><span style={{ color: T.gold }}>50♠</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <StageQuizPage
      mode="dialogue"
      getQuestionPool={getQuestionPool}
      spades={spades}
      setSpades={setSpades}
      showFeedback={showFeedback}
      renderQuestion={renderQuestion}
    />
  );
}
