// ─── XP Rank System (Naruto-themed) ─────────────────────────
// Users earn XP by playing games. Their rank progresses through 10 Naruto ranks.

import { safeGet, safeSet } from './dataValidator';

export const XP_RANKS = [
  { name: "Genin", minXP: 0, icon: "🌱", color: "#22c55e" },
  { name: "Chunin", minXP: 500, icon: "⚔️", color: "#3b82f6" },
  { name: "Jonin", minXP: 1500, icon: "🔥", color: "#f59e0b" },
  { name: "Shinobi", minXP: 3000, icon: "🥷", color: "#8b5cf6" },
  { name: "Anbu", minXP: 5000, icon: "🎭", color: "#6366f1" },
  { name: "Sannin", minXP: 8000, icon: "🐍", color: "#ec4899" },
  { name: "Kage", minXP: 12000, icon: "👑", color: "#f43f5e" },
  { name: "Jinchuriki", minXP: 18000, icon: "🦊", color: "#ef4444" },
  { name: "Sage", minXP: 25000, icon: "🧘", color: "#14b8a6" },
  { name: "Otsutsuki", minXP: 35000, icon: "👁️", color: "#a855f7" },
];

// XP rewards for different actions
export const XP_REWARDS = {
  STAGE_COMPLETE: 20,
  STAGE_PERFECT: 50,      // 5/5 correct
  LEVEL_COMPLETE: 200,
  DAILY_CHALLENGE: 30,
  SURVIVAL_PER_5: 40,
  COMBO_BONUS: 10,
};

// Get current XP from localStorage
export const getXP = () => safeGet('ani_xp', 0);

// Save XP to localStorage
export const saveXP = (xp) => safeSet('ani_xp', xp);

// Add XP and return new total
export const addXP = (amount) => {
  const current = getXP();
  const newXP = current + amount;
  saveXP(newXP);
  return newXP;
};

// Get current rank based on XP
export const getRank = (xp) => {
  let rank = XP_RANKS[0];
  for (let i = XP_RANKS.length - 1; i >= 0; i--) {
    if (xp >= XP_RANKS[i].minXP) {
      rank = XP_RANKS[i];
      break;
    }
  }
  return rank;
};

// Get rank index (0-9)
export const getRankIndex = (xp) => {
  for (let i = XP_RANKS.length - 1; i >= 0; i--) {
    if (xp >= XP_RANKS[i].minXP) return i;
  }
  return 0;
};

// Get progress to next rank (0 to 1)
export const getRankProgress = (xp) => {
  const currentIdx = getRankIndex(xp);
  if (currentIdx >= XP_RANKS.length - 1) return 1; // Max rank
  const currentMin = XP_RANKS[currentIdx].minXP;
  const nextMin = XP_RANKS[currentIdx + 1].minXP;
  return (xp - currentMin) / (nextMin - currentMin);
};

// Get next rank (or null if max)
export const getNextRank = (xp) => {
  const currentIdx = getRankIndex(xp);
  if (currentIdx >= XP_RANKS.length - 1) return null;
  return XP_RANKS[currentIdx + 1];
};

// Get XP needed for next rank
export const getXPToNextRank = (xp) => {
  const nextRank = getNextRank(xp);
  if (!nextRank) return 0;
  return nextRank.minXP - xp;
};
