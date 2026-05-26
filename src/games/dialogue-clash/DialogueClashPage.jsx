import { QUESTIONS_PER_STAGE } from '../shared/config';
import { shuffle } from '../../utils/helpers';
import StageQuizPage from '../../components/StageQuizPage';
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

  return (
    <StageQuizPage
      mode="dialogue"
      getQuestionPool={getQuestionPool}
      spades={spades}
      setSpades={setSpades}
      showFeedback={showFeedback}
    />
  );
}
