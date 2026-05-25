import { useState, useEffect, useRef, useCallback } from 'react';
import { questionBank, levels, getRandomQuestions, MAIN_LEVELS, STAGES_PER_LEVEL, QUESTIONS_PER_STAGE, getStars, MIN_CORRECT_TO_PASS, STAGE_REWARD, MAIN_LEVEL_REWARD, ALL_LEVELS_REWARD } from './questions/index';
import level1Frames from './questions/level1_frames';
import level2Frames from './questions/level2_frames';
import level3Frames from './questions/level3_frames';
import level4Frames from './questions/level4_frames';
import level5Frames from './questions/level5_frames';
import level1Emoji from './questions/level1_emoji';
import level2Emoji from './questions/level2_emoji';
import level3Emoji from './questions/level3_emoji';
import level4Emoji from './questions/level4_emoji';
import level5Emoji from './questions/level5_emoji';
import CHARACTER_BIRTHDAYS from './birthdays_data';


// ─── Design tokens ─────────────────────────────────────────
const T = {
  bg: "#07080f",
  surface: "#0e1018",
  card: "#13161f",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.15)",
  rose: "#f43f5e",
  roseGlow: "rgba(244,63,94,0.25)",
  gold: "#f59e0b",
  goldGlow: "rgba(245,158,11,0.2)",
  teal: "#14b8a6",
  tealGlow: "rgba(20,184,166,0.2)",
  violet: "#8b5cf6",
  violetGlow: "rgba(139,92,246,0.2)",
  text: "#f1f5f9",
  textMid: "#94a3b8",
  textDim: "#475569",
  success: "#22c55e",
  error: "#f43f5e",
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}



// ─── Web Audio Sound Effects ────────────────────────────────
const audioCtx = { ctx: null };
function getAudioCtx() {
  if (!audioCtx.ctx) audioCtx.ctx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx.ctx;
}
function playTone(frequency, type, duration, gain = 0.3, delay = 0) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    g.gain.setValueAtTime(gain, ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch {}
}
function playCorrect() {
  playTone(523, 'sine', 0.12, 0.25);
  playTone(659, 'sine', 0.12, 0.25, 0.12);
  playTone(784, 'sine', 0.18, 0.25, 0.24);
}
function playWrong() {
  playTone(220, 'sawtooth', 0.2, 0.2);
  playTone(180, 'sawtooth', 0.2, 0.2, 0.15);
}
function playClick() {
  playTone(880, 'sine', 0.05, 0.1);
}
function playCombo() {
  [523,659,784,1046].forEach((f,i) => playTone(f,'sine',0.1,0.3,i*0.07));
}



// ─── Anime of the Day ───────────────────────────────────────
const ANIME_OF_DAY_LIST = [
  { title: "Fullmetal Alchemist: Brotherhood", genre: "Action/Fantasy", rating: "9.1", desc: "Two brothers use alchemy to find the Philosopher's Stone after a failed human transmutation costs them dearly.", image: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg" },
  { title: "Attack on Titan", genre: "Action/Drama", rating: "9.0", desc: "Humanity lives inside cities surrounded by enormous walls due to the Titans — gigantic humanoid beings.", image: "https://cdn.myanimelist.net/images/anime/1214/117978.jpg" },
  { title: "Death Note", genre: "Psychological/Thriller", rating: "8.6", desc: "A high school student discovers a supernatural notebook that can kill anyone whose name is written in it.", image: "https://cdn.myanimelist.net/images/anime/9/9453.jpg" },
  { title: "Jujutsu Kaisen", genre: "Action/Supernatural", rating: "8.6", desc: "A boy swallows a cursed talisman and joins a school that battles supernatural forces.", image: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg" },
  { title: "Demon Slayer", genre: "Action/Adventure", rating: "8.7", desc: "A young boy becomes a demon slayer after his family is slaughtered and sister turned into a demon.", image: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg" },
  { title: "One Piece", genre: "Adventure/Fantasy", rating: "8.9", desc: "A boy with rubber powers sails the seas to become the King of the Pirates and find the legendary One Piece.", image: "https://cdn.myanimelist.net/images/anime/6/73245.jpg" },
  { title: "Naruto Shippuden", genre: "Action/Adventure", rating: "8.7", desc: "Naruto Uzumaki continues his journey as a ninja, facing powerful enemies and uncovering dark secrets.", image: "https://cdn.myanimelist.net/images/anime/1565/111305.jpg" },
];
const getDailyAnime = () => { const now = new Date(); const ist = new Date(now.getTime() + (5.5*60*60*1000)); const d = Math.floor(ist.getTime()/86400000); return ANIME_OF_DAY_LIST[d%ANIME_OF_DAY_LIST.length]; };


const QUOTES = [
  { text: "It's not the face that makes someone a monster, it's the choices they make with their lives.", char: "Naruto Uzumaki", anime: "Naruto" },
  { text: "People's lives don't end when they die. It ends when they lose faith.", char: "Itachi Uchiha", anime: "Naruto" },
  { text: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.", char: "Himura Kenshin", anime: "Rurouni Kenshin" },
  { text: "If you don't take risks, you can't create a future.", char: "Monkey D. Luffy", anime: "One Piece" },
  { text: "The world's not perfect, but it's there for us trying the best it can.", char: "Edward Elric", anime: "Fullmetal Alchemist" },
  { text: "A lesson without pain is meaningless. That's because no one can gain without sacrificing something.", char: "Edward Elric", anime: "Fullmetal Alchemist" },
  { text: "Fear is not evil. It tells you what your weakness is.", char: "Gildarts Clive", anime: "Fairy Tail" },
  { text: "I'll leave tomorrow's problems to tomorrow's me.", char: "Saitama", anime: "One Punch Man" },
];
const getDailyQuote = () => { const now = new Date(); const ist = new Date(now.getTime() + (5.5*60*60*1000)); const d = Math.floor(ist.getTime()/86400000); return QUOTES[d%QUOTES.length]; };


// ─── Anime Frames Questions (250 total, 50 per level) ───────
const ANIME_FRAMES_QUESTIONS = [
  ...level1Frames,
  ...level2Frames,
  ...level3Frames,
  ...level4Frames,
  ...level5Frames,
];

// ─── Emoji Questions (250 total, 50 per level) ──────────────
const ALL_EMOJI_QUESTIONS = [
  ...level1Emoji,
  ...level2Emoji,
  ...level3Emoji,
  ...level4Emoji,
  ...level5Emoji,
];

// ─── Character Birthdays are imported from ./birthdays_data ─



// ─── Leaderboard helpers ────────────────────────────────────
const getLeaderboard = () => { try { return JSON.parse(localStorage.getItem('ani_leaderboard') || '{}'); } catch { return {}; } };
const saveLeaderboard = (lb) => localStorage.setItem('ani_leaderboard', JSON.stringify(lb));
const getBestScore = (mode, levelIdx) => { const lb = getLeaderboard(); return lb[`${mode}_${levelIdx}`] ?? null; };
const updateBestScore = (mode, levelIdx, score, total) => {
  const lb = getLeaderboard();
  const key = `${mode}_${levelIdx}`;
  const cur = lb[key];
  if (cur === undefined || score > cur.score) lb[key] = { score, total, date: new Date().toLocaleDateString() };
  saveLeaderboard(lb);
};

// ─── Stage Progress helpers ─────────────────────────────────
const getStageProgress = (mode) => { try { return JSON.parse(localStorage.getItem(`ani_stages_${mode}`) || '{}'); } catch { return {}; } };
const saveStageProgress = (mode, data) => localStorage.setItem(`ani_stages_${mode}`, JSON.stringify(data));

// ─── Watchlist helpers ──────────────────────────────────────
const getWatchlist = () => { try { return JSON.parse(localStorage.getItem('ani_watchlist') || '[]'); } catch { return []; } };
const saveWatchlist = (list) => localStorage.setItem('ani_watchlist', JSON.stringify(list));

// ─── Emoji detection helper ─────────────────────────────────
const hasEmoji = (text) => /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27FF}]|[\u{FE00}-\u{FEFF}]/u.test(text);


// ─── NAV ────────────────────────────────────────────────────
const NAV = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'quiz', icon: '🧠', label: 'Quiz' },
  { id: 'anagram', icon: '🔤', label: 'Anime Scrambler' },
  { id: 'emoji', icon: '🎯', label: 'Emoji Quiz' },
  { id: 'shadow', icon: '🕵️', label: 'Guess Shadow' },
  { id: 'frames', icon: '🖼️', label: 'Anime Frames' },
  { id: 'survival', icon: '💀', label: 'Survival' },
  { id: 'daily', icon: '📅', label: 'Daily Challenge' },
  { id: 'search', icon: '🔍', label: 'Anime Search' },
  { id: 'charsearch', icon: '👤', label: 'Character Search' },
  { id: 'watchlist', icon: '📋', label: 'Watchlist' },
  { id: 'news', icon: '📰', label: 'News' },
  { id: 'birthdays', icon: '🎂', label: 'Birthdays' },
  { id: 'about', icon: 'ℹ️', label: 'About' },
];



