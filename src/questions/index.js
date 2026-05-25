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

// ─── New 10-Stage System ─────────────────────────────────────
// 5 Main Levels, each with 10 stages of 5 questions
// Stars: 2/5 = 1 star, 4/5 = 2 stars, 5/5 = 3 stars
// Must complete all 10 stages to unlock next main level
// Rewards: +5 spades per stage, +100 spades per main level completion, +1000 for completing all 5

export const MAIN_LEVELS = [
  { name: "Genin", tagline: "Even a kid can pass this easily.", timeSeconds: 30, icon: '🟢' },
  { name: "Chunin", tagline: "Now the real challenge begins.", timeSeconds: 28, icon: '🔵' },
  { name: "Jonin", tagline: "Only true anime fans can survive.", timeSeconds: 25, icon: '🟠' },
  { name: "Shinobi", tagline: "This level destroys fake anime experts.", timeSeconds: 20, icon: '🔴' },
  { name: "Kage", tagline: "The ultimate test for anime legends.", timeSeconds: 15, icon: '⚫' },
];

export const STAGES_PER_LEVEL = 10;
export const QUESTIONS_PER_STAGE = 5;

// Star thresholds
export const getStars = (correct) => {
  if (correct >= 5) return 3;
  if (correct >= 4) return 2;
  if (correct >= 2) return 1;
  return 0;
};

// Minimum stars to pass a stage (at least 1 star = 2 correct)
export const MIN_CORRECT_TO_PASS = 2;

// Rewards
export const STAGE_REWARD = 5; // spades per stage
export const MAIN_LEVEL_REWARD = 100; // spades for completing all 10 stages in a main level
export const ALL_LEVELS_REWARD = 1000; // spades for completing all 5 main levels

// Legacy support
export const levels = [
  { name: "Genin", minCorrect: 3, timeSeconds: 30, reward: 10 },
  { name: "Chunin", minCorrect: 4, timeSeconds: 30, reward: 20 },
  { name: "Jonin", minCorrect: 4, timeSeconds: 25, reward: 30 },
  { name: "Shinobi", minCorrect: 5, timeSeconds: 20, reward: 50 },
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
