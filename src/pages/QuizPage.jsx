import { questionBank, QUESTIONS_PER_STAGE } from '../questions/index';
import { shuffle } from '../utils/helpers';
import StageQuizPage from '../components/StageQuizPage';

export default function QuizPage({ spades, setSpades, showFeedback, mcqOnly, anagramOnly, mode }) {
  const getQuestionPool = (mainLevelIdx, stageIdx) => {
    const levelNum = mainLevelIdx + 1;
    let pool = questionBank.filter(q => q.level === levelNum);
    if (mcqOnly) pool = pool.filter(q => q.type === 'mcq');
    if (anagramOnly) pool = pool.filter(q => q.type === 'anagram');
    const start = stageIdx * QUESTIONS_PER_STAGE;
    const stageQuestions = pool.slice(start, start + QUESTIONS_PER_STAGE);
    return shuffle(stageQuestions);
  };

  return (
    <StageQuizPage
      mode={mode}
      getQuestionPool={getQuestionPool}
      spades={spades}
      setSpades={setSpades}
      showFeedback={showFeedback}
    />
  );
}