// ─── CSS ─────────────────────────────────────────────────────
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { background: ${T.bg}; color: ${T.text}; font-family: 'Segoe UI', system-ui, sans-serif; overscroll-behavior: none; }
  button { color: ${T.text}; cursor: pointer; font-family: inherit; }
  input { font-family: inherit; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }

  .app-shell { display: flex; height: 100dvh; margin: 0 auto; position: relative; overflow: hidden; }

  @media (max-width: 768px) {
    .app-shell { max-width: 100%; }
    .desktop-sidebar { display: none; }
  }
  @media (min-width: 769px) {
    .app-shell { max-width: 900px; border-left: 1px solid ${T.border}; border-right: 1px solid ${T.border}; }
    .desktop-sidebar { display: flex; flex-direction: column; width: 240px; background: ${T.surface}; border-right: 1px solid ${T.border}; flex-shrink: 0; overflow-y: auto; }
    .menu-btn { display: none !important; }
    .sidebar-overlay, .sidebar { display: none !important; }
  }

  @keyframes pageIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .page-enter { animation: pageIn 0.25s ease both; }

  .sidebar-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100;backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity 0.3s; }
  .sidebar-overlay.open { opacity:1;pointer-events:all; }
  .sidebar { position:fixed;left:-270px;top:0;bottom:0;width:270px;background:${T.surface};border-right:1px solid ${T.border};z-index:101;transition:left 0.3s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;padding:0 0 20px;overflow-y:auto; }
  .sidebar.open { left:0; }


  .sidebar-header { padding:24px 20px 16px;border-bottom:1px solid ${T.border}; }
  .sidebar-logo { font-size:22px;font-weight:800;letter-spacing:-0.5px;background:linear-gradient(135deg,${T.rose},${T.violet});-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
  .sidebar-tagline { font-size:11px;color:${T.textDim};margin-top:3px;letter-spacing:0.5px;text-transform:uppercase; }
  .sidebar-spades { display:flex;align-items:center;gap:6px;margin-top:10px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);border-radius:20px;padding:5px 12px;width:fit-content;font-size:13px;font-weight:700;color:${T.gold};cursor:pointer; }

  .sidebar-nav { padding:12px 10px;flex:1; }
  .nav-item { display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;border:none;background:transparent;width:100%;text-align:left;font-size:14px;font-weight:500;color:${T.textMid};transition:all 0.2s;margin-bottom:2px; }
  .nav-item:hover { background:rgba(255,255,255,0.05);color:${T.text}; }
  .nav-item.active { background:rgba(244,63,94,0.12);color:${T.rose}; }
  .nav-item .icon { font-size:18px;width:24px;text-align:center; }
  .nav-item .lock-badge { margin-left:auto;font-size:10px;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);color:${T.gold};border-radius:8px;padding:1px 6px; }

  .sidebar-footer { padding:16px 20px;border-top:1px solid ${T.border}; }
  .sidebar-footer-card { border-radius:12px;padding:12px;margin-bottom:10px;text-decoration:none;display:block;color:${T.text};transition:transform 0.2s; }
  .sidebar-footer-card:hover { transform:translateY(-2px); }
  .sidebar-footer-card.yt { background:linear-gradient(135deg,#ff0000,#cc0000);border:1px solid rgba(255,0,0,0.4); }
  .sidebar-footer-card.ig { background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045);border:1px solid rgba(131,58,180,0.4); }
  .sidebar-footer-card-title { font-size:12px;font-weight:700; }
  .sidebar-footer-card-sub { font-size:10px;opacity:0.8;margin-top:2px; }


  .main { flex:1;display:flex;flex-direction:column;overflow:hidden;width:100%;min-width:0; }
  .topbar { display:flex;align-items:center;padding:14px 16px;gap:12px;border-bottom:1px solid ${T.border};background:${T.surface};flex-shrink:0; }
  .menu-btn { background:none;border:1px solid ${T.border};border-radius:10px;padding:8px 10px;font-size:16px;line-height:1;flex-shrink:0; }
  .topbar-title { font-size:16px;font-weight:700;flex:1; }
  .topbar-chips { display:flex;gap:8px; }
  .chip { background:${T.card};border:1px solid ${T.border};border-radius:20px;padding:4px 10px;font-size:12px;font-weight:600;color:${T.textMid};white-space:nowrap;cursor:pointer;transition:all 0.2s; }
  .chip:hover { border-color:${T.gold}; }

  .page { flex:1;overflow-y:auto;padding:16px;-webkit-overflow-scrolling:touch; }

  .card { background:${T.card};border:1px solid ${T.border};border-radius:18px;padding:16px;margin-bottom:12px; }
  .card-title { font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:12px; }

  .btn { border:none;border-radius:12px;padding:12px 20px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;justify-content:center;gap:8px; }
  .btn-primary { background:${T.rose};color:white; }
  .btn-primary:hover { background:#e11d48; }
  .btn-secondary { background:${T.card};border:1px solid ${T.border};color:${T.text}; }
  .btn-secondary:hover { border-color:${T.borderHover}; }
  .btn-full { width:100%; }
  .btn:disabled { opacity:0.4;cursor:not-allowed; }

  .level-card { display:flex;align-items:center;gap:14px;background:${T.card};border:1px solid ${T.border};border-radius:16px;padding:14px 16px;margin-bottom:8px;cursor:pointer;transition:all 0.2s;width:100%;text-align:left; }
  .level-card:hover { border-color:${T.rose};background:rgba(244,63,94,0.06); }
  .level-icon { font-size:24px;width:40px;text-align:center; }
  .level-info { flex:1; }
  .level-name { font-weight:700;font-size:15px; }
  .level-meta { font-size:12px;color:${T.textMid};margin-top:2px; }
  .level-best { font-size:11px;color:${T.gold};margin-top:3px; }


  .quiz-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:8px; }

  .timer-circle { position:relative;width:48px;height:48px;flex-shrink:0; }
  .timer-svg { transform:rotate(-90deg);width:48px;height:48px; }
  .timer-track { fill:none;stroke:${T.border};stroke-width:3; }
  .timer-fill { fill:none;stroke:${T.rose};stroke-width:3;stroke-linecap:round;transition:stroke-dashoffset 1s linear,stroke 0.3s; }
  .timer-text { position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:${T.text}; }
  .timer-text.urgent { color:${T.rose};animation:pulse 0.5s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

  .combo-badge { background:linear-gradient(135deg,${T.gold},#f97316);color:#000;border-radius:20px;padding:3px 10px;font-size:12px;font-weight:800;animation:comboIn 0.3s ease; }
  @keyframes comboIn { from{transform:scale(0.7)} to{transform:scale(1)} }

  .question-text { font-size:18px;font-weight:600;line-height:1.4;margin-bottom:20px; }

  .option-btn { display:block;width:100%;text-align:left;background:${T.surface};border:1.5px solid ${T.border};border-radius:12px;padding:13px 16px;margin-bottom:10px;font-size:14px;cursor:pointer;transition:all 0.15s;color:${T.text}; }
  .option-btn:hover:not(:disabled) { border-color:${T.rose};background:rgba(244,63,94,0.06); }
  .option-btn.correct { border-color:${T.success};background:rgba(34,197,94,0.12);color:${T.success}; }
  .option-btn.wrong { border-color:${T.error};background:rgba(244,63,94,0.12);color:${T.error}; }
  .option-btn.selected { border-color:${T.violet};background:rgba(139,92,246,0.12); }


  .anagram-display { text-align:center;margin:16px 0;padding:16px;background:${T.surface};border-radius:16px;border:1px solid ${T.border}; }
  .tile-pool { display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:14px;min-height:44px; }
  .letter-tile { width:38px;height:44px;background:linear-gradient(145deg,${T.card},${T.surface});border:1.5px solid ${T.rose};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:${T.rose};cursor:pointer;transition:all 0.15s;user-select:none;flex-shrink:0;box-shadow:0 2px 8px rgba(244,63,94,0.15); }
  .letter-tile:hover { transform:translateY(-3px);box-shadow:0 6px 16px rgba(244,63,94,0.3); }
  .letter-tile.used { opacity:0;pointer-events:none;transform:scale(0.8); }
  .answer-slots { display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:44px;margin-bottom:10px; }
  .answer-slot { width:38px;height:44px;background:${T.surface};border:1.5px dashed ${T.border};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:${T.text};cursor:pointer;transition:all 0.15s; }
  .answer-slot.filled { border-style:solid;border-color:${T.violet};background:rgba(139,92,246,0.1); }
  .answer-slot.filled:hover { border-color:${T.rose};background:rgba(244,63,94,0.08); }
  .anagram-actions { display:flex;gap:8px;justify-content:center;margin-top:8px; }

  .power-btns { display:flex;gap:8px;margin-top:12px; }
  .power-btn { flex:1;background:${T.surface};border:1px solid ${T.border};border-radius:10px;padding:9px 6px;font-size:11px;text-align:center;cursor:pointer;color:${T.textMid};transition:all 0.2s; }
  .power-btn:hover:not(:disabled) { border-color:${T.gold};color:${T.gold}; }


  .feedback-toast { position:fixed;top:70px;left:50%;transform:translateX(-50%);background:${T.card};border:1px solid ${T.border};border-radius:40px;padding:10px 20px;font-size:14px;font-weight:600;z-index:200;pointer-events:none;animation:slideDown 0.3s ease;max-width:90vw;text-align:center;white-space:nowrap; }
  @keyframes slideDown { from{opacity:0;transform:translate(-50%,-10px)} to{opacity:1;transform:translate(-50%,0)} }

  .progress-bar { height:4px;background:${T.border};border-radius:2px;overflow:hidden;margin-bottom:14px; }
  .progress-fill { height:100%;background:${T.rose};border-radius:2px;transition:width 0.4s; }

  .search-input-wrap { position:relative;display:flex;gap:8px;margin-bottom:14px; }
  .search-input { flex:1;background:${T.surface};border:1.5px solid ${T.border};border-radius:12px;padding:12px 16px;font-size:14px;color:${T.text};outline:none;transition:border-color 0.2s; }
  .search-input:focus { border-color:${T.rose}; }
  .search-input::placeholder { color:${T.textDim}; }

  .anime-result { display:flex;gap:12px; }
  .anime-poster { width:80px;height:110px;border-radius:10px;object-fit:cover;flex-shrink:0;background:${T.surface}; }
  .anime-info { flex:1; }
  .anime-title { font-size:15px;font-weight:700;margin-bottom:4px;line-height:1.3; }
  .anime-meta { font-size:12px;color:${T.textMid};margin-bottom:6px;display:flex;flex-wrap:wrap;gap:6px; }
  .meta-badge { background:${T.surface};border:1px solid ${T.border};border-radius:6px;padding:2px 8px; }
  .anime-synopsis { font-size:12px;color:${T.textMid};line-height:1.5; }
  .streaming-tag { display:inline-block;background:rgba(20,184,166,0.12);border:1px solid ${T.teal};color:${T.teal};border-radius:8px;padding:4px 10px;font-size:11px;margin:3px;font-weight:600; }


  .watchlist-item { display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid ${T.border}; }
  .watchlist-item:last-child { border-bottom:none; }
  .watchlist-poster { width:40px;height:56px;border-radius:8px;object-fit:cover;background:${T.surface};flex-shrink:0; }

  .news-item { display:flex;gap:12px;padding:12px 0;border-bottom:1px solid ${T.border};cursor:pointer;text-decoration:none;color:${T.text}; }
  .news-item:last-child { border-bottom:none; }
  .news-thumb { width:72px;height:52px;border-radius:8px;object-fit:cover;background:${T.surface};flex-shrink:0; }
  .news-text { flex:1;min-width:0; }
  .news-title { font-size:13px;font-weight:600;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }
  .news-desc { font-size:11px;color:${T.textMid};margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }
  .news-filter-tabs { display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap; }
  .news-tab { background:${T.surface};border:1px solid ${T.border};border-radius:20px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;color:${T.textMid};transition:all 0.2s; }
  .news-tab.active { background:rgba(244,63,94,0.15);border-color:${T.rose};color:${T.rose}; }

  .yt-card { display:flex;gap:12px;text-decoration:none;color:${T.text};padding:12px;background:linear-gradient(135deg,rgba(255,0,0,0.08),rgba(139,92,246,0.08));border-radius:14px;border:1px solid rgba(255,0,0,0.2);transition:all 0.2s; }
  .yt-card:hover { border-color:rgba(255,0,0,0.4);transform:translateY(-2px); }
  .yt-thumb { width:96px;height:64px;border-radius:10px;object-fit:cover;background:${T.surface};flex-shrink:0;border:2px solid #ff0000; }
  .yt-info { flex:1;min-width:0; }
  .yt-title { font-size:13px;font-weight:600;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }
  .yt-sub { font-size:11px;color:#ff4444;margin-top:4px;font-weight:600; }


  .hero-banner { background:linear-gradient(135deg,rgba(244,63,94,0.15),rgba(139,92,246,0.15));border:1px solid rgba(244,63,94,0.2);border-radius:20px;padding:20px;margin-bottom:14px;position:relative;overflow:hidden; }
  .hero-banner::before { content:'';position:absolute;top:-30px;right:-30px;width:120px;height:120px;background:radial-gradient(circle,rgba(244,63,94,0.2),transparent 70%); }
  .hero-greeting { font-size:20px;font-weight:800; }
  .hero-sub { font-size:13px;color:${T.textMid};margin-top:4px; }

  .daily-anime-card { border-radius:16px;overflow:hidden;position:relative;margin-bottom:14px;min-height:160px; }
  .daily-anime-img { width:100%;height:160px;object-fit:cover;display:block; }
  .daily-anime-overlay { position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(7,8,15,0.95));padding:30px 14px 14px; }
  .daily-anime-title { font-size:16px;font-weight:700; }
  .daily-anime-meta { font-size:12px;color:${T.textMid};margin-top:2px; }

  .quote-card { border-left:3px solid ${T.gold};padding-left:14px; }
  .quote-text { font-size:14px;font-style:italic;line-height:1.6;color:${T.text}; }
  .quote-attr { font-size:12px;color:${T.gold};margin-top:8px; }

  .result-screen { text-align:center;padding:30px 0; }
  .result-emoji { font-size:64px;margin-bottom:12px;display:block; }
  .result-title { font-size:24px;font-weight:800;margin-bottom:8px; }
  .result-sub { color:${T.textMid};font-size:15px;margin-bottom:24px; }
  .share-btn { background:linear-gradient(135deg,${T.violet},${T.rose});border:none;border-radius:12px;padding:10px 20px;font-size:13px;font-weight:700;color:white;cursor:pointer;margin-bottom:10px;width:100%; }

  .stat-row { display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid ${T.border}; }
  .stat-row:last-child { border-bottom:none; }
  .stat-label { color:${T.textMid};font-size:13px; }
  .stat-value { font-weight:700;font-size:14px; }

  .shadow-lock { text-align:center;padding:40px 20px; }
  .shadow-silhouette { font-size:72px;filter:grayscale(1) brightness(0.2);margin-bottom:16px;animation:float 3s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }


  @keyframes shimmer { from{background-position:-200%} to{background-position:200%} }
  .skeleton { background:linear-gradient(90deg,${T.card} 25%,${T.surface} 50%,${T.card} 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px; }

  .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);animation:fadeIn 0.2s; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal-content { background:${T.card};border:1px solid ${T.border};border-radius:20px;padding:24px;max-width:380px;width:100%;max-height:80vh;overflow-y:auto; }
  .modal-title { font-size:18px;font-weight:800;margin-bottom:12px; }
  .modal-close { background:none;border:1px solid ${T.border};border-radius:10px;padding:6px 12px;font-size:14px;cursor:pointer;color:${T.textMid}; }

  .survival-lives { display:flex;gap:4px;font-size:20px; }
  .survival-stat { display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700; }
`;



// ─── Circular Timer ─────────────────────────────────────────
function CircularTimer({ timeLeft, maxTime }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, timeLeft / maxTime);
  const offset = circ * (1 - pct);
  const urgent = timeLeft <= 5;
  const stroke = urgent ? T.rose : timeLeft <= 10 ? T.gold : T.teal;
  return (
    <div className="timer-circle">
      <svg className="timer-svg" viewBox="0 0 48 48">
        <circle className="timer-track" cx="24" cy="24" r={r} />
        <circle className="timer-fill" cx="24" cy="24" r={r}
          strokeDasharray={circ} strokeDashoffset={offset} style={{ stroke }} />
      </svg>
      <div className={`timer-text ${urgent ? 'urgent' : ''}`}>{timeLeft}</div>
    </div>
  );
}


// ─── Spades Info Modal ──────────────────────────────────────
function SpadesModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div className="modal-title" style={{ color: T.gold }}>♠ Spades Guide</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.success, marginBottom:8 }}>Earn Spades:</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>+5♠ per stage completed</li>
            <li>+100♠ for completing a main level (all 10 stages)</li>
            <li>+1000♠ for completing ALL 5 main levels</li>
            <li>Combo streaks: +5♠ per 3x combo</li>
            <li>Daily challenges: +30♠</li>
            <li>Survival mode: +100♠ per 5 correct</li>
          </ul>
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:T.rose, marginBottom:8 }}>Spend Spades:</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>Hints: 30♠</li>
            <li>Skips: 50♠</li>
          </ul>
        </div>
      </div>
    </div>
  );
}



// ─── Sidebar Content (shared between mobile and desktop) ────
function SidebarContent({ page, navigate, spades, onSpadesClick }) {
  return (
    <>
      <div className="sidebar-header">
        <div className="sidebar-logo">⚔️ AniNoir</div>
        <div className="sidebar-tagline">Your Anime Universe</div>
        <div className="sidebar-spades" onClick={onSpadesClick}>♠ {spades} Spades</div>
      </div>
      <div className="sidebar-nav">
        {NAV.map(n => (
            <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => navigate(n.id)}>
              <span className="icon">{n.icon}</span>
              {n.label}
            </button>
        ))}
      </div>
      <div className="sidebar-footer">
      </div>
    </>
  );
}



// ─── Anagram Tile Component ─────────────────────────────────
function AnagramTiles({ scrambled, onSolve, hintRevealed, hint, answered, correctAnswer }) {
  const [tiles, setTiles] = useState(() => scrambled.map((l, i) => ({ id: i, letter: l, used: false })));
  const [answer, setAnswer] = useState([]);

  useEffect(() => {
    setTiles(scrambled.map((l, i) => ({ id: i, letter: l, used: false })));
    setAnswer([]);
  }, [scrambled.join('')]);

  const tapTile = (tile) => {
    if (tile.used || answered) return;
    playClick();
    setTiles(t => t.map(x => x.id === tile.id ? { ...x, used: true } : x));
    setAnswer(a => [...a, { tileId: tile.id, letter: tile.letter }]);
  };

  const removeLast = () => {
    if (!answer.length || answered) return;
    const last = answer[answer.length - 1];
    setTiles(t => t.map(x => x.id === last.tileId ? { ...x, used: false } : x));
    setAnswer(a => a.slice(0, -1));
  };

  const clearAll = () => {
    if (answered) return;
    setTiles(t => t.map(x => ({ ...x, used: false })));
    setAnswer([]);
  };

  const submit = () => {
    if (!answer.length || answered) return;
    onSolve(answer.map(a => a.letter).join(''));
  };

  return (
    <div className="anagram-display">
      <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Your Answer</div>
      <div className="answer-slots">
        {answer.length === 0
          ? <div style={{ color: T.textDim, fontSize: 13, alignSelf: 'center' }}>Tap letters below to build the word</div>
          : answer.map((a, i) => (
              <div key={i} className="answer-slot filled" onClick={removeLast} title="Tap to remove last">
                {a.letter}
              </div>
            ))
        }
      </div>
      <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Available Letters</div>
      <div className="tile-pool">
        {tiles.map(tile => (
          <div key={tile.id} className={`letter-tile ${tile.used ? 'used' : ''}`} onClick={() => tapTile(tile)}>
            {tile.letter}
          </div>
        ))}
      </div>
      {hintRevealed && hint && (
        <div style={{ marginBottom: 10, fontSize: 13, color: T.gold }}>💡 {hint}</div>
      )}
      {answered && (
        <div style={{ fontSize: 13, color: T.textMid }}>
          Answer: <span style={{ color: T.success, fontWeight: 700 }}>{correctAnswer}</span>
        </div>
      )}
      <div className="anagram-actions">
        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '8px 12px' }} onClick={removeLast} disabled={!answer.length || answered}>⌫</button>
        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '8px 12px' }} onClick={clearAll} disabled={!answer.length || answered}>Clear</button>
        <button className="btn btn-primary" style={{ flex: 1, fontSize: 13 }} onClick={submit} disabled={!answer.length || answered}>Submit ✓</button>
      </div>
    </div>
  );
}



// ─── StageQuizPage: Reusable 10-Stage System ────────────────
function StageQuizPage({ mode, getQuestionPool, spades, setSpades, showFeedback, renderQuestion }) {
  const [phase, setPhase] = useState('mainLevels'); // mainLevels, stages, playing, result
  const [selectedMainLevel, setSelectedMainLevel] = useState(null);
  const [currentMainLevel, setCurrentMainLevel] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [maxTime, setMaxTime] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [skipUsed, setSkipUsed] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctOption, setCorrectOption] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [stageProgress, setStageProgress] = useState(() => getStageProgress(mode));
  const [scrambled, setScrambled] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timerRef.current);
    }
    if (timerActive && timeLeft === 0) handleTimeout();
  }, [timerActive, timeLeft]);

  useEffect(() => {
    const q = questions[qIndex];
    if (q?.type === 'anagram') {
      const letters = q.text.replace(/\s/g, '').toUpperCase().split('');
      setScrambled(shuffle(letters));
    }
  }, [qIndex, questions]);


  // Helper: is a stage unlocked?
  const isStageUnlocked = (mainIdx, stageIdx) => {
    if (mainIdx === 0 && stageIdx === 0) return true;
    if (stageIdx === 0) {
      // First stage of a main level: need all 10 stages of previous main level
      for (let s = 0; s < STAGES_PER_LEVEL; s++) {
        const key = `${mainIdx - 1}_${s}`;
        if (!stageProgress[key] || stageProgress[key].stars < 1) return false;
      }
      return true;
    }
    // Need previous stage passed
    const prevKey = `${mainIdx}_${stageIdx - 1}`;
    return stageProgress[prevKey] && stageProgress[prevKey].stars >= 1;
  };

  // Helper: is a main level unlocked?
  const isMainLevelUnlocked = (mainIdx) => {
    if (mainIdx === 0) return true;
    for (let s = 0; s < STAGES_PER_LEVEL; s++) {
      const key = `${mainIdx - 1}_${s}`;
      if (!stageProgress[key] || stageProgress[key].stars < 1) return false;
    }
    return true;
  };

  // Helper: count stars for a main level
  const getMainLevelStars = (mainIdx) => {
    let total = 0;
    for (let s = 0; s < STAGES_PER_LEVEL; s++) {
      const key = `${mainIdx}_${s}`;
      if (stageProgress[key]) total += stageProgress[key].stars;
    }
    return total;
  };

  // Helper: count completed stages for a main level
  const getCompletedStages = (mainIdx) => {
    let count = 0;
    for (let s = 0; s < STAGES_PER_LEVEL; s++) {
      const key = `${mainIdx}_${s}`;
      if (stageProgress[key] && stageProgress[key].stars >= 1) count++;
    }
    return count;
  };


  const startStage = (mainIdx, stageIdx) => {
    if (!isStageUnlocked(mainIdx, stageIdx)) return;
    const qs = getQuestionPool(mainIdx, stageIdx);
    if (!qs || !qs.length) { showFeedback('No questions available for this stage!'); return; }
    setCurrentMainLevel(mainIdx);
    setCurrentStage(stageIdx);
    setQuestions(qs);
    setQIndex(0);
    setScore(0);
    setCombo(0);
    setHintRevealed(false);
    setSkipUsed(false);
    setAnswered(false);
    setSelectedOption(null);
    setCorrectOption(null);
    const t = MAIN_LEVELS[mainIdx].timeSeconds;
    setTimeLeft(t);
    setMaxTime(t);
    setTimerActive(true);
    setPhase('playing');
  };

  const clearTimer = () => { clearInterval(timerRef.current); setTimerActive(false); };

  const handleTimeout = () => {
    clearTimer();
    setAnswered(true);
    const q = questions[qIndex];
    if (q?.type === 'mcq' || q?.correct !== undefined) setCorrectOption(q.correct);
    playWrong();
    showFeedback('Time is up!');
    setTimeout(() => advance(false, score), 1200);
  };


  const advance = (wasCorrect, currentScore) => {
    const nextIdx = qIndex + 1;
    if (nextIdx < questions.length) {
      setQIndex(nextIdx);
      setHintRevealed(false);
      setSkipUsed(false);
      setAnswered(false);
      setSelectedOption(null);
      setCorrectOption(null);
      const t = MAIN_LEVELS[currentMainLevel].timeSeconds;
      setTimeLeft(t);
      setMaxTime(t);
      setTimerActive(true);
    } else {
      // Stage complete
      const fs = currentScore;
      const stars = getStars(fs);
      const passed = fs >= MIN_CORRECT_TO_PASS;

      // Save progress
      const key = `${currentMainLevel}_${currentStage}`;
      const updated = { ...stageProgress };
      if (!updated[key] || stars > updated[key].stars) {
        updated[key] = { stars };
      }

      // Award spades for passing
      if (passed) {
        // Check if this is a new completion (not re-play)
        const wasAlreadyPassed = stageProgress[key] && stageProgress[key].stars >= 1;
        if (!wasAlreadyPassed) {
          setSpades(s => s + STAGE_REWARD);
        }

        // Check if all 10 stages of this main level are now complete
        let allStagesDone = true;
        for (let s = 0; s < STAGES_PER_LEVEL; s++) {
          const sk = `${currentMainLevel}_${s}`;
          if (sk === key) { if (stars < 1) { allStagesDone = false; break; } }
          else if (!updated[sk] || updated[sk].stars < 1) { allStagesDone = false; break; }
        }

        // Check if previous state had all stages done
        let wasAllDone = true;
        for (let s = 0; s < STAGES_PER_LEVEL; s++) {
          const sk = `${currentMainLevel}_${s}`;
          if (!stageProgress[sk] || stageProgress[sk].stars < 1) { wasAllDone = false; break; }
        }

        if (allStagesDone && !wasAllDone) {
          setSpades(s => s + MAIN_LEVEL_REWARD);
          showFeedback(`Main level complete! +${MAIN_LEVEL_REWARD} spades!`);
        }

        // Check if ALL 5 main levels are complete
        let allLevelsDone = true;
        for (let ml = 0; ml < MAIN_LEVELS.length; ml++) {
          for (let s = 0; s < STAGES_PER_LEVEL; s++) {
            const sk = `${ml}_${s}`;
            if (sk === key) { if (stars < 1) { allLevelsDone = false; break; } }
            else if (!updated[sk] || updated[sk].stars < 1) { allLevelsDone = false; break; }
          }
          if (!allLevelsDone) break;
        }

        let wasAllLevelsDone = true;
        for (let ml = 0; ml < MAIN_LEVELS.length; ml++) {
          for (let s = 0; s < STAGES_PER_LEVEL; s++) {
            const sk = `${ml}_${s}`;
            if (!stageProgress[sk] || stageProgress[sk].stars < 1) { wasAllLevelsDone = false; break; }
          }
          if (!wasAllLevelsDone) break;
        }

        if (allLevelsDone && !wasAllLevelsDone) {
          setSpades(s => s + ALL_LEVELS_REWARD);
          showFeedback(`ALL levels complete! +${ALL_LEVELS_REWARD} spades!`);
        }
      }

      setStageProgress(updated);
      saveStageProgress(mode, updated);
      setFinalScore(fs);
      clearTimer();
      setPhase('result');
    }
  };


  const submitMCQ = (optIdx) => {
    if (answered) return;
    clearTimer();
    const q = questions[qIndex];
    const isCorrect = optIdx === q.correct;
    setSelectedOption(optIdx);
    setCorrectOption(q.correct);
    setAnswered(true);
    if (isCorrect) {
      const newCombo = combo + 1;
      setScore(s => s + 1);
      setCombo(newCombo);
      playCorrect();
      if (newCombo >= 3) {
        const bonus = Math.floor(newCombo / 3) * 5;
        setSpades(s => s + bonus);
        playCombo();
        showFeedback(`Correct! ${newCombo}x Combo +${bonus} spades`);
      } else {
        showFeedback('Correct!');
      }
      setTimeout(() => advance(true, score + 1), 1000);
    } else {
      setCombo(0);
      playWrong();
      showFeedback('Wrong!');
      setTimeout(() => advance(false, score), 1000);
    }
  };

  const submitAnagram = (ans) => {
    if (answered) return;
    clearTimer();
    const q = questions[qIndex];
    const norm = ans.trim().toUpperCase().replace(/[^A-Z]/g, '');
    const correct = q.answer.toUpperCase().replace(/[^A-Z]/g, '');
    const isCorrect = norm === correct;
    setAnswered(true);
    if (isCorrect) {
      const newCombo = combo + 1;
      setScore(s => s + 1);
      setCombo(newCombo);
      playCorrect();
      if (newCombo >= 3) {
        const bonus = Math.floor(newCombo / 3) * 5;
        setSpades(s => s + bonus);
        playCombo();
        showFeedback(`Correct! ${newCombo}x Combo +${bonus} spades`);
      } else {
        showFeedback('Correct!');
      }
      setTimeout(() => advance(true, score + 1), 1200);
    } else {
      setCombo(0);
      playWrong();
      showFeedback(`Wrong! Answer: ${q.answer}`);
      setTimeout(() => advance(false, score), 1400);
    }
  };


  const doHint = () => {
    if (spades < 30 || hintRevealed || answered) return;
    setSpades(s => s - 30);
    setHintRevealed(true);
    showFeedback('Hint revealed! -30 spades');
  };

  const doSkip = () => {
    if (spades < 50 || skipUsed || answered) return;
    setSpades(s => s - 50);
    setSkipUsed(true);
    clearTimer();
    setAnswered(true);
    showFeedback('Skipped! -50 spades');
    setTimeout(() => advance(false, score), 800);
  };

  const doShuffle = () => {
    if (spades < 20 || answered) return;
    const q = questions[qIndex];
    const letters = q.text.replace(/\s/g, '').toUpperCase().split('');
    setScrambled(shuffle(letters));
    setSpades(s => s - 20);
    showFeedback('Shuffled! -20 spades');
  };

  const shareResult = () => {
    const lvlName = MAIN_LEVELS[currentMainLevel].name;
    const stars = getStars(finalScore);
    const starStr = Array(3).fill(0).map((_, i) => i < stars ? '\u2B50' : '\u2606').join('');
    const text = `AniNoir ${mode} - ${lvlName} Stage ${currentStage + 1}: ${finalScore}/${QUESTIONS_PER_STAGE} ${starStr} #AniNoir`;
    if (navigator.share) {
      navigator.share({ title: 'AniNoir', text }).catch(()=>{});
    } else {
      navigator.clipboard?.writeText(text);
      showFeedback('Copied to clipboard!');
    }
  };


  // ─── PHASE 1: Main Levels ───────────────────────────────────
  if (phase === 'mainLevels') {
    return (
      <div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ color: T.rose }}>
            {mode === 'quiz' ? '🧠 ANIME QUIZ' : mode === 'anagram' ? '🔤 ANIME SCRAMBLER' : mode === 'emoji' ? '🎯 EMOJI QUIZ' : mode === 'shadow' ? '🕵️ SHADOW QUIZ' : '🖼️ ANIME FRAMES'}
          </div>
          <p style={{ fontSize: 13, color: T.textMid }}>5 main levels, 10 stages each. Pass each stage to unlock the next!</p>
          <p style={{ fontSize: 12, color: T.gold, marginTop: 6 }}>+5♠ per stage | +100♠ per level | +1000♠ for all!</p>
        </div>
        {MAIN_LEVELS.map((ml, idx) => {
          const unlocked = isMainLevelUnlocked(idx);
          const completed = getCompletedStages(idx);
          const stars = getMainLevelStars(idx);
          return (
            <button key={idx} className="level-card" onClick={() => { if (unlocked) { setSelectedMainLevel(idx); setPhase('stages'); } }}
              style={{ opacity: unlocked ? 1 : 0.5, cursor: unlocked ? 'pointer' : 'not-allowed' }}>
              <span className="level-icon">{unlocked ? ml.icon : '🔒'}</span>
              <div className="level-info">
                <div className="level-name">{ml.name}</div>
                <div className="level-meta">{unlocked ? ml.tagline : `Complete ${MAIN_LEVELS[idx-1]?.name || ''} to unlock`}</div>
                {unlocked && completed > 0 && (
                  <div className="level-best">{completed}/{STAGES_PER_LEVEL} stages · {stars}★</div>
                )}
              </div>
              <span style={{ color: T.textDim, fontSize: 20 }}>{unlocked ? '›' : ''}</span>
            </button>
          );
        })}
      </div>
    );
  }


  // ─── PHASE 2: Stages List ───────────────────────────────────
  if (phase === 'stages') {
    const ml = MAIN_LEVELS[selectedMainLevel];
    return (
      <div>
        <button className="btn btn-secondary" style={{ marginBottom: 14, fontSize: 13 }} onClick={() => setPhase('mainLevels')}>
          ← Back to Levels
        </button>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title" style={{ color: T.gold }}>{ml.icon} {ml.name}</div>
          <p style={{ fontSize: 12, color: T.textMid }}>{ml.tagline} · {ml.timeSeconds}s per question</p>
        </div>
        {Array.from({ length: STAGES_PER_LEVEL }, (_, stageIdx) => {
          const key = `${selectedMainLevel}_${stageIdx}`;
          const stageDone = stageProgress[key];
          const unlocked = isStageUnlocked(selectedMainLevel, stageIdx);
          const starsEarned = stageDone ? stageDone.stars : 0;
          const starDisplay = Array(3).fill(0).map((_, i) => i < starsEarned ? '\u2605' : '\u2606').join('');
          return (
            <button key={stageIdx} className="level-card" onClick={() => startStage(selectedMainLevel, stageIdx)}
              style={{ opacity: unlocked ? 1 : 0.5, cursor: unlocked ? 'pointer' : 'not-allowed' }}>
              <span className="level-icon" style={{ fontSize: 18 }}>{unlocked ? (stageDone ? '✓' : `${stageIdx + 1}`) : '🔒'}</span>
              <div className="level-info">
                <div className="level-name">Stage {stageIdx + 1}</div>
                <div className="level-meta">
                  {!unlocked ? 'Pass previous stage to unlock' : stageDone ? `${starDisplay}` : `${QUESTIONS_PER_STAGE} questions · ${ml.timeSeconds}s`}
                </div>
              </div>
              <span style={{ color: T.textDim, fontSize: 20 }}>{unlocked ? '›' : ''}</span>
            </button>
          );
        })}
      </div>
    );
  }


  // ─── PHASE 4: Result ────────────────────────────────────────
  if (phase === 'result') {
    const stars = getStars(finalScore);
    const passed = finalScore >= MIN_CORRECT_TO_PASS;
    const starDisplay = Array(3).fill(0).map((_, i) => i < stars ? '\u2605' : '\u2606').join(' ');
    const hasNext = currentStage < STAGES_PER_LEVEL - 1;
    return (
      <div className="result-screen">
        <span className="result-emoji">{passed ? '🏆' : '😓'}</span>
        <div className="result-title">{passed ? 'Stage Cleared!' : 'Stage Failed'}</div>
        <div className="result-sub">You scored {finalScore}/{QUESTIONS_PER_STAGE}</div>
        <div style={{ fontSize: 28, marginBottom: 16, letterSpacing: 4 }}>{starDisplay}</div>
        {passed && <div style={{ color: T.gold, fontSize: 14, marginBottom: 20 }}>+{STAGE_REWARD}♠ earned!</div>}
        <button className="share-btn" onClick={shareResult}>📤 Share Result</button>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={() => { setSelectedMainLevel(currentMainLevel); setPhase('stages'); }}>← Stages</button>
          {passed && hasNext && (
            <button className="btn btn-primary" onClick={() => startStage(currentMainLevel, currentStage + 1)}>Next Stage →</button>
          )}
          {passed && !hasNext && currentMainLevel < MAIN_LEVELS.length - 1 && (
            <button className="btn btn-primary" onClick={() => { setSelectedMainLevel(currentMainLevel + 1); setPhase('stages'); }}>Next Level →</button>
          )}
          {!passed && (
            <button className="btn btn-primary" onClick={() => startStage(currentMainLevel, currentStage)}>Retry</button>
          )}
        </div>
      </div>
    );
  }


  // ─── PHASE 3: Playing ───────────────────────────────────────
  const q = questions[qIndex];
  if (!q) return <div className="card"><p>Loading...</p></div>;
  const progress = ((qIndex) / questions.length) * 100;

  // Use custom render if provided
  if (renderQuestion) {
    return renderQuestion({
      q, qIndex, questions, progress, timeLeft, maxTime, score, combo,
      answered, selectedOption, correctOption, hintRevealed, currentMainLevel,
      currentStage, submitMCQ, submitAnagram, doHint, doSkip, doShuffle,
      scrambled, spades, skipUsed
    });
  }

  // Default MCQ / Anagram render
  return (
    <div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      <div className="quiz-header">
        <span style={{ fontSize: 12, color: T.textMid }}>{MAIN_LEVELS[currentMainLevel].name} · S{currentStage+1} · Q{qIndex+1}/{questions.length}</span>
        <CircularTimer timeLeft={timeLeft} maxTime={maxTime} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13 }}>✓ {score}</span>
          {combo >= 3 && <span className="combo-badge">🔥 {combo}x</span>}
        </div>
      </div>
      <div className="card">
        <div className="question-text">
          {q.type === 'anagram' ? '🔤 ANIME SCRAMBLE' : q.text}
        </div>
        {q.type === 'anagram' ? (
          <AnagramTiles scrambled={scrambled} onSolve={submitAnagram} hintRevealed={hintRevealed} hint={q.hint} answered={answered} correctAnswer={q.answer} />
        ) : (
          <div>
            {hintRevealed && q.hint && (
              <div style={{ marginBottom: 12, fontSize: 13, color: T.gold }}>💡 {q.hint}</div>
            )}
            {q.options.map((opt, idx) => {
              let cls = 'option-btn';
              if (answered) {
                if (idx === correctOption) cls += ' correct';
                else if (idx === selectedOption) cls += ' wrong';
              }
              return (
                <button key={`${qIndex}-${idx}`} className={cls} onClick={() => submitMCQ(idx)} disabled={answered}>{opt}</button>
              );
            })}
          </div>
        )}
      </div>
      <div className="power-btns">
        {q.type === 'anagram' && (
          <button className="power-btn" onClick={doShuffle} disabled={spades < 20 || answered}>
            🔀 SHUFFLE<br /><span style={{ color: T.gold }}>20♠</span>
          </button>
        )}
        {q.hint && (
          <button className="power-btn" onClick={doHint} disabled={spades < 30 || hintRevealed || answered}>
            💡 HINT<br /><span style={{ color: T.gold }}>30♠</span>
          </button>
        )}
        <button className="power-btn" onClick={doSkip} disabled={spades < 50 || skipUsed || answered}>
          ⏩ SKIP<br /><span style={{ color: T.gold }}>50♠</span>
        </button>
      </div>
    </div>
  );
}



