// ─── Settings helpers ────────────────────────────────────────
export const getSettings = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('ani_settings') || '{}');
    return { sfx: stored.sfx !== false, music: stored.music !== false, vibration: stored.vibration === true };
  } catch { return { sfx: true, music: true, vibration: false }; }
};

export const saveSettings = (s) => localStorage.setItem('ani_settings', JSON.stringify(s));

// ─── Leaderboard helpers ────────────────────────────────────
export const getLeaderboard = () => { try { return JSON.parse(localStorage.getItem('ani_leaderboard') || '{}'); } catch { return {}; } };
export const saveLeaderboard = (lb) => localStorage.setItem('ani_leaderboard', JSON.stringify(lb));
export const getBestScore = (mode, levelIdx) => { const lb = getLeaderboard(); return lb[`${mode}_${levelIdx}`] ?? null; };
export const updateBestScore = (mode, levelIdx, score, total) => {
  const lb = getLeaderboard();
  const key = `${mode}_${levelIdx}`;
  const cur = lb[key];
  if (cur === undefined || score > cur.score) lb[key] = { score, total, date: new Date().toLocaleDateString() };
  saveLeaderboard(lb);
};

// ─── Stage Progress helpers ─────────────────────────────────
export const getStageProgress = (mode) => { try { return JSON.parse(localStorage.getItem(`ani_stages_${mode}`) || '{}'); } catch { return {}; } };
export const saveStageProgress = (mode, data) => localStorage.setItem(`ani_stages_${mode}`, JSON.stringify(data));

// ─── Watchlist helpers ──────────────────────────────────────
export const getWatchlist = () => { try { return JSON.parse(localStorage.getItem('ani_watchlist') || '[]'); } catch { return []; } };
export const saveWatchlist = (list) => localStorage.setItem('ani_watchlist', JSON.stringify(list));
