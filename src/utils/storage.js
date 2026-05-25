import { safeGet, safeSet } from './dataValidator';

// ─── Settings helpers ────────────────────────────────────────
export const getSettings = () => {
  return safeGet('ani_settings', { sfx: true, music: true, vibration: false });
};

export const saveSettings = (s) => safeSet('ani_settings', s);

// ─── Leaderboard helpers ────────────────────────────────────
export const getLeaderboard = () => safeGet('ani_leaderboard', {});
export const saveLeaderboard = (lb) => safeSet('ani_leaderboard', lb);
export const getBestScore = (mode, levelIdx) => {
  const lb = getLeaderboard();
  return lb[`${mode}_${levelIdx}`] ?? null;
};
export const updateBestScore = (mode, levelIdx, score, total) => {
  const lb = getLeaderboard();
  const key = `${mode}_${levelIdx}`;
  const cur = lb[key];
  if (cur === undefined || score > cur.score) lb[key] = { score, total, date: new Date().toLocaleDateString() };
  saveLeaderboard(lb);
};

// ─── Stage Progress helpers ─────────────────────────────────
export const getStageProgress = (mode) => {
  try {
    const raw = localStorage.getItem(`ani_stages_${mode}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return parsed;
  } catch { return {}; }
};
export const saveStageProgress = (mode, data) => safeSet(`ani_stages_${mode}`, data);

// ─── Watchlist helpers ──────────────────────────────────────
export const getWatchlist = () => {
  const list = safeGet('ani_watchlist', []);
  if (!Array.isArray(list)) return [];
  return list.filter(item => item && typeof item === 'object' && item.mal_id && item.title);
};
export const saveWatchlist = (list) => safeSet('ani_watchlist', list);