// ─── Quiz Page (MCQ mode) ────────────────────────────────────
function QuizPage({ spades, setSpades, badges, setBadges, showFeedback, mcqOnly, anagramOnly, mode }) {
  const getQuestionPool = (mainLevelIdx, stageIdx) => {
    const levelNum = mainLevelIdx + 1;
    let pool = questionBank.filter(q => q.level === levelNum);
    if (mcqOnly) pool = pool.filter(q => q.type === 'mcq');
    if (anagramOnly) pool = pool.filter(q => q.type === 'anagram');
    // Assign fixed questions per stage (no repeats across stages)
    const start = stageIdx * QUESTIONS_PER_STAGE;
    const stageQuestions = pool.slice(start, start + QUESTIONS_PER_STAGE);
    return shuffle(stageQuestions);
  };

  return (
    <StageQuizPage
      mode={mode}
      getQuestionPool={getQuestionPool}
      spades={spades}
      setSpades={setSpades}
      showFeedback={showFeedback}
    />
  );
}



// ─── Emoji Quiz Page ─────────────────────────────────────────
function EmojiQuizPage({ spades, setSpades, badges, setBadges, showFeedback, unlockCost }) {
  const getQuestionPool = (mainLevelIdx, stageIdx) => {
    const levelNum = mainLevelIdx + 1;
    const pool = ALL_EMOJI_QUESTIONS.filter(q => q.level === levelNum);
    const start = stageIdx * QUESTIONS_PER_STAGE;
    const stageQuestions = pool.slice(start, start + QUESTIONS_PER_STAGE);
    return shuffle(stageQuestions).map(q => {
      const correctAnswer = q.options[q.correct];
      const shuffledOptions = shuffle([...q.options]);
      return { ...q, options: shuffledOptions, correct: shuffledOptions.indexOf(correctAnswer) };
    });
  };

  const renderQuestion = ({ q, qIndex, questions, progress, timeLeft, maxTime, score, combo, answered, selectedOption, correctOption, hintRevealed, currentMainLevel, currentStage, submitMCQ, doHint, doSkip, spades, skipUsed }) => (
    <div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      <div className="quiz-header">
        <span style={{ fontSize: 12, color: T.textMid }}>{MAIN_LEVELS[currentMainLevel].name} · S{currentStage+1} · Q{qIndex+1}/{questions.length}</span>
        <CircularTimer timeLeft={timeLeft} maxTime={maxTime} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13 }}>✓ {score}</span>
          {combo >= 3 && <span className="combo-badge">🔥 {combo}x</span>}
        </div>
      </div>
      <div className="card">
        <div className="question-text" style={{ fontSize: 36, textAlign: 'center', marginBottom: 24 }}>
          {q.text}
        </div>
        {hintRevealed && q.hint && (
          <div style={{ marginBottom: 12, fontSize: 13, color: T.gold, textAlign:'center' }}>💡 {q.hint}</div>
        )}
        {q.options.map((opt, idx) => {
          let cls = 'option-btn';
          if (answered) {
            if (idx === correctOption) cls += ' correct';
            else if (idx === selectedOption) cls += ' wrong';
          }
          return (
            <button key={`${qIndex}-${idx}`} className={cls} onClick={() => submitMCQ(idx)} disabled={answered}>{opt}</button>
          );
        })}
      </div>
      <div className="power-btns">
        {q.hint && (
          <button className="power-btn" onClick={doHint} disabled={spades < 30 || hintRevealed || answered}>
            💡 HINT<br /><span style={{ color: T.gold }}>30♠</span>
          </button>
        )}
        <button className="power-btn" onClick={doSkip} disabled={spades < 50 || skipUsed || answered}>
          ⏩ SKIP<br /><span style={{ color: T.gold }}>50♠</span>
        </button>
      </div>
    </div>
  );

  return (
    <StageQuizPage
      mode="emoji"
      getQuestionPool={getQuestionPool}
      spades={spades}
      setSpades={setSpades}
      showFeedback={showFeedback}
      renderQuestion={renderQuestion}
    />
  );
}



