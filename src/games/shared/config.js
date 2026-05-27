// ─── Shared Game Configuration ──────────────────────────────
// Used by all game modes via StageQuizPage component

export const MAIN_LEVELS = [
  { name: "Level 1", tagline: "Even a kid can pass this easily.", timeSeconds: 30, icon: '🟢' },
  { name: "Level 2", tagline: "Now the real challenge begins.", timeSeconds: 28, icon: '🔵' },
  { name: "Level 3", tagline: "Only true anime fans can survive.", timeSeconds: 25, icon: '🟠' },
  { name: "Level 4", tagline: "This level destroys fake anime experts.", timeSeconds: 20, icon: '🔴' },
  { name: "Level 5", tagline: "The ultimate test for anime legends.", timeSeconds: 15, icon: '⚫' },
];

export const STAGES_PER_LEVEL = 10;
export const QUESTIONS_PER_STAGE = 10;

// Star thresholds (based on correct answers out of 10)
export const getStars = (correct) => {
  if (correct >= 10) return 3;
  if (correct >= 8) return 2;
  if (correct >= 5) return 1;
  return 0;
};

// Minimum stars to unlock next stage
export const MIN_STARS_TO_UNLOCK = 1;

// Stars needed to unlock next main level (25 stars from 10 stages, max 30 possible)
export const STARS_TO_UNLOCK_LEVEL = 25;

// XP rewards based on stars earned
export const getStageXP = (stars) => {
  if (stars >= 3) return 30;
  if (stars >= 2) return 20;
  if (stars >= 1) return 10;
  return 0;
};

// Spade rewards per correct answer with streak bonuses
export const SPADES_PER_CORRECT = 5;
export const SPADES_STREAK_3 = 10;   // 3 back-to-back correct
export const SPADES_STREAK_5 = 20;   // 5 back-to-back correct
export const SPADES_STAGE_BONUS = 50; // Bonus for clearing a stage
export const SPADES_WRONG_PENALTY = -5; // Penalty for wrong answer

// Hint cost
export const HINT_COST = 100;
// Shuffle cost (Word Ninja only)
export const SHUFFLE_COST = 50;

// Legacy rewards (kept for backward compatibility)
export const STAGE_REWARD = 50;
export const MAIN_LEVEL_REWARD = 100;
export const ALL_LEVELS_REWARD = 1000;
