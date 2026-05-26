// ─── Legacy compatibility layer ─────────────────────────────
// SurvivalPage imports ALL_EMOJI_QUESTIONS from here.
// Actual data now lives in src/games/emoji-wars/questions/

import level1Emoji from '../games/emoji-wars/questions/level1';
import level2Emoji from '../games/emoji-wars/questions/level2';
import level3Emoji from '../games/emoji-wars/questions/level3';
import level4Emoji from '../games/emoji-wars/questions/level4';
import level5Emoji from '../games/emoji-wars/questions/level5';

import level1Frames from '../games/anime-moments/questions/level1';
import level2Frames from '../games/anime-moments/questions/level2';
import level3Frames from '../games/anime-moments/questions/level3';
import level4Frames from '../games/anime-moments/questions/level4';
import level5Frames from '../games/anime-moments/questions/level5';

// ─── Anime Frames Questions ─────────────────────────────────
export const ANIME_FRAMES_QUESTIONS = [
  ...level1Frames,
  ...level2Frames,
  ...level3Frames,
  ...level4Frames,
  ...level5Frames,
];

// ─── Emoji Questions ────────────────────────────────────────
export const ALL_EMOJI_QUESTIONS = [
  ...level1Emoji,
  ...level2Emoji,
  ...level3Emoji,
  ...level4Emoji,
  ...level5Emoji,
];