// ─── Shadow Game: Guess the Character ───────────────────────
const SHADOW_CHARACTERS = [
  { file: 'all-might.webp', name: 'All Might' },
  { file: 'alucard.webp', name: 'Alucard' },
  { file: 'anya-forger.webp', name: 'Anya Forger' },
  { file: 'ash.webp', name: 'Ash' },
  { file: 'bakugo.webp', name: 'Bakugo' },
  { file: 'chopper.webp', name: 'Chopper' },
  { file: 'denji.webp', name: 'Denji' },
  { file: 'edward.webp', name: 'Edward' },
  { file: 'emilia.webp', name: 'Emilia' },
  { file: 'eren.webp', name: 'Eren' },
  { file: 'frieren.webp', name: 'Frieren' },
  { file: 'gojo.webp', name: 'Gojo' },
  { file: 'goku.webp', name: 'Goku' },
  { file: 'gon.webp', name: 'Gon' },
  { file: 'hisoka.webp', name: 'Hisoka' },
  { file: 'ichigo.webp', name: 'Ichigo' },
  { file: 'inosuke.webp', name: 'Inosuke' },
  { file: 'itachi.webp', name: 'Itachi' },
  { file: 'jinwoo.webp', name: 'Jinwoo' },
  { file: 'jotato.webp', name: 'Jotaro' },
  { file: 'kakashi.webp', name: 'Kakashi' },
  { file: 'kaneki.webp', name: 'Kaneki' },
  { file: 'killua.webp', name: 'Killua' },
  { file: 'kitagawa.webp', name: 'Kitagawa' },
  { file: 'l.webp', name: 'L' },
  { file: 'levi.webp', name: 'Levi' },
  { file: 'light.webp', name: 'Light' },
  { file: 'loid-forger.webp', name: 'Loid Forger' },
  { file: 'luffy.webp', name: 'Luffy' },
  { file: 'makima.webp', name: 'Makima' },
  { file: 'midoriya.webp', name: 'Midoriya' },
  { file: 'mikasa.webp', name: 'Mikasa' },
  { file: 'nami.webp', name: 'Nami' },
  { file: 'naruto.webp', name: 'Naruto' },
  { file: 'natsu.webp', name: 'Natsu' },
  { file: 'nezuko.webp', name: 'Nezuko' },
  { file: 'pikachu.webp', name: 'Pikachu' },
  { file: 'power.webp', name: 'Power' },
  { file: 'rem.webp', name: 'Rem' },
  { file: 'rimuru.webp', name: 'Rimuru' },
  { file: 'ryuk.webp', name: 'Ryuk' },
  { file: 'sailor-moon.webp', name: 'Sailor Moon' },
  { file: 'sanji.webp', name: 'Sanji' },
  { file: 'sasuke.webp', name: 'Sasuke' },
  { file: 'tanjiro.webp', name: 'Tanjiro' },
  { file: 'todoroki.webp', name: 'Todoroki' },
  { file: 'yor-forger.webp', name: 'Yor Forger' },
  { file: 'zenitsu.webp', name: 'Zenitsu' },
  { file: 'zero-two.webp', name: 'Zero Two' },
  { file: 'zoro.webp', name: 'Zoro' },
];

