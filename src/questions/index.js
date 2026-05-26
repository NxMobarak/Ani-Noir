// ─── Legacy compatibility layer ─────────────────────────────
// SurvivalPage and DailyPage still import from here.
// All actual question data now lives in src/games/*/questions/

import level1mcq from '../games/anime-quiz/questions/level1';
import level2mcq from '../games/anime-quiz/questions/level2';
import level3mcq from '../games/anime-quiz/questions/level3';
import level4mcq from '../games/anime-quiz/questions/level4';
import level5mcq from '../games/anime-quiz/questions/level5';
import level1ana from '../games/word-ninja/questions/level1';
import level2ana from '../games/word-ninja/questions/level2';
import level3ana from '../games/word-ninja/questions/level3';
import level4ana from '../games/word-ninja/questions/level4';
import level5ana from '../games/word-ninja/questions/level5';

// Re-export shared config
export {
  MAIN_LEVELS, STAGES_PER_LEVEL, QUESTIONS_PER_STAGE,
  getStars, MIN_STARS_TO_UNLOCK, MIN_CORRECT_TO_PASS,
  STARS_TO_UNLOCK_LEVEL, STAGE_REWARD, MAIN_LEVEL_REWARD, ALL_LEVELS_REWARD
} from '../games/shared/config';

// Deduplicate helper
function dedup(arr) {
  const seen = new Set();
  return arr.filter(q => {
    const key = q.text || q.answer || '';
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Combined question bank for Survival/Daily modes
export const questionBank = [
  ...dedup(level1mcq).map(q => ({ ...q, level: 1, type: 'mcq' })),
  ...dedup(level1ana).map(q => ({ ...q, level: 1, type: 'anagram' })),
  ...dedup(level2mcq).map(q => ({ ...q, level: 2, type: 'mcq' })),
  ...dedup(level2ana).map(q => ({ ...q, level: 2, type: 'anagram' })),
  ...dedup(level3mcq).map(q => ({ ...q, level: 3, type: 'mcq' })),
  ...dedup(level3ana).map(q => ({ ...q, level: 3, type: 'anagram' })),
  ...dedup(level4mcq).map(q => ({ ...q, level: 4, type: 'mcq' })),
  ...dedup(level4ana).map(q => ({ ...q, level: 4, type: 'anagram' })),
  ...dedup(level5mcq).map(q => ({ ...q, level: 5, type: 'mcq' })),
  ...dedup(level5ana).map(q => ({ ...q, level: 5, type: 'anagram' })),
];

// Legacy support
export const levels = [
  { name: "Genin", minCorrect: 3, timeSeconds: 30, reward: 10 },
  { name: "Chunin", minCorrect: 4, timeSeconds: 30, reward: 20 },
  { name: "Jonin", minCorrect: 4, timeSeconds: 25, reward: 30 },
  { name: "Shinobi", minCorrect: 5, timeSeconds: 20, reward: 50 },
  { name: "Kage", minCorrect: 5, timeSeconds: 15, reward: 100 },
];

export function getRandomQuestions(level, count = 5) {
  const pool = questionBank.filter(q => q.level === level);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
