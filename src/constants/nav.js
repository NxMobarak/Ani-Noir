// ─── NAV ────────────────────────────────────────────────────
const NAV = [
  { id: 'home', icon: '🏠', label: 'Home', path: '/' },
  { id: 'quiz', icon: '🧠', label: 'Anime Quiz', path: '/quiz' },
  { id: 'anagram', icon: '🔤', label: 'Word Ninja', path: '/anagram' },
  { id: 'emoji', icon: '🎯', label: 'Emoji Wars', path: '/emoji' },
  { id: 'shadow', icon: '🕵️', label: 'Anime Shadow', path: '/shadow' },
  { id: 'frames', icon: '🖼️', label: 'Anime Moments', path: '/frames' },
  { id: 'opening', icon: '🎵', label: 'Opening Challenge', comingSoon: true, path: '/opening' },
  { id: 'ending', icon: '🎶', label: 'Ending Challenge', comingSoon: true, path: '/ending' },
  { id: 'sceneguess', icon: '🎬', label: 'Frame Guess', comingSoon: true, path: '/sceneguess' },
  { id: 'dialogue', icon: '💬', label: 'Dialogue Clash', comingSoon: true, path: '/dialogue' },
  { id: 'survival', icon: '💀', label: 'Survival Mode', path: '/survival' },
  { id: 'daily', icon: '📅', label: 'Daily Challenge', path: '/daily' },
  { id: 'search', icon: '🔍', label: 'Anime Search', path: '/search' },
  { id: 'charsearch', icon: '👤', label: 'Character Search', path: '/charsearch' },
  { id: 'watchlist', icon: '📋', label: 'Watchlist', path: '/watchlist' },
  { id: 'news', icon: '📰', label: 'News', path: '/news' },
  { id: 'birthdays', icon: '🎂', label: 'Birthdays', path: '/birthdays' },
  { id: 'settings', icon: '⚙️', label: 'Settings', path: '/settings' },
  { id: 'about', icon: 'ℹ️', label: 'About', path: '/about' },
];

export default NAV;