function ShadowQuizPage({ spades, setSpades, showFeedback }) {
  const [phase, setPhase] = useState('intro'); // intro, playing, revealed, result
  const [characters, setCharacters] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [revealed, setRevealed] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const timerRef = useRef(null);

  // Start game
  const startGame = () => {
    const shuffled = shuffle([...SHADOW_CHARACTERS]);
    setCharacters(shuffled);
    setCurrentIdx(0);
    setLives(3);
    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    setRevealed(false);
    setInputValue('');
    setAnswered(false);
    setWasCorrect(false);
    setPhase('playing');
  };

  // Timer effect
  useEffect(() => {
    if (phase !== 'playing' || answered) return;
    if (timeLeft <= 0) {
      // Time's up - reveal the answer, count as wrong
      handleTimeUp();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, timeLeft, answered]);

  const handleTimeUp = () => {
    clearInterval(timerRef.current);
    setRevealed(true);
    setAnswered(true);
    setWasCorrect(false);
    const newLives = lives - 1;
    setLives(newLives);
    setStreak(0);
    playWrong();
    showFeedback("Time's up! -1 life");
    if (newLives <= 0) {
      setTimeout(() => setPhase('result'), 2000);
    }
  };

  const submitGuess = () => {
    if (answered || !inputValue.trim()) return;
    clearInterval(timerRef.current);
    const current = characters[currentIdx];
    const guess = inputValue.trim().toLowerCase().replace(/[^a-z ]/g, '');
    const answer = current.name.toLowerCase();
    const isCorrect = guess === answer;

    setAnswered(true);
    setRevealed(true);
    setWasCorrect(isCorrect);

    if (isCorrect) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      playCorrect();
      if (newScore % 5 === 0) {
        setSpades(s => s + 100);
        showFeedback(`Correct! +100 spades! (${newScore} correct)`);
      } else if (newStreak >= 3) {
        const bonus = Math.floor(newStreak / 3) * 5;
        setSpades(s => s + bonus);
        playCombo();
        showFeedback(`Correct! ${newStreak}x streak +${bonus} spades`);
      } else {
        showFeedback('Correct!');
      }
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setStreak(0);
      playWrong();
      showFeedback(`Wrong! The answer was: ${current.name}`);
      if (newLives <= 0) {
        setTimeout(() => setPhase('result'), 2000);
        return;
      }
    }
  };

  const nextCharacter = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= characters.length) {
      setPhase('result');
      return;
    }
    setCurrentIdx(nextIdx);
    setTimeLeft(30);
    setRevealed(false);
    setInputValue('');
    setAnswered(false);
    setWasCorrect(false);
  };

  const handleKeyPress = (letter) => {
    if (answered) return;
    const current = characters[currentIdx];
    const namePattern = current.name;
    // Calculate max input length (same as name length)
    if (inputValue.length < namePattern.length) {
      setInputValue(v => v + letter);
    }
  };

  const handleBackspace = () => {
    if (answered) return;
    setInputValue(v => v.slice(0, -1));
  };

  const handleSpace = () => {
    if (answered) return;
    const current = characters[currentIdx];
    if (inputValue.length < current.name.length) {
      setInputValue(v => v + ' ');
    }
  };

  // ─── INTRO SCREEN ─────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="shadow-lock">
        <div style={{ fontSize: 72, marginBottom: 16 }}>🕵️</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Guess the Character</div>
        <div style={{ fontSize: 14, color: T.textMid, marginBottom: 20, lineHeight: 1.7 }}>
          A blacked-out silhouette will appear.<br/>
          Guess the character name using the letter boxes!<br/>
          You have <span style={{ color: T.rose, fontWeight: 700 }}>30 seconds</span> before the answer reveals.<br/>
        </div>
        <div className="card" style={{ textAlign: 'left', marginBottom: 20 }}>
          <div className="card-title" style={{ color: T.rose }}>SURVIVAL RULES</div>
          <div style={{ fontSize: 13, color: T.textMid, lineHeight: 2 }}>
            <div>❤️ You have <strong style={{ color: T.text }}>3 lives</strong></div>
            <div>❌ Wrong answer or time up = <strong style={{ color: T.rose }}>-1 life</strong></div>
            <div>💀 Game over when lives reach 0</div>
            <div>🏆 Every 5 correct = <strong style={{ color: T.gold }}>+100 spades</strong></div>
            <div>🔥 3x streak = <strong style={{ color: T.gold }}>bonus spades</strong></div>
          </div>
        </div>
        <button className="btn btn-primary btn-full" onClick={startGame}>
          Start Game
        </button>
      </div>
    );
  }

  // ─── RESULT SCREEN ────────────────────────────────────────
  if (phase === 'result') {
    return (
      <div className="result-screen">
        <span className="result-emoji">💀</span>
        <div className="result-title">Game Over!</div>
        <div className="result-sub">You guessed {score} characters correctly</div>
        <div style={{ color: T.gold, fontSize: 14, marginBottom: 20 }}>
          Earned {Math.floor(score / 5) * 100} spades total
        </div>
        <button className="share-btn" onClick={() => {
          const text = `I guessed ${score} anime characters by their shadow in AniNoir! #AniNoir #GuessTheShadow`;
          if (navigator.share) navigator.share({ title: 'AniNoir Shadow Game', text }).catch(() => {});
          else { navigator.clipboard?.writeText(text); showFeedback('Copied!'); }
        }}>📤 Share Result</button>
        <button className="btn btn-primary btn-full" style={{ marginTop: 8 }} onClick={startGame}>
          Play Again
        </button>
        <button className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={() => setPhase('intro')}>
          ← Back
        </button>
      </div>
    );
  }

  // ─── PLAYING SCREEN ───────────────────────────────────────
  const current = characters[currentIdx];
  if (!current) return <div className="card"><p>Loading...</p></div>;
  const nameWords = current.name.split(' ');
  const KEYBOARD_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

  return (
    <div>
      {/* Header: lives, score, streak */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '0 4px' }}>
        <div className="survival-lives">
          {[...Array(3)].map((_, i) => <span key={i}>{i < lives ? '\u2764\uFE0F' : '\u{1F5A4}'}</span>)}
        </div>
        <div className="survival-stat" style={{ color: T.gold }}>🏆 {score}</div>
        <div className="survival-stat" style={{ color: T.teal }}>🔥 {streak}</div>
      </div>

      {/* Timer */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <CircularTimer timeLeft={timeLeft} maxTime={30} />
      </div>

      {/* Shadow Image */}
      <div className="card" style={{ textAlign: 'center', paddingBottom: 20 }}>
        <div className="card-title" style={{ color: T.violet }}>🕵️ GUESS THE CHARACTER</div>
        <div style={{
          margin: '16px auto', width: 200, height: 200, borderRadius: 16,
          overflow: 'hidden', border: `2px solid ${revealed ? T.success : T.border}`,
          position: 'relative', background: '#ffffff',
          transition: 'border-color 0.4s'
        }}>
          <img
            src={`/shadows/${current.file}`}
            alt="mystery character"
            style={{
              width: '100%', height: '100%', objectFit: 'contain',
              filter: revealed ? 'none' : 'brightness(0)',
              transition: 'filter 0.6s ease'
            }}
          />
        </div>

        {/* Letter Boxes */}
        <div style={{ marginTop: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: T.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Character Name
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {nameWords.map((word, wIdx) => (
              <div key={wIdx} style={{ display: 'flex', gap: 4 }}>
                {word.split('').map((char, cIdx) => {
                  // Calculate global position
                  let globalPos = 0;
                  for (let w = 0; w < wIdx; w++) globalPos += nameWords[w].length + 1; // +1 for space
                  globalPos += cIdx;
                  const typedChar = inputValue[globalPos] || '';
                  const isCorrectChar = revealed && wasCorrect;
                  const isWrongReveal = revealed && !wasCorrect;
                  return (
                    <div key={cIdx} style={{
                      width: 28, height: 36, borderRadius: 6,
                      border: `2px solid ${isCorrectChar ? T.success : isWrongReveal ? T.rose : typedChar ? T.violet : T.border}`,
                      background: isCorrectChar ? 'rgba(34,197,94,0.12)' : isWrongReveal ? 'rgba(244,63,94,0.08)' : T.surface,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700,
                      color: isCorrectChar ? T.success : isWrongReveal ? T.rose : T.text,
                      transition: 'all 0.2s'
                    }}>
                      {revealed && !wasCorrect ? char.toUpperCase() : typedChar.toUpperCase()}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Result feedback */}
        {answered && (
          <div style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color: wasCorrect ? T.success : T.rose }}>
            {wasCorrect ? '✓ Correct!' : `✗ Answer: ${current.name}`}
          </div>
        )}
      </div>

      {/* On-screen Keyboard */}
      {!answered && (
        <div style={{ marginTop: 12 }}>
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 4 }}>
              {row.split('').map(letter => (
                <button key={letter} onClick={() => handleKeyPress(letter.toLowerCase())}
                  style={{
                    width: 30, height: 38, borderRadius: 6,
                    border: `1px solid ${T.border}`, background: T.card,
                    color: T.text, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.1s'
                  }}>
                  {letter}
                </button>
              ))}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
            <button onClick={handleBackspace}
              style={{
                flex: 1, maxWidth: 80, height: 38, borderRadius: 6,
                border: `1px solid ${T.border}`, background: T.card,
                color: T.rose, fontSize: 12, fontWeight: 700,
                cursor: 'pointer'
              }}>⌫</button>
            <button onClick={handleSpace}
              style={{
                flex: 2, maxWidth: 140, height: 38, borderRadius: 6,
                border: `1px solid ${T.border}`, background: T.card,
                color: T.textMid, fontSize: 12, fontWeight: 600,
                cursor: 'pointer'
              }}>SPACE</button>
            <button onClick={submitGuess}
              style={{
                flex: 1, maxWidth: 80, height: 38, borderRadius: 6,
                border: 'none', background: T.rose,
                color: 'white', fontSize: 12, fontWeight: 700,
                cursor: 'pointer'
              }}>GO</button>
          </div>
        </div>
      )}

      {/* Next button after answer */}
      {answered && lives > 0 && (
        <button className="btn btn-primary btn-full" style={{ marginTop: 14 }} onClick={nextCharacter}>
          Next Character →
        </button>
      )}
    </div>
  );
}



// ─── Anime Frames Page ──────────────────────────────────────
function AnimeFramesPage({ spades, setSpades, showFeedback, unlockCost }) {
  const getQuestionPool = (mainLevelIdx, stageIdx) => {
    const levelNum = mainLevelIdx + 1;
    const pool = ANIME_FRAMES_QUESTIONS.filter(q => q.level === levelNum);
    const start = stageIdx * QUESTIONS_PER_STAGE;
    const stageQuestions = pool.slice(start, start + QUESTIONS_PER_STAGE);
    return shuffle(stageQuestions).map(q => {
      const correctAnswer = q.options[q.correct];
      const shuffledOptions = shuffle([...q.options]);
      return { ...q, options: shuffledOptions, correct: shuffledOptions.indexOf(correctAnswer) };
    });
  };

  const renderQuestion = ({ q, qIndex, questions, progress, timeLeft, maxTime, score, combo, answered, selectedOption, correctOption, hintRevealed, currentMainLevel, currentStage, submitMCQ, doHint, doSkip, spades, skipUsed }) => (
    <div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      <div className="quiz-header">
        <span style={{ fontSize: 12, color: T.textMid }}>{MAIN_LEVELS[currentMainLevel].name} · S{currentStage+1} · Q{qIndex+1}/{questions.length}</span>
        <CircularTimer timeLeft={timeLeft} maxTime={maxTime} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13 }}>✓ {score}</span>
          {combo >= 3 && <span className="combo-badge">🔥 {combo}x</span>}
        </div>
      </div>
      <div className="card">
        <div style={{ fontSize: 11, color: T.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>🖼️ SCENE DESCRIPTION</div>
        <div className="question-text" style={{ fontSize: 15, fontStyle: 'italic', color: T.text }}>
          "{q.text}"
        </div>
        {hintRevealed && q.hint && (
          <div style={{ marginBottom: 12, fontSize: 13, color: T.gold, textAlign:'center' }}>💡 {q.hint}</div>
        )}
        {q.options.map((opt, idx) => {
          let cls = 'option-btn';
          if (answered) {
            if (idx === correctOption) cls += ' correct';
            else if (idx === selectedOption) cls += ' wrong';
          }
          return (
            <button key={`${qIndex}-${idx}`} className={cls} onClick={() => submitMCQ(idx)} disabled={answered}>{opt}</button>
          );
        })}
      </div>
      <div className="power-btns">
        {q.hint && (
          <button className="power-btn" onClick={doHint} disabled={spades < 30 || hintRevealed || answered}>
            💡 HINT<br /><span style={{ color: T.gold }}>30♠</span>
          </button>
        )}
        <button className="power-btn" onClick={doSkip} disabled={spades < 50 || skipUsed || answered}>
          ⏩ SKIP<br /><span style={{ color: T.gold }}>50♠</span>
        </button>
      </div>
    </div>
  );

  return (
    <StageQuizPage
      mode="frames"
      getQuestionPool={getQuestionPool}
      spades={spades}
      setSpades={setSpades}
      showFeedback={showFeedback}
      renderQuestion={renderQuestion}
    />
  );
}



// ─── Survival Mode (UNCHANGED) ──────────────────────────────
function SurvivalPage({ spades, setSpades, showFeedback }) {
  const SURVIVAL_FREE_TRIALS = 5;
  const SURVIVAL_UNLOCK_COST = 1000;
  const [triesUsed, setTriesUsed] = useState(() => parseInt(localStorage.getItem('ani_survival_tries') || '0'));
  const [survivalUnlocked, setSurvivalUnlocked] = useState(() => localStorage.getItem('ani_survival_unlocked') === '1');
  const [phase, setPhase] = useState('intro');
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctOption, setCorrectOption] = useState(null);
  const [hintRevealed, setHintRevealed] = useState(false);

  const isLocked = !survivalUnlocked && triesUsed >= SURVIVAL_FREE_TRIALS;
  const freeTrialsLeft = Math.max(0, SURVIVAL_FREE_TRIALS - triesUsed);

  const unlockSurvival = () => {
    if (spades < SURVIVAL_UNLOCK_COST) { showFeedback(`Need ${SURVIVAL_UNLOCK_COST} spades to unlock Survival Mode!`); return; }
    setSpades(s => s - SURVIVAL_UNLOCK_COST);
    setSurvivalUnlocked(true);
    localStorage.setItem('ani_survival_unlocked', '1');
    showFeedback('Survival Mode unlocked permanently!');
  };

  const startGame = () => {
    if (isLocked) return;
    if (!survivalUnlocked) {
      const newTries = triesUsed + 1;
      setTriesUsed(newTries);
      localStorage.setItem('ani_survival_tries', String(newTries));
    }
    const allMcq = [...questionBank.filter(q => q.type === 'mcq'), ...ALL_EMOJI_QUESTIONS];
    setQuestions(shuffle(allMcq));
    setQIndex(0);
    setLives(3);
    setScore(0);
    setStreak(0);
    setAnswered(false);
    setSelectedOption(null);
    setCorrectOption(null);
    setHintRevealed(false);
    setPhase('playing');
  };

  const advance = () => {
    const nextIdx = qIndex + 1;
    if (nextIdx >= questions.length) { setPhase('result'); return; }
    setQIndex(nextIdx);
    setAnswered(false);
    setSelectedOption(null);
    setCorrectOption(null);
    setHintRevealed(false);
  };


  const submitAnswer = (optIdx) => {
    if (answered) return;
    const q = questions[qIndex];
    const isCorrect = optIdx === q.correct;
    setSelectedOption(optIdx);
    setCorrectOption(q.correct);
    setAnswered(true);

    if (isCorrect) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      playCorrect();
      if (newScore % 5 === 0) {
        setSpades(s => s + 100);
        showFeedback(`Correct! +100 spades (${newScore} streak!)`);
      } else {
        showFeedback(`Correct! Streak: ${newStreak}`);
      }
      setTimeout(advance, 1000);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setStreak(0);
      playWrong();
      if (newLives <= 0) {
        showFeedback('Game Over!');
        setTimeout(() => setPhase('result'), 1200);
      } else {
        showFeedback(`Wrong! ${newLives} lives left`);
        setTimeout(advance, 1200);
      }
    }
  };

  const doHint = () => {
    if (spades < 30 || hintRevealed || answered) return;
    setSpades(s => s - 30);
    setHintRevealed(true);
    showFeedback('Hint revealed! -30 spades');
  };


  if (phase === 'intro') {
    if (isLocked) return (
      <div className="shadow-lock">
        <div style={{ fontSize:72, marginBottom:16 }}>💀</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Survival Mode Locked</div>
        <div style={{ fontSize: 13, color: T.textMid, marginBottom: 20, lineHeight: 1.6 }}>
          You've used all {SURVIVAL_FREE_TRIALS} free trials!<br/>
          Unlock permanently with {SURVIVAL_UNLOCK_COST} spades to keep playing.
        </div>
        <div style={{ background: 'rgba(245,158,11,0.1)', border: `1px solid rgba(245,158,11,0.3)`, borderRadius: 14, padding: '12px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.gold }}>🔒 {SURVIVAL_UNLOCK_COST}♠</div>
          <div style={{ fontSize: 12, color: T.textMid }}>Permanent unlock · You have {spades}♠</div>
        </div>
        <button className="btn btn-primary" onClick={unlockSurvival} disabled={spades < SURVIVAL_UNLOCK_COST} style={{ width: '100%' }}>
          {spades >= SURVIVAL_UNLOCK_COST ? 'Unlock Survival Mode' : `Need ${SURVIVAL_UNLOCK_COST - spades} more spades`}
        </button>
      </div>
    );

    return (
      <div className="shadow-lock">
        <div style={{ fontSize:72, marginBottom:16 }}>💀</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Survival Mode</div>
        <div style={{ fontSize: 13, color: T.textMid, marginBottom: 20, lineHeight: 1.6 }}>
          Infinite quiz from ALL questions mixed.<br/>
          You have 3 lives. Wrong answer = lose 1 life.<br/>
          Game over at 0 lives. Every 5 correct = +100 spades!
        </div>
        {!survivalUnlocked && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.textMid }}>Free Trials</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: freeTrialsLeft <= 1 ? T.rose : T.gold }}>{freeTrialsLeft}/{SURVIVAL_FREE_TRIALS} left</span>
            </div>
            <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(freeTrialsLeft / SURVIVAL_FREE_TRIALS) * 100}%`, background: freeTrialsLeft <= 1 ? T.rose : `linear-gradient(90deg, ${T.gold}, ${T.teal})`, borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>
              {freeTrialsLeft > 0 ? `${freeTrialsLeft} free game${freeTrialsLeft > 1 ? 's' : ''} remaining.` : 'No free trials left!'}
            </div>
          </div>
        )}
        {survivalUnlocked && (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: `1px solid rgba(34,197,94,0.3)`, borderRadius: 14, padding: '10px 18px', marginBottom: 20, textAlign: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.success }}>Permanently Unlocked</span>
          </div>
        )}
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={startGame}>
          Start Survival
        </button>
      </div>
    );
  }


  if (phase === 'result') return (
    <div className="result-screen">
      <span className="result-emoji">💀</span>
      <div className="result-title">Game Over!</div>
      <div className="result-sub">You survived {score} questions</div>
      <div style={{ color: T.gold, fontSize: 14, marginBottom: 20 }}>
        Earned {Math.floor(score / 5) * 100} spades total
      </div>
      <button className="share-btn" onClick={() => {
        const text = `I survived ${score} questions in AniNoir Survival Mode! #AniNoir`;
        if (navigator.share) navigator.share({ title: 'AniNoir Survival', text }).catch(()=>{});
        else { navigator.clipboard?.writeText(text); showFeedback('Copied!'); }
      }}>Share Result</button>
      <button className="btn btn-primary btn-full" style={{ marginTop: 8 }} onClick={startGame}>
        Play Again
      </button>
    </div>
  );

  const q = questions[qIndex];
  if (!q) return <div className="card"><p>No more questions!</p></div>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, padding:'0 4px' }}>
        <div className="survival-lives">
          {[...Array(3)].map((_, i) => <span key={i}>{i < lives ? '\u2764\uFE0F' : '\u{1F5A4}'}</span>)}
        </div>
        <div className="survival-stat" style={{ color: T.gold }}>🏆 {score}</div>
        <div className="survival-stat" style={{ color: T.teal }}>🔥 {streak}</div>
      </div>
      <div className="card">
        <div className="question-text">{q.text}</div>
        {hintRevealed && q.hint && (
          <div style={{ marginBottom: 12, fontSize: 13, color: T.gold }}>💡 {q.hint}</div>
        )}
        {q.options.map((opt, idx) => {
          let cls = 'option-btn';
          if (answered) {
            if (idx === correctOption) cls += ' correct';
            else if (idx === selectedOption) cls += ' wrong';
          }
          return (
            <button key={`${qIndex}-${idx}`} className={cls} onClick={() => submitAnswer(idx)} disabled={answered}>{opt}</button>
          );
        })}
      </div>
      <div className="power-btns">
        {q.hint && (
          <button className="power-btn" onClick={doHint} disabled={spades < 30 || hintRevealed || answered}>
            💡 HINT<br /><span style={{ color: T.gold }}>30♠</span>
          </button>
        )}
      </div>
    </div>
  );
}



