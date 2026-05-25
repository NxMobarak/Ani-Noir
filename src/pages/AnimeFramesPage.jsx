import T from '../constants/theme';
import { shuffle } from '../utils/helpers';
import { ANIME_FRAMES_QUESTIONS } from '../constants/questions';
import { MAIN_LEVELS, QUESTIONS_PER_STAGE } from '../questions/index';
import StageQuizPage from '../components/StageQuizPage';
import CircularTimer from '../components/CircularTimer';

export default function AnimeFramesPage({ spades, setSpades, showFeedback }) {
  const getQuestionPool = (mainLevelIdx, stageIdx) => {
    const levelNum = mainLevelIdx + 1;
    const pool = ANIME_FRAMES_QUESTIONS.filter(q => q.level === levelNum);
    const start = stageIdx * QUESTIONS_PER_STAGE;
    const stageQuestions = pool.slice(start, start + QUESTIONS_PER_STAGE);
    return shuffle(stageQuestions).map(q => {
      const correctAnswer = q.options[q.correct];
      const shuffledOptions = shuffle([...q.options]);
      return { ...q, options: shuffledOptions, correct: shuffledOptions.indexOf(correctAnswer) };
    });
  };


  const renderQuestion = ({ q, qIndex, questions, progress, timeLeft, maxTime, score, combo, answered, selectedOption, correctOption, hintRevealed, currentMainLevel, currentStage, submitMCQ, doHint, doSkip, spades: sp, skipUsed }) => (
    <div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      <div className="quiz-header">
        <span style={{ fontSize: 12, color: T.textMid }}>{MAIN_LEVELS[currentMainLevel].name} · S{currentStage+1} · Q{qIndex+1}/{questions.length}</span>
        <CircularTimer timeLeft={timeLeft} maxTime={maxTime} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13 }}>✓ {score}</span>
          {combo >= 3 && <span className="combo-badge">🔥 {combo}x</span>}
        </div>
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
          <button className="power-btn" onClick={doHint} disabled={sp < 30 || hintRevealed || answered}>
            💡 HINT<br /><span style={{ color: T.gold }}>30♠</span>
          </button>
        )}
        <button className="power-btn" onClick={doSkip} disabled={sp < 50 || skipUsed || answered}>
          ⏩ SKIP<br /><span style={{ color: T.gold }}>50♠</span>
        </button>
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
