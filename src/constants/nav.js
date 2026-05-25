// ─── NAV ────────────────────────────────────────────────────
const NAV = [
  { id: 'home', icon: '🏠', label: 'Home', path: '/' },
  { id: 'quiz', icon: '🧠', label: 'Quiz', path: '/quiz' },
  { id: 'anagram', icon: '🔤', label: 'Anime Scrambler', path: '/anagram' },
  { id: 'emoji', icon: '🎯', label: 'Emoji Quiz', path: '/emoji' },
  { id: 'shadow', icon: '🕵️', label: 'Guess Shadow', path: '/shadow' },
  { id: 'frames', icon: '🖼️', label: 'Anime Frames', path: '/frames' },
  { id: 'opening', icon: '🎵', label: 'Opening Challenge', comingSoon: true, path: '/opening' },
  { id: 'ending', icon: '🎶', label: 'Ending Challenge', comingSoon: true, path: '/ending' },
  { id: 'sceneguess', icon: '🎬', label: 'Guess the Scene', comingSoon: true, path: '/sceneguess' },
  { id: 'dialogue', icon: '💬', label: 'Dialogue Challenge', comingSoon: true, path: '/dialogue' },
  { id: 'survival', icon: '💀', label: 'Survival', path: '/survival' },
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