// ─── App Root ───────────────────────────────────────────────
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState('home');
  const [pageKey, setPageKey] = useState(0);
  const [spades, setSpades] = useState(() => parseInt(localStorage.getItem('ani_spades') || '100'));
  const [badges, setBadges] = useState(() => JSON.parse(localStorage.getItem('ani_badges') || '[]'));
  const [feedback, setFeedback] = useState('');
  const [spadesModal, setSpadesModal] = useState(false);
  const feedbackTimer = useRef(null);

  const showFeedback = (msg) => {
    setFeedback(msg);
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(''), 2200);
  };

  useEffect(() => { localStorage.setItem('ani_spades', spades); }, [spades]);
  useEffect(() => { localStorage.setItem('ani_badges', JSON.stringify(badges)); }, [badges]);

  useEffect(() => {
    if (!localStorage.getItem('ani_offline_shown')) {
      setTimeout(() => {
        showFeedback('Quizzes work offline! No internet needed.');
        localStorage.setItem('ani_offline_shown', '1');
      }, 2000);
    }
  }, []);

  const navigate = (id) => {
    playClick();
    setPage(id);
    setPageKey(k => k + 1);
    setSidebarOpen(false);
  };

  const pageTitle = NAV.find(n => n.id === page)?.label || 'AniNoir';
  const EMOJI_COST = 200;


  return (
    <>
      <style>{css}</style>
      <div className="app-shell">
        <div className="desktop-sidebar">
          <SidebarContent page={page} navigate={navigate} spades={spades} onSpadesClick={() => setSpadesModal(true)} />
        </div>

        <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <SidebarContent page={page} navigate={navigate} spades={spades} onSpadesClick={() => setSpadesModal(true)} />
        </div>

        <div className="main">
          <div className="topbar">
            <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <span className="topbar-title">{pageTitle}</span>
            <div className="topbar-chips">
              <span className="chip" onClick={() => setSpadesModal(true)}>♠ {spades}</span>
              <span className="chip">🏅 {badges.length}</span>
            </div>
          </div>

          <div className="page" key={pageKey}>
            <div className="page-enter">
              {page === 'home' && <HomePage navigate={navigate} dailyAnime={getDailyAnime()} dailyQuote={getDailyQuote()} />}
              {page === 'quiz' && <QuizPage spades={spades} setSpades={setSpades} badges={badges} setBadges={setBadges} showFeedback={showFeedback} mcqOnly={true} mode="quiz" />}
              {page === 'emoji' && <EmojiQuizPage spades={spades} setSpades={setSpades} badges={badges} setBadges={setBadges} showFeedback={showFeedback} unlockCost={EMOJI_COST} />}
              {page === 'anagram' && <QuizPage spades={spades} setSpades={setSpades} badges={badges} setBadges={setBadges} showFeedback={showFeedback} mcqOnly={false} anagramOnly={true} mode="anagram" />}
              {page === 'shadow' && <ShadowQuizPage spades={spades} setSpades={setSpades} showFeedback={showFeedback} />}
              {page === 'frames' && <AnimeFramesPage spades={spades} setSpades={setSpades} showFeedback={showFeedback} unlockCost={200} />}
              {page === 'survival' && <SurvivalPage spades={spades} setSpades={setSpades} showFeedback={showFeedback} />}
              {page === 'search' && <SearchPage showFeedback={showFeedback} />}
              {page === 'charsearch' && <CharacterSearchPage showFeedback={showFeedback} />}
              {page === 'watchlist' && <WatchlistPage showFeedback={showFeedback} />}
              {page === 'news' && <NewsPage />}
              {page === 'birthdays' && <BirthdaysPage />}
              {page === 'daily' && <DailyPage spades={spades} setSpades={setSpades} showFeedback={showFeedback} />}
              {page === 'about' && <AboutPage spades={spades} badges={badges} />}
            </div>
          </div>
        </div>

        {feedback && <div className="feedback-toast">{feedback}</div>}
        {spadesModal && <SpadesModal onClose={() => setSpadesModal(false)} />}
      </div>
    </>
  );
}



