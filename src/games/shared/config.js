// ─── Shared Game Configuration ──────────────────────────────
// Used by all 9 game modes via StageQuizPage component

export const MAIN_LEVELS = [
  { name: "Genin", tagline: "Even a kid can pass this easily.", timeSeconds: 30, icon: '🟢' },
  { name: "Chunin", tagline: "Now the real challenge begins.", timeSeconds: 28, icon: '🔵' },
  { name: "Jonin", tagline: "Only true anime fans can survive.", timeSeconds: 25, icon: '🟠' },
  { name: "Shinobi", tagline: "This level destroys fake anime experts.", timeSeconds: 20, icon: '🔴' },
  { name: "Kage", tagline: "The ultimate test for anime legends.", timeSeconds: 15, icon: '⚫' },
];

export const STAGES_PER_LEVEL = 20;
export const QUESTIONS_PER_STAGE = 5;

// Star thresholds
export const getStars = (correct) => {
  if (correct >= 5) return 3;
  if (correct >= 4) return 2;
  if (correct >= 2) return 1;
  return 0;
};

// Minimum stars to unlock next stage (need 2 stars = 4 correct)
export const MIN_STARS_TO_UNLOCK = 2;
export const MIN_CORRECT_TO_PASS = 4;

// Stars needed to unlock next main level (50 total stars from 20 stages)
export const STARS_TO_UNLOCK_LEVEL = 50;

// Rewards
export const STAGE_REWARD = 5;
export const MAIN_LEVEL_REWARD = 100;
export const ALL_LEVELS_REWARD = 1000;
