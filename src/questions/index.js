import level1mcq from './level1_mcq';
import level1ana from './level1_anagram';
import level2mcq from './level2_mcq';
import level2ana from './level2_anagram';
import level3mcq from './level3_mcq';
import level3ana from './level3_anagram';
import level4mcq from './level4_mcq';
import level4ana from './level4_anagram';
import level5mcq from './level5_mcq';
import level5ana from './level5_anagram';
import { emojiQuestions } from './emoji_mcq';

export { emojiQuestions };

// Combine all questions with level and type
export const questionBank = [
  ...level1mcq.map(q => ({ ...q, level: 1, type: 'mcq' })),
  ...level1ana.map(q => ({ ...q, level: 1, type: 'anagram' })),
  ...level2mcq.map(q => ({ ...q, level: 2, type: 'mcq' })),
  ...level2ana.map(q => ({ ...q, level: 2, type: 'anagram' })),
  ...level3mcq.map(q => ({ ...q, level: 3, type: 'mcq' })),
  ...level3ana.map(q => ({ ...q, level: 3, type: 'anagram' })),
  ...level4mcq.map(q => ({ ...q, level: 4, type: 'mcq' })),
  ...level4ana.map(q => ({ ...q, level: 4, type: 'anagram' })),
  ...level5mcq.map(q => ({ ...q, level: 5, type: 'mcq' })),
  ...level5ana.map(q => ({ ...q, level: 5, type: 'anagram' }))
];

export const levels = [
  { name: "Genin", minCorrect: 3, timeSeconds: 30, reward: 10 },
  { name: "Chunin", minCorrect: 4, timeSeconds: 30, reward: 20 },
  { name: "Jonin", minCorrect: 4, timeSeconds: 25, reward: 30 },
  { name: "Elite Shinobi", minCorrect: 5, timeSeconds: 20, reward: 50 },
  { name: "Kage", minCorrect: 5, timeSeconds: 15, reward: 100 }
];

export function getRandomQuestions(level, count = 5) {
  const pool = questionBank.filter(q => q.level === level);
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}