// ─── Home Page ───────────────────────────────────────────────
function LatestYouTubeCard() {
  const [video, setVideo] = useState(null);
  useEffect(() => {
    const RSS = 'https://api.rss2json.com/v1/api.json?rss_url=https://www.youtube.com/feeds/videos.xml?channel_id=UCxvnMryqeGfklJRwGM1r9eA&count=1';
    fetch(RSS).then(r=>r.json()).then(d=>{
      const v = d.items?.[0];
      if(v) setVideo({ title: v.title, link: v.link, thumb: v.thumbnail, date: new Date(v.pubDate).toLocaleDateString() });
    }).catch(()=>{});
  },[]);

  if (!video) return null;
  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      <div style={{ padding:'14px 16px 8px' }}>
        <div className="card-title" style={{ color: '#ff4444', marginBottom:8 }}>LATEST VIDEO</div>
      </div>
      <a href={video.link} target="_blank" rel="noopener noreferrer" className="yt-card" style={{ margin:'0 12px 12px', borderRadius:14 }}>
        <img src={video.thumb} alt="" className="yt-thumb" onError={e=>e.target.style.display='none'} />
        <div className="yt-info">
          <div className="yt-title">{video.title}</div>
          <div className="yt-sub">AnimeTMTalks · {video.date}</div>
        </div>
      </a>
    </div>
  );
}


