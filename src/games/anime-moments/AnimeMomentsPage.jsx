import T from '../../constants/theme';
import { shuffle } from '../../utils/helpers';
import { MAIN_LEVELS, QUESTIONS_PER_STAGE, HINT_COST } from '../shared/config';
import StageQuizPage from '../../components/StageQuizPage';
import CircularTimer from '../../components/CircularTimer';
import level1 from './questions/level1';
import level2 from './questions/level2';
import level3 from './questions/level3';
import level4 from './questions/level4';
import level5 from './questions/level5';

const POOLS = [level1, level2, level3, level4, level5];

export default function AnimeMomentsPage({ spades, setSpades, showFeedback }) {
  const getQuestionPool = (mainLevelIdx, stageIdx) => {
    const pool = POOLS[mainLevelIdx] || [];
    const start = stageIdx * QUESTIONS_PER_STAGE;
    const stageQuestions = pool.slice(start, start + QUESTIONS_PER_STAGE);
    return shuffle(stageQuestions).map(q => {
      const correctAnswer = q.options[q.correct];
      const shuffledOptions = shuffle([...q.options]);
      return { ...q, options: shuffledOptions, correct: shuffledOptions.indexOf(correctAnswer) };
    });
  };

  const renderQuestion = ({ q, qIndex, questions, progress, timeLeft, maxTime, score, combo, streak, answered, selectedOption, correctOption, hintRevealed, currentMainLevel, currentStage, submitMCQ, doHint, spades: sp }) => (
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
        <div style={{ fontSize: 11, color: T.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>SCENE DESCRIPTION</div>
        <div className="question-text question-enter" style={{ fontSize: 15, fontStyle: 'italic', color: T.text }}>
          "{q.text}"
        </div>
        {hintRevealed && q.hint && (
          <div style={{ marginBottom: 12, fontSize: 13, color: T.gold, textAlign:'center' }}>Hint: {q.hint}</div>
        )}
        <div className="question-options-enter">
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
      </div>
      <div className="power-btns">
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
      mode="frames"
      getQuestionPool={getQuestionPool}
      spades={spades}
      setSpades={setSpades}
      showFeedback={showFeedback}
      renderQuestion={renderQuestion}
    />
  );
}