function HomePage({ navigate, dailyAnime, dailyQuote }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return (
    <div>
      <div className="hero-banner">
        <div className="hero-greeting">{greeting}, Otaku!</div>
        <div className="hero-sub">Ready to test your anime knowledge?</div>
        <button className="btn btn-primary" style={{ marginTop: 14, borderRadius: 10 }} onClick={() => navigate('quiz')}>
          Start Quiz
        </button>
      </div>

      <LatestYouTubeCard />

      <div style={{ marginBottom: 6 }}>
        <div className="card-title" style={{ color: T.rose, padding: '0 2px 8px', fontSize: 11 }}>ANIME OF THE DAY</div>
        <div className="daily-anime-card">
          <img src={dailyAnime.image} alt={dailyAnime.title} className="daily-anime-img" onError={e=>{e.target.style.display='none';}} />
          <div className="daily-anime-overlay">
            <div className="daily-anime-title">{dailyAnime.title}</div>
            <div className="daily-anime-meta">⭐ {dailyAnime.rating} · {dailyAnime.genre}</div>
          </div>
        </div>
        <div className="card" style={{ marginTop: 0 }}>
          <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6 }}>{dailyAnime.desc}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ color: T.gold }}>QUOTE OF THE DAY</div>
        <div className="quote-card">
          <div className="quote-text">"{dailyQuote.text}"</div>
          <div className="quote-attr">— {dailyQuote.char} · {dailyQuote.anime}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ color: T.teal }}>QUICK PLAY</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['quiz','🧠','Quiz'],['emoji','🎯','Emoji'],['anagram','🔤','Scramble'],['frames','🖼️','Frames'],['shadow','🕵️','Shadow'],['survival','💀','Survive'],['daily','📅','Daily']].map(([id,ico,lbl])=>(
            <button key={id} className="btn btn-secondary" style={{ flex:'1 0 28%', flexDirection:'column', gap:4, padding:'10px 4px', fontSize:10 }} onClick={()=>navigate(id)}>
              <span style={{ fontSize: 20 }}>{ico}</span><span>{lbl}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}



// ─── Search Page ─────────────────────────────────────────────
const STREAMING_MAP = { 'Crunchyroll':'Crunchyroll','Netflix':'Netflix','Funimation':'Funimation','Amazon':'Prime Video','Hulu':'Hulu','Disney':'Disney+','HIDIVE':'HIDIVE' };

function SearchPage({ showFeedback }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [watchlist, setWatchlist] = useState(getWatchlist);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true); setResult(null); setNotFound(false);
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1&sfw=true`);
      const data = await res.json();
      if (!data.data?.length) { setNotFound(true); setLoading(false); return; }
      const a = data.data[0];
      const tl = (a.title||'').toLowerCase(), tel = (a.title_english||'').toLowerCase(), ql = q.toLowerCase();
      const sim = (s,t) => s.includes(t)||t.includes(s)||(t.split(' ').filter(w=>w.length>2).some(w=>s.includes(w)));
      if (!sim(tl,ql) && !sim(tel,ql)) { setNotFound(true); setLoading(false); return; }
      const streamRes = await fetch(`https://api.jikan.moe/v4/anime/${a.mal_id}/streaming`);
      let streamLinks = [];
      try { const sd = await streamRes.json(); streamLinks = (sd.data||[]).map(s=>s.name).slice(0,6); } catch {}
      setResult({
        title: a.title, titleEn: a.title_english,
        image: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url,
        synopsis: a.synopsis, score: a.score, episodes: a.episodes,
        status: a.status, year: a.year,
        studios: a.studios?.map(s=>s.name).join(', ')||'Unknown',
        genres: a.genres?.map(g=>g.name).join(', ')||'—',
        rating: a.rating, streaming: streamLinks, malId: a.mal_id,
      });
    } catch { showFeedback('Network error. Try again.'); }
    finally { setLoading(false); }
  };

  const addToWatchlist = () => {
    if (!result) return;
    const wl = getWatchlist();
    if (wl.find(x => x.malId === result.malId)) { showFeedback('Already in watchlist!'); return; }
    const item = { malId: result.malId, title: result.titleEn||result.title, image: result.image, genres: result.genres, score: result.score };
    const updated = [item, ...wl];
    saveWatchlist(updated);
    setWatchlist(updated);
    showFeedback('Added to Watchlist!');
  };

  const inWatchlist = result && watchlist.find(x => x.malId === result.malId);


  return (
    <div>
      <div className="search-input-wrap">
        <input className="search-input" value={query} onChange={e=>setQuery(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&search()} placeholder="Search anime name..." autoComplete="off" />
        <button className="btn btn-primary" onClick={search} disabled={loading||!query.trim()}>{loading?'...':'🔍'}</button>
      </div>

      {loading && <div className="card"><div className="skeleton" style={{height:20,width:'60%',marginBottom:8}}/><div className="skeleton" style={{height:14,width:'90%',marginBottom:6}}/><div className="skeleton" style={{height:14,width:'70%'}}/></div>}

      {notFound && !loading && (
        <div className="card" style={{textAlign:'center',padding:'30px 20px'}}>
          <div style={{fontSize:40,marginBottom:12}}>🔎</div>
          <div style={{fontSize:16,fontWeight:700,color:T.rose,marginBottom:8}}>Anime Not Found</div>
          <div style={{fontSize:13,color:T.textMid}}>Incorrect anime name. Please type correctly and try again.</div>
        </div>
      )}

      {result && !loading && (
        <>
          <div className="card">
            <div className="anime-result">
              {result.image && <img src={result.image} alt={result.title} className="anime-poster" onError={e=>e.target.style.display='none'} />}
              <div className="anime-info">
                <div className="anime-title">{result.titleEn||result.title}</div>
                {result.titleEn && result.title!==result.titleEn && <div style={{fontSize:11,color:T.textDim,marginBottom:4}}>{result.title}</div>}
                <div className="anime-meta">
                  {result.score && <span className="meta-badge">⭐ {result.score}</span>}
                  {result.episodes && <span className="meta-badge">📺 {result.episodes} eps</span>}
                  {result.year && <span className="meta-badge">📅 {result.year}</span>}
                </div>
                <div style={{fontSize:12,color:T.textMid}}>{result.status}</div>
              </div>
            </div>
            {result.genres && <div style={{marginTop:12,fontSize:12,color:T.textMid}}>🎭 {result.genres}</div>}
            {result.studios && <div style={{marginTop:4,fontSize:12,color:T.textMid}}>🎬 {result.studios}</div>}
            <button className="btn btn-secondary btn-full" style={{ marginTop: 12 }} onClick={addToWatchlist} disabled={!!inWatchlist}>
              {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            </button>
          </div>

          {result.synopsis && (
            <div className="card">
              <div className="card-title" style={{color:T.violet}}>SYNOPSIS</div>
              <p className="anime-synopsis">{result.synopsis.slice(0,300)}{result.synopsis.length>300?'...':''}</p>
            </div>
          )}

          <div className="card">
            <div className="card-title" style={{color:T.teal}}>WHERE TO WATCH</div>
            {result.streaming?.length ? (
              <div>{result.streaming.map((s,i)=><span key={i} className="streaming-tag">{STREAMING_MAP[s]||s}</span>)}</div>
            ) : (
              <div style={{fontSize:13,color:T.textMid}}>
                Check <a href={`https://www.crunchyroll.com/search?q=${encodeURIComponent(result.title)}`} target="_blank" rel="noopener noreferrer" style={{color:T.teal}}>Crunchyroll</a> or <a href={`https://www.netflix.com/search?q=${encodeURIComponent(result.title)}`} target="_blank" rel="noopener noreferrer" style={{color:T.rose}}>Netflix</a>.
              </div>
            )}
          </div>

          <a href={`https://myanimelist.net/anime/${result.malId}`} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
            <div className="card" style={{textAlign:'center',color:T.textMid,fontSize:13}}>View full details on MyAnimeList</div>
          </a>
        </>
      )}
    </div>
  );
}



// ─── Watchlist Page ──────────────────────────────────────────
function WatchlistPage({ showFeedback }) {
  const [watchlist, setWatchlist] = useState(getWatchlist);

  const remove = (malId) => {
    const updated = watchlist.filter(x => x.malId !== malId);
    saveWatchlist(updated);
    setWatchlist(updated);
    showFeedback('Removed from watchlist');
  };

  if (!watchlist.length) return (
    <div className="card" style={{textAlign:'center',padding:'40px 20px'}}>
      <div style={{fontSize:48,marginBottom:12}}>📋</div>
      <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Watchlist Empty</div>
      <div style={{fontSize:13,color:T.textMid}}>Search for anime and tap "Add to Watchlist" to save them here.</div>
    </div>
  );

  return (
    <div>
      <div className="card">
        <div className="card-title" style={{color:T.teal}}>MY WATCHLIST · {watchlist.length} anime</div>
        {watchlist.map((item, i) => (
          <div key={i} className="watchlist-item">
            {item.image && <img src={item.image} alt={item.title} className="watchlist-poster" onError={e=>e.target.style.display='none'} />}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,lineHeight:1.3}}>{item.title}</div>
              {item.genres && <div style={{fontSize:11,color:T.textMid,marginTop:3}}>{item.genres.split(',').slice(0,2).join(', ')}</div>}
            </div>
            <button onClick={()=>remove(item.malId)} style={{background:'none',border:`1px solid ${T.border}`,borderRadius:8,padding:'4px 8px',fontSize:12,color:T.textDim,flexShrink:0}}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}



// ─── News Page ───────────────────────────────────────────────
function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://cr-news-api-service.prd.crunchyrollsvc.com/v1/en-US/rss');
      const data = await res.json();
      if (data.items?.length) {
        setNews(data.items.slice(0,15).map(item => ({
          title: item.title, link: item.link,
          desc: item.description?.replace(/<[^>]*>/g,'').slice(0,120)+'...',
          image: item.thumbnail || item.enclosure?.link || '',
          date: new Date(item.pubDate).toLocaleDateString(),
        })));
      }
    } catch { setNews([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNews(); }, []);

  return (
    <div>
      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div className="card-title" style={{color:T.teal,marginBottom:0}}>ANIME NEWS</div>
          <button className="btn btn-secondary" style={{padding:'6px 14px',fontSize:12}} onClick={fetchNews} disabled={loading}>{loading?'Loading...':'Refresh'}</button>
        </div>
        {loading && [1,2,3,4].map(i=>(
          <div key={i} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:`1px solid ${T.border}`}}>
            <div className="skeleton" style={{width:72,height:52,borderRadius:8,flexShrink:0}}/>
            <div style={{flex:1}}><div className="skeleton" style={{height:13,marginBottom:6}}/><div className="skeleton" style={{height:11,width:'80%'}}/></div>
          </div>
        ))}
        {!loading && news.length===0 && <p style={{color:T.textMid,fontSize:13}}>No news available right now.</p>}
        {!loading && news.map((item,i)=>(
          <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="news-item">
            {item.image ? (
              <img src={item.image} alt="" className="news-thumb" onError={e=>{e.target.onerror=null;e.target.style.display='none';}}/>
            ) : (
              <div className="news-thumb" style={{display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,background:T.surface,border:`1px solid ${T.border}`}}>📰</div>
            )}
            <div className="news-text">
              <div className="news-title">{item.title}</div>
              <div className="news-desc">{item.desc}</div>
              <div style={{fontSize:10,color:T.textDim,marginTop:3}}>{item.date}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}



// ─── Birthdays Page (Week View) ──────────────────────────────
function BirthdaysPage() {
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekStart = (offset = 0) => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() + offset * 7);
    return monday;
  };

  const weekStart = getWeekStart(weekOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const formatDate = (d) => `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
  const weekLabel = `${formatDate(weekStart)} – ${formatDate(weekEnd)}`;

  const thisWeekBirthdays = CHARACTER_BIRTHDAYS.filter(c => {
    const bday = new Date(weekStart.getFullYear(), c.month - 1, c.day);
    return bday >= weekStart && bday <= weekEnd;
  }).sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
  });

  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const todayBirthdays = CHARACTER_BIRTHDAYS.filter(c => c.month === todayMonth && c.day === todayDay);

  const getDayName = (month, day) => {
    const d = new Date(weekStart.getFullYear(), month - 1, day);
    return DAYS_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1];
  };


  return (
    <div className="page-enter">
      {weekOffset === 0 && todayBirthdays.length > 0 && (
        <div className="card" style={{ background: 'linear-gradient(135deg,rgba(244,63,94,0.15),rgba(245,158,11,0.15))', border: `1px solid rgba(244,63,94,0.3)`, marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.rose, marginBottom: 8 }}>TODAY'S BIRTHDAYS!</div>
          {todayBirthdays.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>🎂</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
              <span style={{ fontSize: 11, color: T.textMid }}>({c.anime})</span>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-title" style={{ color: T.rose, marginBottom: 8 }}>ANIME BIRTHDAYS</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => setWeekOffset(w => w - 1)}>Prev</button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{weekLabel}</div>
            <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>
              {weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Next Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} weeks ${weekOffset > 0 ? 'ahead' : 'ago'}`}
            </div>
          </div>
          <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => setWeekOffset(w => w + 1)}>Next</button>
        </div>
        {weekOffset !== 0 && (
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 10, padding: '8px', fontSize: 12 }} onClick={() => setWeekOffset(0)}>Back to This Week</button>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
          {MONTHS_SHORT.map((m, idx) => {
            const now = new Date();
            const firstOfMonth = new Date(now.getFullYear(), idx, 1);
            const currentWeekStart = getWeekStart(0);
            const diffDays = Math.round((firstOfMonth - currentWeekStart) / (1000 * 60 * 60 * 24));
            const targetOffset = Math.round(diffDays / 7);
            const isCurrentMonth = now.getMonth() === idx;
            return (
              <button key={idx} onClick={() => setWeekOffset(targetOffset)}
                style={{ flex: '1 0 22%', padding: '6px 2px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: `1px solid ${isCurrentMonth ? T.rose : T.border}`, background: isCurrentMonth ? 'rgba(244,63,94,0.12)' : T.surface, color: isCurrentMonth ? T.rose : T.textMid, cursor: 'pointer' }}>
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div className="card" style={{ flex: 1, textAlign: 'center', padding: '12px 8px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.rose }}>{thisWeekBirthdays.length}</div>
          <div style={{ fontSize: 11, color: T.textMid }}>This Week</div>
        </div>
      </div>


      {thisWeekBirthdays.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎂</div>
          <div style={{ fontSize: 14, color: T.textMid }}>No birthdays this week!</div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>Try checking another week.</div>
        </div>
      ) : (
        thisWeekBirthdays.map((char, i) => {
          const isToday = char.month === todayMonth && char.day === todayDay;
          return (
            <div key={i} className="card" style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              border: isToday ? `1.5px solid ${T.rose}` : undefined,
              background: isToday ? 'rgba(244,63,94,0.06)' : undefined,
            }}>
              <div style={{
                fontSize: 28, width: 44, textAlign: 'center',
                background: isToday ? T.roseGlow : T.goldGlow,
                borderRadius: 12, padding: '8px 0'
              }}>
                {isToday ? '🎉' : '🎂'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {char.name}
                  {isToday && <span style={{ marginLeft: 6, fontSize: 10, color: T.rose, fontWeight: 800 }}>TODAY!</span>}
                </div>
                <div style={{ fontSize: 12, color: T.textMid }}>{char.anime}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>{MONTHS_SHORT[char.month - 1]} {char.day}</div>
                <div style={{ fontSize: 10, color: T.textDim }}>{getDayName(char.month, char.day)}</div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}



// ─── Daily Challenge Page ────────────────────────────────────
function DailyPage({ spades, setSpades, showFeedback }) {
  const today = new Date().toDateString();
  const [completed, setCompleted] = useState(() => localStorage.getItem('ani_daily') === today);
  const [question] = useState(() => {
    const stored = localStorage.getItem('ani_daily_q');
    if (stored && localStorage.getItem('ani_daily_date') === today) return JSON.parse(stored);
    const pool = questionBank.filter(q => q.level >= 2 && q.level <= 4);
    const q = { ...pool[Math.floor(Math.random() * pool.length)] };
    localStorage.setItem('ani_daily_q', JSON.stringify(q));
    localStorage.setItem('ani_daily_date', today);
    return q;
  });
  const [scrambledLetters, setScrambledLetters] = useState(() => {
    if (question?.type === 'anagram') return shuffle(question.text.replace(/\s/g,'').toUpperCase().split(''));
    return [];
  });
  const [input, setInput] = useState('');
  const [answered, setAnswered] = useState(completed);
  const [selectedOpt, setSelectedOpt] = useState(null);

  const submit = (ans) => {
    if (answered || !question) return;
    let correct = false;
    if (question.type === 'mcq') { correct = ans === question.correct; }
    else {
      const norm = (typeof ans === 'string' ? ans : input).trim().toUpperCase().replace(/[^A-Z]/g,'');
      correct = norm === question.answer.toUpperCase().replace(/[^A-Z]/g,'');
    }
    setAnswered(true);
    if (question.type === 'mcq') setSelectedOpt(ans);
    if (correct) {
      setSpades(s => s + 30);
      setCompleted(true);
      localStorage.setItem('ani_daily', today);
      playCorrect();
      showFeedback('Daily complete! +30 spades');
    } else {
      playWrong();
      showFeedback('Wrong! Come back tomorrow.');
    }
  };

  return (
    <div>
      <div className="hero-banner" style={{background:'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(139,92,246,0.12))',borderColor:'rgba(245,158,11,0.25)'}}>
        <div style={{fontSize:16,fontWeight:700,color:T.gold}}>Daily Challenge</div>
        <div style={{fontSize:13,color:T.textMid,marginTop:4}}>
          {completed ? 'Completed today! Come back tomorrow.' : 'Answer correctly for +30 spades'}
        </div>
      </div>

      {question && (
        <div className="card">
          <div className="card-title" style={{color:T.violet}}>
            {question.type==='mcq'?'QUESTION':'ANIME SCRAMBLE'}
          </div>
          <div className="question-text" style={{fontSize:16}}>
            {question.type==='mcq'?question.text:'🔤 ANIME SCRAMBLE'}
          </div>
          {question.type === 'mcq' ? (
            <div>
              {question.options?.map((opt,idx) => {
                let cls = 'option-btn';
                if (answered) { if(idx===question.correct) cls+=' correct'; else if(idx===selectedOpt) cls+=' wrong'; }
                return <button key={idx} className={cls} onClick={()=>submit(idx)} disabled={answered}>{opt}</button>;
              })}
            </div>
          ) : (
            <AnagramTiles scrambled={scrambledLetters} onSolve={(ans) => submit(ans)} hintRevealed={false} hint={null} answered={answered} correctAnswer={question.answer} />
          )}
        </div>
      )}
    </div>
  );
}



// ─── About Page ──────────────────────────────────────────────
function AboutPage({ spades, badges }) {
  const lb = getLeaderboard();
  const lbEntries = Object.entries(lb);
  const modeLabel = (k) => k.startsWith('quiz') ? 'Quiz' : k.startsWith('anagram') ? 'Scrambler' : k.startsWith('emoji') ? 'Emoji' : k.startsWith('frames') ? 'Frames' : 'Shadow';
  const levelLabel = (k) => { const i = parseInt(k.split('_').pop()); return levels[i]?.name || `L${i+1}`; };

  return (
    <div>
      <div className="hero-banner">
        <div style={{fontSize:48,textAlign:'center',marginBottom:8}}>🎴</div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:18,fontWeight:800}}>About AniNoir</div>
          <div style={{fontSize:13,color:T.textMid}}>Your Anime Trivia Companion</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{color:T.gold}}>STATS</div>
        <div className="stat-row"><span className="stat-label">Spades Balance</span><span className="stat-value" style={{color:T.gold}}>{spades}</span></div>
        <div className="stat-row"><span className="stat-label">Badges Earned</span><span className="stat-value">{badges.length}</span></div>
        <div className="stat-row"><span className="stat-label">Daily Streak</span><span className="stat-value">{localStorage.getItem('ani_daily')===new Date().toDateString()?'Active':'\u2014'}</span></div>
        <div className="stat-row"><span className="stat-label">Watchlist</span><span className="stat-value">{getWatchlist().length} anime</span></div>
      </div>

      {lbEntries.length > 0 && (
        <div className="card">
          <div className="card-title" style={{color:T.teal}}>PERSONAL BESTS</div>
          {lbEntries.map(([key, val]) => (
            <div key={key} className="stat-row">
              <span className="stat-label">{modeLabel(key)} · {levelLabel(key)}</span>
              <span className="stat-value" style={{color:T.gold}}>{val.score}/{val.total}</span>
            </div>
          ))}
        </div>
      )}

      {badges.length > 0 && (
        <div className="card">
          <div className="card-title" style={{color:T.violet}}>BADGES</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {badges.map((b,i)=>(
              <span key={i} style={{background:T.violetGlow,border:`1px solid ${T.violet}`,borderRadius:8,padding:'4px 12px',fontSize:12,color:T.violet}}>
                {b.replace(/_/g,' ')}
              </span>
            ))}
          </div>
        </div>
      )}


      <div className="card" style={{ background:'linear-gradient(135deg,rgba(244,63,94,0.12),rgba(139,92,246,0.15))', border:'1px solid rgba(244,63,94,0.25)' }}>
        <div className="card-title" style={{color:T.rose}}>ABOUT ANI-NOIR</div>
        <p style={{fontSize:13,color:T.text,lineHeight:1.8,marginBottom:12}}>
          <strong>AniNoir</strong> — The ultimate anime trivia & discovery app for true otakus!
        </p>
        <p style={{fontSize:13,color:T.textMid,lineHeight:1.8,marginBottom:12}}>
          Test your anime knowledge across multiple game modes: classic quizzes, emoji challenges, anagram scramblers, shadow quizzes, anime frame guessing, and survival mode. Level up, earn spades, collect badges, and climb the leaderboard!
        </p>
        <p style={{fontSize:13,color:T.textMid,lineHeight:1.8,marginBottom:12}}>
          Features: 5 main levels x 10 stages · 6+ game modes · Daily challenges · Anime search & character lookup · Personalized watchlist · Birthday calendar · News feed
        </p>
        <p style={{fontSize:13,color:T.textMid,lineHeight:1.8,marginBottom:12}}>
          Built with love by <strong>Mobarak</strong> — anime enthusiast, developer, and content creator. AniNoir is a love letter to the anime community. More features coming soon!
        </p>
        <p style={{fontSize:11,color:T.textMid,lineHeight:1.6}}>
          Version 2.0 · Made with React + Vite · PWA Enabled · 10-Stage Progression System
        </p>
      </div>

      <div style={{ display:'flex', flexDirection:'row', gap:10 }}>
        <a href="https://youtube.com/@animetmtalks" target="_blank" rel="noopener noreferrer" className="sidebar-footer-card yt" style={{ textDecoration:'none', color:'white', flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            <div>
              <div className="sidebar-footer-card-title">AnimeTMTalks</div>
              <div className="sidebar-footer-card-sub">YouTube</div>
            </div>
          </div>
        </a>
        <a href="https://www.instagram.com/mobarak_sekh_" target="_blank" rel="noopener noreferrer" className="sidebar-footer-card ig" style={{ textDecoration:'none', color:'white', flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            <div>
              <div className="sidebar-footer-card-title">@AniNoir</div>
              <div className="sidebar-footer-card-sub">Instagram</div>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}



// ─── Character Search Page ───────────────────────────────────
function CharacterSearchPage({ showFeedback }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true); setResults([]); setNotFound(false);
    try {
      const res = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      if (!data.data?.length) { setNotFound(true); setLoading(false); return; }
      setResults(data.data.map(c => ({
        id: c.mal_id,
        name: c.name,
        nameKanji: c.name_kanji,
        image: c.images?.jpg?.image_url,
        favorites: c.favorites,
        about: c.about?.slice(0, 200) || '',
      })));
    } catch { showFeedback('Network error. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="search-input-wrap">
        <input className="search-input" value={query} onChange={e=>setQuery(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&search()} placeholder="Search character name..." autoComplete="off" />
        <button className="btn btn-primary" onClick={search} disabled={loading||!query.trim()}>{loading?'...':'🔍'}</button>
      </div>

      {loading && <div className="card"><div className="skeleton" style={{height:20,width:'60%',marginBottom:8}}/><div className="skeleton" style={{height:14,width:'90%',marginBottom:6}}/><div className="skeleton" style={{height:14,width:'70%'}}/></div>}

      {notFound && !loading && (
        <div className="card" style={{textAlign:'center',padding:'30px 20px'}}>
          <div style={{fontSize:40,marginBottom:12}}>🔎</div>
          <div style={{fontSize:16,fontWeight:700,color:T.rose,marginBottom:8}}>Character Not Found</div>
          <div style={{fontSize:13,color:T.textMid}}>No characters matched your search. Try a different name.</div>
        </div>
      )}

      {!loading && results.map((char) => (
        <div key={char.id} className="card" style={{ marginBottom: 10 }}>
          <div className="anime-result">
            {char.image && <img src={char.image} alt={char.name} className="anime-poster" style={{ width: 64, height: 90, borderRadius: 10 }} onError={e=>e.target.style.display='none'} />}
            <div className="anime-info">
              <div className="anime-title">{char.name}</div>
              {char.nameKanji && <div style={{fontSize:11,color:T.textDim,marginBottom:4}}>{char.nameKanji}</div>}
              <div className="anime-meta">
                {char.favorites > 0 && <span className="meta-badge">❤️ {char.favorites.toLocaleString()} favorites</span>}
              </div>
            </div>
          </div>
          <a href={`https://myanimelist.net/character/${char.id}`} target="_blank" rel="noopener noreferrer"
            style={{ display:'block', textAlign:'center', fontSize:12, color:T.teal, marginTop:10, textDecoration:'none' }}>
            View full profile on MAL
          </a>
        </div>
      ))}
    </div>
  );
}
